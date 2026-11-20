import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Bus, Clock3, RefreshCw, Users, Wrench } from 'lucide-react';
import { StandardLayout } from '@/components/StandardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientVehicleAllocationBoard from '@/components/operacional/ClientVehicleAllocationBoard';
import fleetService from '@/services/fleetService';
import driverService, { type Driver } from '@/services/driverService';
import { clientService, type Client } from '@/services/clientService';
import { driverShiftService, type DriverShift } from '@/services/driverShiftService';
import type { Vehicle } from '@/types/fleet';

const localDateKey = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const OperationalDashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [shifts, setShifts] = useState<DriverShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    setRefreshing(true);
    setLoadError(false);
    const results = await Promise.allSettled([
      fleetService.getVehicles(forceRefresh),
      driverService.getDrivers(),
      clientService.getAllClients(),
      driverShiftService.findByDate(localDateKey()),
    ] as const);
    const [vehicleResult, driverResult, clientResult, shiftResult] = results;
    if (vehicleResult.status === 'fulfilled') setVehicles(vehicleResult.value || []);
    if (driverResult.status === 'fulfilled') setDrivers(driverResult.value || []);
    if (clientResult.status === 'fulfilled') setClients(clientResult.value || []);
    if (shiftResult.status === 'fulfilled') setShifts(shiftResult.value || []);
    setLoadError(results.some((result) => result.status === 'rejected'));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void loadDashboardData(); }, [loadDashboardData]);

  const activeVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.status === 'ACTIVE'), [vehicles]);
  const maintenanceVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.status === 'MAINTENANCE'), [vehicles]);
  const activeDrivers = useMemo(() => drivers.filter((driver) => driver.status === 'ATIVO'), [drivers]);
  const activeShifts = useMemo(() => shifts.filter((shift) => shift.status === 'IN_PROGRESS'), [shifts]);

  const metrics = [
    { title: 'Veículos operacionais', value: activeVehicles.length, detail: `${vehicles.length} veículos na frota`, icon: Bus, tone: 'text-sky-500' },
    { title: 'Motoristas ativos', value: activeDrivers.length, detail: `${drivers.length} motoristas cadastrados`, icon: Users, tone: 'text-indigo-500' },
    { title: 'Clientes', value: clients.length, detail: 'clientes cadastrados', icon: Building2, tone: 'text-emerald-500' },
    { title: 'Viagens em andamento', value: activeShifts.length, detail: `${shifts.length} escalas de motorista hoje`, icon: Clock3, tone: 'text-amber-500' },
  ];

  if (loading) {
    return <StandardLayout><div className="flex h-64 items-center justify-center gap-3 text-muted-foreground"><RefreshCw className="h-6 w-6 animate-spin"/>Carregando painel operacional...</div></StandardLayout>;
  }

  return (
    <StandardLayout>
      <main className="space-y-6 p-4 sm:p-6">
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Operação de transporte</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard Operacional</h1>
            <p className="mt-1 text-sm text-muted-foreground">Frota, motoristas, clientes e viagens em um só lugar.</p>
          </div>
          <Button onClick={() => void loadDashboardData(true)} disabled={refreshing} variant="outline" className="gap-2 self-start sm:self-auto">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}/>{refreshing ? 'Atualizando' : 'Atualizar dados'}
          </Button>
        </section>

        {loadError && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Algumas informações não puderam ser atualizadas. Confira a conexão e tente novamente.</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ title, value, detail, icon: Icon, tone }) => (
            <Card key={title} className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={`h-5 w-5 ${tone}`}/>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold text-foreground">{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent>
            </Card>
          ))}
        </section>

        <ClientVehicleAllocationBoard />

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div><CardTitle>Viagens em andamento</CardTitle><p className="mt-1 text-sm text-muted-foreground">Escalas com execução ativa hoje.</p></div>
              <Badge variant="outline">{activeShifts.length} ativas</Badge>
            </CardHeader>
            <CardContent>
              {activeShifts.length ? <div className="space-y-3">
                {activeShifts.map((shift) => (
                  <div key={shift.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                    <div className="min-w-0"><p className="truncate font-semibold text-foreground">{shift.driver?.name || 'Motorista não informado'}</p><p className="mt-0.5 text-sm text-muted-foreground">{shift.vehicle?.plate || 'Veículo não informado'}{shift.routeExecutions?.[0]?.route?.name ? ` · ${shift.routeExecutions[0].route.name}` : ''}</p></div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4"/>{shift.actualStartTime || shift.plannedStartTime || '--:--'}</div>
                  </div>
                ))}
              </div> : <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center"><Clock3 className="mx-auto h-7 w-7 text-muted-foreground/60"/><p className="mt-2 font-medium text-foreground">Nenhuma viagem em andamento</p><p className="mt-1 text-sm text-muted-foreground">As execuções iniciadas hoje aparecerão aqui.</p></div>}
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader><CardTitle>Disponibilidade da frota</CardTitle><p className="text-sm text-muted-foreground">Resumo dos veículos cadastrados.</p></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-3"><span className="flex items-center gap-2 text-sm font-medium text-foreground"><Bus className="h-4 w-4 text-emerald-600"/>Operacionais</span><strong className="text-lg text-emerald-700 dark:text-emerald-400">{activeVehicles.length}</strong></div>
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 p-3"><span className="flex items-center gap-2 text-sm font-medium text-foreground"><Wrench className="h-4 w-4 text-amber-600"/>Em manutenção</span><strong className="text-lg text-amber-700 dark:text-amber-400">{maintenanceVehicles.length}</strong></div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3"><span className="text-sm font-medium text-foreground">Outros status</span><strong className="text-lg text-foreground">{Math.max(vehicles.length - activeVehicles.length - maintenanceVehicles.length, 0)}</strong></div>
            </CardContent>
          </Card>
        </section>
      </main>
    </StandardLayout>
  );
};

export default OperationalDashboard;
