import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Calendar,
  Filter,
  Columns,
  Download,
  Loader2,
  FileSpreadsheet,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface RelatorioPersonalizadoContasPagarModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresasDisponiveis?: string[];
  fornecedoresDisponiveis?: string[];
}

export interface ColunaRelatorioConfig {
  id: string;
  label: string;
  defaultSelected: boolean;
  minimalSelected: boolean;
}

export const COLUNAS_RELATORIO: ColunaRelatorioConfig[] = [
  { id: 'due_date', label: 'Data de Vencimento', defaultSelected: true, minimalSelected: true },
  { id: 'issue_date', label: 'Data de Emissão', defaultSelected: false, minimalSelected: false },
  { id: 'payment_date', label: 'Data de Pagamento', defaultSelected: false, minimalSelected: false },
  { id: 'description', label: 'Descrição da Despesa', defaultSelected: true, minimalSelected: true },
  { id: 'supplier', label: 'Fornecedor / Beneficiário', defaultSelected: true, minimalSelected: true },
  { id: 'company', label: 'Empresa (Sigla)', defaultSelected: false, minimalSelected: false },
  { id: 'unit', label: 'Unidade', defaultSelected: true, minimalSelected: false },
  { id: 'work_sector', label: 'Setor de Trabalho', defaultSelected: true, minimalSelected: false },
  { id: 'category', label: 'Conta / Categoria', defaultSelected: true, minimalSelected: false },
  { id: 'cost_center', label: 'Centro de Custo', defaultSelected: false, minimalSelected: false },
  { id: 'type', label: 'Tipo (Fixa/Variável)', defaultSelected: false, minimalSelected: false },
  { id: 'amount', label: 'Valor (R$)', defaultSelected: true, minimalSelected: true },
  { id: 'status', label: 'Status', defaultSelected: true, minimalSelected: true },
  { id: 'barcode', label: 'Código de Barras', defaultSelected: false, minimalSelected: false },
  { id: 'notes', label: 'Observações / Anotações', defaultSelected: false, minimalSelected: false }
];

