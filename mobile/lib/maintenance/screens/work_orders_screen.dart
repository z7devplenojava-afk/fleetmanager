import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../core/offline_queue.dart';
import '../../maintenance/models.dart';
import '../../widgets/common.dart';

class WorkOrdersScreen extends StatefulWidget {
  const WorkOrdersScreen({super.key});

  @override
  State<WorkOrdersScreen> createState() => _WorkOrdersScreenState();
}

class _WorkOrdersScreenState extends State<WorkOrdersScreen> {
  final _searchController = TextEditingController();
  List<WorkOrder> _items = const [];
  String _status = 'TODAS';
  String _type = 'TODOS';
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _items = await maintenanceRepository.workOrders(
        search: _searchController.text.trim(),
        status: _status == 'TODAS' ? null : _status,
        type: _type == 'TODOS' ? null : _type,
      );
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _form({WorkOrder? order}) async {
    final plate = TextEditingController(text: order?.vehiclePlate ?? '');
    final description = TextEditingController(text: order?.description ?? '');
    final odometer = TextEditingController(text: order?.odometerIn?.toStringAsFixed(0) ?? '');
    final notes = TextEditingController(text: order?.raw['notes']?.toString() ?? '');
    String type = order?.type ?? 'CORRETIVA';
    String priority = _priorityFromApi(order?.priority);
    String labor = (order?.laborType ?? 'INTERNAL').toUpperCase();
    List<File> photos = <File>[];

    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: colorSurface,
          title: Text(order == null ? 'Nova ordem de serviço' : 'Editar ${order.number}',
              style: const TextStyle(color: colorText, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: plate, style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Placa / veículo')),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  dropdownColor: colorSurfaceAlt,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Tipo'),
                  items: ['CORRETIVA', 'PREVENTIVA', 'PREDITIVA', 'INSPECAO', 'LUBRIFICACAO', 'LIMPEZA']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => type = v ?? 'CORRETIVA'),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: priority,
                  dropdownColor: colorSurfaceAlt,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Prioridade'),
                  items: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => priority = v ?? 'MEDIUM'),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: labor,
                  dropdownColor: colorSurfaceAlt,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Mão de obra'),
                  items: ['INTERNAL', 'EXTERNAL']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => labor = v ?? 'INTERNAL'),
                ),
                const SizedBox(height: 8),
                TextField(controller: odometer, keyboardType: TextInputType.number,
                    style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Odômetro / KM atual')),
                const SizedBox(height: 8),
                TextField(controller: description, maxLines: 4,
                    style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Anomalias / serviços solicitados')),
                const SizedBox(height: 8),
                TextField(controller: notes, maxLines: 2, style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Observações')),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () async {
                    final picked = await FilePicker.platform.pickFiles(
                      allowMultiple: true,
                      type: FileType.image,
                    );
                    if (picked != null) {
                      setDialogState(() => photos.addAll(picked.files
                          .where((f) => f.path != null)
                          .map((f) => File(f.path!))));
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
            ElevatedButton(onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
                child: const Text('Salvar')),
          ],
        ),
      ),
    );
    if (saved != true) return;
    if (plate.text.trim().isEmpty || description.text.trim().isEmpty) {
      showMessage(context, 'Informe veículo e descrição.', error: true);
      return;
    }
    final payload = <String, dynamic>{
      'vehiclePlate': plate.text.trim(),
      'maintenanceType': type,
      'priority': priority,
      'laborType': labor,
      'odometerIn': int.tryParse(odometer.text.replaceAll(',', '.')) ?? 0,
      'anomaliesDescription': description.text.trim(),
      'notes': notes.text.trim(),
      'status': order?.status ?? 'OPEN',
      'requestDate': DateTime.now().toIso8601String(),
      'stopDate': DateTime.now().toIso8601String(),
      'stopTime': '${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}',
    };
    try {
      final Map<String, dynamic> result;
      if (order == null) {
        result = await maintenanceRepository.createWorkOrder(payload);
      } else {
        await maintenanceRepository.updateWorkOrder(order.id, payload);
        result = {'id': order.id};
      }
      final id = result['id']?.toString();
      if (id != null && id.isNotEmpty) await maintenanceRepository.uploadPhotos(id, photos);
      showMessage(context, 'Ordem de serviço salva.');
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

  Future<void> _detail(WorkOrder order) async {
    final action = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: colorSurface,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Text('${order.number} • ${order.vehiclePlate ?? '-'}',
                        style: const TextStyle(color: colorText, fontSize: 15, fontWeight: FontWeight.bold)),
                  ),
                  StatusBadge.auto(order.statusLabel),
                ],
              ),
            ),
            if (order.description != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(order.description!,
                    style: const TextStyle(color: colorMuted, fontSize: 12)),
              ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _detailAction(Icons.edit, 'Editar', 'edit'),
                _detailAction(Icons.picture_as_pdf, 'PDF', 'pdf'),
                _detailAction(Icons.check_circle_outline, 'Iniciar', 'IN_PROGRESS'),
                _detailAction(Icons.inventory_2_outlined, 'Aguardar peça', 'WAITING_PARTS'),
                _detailAction(Icons.done_all, 'Concluir', 'COMPLETED'),
                _detailAction(Icons.verified_outlined, 'Aprovar externo', 'approve'),
                _detailAction(Icons.cancel_outlined, 'Cancelar', 'CANCELLED'),
                if (order.status.toUpperCase() == 'COMPLETED')
                  _detailAction(Icons.content_copy, 'Duplicar', 'duplicate'),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
    if (action == null) return;
    try {
      switch (action) {
        case 'edit':
          await _form(order: order);
          break;
        case 'pdf':
          final uri = Uri.parse(maintenanceRepository.pdfUrl(order.id));
          if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
          break;
        case 'approve':
          await maintenanceRepository.approveExternal(order.id);
          break;
        case 'duplicate':
          await maintenanceRepository.duplicateWorkOrder(order.id);
          break;
        default:
          if (action == 'COMPLETED') {
            final performed = TextEditingController(text: order.maintenancePerformed ?? '');
            final ok = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                backgroundColor: colorSurface,
                title: const Text('Manutenção realizada',
                    style: TextStyle(color: colorText, fontSize: 15)),
                content: TextField(controller: performed, maxLines: 4,
                    style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Descreva o que foi feito')),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
                  ElevatedButton(onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
                      child: const Text('Concluir')),
                ],
              ),
            );
            if (ok != true || performed.text.trim().isEmpty) return;
            await maintenanceRepository.completeWorkOrder(order.id, performed.text.trim());
          } else {
            await maintenanceRepository.updateStatus(order.id, action);
          }
      }
      showMessage(context, 'Ação executada.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Widget _detailAction(IconData icon, String label, String value) {
    return SizedBox(
      width: 92,
      child: InkWell(
        onTap: () => Navigator.pop(context, value),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: colorSurfaceAlt,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: colorBorder),
              ),
              child: Icon(icon, color: colorPrimaryLight, size: 20),
            ),
            const SizedBox(height: 4),
            Text(label, textAlign: TextAlign.center,
                style: const TextStyle(color: colorMuted, fontSize: 9)),
          ],
        ),
      ),
    );
  }

  static String _priorityFromApi(String? priority) {
    switch ((priority ?? '').toUpperCase()) {
      case 'LOW': return 'LOW';
      case 'HIGH': return 'HIGH';
      case 'URGENT': return 'URGENT';
      default: return 'MEDIUM';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ordens de serviço')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _form(),
        backgroundColor: colorPrimary,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              onSubmitted: (_) => _load(),
              style: const TextStyle(color: colorText),
              decoration: const InputDecoration(
                hintText: 'Buscar OS, placa, mecânico',
                prefixIcon: Icon(Icons.search, color: colorMuted),
              ),
            ),
          ),
          SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                ...['TODAS', 'OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED']
                    .map((s) => Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ChoiceChip(
                            label: Text(s, style: const TextStyle(fontSize: 9)),
                            selected: _status == s,
                            onSelected: (_) {
                              setState(() => _status = s);
                              _load();
                            },
                          ),
                        )),
              ],
            ),
          ),
          SizedBox(
            height: 34,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: ['TODOS', 'CORRETIVA', 'PREVENTIVA', 'INSPECAO']
                  .map((s) => Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: FilterChip(
                          label: Text(s, style: const TextStyle(fontSize: 9)),
                          selected: _type == s,
                          onSelected: (_) {
                            setState(() => _type = s);
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
                        ? const EmptyView(message: 'Nenhuma ordem de serviço.', icon: Icons.build_outlined)
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                            itemCount: _items.length,
                            itemBuilder: (context, index) {
                              final o = _items[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: InkWell(
                                  onTap: () => _detail(o),
                                  child: InfoCard(
                                    padding: const EdgeInsets.all(14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(o.number.isNotEmpty ? o.number : 'OS',
                                                  style: const TextStyle(
                                                      color: colorText,
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.bold)),
                                            ),
                                            StatusBadge.auto(o.statusLabel),
                                          ],
                                        ),
                                        const SizedBox(height: 5),
                                        Text('${o.vehiclePlate ?? '-'} • ${o.type} • ${o.priority}',
                                            style: const TextStyle(color: colorMuted, fontSize: 11)),
                                        if (o.description != null)
                                          Text(o.description!,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(color: colorMuted, fontSize: 11)),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            if (o.totalCost != null)
                                              Text('R\$ ${o.totalCost!.toStringAsFixed(2)}',
                                                  style: const TextStyle(
                                                      color: colorPrimaryLight, fontSize: 12)),
                                            const Spacer(),
                                            const Icon(Icons.chevron_right, color: colorMuted, size: 18),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
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
