import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { tcoService, VehicleTco, TcoRecommendation } from '@/services/tcoService';
import { AlertTriangle, Car, Clock, Gauge, RefreshCw, TrendingUp } from 'lucide-react';

const fmtBRL = (v?: number | null) =>
  typeof v === 'number' && isFinite(v)
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';

const fmtNum = (v?: number | null, digits = 0) =>
  typeof v === 'number' && isFinite(v)
    ? v.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })
    : '—';

const RECOMMENDATION_CONFIG: Record<TcoRecommendation, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  REPLACE: { label: 'Substituir', variant: 'destructive' },
  WATCH: { label: 'Monitorar', variant: 'secondary' },
  NONE: { label: 'Regular', variant: 'outline' },
};

const TcoPanel: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<VehicleTco[]>([]);
  const [loading, setLoading] = useState(false);
  const [plateFilter, setPlateFilter] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const load = useCallback(
    async (plate?: string) => {
      setLoading(true);
      try {
        const data = plate && plate.trim()
          ? await tcoService.getByPeriod({ plate: plate.trim() })
          : await tcoService.getCurrentMonth();
        setRows(data);
      } catch {
        toast({ title: 'Erro', description: 'Falha ao carregar painel TCO.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await tcoService.recalculateOdometers();
      toast({
        title: 'Hodômetros atualizados',
        description: `${res.vehiclesUpdated} veículo(s) atualizado(s) a partir das Partes Diárias. PMP verificado.`,
      });
      load(plateFilter);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao recalcular hodômetros.', variant: 'destructive' });
    } finally {
      setRecalculating(false);
    }
  };

  const summary = useMemo(() => {
    const replace = rows.filter((r) => r.recommendation === 'REPLACE').length;
    const watch = rows.filter((r) => r.recommendation === 'WATCH').length;
    const totalCost = rows.reduce((acc, r) => acc + (r.maintenanceCostInMonth ?? 0), 0);
    const totalKm = rows.reduce((acc, r) => acc + (r.kmRunInMonth ?? 0), 0);
    return { replace, watch, totalCost, totalKm };
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="h-5 w-5" /> Painel TCO — Decisão de Substituição
          </h2>
          <p className="text-sm text-muted-foreground">
            Módulo 6 (RF-06.4): Custo Real/KM vs orçado (Módulo 1). Alerta acima de 20% ou 3+ paradas no mês.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Filtrar por placa..."
            value={plateFilter}
            onChange={(e) => setPlateFilter(e.target.value.toUpperCase())}
            className="w-40"
            onKeyDown={(e) => e.key === 'Enter' && load(plateFilter)}
          />
          <Button variant="outline" onClick={() => load(plateFilter)}>Filtrar</Button>
          <Button variant="outline" onClick={handleRecalculate} disabled={recalculating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            Recalcular Hodômetros
          </Button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Veículos no Painel</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{rows.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-500" /> Para Substituir</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{summary.replace}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Em Monitoramento</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{summary.watch}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Custo Oficina no Mês</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmtBRL(summary.totalCost)}</p></CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">TCO por Placa ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum veículo encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead className="text-right">KM no Mês</TableHead>
                    <TableHead className="text-right">Custo Oficina</TableHead>
                    <TableHead className="text-right">Custo Real/KM</TableHead>
                    <TableHead className="text-right">Orçado/KM (M1)</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead className="text-right">Paradas</TableHead>
                    <TableHead className="text-right">Horas Parado</TableHead>
                    <TableHead>Recomendação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const cfg = RECOMMENDATION_CONFIG[r.recommendation ?? 'NONE'];
                    return (
                      <TableRow key={r.vehicleId} className={r.recommendation === 'REPLACE' ? 'bg-red-500/5' : undefined}>
                        <TableCell>
                          <p className="font-medium flex items-center gap-1"><Car className="h-3 w-3" /> {r.plate}</p>
                          <p className="text-xs text-muted-foreground">
                            {[r.brand, r.model, r.year].filter(Boolean).join(' · ')}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">{fmtNum(r.kmRunInMonth)} km</TableCell>
                        <TableCell className="text-right">{fmtBRL(r.maintenanceCostInMonth)}</TableCell>
                        <TableCell className="text-right font-medium">{fmtBRL(r.realCostPerKm)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmtBRL(r.budgetedCostPerKm)}</TableCell>
                        <TableCell className={`text-right ${(r.costVariancePct ?? 0) > 0.2 ? 'text-red-600 font-semibold' : ''}`}>
                          {r.costVariancePct != null ? `${fmtNum(r.costVariancePct * 100, 1)}%` : '—'}
                        </TableCell>
                        <TableCell className={`text-right ${r.excessiveStops ? 'text-red-600 font-semibold' : ''}`}>
                          {fmtNum(r.workOrdersInMonth)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" /> {fmtNum(r.downtimeHoursInMonth)}h
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          {r.recommendation === 'REPLACE' && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">{r.recommendationMessage}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TcoPanel;
