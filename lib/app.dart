import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/core/constants/app_constants.dart';
import 'package:pawheal/routing/app_router.dart';
import 'package:pawheal/theme/app_theme.dart';

class PawHealApp extends ConsumerWidget {
  const PawHealApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: AppConstants.appTitle,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}
