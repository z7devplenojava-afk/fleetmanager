import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Search, 
  RefreshCw, 
  Bell, 
  Filter, 
  Stethoscope, 
  GraduationCap, 
  ShieldAlert, 
  HardHat, 
  User, 
  Calendar, 
  ArrowUpRight,
  Send,
  Loader2,
  FileCheck2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { sstService, SSTAlert, MedicalExam } from '@/services/sstService';
import { sstAlertService } from '@/services/sstComplianceService';

interface ExpirationItem {
  id: string;
  employeeId?: string;
  employeeName: string;
  category: 'ASO' | 'CNH' | 'TREINAMENTO' | 'EPI' | 'OUTRO';
  description: string;
  dueDate: string;
  daysDiff: number; // Negativo = Vencido há X dias; Positivo = Vence em X dias
  status: 'OVERDUE' | 'UPCOMING' | 'VALID';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

export const SstVencimentosTab: React.FC = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [runningAlerts, setRunningAlerts] = useState(false);
  const [items, setItems] = useState<ExpirationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [alertsData, examsData] = await Promise.all([
        sstService.getAlerts().catch(() => []),
        sstService.getMedicalExams().catch(() => [])
      ]);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const parsed: ExpirationItem[] = [];

      // Processar exames médicos
      examsData.forEach((exam: MedicalExam) => {
        const rawDate = exam.nextExamDate || exam.expirationDate;
        if (!rawDate) return;

        const d = new Date(rawDate);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let status: 'OVERDUE' | 'UPCOMING' | 'VALID' = 'VALID';
        let severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO';

        if (diffDays < 0) {
          status = 'OVERDUE';
          severity = 'CRITICAL';
        } else if (diffDays <= 30) {
          status = 'UPCOMING';
          severity = 'WARNING';
        }

        // Adiciona à lista se estiver vencido ou vencendo nos próximos 60 dias
        if (diffDays <= 60) {
          parsed.push({
            id: `exam-${exam.id}`,
            employeeId: exam.employeeId,
            employeeName: exam.employeeName || 'Colaborador',
            category: 'ASO',
            description: `ASO: ${exam.examType || exam.examCategory || 'Exame Ocupacional'}`,
            dueDate: rawDate,
            daysDiff: diffDays,
            status,
            severity
          });
        }
      });

      // Processar alertas do sistema SST
      alertsData.forEach((alert: SSTAlert) => {
        if (!alert.dueDate) return;

        const d = new Date(alert.dueDate);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let category: 'ASO' | 'CNH' | 'TREINAMENTO' | 'EPI' | 'OUTRO' = 'OUTRO';
        const typeStr = String(alert.type || '').toUpperCase();
        if (typeStr.includes('EXAME') || typeStr.includes('ASO')) category = 'ASO';
        else if (typeStr.includes('CNH')) category = 'CNH';
        else if (typeStr.includes('TREINAMENTO')) category = 'TREINAMENTO';
        else if (typeStr.includes('EPI')) category = 'EPI';

        let status: 'OVERDUE' | 'UPCOMING' | 'VALID' = 'VALID';
        let severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO';

        if (diffDays < 0) {
          status = 'OVERDUE';
          severity = 'CRITICAL';
        } else if (diffDays <= 30) {
          status = 'UPCOMING';
          severity = 'WARNING';
        }

        // Evitar duplicidade caso já esteja nos exames
        const exists = parsed.some(p => p.employeeName === alert.employeeName && p.dueDate === alert.dueDate);
        if (!exists) {
          parsed.push({
            id: `alert-${alert.id}`,
            employeeId: alert.employeeId,
            employeeName: alert.employeeName || 'Colaborador',
            category,
            description: alert.title || alert.message || 'Vencimento de SST',
            dueDate: alert.dueDate,
            daysDiff: diffDays,
            status,
            severity
          });
        }
      });

