import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  FileText, 
  Calendar, 
  User, 
  Clock, 
  Building2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShiftChangeFormDTO } from '@/services/shiftChangeService';

interface ShiftChangeViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftChange?: ShiftChangeFormDTO | null;
  onGeneratePDF?: (shiftChange: ShiftChangeFormDTO) => void;
  onEdit?: (shiftChange: ShiftChangeFormDTO) => void;
  onDelete?: (shiftChange: ShiftChangeFormDTO) => void;
}

const ShiftChangeViewModal: React.FC<ShiftChangeViewModalProps> = ({
  open,
  onOpenChange,
  shiftChange,
  onGeneratePDF,
  onEdit,
  onDelete
}) => {
  if (!shiftChange) return null;

  const shiftTimeLabels = {
    'SHIFT_6H_18H': '6h às 18h',
    'SHIFT_18H_6H': '18h às 6h',
    'SHIFT_7H_19H': '7h às 19h',
    'SHIFT_19H_7H': '19h às 7h'
  };

  const getStatusProps = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
          text: 'Pendente',
          icon: AlertCircle
        };
      case 'APPROVED':
        return { 
          color: 'bg-green-500/20 text-green-400 border-green-500/30', 
          text: 'Aprovado',
          icon: CheckCircle
        };
      case 'REJECTED':
        return { 
          color: 'bg-red-500/20 text-red-400 border-red-500/30', 
          text: 'Rejeitado',
          icon: XCircle
        };
      default:
        return { 
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', 
          text: 'Desconhecido',
          icon: AlertCircle
        };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const statusProps = getStatusProps(shiftChange.status || 'PENDING');
  const StatusIcon = statusProps.icon;

  const handleGeneratePDF = () => {
    if (onGeneratePDF) {
      onGeneratePDF(shiftChange);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(shiftChange);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(shiftChange);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            Detalhes da Troca de Plantão
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Visualize os detalhes completos da solicitação de troca de plantão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho com Status */}
          <Card className="bg-seguranca-black/30 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-seguranca-yellow" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-seguranca-lightgray">
                      Solicitação #{shiftChange.id}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Criada em {formatDate(shiftChange.dateOfRequest)}
                    </p>
                  </div>
                </div>
                <Badge className={`${statusProps.color} border`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {statusProps.text}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados do Solicitante */}
            <Card className="bg-seguranca-black/20 border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nome:</span>
                    <span className="text-seguranca-lightgray font-medium">
                      {shiftChange.requesterFullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Setor:</span>
                    <span className="text-seguranca-lightgray font-medium">
                      {shiftChange.requesterSector}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Data do Plantão:</span>
                    <span className="text-seguranca-lightgray font-medium">
                      {formatDate(shiftChange.requesterShiftDate)}
                    </span>
                  </div>
                  {shiftChange.requesterDayOffDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data da Folga:</span>
                      <span className="text-seguranca-lightgray font-medium">
                        {formatDate(shiftChange.requesterDayOffDate)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dados do Colega */}
            <Card className="bg-seguranca-black/20 border-gray-600">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Colega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nome:</span>
                    <span className="text-seguranca-lightgray font-medium">
                      {shiftChange.replacingFullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Setor:</span>
                    <span className="text-seguranca-lightgray font-medium">
                      {shiftChange.replacingSector}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Data do Plantão:</span>
                    <span className="text-seguranca-lightgray font-medium">
                      {formatDate(shiftChange.replacingShiftDate)}
                    </span>
                  </div>
                  {shiftChange.replacingDayOffDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data da Folga:</span>
                      <span className="text-seguranca-lightgray font-medium">
                        {formatDate(shiftChange.replacingDayOffDate)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Horário do Plantão */}
          <Card className="bg-seguranca-black/20 border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horário do Plantão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-seguranca-lightgray">
                    {shiftTimeLabels[shiftChange.shiftTime]}
                  </p>
                  <p className="text-sm text-gray-400">
                    Turno de trabalho
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card className="bg-seguranca-black/20 border-gray-600">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Data de Criação:</span>
                    <span className="text-seguranca-lightgray font-medium">
                      {shiftChange.createdAt ? formatDate(shiftChange.createdAt) : 'Não informado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Última Atualização:</span>
                    <span className="text-seguranca-lightgray font-medium">
                      {shiftChange.updatedAt ? formatDate(shiftChange.updatedAt) : 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
            title="Gerar PDF"
          >
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              onClick={handleEdit}
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
              title="Editar"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-400 hover:bg-gray-700"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftChangeViewModal;
