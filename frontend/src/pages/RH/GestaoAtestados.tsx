import React, { useState, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Calendar,
  Building2,
  RefreshCw,
  Loader2,
  Stethoscope,
  BarChart3,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Flame,
  User,
  Edit2,
  Trash2,
  FileHeart,
  FileText,
  ExternalLink,
  Printer,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import medicalCertificateService, {
  MedicalCertificate,
  MedicalCertificateType,
  MEDICAL_CERTIFICATE_TYPE_LABELS,
} from '@/services/medicalCertificateService';
import MedicalCertificateModal from '@/components/rh/MedicalCertificateModal';

export const GestaoAtestados: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados de modal e edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<MedicalCertificate | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<MedicalCertificate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado do banner expansível de INSS
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Ordenação
  const [sortField, setSortField] = useState<'employee' | 'type' | 'period' | 'created' | 'days' | 'cid'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Buscar lista de atestados
  const {
    data: certificates = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<MedicalCertificate[]>({
    queryKey: ['medical-certificates-list'],
    queryFn: () => medicalCertificateService.getAll(),
  });

  // Buscar estatísticas do backend
  const { data: stats } = useQuery({
    queryKey: ['medical-certificates-stats'],
    queryFn: () => medicalCertificateService.getStats(),
  });

  // Mapeamento de contagem de atestados por colaborador
  const employeeCertCountMap = useMemo(() => {
    const map = new Map<string, number>();
    certificates.forEach((c) => {
      const key = c.employeeId || c.employeeName;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [certificates]);

  // Cálculos de Alertas INSS (Lei 8.213/91 - art. 75)
  // Agrupa dias por funcionário para verificar se soma >= 15 dias ou entre 12-14 dias
  const inssAnalysis = useMemo(() => {
    const empMap = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        employeePosition?: string;
        companyName?: string;
        totalDays: number;
        certificatesCount: number;
        cids: string[];
        has15PlusSingle: boolean;
      }
    >();

    certificates.forEach((c) => {
      const key = c.employeeId || c.employeeName;
      const current = empMap.get(key) || {
        employeeId: c.employeeId,
        employeeName: c.employeeName,
        employeePosition: c.employeePosition,
        companyName: c.companyName,
        totalDays: 0,
        certificatesCount: 0,
        cids: [],
        has15PlusSingle: false,
      };

      current.totalDays += c.daysCount || 0;
      current.certificatesCount += 1;
      if (c.cidCode && !current.cids.includes(c.cidCode)) {
        current.cids.push(c.cidCode);
      }
      if ((c.daysCount || 0) >= 15) {
        current.has15PlusSingle = true;
      }

      empMap.set(key, current);
    });

    const inss15Plus: Array<{
      employeeName: string;
      employeePosition?: string;
      companyName?: string;
      totalDays: number;
      certificatesCount: number;
      cids: string[];
      reason: string;
    }> = [];

    const nearLimit12to14: Array<{
      employeeName: string;
      employeePosition?: string;
      companyName?: string;
      totalDays: number;
      certificatesCount: number;
      cids: string[];
      daysRemaining: number;
    }> = [];

    empMap.forEach((item) => {
      if (item.totalDays >= 15) {
        inss15Plus.push({
          ...item,
          reason: item.has15PlusSingle
            ? 'Atestado individual com 15 ou mais dias de afastamento.'
            : 'Soma cumulativa de atestados atinge ou supera 15 dias.',
        });
      } else if (item.totalDays >= 12 && item.totalDays < 15) {
        nearLimit12to14.push({
          ...item,
          daysRemaining: 15 - item.totalDays,
        });
      }
    });

    return {
      inss15Plus,
      nearLimit12to14,
      totalAlerts: inss15Plus.length + nearLimit12to14.length,
    };
  }, [certificates]);

  // Cálculos dos 6 KPIs principais
  const metrics = useMemo(() => {
    let atestadosCount = 0;
    let declaracoesCount = 0;
    let totalDays = 0;
    let totalHours = 0;
    const cidFrequency = new Map<string, number>();

    certificates.forEach((c) => {
      // Tipo
      if (c.type === 'DECLARACAO_COMPARECIMENTO' || c.type === 'ATESTADO_ACOMPANHAMENTO') {
        declaracoesCount += 1;
      } else {
        atestadosCount += 1;
      }

      totalDays += c.daysCount || 0;
      totalHours += Number(c.absenceHours || 0);

      if (c.cidCode) {
        cidFrequency.set(c.cidCode, (cidFrequency.get(c.cidCode) || 0) + 1);
      }
    });

    // Encontrar CID mais recorrente
    let mostRecurrentCid = 'A09';
    let maxFreq = 0;
    cidFrequency.forEach((count, code) => {
      if (count > maxFreq) {
        maxFreq = count;
        mostRecurrentCid = code;
      }
    });

    return {
      total: certificates.length,
      atestados: atestadosCount,
      declaracoes: declaracoesCount,
      diasAfastados: totalDays,
      horas: Math.round(totalHours),
      alertasInss: inssAnalysis.totalAlerts,
      mostRecurrentCid,
    };
  }, [certificates, inssAnalysis]);

  // Filtro e Ordenação dos registros
  const filteredCertificates = useMemo(() => {
    const result = certificates.filter((cert) => {
      // Busca textual
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const empName = (cert.employeeName || '').toLowerCase();
        const empCpf = (cert.employeeCpf || '').toLowerCase();
        const empReg = (cert.employeeRegistration || '').toLowerCase();
        const cid = (cert.cidCode || '').toLowerCase();
        const cidDesc = (cert.cidDescription || '').toLowerCase();
        const doctor = (cert.doctorName || '').toLowerCase();
        const crm = (cert.doctorCrm || '').toLowerCase();
        const company = (cert.companyName || '').toLowerCase();

        const matches =
          empName.includes(query) ||
          empCpf.includes(query) ||
          empReg.includes(query) ||
          cid.includes(query) ||
          cidDesc.includes(query) ||
          doctor.includes(query) ||
          crm.includes(query) ||
          company.includes(query);

        if (!matches) return false;
      }

      // Filtro por tipo
      if (typeFilter !== 'ALL' && cert.type !== typeFilter) {
        return false;
      }

      // Filtro por data de início
      if (startDateFilter && cert.startDate && cert.startDate < startDateFilter) {
        return false;
      }

      // Filtro por data de término
      if (endDateFilter && cert.endDate && cert.endDate > endDateFilter) {
        return false;
      }

      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'employee':
          comp = (a.employeeName || '').localeCompare(b.employeeName || '');
          break;
        case 'type':
          comp = (a.type || '').localeCompare(b.type || '');
          break;
        case 'period':
          comp = (a.startDate || '').localeCompare(b.startDate || '');
          break;
        case 'created':
          comp = (a.createdAt || '').localeCompare(b.createdAt || '');
          break;
        case 'days':
          comp = (a.daysCount || 0) - (b.daysCount || 0);
          break;
        case 'cid':
          comp = (a.cidCode || '').localeCompare(b.cidCode || '');
          break;
        default:
          comp = 0;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return result;
  }, [certificates, searchTerm, typeFilter, startDateFilter, endDateFilter, sortField, sortOrder]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleOpenCreate = () => {
    setSelectedCertificate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cert: MedicalCertificate) => {
    setSelectedCertificate(cert);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;

    setIsDeleting(true);
    try {
      await medicalCertificateService.delete(deleteCandidate.id);
      toast({
        title: 'Atestado excluído',
        description: 'O registro de afastamento foi removido com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['medical-certificates-list'] });
      queryClient.invalidateQueries({ queryKey: ['medical-certificates-stats'] });
      setDeleteCandidate(null);
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.response?.data?.message || err?.message || 'Falha ao excluir o atestado.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['medical-certificates-list'] });
    queryClient.invalidateQueries({ queryKey: ['medical-certificates-stats'] });
  };

  return (
    <StandardLayout>
      <div className="space-y-4">
        {/* ── HEADER DA PÁGINA (TÍTULO, SUBTÍTULO E BOTÕES DE AÇÃO ALINHADOS ACIMA DOS CARDS) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Gestão de Atestados
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Atestados, declarações, CID, dias/horas de ausência e alerta INSS (15 dias / 60 dias).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="border-gray-800 bg-[#16181b] hover:bg-gray-800 text-gray-300 text-xs font-medium rounded-lg px-3 py-2 flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-gray-400 ${isRefetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReportsModalOpen(true)}
              className="border-gray-800 bg-[#16181b] hover:bg-gray-800 text-emerald-400 text-xs font-medium rounded-lg px-3 py-2 flex items-center gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              Relatórios
            </Button>

            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg px-4 py-2 flex items-center gap-1.5 shadow-md shadow-red-950/40"
            >
              <Plus className="h-4 w-4" />
              Novo lançamento
            </Button>
          </div>
        </div>
        {/* ── 6 CARDS DE KPIS / MÉTRICAS (GRID EXATO DO SCREENSHOT) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* TOTAL */}
          <div className="bg-[#181a1d] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {metrics.total}
            </span>
          </div>

          {/* ATESTADOS */}
          <div className="bg-[#181a1d] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ATESTADOS</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#38bdf8] mt-1">
              {metrics.atestados}
            </span>
          </div>

          {/* DECLARAÇÕES */}
          <div className="bg-[#181a1d] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DECLARAÇÕES</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#22d3ee] mt-1">
              {metrics.declaracoes}
            </span>
          </div>

          {/* DIAS AFASTADOS */}
          <div className="bg-[#181a1d] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DIAS AFASTADOS</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#facc15] mt-1">
              {metrics.diasAfastados}
            </span>
          </div>

          {/* HORAS */}
          <div className="bg-[#181a1d] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HORAS</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#4ade80] mt-1">
              {metrics.horas}
            </span>
          </div>

          {/* ALERTAS INSS */}
          <div className="bg-[#181a1d] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ALERTAS INSS</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#ef4444] mt-1">
              {metrics.alertasInss}
            </span>
          </div>
        </div>

        {/* CID MAIS RECORRENTE NO PERÍODO */}
        <div className="text-xs text-gray-400 font-medium px-1">
          CID mais recorrente no período: <strong className="text-white font-bold">{metrics.mostRecurrentCid}</strong>
        </div>

        {/* ── BANNER EXPANSÍVEL: ALERTAS DE AFASTAMENTO CLT & ENCAMINHAMENTO INSS ── */}
        <div className="bg-[#241315]/80 border border-red-900/60 rounded-xl overflow-hidden shadow-lg transition-all">
          <div
            onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-red-950/30 transition-colors"
          >
            {/* Esquerda: Ícone de alerta + Título e Subtítulo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-950/90 border border-red-700/80 flex items-center justify-center text-red-500 flex-shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Alertas de Afastamento CLT & Encaminhamento INSS
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Lei 8.213/91 — Clique para {isAlertsExpanded ? 'recolher' : 'expandir'}
                </p>
              </div>
            </div>

            {/* Direita: Badges e Seta */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#dc2626] text-white shadow-sm">
                <Flame className="h-3.5 w-3.5" />
                {inssAnalysis.inss15Plus.length} INSS (15+ dias)
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f59e0b] text-black shadow-sm">
                <AlertTriangle className="h-3.5 w-3.5" />
                {inssAnalysis.nearLimit12to14.length} Próximo (12-14d)
              </span>

              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isAlertsExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* Conteúdo Expandido do Banner */}
          {isAlertsExpanded && (
            <div className="p-4 border-t border-red-900/40 bg-[#170c0e]/95 space-y-4">
              <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-xs text-red-200 leading-relaxed">
                <strong className="text-red-100 font-semibold">Art. 75 da Lei nº 8.213/91:</strong> Durante os primeiros 15 dias consecutivos de afastamento por motivo de doença ou acidente, incumbe à empresa pagar ao segurado o seu salário integral. A partir do 16º dia, ou no caso de novo afastamento pelo mesmo motivo/CID dentro de 60 dias somando mais de 15 dias, a responsabilidade passa a ser da Previdência Social (INSS).
              </div>

              {inssAnalysis.inss15Plus.length === 0 && inssAnalysis.nearLimit12to14.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">
                  Nenhum colaborador com afastamento superior a 12 dias no período.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Lista de 15+ dias */}
                  {inssAnalysis.inss15Plus.map((item, idx) => (
                    <div
                      key={`inss-${idx}`}
                      className="bg-[#210d10] border border-red-800/60 rounded-lg p-3 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-white uppercase">{item.employeeName}</span>
                          <span className="text-[11px] text-gray-400 block">{item.employeePosition || 'Cargo não informado'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase">
                          Encaminhar INSS
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-300">
                        Total acumulado: <strong className="text-red-400">{item.totalDays} dias</strong> ({item.certificatesCount} atestado(s))
                        {item.cids.length > 0 && (
                          <span className="text-gray-400 block mt-0.5">
                            CIDs: <span className="font-mono text-amber-300">{item.cids.join(', ')}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 italic">{item.reason}</p>
                    </div>
                  ))}

                  {/* Lista de 12-14 dias */}
                  {inssAnalysis.nearLimit12to14.map((item, idx) => (
                    <div
                      key={`near-${idx}`}
                      className="bg-[#241708] border border-amber-800/60 rounded-lg p-3 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-white uppercase">{item.employeeName}</span>
                          <span className="text-[11px] text-gray-400 block">{item.employeePosition || 'Cargo não informado'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black uppercase">
                          Atenção ({item.daysRemaining}d p/ 15d)
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-300">
                        Total acumulado: <strong className="text-amber-400">{item.totalDays} dias</strong> ({item.certificatesCount} atestado(s))
                        {item.cids.length > 0 && (
                          <span className="text-gray-400 block mt-0.5">
                            CIDs: <span className="font-mono text-amber-300">{item.cids.join(', ')}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 italic">
                        Próximo do teto de 15 dias pagos pela empresa no prazo de 60 dias.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BARRA DE FILTRO (BUSCAR, TIPO, DD/MM/AAAA, DD/MM/AAAA, FILTRAR) ── */}
        <div className="bg-[#181a1d] border border-gray-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Busca textual */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar funcionário, CID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111315] border-gray-800 text-white placeholder-gray-500 pl-9 text-xs h-9 rounded-lg focus-visible:ring-1 focus-visible:ring-red-600"
            />
          </div>

          {/* Select Todos os tipos */}
          <div className="w-full md:w-56">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-[#111315] border-gray-800 text-gray-200 text-xs h-9 rounded-lg">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent className="bg-[#181a1d] border-gray-800 text-gray-200 text-xs max-h-72">
                <SelectItem value="ALL">Todos os tipos</SelectItem>
                {Object.entries(MEDICAL_CERTIFICATE_TYPE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data De */}
          <div className="w-full md:w-36">
            <Input
              type="date"
              placeholder="dd/mm/aaaa"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="bg-[#111315] border-gray-800 text-gray-200 text-xs h-9 rounded-lg"
            />
          </div>

          {/* Data Até */}
          <div className="w-full md:w-36">
            <Input
              type="date"
              placeholder="dd/mm/aaaa"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="bg-[#111315] border-gray-800 text-gray-200 text-xs h-9 rounded-lg"
            />
          </div>

          {/* Botão Filtrar */}
          <Button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 px-6 rounded-lg flex-shrink-0"
          >
            Filtrar
          </Button>

          {/* Botão Limpar se filtros aplicados */}
          {(searchTerm || typeFilter !== 'ALL' || startDateFilter || endDateFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('ALL');
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className="text-gray-400 hover:text-white text-xs h-9 px-2.5"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* ── TABELA DE ATESTADOS (DESIGN FIEL AO SCREENSHOT) ── */}
        <div className="bg-[#141618] border border-gray-800/80 rounded-xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-500" />
              <p className="text-sm">Carregando atestados cadastrados...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <Stethoscope className="h-10 w-10 mx-auto text-gray-600" />
              <div>
                <p className="text-sm font-semibold text-gray-300">Nenhum registro encontrado</p>
                <p className="text-xs text-gray-500 mt-1">
                  Nenhum atestado ou declaração corresponde aos filtros selecionados.
                </p>
              </div>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                size="sm"
                className="border-gray-800 text-gray-300 hover:bg-gray-800 text-xs mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-red-500" />
                Novo Lançamento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#181a1d] border-b border-gray-800">
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead
                      onClick={() => toggleSort('employee')}
                      className="text-gray-400 text-xs font-semibold cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1">
                        Funcionário
                        <ArrowUpDown className="h-3 w-3 text-gray-500" />
                      </div>
                    </TableHead>

                    <TableHead
                      onClick={() => toggleSort('type')}
                      className="text-gray-400 text-xs font-semibold cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1">
                        Tipo
                        <ArrowUpDown className="h-3 w-3 text-gray-500" />
                      </div>
                    </TableHead>

                    <TableHead
                      onClick={() => toggleSort('period')}
                      className="text-gray-400 text-xs font-semibold cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1">
                        Período
                        <ArrowUpDown className="h-3 w-3 text-gray-500" />
                      </div>
                    </TableHead>

                    <TableHead
                      onClick={() => toggleSort('created')}
                      className="text-gray-400 text-xs font-semibold cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1">
                        Cadastro
                        <ArrowUpDown className="h-3 w-3 text-gray-500" />
                      </div>
                    </TableHead>

                    <TableHead
                      onClick={() => toggleSort('days')}
                      className="text-gray-400 text-xs font-semibold cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1">
                        Dias/Horas
                        <ArrowUpDown className="h-3 w-3 text-gray-500" />
                      </div>
                    </TableHead>

                    <TableHead
                      onClick={() => toggleSort('cid')}
                      className="text-gray-400 text-xs font-semibold cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1">
                        CID
                        <ArrowUpDown className="h-3 w-3 text-gray-500" />
                      </div>
                    </TableHead>

                    <TableHead className="text-gray-400 text-xs font-semibold">EMPRESA</TableHead>

                    <TableHead className="text-right text-gray-400 text-xs font-semibold">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-800/60">
                  {filteredCertificates.map((cert) => {
                    const empCount =
                      employeeCertCountMap.get(cert.employeeId || cert.employeeName) || 1;

                    // Formatação de datas
                    const startFormatted = cert.startDate
                      ? new Date(cert.startDate + 'T00:00:00').toLocaleDateString('pt-BR')
                      : '—';
                    const endFormatted = cert.endDate
                      ? new Date(cert.endDate + 'T00:00:00').toLocaleDateString('pt-BR')
                      : '—';
                    const createdFormatted = cert.createdAt
                      ? new Date(cert.createdAt).toLocaleDateString('pt-BR')
                      : '—';

                    return (
                      <TableRow
                        key={cert.id}
                        className="border-gray-800/80 hover:bg-[#1a1c20] transition-colors"
                      >
                        {/* 1. FUNCIONÁRIO (Avatar amarelo, Nome bold, Cargo uppercase, Badge de atestados) */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 flex-shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-white uppercase tracking-wide truncate max-w-[200px]" title={cert.employeeName}>
                                {cert.employeeName || '—'}
                              </span>
                              <span className="text-[11px] text-gray-400 uppercase font-medium mt-0.5">
                                {cert.employeePosition || 'Cargo não informado'}
                              </span>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/80 border border-blue-800/80 text-blue-400 w-fit">
                                {empCount} atestado(s)
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* 2. TIPO (Badge roxo estilizado com ícone) */}
                        <TableCell className="py-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#24132b] border border-[#6b21a8] text-[#d8b4fe] whitespace-nowrap">
                            <FileHeart className="h-3 w-3 text-purple-400 flex-shrink-0" />
                            {cert.typeDescription || MEDICAL_CERTIFICATE_TYPE_LABELS[cert.type] || 'Atestado'}
                          </span>
                        </TableCell>

                        {/* 3. PERÍODO (Ícone calendário amarelo e intervalo) */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-200">
                            <Calendar className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                            <span className="font-mono">{startFormatted}</span>
                            <span className="text-gray-500">→</span>
                            <span className="font-mono">{endFormatted}</span>
                          </div>
                        </TableCell>

                        {/* 4. CADASTRO */}
                        <TableCell className="py-3">
                          <span className="text-xs text-gray-300 font-mono">
                            {createdFormatted}
                          </span>
                        </TableCell>

                        {/* 5. DIAS/HORAS (Dark pill com texto amarelo) */}
                        <TableCell className="py-3">
                          <span className="px-2.5 py-1 rounded-md bg-black/80 border border-gray-800 text-xs font-bold text-yellow-400 font-mono inline-block">
                            {cert.isPartialDay ? `${cert.absenceHours}h` : `${cert.daysCount}d`}
                          </span>
                        </TableCell>

                        {/* 6. CID (Código destacado + descrição embaixo) */}
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-xs font-mono w-fit">
                              {cert.cidCode || '—'}
                            </span>
                            <span
                              className="text-[11px] text-gray-400 block mt-1 truncate max-w-[220px]"
                              title={cert.cidDescription || ''}
                            >
                              {cert.cidDescription || 'Sem descrição cadastrada'}
                            </span>
                          </div>
                        </TableCell>

                        {/* 7. EMPRESA (Ícone de prédio e nome da empresa) */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-300">
                            <Building2 className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                            <span className="truncate max-w-[180px]" title={cert.companyName || 'Promover Terceirização'}>
                              {cert.companyName || 'Promover Terceirização'}
                            </span>
                          </div>
                        </TableCell>

                        {/* 8. AÇÕES */}
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {cert.documentUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(cert.documentUrl, '_blank')}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                                title="Visualizar Comprovante"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(cert)}
                              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                              title="Editar Atestado"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteCandidate(cert)}
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-red-950/40"
                              title="Excluir Atestado"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL DE CRIAÇÃO / EDIÇÃO DE ATESTADO ── */}
      <MedicalCertificateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        certificate={selectedCertificate}
        onSuccess={handleSuccess}
      />

      {/* ── MODAL DE RELATÓRIOS ── */}
      <Dialog open={isReportsModalOpen} onOpenChange={setIsReportsModalOpen}>
        <DialogContent className="max-w-2xl bg-[#16181b] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              Relatório de Absenteísmo e Afastamentos
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Consolidação analítica de licenças médicas, atestados e alertas da Lei 8.213/91.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Resumo Rápido */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#111315] border border-gray-800 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Total de Lançamentos</span>
                <p className="text-xl font-bold text-white mt-1">{metrics.total}</p>
              </div>
              <div className="p-3 bg-[#111315] border border-gray-800 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Dias de Ausência</span>
                <p className="text-xl font-bold text-yellow-400 mt-1">{metrics.diasAfastados} dias</p>
              </div>
              <div className="p-3 bg-[#111315] border border-gray-800 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Horas Abonadas</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">{metrics.horas} horas</p>
              </div>
            </div>

            {/* Encaminhamentos INSS */}
            <div className="p-3.5 bg-red-950/30 border border-red-900/40 rounded-lg space-y-2">
              <h5 className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-red-500" />
                Casos Sujeitos a Encaminhamento Previdenciário (INSS)
              </h5>
              <p className="text-[11px] text-gray-300">
                Atualmente, há <strong>{inssAnalysis.inss15Plus.length} colaborador(es)</strong> com 15 ou mais dias de afastamento e <strong>{inssAnalysis.nearLimit12to14.length}</strong> em monitoramento preventivo (12 a 14 dias).
              </p>
            </div>

            {/* Top CIDs do período */}
            <div className="p-3 bg-[#111315] border border-gray-800 rounded-lg space-y-2">
              <h5 className="text-xs font-bold text-gray-200">Patologias Mais Frequentes (CID-10)</h5>
              <div className="text-xs text-gray-300 space-y-1">
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span>CID {metrics.mostRecurrentCid}</span>
                  <span className="text-gray-400 font-mono">Mais incidente</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-800 pt-3 flex justify-between sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 text-xs"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Imprimir / PDF
            </Button>
            <Button
              size="sm"
              onClick={() => setIsReportsModalOpen(false)}
              className="bg-gray-800 hover:bg-gray-700 text-white text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO ── */}
      <Dialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <DialogContent className="max-w-md bg-[#16181b] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Confirmar Exclusão de Atestado
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Esta ação removerá o registro de afastamento do histórico. O abono de horas deste período será cancelado.
            </DialogDescription>
          </DialogHeader>

          {deleteCandidate && (
            <div className="p-3 bg-[#111315] border border-gray-800 rounded-lg text-xs space-y-1">
              <div>
                <span className="text-gray-400">Colaborador:</span>{' '}
                <strong className="text-white">{deleteCandidate.employeeName}</strong>
              </div>
              <div>
                <span className="text-gray-400">Período:</span>{' '}
                <span className="text-gray-200">
                  {deleteCandidate.startDate} até {deleteCandidate.endDate} ({deleteCandidate.daysCount} dias)
                </span>
              </div>
              {deleteCandidate.cidCode && (
                <div>
                  <span className="text-gray-400">CID:</span>{' '}
                  <span className="text-amber-400 font-mono">{deleteCandidate.cidCode}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteCandidate(null)}
              disabled={isDeleting}
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Excluindo...
                </>
              ) : (
                'Sim, Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default GestaoAtestados;
