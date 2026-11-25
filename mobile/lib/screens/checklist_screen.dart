import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../core/offline_queue.dart';
import '../models/models.dart';
import '../widgets/common.dart';

class ChecklistScreen extends StatefulWidget {
  const ChecklistScreen({super.key});

  @override
  State<ChecklistScreen> createState() => _ChecklistScreenState();
}

class _ChecklistScreenState extends State<ChecklistScreen> {
  final _imagePicker = ImagePicker();
  final _initialKmController = TextEditingController();
  final _finalKmController = TextEditingController();
  final _observationsController = TextEditingController();
  final _problemController = TextEditingController();

  String _type = 'EXIT';
  List<Schedule> _schedules = const [];
  Schedule? _selected;
  List<ChecklistConfigItem> _items = const [];
  final Set<String> _checked = {};
  final List<File> _photos = <File>[];
  final List<File> _odometerPhotos = [];
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _initialKmController.dispose();
    _finalKmController.dispose();
    _observationsController.dispose();
    _problemController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final now = DateTime.now();
      final schedules = await scheduleService.mySchedules(
        from: DateTime(now.year, now.month, 1),
        to: DateTime(now.year, now.month + 1, 0),
      );
      _schedules = schedules;
      _selected = schedules.isNotEmpty ? schedules.first : null;
      await _loadConfig();
    } catch (e) {
      _error = e is ApiException ? e.message : e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadConfig() async {
    final vehicleId = _selected?.vehicleId;
    if (vehicleId == null || vehicleId.isEmpty) {
      _items = const [];
      return;
    }
    _items = await checklistService.configForVehicle(vehicleId);
  }

  Future<void> _pickPhotos({required bool odometer}) async {
    final picked = await _imagePicker.pickMultiImage(imageQuality: 70);
    if (picked.isEmpty) return;
    setState(() {
      if (odometer) {
        _odometerPhotos.addAll(picked.map((e) => File(e.path)));
      } else {
        _photos.addAll(picked.map((e) => File(e.path)));
      }
    });
  }

  Future<void> _takePhoto() async {
    final picked = await _imagePicker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (picked == null) return;
    setState(() => _photos.add(File(picked.path)));
  }

  Future<void> _save() async {
    final missing = _items.where((i) => i.required && !_checked.contains(i.id)).toList();
    if (missing.isNotEmpty) {
      showMessage(context, 'Marque ${missing.length} item(ns) obrigatório(s).', error: true);
      return;
    }
    final initialKm = double.tryParse(_initialKmController.text.replaceAll(',', '.'));
    final finalKm = double.tryParse(_finalKmController.text.replaceAll(',', '.'));
    if (_type == 'ARRIVAL' && (initialKm == null || finalKm == null)) {
      showMessage(context, 'Informe KM inicial e final.', error: true);
      return;
    }
    final payload = <String, dynamic>{
      'vehicleId': _selected?.vehicleId,
      'driverId': session.driverId,
      'type': _type,
      'kmReading': initialKm ?? finalKm ?? 0,
      'initialKm': initialKm,
      'finalKm': finalKm,
      'distanceTravelled': (finalKm != null && initialKm != null) ? finalKm - initialKm : null,
      'checklistData': {
        for (final item in _items) item.id: _checked.contains(item.id),
      },
      'driverProblemReport': _problemController.text.trim(),
      'observations': _observationsController.text.trim(),
    };
    setState(() => _saving = true);
    try {
      final created = await checklistService.create(payload);
      final id = created['id']?.toString();
      if (id != null && id.isNotEmpty) {
        if (_odometerPhotos.isNotEmpty) {
          await checklistService.uploadOdometerPhoto(
              id, _odometerPhotos.first, _observationsController.text.trim());
        }
        if (_photos.isNotEmpty) {
          await checklistService.uploadVehiclePhotos(id, _photos);
        }
      }
      showMessage(context, 'Checklist enviado com sucesso.');
      _checked.clear();
      _photos.clear();
      _odometerPhotos.clear();
      _initialKmController.clear();
      _finalKmController.clear();
      _observationsController.clear();
      _problemController.clear();
    } on ApiException catch (e) {
      if (e.statusCode == 0) {
        await offlineQueue.add(
          OfflineAction(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            label: 'Checklist ${_type == 'EXIT' ? 'saída' : 'chegada'}',
            method: 'POST',
            path: '/api/frota/vehicle-gate-checklists',
            body: payload,
          ),
        );
        showMessage(context, 'Sem conexão: checklist salvo para sincronizar depois.');
      } else {
        showMessage(context, e.message, error: true);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checklist & Avarias')),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _typeSelector(),
                    const SizedBox(height: 16),
                    _scheduleSelector(),
                    const SizedBox(height: 16),
                    _itemsCard(),
                    const SizedBox(height: 16),
                    _kmCard(),
                    const SizedBox(height: 16),
                    _photosCard(),
                    const SizedBox(height: 16),
                    InfoCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextField(
                            controller: _problemController,
                            maxLines: 3,
                            style: const TextStyle(color: colorText),
                            decoration: const InputDecoration(labelText: 'Problemas encontrados'),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _observationsController,
                            maxLines: 3,
                            style: const TextStyle(color: colorText),
                            decoration: const InputDecoration(labelText: 'Observações gerais'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _save,
                        style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
                        child: _saving
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text('ENVIAR CHECKLIST', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _typeSelector() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: colorSurfaceAlt,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: _typeTab('EXIT', 'Check-out / Saída', Icons.logout),
          ),
          Expanded(
            child: _typeTab('ARRIVAL', 'Check-in / Chegada', Icons.login),
          ),
        ],
      ),
    );
  }

  Widget _typeTab(String value, String label, IconData icon) {
    final selected = _type == value;
    return GestureDetector(
      onTap: () => setState(() => _type = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? colorPrimary : Colors.transparent,
          borderRadius: BorderRadius.circular(9),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: selected ? Colors.white : colorMuted),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                    color: selected ? Colors.white : colorMuted,
                    fontSize: 11,
                    fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
          ],
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
          DropdownButtonFormField<Schedule>(
            initialValue: _selected,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: colorBorder)),
            ),
            dropdownColor: colorSurfaceAlt,
            style: const TextStyle(color: colorText),
            items: _schedules
                .map((s) => DropdownMenuItem(
                      value: s,
                      child: Text('${_fmt(s.date)} • ${s.title}',
                          overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                    ))
                .toList(),
            onChanged: (value) async {
              setState(() => _selected = value);
              await _loadConfig();
            },
          ),
          if (_selected != null) ...[
            const SizedBox(height: 10),
            Text('Veículo: ${_selected!.vehiclePlate ?? "não informado"}',
                style: const TextStyle(color: colorMuted, fontSize: 12)),
            Text('Cliente: ${_selected!.clientName ?? "não informado"}',
                style: const TextStyle(color: colorMuted, fontSize: 12)),
          ],
        ],
      ),
    );
  }

  Widget _itemsCard() {
    final requiredTotal = _items.where((e) => e.required).length;
    final doneRequired = _items.where((e) => e.required && _checked.contains(e.id)).length;
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Itens da vistoria',
                  style: TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
              Text('$doneRequired/$requiredTotal', style: const TextStyle(color: colorMuted, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: requiredTotal == 0 ? 1 : doneRequired / requiredTotal,
            color: colorSuccess,
            backgroundColor: colorBorder,
          ),
          const SizedBox(height: 10),
          if (_items.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('Nenhum item configurado para este veículo.',
                  style: TextStyle(color: colorMuted, fontSize: 12)),
            )
          else
            ..._items.map(
              (item) => CheckboxListTile(
                value: _checked.contains(item.id),
                onChanged: (value) => setState(() {
                  if (value == true) {
                    _checked.add(item.id);
                  } else {
                    _checked.remove(item.id);
                  }
                }),
                title: Text(item.description, style: const TextStyle(color: colorText, fontSize: 12)),
                subtitle: Text(item.category, style: const TextStyle(color: colorMuted, fontSize: 10)),
                activeColor: colorPrimaryLight,
                dense: true,
                controlAffinity: ListTileControlAffinity.leading,
              ),
            ),
        ],
      ),
    );
  }

  Widget _kmCard() {
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Quilometragem', style: TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _initialKmController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'KM inicial'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _finalKmController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: colorText),
                  decoration: const InputDecoration(labelText: 'KM final'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _photosCard() {
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _takePhoto,
                  icon: const Icon(Icons.camera_alt, size: 16),
                  label: const Text('Tirar foto'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pickPhotos(odometer: false),
                  icon: const Icon(Icons.photo_library, size: 16),
                  label: const Text('Galeria'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => _pickPhotos(odometer: true),
            icon: const Icon(Icons.speed, size: 16),
            label: const Text('Foto do odômetro'),
          ),
          if (_photos.isNotEmpty || _odometerPhotos.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ..._photos.map((f) => _thumb(f)),
                ..._odometerPhotos.map((f) => _thumb(f)),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _thumb(File file) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.file(file, width: 64, height: 64, fit: BoxFit.cover),
    );
  }

  static String _fmt(String value) {
    final d = DateTime.tryParse(value);
    if (d == null) return value;
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';
  }
}
