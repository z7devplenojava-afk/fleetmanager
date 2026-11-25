import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../finance/models.dart';
import '../../widgets/common.dart';

class CashFlowScreen extends StatefulWidget {
  const CashFlowScreen({super.key});

  @override
  State<CashFlowScreen> createState() => _CashFlowScreenState();
}

class _CashFlowScreenState extends State<CashFlowScreen> {
  int _days = 30;
  List<Payable> _payables = const [];
  List<Receivable> _receivables = const [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final start = DateTime.now().subtract(Duration(days: _days));
      final results = await Future.wait([
        financeRepository.payables(start: start),
        financeRepository.receivables(start: start),
      ]);
      _payables = results[0] as List<Payable>;
      _receivables = results[1] as List<Receivable>;
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

  Map<DateTime, _Day> get _daily {
    final map = <DateTime, _Day>{};
    void add(DateTime date, double inValue, double outValue) {
      final key = DateTime(date.year, date.month, date.day);
      final current = map.putIfAbsent(key, () => _Day(key));
      if (inValue > 0) current.income += inValue;
      if (outValue > 0) current.expense += outValue;
    }

    for (final r in _receivables) {
      if (r.dueDate == null) continue;
      final paid = r.status.toUpperCase().contains('PAID') || r.status.toUpperCase().contains('RECEBIDA');
      add(r.dueDate!, paid ? r.amount : 0, 0);
    }
    for (final p in _payables) {
      if (p.dueDate == null) continue;
      final paid = p.status.toUpperCase().contains('PAGA');
      add(p.dueDate!, 0, paid ? p.amount : 0);
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    final days = _daily;
    final sorted = days.keys.toList()..sort();
    double running = 0;
    final rows = sorted.map((d) {
      final item = days[d]!;
      running += item.income - item.expense;
      item.balance = running;
      return item;
    }).toList();
    final totalIn = rows.fold<double>(0, (s, e) => s + e.income);
    final totalOut = rows.fold<double>(0, (s, e) => s + e.expense);
    final pendingIn = _receivables.fold<double>(0, (s, e) => s + e.pending);
    final pendingOut = _payables.fold<double>(0, (s, e) => s + e.pending);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fluxo de caixa'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Row(
                      children: [7, 30, 90]
                          .map((d) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                  label: Text('${d}D'),
                                  selected: _days == d,
                                  onSelected: (_) {
                                    setState(() => _days = d);
                                    _load();
                                  },
                                ),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 14),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      children: [
                        _metric('Entradas', totalIn, colorSuccess),
                        _metric('Saídas', totalOut, colorPrimaryLight),
                        _metric('Saldo atual', totalIn - totalOut, colorText),
                        _metric('Saldo projetado', totalIn - totalOut + pendingIn - pendingOut, colorWarning),
                      ],
                    ),
                    const SizedBox(height: 20),
                    SectionTitle(title: 'Movimentações por vencimento'),
                    const SizedBox(height: 8),
                    if (rows.isEmpty)
                      const InfoCard(child: EmptyView(message: 'Sem movimentações no período.'))
                    else
                      InfoCard(
                        child: Column(
                          children: rows.reversed.map(_row).toList(),
                        ),
                      ),
                  ],
                ),
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
          Text('R\$ ${value.toStringAsFixed(2)}',
              style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _row(_Day day) {
    final max = [_daily.values.fold<double>(0, (s, e) => s + e.income),
            _daily.values.fold<double>(0, (s, e) => s + e.expense)]
        .reduce((a, b) => a > b ? a : b);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('${day.date.day.toString().padLeft(2, '0')}/${day.date.month.toString().padLeft(2, '0')}',
                  style: const TextStyle(color: colorText, fontSize: 11)),
              const Spacer(),
              Text('+ R\$ ${day.income.toStringAsFixed(2)}',
                  style: const TextStyle(color: colorSuccess, fontSize: 11)),
              const SizedBox(width: 8),
              Text('- R\$ ${day.expense.toStringAsFixed(2)}',
                  style: const TextStyle(color: colorPrimaryLight, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 6,
                    color: colorBorder,
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        height: 6,
                        width: max == 0 ? 0 : (day.income / max) * 120,
                        color: colorSuccess,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Container(
                    height: 6,
                    color: colorBorder,
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        height: 6,
                        width: max == 0 ? 0 : (day.expense / max) * 120,
                        color: colorPrimaryLight,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Day {
  final DateTime date;
  double income = 0;
  double expense = 0;
  double balance = 0;

  _Day(this.date);
}
