import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, BatteryCharging, Loader2, Trash2, Pencil, AlertTriangle, Calendar, DollarSign, Wrench, CheckCircle2,
} from 'lucide-react';
import { vehicleBatteryService, VehicleBattery } from '@/services/vehicleBatteryService';
import fleetService from '@/services/fleetService';
import { Vehicle } from '@/types/fleet';

interface BatteryFormData {
  vehicleId: string;
  batteryCode?: string;
  brand?: string;
  model?: string;
  voltage?: string;
  capacity?: string;
  installDate?: string;
  warrantyExpiryDate?: string;
  status: 'ACTIVE' | 'REPLACED' | 'SCRAPPED';
  cost?: number;
  notes?: string;
}

const EMPTY_FORM: BatteryFormData = {
  vehicleId: '',
  batteryCode: '',
  brand: '',
  model: '',
  voltage: '',
  capacity: '',
  installDate: '',
  warrantyExpiryDate: '',
  status: 'ACTIVE',
  cost: 0,
  notes: '',
};

const STATUS_LABELS: Record<VehicleBattery['status'], string> = {
  ACTIVE: 'Ativa',
  REPLACED: 'Trocada',
  SCRAPPED: 'Sucateada',
};

export const BateriasTable: React.FC = () => {
  const { toast } = useToast();
  const [batteries, setBatteries] = useState<VehicleBattery[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleBattery | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BatteryFormData>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleBatteryService.list();
      setBatteries(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Não foi possível carregar as baterias',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    fleetService.getVehicles().then(setVehicles).catch(() => {});
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (battery: VehicleBattery) => {
    setEditing(battery);
    setForm({
      vehicleId: battery.vehicleId,
      batteryCode: battery.batteryCode || '',
      brand: battery.brand || '',
      model: battery.model || '',
      voltage: battery.voltage || '',
      capacity: battery.capacity || '',
      installDate: battery.installDate || '',
      warrantyExpiryDate: battery.warrantyExpiryDate || '',
      status: battery.status,
      cost: battery.cost || 0,
      notes: battery.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.vehicleId) {
      toast({ title: 'Aviso', description: 'Selecione o veículo', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await vehicleBatteryService.update(editing.id, form);
        toast({ title: 'Sucesso', description: 'Bateria atualizada' });
      } else {
        await vehicleBatteryService.create(form);
        toast({ title: 'Sucesso', description: 'Bateria registrada' });
      }
      setModalOpen(false);
      load();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Erro ao salvar bateria',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await vehicleBatteryService.delete(id);
      toast({ title: 'Sucesso', description: 'Bateria excluída' });
      load();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Erro ao excluir bateria',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (v?: number) =>
    (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  const isWarrantyExpired = (b: VehicleBattery) =>
    b.status === 'ACTIVE' && b.warrantyExpiryDate && new Date(b.warrantyExpiryDate) < new Date();

  const activeCount = batteries.filter(b => b.status === 'ACTIVE').length;
  const expiringSoon = batteries.filter(b => {
    if (b.status !== 'ACTIVE' || !b.warrantyExpiryDate) return false;
    const diff = (new Date(b.warrantyExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 60;
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
        <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
          <BatteryCharging className="h-5 w-5" />
          Controle de Baterias
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="border-gray-600 text-gray-400 hover:bg-gray-700">
            <Wrench className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={openCreate} className="bg-seguranca-red hover:bg-seguranca-darkred">
            <Plus size={16} className="mr-2" />
            Nova Bateria
          </Button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <BatteryCharging className="h-4 w-4 text-seguranca-yellow" />
            <span className="text-sm text-gray-400">Ativas</span>
          </div>
          <div className="text-2xl font-bold text-seguranca-lightgray mt-1">{activeCount}</div>
        </div>
        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-400">Garantia a vencer (60d)</span>
          </div>
          <div className="text-2xl font-bold text-seguranca-lightgray mt-1">{expiringSoon}</div>
        </div>
        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-400">Total</span>
          </div>
          <div className="text-2xl font-bold text-seguranca-lightgray mt-1">{batteries.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8 bg-seguranca-black border border-gray-600 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando baterias...</span>
        </div>
      ) : batteries.length === 0 ? (
        <div className="text-center py-12 bg-seguranca-black border border-gray-600 rounded-lg text-gray-400">
          <BatteryCharging className="mx-auto mb-2" size={32} />
          <p>Nenhuma bateria registrada</p>
        </div>
      ) : (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600 bg-seguranca-graphite">
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Veículo</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Código</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Marca/Modelo</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Instalação</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Garantia</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Status</th>
                <th className="text-right p-3 text-seguranca-lightgray font-medium">Custo</th>
                <th className="text-right p-3 text-seguranca-lightgray font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {batteries.map((b) => (
                <tr key={b.id} className="border-b border-gray-700/50 hover:bg-seguranca-graphite/40 transition-colors">
                  <td className="p-3">
                    <p className="text-white font-medium">{b.vehiclePlate}</p>
                    <p className="text-xs text-gray-500">{b.vehicleModel}</p>
                  </td>
                  <td className="p-3 text-seguranca-lightgray">{b.batteryCode || '-'}</td>
                  <td className="p-3 text-seguranca-lightgray">
                    {b.brand || '-'}{b.model ? ` ${b.model}` : ''}
                    {b.voltage && <span className="text-xs text-gray-500 ml-1">({b.voltage})</span>}
                  </td>
                  <td className="p-3 text-seguranca-lightgray">{formatDate(b.installDate)}</td>
                  <td className="p-3">
                    <span className={isWarrantyExpired(b) ? 'text-red-500' : 'text-seguranca-lightgray'}>
                      {formatDate(b.warrantyExpiryDate)}
                    </span>
                    {isWarrantyExpired(b) && (
                      <AlertTriangle className="inline-block ml-1 h-3.5 w-3.5 text-red-500" />
                    )}
                  </td>
                  <td className="p-3">
                    <Badge className={
                      b.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : b.status === 'REPLACED' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }>
                      {STATUS_LABELS[b.status]}
                    </Badge>
                  </td>
                  <td className="p-3 text-right text-seguranca-lightgray">{formatCurrency(b.cost)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-seguranca-graphite text-seguranca-yellow" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        disabled={deletingId === b.id}
                        className="p-1.5 rounded hover:bg-seguranca-graphite text-red-500"
                        title="Excluir"
                      >
                        {deletingId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-seguranca-graphite border-gray-600 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-seguranca-lightgray">
              <BatteryCharging className="h-5 w-5 text-seguranca-yellow" />
              {editing ? 'Editar Bateria' : 'Nova Bateria'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Registre a instalação, garantia e custo da bateria do veículo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-seguranca-lightgray">Veículo *</Label>
                <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate} - {v.brand} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Código da Bateria</Label>
                <Input value={form.batteryCode} onChange={(e) => setForm({ ...form, batteryCode: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" placeholder="Ex: BAT-001" />
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Marca</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" placeholder="Ex: Moura, Heliar..." />
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Modelo</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" placeholder="Ex: 60Ah" />
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Voltagem</Label>
                <Input value={form.voltage} onChange={(e) => setForm({ ...form, voltage: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" placeholder="Ex: 12V" />
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Data de Instalação</Label>
                <Input type="date" value={form.installDate} onChange={(e) => setForm({ ...form, installDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" />
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Validade da Garantia</Label>
                <Input type="date" value={form.warrantyExpiryDate} onChange={(e) => setForm({ ...form, warrantyExpiryDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" />
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="ACTIVE">Ativa</SelectItem>
                    <SelectItem value="REPLACED">Trocada</SelectItem>
                    <SelectItem value="SCRAPPED">Sucateada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Custo (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-seguranca-lightgray">Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" rows={3} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-seguranca-red hover:bg-seguranca-darkred">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {editing ? 'Atualizar' : 'Registrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BateriasTable;
