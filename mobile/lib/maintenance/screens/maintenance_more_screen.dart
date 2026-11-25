import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../widgets/common.dart';

class MaintenanceMoreScreen extends StatefulWidget {
  final int initialTab;

  const MaintenanceMoreScreen({super.key, this.initialTab = 0});

  @override
  State<MaintenanceMoreScreen> createState() => _MaintenanceMoreScreenState();
}

class _MaintenanceMoreScreenState extends State<MaintenanceMoreScreen> {
  static const _tabs = [
    'Componentes',
    'Pneus',
    'Checklists',
    'Laudos',
    'Limpeza',
    'CFME',
    'Garagens',
    'Veículos',
  ];

  int _tab = 0;
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tab = widget.initialTab;
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      switch (_tab) {
        case 0:
          _items = (await maintenanceRepository.componentDashboard())
              .map((e) => {
                    'id': e.id,
                    'title': '${e.vehiclePlate} • ${e.controlType}',
                    'subtitle': 'Próximo: ${e.nextDueKm ?? 0} km • faltam ${e.kmRemaining ?? 0} km',
                    'status': e.alertLevel,
                  })
              .toList();
          break;
        case 1:
          _items = (await maintenanceRepository.tires())
              .map((e) => {
                    'id': e.id,
                    'title': e.code,
                    'subtitle': '${e.status}${e.vehiclePlate != null ? ' • ${e.vehiclePlate}' : ''}'
                        '${e.position != null ? ' • ${e.position}' : ''}',
                    'status': e.status,
                  })
              .toList();
          break;
        case 2:
          _items = (await maintenanceRepository.gateChecklists())
              .map((e) => {
                    'id': e.id,
                    'title': '${e.type} • ${e.vehiclePlate ?? '-'}',
                    'subtitle': '${e.driverName ?? ''} ${e.createdAt ?? ''}',
                  })
              .toList();
          break;
        case 3:
          _items = (await maintenanceRepository.inspections())
              .map((e) => {
                    'id': e.id,
                    'title': '${e.registryNumber} • ${e.vehiclePlate}',
                    'subtitle': '${e.inspectionType} • ${e.clientName}',
                    'status': e.releaseStatus,
                    'evidences': e.evidences.length,
                  })
              .toList();
          break;
        case 4:
          _items = (await maintenanceRepository.cleanings())
              .map((e) => {
                    'id': e.id,
                    'title': '${e.vehiclePlate} • ${e.type}',
                    'subtitle': e.garageName ?? '',
                    'status': e.status,
                  })
              .toList();
          break;
        case 5:
          _items = (await maintenanceRepository.cfmeDocuments())
              .map((e) => {
                    'id': e.id,
                    'title': e.title,
                    'subtitle': '${e.category}${e.validUntil != null ? ' • até ${e.validUntil}' : ''}',
                    'status': e.status,
                  })
              .toList();
          break;
        case 6:
          _items = (await maintenanceRepository.garages())
              .map((e) => {
                'id': e.id,
                'title': e.name,
                'subtitle': '${e.city ?? ''} • capacidade ${e.capacity ?? 0}',
              })
              .toList();
          break;
        case 7:
          _items = await maintenanceRepository.vehicles();
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

  Future<void> _form() async {
    final a = TextEditingController();
    final b = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: Text('Novo — ${_tabs[_tab]}', style: const TextStyle(color: colorText, fontSize: 15)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: a, style: const TextStyle(color: colorText),
                decoration: const InputDecoration(labelText: 'Identificação / placa')),
            const SizedBox(height: 8),
            TextField(controller: b, style: const TextStyle(color: colorText),
                decoration: const InputDecoration(labelText: 'Descrição / tipo')),
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
    if (saved != true) return;
    try {
      switch (_tab) {
        case 0:
          await maintenanceRepository.createComponentControl({
            'vehiclePlate': a.text.trim(),
            'controlType': b.text.trim(),
          });
          break;
        case 1:
          await maintenanceRepository.createTire({
            'code': a.text.trim(),
            'status': 'AVAILABLE',
          });
          break;
        case 4:
          await maintenanceRepository.createCleaning({
            'vehiclePlate': a.text.trim(),
            'cleaningType': b.text.trim().isEmpty ? 'INTERNAL' : b.text.trim(),
          });
          break;
        case 6:
          await maintenanceRepository.createGarage({'name': a.text.trim(), 'city': b.text.trim()});
          break;
      }
      showMessage(context, 'Item salvo.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _uploadCfme() async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'xlsx', 'xls', 'csv', 'doc', 'docx'],
    );
    if (picked == null || picked.files.isEmpty) return;
    final path = picked.files.single.path;
    if (path == null) return;
    final title = TextEditingController(text: picked.files.single.name);
    final category = TextEditingController(text: 'OUTRO');
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: const Text('Documento CFME', style: TextStyle(color: colorText, fontSize: 15)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: title, style: const TextStyle(color: colorText),
                decoration: const InputDecoration(labelText: 'Título')),
            const SizedBox(height: 8),
            TextField(controller: category, style: const TextStyle(color: colorText),
                decoration: const InputDecoration(labelText: 'Categoria')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
              child: const Text('Enviar')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await maintenanceRepository.uploadCfme(File(path), {
        'title': title.text.trim(),
        'category': category.text.trim(),
      });
      showMessage(context, 'Documento enviado.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tabs[_tab]),
        actions: [
          if (_tab == 5)
            IconButton(onPressed: _uploadCfme, icon: const Icon(Icons.upload_file))
          else if ([0, 1, 4, 6].contains(_tab))
            IconButton(onPressed: _form, icon: const Icon(Icons.add)),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 46,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _tabs.length,
              itemBuilder: (context, index) => Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: Text(_tabs[index], style: const TextStyle(fontSize: 10)),
                  selected: _tab == index,
                  onSelected: (_) {
                    setState(() => _tab = index);
                    _load();
                  },
                ),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : _error != null
                    ? ErrorView(message: _error!, onRetry: _load)
                    : _items.isEmpty
                        ? EmptyView(message: 'Nenhum item em ${_tabs[_tab].toLowerCase()}.')
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _items.length,
                            itemBuilder: (context, index) => _card(_items[index]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _card(Map<String, dynamic> item) {
    final id = item['id']?.toString() ?? '';
    final title = (item['title'] ?? item['plate'] ?? item['name'] ?? 'Item').toString();
    final subtitle = (item['subtitle'] ?? item['model'] ?? '').toString();
    final status = (item['status'] ?? '').toString();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InfoCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(title,
                      style: const TextStyle(color: colorText, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
                if (status.isNotEmpty) StatusBadge.auto(status),
              ],
            ),
            if (subtitle.isNotEmpty)
              Text(subtitle, style: const TextStyle(color: colorMuted, fontSize: 10)),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (_tab == 5)
                  TextButton.icon(
                    onPressed: () => _openUrl(maintenanceRepository.cfmeDownloadUrl(id)),
                    icon: const Icon(Icons.download, size: 15),
                    label: const Text('Baixar'),
                  ),
                if ([1, 2, 4, 5, 6].contains(_tab))
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 17, color: colorMuted),
                    onPressed: () async {
                      final ok = await confirmAction(context,
                          title: 'Excluir', message: 'Deseja excluir "$title"?');
                      if (!ok) return;
                      try {
                        if (_tab == 1) {
                          // TireController expõe DELETE /api/tires/{id}
                          await api.delete('/api/tires/$id');
                        } else if (_tab == 2) {
                          await maintenanceRepository.deleteGateChecklist(id);
                        } else if (_tab == 4) {
                          await maintenanceRepository.deleteCleaning(id);
                        } else if (_tab == 5) {
                          await maintenanceRepository.deleteCfme(id);
                        } else if (_tab == 6) {
                          await maintenanceRepository.deleteGarage(id);
                        }
                        await _load();
                      } on ApiException catch (e) {
                        showMessage(context, e.message, error: true);
                      }
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
