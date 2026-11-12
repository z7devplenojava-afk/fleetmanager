import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Ban, Check, Download, Eye, FileText, Plus, RefreshCw, RotateCcw, Search, Trash2, Wrench } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tire, TireLifecycleConfig, TireMovement } from '@/services/tireService';
import { Vehicle } from '@/types/fleet';
import { generateTireRecapPickupPDFBlob, TireRecapPickupItem } from '@/utils/tireRecapPickupPdfGenerator';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import contasAPagarService, { CreateSupplierRequest, Supplier } from '@/services/contasAPagarService';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import tireShopService, { TireShopCatalogItem } from '@/services/tireShopService';
import { TireShopCatalogModal } from '@/components/pneus/TireShopCatalogModal';
import {
    computeTireLiveMetrics,
    DEFAULT_TIRE_LIFECYCLE_CONFIG,
    getLifeStageLabel,
    getPositionLabel,
    getTireDisplayCode,
} from '@/utils/tireLifecycle';

interface TireExchangeControlTabProps {
    tires: Tire[];
    vehicles?: Vehicle[];
    movements: TireMovement[];
    lifecycleConfig?: TireLifecycleConfig;
    onOpenMovement: (tire: Tire, action: 'MOUNT' | 'DISMOUNT' | 'RECAP_SEND' | 'RECAP_RETURN' | 'SCRAP' | 'HISTORY') => void;
}

