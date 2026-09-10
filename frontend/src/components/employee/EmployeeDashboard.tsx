import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  FileText, 
  BookOpen, 
  Calendar, 
  Bell,
  TrendingUp,
  CheckCircle,
  User,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface DashboardData {
  profile: any;
  timeBalance: any;
  vacationBalance: any;
  recentPayslips: any[];
  expiringTrainings: any[];
  pendingDocuments: any[];
  unreadNotifications: any[];
  hasTimePunchToday: boolean;
}

const EmployeeDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [punching, setPunching] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employee-portal/dashboard');
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      // Fallback para dados mockados se backend falhar
      setDashboardData({
        profile: {
          name: user?.name || 'Funcionário',
          position: 'Cargo',
          department: 'Departamento',
          admissionDate: '2024-01-01'
        },
        timeBalance: {
          balance: '00:00',
          overtimeHours: 0,
          absentDays: 0
        },
        vacationBalance: {
          availableDays: 0,
          usedDays: 0,
          daysInProgress: 0
        },
        recentPayslips: [],
        expiringTrainings: [],
        pendingDocuments: [],
        unreadNotifications: [],
        hasTimePunchToday: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimePunch = async () => {
    setPunching(true);
    try {
      await api.post('/employee-portal/time-records/punch', {
        punchType: 'ENTRADA',
        latitude: null,
        longitude: null,
        photoBase64: null
      });
      toast({
        title: 'Sucesso',
        description: 'Ponto registrado com sucesso!',
      });
      loadDashboard(); // Reload to update status
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o ponto.',
        variant: 'destructive',
      });
    } finally {
      setPunching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Não foi possível carregar o dashboard
      </div>
    );
  }

  const { profile, timeBalance, vacationBalance, recentPayslips, expiringTrainings, pendingDocuments, unreadNotifications, hasTimePunchToday } = dashboardData;

  const formatDuration = (duration: any) => {
    if (!duration) return '00:00';
    if (typeof duration === 'string') return duration;
    const hours = Math.floor((duration.seconds || 0) / 3600);
    const minutes = Math.floor(((duration.seconds || 0) % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo, {profile?.name || user?.name}!</h1>
          <p className="text-muted-foreground">{profile?.position || 'Cargo'} • {profile?.department || 'Departamento'}</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleTimePunch}
            disabled={hasTimePunchToday || punching}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Clock className="h-4 w-4" />
            <span>{punching ? 'Registrando...' : hasTimePunchToday ? 'Ponto já registrado' : 'Bater ponto'}</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo de Horas</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatDuration(timeBalance?.balance)}</div>
            <p className="text-xs text-muted-foreground">
              {timeBalance?.overtimeHours || 0}h extras • {timeBalance?.absentDays || 0} faltas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dias de Férias</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vacationBalance?.availableDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              {vacationBalance?.usedDays || 0} usados • {vacationBalance?.daysInProgress || 0} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Treinamentos a Vencer</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringTrainings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Próximos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadNotifications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-muted-foreground">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Holerites Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayslips && recentPayslips.length > 0 ? (
                recentPayslips.map((payslip: any) => (
                  <div key={payslip.id} className="flex justify-between items-center p-3 border rounded border-border">
                    <div>
                      <p className="font-medium text-foreground">{payslip.month}/{payslip.year}</p>
                      <p className="text-sm text-muted-foreground">Salário Líquido: R$ {(payslip.netValue || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-primary text-primary-foreground">
                        Disponível
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum holerite encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-muted-foreground">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Notificações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadNotifications && unreadNotifications.length > 0 ? (
                unreadNotifications.slice(0, 5).map((notification: any) => (
                  <div key={notification.id} className="p-3 border rounded border-border">
                    <p className="font-medium text-foreground">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhuma notificação não lida</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
