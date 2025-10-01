import api from '@/lib/axios';
import { 
  InventoryItem, 
  InventoryMovement, 
  InventoryItemDTO, 
  InventoryMovementDTO, 
  InventoryReport,
  ItemCategory,
  ItemType,
  ItemStatus,
  MovementType
} from '@/types/inventory';

class InventoryService {
  // ===== INVENTORY ITEMS =====
  
  async getInventoryItems(page = 0, size = 20): Promise<{ content: InventoryItem[], totalElements: number, totalPages: number }> {
    const response = await api.get(`/inventory-items?page=${page}&size=${size}`);
    return response.data;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory-items/all');
    return response.data;
  }

  async getInventoryItemById(id: string): Promise<InventoryItem> {
    const response = await api.get(`/inventory-items/${id}`);
    return response.data;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory-items/low-stock');
    return response.data;
  }

  async getExpiredItems(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory-items/expired');
    return response.data;
  }

  async searchInventoryItems(
    category?: ItemCategory,
    type?: ItemType,
    status?: ItemStatus,
    name?: string,
    brand?: string,
    size?: string,
    color?: string,
    page = 0,
    pageSize = 20
  ): Promise<{ content: InventoryItem[], totalElements: number, totalPages: number }> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (name) params.append('name', name);
    if (brand) params.append('brand', brand);
    if (size) params.append('size', size);
    if (color) params.append('color', color);
    params.append('page', page.toString());
    params.append('size', pageSize.toString());

    const response = await api.get(`/inventory-items/search?${params.toString()}`);
    return response.data;
  }

  async createInventoryItem(item: InventoryItemDTO): Promise<InventoryItem> {
    const response = await api.post('/inventory-items', item);
    return response.data;
  }

  async updateInventoryItem(id: string, item: InventoryItemDTO): Promise<InventoryItem> {
    const response = await api.put(`/inventory-items/${id}`, item);
    return response.data;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await api.delete(`/inventory-items/${id}`);
  }

  // ===== INVENTORY MOVEMENTS =====

  async getInventoryMovements(page = 0, size = 20): Promise<{ content: InventoryMovement[], totalElements: number, totalPages: number }> {
    const response = await api.get(`/inventory-movements?page=${page}&size=${size}`);
    return response.data;
  }

  async getAllInventoryMovements(): Promise<InventoryMovement[]> {
    const response = await api.get('/inventory-movements/all');
    return response.data;
  }

  async getInventoryMovementById(id: string): Promise<InventoryMovement> {
    const response = await api.get(`/inventory-movements/${id}`);
    return response.data;
  }

  async getMovementsByItem(itemId: string, page = 0, size = 20): Promise<{ content: InventoryMovement[], totalElements: number, totalPages: number }> {
    const response = await api.get(`/inventory-movements/item/${itemId}?page=${page}&size=${size}`);
    return response.data;
  }

  async getMovementsByDateRange(startDate: string, endDate: string, page = 0, size = 20): Promise<{ content: InventoryMovement[], totalElements: number, totalPages: number }> {
    const response = await api.get(`/inventory-movements/date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&size=${size}`);
    return response.data;
  }

  async getMovementsByType(movementType: MovementType, page = 0, size = 20): Promise<{ content: InventoryMovement[], totalElements: number, totalPages: number }> {
    const response = await api.get(`/inventory-movements/type/${movementType}?page=${page}&size=${size}`);
    return response.data;
  }

  async createInventoryMovement(movement: InventoryMovementDTO): Promise<InventoryMovement> {
    const response = await api.post('/inventory-movements', movement);
    return response.data;
  }

  async updateInventoryMovement(id: string, movement: InventoryMovementDTO): Promise<InventoryMovement> {
    const response = await api.put(`/inventory-movements/${id}`, movement);
    return response.data;
  }

  async deleteInventoryMovement(id: string): Promise<void> {
    await api.delete(`/inventory-movements/${id}`);
  }

  // ===== REPORTS =====

  async getInventoryReport(): Promise<InventoryReport> {
    const response = await api.get('/inventory-items/report');
    return response.data;
  }

  async getCategoryReport(): Promise<any> {
    const response = await api.get('/inventory-items/category-report');
    return response.data;
  }

  async getMovementReport(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/inventory-movements/report?${params.toString()}`);
    return response.data;
  }

  // ===== UTILITIES =====

  async getCategories(): Promise<ItemCategory[]> {
    return Object.values(ItemCategory);
  }

  async getTypes(): Promise<ItemType[]> {
    return Object.values(ItemType);
  }

  async getStatuses(): Promise<ItemStatus[]> {
    return Object.values(ItemStatus);
  }

  async getMovementTypes(): Promise<MovementType[]> {
    return Object.values(MovementType);
  }
}

const inventoryService = new InventoryService();
export default inventoryService; 