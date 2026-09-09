"""
FleetManager Agent System - RH Agent (Recursos Humanos)
========================================================
Responsibilities:
- Monitor document expirations (CNH, CTPS, RG, certifications)
- Track vacation schedules and balances
- Monitor probation periods
- Validate employee data consistency
- Detect missing or incomplete employee records
- Alert about upcoming renewals and deadlines
"""

from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional, Tuple

from core.base_agent import BaseAgent, AgentReport


class RHAgent(BaseAgent):
    """Agente de Recursos Humanos - Monitora funcionários e documentos."""

    def __init__(self):
        super().__init__(
            name="RH",
            module="rh",
            description="Gestão de Recursos Humanos - Funcionários, Documentos e Férias",
        )

    def run_check(self) -> AgentReport:
        """Execute complete RH module check."""
        self.log.info("🔍 Iniciando verificação completa do módulo RH...")

        all_findings = []
        all_alerts = []
        all_recommendations = []

        # Run sub-checks
        findings_docs, alerts_docs, recs_docs = self._check_document_expirations()
        findings_vac, alerts_vac, recs_vac = self._check_vacations()
        findings_prob, alerts_prob, recs_prob = self._check_probation_periods()
        findings_emp, alerts_emp, recs_emp = self._check_employee_consistency()
        findings_birth, alerts_birth, recs_birth = self._check_upcoming_birthdays()

        all_findings.extend(findings_docs + findings_vac + findings_prob + findings_emp + findings_birth)
        all_alerts.extend(alerts_docs + alerts_vac + alerts_prob + alerts_emp + alerts_birth)
        all_recommendations.extend(recs_docs + recs_vac + recs_prob + recs_emp + recs_birth)

        # Calculate metrics
        metrics = self._calculate_metrics()

        # Determine overall status
        status = "OK"
        if any(a.get("level") == "critical" for a in all_alerts):
            status = "CRITICAL"
        elif any(a.get("level") == "warning" for a in all_alerts):
            status = "WARNING"

        summary = (
            f"RH Check: {metrics.get('total_employees', 0)} funcionários | "
            f"{metrics.get('active_employees', 0)} ativos | "
            f"{len(all_alerts)} alertas | "
            f"{metrics.get('expiring_docs', 0)} documentos próximos ao vencimento"
        )

        report = self.create_report(
            status=status,
            summary=summary,
            findings=all_findings,
            alerts=all_alerts,
            recommendations=all_recommendations,
            metrics=metrics,
        )

        # Dispatch critical/warning alerts
        self.dispatch_alerts(report)

        self.log.info(f"✅ RH Check concluído - Status: {status}")
        return report

    # ── Document Expirations ──────────────────────────────────

    def _check_document_expirations(self) -> Tuple[List, List, List]:
        """Check for expiring or expired employee documents."""
        findings = []
        alerts = []
        recommendations = []
        today = date.today()
        warning_days = 30  # Alert 30 days before expiration

        # 1. CNH expiring soon
        try:
            rows = self.execute_query("""
                SELECT e.id, e.name, e.cnh_number, e.cnh_expiration_date,
                       e.cnh_category, e.email, e.phone, e.company_id
                FROM employees e
                WHERE e.status = 'ACTIVE'
                  AND e.cnh_number IS NOT NULL
                  AND e.cnh_number != ''
                  AND e.cnh_expiration_date IS NOT NULL
                ORDER BY e.cnh_expiration_date ASC
            """)

            for emp in rows:
                exp_date = emp["cnh_expiration_date"]
                if isinstance(exp_date, str):
                    exp_date = datetime.strptime(exp_date, "%Y-%m-%d").date()

                days_left = self.days_until(exp_date)

                if days_left < 0:
                    # Already expired
                    alerts.append({
                        "level": "critical",
                        "title": f"CNH Vencida - {emp['name']}",
                        "message": (
                            f"CNH do funcionário {emp['name']} venceu há {abs(days_left)} dias. "
                            f"Número: {emp.get('cnh_number', 'N/A')} | "
                            f"Vencimento: {self.format_date(exp_date)} | "
                            f"Categoria: {emp.get('cnh_category', 'N/A')}"
                        ),
                    })
                    findings.append({
                        "type": "document_expired",
                        "employee": emp["name"],
                        "document": "CNH",
                        "number": emp.get("cnh_number"),
                        "expiration": str(exp_date),
                        "days_overdue": abs(days_left),
                        "severity": "critical",
                    })
                elif days_left <= warning_days:
                    alerts.append({
                        "level": "warning",
                        "title": f"CNH a Vencer - {emp['name']}",
                        "message": (
                            f"CNH do funcionário {emp['name']} vence em {days_left} dias. "
                            f"Vencimento: {self.format_date(exp_date)}"
                        ),
                    })
                    findings.append({
                        "type": "document_expiring",
                        "employee": emp["name"],
                        "document": "CNH",
                        "number": emp.get("cnh_number"),
                        "expiration": str(exp_date),
                        "days_left": days_left,
                        "severity": "warning",
                    })

            self.log.info(f"  ├─ CNH: {len(rows)} verificadas, {len([a for a in alerts if 'CNH' in a['title']])} alertas")
        except Exception as e:
            self.log.error(f"Error checking CNH: {e}")

        return findings, alerts, recommendations

    # ── Vacation Tracking ─────────────────────────────────────

    def _check_vacations(self) -> Tuple[List, List, List]:
        """Check vacation schedules and upcoming/overdue vacations."""
        findings = []
        alerts = []
        recommendations = []
        today = date.today()

        try:
            rows = self.execute_query("""
                SELECT v.id, v.employee_id, e.name as employee_name,
                       v.start_date, v.end_date, v.status, v.vacation_type,
                       v.days_count
                FROM vacations v
                JOIN employees e ON e.id = v.employee_id
                WHERE v.status = 'SCHEDULED'
                   OR v.status = 'PENDING'
                ORDER BY v.start_date ASC
            """)

            for vac in rows:
                start = vac["start_date"]
                end = vac["end_date"]
                if isinstance(start, str):
                    start = datetime.strptime(str(start), "%Y-%m-%d").date()
                if isinstance(end, str):
                    end = datetime.strptime(str(end), "%Y-%m-%d").date()

                days_to_start = self.days_until(start)

                if days_to_start < 0 and vac["status"] == "SCHEDULED":
                    # Vacation started or should have started
                    days_since_start = abs(days_to_start)
                    if days_since_start > 5 and vac["status"] != "IN_PROGRESS":
                        alerts.append({
                            "level": "warning",
                            "title": f"Férias Atrasadas - {vac['employee_name']}",
                            "message": (
                                f"Férias programadas para {vac['employee_name']} deveriam ter começado "
                                f"há {days_since_start} dias (início: {self.format_date(start)}). "
                                f"Status: {vac['status']}"
                            ),
                        })
                        findings.append({
                            "type": "vacation_overdue",
                            "employee": vac["employee_name"],
                            "start": str(start),
                            "end": str(end),
                            "status": vac["status"],
                            "severity": "warning",
                        })
                elif 0 < days_to_start <= 60:
                    alerts.append({
                        "level": "info",
                        "title": f"Férias Próximas - {vac['employee_name']}",
                        "message": (
                            f"Férias de {vac['employee_name']} começam em {days_to_start} dias. "
                            f"Período: {self.format_date(start)} a {self.format_date(end)}"
                        ),
                    })
                    findings.append({
                        "type": "vacation_upcoming",
                        "employee": vac["employee_name"],
                        "start": str(start),
                        "end": str(end),
                        "days_to_start": days_to_start,
                        "severity": "info",
                    })

            self.log.info(f"  ├─ Férias: {len(rows)} registros verificados")
        except Exception as e:
            self.log.error(f"Error checking vacations: {e}")

        return findings, alerts, recommendations

    # ── Probation Periods ─────────────────────────────────────

    def _check_probation_periods(self) -> Tuple[List, List, List]:
        """Check employees with ending probation periods."""
        findings = []
        alerts = []
        recommendations = []
        today = date.today()

        try:
            rows = self.execute_query("""
                SELECT e.id, e.name, e.hire_date, e.probation_end_date,
                       e.status, e.email
                FROM employees e
                WHERE e.status = 'ACTIVE'
                  AND e.probation_end_date IS NOT NULL
                  AND e.probation_end_date >= CURRENT_DATE - INTERVAL '15 days'
                ORDER BY e.probation_end_date ASC
            """)

            for emp in rows:
                prob_end = emp["probation_end_date"]
                if isinstance(prob_end, str):
                    prob_end = datetime.strptime(str(prob_end), "%Y-%m-%d").date()

                days_left = self.days_until(prob_end)

                if days_left < 0:
                    alerts.append({
                        "level": "warning",
                        "title": f"Experiência Vencida - {emp['name']}",
                        "message": (
                            f"Período de experiência de {emp['name']} expirou há {abs(days_left)} dias. "
                            f"Data fim: {self.format_date(prob_end)}. Verificar efetivação ou desligamento."
                        ),
                    })
                elif days_left <= 15:
                    alerts.append({
                        "level": "warning",
                        "title": f"Experiência a Vencer - {emp['name']}",
                        "message": (
                            f"Período de experiência de {emp['name']} termina em {days_left} dias. "
                            f"Data fim: {self.format_date(prob_end)}"
                        ),
                    })
                    findings.append({
                        "type": "probation_ending",
                        "employee": emp["name"],
                        "end_date": str(prob_end),
                        "days_left": days_left,
                        "severity": "warning",
                    })
                    recommendations.append(
                        f"Programar avaliação de {emp['name']} para definir efetivação"
                    )

            self.log.info(f"  ├─ Experiência: {len(rows)} períodos verificados")
        except Exception as e:
            self.log.error(f"Error checking probation: {e}")

        return findings, alerts, recommendations

    # ── Employee Data Consistency ─────────────────────────────

    def _check_employee_consistency(self) -> Tuple[List, List, List]:
        """Check for missing or inconsistent employee data."""
        findings = []
        alerts = []
        recommendations = []

        try:
            # Employees without position
            rows = self.execute_query("""
                SELECT e.id, e.name, e.status, e.company_id
                FROM employees e
                WHERE (e.position_id IS NULL)
                  AND e.status = 'ACTIVE'
                LIMIT 20
            """)
            if rows:
                findings.append({
                    "type": "missing_position",
                    "count": len(rows),
                    "employees": [r["name"] for r in rows],
                    "severity": "warning",
                })
                alerts.append({
                    "level": "warning",
                    "title": "Funcionários sem Cargo",
                    "message": f"{len(rows)} funcionário(s) ativo(s) sem cargo definido: {', '.join(r['name'] for r in rows[:5])}",
                })
                recommendations.append("Definir cargos para funcionários vinculados")

            # Employees without unit
            rows = self.execute_query("""
                SELECT COUNT(*) as total FROM employees
                WHERE unit_id IS NULL AND status = 'ACTIVE'
            """)
            if rows and rows[0]["total"] > 0:
                findings.append({
                    "type": "missing_unit",
                    "count": rows[0]["total"],
                    "severity": "info",
                })
                recommendations.append(
                    f"Verificar {rows[0]['total']} funcionário(s) sem unidade definida"
                )

            self.log.info(f"  ├─ Consistência: OK ({len(findings)} inconsistências)")
        except Exception as e:
            self.log.error(f"Error checking consistency: {e}")

        return findings, alerts, recommendations

    # ── Upcoming Birthdays ────────────────────────────────────

    def _check_upcoming_birthdays(self) -> Tuple[List, List, List]:
        """Check for upcoming employee birthdays."""
        findings = []
        alerts = []
        recommendations = []
        today = date.today()

        try:
            rows = self.execute_query("""
                SELECT e.id, e.name, e.birth_date, e.email, e.phone
                FROM employees e
                WHERE e.status = 'ACTIVE'
                  AND e.birth_date IS NOT NULL
                  AND (
                    (EXTRACT(MONTH FROM e.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '7 days')
                     AND EXTRACT(DAY FROM e.birth_date) = EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '7 days'))
                    OR
                    (EXTRACT(MONTH FROM e.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                     AND EXTRACT(DAY FROM e.birth_date) = EXTRACT(DAY FROM CURRENT_DATE))
                  )
                ORDER BY EXTRACT(MONTH FROM e.birth_date), EXTRACT(DAY FROM e.birth_date)
            """)

            for emp in rows:
                birth = emp["birth_date"]
                if isinstance(birth, str):
                    birth = datetime.strptime(str(birth), "%Y-%m-%d").date()

                alerts.append({
                    "level": "info",
                    "title": f"🎂 Aniversário - {emp['name']}",
                    "message": f"{emp['name']} faz aniversário dia {self.format_date(birth)}!",
                })
                findings.append({
                    "type": "birthday",
                    "employee": emp["name"],
                    "birth_date": str(birth),
                    "severity": "info",
                })

            if rows:
                self.log.info(f"  ├─ Aniversários: {len(rows)} aniversariantes")
        except Exception as e:
            self.log.error(f"Error checking birthdays: {e}")

        return findings, alerts, recommendations

    # ── Metrics ───────────────────────────────────────────────

    def _calculate_metrics(self) -> Dict[str, Any]:
        """Calculate overall RH module metrics."""
        metrics = {}
        try:
            metrics["total_employees"] = self.execute_scalar(
                "SELECT COUNT(*) FROM employees"
            )
            metrics["active_employees"] = self.execute_scalar(
                "SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE'"
            )
            metrics["terminated_employees"] = self.execute_scalar(
                "SELECT COUNT(*) FROM employees WHERE status = 'TERMINATED'"
            )
            metrics["on_leave_employees"] = self.execute_scalar(
                "SELECT COUNT(*) FROM employees WHERE status = 'ON_LEAVE'"
            )
            metrics["expiring_docs"] = self.execute_scalar("""
                SELECT COUNT(*) FROM employees
                WHERE status = 'ACTIVE'
                  AND cnh_expiration_date IS NOT NULL
                  AND cnh_expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
            """)
            metrics["employees_without_position"] = self.execute_scalar(
                "SELECT COUNT(*) FROM employees WHERE position_id IS NULL AND status = 'ACTIVE'"
            )
            metrics["upcoming_vacations"] = self.execute_scalar("""
                SELECT COUNT(*) FROM vacations
                WHERE status = 'SCHEDULED'
                  AND start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
            """)
        except Exception as e:
            self.log.error(f"Error calculating metrics: {e}")
        return metrics

    # ── Summary ───────────────────────────────────────────────

    def get_summary(self) -> str:
        """Return a human-readable summary of RH module status."""
        metrics = self._calculate_metrics()
        return (
            f"👥 RH Module Status:\n"
            f"  • Total Funcionários: {metrics.get('total_employees', 'N/A')}\n"
            f"  • Ativos: {metrics.get('active_employees', 'N/A')}\n"
            f"  • Desligados: {metrics.get('terminated_employees', 'N/A')}\n"
            f"  • Afastados: {metrics.get('on_leave_employees', 'N/A')}\n"
            f"  • CNHs a vencer (30d): {metrics.get('expiring_docs', 'N/A')}\n"
            f"  • Sem cargo: {metrics.get('employees_without_position', 'N/A')}\n"
            f"  • Férias programadas: {metrics.get('upcoming_vacations', 'N/A')}"
        )
