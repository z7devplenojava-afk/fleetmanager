import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Plus, RefreshCw, Search, Bus, UserRound, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Schedule, isScheduleActiveForDate } from '@/services/scheduleService';

type Period = 'day' | 'week' | 'month';

interface Props {
  schedules: Schedule[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
}

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const PlantaoSchedulesPanel: React.FC<Props> = ({ schedules, isLoading, onRefresh, onCreate, onEdit, onDelete }) => {
  const [period, setPeriod] = useState<Period>('week');
  const [search, setSearch] = useState('');
  const [today] = useState(() => new Date());

  const filtered = useMemo(() => {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (period === 'week') {
      const weekday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - weekday);
    } else if (period === 'month') {
      start.setDate(1);
    }
    const end = period === 'day'
      ? new Date(start)
      : period === 'week'
        ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
        : new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const dates: string[] = [];
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) dates.push(localDateKey(cursor));
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return (Array.isArray(schedules) ? schedules : []).filter((schedule) => {
      if (!dates.some((date) => isScheduleActiveForDate(schedule, date))) return false;
      const haystack = [schedule.employee?.name, schedule.client?.name, schedule.clientName, schedule.workPost?.client?.name,
        schedule.vehicle?.plate, schedule.vehiclePlate, schedule.route?.name, schedule.routeCode, schedule.travelTrip?.name,
        schedule.location?.name, schedule.workPost?.name].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
      return !query || haystack.includes(query);
    }).sort((a, b) => `${a.scheduleDate} ${a.startTime || ''}`.localeCompare(`${b.scheduleDate} ${b.startTime || ''}`));
  }, [schedules, period, search]);

  const clientName = (s: Schedule) => s.client?.name || s.workPost?.client?.name || s.clientName || s.workPost?.name || 'Não informado';
  const vehicle = (s: Schedule) => s.vehicle?.plate || s.vehiclePlate || 'Não definido';
  const route = (s: Schedule) => s.route?.name || s.routeCode || s.travelTrip?.name || s.location?.name || 'Não informada';
  const dateLabel = (value: string) => {
    const [y, m, d] = (value || '').slice(0, 10).split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d).toLocaleDateString('pt-BR') : '—';
  };

  return <div className="space-y-5">
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary"><CalendarDays className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-wide">Escala operacional</span></div>
          <h2 className="mt-2 text-2xl font-bold">Plantões de motoristas e veículos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Consulte motorista, cliente, veículo, horário e rota por período.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Atualizar</Button>
          <Button onClick={onCreate}><Plus className="mr-2 h-4 w-4" />Novo plantão</Button>
        </div>
      </CardContent>
    </Card>

    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:p-4">
      <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar motorista, cliente, veículo ou rota..." className="pl-9" /></div>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Período dos plantões">
        {([['day', 'Dia'], ['week', 'Semana'], ['month', 'Mês']] as const).map(([value, label]) => <Button key={value} size="sm" variant={period === value ? 'default' : 'ghost'} onClick={() => setPeriod(value)}>{label}</Button>)}
      </div>
    </div>

    <Card className="overflow-hidden border-border/70">
      {isLoading ? <div className="p-12 text-center text-muted-foreground"><RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />Carregando plantões...</div> : filtered.length === 0 ? <div className="px-5 py-14 text-center"><Clock3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" /><h3 className="font-semibold">Nenhum plantão neste período</h3><p className="mt-1 text-sm text-muted-foreground">Crie uma escala para visualizar a programação aqui.</p><Button className="mt-4" onClick={onCreate}><Plus className="mr-2 h-4 w-4" />Criar plantão</Button></div> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-muted/70 text-muted-foreground"><tr>{['Data', 'Motorista', 'Cliente', 'Veículo', 'Horários', 'Rota', 'Status', 'Ações'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y">{filtered.map((s) => <tr key={s.id} className="hover:bg-muted/30"><td className="px-4 py-3 font-medium">{dateLabel(s.scheduleDate)}</td><td className="px-4 py-3">{s.employee?.name || 'Motorista não informado'}</td><td className="px-4 py-3">{clientName(s)}</td><td className="px-4 py-3">{vehicle(s)}</td><td className="px-4 py-3">{s.startTime || '—'} – {s.endTime || '—'}</td><td className="px-4 py-3">{route(s)}</td><td className="px-4 py-3"><Badge variant="outline">{{ PENDING: 'Pendente', CONFIRMED: 'Confirmado', IN_PROGRESS: 'Em andamento', CANCELLED: 'Cancelado', COMPLETED: 'Concluído' }[s.status] || s.status}</Badge></td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(s)}>Editar</Button><Button size="sm" variant="ghost" onClick={() => onDelete(s)}>Excluir</Button></div></td></tr>)}</tbody></table></div>
        <div className="space-y-3 p-3 md:hidden">{filtered.map((s) => <article key={s.id} className="rounded-xl border bg-background p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{s.employee?.name || 'Motorista não informado'}</p><p className="mt-1 text-sm text-muted-foreground">{dateLabel(s.scheduleDate)}</p></div><Badge variant="outline">{s.status === 'IN_PROGRESS' ? 'Em andamento' : s.status === 'CONFIRMED' ? 'Confirmado' : s.status === 'COMPLETED' ? 'Concluído' : s.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}</Badge></div><div className="mt-4 grid grid-cols-1 gap-2 text-sm text-muted-foreground"><span className="flex gap-2"><UserRound className="h-4 w-4 shrink-0" />{clientName(s)}</span><span className="flex gap-2"><Bus className="h-4 w-4 shrink-0" />{vehicle(s)}</span><span className="flex gap-2"><Clock3 className="h-4 w-4 shrink-0" />{s.startTime || '—'} – {s.endTime || '—'}</span><span className="flex gap-2"><Route className="h-4 w-4 shrink-0" />{route(s)}</span></div><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => onEdit(s)}>Editar</Button><Button variant="ghost" onClick={() => onDelete(s)}>Excluir</Button></div></article>)}</div>
      </>}
    </Card>
    <p className="text-right text-xs text-muted-foreground">{filtered.length} plantão{filtered.length === 1 ? '' : 'ões'} no período selecionado</p>
  </div>;
};

export default PlantaoSchedulesPanel;
