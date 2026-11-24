import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pawheal/core/constants/app_constants.dart';
import 'package:pawheal/features/authentication/auth_repository.dart';
import 'package:pawheal/services/notification_service.dart';
import 'package:pawheal/shared/widgets/app_cards.dart';

class ProfileSettingsScreen extends ConsumerStatefulWidget {
  const ProfileSettingsScreen({super.key});

  @override
  ConsumerState<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends ConsumerState<ProfileSettingsScreen> {
  bool _remindersEnabled = true;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authRepositoryProvider).currentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile & Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          PawCard(
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.person_outline),
              title: Text(user?.email ?? 'Signed-out session'),
              subtitle: const Text('PawHeal Account'),
            ),
          ),
          const SizedBox(height: 12),
          PawCard(
            child: SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Care & Medication Notifications'),
              value: _remindersEnabled,
              onChanged: (val) async {
                setState(() => _remindersEnabled = val);
                if (val) {
                  await ref.read(notificationServiceProvider).initialize();
                }
              },
            ),
          ),
          const SizedBox(height: 12),
          const PawCard(
            child: Text(
              AppConstants.medicalDisclaimer,
              style: TextStyle(fontSize: 13, height: 1.45),
            ),
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: () async {
              await ref.read(authRepositoryProvider).signOut();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout),
            label: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}
