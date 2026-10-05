import React, { useEffect, useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  FileText,
  FileSpreadsheet,
  Download,
  X,
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Settings2,
  ListChecks,
  RefreshCcw,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { exportToPDF, exportToXLSX } from '@/utils/exportUtils';
import {
  AsoSituation,
  ALL_REPORT_COLUMNS,
  buildEmployeeReportRows,
  countActiveReportFilters,
  DEFAULT_REPORT_COLUMNS,
  emptyEmployeeReportFilters,
  emptyEmployeeReportOrganization,
  EMPLOYEE_REPORT_COLUMNS,
  EmployeeReportFilters,
  EmployeeReportOrganization,
  filterEmployeesForReport,
  getEmployeeCompany,
  getEmployeePosition,
  getEmployeeSector,
  ReportColumnKey,
} from '@/utils/employeeReportFilters';

interface EmployeeReportFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'VACATION', label: 'Férias' },
  { value: 'MATERNITY_LEAVE', label: 'Licença Maternidade' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Atestado' },
  { value: 'TERMINATED', label: 'Demitido' },
  { value: 'SUSPENDED', label: 'Suspenso' },
];

const ASO_OPTIONS: { value: AsoSituation; label: string }[] = [
  { value: 'VALIDO', label: 'Válido' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'PENDENTE', label: 'Pendente' },
];

type SectionKey = 'filtros' | 'organizacao' | 'colunas';

function SectionHeader({
  open,
  title,
  icon: Icon,
  onToggle,
  right,
}: {
  open: boolean;
  title: string;
  icon: React.ElementType;
  onToggle: () => void;
  right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 py-3 border-b border-gray-700/60 text-left hover:bg-white/[0.03] transition-colors rounded-sm px-1 -mx-1"
    >
      <span className="flex items-center gap-3 min-w-0">
        <Icon className="h-5 w-5 text-seguranca-yellow flex-shrink-0" />
        <span className="text-base sm:text-lg font-semibold text-seguranca-lightgray truncate">
          {title}
        </span>
      </span>
      <span className="flex items-center gap-3 flex-shrink-0">
        {right}
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </span>
    </button>
  );
}

