import api from '@/lib/axios';

export interface StockNfeItemDTO {
  productCode: string;
  barcode: string;
  description: string;
  ncm: string;
  cfop: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  matchedStockItemId?: string;
  matchedStockItemCode?: string;
  matchedStockItemName?: string;
  matchedStockItemQuantity?: number;
  suggestedCategory?: string;
  isBattery?: boolean;
  isTire?: boolean;
}

export interface StockNfeInstallmentDTO {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  barcode?: string;
}

export interface StockNfeParsedDTO {
  accessKey: string;
  invoiceNumber: string;
  series: string;
  issueDate: string;
  totalProductsAmount: number;
  totalInvoiceAmount: number;
  shippingAmount: number;
  discountAmount: number;
  supplierCnpj: string;
  supplierName: string;
  supplierTradeName?: string;
  supplierAddress?: string;
  supplierCity?: string;
  supplierState?: string;
  supplierZipCode?: string;
  existingSupplierId?: string;
  alreadyImported: boolean;
  duplicateWarning?: string;
  items: StockNfeItemDTO[];
  installments: StockNfeInstallmentDTO[];
}

export interface ProcessItemPayload {
  action: 'LINK_EXISTING' | 'CREATE_NEW';
  stockItemId?: string;
  code: string;
  name: string;
  category: string;
  unitName?: string;
  unitId?: string;
  quantity: number;
  unitCost: number;
  description?: string;
  barcode?: string;
  caNumber?: string;
  minimumQuantity?: number;
}

export interface ProcessInstallmentPayload {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  barcode?: string;
  notes?: string;
}

export interface StockNfeProcessRequestDTO {
  accessKey?: string;
  invoiceNumber: string;
  series?: string;
  issueDate?: string;
  totalAmount: number;
  supplierCnpj?: string;
  supplierName: string;
  supplierTradeName?: string;
  supplierAddress?: string;
  supplierCity?: string;
  supplierState?: string;
  supplierZipCode?: string;
  supplierId?: string;
  createFinancialAccounts: boolean;
  items: ProcessItemPayload[];
  installments: ProcessInstallmentPayload[];
}

export interface StockNfeProcessResponseDTO {
  success: boolean;
  message: string;
  supplierId?: string;
  supplierName?: string;
  itemsCreated: number;
  itemsUpdated: number;
  batteriesCreated: number;
  tiresCreated: number;
  financialAccountsCreated: number;
  details: string[];
}

export const stockNfeService = {
  async parseXml(file: File): Promise<StockNfeParsedDTO> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<StockNfeParsedDTO>('/api/stock/nfe/parse-xml', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async processNfe(payload: StockNfeProcessRequestDTO): Promise<StockNfeProcessResponseDTO> {
    const response = await api.post<StockNfeProcessResponseDTO>('/api/stock/nfe/process', payload);
    return response.data;
  },
};
