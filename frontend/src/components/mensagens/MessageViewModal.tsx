import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Message } from '../../types/message';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  Trash2, 
  Archive,
  User,
  Users,
  Globe
} from 'lucide-react';

interface MessageViewModalProps {
  message: Message | null;
  open: boolean;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const MessageViewModal: React.FC<MessageViewModalProps> = ({
  message,
  open,
  onClose,
  onMarkAsRead,
  onDelete
}) => {
  if (!message) return null;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'HIGH':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'NORMAL':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'LOW':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'READ':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INDIVIDUAL':
        return <User className="w-4 h-4" />;
      case 'GROUP':
        return <Users className="w-4 h-4" />;
      case 'GLOBAL':
        return <Globe className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getTypeIcon(message.type)}
              <DialogTitle className="text-lg">{message.title}</DialogTitle>
            </div>
            <div className="flex items-center space-x-2">
              {getPriorityIcon(message.priority)}
              <Badge className={getPriorityColor(message.priority)}>
                {message.priority}
              </Badge>
              <Badge className={getStatusColor(message.status)}>
                {message.status === 'UNREAD' ? 'Nova' : 
                 message.status === 'READ' ? 'Lida' : 'Arquivada'}
              </Badge>
            </div>
          </div>
          <DialogDescription>
            Detalhes da mensagem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da mensagem */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">De:</span>
              <span className="text-gray-900">{message.senderName}</span>
            </div>
            
            {message.recipientName && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Para:</span>
                <span className="text-gray-900">{message.recipientName}</span>
              </div>
            )}
            
            {message.recipientGroupName && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Grupo:</span>
                <span className="text-gray-900">{message.recipientGroupName}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Tipo:</span>
              <span className="text-gray-900 capitalize">{message.type.toLowerCase()}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Enviada em:</span>
              <span className="text-gray-900">{formatDate(message.createdAt)}</span>
            </div>
            
            {message.readAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Lida em:</span>
                <span className="text-gray-900">{formatDate(message.readAt)}</span>
              </div>
            )}
          </div>

          {/* Conteúdo da mensagem */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Conteúdo:</h4>
            <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[120px]">
              <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center space-x-2">
            {message.status === 'UNREAD' && (
              <Button
                onClick={() => {
                  onMarkAsRead(message.id);
                  onClose();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                Marcar como Lida
              </Button>
            )}
            
            <Button
              onClick={() => onDelete(message.id)}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageViewModal; 