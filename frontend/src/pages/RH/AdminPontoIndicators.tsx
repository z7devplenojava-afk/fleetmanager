import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PontoAdminNav from '@/components/ponto/PontoAdminNav';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  UserCheck,
  UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import timeRecordService from '@/services/timeRecordService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLORS = ['#eab308', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];

const AdminPontoIndicators: React.FC = () => {
  const { toast } = useToast();
  const { empresa } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      setLoading(true);
      const response = await timeRecordService.getIndicators(
        startDate, endDate, departmentFilter || undefined
      );
      if (response.success) {
        setData(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar indicadores:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}min`;
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-seguranca-yellow" />
            <p className="text-seguranca-gray mt-4 text-lg">Calculando indicadores...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  const overtimePieData = [
    { name: 'Com Hora Extra', value: data?.employeesWithOvertime || 0 },
    { name: 'Sem Hora Extra', value: Math.max(0, (data?.totalEmployees || 1) - (data?.employeesWithOvertime || 0)) }
  ];

  const absenteeismPieData = [
    { name: 'Presentes', value: data?.employeesWithRecords || 0 },
    { name: 'Ausentes', value: Math.max(0, (data?.totalEmployees || 1) - (data?.employeesWithRecords || 0)) }
  ];

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation + Header */}
        <PontoAdminNav 
          title="Indicadores de Ponto" 
          subtitle={empresa?.nome ? `${empresa.nome} — ${format(new Date(startDate), "dd/MM/yyyy")} a ${format(new Date(endDate), "dd/MM/yyyy")}` : `${format(new Date(startDate), "dd/MM/yyyy")} a ${format(new Date(endDate), "dd/MM/yyyy")}`}
        />
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={loadIndicators}
            className="border-seguranca-yellow/30 hover:border-seguranca-yellow/50">
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label className="text-seguranca-gray text-xs">Data Início</Label>
                <Input type="date" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-seguranca-black border-seguranca-gray/30 mt-1 w-40" />
              </div>
              <div>
                <Label className="text-seguranca-gray text-xs">Data Fim</Label>
                <Input type="date" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-seguranca-black border-seguranca-gray/30 mt-1 w-40" />
              </div>
              <div>
                <Label className="text-seguranca-gray text-xs">Departamento</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="bg-seguranca-black border-seguranca-gray/30 mt-1 w-44">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={loadIndicators}
                className="bg-seguranca-yellow hover:bg-seguranca-yellow/80 text-seguranca-black font-bold">
                <BarChart3 className="mr-2 h-4 w-4" /> Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-seguranca-gray font-medium">Horas Extras</p>
                  <p className="text-3xl font-bold text-amber-500 mt-1">
                    {formatHours(data?.totalOvertimeHours || 0)}
                  </p>
                  <p className="text-xs text-seguranca-gray mt-1">
                    {data?.employeesWithOvertime || 0} funcionário(s)
                  </p>
                </div>
                <div className="p-3 rounded-full bg-amber-500/20">
                  <TrendingUp className="h-8 w-8 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-seguranca-gray font-medium">Atrasos</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">{data?.latenessCount || 0}</p>
                  <p className="text-xs text-seguranca-gray mt-1">
                    {data?.employeesWithLateness || 0} funcionário(s)
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-500/20">
                  <Clock className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-seguranca-gray font-medium">Absenteísmo</p>
                  <p className="text-3xl font-bold text-purple-500 mt-1">
                    {data?.absenteeismRate || 0}%
                  </p>
                  <p className="text-xs text-seguranca-gray mt-1">Taxa no período</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/20">
                  <AlertTriangle className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-seguranca-gray font-medium">Funcionários</p>
                  <p className="text-3xl font-bold text-blue-500 mt-1">{data?.totalEmployees || 0}</p>
                  <p className="text-xs text-seguranca-gray mt-1">
                    {data?.employeesWithRecords || 0} com registro
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Overtime by Day */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                <TrendingUp className="mr-2 h-5 w-5 text-amber-500" />
                Horas Extras por Dia
              </CardTitle>
              <CardDescription>Total de horas extras registradas por dia no período</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.overtimeByDay?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.overtimeByDay}>
                    <defs>
                      <linearGradient id="overtimeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickFormatter={(v) => format(new Date(v), 'dd/MM')} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelFormatter={(v) => format(new Date(v), 'dd/MM/yyyy')}
                      formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas Extras']}
                    />
                    <Area type="monotone" dataKey="horas" stroke="#eab308" fill="url(#overtimeGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-seguranca-gray">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum dado de horas extras no período</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lateness by Day */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-red-500" />
                Atrasos por Dia
              </CardTitle>
              <CardDescription>Número de atrasos registrados por dia</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.latenessByDay?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.latenessByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickFormatter={(v) => format(new Date(v), 'dd/MM')} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelFormatter={(v) => format(new Date(v), 'dd/MM/yyyy')}
                      formatter={(value: number) => [value, 'Atrasos']}
                    />
                    <Bar dataKey="ocorrencias" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-seguranca-gray">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum atraso registrado no período</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Overtime by Department */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                <BarChart3 className="mr-2 h-5 w-5 text-amber-500" />
                HE por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.overtimeByDepartment?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.overtimeByDepartment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis dataKey="departamento" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value}h`, 'Horas Extras']}
                    />
                    <Bar dataKey="horas" fill="#eab308" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-seguranca-gray">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sem dados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hora Extra Pie */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                <PieChartIcon className="mr-2 h-5 w-5 text-amber-500" />
                Funcionários c/ HE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={overtimePieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {overtimePieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Absenteeism Pie */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                <Users className="mr-2 h-5 w-5 text-purple-500" />
                Presença x Ausência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={absenteeismPieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {absenteeismPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Lateness by Department */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Atrasos por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.latenessByDepartment?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.latenessByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="departamento" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value: number) => [value, 'Ocorrências']}
                  />
                  <Bar dataKey="ocorrencias" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-seguranca-gray">
                <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum atraso registrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm flex-wrap gap-2">
              <span className="text-seguranca-gray flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Período analisado: <strong className="text-seguranca-lightgray ml-1">
                  {format(new Date(startDate), 'dd/MM/yyyy')} a {format(new Date(endDate), 'dd/MM/yyyy')}
                </strong>
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-green-500">
                  <UserCheck className="h-4 w-4 mr-1" /> {data?.employeesWithRecords || 0}
                </span>
                <span className="flex items-center text-red-500">
                  <UserX className="h-4 w-4 mr-1" /> {Math.max(0, (data?.totalEmployees || 0) - (data?.employeesWithRecords || 0))}
                </span>
                {empresa?.nome && (
                  <Badge variant="outline" className="bg-seguranca-yellow/10 text-seguranca-yellow border-seguranca-yellow/20">
                    {empresa.nome}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default AdminPontoIndicators;
