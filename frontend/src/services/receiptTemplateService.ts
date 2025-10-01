import api from '@/lib/axios';
import html2pdf from 'html2pdf.js';

export interface PaymentReceiptData {
  // Dados da conta debitada (empresa)
  debitedAgency: string;
  debitedAccount: string;
  debitedName: string;
  
  // Dados da conta creditada (funcionário)
  creditedAgency: string;
  creditedAccount: string;
  creditedName: string;
  
  // Valor da transação
  amount: number;
  
  // Data e hora da transação
  transactionDate: string;
  transactionTime: string;
  
  // Número de controle
  controlNumber: string;
  
  // Código de autenticação
  authenticationCode: string;
  
  // Identificação no extrato
  statementIdentification: string;
}



export interface ReceiptTemplateRequest {
  receiptId: string;
  employeeId?: string;
  employeeName?: string;
  amount: number;
  month: number;
  year: number;
  transactionDate?: string;
  transactionTime?: string;
}

export interface ReceiptTemplateResponse {
  success: boolean;
  data?: PaymentReceiptData;
  error?: string;
}

class ReceiptTemplateService {
  /**
   * Gera dados de template para um recibo específico
   */
  async generateReceiptTemplate(receiptId: string): Promise<ReceiptTemplateResponse> {
    try {
      // Buscar dados do recibo na API
      const receiptResponse = await api.get(`/api/receipts/${receiptId}`);
      const receipt = receiptResponse.data;

      // Buscar dados do funcionário se necessário
      let employeeData = null;
      if (receipt.employeeId) {
        try {
          const employeeResponse = await api.get(`/api/employees/${receipt.employeeId}`);
          employeeData = employeeResponse.data;
        } catch (error) {
          console.warn('Não foi possível buscar dados do funcionário:', error);
        }
      }

      // Gerar código de autenticação único
      const authenticationCode = this.generateAuthenticationCode(receiptId, receipt.amount);

      // Gerar número de controle
      const controlNumber = this.generateControlNumber(receiptId);

      // Preparar dados do template usando dados reais do backend
      const templateData: PaymentReceiptData = {
        // Dados da conta debitada (empresa) - usar dados extraídos do PDF
        debitedAgency: receipt.debitedAgency || "0925",
        debitedAccount: receipt.debitedAccount || "98240 - 7", 
        debitedName: receipt.debitedName || "PROMOVER VIGILANCIA PATRIMONIA",
        
        // Dados da conta creditada (funcionário) - usar dados extraídos do PDF
        creditedAgency: receipt.creditedAgency || "3804",
        creditedAccount: receipt.creditedAccount || "68007 - 6",
        creditedName: receipt.creditedName || receipt.employeeName || "FUNCIONARIO",
        
        // Valor da transação - usar dados reais
        amount: receipt.netSalary || 0,
        
        // Data e hora da transação - usar dados extraídos do PDF
        transactionDate: receipt.transferDate || receipt.paymentDate || new Date().toISOString().split('T')[0],
        transactionTime: receipt.transferTime || new Date().toLocaleTimeString('pt-BR'),
        
        // Número de controle - usar dados extraídos do PDF
        controlNumber: receipt.controlNumber || controlNumber,
        
        // Código de autenticação - usar dados extraídos do PDF
        authenticationCode: receipt.authenticationCode || authenticationCode,
        
        // Identificação no extrato - usar dados reais
        statementIdentification: receipt.statementIdentification || `SISPAG SALARIOS ${receipt.month}/${receipt.year}`
      };

      return {
        success: true,
        data: templateData
      };

    } catch (error) {
      console.error('Erro ao gerar template do recibo:', error);
      return {
        success: false,
        error: 'Erro ao gerar template do recibo'
      };
    }
  }

  /**
   * Gera dados de template para múltiplos recibos
   */
  async generateMultipleReceiptTemplates(receiptIds: string[]): Promise<ReceiptTemplateResponse[]> {
    const promises = receiptIds.map(id => this.generateReceiptTemplate(id));
    return Promise.all(promises);
  }

  /**
   * Gera código de autenticação único baseado no ID do recibo e valor
   */
  private generateAuthenticationCode(receiptId: string, amount: number): string {
    const timestamp = Date.now().toString();
    const data = `${receiptId}-${amount}-${timestamp}`;
    
    // Simular hash SHA-256 (em produção, use uma biblioteca real)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16).toUpperCase().padStart(40, '0');
  }

  /**
   * Gera número de controle único
   */
  private generateControlNumber(receiptId: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const hash = this.simpleHash(receiptId);
    
    return `${timestamp}${random}${hash}`.substring(0, 15);
  }

  /**
   * Hash simples para geração de números de controle
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString().substring(0, 6);
  }

  /**
   * Valida dados do template
   */
  validateTemplateData(data: PaymentReceiptData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.debitedAgency || data.debitedAgency.trim() === '') {
      errors.push('Agência debitada é obrigatória');
    }

    if (!data.debitedAccount || data.debitedAccount.trim() === '') {
      errors.push('Conta debitada é obrigatória');
    }

    if (!data.debitedName || data.debitedName.trim() === '') {
      errors.push('Nome da conta debitada é obrigatório');
    }

    if (!data.creditedAgency || data.creditedAgency.trim() === '') {
      errors.push('Agência creditada é obrigatória');
    }

    if (!data.creditedAccount || data.creditedAccount.trim() === '') {
      errors.push('Conta creditada é obrigatória');
    }

    if (!data.creditedName || data.creditedName.trim() === '') {
      errors.push('Nome da conta creditada é obrigatório');
    }

    if (data.amount <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!data.transactionDate) {
      errors.push('Data da transação é obrigatória');
    }

    if (!data.transactionTime) {
      errors.push('Hora da transação é obrigatória');
    }

    if (!data.controlNumber || data.controlNumber.trim() === '') {
      errors.push('Número de controle é obrigatório');
    }

    if (!data.authenticationCode || data.authenticationCode.trim() === '') {
      errors.push('Código de autenticação é obrigatório');
    }

    if (!data.statementIdentification || data.statementIdentification.trim() === '') {
      errors.push('Identificação no extrato é obrigatória');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formata dados para exibição
   */
  formatTemplateData(data: PaymentReceiptData): PaymentReceiptData {
    return {
      ...data,
      debitedName: data.debitedName.toUpperCase(),
      creditedName: data.creditedName.toUpperCase(),
      statementIdentification: data.statementIdentification.toUpperCase()
    };
  }

  /**
   * Download do PDF gerado pelo backend
   */
  async downloadReceiptPdf(receiptId: string): Promise<Blob> {
    try {
      const response = await api.get(`/api/receipts/${receiptId}/generate-pdf`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao baixar PDF do recibo:', error);
      throw new Error('Erro ao baixar PDF do recibo');
    }
  }
}

export default new ReceiptTemplateService();
