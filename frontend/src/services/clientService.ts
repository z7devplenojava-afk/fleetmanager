import axios from '@/lib/axios';
import { Client, ClientPage, ClientSearchParams } from '@/types/client';

const BASE_URL = '/clients';

export const clientService = {
  /**
   * Lista todos os clientes ativos (para selects, etc.)
   */
  async getAllClients(): Promise<Client[]> {
    const response = await axios.get(`${BASE_URL}/select`);
    return response.data;
  },

  /**
   * Busca clientes com paginação, filtro e busca
   */
  async getClients(params: ClientSearchParams = {}): Promise<ClientPage> {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.status) queryParams.append('status', params.status);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);

    const response = await axios.get(`${BASE_URL}?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Busca cliente por ID
   */
  async getClientById(id: string): Promise<Client> {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Busca cliente com suas unidades
   */
  async getClientWithUnits(id: string): Promise<Client> {
    const response = await axios.get(`${BASE_URL}/${id}/units`);
    return response.data;
  },

  /**
   * Cria um novo cliente
   */
  async createClient(clientData: any): Promise<Client> {
    const response = await axios.post(BASE_URL, clientData);
    return response.data;
  },

  /**
   * Atualiza um cliente existente
   */
  async updateClient(id: string, clientData: any): Promise<Client> {
    const response = await axios.put(`${BASE_URL}/${id}`, clientData);
    return response.data;
  },

  /**
   * Exclui um cliente
   */
  async deleteClient(id: string): Promise<void> {
    await axios.delete(`${BASE_URL}/${id}`);
  },
};

export default clientService;