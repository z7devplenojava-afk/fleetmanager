import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Calculator, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { clientService } from '@/services/clientService';
import { contractService, Contract } from '@/services/contractService';
import { measurementService } from '@/services/measurementService';
import { contractRetentionService } from '@/services/contractRetentionService';
import { ContractRetention, RetentionStatus } from '@/types/contractRetention';
import { Client } from '@/types/client';
import { MeasurementBulletin } from '@/types/measurement';

interface ContractRetentionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retention?: ContractRetention;
  onSuccess: () => void;
}

export const ContractRetentionModal: React.FC<ContractRetentionModalProps> = ({
  open,
  onOpenChange,
  retention,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementBulletin[]>([]);

  const [formData, setFormData] = useState({
    clientId: '',
    contractId: '',
    measurementId: '',
    referenceMonth: '',
    measuredValue: '0',
    rmuDiscount: '0',
    retentionRate: '3',
    status: RetentionStatus.RETIDO,
    expectedReleaseDate: '',
    actualReleaseDate: '',
    notes: ''
  });

  // Valores calculados em tempo real
  const measuredVal = parseFloat(formData.measuredValue) || 0;
  const rmuDisc = parseFloat(formData.rmuDiscount) || 0;
  const ratePct = parseFloat(formData.retentionRate) || 0;

  const calculatedRetentionVal = (measuredVal * (ratePct / 100));
  const calculatedNetInvoicedVal = (measuredVal - rmuDisc - calculatedRetentionVal);

  useEffect(() => {
    if (open) {
      loadSelectsData();
      if (retention) {
        setFormData({
          clientId: retention.clientId || '',
          contractId: retention.contractId || '',
          measurementId: retention.measurementId || '',
          referenceMonth: retention.referenceMonth || '',
          measuredValue: retention.measuredValue?.toString() || '0',
          rmuDiscount: retention.rmuDiscount?.toString() || '0',
          retentionRate: retention.retentionRate?.toString() || '3',
          status: retention.status || RetentionStatus.RETIDO,
          expectedReleaseDate: retention.expectedReleaseDate || '',
          actualReleaseDate: retention.actualReleaseDate || '',
          notes: retention.notes || ''
        });
      } else {
        setFormData({
          clientId: '',
          contractId: '',
          measurementId: '',
          referenceMonth: new Date().toISOString().substring(0, 7),
          measuredValue: '0',
          rmuDiscount: '0',
          retentionRate: '3',
          status: RetentionStatus.RETIDO,
          expectedReleaseDate: '',
          actualReleaseDate: '',
          notes: ''
        });
      }
    }
  }, [open, retention]);

  const loadSelectsData = async () => {
    try {
      setLoading(true);
      const [clientsData, contractsData, measurementsData] = await Promise.all([
        clientService.getAllClients(),
        contractService.getContracts(),
        measurementService.getBulletins()
      ]);
      setClients(clientsData);
      setContracts(contractsData);
      setMeasurements(measurementsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMeasurementChange = (measurementId: string) => {
    const found = measurements.find(m => m.id === measurementId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        measurementId,
        clientId: found.clientId || prev.clientId,
        contractId: found.contractId || prev.contractId,
        measuredValue: found.subtotal?.toString() || prev.measuredValue
      }));
    } else {
      setFormData(prev => ({ ...prev, measurementId }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.measuredValue || parseFloat(formData.measuredValue) <= 0) {
      toast({
        title: "Atenção",
        description: "Informe um Valor Medido válido maior que zero.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        clientId: formData.clientId || undefined,
        contractId: formData.contractId || undefined,
        measurementId: formData.measurementId || undefined,
        referenceMonth: formData.referenceMonth,
        measuredValue: parseFloat(formData.measuredValue) || 0,
        rmuDiscount: parseFloat(formData.rmuDiscount) || 0,
        retentionRate: parseFloat(formData.retentionRate) || 3,
        status: formData.status,
        expectedReleaseDate: formData.expectedReleaseDate || undefined,
        actualReleaseDate: formData.actualReleaseDate || undefined,
        notes: formData.notes
      };

      if (retention && retention.id) {
        await contractRetentionService.update(retention.id, payload);
        toast({ title: "Sucesso", description: "Retenção contratual atualizada com sucesso!" });
      } else {
        await contractRetentionService.create(payload);
        toast({ title: "Sucesso", description: "Retenção contratual criada com sucesso!" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao salvar retenção:', err);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a retenção contratual.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 shrink-0">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {retention ? 'Editar Retenção Contratual' : 'Nova Retenção Contratual'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Preencha os valores de medição, descontos e taxa de retenção de garantia contratual
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Cliente e Medição */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-slate-300">
                Boletim de Medição (Opcional)
              </Label>
              <Select value={formData.measurementId} onValueChange={handleMeasurementChange}>
                <SelectTrigger className="h-11 sm:h-10 bg-slate-900 border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl">
                  <SelectValue placeholder="Selecione a medição" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-[200px]">
                  {measurements.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.contractNumber} - {formatCurrency(m.subtotal)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-slate-300">Cliente</Label>
              <Select value={formData.clientId} onValueChange={(val) => setFormData(prev => ({ ...prev, clientId: val }))}>
                <SelectTrigger className="h-11 sm:h-10 bg-slate-900 border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-[200px]">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contrato, Mês e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-slate-300">Contrato</Label>
              <Select value={formData.contractId} onValueChange={(val) => setFormData(prev => ({ ...prev, contractId: val }))}>
                <SelectTrigger className="h-11 sm:h-10 bg-slate-900 border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl">
                  <SelectValue placeholder="Selecione o contrato" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-[200px]">
                  {contracts.map(ct => (
                    <SelectItem key={ct.id} value={ct.id}>
                      {ct.contractNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-slate-300">Mês de Referência</Label>
              <Input
                type="month"
                value={formData.referenceMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceMonth: e.target.value }))}
                className="h-11 sm:h-10 bg-slate-900 border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as RetentionStatus }))}>
                <SelectTrigger className="h-11 sm:h-10 bg-slate-900 border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value={RetentionStatus.RETIDO}>Retido</SelectItem>
                  <SelectItem value={RetentionStatus.LIBERADO}>Liberado / Devolvido</SelectItem>
                  <SelectItem value={RetentionStatus.FATURADO}>Faturado</SelectItem>
                  <SelectItem value={RetentionStatus.CANCELADO}>Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção de Valores Financeiros e Cálculos */}
          <Card className="bg-slate-900/90 border border-slate-800/90 p-3.5 sm:p-4 rounded-xl shadow-inner space-y-4">
            <h4 className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Valores e Cálculo da Retenção
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-300">Valor Medido Bruto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.measuredValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, measuredValue: e.target.value }))}
                  className="h-11 sm:h-10 bg-slate-950 border-slate-800 text-emerald-400 font-bold text-sm sm:text-base rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-300">Desconto RMU (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rmuDiscount}
                  onChange={(e) => setFormData(prev => ({ ...prev, rmuDiscount: e.target.value }))}
                  className="h-11 sm:h-10 bg-slate-950 border-slate-800 text-red-400 font-bold text-sm sm:text-base rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-300">Taxa Retenção (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.retentionRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, retentionRate: e.target.value }))}
                  className="h-11 sm:h-10 bg-slate-950 border-slate-800 text-amber-400 font-bold text-sm sm:text-base rounded-xl"
                />
              </div>
            </div>

            {/* Resultado do Cálculo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 flex flex-col justify-between">
                <div className="text-[11px] sm:text-xs text-amber-400 font-semibold uppercase tracking-wider">
                  Valor Retenção Garantia ({formData.retentionRate}%)
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-400 mt-1">
                  {formatCurrency(calculatedRetentionVal)}
                </div>
              </div>

              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
                <div className="text-[11px] sm:text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Valor Líquido a Faturar
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
                  {formatCurrency(calculatedNetInvoicedVal)}
                </div>
              </div>
            </div>
          </Card>

          {/* Datas de Liberação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-slate-300">Data Prevista de Liberação</Label>
              <Input
                type="date"
                value={formData.expectedReleaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedReleaseDate: e.target.value }))}
                className="h-11 sm:h-10 bg-slate-900 border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-slate-300">Data de Liberação Real</Label>
              <Input
                type="date"
                value={formData.actualReleaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, actualReleaseDate: e.target.value }))}
                className="h-11 sm:h-10 bg-slate-900 border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium text-slate-300">Observações</Label>
            <Textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-slate-900 border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl resize-none"
              placeholder="Observações contratuais sobre a retenção..."
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto h-11 sm:h-10 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto h-11 sm:h-10 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {retention ? 'Atualizar Retenção' : 'Salvar Retenção'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
