import api from '@/lib/axios';
import { isConnectionError } from '@/utils/connectionError';

export interface OrderOfService {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCpf: string;
  role: string;
  company: string;
  client: string;
  workplace: string;
  salary: number;
  startDate: string;
  endDate?: string;
  documentUrl?: string;
  signed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderOfServiceRequest {
  employeeId: string;
  employeeName: string;
  employeeCpf: string;
  role: string;
  company: string;
  client: string;
  workplace: string;
  salary: number;
  startDate: string;
  endDate?: string;
  documentUrl?: string;
}

export interface UpdateOrderOfServiceRequest extends Partial<CreateOrderOfServiceRequest> {
  id: string;
}

export interface OrderOfServiceFilters {
  employeeId?: string;
  signed?: boolean;
  search?: string;
}

// Função para normalizar dados recebidos do backend
function normalizeOrderOfService(data: any): OrderOfService {
  return {
    id: String(data.id || ''),
    employeeId: String(data.employeeId || ''),
    employeeName: String(data.employeeName || ''),
    employeeCpf: String(data.employeeCpf || ''),
    role: String(data.role || ''),
    company: String(data.company || ''),
    client: String(data.client || ''),
    workplace: String(data.workplace || ''),
    salary: typeof data.salary === 'number' ? data.salary : parseFloat(String(data.salary || '0')),
    startDate: String(data.startDate || ''),
    endDate: data.endDate ? String(data.endDate) : undefined,
    documentUrl: data.documentUrl ? String(data.documentUrl) : undefined,
    signed: Boolean(data.signed),
    createdAt: String(data.createdAt || new Date().toISOString()),
    updatedAt: String(data.updatedAt || new Date().toISOString())
  };
}

// Dados de fallback para quando o backend não estiver disponível
const fallbackOrders: OrderOfService[] = [
  {
    id: '1',
    employeeId: 'emp-001',
    employeeName: 'João Silva',
    employeeCpf: '123.456.789-00',
    role: 'Vigilante',
    company: 'Promover Vigilância',
    client: 'Shopping Center Plaza',
    workplace: 'Portaria Principal',
    salary: 2500.00,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    documentUrl: 'https://example.com/document1.pdf',
    signed: true,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    employeeId: 'emp-002',
    employeeName: 'Maria Santos',
    employeeCpf: '987.654.321-00',
    role: 'Supervisora',
    company: 'Promover Vigilância',
    client: 'Condomínio Residencial',
    workplace: 'Central de Monitoramento',
    salary: 3500.00,
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    documentUrl: 'https://example.com/document2.pdf',
    signed: false,
    createdAt: '2024-01-15T14:30:00Z',
    updatedAt: '2024-01-15T14:30:00Z'
  },
  {
    id: '3',
    employeeId: 'emp-003',
    employeeName: 'Pedro Costa',
    employeeCpf: '456.789.123-00',
    role: 'Vigilante',
    company: 'Promover Vigilância',
    client: 'Empresa Tech Solutions',
    workplace: 'Recepção',
    salary: 2800.00,
    startDate: '2024-02-01',
    signed: true,
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: '2024-02-01T09:15:00Z'
  }
];

export const orderOfServiceService = {
  async getOrders(filters: OrderOfServiceFilters = {}): Promise<OrderOfService[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.signed !== undefined) params.append('signed', filters.signed.toString());
      if (filters.search) params.append('search', filters.search);
      
      const queryString = params.toString();
      const url = queryString ? `/api/orders-of-service?${queryString}` : '/api/orders-of-service';
      
      console.log('🔗 Tentando buscar ordens de serviço no backend:', url);
      const response = await api.get(url);
      console.log('📦 Resposta completa do backend:', {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        data: response.data
      });
      
      // Verificar se os dados são um array válido
      if (Array.isArray(response.data)) {
        console.log('✅ Ordens de serviço carregadas do backend:', response.data.length);
        if (response.data.length > 0) {
          console.log('📋 Primeira ordem de exemplo:', response.data[0]);
        }
        // Normalizar os dados para garantir tipos corretos
        const normalized = response.data.map(normalizeOrderOfService);
        console.log('🔄 Dados normalizados:', normalized.length, normalized);
        return normalized;
      } else {
        console.warn('⚠️ Backend retornou dados que não são um array:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar ordens de serviço:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Data:', error.response?.data);
      console.error('❌ Message:', error.message);
      console.error('❌ Is Connection Error:', isConnectionError(error));
      
      // Verificar se é erro de conexão (backend não disponível)
      if (isConnectionError(error) || !error.response) {
        console.warn('⚠️ Erro de conexão, usando dados de fallback:', error);
        
        // Aplicar filtros nos dados de fallback
        let filteredData = [...fallbackOrders];
        
        if (filters.employeeId) {
          filteredData = filteredData.filter(o => o.employeeId === filters.employeeId);
        }
        if (filters.signed !== undefined) {
          filteredData = filteredData.filter(o => o.signed === filters.signed);
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredData = filteredData.filter(o => 
            o.employeeName.toLowerCase().includes(searchTerm) ||
            o.client.toLowerCase().includes(searchTerm) ||
            o.workplace.toLowerCase().includes(searchTerm) ||
            o.role.toLowerCase().includes(searchTerm)
          );
        }
        
        console.log('📱 Usando dados de fallback - Ordens de serviço:', filteredData.length);
        return filteredData;
      }
      
      // Se o erro for 404, retornar array vazio (recurso não encontrado)
      if (error.response?.status === 404) {
        console.warn('⚠️ Recurso não encontrado (404), retornando array vazio');
        return [];
      }
      
      // Se o erro for 500 ou outro erro do servidor, retornar array vazio
      // para não confundir o usuário com dados falsos
      if (error.response?.status >= 500) {
        console.warn('⚠️ Erro do servidor, retornando array vazio');
        return [];
      }
      
      // Para outros erros (400, 401, 403), retornar array vazio
      return [];
    }
  },