const EmployeeReportFiltersModal: React.FC<EmployeeReportFiltersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<EmployeeReportFilters>(emptyEmployeeReportFilters());
  const [organization, setOrganization] = useState<EmployeeReportOrganization>(
    emptyEmployeeReportOrganization()
  );
  const [selectedColumns, setSelectedColumns] = useState<ReportColumnKey[]>([
    ...DEFAULT_REPORT_COLUMNS,
  ]);
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    filtros: true,
    organizacao: false,
    colunas: false,
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    employeeService
      .getAllEmployees()
      .then(setEmployees)
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = useMemo(
    () => filterEmployeesForReport(employees, filters),
    [employees, filters]
  );

  const unique = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map(v => ({ label: v, value: v }));

  const companyOptions = useMemo(
    () => unique(employees.map(e => getEmployeeCompany(e))),
    [employees]
  );
  const sectorOptions = useMemo(
    () => unique(employees.map(e => getEmployeeSector(e))),
    [employees]
  );
  const positionOptions = useMemo(
    () => unique(employees.map(e => getEmployeePosition(e))),
    [employees]
  );
  const genderOptions = useMemo(
    () => unique(employees.map(e => (e.gender || e.sexo || '').trim())),
    [employees]
  );
  const motivoOptions = useMemo(
    () => unique(employees.map(e => (e.afastamentoMotivo || '').trim())),
    [employees]
  );

  const setField = <K extends keyof EmployeeReportFilters>(
    key: K,
    value: EmployeeReportFilters[K]
  ) => setFilters(prev => ({ ...prev, [key]: value }));

  const toggleSection = (key: SectionKey) =>
    setSections(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleColumn = (key: ReportColumnKey) => {
    setSelectedColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : prev
    );
  };

  const clearFilters = () => {
    setFilters(emptyEmployeeReportFilters());
    toast({ title: 'Filtros limpos', description: 'Todos os filtros foram redefinidos.' });
  };

  const clearAll = () => {
    setFilters(emptyEmployeeReportFilters());
    setOrganization(emptyEmployeeReportOrganization());
    setSelectedColumns([...DEFAULT_REPORT_COLUMNS]);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!filtered.length) {
      toast({
        title: 'Nenhum resultado',
        description: 'Ajuste os filtros para obter resultados antes de exportar.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedColumns.length) {
      toast({
        title: 'Nenhuma coluna',
        description: 'Selecione ao menos uma coluna no relatório.',
        variant: 'destructive',
      });
      return;
    }
    setExporting(true);
    try {
      const rows = buildEmployeeReportRows(filtered, selectedColumns, organization);
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `relatorio-funcionarios-${stamp}`;
      if (format === 'pdf') {
        await exportToPDF(rows, filename, 'Relatório de Funcionários');
      } else {
        await exportToXLSX(rows, filename, 'Relatório de Funcionários');
      }
      toast({
        title: 'Relatório gerado',
        description: `${rows.length} registro(s) · ${selectedColumns.length} coluna(s) · ${format.toUpperCase()}.`,
      });
    } catch (err) {
      console.error('Erro ao exportar relatório de funcionários:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const activeCount = countActiveReportFilters(filters);
  const allSelected = selectedColumns.length === ALL_REPORT_COLUMNS.length;
  const defaultSelected =
    selectedColumns.length === DEFAULT_REPORT_COLUMNS.length &&
    DEFAULT_REPORT_COLUMNS.every(k => selectedColumns.includes(k));

  const dateInput =
    'w-full h-11 rounded-md bg-black/50 border border-gray-600 text-white px-3 text-sm focus:border-seguranca-yellow outline-none [color-scheme:dark]';

  const fieldLabel = 'flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400 font-medium';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-yellow-500/30 p-0 gap-0">
        <DialogHeader className="bg-[#0d0d0d] border-b border-yellow-500/40 px-6 pt-6 pb-5 text-left">
          <DialogTitle className="text-white flex flex-wrap items-center gap-3 text-xl sm:text-2xl font-bold">
            <span className="p-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30">
              <FileText className="h-6 w-6 text-seguranca-yellow" />
            </span>
            Relatórios de Funcionários
            <Badge className="bg-yellow-500 text-black border-none px-3 py-1 font-bold text-sm">
              {filtered.length} RESULTADOS
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-300 flex items-center gap-2 mt-2 text-sm">
            <Users className="h-4 w-4 text-seguranca-yellow" />
            Gere e exporte dados dos colaboradores com filtros avançados
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4">
          <div className="rounded-lg border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 flex gap-3 text-sm text-gray-200">
            <AlertCircle className="h-5 w-5 text-seguranca-yellow flex-shrink-0 mt-0.5" />
            <p>
              <span className="bg-black/50 border border-yellow-500/40 text-seguranca-yellow text-xs font-bold px-2 py-0.5 rounded mr-2">
                DICA
              </span>
              Empresa, setor e cargo permitem{' '}
              <em className="text-seguranca-yellow font-semibold not-italic">
                múltipla seleção
              </em>{' '}
              com busca rápida. Os resultados aplicam{' '}
              <u className="decoration-seguranca-yellow">todos</u> os filtros selecionados
              simultaneamente.
              {activeCount > 0 && (
                <>
                  {' '}
                  <strong className="text-seguranca-yellow">{activeCount}</strong> filtro(s)
                  ativo(s).
                </>
              )}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-1">
          <SectionHeader
            open={sections.filtros}
            title="Filtros de Pesquisa"
            icon={Filter}
            onToggle={() => toggleSection('filtros')}
            right={
              <span
                role="button"
                tabIndex={0}
                onClick={e => {
                  e.stopPropagation();
                  clearFilters();
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    clearFilters();
                  }
                }}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-seguranca-yellow hover:text-yellow-300 uppercase"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                LIMPAR FILTROS
              </span>
            }
          />

          {sections.filtros && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 pb-3">
              <div className="space-y-2">
                <span className={fieldLabel}>
                  <Users className="h-3.5 w-3.5" /> Status
                </span>
                <MultiSelect
                  options={STATUS_OPTIONS}
                  value={filters.status}
                  onChange={v => setField('status', v)}
                  placeholder="Todos os Status"
                  searchPlaceholder="Buscar status..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <span className={fieldLabel}>
                  <AlertCircle className="h-3.5 w-3.5" /> Situação ASO
                </span>
                <MultiSelect
                  options={ASO_OPTIONS}
                  value={filters.aso}
                  onChange={v => setField('aso', v as AsoSituation[])}
                  placeholder="Todas as Situações"
                  searchPlaceholder="Buscar ASO..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <span className={fieldLabel}>
                  <AlertCircle className="h-3.5 w-3.5" /> Laudo Psicológico
                </span>
                <MultiSelect
                  options={ASO_OPTIONS}
                  value={filters.laudo}
                  onChange={v => setField('laudo', v as AsoSituation[])}
                  placeholder="Todas as Situações"
                  searchPlaceholder="Buscar laudo..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <span className={fieldLabel}>Férias</span>
                <Select value={filters.ferias} onValueChange={v => setField('ferias', v)}>
                  <SelectTrigger className="h-11 bg-black/50 border-gray-600 text-white">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    <SelectItem value="all" className="text-white">Todas</SelectItem>
                    <SelectItem value="on" className="text-white">Em férias</SelectItem>
                    <SelectItem value="off" className="text-white">Fora de férias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className={fieldLabel}>Empresa</span>
                <MultiSelect
                  options={companyOptions}
                  value={filters.empresas}
                  onChange={v => setField('empresas', v)}
                  placeholder="Todas as Empresas"
                  searchPlaceholder="Buscar empresa..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <span className={fieldLabel}>Setor de Trabalho</span>
                <MultiSelect
                  options={sectorOptions}
                  value={filters.setores}
                  onChange={v => setField('setores', v)}
                  placeholder="Todos os Setores"
                  searchPlaceholder="Buscar setor..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <span className={fieldLabel}>Cargo</span>
                <MultiSelect
                  options={positionOptions}
                  value={filters.cargos}
                  onChange={v => setField('cargos', v)}
                  placeholder="Todos os Cargos"
                  searchPlaceholder="Buscar cargo..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <span className={fieldLabel}>Gênero</span>
                <Select value={filters.genero} onValueChange={v => setField('genero', v)}>
                  <SelectTrigger className="h-11 bg-black/50 border-gray-600 text-white">
                    <SelectValue placeholder="Todos os Gêneros" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    <SelectItem value="all" className="text-white">Todos os Gêneros</SelectItem>
                    {genderOptions.map(g => (
                      <SelectItem key={g.value} value={g.value} className="text-white">
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <span className={fieldLabel}>Intervalo de Admissão (início / fim)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.hireStart}
                    onChange={e => setField('hireStart', e.target.value)}
                    className={dateInput}
                    placeholder="Data Inicial"
                  />
                  <input
                    type="date"
                    value={filters.hireEnd}
                    onChange={e => setField('hireEnd', e.target.value)}
                    className={dateInput}
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <span className={fieldLabel}>Intervalo de Rescisão (início / fim)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.termStart}
                    onChange={e => setField('termStart', e.target.value)}
                    className={dateInput}
                  />
                  <input
                    type="date"
                    value={filters.termEnd}
                    onChange={e => setField('termEnd', e.target.value)}
                    className={dateInput}
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <span className={fieldLabel}>Motivo da Demissão</span>
                <Select
                  value={filters.motivoDemissao}
                  onValueChange={v => setField('motivoDemissao', v)}
                >
                  <SelectTrigger className="h-11 bg-black/50 border-gray-600 text-white sm:max-w-sm">
                    <SelectValue placeholder="Todos os Motivos" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    <SelectItem value="all" className="text-white">Todos os Motivos</SelectItem>
                    {motivoOptions.map(m => (
                      <SelectItem key={m.value} value={m.value} className="text-white">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:hidden col-span-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full border-yellow-500/40 text-seguranca-yellow"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  LIMPAR FILTROS
                </Button>
              </div>
            </div>
          )}

          <SectionHeader
            open={sections.organizacao}
            title="Organização do Relatório"
            icon={Briefcase}
            onToggle={() => toggleSection('organizacao')}
          />
          {sections.organizacao && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 pb-3">
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase">Ordenar por</Label>
                <Select
                  value={organization.sortBy}
                  onValueChange={v =>
                    setOrganization(prev => ({
                      ...prev,
                      sortBy: v as EmployeeReportOrganization['sortBy'],
                    }))
                  }
                >
                  <SelectTrigger className="h-11 bg-black/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    <SelectItem value="nome" className="text-white">Nome</SelectItem>
                    <SelectItem value="admissao" className="text-white">Admissão</SelectItem>
                    <SelectItem value="rescisao" className="text-white">Rescisão</SelectItem>
                    <SelectItem value="cargo" className="text-white">Cargo</SelectItem>
                    <SelectItem value="status" className="text-white">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase">Direção</Label>
                <Select
                  value={organization.sortDir}
                  onValueChange={v =>
                    setOrganization(prev => ({
                      ...prev,
                      sortDir: v as EmployeeReportOrganization['sortDir'],
                    }))
                  }
                >
                  <SelectTrigger className="h-11 bg-black/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    <SelectItem value="asc" className="text-white">Crescente (A–Z)</SelectItem>
                    <SelectItem value="desc" className="text-white">Decrescente (Z–A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase">Agrupar por</Label>
                <Select
                  value={organization.groupBy}
                  onValueChange={v =>
                    setOrganization(prev => ({
                      ...prev,
                      groupBy: v as EmployeeReportOrganization['groupBy'],
                    }))
                  }
                >
                  <SelectTrigger className="h-11 bg-black/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    <SelectItem value="nenhum" className="text-white">Nenhum</SelectItem>
                    <SelectItem value="setor" className="text-white">Setor</SelectItem>
                    <SelectItem value="empresa" className="text-white">Empresa</SelectItem>
                    <SelectItem value="cargo" className="text-white">Cargo</SelectItem>
                    <SelectItem value="status" className="text-white">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <SectionHeader
            open={sections.colunas}
            title="Colunas do Relatório PDF"
            icon={ListChecks}
            onToggle={() => toggleSection('colunas')}
            right={
              <span className="flex items-center gap-3">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColumns([...DEFAULT_REPORT_COLUMNS]);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedColumns([...DEFAULT_REPORT_COLUMNS]);
                    }
                  }}
                  className={`text-xs font-semibold uppercase ${
                    defaultSelected ? 'text-seguranca-yellow' : 'text-gray-400 hover:text-seguranca-yellow'
                  }`}
                >
                  Padrão
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedColumns([...ALL_REPORT_COLUMNS]);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedColumns([...ALL_REPORT_COLUMNS]);
                    }
                  }}
                  className={`text-xs font-semibold uppercase ${
                    allSelected ? 'text-seguranca-yellow' : 'text-gray-400 hover:text-seguranca-yellow'
                  }`}
                >
                  Todas
                </span>
              </span>
            }
          />
          {sections.colunas && (
            <div className="pt-4 pb-3 space-y-4">
              <p className="text-sm text-gray-400">
                Marque as colunas que deseja incluir no PDF. O relatório será gerado apenas com
                os campos selecionados.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {EMPLOYEE_REPORT_COLUMNS.map(col => {
                  const checked = selectedColumns.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleColumn(col.key)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        checked
                          ? 'border-yellow-500/50 bg-yellow-500/10 text-white'
                          : 'border-gray-700 bg-black/30 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                          checked
                            ? 'bg-seguranca-yellow border-seguranca-yellow'
                            : 'border-gray-500'
                        }`}
                      >
                        {checked && (
                          <svg viewBox="0 0 14 14" className="h-3 w-3 text-black" fill="none">
                            <path
                              d="M3 7l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{col.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColumns([...ALL_REPORT_COLUMNS])}
                  className="border-yellow-500/40 text-seguranca-yellow text-xs"
                >
                  Selecionar todas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColumns([])}
                  className="border-gray-600 text-gray-300 text-xs"
                >
                  Limpar seleção
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColumns([...DEFAULT_REPORT_COLUMNS])}
                  className="border-gray-600 text-gray-300 text-xs"
                >
                  Restaurar padrão
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-4 border-t border-gray-700/50 pt-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            Resumo da Seleção Atual
          </p>
          <div className="rounded-lg border border-gray-700 bg-black/40 px-5 py-4">
            <p className="text-sm text-gray-300 italic">
              O relatório incluirá{' '}
              <strong className="text-seguranca-yellow not-italic">{filtered.length}</strong>{' '}
              registro(s) com{' '}
              <strong className="text-seguranca-yellow not-italic">{selectedColumns.length}</strong>{' '}
              coluna(s)
              {loading ? ' · carregando dados…' : '.'}
              {activeCount > 0 && (
                <span className="not-italic text-gray-500">
                  {' '}
                  ({activeCount} filtro(s) ativo(s))
                </span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-700/60 bg-[#0d0d0d] px-6 py-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between sm:items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white sm:justify-start"
          >
            Fechar Janela
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearAll}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar tudo
            </Button>
            <Button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting || !filtered.length || !selectedColumns.length}
              className="bg-transparent border-2 border-red-500 text-red-400 hover:bg-red-500/10 font-semibold"
            >
              <Download className="h-4 w-4 mr-2" />
              GERAR PDF
            </Button>
            <Button
              type="button"
              onClick={() => handleExport('excel')}
              disabled={exporting || !filtered.length || !selectedColumns.length}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              EXPORTAR Excel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeReportFiltersModal;
