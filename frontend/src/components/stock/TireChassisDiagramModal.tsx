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
import { useAuth } from '@/contexts/AuthContext';
import { tireFleetService, VehicleTireChassis, MountedPosition, TireItem } from '@/services/tireFleetService';
import { FrontAxleSecurityApprovalBox } from '@/components/pneus/FrontAxleSecurityApprovalBox';
import { ChassisDiagram } from '@/components/pneus/ChassisDiagram';

interface TireChassisDiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel?: string;
  onSuccess?: () => void;
}

const apiErrorMessage = (error: unknown, fallback: string): string => {
  const e = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};

export const TireChassisDiagramModal: React.FC<TireChassisDiagramModalProps> = ({
  open,
  onOpenChange,
  vehicleId,
  vehiclePlate,
  vehicleModel,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

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
  const [approverUsernameOrEmail, setApproverUsernameOrEmail] = useState('');
  const [approverPassword, setApproverPassword] = useState('');
  const [riskTermAccepted, setRiskTermAccepted] = useState(false);

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
      setDismountKm(String(chassis?.currentKm || (pos.tire.installKm ? pos.tire.installKm + 30000 : 30000)));
      setDismountTreadDepth(pos.tire.currentTreadDepth ? String(pos.tire.currentTreadDepth) : '3.5');
      setShowDismountModal(true);
    } else {
      setSelectedTireId('');
      setMountKm(String(chassis?.currentKm || 0));
      setMountTreadDepth('15.0');
      setApproverUsernameOrEmail(user?.username || user?.email || '');
      setApproverPassword('');
      setRiskTermAccepted(false);
      setShowMountModal(true);
    }
  };

  const selectedAvailableTire = availableTires.find((t) => t.id === selectedTireId);
  const needsFrontAxleApproval =
    Boolean(selectedPosition && selectedPosition.axleNumber === 1) &&
    Boolean(selectedAvailableTire && (selectedAvailableTire.recapCount || 0) > 0);

  const handleConfirmMount = async () => {
    if (!selectedPosition || !selectedTireId) {
      toast({ title: 'Atenção', description: 'Selecione um pneu disponível para montagem.', variant: 'destructive' });
      return;
    }
    if (needsFrontAxleApproval) {
      if (!riskTermAccepted) {
        toast({ title: 'Termo obrigatório', description: 'Marque o Termo de Ciência de Risco.', variant: 'destructive' });
        return;
      }
      if (!approverPassword.trim()) {
        toast({ title: 'Senha obrigatória', description: 'Informe a senha do Gestor/Administrador.', variant: 'destructive' });
        return;
      }
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
        notes: `Montado na posição ${selectedPosition.positionName}`,
        approverUsernameOrEmail: needsFrontAxleApproval ? approverUsernameOrEmail : undefined,
        approverPassword: needsFrontAxleApproval ? approverPassword : undefined,
        riskTermAccepted: needsFrontAxleApproval ? riskTermAccepted : undefined,
      });

      toast({
        title: 'Pneu Montado com Sucesso',
        description: `Pneu alocado na posição ${selectedPosition.positionCode} do veículo ${vehiclePlate}.`
      });

      setShowMountModal(false);
      loadChassisData();
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      toast({
        title: 'Falha ao montar pneu',
        description: apiErrorMessage(error, 'Erro ao processar montagem.'),
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
    } catch (error: unknown) {
      toast({
        title: 'Falha ao desmontar pneu',
        description: apiErrorMessage(error, 'Erro ao processar desmontagem.'),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const rollingPositions = chassis?.positions.filter((p) => (p.axleNumber ?? 0) > 0) ?? [];
  const sparePosition = chassis?.positions.find((p) => p.positionCode === 'ESTEPE' || (p.axleNumber ?? 0) === 0);
  const mountedCount = rollingPositions.filter((p) => p.tire).length;
  const criticalCount = rollingPositions.filter((p) => {
    if (!p.tire || p.tire.currentTreadDepth == null) return false;
    return Number(p.tire.currentTreadDepth) <= 2;
  }).length;
  const effectiveAxleCount =
    chassis?.axleCount || new Set(rollingPositions.map((p) => p.axleNumber)).size || 2;

  const positionWear = (pos: MountedPosition) => {
    if (!pos.tire) {
      return {
        card: 'border-dashed border-gray-700 bg-seguranca-black/40 hover:border-seguranca-yellow/50',
        dot: 'bg-gray-600',
        text: 'text-gray-400',
      };
    }
    const tread = pos.tire.currentTreadDepth != null ? Number(pos.tire.currentTreadDepth) : 15;
    if (tread <= 2) {
      return { card: 'border-red-500/70 bg-red-950/20', dot: 'bg-red-500', text: 'text-red-400' };
    }
    if (tread <= 4) {
      return { card: 'border-amber-500/70 bg-amber-950/20', dot: 'bg-amber-500', text: 'text-amber-400' };
    }
    return { card: 'border-emerald-500/60 bg-emerald-950/15', dot: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const renderPositionCard = (pos: MountedPosition) => {
    const wear = positionWear(pos);
    const tread = pos.tire?.currentTreadDepth != null ? Number(pos.tire.currentTreadDepth) : null;

    return (
      <button
        key={`${pos.axleNumber}-${pos.positionIndex}-${pos.positionCode}`}
        type="button"
        onClick={() => handlePositionClick(pos)}
        className={`text-left rounded-xl border-2 p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${wear.card}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
            {pos.positionCode}
          </span>
          <span className={`h-2 w-2 rounded-full ${wear.dot}`} />
        </div>
        <p className="text-[10px] text-gray-500 truncate mt-0.5">{pos.positionName}</p>

        {pos.tire ? (
          <>
            <p className="text-xs font-bold text-white font-mono truncate mt-1">{pos.tire.serialNumber}</p>
            <div className="flex items-center justify-between gap-1 mt-0.5">
              <span className="text-[10px] text-gray-400 truncate">{pos.tire.brand}</span>
              <span className={`text-[11px] font-semibold ${wear.text}`}>
                {tread !== null ? `${tread.toFixed(1)} mm` : '—'}
              </span>
            </div>
            {pos.tire.recapCount > 0 && (
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded border border-blue-500/40 mt-1 inline-block">
                {pos.tire.recapCount}ª Recap.
              </span>
            )}
          </>
        ) : (
          <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
            <Plus size={12} /> Livre — montar
          </p>
        )}
      </button>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                  <Truck className="text-seguranca-yellow" size={24} />
                  Diagrama do Chassi de Pneus: {vehiclePlate}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {vehicleModel || 'Veículo'} — {chassis?.layoutLabel || 'Mapeamento de pneus por eixo'}
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
              <p>Mapeando chassi do veículo...</p>
            </div>
          ) : chassis ? (
            <div className="space-y-4 my-2">
              {/* Resumo da configuração */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-seguranca-yellow/15 text-seguranca-yellow border border-seguranca-yellow/30 font-mono font-bold">
                  {chassis.chassiType || '4x2'}
                </Badge>
                <Badge className="bg-seguranca-black text-gray-300 border border-gray-700">
                  {chassis.layoutLabel || 'Chassi'}
                </Badge>
                <Badge className="bg-seguranca-black text-gray-300 border border-gray-700">
                  {mountedCount}/{rollingPositions.length} pneus montados
                </Badge>
                {criticalCount > 0 && (
                  <Badge className="bg-red-500/15 text-red-400 border border-red-500/30">
                    {criticalCount} em estado crítico
                  </Badge>
                )}
                <span className="text-[11px] text-gray-500 ml-auto hidden sm:inline">
                  Clique em um pneu para montar ou desmontar
                </span>
              </div>

              {/* Diagrama técnico (vista superior) */}
              <div className="relative rounded-2xl bg-seguranca-black/80 border border-gray-800 p-2 sm:p-5 overflow-hidden">
                <ChassisDiagram
                  positions={rollingPositions}
                  axleCount={effectiveAxleCount}
                  dualRear={Boolean(chassis.dualRear)}
                  tagAxle={chassis.chassiType === '6x2'}
                  chassiType={chassis.chassiType}
                  vehicleType={chassis.vehicleType}
                  onSelectPosition={(position) => {
                    const mounted = rollingPositions.find(
                      (p) => p.positionCode === position.positionCode
                    );
                    if (mounted) handlePositionClick(mounted);
                  }}
                />
              </div>

              {/* Cards das posições (detalhes e ação) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {rollingPositions.map(renderPositionCard)}
                {sparePosition && renderPositionCard(sparePosition)}
              </div>

              {chassis.currentKm > 0 && (
                <p className="text-[11px] text-gray-500 text-right">
                  Odômetro: <strong className="text-gray-300 font-mono">{chassis.currentKm.toLocaleString('pt-BR')} km</strong>
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
              <p>Não foi possível carregar o chassi deste veículo.</p>
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
                <Label className="text-xs text-gray-300">KM Atual do Veículo:</Label>
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

            {needsFrontAxleApproval && selectedAvailableTire && (
              <FrontAxleSecurityApprovalBox
                recapCount={selectedAvailableTire.recapCount || 1}
                approverUsernameOrEmail={approverUsernameOrEmail}
                onChangeApproverUsernameOrEmail={setApproverUsernameOrEmail}
                approverPassword={approverPassword}
                onChangeApproverPassword={setApproverPassword}
                riskTermAccepted={riskTermAccepted}
                onChangeRiskTermAccepted={setRiskTermAccepted}
              />
            )}
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
