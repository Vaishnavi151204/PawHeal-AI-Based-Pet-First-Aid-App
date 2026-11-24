/// Application-wide constants and safety disclaimers.
class AppConstants {
  const AppConstants._();

  static const String appTitle = 'PawHeal';
  static const String apiV1Prefix = '/api/v1';

  static const Duration apiConnectTimeout = Duration(seconds: 15);
  static const Duration apiReceiveTimeout = Duration(seconds: 35);

  static const int maxImageSizeBytes = 5 * 1024 * 1024; // 5 MB
  static const List<String> allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  static const String medicalDisclaimer =
      'PawHeal provides informational first-aid guidance only and is not a '
      'substitute for professional veterinary diagnosis or emergency care. '
      'If your pet shows severe distress, uncontrolled bleeding, difficulty '
      'breathing, or unresponsiveness, contact an emergency veterinarian immediately.';
}
