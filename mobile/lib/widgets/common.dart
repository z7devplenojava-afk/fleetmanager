import 'package:flutter/material.dart';

const colorBackground = Color(0xFF0B0D14);
const colorSurface = Color(0xFF141721);
const colorSurfaceAlt = Color(0xFF1B1F2B);
const colorBorder = Color(0xFF242A38);
const colorPrimary = Color(0xFFDC2626);
const colorPrimaryLight = Color(0xFFEF4444);
const colorText = Color(0xFFF3F4F6);
const colorMuted = Color(0xFF9CA3AF);
const colorSuccess = Color(0xFF22C55E);
const colorWarning = Color(0xFFF59E0B);

class SectionTitle extends StatelessWidget {
  final String title;
  final Widget? trailing;

  const SectionTitle({super.key, required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title.toUpperCase(),
          style: const TextStyle(
            color: colorMuted,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.6,
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

class InfoCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;

  const InfoCard({super.key, required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colorBorder),
      ),
      child: child,
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;

  const StatusBadge({super.key, required this.label, required this.color});

  factory StatusBadge.auto(String status) {
    final s = status.toUpperCase();
    final color = s.contains('CONCLU') || s.contains('PAID') || s.contains('APPROVED') || s.contains('EMITIDA')
        ? colorSuccess
        : s.contains('PEND') || s.contains('AGUARD') || s.contains('PROGRESS')
            ? colorWarning
            : s.contains('CANCEL') || s.contains('ERRO') || s.contains('REJECT')
                ? colorPrimaryLight
                : colorMuted;
    return StatusBadge(label: status, color: color);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.45)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class LoadingView extends StatelessWidget {
  final String message;

  const LoadingView({super.key, this.message = 'Carregando...'});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: colorPrimaryLight),
            const SizedBox(height: 12),
            Text(message, style: const TextStyle(color: colorMuted, fontSize: 12)),
          ],
        ),
      );
}

class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorView({super.key, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: colorPrimaryLight, size: 36),
              const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: colorText, fontSize: 13),
              ),
              if (onRetry != null) ...[
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: onRetry,
                  style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
                  child: const Text('Tentar novamente'),
                ),
              ],
            ],
          ),
        ),
      );
}

class EmptyView extends StatelessWidget {
  final String message;
  final IconData icon;

  const EmptyView({super.key, required this.message, this.icon = Icons.inbox_outlined});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: colorBorder, size: 40),
              const SizedBox(height: 10),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: colorMuted, fontSize: 12),
              ),
            ],
          ),
        ),
      );
}

Future<bool> confirmAction(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirmar',
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: colorSurface,
      title: Text(title, style: const TextStyle(color: colorText, fontSize: 16)),
      content: Text(message, style: const TextStyle(color: colorMuted, fontSize: 13)),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, true),
          style: ElevatedButton.styleFrom(backgroundColor: colorPrimary),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result ?? false;
}

void showMessage(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: error ? colorPrimary : colorSurfaceAlt,
      behavior: SnackBarBehavior.floating,
    ),
  );
}
