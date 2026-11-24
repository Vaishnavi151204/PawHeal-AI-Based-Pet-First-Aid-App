import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/config/env_config.dart';
import 'package:pawheal/services/supabase_service.dart';
import 'package:pawheal/shared/widgets/app_cards.dart';

class HealthTrackerScreen extends ConsumerWidget {
  const HealthTrackerScreen({super.key});

  Future<Map<String, List<Map<String, dynamic>>>> _loadAll(WidgetRef ref) async {
    if (!EnvConfig.isSupabaseConfigured) {
      return {
        'vaccinations': [],
        'medications': [],
        'appointments': [],
      };
    }
    final client = ref.read(supabaseClientProvider);
    final vax = await client.from('vaccinations').select().order('administered_date', ascending: false);
    final meds = await client.from('medications').select().order('created_at', ascending: false);
    final appts = await client.from('appointments').select().order('appointment_at');
    return {
      'vaccinations': List<Map<String, dynamic>>.from(vax as List),
      'medications': List<Map<String, dynamic>>.from(meds as List),
      'appointments': List<Map<String, dynamic>>.from(appts as List),
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Health Tracker')),
      body: FutureBuilder(
        future: _loadAll(ref),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: ErrorRetryBanner(message: snapshot.error.toString()),
            );
          }
          final data = snapshot.data ?? {};
          final vax = data['vaccinations'] ?? [];
          final meds = data['medications'] ?? [];
          final appts = data['appointments'] ?? [];

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Vaccinations (${vax.length})', style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              if (vax.isEmpty)
                const Text('No vaccinations recorded yet.')
              else
                ...vax.map((v) => PawCard(child: Text('${v['vaccine_name']} · ${v['administered_date']}'))),
              const SizedBox(height: 16),
              Text('Medications (${meds.length})', style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              if (meds.isEmpty)
                const Text('No active medication reminders.')
              else
                ...meds.map((m) => PawCard(child: Text('${m['medication_name']} · ${m['dosage']}'))),
              const SizedBox(height: 16),
              Text('Appointments (${appts.length})', style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              if (appts.isEmpty)
                const Text('No upcoming veterinary appointments.')
              else
                ...appts.map((a) => PawCard(child: Text('${a['title']} · ${a['appointment_at']}'))),
            ],
          );
        },
      ),
    );
  }
}
