/// Low-level exceptions thrown by data sources and network services.
sealed class AppException implements Exception {
  const AppException(this.message, {this.statusCode, this.cause});

  final String message;
  final int? statusCode;
  final Object? cause;

  @override
  String toString() => '$runtimeType(statusCode: $statusCode, message: $message)';
}

class NetworkException extends AppException {
  const NetworkException([
    super.message = 'Unable to reach the server. Check your internet connection.',
    int? statusCode,
  ]) : super(statusCode: statusCode);
}

class TimeoutException extends AppException {
  const TimeoutException([
    super.message = 'The request took too long to complete. Please try again.',
  ]) : super(statusCode: 408);
}

class AuthException extends AppException {
  const AuthException(super.message, {super.statusCode, super.cause});
}

class ValidationException extends AppException {
  const ValidationException(super.message) : super(statusCode: 422);
}

class ServerException extends AppException {
  const ServerException(super.message, {super.statusCode, super.cause});
}

class StorageException extends AppException {
  const StorageException(super.message, {super.cause});
}

class PermissionException extends AppException {
  const PermissionException(super.message);
}
