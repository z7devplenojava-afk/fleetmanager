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
import {
    ShoppingCart,
    Package,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    Send,
    Truck
} from 'lucide-react';
import { FleetWorkOrder, WorkOrderItemType, WorkOrderStatus } from '@/services/fleetWorkOrderService';
import fleetWorkOrderService from '@/services/fleetWorkOrderService';
import { useToast } from '@/hooks/use-toast';

interface FleetWorkOrderPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: FleetWorkOrder | null;
    onSuccess: () => void;
}

export const FleetWorkOrderPurchaseModal: React.FC<FleetWorkOrderPurchaseModalProps> = ({
    isOpen,
    onClose,
    order,
    onSuccess,
}) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoUpdateStatus, setAutoUpdateStatus] = useState(true);

    if (!order) return null;

    const parts = (order.items || []).filter(
        i => (i.type ?? WorkOrderItemType.PART) === WorkOrderItemType.PART
    );

    const totalEstimated = parts.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const osNumber = order.osNumber || (order.id ? '#' + order.id.slice(0, 8) : 'OS');

    const handleConfirm = async () => {
        if (!order?.id) return;

        setIsSubmitting(true);
        try {
            const created = await fleetWorkOrderService.requestPurchase(order.id);

            // Opcional: atualizar status para AGUARDANDO PEÇA se solicitado e se a OS não estiver concluída
            if (autoUpdateStatus && order.status !== WorkOrderStatus.COMPLETED && order.status !== WorkOrderStatus.WAITING_PARTS) {
                try {
                    await fleetWorkOrderService.updateStatus(order.id, WorkOrderStatus.WAITING_PARTS);
                } catch (statusErr) {
                    console.warn('Aviso ao atualizar status para WAITING_PARTS:', statusErr);
                }
            }

            toast({
                title: 'Solicitação de Compra Enviada!',
                description: `Pedido ${created.requestNumber ? `(${created.requestNumber}) ` : ''}enviado com sucesso ao Almoxarifado para cotação.`,
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            const msg = error?.response?.data?.error || error?.response?.data?.message || 'Falha ao solicitar compra ao almoxarifado.';
            toast({
                title: 'Erro ao enviar solicitação',
                description: msg,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) onClose(); }}>
            <DialogContent className="max-w-lg w-[95vw] sm:w-full bg-[#0d0e12] border-gray-800 text-gray-100 shadow-2xl p-0 overflow-hidden rounded-2xl z-[10150]">
                {/* Header Decorativo */}
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent p-5 border-b border-gray-800/80 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 shadow-inner">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                <span>Solicitar Compra ao Almoxarifado</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-400 mt-0.5">
                                Envio direto das peças para o setor de compras iniciar cotações
                            </DialogDescription>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-white hover:bg-gray-800/60 h-8 w-8 p-0 rounded-lg"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Conteúdo Central */}
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Cartão de Identificação da OS */}
                    <div className="p-3.5 bg-seguranca-black/80 border border-gray-800 rounded-xl flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs px-2.5 py-0.5">
                                OS {osNumber}
                            </Badge>
                            {order.vehiclePlate && (
                                <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                                    <Truck className="h-3.5 w-3.5 text-gray-400" />
                                    {order.vehiclePlate} {order.vehicleModel ? `(${order.vehicleModel})` : ''}
                                </span>
                            )}
                        </div>

                        {order.status && (
                            <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
                                {order.status}
                            </Badge>
                        )}
                    </div>

                    {/* Lista de Peças Requisitadas */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-amber-400" />
                                Peças a Cotar ({parts.length})
                            </span>
                            <span className="text-gray-400">
                                Total Estimado: <strong className="text-emerald-400 font-mono">{totalEstimated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                            </span>
                        </div>

                        <div className="border border-gray-800 rounded-xl bg-seguranca-black/50 overflow-hidden divide-y divide-gray-800/80 max-h-48 overflow-y-auto">
                            {parts.length === 0 ? (
                                <div className="p-4 text-center text-xs text-gray-500 italic">
                                    Nenhuma peça cadastrada nesta OS.
                                </div>
                            ) : (
                                parts.map((part, index) => (
                                    <div key={index} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-gray-800/30 transition-colors">
                                        <div className="space-y-0.5 pr-2">
                                            <div className="font-medium text-gray-200">
                                                {part.code && (
                                                    <span className="text-amber-400/90 font-mono mr-1.5 font-bold">
                                                        [{part.code}]
                                                    </span>
                                                )}
                                                {part.description || 'Peça não identificada'}
                                            </div>
                                            <div className="text-[11px] text-gray-400">
                                                Quantidade: <span className="text-gray-300 font-semibold">{part.quantity} un</span>
                                                {part.unitPrice > 0 && (
                                                    <span className="ml-2 text-gray-400">
                                                        x {part.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right font-mono font-semibold text-gray-200 shrink-0">
                                            {(part.totalPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Guia Informativo do Processo */}
                    <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-200/90">
                        <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold text-blue-300">Como funciona o fluxo:</p>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                                Uma requisição de compra oficial será criada no Almoxarifado contendo as peças listadas.
                                Os compradores receberão a solicitação e cotarão os melhores preços e prazos.
                            </p>
                        </div>
                    </div>

                    {/* Opção Interativa: Atualizar status para Aguardando Peça */}
                    {order.status !== WorkOrderStatus.WAITING_PARTS && order.status !== WorkOrderStatus.COMPLETED && (
                        <label className="flex items-center gap-2.5 p-2.5 bg-gray-900/60 border border-gray-800 rounded-xl cursor-pointer hover:bg-gray-900 transition-colors">
                            <input
                                type="checkbox"
                                checked={autoUpdateStatus}
                                onChange={(e) => setAutoUpdateStatus(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-700 text-amber-500 focus:ring-amber-500/20 bg-gray-950"
                            />
                            <span className="text-xs text-gray-300 select-none">
                                Atualizar automaticamente o status da OS para <strong className="text-purple-400">Aguardando Peça</strong>
                            </span>
                        </label>
                    )}
                </div>

                {/* Rodapé Interativo */}
                <div className="p-4 bg-seguranca-black border-t border-gray-800 flex items-center justify-end gap-2.5">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800/80 text-xs px-4"
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting || parts.length === 0}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs px-5 shadow-lg shadow-amber-500/20"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                                Enviando Solicitação...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Confirmar e Enviar ao Almoxarifado
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FleetWorkOrderPurchaseModal;
