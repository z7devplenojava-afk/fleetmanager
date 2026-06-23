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

const EmployeeDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Debug: Verificar se o EmployeeDashboard está carregando
  console.log('🔍 EmployeeDashboard Debug:');
  console.log('- Component loaded');
  console.log('- User:', user);

  // Dados mockados para funcionar offline
  const mockData = {
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
  };

  const handleTimePunch = async () => {
    toast({
      title: 'Informação',
      description: 'Funcionalidade de ponto em desenvolvimento. Backend offline.',
      variant: 'default',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const { profile, timeBalance, vacationBalance, recentPayslips, expiringTrainings, pendingDocuments, unreadNotifications, hasTimePunchToday } = mockData;

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

      {/* Status do Sistema */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              🟡 <strong>Backend Offline:</strong> O servidor está retornando erro 500 para todas as APIs do Portal do Funcionário.
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              📋 <strong>Funcionalidades Disponíveis:</strong> Navegação entre abas, interface do usuário.
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              ⚠️ <strong>Funcionalidades Indisponíveis:</strong> Carregamento de dados, registro de ponto, consultas.
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              🔧 <strong>Ação Necessária:</strong> Verificar os logs do backend e corrigir os erros 500 no EmployeePortalController.
            </p>
          </div>
        </CardContent>
      </Card>

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
                <p className="text-muted-foreground text-center py-4">Nenhum holerite encontrado (Backend offline)</p>
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
                    <p className="font-medium text-foreground">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhuma notificação não lida (Backend offline)</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
