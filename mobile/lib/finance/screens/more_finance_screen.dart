import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../finance/models.dart';
import '../../widgets/common.dart';

/// Funcionalidades financeiras secundárias: bancos, agências, fornecedores,
/// conciliação, DDA, compras, medições e transações.
class MoreFinanceScreen extends StatefulWidget {
  final int initialTab;

  const MoreFinanceScreen({super.key, this.initialTab = 0});

  @override
  State<MoreFinanceScreen> createState() => _MoreFinanceScreenState();
}

class _MoreFinanceScreenState extends State<MoreFinanceScreen> {
  static const _tabs = [
    'Bancos',
    'Agências',
    'Fornecedores',
    'Conciliação',
    'DDA',
    'Compras',
    'Medições',
    'Transações',
  ];

  int _tab = 0;
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tab = widget.initialTab;
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      switch (_tab) {
        case 0:
          _items = (await financeRepository.banks())
              .map((e) => {'id': e.id, 'title': e.name, 'subtitle': e.code, 'status': e.status})
              .toList();
          break;
        case 1:
          _items = (await financeRepository.agencies())
              .map((e) => {
                    'id': e.id,
                    'title': e.name,
                    'subtitle': '${e.bankName} • ${e.city} • ${e.code}',
                    'status': e.status,
                  })
              .toList();
          break;
        case 2:
          _items = (await financeRepository.suppliers())
              .map(Supplier.fromJson)
              .map((e) => {'id': e.id, 'title': e.name, 'subtitle': e.cnpj, 'active': e.active})
              .toList();
          break;
        case 3:
          _items = (await financeRepository.reconciliationFiles())
              .map((e) => {
                    'id': e.id,
                    'title': e.fileName,
                    'subtitle': '${e.bankName} • ${e.transactionCount} transações',
                    'status': e.status,
                  })
              .toList();
          break;
        case 4:
          _items = (await financeRepository.ddaInvoices())
              .map((e) => {'id': e.id, 'title': e.beneficiary, 'subtitle': e.dueDate,
                    'amount': e.amount, 'status': e.status, 'line': e.line})
              .toList();
          break;
        case 5:
          _items = (await financeRepository.purchaseOrders())
              .map((e) => {'id': e.id, 'title': e.number, 'subtitle': e.supplier,
                    'amount': e.total, 'status': e.status})
              .toList();
          break;
        case 6:
          _items = await financeRepository.measurements();
          break;
        case 7:
          _items = await financeRepository.transactions();
          break;
      }
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _simpleForm({required List<String> fields}) async {
    final controllers = fields.map((_) => TextEditingController()).toList();
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: Text('Novo item — ${_tabs[_tab]}', style: const TextStyle(color: colorText, fontSize: 15)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(fields.length, (i) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: TextField(controller: controllers[i], style: const TextStyle(color: colorText),
                      decoration: InputDecoration(labelText: fields[i])),
                )),
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
    if (saved != true) return;
    final values = controllers.map((c) => c.text.trim()).toList();
    try {
      switch (_tab) {
        case 0:
          await financeRepository.createBank({'name': values[0], 'code': values[1]});
          break;
        case 1:
          await financeRepository.createAgency({'name': values[0], 'code': values[1],
            'bankName': values[2], 'city': values.length > 3 ? values[3] : ''});
          break;
        case 2:
          await financeRepository.createSupplier({'name': values[0], 'cnpj': values[1]});
          break;
        case 7:
          await financeRepository.createTransaction({
            'description': values[0],
            'amount': double.tryParse(values[1].replaceAll(',', '.')) ?? 0,
            'type': values.length > 2 ? values[2] : 'EXPENSE',
          });
          break;
      }
      showMessage(context, 'Item salvo.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _uploadReconciliation() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'csv'],
    );
    if (result == null || result.files.isEmpty) return;
    final path = result.files.single.path;
    if (path == null) return;
    final bank = TextEditingController();
    final account = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: const Text('Importar extrato', style: TextStyle(color: colorText, fontSize: 15)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: bank, style: const TextStyle(color: colorText),
                decoration: const InputDecoration(labelText: 'Banco')),
            const SizedBox(height: 8),
            TextField(controller: account, style: const TextStyle(color: colorText),
                decoration: const InputDecoration(labelText: 'Conta')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
              child: const Text('Importar')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await financeRepository.uploadReconciliation(File(path), {
        'bankName': bank.text.trim(),
        'accountNumber': account.text.trim(),
        'period': DateTime.now().toString().substring(0, 7),
      });
      showMessage(context, 'Extrato enviado para processamento.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _syncDda() async {
    try {
      await financeRepository.syncDda();
      showMessage(context, 'Boletos DDA sincronizados.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _importSuppliers() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'xlsx', 'xls', 'csv'],
    );
    if (result == null || result.files.isEmpty) return;
    final path = result.files.single.path;
    if (path == null) return;
    try {
      await financeRepository.importSuppliers(File(path));
      showMessage(context, 'Fornecedores importados.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tabs[_tab]),
        actions: [
          if (_tab == 3)
            IconButton(onPressed: _uploadReconciliation, icon: const Icon(Icons.upload_file))
          else if (_tab == 4)
            IconButton(onPressed: _syncDda, icon: const Icon(Icons.sync))
          else if (_tab == 2)
            IconButton(onPressed: _importSuppliers, icon: const Icon(Icons.upload_file))
          else if ([0, 1, 2, 7].contains(_tab))
            IconButton(
              onPressed: () => _simpleForm(fields: _tab == 0
                  ? ['Nome', 'Código']
                  : _tab == 1
                      ? ['Nome', 'Código', 'Banco', 'Cidade']
                      : _tab == 2
                          ? ['Nome', 'CNPJ']
                          : ['Descrição', 'Valor', 'Tipo']),
              icon: const Icon(Icons.add),
            ),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 46,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _tabs.length,
              itemBuilder: (context, index) => Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: Text(_tabs[index], style: const TextStyle(fontSize: 10)),
                  selected: _tab == index,
                  onSelected: (_) {
                    setState(() => _tab = index);
                    _load();
                  },
                ),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : _error != null
                    ? ErrorView(message: _error!, onRetry: _load)
                    : _items.isEmpty
                        ? EmptyView(message: 'Nenhum item em ${_tabs[_tab].toLowerCase()}.')
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _items.length,
                            itemBuilder: (context, index) => _itemCard(_items[index]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _itemCard(Map<String, dynamic> item) {
    final id = item['id']?.toString() ?? '';
    final title = (item['title'] ?? item['description'] ?? item['name'] ?? 'Item').toString();
    final subtitle = (item['subtitle'] ?? '').toString();
    final status = (item['status'] ?? '').toString();
    final amount = item['amount'];
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InfoCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(title, style: const TextStyle(color: colorText, fontSize: 12, fontWeight: FontWeight.bold))),
                if (status.isNotEmpty) StatusBadge.auto(status),
              ],
            ),
            if (subtitle.isNotEmpty)
              Text(subtitle, style: const TextStyle(color: colorMuted, fontSize: 10)),
            if (amount != null)
              Text('R\$ ${(amount as num).toStringAsFixed(2)}',
                  style: const TextStyle(color: colorPrimaryLight, fontSize: 12)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (_tab == 3)
                  TextButton.icon(
                    onPressed: () => _openUrl(financeRepository.reconciliationReportUrl(id)),
                    icon: const Icon(Icons.picture_as_pdf, size: 15),
                    label: const Text('Relatório'),
                  ),
                if (_tab == 3)
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 17, color: colorMuted),
                    onPressed: () async {
                      try {
                        await financeRepository.deleteReconciliation(id);
                        await _load();
                      } on ApiException catch (e) {
                        showMessage(context, e.message, error: true);
                      }
                    },
                  ),
                if (_tab == 4) ...[
                  TextButton(
                    onPressed: () async {
                      try {
                        await financeRepository.importDda(id);
                        await _load();
                      } on ApiException catch (e) {
                        showMessage(context, e.message, error: true);
                      }
                    },
                    child: const Text('Importar'),
                  ),
                  TextButton(
                    onPressed: () async {
                      try {
                        await financeRepository.payDda(id);
                        await _load();
                      } on ApiException catch (e) {
                        showMessage(context, e.message, error: true);
                      }
                    },
                    child: const Text('Pagar'),
                  ),
                ],
                if (_tab == 5) ...[
                  TextButton(
                    onPressed: () async {
                      try {
                        await financeRepository.financialApproval(id, true);
                        await _load();
                      } on ApiException catch (e) {
                        showMessage(context, e.message, error: true);
                      }
                    },
                    child: const Text('Aprovar'),
                  ),
                  TextButton(
                    onPressed: () async {
                      try {
                        await financeRepository.financialApproval(id, false);
                        await _load();
                      } on ApiException catch (e) {
                        showMessage(context, e.message, error: true);
                      }
                    },
                    child: const Text('Rejeitar'),
                  ),
                ],
                if (_tab == 6)
                  TextButton.icon(
                    onPressed: () => _openUrl(financeRepository.measurementPdfUrl(id)),
                    icon: const Icon(Icons.picture_as_pdf, size: 15),
                    label: const Text('PDF'),
                  ),
                if ([0, 1, 7].contains(_tab))
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 17, color: colorMuted),
                    onPressed: () async {
                      try {
                        if (_tab == 0) await financeRepository.deleteBank(id);
                        if (_tab == 1) await financeRepository.deleteAgency(id);
                        if (_tab == 7) await financeRepository.deleteTransaction(id);
                        await _load();
                      } on ApiException catch (e) {
                        showMessage(context, e.message, error: true);
                      }
                    },
                  ),
                if (_tab == 2)
                  IconButton(
                    icon: const Icon(Icons.toggle_on_outlined, size: 17, color: colorMuted),
                    onPressed: () async {
                      try {
                        await financeRepository.toggleSupplier(id);
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
  }
}
