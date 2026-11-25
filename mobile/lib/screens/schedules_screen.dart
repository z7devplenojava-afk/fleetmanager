import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../core/offline_queue.dart';
import '../models/models.dart';
import '../services/driver_services.dart';
import '../widgets/common.dart';
import 'trip_execution_screen.dart';

class SchedulesScreen extends StatefulWidget {
  const SchedulesScreen({super.key});

  @override
  State<SchedulesScreen> createState() => _SchedulesScreenState();
}

class _SchedulesScreenState extends State<SchedulesScreen> {
  final _imagePicker = ImagePicker();
  List<Schedule> _items = const [];
  bool _loading = true;
  String? _error;
  String _filter = 'TODAS';

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final now = DateTime.now();
      _items = await scheduleService.mySchedules(
        from: DateTime(now.year, now.month, 1),
        to: DateTime(now.year, now.month + 1, 0),
      );
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

  List<Schedule> get _filtered {
    if (_filter == 'TODAS') return _items;
    return _items.where((s) => s.shift?.toUpperCase().contains(_filter) == true).toList();
  }

  Future<void> _pointDialog(Schedule schedule) async {
    final kmController = TextEditingController(text: schedule.initialKm?.toStringAsFixed(0) ?? '');
    final justificationController = TextEditingController();
    bool forgot = false;
    List<File> photos = <File>[];
    final outsideTolerance = _outsideTolerance(schedule);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: colorSurface,
          title: Text('Registrar ponto — ${schedule.title}',
              style: const TextStyle(color: colorText, fontSize: 15)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (outsideTolerance)
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: colorWarning.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: colorWarning.withValues(alpha: 0.4)),
                    ),
                    child: const Text(
                      'Fora da tolerância de ±10 min. Informe a justificativa.',
                      style: TextStyle(color: colorWarning, fontSize: 11),
                    ),
                  ),
                const SizedBox(height: 12),
                TextField(
                  controller: kmController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'KM inicial'),
                ),
                CheckboxListTile(
                  value: forgot,
                  onChanged: (v) => setDialogState(() => forgot = v == true),
                  title: const Text('Esqueci de registrar no horário',
                      style: TextStyle(color: colorText, fontSize: 12)),
                  activeColor: colorPrimaryLight,
                  dense: true,
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                TextField(
                  controller: justificationController,
                  maxLines: 3,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'Justificativa'),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () async {
                    final picked = await _imagePicker.pickMultiImage(imageQuality: 70);
                    if (picked.isNotEmpty) {
                      setDialogState(() => photos.addAll(picked.map((e) => File(e.path))));
                    }
                  },
                  icon: const Icon(Icons.photo_camera, size: 16),
                  label: const Text('Fotos da escala / odômetro'),
                ),
                if (photos.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('${photos.length} foto(s) selecionada(s)',
                        style: const TextStyle(color: colorMuted, fontSize: 11)),
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
              child: const Text('Registrar'),
            ),
          ],
        ),
      ),
    );
    if (confirmed != true) return;
    final km = double.tryParse(kmController.text.replaceAll(',', '.'));
    if (km == null || km <= 0) {
      showMessage(context, 'Informe um KM inicial válido.', error: true);
      return;
    }
    final needJustification = outsideTolerance || forgot;
    if (needJustification && justificationController.text.trim().length < 10) {
      showMessage(context, 'Justificativa obrigatória.', error: true);
      return;
    }
    final payload = <String, dynamic>{
      'initialKm': km,
      'forgotPoint': forgot,
      'justification': justificationController.text.trim(),
      'scheduleDate': schedule.date,
      'expectedStartTime': schedule.startTime,
      'photosBase64': photos.map(encodeFileBase64).toList(),
    };
    try {
      await scheduleService.registerPoint(schedule.id, payload);
      showMessage(context, 'Ponto registrado.');
      await _load();
    } on ApiException catch (e) {
      if (e.statusCode == 0) {
        await offlineQueue.add(
          OfflineAction(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            label: 'Ponto ${schedule.title}',
            method: 'POST',
            path: '/api/schedules/${schedule.id}/register-point',
            body: payload,
          ),
        );
        showMessage(context, 'Sem conexão: ponto salvo para sincronizar.');
      } else {
        showMessage(context, e.message, error: true);
      }
    }
  }

  Future<void> _finishDialog(Schedule schedule) async {
    final controller = TextEditingController(text: schedule.finalKm?.toStringAsFixed(0) ?? '');
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: const Text('Finalizar viagem', style: TextStyle(color: colorText, fontSize: 15)),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: colorText),
          decoration: const InputDecoration(labelText: 'KM final'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
            child: const Text('Finalizar'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    final km = double.tryParse(controller.text.replaceAll(',', '.'));
    if (km == null || km <= 0) {
      showMessage(context, 'Informe um KM final válido.', error: true);
      return;
    }
    try {
      await scheduleService.finishTrip(schedule.id, {'finalKm': km});
      showMessage(context, 'Viagem finalizada.');
      await _load();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  bool _outsideTolerance(Schedule schedule) {
    if (schedule.startTime == null) return false;
    final parts = schedule.startTime!.split(':');
    if (parts.length < 2) return false;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return false;
    final now = DateTime.now();
    final expected = DateTime(now.year, now.month, now.day, hour, minute);
    return now.difference(expected).inMinutes.abs() > 10;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Minhas escalas'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: ['TODAS', 'DAY', 'NIGHT']
                  .map(
                    (f) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(f),
                        selected: _filter == f,
                        onSelected: (_) => setState(() => _filter = f),
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
                    : _filtered.isEmpty
                        ? const EmptyView(message: 'Nenhuma escala encontrada.', icon: Icons.calendar_month_outlined)
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            itemCount: _filtered.length,
                            itemBuilder: (context, index) {
                              final s = _filtered[index];
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
                                                style: const TextStyle(
                                                    color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
                                          ),
                                          StatusBadge.auto(s.status),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        '${_fmt(s.date)} • ${s.startTime ?? "--:--"} → ${s.endTime ?? "--:--"}',
                                        style: const TextStyle(color: colorMuted, fontSize: 11),
                                      ),
                                      if (s.vehiclePlate != null)
                                        Text('Placa: ${s.vehiclePlate}',
                                            style: const TextStyle(color: colorMuted, fontSize: 11)),
                                      if (s.clientName != null)
                                        Text('Cliente: ${s.clientName}',
                                            style: const TextStyle(color: colorMuted, fontSize: 11)),
                                      const SizedBox(height: 10),
                                      Wrap(
                                        spacing: 8,
                                        children: [
                                          OutlinedButton.icon(
                                            onPressed: () => _pointDialog(s),
                                            icon: const Icon(Icons.how_to_reg, size: 14),
                                            label: const Text('Ponto'),
                                          ),
                                          OutlinedButton.icon(
                                            onPressed: () => _finishDialog(s),
                                            icon: const Icon(Icons.flag, size: 14),
                                            label: const Text('Finalizar'),
                                          ),
                                          OutlinedButton.icon(
                                            onPressed: () => Navigator.of(context).push(
                                              MaterialPageRoute(
                                                  builder: (_) => TripExecutionScreen(schedule: s)),
                                            ),
                                            icon: const Icon(Icons.navigation, size: 14),
                                            label: const Text('Executar'),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }

  static String _fmt(String value) {
    final d = DateTime.tryParse(value);
    if (d == null) return value;
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }
}
