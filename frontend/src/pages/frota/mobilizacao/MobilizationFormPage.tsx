'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Truck,
    ArrowLeft,
    Save,
    Loader2,
    Camera,
    AlertTriangle,
    ClipboardList,
    FileText
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { CameraCapture } from '@/components/frota/CameraCapture';
import DamageMap, { DamagePoint } from '@/components/mobilizacao/DamagePointsMap';
import transportMobilizationService from '@/services/transportMobilizationService';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import clientService from '@/services/clientService';
import workPostService from '@/services/workPostService';
import type { WorkPost } from '@/services/workPostService';
import { useToast } from '@/hooks/use-toast';
import type { MobilizationType, CreateTransportMobilizationDTO, ChecklistItemDetail } from '@/types/mobilization';

const PRE_USO_CHECKLIST: ChecklistItemDetail[] = [
    { id: 'documentos', label: 'Documentos (CNH, DUT, Seguro p/evento, ATF)', category: 'Documentação', positivo: null, negativo: null, observacao: '' },
    { id: 'selo', label: 'Selo - Validade da vistoria do veículo', category: 'Documentação', positivo: null, negativo: null, observacao: '' },
    { id: 'cintos', label: 'Cintos de segurança (motorista e passageiros)', category: 'Segurança', positivo: null, negativo: null, observacao: '' },
    { id: 'extintor', label: 'Extintor de incêndio', category: 'Segurança', positivo: null, negativo: null, observacao: '' },
    { id: 'freio', label: 'Sistema de freio', category: 'Segurança', positivo: null, negativo: null, observacao: '' },
    { id: 'cones', label: 'Cones de sinalização', category: 'Segurança', positivo: null, negativo: null, observacao: '' },
    { id: 'giroflex', label: 'Giroflex', category: 'Segurança', positivo: null, negativo: null, observacao: '' },
    { id: 'alarme_re', label: 'Alarme de ré (luzes e sensor)', category: 'Segurança', positivo: null, negativo: null, observacao: '' },
    { id: 'para_brisa', label: 'Para-brisa (direito e esquerdo)', category: 'Visibilidade', positivo: null, negativo: null, observacao: '' },
    { id: 'limpador', label: 'Limpador e lavador do para-brisa', category: 'Visibilidade', positivo: null, negativo: null, observacao: '' },
    { id: 'pneus', label: 'Pneus (do veículo e estepe)', category: 'Pneus', positivo: null, negativo: null, observacao: '' },
    { id: 'macaco', label: 'Macaco, chave de roda e triângulo', category: 'Pneus', positivo: null, negativo: null, observacao: '' },
    { id: 'motor', label: 'Motor (ruído, lubrificação, etc.)', category: 'Mecânica', positivo: null, negativo: null, observacao: '' },
    { id: 'vazamentos', label: 'Vazamentos (hidráulicos, óleo, caixa de marcha, etc.)', category: 'Mecânica', positivo: null, negativo: null, observacao: '' },
    { id: 'luzes', label: 'Sistema de luzes (painel, setas, lanternas, faróis)', category: 'Elétrica', positivo: null, negativo: null, observacao: '' },
    { id: 'chip', label: 'Chip de abastecimento', category: 'Elétrica', positivo: null, negativo: null, observacao: '' },
    { id: 'tacografo', label: 'Tacógrafo (aparelho, leitura e disco)', category: 'Equipamentos', positivo: null, negativo: null, observacao: '' },
    { id: 'prancheta', label: 'Prancheta', category: 'Equipamentos', positivo: null, negativo: null, observacao: '' },
    { id: 'poltronas', label: 'Poltronas', category: 'Estrutura', positivo: null, negativo: null, observacao: '' },
    { id: 'portas_janelas', label: 'Porta/Janelas (saída de emergência, cortinas)', category: 'Estrutura', positivo: null, negativo: null, observacao: '' },
    { id: 'limpeza', label: 'Limpeza (externa e interna)', category: 'Limpeza', positivo: null, negativo: null, observacao: '' },
    { id: 'condicoes_gerais', label: 'Condições gerais do veículo', category: 'Geral', positivo: null, negativo: null, observacao: '' },
];

