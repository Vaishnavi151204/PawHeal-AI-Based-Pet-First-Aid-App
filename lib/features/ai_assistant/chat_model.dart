class ChatMessageModel {
  const ChatMessageModel({
    required this.role,
    required this.content,
    this.urgencyFlag = 'routine',
    this.suggestedFollowUps = const [],
  });

  final String role;
  final String content;
  final String urgencyFlag;
  final List<String> suggestedFollowUps;

  factory ChatMessageModel.fromApiJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      role: 'assistant',
      content: (json['reply'] as String?) ?? '',
      urgencyFlag: (json['urgency_flag'] as String?) ?? 'monitor',
      suggestedFollowUps: List<String>.from(json['suggested_follow_ups'] as List? ?? []),
    );
  }
}
