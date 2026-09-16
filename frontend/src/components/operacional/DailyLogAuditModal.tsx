import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import dailyLogService, {
  DailyLog,
  TELEMETRY_STATUS_LABELS,
  EXTRA_TRIP_REASON_LABELS,
  TelemetryStatus,
} from '@/services/dailyLogService';
import { AlertTriangle, CheckCircle2, FileSignature, PenLine, Satellite } from 'lucide-react';

interface DailyLogAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dailyLog: DailyLog | null;
  onSuccess?: () => void;
}

const fmtPct = (v?: number | null) =>
  typeof v === 'number' ? `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—';

/**
 * PRD 1.0 - Módulo 5: auditoria da Parte Diária — assinatura do Fiscal da
 * Contratante (RF-05.1), conciliação telemetria (RF-05.2) e viagem extra (RF-05.3).
 */
const DailyLogAuditModal: React.FC<DailyLogAuditModalProps> = ({ open, onOpenChange, dailyLog, onSuccess }) => {
  const { toast } = useToast();
  const [inspectorName, setInspectorName] = useState('');
  const [telemetryKm, setTelemetryKm] = useState<string>('');
  const [telemetrySource, setTelemetrySource] = useState('');
  const [signing, setSigning] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    if (open && dailyLog) {
      setInspectorName(dailyLog.inspectorName ?? '');
      setTelemetryKm(dailyLog.telemetryKm != null ? String(dailyLog.telemetryKm) : '');
      setTelemetrySource(dailyLog.telemetrySource ?? '');
    }
  }, [open, dailyLog]);

  if (!dailyLog) return null;

  const handleSign = async () => {
    if (!inspectorName.trim()) {
      toast({ title: 'Atenção', description: 'Informe o nome do fiscal da contratante.', variant: 'destructive' });
      return;
    }
    setSigning(true);
    try {
      await dailyLogService.signByInspector(dailyLog.id, inspectorName.trim());
      toast({
        title: 'Assinado',
        description: 'Parte Diária atestada pelo fiscal — evidência válida para o Boletim de Medição.',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.response?.data?.message || 'Falha ao registrar assinatura.',
        variant: 'destructive',
      });
    } finally {
      setSigning(false);
    }
  };

  const handleReconcile = async () => {
    const km = parseInt(telemetryKm, 10);
    if (!isFinite(km) || km < 0) {
      toast({ title: 'Atenção', description: 'Informe o KM da telemetria.', variant: 'destructive' });
      return;
    }
    setReconciling(true);
    try {
      const updated = await dailyLogService.importTelemetry(dailyLog.id, km, telemetrySource || undefined);
      if (updated.telemetryStatus === 'DIVERGENT') {
        toast({
          title: 'Divergência detectada!',
          description: `Papel ${dailyLog.totalKmRun} km × telemetria ${km} km (${fmtPct(updated.telemetryDiffPct)}). Investigar antes do faturamento.`,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Conciliado', description: `Divergência de ${fmtPct(updated.telemetryDiffPct)} — dentro da tolerância.` });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.response?.data?.message || 'Falha na conciliação.',
        variant: 'destructive',
      });
    } finally {
      setReconciling(false);
    }
  };

  const telemetryStatus = dailyLog.telemetryStatus ?? 'NOT_RECONCILED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" /> Parte Diária — {dailyLog.vehiclePlate} ·{' '}
            {new Date(dailyLog.date).toLocaleDateString('pt-BR')}
          </DialogTitle>
          <DialogDescription>
            Talão {dailyLog.bookSequentialNumber ? `#${dailyLog.bookSequentialNumber}` : '—'} ·
            {' '}{dailyLog.totalKmRun} km rodados · {dailyLog.route || '—'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="assinatura">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
            <TabsTrigger value="telemetria">Telemetria</TabsTrigger>
            <TabsTrigger value="viagem-extra">Viagem Extra</TabsTrigger>
          </TabsList>

          {/* ===== RF-05.1: Assinatura ===== */}
          <TabsContent value="assinatura" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Motorista</Label>
                <p>{dailyLog.driverName || '—'}</p>
              </div>
              <div>
                <Label>Assinatura do Motorista</Label>
                {dailyLog.driverSignedAt ? (
                  <Badge variant="default" className="mt-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Assinada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-1">Pendente</Badge>
                )}
              </div>
            </div>
            {dailyLog.activityDescription && (
              <div>
                <Label>Atividade</Label>
                <p className="text-sm text-muted-foreground">{dailyLog.activityDescription}</p>
              </div>
            )}
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <PenLine className="h-4 w-4" /> Conferência do Fiscal da Contratante
              </p>
              {dailyLog.inspectorSignedAt ? (
                <div className="text-sm space-y-1">
                  <p>
                    Assinada por <strong>{dailyLog.inspectorName}</strong> em{' '}
                    {new Date(dailyLog.inspectorSignedAt).toLocaleString('pt-BR')}
                  </p>
                  <Badge variant="default">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Evidência válida para faturamento
                  </Badge>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Nome do Fiscal *</Label>
                    <Input
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      placeholder="Fiscal da contratante na obra"
                    />
                  </div>
                  <Button onClick={handleSign} disabled={signing}>
                    {signing ? 'Assinando...' : 'Confirmar e Assinar'}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          {/* ===== RF-05.2: Telemetria ===== */}
          <TabsContent value="telemetria" className="space-y-4 pt-2">
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status da conciliação</span>
                <Badge
                  variant={
                    telemetryStatus === 'DIVERGENT'
                      ? 'destructive'
                      : telemetryStatus === 'WITHIN_TOLERANCE'
                        ? 'default'
                        : 'outline'
                  }
                >
                  {telemetryStatus === 'DIVERGENT' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {TELEMETRY_STATUS_LABELS[telemetryStatus as TelemetryStatus]}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>KM no papel</Label>
                  <p className="font-medium">{dailyLog.totalKmRun} km</p>
                </div>
                <div>
                  <Label>KM telemetria</Label>
                  <p className="font-medium">{dailyLog.telemetryKm != null ? `${dailyLog.telemetryKm} km` : '—'}</p>
                </div>
                <div>
                  <Label>Divergência</Label>
                  <p className={`font-medium ${telemetryStatus === 'DIVERGENT' ? 'text-red-600' : ''}`}>
                    {dailyLog.telemetryDiffKm != null ? `${dailyLog.telemetryDiffKm > 0 ? '+' : ''}${dailyLog.telemetryDiffKm} km` : '—'}
                    {' '}({fmtPct(dailyLog.telemetryDiffPct)})
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Importar KM do Rastreador Satelital</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={telemetryKm}
                  onChange={(e) => setTelemetryKm(e.target.value)}
                  placeholder="KM rodado pela telemetria"
                />
                <Input
                  value={telemetrySource}
                  onChange={(e) => setTelemetrySource(e.target.value)}
                  placeholder="Origem (Sascar, Onixsat...)"
                  className="w-48"
                />
              </div>
              <Button onClick={handleReconcile} disabled={reconciling}>
                <Satellite className="h-4 w-4 mr-2" />
                {reconciling ? 'Conciliando...' : 'Conciliar'}
              </Button>
              <p className="text-xs text-muted-foreground">
                RF-05.2: divergências superiores a 5% são apontadas para investigação antes do faturamento.
              </p>
            </div>
          </TabsContent>

          {/* ===== RF-05.3: Viagem Extra ===== */}
          <TabsContent value="viagem-extra" className="space-y-4 pt-2">
            {dailyLog.extraTrip ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 space-y-2">
                <p className="font-medium flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" /> Viagem Extra
                </p>
                <p className="text-sm">
                  Motivo: <strong>{dailyLog.extraTripReason ? EXTRA_TRIP_REASON_LABELS[dailyLog.extraTripReason] : '—'}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Será enviada automaticamente à tabela de Viagens Extras do Boletim de Medição (M5 → M7).
                </p>
              </div>
            ) : (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Viagem dentro da escala contratada
                </p>
                <p className="text-xs text-muted-foreground">
                  Fins de semana, feriados e horários fora da escala são classificados automaticamente (RF-05.3).
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DailyLogAuditModal;
