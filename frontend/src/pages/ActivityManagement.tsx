import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Clock, 
  User, 
  Eye, 
  RefreshCw,
  AlertTriangle,
  Shield,
  Database,
  FileText,
  Settings,
  Users,
  Building2,
  Truck,
  DollarSign,
  FileSpreadsheet,
  BarChart3
} from 'lucide-react';
import api from '@/lib/axios';

interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  status: string;
  executionTimeMs: number;
  createdAt: string;
  endedAt?: string;
}

interface ActivityFilters {
  username: string;
  action: string;
  module: string;
  startDate: string;
  endDate: string;
  status: string;
}

const ActivityManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50); // Limitar a 50 registros por página
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    uniqueUsers: 0,
    successes: 0,
    errors: 0
  });
  const [filters, setFilters] = useState<ActivityFilters>({
    username: '',
    action: '',
    module: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  const [debouncedFilters, setDebouncedFilters] = useState<ActivityFilters>(filters);

  // Debounce para filtros (evita múltiplas requisições)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(0); // Resetar página ao mudar filtros
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [filters]);

  const loadActivities = useCallback(async (pageNum: number = 0, resetPage: boolean = false) => {
    setLoading(true);
    try {
      // Converter "all" para string vazia para a API
      const apiFilters: any = {
        username: debouncedFilters.username || undefined,
        action: debouncedFilters.action === 'all' ? undefined : (debouncedFilters.action || undefined),
        module: debouncedFilters.module === 'all' ? undefined : (debouncedFilters.module || undefined),
        status: debouncedFilters.status === 'all' ? undefined : (debouncedFilters.status || undefined),
        page: pageNum,
        size: pageSize
      };
      
      // Adicionar datas apenas se preenchidas
      if (debouncedFilters.startDate) {
        apiFilters.startDate = debouncedFilters.startDate;
      }
      if (debouncedFilters.endDate) {
        apiFilters.endDate = debouncedFilters.endDate;
      }
      
      // Remover parâmetros undefined para não enviar na requisição
      Object.keys(apiFilters).forEach(key => {
        if (apiFilters[key] === undefined || apiFilters[key] === '') {
          delete apiFilters[key];
        }
      });
      
      const response = await api.get('/activity-logs', { params: apiFilters });
      
      // Verificar se a resposta é paginada ou um array simples
      const isPaginated = response.data && typeof response.data === 'object' && 'content' in response.data;
      
      if (isPaginated) {
        const paginatedData = response.data;
        const newData = paginatedData.content || [];
        const finalTotal = paginatedData.totalElements || paginatedData.total || newData.length;
        
        setTotalItems(finalTotal);
        
        setActivities(prevActivities => {
          const finalData = resetPage || pageNum === 0 ? newData : [...prevActivities, ...newData];
          
          // Calcular estatísticas apenas dos dados carregados (não do total)
          const uniqueUsers = new Set(finalData.map((a: ActivityLog) => a.username)).size;
          const successes = finalData.filter((a: ActivityLog) => a.status?.toLowerCase() === 'success').length;
          const errors = finalData.filter((a: ActivityLog) => a.status?.toLowerCase() === 'error').length;
          
          setStats({
            total: finalTotal,
            uniqueUsers,
            successes,
            errors
          });
          
          return finalData;
        });
      } else {
        // Se não for paginado, limitar no frontend para evitar travamento
        const allData = Array.isArray(response.data) ? response.data : [];
        const finalTotal = allData.length;
        
        // Limitar a quantidade máxima de dados carregados (500 registros)
        const maxRecords = 500;
        const limitedData = allData.slice(0, Math.min((pageNum + 1) * pageSize, maxRecords));
        
        setTotalItems(Math.min(finalTotal, maxRecords));
        
        setActivities(prevActivities => {
          const finalData = resetPage || pageNum === 0 
            ? limitedData 
            : [...prevActivities, ...allData.slice(prevActivities.length, limitedData.length)];
          
          // Calcular estatísticas apenas dos dados carregados
          const uniqueUsers = new Set(finalData.map((a: ActivityLog) => a.username)).size;
          const successes = finalData.filter((a: ActivityLog) => a.status?.toLowerCase() === 'success').length;
          const errors = finalData.filter((a: ActivityLog) => a.status?.toLowerCase() === 'error').length;
          
          setStats({
            total: Math.min(finalTotal, maxRecords),
            uniqueUsers,
            successes,
            errors
          });
          
          return finalData;
        });
      }
      
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as atividades.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, pageSize, toast]);

  const exportActivities = async () => {
    try {
      const response = await api.get('/activity-logs/export', { 
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `atividades_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao exportar atividades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive"
      });
    }
  };

  const getActionIcon = (action: string) => {
    if (!action) return <Activity size={16} className="text-gray-500" />;
    
    switch (action.toLowerCase()) {
      case 'login': return <Shield size={16} className="text-green-500" />;
      case 'logout': return <Shield size={16} className="text-red-500" />;
      case 'create': return <Database size={16} className="text-blue-500" />;
      case 'update': return <Settings size={16} className="text-yellow-500" />;
      case 'delete': return <AlertTriangle size={16} className="text-red-500" />;
      case 'view': return <Eye size={16} className="text-green-500" />;
      case 'export': return <Download size={16} className="text-purple-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getModuleIcon = (module: string) => {
    if (!module) return <Database size={16} className="text-gray-500" />;
    
    switch (module.toLowerCase()) {
      case 'users': return <Users size={16} className="text-blue-500" />;
      case 'clients': return <Building2 size={16} className="text-green-500" />;
      case 'fleet': return <Truck size={16} className="text-orange-500" />;
      case 'financial': return <DollarSign size={16} className="text-green-500" />;
      case 'payslips': return <FileSpreadsheet size={16} className="text-purple-500" />;
      case 'reports': return <BarChart3 size={16} className="text-indigo-500" />;
      case 'system': return <Settings size={16} className="text-gray-500" />;
      default: return <Database size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="secondary">Desconhecido</Badge>;
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'success') {
      return <Badge variant="default" className="bg-green-600">Sucesso</Badge>;
    } else if (statusLower === 'error') {
      return <Badge variant="destructive">Erro</Badge>;
    } else if (statusLower === 'warning') {
      return <Badge variant="secondary" className="bg-yellow-600">Aviso</Badge>;
    } else {
      return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Carregar página inicial apenas uma vez
  useEffect(() => {
    // Carregar apenas a primeira página inicialmente (com delay para não bloquear UI)
    const timer = setTimeout(() => {
      loadActivities(0, true);
    }, 100);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Carregar atividades quando filtros mudarem (com debounce)
  useEffect(() => {
    // Evitar carregar se ainda não carregou a primeira vez
    if (activities.length === 0 && !loading) return;
    
    setPage(0);
    // Usar setTimeout para não bloquear a UI
    const timer = setTimeout(() => {
      loadActivities(0, true);
    }, 100);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  // Função para carregar mais (scroll infinito ou botão)
  const loadMore = useCallback(() => {
    if (!loading && activities.length < totalItems) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadActivities(nextPage, false);
    }
  }, [loading, activities.length, totalItems, page, loadActivities]);

  // Memoizar estatísticas (ANTES de qualquer retorno condicional)
  const statsDisplay = useMemo(() => {
    const displayStats = {
      total: stats.total || totalItems || 0,
      uniqueUsers: stats.uniqueUsers || 0,
      successes: stats.successes || 0,
      errors: stats.errors || 0
    };
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Atividades</p>
                <p className="text-2xl font-bold text-seguranca-lightgray">{displayStats.total}</p>
              </div>
              <Activity className="text-seguranca-yellow" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Usuários Únicos</p>
                <p className="text-2xl font-bold text-seguranca-lightgray">
                  {displayStats.uniqueUsers}
                </p>
              </div>
              <Users className="text-blue-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sucessos</p>
                <p className="text-2xl font-bold text-green-500">
                  {displayStats.successes}
                </p>
              </div>
              <Shield className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Erros</p>
                <p className="text-2xl font-bold text-red-500">
                  {displayStats.errors}
                </p>
              </div>
              <AlertTriangle className="text-red-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }, [stats, totalItems]);

  // Memoizar tabela de atividades (ANTES de qualquer retorno condicional)
  const activitiesTable = useMemo(() => {
    const maxVisibleRows = 100;
    const visibleActivities = activities.slice(0, maxVisibleRows);
    
    return (
      <>
        {visibleActivities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
        {activities.length > maxVisibleRows && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-4 bg-yellow-500/10">
              <p className="text-sm text-yellow-400">
                Exibindo {maxVisibleRows} de {activities.length} atividades. 
                Use "Carregar Mais" para ver mais registros.
              </p>
            </TableCell>
          </TableRow>
        )}
        {activities.length === 0 && !loading && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Activity size={48} />
                <p className="text-lg font-medium">Nenhuma atividade encontrada</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  }, [activities, loading]);

  // Verificar se o usuário é SUPER_ADMIN (DEPOIS de todos os hooks)
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle size={24} />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Esta área é exclusiva para Super Administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-seguranca-lightgray flex items-center gap-3">
              <Activity className="text-seguranca-yellow" />
              Gestão de Atividades
            </h1>
            <p className="text-gray-400 mt-2">
              Monitoramento completo das atividades dos usuários no sistema
            </p>
          </div>
          <Badge variant="outline" className="border-red-500 text-red-500">
            🟥 SUPER_ADMIN
          </Badge>
        </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                placeholder="Nome do usuário"
                value={filters.username}
                onChange={(e) => setFilters({ ...filters, username: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="action">Ação</Label>
              <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE">Criar</SelectItem>
                  <SelectItem value="UPDATE">Atualizar</SelectItem>
                  <SelectItem value="DELETE">Excluir</SelectItem>
                  <SelectItem value="VIEW">Visualizar</SelectItem>
                  <SelectItem value="EXPORT">Exportar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="module">Módulo</Label>
              <Select value={filters.module} onValueChange={(value) => setFilters({ ...filters, module: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os módulos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os módulos</SelectItem>
                  <SelectItem value="USERS">Usuários</SelectItem>
                  <SelectItem value="CLIENTS">Clientes</SelectItem>
                  <SelectItem value="FLEET">Frota</SelectItem>
                  <SelectItem value="FINANCIAL">Financeiro</SelectItem>
                  <SelectItem value="PAYSLIPS">Holerites</SelectItem>
                  <SelectItem value="REPORTS">Relatórios</SelectItem>
                  <SelectItem value="SYSTEM">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="SUCCESS">Sucesso</SelectItem>
                  <SelectItem value="ERROR">Erro</SelectItem>
                  <SelectItem value="WARNING">Aviso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => loadActivities(0, true)} disabled={loading}>
              <Search size={16} className="mr-2" />
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
            <Button variant="outline" onClick={exportActivities}>
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
                  username: '',
                  action: '',
                  module: '',
                  startDate: '',
                  endDate: '',
                  status: ''
                });
                setPage(0);
              }}
            >
              <RefreshCw size={16} className="mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas - Memoizadas para evitar recálculos */}
      {statsDisplay}

      {/* Tabela de Atividades - Componente memoizado para performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Atividades dos Usuários</CardTitle>
          <div className="text-sm text-gray-400">
            Exibindo {activities.length} de {totalItems || activities.length} atividades
          </div>
        </CardHeader>
        <CardContent>
          {loading && activities.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-seguranca-yellow" size={24} />
              <span className="ml-2 text-gray-400">Carregando atividades...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-seguranca-graphite z-10">
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activitiesTable}
                  </TableBody>
                </Table>
              </div>
              
              {/* Botão para carregar mais */}
              {activities.length < totalItems && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin mr-2" size={16} />
                        Carregando...
                      </>
                    ) : (
                      <>
                        Carregar Mais ({totalItems - activities.length} restantes)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </StandardLayout>
  );
};

// Componente memoizado para linha da tabela (melhora performance)
const ActivityRow = memo(({ activity }: { activity: ActivityLog }) => {
  const getActionIcon = (action: string) => {
    if (!action) return <Activity size={16} className="text-gray-500" />;
    
    switch (action.toLowerCase()) {
      case 'login': return <Shield size={16} className="text-green-500" />;
      case 'logout': return <Shield size={16} className="text-red-500" />;
      case 'create': return <Database size={16} className="text-blue-500" />;
      case 'update': return <Settings size={16} className="text-yellow-500" />;
      case 'delete': return <AlertTriangle size={16} className="text-red-500" />;
      case 'view': return <Eye size={16} className="text-green-500" />;
      case 'export': return <Download size={16} className="text-purple-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getModuleIcon = (module: string) => {
    if (!module) return <Database size={16} className="text-gray-500" />;
    
    switch (module.toLowerCase()) {
      case 'users': return <Users size={16} className="text-blue-500" />;
      case 'clients': return <Building2 size={16} className="text-green-500" />;
      case 'fleet': return <Truck size={16} className="text-orange-500" />;
      case 'financial': return <DollarSign size={16} className="text-green-500" />;
      case 'payslips': return <FileSpreadsheet size={16} className="text-purple-500" />;
      case 'reports': return <BarChart3 size={16} className="text-indigo-500" />;
      case 'system': return <Settings size={16} className="text-gray-500" />;
      default: return <Database size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="secondary">Desconhecido</Badge>;
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'success') {
      return <Badge variant="default" className="bg-green-600">Sucesso</Badge>;
    } else if (statusLower === 'error') {
      return <Badge variant="destructive">Erro</Badge>;
    } else if (statusLower === 'warning') {
      return <Badge variant="secondary" className="bg-yellow-600">Aviso</Badge>;
    } else {
      return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formattedDate = useMemo(() => {
    try {
      const date = new Date(activity.createdAt);
      return {
        date: date.toLocaleDateString('pt-BR'),
        time: date.toLocaleTimeString('pt-BR')
      };
    } catch {
      return { date: 'Data inválida', time: '' };
    }
  }, [activity.createdAt]);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <User size={16} className="text-blue-500" />
          <span className="font-medium">{activity.username}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {getActionIcon(activity.action)}
          <span>{activity.action}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {getModuleIcon(activity.module)}
          <span>{activity.module}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs truncate" title={activity.details}>
          {activity.details}
        </div>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm">{activity.ipAddress}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{formattedDate.date}</span>
          <span className="text-xs text-gray-400">{formattedDate.time}</span>
        </div>
      </TableCell>
      <TableCell>
        {getStatusBadge(activity.status)}
      </TableCell>
      <TableCell>
        <span className="text-sm">{activity.executionTimeMs}ms</span>
      </TableCell>
    </TableRow>
  );
});

ActivityRow.displayName = 'ActivityRow';

export default ActivityManagement;
