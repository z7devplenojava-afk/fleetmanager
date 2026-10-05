import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  CostSimulation,
  calculateSimulation,
  VEHICLE_CATEGORIES,
  VehicleCategory,
  costSimulationService,
} from '@/services/costSimulationService';
import { SEED_ROUTE_TEMPLATES, RouteCostTemplate } from '@/services/costSeedData';
import { clientService } from '@/services/clientService';
import workScaleService, { WorkScale } from '@/services/workScaleService';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { ClientFormModal } from '@/components/clientes/ClientFormModal';
import {
  Calculator,
  DollarSign,
  Fuel,
  Users,
  Route,
  ShieldCheck,
  TrendingUp,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Percent,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  Clock,
  Car,
  Bus,
  PlusCircle,
  Clock4,
} from 'lucide-react';

interface ClientOption {
  id: string;
  name: string;
}

interface CostLaunchTabProps {
  initialData?: CostSimulation | null;
  clients?: ClientOption[];
  onSaved?: (saved: CostSimulation) => void;
  onGoToSummary?: () => void;
  onGenerateProposal?: (simulation: CostSimulation) => void;
}

const fmtBRL = (v?: number) =>
  typeof v === 'number' && isFinite(v)
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00';

const fmtKm = (v?: number) =>
  typeof v === 'number' && isFinite(v)
    ? `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km`
    : '0 km';

const fmtPct = (v?: number) =>
  typeof v === 'number' && isFinite(v)
    ? `${(v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`
    : '0%';

