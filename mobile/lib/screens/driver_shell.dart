import 'package:flutter/material.dart';

import '../core/locator.dart';
import '../finance/screens/finance_shell.dart';
import '../maintenance/screens/maintenance_shell.dart';
import '../widgets/common.dart';
import 'checklist_screen.dart';
import 'dashboard_screen.dart';
import 'employee_portal_screen.dart';
import 'fines_screen.dart';
import 'messages_screen.dart';
import 'module_chooser.dart';
import 'operations_screen.dart';
import 'point_screen.dart';
import 'profile_screen.dart';
import 'schedules_screen.dart';
import 'trip_execution_screen.dart';
import 'work_orders_screen.dart';

class DriverShell extends StatefulWidget {
  const DriverShell({super.key});

  @override
  State<DriverShell> createState() => _DriverShellState();
}

class _DriverShellState extends State<DriverShell> {
  int _index = 0;
  int _pending = 0;

  static const _titles = ['Início', 'Checklist', 'Escalas', 'Ordens de Serviço', 'Perfil'];

  final _pages = const [
    DashboardScreen(),
    ChecklistScreen(),
    SchedulesScreen(),
    WorkOrdersScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _refreshPending();
  }

  Future<void> _refreshPending() async {
    final count = await offlineQueue.count;
    if (mounted) setState(() => _pending = count);
  }

  Future<void> _sync() async {
    final result = await offlineQueue.flush();
    showMessage(context, 'Sincronizados: ${result.sent}. Pendentes: ${result.remaining}.');
    await _refreshPending();
  }

  void _push(Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          if (_pending > 0)
            Stack(
              alignment: Alignment.center,
              children: [
                IconButton(onPressed: _sync, icon: const Icon(Icons.sync)),
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(color: colorPrimary, shape: BoxShape.circle),
                    child: Text('$_pending', style: const TextStyle(fontSize: 9, color: Colors.white)),
                  ),
                ),
              ],
            ),
        ],
      ),
      drawer: Drawer(
        backgroundColor: colorSurface,
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.directions_bus, color: colorPrimaryLight, size: 34),
                    const SizedBox(height: 8),
                    Text(session.user?.displayName ?? 'Motorista',
                        style: const TextStyle(color: colorText, fontSize: 15, fontWeight: FontWeight.bold)),
                    Text(session.user?.email ?? '',
                        style: const TextStyle(color: colorMuted, fontSize: 11)),
                  ],
                ),
              ),
              const Divider(color: colorBorder),
              _drawerItem(Icons.schedule, 'Ponto eletrônico', () => _push(const PointScreen())),
              _drawerItem(Icons.chat_bubble_outline, 'Mensagens', () => _push(const MessagesScreen())),
              _drawerItem(Icons.description_outlined, 'Portal do empregado',
                  () => _push(const EmployeePortalScreen())),
              _drawerItem(Icons.local_police_outlined, 'Minhas multas', () => _push(const FinesScreen())),
              _drawerItem(Icons.navigation_outlined, 'Executar viagem',
                  () => _push(const TripExecutionScreen())),
              _drawerItem(Icons.route_outlined, 'Códigos / Parte diária / Horas',
                  () => _push(const OperationsScreen())),
              if (session.user?.canFinance == true)
                _drawerItem(Icons.account_balance_wallet_outlined, 'Módulo Financeiro',
                    () => _push(const FinanceShell())),
              if (session.user?.canMaintain == true)
                _drawerItem(Icons.build_outlined, 'Gestão de Manutenção',
                    () => _push(const MaintenanceShell())),
              _drawerItem(Icons.apps_rounded, 'Alternar Módulo / Início',
                  () => Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const ModuleChooser()), (route) => false)),
              _drawerItem(Icons.sync, 'Sincronizar dados ($_pending)', _sync),
            ],
          ),
        ),
      ),
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        backgroundColor: colorSurface,
        indicatorColor: colorPrimary.withValues(alpha: 0.25),
        selectedIndex: _index,
        onDestinationSelected: (index) async {
          setState(() => _index = index);
          await _refreshPending();
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
          NavigationDestination(
              icon: Icon(Icons.checklist_outlined), selectedIcon: Icon(Icons.checklist), label: 'Checklist'),
          NavigationDestination(
              icon: Icon(Icons.calendar_month_outlined),
              selectedIcon: Icon(Icons.calendar_month),
              label: 'Escalas'),
          NavigationDestination(
              icon: Icon(Icons.build_outlined), selectedIcon: Icon(Icons.build), label: 'OS'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }

  Widget _drawerItem(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: colorPrimaryLight, size: 20),
      title: Text(label, style: const TextStyle(color: colorText, fontSize: 13)),
      onTap: () {
        Navigator.pop(context);
        onTap();
      },
    );
  }
}
