import api from '@/lib/axios';

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  code?: string;
  unitPrice?: number;
  unit?: string;
  status?: string;
  isBillable?: boolean;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  category?: string;
  code?: string;
  unitPrice?: number;
  unit?: string;
  isBillable?: boolean;
}

// Serviços operacionais padrão para transportes e contratos de locação
export const DEFAULT_TRANSPORT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-transp-pass',
    name: 'PRESTAÇÃO DE SERVIÇO DE TRANSPORTE DE PASSAGEIROS',
    description: 'Transporte corporativo contínuo de colaboradores e passageiros',
    category: 'FRETAMENTO_CONTINUO',
    code: 'SRV-001',
    isBillable: true,
  },
  {
    id: 'srv-onibus-mao-obra',
    name: 'PRESTAÇÃO DE SERVIÇO COM ÔNIBUS RODOVIÁRIO, COM CESSÃO DE MÃO DE OBRA',
    description: 'Ônibus rodoviário executivo com cessão de motorista para rota operacional fixa',
    category: 'FRETAMENTO_CONTINUO',
    code: 'SRV-002',
    isBillable: true,
  },
  {
    id: 'srv-micro-mao-obra',
    name: 'PRESTAÇÃO DE SERVIÇO COM MICRO ÔNIBUS RODOVIÁRIO, COM CESSÃO DE MÃO DE OBRA',
    description: 'Micro-ônibus com cessão de motorista para transporte de funcionários',
    category: 'FRETAMENTO_CONTINUO',
    code: 'SRV-003',
    isBillable: true,
  },
  {
    id: 'srv-van-mao-obra',
    name: 'PRESTAÇÃO DE SERVIÇO COM VAN EXECUTIVA, COM CESSÃO DE MÃO DE OBRA',
    description: 'Van executiva com motorista para transfer e transporte ágil',
    category: 'FRETAMENTO_CONTINUO',
    code: 'SRV-004',
    isBillable: true,
  },
  {
    id: 'srv-locacao-pura',
    name: 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA (LOCAÇÃO PURA)',
    description: 'Cessão e locação de veículo operacional sem fornecimento de motorista',
    category: 'LOCACAO_VEICULOS',
    code: 'SRV-005',
    isBillable: true,
  },
  {
    id: 'srv-viagem-extra',
    name: 'VIAGEM EXTRA / EVENTO CORPORATIVO FORA DE ESCALA',
    description: 'Atendimento de viagem extra sob demanda de rota',
    category: 'EVENTUAL_EXTRA',
    code: 'SRV-006',
    isBillable: true,
  },
];

class ServiceService {
  async listServices(): Promise<ServiceItem[]> {
    try {
      const response = await api.get('/admin/services');
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return DEFAULT_TRANSPORT_SERVICES;
    } catch (error) {
      console.warn('Não foi possível carregar serviços da API, usando lista padrão:', error);
      return DEFAULT_TRANSPORT_SERVICES;
    }
  }

  async createService(input: CreateServiceInput): Promise<ServiceItem> {
    const payload = {
      name: input.name.trim().toUpperCase(),
      description: input.description?.trim(),
      category: input.category || 'TRANSPORTE',
      code: input.code || `SRV-${Date.now().toString().slice(-4)}`,
      unitPrice: input.unitPrice,
      unit: input.unit || 'UN',
      isBillable: input.isBillable ?? true,
    };

    try {
      const response = await api.post('/admin/services', payload);
      return response.data;
    } catch (error) {
      console.warn('Erro ao salvar serviço no backend, gerando registro local:', error);
      // Fallback local se a API der erro
      return {
        id: `srv-${Date.now()}`,
        ...payload,
      };
    }
  }
}

export const serviceService = new ServiceService();
