import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:pawheal/config/env_config.dart';
import 'package:pawheal/features/nearby_help/nearby_clinic_model.dart';
import 'package:pawheal/shared/widgets/app_cards.dart';
import 'package:url_launcher/url_launcher.dart';

class NearbyHelpScreen extends StatefulWidget {
  const NearbyHelpScreen({super.key});

  @override
  State<NearbyHelpScreen> createState() => _NearbyHelpScreenState();
}

class _NearbyHelpScreenState extends State<NearbyHelpScreen> {
  Position? _position;
  List<NearbyClinic> _clinics = [];
  bool _loading = false;
  String? _error;

  Future<void> _searchNearby() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('Location permission is required to search nearby clinics.');
      }
      final pos = await Geolocator.getCurrentPosition();
      _position = pos;

      if (EnvConfig.googleMapsApiKey.isEmpty) {
        throw Exception(
          'Google Maps API key is not configured via --dart-define=GOOGLE_MAPS_API_KEY.',
        );
      }

      final dio = Dio();
      final response = await dio.post<Map<String, dynamic>>(
        'https://places.googleapis.com/v1/places:searchNearby',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': EnvConfig.googleMapsApiKey,
            'X-Goog-FieldMask':
                'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber',
          },
        ),
        data: {
          'includedTypes': ['veterinary_care'],
          'maxResultCount': 15,
          'locationRestriction': {
            'circle': {
              'center': {'latitude': pos.latitude, 'longitude': pos.longitude},
              'radius': 10000.0,
            },
          },
        },
      );

      final places = (response.data?['places'] as List<dynamic>? ?? []);
      setState(() {
        _clinics = places.map((raw) {
          final p = raw as Map<String, dynamic>;
          final loc = p['location'] as Map<String, dynamic>;
          final nameObj = p['displayName'] as Map<String, dynamic>?;
          return NearbyClinic(
            id: p['id'] as String,
            name: (nameObj?['text'] as String?) ?? 'Veterinary Clinic',
            address: (p['formattedAddress'] as String?) ?? '',
            latitude: (loc['latitude'] as num).toDouble(),
            longitude: (loc['longitude'] as num).toDouble(),
            phoneNumber: p['nationalPhoneNumber'] as String?,
          );
        }).toList();
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nearby Veterinary Clinics')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton.icon(
              onPressed: _loading ? null : _searchNearby,
              icon: const Icon(Icons.my_location),
              label: Text(_loading ? 'Searching...' : 'Search Clinics Near Me'),
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ErrorRetryBanner(message: _error!, onRetry: _searchNearby),
            ),
          if (_position != null)
            SizedBox(
              height: 220,
              child: GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: LatLng(_position!.latitude, _position!.longitude),
                  zoom: 12,
                ),
                markers: _clinics
                    .map(
                      (c) => Marker(
                        markerId: MarkerId(c.id),
                        position: LatLng(c.latitude, c.longitude),
                        infoWindow: InfoWindow(title: c.name, snippet: c.address),
                      ),
                    )
                    .toSet(),
              ),
            ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _clinics.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final clinic = _clinics[index];
                return PawCard(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(clinic.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(clinic.address),
                    trailing: IconButton(
                      icon: const Icon(Icons.directions),
                      onPressed: () {
                        final uri = Uri.parse(
                          'https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}',
                        );
                        launchUrl(uri, mode: LaunchMode.externalApplication);
                      },
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
