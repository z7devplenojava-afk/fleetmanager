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
  Receipt,
  GitBranch,
  Link2
} from 'lucide-react';
import { ContaAPagar } from './ContasAPagarFormModal';
import { getClassificacaoStyle } from '@/constants/classificacaoContasPagar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { LineageDetailModal, LineageStepType } from './LineageDetailModal';

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
  const [lineageModalType, setLineageModalType] = React.useState<LineageStepType | null>(null);
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
        <DialogHeader className="border-b border-zinc-800 pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-2.5">
            <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            Detalhes da Conta a Pagar
          </DialogTitle>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(conta)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold gap-1.5 h-8 mr-6"
            >
              <Edit className="w-3.5 h-3.5 text-amber-400" />
              Editar Esta Conta
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Banner de Destaque Rápido (Fornecedor, Vencimento, Status, Parcela e Valor) */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-md grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Fornecedor / Funcionário</span>
              <span className="text-zinc-100 font-bold text-sm truncate block mt-0.5" title={conta.employeeName || conta.fornecedor}>
                {conta.employeeName ? `👤 ${conta.employeeName}` : (conta.fornecedor || 'Não informado')}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Vencimento</span>
              <span className="text-amber-400 font-bold text-sm block mt-0.5">
                {conta.vencimento ? format(new Date(conta.vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status</span>
              <div className="mt-0.5">{getStatusBadge(conta.status)}</div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Parcela / Seq</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono font-bold text-xs mt-0.5">
                {conta.installmentSeq && conta.totalInstallments
                  ? `Parc. ${conta.installmentSeq}/${conta.totalInstallments}`
                  : conta.descricao?.match(/Parc\.\s*\d+\/\d+/i)
                  ? conta.descricao.match(/Parc\.\s*\d+\/\d+/i)![0]
                  : '1x À Vista'}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Valor</span>
              <span className="text-emerald-400 font-black font-mono text-base block mt-0.5">
                {formatCurrency(conta.valor)}
              </span>
            </div>
          </div>
          {/* Informações Principais */}
          <Card className="bg-zinc-950/80 border-zinc-800 rounded-xl overflow-hidden shadow-lg">
            <CardHeader className="py-3 px-4 bg-zinc-900/60 border-b border-zinc-800/80">
              <CardTitle className="text-zinc-200 text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Informações do Fornecedor / Funcionário & Classificação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fornecedor / Funcionário</label>
                <p className="text-white font-bold text-sm mt-0.5">
                  {conta.employeeName ? `👤 ${conta.employeeName}` : (conta.fornecedor || 'Não Informado')}
                </p>
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

          {/* PAINEL DE RASTREABILIDADE DE ORIGEM (LINHA DO TEMPO DA DESPESA) */}
          <div className="bg-zinc-950/60 border border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <GitBranch size={15} /> Rastreabilidade & Origem do Lançamento
              </span>
              <span className="text-[11px] text-zinc-400">
                Clique em um card para abrir os detalhes completos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Step 1: OS */}
              <div 
                onClick={() => setLineageModalType('WORK_ORDER')}
                className="bg-zinc-900/90 hover:bg-zinc-900 border border-blue-500/30 hover:border-blue-400 p-3 rounded-xl flex flex-col justify-between space-y-1 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-blue-500/10 group"
              >
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Ordem de Serviço</span>
                  <span className="text-blue-300 font-mono text-[10px] bg-blue-500/10 group-hover:bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/20">OS</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 font-mono flex items-center gap-1">
                  <Link2 size={12} className="text-blue-400 shrink-0" />
                  <span className="truncate group-hover:underline">
                    {conta.workOrderNumber || (conta.workOrderId ? `OS #${conta.workOrderId.slice(0, 8)}` : 'OS-2026-000105')}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 truncate flex items-center justify-between">
                  <span>Manutenção Preventiva</span>
                  <span className="text-blue-400 text-[9px] font-semibold">🔍 Ver</span>
                </div>
              </div>

              {/* Step 2: Cotação / Requisição */}
              <div 
                onClick={() => setLineageModalType('REQUISITION')}
                className="bg-zinc-900/90 hover:bg-zinc-900 border border-purple-500/30 hover:border-purple-400 p-3 rounded-xl flex flex-col justify-between space-y-1 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-purple-500/10 group"
              >
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Cotação / Requisição</span>
                  <span className="text-purple-300 font-mono text-[10px] bg-purple-500/10 group-hover:bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/20">COT/REQ</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 font-mono flex items-center gap-1">
                  <Link2 size={12} className="text-purple-400 shrink-0" />
                  <span className="truncate group-hover:underline">
                    {conta.requisitionNumber || (conta.requisitionId ? `REQ #${conta.requisitionId.slice(0, 8)}` : 'COT-2026-000215')}
                  </span>
                </div>
                <div className="text-[10px] text-purple-300/80 font-medium truncate flex items-center justify-between">
                  <span>3 Cotações</span>
                  <span className="text-purple-400 text-[9px] font-semibold">🔍 Ver</span>
                </div>
              </div>

              {/* Step 3: Ordem de Compra */}
              <div 
                onClick={() => setLineageModalType('PURCHASE_ORDER')}
                className="bg-zinc-900/90 hover:bg-zinc-900 border border-amber-500/30 hover:border-amber-400 p-3 rounded-xl flex flex-col justify-between space-y-1 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-amber-500/10 group"
              >
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>3. Ordem de Compra (OC)</span>
                  <span className="text-amber-300 font-mono text-[10px] bg-amber-500/10 group-hover:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/20">OC</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 font-mono flex items-center gap-1">
                  <Link2 size={12} className="text-amber-400 shrink-0" />
                  <span className="truncate group-hover:underline">
                    {conta.purchaseOrderNumber || (conta.purchaseOrderId ? `OC #${conta.purchaseOrderId.slice(0, 8)}` : 'OC-2026-000098')}
                  </span>
                </div>
                <div className="text-[10px] text-amber-300/80 font-medium truncate flex items-center justify-between">
                  <span>Aprovado Financeiro</span>
                  <span className="text-amber-400 text-[9px] font-semibold">🔍 Ver</span>
                </div>
              </div>

              {/* Step 4: Liquidação / Pagamento */}
              <div 
                onClick={() => setLineageModalType('PAYMENT')}
                className={`p-3 rounded-xl flex flex-col justify-between space-y-1 border cursor-pointer transition-all hover:scale-[1.02] shadow-sm group ${conta.status === 'PAGA' ? 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10' : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500'}`}
              >
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>4. Status Liquidação</span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {conta.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-100 font-mono truncate group-hover:underline">
                  {conta.status === 'PAGA' ? formatCurrency(conta.valor) : 'Pendente de Pagamento'}
                </div>
                <div className="text-[10px] text-zinc-400 truncate flex items-center justify-between">
                  <span>{conta.status === 'PAGA' && conta.dataPagamento ? `Pago ${format(new Date(conta.dataPagamento), 'dd/MM/yyyy')}` : 'Aguardando quitação'}</span>
                  <span className="text-emerald-400 text-[9px] font-semibold">🔍 Recibo</span>
                </div>
              </div>
            </div>
          </div>

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

        {/* Modal de Detalhes da Linhagem */}
        <LineageDetailModal
          open={!!lineageModalType}
          onClose={() => setLineageModalType(null)}
          type={lineageModalType}
          conta={conta}
        />
      </DialogContent>
    </Dialog>
  );
};


