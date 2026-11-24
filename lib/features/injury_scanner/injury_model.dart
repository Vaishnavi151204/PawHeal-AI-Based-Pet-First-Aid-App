class InjuryAssessmentModel {
  const InjuryAssessmentModel({
    required this.visibleObservations,
    required this.possibleCategory,
    required this.urgencyLevel,
    required this.safeImmediateActions,
    required this.actionsToAvoid,
    required this.veterinaryRecommendation,
    required this.emergencyWarningSigns,
    required this.disclaimer,
  });

  final List<String> visibleObservations;
  final String possibleCategory;
  final String urgencyLevel;
  final List<String> safeImmediateActions;
  final List<String> actionsToAvoid;
  final String veterinaryRecommendation;
  final List<String> emergencyWarningSigns;
  final String disclaimer;

  factory InjuryAssessmentModel.fromJson(Map<String, dynamic> json) {
    return InjuryAssessmentModel(
      visibleObservations: List<String>.from(json['visible_observations'] as List? ?? []),
      possibleCategory: (json['possible_category'] as String?) ?? 'Evaluation recommended',
      urgencyLevel: (json['urgency_level'] as String?) ?? 'moderate',
      safeImmediateActions: List<String>.from(json['safe_immediate_actions'] as List? ?? []),
      actionsToAvoid: List<String>.from(json['actions_to_avoid'] as List? ?? []),
      veterinaryRecommendation: (json['veterinary_recommendation'] as String?) ?? '',
      emergencyWarningSigns: List<String>.from(json['emergency_warning_signs'] as List? ?? []),
      disclaimer: (json['disclaimer'] as String?) ?? '',
    );
  }
}
