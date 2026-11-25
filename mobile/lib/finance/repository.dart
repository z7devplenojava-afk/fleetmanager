import 'dart:io';

import '../core/api_client.dart';
import 'models.dart';

class FinanceRepository {
  FinanceRepository(this.api);

  final ApiClient api;

  String _date(DateTime? d) => d == null
      ? ''
      : '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  // ---------------- Contas a pagar ----------------

  Future<List<Payable>> payables({
    String? status,
    String? type,
    String? search,
    DateTime? start,
    DateTime? end,
  }) async {
    final query = <String, String>{};
    if (status != null && status.isNotEmpty) query['status'] = _statusToApiPayable(status);
    if (type != null && type.isNotEmpty) query['type'] = type;
    if (search != null && search.isNotEmpty) query['searchTerm'] = search;
    if (start != null) query['startDate'] = _date(start);
    if (end != null) query['endDate'] = _date(end);
    final response = await api.get('/api/invoices', query: query);
    return mapList(response).map(Payable.fromJson).toList();
  }

  Future<List<Payable>> overduePayables() async {
    final response = await api.get('/api/invoices/overdue');
    return mapList(response).map(Payable.fromJson).toList();
  }

  Future<Payable> payable(String id) async {
    final response = await api.get('/api/invoices/$id');
    return Payable.fromJson(response is Map<String, dynamic> ? response : const {});
  }

  Future<void> createPayable(Map<String, dynamic> payload) => api.post('/api/invoices', payload);

  Future<void> updatePayable(String id, Map<String, dynamic> payload) =>
      api.put('/api/invoices/$id', payload);

  Future<void> deletePayable(String id) => api.delete('/api/invoices/$id');

  Future<void> markPayablePaid(String id, {DateTime? paymentDate}) async {
    final query = paymentDate == null ? null : {'paymentDate': _date(paymentDate)};
    final uri = Uri.parse('${api.session.baseUrl}/api/invoices/$id/mark-as-paid')
        .replace(queryParameters: query);
    await api.patch(uri.toString());
  }

  Future<void> uploadProof(String id, File file,
      {required double paidAmount, DateTime? paymentDate}) async {
    await api.uploadFiles(
      '/api/invoices/$id/comprovante',
      field: 'file',
      files: [file],
      fields: {
        'paidAmount': paidAmount.toStringAsFixed(2),
        'paymentDate': _date(paymentDate ?? DateTime.now()),
      },
    );
  }

  Future<Map<String, dynamic>> parseBoleto(File file) async {
    final response = await api.uploadFiles('/api/invoices/parse-boleto', field: 'file', files: [file]);
    return response is Map<String, dynamic> ? response : const {};
  }

  Future<List<Map<String, dynamic>>> parseBoletos(List<File> files) async {
    final response = await api.uploadFiles('/api/invoices/parse-boletos-batch', field: 'files', files: files);
    return mapList(response);
  }

  Future<Map<String, dynamic>> importExpensesPdf(File file) async {
    final response = await api.uploadFiles('/api/invoices/import-expenses-pdf', field: 'file', files: [file]);
    return response is Map<String, dynamic> ? response : const {};
  }

  Future<Map<String, dynamic>> parseNfse(File file) async {
    final response = await api.uploadFiles('/api/invoices/parse-nfse', field: 'file', files: [file]);
    return response is Map<String, dynamic> ? response : const {};
  }

  Future<FinanceSummary> payableSummary() async {
    final response = await api.get('/api/invoices/reports/summary');
    return FinanceSummary.fromJson(response is Map<String, dynamic> ? response : const {});
  }

  Future<List<Map<String, dynamic>>> categories() async =>
      mapList(await api.get('/api/invoices/categories'));

  Future<List<Map<String, dynamic>>> suppliers() async =>
      mapList(await api.get('/api/suppliers/all'));

  Future<void> createSupplier(Map<String, dynamic> payload) => api.post('/api/suppliers', payload);

  Future<void> toggleSupplier(String id) => api.patch('/api/suppliers/$id/toggle-status', {});

  Future<void> importSuppliers(File file) =>
      api.uploadFiles('/api/suppliers/import', field: 'file', files: [file]);

  // ---------------- Contas a receber ----------------

