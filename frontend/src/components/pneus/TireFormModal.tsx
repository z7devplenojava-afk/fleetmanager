import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import tireService, { Tire } from '@/services/tireService';
import { evaluateDotExpiration, getLifeStageLabel } from '@/utils/tireLifecycle';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Disc3,
    DollarSign,
    Gauge,
    Layers,
    MapPin,
    Minus,
    Plus,
    QrCode,
    RefreshCw,
    Ruler,
    ShieldCheck,
    Sparkles,
    Warehouse,
} from 'lucide-react';

interface TireFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tire?: Tire | null;
}

type SectionKey = 'all' | 'id' | 'specs' | 'metrics';

const COMMON_BUS_SIZES = [
    '295/80 R22.5',
    '275/80 R22.5',
    '215/75 R17.5',
    '235/75 R17.5',
    '11.00 R22',
    '10.00 R20',
];

const COMMON_BRANDS = ['Michelin', 'Pirelli', 'Bridgestone', 'Goodyear', 'Continental', 'Dunlop'];

const COMMON_LOCATIONS = [
    'Almoxarifado Principal',
    'Box Manutenção',
    'Recapadora Externa',
    'Pátio / Garagem',
];

const LIFE_STAGE_OPTIONS: {
    value: string;
    title: string;
    subtitle: string;
    tone: string;
}[] = [
    {
        value: '0',
        title: 'Novo',
        subtitle: '1ª Vida',
        tone: 'border-emerald-500/70 bg-emerald-950/40 text-emerald-200',
    },
    {
        value: '1',
        title: '1ª Recapagem',
        subtitle: '2ª Vida',
        tone: 'border-sky-500/70 bg-sky-950/40 text-sky-200',
    },
    {
        value: '2',
        title: '2ª Recapagem',
        subtitle: '3ª Vida',
        tone: 'border-amber-500/70 bg-amber-950/40 text-amber-200',
    },
    {
        value: 'SCRAPPED',
        title: 'Sucateado',
        subtitle: 'Fim de Vida',
        tone: 'border-red-500/70 bg-red-950/40 text-red-200',
    },
];

const STATUS_OPTIONS: { value: Tire['status']; label: string; shortLabel: string }[] = [
    { value: 'AVAILABLE', label: 'Em Estoque', shortLabel: 'Estoque' },
    { value: 'IN_USE', label: 'Em Uso (Frota)', shortLabel: 'Em Uso' },
    { value: 'RECAP', label: 'Em Recapagem', shortLabel: 'Recapagem' },
    { value: 'SCRAPPED', label: 'Sucateado', shortLabel: 'Sucateado' },
];

const LINE_OPTIONS = [
    { value: 'URBANA', label: 'Urbana', factor: '1.0x' },
    { value: 'METROPOLITANA', label: 'Metropolitana', factor: '1.1x' },
    { value: 'RODOVIARIA', label: 'Rodoviária', factor: '1.25x' },
];

const INITIAL_FORM_STATE = {
    fireNumber: '',
    serialNumber: '',
    dot: '',
    brand: '',
    model: '',
    size: '295/80 R22.5',
    status: 'AVAILABLE' as Tire['status'],
    recapCount: 0,
    lineType: 'URBANA',
    currentMileage: 0,
    currentLifeMileage: 0,
    currentTreadDepth: 15.0,
    initialTreadDepth: 15.0,
    locationNotes: 'Almoxarifado Principal',
    acquisitionCost: 0,
};

