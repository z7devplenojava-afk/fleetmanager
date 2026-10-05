import React, { useCallback, useEffect, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus, Pencil, Trash2, CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import lineTimeSlotService, {
    DayType,
    LineTimeSlot,
    ScheduleDateOverride,
    dayTypeLabel,
} from '@/services/lineTimeSlotService';
import { routeService, Route } from '@/services/routeService';

const diaTipos: DayType[] = ['DIA_UTIL', 'SABADO', 'DOMINGO_FERIADO'];

const formatTime = (t: string) => (t ? t.substring(0, 5) : '--:--');

const Horarios: React.FC = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<LineTimeSlot[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [overrides, setOverrides] = useState<ScheduleDateOverride[]>([]);
    const [filterRoute, setFilterRoute] = useState('all');
    const [filterDayType, setFilterDayType] = useState('all');

    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<LineTimeSlot | null>(null);
    const [formData, setFormData] = useState({
        routeId: '',
        dayType: 'DIA_UTIL' as DayType,
        departureTime: '',
        status: 'ATIVO',
    });

    const [overrideOpen, setOverrideOpen] = useState(false);
    const [overrideForm, setOverrideForm] = useState({
        overrideDate: '',
        appliesDayType: 'DOMINGO_FERIADO' as DayType,
        reason: '',
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [slotsData, routesData, overridesData] = await Promise.all([
                lineTimeSlotService.getAll(),
                routeService.findAllRoutes(),
                lineTimeSlotService.getOverrides(),
            ]);
            setSlots(Array.isArray(slotsData) ? slotsData : []);
            setRoutes(Array.isArray(routesData) ? routesData : []);
            setOverrides(Array.isArray(overridesData) ? overridesData : []);
        } catch {
            toast({
                title: 'Erro',
                description: 'Erro ao carregar horários',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filtered = slots.filter((s) => {
        if (filterRoute !== 'all' && s.route?.id !== filterRoute) return false;
        if (filterDayType !== 'all' && s.dayType !== filterDayType) return false;
        return true;
    });

    const openCreate = () => {
        setEditing(null);
        setFormData({ routeId: '', dayType: 'DIA_UTIL', departureTime: '', status: 'ATIVO' });
        setModalOpen(true);
    };

    const openEdit = (slot: LineTimeSlot) => {
        setEditing(slot);
        setFormData({
            routeId: slot.route?.id || '',
            dayType: slot.dayType,
            departureTime: slot.departureTime.substring(0, 5),
            status: slot.status,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.routeId) {
            toast({ title: 'Erro de Validação', description: 'Selecione a linha.', variant: 'destructive' });
            return;
        }
        if (!formData.departureTime) {
            toast({ title: 'Erro de Validação', description: 'Informe o horário de partida.', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const payload: Partial<LineTimeSlot> = {
                route: { id: formData.routeId },
                dayType: formData.dayType,
                departureTime: formData.departureTime.length === 5 ? `${formData.departureTime}:00` : formData.departureTime,
                status: formData.status as LineTimeSlot['status'],
            };
            if (editing?.id) {
                await lineTimeSlotService.update(editing.id, payload);
            } else {
                await lineTimeSlotService.create(payload);
            }
            toast({ title: 'Sucesso', description: editing ? 'Horário atualizado' : 'Horário criado' });
            setModalOpen(false);
            loadData();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: 'Erro',
                description: err.response?.data?.message || 'Erro ao salvar horário',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (slot: LineTimeSlot) => {
        if (!slot.id) return;
        if (!confirm('Excluir este horário?')) return;
        try {
            await lineTimeSlotService.delete(slot.id);
            toast({ title: 'Sucesso', description: 'Horário excluído' });
            loadData();
        } catch {
            toast({ title: 'Erro', description: 'Erro ao excluir horário', variant: 'destructive' });
        }
    };

    const handleSaveOverride = async () => {
        if (!overrideForm.overrideDate || !overrideForm.appliesDayType) {
            toast({ title: 'Erro de Validação', description: 'Data e tipo de dia são obrigatórios.', variant: 'destructive' });
            return;
        }
        try {
            await lineTimeSlotService.saveOverride({
                overrideDate: overrideForm.overrideDate,
                appliesDayType: overrideForm.appliesDayType,
                reason: overrideForm.reason || undefined,
            });
            toast({ title: 'Sucesso', description: 'Exceção de calendário salva' });
            setOverrideOpen(false);
            setOverrideForm({ overrideDate: '', appliesDayType: 'DOMINGO_FERIADO', reason: '' });
            loadData();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: 'Erro',
                description: err.response?.data?.message || 'Erro ao salvar exceção',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteOverride = async (o: ScheduleDateOverride) => {
        if (!o.id) return;
        if (!confirm(`Excluir a exceção de ${o.overrideDate}?`)) return;
        try {
            await lineTimeSlotService.deleteOverride(o.id);
            loadData();
        } catch {
            toast({ title: 'Erro', description: 'Erro ao excluir exceção', variant: 'destructive' });
        }
    };

    return (
        <StandardLayout title="Horários" subtitle="Horários de partida por linha e tipo de dia">
            <div className="p-4 space-y-6">
                {/* Filtros + novo */}
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                        <Select value={filterRoute} onValueChange={setFilterRoute}>
                            <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200 flex-1">
                                <SelectValue placeholder="Todas as linhas" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600">
                                <SelectItem value="all">Todas as linhas</SelectItem>
                                {routes.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterDayType} onValueChange={setFilterDayType}>
                            <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200 flex-1">
                                <SelectValue placeholder="Todos os tipos de dia" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600">
                                <SelectItem value="all">Todos os tipos de dia</SelectItem>
                                {diaTipos.map((d) => (
                                    <SelectItem key={d} value={d}>{dayTypeLabel[d]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={openCreate} className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90">
                            <Plus className="w-4 h-4 mr-2" /> Novo Horário
                        </Button>
                    </CardContent>
                </Card>

                {/* Tabela */}
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-seguranca-yellow" /> Horários de Partida
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="p-12 text-center text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-seguranca-yellow" />
                                Carregando horários...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Nenhum horário cadastrado</p>
                                <p className="text-sm mt-1">Cadastre os horários de partida das linhas para gerar as escalas.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-gray-700">
                                            <th className="py-2 pr-4">Linha</th>
                                            <th className="py-2 pr-4">Tipo de dia</th>
                                            <th className="py-2 pr-4">Horário</th>
                                            <th className="py-2 pr-4">Status</th>
                                            <th className="py-2 pr-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((s) => (
                                            <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-800/40">
                                                <td className="py-3 pr-4 text-gray-200">
                                                    <span
                                                        className="inline-block h-2.5 w-2.5 rounded-full mr-2 border border-gray-600"
                                                        style={{ backgroundColor: s.route?.color || '#6B7280' }}
                                                    />
                                                    {s.route?.name || '—'}
                                                </td>
                                                <td className="py-3 pr-4 text-gray-300">{dayTypeLabel[s.dayType]}</td>
                                                <td className="py-3 pr-4 text-seguranca-yellow font-mono font-semibold">{formatTime(s.departureTime)}</td>
                                                <td className="py-3 pr-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            s.status === 'ATIVO'
                                                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                                : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                                                        }
                                                    >
                                                        {s.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 pr-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-white"
                                                        onClick={() => openEdit(s)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-400 hover:text-red-300"
                                                        onClick={() => handleDelete(s)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Exceções de calendário */}
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-seguranca-yellow" /> Exceções de Calendário
                            </CardTitle>
                            <Button
                                variant="outline"
                                className="border-gray-600 text-gray-300"
                                onClick={() => setOverrideOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Nova Exceção
                            </Button>
                        </div>
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-seguranca-yellow" />
                            Em datas com exceção (ex.: feriado), o sistema utiliza os horários do tipo de dia indicado.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {overrides.length === 0 ? (
                            <p className="text-sm text-gray-500">Nenhuma exceção cadastrada.</p>
                        ) : (
                            <div className="space-y-2">
                                {overrides.map((o) => (
                                    <div
                                        key={o.id}
                                        className="flex items-center justify-between bg-seguranca-black border border-gray-700 rounded-md px-4 py-3"
                                    >
                                        <div>
                                            <p className="text-gray-200 font-mono">{o.overrideDate}</p>
                                            <p className="text-xs text-gray-400">
                                                Utiliza horários de <strong className="text-seguranca-yellow">{dayTypeLabel[o.appliesDayType]}</strong>
                                                {o.reason ? ` — ${o.reason}` : ''}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-400 hover:text-red-300"
                                            onClick={() => handleDeleteOverride(o)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal Horário */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-gray-100">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editing ? 'Editar Horário' : 'Novo Horário de Partida'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Defina a linha, o tipo de dia e o horário de partida.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Linha *</Label>
                            <Select
                                value={formData.routeId}
                                onValueChange={(v) => setFormData({ ...formData, routeId: v })}
                                disabled={!!editing}
                            >
                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                    <SelectValue placeholder="Selecione a linha" />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                    {routes.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Tipo de dia *</Label>
                            <Select
                                value={formData.dayType}
                                onValueChange={(v) => setFormData({ ...formData, dayType: v as DayType })}
                            >
                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                    {diaTipos.map((d) => (
                                        <SelectItem key={d} value={d}>{dayTypeLabel[d]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Horário de partida *</Label>
                            <Input
                                type="time"
                                value={formData.departureTime}
                                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                className="bg-seguranca-black border-gray-600 text-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Status</Label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                    <SelectItem value="ATIVO">Ativo</SelectItem>
                                    <SelectItem value="INATIVO">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Exceção */}
            <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-gray-100">
                    <DialogHeader>
                        <DialogTitle className="text-white">Nova Exceção de Calendário</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Ex.: feriado utiliza os horários de domingo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Data *</Label>
                            <Input
                                type="date"
                                value={overrideForm.overrideDate}
                                onChange={(e) => setOverrideForm({ ...overrideForm, overrideDate: e.target.value })}
                                className="bg-seguranca-black border-gray-600 text-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Utilizar horários de *</Label>
                            <Select
                                value={overrideForm.appliesDayType}
                                onValueChange={(v) => setOverrideForm({ ...overrideForm, appliesDayType: v as DayType })}
                            >
                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                    {diaTipos.map((d) => (
                                        <SelectItem key={d} value={d}>{dayTypeLabel[d]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Motivo</Label>
                            <Input
                                value={overrideForm.reason}
                                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                                placeholder="Ex.: Feriado municipal"
                                className="bg-seguranca-black border-gray-600 text-gray-200"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setOverrideOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                            onClick={handleSaveOverride}
                        >
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </StandardLayout>
    );
};

export default Horarios;
