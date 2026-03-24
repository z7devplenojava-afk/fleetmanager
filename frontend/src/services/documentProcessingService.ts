import api from '@/lib/axios';

export interface JobStatusResponse {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  message?: string;
  progressPercentage?: number;
  totalPages?: number;
  processedPages?: number;
  errorMessage?: string;
}

export interface UploadResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface DownloadResponse {
  downloadUrl: string;
  expiresIn: string;
}

/**
 * Serviço para processamento assíncrono de documentos (holerites e comprovantes)
 * Usa Redis Streams e workers para processamento em background
 */
class DocumentProcessingService {
  /**
   * Faz upload de um ou mais PDFs de HOLERITES para processamento assíncrono
   * @param file Arquivo PDF contendo holerites (ou array de arquivos, até 4)
   * @returns Job ID(s) e status inicial
   */
  async uploadPayslips(file: File | File[]): Promise<UploadResponse | UploadResponse[]> {
    try {
      const files = Array.isArray(file) ? file : [file];
      
      // Validar quantidade máxima
      if (files.length > 4) {
        throw new Error('Máximo de 4 arquivos permitidos');
      }
      
      console.log(`[DocumentProcessing] Iniciando upload de ${files.length} HOLERITE(S)`);
      
      const formData = new FormData();
      
      // Se múltiplos arquivos, usar 'files', senão usar 'file' (compatibilidade)
      if (files.length > 1) {
        files.forEach((f, index) => {
          formData.append('files', f);
          console.log(`[DocumentProcessing] Arquivo ${index + 1}: ${f.name} (${f.size} bytes)`);
        });
      } else {
        formData.append('file', files[0]);
        console.log(`[DocumentProcessing] Arquivo: ${files[0].name} (${files[0].size} bytes)`);
      }

      const response = await api.post<any>(
        '/v1/document-processing/upload-payslips',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutos para upload (aumentado para múltiplos arquivos)
        }
      );

      console.log(`[DocumentProcessing] Upload de holerites concluído:`, response.data);
      
      // Se resposta contém array de jobs (múltiplos arquivos)
      if (response.data.jobs && Array.isArray(response.data.jobs)) {
        return response.data.jobs.map((job: any) => ({
          jobId: typeof job.jobId === 'string' ? job.jobId : job.jobId?.toString() || '',
          status: job.status || 'QUEUED',
          message: job.message || 'Arquivo de holerites enfileirado para processamento',
        }));
      }
      
      // Resposta única (compatibilidade com versão antiga)
      const jobId = typeof response.data.jobId === 'string' 
        ? response.data.jobId 
        : response.data.jobId?.toString() || '';

      return {
        jobId,
        status: response.data.status || 'QUEUED',
        message: response.data.message || 'Arquivo de holerites enfileirado para processamento',
      };
    } catch (error: any) {
      console.error('[DocumentProcessing] Erro no upload de holerites:', error);
      throw error;
    }
  }

  /**
   * Faz upload de um PDF de COMPROVANTES para processamento assíncrono
   * @param file Arquivo PDF contendo comprovantes
   * @returns Job ID e status inicial
   */
  async uploadReceipts(file: File): Promise<UploadResponse> {
    try {
      console.log(`[DocumentProcessing] Iniciando upload de COMPROVANTES: ${file.name} (${file.size} bytes)`);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<JobStatusResponse>(
        '/v1/document-processing/upload-receipts',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 1 minuto para upload
        }
      );

      console.log(`[DocumentProcessing] Upload de comprovantes concluído:`, response.data);
      
      // Converter jobId para string se for UUID
      const jobId = typeof response.data.jobId === 'string' 
        ? response.data.jobId 
        : response.data.jobId?.toString() || '';

      return {
        jobId,
        status: response.data.status || 'QUEUED',
        message: response.data.message || 'Arquivo de comprovantes enfileirado para processamento',
      };
    } catch (error: any) {
      console.error('[DocumentProcessing] Erro no upload de comprovantes:', error);
      throw error;
    }
  }

  /**
   * @deprecated Use uploadPayslips() ou uploadReceipts() ao invés deste método
   * Faz upload de um PDF para processamento assíncrono (método genérico - deprecated)
   * @param file Arquivo PDF a ser processado
   * @returns Job ID e status inicial
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    console.warn('[DocumentProcessing] uploadDocument() está deprecated. Use uploadPayslips() ou uploadReceipts()');
    // Por padrão, assume que é holerite para manter compatibilidade
    return this.uploadPayslips(file);
  }

  /**
   * Consulta o status de um job de processamento
   * @param jobId ID do job
   * @returns Status atual do job
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    try {
      console.log(`[DocumentProcessing] Consultando status do job: ${jobId}`);
      const response = await api.get<JobStatusResponse>(
        `/v1/document-processing/job/${jobId}`
      );
      console.log(`[DocumentProcessing] Status recebido:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[DocumentProcessing] Erro ao consultar job ${jobId}:`, error);
      if (error.response?.status === 404) {
        throw new Error(`Job ${jobId} não encontrado. Pode ter sido removido ou nunca foi criado.`);
      }
      throw error;
    }
  }

  /**
   * Polling para verificar o status do job até completar ou falhar
   * @param jobId ID do job
   * @param onProgress Callback chamado a cada atualização de progresso
   * @param interval Intervalo entre verificações em ms (padrão: 2 segundos)
   * @returns Status final do job
   */
  async pollJobStatus(
    jobId: string,
    onProgress?: (status: JobStatusResponse) => void,
    interval: number = 2000
  ): Promise<JobStatusResponse> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 300; // Máximo de 10 minutos (300 * 2s)
      
      const poll = async () => {
        try {
          attempts++;
          
          // Aguardar um pouco antes da primeira tentativa para garantir que o job foi salvo
          if (attempts === 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          const status = await this.getJobStatus(jobId);

          // Chama callback de progresso se fornecido
          if (onProgress) {
            onProgress(status);
          }

          // Verifica se o job foi concluído ou falhou
          if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
            console.log(`[DocumentProcessing] Job ${jobId} finalizado com status: ${status.status}`);
            resolve(status);
            return;
          }

          // Verifica se excedeu o número máximo de tentativas
          if (attempts >= maxAttempts) {
            reject(new Error(`Timeout: Job ${jobId} não foi concluído após ${maxAttempts * interval / 1000} segundos`));
            return;
          }

          // Continua polling
          setTimeout(poll, interval);
        } catch (error: any) {
          // Se for 404 e ainda estiver nas primeiras tentativas, aguardar mais um pouco
          if (error.message?.includes('não encontrado') && attempts < 5) {
            console.warn(`[DocumentProcessing] Job ${jobId} ainda não encontrado, aguardando... (tentativa ${attempts})`);
            setTimeout(poll, interval * 2); // Aguardar o dobro do tempo
            return;
          }
          
          console.error(`[DocumentProcessing] Erro no polling do job ${jobId}:`, error);
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Obtém URL de download para documento unificado
   * @param unifiedDocumentId ID do documento unificado
   * @returns URL de download e tempo de expiração
   */
  async getDownloadUrl(unifiedDocumentId: string): Promise<DownloadResponse> {
    const response = await api.get<DownloadResponse>(
      `/v1/document-processing/download/${unifiedDocumentId}`
    );

    return response.data;
  }
}

export default new DocumentProcessingService();

