"""
FleetManager Agent System - Financeiro Agent
=============================================
Responsibilities:
- Monitor overdue accounts receivable/payable
- Track payment schedules and deadlines
- Validate bank reconciliation
- Calculate late fees and penalties
- Detect financial inconsistencies
- Alert about upcoming due dates
"""

from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional, Tuple

from core.base_agent import BaseAgent, AgentReport


class FinanceiroAgent(BaseAgent):
    """Agente Financeiro - Monitora contas a receber, conciliação e fluxo de caixa."""

    def __init__(self):
        super().__init__(
            name="Financeiro",
            module="financeiro",
            description="Gestão Financeira - Contas a Receber, Conciliação e Fluxo de Caixa",
        )

    def run_check(self) -> AgentReport:
        """Execute complete Financeiro module check."""
        self.log.info("🔍 Iniciando verificação completa do módulo Financeiro...")

        all_findings = []
        all_alerts = []
        all_recommendations = []

        # Run sub-checks
        findings_overdue, alerts_overdue, recs_overdue = self._check_overdue_accounts()
        findings_due, alerts_due, recs_due = self._check_upcoming_due_dates()
        findings_rec, alerts_rec, recs_rec = self._check_reconciliation()
        findings_cashflow, alerts_cashflow, recs_cashflow = self._check_cashflow_projection()

        all_findings.extend(findings_overdue + findings_due + findings_rec + findings_cashflow)
        all_alerts.extend(alerts_overdue + alerts_due + alerts_rec + alerts_cashflow)
        all_recommendations.extend(recs_overdue + recs_due + recs_rec + recs_cashflow)

        metrics = self._calculate_metrics()
        status = "OK"
        if any(a.get("level") == "critical" for a in all_alerts):
            status = "CRITICAL"
        elif any(a.get("level") == "warning" for a in all_alerts):
            status = "WARNING"

        summary = (
            f"Financeiro Check: {metrics.get('total_receivable', 0)} contas | "
            f"{metrics.get('overdue_count', 0)} vencidas | "
            f"{metrics.get('total_overdue_amount', 0):.2f} em atraso | "
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
        self.log.info(f"✅ Financeiro Check concluído - Status: {status}")
        return report

    # ── Overdue Accounts ──────────────────────────────────────

    def _check_overdue_accounts(self) -> Tuple[List, List, List]:
        """Find overdue accounts and calculate penalties."""
        findings = []
        alerts = []
        recommendations = []

        try:
            rows = self.execute_query("""
                SELECT
                    ar.id, ar.client_id, c.name AS client_name,
                    ar.invoice_number, ar.description,
                    ar.amount, ar.amount_paid,
                    ar.due_date, ar.issue_date,
                    ar.overdue_days, ar.status
                FROM accounts_receivable ar
                JOIN clients c ON c.id = ar.client_id
                WHERE ar.status = 'PENDING'
                  AND ar.due_date < CURRENT_DATE
                ORDER BY ar.due_date ASC
                LIMIT 30
            """)

            total_overdue = 0
            for row in rows:
                due = row["due_date"]
                if isinstance(due, str):
                    due = datetime.strptime(str(due), "%Y-%m-%d").date()

                overdue_days = (date.today() - due).days
                amount = float(row["amount"])
                paid = float(row.get("amount_paid", 0) or 0)
                balance = amount - paid

                # Calculate penalties
                penalty = balance * 0.02  # 2% multa
                interest = balance * 0.00033 * overdue_days  # 0.033% ao dia
                total_due = balance + penalty + interest
                total_overdue += balance

                severity = "critical" if overdue_days > 30 else "warning"
                alerts.append({
                    "level": severity,
                    "title": f"Conta Vencida - {row['client_name']}",
                    "message": (
                        f"Fatura {row['invoice_number']} - {row.get('description', 'N/A')}\n"
                        f"Cliente: {row['client_name']} | Valor: {self.format_currency(balance)}\n"
                        f"Vencimento: {self.format_date(due)} | Atraso: {overdue_days} dias\n"
                        f"Multa: {self.format_currency(penalty)} | Juros: {self.format_currency(interest)}\n"
                        f"Total Atualizado: {self.format_currency(total_due)}"
                    ),
                })
                findings.append({
                    "type": "overdue_account",
                    "client": row["client_name"],
                    "invoice": row["invoice_number"],
                    "amount": balance,
                    "overdue_days": overdue_days,
                    "penalty": penalty,
                    "interest": interest,
                    "total_due": total_due,
                    "severity": severity,
                    "due_date": str(due),
                })
                recommendations.append(
                    f"Cobrar {row['client_name']} - Fatura {row['invoice_number']}: "
                    f"{self.format_currency(total_due)} (atualizado com multa e juros)"
                )

            self.log.info(f"  ├─ Contas Vencidas: {len(rows)} encontradas, total R$ {total_overdue:.2f}")
        except Exception as e:
            self.log.error(f"Error checking overdue accounts: {e}")

        return findings, alerts, recommendations

    # ── Upcoming Due Dates ────────────────────────────────────

    def _check_upcoming_due_dates(self) -> Tuple[List, List, List]:
        """Check accounts due within the next 5 days."""
        findings = []
        alerts = []
        recommendations = []

        try:
            rows = self.execute_query("""
                SELECT
                    ar.id, c.name AS client_name,
                    ar.invoice_number, ar.description,
                    ar.amount, ar.amount_paid,
                    ar.due_date, ar.status
                FROM accounts_receivable ar
                JOIN clients c ON c.id = ar.client_id
                WHERE ar.status = 'PENDING'
                  AND ar.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '5 days'
                ORDER BY ar.due_date ASC
                LIMIT 20
            """)

            for row in rows:
                due = row["due_date"]
                if isinstance(due, str):
                    due = datetime.strptime(str(due), "%Y-%m-%d").date()

                days_left = self.days_until(due)
                balance = float(row["amount"]) - float(row.get("amount_paid", 0) or 0)

                alerts.append({
                    "level": "warning",
                    "title": f"Conta a Vencer - {row['client_name']}",
                    "message": (
                        f"Fatura {row['invoice_number']} de {row['client_name']} "
                        f"vence em {days_left} dia(s) - {self.format_date(due)}\n"
                        f"Valor: {self.format_currency(balance)} | "
                        f"Descrição: {row.get('description', 'N/A')}"
                    ),
                })
                findings.append({
                    "type": "upcoming_due",
                    "client": row["client_name"],
                    "invoice": row["invoice_number"],
                    "amount": balance,
                    "due_date": str(due),
                    "days_left": days_left,
                    "severity": "warning",
                })

            self.log.info(f"  ├─ A Vencer (5d): {len(rows)} contas")
        except Exception as e:
            self.log.error(f"Error checking upcoming due dates: {e}")

        return findings, alerts, recommendations

    # ── Bank Reconciliation ───────────────────────────────────

    def _check_reconciliation(self) -> Tuple[List, List, List]:
        """Check pending bank reconciliations."""
        findings = []
        alerts = []
        recommendations = []

        try:
            rows = self.execute_query("""
                SELECT
                    br.id, b.name AS bank_name,
                    br.reference_date, br.status,
                    br.transaction_count, br.matched_count,
                    br.difference_count,
                    br.total_difference_amount,
                    br.created_at
                FROM bank_reconciliation br
                JOIN banks b ON b.id = br.bank_id
                WHERE br.status = 'PENDING'
                   OR (br.status = 'DIFFERENCE_FOUND' AND br.created_at < CURRENT_TIMESTAMP - INTERVAL '7 days')
                ORDER BY br.reference_date DESC
                LIMIT 10
            """)

            for row in rows:
                ref_date = row["reference_date"]
                severity = "critical" if row["status"] == "DIFFERENCE_FOUND" else "warning"

                alerts.append({
                    "level": severity,
                    "title": f"Conciliação Bancária - {row['bank_name']}",
                    "message": (
                        f"Conciliação de {row['bank_name']} ref. {self.format_date(ref_date)} "
                        f"está com status '{row['status']}'\n"
                        f"Transações: {row['transaction_count']} | "
                        f"Conferidas: {row['matched_count']} | "
                        f"Diferenças: {row['difference_count']}\n"
                        f"Valor total diferença: {self.format_currency(row.get('total_difference_amount', 0))}"
                    ),
                })
                findings.append({
                    "type": "reconciliation_issue",
                    "bank": row["bank_name"],
                    "reference_date": str(ref_date),
                    "status": row["status"],
                    "differences": row["difference_count"],
                    "difference_amount": float(row.get("total_difference_amount", 0)),
                    "severity": severity,
                })
                if row["status"] == "PENDING":
                    recommendations.append(
                        f"Completar conciliação de {row['bank_name']} - {self.format_date(ref_date)}"
                    )

            self.log.info(f"  ├─ Conciliação: {len(rows)} pendentes")
        except Exception as e:
            self.log.debug(f"Reconciliation check not available: {e}")
            pass

        return findings, alerts, recommendations

    # ── Cashflow Projection ──────────────────────────────────

    def _check_cashflow_projection(self) -> Tuple[List, List, List]:
        """Check cashflow projection for the next 30 days."""
        findings = []
        alerts = []
        recommendations = []

        try:
            # Receivables in next 30 days
            receivable = self.execute_scalar("""
                SELECT COALESCE(SUM(amount - COALESCE(amount_paid, 0)), 0)
                FROM accounts_receivable
                WHERE status = 'PENDING'
                  AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
            """)

            # Already overdue
            overdue = self.execute_scalar("""
                SELECT COALESCE(SUM(amount - COALESCE(amount_paid, 0)), 0)
                FROM accounts_receivable
                WHERE status = 'PENDING'
                  AND due_date < CURRENT_DATE
            """)

            if receivable is not None and overdue is not None:
                findings.append({
                    "type": "cashflow_projection",
                    "receivable_30d": float(receivable),
                    "overdue": float(overdue),
                    "severity": "info",
                })

                if overdue and float(overdue) > 0:
                    recommendations.append(
                        f"Total em atraso de R$ {float(overdue):.2f} - acionar cobrança dos clientes"
                    )

                self.log.info(f"  ├─ Fluxo de Caixa: R$ {float(receivable):.2f} a receber em 30d, "
                             f"R$ {float(overdue):.2f} em atraso")
        except Exception as e:
            self.log.error(f"Error checking cashflow: {e}")

        return findings, alerts, recommendations

    # ── Metrics ───────────────────────────────────────────────

    def _calculate_metrics(self) -> Dict[str, Any]:
        """Calculate overall Financeiro module metrics."""
        metrics = {}
        try:
            metrics["total_receivable"] = self.execute_scalar(
                "SELECT COUNT(*) FROM accounts_receivable"
            )
            metrics["overdue_count"] = self.execute_scalar(
                "SELECT COUNT(*) FROM accounts_receivable WHERE status = 'PENDING' AND due_date < CURRENT_DATE"
            )
            metrics["total_overdue_amount"] = self.execute_scalar("""
                SELECT COALESCE(SUM(amount - COALESCE(amount_paid, 0)), 0)
                FROM accounts_receivable
                WHERE status = 'PENDING' AND due_date < CURRENT_DATE
            """) or 0.0
            metrics["paid_this_month"] = self.execute_scalar("""
                SELECT COUNT(*) FROM accounts_receivable
                WHERE status = 'PAID'
                  AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)
            """)
            metrics["total_paid_amount"] = self.execute_scalar("""
                SELECT COALESCE(SUM(amount), 0)
                FROM accounts_receivable
                WHERE status = 'PAID'
                  AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)
            """) or 0.0
        except Exception as e:
            self.log.error(f"Error calculating metrics: {e}")
        return metrics

    # ── Summary ───────────────────────────────────────────────

    def get_summary(self) -> str:
        """Return a human-readable summary of Financeiro module status."""
        metrics = self._calculate_metrics()
        return (
            f"💰 Financeiro Module Status:\n"
            f"  • Total Contas: {metrics.get('total_receivable', 'N/A')}\n"
            f"  • Vencidas: {metrics.get('overdue_count', 'N/A')}\n"
            f"  • Total em Atraso: {self.format_currency(metrics.get('total_overdue_amount', 0))}\n"
            f"  • Pagas no Mês: {metrics.get('paid_this_month', 'N/A')}\n"
            f"  • Total Recebido: {self.format_currency(metrics.get('total_paid_amount', 0))}"
        )
