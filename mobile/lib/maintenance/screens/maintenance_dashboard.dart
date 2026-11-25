import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../maintenance/models.dart';
import '../../widgets/common.dart';
import 'maintenance_more_screen.dart';
import 'mechanic_screen.dart';
import 'plans_screen.dart';
import 'work_orders_screen.dart';

class MaintenanceDashboard extends StatefulWidget {
  const MaintenanceDashboard({super.key});

  @override
  State<MaintenanceDashboard> createState() => _MaintenanceDashboardState();
}

class _MaintenanceDashboardState extends State<MaintenanceDashboard> {
  List<WorkOrder> _orders = const [];
  List<MaintenancePlan> _alerts = const [];
  List<ComponentControl> _components = const [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        maintenanceRepository.workOrders(),
        maintenanceRepository.planStatusAll(),
        maintenanceRepository.componentAlerts(),
      ]);
      _orders = results[0] as List<WorkOrder>;
      _alerts = results[1] as List<MaintenancePlan>;
      _components = results[2] as List<ComponentControl>;
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

  void _go(Widget screen) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  int _count(String s) => _orders.where((o) => o.status.toUpperCase() == s).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manutenção'),
        actions: [
          IconButton(
            onPressed: () async {
              try {
                await maintenanceRepository.runPreventiveScan();
                showMessage(context, 'Varredura de preventivas executada.');
                await _load();
              } on ApiException catch (e) {
                showMessage(context, e.message, error: true);
              }
            },
            icon: const Icon(Icons.auto_mode),
          ),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      GridView.count(
                        crossAxisCount: 4,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        children: [
                          _metric('Total', _orders.length, colorText),
                          _metric('Abertas', _count('OPEN') + _count('DRAFT'), colorWarning),
                          _metric('Em execução', _count('IN_PROGRESS'), colorPrimaryLight),
                          _metric('Concluídas', _count('COMPLETED'), colorSuccess),
                        ],
                      ),
                      const SizedBox(height: 20),
                      SectionTitle(title: 'Acesso rápido'),
                      const SizedBox(height: 10),
                      GridView.count(
                        crossAxisCount: 4,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        children: [
                          _action(Icons.build_outlined, 'Ordem de serviço', () => _go(const WorkOrdersScreen())),
                          _action(Icons.schedule_outlined, 'Planos', () => _go(const PlansScreen())),
                          _action(Icons.engineering_outlined, 'Mecânico', () => _go(const MechanicScreen())),
                          _action(Icons.more_horiz, 'Mais', () => _go(const MaintenanceMoreScreen())),
                        ],
                      ),
                      const SizedBox(height: 20),
                      SectionTitle(title: 'Alertas de manutenção'),
                      const SizedBox(height: 8),
                      if (_alerts.isEmpty && _components.isEmpty)
                        const InfoCard(child: EmptyView(message: 'Nenhum alerta de manutenção.', icon: Icons.verified_outlined))
                      else
                        InfoCard(
                          child: Column(
                            children: [
                              ..._alerts.take(5).map((a) => ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    leading: Icon(
                                      a.alertLevel == 'OVERDUE' ? Icons.warning : Icons.schedule,
                                      color: a.alertLevel == 'OVERDUE' ? colorPrimaryLight : colorWarning,
                                      size: 19,
                                    ),
                                    title: Text('${a.vehiclePlate} • ${a.taskName}',
                                        style: const TextStyle(color: colorText, fontSize: 12)),
                                    subtitle: Text(a.message ?? a.alertLevel,
                                        style: const TextStyle(color: colorMuted, fontSize: 10)),
                                  )),
                              ..._components.take(4).map((c) => ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    leading: const Icon(Icons.settings_outlined, color: colorMuted, size: 19),
                                    title: Text('${c.vehiclePlate} • ${c.controlType}',
                                        style: const TextStyle(color: colorText, fontSize: 12)),
                                    subtitle: Text('${c.alertLevel} • restam ${c.kmRemaining ?? 0} km',
                                        style: const TextStyle(color: colorMuted, fontSize: 10)),
                                  )),
                            ],
                          ),
                        ),
                      const SizedBox(height: 16),
                      SectionTitle(title: 'Últimas ordens de serviço'),
                      const SizedBox(height: 8),
                      if (_orders.isEmpty)
                        const InfoCard(child: EmptyView(message: 'Nenhuma OS encontrada.'))
                      else
                        ..._orders.take(4).map((o) => InfoCard(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(o.number.isNotEmpty ? o.number : 'OS',
                                            style: const TextStyle(
                                                color: colorText, fontSize: 12, fontWeight: FontWeight.bold)),
                                        Text('${o.vehiclePlate ?? '-'} • ${o.description ?? ''}',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(color: colorMuted, fontSize: 10)),
                                      ],
                                    ),
                                  ),
                                  StatusBadge.auto(o.statusLabel),
                                ],
                              ),
                            )),
                    ],
                  ),
                ),
    );
  }

  Widget _metric(String label, int value, Color color) {
    return InfoCard(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value.toString(), style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: colorMuted, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _action(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: colorSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: colorBorder),
        ),
        child: Column(
          children: [
            Icon(icon, color: colorPrimaryLight, size: 22),
            const SizedBox(height: 6),
            Text(label, textAlign: TextAlign.center,
                style: const TextStyle(color: colorText, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}
