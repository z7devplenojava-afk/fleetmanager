import api from '@/lib/axios';
import { ClientPage, ClientSearchParams } from '@/types/client';
import { isConnectionError } from '@/utils/connectionError';

export interface Client {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  companyId?: string;
}

const filterClientsByTenant = (clients: Client[]): Client[] => {
  if (!Array.isArray(clients)) return [];
  const empresaRaw = typeof window !== 'undefined' ? localStorage.getItem('empresa') || '' : '';
  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') || '' : '';
  try {
    const emp = empresaRaw ? JSON.parse(empresaRaw) : null;
    const u = userRaw ? JSON.parse(userRaw) : null;
    const empId = emp?.id && emp.id !== 'none' ? String(emp.id) : (u?.companyId ? String(u.companyId) : '');
    const isSuperAdmin = u?.role === 'SUPER_ADMIN' || (Array.isArray(u?.roles) && u.roles.some((r: any) => (typeof r === 'string' ? r : r?.name) === 'SUPER_ADMIN'));

    // Se for SUPER_ADMIN sem empresa alvo selecionada, vê todos os clientes
    if (isSuperAdmin && (!empId || empId === 'none')) {
      return clients;
    }

    // Se há empresa ativa no contexto do usuário (inclusive para SUPER_ADMIN com empresa selecionada):
    if (empId) {
      const normalizedEmpId = empId.trim().toLowerCase();
      return clients.filter((c: any) => {
        const cId = c.companyId ? String(c.companyId).trim().toLowerCase() : '';
        if (cId) return cId === normalizedEmpId;
        return true;
      });
    }
  } catch (_) {}

  return clients;
};

export const clientService = {
  // Listar clientes paginados (com filtros opcionais)
  async getClients(params: ClientSearchParams = {}): Promise<ClientPage> {
    const query = new URLSearchParams();
    if (params.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params.status) query.append('status', params.status);
    if (params.page !== undefined) query.append('page', String(params.page));
    if (params.size !== undefined) query.append('size', String(params.size));
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortDir) query.append('sortDir', params.sortDir);

    const response = await api.get(`/api/clients?${query.toString()}`);
    const data = response.data;
    // Normalizar resposta (Page do backend ou array)
    if (Array.isArray(data)) {
      const filtered = filterClientsByTenant(data);
      return {
        content: filtered,
        totalElements: filtered.length,
        totalPages: 1,
        size: filtered.length,
        number: 0,
        first: true,
        last: true,
      } as ClientPage;
    }
    if (data && Array.isArray(data.content)) {
      return {
        ...data,
        content: filterClientsByTenant(data.content),
      };
    }
    return data as ClientPage;
  },
  // Buscar todos os clientes
  async getAllClients(): Promise<Client[]> {
    try {
      let result: Client[] = [];
      try {
        const response = await api.get('/api/clients/all');
        if (Array.isArray(response.data)) result = response.data;
        else if (Array.isArray(response.data?.content)) result = response.data.content;
      } catch (inner) {
        // Fallback para listagem padrão de clientes
        const fallback = await api.get('/api/clients?size=1000');
        if (Array.isArray(fallback.data)) result = fallback.data;
        else if (Array.isArray(fallback.data?.content)) result = fallback.data.content;
      }
      return filterClientsByTenant(result);
    } catch (error: any) {
      console.warn('⚠️ Não foi possível carregar lista de clientes:', error);
      return [];
    }
  },

  // Buscar clientes para seleção
  async getClientsForSelect(): Promise<Client[]> {
    try {
      const response = await api.get('/api/clients/select');
      const list = Array.isArray(response.data) ? response.data : [];
      return filterClientsByTenant(list);
    } catch (error: any) {
      if (isConnectionError(error)) {
        console.warn('⚠️ Backend não está disponível. Retornando array vazio para seleção de clientes.');
        return [];
      }
      console.error('Erro ao buscar clientes para seleção:', error);
      throw new Error('Falha ao buscar clientes para seleção');
    }
  },

  // Buscar cliente por ID
  async getClientById(id: string): Promise<Client> {
    try {
      const response = await api.get(`/api/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      throw new Error('Falha ao buscar cliente');
    }
  },

  // Criar cliente
  async createClient(data: any): Promise<Client> {
    console.log('[DEBUG] clientService.createClient - Dados recebidos:', data);
    try {
      const response = await api.post('/api/clients', data);
      console.log('[DEBUG] clientService.createClient - Resposta:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ERROR] clientService.createClient - Erro:', error);
      throw error;
    }
  },

  // Atualizar cliente
  async updateClient(id: string, data: any): Promise<Client> {
    const response = await api.put(`/api/clients/${id}`, data);
    return response.data;
  },

  // Excluir cliente
  async deleteClient(id: string): Promise<void> {
    await api.delete(`/api/clients/${id}`);
  },

  // Excluir múltiplos clientes em massa
  async deleteClientsBulk(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => api.delete(`/api/clients/${id}`)));
  },

  // Importar Quadro de Obras via Excel
  async importQuadroObras(file: File): Promise<{
    totalRows: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/clients/import/quadro-obras', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Disparar Mobilização Multissetorial para Novo Cliente / Contrato
  async triggerMobilization(data: {
    clientId?: string;
    clientName: string;
    contractNumber?: string;
    workPostCount?: number;
    vehicleCount?: number;
    headcount?: number;
    targetStartDate?: string;
    notes?: string;
    targetSectors?: string[];
  }): Promise<{ message: string; data: any }> {
    const response = await api.post('/api/clients/mobilization/trigger', data);
    return response.data;
  },
};

export default clientService;