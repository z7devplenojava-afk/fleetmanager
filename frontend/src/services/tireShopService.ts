import api from '@/lib/axios';

export interface TireShopCatalogItem {
  id: string;
  companyId?: string;
  code?: string;
  name: string;
  description?: string;
  defaultPrice: number;
  requiresPickup: boolean;
  active: boolean;
}

export interface TireShopServiceRecord {
  id: string;
  companyId?: string;
  serviceNumber: string;
  catalogServiceId?: string;
  serviceName: string;
  supplierId: string;
  supplierName?: string;
  supplierCnpj?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleFleetNumber?: string;
  tireIds?: string[];
  tireLabelsSummary?: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  serviceDate: string;
  dueDate?: string;
  boletoUrl?: string;
  boletoOriginalName?: string;
  linhaDigitavel?: string;
  barcode?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceStatus?: string;
  invoiceDueDate?: string;
  invoicePaymentDate?: string;
  nfNumber?: string;
  nfKey?: string;
  nfUrl?: string;
  nfOriginalName?: string;
  beneficiaryName?: string;
  beneficiaryCnpj?: string;
  generatePayable: boolean;
  notes?: string;
  createdByName?: string;
  createdAt?: string;
}

class TireShopServiceApi {
  async getCatalog(): Promise<TireShopCatalogItem[]> {
    const response = await api.get<TireShopCatalogItem[]>('/api/tires/shop-services/catalog');
    return response.data;
  }

  async createCatalogItem(payload: Partial<TireShopCatalogItem>): Promise<TireShopCatalogItem> {
    const response = await api.post<TireShopCatalogItem>('/api/tires/shop-services/catalog', payload);
    return response.data;
  }

  async updateCatalogItem(id: string, payload: Partial<TireShopCatalogItem>): Promise<TireShopCatalogItem> {
    const response = await api.put<TireShopCatalogItem>(`/api/tires/shop-services/catalog/${id}`, payload);
    return response.data;
  }

  async deleteCatalogItem(id: string): Promise<void> {
    await api.delete(`/api/tires/shop-services/catalog/${id}`);
  }

  async getAll(): Promise<TireShopServiceRecord[]> {
    const response = await api.get<TireShopServiceRecord[]>('/api/tires/shop-services');
    return response.data;
  }

  async create(payload: Partial<TireShopServiceRecord>): Promise<TireShopServiceRecord> {
    const response = await api.post<TireShopServiceRecord>('/api/tires/shop-services', payload);
    return response.data;
  }

  async update(id: string, payload: Partial<TireShopServiceRecord>): Promise<TireShopServiceRecord> {
    const response = await api.put<TireShopServiceRecord>(`/api/tires/shop-services/${id}`, payload);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/api/tires/shop-services/${id}`);
  }
}

export default new TireShopServiceApi();

