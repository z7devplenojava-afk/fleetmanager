import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText, 
  HardHat, 
  Loader2, 
  Building, 
  Briefcase, 
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { employeeService, Employee } from '@/services/employeeService';
import { companyService, Company } from '@/services/companyService';
import * as XLSX from 'xlsx';

interface StockEmployeesTabProps {
  onOpenEpiFormForEmployee?: (employee: Employee) => void;
}

export const StockEmployeesTab: React.FC<StockEmployeesTabProps> = ({ onOpenEpiFormForEmployee }) => {
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'ALPHA_ASC' | 'ALPHA_DESC' | 'DATE_DESC' | 'DATE_ASC'>('ALPHA_ASC');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, comps] = await Promise.all([
        employeeService.getEmployees().catch(() => []),
        companyService.getCompanies().catch(() => [])
      ]);
      setEmployees(Array.isArray(emps) ? emps : []);
      setCompanies(Array.isArray(comps) ? comps : []);
    } catch (error) {
      console.error('Erro ao carregar funcionários no Almoxarifado:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de funcionários.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    toast({ title: 'Atualizado', description: 'Cadastros de funcionários atualizados.' });
  };

  // KPIs
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE' || (e as any).status === 'Ativo').length;

  // Filtragem e Ordenação
  const filteredEmployees = useMemo(() => {
    let list = employees.filter(e => {
      // Filtro Status
      if (statusFilter !== 'ALL') {
        const s = e.status?.toUpperCase();
        if (statusFilter === 'ACTIVE' && s !== 'ACTIVE' && s !== 'ATIVO') return false;
        if (statusFilter === 'INACTIVE' && s !== 'INACTIVE' && s !== 'INATIVO') return false;
        if (statusFilter === 'VACATION' && s !== 'VACATION' && s !== 'FERIAS') return false;
        if (statusFilter === 'LEAVE' && s !== 'LEAVE' && s !== 'AFASTADO') return false;
      }

      // Filtro Empresa
      if (companyFilter !== 'ALL') {
        if ((e as any).companyId !== companyFilter) return false;
      }

      // Busca texto
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = e.name?.toLowerCase().includes(q);
        const matchCpf = e.document?.toLowerCase().includes(q);
        const matchMatricula = (e as any).registrationNumber?.toLowerCase().includes(q);
        const matchPosition = e.position?.name?.toLowerCase().includes(q) || (e as any).cargo?.toLowerCase().includes(q);
        const matchUnit = e.unit?.name?.toLowerCase().includes(q) || (e as any).setor?.toLowerCase().includes(q);
        const matchComp = (e as any).companyName?.toLowerCase().includes(q);
        if (!matchName && !matchCpf && !matchMatricula && !matchPosition && !matchUnit && !matchComp) return false;
      }

      return true;
    });

    // Ordenação
    list.sort((a, b) => {
      if (sortBy === 'ALPHA_ASC') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'ALPHA_DESC') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'DATE_DESC') {
        const da = (a as any).admissionDate || a.createdAt || '';
        const db = (b as any).admissionDate || b.createdAt || '';
        return db.localeCompare(da);
      }
      if (sortBy === 'DATE_ASC') {
        const da = (a as any).admissionDate || a.createdAt || '';
        const db = (b as any).admissionDate || b.createdAt || '';
        return da.localeCompare(db);
      }
      return 0;
    });

    return list;
  }, [employees, statusFilter, companyFilter, searchTerm, sortBy]);

  // Exportar Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredEmployees.map(e => ({
        'Nome do Colaborador': e.name,
        'CPF': e.document || '—',
        'Matrícula': (e as any).registrationNumber || '—',
        'Cargo / Função': e.position?.name || (e as any).cargo || '—',
        'Empresa': (e as any).companyName || '—',
        'Setor / Posto': e.unit?.name || (e as any).setor || '—',
        'Data de Admissão': (e as any).admissionDate ? new Date((e as any).admissionDate).toLocaleDateString('pt-BR') : '—',
        'Status': e.status === 'ACTIVE' || (e as any).status === 'Ativo' ? 'Ativo' : 'Inativo'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Funcionarios_Almoxarifado');
      XLSX.writeFile(wb, `Funcionarios_Almoxarifado_${new Date().toISOString().slice(0, 10)}.xlsx`);

      toast({
        title: 'Exportação Concluída',
        description: `${dataToExport.length} colaboradores exportados para Excel.`
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({ title: 'Erro', description: 'Falha ao exportar planilha.', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = status?.toUpperCase() || 'ACTIVE';
    if (s === 'ACTIVE' || s === 'ATIVO') {
      return (
        <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-[10px]">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
        </Badge>
      );
    }
    if (s === 'VACATION' || s === 'FERIAS') {
      return (
        <Badge className="bg-amber-600/20 text-amber-400 border border-amber-500/40 text-[10px]">
          Férias
        </Badge>
      );
    }
    if (s === 'LEAVE' || s === 'AFASTADO') {
      return (
        <Badge className="bg-purple-600/20 text-purple-400 border border-purple-500/40 text-[10px]">
          Afastado
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-600/20 text-rose-400 border border-rose-500/40 text-[10px]">
        <XCircle className="h-3 w-3 mr-1" /> Inativo
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Ações */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-seguranca-graphite p-5 rounded-2xl border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-seguranca-yellow/20 border border-seguranca-yellow/50 flex items-center justify-center text-seguranca-yellow">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-seguranca-lightgray flex items-center gap-2">
              Consulta de Funcionários
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Acesso para o Almoxarifado: consulte cadastros, empresas, setores, postos de trabalho e gere relatórios operacionais.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="border-emerald-600/60 text-emerald-400 hover:bg-emerald-950 font-medium text-xs"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-600 text-gray-200 hover:bg-gray-800 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total de Cadastros</p>
              <p className="text-2xl font-bold font-mono text-seguranca-lightgray mt-1">{totalEmployees}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Funcionários Ativos</p>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeEmployees}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Exibindo Filtrados</p>
              <p className="text-2xl font-bold font-mono text-seguranca-yellow mt-1">{filteredEmployees.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-950/60 border border-yellow-800 flex items-center justify-center text-seguranca-yellow">
              <Filter className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
        <div>
          <Label className="text-[11px] text-gray-400 uppercase font-semibold">Buscar</Label>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nome, CPF, cargo, setor..."
              className="pl-9 bg-seguranca-black border-gray-700 text-xs h-9 text-gray-100"
            />
          </div>
        </div>

        <div>
          <Label className="text-[11px] text-gray-400 uppercase font-semibold">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-xs h-9 text-gray-100">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
              <SelectItem value="ALL" className="text-xs">Todos os Status</SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">Ativos</SelectItem>
              <SelectItem value="VACATION" className="text-xs">Férias</SelectItem>
              <SelectItem value="LEAVE" className="text-xs">Afastados</SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[11px] text-gray-400 uppercase font-semibold">Empresa</Label>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-xs h-9 text-gray-100">
              <SelectValue placeholder="Todas as Empresas" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
              <SelectItem value="ALL" className="text-xs">Todas as Empresas</SelectItem>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[11px] text-gray-400 uppercase font-semibold">Ordenação</Label>
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-xs h-9 text-gray-100">
              <SelectValue placeholder="Ordem Alfabética" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
              <SelectItem value="ALPHA_ASC" className="text-xs">Ordem Alfabética (A-Z)</SelectItem>
              <SelectItem value="ALPHA_DESC" className="text-xs">Ordem Alfabética (Z-A)</SelectItem>
              <SelectItem value="DATE_DESC" className="text-xs">Mais Recentes</SelectItem>
              <SelectItem value="DATE_ASC" className="text-xs">Mais Antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Funcionários */}
      <div className="bg-seguranca-graphite border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-seguranca-yellow" />
            <p className="text-gray-400 text-sm">Carregando lista de funcionários...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
            <p className="font-semibold text-gray-300">Nenhum funcionário encontrado</p>
            <p className="text-xs mt-1">Ajuste os filtros de busca ou verifique a sincronização de dados.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-seguranca-black/80">
              <TableRow className="border-b border-gray-700">
                <TableHead className="text-gray-300 font-semibold text-xs">Funcionário</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">CPF / Matrícula</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Cargo / Função</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Empresa</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Setor / Posto de Trabalho</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-seguranca-yellow/15 border border-seguranca-yellow/40 flex items-center justify-center text-seguranca-yellow font-bold text-xs shrink-0">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : 'F'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-100 text-sm">{emp.name}</div>
                        {(emp as any).email && (
                          <div className="text-xs text-gray-400 truncate max-w-[200px]">{(emp as any).email}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-mono text-xs text-gray-200">{emp.document || '—'}</div>
                    {(emp as any).registrationNumber && (
                      <div className="text-[11px] text-gray-400 font-mono">Mat: {(emp as any).registrationNumber}</div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-xs font-medium text-gray-300">
                      {emp.position?.name || (emp as any).cargo || '—'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs text-gray-300 truncate max-w-[160px]">
                      {(emp as any).companyName || 'Empresa Geral'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs text-gray-300">
                      {emp.unit?.name || (emp as any).setor || 'Geral'}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    {getStatusBadge(emp.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default StockEmployeesTab;
