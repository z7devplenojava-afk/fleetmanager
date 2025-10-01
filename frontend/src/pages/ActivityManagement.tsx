import React, { useState, useEffect } from 'react';
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
  const [filters, setFilters] = useState<ActivityFilters>({
    username: '',
    action: '',
    module: '',
    startDate: '',
    endDate: '',
    status: ''
  });

  // Verificar se o usuário é SUPER_ADMIN
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

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Converter "all" para string vazia para a API
      const apiFilters = {
        username: filters.username,
        action: filters.action === 'all' ? '' : filters.action,
        module: filters.module === 'all' ? '' : filters.module,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status === 'all' ? '' : filters.status
      };
      
      const response = await api.get('/activity-logs', { params: apiFilters });
      console.log('🔍 Resposta da API:', response.data);
      console.log('🔍 Primeiro item:', response.data[0]);
      setActivities(response.data);
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
  };

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

  useEffect(() => {
    loadActivities();
  }, []);

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
            <Button onClick={loadActivities} disabled={loading}>
              <Search size={16} className="mr-2" />
              Buscar
            </Button>
            <Button variant="outline" onClick={exportActivities}>
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                username: '',
                action: '',
                module: '',
                startDate: '',
                endDate: '',
                status: ''
              })}
            >
              <RefreshCw size={16} className="mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Atividades</p>
                <p className="text-2xl font-bold text-seguranca-lightgray">{activities.length}</p>
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
                  {new Set(activities.map(a => a.username)).size}
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
                  {activities.filter(a => a.status && a.status.toLowerCase() === 'success').length}
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
                  {activities.filter(a => a.status && a.status.toLowerCase() === 'error').length}
                </p>
              </div>
              <AlertTriangle className="text-red-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades dos Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-seguranca-yellow" size={24} />
              <span className="ml-2 text-gray-400">Carregando atividades...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
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
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
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
                          <span className="text-sm">
                            {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(activity.createdAt).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(activity.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {activity.executionTimeMs}ms
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {activities.length === 0 && (
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
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </StandardLayout>
  );
};

export default ActivityManagement;
