import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Edit,
  Trash2,
  Search,
  Plus,
  RefreshCw,
  Clock,
  User,
  Building,
  Sun,
  Moon,
  FileText,
  Calendar as CalendarIcon,
  X,
  Bus,
  Route as RouteIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Gauge,
  Camera,
  Users,
  Eye,
  MapPin,
  LayoutList
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Schedule, scheduleService } from '@/services/scheduleService';
import { DriverActivityInspectorModal } from '@/components/driver/DriverActivityInspectorModal';
import ScheduleCalendarTab from '@/components/fretamento/ScheduleCalendarTab';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface EscalaTrabalhoTableProps {
  escalas: Schedule[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (escala: Schedule) => void;
  onDelete: (escala: Schedule) => void;
  onCreate: () => void;
}

const EscalaTrabalhoTable: React.FC<EscalaTrabalhoTableProps> = ({
  escalas,
  isLoading,
  onRefresh,
  onEdit,
  onDelete,
  onCreate
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedEscalaForPhotos, setSelectedEscalaForPhotos] = useState<Schedule | null>(null);
  const [inspectedDriver, setInspectedDriver] = useState<{ id?: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  // PDF Filters
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    const handleRealtimeDriverUpdate = () => {
      onRefresh();
    };
    window.addEventListener('fluxbus:driver-records-updated', handleRealtimeDriverUpdate);
    window.addEventListener('storage', handleRealtimeDriverUpdate);
    return () => {
      window.removeEventListener('fluxbus:driver-records-updated', handleRealtimeDriverUpdate);
      window.removeEventListener('storage', handleRealtimeDriverUpdate);
    };
  }, [onRefresh]);

  const getStatusProps = (status: Schedule['status']) => {
    switch (status) {
      case 'PENDING':
        return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', text: 'Pendente' };
      case 'CONFIRMED':
        return { color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', text: 'Confirmada' };
      case 'IN_PROGRESS':
        return { color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', text: 'Em Andamento' };
      case 'COMPLETED':
        return { color: 'bg-green-500/20 text-green-400 border-green-500/40', text: 'Concluída' };
      case 'CANCELLED':
        return { color: 'bg-red-500/20 text-red-400 border-red-500/40', text: 'Cancelada' };
      default:
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/40', text: status || 'Desconhecido' };
    }
  };

  const getShiftProps = (shift: Schedule['shift']) => {
    switch (shift) {
      case 'DAY':
        return { icon: <Sun className="h-3.5 w-3.5 text-yellow-400" />, text: 'Diurno' };
      case 'NIGHT':
        return { icon: <Moon className="h-3.5 w-3.5 text-blue-400" />, text: 'Noturno' };
      case 'MIXED':
        return { icon: <Clock className="h-3.5 w-3.5 text-gray-400" />, text: 'Misto' };
      default:
        return { icon: null, text: shift };
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const clean = dateString.substring(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : format(date, 'dd/MM/yyyy');
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleApprovePoint = async (escala: Schedule, approved: boolean) => {
    setApprovingId(escala.id);
    try {
      await scheduleService.approvePoint(escala.id, {
        approved,
        approvedBy: user?.name || user?.email || 'Gestor / Encarregado de Tráfego'
      });

      toast({
        title: approved ? 'Ponto Aprovado pelo Tráfego!' : 'Ponto Rejeitado',
        description: approved
          ? `O registro de ponto de ${escala.employee?.name || 'motorista'} foi aprovado. Status mudou para Em Andamento e o horário foi liberado.`
          : `A justificativa de ponto de ${escala.employee?.name || 'motorista'} foi rejeitada.`,
        variant: approved ? 'default' : 'destructive'
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Erro ao processar aprovação de ponto',
        description: error?.message || 'Não foi possível concluir a operação.',
        variant: 'destructive'
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      toast({
        title: 'Gerando relatório...',
        description: 'Por favor, aguarde enquanto o PDF é gerado.',
      });

      const filters: any = {};

      if (statusFilter && statusFilter !== 'all' && statusFilter !== 'PENDING_POINT') {
        filters.status = statusFilter;
      }

      if (dateRange.from) {
        filters.startDate = format(dateRange.from, 'yyyy-MM-dd');
      }
      if (dateRange.to) {
        filters.endDate = format(dateRange.to, 'yyyy-MM-dd');
      }

      const blob = await scheduleService.generatePDFReport(filters);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-escalas-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Relatório gerado!',
        description: 'O PDF foi baixado com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao gerar relatório PDF:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: error.message || 'Não foi possível gerar o relatório PDF.',
        variant: 'destructive',
      });
    }
  };

  const safeEscalas = Array.isArray(escalas) ? escalas : [];
  const pendingApprovalCount = safeEscalas.filter(
    (e) => e.pointStatus === 'PENDING_TRAFFIC_APPROVAL'
  ).length;

  const filteredEscalas = safeEscalas.filter((escala) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      (escala.employee?.name?.toLowerCase() || '').includes(q) ||
      (escala.vehicle?.plate?.toLowerCase() || '').includes(q) ||
      (escala.vehicle?.model?.toLowerCase() || '').includes(q) ||
      (escala.route?.name?.toLowerCase() || '').includes(q) ||
      (escala.travelTrip?.name?.toLowerCase() || '').includes(q) ||
      (escala.location?.name?.toLowerCase() || '').includes(q) ||
      (escala.workPost?.name?.toLowerCase() || '').includes(q) ||
      (escala.workPost?.postCode?.toLowerCase() || '').includes(q) ||
      (escala.workPost?.client?.name?.toLowerCase() || '').includes(q);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'PENDING_POINT'
        ? escala.pointStatus === 'PENDING_TRAFFIC_APPROVAL'
        : escala.status === statusFilter;

    let matchesDate = true;
    if (dateRange.from && escala.scheduleDate) {
      const scheduleDate = new Date(escala.scheduleDate);
      matchesDate = scheduleDate >= dateRange.from;
      if (matchesDate && dateRange.to) {
        const toDateEndOfDay = new Date(dateRange.to);
        toDateEndOfDay.setHours(23, 59, 59, 999);
        matchesDate = scheduleDate <= toDateEndOfDay;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleRefresh = async () => {
    try {
      await onRefresh();
      toast({
        title: 'Sucesso!',
        description: 'Lista de escalas atualizada.',
      });
    } catch {
      toast({
        title: 'Erro!',
        description: 'Erro ao atualizar lista de escalas.',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({});
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin mb-4" />
        <p className="text-seguranca-lightgray">Carregando escalas...</p>
      </div>
    );
  }

  if (!isLoading && safeEscalas.length === 0) {
    return (
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Nenhuma escala encontrada
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Ainda não há escalas de trabalho para exibir.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={onRefresh}
                variant="outline"
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={onCreate}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Nova Escala
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner de Aprovação de Ponto Pendente (Gestor / Encarregado de Tráfego) */}
      {pendingApprovalCount > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-200">
                {pendingApprovalCount} registro(s) de ponto fora da tolerância aguardando aprovação do Gestor / Encarregado de Tráfego
              </p>
              <p className="text-xs text-amber-300/80">
                O motorista enviou o motivo do não registro no horário. O status e o horário oficial só são exibidos após sua aprovação.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setStatusFilter(statusFilter === 'PENDING_POINT' ? 'all' : 'PENDING_POINT')
            }
            className="border-amber-500/50 text-amber-200 hover:bg-amber-500/20 shrink-0"
          >
            {statusFilter === 'PENDING_POINT' ? 'Mostrar Todas' : 'Filtrar Pendentes de Ponto'}
          </Button>
        </div>
      )}

      {/* Filtros Avançados */}
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardContent className="py-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar por motorista, placa do veículo, rota, cliente, posto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-seguranca-red"
              />
            </div>

            <div className="w-full md:w-48">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-seguranca-black border-gray-600 text-seguranca-lightgray',
                      !dateRange.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                          {format(dateRange.to, 'dd/MM/yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      <span>Período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-seguranca-graphite border-gray-600" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range: any) => setDateRange(range || {})}
                    numberOfMonths={2}
                    className="text-seguranca-lightgray"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full md:w-52">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray focus:ring-seguranca-red w-full h-10 text-sm"
              >
                <option value="all">Status: Todos</option>
                <option value="PENDING_POINT">⚠️ Ponto Aguardando Aprovação</option>
                <option value="PENDING">Pendente</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="COMPLETED">Concluída</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="text-gray-400 hover:text-white"
              title="Limpar Filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-400">
                {filteredEscalas.length} escala(s) encontrada(s)
              </div>
              <div className="inline-flex rounded-lg bg-seguranca-black p-1 border border-gray-700">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'table'
                      ? 'bg-seguranca-yellow text-seguranca-black'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-seguranca-yellow text-seguranca-black'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Calendário de Escala
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGeneratePDF}
                className="bg-seguranca-yellow hover:bg-yellow-600 text-seguranca-black border-none"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                onClick={onCreate}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                <Plus size={18} className="mr-2" />
                Nova Escala
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'calendar' ? (
        <ScheduleCalendarTab schedulesProp={filteredEscalas} onRefresh={onRefresh} />
      ) : (
      /* Tabela de Escalas */
      <div className="rounded-md border border-gray-700 bg-seguranca-graphite overflow-x-auto">
        <Table>
          <TableHeader className="bg-seguranca-black">
            <TableRow className="border-b-gray-700 hover:bg-transparent">
              <TableHead className="text-gray-400 font-semibold">Motorista (Funcionário)</TableHead>
              <TableHead className="text-gray-400 font-semibold">Veículo & Rota</TableHead>
              <TableHead className="text-gray-400 font-semibold">Cliente / Posto</TableHead>
              <TableHead className="text-gray-400 font-semibold">Data & Horário</TableHead>
              <TableHead className="text-gray-400 font-semibold">Ponto Eletrônico & KM</TableHead>
              <TableHead className="text-gray-400 font-semibold">Status</TableHead>
              <TableHead className="text-gray-400 text-right font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEscalas.map((escala) => {
              const status = getStatusProps(escala.status);
              const shift = getShiftProps(escala.shift);
              const isPendingPoint = escala.pointStatus === 'PENDING_TRAFFIC_APPROVAL';
              const isPointApproved = escala.pointStatus === 'APPROVED';
              const isPointRejected = escala.pointStatus === 'REJECTED';

              let photosCount = 0;
              if (escala.tripPhotosJson) {
                try {
                  const parsed = JSON.parse(escala.tripPhotosJson);
                  if (Array.isArray(parsed)) photosCount = parsed.length;
                } catch {
                  photosCount = 0;
                }
              }

              return (
                <TableRow
                  key={escala.id}
                  className={cn(
                    'border-b-gray-700 hover:bg-seguranca-black/50 transition-colors',
                    isPendingPoint && 'bg-amber-950/20'
                  )}
                >
                  {/* Motorista (Clicável pelo Gestor de Tráfego / Encarregado para abrir Dossiê Completo + Mapa de Trajeto + Fotos) */}
                  <TableCell>
                    <button
                      type="button"
                      onClick={() =>
                        setInspectedDriver({
                          id: escala.employeeId || escala.employee?.id,
                          name: escala.employee?.name || 'Motorista',
                        })
                      }
                      title="Clique no nome do motorista para ver todas as atividades, fotos, endereços GPS e mapa do trajeto (Ida/Retorno)"
                      className="flex items-center space-x-3 text-left group hover:bg-seguranca-yellow/10 p-1.5 -m-1.5 rounded-lg transition-colors"
                    >
                      <div className="w-9 h-9 bg-seguranca-red/20 group-hover:bg-seguranca-yellow/25 rounded-full flex items-center justify-center border border-seguranca-red/30 group-hover:border-seguranca-yellow shrink-0 transition-colors">
                        <User className="text-seguranca-red group-hover:text-seguranca-yellow" size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-seguranca-lightgray group-hover:text-seguranca-yellow underline decoration-dotted underline-offset-4">
                          {escala.employee?.name || '-'}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" /> Ver atividades, fotos & trajeto
                        </span>
                      </div>
                    </button>
                  </TableCell>

                  {/* Veículo & Rota */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-200 font-medium">
                        <Bus className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {escala.vehicle?.plate || escala.vehiclePlate
                            ? `${escala.vehicle?.plate || escala.vehiclePlate}${escala.vehicle?.model ? ` • ${escala.vehicle.model}` : ''}`
                            : 'Veículo não vinculado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-blue-300">
                        <RouteIcon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span>
                          {escala.routeCode || escala.route?.name || escala.travelTrip?.name || 'Rota não informada'}
                        </span>
                      </div>
                      {escala.passengersCount != null && (
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-300">
                          <Users className="h-3 w-3 text-purple-400 shrink-0" />
                          <span>Passageiros: {escala.passengersCount}</span>
                        </div>
                      )}
                      {escala.startAddress && (
                        <div className="text-[10px] text-emerald-300 truncate max-w-[230px]" title={escala.startAddress}>
                          📍 Ini: {escala.startAddress}
                        </div>
                      )}
                      {escala.endAddress && (
                        <div className="text-[10px] text-amber-300 truncate max-w-[230px]" title={escala.endAddress}>
                          🏁 Fim: {escala.endAddress}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Cliente / Posto */}
                  <TableCell>
                    <div className="flex items-start space-x-2">
                      <Building className="text-blue-400 mt-0.5 shrink-0" size={15} />
                      <div className="flex flex-col">
                        <span className="text-gray-300 text-xs font-medium">
                          {escala.clientName || escala.workPost?.client?.name || escala.location?.name || '-'}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {escala.workPost?.name || ''}
                          {escala.workPost?.postCode ? ` (${escala.workPost.postCode})` : ''}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Data & Horário */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-200 font-mono text-xs font-semibold">
                        {formatDate(escala.scheduleDate)}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        <span>
                          {escala.startTime || '--:--'}
                          {escala.endTime ? ` às ${escala.endTime}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        {shift.icon}
                        <span>{shift.text}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Ponto Eletrônico & KM (Com Aprovação do Gestor / Encarregado de Tráfego) */}
                  <TableCell className="max-w-xs">
                    {isPendingPoint ? (
                      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>Aguardando Aprovação do Tráfego</span>
                        </div>
                        {escala.pointJustification && (
                          <p className="text-[11px] text-gray-200 bg-black/40 p-1.5 rounded border border-gray-700">
                            <span className="text-gray-400 font-medium">Motivo do motorista: </span>
                            {escala.pointJustification}
                          </p>
                        )}
                        {escala.initialKm != null && (
                          <div className="text-[11px] text-gray-300 flex items-center gap-1">
                            <Gauge className="h-3 w-3 text-blue-400" />
                            <span>
                              KM: {escala.initialKm} km → {escala.finalKm != null ? `${escala.finalKm} km` : 'em curso'}
                            </span>
                          </div>
                        )}
                        {photosCount > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEscalaForPhotos(escala)}
                            className="h-7 px-2 text-[11px] border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 w-full justify-center"
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Ver Fotos no Ônibus ({photosCount})
                          </Button>
                        )}
                        <div className="flex items-center gap-1.5 pt-1">
                          <Button
                            size="sm"
                            disabled={approvingId === escala.id}
                            onClick={() => handleApprovePoint(escala, true)}
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Aprovar Ponto
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approvingId === escala.id}
                            onClick={() => handleApprovePoint(escala, false)}
                            className="h-7 px-2 text-xs border-red-500/50 text-red-300 hover:bg-red-500/20"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ) : isPointApproved ? (
                      <div className="space-y-1 text-xs">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ponto: {formatDateTime(escala.pointRegisteredAt) || escala.startTime}
                        </Badge>
                        {escala.pointApprovedBy && (
                          <div className="text-[10px] text-gray-400">
                            Aprovado por: {escala.pointApprovedBy}
                          </div>
                        )}
                        <div className="text-[11px] text-gray-300 flex items-center gap-2 pt-0.5">
                          <Gauge className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          <span>
                            KM: {escala.initialKm ?? '-'} → {escala.finalKm ?? 'em curso'}
                          </span>
                        </div>
                        {photosCount > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEscalaForPhotos(escala)}
                            className="h-6 px-2 text-[11px] border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 mt-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Fotos no Ônibus ({photosCount})
                          </Button>
                        )}
                      </div>
                    ) : isPointRejected ? (
                      <div className="space-y-1 text-xs">
                        <Badge className="bg-red-500/20 text-red-300 border border-red-500/40 text-[11px]">
                          Ponto Rejeitado pelo Tráfego
                        </Badge>
                        {escala.pointJustification && (
                          <div className="text-[11px] text-gray-400">
                            Motivo: {escala.pointJustification}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Ainda não registrado</span>
                    )}
                  </TableCell>

                  {/* Status Oficial (só muda para Em Andamento quando ponto está aprovado) */}
                  <TableCell>
                    {isPendingPoint ? (
                      <div className="flex flex-col gap-1">
                        <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 w-fit">
                          Aguardando Gestor
                        </Badge>
                        <span className="text-[10px] text-gray-400">
                          Horário oculto até aprovação
                        </span>
                      </div>
                    ) : (
                      <Badge className={`${status.color} border`}>{status.text}</Badge>
                    )}
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(escala);
                        }}
                        className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                        title="Editar Escala"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(escala);
                        }}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        title="Excluir Escala"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      )}

      {/* Modal de Verificação do Gestor de Tráfego: Fotos do Motorista no Ônibus + Dados do Ponto */}
      <Dialog
        open={Boolean(selectedEscalaForPhotos)}
        onOpenChange={(open) => !open && setSelectedEscalaForPhotos(null)}
      >
        <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-seguranca-yellow">
              <Camera className="h-5 w-5" />
              Verificação do Gestor de Tráfego • Registro de Ponto e Fotos no Ônibus
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Confira os dados informados pelo motorista no Ponto Eletrônico e as fotos tiradas na câmera do celular dentro do veículo.
            </DialogDescription>
          </DialogHeader>

          {selectedEscalaForPhotos && (() => {
            let photosList: string[] = [];
            if (selectedEscalaForPhotos.tripPhotosJson) {
              try {
                const parsed = JSON.parse(selectedEscalaForPhotos.tripPhotosJson);
                if (Array.isArray(parsed)) photosList = parsed;
              } catch {
                photosList = [];
              }
            }
            return (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/50 border border-gray-800 text-xs">
                  <div>
                    <span className="text-gray-400 block">Motorista</span>
                    <span className="font-bold text-white">{selectedEscalaForPhotos.employee?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Veículo</span>
                    <span className="font-bold text-emerald-400">
                      {selectedEscalaForPhotos.vehicle?.plate || selectedEscalaForPhotos.vehiclePlate || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Cliente / Empresa</span>
                    <span className="font-bold text-white">
                      {selectedEscalaForPhotos.clientName ||
                        selectedEscalaForPhotos.workPost?.client?.name ||
                        selectedEscalaForPhotos.location?.name ||
                        '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Percurso</span>
                    <span className="font-bold text-blue-300">
                      {selectedEscalaForPhotos.routeCode ||
                        selectedEscalaForPhotos.route?.name ||
                        selectedEscalaForPhotos.travelTrip?.name ||
                        '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Horário Inicial / Final</span>
                    <span className="font-bold text-amber-300">
                      {selectedEscalaForPhotos.startTime || '--:--'} às {selectedEscalaForPhotos.endTime || 'em curso'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">KM Inicial → KM Final / Passag.</span>
                    <span className="font-bold text-white">
                      {selectedEscalaForPhotos.initialKm ?? '-'} → {selectedEscalaForPhotos.finalKm ?? 'em curso'} km •{' '}
                      {selectedEscalaForPhotos.passengersCount ?? 0} passag.
                    </span>
                  </div>
                </div>

                {selectedEscalaForPhotos.pointJustification && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                    <strong>Motivo / Justificativa do Motorista:</strong> {selectedEscalaForPhotos.pointJustification}
                  </div>
                )}

                {photosList.length === 0 ? (
                  <p className="text-center text-gray-400 py-6 text-sm">
                    Nenhuma foto anexada neste registro.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {photosList.map((src, index) => (
                      <div
                        key={index}
                        className="rounded-xl overflow-hidden border border-gray-700 bg-black flex flex-col"
                      >
                        <img
                          src={src}
                          alt={`Foto do motorista no ônibus ${index + 1}`}
                          className="w-full h-56 object-cover"
                        />
                        <div className="px-3 py-1.5 text-[11px] text-gray-300 bg-gray-900 flex justify-between">
                          <span>Foto #{index + 1} (Câmera Móvel)</span>
                          <a
                            href={src}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline"
                          >
                            Ampliar
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedEscalaForPhotos.pointStatus === 'PENDING_TRAFFIC_APPROVAL' && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleApprovePoint(selectedEscalaForPhotos, false);
                        setSelectedEscalaForPhotos(null);
                      }}
                      className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Rejeitar Ponto
                    </Button>
                    <Button
                      onClick={() => {
                        handleApprovePoint(selectedEscalaForPhotos, true);
                        setSelectedEscalaForPhotos(null);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Aprovar Ponto e Liberar Horário
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dossiê Completo por Motorista (Ao clicar no nome do motorista: Atividades, Fotos, Informações e Mapa de Trajeto Ida/Retorno) */}
      <DriverActivityInspectorModal
        isOpen={Boolean(inspectedDriver)}
        onClose={() => setInspectedDriver(null)}
        driverId={inspectedDriver?.id}
        driverName={inspectedDriver?.name || ''}
        initialSchedules={safeEscalas.filter(
          (e) =>
            (inspectedDriver?.id && (e.employeeId === inspectedDriver.id || e.employee?.id === inspectedDriver.id)) ||
            (inspectedDriver?.name &&
              (e.employee?.name || '').trim().toLowerCase() === inspectedDriver.name.trim().toLowerCase())
        )}
        onScheduleUpdated={onRefresh}
      />
    </div>
  );
};

export default EscalaTrabalhoTable;
