import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  CircleDot, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  RefreshCw, 
  Loader2,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tireFleetService, VehicleTireChassis, MountedPosition, TireItem } from '@/services/tireFleetService';

interface TireChassisDiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel?: string;
  onSuccess?: () => void;
}

export const TireChassisDiagramModal: React.FC<TireChassisDiagramModalProps> = ({
  open,
  onOpenChange,
  vehicleId,
  vehiclePlate,
  vehicleModel,
  onSuccess
}) => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [chassis, setChassis] = useState<VehicleTireChassis | null>(null);
  const [availableTires, setAvailableTires] = useState<TireItem[]>([]);

  // Submodais de Montagem e Desmontagem
  const [selectedPosition, setSelectedPosition] = useState<MountedPosition | null>(null);
  const [showMountModal, setShowMountModal] = useState(false);
  const [showDismountModal, setShowDismountModal] = useState(false);

  // Form states
  const [selectedTireId, setSelectedTireId] = useState('');
  const [mountKm, setMountKm] = useState('0');
  const [mountTreadDepth, setMountTreadDepth] = useState('15.0');
  const [dismountKm, setDismountKm] = useState('0');
  const [dismountTreadDepth, setDismountTreadDepth] = useState('3.5');
  const [dismountReason, setDismountReason] = useState('ENVIAR_REFORMA');
  const [submitting, setSubmitting] = useState(false);

  const loadChassisData = async () => {
    if (!vehicleId) return;
    try {
      setLoading(true);
      const [chassisData, availableData] = await Promise.all([
        tireFleetService.getVehicleChassis(vehicleId),
        tireFleetService.getAvailable()
      ]);
      setChassis(chassisData);
      setAvailableTires(Array.isArray(availableData) ? availableData : []);
    } catch (error) {
      console.error('Erro ao carregar mapa do chassi do veículo:', error);
      toast({
        title: 'Erro ao carregar chassi',
        description: 'Não foi possível carregar as posições de pneus deste veículo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && vehicleId) {
      loadChassisData();
    }
  }, [open, vehicleId]);

  const handlePositionClick = (pos: MountedPosition) => {
    setSelectedPosition(pos);
    if (pos.tire) {
      setDismountKm(pos.tire.installKm ? String(pos.tire.installKm + 30000) : '30000');
      setDismountTreadDepth(pos.tire.currentTreadDepth ? String(pos.tire.currentTreadDepth) : '3.5');
      setShowDismountModal(true);
    } else {
      setSelectedTireId('');
      setMountKm('0');
      setMountTreadDepth('15.0');
      setShowMountModal(true);
    }
  };

  const handleConfirmMount = async () => {
    if (!selectedPosition || !selectedTireId) {
      toast({ title: 'Atenção', description: 'Selecione um pneu disponível para montagem.', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      await tireFleetService.mountTire({
        tireId: selectedTireId,
        vehicleId,
        axleNumber: selectedPosition.axleNumber,
        positionIndex: selectedPosition.positionIndex,
        positionCode: selectedPosition.positionCode,
        currentVehicleKm: parseInt(mountKm) || 0,
        treadDepthMm: parseFloat(mountTreadDepth) || 15.0,
        notes: `Montado na posição ${selectedPosition.positionName}`
      });

      toast({
        title: 'Pneu Montado com Sucesso',
        description: `Pneu alocado na posição ${selectedPosition.positionCode} do veículo ${vehiclePlate}.`
      });

      setShowMountModal(false);
      loadChassisData();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Falha ao montar pneu',
        description: error.response?.data?.message || error.message || 'Erro ao processar montagem.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDismount = async () => {
    if (!selectedPosition?.tire) return;
    try {
      setSubmitting(true);
      await tireFleetService.dismountTire({
        tireId: selectedPosition.tire.id,
        currentVehicleKm: parseInt(dismountKm) || 0,
        treadDepthMm: parseFloat(dismountTreadDepth) || 3.0,
        removalReason: dismountReason,
        notes: `Desmontado da posição ${selectedPosition.positionName}. Motivo: ${dismountReason}`
      });

      toast({
        title: 'Pneu Desmontado',
        description: `Pneu ${selectedPosition.tire.serialNumber} removido. Status atualizado para ${dismountReason}.`
      });

      setShowDismountModal(false);
      loadChassisData();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Falha ao desmontar pneu',
        description: error.response?.data?.message || error.message || 'Erro ao processar desmontagem.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPositionByCode = (code: string) => {
    return chassis?.positions.find(p => p.positionCode === code);
  };

  const renderTireSlot = (code: string, label: string) => {
    const pos = getPositionByCode(code);
    if (!pos) return null;

    const tire = pos.tire;
    const isOccupied = !!tire;
    const tread = tire?.currentTreadDepth != null ? Number(tire.currentTreadDepth) : 15.0;
    
    // Status visual por sulco
    let borderClass = 'border-dashed border-gray-600 hover:border-seguranca-yellow';
    let bgClass = 'bg-seguranca-black/50';
    let treadColor = 'text-gray-400';

    if (isOccupied) {
      if (tread <= 2.0) {
        borderClass = 'border-red-500 bg-red-950/30 hover:border-red-400 shadow-sm shadow-red-900/40';
        bgClass = 'bg-red-900/20';
        treadColor = 'text-red-400 font-bold';
      } else if (tread <= 4.0) {
        borderClass = 'border-amber-500 bg-amber-950/30 hover:border-amber-400 shadow-sm shadow-amber-900/40';
        bgClass = 'bg-amber-900/20';
        treadColor = 'text-amber-400 font-semibold';
      } else {
        borderClass = 'border-emerald-500 bg-emerald-950/20 hover:border-emerald-400';
        bgClass = 'bg-emerald-900/20';
        treadColor = 'text-emerald-400 font-semibold';
      }
    }

    return (
      <div 
        onClick={() => handlePositionClick(pos)}
        className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer select-none min-w-[105px] h-[100px] ${borderClass} ${bgClass}`}
      >
        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider absolute top-1.5 left-2">
          {code}
        </span>

        {isOccupied ? (
          <div className="text-center mt-2">
            <span className="font-extrabold text-white text-xs block truncate max-w-[90px]">{tire.serialNumber}</span>
            <span className="text-[10px] text-gray-300 block truncate max-w-[90px]">{tire.brand}</span>
            <div className="mt-1 flex items-center justify-center gap-1">
              <span className={`text-[11px] ${treadColor}`}>{tread.toFixed(1)} mm</span>
            </div>
            {tire.recapCount > 0 && (
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded border border-blue-500/40 mt-0.5 inline-block">
                {tire.recapCount}ª Ref.
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 hover:text-seguranca-yellow mt-1">
            <Plus size={20} className="mb-0.5" />
            <span className="text-[10px] font-medium">Livre</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                  <Truck className="text-seguranca-yellow" size={24} />
                  Diagrama do Chassi de Pneus: {vehiclePlate}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {vehicleModel || 'Ônibus'} — Configuração de Eixos 4x2 (6 Pneus + Estepe)
                </DialogDescription>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={loadChassisData}
                disabled={loading}
                className="border-gray-600 text-gray-300 hover:bg-seguranca-black h-8"
              >
                <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </DialogHeader>

          {/* Legenda de Status de Sulco */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-seguranca-black/60 border border-gray-800 text-xs">
            <span className="text-gray-400 font-semibold">Legenda de Condição:</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Sulco Bom (&gt; 4mm)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Próximo da Reforma (2 - 4mm)
              </span>
              <span className="flex items-center gap-1.5 text-red-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Sulco Crítico (≤ 2mm)
              </span>
              <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full border border-dashed border-gray-400"></span> Vazio
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow mb-2" />
              <p>Mapeando chassi do ônibus...</p>
            </div>
          ) : (
            <div className="relative p-6 rounded-2xl bg-seguranca-black/80 border border-gray-800 flex flex-col items-center gap-8 my-2">
              {/* Contorno Visual do Ônibus (Top-down) */}
              <div className="absolute inset-x-12 inset-y-4 rounded-3xl border border-dashed border-gray-700/60 pointer-events-none flex flex-col justify-between p-3">
                <div className="text-center text-[10px] uppercase font-bold text-gray-600 tracking-widest">
                  Frente do Ônibus (Direção)
                </div>
                <div className="text-center text-[10px] uppercase font-bold text-gray-600 tracking-widest">
                  Traseira do Ônibus
                </div>
              </div>

              {/* EIXO 1 - DIANTEIRO */}
              <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Eixo 1 — Direcional
                </span>
                <div className="w-full flex items-center justify-between px-6">
                  {renderTireSlot('DE', 'Dianteiro Esquerdo')}
                  <div className="h-1 flex-1 mx-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded"></div>
                  {renderTireSlot('DD', 'Dianteiro Direito')}
                </div>
              </div>

              {/* EIXO 2 - TRAÇÃO DUPLA */}
              <div className="relative z-10 w-full max-w-lg flex flex-col items-center mt-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Eixo 2 — Tração Dupla
                </span>
                <div className="w-full flex items-center justify-between px-4">
                  {/* Rodado Duplo Esquerdo */}
                  <div className="flex items-center gap-1.5">
                    {renderTireSlot('TOE', 'Tração Ext. Esq.')}
                    {renderTireSlot('TIE', 'Tração Int. Esq.')}
                  </div>

                  <div className="h-1 flex-1 mx-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded"></div>

                  {/* Rodado Duplo Direito */}
                  <div className="flex items-center gap-1.5">
                    {renderTireSlot('TID', 'Tração Int. Dir.')}
                    {renderTireSlot('TOD', 'Tração Ext. Dir.')}
                  </div>
                </div>
              </div>

              {/* ESTEPE */}
              <div className="relative z-10 flex flex-col items-center mt-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Estepe Reserva
                </span>
                {renderTireSlot('ESTEPE', 'Estepe')}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-gray-700 pt-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-300"
            >
              Fechar Diagrama
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submodal: Montagem de Pneu */}
      <Dialog open={showMountModal} onOpenChange={setShowMountModal}>
        <DialogContent className="max-w-md bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plus className="text-seguranca-yellow" size={18} />
              Montar Pneu na Posição: {selectedPosition?.positionCode}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedPosition?.positionName} • Veículo {vehiclePlate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs text-gray-300">Pneu Disponível no Almoxarifado:</Label>
              <Select value={selectedTireId} onValueChange={setSelectedTireId}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Selecione um pneu livre..." />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-white max-h-56">
                  {availableTires.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400">Nenhum pneu disponível no almoxarifado</div>
                  ) : (
                    availableTires.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.serialNumber} • {t.brand} {t.model} ({t.size}) {t.recapCount > 0 ? `[${t.recapCount}ª Ref.]` : '[Novo]'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-300">KM Atual do Ônibus:</Label>
                <Input
                  type="number"
                  value={mountKm}
                  onChange={e => setMountKm(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-300">Sulco Inicial (mm):</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={mountTreadDepth}
                  onChange={e => setMountTreadDepth(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-white mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-700 pt-3">
            <Button variant="outline" onClick={() => setShowMountModal(false)} className="border-gray-600 text-gray-300">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmMount}
              disabled={submitting || !selectedTireId}
              className="bg-seguranca-yellow hover:bg-yellow-500 text-seguranca-black font-bold"
            >
              {submitting ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <Wrench size={16} className="mr-1.5" />}
              Confirmar Montagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submodal: Desmontagem de Pneu */}
      <Dialog open={showDismountModal} onOpenChange={setShowDismountModal}>
        <DialogContent className="max-w-md bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Wrench className="text-red-400" size={18} />
              Desmontar Pneu: {selectedPosition?.tire?.serialNumber}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Posição {selectedPosition?.positionCode} ({selectedPosition?.positionName}) • {selectedPosition?.tire?.brand}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-300">KM Atual na Remoção:</Label>
                <Input
                  type="number"
                  value={dismountKm}
                  onChange={e => setDismountKm(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-300">Sulco Medido (mm):</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={dismountTreadDepth}
                  onChange={e => setDismountTreadDepth(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-300">Destino / Motivo da Desmontagem:</Label>
              <Select value={dismountReason} onValueChange={setDismountReason}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-white">
                  <SelectItem value="ENVIAR_REFORMA">Enviar para Recapagem (Reforma)</SelectItem>
                  <SelectItem value="ESTOQUE">Devolver ao Estoque (Rodízio)</SelectItem>
                  <SelectItem value="FURO_AVARIA">Avaria / Reparo de Furo</SelectItem>
                  <SelectItem value="DESCARTE_SUCATA">Descarte Definitivo (Sucata)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-700 pt-3">
            <Button variant="outline" onClick={() => setShowDismountModal(false)} className="border-gray-600 text-gray-300">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDismount}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {submitting ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <CheckCircle2 size={16} className="mr-1.5" />}
              Confirmar Desmontagem & Recalcular CPK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
