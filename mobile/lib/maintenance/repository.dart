import 'dart:io';

import '../core/api_client.dart';
import 'models.dart';

class MaintenanceRepository {
  MaintenanceRepository(this.api);

  final ApiClient api;

  String _date(DateTime? d) => d == null
      ? ''
      : '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  // ---------------- Ordem de serviço ----------------

  Future<List<WorkOrder>> workOrders({
    String? status,
    String? type,
    String? search,
    String? garageId,
    DateTime? from,
    DateTime? to,
  }) async {
    final q = <String, String>{};
    if (status != null && status.isNotEmpty) q['status'] = status;
    if (type != null && type.isNotEmpty) q['maintenanceType'] = type;
    if (search != null && search.isNotEmpty) q['search'] = search;
    if (garageId != null && garageId.isNotEmpty) q['garageId'] = garageId;
    if (from != null) q['dateFrom'] = _date(from);
    if (to != null) q['dateTo'] = _date(to);
    final response = await api.get('/api/fleet-work-orders', query: q);
    return mapList(response).map(WorkOrder.fromJson).toList();
  }

  Future<WorkOrder> workOrder(String id) async {
    final r = await api.get('/api/fleet-work-orders/$id');
    return WorkOrder.fromJson(r is Map<String, dynamic> ? r : const {});
  }

  Future<Map<String, dynamic>> createWorkOrder(Map<String, dynamic> payload) async {
    final r = await api.post('/api/fleet-work-orders', payload);
    return r is Map<String, dynamic> ? r : <String, dynamic>{'id': r?.toString() ?? ''};
  }

  Future<void> updateWorkOrder(String id, Map<String, dynamic> payload) =>
      api.put('/api/fleet-work-orders/$id', payload);

  Future<void> updateStatus(String id, String status) async {
    final uri = Uri.parse('${api.session.baseUrl}/api/fleet-work-orders/$id/status')
        .replace(queryParameters: {'status': status});
    try {
      await api.patch(uri.toString());
    } on ApiException catch (e) {
      if (e.statusCode == 404 || e.statusCode == 405) {
        await api.put('/api/fleet-work-orders/$id/status', {'status': status});
      } else {
        rethrow;
      }
    }
  }

  Future<void> completeWorkOrder(String id, String maintenancePerformed) =>
      api.put('/api/fleet-work-orders/$id', {'maintenancePerformed': maintenancePerformed});

  Future<void> deleteWorkOrder(String id) => api.delete('/api/fleet-work-orders/$id');

  Future<void> bulkCancel(List<String> ids, String reason) =>
      api.post('/api/fleet-work-orders/bulk-cancel', {'ids': ids, 'reason': reason});

  Future<void> duplicateWorkOrder(String id) =>
      api.post('/api/fleet-work-orders/$id/duplicate', {});

  Future<void> assignMechanic(String id, String mechanicId) =>
      api.post('/api/fleet-work-orders/$id/assign-mechanic', {'mechanicId': mechanicId});

  Future<void> approveExternal(String id, {String notes = ''}) =>
      api.post('/api/fleet-work-orders/$id/approve-external-service', {'notes': notes});

  Future<void> rejectExternal(String id, String reason) =>
      api.post('/api/fleet-work-orders/$id/reject-external-service', {'reason': reason});

  Future<void> uploadPhotos(String id, List<File> files) {
    if (files.isEmpty) return Future.value();
    return api.uploadFiles('/api/fleet-work-orders/upload-photos', field: 'photos', files: files,
        fields: {'workOrderId': id});
  }

  Future<List<Map<String, dynamic>>> checklistItems({String? vehicleType, String? templateModel}) async {
    final q = <String, String>{};
    if (vehicleType != null) q['vehicleType'] = vehicleType;
    if (templateModel != null) q['templateModel'] = templateModel;
    return mapList(await api.get('/api/fleet-work-orders/checklist-items', query: q));
  }

  Future<List<Map<String, dynamic>>> preventiveSchedule() async =>
      mapList(await api.get('/api/fleet-work-orders/preventive-schedule'));

  Future<void> runPreventiveScan() =>
      api.post('/api/fleet-work-orders/preventive-auto/run', {});

  Future<List<Map<String, dynamic>>> servicesCatalog() async =>
      mapList(await api.get('/api/fleet-work-orders/services-catalog'));

  Future<void> quickService(Map<String, dynamic> payload) =>
      api.post('/api/fleet-work-orders/quick-service', payload);

  Future<List<Map<String, dynamic>>> history(String id) async =>
      mapList(await api.get('/api/fleet-work-orders/$id/history'));

