import React, { useState } from 'react';
import { User, Clock, ChevronDown, ChevronUp, ExternalLink, AlertCircle, CheckCircle, Info, Wrench, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SystemMessage } from '@/stores/messageStore';
import { getMessageAction } from '@/utils/messageActions';
import { useNavigate } from 'react-router-dom';
import '@/styles/notifications.css';

interface MessageItemProps {
  message: SystemMessage;
  onMarkAsRead: (messageId: string) => void;
  formatDate: (dateString: string) => string;
  getPriorityConfig: (priority: string) => {
    color: string;
    bg: string;
    label: string;
  };
  isCompact?: boolean;
  /** Chamado ao navegar pelo deep-link (ex: para fechar o sino) */
  onNavigate?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onMarkAsRead,
  formatDate,
  getPriorityConfig,
  isCompact = true,
  onNavigate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const priorityConfig = getPriorityConfig(message.priority);
  const messageAction = getMessageAction(message);

  const handleClick = () => {
    if (message.status === 'UNREAD') {
      onMarkAsRead(message.id);
    }
    if (!isCompact) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="h-3 w-3" />;
      case 'MEDIUM':
        return <Info className="h-3 w-3" />;
      case 'LOW':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  return (
    <div 
      className={`notification-item group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
        message.status === 'UNREAD' 
          ? `${priorityConfig.bg} border-l-4 shadow-md hover:shadow-xl animate-pulse-glow` 
          : 'bg-gradient-to-r from-seguranca-black/30 to-seguranca-black/10 border-gray-600 hover:border-gray-500'
      }`}
      onClick={handleClick}
    >
      {/* Indicador de status não lido */}
      {message.status === 'UNREAD' && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse shadow-lg"></div>
      )}

      {/* Header da mensagem */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${
            message.rawType === 'NOTIFICATION'
              ? 'bg-seguranca-red/20'
              : message.status === 'UNREAD' 
              ? 'bg-seguranca-yellow/20' 
              : 'bg-gray-600/20'
          }`}>
            {message.rawType === 'NOTIFICATION' ? (
              <Wrench className={`h-4 w-4 ${
                message.status === 'UNREAD' ? 'text-seguranca-red' : 'text-gray-400'
              }`} />
            ) : (
              <User className={`h-4 w-4 ${
                message.status === 'UNREAD' 
                  ? 'text-seguranca-yellow' 
                  : 'text-gray-400'
              }`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-seguranca-lightgray text-base leading-tight mb-1">
              {message.title}
            </p>
            <p className="text-sm text-gray-400 truncate">
              De: <span className="text-seguranca-yellow font-medium">{message.sender.name}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Badge 
            variant="secondary" 
            className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 ${
              message.priority === 'HIGH' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : message.priority === 'MEDIUM'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {getPriorityIcon(message.priority)}
            {priorityConfig.label}
          </Badge>
          
          {!isCompact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandClick}
              className="h-7 w-7 p-0 text-gray-400 hover:text-seguranca-lightgray hover:bg-seguranca-black/50 transition-colors duration-200"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo da mensagem */}
      <div className="mb-3">
        <p className={`text-sm text-gray-300 leading-relaxed ${
          isCompact ? 'line-clamp-2' : ''
        }`}>
          {isCompact || !isExpanded 
            ? truncateContent(message.content, isCompact ? 120 : 250)
            : message.content
          }
        </p>
        
        {/* Conteúdo expandido */}
        {!isCompact && isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-600/50">
            <div className="space-y-3 text-sm">
              {message.recipients && message.recipients.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 font-medium min-w-[80px]">Destinatários:</span>
                  <div className="flex flex-wrap gap-1">
                    {message.recipients.map((r, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-gray-500 text-gray-300">
                        {r.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {message.departments && message.departments.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 font-medium min-w-[80px]">Departamentos:</span>
                  <div className="flex flex-wrap gap-1">
                    {message.departments.map((d, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-gray-500 text-gray-300">
                        {d.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {message.scheduledAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-400 font-medium">Agendado para:</span>
                  <span className="text-seguranca-lightgray">
                    {formatDate(message.scheduledAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer da mensagem */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="h-3 w-3" />
          <span>{formatDate(message.createdAt)}</span>
          {message.readAt && (
            <span className="text-green-400 ml-2 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Lida em {formatDate(message.readAt)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {messageAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (message.status === 'UNREAD') {
                  onMarkAsRead(message.id);
                }
                onNavigate?.();
                navigate(messageAction.to);
              }}
              className="h-7 px-2 text-[11px] font-semibold text-seguranca-yellow border-seguranca-yellow/40 hover:bg-seguranca-yellow/10"
            >
              {messageAction.label}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
          {message.type === 'GLOBAL' && (
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10">
              Global
            </Badge>
          )}
          {message.type === 'GROUP' && (
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400 bg-purple-500/10">
              Grupo
            </Badge>
          )}
          {message.type === 'INDIVIDUAL' && (
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/10">
              Individual
            </Badge>
          )}
          
          {!isCompact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Aqui você pode implementar navegação para detalhes completos
                console.log('Ver detalhes da mensagem:', message.id);
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-seguranca-yellow hover:bg-seguranca-black/50 transition-colors duration-200"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;