  Future<List<Receivable>> receivables({
    String? status,
    String? type,
    String? search,
    DateTime? start,
    DateTime? end,
  }) async {
    final query = <String, String>{};
    if (status != null && status.isNotEmpty) query['status'] = _statusToApiReceivable(status);
    if (type != null && type.isNotEmpty) query['type'] = type;
    if (search != null && search.isNotEmpty) query['searchTerm'] = search;
    if (start != null) query['startDate'] = _date(start);
    if (end != null) query['endDate'] = _date(end);
    final response = await api.get('/api/accounts-receivable', query: query);
    return mapList(response).map(Receivable.fromJson).toList();
  }

  Future<Receivable> receivable(String id) async {
    final response = await api.get('/api/accounts-receivable/$id');
    return Receivable.fromJson(response is Map<String, dynamic> ? response : const {});
  }

  Future<void> createReceivable(Map<String, dynamic> payload) =>
      api.post('/api/accounts-receivable', payload);

  Future<void> updateReceivable(String id, Map<String, dynamic> payload) =>
      api.put('/api/accounts-receivable/$id', payload);

  Future<void> deleteReceivable(String id) => api.delete('/api/accounts-receivable/$id');

  Future<void> markReceivablePaid(String id, {DateTime? paymentDate}) async {
    final body = <String, dynamic>{};
    if (paymentDate != null) body['paymentDate'] = _date(paymentDate);
    await api.put('/api/accounts-receivable/$id/mark-paid', body);
  }

  Future<Map<String, dynamic>> parseReceivableNfse(File file) async {
    final response = await api.uploadFiles('/api/accounts-receivable/parse-nfse', field: 'file', files: [file]);
    return response is Map<String, dynamic> ? response : const {};
  }

  Future<void> importReceivableNfse(String id, File file) =>
      api.uploadFiles('/api/accounts-receivable/$id/import-nfse', field: 'file', files: [file]);

  Future<void> sendReceivableEmail(String id) =>
      api.post('/api/accounts-receivable/$id/send-email', {});

  Future<void> syncMeasurements() => api.post('/api/accounts-receivable/sync-all', {});

  Future<List<String>> receivableCategories() async {
    final response = await api.get('/api/accounts-receivable/search/categories');
    if (response is List) return response.map((e) => e.toString()).toList();
    if (response is Map) {
      final values = response['categories'] ?? response['data'];
      if (values is List) return values.map((e) => e.toString()).toList();
    }
    return const [];
  }

  String receivablesPdfUrl() => '${api.session.baseUrl}/api/accounts-receivable/reports/pdf';

  // ---------------- Centros de custo ----------------

  Future<List<CostCenter>> costCenters() async {
    final response = await api.get('/api/cost-centers');
    return mapList(response).map(CostCenter.fromJson).toList();
  }

  Future<void> createCostCenter(Map<String, dynamic> payload) =>
      api.post('/api/cost-centers', payload);

  Future<void> updateCostCenter(String id, Map<String, dynamic> payload) =>
      api.put('/api/cost-centers/$id', payload);

  Future<void> deleteCostCenter(String id) => api.delete('/api/cost-centers/$id');

  Future<void> toggleCostCenter(String id) =>
      api.patch('/api/cost-centers/$id/toggle-status', {});

  // ---------------- Bancos / agências ----------------

  Future<List<Bank>> banks() async {
    final response = await api.get('/api/banks');
    return mapList(response).map(Bank.fromJson).toList();
  }

  Future<void> createBank(Map<String, dynamic> payload) => api.post('/api/banks', payload);

  Future<void> deleteBank(String id) => api.delete('/api/banks/$id');

  Future<List<Agency>> agencies() async {
    final response = await api.get('/api/agencies');
    return mapList(response).map(Agency.fromJson).toList();
  }

  Future<void> createAgency(Map<String, dynamic> payload) => api.post('/api/agencies', payload);

  Future<void> deleteAgency(String id) => api.delete('/api/agencies/$id');

  // ---------------- Conciliação bancária ----------------

  Future<List<ReconciliationFile>> reconciliationFiles() async {
    final response = await api.get('/api/bank-reconciliation/files');
    return mapList(response).map(ReconciliationFile.fromJson).toList();
  }

