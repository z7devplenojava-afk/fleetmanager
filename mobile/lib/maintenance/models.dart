double? _d(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString().replaceAll(RegExp(r'[^\d.\-]'), ''));
}

int? _i(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString().replaceAll(RegExp(r'[^\d\-]'), ''));
}

List<Map<String, dynamic>> mapList(dynamic value) {
  if (value is List) {
    return value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
  if (value is Map) {
    for (final key in ['content', 'items', 'data', 'results', 'orders', 'plans']) {
      final v = value[key];
      if (v is List) return v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [Map<String, dynamic>.from(value)];
  }
  return const [];
}

class WorkOrder {
  final String id;
  final String number;
  final String type;
  final String status;
  final String priority;
  final String? vehiclePlate;
  final String? vehicleModel;
  final String? mechanicName;
  final String? garageName;
  final String? clientName;
  final String? description;
  final String? maintenancePerformed;
  final String? laborType;
  final double? odometerIn;
  final double? odometerOut;
  final double? laborCost;
  final double? partsCost;
  final double? totalCost;
  final DateTime? stopDate;
  final DateTime? completionDate;
  final List<String> photos;
  final Map<String, dynamic> raw;

  const WorkOrder({
    required this.id,
    required this.number,
    required this.type,
    required this.status,
    required this.priority,
    this.vehiclePlate,
    this.vehicleModel,
    this.mechanicName,
    this.garageName,
    this.clientName,
    this.description,
    this.maintenancePerformed,
    this.laborType,
    this.odometerIn,
    this.odometerOut,
    this.laborCost,
    this.partsCost,
    this.totalCost,
    this.stopDate,
    this.completionDate,
    required this.photos,
    required this.raw,
  });

  factory WorkOrder.fromJson(Map<String, dynamic> j) {
    final photos = <String>[];
    final rawPhotos = j['photoAttachments'];
    if (rawPhotos is List) {
      for (final p in rawPhotos) {
        if (p is String) photos.add(p);
        if (p is Map) photos.add((p['url'] ?? p['fileUrl'] ?? '').toString());
      }
    }
    return WorkOrder(
      id: j['id']?.toString() ?? '',
      number: (j['osNumber'] ?? j['number'] ?? '').toString(),
      type: (j['maintenanceType'] ?? 'CORRETIVA').toString(),
      status: (j['status'] ?? 'OPEN').toString(),
      priority: (j['priority'] ?? 'MEDIUM').toString(),
      vehiclePlate: (j['vehiclePlate'] ?? j['placa'])?.toString(),
      vehicleModel: j['vehicleModel']?.toString(),
      mechanicName: (j['mechanicName'] ?? j['responsibleName'])?.toString(),
      garageName: (j['garageName'] ?? j['executionGarageName'])?.toString(),
      clientName: (j['clientName'] ?? j['workPostName'])?.toString(),
      description: (j['anomaliesDescription'] ?? j['description'] ?? j['otherDescription'])?.toString(),
      maintenancePerformed: j['maintenancePerformed']?.toString(),
      laborType: j['laborType']?.toString(),
      odometerIn: _d(j['odometerIn']),
      odometerOut: _d(j['odometerOut']),
      laborCost: _d(j['laborCost']),
      partsCost: _d(j['partsCost']),
      totalCost: _d(j['totalCost']),
      stopDate: DateTime.tryParse((j['stopDate'] ?? '').toString()),
      completionDate: DateTime.tryParse((j['completionDate'] ?? '').toString()),
      photos: photos,
      raw: j,
    );
  }

  String get statusLabel {
    switch (status.toUpperCase()) {
      case 'OPEN': return 'ABERTA';
      case 'DRAFT': return 'RASCUNHO';
      case 'PENDING_APPROVAL': return 'AGUARDANDO APROVAÇÃO';
      case 'APPROVED': return 'APROVADA';
      case 'IN_PROGRESS': return 'EM ANDAMENTO';
      case 'WAITING_PARTS': return 'AGUARDANDO PEÇA';
      case 'COMPLETED': return 'CONCLUÍDA';
      case 'CANCELLED': return 'CANCELADA';
      default: return status;
    }
  }
}

class MaintenancePlan {
  final String id;
  final String vehiclePlate;
  final String taskName;
  final int? intervalKm;
  final int? intervalDays;
  final int? lastExecutionKm;
  final int? nextDueKm;
  final String? nextDueDate;
  final int? kmRemaining;
  final int? daysRemaining;
  final String alertLevel;
  final String? message;
  final bool active;

  const MaintenancePlan({
    required this.id,
    required this.vehiclePlate,
    required this.taskName,
    this.intervalKm,
    this.intervalDays,
    this.lastExecutionKm,
    this.nextDueKm,
    this.nextDueDate,
    this.kmRemaining,
    this.daysRemaining,
    required this.alertLevel,
    this.message,
    required this.active,
  });

  factory MaintenancePlan.fromJson(Map<String, dynamic> j) => MaintenancePlan(
        id: j['id']?.toString() ?? j['planId']?.toString() ?? '',
        vehiclePlate: (j['vehiclePlate'] ?? j['placa'])?.toString() ?? '',
        taskName: (j['taskName'] ?? j['name'] ?? '').toString(),
        intervalKm: _i(j['intervalKm']),
        intervalDays: _i(j['intervalDays']),
        lastExecutionKm: _i(j['lastExecutionKm']),
        nextDueKm: _i(j['nextDueKm']),
        nextDueDate: j['nextDueDate']?.toString(),
        kmRemaining: _i(j['kmRemaining']),
        daysRemaining: _i(j['daysRemaining']),
        alertLevel: (j['alertLevel'] ?? 'OK').toString(),
        message: j['message']?.toString(),
        active: j['isActive'] == true || j['active'] == true,
      );
}

class ComponentControl {
  final String id;
  final String vehiclePlate;
  final String controlType;
  final int? nextDueKm;
  final int? kmRemaining;
  final String alertLevel;

  const ComponentControl({
    required this.id,
    required this.vehiclePlate,
    required this.controlType,
    this.nextDueKm,
    this.kmRemaining,
    required this.alertLevel,
  });

  factory ComponentControl.fromJson(Map<String, dynamic> j) => ComponentControl(
        id: j['id']?.toString() ?? '',
        vehiclePlate: (j['vehiclePlate'] ?? j['placa'])?.toString() ?? '',
        controlType: (j['controlType'] ?? j['type'] ?? '').toString(),
        nextDueKm: _i(j['nextDueKm']),
        kmRemaining: _i(j['kmRemaining']),
        alertLevel: (j['alertLevel'] ?? 'OK').toString(),
      );
}

class Inspection {
  final String id;
  final String registryNumber;
  final String inspectionType;
  final String vehiclePlate;
  final String clientName;
  final String releaseStatus;
  final DateTime? inspectionDate;
  final List<String> evidences;

  const Inspection({
    required this.id,
    required this.registryNumber,
    required this.inspectionType,
    required this.vehiclePlate,
    required this.clientName,
    required this.releaseStatus,
    this.inspectionDate,
    required this.evidences,
  });

  factory Inspection.fromJson(Map<String, dynamic> j) {
    final evidences = <String>[];
    final raw = j['evidencesUrls'];
    if (raw is List) {
      for (final e in raw) {
        if (e is String) evidences.add(e);
        if (e is Map) evidences.add((e['url'] ?? '').toString());
      }
    }
    return Inspection(
      id: j['id']?.toString() ?? '',
      registryNumber: (j['registryNumber'] ?? '').toString(),
      inspectionType: (j['inspectionType'] ?? 'LAUDO').toString(),
      vehiclePlate: (j['vehiclePlate'] ?? '').toString(),
      clientName: (j['clientName'] ?? '').toString(),
      releaseStatus: (j['releaseStatus'] ?? '').toString(),
      inspectionDate: DateTime.tryParse((j['inspectionDate'] ?? '').toString()),
      evidences: evidences,
    );
  }
}

class Tire {
  final String id;
  final String code;
  final String status;
  final String? vehiclePlate;
  final String? position;
  final int? currentLifeMileage;
  final double? treadDepth;

  const Tire({
    required this.id,
    required this.code,
    required this.status,
    this.vehiclePlate,
    this.position,
    this.currentLifeMileage,
    this.treadDepth,
  });

  factory Tire.fromJson(Map<String, dynamic> j) => Tire(
        id: j['id']?.toString() ?? '',
        code: (j['code'] ?? j['tireCode'] ?? j['serialNumber'] ?? '').toString(),
        status: (j['status'] ?? 'AVAILABLE').toString(),
        vehiclePlate: j['vehiclePlate']?.toString(),
        position: j['position']?.toString(),
        currentLifeMileage: _i(j['currentLifeMileage']),
        treadDepth: _d(j['treadDepth']),
      );
}

class GateChecklist {
  final String id;
  final String type;
  final String? vehiclePlate;
  final String? driverName;
  final String? createdAt;
  final String? observations;

  const GateChecklist({
    required this.id,
    required this.type,
    this.vehiclePlate,
    this.driverName,
    this.createdAt,
    this.observations,
  });

  factory GateChecklist.fromJson(Map<String, dynamic> j) => GateChecklist(
        id: j['id']?.toString() ?? '',
        type: (j['type'] ?? 'EXIT').toString(),
        vehiclePlate: (j['vehiclePlate'] ?? j['plate'])?.toString(),
        driverName: j['driverName']?.toString(),
        createdAt: (j['createdAt'] ?? j['checkoutDate'])?.toString(),
        observations: j['observations']?.toString(),
      );
}

class Cleaning {
  final String id;
  final String vehiclePlate;
  final String status;
  final String type;
  final String? garageName;

  const Cleaning({
    required this.id,
    required this.vehiclePlate,
    required this.status,
    required this.type,
    this.garageName,
  });

  factory Cleaning.fromJson(Map<String, dynamic> j) => Cleaning(
        id: j['id']?.toString() ?? '',
        vehiclePlate: (j['vehiclePlate'] ?? '').toString(),
        status: (j['status'] ?? 'PENDING').toString(),
        type: (j['cleaningType'] ?? j['type'] ?? 'INTERNAL').toString(),
        garageName: j['garageName']?.toString(),
      );
}

class CfmeDocument {
  final String id;
  final String title;
  final String category;
  final String status;
  final String? validUntil;

  const CfmeDocument({
    required this.id,
    required this.title,
    required this.category,
    required this.status,
    this.validUntil,
  });

  factory CfmeDocument.fromJson(Map<String, dynamic> j) => CfmeDocument(
        id: j['id']?.toString() ?? '',
        title: (j['title'] ?? j['name'] ?? '').toString(),
        category: (j['category'] ?? '').toString(),
        status: (j['status'] ?? 'VIGENTE').toString(),
        validUntil: j['validUntil']?.toString(),
      );
}

class Garage {
  final String id;
  final String name;
  final String? city;
  final int? capacity;

  const Garage({required this.id, required this.name, this.city, this.capacity});

  factory Garage.fromJson(Map<String, dynamic> j) => Garage(
        id: j['id']?.toString() ?? '',
        name: (j['name'] ?? '').toString(),
        city: j['city']?.toString(),
        capacity: _i(j['capacity']),
      );
}
