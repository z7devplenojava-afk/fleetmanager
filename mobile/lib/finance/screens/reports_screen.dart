import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/locator.dart';
import '../../widgets/common.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  DateTime _start = DateTime.now().subtract(const Duration(days: 30));
  DateTime _end = DateTime.now();
  String _status = '';
  String _type = '';

  Future<void> _pickDate(bool start) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: start ? _start : _end,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked == null) return;
    setState(() => start ? _start = picked : _end = picked);
  }

  Future<void> _open(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      showMessage(context, 'Não foi possível abrir o relatório.', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Relatórios financeiros')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Filtros', style: TextStyle(color: colorText, fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('De', style: TextStyle(color: colorMuted, fontSize: 11)),
                  subtitle: Text(_fmt(_start), style: const TextStyle(color: colorText, fontSize: 13)),
                  trailing: const Icon(Icons.calendar_today, color: colorMuted, size: 18),
                  onTap: () => _pickDate(true),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Até', style: TextStyle(color: colorMuted, fontSize: 11)),
                  subtitle: Text(_fmt(_end), style: const TextStyle(color: colorText, fontSize: 13)),
                  trailing: const Icon(Icons.calendar_today, color: colorMuted, size: 18),
                  onTap: () => _pickDate(false),
                ),
                const SizedBox(height: 8),
                TextField(
                  onChanged: (v) => _status = v,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Status (opcional)'),
                ),
                const SizedBox(height: 8),
                TextField(
                  onChanged: (v) => _type = v,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Tipo (opcional)'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SectionTitle(title: 'Contas a pagar'),
          const SizedBox(height: 8),
          InfoCard(
            child: Column(
              children: [
                _reportTile(Icons.picture_as_pdf, 'Relatório PDF',
                    () => _open(financeRepository.payablesReportUrl(_status.isEmpty ? null : _status))),
                _reportTile(Icons.picture_as_pdf, 'Relatório personalizado PDF',
                    () => _open(financeRepository.customPdfUrl(
                        start: _start, end: _end,
                        status: _status.isEmpty ? null : _status,
                        type: _type.isEmpty ? null : _type))),
                _reportTile(Icons.table_view, 'Relatório personalizado Excel',
                    () => _open(financeRepository.customExcelUrl(
                        start: _start, end: _end,
                        status: _status.isEmpty ? null : _status,
                        type: _type.isEmpty ? null : _type))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SectionTitle(title: 'Contas a receber'),
          const SizedBox(height: 8),
          InfoCard(
            child: _reportTile(Icons.picture_as_pdf, 'Relatório PDF',
                () => _open(financeRepository.receivablesPdfUrl())),
          ),
        ],
      ),
    );
  }

  Widget _reportTile(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: colorPrimaryLight, size: 20),
      title: Text(label, style: const TextStyle(color: colorText, fontSize: 12)),
      trailing: const Icon(Icons.open_in_new, color: colorMuted, size: 16),
      onTap: onTap,
    );
  }

  static String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}
