import api from '@/lib/axios';

export interface Order {
  id: string;
  employeeId: string;
  employeeName: string;
  function: string;
  clientId: string;
  clientName: string;
  workStationId: string;
  workStationName: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  digitalSignature?: string;
  documentUrl: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  employeeId: string;
  function: string;
  clientId: string;
  workStationId: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export const orderService = {
  // Criar nova ordem de serviço
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Buscar ordens de serviço
  async getOrders(): Promise<Order[]> {
    const response = await api.get('/orders');
    return response.data;
  },

  // Buscar ordem por ID
  async getOrderById(id: string): Promise<Order> {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  },

  // Atualizar ordem de serviço
  async updateOrder(id: string, orderData: Partial<CreateOrderRequest>): Promise<Order> {
    const response = await api.put(`/api/orders/${id}`, orderData);
    return response.data;
  },

  // Excluir ordem de serviço
  async deleteOrder(id: string): Promise<void> {
    await api.delete(`/api/orders/${id}`);
  }
}; 