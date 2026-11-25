import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../finance/models.dart';
import '../../widgets/common.dart';

class CostCentersScreen extends StatefulWidget {
  const CostCentersScreen({super.key});

  @override
  State<CostCentersScreen> createState() => _CostCentersScreenState();
}

class _CostCentersScreenState extends State<CostCentersScreen> {
  List<CostCenter> _items = const [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _items = await financeRepository.costCenters();
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

  Future<void> _form({CostCenter? item}) async {
    final name = TextEditingController(text: item?.name ?? '');
    final code = TextEditingController(text: item?.code ?? '');
    final department = TextEditingController(text: item?.department ?? '');
    final responsible = TextEditingController(text: item?.responsible ?? '');
    final budget = TextEditingController(text: item?.budget.toStringAsFixed(2) ?? '');
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: Text(item == null ? 'Novo centro de custo' : 'Editar centro',
            style: const TextStyle(color: colorText, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: code, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Código')),
              const SizedBox(height: 8),
              TextField(controller: name, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Nome')),
              const SizedBox(height: 8),
              TextField(controller: department, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Departamento')),
              const SizedBox(height: 8),
              TextField(controller: responsible, style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Responsável')),
              const SizedBox(height: 8),
              TextField(controller: budget, keyboardType: TextInputType.number,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Orçamento (R\$)')),
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
    if (saved != true || name.text.trim().isEmpty) return;
    final payload = <String, dynamic>{
      'code': code.text.trim(),
      'name': name.text.trim(),
      'department': department.text.trim(),
      'responsible': responsible.text.trim(),
      'budget': double.tryParse(budget.text.replaceAll(',', '.')) ?? 0,
    };
    try {
      if (item == null) {
        await financeRepository.createCostCenter(payload);
      } else {
        await financeRepository.updateCostCenter(item.id, payload);
      }
      showMessage(context, 'Centro salvo.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Centros de custo'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _form(),
        backgroundColor: colorPrimary,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const EmptyView(message: 'Nenhum centro de custo.', icon: Icons.account_tree_outlined)
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final c = _items[index];
                        final percent = c.budget > 0 ? (c.spent / c.budget).clamp(0.0, 1.0) : 0.0;
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
                                      child: Text('${c.code} • ${c.name}',
                                          style: const TextStyle(
                                              color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
                                    ),
                                    StatusBadge.auto(c.active ? 'ATIVO' : 'INATIVO'),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(c.department, style: const TextStyle(color: colorMuted, fontSize: 11)),
                                const SizedBox(height: 8),
                                LinearProgressIndicator(
                                  value: percent,
                                  color: percent > 0.9 ? colorPrimaryLight : colorSuccess,
                                  backgroundColor: colorBorder,
                                ),
                                const SizedBox(height: 6),
                                Text('Gasto R\$ ${c.spent.toStringAsFixed(2)} / Orçamento R\$ ${c.budget.toStringAsFixed(2)}',
                                    style: const TextStyle(color: colorMuted, fontSize: 10)),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.toggle_on_outlined, size: 18, color: colorMuted),
                                      onPressed: () async {
                                        try {
                                          await financeRepository.toggleCostCenter(c.id);
                                          await _load();
                                        } on ApiException catch (e) {
                                          showMessage(context, e.message, error: true);
                                        }
                                      },
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.edit_outlined, size: 18, color: colorMuted),
                                      onPressed: () => _form(item: c),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 18, color: colorMuted),
                                      onPressed: () async {
                                        final ok = await confirmAction(context,
                                            title: 'Excluir', message: 'Excluir ${c.name}?');
                                        if (!ok) return;
                                        try {
                                          await financeRepository.deleteCostCenter(c.id);
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
