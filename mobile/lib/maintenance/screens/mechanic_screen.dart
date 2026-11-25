import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../maintenance/models.dart';
import '../../widgets/common.dart';

class MechanicScreen extends StatefulWidget {
  const MechanicScreen({super.key});

  @override
  State<MechanicScreen> createState() => _MechanicScreenState();
}

class _MechanicScreenState extends State<MechanicScreen> {
  static const _columns = [
    ('A FAZER', ['OPEN', 'DRAFT', 'APPROVED', 'PENDING_APPROVAL']),
    ('EM ANDAMENTO', ['IN_PROGRESS']),
    ('AGUARDANDO PEÇA', ['WAITING_PARTS']),
    ('EXTERNO', ['EXTERNAL']),
    ('FINALIZADO', ['COMPLETED']),
  ];

  List<WorkOrder> _orders = const [];
  String _column = 'A FAZER';
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _orders = await maintenanceRepository.workOrders();
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

  List<WorkOrder> get _filtered {
    final statuses = _columns.firstWhere((c) => c.$1 == _column).$2;
    return _orders.where((o) => statuses.contains(o.status.toUpperCase())).toList();
  }

  Future<void> _action(WorkOrder order, String action) async {
    try {
      switch (action) {
        case 'assign':
          await maintenanceRepository.assignMechanic(
              order.id, api.session.user?.employeeId ?? api.session.user?.id ?? '');
          break;
        case 'approve':
          await maintenanceRepository.approveExternal(order.id);
          break;
        case 'reject':
          final reason = TextEditingController();
          final ok = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              backgroundColor: colorSurface,
              title: const Text('Motivo da recusa', style: TextStyle(color: colorText, fontSize: 15)),
              content: TextField(controller: reason, style: const TextStyle(color: colorText)),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
                ElevatedButton(onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
                    child: const Text('Recusar')),
              ],
            ),
          );
          if (ok != true || reason.text.trim().isEmpty) return;
          await maintenanceRepository.rejectExternal(order.id, reason.text.trim());
          break;
        case 'note':
          final note = TextEditingController();
          final ok = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              backgroundColor: colorSurface,
              title: const Text('Nota de execução', style: TextStyle(color: colorText, fontSize: 15)),
              content: TextField(controller: note, maxLines: 3, style: const TextStyle(color: colorText)),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
                ElevatedButton(onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
                    child: const Text('Salvar')),
              ],
            ),
          );
          if (ok != true || note.text.trim().isEmpty) return;
          await maintenanceRepository.addHistoryNote(order.id, note.text.trim());
          break;
        case 'photos':
          final picked = await FilePicker.platform.pickFiles(allowMultiple: true, type: FileType.image);
          if (picked != null) {
            await maintenanceRepository.uploadPhotos(order.id, picked.files
                .where((f) => f.path != null)
                .map((f) => File(f.path!))
                .toList());
          }
          break;
        default:
          if (action == 'COMPLETED') {
            final performed = TextEditingController(text: order.maintenancePerformed ?? '');
            final ok = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                backgroundColor: colorSurface,
                title: const Text('Manutenção realizada', style: TextStyle(color: colorText, fontSize: 15)),
                content: TextField(controller: performed, maxLines: 4,
                    style: const TextStyle(color: colorText)),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Área do mecânico')),
      body: Column(
        children: [
          SizedBox(
            height: 46,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: _columns
                  .map((c) => Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(c.$1, style: const TextStyle(fontSize: 10)),
                          selected: _column == c.$1,
                          onSelected: (_) => setState(() => _column = c.$1),
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
                    : _filtered.isEmpty
                        ? EmptyView(message: 'Nenhuma OS em ${_column.toLowerCase()}.')
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filtered.length,
                            itemBuilder: (context, index) {
                              final o = _filtered[index];
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
                                            child: Text('${o.number} • ${o.vehiclePlate ?? '-'}',
                                                style: const TextStyle(
                                                    color: colorText,
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.bold)),
                                          ),
                                          StatusBadge.auto(o.statusLabel),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(o.description ?? '',
                                          maxLines: 2,
                                          style: const TextStyle(color: colorMuted, fontSize: 11)),
                                      const SizedBox(height: 8),
                                      Wrap(
                                        spacing: 6,
                                        children: [
                                          _button(o, Icons.person_add, 'Assumir', 'assign'),
                                          if (o.status.toUpperCase() != 'IN_PROGRESS')
                                            _button(o, Icons.play_arrow, 'Iniciar', 'IN_PROGRESS'),
                                          _button(o, Icons.inventory_2, 'Peça', 'WAITING_PARTS'),
                                          _button(o, Icons.note_add, 'Nota', 'note'),
                                          _button(o, Icons.photo_camera, 'Fotos', 'photos'),
                                          if (o.laborType?.toUpperCase() == 'EXTERNAL')
                                            _button(o, Icons.check, 'Aprovar', 'approve'),
                                          if (o.laborType?.toUpperCase() == 'EXTERNAL')
                                            _button(o, Icons.close, 'Recusar', 'reject'),
                                          _button(o, Icons.done_all, 'Concluir', 'COMPLETED'),
                                        ],
                                      ),
                                    ],
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

  Widget _button(WorkOrder order, IconData icon, String label, String action) {
    return OutlinedButton.icon(
      onPressed: () => _action(order, action),
      icon: Icon(icon, size: 13),
      label: Text(label, style: const TextStyle(fontSize: 10)),
    );
  }
}
