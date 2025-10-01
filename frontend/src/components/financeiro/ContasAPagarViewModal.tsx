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
  Edit
} from 'lucide-react';
import { ContaAPagar } from './ContasAPagarFormModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface ContasAPagarViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: ContaAPagar | null;
  onEdit?: (conta: ContaAPagar) => void;
  onGenerateReport?: (tipo: 'pdf' | 'excel') => void;
}

export const ContasAPagarViewModal: React.FC<ContasAPagarViewModalProps> = ({
  isOpen,
  onClose,
  conta,
  onEdit,
  onGenerateReport
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
      case 'PAGA':
        return <Badge className="bg-green-600 text-white flex items-center gap-1">
          <CheckCircle size={12} />
          Paga
        </Badge>;
      case 'ABERTA':
        return <Badge className="bg-seguranca-lightgray text-seguranca-black flex items-center gap-1">
          <Clock size={12} />
          Aberta
        </Badge>;
      case 'VENCIDA':
        return <Badge className="bg-seguranca-red text-white flex items-center gap-1">
          <AlertTriangle size={12} />
          Vencida
        </Badge>;
      case 'CANCELADA':
        return <Badge className="bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 flex items-center gap-1">
          <XCircle size={12} />
          Cancelada
        </Badge>;
      default:
        return <Badge className="bg-seguranca-lightgray text-seguranca-black">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'FIXA' 
      ? <Badge className="bg-seguranca-yellow text-seguranca-black">Fixa</Badge>
      : <Badge className="bg-seguranca-graphite text-seguranca-lightgray">Variável</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalhes da Conta a Pagar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Informações Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Descrição</label>
                  <p className="text-seguranca-lightgray mt-1">{conta.descricao}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Fornecedor</label>
                  <p className="text-seguranca-lightgray mt-1">{conta.fornecedor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Tipo</label>
                  <div className="mt-1">{getTipoBadge(conta.tipo)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Status</label>
                  <div className="mt-1">{getStatusBadge(conta.status)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores e Datas */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valores e Datas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Valor</label>
                  <p className="text-seguranca-lightgray mt-1 font-semibold text-lg">{formatCurrency(conta.valor)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Data de Vencimento</label>
                  <p className="text-seguranca-lightgray mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                {conta.dataPagamento && (
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray">Data de Pagamento</label>
                    <p className="text-seguranca-lightgray mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(conta.dataPagamento, 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
                {conta.centroCusto && (
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray">Centro de Custo</label>
                    <p className="text-seguranca-lightgray mt-1">{conta.centroCusto}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          {(conta.codigoBarras || conta.observacoes) && (
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {conta.codigoBarras && (
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray">Código de Barras</label>
                    <p className="text-seguranca-lightgray mt-1 font-mono">{conta.codigoBarras}</p>
                  </div>
                )}
                {conta.observacoes && (
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray">Observações</label>
                    <p className="text-seguranca-lightgray mt-1 whitespace-pre-wrap">{conta.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <div className="flex space-x-2">
              {onEdit && (
                <Button 
                  variant="outline" 
                  onClick={() => onEdit(conta)}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              {onGenerateReport && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onGenerateReport('pdf')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Relatório PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onGenerateReport('excel')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Relatório Excel
                  </Button>
                </>
              )}
              <Button 
                onClick={onClose}
                className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