const POSITIVO_OPTIONS = [
    { value: 1, label: 'P1' },
    { value: 2, label: 'P2' },
    { value: 3, label: 'P3' },
    { value: 4, label: 'P4' },
];

const NEGATIVO_OPTIONS = [
    { value: 1, label: 'N1' },
    { value: 2, label: 'N2' },
    { value: 3, label: 'N3' },
    { value: 4, label: 'N4' },
];

const MobilizationFormPage: React.FC = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!id;

    const [type, setType] = useState<MobilizationType>(
        (searchParams.get('type') as MobilizationType) || 'PRE_USO'
    );

    const [formData, setFormData] = useState({
        vehicleId: '',
        driverId: '',
        clientId: '',
        workPostId: '',
        kmReading: '',
        observations: '',
        descricaoAvaria: '',
    });

    const [checklist, setChecklist] = useState<ChecklistItemDetail[]>(() =>
        PRE_USO_CHECKLIST.map(item => ({ ...item }))
    );

    const [damagePoints, setDamagePoints] = useState<DamagePoint[]>([]);
    const [odometerPhoto, setOdometerPhoto] = useState<File | null>(null);
    const [generalPhotos, setGeneralPhotos] = useState<File[]>([]);

    const { data: existingMobilization, isLoading: isLoadingExisting } = useQuery({
        queryKey: ['transport-mobilization', id],
        queryFn: () => transportMobilizationService.findById(id!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (existingMobilization) {
            setType(existingMobilization.type);
            setFormData({
                vehicleId: existingMobilization.vehicleId,
                driverId: existingMobilization.driverId || '',
                clientId: existingMobilization.clientId || '',
                workPostId: existingMobilization.workPostId || '',
                kmReading: existingMobilization.kmReading?.toString() || '',
                observations: existingMobilization.observations || '',
                descricaoAvaria: '',
            });

            const data = existingMobilization.checklistData || existingMobilization.jsonData;
            if (data) {
                try {
                    const items = JSON.parse(data);
                    if (Array.isArray(items) && items.length > 0 && 'positivo' in items[0]) {
                        setChecklist(items);
                    }
                } catch (e) {
                    console.error("Erro ao fazer parse do checklist", e);
                }
            }

            try {
                const damages = JSON.parse(existingMobilization.damageData || '[]');
                setDamagePoints(damages);
            } catch (e) {
                console.error("Erro ao fazer parse do mapa de avarias", e);
            }
        }
    }, [existingMobilization]);

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles,
    });

    const { data: drivers = [] } = useQuery({
        queryKey: ['drivers'],
        queryFn: driverService.getDrivers,
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients-for-select'],
        queryFn: clientService.getAllClients,
    });

    const { data: allWorkPosts = [] } = useQuery<WorkPost[]>({
        queryKey: ['work-posts-all'],
        queryFn: workPostService.getAllWorkPosts,
    });

    // Filtra postos pelo cliente selecionado
    const filteredWorkPosts = formData.clientId
        ? allWorkPosts.filter(wp => wp.clientId === formData.clientId)
        : allWorkPosts;

    const mutation = useMutation({
        mutationFn: async (payload: { data: CreateTransportMobilizationDTO; odometer?: File; photos: File[] }) => {
            let result;
            if (isEditing) {
                result = await transportMobilizationService.update(id!, payload.data);
            } else {
                result = await transportMobilizationService.create(payload.data);
            }
            if (payload.odometer) {
                await transportMobilizationService.uploadOdometerPhoto(result.id, payload.odometer);
            }
            if (payload.photos.length > 0) {
                await transportMobilizationService.uploadPhotos(result.id, payload.photos);
            }
            return result;
        },
        onSuccess: () => {
            toast({ title: 'Sucesso', description: `Checklist ${isEditing ? 'atualizado' : 'registrado'} com sucesso.` });
            queryClient.invalidateQueries({ queryKey: ['transport-mobilizations'] });
            navigate('/frota/mobilizacao');
        },
        onError: (err: any) => {
            toast({ title: 'Erro', description: err.message || 'Falha ao salvar checklist.', variant: 'destructive' });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vehicleId || !formData.kmReading) {
            toast({ title: 'Campos obrigatórios', description: 'Preencha veículo e KM.', variant: 'destructive' });
            return;
        }

        const payload: CreateTransportMobilizationDTO = {
            vehicleId: formData.vehicleId,
            driverId: formData.driverId || undefined,
            clientId: formData.clientId || undefined,
            workPostId: formData.workPostId || undefined,
            type,
            kmReading: parseInt(formData.kmReading),
            checklistData: JSON.stringify(checklist),
            damageData: JSON.stringify(damagePoints),
            observations: formData.observations,
            descricaoAvaria: formData.descricaoAvaria,
        };

        mutation.mutate({ data: payload, odometer: odometerPhoto || undefined, photos: generalPhotos });
    };

    const updateChecklistItem = (id: string, field: keyof ChecklistItemDetail, value: any) => {
        setChecklist(prev =>
            prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    if (isEditing && isLoadingExisting) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-seguranca-yellow" />
            </div>
        );
    }

    return (
        <StandardLayout title={isEditing ? 'Editar Checklist' : 'Novo Checklist de Pré-Uso'}>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate('/frota/mobilizacao')} className="text-gray-400">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <h1 className="text-2xl font-bold text-seguranca-lightgray">
                        Relatório de Pré-Uso (Checklist)
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                    {/* Identificação do Veículo */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Truck className="h-5 w-5 text-seguranca-yellow" /> Identificação do Veículo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Veículo *</Label>
                                    <Select
                                        value={formData.vehicleId}
                                        onValueChange={(v) => setFormData(f => ({ ...f, vehicleId: v }))}
                                    >
                                        <SelectTrigger className="bg-seguranca-black border-gray-600">
                                            <SelectValue placeholder="Selecione o veículo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicles.map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Motorista</Label>
                                    <Select
                                        value={formData.driverId}
                                        onValueChange={(v) => setFormData(f => ({ ...f, driverId: v }))}
                                    >
                                        <SelectTrigger className="bg-seguranca-black border-gray-600">
                                            <SelectValue placeholder="Selecione o motorista" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {drivers.map(d => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cliente</Label>
                                    <Select
                                        value={formData.clientId}
                                        onValueChange={(v) => setFormData(f => ({ ...f, clientId: v, workPostId: '' }))}
                                    >
                                        <SelectTrigger className="bg-seguranca-black border-gray-600">
                                            <SelectValue placeholder="Selecione o cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Obra / Posto de Trabalho</Label>
                                    <Select
                                        value={formData.workPostId}
                                        onValueChange={(v) => setFormData(f => ({ ...f, workPostId: v }))}
                                    >
                                        <SelectTrigger className="bg-seguranca-black border-gray-600">
                                            <SelectValue placeholder="Selecione a obra" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredWorkPosts.map((wp) => (
                                                <SelectItem key={wp.id} value={wp.id}>{wp.postCode} - {wp.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Odômetro (KM) *</Label>
                                    <Input
                                        type="number"
                                        value={formData.kmReading}
                                        onChange={(e) => setFormData(f => ({ ...f, kmReading: e.target.value }))}
                                        className="bg-seguranca-black border-gray-600 font-mono"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Checklist de Pré-Uso */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-seguranca-yellow" />
                                Inspeção de Pré-Uso (Checklist)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {Object.entries(
                                    checklist.reduce((acc, item) => {
                                        if (!acc[item.category]) acc[item.category] = [];
                                        acc[item.category].push(item);
                                        return acc;
                                    }, {} as Record<string, ChecklistItemDetail[]>)
                                ).map(([category, items]) => (
                                    <div key={category}>
                                        <h3 className="text-sm font-bold text-seguranca-yellow uppercase tracking-widest border-l-2 border-seguranca-yellow pl-2 mb-3">
                                            {category}
                                        </h3>
                                        <div className="space-y-3">
                                            {items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="bg-seguranca-black/30 border border-gray-700 rounded-lg p-3 space-y-2"
                                                >
                                                    <p className="text-sm font-medium text-seguranca-lightgray">
                                                        {item.label}
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div>
                                                            <span className="text-xs text-gray-500 mr-2">Positivo:</span>
                                                            <RadioGroup
                                                                value={item.positivo?.toString() || ''}
                                                                onValueChange={(v) => updateChecklistItem(item.id, 'positivo', parseInt(v))}
                                                                className="flex gap-1"
                                                            >
                                                                {POSITIVO_OPTIONS.map(opt => (
                                                                    <div key={opt.value} className="flex items-center gap-1">
                                                                        <RadioGroupItem
                                                                            value={opt.value.toString()}
                                                                            id={`${item.id}-p${opt.value}`}
                                                                            className="h-4 w-4 border-gray-500 text-seguranca-yellow"
                                                                        />
                                                                        <Label htmlFor={`${item.id}-p${opt.value}`} className="text-xs text-gray-400">{opt.label}</Label>
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-gray-500 mr-2">Negativo:</span>
                                                            <RadioGroup
                                                                value={item.negativo?.toString() || ''}
                                                                onValueChange={(v) => updateChecklistItem(item.id, 'negativo', parseInt(v))}
                                                                className="flex gap-1"
                                                            >
                                                                {NEGATIVO_OPTIONS.map(opt => (
                                                                    <div key={opt.value} className="flex items-center gap-1">
                                                                        <RadioGroupItem
                                                                            value={opt.value.toString()}
                                                                            id={`${item.id}-n${opt.value}`}
                                                                            className="h-4 w-4 border-gray-500 text-red-400"
                                                                        />
                                                                        <Label htmlFor={`${item.id}-n${opt.value}`} className="text-xs text-gray-400">{opt.label}</Label>
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                        </div>
                                                        <div>
                                                            <Input
                                                                placeholder="Observação"
                                                                value={item.observacao}
                                                                onChange={(e) => updateChecklistItem(item.id, 'observacao', e.target.value)}
                                                                className="bg-seguranca-black border-gray-600 h-8 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Descrição da Avaria */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-seguranca-yellow" /> Descrição da Avaria
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.descricaoAvaria}
                                onChange={(e) => setFormData(f => ({ ...f, descricaoAvaria: e.target.value }))}
                                placeholder="Descreva detalhadamente qualquer avaria encontrada..."
                                className="bg-seguranca-black border-gray-600 min-h-[80px]"
                            />
                        </CardContent>
                    </Card>

                    {/* Mapa de Avarias */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-seguranca-yellow" /> Mapa de Avarias
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DamageMap points={damagePoints} onChange={setDamagePoints} />
                        </CardContent>
                    </Card>

                    {/* Fotos e Observações */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Camera className="h-5 w-5 text-seguranca-yellow" /> Fotos e Observações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Foto do Odômetro</Label>
                                <CameraCapture
                                    onPhotosChange={(photos) => setOdometerPhoto(photos[0] || null)}
                                    maxPhotos={1}
                                    label="Capturar KM"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fotos Gerais do Veículo</Label>
                                <CameraCapture
                                    onPhotosChange={(photos) => setGeneralPhotos(photos)}
                                    label="Anexar Fotos (Até 10)"
                                    maxPhotos={10}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Observações Adicionais</Label>
                                <Textarea
                                    value={formData.observations}
                                    onChange={(e) => setFormData(f => ({ ...f, observations: e.target.value }))}
                                    placeholder="Relate aqui qualquer observação relevante..."
                                    className="bg-seguranca-black border-gray-600 min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-seguranca-black/80 backdrop-blur-md border-t border-gray-800 flex justify-center gap-4 md:relative md:bg-transparent md:border-0 md:p-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/frota/mobilizacao')}
                            className="w-full md:w-auto border-gray-600"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full md:w-auto bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isEditing ? 'Atualizar Checklist' : 'Salvar Checklist'}
                        </Button>
                    </div>
                </form>
            </div>
        </StandardLayout>
    );
};

export default MobilizationFormPage;
