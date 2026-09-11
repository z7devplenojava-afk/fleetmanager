import { SystemMessage } from '@/stores/messageStore';

// Interface para os dados que vêm do backend
export interface MessageResponseDTO {
  id: string;
  title: string;
  content: string;
  type: 'INDIVIDUAL' | 'GROUP' | 'DEPARTMENT' | 'GLOBAL' | 'NOTIFICATION' | 'EMAIL';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  sender: {
    id: string;
    name: string;
    email: string;
    username?: string;
  };
  recipients?: Array<{
    id: string;
    name: string;
    email: string;
    username?: string;
  }>;
  departments?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  sendEmail?: boolean;
  sendNotification?: boolean;
  scheduledAt?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Função para mapear tipos de mensagem do backend para o frontend
export const mapMessageType = (backendType: string): 'GLOBAL' | 'GROUP' | 'INDIVIDUAL' => {
  switch (backendType) {
    case 'GLOBAL':
      return 'GLOBAL';
    case 'GROUP':
    case 'DEPARTMENT':
      return 'GROUP';
    case 'INDIVIDUAL':
      return 'INDIVIDUAL';
    case 'NOTIFICATION':
    case 'EMAIL':
    default:
      return 'INDIVIDUAL';
  }
};

// Função para mapear prioridades do backend para o frontend
export const mapMessagePriority = (backendPriority: string): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' => {
  switch (backendPriority) {
    case 'LOW':
      return 'LOW';
    case 'NORMAL':
      return 'NORMAL';
    case 'HIGH':
      return 'HIGH';
    case 'URGENT':
      return 'URGENT';
    default:
      return 'NORMAL';
  }
};

// Função para mapear status do backend para o frontend
export const mapMessageStatus = (backendStatus: string): 'UNREAD' | 'READ' => {
  switch (backendStatus) {
    case 'READ':
      return 'READ';
    case 'ARCHIVED':
      return 'READ'; // Arquivos são considerados lidos
    case 'UNREAD':
    default:
      return 'UNREAD';
  }
};

// Função principal para adaptar dados do backend para o frontend
export const adaptMessageResponse = (dto: MessageResponseDTO): SystemMessage => {
  return {
    id: dto.id,
    title: dto.title,
    content: dto.content,
    type: mapMessageType(dto.type),
    rawType: dto.type, // preserva o tipo original (ex: NOTIFICATION) para deep-links
    priority: mapMessagePriority(dto.priority),
    status: mapMessageStatus(dto.status),
    sender: {
      id: dto.sender.id,
      name: dto.sender.name || dto.sender.username || 'Usuário',
      email: dto.sender.email
    },
    recipients: dto.recipients?.map(recipient => ({
      id: recipient.id,
      name: recipient.name || recipient.username || 'Usuário'
    })),
    departments: dto.departments?.map(dept => ({
      id: dept.id,
      name: dept.name
    })),
    createdAt: dto.createdAt,
    readAt: dto.readAt
  };
};

// Função para adaptar lista de mensagens
export const adaptMessageList = (dtos: MessageResponseDTO[]): SystemMessage[] => {
  return dtos.map(adaptMessageResponse);
};

// Função para adaptar resposta paginada
export const adaptPaginatedResponse = (response: {
  content: MessageResponseDTO[];
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
}): { messages: SystemMessage[]; totalPages: number; hasNext: boolean } => {
  return {
    messages: adaptMessageList(response.content || []),
    totalPages: response.totalPages || 0,
    hasNext: !response.last
  };
};

export default {
  adaptMessageResponse,
  adaptMessageList,
  adaptPaginatedResponse,
  mapMessageType,
  mapMessagePriority,
  mapMessageStatus
};
