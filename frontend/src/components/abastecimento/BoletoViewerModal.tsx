import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Download,
    Printer,
    Copy,
    Check,
    ExternalLink,
    AlertCircle,
    Calendar,
    DollarSign,
    Barcode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BoletoViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    boletoUrl?: string;
    fileName?: string;
    invoiceNumber?: string;
    nfNumber?: string;
    installmentText?: string;
    supplier?: string;
    beneficiaryName?: string;
    beneficiaryCnpj?: string;
    status?: string;
    paymentDate?: string;
    amount?: number;
    dueDate?: string;
    barcode?: string;
    linhaDigitavel?: string;
}

export const BoletoViewerModal: React.FC<BoletoViewerModalProps> = ({
    isOpen,
    onClose,
    boletoUrl,
    fileName,
    invoiceNumber,
    nfNumber,
    installmentText,
    supplier,
    beneficiaryName,
    beneficiaryCnpj,
    status,
    paymentDate,
    amount,
    dueDate,
    barcode,
    linhaDigitavel
}) => {
    const { toast } = useToast();
    const [copied, setCopied] = React.useState(false);

    const codeToCopy = linhaDigitavel || barcode || '';
    const displayBeneficiary = beneficiaryName || supplier || 'Fornecedor';
    const isPaid = status === 'PAGA' || status === 'PAID';

    const handleCopyCode = () => {
        if (!codeToCopy) return;
        navigator.clipboard.writeText(codeToCopy);
        setCopied(true);
        toast({
            title: 'Código Copiado!',
            description: 'Linha digitável / código de barras copiado para a área de transferência.'
        });
        setTimeout(() => setCopied(false), 2500);
    };

    const handlePrint = () => {
        if (!boletoUrl) return;
        const printWindow = window.open(boletoUrl, '_blank');
        if (printWindow) {
            printWindow.focus();
            printWindow.print();
        }
    };

    const isPdf =
        boletoUrl?.startsWith('data:application/pdf') ||
        boletoUrl?.toLowerCase().includes('.pdf') ||
        fileName?.toLowerCase().endsWith('.pdf');

    const isImage =
        boletoUrl?.startsWith('data:image/') ||
        boletoUrl?.match(/\.(jpeg|jpg|gif|png|webp)/i);

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-3xl bg-slate-950 border border-slate-800 text-white rounded-2xl p-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-blue-900/40 via-slate-900 to-purple-900/30 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Barcode size={22} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-white flex flex-wrap items-center gap-2">
                                Boleto Bancário a Pagar
                                {installmentText && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                                        {installmentText}
                                    </span>
                                )}
                                {status && (
                                    <span
                                        className={`text-[11px] px-2 py-0.5 rounded-full font-mono border ${
                                            isPaid
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        }`}
                                    >
                                        {isPaid
                                            ? `PAGO${paymentDate ? ` em ${new Date(paymentDate + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}`
                                            : status}
                                    </span>
                                )}
                            </DialogTitle>
                            <p className="text-xs text-slate-400">
                                {displayBeneficiary}
                                {beneficiaryCnpj ? ` • CNPJ: ${beneficiaryCnpj}` : ''}
                                {nfNumber ? ` • NF: ${nfNumber}` : invoiceNumber ? ` • Doc: ${invoiceNumber}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="text-right hidden sm:block">
                        {amount !== undefined && (
                            <div className="text-base font-bold text-emerald-400 font-mono">
                                {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        )}
                        {dueDate && (
                            <div className="text-[11px] text-slate-400 font-mono">
                                Vencimento: {new Date(dueDate).toLocaleDateString('pt-BR')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Dados da Fatura / Beneficiário / Linha Digitável */}
                <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 space-y-2">
                    {(beneficiaryName || beneficiaryCnpj) && (
                        <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                                <span className="text-[10px] text-slate-400 block font-mono uppercase">Beneficiário (Cedente)</span>
                                <span className="font-semibold text-white">{displayBeneficiary}</span>
                            </div>
                            {beneficiaryCnpj && (
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block font-mono uppercase">CNPJ do Beneficiário</span>
                                    <span className="font-mono font-semibold text-amber-300">{beneficiaryCnpj}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-mono">Documento / NF</span>
                            <span className="font-semibold text-white">{nfNumber ? `NF ${nfNumber}` : invoiceNumber || 'N/A'}</span>
                        </div>
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-mono">Valor a Pagar</span>
                            <span className="font-bold text-emerald-400 font-mono">
                                {amount !== undefined
                                    ? amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                    : 'N/A'}
                            </span>
                        </div>
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-mono">Vencimento</span>
                            <span className="font-semibold text-amber-400 font-mono">
                                {dueDate ? new Date(dueDate).toLocaleDateString('pt-BR') : 'A Combinar'}
                            </span>
                        </div>
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-mono">Arquivo</span>
                            <span className="text-slate-300 truncate block text-[11px]">{fileName || 'boleto.pdf'}</span>
                        </div>
                    </div>

                    {codeToCopy && (
                        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <div className="min-w-0 flex-1">
                                <span className="text-[9px] uppercase font-mono text-slate-400 block">Linha Digitável / Código de Barras</span>
                                <span className="font-mono text-xs text-amber-300 font-semibold tracking-wider truncate block">
                                    {codeToCopy}
                                </span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCopyCode}
                                className="h-7 px-2.5 text-xs border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white shrink-0"
                            >
                                {copied ? <Check size={12} className="mr-1 text-emerald-400" /> : <Copy size={12} className="mr-1" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Visualizador do Arquivo */}
                <div className="p-4 bg-slate-950 min-h-[380px] max-h-[500px] flex items-center justify-center overflow-auto">
                    {!boletoUrl ? (
                        <div className="text-center py-12 text-slate-500">
                            <AlertCircle size={36} className="mx-auto mb-2 text-slate-600" />
                            <p className="text-sm font-semibold">Nenhum arquivo de boleto foi anexado para esta parcela</p>
                            <p className="text-xs text-slate-400 mt-1">
                                O boleto pode ser copiado via código de barras ou anexado posteriormente no Contas a Pagar.
                            </p>
                        </div>
                    ) : isPdf ? (
                        <iframe
                            src={boletoUrl}
                            className="w-full h-[460px] rounded-lg border border-slate-800 bg-white shadow-inner"
                            title="Boleto PDF"
                        />
                    ) : isImage ? (
                        <div className="max-h-[460px] overflow-auto rounded-lg border border-slate-800 p-2 bg-slate-900/50">
                            <img
                                src={boletoUrl}
                                alt="Boleto"
                                className="max-w-full max-h-[440px] mx-auto object-contain rounded shadow"
                            />
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FileText size={40} className="mx-auto text-blue-400 mb-2" />
                            <p className="text-sm font-semibold text-white">Documento Anexado: {fileName || 'Boleto'}</p>
                            <a
                                href={boletoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                            >
                                <ExternalLink size={14} /> Abrir em Nova Guia
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between sm:justify-between">
                    <div>
                        {boletoUrl && (
                            <a
                                href={boletoUrl}
                                download={fileName || `boleto_${invoiceNumber || 'combustivel'}.pdf`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                                <Download size={13} /> Baixar Arquivo
                            </a>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {boletoUrl && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handlePrint}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                            >
                                <Printer size={13} className="mr-1.5" /> Imprimir
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-xs"
                        >
                            Fechar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BoletoViewerModal;
