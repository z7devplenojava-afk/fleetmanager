import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Clock, 
  User, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Square,
  X,
  Calendar,
  Navigation,
  Package
} from 'lucide-react';
import { Ronda, RondaStatus, RondaTipo, RondaPrioridade } from '@/types/rondas';

interface RondaViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ronda: Ronda | null;
  onIniciar?: (ronda: Ronda) => void;
  onConcluir?: (ronda: Ronda) => void;
  onCancelar?: (ronda: Ronda) => void;
}

export const RondaViewModal: React.FC<RondaViewModalProps> = ({
  open,
  onOpenChange,
  ronda,
  onIniciar,
  onConcluir,
  onCancelar
}) => {
  if (!ronda) return null;

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

  const getTipoLabel = (tipo: RondaTipo) => {
    const labels = {
      PREVENTIVA: 'Preventiva',
      PATRULHAMENTO: 'Patrulhamento',
      VIGILANCIA: 'Vigilância',
      EMERGENCIA: 'Emergência',
      ESPECIAL: 'Especial'
    };
    return labels[tipo] || tipo;
  };

  const getPrioridadeLabel = (prioridade: RondaPrioridade) => {
    const labels = {
      BAIXA: 'Baixa',
      MEDIA: 'Média',
      ALTA: 'Alta',
      CRITICA: 'Crítica'
    };
    return labels[prioridade] || prioridade;
  };

  const canIniciar = ronda.status === 'AGENDADA';
  const canConcluir = ronda.status === 'EM_ANDAMENTO';
  const canCancelar = ['AGENDADA', 'EM_ANDAMENTO'].includes(ronda.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{ronda.nome}</span>
            {getStatusBadge(ronda.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <div className="text-lg">{getTipoLabel(ronda.tipo)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Prioridade</label>
                  <div className="text-lg">{getPrioridadeLabel(ronda.prioridade)}</div>
                </div>
              </div>
              
              {ronda.descricao && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descrição</label>
                  <div className="text-lg">{ronda.descricao}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data e Horário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Data e Horário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Início</label>
                  <div className="text-lg">{formatDate(ronda.dataInicio)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fim</label>
                  <div className="text-lg">{formatDate(ronda.dataFim)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Duração Estimada</label>
                  <div className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDuration(ronda.duracaoEstimada)}
                  </div>
                </div>
                {ronda.duracaoReal && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duração Real</label>
                    <div className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatDuration(ronda.duracaoReal)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Responsáveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Responsável</label>
                <div className="text-lg">{ronda.responsavelNome}</div>
              </div>
              
              {ronda.supervisorNome && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Supervisor</label>
                  <div className="text-lg">{ronda.supervisorNome}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Local */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Local</label>
                <div className="text-lg">{ronda.localNome}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Endereço</label>
                <div className="text-lg">{ronda.endereco}</div>
              </div>
            </CardContent>
          </Card>

          {/* Checkpoints */}
          {ronda.checkpoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Checkpoints ({ronda.checkpoints.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ronda.checkpoints.map((checkpoint, index) => (
                  <div key={checkpoint.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {checkpoint.ordem}. {checkpoint.nome}
                      </h4>
                      <div className="flex items-center gap-2">
                        {checkpoint.obrigatorio && (
                          <Badge className="bg-red-100 text-red-800">
                            Obrigatório
                          </Badge>
                        )}
                        <Badge className="bg-blue-100 text-blue-800">
                          {formatDuration(checkpoint.tempoEstimado)}
                        </Badge>
                      </div>
                    </div>
                    
                    {checkpoint.descricao && (
                      <p className="text-gray-600 mb-2">{checkpoint.descricao}</p>
                    )}
                    
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {checkpoint.endereco}
                      </div>
                    </div>
                    
                    {checkpoint.status && checkpoint.status !== 'PENDENTE' && (
                      <div className="mt-2">
                        <Badge className={
                          checkpoint.status === 'VISITADO' 
                            ? 'bg-green-100 text-green-800'
                            : checkpoint.status === 'ATRASADO'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }>
                          {checkpoint.status === 'VISITADO' ? 'Visitado' :
                           checkpoint.status === 'ATRASADO' ? 'Atrasado' :
                           checkpoint.status === 'PULADO' ? 'Pulado' : 'Pendente'}
                        </Badge>
                        {checkpoint.dataVisita && (
                          <span className="ml-2 text-sm text-gray-500">
                            em {formatDate(checkpoint.dataVisita)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Equipamentos */}
          {ronda.equipamentos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Equipamentos ({ronda.equipamentos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ronda.equipamentos.map((equipamento, index) => (
                  <div key={equipamento.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{equipamento.equipamentoNome}</h4>
                      <Badge className={
                        equipamento.status === 'DISPONIVEL' ? 'bg-green-100 text-green-800' :
                        equipamento.status === 'EM_USO' ? 'bg-blue-100 text-blue-800' :
                        equipamento.status === 'MANUTENCAO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {equipamento.status === 'DISPONIVEL' ? 'Disponível' :
                         equipamento.status === 'EM_USO' ? 'Em Uso' :
                         equipamento.status === 'MANUTENCAO' ? 'Manutenção' :
                         'Danificado'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <div>Tipo: {equipamento.equipamentoTipo}</div>
                      {equipamento.numeroSerie && (
                        <div>Série: {equipamento.numeroSerie}</div>
                      )}
                    </div>
                    
                    {equipamento.observacoes && (
                      <p className="text-sm text-gray-600 mt-2">{equipamento.observacoes}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {ronda.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{ronda.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            
            {canIniciar && onIniciar && (
              <Button
                onClick={() => onIniciar(ronda)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Ronda
              </Button>
            )}
            
            {canConcluir && onConcluir && (
              <Button
                onClick={() => onConcluir(ronda)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Square className="h-4 w-4 mr-2" />
                Concluir Ronda
              </Button>
            )}
            
            {canCancelar && onCancelar && (
              <Button
                onClick={() => onCancelar(ronda)}
                variant="destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar Ronda
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
