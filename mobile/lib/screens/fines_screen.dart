import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../models/models.dart';
import '../widgets/common.dart';

class FinesScreen extends StatefulWidget {
  const FinesScreen({super.key});

  @override
  State<FinesScreen> createState() => _FinesScreenState();
}

class _FinesScreenState extends State<FinesScreen> {
  List<Fine> _items = const [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final driverId = session.driverId;
    if (driverId == null || driverId.isEmpty) {
      setState(() {
        _loading = false;
        _error = 'Motorista não vinculado. Faça login novamente.';
      });
      return;
    }
    try {
      _items = await fineService.byDriver(driverId);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Minhas multas'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const EmptyView(message: 'Nenhuma multa encontrada.', icon: Icons.local_police_outlined)
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final f = _items[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: InfoCard(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(f.description,
                                          style: const TextStyle(
                                              color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
                                    ),
                                    StatusBadge.auto(f.status),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text('Placa ${f.plate} • ${f.date ?? ''}',
                                    style: const TextStyle(color: colorMuted, fontSize: 11)),
                                if (f.location != null)
                                  Text('Local: ${f.location}',
                                      style: const TextStyle(color: colorMuted, fontSize: 11)),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Text('R\$ ${f.amount.toStringAsFixed(2)}',
                                        style: const TextStyle(
                                            color: colorPrimaryLight, fontSize: 13, fontWeight: FontWeight.bold)),
                                    const SizedBox(width: 12),
                                    Text('${f.points} pts', style: const TextStyle(color: colorMuted, fontSize: 11)),
                                    const Spacer(),
                                    if (f.dueDate != null)
                                      Text('Vence: ${f.dueDate}',
                                          style: const TextStyle(color: colorMuted, fontSize: 10)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
