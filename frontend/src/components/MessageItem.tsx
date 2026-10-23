import React, { useState } from 'react';
import { User, Clock, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Info, Wrench, ArrowRight } from 'lucide-react';
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
  /** Chamado ao navegar (para fechar o popover) */
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.status === 'UNREAD') {
      onMarkAsRead(message.id);
    }
    onNavigate?.();
    navigate('/mensagens', { state: { selectedMessageId: message.id } });
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const truncateContent = (content: string, maxLength: number = 110) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          classes: 'bg-red-500/15 text-red-400 border-red-500/30',
          borderAccent: 'border-l-red-500'
        };
      case 'MEDIUM':
        return {
          icon: <Info className="h-3 w-3" />,
          classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          borderAccent: 'border-l-amber-500'
        };
      case 'LOW':
      case 'NORMAL':
      default:
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          borderAccent: 'border-l-primary'
        };
    }
  };

  const priorityStyle = getPriorityBadge(message.priority);
  const isUnread = message.status === 'UNREAD';

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any);
        }
      }}
      className={`group relative p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.99] text-left ${
        isUnread
          ? `bg-card/90 hover:bg-card border-border/80 border-l-4 ${priorityStyle.borderAccent} shadow-sm hover:shadow-md`
          : 'bg-card/40 hover:bg-card/70 border-border/50 border-l-4 border-l-transparent opacity-85 hover:opacity-100'
      }`}
    >
      {/* Header com ícone, remetente, título e prioridade */}
      <div className="flex items-start justify-between gap-2.5 mb-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div
            className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
              message.rawType === 'NOTIFICATION'
                ? 'bg-red-500/15 text-red-400'
                : isUnread
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {message.rawType === 'NOTIFICATION' ? (
              <Wrench className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
              {message.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              De: <span className="font-medium text-foreground/90">{message.sender.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge
            variant="secondary"
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border ${priorityStyle.classes}`}
          >
            {priorityStyle.icon}
            <span>{priorityConfig.label}</span>
          </Badge>

          {isUnread && (
            <span className="relative flex h-2 w-2 ml-0.5" title="Não lida">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}

          {!isCompact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandClick}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo / Prévia da mensagem */}
      <div className="mb-2.5">
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
          {isCompact || !isExpanded
            ? truncateContent(message.content, isCompact ? 115 : 220)
            : message.content}
        </p>

        {/* Conteúdo expandido (quando não compacto) */}
        {!isCompact && isExpanded && (
          <div className="mt-3 pt-3 border-t border-border/60 space-y-2 text-xs">
            {message.recipients && message.recipients.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground font-medium min-w-[75px]">Destinatários:</span>
                <div className="flex flex-wrap gap-1">
                  {message.recipients.map((r, index) => (
                    <Badge key={index} variant="outline" className="text-[10px] border-border text-foreground">
                      {r.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {message.departments && message.departments.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground font-medium min-w-[75px]">Departamentos:</span>
                <div className="flex flex-wrap gap-1">
                  {message.departments.map((d, index) => (
                    <Badge key={index} variant="outline" className="text-[10px] border-border text-foreground">
                      {d.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer com data, tipo de mensagem e botão sutil de ação */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
          <Clock className="h-3 w-3" />
          <span>{formatDate(message.createdAt)}</span>
          {message.readAt && (
            <span className="text-emerald-500 ml-1.5 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Lida
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
                if (isUnread) {
                  onMarkAsRead(message.id);
                }
                onNavigate?.();
                navigate(messageAction.to);
              }}
              className="h-6 px-2 text-[10px] font-semibold text-primary border-primary/30 hover:bg-primary/10 rounded-md"
            >
              {messageAction.label}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}

          {message.type === 'GLOBAL' && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10">
              Global
            </Badge>
          )}
          {message.type === 'GROUP' && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-400 bg-purple-500/10">
              Grupo
            </Badge>
          )}
          {message.type === 'INDIVIDUAL' && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              Individual
            </Badge>
          )}

          <span className="text-[11px] font-medium text-primary hidden sm:inline-flex items-center gap-0.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            Abrir <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;