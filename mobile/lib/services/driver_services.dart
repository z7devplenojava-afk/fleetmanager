import 'dart:convert';
import 'dart:io';

import '../core/api_client.dart';
import '../core/session.dart';
import '../models/models.dart';

class AuthService {
  AuthService(this.api);

  final ApiClient api;

  Future<AppUser> login(String username, String password) async {
    final response = await api.post('/api/auth/login', {
      'username': username.trim(),
      'password': password,
    });
    final map = response as Map<String, dynamic>;
    final rawUser = map['user'];
    final userJson = rawUser is Map
        ? Map<String, dynamic>.from(rawUser)
        : <String, dynamic>{
            'id': map['userId'],
            'username': map['username'] ?? username,
            'email': map['email'],
            'fullName': map['name'] ?? map['fullName'],
            'roles': map['roles'] ?? const [],
            'employeeId': map['employeeId'],
            'position': map['position'],
            'isDriver': map['isDriver'],
            'permissions': map['permissions'] ?? map['customPermissions'] ?? const [],
          };
    final user = AppUser.fromJson(userJson);
    final token = (map['token'] ?? map['accessToken'] ?? '').toString();
    if (token.isEmpty) throw const ApiException(401, 'Login não retornou token de acesso.');
    await api.session.save(
      token: token,
      user: user,
      companyId: api.session.companyId ?? companyIdFromJwt(token),
    );
    return user;
  }

  Future<void> logout() => api.session.clear();

  Future<List<Driver>> drivers() async {
    final response = await api.get('/api/drivers');
    return asMapList(response).map(Driver.fromJson).toList();
  }

  Driver? resolveCurrentDriver(AppUser user, List<Driver> drivers) {
    for (final d in drivers) {
      final name = d.name.toLowerCase();
      if (name.contains(user.displayName.toLowerCase()) ||
          (user.username.isNotEmpty && name.contains(user.username.toLowerCase()))) {
        return d;
      }
    }
    return null;
  }
}

class ScheduleService {
  ScheduleService(this.api);

  final ApiClient api;

  Future<List<Schedule>> mySchedules({DateTime? from, DateTime? to}) async {
    final query = <String, String>{};
    if (from != null) query['startDate'] = _date(from);
    if (to != null) query['endDate'] = _date(to);
    final response = await api.get('/api/schedules/me', query: query);
    return asMapList(response).map(Schedule.fromJson).toList();
  }

  Future<List<Schedule>> byDate(DateTime date) async {
    final response = await api.get('/api/schedules/date', query: {'date': _date(date)});
    return asMapList(response).map(Schedule.fromJson).toList();
  }

  Future<void> registerPoint(String id, Map<String, dynamic> payload) async {
    try {
      await api.post('/api/schedules/$id/register-point', payload);
    } on ApiException catch (e) {
      if (e.statusCode == 404 || e.statusCode == 405) {
        await api.put('/api/schedules/$id', payload);
      } else {
        rethrow;
      }
    }
  }

  Future<void> startTrip(String id, Map<String, dynamic> payload) async {
    await api.post('/api/trips/start/$id', payload);
  }

  Future<void> finishTrip(String id, Map<String, dynamic> payload) async {
    try {
      await api.post('/api/schedules/$id/finish-trip', payload);
    } on ApiException catch (e) {
      if (e.statusCode == 404 || e.statusCode == 405) {
        await api.put('/api/schedules/$id', payload);
      } else {
        rethrow;
      }
    }
  }

  Future<void> reportDelay(String id, Map<String, dynamic> payload) async {
    await api.patch('/api/schedules/$id', payload);
  }

  String pdfUrl({DateTime? from, DateTime? to}) {
    final query = <String, String>{
      if (from != null) 'startDate': _date(from),
      if (to != null) 'endDate': _date(to),
      'inline': 'true',
    };
    final uri = Uri.parse('${api.session.baseUrl}/api/schedules/me/pdf')
        .replace(queryParameters: query);
    return uri.toString();
  }

