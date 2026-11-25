import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../models/models.dart';
import '../widgets/common.dart';

class EmployeePortalScreen extends StatefulWidget {
  const EmployeePortalScreen({super.key});

  @override
  State<EmployeePortalScreen> createState() => _EmployeePortalScreenState();
}

class _EmployeePortalScreenState extends State<EmployeePortalScreen> {
  final _tabs = const [
    'Perfil',
    'Ponto',
    'Holerites',
    'Benefícios',
    'Documentos',
    'Treinamentos',
    'Férias',
    'Avisos',
  ];
  int _tab = 0;
  EmployeeProfile? _profile;
  List<Payslip> _payslips = const [];
  List<Map<String, dynamic>> _generic = const [];
  bool _loading = true;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      switch (_tab) {
        case 0:
          _profile = await portalService.profile();
          break;
        case 1:
          final results = await Future.wait([
            portalService.timeRecords(),
            pointService.balance(),
          ]);
          _generic = (results[0] as List<TimeRecord>)
              .map((e) => {'title': e.type, 'subtitle': e.recordedAt})
              .toList();
          final balance = results[1] as Map<String, dynamic>?;
          if (balance != null) {
            _generic = [
              {'title': 'Saldo de horas', 'subtitle': balance.toString()},
              ..._generic,
            ];
          }
          break;
        case 2:
          _payslips = await portalService.payslips();
          break;
        case 3:
          _generic = await portalService.benefits();
          break;
        case 4:
          _generic = await portalService.documents();
          break;
        case 5:
          _generic = await portalService.trainings();
          break;
        case 6:
          _generic = await portalService.vacations();
          break;
        case 7:
          _generic = await portalService.notifications();
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

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Portal do empregado')),
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
                  label: Text(_tabs[index], style: const TextStyle(fontSize: 11)),
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
                    : _buildTab(),
          ),
        ],
      ),
    );
  }

  Widget _buildTab() {
    switch (_tab) {
      case 0:
        return _profileCard();
      case 2:
        return _payslipList();
      default:
        return _genericList();
    }
  }

  Widget _profileCard() {
    final p = _profile;
    if (p == null) return const EmptyView(message: 'Perfil não encontrado.');
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(p.name, style: const TextStyle(color: colorText, fontSize: 17, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              _row('CPF', p.cpf),
              _row('Cargo', p.position),
              _row('Setor', p.department),
              _row('Admissão', p.admissionDate),
            ],
          ),
        ),
      ],
    );
  }

  Widget _row(String label, String? value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            SizedBox(width: 80, child: Text(label, style: const TextStyle(color: colorMuted, fontSize: 11))),
            Expanded(child: Text(value ?? '-', style: const TextStyle(color: colorText, fontSize: 12))),
          ],
        ),
      );

  Widget _payslipList() {
    if (_payslips.isEmpty) {
      return const EmptyView(message: 'Nenhum holerite disponível.', icon: Icons.description_outlined);
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _payslips.length,
      itemBuilder: (context, index) {
        final p = _payslips[index];
        return Card(
          color: colorSurface,
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.picture_as_pdf, color: colorPrimaryLight),
            title: Text(p.competence.isNotEmpty ? p.competence : 'Holerite',
                style: const TextStyle(color: colorText, fontSize: 12)),
            subtitle: Text(p.fileName ?? '', style: const TextStyle(color: colorMuted, fontSize: 10)),
            trailing: const Icon(Icons.download, color: colorMuted, size: 18),
            onTap: () async {
              if (p.downloadUrl == null) return;
              final uri = Uri.parse(p.downloadUrl!);
              if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
            },
          ),
        );
      },
    );
  }

  Widget _genericList() {
    if (_generic.isEmpty) {
      return EmptyView(message: 'Nenhum item em ${_tabs[_tab].toLowerCase()}.');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _generic.length,
      itemBuilder: (context, index) {
        final item = _generic[index];
        final title = (item['title'] ?? item['name'] ?? item['descricao'] ?? item['description'] ?? 'Item').toString();
        final subtitle =
            (item['subtitle'] ?? item['date'] ?? item['data'] ?? item['status'] ?? '').toString();
        return Card(
          color: colorSurface,
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.article_outlined, color: colorMuted, size: 18),
            title: Text(title, style: const TextStyle(color: colorText, fontSize: 12)),
            subtitle: subtitle.isEmpty
                ? null
                : Text(subtitle, style: const TextStyle(color: colorMuted, fontSize: 10)),
          ),
        );
      },
    );
  }
}
