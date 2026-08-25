import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  UserCheck,
  Search,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Bus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileDown,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { Vehicle } from '@/types/fleet';
import { agregadosExportService } from '@/services/agregadosExportService';
import { useToast } from '@/hooks/use-toast';

interface AgregadosTableProps {
  veiculos: Vehicle[];
  searchTerm?: string;
  onRefresh?: () => void;
  onView?: (veiculo: Vehicle) => void;
  onEdit?: (veiculo: Vehicle) => void;
  onDelete?: (veiculo: Vehicle) => void;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  DAILY: '📅 Diário',
  MONTHLY: '📆 Mensal',
  PER_TRIP: '🚌 Por Viagem',
  PERCENTAGE: '📊 Percentual',
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  BUS_ROAD: '🚌 Ônibus Rodoviário',
  BUS_LUXURY_TOURISM: '🚌✨ Luxo Turismo',
  BUS_URBAN: '🏙️ Ônibus Urbano',
  MINIBUS: '🚐 Micro-ônibus',
  VAN: '🚐 Van',
  CAR_UTILITY: '🚗 Utilitário',
  CAR: '🚗 Carro',
  TRUCK: '🚛 Caminhão',
  MOTORCYCLE: '🏍️ Moto',
  PICKUP: '🛻 Pickup',
  SUV: '🚙 SUV',
  OTHER: '❓ Outro',
};