export const TireExchangeControlTab: React.FC<TireExchangeControlTabProps> = ({
    tires,
    vehicles = [],
    movements,
    lifecycleConfig = DEFAULT_TIRE_LIFECYCLE_CONFIG,
    onOpenMovement,
}) => {
    const { user, company } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
    const [viewSection, setViewSection] = useState<'ACTIVE_FLEET' | 'RECAP_QUEUE' | 'HISTORY'>('ACTIVE_FLEET');

    // Modal de geração de PDF para coleta de recapagem (fornecedor)
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [pickupLocation, setPickupLocation] = useState('Almoxarifado / Garagem da Frota');
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [serviceType, setServiceType] = useState('Recapagem / Reforma Completa de Carcaça');
    const [pickupNotes, setPickupNotes] = useState('');
    const [showAllEligibleInModal, setShowAllEligibleInModal] = useState(false);
    const [selectedPdfTireIds, setSelectedPdfTireIds] = useState<string[]>([]);
    const [supplierModalOpen, setSupplierModalOpen] = useState(false);
    const [catalogModalOpen, setCatalogModalOpen] = useState(false);

    const { data: suppliers = [] } = useQuery<Supplier[]>({
        queryKey: ['suppliers'],
        queryFn: () => contasAPagarService.getFornecedores(),
        staleTime: 60_000,
    });

    const { data: catalogItems = [] } = useQuery<TireShopCatalogItem[]>({
        queryKey: ['tire-shop-catalog'],
        queryFn: () => tireShopService.getCatalog(),
        staleTime: 60_000,
    });

    const supplierOptions: SearchableOption[] = useMemo(
        () =>
            suppliers.map((s) => ({
                value: s.id,
                label: s.name,
                subtitle: s.cnpj || s.phone || s.city || undefined,
                badge: s.cnpj || undefined,
                keywords: [s.name || '', s.cnpj || '', (s.cnpj || '').replace(/\D/g, ''), s.email || ''],
            })),
        [suppliers]
    );

    const catalogOptions: SearchableOption[] = useMemo(
        () =>
            catalogItems
                .filter((c) => c.active !== false)
                .map((c) => ({
                    value: c.id,
                    label: c.name,
                    subtitle:
                        Number(c.defaultPrice || 0) > 0
                            ? `Ref.: R$ ${Number(c.defaultPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : c.description || undefined,
                    badge: c.code || undefined,
                    keywords: [c.code || '', c.name || '', c.description || ''],
                })),
        [catalogItems]
    );

    useEffect(() => {
        if (!selectedCatalogId && catalogItems.length > 0) {
            const preferred = catalogItems.find((c) => c.active !== false && c.requiresPickup) || catalogItems[0];
            if (preferred) {
                setSelectedCatalogId(preferred.id);
                setServiceType(preferred.name);
            }
        }
    }, [catalogItems, selectedCatalogId]);

    const handleSaveSupplier = async (payload: CreateSupplierRequest) => {
        const created = await contasAPagarService.createFornecedor(payload);
        await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        setSelectedSupplierId(created.id);
        setSupplierName(created.name);
        setSupplierModalOpen(false);
        toast({
            title: 'Fornecedor cadastrado!',
            description: `${created.name} foi adicionado e selecionado na guia de coleta.`,
        });
    };

    const maxRecaps = lifecycleConfig.maxRecapCount ?? 2;

    const vehicleById = useMemo(() => {
        const map = new Map<string, Vehicle>();
        vehicles.forEach((v) => {
            if (v?.id) map.set(v.id, v);
        });
        return map;
    }, [vehicles]);

    const latestInstallMovementByTireId = useMemo(() => {
        const map = new Map<string, TireMovement>();
        movements.forEach((m) => {
            if (m.type === 'INSTALLATION' && m.tireId && !map.has(m.tireId)) {
                map.set(m.tireId, m);
            }
        });
        return map;
    }, [movements]);

    const recapPickupEntries = useMemo(() => {
        return tires
            .filter((t) => t.status !== 'SCRAPPED' && (t.recapCount || 0) < maxRecaps)
            .map((t) => {
                const m = computeTireLiveMetrics(t, lifecycleConfig);
                const matchedVehicle = t.vehicleId ? vehicleById.get(t.vehicleId) : undefined;
                const fleetOrPlate =
                    t.vehicleFleetNumber ||
                    t.vehiclePlate ||
                    matchedVehicle?.fleetNumber ||
                    matchedVehicle?.plate ||
                    '';
                const posCode = getPositionLabel(t.axleNumber, t.positionIndex);
                const locationLabel =
                    t.status === 'IN_USE'
                        ? fleetOrPlate
                            ? `Veículo ${fleetOrPlate}${posCode !== '-' ? ` (${posCode})` : ''} — Desmontar`
                            : 'Em Uso (Sem veículo vinculado)'
                        : t.status === 'RECAP'
                        ? `Fila Recapagem${t.recapVendor ? ` (${t.recapVendor})` : ''}`
                        : `Estoque (${t.locationNotes || 'Almoxarifado'})`;

                const needsRecap =
                    t.status === 'RECAP' ||
                    m.nextExchange.status === 'OVERDUE' ||
                    m.nextExchange.status === 'DUE_SOON';

                const reasonLabel =
                    t.status === 'RECAP'
                        ? 'Em Fila de Recapagem'
                        : m.twiCritical
                        ? `TWI Crítico (${Number(t.currentTreadDepth || 0).toFixed(1)} mm)`
                        : m.nextExchange.status === 'OVERDUE'
                        ? m.nextExchange.headline
                        : m.nextExchange.status === 'DUE_SOON'
                        ? m.nextExchange.headline
                        : 'Preventiva / Adicional';

                const recaps = t.recapCount || 0;
                const pickupItem: TireRecapPickupItem = {
                    fireNumber: t.fireNumber,
                    serialNumber: t.serialNumber,
                    dot: t.dot,
                    brand: t.brand,
                    model: t.model,
                    size: t.size,
                    locationLabel,
                    treadDepthMm: t.currentTreadDepth != null ? Number(t.currentTreadDepth) : null,
                    currentLifeLabel: recaps === 0 ? 'Novo (1ª Vida)' : `${recaps}ª Recapagem`,
                    targetServiceLabel: `${recaps + 1}ª Recapagem`,
                    currentTotalKm: m.totalCarcassKm,
                    reasonLabel,
                };

                return { tire: t, metrics: m, needsRecap, pickupItem };
            })
            .sort((a, b) => {
                if (a.needsRecap !== b.needsRecap) return a.needsRecap ? -1 : 1;
                return (a.tire.fireNumber || a.tire.serialNumber).localeCompare(b.tire.fireNumber || b.tire.serialNumber);
            });
    }, [tires, maxRecaps, lifecycleConfig, vehicleById]);

    const neededForRecapCount = useMemo(
        () => recapPickupEntries.filter((e) => e.needsRecap).length,
        [recapPickupEntries]
    );

    const openPickupPdfModal = () => {
        const defaults = recapPickupEntries
            .filter((e) => e.needsRecap)
            .map((e) => e.tire.id);
        setSelectedPdfTireIds(defaults);
        setShowAllEligibleInModal(defaults.length === 0);
        setPdfModalOpen(true);
    };

    const togglePdfTireSelection = (id: string) => {
        setSelectedPdfTireIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleGeneratePickupPdf = async (mode: 'download' | 'preview') => {
        const chosenItems = recapPickupEntries
            .filter((e) => selectedPdfTireIds.includes(e.tire.id))
            .map((e) => e.pickupItem);
        if (chosenItems.length === 0) {
            toast({
                title: 'Nenhum pneu selecionado',
                description: 'Selecione ao menos um pneu da lista para gerar o PDF de coleta.',
                variant: 'destructive',
            });
            return;
        }
        try {
            setGeneratingPdf(true);
            const { blob, filename } = await generateTireRecapPickupPDFBlob({
                companyName: company?.name,
                companyDocument: (company as any)?.cnpj || (company as any)?.document,
                supplierName,
                pickupLocation,
                serviceType,
                notes: pickupNotes,
                responsibleName: user?.name || user?.username,
                items: chosenItems,
            });
            const url = URL.createObjectURL(blob);
            if (mode === 'preview') {
                window.open(url, '_blank', 'noopener,noreferrer');
            } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
            toast({
                title: 'PDF de coleta gerado!',
                description: `${chosenItems.length} carcaça(s) incluída(s) no romaneio para o fornecedor.`,
            });
        } catch (err: any) {
            toast({
                title: 'Erro ao gerar PDF',
                description: err?.message || 'Não foi possível gerar o romaneio de recapagem.',
                variant: 'destructive',
            });
        } finally {
            setGeneratingPdf(false);
        }
    };

    const availableMonths = useMemo(() => {
        const set = new Set<string>();
        tires.forEach((t) => {
            if (t.installDate) set.add(t.installDate.slice(0, 7));
        });
        movements.forEach((m) => {
            if (m.movementDate) set.add(m.movementDate.slice(0, 7));
        });
        return Array.from(set).sort().reverse();
    }, [tires, movements]);

    const installedTires = useMemo(() => {
        return tires
            .filter((t) => t.status === 'IN_USE')
            .filter((t) => {
                const q = searchTerm.toLowerCase();
                const matchesSearch =
                    !q ||
                    (t.vehicleFleetNumber || '').toLowerCase().includes(q) ||
                    (t.vehiclePlate || '').toLowerCase().includes(q) ||
                    (t.brand || '').toLowerCase().includes(q) ||
                    (t.model || '').toLowerCase().includes(q) ||
                    (t.fireNumber || '').toLowerCase().includes(q) ||
                    (t.serialNumber || '').toLowerCase().includes(q);
                const matchesMonth =
                    selectedMonth === 'ALL' || (t.installDate && t.installDate.startsWith(selectedMonth));
                return matchesSearch && matchesMonth;
            });
    }, [tires, searchTerm, selectedMonth]);

    const recapQueueTires = useMemo(() => {
        return tires
            .filter((t) => t.status === 'RECAP' || t.status === 'AVAILABLE' || (t.recapCount || 0) >= maxRecaps)
            .filter((t) => t.status !== 'SCRAPPED')
            .filter((t) => {
                const q = searchTerm.toLowerCase();
                return (
                    !q ||
                    (t.fireNumber || '').toLowerCase().includes(q) ||
                    (t.serialNumber || '').toLowerCase().includes(q) ||
                    (t.brand || '').toLowerCase().includes(q) ||
                    (t.model || '').toLowerCase().includes(q)
                );
            });
    }, [tires, searchTerm, maxRecaps]);

    const filteredMovements = useMemo(() => {
        return movements.filter((m) => {
            const q = searchTerm.toLowerCase();
            const matchesSearch =
                !q ||
                (m.vehicleFleetNumber || '').toLowerCase().includes(q) ||
                (m.vehiclePlate || '').toLowerCase().includes(q) ||
                (m.tireFireNumber || '').toLowerCase().includes(q) ||
                (m.tireSerialNumber || '').toLowerCase().includes(q) ||
                (m.tireBrand || '').toLowerCase().includes(q);
            const matchesMonth =
                selectedMonth === 'ALL' || (m.movementDate && m.movementDate.startsWith(selectedMonth));
            return matchesSearch && matchesMonth;
        });
    }, [movements, searchTerm, selectedMonth]);

    const formatMonthLabel = (ym: string) => {
        const [y, m] = ym.split('-');
        const date = new Date(Number(y), Number(m) - 1, 1);
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
    };

    return (
        <div className="space-y-4">
            {/* Cabeçalho estilo Planilha de Controle de Troca & Recapagem */}
            <Card className="bg-seguranca-black/50 border-gray-700">
                <CardHeader className="py-3 px-4 border-b border-gray-700/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base font-bold text-seguranca-yellow flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            CONTROLE DE TROCA E RECAPAGEM DE PNEUS
                        </CardTitle>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Acompanhamento por Frota, Data de Troca, Diant. L.D / L.E, KM Troca, KM Rodada, KM Atual e Limite de {maxRecaps} Recapagens.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 bg-seguranca-black p-1 rounded-lg border border-gray-700">
                        <Button
                            size="sm"
                            variant={viewSection === 'ACTIVE_FLEET' ? 'default' : 'ghost'}
                            className={`h-7 px-3 text-xs ${viewSection === 'ACTIVE_FLEET' ? 'bg-seguranca-red text-white' : 'text-gray-400'}`}
                            onClick={() => setViewSection('ACTIVE_FLEET')}
                        >
                            Rodando na Frota ({installedTires.length})
                        </Button>
                        <Button
                            size="sm"
                            variant={viewSection === 'RECAP_QUEUE' ? 'default' : 'ghost'}
                            className={`h-7 px-3 text-xs ${viewSection === 'RECAP_QUEUE' ? 'bg-amber-600 text-white' : 'text-gray-400'}`}
                            onClick={() => setViewSection('RECAP_QUEUE')}
                        >
                            Fila de Recapagem & Carcaças ({recapQueueTires.length})
                        </Button>
                        <Button
                            size="sm"
                            variant={viewSection === 'HISTORY' ? 'default' : 'ghost'}
                            className={`h-7 px-3 text-xs ${viewSection === 'HISTORY' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                            onClick={() => setViewSection('HISTORY')}
                        >
                            Histórico de Movimentações ({filteredMovements.length})
                        </Button>
                    </div>

                    <Button
                        size="sm"
                        type="button"
                        onClick={openPickupPdfModal}
                        className="h-8 px-3 text-xs bg-seguranca-yellow hover:bg-amber-400 text-black font-bold shrink-0"
                    >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        PDF Coleta Recapagem
                        {neededForRecapCount > 0 && (
                            <Badge className="ml-1.5 bg-red-600 text-white text-[10px] px-1.5 py-0">
                                {neededForRecapCount}
                            </Badge>
                        )}
                    </Button>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Filtrar por frota, placa, fogo, marca..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-seguranca-black border-gray-600 text-xs text-white"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Mês:</span>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-52 bg-seguranca-black border-gray-600 text-xs text-white">
                                    <SelectValue placeholder="Todos os meses" />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white">
                                    <SelectItem value="ALL">TODOS OS MESES</SelectItem>
                                    {availableMonths.map((ym) => (
                                        <SelectItem key={ym} value={ym}>
                                            {formatMonthLabel(ym)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {viewSection === 'ACTIVE_FLEET' && (
                        <div className="border border-gray-700 rounded-xl overflow-x-auto bg-seguranca-black">
                            <Table>
                                <TableHeader className="bg-seguranca-graphite">
                                    <TableRow className="border-gray-700">
                                        <TableHead className="text-xs font-bold text-white">FROTA / PLACA</TableHead>
                                        <TableHead className="text-xs font-bold text-white">TROCA EFETIVADA</TableHead>
                                        <TableHead className="text-xs font-bold text-white">TIPO PNEU (FOGO / MARCA / VIDA)</TableHead>
                                        <TableHead className="text-xs font-bold text-center text-white">DIANT. L.D</TableHead>
                                        <TableHead className="text-xs font-bold text-center text-white">DIANT. L.E</TableHead>
                                        <TableHead className="text-xs font-bold text-white">POSIÇÃO</TableHead>
                                        <TableHead className="text-xs font-bold text-right text-white">KM TROCA</TableHead>
                                        <TableHead className="text-xs font-bold text-right text-red-400">KM RODADA</TableHead>
                                        <TableHead className="text-xs font-bold text-right text-white">KM ATUAL</TableHead>
                                        <TableHead className="text-xs font-bold text-amber-300">PRÓXIMA TROCA (KM / FALTAM)</TableHead>
                                        <TableHead className="text-xs font-bold text-right text-white">AÇÕES</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {installedTires.length > 0 ? (
                                        installedTires.map((tire) => {
                                            const matchedVehicle = tire.vehicleId ? vehicleById.get(tire.vehicleId) : undefined;
                                            const latestInstallMov = latestInstallMovementByTireId.get(tire.id);
                                            const resolvedVehicleKm =
                                                tire.vehicleCurrentMileage || matchedVehicle?.currentMileage || 0;
                                            const enrichedTire =
                                                resolvedVehicleKm > 0 && !tire.vehicleCurrentMileage
                                                    ? { ...tire, vehicleCurrentMileage: resolvedVehicleKm }
                                                    : tire;
                                            const m = computeTireLiveMetrics(enrichedTire, lifecycleConfig);
                                            const fleetDisplay =
                                                tire.vehicleFleetNumber || matchedVehicle?.fleetNumber || '';
                                            const plateDisplay =
                                                tire.vehiclePlate ||
                                                matchedVehicle?.plate ||
                                                latestInstallMov?.vehiclePlate ||
                                                '';
                                            const isFrontRight = tire.axleNumber === 1 && tire.positionIndex === 1;
                                            const isFrontLeft = tire.axleNumber === 1 && tire.positionIndex === 0;
                                            const kmTroca = tire.installKm || latestInstallMov?.mileage || 0;
                                            const kmAtual = resolvedVehicleKm || kmTroca;
                                            const kmRodada = kmAtual > kmTroca ? kmAtual - kmTroca : m.currentLifeKm;
                                            const trocaDateRaw =
                                                tire.installDate || latestInstallMov?.movementDate || tire.updatedAt;
                                            const posLabel = getPositionLabel(
                                                tire.axleNumber,
                                                tire.positionIndex,
                                                latestInstallMov?.positionCode
                                            );

                                            return (
                                                <TableRow key={tire.id} className="border-gray-800 hover:bg-seguranca-graphite/40 text-xs">
                                                    <TableCell className="font-mono font-bold text-white">
                                                        {fleetDisplay || plateDisplay ? (
                                                            <>
                                                                <div>{fleetDisplay || plateDisplay}</div>
                                                                {fleetDisplay && plateDisplay && (
                                                                    <span className="text-[10px] text-gray-400">{plateDisplay}</span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <span className="text-[11px] text-amber-300 font-sans font-medium block">
                                                                    Sem vínculo
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onOpenMovement(tire, 'MOUNT')}
                                                                    className="text-[10px] font-sans text-seguranca-yellow underline hover:text-amber-300"
                                                                >
                                                                    Vincular veículo
                                                                </button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-gray-300">
                                                        {trocaDateRaw
                                                            ? new Date(trocaDateRaw).toLocaleDateString('pt-BR')
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold text-gray-100">
                                                            {tire.recapCount === 0 ? 'PNEU NOVO' : `${tire.recapCount}ª RECAPAGEM`} • {tire.brand} {tire.model}
                                                        </div>
                                                        <div className="text-[11px] text-seguranca-yellow font-mono flex items-center gap-2">
                                                            <span>ID: {getTireDisplayCode(tire)}</span>
                                                            {m.kmThresholdReached && (
                                                                <Badge className="bg-amber-950/70 text-amber-300 border-amber-600/50 text-[9px] py-0">
                                                                    <AlertTriangle size={9} className="mr-0.5" /> Atingiu faixa ciclo
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold">
                                                        {isFrontRight ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : ''}
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold">
                                                        {isFrontLeft ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : ''}
                                                    </TableCell>
                                                    <TableCell className="text-gray-300 font-mono text-[11px]">
                                                        {posLabel}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-gray-300">
                                                        {kmTroca.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-red-400">
                                                        {kmRodada.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-gray-200">
                                                        {kmAtual.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="min-w-[200px]">
                                                        <div
                                                            className={`font-mono font-bold text-[11px] ${
                                                                m.nextExchange.status === 'OVERDUE'
                                                                    ? 'text-red-400'
                                                                    : m.nextExchange.status === 'DUE_SOON'
                                                                    ? 'text-amber-300'
                                                                    : 'text-emerald-400'
                                                            }`}
                                                        >
                                                            {m.nextExchange.headline}
                                                        </div>
                                                        {m.nextExchange.nextVehicleKmMin != null && (
                                                            <div className="text-[10px] font-mono text-gray-300">
                                                                Próx. troca: {m.nextExchange.nextVehicleKmMin.toLocaleString('pt-BR')}–{m.nextExchange.nextVehicleKmMax?.toLocaleString('pt-BR')} km
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] text-gray-400">
                                                            {m.nextExchange.nextActionLabel}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => onOpenMovement(tire, 'DISMOUNT')}
                                                            className="h-7 px-2 text-[11px] border-amber-500/50 text-amber-300 hover:bg-amber-600 hover:text-white"
                                                        >
                                                            <RefreshCw size={12} className="mr-1" /> Trocar / Desmontar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={11} className="h-20 text-center text-gray-500 text-xs">
                                                Nenhum pneu instalado encontrado para o filtro selecionado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {viewSection === 'RECAP_QUEUE' && (
                        <div className="border border-gray-700 rounded-xl overflow-x-auto bg-seguranca-black">
                            <Table>
                                <TableHeader className="bg-seguranca-graphite">
                                    <TableRow className="border-gray-700">
                                        <TableHead className="text-xs font-bold text-white">Nº FOGO / SÉRIE</TableHead>
                                        <TableHead className="text-xs font-bold text-white">MARCA / MODELO / MEDIDA</TableHead>
                                        <TableHead className="text-xs font-bold text-white">STATUS</TableHead>
                                        <TableHead className="text-xs font-bold text-white">RECAPAGENS / VIDA</TableHead>
                                        <TableHead className="text-xs font-bold text-right text-white">KM TOTAL CARCAÇA</TableHead>
                                        <TableHead className="text-xs font-bold text-right text-white">SULCO</TableHead>
                                        <TableHead className="text-xs font-bold text-right text-white">CONTROLE DE RECAPAGEM</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recapQueueTires.map((tire) => {
                                        const recaps = tire.recapCount || 0;
                                        const blockedThirdRecap = recaps >= maxRecaps;
                                        const m = computeTireLiveMetrics(tire, lifecycleConfig);

                                        return (
                                            <TableRow key={tire.id} className="border-gray-800 hover:bg-seguranca-graphite/40 text-xs">
                                                <TableCell className="font-mono font-bold text-seguranca-yellow">
                                                    {getTireDisplayCode(tire)}
                                                    <span className="block text-[10px] text-gray-400 font-normal">Série: {tire.serialNumber}</span>
                                                </TableCell>
                                                <TableCell className="text-gray-200">
                                                    <div className="font-semibold">{tire.brand} • {tire.model}</div>
                                                    <span className="text-[11px] font-mono text-gray-400">{tire.size}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-200">
                                                        {tire.status === 'RECAP' ? 'Em Recapagem' : 'Em Estoque'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`text-[10px] ${
                                                            blockedThirdRecap
                                                                ? 'bg-red-950/70 text-red-300 border border-red-500/60'
                                                                : 'bg-blue-950/60 text-blue-300 border border-blue-600/50'
                                                        }`}
                                                    >
                                                        {getLifeStageLabel(tire)} ({recaps}/{maxRecaps})
                                                    </Badge>
                                                    <span className="block text-[10px] text-gray-300 mt-0.5">
                                                        {m.nextExchange.headline} • {m.nextExchange.nextActionLabel}
                                                    </span>
                                                    {blockedThirdRecap && (
                                                        <span className="block text-[10px] text-red-400 mt-0.5 font-semibold">
                                                            3ª recapagem bloqueada — sugerido sucatear
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-gray-200">
                                                    {(tire.currentMileage || 0).toLocaleString()} km
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-gray-200">
                                                    {tire.currentTreadDepth != null ? `${tire.currentTreadDepth} mm` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1.5 flex-wrap">
                                                        {tire.status === 'RECAP' && !blockedThirdRecap && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => onOpenMovement(tire, 'RECAP_RETURN')}
                                                                className="h-7 px-2.5 text-[11px] bg-emerald-700 hover:bg-emerald-600 text-white"
                                                            >
                                                                <RotateCcw size={12} className="mr-1" /> Retorno Recapagem
                                                            </Button>
                                                        )}
                                                        {tire.status === 'AVAILABLE' && (
                                                            blockedThirdRecap ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled
                                                                    className="h-7 px-2 text-[11px] border-red-700/60 text-red-400 opacity-75"
                                                                    title={`Limite máximo de ${maxRecaps} recapagens atingido`}
                                                                >
                                                                    <Ban size={12} className="mr-1" /> 3ª Recap Bloqueada
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => onOpenMovement(tire, 'RECAP_SEND')}
                                                                    className="h-7 px-2 text-[11px] border-amber-500/60 text-amber-300 hover:bg-amber-600 hover:text-white"
                                                                >
                                                                    <Wrench size={12} className="mr-1" /> Enviar Recapagem
                                                                </Button>
                                                            )
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => onOpenMovement(tire, 'SCRAP')}
                                                            className="h-7 px-2 text-[11px] border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white"
                                                        >
                                                            <Trash2 size={12} className="mr-1" /> Sucatear
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {viewSection === 'HISTORY' && (
                        <div className="border border-gray-700 rounded-xl overflow-x-auto bg-seguranca-black">
                            <Table>
                                <TableHeader className="bg-seguranca-graphite">
                                    <TableRow className="border-gray-700">
                                        <TableHead className="text-xs font-bold text-white">DATA</TableHead>
                                        <TableHead className="text-xs font-bold text-white">TIPO</TableHead>
                                        <TableHead className="text-xs font-bold text-white">PNEU</TableHead>
                                        <TableHead className="text-xs font-bold text-white">FROTA / POSIÇÃO</TableHead>
                                        <TableHead className="text-xs font-bold text-right text-white">KM REGISTRO</TableHead>
                                        <TableHead className="text-xs font-bold text-right text-white">KM CICLO</TableHead>
                                        <TableHead className="text-xs font-bold text-white">OBSERVAÇÃO / AUTORIZAÇÃO</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMovements.length > 0 ? (
                                        filteredMovements.map((mov) => {
                                            const movVehicle = mov.vehicleId ? vehicleById.get(mov.vehicleId) : undefined;
                                            const movFleetOrPlate =
                                                mov.vehicleFleetNumber ||
                                                mov.vehiclePlate ||
                                                movVehicle?.fleetNumber ||
                                                movVehicle?.plate ||
                                                '-';
                                            return (
                                            <TableRow key={mov.id} className="border-gray-800 hover:bg-seguranca-graphite/40 text-xs">
                                                <TableCell className="font-mono text-gray-300">
                                                    {new Date(mov.movementDate).toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-200">
                                                        {mov.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-seguranca-yellow">
                                                    {mov.tireFireNumber || mov.tireSerialNumber || '-'}
                                                    <span className="block text-[10px] text-gray-400 font-sans">
                                                        {mov.tireBrand} {mov.tireModel}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-200 font-mono">
                                                    {movFleetOrPlate}
                                                    {mov.positionCode && (
                                                        <span className="ml-1 text-blue-300">({mov.positionCode})</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-gray-300">
                                                    {(mov.mileage || 0).toLocaleString()} km
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-emerald-300">
                                                    {mov.kmDrivenCycle != null ? `${mov.kmDrivenCycle.toLocaleString()} km` : '-'}
                                                </TableCell>
                                                <TableCell className="text-gray-300 max-w-xs">
                                                    <div>{mov.notes || '-'}</div>
                                                    {mov.authorizedByName && (
                                                        <span className="text-[10px] text-amber-300">
                                                            Liberado por: {mov.authorizedByName}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-20 text-center text-gray-500 text-xs">
                                                Nenhuma movimentação registrada ainda.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Geração de PDF para Coleta de Recapagem (Fornecedor) */}
            <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
                <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-white p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-seguranca-yellow">
                            <FileText className="h-5 w-5" />
                            Gerar PDF — Lista de Coleta para Recapagem
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-300">
                            Selecione os pneus que precisam do serviço de recapagem e gere o romaneio em PDF para enviar ao fornecedor realizar a coleta.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs text-gray-200">Fornecedor / Recapadora</Label>
                                    <button
                                        type="button"
                                        onClick={() => setSupplierModalOpen(true)}
                                        className="text-[11px] font-medium text-seguranca-yellow hover:text-amber-300 hover:underline inline-flex items-center gap-0.5"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Cadastrar Fornecedor
                                    </button>
                                </div>
                                <SearchableSelect
                                    value={selectedSupplierId}
                                    fallbackLabel={supplierName}
                                    onChange={(val, opt) => {
                                        setSelectedSupplierId(val);
                                        setSupplierName(opt?.label || val || '');
                                    }}
                                    options={supplierOptions}
                                    maxVisibleOptions={60}
                                    allowCustomValue
                                    customValuePrefix="Usar nome avulso"
                                    placeholder="Buscar fornecedor cadastrado (nome ou CNPJ)..."
                                    searchPlaceholder="Filtrar fornecedor por nome ou CNPJ..."
                                    emptyMessage="Nenhum fornecedor encontrado. Clique em '+ Cadastrar Fornecedor' acima."
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-200">Local de Retirada (Coleta)</Label>
                                <Input
                                    value={pickupLocation}
                                    onChange={(e) => setPickupLocation(e.target.value)}
                                    placeholder="Ex: Almoxarifado Principal - Garagem"
                                    className="bg-seguranca-black border-gray-600 text-xs text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs text-gray-200">Serviço Solicitado</Label>
                                    <button
                                        type="button"
                                        onClick={() => setCatalogModalOpen(true)}
                                        className="text-[11px] font-medium text-seguranca-yellow hover:text-amber-300 hover:underline inline-flex items-center gap-0.5"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Tabela de Serviços
                                    </button>
                                </div>
                                <SearchableSelect
                                    value={selectedCatalogId}
                                    fallbackLabel={serviceType}
                                    onChange={(val, opt) => {
                                        const found = catalogItems.find((c) => c.id === val);
                                        if (found) {
                                            setSelectedCatalogId(found.id);
                                            setServiceType(found.name);
                                        } else {
                                            setSelectedCatalogId('');
                                            setServiceType(opt?.label || val || '');
                                        }
                                    }}
                                    options={catalogOptions}
                                    maxVisibleOptions={60}
                                    allowCustomValue
                                    customValuePrefix="Usar serviço"
                                    placeholder="Selecionar serviço da tabela..."
                                    searchPlaceholder="Filtrar serviço por nome ou código..."
                                    emptyMessage="Nenhum serviço encontrado. Clique em '+ Tabela de Serviços' acima."
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-200">Observações para o Fornecedor</Label>
                                <Textarea
                                    rows={1}
                                    value={pickupNotes}
                                    onChange={(e) => setPickupNotes(e.target.value)}
                                    placeholder="Ex: Desenho borrachudo p/ tração, horário de coleta..."
                                    className="bg-seguranca-black border-gray-600 text-xs text-white min-h-[38px]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-700">
                            <span className="text-xs font-semibold text-white">
                                Pneus Selecionados ({selectedPdfTireIds.length})
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowAllEligibleInModal((prev) => !prev)}
                                    className="h-7 px-2.5 text-[11px] border-gray-600 text-gray-200"
                                >
                                    {showAllEligibleInModal
                                        ? 'Mostrar apenas pendentes de recapagem'
                                        : `Mostrar todos elegíveis (${recapPickupEntries.length})`}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const visibleIds = recapPickupEntries
                                            .filter((e) => showAllEligibleInModal || e.needsRecap)
                                            .map((e) => e.tire.id);
                                        setSelectedPdfTireIds(visibleIds);
                                    }}
                                    className="h-7 px-2.5 text-[11px] border-seguranca-yellow/50 text-seguranca-yellow"
                                >
                                    Marcar Visíveis
                                </Button>
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                            {recapPickupEntries
                                .filter((e) => showAllEligibleInModal || e.needsRecap)
                                .map(({ tire, needsRecap, pickupItem }) => {
                                    const checked = selectedPdfTireIds.includes(tire.id);
                                    return (
                                        <label
                                            key={tire.id}
                                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                                checked
                                                    ? 'bg-amber-950/30 border-seguranca-yellow/60'
                                                    : 'bg-seguranca-black/50 border-gray-700 hover:border-gray-600'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => togglePdfTireSelection(tire.id)}
                                                className="mt-0.5 h-4 w-4 accent-amber-400 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0 text-xs">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono font-bold text-seguranca-yellow">
                                                        {pickupItem.fireNumber || pickupItem.serialNumber}
                                                    </span>
                                                    <span className="text-gray-200 font-medium">
                                                        {pickupItem.brand} {pickupItem.model} ({pickupItem.size})
                                                    </span>
                                                    <Badge
                                                        className={`text-[10px] ${
                                                            needsRecap
                                                                ? 'bg-red-950/70 text-red-300 border border-red-500/60'
                                                                : 'bg-gray-800 text-gray-300 border border-gray-600'
                                                        }`}
                                                    >
                                                        {pickupItem.reasonLabel}
                                                    </Badge>
                                                </div>
                                                <div className="text-[11px] text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
                                                    <span>Local: <strong className="text-gray-200">{pickupItem.locationLabel}</strong></span>
                                                    <span>Serviço: <strong className="text-emerald-300">{pickupItem.targetServiceLabel}</strong></span>
                                                    <span>Sulco: <strong className="text-gray-200">{pickupItem.treadDepthMm ?? '-'} mm</strong></span>
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            {recapPickupEntries.filter((e) => showAllEligibleInModal || e.needsRecap).length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-6">
                                    Nenhum pneu com necessidade imediata de recapagem encontrado. Clique em "Mostrar todos elegíveis" para incluir qualquer carcaça manualmente.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="border-t border-gray-700 pt-3 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPdfModalOpen(false)}
                            className="border-gray-600 text-gray-200 text-xs"
                        >
                            Fechar
                        </Button>
                        <div className="flex flex-wrap gap-2 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={generatingPdf || selectedPdfTireIds.length === 0}
                                onClick={() => handleGeneratePickupPdf('preview')}
                                className="border-blue-500/60 text-blue-300 hover:bg-blue-500/10 text-xs"
                            >
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                Visualizar PDF
                            </Button>
                            <Button
                                type="button"
                                disabled={generatingPdf || selectedPdfTireIds.length === 0}
                                onClick={() => handleGeneratePickupPdf('download')}
                                className="bg-seguranca-red hover:bg-seguranca-darkred text-white font-semibold text-xs"
                            >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                {generatingPdf ? 'Gerando...' : 'Baixar PDF p/ Coleta'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Rápido de Cadastro de Fornecedor */}
            <SupplierFormModal
                isOpen={supplierModalOpen}
                onClose={() => setSupplierModalOpen(false)}
                onSave={handleSaveSupplier}
            />

            {/* Modal da Tabela de Serviços de Borracharia */}
            <TireShopCatalogModal
                open={catalogModalOpen}
                onOpenChange={setCatalogModalOpen}
                onSelectCreated={(item: TireShopCatalogItem) => {
                    setSelectedCatalogId(item.id);
                    setServiceType(item.name);
                }}
            />
        </div>
    );
};

