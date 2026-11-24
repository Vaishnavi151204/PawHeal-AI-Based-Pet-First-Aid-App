import 'package:flutter/material.dart';

/// Centralized Material 3 theme with warm-neutral backgrounds and teal/green healthcare accents.
class AppTheme {
  const AppTheme._();

  static const Color primaryTeal = Color(0xFF0F766E);
  static const Color secondaryGreen = Color(0xFF15803D);
  static const Color warmCanvas = Color(0xFFF7F8F6);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color hairlineBorder = Color(0xFFE2E8E2);
  static const Color primaryInk = Color(0xFF111817);
  static const Color secondaryInk = Color(0xFF4A5553);
  static const Color warningAmber = Color(0xFFB45309);
  static const Color emergencyRed = Color(0xFFB91C1C);

  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryTeal,
      primary: primaryTeal,
      secondary: secondaryGreen,
      surface: surfaceWhite,
      error: emergencyRed,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: warmCanvas,
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceWhite,
        foregroundColor: primaryInk,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: surfaceWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: hairlineBorder),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceWhite,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: hairlineBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: hairlineBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryTeal, width: 1.5),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primaryTeal,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
