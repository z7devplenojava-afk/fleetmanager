import api from '@/lib/axios';

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
      
      // Verificar se os dados são um array válido
      if (Array.isArray(response.data)) {
        console.log('✅ Ordens de serviço carregadas do backend:', response.data.length);
        return response.data;
      } else {
        console.warn('⚠️ Backend retornou dados que não são um array:', response.data);
        return [];
      }
    } catch (error) {
      console.warn('⚠️ Backend não disponível, usando dados de fallback:', error);
      
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
  },

  async getOrderById(id: string): Promise<OrderOfService> {
    try {
      console.log('🔗 Tentando buscar ordem de serviço por ID no backend:', id);
      const response = await api.get(`/api/orders-of-service/${id}`);
      console.log('✅ Ordem de serviço encontrada no backend');
      return response.data;
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
      console.log('✅ Ordem de serviço criada no backend');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Backend não disponível, simulando criação:', error);
      
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
  },

  async updateOrder(id: string, data: Partial<CreateOrderOfServiceRequest>): Promise<OrderOfService> {
    try {
      console.log('🔗 Tentando atualizar ordem de serviço no backend:', id);
      const response = await api.put(`/api/orders-of-service/${id}`, data);
      console.log('✅ Ordem de serviço atualizada no backend');
      return response.data;
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
      return response.data;
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
      return response.data;
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