import 'package:equatable/equatable.dart';

class PetModel extends Equatable {
  const PetModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.species,
    required this.breed,
    required this.ageYears,
    required this.gender,
    required this.weightKg,
    required this.allergies,
    required this.medicalHistory,
    required this.photoUrl,
  });

  final String id;
  final String userId;
  final String name;
  final String species;
  final String breed;
  final double ageYears;
  final String gender;
  final double weightKg;
  final String allergies;
  final String medicalHistory;
  final String photoUrl;

  factory PetModel.fromJson(Map<String, dynamic> json) {
    return PetModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String,
      species: json['species'] as String,
      breed: (json['breed'] as String?) ?? '',
      ageYears: (json['age_years'] as num).toDouble(),
      gender: (json['gender'] as String?) ?? 'Unknown',
      weightKg: (json['weight_kg'] as num).toDouble(),
      allergies: (json['allergies'] as String?) ?? '',
      medicalHistory: (json['medical_history'] as String?) ?? '',
      photoUrl: (json['photo_url'] as String?) ?? '',
    );
  }

  Map<String, dynamic> toInsertMap() {
    return {
      'user_id': userId,
      'name': name.trim(),
      'species': species,
      'breed': breed.trim(),
      'age_years': ageYears,
      'gender': gender,
      'weight_kg': weightKg,
      'allergies': allergies.trim(),
      'medical_history': medicalHistory.trim(),
      'photo_url': photoUrl,
    };
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        name,
        species,
        breed,
        ageYears,
        gender,
        weightKg,
        allergies,
        medicalHistory,
        photoUrl,
      ];
}
