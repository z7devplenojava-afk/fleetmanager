import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Fuel,
  Droplets,
  DollarSign,
  Calendar,
  Building2,
  Gauge,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Car,
  User,
  Hash,
  X,
  FileText
} from 'lucide-react';
import { FuelRecord, Vehicle } from '@/types/fleet';
import { format } from 'date-fns';
import AbastecimentoInternoFormModal from './AbastecimentoInternoFormModal';
import AbastecimentoEditModal from './AbastecimentoEditModal';
import AbastecimentoDeleteDialog from './AbastecimentoDeleteDialog';

interface AbastecimentoInternoTabProps {
  fuelRecords: FuelRecord[];
  vehicles: Vehicle[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AbastecimentoInternoTab: React.FC<AbastecimentoInternoTabProps> = ({
  fuelRecords,
  vehicles,
  onRefresh,
  isLoading = false,
}) => {
  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<FuelRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<FuelRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filtrar apenas abastecimentos internos (bombas/tanques da garagem ou identificados como internos)
  const internalRecords = useMemo(() => {
    return fuelRecords.filter((r) => {
      const anyR = r as any;
      // Critérios para interno:
      // 1. Possui pumpId, tankId ou garageId
      // 2. Campo isInternal === true ou type === 'INTERNAL'
      // 3. Station/Posto indica Garagem, Base, Interno, Matriz
      // 4. Se não for explicitamente externo com fornecedor/posto externo
      if (anyR.isInternal === true || anyR.type === 'INTERNAL' || anyR.pumpId || anyR.tankId || anyR.garageId) {
        return true;
      }
      const st = (r.station || '').toLowerCase();
      if (st.includes('garagem') || st.includes('interno') || st.includes('base') || st.includes('matriz') || st.includes('bomba')) {
        return true;
      }
      // Se não tem fornecedor externo cadastrado e notas não indicam externo
      const hasExtSupplier = Boolean(r.supplierId || r.supplierName);
      const isExtNotes = (r.notes || '').toLowerCase().includes('externo');
      return !hasExtSupplier && !isExtNotes;
    });
  }, [fuelRecords]);

  // Aplicar filtros de busca
  const filteredRecords = useMemo(() => {
    return internalRecords.filter((record) => {
      // Busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const plate = (record.vehiclePlate || '').toLowerCase();
        const driverName = (record.driver?.name || '').toLowerCase();
        const station = (record.station || '').toLowerCase();
        const anyR = record as any;
        const pump = (anyR.pumpName || '').toLowerCase();
        const tank = (anyR.tankName || '').toLowerCase();
        const notes = (record.notes || '').toLowerCase();

        const match =
          plate.includes(term) ||
          driverName.includes(term) ||
          station.includes(term) ||
          pump.includes(term) ||
          tank.includes(term) ||
          notes.includes(term);

        if (!match) return false;
      }

      // Tipo de combustível
      if (selectedFuelType !== 'ALL') {
        if ((record.fuelType || '').toUpperCase() !== selectedFuelType.toUpperCase()) {
          return false;
        }
      }

      // Período
      if (startDate) {
        const recDate = record.date ? record.date.split('T')[0] : '';
        if (recDate < startDate) return false;
      }
      if (endDate) {
        const recDate = record.date ? record.date.split('T')[0] : '';
        if (recDate > endDate) return false;
      }

      return true;
    });
  }, [internalRecords, searchTerm, selectedFuelType, startDate, endDate]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // KPIs do Dashboard Interno
  const totalInternalLiters = useMemo(() => {
    return internalRecords.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  }, [internalRecords]);

  const totalInternalCost = useMemo(() => {
    return internalRecords.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  }, [internalRecords]);

  const avgInternalLiters = useMemo(() => {
    return internalRecords.length > 0 ? totalInternalLiters / internalRecords.length : 0;
  }, [internalRecords, totalInternalLiters]);

  // Ações
  const handleView = (record: FuelRecord) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handleEdit = (record: FuelRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleDelete = (record: FuelRecord) => {
    setDeletingRecord(record);
    setIsDeleteDialogOpen(true);
  };

  const handleSuccessAction = () => {
    onRefresh();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const getFuelBadgeColor = (fuelType?: string) => {
    const ft = (fuelType || '').toUpperCase();
    if (ft.includes('DIESEL')) return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    if (ft.includes('GASOLINE') || ft.includes('GASOLINA')) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    if (ft.includes('ETHANOL') || ft.includes('ETANOL')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* DASHBOARD DA FUNCIONALIDADE - ABASTECIMENTO INTERNO            */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-seguranca-graphite border border-gray-700/80 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Painel de Abastecimento Interno
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Controle de combustível próprio, bombas, tanques de garagens e pontos de abastecimento internos
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 h-10 text-xs sm:text-sm gap-2"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </Button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30 h-10 text-xs sm:text-sm font-semibold gap-2 flex-1 sm:flex-none justify-center"
          >
            <Plus size={17} />
            Cadastrar Abastecimento Interno
          </Button>
        </div>
      </div>

      {/* Cards de Métricas do Abastecimento Interno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Volume Interno */}
        <Card className="bg-seguranca-graphite border-gray-700/80 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Volume Interno Total
            </CardTitle>
            <Droplets className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {totalInternalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
            </div>
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">Bombas da base</span> • Garagens próprias
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Custo Interno */}
        <Card className="bg-seguranca-graphite border-gray-700/80 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Custo Total Interno
            </CardTitle>
            <DollarSign className="h-4 w-4 text-seguranca-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-seguranca-yellow">
              {totalInternalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Valor apurado com base no estoque
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Quantidade de Abastecimentos */}
        <Card className="bg-seguranca-graphite border-gray-700/80 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Abastecimentos Realizados
            </CardTitle>
            <Layers className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {internalRecords.length}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Registros ativos no sistema
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Média por Abastecimento */}
        <Card className="bg-seguranca-graphite border-gray-700/80 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Média por Abastecimento
            </CardTitle>
            <Fuel className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {avgInternalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Média litros injetados por veículo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* TABELA / LISTA DOS ABASTECIMENTOS INTERNOS                     */}
      {/* ============================================================== */}
      <Card className="bg-seguranca-graphite border-gray-700/80 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-gray-700/80 bg-seguranca-black/30 p-4 sm:p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
                <Building2 className="text-blue-400 h-5 w-5" />
                Lista dos Abastecimentos Internos
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">
                Exibindo {filteredRecords.length} de {internalRecords.length} lançamentos internos cadastrados
              </p>
            </div>

            {/* Barra de Filtros */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Campo de Busca */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar placa, motorista, bomba..."
                  className="pl-9 h-9 text-xs sm:text-sm bg-seguranca-black border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Filtro de Combustível */}
              <Select
                value={selectedFuelType}
                onValueChange={(val) => {
                  setSelectedFuelType(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs bg-seguranca-black border-gray-600 text-white">
                  <SelectValue placeholder="Combustível" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                  <SelectItem value="ALL">Todos Tipos</SelectItem>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                  <SelectItem value="GASOLINE">Gasolina</SelectItem>
                  <SelectItem value="ETHANOL">Etanol</SelectItem>
                  <SelectItem value="FLEX">Flex</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Data Inicial */}
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-[130px] h-9 text-xs bg-seguranca-black border-gray-600 text-white"
                title="Data Inicial"
              />

              {/* Filtro Data Final */}
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-[130px] h-9 text-xs bg-seguranca-black border-gray-600 text-white"
                title="Data Final"
              />

              {(searchTerm || selectedFuelType !== 'ALL' || startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFuelType('ALL');
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
                  title="Limpar filtros"
                >
                  <X size={14} className="mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-seguranca-black/40 border-b border-gray-700/80">
                <TableRow className="hover:bg-transparent border-gray-700/80">
                  <TableHead className="text-gray-300 font-semibold text-xs py-3.5">Data / Hora</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs py-3.5">Veículo</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs py-3.5">Bomba / Tanque</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs py-3.5">Combustível</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs py-3.5 text-right">Litros</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs py-3.5 text-right">KM / Horímetro</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs py-3.5">Responsável / Motorista</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs py-3.5 text-right">Custo Total</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs py-3.5 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Fuel className="h-8 w-8 text-gray-500" />
                        <p className="font-semibold text-sm">Nenhum abastecimento interno encontrado</p>
                        <p className="text-xs text-gray-500">
                          Clique em &quot;Cadastrar Abastecimento Interno&quot; para registrar o primeiro abastecimento da garagem.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
                        >
                          <Plus size={14} className="mr-1" />
                          Novo Lançamento Interno
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record) => {
                    const anyR = record as any;
                    const pumpDisplay = anyR.pumpName || record.station || 'Bomba Interna';
                    const tankDisplay = anyR.tankName ? ` • ${anyR.tankName}` : '';
                    const dateFormatted = record.date
                      ? format(new Date(record.date), 'dd/MM/yyyy HH:mm')
                      : '—';

                    return (
                      <TableRow
                        key={record.id}
                        className="border-b border-gray-700/50 hover:bg-gray-800/40 transition-colors"
                      >
                        {/* Data / Hora */}
                        <TableCell className="text-xs text-gray-300 whitespace-nowrap">
                          {dateFormatted}
                        </TableCell>

                        {/* Veículo */}
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                              {record.vehiclePlate || 'Sem Placa'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Bomba / Tanque */}
                        <TableCell className="text-xs text-gray-300 whitespace-nowrap">
                          <span className="font-medium text-blue-300">{pumpDisplay}</span>
                          <span className="text-gray-400 text-[11px]">{tankDisplay}</span>
                        </TableCell>

                        {/* Combustível */}
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase ${getFuelBadgeColor(record.fuelType)}`}
                          >
                            {record.fuelType || 'DIESEL'}
                          </Badge>
                        </TableCell>

                        {/* Litros */}
                        <TableCell className="text-xs font-bold text-blue-400 text-right whitespace-nowrap">
                          {Number(record.quantity || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
                        </TableCell>

                        {/* KM / Horímetro */}
                        <TableCell className="text-xs text-gray-300 text-right whitespace-nowrap">
                          {record.mileage ? `${record.mileage.toLocaleString('pt-BR')} km` : '—'}
                        </TableCell>

                        {/* Responsável / Motorista */}
                        <TableCell className="text-xs text-gray-300 whitespace-nowrap">
                          {record.driver?.name || anyR.responsibleName || 'Não informado'}
                        </TableCell>

                        {/* Custo Total */}
                        <TableCell className="text-xs font-bold text-seguranca-yellow text-right whitespace-nowrap">
                          {Number(record.cost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>

                        {/* Ações: Visualizar, Editar, Excluir */}
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(record)}
                              title="Visualizar Detalhes"
                              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40"
                            >
                              <Eye size={15} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(record)}
                              title="Editar Lançamento"
                              className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40"
                            >
                              <Edit size={15} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record)}
                              title="Excluir Lançamento (com justificativa)"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/40"
                            >
                              <Trash2 size={15} />
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700/80 bg-seguranca-black/20 text-xs text-gray-400">
              <div>
                Página <span className="font-bold text-white">{currentPage}</span> de{' '}
                <span className="font-bold text-white">{totalPages}</span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 border-gray-700 text-gray-300 disabled:opacity-40"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5 border-gray-700 text-gray-300 disabled:opacity-40"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* MODAL DE VISUALIZAÇÃO DE DETALHES                              */}
      {/* ============================================================== */}
      {viewingRecord && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-xl bg-seguranca-graphite border-gray-700 text-white">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-blue-600 text-white font-bold text-xs uppercase">
                  Abastecimento Interno
                </Badge>
                <span className="text-xs text-gray-400">
                  ID: {viewingRecord.id.slice(0, 8)}...
                </span>
              </div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Fuel className="h-5 w-5 text-blue-400" />
                Comprovante de Abastecimento Interno
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Informações consolidadas de injeção de combustível na garagem
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 bg-seguranca-black/50 p-3.5 rounded-xl border border-gray-700/80">
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase font-bold">Veículo</span>
                  <span className="text-white font-bold text-base">{viewingRecord.vehiclePlate}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase font-bold">Data / Hora</span>
                  <span className="text-white font-medium">
                    {viewingRecord.date ? format(new Date(viewingRecord.date), 'dd/MM/yyyy HH:mm') : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase font-bold">Bomba / Estação</span>
                  <span className="text-blue-300 font-medium">{viewingRecord.station || 'Bomba Interna'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase font-bold">Combustível</span>
                  <Badge variant="outline" className={`mt-0.5 text-[10px] ${getFuelBadgeColor(viewingRecord.fuelType)}`}>
                    {viewingRecord.fuelType}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-seguranca-black/50 p-3.5 rounded-xl border border-gray-700/80 text-center">
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase font-bold">Volume</span>
                  <span className="text-blue-400 font-bold text-lg">
                    {Number(viewingRecord.quantity || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase font-bold">KM / Horímetro</span>
                  <span className="text-white font-bold text-lg">
                    {viewingRecord.mileage ? `${viewingRecord.mileage.toLocaleString('pt-BR')}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase font-bold">Valor Total</span>
                  <span className="text-seguranca-yellow font-bold text-lg">
                    {Number(viewingRecord.cost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              <div className="bg-seguranca-black/50 p-3.5 rounded-xl border border-gray-700/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Responsável / Motorista:</span>
                  <span className="text-white font-medium">
                    {viewingRecord.driver?.name || (viewingRecord as any).responsibleName || 'Não informado'}
                  </span>
                </div>
                {viewingRecord.notes && (
                  <div className="pt-2 border-t border-gray-700/60">
                    <span className="text-gray-400 block text-[11px] uppercase font-bold mb-0.5">Observações:</span>
                    <p className="text-gray-200 text-xs italic bg-gray-900/60 p-2 rounded border border-gray-700/50">
                      {viewingRecord.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEdit(viewingRecord);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5"
              >
                <Edit size={14} />
                Editar Registro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ============================================================== */}
      {/* MODAL DE CADASTRO INTERNO                                      */}
      {/* ============================================================== */}
      <AbastecimentoInternoFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccessAction}
        veiculos={vehicles}
      />

      {/* ============================================================== */}
      {/* MODAL DE EDIÇÃO                                                */}
      {/* ============================================================== */}
      {editingRecord && (
        <AbastecimentoEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRecord(null);
          }}
          onSuccess={handleSuccessAction}
          abastecimento={editingRecord}
          veiculos={vehicles.map((v) => ({
            id: v.id,
            placa: v.plate || (v as any).placa || '',
            marca: v.brand || (v as any).marca || '',
            modelo: v.model || (v as any).modelo || '',
            status: v.status || 'ATIVO',
          }))}
        />
      )}

      {/* ============================================================== */}
      {/* DIÁLOGO DE EXCLUSÃO (COM MOTIVO OBRIGATÓRIO)                   */}
      {/* ============================================================== */}
      <AbastecimentoDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingRecord(null);
        }}
        onSuccess={handleSuccessAction}
        abastecimento={deletingRecord}
      />
    </div>
  );
};

export default AbastecimentoInternoTab;

