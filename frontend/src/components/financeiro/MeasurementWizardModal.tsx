import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calculator, FileText, CheckCircle2, AlertTriangle, Plus, Trash2, ArrowRight, ArrowLeft, Loader2, DollarSign, Calendar, Building, Layers } from 'lucide-react';
import { measurementService } from '@/services/measurementService';
import { clientService } from '@/services/clientService';
import { fleetService } from '@/services/fleetService';
import { contractService } from '@/services/contractService';
import { Client } from '@/types/employee';
import { Vehicle } from '@/types/fleet';

interface MeasurementWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MeasurementWizardModal: React.FC<MeasurementWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Step 1: Contrato e Período
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>('');
  const [obraName, setObraName] = useState<string>('OBRA TALUDE');
  const [periodStart, setPeriodStart] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 21).toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString().split('T')[0]);
  const [baseDays, setBaseDays] = useState<number>(30);

  // Step 2: Apontamento e Veículos
  const [pointings, setPointings] = useState<any[]>([]);

  // Step 3: Excedentes e Descontos
  const [surpluses, setSurpluses] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [cuts, setCuts] = useState<any[]>([]);

  // Step 4: NFE / CTE
  const [nfNumber, setNfNumber] = useState<string>('');
  const [accessKey, setAccessKey] = useState<string>('');
  const [nfAmount, setNfAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [rawClients, vehicleList] = await Promise.all([
        clientService.getAllClients().catch(() => []),
        fleetService.getVehicles().catch(() => [])
      ]);
      const normalizedClients = Array.isArray(rawClients) ? rawClients : (rawClients as any)?.content || [];
      setClients(normalizedClients);
      setVehicles(Array.isArray(vehicleList) ? vehicleList : (vehicleList as any)?.content || []);

      // Preencher apontamentos iniciais baseados nos veículos ativos
      if (vehicleList && vehicleList.length > 0) {
        const initialPointings = vehicleList.slice(0, 10).map((v: any) => ({
          vehicleId: v.id,
          vehiclePlate: v.placa || 'ABC-1234',
          vehicleModel: `${v.marca || ''} ${v.modelo || ''}`.trim() || 'Ônibus Executivo',
          daysExpected: 30,
          daysWorked: 30,
          daysStopped: 0,
          stopReason: '',
          dailyRate: 1100.00
        }));
        setPointings(initialPointings);
      } else {
        setPointings([
          { vehiclePlate: 'RUP-3F09', vehicleModel: 'Ônibus Comil M.Benz', daysExpected: 30, daysWorked: 23.5, daysStopped: 6.5, stopReason: 'Manutenção Preventiva', dailyRate: 1050.00 },
          { vehiclePlate: 'ARU-1120', vehicleModel: 'Ônibus Mercedes-Benz', daysExpected: 30, daysWorked: 30.0, daysStopped: 0, stopReason: '', dailyRate: 1100.00 }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientChange = async (clientId: string) => {
    setSelectedClientId(clientId);
    try {
      const rawContracts = await contractService.getContracts({ clientId }).catch(() => []);
      const contractsList = Array.isArray(rawContracts) ? rawContracts : (rawContracts as any)?.content || [];
      if (contractsList.length > 0) {
        const firstContract = contractsList[0];
        setContractNumber(firstContract.contractNumber || 'CT-2024/001');
        setObraName(firstContract.description || firstContract.unitName || 'OBRA TALUDE');
      } else {
        const selectedClient = clients.find(c => c.id === clientId);
        setContractNumber(`CT-2024/${selectedClient?.name?.substring(0, 6).toUpperCase() || 'FM2C'}`);
        setObraName('OBRA TALUDE / OPERACIONAL');
      }
    } catch (err) {
      console.warn('Erro ao carregar contrato do cliente:', err);
    }
  };

  const calculateSubtotalServices = () => {
    return pointings.reduce((acc, p) => acc + (p.daysWorked * p.dailyRate), 0);
  };

  const calculateTotalCuts = () => {
    return pointings.reduce((acc, p) => acc + (p.daysStopped * p.dailyRate), 0) + cuts.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
  };

  const calculateTotalSurpluses = () => {
    return surpluses.reduce((acc, s) => acc + (parseFloat(s.quantity || 0) * parseFloat(s.unitPrice || 0)), 0);
  };

  const calculateTotalDiscounts = () => {
    return discounts.reduce((acc, d) => acc + parseFloat(d.amount || 0), 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotalServices() + calculateTotalSurpluses() - calculateTotalCuts() - calculateTotalDiscounts();
  };

  const handleAddSurplus = () => {
    setSurpluses([...surpluses, { type: 'KM_EXCEDENTE', description: 'KM Adicional Obra', quantity: 100, unitPrice: 4.50 }]);
  };

  const handleAddDiscount = () => {
    setDiscounts([...discounts, { type: 'PENALIDADE', reason: 'Atraso na liberação da frota', amount: 500.00 }]);
  };

  const handleGenerateMeasurement = async () => {
    try {
      setIsLoading(true);
      const selectedClient = clients.find(c => c.id === selectedClientId);

      const bulletinPayload = {
        companyName: 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
        contractNumber: contractNumber || 'CT-2024/001',
        clientId: selectedClientId || undefined,
        periodStart,
        periodEnd,
        elaboratedBy: 'José Ramos',
        measuredBy: 'Gestão de Frotas',
        notes: `Medição gerada via Assistente Automatizado (PRD 1.0) - Obra: ${obraName}`,
        items: pointings.map((p, idx) => ({
          itemNumber: idx + 1,
          category: 'REGULAR_SERVICE',
          description: `Locação de Veículo ${p.vehiclePlate} (${p.vehicleModel})`,
          quantity: p.daysWorked,
          unitPrice: p.dailyRate,
          totalPrice: p.daysWorked * p.dailyRate
        }))
      };

      const bulletin = await measurementService.createBulletin(bulletinPayload as any);

      // Vincular NFE/CTE se preenchida
      if (nfNumber && bulletin?.id) {
        await measurementService.saveInvoice(bulletin.id, {
          invoiceType: 'NFE',
          number: nfNumber,
          accessKey: accessKey || undefined,
          amount: parseFloat(nfAmount) || calculateGrandTotal(),
          issuerName: selectedClient?.name || 'Cliente'
        }).catch(err => console.warn('Erro ao salvar NFE:', err));
      }

      // Salvar versão inicial v1 imutável
      if (bulletin?.id) {
        const snapshot = JSON.stringify({
          bulletin,
          pointings,
          surpluses,
          discounts,
          grandTotal: calculateGrandTotal()
        });
        await measurementService.saveVersion(bulletin.id, 'Criação inicial da medição v1 (Prévia Gerada)', 'José Ramos', snapshot).catch(err => console.warn('Erro ao criar versão:', err));
      }

      toast({
        title: 'Medição Gerada com Sucesso!',
        description: `Medição ${contractNumber || 'CT-2024/001'} gerada com valor total de R$ ${calculateGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao gerar medição:', error);
      toast({
        title: 'Erro na Geração',
        description: error.message || 'Ocorreu um erro ao gerar a medição.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-seguranca-lightgray">
            <Calculator className="h-6 w-6 text-seguranca-yellow" />
            Assistente de Geração de Medição (PRD 1.0)
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Passo {step} de 4 — {step === 1 ? 'Contrato e Período' : step === 2 ? 'Apontamentos de Veículos' : step === 3 ? 'Cortes, Excedentes e Descontos' : 'Revisão, NFE/CTE e Validação'}
          </DialogDescription>
        </DialogHeader>

        {/* Progresso de Etapas */}
        <div className="flex justify-between items-center bg-seguranca-black p-3 rounded-lg border border-gray-700 my-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${step === 1 ? 'bg-seguranca-yellow text-seguranca-black' : 'bg-gray-800 text-gray-400'}`}>1. Contrato & Período</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${step === 2 ? 'bg-seguranca-yellow text-seguranca-black' : 'bg-gray-800 text-gray-400'}`}>2. Apontamentos</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${step === 3 ? 'bg-seguranca-yellow text-seguranca-black' : 'bg-gray-800 text-gray-400'}`}>3. Ajustes</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${step === 4 ? 'bg-seguranca-yellow text-seguranca-black' : 'bg-gray-800 text-gray-400'}`}>4. Prévia & NFE</span>
        </div>

        {/* STEP 1: Contrato e Período */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <Select value={selectedClientId} onValueChange={handleClientChange}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600">
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {(Array.isArray(clients) ? clients : []).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Número do Contrato</Label>
                <Input
                  value={contractNumber}
                  onChange={e => setContractNumber(e.target.value)}
                  placeholder="Ex: CT-2024/COEDRA"
                  className="bg-seguranca-black border-gray-600"
                />
              </div>

              <div>
                <Label>Nome da Obra / Unidade</Label>
                <Input
                  value={obraName}
                  onChange={e => setObraName(e.target.value)}
                  placeholder="Ex: COEDRA TALUDE / CONSTRUCAP CAPANEMA"
                  className="bg-seguranca-black border-gray-600"
                />
              </div>

              <div>
                <Label>Base de Dias (Cálculo Diário)</Label>
                <Select value={baseDays.toString()} onValueChange={v => setBaseDays(parseInt(v))}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="30">30 Dias (Padrão Contratual)</SelectItem>
                    <SelectItem value="22">22 Dias Úteis</SelectItem>
                    <SelectItem value="31">Dias Corridos do Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Início do Período</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={e => setPeriodStart(e.target.value)}
                  className="bg-seguranca-black border-gray-600"
                />
              </div>

              <div>
                <Label>Fim do Período</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={e => setPeriodEnd(e.target.value)}
                  className="bg-seguranca-black border-gray-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Apontamento por Veículo */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <h4 className="text-sm font-semibold text-seguranca-yellow flex items-center gap-2">
              <Building className="h-4 w-4" /> Apontamento de Dias da Frota Alocada ({pointings.length} veículos)
            </h4>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {pointings.map((p, idx) => (
                <Card key={idx} className="bg-seguranca-black border-gray-700 p-3">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                    <div>
                      <span className="text-xs text-gray-400 font-mono">{p.vehiclePlate}</span>
                      <p className="text-sm font-medium truncate">{p.vehicleModel}</p>
                    </div>

                    <div>
                      <Label className="text-xs">Dias Trabalhados</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={p.daysWorked}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const newPointings = [...pointings];
                          newPointings[idx].daysWorked = val;
                          newPointings[idx].daysStopped = p.daysExpected - val;
                          setPointings(newPointings);
                        }}
                        className="bg-seguranca-graphite border-gray-600 text-sm h-8"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Dias Parados (Corte)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={p.daysStopped}
                        disabled
                        className="bg-seguranca-graphite border-gray-600 text-sm h-8 text-red-400 font-bold"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Valor Diária (R$)</Label>
                      <Input
                        type="number"
                        value={p.dailyRate}
                        onChange={e => {
                          const newPointings = [...pointings];
                          newPointings[idx].dailyRate = parseFloat(e.target.value) || 0;
                          setPointings(newPointings);
                        }}
                        className="bg-seguranca-graphite border-gray-600 text-sm h-8"
                      />
                    </div>

                    <div className="text-right">
                      <Label className="text-xs text-gray-400">Total Veículo</Label>
                      <p className="text-sm font-bold text-emerald-400">
                        R$ {(p.daysWorked * p.dailyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Excedentes e Descontos */}
        {step === 3 && (
          <div className="space-y-6 py-2">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-emerald-400">Excedentes & Diárias Adicionais</h4>
                <Button size="sm" onClick={handleAddSurplus} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus size={14} className="mr-1" /> Adicionar Excedente
                </Button>
              </div>
              {surpluses.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhum excedente adicionado.</p>
              ) : (
                <div className="space-y-2">
                  {surpluses.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-seguranca-black p-2 rounded border border-gray-700">
                      <Input
                        value={s.description}
                        onChange={e => {
                          const newSurpluses = [...surpluses];
                          newSurpluses[idx].description = e.target.value;
                          setSurpluses(newSurpluses);
                        }}
                        placeholder="Descrição do excedente..."
                        className="bg-seguranca-graphite border-gray-600 text-xs flex-1"
                      />
                      <Input
                        type="number"
                        value={s.quantity}
                        onChange={e => {
                          const newSurpluses = [...surpluses];
                          newSurpluses[idx].quantity = e.target.value;
                          setSurpluses(newSurpluses);
                        }}
                        placeholder="Qtd"
                        className="bg-seguranca-graphite border-gray-600 text-xs w-20"
                      />
                      <Input
                        type="number"
                        value={s.unitPrice}
                        onChange={e => {
                          const newSurpluses = [...surpluses];
                          newSurpluses[idx].unitPrice = e.target.value;
                          setSurpluses(newSurpluses);
                        }}
                        placeholder="Preço Unit."
                        className="bg-seguranca-graphite border-gray-600 text-xs w-28"
                      />
                      <Button size="icon" variant="ghost" onClick={() => setSurpluses(surpluses.filter((_, i) => i !== idx))}>
                        <Trash2 size={14} className="text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-red-400">Descontos & Penalidades</h4>
                <Button size="sm" onClick={handleAddDiscount} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
                  <Plus size={14} className="mr-1" /> Adicionar Desconto
                </Button>
              </div>
              {discounts.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhum desconto adicionado.</p>
              ) : (
                <div className="space-y-2">
                  {discounts.map((d, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-seguranca-black p-2 rounded border border-gray-700">
                      <Input
                        value={d.reason}
                        onChange={e => {
                          const newDiscounts = [...discounts];
                          newDiscounts[idx].reason = e.target.value;
                          setDiscounts(newDiscounts);
                        }}
                        placeholder="Motivo do desconto..."
                        className="bg-seguranca-graphite border-gray-600 text-xs flex-1"
                      />
                      <Input
                        type="number"
                        value={d.amount}
                        onChange={e => {
                          const newDiscounts = [...discounts];
                          newDiscounts[idx].amount = e.target.value;
                          setDiscounts(newDiscounts);
                        }}
                        placeholder="Valor R$"
                        className="bg-seguranca-graphite border-gray-600 text-xs w-32"
                      />
                      <Button size="icon" variant="ghost" onClick={() => setDiscounts(discounts.filter((_, i) => i !== idx))}>
                        <Trash2 size={14} className="text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Prévia & NFE */}
        {step === 4 && (
          <div className="space-y-4 py-2">
            <Card className="bg-seguranca-black border-seguranca-yellow/30 p-4">
              <h4 className="text-sm font-bold text-seguranca-yellow mb-2">Resumo Financeiro da Medição (GLOBAL)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Serviços Brutos:</span>
                  <p className="font-bold text-sm text-seguranca-lightgray">R$ {calculateSubtotalServices().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Excedentes:</span>
                  <p className="font-bold text-sm text-emerald-400">+ R$ {calculateTotalSurpluses().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Cortes/Descontos:</span>
                  <p className="font-bold text-sm text-red-400">- R$ {(calculateTotalCuts() + calculateTotalDiscounts()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-gray-400">VALOR TOTAL MEDIÇÃO:</span>
                  <p className="font-bold text-base text-seguranca-yellow">R$ {calculateGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Número da Nota Fiscal (NF-e)</Label>
                <Input
                  value={nfNumber}
                  onChange={e => setNfNumber(e.target.value)}
                  placeholder="Ex: 000.123.456"
                  className="bg-seguranca-black border-gray-600"
                />
              </div>

              <div>
                <Label>Chave de Acesso NF-e (44 dígitos)</Label>
                <Input
                  value={accessKey}
                  onChange={e => setAccessKey(e.target.value)}
                  placeholder="3524..."
                  className="bg-seguranca-black border-gray-600 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between items-center gap-2 pt-4 border-t border-gray-700">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isLoading} className="border-gray-600">
              <ArrowLeft size={16} className="mr-1" /> Voltar
            </Button>
          ) : <div />}

          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 font-bold">
              Avançar <ArrowRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleGenerateMeasurement} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
              {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
              GERAR PRÉVIA E APROVAR MEDIÇÃO
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
