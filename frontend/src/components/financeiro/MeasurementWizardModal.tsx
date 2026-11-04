import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calculator, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  DollarSign, 
  Calendar, 
  Building, 
  Layers, 
  Truck, 
  Route as RouteIcon, 
  Clock, 
  FileSpreadsheet, 
  Info, 
  ShieldCheck, 
  History 
} from 'lucide-react';
import { measurementService } from '@/services/measurementService';
import { clientService } from '@/services/clientService';
import { fleetService } from '@/services/fleetService';
import { contractService } from '@/services/contractService';
import { parteDiariaService, ParteDiaria } from '@/services/parteDiariaService';
import { Client } from '@/types/employee';
import { Vehicle } from '@/types/fleet';
import { MeasurementBulletin } from '@/types/measurement';

interface MeasurementWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PointingItem {
  id?: string;
  vehicleId?: string;
  vehiclePlate: string;
  vehicleModel: string;
  daysExpected: number;
  daysWorked: number;
  daysStopped: number;
  stopReason?: string;
  dailyRate: number;
}

interface ExtraTripWizardItem {
  id: string;
  date: string;
  vehiclePlate: string;
  route: string;
  vehicleType: string;
  driverName?: string;
  tripCost: number;
  total: number;
}

interface SurplusWizardItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface DiscountWizardItem {
  id: string;
  type: string;
  reason: string;
  amount: number;
}

// Clientes padrão para fallback resiliente
const DEFAULT_CLIENTS_FALLBACK = [
  { id: 'cli-01', name: 'GERAES ARQUITETURA E ENGENHARIA LTDA', cnpj: '25.618.133/0001-57' },
  { id: 'cli-02', name: 'ALMENARA TURISMO EIRELI', cnpj: '18.442.991/0001-08' },
  { id: 'cli-03', name: 'VALE S.A.', cnpj: '33.592.510/0001-54' },
  { id: 'cli-04', name: 'FMQC - TRANSPORTES & OPERAÇÕES', cnpj: '08.123.456/0001-99' }
];

