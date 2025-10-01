import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Shield, 
  User, 
  Calendar, 
  FileText, 
  Download,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { EPIControlRecord } from '@/types/epiControl';

interface EPIControlViewModalProps {
  record: EPIControlRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: EPIControlRecord) => void;
  onGenerateReport: (record: EPIControlRecord) => void;
}

const EPIControlViewModal: React.FC<EPIControlViewModalProps> = ({
  record,
  isOpen,
  onClose,
  onEdit,
  onGenerateReport
}) => {
  if (!record) return null;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = () => {
    if (record.dismissalDate) {
      return <Badge variant="destructive">Demitido</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  const getEquipmentStatusBadge = (item: any) => {
    if (item.replacedDate) {
      return <Badge variant="secondary">Substituído</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Controle de EPI - {record.employeeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Funcionário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações do Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                  <p className="text-sm">{record.employeeName}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Função</label>
                  <p className="text-sm">{record.employeeFunction}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">CPF</label>
                  <p className="text-sm">{record.employeeCpf}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">RG</label>
                  <p className="text-sm">{record.employeeRg}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Data de Admissão</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{formatDate(record.admissionDate)}</p>
                  </div>
                </div>
                {record.dismissalDate && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Data de Demissão</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{formatDate(record.dismissalDate)}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  {getStatusBadge()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações da Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Data da Entrega</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{formatDate(record.deliveryDate)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Responsável pela Entrega</label>
                  <p className="text-sm">{record.responsibleDelivery}</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Assinatura do Funcionário</label>
                  <p className="text-sm font-medium">{record.signature}</p>
                </div>
                {record.observations && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Observações</label>
                    <p className="text-sm">{record.observations}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Equipamentos de Proteção Individual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Nº</TableHead>
                      <TableHead>CA</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Entrega</TableHead>
                      <TableHead>Substituição</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assinatura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {record.equipmentItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.equipmentName}</TableCell>
                        <TableCell>{item.equipmentNumber}</TableCell>
                        <TableCell>{item.ca}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(item.deliveryDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.replacedDate ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(item.replacedDate)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.replacementReason || <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell>{getEquipmentStatusBadge(item)}</TableCell>
                        <TableCell className="text-sm">{item.signature}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={onClose} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Fechar
            </Button>
            <Button 
              onClick={() => onEdit(record)} 
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Editar
            </Button>
            <Button 
              onClick={() => onGenerateReport(record)} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Gerar Relatório PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EPIControlViewModal;
