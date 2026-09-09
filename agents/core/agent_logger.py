"""
FleetManager Agent System - Logger Module
=========================================
Provides structured logging for all agents with file rotation.
"""

import sys
from pathlib import Path
from loguru import logger
from config import config


class AgentLogger:
    """Centralized logging for agents with context enrichment."""

    _initialized = False

    @classmethod
    def setup(cls, module_name: str = "agents") -> None:
        """Configure loguru with file rotation and structured format."""
        if cls._initialized:
            return

        log_dir = Path(config.log_dir)
        log_dir.mkdir(parents=True, exist_ok=True)

        # Remove default handler
        logger.remove()

        # Add console handler with colors
        log_format = (
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{extra[agent]: <15}</cyan> | "
            "<level>{message}</level>"
        )

        logger.add(
            sys.stdout,
            format=log_format,
            level=config.log_level,
            colorize=True,
        )

        # Add file handler with rotation
        logger.add(
            log_dir / "fleetmanager_{time:YYYY-MM-DD}.log",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {extra[agent]: <15} | {message}",
            level="DEBUG",
            rotation="10 MB",
            retention="30 days",
            compression="gz",
            enqueue=True,
        )

        # Add error-specific file
        logger.add(
            log_dir / "errors_{time:YYYY-MM-DD}.log",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {extra[agent]: <15} | {message}",
            level="ERROR",
            rotation="10 MB",
            retention="90 days",
            compression="gz",
            enqueue=True,
        )

        cls._initialized = True

    @classmethod
    def get_logger(cls, agent_name: str = "system"):
        """Get a contextualized logger for a specific agent."""
        cls.setup()
        return logger.bind(agent=agent_name)


# Singleton instance
agent_logger = AgentLogger()
log = agent_logger.get_logger("system")
