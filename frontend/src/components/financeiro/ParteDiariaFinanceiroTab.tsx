import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  Search, 
  Calendar, 
  Truck, 
  User, 
  CheckCircle2, 
  BarChart3,
  Calculator,
  ArrowUpRight,
  Gauge,
  Clock,
  ChevronRight
} from 'lucide-react';
import { parteDiariaService, ParteDiaria } from '@/services/parteDiariaService';
import { useToast } from '@/hooks/use-toast';

interface ParteDiariaFinanceiroTabProps {
  onOpenParteDiariaModal: () => void;
  onOpenBulletinModal?: () => void;
}

export const ParteDiariaFinanceiroTab: React.FC<ParteDiariaFinanceiroTabProps> = ({
  onOpenParteDiariaModal,
  onOpenBulletinModal
}) => {
  const { toast } = useToast();
  const [partesDiarias, setPartesDiarias] = useState<ParteDiaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await parteDiariaService.getPartesDiarias(startDate, endDate);
      setPartesDiarias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar Partes Diárias no Financeiro:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as Partes Diárias.',
        variant: 'destructive'
      });
      setPartesDiarias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  // Filtragem local
  const filteredData = partesDiarias.filter(pd => {
    if (statusFilter !== 'ALL' && pd.status !== statusFilter) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      (pd.number && pd.number.toLowerCase().includes(term)) ||
      (pd.clientName && pd.clientName.toLowerCase().includes(term)) ||
      (pd.obraName && pd.obraName.toLowerCase().includes(term)) ||
      (pd.driverName && pd.driverName.toLowerCase().includes(term)) ||
      (pd.vehiclePlate && pd.vehiclePlate.toLowerCase().includes(term)) ||
      (pd.vehicleModel && pd.vehicleModel.toLowerCase().includes(term))
    );
  });

  // Cálculo dos totais KPI
  const totalLogs = filteredData.length;
  const totalKmRodado = filteredData.reduce((acc, pd) => acc + (pd.drivenKm || ((pd.endKm || 0) - (pd.startKm || 0)) || 0), 0);
  const totalKmConsiderado = filteredData.reduce((acc, pd) => acc + (pd.consideredKm || pd.drivenKm || 0), 0);
  const totalKmDesconsiderado = filteredData.reduce((acc, pd) => acc + (pd.disregardedKm || 0), 0);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'VALIDADA':
      case 'APROVADA':
        return (
          <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-semibold px-2.5 py-1">
            Validada
          </Badge>
        );
      case 'APURADA':
        return (
          <Badge className="bg-sky-950/80 text-sky-400 border border-sky-500/40 font-semibold px-2.5 py-1">
            Apurada
          </Badge>
        );
      case 'RASCUNHO':
      default:
        return (
          <Badge className="bg-amber-950/80 text-amber-400 border border-amber-500/40 font-semibold px-2.5 py-1">
            Lançada
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800 hover:border-amber-500/40 transition-all shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Partes Diárias no Período</p>
                <p className="text-2xl font-mono font-bold text-white mt-1">{totalLogs}</p>
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1 mt-1">
                  <FileText className="w-3.5 h-3.5" /> Origem das Medições
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 hover:border-sky-500/40 transition-all shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">KM Total Rodado</p>
                <p className="text-2xl font-mono font-bold text-sky-400 mt-1">{totalKmRodado.toLocaleString('pt-BR')} km</p>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Truck className="w-3.5 h-3.5 text-sky-400" /> Apuração de Odômetro
                </span>
              </div>
              <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400">
                <Truck className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">KM Considerado</p>
                <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{totalKmConsiderado.toLocaleString('pt-BR')} km</p>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Desconto: {totalKmDesconsiderado} km
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 shadow-xl flex flex-col justify-center">
          <CardContent className="p-5 space-y-2">
            <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Ações Rápidas</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onOpenParteDiariaModal}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex-1"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Lançar PD
              </Button>
              {onOpenBulletinModal && (
                <Button
                  onClick={onOpenBulletinModal}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex-1"
                >
                  <Calculator className="h-3.5 w-3.5 mr-1" />
                  Medição
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela e Filtros */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
        <CardHeader className="border-b border-slate-800/80 p-4 sm:p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-tight">
                  Registros de Partes Diárias
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Base de dados operacionais utilizada no fechamento das medições de faturamento.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                onClick={onOpenParteDiariaModal}
                size="sm"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Parte Diária
              </Button>
            </div>
          </div>

          {/* Barra de Pesquisa e Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mt-4 pt-4 border-t border-slate-800/80">
            <div className="lg:col-span-5 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por cliente, obra, motorista, placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 rounded-xl text-sm h-10"
              />
            </div>

            <div className="lg:col-span-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white focus:border-amber-500 rounded-xl text-sm h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  <SelectItem value="RASCUNHO">Lançadas</SelectItem>
                  <SelectItem value="APURADA">Apuradas</SelectItem>
                  <SelectItem value="VALIDADA">Validadas / Aprovadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="lg:col-span-2">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white text-xs h-10 rounded-xl"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
              <p className="text-sm font-medium">Carregando partes diárias...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3 opacity-60" />
              <h4 className="text-lg font-bold text-white mb-1">Nenhuma Parte Diária Encontrada</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
                Não há partes diárias com os filtros aplicados.
              </p>
              <Button
                onClick={onOpenParteDiariaModal}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lançar Parte Diária Agora
              </Button>
            </div>
          ) : (
            <>
              {/* Layout Responsivo para Telas Pequenas (Mobile) */}
              <div className="block lg:hidden divide-y divide-slate-800/80">
                {filteredData.map((pd, index) => {
                  const kmDriven = pd.drivenKm || (pd.endKm && pd.startKm ? pd.endKm - pd.startKm : 0);
                  const formattedDate = pd.date 
                    ? (pd.date.includes('-') ? pd.date.split('-').reverse().join('/') : pd.date)
                    : 'N/A';

                  return (
                    <div key={pd.id || index} className="p-4 space-y-3 bg-slate-900/60 hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-bold text-base">{pd.number || `PD-${13100 + index}`}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            {formattedDate}
                          </span>
                        </div>
                        {getStatusBadge(pd.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 uppercase font-semibold">Cliente / Obra</span>
                          <p className="font-bold text-white text-sm">{pd.clientName || 'Cliente Geral'}</p>
                          <p className="text-slate-400 text-xs">{pd.obraName || pd.contractNumber || 'Obra Padrão'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase font-semibold">Veículo / Motorista</span>
                          <p className="font-mono font-bold text-slate-200">{pd.vehiclePlate || 'N/A'}</p>
                          <p className="text-slate-400 text-xs">{pd.driverName || 'Motorista'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-400">KM Inicial</span>
                          <p className="font-mono text-slate-300">{pd.startKm?.toLocaleString('pt-BR') || 0} km</p>
                        </div>
                        <div>
                          <span className="text-slate-400">KM Final</span>
                          <p className="font-mono text-slate-300">{pd.endKm?.toLocaleString('pt-BR') || 0} km</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold">Rodado</span>
                          <p className="font-mono font-bold text-emerald-400 text-sm">{kmDriven.toLocaleString('pt-BR')} km</p>
                        </div>
                      </div>

                      {onOpenBulletinModal && (
                        <div className="flex justify-end pt-1">
                          <Button
                            onClick={onOpenBulletinModal}
                            size="sm"
                            variant="outline"
                            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs h-8"
                          >
                            Vincular à Medição
                            <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tabela Completa para Desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <Table className="w-full text-left text-slate-200">
                  <TableHeader className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="px-5 py-4">Documento / Data</TableHead>
                      <TableHead className="px-5 py-4">Cliente / Obra</TableHead>
                      <TableHead className="px-5 py-4">Veículo / Placa</TableHead>
                      <TableHead className="px-5 py-4">Motorista</TableHead>
                      <TableHead className="px-5 py-4 text-right">KM Inicial</TableHead>
                      <TableHead className="px-5 py-4 text-right">KM Final</TableHead>
                      <TableHead className="px-5 py-4 text-right">KM Rodado</TableHead>
                      <TableHead className="px-5 py-4 text-center">Status</TableHead>
                      <TableHead className="px-5 py-4 text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800/80 bg-slate-900/40">
                    {filteredData.map((pd, index) => {
                      const kmDriven = pd.drivenKm || (pd.endKm && pd.startKm ? pd.endKm - pd.startKm : 0);
                      const formattedDate = pd.date 
                        ? (pd.date.includes('-') ? pd.date.split('-').reverse().join('/') : pd.date)
                        : 'N/A';

                      return (
                        <TableRow key={pd.id || index} className="border-slate-800 hover:bg-slate-800/60 transition-colors">
                          <TableCell className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-amber-400 font-bold text-sm">{pd.number || `PD-${13100 + index}`}</span>
                              <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="h-3 w-3 text-slate-500" />
                                {formattedDate}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">
                                {pd.clientName || 'Cliente Geral'}
                              </span>
                              <span className="text-xs text-amber-400/90">
                                {pd.obraName || pd.contractNumber || 'Obra Padrão'}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sky-400">
                                <Truck className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-white text-xs">{pd.vehiclePlate || 'N/A'}</span>
                                <span className="text-[11px] text-slate-400">{pd.vehicleModel || 'Ônibus / Micro'}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-sm text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              {pd.driverName || 'Motorista Padrão'}
                            </div>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-right font-mono text-xs text-slate-400">
                            {pd.startKm?.toLocaleString('pt-BR') || 0} km
                          </TableCell>

                          <TableCell className="px-5 py-4 text-right font-mono text-xs text-slate-400">
                            {pd.endKm?.toLocaleString('pt-BR') || 0} km
                          </TableCell>

                          <TableCell className="px-5 py-4 text-right font-mono font-bold text-emerald-400 text-sm">
                            {kmDriven.toLocaleString('pt-BR')} km
                          </TableCell>

                          <TableCell className="px-5 py-4 text-center">
                            {getStatusBadge(pd.status)}
                          </TableCell>

                          <TableCell className="px-5 py-4 text-right">
                            {onOpenBulletinModal && (
                              <Button
                                onClick={onOpenBulletinModal}
                                size="sm"
                                variant="outline"
                                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs h-8"
                              >
                                Vincular
                                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

