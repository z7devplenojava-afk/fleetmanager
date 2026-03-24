import api from '@/lib/axios';

export interface Location {
  id: string;
  name: string;
  description?: string;
  address: string;
  unitId?: string;
  unit?: {
    id: string;
    name: string;
    clientId?: string;
    clientName?: string;
  };
}

export const locationService = {
  /**
   * Busca todas as localizações
   */
  async getAllLocations(): Promise<Location[]> {
    try {
      console.log('🔗 locationService.getAllLocations - Fazendo requisição para /api/locations');
      const response = await api.get('/api/locations');
      console.log('✅ locationService.getAllLocations - Resposta recebida:', response.data);
      console.log('✅ locationService.getAllLocations - Tipo de dados:', Array.isArray(response.data) ? 'Array' : typeof response.data);
      console.log('✅ locationService.getAllLocations - Quantidade:', Array.isArray(response.data) ? response.data.length : 'N/A');
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.content)) {
        return response.data.content;
      } else {
        console.warn('⚠️ locationService.getAllLocations - Formato de resposta inesperado:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ locationService.getAllLocations - Erro:', error);
      console.error('❌ locationService.getAllLocations - Status:', error.response?.status);
      console.error('❌ locationService.getAllLocations - Data:', error.response?.data);
      console.error('❌ locationService.getAllLocations - Message:', error.message);
      throw error;
    }
  },

  /**
   * Busca uma localização por ID
   */
  async getLocationById(id: string): Promise<Location> {
    try {
      const response = await api.get(`/api/locations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      throw new Error('Falha ao buscar localização');
    }
  },

  /**
   * Busca localizações por unidade
   */
  async getLocationsByUnitId(unitId: string): Promise<Location[]> {
    try {
      const response = await api.get(`/api/locations/unit/${unitId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar localizações por unidade:', error);
      throw new Error('Falha ao buscar localizações por unidade');
    }
  },

  /**
   * Cria uma nova localização
   */
  async createLocation(data: Partial<Location>): Promise<Location> {
    try {
      const response = await api.post('/api/locations', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar localização:', error);
      throw error;
    }
  },

  /**
   * Atualiza uma localização
   */
  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    try {
      const response = await api.put(`/api/locations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      throw error;
    }
  },

  /**
   * Exclui uma localização
   */
  async deleteLocation(id: string): Promise<void> {
    try {
      await api.delete(`/api/locations/${id}`);
    } catch (error) {
      console.error('Erro ao excluir localização:', error);
      throw error;
    }
  }
};

export default locationService;

