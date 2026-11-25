import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:fluxbus_mobile/core/session.dart';
import 'package:fluxbus_mobile/finance/models.dart' as finance;
import 'package:fluxbus_mobile/maintenance/models.dart' as maintenance;
import 'package:fluxbus_mobile/models/models.dart';

void main() {
  test('extrai empresaId do JWT', () {
    final payload = {'empresaId': '11111111-2222-3333-4444-555555555555', 'sub': 'motorista'};
    final encoded = base64Url.encode(utf8.encode(jsonEncode(payload))).replaceAll('=', '');
    final token = 'header.$encoded.signature';
    expect(companyIdFromJwt(token), '11111111-2222-3333-4444-555555555555');
    expect(companyIdFromJwt('invalido'), isNull);
  });

  test('normaliza usuario motorista e escala', () {
    final user = AppUser.fromJson({
      'id': '1',
      'username': 'motorista01',
      'fullName': 'João da Silva',
      'roles': ['ROLE_MOTORISTA'],
      'employeeId': 'emp-1',
    });
    expect(user.isDriver, isTrue);
    expect(user.roles, contains('MOTORISTA'));

    final schedule = Schedule.fromJson({
      'id': 's1',
      'scheduleDate': '2026-11-24',
      'title': 'Rota 12',
      'status': 'PENDING',
      'startTime': '07:00:00',
      'vehicle': {'id': 'v1', 'plate': 'ABC-1234'},
    });
    expect(schedule.vehicleId, 'v1');
    expect(schedule.vehiclePlate, 'ABC-1234');
    expect(schedule.isPending, isTrue);
  });

  test('status e pendências financeiras', () {
    final payable = finance.Payable.fromJson({
      'id': 'p1',
      'description': 'Energia',
      'amount': 100,
      'paidAmount': 40,
      'status': 'PENDENTE',
      'dueDate': '2020-01-01',
    });
    expect(payable.pending, 60);
    expect(payable.displayStatus, 'VENCIDA');

    final receivable = finance.Receivable.fromJson({
      'id': 'r1',
      'description': 'Fatura',
      'amount': 200,
      'amountPaid': 200,
      'status': 'PAID',
      'cofinsRetido': 3,
    });
    expect(receivable.displayStatus, 'RECEBIDA');
    expect(receivable.pending, 0);
    expect(receivable.cofinsRetido, 3);
  });

  test('status da ordem de serviço', () {
    final order = maintenance.WorkOrder.fromJson({
      'id': 'w1',
      'osNumber': 'OS-2026-0001',
      'vehiclePlate': 'ABC-1D23',
      'status': 'IN_PROGRESS',
      'maintenanceType': 'CORRETIVA',
      'priority': 'HIGH',
      'anomaliesDescription': 'Troca de óleo',
    });
    expect(order.statusLabel, 'EM ANDAMENTO');
    expect(order.number, 'OS-2026-0001');
    expect(order.priority, 'HIGH');
  });
}
