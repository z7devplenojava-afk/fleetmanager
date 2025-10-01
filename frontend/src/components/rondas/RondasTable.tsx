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
  Loader2
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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando rondas...</span>
        </CardContent>
      </Card>
    );
  }

  if (rondas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ronda encontrada</h3>
          <p className="text-gray-500 text-center">
            Não há rondas cadastradas ou que correspondam aos filtros aplicados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rondas ({rondas.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Checkpoints</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rondas.map((ronda) => (
                <TableRow key={ronda.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ronda.nome}</div>
                      {ronda.descricao && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {ronda.descricao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getTipoBadge(ronda.tipo)}
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(ronda.status)}
                  </TableCell>
                  
                  <TableCell>
                    {getPrioridadeBadge(ronda.prioridade)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{ronda.responsavelNome}</div>
                        {ronda.supervisorNome && (
                          <div className="text-sm text-gray-500">
                            Sup: {ronda.supervisorNome}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{ronda.localNome}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {ronda.endereco}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {formatDate(ronda.dataInicio)}
                      </div>
                      <div className="text-gray-500">
                        até {formatDate(ronda.dataFim)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {formatDuration(ronda.duracaoEstimada)}
                        </div>
                        {ronda.duracaoReal && (
                          <div className="text-sm text-gray-500">
                            Real: {formatDuration(ronda.duracaoReal)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {ronda.checkpoints.length} pontos
                      </div>
                      <div className="text-gray-500">
                        {ronda.checkpoints.filter(cp => cp.obrigatorio).length} obrigatórios
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(ronda)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {canEdit(ronda) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(ronda)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canIniciar(ronda) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onIniciar(ronda)}
                          title="Iniciar Ronda"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canConcluir(ronda) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onConcluir(ronda)}
                          title="Concluir Ronda"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canCancelar(ronda) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancelar(ronda)}
                          title="Cancelar Ronda"
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canDelete(ronda) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(ronda)}
                          title="Excluir"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
