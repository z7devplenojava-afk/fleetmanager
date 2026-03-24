import api from '@/lib/axios';

export interface CAEPIResponse {
  numero: string;
  nome: string;
  descricao?: string;
  situacao?: string;
  validade?: string;
  fabricante?: string;
  equipamento?: string;
}

export const caepiService = {
  /**
   * Busca informações de um CA específico pelo número
   */
  async buscarCA(numero: string): Promise<CAEPIResponse | null> {
    try {
      const response = await api.get<CAEPIResponse>(`/api/caepi/${encodeURIComponent(numero)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Erro ao buscar CA:', error);
      throw error;
    }
  },

  /**
   * Busca múltiplos CAs por termo de busca
   */
  async buscarCAs(searchTerm: string): Promise<CAEPIResponse[]> {
    try {
      const response = await api.get<CAEPIResponse[]>(`/api/caepi/search?searchTerm=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar CAs:', error);
      return [];
    }
  }
};

