export type MessageType = 'INDIVIDUAL' | 'GROUP' | 'GLOBAL';
export type MessageStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Message {
  id: number;
  title: string;
  content: string;
  senderId: number;
  senderName: string;
  recipientId?: number;
  recipientName?: string;
  recipientGroupId?: number;
  recipientGroupName?: string;
  type: MessageType;
  status: MessageStatus;
  priority: MessagePriority;
  createdAt: string;
  readAt?: string;
  updatedAt?: string;
}

export interface CreateMessageRequest {
  title: string;
  content: string;
  recipientId?: number;
  recipientGroupId?: number;
  type: MessageType;
  priority?: MessagePriority;
}

export interface MessageDashboard {
  unreadCount: number;
  unreadMessages: Message[];
  recentMessages: Message[];
}

export interface MessageListResponse {
  messages: Message[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
} 