import React, { useState } from 'react';
import { User, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SystemMessage } from '@/stores/messageStore';

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
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onMarkAsRead,
  formatDate,
  getPriorityConfig,
  isCompact = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const priorityConfig = getPriorityConfig(message.priority);

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

  return (
    <div 
      className={`p-3 rounded-lg border transition-all duration-200 hover:bg-seguranca-black/30 cursor-pointer ${
        message.status === 'UNREAD' 
          ? `${priorityConfig.bg} border-l-4 shadow-sm` 
          : 'bg-seguranca-black/20 border-gray-600'
      }`}
      onClick={handleClick}
    >
      {/* Header da mensagem */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-seguranca-lightgray truncate">
              {message.title}
            </p>
            <p className="text-sm text-gray-400 truncate">
              De: {message.sender.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-1 rounded ${priorityConfig.color} bg-opacity-20`}>
            {priorityConfig.label}
          </span>
          {message.status === 'UNREAD' && (
            <div className="w-2 h-2 bg-seguranca-red rounded-full animate-pulse"></div>
          )}
          {!isCompact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandClick}
              className="h-6 w-6 p-0 text-gray-400 hover:text-seguranca-lightgray"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo da mensagem */}
      <div className="mb-2">
        <p className={`text-sm text-gray-300 ${isCompact ? 'line-clamp-2' : ''}`}>
          {isCompact || !isExpanded 
            ? truncateContent(message.content, isCompact ? 100 : 200)
            : message.content
          }
        </p>
        
        {/* Conteúdo expandido */}
        {!isCompact && isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="space-y-2 text-sm">
              {message.recipients && message.recipients.length > 0 && (
                <div>
                  <span className="text-gray-400">Destinatários: </span>
                  <span className="text-seguranca-lightgray">
                    {message.recipients.map(r => r.name).join(', ')}
                  </span>
                </div>
              )}
              
              {message.departments && message.departments.length > 0 && (
                <div>
                  <span className="text-gray-400">Departamentos: </span>
                  <span className="text-seguranca-lightgray">
                    {message.departments.map(d => d.name).join(', ')}
                  </span>
                </div>
              )}
              
              {message.scheduledAt && (
                <div>
                  <span className="text-gray-400">Agendado para: </span>
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
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatDate(message.createdAt)}</span>
          {message.readAt && (
            <span className="text-green-400 ml-2">
              • Lida em {formatDate(message.readAt)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {message.type === 'GLOBAL' && (
            <Badge variant="outline" className="text-xs border-gray-500 text-gray-400">
              Global
            </Badge>
          )}
          {message.type === 'GROUP' && (
            <Badge variant="outline" className="text-xs border-gray-500 text-gray-400">
              Grupo
            </Badge>
          )}
          {message.type === 'INDIVIDUAL' && (
            <Badge variant="outline" className="text-xs border-gray-500 text-gray-400">
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
              className="h-5 w-5 p-0 text-gray-400 hover:text-seguranca-yellow"
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