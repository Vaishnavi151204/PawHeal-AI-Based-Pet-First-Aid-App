import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pawheal/app.dart';

void main() {
  testWidgets('PawHealApp boots cleanly into splash screen', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: PawHealApp()));
    expect(find.text('PawHeal'), findsOneWidget);
    await tester.pump(const Duration(seconds: 1));
  });
}
