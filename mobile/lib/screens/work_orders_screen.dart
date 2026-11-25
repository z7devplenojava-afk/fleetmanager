import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../core/offline_queue.dart';
import '../models/models.dart';
import '../widgets/common.dart';

class WorkOrdersScreen extends StatefulWidget {
  const WorkOrdersScreen({super.key});

  @override
  State<WorkOrdersScreen> createState() => _WorkOrdersScreenState();
}

class _WorkOrdersScreenState extends State<WorkOrdersScreen> {
  final _imagePicker = ImagePicker();
  List<WorkOrder> _items = const [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _items = await workOrderService.all();
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

  Future<void> _openForm() async {
    final vehicleController = TextEditingController();
    final kmController = TextEditingController();
    final descriptionController = TextEditingController();
    final notesController = TextEditingController();
    String urgency = 'MEDIA';
    List<File> photos = <File>[];

    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: colorSurface,
          title: const Text('Nova ordem de serviço', style: TextStyle(color: colorText, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: vehicleController,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Placa / veículo'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: kmController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'KM atual'),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  initialValue: urgency,
                  dropdownColor: colorSurfaceAlt,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Urgência'),
                  items: ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => urgency = v ?? 'MEDIA'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descriptionController,
                  maxLines: 4,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Descrição da anomalia'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: notesController,
                  maxLines: 2,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Observações'),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () async {
                    final picked = await _imagePicker.pickMultiImage(imageQuality: 65);
                    if (picked.isNotEmpty) {
                      setDialogState(() => photos.addAll(picked.map((e) => File(e.path))));
                    }
                  },
                  icon: const Icon(Icons.photo_library, size: 16),
                  label: Text(photos.isEmpty ? 'Anexar fotos' : '${photos.length} foto(s)'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
              child: const Text('Abrir OS'),
            ),
          ],
        ),
      ),
    );
    if (saved != true) return;
    if (vehicleController.text.trim().isEmpty || descriptionController.text.trim().isEmpty) {
      showMessage(context, 'Informe veículo e descrição.', error: true);
      return;
    }
    final payload = <String, dynamic>{
      'maintenanceType': 'CORRETIVA',
      'status': 'OPEN',
      'laborType': 'INTERNAL',
      'driverName': session.user?.displayName,
      'requestDate': DateTime.now().toIso8601String(),
      'requesterName': session.user?.displayName,
      'requesterId': session.user?.employeeId ?? session.user?.id,
      'stopReason': 'Abertura de Chamado pelo Condutor/Motorista',
      'odometerIn': double.tryParse(kmController.text.replaceAll(',', '.')),
      'anomaliesDescription': descriptionController.text.trim(),
      'notes': notesController.text.trim(),
      'vehiclePlate': vehicleController.text.trim(),
      'urgency': urgency,
    };
    try {
      final created = await workOrderService.create(payload);
      final id = created['id']?.toString();
      if (id != null && id.isNotEmpty && photos.isNotEmpty) {
        await workOrderService.uploadPhotos(id, photos);
      }
      showMessage(context, 'Ordem de serviço aberta.');
      await _load();
    } on ApiException catch (e) {
      if (e.statusCode == 0) {
        await offlineQueue.add(
          OfflineAction(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            label: 'Ordem de serviço',
            method: 'POST',
            path: '/api/fleet-work-orders',
            body: payload,
          ),
        );
        showMessage(context, 'Sem conexão: OS salva para sincronizar.');
      } else {
        showMessage(context, e.message, error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ordens de Serviço'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
          IconButton(onPressed: _openForm, icon: const Icon(Icons.add)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openForm,
        backgroundColor: colorPrimary,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const EmptyView(message: 'Nenhuma OS encontrada.', icon: Icons.build_outlined)
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final o = _items[index];
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
                                      child: Text(
                                        o.number != null ? 'OS ${o.number}' : 'Ordem de serviço',
                                        style: const TextStyle(
                                            color: colorText, fontSize: 13, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    StatusBadge.auto(o.status),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(o.description,
                                    maxLines: 3,
                                    style: const TextStyle(color: colorMuted, fontSize: 12)),
                                const SizedBox(height: 6),
                                if (o.vehiclePlate != null)
                                  Text('Veículo: ${o.vehiclePlate}',
                                      style: const TextStyle(color: colorMuted, fontSize: 11)),
                                const SizedBox(height: 8),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton.icon(
                                    onPressed: () async {
                                      final uri = Uri.parse(workOrderService.pdfUrl(o.id));
                                      if (await canLaunchUrl(uri)) {
                                        await launchUrl(uri, mode: LaunchMode.externalApplication);
                                      }
                                    },
                                    icon: const Icon(Icons.picture_as_pdf, size: 15),
                                    label: const Text('Ver PDF'),
                                  ),
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
