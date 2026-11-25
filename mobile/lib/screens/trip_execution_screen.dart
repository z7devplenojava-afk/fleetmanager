import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../models/models.dart';
import '../widgets/common.dart';

class TripExecutionScreen extends StatefulWidget {
  final Schedule? schedule;

  const TripExecutionScreen({super.key, this.schedule});

  @override
  State<TripExecutionScreen> createState() => _TripExecutionScreenState();
}

class _TripExecutionScreenState extends State<TripExecutionScreen> {
  final _initialKmController = TextEditingController();
  final _finalKmController = TextEditingController();
  final _searchController = TextEditingController();
  List<Schedule> _schedules = const [];
  Schedule? _selected;
  List<BoardingPassenger> _passengers = const [];
  bool _loading = true;
  bool _busy = false;
  int _phase = 0; // 0 preparação, 1 em viagem, 2 finalizada
  String _direction = 'IDA';

  @override
  void initState() {
    super.initState();
    _selected = widget.schedule;
    _load();
  }

  @override
  void dispose() {
    _initialKmController.dispose();
    _finalKmController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      if (_selected == null) {
        final now = DateTime.now();
        _schedules = await scheduleService.mySchedules(
          from: DateTime(now.year, now.month, 1),
          to: DateTime(now.year, now.month + 1, 0),
        );
        if (_schedules.isNotEmpty) _selected = _schedules.first;
      }
      await _loadPassengers();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    } catch (e) {
      showMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadPassengers() async {
    final schedule = _selected;
    if (schedule == null) {
      _passengers = const [];
      return;
    }
    try {
      final routeId = schedule.routeCode ?? schedule.id;
      _passengers = await boardingService.passengers(routeId, direction: _direction);
    } on ApiException catch (e) {
      if (e.statusCode >= 400 && e.statusCode < 500) {
        _passengers = const [];
      }
    }
    if (mounted) setState(() {});
  }

  Future<void> _start() async {
    final schedule = _selected;
    final km = double.tryParse(_initialKmController.text.replaceAll(',', '.'));
    if (schedule == null || km == null || km <= 0) {
      showMessage(context, 'Selecione a escala e informe o KM inicial.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await scheduleService.startTrip(schedule.id, {
        'initialKm': km,
        'checklistOk': true,
        'direction': _direction,
        'passengersBoarded': _passengers.where((p) => p.boarded).length,
      });
      setState(() => _phase = 1);
      showMessage(context, 'Viagem iniciada.');
    } on ApiException catch (e) {
      if (e.statusCode == 404 || e.statusCode == 405) {
        await scheduleService.registerPoint(schedule.id, {'initialKm': km, 'forgotPoint': false});
        setState(() => _phase = 1);
        showMessage(context, 'Ponto de início registrado.');
      } else {
        showMessage(context, e.message, error: true);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _finish() async {
    final schedule = _selected;
    final km = double.tryParse(_finalKmController.text.replaceAll(',', '.'));
    if (schedule == null || km == null || km <= 0) {
      showMessage(context, 'Informe o KM final.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await scheduleService.finishTrip(schedule.id, {
        'finalKm': km,
        'direction': _direction,
        'routeCode': schedule.routeCode,
        'passengersCount': _passengers.where((p) => p.boarded).length,
        'occurrences': 'Código de percurso: ${schedule.routeCode ?? 'não informado'}',
      });
      setState(() => _phase = 2);
      showMessage(context, 'Viagem finalizada.');
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _validate(String rawCode) async {
    final code = rawCode.trim();
    if (code.isEmpty) return;
    final schedule = _selected;
    if (schedule == null) {
      showMessage(context, 'Selecione uma escala.', error: true);
      return;
    }
    double? lat;
    double? lng;
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      lat = position.latitude;
      lng = position.longitude;
    } catch (_) {
      // GPS opcional: segue sem coordenadas.
    }
    final payload = <String, dynamic>{
      'scheduleId': schedule.id,
      'direction': _direction,
      'validationMode': 'QR_MOTORISTA',
      'latitude': lat,
      'longitude': lng,
    };
    final digits = code.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 11) {
      payload['cpf'] = digits;
    } else {
      payload['matricula'] = code;
    }
    try {
      final result = await boardingService.validateQr(payload);
      final name = result['passengerName']?.toString() ?? result['name']?.toString();
      showMessage(context, name != null ? 'Embarque confirmado: $name' : 'Embarque confirmado.');
      setState(() {
        final idx = _passengers.indexWhere((p) =>
            p.id == result['passengerId']?.toString() ||
            p.cpf == digits ||
            p.registration == code);
        if (idx >= 0) _passengers[idx].boarded = true;
      });
      _searchController.clear();
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  Future<void> _openScanner() async {
    final code = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const _QrScanner()),
    );
    if (code != null && code.isNotEmpty) {
      await _validate(code);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Execução da viagem')),
      body: _loading
          ? const LoadingView()
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _scheduleSelector(),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _directionTab('IDA')),
                    const SizedBox(width: 8),
                    Expanded(child: _directionTab('VOLTA')),
                  ],
                ),
                const SizedBox(height: 16),
                _phaseCard(),
                const SizedBox(height: 16),
                _boardingCard(),
              ],
            ),
    );
  }

  Widget _directionTab(String value) {
    final selected = _direction == value;
    return GestureDetector(
      onTap: () async {
        setState(() => _direction = value);
        await _loadPassengers();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? colorPrimary : colorSurfaceAlt,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: selected ? colorPrimary : colorBorder),
        ),
        child: Center(
          child: Text(
            value,
            style: TextStyle(
                color: selected ? Colors.white : colorMuted,
                fontSize: 12,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal),
          ),
        ),
      ),
    );
  }

  Widget _scheduleSelector() {
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Escala', style: TextStyle(color: colorMuted, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_selected != null)
            Text(
              '${_selected!.title} • ${_fmt(_selected!.date)}',
              style: const TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold),
            )
          else if (_schedules.isEmpty)
            const Text('Nenhuma escala disponível.', style: TextStyle(color: colorMuted, fontSize: 12))
          else
            DropdownButtonFormField<Schedule>(
              initialValue: _selected,
              dropdownColor: colorSurfaceAlt,
              style: const TextStyle(color: colorText),
              items: _schedules
                  .map((s) => DropdownMenuItem(
                        value: s,
                        child: Text(s.title, style: const TextStyle(fontSize: 12)),
                      ))
                  .toList(),
              onChanged: (v) async {
                setState(() => _selected = v);
                await _loadPassengers();
              },
            ),
        ],
      ),
    );
  }

  Widget _phaseCard() {
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Text('Viagem', style: TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
              const Spacer(),
              StatusBadge.auto(_phase == 0 ? 'PREPARAÇÃO' : _phase == 1 ? 'EM ANDAMENTO' : 'CONCLUÍDA'),
            ],
          ),
          const SizedBox(height: 12),
          if (_phase == 0) ...[
            TextField(
              controller: _initialKmController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: colorText),
              decoration: const InputDecoration(labelText: 'KM inicial'),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _busy ? null : _start,
              style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
              child: const Text('INICIAR VIAGEM'),
            ),
          ] else if (_phase == 1) ...[
            TextField(
              controller: _finalKmController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: colorText),
              decoration: const InputDecoration(labelText: 'KM final'),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _busy ? null : _finish,
              style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
              child: const Text('FINALIZAR VIAGEM'),
            ),
          ] else
            const Text('Viagem finalizada com sucesso.', style: TextStyle(color: colorSuccess, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _boardingCard() {
    final filtered = _passengers.where((p) {
      if (_searchController.text.isEmpty) return true;
      final term = _searchController.text.toLowerCase();
      return p.name.toLowerCase().contains(term) ||
          (p.cpf ?? '').contains(term) ||
          (p.registration ?? '').toLowerCase().contains(term);
    }).toList();
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Embarque de passageiros',
              style: TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          TextField(
            controller: _searchController,
            onChanged: (_) => setState(() {}),
            style: const TextStyle(color: colorText),
            decoration: const InputDecoration(
              labelText: 'CPF ou matrícula',
              prefixIcon: Icon(Icons.search, color: colorMuted),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _validate(_searchController.text),
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Validar'),
                  style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _openScanner,
                  icon: const Icon(Icons.qr_code_scanner, size: 16),
                  label: const Text('Ler QR'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (filtered.isEmpty)
            const Text('Nenhum passageiro carregado para esta rota.',
                style: TextStyle(color: colorMuted, fontSize: 11))
          else
            ...filtered.map(
              (p) => ListTile(
                dense: true,
                title: Text(p.name, style: const TextStyle(color: colorText, fontSize: 12)),
                subtitle: Text(
                  '${p.registration ?? ''} ${p.cpf != null ? '• ${p.cpf}' : ''}',
                  style: const TextStyle(color: colorMuted, fontSize: 10),
                ),
                trailing: Icon(
                  p.boarded ? Icons.check_circle : Icons.radio_button_unchecked,
                  color: p.boarded ? colorSuccess : colorBorder,
                  size: 20,
                ),
              ),
            ),
        ],
      ),
    );
  }

  static String _fmt(String value) {
    final d = DateTime.tryParse(value);
    if (d == null) return value;
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';
  }
}

class _QrScanner extends StatefulWidget {
  const _QrScanner();

  @override
  State<_QrScanner> createState() => _QrScannerState();
}

class _QrScannerState extends State<_QrScanner> {
  final _controller = MobileScannerController();
  bool _handled = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_handled) return;
    final codes = capture.barcodes;
    if (codes.isEmpty) return;
    final value = codes.first.rawValue;
    if (value == null || value.isEmpty) return;
    _handled = true;
    Navigator.of(context).pop(value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ler QR do passageiro')),
      body: MobileScanner(controller: _controller, onDetect: _onDetect),
    );
  }
}
