import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  Clock,
  Mail,
  Bell,
  Users,
  Building2,
  AlertCircle,
  CheckCircle,
  Info,
  Reply,
  Archive,
  RefreshCw
} from 'lucide-react';
import { SystemMessage } from '@/stores/messageStore';

interface ViewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: SystemMessage | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkAsRead?: () => void;
  onReply?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

export const ViewMessageModal: React.FC<ViewMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  onEdit,
  onDelete,
  onMarkAsRead,
  onReply,
  onArchive,
  onRestore
}) => {
  if (!message) return null;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'HIGH':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'NORMAL':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'LOW':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'NORMAL':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'LOW':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'Urgente';
      case 'HIGH':
        return 'Alta';
      case 'NORMAL':
        return 'Normal';
      case 'LOW':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'READ':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ARCHIVED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return 'Nova';
      case 'READ':
        return 'Lida';
      case 'ARCHIVED':
        return 'Arquivada';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'GLOBAL':
        return <Users className="h-4 w-4" />;
      case 'GROUP':
        return <Users className="h-4 w-4" />;
      case 'INDIVIDUAL':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'GLOBAL':
        return 'Global';
      case 'GROUP':
        return 'Grupo';
      case 'DEPARTMENT':
        return 'Departamento';
      case 'INDIVIDUAL':
        return 'Individual';
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-seguranca-yellow flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Detalhes da Mensagem
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Visualização completa da mensagem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header da mensagem */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">
                {message.title}
              </h2>
              
              <div className="flex flex-wrap gap-2">
                <Badge className={`${getPriorityColor(message.priority)} flex items-center gap-1`}>
                  {getPriorityIcon(message.priority)}
                  Prioridade: {getPriorityLabel(message.priority)}
                </Badge>
                
                <Badge className={`${getStatusColor(message.status)} flex items-center gap-1`}>
                  {message.status === 'UNREAD' ? (
                    <>
                      <Bell className="h-3 w-3" />
                      Nova
                    </>
                  ) : message.status === 'READ' ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Lida
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Arquivada
                    </>
                  )}
                </Badge>

                <Badge variant="outline" className="border-gray-500 text-gray-300 flex items-center gap-1">
                  {getTypeIcon(message.type)}
                  {getTypeLabel(message.type)}
                </Badge>
              </div>
            </div>

            <Separator className="bg-gray-600" />
          </div>

          {/* Conteúdo */}
          <div className="space-y-3">
            <Label className="text-seguranca-lightgray font-semibold">Conteúdo:</Label>
            <div className="bg-seguranca-black p-4 rounded-lg border border-gray-600">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>

          {/* Informações do remetente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 bg-seguranca-black p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 text-seguranca-yellow mb-2">
                <User className="h-4 w-4" />
                <span className="font-semibold">Remetente</span>
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium">{message.sender.name}</p>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {message.sender.email}
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-seguranca-black p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 text-seguranca-yellow mb-2">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">Data e Hora</span>
              </div>
              <div className="space-y-1">
                <p className="text-white text-sm">
                  Enviado: {new Date(message.createdAt).toLocaleString('pt-BR')}
                </p>
                {message.readAt && (
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Lida em: {new Date(message.readAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Destinatários */}
          {message.recipients && message.recipients.length > 0 && (
            <div className="space-y-2 bg-seguranca-black p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 text-seguranca-yellow mb-2">
                <Users className="h-4 w-4" />
                <span className="font-semibold">Destinatários ({message.recipients.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.recipients.map((recipient, index) => (
                  <Badge key={index} variant="outline" className="border-gray-500 text-gray-300">
                    {recipient.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Departamentos */}
          {message.departments && message.departments.length > 0 && (
            <div className="space-y-2 bg-seguranca-black p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 text-seguranca-yellow mb-2">
                <Building2 className="h-4 w-4" />
                <span className="font-semibold">Departamentos ({message.departments.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.departments.map((dept, index) => (
                  <Badge key={index} variant="outline" className="border-gray-500 text-gray-300">
                    {dept.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {message.status === 'UNREAD' && onMarkAsRead && (
            <Button
              onClick={() => {
                onMarkAsRead();
                onClose();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como Lida
            </Button>
          )}
          
          {message.status !== 'ARCHIVED' && onArchive && (
            <Button
              onClick={() => {
                onArchive();
                onClose();
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Archive className="h-4 w-4 mr-2" />
              Arquivar
            </Button>
          )}
          
          {message.status === 'ARCHIVED' && onRestore && (
            <Button
              onClick={() => {
                onRestore();
                onClose();
              }}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )}
          
          {onReply && (
            <Button
              onClick={() => {
                onReply();
                onClose();
              }}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Reply className="h-4 w-4 mr-2" />
              Responder
            </Button>
          )}
          
          {onEdit && (
            <Button
              onClick={() => {
                onEdit();
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          
          {onDelete && (
            <Button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-white hover:bg-seguranca-black"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for labels
const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={className}>{children}</div>
);

export default ViewMessageModal;
