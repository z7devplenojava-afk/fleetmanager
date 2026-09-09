"""
FleetManager Agent System - Central Orchestrator
=================================================
Orquestrador central que gerencia todos os agentes de módulo:
- Coordena a execução de verificações
- Agenda verificações periódicas
- Coleta e consolida relatórios
- Gerencia o sistema RAG
- Expõe API para consultas externas
"""

import sys
import json
from datetime import datetime, date
from typing import Any, Dict, List, Optional
from pathlib import Path

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from config import config
from core.agent_logger import AgentLogger
from core.agent_notifier import AgentNotifier
from core.base_agent import AgentReport
from rag.rag_system import RAGSystem


class Orchestrator:
    """Central orchestrator for the FleetManager Agent System.

    Manages all module agents, coordinates their execution,
    aggregates reports, and provides a unified interface.
    """

    def __init__(self):
        self.log = AgentLogger.get_logger("orchestrator")
        self.notifier = AgentNotifier("orchestrator")
        self.rag: Optional[RAGSystem] = None
        self.agents: Dict[str, Any] = {}
        self.last_reports: Dict[str, AgentReport] = {}

        self.log.info("🚀 FleetManager Agent Orchestrator initialized")

    # ── Initialization ────────────────────────────────────────

    def initialize(self, seed_rag: bool = True) -> None:
        """Initialize RAG system and load agents."""
        # Initialize RAG
        self.log.info("📚 Initializing RAG system...")
        self.rag = RAGSystem()

        if seed_rag and self.rag.count() == 0:
            self.log.info("🌱 Seeding RAG knowledge base...")
            count = self.rag.seed_knowledge_base()
            self.log.info(f"✅ RAG seeded with {count} documents")
        elif seed_rag:
            self.log.info(f"📚 RAG already has {self.rag.count()} documents")

        # Register agents
        self._register_agents()

        self.log.info(f"✅ Orchestrator ready with {len(self.agents)} agents")

    def _register_agents(self) -> None:
        """Discover and register all available module agents."""
        from agents import AVAILABLE_AGENTS

        for agent_key, agent_class in AVAILABLE_AGENTS.items():
            try:
                agent = agent_class()
                if self.rag:
                    agent.set_rag(self.rag)
                self.agents[agent_key] = agent
                self.log.info(f"  ✅ Registered agent: {agent.name} (key: {agent_key})")
            except Exception as e:
                self.log.error(f"  ❌ Failed to register agent '{agent_key}': {e}")

    # ── Agent Execution ──────────────────────────────────────

    def run_all_agents(self) -> Dict[str, AgentReport]:
        """Run all registered agents and collect reports."""
        self.log.info("🔄 Running all agents...")
        reports = {}

        for agent_key, agent in self.agents.items():
            try:
                self.log.info(f"  ▶ Running {agent.name} agent...")
                report = agent.run_check()
                reports[agent_key] = report
                self.last_reports[agent_key] = report
                self.log.info(f"  ✅ {agent.name} done - Status: {report.status}")
            except Exception as e:
                self.log.error(f"  ❌ {agent.name} failed: {e}")
                reports[agent_key] = AgentReport(
                    agent_name=agent.name,
                    module=agent.module,
                    status="ERROR",
                    summary=f"Execution error: {str(e)}",
                )

        self.log.info(f"✅ All agents executed ({len(reports)} reports)")
        return reports

    def run_agent(self, agent_key: str) -> Optional[AgentReport]:
        """Run a specific agent by key."""
        if agent_key not in self.agents:
            self.log.error(f"Agent '{agent_key}' not found")
            return None

        agent = self.agents[agent_key]
        try:
            self.log.info(f"▶ Running {agent.name} agent...")
            report = agent.run_check()
            self.last_reports[agent_key] = report
            return report
        except Exception as e:
            self.log.error(f"❌ {agent.name} failed: {e}")
            return AgentReport(
                agent_name=agent.name,
                module=agent.module,
                status="ERROR",
                summary=f"Execution error: {str(e)}",
            )

    def get_agent_summary(self, agent_key: str) -> str:
        """Get a human-readable summary from a specific agent."""
        if agent_key not in self.agents:
            return f"Agent '{agent_key}' não encontrado"
        return self.agents[agent_key].get_summary()

    # ── Reports ──────────────────────────────────────────────

    def get_consolidated_report(self) -> Dict[str, Any]:
        """Get a consolidated report from all agents."""
        reports = self.run_all_agents()
        return self._build_consolidated(reports)

    def get_last_reports(self) -> Dict[str, Any]:
        """Get last known reports without re-running checks."""
        return self._build_consolidated(self.last_reports)

    def _build_consolidated(self, reports: Dict[str, AgentReport]) -> Dict[str, Any]:
        """Build a consolidated JSON report from all agent reports."""
        alerts = []
        total_findings = 0
        agents_status = {}
        critical_count = 0
        warning_count = 0
        ok_count = 0

        for agent_key, report in reports.items():
            agents_status[agent_key] = report.status
            total_findings += len(report.findings)
            alerts.extend(report.alerts)

            if report.status == "CRITICAL":
                critical_count += 1
            elif report.status == "WARNING":
                warning_count += 1
            else:
                ok_count += 1

        return {
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_agents": len(reports),
                "status_ok": ok_count,
                "status_warning": warning_count,
                "status_critical": critical_count,
                "total_findings": total_findings,
                "total_alerts": len(alerts),
            },
            "agents": agents_status,
            "alerts": alerts,
            "reports": {
                key: r.to_dict() for key, r in reports.items()
            },
        }

    # ── RAG Query ────────────────────────────────────────────

    def query_knowledge(self, question: str, k: int = 5) -> List[Dict[str, Any]]:
        """Query the RAG knowledge base."""
        if self.rag is None:
            return []
        return self.rag.query(question, k=k)

    # ── System Info ──────────────────────────────────────────

    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status."""
        status = {
            "orchestrator": "running",
            "rag": "ok" if self.rag and self.rag.count() > 0 else "not_initialized",
            "rag_documents": self.rag.count() if self.rag else 0,
            "registered_agents": list(self.agents.keys()),
            "active_agents": len(self.agents),
            "last_check": datetime.now().isoformat(),
        }
        return status


# ── CLI Interface ──────────────────────────────────────────────

def main_cli():
    """Command-line interface for running the orchestrator."""
    import argparse

    parser = argparse.ArgumentParser(
        description="FleetManager Agent System - Central Orchestrator",
    )
    parser.add_argument(
        "--check", "-c",
        choices=["all", "rh", "ponto", "financeiro", "documentos"],
        default="all",
        help="Which agent(s) to run",
    )
    parser.add_argument(
        "--seed-rag", "-s",
        action="store_true",
        help="Force re-seed the RAG knowledge base",
    )
    parser.add_argument(
        "--report", "-r",
        action="store_true",
        help="Print consolidated JSON report",
    )
    parser.add_argument(
        "--query", "-q",
        type=str,
        help="Query the RAG knowledge base",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Print system status",
    )

    args = parser.parse_args()

    # Initialize orchestrator
    orch = Orchestrator()
    orch.initialize(seed_rag=args.seed_rag or args.check == "all")

    if args.status:
        # Status doesn't need RAG seeding
        orch.initialize(seed_rag=False)
        status = orch.get_system_status()
        print(json.dumps(status, indent=2, default=str))
        return

    if args.query:
        results = orch.query_knowledge(args.query)
        print(f"\nRAG Results for: '{args.query}'\n")
        for r in results:
            print(f"  • {r['content'][:200]}...")
            print(f"    (id: {r['id']}, distance: {r.get('distance', 0):.4f})\n")
        return

    if args.check == "all":
        reports = orch.run_all_agents()
    else:
        report = orch.run_agent(args.check)
        reports = {args.check: report} if report else {}

    # Print summaries
    print(f"\n{'='*60}")
    print(f"📋 FLEETMANAGER AGENT REPORT - {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print(f"{'='*60}\n")

    for agent_key, report in reports.items():
        if report is None:
            continue
        status_icon = {"OK": "✅", "WARNING": "🟡", "CRITICAL": "🔴", "ERROR": "❌"}.get(
            report.status, "❓"
        )
        print(f"{status_icon} [{report.agent_name}] {report.module.upper()}")
        print(f"   Status: {report.status}")
        print(f"   {report.summary}")
        if report.alerts:
            for alert in report.alerts[:5]:
                print(f"   • {alert['level']} {alert['title']}")
        if report.recommendations:
            for rec in report.recommendations[:3]:
                print(f"   → {rec}")
        print()

    if args.report:
        consolidated = orch._build_consolidated(reports)
        print(f"\n{'='*60}")
        print("📄 CONSOLIDATED JSON REPORT")
        print(f"{'='*60}\n")
        print(json.dumps(consolidated, indent=2, default=str))


if __name__ == "__main__":
    main_cli()
