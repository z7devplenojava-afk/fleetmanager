"""
FleetManager Agent System - Base Agent Module
==============================================
Abstract base class providing common functionality for all module agents:
- Database connection pooling
- Structured logging
- Notification dispatching
- RAG integration
- Scheduling
- Report generation
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path

import psycopg2
import psycopg2.extras
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from config import config
from core.agent_logger import agent_logger
from core.agent_notifier import AgentNotifier
from rag.rag_system import RAGSystem


@dataclass
class AgentReport:
    """Standard report structure returned by every agent check."""

    agent_name: str
    module: str
    timestamp: datetime = field(default_factory=datetime.now)
    status: str = "OK"  # OK, WARNING, CRITICAL, ERROR
    summary: str = ""
    findings: List[Dict[str, Any]] = field(default_factory=list)
    alerts: List[Dict[str, str]] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_name": self.agent_name,
            "module": self.module,
            "timestamp": self.timestamp.isoformat(),
            "status": self.status,
            "summary": self.summary,
            "findings": self.findings,
            "alerts": self.alerts,
            "recommendations": self.recommendations,
            "metrics": self.metrics,
        }


class BaseAgent(ABC):
    """Abstract base class for all FleetManager module agents."""

    def __init__(
        self,
        name: str,
        module: str,
        description: str = "",
    ):
        self.name = name
        self.module = module
        self.description = description

        # Initialize infrastructure
        self.log = agent_logger.get_logger(name)
        self.notifier = AgentNotifier(name)
        self.rag: Optional[RAGSystem] = None
        self._engine: Optional[Engine] = None

        self.log.info(f"🤖 Agent '{name}' initialized - Module: {module}")

    # ── Database Connection ───────────────────────────────────

    @property
    def engine(self) -> Engine:
        """Get or create SQLAlchemy engine with connection pooling."""
        if self._engine is None:
            db = config.db
            self._engine = create_engine(
                db.url,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 10},
            )
            self.log.debug(f"🔌 Database engine created: {db.host}/{db.name}")
        return self._engine

    def get_connection(self):
        """Get a raw psycopg2 connection (for complex queries)."""
        db = config.db
        conn = psycopg2.connect(
            host=db.host,
            port=db.port,
            dbname=db.name,
            user=db.user,
            password=db.password,
            connect_timeout=10,
        )
        conn.set_session(autocommit=False)
        return conn

    def execute_query(self, sql: str, params: Optional[Dict] = None) -> List[Dict]:
        """Execute a SQL query and return results as list of dicts."""
        with self.engine.connect() as conn:
            result = conn.execute(text(sql), params or {})
            columns = result.keys()
            return [dict(zip(columns, row)) for row in result.fetchall()]

    def execute_scalar(self, sql: str, params: Optional[Dict] = None) -> Any:
        """Execute a query returning a single scalar value."""
        with self.engine.connect() as conn:
            result = conn.execute(text(sql), params or {})
            row = result.fetchone()
            return row[0] if row else None

    # ── RAG Integration ───────────────────────────────────────

    def set_rag(self, rag_system: RAGSystem) -> None:
        """Attach the RAG system for contextual queries."""
        self.rag = rag_system
        self.log.debug("📚 RAG system attached")

    def query_knowledge(self, question: str, k: int = 3) -> List[str]:
        """Query the RAG knowledge base for context."""
        if self.rag is None:
            return []
        results = self.rag.query(question, k=k)
        return [doc["content"] for doc in results]

    # ── Abstract Methods ──────────────────────────────────────

    @abstractmethod
    def run_check(self) -> AgentReport:
        """Execute the main checking routine.
        Must return an AgentReport with findings, alerts, and recommendations.
        """
        ...

    @abstractmethod
    def get_summary(self) -> str:
        """Return a human-readable summary of the current module status."""
        ...

    # ── Report & Alerts ───────────────────────────────────────

    def create_report(
        self,
        status: str = "OK",
        summary: str = "",
        findings: Optional[List[Dict]] = None,
        alerts: Optional[List[Dict]] = None,
        recommendations: Optional[List[str]] = None,
        metrics: Optional[Dict] = None,
    ) -> AgentReport:
        """Create a structured report for this agent's findings."""
        report = AgentReport(
            agent_name=self.name,
            module=self.module,
            status=status,
            summary=summary,
            findings=findings or [],
            alerts=alerts or [],
            recommendations=recommendations or [],
            metrics=metrics or {},
        )
        return report

    def dispatch_alerts(self, report: AgentReport) -> None:
        """Dispatch alert notifications based on report findings."""
        for alert in report.alerts:
            level = alert.get("level", "info")
            title = alert.get("title", "Alerta do Sistema")
            message = alert.get("message", "")

            if level == "critical":
                self.notifier.critical(title, message, self.module)
            elif level == "warning":
                self.notifier.warning(title, message, self.module)
            elif level == "success":
                self.notifier.success(title, message, self.module)
            else:
                self.notifier.info(title, message, self.module)

    # ── Utility Helpers ───────────────────────────────────────

    def days_until(self, target_date) -> int:
        """Calculate days until a target date."""
        if target_date is None:
            return -1
        delta = target_date - datetime.now().date()
        return delta.days

    def format_currency(self, value) -> str:
        """Format a numeric value as Brazilian currency."""
        if value is None:
            return "R$ 0,00"
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    def format_date(self, dt) -> str:
        """Format a date to Brazilian format."""
        if dt is None:
            return "N/A"
        if isinstance(dt, str):
            from datetime import datetime as dt_cls
            dt = dt_cls.strptime(dt, "%Y-%m-%d")
        return dt.strftime("%d/%m/%Y")

    def __repr__(self) -> str:
        return f"<{self.name} Agent (module={self.module})>"
