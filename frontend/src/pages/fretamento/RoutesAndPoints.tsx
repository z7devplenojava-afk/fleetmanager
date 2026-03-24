import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    MapPin,
    Route as RouteIcon,
    ChevronDown,
    ChevronRight,
    Clock,
    Radar,
    MoveUp,
    MoveDown,
    Building,
    X,
    CloudUpload,
    Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { routeService, Route, RoutePoint } from '@/services/routeService';
import clientService from '@/services/clientService';
import { OpenMapInteractive } from '@/components/routes/OpenMapInteractive';

interface Unit {
    id: string;
    name: string;
}

interface Location {
    id: string;
    name: string;
}

const RoutesAndPoints: React.FC = () => {
    const { toast } = useToast();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [pointModalOpen, setPointModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<string>('list');
    const [importModalOpen, setImportModalOpen] = useState(false);

    // Dropdown data
    const [units, setUnits] = useState<Unit[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnit, setFilterUnit] = useState<string>('all');
    const [importRouteFormData, setImportRouteFormData] = useState({
        clientId: '',
        file: null as File | null
    });

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        unitId: '',
        clientId: '',
        locationId: '',
        originCep: '',
        originAddress: '',
        destinationCep: '',
        destinationAddress: '',
        shift: '',
        executionTime: '',
        distanceKm: 0,
        estimatedDuration: 60, // minutes
        checkpointsRequired: false,
        geofenceEnabled: false,
        defaultRadiusMeters: 50,
    });

    // Points management
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
    const [pointFormData, setPointFormData] = useState<RoutePoint>({
        name: '',
        latitude: 0,
        longitude: 0,
        order: 0,
        type: 'BOARDING',
        radiusMeters: 50,
    });
    const [editingPointIndex, setEditingPointIndex] = useState<number | null>(null);

    // CEP lookup state
    const [loadingCepOrigem, setLoadingCepOrigem] = useState(false);
    const [loadingCepDestino, setLoadingCepDestino] = useState(false);

    // Dados estruturados do ViaCEP (para geocodificação precisa)
    const [originViaCep, setOriginViaCep] = useState<{ logradouro?: string; bairro?: string; localidade?: string; uf?: string } | null>(null);
    const [destinationViaCep, setDestinationViaCep] = useState<{ logradouro?: string; bairro?: string; localidade?: string; uf?: string } | null>(null);

    // Route tracing state
    const [tracingRoute, setTracingRoute] = useState(false);
    const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);

    /**
     * Busca endereço via ViaCEP e atualiza o campo de endereço correspondente.
     * @param cep - CEP digitado (pode conter máscara)
     * @param tipo - 'origin' ou 'destination'
     */
    const buscarCep = async (cep: string, tipo: 'origin' | 'destination') => {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return;

        const setLoading = tipo === 'origin' ? setLoadingCepOrigem : setLoadingCepDestino;
        setLoading(true);

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();

            if (!data.erro) {
                const endereco = [
                    data.logradouro,
                    data.bairro,
                    data.localidade ? `${data.localidade} - ${data.uf}` : data.uf,
                ].filter(Boolean).join(', ');

                // Armazenar dados estruturados para geocodificação precisa
                const dadosEstruturados = {
                    logradouro: data.logradouro || '',
                    bairro: data.bairro || '',
                    localidade: data.localidade || '',
                    uf: data.uf || '',
                };

                if (tipo === 'origin') {
                    setFormData(prev => ({ ...prev, originAddress: endereco }));
                    setOriginViaCep(dadosEstruturados);
                } else {
                    setFormData(prev => ({ ...prev, destinationAddress: endereco }));
                    setDestinationViaCep(dadosEstruturados);
                }

                toast({
                    title: 'CEP encontrado',
                    description: `Endereço de ${tipo === 'origin' ? 'origem' : 'destino'} preenchido automaticamente.`,
                });
            } else {
                toast({
                    title: 'CEP não encontrado',
                    description: 'Verifique o CEP digitado.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            toast({
                title: 'Erro ao buscar CEP',
                description: 'Não foi possível consultar o CEP. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    /** Formata o CEP enquanto digita (00000-000) */
    const formatarCep = (valor: string) => {
        const numeros = valor.replace(/\D/g, '').slice(0, 8);
        if (numeros.length <= 5) return numeros;
        return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
    };

    /**
     * Faz busca no Nominatim com parâmetros de URL prontos.
     */
    const nominatimFetch = async (params: string): Promise<{ lat: number; lon: number } | null> => {
        try {
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/search?${params}&format=json&limit=1&countrycodes=br`,
                { headers: { 'Accept-Language': 'pt-BR' } }
            );
            const data = await resp.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }
            return null;
        } catch (err) {
            console.error('Erro na geocodificação:', err);
            return null;
        }
    };

    /**
     * Geocodifica usando múltiplas estratégias com busca ESTRUTURADA do Nominatim.
     * A busca estruturada (street, city, state) é muito mais confiável que texto livre.
     */
    const geocodificarComFallback = async (
        endereco: string,
        cep: string,
        viaCepData: { logradouro?: string; bairro?: string; localidade?: string; uf?: string } | null
    ): Promise<{ lat: number; lon: number } | null> => {

        // Estratégia 1: Busca ESTRUTURADA com dados do ViaCEP (mais confiável)
        if (viaCepData?.localidade) {
            const params = new URLSearchParams();
            if (viaCepData.logradouro) params.set('street', viaCepData.logradouro);
            params.set('city', viaCepData.localidade);
            if (viaCepData.uf) params.set('state', viaCepData.uf);

            const result1 = await nominatimFetch(params.toString());
            if (result1) {
                console.log(`Geocoding OK: busca estruturada (rua+cidade+estado)`);
                return result1;
            }
            console.log(`Geocoding: busca estruturada completa falhou, tentando só cidade...`);

            // Estratégia 2: Só cidade + estado (sem rua)
            const params2 = new URLSearchParams();
            params2.set('city', viaCepData.localidade);
            if (viaCepData.uf) params2.set('state', viaCepData.uf);

            const result2 = await nominatimFetch(params2.toString());
            if (result2) {
                console.log(`Geocoding OK: busca por cidade+estado "${viaCepData.localidade}, ${viaCepData.uf}"`);
                return result2;
            }
            console.log(`Geocoding: cidade+estado falhou, tentando texto livre...`);
        }

        // Estratégia 3: Texto livre com endereço completo
        if (endereco) {
            const result3 = await nominatimFetch(`q=${encodeURIComponent(endereco)}`);
            if (result3) {
                console.log(`Geocoding OK: texto livre "${endereco}"`);
                return result3;
            }
            console.log(`Geocoding: texto livre falhou para "${endereco}", tentando CEP...`);
        }

        // Estratégia 4: CEP como postalcode (busca estruturada)
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length === 8) {
            const params4 = new URLSearchParams();
            params4.set('postalcode', cepLimpo);

            const result4 = await nominatimFetch(params4.toString());
            if (result4) {
                console.log(`Geocoding OK: postalcode "${cepLimpo}"`);
                return result4;
            }

            // Estratégia 5: CEP formatado como texto livre
            const cepFormatado = `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
            const result5 = await nominatimFetch(`q=${encodeURIComponent(cepFormatado + ', Brasil')}`);
            if (result5) {
                console.log(`Geocoding OK: CEP formatado "${cepFormatado}"`);
                return result5;
            }
        }

        console.error(`Geocoding: todas as estratégias falharam para CEP="${cep}" endereço="${endereco}"`);
        return null;
    };

    /**
     * Traça a rota no mapa:
     * 1. Geocodifica origem e destino usando endereços + CEPs com fallback
     * 2. Busca a rota real via OSRM (segue estradas)
     * 3. Cria pontos START e END automaticamente
     * 4. Atualiza distância e duração
     */
    const handleTracarRota = async () => {
        // Validação: precisa de pelo menos CEP de origem e destino
        if (!formData.originCep && !formData.originAddress) {
            toast({
                title: 'Origem obrigatória',
                description: 'Preencha o CEP de origem antes de traçar a rota.',
                variant: 'destructive',
            });
            return;
        }
        if (!formData.destinationCep && !formData.destinationAddress) {
            toast({
                title: 'Destino obrigatório',
                description: 'Preencha o CEP de destino antes de traçar a rota.',
                variant: 'destructive',
            });
            return;
        }

        setTracingRoute(true);
        setRoutePolyline([]);

        try {
            // 1. Geocodificar origem e destino com múltiplas estratégias
            const [origemCoords, destinoCoords] = await Promise.all([
                geocodificarComFallback(formData.originAddress, formData.originCep, originViaCep),
                geocodificarComFallback(formData.destinationAddress, formData.destinationCep, destinationViaCep),
            ]);

            if (!origemCoords) {
                toast({
                    title: 'Origem não encontrada',
                    description: `Não foi possível localizar "${formData.originAddress || formData.originCep}". Verifique o CEP ou edite o endereço manualmente.`,
                    variant: 'destructive',
                });
                return;
            }

            if (!destinoCoords) {
                toast({
                    title: 'Destino não encontrado',
                    description: `Não foi possível localizar "${formData.destinationAddress || formData.destinationCep}". Verifique o CEP ou edite o endereço manualmente.`,
                    variant: 'destructive',
                });
                return;
            }

            // 2. Buscar rota via OSRM (gratuito, segue estradas)
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origemCoords.lon},${origemCoords.lat};${destinoCoords.lon},${destinoCoords.lat}?overview=full&geometries=geojson`;
            const routeResp = await fetch(osrmUrl);
            const routeData = await routeResp.json();

            if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
                toast({
                    title: 'Rota não encontrada',
                    description: 'Não foi possível calcular uma rota entre os endereços informados.',
                    variant: 'destructive',
                });
                return;
            }

            const route = routeData.routes[0];
            const distanciaKm = parseFloat((route.distance / 1000).toFixed(1));
            const duracaoMin = Math.round(route.duration / 60);

            // 3. Extrair polyline da rota (GeoJSON: [lng, lat] → converter para [lat, lng])
            const coords: [number, number][] = route.geometry.coordinates.map(
                (c: [number, number]) => [c[1], c[0]] as [number, number]
            );
            setRoutePolyline(coords);

            // 4. Atualizar distância e duração no formulário
            setFormData(prev => ({
                ...prev,
                distanceKm: distanciaKm,
                estimatedDuration: duracaoMin,
            }));

            // 5. Criar pontos START e END se ainda não existem
            const hasStart = routePoints.some(p => p.type === 'START');
            const hasEnd = routePoints.some(p => p.type === 'END');

            const newPoints = [...routePoints];

            if (!hasStart) {
                newPoints.unshift({
                    name: formData.originAddress || `Origem (${formData.originCep})`,
                    latitude: origemCoords.lat,
                    longitude: origemCoords.lon,
                    order: 0,
                    type: 'START',
                    radiusMeters: formData.defaultRadiusMeters || 50,
                });
            } else {
                // Atualizar coordenadas do START existente
                const startIdx = newPoints.findIndex(p => p.type === 'START');
                if (startIdx >= 0) {
                    newPoints[startIdx] = {
                        ...newPoints[startIdx],
                        latitude: origemCoords.lat,
                        longitude: origemCoords.lon,
                        name: formData.originAddress || newPoints[startIdx].name,
                    };
                }
            }

            if (!hasEnd) {
                newPoints.push({
                    name: formData.destinationAddress || `Destino (${formData.destinationCep})`,
                    latitude: destinoCoords.lat,
                    longitude: destinoCoords.lon,
                    order: newPoints.length,
                    type: 'END',
                    radiusMeters: formData.defaultRadiusMeters || 50,
                });
            } else {
                // Atualizar coordenadas do END existente
                const endIdx = newPoints.findIndex(p => p.type === 'END');
                if (endIdx >= 0) {
                    newPoints[endIdx] = {
                        ...newPoints[endIdx],
                        latitude: destinoCoords.lat,
                        longitude: destinoCoords.lon,
                        name: formData.destinationAddress || newPoints[endIdx].name,
                    };
                }
            }

            // Reordenar
            newPoints.forEach((p, i) => { p.order = i; });
            setRoutePoints(newPoints);

            toast({
                title: 'Rota traçada com sucesso',
                description: `Distância: ${distanciaKm} km | Duração estimada: ${duracaoMin} min`,
            });

        } catch (error) {
            console.error('Erro ao traçar rota:', error);
            toast({
                title: 'Erro ao traçar rota',
                description: 'Não foi possível calcular a rota. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setTracingRoute(false);
        }
    };

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    // Apply filters
    useEffect(() => {
        applyFilters();
    }, [routes, searchTerm, filterUnit]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load routes
            try {
                const routesData = await routeService.findAllRoutes();
                setRoutes(Array.isArray(routesData) ? routesData : []);
            } catch (err) {
                console.error('Error loading routes:', err);
                setRoutes([]);
            }

            // Load clients (usados como seletor de "Cliente" no form)
            try {
                const clientsData = await clientService.getAllClients();
                const clientUnits = clientsData.map(c => ({ id: c.id, name: c.name }));
                setUnits(clientUnits);
            } catch (err) {
                console.error('Error loading clients:', err);
                setUnits([]);
            }

            // Locations serão carregados quando houver endpoint real
            setLocations([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...routes];

        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterUnit !== 'all') {
            filtered = filtered.filter(r => (r as any).client?.id === filterUnit || r.unit?.id === filterUnit);
        }

        setFilteredRoutes(filtered);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterUnit('all');
    };

    const handleCreate = () => {
        setModalMode('create');
        setSelectedRoute(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            unitId: '',
            clientId: '',
            locationId: '',
            originCep: '',
            originAddress: '',
            destinationCep: '',
            destinationAddress: '',
            shift: '',
            executionTime: '',
            distanceKm: 0,
            estimatedDuration: 60,
            checkpointsRequired: false,
            geofenceEnabled: false,
            defaultRadiusMeters: 50,
        });
        setRoutePoints([]);
        setActiveTab('form');
    };

    const handleEdit = (route: Route) => {
        setModalMode('edit');
        setSelectedRoute(route);
        const r = route as any;
        setFormData({
            name: route.name,
            code: r.code || '',
            description: route.description || '',
            unitId: '',
            clientId: r.client?.id || r.clientId || '',
            locationId: '',
            originCep: r.originCep || '',
            originAddress: r.originAddress || '',
            destinationCep: r.destinationCep || '',
            destinationAddress: r.destinationAddress || '',
            shift: r.shift || '',
            executionTime: r.executionTime || '',
            distanceKm: r.distanceKm || 0,
            estimatedDuration: parseDurationToMinutes(route.estimatedDuration) || 60,
            checkpointsRequired: route.checkpointsRequired,
            geofenceEnabled: route.geofenceEnabled,
            defaultRadiusMeters: route.defaultRadiusMeters || 50,
        });
        setRoutePoints(route.points || []);
        setActiveTab('form');
    };

    const handleView = (route: Route) => {
        setModalMode('view');
        setSelectedRoute(route);
        const r = route as any;
        setFormData({
            name: route.name,
            code: r.code || '',
            description: route.description || '',
            unitId: '',
            clientId: r.client?.id || r.clientId || '',
            locationId: '',
            originCep: r.originCep || '',
            originAddress: r.originAddress || '',
            destinationCep: r.destinationCep || '',
            destinationAddress: r.destinationAddress || '',
            shift: r.shift || '',
            executionTime: r.executionTime || '',
            distanceKm: r.distanceKm || 0,
            estimatedDuration: parseDurationToMinutes(route.estimatedDuration) || 60,
            checkpointsRequired: route.checkpointsRequired,
            geofenceEnabled: route.geofenceEnabled,
            defaultRadiusMeters: route.defaultRadiusMeters || 50,
        });
        setRoutePoints(route.points || []);
        setActiveTab('form');
    };

    const handleDelete = async (route: Route) => {
        if (!confirm(`Tem certeza que deseja excluir a rota "${route.name}"?`)) return;

        try {
            await routeService.deleteRoute(route.id);
            toast({
                title: 'Sucesso',
                description: 'Rota excluída com sucesso',
            });
            loadData();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Erro ao excluir rota',
                variant: 'destructive',
            });
        }
    };

    const handleSubmit = async () => {
        // Validação: nome e cliente são obrigatórios
        if (!formData.name) {
            toast({
                title: 'Erro de Validação',
                description: 'O nome da rota é obrigatório.',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.clientId) {
            toast({
                title: 'Erro de Validação',
                description: 'Selecione um cliente para a rota.',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.originCep && !formData.originAddress) {
            toast({
                title: 'Erro de Validação',
                description: 'Informe o CEP ou endereço de origem.',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.destinationCep && !formData.destinationAddress) {
            toast({
                title: 'Erro de Validação',
                description: 'Informe o CEP ou endereço de destino.',
                variant: 'destructive',
            });
            return;
        }

        if (routePoints.length < 2) {
            toast({
                title: 'Erro de Validação',
                description: 'A rota deve ter pelo menos 2 pontos (início e fim). Use o botão "Traçar rota no mapa" para criá-los automaticamente.',
                variant: 'destructive',
            });
            return;
        }

        const hasStart = routePoints.some(p => p.type === 'START');
        const hasEnd = routePoints.some(p => p.type === 'END');

        if (!hasStart || !hasEnd) {
            toast({
                title: 'Erro de Validação',
                description: 'A rota deve ter um ponto de início (START) e um ponto final (END). Use o botão "Traçar rota no mapa".',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Converter duração em minutos para formato ISO-8601 (PT__M) que o backend espera (java.time.Duration)
            const durationMinutes = formData.estimatedDuration || 0;
            const hours = Math.floor(durationMinutes / 60);
            const mins = durationMinutes % 60;
            const isoDuration = hours > 0 ? `PT${hours}H${mins > 0 ? mins + 'M' : ''}` : `PT${mins}M`;

            const data: Record<string, any> = {
                name: formData.name,
                code: formData.code || undefined,
                description: formData.description || undefined,
                originCep: formData.originCep || undefined,
                originAddress: formData.originAddress || undefined,
                destinationCep: formData.destinationCep || undefined,
                destinationAddress: formData.destinationAddress || undefined,
                shift: formData.shift || undefined,
                executionTime: formData.executionTime || undefined,
                distanceKm: formData.distanceKm || 0,
                estimatedDuration: isoDuration,
                checkpointsRequired: formData.checkpointsRequired,
                geofenceEnabled: formData.geofenceEnabled,
                defaultRadiusMeters: formData.defaultRadiusMeters,
                points: routePoints.map((p, idx) => ({
                    ...p,
                    order: idx,
                })),
            };

            // Enviar client se selecionado (clientId é um UUID real vindo do backend)
            if (formData.clientId) data.client = { id: formData.clientId };

            if (modalMode === 'create') {
                await routeService.createRoute(data);
                toast({
                    title: 'Sucesso',
                    description: 'Rota criada com sucesso',
                });
            } else if (modalMode === 'edit' && selectedRoute) {
                await routeService.updateRoute(selectedRoute.id, data);
                toast({
                    title: 'Sucesso',
                    description: 'Rota atualizada com sucesso',
                });
            }

            setActiveTab('list');
            loadData();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Erro ao salvar rota',
                variant: 'destructive',
            });
        }
    };

    const handleAddPoint = () => {
        setEditingPointIndex(null);
        setPointFormData({
            name: '',
            latitude: 0,
            longitude: 0,
            order: routePoints.length,
            type: 'BOARDING',
            radiusMeters: formData.defaultRadiusMeters,
        });
        setPointModalOpen(true);
    };

    const handleEditPoint = (index: number) => {
        setEditingPointIndex(index);
        setPointFormData({ ...routePoints[index] });
        setPointModalOpen(true);
    };

    const handleMapClick = (event: mapboxgl.MapLayerMouseEvent) => {
        if (modalMode === 'view') return;

        const { lng, lat } = event.lngLat;

        setEditingPointIndex(null);
        setPointFormData({
            name: `Novo Ponto ${routePoints.length + 1}`,
            type: 'BOARDING',
            latitude: lat,
            longitude: lng,
            radiusMeters: formData.defaultRadiusMeters || 50,
        });
        setPointModalOpen(true);
    };

    const handleSavePoint = () => {
        if (!pointFormData.name || !pointFormData.type) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, informe o nome e o tipo do ponto.",
                variant: "destructive"
            });
            return;
        }

        const newPoint: RoutePoint = {
            id: editingPointIndex !== null ? routePoints[editingPointIndex].id : undefined,
            name: pointFormData.name,
            type: pointFormData.type,
            latitude: pointFormData.latitude || 0, // Ensure latitude is not undefined
            longitude: pointFormData.longitude || 0, // Ensure longitude is not undefined
            order: editingPointIndex !== null ? editingPointIndex : routePoints.length,
            radiusMeters: pointFormData.radiusMeters,
        };

        const newPoints = [...routePoints];
        if (editingPointIndex !== null) {
            newPoints[editingPointIndex] = newPoint;
        } else {
            newPoints.push(newPoint);
        }

        setRoutePoints(newPoints);
        setPointModalOpen(false);
    };

    const handleDeletePoint = (index: number) => {
        const updated = routePoints.filter((_, i) => i !== index);
        setRoutePoints(updated.map((p, idx) => ({ ...p, order: idx })));
    };

    const handleMovePoint = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= routePoints.length) return;

        const updated = [...routePoints];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setRoutePoints(updated.map((p, idx) => ({ ...p, order: idx })));
    };

    const toggleRouteExpansion = (routeId: string) => {
        const newExpanded = new Set(expandedRoutes);
        if (newExpanded.has(routeId)) {
            newExpanded.delete(routeId);
        } else {
            newExpanded.add(routeId);
        }
        setExpandedRoutes(newExpanded);
    };

    const getPointTypeIcon = (type: RoutePoint['type']) => {
        const config = {
            START: '🟢',
            BOARDING: '🔵',
            DEBARKATION: '🟠',
            END: '🔴',
        };
        return config[type];
    };

    const getPointTypeBadge = (type: RoutePoint['type']) => {
        const config = {
            START: { label: 'Início', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
            BOARDING: { label: 'Embarque', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
            DEBARKATION: { label: 'Desembarque', className: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
            END: { label: 'Fim', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
        };
        const { label, className } = config[type];
        return <Badge className={className}>{label}</Badge>;
    };

    /** Parseia duração que pode vir como segundos (number), ISO-8601 string ("PT1H30M") ou segundos decimais */
    const parseDurationToMinutes = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'string') {
            // ISO-8601 format: PT1H30M, PT45M, PT2H, PT90M, etc.
            const match = val.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/i);
            if (match) {
                const h = parseInt(match[1] || '0');
                const m = parseInt(match[2] || '0');
                const s = parseFloat(match[3] || '0');
                return h * 60 + m + Math.round(s / 60);
            }
            // Caso seja um número como string
            const num = parseFloat(val);
            if (!isNaN(num)) return Math.floor(num / 60);
            return 0;
        }
        if (typeof val === 'number') {
            // Se for > 300, provavelmente são segundos; senão, minutos
            return val > 300 ? Math.floor(val / 60) : val;
        }
        return 0;
    };

    const formatDuration = (val: any) => {
        const totalMinutes = parseDurationToMinutes(val);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    };

    return (
        <StandardLayout
            title="Gestão de Rotas"
            subtitle="Gerencie suas rotas e informações"
        >
            <div className="p-0 space-y-0 h-full flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    <div className="px-6 border-b border-gray-700 bg-seguranca-graphite/50 backdrop-blur-sm sticky top-0 z-10">
                        <TabsList className="bg-transparent border-none h-14 p-0 gap-8">
                            <TabsTrigger
                                value="list"
                                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-seguranca-yellow data-[state=active]:bg-transparent text-gray-400 data-[state=active]:text-seguranca-yellow font-semibold transition-all px-0"
                            >
                                Lista de Rotas
                            </TabsTrigger>
                            <TabsTrigger
                                value="form"
                                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-seguranca-yellow data-[state=active]:bg-transparent text-gray-400 data-[state=active]:text-seguranca-yellow font-semibold transition-all px-0"
                            >
                                {modalMode === 'create' ? 'Cadastrar Nova Rota' :
                                    modalMode === 'edit' ? 'Editar Rota' : 'Detalhes da Rota'}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="list" className="p-6 space-y-6 m-0 flex-1 overflow-y-auto">
                        {/* Filters Section */}
                        <Card className="bg-seguranca-graphite border-gray-700">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <RouteIcon className="w-5 h-5 text-seguranca-yellow" />
                                        Rotas Ativas
                                    </h3>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={resetFilters}
                                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                        >
                                            Limpar Filtros
                                        </Button>
                                        <Button
                                            onClick={handleCreate}
                                            className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nova Rota
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="lg:col-span-2">
                                        <Label className="text-gray-400 text-sm">Busca</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Digite o nome da rota..."
                                                className="pl-10 bg-seguranca-black border-gray-600 text-gray-200 focus:border-seguranca-yellow/50 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-gray-400 text-sm">Filtrar por Cliente</Label>
                                        <Select value={filterUnit} onValueChange={setFilterUnit}>
                                            <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-seguranca-graphite border-gray-600">
                                                <SelectItem value="all">Todos os Clientes</SelectItem>
                                                {units.map(u => (
                                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Routes List */}
                        <div className="space-y-3">
                            {loading ? (
                                <Card className="bg-seguranca-graphite border-gray-700">
                                    <CardContent className="p-12 text-center text-gray-400">
                                        <div className="animate-spin w-8 h-8 border-2 border-seguranca-yellow border-t-transparent rounded-full mx-auto mb-4" />
                                        Carregando informações...
                                    </CardContent>
                                </Card>
                            ) : filteredRoutes.length === 0 ? (
                                <Card className="bg-seguranca-graphite border-gray-700">
                                    <CardContent className="p-12 text-center text-gray-400">
                                        <RouteIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>Nenhuma rota encontrada para os filtros selecionados</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredRoutes.map((route) => (
                                    <Collapsible key={route.id}>
                                        <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <CollapsibleTrigger
                                                            onClick={() => toggleRouteExpansion(route.id)}
                                                            className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
                                                        >
                                                            {expandedRoutes.has(route.id) ? (
                                                                <ChevronDown className="w-5 h-5 text-seguranca-yellow" />
                                                            ) : (
                                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </CollapsibleTrigger>
                                                        <div className="flex-1 min-w-0">
                                                            <CardTitle className="text-white text-lg flex items-center gap-2 truncate">
                                                                <RouteIcon className="w-5 h-5 text-seguranca-yellow shrink-0" />
                                                                {route.name}
                                                            </CardTitle>
                                                            {route.description && (
                                                                <p className="text-sm text-gray-400 mt-0.5 truncate">{route.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right hidden sm:block">
                                                            <Badge variant="outline" className="bg-seguranca-yellow/10 border-seguranca-yellow/30 text-seguranca-yellow">
                                                                {route.points?.length || 0} pontos
                                                            </Badge>
                                                            {route.estimatedDuration && (
                                                                <p className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatDuration(route.estimatedDuration)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-seguranca-black border-gray-700">
                                                                <DropdownMenuItem
                                                                    onClick={() => handleView(route)}
                                                                    className="text-gray-300 hover:bg-gray-800 cursor-pointer"
                                                                >
                                                                    <Eye className="w-4 h-4 mr-2 text-blue-400" />
                                                                    Visualizar Detalhes
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleEdit(route)}
                                                                    className="text-gray-300 hover:bg-gray-800 cursor-pointer"
                                                                >
                                                                    <Edit className="w-4 h-4 mr-2 text-seguranca-yellow" />
                                                                    Editar Parâmetros
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(route)}
                                                                    className="text-red-400 hover:bg-red-900/20 cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Excluir Rota
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CollapsibleContent>
                                                <CardContent className="pt-0 pb-6">
                                                    <div className="border-t border-gray-700/50 pt-4 mt-1">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Unidade Responsável</p>
                                                                <div className="flex items-center gap-2 text-gray-200">
                                                                    <Building className="w-4 h-4 text-blue-400" />
                                                                    <span className="text-sm">{route.unit?.name || 'Não definida'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Local da Operação</p>
                                                                <div className="flex items-center gap-2 text-gray-200">
                                                                    <MapPin className="w-4 h-4 text-green-400" />
                                                                    <span className="text-sm">{route.location?.name || 'Não definido'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Monitoramento Geofence</p>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className={route.geofenceEnabled ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}>
                                                                        {route.geofenceEnabled ? 'Ativo' : 'Inativo'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Checkpoints Requeridos</p>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className={route.checkpointsRequired ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}>
                                                                        {route.checkpointsRequired ? 'Sim' : 'Não'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 bg-gray-800/20 p-2 rounded">
                                                                <Radar className="w-4 h-4 text-seguranca-yellow" />
                                                                Sequência de Pontos de Parada ({route.points?.length || 0})
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                                                                {route.points?.sort((a, b) => a.order - b.order).map((point, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 p-2 bg-seguranca-black/40 rounded border border-gray-700/50 hover:border-gray-600 transition-colors">
                                                                        <span className="text-xs text-gray-600 font-mono w-4">{point.order + 1}</span>
                                                                        <span className="text-base leading-none shrink-0">{getPointTypeIcon(point.type)}</span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm text-gray-200 font-medium truncate">{point.name}</p>
                                                                            <p className="text-[10px] text-gray-500 truncate">
                                                                                Lat: {point.latitude.toFixed(4)}, Lon: {point.longitude.toFixed(4)}
                                                                            </p>
                                                                        </div>
                                                                        {point.radiusMeters && (
                                                                            <Badge variant="outline" className="text-[10px] h-5 bg-gray-800/40">
                                                                                {point.radiusMeters}m
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </CollapsibleContent>
                                        </Card>
                                    </Collapsible>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="form" className="p-0 m-0 flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <Card className="bg-seguranca-graphite border-gray-700">
                                <CardHeader className="border-b border-gray-700/50 pb-4 flex flex-row items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">Cadastrar Rota</h2>
                                        <p className="text-gray-400 text-sm">Adicione uma nova rota para um cliente.</p>
                                    </div>
                                    <Button
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-md px-6 font-semibold shadow-lg"
                                        onClick={() => setImportModalOpen(true)}
                                    >
                                        Importar Rota
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        {/* Row 1: Name & Code */}
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Nome da Rota</Label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Ex: Rota Centro - Unidade Sul"
                                                className="bg-seguranca-black border-gray-600 text-gray-200 h-11"
                                                disabled={modalMode === 'view'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Código da Rota</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={formData.code}
                                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                    placeholder="EX: ROTA-CENTRO-01"
                                                    className="bg-seguranca-black border-gray-600 text-gray-200 h-11 flex-1"
                                                    disabled={modalMode === 'view'}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-white text-[10px] h-11"
                                                    onClick={() => setFormData({ ...formData, code: `RUTA-${formData.name.split(' ')[0].toUpperCase() || 'NEW'}-${Math.floor(Math.random() * 100)}` })}
                                                >
                                                    Gerar de Nome
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Row 2: Client & Company */}
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Cliente</Label>
                                            <Select
                                                value={formData.clientId}
                                                onValueChange={(v) => {
                                                    setFormData({ ...formData, clientId: v });
                                                }}
                                                disabled={modalMode === 'view'}
                                            >
                                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200 h-11">
                                                    <SelectValue placeholder="Selecione um cliente" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                                    {units.map(u => (
                                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Empresa do Cliente</Label>
                                            <Input
                                                value={units.find(u => u.id === formData.clientId)?.name || ''}
                                                readOnly
                                                className="bg-seguranca-black/30 border-gray-700 text-gray-400 h-11"
                                                placeholder="-"
                                            />
                                        </div>

                                        {/* Row 3: Trajeto Restriction */}
                                        <div className="col-span-2 bg-seguranca-black/20 p-4 rounded-lg border border-gray-700/50">
                                            <div className="flex items-start space-x-3">
                                                <Checkbox
                                                    id="geofence-toggle"
                                                    checked={formData.geofenceEnabled}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, geofenceEnabled: checked as boolean })}
                                                    disabled={modalMode === 'view'}
                                                    className="mt-1"
                                                />
                                                <div className="space-y-1 leading-none">
                                                    <label htmlFor="geofence-toggle" className="text-sm font-bold text-gray-200 cursor-pointer">
                                                        Restrição de Trajeto (50m)
                                                    </label>
                                                    <p className="text-xs text-gray-500 max-w-2xl">
                                                        Geofence: permitirá que o funcionário ative até 50m de qualquer ponto do trajeto, mesmo fora do ponto de embarque.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 4: Origin CEP & Address */}
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">CEP de Origem</Label>
                                            <div className="relative">
                                                <Input
                                                    value={formData.originCep}
                                                    onChange={(e) => {
                                                        const formatted = formatarCep(e.target.value);
                                                        setFormData({ ...formData, originCep: formatted });
                                                        // Busca automática quando CEP completo (8 dígitos)
                                                        if (formatted.replace(/\D/g, '').length === 8) {
                                                            buscarCep(formatted, 'origin');
                                                        }
                                                    }}
                                                    onBlur={() => buscarCep(formData.originCep, 'origin')}
                                                    placeholder="00000-000"
                                                    maxLength={9}
                                                    className="bg-seguranca-black border-gray-600 text-gray-200 h-11 pr-10"
                                                    disabled={modalMode === 'view'}
                                                />
                                                {loadingCepOrigem && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Origem (endereço)</Label>
                                            <Input
                                                value={formData.originAddress}
                                                onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                                                placeholder="Será preenchido automaticamente pelo CEP"
                                                className="bg-seguranca-black border-gray-600 text-gray-200 h-11"
                                                disabled={modalMode === 'view'}
                                            />
                                        </div>

                                        {/* Row 5: Destination CEP & Address */}
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">CEP de Destino</Label>
                                            <div className="relative">
                                                <Input
                                                    value={formData.destinationCep}
                                                    onChange={(e) => {
                                                        const formatted = formatarCep(e.target.value);
                                                        setFormData({ ...formData, destinationCep: formatted });
                                                        // Busca automática quando CEP completo (8 dígitos)
                                                        if (formatted.replace(/\D/g, '').length === 8) {
                                                            buscarCep(formatted, 'destination');
                                                        }
                                                    }}
                                                    onBlur={() => buscarCep(formData.destinationCep, 'destination')}
                                                    placeholder="00000-000"
                                                    maxLength={9}
                                                    className="bg-seguranca-black border-gray-600 text-gray-200 h-11 pr-10"
                                                    disabled={modalMode === 'view'}
                                                />
                                                {loadingCepDestino && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Destino (endereço)</Label>
                                            <Input
                                                value={formData.destinationAddress}
                                                onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                                                placeholder="Será preenchido automaticamente pelo CEP"
                                                className="bg-seguranca-black border-gray-600 text-gray-200 h-11"
                                                disabled={modalMode === 'view'}
                                            />
                                        </div>

                                        {/* Row 6: Shift & Execution Time */}
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Turno</Label>
                                            <Select
                                                value={formData.shift}
                                                onValueChange={(v) => setFormData({ ...formData, shift: v })}
                                                disabled={modalMode === 'view'}
                                            >
                                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200 h-11">
                                                    <SelectValue placeholder="Selecione o turno" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                                    <SelectItem value="MANHA">Manhã</SelectItem>
                                                    <SelectItem value="TARDE">Tarde</SelectItem>
                                                    <SelectItem value="NOITE">Noite</SelectItem>
                                                    <SelectItem value="ADMIN">Administrativo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Horário de execução</Label>
                                            <Input
                                                value={formData.executionTime}
                                                onChange={(e) => setFormData({ ...formData, executionTime: e.target.value })}
                                                placeholder="-- : --"
                                                className="bg-seguranca-black border-gray-600 text-gray-200 h-11"
                                                disabled={modalMode === 'view'}
                                            />
                                        </div>

                                        {/* Row 7: Distance & Duration */}
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Distância (km)</Label>
                                            <Input
                                                type="number"
                                                value={formData.distanceKm}
                                                onChange={(e) => setFormData({ ...formData, distanceKm: parseFloat(e.target.value) || 0 })}
                                                className="bg-seguranca-black border-gray-600 text-gray-200 h-11"
                                                disabled={modalMode === 'view'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Duração (min)</Label>
                                            <Input
                                                type="number"
                                                value={formData.estimatedDuration}
                                                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 0 })}
                                                className="bg-seguranca-black border-gray-600 text-gray-200 h-11"
                                                disabled={modalMode === 'view'}
                                            />
                                        </div>
                                    </div>

                                    {/* Map Section */}
                                    <div className="pt-6 relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Traçar rota no mapa</Label>
                                            <Badge variant="outline" className="text-[10px] bg-seguranca-yellow/10 text-seguranca-yellow border-seguranca-yellow/30 uppercase tracking-tighter">
                                                OpenMaps (Leaflet)
                                            </Badge>
                                        </div>
                                        <div className="w-full h-[350px] rounded-lg border border-gray-700 overflow-hidden shadow-inner">
                                            <OpenMapInteractive
                                                points={routePoints.map((p, i) => ({
                                                    id: `point-${i}`,
                                                    latitude: p.latitude,
                                                    longitude: p.longitude,
                                                    label: p.name
                                                }))}
                                                routePolyline={routePolyline}
                                                onMapClick={handleMapClick}
                                                readOnly={modalMode === 'view'}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Footer Fixado */}
                        <div className="p-4 border-t border-gray-700 bg-seguranca-graphite flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
                            <Button
                                variant="outline"
                                onClick={handleTracarRota}
                                disabled={tracingRoute || modalMode === 'view'}
                                className="border-gray-600 text-gray-300 hover:bg-gray-800 gap-2 font-medium"
                            >
                                {tracingRoute ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RouteIcon className="w-4 h-4" />
                                )}
                                {tracingRoute ? 'Calculando rota...' : 'Traçar rota no mapa'}
                            </Button>

                            {modalMode !== 'view' && (
                                <Button
                                    onClick={handleSubmit}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-10 h-11"
                                >
                                    {modalMode === 'create' ? '+ Cadastrar Rota' : 'Salvar Alterações'}
                                </Button>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Add/Edit Point Modal - Keep this as Dialog as it's a sub-form */}
                <Dialog open={pointModalOpen} onOpenChange={setPointModalOpen}>
                    <DialogContent className="bg-seguranca-graphite border-gray-700 text-white shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-seguranca-yellow text-xl flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                {editingPointIndex !== null ? 'Editar Ponto de Parada' : 'Novo Ponto de Parada'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-gray-300">Apelido do Ponto *</Label>
                                <Input
                                    value={pointFormData.name}
                                    onChange={(e) => setPointFormData({ ...pointFormData, name: e.target.value })}
                                    placeholder="Ex: Ponto de Embarque - Praça da Sé"
                                    className="bg-seguranca-black border-gray-600 text-gray-200"
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="text-gray-300">Tipo de Interação *</Label>
                                <Select
                                    value={pointFormData.type}
                                    onValueChange={(v: any) => setPointFormData({ ...pointFormData, type: v })}
                                >
                                    <SelectTrigger className="bg-seguranca-black border-gray-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        <SelectItem value="START">🟢 Ponto Inicial</SelectItem>
                                        <SelectItem value="BOARDING">🔵 Embarque de Passageiros</SelectItem>
                                        <SelectItem value="DEBARKATION">🟠 Desembarque de Passageiros</SelectItem>
                                        <SelectItem value="END">🔴 Ponto Final / Garagem</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-300">Latitude *</Label>
                                <Input
                                    type="number"
                                    step="0.000001"
                                    value={pointFormData.latitude}
                                    onChange={(e) => setPointFormData({ ...pointFormData, latitude: parseFloat(e.target.value) || 0 })}
                                    className="bg-seguranca-black border-gray-600 text-gray-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-300">Longitude *</Label>
                                <Input
                                    type="number"
                                    step="0.000001"
                                    value={pointFormData.longitude}
                                    onChange={(e) => setPointFormData({ ...pointFormData, longitude: parseFloat(e.target.value) || 0 })}
                                    className="bg-seguranca-black border-gray-600 text-gray-200"
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="text-gray-300">Raio de Detecção (metros)</Label>
                                <Input
                                    type="number"
                                    value={pointFormData.radiusMeters}
                                    onChange={(e) => setPointFormData({ ...pointFormData, radiusMeters: parseInt(e.target.value) || undefined })}
                                    placeholder="Sugestão: 50m"
                                    className="bg-seguranca-black border-gray-600 text-gray-200"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setPointModalOpen(false)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSavePoint}
                                className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90 px-8"
                            >
                                Confirmar Ponto
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            {/* Modal de Importação KML/KMZ */}
            <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-lg p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-4 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <CloudUpload className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold">Importar Rota</DialogTitle>
                            <DialogDescription className="text-gray-400 mt-1">
                                Carregue arquivos KML ou KMZ do Google Earth
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="p-8 pt-2 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-gray-300 text-sm font-semibold">Organização</Label>
                            <Select
                                value={importRouteFormData.clientId}
                                onValueChange={(v) => setImportRouteFormData({ ...importRouteFormData, clientId: v })}
                            >
                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200 h-12">
                                    <SelectValue placeholder="Selecione uma organização..." />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                    {units.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300 text-sm font-semibold">Arquivo da Rota</Label>
                            <div
                                className="border-2 border-dashed border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center space-y-4 bg-seguranca-black/20 hover:bg-seguranca-black/40 transition-colors cursor-pointer group"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.kml,.kmz';
                                    input.onchange = (e: any) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setImportRouteFormData({ ...importRouteFormData, file });
                                            toast({
                                                title: 'Arquivo selecionado',
                                                description: file.name
                                            });
                                        }
                                    };
                                    input.click();
                                }}
                            >
                                <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                                    <CloudUpload className="w-7 h-7 text-gray-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-200">
                                        {importRouteFormData.file ? importRouteFormData.file.name : 'Clique para selecionar o arquivo'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Suporta formatos .kml e .kmz</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="bg-seguranca-black/30 p-6 flex flex-row gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 text-gray-300 hover:text-white"
                            onClick={() => {
                                setImportModalOpen(false);
                                setImportRouteFormData({ clientId: '', file: null });
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold h-12 rounded-lg"
                            disabled={!importRouteFormData.clientId || !importRouteFormData.file}
                            onClick={() => {
                                toast({
                                    title: 'Sucesso',
                                    description: 'Rota importada com sucesso (Mock)'
                                });
                                setImportModalOpen(false);
                                setImportRouteFormData({ clientId: '', file: null });
                            }}
                        >
                            <CloudUpload className="w-4 h-4 mr-2" />
                            Importar Rota
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </StandardLayout>
    );
};

export default RoutesAndPoints;
