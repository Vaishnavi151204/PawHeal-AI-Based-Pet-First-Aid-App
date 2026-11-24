import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pawheal/features/ai_assistant/chat_screen.dart';
import 'package:pawheal/features/authentication/auth_screens.dart';
import 'package:pawheal/features/dashboard/dashboard_screen.dart';
import 'package:pawheal/features/first_aid/first_aid_screen.dart';
import 'package:pawheal/features/health_tracker/health_tracker_screen.dart';
import 'package:pawheal/features/injury_scanner/injury_scanner_screen.dart';
import 'package:pawheal/features/nearby_help/nearby_help_screen.dart';
import 'package:pawheal/features/pets/pets_screen.dart';
import 'package:pawheal/features/profile/profile_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignUpScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
      GoRoute(path: '/pets', builder: (_, __) => const PetsScreen()),
      GoRoute(path: '/scanner', builder: (_, __) => const InjuryScannerScreen()),
      GoRoute(path: '/chat', builder: (_, __) => const ChatScreen()),
      GoRoute(path: '/nearby', builder: (_, __) => const NearbyHelpScreen()),
      GoRoute(path: '/first-aid', builder: (_, __) => const FirstAidLibraryScreen()),
      GoRoute(path: '/tracker', builder: (_, __) => const HealthTrackerScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileSettingsScreen()),
    ],
  );
});