const AgregadosTable: React.FC<AgregadosTableProps> = ({
  veiculos,
  searchTerm = '',
  onRefresh,
  onView,
  onEdit,
  onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'plate' | 'brand' | 'aggregatedOwnerName'>('plate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { toast } = useToast();

  const effectiveSearch = searchTerm || search;

  // Filter only aggregated vehicles
  const aggregatedVehicles = veiculos.filter((v) => v.isAggregated === true);

  const filteredVehicles = aggregatedVehicles.filter((v) => {
    const matchesSearch =
      !effectiveSearch ||
      v.plate.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      v.brand.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      v.model.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      (v.aggregatedOwnerName &&
        v.aggregatedOwnerName.toLowerCase().includes(effectiveSearch.toLowerCase())) ||
      (v.aggregatedOwnerCpfCnpj &&
        v.aggregatedOwnerCpfCnpj.includes(effectiveSearch));

    const matchesPaymentType =
      paymentTypeFilter === 'ALL' || v.aggregatedPaymentType === paymentTypeFilter;

    return matchesSearch && matchesPaymentType;
  });

  // Sort
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    let aVal = '';
    let bVal = '';
    if (sortField === 'plate') {
      aVal = a.plate;
      bVal = b.plate;
    } else if (sortField === 'brand') {
      aVal = a.brand;
      bVal = b.brand;
    } else {
      aVal = a.aggregatedOwnerName || '';
      bVal = b.aggregatedOwnerName || '';
    }
    const comparison = aVal.localeCompare(bVal, 'pt-BR');
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'plate' | 'brand' | 'aggregatedOwnerName') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    );
  };

  // Calculate stats
  const totalDailyRevenue = aggregatedVehicles.reduce(
    (sum, v) => sum + (v.aggregatedDailyRate || 0),
    0
  );
  const totalMonthlyRevenue = aggregatedVehicles.reduce(
    (sum, v) => sum + (v.aggregatedMonthlyRate || 0),
    0
  );
  const contractsWithExpiry = aggregatedVehicles.filter((v) => {
    if (!v.aggregatedContractEndDate) return false;
    const endDate = new Date(v.aggregatedContractEndDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 30 && diffDays >= 0;
  });
  const expiredContracts = aggregatedVehicles.filter((v) => {
    if (!v.aggregatedContractEndDate) return false;
    return new Date(v.aggregatedContractEndDate) < new Date();
  });

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-seguranca-lightgray">
              Total Agregados
            </CardTitle>
            <Users className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-seguranca-lightgray">
              {aggregatedVehicles.length}
            </div>
            <p className="text-xs text-gray-400">
              de {veiculos.length} veículos no total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-seguranca-lightgray">
              Receita Diária Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              R$ {totalDailyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-400">Valor total por dia</p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-seguranca-lightgray">
              Receita Mensal Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              R$ {totalMonthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-400">Valor total por mês</p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-seguranca-lightgray">
              Contratos
            </CardTitle>
            <FileText className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {contractsWithExpiry.length > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-lg font-bold text-yellow-400">
                    {contractsWithExpiry.length}
                  </span>
                  <span className="text-xs text-gray-400">vencendo</span>
                </div>
              )}
              {expiredContracts.length > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-lg font-bold text-red-400">
                    {expiredContracts.length}
                  </span>
                  <span className="text-xs text-gray-400">vencidos</span>
                </div>
              )}
              {contractsWithExpiry.length === 0 && expiredContracts.length === 0 && (
                <span className="text-lg font-bold text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-5 w-5" />
                  Todos OK
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for expiring/expired contracts */}
      {contractsWithExpiry.length > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">
              Contratos vencendo em até 30 dias
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {contractsWithExpiry.map((v) => {
              const daysLeft = Math.ceil(
                (new Date(v.aggregatedContractEndDate!).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return (
                <span
                  key={v.id}
                  className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded"
                >
                  {v.plate} — {v.aggregatedOwnerName} ({daysLeft} dias)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {expiredContracts.length > 0 && (
        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">
              Contratos vencidos
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiredContracts.map((v) => (
              <span
                key={v.id}
                className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded"
              >
                {v.plate} — {v.aggregatedOwnerName} (venceu em{' '}
                {new Date(v.aggregatedContractEndDate!).toLocaleDateString('pt-BR')})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Buscar por placa, proprietário, CPF/CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            className="bg-seguranca-black border border-gray-600 text-seguranca-lightgray rounded-md px-3 py-2 text-sm focus:border-seguranca-yellow focus:ring-1 focus:ring-seguranca-yellow"
          >
            <option value="ALL">💰 Todos os Pagamentos</option>
            <option value="DAILY">📅 Diário</option>
            <option value="MONTHLY">📆 Mensal</option>
            <option value="PER_TRIP">🚌 Por Viagem</option>
            <option value="PERCENTAGE">📊 Percentual</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-400">
            {filteredVehicles.length} agregado(s)
          </span>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={async () => {
              try {
                await agregadosExportService.exportToPDF(veiculos);
                toast({ title: 'Sucesso', description: 'Relatório PDF gerado com sucesso.' });
              } catch (err) {
                toast({ title: 'Erro', description: 'Falha ao gerar PDF.', variant: 'destructive' });
              }
            }}
            variant="outline"
            size="sm"
            className="border-green-600 text-green-400 hover:bg-green-900/30"
            title="Exportar PDF"
          >
            <FileDown className="h-4 w-4" />
          </Button>
          <Button
            onClick={async () => {
              try {
                await agregadosExportService.exportToExcel(veiculos);
                toast({ title: 'Sucesso', description: 'Planilha Excel gerada com sucesso.' });
              } catch (err) {
                toast({ title: 'Erro', description: 'Falha ao gerar Excel.', variant: 'destructive' });
              }
            }}
            variant="outline"
            size="sm"
            className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
            title="Exportar Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-seguranca-graphite border border-gray-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600 bg-seguranca-black/50">
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-seguranca-yellow transition-colors"
                  onClick={() => handleSort('plate')}
                >
                  <div className="flex items-center">
                    Veículo
                    <SortIcon field="plate" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-seguranca-yellow transition-colors"
                  onClick={() => handleSort('aggregatedOwnerName')}
                >
                  <div className="flex items-center">
                    Proprietário
                    <SortIcon field="aggregatedOwnerName" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Valores
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {sortedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">
                      {aggregatedVehicles.length === 0
                        ? 'Nenhum veículo de agregado encontrado.'
                        : 'Nenhum resultado para os filtros aplicados.'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {aggregatedVehicles.length === 0
                        ? 'Para adicionar um agregado, edite um veículo e ative a opção "Veículo de Agregado".'
                        : 'Tente alterar os filtros de busca.'}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedVehicles.map((veiculo) => {
                  const isExpanded = expandedRow === veiculo.id;
                  const contractEndDate = veiculo.aggregatedContractEndDate
                    ? new Date(veiculo.aggregatedContractEndDate)
                    : null;
                  const today = new Date();
                  const contractExpired = contractEndDate && contractEndDate < today;
                  const contractDaysLeft = contractEndDate
                    ? Math.ceil(
                        (contractEndDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  return (
                    <React.Fragment key={veiculo.id}>
                      <tr className="hover:bg-seguranca-black/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Bus className="h-4 w-4 text-orange-400 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-seguranca-lightgray">
                                {veiculo.plate}
                              </div>
                              <div className="text-xs text-gray-400">
                                {VEHICLE_TYPE_LABELS[veiculo.vehicleType || 'OTHER'] ||
                                  veiculo.vehicleType}
                              </div>
                              <div className="text-xs text-gray-500">
                                {veiculo.brand} {veiculo.model} {veiculo.year}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-seguranca-lightgray">
                              {veiculo.aggregatedOwnerName || '—'}
                            </div>
                            {veiculo.aggregatedOwnerCpfCnpj && (
                              <div className="text-xs text-gray-400">
                                {veiculo.aggregatedOwnerCpfCnpj}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {veiculo.aggregatedOwnerPhone && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {veiculo.aggregatedOwnerPhone}
                                </span>
                              )}
                              {veiculo.aggregatedOwnerEmail && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {veiculo.aggregatedOwnerEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-900/30 text-orange-400 border border-orange-600/30">
                            {PAYMENT_TYPE_LABELS[veiculo.aggregatedPaymentType || ''] ||
                              '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {veiculo.aggregatedDailyRate != null &&
                              veiculo.aggregatedDailyRate > 0 && (
                                <div className="text-sm text-green-400 font-medium">
                                  R$ {veiculo.aggregatedDailyRate.toFixed(2)}/dia
                                </div>
                              )}
                            {veiculo.aggregatedMonthlyRate != null &&
                              veiculo.aggregatedMonthlyRate > 0 && (
                                <div className="text-sm text-blue-400 font-medium">
                                  R$ {veiculo.aggregatedMonthlyRate.toFixed(2)}/mês
                                </div>
                              )}
                            {(!veiculo.aggregatedDailyRate ||
                              veiculo.aggregatedDailyRate === 0) &&
                              (!veiculo.aggregatedMonthlyRate ||
                                veiculo.aggregatedMonthlyRate === 0) && (
                                <span className="text-xs text-gray-500">—</span>
                              )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {veiculo.aggregatedContractStartDate && (
                              <div className="text-xs text-gray-400">
                                Início:{' '}
                                {new Date(
                                  veiculo.aggregatedContractStartDate
                                ).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                            {contractEndDate && (
                              <div
                                className={`text-xs font-medium ${
                                  contractExpired
                                    ? 'text-red-400'
                                    : contractDaysLeft !== null && contractDaysLeft <= 30
                                    ? 'text-yellow-400'
                                    : 'text-gray-400'
                                }`}
                              >
                                Fim: {contractEndDate.toLocaleDateString('pt-BR')}
                                {contractExpired && ' (VENCIDO)'}
                                {!contractExpired &&
                                  contractDaysLeft !== null &&
                                  contractDaysLeft <= 30 && (
                                    <span> ({contractDaysLeft} dias)</span>
                                  )}
                              </div>
                            )}
                            {!veiculo.aggregatedContractStartDate && !contractEndDate && (
                              <span className="text-xs text-gray-500">
                                Sem contrato
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {contractExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-600/30">
                              <AlertTriangle className="h-3 w-3" />
                              Contrato Vencido
                            </span>
                          ) : contractDaysLeft !== null && contractDaysLeft <= 30 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-600/30">
                              <Clock className="h-3 w-3" />
                              Vence em {contractDaysLeft} dias
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-600/30">
                              <CheckCircle className="h-3 w-3" />
                              Ativo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedRow(isExpanded ? null : veiculo.id)
                              }
                              className="h-8 w-8 p-0 text-gray-400 hover:text-seguranca-yellow"
                              title="Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(veiculo)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(veiculo)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded details row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-seguranca-black/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Proprietário */}
                              <div>
                                <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                                  Dados do Proprietário
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p className="text-seguranca-lightgray">
                                    <strong>Nome:</strong>{' '}
                                    {veiculo.aggregatedOwnerName || '—'}
                                  </p>
                                  <p className="text-gray-400">
                                    <strong>CPF/CNPJ:</strong>{' '}
                                    {veiculo.aggregatedOwnerCpfCnpj || '—'}
                                  </p>
                                  <p className="text-gray-400">
                                    <strong>Telefone:</strong>{' '}
                                    {veiculo.aggregatedOwnerPhone || '—'}
                                  </p>
                                  <p className="text-gray-400">
                                    <strong>E-mail:</strong>{' '}
                                    {veiculo.aggregatedOwnerEmail || '—'}
                                  </p>
                                </div>
                              </div>

                              {/* Pagamento */}
                              <div>
                                <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                                  Valores e Pagamento
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p className="text-seguranca-lightgray">
                                    <strong>Tipo:</strong>{' '}
                                    {PAYMENT_TYPE_LABELS[
                                      veiculo.aggregatedPaymentType || ''
                                    ] || '—'}
                                  </p>
                                  <p className="text-green-400">
                                    <strong>Diária:</strong>{' '}
                                    R$ {(veiculo.aggregatedDailyRate || 0).toFixed(2)}
                                  </p>
                                  <p className="text-blue-400">
                                    <strong>Mensal:</strong>{' '}
                                    R$ {(veiculo.aggregatedMonthlyRate || 0).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Contrato */}
                              <div>
                                <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                                  Contrato
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p className="text-gray-400">
                                    <strong>Início:</strong>{' '}
                                    {veiculo.aggregatedContractStartDate
                                      ? new Date(
                                          veiculo.aggregatedContractStartDate
                                        ).toLocaleDateString('pt-BR')
                                      : '—'}
                                  </p>
                                  <p className="text-gray-400">
                                    <strong>Término:</strong>{' '}
                                    {veiculo.aggregatedContractEndDate
                                      ? new Date(
                                          veiculo.aggregatedContractEndDate
                                        ).toLocaleDateString('pt-BR')
                                      : '—'}
                                  </p>
                                  {veiculo.aggregatedNotes && (
                                    <>
                                      <p className="text-gray-400 mt-2">
                                        <strong>Observações:</strong>
                                      </p>
                                      <p className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded">
                                        {veiculo.aggregatedNotes}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgregadosTable;
