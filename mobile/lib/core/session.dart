import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppUser {
  final String id;
  final String username;
  final String email;
  final String fullName;
  final List<String> roles;
  final String? employeeId;
  final String? position;
  final bool isDriver;
  final List<String> permissions;

  const AppUser({
    required this.id,
    required this.username,
    required this.email,
    required this.fullName,
    required this.roles,
    this.employeeId,
    this.position,
    this.isDriver = false,
    this.permissions = const [],
  });

  bool get isAdmin {
    const adminRoles = {
      'ADMIN',
      'SUPER_ADMIN',
      'COMPANY_ADMIN',
      'FLEX_ADMIN',
      'GESTOR',
      'GESTOR_OPERACIONAL',
    };
    return roles.any(adminRoles.contains);
  }

  bool get canOperate => isDriver || isAdmin || canMaintain;

  bool get canMaintain {
    const maintenanceRoles = {
      'ADMIN',
      'SUPER_ADMIN',
      'COMPANY_ADMIN',
      'FLEX_ADMIN',
      'MANUTENCAO',
      'GESTOR_DE_MANUTENCAO',
      'ENCARREGADO_DE_MANUTENCAO',
      'MECANICO',
      'AUXILIAR_MECANICO',
      'PORTARIA',
      'ANALISTA_DE_FROTA',
      'ANALISTA_FROTA',
      'OPERACIONAL',
      'GESTOR_OPERACIONAL',
      'ENCARREGADO_OPERACIONAL',
      'SUPERVISOR',
    };
    return roles.any(maintenanceRoles.contains) ||
        permissions.any((p) => p.toUpperCase().startsWith('EQUIPMENTS_'));
  }

  bool get canFinance {
    const financeRoles = {
      'ADMIN',
      'SUPER_ADMIN',
      'COMPANY_ADMIN',
      'FLEX_ADMIN',
      'FINANCEIRO',
      'GESTOR_FINANCEIRO',
      'ASSISTENTE_FINANCEIRO',
    };
    return roles.any(financeRoles.contains) ||
        permissions.any((p) => p.toUpperCase().startsWith('FINANCIAL_'));
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'email': email,
        'fullName': fullName,
        'roles': roles,
        'employeeId': employeeId,
        'position': position,
        'isDriver': isDriver,
        'permissions': permissions,
      };

  factory AppUser.fromJson(Map<String, dynamic> json) {
    final roles = <String>[
      ...(json['roles'] as List? ?? const []).map((e) => e.toString()),
    ];
    final normalized = roles.map((r) => r.replaceFirst(RegExp(r'^ROLE_'), '').toUpperCase()).toList();
    final permissions = <String>[
      ...(json['permissions'] as List? ?? const []).map((e) => e.toString()),
      ...(json['customPermissions'] as List? ?? const []).map((e) => e.toString()),
    ];
    final position = json['position']?.toString();
    final isDriverFlag = json['isDriver'] == true ||
        normalized.contains('MOTORISTA') ||
        normalized.contains('DRIVER') ||
        (position ?? '').toLowerCase().contains('motorista');
    return AppUser(
      id: (json['id'] ?? json['userId'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      fullName: (json['fullName'] ?? json['name'] ?? json['username'] ?? '').toString(),
      roles: normalized,
      employeeId: json['employeeId']?.toString(),
      position: position,
      isDriver: isDriverFlag,
      permissions: permissions,
    );
  }

  String get displayName => fullName.isNotEmpty ? fullName : username;
}

/// Sessão persistida do app. Também guarda o companyId extraído do JWT,
/// usado no header X-Company-Id da mesma forma que o frontend web.
class SessionStore extends ChangeNotifier {
  static const _tokenKey = 'fluxbus_mobile_token';
  static const _userKey = 'fluxbus_mobile_user';
  static const _companyKey = 'fluxbus_mobile_company_id';
  static const _driverKey = 'fluxbus_mobile_driver_id';
  static const _baseUrlKey = 'fluxbus_mobile_api_base_url';

  static String get defaultBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    if (kDebugMode) {
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
        return 'http://10.0.2.2:8081';
      }
      return 'http://localhost:8081';
    }
    return 'https://ci.fluxbus.com.br';
  }

  String? token;
  AppUser? user;
  String? companyId;
  String? driverId;
  String baseUrl = defaultBaseUrl;

  bool get isLoggedIn => token != null && token!.isNotEmpty;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString(_tokenKey);
    final rawUser = prefs.getString(_userKey);
    if (rawUser != null && rawUser.isNotEmpty) {
      try {
        user = AppUser.fromJson(jsonDecode(rawUser) as Map<String, dynamic>);
      } catch (_) {
        user = null;
      }
    }
    companyId = prefs.getString(_companyKey);
    driverId = prefs.getString(_driverKey);
    baseUrl = prefs.getString(_baseUrlKey) ?? defaultBaseUrl;
    notifyListeners();
  }

  Future<void> save({
    required String token,
    required AppUser user,
    String? companyId,
    String? driverId,
  }) async {
    this.token = token;
    this.user = user;
    this.companyId = companyId ?? this.companyId;
    this.driverId = driverId ?? this.driverId;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
    if (this.companyId != null) await prefs.setString(_companyKey, this.companyId!);
    if (this.driverId != null) await prefs.setString(_driverKey, this.driverId!);
    notifyListeners();
  }

  Future<void> setDriverId(String id) async {
    driverId = id;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_driverKey, id);
    notifyListeners();
  }

  Future<void> setBaseUrl(String url) async {
    baseUrl = url.replaceAll(RegExp(r'/+$'), '');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, baseUrl);
    notifyListeners();
  }

  Future<void> clear() async {
    token = null;
    user = null;
    driverId = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    await prefs.remove(_driverKey);
    notifyListeners();
  }
}

/// Extrai o claim empresaId do JWT sem validar a assinatura (o backend valida).
String? companyIdFromJwt(String? token) {
  if (token == null || token.isEmpty) return null;
  final parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    var payload = parts[1].replaceAll('-', '+').replaceAll('_', '/');
    while (payload.length % 4 != 0) {
      payload += '=';
    }
    final decoded = utf8.decode(base64.decode(payload));
    final map = jsonDecode(decoded) as Map<String, dynamic>;
    return map['empresaId']?.toString();
  } catch (_) {
    return null;
  }
}
