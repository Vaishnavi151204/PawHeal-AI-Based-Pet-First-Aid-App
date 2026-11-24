import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/config/env_config.dart';
import 'package:pawheal/services/supabase_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    EnvConfig.isSupabaseConfigured ? ref.watch(supabaseClientProvider) : null,
  );
});

final authStateProvider = StreamProvider<User?>((ref) {
  if (!EnvConfig.isSupabaseConfigured) {
    return Stream.value(null);
  }
  final client = ref.watch(supabaseClientProvider);
  return client.auth.onAuthStateChange.map((event) => event.session?.user);
});

class AuthRepository {
  AuthRepository(this._client);

  final SupabaseClient? _client;

  User? get currentUser => _client?.auth.currentUser;

  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final client = _requireClient();
    await client.auth.signInWithPassword(email: email.trim(), password: password);
  }

  Future<void> signUpWithEmail({
    required String fullName,
    required String email,
    required String password,
  }) async {
    final client = _requireClient();
    final response = await client.auth.signUp(
      email: email.trim(),
      password: password,
      data: {'full_name': fullName.trim()},
    );
    final user = response.user;
    if (user != null) {
      await client.from('profiles').upsert({
        'id': user.id,
        'email': email.trim().toLowerCase(),
        'full_name': fullName.trim(),
      });
    }
  }

  Future<void> signInWithGoogle() async {
    final client = _requireClient();
    await client.auth.signInWithOAuth(OAuthProvider.google);
  }

  Future<void> sendPasswordReset(String email) async {
    final client = _requireClient();
    await client.auth.resetPasswordForEmail(email.trim());
  }

  Future<void> signOut() async {
    await _client?.auth.signOut();
  }

  SupabaseClient _requireClient() {
    if (_client == null) {
      throw StateError(
        'Supabase is not configured. Provide SUPABASE_URL and SUPABASE_ANON_KEY via --dart-define.',
      );
    }
    return _client;
  }
}
