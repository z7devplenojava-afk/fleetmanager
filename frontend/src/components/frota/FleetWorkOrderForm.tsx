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
    Camera, UploadCloud, Image, Package, ShieldCheck, Tag, FileText, Check, AlertCircle
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
import { stockService } from '@/services/stockService';
import { StockItem } from '@/types/stock';
import { Vehicle } from '@/types/fleet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { FleetWorkOrderViewModal } from '@/components/frota/FleetWorkOrderViewModal';
import { generateFleetWorkOrderPDFBlob } from '@/utils/fleetWorkOrderPDFGenerator';

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

    const [isLoading, setIsLoading]         = useState(false);
    const [newNote, setNewNote]             = useState('');
    const [showHistory, setShowHistory]     = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen]       = useState(false);
    const [pdfPreviewOrder, setPdfPreviewOrder]     = useState<FleetWorkOrder | null>(null);
    const [pdfPreviewBlob, setPdfPreviewBlob]       = useState<Blob | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf]     = useState(false);

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

    // Veículos da frota via React Query
    const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
        queryKey: ['fleet-vehicles-all'],
        queryFn: () => fleetService.getVehicles(),
        staleTime: 60_000,
    });

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

    // Itens do Almoxarifado / Estoque
    const { data: stockItems = [] } = useQuery<StockItem[]>({
        queryKey: ['stock-items-for-work-order'],
        queryFn: () => stockService.getAllItems(),
        staleTime: 30_000,
    });

    // Catálogo de Serviços de Manutenção
    const { data: servicesCatalog = [] } = useQuery<any[]>({
        queryKey: ['fleet-work-order-services-catalog'],
        queryFn: () => fleetWorkOrderService.getServicesCatalog(),
        staleTime: 30_000,
    });

    // Modal de Cadastro Rápido de Novo Serviço
    const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState<number | ''>('');
    const [newServiceDescription, setNewServiceDescription] = useState('');
    const [targetItemIndexForService, setTargetItemIndexForService] = useState<number | null>(null);
    const [isSavingService, setIsSavingService] = useState(false);

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
            const pos = (e.positionDescription || e.position?.name || e.cargo || '').toLowerCase();
            return pos.includes('mecanic') || pos.includes('mecânico') || pos.includes('manuten') || pos.includes('tecnic') || pos.includes('eletric');
        });
        return filtered.length > 0 ? filtered : employees;
    }, [employees]);

    // Opções pesquisáveis com autocomplete
    const vehicleOptions = React.useMemo<SearchableOption[]>(() => {
        return vehicles.map((v: any) => {
            const code = v.fleetNumber || v.patrimonyNumber || v.code || v.codigo || '';
            const plateClean = (v.plate || '').replace(/[^A-Za-z0-9]/g, '');
            return {
                value: v.id,
                label: `${v.plate} — ${v.brand ? `${v.brand} ` : ''}${v.model}`,
                subtitle: [
                    code ? `Cód/Frota: ${code}` : null,
                    v.currentMileage !== undefined && v.currentMileage !== null ? `${v.currentMileage} km` : null,
                    v.garageName ? `Pátio: ${v.garageName}` : null,
                ].filter(Boolean).join(' • '),
                badge: code ? `#${code}` : undefined,
                badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
                keywords: [
                    v.plate,
                    plateClean,
                    code,
                    v.patrimonyNumber,
                    v.fleetNumber,
                    v.model,
                    v.brand,
                ].filter(Boolean) as string[],
            };
        });
    }, [vehicles]);

    const mechanicOptions = React.useMemo<SearchableOption[]>(() => {
        return mechanicsList.map((emp: any) => ({
            value: emp.id,
            label: emp.name,
            subtitle: emp.positionDescription || emp.position?.name || emp.cargo || undefined,
            badge: (emp.positionDescription || emp.position?.name || emp.cargo || '').toLowerCase().includes('mecanic') ? 'Mecânico' : undefined,
            badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
            keywords: [emp.registrationNumber, emp.cpf, emp.positionDescription].filter(Boolean),
        }));
    }, [mechanicsList]);

    const clientOptions = React.useMemo<SearchableOption[]>(() => {
        return clients.map((c: any) => ({
            value: c.id,
            label: c.name,
            subtitle: c.cnpj ? `CNPJ: ${c.cnpj}` : undefined,
            badge: c.cnpj ? c.cnpj : undefined,
            badgeColor: 'bg-blue-950/60 text-blue-300 border-blue-700/50',
            keywords: [c.cnpj, (c.cnpj || '').replace(/\D/g, '')].filter(Boolean),
        }));
    }, [clients]);

    const requesterOptions = React.useMemo<SearchableOption[]>(() => {
        return employees.map((e: any) => ({
            value: e.id,
            label: e.name || e.fullName,
            subtitle: e.positionDescription || e.position?.name || e.cargo || undefined,
            keywords: [e.registrationNumber, e.cpf, e.positionDescription].filter(Boolean),
        }));
    }, [employees]);

    const garageOptions = React.useMemo<SearchableOption[]>(() => {
        return garagesForOS.map((g: Garage) => ({
            value: g.id,
            label: g.name,
            subtitle: g.responsibleName ? `Resp.: ${g.responsibleName}${g.capacity ? ` (${g.capacity} vagas)` : ''}` : (g.capacity ? `${g.capacity} vagas` : undefined),
            badge: g.atCapacity ? 'Lotada' : undefined,
            badgeColor: g.atCapacity ? 'bg-red-950/60 text-red-300 border-red-700/50' : undefined,
            keywords: [g.responsibleName, g.address].filter(Boolean) as string[],
        }));
    }, [garagesForOS]);

    // Opções do Almoxarifado para Peças
    const stockPartOptions = React.useMemo<SearchableOption[]>(() => {
        const manualOpt: SearchableOption = {
            value: '__MANUAL__',
            label: '+ Informar Peça Manualmente (Avulsa / Nova Compra)',
            subtitle: 'Preencher código/part number e descrição livremente',
            badge: 'Avulso',
            badgeColor: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
            keywords: ['manual', 'novo', 'avulsa', 'comprar'],
        };

        const dbOpts: SearchableOption[] = stockItems.map((item: StockItem) => {
            const qty = item.currentQuantity ?? 0;
            const isZero = qty <= 0;
            return {
                value: item.id,
                label: `[${item.code}] ${item.name}`,
                subtitle: `Saldo Almoxarifado: ${qty} un ${item.unitCost ? `| Custo: R$ ${item.unitCost.toFixed(2)}` : ''}`,
                badge: isZero ? 'Sem Estoque' : `${qty} un`,
                badgeColor: isZero ? 'bg-red-950/70 text-red-300 border-red-700/60' : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
                keywords: [item.code, item.barcode, item.category, item.supplier].filter(Boolean) as string[],
            };
        });

        return [manualOpt, ...dbOpts];
    }, [stockItems]);

    // Opções de Serviços do Catálogo
    const serviceCatalogOptions = React.useMemo<SearchableOption[]>(() => {
        const newServiceOpt: SearchableOption = {
            value: '__NEW_SERVICE__',
            label: '+ Cadastrar Novo Serviço de Manutenção',
            subtitle: 'Gera código sequencial automático e salva no catálogo',
            badge: 'Novo',
            badgeColor: 'bg-blue-950/70 text-blue-300 border-blue-700/60',
            keywords: ['novo', 'cadastrar', 'adicionar', 'gerar'],
        };

        const dbOpts: SearchableOption[] = servicesCatalog.map((s: any) => ({
            value: s.id,
            label: `[${s.code || 'SRV'}] ${s.name}`,
            subtitle: `${s.category ? `Cat: ${s.category} | ` : ''}${s.unitPrice ? `Tabela: R$ ${Number(s.unitPrice).toFixed(2)}` : 'Sem valor fixo'}${s.description ? ` - ${s.description}` : ''}`,
            badge: s.code || 'SRV',
            badgeColor: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60',
            keywords: [s.code, s.category, s.description].filter(Boolean) as string[],
        }));

        return [newServiceOpt, ...dbOpts];
    }, [servicesCatalog]);

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

    // Limite de valor para serviço exigir aprovação obrigatória do Gestor (R$ 500,00)
    const HIGH_VALUE_SERVICE_THRESHOLD = 500;

    // Verificar se o usuário atual é Gestor / Encarregado / Admin
    const canApproveServices = React.useMemo(() => {
        if (!user) return false;
        const role = (user.role || '').toUpperCase();
        return (
            role.includes('ADMIN') ||
            role.includes('GESTOR') ||
            role.includes('SUPERVISOR') ||
            role.includes('GERENTE') ||
            role.includes('ENCARREGADO')
        );
    }, [user]);

    // ── Items helpers ──────────────────────────────────────────────────────────
    const handleAddItem = (type: WorkOrderItemType = WorkOrderItemType.PART) => {
        setFormData(p => ({
            ...p,
            items: [
                ...(p.items || []),
                {
                    description: '',
                    type,
                    quantity: 1,
                    unitPrice: 0,
                    totalPrice: 0,
                    code: '',
                    isManual: false,
                    requiresApproval: false,
                    approved: false
                }
            ]
        }));
    };

    const handleRemoveItem = (idx: number) => {
        setFormData(p => {
            const items = (p.items || []).filter((_, i) => i !== idx);
            const partsCost = items.reduce((s, it) => s + it.totalPrice, 0);
            return { ...p, items, partsCost, totalCost: partsCost + (p.laborCost || 0) };
        });
    };

    const handleSelectStockPart = (idx: number, selectedId: string) => {
        if (selectedId === '__MANUAL__') {
            setFormData(p => {
                const items = [...(p.items || [])];
                items[idx] = {
                    ...items[idx],
                    isManual: true,
                    productId: undefined,
                    inStock: undefined,
                };
                return { ...p, items };
            });
            return;
        }

        const found = stockItems.find(s => s.id === selectedId);
        if (!found) return;

        setFormData(p => {
            const items = [...(p.items || [])];
            const currentQty = items[idx]?.quantity || 1;
            const unitPrice = found.unitCost || found.averageCost || 0;
            const totalPrice = currentQty * unitPrice;

            items[idx] = {
                ...items[idx],
                productId: found.id,
                code: found.code,
                description: found.name,
                unitPrice,
                totalPrice,
                inStock: found.currentQuantity ?? 0,
                isManual: false,
            };
            const partsCost = items.reduce((s, it) => s + it.totalPrice, 0);
            return { ...p, items, partsCost, totalCost: partsCost + (p.laborCost || 0) };
        });
    };

    const handlePartCodeChange = (idx: number, newCode: string) => {
        const clean = (newCode || '').trim().toLowerCase();

        // Busca o item no almoxarifado por código ou código de barras
        const found = clean ? stockItems.find(s => {
            const sCode = (s.code || '').trim().toLowerCase();
            const sBarcode = (s.barcode || '').trim().toLowerCase();
            if (sCode === clean || sBarcode === clean) return true;

            // Busca por sufixo numérico (ex: digitou "350" e o código cadastrado é "PEC-350" ou "0350")
            const digits = clean.replace(/\D/g, '');
            if (digits.length >= 2) {
                const sDigits = sCode.replace(/\D/g, '');
                if (sDigits === digits || (sDigits.length >= digits.length && sDigits.endsWith(digits))) {
                    return true;
                }
            }
            return false;
        }) : undefined;

        setFormData(p => {
            const items = [...(p.items || [])];
            const currentItem = items[idx] || {};
            const currentQty = currentItem.quantity || 1;

            if (found) {
                // Item encontrado no Almoxarifado: preenche o nome e custos automaticamente
                const unitPrice = (currentItem.unitPrice && currentItem.unitPrice > 0)
                    ? currentItem.unitPrice
                    : (found.unitCost || found.averageCost || 0);
                const totalPrice = currentQty * unitPrice;

                items[idx] = {
                    ...currentItem,
                    code: newCode,
                    description: found.name || found.fullName || currentItem.description,
                    productId: found.id,
                    inStock: found.currentQuantity ?? 0,
                    unitPrice,
                    totalPrice,
                    isManual: false,
                };
            } else {
                // Não encontrado no Almoxarifado: mantém modo manual
                items[idx] = {
                    ...currentItem,
                    code: newCode,
                    productId: undefined,
                    inStock: undefined,
                    isManual: true,
                };
            }

            const partsCost = items.reduce((s, it) => s + it.totalPrice, 0);
            return { ...p, items, partsCost, totalCost: partsCost + (p.laborCost || 0) };
        });
    };

    const handleSelectServiceFromCatalog = (idx: number, serviceId: string) => {
        if (serviceId === '__NEW_SERVICE__') {
            setTargetItemIndexForService(idx);
            setNewServiceName('');
            setNewServicePrice('');
            setNewServiceDescription('');
            setIsNewServiceModalOpen(true);
            return;
        }

        const found = servicesCatalog.find(s => s.id === serviceId);
        if (!found) return;

        setFormData(p => {
            const items = [...(p.items || [])];
            const currentQty = items[idx]?.quantity || 1;
            const unitPrice = Number(found.unitPrice) || 0;
            const totalPrice = currentQty * unitPrice;
            const requiresApproval = totalPrice >= HIGH_VALUE_SERVICE_THRESHOLD;

            items[idx] = {
                ...items[idx],
                code: found.code || 'SRV',
                description: found.name,
                unitPrice,
                totalPrice,
                type: WorkOrderItemType.LABOR,
                requiresApproval,
                approvalReason: items[idx]?.approvalReason || '',
                isManual: false,
            };
            const partsCost = items.reduce((s, it) => s + it.totalPrice, 0);
            return { ...p, items, partsCost, totalCost: partsCost + (p.laborCost || 0) };
        });
    };

    const handleQuickServiceSave = async () => {
        if (!newServiceName.trim()) {
            toast({ title: 'Aviso', description: 'Informe o nome do serviço.', variant: 'destructive' });
            return;
        }

        try {
            setIsSavingService(true);
            const created = await fleetWorkOrderService.createQuickService({
                name: newServiceName.trim(),
                description: newServiceDescription.trim() || undefined,
                unitPrice: typeof newServicePrice === 'number' ? newServicePrice : undefined,
                category: 'MANUTENCAO'
            });

            toast({
                title: 'Serviço Cadastrado!',
                description: `Serviço cadastrado com código ${created.code}. Adicionado à OS.`,
            });

            queryClient.invalidateQueries({ queryKey: ['fleet-work-order-services-catalog'] });
            setIsNewServiceModalOpen(false);

            if (targetItemIndexForService !== null) {
                const idx = targetItemIndexForService;
                setFormData(p => {
                    const items = [...(p.items || [])];
                    const currentQty = items[idx]?.quantity || 1;
                    const unitPrice = Number(created.unitPrice) || 0;
                    const totalPrice = currentQty * unitPrice;
                    const requiresApproval = totalPrice >= HIGH_VALUE_SERVICE_THRESHOLD;

                    items[idx] = {
                        ...items[idx],
                        code: created.code,
                        description: created.name,
                        unitPrice,
                        totalPrice,
                        type: WorkOrderItemType.LABOR,
                        requiresApproval,
                        approvalReason: '',
                        isManual: false,
                    };
                    const partsCost = items.reduce((s, it) => s + it.totalPrice, 0);
                    return { ...p, items, partsCost, totalCost: partsCost + (p.laborCost || 0) };
                });
            }
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.response?.data?.message || 'Falha ao cadastrar serviço.',
                variant: 'destructive',
            });
        } finally {
            setIsSavingService(false);
            setTargetItemIndexForService(null);
        }
    };

    const handleItemChange = (idx: number, field: keyof WorkOrderItem, value: any) => {
        setFormData(p => {
            const items = [...(p.items || [])];
            const item  = { ...items[idx], [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                item.quantity   = field === 'quantity'   ? parseFloat(value) || 0 : item.quantity;
                item.unitPrice  = field === 'unitPrice'  ? parseFloat(value) || 0 : item.unitPrice;
                item.totalPrice = item.quantity * item.unitPrice;

                // Se for serviço e o valor for alto, marca como exigindo aprovação
                if (item.type === WorkOrderItemType.LABOR && item.totalPrice >= HIGH_VALUE_SERVICE_THRESHOLD) {
                    item.requiresApproval = true;
                }
            }
            if (field === 'type' && value === WorkOrderItemType.LABOR && item.totalPrice >= HIGH_VALUE_SERVICE_THRESHOLD) {
                item.requiresApproval = true;
            }
            items[idx] = item;
            const partsCost = items.reduce((s, it) => s + it.totalPrice, 0);
            return { ...p, items, partsCost, totalCost: partsCost + (p.laborCost || 0) };
        });
    };

    const handleToggleApproveItem = (idx: number) => {
        setFormData(p => {
            const items = [...(p.items || [])];
            const item = items[idx];
            const isCurrentlyApproved = !!item.approved;

            items[idx] = {
                ...item,
                approved: !isCurrentlyApproved,
                approvedBy: !isCurrentlyApproved ? (user?.name || 'Gestor de Manutenção') : undefined,
                approvedAt: !isCurrentlyApproved ? new Date().toISOString() : undefined,
            };
            return { ...p, items };
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

        // Validação de serviços que requerem aprovação
        const pendingReasonItem = (formData.items || []).find(
            it => it.type === WorkOrderItemType.LABOR && it.requiresApproval && !it.approvalReason?.trim()
        );
        if (pendingReasonItem) {
            toast({
                title: 'Motivo Obrigatório',
                description: `O serviço "${pendingReasonItem.description || pendingReasonItem.code || 'selecionado'}" possui valor elevado e requer a justificativa/motivo da contratação para o Gestor de Manutenção.`,
                variant: 'destructive'
            });
            return;
        }

        const effectiveId = order?.id || formData.id;
        setIsLoading(true);
        try {
            const payload: Partial<FleetWorkOrder> = {
                ...formData,
                status: submitStatus || formData.status || WorkOrderStatus.OPEN,
                items: (formData.items || []).map(it => ({ ...it, type: it.type ?? WorkOrderItemType.PART })),
            };
            if (effectiveId) {
                await fleetWorkOrderService.update(effectiveId, payload);
            } else {
                const created = await fleetWorkOrderService.create(payload);
                setFormData(p => ({ ...p, id: created.id, osNumber: created.osNumber }));
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

    // ── Gerar e Visualizar a OS em PDF ──────────────────────────────────────────
    const handleGenerateAndPreviewOS = async () => {
        if (!formData.vehicleId) {
            toast({
                title: 'Veículo Obrigatório',
                description: 'Selecione um equipamento/veículo antes de gerar a Ordem de Serviço.',
                variant: 'destructive'
            });
            return;
        }

        if (formData.maintenanceType === MaintenanceType.CORRETIVA && !formData.anomaliesDescription?.trim()) {
            toast({
                title: 'Descrição Obrigatória',
                description: 'A descrição de anomalias é obrigatória para OS Corretiva.',
                variant: 'destructive'
            });
            return;
        }

        // Validação de serviços que requerem aprovação
        const pendingReasonItem = (formData.items || []).find(
            it => it.type === WorkOrderItemType.LABOR && it.requiresApproval && !it.approvalReason?.trim()
        );
        if (pendingReasonItem) {
            toast({
                title: 'Motivo Obrigatório',
                description: `O serviço "${pendingReasonItem.description || pendingReasonItem.code || 'selecionado'}" possui valor elevado e requer a justificativa/motivo da contratação para o Gestor de Manutenção.`,
                variant: 'destructive'
            });
            return;
        }

        setIsGeneratingPdf(true);
        try {
            const payload: Partial<FleetWorkOrder> = {
                ...formData,
                status: formData.status || WorkOrderStatus.OPEN,
                items: (formData.items || []).map(it => ({ ...it, type: it.type ?? WorkOrderItemType.PART })),
            };

            const effectiveId = order?.id || formData.id;
            let savedOrder: FleetWorkOrder;

            if (effectiveId) {
                savedOrder = await fleetWorkOrderService.update(effectiveId, payload);
            } else {
                savedOrder = await fleetWorkOrderService.create(payload);
                setFormData(p => ({
                    ...p,
                    id: savedOrder.id,
                    osNumber: savedOrder.osNumber || p.osNumber
                }));
            }

            // Atualiza tabela de ordens de serviço
            onSuccess();

            // Gera e carrega o Blob do PDF para visualização imediata
            const blob = await generateFleetWorkOrderPDFBlob(savedOrder);
            setPdfPreviewBlob(blob);
            setPdfPreviewOrder(savedOrder);
            setIsPdfModalOpen(true);
            toast({
                title: 'OS Gerada com Sucesso!',
                description: `Ordem de Serviço #${savedOrder.osNumber || savedOrder.id.slice(0, 8)} pronta para visualização e impressão.`
            });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Falha ao salvar e gerar documento PDF da OS.';
            toast({ title: 'Erro ao gerar OS', description: msg, variant: 'destructive' });
        } finally {
            setIsGeneratingPdf(false);
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
        <div className="flex w-full justify-between items-center gap-3 flex-wrap">
            <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">Cancelar</Button>
            <div className="flex gap-2 flex-wrap justify-end items-center">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateAndPreviewOS}
                    disabled={isLoading || isGeneratingPdf}
                    className="border-red-500/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold"
                >
                    <FileText className="mr-2 h-4 w-4 text-red-400" />
                    {isGeneratingPdf ? 'Gerando OS...' : 'Gerar e Visualizar OS'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSubmit(WorkOrderStatus.OPEN)}
                    disabled={isLoading || isGeneratingPdf}
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                >
                    <Clock className="mr-2 h-4 w-4" /> Salvar Rascunho / Aberta
                </Button>
                <Button
                    type="button"
                    onClick={() => handleSubmit(WorkOrderStatus.IN_PROGRESS)}
                    disabled={isLoading || isGeneratingPdf}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                    <Wrench className="mr-2 h-4 w-4" /> Em Andamento
                </Button>
                <Button
                    type="button"
                    onClick={() => handleSubmit(WorkOrderStatus.COMPLETED)}
                    disabled={isLoading || isGeneratingPdf}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
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

    const currentOsNumber = order?.osNumber || formData.osNumber || (order?.id ? order.id.slice(0, 8) : formData.id ? formData.id.slice(0, 8) : null);

    return (
        <ResponsiveDrawer isOpen={isOpen} onClose={onClose}
            title={currentOsNumber ? `OS #${currentOsNumber} — ${isEdit ? 'Editar' : 'Ordem de Serviço'}` : 'Nova Ordem de Serviço'}
            description="Cadastre manutenções corretivas e preventivas com controle completo de checklist e execução."
            footer={footer}
            className="sm:max-w-4xl bg-[#0a0a0b] border-gray-800/50 z-[10050]">
            <div className="space-y-6 py-2 pb-10">

                {/* ── Barra Superior de Ações Rápidas ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-seguranca-black/90 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Badge className={`${currentOsNumber ? 'bg-red-600' : 'bg-gray-700'} text-white font-mono text-xs px-2.5 py-1`}>
                            {currentOsNumber ? `OS #${currentOsNumber}` : 'NOVA OS'}
                        </Badge>
                        {formData.status && (
                            <Badge className="bg-gray-800 text-gray-300 border border-gray-700 text-xs">
                                Status: {formData.status}
                            </Badge>
                        )}
                        {formData.vehicleId && (
                            <span className="text-xs text-gray-400 hidden sm:inline">
                                Veículo selecionado
                            </span>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAndPreviewOS}
                        disabled={isLoading || isGeneratingPdf}
                        className="border-red-500/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs shadow-sm transition-all"
                    >
                        <FileText className="mr-1.5 h-3.5 w-3.5 text-red-400" />
                        {isGeneratingPdf ? 'Gerando OS...' : 'Gerar e Visualizar OS'}
                    </Button>
                </div>

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
                            <SearchableSelect
                                value={formData.vehicleId || ''}
                                onChange={(v) => {
                                    const selectedVeh = vehicles.find(veh => veh.id === v);
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
                                options={vehicleOptions}
                                placeholder="Selecione ou busque por placa ou código..."
                                searchPlaceholder="Digite os 3 primeiros caracteres da placa ou código..."
                                minSearchLength={3}
                                minSearchHint="Digite os 3 primeiros caracteres da placa ou código para exibir os veículos..."
                                emptyText={isLoadingVehicles ? "Carregando veículos da frota..." : "Nenhum veículo encontrado."}
                            />
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
                            <SearchableSelect
                                value={formData.mechanicId || ''}
                                onChange={(v, opt) => {
                                    setFormData(p => ({
                                        ...p,
                                        mechanicId: v,
                                        mechanicName: opt ? opt.label : p.mechanicName
                                    }));
                                }}
                                options={mechanicOptions}
                                placeholder={formData.mechanicName || "Selecione o mecânico..."}
                                searchPlaceholder="Digite o nome do mecânico (ex: 3 caracteres)..."
                                minSearchLength={3}
                                minSearchHint="Digite os 3 primeiros caracteres para buscar o mecânico..."
                                emptyText="Nenhum mecânico encontrado."
                            />
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
                            <SearchableSelect
                                value={formData.clientId || ''}
                                onChange={(v) => {
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
                                options={clientOptions}
                                placeholder="Selecione o cliente…"
                                searchPlaceholder="Buscar cliente por nome ou CNPJ..."
                                emptyText="Nenhum cliente encontrado."
                            />
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
                            <SearchableSelect
                                value={formData.requesterId || ''}
                                onChange={(v) => setFormData(p => ({ ...p, requesterId: v }))}
                                options={requesterOptions}
                                placeholder="Selecione o requerente…"
                                searchPlaceholder="Buscar requerente por nome..."
                                emptyText="Nenhum colaborador encontrado."
                            />
                        </Field>
                        <Field label="Garagem (onde o serviço será executado) *">
                            <SearchableSelect
                                value={formData.garageId || ''}
                                onChange={(v, opt) => {
                                    setFormData(p => ({ ...p, garageId: v, garageName: opt ? opt.label : p.garageName }));
                                }}
                                options={garageOptions}
                                placeholder="Selecione a garagem…"
                                searchPlaceholder="Buscar garagem por nome..."
                                emptyText="Nenhuma garagem encontrada."
                            />
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
                <Section
                    title="Peças e Serviços Utilizados"
                    icon={<Wrench className="h-4 w-4 text-blue-400" />}
                    action={
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddItem(WorkOrderItemType.PART)}
                                className="border-emerald-600/60 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8"
                            >
                                <Package className="h-3.5 w-3.5 mr-1" />+ Peça (Almoxarifado / Avulsa)
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddItem(WorkOrderItemType.LABOR)}
                                className="border-blue-600/60 text-blue-400 hover:bg-blue-500/10 text-xs h-8"
                            >
                                <Wrench className="h-3.5 w-3.5 mr-1" />+ Serviço (Oficina)
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-3">
                        <div className="text-xs text-gray-400 bg-gray-900/50 p-2.5 rounded border border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                                <span>Peças integradas ao Almoxarifado central com controle de saldo real</span>
                            </div>
                            <div className="flex items-center gap-2 text-amber-400/90">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Serviços com valor ≥ R$ 500,00 exigem justificativa e aprovação do Gestor</span>
                            </div>
                        </div>

                        {(!formData.items?.length) ? (
                            <div className="p-8 text-center border border-dashed border-gray-800 rounded-lg bg-gray-950/40">
                                <Package className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                                <p className="text-gray-400 text-sm font-medium">Nenhum item adicionado à Ordem de Serviço</p>
                                <p className="text-gray-600 text-xs mt-1">
                                    Adicione peças do Almoxarifado para requisição de compra ou serviços mecânicos contratados.
                                </p>
                                <div className="mt-3 flex justify-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddItem(WorkOrderItemType.PART)}
                                        className="border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 text-xs"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />Adicionar Peça
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddItem(WorkOrderItemType.LABOR)}
                                        className="border-blue-600 text-blue-400 hover:bg-blue-500/10 text-xs"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />Adicionar Serviço
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formData.items.map((item, idx) => {
                                    const isPart = (item.type || WorkOrderItemType.PART) === WorkOrderItemType.PART;
                                    const isHighValueService = !isPart && (item.totalPrice >= HIGH_VALUE_SERVICE_THRESHOLD || item.requiresApproval);

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3.5 rounded-lg border transition-all ${
                                                isHighValueService
                                                    ? 'bg-amber-950/20 border-amber-800/60'
                                                    : 'bg-seguranca-black/40 border-gray-800 hover:border-gray-700'
                                            }`}
                                        >
                                            {/* Cabeçalho do item */}
                                            <div className="flex items-center justify-between gap-3 mb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                                                        isPart
                                                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                                                            : 'bg-blue-950/70 text-blue-400 border border-blue-800/50'
                                                    }`}>
                                                        {isPart ? <Package className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                                                        {isPart ? 'PEÇA / ITEM' : 'SERVIÇO'}
                                                    </span>

                                                    {item.code && (
                                                        <span className="font-mono text-xs px-2 py-0.5 bg-gray-900 text-gray-300 rounded border border-gray-700">
                                                            Cód: <strong className="text-white">{item.code}</strong>
                                                        </span>
                                                    )}

                                                    {isPart && typeof item.inStock === 'number' && (
                                                        <span className={`text-[11px] px-2 py-0.5 rounded border ${
                                                            item.inStock > 0
                                                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                                                                : 'bg-red-950/40 text-red-400 border-red-800/40'
                                                        }`}>
                                                            📦 Almoxarifado: {item.inStock} un {item.inStock <= 0 ? '(Falta em Estoque)' : ''}
                                                        </span>
                                                    )}

                                                    {isHighValueService && (
                                                        <Badge variant="outline" className={`text-[10px] uppercase font-bold flex items-center gap-1 ${
                                                            item.approved
                                                                ? 'bg-emerald-950 text-emerald-400 border-emerald-600'
                                                                : 'bg-amber-950 text-amber-300 border-amber-600'
                                                        }`}>
                                                            {item.approved ? (
                                                                <>
                                                                    <ShieldCheck className="h-3 w-3" />
                                                                    Aprovado pelo Gestor
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                    Requer Aprovação do Gestor (≥ R$ 500)
                                                                </>
                                                            )}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Botão de aprovação direta para o Gestor / Encarregado */}
                                                    {isHighValueService && canApproveServices && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleToggleApproveItem(idx)}
                                                            className={`h-7 text-xs px-2.5 ${
                                                                item.approved
                                                                    ? 'border-emerald-600 bg-emerald-950/40 text-emerald-300 hover:bg-red-950/40 hover:text-red-300'
                                                                    : 'border-amber-600 bg-amber-950/40 text-amber-300 hover:bg-emerald-950/60 hover:text-emerald-200'
                                                            }`}
                                                            title={item.approved ? 'Clique para desmarcar aprovação' : 'Aprovar execução deste serviço'}
                                                        >
                                                            {item.approved ? (
                                                                <>
                                                                    <Check className="h-3.5 w-3.5 mr-1" />
                                                                    Aprovado ({item.approvedBy || user?.name})
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                                                    Aprovar Execução
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                                                        title="Remover Item"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Campos do item */}
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                {/* Tipo (Peça ou Serviço) */}
                                                <div className="md:col-span-2">
                                                    <Label className="text-[11px] text-gray-400">Tipo de Item</Label>
                                                    <Select
                                                        value={item.type || WorkOrderItemType.PART}
                                                        onValueChange={v => handleItemChange(idx, 'type', v)}
                                                    >
                                                        <SelectTrigger className="bg-gray-950 border-gray-700 h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-seguranca-black border-gray-600 text-xs z-[10060]">
                                                            <SelectItem value={WorkOrderItemType.PART}>Peça / Material</SelectItem>
                                                            <SelectItem value={WorkOrderItemType.LABOR}>Serviço Oficina</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Seleção do Banco ou Manual */}
                                                <div className="md:col-span-5">
                                                    {isPart ? (
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <Label className="text-[11px] text-gray-400">
                                                                    Buscar no Almoxarifado ou Manual
                                                                </Label>
                                                                {item.isManual && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSelectStockPart(idx, stockItems[0]?.id || '')}
                                                                        className="text-[10px] text-emerald-400 hover:underline"
                                                                    >
                                                                        Voltar ao Almoxarifado
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {item.isManual ? (
                                                                <div>
                                                                    <div className="flex gap-2">
                                                                        <Input
                                                                            value={item.code || ''}
                                                                            onChange={e => handlePartCodeChange(idx, e.target.value)}
                                                                            list={`stock-codes-list-${idx}`}
                                                                            placeholder="Part Nº / Cód. Peça"
                                                                            className={`w-1/3 bg-gray-950 text-xs h-9 transition-colors ${
                                                                                item.productId ? 'border-emerald-600/70 focus:border-emerald-500' : 'border-amber-600/50'
                                                                            }`}
                                                                        />
                                                                        <datalist id={`stock-codes-list-${idx}`}>
                                                                            {stockItems.slice(0, 300).map(s => (
                                                                                <option key={s.id} value={s.code}>
                                                                                    {s.code} - {s.name} (Saldo: {s.currentQuantity ?? 0} un)
                                                                                </option>
                                                                            ))}
                                                                        </datalist>
                                                                        <Input
                                                                            value={item.description || ''}
                                                                            onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                                                            placeholder={item.productId ? "Nome da peça no almoxarifado" : "Nome / Descrição da peça avulsa..."}
                                                                            className={`w-2/3 bg-gray-950 text-xs h-9 transition-colors ${
                                                                                item.productId ? 'border-emerald-600/70 focus:border-emerald-500 text-emerald-200' : 'border-amber-600/50'
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                    {item.productId ? (
                                                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400">
                                                                            <Check className="h-3 w-3 inline flex-shrink-0" />
                                                                            <span>Almoxarifado vinculado: Estoque atual: <strong>{item.inStock ?? 0} un</strong></span>
                                                                        </div>
                                                                    ) : item.code ? (
                                                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-amber-400/90">
                                                                            <AlertCircle className="h-3 w-3 inline flex-shrink-0" />
                                                                            <span>Item manual / avulso (código não encontrado no almoxarifado)</span>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            ) : (
                                                                <SearchableSelect
                                                                    value={item.productId || ''}
                                                                    onChange={(v) => handleSelectStockPart(idx, v)}
                                                                    options={stockPartOptions}
                                                                    placeholder="Buscar peça por código ou nome no Almoxarifado..."
                                                                    searchPlaceholder="Código, nome, código de barras..."
                                                                    emptyText="Nenhuma peça encontrada no Almoxarifado."
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <Label className="text-[11px] text-gray-400">
                                                                    Catálogo de Serviços da Oficina
                                                                </Label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setTargetItemIndexForService(idx);
                                                                        setNewServiceName(item.description || '');
                                                                        setNewServicePrice(item.unitPrice || '');
                                                                        setNewServiceDescription('');
                                                                        setIsNewServiceModalOpen(true);
                                                                    }}
                                                                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                                                                >
                                                                    <Plus className="h-2.5 w-2.5" />Novo Serviço
                                                                </button>
                                                            </div>
                                                            <SearchableSelect
                                                                value={servicesCatalog.find(s => s.name === item.description || s.code === item.code)?.id || ''}
                                                                onChange={(v) => handleSelectServiceFromCatalog(idx, v)}
                                                                options={serviceCatalogOptions}
                                                                placeholder="Buscar serviço por código (SRV-xxxx) ou nome..."
                                                                searchPlaceholder="Cód (ex: SRV-0001), descrição, categoria..."
                                                                emptyText="Nenhum serviço encontrado no catálogo."
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Quantidade */}
                                                <div className="md:col-span-1">
                                                    <Label className="text-[11px] text-gray-400">Qtd</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={item.quantity}
                                                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                                        className="bg-gray-950 border-gray-700 text-center text-xs h-9"
                                                    />
                                                </div>

                                                {/* Preço Unitário */}
                                                <div className="md:col-span-2">
                                                    <Label className="text-[11px] text-gray-400">Valor Unitário (R$)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                                                        className="bg-gray-950 border-gray-700 text-right text-xs h-9"
                                                    />
                                                </div>

                                                {/* Total */}
                                                <div className="md:col-span-2 text-right">
                                                    <Label className="text-[11px] text-gray-400 block">Total do Item</Label>
                                                    <div className="h-9 flex items-center justify-end px-3 rounded bg-gray-900 border border-gray-800 font-mono text-xs font-bold text-gray-200">
                                                        {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Justificativa / Motivo de Contratação para Serviços de Alto Valor */}
                                            {isHighValueService && (
                                                <div className="mt-3 pt-3 border-t border-amber-900/40 bg-amber-950/30 p-2.5 rounded">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                                                            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                                                            Motivo / Justificativa da Execução do Serviço *
                                                        </Label>
                                                        <span className="text-[10px] text-amber-400/80">
                                                            Obrigatório para o Encarregado / Gestor de Manutenção aprovar
                                                        </span>
                                                    </div>
                                                    <Input
                                                        value={item.approvalReason || ''}
                                                        onChange={e => handleItemChange(idx, 'approvalReason', e.target.value)}
                                                        placeholder="Ex: Retífica urgente do cabeçote devido a superaquecimento com risco de parada prolongada da frota..."
                                                        className="bg-gray-950 border-amber-700/60 text-xs text-amber-100 placeholder:text-gray-500 h-8"
                                                    />
                                                    {item.approved && item.approvedBy && (
                                                        <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                                                            <Check className="h-3 w-3" />
                                                            Aprovado por: <strong>{item.approvedBy}</strong> {item.approvedAt ? `em ${new Date(item.approvedAt).toLocaleString('pt-BR')}` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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

            {/* Modal de Cadastro Rápido de Serviço */}
            {isNewServiceModalOpen && (
                <div className="fixed inset-0 z-[10070] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-seguranca-black border border-gray-700 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-blue-400" />
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Cadastrar Novo Serviço de Oficina
                                </h4>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsNewServiceModalOpen(false)}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>

                        <p className="text-xs text-gray-400">
                            O sistema gerará automaticamente o próximo código sequencial (ex: <code>SRV-0015</code>) para que o Almoxarifado e a Manutenção padronizem a contratação.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs text-gray-300">Nome do Serviço *</Label>
                                <Input
                                    value={newServiceName}
                                    onChange={e => setNewServiceName(e.target.value)}
                                    placeholder="Ex: Alinhamento e Balanceamento a Laser"
                                    className="bg-gray-950 border-gray-700 mt-1 text-sm"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <Label className="text-xs text-gray-300">Valor Padrão Estimado (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={newServicePrice}
                                    onChange={e => setNewServicePrice(e.target.value ? parseFloat(e.target.value) : '')}
                                    placeholder="0,00"
                                    className="bg-gray-950 border-gray-700 mt-1 text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-xs text-gray-300">Descrição / Escopo Técnico</Label>
                                <Textarea
                                    value={newServiceDescription}
                                    onChange={e => setNewServiceDescription(e.target.value)}
                                    placeholder="Detalhes sobre a execução do serviço..."
                                    rows={3}
                                    className="bg-gray-950 border-gray-700 mt-1 text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsNewServiceModalOpen(false)}
                                className="text-gray-400 text-xs"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleQuickServiceSave}
                                disabled={isSavingService || !newServiceName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                            >
                                {isSavingService ? 'Salvando...' : 'Cadastrar e Inserir na OS'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Pré-visualização e Impressão da OS em PDF */}
            <FleetWorkOrderViewModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                order={pdfPreviewOrder}
                pdfBlob={pdfPreviewBlob}
            />
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
