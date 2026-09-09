"""
FleetManager Agent System - Ponto Eletrônico Agent
===================================================
Responsibilities:
- Monitor incomplete daily time records
- Track bank hours (credits/debits)
- Detect overtime not approved
- Validate work journey completeness
- Alert about missing or inconsistent time records
- Calculate worked hours summary
"""

from datetime import datetime, date, timedelta, time
from typing import Any, Dict, List, Optional, Tuple

from core.base_agent import BaseAgent, AgentReport


class PontoAgent(BaseAgent):
    """Agente de Ponto Eletrônico - Monitora registros, banco de horas e jornada."""

    def __init__(self):
        super().__init__(
            name="Ponto",
            module="ponto",
            description="Ponto Eletrônico - Registros de Ponto, Banco de Horas e Jornada",
        )

    def run_check(self) -> AgentReport:
        """Execute complete Ponto module check."""
        self.log.info("🔍 Iniciando verificação completa do módulo Ponto Eletrônico...")

        all_findings = []
        all_alerts = []
        all_recommendations = []

        # Run sub-checks
        findings_incomplete, alerts_incomplete, recs_incomplete = self._check_incomplete_records()
        findings_overtime, alerts_overtime, recs_overtime = self._check_unapproved_overtime()
        findings_bank, alerts_bank, recs_bank = self._check_bank_hours_balance()
        findings_missing, alerts_missing, recs_missing = self._check_missing_records_today()
        findings_consistency, alerts_consistency, recs_consistency = self._check_sequence_consistency()

        all_findings.extend(findings_incomplete + findings_overtime + findings_bank +
                           findings_missing + findings_consistency)
        all_alerts.extend(alerts_incomplete + alerts_overtime + alerts_bank +
                         alerts_missing + alerts_consistency)
        all_recommendations.extend(recs_incomplete + recs_overtime + recs_bank +
                                  recs_missing + recs_consistency)

        # Metrics
        metrics = self._calculate_metrics()

        # Overall status
        status = "OK"
        if any(a.get("level") == "critical" for a in all_alerts):
            status = "CRITICAL"
        elif any(a.get("level") == "warning" for a in all_alerts):
            status = "WARNING"

        summary = (
            f"Ponto Check: {metrics.get('today_records', 0)} registros hoje | "
            f"{metrics.get('pending_approval', 0)} pendentes | "
            f"{metrics.get('incomplete_journeys', 0)} jornadas incompletas | "
            f"{len(all_alerts)} alertas"
        )

        report = self.create_report(
            status=status,
            summary=summary,
            findings=all_findings,
            alerts=all_alerts,
            recommendations=all_recommendations,
            metrics=metrics,
        )

        self.dispatch_alerts(report)
        self.log.info(f"✅ Ponto Check concluído - Status: {status}")
        return report

    # ── Incomplete Records ────────────────────────────────────

    def _check_incomplete_records(self) -> Tuple[List, List, List]:
        """Find days with incomplete time record sequences."""
        findings = []
        alerts = []
        recommendations = []
        today = date.today()

        try:
            # Buscar registros dos últimos 3 dias sem sequência completa
            rows = self.execute_query("""
                WITH daily_records AS (
                    SELECT
                        tr.employee_id,
                        e.name AS employee_name,
                        DATE(tr.recorded_at) AS record_date,
                        COUNT(*) AS total_records,
                        COUNT(*) FILTER (WHERE tr.record_type = 'ENTRADA') AS has_entrada,
                        COUNT(*) FILTER (WHERE tr.record_type = 'SAIDA') AS has_saida,
                        COUNT(*) FILTER (WHERE tr.record_type = 'SAIDA_ALMOCO') AS has_saida_almoco,
                        COUNT(*) FILTER (WHERE tr.record_type = 'RETORNO_ALMOCO') AS has_retorno_almoco
                    FROM time_records tr
                    JOIN employees e ON e.id = tr.employee_id
                    WHERE DATE(tr.recorded_at) >= CURRENT_DATE - INTERVAL '3 days'
                      AND DATE(tr.recorded_at) < CURRENT_DATE
                    GROUP BY tr.employee_id, e.name, DATE(tr.recorded_at)
                )
                SELECT * FROM daily_records
                WHERE has_entrada > 0 AND has_saida = 0
                ORDER BY record_date DESC
                LIMIT 20
            """)

            for row in rows:
                alerts.append({
                    "level": "warning",
                    "title": f"Jornada Incompleta - {row['employee_name']}",
                    "message": (
                        f"{row['employee_name']} registrou entrada em {self.format_date(row['record_date'])} "
                        f"mas não registrou saída. {row['total_records']} registro(s) no dia."
                    ),
                })
                findings.append({
                    "type": "incomplete_journey",
                    "employee": row["employee_name"],
                    "date": str(row["record_date"]),
                    "records_count": row["total_records"],
                    "severity": "warning",
                })

            self.log.info(f"  ├─ Jornadas Incompletas: {len(rows)} encontradas")
        except Exception as e:
            self.log.error(f"Error checking incomplete records: {e}")

        return findings, alerts, recommendations

    # ── Unapproved Overtime ───────────────────────────────────

    def _check_unapproved_overtime(self) -> Tuple[List, List, List]:
        """Check for overtime records pending approval."""
        findings = []
        alerts = []
        recommendations = []

        try:
            rows = self.execute_query("""
                SELECT
                    o.id, o.employee_id, e.name AS employee_name,
                    o.date, o.hours, o.description, o.status,
                    o.created_at
                FROM overtime o
                JOIN employees e ON e.id = o.employee_id
                WHERE o.status = 'PENDING'
                  AND o.created_at <= CURRENT_TIMESTAMP - INTERVAL '7 days'
                ORDER BY o.created_at ASC
                LIMIT 20
            """)

            for row in rows:
                days_pending = (datetime.now() - row["created_at"].replace(tzinfo=None) if hasattr(row["created_at"], 'replace') else datetime.now() - row["created_at"]).days

                alerts.append({
                    "level": "warning",
                    "title": f"Hora Extra Pendente - {row['employee_name']}",
                    "message": (
                        f"Hora extra de {row['employee_name']} ({row['hours']}h) do dia "
                        f"{self.format_date(row['date'])} está há {days_pending} dias sem aprovação. "
                        f"Descrição: {row.get('description', 'N/A')}"
                    ),
                })
                findings.append({
                    "type": "overtime_pending",
                    "employee": row["employee_name"],
                    "date": str(row["date"]),
                    "hours": float(row["hours"]),
                    "days_pending": days_pending,
                    "severity": "warning",
                })
                recommendations.append(
                    f"Revisar {row['hours']}h de hora extra de {row['employee_name']} do dia {self.format_date(row['date'])}"
                )

            # Count total pending
            total_pending = self.execute_scalar(
                "SELECT COUNT(*) FROM overtime WHERE status = 'PENDING'"
            )
            if total_pending and total_pending > 10:
                findings.append({
                    "type": "many_overtime_pending",
                    "count": total_pending,
                    "severity": "warning",
                })

            self.log.info(f"  ├─ Horas Extras Pendentes: {len(rows)} não aprovadas (>7d)")
        except Exception as e:
            self.log.error(f"Error checking overtime: {e}")

        return findings, alerts, recommendations

    # ── Bank Hours Balance ────────────────────────────────────

    def _check_bank_hours_balance(self) -> Tuple[List, List, List]:
        """Monitor bank hours credits and debits limits."""
        findings = []
        alerts = []
        recommendations = []
        CREDIT_LIMIT = 40.0
        DEBIT_LIMIT = -20.0

        try:
            rows = self.execute_query("""
                SELECT
                    bh.employee_id, e.name AS employee_name,
                    COALESCE(SUM(bh.credit_hours), 0) - COALESCE(SUM(bh.debit_hours), 0) AS balance
                FROM bank_hours bh
                JOIN employees e ON e.id = bh.employee_id
                GROUP BY bh.employee_id, e.name
                HAVING COALESCE(SUM(bh.credit_hours), 0) - COALESCE(SUM(bh.debit_hours), 0) > :credit_limit
                   OR COALESCE(SUM(bh.credit_hours), 0) - COALESCE(SUM(bh.debit_hours), 0) < :debit_limit
                ORDER BY balance DESC
                LIMIT 20
            """, {"credit_limit": CREDIT_LIMIT, "debit_limit": DEBIT_LIMIT})

            for row in rows:
                balance = float(row["balance"])
                level = "warning" if balance > CREDIT_LIMIT else "critical"
                level_label = "crédito excessivo" if balance > CREDIT_LIMIT else "débito excessivo"

                alerts.append({
                    "level": level,
                    "title": f"Banco de Horas - {row['employee_name']}",
                    "message": (
                        f"Saldo de banco de horas de {row['employee_name']} é de "
                        f"{balance:.1f}h ({level_label}). "
                        f"Limites: crédito {CREDIT_LIMIT}h / débito {DEBIT_LIMIT}h"
                    ),
                })
                findings.append({
                    "type": "bank_hours_limit_exceeded",
                    "employee": row["employee_name"],
                    "balance": balance,
                    "limit_type": "credit" if balance > 0 else "debit",
                    "severity": level,
                })

                if balance < DEBIT_LIMIT:
                    recommendations.append(
                        f"Agendar compensação de banco de horas para {row['employee_name']} (débito de {abs(balance):.1f}h)"
                    )

            self.log.info(f"  ├─ Banco de Horas: {len(rows)} fora dos limites")
        except Exception as e:
            # Bank hours table may not exist yet
            self.log.debug(f"Bank hours check not available: {e}")
            pass

        return findings, alerts, recommendations

    # ── Missing Records Today ─────────────────────────────────

    def _check_missing_records_today(self) -> Tuple[List, List, List]:
        """Check if active employees have recorded today's entry."""
        findings = []
        alerts = []
        recommendations = []
        now = datetime.now()

        try:
            # Only check after 9 AM
            if now.hour < 9:
                return findings, alerts, recommendations

            rows = self.execute_query("""
                SELECT e.id, e.name
                FROM employees e
                WHERE e.status = 'ACTIVE'
                  AND e.id NOT IN (
                      SELECT tr.employee_id
                      FROM time_records tr
                      WHERE DATE(tr.recorded_at) = CURRENT_DATE
                        AND tr.record_type = 'ENTRADA'
                  )
                LIMIT 20
            """)

            if rows:
                count = len(rows)
                names = [r["name"] for r in rows[:5]]
                alerts.append({
                    "level": "warning" if now.hour >= 10 else "info",
                    "title": f"Funcionários sem Registro Hoje",
                    "message": (
                        f"{count} funcionário(s) ainda não registraram entrada hoje: "
                        f"{', '.join(names)}{'...' if count > 5 else ''}"
                    ),
                })
                findings.append({
                    "type": "missing_entry_today",
                    "count": count,
                    "employees": names,
                    "severity": "warning" if now.hour >= 10 else "info",
                })

            self.log.info(f"  ├─ Registros Hoje: {len(rows)} faltando")
        except Exception as e:
            self.log.error(f"Error checking missing records: {e}")

        return findings, alerts, recommendations

    # ── Sequence Consistency ──────────────────────────────────

    def _check_sequence_consistency(self) -> Tuple[List, List, List]:
        """Check for duplicate or out-of-sequence records."""
        findings = []
        alerts = []
        recommendations = []
        VALID_SEQUENCE = ["ENTRADA", "SAIDA_ALMOCO", "RETORNO_ALMOCO", "SAIDA"]

        try:
            # Duplicate records of same type on same day
            rows = self.execute_query("""
                SELECT
                    tr.employee_id, e.name AS employee_name,
                    DATE(tr.recorded_at) AS record_date,
                    tr.record_type,
                    COUNT(*) AS count_records
                FROM time_records tr
                JOIN employees e ON e.id = tr.employee_id
                WHERE DATE(tr.recorded_at) >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY tr.employee_id, e.name, DATE(tr.recorded_at), tr.record_type
                HAVING COUNT(*) > 1
                ORDER BY record_date DESC
                LIMIT 20
            """)

            for row in rows:
                alerts.append({
                    "level": "warning",
                    "title": f"Registro Duplicado - {row['employee_name']}",
                    "message": (
                        f"{row['employee_name']} tem {row['count_records']} registros do tipo "
                        f"'{row['record_type']}' em {self.format_date(row['record_date'])}"
                    ),
                })
                findings.append({
                    "type": "duplicate_record",
                    "employee": row["employee_name"],
                    "date": str(row["record_date"]),
                    "record_type": row["record_type"],
                    "count": row["count_records"],
                    "severity": "warning",
                })

            self.log.info(f"  ├─ Consistência: {len(rows)} duplicatas encontradas")
        except Exception as e:
            self.log.error(f"Error checking consistency: {e}")

        return findings, alerts, recommendations

    # ── Metrics ───────────────────────────────────────────────

    def _calculate_metrics(self) -> Dict[str, Any]:
        """Calculate overall Ponto module metrics."""
        metrics = {}
        try:
            today_str = date.today().isoformat()
            metrics["today_records"] = self.execute_scalar(
                "SELECT COUNT(*) FROM time_records WHERE DATE(recorded_at) = CURRENT_DATE"
            )
            metrics["pending_approval"] = self.execute_scalar(
                "SELECT COUNT(*) FROM time_records WHERE status = 'PENDING'"
            )
            metrics["incomplete_journeys"] = self.execute_scalar("""
                SELECT COUNT(*) FROM (
                    SELECT tr.employee_id, DATE(tr.recorded_at) AS d
                    FROM time_records tr
                    WHERE DATE(tr.recorded_at) >= CURRENT_DATE - INTERVAL '3 days'
                    GROUP BY tr.employee_id, DATE(tr.recorded_at)
                    HAVING COUNT(*) FILTER (WHERE tr.record_type = 'ENTRADA') > 0
                       AND COUNT(*) FILTER (WHERE tr.record_type = 'SAIDA') = 0
                ) sub
            """)
            metrics["total_employees_active"] = self.execute_scalar(
                "SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE'"
            )
            metrics["overtime_pending"] = self.execute_scalar(
                "SELECT COUNT(*) FROM overtime WHERE status = 'PENDING'"
            )
        except Exception as e:
            self.log.error(f"Error calculating metrics: {e}")
        return metrics

    # ── Summary ───────────────────────────────────────────────

    def get_summary(self) -> str:
        """Return a human-readable summary of Ponto module status."""
        metrics = self._calculate_metrics()
        return (
            f"⏰ Ponto Eletrônico Status:\n"
            f"  • Registros hoje: {metrics.get('today_records', 'N/A')}\n"
            f"  • Pendentes aprovação: {metrics.get('pending_approval', 'N/A')}\n"
            f"  • Jornadas incompletas (3d): {metrics.get('incomplete_journeys', 'N/A')}\n"
            f"  • Horas extras pendentes: {metrics.get('overtime_pending', 'N/A')}\n"
            f"  • Funcionários ativos: {metrics.get('total_employees_active', 'N/A')}"
        )
