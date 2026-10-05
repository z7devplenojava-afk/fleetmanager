import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Trash,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Car,
  Clock,
  Navigation,
  FileCheck,
  Percent,
  Receipt,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface LeasedVehicleItem {
  id: string;
  itemNumber: number;
  description: string;
  route: string;
  plate: string;
  period: string;
  monthlyRate: number;
  workingDays: number;
  dailyRate: number;
  totalPeriod: number;
  observations?: string;
}

export interface ExtraTripItem {
  id: string;
  date: string;
  plate: string;
  route: string;
  vehicleType: string;
  tripCost: number;
  total: number;
}

export interface ExcessKmItem {
  id: string;
  periodMonth: string;
  plate: string;
  franchiseKm: number;
  totalKmDriven: number;
  disregardedKm: number;
  consideredKm: number;
  excessKm: number;
  excessKmRate: number;
  totalExcessValue: number;
}

export interface ContractDeductionItem {
  id: string;
  date: string;
  plate: string;
  description: string;
  type: 'DEBIT' | 'CREDIT';
  value: number;
}

export interface RevenueInvoiceData {
  invoiceNumber: string;
  series: string;
  issueDate: string;
  dueDate: string;
  serviceCode: string;
  issRatePercentage: number;
  grossValue: number;
  pisRetention: number;
  cofinsRetention: number;
  csllRetention: number;
  inssRetention: number;
  netReceivableValue: number;
  accessKey: string;
  attachedFile?: string;
  status: 'DRAFT' | 'ISSUED' | 'SENT_TO_RECEIVABLES' | 'PAID';
}

const CLIENT_CONTRACTS_MOCK = [
  {
    id: 'cli-01',
    clientName: 'GERAES ARQUITETURA E ENGENHARIA LTDA',
    clientCnpj: '25.618.133/0001-57',
    measurementNumber: '016',
    periodStart: '2024-03-21',
    periodEnd: '2024-04-20',
    dueDate: '2024-05-05',
    contractNumber: 'CTC-GERAES-2024/01'
  },
  {
    id: 'cli-02',
    clientName: 'ALMENARA TURISMO EIRELI',
    clientCnpj: '18.442.991/0001-08',
    measurementNumber: '004',
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    dueDate: '2024-03-05',
    contractNumber: 'CTC-ALMENARA-2024/02'
  },
  {
    id: 'cli-03',
    clientName: 'VALE S.A.',
    clientCnpj: '33.592.510/0001-54',
    measurementNumber: '088',
    periodStart: '2024-09-01',
    periodEnd: '2024-09-30',
    dueDate: '2024-10-15',
    contractNumber: 'CTC-VALE-2024/88'
  }
];

