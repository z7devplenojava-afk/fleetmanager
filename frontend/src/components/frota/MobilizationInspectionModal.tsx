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

const FULL_PRE_USO_CHECKLIST: ChecklistItemDetail[] = [
  { id: 'documentos', label: 'Documentos (CNH, DUT, Seguro p/evento, ATF)', category: 'Documentação', positivo: 1, negativo: null, observacao: '' },
  { id: 'selo', label: 'Selo - Validade da vistoria do veículo', category: 'Documentação', positivo: 1, negativo: null, observacao: '' },
  { id: 'cintos', label: 'Cintos de segurança (motorista e passageiros)', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'extintor', label: 'Extintor de incêndio', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'freio', label: 'Sistema de freio', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'cones', label: 'Cones de sinalização', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'giroflex', label: 'Giroflex', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'alarme_re', label: 'Alarme de ré (luzes e sensor)', category: 'Segurança', positivo: 1, negativo: null, observacao: '' },
  { id: 'para_brisa', label: 'Para-brisa (direito e esquerdo)', category: 'Visibilidade', positivo: 1, negativo: null, observacao: '' },
  { id: 'limpador', label: 'Limpador e lavador do para-brisa', category: 'Visibilidade', positivo: 1, negativo: null, observacao: '' },
  { id: 'pneus', label: 'Pneus (do veículo e estepe)', category: 'Pneus', positivo: 1, negativo: null, observacao: '' },
  { id: 'macaco', label: 'Macaco, chave de roda e triângulo', category: 'Pneus', positivo: 1, negativo: null, observacao: '' },
  { id: 'motor', label: 'Motor (ruído, lubrificação, etc.)', category: 'Mecânica', positivo: 1, negativo: null, observacao: '' },
  { id: 'vazamentos', label: 'Vazamentos (hidráulicos, óleo, caixa de marcha, etc.)', category: 'Mecânica', positivo: 1, negativo: null, observacao: '' },
  { id: 'luzes', label: 'Sistema de luzes (painel, setas, lanternas, faróis)', category: 'Elétrica', positivo: 1, negativo: null, observacao: '' },
  { id: 'chip', label: 'Chip de abastecimento', category: 'Elétrica', positivo: 1, negativo: null, observacao: '' },
  { id: 'tacografo', label: 'Tacógrafo (aparelho, leitura e disco)', category: 'Equipamentos', positivo: 1, negativo: null, observacao: '' },
  { id: 'prancheta', label: 'Prancheta', category: 'Equipamentos', positivo: 1, negativo: null, observacao: '' },
  { id: 'poltronas', label: 'Poltronas', category: 'Estrutura', positivo: 1, negativo: null, observacao: '' },
  { id: 'portas_janelas', label: 'Porta/Janelas (saída de emergência, cortinas)', category: 'Estrutura', positivo: 1, negativo: null, observacao: '' },
  { id: 'limpeza', label: 'Limpeza (externa e interna)', category: 'Limpeza', positivo: 1, negativo: null, observacao: '' },
  { id: 'condicoes_gerais', label: 'Condições gerais do veículo', category: 'Geral', positivo: 1, negativo: null, observacao: '' },
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

  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [clientId, setClientId] = useState('');
  const [kmReading, setKmReading] = useState('');
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState<ChecklistItemDetail[]>(FULL_PRE_USO_CHECKLIST);

  useEffect(() => {
    if (!open) return;

    Promise.allSettled([
      fleetService.getVehicles(),
      driverService.getDrivers(),
      clientService.getAllClients()
    ]).then(([resV, resD, resC]) => {
      if (resV.status === 'fulfilled') setVehicles(resV.value || []);
      if (resD.status === 'fulfilled') setDrivers(resD.value || []);
      if (resC.status === 'fulfilled') setClients(resC.value || []);
    });
  }, [open]);

  const getTitle = () => {
    switch (type) {
      case 'GENERAL_INSPECTION':
        return 'Nova Inspeção Geral de Mobilização';
      case 'BUS_RAC02':
        return 'Checklist Ônibus (RAC 02 - Direção Defensiva)';
      default:
        return 'Relatório de Pré-Uso (Checklist Completo de Veículo)';
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
        type,
        kmReading: parseInt(kmReading, 10),
        checklistData: JSON.stringify(items),
        observations
      };

      await transportMobilizationService.create(payload);
      toast({
        title: 'Checklist Registrado!',
        description: 'Vistoria e checklist completos salvos com sucesso na Mobilização de Transportes.'
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
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-zinc-800">
          <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ClipboardCheck className="text-amber-400" size={22} />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Preencha todos os 22 itens do checklist de pré-uso e inspeção técnica.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">Veículo *</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-xs">
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
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-xs">
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
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-xs">
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
                className="bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Requisitos de Vistoria (22 Itens Completos) */}
          <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Itens do Checklist de Pré-Uso ({items.length} Itens):</span>
              <span className="text-[10px] text-zinc-400">P1..P4 (Conforme) • N1..N4 (Não Conforme)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={it.id} className="flex flex-col justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-100 truncate pr-2">{it.label}</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 rounded text-amber-300 shrink-0 font-medium">
                      {it.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-800/60">
                    {/* Botões Positivos P1..P4 */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-emerald-400 font-bold mr-0.5">P:</span>
                      {[1, 2, 3, 4].map((num) => (
                        <button
                          key={`p-${num}`}
                          type="button"
                          onClick={() => {
                            const copy = [...items];
                            copy[idx].positivo = num;
                            copy[idx].negativo = null;
                            setItems(copy);
                          }}
                          className={`w-6 h-6 text-[10px] font-bold rounded flex items-center justify-center transition-all ${
                            it.positivo === num
                              ? 'bg-emerald-500 text-zinc-950 scale-105 shadow-sm'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          P{num}
                        </button>
                      ))}
                    </div>

                    {/* Botões Negativos N1..N4 */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-rose-400 font-bold mr-0.5">N:</span>
                      {[1, 2, 3, 4].map((num) => (
                        <button
                          key={`n-${num}`}
                          type="button"
                          onClick={() => {
                            const copy = [...items];
                            copy[idx].positivo = null;
                            copy[idx].negativo = num;
                            setItems(copy);
                          }}
                          className={`w-6 h-6 text-[10px] font-bold rounded flex items-center justify-center transition-all ${
                            it.negativo === num
                              ? 'bg-rose-500 text-white scale-105 shadow-sm'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          N{num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-300">Observações Técnicas do Veículo / Vistoria</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Cintos 100% testados. Limpadores de para-brisa trocados. Tacógrafo revisado."
              className="bg-zinc-950 border-zinc-700 text-zinc-100 h-16 text-xs"
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
              {loading ? 'Salvando...' : 'Salvar Checklist Completo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MobilizationInspectionModal;
