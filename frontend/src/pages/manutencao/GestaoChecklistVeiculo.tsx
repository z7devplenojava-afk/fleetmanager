'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ClipboardCheck,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Save,
    Loader2,
    Copy,
    CopyPlus,
    Car,
    LayoutTemplate,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import fleetService from '@/services/fleetService';
import checklistConfigService, { ChecklistConfigCopyResult, ChecklistConfigItem } from '@/services/checklistConfigService';
import { CATEGORY_LABELS, defaultsToConfig } from '@/utils/checklistConfig';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS);
const DEFAULT_CONFIG_ITEMS = defaultsToConfig();

const GestaoChecklistVeiculo: React.FC = () => {
    const { toast } = useToast();
    // 'default' = template padrão global; caso contrário, id do veículo
    const [target, setTarget] = useState<'default' | string>('default');
    const [items, setItems] = useState<ChecklistConfigItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
    const [selectedCopyIds, setSelectedCopyIds] = useState<string[]>([]);
    const [isCopying, setIsCopying] = useState(false);
    const [copyResult, setCopyResult] = useState<ChecklistConfigCopyResult | null>(null);

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles,
    });

    const loadItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const vehicleId = target === 'default' ? undefined : target;
            const data = await checklistConfigService.getForVehicle(vehicleId);
            setItems(data.length > 0 ? data : []);
        } catch (err: any) {
            console.error('Erro ao carregar itens do checklist:', err);
            toast({
                title: 'Erro ao carregar itens',
                description: err?.message || 'Não foi possível carregar a configuração do checklist.',
                variant: 'destructive',
            });
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [target, toast]);

    useEffect(() => {
        void loadItems();
    }, [loadItems]);

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            { title: '', category: 'outros', required: false, isActive: true },
        ]);
    };

    const handleUpdateItem = (index: number, patch: Partial<ChecklistConfigItem>) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        setItems((prev) => {
            const next = [...prev];
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= next.length) return prev;
            [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
            return next;
        });
    };

    const handleLoadDefaults = () => {
        setItems(DEFAULT_CONFIG_ITEMS.map((i) => ({ ...i })));
        toast({
            title: 'Itens padrão carregados',
            description: 'Revise e salve para aplicar as alterações.',
        });
    };

    const handleSave = async () => {
        const validItems = items.filter((i) => i.title && i.title.trim() !== '');
        if (validItems.length === 0) {
            toast({
                title: 'Lista vazia',
                description: 'Adicione pelo menos um item com título antes de salvar.',
                variant: 'destructive',
            });
            return;
        }
        setIsSaving(true);
        try {
            const vehicleId = target === 'default' ? undefined : target;
            await checklistConfigService.replace(vehicleId, validItems);
            toast({
                title: 'Configuração salva!',
                description:
                    target === 'default'
                        ? 'Template padrão global atualizado.'
                        : `Checklist do veículo atualizado (${validItems.length} itens).`,
            });
            await loadItems();
        } catch (err: any) {
            console.error('Erro ao salvar itens do checklist:', err);
            toast({
                title: 'Erro ao salvar',
                description: err?.message || 'Não foi possível salvar a configuração.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isCustomized =
        target !== 'default' &&
        items.length > 0 &&
        !items.every((item) =>
            DEFAULT_CONFIG_ITEMS.some(
                (d) => d.title === item.title && d.category === item.category && d.required === item.required
            )
        );

    // Veículos disponíveis para receber a cópia (exclui o veículo-fonte atual)
    const copyableVehicles = useMemo(() => {
        return vehicles.filter((v) => v.id !== target);
    }, [vehicles, target]);

    // Rótulo amigável do veículo (placa - marca modelo) a partir do id
    const vehicleLabel = useCallback(
        (id: string) => {
            const v = vehicles.find((x) => x.id === id);
            return v ? `${v.plate} - ${v.brand} ${v.model}` : id;
        },
        [vehicles]
    );

    const handleOpenCopyDialog = () => {
        const validItems = items.filter((i) => i.title && i.title.trim() !== '');
        if (validItems.length === 0) {
            toast({
                title: 'Nada para copiar',
                description: 'A configuração atual está vazia. Adicione itens ou carregue o padrão antes de copiar.',
                variant: 'destructive',
            });
            return;
        }
        setSelectedCopyIds([]);
        setCopyResult(null);
        setIsCopyDialogOpen(true);
    };

    const handleCloseCopyDialog = () => {
        setIsCopyDialogOpen(false);
        setCopyResult(null);
        setSelectedCopyIds([]);
    };

    const handleToggleCopyVehicle = (vehicleId: string) => {
        setSelectedCopyIds((prev) =>
            prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]
        );
    };

    const handleSelectAll = () => {
        setSelectedCopyIds(copyableVehicles.map((v) => v.id));
    };

    const handleCopyConfig = async () => {
        const validItems = items.filter((i) => i.title && i.title.trim() !== '');
        if (selectedCopyIds.length === 0) {
            toast({
                title: 'Selecione os veículos',
                description: 'Marque ao menos um veículo de destino para copiar a configuração.',
                variant: 'destructive',
            });
            return;
        }
        setIsCopying(true);
        try {
            const result = await checklistConfigService.copyToVehicles(selectedCopyIds, validItems);
            // Mantém o diálogo aberto exibindo o resumo retornado pelo backend
            setCopyResult(result);
            setSelectedCopyIds([]);
        } catch (err: any) {
            console.error('Erro ao copiar configuração do checklist:', err);
            toast({
                title: 'Erro ao copiar',
                description: err?.message || 'Não foi possível copiar a configuração para os veículos.',
                variant: 'destructive',
            });
        } finally {
            setIsCopying(false);
        }
    };

    return (
        <StandardLayout title="Checklist por Veículo">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <ClipboardCheck className="h-8 w-8 text-primary" />
                            Checklist por Veículo
                        </h1>
                        <p className="text-muted-foreground">
                            Configure os itens de vistoria do check-in/check-out por veículo, ou edite o template padrão global.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LayoutTemplate className="h-5 w-5 text-primary" />
                            Destino da configuração
                        </CardTitle>
                        <CardDescription>
                            Selecione "Template padrão global" para definir o checklist padrão de todos os veículos,
                            ou escolha um veículo específico para personalizar o checklist dele.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Veículo / Template</Label>
                                <Select value={target} onValueChange={(v) => setTarget(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o destino" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">
                                            <span className="flex items-center gap-2">
                                                <LayoutTemplate className="h-4 w-4" />
                                                Template padrão global
                                            </span>
                                        </SelectItem>
                                        {vehicles.map((v) => (
                                            <SelectItem key={v.id} value={v.id}>
                                                {v.plate} - {v.brand} {v.model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" onClick={handleOpenCopyDialog} disabled={isSaving || isLoading}>
                                    <CopyPlus className="h-4 w-4 mr-2" />
                                    Copiar para veículos
                                </Button>
                                <Button variant="outline" onClick={handleLoadDefaults} disabled={isSaving}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Carregar itens padrão
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Salvar configuração
                                </Button>
                            </div>
                        </div>
                        {target !== 'default' && (
                            <div className="mt-3">
                                {isCustomized ? (
                                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Este veículo possui checklist personalizado
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-green-500 text-green-600">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Usando template padrão global
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5 text-primary" />
                                Itens do checklist
                                <Badge variant="secondary">{items.length}</Badge>
                            </span>
                            <Button variant="outline" size="sm" onClick={handleAddItem} disabled={isSaving}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar item
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Marque como obrigatório os itens que não podem ser deixados em branco na vistoria.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Nenhum item configurado.</p>
                                <p className="text-sm mt-1">
                                    Clique em "Adicionar item" ou "Carregar itens padrão" para começar.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="border rounded-lg p-3">
                                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                                            <div className="flex items-center gap-1 md:flex-col">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleMove(index, -1)}
                                                    disabled={index === 0 || isSaving}
                                                    title="Mover para cima"
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleMove(index, 1)}
                                                    disabled={index === items.length - 1 || isSaving}
                                                    title="Mover para baixo"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex-1 space-y-2 md:space-y-0 md:flex md:items-center md:gap-3">
                                                <div className="flex-1">
                                                    <Label className="sr-only">Título</Label>
                                                    <Input
                                                        value={item.title}
                                                        onChange={(e) => handleUpdateItem(index, { title: e.target.value })}
                                                        placeholder="Título do item (ex: Faróis)"
                                                        disabled={isSaving}
                                                    />
                                                </div>
                                                <div className="w-full md:w-44">
                                                    <Label className="sr-only">Categoria</Label>
                                                    <Select
                                                        value={item.category}
                                                        onValueChange={(v) => handleUpdateItem(index, { category: v })}
                                                        disabled={isSaving}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {CATEGORY_OPTIONS.map((cat) => (
                                                                <SelectItem key={cat} value={cat}>
                                                                    {CATEGORY_LABELS[cat]}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 md:gap-2 justify-between md:justify-start">
                                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <Checkbox
                                                        checked={!!item.required}
                                                        onCheckedChange={(checked) =>
                                                            handleUpdateItem(index, { required: !!checked })
                                                        }
                                                        disabled={isSaving}
                                                    />
                                                    Obrigatório
                                                </label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={() => handleRemoveItem(index)}
                                                    disabled={isSaving}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <Car className="h-4 w-4 text-primary flex-shrink-0" />
                    <p>
                        Os itens configurados aparecem automaticamente nas telas de <strong>check-in/check-out do motorista</strong>{' '}
                        e na <strong>Gestão de Portaria</strong>. Veículos sem configuração própria usam o template padrão global.
                    </p>
                </div>
                <Separator />
            </div>

            <Dialog
                open={isCopyDialogOpen}
                onOpenChange={(open) => {
                    if (!open && !isCopying) {
                        setIsCopyDialogOpen(false);
                        setCopyResult(null);
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
                    onEscapeKeyDown={(e) => isCopying && e.preventDefault()}
                    onPointerDownOutside={(e) => isCopying && e.preventDefault()}
                    onInteractOutside={(e) => isCopying && e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {copyResult ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                                <CopyPlus className="h-5 w-5 text-primary" />
                            )}
                            {copyResult ? 'Configuração copiada!' : 'Copiar configuração para veículos'}
                        </DialogTitle>
                        <DialogDescription>
                            {copyResult ? (
                                'Resumo retornado pelo servidor com os veículos que receberam a configuração.'
                            ) : (
                                <>
                                    A configuração atual (
                                    <strong>{items.filter((i) => i.title && i.title.trim() !== '').length} itens</strong>
                                    ) será aplicada aos veículos selecionados, substituindo a configuração existente deles.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {copyResult ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold text-green-700">
                                        {copyResult.itemsCount} itens aplicados em {copyResult.copied} veículo(s)
                                    </p>
                                    <p className="text-muted-foreground">
                                        A configuração foi copiada com sucesso para os veículos abaixo.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                {copyResult.vehicleIds.map((id) => (
                                    <div
                                        key={id}
                                        className="flex items-center gap-2 p-2 rounded-lg border border-green-500/20 bg-green-500/5"
                                    >
                                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm font-medium truncate">{vehicleLabel(id)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2">
                        {copyableVehicles.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">
                                Nenhum outro veículo disponível para copiar.
                            </p>
                        ) : (
                            <>
                                <div className="flex items-center justify-between pb-1">
                                    <span className="text-sm text-muted-foreground">
                                        {selectedCopyIds.length} de {copyableVehicles.length} selecionado(s)
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={handleSelectAll} disabled={isCopying}>
                                        Selecionar todos
                                    </Button>
                                </div>
                                {copyableVehicles.map((v) => (
                                    <div
                                        key={v.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                            isCopying ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:bg-muted/50'
                                        } ${
                                            selectedCopyIds.includes(v.id)
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border'
                                        }`}
                                        onClick={() => !isCopying && handleToggleCopyVehicle(v.id)}
                                        aria-disabled={isCopying}
                                    >
                                        <Checkbox
                                            checked={selectedCopyIds.includes(v.id)}
                                            onCheckedChange={() => handleToggleCopyVehicle(v.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={isCopying}
                                        />
                                        <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm font-medium">{v.plate}</span>
                                        <span className="text-sm text-muted-foreground truncate">
                                            {v.brand} {v.model}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                    )}

                    <DialogFooter>
                        {copyResult ? (
                            <Button onClick={handleCloseCopyDialog}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Concluir
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setIsCopyDialogOpen(false)} disabled={isCopying}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCopyConfig}
                                    disabled={isCopying || selectedCopyIds.length === 0}
                                >
                                    {isCopying ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <CopyPlus className="h-4 w-4 mr-2" />
                                    )}
                                    {isCopying ? 'Copiando...' : `Copiar para ${selectedCopyIds.length} veículo(s)`}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </StandardLayout>
    );
};

export default GestaoChecklistVeiculo;
