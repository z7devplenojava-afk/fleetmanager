class Driver {
  final String id;
  final String name;
  final String? cpf;
  final String? phone;
  final String? vehiclePlate;
  final String? companyName;

  const Driver({
    required this.id,
    required this.name,
    this.cpf,
    this.phone,
    this.vehiclePlate,
    this.companyName,
  });

  factory Driver.fromJson(Map<String, dynamic> json) => Driver(
        id: json['id']?.toString() ?? '',
        name: (json['name'] ?? json['fullName'] ?? json['nome'] ?? '').toString(),
        cpf: json['cpf']?.toString(),
        phone: json['phone']?.toString() ?? json['telefone']?.toString(),
        vehiclePlate: json['vehiclePlate']?.toString() ?? json['placa']?.toString(),
        companyName: json['companyName']?.toString(),
      );
}

class Schedule {
  final String id;
  final String date;
  final String title;
  final String status;
  final String? startTime;
  final String? endTime;
  final String? vehicleId;
  final String? vehiclePlate;
  final String? clientName;
  final String? routeCode;
  final String? shift;
  final double? initialKm;
  final double? finalKm;
  final String? pointStatus;
  final String? startAddress;
  final String? endAddress;

  const Schedule({
    required this.id,
    required this.date,
    required this.title,
    required this.status,
    this.startTime,
    this.endTime,
    this.vehicleId,
    this.vehiclePlate,
    this.clientName,
    this.routeCode,
    this.shift,
    this.initialKm,
    this.finalKm,
    this.pointStatus,
    this.startAddress,
    this.endAddress,
  });

  bool get isPending => status.toUpperCase().contains('PEND');
  bool get isInProgress => status.toUpperCase().contains('PROGRESS') || status.toUpperCase().contains('ANDAMENTO');
  bool get isFinished => status.toUpperCase().contains('CONCLU') || status.toUpperCase().contains('FINISH');

  factory Schedule.fromJson(Map<String, dynamic> json) {
    final vehicle = json['vehicle'];
    final String? plate = json['vehiclePlate']?.toString() ??
        json['placa']?.toString() ??
        (vehicle is Map ? vehicle['plate']?.toString() ?? vehicle['placa']?.toString() : null);
    final String? vehicleId = json['vehicleId']?.toString() ??
        (vehicle is Map
            ? vehicle['id']?.toString() ?? vehicle['vehicleId']?.toString()
            : null);
    final client = json['client'];
    return Schedule(
      id: json['id']?.toString() ?? '',
      date: (json['scheduleDate'] ?? json['date'] ?? json['data'] ?? '').toString(),
      title: (json['title'] ?? json['route'] ?? json['rota'] ?? json['line'] ??
              json['theme'] ?? 'Escala')
          .toString(),
      status: (json['status'] ?? 'PENDENTE').toString(),
      startTime: json['startTime']?.toString() ?? json['horarioInicio']?.toString(),
      endTime: json['endTime']?.toString() ?? json['horarioFim']?.toString(),
      vehicleId: vehicleId,
      vehiclePlate: plate,
      clientName: json['clientName']?.toString() ??
          (client is Map ? client['name']?.toString() : null),
      routeCode: json['routeCode']?.toString() ?? json['codigoPercurso']?.toString(),
      shift: json['shift']?.toString() ?? json['turno']?.toString(),
      initialKm: _toDouble(json['initialKm'] ?? json['kmInicial']),
      finalKm: _toDouble(json['finalKm'] ?? json['kmFinal']),
      pointStatus: json['pointStatus']?.toString(),
      startAddress: json['startAddress']?.toString(),
      endAddress: json['endAddress']?.toString(),
    );
  }
}

class ChecklistConfigItem {
  final String id;
  final String description;
  final String category;
  final bool required;

  const ChecklistConfigItem({
    required this.id,
    required this.description,
    required this.category,
    required this.required,
  });

