import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pawheal/features/injury_scanner/injury_model.dart';
import 'package:pawheal/features/injury_scanner/injury_repository.dart';
import 'package:pawheal/features/pets/pet_model.dart';
import 'package:pawheal/features/pets/pet_repository.dart';
import 'package:pawheal/shared/widgets/app_cards.dart';

class InjuryScannerScreen extends ConsumerStatefulWidget {
  const InjuryScannerScreen({super.key});

  @override
  ConsumerState<InjuryScannerScreen> createState() => _InjuryScannerScreenState();
}

class _InjuryScannerScreenState extends ConsumerState<InjuryScannerScreen> {
  final _picker = ImagePicker();
  final _symptomsController = TextEditingController();
  String _bodyArea = 'Paw / Pad';
  String? _imagePath;
  PetModel? _selectedPet;
  bool _loading = false;
  String? _error;
  InjuryAssessmentModel? _result;

  @override
  void dispose() {
    _symptomsController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file != null) {
      setState(() => _imagePath = file.path);
    }
  }

  Future<void> _analyze() async {
    if (_imagePath == null) {
      setState(() => _error = 'Please capture or upload an image first.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref.read(injuryRepositoryProvider).analyzeInjury(
            filePath: _imagePath!,
            bodyArea: _bodyArea,
            symptoms: _symptomsController.text,
            pet: _selectedPet,
          );
      setState(() => _result = result);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pets = ref.watch(petsListProvider).valueOrNull ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text('AI Injury Scanner')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt_outlined),
                  label: const Text('Camera'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library_outlined),
                  label: const Text('Gallery'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<PetModel?>(
            initialValue: _selectedPet,
            decoration: const InputDecoration(labelText: 'Select Pet (Optional)'),
            items: [
              const DropdownMenuItem<PetModel?>(value: null, child: Text('No specific pet')),
              ...pets.map((p) => DropdownMenuItem<PetModel?>(value: p, child: Text(p.name))),
            ],
            onChanged: (v) => setState(() => _selectedPet = v),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _bodyArea,
            decoration: const InputDecoration(labelText: 'Affected Body Area'),
            items: const ['Paw / Pad', 'Leg / Joint', 'Ear', 'Eye', 'Skin / Coat', 'Mouth']
                .map((area) => DropdownMenuItem(value: area, child: Text(area)))
                .toList(),
            onChanged: (v) => setState(() => _bodyArea = v ?? 'Paw / Pad'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _symptomsController,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Observed Symptoms'),
          ),
          const SizedBox(height: 16),
          if (_error != null) ...[
            ErrorRetryBanner(message: _error!, onRetry: _analyze),
            const SizedBox(height: 12),
          ],
          FilledButton(
            onPressed: _loading ? null : _analyze,
            child: Text(_loading ? 'Analyzing...' : 'Analyze Injury'),
          ),
          if (_result != null) ...[
            const SizedBox(height: 20),
            PawCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_result!.possibleCategory} (${_result!.urgencyLevel.toUpperCase()})',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(_result!.veterinaryRecommendation),
                  const SizedBox(height: 10),
                  const Text('Safe Immediate Actions:', style: TextStyle(fontWeight: FontWeight.w700)),
                  ..._result!.safeImmediateActions.map((a) => Text('• $a')),
                  const SizedBox(height: 10),
                  Text(_result!.disclaimer, style: const TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
