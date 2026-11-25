import 'package:flutter/material.dart';

import '../core/locator.dart';
import '../finance/screens/finance_shell.dart';
import '../maintenance/screens/maintenance_shell.dart';
import '../widgets/common.dart';
import 'driver_shell.dart';
import 'employee_portal_screen.dart';
import 'login_screen.dart';

/// Tela central de seleção de módulos do FluxBus Mobile.
class ModuleChooser extends StatelessWidget {
  const ModuleChooser({super.key});

  @override
  Widget build(BuildContext context) {
    final user = session.user;
    final cards = <Widget>[];

    // Módulo 1: Operações & Motorista (Checklist, Escalas, Viagens, OS, Ponto)
    if (user?.canOperate == true) {
      cards.add(_card(
        icon: Icons.directions_bus_outlined,
        color: const Color(0xFF10B981),
        title: 'Operações & Área do Motorista',
        subtitle: 'Checklist de vistoria, escalas, viagens, OS e ponto',
        screen: const DriverShell(),
      ));
    }

    // Módulo 2: Gestão de Manutenção (OS, Planos Preventivos, Pneus, Mecânico)
    if (user?.canMaintain == true || user?.isAdmin == true) {
      cards.add(_card(
        icon: Icons.build_circle_outlined,
        color: const Color(0xFF3B82F6),
        title: 'Gestão de Manutenção & Frota',
        subtitle: 'Ordens de serviço (OS), planos preventivos, oficina e pneus',
        screen: const MaintenanceShell(),
      ));
    }

    // Módulo 3: Financeiro (Contas a Pagar/Receber, Fluxo de Caixa, DRE)
    if (user?.canFinance == true || user?.isAdmin == true) {
      cards.add(_card(
        icon: Icons.account_balance_wallet_outlined,
        color: const Color(0xFFF59E0B),
        title: 'Módulo Financeiro',
        subtitle: 'Contas a pagar/receber, fluxo de caixa e relatórios',
        screen: const FinanceShell(),
      ));
    }

    // Módulo 4: Portal do Colaborador (Holerites, Espelho de Ponto, Mensagens)
    cards.add(_card(
      icon: Icons.badge_outlined,
      color: const Color(0xFF8B5CF6),
      title: 'Portal do Colaborador & RH',
      subtitle: 'Holerites, espelho de ponto, mensagens e perfil',
      screen: const EmployeePortalScreen(),
    ));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Módulos do Sistema'),
        actions: [
          IconButton(
            tooltip: 'Sair da Conta',
            icon: const Icon(Icons.logout, color: Color(0xFFEF4444)),
            onPressed: () async {
              await authService.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        children: [
          Center(
            child: Image.asset(
              'assets/images/fluxbus-logo.png',
              height: 48,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.directions_bus,
                color: colorPrimaryLight,
                size: 48,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: colorSurfaceAlt,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: colorBorder),
              ),
              child: Text(
                '${user?.displayName ?? 'Usuário'} • ${user?.roles.join(', ') ?? 'OPERACIONAL'}',
                style: const TextStyle(color: colorMuted, fontSize: 11, fontWeight: FontWeight.w600),
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Selecione o módulo de trabalho:',
            style: TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          ...cards.map((c) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: c,
              )),
        ],
      ),
    );
  }

  Widget _card({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required Widget screen,
  }) {
    return Builder(
      builder: (context) => InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen)),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colorSurface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colorBorder),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(color: colorText, fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(color: colorMuted, fontSize: 11, height: 1.3)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, color: colorMuted, size: 14),
            ],
          ),
        ),
      ),
    );
  }
}
