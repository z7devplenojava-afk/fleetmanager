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
  CheckCircle, 
  BarChart3,
  Calculator,
  ArrowUpRight
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
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Validada</Badge>;
      case 'APURADA':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Apurada</Badge>;
      case 'RASCUNHO':
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Lançada</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-950/30 via-seguranca-black to-seguranca-graphite/40 border-amber-500/30 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">Partes Diárias no Período</p>
                <p className="text-2xl font-extrabold text-white mt-1">{totalLogs}</p>
                <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1 mt-1">
                  <FileText size={12} className="text-amber-400" /> Origem Operacional das Medições
                </span>
              </div>
              <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                <FileText className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-950/30 via-seguranca-black to-seguranca-graphite/40 border-blue-500/30 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-300 font-bold uppercase tracking-wider">KM Total Rodado</p>
                <p className="text-2xl font-extrabold text-white mt-1">{totalKmRodado.toLocaleString('pt-BR')} km</p>
                <span className="text-[11px] text-blue-300 font-medium flex items-center gap-1 mt-1">
                  <Truck size={12} /> Apuração de Hodômetro
                </span>
              </div>
              <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <Truck className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-950/30 via-seguranca-black to-seguranca-graphite/40 border-emerald-500/30 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">KM Considerado</p>
                <p className="text-2xl font-extrabold text-white mt-1">{totalKmConsiderado.toLocaleString('pt-BR')} km</p>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle size={12} /> Desconto: {totalKmDesconsiderado} km
                </span>
              </div>
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950/30 via-seguranca-black to-seguranca-graphite/40 border-purple-500/30 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-300 font-bold uppercase tracking-wider">Ações de Medição</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={onOpenParteDiariaModal}
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-seguranca-black font-bold text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Lançar PD
                  </Button>
                  {onOpenBulletinModal && (
                    <Button
                      onClick={onOpenBulletinModal}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      <Calculator className="h-3.5 w-3.5 mr-1" />
                      Medição
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl">
                <BarChart3 className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela e Filtros */}
      <Card className="bg-seguranca-graphite border-gray-700 shadow-xl">
        <CardHeader className="border-b border-gray-700/80 p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="h-6 w-6 text-amber-400" />
                Registros de Partes Diárias (Fonte de Dados da Medição)
              </CardTitle>
              <p className="text-xs text-gray-400 mt-1">
                Lançamentos operacionais de veículos, viagens, motoristas e KM registrados pelo Operacional e Financeiro.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="border-gray-600 text-gray-300 hover:bg-seguranca-black"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar Lista
              </Button>

              <Button
                onClick={onOpenParteDiariaModal}
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-seguranca-black font-extrabold hover:brightness-110 shadow-lg shadow-amber-500/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Parte Diária
              </Button>
            </div>
          </div>

          {/* Barra de Pesquisa e Filtros Avançados */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 pt-4 border-t border-gray-700/60">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por cliente, obra, motorista, placa ou nº..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
              />
            </div>

            <div className="md:col-span-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  <SelectItem value="RASCUNHO">Lançadas</SelectItem>
                  <SelectItem value="APURADA">Apuradas</SelectItem>
                  <SelectItem value="VALIDADA">Validadas / Aprovadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs h-10"
                placeholder="Data Início"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs h-10"
                placeholder="Data Fim"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
              <p className="text-sm font-medium">Carregando Partes Diárias do sistema...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-3 opacity-50" />
              <h4 className="text-lg font-bold text-white mb-1">Nenhuma Parte Diária Encontrada</h4>
              <p className="text-sm text-gray-400 max-w-md mx-auto mb-4">
                Não há partes diárias cadastradas com os filtros selecionados. As partes diárias registradas pelo Operacional aparecem aqui automaticamente.
              </p>
              <Button
                onClick={onOpenParteDiariaModal}
                className="bg-amber-500 hover:bg-amber-600 text-seguranca-black font-bold text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lançar Parte Diária Agora
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-seguranca-black">
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-300 font-bold">Documento / Data</TableHead>
                    <TableHead className="text-gray-300 font-bold">Cliente / Obra</TableHead>
                    <TableHead className="text-gray-300 font-bold">Veículo / Placa</TableHead>
                    <TableHead className="text-gray-300 font-bold">Motorista</TableHead>
                    <TableHead className="text-gray-300 font-bold text-right">KM Inicial</TableHead>
                    <TableHead className="text-gray-300 font-bold text-right">KM Final</TableHead>
                    <TableHead className="text-gray-300 font-bold text-right">KM Rodado</TableHead>
                    <TableHead className="text-gray-300 font-bold text-center">Status</TableHead>
                    <TableHead className="text-gray-300 font-bold text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((pd, index) => {
                    const kmDriven = pd.drivenKm || (pd.endKm && pd.startKm ? pd.endKm - pd.startKm : 0);
                    const formattedDate = pd.date 
                      ? (pd.date.includes('-') ? pd.date.split('-').reverse().join('/') : pd.date)
                      : 'N/A';

                    return (
                      <TableRow key={pd.id || index} className="border-gray-700/60 hover:bg-white/5 transition-colors">
                        <TableCell className="font-medium text-white">
                          <div className="flex flex-col">
                            <span className="font-mono text-amber-400 font-bold">{pd.number || `PD-${13100 + index}`}</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              {formattedDate}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-200">
                              {pd.clientName || 'Cliente Geral'}
                            </span>
                            <span className="text-xs text-amber-300/80">
                              {pd.obraName || pd.contractNumber || 'Obra Padrão'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-800 rounded border border-gray-700">
                              <Truck className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-white text-xs">{pd.vehiclePlate || 'N/A'}</span>
                              <span className="text-[11px] text-gray-400">{pd.vehicleModel || 'Ônibus Executivo'}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {pd.driverName || 'Motorista Padrão'}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs text-gray-300">
                          {pd.startKm?.toLocaleString('pt-BR') || 0} km
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs text-gray-300">
                          {pd.endKm?.toLocaleString('pt-BR') || 0} km
                        </TableCell>

                        <TableCell className="text-right font-mono font-bold text-emerald-400 text-sm">
                          {kmDriven.toLocaleString('pt-BR')} km
                        </TableCell>

                        <TableCell className="text-center">
                          {getStatusBadge(pd.status)}
                        </TableCell>

                        <TableCell className="text-right">
                          {onOpenBulletinModal && (
                            <Button
                              onClick={onOpenBulletinModal}
                              size="sm"
                              variant="outline"
                              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs h-8"
                            >
                              Vincular à Medição
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
