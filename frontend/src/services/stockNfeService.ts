import api from '@/lib/axios';

export interface StockNfeItemDTO {
  productCode: string;
  barcode: string;
  description: string;
  ncm: string;
  cst?: string;
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
  isService?: boolean;
  extractedBrand?: string;
  extractedModel?: string;
  extractedSize?: string;
}

export interface StockNfeInstallmentDTO {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  barcode?: string;
  linhaDigitavel?: string;
  boletoUrl?: string;
  originalBoletoName?: string;
  divergenceAlert?: string;
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
  supplierPhone?: string;
  supplierEmail?: string;
  existingSupplierId?: string;

  // Destinatário / Cliente
  customerCnpj?: string;
  customerName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZipCode?: string;
  customerPhone?: string;

  // Informações adicionais e identificação veicular
  additionalInfo?: string;
  vehiclePlate?: string;
  mileage?: number;

  alreadyImported: boolean;
  duplicateWarning?: string;
  isNfse?: boolean;
  suggestedServiceOrder?: string;
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
  ncm?: string;
  cst?: string;
  cfop?: string;
  unitMeasure?: string;
  quantity: number;
  unitCost: number;
  description?: string;
  barcode?: string;
  caNumber?: string;
  minimumQuantity?: number;
  tireBrand?: string;
  tireModel?: string;
  tireSize?: string;
  tireDot?: string;
  tireFireNumbers?: string[];
  tireSerialNumbers?: string[];
}

export interface ProcessInstallmentPayload {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  barcode?: string;
  linhaDigitavel?: string;
  boletoUrl?: string;
  originalBoletoName?: string;
  divergenceAlert?: string;
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
  supplierPhone?: string;
  supplierEmail?: string;
  supplierId?: string;
  createFinancialAccounts: boolean;
  forceImport?: boolean;
  boletoAttachmentUrl?: string;
  originalBoletoFileName?: string;
  isNfse?: boolean;
  workOrderId?: string;
  workOrderNumber?: string;
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

  async parsePdf(file: File): Promise<StockNfeParsedDTO> {
    // Se o arquivo for maior que 700KB, envia em chunks JSON (< 512KB) para contornar limites 413 de proxy/Nginx
    if (file.size > 700 * 1024) {
      return this.parsePdfChunked(file);
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post<StockNfeParsedDTO>('/api/stock/nfe/parse-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 413 || String(err?.message || '').includes('413')) {
        return this.parsePdfChunked(file);
      }
      throw err;
    }
  },

  async parsePdfChunked(file: File): Promise<StockNfeParsedDTO> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const CHUNK_SIZE = 384 * 1024; // 384KB por bloco (~512KB em Base64, abaixo de 1MB do Nginx)
    const totalChunks = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE));
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    let lastResponseData: any = null;
    for (let i = 0; i < totalChunks; i++) {
      const slice = bytes.subarray(i * CHUNK_SIZE, Math.min(bytes.length, (i + 1) * CHUNK_SIZE));
      let binary = '';
      const step = 0x8000;
      for (let j = 0; j < slice.length; j += step) {
        binary += String.fromCharCode.apply(null, Array.from(slice.subarray(j, j + step)));
      }
      const dataBase64 = btoa(binary);

      const response = await api.post('/api/stock/nfe/parse-pdf-chunk', {
        uploadId,
        chunkIndex: i,
        totalChunks,
        dataBase64,
        fileName: file.name || 'danfe.pdf',
      });
      lastResponseData = response.data;
    }

    return lastResponseData as StockNfeParsedDTO;
  },

  /** Detecta o tipo do arquivo e usa o endpoint de parse adequado (XML ou PDF/DANFE). */
  async parseNfe(file: File): Promise<StockNfeParsedDTO> {
    const isPdf = (file.name || '').toLowerCase().endsWith('.pdf')
      || file.type === 'application/pdf';
    return isPdf ? this.parsePdf(file) : this.parseXml(file);
  },

  async processNfe(payload: StockNfeProcessRequestDTO): Promise<StockNfeProcessResponseDTO> {
    const response = await api.post<StockNfeProcessResponseDTO>('/api/stock/nfe/process', payload);
    return response.data;
  },
};
