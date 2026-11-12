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
    Camera, UploadCloud, Image as LucideImage, Package, ShieldCheck, Tag, FileText, Check, AlertCircle,
    Timer, Edit, PlayCircle, StopCircle, RefreshCw, Zap, Sparkles, Car, PenLine, Eraser, User, Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import fleetWorkOrderService, {
    WorkOrderStatus, LaborType, WorkOrderItemType, WorkOrderPriority, MaintenanceType, ChecklistStatus,
    WorkOrderItem, FleetWorkOrder, FleetWorkOrderChecklist, WorkOrderHistoryEntry, ExecutionHistoryEntry,
    getOrderResponsibleDisplay
} from '@/services/fleetWorkOrderService';
import { COMPONENT_CONTROLS_META } from '@/services/fleetComponentControlService';
import fleetService from '@/services/fleetService';
import { clientService } from '@/services/clientService';
import { departmentService } from '@/services/departmentService';
import { employeeService } from '@/services/employeeService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { garageService, Garage } from '@/services/garageService';
import { stockService } from '@/services/stockService';
import { materialRequisitionService } from '@/services/materialRequisitionService';
import { StockItem } from '@/types/stock';
import { Vehicle } from '@/types/fleet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { FleetWorkOrderViewModal } from '@/components/frota/FleetWorkOrderViewModal';
import SignaturePad from '@/components/SignaturePad';
import { generateFleetWorkOrderPDFBlob } from '@/utils/fleetWorkOrderPDFGenerator';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (savedOrder?: FleetWorkOrder) => void;
    order?: FleetWorkOrder;
    initialVehicleId?: string;
    initialValues?: Partial<FleetWorkOrder>;
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

const QUICK_SYMPTOMS = [
    'Barulho no freio / lonas',
    'Vazamento de ar pneumático',
    'Superaquecimento do motor',
    'Luz de alerta / falha no painel',
    'Embreagem patinando ou dura',
    'Folga na suspensão / direção',
    'Pneu furado ou danificado',
    'Falha elétrica / partida / bateria',
    'Ar-condicionado não gela',
    'Troca de óleo e filtros',
    'Revisão periódica programada',
    'Vazamento de fluidos ou óleo',
    'Limpador / farol queimado'
];