  factory ChecklistConfigItem.fromJson(Map<String, dynamic> json) => ChecklistConfigItem(
        id: json['id']?.toString() ?? '',
        description: (json['description'] ?? json['item'] ?? json['nome'] ?? '').toString(),
        category: (json['category'] ?? json['categoria'] ?? 'Geral').toString(),
        required: json['required'] == true || json['obrigatorio'] == true,
      );
}

class ChecklistRecord {
  final String id;
  final String type;
  final String? vehiclePlate;
  final String? driverName;
  final String? createdAt;
  final String? observations;
  final Map<String, dynamic> raw;

  const ChecklistRecord({
    required this.id,
    required this.type,
    this.vehiclePlate,
    this.driverName,
    this.createdAt,
    this.observations,
    required this.raw,
  });

  factory ChecklistRecord.fromJson(Map<String, dynamic> json) => ChecklistRecord(
        id: json['id']?.toString() ?? '',
        type: (json['type'] ?? 'EXIT').toString(),
        vehiclePlate: json['vehiclePlate']?.toString(),
        driverName: json['driverName']?.toString(),
        createdAt: json['createdAt']?.toString() ?? json['checkoutDate']?.toString(),
        observations: json['observations']?.toString(),
        raw: json,
      );
}

class WorkOrder {
  final String id;
  final String? number;
  final String description;
  final String status;
  final String? urgency;
  final String? vehiclePlate;
  final String? createdAt;

  const WorkOrder({
    required this.id,
    this.number,
    required this.description,
    required this.status,
    this.urgency,
    this.vehiclePlate,
    this.createdAt,
  });

  factory WorkOrder.fromJson(Map<String, dynamic> json) => WorkOrder(
        id: json['id']?.toString() ?? '',
        number: json['number']?.toString(),
        description: (json['anomaliesDescription'] ??
                json['description'] ??
                json['descricao'] ??
                'Ordem de serviço')
            .toString(),
        status: (json['status'] ?? 'OPEN').toString(),
        urgency: json['urgency']?.toString() ?? json['prioridade']?.toString(),
        vehiclePlate: json['vehiclePlate']?.toString() ?? json['placa']?.toString(),
        createdAt: json['requestDate']?.toString() ?? json['createdAt']?.toString(),
      );
}

class Fine {
  final String id;
  final String plate;
  final String description;
  final String? location;
  final String? date;
  final String? dueDate;
  final double amount;
  final int points;
  final String status;

  const Fine({
    required this.id,
    required this.plate,
    required this.description,
    this.location,
    this.date,
    this.dueDate,
    required this.amount,
    required this.points,
    required this.status,
  });

  factory Fine.fromJson(Map<String, dynamic> json) => Fine(
        id: json['id']?.toString() ?? '',
        plate: (json['plate'] ?? json['vehiclePlate'] ?? '').toString(),
        description: (json['description'] ?? json['descricao'] ?? 'Multa').toString(),
        location: json['location']?.toString() ?? json['local']?.toString(),
        date: json['date']?.toString() ?? json['data']?.toString(),
        dueDate: json['dueDate']?.toString() ?? json['vencimento']?.toString(),
        amount: _toDouble(json['amount'] ?? json['valor']) ?? 0,
        points: int.tryParse((json['points'] ?? json['pontos'] ?? '0').toString()) ?? 0,
        status: (json['status'] ?? 'PENDING').toString(),
      );
}

class AppMessage {
  final String id;
  final String subject;
  final String? content;
  final String? senderName;
  final bool read;
  final String? createdAt;

  const AppMessage({
    required this.id,
    required this.subject,
    this.content,
    this.senderName,
    required this.read,
    this.createdAt,
  });

