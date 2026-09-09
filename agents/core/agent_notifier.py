"""
FleetManager Agent System - Notifier Module
============================================
Sends alerts and notifications via multiple channels:
- Console (always)
- Email (via SMTP)
- Webhook (HTTP POST)
- Slack (webhook)
- WhatsApp (via FleetManager API)
"""

from datetime import datetime
from typing import Optional
import requests
from config import config
from core.agent_logger import agent_logger


class AgentNotifier:
    """Multi-channel notification dispatcher for agent alerts."""

    def __init__(self, agent_name: str = "system"):
        self.agent_name = agent_name
        self.log = agent_logger.get_logger(agent_name)
        self.cfg = config.notification

    # ── Alert Levels ──────────────────────────────────────────
    ALERT_CRITICAL = "🔴 CRÍTICO"
    ALERT_WARNING = "🟡 ATENÇÃO"
    ALERT_INFO = "🔵 INFO"
    ALERT_SUCCESS = "🟢 SUCESSO"

    # ── Public API ────────────────────────────────────────────

    def alert(
        self,
        title: str,
        message: str,
        level: str = ALERT_INFO,
        module: str = "",
        send_email: bool = False,
        send_webhook: bool = False,
        send_slack: bool = False,
    ) -> None:
        """Send an alert through configured channels."""
        # Always log
        self._log_alert(level, title, message, module)

        # Optional channels
        if send_email and self.cfg.email_enabled:
            self._send_email(title, message)

        if send_webhook and self.cfg.webhook_enabled:
            self._send_webhook(title, message, level)

        if send_slack and self.cfg.slack_enabled:
            self._send_slack(title, message, level)

    def critical(self, title: str, message: str, module: str = "") -> None:
        """Send a critical alert (highest priority)."""
        self.alert(title, message, self.ALERT_CRITICAL, module,
                   send_email=True, send_webhook=True, send_slack=True)

    def warning(self, title: str, message: str, module: str = "") -> None:
        """Send a warning alert."""
        self.alert(title, message, self.ALERT_WARNING, module,
                   send_webhook=True)

    def info(self, title: str, message: str, module: str = "") -> None:
        """Send an informational alert."""
        self.alert(title, message, self.ALERT_INFO, module)

    def success(self, title: str, message: str, module: str = "") -> None:
        """Send a success alert."""
        self.alert(title, message, self.ALERT_SUCCESS, module)

    # ── Internal Methods ──────────────────────────────────────

    def _log_alert(self, level: str, title: str, message: str, module: str) -> None:
        """Log the alert to the console and file."""
        tag = f"[{module}]" if module else ""
        log_msg = f"{level} {tag} {title}: {message}"

        if self.ALERT_CRITICAL in level:
            self.log.critical(log_msg)
        elif self.ALERT_WARNING in level:
            self.log.warning(log_msg)
        else:
            self.log.info(log_msg)

    def _send_email(self, subject: str, body: str) -> None:
        """Send email via SMTP."""
        try:
            import smtplib
            from email.mime.text import MIMEText

            msg = MIMEText(body, "plain", "utf-8")
            msg["Subject"] = f"[FleetManager Agent] {subject}"
            msg["From"] = self.cfg.email_user
            msg["To"] = self.cfg.email_user  # Send to self/admin

            with smtplib.SMTP(self.cfg.email_smtp, self.cfg.email_port) as server:
                server.starttls()
                server.login(self.cfg.email_user, self.cfg.email_password)
                server.send_message(msg)

            self.log.info(f"📧 Email sent: {subject}")
        except Exception as e:
            self.log.error(f"Failed to send email: {e}")

    def _send_webhook(self, title: str, message: str, level: str) -> None:
        """Send alert via webhook."""
        try:
            payload = {
                "agent": self.agent_name,
                "level": level,
                "title": title,
                "message": message,
                "timestamp": datetime.now().isoformat(),
            }
            resp = requests.post(
                self.cfg.webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            self.log.info(f"🔗 Webhook sent ({resp.status_code}): {title}")
        except Exception as e:
            self.log.error(f"Webhook failed: {e}")

    def _send_slack(self, title: str, message: str, level: str) -> None:
        """Send alert to Slack via webhook."""
        try:
            emoji = {"🔴": "🔴", "🟡": "⚠️", "🔵": "ℹ️", "🟢": "✅"}
            prefix = next((v for k, v in emoji.items() if k in level), "ℹ️")

            payload = {
                "text": f"{prefix} *{title}*\n> {message}\n_Agent: {self.agent_name}_"
            }
            resp = requests.post(
                self.cfg.slack_webhook_url,
                json=payload,
                timeout=10,
            )
            self.log.info(f"💬 Slack sent ({resp.status_code}): {title}")
        except Exception as e:
            self.log.error(f"Slack notification failed: {e}")
