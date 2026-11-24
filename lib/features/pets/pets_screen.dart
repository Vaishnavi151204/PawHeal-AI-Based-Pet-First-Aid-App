import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/core/utils/validators.dart';
import 'package:pawheal/features/pets/pet_model.dart';
import 'package:pawheal/features/pets/pet_repository.dart';
import 'package:pawheal/shared/widgets/app_cards.dart';
import 'package:pawheal/theme/app_theme.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class PetsScreen extends ConsumerWidget {
  const PetsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final petsAsync = ref.watch(petsListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Pets')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openPetDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Add Pet'),
      ),
      body: petsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Padding(
          padding: const EdgeInsets.all(16),
          child: ErrorRetryBanner(
            message: err.toString(),
            onRetry: () => ref.invalidate(petsListProvider),
          ),
        ),
        data: (pets) {
          if (pets.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: EmptyStateCard(
                  icon: Icons.pets_rounded,
                  title: 'No pets added yet',
                  subtitle: 'Add your pet profile to personalize AI triage and health reminders.',
                  actionLabel: 'Add Pet',
                  onAction: () => _openPetDialog(context, ref),
                ),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: pets.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final pet = pets[index];
              return PawCard(
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: AppTheme.primaryTeal.withValues(alpha: 0.12),
                    child: const Icon(Icons.pets, color: AppTheme.primaryTeal),
                  ),
                  title: Text(pet.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text(
                    '${pet.species} · ${pet.breed.isEmpty ? 'Mixed' : pet.breed} · ${pet.weightKg} kg',
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () async {
                      await ref.read(petRepositoryProvider).deletePet(pet.id);
                      ref.invalidate(petsListProvider);
                    },
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _openPetDialog(BuildContext context, WidgetRef ref) async {
    final formKey = GlobalKey<FormState>();
    final nameCtrl = TextEditingController();
    final breedCtrl = TextEditingController();
    final ageCtrl = TextEditingController(text: '2');
    final weightCtrl = TextEditingController(text: '10');
    String species = 'Dog';

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('New Pet Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              TextFormField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Pet Name'),
                validator: (v) => Validators.requiredField(v, fieldName: 'Pet name'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: species,
                decoration: const InputDecoration(labelText: 'Species'),
                items: const ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) => species = v ?? 'Dog',
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: breedCtrl,
                decoration: const InputDecoration(labelText: 'Breed'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: ageCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Age (yrs)'),
                      validator: (v) => Validators.positiveNumber(v, fieldName: 'Age'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: weightCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Weight (kg)'),
                      validator: (v) => Validators.positiveNumber(v, fieldName: 'Weight'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  if (!formKey.currentState!.validate()) return;
                  final uid = Supabase.instance.client.auth.currentUser?.id ?? '';
                  await ref.read(petRepositoryProvider).savePet(
                        PetModel(
                          id: '',
                          userId: uid,
                          name: nameCtrl.text,
                          species: species,
                          breed: breedCtrl.text,
                          ageYears: double.parse(ageCtrl.text),
                          gender: 'Unknown',
                          weightKg: double.parse(weightCtrl.text),
                          allergies: '',
                          medicalHistory: '',
                          photoUrl: '',
                        ),
                      );
                  ref.invalidate(petsListProvider);
                  if (ctx.mounted) Navigator.pop(ctx);
                },
                child: const Text('Save Pet'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
