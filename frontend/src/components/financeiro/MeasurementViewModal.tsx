import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
  FileCheck,
  Download,
  Loader2
} from 'lucide-react';
import { MeasurementBulletin, MeasurementCategory } from '@/types/measurement';
import { measurementService } from '@/services/measurementService';

const CATEGORY_LABELS: Record<string, string> = {
  [MeasurementCategory.LEASE]: '1. Locação em Regime Global',
  [MeasurementCategory.EXCESS_KM]: '2. Quilometragem Excedente',
  [MeasurementCategory.FUEL]: '3. Combustíveis Adicionais',
  [MeasurementCategory.DRIVER_COST]: '4. Custo Operacional de Motorista',
  [MeasurementCategory.EXTRA_TRIP]: '5. Viagens Extras',
  [MeasurementCategory.RETENTION]: 'Retenção de Garantia (5%)',
  [MeasurementCategory.OTHER]: 'Outros'
};

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
  const { toast } = useToast();
  const [generatingReport, setGeneratingReport] = useState(false);

  // Função para gerar relatório PDF
  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      console.log(`📄 Gerando relatório para boletim: ${bulletin.id}`);

      const blob = await measurementService.generateBulletinPDF(bulletin.id);
      if (!blob || blob.size === 0) {
        throw new Error('Relatório gerado está vazio');
      }

      console.log('✅ Relatório recebido, tamanho:', blob.size, 'bytes');

      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `boletim_medicao_${bulletin.contractNumber || bulletin.id}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar URL após download
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      toast({
        title: "Sucesso",
        description: `Relatório gerado com sucesso! (${Math.round(blob.size / 1024)} KB)`,
      });

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: `Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

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
                  <p className="text-seguranca-lightgray">{bulletin.clientName || bulletin.client?.name || 'Cliente não definido'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Unidade</label>
                  <p className="text-seguranca-lightgray">{bulletin.unitName || bulletin.unit?.name || 'Unidade não definida'}</p>
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
                      <div className="col-span-2 text-seguranca-lightgray">
                        <div className="font-medium">{item.description}</div>
                        <div className="text-[10px] text-gray-500 italic">
                          {CATEGORY_LABELS[item.category || MeasurementCategory.OTHER] || item.category}
                        </div>
                        {item.diaria && item.diaria > 0 && (
                          <div className="text-[10px] text-gray-500 mt-0.5">Diária: {formatCurrency(item.diaria)}</div>
                        )}
                        {item.category === MeasurementCategory.EXCESS_KM && (
                          <div className="text-[10px] text-blue-400 mt-0.5">
                            KM Consid: {(item.kmConsiderado ?? ((item.finalKm ?? 0) - (item.initialKm ?? 0))).toFixed(2)} | KM Exced: {(item.kmExcedido ?? 0).toFixed(2)} | Val KM Exc: {formatCurrency(item.valorKmExcedido || 0)}
                          </div>
                        )}
                        {item.isExtraTrip && (
                          <div className="text-[10px] text-orange-400 mt-0.5">
                            {item.tripDate && <span>Data: {formatDate(item.tripDate)} | </span>}
                            {item.vehiclePlate && <span>Placa: {item.vehiclePlate} | </span>}
                            {item.route && <span>Trajeto: {item.route} | </span>}
                            {item.vehicleType && <span>Tipo: {item.vehicleType}</span>}
                          </div>
                        )}
                      </div>
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
          <div className="flex justify-between items-center pt-4 border-t border-gray-600">
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="bg-seguranca-yellow hover:bg-yellow-600 text-black font-medium"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório PDF
                  </>
                )}
              </Button>
            </div>

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
