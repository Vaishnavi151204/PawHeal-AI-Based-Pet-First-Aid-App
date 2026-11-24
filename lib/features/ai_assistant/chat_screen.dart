import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawheal/features/ai_assistant/chat_model.dart';
import 'package:pawheal/features/ai_assistant/chat_repository.dart';
import 'package:pawheal/features/pets/pet_repository.dart';
import 'package:pawheal/shared/widgets/app_cards.dart';
import 'package:pawheal/theme/app_theme.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  final List<ChatMessageModel> _messages = [];
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send(String text) async {
    final clean = text.trim();
    if (clean.isEmpty || _sending) return;
    setState(() {
      _messages.add(ChatMessageModel(role: 'user', content: clean));
      _sending = true;
      _error = null;
      _controller.clear();
    });
    try {
      final pets = ref.read(petsListProvider).valueOrNull ?? [];
      final reply = await ref.read(chatRepositoryProvider).sendMessage(
            message: clean,
            history: _messages,
            pet: pets.isNotEmpty ? pets.first : null,
          );
      setState(() => _messages.add(reply));
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Pet-Care Assistant')),
      body: Column(
        children: [
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: ErrorRetryBanner(message: _error!),
            ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final m = _messages[index];
                final isUser = m.role == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isUser ? AppTheme.primaryTeal : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: isUser ? null : Border.all(color: AppTheme.hairlineBorder),
                    ),
                    child: Text(
                      m.content,
                      style: TextStyle(color: isUser ? Colors.white : AppTheme.primaryInk),
                    ),
                  ),
                );
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: const InputDecoration(hintText: 'Ask a pet-care question...'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sending ? null : () => _send(_controller.text),
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