export const ClientContractMeasurementManager: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState('cli-01');
  const [activeTab, setActiveTab] = useState('leased-vehicles');
  const { toast } = useToast();

  const currentClient = CLIENT_CONTRACTS_MOCK.find(c => c.id === selectedClientId) || CLIENT_CONTRACTS_MOCK[0];

  // State: Veículos Locados
  const [leasedVehicles, setLeasedVehicles] = useState<LeasedVehicleItem[]>([
    {
      id: 'lv-1',
      itemNumber: 1,
      description: 'PRESTAÇÃO DE SERVIÇO COM ÔNIBUS RODOVIÁRIO, COM CESSÃO DE MÃO DE OBRA PARA TRANSPORTE DE FUNCIONÁRIOS.',
      route: 'PRAÇA DA ESTAÇÃO - BH/MG X MINA VALE MIGUELÃO - N. LIMA-MG',
      plate: 'RUR-7A78',
      period: '21/03/2024 À 20/04/2024',
      monthlyRate: 33600.00,
      workingDays: 30,
      dailyRate: 1120.00,
      totalPeriod: 33600.00,
      observations: '02 MOTORISTAS'
    },
    {
      id: 'lv-2',
      itemNumber: 2,
      description: 'PRESTAÇÃO DE SERVIÇO COM MICRO ÔNIBUS RODOVIÁRIO, COM CESSÃO DE MÃO DE OBRA PARA TRANSPORTE DE FUNCIONÁRIOS.',
      route: 'RAPOSOS - NOVA LIMA/MG X MINA VALE MIGUELÃO - N. LIMA-MG',
      plate: 'SHZ-3A40',
      period: '21/03/2024 À 20/04/2024',
      monthlyRate: 34500.00,
      workingDays: 30,
      dailyRate: 1150.00,
      totalPeriod: 34500.00,
      observations: '02 MOTORISTAS'
    }
  ]);

  // State: Viagens Extras
  const [extraTrips, setExtraTrips] = useState<ExtraTripItem[]>([
    {
      id: 'et-1',
      date: '2024-04-05',
      plate: 'RUR-7A78',
      route: 'Belo Horizonte X Ouro Preto (Turno Especial)',
      vehicleType: 'Ônibus Rodoviário',
      tripCost: 1200.00,
      total: 1200.00
    }
  ]);

  // State: Quilometragem Excedente
  const [excessKmItems, setExcessKmItems] = useState<ExcessKmItem[]>([
    {
      id: 'ekm-1',
      periodMonth: 'ABRIL',
      plate: 'RUR-7A78',
      franchiseKm: 2000,
      totalKmDriven: 2592,
      disregardedKm: 921,
      consideredKm: 1671,
      excessKm: 0,
      excessKmRate: 8.60,
      totalExcessValue: 0.00
    },
    {
      id: 'ekm-2',
      periodMonth: 'ABRIL',
      plate: 'SHZ-3A40',
      franchiseKm: 2000,
      totalKmDriven: 2497,
      disregardedKm: 191,
      consideredKm: 2306,
      excessKm: 306,
      excessKmRate: 6.90,
      totalExcessValue: 2111.40
    }
  ]);

  // State: Débitos / Deduções
  const [deductions, setDeductions] = useState<ContractDeductionItem[]>([
    {
      id: 'ded-1',
      date: '2024-04-01',
      plate: 'SHZ-3A40',
      description: 'APÓLICE SEGURO DE FROTA - MÊS ABRIL',
      type: 'DEBIT',
      value: 159.80
    }
  ]);

  // State: Nota Fiscal de Receita
  const [invoice, setInvoice] = useState<RevenueInvoiceData>({
    invoiceNumber: '0001642',
    series: '1',
    issueDate: '2024-04-22',
    dueDate: currentClient.dueDate,
    serviceCode: '07.02 - Transporte Coletivo de Passageiros',
    issRatePercentage: 2.5,
    grossValue: 71351.60, // 68100 (locacao) + 1200 (extra) + 2111.40 (km) - 159.80
    pisRetention: 463.78,
    cofinsRetention: 2140.55,
    csllRetention: 713.51,
    inssRetention: 0.00,
    netReceivableValue: 68033.76,
    accessKey: '31240471055644000125550010000016421004829103',
    status: 'ISSUED'
  });

  // Cálculos Totais
  const totalLeasedVehicles = leasedVehicles.reduce((sum, i) => sum + i.totalPeriod, 0);
  const totalExtraTrips = extraTrips.reduce((sum, i) => sum + i.total, 0);
  const totalExcessKm = excessKmItems.reduce((sum, i) => sum + i.totalExcessValue, 0);
  const totalDeductions = deductions.reduce((sum, i) => sum + (i.type === 'DEBIT' ? i.value : -i.value), 0);
  
  const totalGrossMeasurement = totalLeasedVehicles + totalExtraTrips + totalExcessKm - totalDeductions;

  // Handlers para adição
  const handleAddLeasedVehicle = () => {
    const newItem: LeasedVehicleItem = {
      id: `lv-${Date.now()}`,
      itemNumber: leasedVehicles.length + 1,
      description: 'PRESTAÇÃO DE SERVIÇO DE TRANSPORTE DE PASSAGEIROS',
      route: 'NOVA ROTA X UNIDADE OPERACIONAL',
      plate: 'ABC-1234',
      period: '21/03/2024 À 20/04/2024',
      monthlyRate: 30000.00,
      workingDays: 30,
      dailyRate: 1000.00,
      totalPeriod: 30000.00,
      observations: '01 MOTORISTA'
    };
    setLeasedVehicles([...leasedVehicles, newItem]);
    toast({ title: 'Veículo adicionado à medição' });
  };

  const handleAddExtraTrip = () => {
    const newTrip: ExtraTripItem = {
      id: `et-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      plate: 'RUR-7A78',
      route: 'Viagem Adicional de Apoio',
      vehicleType: 'Ônibus',
      tripCost: 800.00,
      total: 800.00
    };
    setExtraTrips([...extraTrips, newTrip]);
    toast({ title: 'Viagem extra adicionada' });
  };

  const handleAddDeduction = () => {
    const newDed: ContractDeductionItem = {
      id: `ded-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      plate: 'RUR-7A78',
      description: 'Manutenção Emergencial com NF Autorizada',
      type: 'DEBIT',
      value: 250.00
    };
    setDeductions([...deductions, newDed]);
    toast({ title: 'Débito/Desconto inserido' });
  };

  const handleSendToReceivables = () => {
    setInvoice({ ...invoice, status: 'SENT_TO_RECEIVABLES' });
    toast({
      title: '⚡ Lançado no Contas a Receber!',
      description: `Nota Fiscal Nº ${invoice.invoiceNumber} (R$ ${totalGrossMeasurement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) enviada para cobrança e geração de boleto.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Cliente & Cabeçalho da Medição */}
      <Card className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 w-full lg:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold">
                  Medição de Fretamento & Locação
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs font-mono">
                  Contrato: {currentClient.contractNumber}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-amber-400 shrink-0" />
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {currentClient.clientName}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">CNPJ: {currentClient.clientCnpj}</p>
                </div>
              </div>
            </div>

            {/* Controles de Período e Seleção de Cliente */}
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-start lg:justify-end">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Selecione o Cliente / Contrato:</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="w-72 bg-zinc-900 border-zinc-700 text-zinc-200 font-semibold">
                    <SelectValue placeholder="Escolha um cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    {CLIENT_CONTRACTS_MOCK.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.clientName} (Medição {client.measurementNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl text-xs space-y-1 font-mono">
                <div className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Período: <span className="text-zinc-100 font-bold">{currentClient.periodStart} à {currentClient.periodEnd}</span>
                </div>
                <div className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Vencimento NF: <span className="text-emerald-400 font-bold">{currentClient.dueDate}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards com Resumo Financeiro da Medição */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400 font-bold uppercase">1. Veículos Locados</p>
            <p className="text-xl font-bold text-white mt-1 font-mono">
              R$ {totalLeasedVehicles.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-zinc-500">{leasedVehicles.length} veículo(s) rodando</span>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400 font-bold uppercase">2. Viagens Extras</p>
            <p className="text-xl font-bold text-blue-400 mt-1 font-mono">
              R$ {totalExtraTrips.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-zinc-500">{extraTrips.length} viagem(ns) adicional(is)</span>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400 font-bold uppercase">3. KM Excedente</p>
            <p className="text-xl font-bold text-amber-400 mt-1 font-mono">
              R$ {totalExcessKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-zinc-500">Franquias e hodômetros</span>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400 font-bold uppercase">4. Deduções / Débitos</p>
            <p className="text-xl font-bold text-red-400 mt-1 font-mono">
              -R$ {totalDeductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-zinc-500">Descontos autorizados</span>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500/40 shadow-xl">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-400 font-extrabold uppercase">TOTAL LÍQUIDO MEDIÇÃO</p>
            <p className="text-2xl font-black text-emerald-300 mt-1 font-mono">
              R$ {totalGrossMeasurement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] mt-1">
              Pronto para Nota Fiscal
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Abas Principais da Medição */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl flex flex-wrap gap-1">
          <TabsTrigger value="leased-vehicles" className="data-[state='active']:bg-amber-600 data-[state='active']:text-white font-bold text-xs">
            🚍 1. Veículos Locados ({leasedVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="partes-diarias" className="data-[state='active']:bg-amber-600 data-[state='active']:text-white font-bold text-xs">
            📋 2. Partes Diárias (Boletins)
          </TabsTrigger>
          <TabsTrigger value="extra-trips" className="data-[state='active']:bg-amber-600 data-[state='active']:text-white font-bold text-xs">
            ⚡ 3. Viagens Extras & KM Excedente
          </TabsTrigger>
          <TabsTrigger value="deductions" className="data-[state='active']:bg-amber-600 data-[state='active']:text-white font-bold text-xs">
            💳 4. Débitos / Descontos ({deductions.length})
          </TabsTrigger>
          <TabsTrigger value="invoice-billing" className="data-[state='active']:bg-emerald-600 data-[state='active']:text-white font-extrabold text-xs">
            📄 5. Nota Fiscal de Receita (NFS-e) & Faturamento
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Veículos Locados */}
        <TabsContent value="leased-vehicles" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-amber-400">Veículos Locados sob Contrato Fixo</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Apurado com base no valor mensal contratado, dias rodados e diárias dos motoristas (Conforme layout Viação São Silvestre).
                </CardDescription>
              </div>
              <Button onClick={handleAddLeasedVehicle} size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-semibold">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Veículo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-800 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                      <TableHead className="w-12 text-center text-zinc-400">Item</TableHead>
                      <TableHead className="text-zinc-300">Descrição dos Serviços / Trajeto</TableHead>
                      <TableHead className="text-zinc-300">Placa</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Mensal</TableHead>
                      <TableHead className="text-center text-zinc-300">Dias Rodados</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Diário</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Período</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leasedVehicles.map((item, idx) => (
                      <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900/50">
                        <TableCell className="text-center font-bold text-amber-400">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-zinc-100">{item.description}</div>
                          <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Navigation className="w-3 h-3 text-amber-400" /> {item.route}
                          </div>
                          {item.observations && (
                            <Badge className="bg-zinc-800 text-zinc-300 text-[10px] mt-1">{item.observations}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-blue-400">{item.plate}</TableCell>
                        <TableCell className="text-right font-mono text-zinc-300">
                          R$ {item.monthlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="border-zinc-700 text-zinc-200">
                            {item.workingDays} dias
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-zinc-400 text-xs">
                          R$ {item.dailyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-400">
                          R$ {item.totalPeriod.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-zinc-900/80 font-bold border-t-2 border-zinc-700">
                      <TableCell colSpan={6} className="text-right uppercase text-zinc-300">Total Locações:</TableCell>
                      <TableCell className="text-right font-mono text-amber-400 text-base">
                        R$ {totalLeasedVehicles.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Partes Diárias Operacionais */}
        <TabsContent value="partes-diarias" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-amber-400">Partes Diárias (Boletins Diários de Viagens)</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Lançamento individual dos serviços prestados por dia, hodômetros de partida/chegada e motoristas escalados.
                </CardDescription>
              </div>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-semibold">
                <Plus className="w-4 h-4 mr-1" /> Lançar Parte Diária
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-800 rounded-lg p-6 text-center bg-zinc-900/30">
                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-zinc-200">12 Partes Diárias Registradas no Período</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                  Todas as partes diárias deste contrato foram apuradas e consolidadas automaticamente no quadro de veículos locados e quilometragem excedente.
                </p>
                <Button variant="outline" className="mt-4 border-zinc-700 text-zinc-200">
                  👁️ Visualizar Registro Detalhado por Dia
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Viagens Extras & KM Excedente */}
        <TabsContent value="extra-trips" className="space-y-6">
          {/* Viagens Extras */}
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-blue-400">Viagens Extras & Serviços Adicionais</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Viagens não contempladas no contrato fixo executadas sob demanda do cliente.
                </CardDescription>
              </div>
              <Button onClick={handleAddExtraTrip} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Viagem Extra
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-800 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-300">Data</TableHead>
                      <TableHead className="text-zinc-300">Placa</TableHead>
                      <TableHead className="text-zinc-300">Trajeto / Destino</TableHead>
                      <TableHead className="text-zinc-300">Tipo de Veículo</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Viagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extraTrips.map(trip => (
                      <TableRow key={trip.id} className="border-zinc-800">
                        <TableCell className="font-mono text-xs text-zinc-300">{trip.date}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-blue-400">{trip.plate}</TableCell>
                        <TableCell className="text-zinc-200">{trip.route}</TableCell>
                        <TableCell className="text-zinc-400 text-xs">{trip.vehicleType}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-400">
                          R$ {trip.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Quilometragem Excedente */}
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-amber-400">Quilometragem Excedente (Apuração de Hodômetro)</CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Cálculo de Franquia Contratada vs KM Rodado, glosas desconsideradas e valor por KM excedente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-800 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-300">Período</TableHead>
                      <TableHead className="text-zinc-300">Placa</TableHead>
                      <TableHead className="text-right text-zinc-300">Franquia (KM)</TableHead>
                      <TableHead className="text-right text-zinc-300">KM Rodado</TableHead>
                      <TableHead className="text-right text-zinc-300">KM Desconsiderado</TableHead>
                      <TableHead className="text-right text-zinc-300">KM Considerado</TableHead>
                      <TableHead className="text-right text-zinc-300">KM Excedido</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor/KM Exc.</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Total Exc.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excessKmItems.map(item => (
                      <TableRow key={item.id} className="border-zinc-800">
                        <TableCell className="font-bold text-zinc-300 text-xs">{item.periodMonth}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-blue-400">{item.plate}</TableCell>
                        <TableCell className="text-right font-mono text-zinc-300">{item.franchiseKm.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-right font-mono text-zinc-200 font-semibold">{item.totalKmDriven.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-right font-mono text-zinc-500">{item.disregardedKm.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-right font-mono text-zinc-300">{item.consideredKm.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-amber-400">
                          {item.excessKm > 0 ? item.excessKm.toLocaleString('pt-BR') : '0'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-zinc-400 text-xs">
                          R$ {item.excessKmRate.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-400">
                          R$ {item.totalExcessValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-zinc-900/80 font-bold border-t-2 border-zinc-700">
                      <TableCell colSpan={8} className="text-right uppercase text-zinc-300">Total KM Excedente:</TableCell>
                      <TableCell className="text-right font-mono text-amber-400 text-base">
                        R$ {totalExcessKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Débitos & Descontos de Contrato */}
        <TabsContent value="deductions" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-red-400">Débitos & Repasses de Contrato (Fechamento)</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Descontos de apólice de seguro, IPVA ou autopeças conforme modelo de demonstrativo.
                </CardDescription>
              </div>
              <Button onClick={handleAddDeduction} size="sm" variant="outline" className="border-red-500/50 bg-red-950/30 text-red-300 hover:bg-red-900/60">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Débito
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-800 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-300">Data</TableHead>
                      <TableHead className="text-zinc-300">Placa</TableHead>
                      <TableHead className="text-zinc-300">Descrição do Débito / Desconto</TableHead>
                      <TableHead className="text-center text-zinc-300">Tipo</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions.map(ded => (
                      <TableRow key={ded.id} className="border-zinc-800">
                        <TableCell className="font-mono text-xs text-zinc-400">{ded.date}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-blue-400">{ded.plate}</TableCell>
                        <TableCell className="text-zinc-200">{ded.description}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/40">DÉBITO</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-red-400">
                          -R$ {ded.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: Nota Fiscal de Receita & Faturamento */}
        <TabsContent value="invoice-billing" className="space-y-6">
          <Card className="bg-zinc-950 border-emerald-500/40 text-zinc-100 shadow-2xl">
            <CardHeader className="border-b border-zinc-800 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-black text-emerald-400 flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-emerald-400" />
                    Faturamento da Medição & Nota Fiscal de Serviço (NFS-e)
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs mt-1">
                    Insira os dados da Nota Fiscal de Receita emitida para o cliente para faturamento e integração com o Contas a Receber.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-200">
                    <Printer className="w-4 h-4 mr-2" /> Gerar PDF Medição
                  </Button>
                  <Button
                    onClick={handleSendToReceivables}
                    disabled={invoice.status === 'SENT_TO_RECEIVABLES'}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-600/30"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {invoice.status === 'SENT_TO_RECEIVABLES' ? '⚡ Já Enviado ao Contas a Receber' : '⚡ Lançar no Contas a Receber'}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Formulário da Nota Fiscal */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Número da Nota Fiscal (NFS-e):</Label>
                  <Input
                    value={invoice.invoiceNumber}
                    onChange={e => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Série da NF:</Label>
                  <Input
                    value={invoice.series}
                    onChange={e => setInvoice({ ...invoice, series: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Data de Emissão:</Label>
                  <Input
                    type="date"
                    value={invoice.issueDate}
                    onChange={e => setInvoice({ ...invoice, issueDate: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Data de Vencimento:</Label>
                  <Input
                    type="date"
                    value={invoice.dueDate}
                    onChange={e => setInvoice({ ...invoice, dueDate: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-emerald-400 font-bold font-mono"
                  />
                </div>
              </div>

              {/* Impostos e Retenções na Fonte */}
              <div className="border border-zinc-800 bg-zinc-900/60 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-400" />
                  Retenções de Impostos Federais & Municipais (NFS-e)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">PIS (0.65%):</span>
                    <Input
                      value={invoice.pisRetention}
                      type="number"
                      onChange={e => setInvoice({ ...invoice, pisRetention: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">COFINS (3.00%):</span>
                    <Input
                      value={invoice.cofinsRetention}
                      type="number"
                      onChange={e => setInvoice({ ...invoice, cofinsRetention: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">CSLL (1.00%):</span>
                    <Input
                      value={invoice.csllRetention}
                      type="number"
                      onChange={e => setInvoice({ ...invoice, csllRetention: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">Valor Líquido A Receber:</span>
                    <div className="h-9 px-3 bg-emerald-950/40 border border-emerald-500/40 rounded-md flex items-center font-bold font-mono text-emerald-300 text-sm">
                      R$ {invoice.netReceivableValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload de Anexo PDF/XML da NF */}
              <div className="border-2 border-dashed border-zinc-800 bg-zinc-900/30 p-6 rounded-xl text-center space-y-2">
                <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-zinc-200">Anexo do PDF ou XML da Nota Fiscal Emitida</h4>
                <p className="text-xs text-zinc-400">Arraste e solte a nota fiscal emitida ou clique para selecionar</p>
                <Button variant="outline" size="sm" className="mt-2 border-zinc-700 bg-zinc-900 text-zinc-200">
                  <Upload className="w-3.5 h-3.5 mr-1" /> Selecionar Arquivo NF (PDF/XML)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientContractMeasurementManager;
