import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Download,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar as CalendarIcon,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Pagamento, AgendamentoPagamento } from '@/services/pagamentosService';

interface PagamentoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pagamento: Pagamento | null;
  onEdit?: (pagamento: Pagamento) => void;
  onGenerateReport?: (pagamentoId: string, format: 'pdf' | 'excel') => void;
}

export const PagamentoViewModal: React.FC<PagamentoViewModalProps> = ({
  isOpen,
  onClose,
  pagamento,
  onEdit,
  onGenerateReport
}) => {
  const { toast } = useToast();
  const [generatingReport, setGeneratingReport] = useState(false);

  if (!pagamento) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'PAID': return <CheckCircle className="w-4 h-4" />;
      case 'OVERDUE': return <AlertCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'PAID': return 'Pago';
      case 'OVERDUE': return 'Vencido';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const labels = {
      'PIX': 'PIX',
      'BOLETO': 'Boleto',
      'TRANSFERENCIA': 'Transferência',
      'CARTAO': 'Cartão',
      'DINHEIRO': 'Dinheiro'
    };
    return labels[forma as keyof typeof labels] || forma;
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels = {
      'FORNECEDOR': 'Fornecedor',
      'SERVICO': 'Serviço',
      'EQUIPAMENTO': 'Equipamento',
      'IMPOSTO': 'Imposto',
      'OUTROS': 'Outros'
    };
    return labels[categoria as keyof typeof labels] || categoria;
  };

  const getAgendamentoStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADO': return 'bg-blue-100 text-blue-800';
      case 'EXECUTADO': return 'bg-green-100 text-green-800';
      case 'CANCELADO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgendamentoStatusLabel = (status: string) => {
    switch (status) {
      case 'AGENDADO': return 'Agendado';
      case 'EXECUTADO': return 'Executado';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    if (!onGenerateReport) return;
    
    setGeneratingReport(true);
    try {
      await onGenerateReport(pagamento.id, format);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const isVencimentoProximo = () => {
    if (!pagamento.dataVencimento) return false;
    const hoje = new Date();
    const vencimento = new Date(pagamento.dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isVencido = () => {
    if (!pagamento.dataVencimento) return false;
    const hoje = new Date();
    const vencimento = new Date(pagamento.dataVencimento);
    return vencimento < hoje && pagamento.status === 'PENDING';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Pagamento</span>
            <Badge className={getStatusColor(pagamento.status)}>
              {getStatusIcon(pagamento.status)}
              <span className="ml-1">{getStatusLabel(pagamento.status)}</span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            ID: {pagamento.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alertas de Vencimento */}
          {(isVencimentoProximo() || isVencido()) && (
            <Alert className={isVencido() ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isVencido() 
                  ? '⚠️ Este pagamento está VENCIDO!'
                  : '⚠️ Este pagamento vence em breve (3 dias ou menos)'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Informações do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                  <p className="text-lg font-semibold">{pagamento.descricao}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor</Label>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Vencimento</Label>
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(pagamento.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Pagamento</Label>
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {pagamento.dataPagamento 
                      ? format(new Date(pagamento.dataPagamento), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Não pago'
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Forma de Pagamento</Label>
                  <p className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {getFormaPagamentoLabel(pagamento.formaPagamento)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Categoria</Label>
                  <p className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    {getCategoriaLabel(pagamento.categoria)}
                  </p>
                </div>
              </div>

              {pagamento.numeroDocumento && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número do Documento</Label>
                  <p className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    {pagamento.numeroDocumento}
                  </p>
                </div>
              )}

              {pagamento.centroCusto && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Centro de Custo</Label>
                  <p>{pagamento.centroCusto}</p>
                </div>
              )}

              {pagamento.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-gray-700">{pagamento.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Nome</Label>
                <p className="text-lg font-semibold">{pagamento.clienteNome}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pagamento.clienteEmail && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">E-mail</Label>
                    <p className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {pagamento.clienteEmail}
                    </p>
                  </div>
                )}
                {pagamento.clienteTelefone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                    <p className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {pagamento.clienteTelefone}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agendamento */}
          {pagamento.agendamento && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Agendamento de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status do Agendamento</Label>
                    <Badge className={getAgendamentoStatusColor(pagamento.agendamento.status)}>
                      {getAgendamentoStatusLabel(pagamento.agendamento.status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data Agendada</Label>
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(pagamento.agendamento.dataAgendamento), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {pagamento.agendamento.dataExecucao && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Execução</Label>
                    <p className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {format(new Date(pagamento.agendamento.dataExecucao), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}

                {pagamento.agendamento.observacoes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Observações do Agendamento</Label>
                    <p className="text-gray-700">{pagamento.agendamento.observacoes}</p>
                  </div>
                )}

                {pagamento.agendamento.alertasEnviados && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Alertas de vencimento foram enviados para este pagamento.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Datas de Criação e Atualização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Criação</Label>
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(pagamento.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Última Atualização</Label>
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(pagamento.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              {onEdit && (
                <Button variant="outline" onClick={() => onEdit(pagamento)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              {onGenerateReport && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport('pdf')}
                    disabled={generatingReport}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Relatório PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport('excel')}
                    disabled={generatingReport}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Relatório Excel
                  </Button>
                </>
              )}
              <Button onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