  Future<void> addHistoryNote(String id, String note) =>
      api.post('/api/fleet-work-orders/$id/history/note', {
        'note': note,
        'performedBy': api.session.user?.displayName,
      });

  Future<List<Map<String, dynamic>>> expenses(String id) async =>
      mapList(await api.get('/api/fleet-work-orders/$id/expense'));

  Future<void> createExpense(String id, Map<String, dynamic> payload) =>
      api.post('/api/fleet-work-orders/$id/expense', payload);

  Future<List<Map<String, dynamic>>> vehicleRanking() async =>
      mapList(await api.get('/api/fleet-work-orders/ranking/vehicles'));

  String pdfUrl(String id, {String model = 'MODELO_1', bool blank = false}) =>
      Uri.parse('${api.session.baseUrl}/api/fleet-work-orders/$id/pdf').replace(queryParameters: {
        'templateModel': model,
        'blank': blank.toString(),
      }).toString();

  String reportUrl({DateTime? from, DateTime? to, String? status, String? vehicleId}) =>
      Uri.parse('${api.session.baseUrl}/api/fleet-work-orders/report/pdf').replace(queryParameters: {
        if (from != null) 'startDate': _date(from),
        if (to != null) 'endDate': _date(to),
        if (status != null && status.isNotEmpty) 'status': status,
        if (vehicleId != null && vehicleId.isNotEmpty) 'vehicleId': vehicleId,
      }).toString();

  // ---------------- Planos de manutenção ----------------

  Future<List<MaintenancePlan>> plans() async {
    final r = await api.get('/api/maintenance-plans');
    return mapList(r).map(MaintenancePlan.fromJson).toList();
  }

  Future<List<MaintenancePlan>> planStatusAll() async {
    final r = await api.get('/api/maintenance-plans/status/all');
    return mapList(r).map(MaintenancePlan.fromJson).toList();
  }

  Future<List<MaintenancePlan>> planStatusForVehicle(String vehicleId) async {
    final r = await api.get('/api/maintenance-plans/vehicle/$vehicleId/status');
    return mapList(r).map(MaintenancePlan.fromJson).toList();
  }

  Future<void> createPlan(Map<String, dynamic> payload) =>
      api.post('/api/maintenance-plans', payload);

  Future<void> deletePlan(String id) => api.delete('/api/maintenance-plans/$id');

  // ---------------- Controles de componentes ----------------

  Future<List<ComponentControl>> componentDashboard({String? controlType}) async {
    final q = controlType == null || controlType.isEmpty ? null : {'controlType': controlType};
    final r = await api.get('/api/fleet-component-controls/dashboard', query: q);
    return mapList(r).map(ComponentControl.fromJson).toList();
  }

  Future<List<ComponentControl>> componentAlerts() async {
    final r = await api.get('/api/fleet-component-controls/alerts');
    return mapList(r).map(ComponentControl.fromJson).toList();
  }

  Future<void> createComponentControl(Map<String, dynamic> payload) =>
      api.post('/api/fleet-component-controls/manual', payload);

  Future<List<Map<String, dynamic>>> componentHistory(String vehicleId, String type) async =>
      mapList(await api.get('/api/fleet-component-controls/history/$vehicleId/$type'));

  // ---------------- Laudos / inspeções ----------------

  Future<List<Inspection>> inspections({String? search, String? status}) async {
    final q = <String, String>{};
    if (search != null && search.isNotEmpty) q['search'] = search;
    if (status != null && status.isNotEmpty) q['status'] = status;
    final r = await api.get('/api/vehicle-inspections', query: q);
    return mapList(r).map(Inspection.fromJson).toList();
  }

  Future<Inspection> inspection(String id) async {
    final r = await api.get('/api/vehicle-inspections/$id');
    return Inspection.fromJson(r is Map<String, dynamic> ? r : const {});
  }

  Future<void> createInspection(Map<String, dynamic> payload) =>
      api.post('/api/vehicle-inspections', payload);

  Future<void> updateInspection(String id, Map<String, dynamic> payload) =>
      api.put('/api/vehicle-inspections/$id', payload);

  Future<void> deleteInspection(String id) => api.delete('/api/vehicle-inspections/$id');

  Future<String?> nextInspectionNumber() async {
    try {
      final r = await api.get('/api/vehicle-inspections/next-registry-number');
      if (r is Map) return (r['registryNumber'] ?? r['number'])?.toString();
      return r?.toString();
    } on ApiException {
      return null;
    }
  }

  // ---------------- Pneus ----------------

  Future<List<Tire>> tires() async {
    final r = await api.get('/api/tires');
    return mapList(r).map(Tire.fromJson).toList();
  }

  Future<List<Tire>> availableTires() async {
    final r = await api.get('/api/tires/available');
    return mapList(r).map(Tire.fromJson).toList();
  }

