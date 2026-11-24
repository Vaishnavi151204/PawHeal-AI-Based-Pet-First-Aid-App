import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/config/env_config.dart';
import 'package:pawheal/core/constants/app_constants.dart';
import 'package:pawheal/core/errors/exceptions.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    baseUrl: EnvConfig.apiBaseUrl,
    accessTokenProvider: () =>
        EnvConfig.isSupabaseConfigured ? Supabase.instance.client.auth.currentSession?.accessToken : null,
  );
});

class ApiClient {
  ApiClient({
    required String baseUrl,
    required String? Function() accessTokenProvider,
  })  : _accessTokenProvider = accessTokenProvider,
        _dio = Dio(
          BaseOptions(
            baseUrl: '$baseUrl${AppConstants.apiV1Prefix}',
            connectTimeout: AppConstants.apiConnectTimeout,
            receiveTimeout: AppConstants.apiReceiveTimeout,
          ),
        );

  final Dio _dio;
  final String? Function() _accessTokenProvider;

  Options _authOptions([Map<String, dynamic>? headers]) {
    final token = _accessTokenProvider();
    return Options(
      headers: {
        if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        ...?headers,
      },
    );
  }

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        path,
        data: data,
        options: _authOptions({'Content-Type': 'application/json'}),
      );
      return response.data ?? <String, dynamic>{};
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  Future<Map<String, dynamic>> postMultipart(
    String path,
    FormData formData,
  ) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        path,
        data: formData,
        options: _authOptions(),
      );
      return response.data ?? <String, dynamic>{};
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  AppException _mapDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return const TimeoutException();
    }
    if (e.type == DioExceptionType.connectionError) {
      return const NetworkException();
    }
    final status = e.response?.statusCode;
    final data = e.response?.data;
    final message = (data is Map && data['error'] is Map && data['error']['message'] is String)
        ? data['error']['message'] as String
        : 'Server request failed ($status).';
    if (status == 401 || status == 403) {
      return AuthException(message, statusCode: status);
    }
    return ServerException(message, statusCode: status, cause: e);
  }
}
