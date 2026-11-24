import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/config/env_config.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

class SupabaseService {
  const SupabaseService._();

  static Future<void> initialize() async {
    if (!EnvConfig.isSupabaseConfigured) return;
    await Supabase.initialize(
      url: EnvConfig.supabaseUrl,
      anonKey: EnvConfig.supabaseAnonKey,
    );
  }
}
