import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pawheal/features/pets/pet_repository.dart';
import 'package:pawheal/shared/widgets/app_cards.dart';
import 'package:pawheal/theme/app_theme.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final petsAsync = ref.watch(petsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('PawHeal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Pet Health Overview',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.35,
            children: [
              _ShortcutCard(
                icon: Icons.camera_alt_outlined,
                title: 'AI Injury Scanner',
                onTap: () => context.push('/scanner'),
              ),
              _ShortcutCard(
                icon: Icons.chat_bubble_outline,
                title: 'AI Care Chat',
                onTap: () => context.push('/chat'),
              ),
              _ShortcutCard(
                icon: Icons.local_hospital_outlined,
                title: 'Nearby Vets',
                onTap: () => context.push('/nearby'),
              ),
              _ShortcutCard(
                icon: Icons.menu_book_outlined,
                title: 'First-Aid Guide',
                onTap: () => context.push('/first-aid'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Your Pets', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              TextButton(
                onPressed: () => context.push('/pets'),
                child: const Text('Manage'),
              ),
            ],
          ),
          petsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => ErrorRetryBanner(message: e.toString()),
            data: (pets) {
              if (pets.isEmpty) {
                return EmptyStateCard(
                  icon: Icons.pets,
                  title: 'Add your first pet',
                  subtitle: 'Keep allergies, weights, and vaccination records ready.',
                  actionLabel: 'Add Pet',
                  onAction: () => context.push('/pets'),
                );
              }
              return Column(
                children: pets
                    .map(
                      (p) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: PawCard(
                          onTap: () => context.push('/tracker'),
                          child: Row(
                            children: [
                              const Icon(Icons.pets, color: AppTheme.primaryTeal),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                    Text(
                                      '${p.species} · ${p.ageYears}y · ${p.weightKg} kg',
                                      style: const TextStyle(color: AppTheme.secondaryInk, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.chevron_right),
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ShortcutCard extends StatelessWidget {
  const _ShortcutCard({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PawCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: AppTheme.primaryTeal, size: 28),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        ],
      ),
    );
  }
}
