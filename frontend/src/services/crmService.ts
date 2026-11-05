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

// Status do Kanban
export async function fetchKanbanStatuses(): Promise<any[]> {
  try {
    const { data } = await api.get('/api/kanban-status');
    return data;
  } catch {
    const { data } = await api.get('/kanban-status');
    return data;
  }
}

export async function createKanbanStatus(status: any): Promise<any> {
  try {
    const { data } = await api.post('/api/kanban-status', status);
    return data;
  } catch {
    const { data } = await api.post('/kanban-status', status);
    return data;
  }
}

export async function updateKanbanStatus(id: string, status: any): Promise<any> {
  try {
    const { data } = await api.put(`/api/kanban-status/${id}`, status);
    return data;
  } catch {
    const { data } = await api.put(`/kanban-status/${id}`, status);
    return data;
  }
}

export async function deleteKanbanStatus(id: string): Promise<void> {
  try {
    await api.delete(`/api/kanban-status/${id}`);
  } catch {
    await api.delete(`/kanban-status/${id}`);
  }
}

// Tarefas
export async function fetchTasks(): Promise<any[]> {
  try {
    const { data } = await api.get('/api/tasks');
    return data;
  } catch {
    const { data } = await api.get('/tasks');
    return data;
  }
}

export async function createTask(task: any): Promise<any> {
  try {
    const { data } = await api.post('/api/tasks', task);
    return data;
  } catch {
    const { data } = await api.post('/tasks', task);
    return data;
  }
}

export async function updateTask(id: string, task: any): Promise<any> {
  const { data } = await api.put(`/api/tasks/${id}`, task);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/api/tasks/${id}`);
}

// Histórico de Interações
export async function fetchInteractionHistory(): Promise<any[]> {
  try {
    const { data } = await api.get('/api/interaction-history');
    return data;
  } catch {
    const { data } = await api.get('/interaction-history');
    return data;
  }
}

export async function createInteractionHistory(history: any): Promise<any> {
  try {
    const { data } = await api.post('/api/interaction-history', history);
    return data;
  } catch {
    const { data } = await api.post('/interaction-history', history);
    return data;
  }
}

export async function updateInteractionHistory(id: string, history: any): Promise<any> {
  const { data } = await api.put(`/api/interaction-history/${id}`, history);
  return data;
}

export async function deleteInteractionHistory(id: string): Promise<void> {
  await api.delete(`/api/interaction-history/${id}`);
}

// Busca e Filtros
export async function searchOpportunities(query: string): Promise<any> {
  const { data } = await api.get(`/api/opportunities/search?q=${encodeURIComponent(query)}`);
  return data;
}

export async function filterOpportunities(filters: any): Promise<any> {
  try {
    const { data } = await api.get('/api/opportunities/filter', { params: filters });
    return data;
  } catch {
    const { data } = await api.get('/opportunities/filter', { params: filters });
    return data;
  }
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
