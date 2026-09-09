import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Camera, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Calendar,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface TimeRecord {
  id: string;
  recordDate: string;
  punchTime: string;
  punchType: 'ENTRY' | 'EXIT' | 'LUNCH_START' | 'LUNCH_END';
  location?: string;
  latitude?: number;
  longitude?: number;
  photoBase64?: string;
  observations?: string;
  isManual: boolean;
  createdAt: string;
  status: string;
}

interface TimeBalance {
  totalWorked: string;
  totalExpected: string;
  balance: string;
  overtimeHours: number;
  absentDays: number;
  lateArrivals: number;
  earlyDepartures: number;
  currentMonth: string;
  overtimeValue: number;
  totalOvertimeValue: number;
}

import { useAuth } from '@/contexts/AuthContext';
import { timeRecordService } from '@/services/timeRecordService';

const TimeRecords: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [timeBalance, setTimeBalance] = useState<TimeBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [punching, setPunching] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadTimeRecords();
    loadTimeBalance();
  }, [currentMonth, user?.id]);

  const loadTimeRecords = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await timeRecordService.getEmployeeRecords(user.id);
      const data = response?.content || response || [];
      if (Array.isArray(data)) {
        const mapped: TimeRecord[] = data.map((r: any) => ({
          id: r.id || String(Math.random()),
          recordDate: r.recordedAt ? r.recordedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          punchTime: r.recordedAt ? new Date(r.recordedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '00:00',
          punchType: r.recordType === 'ENTRADA' ? 'ENTRY' : r.recordType === 'SAIDA' ? 'EXIT' : r.recordType === 'SAIDA_ALMOCO' ? 'LUNCH_START' : 'LUNCH_END',
          location: r.location || 'Não informado',
          latitude: r.latitude,
          longitude: r.longitude,
          isManual: Boolean(r.isManual),
          createdAt: r.createdAt || new Date().toISOString(),
          status: r.status || 'CONFIRMED'
        }));
        setTimeRecords(mapped);
      } else {
        setTimeRecords([]);
      }
    } catch (error) {
      console.error('Erro ao carregar registros de ponto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
      setTimeRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeBalance = async () => {
    try {
      setTimeBalance({
        totalWorked: '00:00',
        totalExpected: '176:00',
        balance: '00:00',
        overtimeHours: 0,
        absentDays: 0,
        lateArrivals: 0,
        earlyDepartures: 0,
        currentMonth: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        overtimeValue: 0,
        totalOvertimeValue: 0
      });
    } catch (error) {
      console.error('Erro ao carregar saldo de horas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
      setTimeBalance(null);
    }
  };

  const handleTimePunch = async () => {
    if (!user?.id) return;
    setPunching(true);
    try {
      await timeRecordService.registerTimeRecord({
        employeeId: user.id,
        recordType: 'ENTRADA'
      });
      toast({
        title: 'Sucesso',
        description: 'Ponto registrado com sucesso!',
      });
      loadTimeRecords();
    } catch (error) {
      console.error('Erro ao bater ponto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setPunching(false);
    }
  };

  const getPunchTypeLabel = (type: string) => {
    const labels = {
      'ENTRY': 'Entrada',
      'EXIT': 'Saída',
      'LUNCH_START': 'Início Almoço',
      'LUNCH_END': 'Fim Almoço'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPunchTypeColor = (type: string) => {
    const colors = {
      'ENTRY': 'bg-green-100 text-green-800',
      'EXIT': 'bg-red-100 text-red-800',
      'LUNCH_START': 'bg-yellow-100 text-yellow-800',
      'LUNCH_END': 'bg-blue-100 text-blue-800'
    };
    return colors[type as keyof typeof colors] || 'bg-secondary text-secondary-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ponto Eletrônico</h1>
          <p className="text-muted-foreground">Registre seus pontos e consulte seu saldo de horas</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleTimePunch}
            disabled={punching}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <Clock className="h-4 w-4" />
            <span>{punching ? 'Registrando...' : 'Bater Ponto'}</span>
          </Button>
        </div>
      </div>


      {/* Balance Card */}
      {timeBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-red-500" />
              Saldo de Horas - {timeBalance.currentMonth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Trabalhado</p>
                <p className="text-2xl font-bold text-foreground">{timeBalance.totalWorked}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Esperado</p>
                <p className="text-2xl font-bold text-foreground">{timeBalance.totalExpected}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${timeBalance.balance.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                  {timeBalance.balance}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Horas Extras</p>
                <p className="text-lg font-semibold text-foreground">{timeBalance.overtimeHours}h</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Faltas</p>
                <p className="text-lg font-semibold text-red-600">{timeBalance.absentDays}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Atrasos</p>
                <p className="text-lg font-semibold text-orange-600">{timeBalance.lateArrivals}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Saídas Antecipadas</p>
                <p className="text-lg font-semibold text-orange-600">{timeBalance.earlyDepartures}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Records Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Registros de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeRecords
                  .filter(record => record.recordDate === new Date().toISOString().split('T')[0])
                  .map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-foreground">{record.punchTime}</p>
                          <p className="text-sm text-muted-foreground">{getPunchTypeLabel(record.punchType)}</p>
                        </div>
                        <Badge className={getPunchTypeColor(record.punchType)}>
                          {getPunchTypeLabel(record.punchType)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{record.location}</span>
                      </div>
                    </div>
                  ))}
                {timeRecords.filter(record => record.recordDate === new Date().toISOString().split('T')[0]).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Nenhum registro hoje</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Registros do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeRecords.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium text-foreground">{record.recordDate}</p>
                        <p className="text-sm text-muted-foreground">{record.punchTime} - {getPunchTypeLabel(record.punchType)}</p>
                      </div>
                      <Badge className={getPunchTypeColor(record.punchType)}>
                        {getPunchTypeLabel(record.punchType)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{record.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Histórico Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Funcionalidade de exportação em desenvolvimento</p>
                <p className="text-sm">Consulte o histórico de registros diretamente pelo relatório de espelho de ponto.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeRecords;
