export type DocumentType = 'CONTRACT' | 'ID_DOCUMENT' | 'CERTIFICATE' | 'REPORT' | 'OTHER';
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface Document {
  id: number;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  documentType: DocumentType;
  status: DocumentStatus;
  employeeId?: number;
  employeeName?: string;
  clientId?: number;
  clientName?: string;
  expiryDate?: string;
  uploadedBy: string;
  uploadedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  byType: Record<DocumentType, number>;
}

export interface DocumentFilters {
  documentType?: DocumentType;
  status?: DocumentStatus;
  employeeId?: number;
  clientId?: number;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DocumentUploadData {
  title: string;
  description?: string;
  documentType: DocumentType;
  employeeId?: number;
  clientId?: number;
  expiryDate?: string;
  tags?: string[];
} 