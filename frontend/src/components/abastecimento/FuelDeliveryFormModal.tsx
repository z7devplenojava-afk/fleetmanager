import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import fuelPumpService, { FuelTank } from '@/services/fuelPumpService';
import contasAPagarService from '@/services/contasAPagarService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreditCard,
    FileText,
    Upload,
    Eye,
    Trash2,
    Calendar,
    DollarSign,
    CheckCircle2,
    Barcode,
    Layers,
    Loader2
} from 'lucide-react';
import BoletoViewerModal from './BoletoViewerModal';
import {
    matchBoletosBatchToInstallments,
    toIsoDateOnly
} from '@/utils/boletoInstallmentMatcher';

interface InstallmentItem {
    installmentNumber: number;
    amount: number;
    dueDate: string;
    boletoFileName?: string;
    boletoDataUrl?: string;
    barcode?: string;
}

interface FuelDeliveryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tanks: FuelTank[];
}

const FuelDeliveryFormModal: React.FC<FuelDeliveryFormModalProps> = ({ isOpen, onClose, onSuccess, tanks }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        deliveryDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        supplier: '',
        liters: '',
        pricePerLiter: '',
        totalPrice: '',
        fuelTankId: ''
    });

    // Condições de Pagamento e Parcelas
    const [paymentCondition, setPaymentCondition] = useState<string>('BOLETO_PARCELADO');
    const [totalInstallments, setTotalInstallments] = useState<number>(1);
    const [installments, setInstallments] = useState<InstallmentItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Modal de Visualização de Boleto
    const [previewBoleto, setPreviewBoleto] = useState<{
        isOpen: boolean;
        boletoUrl?: string;
        fileName?: string;
        installmentText?: string;
        amount?: number;
        dueDate?: string;
        barcode?: string;
    }>({ isOpen: false });

    const skipNextRecalcRef = useRef(false);

    // Recalcula parcelas ao mudar valor total, número de parcelas ou data de entrega
    useEffect(() => {
        if (skipNextRecalcRef.current) {
            skipNextRecalcRef.current = false;
            return;
        }
        const total = parseFloat(formData.totalPrice) || 0;
        const count = Math.max(1, totalInstallments);
        const installmentValue = count > 0 ? parseFloat((total / count).toFixed(2)) : total;

        const baseDate = formData.deliveryDate ? new Date(formData.deliveryDate + 'T12:00:00') : new Date();

        setInstallments((prev) => {
            const nextInstallments: InstallmentItem[] = [];
            for (let i = 1; i <= count; i++) {
                const prevItem = prev.find((p) => p.installmentNumber === i);

                const d = new Date(baseDate);
                // Se for a prazo, calcula 30 dias por parcela
                const daysToAdd = paymentCondition === 'A_VISTA' ? 0 : i * 30;
                d.setDate(d.getDate() + daysToAdd);
                const defaultDueDate = d.toISOString().split('T')[0];

                nextInstallments.push({
                    installmentNumber: i,
                    amount: prevItem && prev.length === count ? prevItem.amount : installmentValue,
                    dueDate: prevItem ? prevItem.dueDate : defaultDueDate,
                    boletoFileName: prevItem?.boletoFileName,
                    boletoDataUrl: prevItem?.boletoDataUrl,
                    barcode: prevItem?.barcode
                });
            }

            // Ajuste de arredondamento de centavos na última parcela
            if (nextInstallments.length > 0) {
                const sumExceptLast = nextInstallments
                    .slice(0, count - 1)
                    .reduce((sum, item) => sum + item.amount, 0);
                nextInstallments[count - 1].amount = parseFloat((total - sumExceptLast).toFixed(2));
            }

            return nextInstallments;
        });
    }, [formData.totalPrice, totalInstallments, formData.deliveryDate, paymentCondition]);

    const handleLitersOrPriceChange = (field: string, value: string) => {
        const nextData = { ...formData, [field]: value };
        const liters = parseFloat(field === 'liters' ? value : formData.liters);
        const price = parseFloat(field === 'pricePerLiter' ? value : formData.pricePerLiter);

        if (!isNaN(liters) && !isNaN(price)) {
            nextData.totalPrice = (liters * price).toFixed(2);
        }
        setFormData(nextData);
    };

    const [loadingBatchBoletos, setLoadingBatchBoletos] = useState(false);
    const batchBoletoRef = useRef<HTMLInputElement>(null);

    // Upload de Boleto Individual por Parcela (com parse automático no backend + persistência)
    const handleBoletoUpload = async (installmentNumber: number, file: File) => {
        try {
            const parsed = await contasAPagarService.parseBoleto(file);
            setInstallments((prev) =>
                prev.map((item) => {
                    if (item.installmentNumber !== installmentNumber) return item;
                    return {
                        ...item,
                        boletoFileName: parsed.originalFileName || file.name,
                        boletoDataUrl: parsed.fileUrl || item.boletoDataUrl,
                        barcode: parsed.linhaDigitavel || parsed.barcode || item.barcode,
                        dueDate: parsed.dueDate ? toIsoDateOnly(parsed.dueDate) : item.dueDate,
                        amount: parsed.amount && parsed.amount > 0 && item.amount <= 0 ? Number(parsed.amount) : item.amount
                    };
                })
            );
            toast({
                title: 'Boleto Anexado',
                description: `${file.name} anexado à Parcela ${installmentNumber}${parsed.dueDate ? ` (Venc: ${parsed.dueDate})` : ''}.`
            });
        } catch {
            toast({
                title: 'Erro ao processar boleto',
                description: 'Não foi possível enviar o boleto.',
                variant: 'destructive'
            });
        }
    };

    // Upload de Boletos em Lote (identifica vencimento e valor de cada boleto)
    const handleBatchBoletosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        e.target.value = '';
        if (!files || files.length === 0) return;

        try {
            setLoadingBatchBoletos(true);
            const parsedBoletos = await contasAPagarService.parseBoletosBatch(Array.from(files));
            const existing = installments.map((it) => ({
                installmentNumber: it.installmentNumber,
                dueDate: it.dueDate,
                amount: it.amount,
                barcode: it.barcode,
                boletoUrl: it.boletoDataUrl,
                originalBoletoName: it.boletoFileName
            }));
            const matched = matchBoletosBatchToInstallments(existing, parsedBoletos, { expandIfSingleOrEmpty: true });
            const batchSum = Math.round(matched.installments.reduce((s, m) => s + (m.amount || 0), 0) * 100) / 100;
            skipNextRecalcRef.current = true;
            if ((!formData.totalPrice || parseFloat(formData.totalPrice) <= 0) && batchSum > 0) {
                setFormData((prev) => ({ ...prev, totalPrice: batchSum.toFixed(2) }));
            }
            if (matched.installments.length > 1) {
                setPaymentCondition('A_PRAZO');
            }
            setTotalInstallments(matched.installments.length);
            setInstallments(
                matched.installments.map((m) => ({
                    installmentNumber: m.installmentNumber,
                    amount: m.amount,
                    dueDate: m.dueDate,
                    boletoFileName: m.originalBoletoName,
                    boletoDataUrl: m.boletoUrl,
                    barcode: m.linhaDigitavel || m.barcode
                }))
            );
            toast({
                title: `${parsedBoletos.length} boleto(s) importado(s) em lote!`,
                description: 'Vencimentos, valores e códigos de barras vinculados às parcelas.'
            });
        } catch (err: any) {
            toast({
                title: 'Erro no lote de boletos',
                description: err?.response?.data?.message || 'Verifique os PDFs enviados.',
                variant: 'destructive'
            });
        } finally {
            setLoadingBatchBoletos(false);
        }
    };

    const handleRemoveBoleto = (installmentNumber: number) => {
        setInstallments((prev) =>
            prev.map((item) =>
                item.installmentNumber === installmentNumber
                    ? { ...item, boletoFileName: undefined, boletoDataUrl: undefined }
                    : item
            )
        );
    };

    const handleInstallmentFieldChange = (
        installmentNumber: number,
        field: keyof InstallmentItem,
        value: any
    ) => {
        setInstallments((prev) =>
            prev.map((item) =>
                item.installmentNumber === installmentNumber ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fuelTankId) {
            toast({ title: 'Erro', description: 'Selecione um tanque de destino.', variant: 'destructive' });
            return;
        }

        const selectedTank = tanks.find((t) => t.id === formData.fuelTankId);

        try {
            setIsSaving(true);

            // 1. Gravar a Entrada no Tanque de Combustível
            await fuelPumpService.recordDelivery({
                deliveryDate: formData.deliveryDate,
                invoiceNumber: formData.invoiceNumber,
                supplier: formData.supplier,
                liters: parseFloat(formData.liters),
                pricePerLiter: parseFloat(formData.pricePerLiter),
                totalPrice: parseFloat(formData.totalPrice),
                fuelTankId: formData.fuelTankId
            });

            // 2. Lançar as Despesas / Boletos no Contas a Pagar
            const totalParcelas = installments.length;
            for (const item of installments) {
                const docNumber =
                    totalParcelas > 1
                        ? `${formData.invoiceNumber} - Parc ${item.installmentNumber}/${totalParcelas}`
                        : formData.invoiceNumber;

                try {
                    await contasAPagarService.createContaAPagar({
                        descricao: `Entrada Combustível NF ${formData.invoiceNumber} - ${formData.liters}L (Parc ${item.installmentNumber}/${totalParcelas})`,
                        fornecedor: formData.supplier,
                        valor: item.amount,
                        vencimento: new Date(item.dueDate + 'T12:00:00'),
                        dataEmissao: new Date(formData.deliveryDate + 'T12:00:00'),
                        categoria: 'Combustível',
                        centroCusto: 'ABASTECIMENTO',
                        tipo: 'VARIAVEL',
                        status: 'ABERTA',
                        baixa: false,
                        invoiceNumber: docNumber,
                        totalInstallments: totalParcelas,
                        installmentSeq: item.installmentNumber,
                        paymentMethod: paymentCondition,
                        boletoUrl: item.boletoDataUrl,
                        boletoOriginalName: item.boletoFileName,
                        codigoBarras: item.barcode,
                        observacoes: `Entrada Tanque: ${selectedTank?.name || 'Interno'} | ${formData.liters} Litros a R$ ${formData.pricePerLiter}/L. Fornecedor: ${formData.supplier}`
                    });
                } catch (invoiceError) {
                    console.warn(`Aviso ao integrar parcela ${item.installmentNumber} no Contas a Pagar:`, invoiceError);
                }
            }

            toast({
                title: 'Entrada e Despesas Confirmadas!',
                description: `NF ${formData.invoiceNumber} registrada no estoque e ${totalParcelas} boleto(s)/parcela(s) gerados no Contas a Pagar.`
            });

            // Invalidação de queries
            queryClient.invalidateQueries({ queryKey: ['fuelDeliveries'] });
            queryClient.invalidateQueries({ queryKey: ['fuelTanks'] });
            queryClient.invalidateQueries({ queryKey: ['contas-a-pagar'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });

            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                title: 'Erro ao registrar entrega',
                description: error?.message || 'Falha ao processar entrada de combustível.',
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-seguranca-lightgray max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
                    <DialogHeader className="border-b border-gray-700 pb-3">
                        <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                            <CreditCard className="text-emerald-400" size={20} />
                            Registrar Entrada de Combustível (NF & Boletos)
                        </DialogTitle>
                        <p className="text-xs text-gray-400">
                            Entrada no tanque, condições de pagamento e integração automática com Contas a Pagar.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        {/* Linha 1: Data e NF */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-300">Data da Entrega *</Label>
                                <Input
                                    type="date"
                                    className="bg-seguranca-black border-gray-600 text-white h-10 text-xs"
                                    value={formData.deliveryDate}
                                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-300">Número da NF *</Label>
                                <Input
                                    placeholder="Ex: 001.458.920"
                                    className="bg-seguranca-black border-gray-600 text-white h-10 text-xs font-mono"
                                    value={formData.invoiceNumber}
                                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Linha 2: Fornecedor e Tanque */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-300">Fornecedor / Distribuidora *</Label>
                                <Input
                                    placeholder="Nome do Posto / Distribuidora"
                                    className="bg-seguranca-black border-gray-600 text-white h-10 text-xs"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-300">Tanque de Destino *</Label>
                                <Select
                                    value={formData.fuelTankId}
                                    onValueChange={(val) => setFormData({ ...formData, fuelTankId: val })}
                                >
                                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-white h-10 text-xs">
                                        <SelectValue placeholder="Selecione o tanque" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600 text-white text-xs">
                                        {tanks.map((tank) => (
                                            <SelectItem key={tank.id} value={tank.id}>
                                                {tank.name} ({tank.fuelType}) - Saldo: {tank.currentLevel}L
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Linha 3: Quantidade, Preço/L e Valor Total */}
                        <div className="grid grid-cols-3 gap-3 bg-seguranca-black/50 p-3 rounded-xl border border-gray-700">
                            <div className="space-y-1">
                                <Label className="text-[11px] text-gray-400">Quantidade (L) *</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="bg-seguranca-black border-gray-600 text-white h-9 text-xs font-mono"
                                    value={formData.liters}
                                    onChange={(e) => handleLitersOrPriceChange('liters', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-gray-400">Preço/Litro (R$) *</Label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    placeholder="0,000"
                                    className="bg-seguranca-black border-gray-600 text-white h-9 text-xs font-mono"
                                    value={formData.pricePerLiter}
                                    onChange={(e) => handleLitersOrPriceChange('pricePerLiter', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-gray-400">Valor Total (R$) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="bg-seguranca-black border-gray-600 font-bold text-amber-400 h-9 text-xs font-mono"
                                    value={formData.totalPrice}
                                    onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Seção Financeira: Condições de Pagamento e Parcelas */}
                        <div className="pt-2 border-t border-gray-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                    <FileText size={14} className="text-amber-400" />
                                    Condições de Pagamento & Boletos a Pagar
                                </h4>
                                <span className="text-[10px] text-gray-400 font-mono">
                                    Integrado ao Contas a Pagar
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-gray-300">Forma de Pagamento</Label>
                                    <Select
                                        value={paymentCondition}
                                        onValueChange={setPaymentCondition}
                                    >
                                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-white h-10 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-white text-xs">
                                            <SelectItem value="BOLETO_PARCELADO">Boleto Bancário (Parcelado)</SelectItem>
                                            <SelectItem value="BOLETO_30D">Boleto Bancário (30 dias)</SelectItem>
                                            <SelectItem value="A_VISTA">À Vista (PIX / Transferência)</SelectItem>
                                            <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs text-gray-300">Número de Parcelas</Label>
                                    <Select
                                        value={totalInstallments.toString()}
                                        onValueChange={(val) => setTotalInstallments(parseInt(val) || 1)}
                                    >
                                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-white h-10 text-xs font-mono">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-white text-xs">
                                            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                                                <SelectItem key={num} value={num.toString()}>
                                                    {num}x {num === 1 ? '(Parcela Única)' : `de ${(parseFloat(formData.totalPrice || '0') / num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Detalhamento das Parcelas com Upload Individual ou em Lote de Boletos */}
                            <div className="space-y-2 mt-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Label className="text-xs text-gray-300">
                                        Vencimento e Upload dos Boletos por Parcela (PDF ou Imagem):
                                    </Label>
                                    <div>
                                        <input
                                            ref={batchBoletoRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,image/*"
                                            className="hidden"
                                            onChange={handleBatchBoletosUpload}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={loadingBatchBoletos}
                                            onClick={() => batchBoletoRef.current?.click()}
                                            className="h-7 px-2.5 text-[11px] border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-semibold"
                                        >
                                            {loadingBatchBoletos ? (
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            ) : (
                                                <Layers className="h-3 w-3 mr-1" />
                                            )}
                                            Upload Boletos em Lote
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {installments.map((inst) => (
                                        <div
                                            key={inst.installmentNumber}
                                            className="p-3 rounded-xl bg-seguranca-black/60 border border-gray-700/80 space-y-2 text-xs"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold font-mono text-[11px]">
                                                        {inst.installmentNumber}ª
                                                    </span>
                                                    <span className="font-semibold text-white">
                                                        Parcela {inst.installmentNumber} de {installments.length}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-gray-400 text-[10px]">Valor:</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={inst.amount}
                                                            onChange={(e) =>
                                                                handleInstallmentFieldChange(
                                                                    inst.installmentNumber,
                                                                    'amount',
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-24 h-7 bg-seguranca-black border-gray-600 text-white font-mono text-xs px-2"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-gray-400 text-[10px]">Vencimento:</span>
                                                        <Input
                                                            type="date"
                                                            value={inst.dueDate}
                                                            onChange={(e) =>
                                                                handleInstallmentFieldChange(
                                                                    inst.installmentNumber,
                                                                    'dueDate',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-32 h-7 bg-seguranca-black border-gray-600 text-white text-xs px-2"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Área de Upload e Código de Barras do Boleto */}
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-gray-800">
                                                <div className="flex-1">
                                                    <Input
                                                        placeholder="Código de barras / Linha digitável (Opcional)"
                                                        value={inst.barcode || ''}
                                                        onChange={(e) =>
                                                            handleInstallmentFieldChange(
                                                                inst.installmentNumber,
                                                                'barcode',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-7 bg-seguranca-black border-gray-700 text-gray-300 text-[11px] font-mono px-2 placeholder:text-gray-600"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {inst.boletoDataUrl ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 truncate max-w-[130px]" title={inst.boletoFileName}>
                                                                <CheckCircle2 size={12} className="shrink-0" />
                                                                {inst.boletoFileName || 'Boleto Anexado'}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    setPreviewBoleto({
                                                                        isOpen: true,
                                                                        boletoUrl: inst.boletoDataUrl,
                                                                        fileName: inst.boletoFileName,
                                                                        installmentText: `Parcela ${inst.installmentNumber}/${installments.length}`,
                                                                        amount: inst.amount,
                                                                        dueDate: inst.dueDate,
                                                                        barcode: inst.barcode
                                                                    })
                                                                }
                                                                className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-[11px]"
                                                                title="Visualizar Boleto"
                                                            >
                                                                <Eye size={12} className="mr-1" /> Ver
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleRemoveBoleto(inst.installmentNumber)}
                                                                className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[11px]"
                                                                title="Remover anexo"
                                                            >
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <label className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-gray-600 bg-seguranca-black hover:bg-gray-800 text-gray-300 hover:text-white text-[11px] cursor-pointer transition-colors">
                                                            <Upload size={12} className="text-amber-400" />
                                                            <span>Anexar Boleto</span>
                                                            <input
                                                                type="file"
                                                                accept=".pdf,image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) {
                                                                        handleBoletoUpload(inst.installmentNumber, e.target.files[0]);
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-3 border-t border-gray-700 flex items-center justify-between">
                            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400 text-xs">
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-5"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Registrando e Gerando Despesas...' : 'Confirmar Entrada & Gerar Boletos'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Pré-visualização do Boleto */}
            <BoletoViewerModal
                isOpen={previewBoleto.isOpen}
                onClose={() => setPreviewBoleto({ isOpen: false })}
                boletoUrl={previewBoleto.boletoUrl}
                fileName={previewBoleto.fileName}
                invoiceNumber={formData.invoiceNumber}
                installmentText={previewBoleto.installmentText}
                supplier={formData.supplier}
                amount={previewBoleto.amount}
                dueDate={previewBoleto.dueDate}
                barcode={previewBoleto.barcode}
            />
        </>
    );
};

export default FuelDeliveryFormModal;