  factory AppMessage.fromJson(Map<String, dynamic> json) => AppMessage(
        id: json['id']?.toString() ?? '',
        subject: (json['subject'] ?? json['titulo'] ?? json['title'] ?? 'Mensagem').toString(),
        content: json['content']?.toString() ?? json['body']?.toString() ?? json['mensagem']?.toString(),
        senderName: json['senderName']?.toString() ?? json['remetente']?.toString(),
        read: json['read'] == true || json['isRead'] == true,
        createdAt: json['createdAt']?.toString() ?? json['sentAt']?.toString(),
      );
}

class Payslip {
  final String id;
  final String competence;
  final String? fileName;
  final String? downloadUrl;

  const Payslip({
    required this.id,
    required this.competence,
    this.fileName,
    this.downloadUrl,
  });

  factory Payslip.fromJson(Map<String, dynamic> json) => Payslip(
        id: json['id']?.toString() ?? '',
        competence: (json['competence'] ?? json['competencia'] ?? json['mesAno'] ?? '').toString(),
        fileName: json['fileName']?.toString() ?? json['arquivo']?.toString(),
        downloadUrl: json['downloadUrl']?.toString(),
      );
}

class EmployeeProfile {
  final String id;
  final String name;
  final String? cpf;
  final String? position;
  final String? department;
  final String? admissionDate;

  const EmployeeProfile({
    required this.id,
    required this.name,
    this.cpf,
    this.position,
    this.department,
    this.admissionDate,
  });

  factory EmployeeProfile.fromJson(Map<String, dynamic> json) {
    final employee = json['employee'] is Map ? json['employee'] as Map<String, dynamic> : json;
    return EmployeeProfile(
      id: employee['id']?.toString() ?? '',
      name: (employee['name'] ?? employee['fullName'] ?? '').toString(),
      cpf: employee['cpf']?.toString(),
      position: employee['position']?.toString(),
      department: employee['department']?.toString(),
      admissionDate: employee['admissionDate']?.toString(),
    );
  }
}

class TimeRecord {
  final String id;
  final String type;
  final String recordedAt;
  final String? location;

  const TimeRecord({
    required this.id,
    required this.type,
    required this.recordedAt,
    this.location,
  });

  factory TimeRecord.fromJson(Map<String, dynamic> json) => TimeRecord(
        id: json['id']?.toString() ?? '',
        type: (json['recordType'] ?? json['type'] ?? '').toString(),
        recordedAt: (json['recordedAt'] ?? json['timestamp'] ?? '').toString(),
        location: json['location']?.toString(),
      );
}

class BoardingPassenger {
  final String id;
  final String name;
  final String? cpf;
  final String? registration;
  final String? companyName;
  bool boarded;

  BoardingPassenger({
    required this.id,
    required this.name,
    this.cpf,
    this.registration,
    this.companyName,
    this.boarded = false,
  });

  factory BoardingPassenger.fromJson(Map<String, dynamic> json) => BoardingPassenger(
        id: (json['id'] ?? json['passengerId'] ?? json['employeeId'] ?? '').toString(),
        name: (json['name'] ?? json['nome'] ?? json['fullName'] ?? 'Passageiro').toString(),
        cpf: json['cpf']?.toString(),
        registration: json['matricula']?.toString() ?? json['registration']?.toString(),
        companyName: json['companyName']?.toString(),
      );
}

class RouteCode {
  final String id;
  final String code;
  final String description;

  const RouteCode({
    required this.id,
    required this.code,
    required this.description,
  });

  factory RouteCode.fromJson(Map<String, dynamic> json) => RouteCode(
        id: json['id']?.toString() ?? '',
        code: (json['code'] ?? json['numero'] ?? '').toString(),
        description: (json['description'] ?? json['descricao'] ?? '').toString(),
      );
}

double? _toDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString().replaceAll(',', '.'));
}

List<Map<String, dynamic>> asMapList(dynamic value) {
  if (value is List) {
    return value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
  if (value is Map) {
    final items = value['content'] ?? value['items'] ?? value['data'] ?? value['results'];
    if (items is List) {
      return items.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [Map<String, dynamic>.from(value)];
  }
  return const [];
}
