import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  FileText, 
  BookOpen, 
  Calendar, 
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { timeRecordService } from '@/services/timeRecordService';
import { employeeService } from '@/services/employeeService';
import { notificationService } from '@/services/notificationService';

const EmployeeDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    profile: {
      name: user?.name || 'Funcionário',
      position: 'Não informado',
      department: 'Geral',
      admissionDate: '-'
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
    recentPayslips: [] as any[],
    expiringTrainings: [] as any[],
    pendingDocuments: [] as any[],
    unreadNotifications: [] as any[],
    hasTimePunchToday: false
  });

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const todayRecords = await timeRecordService.getTodayRecords(user.id).catch(() => []);
        const notifications = await notificationService.getNotifications().catch(() => []);

        setDashboardData(prev => ({
          ...prev,
          profile: {
            name: user.name || 'Funcionário',
            position: (user as any)?.role || 'Funcionário',
            department: (user as any)?.department || 'Geral',
            admissionDate: '-'
          },
          hasTimePunchToday: Array.isArray(todayRecords) && todayRecords.length > 0,
          unreadNotifications: Array.isArray(notifications) ? notifications.filter((n: any) => !n.lida) : []
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimePunch = async () => {
    if (!user?.id) return;
    try {
      await timeRecordService.registerTimeRecord({
        employeeId: user.id,
        recordType: 'ENTRADA'
      });
      toast({
        title: 'Sucesso',
        description: 'Ponto registrado com sucesso!',
      });
      loadDashboardData();
    } catch (error) {
      console.error('Erro ao bater ponto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { profile, timeBalance, vacationBalance, recentPayslips, expiringTrainings, unreadNotifications, hasTimePunchToday } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo, {profile.name}!</h1>
          <p className="text-muted-foreground">{profile.position} • {profile.department}</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleTimePunch}
            disabled={hasTimePunchToday}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Clock className="h-4 w-4" />
            <span>{hasTimePunchToday ? 'Ponto já registrado' : 'Bater ponto'}</span>
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
            <div className="text-2xl font-bold text-foreground">{timeBalance.balance}</div>
            <p className="text-xs text-muted-foreground">
              {timeBalance.overtimeHours}h extras • {timeBalance.absentDays} faltas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dias de Férias</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vacationBalance.availableDays}</div>
            <p className="text-xs text-muted-foreground">
              {vacationBalance.usedDays} usados • {vacationBalance.daysInProgress} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Treinamentos a Vencer</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringTrainings.length}</div>
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
            <div className="text-2xl font-bold text-red-600">{unreadNotifications.length}</div>
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
              {recentPayslips.length > 0 ? (
                recentPayslips.map((payslip: any) => (
                  <div key={payslip.id} className="flex justify-between items-center p-3 border rounded border-border">
                    <div>
                      <p className="font-medium text-foreground">{payslip.referenceMonth}</p>
                      <p className="text-sm text-muted-foreground">Salário Líquido: R$ {payslip.netSalary.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={payslip.status === 'PAID' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}>
                        {payslip.status === 'PAID' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum holerite recente encontrado</p>
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
              {unreadNotifications.length > 0 ? (
                unreadNotifications.slice(0, 5).map((notification: any) => (
                  <div key={notification.id} className="p-3 border rounded border-border">
                    <p className="font-medium text-foreground">{notification.titulo || notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.descricao || notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp ? new Date(notification.timestamp).toLocaleDateString('pt-BR') : ''}
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