  Future<List<Tire>> chassisTires(String vehicleId) async {
    final r = await api.get('/api/tires/chassis/$vehicleId');
    return mapList(r).map(Tire.fromJson).toList();
  }

  Future<void> createTire(Map<String, dynamic> payload) => api.post('/api/tires', payload);

  Future<void> mountTire(Map<String, dynamic> payload) =>
      api.post('/api/tires/mount', payload);

  Future<void> dismountTire(Map<String, dynamic> payload) =>
      api.post('/api/tires/dismount', payload);

  Future<void> recapTire(String id, {bool send = true}) =>
      api.post('/api/tires/$id/${send ? 'recap-send' : 'recap-return'}', {});

  Future<void> scrapTire(String id, Map<String, dynamic> payload) =>
      api.post('/api/tires/$id/scrap', payload);

  Future<List<Map<String, dynamic>>> tireHistory(String id) async =>
      mapList(await api.get('/api/tires/$id/history'));

  // ---------------- Checklists ----------------

  Future<List<GateChecklist>> gateChecklists({
    String? vehicleId,
    String? type,
    DateTime? from,
    DateTime? to,
  }) async {
    final q = <String, String>{};
    if (vehicleId != null && vehicleId.isNotEmpty) q['vehicleId'] = vehicleId;
    if (type != null && type.isNotEmpty) q['type'] = type;
    if (from != null) q['dateFrom'] = _date(from);
    if (to != null) q['dateTo'] = _date(to);
    final r = await api.get('/api/frota/vehicle-gate-checklists', query: q);
    return mapList(r).map(GateChecklist.fromJson).toList();
  }

  Future<void> deleteGateChecklist(String id) =>
      api.delete('/api/frota/vehicle-gate-checklists/$id');

  Future<List<Map<String, dynamic>>> checklistConfig(String vehicleId) async =>
      mapList(await api.get('/api/frota/checklist-configs', query: {'vehicleId': vehicleId}));

  Future<List<Map<String, dynamic>>> clientChecklistTemplates() async =>
      mapList(await api.get('/api/client-checklists/templates'));

  Future<List<Map<String, dynamic>>> clientChecklistRecords({String? clientId}) async {
    final q = clientId == null || clientId.isEmpty ? null : {'clientId': clientId};
    return mapList(await api.get('/api/client-checklists/records', query: q));
  }

  Future<void> createClientChecklistRecord(Map<String, dynamic> payload) =>
      api.post('/api/client-checklists/records', payload);

  // ---------------- Limpeza / lavajato ----------------

  Future<List<Cleaning>> cleanings({String? status}) async {
    final q = status == null || status.isEmpty ? null : {'status': status};
    final r = await api.get('/api/frota/vehicle-cleanings', query: q);
    return mapList(r).map(Cleaning.fromJson).toList();
  }

  Future<void> createCleaning(Map<String, dynamic> payload) =>
      api.post('/api/frota/vehicle-cleanings', payload);

  Future<void> cleaningAction(String id, String action, [Map<String, dynamic>? payload]) =>
      api.post('/api/frota/vehicle-cleanings/$id/$action', payload ?? {});

  Future<void> deleteCleaning(String id) => api.delete('/api/frota/vehicle-cleanings/$id');

  Future<List<Map<String, dynamic>>> carWashes() async =>
      mapList(await api.get('/api/car-washes'));

  // ---------------- CFME ----------------

  Future<List<CfmeDocument>> cfmeDocuments() async {
    final r = await api.get('/api/cfme-documents');
    return mapList(r).map(CfmeDocument.fromJson).toList();
  }

  Future<void> uploadCfme(File file, Map<String, String> fields) =>
      api.uploadFiles('/api/cfme-documents', field: 'file', files: [file], fields: fields);

  Future<void> deleteCfme(String id) => api.delete('/api/cfme-documents/$id');

  String cfmeDownloadUrl(String id) => '${api.session.baseUrl}/api/cfme-documents/$id/download';

  // ---------------- Garagens ----------------

  Future<List<Garage>> garages() async {
    final r = await api.get('/api/garages');
    return mapList(r).map(Garage.fromJson).toList();
  }

  Future<void> createGarage(Map<String, dynamic> payload) => api.post('/api/garages', payload);

  Future<void> deleteGarage(String id) => api.delete('/api/garages/$id');

  // ---------------- Veículos (para selects) ----------------

  Future<List<Map<String, dynamic>>> vehicles() async {
    final r = await api.get('/api/vehicles');
    return mapList(r);
  }

  Future<List<Map<String, dynamic>>> drivers() async {
    final r = await api.get('/api/drivers');
    return mapList(r);
  }
}
