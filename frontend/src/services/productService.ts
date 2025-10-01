import api from '@/lib/axios';

export interface Product {
  id: string;
  name: string;
  description?: string;
  code?: string;
  barcode?: string;
  category?: string;
  brand?: string;
  model?: string;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  status: string;
  location?: string;
  supplier?: string;
  shelfLife?: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: string;
  storageConditions?: string;
  notes?: string;
  unitId?: string;
  unitName?: string;
  lastInventoryDate?: string;
  nextInventoryDate?: string;
  lastPurchaseDate?: string;
  lastSaleDate?: string;
  averageConsumption?: number;
  consumptionPeriod?: string;
  safetyStock?: number;
  leadTime?: number;
  abcClassification?: string;
  turnoverRate?: number;
  daysOfInventory?: number;
  createdAt: string;
  updatedAt: string;
  
  // Campos calculados
  stockStatus: string;
  stockLevel: number;
  lowStock: boolean;
  overStock: boolean;
  needsReorder: boolean;
  reorderQuantity: number;
  
  // Campos para variações de produtos
  size?: string; // Tamanho (P, M, G, GG, 36, 37, 38, etc.)
  color?: string; // Cor (Cinza, Preto, Branco, Azul, etc.)
  productType?: string; // Tipo (Padrão, Social, Convencional, Nilon, Táticos, etc.)
  footwearSize?: string; // Numeração para calçados (36, 37, 38, etc.)
  clothingSize?: string; // Tamanho para roupas (P, M, G, GG, etc.)
  beltSize?: string; // Tamanho para cintos (90, 95, 100, etc.)
  material?: string; // Material (Algodão, Poliéster, Couro, etc.)
  style?: string; // Estilo (Casual, Formal, Esportivo, etc.)
  gender?: string; // Gênero (Masculino, Feminino, Unissex)
  season?: string; // Estação (Verão, Inverno, Primavera, Outono, Todas)
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  code?: string;
  barcode?: string;
  category?: string;
  brand?: string;
  model?: string;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  currentStock?: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderPoint?: number;
  status?: string;
  location?: string;
  supplier?: string;
  shelfLife?: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: string;
  storageConditions?: string;
  notes?: string;
  unitId?: string;
  averageConsumption?: number;
  consumptionPeriod?: string;
  safetyStock?: number;
  leadTime?: number;
  abcClassification?: string;
  turnoverRate?: number;
  daysOfInventory?: number;
  // Campos para variações de produtos
  size?: string;
  color?: string;
  productType?: string;
  footwearSize?: string;
  clothingSize?: string;
  beltSize?: string;
  material?: string;
  style?: string;
  gender?: string;
  season?: string;
}

export interface UpdateProductRequest extends CreateProductRequest {
  id: string;
}

class ProductService {
  async getAllProducts(): Promise<Product[]> {
    const response = await api.get('/products');
    return response.data;
  }

  async getProductById(id: string): Promise<Product> {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  }

  async createProduct(product: CreateProductRequest): Promise<Product> {
    const response = await api.post('/products', product);
    return response.data;
  }

  async updateProduct(id: string, product: UpdateProductRequest): Promise<Product> {
    const response = await api.put(`/api/products/${id}`, product);
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/products/${id}`);
  }

  async getLowStockProducts(): Promise<Product[]> {
    const response = await api.get('/products/low-stock');
    return response.data;
  }

  async getOverStockProducts(): Promise<Product[]> {
    const response = await api.get('/products/over-stock');
    return response.data;
  }

  async getProductsNeedingReorder(): Promise<Product[]> {
    const response = await api.get('/products/needing-reorder');
    return response.data;
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const response = await api.get(`/api/products/search?searchTerm=${encodeURIComponent(searchTerm)}`);
    return response.data;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const response = await api.get(`/api/products/category/${encodeURIComponent(category)}`);
    return response.data;
  }

  async getProductsByUnit(unitId: string): Promise<Product[]> {
    const response = await api.get(`/api/products/unit/${unitId}`);
    return response.data;
  }

  async getProductsBySupplier(supplier: string): Promise<Product[]> {
    const response = await api.get(`/api/products/supplier/${encodeURIComponent(supplier)}`);
    return response.data;
  }

  async getProductsByAbcClassification(classification: string): Promise<Product[]> {
    const response = await api.get(`/api/products/abc-classification/${classification}`);
    return response.data;
  }

  async getActiveProductsCount(): Promise<number> {
    const response = await api.get('/products/stats/active-count');
    return response.data;
  }

  async getLowStockProductsCount(): Promise<number> {
    const response = await api.get('/products/stats/low-stock-count');
    return response.data;
  }

  async getOutOfStockProductsCount(): Promise<number> {
    const response = await api.get('/products/stats/out-of-stock-count');
    return response.data;
  }

  async getTotalInventoryValue(): Promise<number> {
    const response = await api.get('/products/stats/total-inventory-value');
    return response.data;
  }
}

export const productService = new ProductService();