  Future<void> uploadReconciliation(File file, Map<String, String> fields) =>
      api.uploadFiles('/api/bank-reconciliation/files/upload', field: 'file', files: [file], fields: fields);

  Future<List<Map<String, dynamic>>> reconciliationTransactions(String id) async {
    final response = await api.get('/api/bank-reconciliation/files/$id/transactions');
    return mapList(response);
  }

  Future<void> deleteReconciliation(String id) =>
      api.delete('/api/bank-reconciliation/files/$id');

  String reconciliationReportUrl(String id) =>
      '${api.session.baseUrl}/api/bank-reconciliation/reports/file/$id';

  // ---------------- DDA ----------------

  Future<List<DdaInvoice>> ddaInvoices() async {
    final response = await api.get('/api/dda/invoices');
    return mapList(response).map(DdaInvoice.fromJson).toList();
  }

  Future<void> syncDda() => api.post('/api/dda/sync', {});

  Future<void> importDda(String id) => api.post('/api/dda/$id/import', {});

  Future<void> payDda(String id, {String method = 'PIX'}) =>
      api.post('/api/dda/$id/pay', {'paymentMethod': method});

  // ---------------- Compras ----------------

  Future<List<PurchaseOrder>> purchaseOrders() async {
    final response = await api.get('/api/procurement/purchase-orders');
    return mapList(response).map(PurchaseOrder.fromJson).toList();
  }

  Future<void> financialApproval(String id, bool approved, {String? method}) =>
      api.post('/api/procurement/purchase-orders/financial-approval', {
        'purchaseOrderId': id,
        'approved': approved,
        if (method != null) 'paymentMethod': method,
      });

  // ---------------- Medições ----------------

  Future<List<Map<String, dynamic>>> measurements() async =>
      mapList(await api.get('/api/measurements/all'));

  Future<void> validateMeasurement(String id) =>
      api.patch('/api/measurements/$id/validate', {});

  String measurementPdfUrl(String id) => '${api.session.baseUrl}/api/measurements/$id/pdf';

  // ---------------- Relatórios ----------------

  String customPdfUrl({
    required DateTime start,
    required DateTime end,
    String? status,
    String? type,
  }) {
    final query = <String, String>{
      'startDate': _date(start),
      'endDate': _date(end),
      if (status != null && status.isNotEmpty) 'status': status,
      if (type != null && type.isNotEmpty) 'type': type,
    };
    return Uri.parse('${api.session.baseUrl}/api/reports/contas-a-pagar/custom/pdf')
        .replace(queryParameters: query)
        .toString();
  }

  String customExcelUrl({
    required DateTime start,
    required DateTime end,
    String? status,
    String? type,
  }) {
    final query = <String, String>{
      'startDate': _date(start),
      'endDate': _date(end),
      if (status != null && status.isNotEmpty) 'status': status,
      if (type != null && type.isNotEmpty) 'type': type,
    };
    return Uri.parse('${api.session.baseUrl}/api/reports/contas-a-pagar/custom/excel')
        .replace(queryParameters: query)
        .toString();
  }

  String payablesReportUrl(String? status) => Uri.parse('${api.session.baseUrl}/api/reports/contas-a-pagar')
      .replace(queryParameters: status == null ? null : {'status': status})
      .toString();

  // ---------------- Financeiro genérico ----------------

  Future<List<Map<String, dynamic>>> transactions() async =>
      mapList(await api.get('/api/financial/transactions'));

  Future<void> createTransaction(Map<String, dynamic> payload) =>
      api.post('/api/financial/transactions', payload);

  Future<void> deleteTransaction(String id) =>
      api.delete('/api/financial/transactions/$id');

  // ---------------- Conversão de status ----------------

  static String _statusToApiPayable(String status) {
    switch (status.toUpperCase()) {
      case 'PAGA':
        return 'PAGA';
      case 'CANCELADA':
        return 'CANCELADA';
      case 'VENCIDA':
      case 'ATRASADA':
        return 'PENDENTE';
      default:
        return 'PENDENTE';
    }
  }

  static String _statusToApiReceivable(String status) {
    switch (status.toUpperCase()) {
      case 'RECEBIDA':
        return 'PAID';
      case 'CANCELADA':
        return 'CANCELLED';
      case 'VENCIDA':
        return 'OVERDUE';
      default:
        return 'PENDING';
    }
  }
}
