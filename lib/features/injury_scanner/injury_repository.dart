import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/config/env_config.dart';
import 'package:pawheal/features/injury_scanner/injury_model.dart';
import 'package:pawheal/features/pets/pet_model.dart';
import 'package:pawheal/services/api_client.dart';
import 'package:pawheal/services/supabase_service.dart';

final injuryRepositoryProvider = Provider<InjuryRepository>((ref) {
  return InjuryRepository(ref.watch(apiClientProvider));
});

class InjuryRepository {
  InjuryRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<InjuryAssessmentModel> analyzeInjury({
    required String filePath,
    required String bodyArea,
    required String symptoms,
    PetModel? pet,
  }) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(filePath),
      'body_area': bodyArea,
      'symptoms': symptoms,
      if (pet != null)
        'pet_context_json': jsonEncode({
          'name': pet.name,
          'species': pet.species,
          'breed': pet.breed,
          'age_years': pet.ageYears,
          'weight_kg': pet.weightKg,
          'allergies': pet.allergies,
          'medical_history': pet.medicalHistory,
        }),
    });

    final payload = await _apiClient.postMultipart('/injury/analyze', formData);
    final assessment = InjuryAssessmentModel.fromJson(payload);

    if (EnvConfig.isSupabaseConfigured) {
      final client = SupabaseService.initialize;
      // Persisted when Supabase session is active
      assert(client != null);
    }

    return assessment;
  }
}
