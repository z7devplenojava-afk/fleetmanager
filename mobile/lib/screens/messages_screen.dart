import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../models/models.dart';
import '../widgets/common.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<AppMessage> _items = const [];
  String _tab = 'RECEBIDAS';
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _items = _tab == 'RECEBIDAS'
          ? await messageService.received()
          : await messageService.sent();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _openMessage(AppMessage message) async {
    if (!message.read) {
      try {
        await messageService.markRead(message.id);
      } on ApiException {
        // Não bloqueia a leitura.
      }
    }
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: Text(message.subject, style: const TextStyle(color: colorText, fontSize: 15)),
        content: Text(message.content ?? '(sem conteúdo)',
            style: const TextStyle(color: colorMuted, fontSize: 13)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Fechar')),
        ],
      ),
    );
  }

  Future<void> _newMessage() async {
    final recipient = TextEditingController();
    final subject = TextEditingController();
    final content = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: const Text('Nova mensagem', style: TextStyle(color: colorText, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: recipient, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Destinatário (usuário)')),
              const SizedBox(height: 8),
              TextField(controller: subject, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Assunto')),
              const SizedBox(height: 8),
              TextField(controller: content, maxLines: 4, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Mensagem')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
              child: const Text('Enviar')),
        ],
      ),
    );
    if (saved != true) return;
    if (recipient.text.trim().isEmpty || content.text.trim().isEmpty) {
      showMessage(context, 'Preencha destinatário e mensagem.', error: true);
      return;
    }
    try {
      await messageService.send({
        'recipientUsername': recipient.text.trim(),
        'subject': subject.text.trim(),
        'content': content.text.trim(),
      });
      showMessage(context, 'Mensagem enviada.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mensagens'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
          IconButton(onPressed: _newMessage, icon: const Icon(Icons.add)),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: ['RECEBIDAS', 'ENVIADAS']
                  .map((t) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(t.toLowerCase()),
                          selected: _tab == t,
                          onSelected: (_) {
                            setState(() => _tab = t);
                            _load();
                          },
                        ),
                      ))
                  .toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : _error != null
                    ? ErrorView(message: _error!, onRetry: _load)
                    : _items.isEmpty
                        ? const EmptyView(message: 'Nenhuma mensagem.', icon: Icons.mail_outline)
                        : ListView.builder(
                            itemCount: _items.length,
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            itemBuilder: (context, index) {
                              final m = _items[index];
                              return Card(
                                color: colorSurface,
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: Icon(
                                    m.read ? Icons.mail_outline : Icons.mail,
                                    color: m.read ? colorMuted : colorPrimaryLight,
                                  ),
                                  title: Text(m.subject,
                                      style: TextStyle(
                                          color: colorText,
                                          fontSize: 12,
                                          fontWeight: m.read ? FontWeight.normal : FontWeight.bold)),
                                  subtitle: Text(m.senderName ?? '',
                                      style: const TextStyle(color: colorMuted, fontSize: 10)),
                                  onTap: () => _openMessage(m),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
