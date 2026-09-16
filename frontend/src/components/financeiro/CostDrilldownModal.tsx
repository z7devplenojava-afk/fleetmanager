import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CostSimulation, calculateSimulation, VEHICLE_CATEGORIES, STATUS_LABELS } from '@/services/costSimulationService';
import {
  Calculator,
  DollarSign,
  Fuel,
  Users,
  Route,
  ShieldCheck,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  Layers,
  Percent,
  CheckCircle2,
  Clock,
  MapPin,
  Bus,
} from 'lucide-react';
import { exportToExcel } from '@/utils/exportUtils';

interface CostDrilldownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulation: CostSimulation | null;
  onEdit?: (simulation: CostSimulation) => void;
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

export const CostDrilldownModal: React.FC<CostDrilldownModalProps> = ({
  open,
  onOpenChange,
  simulation,
  onEdit,
  onGenerateProposal,
}) => {
  if (!simulation) return null;

  const preview = calculateSimulation(simulation);
  const monthlyRevenue = simulation.monthlyPrice || preview.monthlyPrice || 0;
  const totalCost = simulation.totalMonthlyCost || preview.totalMonthlyCost || 0;
  const grossProfit = monthlyRevenue - totalCost;
  const marginPct = monthlyRevenue > 0 ? (grossProfit / monthlyRevenue) : (simulation.profitMarginPct || 0.12);

  // Decomposição dos Custos Fixos
  const driverBase = (simulation.baseSalary || 3450) * (simulation.driverCount || 1);
  const driverCharges = driverBase * (simulation.payrollChargesPct || 0.70);
  const driverBenefits = ((simulation.mealAllowance || 1200) + (simulation.healthPlanCost || 450)) * (simulation.driverCount || 1);
  const driverTotal = preview.fixedDriverCost || (driverBase + driverCharges + driverBenefits);

  const vehicleDeprec = simulation.depreciationMonthly || (simulation.fixedCosts ? simulation.fixedCosts * 0.55 : 3500);
  const vehicleInsurance = simulation.ipvaInsuranceMonthly || (simulation.fixedCosts ? simulation.fixedCosts * 0.25 : 1600);
  const adminCosts = simulation.adminExpensesMonthly || (simulation.fixedCosts ? simulation.fixedCosts * 0.20 : 1400);
  const totalFixed = preview.totalFixedCost || (driverTotal + vehicleDeprec + vehicleInsurance + adminCosts);

  // Decomposição dos Custos Variáveis
  const totalKm = preview.franchiseKm || simulation.franchiseKm || (simulation.dailyKm * (simulation.operatingDays || 26));
  const category = VEHICLE_CATEGORIES.find((c) => c.value === simulation.vehicleCategory) || VEHICLE_CATEGORIES[0];
  const fuelCostTotal = (category.coefficient * (simulation.dieselPrice || 5.95)) * totalKm;
  const maintCostTotal = ((simulation.maintenancePerKm || 0.52) + (simulation.lubricantsPerKm || 0.08) + (simulation.partsPerKm || 0.15)) * totalKm;
  const tiresCostTotal = (simulation.tiresPerKm || 0.38) * totalKm;
  const totalVariable = totalKm * (preview.variableCostPerKm || 2.45);

  // % de Participação
  const fixedShare = totalCost > 0 ? (totalFixed / totalCost) : 0.60;
  const variableShare = totalCost > 0 ? (totalVariable / totalCost) : 0.40;

  const taxesAmount = monthlyRevenue * (preview.taxesTotalPct || 0.1213);
  const netProfit = monthlyRevenue - totalCost - taxesAmount;

  const handleExportExcel = () => {
    const data = [
      {
        'Parâmetro / Centro de Custo': 'Nome da Rota',
        'Valor / Detalhe': simulation.name,
      },
      {
        'Parâmetro / Centro de Custo': 'Veículo / Categoria',
        'Valor / Detalhe': simulation.vehicleTypeLabel || category.label,
      },
      {
        'Parâmetro / Centro de Custo': 'Origem',
        'Valor / Detalhe': simulation.origin || 'N/A',
      },
      {
        'Parâmetro / Centro de Custo': 'Destino',
        'Valor / Detalhe': simulation.destination || 'N/A',
      },
      {
        'Parâmetro / Centro de Custo': 'Escala / Turno',
        'Valor / Detalhe': `${simulation.scale || 'SEG Á SAB'} - ${simulation.shift || '3 Turnos'}`,
      },
      {
        'Parâmetro / Centro de Custo': 'Quantidade de Motoristas',
        'Valor / Detalhe': simulation.driverCount,
      },
      {
        'Parâmetro / Centro de Custo': 'KM Diária / KM Mensal',
        'Valor / Detalhe': `${simulation.dailyKm} km / ${fmtKm(totalKm)}`,
      },
      {
        'Parâmetro / Centro de Custo': 'Total Custos Fixos (Mão de Obra + Veículo)',
        'Valor / Detalhe': fmtBRL(totalFixed),
      },
      {
        'Parâmetro / Centro de Custo': 'Total Custos Variáveis (Diesel + Manutenção + Pneus)',
        'Valor / Detalhe': fmtBRL(totalVariable),
      },
      {
        'Parâmetro / Centro de Custo': 'Custo Total Operacional Mensal',
        'Valor / Detalhe': fmtBRL(totalCost),
      },
      {
        'Parâmetro / Centro de Custo': 'Custo por KM Rodado',
        'Valor / Detalhe': fmtBRL(totalKm > 0 ? totalCost / totalKm : 0),
      },
      {
        'Parâmetro / Centro de Custo': 'Tributos (ISS, PIS, COFINS, IRPJ/CSLL)',
        'Valor / Detalhe': fmtBRL(taxesAmount),
      },
      {
        'Parâmetro / Centro de Custo': 'Lucro Líquido Projetado',
        'Valor / Detalhe': fmtBRL(netProfit),
      },
      {
        'Parâmetro / Centro de Custo': 'VALOR FINAL MENSAL (R$)',
        'Valor / Detalhe': fmtBRL(monthlyRevenue),
      },
      {
        'Parâmetro / Centro de Custo': 'VALOR DA DIÁRIA (R$)',
        'Valor / Detalhe': fmtBRL(simulation.dailyRate || preview.dailyRate),
      },
    ];

    exportToExcel(data, `Quadro_Resumo_Custos_${simulation.name.replace(/[^a-zA-Z0-9]/g, '_')}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 bg-card border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500">
                <Bus className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <span>{simulation.name}</span>
                  {simulation.status && (
                    <Badge variant="outline" className="text-xs bg-muted/40 font-medium">
                      {STATUS_LABELS[simulation.status]}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <MapPin className="h-3 w-3 text-red-500" />
                    {simulation.origin || 'Origem'} ➔ {simulation.destination || 'Destino'}
                  </span>
                  <span>•</span>
                  <span>Escala: {simulation.scale || 'SEG Á SAB'}</span>
                  <span>•</span>
                  <span>Turno: {simulation.shift || `${simulation.driverCount} turno(s)`}</span>
                </DialogDescription>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                Preço Final Mensal
              </span>
              <span className="text-2xl font-black text-emerald-500">
                {fmtBRL(monthlyRevenue)}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Top KPI Cards do Quadro Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-muted/30 border border-border/60 p-3 rounded-xl">
              <p className="text-[11px] font-medium text-muted-foreground uppercase">Valor da Diária</p>
              <p className="text-lg font-bold text-foreground mt-0.5">
                {fmtBRL(simulation.dailyRate || preview.dailyRate)}
              </p>
              <p className="text-[10px] text-muted-foreground">{simulation.operatingDays || 26} dias operacionais</p>
            </Card>

            <Card className="bg-muted/30 border border-border/60 p-3 rounded-xl">
              <p className="text-[11px] font-medium text-muted-foreground uppercase">Franquia Mensal</p>
              <p className="text-lg font-bold text-foreground mt-0.5">
                {fmtKm(totalKm)}
              </p>
              <p className="text-[10px] text-muted-foreground">{simulation.dailyKm} km/dia</p>
            </Card>

            <Card className="bg-muted/30 border border-border/60 p-3 rounded-xl">
              <p className="text-[11px] font-medium text-muted-foreground uppercase">Custo / KM</p>
              <p className="text-lg font-bold text-foreground mt-0.5">
                {fmtBRL(totalKm > 0 ? totalCost / totalKm : 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Custo operacional total</p>
            </Card>

            <Card className="bg-muted/30 border border-border/60 p-3 rounded-xl">
              <p className="text-[11px] font-medium text-muted-foreground uppercase">Tarifa KM Excedente</p>
              <p className="text-lg font-bold text-amber-500 mt-0.5">
                {fmtBRL(simulation.excessKmRate || preview.excessKmRate)}/km
              </p>
              <p className="text-[10px] text-muted-foreground">+ Viagem Extra: 15%</p>
            </Card>
          </div>

          {/* Gráfico / Barra de Distribuição de Custos */}
          <div className="bg-card border border-border/60 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-400">
                <Users className="h-3.5 w-3.5" /> Custos Fixos: {fmtBRL(totalFixed)} ({fmtPct(fixedShare)})
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <Fuel className="h-3.5 w-3.5" /> Custos Variáveis: {fmtBRL(totalVariable)} ({fmtPct(variableShare)})
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, fixedShare * 100)}%` }}
                title={`Custos Fixos: ${fmtPct(fixedShare)}`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, variableShare * 100)}%` }}
                title={`Custos Variáveis: ${fmtPct(variableShare)}`}
              />
            </div>
          </div>

          {/* Tabelas de Decomposição: Custos Fixos & Custos Variáveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco Custos Fixos */}
            <div className="border border-border/60 rounded-xl overflow-hidden bg-card/60">
              <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-2.5 flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> 1. Custos Fixos (Mês)
                </h4>
                <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                  {fmtBRL(totalFixed)}
                </Badge>
              </div>
              <div className="p-3 space-y-2 text-xs divide-y divide-border/40">
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground">Mão de Obra ({simulation.driverCount} motorista(s)):</span>
                  <span className="font-semibold text-foreground">{fmtBRL(driverBase)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground">Encargos Sociais ({fmtPct(simulation.payrollChargesPct || 0.70)}):</span>
                  <span className="font-semibold text-foreground">{fmtBRL(driverCharges)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground">Benefícios (Ticket + Saúde/Odonto):</span>
                  <span className="font-semibold text-foreground">{fmtBRL(driverBenefits)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground">Depreciação Mensal do Veículo:</span>
                  <span className="font-semibold text-foreground">{fmtBRL(vehicleDeprec)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground">Seguros, IPVA & Rastreamento:</span>
                  <span className="font-semibold text-foreground">{fmtBRL(vehicleInsurance)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground">Despesas Administrativas (Rateio):</span>
                  <span className="font-semibold text-foreground">{fmtBRL(adminCosts)}</span>
                </div>
              </div>
            </div>

            {/* Bloco Custos Variáveis */}
            <div className="border border-border/60 rounded-xl overflow-hidden bg-card/60">
              <div className="bg-amber-600/10 border-b border-amber-500/20 px-4 py-2.5 flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Fuel className="h-4 w-4" /> 2. Custos Variáveis ({fmtKm(totalKm)})
                </h4>
                <Badge className="bg-amber-600 text-white text-[10px] font-bold">
                  {fmtBRL(totalVariable)}
                </Badge>
              </div>
              <div className="p-3 space-y-2 text-xs divide-y divide-border/40">
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground">Óleo Diesel ({fmtBRL(simulation.dieselPrice || 5.95)}/L):</span>
                  <span className="font-semibold text-foreground">{fmtBRL(fuelCostTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground">Manutenção Preventiva / Peças:</span>
                  <span className="font-semibold text-foreground">{fmtBRL(maintCostTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground">Desgaste e Troca de Pneus:</span>
                  <span className="font-semibold text-foreground">{fmtBRL(tiresCostTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground">Custo Variável Unitário:</span>
                  <span className="font-bold text-amber-400">{fmtBRL(preview.variableCostPerKm)} / km</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground">Fator KM Improdutiva (Garagem):</span>
                  <span className="font-semibold text-foreground">{(simulation.productivityFactor || 1.0).toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quadro Resumo Financeiro & DRE da Rota */}
          <div className="border-2 border-emerald-500/30 rounded-xl overflow-hidden bg-gradient-to-br from-card via-card to-emerald-950/20">
            <div className="bg-emerald-600/15 border-b border-emerald-500/20 px-4 py-3 flex justify-between items-center">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> 3. Quadro Resumo & Formação do Preço de Venda
              </h4>
              <Badge className="bg-emerald-600 text-white font-bold">
                Margem Alvo: {fmtPct(marginPct)}
              </Badge>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                <span className="text-muted-foreground block mb-1">Custo Total da Operação</span>
                <span className="text-base font-bold text-foreground">{fmtBRL(totalCost)}</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">Custos Fixos + Variáveis</span>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                <span className="text-muted-foreground block mb-1">Tributos por Dentro ({fmtPct(preview.taxesTotalPct)})</span>
                <span className="text-base font-bold text-amber-400">{fmtBRL(taxesAmount)}</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">PIS, COFINS, ISS/ICMS</span>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                <span className="text-muted-foreground block mb-1">Lucro Líquido Projetado</span>
                <span className="text-base font-bold text-emerald-400">{fmtBRL(netProfit)}</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">Retorno sobre faturamento</span>
              </div>

              <div className="p-3 bg-emerald-600/15 border border-emerald-500/40 rounded-lg">
                <span className="text-emerald-400 font-semibold block mb-1">VALOR FINAL DA PROPOSTA</span>
                <span className="text-lg font-black text-emerald-400">{fmtBRL(monthlyRevenue)}</span>
                <span className="text-[10px] text-emerald-300/80 block mt-0.5">Mensalidade fechada</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            className="w-full sm:w-auto text-xs gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            Exportar Quadro em Excel
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Fechar
            </Button>
            {onEdit && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(simulation);
                }}
                className="text-xs"
              >
                Editar Parâmetros
              </Button>
            )}
            {onGenerateProposal && (
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onGenerateProposal(simulation);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1.5 shadow-md shadow-red-600/20"
              >
                <FileText className="h-4 w-4" />
                Gerar Proposta Comercial
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CostDrilldownModal;
