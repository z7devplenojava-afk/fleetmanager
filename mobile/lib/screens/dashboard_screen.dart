import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../models/models.dart';
import '../widgets/common.dart';
import 'checklist_screen.dart';
import 'employee_portal_screen.dart';
import 'fines_screen.dart';
import 'messages_screen.dart';
import 'point_screen.dart';
import 'schedules_screen.dart';
import 'trip_execution_screen.dart';
import 'work_orders_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  String? _error;
  List<Schedule> _schedules = const [];
  List<Fine> _fines = const [];
  int _unread = 0;
  int _pending = 0;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final now = DateTime.now();
      final first = DateTime(now.year, now.month, 1);
      final last = DateTime(now.year, now.month + 1, 0);
      final results = await Future.wait([
        scheduleService.mySchedules(from: first, to: last),
        messageService.unreadCount(),
        offlineQueue.count,
      ]);
      _schedules = results[0] as List<Schedule>;
      _unread = results[1] as int;
      _pending = results[2] as int;
      final driverId = session.driverId;
      if (driverId != null && driverId.isNotEmpty) {
        try {
          _fines = await fineService.byDriver(driverId);
        } on ApiException {
          _fines = const [];
        }
      }
    } catch (e) {
      _error = e is ApiException ? e.message : e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _go(Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  Future<void> _syncOffline() async {
    try {
      final result = await offlineQueue.flush();
      showMessage(context, 'Sincronizados: ${result.sent}. Pendentes: ${result.remaining}.');
      await _load();
    } catch (e) {
      showMessage(context, 'Falha ao sincronizar: $e', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = session.user;
    return Scaffold(
      appBar: AppBar(
        title: Text('Olá, ${user?.displayName.split(' ').first ?? 'motorista'}'),
        actions: [
          if (_pending > 0)
            Stack(
              alignment: Alignment.center,
              children: [
                IconButton(onPressed: _syncOffline, icon: const Icon(Icons.sync)),
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(color: colorPrimary, shape: BoxShape.circle),
                    child: Text('$_pending', style: const TextStyle(fontSize: 9, color: Colors.white)),
                  ),
                ),
              ],
            ),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
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
                      _buildQuickActions(),
                      const SizedBox(height: 22),
                      SectionTitle(
                        title: 'Minhas escalas',
                        trailing: TextButton(
                          onPressed: () => _go(const SchedulesScreen()),
                          child: const Text('Ver todas'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (_schedules.isEmpty)
                        const InfoCard(
                          child: EmptyView(message: 'Nenhuma escala neste mês.', icon: Icons.calendar_month_outlined),
                        )
                      else
                        ..._schedules.take(5).map((s) => _scheduleCard(s)),
                      const SizedBox(height: 22),
                      SectionTitle(
                        title: 'Minhas multas',
                        trailing: TextButton(
                          onPressed: () => _go(const FinesScreen()),
                          child: const Text('Detalhes'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      InfoCard(child: _finesSummary()),
                    ],
                  ),
                ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      _Action(Icons.checklist_rtl_rounded, 'Checklist', 'Vistoria', () => _go(const ChecklistScreen())),
      _Action(Icons.route_outlined, 'Escalas', 'Viagens', () => _go(const SchedulesScreen())),
      _Action(Icons.navigation_outlined, 'Executar', 'Viagem', () => _go(const TripExecutionScreen())),
      _Action(Icons.build_outlined, 'OS', 'Manutenção', () => _go(const WorkOrdersScreen())),
      _Action(Icons.schedule_outlined, 'Ponto', 'Registrar', () => _go(const PointScreen())),
      _Action(Icons.chat_bubble_outline, 'Mensagens', '$_unread não lidas', () => _go(const MessagesScreen())),
      _Action(Icons.description_outlined, 'Holerites', 'Portal RH', () => _go(const EmployeePortalScreen())),
      _Action(Icons.sync, 'Sincronizar', '$_pending pendentes', _syncOffline),
    ];
    return GridView.count(
      crossAxisCount: 4,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      children: actions.map(_actionCard).toList(),
    );
  }

  Widget _actionCard(_Action action) {
    return InkWell(
      onTap: action.onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: colorSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: colorBorder),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(action.icon, color: colorPrimaryLight, size: 22),
            const SizedBox(height: 6),
            Text(action.title, style: const TextStyle(color: colorText, fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(action.subtitle,
                textAlign: TextAlign.center,
                maxLines: 2,
                style: const TextStyle(color: colorMuted, fontSize: 9)),
          ],
        ),
      ),
    );
  }

  Widget _scheduleCard(Schedule s) {
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
                  child: Text(s.title,
                      style: const TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
                ),
                StatusBadge.auto(s.status),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '${_formatDate(s.date)} • ${s.startTime ?? '--:--'} às ${s.endTime ?? '--:--'}',
              style: const TextStyle(color: colorMuted, fontSize: 11),
            ),
            if (s.vehiclePlate != null) ...[
              const SizedBox(height: 4),
              Text('Veículo: ${s.vehiclePlate}', style: const TextStyle(color: colorMuted, fontSize: 11)),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _go(TripExecutionScreen(schedule: s)),
                    icon: const Icon(Icons.play_arrow, size: 15),
                    label: const Text('Executar'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final url = Uri.parse(scheduleService.pdfUrl());
                      if (await canLaunchUrl(url)) {
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      } else {
                        showMessage(context, 'Não foi possível abrir o PDF.', error: true);
                      }
                    },
                    icon: const Icon(Icons.picture_as_pdf, size: 15),
                    label: const Text('PDF'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _finesSummary() {
    final pending = _fines.where((f) => !f.status.toUpperCase().contains('PAID')).length;
    final total = _fines
        .where((f) => !f.status.toUpperCase().contains('PAID'))
        .fold<double>(0, (sum, f) => sum + f.amount);
    return Row(
      children: [
        Expanded(child: _metric('Pendentes', pending.toString(), colorWarning)),
        Expanded(child: _metric('Valor pendente', 'R\$ ${total.toStringAsFixed(2)}', colorPrimaryLight)),
        Expanded(child: _metric('Total', _fines.length.toString(), colorMuted)),
      ],
    );
  }

  Widget _metric(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: colorMuted, fontSize: 10)),
      ],
    );
  }

  static String _formatDate(String value) {
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    return '${parsed.day.toString().padLeft(2, '0')}/${parsed.month.toString().padLeft(2, '0')}/${parsed.year}';
  }
}

class _Action {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _Action(this.icon, this.title, this.subtitle, this.onTap);
}
