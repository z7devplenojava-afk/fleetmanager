import api from '@/lib/axios';

// Oportunidades
export async function fetchOpportunities() {
  const { data } = await api.get('/opportunities');
  return data;
}

export async function createOpportunity(opportunity) {
  const { data } = await api.post('/opportunities', opportunity);
  return data;
}

export async function updateOpportunity(id, opportunity) {
  const { data } = await api.put(`/api/opportunities/${id}`, opportunity);
  return data;
}

export async function deleteOpportunity(id) {
  await api.delete(`/api/opportunities/${id}`);
}

// Status do Kanban
export async function fetchKanbanStatuses() {
  const { data } = await api.get('/kanban-status');
  return data;
}

export async function createKanbanStatus(status) {
  const { data } = await api.post('/kanban-status', status);
  return data;
}

export async function updateKanbanStatus(id, status) {
  const { data } = await api.put(`/api/kanban-status/${id}`, status);
  return data;
}

export async function deleteKanbanStatus(id) {
  await api.delete(`/api/kanban-status/${id}`);
}

// Tarefas
export async function fetchTasks() {
  const { data } = await api.get('/tasks');
  return data;
}

export async function createTask(task) {
  const { data } = await api.post('/tasks', task);
  return data;
}

export async function updateTask(id, task) {
  const { data } = await api.put(`/api/tasks/${id}`, task);
  return data;
}

export async function deleteTask(id) {
  await api.delete(`/api/tasks/${id}`);
}

// Histórico de Interações
export async function fetchInteractionHistory() {
  const { data } = await api.get('/interaction-history');
  return data;
}

export async function createInteractionHistory(history) {
  const { data } = await api.post('/interaction-history', history);
  return data;
}

export async function updateInteractionHistory(id, history) {
  const { data } = await api.put(`/api/interaction-history/${id}`, history);
  return data;
}

export async function deleteInteractionHistory(id) {
  await api.delete(`/api/interaction-history/${id}`);
}

// Busca e Filtros
export async function searchOpportunities(query) {
  const { data } = await api.get(`/api/opportunities/search?q=${encodeURIComponent(query)}`);
  return data;
}

export async function filterOpportunities(filters) {
  const { data } = await api.get('/opportunities/filter', { params: filters });
  return data;
}

// Resumo Kanban para o dashboard do CRM
export async function fetchKanbanSummary() {
  const { data } = await api.get('/crm/dashboard/kanban-summary');
  return data;
}

// Métricas e gráficos do dashboard CRM
export async function fetchCrmMetrics() {
  const { data } = await api.get('/crm/dashboard/metrics');
  return data;
} 