import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/config/env_config.dart';
import 'package:pawheal/features/pets/pet_model.dart';
import 'package:pawheal/services/supabase_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final petRepositoryProvider = Provider<PetRepository>((ref) {
  return PetRepository(
    EnvConfig.isSupabaseConfigured ? ref.watch(supabaseClientProvider) : null,
  );
});

final petsListProvider = FutureProvider<List<PetModel>>((ref) async {
  return ref.watch(petRepositoryProvider).fetchPets();
});

class PetRepository {
  PetRepository(this._client);

  final SupabaseClient? _client;

  Future<List<PetModel>> fetchPets() async {
    final client = _client;
    if (client == null || client.auth.currentUser == null) return [];
    final rows = await client
        .from('pets')
        .select()
        .order('created_at', ascending: false);
    return (rows as List<dynamic>)
        .map((row) => PetModel.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  Future<void> savePet(PetModel pet) async {
    final client = _client;
    if (client == null) return;
    if (pet.id.isEmpty) {
      await client.from('pets').insert(pet.toInsertMap());
    } else {
      await client.from('pets').update(pet.toInsertMap()).eq('id', pet.id);
    }
  }

  Future<void> deletePet(String petId) async {
    final client = _client;
    if (client == null) return;
    await client.from('pets').delete().eq('id', petId);
  }
}
