import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Play, 
  Square, 
  X, 
  Eye, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Route
} from 'lucide-react';
import { Ronda, RondaStatus, RondaTipo, RondaPrioridade } from '@/types/rondas';

interface RondasTableProps {
  rondas: Ronda[];
  loading: boolean;
  onView: (ronda: Ronda) => void;
  onEdit: (ronda: Ronda) => void;
  onDelete: (ronda: Ronda) => void;
  onIniciar: (ronda: Ronda) => void;
  onConcluir: (ronda: Ronda) => void;
  onCancelar: (ronda: Ronda) => void;
}

export const RondasTable: React.FC<RondasTableProps> = ({
  rondas,
  loading,
  onView,
  onEdit,
  onDelete,
  onIniciar,
  onConcluir,
  onCancelar
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getStatusBadge = (status: RondaStatus) => {
    const statusConfig = {
      AGENDADA: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Agendada' },
      EM_ANDAMENTO: { color: 'bg-yellow-100 text-yellow-800', icon: Play, label: 'Em Andamento' },
      CONCLUIDA: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Concluída' },
      CANCELADA: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelada' },
      ATRASADA: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Atrasada' }
    };

    const config = statusConfig[status] || statusConfig.AGENDADA;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: RondaTipo) => {
    const tipoConfig = {
      PREVENTIVA: { color: 'bg-blue-100 text-blue-800', label: 'Preventiva' },
      PATRULHAMENTO: { color: 'bg-green-100 text-green-800', label: 'Patrulhamento' },
      VIGILANCIA: { color: 'bg-purple-100 text-purple-800', label: 'Vigilância' },
      EMERGENCIA: { color: 'bg-red-100 text-red-800', label: 'Emergência' },
      ESPECIAL: { color: 'bg-orange-100 text-orange-800', label: 'Especial' }
    };

    const config = tipoConfig[tipo] || tipoConfig.PREVENTIVA;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: RondaPrioridade) => {
    const prioridadeConfig = {
      BAIXA: { color: 'bg-gray-100 text-gray-800', label: 'Baixa' },
      MEDIA: { color: 'bg-blue-100 text-blue-800', label: 'Média' },
      ALTA: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      CRITICA: { color: 'bg-red-100 text-red-800', label: 'Crítica' }
    };

    const config = prioridadeConfig[prioridade] || prioridadeConfig.MEDIA;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const canIniciar = (ronda: Ronda) => {
    return ronda.status === 'AGENDADA';
  };

  const canConcluir = (ronda: Ronda) => {
    return ronda.status === 'EM_ANDAMENTO';
  };

  const canCancelar = (ronda: Ronda) => {
    return ['AGENDADA', 'EM_ANDAMENTO'].includes(ronda.status);
  };

  const canEdit = (ronda: Ronda) => {
    return ronda.status === 'AGENDADA';
  };

  const canDelete = (ronda: Ronda) => {
    return ronda.status === 'AGENDADA';
  };

  if (loading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-sm sm:text-base text-seguranca-lightgray">Carregando rondas...</span>
        </CardContent>
      </Card>
    );
  }

  if (rondas.length === 0) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
          <div className="p-3 sm:p-4 bg-gray-700/50 rounded-full mb-3 sm:mb-4">
            <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-seguranca-lightgray mb-2 text-center">Nenhuma ronda encontrada</h3>
          <p className="text-xs sm:text-sm text-gray-400 text-center max-w-md">
            Não há rondas cadastradas ou que correspondam aos filtros aplicados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-seguranca-graphite border-gray-600 w-full">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
          <Route className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
          Rondas ({rondas.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 w-full">
        {/* Cards Grid - Responsivo para todas as telas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {rondas.map((ronda) => (
            <Card key={ronda.id} className="bg-seguranca-black/50 border-gray-700 hover:border-seguranca-yellow/50 transition-all h-full flex flex-col">
              <CardContent className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
                {/* Header com Nome e Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-base sm:text-lg mb-1 truncate">{ronda.nome}</h3>
                    {ronda.descricao && (
                      <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">{ronda.descricao}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(ronda.status)}
                  </div>
                </div>
                
                {/* Tipo e Prioridade */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Tipo:</span>
                    {getTipoBadge(ronda.tipo)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Prioridade:</span>
                    {getPrioridadeBadge(ronda.prioridade)}
                  </div>
                </div>

                {/* Informações Principais */}
                <div className="space-y-2 text-sm border-t border-gray-700 pt-3 flex-1">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-400 text-xs">Responsável:</span>
                      <div className="text-white font-medium truncate">{ronda.responsavelNome || 'N/A'}</div>
                      {ronda.supervisorNome && (
                        <div className="text-xs text-gray-400 truncate">
                          Sup: {ronda.supervisorNome}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-400 text-xs">Local:</span>
                      <div className="text-white font-medium truncate">{ronda.localNome || 'N/A'}</div>
                      {ronda.endereco && (
                        <div className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                          {ronda.endereco}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-400 text-xs">Data/Hora:</span>
                      <div className="text-white text-sm">
                        {formatDate(ronda.dataInicio)}
                      </div>
                      <div className="text-xs text-gray-400">
                        até {formatDate(ronda.dataFim)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-gray-400 text-xs">Duração:</span>
                      <div className="text-white text-sm font-medium">
                        {formatDuration(ronda.duracaoEstimada)}
                      </div>
                      {ronda.duracaoReal && (
                        <div className="text-xs text-gray-400">
                          Real: {formatDuration(ronda.duracaoReal)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {ronda.checkpoints && ronda.checkpoints.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-gray-400 text-xs">Checkpoints:</span>
                        <div className="text-white text-sm">
                          {ronda.checkpoints.length} pontos
                        </div>
                        <div className="text-xs text-gray-400">
                          {ronda.checkpoints.filter(cp => cp.obrigatorio).length} obrigatórios
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-700 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(ronda)}
                    className="h-8 text-xs flex-1 min-w-[80px] hover:bg-gray-700"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  {canEdit(ronda) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(ronda)}
                      className="h-8 text-xs flex-1 min-w-[80px] hover:bg-gray-700"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  )}
                  {canIniciar(ronda) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onIniciar(ronda)}
                      className="h-8 text-xs flex-1 min-w-[80px] text-green-400 hover:bg-green-500/20"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Iniciar
                    </Button>
                  )}
                  {canConcluir(ronda) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onConcluir(ronda)}
                      className="h-8 text-xs flex-1 min-w-[80px] text-blue-400 hover:bg-blue-500/20"
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Concluir
                    </Button>
                  )}
                  {canCancelar(ronda) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancelar(ronda)}
                      className="h-8 text-xs flex-1 min-w-[80px] text-orange-400 hover:bg-orange-500/20"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  )}
                  {canDelete(ronda) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(ronda)}
                      className="h-8 text-xs flex-1 min-w-[80px] text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
