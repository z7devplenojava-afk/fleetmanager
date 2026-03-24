import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  UserX, 
  FileText, 
  Calendar, 
  Shield, 
  Heart, 
  Coffee,
  User,
  MapPin,
  CalendarDays,
  Clock as ClockIcon
} from 'lucide-react';
import { Occurrence } from '@/services/occurrenceService';

interface OcorrenciaViewModalProps {
  ocorrencia: Occurrence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OcorrenciaViewModal: React.FC<OcorrenciaViewModalProps> = ({
  ocorrencia,
  open,
  onOpenChange
}) => {

  const getTipoIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'incidente':
        return <AlertTriangle className="h-5 w-5" />;
      case 'equipamento':
        return <CheckCircle className="h-5 w-5" />;
      case 'ausencia':
        return <UserX className="h-5 w-5" />;
      case 'manutencao':
        return <Clock className="h-5 w-5" />;
      case 'advertencia':
        return <AlertTriangle className="h-5 w-5" />;
      case 'folga':
        return <Calendar className="h-5 w-5" />;
      case 'ferias':
        return <Heart className="h-5 w-5" />;
      case 'licenca':
        return <FileText className="h-5 w-5" />;
      case 'dayoff':
        return <Coffee className="h-5 w-5" />;
      case 'atestado':
        return <Shield className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getTipoText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'incidente':
        return 'Incidente';
      case 'equipamento':
        return 'Equipamento';
      case 'ausencia':
        return 'Ausência';
      case 'manutencao':
        return 'Manutenção';
      case 'advertencia':
        return 'Advertência';
      case 'folga':
        return 'Folga';
      case 'ferias':
        return 'Férias';
      case 'licenca':
        return 'Licença';
      case 'dayoff':
        return 'Day Off';
      case 'atestado':
        return 'Atestado';
      default:
        return type;
    }
  };

  const getTipoVariant = (type: string): 'destructive' | 'secondary' | 'outline' | 'default' => {
    switch (type.toLowerCase()) {
      case 'incidente':
      case 'advertencia':
        return 'destructive';
      case 'equipamento':
      case 'ferias':
        return 'default';
      case 'ausencia':
      case 'licenca':
        return 'secondary';
      case 'manutencao':
      case 'dayoff':
        return 'outline';
      case 'folga':
      case 'atestado':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusVariant = (status: string): 'destructive' | 'secondary' | 'outline' | 'default' => {
    switch (status.toLowerCase()) {
      case 'aberta':
      case 'rejeitada':
        return 'destructive';
      case 'investigando':
        return 'secondary';
      case 'resolvida':
      case 'aprovada':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPriorityVariant = (priority: string): 'destructive' | 'secondary' | 'default' => {
    switch (priority.toLowerCase()) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'secondary';
      case 'baixa':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
        {!ocorrencia ? (
          <div className="p-6 text-center">
            <p className="text-seguranca-lightgray">Nenhuma ocorrência selecionada</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
                {getTipoIcon(ocorrencia.type)}
                Detalhes da Ocorrência
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Visualize todos os detalhes desta ocorrência
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-seguranca-lightgray mb-2">
                {ocorrencia.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getTipoVariant(ocorrencia.type)}>
                  {getTipoText(ocorrencia.type)}
                </Badge>
                <Badge variant={getStatusVariant(ocorrencia.status)}>
                  {ocorrencia.status}
                </Badge>
                <Badge variant={getPriorityVariant(ocorrencia.priority)}>
                  {ocorrencia.priority}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatDate(ocorrencia.date)}
            </div>
          </div>

          {/* Descrição */}
          <Card className="bg-seguranca-black border-gray-600">
            <CardContent className="p-4">
              <p className="text-seguranca-lightgray">{ocorrencia.description}</p>
            </CardContent>
          </Card>

          {/* Detalhes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-base text-seguranca-lightgray flex items-center gap-2">
                  <User className="h-5 w-5 text-seguranca-red" />
                  Informações do Funcionário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-gray-400">
                  <strong className="text-seguranca-lightgray">Funcionário:</strong> {ocorrencia.employeeName || 'N/A'}
                </p>
                <p className="text-gray-400">
                  <strong className="text-seguranca-lightgray">Responsável:</strong> {ocorrencia.responsible || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-base text-seguranca-lightgray flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-seguranca-red" />
                  Localização e Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-gray-400">
                  <strong className="text-seguranca-lightgray">Local:</strong> {ocorrencia.location || 'N/A'}
                </p>
                {ocorrencia.startDate && (
                  <p className="text-gray-400">
                    <strong className="text-seguranca-lightgray">Início:</strong> {formatDate(ocorrencia.startDate)}
                  </p>
                )}
                {ocorrencia.endDate && (
                  <p className="text-gray-400">
                    <strong className="text-seguranca-lightgray">Fim:</strong> {formatDate(ocorrencia.endDate)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Motivo (se aplicável) */}
          {ocorrencia.reason && (
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-base text-seguranca-lightgray">Motivo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-seguranca-lightgray">{ocorrencia.reason}</p>
              </CardContent>
            </Card>
          )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OcorrenciaViewModal; 