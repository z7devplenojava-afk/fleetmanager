import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Gauge, CheckCircle2, Route as RouteIcon, Calendar, Clock, Car, MapPin, UserCheck, ShieldAlert } from 'lucide-react';
import { DailyLog } from '@/services/dailyLogService';
import { clientService, Client } from '@/services/clientService';
import { contractService, Contract } from '@/services/contractService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { routeService, Route } from '@/services/routeService';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { VehicleCombobox } from '@/components/ui/vehicle-combobox';

interface DailyLogFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    log?: DailyLog | null;
    onSave: (data: any) => Promise<void>;
}

const GENERIC_WORDS = new Set([
    'ltda', 'sa', 's/a', 's.a.', 's.a', 'me', 'epp', 'eireli', 'construtora', 'contrutora',
    'engenharia', 'mineracao', 'logistica', 'transportes', 'transporte', 'servicos',
    'comercio', 'industria', 'grupo', 'companhia', 'cia', 'de', 'da', 'do', 'das', 'dos', 'e'
]);

function normalizeStr(val?: string): string {
    if (!val) return '';
    return String(val)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function getClientKeywords(clientName?: string): string[] {
    const norm = normalizeStr(clientName);
    if (!norm) return [];
    const tokens = norm
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length >= 3 && !GENERIC_WORDS.has(t));
    if (tokens.includes('fm2c') && !tokens.includes('fmqc')) tokens.push('fmqc');
    if (tokens.includes('fmqc') && !tokens.includes('fm2c')) tokens.push('fm2c');
    return tokens;
}

function isImportedRoute(r: Partial<Route>): boolean {
    const name = normalizeStr(r.name);
    const desc = normalizeStr(r.description);
    const orig = normalizeStr(r.originAddress);
    const dest = normalizeStr(r.destinationAddress);
    return (
        name.endsWith('.kmz') ||
        name.endsWith('.kml') ||
        desc.includes('.kmz') ||
        desc.includes('.kml') ||
        desc.includes('google earth') ||
        desc.includes('importad') ||
        orig.includes('kml') ||
        dest.includes('kml')
    );
}

