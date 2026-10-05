import api from '@/lib/axios';

export interface CommercialAttachment {
  id: string;
  quotationId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  filePath: string;
  securityStatus: 'VERIFIED_SAFE' | 'SUSPICIOUS' | 'BLOCKED' | 'PENDING_SCAN';
  securityDetails?: string;
  fileHash?: string;
  isManualUpload: boolean;
  createdAt: string;
}

export interface CommercialQuotation {
  id: string;
  companyId?: string;
  emailMessageId?: string;
  senderEmail: string;
  senderName?: string;
  clientName?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string;
  status: 'PENDING' | 'IN_ANALYSIS' | 'PROPOSAL_GENERATED' | 'REJECTED' | 'ARCHIVED';
  confidenceScore: number;
  detectionKeywords?: string;
  extractedOrigin?: string;
  extractedDestination?: string;
  extractedTripDate?: string;
  extractedReturnDate?: string;
  extractedPassengers?: number;
  extractedVehicleType?: string;
  notes?: string;
  proposalId?: string;
  attachments: CommercialAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommercialEmailConfig {
  id?: string;
  companyId?: string;
  emailAddress: string;
  displayName?: string;
  imapHost: string;
  imapPort: number;
  imapSsl: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSsl?: boolean;
  username?: string;
  password?: string;
  status?: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncMessage?: string;
  lastSyncTotal?: number;
}

export const commercialEmailService = {
  async getConfig(): Promise<CommercialEmailConfig> {
    const response = await api.get('/api/commercial/quotations/config');
    return response.data;
  },

  async saveConfig(config: CommercialEmailConfig): Promise<CommercialEmailConfig> {
    const response = await api.put('/api/commercial/quotations/config', config);
    return response.data;
  },

  async testConnection(config: CommercialEmailConfig): Promise<{ ok?: boolean; message?: string; details?: any }> {
    const response = await api.post('/api/commercial/quotations/config/test', config);
    return response.data;
  },

  async syncQuotations(): Promise<{
    account?: string;
    quotationsFound?: number;
    newQuotationsCreated?: number;
    attachmentsScanned?: number;
    finishedAt?: string;
    imapSync?: any;
    imapWarning?: string;
  }> {
    const response = await api.post('/api/commercial/quotations/sync');
    return response.data;
  },

  async listQuotations(params?: {
    status?: string;
    query?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: CommercialQuotation[]; totalElements: number; totalPages: number }> {
    const response = await api.get('/api/commercial/quotations', { params });
    return response.data;
  },

  async getQuotation(id: string): Promise<CommercialQuotation> {
    const response = await api.get(`/api/commercial/quotations/${id}`);
    return response.data;
  },

  async updateStatus(
    id: string,
    status?: string,
    notes?: string,
    proposalId?: string
  ): Promise<CommercialQuotation> {
    const response = await api.patch(`/api/commercial/quotations/${id}/status`, null, {
      params: { status, notes, proposalId }
    });
    return response.data;
  },

  async uploadAttachment(quotationId: string, file: File): Promise<CommercialAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/commercial/quotations/${quotationId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getAttachmentDownloadUrl(attachmentId: string): string {
    return `/api/commercial/quotations/attachments/${attachmentId}/download`;
  }
};

export default commercialEmailService;
