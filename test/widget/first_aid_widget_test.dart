import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pawheal/features/first_aid/first_aid_screen.dart';
import 'package:pawheal/theme/app_theme.dart';

void main() {
  testWidgets('FirstAidLibraryScreen renders curated emergency guides', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: const FirstAidLibraryScreen(),
      ),
    );

    expect(find.text('First-Aid Library'), findsOneWidget);
    expect(find.text('Cuts & Wounds'), findsOneWidget);
    expect(find.text('Active Bleeding'), findsNothing);
    expect(find.text('Bleeding'), findsOneWidget);
  });
}
