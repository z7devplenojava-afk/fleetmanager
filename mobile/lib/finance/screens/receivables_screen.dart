import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../finance/models.dart';
import '../../widgets/common.dart';

class ReceivablesScreen extends StatefulWidget {
  const ReceivablesScreen({super.key});

  @override
  State<ReceivablesScreen> createState() => _ReceivablesScreenState();
}

class _ReceivablesScreenState extends State<ReceivablesScreen> {
  final _searchController = TextEditingController();
  List<Receivable> _items = const [];
  List<String> _categories = const [];
  String _status = 'TODAS';
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        financeRepository.receivables(
          search: _searchController.text.trim(),
          status: _status == 'TODAS' ? null : _status,
        ),
        _loadCategories(),
      ]);
      _items = results[0] as List<Receivable>;
      _categories = results[1] as List<String>;
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<List<String>> _loadCategories() async {
    try {
      return await financeRepository.receivableCategories();
    } on ApiException {
      return const [];
    }
  }

  Future<void> _form({Receivable? item}) async {
    final description = TextEditingController(text: item?.description ?? '');
    final client = TextEditingController(text: item?.client ?? '');
    final amount = TextEditingController(text: item?.amount.toStringAsFixed(2) ?? '');
    final dueDate = TextEditingController(
        text: item?.dueDate?.toString().substring(0, 10) ??
            DateTime.now().add(const Duration(days: 7)).toString().substring(0, 10));
    String category = item?.category.isNotEmpty == true ? item!.category : 'INVOICE';
    String method = item?.paymentMethod.isNotEmpty == true ? item!.paymentMethod : 'PIX';
    final categories = _categories.isEmpty
        ? ['INVOICE', 'NOTE', 'ADVANCE', 'SERVICE', 'PRODUCT', 'MEASUREMENT', 'OTHER']
        : _categories;
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: colorSurface,
          title: Text(item == null ? 'Novo recebível' : 'Editar recebível',
              style: const TextStyle(color: colorText, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: description, style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Descrição')),
                const SizedBox(height: 8),
                TextField(controller: client, style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Cliente')),
                const SizedBox(height: 8),
                TextField(controller: amount, keyboardType: TextInputType.number,
                    style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Valor (R\$)')),
                const SizedBox(height: 8),
                TextField(controller: dueDate, style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Vencimento (AAAA-MM-DD)')),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: category,
                  dropdownColor: colorSurfaceAlt,
                  style: const TextStyle(color: colorText),
                  items: categories.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setDialogState(() => category = v ?? 'INVOICE'),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: method,
                  dropdownColor: colorSurfaceAlt,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Forma de pagamento'),
                  items: ['PIX', 'BOLETO', 'TRANSFER', 'CASH', 'CARD']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => method = v ?? 'PIX'),
                ),
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
      ),
    );
    if (saved != true) return;
    final value = double.tryParse(amount.text.replaceAll(',', '.'));
    if (description.text.trim().isEmpty || value == null || value <= 0) {
      showMessage(context, 'Preencha descrição e valor.', error: true);
      return;
    }
    final payload = <String, dynamic>{
      'description': description.text.trim(),
      'clientId': null,
      'clientName': client.text.trim(),
      'amount': value,
      'issueDate': DateTime.now().toString().substring(0, 10),
      'dueDate': dueDate.text.trim(),
      'category': category,
      'paymentMethod': method,
    };
    try {
      if (item == null) {
        await financeRepository.createReceivable(payload);
      } else {
        await financeRepository.updateReceivable(item.id, payload);
      }
      showMessage(context, 'Recebível salvo.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _markPaid(Receivable r) async {
    final ok = await confirmAction(context,
        title: 'Marcar como recebida',
        message: 'Confirmar recebimento de R\$ ${r.pending.toStringAsFixed(2)}?');
    if (!ok) return;
    try {
      await financeRepository.markReceivablePaid(r.id);
      showMessage(context, 'Recebimento registrado.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _importNfse() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['xml', 'pdf'],
    );
    if (result == null || result.files.isEmpty) return;
    final path = result.files.single.path;
    if (path == null) return;
    try {
      final parsed = await financeRepository.parseReceivableNfse(File(path));
      final amount = double.tryParse((parsed['amount'] ?? parsed['valor'] ?? '0').toString());
      final description = (parsed['description'] ?? parsed['descricao'] ?? 'NFS-e importada').toString();
      await financeRepository.createReceivable({
        'description': description,
        'clientId': null,
        'amount': amount ?? 0,
        'issueDate': DateTime.now().toString().substring(0, 10),
        'dueDate': DateTime.now().add(const Duration(days: 7)).toString().substring(0, 10),
        'category': 'SERVICE',
        'paymentMethod': 'PIX',
        'nfseNumber': parsed['number'] ?? parsed['numero'],
        'nfseKey': parsed['key'] ?? parsed['chave'],
      });
      showMessage(context, 'NFS-e importada como recebível.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _syncMeasurements() async {
    try {
      await financeRepository.syncMeasurements();
      showMessage(context, 'Medições sincronizadas.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contas a receber'),
        actions: [
          IconButton(onPressed: _importNfse, icon: const Icon(Icons.upload_file)),
          IconButton(onPressed: _syncMeasurements, icon: const Icon(Icons.sync)),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _form(),
        backgroundColor: colorPrimary,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              onSubmitted: (_) => _load(),
              style: const TextStyle(color: colorText),
              decoration: const InputDecoration(
                hintText: 'Buscar cliente, fatura ou medição',
                prefixIcon: Icon(Icons.search, color: colorMuted),
              ),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: ['TODAS', 'ABERTA', 'VENCIDA', 'RECEBIDA', 'CANCELADA']
                  .map((s) => Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(s, style: const TextStyle(fontSize: 10)),
                          selected: _status == s,
                          onSelected: (_) {
                            setState(() => _status = s);
                            _load();
                          },
                        ),
                      ))
                  .toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : _error != null
                    ? ErrorView(message: _error!, onRetry: _load)
                    : _items.isEmpty
                        ? const EmptyView(message: 'Nenhum recebível encontrado.', icon: Icons.account_balance_wallet_outlined)
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                            itemCount: _items.length,
                            itemBuilder: (context, index) => _card(_items[index]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _card(Receivable r) {
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
                  child: Text(r.description,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
                ),
                StatusBadge.auto(r.displayStatus),
              ],
            ),
            const SizedBox(height: 5),
            Text('${r.client.isEmpty ? 'Sem cliente' : r.client} • ${r.number}',
                style: const TextStyle(color: colorMuted, fontSize: 11)),
            if (r.dueDate != null)
              Text('Vencimento: ${_fmt(r.dueDate!)}',
                  style: const TextStyle(color: colorMuted, fontSize: 11)),
            if (r.nfseNumber != null)
              Text('NFS-e ${r.nfseNumber}', style: const TextStyle(color: colorMuted, fontSize: 10)),
            const SizedBox(height: 8),
            Row(
              children: [
                Text('R\$ ${r.pending.toStringAsFixed(2)}',
                    style: const TextStyle(
                        color: colorSuccess, fontSize: 15, fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton(
                  tooltip: 'Editar',
                  icon: const Icon(Icons.edit_outlined, size: 17, color: colorMuted),
                  onPressed: () => _form(item: r),
                ),
                IconButton(
                  tooltip: 'Excluir',
                  icon: const Icon(Icons.delete_outline, size: 17, color: colorMuted),
                  onPressed: () async {
                    final ok = await confirmAction(context,
                        title: 'Excluir', message: 'Excluir "${r.description}"?');
                    if (!ok) return;
                    try {
                      await financeRepository.deleteReceivable(r.id);
                      await _load();
                    } on ApiException catch (e) {
                      showMessage(context, e.message, error: true);
                    }
                  },
                ),
              ],
            ),
            if (r.pending > 0)
              Align(
                alignment: Alignment.centerRight,
                child: ElevatedButton.icon(
                  onPressed: () => _markPaid(r),
                  icon: const Icon(Icons.check, size: 15),
                  label: const Text('Marcar recebida'),
                  style: ElevatedButton.styleFrom(
                      backgroundColor: colorSurfaceAlt, foregroundColor: colorText),
                ),
              ),
          ],
        ),
      ),
    );
  }

  static String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}
