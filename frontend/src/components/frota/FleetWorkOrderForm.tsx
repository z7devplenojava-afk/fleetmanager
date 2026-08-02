'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Wrench, Trash2, Plus, ClipboardList, Clock, History,
    Gauge, AlertTriangle, Send, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import fleetWorkOrderService, {
    WorkOrderStatus, LaborType, WorkOrderItemType, WorkOrderPriority,
    WorkOrderItem, FleetWorkOrder, WorkOrderHistoryEntry
} from '@/services/fleetWorkOrderService';
import fleetService from '@/services/fleetService';
import { Vehicle } from '@/types/fleet';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    order?: FleetWorkOrder;
}

const PRIORITY_CONFIG = {
    LOW:    { label: 'Baixa',    color: 'bg-gray-500' },
    MEDIUM: { label: 'Média',    color: 'bg-blue-500' },
    HIGH:   { label: 'Alta',     color: 'bg-orange-500' },
    URGENT: { label: 'Urgente',  color: 'bg-red-600' },
};

const ACTION_ICONS: Record<string, string> = {
    CREATED:       '🆕',
    UPDATED:       '✏️',
    STATUS_CHANGE: '🔄',
    NOTE:          '📝',
    PART_ADDED:    '🔩',
    COST_UPDATE:   '💰',
};

