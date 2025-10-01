import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  FileText, 
  Calculator, 
  Building2, 
  Calendar, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  FileCheck
} from 'lucide-react';
import { MeasurementBulletin } from '@/types/measurement';

interface MeasurementViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulletin: MeasurementBulletin;
}

export const MeasurementViewModal: React.FC<MeasurementViewModalProps> = ({
  open,
  onOpenChange,
  bulletin
}) => {
  // Obter propriedades do status
  const getStatusProps = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Rascunho', variant: 'secondary', icon: FileText, color: 'text-gray-400' };
      case 'PENDING':
        return { label: 'Pendente', variant: 'default', icon: Clock, color: 'text-yellow-400' };
      case 'VALIDATED':
        return { label: 'Validado', variant: 'default', icon: CheckCircle, color: 'text-green-400' };
      case 'CANCELLED':
        return { label: 'Cancelado', variant: 'destructive', icon: AlertCircle, color: 'text-red-400' };
      default:
        return { label: status, variant: 'outline', icon: AlertCircle, color: 'text-gray-400' };
    }
  };

  const statusProps = getStatusProps(bulletin.status);
  const StatusIcon = statusProps.icon;

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Formatar período
  const formatPeriod = (start: string, end: string) => {
    if (!start || !end) return '-';
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray text-xl flex items-center gap-2">
            <Eye className="h-5 w-5 text-seguranca-yellow" />
            Visualizar Boletim de Medição
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações do Boletim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Empresa</label>
                  <p className="text-seguranca-lightgray font-medium">{bulletin.companyName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusProps.variant as any} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusProps.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Número do Contrato</label>
                  <p className="text-seguranca-lightgray font-mono">{bulletin.contractNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Número da NF</label>
                  <p className="text-seguranca-lightgray">{bulletin.nfNumber || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Período de Medição</label>
                  <p className="text-seguranca-lightgray">{formatPeriod(bulletin.periodStart, bulletin.periodEnd)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Valor Total</label>
                  <p className="text-2xl font-bold text-seguranca-yellow">
                    {formatCurrency(bulletin.subtotal || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Cliente</label>
                  <p className="text-seguranca-lightgray">{bulletin.client?.name || 'Cliente não definido'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Unidade</label>
                  <p className="text-seguranca-lightgray">{bulletin.unit?.name || 'Unidade não definida'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Responsável pela Medição</label>
                  <p className="text-seguranca-lightgray">{bulletin.elaboratedBy}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Conferido por</label>
                  <p className="text-seguranca-lightgray">{bulletin.measuredBy}</p>
                </div>
              </div>

              {bulletin.validatedBy && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Validado por (ADM)</label>
                    <p className="text-seguranca-lightgray">{bulletin.validatedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Conferido por</label>
                    <p className="text-seguranca-lightgray">{bulletin.checkedBy || '-'}</p>
                  </div>
                </div>
              )}

              {bulletin.notes && (
                <div>
                  <label className="text-sm text-gray-400">Observações</label>
                  <p className="text-seguranca-lightgray mt-1">{bulletin.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens de Medição */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Itens de Medição ({bulletin.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bulletin.items && bulletin.items.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-400 border-b border-gray-600 pb-2">
                    <div>Item</div>
                    <div>Código</div>
                    <div className="col-span-2">Descrição</div>
                    <div>Unidade</div>
                    <div>Qtd</div>
                    <div>Preço Unit.</div>
                    <div>Total</div>
                  </div>
                  
                  {bulletin.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-7 gap-2 items-center p-3 bg-seguranca-graphite rounded border border-gray-600">
                      <div className="text-seguranca-lightgray font-medium">{item.itemNumber}</div>
                      <div className="text-seguranca-lightgray font-mono text-sm">{item.code}</div>
                      <div className="col-span-2 text-seguranca-lightgray">{item.description}</div>
                      <div className="text-seguranca-lightgray">{item.unit}</div>
                      <div className="text-seguranca-lightgray">{item.quantity}</div>
                      <div className="text-seguranca-lightgray">{formatCurrency(item.unitPrice)}</div>
                      <div className="text-seguranca-yellow font-medium">{formatCurrency(item.totalValue)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Nenhum item de medição cadastrado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Memória de Cálculo */}
          {bulletin.calculationMemory && (
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-seguranca-yellow text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Memória de Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Mês de Referência</label>
                    <p className="text-seguranca-lightgray">{bulletin.calculationMemory.monthReference || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Evidências</label>
                    <p className="text-seguranca-lightgray">
                      {bulletin.calculationMemory.evidencePath ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Detalhes do Cálculo</label>
                  <p className="text-seguranca-lightgray mt-1 whitespace-pre-wrap">
                    {bulletin.calculationMemory.details || 'Nenhum detalhe informado'}
                  </p>
                </div>

                {bulletin.calculationMemory.evidencePath && (
                  <div>
                    <label className="text-sm text-gray-400">Caminho das Evidências</label>
                    <p className="text-seguranca-lightgray mt-1 font-mono text-sm">
                      {bulletin.calculationMemory.evidencePath}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
