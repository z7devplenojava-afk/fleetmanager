'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Wrench,
    Trash2,
    Plus,
    ClipboardList,
    Car,
    User,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Clock,
    Image as ImageIcon,
    X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fleetWorkOrderService, {
    WorkOrderStatus,
    LaborType,
    WorkOrderItemType,
    WorkOrderItem,
    FleetWorkOrder
} from '@/services/fleetWorkOrderService';
import fleetService from '@/services/fleetService';
import { Vehicle } from '@/types/fleet';

interface FleetWorkOrderFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    order?: FleetWorkOrder;
}

const FleetWorkOrderForm: React.FC<FleetWorkOrderFormProps> = ({
    isOpen,
    onClose,
    onSuccess,
    order
}) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const [formData, setFormData] = useState<Partial<FleetWorkOrder>>({
        vehicleId: '',
        status: WorkOrderStatus.DRAFT,
        laborType: LaborType.INTERNAL,
        laborCost: 0,
        partsCost: 0,
        totalCost: 0,
        notes: '',
        items: [],
        photoAttachments: []
    });

    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    useEffect(() => {
        const loadVehicles = async () => {
            try {
                const data = await fleetService.getVehicles();
                setVehicles(data);
            } catch (error) {
                console.error('Error loading vehicles:', error);
            }
        };
        loadVehicles();
    }, []);

    useEffect(() => {
        if (order) {
            setFormData(order);
        } else {
            setFormData({
                vehicleId: '',
                plannedDate: new Date().toISOString().split('T')[0],
                status: WorkOrderStatus.DRAFT,
                laborType: LaborType.INTERNAL,
                laborCost: 0,
                partsCost: 0,
                totalCost: 0,
                notes: '',
                items: []
            });
        }
    }, [order, isOpen]);

    const handleAddItem = () => {
        const newItem: WorkOrderItem = {
            description: '',
            type: WorkOrderItemType.PART,
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0
        };
        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }));
    };

    const handleRemoveItem = (index: number) => {
        setFormData(prev => {
            const newItems = [...(prev.items || [])];
            newItems.splice(index, 1);
            return { ...prev, items: newItems };
        });
    };

    const handleItemChange = (index: number, field: keyof WorkOrderItem, value: any) => {
        setFormData(prev => {
            const newItems = [...(prev.items || [])];
            const item = { ...newItems[index] };

            if (field === 'quantity' || field === 'unitPrice') {
                const val = parseFloat(value) || 0;
                (item as any)[field] = val;
                item.totalPrice = item.quantity * item.unitPrice;
            } else {
                (item as any)[field] = value;
            }

            newItems[index] = item;

            // Recalculate parts total
            const partsCost = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
            const totalCost = partsCost + (prev.laborCost || 0);

            return {
                ...prev,
                items: newItems,
                partsCost,
                totalCost
            };
        });
    };

    const handleLaborChange = (value: string) => {
        const cost = parseFloat(value) || 0;
        setFormData(prev => ({
            ...prev,
            laborCost: cost,
            totalCost: cost + (prev.partsCost || 0)
        }));
    };

    const handleSubmit = async (submitStatus?: WorkOrderStatus) => {
        if (!formData.vehicleId) {
            toast({ title: 'Erro', description: 'Selecione um veículo.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            const itemsWithType = (formData.items || []).map((item) => ({
                ...item,
                type: item.type ?? WorkOrderItemType.PART
            }));

            const dataToSave = {
                ...formData,
                items: itemsWithType,
                status: submitStatus || formData.status || WorkOrderStatus.DRAFT
            };

            if (order?.id) {
                // Backend ainda não expõe PUT completo: não reenviar id (evita confusão / duplicidade).
                const { id: _omit, ...createPayload } = dataToSave as FleetWorkOrder & { id?: string };
                await fleetWorkOrderService.create(createPayload);
            } else {
                await fleetWorkOrderService.create(dataToSave);
            }

            toast({ title: 'Sucesso', description: 'Ordem de Serviço salva com sucesso!' });
            onSuccess();
        } catch (error) {
            console.error('Error saving Work Order:', error);
            toast({ title: 'Erro', description: 'Falha ao salvar Ordem de Serviço.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const footer = (
        <div className="flex w-full justify-between gap-3">
            <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
                Cancelar
            </Button>
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={() => handleSubmit(WorkOrderStatus.DRAFT)}
                    disabled={isLoading}
                    className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                >
                    <Clock className="mr-2 h-4 w-4" /> Salvar Rascunho
                </Button>
                <Button
                    onClick={() => handleSubmit(WorkOrderStatus.PENDING_APPROVAL)}
                    disabled={isLoading}
                    className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/80"
                >
                    <ClipboardList className="mr-2 h-4 w-4" /> Solicitar Aprovação
                </Button>
            </div>
        </div>
    );

    return (
        <ResponsiveDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={order ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço de Frota'}
            description="Registre peças, serviços e mão de obra para manutenção de veículos."
            footer={footer}
            className="sm:max-w-4xl bg-[#0a0a0b] border-gray-800/50 shadow-2xl shadow-black/80"
        >
            <div className="space-y-8 py-2 pb-10 relative overflow-hidden">
                {/* Subtle Background Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-seguranca-yellow/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-seguranca-red/5 rounded-full blur-[100px] pointer-events-none" />
                {/* Header Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-gray-400">Veículo</Label>
                        <Select
                            value={formData.vehicleId}
                            onValueChange={(v) => setFormData(p => ({ ...p, vehicleId: v }))}
                        >
                            <SelectTrigger className="bg-seguranca-black border-gray-600">
                                <SelectValue placeholder="Selecione o veículo" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-black border-gray-600">
                                {vehicles.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.plate} - {v.model}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-400">Tipo de Mão de Obra</Label>
                        <Select
                            value={formData.laborType}
                            onValueChange={(v) => setFormData(p => ({ ...p, laborType: v as LaborType }))}
                        >
                            <SelectTrigger className="bg-seguranca-black border-gray-600">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-black border-gray-600">
                                <SelectItem value={LaborType.INTERNAL}>Interna (Oficina Própria)</SelectItem>
                                <SelectItem value={LaborType.EXTERNAL}>Externa (Terceirizado)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <Label className="text-gray-400">Custo Mão de Obra (R$)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                            <Input
                                type="number"
                                value={formData.laborCost}
                                onChange={(e) => handleLaborChange(e.target.value)}
                                className="bg-seguranca-black border-gray-600 pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-seguranca-yellow font-bold text-lg flex items-center gap-2">
                            <Wrench className="h-5 w-5" /> Peças e Serviços
                        </Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddItem}
                            className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow/10"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                        </Button>
                    </div>

                    {/* Table View (Desktop) */}
                    <div className="hidden md:block border border-gray-600 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-800/50 text-gray-300">
                                <tr>
                                    <th className="p-3 text-left">Descrição</th>
                                    <th className="p-3 text-center w-24">Qtd</th>
                                    <th className="p-3 text-right w-32">Unitário</th>
                                    <th className="p-3 text-right w-32">Total</th>
                                    <th className="p-3 text-center w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {(formData.items || []).map((item, idx) => (
                                    <tr key={idx} className="bg-seguranca-black/30">
                                        <td className="p-2">
                                            <Input
                                                value={item.description}
                                                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                placeholder="Nome da peça ou serviço"
                                                className="bg-transparent border-none focus:ring-0 h-8"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 h-8 text-center"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 h-8 text-right"
                                            />
                                        </td>
                                        <td className="p-2 text-right font-mono text-seguranca-lightgray">
                                            {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="p-2 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveItem(idx)}
                                                className="text-red-500 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {(!formData.items || formData.items.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                                            Nenhum item adicionado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Card View (Mobile) */}
                    <div className="md:hidden space-y-3">
                        {(formData.items || []).map((item, idx) => (
                            <div key={idx} className="bg-seguranca-black/30 border border-gray-600 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <Label className="text-xs text-gray-500 block mb-1">Descrição</Label>
                                        <Input
                                            value={item.description}
                                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                            placeholder="Ex: Óleo 5W30"
                                            className="bg-seguranca-black border-gray-700 h-9"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="text-red-500 shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs text-gray-500 block mb-1">Qtd</Label>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                            className="bg-seguranca-black border-gray-700 h-9"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500 block mb-1">Unitário</Label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2 text-[10px] text-gray-500">R$</span>
                                            <Input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                                className="bg-seguranca-black border-gray-700 h-9 pl-6"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                    <span className="text-xs text-gray-400">Total do Item:</span>
                                    <span className="font-mono font-bold text-seguranca-lightgray">
                                        {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!formData.items || formData.items.length === 0) && (
                            <div className="p-8 text-center text-gray-500 italic border border-dashed border-gray-600 rounded-lg">
                                Nenhum item adicionado.
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label className="text-gray-400">Observações Técnicas</Label>
                    <div className="relative">
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Relato do mecânico, diagnóstico ou observações sobre o serviço..."
                            className="bg-seguranca-black border-gray-600 min-h-[100px] focus:border-seguranca-yellow transition-colors"
                        />
                    </div>
                </div>

                {/* Photos */}
                <div className="space-y-4">
                    <Label className="text-gray-400 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-seguranca-yellow" /> Evidências Visuais (Fotos)
                    </Label>

                    {formData.photoAttachments && formData.photoAttachments.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                            {formData.photoAttachments.map((url, idx) => (
                                <div key={idx} className="relative group aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                                    <img src={url} alt={`Evidência ${idx}`} className="w-full h-full object-cover" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                            setFormData(p => ({
                                                ...p,
                                                photoAttachments: p.photoAttachments?.filter((_, i) => i !== idx)
                                            }));
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-seguranca-black/50 hover:bg-seguranca-black hover:border-seguranca-yellow/50 transition-all group">
                            <div className="flex items-center gap-3">
                                <Plus className="w-6 h-6 text-gray-500 group-hover:text-seguranca-yellow transition-colors" />
                                <div className="text-left">
                                    <p className="text-sm text-gray-400 font-semibold">Anexar fotos das peças</p>
                                    <p className="text-xs text-gray-500">JPG, PNG (máx. 10MB)</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setSelectedFiles(e.target.files);
                                        toast({ title: 'Fotos selecionadas', description: `${e.target.files.length} arquivos prontos para upload.` });
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                {/* Final Summary Bar (Sticky-like at bottom of scroll) */}
                <div className="mt-8 bg-gradient-to-r from-gray-900 to-seguranca-black p-5 rounded-xl border border-seguranca-yellow/30 shadow-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Subtotal Peças</span>
                            <p className="font-mono text-gray-300">
                                {(formData.partsCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Mão de Obra</span>
                            <p className="font-mono text-gray-300">
                                {(formData.laborCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
                        <span className="text-sm font-bold text-seguranca-yellow uppercase tracking-widest text-shadow-sm">TOTAL GERAL</span>
                        <span className="text-3xl font-mono font-black text-seguranca-yellow drop-shadow-md">
                            {(formData.totalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                </div>
            </div>
        </ResponsiveDrawer>
    );
};

export default FleetWorkOrderForm;