const FleetWorkOrderForm: React.FC<Props> = ({ isOpen, onClose, onSuccess, order }) => {
    const { toast }       = useToast();
    const { user }        = useAuth();
    const queryClient     = useQueryClient();
    const isEdit          = !!order?.id;

    const [isLoading, setIsLoading]   = useState(false);
    const [newNote, setNewNote]       = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const [formData, setFormData] = useState<Partial<FleetWorkOrder>>({
        vehicleId: '', status: WorkOrderStatus.DRAFT,
        priority: WorkOrderPriority.MEDIUM, laborType: LaborType.INTERNAL,
        laborCost: 0, partsCost: 0, totalCost: 0,
        odometerIn: undefined, odometerOut: undefined,
        stopReason: '', mechanicName: '', notes: '', items: [],
    });


    // Histórico
    const { data: history = [] } = useQuery<WorkOrderHistoryEntry[]>({
        queryKey: ['fleet-work-order-history', order?.id],
        queryFn: () => fleetWorkOrderService.getHistory(order!.id),
        enabled: isEdit && showHistory,
    });

    // Veículos
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    useEffect(() => {
        fleetService.getVehicles().then(setVehicles).catch(() => {});
    }, []);

    // Popular form ao abrir
    useEffect(() => {
        if (order) {
            setFormData({ ...order });
        } else {
            setFormData({
                vehicleId: '', status: WorkOrderStatus.DRAFT,
                priority: WorkOrderPriority.MEDIUM, laborType: LaborType.INTERNAL,
                plannedDate: new Date().toISOString().split('T')[0],
                laborCost: 0, partsCost: 0, totalCost: 0,
                stopReason: '', mechanicName: '', notes: '', items: [],
            });
        }
        setShowHistory(false);
        setNewNote('');
    }, [order, isOpen]);

    // ── Items helpers ──────────────────────────────────────────────────────────
    const handleAddItem = () => {
        setFormData(p => ({
            ...p,
            items: [...(p.items || []), { description: '', type: WorkOrderItemType.PART, quantity: 1, unitPrice: 0, totalPrice: 0 }]
        }));
    };

    const handleRemoveItem = (idx: number) => {
        setFormData(p => {
            const items = (p.items || []).filter((_, i) => i !== idx);
            const partsCost = items.reduce((s, it) => s + it.totalPrice, 0);
            return { ...p, items, partsCost, totalCost: partsCost + (p.laborCost || 0) };
        });
    };

    const handleItemChange = (idx: number, field: keyof WorkOrderItem, value: any) => {
        setFormData(p => {
            const items = [...(p.items || [])];
            const item  = { ...items[idx], [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                item.quantity   = field === 'quantity'   ? parseFloat(value) || 0 : item.quantity;
                item.unitPrice  = field === 'unitPrice'  ? parseFloat(value) || 0 : item.unitPrice;
                item.totalPrice = item.quantity * item.unitPrice;
            }
            items[idx] = item;
            const partsCost = items.reduce((s, it) => s + it.totalPrice, 0);
            return { ...p, items, partsCost, totalCost: partsCost + (p.laborCost || 0) };
        });
    };

    const handleLaborChange = (val: string) => {
        const cost = parseFloat(val) || 0;
        setFormData(p => ({ ...p, laborCost: cost, totalCost: cost + (p.partsCost || 0) }));
    };


    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (submitStatus?: WorkOrderStatus) => {
        if (!formData.vehicleId) {
            toast({ title: 'Erro', description: 'Selecione um veículo.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        try {
            const payload: Partial<FleetWorkOrder> = {
                ...formData,
                status: submitStatus || formData.status || WorkOrderStatus.DRAFT,
                items: (formData.items || []).map(it => ({ ...it, type: it.type ?? WorkOrderItemType.PART })),
            };
            if (isEdit) {
                await fleetWorkOrderService.update(order!.id, payload);
            } else {
                await fleetWorkOrderService.create(payload);
            }
            toast({ title: 'Sucesso', description: 'Ordem de Serviço salva!' });
            onSuccess();
        } catch {
            toast({ title: 'Erro', description: 'Falha ao salvar OS.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    // ── Adicionar nota ─────────────────────────────────────────────────────────
    const handleAddNote = async () => {
        if (!newNote.trim() || !order?.id) return;
        setIsLoading(true);
        try {
            await fleetWorkOrderService.addNote(order.id, newNote.trim(), user?.name || 'Usuário');
            setNewNote('');
            queryClient.invalidateQueries({ queryKey: ['fleet-work-order-history', order.id] });
            toast({ title: 'Nota adicionada', description: 'Histórico atualizado.' });
        } catch {
            toast({ title: 'Erro', description: 'Falha ao adicionar nota.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };


    const footer = (
        <div className="flex w-full justify-between gap-3">
            <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">Cancelar</Button>
            <div className="flex gap-2 flex-wrap justify-end">
                <Button variant="outline" onClick={() => handleSubmit(WorkOrderStatus.DRAFT)} disabled={isLoading}
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                    <Clock className="mr-2 h-4 w-4" /> Rascunho
                </Button>
                <Button onClick={() => handleSubmit(WorkOrderStatus.PENDING_APPROVAL)} disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold">
                    <ClipboardList className="mr-2 h-4 w-4" /> Solicitar Aprovação
                </Button>
            </div>
        </div>
    );

    return (
        <ResponsiveDrawer isOpen={isOpen} onClose={onClose}
            title={isEdit ? `OS ${order?.osNumber || order?.id?.slice(0, 8)} — Editar` : 'Nova Ordem de Serviço'}
            description="Registre peças, mão de obra, odômetro e histórico de manutenção."
            footer={footer}
            className="sm:max-w-4xl bg-[#0a0a0b] border-gray-800/50">
            <div className="space-y-6 py-2 pb-10">

                {/* ── Seção 1: Veículo & Identificação ──────────────────────────── */}
                <Section title="Identificação" icon={<ClipboardList className="h-4 w-4 text-red-500" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Field label="Veículo *">
                            <Select value={formData.vehicleId} onValueChange={v => setFormData(p => ({ ...p, vehicleId: v }))}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600">
                                    {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate} — {v.model}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Prioridade">
                            <Select value={formData.priority} onValueChange={v => setFormData(p => ({ ...p, priority: v as WorkOrderPriority }))}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600">
                                    {Object.entries(PRIORITY_CONFIG).map(([k, c]) => (
                                        <SelectItem key={k} value={k}><span className={`inline-block w-2 h-2 rounded-full ${c.color} mr-2`} />{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Data Planejada">
                            <Input type="date" value={formData.plannedDate?.toString() || ''} onChange={e => setFormData(p => ({ ...p, plannedDate: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Data Real de Entrada">
                            <Input type="date" value={formData.actualDate?.toString() || ''} onChange={e => setFormData(p => ({ ...p, actualDate: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Mecânico / Responsável">
                            <Input value={formData.mechanicName || ''} onChange={e => setFormData(p => ({ ...p, mechanicName: e.target.value }))} placeholder="Nome do mecânico" className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Tipo de Mão de Obra">
                            <Select value={formData.laborType} onValueChange={v => setFormData(p => ({ ...p, laborType: v as LaborType }))}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600">
                                    <SelectItem value={LaborType.INTERNAL}>Interna (Própria)</SelectItem>
                                    <SelectItem value={LaborType.EXTERNAL}>Externa (Terceiros)</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                </Section>


                {/* ── Seção 2: Odômetro & Parada ─────────────────────────────── */}
                <Section title="Odômetro & Motivo da Parada" icon={<Gauge className="h-4 w-4 text-yellow-500" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Odômetro — Entrada (km)">
                            <Input type="number" min={0} value={formData.odometerIn ?? ''} onChange={e => setFormData(p => ({ ...p, odometerIn: parseInt(e.target.value) || undefined }))} placeholder="Ex: 85400" className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Odômetro — Saída (km)">
                            <Input type="number" min={0} value={formData.odometerOut ?? ''} onChange={e => setFormData(p => ({ ...p, odometerOut: parseInt(e.target.value) || undefined }))} placeholder="Ex: 85450" className="bg-seguranca-black border-gray-600" />
                        </Field>
                    </div>
                    {/* Tempo parado calculado */}
                    {(formData.downtimeHours != null || formData.downtimeDays != null) && (
                        <div className="flex gap-3 mt-2">
                            <Badge className="bg-orange-600/20 text-orange-400 border border-orange-600/40">
                                <Clock className="h-3 w-3 mr-1" /> {formData.downtimeHours}h parado
                            </Badge>
                            <Badge className="bg-orange-600/20 text-orange-400 border border-orange-600/40">
                                {formData.downtimeDays} dia(s)
                            </Badge>
                        </div>
                    )}
                    <Field label="Motivo da Parada / Defeito Relatado">
                        <Textarea value={formData.stopReason || ''} onChange={e => setFormData(p => ({ ...p, stopReason: e.target.value }))} placeholder="Descreva o problema que levou o veículo à oficina…" className="bg-seguranca-black border-gray-600 min-h-[80px]" />
                    </Field>
                </Section>

                {/* ── Seção 3: Peças & Serviços ──────────────────────────────── */}
                <Section title="Peças e Serviços" icon={<Wrench className="h-4 w-4 text-blue-400" />}
                    action={<Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="border-red-500 text-red-400 hover:bg-red-500/10"><Plus className="h-4 w-4 mr-1" />Item</Button>}>
                    <div className="hidden md:block border border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-800/60 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="p-3 text-left">Tipo</th>
                                    <th className="p-3 text-left">Descrição</th>
                                    <th className="p-3 text-center w-20">Qtd</th>
                                    <th className="p-3 text-right w-28">Unitário</th>
                                    <th className="p-3 text-right w-28">Total</th>
                                    <th className="p-3 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/60">
                                {(formData.items || []).map((item, idx) => (
                                    <tr key={idx} className="bg-seguranca-black/20">
                                        <td className="p-2 w-28">
                                            <Select value={item.type || WorkOrderItemType.PART} onValueChange={v => handleItemChange(idx, 'type', v)}>
                                                <SelectTrigger className="bg-transparent border-none h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-seguranca-black border-gray-600 text-xs">
                                                    <SelectItem value={WorkOrderItemType.PART}>Peça</SelectItem>
                                                    <SelectItem value={WorkOrderItemType.LABOR}>Serviço</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-2"><Input value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} placeholder="Descrição" className="bg-transparent border-none h-8 focus:ring-0" /></td>
                                        <td className="p-2"><Input type="number" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} className="bg-transparent border-none h-8 text-center focus:ring-0" /></td>
                                        <td className="p-2"><Input type="number" value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} className="bg-transparent border-none h-8 text-right focus:ring-0" /></td>
                                        <td className="p-2 text-right font-mono text-gray-200">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-2 text-center"><Button variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-500/10 h-7 w-7 p-0"><Trash2 className="h-3.5 w-3.5" /></Button></td>
                                    </tr>
                                ))}
                                {(!formData.items?.length) && (<tr><td colSpan={6} className="p-6 text-center text-gray-500 italic text-sm">Nenhum item. Clique em "+ Item" para adicionar.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </Section>


                {/* ── Seção 4: Resumo de Custos ──────────────────────────────── */}
                <Section title="Resumo de Custos" icon={<AlertTriangle className="h-4 w-4 text-green-400" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Custo Mão de Obra (R$)">
                            <div className="relative"><span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                                <Input type="number" value={formData.laborCost || 0} onChange={e => handleLaborChange(e.target.value)} className="bg-seguranca-black border-gray-600 pl-9" /></div>
                        </Field>
                        <Field label="Custo Peças (calc.)">
                            <Input readOnly value={(formData.partsCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className="bg-seguranca-black border-gray-700 text-gray-400" />
                        </Field>
                        <Field label="Custo Total">
                            <Input readOnly value={(formData.totalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className="bg-seguranca-black border-gray-700 font-bold text-green-400" />
                        </Field>
                    </div>
                </Section>

                {/* ── Seção 5: Observações ──────────────────────────────────── */}
                <Section title="Observações Técnicas" icon={<ClipboardList className="h-4 w-4 text-gray-400" />}>
                    <Textarea value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Diagnóstico, procedimentos realizados, recomendações do mecânico…"
                        className="bg-seguranca-black border-gray-600 min-h-[90px]" />
                </Section>

                {/* ── Seção 6: Histórico (somente edição) ──────────────────── */}
                {isEdit && (
                    <Section title="Histórico da OS" icon={<History className="h-4 w-4 text-purple-400" />}
                        action={
                            <Button variant="ghost" size="sm" onClick={() => setShowHistory(v => !v)} className="text-gray-400 hover:text-white">
                                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {showHistory ? 'Ocultar' : 'Mostrar'}
                            </Button>
                        }>
                        {showHistory && (
                            <div className="space-y-3">
                                {/* Timeline */}
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                    {history.length === 0 && <p className="text-sm text-gray-500 italic">Nenhum registro.</p>}
                                    {history.map(h => (
                                        <div key={h.id} className="flex gap-3 text-sm">
                                            <span className="mt-0.5 text-base shrink-0">{ACTION_ICONS[h.actionType] || '•'}</span>
                                            <div className="flex-1">
                                                <p className="text-gray-200">{h.description}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {h.performedBy && <span className="text-gray-400">{h.performedBy} · </span>}
                                                    {new Date(h.createdAt).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="bg-gray-700" />
                                {/* Adicionar nota */}
                                <div className="flex gap-2">
                                    <Input value={newNote} onChange={e => setNewNote(e.target.value)}
                                        placeholder="Adicionar anotação ao histórico…"
                                        className="bg-seguranca-black border-gray-600 flex-1"
                                        onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
                                    <Button onClick={handleAddNote} disabled={!newNote.trim() || isLoading}
                                        size="sm" className="bg-purple-700 hover:bg-purple-800 text-white shrink-0">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Section>
                )}
            </div>
        </ResponsiveDrawer>
    );
};

// ── Sub-componentes ────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, action, children }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 uppercase tracking-wide">
                {icon}{title}
            </h3>
            {action}
        </div>
        <Separator className="bg-gray-800" />
        {children}
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <Label className="text-xs text-gray-400 uppercase tracking-wide">{label}</Label>
        {children}
    </div>
);

export default FleetWorkOrderForm;
