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

const TimeRecords: React.FC = () => {
  const { toast } = useToast();
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [timeBalance, setTimeBalance] = useState<TimeBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [punching, setPunching] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  // Dados mockados para funcionar offline
  const mockTimeRecords: TimeRecord[] = [
    {
      id: '1',
      recordDate: new Date().toISOString().split('T')[0],
      punchTime: '08:00',
      punchType: 'ENTRY',
      location: 'Sede Matriz',
      latitude: -23.5505,
      longitude: -46.6333,
      isManual: false,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED'
    },
    {
      id: '2',
      recordDate: new Date().toISOString().split('T')[0],
      punchTime: '12:00',
      punchType: 'LUNCH_START',
      location: 'Sede Matriz',
      latitude: -23.5505,
      longitude: -46.6333,
      isManual: false,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED'
    }
  ];

  const mockTimeBalance: TimeBalance = {
    totalWorked: '160:00',
    totalExpected: '176:00',
    balance: '-16:00',
    overtimeHours: 0,
    absentDays: 2,
    lateArrivals: 3,
    earlyDepartures: 1,
    currentMonth: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    overtimeValue: 0,
    totalOvertimeValue: 0
  };

  useEffect(() => {
    loadTimeRecords();
    loadTimeBalance();
  }, [currentMonth]);

  const loadTimeRecords = async () => {
    setLoading(true);
    try {
      // Simulação de carregamento
      setTimeout(() => {
        setTimeRecords(mockTimeRecords);
        setLoading(false);
      }, 500);
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Backend offline - exibindo dados mockados',
        variant: 'default',
      });
      setTimeRecords(mockTimeRecords);
      setLoading(false);
    }
  };

  const loadTimeBalance = async () => {
    try {
      setTimeBalance(mockTimeBalance);
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Backend offline - exibindo dados mockados',
        variant: 'default',
      });
      setTimeBalance(mockTimeBalance);
    }
  };

  const handleTimePunch = async () => {
    setPunching(true);
    try {
      // Obter localização
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newRecord: TimeRecord = {
              id: Date.now().toString(),
              recordDate: new Date().toISOString().split('T')[0],
              punchTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              punchType: 'ENTRY', // Isso deveria ser dinâmico
              location: 'Sede Matriz',
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              isManual: false,
              createdAt: new Date().toISOString(),
              status: 'PENDING'
            };
            
            setTimeRecords([newRecord, ...timeRecords]);
            
            toast({
              title: 'Sucesso',
              description: 'Ponto registrado com sucesso (Mock)',
            });
          },
          (error) => {
            toast({
              title: 'Erro',
              description: 'Não foi possível obter sua localização',
              variant: 'destructive',
            });
          }
        );
      }
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Funcionalidade simulada - Backend offline',
        variant: 'default',
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

      {/* Status do Sistema */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">
            🟡 <strong>Backend Offline:</strong> Funcionalidade simulada com dados mockados. Quando o backend estiver online, os registros serão sincronizados.
          </p>
        </CardContent>
      </Card>

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
                <p className="text-sm">Backend offline - dados mockados</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeRecords;