export const TireFormModal: React.FC<TireFormModalProps> = ({ isOpen, onClose, onSuccess, tire }) => {
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [activeSection, setActiveSection] = useState<SectionKey>('all');

    useEffect(() => {
        if (!isOpen) return;
        setActiveSection(isMobile ? 'id' : 'all');

        if (tire) {
            setFormData({
                fireNumber: tire.fireNumber || '',
                serialNumber: tire.serialNumber || '',
                dot: tire.dot || '',
                brand: tire.brand || '',
                model: tire.model || '',
                size: tire.size || '295/80 R22.5',
                status: tire.status || 'AVAILABLE',
                recapCount: tire.recapCount || 0,
                lineType: (tire.lineType || 'URBANA').toUpperCase(),
                currentMileage: tire.currentMileage || 0,
                currentLifeMileage: tire.currentLifeMileage || 0,
                currentTreadDepth: tire.currentTreadDepth != null ? Number(tire.currentTreadDepth) : 15.0,
                initialTreadDepth: tire.initialTreadDepth != null ? Number(tire.initialTreadDepth) : 15.0,
                locationNotes: tire.locationNotes || 'Almoxarifado Principal',
                acquisitionCost: tire.acquisitionCost != null ? Number(tire.acquisitionCost) : 0,
            });
        } else {
            setFormData(INITIAL_FORM_STATE);
        }
    }, [tire, isOpen, isMobile]);

    const dotEval = useMemo(() => evaluateDotExpiration(formData.dot, 5), [formData.dot]);

    const lifeStageValue = formData.status === 'SCRAPPED'
        ? 'SCRAPPED'
        : String(Math.min(2, Math.max(0, formData.recapCount || 0)));

    const handleLifeStageChange = (val: string) => {
        if (val === 'SCRAPPED') {
            setFormData((prev) => ({ ...prev, status: 'SCRAPPED' }));
        } else {
            const count = Number(val) || 0;
            setFormData((prev) => ({
                ...prev,
                recapCount: count,
                status: prev.status === 'SCRAPPED' ? 'AVAILABLE' : prev.status,
            }));
        }
    };

    const handleGenerateProvisionalFire = () => {
        const suffix = String(Math.floor(1000 + Math.random() * 9000));
        setFormData((prev) => ({ ...prev, fireNumber: `PROV-${suffix}` }));
    };

    const adjustTreadDepth = (delta: number) => {
        setFormData((prev) => {
            const next = Math.min(30, Math.max(0, Number((prev.currentTreadDepth + delta).toFixed(1))));
            return { ...prev, currentTreadDepth: next };
        });
    };

    const sectionCompletion = useMemo(() => {
        const idDone = Boolean(formData.fireNumber.trim() || formData.serialNumber.trim());
        const specsDone = Boolean(
            formData.brand.trim() && formData.model.trim() && formData.size.trim(),
        );
        const metricsDone = formData.currentTreadDepth >= 0 && formData.initialTreadDepth > 0;
        return { id: idDone, specs: specsDone, metrics: metricsDone };
    }, [formData]);

    const treadHealthPct = useMemo(() => {
        const orig = formData.initialTreadDepth > 0 ? formData.initialTreadDepth : 15;
        return Math.min(100, Math.max(0, Math.round((formData.currentTreadDepth / orig) * 100)));
    }, [formData.currentTreadDepth, formData.initialTreadDepth]);

    const treadTone = formData.currentTreadDepth <= 1.6
        ? { bar: 'bg-red-500', text: 'text-red-400', label: 'TWI Crítico (<= 1.6 mm)' }
        : formData.currentTreadDepth <= 3.0
        ? { bar: 'bg-amber-500', text: 'text-amber-300', label: 'Atenção: Próximo do TWI' }
        : { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'Sulco em Boas Condições' };

    const mutation = useMutation({
        mutationFn: (data: Partial<Tire>) => {
            if (tire?.id) return tireService.update(tire.id, data);
            return tireService.create(data);
        },
        onSuccess: () => {
            toast({ title: tire ? 'Cadastro do pneu atualizado!' : 'Pneu cadastrado no estoque!' });
            queryClient.invalidateQueries({ queryKey: ['tires'] });
            window.dispatchEvent(new CustomEvent('stock-data-changed'));
            onSuccess();
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || error?.message || 'Falha ao salvar pneu.';
            toast({ title: 'Erro ao salvar pneu', description: msg, variant: 'destructive' });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.serialNumber.trim() && !formData.fireNumber.trim()) {
            setActiveSection('id');
            toast({
                title: 'Identificação necessária',
                description: 'Informe o Número de Fogo ou o Número de Série do fabricante.',
                variant: 'destructive',
            });
            return;
        }
        if (!formData.brand.trim() || !formData.model.trim() || !formData.size.trim()) {
            setActiveSection('specs');
            toast({
                title: 'Especificações incompletas',
                description: 'Preencha Marca, Modelo da Carcaça e Medida do Pneu.',
                variant: 'destructive',
            });
            return;
        }
        const payload = {
            ...formData,
            serialNumber: formData.serialNumber.trim() || formData.fireNumber.trim(),
            fireNumber: formData.fireNumber.trim() || undefined,
            dot: formData.dot.trim(),
            brand: formData.brand.trim(),
            model: formData.model.trim(),
            size: formData.size.trim(),
        };
        mutation.mutate(payload as any);
    };

    const showId = activeSection === 'all' || activeSection === 'id';
    const showSpecs = activeSection === 'all' || activeSection === 'specs';
    const showMetrics = activeSection === 'all' || activeSection === 'metrics';

    const stepOrder: SectionKey[] = ['id', 'specs', 'metrics'];
    const currentStepIdx = stepOrder.indexOf(activeSection);

    const navTabs: { key: SectionKey; label: string; shortLabel: string; done?: boolean }[] = [
        { key: 'all', label: 'Visão Completa', shortLabel: 'Tudo' },
        { key: 'id', label: '1. Identificação', shortLabel: '1. ID / DOT', done: sectionCompletion.id },
        { key: 'specs', label: '2. Carcaça & Vida', shortLabel: '2. Vida / Med.', done: sectionCompletion.specs },
        { key: 'metrics', label: '3. Sulco & Estoque', shortLabel: '3. Sulco / KM', done: sectionCompletion.metrics },
    ];

    const footerContent = (
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 sm:flex-none h-11 sm:h-10 border-gray-600 text-gray-200 hover:bg-gray-800"
                >
                    Cancelar
                </Button>
                {activeSection !== 'all' && currentStepIdx > 0 && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveSection(stepOrder[currentStepIdx - 1])}
                        className="flex-1 sm:flex-none h-11 sm:h-10 border-gray-600 text-gray-200 hover:bg-gray-800"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Anterior
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                {activeSection !== 'all' && currentStepIdx < stepOrder.length - 1 && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setActiveSection(stepOrder[currentStepIdx + 1])}
                        className="flex-1 sm:flex-none h-11 sm:h-10 bg-seguranca-yellow/15 hover:bg-seguranca-yellow/25 text-seguranca-yellow border border-seguranca-yellow/40 font-semibold"
                    >
                        Próximo
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                )}
                <Button
                    type="submit"
                    form="tire-form"
                    disabled={mutation.isPending}
                    className="flex-1 sm:flex-none h-11 sm:h-10 px-6 bg-seguranca-red hover:bg-seguranca-darkred font-semibold text-white shadow-lg shadow-red-950/30"
                >
                    <Check className="h-4 w-4 mr-1.5" />
                    {mutation.isPending ? 'Salvando...' : tire ? 'Atualizar Pneu' : 'Salvar Pneu'}
                </Button>
            </div>
        </div>
    );

    const displayCode = formData.fireNumber.trim() || formData.serialNumber.trim() || 'Novo Pneu';
    const lifeSummaryLabel = getLifeStageLabel({
        recapCount: formData.recapCount,
        status: formData.status,
    });

    return (
        <ResponsiveDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={tire ? `Editar Pneu • ${tire.fireNumber || tire.serialNumber}` : 'Cadastrar Pneu no Estoque'}
            description="Rastreabilidade da carcaça, controle de ciclo de vida (TWI / DOT) e posição no estoque."
            className="sm:max-w-3xl"
            footer={footerContent}
        >
            <form id="tire-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Resumo Dinâmico + Barra de Navegação Inteligente */}
                <div className="rounded-xl border border-gray-700/80 bg-seguranca-black/70 p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-seguranca-yellow/15 border border-seguranca-yellow/40 flex items-center justify-center shrink-0">
                                <Disc3 className="h-5 w-5 text-seguranca-yellow" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono font-bold text-sm text-white truncate max-w-[180px]">
                                        {displayCode}
                                    </span>
                                    <Badge className="bg-gray-800 text-gray-200 border border-gray-600 text-[10px] font-mono">
                                        {formData.size || 'Medida'}
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-gray-400 truncate">
                                    {[formData.brand, formData.model].filter(Boolean).join(' • ') || 'Informe marca e modelo'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <Badge className="bg-gray-800/90 text-gray-100 border border-gray-600 text-[10px]">
                                {lifeSummaryLabel}
                            </Badge>
                            <Badge
                                className={`text-[10px] border ${
                                    formData.currentTreadDepth <= 1.6
                                        ? 'bg-red-950/70 text-red-300 border-red-600/60'
                                        : formData.currentTreadDepth <= 3.0
                                        ? 'bg-amber-950/70 text-amber-300 border-amber-500/60'
                                        : 'bg-emerald-950/70 text-emerald-300 border-emerald-600/60'
                                }`}
                            >
                                Sulco {Number(formData.currentTreadDepth || 0).toFixed(1)} mm
                            </Badge>
                        </div>
                    </div>

                    {/* Abas / Etapas de Navegação Inteligente */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-gray-800/80">
                        {navTabs.map((tab) => {
                            const isActive = activeSection === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveSection(tab.key)}
                                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all min-h-[38px] border ${
                                        isActive
                                            ? 'bg-seguranca-yellow text-black border-seguranca-yellow font-bold shadow-sm'
                                            : 'bg-seguranca-graphite/80 text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'
                                    }`}
                                >
                                    {tab.done !== undefined && (
                                        <span
                                            className={`h-2 w-2 rounded-full shrink-0 ${
                                                isActive
                                                    ? 'bg-black/70'
                                                    : tab.done
                                                    ? 'bg-emerald-400'
                                                    : 'bg-amber-400'
                                            }`}
                                        />
                                    )}
                                    <span className="sm:hidden truncate">{tab.shortLabel}</span>
                                    <span className="hidden sm:inline truncate">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* SEÇÃO 1: Identificação & Rastreabilidade */}
                {showId && (
                    <section className="rounded-xl border border-gray-700/80 bg-seguranca-black/40 p-3.5 sm:p-4 space-y-3.5">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <QrCode className="h-4 w-4 text-seguranca-yellow shrink-0" />
                                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white">
                                    1. Identificação & DOT
                                </h3>
                            </div>
                            <span className="text-[11px] text-gray-400 hidden sm:inline">
                                Informe ao menos Fogo ou Série
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-1 min-h-[20px]">
                                    <Label htmlFor="fireNumber" className="text-seguranca-yellow font-semibold text-xs whitespace-nowrap">
                                        Nº de Fogo (Interno)
                                    </Label>
                                    {!formData.fireNumber && (
                                        <button
                                            type="button"
                                            onClick={handleGenerateProvisionalFire}
                                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-seguranca-yellow/90 hover:text-seguranca-yellow bg-seguranca-yellow/10 hover:bg-seguranca-yellow/20 px-1.5 py-0.5 rounded border border-seguranca-yellow/30 transition-colors"
                                        >
                                            <Sparkles className="h-2.5 w-2.5" />
                                            Gerar prov.
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="fireNumber"
                                    value={formData.fireNumber}
                                    onChange={(e) => setFormData({ ...formData, fireNumber: e.target.value.toUpperCase() })}
                                    placeholder="Ex: FG-0142"
                                    enterKeyHint="next"
                                    className="h-11 sm:h-10 bg-seguranca-black border-gray-600 focus:border-seguranca-yellow font-mono font-bold text-white"
                                />
                                <p className="text-[10px] text-gray-400">Gravado na carcaça (opcional na pré-entrada)</p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between min-h-[20px]">
                                    <Label htmlFor="serialNumber" className="text-gray-100 font-semibold text-xs whitespace-nowrap">
                                        Nº de Série {!formData.fireNumber.trim() && '*'}
                                    </Label>
                                </div>
                                <Input
                                    id="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })}
                                    required={!formData.fireNumber.trim()}
                                    placeholder="Ex: SN-9874210"
                                    enterKeyHint="next"
                                    className="h-11 sm:h-10 bg-seguranca-black border-gray-600 focus:border-seguranca-yellow font-mono text-white"
                                />
                                <p className="text-[10px] text-gray-400">Código original do fabricante</p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between min-h-[20px]">
                                    <Label htmlFor="dot" className="text-gray-100 font-semibold text-xs whitespace-nowrap">
                                        DOT (Sem/Ano)
                                    </Label>
                                    <span className="text-[10px] text-gray-400 font-mono">4 dígitos</span>
                                </div>
                                <Input
                                    id="dot"
                                    inputMode="numeric"
                                    value={formData.dot}
                                    maxLength={4}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            dot: e.target.value.replace(/[^0-9]/g, '').slice(0, 4),
                                        })
                                    }
                                    placeholder="Ex: 3824"
                                    enterKeyHint="next"
                                    className="h-11 sm:h-10 bg-seguranca-black border-gray-600 focus:border-seguranca-yellow font-mono text-white"
                                />
                                {formData.dot ? (
                                    <div className="pt-0.5">
                                        {dotEval.expired ? (
                                            <Badge className="bg-red-950/70 text-red-300 border-red-600/60 text-[10px]">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Vencido ({dotEval.label} • {dotEval.ageYears}a)
                                            </Badge>
                                        ) : dotEval.validFormat ? (
                                            <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-700/50 text-[10px]">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                {dotEval.label} ({dotEval.ageYears}a / máx 5a)
                                            </Badge>
                                        ) : (
                                            <span className="text-[10px] text-amber-400">
                                                Complete 4 dígitos (ex: 3824)
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-400">Ex.: 3824 = Semana 38 de 2024</p>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* SEÇÃO 2: Especificações, Ciclo de Vida & Situação */}
                {showSpecs && (
                    <section className="rounded-xl border border-gray-700/80 bg-seguranca-black/40 p-3.5 sm:p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-seguranca-yellow shrink-0" />
                                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white">
                                    2. Especificações da Carcaça & Ciclo de Vida
                                </h3>
                            </div>
                        </div>

                        {/* Marca, Modelo e Medida */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <Label htmlFor="brand" className="text-xs font-semibold text-gray-100">
                                    Marca *
                                </Label>
                                <Input
                                    id="brand"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    required
                                    enterKeyHint="next"
                                    className="h-11 sm:h-10 bg-seguranca-black border-gray-600 focus:border-seguranca-yellow text-white"
                                    placeholder="Ex: Michelin, Pirelli, Bridgestone"
                                />
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                    {COMMON_BRANDS.map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, brand: b })}
                                            className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                                                formData.brand.toLowerCase() === b.toLowerCase()
                                                    ? 'bg-seguranca-yellow text-black border-seguranca-yellow font-bold'
                                                    : 'bg-seguranca-graphite text-gray-300 border-gray-700 hover:border-gray-500'
                                            }`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="model" className="text-xs font-semibold text-gray-100">
                                    Modelo da Carcaça *
                                </Label>
                                <Input
                                    id="model"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    required
                                    enterKeyHint="next"
                                    className="h-11 sm:h-10 bg-seguranca-black border-gray-600 focus:border-seguranca-yellow text-white"
                                    placeholder="Ex: X Multi Z / FR01 / R268"
                                />
                                <p className="text-[10px] text-gray-400">Desenho/linha da banda ou modelo original</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="size" className="text-xs font-semibold text-gray-100">
                                Medida do Pneu *
                            </Label>
                            <Input
                                id="size"
                                value={formData.size}
                                onChange={(e) => setFormData({ ...formData, size: e.target.value.toUpperCase() })}
                                required
                                enterKeyHint="next"
                                className="h-11 sm:h-10 bg-seguranca-black border-gray-600 focus:border-seguranca-yellow font-mono text-white"
                                placeholder="Ex: 295/80 R22.5"
                            />
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {COMMON_BUS_SIZES.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, size: s })}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                                            formData.size === s
                                                ? 'bg-seguranca-yellow text-black border-seguranca-yellow font-bold'
                                                : 'bg-seguranca-graphite text-gray-300 border-gray-700 hover:border-gray-500'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Seleção Visual de Estágio de Vida (Sem texto cortado!) */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-100 flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-seguranca-yellow" />
                                Status Atual de Vida *
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {LIFE_STAGE_OPTIONS.map((opt) => {
                                    const active = lifeStageValue === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleLifeStageChange(opt.value)}
                                            className={`p-2.5 rounded-lg border text-left transition-all min-h-[54px] flex flex-col justify-center ${
                                                active
                                                    ? `${opt.tone} ring-1 ring-white/40`
                                                    : 'bg-seguranca-graphite/60 border-gray-700 text-gray-300 hover:border-gray-500'
                                            }`}
                                        >
                                            <span className="text-xs font-bold leading-tight">{opt.title}</span>
                                            <span className="text-[10px] opacity-80 leading-tight mt-0.5">{opt.subtitle}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Situação & Tipo de Linha */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-100">Situação no Estoque / Frota</Label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {STATUS_OPTIONS.map((opt) => {
                                        const active = formData.status === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: opt.value })}
                                                className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors min-h-[42px] text-center ${
                                                    active
                                                        ? 'bg-white text-black border-white font-bold'
                                                        : 'bg-seguranca-graphite/70 text-gray-200 border-gray-700 hover:border-gray-500'
                                                }`}
                                            >
                                                <span className="sm:hidden">{opt.shortLabel}</span>
                                                <span className="hidden sm:inline">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {formData.status === 'IN_USE' && !tire?.vehicleId && (
                                    <p className="text-[10px] text-amber-300 pt-0.5">
                                        Dica: após salvar, use o <strong>Mapa de Chassi</strong> ou <strong>Movimentação</strong> para vincular frota, posição e KM de montagem.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-100">
                                    Linha de Operação (Calibração KM)
                                </Label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {LINE_OPTIONS.map((opt) => {
                                        const active = formData.lineType === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, lineType: opt.value })}
                                                className={`px-2 py-2 rounded-lg border transition-colors min-h-[42px] flex flex-col items-center justify-center ${
                                                    active
                                                        ? 'bg-seguranca-yellow text-black border-seguranca-yellow font-bold'
                                                        : 'bg-seguranca-graphite/70 text-gray-200 border-gray-700 hover:border-gray-500'
                                                }`}
                                            >
                                                <span className="text-[11px] font-semibold leading-tight">{opt.label}</span>
                                                <span className="text-[10px] opacity-80 font-mono">Fator {opt.factor}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* SEÇÃO 3: Sulco (TWI), Quilometragem, Local & Custo */}
                {showMetrics && (
                    <section className="rounded-xl border border-gray-700/80 bg-seguranca-black/40 p-3.5 sm:p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <Ruler className="h-4 w-4 text-seguranca-yellow shrink-0" />
                                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white">
                                    3. Medição de Sulco (TWI), KM & Estoque
                                </h3>
                            </div>
                        </div>

                        {/* Medição de Sulco com Stepper + Indicador Visual */}
                        <div className="rounded-lg border border-gray-700/70 bg-seguranca-graphite/50 p-3 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between min-h-[20px]">
                                        <Label htmlFor="currentTreadDepth" className="text-xs font-semibold text-gray-100">
                                            Sulco Atual (mm) *
                                        </Label>
                                        <span className={`text-[10px] font-semibold ${treadTone.text}`}>
                                            {treadHealthPct}% restante
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => adjustTreadDepth(-0.5)}
                                            aria-label="Diminuir 0.5 mm"
                                            className="h-11 w-11 sm:h-10 sm:w-10 p-0 border-gray-600 bg-seguranca-black text-white shrink-0"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input
                                            id="currentTreadDepth"
                                            type="number"
                                            inputMode="decimal"
                                            step="0.1"
                                            min="0"
                                            max="30"
                                            value={formData.currentTreadDepth}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    currentTreadDepth: Number.isNaN(v) ? 0 : v,
                                                });
                                            }}
                                            className={`h-11 sm:h-10 text-center bg-seguranca-black border-gray-600 font-mono font-bold text-white ${
                                                formData.currentTreadDepth <= 1.6
                                                    ? 'border-red-500 text-red-300'
                                                    : formData.currentTreadDepth <= 3.0
                                                    ? 'border-amber-500 text-amber-300'
                                                    : ''
                                            }`}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => adjustTreadDepth(0.5)}
                                            aria-label="Aumentar 0.5 mm"
                                            className="h-11 w-11 sm:h-10 sm:w-10 p-0 border-gray-600 bg-seguranca-black text-white shrink-0"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className={`text-[10px] font-medium ${treadTone.text}`}>{treadTone.label}</p>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between min-h-[20px]">
                                        <Label htmlFor="initialTreadDepth" className="text-xs font-semibold text-gray-100">
                                            Sulco Original (mm)
                                        </Label>
                                        <span className="text-[10px] text-gray-400">Novo / Reforma</span>
                                    </div>
                                    <Input
                                        id="initialTreadDepth"
                                        type="number"
                                        inputMode="decimal"
                                        step="0.1"
                                        min="0"
                                        max="30"
                                        value={formData.initialTreadDepth}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            setFormData({
                                                ...formData,
                                                initialTreadDepth: Number.isNaN(v) ? 0 : v,
                                            });
                                        }}
                                        className="h-11 sm:h-10 bg-seguranca-black border-gray-600 font-mono text-white"
                                    />
                                    <p className="text-[10px] text-gray-400">Padrão rodoviário/urbano: 14 a 18 mm</p>
                                </div>
                            </div>

                            <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${treadTone.bar}`}
                                    style={{ width: `${treadHealthPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Quilometragem */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between min-h-[20px]">
                                    <Label htmlFor="currentLifeMileage" className="text-xs font-semibold text-gray-100 flex items-center gap-1.5">
                                        <Gauge className="h-3.5 w-3.5 text-gray-400" />
                                        KM na Vida Atual
                                    </Label>
                                    {formData.currentLifeMileage > formData.currentMileage && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    currentMileage: prev.currentLifeMileage,
                                                }))
                                            }
                                            className="inline-flex items-center gap-1 text-[10px] text-seguranca-yellow hover:underline"
                                        >
                                            <RefreshCw className="h-2.5 w-2.5" />
                                            Igualar Total
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="currentLifeMileage"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    value={formData.currentLifeMileage}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        const km = Number.isNaN(v) ? 0 : Math.max(0, v);
                                        setFormData((prev) => ({
                                            ...prev,
                                            currentLifeMileage: km,
                                            currentMileage: prev.currentMileage < km && prev.recapCount === 0 ? km : prev.currentMileage,
                                        }));
                                    }}
                                    className="h-11 sm:h-10 bg-seguranca-black border-gray-600 font-mono text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between min-h-[20px]">
                                    <Label htmlFor="currentMileage" className="text-xs font-semibold text-gray-100 flex items-center gap-1.5">
                                        <Gauge className="h-3.5 w-3.5 text-seguranca-yellow" />
                                        KM Total da Carcaça
                                    </Label>
                                </div>
                                <Input
                                    id="currentMileage"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    value={formData.currentMileage}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        setFormData({
                                            ...formData,
                                            currentMileage: Number.isNaN(v) ? 0 : Math.max(0, v),
                                        });
                                    }}
                                    className="h-11 sm:h-10 bg-seguranca-black border-gray-600 font-mono text-white"
                                />
                            </div>
                        </div>

                        {/* Localização & Custo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                            <div className="space-y-1.5">
                                <Label htmlFor="locationNotes" className="text-xs font-semibold text-gray-100 flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                    Local de Armazenamento
                                </Label>
                                <Input
                                    id="locationNotes"
                                    value={formData.locationNotes}
                                    onChange={(e) => setFormData({ ...formData, locationNotes: e.target.value })}
                                    className="h-11 sm:h-10 bg-seguranca-black border-gray-600 text-white"
                                    placeholder="Ex: Almoxarifado Principal - Rack B2"
                                />
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                    {COMMON_LOCATIONS.map((loc) => (
                                        <button
                                            key={loc}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, locationNotes: loc })}
                                            className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                                                formData.locationNotes === loc
                                                    ? 'bg-gray-200 text-black border-gray-200 font-bold'
                                                    : 'bg-seguranca-graphite text-gray-300 border-gray-700 hover:border-gray-500'
                                            }`}
                                        >
                                            <Warehouse className="h-2.5 w-2.5 inline mr-1 opacity-75" />
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="acquisitionCost" className="text-xs font-semibold text-gray-100 flex items-center gap-1.5">
                                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                                    Custo de Aquisição (R$)
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400 pointer-events-none">
                                        R$
                                    </span>
                                    <Input
                                        id="acquisitionCost"
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        min="0"
                                        value={formData.acquisitionCost}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            setFormData({
                                                ...formData,
                                                acquisitionCost: Number.isNaN(v) ? 0 : Math.max(0, v),
                                            });
                                        }}
                                        className="h-11 sm:h-10 pl-9 bg-seguranca-black border-gray-600 font-mono text-white"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400">Valor unitário de compra ou nota fiscal</p>
                            </div>
                        </div>
                    </section>
                )}
            </form>
        </ResponsiveDrawer>
    );
};
