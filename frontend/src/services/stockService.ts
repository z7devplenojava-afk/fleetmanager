import api from '@/lib/axios';
import { 
  StockItem, 
  StockMovement, 
  StockAlert, 
  CreateStockItemDTO, 
  CreateStockMovementDTO,
  StockFilters,
  MovementFilters,
  StockReport,
  StockCategory,
  MovementType,
  MovementReason
} from '@/types/stock';

export const stockService = {
  // ===== ITENS DE ESTOQUE =====

  async getAllItems(): Promise<StockItem[]> {
    try {
      const response = await api.get('/api/stock/items');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar itens de estoque:', error);
      // Return empty array instead of throwing error to prevent component crash
      return [];
    }
  },

  async searchItems(filters: StockFilters, page = 0, size = 20): Promise<{ content: StockItem[], totalElements: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.active !== undefined) params.append('active', filters.active.toString());
      if (filters.unitId) params.append('unitId', filters.unitId);
      if (filters.lowStock !== undefined) params.append('lowStock', filters.lowStock.toString());
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      const response = await api.get(`/api/stock/items/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar itens com filtros:', error);
      throw new Error('Falha ao buscar itens');
    }
  },

  async getItemById(id: string): Promise<StockItem> {
    try {
      const response = await api.get(`/api/stock/items/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar item por ID:', error);
      throw new Error('Falha ao buscar item');
    }
  },

  async getItemByCode(code: string): Promise<StockItem> {
    try {
      const response = await api.get(`/api/stock/items/code/${code}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar item por código:', error);
      throw new Error('Falha ao buscar item por código');
    }
  },

  async getItemByQrCode(qrCode: string): Promise<StockItem> {
    try {
      const response = await api.get(`/api/stock/items/qr/${qrCode}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar item por QR Code:', error);
      throw new Error('Falha ao buscar item por QR Code');
    }
  },

  async createItem(itemData: CreateStockItemDTO): Promise<StockItem> {
    try {
      const response = await api.post('/stock/items', itemData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar item:', error);
      throw new Error('Falha ao criar item');
    }
  },

  async updateItem(id: string, itemData: Partial<CreateStockItemDTO>): Promise<StockItem> {
    try {
      const response = await api.put(`/api/stock/items/${id}`, itemData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      throw new Error('Falha ao atualizar item');
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      await api.delete(`/api/stock/items/${id}`);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      throw new Error('Falha ao excluir item');
    }
  },

  async getItemsByCategory(category: StockCategory): Promise<StockItem[]> {
    try {
      const response = await api.get(`/api/stock/items/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar itens por categoria:', error);
      throw new Error('Falha ao buscar itens por categoria');
    }
  },

  async getLowStockItems(): Promise<StockItem[]> {
    try {
      const response = await api.get('/stock/items/low-stock');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar itens com baixo estoque:', error);
      throw new Error('Falha ao buscar itens com baixo estoque');
    }
  },

  // ===== MOVIMENTAÇÕES =====

  async createMovement(movementData: CreateStockMovementDTO): Promise<StockMovement> {
    try {
      const response = await api.post('/stock/movements', movementData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      throw new Error('Falha ao criar movimentação');
    }
  },

  async searchMovements(filters: MovementFilters, page = 0, size = 20): Promise<{ content: StockMovement[], totalElements: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.stockItemId) params.append('stockItemId', filters.stockItemId);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.movementType) params.append('movementType', filters.movementType);
      if (filters.reason) params.append('reason', filters.reason);
      if (filters.unitId) params.append('unitId', filters.unitId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      const response = await api.get(`/api/stock/movements/search?${params.toString()}`);
      return {
        content: response.data.content || [],
        totalElements: response.data.totalElements || 0
      };
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      // Return empty result instead of throwing error
      return {
        content: [],
        totalElements: 0
      };
    }
  },

  async getMovementsByItem(itemId: string): Promise<StockMovement[]> {
    try {
      const response = await api.get(`/api/stock/movements/item/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar movimentações do item:', error);
      throw new Error('Falha ao buscar movimentações do item');
    }
  },

  async getDeliveryHistoryByEmployee(employeeId: string): Promise<StockMovement[]> {
    try {
      const response = await api.get(`/api/stock/movements/employee/${employeeId}/deliveries`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico de entregas:', error);
      throw new Error('Falha ao buscar histórico de entregas');
    }
  },

  async getRecentMovements(limit = 10): Promise<StockMovement[]> {
    try {
      const response = await api.get(`/api/stock/movements/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar movimentações recentes:', error);
      throw new Error('Falha ao buscar movimentações recentes');
    }
  },

  // ===== ALERTAS =====

  async getActiveAlerts(): Promise<StockAlert[]> {
    try {
      const response = await api.get('/api/stock/alerts');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar alertas ativos:', error);
      // Return empty array instead of throwing error to prevent component crash
      return [];
    }
  },

  async getUnreadAlerts(): Promise<StockAlert[]> {
    try {
      const response = await api.get('/api/stock/alerts/unread');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar alertas não lidos:', error);
      return [];
    }
  },

  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      await api.patch(`/api/stock/alerts/${alertId}/read`);
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
      throw new Error('Falha ao marcar alerta como lido');
    }
  },

  async resolveAlert(alertId: string): Promise<void> {
    try {
      await api.patch(`/api/stock/alerts/${alertId}/resolve`);
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      throw new Error('Falha ao resolver alerta');
    }
  },

  // ===== RELATÓRIOS =====

  async getStockReport(): Promise<StockReport> {
    try {
      const response = await api.get('/stock/report');
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de estoque:', error);
      throw new Error('Falha ao gerar relatório');
    }
  },

  // ===== ENUMS =====

  async getCategories(): Promise<StockCategory[]> {
    try {
      const response = await api.get('/stock/enums/categories');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return Object.values(StockCategory);
    }
  },

  async getMovementTypes(): Promise<MovementType[]> {
    try {
      const response = await api.get('/stock/enums/movement-types');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tipos de movimentação:', error);
      return Object.values(MovementType);
    }
  },

  async getMovementReasons(): Promise<MovementReason[]> {
    try {
      const response = await api.get('/stock/enums/movement-reasons');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar motivos de movimentação:', error);
      return Object.values(MovementReason);
    }
  }
};