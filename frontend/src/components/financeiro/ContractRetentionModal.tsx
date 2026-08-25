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
      <DialogContent className="max-w-3xl bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator className="h-6 w-6" />
            </div>
            {retention ? 'Editar Retenção Contratual' : 'Nova Retenção Contratual'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            Preencha os valores de medição, descontos e taxa de retenção de garantia contratual
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Boletim de Medição (Opcional)</Label>
              <Select value={formData.measurementId} onValueChange={handleMeasurementChange}>
                <SelectTrigger className="bg-seguranca-graphite border-gray-600">
                  <SelectValue placeholder="Selecione a medição" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                  {measurements.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.contractNumber} - {formatCurrency(m.subtotal)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={formData.clientId} onValueChange={(val) => setFormData(prev => ({ ...prev, clientId: val }))}>
                <SelectTrigger className="bg-seguranca-graphite border-gray-600">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Contrato</Label>
              <Select value={formData.contractId} onValueChange={(val) => setFormData(prev => ({ ...prev, contractId: val }))}>
                <SelectTrigger className="bg-seguranca-graphite border-gray-600">
                  <SelectValue placeholder="Selecione o contrato" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                  {contracts.map(ct => (
                    <SelectItem key={ct.id} value={ct.id}>
                      {ct.contractNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mês de Referência</Label>
              <Input
                type="month"
                value={formData.referenceMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceMonth: e.target.value }))}
                className="bg-seguranca-graphite border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as RetentionStatus }))}>
                <SelectTrigger className="bg-seguranca-graphite border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value={RetentionStatus.RETIDO}>Retido</SelectItem>
                  <SelectItem value={RetentionStatus.LIBERADO}>Liberado / Devolvido</SelectItem>
                  <SelectItem value={RetentionStatus.FATURADO}>Faturado</SelectItem>
                  <SelectItem value={RetentionStatus.CANCELADO}>Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção de Valores Financeiros e Cálculos */}
          <Card className="bg-gray-800 border-gray-700 p-4">
            <h4 className="text-sm font-semibold text-seguranca-yellow mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Valores e Cálculo da Retenção
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor Medido Bruto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.measuredValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, measuredValue: e.target.value }))}
                  className="bg-seguranca-graphite border-gray-600 text-green-400 font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Desconto RMU (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rmuDiscount}
                  onChange={(e) => setFormData(prev => ({ ...prev, rmuDiscount: e.target.value }))}
                  className="bg-seguranca-graphite border-gray-600 text-red-400 font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label>Taxa Retenção (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.retentionRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, retentionRate: e.target.value }))}
                  className="bg-seguranca-graphite border-gray-600 text-yellow-400 font-bold"
                />
              </div>
            </div>

            {/* Resultado do Cálculo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
              <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
                <div className="text-xs text-yellow-400 font-medium">Valor Retenção Garantia ({formData.retentionRate}%)</div>
                <div className="text-xl font-bold text-yellow-400">{formatCurrency(calculatedRetentionVal)}</div>
              </div>

              <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
                <div className="text-xs text-emerald-400 font-medium">Valor Líquido a Faturar</div>
                <div className="text-xl font-bold text-emerald-400">{formatCurrency(calculatedNetInvoicedVal)}</div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Prevista de Liberação</Label>
              <Input
                type="date"
                value={formData.expectedReleaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedReleaseDate: e.target.value }))}
                className="bg-seguranca-graphite border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Liberação Real</Label>
              <Input
                type="date"
                value={formData.actualReleaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, actualReleaseDate: e.target.value }))}
                className="bg-seguranca-graphite border-gray-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-seguranca-graphite border-gray-600"
              placeholder="Observações contratuais sobre a retenção..."
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-seguranca-red hover:bg-seguranca-darkred">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {retention ? 'Atualizar Retenção' : 'Salvar Retenção'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
