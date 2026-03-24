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
  companyName?: string;
  companyCnpj?: string;
  companySigla?: string;
  companyId?: string;
  workPostName?: string;
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

export interface HoleriteOrganizedEntry {
  id: string;
  employeeName: string;
  cpf: string;
  month: number;
  year: number;
  fileName: string;
  companySigla: string;
  companyName: string;
  companyCnpj: string;
  sectorName: string;
  workPostName?: string;
  processedAt?: string;
}

export interface HoleritePeriodGroup {
  month: number;
  year: number;
  formattedPeriod: string;
  totalPayslips: number;
  payslips: HoleriteOrganizedEntry[];
}

export interface HoleriteSectorGroup {
  sectorName: string;
  normalizedSectorName: string;
  totalPayslips: number;
  periods: HoleritePeriodGroup[];
}

export interface HoleriteCompanyGroup {
  companyId?: string;
  companySigla: string;
  companyName: string;
  companyCnpj: string;
  totalPayslips: number;
  sectors: HoleriteSectorGroup[];
}

export interface HoleriteOrganizationResponse {
  generatedAt?: string;
  totalPayslips: number;
  totalCompanies: number;
  totalSectors: number;
  companies: HoleriteCompanyGroup[];
}

export interface CompanyTypeOrganizationResponse {
  generatedAt?: string;
  totalPayslips: number;
  totalCompanies: number;
  totalSectors: number;
  terceirizacao: CompanyTypeGroup;
  vigilancia: CompanyTypeGroup;
  administrativo: CompanyTypeGroup;
}

export interface CompanyTypeGroup {
  typeName: string;
  typeCode: string;
  totalCompanies: number;
  totalPayslips: number;
  totalSectors: number;
  companies: HoleriteCompanyGroup[];
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
  // Envio individual
  async sendIndividual(funcionarioId: string, tipo: 'email' | 'whatsapp', mensagem?: string, assunto?: string): Promise<any> {
    const payload: any = { tipo, funcionarioId };
    if (mensagem) payload.mensagem = mensagem;
    if (assunto) payload.assunto = assunto;
    const response = await api.post('/api/envio/individual', payload);
    return response.data;
  }

  // Envio em massa
  async sendBatch(funcionarioIds: string[], tipo: 'email' | 'whatsapp', mensagem?: string, assunto?: string): Promise<any> {
    const payload: any = { tipo, funcionarioIds };
    if (mensagem) payload.mensagem = mensagem;
    if (assunto) payload.assunto = assunto;
    const response = await api.post('/api/envio/massa', payload);
    return response.data;
  }

  // Reenvio por log
  async resendByLog(logId: string): Promise<any> {
    const response = await api.post(`/api/envio/resend/${logId}`);
    return response.data;
  }

  // Listar logs
  async listSendLogs(cpf?: string, month?: number, year?: number): Promise<any[]> {
    const params: any = {};
    if (cpf) params.cpf = cpf;
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get('/envio/logs', { params });
    return response.data || [];
  }
  // Buscar todos os holerites
  async getAllHolerites(): Promise<Holerite[]> {
    try {
      console.log('🔍 Buscando todos os holerites...');
      
      // Verificar se é um colaborador e filtrar por CPF
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 Usuário logado:', user.name, 'Role:', user.role);
        
        // Se for COLABORADOR, filtrar por CPF (username é o CPF)
        if (user.role === 'COLABORADOR' && user.username) {
          console.log('🔒 Filtrando holerites por CPF:', user.username);
          const response = await api.get(`/payslips?cpf=${user.username}`);
          console.log('✅ Holerites do colaborador carregados:', response.data.length);
          return response.data;
        }
      }
      
      // Para outros roles, buscar todos
      const response = await api.get('/payslips');
      console.log('✅ Holerites carregados:', response.data.length);
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

  // Download de holerite por ID (recomendado - mais preciso)
  async downloadHoleriteById(id: string): Promise<Blob> {
    try {
      console.log('📥 Iniciando download do holerite pelo ID:', id);
      
      const response = await api.get(`/payslips/download-by-id/${id}`, {
        responseType: 'blob',
      });
      
      console.log('✅ Download realizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer download do holerite:', error);
      throw error;
    }
  }

  // Download de holerite por fileName (fallback - pode retornar holerite errado se houver múltiplos)
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

  // Download em lote por empresa (ZIP)
  async downloadByCompany(companyName: string): Promise<Blob> {
    try {
      console.log('📦 Iniciando download em lote por empresa:', companyName);
      
      const response = await api.get(`/unified-documents/download/company`, {
        params: { name: companyName },
        responseType: 'blob',
      });
      
      console.log('✅ Download em lote por empresa realizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer download em lote por empresa:', error);
      throw error;
    }
  }

  // Download em lote por setor (ZIP)
  async downloadBySector(sectorName: string): Promise<Blob> {
    try {
      console.log('📦 Iniciando download em lote por setor:', sectorName);
      
      const response = await api.get(`/unified-documents/download/sector`, {
        params: { name: sectorName },
        responseType: 'blob',
      });
      
      console.log('✅ Download em lote por setor realizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer download em lote por setor:', error);
      throw error;
    }
  }

  // Download em lote por período (ZIP) - dentro de um setor
  // Nota: O backend não tem endpoint específico para período, então usamos o endpoint de setor
  // e filtramos os holerites do período específico no frontend antes de fazer o download
  async downloadByPeriod(sectorName: string, month: number, year: number): Promise<Blob> {
    try {
      console.log('📦 Iniciando download em lote por período:', { sectorName, month, year });
      
      // Por enquanto, usamos o endpoint de setor que retorna todos os holerites do setor
      // O backend pode ser atualizado no futuro para suportar filtro por período
      const response = await api.get(`/unified-documents/download/sector`, {
        params: { name: sectorName },
        responseType: 'blob',
      });
      
      console.log('✅ Download em lote por período realizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer download em lote por período:', error);
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

  async getOrganizationByCompany(): Promise<HoleriteOrganizationResponse> {
    try {
      console.log('📊 Buscando organização de holerites por empresa/setor/período...');
      const response = await api.get('/payslips/organization');
      return response.data as HoleriteOrganizationResponse;
    } catch (error) {
      console.error('❌ Erro ao carregar organização de holerites:', error);
      throw error;
    }
  }

  async getOrganizationByCompanyType(): Promise<CompanyTypeOrganizationResponse> {
    try {
      console.log('📊 Buscando organização de holerites por tipo de empresa...');
      const response = await api.get('/payslips/organization-by-type');
      return response.data as CompanyTypeOrganizationResponse;
    } catch (error) {
      console.error('❌ Erro ao carregar organização de holerites por tipo:', error);
      throw error;
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
  async getProcessingStatus(sessionId: string): Promise<unknown> {
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
