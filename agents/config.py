"""
FleetManager Agent System - Configuration Module
================================================
Central configuration loaded from environment variables and .env file.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from dataclasses import dataclass, field
from typing import Optional

# Load .env file from the agents directory
AGENTS_DIR = Path(__file__).parent
ENV_FILE = AGENTS_DIR / '.env'
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
else:
    # Try parent .env
    parent_env = AGENTS_DIR.parent / '.env'
    if parent_env.exists():
        load_dotenv(parent_env)


def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


# ──────────────────────────────────────────────
# Database Configuration
# ──────────────────────────────────────────────
@dataclass
class DatabaseConfig:
    url: str = field(default_factory=lambda: _env("DATABASE_URL",
        f"postgresql://{_env('DB_USER', 'postgres')}:{_env('DB_PASSWORD', 'postgres')}"
        f"@{_env('DB_HOST', 'localhost')}:{_env('DB_PORT', '5432')}/{_env('DB_NAME', 'fleetmanager')}"))
    host: str = field(default_factory=lambda: _env("DB_HOST", "localhost"))
    port: int = field(default_factory=lambda: int(_env("DB_PORT", "5432")))
    name: str = field(default_factory=lambda: _env("DB_NAME", "fleetmanager"))
    user: str = field(default_factory=lambda: _env("DB_USER", "postgres"))
    password: str = field(default_factory=lambda: _env("DB_PASSWORD", "postgres"))


# ──────────────────────────────────────────────
# RAG (Vector Database) Configuration
# ──────────────────────────────────────────────
@dataclass
class RAGConfig:
    persist_dir: str = field(default_factory=lambda: _env("RAG_PERSIST_DIR",
        str(AGENTS_DIR / "data" / "chromadb")))
    collection_name: str = field(default_factory=lambda: _env("RAG_COLLECTION_NAME",
        "fleetmanager_knowledge"))
    embedding_model: str = field(default_factory=lambda: _env("EMBEDDING_MODEL",
        "all-MiniLM-L6-v2"))


# ──────────────────────────────────────────────
# Notification Configuration
# ──────────────────────────────────────────────
@dataclass
class NotificationConfig:
    email_enabled: bool = field(default_factory=lambda: _env("NOTIFICATION_EMAIL_ENABLED", "false").lower() == "true")
    email_smtp: str = field(default_factory=lambda: _env("NOTIFICATION_EMAIL_SMTP", "smtp.gmail.com"))
    email_port: int = field(default_factory=lambda: int(_env("NOTIFICATION_EMAIL_PORT", "587")))
    email_user: str = field(default_factory=lambda: _env("NOTIFICATION_EMAIL_USER", ""))
    email_password: str = field(default_factory=lambda: _env("NOTIFICATION_EMAIL_PASSWORD", ""))

    webhook_enabled: bool = field(default_factory=lambda: _env("NOTIFICATION_WEBHOOK_ENABLED", "false").lower() == "true")
    webhook_url: str = field(default_factory=lambda: _env("NOTIFICATION_WEBHOOK_URL", ""))

    slack_enabled: bool = field(default_factory=lambda: _env("NOTIFICATION_SLACK_ENABLED", "false").lower() == "true")
    slack_webhook_url: str = field(default_factory=lambda: _env("NOTIFICATION_SLACK_WEBHOOK_URL", ""))

    whatsapp_api_url: str = field(default_factory=lambda: _env("WHATSAPP_API_URL",
        "http://localhost:8080/api/whatsapp"))
    whatsapp_api_key: str = field(default_factory=lambda: _env("WHATSAPP_API_KEY", ""))


# ──────────────────────────────────────────────
# Scheduler Configuration
# ──────────────────────────────────────────────
@dataclass
class SchedulerConfig:
    check_interval_hours: int = field(default_factory=lambda: int(_env("SCHEDULER_CHECK_INTERVAL_HOURS", "6")))
    rh_check_time: str = field(default_factory=lambda: _env("SCHEDULER_RH_CHECK_TIME", "06:00"))
    ponto_check_time: str = field(default_factory=lambda: _env("SCHEDULER_PONTO_CHECK_TIME", "08:00"))
    financeiro_check_time: str = field(default_factory=lambda: _env("SCHEDULER_FINANCEIRO_CHECK_TIME", "09:00"))
    documentos_check_time: str = field(default_factory=lambda: _env("SCHEDULER_DOCUMENTOS_CHECK_TIME", "10:00"))


# ──────────────────────────────────────────────
# LLM Configuration (optional)
# ──────────────────────────────────────────────
@dataclass
class LLMConfig:
    provider: str = field(default_factory=lambda: _env("LLM_PROVIDER", "openai"))
    api_key: str = field(default_factory=lambda: _env("LLM_API_KEY", ""))
    model: str = field(default_factory=lambda: _env("LLM_MODEL", "gpt-4o-mini"))


# ──────────────────────────────────────────────
# Agent General Configuration
# ──────────────────────────────────────────────
@dataclass
class AgentConfig:
    log_level: str = field(default_factory=lambda: _env("AGENT_LOG_LEVEL", "INFO"))
    log_dir: str = field(default_factory=lambda: _env("AGENT_LOG_DIR", str(AGENTS_DIR / "logs")))

    db: DatabaseConfig = field(default_factory=DatabaseConfig)
    rag: RAGConfig = field(default_factory=RAGConfig)
    notification: NotificationConfig = field(default_factory=NotificationConfig)
    scheduler: SchedulerConfig = field(default_factory=SchedulerConfig)
    llm: LLMConfig = field(default_factory=LLMConfig)


# ──────────────────────────────────────────────
# Singleton Configuration Instance
# ──────────────────────────────────────────────
config: AgentConfig = AgentConfig()
