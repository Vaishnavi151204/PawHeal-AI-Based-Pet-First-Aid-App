import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/features/ai_assistant/chat_model.dart';
import 'package:pawheal/features/pets/pet_model.dart';
import 'package:pawheal/services/api_client.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(ref.watch(apiClientProvider));
});

class ChatRepository {
  ChatRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<ChatMessageModel> sendMessage({
    required String message,
    required List<ChatMessageModel> history,
    PetModel? pet,
  }) async {
    final payload = await _apiClient.postJson('/chat/message', {
      'message': message,
      'history': history
          .map((m) => {'role': m.role, 'content': m.content})
          .toList(),
      if (pet != null)
        'pet': {
          'name': pet.name,
          'species': pet.species,
          'breed': pet.breed,
          'age_years': pet.ageYears,
          'weight_kg': pet.weightKg,
          'allergies': pet.allergies,
          'medical_history': pet.medicalHistory,
        },
    });
    return ChatMessageModel.fromApiJson(payload);
  }
}
