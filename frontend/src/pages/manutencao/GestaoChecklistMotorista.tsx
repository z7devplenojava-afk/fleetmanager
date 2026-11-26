'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  ClipboardCheck,
  UserCheck,
  Car,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Eye,
  Wrench,
  RefreshCw,
  Plus,
  Loader2,
  ImageIcon,
  ShieldAlert,
  Gauge,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Clock
} from 'lucide-react';
import vehicleGateChecklistService from '@/services/vehicleGateChecklistService';
import driverService, { Driver } from '@/services/driverService';
import fleetService from '@/services/fleetService';
import { ChecklistDetailsModal } from '@/components/frota/ChecklistDetailsModal';
import FleetWorkOrderForm from '@/components/frota/FleetWorkOrderForm';
import DriverChecklist from '../driver/DriverChecklist';
import type { VehicleGateChecklist } from '@/types/portaria';
import { useToast } from '@/hooks/use-toast';

interface GestaoChecklistMotoristaProps {
  embedded?: boolean;
}

export const GestaoChecklistMotorista: React.FC<GestaoChecklistMotoristaProps> = ({
  embedded = false,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Modo de visualização: 'list' (histórico completo) ou 'new' (preencher novo checklist)
  const [viewMode, setViewMode] = useState<'list' | 'new'>('list');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [issuesOnly, setIssuesOnly] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Modais
  const [selectedChecklist, setSelectedChecklist] = useState<VehicleGateChecklist | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isOsModalOpen, setIsOsModalOpen] = useState(false);
  const [osInitialVehicleId, setOsInitialVehicleId] = useState<string | undefined>(undefined);
  const [osInitialValues, setOsInitialValues] = useState<any>(undefined);

  // Consultas
  const {
    data: checklists = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-driver-checklists', selectedVehicleId, selectedDriverId, selectedType, dateFrom, dateTo],
    queryFn: async () => {
      return await vehicleGateChecklistService.findAll({
        vehicleId: selectedVehicleId !== 'all' ? selectedVehicleId : undefined,
        driverId: selectedDriverId !== 'all' ? selectedDriverId : undefined,
        type: selectedType !== 'all' ? (selectedType as any) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
    },
    staleTime: 30 * 1000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-select-checklist'],
    queryFn: driverService.getDrivers,
    staleTime: 60 * 1000,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-select-checklist'],
    queryFn: fleetService.getVehicles,
    staleTime: 60 * 1000,
  });

  // Filtragem em memória (busca textual e apenas avarias)
  const filteredChecklists = useMemo(() => {
    return checklists.filter((item) => {
      // Filtro de avarias
      const hasIssue = Boolean(item.driverProblemReport && item.driverProblemReport.trim().length > 0);
      if (issuesOnly && !hasIssue) {
        return false;
      }

      // Filtro textual
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const plate = (item.vehiclePlate || '').toLowerCase();
      const driver = (item.driverName || '').toLowerCase();
      const obs = (item.observations || '').toLowerCase();
      const report = (item.driverProblemReport || '').toLowerCase();

      return plate.includes(term) || driver.includes(term) || obs.includes(term) || report.includes(term);
    });
  }, [checklists, searchTerm, issuesOnly]);

  // Estatísticas e KPIs
  const stats = useMemo(() => {
    const total = checklists.length;
    const exits = checklists.filter((c) => c.type === 'EXIT').length;
    const arrivals = checklists.filter((c) => c.type === 'ARRIVAL').length;
    const withIssues = checklists.filter(
      (c) => c.driverProblemReport && c.driverProblemReport.trim().length > 0
    ).length;
    const totalKm = checklists.reduce((acc, c) => acc + (c.distanceTravelled || 0), 0);

    return { total, exits, arrivals, withIssues, totalKm };
  }, [checklists]);

  // Ação: Abrir OS a partir de checklist com avaria
  const handleOpenWorkOrder = (checklist: VehicleGateChecklist) => {
    setOsInitialVehicleId(checklist.vehicleId);
    setOsInitialValues({
      vehicleId: checklist.vehicleId,
      title: `Correção de Avaria apontada no Checklist - ${checklist.vehiclePlate || 'Veículo'}`,
      description: `Problema apontado pelo motorista (${checklist.driverName || 'Motorista'}):\n${
        checklist.driverProblemReport || checklist.observations || 'Avaria identificada durante a vistoria.'
      }\n\nKM no momento do checklist: ${checklist.kmReading || 'N/A'}\nData do checklist: ${new Date(
        checklist.occurredAt
      ).toLocaleString('pt-BR')}`,
      priority: 'HIGH',
      type: 'CORRECTIVE',
    });
    setIsOsModalOpen(true);
  };

  // Exportar dados filtrados para CSV
  const handleExportCSV = () => {
    if (filteredChecklists.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há registros com os filtros atuais.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'Data/Hora',
      'Tipo',
      'Motorista',
      'Placa do Veículo',
      'KM Registrado',
      'KM Inicial',
      'KM Final',
      'Distância Percorrida',
      'Avarias / Problemas Relatados',
      'Observações',
    ];

    const rows = filteredChecklists.map((c) => [
      `"${new Date(c.occurredAt).toLocaleString('pt-BR')}"`,
      `"${c.type === 'EXIT' ? 'Saída (Check-out)' : 'Chegada (Check-in)'}"`,
      `"${c.driverName || '-'}"`,
      `"${c.vehiclePlate || '-'}"`,
      c.kmReading ?? '',
      c.initialKm ?? '',
      c.finalKm ?? '',
      c.distanceTravelled ?? '',
      `"${(c.driverProblemReport || '').replace(/"/g, '""')}"`,
      `"${(c.observations || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `checklists_motoristas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportação Concluída',
      description: `${filteredChecklists.length} registros exportados com sucesso.`,
    });
  };

  // Se o usuário alternou para o modo de preencher novo checklist no pátio
  if (viewMode === 'new') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1.5 font-bold"
            >
              ← Voltar para Lista de Checklists
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Preenchimento direto de vistoria de motorista
            </span>
          </div>
          <Badge className="bg-seguranca-yellow text-black font-bold">Modo Vistoria Rápida</Badge>
        </div>
        <DriverChecklist embedded />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de Ações do Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <UserCheck className="h-5 w-5 text-seguranca-yellow" />
            Checklists por Motorista
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Histórico completo de check-ins (chegadas), check-outs (saídas), odômetros, fotos e avarias registradas pelos motoristas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="gap-1.5 text-xs font-semibold"
            title="Atualizar listagem"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs font-semibold border-emerald-600/40 text-emerald-500 hover:bg-emerald-600/10"
            title="Exportar para arquivo CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setViewMode('new')}
            className="gap-1.5 text-xs font-bold bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Checklist</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas / KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total de Checklists</p>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5">{stats.total}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Vistorias registradas</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase">Saídas (Check-out)</p>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-blue-500 mt-0.5">{stats.exits}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Início de rota/jornada</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase">Chegadas (Check-in)</p>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-emerald-500 mt-0.5">{stats.arrivals}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Retorno com odômetro</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border shadow-xs transition-colors ${stats.withIssues > 0 ? 'bg-amber-500/5 border-amber-500/40' : 'bg-card border-border'}`}>
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase">Com Avarias / Alerta</p>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-amber-500 mt-0.5">{stats.withIssues}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {stats.withIssues > 0 ? 'Exigem ação de manutenção' : 'Nenhuma avaria pendente'}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Filtros Avançados */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Busca textual */}
            <div className="lg:col-span-2 space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Busca Rápida</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por placa, motorista ou avaria..."
                  className="pl-8 text-xs h-9 bg-background"
                />
              </div>
            </div>

            {/* Filtro por Motorista */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Motorista</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Todos os motoristas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os motoristas</SelectItem>
                  {drivers.map((d: Driver) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Veículo */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Veículo</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {vehicles.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate || v.placa} {v.model ? `— ${v.model}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Tipo */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Tipo</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="EXIT">Saída (Check-out)</SelectItem>
                  <SelectItem value="ARRIVAL">Chegada (Check-in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Apenas com Avarias */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Situação</Label>
              <Button
                type="button"
                variant={issuesOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIssuesOnly(!issuesOnly)}
                className={`w-full h-9 text-xs font-semibold gap-1.5 justify-center ${
                  issuesOnly ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold' : ''
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{issuesOnly ? 'Só com Avarias' : 'Todas Vistorias'}</span>
              </Button>
            </div>
          </div>

          {/* Segunda linha de filtros: Período de datas */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-muted-foreground font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Período:
              </span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-xs w-36 bg-background"
                title="Data Inicial"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-xs w-36 bg-background"
                title="Data Final"
              />
              {(dateFrom || dateTo || selectedDriverId !== 'all' || selectedVehicleId !== 'all' || selectedType !== 'all' || searchTerm || issuesOnly) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setSelectedDriverId('all');
                    setSelectedVehicleId('all');
                    setSelectedType('all');
                    setSearchTerm('');
                    setIssuesOnly(false);
                  }}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>

            <span className="text-xs text-muted-foreground">
              Exibindo <strong>{filteredChecklists.length}</strong> de {checklists.length} checklists
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo: Lista de Checklists */}
      {isLoading ? (
        <div className="p-12 text-center bg-card border rounded-xl space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-semibold text-muted-foreground">Carregando checklists dos motoristas...</p>
        </div>
      ) : filteredChecklists.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Nenhum checklist de motorista encontrado</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Nenhum checklist registrado corresponde aos filtros selecionados. Tente limpar os filtros ou cadastre um novo checklist de saída ou chegada.
            </p>
            <Button
              type="button"
              onClick={() => setViewMode('new')}
              className="mt-2 text-xs font-bold bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Preencher Novo Checklist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Visualização em Tabela para Desktop */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/70 border-b border-border text-foreground font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3.5">Data / Hora</th>
                    <th className="py-3 px-2.5 text-center">Tipo</th>
                    <th className="py-3 px-3">Motorista</th>
                    <th className="py-3 px-3">Veículo</th>
                    <th className="py-3 px-3 text-right">Hodômetro</th>
                    <th className="py-3 px-3">Avarias & Apontamentos</th>
                    <th className="py-3 px-2 text-center">Fotos</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredChecklists.map((c) => {
                    const hasIssue = Boolean(c.driverProblemReport && c.driverProblemReport.trim().length > 0);
                    const photoCount = c.vehiclePhotos ? c.vehiclePhotos.split(',').filter(Boolean).length : 0;

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedChecklist(c);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        {/* Data / Hora */}
                        <td className="py-3 px-3.5 font-medium whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {new Date(c.occurredAt).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(c.occurredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        {/* Tipo: Saída / Chegada */}
                        <td className="py-3 px-2.5 text-center whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`font-bold px-2 py-0.5 text-[10px] ${
                              c.type === 'EXIT'
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            }`}
                          >
                            {c.type === 'EXIT' ? 'Saída (Check-out)' : 'Chegada (Check-in)'}
                          </Badge>
                        </td>

                        {/* Motorista */}
                        <td className="py-3 px-3 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 font-bold text-xs">
                              {(c.driverName || 'M').charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[160px]" title={c.driverName || 'Não identificado'}>
                              {c.driverName || 'Não identificado'}
                            </span>
                          </div>
                        </td>

                        {/* Veículo */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <Car className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-mono font-bold text-foreground">
                              {c.vehiclePlate || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Hodômetro */}
                        <td className="py-3 px-3 text-right font-mono">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-foreground">
                              {c.kmReading != null ? `${c.kmReading.toLocaleString('pt-BR')} km` : '—'}
                            </span>
                            {c.distanceTravelled != null && c.distanceTravelled > 0 && (
                              <span className="text-[10px] text-emerald-500 font-semibold">
                                +{c.distanceTravelled} km rodados
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Avarias e Apontamentos */}
                        <td className="py-3 px-3">
                          {hasIssue ? (
                            <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 max-w-xs">
                              <ShieldAlert className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                              <span className="text-[11px] line-clamp-2 leading-tight font-medium" title={c.driverProblemReport}>
                                {c.driverProblemReport}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Conforme
                            </span>
                          )}
                        </td>

                        {/* Fotos anexadas */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 text-[11px]">
                            {c.odometerPhotoUrl && (
                              <span
                                className="h-6 px-1.5 rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                                title="Foto do Odômetro anexada"
                              >
                                <Gauge className="h-3 w-3" />
                              </span>
                            )}
                            {photoCount > 0 && (
                              <span
                                className="h-6 px-1.5 rounded bg-muted text-foreground border border-border flex items-center gap-1 font-mono font-semibold"
                                title={`${photoCount} foto(s) da vistoria técnica`}
                              >
                                <ImageIcon className="h-3 w-3" /> {photoCount}
                              </span>
                            )}
                            {!c.odometerPhotoUrl && photoCount === 0 && (
                              <span className="text-muted-foreground text-[10px]">Sem fotos</span>
                            )}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedChecklist(c);
                                setIsDetailsModalOpen(true);
                              }}
                              className="h-7 text-xs px-2.5 font-bold gap-1 border-primary/40 text-primary hover:bg-primary/10"
                              title="Visualizar Detalhes e Gerar PDF"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Ver / PDF</span>
                            </Button>

                            {hasIssue && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenWorkOrder(c)}
                                className="h-7 text-xs px-2 font-bold gap-1 border-red-500/40 text-red-400 hover:bg-red-500/10"
                                title="Gerar Ordem de Serviço Corretiva"
                              >
                                <Wrench className="h-3.5 w-3.5" />
                                <span>Criar OS</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visualização em Cards para Mobile */}
          <div className="md:hidden space-y-3">
            {filteredChecklists.map((c) => {
              const hasIssue = Boolean(c.driverProblemReport && c.driverProblemReport.trim().length > 0);
              const photoCount = c.vehiclePhotos ? c.vehiclePhotos.split(',').filter(Boolean).length : 0;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedChecklist(c);
                    setIsDetailsModalOpen(true);
                  }}
                  className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-xs active:bg-muted/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <Badge
                      variant="outline"
                      className={`font-bold text-[11px] ${
                        c.type === 'EXIT'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      }`}
                    >
                      {c.type === 'EXIT' ? 'Saída' : 'Chegada'}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(c.occurredAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-foreground block truncate">
                        {c.vehiclePlate || 'Sem placa'}
                      </span>
                      <span className="text-xs text-muted-foreground block truncate">
                        {c.driverName || 'Motorista não informado'}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-bold text-foreground block">
                        {c.kmReading != null ? `${c.kmReading.toLocaleString('pt-BR')} km` : '—'}
                      </span>
                      {c.distanceTravelled != null && c.distanceTravelled > 0 && (
                        <span className="text-[10px] text-emerald-500 font-mono font-semibold block">
                          +{c.distanceTravelled} km viagem
                        </span>
                      )}
                    </div>
                  </div>

                  {hasIssue ? (
                    <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-tight">{c.driverProblemReport}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Inspeção sem avarias</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {c.odometerPhotoUrl && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Gauge className="h-3 w-3" /> Odômetro
                        </span>
                      )}
                      {photoCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> {photoCount} foto(s)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedChecklist(c);
                          setIsDetailsModalOpen(true);
                        }}
                        className="h-8 px-2.5 text-xs font-bold text-primary border-primary/40"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Ver / PDF
                      </Button>

                      {hasIssue && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenWorkOrder(c)}
                          className="h-8 px-2 text-xs font-bold text-red-400 border-red-500/40"
                        >
                          <Wrench className="h-3.5 w-3.5 mr-1" /> OS
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Detalhes e PDF do Checklist */}
      <ChecklistDetailsModal
        checklist={selectedChecklist}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />

      {/* Modal de Abertura de Ordem de Serviço */}
      <FleetWorkOrderForm
        isOpen={isOsModalOpen}
        onClose={() => setIsOsModalOpen(false)}
        onSuccess={() => {
          setIsOsModalOpen(false);
          toast({
            title: 'Ordem de Serviço Aberta',
            description: 'A OS foi criada com sucesso a partir do checklist de motorista.',
          });
          queryClient.invalidateQueries({ queryKey: ['admin-driver-checklists'] });
        }}
        initialVehicleId={osInitialVehicleId}
        initialValues={osInitialValues}
      />
    </div>
  );
};

export default GestaoChecklistMotorista;
