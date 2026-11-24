import 'package:flutter/material.dart';
import 'package:pawheal/features/first_aid/first_aid_data.dart';
import 'package:pawheal/shared/widgets/app_cards.dart';
import 'package:pawheal/theme/app_theme.dart';

class FirstAidLibraryScreen extends StatelessWidget {
  const FirstAidLibraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('First-Aid Library')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: curatedFirstAidGuides.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final guide = curatedFirstAidGuides[index];
          return PawCard(
            child: ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(guide.title, style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text(guide.urgency, style: const TextStyle(color: AppTheme.primaryTeal)),
              childrenPadding: const EdgeInsets.only(top: 8),
              children: [
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Safe Steps:', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
                ...guide.safeSteps.map((s) => Align(alignment: Alignment.centerLeft, child: Text('• $s'))),
                const SizedBox(height: 8),
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Avoid:', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
                ...guide.avoidActions.map((a) => Align(alignment: Alignment.centerLeft, child: Text('× $a'))),
                const SizedBox(height: 8),
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Emergency Warnings:',
                    style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.emergencyRed),
                  ),
                ),
                ...guide.emergencyWarnings
                    .map((w) => Align(alignment: Alignment.centerLeft, child: Text('! $w'))),
              ],
            ),
          );
        },
      ),
    );
  }
}
