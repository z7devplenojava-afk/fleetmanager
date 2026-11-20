import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Bus, 
  Truck, 
  Car, 
  Search, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  Eye, 
  QrCode, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Building2, 
  MapPin, 
  Gauge, 
  Shield, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowUpDown,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import { Vehicle } from '@/types/fleet';
import VehicleDetailPanel from '@/components/frota/VehicleDetailPanel';
import VehicleQRCodeModal from '@/components/frota/VehicleQRCodeModal';
import * as XLSX from 'xlsx';

export const OperacionalFrotaTab: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [allocationFilter, setAllocationFilter] = useState<string>('ALL');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Modais de detalhes e QR Code
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [qrModalVehicleId, setQrModalVehicleId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Query de veículos do backend com cache e revalidação inteligente
  const {
    data: vehicles = [],
    isLoading,
    isFetching,
    refetch,
    error
  } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => fleetService.getVehicles(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Atualização forçada da frota
  const handleRefresh = async () => {
    try {
      fleetService.invalidateVehiclesCache();
      const res = await refetch();
      const count = res.data?.length || 0;
      toast({
        title: 'Frota atualizada',
        description: `${count} veículo(s) sincronizado(s) com sucesso.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err?.message || 'Não foi possível sincronizar os veículos.',
        variant: 'destructive',
      });
    }
  };

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = vehicles.length;
    let active = 0;
    let maintenance = 0;
    let inactive = 0;
    let allocated = 0;

    for (const v of vehicles) {
      const st = String(v.status || '').toUpperCase();
      if (st === 'ACTIVE' || st === 'ATIVO') active++;
      else if (st === 'MAINTENANCE' || st === 'EM_MANUTENCAO' || st === 'MANUTENCAO') maintenance++;
      else inactive++;

      if (v.projectName || (v as any).clientName || (v as any).workPostName || (v as any).postoDeTrabalho) {
        allocated++;
      }
    }

    return { total, active, maintenance, inactive, allocated };
  }, [vehicles]);

  // Filtragem dos veículos
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return vehicles.filter(v => {
      // Filtro de texto
      if (term) {
        const plate = String(v.plate || '').toLowerCase();
        const fleetNum = String(v.fleetNumber || (v as any).prefixo || '').toLowerCase();
        const brand = String(v.brand || '').toLowerCase();
        const model = String(v.model || '').toLowerCase();
        const client = String((v as any).clientName || v.projectName || (v as any).workPostName || '').toLowerCase();
        const garage = String(v.garageName || '').toLowerCase();
        const renavam = String((v as any).renavam || (v as any).renavan || '').toLowerCase();
        const chassis = String(v.chassisNumber || '').toLowerCase();

        const matches = plate.includes(term) ||
          fleetNum.includes(term) ||
          brand.includes(term) ||
          model.includes(term) ||
          client.includes(term) ||
          garage.includes(term) ||
          renavam.includes(term) ||
          chassis.includes(term);

        if (!matches) return false;
      }

      // Filtro de Status
      if (statusFilter !== 'ALL') {
        const st = String(v.status || '').toUpperCase();
        if (statusFilter === 'ACTIVE' && st !== 'ACTIVE' && st !== 'ATIVO') return false;
        if (statusFilter === 'MAINTENANCE' && st !== 'MAINTENANCE' && st !== 'EM_MANUTENCAO' && st !== 'MANUTENCAO') return false;
        if (statusFilter === 'INACTIVE' && st !== 'INACTIVE' && st !== 'INATIVO' && st !== 'BLOCKED' && st !== 'BAIXADO') return false;
      }

      // Filtro de Tipo de Veículo
      if (typeFilter !== 'ALL') {
        const vType = String(v.vehicleType || '').toUpperCase();
        const busType = String((v as any).busType || '').toUpperCase();
        if (typeFilter === 'BUS' && !vType.includes('BUS') && !busType) return false;
        if (typeFilter === 'TRUCK' && !vType.includes('TRUCK')) return false;
        if (typeFilter === 'VAN' && !vType.includes('VAN') && !vType.includes('MINIBUS')) return false;
        if (typeFilter === 'CAR' && !vType.includes('CAR') && !vType.includes('PICKUP') && !vType.includes('SUV')) return false;
      }

      // Filtro de Alocação
      if (allocationFilter !== 'ALL') {
        const hasAllocation = Boolean(v.projectName || (v as any).clientName || (v as any).workPostName || (v as any).postoDeTrabalho);
        if (allocationFilter === 'ALLOCATED' && !hasAllocation) return false;
        if (allocationFilter === 'AVAILABLE' && hasAllocation) return false;
      }

      return true;
    });
  }, [vehicles, searchTerm, statusFilter, typeFilter, allocationFilter]);

  // Paginação dos dados filtrados
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage) || 1;
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVehicles.slice(start, start + itemsPerPage);
  }, [filteredVehicles, currentPage, itemsPerPage]);

  // Resetar página quando os filtros mudam
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  // Abrir modal de detalhes
  const handleOpenDetail = useCallback((vehicle: Vehicle) => {
    const mapped = {
      ...vehicle,
      id: String(vehicle.id),
      placa: vehicle.plate,
      plate: vehicle.plate,
      prefixo: vehicle.fleetNumber || (vehicle as any).prefixo || '',
      fleetNumber: vehicle.fleetNumber || (vehicle as any).prefixo || '',
      marca: vehicle.brand,
      brand: vehicle.brand,
      modelo: vehicle.model,
      model: vehicle.model,
      ano: vehicle.year,
      year: vehicle.year,
      cor: vehicle.color,
      color: vehicle.color,
      combustivel: vehicle.fuelType,
      fuelType: vehicle.fuelType,
      quilometragem: vehicle.currentMileage,
      currentMileage: vehicle.currentMileage,
      status: vehicle.status,
      vehicleType: vehicle.vehicleType,
      garageName: vehicle.garageName,
      location: (vehicle as any).location || (vehicle as any).workPostName || vehicle.projectName || '',
      workPostName: (vehicle as any).workPostName || vehicle.projectName || '',
      clientName: (vehicle as any).clientName || vehicle.projectName || ''
    };
    setSelectedVehicle(mapped);
    setIsDetailOpen(true);
  }, []);

  // Abrir modal de QR Code
  const handleOpenQrCode = useCallback((vehicleId: string) => {
    setQrModalVehicleId(vehicleId);
    setIsQrModalOpen(true);
  }, []);

  // Exportar lista filtrada para Excel
  const handleExportExcel = () => {
    try {
      if (filteredVehicles.length === 0) {
        toast({
          title: 'Nenhum veículo',
          description: 'Não há dados para exportar com os filtros atuais.',
          variant: 'destructive',
        });
        return;
      }

      const rows = filteredVehicles.map(v => ({
        'Frota': v.fleetNumber || (v as any).prefixo || '-',
        'Placa': v.plate,
        'Marca': v.brand,
        'Modelo': v.model,
        'Ano': v.year,
        'Combustível': v.fuelType || '-',
        'Km Atual': v.currentMileage != null ? v.currentMileage : 0,
        'Status': formatStatusLabel(v.status),
        'Tipo': formatVehicleType(v.vehicleType, (v as any).busType),
        'Capacidade': v.capacity || (v as any).passengerCapacity || '-',
        'Cliente / Posto': (v as any).clientName || v.projectName || (v as any).workPostName || 'Disponível / Garagem',
        'Garagem': v.garageName || '-',
        'Chassi': v.chassisNumber || '-',
        'Renavam': (v as any).renavam || (v as any).renavan || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Frota');
      XLSX.writeFile(workbook, `Frota_Operacional_${new Date().toISOString().slice(0, 10)}.xlsx`);

      toast({
        title: 'Exportação Concluída',
        description: `${rows.length} veículo(s) exportado(s) para Excel.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao exportar',
        description: err?.message || 'Falha na geração do arquivo Excel.',
        variant: 'destructive',
      });
    }
  };

  // Helpers de Formatação
  function formatStatusLabel(status?: string): string {
    const st = String(status || '').toUpperCase();
    switch (st) {
      case 'ACTIVE':
      case 'ATIVO':
        return 'Ativo';
      case 'MAINTENANCE':
      case 'EM_MANUTENCAO':
      case 'MANUTENCAO':
        return 'Em Manutenção';
      case 'INACTIVE':
      case 'INATIVO':
        return 'Inativo';
      case 'LEASED':
      case 'LOCADO':
        return 'Locado';
      case 'RESERVED':
      case 'RESERVA':
        return 'Reserva';
      case 'BLOCKED':
        return 'Bloqueado';
      case 'BAIXADO':
      case 'SOLD':
        return 'Baixado';
      default:
        return status || 'Desconhecido';
    }
  }

  function renderStatusBadge(status?: string) {
    const st = String(status || '').toUpperCase();
    if (st === 'ACTIVE' || st === 'ATIVO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Ativo
        </span>
      );
    }
    if (st === 'MAINTENANCE' || st === 'EM_MANUTENCAO' || st === 'MANUTENCAO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Wrench className="w-3 h-3" />
          Manutenção
        </span>
      );
    }
    if (st === 'LEASED' || st === 'LOCADO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          Locado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
        {formatStatusLabel(status)}
      </span>
    );
  }

  function formatVehicleType(type?: string, busType?: string): string {
    if (busType) {
      if (busType.includes('RODOVIARIO')) return 'Ônibus Rodoviário';
      if (busType.includes('URBANO')) return 'Ônibus Urbano';
      if (busType.includes('MICRO')) return 'Micro-ônibus';
      return `Ônibus (${busType})`;
    }
    const t = String(type || '').toUpperCase();
    if (t.includes('BUS_ROAD')) return 'Ônibus Rodoviário';
    if (t.includes('BUS_URBAN')) return 'Ônibus Urbano';
    if (t.includes('MINIBUS')) return 'Micro-ônibus';
    if (t.includes('VAN')) return 'Van';
    if (t.includes('TRUCK')) return 'Caminhão';
    if (t.includes('CAR')) return 'Automóvel';
    if (t.includes('PICKUP')) return 'Pick-up';
    return type || 'Veículo';
  }

  function getVehicleIcon(type?: string, busType?: string) {
    const t = String(type || '').toUpperCase();
    if (t.includes('TRUCK')) {
      return <Truck className="w-5 h-5 text-amber-400" />;
    }
    if (t.includes('CAR') || t.includes('PICKUP') || t.includes('SUV')) {
      return <Car className="w-5 h-5 text-sky-400" />;
    }
    return <Bus className="w-5 h-5 text-red-500" />;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com cards de estatísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Total Frota */}
        <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total da Frota</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Veículos cadastrados</p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Bus className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Em Operação */}
        <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-400">Em Operação</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Status ativo</p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Em Manutenção */}
        <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-400">Em Manutenção</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.maintenance}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Preventiva / Corretiva</p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wrench className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Alocados em Clientes/Postos */}
        <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-sky-400">Alocados / Linhas</p>
              <h3 className="text-2xl font-bold text-sky-400 mt-1">{stats.allocated}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Com posto ou obra</p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Inativos / Reserva */}
        <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Reserva / Inativos</p>
              <h3 className="text-2xl font-bold text-slate-300 mt-1">{stats.inactive}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Disponíveis / Reserva</p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Ações */}
      <Card className="bg-slate-900/80 border-slate-800 shadow-md">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Input de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por placa, prefixo, modelo, marca, obra, cliente ou chassi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-9 bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Ações da Direita */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <Download className="h-4 w-4 mr-1.5 text-emerald-400" />
                Exportar Excel
              </Button>

              <Button
                size="sm"
                onClick={() => navigate('/frota')}
                className="bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/30"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Módulo Frota Completo
              </Button>
            </div>
          </div>

          {/* Filtros em linha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Status:</span>
              <Select value={statusFilter} onValueChange={(val) => handleFilterChange(setStatusFilter, val)}>
                <SelectTrigger className="bg-slate-950/60 border-slate-700 text-slate-200 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  <SelectItem value="ACTIVE">Ativos em Operação</SelectItem>
                  <SelectItem value="MAINTENANCE">Em Manutenção</SelectItem>
                  <SelectItem value="INACTIVE">Inativos / Reserva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Tipo:</span>
              <Select value={typeFilter} onValueChange={(val) => handleFilterChange(setTypeFilter, val)}>
                <SelectTrigger className="bg-slate-950/60 border-slate-700 text-slate-200 h-9">
                  <SelectValue placeholder="Tipo de Veículo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  <SelectItem value="BUS">Ônibus (Urbano / Rodoviário)</SelectItem>
                  <SelectItem value="VAN">Vans e Micro-ônibus</SelectItem>
                  <SelectItem value="TRUCK">Caminhões</SelectItem>
                  <SelectItem value="CAR">Carros e Utilitários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alocação */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Alocação:</span>
              <Select value={allocationFilter} onValueChange={(val) => handleFilterChange(setAllocationFilter, val)}>
                <SelectTrigger className="bg-slate-950/60 border-slate-700 text-slate-200 h-9">
                  <SelectValue placeholder="Alocação" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <SelectItem value="ALL">Todas as Alocações</SelectItem>
                  <SelectItem value="ALLOCATED">Alocados (com Posto / Obra)</SelectItem>
                  <SelectItem value="AVAILABLE">Disponíveis / Em Garagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Veículos */}
      <Card className="bg-slate-900/80 border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/80 border-b border-slate-800">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="text-slate-300 font-semibold w-[220px]">Veículo & Placa</TableHead>
                <TableHead className="text-slate-300 font-semibold w-[120px]">Frota</TableHead>
                <TableHead className="text-slate-300 font-semibold min-w-[200px]">Marca / Modelo</TableHead>
                <TableHead className="text-slate-300 font-semibold w-[150px]">Tipo / Cap.</TableHead>
                <TableHead className="text-slate-300 font-semibold w-[130px]">Odômetro (KM)</TableHead>
                <TableHead className="text-slate-300 font-semibold min-w-[220px]">Alocação Operacional</TableHead>
                <TableHead className="text-slate-300 font-semibold w-[140px] text-center">Status</TableHead>
                <TableHead className="text-slate-300 font-semibold w-[140px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeletons de carregamento
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx} className="border-slate-800/60">
                    <TableCell><div className="h-10 bg-slate-800/60 rounded animate-pulse w-32" /></TableCell>
                      <TableCell><div className="h-6 bg-slate-800/60 rounded animate-pulse w-16" /></TableCell>
                    <TableCell><div className="h-10 bg-slate-800/60 rounded animate-pulse w-44" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800/60 rounded animate-pulse w-24" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800/60 rounded animate-pulse w-20" /></TableCell>
                    <TableCell><div className="h-8 bg-slate-800/60 rounded animate-pulse w-36" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800/60 rounded animate-pulse w-20 mx-auto" /></TableCell>
                    <TableCell><div className="h-8 bg-slate-800/60 rounded animate-pulse w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="p-4 rounded-full bg-slate-800/80 mb-3 border border-slate-700">
                        <Bus className="h-10 w-10 text-slate-500" />
                      </div>
                      <p className="text-base font-semibold text-slate-200">Nenhum veículo encontrado</p>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || allocationFilter !== 'ALL'
                          ? 'Tente ajustar os filtros ou os termos da busca.'
                          : 'A frota ainda não possui veículos cadastrados no sistema.'}
                      </p>
                      {(searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || allocationFilter !== 'ALL') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                            setTypeFilter('ALL');
                            setAllocationFilter('ALL');
                          }}
                          className="mt-4 border-slate-700 text-slate-300"
                        >
                          Limpar Filtros
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVehicles.map((vehicle) => {
                  const prefixo = vehicle.fleetNumber || (vehicle as any).prefixo;
                  const allocation = (vehicle as any).clientName || vehicle.projectName || (vehicle as any).workPostName || (vehicle as any).postoDeTrabalho;
                  const garage = vehicle.garageName;

                  return (
                    <TableRow 
                      key={vehicle.id} 
                      className="border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetail(vehicle)}
                    >
                      {/* Veículo & Placa */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:border-red-500/50 transition-colors">
                            {getVehicleIcon(vehicle.vehicleType, (vehicle as any).busType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-white tracking-wider">
                                {vehicle.plate}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {vehicle.color || 'Cor não inf.'} • {vehicle.year || '-'}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Número interno da frota */}
                      <TableCell>
                        {prefixo ? (
                          <span className="inline-flex rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-xs font-semibold text-amber-300">
                            {prefixo}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Não informado</span>
                        )}
                      </TableCell>

                      {/* Marca / Modelo */}
                      <TableCell>
                        <div className="font-medium text-slate-200 text-sm">
                          {vehicle.brand} {vehicle.model}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{vehicle.fuelType || 'DIESEL'}</span>
                          {vehicle.chassisNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]" title={vehicle.chassisNumber}>
                                Chassi: {vehicle.chassisNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>

                      {/* Tipo / Capacidade */}
                      <TableCell>
                        <div className="text-xs text-slate-300 font-medium">
                          {formatVehicleType(vehicle.vehicleType, (vehicle as any).busType)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {vehicle.capacity ? `${vehicle.capacity} passageiros` : '-'}
                        </div>
                      </TableCell>

                      {/* Km Atual */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          {vehicle.currentMileage != null 
                            ? `${vehicle.currentMileage.toLocaleString('pt-BR')} km`
                            : '0 km'}
                        </div>
                      </TableCell>

                      {/* Alocação Operacional */}
                      <TableCell>
                        {allocation ? (
                          <div className="flex items-start gap-1.5">
                            <Building2 className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-sky-300 line-clamp-1">{allocation}</p>
                              {garage && (
                                <p className="text-[11px] text-slate-400 line-clamp-1">Garagem: {garage}</p>
                              )}
                            </div>
                          </div>
                        ) : garage ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>Garagem: {garage}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Disponível em pátio</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {renderStatusBadge(vehicle.status)}
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDetail(vehicle)}
                            title="Ver detalhes do veículo"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenQrCode(String(vehicle.id))}
                            title="Gerar / Imprimir QR Code"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/frota')}
                            title="Abrir no Módulo Frota"
                            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {!isLoading && filteredVehicles.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                Mostrando{' '}
                <strong className="text-white">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredVehicles.length)}
                </strong>{' '}
                a{' '}
                <strong className="text-white">
                  {Math.min(currentPage * itemsPerPage, filteredVehicles.length)}
                </strong>{' '}
                de <strong className="text-white">{filteredVehicles.length}</strong> veículos
              </span>

              <span className="hidden sm:inline text-slate-600">|</span>

              <div className="hidden sm:flex items-center gap-1.5">
                <span>Por página:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <span className="px-2 font-medium text-slate-200">
                Página {currentPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="h-8 px-2.5 border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Painel Modal de Detalhes do Veículo */}
      {selectedVehicle && (
        <VehicleDetailPanel
          veiculo={selectedVehicle}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedVehicle(null);
          }}
          onEdit={() => {
            navigate('/frota');
          }}
        />
      )}

      {/* Modal de QR Code do Veículo */}
      {qrModalVehicleId && (
        <VehicleQRCodeModal
          vehicleId={qrModalVehicleId}
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false);
            setQrModalVehicleId(null);
          }}
        />
      )}
    </div>
  );
};
