import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../models/models.dart';
import '../widgets/common.dart';

/// Funcionalidades operacionais complementares do web:
/// códigos de percurso, parte diária e controle de horas do motorista.
class OperationsScreen extends StatefulWidget {
  const OperationsScreen({super.key});

  @override
  State<OperationsScreen> createState() => _OperationsScreenState();
}

class _OperationsScreenState extends State<OperationsScreen> {
  int _tab = 0;
  List<RouteCode> _codes = const [];
  List<Map<String, dynamic>> _sheets = const [];
  List<Map<String, dynamic>> _hours = const [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      switch (_tab) {
        case 0:
          _codes = await routeCodeService.all();
          break;
        case 1:
          _sheets = await parteDiariaService.all();
          break;
        case 2:
          _hours = asMapList(await api.get('/api/hr/driver-hours'));
          break;
      }
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

  Future<void> _addCode() async {
    final code = TextEditingController();
    final description = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: const Text('Novo código de percurso', style: TextStyle(color: colorText, fontSize: 15)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: code, style: const TextStyle(color: colorText),
                decoration: const InputDecoration(labelText: 'Número')),
            const SizedBox(height: 8),
            TextField(controller: description, style: const TextStyle(color: colorText),
                decoration: const InputDecoration(labelText: 'Descrição')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
              child: const Text('Salvar')),
        ],
      ),
    );
    if (saved != true || code.text.trim().isEmpty) return;
    try {
      await routeCodeService.create({'code': code.text.trim(), 'description': description.text.trim()});
      showMessage(context, 'Código criado.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _newSheet() async {
    final dateController = TextEditingController(text: DateTime.now().toString().substring(0, 10));
    final clientController = TextEditingController();
    final activitiesController = TextEditingController();
    final kmController = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: const Text('Nova parte diária', style: TextStyle(color: colorText, fontSize: 15)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: dateController, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Data (AAAA-MM-DD)')),
              const SizedBox(height: 8),
              TextField(controller: clientController, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Cliente / obra')),
              const SizedBox(height: 8),
              TextField(controller: kmController, keyboardType: TextInputType.number,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'KM total')),
              const SizedBox(height: 8),
              TextField(controller: activitiesController, maxLines: 4,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Atividades')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
              child: const Text('Salvar')),
        ],
      ),
    );
    if (saved != true) return;
    try {
      await parteDiariaService.create({
        'date': dateController.text.trim(),
        'clientName': clientController.text.trim(),
        'activities': activitiesController.text.trim(),
        'totalKm': double.tryParse(kmController.text.replaceAll(',', '.')),
        'driverName': session.user?.displayName,
      });
      showMessage(context, 'Parte diária registrada.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Operação'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
          if (_tab == 0)
            IconButton(onPressed: _addCode, icon: const Icon(Icons.add))
          else if (_tab == 1)
            IconButton(onPressed: _newSheet, icon: const Icon(Icons.add)),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: ['Percursos', 'Parte diária', 'Horas']
                  .asMap()
                  .entries
                  .map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(e.value, style: const TextStyle(fontSize: 11)),
                        selected: _tab == e.key,
                        onSelected: (_) {
                          setState(() => _tab = e.key);
                          _load();
                        },
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : _error != null
                    ? ErrorView(message: _error!, onRetry: _load)
                    : _tab == 0
                        ? _codesView()
                        : _tab == 1
                            ? _mapList(_sheets, empty: 'Nenhuma parte diária.')
                            : _mapList(_hours, empty: 'Nenhum registro de horas.'),
          ),
        ],
      ),
    );
  }

  Widget _codesView() {
    if (_codes.isEmpty) return const EmptyView(message: 'Nenhum código cadastrado.');
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _codes.length,
      itemBuilder: (context, index) {
        final c = _codes[index];
        return Card(
          color: colorSurface,
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: colorPrimary.withValues(alpha: 0.15),
              child: Text(c.code, style: const TextStyle(color: colorPrimaryLight, fontSize: 11)),
            ),
            title: Text(c.description, style: const TextStyle(color: colorText, fontSize: 12)),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline, color: colorMuted, size: 18),
              onPressed: () async {
                try {
                  await routeCodeService.delete(c.id);
                  await _load();
                } on ApiException catch (e) {
                  showMessage(context, e.message, error: true);
                }
              },
            ),
          ),
        );
      },
    );
  }

  Widget _mapList(List<Map<String, dynamic>> items, {required String empty}) {
    if (items.isEmpty) return EmptyView(message: empty);
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final title = (item['number'] ?? item['date'] ?? item['title'] ?? item['description'] ?? 'Registro').toString();
        final subtitle = (item['clientName'] ?? item['activities'] ?? item['status'] ?? '').toString();
        return Card(
          color: colorSurface,
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            title: Text(title, style: const TextStyle(color: colorText, fontSize: 12)),
            subtitle: subtitle.isEmpty
                ? null
                : Text(subtitle, style: const TextStyle(color: colorMuted, fontSize: 10)),
          ),
        );
      },
    );
  }
}
