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
    Gauge, AlertTriangle, Send, ChevronDown, ChevronUp, CheckCircle, XCircle, MinusCircle, UserCheck,
    Camera, UploadCloud, Image
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import fleetWorkOrderService, {
    WorkOrderStatus, LaborType, WorkOrderItemType, WorkOrderPriority, MaintenanceType, ChecklistStatus,
    WorkOrderItem, FleetWorkOrder, FleetWorkOrderChecklist, WorkOrderHistoryEntry
} from '@/services/fleetWorkOrderService';
import fleetService from '@/services/fleetService';
import { clientService } from '@/services/clientService';
import { departmentService } from '@/services/departmentService';
import { employeeService } from '@/services/employeeService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { garageService, Garage } from '@/services/garageService';
import { Vehicle } from '@/types/fleet';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    order?: FleetWorkOrder;
    initialVehicleId?: string;
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

const FleetWorkOrderForm: React.FC<Props> = ({ isOpen, onClose, onSuccess, order, initialVehicleId }) => {
    const { toast }       = useToast();
    const { user }        = useAuth();
    const queryClient     = useQueryClient();
    const isEdit          = !!order?.id;

    const [isLoading, setIsLoading]     = useState(false);
    const [newNote, setNewNote]         = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const [formData, setFormData] = useState<Partial<FleetWorkOrder>>({
        vehicleId: '',
        maintenanceType: MaintenanceType.CORRETIVA,
        status: WorkOrderStatus.OPEN,
        priority: WorkOrderPriority.MEDIUM,
        laborType: LaborType.INTERNAL,
        stopDate: new Date().toISOString().split('T')[0],
        stopTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        laborCost: 0, partsCost: 0, totalCost: 0,
        odometerIn: undefined, odometerOut: undefined,
        stopReason: '', mechanicName: '', notes: '', items: [], checklistItems: [],
        anomaliesDescription: '', otherDescription: '', maintenancePerformed: ''
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

    // Clientes, Obras/Postos, Setores, Requerentes (PRD §6, §20, §21, §22)
    const { data: clients = [] } = useQuery({
        queryKey: ['clients-for-select'],
        queryFn: () => clientService.getClientsForSelect(),
        staleTime: 60_000,
    });
    const { data: allWorkPosts = [] } = useQuery<WorkPost[]>({
        queryKey: ['work-posts-all'],
        queryFn: () => workPostService.getAllWorkPosts(),
        staleTime: 60_000,
    });
    const { data: departments = [] } = useQuery({
        queryKey: ['departments-active'],
        queryFn: () => departmentService.getAll(),
        staleTime: 60_000,
    });
    const { data: employees = [] } = useQuery({
        queryKey: ['employees-all-select'],
        queryFn: () => employeeService.getAllEmployees(),
        staleTime: 60_000,
    });
    const { data: garagesForOS = [] } = useQuery<Garage[]>({
        queryKey: ['garages-for-os'],
        queryFn: () => garageService.list(),
        staleTime: 60_000,
    });

    // Obras filtradas pelo cliente selecionado
    const obrasForClient = React.useMemo(() => {
        if (!allWorkPosts || allWorkPosts.length === 0) return [];
        if (!formData.clientId) return allWorkPosts;
        const matching = allWorkPosts.filter((wp: any) => wp.clientId === formData.clientId);
        return matching.length > 0 ? matching : allWorkPosts;
    }, [allWorkPosts, formData.clientId]);

    // Lista de Mecânicos / Manutenção (filtrada por cargo ou fallback para todos)
    const mechanicsList = React.useMemo(() => {
        if (!employees || employees.length === 0) return [];
        const filtered = employees.filter((e: any) => {
            const pos = (e.position?.name || e.cargo || '').toLowerCase();
            return pos.includes('mecanic') || pos.includes('mecânico') || pos.includes('manuten') || pos.includes('tecnic') || pos.includes('eletric');
        });
        return filtered.length > 0 ? filtered : employees;
    }, [employees]);

    // Handlers para Upload de Fotos / Evidências
    const [newPhotoUrl, setNewPhotoUrl] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                if (base64Url) {
                    setFormData(p => ({
                        ...p,
                        photoAttachments: [...(p.photoAttachments || []), base64Url]
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemovePhoto = (idx: number) => {
        setFormData(p => ({
            ...p,
            photoAttachments: (p.photoAttachments || []).filter((_, i) => i !== idx)
        }));
    };

    const handleAddPhotoUrl = () => {
        if (!newPhotoUrl.trim()) return;
        setFormData(p => ({
            ...p,
            photoAttachments: [...(p.photoAttachments || []), newPhotoUrl.trim()]
        }));
        setNewPhotoUrl('');
    };

    // Carregar itens mestre de checklist caso selecione PREVENTIVA e ainda não tenha itens
    useEffect(() => {
        if (formData.maintenanceType === MaintenanceType.PREVENTIVA && (!formData.checklistItems || formData.checklistItems.length === 0)) {
            fleetWorkOrderService.getChecklistMasterItems().then(masterItems => {
                const initialChecklist: FleetWorkOrderChecklist[] = masterItems.map(m => ({
                    checklistItemId: m.id,
                    checklistItemDescricao: m.descricao,
                    checklistItemCategoria: m.categoria,
                    situacao: ChecklistStatus.OK,
                    observacao: '',
                    reparoRealizado: ''
                }));
                setFormData(p => ({ ...p, checklistItems: initialChecklist }));
            }).catch(() => {});
        }
    }, [formData.maintenanceType]);

    // Popular form ao abrir
    useEffect(() => {
        if (order) {
            setFormData({ ...order });
        } else {
            const today = new Date().toISOString().split('T')[0];
            const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setFormData({
                vehicleId: initialVehicleId || '',
                maintenanceType: MaintenanceType.CORRETIVA,
                status: WorkOrderStatus.OPEN,
                priority: WorkOrderPriority.MEDIUM,
                laborType: LaborType.INTERNAL,
                plannedDate: today,
                stopDate: today,
                stopTime: nowTime,
                laborCost: 0, partsCost: 0, totalCost: 0,
                stopReason: '', mechanicName: '', notes: '', items: [], checklistItems: [],
                anomaliesDescription: '', otherDescription: '', maintenancePerformed: ''
            });
        }
        setShowHistory(false);
        setNewNote('');
    }, [order, isOpen, initialVehicleId]);

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

    const handleChecklistStatusChange = (idx: number, status: ChecklistStatus) => {
        setFormData(p => {
            const list = [...(p.checklistItems || [])];
            list[idx] = { ...list[idx], situacao: status };
            return { ...p, checklistItems: list };
        });
    };

    const handleChecklistTextChange = (idx: number, field: 'observacao' | 'reparoRealizado', value: string) => {
        setFormData(p => {
            const list = [...(p.checklistItems || [])];
            list[idx] = { ...list[idx], [field]: value };
            return { ...p, checklistItems: list };
        });
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (submitStatus?: WorkOrderStatus) => {
        if (!formData.vehicleId) {
            toast({ title: 'Erro', description: 'Selecione um veículo/equipamento.', variant: 'destructive' });
            return;
        }

        if (formData.maintenanceType === MaintenanceType.CORRETIVA && !formData.anomaliesDescription?.trim()) {
            toast({ title: 'Erro', description: 'A descrição de anomalias é obrigatória para OS Corretiva.', variant: 'destructive' });
            return;
        }

        if (submitStatus === WorkOrderStatus.COMPLETED && !formData.maintenancePerformed?.trim()) {
            toast({ title: 'Erro', description: 'Preencha a descrição da manutenção realizada para concluir a OS.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            const payload: Partial<FleetWorkOrder> = {
                ...formData,
                status: submitStatus || formData.status || WorkOrderStatus.OPEN,
                items: (formData.items || []).map(it => ({ ...it, type: it.type ?? WorkOrderItemType.PART })),
            };
            if (isEdit) {
                await fleetWorkOrderService.update(order!.id, payload);
            } else {
                await fleetWorkOrderService.create(payload);
            }
            toast({ title: 'Sucesso', description: 'Ordem de Serviço salva com sucesso!' });
            onSuccess();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Falha ao salvar OS.';
            toast({ title: 'Erro', description: msg, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    // ── Adicionar nota ao histórico ────────────────────────────────────────────
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
                <Button variant="outline" onClick={() => handleSubmit(WorkOrderStatus.OPEN)} disabled={isLoading}
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                    <Clock className="mr-2 h-4 w-4" /> Salvar Rascunho / Aberta
                </Button>
                <Button onClick={() => handleSubmit(WorkOrderStatus.IN_PROGRESS)} disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
                    <Wrench className="mr-2 h-4 w-4" /> Em Andamento
                </Button>
                <Button onClick={() => handleSubmit(WorkOrderStatus.COMPLETED)} disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold">
                    <CheckCircle className="mr-2 h-4 w-4" /> Concluir OS
                </Button>
            </div>
        </div>
    );

    // Agrupamento do Checklist por Categoria
    const checklistByCategory = (formData.checklistItems || []).reduce<Record<string, { item: FleetWorkOrderChecklist, originalIndex: number }[]>>((acc, item, idx) => {
        const cat = item.checklistItemCategoria || 'GERAL';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ item, originalIndex: idx });
        return acc;
    }, {});

    return (
        <ResponsiveDrawer isOpen={isOpen} onClose={onClose}
            title={isEdit ? `OS ${order?.osNumber || order?.id?.slice(0, 8)} — Editar` : 'Nova Ordem de Serviço'}
            description="Cadastre manutenções corretivas e preventivas com controle completo de checklist e execução."
            footer={footer}
            className="sm:max-w-4xl bg-[#0a0a0b] border-gray-800/50 z-[10050]">
            <div className="space-y-6 py-2 pb-10">

                {/* ── Seção 1: Tipo & Identificação ──────────────────────────── */}
                <Section title="Identificação da OS" icon={<ClipboardList className="h-4 w-4 text-red-500" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Field label="Tipo de Manutenção *">
                            <Select value={formData.maintenanceType || MaintenanceType.CORRETIVA}
                                onValueChange={v => setFormData(p => ({ ...p, maintenanceType: v as MaintenanceType }))}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600 font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600">
                                    <SelectItem value={MaintenanceType.CORRETIVA}>🔧 CORRETIVA</SelectItem>
                                    <SelectItem value={MaintenanceType.PREVENTIVA}>📋 PREVENTIVA</SelectItem>
                                    <SelectItem value={MaintenanceType.PREDITIVA}>📊 PREDITIVA</SelectItem>
                                    <SelectItem value={MaintenanceType.INSPECAO}>🔍 INSPEÇÃO</SelectItem>
                                    <SelectItem value={MaintenanceType.LUBRIFICACAO}>🛢️ LUBRIFICAÇÃO</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Equipamento / Veículo *">
                            <Select
                                value={formData.vehicleId || ''}
                                onValueChange={v => {
                                    const selectedVeh = vehicles.find(veh => veh.id === v);
                                    // Sugere a garagem onde o veículo está recolhido
                                    const vehGarage = selectedVeh?.garageId
                                        ? garagesForOS.find((g: Garage) => g.id === selectedVeh.garageId)
                                        : undefined;
                                    setFormData(p => ({
                                        ...p,
                                        vehicleId: v,
                                        clientId: selectedVeh?.clientId || p.clientId,
                                        sectorId: selectedVeh?.workPostId || p.sectorId,
                                        workPostId: selectedVeh?.workPostId || p.workPostId,
                                        garageId: p.garageId || selectedVeh?.garageId || undefined,
                                        garageName: p.garageName || vehGarage?.name || selectedVeh?.garageName || undefined,
                                        odometerIn: (selectedVeh?.currentMileage !== undefined && selectedVeh?.currentMileage !== null)
                                            ? selectedVeh.currentMileage
                                            : p.odometerIn
                                    }));
                                }}
                            >
                                <SelectTrigger className="bg-seguranca-black border-gray-600"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                    {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate} — {v.model} ({v.brand || 'N/A'})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Prioridade">
                            <Select value={formData.priority} onValueChange={v => setFormData(p => ({ ...p, priority: v as WorkOrderPriority }))}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                    {Object.entries(PRIORITY_CONFIG).map(([k, c]) => (
                                        <SelectItem key={k} value={k}><span className={`inline-block w-2 h-2 rounded-full ${c.color} mr-2`} />{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Mecânico / Responsável *">
                            <Select
                                value={formData.mechanicId || ''}
                                onValueChange={v => {
                                    const emp = employees.find((e: any) => e.id === v);
                                    setFormData(p => ({
                                        ...p,
                                        mechanicId: v,
                                        mechanicName: emp ? emp.name : p.mechanicName
                                    }));
                                }}
                            >
                                <SelectTrigger className="bg-seguranca-black border-gray-600">
                                    <SelectValue placeholder={formData.mechanicName || "Selecione o mecânico..."} />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                    {mechanicsList.map((emp: any) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.name} {emp.position?.name ? `(${emp.position.name})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Tipo de Mão de Obra">
                            <Select value={formData.laborType} onValueChange={v => setFormData(p => ({ ...p, laborType: v as LaborType }))}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                    <SelectItem value={LaborType.INTERNAL}>Interna (Própria)</SelectItem>
                                    <SelectItem value={LaborType.EXTERNAL}>Externa (Terceiros)</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Informação de Agregado">
                            <Input value={formData.aggregateInfo || ''} onChange={e => setFormData(p => ({ ...p, aggregateInfo: e.target.value }))} placeholder="Ex: Carreta 02 / Reboque" className="bg-seguranca-black border-gray-600" />
                        </Field>

                        {/* PRD §6 §20 §21 §22 — Cliente, Setor (Obra do Cliente), Requerente */}
                        <Field label="Cliente *">
                            <Select
                                value={formData.clientId || ''}
                                onValueChange={v => {
                                    setFormData(p => {
                                        const currentWp = allWorkPosts.find((w: any) => w.id === (p.sectorId || p.workPostId));
                                        const isCurrentWpValid = currentWp && currentWp.clientId === v;
                                        return {
                                            ...p,
                                            clientId: v,
                                            sectorId: isCurrentWpValid ? p.sectorId : undefined,
                                            workPostId: isCurrentWpValid ? p.workPostId : undefined,
                                            workPostName: isCurrentWpValid ? p.workPostName : undefined
                                        };
                                    });
                                }}
                            >
                                <SelectTrigger className="bg-seguranca-black border-gray-600"><SelectValue placeholder="Selecione o cliente…" /></SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                    {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Setor / Obra *">
                            <Select
                                value={formData.sectorId || formData.workPostId || ''}
                                onValueChange={v => {
                                    const selectedWp = allWorkPosts.find((w: any) => w.id === v);
                                    setFormData(p => ({
                                        ...p,
                                        sectorId: v,
                                        workPostId: v,
                                        workPostName: selectedWp ? selectedWp.name : p.workPostName,
                                        clientId: (selectedWp && selectedWp.clientId) ? selectedWp.clientId : p.clientId
                                    }));
                                }}
                            >
                                <SelectTrigger className="bg-seguranca-black border-gray-600">
                                    <SelectValue placeholder={formData.clientId ? "Selecione a obra do cliente…" : "Selecione o setor / obra…"} />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                    {obrasForClient.length > 0 ? (
                                        obrasForClient.map((wp: any) => (
                                            <SelectItem key={wp.id} value={wp.id}>
                                                {wp.name} {wp.postCode ? `(${wp.postCode})` : ''} {!formData.clientId && wp.clientName ? `— ${wp.clientName}` : ''}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-gray-400 text-center">
                                            Nenhuma obra cadastrada para este cliente
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Requerente *">
                            <Select value={formData.requesterId || ''} onValueChange={v => setFormData(p => ({ ...p, requesterId: v }))}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600"><SelectValue placeholder="Selecione o requerente…" /></SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                    {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name || e.fullName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Garagem (onde o serviço será executado) *">
                            <Select
                                value={formData.garageId || ''}
                                onValueChange={v => {
                                    const g = garagesForOS.find((x: Garage) => x.id === v);
                                    setFormData(p => ({ ...p, garageId: v, garageName: g ? g.name : p.garageName }));
                                }}
                            >
                                <SelectTrigger className="bg-seguranca-black border-gray-600">
                                    <SelectValue placeholder="Selecione a garagem…" />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                    {garagesForOS.length > 0 ? (
                                        garagesForOS.map((g: Garage) => (
                                            <SelectItem key={g.id} value={g.id}>
                                                {g.name} {g.responsibleName ? `— resp.: ${g.responsibleName}` : ''}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-gray-400 text-center">
                                            Nenhuma garagem cadastrada
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                </Section>

                {/* ── Seção 2: Dados de Parada e Saída ────────────────────────────── */}
                <Section title="Dados da Parada & Saída" icon={<Gauge className="h-4 w-4 text-yellow-500" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Field label="Data da Parada *">
                            <Input type="date" value={formData.stopDate || ''} onChange={e => setFormData(p => ({ ...p, stopDate: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Hora da Parada *">
                            <Input type="time" value={formData.stopTime || ''} onChange={e => setFormData(p => ({ ...p, stopTime: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Data de Saída (Encerramento)">
                            <Input type="date" value={formData.exitDate || ''} onChange={e => setFormData(p => ({ ...p, exitDate: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Hora de Saída">
                            <Input type="time" value={formData.exitTime || ''} onChange={e => setFormData(p => ({ ...p, exitTime: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                        <Field label="Odômetro / KM Parada">
                            <Input type="number" min={0} value={formData.odometerIn ?? ''} onChange={e => setFormData(p => ({ ...p, odometerIn: parseInt(e.target.value) || undefined }))} placeholder="Ex: 120500" className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Odômetro / KM Saída">
                            <Input type="number" min={0} value={formData.odometerOut ?? ''} onChange={e => setFormData(p => ({ ...p, odometerOut: parseInt(e.target.value) || undefined }))} placeholder="Ex: 120520" className="bg-seguranca-black border-gray-600" />
                        </Field>
                    </div>
                </Section>

                {/* ── Seção Dinâmica Corretiva vs Preventiva ──────────────────────── */}
                {formData.maintenanceType === MaintenanceType.CORRETIVA ? (
                    <Section title="Manutenção Corretiva — Anomalias" icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}>
                        <Field label="Descrição das Anomalias Identificadas *">
                            <Textarea value={formData.anomaliesDescription || ''} onChange={e => setFormData(p => ({ ...p, anomaliesDescription: e.target.value }))}
                                placeholder="Descreva em detalhes os defeitos e anomalias identificados que necessitam de reparo…"
                                className="bg-seguranca-black border-gray-600 min-h-[90px]" />
                        </Field>
                        <Field label="Outros Detalhes (Opcional)">
                            <Textarea value={formData.otherDescription || ''} onChange={e => setFormData(p => ({ ...p, otherDescription: e.target.value }))}
                                placeholder="Observações adicionais ou pendências relativas à OS…"
                                className="bg-seguranca-black border-gray-600 min-h-[60px]" />
                        </Field>
                    </Section>
                ) : (
                    <Section title="Checklist de Inspeção Preventiva" icon={<ClipboardList className="h-4 w-4 text-green-400" />}>
                        <div className="space-y-6">
                            {Object.keys(checklistByCategory).length === 0 ? (
                                <p className="text-sm text-gray-500 italic">Carregando itens de inspeção…</p>
                            ) : (
                                Object.entries(checklistByCategory).map(([category, items]) => (
                                    <div key={category} className="border border-gray-800 rounded-lg p-3 bg-gray-900/40 space-y-3">
                                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider text-red-400 flex items-center gap-2">
                                            <span>•</span> {category}
                                        </h4>
                                        <div className="space-y-2">
                                            {items.map(({ item, originalIndex }) => (
                                                <div key={originalIndex} className="p-2.5 bg-black/40 rounded border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-200">{item.checklistItemDescricao}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button type="button" size="sm" variant={item.situacao === ChecklistStatus.OK ? 'default' : 'outline'}
                                                            onClick={() => handleChecklistStatusChange(originalIndex, ChecklistStatus.OK)}
                                                            className={`h-8 px-2 text-xs font-bold ${item.situacao === ChecklistStatus.OK ? 'bg-green-600 text-white' : 'border-gray-700 text-gray-400'}`}>
                                                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> OK
                                                        </Button>
                                                        <Button type="button" size="sm" variant={item.situacao === ChecklistStatus.NAO_OK ? 'default' : 'outline'}
                                                            onClick={() => handleChecklistStatusChange(originalIndex, ChecklistStatus.NAO_OK)}
                                                            className={`h-8 px-2 text-xs font-bold ${item.situacao === ChecklistStatus.NAO_OK ? 'bg-red-600 text-white' : 'border-gray-700 text-gray-400'}`}>
                                                            <XCircle className="h-3.5 w-3.5 mr-1" /> NÃO OK
                                                        </Button>
                                                        <Button type="button" size="sm" variant={item.situacao === ChecklistStatus.NAO_APLICA ? 'default' : 'outline'}
                                                            onClick={() => handleChecklistStatusChange(originalIndex, ChecklistStatus.NAO_APLICA)}
                                                            className={`h-8 px-2 text-xs font-bold ${item.situacao === ChecklistStatus.NAO_APLICA ? 'bg-gray-600 text-white' : 'border-gray-700 text-gray-400'}`}>
                                                            <MinusCircle className="h-3.5 w-3.5 mr-1" /> N/A
                                                        </Button>
                                                    </div>
                                                    {item.situacao === ChecklistStatus.NAO_OK && (
                                                        <div className="w-full md:w-1/2 flex flex-col gap-1.5 mt-2 md:mt-0">
                                                            <Input value={item.observacao || ''} onChange={e => handleChecklistTextChange(originalIndex, 'observacao', e.target.value)}
                                                                placeholder="Observação da anomalia…" className="bg-seguranca-black border-red-900 text-xs h-8" />
                                                            <Input value={item.reparoRealizado || ''} onChange={e => handleChecklistTextChange(originalIndex, 'reparoRealizado', e.target.value)}
                                                                placeholder="Reparo executado para corrigir…" className="bg-seguranca-black border-green-900 text-xs h-8" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Section>
                )}

                {/* ── Seção 4: Manutenção / Reparos Realizados ────────────────────────── */}
                <Section title="Descrição da Manutenção Realizada" icon={<Wrench className="h-4 w-4 text-blue-400" />}>
                    <Field label="Manutenção / Reparos Executados (Obrigatório para Conclusão)">
                        <Textarea value={formData.maintenancePerformed || ''} onChange={e => setFormData(p => ({ ...p, maintenancePerformed: e.target.value }))}
                            placeholder="Detalhamento técnico dos procedimentos executados pela equipe de manutenção…"
                            className="bg-seguranca-black border-gray-600 min-h-[100px]" />
                    </Field>
                </Section>

                {/* ── Seção: Upload de Evidências e Fotos ────────────────────── */}
                <Section title="Evidências & Anexos da OS" icon={<Camera className="h-4 w-4 text-cyan-400" />}>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-3 p-4 border-2 border-dashed border-gray-700 rounded-lg bg-gray-950/60 hover:border-gray-500 transition-colors">
                            <div className="p-3 bg-gray-900 rounded-full text-cyan-400 shrink-0">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-sm font-medium text-gray-200">Upload de fotos / imagens de evidências</p>
                                <p className="text-xs text-gray-400">Selecione fotos do defeito, peças danificadas ou comprovantes (PNG, JPG, WebP)</p>
                            </div>
                            <label className="cursor-pointer inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold px-4 py-2 rounded-md transition-colors shrink-0">
                                <Camera className="h-4 w-4" /> Selecionar Fotos
                                <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>

                        {/* URL manual opcional */}
                        <div className="flex gap-2">
                            <Input
                                value={newPhotoUrl}
                                onChange={e => setNewPhotoUrl(e.target.value)}
                                placeholder="Ou cole a URL da imagem/evidência..."
                                className="bg-seguranca-black border-gray-600 text-xs flex-1"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddPhotoUrl())}
                            />
                            <Button type="button" size="sm" onClick={handleAddPhotoUrl} disabled={!newPhotoUrl.trim()} className="bg-gray-700 hover:bg-gray-600 text-xs">
                                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar URL
                            </Button>
                        </div>

                        {/* Grid de Previews */}
                        {formData.photoAttachments && formData.photoAttachments.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                {formData.photoAttachments.map((photo, idx) => (
                                    <div key={idx} className="relative group border border-gray-700 rounded-lg overflow-hidden bg-black/60 aspect-video">
                                        <img src={photo} alt={`Evidência ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <a href={photo} target="_blank" rel="noreferrer" title="Visualizar em tamanho real" className="p-1.5 bg-gray-900/80 rounded-full text-white hover:bg-gray-800">
                                                <Image className="h-4 w-4" />
                                            </a>
                                            <button type="button" onClick={() => handleRemovePhoto(idx)} title="Remover foto" className="p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-gray-300">
                                            Foto #{idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Section>

                {/* ── Seção 5: Peças e Serviços ──────────────────────────────── */}
                <Section title="Peças e Serviços Utilizados" icon={<Wrench className="h-4 w-4 text-blue-400" />}
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
                                {(!formData.items?.length) && (<tr><td colSpan={6} className="p-6 text-center text-gray-500 italic text-sm">Nenhum item adicionado. Clique em "+ Item" se houver uso de peças ou mão de obra.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </Section>

                {/* ── Seção 6: Resumo de Custos ──────────────────────────────── */}
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

                {/* ── Seção 7: Responsáveis e Assinaturas ──────────────────────── */}
                <Section title="Responsáveis & Assinaturas" icon={<UserCheck className="h-4 w-4 text-purple-400" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Assinatura / Responsável Técnico">
                            <div className="p-3 border border-gray-800 rounded bg-gray-950 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-300">{formData.responsibleSignature || user?.name || 'Técnico Responsável'}</p>
                                    <p className="text-[10px] text-gray-500">{formData.responsibleSignatureDate ? new Date(formData.responsibleSignatureDate).toLocaleString('pt-BR') : 'Assinatura Eletrônica Autenticada'}</p>
                                </div>
                                <Button type="button" size="sm" variant="outline" onClick={() => setFormData(p => ({ ...p, responsibleSignature: user?.name || 'Usuário Autenticado' }))}
                                    className="border-purple-600 text-purple-400 text-xs">
                                    Assinar
                                </Button>
                            </div>
                        </Field>

                        <Field label="Assinatura / Supervisor">
                            <div className="p-3 border border-gray-800 rounded bg-gray-950 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-300">{formData.supervisorSignature || 'Supervisor da Operação'}</p>
                                    <p className="text-[10px] text-gray-500">{formData.supervisorSignatureDate ? new Date(formData.supervisorSignatureDate).toLocaleString('pt-BR') : 'Assinatura Eletrônica Supervisor'}</p>
                                </div>
                                <Button type="button" size="sm" variant="outline" onClick={() => setFormData(p => ({ ...p, supervisorSignature: user?.name || 'Supervisor' }))}
                                    className="border-purple-600 text-purple-400 text-xs">
                                    Assinar
                                </Button>
                            </div>
                        </Field>
                    </div>
                </Section>

                {/* ── Seção 8: Histórico (somente edição) ──────────────────── */}
                {isEdit && (
                    <Section title="Histórico de Auditoria da OS" icon={<History className="h-4 w-4 text-purple-400" />}
                        action={
                            <Button variant="ghost" size="sm" onClick={() => setShowHistory(v => !v)} className="text-gray-400 hover:text-white">
                                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {showHistory ? 'Ocultar' : 'Mostrar'}
                            </Button>
                        }>
                        {showHistory && (
                            <div className="space-y-3">
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                    {history.length === 0 && <p className="text-sm text-gray-500 italic">Nenhum registro no histórico.</p>}
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
