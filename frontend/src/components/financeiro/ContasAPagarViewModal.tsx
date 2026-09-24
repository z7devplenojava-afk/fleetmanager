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
  Layers,
  FileSpreadsheet,
  Receipt
} from 'lucide-react';
import { ContaAPagar } from './ContasAPagarFormModal';
import { getClassificacaoStyle } from '@/constants/classificacaoContasPagar';
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
    }).format(value || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGA':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 px-3 py-1 text-xs">
            <CheckCircle size={13} className="text-emerald-400" />
            Paga
          </Badge>
        );
      case 'ABERTA':
        return (
          <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold flex items-center gap-1.5 px-3 py-1 text-xs">
            <Clock size={13} className="text-sky-400" />
            Aberta
          </Badge>
        );
      case 'VENCIDA':
      case 'ATRASADA':
        return (
          <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5 px-3 py-1 text-xs">
            <AlertTriangle size={13} className="text-rose-400" />
            {status === 'VENCIDA' ? 'Vencida' : 'Atrasada'}
          </Badge>
        );
      case 'CANCELADA':
        return (
          <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium flex items-center gap-1.5 px-3 py-1 text-xs">
            <XCircle size={13} />
            Cancelada
          </Badge>
        );
      default:
        return <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-3 py-1 text-xs">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'FIXA' 
      ? <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs px-2.5 py-0.5">Despesa Fixa</Badge>
      : <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs px-2.5 py-0.5">Despesa Variável</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-zinc-800 pb-4">
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-2.5">
            <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            Detalhes da Conta a Pagar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Informações Principais */}
          <Card className="bg-zinc-950/80 border-zinc-800 rounded-xl overflow-hidden shadow-lg">
            <CardHeader className="py-3 px-4 bg-zinc-900/60 border-b border-zinc-800/80">
              <CardTitle className="text-zinc-200 text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Informações do Fornecedor & Classificação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fornecedor</label>
                <p className="text-white font-bold text-sm mt-0.5">{conta.fornecedor || 'Não Informado'}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Empresa (Sigla)</label>
                <p className="text-zinc-200 font-semibold text-sm mt-0.5">{conta.companySigla || conta.empresa || '-'}</p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Descrição</label>
                <p className="text-zinc-200 text-sm mt-0.5 font-medium">{conta.descricao || '-'}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo de Despesa</label>
                <div className="mt-1">{getTipoBadge(conta.tipo)}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status Atual</label>
                <div className="mt-1">{getStatusBadge(conta.status)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Valores e Datas */}
          <Card className="bg-zinc-950/80 border-zinc-800 rounded-xl overflow-hidden shadow-lg">
            <CardHeader className="py-3 px-4 bg-zinc-900/60 border-b border-zinc-800/80">
              <CardTitle className="text-zinc-200 text-sm font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Valores e Prazos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Valor do Documento</label>
                <p className="text-emerald-400 font-black text-xl font-mono mt-0.5">{formatCurrency(conta.valor)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data de Vencimento</label>
                <p className="text-white font-bold text-sm mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  {conta.vencimento ? format(new Date(conta.vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data de Pagamento</label>
                <p className="text-zinc-300 font-medium text-sm mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  {conta.dataPagamento ? format(new Date(conta.dataPagamento), 'dd/MM/yyyy', { locale: ptBR }) : 'Pendente'}
                </p>
              </div>

              {conta.obra && (
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Obra / Setor</label>
                  <p className="text-sky-300 font-semibold text-sm mt-0.5">{conta.obra}</p>
                </div>
              )}

              {conta.categoria && (() => {
                const style = getClassificacaoStyle(conta.categoria);
                return (
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Classificação de Contas</label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {conta.categoria}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {style.grupoNome}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {conta.centroCusto && (
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Centro de Custo</label>
                  <p className="text-purple-300 font-semibold text-sm mt-0.5">{conta.centroCusto}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalhes da Despesa / Relatório SIGLO */}
          {(conta.expenseNumber || conta.supplierCode || conta.bankAccountInfo || conta.paidAmount !== undefined || conta.balanceAmount !== undefined) && (
            <Card className="bg-zinc-950/80 border-emerald-900/50 rounded-xl overflow-hidden shadow-lg">
              <CardHeader className="py-3 px-4 bg-emerald-950/20 border-b border-emerald-900/40">
                <CardTitle className="text-emerald-300 text-sm font-bold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Dados do Relatório de Despesas (SIGLO)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Nº da Despesa</label>
                  <p className="text-white font-bold text-sm mt-0.5">{conta.expenseNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Seq / Parcela</label>
                  <p className="text-white font-bold text-sm mt-0.5">{conta.installmentSeq || 1}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Cód. Fornecedor</label>
                  <p className="text-white font-bold text-sm mt-0.5">{conta.supplierCode || '-'}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Cancelada</label>
                  <p className="text-white font-bold text-sm mt-0.5">{conta.isCanceled ? 'Sim' : 'Não'}</p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Juros</label>
                  <p className="text-zinc-300 font-mono text-sm mt-0.5">{formatCurrency(conta.interestAmount || 0)}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Multa</label>
                  <p className="text-zinc-300 font-mono text-sm mt-0.5">{formatCurrency(conta.fineAmount || 0)}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Desconto</label>
                  <p className="text-zinc-300 font-mono text-sm mt-0.5">{formatCurrency(conta.discountAmount || 0)}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Ajustes</label>
                  <p className="text-zinc-300 font-mono text-sm mt-0.5">{formatCurrency(conta.adjustmentAmount || 0)}</p>
                </div>

                <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40">
                  <label className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Valor Pago</label>
                  <p className="text-emerald-300 font-bold font-mono text-base mt-0.5">{formatCurrency(conta.paidAmount || 0)}</p>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Saldo Restante</label>
                  <p className="text-white font-bold font-mono text-base mt-0.5">{formatCurrency(conta.balanceAmount || 0)}</p>
                </div>
                <div className="sm:col-span-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Conta Corrente / Domicílio Bancário</label>
                  <p className="text-zinc-200 font-mono text-sm mt-0.5">{conta.bankAccountInfo || 'Não informado no relatório'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          {(conta.codigoBarras || conta.observacoes) && (
            <Card className="bg-zinc-950/80 border-zinc-800 rounded-xl overflow-hidden shadow-lg">
              <CardHeader className="py-3 px-4 bg-zinc-900/60 border-b border-zinc-800/80">
                <CardTitle className="text-zinc-200 text-sm font-bold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-sky-400" />
                  Código de Barras e Observações
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {conta.codigoBarras && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Código de Barras / Linha Digitável</label>
                    <p className="text-zinc-100 mt-1 font-mono text-xs bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 select-all">
                      {conta.codigoBarras}
                    </p>
                  </div>
                )}
                {conta.observacoes && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Observações</label>
                    <p className="text-zinc-300 mt-1 text-sm bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 whitespace-pre-wrap">
                      {conta.observacoes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onEdit && (
                <Button 
                  variant="outline" 
                  onClick={() => onEdit(conta)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white text-xs font-semibold h-9"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  Editar Conta
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button 
                onClick={onClose}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold h-9 px-4 border border-zinc-700"
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


