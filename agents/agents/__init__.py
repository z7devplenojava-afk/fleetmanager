"""FleetManager Module Agents"""
from agents.agent_rh import RHAgent
from agents.agent_ponto import PontoAgent
from agents.agent_financeiro import FinanceiroAgent
from agents.agent_documentos import DocumentosAgent

# Registry of all available agents
AVAILABLE_AGENTS = {
    "rh": RHAgent,
    "ponto": PontoAgent,
    "financeiro": FinanceiroAgent,
    "documentos": DocumentosAgent,
}

__all__ = [
    "RHAgent",
    "PontoAgent",
    "FinanceiroAgent",
    "DocumentosAgent",
    "AVAILABLE_AGENTS",
]
