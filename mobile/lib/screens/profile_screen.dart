import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/locator.dart';
import '../models/models.dart';
import '../widgets/common.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<Driver> _drivers = const [];
  Driver? _selected;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _drivers = await authService.drivers();
      final user = session.user;
      if (user != null) {
        _selected = authService.resolveCurrentDriver(user, _drivers);
        if (_selected != null && session.driverId != _selected!.id) {
          await session.setDriverId(_selected!.id);
        }
      }
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = session.user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Perfil'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  backgroundColor: colorPrimary.withValues(alpha: 0.18),
                  child: Text(
                    (user?.displayName.isNotEmpty ?? false)
                        ? user!.displayName.substring(0, 1).toUpperCase()
                        : '?',
                    style: const TextStyle(color: colorPrimaryLight, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                Text(user?.displayName ?? 'Usuário',
                    style: const TextStyle(color: colorText, fontSize: 17, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(user?.email ?? '', style: const TextStyle(color: colorMuted, fontSize: 12)),
                const SizedBox(height: 4),
                Text('Perfil: ${user?.roles.join(', ') ?? '-'}',
                    style: const TextStyle(color: colorMuted, fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SectionTitle(title: 'Vínculo com motorista'),
          const SizedBox(height: 8),
          InfoCard(
            child: _loading
                ? const LoadingView()
                : _error != null
                    ? Text(_error!, style: const TextStyle(color: colorPrimaryLight, fontSize: 12))
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (_drivers.isEmpty)
                            const Text('Nenhum motorista cadastrado.',
                                style: TextStyle(color: colorMuted, fontSize: 12))
                          else
                            DropdownButtonFormField<Driver>(
                              initialValue: _selected,
                              dropdownColor: colorSurfaceAlt,
                              style: const TextStyle(color: colorText),
                              decoration: const InputDecoration(labelText: 'Motorista vinculado'),
                              items: _drivers
                                  .map((d) => DropdownMenuItem(
                                        value: d,
                                        child: Text(d.name, style: const TextStyle(fontSize: 12)),
                                      ))
                                  .toList(),
                              onChanged: (value) async {
                                setState(() => _selected = value);
                                if (value != null) await session.setDriverId(value.id);
                              },
                            ),
                          const SizedBox(height: 8),
                          Text('ID do motorista: ${session.driverId ?? "não vinculado"}',
                              style: const TextStyle(color: colorMuted, fontSize: 11)),
                        ],
                      ),
          ),
          const SizedBox(height: 16),
          InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Servidor', style: TextStyle(color: colorText, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(session.baseUrl, style: const TextStyle(color: colorMuted, fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () async {
              final ok = await confirmAction(
                context,
                title: 'Sair',
                message: 'Deseja encerrar a sessão?',
                confirmLabel: 'Sair',
              );
              if (!ok) return;
              await authService.logout();
              if (!mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
            icon: const Icon(Icons.logout),
            label: const Text('Sair'),
            style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
          ),
        ],
      ),
    );
  }
}
