import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Plane, Bus, Plus, Edit, Trash2, Eye, Search, Clock, Footprints, Loader2, Route as RouteIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { travelTripService, TravelTrip } from '@/services/travelTripService';
import { routeService, Route } from '@/services/routeService';

interface LegRouteSelection {
    routeId: string;
    routeName: string;
    durationMinutes: number;
    distanceKm: number;
    originAddress: string;
    destinationAddress: string;
}

const TravelTrips: React.FC = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [trips, setTrips] = useState<TravelTrip[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedTrip, setSelectedTrip] = useState<TravelTrip | null>(null);
    const [legRoutes, setLegRoutes] = useState<(LegRouteSelection | null)[]>([null, null, null, null]);
    const [formData, setFormData] = useState({
        name: '',
        tripType: 'FRETADO' as 'FRETADO' | 'TURISTICO',
        legs: 1,
        leg1Description: '',
        leg2Description: '',
        leg3Description: '',
        leg4Description: '',
        estimatedDurationMinutes: 0,
        distanceKm: 0,
        originAddress: '',
        destinationAddress: '',
        observations: '',
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [tripsData, routesData] = await Promise.all([
                travelTripService.findAll(),
                routeService.findAllRoutes(),
            ]);
            setTrips(Array.isArray(tripsData) ? tripsData : []);
            setRoutes(Array.isArray(routesData) ? routesData : []);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredTrips = trips.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === 'all' || t.tripType === filterType;
        return matchSearch && matchType;
    });

    /** Converte duração do backend (ISO-8601 string ou seconds number) para minutos */
    const parseDuration = (val: unknown): number => {
        if (!val) return 0;
        if (typeof val === 'string') {
            const match = /PT(?:(\d+)H)?(?:(\d+)M)?/i.exec(val);
            if (match) return (Number.parseInt(match[1] || '0')) * 60 + Number.parseInt(match[2] || '0');
            const num = Number.parseFloat(val);
            if (!Number.isNaN(num)) return num > 300 ? Math.floor(num / 60) : Math.floor(num);
        }
        if (typeof val === 'number') return val > 300 ? Math.floor(val / 60) : val;
        return 0;
    };

    /** Recalcula duração, distância, origem e destino com base nas rotas selecionadas nas pegadas */
    const recalculateFromLegs = (newLegRoutes: (LegRouteSelection | null)[], numLegs: number) => {
        const activeLegRoutes = newLegRoutes.slice(0, numLegs).filter(Boolean) as LegRouteSelection[];
        if (activeLegRoutes.length === 0) {
            return { estimatedDurationMinutes: 0, distanceKm: 0, originAddress: '', destinationAddress: '' };
        }

        const totalDuration = activeLegRoutes.reduce((sum, lr) => sum + lr.durationMinutes, 0);
        const totalDistance = activeLegRoutes.reduce((sum, lr) => sum + lr.distanceKm, 0);
        const origin = activeLegRoutes[0].originAddress;
        const destination = activeLegRoutes[activeLegRoutes.length - 1].destinationAddress;

        return {
            estimatedDurationMinutes: totalDuration,
            distanceKm: Math.round(totalDistance * 10) / 10,
            originAddress: origin,
            destinationAddress: destination,
        };
    };

    /** Ao selecionar uma rota para uma pegada */
    const handleLegRouteChange = (legIndex: number, routeId: string) => {
        const route = routes.find(r => r.id === routeId);
        if (!route) return;

        const legRoute: LegRouteSelection = {
            routeId: route.id,
            routeName: route.name,
            durationMinutes: parseDuration(route.estimatedDuration),
            distanceKm: route.distanceKm || 0,
            originAddress: route.originAddress || '',
            destinationAddress: route.destinationAddress || '',
        };

        const newLegRoutes = [...legRoutes];
        newLegRoutes[legIndex] = legRoute;
        setLegRoutes(newLegRoutes);

        // Atualizar descrição da pegada com o nome da rota
        const legKey = `leg${legIndex + 1}Description`;
        const calculated = recalculateFromLegs(newLegRoutes, formData.legs);
        setFormData(prev => ({
            ...prev,
            [legKey]: route.name,
            ...calculated,
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '', tripType: 'FRETADO', legs: 1,
            leg1Description: '', leg2Description: '', leg3Description: '', leg4Description: '',
            estimatedDurationMinutes: 0, distanceKm: 0,
            originAddress: '', destinationAddress: '', observations: '',
        });
        setLegRoutes([null, null, null, null]);
    };

    const handleCreate = () => {
        setModalMode('create');
        setSelectedTrip(null);
        resetForm();
        setShowModal(true);
    };

    const loadTripToForm = (trip: TravelTrip) => {
        const dur = parseDuration(trip.estimatedDuration);
        setFormData({
            name: trip.name,
            tripType: trip.tripType,
            legs: trip.legs,
            leg1Description: trip.leg1Description || '',
            leg2Description: trip.leg2Description || '',
            leg3Description: trip.leg3Description || '',
            leg4Description: trip.leg4Description || '',
            estimatedDurationMinutes: dur,
            distanceKm: trip.distanceKm || 0,
            originAddress: trip.originAddress || '',
            destinationAddress: trip.destinationAddress || '',
            observations: trip.observations || '',
        });
        // Tentar mapear as descrições das pegadas para rotas existentes
        const newLegRoutes: (LegRouteSelection | null)[] = [null, null, null, null];
        for (let i = 0; i < trip.legs; i++) {
            const desc = (trip as any)[`leg${i + 1}Description`] || '';
            const matchedRoute = routes.find(r => r.name === desc);
            if (matchedRoute) {
                newLegRoutes[i] = {
                    routeId: matchedRoute.id,
                    routeName: matchedRoute.name,
                    durationMinutes: parseDuration(matchedRoute.estimatedDuration),
                    distanceKm: matchedRoute.distanceKm || 0,
                    originAddress: matchedRoute.originAddress || '',
                    destinationAddress: matchedRoute.destinationAddress || '',
                };
            }
        }
        setLegRoutes(newLegRoutes);
    };

    const handleEdit = (trip: TravelTrip) => {
        setModalMode('edit');
        setSelectedTrip(trip);
        loadTripToForm(trip);
        setShowModal(true);
    };

    const handleView = (trip: TravelTrip) => {
        setModalMode('view');
        setSelectedTrip(trip);
        loadTripToForm(trip);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            toast({ title: 'Erro', description: 'Nome da viagem é obrigatório', variant: 'destructive' });
            return;
        }
        try {
            const totalMinutes = formData.estimatedDurationMinutes;
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            const isoDuration = `PT${hours > 0 ? hours + 'H' : ''}${mins > 0 ? mins + 'M' : '0M'}`;

            const payload: Record<string, unknown> = {
                name: formData.name,
                tripType: formData.tripType,
                legs: formData.legs,
                leg1Description: formData.leg1Description || undefined,
                leg2Description: formData.leg2Description || undefined,
                leg3Description: formData.leg3Description || undefined,
                leg4Description: formData.leg4Description || undefined,
                estimatedDuration: isoDuration,
                distanceKm: formData.distanceKm || undefined,
                originAddress: formData.originAddress || undefined,
                destinationAddress: formData.destinationAddress || undefined,
                observations: formData.observations || undefined,
                durationMultiplier: formData.tripType === 'TURISTICO' ? 1.5 : 1.0,
            };

            if (modalMode === 'edit' && selectedTrip) {
                await travelTripService.update(selectedTrip.id, payload as Partial<TravelTrip>);
                toast({ title: 'Sucesso', description: 'Viagem atualizada' });
            } else {
                await travelTripService.create(payload as Partial<TravelTrip>);
                toast({ title: 'Sucesso', description: 'Viagem criada' });
            }
            setShowModal(false);
            loadData();
        } catch (err) {
            console.error('Erro ao salvar viagem:', err);
            toast({ title: 'Erro', description: 'Erro ao salvar viagem', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await travelTripService.delete(id);
            toast({ title: 'Viagem excluída' });
            loadData();
        } catch (err) {
            console.error('Erro ao excluir viagem:', err);
            toast({ title: 'Erro', variant: 'destructive' });
        }
    };

    const formatDuration = (val: unknown): string => {
        const mins = parseDuration(val);
        if (mins === 0) return '--';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
    };

    const getTypeBadge = (type: string) => {
        if (type === 'TURISTICO') {
            return <Badge className="bg-purple-600 text-white"><Plane className="w-3 h-3 mr-1" />Turístico</Badge>;
        }
        return <Badge className="bg-blue-600 text-white"><Bus className="w-3 h-3 mr-1" />Fretado</Badge>;
    };

    return (
        <StandardLayout title="Gestão de Viagens" subtitle="Cadastre viagens fretadas ou turísticas com até 4 pegadas">
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bus className="w-7 h-7 text-red-500" />
                        Gestão de Viagens
                    </h1>
                    <p className="text-gray-400 mt-1">Cadastre viagens fretadas ou turísticas com até 4 pegadas</p>
                </div>
                <Button onClick={handleCreate} className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="w-4 h-4 mr-1" /> Nova Viagem
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20"><Bus className="w-5 h-5 text-blue-400" /></div>
                        <div><p className="text-2xl font-bold text-white">{trips.filter(t => t.tripType === 'FRETADO').length}</p><p className="text-xs text-gray-400">Fretadas</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20"><Plane className="w-5 h-5 text-purple-400" /></div>
                        <div><p className="text-2xl font-bold text-white">{trips.filter(t => t.tripType === 'TURISTICO').length}</p><p className="text-xs text-gray-400">Turísticas</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20"><Footprints className="w-5 h-5 text-green-400" /></div>
                        <div><p className="text-2xl font-bold text-white">{trips.length}</p><p className="text-xs text-gray-400">Total de Viagens</p></div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card className="bg-seguranca-graphite border-gray-700 mb-6">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-seguranca-black border-gray-600 text-gray-200 pl-9"
                            placeholder="Buscar viagem..." />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200 w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            <SelectItem value="FRETADO">Fretado</SelectItem>
                            <SelectItem value="TURISTICO">Turístico</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Tabela */}
            <Card className="bg-seguranca-graphite border-gray-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                        </div>
                    ) : filteredTrips.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Bus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Nenhuma viagem encontrada</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-700 hover:bg-transparent">
                                    <TableHead className="text-gray-400">Código</TableHead>
                                    <TableHead className="text-gray-400">Nome</TableHead>
                                    <TableHead className="text-gray-400">Tipo</TableHead>
                                    <TableHead className="text-gray-400">Pegadas</TableHead>
                                    <TableHead className="text-gray-400">Duração Est.</TableHead>
                                    <TableHead className="text-gray-400">Distância</TableHead>
                                    <TableHead className="text-gray-400 text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTrips.map(trip => (
                                    <TableRow key={trip.id} className="border-gray-700 hover:bg-gray-800/50">
                                        <TableCell className="text-gray-400 font-mono text-sm">{trip.code || '--'}</TableCell>
                                        <TableCell className="text-white font-medium">{trip.name}</TableCell>
                                        <TableCell>{getTypeBadge(trip.tripType)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: trip.legs }).map((_, i) => (
                                                    <Footprints key={i} className="w-4 h-4 text-yellow-400" />
                                                ))}
                                                <span className="text-gray-400 text-sm ml-1">{trip.legs}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-gray-500" />
                                                {formatDuration(trip.estimatedDuration)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-300">{trip.distanceKm ? `${trip.distanceKm} km` : '--'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => handleView(trip)}
                                                    className="text-gray-400 hover:text-gray-300" title="Ver"><Eye className="w-4 h-4" /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(trip)}
                                                    className="text-blue-400 hover:text-blue-300" title="Editar"><Edit className="w-4 h-4" /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(trip.id)}
                                                    className="text-red-400 hover:text-red-300" title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bus className="w-5 h-5 text-red-500" />
                            {modalMode === 'view' ? 'Detalhes da Viagem' : modalMode === 'edit' ? 'Editar Viagem' : 'Nova Viagem'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {modalMode === 'view' ? 'Visualize os dados da viagem' : 'Configure a viagem com tipo e pegadas'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label className="text-gray-400">Nome da Viagem *</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-seguranca-black border-gray-600 text-gray-200 h-11"
                                placeholder="Ex: BH → Betim Manhã" disabled={modalMode === 'view'} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-gray-400">Tipo de Viagem *</Label>
                                <Select value={formData.tripType} onValueChange={(v: 'FRETADO' | 'TURISTICO') => setFormData({ ...formData, tripType: v })}
                                    disabled={modalMode === 'view'}>
                                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200 h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        <SelectItem value="FRETADO">
                                            <div className="flex items-center gap-2"><Bus className="w-4 h-4 text-blue-400" />Fretado</div>
                                        </SelectItem>
                                        <SelectItem value="TURISTICO">
                                            <div className="flex items-center gap-2"><Plane className="w-4 h-4 text-purple-400" />Turístico (tempo maior)</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {formData.tripType === 'TURISTICO' && (
                                    <p className="text-xs text-purple-400 mt-1">O tempo de execução turístico é 50% maior que o fretado</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-gray-400">Pegadas (trechos) *</Label>
                                <Select value={String(formData.legs)} onValueChange={(v) => {
                                    const newLegs = Number.parseInt(v);
                                    const calculated = recalculateFromLegs(legRoutes, newLegs);
                                    setFormData(prev => ({ ...prev, legs: newLegs, ...calculated }));
                                }}
                                    disabled={modalMode === 'view'}>
                                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200 h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        {[1, 2, 3, 4].map(n => (
                                            <SelectItem key={n} value={String(n)}>
                                                <div className="flex items-center gap-2">
                                                    {Array.from({ length: n }).map((_, i) => (
                                                        <Footprints key={i} className="w-3 h-3 text-yellow-400" />
                                                    ))}
                                                    <span>{n} pegada{n > 1 ? 's' : ''}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Seleção de Rotas por Pegada */}
                        <div className="space-y-3 p-4 bg-seguranca-black/50 rounded-lg border border-gray-700">
                            <p className="text-sm font-medium text-gray-400 flex items-center gap-1">
                                <Footprints className="w-4 h-4 text-yellow-400" /> Rotas das Pegadas
                            </p>
                            <p className="text-xs text-gray-500">Selecione uma rota para cada pegada — duração, distância, origem e destino serão preenchidos automaticamente</p>
                            {[0, 1, 2, 3].filter(i => i < formData.legs).map(i => (
                                <div key={i} className="space-y-1">
                                    <Label className="text-gray-500 text-xs flex items-center gap-1">
                                        <Footprints className="w-3 h-3 text-yellow-400" /> Pegada {i + 1}
                                    </Label>
                                    <Select
                                        value={legRoutes[i]?.routeId || ''}
                                        onValueChange={(routeId) => handleLegRouteChange(i, routeId)}
                                        disabled={modalMode === 'view'}
                                    >
                                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200 h-10">
                                            <SelectValue placeholder="Selecione uma rota...">
                                                {legRoutes[i] ? (
                                                    <div className="flex items-center gap-2">
                                                        <RouteIcon className="w-3 h-3 text-green-400" />
                                                        <span>{legRoutes[i]?.routeName}</span>
                                                    </div>
                                                ) : 'Selecione uma rota...'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10002]">
                                            {routes.length > 0 ? routes.map(route => (
                                                <SelectItem key={route.id} value={route.id} className="hover:bg-seguranca-black/50 cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <RouteIcon className="w-3 h-3 text-blue-400" />
                                                        <span>{route.name}</span>
                                                        {route.distanceKm ? (
                                                            <span className="text-xs text-gray-500">({route.distanceKm} km)</span>
                                                        ) : null}
                                                    </div>
                                                </SelectItem>
                                            )) : (
                                                <SelectItem value="none" disabled>Nenhuma rota cadastrada</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {legRoutes[i] && (
                                        <div className="flex items-center gap-4 text-xs text-gray-500 pl-1">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{legRoutes[i]?.durationMinutes} min</span>
                                            <span>{legRoutes[i]?.distanceKm} km</span>
                                            {legRoutes[i]?.originAddress && <span>De: {legRoutes[i]?.originAddress}</span>}
                                            {legRoutes[i]?.destinationAddress && <span>Até: {legRoutes[i]?.destinationAddress}</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Campos calculados automaticamente */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Duração Total (min)
                                    <Badge variant="outline" className="text-[10px] ml-1 border-gray-600 text-gray-500">auto</Badge>
                                </Label>
                                <Input type="number" value={formData.estimatedDurationMinutes}
                                    readOnly
                                    className="bg-seguranca-black border-gray-600 text-gray-300 h-11 cursor-default" />
                            </div>
                            <div>
                                <Label className="text-gray-400 flex items-center gap-1">
                                    Distância Total (km)
                                    <Badge variant="outline" className="text-[10px] ml-1 border-gray-600 text-gray-500">auto</Badge>
                                </Label>
                                <Input type="number" value={formData.distanceKm}
                                    readOnly
                                    className="bg-seguranca-black border-gray-600 text-gray-300 h-11 cursor-default" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-gray-400 flex items-center gap-1">
                                    Origem
                                    <Badge variant="outline" className="text-[10px] ml-1 border-gray-600 text-gray-500">auto</Badge>
                                </Label>
                                <Input value={formData.originAddress}
                                    readOnly
                                    className="bg-seguranca-black border-gray-600 text-gray-300 h-11 cursor-default"
                                    placeholder="Preenchido pela rota da 1ª pegada" />
                            </div>
                            <div>
                                <Label className="text-gray-400 flex items-center gap-1">
                                    Destino
                                    <Badge variant="outline" className="text-[10px] ml-1 border-gray-600 text-gray-500">auto</Badge>
                                </Label>
                                <Input value={formData.destinationAddress}
                                    readOnly
                                    className="bg-seguranca-black border-gray-600 text-gray-300 h-11 cursor-default"
                                    placeholder="Preenchido pela rota da última pegada" />
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-400">Observações</Label>
                            <Textarea value={formData.observations}
                                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                className="bg-seguranca-black border-gray-600 text-gray-200"
                                placeholder="Observações sobre a viagem..." rows={3} disabled={modalMode === 'view'} />
                        </div>

                        {modalMode !== 'view' && (
                            <Button onClick={handleSubmit} className="w-full bg-red-600 hover:bg-red-700 text-white h-11">
                                {modalMode === 'edit' ? 'Salvar Alterações' : 'Cadastrar Viagem'}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        </StandardLayout>
    );
};

export default TravelTrips;
