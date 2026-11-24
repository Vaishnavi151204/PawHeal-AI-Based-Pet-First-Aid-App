import 'package:equatable/equatable.dart';

/// Domain-level failure representations surfaced safely to the UI layer.
sealed class Failure extends Equatable {
  const Failure(this.message, {this.canRetry = true});

  final String message;
  final bool canRetry;

  @override
  List<Object?> get props => [message, canRetry];
}

class NetworkFailure extends Failure {
  const NetworkFailure([
    super.message = 'No internet connection. Please check your network and retry.',
  ]);
}

class AuthFailure extends Failure {
  const AuthFailure(super.message, {super.canRetry = false});
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message) : super(canRetry: false);
}

class ServerFailure extends Failure {
  const ServerFailure([
    super.message = 'Something went wrong on our end. Please try again shortly.',
  ]);
}

class AiServiceFailure extends Failure {
  const AiServiceFailure([
    super.message =
        'Our AI assistant is temporarily unavailable. For urgent pet symptoms, please contact a veterinarian directly.',
  ]);
}

class PermissionFailure extends Failure {
  const PermissionFailure(super.message) : super(canRetry: false);
}

class NotFoundFailure extends Failure {
  const NotFoundFailure(super.message) : super(canRetry: false);
}
