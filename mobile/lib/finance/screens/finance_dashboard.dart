import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../finance/models.dart';
import '../../widgets/common.dart';
import 'cost_centers_screen.dart';
import 'payables_screen.dart';
import 'receivables_screen.dart';
import 'reports_screen.dart';

class FinanceDashboard extends StatefulWidget {
  const FinanceDashboard({super.key});

  @override
  State<FinanceDashboard> createState() => _FinanceDashboardState();
}

class _FinanceDashboardState extends State<FinanceDashboard> {
  FinanceSummary _summary = const FinanceSummary(
    totalPayable: 0,
    totalPaid: 0,
    totalOverdue: 0,
    totalReceivable: 0,
    totalReceived: 0,
  );
  List<Payable> _overdue = const [];
  List<Receivable> _dueSoon = const [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        financeRepository.payableSummary(),
        financeRepository.overduePayables(),
        financeRepository.receivables(),
      ]);
      _summary = results[0] as FinanceSummary;
      _overdue = results[1] as List<Payable>;
      final all = results[2] as List<Receivable>;
      final now = DateTime.now();
      _dueSoon = all
          .where((r) => r.dueDate != null && r.pending > 0 &&
              r.dueDate!.difference(now).inDays <= 7 &&
              r.dueDate!.isAfter(now.subtract(const Duration(days: 1))))
          .toList();
    } on ApiException catch (e) {
      if (e.statusCode >= 400 && e.statusCode < 500) {
        _error = 'Sem permissão financeira: ${e.message}';
      } else {
        _error = e.message;
      }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Financeiro'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
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
                      _metrics(),
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
                          _action(Icons.payments_outlined, 'Pagar', () => _go(const PayablesScreen())),
                          _action(Icons.account_balance_wallet_outlined, 'Receber',
                              () => _go(const ReceivablesScreen())),
                          _action(Icons.account_tree_outlined, 'Centros',
                              () => _go(const CostCentersScreen())),
                          _action(Icons.assessment_outlined, 'Relatórios',
                              () => _go(const ReportsScreen())),
                        ],
                      ),
                      const SizedBox(height: 22),
                      SectionTitle(title: 'Contas vencidas'),
                      const SizedBox(height: 8),
                      if (_overdue.isEmpty)
                        const InfoCard(child: EmptyView(message: 'Nenhuma conta vencida.', icon: Icons.verified_outlined))
                      else
                        ..._overdue.take(4).map((p) => _billCard(
                              p.description,
                              p.supplier,
                              p.amount,
                              p.dueDate,
                              colorPrimaryLight,
                            )),
                      const SizedBox(height: 16),
                      SectionTitle(title: 'A receber em 7 dias'),
                      const SizedBox(height: 8),
                      if (_dueSoon.isEmpty)
                        const InfoCard(child: EmptyView(message: 'Nada a vencer em 7 dias.', icon: Icons.event_available_outlined))
                      else
                        ..._dueSoon.take(4).map((r) => _billCard(
                              r.description,
                              r.client,
                              r.pending,
                              r.dueDate,
                              colorSuccess,
                            )),
                    ],
                  ),
                ),
    );
  }

  Widget _metrics() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      children: [
        _metric('A pagar', _summary.totalPayable, colorWarning),
        _metric('Pago', _summary.totalPaid, colorSuccess),
        _metric('Vencido', _summary.totalOverdue, colorPrimaryLight),
        _metric('A receber', _summary.totalReceivable, colorMuted),
      ],
    );
  }

  Widget _metric(String label, double value, Color color) {
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(color: colorMuted, fontSize: 11)),
          const SizedBox(height: 6),
          Text(
            'R\$ ${value.toStringAsFixed(2)}',
            style: TextStyle(color: color, fontSize: 17, fontWeight: FontWeight.bold),
          ),
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
            Text(label, style: const TextStyle(color: colorText, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _billCard(String title, String party, double value, DateTime? date, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InfoCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: colorText, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 3),
                  Text(party, style: const TextStyle(color: colorMuted, fontSize: 10)),
                  if (date != null)
                    Text('Vence ${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}',
                        style: const TextStyle(color: colorMuted, fontSize: 10)),
                ],
              ),
            ),
            Text('R\$ ${value.toStringAsFixed(2)}',
                style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
