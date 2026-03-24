import api from '@/lib/axios';

export interface UnifiedDocument {
  fileName: string;
  filePath?: string;
  employeeName?: string;
  cpf?: string;
  month?: number;
  year?: number;
  [key: string]: unknown;
}

export const unifiedDocumentService = {
  /**
   * Busca todos os documentos unificados do colaborador logado
   * Backend já filtra por CPF para ROLE_COLABORADOR
   */
  async getAllUnifiedDocuments(): Promise<UnifiedDocument[]> {
    try {
      // Verificar se é um colaborador para adicionar filtro por CPF
      const userStr = localStorage.getItem('user');
      let cpfParam = '';
      
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 UnifiedDocumentService - Usuário logado:', user.name, 'Role:', user.role);
        
        // Se for COLABORADOR, adicionar filtro por CPF (username é o CPF)
        if (user.role === 'COLABORADOR' && user.username) {
          console.log('🔒 UnifiedDocumentService - Filtrando por CPF:', user.username);
          cpfParam = `?cpf=${user.username}`;
        }
      }
      
      // Tentar primeiro o endpoint protegido (quando as permissões estiverem funcionando)
      try {
        const response = await api.get(`/unified-documents/list${cpfParam}`);
        if (response.data && response.data.documents) {
          return normalizeDocuments(response.data.documents);
        }
        return normalizeDocuments(response.data || []);
      } catch (protectedError) {
        console.warn('Endpoint protegido falhou, tentando público:', protectedError);
        
        // Fallback para endpoint público
        const publicResponse = await api.get(`/unified-documents/public/list${cpfParam}`);
        if (publicResponse.data && publicResponse.data.documents) {
          return normalizeDocuments(publicResponse.data.documents);
        }
        return normalizeDocuments(publicResponse.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar documentos unificados:', error);
      return [];
    }
  },

  /**
   * Baixa um documento unificado
   */
  async downloadUnifiedDocument(fileName: string): Promise<void> {
    try {
      const response = await api.get(`/unified-documents/download/${encodeURIComponent(fileName)}`, {
        responseType: 'blob'
      });

      // Criar link temporário para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar documento unificado:', error);
      throw error;
    }
  },

  async fetchUnifiedDocumentBlob(fileName: string): Promise<Blob> {
    try {
      const response = await api.get(`/unified-documents/view/${encodeURIComponent(fileName)}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar blob do documento unificado:', error);
      throw error;
    }
  },

  /**
   * Visualiza um documento unificado em nova aba
   */
  async viewUnifiedDocument(fileName: string): Promise<void> {
    try {
      const blob = await this.fetchUnifiedDocumentBlob(fileName);
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(fileURL), 60_000);
    } catch (error) {
      console.error('Erro ao visualizar documento unificado:', error);
      throw error;
    }
  },

  /**
   * Busca organização de documentos unificados por Empresa/Setor/Ano/Mês
   */
  async getOrganization(forceRefresh: boolean = false): Promise<any> {
    try {
      // Criar AbortController para timeout de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      try {
        // Adicionar timestamp para evitar cache quando forçar refresh
        const params: any = {};
        if (forceRefresh) {
          params._t = Date.now(); // Cache-busting
        }
        
        const response = await api.get('/api/unified-documents/organization', {
          params,
          signal: controller.signal,
          timeout: 30000 // 30 segundos
        });
        clearTimeout(timeoutId);
        return response.data;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Verificar se foi cancelado por timeout
        if (error.name === 'AbortError' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.error('⏱️ Timeout ao buscar organização de documentos unificados (30s)');
          throw new Error('A requisição demorou muito para responder. Tente novamente ou use filtros para reduzir a quantidade de dados.');
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Erro ao buscar organização de documentos unificados:', error);
      throw error;
    }
  }
};

export default unifiedDocumentService;

function normalizeDocuments(data: unknown): UnifiedDocument[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((doc) => {
      const candidateFileName =
        doc?.unifiedFileName ||
        doc?.fileName ||
        doc?.payslipFileName ||
        doc?.receiptFileName ||
        '';

      const rawMonth = doc?.month;
      const rawYear = doc?.year;
      const parsedMonth = typeof rawMonth === 'string' ? parseInt(rawMonth, 10) : rawMonth;
      const parsedYear = typeof rawYear === 'string' ? parseInt(rawYear, 10) : rawYear;
      const periodMonth = parseInt(doc?.period?.split?.('_')?.[0] ?? '0', 10);
      const periodYear = parseInt(doc?.period?.split?.('_')?.[1] ?? '0', 10);

      const normalized: UnifiedDocument = {
        ...doc,
        fileName: candidateFileName,
        unifiedFileName: doc?.unifiedFileName ?? candidateFileName,
        filePath: doc?.filePath,
        employeeName: doc?.employeeName,
        cpf: doc?.cpf,
        month: Number.isFinite(parsedMonth) && parsedMonth
          ? parsedMonth as number
          : Number.isFinite(periodMonth) && periodMonth > 0
            ? periodMonth
            : undefined,
        year: Number.isFinite(parsedYear) && parsedYear
          ? parsedYear as number
          : Number.isFinite(periodYear) && periodYear > 0
            ? periodYear
            : undefined,
      };

      return normalized;
    })
    .filter((doc) => !!doc.fileName);
}

