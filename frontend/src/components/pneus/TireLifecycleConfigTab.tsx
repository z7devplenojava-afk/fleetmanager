import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import tireService, { TireLifecycleConfig } from '@/services/tireService';
import { DEFAULT_TIRE_LIFECYCLE_CONFIG } from '@/utils/tireLifecycle';
import { Save, Sliders, ShieldCheck } from 'lucide-react';

interface TireLifecycleConfigTabProps {
    config: TireLifecycleConfig;
}

export const TireLifecycleConfigTab: React.FC<TireLifecycleConfigTabProps> = ({ config }) => {
    const [form, setForm] = useState<TireLifecycleConfig>(config || DEFAULT_TIRE_LIFECYCLE_CONFIG);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (config) setForm(config);
    }, [config]);

    const mutation = useMutation({
        mutationFn: (payload: TireLifecycleConfig) => tireService.updateLifecycleConfig(payload),
        onSuccess: () => {
            toast({ title: 'Parâmetros de ciclo de vida salvos!' });
            queryClient.invalidateQueries({ queryKey: ['tire-lifecycle-config'] });
        },
        onError: (e: any) => {
            toast({
                title: 'Erro ao salvar parâmetros',
                description: e?.response?.data?.message || e.message,
                variant: 'destructive',
            });
        },
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    const previewLine = (factor: number, minKm: number, maxKm: number) =>
        `${Math.round((minKm * factor) / 1000)}k – ${Math.round((maxKm * factor) / 1000)}k km`;

    return (
        <form onSubmit={handleSave} className="space-y-4">
            <Card className="bg-seguranca-black/50 border-gray-700">
                <CardHeader className="py-3 px-4 border-b border-gray-700/70 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-seguranca-yellow flex items-center gap-2">
                            <Sliders className="h-4 w-4" />
                            Parâmetros de Quilometragem por Ciclo & Calibração de Linhas
                        </CardTitle>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Defina as faixas de KM esperado por vida útil, TWI mínimo, validade DOT e fatores por tipo de operação (Urbana, Metropolitana, Rodoviária).
                        </p>
                    </div>
                    <Button type="submit" disabled={mutation.isPending} className="bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs">
                        <Save className="h-4 w-4 mr-1.5" />
                        {mutation.isPending ? 'Salvando...' : 'Salvar Parâmetros'}
                    </Button>
                </CardHeader>

                <CardContent className="p-4 space-y-6">
                    {/* Faixas de Quilometragem */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3.5 rounded-xl bg-seguranca-black border border-emerald-800/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-400">1ª Vida (Pneu Novo)</span>
                                <Badge className="bg-emerald-950 text-emerald-300 text-[10px]">0 Recapagens</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-[11px] text-gray-400">KM Mínimo</Label>
                                    <Input
                                        type="number"
                                        value={form.firstLifeMinKm}
                                        onChange={(e) => setForm({ ...form, firstLifeMinKm: Number(e.target.value) })}
                                        className="bg-seguranca-graphite border-gray-600 text-xs font-mono text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-gray-400">KM Máximo</Label>
                                    <Input
                                        type="number"
                                        value={form.firstLifeMaxKm}
                                        onChange={(e) => setForm({ ...form, firstLifeMaxKm: Number(e.target.value) })}
                                        className="bg-seguranca-graphite border-gray-600 text-xs font-mono text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-seguranca-black border border-blue-800/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-400">2ª Vida (1ª Recapagem)</span>
                                <Badge className="bg-blue-950 text-blue-300 text-[10px]">1 Recapagem</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-[11px] text-gray-400">KM Mínimo</Label>
                                    <Input
                                        type="number"
                                        value={form.secondLifeMinKm}
                                        onChange={(e) => setForm({ ...form, secondLifeMinKm: Number(e.target.value) })}
                                        className="bg-seguranca-graphite border-gray-600 text-xs font-mono text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-gray-400">KM Máximo</Label>
                                    <Input
                                        type="number"
                                        value={form.secondLifeMaxKm}
                                        onChange={(e) => setForm({ ...form, secondLifeMaxKm: Number(e.target.value) })}
                                        className="bg-seguranca-graphite border-gray-600 text-xs font-mono text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-seguranca-black border border-amber-800/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-400">3ª Vida (2ª Recapagem)</span>
                                <Badge className="bg-amber-950 text-amber-300 text-[10px]">2 Recapagens</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-[11px] text-gray-400">KM Mínimo</Label>
                                    <Input
                                        type="number"
                                        value={form.thirdLifeMinKm}
                                        onChange={(e) => setForm({ ...form, thirdLifeMinKm: Number(e.target.value) })}
                                        className="bg-seguranca-graphite border-gray-600 text-xs font-mono text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-gray-400">KM Máximo</Label>
                                    <Input
                                        type="number"
                                        value={form.thirdLifeMaxKm}
                                        onChange={(e) => setForm({ ...form, thirdLifeMaxKm: Number(e.target.value) })}
                                        className="bg-seguranca-graphite border-gray-600 text-xs font-mono text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Segurança, TWI, DOT e Bloqueio */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-red-300 font-semibold flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5" /> Máx. Recapagens (Bloqueio)
                            </Label>
                            <Input
                                type="number"
                                min={1}
                                max={3}
                                value={form.maxRecapCount}
                                onChange={(e) => setForm({ ...form, maxRecapCount: Number(e.target.value) })}
                                className="bg-seguranca-black border-gray-600 font-mono text-white"
                            />
                            <span className="text-[10px] text-gray-400">Padrão = 2 (bloqueia 3ª reforma)</span>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Sulco Mínimo Legal / TWI (mm)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.minTreadDepthTwi}
                                onChange={(e) => setForm({ ...form, minTreadDepthTwi: Number(e.target.value) })}
                                className="bg-seguranca-black border-gray-600 font-mono text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Sulco Alerta Preventivo (mm)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.alertTreadDepthMm}
                                onChange={(e) => setForm({ ...form, alertTreadDepthMm: Number(e.target.value) })}
                                className="bg-seguranca-black border-gray-600 font-mono text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Validade DOT Borracha (Anos)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                value={form.dotMaxAgeYears}
                                onChange={(e) => setForm({ ...form, dotMaxAgeYears: Number(e.target.value) })}
                                className="bg-seguranca-black border-gray-600 font-mono text-white"
                            />
                        </div>
                    </div>

                    {/* Fatores de Calibração por Tipo de Linha */}
                    <div className="border-t border-gray-700/70 pt-4 space-y-3">
                        <h4 className="text-sm font-semibold text-white">Fatores de Calibração por Tipo de Linha</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 rounded-xl bg-seguranca-black border border-gray-700 space-y-2">
                                <Label className="text-xs text-gray-200 font-semibold">Linha Urbana (Multiplicador)</Label>
                                <Input
                                    type="number"
                                    step="0.05"
                                    value={form.urbanCalibrationFactor}
                                    onChange={(e) => setForm({ ...form, urbanCalibrationFactor: Number(e.target.value) })}
                                    className="bg-seguranca-graphite border-gray-600 font-mono text-white"
                                />
                                <p className="text-[11px] text-gray-400">
                                    1ª Vida: {previewLine(form.urbanCalibrationFactor, form.firstLifeMinKm, form.firstLifeMaxKm)} • 2ª Vida: {previewLine(form.urbanCalibrationFactor, form.secondLifeMinKm, form.secondLifeMaxKm)}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-seguranca-black border border-gray-700 space-y-2">
                                <Label className="text-xs text-gray-200 font-semibold">Linha Metropolitana (Multiplicador)</Label>
                                <Input
                                    type="number"
                                    step="0.05"
                                    value={form.metropolitanCalibrationFactor}
                                    onChange={(e) => setForm({ ...form, metropolitanCalibrationFactor: Number(e.target.value) })}
                                    className="bg-seguranca-graphite border-gray-600 font-mono text-white"
                                />
                                <p className="text-[11px] text-gray-400">
                                    1ª Vida: {previewLine(form.metropolitanCalibrationFactor, form.firstLifeMinKm, form.firstLifeMaxKm)} • 2ª Vida: {previewLine(form.metropolitanCalibrationFactor, form.secondLifeMinKm, form.secondLifeMaxKm)}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-seguranca-black border border-gray-700 space-y-2">
                                <Label className="text-xs text-gray-200 font-semibold">Linha Rodoviária (Multiplicador)</Label>
                                <Input
                                    type="number"
                                    step="0.05"
                                    value={form.roadCalibrationFactor}
                                    onChange={(e) => setForm({ ...form, roadCalibrationFactor: Number(e.target.value) })}
                                    className="bg-seguranca-graphite border-gray-600 font-mono text-white"
                                />
                                <p className="text-[11px] text-gray-400">
                                    1ª Vida: {previewLine(form.roadCalibrationFactor, form.firstLifeMinKm, form.firstLifeMaxKm)} • 2ª Vida: {previewLine(form.roadCalibrationFactor, form.secondLifeMinKm, form.secondLifeMaxKm)}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
};

