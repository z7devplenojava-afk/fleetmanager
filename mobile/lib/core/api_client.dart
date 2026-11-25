import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'session.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final String? body;

  const ApiException(this.statusCode, this.message, {this.body});

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient(this.session);

  final SessionStore session;
  final http.Client _client = http.Client();

  Uri _uri(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Uri.parse(path);
    }
    final base = session.baseUrl.replaceAll(RegExp(r'/+$'), '');
    final suffix = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$base$suffix');
  }

  Map<String, String> _headers({bool jsonBody = false}) {
    final headers = <String, String>{
      'Accept': 'application/json',
    };
    if (jsonBody) headers['Content-Type'] = 'application/json; charset=UTF-8';
    final token = session.token;
    if (token != null && token.isNotEmpty) headers['Authorization'] = 'Bearer $token';
    final company = session.companyId;
    if (company != null && company.isNotEmpty) headers['X-Company-Id'] = company;
    return headers;
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) async {
    final uri = _uri(path).replace(queryParameters: query);
    return _send(() => _client.get(uri, headers: _headers()));
  }

  Future<dynamic> post(String path, [Object? body]) async {
    return _send(() => _client.post(
          _uri(path),
          headers: _headers(jsonBody: true),
          body: body == null ? null : jsonEncode(body),
        ));
  }

  Future<dynamic> put(String path, [Object? body]) async {
    return _send(() => _client.put(
          _uri(path),
          headers: _headers(jsonBody: true),
          body: body == null ? null : jsonEncode(body),
        ));
  }

  Future<dynamic> patch(String path, [Object? body]) async {
    return _send(() => _client.patch(
          _uri(path),
          headers: _headers(jsonBody: true),
          body: body == null ? null : jsonEncode(body),
        ));
  }

  Future<dynamic> delete(String path) async {
    return _send(() => _client.delete(_uri(path), headers: _headers()));
  }

  Future<dynamic> uploadFiles(
    String path, {
    required String field,
    required List<File> files,
    Map<String, String>? fields,
  }) async {
    final uri = _uri(path);
    final request = http.MultipartRequest('POST', uri)
      ..headers.addAll(_headers());
    if (fields != null) request.fields.addAll(fields);
    for (final file in files) {
      request.files.add(await http.MultipartFile.fromPath(field, file.path));
    }
    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    return _parse(response);
  }

  Future<dynamic> _send(Future<http.Response> Function() action) async {
    try {
      final response = await action();
      return _parse(response);
    } on ApiException {
      rethrow;
    } on SocketException catch (e) {
      throw ApiException(0, 'Sem conexão com o servidor: ${e.message}');
    } catch (e) {
      throw ApiException(0, 'Falha na requisição: $e');
    }
  }

  dynamic _parse(http.Response response) {
    final body = response.body;
    dynamic decoded;
    if (body.isNotEmpty) {
      try {
        decoded = jsonDecode(body);
      } catch (_) {
        decoded = body;
      }
    }
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }
    String message = 'Erro HTTP ${response.statusCode}';
    if (decoded is Map) {
      final candidate = decoded['message'] ?? decoded['error'] ?? decoded['detail'];
      if (candidate != null) message = candidate.toString();
    } else if (decoded is String && decoded.isNotEmpty) {
      message = decoded.length > 300 ? decoded.substring(0, 300) : decoded;
    }
    throw ApiException(response.statusCode, message, body: body);
  }

  void dispose() => _client.close();
}
