import 'package:flutter/material.dart';

import 'core/locator.dart';
import 'finance/screens/finance_shell.dart';
import 'maintenance/screens/maintenance_shell.dart';
import 'screens/driver_shell.dart';
import 'screens/login_screen.dart';
import 'screens/module_chooser.dart';
import 'widgets/common.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initLocator();
  runApp(const FluxBusApp());
}

Widget homeForSession() {
  final user = session.user;
  if (user == null || !session.isLoggedIn) return const LoginScreen();
  final modules = <Widget>[];
  if (user.canOperate) modules.add(const DriverShell());
  if (user.canFinance) modules.add(const FinanceShell());
  if (user.canMaintain) modules.add(const MaintenanceShell());
  if (modules.length == 1 && !user.isAdmin) return modules.first;
  return const ModuleChooser();
}

class FluxBusApp extends StatelessWidget {
  const FluxBusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FluxBus',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: colorBackground,
        colorScheme: const ColorScheme.dark(
          primary: colorPrimary,
          secondary: colorPrimaryLight,
          surface: colorSurface,
          onPrimary: Colors.white,
          onSurface: colorText,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: colorBackground,
          surfaceTintColor: colorBackground,
          titleTextStyle: TextStyle(color: colorText, fontSize: 17, fontWeight: FontWeight.bold),
          iconTheme: IconThemeData(color: colorText),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: colorSurfaceAlt,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: colorBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: colorBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: colorPrimaryLight),
          ),
          labelStyle: const TextStyle(color: colorMuted, fontSize: 12),
          hintStyle: const TextStyle(color: colorMuted, fontSize: 12),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: colorPrimary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        useMaterial3: true,
      ),
      home: homeForSession(),
    );
  }
}