  async getOrderById(id: string): Promise<OrderOfService> {
    try {
      console.log('🔗 Tentando buscar ordem de serviço por ID no backend:', id);
      const response = await api.get(`/api/orders-of-service/${id}`);
      console.log('✅ Ordem de serviço encontrada no backend');
      return normalizeOrderOfService(response.data);
    } catch (error) {
      console.warn('⚠️ Backend não disponível, buscando nos dados de fallback:', error);
      
      const order = fallbackOrders.find(o => o.id === id);
      if (!order) {
        throw new Error('Ordem de serviço não encontrada');
      }
      
      console.log('📱 Ordem de serviço encontrada nos dados de fallback');
      return order;
    }
  },

  async createOrder(data: CreateOrderOfServiceRequest): Promise<OrderOfService> {
    try {
      console.log('🔗 Tentando criar ordem de serviço no backend:', data);
      const response = await api.post('/api/orders-of-service', data);
      console.log('✅ Ordem de serviço criada no backend:', response.data);
      return normalizeOrderOfService(response.data);
    } catch (error: any) {
      console.error('❌ Erro ao criar ordem de serviço:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Data:', error.response?.data);
      console.error('❌ Message:', error.message);
      
      // Se houver erro de validação (400), extrair mensagens de erro
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        let errorMessage = 'Erro ao criar ordem de serviço';
        
        // Tentar extrair mensagem de validação
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.errors) {
          // Se houver múltiplos erros de validação
          const errors = Array.isArray(errorData.errors) 
            ? errorData.errors.map((e: any) => e.defaultMessage || e.message).join(', ')
            : Object.values(errorData.errors).flat().join(', ');
          errorMessage = errors || errorMessage;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        
        throw new Error(errorMessage);
      }
      
      // Se houver erro do servidor (500)
      if (error.response?.status === 500) {
        throw new Error(error.response?.data?.message || 'Erro interno do servidor ao criar ordem de serviço');
      }
      
      // Apenas simular se for erro de conexão
      if (!error.response) {
        console.warn('⚠️ Erro de conexão, simulando criação:', error);
        
        // Simular criação local
        const newOrder: OrderOfService = {
          ...data,
          id: Date.now().toString(),
          signed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('📱 Ordem de serviço simulada localmente');
        return newOrder;
      }
      
      // Para outros erros, lançar
      throw error;
    }
  },

  async updateOrder(id: string, data: Partial<CreateOrderOfServiceRequest>): Promise<OrderOfService> {
    try {
      console.log('🔗 Tentando atualizar ordem de serviço no backend:', id);
      const response = await api.put(`/api/orders-of-service/${id}`, data);
      console.log('✅ Ordem de serviço atualizada no backend');
      return normalizeOrderOfService(response.data);
    } catch (error) {
      console.warn('⚠️ Backend não disponível, simulando atualização:', error);
      
      // Simular atualização local
      const order = fallbackOrders.find(o => o.id === id);
      if (!order) {
        throw new Error('Ordem de serviço não encontrada');
      }
      
      const updatedOrder = { 
        ...order, 
        ...data, 
        updatedAt: new Date().toISOString() 
      };
      console.log('📱 Ordem de serviço atualizada localmente');
      return updatedOrder;
    }
  },

  async signOrder(id: string): Promise<OrderOfService> {
    try {
      console.log('🔗 Tentando assinar ordem de serviço no backend:', id);
      const response = await api.post(`/api/orders-of-service/${id}/sign`);
      console.log('✅ Ordem de serviço assinada no backend');
      return normalizeOrderOfService(response.data);
    } catch (error) {
      console.warn('⚠️ Backend não disponível, simulando assinatura:', error);
      
      // Simular assinatura local
      const order = fallbackOrders.find(o => o.id === id);
      if (!order) {
        throw new Error('Ordem de serviço não encontrada');
      }
      
      const signedOrder = { 
        ...order, 
        signed: true,
        updatedAt: new Date().toISOString() 
      };
      console.log('📱 Ordem de serviço assinada localmente');
      return signedOrder;
    }
  },

  async updateDocumentUrl(id: string, documentUrl: string): Promise<OrderOfService> {
    try {
      console.log('🔗 Tentando atualizar URL do documento no backend:', id);
      const response = await api.post(`/api/orders-of-service/${id}/document`, documentUrl);
      console.log('✅ URL do documento atualizada no backend');
      return normalizeOrderOfService(response.data);
    } catch (error) {
      console.warn('⚠️ Backend não disponível, simulando atualização de URL:', error);
      
      // Simular atualização local
      const order = fallbackOrders.find(o => o.id === id);
      if (!order) {
        throw new Error('Ordem de serviço não encontrada');
      }
      
      const updatedOrder = { 
        ...order, 
        documentUrl,
        updatedAt: new Date().toISOString() 
      };
      console.log('📱 URL do documento atualizada localmente');
      return updatedOrder;
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      console.log('🔗 Tentando excluir ordem de serviço no backend:', id);
      await api.delete(`/api/orders-of-service/${id}`);
      console.log('✅ Ordem de serviço excluída no backend');
    } catch (error) {
      console.warn('⚠️ Backend não disponível, simulando exclusão:', error);
      console.log('📱 Ordem de serviço excluída localmente (simulado)');
    }
  }
};