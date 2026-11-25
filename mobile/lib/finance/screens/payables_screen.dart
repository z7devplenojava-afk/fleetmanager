import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/locator.dart';
import '../../finance/models.dart';
import '../../widgets/common.dart';

class PayablesScreen extends StatefulWidget {
  const PayablesScreen({super.key});

  @override
  State<PayablesScreen> createState() => _PayablesScreenState();
}

class _PayablesScreenState extends State<PayablesScreen> {
  final _searchController = TextEditingController();
  List<Payable> _items = const [];
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
      _items = await financeRepository.payables(
        search: _searchController.text.trim(),
        status: _status == 'TODAS' ? null : _status,
      );
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _form({Payable? item}) async {
    final description = TextEditingController(text: item?.description ?? '');
    final supplier = TextEditingController(text: item?.supplier ?? '');
    final amount = TextEditingController(text: item?.amount.toStringAsFixed(2) ?? '');
    final dueDate = TextEditingController(
        text: item?.dueDate?.toString().substring(0, 10) ??
            DateTime.now().add(const Duration(days: 7)).toString().substring(0, 10));
    String type = item?.type ?? 'FIXA';
    final category = TextEditingController(text: item?.category ?? '');
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: colorSurface,
          title: Text(item == null ? 'Nova conta a pagar' : 'Editar conta',
              style: const TextStyle(color: colorText, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: description, style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Descrição')),
                const SizedBox(height: 8),
                TextField(controller: supplier, style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Fornecedor')),
                const SizedBox(height: 8),
                TextField(controller: amount, keyboardType: TextInputType.number,
                    style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Valor (R\$)')),
                const SizedBox(height: 8),
                TextField(controller: dueDate, style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Vencimento (AAAA-MM-DD)')),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  dropdownColor: colorSurfaceAlt,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Tipo'),
                  items: ['FIXA', 'VARIAVEL']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => type = v ?? 'FIXA'),
                ),
                const SizedBox(height: 8),
                TextField(controller: category, style: const TextStyle(color: colorText),
                    decoration: const InputDecoration(labelText: 'Classificação')),
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
      'amount': value,
      'dueDate': dueDate.text.trim(),
      'type': type,
      'category': category.text.trim(),
      'supplierId': null,
      'supplierName': supplier.text.trim(),
    };
    try {
      if (item == null) {
        await financeRepository.createPayable(payload);
      } else {
        await financeRepository.updatePayable(item.id, payload);
      }
      showMessage(context, 'Conta salva.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _pay(Payable item) async {
    final paidController = TextEditingController(text: item.pending.toStringAsFixed(2));
    final proof = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          File? file;
          return AlertDialog(
            backgroundColor: colorSurface,
            title: Text('Dar baixa — ${item.description}',
                style: const TextStyle(color: colorText, fontSize: 15)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(controller: paidController, keyboardType: TextInputType.number,
                      style: const TextStyle(color: colorText),
                      decoration: const InputDecoration(labelText: 'Valor pago')),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final result = await FilePicker.platform.pickFiles(
                        type: FileType.custom,
                        allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
                      );
                      if (result != null && result.files.single.path != null) {
                        setDialogState(() => file = File(result.files.single.path!));
                      }
                    },
                    icon: const Icon(Icons.attach_file, size: 16),
                    // ignore: unnecessary_null_comparison
                    label: Text(file == null ? 'Anexar comprovante' : 'Comprovante anexado'),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, {
                  'amount': paidController.text,
                  'file': file,
                }),
                style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
                child: const Text('Confirmar'),
              ),
            ],
          );
        },
      ),
    );
    if (proof == null) return;
    final value = double.tryParse((proof['amount'] as String).replaceAll(',', '.'));
    if (value == null || value <= 0) {
      showMessage(context, 'Valor inválido.', error: true);
      return;
    }
    try {
      final file = proof['file'] as File?;
      if (file != null) {
        await financeRepository.uploadProof(item.id, file, paidAmount: value);
      } else {
        await financeRepository.markPayablePaid(item.id);
      }
      showMessage(context, 'Baixa registrada.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _importBoleto() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
    );
    if (result == null || result.files.isEmpty) return;
    try {
      final files = result.files
          .where((f) => f.path != null)
          .map((f) => File(f.path!))
          .toList();
      final parsed = files.length == 1
          ? (await financeRepository.parseBoleto(files.first)).isNotEmpty
              ? [await financeRepository.parseBoleto(files.first)]
              : const []
          : await financeRepository.parseBoletos(files);
      showMessage(context, 'Boletos processados: ${parsed.length}.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _openBoleto(Payable item) async {
    if (item.boletoUrl == null) return;
    final uri = Uri.parse(item.boletoUrl!);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contas a pagar'),
        actions: [
          IconButton(onPressed: _importBoleto, icon: const Icon(Icons.qr_code_scanner)),
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
                hintText: 'Buscar por descrição ou fornecedor',
                prefixIcon: Icon(Icons.search, color: colorMuted),
                suffixIcon: Icon(Icons.check, color: colorMuted),
              ),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: ['TODAS', 'ABERTA', 'VENCIDA', 'PAGA', 'CANCELADA']
                  .map(
                    (s) => Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(s, style: const TextStyle(fontSize: 10)),
                        selected: _status == s,
                        onSelected: (_) {
                          setState(() => _status = s);
                          _load();
                        },
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : _error != null
                    ? ErrorView(message: _error!, onRetry: _load)
                    : _items.isEmpty
                        ? const EmptyView(message: 'Nenhuma conta encontrada.', icon: Icons.receipt_long_outlined)
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

  Widget _card(Payable p) {
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
                  child: Text(p.description,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
                ),
                StatusBadge.auto(p.displayStatus),
              ],
            ),
            const SizedBox(height: 5),
            Text('${p.supplier.isEmpty ? 'Sem fornecedor' : p.supplier} • ${p.number}',
                style: const TextStyle(color: colorMuted, fontSize: 11)),
            if (p.dueDate != null)
              Text('Vencimento: ${_fmt(p.dueDate!)}',
                  style: const TextStyle(color: colorMuted, fontSize: 11)),
            const SizedBox(height: 8),
            Row(
              children: [
                Text('R\$ ${p.pending.toStringAsFixed(2)}',
                    style: const TextStyle(
                        color: colorPrimaryLight, fontSize: 15, fontWeight: FontWeight.bold)),
                const Spacer(),
                if (p.digitableLine != null)
                  IconButton(
                    tooltip: 'Copiar linha digitável',
                    icon: const Icon(Icons.copy, size: 17, color: colorMuted),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: p.digitableLine!));
                      showMessage(context, 'Linha digitável copiada.');
                    },
                  ),
                if (p.boletoUrl != null)
                  IconButton(
                    tooltip: 'Ver boleto',
                    icon: const Icon(Icons.picture_as_pdf, size: 17, color: colorMuted),
                    onPressed: () => _openBoleto(p),
                  ),
                IconButton(
                  tooltip: 'Editar',
                  icon: const Icon(Icons.edit_outlined, size: 17, color: colorMuted),
                  onPressed: () => _form(item: p),
                ),
                IconButton(
                  tooltip: 'Excluir',
                  icon: const Icon(Icons.delete_outline, size: 17, color: colorMuted),
                  onPressed: () async {
                    final ok = await confirmAction(context,
                        title: 'Excluir conta', message: 'Deseja excluir "${p.description}"?');
                    if (!ok) return;
                    try {
                      await financeRepository.deletePayable(p.id);
                      await _load();
                    } on ApiException catch (e) {
                      showMessage(context, e.message, error: true);
                    }
                  },
                ),
              ],
            ),
            if (p.displayStatus != 'PAGA' && p.displayStatus != 'CANCELADA')
              Align(
                alignment: Alignment.centerRight,
                child: ElevatedButton.icon(
                  onPressed: () => _pay(p),
                  icon: const Icon(Icons.payments, size: 15),
                  label: const Text('Dar baixa'),
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