const num = (v: string) => {
  const parsed = parseFloat(v.replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
};

export const defaultFormState = (): CostSimulation => ({
  name: '',
  origin: '',
  destination: '',
  shift: 'A (07:00 ÁS 15:00) / B (15:00 ÁS 23:00) / C (23:00 ÁS 07:00)',
  scale: 'SEG Á SAB',
  vehicleTypeLabel: 'ÔNIBUS',
  vehicleCategory: 'BUS',
  driverCount: 3,
  operatingDays: 26,
  dailyKm: 250,
  productivityFactor: 1.0,
  dieselPrice: 5.95,
  baseSalary: 3450,
  payrollChargesPct: 0.72,
  mealAllowance: 1200,
  healthPlanCost: 450,
  nightShiftExtra: 0,
  fixedCosts: 6500,
  depreciationMonthly: 3500,
  ipvaInsuranceMonthly: 1600,
  adminExpensesMonthly: 1400,
  maintenancePerKm: 0.52,
  tiresPerKm: 0.38,
  lubricantsPerKm: 0.08,
  partsPerKm: 0.15,
  issPct: 0.05,
  pisPct: 0.0065,
  cofinsPct: 0.03,
  icmsPct: 0.0,
  irpjPct: 0.024,
  csllPct: 0.0108,
  profitMarginPct: 0.12,
  bdiPct: 0,
  extraTripMarginPct: 0.15,
  status: 'DRAFT',
});

export const CostLaunchTab: React.FC<CostLaunchTabProps> = ({
  initialData,
  clients = [],
  onSaved,
  onGoToSummary,
  onGenerateProposal,
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState<CostSimulation>(() => {
    return initialData ? { ...defaultFormState(), ...initialData } : defaultFormState();
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Clientes e Escalas carregados da base (para busca a partir de 3 caracteres)
  const [clientOptions, setClientOptions] = useState<ClientOption[]>(clients);
  const [scaleOptions, setScaleOptions] = useState<WorkScale[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [newScaleName, setNewScaleName] = useState('');
  const [newScaleType, setNewScaleType] = useState('CUSTOM');
  const [savingScale, setSavingScale] = useState(false);

  // Atualizar quando initialData mudar
  React.useEffect(() => {
    if (initialData) {
      setForm({ ...defaultFormState(), ...initialData });
    }
  }, [initialData]);

  const setField = (field: keyof CostSimulation, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Carregamento de Clientes e Escalas (busca com 3+ caracteres) ──────
  const loadClients = useCallback(async () => {
    try {
      const res: any = await clientService.getClients();
      const list = Array.isArray(res) ? res : res?.content || [];
      const fresh: ClientOption[] = list.map((c: any) => ({ id: String(c.id), name: c.name || c.nome }));
      // Preserva leads/opções do pai que não venham da listagem de clientes
      setClientOptions((prev) => {
        const ids = new Set(fresh.map((c) => c.id));
        const extras = prev.filter((c) => !ids.has(c.id));
        return [...fresh, ...extras];
      });
    } catch {
      // mantém os clients recebidos via props como fallback
    }
  }, []);

  const loadScales = useCallback(async () => {
    try {
      const list = await workScaleService.list();
      setScaleOptions(list);
    } catch {
      setScaleOptions([]);
    }
  }, []);

  React.useEffect(() => {
    loadClients();
    loadScales();
  }, [loadClients, loadScales]);

  // Sincroniza com a lista recebida do componente pai
  React.useEffect(() => {
    if (clients.length > 0) {
      setClientOptions((prev) => (prev.length > 0 ? prev : clients));
    }
  }, [clients]);

  const handleClientCreated = async (createdClient?: any) => {
    setShowClientModal(false);
    if (createdClient?.id) {
      await loadClients();
      setField('clientId', String(createdClient.id));
      setField('clientName', createdClient.name || null);
      toast({
        title: 'Cliente vinculado',
        description: `Cliente "${createdClient.name}" cadastrado e vinculado à simulação.`,
      });
    }
  };

  const handleCreateScale = async () => {
    if (!newScaleName.trim()) {
      toast({
        title: 'Campo Obrigatório',
        description: 'Informe o nome da escala de trabalho.',
        variant: 'destructive',
      });
      return;
    }
    setSavingScale(true);
    try {
      const created = await workScaleService.create({ name: newScaleName.trim(), type: newScaleType });
      await loadScales();
      setField('scale', created.name);
      setShowScaleModal(false);
      setNewScaleName('');
      setNewScaleType('CUSTOM');
      toast({
        title: 'Escala Cadastrada',
        description: `Escala "${created.name}" criada e selecionada com sucesso.`,
      });
    } catch (e: any) {
      toast({
        title: 'Erro ao Cadastrar Escala',
        description: e?.response?.data?.message || 'Não foi possível cadastrar a escala de trabalho.',
        variant: 'destructive',
      });
    } finally {
      setSavingScale(false);
    }
  };

  // Cálculo reativo em tempo real (espelho do Excel / backend)
  const preview = useMemo(() => {
    return calculateSimulation(form);
  }, [form]);

  // Carregar modelo predefinido das planilhas reais
  const handleLoadPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const template = SEED_ROUTE_TEMPLATES.find((t) => t.id === presetId);
    if (template) {
      setForm({
        ...defaultFormState(),
        ...template,
        id: form.id, // Manter id atual se estiver editando
      });
      toast({
        title: 'Modelo Carregado',
        description: `Dados de "${template.name}" aplicados com sucesso.`,
      });
    }
  };

  const handleSave = async (isNewVersion = false) => {
    if (!form.name.trim()) {
      toast({
        title: 'Campo Obrigatório',
        description: 'Por favor, informe o nome da simulação/rota.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: CostSimulation = {
        ...form,
        fixedCosts: (form.depreciationMonthly || 0) + (form.ipvaInsuranceMonthly || 0) + (form.adminExpensesMonthly || 0) || form.fixedCosts || 6500,
        monthlyPrice: preview.monthlyPrice,
        dailyRate: preview.dailyRate,
        franchiseKm: preview.franchiseKm,
        excessKmRate: preview.excessKmRate,
        extraTripRate: preview.extraTripRate,
        totalMonthlyCost: preview.totalMonthlyCost,
        totalFixedCost: preview.totalFixedCost,
        variableCostPerKm: preview.variableCostPerKm,
        version: isNewVersion ? (form.version || 1) + 1 : form.version || 1,
      };

      let result: CostSimulation;
      if (form.id && !isNewVersion) {
        result = await costSimulationService.update(form.id, payload);
        toast({
          title: 'Simulação Atualizada',
          description: 'Custos e preços recalculados com sucesso.',
        });
      } else {
        const { id, ...createPayload } = payload;
        result = await costSimulationService.create(createPayload as CostSimulation);
        toast({
          title: isNewVersion ? 'Nova Versão Criada' : 'Simulação Criada',
          description: isNewVersion
            ? `Versão ${(payload.version || 2)} salva com sucesso.`
            : 'Ficha paramétrica salva e precificada com sucesso.',
        });
      }

      if (onSaved) {
        onSaved(result);
      }
    } catch (e: any) {
      toast({
        title: 'Erro ao Salvar',
        description: e?.response?.data?.message || 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm(defaultFormState());
    setSelectedPreset('');
    toast({
      title: 'Formulário Reiniciado',
      description: 'Valores restaurados para o padrão de simulação.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-card/90 backdrop-blur-md border border-border/60 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500 flex items-center justify-center shrink-0">
            <Calculator className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Lançamento de Custos Operacionais
              </h2>
              <Badge className="bg-red-600/20 text-red-400 border-none font-semibold text-[10px] uppercase">
                Lançamento de Custos
              </Badge>
              {form.version && (
                <Badge variant="outline" className="text-xs bg-muted/40">
                  v{form.version}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Insira as variáveis de rota, custos fixos, mão de obra, insumos e impostos com recálculo instantâneo estilo Excel.
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Select value={selectedPreset} onValueChange={handleLoadPreset}>
            <SelectTrigger className="w-full lg:w-[320px] bg-card text-xs font-medium border-border/70">
              <Sparkles className="h-3.5 w-3.5 mr-2 text-amber-500" />
              <SelectValue placeholder="Carregar Rota Real de Exemplo..." />
            </SelectTrigger>
            <SelectContent>
              {SEED_ROUTE_TEMPLATES.map((t) => (
                <SelectItem key={t.id} value={t.id!} className="text-xs">
                  {t.itemNumber}. {t.name} ({fmtBRL(t.monthlyPrice)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid Principal: Formulário de Entrada (Esquerda) + Quadro Reativo Sticky (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário de Input (8 Colunas) */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs defaultValue="parametros" className="w-full">
            <TabsList className="grid grid-cols-4 w-full p-1 bg-card/80 border border-border/60 rounded-xl h-auto">
              <TabsTrigger value="parametros" className="py-2.5 text-xs font-semibold gap-1.5">
                <Route className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">1. Parâmetros</span>
                <span className="sm:hidden">Rota</span>
              </TabsTrigger>
              <TabsTrigger value="fixos" className="py-2.5 text-xs font-semibold gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">2. Custos Fixos</span>
                <span className="sm:hidden">Fixos</span>
              </TabsTrigger>
              <TabsTrigger value="variaveis" className="py-2.5 text-xs font-semibold gap-1.5">
                <Fuel className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">3. Variáveis</span>
                <span className="sm:hidden">Variáveis</span>
              </TabsTrigger>
              <TabsTrigger value="tributos" className="py-2.5 text-xs font-semibold gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">4. Impostos</span>
                <span className="sm:hidden">Impostos</span>
              </TabsTrigger>
            </TabsList>

            {/* SEÇÃO 1: PARÂMETROS DA ROTA */}
            <TabsContent value="parametros" className="space-y-4 pt-3">
              <Card className="border border-border/60 shadow-lg">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Route className="h-4 w-4 text-red-500" />
                    Identificação da Operação & Especificidades da Rota
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Defina o nome da operação, categoria de veículo, locais de origem/destino e horários.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">Nome da Operação / Rota *</Label>
                      <Input
                        placeholder="Ex.: Congonhas x Várzea do Lopes (3 Turnos)"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className="text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Local Inicial (Origem) *</Label>
                      <Input
                        placeholder="Ex.: BELO VALE, CONGONHAS, ITABIRITO..."
                        value={form.origin || ''}
                        onChange={(e) => setField('origin', e.target.value.toUpperCase())}
                        className="text-xs uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Local Final (Destino) *</Label>
                      <Input
                        placeholder="Ex.: VARZEA DO LOPES, CSN, MINA..."
                        value={form.destination || ''}
                        onChange={(e) => setField('destination', e.target.value.toUpperCase())}
                        className="text-xs uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Tipo / Categoria de Veículo *</Label>
                      <Select
                        value={form.vehicleCategory}
                        onValueChange={(v: VehicleCategory) => {
                          setField('vehicleCategory', v);
                          const lbl = v === 'BUS' ? 'ÔNIBUS' : v === 'MICRO_BUS' ? 'MICRO' : 'VAN';
                          setField('vehicleTypeLabel', lbl);
                        }}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-xs">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Escala de Trabalho *</Label>
                        <button
                          type="button"
                          onClick={() => setShowScaleModal(true)}
                          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          title="Cadastrar nova escala de trabalho"
                        >
                          <PlusCircle className="h-3 w-3" />
                          Nova Escala
                        </button>
                      </div>
                      <SearchableSelect
                        value={form.scale || ''}
                        onChange={(value) => setField('scale', value)}
                        options={scaleOptions.map((s): SearchableOption => ({
                          value: s.name,
                          label: s.name,
                          subtitle: s.type === 'WEEKLY' ? 'Semanal'
                            : s.type === 'ROTATING_12X36' ? 'Rotativo 12x36'
                            : s.type === 'ROTATING_24X48' ? 'Rotativo 24x48'
                            : 'Customizada',
                        }))}
                        placeholder="Digite 3 caracteres para buscar ou selecione..."
                        searchPlaceholder="Buscar escala por nome..."
                        emptyText="Nenhuma escala encontrada. Clique em 'Nova Escala' para cadastrar."
                        minSearchLength={3}
                        minSearchHint="Digite pelo menos 3 caracteres para buscar."
                        className="text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">Turnos & Horários da Operação</Label>
                      <Input
                        placeholder="Ex.: A (07:00 ÁS 15:00) / B (15:00 ÁS 23:00) / C (23:00 ÁS 07:00)"
                        value={form.shift || ''}
                        onChange={(e) => setField('shift', e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Cliente / Lead Vinculado (Opcional)</Label>
                        <button
                          type="button"
                          onClick={() => setShowClientModal(true)}
                          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          title="Cadastrar novo cliente sem sair da tela"
                        >
                          <PlusCircle className="h-3 w-3" />
                          Novo Cliente
                        </button>
                      </div>
                      <SearchableSelect
                        value={form.clientId || ''}
                        onChange={(value) => {
                          if (!value) {
                            setField('clientId', null);
                            setField('clientName', null);
                          } else {
                            const found = clientOptions.find((c) => String(c.id) === value);
                            setField('clientId', value);
                            setField('clientName', found ? found.name : null);
                          }
                        }}
                        options={[
                          { value: '', label: 'Sem cliente vinculado' },
                          ...clientOptions.map((c): SearchableOption => ({
                            value: String(c.id),
                            label: c.name,
                          })),
                        ]}
                        placeholder="Digite 3 caracteres para buscar o cliente..."
                        searchPlaceholder="Buscar cliente por nome..."
                        emptyText="Nenhum cliente encontrado. Clique em 'Novo Cliente' para cadastrar."
                        minSearchLength={3}
                        minSearchHint="Digite pelo menos 3 caracteres para buscar."
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Observações Comerciais</Label>
                      <Input
                        placeholder="Ex.: Reajuste de diesel semestral, pedágio incluso..."
                        value={form.notes || ''}
                        onChange={(e) => setField('notes', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEÇÃO 2: CUSTOS FIXOS (MÃO DE OBRA & VEÍCULO) */}
            <TabsContent value="fixos" className="space-y-4 pt-3">
              <Card className="border border-border/60 shadow-lg">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Custos Fixos de Mão de Obra (Motoristas)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Salário base da categoria CCT, encargos trabalhistas, benefícios e escalas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Regime / Qtd. Motoristas *</Label>
                      <Select
                        value={String(form.driverCount)}
                        onValueChange={(v) => setField('driverCount', parseInt(v))}
                      >
                        <SelectTrigger className="text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Motorista (Turno Único / ADM)</SelectItem>
                          <SelectItem value="2">2 Motoristas (2 Turnos - 16h)</SelectItem>
                          <SelectItem value="3">3 Motoristas (3 Turnos - 24h contínuo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Salário Base CCT (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.baseSalary ?? ''}
                        onChange={(e) => setField('baseSalary', num(e.target.value))}
                        className="text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Encargos Sociais & Trabalhistas ({fmtPct(form.payrollChargesPct)}) *
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="70"
                        value={form.payrollChargesPct ? (form.payrollChargesPct * 100).toString() : ''}
                        onChange={(e) => {
                          const v = num(e.target.value);
                          setField('payrollChargesPct', v ? v / 100 : 0);
                        }}
                        className="text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Ticket Alimentação (R$/mês)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.mealAllowance ?? ''}
                        onChange={(e) => setField('mealAllowance', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Plano de Saúde / Odonto (R$/mês)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.healthPlanCost ?? ''}
                        onChange={(e) => setField('healthPlanCost', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Adicional Noturno / Horas Extras (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.nightShiftExtra ?? ''}
                        onChange={(e) => setField('nightShiftExtra', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 shadow-lg">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    Custos Fixos do Veículo & Estrutura Administrativa
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Depreciação Mensal do Veículo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.depreciationMonthly ?? ''}
                        onChange={(e) => setField('depreciationMonthly', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Seguro, IPVA & Licenciamento (R$/mês)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.ipvaInsuranceMonthly ?? ''}
                        onChange={(e) => setField('ipvaInsuranceMonthly', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Despesas Administrativas / Rateio (R$/mês)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.adminExpensesMonthly ?? ''}
                        onChange={(e) => setField('adminExpensesMonthly', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEÇÃO 3: CUSTOS VARIÁVEIS (KM & INSUMOS) */}
            <TabsContent value="variaveis" className="space-y-4 pt-3">
              <Card className="border border-border/60 shadow-lg">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-amber-500" />
                    Quilometragem & Consumo de Combustível
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cálculo da quilometragem produtiva, fator de garagem e projeção de combustível.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">KM Diário da Rota (ida + volta) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.dailyKm ?? ''}
                        onChange={(e) => setField('dailyKm', num(e.target.value))}
                        className="text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Dias Operacionais no Mês *</Label>
                      <Select
                        value={String(form.operatingDays)}
                        onValueChange={(v) => setField('operatingDays', parseInt(v))}
                      >
                        <SelectTrigger className="text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="22">22 dias (Segunda a Sexta)</SelectItem>
                          <SelectItem value="26">26 dias (Segunda a Sábado)</SelectItem>
                          <SelectItem value="30">30 dias (Integral / Minas)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Fator KM Improdutiva (Garagem)</Label>
                      <Input
                        type="number"
                        step="0.05"
                        placeholder="1.00"
                        value={form.productivityFactor ?? ''}
                        onChange={(e) => setField('productivityFactor', num(e.target.value))}
                        className="text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Preço do Diesel (R$/Litro) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.dieselPrice ?? ''}
                        onChange={(e) => setField('dieselPrice', num(e.target.value))}
                        className="text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Consumo Médio Projetado (Km/L)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2.2"
                        value={form.fuelConsumptionKmL ?? ''}
                        onChange={(e) => setField('fuelConsumptionKmL', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Custo de Arla 32 (R$/km)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.05"
                        value={form.arlaCostPerKm ?? ''}
                        onChange={(e) => setField('arlaCostPerKm', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 shadow-lg">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Car className="h-4 w-4 text-amber-500" />
                    Manutenção, Pneus e Lubrificantes por KM
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Manutenção Preventiva (R$/km)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.maintenancePerKm ?? ''}
                        onChange={(e) => setField('maintenancePerKm', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Desgaste / Troca de Pneus (R$/km)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.tiresPerKm ?? ''}
                        onChange={(e) => setField('tiresPerKm', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Lubrificantes (R$/km)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.lubricantsPerKm ?? ''}
                        onChange={(e) => setField('lubricantsPerKm', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Peças / Outros (R$/km)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.partsPerKm ?? ''}
                        onChange={(e) => setField('partsPerKm', num(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEÇÃO 4: IMPOSTOS & MARGENS */}
            <TabsContent value="tributos" className="space-y-4 pt-3">
              <Card className="border border-border/60 shadow-lg">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Alíquotas de Impostos & Margens Comerciais
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Impostos calculados por dentro para garantir o markup líquido desejado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">ISS (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.issPct !== undefined ? (form.issPct * 100).toString() : ''}
                        onChange={(e) => {
                          const v = num(e.target.value);
                          setField('issPct', v ? v / 100 : 0);
                        }}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">PIS (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.pisPct !== undefined ? (form.pisPct * 100).toString() : ''}
                        onChange={(e) => {
                          const v = num(e.target.value);
                          setField('pisPct', v ? v / 100 : 0);
                        }}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">COFINS (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.cofinsPct !== undefined ? (form.cofinsPct * 100).toString() : ''}
                        onChange={(e) => {
                          const v = num(e.target.value);
                          setField('cofinsPct', v ? v / 100 : 0);
                        }}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">IRPJ / CSLL (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.irpjPct !== undefined ? ((form.irpjPct + (form.csllPct || 0)) * 100).toFixed(2) : ''}
                        onChange={(e) => {
                          const v = num(e.target.value);
                          setField('irpjPct', v ? (v * 0.7) / 100 : 0);
                          setField('csllPct', v ? (v * 0.3) / 100 : 0);
                        }}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-emerald-500">Margem de Lucro Alvo (%) *</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={form.profitMarginPct !== undefined ? (form.profitMarginPct * 100).toString() : ''}
                        onChange={(e) => {
                          const v = num(e.target.value);
                          setField('profitMarginPct', v ? v / 100 : 0);
                        }}
                        className="text-xs font-bold border-emerald-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">BDI (%)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={form.bdiPct !== undefined ? (form.bdiPct * 100).toString() : ''}
                        onChange={(e) => {
                          const v = num(e.target.value);
                          setField('bdiPct', v ? v / 100 : 0);
                        }}
                        className="text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">Adicional de Viagem Extra (%)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={form.extraTripMarginPct !== undefined ? (form.extraTripMarginPct * 100).toString() : ''}
                        onChange={(e) => {
                          const v = num(e.target.value);
                          setField('extraTripMarginPct', v ? v / 100 : 0);
                        }}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botões de Ação na base do formulário */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Limpar Campos
              </Button>
              {onGoToSummary && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onGoToSummary}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Ver Tabela Consolidada
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {form.id && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSaving}
                  onClick={() => handleSave(true)}
                  className="text-xs"
                >
                  Salvar Nova Versão (v{(form.version || 1) + 1})
                </Button>
              )}
              <Button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 shadow-lg shadow-red-600/20"
              >
                <Save className="h-4 w-4 mr-2" />
                {form.id ? 'Salvar Alterações' : 'Salvar & Calcular Preço'}
              </Button>
            </div>
          </div>
        </div>

        {/* Quadro Reativo Sticky (4 Colunas) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <Card className="border-2 border-red-500/30 bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 text-white">
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-200 block">
                Engenharia de Custos • Ao Vivo
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs font-medium text-red-100">VALOR FINAL MENSAL</span>
                <span className="text-2xl font-black">{fmtBRL(preview.monthlyPrice)}</span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-red-100 mt-1 border-t border-red-500/60 pt-1">
                <span>Valor da Diária:</span>
                <span className="font-bold text-white">{fmtBRL(preview.dailyRate)}</span>
              </div>
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Totalizadores Fixos & Variáveis */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-500" /> Custo Fixo Mensal:
                  </span>
                  <span className="font-bold text-foreground">{fmtBRL(preview.totalFixedCost)}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-amber-500" /> Custo Variável Total:
                  </span>
                  <span className="font-bold text-foreground">
                    {fmtBRL((preview.franchiseKm || 0) * (preview.variableCostPerKm || 0))}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Route className="h-3.5 w-3.5 text-purple-500" /> Franquia Mensal:
                  </span>
                  <span className="font-bold text-foreground">{fmtKm(preview.franchiseKm)}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Custo Unitário por KM:
                  </span>
                  <span className="font-bold text-foreground">{fmtBRL(preview.variableCostPerKm)} / km</span>
                </div>
              </div>

              {/* Quadro DRE Sintético */}
              <div className="border border-border/60 rounded-xl p-3 bg-muted/20 space-y-2 text-xs">
                <div className="flex justify-between items-center font-semibold text-foreground">
                  <span>Custo Operacional Total:</span>
                  <span>{fmtBRL(preview.totalMonthlyCost)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Tributos por Dentro ({fmtPct(preview.taxesTotalPct)}):</span>
                  <span className="text-amber-500">{fmtBRL(preview.monthlyPrice * preview.taxesTotalPct)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Lucro Líquido ({fmtPct(form.profitMarginPct)}):</span>
                  <span className="text-emerald-500 font-semibold">
                    {fmtBRL(preview.monthlyPrice - preview.totalMonthlyCost - (preview.monthlyPrice * preview.taxesTotalPct))}
                  </span>
                </div>
              </div>

              {/* Botão de Ação Imediata: Proposta */}
              {onGenerateProposal && (
                <Button
                  type="button"
                  onClick={() => {
                    const fullSimulation: CostSimulation = {
                      ...form,
                      monthlyPrice: preview.monthlyPrice,
                      dailyRate: preview.dailyRate,
                      franchiseKm: preview.franchiseKm,
                      excessKmRate: preview.excessKmRate,
                      extraTripRate: preview.extraTripRate,
                      totalMonthlyCost: preview.totalMonthlyCost,
                      totalFixedCost: preview.totalFixedCost,
                      variableCostPerKm: preview.variableCostPerKm,
                    };
                    onGenerateProposal(fullSimulation);
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-red-600/20 gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Gerar Proposta Comercial Oficial
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cadastro Rápido de Cliente (sem sair da tela) */}
      <ClientFormModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSuccess={handleClientCreated}
      />

      {/* Modal de Cadastro Rápido de Escala de Trabalho */}
      {showScaleModal && (
        <div className="fixed inset-0 z-[10090] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-card border border-border/70 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-border/50 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Clock4 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Cadastrar Nova Escala de Trabalho</h3>
                <p className="text-xs text-muted-foreground">A escala ficará disponível para todas as simulações.</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nome da Escala *</Label>
                <Input
                  autoFocus
                  placeholder="Ex.: SEG Á SAB, 5x2, 12x36, DOM A DOM..."
                  value={newScaleName}
                  onChange={(e) => setNewScaleName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateScale())}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo da Escala</Label>
                <Select value={newScaleType} onValueChange={setNewScaleType}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOM">Customizada</SelectItem>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="ROTATING_12X36">Rotativo 12x36</SelectItem>
                    <SelectItem value="ROTATING_24X48">Rotativo 24x48</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-5 pt-0 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowScaleModal(false)}
                disabled={savingScale}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateScale}
                disabled={savingScale || !newScaleName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {savingScale ? 'Salvando...' : 'Cadastrar Escala'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostLaunchTab;
