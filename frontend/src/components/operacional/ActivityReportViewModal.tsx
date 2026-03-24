import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Calendar,
  User,
  Building,
  MapPin,
  Clock,
  Download,
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ActivityReport } from '@/types/activityReport';
import { activityReportService } from '@/services/activityReportService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/axios';

interface ActivityReportViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ActivityReport | null;
  onEdit?: () => void;
}

const ActivityReportViewModal: React.FC<ActivityReportViewModalProps> = ({
  open,
  onOpenChange,
  report,
  onEdit
}) => {
  const { toast } = useToast();
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && report) {
      // Limpar PDF anterior quando abrir novo relatório
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setPdfBlob(null);
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [open, report]);

  const handleGeneratePDF = async () => {
    if (!report) return;

    try {
      setGeneratingPDF(true);
      console.log('📄 Gerando PDF para relatório:', report.id);
      
      // Gerar PDF para este relatório específico usando filtros
      const params = new URLSearchParams();
      if (report.employeeId) params.append('employeeId', report.employeeId);
      if (report.clientId) params.append('clientId', report.clientId);
      if (report.date) {
        params.append('startDate', report.date);
        params.append('endDate', report.date);
      }

      console.log('📄 Parâmetros da requisição:', params.toString());
      
      const response = await api.get(`/api/activity-reports/pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      
      console.log('✅ PDF recebido, tamanho:', response.data.size, 'bytes');
      
      if (!response.data || response.data.size === 0) {
        throw new Error('PDF gerado está vazio');
      }
      
      const blob = response.data;
      
      // Verificar se o blob é realmente um PDF válido
      if (blob.type && !blob.type.includes('pdf') && !blob.type.includes('application/octet-stream')) {
        console.warn('⚠️ Tipo MIME inesperado:', blob.type);
        // Mesmo assim, tentar processar como PDF
      }
      
      setPdfBlob(blob);
      
      // Criar URL do blob para visualização
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      toast({
        title: 'Sucesso',
        description: `PDF gerado com sucesso! (${Math.round(blob.size / 1024)} KB)`,
      });
    } catch (error: any) {
      console.error('❌ Erro ao gerar PDF:', error);
      console.error('❌ Detalhes do erro:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      toast({
        title: 'Erro',
        description: `Erro ao gerar PDF do relatório: ${error?.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfBlob && report) {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-atividade-${report.id}-${report.date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenPDF = () => {
    if (pdfBlob) {
      // Criar uma nova URL do blob para abrir em nova aba
      const url = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        // Revogar a URL após um tempo para liberar memória
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        toast({
          title: 'Aviso',
          description: 'Por favor, permita pop-ups para abrir o PDF.',
          variant: 'default',
        });
      }
    } else if (pdfUrl) {
      // Fallback para usar a URL existente
      window.open(pdfUrl, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-600">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-blue-600">Enviado</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary">Rascunho</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAbsenceStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Presente</Badge>;
      case 'ABSENT':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ausente</Badge>;
      case 'LATE':
        return <Badge className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Atraso</Badge>;
      case 'MEDICAL_LEAVE':
        return <Badge className="bg-blue-600">Atestado Médico</Badge>;
      case 'JUSTIFIED':
        return <Badge className="bg-purple-600">Falta Justificada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto w-[98vw] sm:w-[95vw]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              Detalhes do Relatório de Atividade
            </DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(report.status)}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Informações Básicas */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Funcionário</p>
                <p className="text-base font-semibold">{report.employeeName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                <p className="text-base font-semibold">{report.clientName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Posto de Trabalho</p>
                <p className="text-base font-semibold">{report.workPostName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data</p>
                <p className="text-base font-semibold">
                  {report.date ? format(new Date(report.date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Horário</p>
                <p className="text-base font-semibold">
                  {report.startTime && report.endTime 
                    ? `${report.startTime} - ${report.endTime}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status de Presença</p>
                <div className="mt-1">
                  {getAbsenceStatusBadge(report.absenceStatus)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descrição */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Descrição da Atividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{report.description || 'Sem descrição'}</p>
            </CardContent>
          </Card>

          {/* Equipamentos de Segurança */}
          {(report.ballisticPlate || report.weaponRegistry) && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  Equipamentos de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {report.ballisticPlate && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border">
                    <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-3">
                      Placa Balística
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Número</p>
                        <p className="font-semibold">{report.ballisticPlate.number || 'N/A'}</p>
                      </div>
                      {report.ballisticPlate.validUntil && (
                        <div>
                          <p className="text-xs text-muted-foreground">Validade</p>
                          <p className="font-semibold">
                            {format(new Date(report.ballisticPlate.validUntil), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {report.weaponRegistry && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-3">
                      Registro da Arma
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Número</p>
                        <p className="font-semibold">{report.weaponRegistry.number || 'N/A'}</p>
                      </div>
                      {report.weaponRegistry.validUntil && (
                        <div>
                          <p className="text-xs text-muted-foreground">Validade</p>
                          <p className="font-semibold">
                            {format(new Date(report.weaponRegistry.validUntil), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Divergências */}
          {report.divergences && (
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Divergências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{report.divergences}</p>
              </CardContent>
            </Card>
          )}

          {/* Consulta Médica */}
          {report.medicalConsultation && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Consulta Médica</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.medicalConsultation.date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data</p>
                    <p className="font-semibold">
                      {format(new Date(report.medicalConsultation.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
                {report.medicalConsultation.reason && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                    <p className="font-semibold">{report.medicalConsultation.reason}</p>
                  </div>
                )}
                {report.medicalConsultation.doctor && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Médico</p>
                    <p className="font-semibold">{report.medicalConsultation.doctor}</p>
                  </div>
                )}
                {report.medicalConsultation.result && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resultado</p>
                    <p className="font-semibold">{report.medicalConsultation.result}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Visualizador PDF */}
          {pdfUrl && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Visualização do PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleOpenPDF}
                      variant="outline"
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Abrir PDF em Nova Aba
                    </Button>
                    <Button 
                      onClick={handleDownloadPDF}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      className="w-full h-full border-0"
                      style={{ minHeight: '600px' }}
                      title="Visualização do PDF"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            {!pdfUrl && (
              <Button 
                onClick={handleGeneratePDF}
                disabled={generatingPDF}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {generatingPDF ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            )}
            {onEdit && report.status === 'DRAFT' && (
              <Button 
                onClick={onEdit}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                Editar Relatório
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityReportViewModal;
