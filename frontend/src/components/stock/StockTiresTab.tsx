import React, { useState, useEffect, useMemo } from 'react';
import { 
  CircleDot, 
  Truck, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Wrench, 
  Loader2,
  DollarSign,
  Layers,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { tireFleetService, TireItem, TireMovementHistory } from '@/services/tireFleetService';
import { fleetService } from '@/services/fleetService';
import { TireChassisDiagramModal } from './TireChassisDiagramModal';

export const StockTiresTab: React.FC = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tires, setTires] = useState<TireItem[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal do Chassi
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [showChassisModal, setShowChassisModal] = useState(false);

  // Modal de Histórico
  const [selectedTire, setSelectedTire] = useState<TireItem | null>(null);
  const [tireHistory, setTireHistory] = useState<TireMovementHistory[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tiresData, vehiclesData] = await Promise.all([
        tireFleetService.getAll(),
        fleetService.getVehicles().catch(() => [])
      ]);
      setTires(Array.isArray(tiresData) ? tiresData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
    } catch (error) {
      console.error('Erro ao carregar pneus:', error);
      toast({
        title: 'Erro ao carregar pneus',
        description: 'Não foi possível carregar a lista de pneus.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleStockUpdate = () => {
      loadData();
    };
    window.addEventListener('stock-data-changed', handleStockUpdate);
    return () => {
      window.removeEventListener('stock-data-changed', handleStockUpdate);
    };
  }, []);

  const stats = useMemo(() => {
    let inStock = 0;
    let inUse = 0;
    let inRecap = 0;
    let criticalTread = 0;

    tires.forEach(t => {
      if (t.status === 'AVAILABLE') inStock++;
      if (t.status === 'IN_USE') inUse++;
      if (t.status === 'RECAP') inRecap++;
      if (t.currentTreadDepth != null && Number(t.currentTreadDepth) <= 3.0) criticalTread++;
    });

    return { inStock, inUse, inRecap, criticalTread };
  }, [tires]);

  const filteredTires = useMemo(() => {
    return tires.filter(t => {
      const matchesSearch = 
        (t.serialNumber && t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.brand && t.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.model && t.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.size && t.size.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tires, searchTerm, statusFilter]);

  const handleOpenHistory = async (tire: TireItem) => {
    setSelectedTire(tire);
    setShowHistoryModal(true);
    try {
      setLoadingHistory(true);
      const history = await tireFleetService.getHistory(tire.id);
      setTireHistory(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Em Estoque</Badge>;
      case 'IN_USE':
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Instalado na Frota</Badge>;
      case 'RECAP':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Em Reforma / Recapagem</Badge>;
      case 'SCRAPPED':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Sucateado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Pneus em Estoque</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.inStock}</h3>
              <p className="text-xs text-gray-500 mt-1">Disponíveis no almoxarifado</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CircleDot size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-400 font-medium">Instalados na Frota</p>
              <h3 className="text-2xl font-bold text-blue-300 mt-1">{stats.inUse}</h3>
              <p className="text-xs text-gray-500 mt-1">Rodando nos ônibus</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Truck size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400 font-medium">Em Reforma / Recapagem</p>
              <h3 className="text-2xl font-bold text-amber-300 mt-1">{stats.inRecap}</h3>
              <p className="text-xs text-gray-500 mt-1">Na recapadora</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Wrench size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
                <AlertTriangle size={14} /> Sulco Baixo (&le; 3mm)
              </p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">{stats.criticalTread}</h3>
              <p className="text-xs text-gray-400 mt-1">Necessitam de rodízio/reforma</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
              <AlertTriangle size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Seleção de Chassi */}
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por Nº de Fogo/DOT, Marca, Modelo ou Medida..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500 w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Status do Pneu" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  <SelectItem value="AVAILABLE">Disponível em Estoque</SelectItem>
                  <SelectItem value="IN_USE">Instalado na Frota</SelectItem>
                  <SelectItem value="RECAP">Em Recapagem</SelectItem>
                  <SelectItem value="SCRAPPED">Sucateado</SelectItem>
                </SelectContent>
              </Select>

              {/* Seletor de Chassi do Ônibus */}
              <Select 
                onValueChange={(vehicleId) => {
                  const v = vehicles.find(item => item.id === vehicleId);
                  if (v) {
                    setSelectedVehicle(v);
                    setShowChassisModal(true);
                  }
                }}
              >
                <SelectTrigger className="w-[200px] bg-seguranca-black border-seguranca-yellow text-seguranca-yellow font-semibold">
                  <Truck size={16} className="mr-1.5" />
                  <SelectValue placeholder="Ver Chassi do Ônibus..." />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-h-56">
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate} • {v.model || 'Ônibus'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pneus */}
      <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden">
        <CardHeader className="bg-seguranca-black/50 border-b border-gray-700 py-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
            <CircleDot className="text-seguranca-yellow" size={18} />
            Inventário e Rastreabilidade de Pneus
          </CardTitle>
          <span className="text-xs text-gray-400">{filteredTires.length} pneu(s) listado(s)</span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow mb-2" />
              <p>Carregando cadastro de pneus...</p>
            </div>
          ) : filteredTires.length === 0 ? (
            <div className="text-center p-12 text-gray-400">
              <CircleDot size={40} className="mx-auto text-gray-600 mb-3" />
              <p className="font-semibold text-gray-300">Nenhum pneu encontrado</p>
              <p className="text-sm mt-1">Cadastre novos pneus pelo Documento de Entrada ou atualize os filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-seguranca-black/80 text-xs uppercase font-semibold text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="py-3 px-4">Fogo / DOT</th>
                    <th className="py-3 px-4">Marca / Modelo</th>
                    <th className="py-3 px-4">Medida</th>
                    <th className="py-3 px-4">Status / Posição</th>
                    <th className="py-3 px-4">Sulco Atual</th>
                    <th className="py-3 px-4">KM Rodado</th>
                    <th className="py-3 px-4">Reformas</th>
                    <th className="py-3 px-4">CPK (Custo/KM)</th>
                    <th className="py-3 px-4 text-right">Histórico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTires.map(tire => {
                    const tread = tire.currentTreadDepth != null ? Number(tire.currentTreadDepth) : 15.0;
                    return (
                      <tr key={tire.id} className="hover:bg-seguranca-black/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white tracking-wider">
                          {tire.serialNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-200">{tire.brand}</span>
                          <p className="text-xs text-gray-400">{tire.model}</p>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-gray-300">
                          {tire.size || '295/80 R22.5'}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(tire.status)}
                          {tire.axleNumber != null && (
                            <span className="block text-[11px] text-blue-300 mt-1">
                              Eixo {tire.axleNumber} • Pos {tire.positionIndex}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold text-sm ${
                            tread <= 2.0 ? 'text-red-400' :
                            tread <= 4.0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {tread.toFixed(1)} mm
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-200">
                          {tire.currentMileage ? tire.currentMileage.toLocaleString('pt-BR') : 0} KM
                        </td>
                        <td className="py-3 px-4">
                          {tire.recapCount > 0 ? (
                            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs">
                              {tire.recapCount}ª Reforma
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-500">Novo</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-300">
                          {tire.cpk != null && Number(tire.cpk) > 0 ? (
                            <span className="text-emerald-400 font-semibold">
                              R$ {Number(tire.cpk).toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenHistory(tire)}
                            className="border-gray-600 text-gray-300 hover:bg-seguranca-black h-8"
                          >
                            <History size={14} className="mr-1" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal do Chassi Interativo */}
      {selectedVehicle && (
        <TireChassisDiagramModal
          open={showChassisModal}
          onOpenChange={setShowChassisModal}
          vehicleId={selectedVehicle.id}
          vehiclePlate={selectedVehicle.plate}
          vehicleModel={selectedVehicle.model}
          onSuccess={loadData}
        />
      )}

      {/* Modal de Histórico de Movimentações */}
      {selectedTire && (
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-xl bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <History className="text-seguranca-yellow" size={20} />
                Histórico do Pneu: {selectedTire.serialNumber}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedTire.brand} {selectedTire.model} • {selectedTire.size}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-2 max-h-[350px] overflow-y-auto pr-1">
              {loadingHistory ? (
                <div className="flex justify-center p-8 text-gray-400">
                  <Loader2 className="animate-spin text-seguranca-yellow" size={24} />
                </div>
              ) : tireHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">Nenhum evento registrado para este pneu.</div>
              ) : (
                tireHistory.map((h, idx) => (
                  <div key={h.id || idx} className="p-3 rounded-lg bg-seguranca-black/60 border border-gray-700 flex items-start justify-between text-xs">
                    <div>
                      <span className="font-bold text-white text-sm block">{h.type}</span>
                      <p className="text-gray-400 mt-0.5">{h.notes || 'Sem observações'}</p>
                      <p className="text-gray-500 mt-1">KM Odômetro: {h.mileage?.toLocaleString('pt-BR')} KM</p>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px] whitespace-nowrap">
                      {h.movementDate ? new Date(h.movementDate).toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="border-t border-gray-700 pt-3">
              <Button variant="outline" onClick={() => setShowHistoryModal(false)} className="border-gray-600 text-gray-300">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
