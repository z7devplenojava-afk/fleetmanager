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
  MovementReason,
  ImportStockResult
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
      const response = await api.post('/api/stock/items', itemData);
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
      const response = await api.get('/api/stock/items/low-stock');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar itens com baixo estoque:', error);
      throw new Error('Falha ao buscar itens com baixo estoque');
    }
  },

  // ===== IMPORTAÇÃO EXCEL =====

  async importExcel(file: File): Promise<ImportStockResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/stock/import', formData, {
        timeout: 120000
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao importar planilha de estoque:', error);
      const backendErrors = error?.response?.data?.errors;
      const detail = Array.isArray(backendErrors) && backendErrors.length > 0
        ? backendErrors.join('; ')
        : error?.response?.data?.message;
      throw new Error(detail || 'Falha ao importar planilha');
    }
  },

  // ===== MOVIMENTAÇÕES =====

  async deleteMovement(id: string): Promise<void> {
    try {
      await api.delete(`/api/stock/movements/${id}`);
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error);
      throw new Error('Falha ao excluir movimentação');
    }
  },

  async deleteMovements(ids: string[]): Promise<{ deleted: number; requested?: number }> {
    try {
      const response = await api.post('/api/stock/movements/bulk-delete', ids);
      return response.data || { deleted: 0 };
    } catch (error) {
      console.error('Erro ao excluir movimentações em lote:', error);
      throw new Error('Falha ao excluir movimentações');
    }
  },

  async createMovement(movementData: CreateStockMovementDTO): Promise<StockMovement> {
    try {
      console.log('📤 Enviando requisição para /api/stock/movements:', movementData);
      const response = await api.post('/api/stock/movements', movementData);
      console.log('✅ Resposta recebida:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar movimentação:', error);
      console.error('❌ Response data:', error?.response?.data);
      console.error('❌ Response status:', error?.response?.status);
      console.error('❌ Response headers:', error?.response?.headers);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Falha ao criar movimentação';
      throw new Error(errorMessage);
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
      
      // Converter datas do formato dd/mm/aaaa para ISO DateTime
      if (filters.startDate) {
        const isoStartDate = this.convertDateToISO(filters.startDate, true);
        if (isoStartDate) {
          params.append('startDate', isoStartDate);
        }
      }
      if (filters.endDate) {
        const isoEndDate = this.convertDateToISO(filters.endDate, false);
        if (isoEndDate) {
          params.append('endDate', isoEndDate);
        }
      }
      
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

  // Função auxiliar para converter data dd/mm/aaaa para ISO DateTime
  convertDateToISO(dateString: string, isStartDate: boolean): string | null {
    if (!dateString) return null;
    
    try {
      // Tentar parsear formato dd/mm/aaaa
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
        const year = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) {
          console.warn('Data inválida:', dateString);
          return null;
        }
        
        // Se for data inicial, usar 00:00:00, se for final, usar 23:59:59
        if (isStartDate) {
          date.setHours(0, 0, 0, 0);
        } else {
          date.setHours(23, 59, 59, 999);
        }
        
        // Converter para ISO string (formato: YYYY-MM-DDTHH:mm:ss)
        return date.toISOString();
      }
      
      // Se já estiver no formato ISO, retornar como está
      if (dateString.includes('T')) {
        return dateString;
      }
      
      // Tentar parsear como Date ISO
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        if (isStartDate) {
          date.setHours(0, 0, 0, 0);
        } else {
          date.setHours(23, 59, 59, 999);
        }
        return date.toISOString();
      }
      
      console.warn('Formato de data não reconhecido:', dateString);
      return null;
    } catch (error) {
      console.error('Erro ao converter data:', error);
      return null;
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
      const response = await api.get('/api/stock/report');
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de estoque:', error);
      throw new Error('Falha ao gerar relatório');
    }
  },

  async getItemReport(itemId: string): Promise<any> {
    try {
      const response = await api.get(`/api/stock/reports/item/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório do item:', error);
      throw new Error('Falha ao gerar relatório do item');
    }
  },

  async getMovementsReport(params: {
    startDate?: string;
    endDate?: string;
    itemId?: string;
    employeeId?: string;
    movementType?: MovementType;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.itemId) queryParams.append('itemId', params.itemId);
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.movementType) queryParams.append('movementType', params.movementType);
      
      const response = await api.get(`/api/stock/reports/movements?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de movimentações:', error);
      throw new Error('Falha ao gerar relatório de movimentações');
    }
  },

  async getLowStockReport(): Promise<any> {
    try {
      const response = await api.get('/api/stock/reports/low-stock');
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de estoque baixo:', error);
      throw new Error('Falha ao gerar relatório de estoque baixo');
    }
  },

  async getDateRangeReport(startDate: string, endDate: string): Promise<any> {
    try {
      const response = await api.get(`/api/stock/reports/date-range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório por período:', error);
      throw new Error('Falha ao gerar relatório por período');
    }
  },

  // ===== ENUMS =====

  async getCategories(): Promise<StockCategory[]> {
    try {
      const response = await api.get('/api/stock/enums/categories');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return Object.values(StockCategory);
    }
  },

  async getMovementTypes(): Promise<MovementType[]> {
    try {
      const response = await api.get('/api/stock/enums/movement-types');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tipos de movimentação:', error);
      return Object.values(MovementType);
    }
  },

  async getMovementReasons(): Promise<MovementReason[]> {
    try {
      const response = await api.get('/api/stock/enums/movement-reasons');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar motivos de movimentação:', error);
      return Object.values(MovementReason);
    }
  }
};