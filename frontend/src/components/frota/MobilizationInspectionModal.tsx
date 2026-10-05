import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Truck, ClipboardCheck, AlertTriangle, Save, Camera, CheckCircle2, X } from 'lucide-react';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import clientService from '@/services/clientService';
import workPostService from '@/services/workPostService';
import transportMobilizationService from '@/services/transportMobilizationService';
import type { MobilizationType, CreateTransportMobilizationDTO, ChecklistItemDetail } from '@/types/mobilization';

interface MobilizationInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MobilizationType;
  onSuccess: () => void;
}

const PRE_USO_CHECKLIST: ChecklistItemDetail[] = [
  { id: 'documentos', label: 'Documentos (CNH, DUT, Seguro, ATF)', category: 'Documentação', positivo: 1, negativo: null, observacao: '' },
  { id: 'selo', label: 'Selo - Validade da vistoria do veículo', category: 'Documentação', positivo: 1, negativo: null, observacao: '' },
  { id: 'cintos', label: 'Cintos de segurança (motorista e passageiros)', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'extintor', label: 'Extintor de incêndio', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'freio', label: 'Sistema de freios', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'janelas', label: 'Janelas (Trava com abertura máx. 15 cm)', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'pneus', label: 'Pneus e Estepe em boas condições', category: 'Pneus', positivo: 1, negativo: null, observacao: '' },
  { id: 'telemetria', label: 'Telemetria e Detector de Fadiga instalados', category: 'Tecnologia', positivo: 1, negativo: null, observacao: '' },
];

export const MobilizationInspectionModal: React.FC<MobilizationInspectionModalProps> = ({
  open,
  onOpenChange,
  type,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [workPosts, setWorkPosts] = useState<any[]>([]);

  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [clientId, setClientId] = useState('');
  const [workPostId, setWorkPostId] = useState('');
  const [kmReading, setKmReading] = useState('');
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState<ChecklistItemDetail[]>(PRE_USO_CHECKLIST);

  useEffect(() => {
    if (!open) return;

    Promise.allSettled([
      fleetService.getVehicles(),
      driverService.getDrivers(),
      clientService.getAllClients(),
      workPostService.getAllWorkPosts()
    ]).then(([resV, resD, resC, resW]) => {
      if (resV.status === 'fulfilled') setVehicles(resV.value || []);
      if (resD.status === 'fulfilled') setDrivers(resD.value || []);
      if (resC.status === 'fulfilled') setClients(resC.value || []);
      if (resW.status === 'fulfilled') setWorkPosts(resW.value || []);
    });
  }, [open]);

  const getTitle = () => {
    switch (type) {
      case 'GENERAL_INSPECTION':
        return 'Nova Inspeção Geral de Mobilização';
      case 'BUS_RAC02':
        return 'Checklist Ônibus (RAC 02 - Direção Defensiva)';
      default:
        return 'Checklist de Pré-Uso de Veículo';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !kmReading) {
      toast({ title: 'Campos Obrigatórios', description: 'Selecione o veículo e informe a quilometragem.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const payload: CreateTransportMobilizationDTO = {
        vehicleId,
        driverId: driverId || undefined,
        clientId: clientId || undefined,
        workPostId: workPostId || undefined,
        type,
        kmReading: parseInt(kmReading, 10),
        checklistData: JSON.stringify(items),
        observations
      };

      await transportMobilizationService.create(payload);
      toast({
        title: 'Checklist Registrado!',
        description: 'Vistoria e checklist salvos com sucesso na Mobilização de Transportes.'
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao salvar vistoria:', err);
      toast({
        title: 'Erro ao Salvar',
        description: err?.message || 'Falha ao registrar a vistoria.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-zinc-800">
          <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ClipboardCheck className="text-amber-400" size={22} />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Preencha os dados da vistoria técnica para homologar a mobilização sem sair desta tela.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">Veículo Auditado *</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 h-10">
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      [{v.plate}] {v.brand} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">Motorista Responsável</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 h-10">
                  <SelectValue placeholder="Selecione o motorista" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">Cliente Alocado</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 h-10">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-amber-400">Hodômetro Atual (KM) *</Label>
              <Input
                type="number"
                value={kmReading}
                onChange={(e) => setKmReading(e.target.value)}
                placeholder="Ex: 148500"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 h-10 font-mono"
                required
              />
            </div>
          </div>

          {/* Requisitos de Vistoria */}
          <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Itens Inspecionados no Veículo:</span>
              <span className="text-[10px] text-zinc-500">RAC 02 / Pré-Uso</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={it.id} className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-xs">
                  <span className="text-zinc-200 truncate pr-2">{it.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...items];
                        copy[idx].positivo = 1;
                        copy[idx].negativo = null;
                        setItems(copy);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${it.positivo === 1 ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...items];
                        copy[idx].positivo = null;
                        copy[idx].negativo = 1;
                        setItems(copy);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${it.negativo === 1 ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      NC
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-300">Observações Adicionais da Vistoria</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Trava de janela 15cm verificada. Cintos 100% testados."
              className="bg-zinc-950 border-zinc-700 text-zinc-100 h-20 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold rounded-xl px-5"
            >
              {loading ? 'Salvando...' : 'Salvar Checklist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MobilizationInspectionModal;
