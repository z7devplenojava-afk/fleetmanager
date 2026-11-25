import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';

class OfflineAction {
  final String id;
  final String label;
  final String method;
  final String path;
  final Map<String, dynamic> body;
  final DateTime createdAt;

  OfflineAction({
    required this.id,
    required this.label,
    required this.method,
    required this.path,
    required this.body,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'id': id,
        'label': label,
        'method': method,
        'path': path,
        'body': body,
        'createdAt': createdAt.toIso8601String(),
      };

  factory OfflineAction.fromJson(Map<String, dynamic> json) => OfflineAction(
        id: json['id']?.toString() ?? DateTime.now().microsecondsSinceEpoch.toString(),
        label: json['label']?.toString() ?? 'Ação pendente',
        method: json['method']?.toString() ?? 'POST',
        path: json['path']?.toString() ?? '',
        body: Map<String, dynamic>.from(json['body'] as Map? ?? const {}),
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      );
}

/// Fila simples de ações offline, com a mesma regra do web:
/// 4xx descarta, 5xx mantém para nova tentativa.
class OfflineQueue {
  static const _key = 'fluxbus_mobile_offline_queue';
  final ApiClient api;

  OfflineQueue(this.api);

  Future<List<OfflineAction>> all() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? const [];
    return raw
        .map((e) => OfflineAction.fromJson(jsonDecode(e) as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
  }

  Future<void> add(OfflineAction action) async {
    final items = await all();
    items.add(action);
    await _save(items);
  }

  Future<int> get count async => (await all()).length;

  Future<FlushResult> flush() async {
    final items = await all();
    if (items.isEmpty) return const FlushResult(sent: 0, remaining: 0);
    final remaining = <OfflineAction>[];
    var sent = 0;
    for (final item in items) {
      try {
        switch (item.method.toUpperCase()) {
          case 'POST':
            await api.post(item.path, item.body);
            break;
          case 'PUT':
            await api.put(item.path, item.body);
            break;
          case 'PATCH':
            await api.patch(item.path, item.body);
            break;
          default:
            await api.post(item.path, item.body);
        }
        sent++;
      } on ApiException catch (e) {
        if (e.statusCode >= 400 && e.statusCode < 500) {
          // Erro do cliente: não adianta reenviar.
          continue;
        }
        remaining.add(item);
      } catch (_) {
        remaining.add(item);
      }
    }
    await _save(remaining);
    return FlushResult(sent: sent, remaining: remaining.length);
  }

  Future<void> clear() => _save(const []);

  Future<void> _save(List<OfflineAction> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_key, items.map((e) => jsonEncode(e.toJson())).toList());
  }
}

class FlushResult {
  final int sent;
  final int remaining;
  const FlushResult({required this.sent, required this.remaining});
}
