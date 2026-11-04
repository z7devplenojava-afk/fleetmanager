import api from '@/lib/axios';
import { Opportunity, Lead } from '@/types/crm';

// Oportunidades do Kanban
export async function fetchOpportunities(): Promise<Opportunity[]> {
  const { data } = await api.get('/api/opportunities');
  return data;
}

export async function createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity> {
  const { data } = await api.post('/api/opportunities', opportunity);
  return data;
}

export async function updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
  const { data } = await api.put(`/api/opportunities/${id}`, updates);
  return data;
}

export async function updateOpportunityStage(id: string, stage: string, order?: number): Promise<Opportunity> {
  const { data } = await api.patch(`/api/opportunities/${id}/stage`, { stage, order });
  return data;
}

export async function deleteOpportunity(id: string): Promise<void> {
  await api.delete(`/api/opportunities/${id}`);
}

// Leads (se necessário para seleção)
export async function fetchLeads(): Promise<Lead[]> {
  const { data } = await api.get('/api/leads');
  return data;
}

// Resumo do Kanban (contadores por status de lead)
export async function fetchKanbanSummary() {
  try {
    const { data } = await api.get('/api/crm/dashboard/kanban-summary');
    return data;
  } catch (err) {
    console.warn('[crmService] Falha ao buscar kanban summary, fallback vazio:', err);
    return { summary: {} };
  }
}

// Métricas e gráficos do dashboard CRM
export async function fetchCrmMetrics() {
  try {
    const { data } = await api.get('/api/crm/dashboard/metrics');
    return data;
  } catch (err) {
    console.warn('[crmService] Falha ao buscar métricas do CRM, utilizando fallback:', err);
    return {
      totalLeads: 0,
      activeOpportunities: 0,
      totalProposals: 0,
      totalQuotes: 0,
      conversionRate: 0,
      estimatedRevenue: 0,
      totalValue: 0,
      monthlyCount: {},
      statusHistory: {}
    };
  }
}
