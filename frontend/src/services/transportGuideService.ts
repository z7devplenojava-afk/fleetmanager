import api from '@/lib/axios';
import { TransportGuide, CreateTransportGuideDTO, UpdateTransportGuideDTO, TransportGuideFilters } from '@/types/transportGuide';

export const transportGuideService = {
  // Buscar todas as guias com filtros
  async getTransportGuides(filters: TransportGuideFilters = {}): Promise<TransportGuide[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.cnpj) params.append('cnpj', filters.cnpj);
      if (filters.empresa) params.append('empresa', filters.empresa);
      if (filters.numeroArma) params.append('numeroArma', filters.numeroArma);
      if (filters.calibre) params.append('calibre', filters.calibre);
      if (filters.motivo) params.append('motivo', filters.motivo);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.createdBy) params.append('createdBy', filters.createdBy);
      
      const response = await api.get(`/api/transport-guides?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar guias de transporte:', error);
      // Retornar dados mock para desenvolvimento
      return this.getMockTransportGuides();
    }
  },

  // Buscar guia por ID
  async getTransportGuideById(id: string): Promise<TransportGuide> {
    try {
      const response = await api.get(`/api/transport-guides/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar guia de transporte:', error);
      throw new Error('Falha ao buscar guia de transporte');
    }
  },

  // Criar nova guia
  async createTransportGuide(guideData: CreateTransportGuideDTO): Promise<TransportGuide> {
    try {
      const formData = new FormData();
      
      formData.append('cnpj', guideData.cnpj);
      formData.append('empresa', guideData.empresa);
      if (guideData.numeroColete) formData.append('numeroColete', guideData.numeroColete);
      formData.append('numeroArma', guideData.numeroArma);
      formData.append('calibre', guideData.calibre);
      formData.append('qtdMunicoes', guideData.qtdMunicoes.toString());
      formData.append('origem', guideData.origem);
      formData.append('destino', guideData.destino);
      formData.append('trajeto', guideData.trajeto);
      formData.append('motivo', guideData.motivo);
      
      if (guideData.arquivoGuia) {
        formData.append('arquivoGuia', guideData.arquivoGuia);
      }

      const response = await api.post('/api/transport-guides', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar guia de transporte:', error);
      throw new Error('Falha ao criar guia de transporte');
    }
  },

  // Atualizar guia
  async updateTransportGuide(id: string, guideData: Partial<CreateTransportGuideDTO>): Promise<TransportGuide> {
    try {
      const formData = new FormData();
      
      if (guideData.cnpj) formData.append('cnpj', guideData.cnpj);
      if (guideData.empresa) formData.append('empresa', guideData.empresa);
      if (guideData.numeroColete) formData.append('numeroColete', guideData.numeroColete);
      if (guideData.numeroArma) formData.append('numeroArma', guideData.numeroArma);
      if (guideData.calibre) formData.append('calibre', guideData.calibre);
      if (guideData.qtdMunicoes !== undefined) formData.append('qtdMunicoes', guideData.qtdMunicoes.toString());
      if (guideData.origem) formData.append('origem', guideData.origem);
      if (guideData.destino) formData.append('destino', guideData.destino);
      if (guideData.trajeto) formData.append('trajeto', guideData.trajeto);
      if (guideData.motivo) formData.append('motivo', guideData.motivo);
      
      if (guideData.arquivoGuia) {
        formData.append('arquivoGuia', guideData.arquivoGuia);
      }

      const response = await api.put(`/api/transport-guides/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar guia de transporte:', error);
      throw new Error('Falha ao atualizar guia de transporte');
    }
  },

  // Excluir guia
  async deleteTransportGuide(id: string): Promise<void> {
    try {
      await api.delete(`/api/transport-guides/${id}`);
    } catch (error) {
      console.error('Erro ao excluir guia de transporte:', error);
      throw new Error('Falha ao excluir guia de transporte');
    }
  },

  // Aprovar guia
  async approveTransportGuide(id: string, supervisorId: string): Promise<TransportGuide> {
    try {
      const response = await api.patch(`/api/transport-guides/${id}/approve?supervisorId=${supervisorId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao aprovar guia de transporte:', error);
      throw new Error('Falha ao aprovar guia de transporte');
    }
  },

  // Rejeitar guia
  async rejectTransportGuide(id: string, supervisorId: string, reason: string): Promise<TransportGuide> {
    try {
      const response = await api.patch(`/api/transport-guides/${id}/reject?supervisorId=${supervisorId}&reason=${encodeURIComponent(reason)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao rejeitar guia de transporte:', error);
      throw new Error('Falha ao rejeitar guia de transporte');
    }
  },

  // Gerar relatório em PDF
  async generatePDFReport(filters: TransportGuideFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/api/transport-guides/pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      throw new Error('Falha ao gerar relatório PDF');
    }
  },

  // Dados mock para desenvolvimento
  getMockTransportGuides(): TransportGuide[] {
    return [
      {
        id: '1',
        cnpj: '12.345.678/0001-90',
        empresa: 'Segurança Total Ltda',
        numeroColete: 'CT-001-2025',
        numeroArma: 'AR-12345',
        calibre: '9mm',
        qtdMunicoes: 50,
        origem: 'Posto Central - Rua das Flores, 123 - Centro - CEP: 12345-678',
        destino: 'Posto Norte - Av. Principal, 456 - Zona Norte - CEP: 12345-679',
        trajeto: 'BR-101 → Av. Central → R. das Palmeiras',
        motivo: 'Transferência de Arma',
        status: 'APPROVED' as any,
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T14:20:00Z',
        createdBy: 'João Silva',
        approvedBy: 'Maria Santos',
        approvedAt: '2025-01-15T14:20:00Z'
      },
      {
        id: '2',
        cnpj: '98.765.432/0001-10',
        empresa: 'Proteção Máxima S.A.',
        numeroColete: 'CT-002-2025',
        numeroArma: 'AR-67890',
        calibre: '.40',
        qtdMunicoes: 30,
        origem: 'Posto Sul - Rua da Segurança, 789 - Zona Sul - CEP: 12345-680',
        destino: 'Posto Leste - Av. da Paz, 321 - Zona Leste - CEP: 12345-681',
        trajeto: 'BR-116 → Av. das Américas → R. da Liberdade',
        motivo: 'Manutenção',
        status: 'IN_TRANSIT' as any,
        createdAt: '2025-01-16T08:15:00Z',
        updatedAt: '2025-01-16T09:45:00Z',
        createdBy: 'Carlos Lima',
        approvedBy: 'Ana Costa',
        approvedAt: '2025-01-16T09:45:00Z'
      },
      {
        id: '3',
        cnpj: '11.222.333/0001-44',
        empresa: 'Vigilância 24h ME',
        numeroArma: 'AR-54321',
        calibre: '12 Gauge',
        qtdMunicoes: 20,
        origem: 'Posto Oeste - Rua da Vigilância, 555 - Zona Oeste - CEP: 12345-682',
        destino: 'Posto Centro - Av. Central, 999 - Centro - CEP: 12345-683',
        trajeto: 'BR-290 → Av. Ipiranga → R. da República',
        motivo: 'Treinamento',
        status: 'SUBMITTED' as any,
        createdAt: '2025-01-17T16:20:00Z',
        updatedAt: '2025-01-17T16:20:00Z',
        createdBy: 'Pedro Oliveira'
      },
      {
        id: '4',
        cnpj: '55.666.777/0001-88',
        empresa: 'Guarda Nacional Ltda',
        numeroColete: 'CT-003-2025',
        numeroArma: 'AR-98765',
        calibre: '9mm',
        qtdMunicoes: 100,
        origem: 'Posto Matriz - Rua Principal, 111 - Centro - CEP: 12345-684',
        destino: 'Posto Filial - Av. Secundária, 222 - Bairro Novo - CEP: 12345-685',
        trajeto: 'BR-101 → Av. das Nações → R. do Comércio',
        motivo: 'Transferência de Arma',
        status: 'COMPLETED' as any,
        createdAt: '2025-01-14T12:00:00Z',
        updatedAt: '2025-01-14T18:30:00Z',
        createdBy: 'Roberto Silva',
        approvedBy: 'Fernanda Lima',
        approvedAt: '2025-01-14T15:00:00Z'
      },
      {
        id: '5',
        cnpj: '99.888.777/0001-66',
        empresa: 'Segurança Avançada S.A.',
        numeroArma: 'AR-11111',
        calibre: '.45',
        qtdMunicoes: 25,
        origem: 'Posto Alpha - Rua Alpha, 333 - Zona Alpha - CEP: 12345-686',
        destino: 'Posto Beta - Av. Beta, 444 - Zona Beta - CEP: 12345-687',
        trajeto: 'BR-116 → Av. dos Estados → R. das Nações',
        motivo: 'Outro',
        status: 'DRAFT' as any,
        createdAt: '2025-01-18T09:30:00Z',
        updatedAt: '2025-01-18T09:30:00Z',
        createdBy: 'Lucas Ferreira'
      }
    ];
  }
};
