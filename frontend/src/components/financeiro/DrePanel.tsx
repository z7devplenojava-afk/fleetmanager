import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingDown,
  TrendingUp,
  Fuel,
  Wrench,
  Users,
  Landmark,
  Percent,
  RefreshCw,
} from 'lucide-react';
import {
  financialClosingService,
  type VehicleDre,
  type DreByClientResponse,
} from '@/services/financialClosingService';

const brl = (value?: number | null) =>
  (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const pct = (value?: number | null) =>
  `${((value ?? 0) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

const currentMonth = () => new Date().toISOString().slice(0, 7);

export function DrePanel() {
  const [referenceMonth, setReferenceMonth] = useState(currentMonth());

  // ===== Visão por placa =====
  const [vehicles, setVehicles] = useState<VehicleDre[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [errorVehicles, setErrorVehicles] = useState<string | null>(null);

  // ===== Visão por cliente =====
  const [byClient, setByClient] = useState<DreByClientResponse | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);

  const load = async (month: string) => {
    setLoadingVehicles(true);
    setErrorVehicles(null);
    setLoadingClients(true);
    try {
      setVehicles(await financialClosingService.getFleetDre(month));
    } catch {
      setErrorVehicles('Falha ao carregar o DRE por veículo.');
    } finally {
      setLoadingVehicles(false);
    }
    try {
      setByClient(await financialClosingService.getDreByClient(month));
    } catch {
      setByClient(null);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    load(referenceMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceMonth]);

  const totals = useMemo(() => {
    const sum = (fn: (d: VehicleDre) => number) => vehicles.reduce((acc, d) => acc + (fn(d) ?? 0), 0);
    return {
      revenue: sum((d) => d.grossRevenue),
      taxes: sum((d) => d.taxesValue),
      costs: sum((d) => d.totalCosts),
      result: sum((d) => d.netResult),
      lossVehicles: vehicles.filter((d) => d.netResult < 0).length,
    };
  }, [vehicles]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mês de referência:</span>
          <Input
            type="month"
            value={referenceMonth}
            onChange={(e) => setReferenceMonth(e.target.value)}
            className="w-40"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => load(referenceMonth)} disabled={loadingVehicles}>
          <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
        </Button>
      </div>

      {errorVehicles && (
        <Card className="border-destructive">
          <CardContent className="py-3 text-sm text-destructive">{errorVehicles}</CardContent>
        </Card>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-1"><CardDescription>Receita Bruta</CardDescription></CardHeader>
          <CardContent><p className="text-lg font-semibold">{brl(totals.revenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardDescription>Impostos</CardDescription></CardHeader>
          <CardContent><p className="text-lg font-semibold">{brl(totals.taxes)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardDescription>Custos Totais</CardDescription></CardHeader>
          <CardContent><p className="text-lg font-semibold">{brl(totals.costs)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardDescription>Resultado Líquido</CardDescription></CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold flex items-center gap-1 ${totals.result < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totals.result < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {brl(totals.result)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardDescription>Veículos em Prejuízo</CardDescription></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{totals.lossVehicles} <span className="text-sm text-muted-foreground">de {vehicles.length}</span></p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="placas">
        <TabsList>
          <TabsTrigger value="placas">Por Placa</TabsTrigger>
          <TabsTrigger value="clientes">Por Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="placas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">DRE Real por Veículo — RF-07.5</CardTitle>
              <CardDescription>
                Receita faturada por placa × impostos (simulação M1) × diesel × oficina × folha × depreciação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVehicles ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Nenhum veículo encontrado para o período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">Impostos</TableHead>
                        <TableHead className="text-right"><Fuel className="inline h-3.5 w-3.5" /> Diesel</TableHead>
                        <TableHead className="text-right"><Wrench className="inline h-3.5 w-3.5" /> Oficina</TableHead>
                        <TableHead className="text-right"><Users className="inline h-3.5 w-3.5" /> Folha</TableHead>
                        <TableHead className="text-right"><Landmark className="inline h-3.5 w-3.5" /> Deprec.</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                        <TableHead className="text-right"><Percent className="inline h-3.5 w-3.5" /> Margem</TableHead>
                        <TableHead className="text-right">Custo/KM</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((d) => (
                        <TableRow key={d.vehicleId} className={d.netResult < 0 ? 'bg-red-50/50' : undefined}>
                          <TableCell className="font-medium">{d.plate}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{d.clientName ?? '—'}</TableCell>
                          <TableCell className="text-right">{brl(d.grossRevenue)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{brl(d.taxesValue)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{brl(d.fuelCost)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{brl(d.maintenanceCost)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{brl(d.payrollCost)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{brl(d.depreciation)}</TableCell>
                          <TableCell className={`text-right font-semibold ${d.netResult < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {brl(d.netResult)}
                          </TableCell>
                          <TableCell className="text-right">{pct(d.resultMarginPct)}</TableCell>
                          <TableCell className="text-right text-xs">{d.kmDriven ? brl(d.realCostPerKm) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes" className="mt-4">
          {loadingClients ? (
            <Skeleton className="h-32 w-full" />
          ) : byClient ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">DRE Consolidado por Cliente/Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Veículos</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Impostos</TableHead>
                      <TableHead className="text-right">Custos</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byClient.clients.map((c) => (
                      <TableRow key={c.clientName}>
                        <TableCell className="font-medium">{c.clientName}</TableCell>
                        <TableCell className="text-right">{c.vehicleCount}</TableCell>
                        <TableCell className="text-right">{brl(c.grossRevenue)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{brl(c.taxesValue)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{brl(c.totalCosts)}</TableCell>
                        <TableCell className={`text-right font-semibold ${c.netResult < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {brl(c.netResult)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={c.netResult < 0 ? 'destructive' : 'secondary'}>{pct(c.marginPct)}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Falha ao carregar consolidação por cliente.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
