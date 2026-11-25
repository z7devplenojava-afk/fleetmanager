import 'package:flutter/material.dart';

import '../../core/locator.dart';
import '../../maintenance/screens/maintenance_shell.dart';
import '../../screens/module_chooser.dart';
import '../../widgets/common.dart';
import 'cash_flow_screen.dart';
import 'cost_centers_screen.dart';
import 'finance_dashboard.dart';
import 'more_finance_screen.dart';
import 'payables_screen.dart';
import 'receivables_screen.dart';
import 'reports_screen.dart';

class FinanceShell extends StatefulWidget {
  const FinanceShell({super.key});

  @override
  State<FinanceShell> createState() => _FinanceShellState();
}

class _FinanceShellState extends State<FinanceShell> {
  int _index = 0;
  static const _titles = ['Financeiro', 'Contas a pagar', 'Contas a receber', 'Fluxo de caixa', 'Mais'];

  final _pages = const [
    FinanceDashboard(),
    PayablesScreen(),
    ReceivablesScreen(),
    CashFlowScreen(),
    MoreFinanceScreen(),
  ];

  void _push(Widget screen) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          IconButton(
            tooltip: 'Relatórios',
            onPressed: () => _push(const ReportsScreen()),
            icon: const Icon(Icons.assessment_outlined),
          ),
        ],
      ),
      drawer: Drawer(
        backgroundColor: colorSurface,
        child: SafeArea(
          child: ListView(
            children: [
              Padding(
                padding: const EdgeInsets.all(18),
                child: Text(
                  session.user?.displayName ?? 'Financeiro',
                  style: const TextStyle(color: colorText, fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
              const Divider(color: colorBorder),
              _item(Icons.account_tree_outlined, 'Centros de custo', () => _push(const CostCentersScreen())),
              _item(Icons.assessment_outlined, 'Relatórios', () => _push(const ReportsScreen())),
              _item(Icons.account_balance_outlined, 'Bancos', () => _push(const MoreFinanceScreen(initialTab: 0))),
              _item(Icons.location_city_outlined, 'Agências', () => _push(const MoreFinanceScreen(initialTab: 1))),
              _item(Icons.people_outline, 'Fornecedores', () => _push(const MoreFinanceScreen(initialTab: 2))),
              _item(Icons.account_balance_wallet_outlined, 'Conciliação bancária',
                  () => _push(const MoreFinanceScreen(initialTab: 3))),
              _item(Icons.qr_code_scanner, 'Boletos DDA', () => _push(const MoreFinanceScreen(initialTab: 4))),
              _item(Icons.shopping_cart_outlined, 'Ordens de compra',
                  () => _push(const MoreFinanceScreen(initialTab: 5))),
              _item(Icons.description_outlined, 'Medições', () => _push(const MoreFinanceScreen(initialTab: 6))),
              _item(Icons.swap_horiz, 'Transações', () => _push(const MoreFinanceScreen(initialTab: 7))),
              if (session.user?.canMaintain == true)
                _item(Icons.build_outlined, 'Gestão de Manutenção',
                    () => _push(const MaintenanceShell())),
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
          NavigationDestination(icon: Icon(Icons.payments_outlined), selectedIcon: Icon(Icons.payments), label: 'Pagar'),
          NavigationDestination(
              icon: Icon(Icons.account_balance_wallet_outlined),
              selectedIcon: Icon(Icons.account_balance_wallet),
              label: 'Receber'),
          NavigationDestination(
              icon: Icon(Icons.show_chart), selectedIcon: Icon(Icons.trending_up), label: 'Fluxo'),
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
