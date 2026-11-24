import 'package:flutter_test/flutter_test.dart';
import 'package:pawheal/features/injury_scanner/injury_model.dart';
import 'package:pawheal/features/pets/pet_model.dart';

void main() {
  group('Domain Models', () {
    test('PetModel serializes and deserializes cleanly', () {
      final pet = PetModel.fromJson({
        'id': 'pet-1',
        'user_id': 'user-1',
        'name': 'Milo',
        'species': 'Dog',
        'breed': 'Beagle',
        'age_years': 3,
        'gender': 'Male',
        'weight_kg': 12.5,
        'allergies': 'Chicken',
        'medical_history': 'Healthy',
        'photo_url': '',
      });
      expect(pet.name, 'Milo');
      expect(pet.toInsertMap()['weight_kg'], 12.5);
    });

    test('InjuryAssessmentModel parses structured JSON response', () {
      final assessment = InjuryAssessmentModel.fromJson({
        'visible_observations': ['Superficial redness on paw pad'],
        'possible_category': 'Paw pad abrasion',
        'urgency_level': 'moderate',
        'safe_immediate_actions': ['Rinse with sterile saline'],
        'actions_to_avoid': ['Do not apply hydrogen peroxide'],
        'veterinary_recommendation': 'Schedule a vet check within 24 hours.',
        'emergency_warning_signs': ['Heavy bleeding'],
        'disclaimer': 'Informational guidance only.',
      });
      expect(assessment.urgencyLevel, 'moderate');
      expect(assessment.safeImmediateActions.length, 1);
    });
  });
}