const DailyLogFormModal: React.FC<DailyLogFormProps> = ({ open, onOpenChange, log, onSave }) => {
    const [formData, setFormData] = useState<Partial<DailyLog>>({
        date: new Date().toISOString().split('T')[0],
        shift: 'DAY',
        initialKm: 0,
        finalKm: 0,
        discountedKm: 0,
        allowance: 0,
        notes: ''
    });
    const [clients, setClients] = useState<Client[]>([]);
    const [allContracts, setAllContracts] = useState<Contract[]>([]);
    const [clientContracts, setClientContracts] = useState<any[]>([]);
    const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [clientPassengerRouteIds, setClientPassengerRouteIds] = useState<Set<string>>(new Set());
    const [clientPassengerRouteNames, setClientPassengerRouteNames] = useState<Set<string>>(new Set());
    const [selectedContractId, setSelectedContractId] = useState<string>('NONE');
    const [isSaving, setIsSaving] = useState(false);

    const loadBaseData = useCallback(async () => {
        try {
            const [clientsData, contractsData, workPostsData, routesData] = await Promise.all([
                clientService.getAllClients().catch(() => []),
                contractService.getAllContracts().catch(() => []),
                workPostService.getAllWorkPosts().catch(() => []),
                routeService.findAllRoutes().catch(() => [])
            ]);
            setClients(Array.isArray(clientsData) ? clientsData : []);
            setAllContracts(Array.isArray(contractsData) ? contractsData : []);
            setClientContracts(Array.isArray(contractsData) ? contractsData : []);
            setWorkPosts(Array.isArray(workPostsData) ? workPostsData : []);
            setRoutes(Array.isArray(routesData) ? routesData : []);
        } catch (error) {
            console.error('Erro ao carregar dados da Parte Diária:', error);
        }
    }, []);

    const loadContractsAndRoutesForClient = useCallback(
        async (clientId?: string) => {
            if (!clientId || clientId === 'ALL') {
                setClientContracts(allContracts);
                setClientPassengerRouteIds(new Set());
                setClientPassengerRouteNames(new Set());
                return;
            }

            try {
                const data = await contractService.getContractsByClient(clientId);
                if (Array.isArray(data) && data.length > 0) {
                    setClientContracts(data);
                } else {
                    setClientContracts(allContracts.filter((c: any) => String(c.clientId || c.client?.id) === String(clientId)));
                }
            } catch {
                setClientContracts(allContracts.filter((c: any) => String(c.clientId || c.client?.id) === String(clientId)));
            }

            // Buscar rotas atribuídas aos colaboradores/passageiros deste cliente
            try {
                const res = await api.get(`/passengers/client/${clientId}`).catch(() => ({ data: [] }));
                const raw = res.data;
                const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
                const rIds = new Set<string>();
                const rNames = new Set<string>();
                list.forEach((p: any) => {
                    if (p.routeId) rIds.add(String(p.routeId));
                    if (p.returnRouteId) rIds.add(String(p.returnRouteId));
                    if (p.routeName) rNames.add(normalizeStr(p.routeName));
                });
                setClientPassengerRouteIds(rIds);
                setClientPassengerRouteNames(rNames);
            } catch {
                setClientPassengerRouteIds(new Set());
                setClientPassengerRouteNames(new Set());
            }
        },
        [allContracts]
    );

    useEffect(() => {
        if (open) {
            loadBaseData();
        }
    }, [open, loadBaseData]);

    useEffect(() => {
        if (!open) return;
        if (log) {
            setFormData(log);
            if (log.clientId) {
                loadContractsAndRoutesForClient(log.clientId);
            }
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                shift: 'DAY',
                initialKm: 0,
                finalKm: 0,
                discountedKm: 0,
                allowance: 0,
                notes: ''
            });
            setSelectedContractId('NONE');
        }
    }, [log, open, loadContractsAndRoutesForClient]);

    const selectedClient = useMemo(
        () => clients.find(c => String(c.id) === String(formData.clientId)),
        [clients, formData.clientId]
    );

    // 1. Opções de CLIENTE (ALOCAÇÃO) com busca pelos 3 primeiros caracteres
    const clientOptions: SearchableOption[] = useMemo(() => {
        const opts: SearchableOption[] = [
            {
                value: 'ALL',
                label: '🏢 Todos os Clientes (Sem Filtro)',
                subtitle: 'Exibir veículos, obras e rotas de toda a base',
                badge: 'Geral',
                badgeColor: 'bg-slate-700 text-slate-200 border-slate-600',
                keywords: ['todos', 'sem filtro', 'geral']
            }
        ];

        clients.forEach(c => {
            const cnpj = (c as any).cnpj || '';
            const city = (c as any).city || '';
            const state = (c as any).state || '';
            const subtitleParts = [cnpj ? `CNPJ: ${cnpj}` : '', city ? `${city}${state ? `/${state}` : ''}` : ''].filter(Boolean);
            opts.push({
                value: c.id,
                label: c.name,
                subtitle: subtitleParts.join(' · ') || 'Cliente Ativo',
                badge: 'Cliente',
                badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                keywords: [c.name, (c as any).nomeFantasia || '', cnpj, city].filter(Boolean)
            });
        });

        return opts;
    }, [clients]);

    // 2. Opções de OBRA / CONTRATO (unindo Obras/Postos e Contratos do cliente selecionado)
    const obraContratoOptions: SearchableOption[] = useMemo(() => {
        const opts: SearchableOption[] = [
            {
                value: 'NONE',
                label: 'Sem Obra Específica',
                subtitle: 'Operação avulsa ou sem vínculo de obra específica',
                keywords: ['sem obra', 'nenhuma', 'avulso']
            }
        ];

        const seenIds = new Set<string>();
        const targetClientId = formData.clientId && formData.clientId !== 'ALL' ? String(formData.clientId) : '';
        const clientKeywords = getClientKeywords(selectedClient?.name);

        // Postos de Trabalho / Obras
        const relevantWorkPosts = workPosts.filter((wp: any) => {
            if (!targetClientId) return true;
            const wpClientId = String(wp.clientId || wp.client?.id || '');
            if (wpClientId === targetClientId) return true;
            const wpClientName = normalizeStr(wp.clientName || wp.client?.name || wp.name);
            return clientKeywords.some(kw => wpClientName.includes(kw));
        });

        relevantWorkPosts.forEach((wp: any) => {
            const valKey = `wp:${wp.id}`;
            if (seenIds.has(valKey)) return;
            seenIds.add(valKey);
            opts.push({
                value: valKey,
                label: `🏗️ ${wp.name}`,
                subtitle: [wp.city, wp.clientName || selectedClient?.name].filter(Boolean).join(' · ') || 'Obra / Posto de Trabalho',
                badge: 'Obra / Posto',
                badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                keywords: [wp.name, wp.city || '', wp.address || '', wp.clientName || ''].filter(Boolean)
            });
        });

        // Contratos
        const contractsSource = targetClientId
            ? clientContracts.length > 0
                ? clientContracts
                : allContracts.filter((ct: any) => {
                      const cId = String(ct.clientId || ct.client?.id || '');
                      if (cId === targetClientId) return true;
                      const cName = normalizeStr(ct.clientName || ct.obraName || ct.description);
                      return clientKeywords.some(kw => cName.includes(kw));
                  })
            : allContracts;

        contractsSource.forEach((ct: any) => {
            const valKey = String(ct.id || ct.contractNumber);
            if (!valKey || seenIds.has(valKey)) return;
            seenIds.add(valKey);
            const title = ct.obraName
                ? `🏗️ ${ct.obraName}`
                : `📄 ${ct.contractNumber || 'Contrato'}${ct.description ? ` - ${ct.description}` : ''}`;
            opts.push({
                value: valKey,
                label: title,
                subtitle: [ct.contractNumber, ct.description, ct.clientName].filter(Boolean).join(' · '),
                badge: 'Contrato',
                badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                keywords: [ct.contractNumber || '', ct.obraName || '', ct.description || '', ct.clientName || ''].filter(Boolean)
            });
        });

        return opts;
    }, [workPosts, clientContracts, allContracts, formData.clientId, selectedClient]);

    // 3. Opções de ROTA / TRAJETO do cliente (tanto importadas KMZ/KML/planilha quanto cadastradas manualmente)
    const routeOptions: SearchableOption[] = useMemo(() => {
        const targetClientId = formData.clientId && formData.clientId !== 'ALL' ? String(formData.clientId) : '';
        const clientKeywords = getClientKeywords(selectedClient?.name);

        // Obras do cliente para enriquecer a correspondência de rotas do cliente
        const clientObraKeywords = workPosts
            .filter((wp: any) => String(wp.clientId || wp.client?.id || '') === targetClientId)
            .flatMap(wp => [normalizeStr(wp.name), normalizeStr(wp.city)])
            .filter(Boolean);

        const matchesSelectedClient = (r: Route): boolean => {
            if (!targetClientId) return true;
            const rClientId = String((r as any).client?.id || (r as any).clientId || r.unit?.id || '');
            if (rClientId && rClientId === targetClientId) return true;
            if (r.id && clientPassengerRouteIds.has(String(r.id))) return true;
            if (r.name && clientPassengerRouteNames.has(normalizeStr(r.name))) return true;

            const hay = normalizeStr(
                [
                    (r as any).client?.name,
                    r.unit?.name,
                    r.location?.name,
                    r.name,
                    r.description,
                    r.originAddress,
                    r.destinationAddress
                ]
                    .filter(Boolean)
                    .join(' ')
            );

            if (clientKeywords.some(kw => hay.includes(kw))) return true;
            if (clientObraKeywords.some(okw => okw.length >= 3 && hay.includes(okw))) return true;
            return false;
        };

        const clientMatchedRoutes: SearchableOption[] = [];
        const otherAvailableRoutes: SearchableOption[] = [];
        const seenNames = new Set<string>();

        routes.forEach(r => {
            const name = (r.name || '').trim();
            if (!name) return;
            const normName = normalizeStr(name);
            if (seenNames.has(normName)) return;
            seenNames.add(normName);

            const imported = isImportedRoute(r);
            const isClientMatch = matchesSelectedClient(r);
            const rClientId = String((r as any).client?.id || (r as any).clientId || r.unit?.id || '');
            const belongsToAnotherClient = Boolean(
                targetClientId && rClientId && rClientId !== targetClientId && !isClientMatch
            );

            const subtitleParts = [
                r.originAddress && r.destinationAddress ? `${r.originAddress} ➔ ${r.destinationAddress}` : r.description || '',
                r.distanceKm ? `${r.distanceKm} km` : '',
                (r as any).client?.name || r.unit?.name || ''
            ].filter(Boolean);

            const option: SearchableOption = {
                value: name,
                label: name,
                subtitle: subtitleParts.join(' · ') || (imported ? 'Rota Importada (KML/KMZ)' : 'Rota Cadastrada Manualmente'),
                badge: imported
                    ? isClientMatch && targetClientId
                        ? 'Importada · Cliente'
                        : 'Importada (KMZ/KML)'
                    : isClientMatch && targetClientId
                        ? 'Cadastrada · Cliente'
                        : 'Cadastrada',
                badgeColor: imported
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                keywords: [
                    name,
                    r.code || '',
                    r.description || '',
                    r.originAddress || '',
                    r.destinationAddress || '',
                    (r as any).client?.name || '',
                    imported ? 'importada kmz kml' : 'cadastrada manual'
                ].filter(Boolean)
            };

            if (isClientMatch) {
                clientMatchedRoutes.push(option);
            } else if (!belongsToAnotherClient) {
                otherAvailableRoutes.push(option);
            }
        });

        // Também adiciona rotas derivadas das obras/contratos do cliente se não estiverem na lista
        workPosts
            .filter((wp: any) => !targetClientId || String(wp.clientId || wp.client?.id || '') === targetClientId)
            .forEach(wp => {
                const name = (wp.name || '').trim();
                const normName = normalizeStr(name);
                if (name && !seenNames.has(normName)) {
                    seenNames.add(normName);
                    clientMatchedRoutes.push({
                        value: name,
                        label: name,
                        subtitle: [wp.address, wp.city].filter(Boolean).join(' · ') || 'Trajeto / Obra do Cliente',
                        badge: 'Obra / Trajeto',
                        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                        keywords: [name, wp.city || '', wp.address || ''].filter(Boolean)
                    });
                }
            });

        return [...clientMatchedRoutes, ...otherAvailableRoutes];
    }, [routes, workPosts, formData.clientId, selectedClient, clientPassengerRouteIds, clientPassengerRouteNames]);

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRegisterManualRoute = async (customRouteName: string) => {
        const trimmed = customRouteName.trim();
        if (trimmed.length < 3) return;
        try {
            const payload: Record<string, any> = {
                name: trimmed,
                description: selectedClient ? `Rota cadastrada manualmente para ${selectedClient.name}` : 'Rota cadastrada manualmente na Parte Diária',
                status: 'ATIVA',
                checkpointsRequired: false,
                geofenceEnabled: false
            };
            if (formData.clientId && formData.clientId !== 'ALL') {
                payload.client = { id: formData.clientId };
            }
            const created = await routeService.createRoute(payload);
            if (created) {
                setRoutes(prev => [created, ...prev]);
                toast.success(`Rota "${trimmed}" cadastrada na lista do cliente!`);
            }
        } catch {
            // Mantém o valor no campo mesmo se offline
        }
    };

    const handleSave = async () => {
        if (!formData.vehicleId) {
            toast.error('Selecione um veículo.');
            return;
        }

        try {
            setIsSaving(true);
            await onSave(formData);
        } catch {
            // Error handling usually done in parent
        } finally {
            setIsSaving(false);
        }
    };

    const totalKm = Math.max(0, (formData.finalKm || 0) - (formData.initialKm || 0));
    const consideredKm = Math.max(0, totalKm - (formData.discountedKm || 0));
    const excessKm = Math.max(0, consideredKm - (formData.allowance || 0));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4">
                <DialogHeader className="border-b border-slate-800/80 pb-3.5">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2.5 text-white font-extrabold text-base sm:text-lg">
                            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-md">
                                <Gauge className="w-5 h-5" />
                            </div>
                            <span>{log ? 'Editar Parte Diária' : 'Nova Parte Diária'}</span>
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-slate-400 mt-1">
                        Preencha os dados da operação diária do veículo e apuração de quilometragem.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {/* Data e Turno */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="date" className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                Data da Operação
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                className="bg-slate-950 border-slate-700/80 text-white font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 text-sm [color-scheme:dark] shadow-inner"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                Turno de Operação
                            </Label>
                            <Select value={formData.shift} onValueChange={(val) => handleChange('shift', val)}>
                                <SelectTrigger className="bg-slate-950 border-slate-700/80 text-white font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 text-sm shadow-inner">
                                    <SelectValue placeholder="Selecione o turno" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                    <SelectItem value="DAY">☀️ Diurno</SelectItem>
                                    <SelectItem value="NIGHT">🌙 Noturno</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Cliente & Veículo / Placa em Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* 1. Seleção de Cliente com busca pelos 3 primeiros caracteres */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                                Cliente (Alocação)
                            </Label>
                            <SearchableSelect
                                value={formData.clientId || 'ALL'}
                                options={clientOptions}
                                placeholder="🏢 Todos os Clientes (Sem Filtro)"
                                searchPlaceholder="Digite os 3 primeiros caracteres do cliente..."
                                emptyText="Nenhum cliente encontrado."
                                onChange={(val) => {
                                    const selectedId = !val || val === 'ALL' ? undefined : val;
                                    handleChange('clientId', selectedId);
                                    loadContractsAndRoutesForClient(selectedId);
                                }}
                            />
                        </div>

                        {/* 2. Veículo / Placa com busca pelos 3 primeiros caracteres */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5 text-amber-400" />
                                Veículo / Placa
                            </Label>
                            <VehicleCombobox
                                value={formData.vehicleId}
                                clientId={formData.clientId}
                                clientName={selectedClient?.name}
                                onChange={(id, selectedVehicle) => {
                                    handleChange('vehicleId', id);
                                    if (selectedVehicle) {
                                        const plate = selectedVehicle.plate || selectedVehicle.placa;
                                        if (plate) handleChange('vehiclePlate', plate);
                                        const vClientId = selectedVehicle.clientId || selectedVehicle.client?.id;
                                        if (vClientId && !formData.clientId) {
                                            handleChange('clientId', vClientId);
                                            loadContractsAndRoutesForClient(vClientId);
                                        }
                                        if (selectedVehicle.workPostId) {
                                            setSelectedContractId(`wp:${selectedVehicle.workPostId}`);
                                        }
                                        if (selectedVehicle.routeName && !formData.route) {
                                            handleChange('route', selectedVehicle.routeName);
                                        }
                                        // Pré-preenche KM inicial com a quilometragem atual do veículo se for 0
                                        const currKm = selectedVehicle.currentMileage || selectedVehicle.mileage || selectedVehicle.quilometragem;
                                        if (currKm && (!formData.initialKm || formData.initialKm === 0)) {
                                            handleChange('initialKm', Number(currKm));
                                            if (!formData.finalKm || formData.finalKm === 0) {
                                                handleChange('finalKm', Number(currKm));
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Obra / Contrato do Cliente & Rota / Trajeto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* 3. Obra / Contrato com busca pelos 3 primeiros caracteres */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                                <RouteIcon className="w-3.5 h-3.5 text-amber-400" />
                                Obra / Contrato
                            </Label>
                            <SearchableSelect
                                value={selectedContractId || 'NONE'}
                                options={obraContratoOptions}
                                placeholder="Sem Obra Específica"
                                searchPlaceholder="Digite os 3 primeiros caracteres da obra ou contrato..."
                                emptyText="Nenhuma obra ou contrato encontrado."
                                allowCustomValue={true}
                                customValuePrefix="Usar obra/contrato"
                                onChange={(val, option) => {
                                    if (!val || val === 'NONE') {
                                        setSelectedContractId('NONE');
                                    } else {
                                        setSelectedContractId(val);
                                        if (val.startsWith('wp:')) {
                                            const wpId = val.replace('wp:', '');
                                            const foundWp = workPosts.find(w => String(w.id) === wpId);
                                            if (foundWp) {
                                                if (foundWp.clientId && !formData.clientId) {
                                                    handleChange('clientId', foundWp.clientId);
                                                    loadContractsAndRoutesForClient(foundWp.clientId);
                                                }
                                                if (!formData.route) {
                                                    handleChange('route', foundWp.name);
                                                }
                                            }
                                        } else {
                                            const foundCt = allContracts.find((c: any) => String(c.id || c.contractNumber) === val);
                                            if (foundCt) {
                                                const ctClientId = (foundCt as any).clientId || (foundCt as any).client?.id;
                                                if (ctClientId && !formData.clientId) {
                                                    handleChange('clientId', ctClientId);
                                                    loadContractsAndRoutesForClient(ctClientId);
                                                }
                                                const obra = (foundCt as any).obraName || foundCt.description || '';
                                                if (obra && !formData.route) {
                                                    handleChange('route', obra);
                                                }
                                            } else if (option && !formData.route) {
                                                handleChange('route', option.label.replace(/^[🏗️📄]\s*/, ''));
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>

                        {/* 4. Rota / Trajeto listando rotas importadas (KMZ/KML) e cadastradas manualmente do cliente */}
                        <div className="space-y-1.5">
                            <Label htmlFor="route" className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center justify-between gap-1.5">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                    Rota / Trajeto
                                </span>
                                <span className="text-[10px] text-emerald-400 font-normal normal-case">
                                    {routeOptions.length} rota(s) (importadas + manuais)
                                </span>
                            </Label>
                            <SearchableSelect
                                value={formData.route || ''}
                                fallbackLabel={formData.route || undefined}
                                options={routeOptions}
                                placeholder="Selecione ou digite os 3 primeiros caracteres da rota..."
                                searchPlaceholder="Digite os 3 primeiros caracteres da rota (importada ou manual)..."
                                emptyText="Nenhuma rota encontrada. Digite para cadastrar manualmente."
                                allowCustomValue={true}
                                customValuePrefix="Cadastrar / Usar rota manual"
                                onCreateCustomOption={handleRegisterManualRoute}
                                onChange={(val) => {
                                    handleChange('route', val);
                                    const matchedRoute = routes.find(r => normalizeStr(r.name) === normalizeStr(val));
                                    if (matchedRoute?.distanceKm && matchedRoute.distanceKm > 0) {
                                        const initKm = Number(formData.initialKm) || 0;
                                        if (initKm > 0 && (!formData.finalKm || formData.finalKm === initKm)) {
                                            handleChange('finalKm', Math.round(initKm + matchedRoute.distanceKm));
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Bloco de Leitura de Odômetro */}
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3.5 shadow-inner">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                                <RouteIcon className="w-4 h-4 text-amber-400" /> Apuração do Odômetro
                            </span>
                            <span className="text-[11px] text-slate-400">Leitura Automática</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-300 font-medium">KM Inicial</Label>
                                <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-700/80 text-white font-mono font-semibold text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 shadow-inner"
                                    value={formData.initialKm}
                                    onChange={(e) => handleChange('initialKm', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-300 font-medium">KM Final</Label>
                                <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-700/80 text-white font-mono font-semibold text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 shadow-inner"
                                    value={formData.finalKm}
                                    onChange={(e) => handleChange('finalKm', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-emerald-400 font-bold">Total Percorrido</Label>
                                <div className="h-10 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-end px-3 font-mono text-base font-extrabold text-emerald-400 shadow-sm">
                                    {totalKm.toLocaleString('pt-BR')} km
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Descontos e Franquia */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider">KM Descontado</Label>
                            <Input
                                type="number"
                                className="bg-slate-950 border-slate-700/80 text-white font-mono font-semibold text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 shadow-inner"
                                value={formData.discountedKm}
                                onChange={(e) => handleChange('discountedKm', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider">Franquia do Contrato (KM)</Label>
                            <Input
                                type="number"
                                className="bg-slate-950 border-slate-700/80 text-white font-mono font-semibold text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 shadow-inner"
                                value={formData.allowance}
                                onChange={(e) => handleChange('allowance', parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    {/* Status de Franquia */}
                    {excessKm > 0 ? (
                        <div className="bg-red-950/50 border border-red-500/50 p-3.5 rounded-xl flex flex-wrap justify-between items-center gap-2 shadow-inner">
                            <span className="text-red-400 font-bold uppercase text-xs tracking-wider flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" /> Excesso de Franquia Detectado
                            </span>
                            <span className="text-red-400 font-mono font-extrabold text-base">+{excessKm.toLocaleString('pt-BR')} km</span>
                        </div>
                    ) : (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl flex justify-between items-center shadow-inner">
                            <span className="text-emerald-400 font-semibold text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Rodagem dentro do limite da franquia
                            </span>
                            <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/40">OK</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-slate-800/80 pt-3.5 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-10 font-medium px-4 transition-all"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl h-10 px-5 shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2"
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                        <span>Salvar Parte Diária</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DailyLogFormModal;
