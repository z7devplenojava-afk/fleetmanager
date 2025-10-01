import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  Building2, 
  Tag, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Download,
  Edit,
  Users
} from 'lucide-react';
import { ContaAReceber } from './ContasAReceberFormModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContasAReceberViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: ContaAReceber | null;
}

export const ContasAReceberViewModal: React.FC<ContasAReceberViewModalProps> = ({
  isOpen,
  onClose,
  conta
}) => {
  if (!conta) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return <Badge className="bg-yellow-100 text-yellow-800">Aberta</Badge>;
      case 'RECEBIDA':
        return <Badge className="bg-green-100 text-green-800">Recebida</Badge>;
      case 'VENCIDA':
        return <Badge className="bg-red-100 text-red-800">Vencida</Badge>;
      case 'CANCELADA':
        return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'FATURA':
        return <Badge className="bg-blue-100 text-blue-800">Fatura</Badge>;
      case 'MEDICAO':
        return <Badge className="bg-purple-100 text-purple-800">Medição</Badge>;
      case 'SERVICO':
        return <Badge className="bg-green-100 text-green-800">Serviço</Badge>;
      case 'PRODUTO':
        return <Badge className="bg-orange-100 text-orange-800">Produto</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{tipo}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'RECEBIDA':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'VENCIDA':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'CANCELADA':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-500 flex items-center gap-2">
            <FileText size={20} />
            Detalhes da Conta a Receber
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com Status e Ações */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {getStatusIcon(conta.status)}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {conta.numeroFatura || 'Sem número'}
                </h3>
                <p className="text-gray-300">{conta.descricao}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(conta.status)}
              {getTipoBadge(conta.tipo)}
            </div>
          </div>

          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                  <DollarSign size={16} />
                  Informações Financeiras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Valor:</span>
                  <span className="text-green-400 font-semibold text-lg">
                    {formatCurrency(conta.valor)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  {getStatusBadge(conta.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Tipo:</span>
                  {getTipoBadge(conta.tipo)}
                </div>
                {conta.codigoBarras && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Código de Barras:</span>
                    <span className="text-white font-mono text-sm">{conta.codigoBarras}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                  <Calendar size={16} />
                  Datas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conta.dataEmissao && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Data de Emissão:</span>
                    <span className="text-white">
                      {format(conta.dataEmissao, 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-300">Vencimento:</span>
                  <span className="text-white">
                    {format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                {conta.dataPagamento && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Data de Pagamento:</span>
                    <span className="text-green-400">
                      {format(conta.dataPagamento, 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
                {conta.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Criado em:</span>
                    <span className="text-gray-400 text-sm">
                      {format(conta.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Informações do Cliente e Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                  <Users size={16} />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-white font-medium">{conta.cliente}</p>
                  {conta.clienteId && (
                    <p className="text-gray-400 text-sm">ID: {conta.clienteId}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                  <Building2 size={16} />
                  Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-white font-medium">{conta.empresa}</p>
                  {conta.empresaId && (
                    <p className="text-gray-400 text-sm">ID: {conta.empresaId}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categoria e Centro de Custo */}
          {(conta.categoria || conta.centroCusto) && (
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                  <Tag size={16} />
                  Classificação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conta.categoria && (
                    <div>
                      <span className="text-gray-300 text-sm">Categoria:</span>
                      <p className="text-white">{conta.categoria}</p>
                    </div>
                  )}
                  {conta.centroCusto && (
                    <div>
                      <span className="text-gray-300 text-sm">Centro de Custo:</span>
                      <p className="text-white">{conta.centroCusto}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {conta.observacoes && (
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                  <FileText size={16} />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white whitespace-pre-wrap">{conta.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-600">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-white hover:bg-seguranca-black"
            >
              Fechar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
            >
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
