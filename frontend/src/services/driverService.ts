import api from '@/lib/axios';
import { Driver } from '@/types/driver';

export type { Driver };

export interface CreateDriverDTO {
  name: string;
  licenseNumber?: string;
  phone?: string;
  status?: 'ATIVO' | 'INATIVO';
}

const driverService = {
  async getDrivers(): Promise<Driver[]> {
    const response = await api.get('/api/drivers');
    return response.data;
  },

  async getDriver(id: string): Promise<Driver> {
    const response = await api.get(`/api/drivers/${id}`);
    return response.data;
  },

  async createDriver(data: CreateDriverDTO): Promise<Driver> {
    const response = await api.post('/api/drivers', data);
    return response.data;
  },

  async updateDriver(id: string, data: CreateDriverDTO): Promise<Driver> {
    const response = await api.put(`/api/drivers/${id}`, data);
    return response.data;
  },

  async deactivateDriver(id: string): Promise<void> {
    await api.patch(`/api/drivers/${id}/deactivate`);
  },

  async deleteDriver(id: string): Promise<void> {
    console.log('🔗 driverService.deleteDriver - Iniciando exclusão do motorista ID:', id);
    try {
      const response = await api.delete(`/api/drivers/${id}`);
      console.log('✅ Resposta da exclusão recebida:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      // 204 No Content ou 200 OK são esperados para exclusão bem-sucedida
      if (response.status === 204 || response.status === 200 || !response.data) {
        console.log('✅ Exclusão confirmada pelo backend');
        return;
      }
      console.warn('⚠️ Status inesperado na resposta:', response.status);
    } catch (error: any) {
      console.error('❌ Erro no serviço de exclusão:', error);
      console.error('❌ Erro completo:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      // Se for erro 404, lançar com mensagem específica
      if (error.response?.status === 404) {
        throw new Error(error.response?.data?.message || 'Motorista não encontrado');
      }
      
      // Se for erro 500, verificar se há mensagem específica
      if (error.response?.status === 500) {
        throw new Error(error.response?.data?.message || 'Erro interno do servidor ao excluir motorista');
      }
      
      // Se não houver resposta (erro de rede), lançar erro de conexão
      if (!error.response) {
        throw new Error('Erro de conexão. Verifique se o backend está rodando.');
      }
      
      // Se for outro erro, lançar com a mensagem do backend
      throw new Error(error.response?.data?.message || error.message || 'Erro ao excluir motorista');
    }
  },
};

export default driverService; 