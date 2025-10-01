export interface TransportGuide {
  id: string;
  cnpj: string;
  empresa: string;
  numeroColete?: string;
  numeroArma: string;
  calibre: string;
  qtdMunicoes: number;
  origem: string;
  destino: string;
  trajeto: string;
  motivo: string;
  arquivoGuia?: string;
  status: TransportGuideStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface CreateTransportGuideDTO {
  cnpj: string;
  empresa: string;
  numeroColete?: string;
  numeroArma: string;
  calibre: string;
  qtdMunicoes: number;
  origem: string;
  destino: string;
  trajeto: string;
  motivo: string;
  arquivoGuia?: File;
}

export interface UpdateTransportGuideDTO extends Partial<CreateTransportGuideDTO> {
  id: string;
}

export interface TransportGuideFilters {
  cnpj?: string;
  empresa?: string;
  numeroArma?: string;
  calibre?: string;
  motivo?: string;
  status?: TransportGuideStatus;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}

export enum TransportGuideStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export const TransportGuideStatusLabels = {
  [TransportGuideStatus.DRAFT]: 'Rascunho',
  [TransportGuideStatus.SUBMITTED]: 'Enviado',
  [TransportGuideStatus.APPROVED]: 'Aprovado',
  [TransportGuideStatus.REJECTED]: 'Rejeitado',
  [TransportGuideStatus.IN_TRANSIT]: 'Em Trânsito',
  [TransportGuideStatus.COMPLETED]: 'Concluído',
  [TransportGuideStatus.CANCELLED]: 'Cancelado'
};

export const TransportGuideStatusColors = {
  [TransportGuideStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [TransportGuideStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [TransportGuideStatus.APPROVED]: 'bg-green-100 text-green-800',
  [TransportGuideStatus.REJECTED]: 'bg-red-100 text-red-800',
  [TransportGuideStatus.IN_TRANSIT]: 'bg-yellow-100 text-yellow-800',
  [TransportGuideStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [TransportGuideStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
};