export const RelatorioPersonalizadoContasPagarModal: React.FC<RelatorioPersonalizadoContasPagarModalProps> = ({
  isOpen,
  onClose,
  empresasDisponiveis = [],
  fornecedoresDisponiveis = []
}) => {
  const { toast } = useToast();

  // 1. Período & Vencimentos Próximos
  const [dateBase, setDateBase] = useState<'VENCIMENTO' | 'EMISSAO' | 'PAGAMENTO'>('VENCIMENTO');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [dueSoonRange, setDueSoonRange] = useState<string>('ALL');

  // 2. Filtros Corporativos e Status
  const [selectedCompany, setSelectedCompany] = useState<string>('TODAS');
  const [selectedUnit, setSelectedUnit] = useState<string>('TODAS');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('TODOS');

  // Agrupamento
  const [groupBy, setGroupBy] = useState<string>('NONE');

  // 3. Colunas
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    COLUNAS_RELATORIO.filter(c => c.defaultSelected).map(c => c.id)
  );

  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const handleSelectDueSoonQuick = (days: string) => {
    setDueSoonRange(days);
    const now = new Date();
    const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const limit = new Date();
    limit.setDate(limit.getDate() + parseInt(days, 10));
    const endStr = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, '0')}-${String(limit.getDate()).padStart(2, '0')}`;
    setStartDate(startStr);
    setEndDate(endStr);
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(COLUNAS_RELATORIO.map(c => c.id));
  };

  const handleSelectMinimalColumns = () => {
    setSelectedColumns(COLUNAS_RELATORIO.filter(c => c.minimalSelected).map(c => c.id));
  };

  const handleResetDefaultColumns = () => {
    setSelectedColumns(COLUNAS_RELATORIO.filter(c => c.defaultSelected).map(c => c.id));
  };

  const toggleColumn = (colId: string) => {
    setSelectedColumns(prev =>
      prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
    );
  };

  const handleDownload = async (formatType: 'PDF' | 'EXCEL') => {
    if (selectedColumns.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione ao menos 1 coluna para compor o relatório.',
        variant: 'destructive'
      });
      return;
    }

    if (formatType === 'PDF') setLoadingPdf(true);
    else setLoadingExcel(true);

    try {
      const payload = {
        dateBase,
        startDate: startDate || null,
        endDate: endDate || null,
        dueSoonRange,
        companySigla: selectedCompany,
        operationalUnit: selectedUnit,
        workSector: selectedSector,
        status: selectedStatus,
        expenseType: selectedType,
        supplierName: selectedSupplier,
        groupBy,
        columns: selectedColumns,
        format: formatType
      };

      const url = formatType === 'PDF' ? '/reports/contas-a-pagar/custom/pdf' : '/reports/contas-a-pagar/custom/excel';
      const response = await api.post(url, payload, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: formatType === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const ext = formatType === 'PDF' ? 'pdf' : 'xlsx';
      link.download = `relatorio_personalizado_contas_pagar_${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: '✅ Sucesso!',
        description: `Relatório ${formatType} gerado e baixado com sucesso.`
      });
      onClose();
    } catch (err: any) {
      console.error('Erro ao gerar relatório personalizado no backend:', err);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Não foi possível gerar o arquivo. Tente novamente em instantes.',
        variant: 'destructive'
      });
    } finally {
      setLoadingPdf(false);
      setLoadingExcel(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-900 text-white border-slate-700 max-h-[92vh] overflow-y-auto p-6 z-[10400]">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-amber-400">
            <FileText className="h-6 w-6 text-amber-400" />
            Relatório Personalizado de Contas a Pagar
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-1">
            Configure filtros avançados, selecione o período ou vencimentos iminentes e defina as colunas do PDF/Excel oficial.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-3">
          {/* 1. Período & Vencimentos Próximos */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4" /> 1. Período & Vencimentos Próximos
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Vencendo em:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectDueSoonQuick('7')}
                  className={`h-7 px-2.5 text-xs font-semibold rounded-lg ${dueSoonRange === '7' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                >
                  <Zap className="h-3 w-3 mr-1 text-amber-400" /> Próx. 7 dias
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectDueSoonQuick('15')}
                  className={`h-7 px-2.5 text-xs font-semibold rounded-lg ${dueSoonRange === '15' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                >
                  15 dias
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectDueSoonQuick('30')}
                  className={`h-7 px-2.5 text-xs font-semibold rounded-lg ${dueSoonRange === '30' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                >
                  30 dias
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Base da Data</label>
                <select
                  value={dateBase}
                  onChange={(e) => setDateBase(e.target.value as any)}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs px-3 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="VENCIMENTO">Data de Vencimento</option>
                  <option value="EMISSAO">Data de Emissão</option>
                  <option value="PAGAMENTO">Data de Pagamento</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Data Inicial</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setDueSoonRange('ALL'); }}
                  className="h-9 bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Data Final</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setDueSoonRange('ALL'); }}
                  className="h-9 bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Vencendo em Breve</label>
                <select
                  value={dueSoonRange}
                  onChange={(e) => {
                    if (e.target.value === 'ALL') {
                      setDueSoonRange('ALL');
                    } else {
                      handleSelectDueSoonQuick(e.target.value);
                    }
                  }}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs px-3 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">Qualquer período</option>
                  <option value="7">Próximos 7 dias</option>
                  <option value="15">Próximos 15 dias</option>
                  <option value="30">Próximos 30 dias</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Filtros Corporativos e Status */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Filter className="h-4 w-4" /> 2. Filtros Corporativos e Status
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Empresa (SIGLA)</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs px-3 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="TODAS">Todas as Empresas</option>
                  {empresasDisponiveis.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Unidade Operacional</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs px-3 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="TODAS">Todas as Unidades</option>
                  <option value="MATRIZ">Matriz / Garagem Principal</option>
                  <option value="FILIAL_1">Filial 1</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Setor de Trabalho (Obra)</label>
                <Input
                  placeholder="Ex: Operacional, Oficina..."
                  value={selectedSector === 'TODOS' ? '' : selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value || 'TODOS')}
                  className="h-9 bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs px-3 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="PENDENTE">Aberta / Pendente</option>
                  <option value="VENCIDA">Vencidas</option>
                  <option value="PAGA">Paga / Quitado</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Tipo de Despesa</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs px-3 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="TODOS">Todos os Tipos</option>
                  <option value="FIXA">Fixa</option>
                  <option value="VARIAVEL">Variável</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Fornecedor</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs px-3 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="TODOS">Todos os Fornecedores</option>
                  {fornecedoresDisponiveis.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Agrupamento e Subtotais */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Agrupamento e Subtotais Automáticos</span>
                <span className="text-[11px] text-slate-400">Organiza a quebra de tabela no PDF calculando totais parciais para cada grupo.</span>
              </div>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="h-9 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs px-3 sm:w-72 focus:ring-1 focus:ring-amber-500"
              >
                <option value="NONE">📄 Listagem Simples (Cronológica por Vencimento)</option>
                <option value="UNIT_SECTOR">🏢 Agrupar por Unidade e Setor</option>
                <option value="SECTOR">🏷️ Agrupar por Setor de Trabalho</option>
                <option value="UNIT">🏢 Agrupar por Unidade</option>
                <option value="COMPANY">🏢 Agrupar por Empresa</option>
                <option value="MONTH_YEAR">📅 Agrupar por Período (Mês/Ano)</option>
                <option value="STATUS">📊 Agrupar por Status (Pendente/Paga)</option>
              </select>
            </div>
          </div>

          {/* 3. Colunas do Relatório */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Columns className="h-4 w-4" /> 3. Colunas do Relatório ({selectedColumns.length} de {COLUNAS_RELATORIO.length} selecionadas)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllColumns}
                  className="h-7 px-2 text-[11px] bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Todas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectMinimalColumns}
                  className="h-7 px-2 text-[11px] bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Mínimas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetDefaultColumns}
                  className="h-7 px-2 text-[11px] bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Padrão
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
              {COLUNAS_RELATORIO.map(col => {
                const isSelected = selectedColumns.includes(col.id);
                return (
                  <div
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleColumn(col.id)}
                      className="border-slate-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-black"
                    />
                    <span className="text-xs font-medium truncate">{col.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            Pronto para gerar em formato paisagem A4 com layout corporativo oficial.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDownload('EXCEL')}
              disabled={loadingExcel || loadingPdf}
              className="bg-emerald-950/40 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/50 text-xs h-9 font-semibold gap-1.5"
            >
              {loadingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-400" />}
              Gerar Excel (.xlsx)
            </Button>
            <Button
              type="button"
              onClick={() => handleDownload('PDF')}
              disabled={loadingPdf || loadingExcel}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-4 gap-1.5 shadow-lg shadow-amber-500/20"
            >
              {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Gerar Relatório (PDF)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelatorioPersonalizadoContasPagarModal;
