import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/locator.dart';
import '../../screens/module_chooser.dart';
import '../../widgets/common.dart';
import 'maintenance_dashboard.dart';
import 'maintenance_more_screen.dart';
import 'mechanic_screen.dart';
import 'plans_screen.dart';
import 'work_orders_screen.dart';

class MaintenanceShell extends StatefulWidget {
  const MaintenanceShell({super.key});

  @override
  State<MaintenanceShell> createState() => _MaintenanceShellState();
}

class _MaintenanceShellState extends State<MaintenanceShell> {
  int _index = 0;
  static const _titles = ['Manutenção', 'Ordens de serviço', 'Planos', 'Mecânico', 'Mais'];

  final _pages = const [
    MaintenanceDashboard(),
    WorkOrdersScreen(),
    PlansScreen(),
    MechanicScreen(),
    MaintenanceMoreScreen(),
  ];

  void _push(Widget screen) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  Future<void> _report() async {
    final uri = Uri.parse(maintenanceRepository.reportUrl());
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          IconButton(onPressed: _report, icon: const Icon(Icons.assessment_outlined)),
        ],
      ),
      drawer: Drawer(
        backgroundColor: colorSurface,
        child: SafeArea(
          child: ListView(
            children: [
              Padding(
                padding: const EdgeInsets.all(18),
                child: Text(session.user?.displayName ?? 'Manutenção',
                    style: const TextStyle(color: colorText, fontSize: 15, fontWeight: FontWeight.bold)),
              ),
              const Divider(color: colorBorder),
              _item(Icons.schedule_outlined, 'Planos de manutenção', () => _push(const PlansScreen())),
              _item(Icons.engineering_outlined, 'Área do mecânico', () => _push(const MechanicScreen())),
              _item(Icons.settings_outlined, 'Componentes', () => _push(const MaintenanceMoreScreen(initialTab: 0))),
              _item(Icons.tire_repair_outlined, 'Pneus', () => _push(const MaintenanceMoreScreen(initialTab: 1))),
              _item(Icons.fact_check_outlined, 'Checklists', () => _push(const MaintenanceMoreScreen(initialTab: 2))),
              _item(Icons.description_outlined, 'Laudos de inspeção', () => _push(const MaintenanceMoreScreen(initialTab: 3))),
              _item(Icons.cleaning_services_outlined, 'Limpeza', () => _push(const MaintenanceMoreScreen(initialTab: 4))),
              _item(Icons.article_outlined, 'Certificações CFME', () => _push(const MaintenanceMoreScreen(initialTab: 5))),
              _item(Icons.garage_outlined, 'Garagens', () => _push(const MaintenanceMoreScreen(initialTab: 6))),
              _item(Icons.local_shipping_outlined, 'Veículos', () => _push(const MaintenanceMoreScreen(initialTab: 7))),
              _item(Icons.apps_rounded, 'Alternar Módulo / Início',
                  () => Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const ModuleChooser()), (route) => false)),
            ],
          ),
        ),
      ),
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        backgroundColor: colorSurface,
        indicatorColor: colorPrimary.withValues(alpha: 0.25),
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Início'),
          NavigationDestination(icon: Icon(Icons.build_outlined), selectedIcon: Icon(Icons.build), label: 'OS'),
          NavigationDestination(icon: Icon(Icons.schedule_outlined), selectedIcon: Icon(Icons.schedule), label: 'Planos'),
          NavigationDestination(icon: Icon(Icons.engineering_outlined), selectedIcon: Icon(Icons.engineering), label: 'Mecânico'),
          NavigationDestination(icon: Icon(Icons.more_horiz), selectedIcon: Icon(Icons.more), label: 'Mais'),
        ],
      ),
    );
  }

  Widget _item(IconData icon, String label, VoidCallback onTap) {
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
