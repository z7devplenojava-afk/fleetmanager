import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PontoAdminNav from '@/components/ponto/PontoAdminNav';
import {
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
  UserX,
  Calendar,
  RefreshCw,
  Loader2,
  Search,
  ChevronRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import timeRecordService, { TimeRecord } from '@/services/timeRecordService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalRegistrosHoje: number;
  registrosPendentes: number;
  aprovadosHoje: number;
  funcionariosComRegistro: number;
  funcionariosSemRegistro: number;
  data: string;
}

const AdminPontoDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user, empresa } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<TimeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('__all__');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, recordsRes] = await Promise.all([
        timeRecordService.getAdminDashboard(),
        timeRecordService.getAdminRecords({         department: departmentFilter === '__all__' ? undefined : departmentFilter })
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (recordsRes.success) setRecentRecords(recordsRes.data);
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        title: 'Erro ao carregar dashboard',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ENTRADA: 'Entrada',
      SAIDA: 'Saída',
      SAIDA_ALMOCO: 'Saída Almoço',
      RETORNO_ALMOCO: 'Retorno Almoço'
    };
    return labels[tipo] || tipo;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-500/10 text-green-500 border-green-500/20',
      PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  const filteredRecords = recentRecords.filter(r =>
    r.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <StandardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-seguranca-yellow" />
              <p className="text-seguranca-gray mt-4">Carregando dashboard...</p>
            </div>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation + Header */}
        <PontoAdminNav 
          title="Dashboard de Ponto Eletrônico" 
          subtitle={empresa?.nome ? `Gestão de ponto - ${empresa.nome}` : 'Gestão de ponto eletrônico'}
        />
        
        <div className="flex items-center gap-3 justify-end">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calendar className="mr-2 h-5 w-5" />
            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Badge>
          <Button
            variant="outline"
            onClick={loadDashboard}
            className="border-seguranca-yellow/30 hover:border-seguranca-yellow/50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-seguranca-gray">Registros Hoje</p>
                  <p className="text-3xl font-bold text-blue-500">{stats?.totalRegistrosHoje || 0}</p>
                </div>
                <Clock className="h-10 w-10 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-seguranca-gray">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-500">{stats?.registrosPendentes || 0}</p>
                </div>
                <AlertCircle className="h-10 w-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-seguranca-gray">Aprovados Hoje</p>
                  <p className="text-3xl font-bold text-green-500">{stats?.aprovadosHoje || 0}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-seguranca-gray">Com Registro</p>
                  <p className="text-3xl font-bold text-emerald-500">{stats?.funcionariosComRegistro || 0}</p>
                </div>
                <UserCheck className="h-10 w-10 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-seguranca-gray">Sem Registro</p>
                  <p className="text-3xl font-bold text-red-500">{stats?.funcionariosSemRegistro || 0}</p>
                </div>
                <UserX className="h-10 w-10 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Button
            onClick={() => navigate('/rh/ponto-admin/pending')}
            className="h-20 bg-yellow-600 hover:bg-yellow-700 text-white text-lg"
          >
            <AlertCircle className="mr-3 h-6 w-6" />
            Aprovações Pendentes ({stats?.registrosPendentes || 0})
            <ChevronRight className="ml-auto h-5 w-5" />
          </Button>

          <Button
            onClick={() => navigate('/rh/ponto-admin/reports')}
            variant="outline"
            className="h-20 border-seguranca-yellow/30 hover:border-seguranca-yellow/50 text-lg"
          >
            <TrendingUp className="mr-3 h-6 w-6 text-seguranca-yellow" />
            Relatórios
            <ChevronRight className="ml-auto h-5 w-5" />
          </Button>

          <Button
            onClick={() => navigate('/rh/ponto-eletronico')}
            variant="outline"
            className="h-20 border-seguranca-gray/30 hover:border-seguranca-yellow/50 text-lg"
          >
            <Clock className="mr-3 h-6 w-6" />
            Meu Ponto
            <ChevronRight className="ml-auto h-5 w-5" />
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-seguranca-gray" />
                  <Input
                    placeholder="Buscar por funcionário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-seguranca-gray/30"
                  />
                </div>
              </div>
              <div className="w-[200px]">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="bg-seguranca-black border-seguranca-gray/30">
                    <SelectValue placeholder="Todos departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos departamentos</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={loadDashboard}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Records */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-seguranca-yellow" />
                Registros Recentes
              </span>
              <Badge variant="outline">{filteredRecords.length} registro(s)</Badge>
            </CardTitle>
            <CardDescription>
              Últimos registros de ponto. Clique em "Aprovações Pendentes" para gerenciar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-seguranca-gray">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-seguranca-gray/20">
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Funcionário</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Data/Hora</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Localização</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Departamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.slice(0, 20).map((record) => (
                      <tr key={record.id} className="border-b border-seguranca-gray/10 hover:bg-seguranca-gray/5">
                        <td className="py-3 px-4 text-seguranca-lightgray font-medium">
                          {record.employee?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {getTipoLabel(record.recordType)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-seguranca-lightgray">
                          {new Date(record.recordedAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-seguranca-gray text-xs">
                          {record.location || record.latitude ? (
                            <span>
                              {record.latitude?.toFixed(4)}, {record.longitude?.toFixed(4)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(record.status)}`}>
                            {record.status === 'APPROVED' ? 'Aprovado' :
                             record.status === 'PENDING' ? 'Pendente' : 'Rejeitado'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-seguranca-gray">
                          {record.employee?.department || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empresa info */}
        {empresa && (
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-seguranca-gray flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Empresa ativa: <strong className="text-seguranca-lightgray ml-1">{empresa.nome}</strong>
                </span>
                <Badge variant="outline" className="bg-seguranca-yellow/10 text-seguranca-yellow border-seguranca-yellow/20">
                  Multiempresa
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StandardLayout>
  );
};

export default AdminPontoDashboard;
