import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../core/session.dart';
import '../finance/screens/finance_shell.dart';
import '../maintenance/screens/maintenance_shell.dart';
import '../widgets/common.dart';
import 'driver_shell.dart';
import 'module_chooser.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  final _serverController = TextEditingController(text: session.baseUrl);
  bool _obscurePassword = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _serverController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_identifierController.text.trim().isEmpty || _passwordController.text.isEmpty) {
      showMessage(context, 'Informe usuário/CPF e senha.', error: true);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await session.setBaseUrl(_serverController.text.trim().isEmpty
          ? SessionStore.defaultBaseUrl
          : _serverController.text.trim());
      final user = await authService.login(_identifierController.text, _passwordController.text);
      if (!mounted) return;
      final modules = <Widget>[];
      if (user.canOperate) modules.add(const DriverShell());
      if (user.canFinance) modules.add(const FinanceShell());
      if (user.canMaintain) modules.add(const MaintenanceShell());
      Widget home;
      if (modules.length == 1 && !user.isAdmin) {
        home = modules.first;
      } else {
        home = const ModuleChooser();
      }
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => home));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showServerDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorSurface,
        title: const Text('Servidor', style: TextStyle(color: colorText, fontSize: 16)),
        content: TextField(
          controller: _serverController,
          style: const TextStyle(color: colorText),
          decoration: const InputDecoration(
            labelText: 'URL base da API',
            hintText: 'https://ci.fluxbus.com.br',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.directions_bus_rounded, color: colorPrimaryLight, size: 54),
                const SizedBox(height: 10),
                Center(
                  child: RichText(
                    text: const TextSpan(
                      children: <TextSpan>[
                        TextSpan(
                            text: 'Flux',
                            style: TextStyle(color: colorText, fontSize: 34, fontWeight: FontWeight.w900)),
                        TextSpan(
                            text: 'Bus',
                            style: TextStyle(
                                color: colorPrimaryLight, fontSize: 34, fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                const Center(
                  child: Text(
                    'Área do Motorista',
                    style: TextStyle(color: colorMuted, fontSize: 13, letterSpacing: 0.4),
                  ),
                ),
                const SizedBox(height: 28),
                InfoCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'ACESSO AO SISTEMA',
                        style: TextStyle(
                            color: colorPrimaryLight, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.6),
                      ),
                      const SizedBox(height: 18),
                      TextField(
                        controller: _identifierController,
                        style: const TextStyle(color: colorText),
                        decoration: const InputDecoration(
                          labelText: 'CPF, matrícula ou e-mail',
                          prefixIcon: Icon(Icons.person_outline, color: colorMuted),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        style: const TextStyle(color: colorText),
                        decoration: InputDecoration(
                          labelText: 'Senha',
                          prefixIcon: const Icon(Icons.lock_outline, color: colorMuted),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility : Icons.visibility_off,
                              color: colorMuted,
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: _showServerDialog,
                          icon: const Icon(Icons.settings_outlined, size: 15),
                          label: const Text('Servidor'),
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          _error!,
                          style: const TextStyle(color: colorPrimaryLight, fontSize: 12),
                        ),
                      ],
                      const SizedBox(height: 18),
                      SizedBox(
                        height: 48,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _login,
                          style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
                          child: _loading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Text('ENTRAR', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
