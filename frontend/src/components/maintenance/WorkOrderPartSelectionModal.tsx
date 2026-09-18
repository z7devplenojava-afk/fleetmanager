import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  ShoppingCart,
  Clock,
  ShieldAlert,
  Loader2,
  Car,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  materialRequisitionService,
  StockItemAvailability,
  CreateRequisitionPayload,
  RequisitionUrgency
} from '@/services/materialRequisitionService';

interface WorkOrderPartSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId?: string;
  workOrderNumber?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  stockItems: Array<{
    id: string;
    code: string;
    name: string;
    currentQuantity: number;
    unitCost?: number;
  }>;
  onPartReserved?: (part: { stockItemId: string; name: string; code: string; quantity: number; unitPrice: number }) => void;
  onRequisitionCreated?: () => void;
}

export const WorkOrderPartSelectionModal: React.FC<WorkOrderPartSelectionModalProps> = ({
  isOpen,
  onClose,
  workOrderId,
  workOrderNumber,
  vehicleId,
  vehiclePlate,
  stockItems,
  onPartReserved,
  onRequisitionCreated
}) => {
  const { toast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [checkingStock, setCheckingStock] = useState<boolean>(false);
  const [availability, setAvailability] = useState<StockItemAvailability | null>(null);

  // Form State
  const [quantity, setQuantity] = useState<number>(1);
  const [mode, setMode] = useState<'SELECT' | 'REQUISITION'>('SELECT');
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemCode, setCustomItemCode] = useState<string>('');
  const [urgency, setUrgency] = useState<RequisitionUrgency>('NORMAL');
  const [justification, setJustification] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (selectedItemId) {
      checkAvailability(selectedItemId);
    } else {
      setAvailability(null);
    }
  }, [selectedItemId]);

  const checkAvailability = async (itemId: string) => {
    try {
      setCheckingStock(true);
      const res = await materialRequisitionService.checkAvailability(itemId, workOrderId);
      setAvailability(res);
      const chosen = stockItems.find((s) => s.id === itemId);
      if (chosen) {
        setCustomItemName(chosen.name);
        setCustomItemCode(chosen.code);
      }
    } catch (error) {
      console.error('Erro ao verificar estoque:', error);
      toast({
        title: 'Erro ao verificar disponibilidade',
        description: 'Não foi possível consultar o saldo e reservas do item.',
        variant: 'destructive'
      });
    } finally {
      setCheckingStock(false);
    }
  };

  const handleDirectReservation = async () => {
    if (!selectedItemId || !workOrderId || !availability) return;
    try {
      setSubmitting(true);
      await materialRequisitionService.reserveStockDirectly(
        workOrderId,
        selectedItemId,
        quantity,
        `Reserva direta para OS ${workOrderNumber || ''}`
      );

      const chosen = stockItems.find((s) => s.id === selectedItemId);
      toast({
        title: 'Peça Reservada com Sucesso!',
        description: `${quantity}x ${chosen?.name} alocado(s) para este veículo/OS.`
      });

      if (onPartReserved && chosen) {
        onPartReserved({
          stockItemId: chosen.id,
          name: chosen.name,
          code: chosen.code,
          quantity: quantity,
          unitPrice: chosen.unitCost || 0
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao reservar peça',
        description: error?.response?.data?.message || 'Saldo livre insuficiente para reserva.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      toast({
        title: 'Justificativa Obrigatória',
        description: 'Informe o motivo da solicitação/requisição da peça.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateRequisitionPayload = {
        workOrderId,
        vehicleId,
        stockItemId: selectedItemId || undefined,
        itemName: customItemName,
        itemCode: customItemCode,
        quantity,
        urgency,
        justification
      };

      await materialRequisitionService.createRequisition(payload);

      toast({
        title: 'Requisição ao Almoxarifado Criada!',
        description: `Solicitação de compra aberta para ${customItemName} com prioridade ${urgency}.`
      });

      if (onRequisitionCreated) {
        onRequisitionCreated();
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar requisição',
        description: error?.response?.data?.message || 'Falha ao salvar a requisição.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-zinc-100">
            <Package className="w-5 h-5 text-amber-500" />
            Adicionar Peça / Requisição ao Almoxarifado
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            OS: <span className="font-semibold text-zinc-200">{workOrderNumber || 'OS Atual'}</span> | Veículo:{' '}
            <span className="font-semibold text-zinc-200">{vehiclePlate || 'N/D'}</span>
          </DialogDescription>
        </DialogHeader>

        {mode === 'SELECT' ? (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-300 font-medium">Selecione o Item do Estoque / Almoxarifado</Label>
              <select
                className="w-full mt-1.5 p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:ring-2 focus:ring-amber-500"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">-- Selecione uma peça do estoque --</option>
                {stockItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.code}] {item.name} — Físico: {item.currentQuantity} un
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Não encontrou a peça no cadastro?</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-zinc-700 hover:bg-zinc-800 text-amber-400 text-xs"
                onClick={() => {
                  setMode('REQUISITION');
                  setSelectedItemId('');
                  setAvailability(null);
                }}
              >
                + Solicitar Item Não Cadastrado
              </Button>
            </div>

            {checkingStock && (
              <div className="flex items-center justify-center p-6 bg-zinc-800/40 rounded-lg">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="ml-2 text-sm text-zinc-400">Consultando disponibilidade e reservas...</span>
              </div>
            )}

            {availability && (
              <div className="space-y-4">
                {/* Resumo de Estoque */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-zinc-800/60 rounded-lg border border-zinc-700/60">
                    <span className="text-xs text-zinc-400">Saldo Físico</span>
                    <p className="text-lg font-bold text-zinc-100">{availability.currentQuantity} un</p>
                  </div>
                  <div className="p-3 bg-zinc-800/60 rounded-lg border border-zinc-700/60">
                    <span className="text-xs text-zinc-400">Em Uso / Reservado</span>
                    <p className="text-lg font-bold text-amber-400">{availability.reservedQuantity} un</p>
                  </div>
                  <div className="p-3 bg-zinc-800/60 rounded-lg border border-zinc-700/60">
                    <span className="text-xs text-zinc-400">Saldo Livre Imediato</span>
                    <p
                      className={`text-lg font-bold ${
                        availability.availableFreeQuantity > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {availability.availableFreeQuantity} un
                    </p>
                  </div>
                </div>

                {/* ALERTA DE CONFLITO DE RESERVA */}
                {availability.hasConflict && (
                  <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-lg space-y-2">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-300">
                          Peça em Uso / Já Reservada para Outro Veículo
                        </h4>
                        <p className="text-xs text-zinc-300 mt-1">
                          Este item possui saldo físico, porém está <strong className="text-amber-200">reservado</strong> para as seguintes Ordens de Serviço:
                        </p>
                        <div className="mt-2 space-y-1">
                          {availability.activeReservations.map((res, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-black/40 px-2.5 py-1.5 rounded border border-amber-500/20">
                              <span className="font-semibold text-zinc-200">{res.workOrderNumber}</span>
                              <span className="text-zinc-400">Veículo: {res.vehiclePlate || 'N/D'}</span>
                              <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-400">
                                {res.quantityReserved} un reservada(s)
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantidade a utilizar */}
                <div>
                  <Label className="text-zinc-300 text-xs font-medium">Quantidade Necessária</Label>
                  <Input
                    type="number"
                    min="1"
                    className="w-32 mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                {/* Ações baseadas na disponibilidade */}
                <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                  {availability.availableFreeQuantity >= quantity ? (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5"
                      onClick={handleDirectReservation}
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Reservar e Alocar para esta OS Agora
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5"
                      onClick={() => setMode('REQUISITION')}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Solicitar Compra / Requisição ao Almoxarifado
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreateRequisition} className="space-y-4 py-2">
            <div className="p-3 bg-amber-950/30 border border-amber-600/30 rounded-lg flex items-start gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300">
                <span className="font-bold text-amber-300">Abertura de Requisição ao Almoxarifado / Solicitação de Compra</span>
                <p className="mt-0.5">
                  Ao confirmar, o Almoxarifado iniciará o processo das <strong>3 Cotações de Fornecedores</strong> com avaliação de menor preço, condições 30/60/90 dias e entrega.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300 text-xs font-medium">Nome da Peça / Item *</Label>
                <Input
                  required
                  placeholder="Ex: Correia Dentada, Filtro de Óleo, Pastilha de Freio..."
                  className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-zinc-300 text-xs font-medium">Código / Referência</Label>
                <Input
                  placeholder="Ex: CT-1044 / 940082"
                  className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                  value={customItemCode}
                  onChange={(e) => setCustomItemCode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300 text-xs font-medium">Quantidade Necessária *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <Label className="text-zinc-300 text-xs font-medium">Nível de Urgência *</Label>
                <select
                  className="w-full mt-1 p-2 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as RequisitionUrgency)}
                >
                  <option value="NORMAL">Normal (SLA Padrão: até 72h)</option>
                  <option value="EMERGENCIA">🚨 Emergencial (SLA Expresso: 4h a 24h)</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-zinc-300 text-xs font-medium">
                Justificativa da Requisição / Compra * (Obrigatório)
              </Label>
              <Textarea
                required
                rows={3}
                placeholder="Explique detalhadamente o motivo da requisição (ex: desgaste excessivo, quebra na rota, parada de emergência do veículo...)"
                className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100 text-sm"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 border-t border-zinc-800 flex justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-400 hover:text-zinc-200"
                onClick={() => setMode('SELECT')}
              >
                Voltar à Seleção
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                Emitir Requisição ao Almoxarifado
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