  static String _date(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

class ChecklistService {
  ChecklistService(this.api);

  final ApiClient api;

  Future<List<ChecklistConfigItem>> configForVehicle(String vehicleId) async {
    final response = await api.get('/api/frota/checklist-configs', query: {'vehicleId': vehicleId});
    return asMapList(response).map(ChecklistConfigItem.fromJson).toList();
  }

  Future<List<ChecklistRecord>> records() async {
    final response = await api.get('/api/frota/vehicle-gate-checklists');
    return asMapList(response).map(ChecklistRecord.fromJson).toList();
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> payload) async {
    final response = await api.post('/api/frota/vehicle-gate-checklists', payload);
    return response is Map<String, dynamic>
        ? response
        : <String, dynamic>{'id': response?.toString() ?? ''};
  }

  Future<void> uploadOdometerPhoto(String id, File file, String description) async {
    await api.uploadFiles(
      '/api/frota/vehicle-gate-checklists/$id/odometer-photo',
      field: 'photo',
      files: [file],
      fields: {'description': description},
    );
  }

  Future<void> uploadVehiclePhotos(String id, List<File> files) async {
    if (files.isEmpty) return;
    await api.uploadFiles(
      '/api/frota/vehicle-gate-checklists/$id/vehicle-photos',
      field: 'photos',
      files: files,
    );
  }

  Future<Map<String, dynamic>?> maintenancePlan(String vehicleId) async {
    try {
      final response = await api.get('/api/maintenance-plans/vehicle/$vehicleId');
      return response is Map<String, dynamic> ? response : null;
    } on ApiException {
      return null;
    }
  }
}

class WorkOrderService {
  WorkOrderService(this.api);

  final ApiClient api;

  Future<List<WorkOrder>> all() async {
    final response = await api.get('/api/fleet-work-orders');
    return asMapList(response).map(WorkOrder.fromJson).toList();
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> payload) async {
    final response = await api.post('/api/fleet-work-orders', payload);
    return response is Map<String, dynamic>
        ? response
        : <String, dynamic>{'id': response?.toString() ?? ''};
  }

  Future<void> update(String id, Map<String, dynamic> payload) async =>
      api.put('/api/fleet-work-orders/$id', payload);

  Future<void> uploadPhotos(String id, List<File> files) async {
    if (files.isEmpty) return;
    await api.uploadFiles('/api/fleet-work-orders/upload-photos', field: 'photos', files: files,
        fields: {'workOrderId': id});
  }

  String pdfUrl(String id) => '${api.session.baseUrl}/api/fleet-work-orders/$id/pdf';
}

class FineService {
  FineService(this.api);

  final ApiClient api;

  Future<List<Fine>> byDriver(String driverId) async {
    final response = await api.get('/api/fines/driver/$driverId');
    return asMapList(response).map(Fine.fromJson).toList();
  }
}

class PointService {
  PointService(this.api);

  final ApiClient api;

  Future<void> register(Map<String, dynamic> payload) async =>
      api.post('/api/time-records/register', payload);

  Future<List<TimeRecord>> today(String employeeId) async {
    final response = await api.get('/api/time-records/today/$employeeId');
    return asMapList(response).map(TimeRecord.fromJson).toList();
  }

  Future<String?> nextType(String employeeId) async {
    final response = await api.get('/api/time-records/next-record-type/$employeeId');
    if (response is Map<String, dynamic>) {
      return (response['nextRecordType'] ?? response['type'] ?? response['recordType'])?.toString();
    }
    return response?.toString();
  }

  Future<void> requestAdjustment(Map<String, dynamic> payload) async =>
      api.post('/api/time-records/request-adjustment', payload);

  Future<Map<String, dynamic>?> balance() async {
    try {
      final response = await api.get('/api/employee-portal/time-records/balance');
      return response is Map<String, dynamic> ? response : null;
    } on ApiException {
      return null;
    }
  }
}

class EmployeePortalService {
  EmployeePortalService(this.api);

  final ApiClient api;

  Future<EmployeeProfile> profile() async {
    final response = await api.get('/api/employee-portal/profile');
    return EmployeeProfile.fromJson(response is Map<String, dynamic> ? response : const {});
  }

  Future<Map<String, dynamic>?> dashboard() async {
    final response = await api.get('/api/employee-portal/dashboard');
    return response is Map<String, dynamic> ? response : null;
  }

  Future<void> punch(Map<String, dynamic> payload) async =>
      api.post('/api/employee-portal/time-records/punch', payload);

  Future<List<TimeRecord>> timeRecords() async {
    final response = await api.get('/api/employee-portal/time-records/current-month');
    return asMapList(response).map(TimeRecord.fromJson).toList();
  }

  Future<List<Payslip>> payslips() async {
    final response = await api.get('/api/employee-portal/payslips');
    return asMapList(response).map(Payslip.fromJson).toList();
  }

  Future<List<Map<String, dynamic>>> benefits() async =>
      asMapList(await api.get('/api/employee-portal/benefits'));

  Future<List<Map<String, dynamic>>> epiForms() async =>
      asMapList(await api.get('/api/employee-portal/epi-forms'));

  Future<List<Map<String, dynamic>>> documents() async =>
      asMapList(await api.get('/api/employee-portal/documents'));

  Future<List<Map<String, dynamic>>> trainings() async =>
      asMapList(await api.get('/api/employee-portal/trainings'));

  Future<List<Map<String, dynamic>>> vacations() async =>
      asMapList(await api.get('/api/employee-portal/vacations'));

  Future<void> requestVacation(Map<String, dynamic> payload) async =>
      api.post('/api/employee-portal/vacations/request', payload);

  Future<void> cancelVacation(String id) async =>
      api.put('/api/employee-portal/vacations/$id/cancel', {});

  Future<List<Map<String, dynamic>>> notifications() async {
    try {
      return asMapList(await api.get('/api/employee-portal/notifications'));
    } on ApiException {
      return const [];
    }
  }
}

class MessageService {
  MessageService(this.api);

  final ApiClient api;

  Future<List<AppMessage>> received() async {
    final response = await api.get('/api/v1/messages/received');
    return asMapList(response).map(AppMessage.fromJson).toList();
  }

  Future<List<AppMessage>> sent() async {
    final response = await api.get('/api/v1/messages/sent');
    return asMapList(response).map(AppMessage.fromJson).toList();
  }

  Future<int> unreadCount() async {
    try {
      final response = await api.get('/api/v1/messages/unread/count');
      if (response is num) return response.toInt();
      if (response is Map<String, dynamic>) {
        final value = response['count'] ?? response['unread'] ?? response['total'];
        return int.tryParse(value?.toString() ?? '0') ?? 0;
      }
    } on ApiException {
      return 0;
    }
    return 0;
  }

  Future<void> markRead(String id) async => api.put('/api/v1/messages/$id/read', {});

  Future<void> send(Map<String, dynamic> payload) async =>
      api.post('/api/v1/messages', payload);
}

class BoardingService {
  BoardingService(this.api);

  final ApiClient api;

  Future<List<BoardingPassenger>> passengers(String routeId, {String direction = 'IDA'}) async {
    final response = await api.get(
      '/api/passengers/route/$routeId',
      query: {'direction': direction},
    );
    return asMapList(response).map(BoardingPassenger.fromJson).toList();
  }

  Future<Map<String, dynamic>> validateQr(Map<String, dynamic> payload) async {
    final response = await api.post('/api/boardings/validate-qr', payload);
    return response is Map<String, dynamic> ? response : <String, dynamic>{};
  }

  Future<List<Map<String, dynamic>>> myHistory() async =>
      asMapList(await api.get('/api/boardings/my-history'));
}

class RouteCodeService {
  RouteCodeService(this.api);

  final ApiClient api;

  Future<List<RouteCode>> all() async {
    final response = await api.get('/api/driver-route-codes');
    return asMapList(response).map(RouteCode.fromJson).toList();
  }

  Future<void> create(Map<String, dynamic> payload) async =>
      api.post('/api/driver-route-codes', payload);

  Future<void> delete(String id) async => api.delete('/api/driver-route-codes/$id');
}

class ParteDiariaService {
  ParteDiariaService(this.api);

  final ApiClient api;

  Future<List<Map<String, dynamic>>> all() async =>
      asMapList(await api.get('/api/partes-diarias'));

  Future<Map<String, dynamic>> create(Map<String, dynamic> payload) async {
    final response = await api.post('/api/partes-diarias', payload);
    return response is Map<String, dynamic> ? response : <String, dynamic>{};
  }
}

String encodeFileBase64(File file) => base64Encode(file.readAsBytesSync());
