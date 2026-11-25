import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../maintenance/models.dart';
import '../../widgets/common.dart';
import 'work_orders_screen.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  List<MaintenancePlan> _plans = const [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _plans = await maintenanceRepository.planStatusAll();
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

  Future<void> _form() async {
    final plate = TextEditingController();
    final task = TextEditingController();
    final intervalKm = TextEditingController(text: '10000');
    final intervalDays = TextEditingController(text: '180');
    final executionKm = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: const Text('Plano / execução de manutenção',
            style: TextStyle(color: colorText, fontSize: 15)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: plate, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Placa do veículo')),
              TextField(controller: task, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Serviço / tarefa')),
              const SizedBox(height: 8),
              TextField(controller: intervalKm, keyboardType: TextInputType.number,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Intervalo (KM)')),
              const SizedBox(height: 8),
              TextField(controller: intervalDays, keyboardType: TextInputType.number,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Intervalo (dias)')),
              const SizedBox(height: 8),
              TextField(controller: executionKm, keyboardType: TextInputType.number,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'KM da execução')),
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
    if (saved != true || task.text.trim().isEmpty) return;
    try {
      await maintenanceRepository.createPlan({
        'vehiclePlate': plate.text.trim(),
        'taskName': task.text.trim(),
        'intervalKm': int.tryParse(intervalKm.text) ?? 10000,
        'intervalDays': int.tryParse(intervalDays.text) ?? 180,
        'lastExecutionKm': int.tryParse(executionKm.text) ?? 0,
        'lastExecutionDate': DateTime.now().toString().substring(0, 10),
        'isActive': true,
      });
      showMessage(context, 'Plano registrado.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Planos de manutenção')),
      floatingActionButton: FloatingActionButton(
        onPressed: _form,
        backgroundColor: colorPrimary,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : _plans.isEmpty
                  ? const EmptyView(message: 'Nenhum plano cadastrado.', icon: Icons.schedule_outlined)
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                      itemCount: _plans.length,
                      itemBuilder: (context, index) {
                        final p = _plans[index];
                        final overdue = p.alertLevel == 'OVERDUE';
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
                                      child: Text('${p.vehiclePlate} • ${p.taskName}',
                                          style: const TextStyle(
                                              color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
                                    ),
                                    StatusBadge.auto(overdue ? 'VENCIDA' : p.alertLevel),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text('Intervalo: ${p.intervalKm ?? 0} km / ${p.intervalDays ?? 0} dias',
                                    style: const TextStyle(color: colorMuted, fontSize: 11)),
                                if (p.nextDueKm != null)
                                  Text('Próxima: ${p.nextDueKm} km${p.nextDueDate != null ? ' • ${p.nextDueDate}' : ''}',
                                      style: const TextStyle(color: colorMuted, fontSize: 11)),
                                if (p.message != null)
                                  Text(p.message!,
                                      style: TextStyle(
                                          color: overdue ? colorPrimaryLight : colorMuted, fontSize: 11)),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    TextButton.icon(
                                      onPressed: () => Navigator.of(context).push(
                                        MaterialPageRoute(builder: (_) => const WorkOrdersScreen()),
                                      ),
                                      icon: const Icon(Icons.build_outlined, size: 15),
                                      label: const Text('Criar OS'),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 17, color: colorMuted),
                                      onPressed: () async {
                                        final ok = await confirmAction(context,
                                            title: 'Excluir plano', message: 'Excluir ${p.taskName}?');
                                        if (!ok) return;
                                        try {
                                          await maintenanceRepository.deletePlan(p.id);
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
                      },
                    ),
    );
  }
}
