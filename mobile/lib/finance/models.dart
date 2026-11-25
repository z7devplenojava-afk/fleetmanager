double? _num(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString().replaceAll(RegExp(r'[^\d.\-]'), ''));
}

List<Map<String, dynamic>> mapList(dynamic value) {
  if (value is List) {
    return value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
  if (value is Map) {
    for (final key in ['content', 'items', 'data', 'results', 'invoices', 'receivables']) {
      final item = value[key];
      if (item is List) {
        return item.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
    return [Map<String, dynamic>.from(value)];
  }
  return const [];
}

class Payable {
  final String id;
  final String number;
  final String description;
  final String supplier;
  final double amount;
  final double paidAmount;
  final String status;
  final String type;
  final String category;
  final String costCenter;
  final DateTime? dueDate;
  final DateTime? paymentDate;
  final String? barcode;
  final String? digitableLine;
  final String? boletoUrl;
  final String? nfeKey;
  final String? companySigla;
  final String? notes;

  const Payable({
    required this.id,
    required this.number,
    required this.description,
    required this.supplier,
    required this.amount,
    required this.paidAmount,
    required this.status,
    required this.type,
    required this.category,
    required this.costCenter,
    this.dueDate,
    this.paymentDate,
    this.barcode,
    this.digitableLine,
    this.boletoUrl,
    this.nfeKey,
    this.companySigla,
    this.notes,
  });

  /// Status amigável do web: ABERTA / VENCIDA / PAGA / CANCELADA.
  String get displayStatus {
    final s = status.toUpperCase();
    if (s.contains('PAGA')) return 'PAGA';
    if (s.contains('CANCEL')) return 'CANCELADA';
    if (dueDate != null && dueDate!.isBefore(DateTime.now()) && !s.contains('PAGA')) return 'VENCIDA';
    return 'ABERTA';
  }

  double get pending => amount - paidAmount;

  factory Payable.fromJson(Map<String, dynamic> j) {
    final supplier = j['supplierName'] ?? j['supplier'] ?? j['fornecedor'] ?? j['employeeName'];
    return Payable(
      id: j['id']?.toString() ?? '',
      number: (j['invoiceNumber'] ?? j['numero'] ?? j['expenseNumber'] ?? '').toString(),
      description: (j['description'] ?? '').toString(),
      supplier: supplier is Map ? (supplier['name'] ?? '').toString() : (supplier ?? '').toString(),
      amount: _num(j['amount']) ?? 0,
      paidAmount: _num(j['paidAmount']) ?? 0,
      status: (j['status'] ?? 'PENDENTE').toString(),
      type: (j['type'] ?? 'FIXA').toString(),
      category: (j['category'] ?? '').toString(),
      costCenter: (j['centroCusto'] ?? j['costCenterName'] ?? '').toString(),
      dueDate: DateTime.tryParse((j['dueDate'] ?? '').toString()),
      paymentDate: DateTime.tryParse((j['paymentDate'] ?? '').toString()),
      barcode: j['barcode']?.toString(),
      digitableLine: (j['linhaDigitavel'] ?? j['digitableLine'])?.toString(),
      boletoUrl: j['boletoUrl']?.toString(),
      nfeKey: j['nfeKey']?.toString(),
      companySigla: j['companySigla']?.toString(),
      notes: j['notes']?.toString(),
    );
  }
}

class Receivable {
  final String id;
  final String number;
  final String description;
  final String client;
  final double amount;
  final double amountPaid;
  final String status;
  final String category;
  final String paymentMethod;
  final DateTime? dueDate;
  final DateTime? paymentDate;
  final double issqnRetido;
  final double inssRetido;
  final double irRetido;
  final double pisRetido;
  final double cofinsRetido;
  final double csllRetido;
  final double ibsCbsAmount;
  final String? nfseNumber;
  final String? nfseKey;

  const Receivable({
    required this.id,
    required this.number,
    required this.description,
    required this.client,
    required this.amount,
    required this.amountPaid,
    required this.status,
    required this.category,
    required this.paymentMethod,
    this.dueDate,
    this.paymentDate,
    required this.issqnRetido,
    required this.inssRetido,
    required this.irRetido,
    required this.pisRetido,
    required this.cofinsRetido,
    required this.csllRetido,
    required this.ibsCbsAmount,
    this.nfseNumber,
    this.nfseKey,
  });

  String get displayStatus {
    final s = status.toUpperCase();
    if (s.contains('PAID') || s.contains('RECEBIDA')) return 'RECEBIDA';
    if (s.contains('CANCEL')) return 'CANCELADA';
    if (dueDate != null && dueDate!.isBefore(DateTime.now())) return 'VENCIDA';
    return 'ABERTA';
  }

  double get pending => amount - amountPaid;

  factory Receivable.fromJson(Map<String, dynamic> j) {
    final client = j['clientName'] ?? j['client'] ?? j['cliente'];
    return Receivable(
      id: j['id']?.toString() ?? '',
      number: (j['invoiceNumber'] ?? j['faturaLocacaoNumber'] ?? j['measurementNumber'] ?? '').toString(),
      description: (j['description'] ?? '').toString(),
      client: client is Map ? (client['name'] ?? '').toString() : (client ?? '').toString(),
      amount: _num(j['amount']) ?? 0,
      amountPaid: _num(j['amountPaid']) ?? 0,
      status: (j['status'] ?? 'PENDING').toString(),
      category: (j['category'] ?? '').toString(),
      paymentMethod: (j['paymentMethod'] ?? '').toString(),
      dueDate: DateTime.tryParse((j['dueDate'] ?? '').toString()),
      paymentDate: DateTime.tryParse((j['paymentDate'] ?? '').toString()),
      issqnRetido: _num(j['issqnRetido']) ?? 0,
      inssRetido: _num(j['inssRetido']) ?? 0,
      irRetido: _num(j['irRetido']) ?? 0,
      pisRetido: _num(j['pisRetido']) ?? 0,
      cofinsRetido: _num(j['cofinsRetido']) ?? 0,
      csllRetido: _num(j['csllRetido']) ?? 0,
      ibsCbsAmount: _num(j['ibsCbsAmount']) ?? 0,
      nfseNumber: j['nfseNumber']?.toString(),
      nfseKey: j['nfseKey']?.toString(),
    );
  }
}

class CostCenter {
  final String id;
  final String code;
  final String name;
  final String department;
  final String responsible;
  final double budget;
  final double spent;
  final bool active;

  const CostCenter({
    required this.id,
    required this.code,
    required this.name,
    required this.department,
    required this.responsible,
    required this.budget,
    required this.spent,
    required this.active,
  });

  factory CostCenter.fromJson(Map<String, dynamic> j) => CostCenter(
        id: j['id']?.toString() ?? '',
        code: (j['code'] ?? '').toString(),
        name: (j['name'] ?? '').toString(),
        department: (j['department'] ?? '').toString(),
        responsible: (j['responsible'] ?? '').toString(),
        budget: _num(j['budget']) ?? 0,
        spent: _num(j['spent'] ?? j['spentAmount']) ?? 0,
        active: j['active'] == true || (j['status'] ?? '').toString().toUpperCase().contains('ATIV'),
      );
}

class Bank {
  final String id;
  final String name;
  final String code;
  final String status;

  const Bank({required this.id, required this.name, required this.code, required this.status});

  factory Bank.fromJson(Map<String, dynamic> j) => Bank(
        id: j['id']?.toString() ?? '',
        name: (j['name'] ?? '').toString(),
        code: (j['code'] ?? '').toString(),
        status: (j['status'] ?? 'ACTIVE').toString(),
      );
}

class Agency {
  final String id;
  final String name;
  final String code;
  final String bankName;
  final String city;
  final String status;

  const Agency({
    required this.id,
    required this.name,
    required this.code,
    required this.bankName,
    required this.city,
    required this.status,
  });

  factory Agency.fromJson(Map<String, dynamic> j) => Agency(
        id: j['id']?.toString() ?? '',
        name: (j['name'] ?? '').toString(),
        code: (j['code'] ?? '').toString(),
        bankName: (j['bankName'] ?? '').toString(),
        city: (j['city'] ?? '').toString(),
        status: (j['status'] ?? 'ACTIVE').toString(),
      );
}

class Supplier {
  final String id;
  final String name;
  final String cnpj;
  final bool active;

  const Supplier({
    required this.id,
    required this.name,
    required this.cnpj,
    required this.active,
  });

  factory Supplier.fromJson(Map<String, dynamic> j) => Supplier(
        id: j['id']?.toString() ?? '',
        name: (j['name'] ?? j['razaoSocial'] ?? '').toString(),
        cnpj: (j['cnpj'] ?? '').toString(),
        active: j['active'] == true ||
            (j['status'] ?? '').toString().toUpperCase().contains('ATIV'),
      );
}

class ReconciliationFile {
  final String id;
  final String fileName;
  final String bankName;
  final String status;
  final int transactionCount;

  const ReconciliationFile({
    required this.id,
    required this.fileName,
    required this.bankName,
    required this.status,
    required this.transactionCount,
  });

  factory ReconciliationFile.fromJson(Map<String, dynamic> j) => ReconciliationFile(
        id: j['id']?.toString() ?? '',
        fileName: (j['fileName'] ?? j['originalFileName'] ?? '').toString(),
        bankName: (j['bankName'] ?? '').toString(),
        status: (j['status'] ?? 'PROCESSING').toString(),
        transactionCount: int.tryParse((j['transactionCount'] ?? '0').toString()) ?? 0,
      );
}

class DdaInvoice {
  final String id;
  final String beneficiary;
  final String dueDate;
  final double amount;
  final String status;
  final String? line;

  const DdaInvoice({
    required this.id,
    required this.beneficiary,
    required this.dueDate,
    required this.amount,
    required this.status,
    this.line,
  });

  factory DdaInvoice.fromJson(Map<String, dynamic> j) => DdaInvoice(
        id: j['id']?.toString() ?? '',
        beneficiary: (j['beneficiaryName'] ?? j['beneficiary'] ?? '').toString(),
        dueDate: (j['dueDate'] ?? '').toString(),
        amount: _num(j['amount']) ?? 0,
        status: (j['status'] ?? 'DETECTED').toString(),
        line: (j['digitableLine'] ?? j['barcode'])?.toString(),
      );
}

class PurchaseOrder {
  final String id;
  final String number;
  final String supplier;
  final double total;
  final String status;

  const PurchaseOrder({
    required this.id,
    required this.number,
    required this.supplier,
    required this.total,
    required this.status,
  });

  factory PurchaseOrder.fromJson(Map<String, dynamic> j) => PurchaseOrder(
        id: j['id']?.toString() ?? '',
        number: (j['orderNumber'] ?? j['number'] ?? '').toString(),
        supplier: (j['supplierName'] ?? '').toString(),
        total: _num(j['totalAmount'] ?? j['total']) ?? 0,
        status: (j['status'] ?? '').toString(),
      );
}

class FinanceSummary {
  final double totalPayable;
  final double totalPaid;
  final double totalOverdue;
  final double totalReceivable;
  final double totalReceived;

  const FinanceSummary({
    required this.totalPayable,
    required this.totalPaid,
    required this.totalOverdue,
    required this.totalReceivable,
    required this.totalReceived,
  });

  factory FinanceSummary.fromJson(Map<String, dynamic> j) => FinanceSummary(
        totalPayable: _num(j['totalPending'] ?? j['totalPayable']) ?? 0,
        totalPaid: _num(j['totalPaid']) ?? 0,
        totalOverdue: _num(j['totalOverdue']) ?? 0,
        totalReceivable: _num(j['totalReceivable']) ?? 0,
        totalReceived: _num(j['totalReceived']) ?? 0,
      );
}
