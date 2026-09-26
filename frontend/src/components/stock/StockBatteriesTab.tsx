import React, { useState, useEffect, useMemo } from 'react';
import { 
  BatteryCharging, 
  Search, 
  RefreshCw, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Wrench, 
  Loader2,
  Calendar,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { vehicleBatteryService, VehicleBattery } from '@/services/vehicleBatteryService';
import { fleetService } from '@/services/fleetService';

export const StockBatteriesTab: React.FC = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [batteries, setBatteries] = useState<VehicleBattery[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [warrantyFilter, setWarrantyFilter] = useState('ALL');

  // Modais de Ação
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [selectedBatteryForInstall, setSelectedBatteryForInstall] = useState<VehicleBattery | null>(null);
  const [installVehicleId, setInstallVehicleId] = useState('');
  const [installKm, setInstallKm] = useState<number | ''>('');
  const [installDate, setInstallDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingInstall, setSubmittingInstall] = useState(false);

  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedBatteryForRemove, setSelectedBatteryForRemove] = useState<VehicleBattery | null>(null);
  const [removeReason, setRemoveReason] = useState('Substituição por fim de vida útil');
  const [scrapBattery, setScrapBattery] = useState(false);
  const [submittingRemove, setSubmittingRemove] = useState(false);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);
  const [newForm, setNewForm] = useState({
    batteryCode: '',
    serialNumber: '',
    brand: 'Moura',
    model: 'Frota Pesada',
    voltage: '12V',
    capacity: '150Ah',
    ccaRating: 950,
    warrantyExpiryDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cost: 850.00,
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [batteryList, vehicleList] = await Promise.all([
        vehicleBatteryService.list(),
        fleetService.getVehicles().catch(() => [])
      ]);
      setBatteries(batteryList || []);
      setVehicles(vehicleList || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar baterias',
        description: err.response?.data?.message || err.message,
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

  // Métricas
  const metrics = useMemo(() => {
    const total = batteries.length;
    const inStock = batteries.filter(b => !b.vehicleId && b.status === 'ACTIVE').length;
    const inUse = batteries.filter(b => !!b.vehicleId && b.status === 'ACTIVE').length;
    
    const now = new Date().getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const expiringWarranty = batteries.filter(b => {
      if (!b.warrantyExpiryDate) return false;
      const expiry = new Date(b.warrantyExpiryDate).getTime();
      return (expiry - now) <= thirtyDaysMs;
    }).length;

    const scrapped = batteries.filter(b => b.status === 'SCRAPPED' || b.status === 'REPLACED').length;

    return { total, inStock, inUse, expiringWarranty, scrapped };
  }, [batteries]);

  // Filtros
  const filteredBatteries = useMemo(() => {
    const now = new Date().getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    return batteries.filter(b => {
      // Busca
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        (b.batteryCode && b.batteryCode.toLowerCase().includes(q)) ||
        (b.serialNumber && b.serialNumber.toLowerCase().includes(q)) ||
        (b.brand && b.brand.toLowerCase().includes(q)) ||
        (b.model && b.model.toLowerCase().includes(q)) ||
        (b.vehiclePlate && b.vehiclePlate.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Status
      if (statusFilter === 'IN_STOCK' && (b.vehicleId || b.status !== 'ACTIVE')) return false;
      if (statusFilter === 'IN_USE' && (!b.vehicleId || b.status !== 'ACTIVE')) return false;
      if (statusFilter === 'SCRAPPED' && b.status !== 'SCRAPPED' && b.status !== 'REPLACED') return false;

      // Garantia
      if (warrantyFilter === 'EXPIRING_OR_EXPIRED') {
        if (!b.warrantyExpiryDate) return false;
        const expiry = new Date(b.warrantyExpiryDate).getTime();
        if ((expiry - now) > thirtyDaysMs) return false;
      }

      return true;
    });
  }, [batteries, searchTerm, statusFilter, warrantyFilter]);

  // Helper para cálculo de garantia
  const getWarrantyBadge = (expiryDate?: string) => {
    if (!expiryDate) return <Badge variant="outline">Sem dados</Badge>;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Vencida ({Math.abs(diffDays)}d atrás)
        </Badge>
      );
    }
    if (diffDays <= 30) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Vence em {diffDays} dias
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
        <ShieldCheck className="w-3 h-3" />
        Válida ({diffDays} dias)
      </Badge>
    );
  };

  // Submeter Instalação
  const handleInstallSubmit = async () => {
    if (!selectedBatteryForInstall || !installVehicleId) {
      toast({ title: 'Atenção', description: 'Selecione o veículo para instalação.', variant: 'destructive' });
      return;
    }
    try {
      setSubmittingInstall(true);
      await vehicleBatteryService.install(selectedBatteryForInstall.id, {
        vehicleId: installVehicleId,
        installKm: installKm !== '' ? Number(installKm) : undefined,
        installDate: installDate || undefined
      });
      toast({
        title: 'Bateria instalada com sucesso!',
        description: `Bateria ${selectedBatteryForInstall.batteryCode} instalada no veículo.`
      });
      setInstallModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Erro ao instalar bateria',
        description: err.response?.data?.message || err.message,
        variant: 'destructive'
      });
    } finally {
      setSubmittingInstall(false);
    }
  };

  // Submeter Remoção
  const handleRemoveSubmit = async () => {
    if (!selectedBatteryForRemove) return;
    try {
      setSubmittingRemove(true);
      await vehicleBatteryService.remove(selectedBatteryForRemove.id, {
        reason: removeReason,
        scrap: scrapBattery
      });
      toast({
        title: 'Bateria removida com sucesso!',
        description: scrapBattery ? 'Bateria enviada para sucata.' : 'Bateria retornou para manutenção/estoque.'
      });
      setRemoveModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Erro ao remover bateria',
        description: err.response?.data?.message || err.message,
        variant: 'destructive'
      });
    } finally {
      setSubmittingRemove(false);
    }
  };

  // Submeter Cadastro de Nova Bateria
  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.batteryCode) {
      toast({ title: 'Erro', description: 'Código ou serial da bateria é obrigatório.', variant: 'destructive' });
      return;
    }
    try {
      setSubmittingNew(true);
      await vehicleBatteryService.create({
        batteryCode: newForm.batteryCode,
        serialNumber: newForm.serialNumber || newForm.batteryCode,
        brand: newForm.brand,
        model: newForm.model,
        voltage: newForm.voltage,
        capacity: newForm.capacity,
        ccaRating: Number(newForm.ccaRating),
        warrantyExpiryDate: newForm.warrantyExpiryDate,
        cost: Number(newForm.cost),
        notes: newForm.notes,
        status: 'ACTIVE'
      });
      toast({
        title: 'Bateria cadastrada com sucesso!',
        description: 'Bateria registrada no almoxarifado operacional.'
      });
      setNewModalOpen(false);
      setNewForm({
        batteryCode: '',
        serialNumber: '',
        brand: 'Moura',
        model: 'Frota Pesada',
        voltage: '12V',
        capacity: '150Ah',
        ccaRating: 950,
        warrantyExpiryDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: 850.00,
        notes: ''
      });
      loadData();
    } catch (err: any) {
      toast({
        title: 'Erro ao cadastrar bateria',
        description: err.response?.data?.message || err.message,
        variant: 'destructive'
      });
    } finally {
      setSubmittingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BatteryCharging className="w-6 h-6 text-amber-500" />
            Controle de Baterias (Almoxarifado & Frota)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Rastreabilidade individual por Serial, CCA, Garantia, Instalação em Veículos e Baixa/Sucata.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setNewModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nova Bateria
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/40">
          <p className="text-xs text-muted-foreground font-medium">Total Registrado</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{metrics.total}</p>
        </Card>
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Em Estoque (Almoxarifado)</p>
          <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">{metrics.inStock}</p>
        </Card>
        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Instaladas na Frota</p>
          <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">{metrics.inUse}</p>
        </Card>
        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Garantia Vencendo / Vencida</p>
          <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">{metrics.expiringWarranty}</p>
        </Card>
        <Card className="p-4 bg-slate-500/10 border-slate-500/20">
          <p className="text-xs text-muted-foreground font-medium">Sucateadas / Baixadas</p>
          <p className="text-2xl font-bold mt-1 text-muted-foreground">{metrics.scrapped}</p>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por código, serial, marca ou placa do veículo..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full md:w-56">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="IN_STOCK">Em Estoque (Almoxarifado)</SelectItem>
              <SelectItem value="IN_USE">Instaladas em Veículo</SelectItem>
              <SelectItem value="SCRAPPED">Substituídas / Sucata</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-56">
          <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Garantia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Garantias</SelectItem>
              <SelectItem value="EXPIRING_OR_EXPIRED">Vencendo ou Vencida (≤30d)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Baterias */}
      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4">Código / Serial</th>
                <th className="py-3 px-4">Marca & Modelo</th>
                <th className="py-3 px-4">Tensão / Ah / CCA</th>
                <th className="py-3 px-4">Localização Atual</th>
                <th className="py-3 px-4">Garantia</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Carregando inventário de baterias...
                  </td>
                </tr>
              ) : filteredBatteries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhuma bateria encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredBatteries.map((bat) => (
                  <tr key={bat.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium">
                      <div className="flex items-center gap-2">
                        <BatteryCharging className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <span>{bat.batteryCode || bat.serialNumber}</span>
                          {bat.status === 'SCRAPPED' && (
                            <Badge variant="destructive" className="ml-2 text-[10px] py-0">SUCATA</Badge>
                          )}
                          {bat.status === 'REPLACED' && (
                            <Badge variant="secondary" className="ml-2 text-[10px] py-0">SUBSTITUÍDA</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{bat.brand || '—'}</div>
                      <div className="text-xs text-muted-foreground">{bat.model || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{bat.voltage || '12V'} • {bat.capacity || '150Ah'}</span>
                      </div>
                      {bat.ccaRating && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          CCA: {bat.ccaRating}A
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {bat.vehicleId ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{bat.vehiclePlate}</span>
                            {bat.vehicleModel && (
                              <span className="text-xs text-muted-foreground">({bat.vehicleModel})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {bat.installDate ? `Instalada em: ${bat.installDate}` : ''}
                            {bat.installKm ? ` • ${bat.installKm} KM` : ''}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          📦 Almoxarifado (Estoque)
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        {getWarrantyBadge(bat.warrantyExpiryDate)}
                        {bat.warrantyExpiryDate && (
                          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Até {bat.warrantyExpiryDate}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {bat.status === 'ACTIVE' && (
                        bat.vehicleId ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            onClick={() => {
                              setSelectedBatteryForRemove(bat);
                              setRemoveModalOpen(true);
                            }}
                          >
                            <Wrench className="w-3.5 h-3.5 mr-1" />
                            Remover / Baixar
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              setSelectedBatteryForInstall(bat);
                              setInstallModalOpen(true);
                            }}
                          >
                            <Truck className="w-3.5 h-3.5 mr-1" />
                            Instalar na Frota
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Instalar Bateria em Veículo */}
      <Dialog open={installModalOpen} onOpenChange={setInstallModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Instalar Bateria no Veículo
            </DialogTitle>
            <DialogDescription>
              Vincular a bateria <strong>{selectedBatteryForInstall?.batteryCode}</strong> a um ônibus/veículo da frota.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Veículo Destino *</Label>
              <Select value={installVehicleId} onValueChange={setInstallVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate} — {v.model || v.brand || 'Veículo'} (KM: {v.currentKm || '—'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data da Instalação</Label>
                <Input 
                  type="date" 
                  value={installDate} 
                  onChange={e => setInstallDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>KM no Hodômetro</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 125000" 
                  value={installKm} 
                  onChange={e => setInstallKm(e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleInstallSubmit}
              disabled={submittingInstall || !installVehicleId}
            >
              {submittingInstall && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirmar Instalação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Remover Bateria */}
      <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Wrench className="w-5 h-5" />
              Remover Bateria do Veículo
            </DialogTitle>
            <DialogDescription>
              Desinstalar a bateria <strong>{selectedBatteryForRemove?.batteryCode}</strong> do veículo {selectedBatteryForRemove?.vehiclePlate}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo da Remoção / Troca</Label>
              <Input 
                value={removeReason} 
                onChange={e => setRemoveReason(e.target.value)} 
                placeholder="Ex: Fim de vida útil, falha na carga, garantia..."
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/40">
              <input 
                type="checkbox" 
                id="scrapCheckbox"
                checked={scrapBattery}
                onChange={e => setScrapBattery(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="scrapCheckbox" className="text-xs text-rose-900 dark:text-rose-200 cursor-pointer">
                <strong>Sucatear Bateria permanentemente</strong> (descarte ecológico / sem recuperação). Se desmarcado, a bateria voltará ao almoxarifado como substituída.
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveModalOpen(false)}>Cancelar</Button>
            <Button 
              variant="destructive"
              onClick={handleRemoveSubmit}
              disabled={submittingRemove}
            >
              {submittingRemove && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirmar Desinstalação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nova Bateria */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleNewSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BatteryCharging className="w-5 h-5 text-amber-500" />
                Cadastrar Bateria no Almoxarifado
              </DialogTitle>
              <DialogDescription>
                Registro individual de bateria com número de série e controle de garantia.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="space-y-1">
                <Label>Código / Serial *</Label>
                <Input 
                  required
                  placeholder="Ex: BAT-150-001"
                  value={newForm.batteryCode}
                  onChange={e => setNewForm(prev => ({ ...prev, batteryCode: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Marca *</Label>
                <Input 
                  required
                  placeholder="Ex: Moura, Heliar"
                  value={newForm.brand}
                  onChange={e => setNewForm(prev => ({ ...prev, brand: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Modelo</Label>
                <Input 
                  placeholder="Ex: Frota Pesada"
                  value={newForm.model}
                  onChange={e => setNewForm(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Tensão & Capacidade</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="12V"
                    value={newForm.voltage}
                    onChange={e => setNewForm(prev => ({ ...prev, voltage: e.target.value }))}
                  />
                  <Input 
                    placeholder="150Ah"
                    value={newForm.capacity}
                    onChange={e => setNewForm(prev => ({ ...prev, capacity: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>CCA (Corrente Partida a Frio)</Label>
                <Input 
                  type="number"
                  placeholder="Ex: 950"
                  value={newForm.ccaRating}
                  onChange={e => setNewForm(prev => ({ ...prev, ccaRating: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Validade da Garantia</Label>
                <Input 
                  type="date"
                  value={newForm.warrantyExpiryDate}
                  onChange={e => setNewForm(prev => ({ ...prev, warrantyExpiryDate: e.target.value }))}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label>Custo Unitário (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={newForm.cost}
                  onChange={e => setNewForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label>Observações</Label>
                <Textarea 
                  placeholder="Informações adicionais do fabricante ou fornecedor..."
                  rows={2}
                  value={newForm.notes}
                  onChange={e => setNewForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewModalOpen(false)}>Cancelar</Button>
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={submittingNew}
              >
                {submittingNew && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Cadastrar Bateria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
