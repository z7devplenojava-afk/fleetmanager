'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Wrench,
    Camera,
    UploadCloud,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Plus,
    FileText,
    ArrowLeft,
    Search,
    Car,
    ShieldAlert,
    Gauge,
    Loader2
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import fleetWorkOrderService, {
    FleetWorkOrder,
    MaintenanceType,
    WorkOrderStatus,
    WorkOrderPriority,
    LaborType
} from '@/services/fleetWorkOrderService';

export const DriverWorkOrdersPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isCreating, setIsCreating] = useState(false);
    const [searchVehicle, setSearchVehicle] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [currentKm, setCurrentKm] = useState<number | ''>('');
    const [priority, setPriority] = useState<WorkOrderPriority>(WorkOrderPriority.MEDIUM);
    const [anomaliesDescription, setAnomaliesDescription] = useState('');
    const [otherDetails, setOtherDetails] = useState('');
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Carregar veículos da frota
    const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
        queryKey: ['driver-vehicles-list'],
        queryFn: () => fleetService.getVehicles(),
        staleTime: 60_000,
    });

    // Carregar todas as OS para filtrar as do motorista ou do veículo
    const { data: workOrders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['driver-work-orders-list'],
        queryFn: () => fleetWorkOrderService.getAll(),
        staleTime: 30_000,
    });

    // Filtrar veículos pela busca
    const filteredVehicles = useMemo(() => {
        if (!searchVehicle.trim()) return vehicles.slice(0, 50);
        const term = searchVehicle.toLowerCase().replace(/[^a-z0-9]/g, '');
        return vehicles.filter(v => {
            const plate = (v.plate || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const model = (v.model || '').toLowerCase();
            const fleetNum = (v.fleetNumber || v.patrimonyNumber || '').toLowerCase();
            return plate.includes(term) || model.includes(term) || fleetNum.includes(term);
        });
    }, [vehicles, searchVehicle]);

    // Identificar veículo selecionado
    const selectedVehicle = useMemo(() => {
        return vehicles.find(v => v.id === selectedVehicleId);
    }, [vehicles, selectedVehicleId]);

    // Filtrar ordens recentes do motorista
    const myWorkOrders = useMemo(() => {
        const userName = (user?.name || '').toLowerCase().trim();
        return workOrders.filter(o => {
            const notes = (o.notes || '').toLowerCase();
            const anom = (o.anomaliesDescription || '').toLowerCase();
            const mech = (o.mechanicName || '').toLowerCase();
            return notes.includes(userName) || anom.includes(userName) || mech.includes(userName) || (o.requesterId && o.requesterId === user?.id);
        }).slice(0, 20);
    }, [workOrders, user?.name, user?.id]);

    // Compressão de imagem para fallback
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max = 1200;
                    if (width > height && width > max) {
                        height = Math.round((height * max) / width);
                        width = max;
                    } else if (height > max) {
                        width = Math.round((width * max) / height);
                        height = max;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.65));
                    } else {
                        resolve(event.target?.result as string);
                    }
                };
                img.onerror = () => resolve('');
                img.src = event.target?.result as string;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    };

    // Handler de Fotos (Câmera ou Arquivo)
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const fileList = Array.from(files);
            // 1. Tentar upload seguro via multipart no servidor
            try {
                const uploadedUrls = await fleetWorkOrderService.uploadPhotos(fileList);
                if (uploadedUrls && uploadedUrls.length > 0) {
                    setPhotoUrls(prev => [...prev, ...uploadedUrls]);
                    toast({
                        title: 'Foto Anexada',
                        description: `${uploadedUrls.length} imagem(ns) salva(s) com sucesso.`
                    });
                    return;
                }
            } catch (err) {
                console.warn('Falha no upload multipart, usando fallback de compressão:', err);
            }

            // 2. Fallback: compressão local leve (65% qualidade)
            const compressedList: string[] = [];
            for (const file of fileList) {
                const dataUrl = await compressImage(file);
                if (dataUrl) compressedList.push(dataUrl);
            }
            if (compressedList.length > 0) {
                setPhotoUrls(prev => [...prev, ...compressedList]);
            }
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const removePhoto = (index: number) => {
        setPhotoUrls(prev => prev.filter((_, i) => i !== index));
    };

    // Mutação para criar a Ordem de Serviço
    const createMutation = useMutation({
        mutationFn: async () => {
            if (!selectedVehicleId) {
                throw new Error('Por favor, selecione o veículo.');
            }
            if (!anomaliesDescription.trim()) {
                throw new Error('Descreva o defeito ou anomalia identificado.');
            }

            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const payload: Partial<FleetWorkOrder> = {
                vehicleId: selectedVehicleId,
                maintenanceType: MaintenanceType.CORRETIVA,
                status: WorkOrderStatus.OPEN,
                priority,
                laborType: LaborType.INTERNAL,
                stopDate: dateStr,
                stopTime: timeStr,
                odometerIn: currentKm !== '' ? Number(currentKm) : (selectedVehicle?.currentMileage || undefined),
                stopReason: 'Abertura de Chamado pelo Condutor/Motorista',
                anomaliesDescription: anomaliesDescription.trim(),
                otherDescription: otherDetails.trim() || undefined,
                notes: `OS aberta pelo Motorista: ${user?.name || 'Condutor'} via Portal Mobile`,
                photoAttachments: photoUrls,
                clientId: selectedVehicle?.clientId,
                sectorId: selectedVehicle?.workPostId,
                garageId: selectedVehicle?.garageId,
                garageName: selectedVehicle?.garageName,
            };

            return await fleetWorkOrderService.create(payload);
        },
        onSuccess: (saved) => {
            toast({
                title: 'Ordem de Serviço Criada!',
                description: `OS #${saved.osNumber || saved.id.slice(0, 8)} aberta e enviada para a equipe de manutenção.`,
            });
            queryClient.invalidateQueries({ queryKey: ['driver-work-orders-list'] });
            // Limpa formulário
            setSelectedVehicleId('');
            setCurrentKm('');
            setAnomaliesDescription('');
            setOtherDetails('');
            setPhotoUrls([]);
            setIsCreating(false);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.message || 'Falha ao salvar a Ordem de Serviço.';
            toast({
                title: 'Erro ao Salvar OS',
                description: msg,
                variant: 'destructive',
            });
        }
    });

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case WorkOrderStatus.OPEN:
                return <Badge className="bg-blue-600 text-white">Aberta</Badge>;
            case WorkOrderStatus.IN_PROGRESS:
                return <Badge className="bg-amber-600 text-white">Em Manutenção</Badge>;
            case WorkOrderStatus.WAITING_PARTS:
                return <Badge className="bg-orange-600 text-white">Aguardando Peças</Badge>;
            case WorkOrderStatus.COMPLETED:
                return <Badge className="bg-emerald-600 text-white">Concluída</Badge>;
            case WorkOrderStatus.CANCELLED:
                return <Badge className="bg-zinc-700 text-zinc-300">Cancelada</Badge>;
            default:
                return <Badge variant="outline">{status || 'Pendente'}</Badge>;
        }
    };

    return (
        <StandardLayout title="Manutenção & Ordens de Serviço" subtitle="Área do Condutor / Motorista">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
                {/* Cabeçalho de Navegação Mobile */}
                <div className="flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/driver-dashboard')}
                        className="text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar ao Painel
                    </Button>
                    {!isCreating && (
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Abrir Nova OS
                        </Button>
                    )}
                </div>

                {/* ── FORMULÁRIO MOBILE DE CRIAÇÃO DE OS ─────────────────────── */}
                {isCreating ? (
                    <Card className="bg-[#121214] border-gray-800 shadow-2xl">
                        <CardHeader className="border-b border-gray-800 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400">
                                        <Wrench className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-white font-bold">
                                            Abrir Ordem de Serviço
                                        </CardTitle>
                                        <CardDescription className="text-xs text-zinc-400">
                                            Relate anomalias, defeitos ou avarias do veículo
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreating(false)}
                                    className="border-gray-700 text-zinc-300 text-xs"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5 pt-5">
                            {/* 1. Seleção de Veículo */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                    <Car className="h-4 w-4 text-red-400" /> Veículo / Equipamento *
                                </Label>

                                {/* Campo de busca rápida */}
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-2.5 text-zinc-500" />
                                    <Input
                                        placeholder="Buscar por placa, modelo ou código da frota..."
                                        value={searchVehicle}
                                        onChange={(e) => setSearchVehicle(e.target.value)}
                                        className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-9 text-zinc-200"
                                    />
                                </div>

                                <Select value={selectedVehicleId} onValueChange={(val) => {
                                    setSelectedVehicleId(val);
                                    const v = vehicles.find(item => item.id === val);
                                    if (v?.currentMileage) {
                                        setCurrentKm(v.currentMileage);
                                    }
                                }}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-200 font-medium">
                                        <SelectValue placeholder="Selecione o veículo na lista..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-h-60">
                                        {filteredVehicles.map((v) => (
                                            <SelectItem key={v.id} value={v.id} className="focus:bg-zinc-800 cursor-pointer">
                                                <span className="font-bold text-white mr-2">{v.plate}</span>
                                                <span className="text-zinc-400 text-xs">{v.brand} {v.model}</span>
                                                {v.fleetNumber && (
                                                    <span className="ml-2 text-[10px] bg-red-950/80 text-red-300 px-1.5 py-0.5 rounded border border-red-800/40">
                                                        #{v.fleetNumber}
                                                    </span>
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedVehicle && (
                                    <div className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800 text-xs text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                                        <span>Placa: <strong className="text-zinc-200">{selectedVehicle.plate}</strong></span>
                                        {selectedVehicle.garageName && (
                                            <span>Garagem/Pátio: <strong className="text-zinc-200">{selectedVehicle.garageName}</strong></span>
                                        )}
                                        {selectedVehicle.currentMileage !== undefined && (
                                            <span>KM Atual: <strong className="text-zinc-200">{selectedVehicle.currentMileage} km</strong></span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 2. Odômetro e Prioridade */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                        <Gauge className="h-4 w-4 text-yellow-400" /> Odômetro / KM Atual
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="Ex: 125430"
                                        value={currentKm}
                                        onChange={(e) => setCurrentKm(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="bg-zinc-950 border-zinc-800 text-zinc-200"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                        <ShieldAlert className="h-4 w-4 text-orange-400" /> Nível de Urgência
                                    </Label>
                                    <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                            <SelectItem value={WorkOrderPriority.LOW}>🟢 Baixa (Pode aguardar revisão)</SelectItem>
                                            <SelectItem value={WorkOrderPriority.MEDIUM}>🟡 Média (Programar reparo)</SelectItem>
                                            <SelectItem value={WorkOrderPriority.HIGH}>🟠 Alta (Necessita reparo rápido)</SelectItem>
                                            <SelectItem value={WorkOrderPriority.URGENT}>🔴 Urgente (Veículo retido / Perigo)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* 3. Descrição do Defeito / Anomalia */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4 text-amber-400" /> Descrição do Problema / Anomalia *
                                </Label>
                                <Textarea
                                    rows={4}
                                    placeholder="Descreva o que está acontecendo: barulhos estranhos, freio falhando, superaquecimento, luz no painel, vazamento de ar/óleo, pneu danificado, etc."
                                    value={anomaliesDescription}
                                    onChange={(e) => setAnomaliesDescription(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-200 text-xs sm:text-sm"
                                />
                            </div>

                            {/* 4. Fotos / Evidências com Câmera */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                        <Camera className="h-4 w-4 text-cyan-400" /> Fotos da Avaria / Painel (Câmera do Celular)
                                    </Label>
                                    <span className="text-[11px] text-zinc-500 font-mono">
                                        {photoUrls.length} foto(s)
                                    </span>
                                </div>

                                <div className="p-3 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl bg-zinc-950/40 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Botão Câmera Direta do Telefone */}
                                        <label className={`cursor-pointer inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg transition-all shadow-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <Camera className="h-4 w-4" />
                                            <span>Tirar Foto Agora (Câmera)</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* Botão Selecionar da Galeria */}
                                        <label className={`cursor-pointer inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs px-3.5 py-2.5 rounded-lg border border-zinc-700 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <UploadCloud className="h-4 w-4 text-cyan-400" />
                                            <span>{isUploading ? 'Enviando...' : 'Galeria de Fotos'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {/* Grid de Previews de Fotos */}
                                    {photoUrls.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                                            {photoUrls.map((url, idx) => (
                                                <div key={idx} className="relative group rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 aspect-video">
                                                    <img
                                                        src={url}
                                                        alt={`Foto ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(idx)}
                                                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition-colors shadow-sm"
                                                        title="Remover foto"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] px-1 py-0.5 rounded text-zinc-300">
                                                        Foto #{idx + 1}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 5. Observações Extras */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-400">
                                    Observações Adicionais (Opcional)
                                </Label>
                                <Input
                                    placeholder="Ex: Veículo parado no pátio B; necessita de guincho..."
                                    value={otherDetails}
                                    onChange={(e) => setOtherDetails(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-200 text-xs"
                                />
                            </div>

                            {/* Botões de Ação */}
                            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreating(false)}
                                    disabled={createMutation.isPending}
                                    className="border-zinc-700 text-zinc-300 text-xs"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => createMutation.mutate()}
                                    disabled={createMutation.isPending || isUploading}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 shadow-lg flex items-center gap-2"
                                >
                                    {createMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Abrindo OS...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Confirmar e Enviar OS</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* ── LISTAGEM DE ORDENS DO MOTORISTA ────────────────────── */
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-zinc-200 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-red-500" />
                                Minhas Solicitações de Manutenção Recentes
                            </h2>
                            <span className="text-xs text-zinc-500">
                                {myWorkOrders.length} chamada(s)
                            </span>
                        </div>

                        {isLoadingOrders ? (
                            <div className="flex flex-col items-center justify-center p-12 text-zinc-400 gap-3">
                                <Loader2 className="h-7 w-7 animate-spin text-red-500" />
                                <p className="text-xs">Carregando ordens de serviço...</p>
                            </div>
                        ) : myWorkOrders.length === 0 ? (
                            <Card className="bg-[#121214] border-gray-800 text-center p-8">
                                <div className="p-3 bg-zinc-900 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-zinc-500 mb-3">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h3 className="text-sm font-bold text-zinc-300">Nenhuma Ordem de Serviço aberta</h3>
                                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                                    Quando você identificar algum defeito mecânico, elétrico ou avaria, abra um chamado diretamente por aqui.
                                </p>
                                <Button
                                    onClick={() => setIsCreating(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Abrir Minha Primeira OS
                                </Button>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {myWorkOrders.map((order) => (
                                    <Card key={order.id} className="bg-[#121214] border-gray-800 hover:border-gray-700 transition-colors">
                                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                                                        #{order.osNumber || order.id.slice(0, 8)}
                                                    </span>
                                                    {getStatusBadge(order.status)}
                                                    {order.vehiclePlate && (
                                                        <span className="text-xs font-bold text-yellow-400 bg-yellow-950/40 border border-yellow-800/40 px-2 py-0.5 rounded">
                                                            {order.vehiclePlate}
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-zinc-500">
                                                        {order.stopDate ? new Date(order.stopDate).toLocaleDateString('pt-BR') : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-300 line-clamp-2">
                                                    {order.anomaliesDescription || order.stopReason || 'Manutenção Solicitada'}
                                                </p>
                                                {order.photoAttachments && order.photoAttachments.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-400">
                                                        <Camera className="h-3 w-3" />
                                                        <span>{order.photoAttachments.length} evidência(s) com foto</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StandardLayout>
    );
};

export default DriverWorkOrdersPage;