const FleetWorkOrderForm: React.FC<Props> = ({ isOpen, onClose, onSuccess, order, initialVehicleId, initialValues }) => {
    const { toast }       = useToast();
    const { user }        = useAuth();
    const queryClient     = useQueryClient();
    const isEdit          = !!order?.id;
    const isDriverUser    = user?.role === 'MOTORISTA' || Boolean((user as any)?.roles?.some((r: any) => typeof r === 'string' ? r.includes('MOTORISTA') : r?.name?.includes('MOTORISTA')));

    // Aba padrão: Motorista usa sempre modo simplificado; oficina/gestor inicia no Formulário Completo
    const [isExpressMode, setIsExpressMode] = useState(isDriverUser);
    const effectiveExpressMode = isDriverUser || isExpressMode;

    const [isLoading, setIsLoading]         = useState(false);
    const [newNote, setNewNote]             = useState('');
    const [showResignResp, setShowResignResp] = useState(false);
    const [showResignSup, setShowResignSup]   = useState(false);
    const [showResignRel, setShowResignRel]   = useState(false);
    const [showHistory, setShowHistory]     = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen]       = useState(false);
    const [pdfPreviewOrder, setPdfPreviewOrder]     = useState<FleetWorkOrder | null>(null);
    const [pdfPreviewBlob, setPdfPreviewBlob]       = useState<Blob | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf]     = useState(false);
    const [isBlankPdfMode, setIsBlankPdfMode]       = useState(false);

    const [formData, setFormData] = useState<Partial<FleetWorkOrder>>({
        vehicleId: '',
        maintenanceType: MaintenanceType.CORRETIVA,
        status: WorkOrderStatus.OPEN,
        priority: WorkOrderPriority.MEDIUM,
        laborType: LaborType.INTERNAL,
        stopDate: new Date().toISOString().split('T')[0],
        stopTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        executionStartDate: undefined,
        executionEndDate: undefined,
        executionStartJustification: undefined,
        laborCost: 0, partsCost: 0, totalCost: 0,
        odometerIn: undefined, odometerOut: undefined,
        stopReason: '', mechanicName: '', notes: '', items: [], checklistItems: [],
        anomaliesDescription: '', otherDescription: '', maintenancePerformed: '',
        driverName: '', requestDate: new Date().toISOString().split('T')[0],
        servicesVerified: undefined, releaseDate: '', releaseTime: '', releasedByName: '', releaseSignature: '',
        preventiveControlTypes: [], oilFilterChanged: false, dieselFilterChanged: false,
        waterSeparatorFilterChanged: false, airFilterChanged: false,
        preventiveModel: 'MODELO_2',
        operationProfile: 'URBANO',
        autoGenerated: false,
        triggeredItemsSummary: ''
    });

    const inferVehicleOperationProfile = (veh?: any): 'URBANO' | 'RODOVIARIO' => {
        if (!veh) return 'URBANO';
        const busType = String(veh.busType || '').toUpperCase();
        const vType = String(veh.vehicleType || '').toUpperCase();
        if (['RODOVIARIO', 'LUXO_TURISMO', 'DOUBLE_DECKER', 'FRETADO', 'INTERMUNICIPAL', 'VIP'].includes(busType)
            || ['BUS_ROAD', 'BUS_LUXURY_TOURISM', 'BUS_INTERCITY'].includes(vType)) {
            return 'RODOVIARIO';
        }
        const joined = [veh.operationName, veh.projectName, veh.department, veh.model].filter(Boolean).join(' ').toUpperCase();
        if (joined.includes('RODOV') || joined.includes('TURISM') || joined.includes('VIAGEM') || joined.includes('DOUBLE') || joined.includes('FRETAM')) {
            return 'RODOVIARIO';
        }
        return 'URBANO';
    };

    // Estado do controle de execução do serviço
    const [showCorrectionModal, setShowCorrectionModal] = useState(false);
    const [correctionJustification, setCorrectionJustification] = useState('');
    const [correctionNewDate, setCorrectionNewDate]     = useState('');
    const [correctionNewTime, setCorrectionNewTime]     = useState('');
    const [isSavingCorrection, setIsSavingCorrection]   = useState(false);
    const [executionHistoryEntries, setExecutionHistoryEntries] = useState<ExecutionHistoryEntry[]>([]);
    const [showExecutionHistory, setShowExecutionHistory] = useState(false);
    const [isLoadingExecHistory, setIsLoadingExecHistory] = useState(false);

    // Duração calculada em tempo real (front-end preview)
    const calculatedDuration = React.useMemo(() => {
        const start = formData.executionStartDate;
        const end   = formData.executionEndDate;
        if (!start) return null;
        try {
            const startDate = new Date(start);
            const endDate = end ? new Date(end) : new Date();
            const diff = endDate.getTime() - startDate.getTime();
            if (isNaN(diff) || diff < 0) return null;
            const totalMin = Math.floor(diff / 60000);
            const d = Math.floor(totalMin / 1440);
            const h = Math.floor((totalMin % 1440) / 60);
            const m = totalMin % 60;
            return { days: d, hours: h, minutes: m, totalMinutes: totalMin, isRunning: !end };
        } catch { return null; }
    }, [formData.executionStartDate, formData.executionEndDate]);

    const formatDurationString = (dur: { days: number; hours: number; minutes: number; totalMinutes?: number } | null) => {
        if (!dur) return '—';
        if (dur.days === 0 && dur.hours === 0 && dur.minutes === 0) return 'Menos de 1 minuto';
        const parts: string[] = [];
        if (dur.days > 0) parts.push(`${dur.days} ${dur.days === 1 ? 'dia' : 'dias'}`);
        if (dur.hours > 0) parts.push(`${dur.hours} ${dur.hours === 1 ? 'hora' : 'horas'}`);
        if (dur.minutes > 0 || parts.length === 0) parts.push(`${dur.minutes} ${dur.minutes === 1 ? 'minuto' : 'minutos'}`);
        return parts.join(', ');
    };

    const handleOpenCorrectionModal = () => {
        if (formData.executionStartDate) {
            setCorrectionNewDate(formData.executionStartDate.substring(0, 10));
            setCorrectionNewTime(formData.executionStartDate.substring(11, 16));
        } else {
            setCorrectionNewDate(new Date().toISOString().substring(0, 10));
            setCorrectionNewTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
        setCorrectionJustification('');
        setShowCorrectionModal(true);
    };

    const handleSaveCorrection = async () => {
        if (!correctionNewDate || !correctionNewTime) {
            toast({ title: 'Atenção', description: 'Informe a nova data e horário de início.', variant: 'destructive' });
            return;
        }
        if (!correctionJustification.trim()) {
            toast({ title: 'Justificativa Obrigatória', description: 'Por favor, informe a justificativa para a correção do início da execução.', variant: 'destructive' });
            return;
        }
        const newStartIso = `${correctionNewDate}T${correctionNewTime}:00`;

        if (order?.id) {
            setIsSavingCorrection(true);
            try {
                const updated = await fleetWorkOrderService.correctExecutionStart(
                    order.id,
                    newStartIso,
                    correctionJustification.trim(),
                    user?.name || user?.username || 'Usuário'
                );
                setFormData(p => ({
                    ...p,
                    executionStartDate: updated.executionStartDate,
                    executionDurationMinutes: updated.executionDurationMinutes,
                    executionStartJustification: updated.executionStartJustification,
                }));
                toast({ title: 'Início Atualizado', description: 'A data/hora de início foi corrigida e registrada no histórico com sucesso.' });
                setShowCorrectionModal(false);
                queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
            } catch (err: any) {
                const msg = err?.response?.data?.error || err?.response?.data?.message || 'Falha ao salvar correção do início.';
                toast({ title: 'Erro', description: msg, variant: 'destructive' });
            } finally {
                setIsSavingCorrection(false);
            }
        } else {
            setFormData(p => ({
                ...p,
                executionStartDate: newStartIso,
                executionStartJustification: correctionJustification.trim()
            }));
            setShowCorrectionModal(false);
        }
    };

    const handleLoadExecutionHistory = async () => {
        if (!order?.id) return;
        setIsLoadingExecHistory(true);
        try {
            const list = await fleetWorkOrderService.getExecutionHistory(order.id);
            setExecutionHistoryEntries(list);
            setShowExecutionHistory(true);
        } catch (err) {
            toast({ title: 'Erro', description: 'Não foi possível carregar o histórico de execução.', variant: 'destructive' });
        } finally {
            setIsLoadingExecHistory(false);
        }
    };

    // Histórico
    const { data: history = [] } = useQuery<WorkOrderHistoryEntry[]>({
        queryKey: ['fleet-work-order-history', order?.id],
        queryFn: () => fleetWorkOrderService.getHistory(order!.id),
        enabled: isEdit && showHistory,
    });


    // Veículos da frota via React Query
    const { data: vehiclesRaw = [], isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
        queryKey: ['fleet-vehicles-all'],
        queryFn: () => fleetService.getVehicles(),
        staleTime: 60_000,
        enabled: isOpen,
    });

    const vehicles = React.useMemo<Vehicle[]>(() => {
        if (!vehiclesRaw) return [];
        if (Array.isArray(vehiclesRaw)) return vehiclesRaw;
        if (Array.isArray((vehiclesRaw as any).content)) return (vehiclesRaw as any).content;
        return [];
    }, [vehiclesRaw]);

    // Clientes, Obras/Postos, Setores, Requerentes (PRD §6, §20, §21, §22)
    const { data: clients = [] } = useQuery({
        queryKey: ['clients-for-select'],
        queryFn: () => clientService.getClientsForSelect(),
        staleTime: 60_000,
        enabled: isOpen,
    });
    const { data: allWorkPosts = [] } = useQuery<WorkPost[]>({
        queryKey: ['work-posts-all'],
        queryFn: () => workPostService.getAllWorkPosts(),
        staleTime: 60_000,
        enabled: isOpen,
    });
    const { data: departments = [] } = useQuery({
        queryKey: ['departments-active'],
        queryFn: () => departmentService.getAll(),
        staleTime: 60_000,
        enabled: isOpen,
    });
    const { data: employees = [] } = useQuery({
        queryKey: ['employees-all-select'],
        queryFn: () => employeeService.getAllEmployees(),
        staleTime: 60_000,
        enabled: isOpen,
    });
    const { data: garagesForOS = [] } = useQuery<Garage[]>({
        queryKey: ['garages-for-os'],
        queryFn: () => garageService.list(),
        staleTime: 60_000,
        enabled: isOpen,
    });

    // Itens do Almoxarifado / Estoque
    const { data: stockItems = [] } = useQuery<StockItem[]>({
        queryKey: ['stock-items-for-work-order'],
        queryFn: () => stockService.getAllItems(),
        staleTime: 30_000,
        enabled: isOpen,
    });

    // Catálogo de Serviços de Manutenção
    const { data: servicesCatalog = [] } = useQuery<any[]>({
        queryKey: ['fleet-work-order-services-catalog'],
        queryFn: () => fleetWorkOrderService.getServicesCatalog(),
        staleTime: 30_000,
        enabled: isOpen,
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
        if (!isOpen || !allWorkPosts || allWorkPosts.length === 0) return [];
        if (!formData.clientId) return allWorkPosts;
        const matching = allWorkPosts.filter((wp: any) => wp.clientId === formData.clientId);
        return matching.length > 0 ? matching : allWorkPosts;
    }, [isOpen, allWorkPosts, formData.clientId]);

    // Lista de Mecânicos / Manutenção (filtrada por cargo/função ou fallback com ordenação)
    const mechanicsList = React.useMemo(() => {
        if (!isOpen || !employees || employees.length === 0) return [];
        const isMechanicOrMaint = (e: any) => {
            const pos = [
                e.positionDescription,
                e.position?.name,
                e.position?.description,
                e.cargo,
                e.funcao,
                e.jobTitle,
                e.cbo,
                e.department?.name,
                e.departamento
            ].filter(Boolean).join(' ').toLowerCase();

            return (
                pos.includes('mecanic') ||
                pos.includes('mecânico') ||
                pos.includes('manuten') ||
                pos.includes('oficina') ||
                pos.includes('eletric') ||
                pos.includes('tecnic') ||
                pos.includes('funileir') ||
                pos.includes('pintor') ||
                pos.includes('borracheir') ||
                pos.includes('lavador') ||
                pos.includes('lubrificador')
            );
        };

        const filtered = employees.filter(isMechanicOrMaint);
        // Se houver mecânicos identificados, lista-os; caso contrário, traz todos os colaboradores permitindo busca
        return filtered.length > 0 ? filtered : employees;
    }, [isOpen, employees]);

    // Opções pesquisáveis com autocomplete
    const vehicleOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen || !vehicles || !Array.isArray(vehicles)) return [];
        return vehicles.map((v: any) => {
            const plate = v.plate || v.placa || 'SEM PLACA';
            const model = v.model || v.modelo || '';
            const brand = v.brand || v.marca || '';
            const code = v.fleetNumber || v.patrimonyNumber || v.code || v.codigo || '';
            const plateClean = plate.replace(/[^A-Za-z0-9]/g, '');
            const mileage = (v.currentMileage !== undefined && v.currentMileage !== null)
                ? v.currentMileage
                : (v.mileage || v.kmAtual);

            return {
                value: v.id,
                label: `${plate} — ${brand ? `${brand} ` : ''}${model}`,
                subtitle: [
                    code ? `Cód/Frota: ${code}` : null,
                    mileage !== undefined && mileage !== null ? `${Number(mileage).toLocaleString('pt-BR')} km` : null,
                    v.garageName ? `Pátio: ${v.garageName}` : null,
                ].filter(Boolean).join(' • '),
                badge: code ? `#${code}` : undefined,
                badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
                keywords: [
                    plate,
                    plateClean,
                    code,
                    v.patrimonyNumber,
                    v.fleetNumber,
                    model,
                    brand,
                ].filter(Boolean) as string[],
            };
        });
    }, [isOpen, vehicles]);

    const mechanicOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen) return [];
        return mechanicsList.map((emp: any) => {
            const empName = emp.name || emp.fullName || 'Colaborador';
            const pos = emp.positionDescription || emp.position?.name || emp.cargo || emp.funcao || '';
            const isMec = pos.toLowerCase().includes('mecanic') || pos.toLowerCase().includes('mecânico');

            return {
                value: emp.id,
                label: empName,
                subtitle: pos || undefined,
                badge: isMec ? 'Mecânico' : undefined,
                badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
                keywords: [emp.registrationNumber, emp.cpf, emp.matricula, empName, pos].filter(Boolean) as string[],
            };
        });
    }, [isOpen, mechanicsList]);

    const normalizeRoleText = (text: string) =>
        text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // Opções de Responsável Técnico (prioriza mecânicos e técnicos, mantendo todos os funcionários pesquisáveis)
    const technicalResponsibleOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen || !employees || employees.length === 0) return [];
        const scoreEmp = (e: any) => {
            const pos = normalizeRoleText([
                e.positionDescription, e.position?.name, e.position?.description,
                e.cargo, e.funcao, e.jobTitle, e.department?.name
            ].filter(Boolean).join(' '));
            if (pos.includes('mecanic') || pos.includes('engenh')) return 2;
            if (pos.includes('manuten') || pos.includes('oficina') || pos.includes('tecnic') || pos.includes('eletric')) return 1;
            return 0;
        };
        return [...employees]
            .sort((a: any, b: any) => scoreEmp(b) - scoreEmp(a) || (a.name || '').localeCompare(b.name || ''))
            .map((emp: any) => {
                const empName = emp.name || emp.fullName || 'Colaborador';
                const pos = emp.positionDescription || emp.position?.name || emp.cargo || emp.funcao || '';
                const norm = normalizeRoleText(pos);
                const isMec = norm.includes('mecanic') || norm.includes('tecnic') || norm.includes('engenh');
                return {
                    value: emp.id,
                    label: empName,
                    subtitle: pos || 'Colaborador',
                    badge: isMec ? (norm.includes('engenh') ? 'Eng. / Técnico' : 'Mecânico') : undefined,
                    badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
                    keywords: [emp.registrationNumber, emp.cpf, emp.matricula, empName, pos].filter(Boolean) as string[],
                };
            });
    }, [isOpen, employees]);

    // Opções de Supervisor: Encarregado, Gestor, Encarregado Mecânico, Mecânico, Engenheiro Mecânico, Gerente Mecânica
    const supervisorOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen || !employees || employees.length === 0) return [];
        const isAllowedSupervisorRole = (e: any) => {
            const pos = normalizeRoleText([
                e.positionDescription, e.position?.name, e.position?.description,
                e.cargo, e.funcao, e.jobTitle, e.cbo, e.department?.name, e.departamento
            ].filter(Boolean).join(' '));
            return (
                pos.includes('encarregad') ||
                pos.includes('gestor') ||
                pos.includes('mecanic') ||
                pos.includes('engenh') ||
                pos.includes('gerente') ||
                pos.includes('supervis') ||
                pos.includes('manutenc') ||
                pos.includes('coordenad') ||
                pos.includes('lider')
            );
        };
        const matching = employees.filter(isAllowedSupervisorRole);
        const list = matching.length > 0 ? matching : employees;
        return list.map((emp: any) => {
            const empName = emp.name || emp.fullName || 'Colaborador';
            const pos = emp.positionDescription || emp.position?.name || emp.cargo || emp.funcao || '';
            const norm = normalizeRoleText(pos);
            let badge: string | undefined;
            if (norm.includes('gerente')) badge = 'Gerente';
            else if (norm.includes('engenh')) badge = 'Eng. Mecânico';
            else if (norm.includes('encarregad')) badge = 'Encarregado';
            else if (norm.includes('gestor') || norm.includes('supervis')) badge = 'Gestor / Sup.';
            else if (norm.includes('mecanic')) badge = 'Mecânico';

            return {
                value: emp.id,
                label: empName,
                subtitle: pos || 'Liderança / Oficina',
                badge,
                badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-700/50',
                keywords: [emp.registrationNumber, emp.cpf, emp.matricula, empName, pos].filter(Boolean) as string[],
            };
        });
    }, [isOpen, employees]);

    const clientOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen) return [];
        return clients.map((c: any) => ({
            value: c.id,
            label: c.name,
            subtitle: c.cnpj ? `CNPJ: ${c.cnpj}` : undefined,
            badge: c.cnpj ? c.cnpj : undefined,
            badgeColor: 'bg-blue-950/60 text-blue-300 border-blue-700/50',
            keywords: [c.cnpj, (c.cnpj || '').replace(/\D/g, '')].filter(Boolean),
        }));
    }, [isOpen, clients]);

    const requesterOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen) return [];
        return employees.map((e: any) => ({
            value: e.id,
            label: e.name || e.fullName,
            subtitle: e.positionDescription || e.position?.name || e.cargo || undefined,
            keywords: [e.registrationNumber, e.cpf, e.positionDescription].filter(Boolean),
        }));
    }, [isOpen, employees]);

    const garageOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen) return [];
        return garagesForOS.map((g: Garage) => ({
            value: g.id,
            label: g.name,
            subtitle: g.responsibleName ? `Resp.: ${g.responsibleName}${g.capacity ? ` (${g.capacity} vagas)` : ''}` : (g.capacity ? `${g.capacity} vagas` : undefined),
            badge: g.atCapacity ? 'Lotada' : undefined,
            badgeColor: g.atCapacity ? 'bg-red-950/60 text-red-300 border-red-700/50' : undefined,
            keywords: [g.responsibleName, g.address, g.name].filter(Boolean) as string[],
        }));
    }, [isOpen, garagesForOS]);

    // Opções de Obras / Setores de Trabalho com busca
    const workPostOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen) return [];
        return obrasForClient.map((wp: any) => ({
            value: wp.id,
            label: `${wp.name}${wp.postCode ? ` (${wp.postCode})` : ''}`,
            subtitle: wp.clientName ? `Cliente: ${wp.clientName}` : (wp.address || undefined),
            badge: wp.postCode ? wp.postCode : undefined,
            badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50',
            keywords: [wp.name, wp.postCode, wp.clientName, wp.address].filter(Boolean) as string[],
        }));
    }, [isOpen, obrasForClient]);

    // Opções do Almoxarifado para Peças
    const stockPartOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen) return [];
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
            const displayName = item.fullName || item.name || item.description || 'Item sem nome';
            return {
                value: item.id,
                label: `[${item.code || 'S/CÓD'}] ${displayName}`,
                subtitle: `Saldo Almoxarifado: ${qty} un ${item.unitCost ? `| Custo: R$ ${item.unitCost.toFixed(2)}` : ''}${item.category ? ` | ${item.category}` : ''}`,
                badge: isZero ? 'Sem Estoque' : `${qty} un`,
                badgeColor: isZero ? 'bg-red-950/70 text-red-300 border-red-700/60' : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
                keywords: [
                    item.code,
                    item.barcode,
                    item.name,
                    item.fullName,
                    item.description,
                    item.category,
                    item.supplier,
                    item.sizeVariation
                ].filter(Boolean) as string[],
            };
        });

        return [manualOpt, ...dbOpts];
    }, [isOpen, stockItems]);

    // Opções de Serviços do Catálogo
    const serviceCatalogOptions = React.useMemo<SearchableOption[]>(() => {
        if (!isOpen) return [];
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
    }, [isOpen, servicesCatalog]);

    // Handlers para Upload de Fotos / Evidências com compressão automática (evita erro 413 Payload Too Large)
    const [newPhotoUrl, setNewPhotoUrl] = useState('');

    const compressImage = (file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    } else {
                        resolve(event.target?.result as string);
                    }
                };
                img.onerror = () => resolve(event.target?.result as string);
                img.src = event.target?.result as string;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    };

    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingPhotos(true);
        try {
            const rawFiles = Array.from(files);
            // Normaliza imagens (especialmente .webp ou fotos pesadas de câmera) para JPEG padrão compatível com gerador PDF
            const normalizedFiles: File[] = [];
            for (const file of rawFiles) {
                const isWebpOrLarge = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp') || file.size > 1_500_000;
                if (isWebpOrLarge) {
                    try {
                        const jpegDataUrl = await compressImage(file, 1400, 1400, 0.82);
                        if (jpegDataUrl && jpegDataUrl.startsWith('data:image/jpeg')) {
                            const res = await fetch(jpegDataUrl);
                            const blob = await res.blob();
                            const safeName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
                            normalizedFiles.push(new File([blob], safeName, { type: 'image/jpeg' }));
                            continue;
                        }
                    } catch {
                        // fallback para o arquivo original
                    }
                }
                normalizedFiles.push(file);
            }

            // Tenta upload direto para o servidor (retorna /uploads/maintenance/uuid_foto.jpg)
            try {
                const uploadedUrls = await fleetWorkOrderService.uploadPhotos(normalizedFiles);
                if (uploadedUrls && uploadedUrls.length > 0) {
                    setFormData(p => ({
                        ...p,
                        photoAttachments: [...(p.photoAttachments || []), ...uploadedUrls]
                    }));
                    toast({ title: 'Fotos anexadas', description: `${uploadedUrls.length} foto(s) enviada(s) com sucesso.` });
                    return;
                }
            } catch (upErr) {
                console.warn('Upload multipart direto falhou, usando compressão otimizada:', upErr);
            }

            // Fallback: compressão com tamanho máximo reduzido (evita 413)
            const compressedList: string[] = [];
            for (const file of rawFiles) {
                const compressed = await compressImage(file, 1024, 1024, 0.65);
                if (compressed) {
                    compressedList.push(compressed);
                }
            }

            if (compressedList.length > 0) {
                setFormData(p => ({
                    ...p,
                    photoAttachments: [...(p.photoAttachments || []), ...compressedList]
                }));
            }
        } finally {
            setIsUploadingPhotos(false);
            e.target.value = '';
        }
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

    // Itens padrão de contingência / fallback de inspeção preventiva
    const DEFAULT_CHECKLIST_FALLBACK: { descricao: string; categoria: string }[] = [
        // Mecânica
        { descricao: 'Conferir barras e ponteiras', categoria: 'MECANICA' },
        { descricao: 'Conferir coifa', categoria: 'MECANICA' },
        { descricao: 'Conferir mangas de eixo', categoria: 'MECANICA' },
        { descricao: 'Conferir vazamentos pneumáticos', categoria: 'MECANICA' },
        { descricao: 'Conferir freio de estacionamento', categoria: 'MECANICA' },
        { descricao: 'Conferir amortecedores', categoria: 'MECANICA' },
        { descricao: 'Conferir estabilizadores', categoria: 'MECANICA' },
        { descricao: 'Conferir cuícas', categoria: 'MECANICA' },
        { descricao: 'Conferir lonas', categoria: 'MECANICA' },
        { descricao: 'Conferir catracas de freio', categoria: 'MECANICA' },
        { descricao: 'Conferir freio motor', categoria: 'MECANICA' },
        { descricao: 'Conferir cubos dianteiros e traseiros', categoria: 'MECANICA' },
        { descricao: 'Conferir folga eixo S', categoria: 'MECANICA' },
        { descricao: 'Conferir flange da caixa de câmbio', categoria: 'MECANICA' },
        { descricao: 'Conferir cruzeta', categoria: 'MECANICA' },
        { descricao: 'Conferir embreagem', categoria: 'MECANICA' },
        { descricao: 'Conferir pinos de centro do feixe de molas', categoria: 'MECANICA' },
        { descricao: 'Lubrificar feixe de molas', categoria: 'MECANICA' },
        { descricao: 'Lubrificar rolamentos', categoria: 'MECANICA' },
        { descricao: 'Lubrificar cruzetas', categoria: 'MECANICA' },
        { descricao: 'Lubrificar sistema de freio', categoria: 'MECANICA' },
        { descricao: 'Conferir rolamento central', categoria: 'MECANICA' },
        { descricao: 'Conferir mancal / eixo cardan', categoria: 'MECANICA' },
        // Elétrica
        { descricao: 'Conferir polos da bateria', categoria: 'ELETRICA' },
        { descricao: 'Conferir cabos da bateria', categoria: 'ELETRICA' },
        { descricao: 'Conferir carregamento da bateria (27V)', categoria: 'ELETRICA' },
        { descricao: 'Conferir parte elétrica', categoria: 'ELETRICA' },
        { descricao: 'Conferir farol, farolete, lanternas, seta e buzina', categoria: 'ELETRICA' },
        // Motor
        { descricao: 'Conferir óleo do motor', categoria: 'MOTOR' },
        { descricao: 'Conferir filtros', categoria: 'MOTOR' },
        { descricao: 'Conferir radiador e arrefecimento', categoria: 'MOTOR' },
        { descricao: 'Conferir motor e correias', categoria: 'MOTOR' },
        // Pneus
        { descricao: 'Conferir pneus, calibração e aperto dos parafusos', categoria: 'PNEUS' },
        // Carroceria
        { descricao: 'Conferir carroceria, porta-malas e painel de instrução', categoria: 'CARROCERIA' }
    ];

    const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);

    const handleLoadDefaultChecklist = async (
        overrideVehicleId?: string,
        initialStatus: ChecklistStatus | null = null,
        overrideTemplateModel?: string
    ) => {
        setIsLoadingChecklist(true);
        try {
            const targetVehId = overrideVehicleId || formData.vehicleId;
            const currentVeh = vehicles.find(v => v.id === targetVehId);
            const vType = (currentVeh?.vehicleType || '').toUpperCase();
            const modelStr = ((currentVeh?.model || '') + ' ' + (currentVeh?.brand || '')).toUpperCase();
            const targetTemplate = overrideTemplateModel || formData.preventiveModel || 'MODELO_2';

            // Detecta se é VAN, MICRO-ÔNIBUS ou ÔNIBUS
            let filterType = 'BUS';
            const isVan = vType === 'VAN' || modelStr.includes('VAN') || modelStr.includes('SPRINTER') || modelStr.includes('DUCATO') || modelStr.includes('TRANSIT') || modelStr.includes('MASTER');
            const isMicro = vType.includes('MINI') || modelStr.includes('MICRO') || modelStr.includes('VOLARE') || modelStr.includes('SENIOR') || modelStr.includes('FLY');

            if (isVan) {
                filterType = 'VAN';
            } else if (isMicro) {
                filterType = 'MINIBUS';
            }

            const masterItems = await fleetWorkOrderService.getChecklistMasterItems(filterType, currentVeh?.model, targetTemplate);
            let itemsToUse: { id?: string; descricao: string; categoria: string }[] = [];
            if (masterItems && masterItems.length > 0) {
                itemsToUse = masterItems;
            } else {
                itemsToUse = DEFAULT_CHECKLIST_FALLBACK;
            }

            const initialChecklist: FleetWorkOrderChecklist[] = itemsToUse.map(m => ({
                checklistItemId: m.id,
                checklistItemDescricao: m.descricao,
                checklistItemCategoria: m.categoria,
                situacao: initialStatus,
                observacao: '',
                reparoRealizado: ''
            }));
            setFormData(p => ({ ...p, preventiveModel: targetTemplate, checklistItems: initialChecklist }));
            const labelModelo = targetTemplate === 'MODELO_2' ? 'Modelo 2 • Verificação Frota' : (filterType === 'VAN' ? 'Van' : (isMicro ? 'Micro-ônibus' : 'Ônibus'));
            toast({
                title: initialStatus === ChecklistStatus.OK ? `Todos os itens marcados como OK (${labelModelo})` : `Checklist Preventivo (${labelModelo})`,
                description: initialStatus === ChecklistStatus.OK
                    ? `${initialChecklist.length} itens de inspeção preenchidos com OK.`
                    : `${initialChecklist.length} itens de inspeção adicionados à OS.`,
            });
        } catch {
            const fallbackChecklist: FleetWorkOrderChecklist[] = DEFAULT_CHECKLIST_FALLBACK.map(m => ({
                checklistItemDescricao: m.descricao,
                checklistItemCategoria: m.categoria,
                situacao: initialStatus,
                observacao: '',
                reparoRealizado: ''
            }));
            setFormData(p => ({ ...p, checklistItems: fallbackChecklist }));
            toast({
                title: 'Checklist preventivo padrão carregado',
                description: `${fallbackChecklist.length} itens padrão adicionados.`,
            });
        } finally {
            setIsLoadingChecklist(false);
        }
    };

    const handleMarkAllChecklistOk = async () => {
        if (!formData.checklistItems || formData.checklistItems.length === 0) {
            await handleLoadDefaultChecklist(undefined, ChecklistStatus.OK);
            return;
        }
        setFormData(p => ({
            ...p,
            checklistItems: (p.checklistItems || []).map(item => ({
                ...item,
                situacao: ChecklistStatus.OK
            }))
        }));
        toast({
            title: 'Todos os campos preenchidos com OK!',
            description: `${formData.checklistItems.length} itens do checklist preventivo marcados como OK em verde.`
        });
    };

    const handleClearAllChecklist = () => {
        if (!formData.checklistItems || formData.checklistItems.length === 0) return;
        setFormData(p => ({
            ...p,
            checklistItems: (p.checklistItems || []).map(item => ({
                ...item,
                situacao: null,
                observacao: '',
                reparoRealizado: ''
            }))
        }));
        toast({
            title: 'Checklist em Branco',
            description: 'Marcações limpas. Você pode preencher individualmente ou gerar o PDF em branco.'
        });
    };

    const handleMarkCategoryOk = (category: string) => {
        setFormData(p => ({
            ...p,
            checklistItems: (p.checklistItems || []).map(item =>
                (item.checklistItemCategoria || 'GERAL') === category
                    ? { ...item, situacao: ChecklistStatus.OK }
                    : item
            )
        }));
    };

    // Carregar itens mestre de checklist caso selecione PREVENTIVA e ainda não tenha itens
    useEffect(() => {
        if (formData.maintenanceType === MaintenanceType.PREVENTIVA && (!formData.checklistItems || formData.checklistItems.length === 0)) {
            handleLoadDefaultChecklist(undefined, null);
        }
    }, [formData.maintenanceType, formData.vehicleId]);

    // Popular form ao abrir (Motorista sempre em modo simplificado)
    useEffect(() => {
        if (order) {
            const resp = getOrderResponsibleDisplay(order);
            const fallbackDriver = isDriverUser ? (user?.name || (user as any)?.fullName || user?.username || '') : '';
            const cleanMechanicName = order.mechanicName && !order.mechanicName.toLowerCase().includes('(motorista)')
                ? order.mechanicName
                : (resp !== 'Não atribuído' && !resp.toLowerCase().includes('(motorista)') ? resp : '');
            setFormData({
                ...order,
                driverName: (order.driverName && order.driverName.trim()) ? order.driverName : fallbackDriver,
                requestDate: order.requestDate || order.stopDate || new Date().toISOString().split('T')[0],
                mechanicName: cleanMechanicName,
                responsibleName: (order.responsibleName && order.responsibleName.trim() && !order.responsibleName.toLowerCase().includes('(motorista)'))
                    ? order.responsibleName
                    : (order.responsibleId && !resp.toLowerCase().includes('(motorista)') ? resp : undefined),
                responsibleId: order.responsibleId || order.mechanicId || undefined,
                responsibleSignature: order.responsibleSignature?.startsWith('data:image/') ? order.responsibleSignature : '',
                supervisorSignature: order.supervisorSignature?.startsWith('data:image/') ? order.supervisorSignature : '',
                releaseSignature: order.releaseSignature?.startsWith('data:image/') ? order.releaseSignature : '',
                preventiveModel: order.preventiveModel || 'MODELO_1',
                operationProfile: order.operationProfile || 'URBANO',
            });
            setIsExpressMode(isDriverUser);
        } else {
            const today = new Date().toISOString().split('T')[0];
            const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const driverFullName = user?.name || (user as any)?.fullName || user?.username || 'Motorista';
            setFormData({
                vehicleId: initialValues?.vehicleId || initialVehicleId || '',
                maintenanceType: initialValues?.maintenanceType || MaintenanceType.CORRETIVA,
                status: initialValues?.status || WorkOrderStatus.OPEN,
                priority: initialValues?.priority || WorkOrderPriority.MEDIUM,
                laborType: initialValues?.laborType || LaborType.INTERNAL,
                plannedDate: today,
                stopDate: today,
                stopTime: nowTime,
                requestDate: initialValues?.requestDate || today,
                driverName: initialValues?.driverName || (isDriverUser ? driverFullName : ''),
                odometerIn: initialValues?.odometerIn,
                clientId: initialValues?.clientId,
                workPostId: initialValues?.workPostId,
                sectorId: initialValues?.sectorId,
                garageId: initialValues?.garageId,
                garageName: initialValues?.garageName,
                photoAttachments: initialValues?.photoAttachments || [],
                servicesVerified: undefined,
                releaseDate: '',
                releaseTime: '',
                releasedByName: '',
                releaseSignature: '',
                laborCost: 0, partsCost: 0, totalCost: 0,
                stopReason: initialValues?.stopReason || (isDriverUser ? 'Abertura de Chamado pelo Condutor/Motorista' : ''),
                mechanicId: undefined,
                mechanicName: '',
                requesterName: user?.name,
                requesterId: (user as any)?.employeeId || (user?.id ? String(user.id) : undefined),
                responsibleId: undefined,
                responsibleName: undefined,
                supervisorId: undefined,
                supervisorName: undefined,
                responsibleSignature: '',
                supervisorSignature: '',
                notes: initialValues?.notes || (isDriverUser ? `OS aberta pelo Motorista: ${driverFullName} via Sistema` : ''),
                items: [], checklistItems: [],
                anomaliesDescription: initialValues?.anomaliesDescription || '',
                otherDescription: initialValues?.otherDescription || '',
                maintenancePerformed: '',
                preventiveControlTypes: initialValues?.preventiveControlTypes || [],
                oilFilterChanged: Boolean(initialValues?.oilFilterChanged),
                dieselFilterChanged: Boolean(initialValues?.dieselFilterChanged),
                waterSeparatorFilterChanged: Boolean(initialValues?.waterSeparatorFilterChanged),
                airFilterChanged: Boolean(initialValues?.airFilterChanged),
                preventiveModel: initialValues?.preventiveModel || 'MODELO_2',
                operationProfile: initialValues?.operationProfile || 'URBANO',
                autoGenerated: Boolean(initialValues?.autoGenerated),
                triggeredItemsSummary: initialValues?.triggeredItemsSummary || ''
            });
            setIsExpressMode(isDriverUser);
        }
        setShowHistory(false);
        setShowResignResp(false);
        setShowResignSup(false);
        setShowResignRel(false);
        setNewNote('');
    }, [order, isOpen, initialVehicleId, initialValues, isDriverUser]);

    // Veículo selecionado atualmente
    const selectedVehicle = React.useMemo(() => {
        if (!formData.vehicleId) return null;
        return vehicles.find(v => v.id === formData.vehicleId) || null;
    }, [formData.vehicleId, vehicles]);

    // Seleção de veículo centralizada com auto-preenchimento
    const handleSelectVehicle = (v: string) => {
        const selectedVeh = vehicles.find(veh => veh.id === v);
        const vehGarage = selectedVeh?.garageId
            ? garagesForOS.find((g: Garage) => g.id === selectedVeh.garageId)
            : undefined;
        setFormData(p => ({
            ...p,
            vehicleId: v,
            vehiclePlate: selectedVeh?.plate || (selectedVeh as any)?.placa || p.vehiclePlate,
            vehicleModel: selectedVeh?.model || (selectedVeh as any)?.modelo || p.vehicleModel,
            clientId: selectedVeh?.clientId || p.clientId,
            sectorId: selectedVeh?.workPostId || p.sectorId,
            workPostId: selectedVeh?.workPostId || p.workPostId,
            workPostName: (selectedVeh as any)?.workPostName || p.workPostName,
            garageId: p.garageId || selectedVeh?.garageId || undefined,
            garageName: p.garageName || vehGarage?.name || selectedVeh?.garageName || undefined,
            odometerIn: (selectedVeh?.currentMileage !== undefined && selectedVeh?.currentMileage !== null)
                ? selectedVeh.currentMileage
                : p.odometerIn,
            operationProfile: inferVehicleOperationProfile(selectedVeh)
        }));
        if (formData.maintenanceType === MaintenanceType.PREVENTIVA && (!isEdit || !order?.checklistItems || order.checklistItems.length === 0)) {
            handleLoadDefaultChecklist(v);
        }
    };

    // Inserção rápida de queixa / sintoma
    const handleAddSymptomChip = (symptom: string) => {
        setFormData(p => {
            const current = (p.anomaliesDescription || p.stopReason || '').trim();
            const updated = current ? `${current}; ${symptom}` : symptom;
            return {
                ...p,
                anomaliesDescription: updated,
                stopReason: updated
            };
        });
    };

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

    const [isRequestingPurchase, setIsRequestingPurchase] = useState(false);

    // Requisições existentes no Almoxarifado para esta OS (Anti-duplicidade)
    const { data: woRequisitions = [], refetch: refetchWoRequisitions } = useQuery({
        queryKey: ['material-requisitions-wo', order?.id],
        queryFn: () => order?.id ? materialRequisitionService.listByWorkOrder(order.id) : Promise.resolve([]),
        enabled: !!order?.id,
    });

    const outOfStockParts = React.useMemo(() => {
        return (formData.items || []).filter(i => 
            (i.type || WorkOrderItemType.PART) === WorkOrderItemType.PART && 
            (i.inStock === undefined || i.inStock <= 0 || i.quantity > i.inStock)
        );
    }, [formData.items]);

    const unnotifiedParts = React.useMemo(() => {
        return outOfStockParts.filter(part => {
            const already = (woRequisitions || []).some(r => 
                r.status !== 'REJECTED' && r.status !== 'CANCELLED' &&
                ((part.productId && r.stockItemId === part.productId) ||
                 (part.code && r.itemCode && r.itemCode.toLowerCase() === part.code.toLowerCase()) ||
                 (part.description && r.itemName && r.itemName.trim().toLowerCase() === part.description.trim().toLowerCase()))
            );
            return !already;
        });
    }, [outOfStockParts, woRequisitions]);

    const handleNotifyAlmoxarifado = async () => {
        if (!order?.id) {
            toast({
                title: "Salve a OS primeiro",
                description: "Por favor, salve a Ordem de Serviço antes de notificar o Almoxarifado.",
                variant: "destructive",
            });
            return;
        }
        if (unnotifiedParts.length === 0) {
            toast({
                title: "Peças já Solicitadas",
                description: "Todas as peças sem estoque desta OS já foram notificadas ao Almoxarifado anteriormente.",
            });
            return;
        }
        setIsRequestingPurchase(true);
        try {
            const res = await fleetWorkOrderService.notifyAlmoxarifado(order.id);
            toast({
                title: res?.alreadyNotified ? "Peças já Notificadas" : "Almoxarifado Notificado com Sucesso!",
                description: res?.message || `Notificação de ${unnotifiedParts.length} peça(s) enviada ao Almoxarifado.`,
            });
            await refetchWoRequisitions();
            queryClient.invalidateQueries({ queryKey: ['fleet-work-order-history', order.id] });
            queryClient.invalidateQueries({ queryKey: ['material-requisitions-wo', order.id] });
        } catch (err: any) {
            toast({
                title: "Erro ao notificar almoxarifado",
                description: err?.response?.data?.error || err?.response?.data?.message || err?.message || "Ocorreu um erro ao enviar a notificação ao Almoxarifado.",
                variant: "destructive",
            });
        } finally {
            setIsRequestingPurchase(false);
        }
    };

    const handleRequestPurchase = handleNotifyAlmoxarifado;

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
                    const unitPrice = Number(created.unitPrice) || (typeof newServicePrice === 'number' ? newServicePrice : 0);
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
            } else {
                const unitPrice = Number(created.unitPrice) || (typeof newServicePrice === 'number' ? newServicePrice : 0);
                const totalPrice = 1 * unitPrice;
                const requiresApproval = totalPrice >= HIGH_VALUE_SERVICE_THRESHOLD;
                setFormData(p => {
                    const items = [
                        ...(p.items || []),
                        {
                            code: created.code,
                            description: created.name,
                            type: WorkOrderItemType.LABOR,
                            quantity: 1,
                            unitPrice,
                            totalPrice,
                            requiresApproval,
                            approvalReason: '',
                            approved: false,
                            isManual: false,
                        }
                    ];
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
            const current = list[idx]?.situacao;
            list[idx] = { ...list[idx], situacao: current === status ? null : status };
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

        const defectText = (formData.anomaliesDescription || formData.stopReason || '').trim();
        if (formData.maintenanceType === MaintenanceType.CORRETIVA && !defectText) {
            toast({ title: 'Atenção', description: 'Informe o defeito relatado ou anomalia para a OS Corretiva.', variant: 'destructive' });
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
            const today = new Date().toISOString().split('T')[0];
            const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const resolvedAnomalies = defectText || (formData.maintenanceType === MaintenanceType.PREVENTIVA ? 'Revisão preventiva periódica' : '');

            const isDriver = user?.role === 'MOTORISTA' || (user as any)?.roles?.some((r: any) => typeof r === 'string' ? r.includes('MOTORISTA') : r?.name?.includes('MOTORISTA'));
            const driverName = user?.name || user?.username || 'Motorista';
            const rawMechanic = formData.mechanicName?.trim();
            const resolvedMechanic = rawMechanic && !rawMechanic.toLowerCase().includes('(motorista)') ? rawMechanic : undefined;

            const payload: Partial<FleetWorkOrder> = {
                ...formData,
                driverName: formData.driverName?.trim() || (isDriver ? driverName : undefined),
                requestDate: formData.requestDate || formData.stopDate || today,
                mechanicName: resolvedMechanic,
                responsibleName: formData.responsibleName && !formData.responsibleName.toLowerCase().includes('(motorista)') ? formData.responsibleName : undefined,
                requesterName: formData.requesterName || (isDriver ? driverName : undefined),
                stopDate: formData.stopDate || today,
                stopTime: formData.stopTime || nowTime,
                stopReason: formData.stopReason?.trim() || resolvedAnomalies,
                anomaliesDescription: resolvedAnomalies,
                status: submitStatus || formData.status || WorkOrderStatus.OPEN,
                items: (formData.items || []).map(it => ({ ...it, type: it.type ?? WorkOrderItemType.PART })),
            };
            let savedOrder: FleetWorkOrder;
            if (effectiveId) {
                savedOrder = await fleetWorkOrderService.update(effectiveId, payload);
            } else {
                const created = await fleetWorkOrderService.create(payload);
                savedOrder = created;
                setFormData(p => ({ ...p, id: created.id, osNumber: created.osNumber }));
            }
            toast({ title: 'Sucesso', description: 'Ordem de Serviço salva com sucesso!' });
            queryClient.invalidateQueries({ queryKey: ['fleet-component-controls'] });
            queryClient.invalidateQueries({ queryKey: ['system-alerts-center'] });
            onSuccess(savedOrder);
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Falha ao salvar OS.';
            toast({ title: 'Erro', description: msg, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    // ── Gerar e Visualizar a OS em PDF (Preenchido ou Em Branco p/ Preenchimento Manual) ──
    const handleGenerateAndPreviewOS = async (blankChecklist: boolean = false) => {
        if (!formData.vehicleId) {
            toast({
                title: 'Veículo Obrigatório',
                description: 'Selecione um equipamento/veículo antes de gerar a Ordem de Serviço.',
                variant: 'destructive'
            });
            return;
        }

        const defectText = (formData.anomaliesDescription || formData.stopReason || '').trim();
        if (formData.maintenanceType === MaintenanceType.CORRETIVA && !defectText) {
            toast({
                title: 'Descrição Obrigatória',
                description: 'Informe a descrição do defeito ou anomalia para OS Corretiva.',
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
        setIsBlankPdfMode(blankChecklist);
        try {
            const today = new Date().toISOString().split('T')[0];
            const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const resolvedAnomalies = defectText || (formData.maintenanceType === MaintenanceType.PREVENTIVA ? 'Revisão preventiva periódica' : '');

            const isDriver = user?.role === 'MOTORISTA' || (user as any)?.roles?.some((r: any) => typeof r === 'string' ? r.includes('MOTORISTA') : r?.name?.includes('MOTORISTA'));
            const driverName = user?.name || user?.username || 'Motorista';
            const rawMechanic = formData.mechanicName?.trim();
            const resolvedMechanic = rawMechanic && !rawMechanic.toLowerCase().includes('(motorista)') ? rawMechanic : undefined;

            const payload: Partial<FleetWorkOrder> = {
                ...formData,
                driverName: formData.driverName?.trim() || (isDriver ? driverName : undefined),
                requestDate: formData.requestDate || formData.stopDate || today,
                mechanicName: resolvedMechanic,
                responsibleName: formData.responsibleName && !formData.responsibleName.toLowerCase().includes('(motorista)') ? formData.responsibleName : undefined,
                requesterName: formData.requesterName || (isDriver ? driverName : undefined),
                stopDate: formData.stopDate || today,
                stopTime: formData.stopTime || nowTime,
                stopReason: formData.stopReason?.trim() || resolvedAnomalies,
                anomaliesDescription: resolvedAnomalies,
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
            const blob = await generateFleetWorkOrderPDFBlob(savedOrder, {
                blank: blankChecklist,
                templateModel: savedOrder.preventiveModel || formData.preventiveModel
            });
            setPdfPreviewBlob(blob);
            setPdfPreviewOrder(savedOrder);
            setIsPdfModalOpen(true);
            toast({
                title: blankChecklist ? 'OS em Branco Gerada!' : 'OS Gerada com Sucesso!',
                description: blankChecklist
                    ? `OS #${savedOrder.osNumber || savedOrder.id.slice(0, 8)} gerada com campos em branco para preenchimento manual.`
                    : `Ordem de Serviço #${savedOrder.osNumber || savedOrder.id.slice(0, 8)} pronta para visualização e impressão.`
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

    const togglePreventiveComponent = (type: string) => {
        setFormData((p) => {
            const current = p.preventiveControlTypes || [];
            const next = current.includes(type)
                ? current.filter((t) => t !== type)
                : [...current, type];
            return { ...p, preventiveControlTypes: next };
        });
    };

    const renderPreventiveComponentControls = () => {
        const selectedTypes = formData.preventiveControlTypes || [];
        const hasOilSelected = selectedTypes.includes('ENGINE_OIL');
        return (
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                        Controles Preventivos Vinculados (Atualiza Painel de Vencimentos ao Concluir)
                    </span>
                    <span className="text-[10px] text-gray-400">Opcional — selecione se a OS realizar algum destes serviços</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {COMPONENT_CONTROLS_META.map((ctrl) => {
                        const active = selectedTypes.includes(ctrl.type);
                        return (
                            <button
                                key={ctrl.type}
                                type="button"
                                onClick={() => togglePreventiveComponent(ctrl.type)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    active
                                        ? 'bg-blue-600/30 border-blue-400 text-white shadow-sm'
                                        : 'bg-black/40 border-gray-700 text-gray-300 hover:border-gray-500'
                                }`}
                            >
                                <span>{active ? '✓' : '+'}</span>
                                <span>{ctrl.label}</span>
                            </button>
                        );
                    })}
                </div>
                {hasOilSelected && (
                    <div className="pt-2 border-t border-blue-800/40">
                        <span className="text-[11px] font-semibold text-amber-300 block mb-2">
                            Filtros Substituídos na Troca de Óleo de Motor:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { key: 'oilFilterChanged', label: 'Filtro de Óleo' },
                                { key: 'dieselFilterChanged', label: 'Filtro Diesel' },
                                { key: 'waterSeparatorFilterChanged', label: 'Filtro Sep. de Água' },
                                { key: 'airFilterChanged', label: 'Filtro de Ar' },
                            ].map((f) => {
                                const checked = Boolean((formData as any)[f.key]);
                                return (
                                    <label
                                        key={f.key}
                                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none ${
                                            checked
                                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold'
                                                : 'bg-black/40 border-gray-700 text-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => setFormData((p) => ({ ...p, [f.key]: e.target.checked }))}
                                            className="rounded border-gray-500 text-emerald-500 h-3.5 w-3.5"
                                        />
                                        <span>{f.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const scrollToSection = (sectionId: string) => {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const footer = (
        <div className="w-full flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
            {/* Esquerda: Cancelar / alternar modo */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 sm:flex-none h-9 px-3.5 border-gray-600/80 text-gray-300 hover:text-white hover:bg-gray-800 text-xs font-medium"
                >
                    Cancelar
                </Button>
                {effectiveExpressMode && !isDriverUser && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsExpressMode(false)}
                        className="flex-1 sm:flex-none h-9 px-3 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-xs whitespace-nowrap"
                    >
                        <ClipboardList className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
                        Modo Completo
                    </Button>
                )}
            </div>

            {/* Direita: Ações de PDF + Ações Principais de Fluxo */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                {/* Grupo Documentos (PDF) */}
                <div className={`grid ${formData.maintenanceType === MaintenanceType.PREVENTIVA ? 'grid-cols-2' : 'grid-cols-1'} sm:flex sm:items-center gap-2`}>
                    {formData.maintenanceType === MaintenanceType.PREVENTIVA && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleGenerateAndPreviewOS(true)}
                            disabled={isLoading || isGeneratingPdf}
                            className="h-9 px-2.5 border-amber-500/70 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 font-semibold text-xs whitespace-nowrap"
                            title="Gera o PDF com todos os campos do checklist em branco para preenchimento manual em papel"
                        >
                            <FileText className="mr-1.5 h-3.5 w-3.5 text-amber-400 shrink-0" />
                            PDF em Branco
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleGenerateAndPreviewOS(false)}
                        disabled={isLoading || isGeneratingPdf}
                        className="h-9 px-3 border-red-500/70 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 font-semibold text-xs whitespace-nowrap"
                    >
                        <FileText className="mr-1.5 h-3.5 w-3.5 text-red-400 shrink-0" />
                        {isGeneratingPdf ? 'Gerando...' : 'Visualizar PDF'}
                    </Button>
                </div>

                {/* Separador visual no desktop */}
                <div className="hidden sm:block h-6 w-px bg-gray-700/80 mx-0.5" />

                {/* Grupo Salvar / Status */}
                {effectiveExpressMode ? (
                    <Button
                        type="button"
                        onClick={() => handleSubmit(WorkOrderStatus.OPEN)}
                        disabled={isLoading || isGeneratingPdf}
                        className="min-h-[44px] sm:h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 whitespace-nowrap w-full sm:w-auto"
                    >
                        <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-300 shrink-0" />
                        Abrir OS Agora
                    </Button>
                ) : (
                    <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSubmit(WorkOrderStatus.OPEN)}
                            disabled={isLoading || isGeneratingPdf}
                            className="h-9 px-2.5 sm:px-3 border-blue-500/80 text-blue-300 hover:bg-blue-500/15 font-semibold text-xs whitespace-nowrap"
                            title="Salvar OS com status Aberta / Rascunho"
                        >
                            <Clock className="mr-1 sm:mr-1.5 h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Salvar</span>
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleSubmit(WorkOrderStatus.IN_PROGRESS)}
                            disabled={isLoading || isGeneratingPdf}
                            className="h-9 px-2.5 sm:px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs whitespace-nowrap"
                        >
                            <Wrench className="mr-1 sm:mr-1.5 h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Em Andam.</span>
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleSubmit(WorkOrderStatus.COMPLETED)}
                            disabled={isLoading || isGeneratingPdf}
                            className="h-9 px-2.5 sm:px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm whitespace-nowrap"
                        >
                            <CheckCircle className="mr-1 sm:mr-1.5 h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Concluir OS</span>
                        </Button>
                    </div>
                )}
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

    const handleCloseDrawer = () => {
        onClose();
        setTimeout(() => {
            if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
                document.body.style.pointerEvents = '';
                document.body.style.overflow = '';
            }
        }, 50);
    };

    useEffect(() => {
        return () => {
            setTimeout(() => {
                if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
                    document.body.style.pointerEvents = '';
                    document.body.style.overflow = '';
                }
            }, 50);
        };
    }, []);

    return (
        <ResponsiveDrawer isOpen={isOpen} onClose={handleCloseDrawer}
            title={currentOsNumber ? `OS #${currentOsNumber} — ${isEdit ? 'Editar' : 'Ordem de Serviço'}` : 'Nova Ordem de Serviço'}
            description="Cadastre manutenções corretivas e preventivas com controle completo de checklist e execução."
            footer={footer}
            className="sm:max-w-4xl bg-seguranca-graphite border-gray-800 z-[10050]">
            <div className="space-y-6 py-2 pb-10">

                {/* ── Barra Superior + Seletor de Modo + Navegação Rápida ── */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-seguranca-black/90 border border-gray-800 rounded-xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${currentOsNumber ? 'bg-red-600' : 'bg-gray-700'} text-white font-mono text-xs px-2.5 py-1`}>
                                {currentOsNumber ? `OS #${currentOsNumber}` : 'NOVA OS'}
                            </Badge>
                            {formData.status && (
                                <Badge className="bg-gray-800 text-gray-300 border border-gray-700 text-xs">
                                    Status: {formData.status}
                                </Badge>
                            )}
                            {selectedVehicle && (
                                <span className="text-xs text-emerald-400 font-mono hidden sm:inline">
                                    {selectedVehicle.plate}
                                </span>
                            )}
                        </div>

                        {/* Seletor segmentado responsivo: oculta Formulário Completo para Motorista */}
                        {isDriverUser ? (
                            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 w-fit">
                                <Zap className="h-3.5 w-3.5 shrink-0" />
                                Abertura Simplificada (Motorista)
                            </Badge>
                        ) : (
                            <div className="grid grid-cols-2 sm:inline-flex p-1 bg-black/90 rounded-lg border border-gray-800 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsExpressMode(false)}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                        !effectiveExpressMode
                                            ? 'bg-blue-600 !text-white shadow-md'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">Formulário Completo</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsExpressMode(true)}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                        effectiveExpressMode
                                            ? 'bg-amber-500 text-black shadow-md'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <Zap className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">Abertura Expressa</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navegação rápida entre seções no modo Formulário Completo */}
                    {!effectiveExpressMode && (
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 bg-black/40 border border-gray-800/80 rounded-lg">
                            {[
                                { id: 'os-sec-identificacao', label: '1. Identificação' },
                                { id: 'os-sec-parada', label: '2. Parada & KM' },
                                { id: 'os-sec-execucao', label: '3. Execução' },
                                {
                                    id: 'os-sec-diagnostico',
                                    label: formData.maintenanceType === MaintenanceType.CORRETIVA ? '4. Anomalias' : '4. Checklist'
                                },
                                { id: 'os-sec-itens', label: '5. Peças & Serviços' },
                                { id: 'os-sec-custos', label: '6. Custos' },
                                { id: 'os-sec-assinaturas', label: '7. Assinaturas' },
                            ].map((nav) => (
                                <button
                                    key={nav.id}
                                    type="button"
                                    onClick={() => scrollToSection(nav.id)}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-300 hover:text-white bg-gray-900/70 hover:bg-gray-800 border border-gray-800 hover:border-gray-600 transition-colors shrink-0 whitespace-nowrap"
                                >
                                    {nav.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {effectiveExpressMode ? (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        {/* Motorista & Data da Solicitação */}
                        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                    <User className="h-4 w-4 text-emerald-400" />
                                    Motorista
                                </Label>
                                <Input
                                    value={formData.driverName || ''}
                                    onChange={e => setFormData(p => ({ ...p, driverName: e.target.value }))}
                                    readOnly={isDriverUser}
                                    disabled={isDriverUser}
                                    placeholder="Nome do motorista solicitante"
                                    className={`bg-seguranca-black border-gray-700 text-sm ${isDriverUser ? 'text-emerald-300 font-semibold cursor-not-allowed opacity-90' : ''}`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-blue-400" />
                                    Data da Solicitação
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.requestDate || ''}
                                    onChange={e => setFormData(p => ({ ...p, requestDate: e.target.value }))}
                                    className="bg-seguranca-black border-gray-700 text-sm"
                                />
                            </div>
                        </div>

                        {/* 1. Veículo e Odômetro */}
                        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                    <Car className="h-4 w-4 text-amber-400" />
                                    1. Equipamento / Veículo *
                                </Label>
                                {selectedVehicle && (
                                    <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[11px] font-mono">
                                        {selectedVehicle.fleetNumber ? `Frota #${selectedVehicle.fleetNumber}` : selectedVehicle.plate}
                                    </Badge>
                                )}
                            </div>

                            <SearchableSelect
                                value={formData.vehicleId || ''}
                                fallbackLabel={formData.vehiclePlate ? `${formData.vehiclePlate}${formData.vehicleModel ? ` - ${formData.vehicleModel}` : ''}` : undefined}
                                onChange={handleSelectVehicle}
                                options={vehicleOptions}
                                placeholder="Selecione ou busque o veículo por placa ou código..."
                                searchPlaceholder="Buscar placa, prefixo, código ou modelo..."
                                emptyText={isLoadingVehicles ? "Carregando veículos da frota..." : "Nenhum veículo encontrado."}
                            />

                            {selectedVehicle ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-800/80 text-xs">
                                    <div className="bg-black/50 p-2.5 rounded-lg border border-gray-800">
                                        <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Veículo</span>
                                        <span className="text-white font-bold block truncate">
                                            {selectedVehicle.plate || '—'}
                                            {selectedVehicle.model ? ` · ${selectedVehicle.model}` : ''}
                                        </span>
                                    </div>

                                    <div className="bg-black/50 p-2.5 rounded-lg border border-gray-800">
                                        <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">KM Entrada (Atual)</span>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={formData.odometerIn ?? ''}
                                            onChange={e => setFormData(p => ({ ...p, odometerIn: parseInt(e.target.value) || undefined }))}
                                            placeholder="KM entrada"
                                            className="h-7 text-xs bg-seguranca-black border-gray-700 mt-1 font-mono text-emerald-400 font-bold"
                                        />
                                    </div>

                                    <div className="bg-black/50 p-2.5 rounded-lg border border-gray-800">
                                        <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Garagem / Pátio</span>
                                        <span className="text-gray-300 block truncate mt-1">
                                            {formData.garageName || selectedVehicle.garageName || 'Pátio Operacional'}
                                        </span>
                                    </div>

                                    <div className="bg-black/50 p-2.5 rounded-lg border border-gray-800">
                                        <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Cliente / Obra</span>
                                        <span className="text-gray-300 block truncate mt-1">
                                            {formData.workPostName || selectedVehicle.clientName || 'Geral'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic">
                                    Ao selecionar o veículo, a garagem, cliente/obra e quilometragem atual serão preenchidos automaticamente.
                                </p>
                            )}
                        </div>

                        {/* 2. Tipo de Manutenção, Prioridade e Mecânico */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tipo de Manutenção */}
                            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3 shadow-sm">
                                <Label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-amber-400" />
                                    2. Tipo de Manutenção *
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { type: MaintenanceType.CORRETIVA, label: 'Corretiva', icon: '🔧', desc: 'Reparo / Quebra' },
                                        { type: MaintenanceType.PREVENTIVA, label: 'Preventiva', icon: '📋', desc: 'Revisão periódica' },
                                        { type: MaintenanceType.LUBRIFICACAO, label: 'Lubrificação', icon: '🛢️', desc: 'Troca de óleo' },
                                        { type: MaintenanceType.LIMPEZA, label: 'Higienização', icon: '🧼', desc: 'Limpeza e lavagem' },
                                    ].map(opt => {
                                        const isSelected = (formData.maintenanceType || MaintenanceType.CORRETIVA) === opt.type;
                                        return (
                                            <button
                                                key={opt.type}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, maintenanceType: opt.type }))}
                                                className={`p-3 rounded-lg border text-left transition-all ${
                                                    isSelected
                                                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md ring-1 ring-amber-500/50'
                                                        : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 font-bold text-xs text-white">
                                                    <span className="text-base">{opt.icon}</span> {opt.label}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Prioridade & Mecânico */}
                            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3 shadow-sm">
                                <Label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                                    {isDriverUser ? '3. Prioridade de Atendimento' : '3. Prioridade & Mecânico'}
                                </Label>

                                <div>
                                    <span className="text-[11px] text-gray-400 block mb-1.5 uppercase font-medium">Prioridade de Atendimento</span>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[
                                            { key: WorkOrderPriority.LOW, label: 'Baixa', activeClass: 'bg-gray-700 text-gray-200 border-gray-500' },
                                            { key: WorkOrderPriority.MEDIUM, label: 'Média', activeClass: 'bg-blue-600/40 text-blue-200 border-blue-400' },
                                            { key: WorkOrderPriority.HIGH, label: 'Alta', activeClass: 'bg-orange-600/40 text-orange-200 border-orange-400' },
                                            { key: WorkOrderPriority.URGENT, label: 'Urgente', activeClass: 'bg-red-600/50 text-red-100 border-red-500 animate-pulse' },
                                        ].map(prio => {
                                            const isSelected = (formData.priority || WorkOrderPriority.MEDIUM) === prio.key;
                                            return (
                                                <button
                                                    key={prio.key}
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, priority: prio.key }))}
                                                    className={`py-2 px-1 rounded-lg border text-center text-xs font-bold transition-all ${
                                                        isSelected
                                                            ? `${prio.activeClass} shadow-sm ring-1 ring-white/20`
                                                            : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-700'
                                                    }`}
                                                >
                                                    {prio.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {!isDriverUser ? (
                                    <div className="pt-1">
                                        <span className="text-[11px] text-gray-400 block mb-1.5 uppercase font-medium">Mecânico / Responsável da Oficina (Opcional)</span>
                                        <SearchableSelect
                                            value={formData.mechanicId || ''}
                                            fallbackLabel={formData.mechanicName || undefined}
                                            onChange={(v, opt) => {
                                                setFormData(p => ({
                                                    ...p,
                                                    mechanicId: v,
                                                    mechanicName: opt ? opt.label : p.mechanicName
                                                }));
                                            }}
                                            options={mechanicOptions}
                                            placeholder={formData.mechanicName || "Selecionar mecânico (ou deixar na fila)..."}
                                            searchPlaceholder="Buscar mecânico..."
                                            emptyText="Nenhum mecânico encontrado."
                                        />
                                    </div>
                                ) : (
                                    <div className="pt-1 text-[11px] text-zinc-400 bg-black/30 border border-gray-800/80 rounded-lg p-2.5">
                                        <span className="font-semibold text-zinc-300 block">Mecânico / Responsável da Oficina:</span>
                                        Aguardando designação pelo Administrador ou Gestor de Manutenção.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Controles Preventivos de Componentes */}
                        {renderPreventiveComponentControls()}

                        {/* 4. Descrição de Serviços a Serem Feitos */}
                        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <Label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                                    4. Descrição de Serviços a Serem Feitos (Descreva detalhadamente) *
                                </Label>
                                <span className="text-[11px] text-gray-500">
                                    Clique nas queixas rápidas para preencher instantaneamente
                                </span>
                            </div>

                            {/* Chips Rápidos de Sintomas */}
                            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-black/40 border border-gray-800/80">
                                {QUICK_SYMPTOMS.map((symptom) => (
                                    <button
                                        key={symptom}
                                        type="button"
                                        onClick={() => handleAddSymptomChip(symptom)}
                                        className="text-[11px] px-2.5 py-1 rounded-full bg-gray-800/80 hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-gray-700/60 hover:border-amber-500/40 transition-all text-left flex items-center gap-1 active:scale-95 shadow-xs"
                                    >
                                        <Plus className="h-3 w-3 text-amber-400 shrink-0" />
                                        {symptom}
                                    </button>
                                ))}
                            </div>

                            <Textarea
                                value={formData.anomaliesDescription || formData.stopReason || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData(p => ({ ...p, anomaliesDescription: val, stopReason: val }));
                                }}
                                placeholder="Descreva a queixa do motorista ou motivo da manutenção (ex: barulho forte na suspensão, luz do freio no painel, vazamento de ar...)"
                                className="bg-seguranca-black border-gray-700 text-sm min-h-[95px] focus:border-amber-500"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* ── Seção 1: Tipo & Identificação ──────────────────────────── */}
                        <Section id="os-sec-identificacao" title="Identificação da OS" icon={<ClipboardList className="h-4 w-4 text-red-500" />}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Field label="Tipo de Manutenção *">
                                    <Select value={formData.maintenanceType || MaintenanceType.CORRETIVA}
                                        onValueChange={v => {
                                            const nextType = v as MaintenanceType;
                                            setFormData(p => ({
                                                ...p,
                                                maintenanceType: nextType,
                                                preventiveModel: nextType === MaintenanceType.PREVENTIVA ? (p.preventiveModel || 'MODELO_2') : p.preventiveModel
                                            }));
                                        }}>
                                        <SelectTrigger className="bg-seguranca-black border-gray-600 font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-seguranca-black border-gray-600">
                                            <SelectItem value={MaintenanceType.CORRETIVA}>🔧 CORRETIVA</SelectItem>
                                            <SelectItem value={MaintenanceType.PREVENTIVA}>📋 PREVENTIVA</SelectItem>
                                            <SelectItem value={MaintenanceType.PREDITIVA}>📊 PREDITIVA</SelectItem>
                                            <SelectItem value={MaintenanceType.INSPECAO}>🔍 INSPEÇÃO</SelectItem>
                                            <SelectItem value={MaintenanceType.LUBRIFICACAO}>🛢️ LUBRIFICAÇÃO</SelectItem>
                                            <SelectItem value={MaintenanceType.LIMPEZA}>🧼 HIGIENIZAÇÃO / LIMPEZA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                {formData.maintenanceType === MaintenanceType.PREVENTIVA && (
                                    <>
                                        <Field label="Modelo de OS Preventiva">
                                            <Select
                                                value={formData.preventiveModel || 'MODELO_2'}
                                                onValueChange={v => {
                                                    setFormData(p => ({ ...p, preventiveModel: v }));
                                                    handleLoadDefaultChecklist(undefined, null, v);
                                                }}
                                            >
                                                <SelectTrigger className="bg-seguranca-black border-emerald-600/70 font-semibold text-emerald-200"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                                    <SelectItem value="MODELO_2">Modelo 2 — Check-List Frota (Automático + Alternador 150k)</SelectItem>
                                                    <SelectItem value="MODELO_1">Modelo 1 — Checklist Completo Padrão</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                        <Field label="Perfil Operacional (Intervalo KM)">
                                            <Select
                                                value={formData.operationProfile || 'URBANO'}
                                                onValueChange={v => setFormData(p => ({ ...p, operationProfile: v }))}
                                            >
                                                <SelectTrigger className="bg-seguranca-black border-gray-600 font-semibold"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                                    <SelectItem value="URBANO">🚌 Urbano (10k óleo / 15k alternador / 150k rev. geral)</SelectItem>
                                                    <SelectItem value="RODOVIARIO">🛣️ Rodoviário (20k óleo / 15k alternador / 150k rev. geral)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </>
                                )}
                                <Field label="Equipamento / Veículo *">
                                    <SearchableSelect
                                        value={formData.vehicleId || ''}
                                        fallbackLabel={formData.vehiclePlate ? `${formData.vehiclePlate}${formData.vehicleModel ? ` - ${formData.vehicleModel}` : ''}` : undefined}
                                        onChange={handleSelectVehicle}
                                        options={vehicleOptions}
                                        placeholder="Selecione ou busque por placa ou código..."
                                        searchPlaceholder="Buscar placa, código, modelo ou marca..."
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
                        <Field label="Mecânico / Responsável (Opcional)">
                            <SearchableSelect
                                value={formData.mechanicId || ''}
                                fallbackLabel={formData.mechanicName || undefined}
                                onChange={(v, opt) => {
                                    setFormData(p => ({
                                        ...p,
                                        mechanicId: v,
                                        mechanicName: opt ? opt.label : p.mechanicName
                                    }));
                                }}
                                options={mechanicOptions}
                                placeholder={formData.mechanicName || "Selecione o mecânico / responsável (opcional)..."}
                                searchPlaceholder="Buscar mecânico por nome..."
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
                        <Field label="Cliente (Opcional)">
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
                        <Field label="Setor / Obra (Opcional)">
                            <SearchableSelect
                                value={formData.sectorId || formData.workPostId || ''}
                                fallbackLabel={formData.workPostName || undefined}
                                onChange={(v) => {
                                    const selectedWp = allWorkPosts.find((w: any) => w.id === v);
                                    setFormData(p => ({
                                        ...p,
                                        sectorId: v,
                                        workPostId: v,
                                        workPostName: selectedWp ? selectedWp.name : p.workPostName,
                                        clientId: (selectedWp && selectedWp.clientId) ? selectedWp.clientId : p.clientId
                                    }));
                                }}
                                options={workPostOptions}
                                placeholder={formData.clientId ? "Selecione a obra do cliente…" : "Selecione o setor / obra…"}
                                searchPlaceholder="Buscar setor ou obra por nome, código..."
                                emptyText={formData.clientId ? "Nenhuma obra cadastrada para este cliente." : "Nenhum setor/obra encontrado."}
                            />
                        </Field>
                        <Field label="Requerente (Opcional)">
                            <SearchableSelect
                                value={formData.requesterId || ''}
                                onChange={(v) => setFormData(p => ({ ...p, requesterId: v }))}
                                options={requesterOptions}
                                placeholder="Selecione o requerente (opcional)…"
                                searchPlaceholder="Buscar requerente por nome..."
                                emptyText="Nenhum colaborador encontrado."
                            />
                        </Field>
                        <Field label="Garagem de Execução">
                            <SearchableSelect
                                value={formData.garageId || ''}
                                fallbackLabel={formData.garageName || undefined}
                                onChange={(v, opt) => {
                                    setFormData(p => ({ ...p, garageId: v, garageName: opt ? opt.label : p.garageName }));
                                }}
                                options={garageOptions}
                                placeholder="Selecione a garagem…"
                                searchPlaceholder="Buscar garagem por nome..."
                                emptyText="Nenhuma garagem encontrada."
                            />
                        </Field>
                        <Field label="Motorista">
                            <Input
                                value={formData.driverName || ''}
                                onChange={e => setFormData(p => ({ ...p, driverName: e.target.value }))}
                                readOnly={isDriverUser}
                                disabled={isDriverUser}
                                placeholder="Nome do motorista"
                                className="bg-seguranca-black border-gray-600"
                            />
                        </Field>
                        <Field label="Data da Solicitação">
                            <Input
                                type="date"
                                value={formData.requestDate || ''}
                                onChange={e => setFormData(p => ({ ...p, requestDate: e.target.value }))}
                                className="bg-seguranca-black border-gray-600"
                            />
                        </Field>
                    </div>
                </Section>

                {/* ── Seção 2: Dados de Parada e Saída ────────────────────────────── */}
                <Section id="os-sec-parada" title="Dados da Parada & Saída" icon={<Gauge className="h-4 w-4 text-yellow-500" />}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
                        <Field label="Data da Parada *">
                            <Input type="date" value={formData.stopDate || ''} onChange={e => setFormData(p => ({ ...p, stopDate: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Hora da Parada *">
                            <Input type="time" value={formData.stopTime || ''} onChange={e => setFormData(p => ({ ...p, stopTime: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Data de Saída">
                            <Input type="date" value={formData.exitDate || ''} onChange={e => setFormData(p => ({ ...p, exitDate: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Hora de Saída">
                            <Input type="time" value={formData.exitTime || ''} onChange={e => setFormData(p => ({ ...p, exitTime: e.target.value }))} className="bg-seguranca-black border-gray-600" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 items-end">
                        <Field label="Odômetro / KM Parada">
                            <Input type="number" min={0} value={formData.odometerIn ?? ''} onChange={e => setFormData(p => ({ ...p, odometerIn: parseInt(e.target.value) || undefined }))} placeholder="Ex: 120500" className="bg-seguranca-black border-gray-600" />
                        </Field>
                        <Field label="Odômetro / KM Saída">
                            <Input type="number" min={0} value={formData.odometerOut ?? ''} onChange={e => setFormData(p => ({ ...p, odometerOut: parseInt(e.target.value) || undefined }))} placeholder="Ex: 120520" className="bg-seguranca-black border-gray-600" />
                        </Field>
                    </div>
                </Section>

                {/* ── Seção 3: Tempo de Execução do Serviço ───────────────────────── */}
                <Section
                    id="os-sec-execucao"
                    title="Tempo de Execução do Serviço"
                    icon={<Timer className="h-4 w-4 text-emerald-400" />}
                    action={
                        isEdit && order?.id ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLoadExecutionHistory}
                                    className="h-7 text-xs border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white"
                                >
                                    <History className="h-3 w-3 mr-1 text-blue-400" />
                                    Histórico de Correções
                                </Button>
                            </div>
                        ) : null
                    }
                >
                    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Início da Execução */}
                            <div className="space-y-1.5 p-3 rounded-lg bg-black/40 border border-gray-800">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                        <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
                                        Início da Execução
                                    </Label>
                                    {isEdit && order?.executionStartDate && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleOpenCorrectionModal}
                                            className="h-6 text-[11px] px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40"
                                            title="Corrigir horário de início com justificativa obrigatória"
                                        >
                                            <Edit className="h-3 w-3 mr-1" /> Corrigir com Justificativa
                                        </Button>
                                    )}
                                </div>
                                <Input
                                    type="datetime-local"
                                    value={formData.executionStartDate ? formData.executionStartDate.substring(0, 16) : ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData(p => ({
                                            ...p,
                                            executionStartDate: val ? (val.length === 16 ? `${val}:00` : val) : undefined
                                        }));
                                    }}
                                    className="bg-seguranca-black border-gray-700 text-sm focus:border-emerald-500"
                                />
                                <p className="text-[11px] text-gray-400">
                                    Preenchido automaticamente ao entregar itens no Almoxarifado ou ao iniciar a manutenção.
                                </p>
                            </div>

                            {/* Término da Execução */}
                            <div className="space-y-1.5 p-3 rounded-lg bg-black/40 border border-gray-800">
                                <Label className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                                    <StopCircle className="h-3.5 w-3.5 text-blue-400" />
                                    Término da Execução
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.executionEndDate ? formData.executionEndDate.substring(0, 16) : ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData(p => ({
                                            ...p,
                                            executionEndDate: val ? (val.length === 16 ? `${val}:00` : val) : undefined
                                        }));
                                    }}
                                    className="bg-seguranca-black border-gray-700 text-sm focus:border-blue-500"
                                />
                                <p className="text-[11px] text-gray-400">
                                    Preenchido ao concluir as atividades mecânicas da OS.
                                </p>
                            </div>
                        </div>

                        {/* Apuração Automática da Duração */}
                        <div className="rounded-lg p-3 bg-gradient-to-r from-emerald-950/30 via-gray-900/40 to-blue-950/30 border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                                        Tempo Total de Execução Calculado
                                    </span>
                                    <span className="text-base font-bold text-emerald-300">
                                        {calculatedDuration
                                            ? formatDurationString(calculatedDuration)
                                            : (formData.executionDurationMinutes
                                                ? formatDurationString({
                                                    days: Math.floor(formData.executionDurationMinutes / 1440),
                                                    hours: Math.floor((formData.executionDurationMinutes % 1440) / 60),
                                                    minutes: formData.executionDurationMinutes % 60
                                                })
                                                : 'Aguardando definição de início e término')}
                                    </span>
                                </div>
                            </div>

                            {calculatedDuration?.isRunning && (
                                <Badge className="bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2.5 py-1 text-xs self-start sm:self-auto flex items-center gap-1.5 animate-pulse">
                                    <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                                    Em execução contínua
                                </Badge>
                            )}

                            {calculatedDuration && !calculatedDuration.isRunning && (
                                <Badge className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 text-xs self-start sm:self-auto flex items-center gap-1.5">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                    Execução Finalizada
                                </Badge>
                            )}
                        </div>

                        {/* Justificativa da última correção se houver */}
                        {formData.executionStartJustification && (
                            <div className="text-xs bg-amber-950/30 border border-amber-800/40 rounded-lg p-2.5 text-amber-200/90 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold text-amber-300">Justificativa do Início:</span>{' '}
                                    {formData.executionStartJustification}
                                </div>
                            </div>
                        )}
                    </div>
                </Section>

                        {/* ── Seção Dinâmica Corretiva vs Preventiva ──────────────────────── */}
                        {renderPreventiveComponentControls()}
                {formData.maintenanceType === MaintenanceType.CORRETIVA ? (
                    <Section id="os-sec-diagnostico" title="Manutenção Corretiva — Serviços Solicitados" icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}>
                        <Field label="Descrição de Serviços a Serem Feitos (Descreva detalhadamente) *">
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
                    <Section
                        id="os-sec-diagnostico"
                        title={formData.preventiveModel === 'MODELO_2'
                            ? `Checklist de Inspeção Preventiva — Modelo 2 (${formData.operationProfile || 'URBANO'})`
                            : 'Checklist de Inspeção Preventiva — Modelo 1'}
                        icon={<ClipboardList className="h-4 w-4 text-green-500" />}
                        action={
                            <div className="flex flex-wrap items-center gap-2 justify-end">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleMarkAllChecklistOk}
                                    disabled={isLoadingChecklist}
                                    className="h-8 px-3 bg-green-600 hover:bg-green-700 !text-white font-bold text-xs shadow-sm"
                                    title="Preenche todos os itens do checklist como OK em verde com um único clique"
                                >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Preencher Todos com OK
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAllChecklist}
                                    disabled={isLoadingChecklist || !formData.checklistItems?.length}
                                    className="h-8 px-2.5 border-gray-600 text-gray-300 hover:bg-gray-800 text-xs font-semibold"
                                    title="Limpa as marcações para preencher individualmente ou imprimir em branco"
                                >
                                    ⬜ Deixar em Branco
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateAndPreviewOS(true)}
                                    disabled={isLoading || isGeneratingPdf}
                                    className="h-8 px-3 border-amber-500/80 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs shadow-sm"
                                    title="Gera o PDF com os campos em branco para preenchimento manual com caneta"
                                >
                                    <FileText className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                                    Gerar PDF em Branco (Manual)
                                </Button>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            {formData.checklistItems && formData.checklistItems.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-seguranca-black border border-gray-800 text-xs">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="bg-green-600 !text-white font-bold">
                                            ✓ {(formData.checklistItems || []).filter(i => i.situacao === ChecklistStatus.OK).length} / {formData.checklistItems.length} OK
                                        </Badge>
                                        <span className="text-gray-400">
                                            Clique em <b>"Preencher Todos com OK"</b> para marcar todos de uma vez ou clique no botão <b>OK</b> verde de cada item individualmente.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {Object.keys(checklistByCategory).length === 0 ? (
                                <div className="p-6 rounded-lg border border-dashed border-gray-800 bg-black/30 text-center space-y-3">
                                    <ClipboardList className="h-8 w-8 text-gray-500 mx-auto" />
                                    <p className="text-sm text-gray-400">
                                        {isLoadingChecklist ? 'Carregando itens de inspeção preventiva...' : 'Nenhum item de inspeção carregado para esta OS.'}
                                    </p>
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleLoadDefaultChecklist(undefined, ChecklistStatus.OK)}
                                            disabled={isLoadingChecklist}
                                            className="bg-green-600 hover:bg-green-700 !text-white font-bold"
                                        >
                                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                            Carregar e Marcar Todos OK
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleLoadDefaultChecklist(undefined, null)}
                                            disabled={isLoadingChecklist}
                                            className="border-gray-600 text-gray-300"
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingChecklist ? 'animate-spin' : ''}`} />
                                            Carregar em Branco (Preencher Individual)
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                Object.entries(checklistByCategory).map(([category, items]) => {
                                    const allCatOk = items.every(({ item }) => item.situacao === ChecklistStatus.OK);
                                    return (
                                        <div key={category} className="border border-gray-800 rounded-lg p-3 bg-gray-900/40 space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-green-400 flex items-center gap-2">
                                                    <span>•</span> {category}
                                                    <span className="text-[10px] font-mono text-gray-400">
                                                        ({items.filter(x => x.item.situacao === ChecklistStatus.OK).length}/{items.length} OK)
                                                    </span>
                                                </h4>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => handleMarkCategoryOk(category)}
                                                    className={`h-7 px-2.5 text-[11px] font-bold ${
                                                        allCatOk
                                                            ? 'bg-green-600 !text-white shadow-sm'
                                                            : 'bg-green-600/15 hover:bg-green-600 text-green-500 hover:!text-white border border-green-600/40'
                                                    }`}
                                                >
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Marcar {category} OK
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                {items.map(({ item, originalIndex }) => (
                                                    <div key={originalIndex} className="p-2.5 bg-black/40 rounded border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                        <div className="flex-1 flex items-center gap-2">
                                                            {item.situacao === ChecklistStatus.OK && (
                                                                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                                            )}
                                                            <p className="text-sm font-medium text-gray-200">{item.checklistItemDescricao}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={item.situacao === ChecklistStatus.OK ? 'default' : 'outline'}
                                                                onClick={() => handleChecklistStatusChange(originalIndex, ChecklistStatus.OK)}
                                                                className={`h-8 px-2.5 text-xs font-bold transition-all ${
                                                                    item.situacao === ChecklistStatus.OK
                                                                        ? 'bg-green-600 hover:bg-green-700 !text-white border-green-600 shadow-sm'
                                                                        : 'border-green-600/50 text-green-500 hover:bg-green-600 hover:!text-white'
                                                                }`}
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> OK
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={item.situacao === ChecklistStatus.NAO_OK ? 'default' : 'outline'}
                                                                onClick={() => handleChecklistStatusChange(originalIndex, ChecklistStatus.NAO_OK)}
                                                                className={`h-8 px-2 text-xs font-bold ${
                                                                    item.situacao === ChecklistStatus.NAO_OK
                                                                        ? 'bg-red-600 !text-white border-red-600'
                                                                        : 'border-gray-700 text-gray-400 hover:bg-red-600/20'
                                                                }`}
                                                            >
                                                                <XCircle className="h-3.5 w-3.5 mr-1" /> NÃO OK
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={item.situacao === ChecklistStatus.TROCAR ? 'default' : 'outline'}
                                                                onClick={() => handleChecklistStatusChange(originalIndex, ChecklistStatus.TROCAR)}
                                                                className={`h-8 px-2 text-xs font-bold ${
                                                                    item.situacao === ChecklistStatus.TROCAR
                                                                        ? 'bg-amber-600 !text-white border-amber-600'
                                                                        : 'border-gray-700 text-gray-400 hover:bg-amber-600/20'
                                                                }`}
                                                            >
                                                                <RefreshCw className="h-3.5 w-3.5 mr-1" /> TROCAR
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={item.situacao === ChecklistStatus.NAO_APLICA ? 'default' : 'outline'}
                                                                onClick={() => handleChecklistStatusChange(originalIndex, ChecklistStatus.NAO_APLICA)}
                                                                className={`h-8 px-2 text-xs font-bold ${
                                                                    item.situacao === ChecklistStatus.NAO_APLICA
                                                                        ? 'bg-gray-600 !text-white border-gray-600'
                                                                        : 'border-gray-700 text-gray-400'
                                                                }`}
                                                            >
                                                                <MinusCircle className="h-3.5 w-3.5 mr-1" /> N/A
                                                            </Button>
                                                        </div>
                                                        {(item.situacao === ChecklistStatus.NAO_OK || item.situacao === ChecklistStatus.TROCAR) && (
                                                            <div className="w-full md:w-1/2 flex flex-col gap-1.5 mt-2 md:mt-0">
                                                                <Input value={item.observacao || ''} onChange={e => handleChecklistTextChange(originalIndex, 'observacao', e.target.value)}
                                                                    placeholder={item.situacao === ChecklistStatus.TROCAR ? "Item a ser trocado / motivo da troca…" : "Observação da anomalia…"}
                                                                    className={`bg-seguranca-black text-xs h-8 ${item.situacao === ChecklistStatus.TROCAR ? 'border-amber-700' : 'border-red-900'}`} />
                                                                <Input value={item.reparoRealizado || ''} onChange={e => handleChecklistTextChange(originalIndex, 'reparoRealizado', e.target.value)}
                                                                    placeholder="Reparo executado para corrigir…" className="bg-seguranca-black border-green-900 text-xs h-8" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
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
                            <div className="flex items-center gap-2 flex-wrap shrink-0">
                                <label className={`cursor-pointer inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 !text-white text-xs font-bold px-3 py-2 rounded-md transition-colors ${isUploadingPhotos ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <Camera className="h-4 w-4" /> Tirar Foto (Câmera)
                                    <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                                </label>
                                <label className={`cursor-pointer inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 !text-white text-xs font-bold px-3 py-2 rounded-md transition-colors ${isUploadingPhotos ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <UploadCloud className="h-4 w-4" /> {isUploadingPhotos ? 'Enviando...' : 'Galeria'}
                                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>
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
                            <Button type="button" size="sm" onClick={handleAddPhotoUrl} disabled={!newPhotoUrl.trim()} className="bg-blue-600 hover:bg-blue-700 !text-white font-semibold text-xs">
                                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar URL
                            </Button>
                        </div>

                        {/* Grid de Previews */}
                        {formData.photoAttachments && formData.photoAttachments.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                {formData.photoAttachments.map((photo, idx) => {
                                    const trimmed = photo.trim();
                                    const photoSrc = trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')
                                        ? trimmed
                                        : (trimmed.startsWith('/api/uploads/')
                                            ? trimmed
                                            : (trimmed.startsWith('/uploads/')
                                                ? `/api${trimmed}`
                                                : (trimmed.startsWith('/') ? `/api/uploads${trimmed}` : `/api/uploads/maintenance/${trimmed}`)));

                                    return (
                                        <div key={idx} className="relative group border border-gray-700 rounded-lg overflow-hidden bg-black/60 aspect-video flex items-center justify-center">
                                            <img
                                                src={photoSrc}
                                                alt={`Evidência ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.currentTarget;
                                                    if (!target.dataset.fallbackTried && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:') && !trimmed.startsWith('http')) {
                                                        target.dataset.fallbackTried = '1';
                                                        const cleanRel = trimmed
                                                            .replace(/^\/+/, '')
                                                            .replace(/^api\/uploads\//, '')
                                                            .replace(/^uploads\//, '');
                                                        const nextSrc = `/api/uploads/${cleanRel}`;
                                                        if (nextSrc !== photoSrc) {
                                                            target.src = nextSrc;
                                                            return;
                                                        }
                                                    }
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        const fallback = parent.querySelector('.photo-error-fallback') as HTMLElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }
                                                }}
                                            />
                                            <div className="photo-error-fallback hidden w-full h-full flex-col items-center justify-center p-2 text-center bg-gray-900/90 text-gray-400">
                                                <LucideImage className="h-5 w-5 text-gray-500 mb-1" />
                                                <span className="text-[10px] truncate max-w-full px-1 text-gray-300 font-mono">
                                                    {photo.split('/').pop() || `Evidência ${idx + 1}`}
                                                </span>
                                                <span className="text-[9px] text-amber-400">Arquivo antigo indisponível (envie novamente)</span>
                                            </div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <a href={photoSrc} target="_blank" rel="noreferrer" title="Visualizar em tamanho real" className="p-1.5 bg-gray-900/80 rounded-full text-white hover:bg-gray-800">
                                                    <LucideImage className="h-4 w-4" />
                                                </a>
                                                <button type="button" onClick={() => handleRemovePhoto(idx)} title="Remover foto" className="p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] !text-white pointer-events-none">
                                                Foto #{idx + 1}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Section>

                {/* ── Seção 5: Peças e Serviços ──────────────────────────────── */}
                <Section
                    id="os-sec-itens"
                    title="Peças e Serviços Utilizados"
                    icon={<Wrench className="h-4 w-4 text-blue-400" />}
                    action={
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            {order?.id && outOfStockParts.length > 0 && (
                                unnotifiedParts.length === 0 ? (
                                    <Badge className="bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 text-xs px-2.5 py-1.5 flex items-center gap-1.5 shrink-0">
                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                        ✓ Almoxarifado Já Notificado
                                    </Badge>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isRequestingPurchase}
                                        onClick={handleNotifyAlmoxarifado}
                                        className="border-amber-600/60 bg-amber-950/30 text-amber-300 hover:bg-amber-500/20 text-xs h-8"
                                        title="Notificar Almoxarifado sobre peças sem estoque nesta OS"
                                    >
                                        <Send className="h-3.5 w-3.5 mr-1 text-amber-400" />
                                        {isRequestingPurchase ? 'Notificando...' : `📦 Notificar Almoxarifado (${unnotifiedParts.length})`}
                                    </Button>
                                )
                            )}
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
                                onClick={() => {
                                    setTargetItemIndexForService(null);
                                    setNewServiceName('');
                                    setNewServicePrice('');
                                    setNewServiceDescription('');
                                    setIsNewServiceModalOpen(true);
                                }}
                                className="border-blue-600/60 text-blue-400 hover:bg-blue-500/10 text-xs h-8"
                                title="Cadastrar novo serviço no catálogo da Oficina e adicionar à OS"
                            >
                                <Wrench className="h-3.5 w-3.5 mr-1" />+ Novo Serviço / Oficina
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

                        {outOfStockParts.length > 0 && (
                            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-md flex items-center justify-between gap-3 text-xs text-amber-200">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                                    <span>
                                        Existem <strong>{outOfStockParts.length} peça(s)</strong> nesta OS sem saldo em estoque no Almoxarifado.
                                        {unnotifiedParts.length === 0
                                            ? " O Almoxarifado já foi notificado e está providenciando cotações com fornecedores."
                                            : " Notifique o Almoxarifado para criar solicitações de compra e cotações com fornecedores."}
                                    </span>
                                </div>
                                {order?.id ? (
                                    unnotifiedParts.length === 0 ? (
                                        <Badge className="bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 text-xs px-2.5 py-1 flex items-center gap-1.5 shrink-0">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                            ✓ Já Notificado ao Almoxarifado
                                        </Badge>
                                    ) : (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={isRequestingPurchase}
                                            onClick={handleNotifyAlmoxarifado}
                                            className="border-amber-600 bg-amber-900/50 text-amber-200 hover:bg-amber-800/70 shrink-0 text-xs h-7 font-medium"
                                        >
                                            <Send className="h-3 w-3 mr-1 text-amber-400" />
                                            {isRequestingPurchase ? 'Notificando...' : `Notificar Almoxarifado (${unnotifiedParts.length})`}
                                        </Button>
                                    )
                                ) : (
                                    <span className="text-[11px] text-amber-400/80 italic shrink-0">(Salve a OS para notificar)</span>
                                )}
                            </div>
                        )}

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
                                                                    value={
                                                                        (item.productId && stockItems.some(s => s.id === item.productId))
                                                                            ? item.productId
                                                                            : stockItems.find(s => 
                                                                                (item.code && s.code && s.code.trim().toLowerCase() === item.code.trim().toLowerCase()) ||
                                                                                (item.description && s.name && s.name.trim().toLowerCase() === item.description.trim().toLowerCase()) ||
                                                                                (item.description && s.fullName && s.fullName.trim().toLowerCase() === item.description.trim().toLowerCase())
                                                                              )?.id || (item.productId || '')
                                                                    }
                                                                    fallbackLabel={
                                                                        item.description 
                                                                            ? (item.code ? `[${item.code}] ${item.description}` : item.description) 
                                                                            : (item.code ? `Cód: ${item.code}` : undefined)
                                                                    }
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
                                                                value={
                                                                    servicesCatalog.find(s => 
                                                                        (item.code && s.code && s.code.trim().toLowerCase() === item.code.trim().toLowerCase()) ||
                                                                        (item.description && s.name && s.name.trim().toLowerCase() === item.description.trim().toLowerCase())
                                                                    )?.id || ''
                                                                }
                                                                fallbackLabel={
                                                                    item.description 
                                                                        ? (item.code ? `[${item.code}] ${item.description}` : item.description) 
                                                                        : (item.code ? `[${item.code}] Serviço` : undefined)
                                                                }
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
                <Section id="os-sec-custos" title="Resumo de Custos" icon={<AlertTriangle className="h-4 w-4 text-green-400" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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


                {/* ── Seção 7: Responsáveis e Assinaturas Digitais ──────────────────────── */}
                <Section id="os-sec-assinaturas" title="Responsáveis & Assinaturas" icon={<UserCheck className="h-4 w-4 text-purple-400" />}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                        {/* Card Responsável Técnico / Mecânico */}
                        <div className="p-4 border border-gray-800 rounded-xl bg-gray-950/90 flex flex-col gap-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs text-gray-300 font-semibold uppercase tracking-wide">
                                        1. Responsável Técnico / Mecânico
                                    </Label>
                                    {formData.responsibleSignature?.startsWith('data:image/') ? (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            Assinado
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                                            Opcional
                                        </span>
                                    )}
                                </div>
                                <SearchableSelect
                                    value={formData.responsibleId || ''}
                                    fallbackLabel={formData.responsibleName || undefined}
                                    onChange={(v, opt) => {
                                        setFormData(p => ({
                                            ...p,
                                            responsibleId: v || undefined,
                                            responsibleName: opt ? opt.label : (v ? p.responsibleName : undefined),
                                        }));
                                        setShowResignResp(false);
                                    }}
                                    options={technicalResponsibleOptions}
                                    placeholder="Selecione o funcionário / mecânico..."
                                    searchPlaceholder="Buscar funcionário ou mecânico..."
                                    emptyText="Nenhum colaborador encontrado."
                                />
                            </div>

                            {(formData.responsibleId || formData.responsibleName || formData.responsibleSignature?.startsWith('data:image/')) ? (
                                formData.responsibleSignature?.startsWith('data:image/') && !showResignResp ? (
                                    <div className="space-y-2.5 p-3 rounded-lg bg-black/50 border border-emerald-500/30">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                                                <CheckCircle className="h-3.5 w-3.5" /> Assinatura Digital Capturada
                                            </span>
                                            {formData.responsibleSignatureDate && (
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(formData.responsibleSignatureDate).toLocaleString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-white rounded-md p-2 flex items-center justify-center border border-gray-300">
                                            <img
                                                src={formData.responsibleSignature}
                                                alt="Assinatura Responsável Técnico"
                                                className="max-h-24 object-contain"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowResignResp(true)}
                                                className="flex-1 h-8 text-xs border-gray-700 text-gray-300 hover:text-white"
                                            >
                                                <PenLine className="h-3.5 w-3.5 mr-1.5" /> Reassinar
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setFormData(p => ({ ...p, responsibleSignature: '', responsibleSignatureDate: undefined }));
                                                    setShowResignResp(false);
                                                }}
                                                className="flex-1 h-8 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                                            >
                                                <Eraser className="h-3.5 w-3.5 mr-1.5" /> Remover (Linha Vazia PDF)
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 p-3 rounded-lg bg-black/50 border border-gray-800">
                                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                                            <span className="flex items-center gap-1.5 text-purple-300 font-medium truncate">
                                                <PenLine className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">Assinatura Digital — {formData.responsibleName || 'Técnico'}</span>
                                            </span>
                                            {showResignResp && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowResignResp(false)}
                                                    className="text-xs text-gray-400 hover:text-white underline shrink-0 ml-2"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                        <SignaturePad
                                            compact
                                            signerName={formData.responsibleName}
                                            onSave={(dataUrl) => {
                                                setFormData(p => ({
                                                    ...p,
                                                    responsibleSignature: dataUrl,
                                                    responsibleSignatureDate: new Date().toISOString()
                                                }));
                                                setShowResignResp(false);
                                                toast({ title: 'Assinatura registrada', description: 'Assinatura digital do Responsável Técnico confirmada.' });
                                            }}
                                            onClear={() => {
                                                setFormData(p => ({ ...p, responsibleSignature: '', responsibleSignatureDate: undefined }));
                                            }}
                                        />
                                        <p className="text-[10px] text-gray-500 leading-relaxed">
                                            Opcional: assine com o dedo no celular/tablet e clique em Confirmar. Se não assinar, a linha sairá em branco no PDF.
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="p-3 rounded-lg border border-dashed border-gray-800 bg-black/30 text-center text-xs text-gray-500">
                                    Selecione o funcionário/mecânico acima para habilitar a assinatura digital (ou deixe sem assinar para linha em branco no PDF).
                                </div>
                            )}
                        </div>

                        {/* Card Supervisor / Gerente / Encarregado */}
                        <div className="p-4 border border-gray-800 rounded-xl bg-gray-950/90 flex flex-col gap-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs text-gray-300 font-semibold uppercase tracking-wide">
                                        2. Assinatura / Supervisor
                                    </Label>
                                    {formData.supervisorSignature?.startsWith('data:image/') ? (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            Assinado
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                                            Opcional
                                        </span>
                                    )}
                                </div>
                                <SearchableSelect
                                    value={formData.supervisorId || ''}
                                    fallbackLabel={formData.supervisorName || undefined}
                                    onChange={(v, opt) => {
                                        setFormData(p => ({
                                            ...p,
                                            supervisorId: v || undefined,
                                            supervisorName: opt ? opt.label : (v ? p.supervisorName : undefined),
                                        }));
                                        setShowResignSup(false);
                                    }}
                                    options={supervisorOptions}
                                    placeholder="Selecione Encarregado, Gestor, Mecânico, Eng. ou Gerente..."
                                    searchPlaceholder="Buscar por nome ou cargo..."
                                    emptyText="Nenhum responsável encontrado."
                                />
                            </div>

                            {(formData.supervisorId || formData.supervisorName || formData.supervisorSignature?.startsWith('data:image/')) ? (
                                formData.supervisorSignature?.startsWith('data:image/') && !showResignSup ? (
                                    <div className="space-y-2.5 p-3 rounded-lg bg-black/50 border border-emerald-500/30">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                                                <CheckCircle className="h-3.5 w-3.5" /> Assinatura Digital Capturada
                                            </span>
                                            {formData.supervisorSignatureDate && (
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(formData.supervisorSignatureDate).toLocaleString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-white rounded-md p-2 flex items-center justify-center border border-gray-300">
                                            <img
                                                src={formData.supervisorSignature}
                                                alt="Assinatura Supervisor"
                                                className="max-h-24 object-contain"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowResignSup(true)}
                                                className="flex-1 h-8 text-xs border-gray-700 text-gray-300 hover:text-white"
                                            >
                                                <PenLine className="h-3.5 w-3.5 mr-1.5" /> Reassinar
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setFormData(p => ({ ...p, supervisorSignature: '', supervisorSignatureDate: undefined }));
                                                    setShowResignSup(false);
                                                }}
                                                className="flex-1 h-8 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                                            >
                                                <Eraser className="h-3.5 w-3.5 mr-1.5" /> Remover (Linha Vazia PDF)
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 p-3 rounded-lg bg-black/50 border border-gray-800">
                                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                                            <span className="flex items-center gap-1.5 text-purple-300 font-medium truncate">
                                                <PenLine className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">Assinatura Digital — {formData.supervisorName || 'Supervisor'}</span>
                                            </span>
                                            {showResignSup && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowResignSup(false)}
                                                    className="text-xs text-gray-400 hover:text-white underline shrink-0 ml-2"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                        <SignaturePad
                                            compact
                                            signerName={formData.supervisorName}
                                            onSave={(dataUrl) => {
                                                setFormData(p => ({
                                                    ...p,
                                                    supervisorSignature: dataUrl,
                                                    supervisorSignatureDate: new Date().toISOString()
                                                }));
                                                setShowResignSup(false);
                                                toast({ title: 'Assinatura registrada', description: 'Assinatura digital do Supervisor confirmada.' });
                                            }}
                                            onClear={() => {
                                                setFormData(p => ({ ...p, supervisorSignature: '', supervisorSignatureDate: undefined }));
                                            }}
                                        />
                                        <p className="text-[10px] text-gray-500 leading-relaxed">
                                            Opcional: assine com o dedo no celular/tablet e clique em Confirmar. Se não assinar, a linha sairá em branco no PDF.
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="p-3 rounded-lg border border-dashed border-gray-800 bg-black/30 text-center text-xs text-gray-500">
                                    Selecione o supervisor (Encarregado, Gestor, Mecânico, Eng. Mecânico ou Gerente) para habilitar a assinatura digital.
                                </div>
                            )}
                        </div>

                        {/* Card 3: Conferência dos Serviços & Liberação do Veículo */}
                        <div className="lg:col-span-2 p-4 border border-gray-800 rounded-xl bg-gray-950/90 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-800">
                                <Label className="text-xs text-amber-400 font-bold uppercase tracking-wide">
                                    3. Conferência dos Serviços &amp; Liberação do Veículo
                                </Label>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs text-gray-300 font-medium">
                                        Os serviços acima descritos foram realizados e conferidos?
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, servicesVerified: true }))}
                                            className={`px-3 py-1 rounded-md border text-xs font-bold transition-all ${
                                                formData.servicesVerified === true
                                                    ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                                                    : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'
                                            }`}
                                        >
                                            ( {formData.servicesVerified === true ? 'X' : ' '} ) Sim
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, servicesVerified: false }))}
                                            className={`px-3 py-1 rounded-md border text-xs font-bold transition-all ${
                                                formData.servicesVerified === false
                                                    ? 'bg-red-600 border-red-400 text-white shadow'
                                                    : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'
                                            }`}
                                        >
                                            ( {formData.servicesVerified === false ? 'X' : ' '} ) Não
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Data da Liberação do Veículo">
                                    <Input
                                        type="date"
                                        value={formData.releaseDate || ''}
                                        onChange={e => setFormData(p => ({ ...p, releaseDate: e.target.value }))}
                                        className="bg-seguranca-black border-gray-600"
                                    />
                                </Field>
                                <Field label="Hora da Liberação do Veículo">
                                    <Input
                                        type="time"
                                        value={formData.releaseTime || ''}
                                        onChange={e => setFormData(p => ({ ...p, releaseTime: e.target.value }))}
                                        className="bg-seguranca-black border-gray-600"
                                    />
                                </Field>
                                <Field label="Responsável pela Liberação do Veículo (Nome)">
                                    <Input
                                        value={formData.releasedByName || ''}
                                        onChange={e => setFormData(p => ({ ...p, releasedByName: e.target.value }))}
                                        placeholder="Nome completo do responsável..."
                                        className="bg-seguranca-black border-gray-600"
                                    />
                                </Field>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs text-gray-300 font-semibold uppercase tracking-wide">
                                        Assinatura (Liberação do Veículo)
                                    </Label>
                                    {formData.releaseSignature?.startsWith('data:image/') ? (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            Assinado
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                                            Opcional (linha em branco no PDF se vazio)
                                        </span>
                                    )}
                                </div>

                                {formData.releaseSignature?.startsWith('data:image/') && !showResignRel ? (
                                    <div className="space-y-2.5 p-3 rounded-lg bg-black/50 border border-emerald-500/30">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                                                <CheckCircle className="h-3.5 w-3.5" /> Assinatura Digital Capturada
                                            </span>
                                            {formData.releaseSignatureDate && (
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(formData.releaseSignatureDate).toLocaleString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-white rounded-md p-2 flex items-center justify-center border border-gray-300">
                                            <img
                                                src={formData.releaseSignature}
                                                alt="Assinatura Liberação do Veículo"
                                                className="max-h-24 object-contain"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowResignRel(true)}
                                                className="flex-1 h-8 text-xs border-gray-700 text-gray-300 hover:text-white"
                                            >
                                                <PenLine className="h-3.5 w-3.5 mr-1.5" /> Reassinar
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setFormData(p => ({ ...p, releaseSignature: '', releaseSignatureDate: undefined }));
                                                    setShowResignRel(false);
                                                }}
                                                className="flex-1 h-8 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                                            >
                                                <Eraser className="h-3.5 w-3.5 mr-1.5" /> Remover (Linha Vazia PDF)
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 p-3 rounded-lg bg-black/50 border border-gray-800">
                                        {showResignRel && (
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowResignRel(false)}
                                                    className="text-xs text-gray-400 hover:text-white underline"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                        <SignaturePad
                                            compact
                                            signerName={formData.releasedByName}
                                            onSave={(dataUrl) => {
                                                setFormData(p => ({
                                                    ...p,
                                                    releaseSignature: dataUrl,
                                                    releaseSignatureDate: new Date().toISOString()
                                                }));
                                                setShowResignRel(false);
                                                toast({ title: 'Assinatura registrada', description: 'Assinatura da Liberação do Veículo confirmada.' });
                                            }}
                                            onClear={() => {
                                                setFormData(p => ({ ...p, releaseSignature: '', releaseSignatureDate: undefined }));
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
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

            {/* Modal de Correção de Início com Justificativa */}
            {showCorrectionModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Edit className="h-5 w-5 text-amber-400" />
                                <h3 className="text-base font-bold text-white">Corrigir Início da Execução</h3>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setShowCorrectionModal(false)} className="h-7 w-7 p-0 text-gray-400">✕</Button>
                        </div>

                        <p className="text-xs text-gray-400">
                            Qualquer alteração na data e hora em que a manutenção foi iniciada requer justificativa obrigatória e será registrada no histórico de auditoria da OS.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-gray-300">Nova Data *</Label>
                                <Input type="date" value={correctionNewDate} onChange={e => setCorrectionNewDate(e.target.value)} className="bg-black/60 border-gray-700" />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-300">Novo Horário *</Label>
                                <Input type="time" value={correctionNewTime} onChange={e => setCorrectionNewTime(e.target.value)} className="bg-black/60 border-gray-700" />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-gray-300">Justificativa da Correção *</Label>
                            <Textarea
                                value={correctionJustification}
                                onChange={e => setCorrectionJustification(e.target.value)}
                                placeholder="Descreva detalhadamente o motivo da correção (ex: Peças foram entregues às 08:30 mas o lançamento ocorreu apenas às 10:15)..."
                                className="bg-black/60 border-gray-700 min-h-[90px] text-sm text-gray-200"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCorrectionModal(false)} disabled={isSavingCorrection}>
                                Cancelar
                            </Button>
                            <Button type="button" size="sm" onClick={handleSaveCorrection} disabled={isSavingCorrection} className="bg-amber-600 hover:bg-amber-500 text-white font-semibold">
                                {isSavingCorrection ? 'Salvando...' : 'Salvar Correção'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Histórico de Auditoria da Execução */}
            {showExecutionHistory && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-blue-400" />
                                <h3 className="text-base font-bold text-white">Histórico de Correções do Início</h3>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setShowExecutionHistory(false)} className="h-7 w-7 p-0 text-gray-400">✕</Button>
                        </div>

                        {isLoadingExecHistory ? (
                            <p className="text-xs text-gray-400 py-4 text-center">Carregando histórico...</p>
                        ) : executionHistoryEntries.length === 0 ? (
                            <p className="text-xs text-gray-400 py-6 text-center italic">
                                Nenhum ajuste manual foi registrado para esta OS. O início permanece o original.
                            </p>
                        ) : (
                            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                                {executionHistoryEntries.map(entry => (
                                    <div key={entry.id} className="p-3 rounded-lg bg-black/50 border border-gray-800 space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between text-gray-400">
                                            <span className="font-semibold text-gray-300">{entry.performedBy || 'Usuário'}</span>
                                            <span>{new Date(entry.createdAt).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="text-gray-300">
                                            <span className="text-gray-500 line-through mr-2">
                                                {entry.previousStartDate ? new Date(entry.previousStartDate).toLocaleString('pt-BR') : 'Não definido'}
                                            </span>
                                            ➜{' '}
                                            <span className="text-emerald-400 font-semibold">
                                                {new Date(entry.newStartDate).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                        <div className="bg-gray-950/80 p-2 rounded border border-gray-800/80 text-gray-300 italic">
                                            "{entry.justification}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end pt-2 border-t border-gray-800">
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowExecutionHistory(false)}>
                                Fechar
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
                initialBlankMode={isBlankPdfMode}
            />
        </ResponsiveDrawer>
    );
};

// ── Sub-componentes ───────────────────────────────────────────────────────────

const Section: React.FC<{ id?: string; title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }> = ({ id, title, icon, action, children }) => (
    <div id={id} className="space-y-3 scroll-mt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 uppercase tracking-wide">
                {icon}{title}
            </h3>
            {action}
        </div>
        <Separator className="bg-gray-800" />
        {children}
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={`space-y-1.5 ${className || ''}`}>
        <Label className="text-xs text-gray-400 uppercase tracking-wide leading-tight block">{label}</Label>
        {children}
    </div>
);

export default FleetWorkOrderForm;
