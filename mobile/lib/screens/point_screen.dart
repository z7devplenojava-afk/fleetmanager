import 'dart:io';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../core/offline_queue.dart';
import '../models/models.dart';
import '../services/driver_services.dart';
import '../widgets/common.dart';

class PointScreen extends StatefulWidget {
  const PointScreen({super.key});

  @override
  State<PointScreen> createState() => _PointScreenState();
}

class _PointScreenState extends State<PointScreen> {
  final _imagePicker = ImagePicker();
  final _justificationController = TextEditingController();
  List<TimeRecord> _records = const [];
  String? _nextType;
  String? _error;
  bool _loading = true;
  bool _sending = false;
  double? _latitude;
  double? _longitude;
  File? _photo;

  @override
  void initState() {
    super.initState();
    _load();
    _locate();
  }

  @override
  void dispose() {
    _justificationController.dispose();
    super.dispose();
  }

  Future<void> _locate() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
      if (mounted) {
        setState(() {
          _latitude = position.latitude;
          _longitude = position.longitude;
        });
      }
    } catch (_) {
      // Localização é opcional no registro.
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final employeeId = session.user?.employeeId ?? '';
      final results = await Future.wait([
        pointService.today(employeeId),
        pointService.nextType(employeeId),
        pointService.balance(),
      ]);
      _records = results[0] as List<TimeRecord>;
      _nextType = results[1] as String?;
      // Saldo de horas está disponível no portal do empregado.
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _punch(String type) async {
    setState(() => _sending = true);
    final payload = <String, dynamic>{
      'employeeId': session.user?.employeeId,
      'recordType': type,
      'recordedAt': DateTime.now().toIso8601String(),
      'latitude': _latitude,
      'longitude': _longitude,
      'location': _latitude != null ? 'Lat $_latitude, Lon $_longitude' : null,
      'photoBase64': _photo != null ? encodeFileBase64(_photo!) : null,
      'qrCodeUsed': null,
    };
    try {
      await pointService.register(payload);
      showMessage(context, '$type registrado.');
      _photo = null;
      await _load();
    } on ApiException catch (e) {
      if (e.statusCode == 0) {
        await offlineQueue.add(
          OfflineAction(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            label: 'Ponto $type',
            method: 'POST',
            path: '/api/time-records/register',
            body: payload,
          ),
        );
        showMessage(context, 'Sem conexão: ponto salvo para sincronizar.');
      } else {
        showMessage(context, e.message, error: true);
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _requestAdjustment() async {
    if (_justificationController.text.trim().length < 10) {
      showMessage(context, 'Informe a justificativa (mínimo 10 caracteres).', error: true);
      return;
    }
    try {
      await pointService.requestAdjustment({
        'employeeId': session.user?.employeeId,
        'justification': _justificationController.text.trim(),
        'requestedAt': DateTime.now().toIso8601String(),
      });
      _justificationController.clear();
      showMessage(context, 'Solicitação enviada ao RH.');
    } on ApiException catch (e) {
      showMessage(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ponto eletrônico')),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    InfoCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('Registrar ponto',
                              style: TextStyle(color: colorText, fontSize: 14, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Text(
                            _latitude != null
                                ? 'Localização: ${_latitude!.toStringAsFixed(5)}, ${_longitude!.toStringAsFixed(5)}'
                                : 'Localização não disponível',
                            style: const TextStyle(color: colorMuted, fontSize: 11),
                          ),
                          const SizedBox(height: 14),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: ['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA']
                                .map(
                                  (t) => SizedBox(
                                    width: (MediaQuery.of(context).size.width - 48) / 2,
                                    child: ElevatedButton(
                                      onPressed: _sending ? null : () => _punch(t),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: t == _nextType ? colorPrimary : colorSurfaceAlt,
                                      ),
                                      child: Text(t.replaceAll('_', ' '),
                                          style: const TextStyle(fontSize: 11)),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: () async {
                              final picked = await _imagePicker.pickImage(
                                  source: ImageSource.camera, imageQuality: 60);
                              if (picked != null) setState(() => _photo = File(picked.path));
                            },
                            icon: const Icon(Icons.camera_alt, size: 16),
                            label: Text(_photo == null ? 'Tirar foto' : 'Foto anexada'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    InfoCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('Solicitar ajuste',
                              style: TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _justificationController,
                            maxLines: 3,
                            style: const TextStyle(color: colorText),
                            decoration: const InputDecoration(labelText: 'Justificativa'),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: _requestAdjustment,
                            style: ElevatedButton.styleFrom(backgroundColor: colorSurfaceAlt),
                            child: const Text('Enviar ao RH'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SectionTitle(title: 'Registros de hoje'),
                    const SizedBox(height: 8),
                    InfoCard(
                      child: _records.isEmpty
                          ? const Text('Nenhum registro hoje.',
                              style: TextStyle(color: colorMuted, fontSize: 12))
                          : Column(
                              children: _records
                                  .map(
                                    (r) => ListTile(
                                      dense: true,
                                      leading: const Icon(Icons.schedule, color: colorPrimaryLight, size: 18),
                                      title: Text(r.type, style: const TextStyle(color: colorText, fontSize: 12)),
                                      subtitle: Text(_fmt(r.recordedAt),
                                          style: const TextStyle(color: colorMuted, fontSize: 10)),
                                    ),
                                  )
                                  .toList(),
                            ),
                    ),
                  ],
                ),
    );
  }

  static String _fmt(String value) {
    final d = DateTime.tryParse(value);
    if (d == null) return value;
    return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }
}
