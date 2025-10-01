import api from '@/lib/axios';

export interface Holerite {
  id: string;
  employeeName: string;
  cpf: string;
  month: number;
  year: number;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  status: string;
  processedAt: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  // Campos adicionais específicos de holerites
  grossSalary?: number;
  netSalary?: number;
  deductions?: number;
  allowances?: number;
  workingDays?: number;
  workingHours?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface HoleriteFilters {
  employeeName?: string;
  cpf?: string;
  month?: number;
  year?: number;
  status?: string;
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
}

class HoleriteService {
  // Buscar todos os holerites
  async getAllHolerites(): Promise<Holerite[]> {
    try {
      console.log('🔍 Buscando todos os holerites...');
      const response = await api.get('/payslips');
      console.log('✅ Holerites carregados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao carregar holerites:', error);
      throw error;
    }
  }

  // Buscar holerites por ano
  async getHoleritesByYear(year: number): Promise<Holerite[]> {
    try {
      console.log(`🔍 Buscando holerites do ano ${year}...`);
      const response = await api.get(`/payslips/year/${year}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao carregar holerites do ano ${year}:`, error);
      throw error;
    }
  }

  // Buscar holerites por ano e mês
  async getHoleritesByYearAndMonth(year: number, month: number): Promise<Holerite[]> {
    try {
      console.log(`🔍 Buscando holerites de ${month}/${year}...`);
      const response = await api.get(`/payslips/year/${year}/month/${month}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao carregar holerites de ${month}/${year}:`, error);
      throw error;
    }
  }

  // Buscar anos únicos
  async getDistinctYears(): Promise<number[]> {
    try {
      console.log('🔍 Buscando anos únicos...');
      const holerites = await this.getAllHolerites();
      const years = [...new Set(holerites.map(h => h.year))].sort((a, b) => b - a);
      console.log('✅ Anos encontrados:', years);
      return years;
    } catch (error) {
      console.error('❌ Erro ao buscar anos únicos:', error);
      return [];
    }
  }

  // Buscar meses únicos por ano
  async getDistinctMonthsByYear(year: number): Promise<number[]> {
    try {
      console.log(`🔍 Buscando meses únicos do ano ${year}...`);
      const holerites = await this.getHoleritesByYear(year);
      const months = [...new Set(holerites.map(h => h.month))].sort((a, b) => a - b);
      console.log(`✅ Meses encontrados para ${year}:`, months);
      return months;
    } catch (error) {
      console.error(`❌ Erro ao buscar meses do ano ${year}:`, error);
      return [];
    }
  }

  // Upload de holerites
  async uploadHolerites(file: File): Promise<Holerite[]> {
    try {
      console.log('📤 Iniciando upload de holerites:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/payslips/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos para processamento
      });
      
      console.log('✅ Upload realizado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload de holerites:', error);
      throw error;
    }
  }

  // Upload e envio unificado
  async uploadProcessAndSend(
    file: File, 
    tipo: string, 
    assunto?: string, 
    mensagem?: string,
    funcionarioId?: string,
    funcionarioIds?: string[]
  ): Promise<ProcessingResult> {
    try {
      console.log('📤 Iniciando upload e envio unificado:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', tipo);
      if (assunto) formData.append('assunto', assunto);
      if (mensagem) formData.append('mensagem', mensagem);
      if (funcionarioId) formData.append('funcionarioId', funcionarioId);
      if (funcionarioIds) {
        funcionarioIds.forEach(id => formData.append('funcionarioIds', id));
      }
      
      const response = await api.post('/payslips/upload-and-send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutos para processamento e envio
      });
      
      console.log('✅ Upload e envio realizados com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload e envio:', error);
      throw error;
    }
  }

  // Download de holerite
  async downloadHolerite(fileName: string): Promise<Blob> {
    try {
      console.log('📥 Iniciando download do holerite:', fileName);
      
      const response = await api.get(`/payslips/download/${fileName}`, {
        responseType: 'blob',
      });
      
      console.log('✅ Download realizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer download do holerite:', error);
      throw error;
    }
  }

  // Excluir holerite individual
  async deleteHolerite(id: string): Promise<void> {
    try {
      console.log('🗑️ Excluindo holerite:', id);
      
      await api.delete(`/payslips/${id}`);
      
      console.log('✅ Holerite excluído com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir holerite:', error);
      throw error;
    }
  }

  // Excluir múltiplos holerites
  async deleteMultipleHolerites(ids: string[]): Promise<{ deleted: number; failed: number; errors: string[]; invalidIds?: string[]; invalidCount?: number }> {
    try {
      console.log('🗑️ Excluindo múltiplos holerites:', ids);
      
      const response = await api.post('/payslips/delete-multiple', { ids });
      
      console.log('✅ Holerites excluídos com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao excluir múltiplos holerites:', error);
      
      // Se for um erro 400, tentar extrair informações do response
      if (error.response?.status === 400 && error.response?.data) {
        const errorData = error.response.data;
        console.error('Detalhes do erro 400:', errorData);
        
        // Se contém informações sobre IDs inválidos, logar
        if (errorData.invalidIds) {
          console.error('IDs inválidos encontrados:', errorData.invalidIds);
        }
      }
      
      throw error;
    }
  }

  // Buscar holerites processados
  async getProcessedHolerites(): Promise<Holerite[]> {
    try {
      console.log('🔍 Buscando holerites processados...');
      const holerites = await this.getAllHolerites();
      const processed = holerites.filter(h => h.status === 'PROCESSED' || h.processedAt);
      console.log('✅ Holerites processados encontrados:', processed.length);
      return processed;
    } catch (error) {
      console.error('❌ Erro ao buscar holerites processados:', error);
      return [];
    }
  }

  // Buscar holerites por CPF
  async getHoleritesByCpf(cpf: string): Promise<Holerite[]> {
    try {
      console.log('🔍 Buscando holerites por CPF:', cpf);
      const response = await api.get(`/payslips/cpf/${cpf}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar holerites por CPF:', error);
      throw error;
    }
  }

  // Buscar holerites por funcionário
  async getHoleritesByEmployee(employeeName: string): Promise<Holerite[]> {
    try {
      console.log('🔍 Buscando holerites por funcionário:', employeeName);
      const holerites = await this.getAllHolerites();
      return holerites.filter(h => 
        h.employeeName.toLowerCase().includes(employeeName.toLowerCase())
      );
    } catch (error) {
      console.error('❌ Erro ao buscar holerites por funcionário:', error);
      return [];
    }
  }

  // Debug de conteúdo de holerite
  async debugHoleriteContent(file: File): Promise<any> {
    try {
      console.log('🔍 Iniciando debug do conteúdo:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/payslips/debug', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Debug realizado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer debug do holerite:', error);
      throw error;
    }
  }

  // Verificar status de processamento assíncrono
  async getProcessingStatus(sessionId: string): Promise<any> {
    try {
      console.log('🔍 Verificando status de processamento:', sessionId);
      
      const response = await api.get(`/payslips/status/${sessionId}`);
      
      console.log('✅ Status obtido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw error;
    }
  }
}

export default new HoleriteService();
