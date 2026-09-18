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
}

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
      return {
        content: data,
        totalElements: data.length,
        totalPages: 1,
        size: data.length,
        number: 0,
        first: true,
        last: true,
      } as ClientPage;
    }
    return data as ClientPage;
  },
  // Buscar todos os clientes
  async getAllClients(): Promise<Client[]> {
    try {
      const response = await api.get('/api/clients/all');
      return response.data;
    } catch (error: any) {
      if (isConnectionError(error)) {
        console.warn('⚠️ Backend não está disponível. Retornando array vazio para clientes.');
        return [];
      }
      console.error('Erro ao buscar clientes:', error);
      throw new Error('Falha ao buscar clientes');
    }
  },

  // Buscar clientes para seleção
  async getClientsForSelect(): Promise<Client[]> {
    try {
      const response = await api.get('/api/clients/select');
      return response.data;
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