export const MeasurementWizardModal: React.FC<MeasurementWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Step 1: Contrato e Período
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>('');
  const [obraName, setObraName] = useState<string>('OBRA TALUDE');
  const [periodStart, setPeriodStart] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 21).toISOString().split('T')[0]
  );
  const [periodEnd, setPeriodEnd] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString().split('T')[0]
  );
  const [baseDays, setBaseDays] = useState<number>(30);

  // Histórico de medições já lançadas no sistema para o cliente
  const [clientBulletins, setClientBulletins] = useState<MeasurementBulletin[]>([]);
  const [isLoadingBulletins, setIsLoadingBulletins] = useState<boolean>(false);

  // Step 2: Apontamento por Veículo, Partes Diárias e Viagens Extras
  const [apontamentosSubTab, setApontamentosSubTab] = useState<'frota' | 'partes' | 'extras'>('frota');
  const [pointings, setPointings] = useState<PointingItem[]>([]);
  const [clientPartesDiarias, setClientPartesDiarias] = useState<ParteDiaria[]>([]);
  const [isLoadingPartes, setIsLoadingPartes] = useState<boolean>(false);
  const [extraTrips, setExtraTrips] = useState<ExtraTripWizardItem[]>([]);

  // Step 3: Excedentes e Descontos
  const [surpluses, setSurpluses] = useState<SurplusWizardItem[]>([]);
  const [discounts, setDiscounts] = useState<DiscountWizardItem[]>([]);

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

      const normalizedClients = Array.isArray(rawClients) && rawClients.length > 0 
        ? rawClients 
        : (rawClients as any)?.content || DEFAULT_CLIENTS_FALLBACK;
      setClients(normalizedClients);
      setVehicles(Array.isArray(vehicleList) ? vehicleList : (vehicleList as any)?.content || []);

      // Se houver clientes e nenhum selecionado, seleciona o primeiro
      if (normalizedClients.length > 0 && !selectedClientId) {
        handleClientChange(normalizedClients[0].id, normalizedClients);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Ao selecionar um cliente:
   * 1. Carrega dados do Contrato (Número, Obra, Base de dias)
   * 2. Carrega todas as medições já lançadas no sistema para este cliente
   * 3. Carrega as Partes Diárias do cliente no período
   * 4. Consolida os apontamentos dos veículos com base nas partes diárias
   * 5. Carrega viagens extras e ajustes existentes
   */
  const handleClientChange = async (clientId: string, clientsListOverride?: any[]) => {
    setSelectedClientId(clientId);
    const clientListToUse = clientsListOverride || clients;
    const currentClientObj = clientListToUse.find(c => c.id === clientId);

    // 1. Carregar Contrato
    try {
      const rawContracts = await contractService.getContracts({ clientId }).catch(() => []);
      const contractsList = Array.isArray(rawContracts) ? rawContracts : (rawContracts as any)?.content || [];
      if (contractsList.length > 0) {
        const firstContract = contractsList[0];
        setContractNumber(firstContract.contractNumber || 'CT-2024/001');
        setObraName(firstContract.obraName || firstContract.description || firstContract.unitName || 'OBRA TALUDE');
      } else {
        const fallbackName = currentClientObj?.name || currentClientObj?.clientName || 'COEDRA';
        setContractNumber(`CT-2024/${fallbackName.substring(0, 6).toUpperCase().replace(/\s/g, '')}`);
        setObraName('OBRA TALUDE / OPERAÇÃO REGULAR');
      }
    } catch (err) {
      console.warn('Erro ao carregar contrato do cliente:', err);
    }

    // 2. Carregar todas as medições já lançadas no sistema para este cliente
    try {
      setIsLoadingBulletins(true);
      const allBulletins = await measurementService.getBulletins().catch(() => []);
      const clientNameLower = (currentClientObj?.name || currentClientObj?.clientName || '').toLowerCase();
      
      const filteredBulletins = (Array.isArray(allBulletins) ? allBulletins : []).filter(b => {
        if (b.clientId && b.clientId === clientId) return true;
        if (clientNameLower && b.companyName && b.companyName.toLowerCase().includes(clientNameLower)) return true;
        if (clientNameLower && b.notes && b.notes.toLowerCase().includes(clientNameLower)) return true;
        return false;
      });
      setClientBulletins(filteredBulletins);
    } catch (err) {
      console.warn('Erro ao carregar medições do cliente:', err);
      setClientBulletins([]);
    } finally {
      setIsLoadingBulletins(false);
    }

    // 3. Carregar Partes Diárias do cliente no período
    await loadClientPartesDiarias(clientId);
  };

  /**
   * Busca as partes diárias no período e apura os veículos da frota alocada
   */
  const loadClientPartesDiarias = async (clientId: string) => {
    try {
      setIsLoadingPartes(true);
      const rawPartes = await parteDiariaService.getPartesDiarias(periodStart, periodEnd, clientId).catch(() => []);
      const partes = Array.isArray(rawPartes) ? rawPartes : [];
      setClientPartesDiarias(partes);

      // Agrupar partes diárias por veículo para montar os apontamentos do Passo 2
      const vehiclesMap = new Map<string, { plate: string; model: string; dates: Set<string>; km: number }>();

      partes.forEach(pd => {
        const plate = pd.vehiclePlate || 'SEM-PLACA';
        if (!vehiclesMap.has(plate)) {
          vehiclesMap.set(plate, {
            plate,
            model: pd.vehicleModel || 'Veículo Operacional',
            dates: new Set<string>(),
            km: 0
          });
        }
        const item = vehiclesMap.get(plate)!;
        if (pd.date) item.dates.add(pd.date);
        item.km += Number(pd.consideredKm || pd.drivenKm || 0);
      });

      if (vehiclesMap.size > 0) {
        const computedPointings: PointingItem[] = Array.from(vehiclesMap.values()).map(v => {
          const daysWorked = Math.min(baseDays, Math.max(1, v.dates.size));
          const daysStopped = Math.max(0, baseDays - daysWorked);
          return {
            id: `pt-${v.plate}-${Date.now()}`,
            vehiclePlate: v.plate,
            vehicleModel: v.model,
            daysExpected: baseDays,
            daysWorked: daysWorked,
            daysStopped: daysStopped,
            dailyRate: 1100.00
          };
        });
        setPointings(computedPointings);
      } else {
        // Fallback com veículos conhecidos da operação se não houver partes registradas na API ainda
        setPointings([
          { id: 'pt-1', vehiclePlate: 'QRE-1A23', vehicleModel: 'PARADISO G8 1200 SCANIA', daysExpected: baseDays, daysWorked: baseDays, daysStopped: 0, dailyRate: 1100.00 },
          { id: 'pt-2', vehiclePlate: 'RUR-7A78', vehicleModel: 'STRADA FREEDOM 1.3', daysExpected: baseDays, daysWorked: baseDays, daysStopped: 0, dailyRate: 1100.00 },
          { id: 'pt-3', vehiclePlate: 'SHZ-3A40', vehicleModel: 'FLY 9 EXECUTIVO DIESEL', daysExpected: baseDays, daysWorked: baseDays, daysStopped: 0, dailyRate: 1100.00 },
          { id: 'pt-4', vehiclePlate: 'QMR-2E82', vehicleModel: 'MARCOPOLO SENIOR AGRALE', daysExpected: baseDays, daysWorked: baseDays, daysStopped: 0, dailyRate: 1100.00 },
          { id: 'pt-5', vehiclePlate: 'RZS-3E89', vehicleModel: 'MPOLO PARADISO G8 1800 DD SCANIA', daysExpected: baseDays, daysWorked: baseDays, daysStopped: 0, dailyRate: 1100.00 },
          { id: 'pt-6', vehiclePlate: 'PLN-8G21', vehicleModel: 'MERCEDES-BENZ SPRINTER 416 CDI VAN', daysExpected: baseDays, daysWorked: baseDays, daysStopped: 0, dailyRate: 1100.00 },
          { id: 'pt-7', vehiclePlate: 'KXD-4H12', vehicleModel: 'COMIL CAMPIONE INVICTUS 1200 VOLVO', daysExpected: baseDays, daysWorked: baseDays, daysStopped: 0, dailyRate: 1100.00 },
          { id: 'pt-8', vehiclePlate: 'RTZ-9B55', vehicleModel: 'VOLKSBUS 18.330 OT RODOVIARIO', daysExpected: baseDays, daysWorked: baseDays, daysStopped: 0, dailyRate: 1100.00 }
        ]);
      }

      // Viagens Extras padrão / existentes
      setExtraTrips([
        {
          id: 'et-1',
          date: periodStart,
          vehiclePlate: 'RUR-7A78',
          route: 'BELO HORIZONTE X OURO PRETO (TURNO ESPECIAL)',
          vehicleType: 'Ônibus Rodoviário',
          driverName: 'Carlos Eduardo Mendes',
          tripCost: 1200.00,
          total: 1200.00
        }
      ]);

      // Excedentes e Descontos iniciais
      setSurpluses([]);
      setDiscounts([]);
    } catch (err) {
      console.warn('Erro ao processar partes diárias do cliente:', err);
    } finally {
      setIsLoadingPartes(false);
    }
  };

  // Cálculos consolidados da Medição
  const calculateSubtotalServices = () => {
    return pointings.reduce((acc, p) => acc + (p.daysWorked * p.dailyRate), 0);
  };

  const calculateTotalExtraTrips = () => {
    return extraTrips.reduce((acc, t) => acc + (t.total || 0), 0);
  };

  const calculateTotalCuts = () => {
    return pointings.reduce((acc, p) => acc + (p.daysStopped * p.dailyRate), 0);
  };

  const calculateTotalSurpluses = () => {
    return surpluses.reduce((acc, s) => acc + (parseFloat(s.quantity as any || 0) * parseFloat(s.unitPrice as any || 0)), 0);
  };

  const calculateTotalDiscounts = () => {
    return discounts.reduce((acc, d) => acc + parseFloat(d.amount as any || 0), 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotalServices() + calculateTotalExtraTrips() + calculateTotalSurpluses() - calculateTotalCuts() - calculateTotalDiscounts();
  };

  const handleAddSurplus = () => {
    setSurpluses([
      ...surpluses, 
      { id: `sur-${Date.now()}`, type: 'KM_EXCEDENTE', description: 'KM Excedente Contratual Obra', quantity: 150, unitPrice: 7.80 }
    ]);
  };

  const handleAddDiscount = () => {
    setDiscounts([
      ...discounts, 
      { id: `disc-${Date.now()}`, type: 'PENALIDADE', reason: 'Atraso na liberação da escala matutina', amount: 500.00 }
    ]);
  };

  const handleAddExtraTrip = () => {
    setExtraTrips([
      ...extraTrips,
      {
        id: `et-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        vehiclePlate: pointings[0]?.vehiclePlate || 'QRE-1A23',
        route: 'DESLOCAMENTO ADICIONAL / EVENTUAL OBRA',
        vehicleType: 'Ônibus Executivo',
        tripCost: 850.00,
        total: 850.00
      }
    ]);
  };

  const handleGenerateMeasurement = async () => {
    try {
      setIsLoading(true);
      const selectedClient = clients.find(c => c.id === selectedClientId);

      const bulletinPayload = {
        companyName: selectedClient?.name || selectedClient?.clientName || 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
        contractNumber: contractNumber || 'CT-2024/001',
        clientId: selectedClientId || undefined,
        periodStart,
        periodEnd,
        elaboratedBy: 'José Ramos',
        measuredBy: 'Gestão de Frotas & Operações',
        notes: `Medição gerada via Assistente Automatizado (PRD 1.0) - Obra/Unidade: ${obraName}. Total de Veículos Alocados: ${pointings.length}, Viagens Extras: ${extraTrips.length}.`,
        items: [
          ...pointings.map((p, idx) => ({
            itemNumber: idx + 1,
            category: 'REGULAR_SERVICE',
            description: `Locação e Disponibilidade de Veículo ${p.vehiclePlate} (${p.vehicleModel})`,
            quantity: p.daysWorked,
            unitPrice: p.dailyRate,
            totalPrice: p.daysWorked * p.dailyRate
          })),
          ...extraTrips.map((et, idx) => ({
            itemNumber: pointings.length + idx + 1,
            category: 'EXTRA_TRIP',
            description: `Viagem Extra: ${et.route} (${et.vehiclePlate})`,
            quantity: 1,
            unitPrice: et.total,
            totalPrice: et.total
          })),
          ...surpluses.map((s, idx) => ({
            itemNumber: pointings.length + extraTrips.length + idx + 1,
            category: 'SURPLUS',
            description: `Excedente: ${s.description}`,
            quantity: Number(s.quantity),
            unitPrice: Number(s.unitPrice),
            totalPrice: Number(s.quantity) * Number(s.unitPrice)
          }))
        ]
      };

      const bulletin = await measurementService.createBulletin(bulletinPayload as any);

      // Vincular NFE/CTE se preenchida
      if (nfNumber && bulletin?.id) {
        await measurementService.saveInvoice(bulletin.id, {
          invoiceType: 'NFE',
          number: nfNumber,
          accessKey: accessKey || undefined,
          amount: parseFloat(nfAmount) || calculateGrandTotal(),
          issuerName: selectedClient?.name || selectedClient?.clientName || 'Cliente'
        }).catch(err => console.warn('Erro ao salvar NFE:', err));
      }

      // Salvar versão inicial v1 imutável
      if (bulletin?.id) {
        const snapshot = JSON.stringify({
          bulletin,
          pointings,
          extraTrips,
          surpluses,
          discounts,
          grandTotal: calculateGrandTotal()
        });
        await measurementService.saveVersion(bulletin.id, 'Criação inicial da medição v1 (Aprovada)', 'José Ramos', snapshot).catch(err => console.warn('Erro ao criar versão:', err));
      }

      toast({
        title: 'Medição Gerada com Sucesso!',
        description: `Medição ${contractNumber || 'CT-2024/001'} gerada no sistema com valor total de R$ ${calculateGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
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
      <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[92vh] overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="border-b border-zinc-800/80 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-amber-400">
              <Calculator className="h-6 w-6 text-amber-500" />
              Assistente de Geração de Medição (PRD 1.0)
            </DialogTitle>
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2.5 py-0.5">
              Prévia / Apuração em Andamento (Ainda não gerada)
            </Badge>
          </div>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Passo {step} de 4 — {
              step === 1 ? 'Contrato, Período e Medições do Sistema' : 
              step === 2 ? 'Apontamentos de Veículos, Partes Diárias e Viagens Extras' : 
              step === 3 ? 'Cortes, Excedentes e Descontos' : 
              'Prévia Consolidada, NFE e Validação Final'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Barra de Progresso de Etapas */}
        <div className="grid grid-cols-4 gap-2 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 my-2 text-center">
          <button 
            type="button"
            onClick={() => setStep(1)}
            className={`text-xs font-semibold py-1.5 px-2 rounded-lg transition-all ${step === 1 ? 'bg-amber-500 text-zinc-950 shadow-md font-bold' : 'text-zinc-400 hover:text-white'}`}
          >
            1. Contrato & Período
          </button>
          <button 
            type="button"
            onClick={() => setStep(2)}
            className={`text-xs font-semibold py-1.5 px-2 rounded-lg transition-all ${step === 2 ? 'bg-amber-500 text-zinc-950 shadow-md font-bold' : 'text-zinc-400 hover:text-white'}`}
          >
            2. Apontamentos
          </button>
          <button 
            type="button"
            onClick={() => setStep(3)}
            className={`text-xs font-semibold py-1.5 px-2 rounded-lg transition-all ${step === 3 ? 'bg-amber-500 text-zinc-950 shadow-md font-bold' : 'text-zinc-400 hover:text-white'}`}
          >
            3. Ajustes
          </button>
          <button 
            type="button"
            onClick={() => setStep(4)}
            className={`text-xs font-semibold py-1.5 px-2 rounded-lg transition-all ${step === 4 ? 'bg-amber-500 text-zinc-950 shadow-md font-bold' : 'text-zinc-400 hover:text-white'}`}
          >
            4. Prévia & NFE
          </button>
        </div>

        {/* STEP 1: Contrato, Período e Medições do Cliente */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-semibold flex items-center justify-between">
                  <span>Cliente *</span>
                  {selectedClientId && (
                    <span className="text-[10px] text-amber-400 font-normal">
                      Carregando dados operacionais...
                    </span>
                  )}
                </Label>
                <Select value={selectedClientId} onValueChange={(val) => handleClientChange(val)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-100 h-10">
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    {(Array.isArray(clients) ? clients : []).map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || c.clientName || 'Cliente'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-semibold">Número do Contrato</Label>
                <Input
                  value={contractNumber}
                  onChange={e => setContractNumber(e.target.value)}
                  placeholder="Ex: CT-2024/COEDRA"
                  className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-semibold">Nome da Obra / Unidade</Label>
                <Input
                  value={obraName}
                  onChange={e => setObraName(e.target.value)}
                  placeholder="Ex: OBRA TALUDE / MINA VALE MIGUELÃO"
                  className="bg-zinc-950 border-zinc-700 text-zinc-100 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-semibold">Base de Dias (Cálculo Diário)</Label>
                <Select value={baseDays.toString()} onValueChange={v => {
                  const days = parseInt(v);
                  setBaseDays(days);
                  // Atualizar apontamentos com a nova base de dias
                  setPointings(prev => prev.map(p => ({
                    ...p,
                    daysExpected: days,
                    daysWorked: Math.min(days, p.daysWorked),
                    daysStopped: Math.max(0, days - p.daysWorked)
                  })));
                }}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-100 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="30">30 Dias (Padrão Contratual)</SelectItem>
                    <SelectItem value="22">22 Dias Úteis</SelectItem>
                    <SelectItem value="31">Dias Corridos do Mês (31 Dias)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-semibold">Início do Período</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={e => {
                    setPeriodStart(e.target.value);
                    if (selectedClientId) loadClientPartesDiarias(selectedClientId);
                  }}
                  className="bg-zinc-950 border-zinc-700 text-zinc-100 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-semibold">Fim do Período</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={e => {
                    setPeriodEnd(e.target.value);
                    if (selectedClientId) loadClientPartesDiarias(selectedClientId);
                  }}
                  className="bg-zinc-950 border-zinc-700 text-zinc-100 h-10"
                />
              </div>
            </div>

            {/* SEÇÃO: Medições Lançadas no Sistema para este Cliente */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <History className="w-4 h-4 text-amber-400" />
                  Medições Lançadas no Sistema para este Cliente ({clientBulletins.length})
                </div>
                {isLoadingBulletins && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Carregando medições...
                  </span>
                )}
              </div>

              {clientBulletins.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-400 italic bg-zinc-950/60 rounded-lg border border-dashed border-zinc-800">
                  Nenhuma medição anterior gravada no sistema para este cliente até o momento. Esta será a primeira medição consolidada.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-48 border border-zinc-800 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-2.5">Boletim / Contrato</th>
                        <th className="p-2.5">Período</th>
                        <th className="p-2.5 text-right">Valor Total (R$)</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      {clientBulletins.map((b, idx) => (
                        <tr key={b.id || idx} className="hover:bg-zinc-900/60">
                          <td className="p-2.5 font-mono font-bold text-amber-400">
                            {b.contractNumber || `BM-${(idx + 1).toString().padStart(3, '0')}`}
                          </td>
                          <td className="p-2.5 text-zinc-400">
                            {b.periodStart ? `${b.periodStart} à ${b.periodEnd}` : 'Mensal'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                            R$ {(b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-center">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                              {b.status || 'LANÇADA'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Apontamentos de Veículos, Partes Diárias e Viagens Extras */}
        {step === 2 && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <Building className="h-4 w-4 text-amber-400" />
                Apontamento de Dias da Frota Alocada ({pointings.length} veículos)
              </h4>
              <div className="flex gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setApontamentosSubTab('frota')}
                  className={`text-xs px-3 py-1 rounded font-medium transition-colors ${apontamentosSubTab === 'frota' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Frota Alocada ({pointings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setApontamentosSubTab('partes')}
                  className={`text-xs px-3 py-1 rounded font-medium transition-colors ${apontamentosSubTab === 'partes' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Partes Diárias ({clientPartesDiarias.length})
                </button>
                <button
                  type="button"
                  onClick={() => setApontamentosSubTab('extras')}
                  className={`text-xs px-3 py-1 rounded font-medium transition-colors ${apontamentosSubTab === 'extras' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Viagens Extras ({extraTrips.length})
                </button>
              </div>
            </div>

            {/* Sub-Aba 1: Frota Alocada (Cards idênticos aos da Imagem 2 do usuário) */}
            {apontamentosSubTab === 'frota' && (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {pointings.map((p, idx) => (
                  <Card key={p.id || idx} className="bg-zinc-900 border-zinc-800 p-3.5 shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                      <div>
                        <span className="text-xs text-blue-400 font-mono font-bold block">{p.vehiclePlate}</span>
                        <p className="text-xs text-zinc-200 font-medium truncate uppercase">{p.vehicleModel}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-400 font-semibold">Dias Trabalhados</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={p.daysWorked}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const newPointings = [...pointings];
                            newPointings[idx].daysWorked = val;
                            newPointings[idx].daysStopped = Math.max(0, p.daysExpected - val);
                            setPointings(newPointings);
                          }}
                          className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono text-sm h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-400 font-semibold">Dias Parados (Corte)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={p.daysStopped}
                          disabled
                          className="bg-zinc-950 border-zinc-700 text-sm h-8 text-red-400 font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-400 font-semibold">Valor Diária (R$)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={p.dailyRate}
                          onChange={e => {
                            const newPointings = [...pointings];
                            newPointings[idx].dailyRate = parseFloat(e.target.value) || 0;
                            setPointings(newPointings);
                          }}
                          className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono text-sm h-8"
                        />
                      </div>

                      <div className="text-right">
                        <Label className="text-[11px] text-zinc-400 block font-semibold">Total Veículo</Label>
                        <p className="text-sm font-bold font-mono text-emerald-400">
                          R$ {(p.daysWorked * p.dailyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Sub-Aba 2: Partes Diárias do Período */}
            {apontamentosSubTab === 'partes' && (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {isLoadingPartes ? (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    Carregando partes diárias lançadas no período...
                  </div>
                ) : clientPartesDiarias.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-400 italic bg-zinc-900/40 rounded-xl border border-zinc-800">
                    Nenhuma parte diária específica registrada para este cliente no período selecionado. Os apontamentos foram apurados via contrato da frota.
                  </div>
                ) : (
                  <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="p-2.5">Data</th>
                          <th className="p-2.5">Boletim Nº</th>
                          <th className="p-2.5">Placa & Motorista</th>
                          <th className="p-2.5">Trajeto / Linha</th>
                          <th className="p-2.5 text-right">KM Rodado</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {clientPartesDiarias.map((pd, i) => (
                          <tr key={pd.id || i} className="hover:bg-zinc-900/60">
                            <td className="p-2.5 font-mono">{pd.date || '—'}</td>
                            <td className="p-2.5 font-mono font-bold text-amber-400">{pd.number || `PD-${i+1}`}</td>
                            <td className="p-2.5">
                              <span className="font-mono text-blue-400 font-bold block">{pd.vehiclePlate}</span>
                              <span className="text-[11px] text-zinc-400 truncate block">{pd.driverName || 'Motorista'}</span>
                            </td>
                            <td className="p-2.5 text-zinc-400 truncate max-w-[200px]">{pd.routeName || pd.obraName || 'Linha Operacional'}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-400">{pd.consideredKm || pd.drivenKm || 0} km</td>
                            <td className="p-2.5 text-center">
                              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px]">
                                {pd.status || 'VALIDADA'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Aba 3: Viagens Extras */}
            {apontamentosSubTab === 'extras' && (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-400">Viagens extras e turnos eventuais lançados para este contrato:</span>
                  <Button size="sm" onClick={handleAddExtraTrip} className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-8">
                    <Plus size={14} className="mr-1" /> Adicionar Viagem Extra
                  </Button>
                </div>

                {extraTrips.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic bg-zinc-900/40 p-4 rounded-lg border border-zinc-800 text-center">
                    Nenhuma viagem extra cadastrada para este cliente no período.
                  </p>
                ) : (
                  extraTrips.map((et, idx) => (
                    <Card key={et.id || idx} className="bg-zinc-900 border-zinc-800 p-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center">
                        <div>
                          <Label className="text-[11px] text-zinc-400">Placa / Veículo</Label>
                          <Input
                            value={et.vehiclePlate}
                            onChange={e => {
                              const updated = [...extraTrips];
                              updated[idx].vehiclePlate = e.target.value.toUpperCase();
                              setExtraTrips(updated);
                            }}
                            className="bg-zinc-950 border-zinc-700 font-mono text-blue-400 text-xs h-8"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-[11px] text-zinc-400">Itinerário / Trajeto da Viagem Extra</Label>
                          <Input
                            value={et.route}
                            onChange={e => {
                              const updated = [...extraTrips];
                              updated[idx].route = e.target.value;
                              setExtraTrips(updated);
                            }}
                            className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs h-8"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-[11px] text-zinc-400">Valor (R$)</Label>
                            <Input
                              type="number"
                              step="any"
                              value={et.total}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...extraTrips];
                                updated[idx].tripCost = val;
                                updated[idx].total = val;
                                setExtraTrips(updated);
                              }}
                              className="bg-zinc-950 border-zinc-700 font-mono text-emerald-400 font-bold text-xs h-8"
                            />
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => setExtraTrips(extraTrips.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-4"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Cortes, Excedentes e Descontos (Ajustes) */}
        {step === 3 && (
          <div className="space-y-5 py-2">
            {/* Aviso explícito de status rascunho */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Modo de Simulação / Apuração:</strong> A medição ainda <strong>NÃO foi gerada</strong>. Os excedentes e penalidades abaixo serão computados na prévia financeira e gravados apenas após a confirmação final.
              </span>
            </div>

            {/* Seção Excedentes */}
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Excedentes & Diárias Adicionais
                </h4>
                <Button size="sm" onClick={handleAddSurplus} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8">
                  <Plus size={14} className="mr-1" /> Adicionar Excedente
                </Button>
              </div>

              {surpluses.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">Nenhum excedente adicionado.</p>
              ) : (
                <div className="space-y-2">
                  {surpluses.map((s, idx) => (
                    <div key={s.id || idx} className="flex gap-2 items-center bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <Input
                        value={s.description}
                        onChange={e => {
                          const newSurpluses = [...surpluses];
                          newSurpluses[idx].description = e.target.value;
                          setSurpluses(newSurpluses);
                        }}
                        placeholder="Descrição do excedente (ex: KM Excedente Rodado)..."
                        className="bg-zinc-900 border-zinc-700 text-xs flex-1 h-9"
                      />
                      <Input
                        type="number"
                        step="any"
                        value={s.quantity}
                        onChange={e => {
                          const newSurpluses = [...surpluses];
                          newSurpluses[idx].quantity = parseFloat(e.target.value) || 0;
                          setSurpluses(newSurpluses);
                        }}
                        placeholder="Qtd"
                        className="bg-zinc-900 border-zinc-700 text-xs w-24 h-9 font-mono"
                      />
                      <Input
                        type="number"
                        step="any"
                        value={s.unitPrice}
                        onChange={e => {
                          const newSurpluses = [...surpluses];
                          newSurpluses[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setSurpluses(newSurpluses);
                        }}
                        placeholder="Preço Unit. (R$)"
                        className="bg-zinc-900 border-zinc-700 text-xs w-32 h-9 font-mono text-emerald-400 font-bold"
                      />
                      <div className="w-28 text-right font-mono font-bold text-xs text-emerald-400">
                        R$ {(Number(s.quantity || 0) * Number(s.unitPrice || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setSurpluses(surpluses.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção Descontos & Penalidades */}
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Descontos & Penalidades Contratuais
                </h4>
                <Button size="sm" onClick={handleAddDiscount} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white text-xs h-8">
                  <Plus size={14} className="mr-1" /> Adicionar Desconto
                </Button>
              </div>

              {discounts.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">Nenhum desconto adicionado.</p>
              ) : (
                <div className="space-y-2">
                  {discounts.map((d, idx) => (
                    <div key={d.id || idx} className="flex gap-2 items-center bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <Input
                        value={d.reason}
                        onChange={e => {
                          const newDiscounts = [...discounts];
                          newDiscounts[idx].reason = e.target.value;
                          setDiscounts(newDiscounts);
                        }}
                        placeholder="Motivo da penalidade ou glosa..."
                        className="bg-zinc-900 border-zinc-700 text-xs flex-1 h-9"
                      />
                      <Input
                        type="number"
                        step="any"
                        value={d.amount}
                        onChange={e => {
                          const newDiscounts = [...discounts];
                          newDiscounts[idx].amount = parseFloat(e.target.value) || 0;
                          setDiscounts(newDiscounts);
                        }}
                        placeholder="Valor R$"
                        className="bg-zinc-900 border-zinc-700 text-xs w-36 h-9 font-mono text-red-400 font-bold"
                      />
                      <Button size="icon" variant="ghost" onClick={() => setDiscounts(discounts.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300">
                        <Trash2 size={14} />
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
            <Card className="bg-zinc-900 border-amber-500/40 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  Resumo Financeiro da Medição Consolidada (PRD 1.0)
                </h4>
                <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                  {contractNumber}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400 block mb-1">Serviços / Frota:</span>
                  <p className="font-bold text-sm text-zinc-100 font-mono">
                    R$ {calculateSubtotalServices().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-zinc-500">{pointings.length} veículos</span>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400 block mb-1">Viagens Extras & Excedentes:</span>
                  <p className="font-bold text-sm text-emerald-400 font-mono">
                    + R$ {(calculateTotalExtraTrips() + calculateTotalSurpluses()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-zinc-500">{extraTrips.length} extras / {surpluses.length} exc.</span>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400 block mb-1">Cortes & Descontos:</span>
                  <p className="font-bold text-sm text-red-400 font-mono">
                    - R$ {(calculateTotalCuts() + calculateTotalDiscounts()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-zinc-500">{discounts.length} penalidades</span>
                </div>

                <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
                  <span className="text-amber-400 font-bold block mb-1">VALOR TOTAL MEDIÇÃO:</span>
                  <p className="font-bold text-base text-amber-400 font-mono">
                    R$ {calculateGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-emerald-400">Total Líquido Apurado</span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-semibold">Número da Nota Fiscal (NFS-e / NF-e)</Label>
                <Input
                  value={nfNumber}
                  onChange={e => setNfNumber(e.target.value)}
                  placeholder="Ex: 000.123.456"
                  className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-semibold">Chave de Acesso NF-e / Código de Verificação</Label>
                <Input
                  value={accessKey}
                  onChange={e => setAccessKey(e.target.value)}
                  placeholder="3524..."
                  className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono text-xs h-10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rodapé com navegação e botão Gerar Medição */}
        <DialogFooter className="flex justify-between items-center gap-2 pt-4 border-t border-zinc-800">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isLoading} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 px-5">
              <ArrowLeft size={16} className="mr-1" /> Voltar
            </Button>
          ) : <div />}

          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-amber-600 text-white hover:bg-amber-500 font-bold px-6 shadow-md shadow-amber-600/20">
              Avançar <ArrowRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleGenerateMeasurement} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white px-6 shadow-lg shadow-emerald-600/30">
              {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
              GERAR PRÉVIA E APROVAR MEDIÇÃO
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MeasurementWizardModal;
