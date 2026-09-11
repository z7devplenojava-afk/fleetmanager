#!/usr/bin/env python3
"""
FleetManager Agent System - Runner
==================================
Main entry point for running the FleetManager intelligent agents.

Usage:
    python run_agents.py --check all          # Run all agents
    python run_agents.py --check rh           # Run only RH agent
    python run_agents.py --help               # Show help
    python run_agents.py --schedule           # Start scheduled checks
    python run_agents.py --query "CNH expirada"  # Query RAG knowledge
"""

import sys
from pathlib import Path

# Add agents directory to path
sys.path.insert(0, str(Path(__file__).parent))

from orchestrator import main_cli


if __name__ == "__main__":
    main_cli()
