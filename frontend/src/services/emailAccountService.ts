import api from './api';

// ==================== TYPES ====================

export interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName?: string;
  imapHost: string;
  imapPort: number;
  imapSsl: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSsl: boolean;
  username?: string;
  authType: string;
  signature?: string;
  status: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncMessage?: string;
  lastSyncTotal?: number;
  createdAt?: string;
  unreadCount: number;
  totalMessages: number;
  folderCount: number;
}

export interface EmailAccountRequest {
  emailAddress: string;
  displayName?: string;
  imapHost: string;
  imapPort?: number;
  imapSsl?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSsl?: boolean;
  username?: string;
  password?: string;
  authType?: string;
  signature?: string;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  id: string;
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
  inline?: boolean;
  contentId?: string;
  downloadUrl: string;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  folderId: string;
  uid: number;
  subject?: string;
  from?: EmailAddress[];
  to?: EmailAddress[];
  cc?: EmailAddress[];
  date?: string;
  bodyText?: string;
  bodyHtml?: string;
  read?: boolean;
  flagged?: boolean;
  answered?: boolean;
  hasAttachments?: boolean;
  sizeBytes?: number;
  attachments?: EmailAttachment[];
}

export interface EmailFolder {
  id: string;
  accountId?: string;
  remoteName: string;
  displayName: string;
  delimiter?: string;
  attributes?: string;
  uidValidity?: number;
  highestUid?: number;
  totalMessages?: number;
  system?: boolean;
  unread?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface TestConnectionResult {
  accountId: string;
  email: string;
  imap: { ok: boolean; message: string };
  smtp: { ok: boolean | null; message: string };
  success: boolean;
}

// ==================== SERVICE ====================

export const emailAccountService = {
  // ---- Contas ----
  listAccounts: async (): Promise<EmailAccount[]> => {
    const response = await api.get('/api/email/accounts');
    return response.data?.data ?? [];
  },

  createAccount: async (data: EmailAccountRequest): Promise<EmailAccount> => {
    const response = await api.post('/api/email/accounts', data);
    return response.data?.data;
  },

  updateAccount: async (id: string, data: EmailAccountRequest): Promise<EmailAccount> => {
    const response = await api.put(`/api/email/accounts/${id}`, data);
    return response.data?.data;
  },

  deleteAccount: async (id: string): Promise<void> => {
    await api.delete(`/api/email/accounts/${id}`);
  },

  testCredentials: async (data: EmailAccountRequest): Promise<TestConnectionResult> => {
    const response = await api.post('/api/email/accounts/test-credentials', data);
    return response.data?.data;
  },

  testConnection: async (id: string): Promise<TestConnectionResult> => {
    const response = await api.post(`/api/email/accounts/${id}/test`);
    return response.data?.data;
  },

  syncAccount: async (id: string, fullSync = false): Promise<any> => {
    const response = await api.post(`/api/email/accounts/${id}/sync?fullSync=${fullSync}`);
    return response.data;
  },

  syncFolders: async (id: string): Promise<EmailFolder[]> => {
    const response = await api.post(`/api/email/accounts/${id}/sync-folders`);
    return response.data?.data ?? [];
  },

  listFolders: async (id: string): Promise<EmailFolder[]> => {
    const response = await api.get(`/api/email/accounts/${id}/folders`);
    return response.data?.data ?? [];
  },

  sendEmail: async (id: string, data: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    bodyHtml?: string;
    attachmentIds?: string[];
  }): Promise<any> => {
    const response = await api.post(`/api/email/accounts/${id}/send`, data);
    return response.data;
  },

  // ---- Pastas ----
  listFolderMessages: async (folderId: string, page = 0, size = 25): Promise<PageResponse<EmailMessage>> => {
    const response = await api.get(`/api/email/folders/${folderId}/messages`, {
      params: { page, size }
    });
    return response.data?.data;
  },

  listAccountMessages: async (accountId: string, folderId?: string, page = 0, size = 25): Promise<PageResponse<EmailMessage>> => {
    const response = await api.get(`/api/email/accounts/${accountId}/messages`, {
      params: { folderId: folderId || undefined, page, size }
    });
    return response.data?.data;
  },

  searchMessages: async (accountId: string, q: string, page = 0, size = 25): Promise<PageResponse<EmailMessage>> => {
    const response = await api.get(`/api/email/accounts/${accountId}/search`, {
      params: { q, page, size }
    });
    return response.data?.data;
  },

  getMessage: async (id: string): Promise<EmailMessage> => {
    const response = await api.get(`/api/email/messages/${id}`);
    return response.data?.data;
  },

  markRead: async (id: string, read = true): Promise<EmailMessage> => {
    const response = await api.post(`/api/email/messages/${id}/read`, { read });
    return response.data?.data;
  },

  toggleFlag: async (id: string): Promise<EmailMessage> => {
    const response = await api.post(`/api/email/messages/${id}/flag`);
    return response.data?.data;
  },

  deleteMessage: async (id: string): Promise<void> => {
    await api.delete(`/api/email/messages/${id}`);
  },

  moveMessage: async (id: string, folderId: string): Promise<EmailMessage> => {
    const response = await api.post(`/api/email/messages/${id}/move`, { folderId });
    return response.data?.data;
  },

  uploadAttachment: async (accountId: string, file: File): Promise<{
    id: string;
    fileName: string;
    contentType?: string;
    sizeBytes?: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/email/accounts/${accountId}/attachments/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data;
  },

  downloadAttachmentUrl: (attachmentId: string): string =>
    `/api/email/attachments/${attachmentId}/download`,
};
