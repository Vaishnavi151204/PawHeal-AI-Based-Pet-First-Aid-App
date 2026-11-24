import 'package:flutter_test/flutter_test.dart';
import 'package:pawheal/core/utils/validators.dart';

void main() {
  group('Validators', () {
    test('email validates correct addresses and rejects malformed ones', () {
      expect(Validators.email('owner@pawheal.app'), isNull);
      expect(Validators.email(''), isNotNull);
      expect(Validators.email('not-an-email'), isNotNull);
    });

    test('password enforces minimum length of 8 characters', () {
      expect(Validators.password('StrongPass1'), isNull);
      expect(Validators.password('short'), isNotNull);
      expect(Validators.password(''), isNotNull);
    });

    test('positiveNumber accepts values greater than zero', () {
      expect(Validators.positiveNumber('12.5', fieldName: 'Weight'), isNull);
      expect(Validators.positiveNumber('0', fieldName: 'Weight'), isNotNull);
      expect(Validators.positiveNumber('-3', fieldName: 'Weight'), isNotNull);
    });
  });
}
