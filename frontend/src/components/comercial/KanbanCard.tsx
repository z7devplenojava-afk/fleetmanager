import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Building2, 
  Calendar, 
  DollarSign, 
  Phone, 
  Mail,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Edit,
  Eye
} from 'lucide-react';
import styles from './KanbanBoard.module.css';

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST';
  source: string;
  value: number;
  createdAt: string;
}

interface Opportunity {
  id: number;
  title: string;
  description: string;
  statusId: number;
  lead: Lead;
  value: number;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastContact: string;
  tags: string[];
}

interface KanbanCardProps {
  opportunity: Opportunity;
  onEdit: (opp: Opportunity) => void;
  onDragStart: (e: React.DragEvent, oppId: number) => void;
  getPriorityColor: (priority: string) => string;
  getLeadStatusColor: (status: string) => string;
  getLeadStatusText: (status: string) => string;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
}

export default function KanbanCard({ 
  opportunity, 
  onEdit, 
  onDragStart,
  getPriorityColor,
  getLeadStatusColor,
  getLeadStatusText,
  formatCurrency,
  formatDate
}: KanbanCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getDaysUntilClose = () => {
    const today = new Date();
    const closeDate = new Date(opportunity.expectedCloseDate);
    const diffTime = closeDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysUntilCloseColor = () => {
    const days = getDaysUntilClose();
    if (days < 0) return 'text-red-500';
    if (days <= 7) return 'text-orange-500';
    if (days <= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card 
      className="bg-seguranca-black border-gray-600 hover:border-seguranca-yellow transition-colors cursor-pointer"
      draggable 
      onDragStart={e => onDragStart(e, opportunity.id)}
      onClick={() => setShowDetails(!showDetails)}
    >
      <CardContent className="p-4">
        {/* Header com prioridade e valor */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Badge className={`${getPriorityColor(opportunity.priority)} text-white text-xs`}>
              {opportunity.priority === 'URGENT' ? 'URGENTE' : 
               opportunity.priority === 'HIGH' ? 'ALTA' :
               opportunity.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
            </Badge>
            <Badge className="bg-seguranca-yellow text-black text-xs">
              {opportunity.probability}%
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-seguranca-yellow">
              {formatCurrency(opportunity.value)}
            </p>
          </div>
        </div>

        {/* Título e descrição */}
        <div className="mb-3">
          <h4 className="font-semibold text-seguranca-lightgray text-sm mb-1 line-clamp-2">
            {opportunity.title}
          </h4>
          <p className="text-xs text-gray-400 line-clamp-2">
            {opportunity.description}
          </p>
        </div>

        {/* Informações do Lead */}
        {opportunity.lead && (
          <div className="mb-3 p-2 bg-seguranca-graphite rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs font-medium text-seguranca-lightgray">
                  {opportunity.lead.name || 'Sem nome'}
                </span>
              </div>
              {opportunity.lead.status && (
                <Badge className={`${getLeadStatusColor(opportunity.lead.status)} text-white text-xs`}>
                  {getLeadStatusText(opportunity.lead.status)}
                </Badge>
              )}
            </div>
            {opportunity.lead.company && (
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">{opportunity.lead.company}</span>
              </div>
            )}
            {opportunity.lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">{opportunity.lead.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {opportunity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {opportunity.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-400">
                {tag}
              </Badge>
            ))}
            {opportunity.tags.length > 3 && (
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                +{opportunity.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Informações adicionais */}
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Fechamento:</span>
            </div>
            <span className={getDaysUntilCloseColor()}>
              {formatDate(opportunity.expectedCloseDate)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Responsável:</span>
            </div>
            <span className="text-seguranca-lightgray">{opportunity.assignedTo}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Último contato:</span>
            </div>
            <span>{formatDate(opportunity.lastContact)}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={(e) => { e.stopPropagation(); onEdit(opportunity); }}
            className="flex-1 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
            className="flex-1 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
        </div>

        {/* Detalhes expandidos */}
        {showDetails && opportunity.lead && (
          <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 mb-1">Fonte do Lead:</p>
                <p className="text-seguranca-lightgray">
                  {(() => {
                    const source = opportunity.lead.source;
                    if (!source || source === 'Não informado') return 'Não informado';
                    // Mapear valores do enum para nomes amigáveis
                    const sourceMap: Record<string, string> = {
                      'WEBSITE': 'Website',
                      'REFERRAL': 'Indicação',
                      'COLD_CALL': 'Ligação a Frio',
                      'EMAIL_MARKETING': 'Email Marketing',
                      'SOCIAL_MEDIA': 'Redes Sociais',
                      'GOOGLE_ADS': 'Google Ads',
                      'EVENT': 'Evento',
                      'PARTNER': 'Parceiro',
                      'OTHER': 'Outro'
                    };
                    // Se source for um objeto com displayName, usar isso
                    if (typeof source === 'object' && (source as any).displayName) {
                      return (source as any).displayName;
                    }
                    // Se for string, mapear
                    return sourceMap[String(source)] || String(source);
                  })()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Data de criação:</p>
                <p className="text-seguranca-lightgray">{opportunity.lead.createdAt ? formatDate(opportunity.lead.createdAt) : 'Não disponível'}</p>
              </div>
            </div>
            
            {opportunity.lead.phone && (
              <div>
                <p className="text-gray-400 mb-1 text-xs">Contato:</p>
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span className="text-seguranca-lightgray">{opportunity.lead.phone}</span>
                </div>
              </div>
            )}

            <div>
              <p className="text-gray-400 mb-1 text-xs">Dias até fechamento:</p>
              <div className="flex items-center gap-2">
                <Target className={`h-4 w-4 ${getDaysUntilCloseColor()}`} />
                <span className={`font-semibold ${getDaysUntilCloseColor()}`}>
                  {getDaysUntilClose()} dias
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 