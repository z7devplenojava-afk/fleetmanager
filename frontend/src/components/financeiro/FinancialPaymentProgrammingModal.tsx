import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreditCard,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  FileCheck,
  Truck,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  procurementService,
  ProcurementPurchaseOrder,
  FinancialApprovalPayload
} from '@/services/procurementService';
import { format, addMonths } from 'date-fns';

interface FinancialPaymentProgrammingModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: ProcurementPurchaseOrder | null;
  onSuccess?: () => void;
}

// Cartões Corporativos pré-configurados para seleção rápida
const PRESET_CORPORATE_CARDS = [
  { id: 'card-4821', label: 'Cartão Corporativo Master (Final 4821) - Frota Principal', flag: 'MASTERCARD', number: 'Final 4821' },
  { id: 'card-9102', label: 'Cartão Visa Compras (Final 9102) - Peças Diesel & Almoxarifado', flag: 'VISA', number: 'Final 9102' },
  { id: 'card-3350', label: 'Cartão Elo Corporativo (Final 3350) - Manutenção Pesada', flag: 'ELO', number: 'Final 3350' },
  { id: 'card-7714', label: 'Cartão Santander Amex (Final 7714) - Diretoria / Geral', flag: 'AMEX', number: 'Final 7714' },
];

export const FinancialPaymentProgrammingModal: React.FC<FinancialPaymentProgrammingModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Estados do Formulário de Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'PIX' | 'TRANSFERENCIA' | 'DINHEIRO'>('CARTAO_CREDITO');
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [selectedCardId, setSelectedCardId] = useState<string>('card-4821');
  const [customCardNumber, setCustomCardNumber] = useState<string>('');
  const [cardFlag, setCardFlag] = useState<string>('MASTERCARD');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState<string>(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [financialNotes, setFinancialNotes] = useState<string>('');

  // PIX e Transferência
  const [pixKeyType, setPixKeyType] = useState<string>('CNPJ');
  const [pixKey, setPixKey] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankAgency, setBankAgency] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');

  useEffect(() => {
    if (purchaseOrder) {
      // Se a OC já tem dados programados, carregar
      if (purchaseOrder.paymentMethod) {
        setPaymentMethod(purchaseOrder.paymentMethod as any);
      }
      if (purchaseOrder.installmentsCount) {
        setInstallmentsCount(purchaseOrder.installmentsCount);
      }
      if (purchaseOrder.cardNumber) {
        const found = PRESET_CORPORATE_CARDS.find(c => c.number === purchaseOrder.cardNumber || c.label.includes(purchaseOrder.cardNumber || ''));
        if (found) {
          setSelectedCardId(found.id);
        } else {
          setSelectedCardId('custom');
          setCustomCardNumber(purchaseOrder.cardNumber);
        }
      }
      if (purchaseOrder.cardFlag) {
        setCardFlag(purchaseOrder.cardFlag);
      }
      if (purchaseOrder.paymentReference) {
        setPaymentReference(purchaseOrder.paymentReference);
      }
      if (purchaseOrder.paymentScheduledDate) {
        setScheduledDate(purchaseOrder.paymentScheduledDate);
      }
      if (purchaseOrder.financialNotes) {
        setFinancialNotes(purchaseOrder.financialNotes);
      }
      if (purchaseOrder.supplierCnpj) {
        setPixKey(purchaseOrder.supplierCnpj);
      }
    }
  }, [purchaseOrder]);

  if (!purchaseOrder) return null;

  const totalAmount = purchaseOrder.totalAmount || 0;
  const installmentValue = installmentsCount > 0 ? totalAmount / installmentsCount : totalAmount;

  // Gerar cronograma de parcelas calculadas
  const installmentsSchedule = Array.from({ length: installmentsCount }, (_, i) => {
    const baseDate = new Date(scheduledDate || new Date());
    const instDate = addMonths(baseDate, i);
    return {
      installmentNumber: i + 1,
      dueDate: format(instDate, 'dd/MM/yyyy'),
      value: installmentValue
    };
  });

  const handleCardSelection = (cardId: string) => {
    setSelectedCardId(cardId);
    if (cardId !== 'custom') {
      const card = PRESET_CORPORATE_CARDS.find(c => c.id === cardId);
      if (card) {
        setCardFlag(card.flag);
        setCustomCardNumber(card.number);
      }
    } else {
      setCustomCardNumber('');
    }
  };

  const handleApproveAndProgramPayment = async () => {
    try {
      setSubmitting(true);

      // Determinar identificador final do cartão
      let resolvedCardNumber = '';
      if (paymentMethod === 'CARTAO_CREDITO' || paymentMethod === 'CARTAO_DEBITO') {
        if (selectedCardId === 'custom') {
          resolvedCardNumber = customCardNumber || 'Cartão Corporativo';
        } else {
          const card = PRESET_CORPORATE_CARDS.find(c => c.id === selectedCardId);
          resolvedCardNumber = card ? card.label : customCardNumber;
        }
      }

      // Montar referência
      let finalReference = paymentReference;
      if (paymentMethod === 'PIX') {
        finalReference = `PIX (${pixKeyType}): ${pixKey} ${paymentReference ? `| ${paymentReference}` : ''}`;
      } else if (paymentMethod === 'TRANSFERENCIA') {
        finalReference = `Banco: ${bankName} | Ag: ${bankAgency} | CC: ${bankAccount} ${paymentReference ? `| ${paymentReference}` : ''}`;
      }

      const installmentDetailsJson = JSON.stringify({
        totalAmount,
        installmentsCount,
        installmentValue,
        cardNumber: resolvedCardNumber,
        cardFlag,
        schedule: installmentsSchedule
      });

      const payload: FinancialApprovalPayload = {
        purchaseOrderId: purchaseOrder.id,
        approved: true,
        financialNotes: financialNotes || 'Programação de pagamento confirmada pelo Financeiro.',
        paymentMethod,
        installmentsCount,
        cardNumber: resolvedCardNumber,
        cardFlag,
        paymentReference: finalReference,
        paymentScheduledDate: scheduledDate,
        paymentDueDate: dueDate,
        installmentDetails: installmentDetailsJson
      };

      await procurementService.financialApproval(payload);

      toast({
        title: 'Pagamento Programado com Sucesso! 💳',
        description: `Ordem ${purchaseOrder.ocNumber} aprovada com ${installmentsCount}x de R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no ${resolvedCardNumber || paymentMethod}.`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao programar pagamento:', error);
      toast({
        title: 'Erro na Programação',
        description: 'Não foi possível programar o pagamento da Ordem de Compra.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectPO = async () => {
    if (!financialNotes.trim()) {
      toast({
        title: 'Justificativa Obrigatória',
        description: 'Informe o motivo da recusa nas observações financeiras.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      await procurementService.financialApproval({
        purchaseOrderId: purchaseOrder.id,
        approved: false,
        financialNotes: `Recusado pelo Financeiro: ${financialNotes}`
      });

      toast({
        title: 'Ordem de Compra Recusada',
        description: `A ordem ${purchaseOrder.ocNumber} foi cancelada.`,
        variant: 'destructive'
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao recusar OC:', error);
      toast({
        title: 'Erro ao Recusar',
        description: 'Não foi possível recusar a Ordem de Compra.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-seguranca-lightgray p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-blue-950 via-zinc-900 to-zinc-950 p-6 border-b border-gray-700 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                Programação Financeira de Pagamento
                <Badge className="bg-blue-600 font-mono text-white text-xs">
                  {purchaseOrder.ocNumber}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 mt-0.5">
                Defina a forma de pagamento, parcelamento e cartão corporativo utilizado para esta Ordem de Compra.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Card Resumo da Ordem de Compra */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-zinc-900/90 rounded-xl border border-gray-700/80">
            <div>
              <span className="text-[11px] text-gray-400 uppercase font-semibold block">Fornecedor Vencedor</span>
              <span className="text-sm font-bold text-white truncate block mt-0.5">
                {purchaseOrder.supplierName}
              </span>
              {purchaseOrder.supplierCnpj && (
                <span className="text-[11px] text-gray-400 font-mono block">{purchaseOrder.supplierCnpj}</span>
              )}
            </div>

            <div>
              <span className="text-[11px] text-gray-400 uppercase font-semibold block">Peça / Requisição</span>
              <span className="text-sm font-semibold text-gray-200 truncate block mt-0.5">
                {purchaseOrder.itemName}
              </span>
              <span className="text-[11px] text-seguranca-yellow font-mono block">
                Qtd: {purchaseOrder.quantity} • {purchaseOrder.requisitionNumber || 'Req Geral'}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-gray-400 uppercase font-semibold block">Condição Comercial</span>
              <span className="text-sm font-semibold text-gray-300 block mt-0.5">
                {purchaseOrder.paymentTerms || 'Não especificada'}
              </span>
              {purchaseOrder.urgency === 'EMERGENCIA' && (
                <Badge variant="destructive" className="text-[10px] mt-1">Emergência Frota</Badge>
              )}
            </div>

            <div>
              <span className="text-[11px] text-gray-400 uppercase font-semibold block">Valor Total da OC</span>
              <span className="text-lg font-extrabold text-emerald-400 block mt-0.5">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Seleção do Tipo de Pagamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-700/80 pb-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Selecione o Método de Pagamento
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <Button
                type="button"
                variant={paymentMethod === 'CARTAO_CREDITO' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('CARTAO_CREDITO')}
                className={`h-16 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold ${
                  paymentMethod === 'CARTAO_CREDITO' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-900 border-gray-700 text-gray-300'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Cartão de Crédito
              </Button>

              <Button
                type="button"
                variant={paymentMethod === 'CARTAO_DEBITO' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('CARTAO_DEBITO')}
                className={`h-16 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold ${
                  paymentMethod === 'CARTAO_DEBITO' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-900 border-gray-700 text-gray-300'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Cartão de Débito
              </Button>

              <Button
                type="button"
                variant={paymentMethod === 'PIX' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('PIX')}
                className={`h-16 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold ${
                  paymentMethod === 'PIX' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-900 border-gray-700 text-gray-300'
                }`}
              >
                <QrCode className="h-5 w-5" />
                PIX
              </Button>

              <Button
                type="button"
                variant={paymentMethod === 'BOLETO' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('BOLETO')}
                className={`h-16 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold ${
                  paymentMethod === 'BOLETO' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-zinc-900 border-gray-700 text-gray-300'
                }`}
              >
                <FileText className="h-5 w-5" />
                Boleto Bancário
              </Button>

              <Button
                type="button"
                variant={paymentMethod === 'TRANSFERENCIA' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('TRANSFERENCIA')}
                className={`h-16 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold ${
                  paymentMethod === 'TRANSFERENCIA' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-zinc-900 border-gray-700 text-gray-300'
                }`}
              >
                <Building2 className="h-5 w-5" />
                Transferência TED
              </Button>

              <Button
                type="button"
                variant={paymentMethod === 'DINHEIRO' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('DINHEIRO')}
                className={`h-16 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold ${
                  paymentMethod === 'DINHEIRO' ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-zinc-900 border-gray-700 text-gray-300'
                }`}
              >
                <DollarSign className="h-5 w-5" />
                Dinheiro / Caixa
              </Button>
            </div>
          </div>

          {/* Detalhes Específicos por Tipo de Pagamento */}
          <div className="p-4 bg-zinc-900/95 rounded-xl border border-gray-700 space-y-4">
            {/* Bloco CARTÃO DE CRÉDITO OU DÉBITO */}
            {(paymentMethod === 'CARTAO_CREDITO' || paymentMethod === 'CARTAO_DEBITO') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase">
                    <CreditCard className="h-4 w-4" />
                    Identificação do Cartão Corporativo Utilizado
                  </div>
                  <Badge variant="outline" className="text-[11px] text-blue-300 border-blue-500/40">
                    Rastreabilidade por Cartão
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Seleção do Cartão */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">
                      Cartão Corporativo Utilizado:
                    </Label>
                    <Select value={selectedCardId} onValueChange={handleCardSelection}>
                      <SelectTrigger className="bg-zinc-950 border-gray-700 text-xs text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-gray-700 text-white text-xs">
                        {PRESET_CORPORATE_CARDS.map(card => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Outro Cartão (Digitar Número / Final)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bandeira */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">
                      Bandeira do Cartão:
                    </Label>
                    <Select value={cardFlag} onValueChange={setCardFlag}>
                      <SelectTrigger className="bg-zinc-950 border-gray-700 text-xs text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-gray-700 text-white text-xs">
                        <SelectItem value="MASTERCARD">Mastercard Corporativo</SelectItem>
                        <SelectItem value="VISA">Visa Business / Compras</SelectItem>
                        <SelectItem value="ELO">Elo Corporativo</SelectItem>
                        <SelectItem value="AMEX">American Express</SelectItem>
                        <SelectItem value="HIPERCARD">Hipercard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campo customizado se selecionado 'custom' */}
                  {selectedCardId === 'custom' && (
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-200">
                        Identificação do Cartão / Final dos 4 dígitos:
                      </Label>
                      <Input
                        value={customCardNumber}
                        onChange={(e) => setCustomCardNumber(e.target.value)}
                        placeholder="Ex: Final 5542 - Cartão Gerência Operacional"
                        className="bg-zinc-950 border-gray-700 text-xs text-white h-10"
                      />
                    </div>
                  )}

                  {/* Quantidade de Parcelas (se Crédito) */}
                  {paymentMethod === 'CARTAO_CREDITO' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-200">
                        Quantidade de Parcelas:
                      </Label>
                      <Select
                        value={String(installmentsCount)}
                        onValueChange={(val) => setInstallmentsCount(parseInt(val) || 1)}
                      >
                        <SelectTrigger className="bg-zinc-950 border-gray-700 text-xs text-white font-bold h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-gray-700 text-white text-xs">
                          <SelectItem value="1">1x À Vista (R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</SelectItem>
                          <SelectItem value="2">2x de R$ {(totalAmount / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</SelectItem>
                          <SelectItem value="3">3x de R$ {(totalAmount / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</SelectItem>
                          <SelectItem value="4">4x de R$ {(totalAmount / 4).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</SelectItem>
                          <SelectItem value="5">5x de R$ {(totalAmount / 5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</SelectItem>
                          <SelectItem value="6">6x de R$ {(totalAmount / 6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</SelectItem>
                          <SelectItem value="10">10x de R$ {(totalAmount / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</SelectItem>
                          <SelectItem value="12">12x de R$ {(totalAmount / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Data do Primeiro Vencimento / Pagamento */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">
                      Data do Pagamento / 1ª Parcela:
                    </Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10"
                    />
                  </div>

                  {/* Código de Autorização / NSU */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">
                      Código de Autorização / NSU / Comprovante da Maquininha:
                    </Label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Ex: AUT-894721 | NSU: 104928"
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10 font-mono"
                    />
                  </div>
                </div>

                {/* Tabela de Cronograma das Parcelas */}
                {paymentMethod === 'CARTAO_CREDITO' && installmentsCount > 1 && (
                  <div className="p-3 bg-zinc-950 rounded-lg border border-gray-800 space-y-2">
                    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                      Cronograma Programado de Parcelas no Cartão:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {installmentsSchedule.map((inst) => (
                        <div key={inst.installmentNumber} className="p-2 bg-zinc-900 rounded border border-gray-800 text-center">
                          <span className="text-[10px] text-gray-400 block font-semibold">
                            Parcela {inst.installmentNumber}/{installmentsCount}
                          </span>
                          <span className="text-xs font-bold text-white block mt-0.5">
                            R$ {inst.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-blue-400 font-mono block mt-0.5">
                            {inst.dueDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bloco PIX */}
            {paymentMethod === 'PIX' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase border-b border-gray-800 pb-2">
                  <QrCode className="h-4 w-4" />
                  Dados da Chave PIX do Fornecedor
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">Tipo de Chave:</Label>
                    <Select value={pixKeyType} onValueChange={setPixKeyType}>
                      <SelectTrigger className="bg-zinc-950 border-gray-700 text-xs text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-gray-700 text-white text-xs">
                        <SelectItem value="CNPJ">CNPJ</SelectItem>
                        <SelectItem value="EMAIL">E-mail</SelectItem>
                        <SelectItem value="TELEFONE">Telefone</SelectItem>
                        <SelectItem value="ALEATORIA">Chave Aleatória (EVP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">Chave PIX:</Label>
                    <Input
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Chave PIX do fornecedor"
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">Data do Pagamento PIX:</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">ID da Transação / Comprovante PIX:</Label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Ex: E12345678202609181234abcd"
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bloco BOLETO */}
            {paymentMethod === 'BOLETO' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase border-b border-gray-800 pb-2">
                  <FileText className="h-4 w-4" />
                  Dados do Boleto Bancário
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">Linha Digitável / Código de Barras:</Label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">Data de Agendamento:</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">Data de Vencimento do Boleto:</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bloco TRANSFERÊNCIA BANCÁRIA */}
            {paymentMethod === 'TRANSFERENCIA' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase border-b border-gray-800 pb-2">
                  <Building2 className="h-4 w-4" />
                  Dados Bancários para Transferência TED / DOC
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">Banco:</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Ex: Itaú (341)"
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">Agência:</Label>
                    <Input
                      value={bankAgency}
                      onChange={(e) => setBankAgency(e.target.value)}
                      placeholder="0000-0"
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-200">Conta Corrente:</Label>
                    <Input
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="00000-0"
                      className="bg-zinc-950 border-gray-700 text-xs text-white h-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Observações Gerais Financeiras */}
            <div className="space-y-1.5 pt-2 border-t border-gray-800">
              <Label className="text-xs font-semibold text-gray-200">
                Observações do Financeiro / Centro de Custo:
              </Label>
              <Textarea
                rows={2}
                value={financialNotes}
                onChange={(e) => setFinancialNotes(e.target.value)}
                placeholder="Observações adicionais de conciliação bancária, liberação de limite ou autorização da diretoria..."
                className="bg-zinc-950 border-gray-700 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-zinc-900 border-t border-gray-700 flex flex-row items-center justify-between">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRejectPO}
            disabled={submitting}
            className="text-xs font-semibold gap-1.5"
          >
            <XCircle className="h-4 w-4" /> Recusar Ordem de Compra
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-gray-400"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleApproveAndProgramPayment}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-2 px-5 shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Gravando...' : 'Confirmar Programação de Pagamento'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
