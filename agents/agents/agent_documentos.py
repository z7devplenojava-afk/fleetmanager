"""
FleetManager Agent System - Documentos Agent
=============================================
Responsibilities:
- Monitor document processing pipelines (OCR, unification)
- Validate document integrity (checksums, file sizes)
- Track payslip delivery via WhatsApp/Email
- Detect orphaned or unlinked documents
- Alert about processing failures
- Monitor document expiration dates
"""

from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional, Tuple

from core.base_agent import BaseAgent, AgentReport


class DocumentosAgent(BaseAgent):
    """Agente de Documentos - Monitora processamento, unificação e entrega."""

    def __init__(self):
        super().__init__(
            name="Documentos",
            module="documentos",
            description="Gestão de Documentos - Unificação, OCR, Holerites e Entregas",
        )

    def run_check(self) -> AgentReport:
        """Execute complete Documentos module check."""
        self.log.info("🔍 Iniciando verificação completa do módulo Documentos...")

        all_findings = []
        all_alerts = []
        all_recommendations = []

        # Run sub-checks
        findings_payslips, alerts_payslips, recs_payslips = self._check_payslip_delivery()
        findings_unified, alerts_unified, recs_unified = self._check_unified_documents()
        findings_orphan, alerts_orphan, recs_orphan = self._check_orphan_documents()
        findings_jobs, alerts_jobs, recs_jobs = self._check_processing_jobs()

        all_findings.extend(findings_payslips + findings_unified + findings_orphan + findings_jobs)
        all_alerts.extend(alerts_payslips + alerts_unified + alerts_orphan + alerts_jobs)
        all_recommendations.extend(recs_payslips + recs_unified + recs_orphan + recs_jobs)

        metrics = self._calculate_metrics()
        status = "OK"
        if any(a.get("level") == "critical" for a in all_alerts):
            status = "CRITICAL"
        elif any(a.get("level") == "warning" for a in all_alerts):
            status = "WARNING"

        summary = (
            f"Documentos Check: {metrics.get('total_documents', 0)} documentos | "
            f"{metrics.get('pending_payslips', 0)} holerites pendentes | "
            f"{metrics.get('failed_jobs', 0)} processamentos com erro | "
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
        self.log.info(f"✅ Documentos Check concluído - Status: {status}")
        return report

    # ── Payslip Delivery ──────────────────────────────────────

    def _check_payslip_delivery(self) -> Tuple[List, List, List]:
        """Check payslip delivery status for the current month."""
        findings = []
        alerts = []
        recommendations = []
        today = date.today()

        try:
            # Get current month
            current_month = today.month
            current_year = today.year

            # Pending payslips (processed but not sent)
            rows = self.execute_query("""
                SELECT
                    p.id, p.employee_name, p.cpf,
                    p.month, p.year, p.processed_at,
                    pdl.id IS NOT NULL AS was_sent,
                    pdl.channel, pdl.status AS delivery_status,
                    pdl.sent_at
                FROM payslips p
                LEFT JOIN payslip_delivery_log pdl
                    ON pdl.payslip_id = p.id
                    AND pdl.sent_at >= DATE_TRUNC('month', CURRENT_DATE)
                WHERE p.month = :month AND p.year = :year
                ORDER BY p.employee_name ASC
            """, {"month": str(current_month).zfill(2), "year": str(current_year)})

            sent_count = sum(1 for r in rows if r["was_sent"])
            pending_count = len(rows) - sent_count

            if pending_count > 0:
                # Check if we're past the 5th business day
                is_late = today.day > 5  # Approximate business day check
                level = "critical" if is_late else "warning"

                pending_names = [r["employee_name"] for r in rows if not r["was_sent"]]

                alerts.append({
                    "level": level,
                    "title": f"Holerites não Enviados - {current_month}/{current_year}",
                    "message": (
                        f"{pending_count} holerite(s) do mês {current_month}/{current_year} "
                        f"ainda não foram enviados. "
                        f"Total: {len(rows)} | Enviados: {sent_count} | Pendentes: {pending_count}\n"
                        f"Funcionários: {', '.join(pending_names[:10])}"
                        f"{'...' if len(pending_names) > 10 else ''}"
                    ),
                })
                findings.append({
                    "type": "payslip_pending_delivery",
                    "month": current_month,
                    "year": current_year,
                    "total": len(rows),
                    "sent": sent_count,
                    "pending": pending_count,
                    "severity": level,
                })
                recommendations.append(
                    f"Processar envio de {pending_count} holerite(s) pendentes do mês {current_month}/{current_year}"
                )

            self.log.info(f"  ├─ Holerites: {len(rows)} processados, {pending_count} pendentes envio")
        except Exception as e:
            self.log.error(f"Error checking payslips: {e}")

        return findings, alerts, recommendations

    # ── Unified Documents ─────────────────────────────────────

    def _check_unified_documents(self) -> Tuple[List, List, List]:
        """Check unified documents for processing errors."""
        findings = []
        alerts = []
        recommendations = []

        try:
            # Documents with error status
            rows = self.execute_query("""
                SELECT ud.id, ud.file_name, ud.document_type,
                       ud.employee_name, ud.cpf, ud.reference_month,
                       ud.status, ud.created_at,
                       ud.file_size
                FROM unified_documents ud
                WHERE ud.status = 'ERROR'
                ORDER BY ud.created_at DESC
                LIMIT 20
            """)

            for row in rows:
                created = row["created_at"]
                alerts.append({
                    "level": "critical" if row["document_type"] in ("HOLERITE", "CONTRATO") else "warning",
                    "title": f"Documento com Erro - {row.get('file_name', 'N/A')}",
                    "message": (
                        f"Documento {row.get('file_name', 'N/A')} falhou no processamento. "
                        f"Tipo: {row.get('document_type', 'N/A')} | "
                        f"Funcionário: {row.get('employee_name', 'N/A')} | "
                        f"Referência: {row.get('reference_month', 'N/A')} | "
                        f"Criado: {created}"
                    ),
                })
                findings.append({
                    "type": "document_processing_error",
                    "file_name": row.get("file_name"),
                    "document_type": row.get("document_type"),
                    "employee": row.get("employee_name"),
                    "severity": "critical" if row["document_type"] in ("HOLERITE", "CONTRATO") else "warning",
                })
                recommendations.append(
                    f"Reprocessar documento {row.get('file_name', 'N/A')} - falha no processamento"
                )

            self.log.info(f"  ├─ Documentos Unificados: {len(rows)} com erro")
        except Exception as e:
            self.log.error(f"Error checking unified documents: {e}")

        return findings, alerts, recommendations

    # ── Orphan Documents ──────────────────────────────────────

    def _check_orphan_documents(self) -> Tuple[List, List, List]:
        """Find documents not linked to any employee."""
        findings = []
        alerts = []
        recommendations = []

        try:
            # Unified documents without employee
            rows = self.execute_query("""
                SELECT ud.id, ud.file_name, ud.document_type,
                       ud.employee_name, ud.cpf, ud.created_at
                FROM unified_documents ud
                WHERE ud.employee_id IS NULL
                   OR ud.employee_name IS NULL
                   OR ud.cpf IS NULL
                ORDER BY ud.created_at DESC
                LIMIT 20
            """)

            if rows:
                alerts.append({
                    "level": "warning",
                    "title": f"Documentos Órfãos",
                    "message": (
                        f"{len(rows)} documento(s) sem vínculo com funcionário. "
                        f"Exemplos: {', '.join(r.get('file_name', 'N/A') for r in rows[:5])}"
                    ),
                })
                findings.append({
                    "type": "orphan_documents",
                    "count": len(rows),
                    "documents": [r.get("file_name", "N/A") for r in rows],
                    "severity": "warning",
                })
                recommendations.append(
                    f"Vincular {len(rows)} documento(s) órfão(s) aos funcionários correspondentes"
                )

            self.log.info(f"  ├─ Documentos Órfãos: {len(rows)} encontrados")
        except Exception as e:
            self.log.error(f"Error checking orphan documents: {e}")

        return findings, alerts, recommendations

    # ── Processing Jobs ───────────────────────────────────────

    def _check_processing_jobs(self) -> Tuple[List, List, List]:
        """Check document processing jobs for failures or stalls."""
        findings = []
        alerts = []
        recommendations = []

        try:
            # Failed or stalled processing jobs
            rows = self.execute_query("""
                SELECT d.id, d.type, d.status, d.created_at, d.updated_at,
                       d.error_message, d.employee_name, d.file_name
                FROM document_processing_jobs d
                WHERE d.status = 'FAILED'
                   OR (d.status = 'PROCESSING'
                       AND d.updated_at < CURRENT_TIMESTAMP - INTERVAL '1 hour')
                ORDER BY d.updated_at DESC
                LIMIT 20
            """)

            for row in rows:
                is_stalled = row["status"] == "PROCESSING"
                level = "critical" if is_stalled else "warning"

                alerts.append({
                    "level": level,
                    "title": f"Job de Processamento - {row.get('type', 'N/A')}",
                    "message": (
                        f"Job {row.get('type', 'N/A')} está com status '{row['status']}'. "
                        f"Arquivo: {row.get('file_name', 'N/A')} | "
                        f"Funcionário: {row.get('employee_name', 'N/A')} | "
                        f"Erro: {row.get('error_message', 'Job travado')}"
                    ),
                })
                findings.append({
                    "type": "processing_job_issue",
                    "job_type": row.get("type"),
                    "status": row["status"],
                    "file_name": row.get("file_name"),
                    "error": row.get("error_message"),
                    "severity": level,
                })

                if is_stalled:
                    recommendations.append(
                        f"Reiniciar job de processamento travado: {row.get('id', 'N/A')}"
                    )

            self.log.info(f"  ├─ Jobs: {len(rows)} com problemas")
        except Exception as e:
            self.log.debug(f"Processing jobs check not available: {e}")
            pass

        return findings, alerts, recommendations

    # ── Metrics ───────────────────────────────────────────────

    def _calculate_metrics(self) -> Dict[str, Any]:
        """Calculate overall Documentos module metrics."""
        metrics = {}
        try:
            metrics["total_documents"] = self.execute_scalar(
                "SELECT COUNT(*) FROM unified_documents"
            )
            metrics["error_documents"] = self.execute_scalar(
                "SELECT COUNT(*) FROM unified_documents WHERE status = 'ERROR'"
            )
            metrics["pending_payslips"] = self.execute_scalar(
                "SELECT COUNT(*) FROM payslips p "
                "WHERE NOT EXISTS (SELECT 1 FROM payslip_delivery_log pdl "
                "WHERE pdl.payslip_id = p.id AND pdl.sent_at >= DATE_TRUNC('month', CURRENT_DATE))"
            )
            metrics["orphan_documents"] = self.execute_scalar(
                "SELECT COUNT(*) FROM unified_documents WHERE employee_id IS NULL"
            )
            metrics["failed_jobs"] = self.execute_scalar(
                "SELECT COUNT(*) FROM document_processing_jobs WHERE status = 'FAILED'"
            )
        except Exception as e:
            self.log.error(f"Error calculating metrics: {e}")
        return metrics

    # ── Summary ───────────────────────────────────────────────

    def get_summary(self) -> str:
        """Return a human-readable summary of Documentos module status."""
        metrics = self._calculate_metrics()
        return (
            f"📄 Documentos Module Status:\n"
            f"  • Total Documentos: {metrics.get('total_documents', 'N/A')}\n"
            f"  • Com Erro: {metrics.get('error_documents', 'N/A')}\n"
            f"  • Holerites Pendentes: {metrics.get('pending_payslips', 'N/A')}\n"
            f"  • Documentos Órfãos: {metrics.get('orphan_documents', 'N/A')}\n"
            f"  • Jobs com Falha: {metrics.get('failed_jobs', 'N/A')}"
        )
