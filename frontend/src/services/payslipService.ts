import api from '@/lib/axios';

export interface Payslip {
  id: number;
  employeeName: string;
  cpf: string;
  month: string;
  year: string;
  fileName: string;
  processedAt: string;
}

export interface PayslipFilters {
  employeeName?: string;
  cpf?: string;
  month?: string;
  year?: string;
}

export interface ProcessingResult {
  fileName: string;
  startTime: string;
  endTime: string;
  processingSuccess: boolean;
  envioSuccess: boolean;
  holeritesProcessed: number;
  totalEnviados: number;
  totalFalhas: number;
  message: string;
  status: string;
  durationMs: number;
  envioResponse?: any;
}

export interface ProcessingStatus {
  sessionId: string;
  status: string;
  message: string;
}

export const payslipService = {
  // Buscar todos os holerites
  async getPayslips(filters: PayslipFilters = {}): Promise<Payslip[]> {
    const params = new URLSearchParams();
    
    if (filters.employeeName) params.append('employeeName', filters.employeeName);
    if (filters.cpf) params.append('cpf', filters.cpf);
    if (filters.month) params.append('month', filters.month);
    if (filters.year) params.append('year', filters.year);
    
    const response = await api.get(`/payslips${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  async getAllPayslips(): Promise<Payslip[]> {
    // Verificar se é um colaborador e filtrar por CPF
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('👤 PayslipService - Usuário logado:', user.name, 'Role:', user.role);
      
      // Se for COLABORADOR, filtrar por CPF (username é o CPF)
      if (user.role === 'COLABORADOR' && user.username) {
        console.log('🔒 PayslipService - Filtrando por CPF:', user.username);
        return this.getPayslips({ cpf: user.username });
      }
    }
    
    return this.getPayslips();
  },

  // Upload simples (apenas processamento)
  async uploadPayslips(file: File): Promise<Payslip[]> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/payslips/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ==================== NOVOS ENDPOINTS UNIFICADOS ====================

  // Upload + Processamento + Envio (síncrono)
  async uploadProcessAndSend(
    file: File,
    tipo: 'email' | 'whatsapp',
    options: {
      assunto?: string;
      mensagem?: string;
      funcionarioId?: number;
      funcionarioIds?: number[];
    } = {}
  ): Promise<ProcessingResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    
    if (options.assunto) formData.append('assunto', options.assunto);
    if (options.mensagem) formData.append('mensagem', options.mensagem);
    if (options.funcionarioId) formData.append('funcionarioId', options.funcionarioId.toString());
    if (options.funcionarioIds) {
      options.funcionarioIds.forEach(id => formData.append('funcionarioIds', id.toString()));
    }

    const response = await api.post('/payslips/upload-and-send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload + Processamento + Envio (assíncrono)
  async uploadProcessAndSendAsync(
    file: File,
    tipo: 'email' | 'whatsapp',
    options: {
      assunto?: string;
      mensagem?: string;
      funcionarioId?: number;
      funcionarioIds?: number[];
    } = {}
  ): Promise<{ sessionId: string; status: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    
    if (options.assunto) formData.append('assunto', options.assunto);
    if (options.mensagem) formData.append('mensagem', options.mensagem);
    if (options.funcionarioId) formData.append('funcionarioId', options.funcionarioId.toString());
    if (options.funcionarioIds) {
      options.funcionarioIds.forEach(id => formData.append('funcionarioIds', id.toString()));
    }

    const response = await api.post('/payslips/upload-and-send-async', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Verificar status do processamento assíncrono
  async getProcessingStatus(sessionId: string): Promise<ProcessingStatus> {
    const response = await api.get(`/payslips/status/${sessionId}`);
    return response.data;
  },

  // ==================== ENDPOINTS EXISTENTES ====================

  // Debug de PDF
  async debugPayslip(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/payslips/debug', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Baixar holerite por ID (recomendado - mais preciso)
  async downloadPayslipById(id: string): Promise<Blob> {
    console.log('🔍 PayslipService - Tentando baixar pelo ID:', id);
    try {
      const response = await api.get(`/payslips/download-by-id/${id}`, {
        responseType: 'blob',
      });
      console.log('✅ PayslipService - Download bem-sucedido, tamanho:', response.data.size);
      return response.data;
    } catch (error: any) {
      console.error('❌ PayslipService - Erro ao baixar pelo ID:', error);
      throw error;
    }
  },

  // Baixar holerite por fileName (fallback - pode retornar holerite errado se houver múltiplos)
  async downloadPayslip(fileName: string): Promise<Blob> {
    console.log('🔍 PayslipService - Tentando baixar:', fileName);
    try {
      const response = await api.get(`/payslips/download/${encodeURIComponent(fileName)}`, {
        responseType: 'blob',
      });
      console.log('✅ PayslipService - Download bem-sucedido, tamanho:', response.data.size);
      return response.data;
    } catch (error: any) {
      console.warn('⚠️ PayslipService - Falha no endpoint principal, tentando fallback', error?.response?.status);
      if (error?.response?.status !== 404) {
        throw error;
      }

      const fallbackResponse = await api.get(`/payslips/test-download/${encodeURIComponent(fileName)}`, {
        responseType: 'blob',
      });
      console.log('✅ PayslipService - Download via fallback bem-sucedido, tamanho:', fallbackResponse.data.size);
      return fallbackResponse.data;
    }
  },

  // ==================== NOVOS ENDPOINTS DE GERENCIAMENTO ====================

  // Excluir holerite individual
  async deletePayslip(id: number): Promise<void> {
    await api.delete(`/payslips/${id}`);
  },

  // Excluir múltiplos holerites
  async deleteMultiple(ids: number[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
    const response = await api.post('/payslips/delete-multiple', { ids });
    return response.data;
  },

  // Buscar holerite por ID
  async getPayslipById(id: number): Promise<Payslip> {
    const response = await api.get(`/payslips/${id}`);
    return response.data;
  },

  // Atualizar holerite
  async updatePayslip(id: number, data: Partial<Payslip>): Promise<Payslip> {
    const response = await api.put(`/payslips/${id}`, data);
    return response.data;
  },

  // Buscar estatísticas de holerites
  async getPayslipStats(): Promise<{
    total: number;
    byMonth: Record<string, number>;
    byYear: Record<string, number>;
    recentUploads: number;
  }> {
    const response = await api.get('/payslips/stats');
    return response.data;
  }
}; 