      // Ordenar por prioridade (os mais atrasados primeiro)
      parsed.sort((a, b) => a.daysDiff - b.daysDiff);
      setItems(parsed);
    } catch (err) {
      console.error('Erro ao carregar vencimentos de SST:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os vencimentos de SST.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunAlerts = async () => {
    try {
      setRunningAlerts(true);
      const res = await sstAlertService.runManualCheck();
      toast({
        title: 'Verificação Concluída',
        description: `${res.asoAlerts} alerta(s) de ASO e ${res.cnhAlerts} de CNH verificados e atualizados.`,
      });
      loadData();
    } catch (e: any) {
      toast({
        title: 'Erro na Verificação',
        description: e?.response?.data?.message || 'Falha ao executar varredura de alertas.',
        variant: 'destructive',
      });
    } finally {
      setRunningAlerts(false);
    }
  };

  // Estatísticas
  const stats = useMemo(() => {
    let overdue = 0;
    let upcoming = 0;
    let asoCount = 0;
    let trainingCount = 0;

    items.forEach((item) => {
      if (item.status === 'OVERDUE') overdue++;
      else if (item.status === 'UPCOMING') upcoming++;

      if (item.category === 'ASO') asoCount++;
      else if (item.category === 'TREINAMENTO') trainingCount++;
    });

    return { total: items.length, overdue, upcoming, asoCount, trainingCount };
  }, [items]);

  // Filtragem
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      if (term) {
        const matches = 
          item.employeeName.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

      return true;
    });
  }, [items, searchTerm, categoryFilter, statusFilter]);

  function renderCategoryBadge(cat: string) {
    switch (cat) {
      case 'ASO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Stethoscope className="w-3 h-3" /> Exame ASO
          </span>
        );
      case 'CNH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            CNH Motorista
          </span>
        );
      case 'TREINAMENTO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <GraduationCap className="w-3 h-3" /> Treinamento NR
          </span>
        );
      case 'EPI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <HardHat className="w-3 h-3" /> Ficha EPI / CA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            SST
          </span>
        );
    }
  }

  function renderSituationBadge(item: ExpirationItem) {
    if (item.status === 'OVERDUE') {
      const days = Math.abs(item.daysDiff);
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/40 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          Vencido há {days} dia{days === 1 ? '' : 's'}
        </span>
      );
    }
    if (item.status === 'UPCOMING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40">
          <Clock className="w-3 h-3" />
          {item.daysDiff === 0 ? 'Vence Hoje' : `Vence em ${item.daysDiff} dia${item.daysDiff === 1 ? '' : 's'}`}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3" />
        Em Dia
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400 font-medium">Vencidos / Atrasados</p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">{stats.overdue}</h3>
              <p className="text-[11px] text-slate-500">Exigem ação imediata</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400 font-medium">A Vencer (≤ 30 dias)</p>
              <h3 className="text-2xl font-bold text-amber-300 mt-1">{stats.upcoming}</h3>
              <p className="text-[11px] text-slate-500">Programar agendamento</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400 font-medium">Alertas de ASO</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.asoCount}</h3>
              <p className="text-[11px] text-slate-500">Exames ocupacionais</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Stethoscope className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-400 font-medium">Treinamentos NRs</p>
              <h3 className="text-2xl font-bold text-purple-400 mt-1">{stats.trainingCount}</h3>
              <p className="text-[11px] text-slate-500">Reciclagens e matriz</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por colaborador ou tipo de exame/treinamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                size="sm"
                onClick={handleRunAlerts}
                disabled={runningAlerts}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Bell className={`h-4 w-4 mr-1.5 ${runningAlerts ? 'animate-bounce' : ''}`} />
                Varredura de ASO/CNH
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Categoria:</span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-slate-950/60 border-slate-700 text-slate-200 h-9">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <SelectItem value="ALL">Todas as Categorias</SelectItem>
                  <SelectItem value="ASO">Exames Médicos Ocupacionais (ASO)</SelectItem>
                  <SelectItem value="CNH">CNH de Motoristas</SelectItem>
                  <SelectItem value="TREINAMENTO">Treinamentos e NRs</SelectItem>
                  <SelectItem value="EPI">Fichas de EPI e CAs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Situação:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-950/60 border-slate-700 text-slate-200 h-9">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <SelectItem value="ALL">Todas as Situações</SelectItem>
                  <SelectItem value="OVERDUE">Apenas Vencidos / Atrasados</SelectItem>
                  <SelectItem value="UPCOMING">A Vencer (≤ 30 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vencimentos */}
      <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/80 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-300 font-semibold">Colaborador</TableHead>
                <TableHead className="text-slate-300 font-semibold">Item & Descrição</TableHead>
                <TableHead className="text-slate-300 font-semibold">Categoria</TableHead>
                <TableHead className="text-slate-300 font-semibold">Vencimento</TableHead>
                <TableHead className="text-slate-300 font-semibold text-center">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="border-slate-800/60">
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-36" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-48" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-24" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-24" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-32 mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                      <p className="font-semibold text-slate-200">Tudo em dia!</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                          ? 'Nenhum registro encontrado para os filtros selecionados.'
                          : 'Nenhum vencimento ou atraso de SST pendente no momento.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-slate-800/60 hover:bg-slate-800/40">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-semibold">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span>{item.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      {renderCategoryBadge(item.category)}
                    </TableCell>
                    <TableCell className="text-slate-300 font-mono text-xs">
                      {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderSituationBadge(item)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
