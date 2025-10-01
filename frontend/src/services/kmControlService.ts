import axios from '@/lib/axios';
import { KmControl } from '@/types/fleet';

export interface KmControlFilters {
  startDate?: string;
  endDate?: string;
  supervisor?: string;
  vehiclePlate?: string;
}

export interface KmControlStatistics {
  totalRecords: number;
  totalKm: number;
  totalValue: number;
}

class KmControlService {
  /**
   * Buscar todos os registros de controle de KM
   */
  async getKmControls(): Promise<KmControl[]> {
    try {
      console.log('🔍 KmControlService: Buscando registros de controle de KM...');
      const response = await axios.get('/api/frota/km-controls');
      console.log('✅ KmControlService: Resposta recebida:', response.data);
      console.log('📊 KmControlService: Total de registros:', response.data?.length || 0);
      
      // Debug detalhado do primeiro registro
      if (response.data && response.data.length > 0) {
        console.log('🔍 KmControlService: Primeiro registro:', response.data[0]);
        console.log('🔍 KmControlService: Campos do primeiro registro:', Object.keys(response.data[0]));
        console.log('🔍 KmControlService: totalKm do primeiro:', response.data[0].totalKm);
        console.log('🔍 KmControlService: initialKm do primeiro:', response.data[0].initialKm);
        console.log('🔍 KmControlService: finalKm do primeiro:', response.data[0].finalKm);
        console.log('🔍 KmControlService: date do primeiro:', response.data[0].date);
      }
      
      // Converter datas que vêm como array do backend
      const processedData = response.data.map(item => ({
        ...item,
        date: Array.isArray(item.date) 
          ? `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`
          : item.date,
        createdAt: Array.isArray(item.createdAt)
          ? new Date(item.createdAt[0], item.createdAt[1] - 1, item.createdAt[2]).toISOString()
          : item.createdAt,
        updatedAt: Array.isArray(item.updatedAt)
          ? new Date(item.updatedAt[0], item.updatedAt[1] - 1, item.updatedAt[2]).toISOString()
          : item.updatedAt
      }));
      
      console.log('🔧 KmControlService: Dados processados:', processedData[0]);
      return processedData;
    } catch (error) {
      console.error('❌ Erro ao buscar registros de controle de KM:', error);
      console.error('📋 Detalhes do erro:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  }

  /**
   * Buscar registro por ID
   */
  async getKmControlById(id: string): Promise<KmControl> {
    try {
      console.log('🔍 KmControlService: Buscando registro por ID:', id);
      const response = await axios.get(`/frota/km-controls/${id}`);
      console.log('✅ KmControlService: Dados do registro:', response.data);
      console.log('🔍 KmControlService: Campos do registro:', Object.keys(response.data));
      console.log('🔍 KmControlService: initialKm:', response.data.initialKm, 'tipo:', typeof response.data.initialKm);
      console.log('🔍 KmControlService: finalKm:', response.data.finalKm, 'tipo:', typeof response.data.finalKm);
      console.log('🔍 KmControlService: totalKm:', response.data.totalKm, 'tipo:', typeof response.data.totalKm);
      
      // Processar datas se necessário
      const processedData = {
        ...response.data,
        date: Array.isArray(response.data.date) 
          ? `${response.data.date[0]}-${String(response.data.date[1]).padStart(2, '0')}-${String(response.data.date[2]).padStart(2, '0')}`
          : response.data.date,
        createdAt: Array.isArray(response.data.createdAt)
          ? new Date(response.data.createdAt[0], response.data.createdAt[1] - 1, response.data.createdAt[2]).toISOString()
          : response.data.createdAt,
        updatedAt: Array.isArray(response.data.updatedAt)
          ? new Date(response.data.updatedAt[0], response.data.updatedAt[1] - 1, response.data.updatedAt[2]).toISOString()
          : response.data.updatedAt
      };
      
      console.log('🔧 KmControlService: Dados processados:', processedData);
      return processedData;
    } catch (error) {
      console.error('❌ Erro ao buscar registro de controle de KM:', error);
      throw error;
    }
  }

  /**
   * Buscar registros com filtros
   */
  async getKmControlsWithFilters(filters: KmControlFilters): Promise<KmControl[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.supervisor && filters.supervisor !== 'all') params.append('supervisor', filters.supervisor);
      if (filters.vehiclePlate && filters.vehiclePlate !== 'all') params.append('vehiclePlate', filters.vehiclePlate);
      
      const response = await axios.get(`/frota/km-controls/filter?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar registros com filtros:', error);
      throw error;
    }
  }

  /**
   * Criar novo registro
   */
  async createKmControl(kmControl: Omit<KmControl, 'id' | 'createdAt' | 'updatedAt'>): Promise<KmControl> {
    try {
      const response = await axios.post('/api/frota/km-controls', kmControl, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar registro de controle de KM:', error);
      console.error('❌ Payload enviado:', kmControl);
      throw error;
    }
  }

  /**
   * Atualizar registro existente
   */
  async updateKmControl(id: string, kmControl: Partial<KmControl>): Promise<KmControl> {
    try {
      const response = await axios.put(`/frota/km-controls/${id}`, kmControl);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar registro de controle de KM:', error);
      throw error;
    }
  }

  /**
   * Deletar registro
   */
  async deleteKmControl(id: string): Promise<void> {
    try {
      await axios.delete(`/frota/km-controls/${id}`);
    } catch (error) {
      console.error('❌ Erro ao deletar registro de controle de KM:', error);
      throw error;
    }
  }

  /**
   * Upload de foto do painel
   */
  async uploadDashboardPhoto(kmControlId: string, file: File, description: string): Promise<KmControl> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('description', description);

      const response = await axios.post(`/frota/km-controls/${kmControlId}/dashboard-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload da foto do painel:', error);
      throw new Error('Falha ao fazer upload da foto do painel');
    }
  }

  /**
   * Buscar estatísticas
   */
  async getStatistics(startDate: string, endDate: string): Promise<KmControlStatistics> {
    try {
      const response = await axios.get(`/frota/km-controls/statistics?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Buscar registros com observações
   */
  async getKmControlsWithObservations(): Promise<KmControl[]> {
    try {
      const response = await axios.get('/api/frota/km-controls/with-observations');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar registros com observações:', error);
      throw error;
    }
  }

  /**
   * Buscar supervisores únicos
   */
  async getSupervisors(): Promise<string[]> {
    try {
      const response = await axios.get('/api/frota/km-controls/supervisors');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar supervisores:', error);
      throw error;
    }
  }

  /**
   * Testar conexão com o backend
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get('/api/frota/km-controls/test');
      console.log('✅ Teste de conexão KmControl:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Erro no teste de conexão KmControl:', error);
      return false;
    }
  }

  /**
   * Criar dados de teste
   */
  async createTestData(): Promise<KmControl[]> {
    try {
      console.log('🔧 KmControlService: Criando dados de teste...');
      const response = await axios.post('/api/frota/km-controls/create-test-data');
      console.log('✅ KmControlService: Dados de teste criados:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Erro ao criar dados de teste:', error);
      throw error;
    }
  }
}

export default new KmControlService();
