import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  Clock, 
  Upload, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { payrollClosureService, PayrollClosure, PayPeriod } from '@/services/payrollClosureService';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { timeSheetService } from '@/services/timeSheetService';

const FechamentoHoras: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [closures, setClosures] = useState<PayrollClosure[]>([]);
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [showCreatePeriodDialog, setShowCreatePeriodDialog] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodStartDate, setNewPeriodStartDate] = useState('');
  const [newPeriodEndDate, setNewPeriodEndDate] = useState('');
  const [newPeriodDescription, setNewPeriodDescription] = useState('');

  const [bankHoursSummary, setBankHoursSummary] = useState<{
    totalEmployees: number;
    totalBalance: number;
    positiveBalance: number;
    negativeBalance: number;
  } | null>(null);
  const [bankHoursLoading, setBankHoursLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadBankHours();
  }, [selectedYear, selectedMonth]);

  const loadBankHours = async () => {
    try {
      setBankHoursLoading(true);
      const response = await api.get('/api/bank-hours/expiring?daysAhead=30');
      const items: any[] = response.data?.data || [];

      const totalEmployees = items.length;
      const totalBalance = items.reduce((sum, item) => sum + (item.balanceHours || 0), 0);
      const positiveBalance = items.filter(i => (i.balanceHours || 0) > 0).length;
      const negativeBalance = items.filter(i => (i.balanceHours || 0) < 0).length;

      setBankHoursSummary({
        totalEmployees,
        totalBalance,
        positiveBalance,
        negativeBalance,
      });
    } catch (error) {
      console.error('Erro ao carregar banco de horas:', error);
      setBankHoursSummary(null);
    } finally {
      setBankHoursLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [closuresRes, periodsRes] = await Promise.all([
        payrollClosureService.getClosures({ month: selectedMonth, year: selectedYear }),
        payrollClosureService.getPayPeriods({ year: selectedYear })
      ]);
      
      setClosures(closuresRes.data || closuresRes || []);
      setPayPeriods(periodsRes.data || periodsRes || []);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClosure = async (employeeId?: string) => {
    try {
      setLoading(true);
      if (employeeId) {
        await payrollClosureService.generateClosure(employeeId, selectedMonth, selectedYear);
      } else {
        await payrollClosureService.generateBatchClosures(selectedMonth, selectedYear);
      }
      toast({
        title: 'Sucesso',
        description: 'Fechamento gerado com sucesso',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao gerar fechamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseClosure = async (id: string) => {
    try {
      setLoading(true);
      await payrollClosureService.closeClosure(id);
      toast({
        title: 'Sucesso',
        description: 'Fechamento finalizado com sucesso',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao finalizar fechamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTimeSheet = async (employeeId: string) => {
    try {
      const blob = await timeSheetService.downloadTimeSheet(employeeId, selectedYear, selectedMonth);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const monthLabel = months.find(m => m.value === selectedMonth)?.label || selectedMonth.toString();
      link.download = `folha-ponto-${employeeId}-${monthLabel}-${selectedYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erro ao baixar folha de ponto:', error);
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Erro ao gerar/baixar folha de ponto',
        variant: 'destructive',
      });
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  const handleCreateMonthlyPeriod = async (year: number, month: number) => {
    try {
      setLoading(true);
      await payrollClosureService.getMonthlyPeriod(year, month);
      toast({
        title: 'Sucesso',
        description: 'Período mensal criado/recuperado com sucesso',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao criar período mensal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomPeriod = async () => {
    if (!newPeriodName || !newPeriodStartDate || !newPeriodEndDate) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await payrollClosureService.createCustomPeriod({
        name: newPeriodName,
        startDate: newPeriodStartDate,
        endDate: newPeriodEndDate,
        description: newPeriodDescription || undefined,
      });
      toast({
        title: 'Sucesso',
        description: 'Período customizado criado com sucesso',
      });
      setShowCreatePeriodDialog(false);
      setNewPeriodName('');
      setNewPeriodStartDate('');
      setNewPeriodEndDate('');
      setNewPeriodDescription('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao criar período customizado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClosePeriod = async (id: string) => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não identificado',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await payrollClosureService.closePeriod(id, user.id);
      toast({
        title: 'Sucesso',
        description: 'Período fechado com sucesso',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao fechar período',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fechamento Mensal de Horas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie fechamentos de ponto e gere itens de folha
          </p>
        </div>
        <Button onClick={() => navigate('/rh/fechamento-horas/importar')}>
          <Upload className="mr-2 h-4 w-4" />
          Importar Batidas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o período para visualizar fechamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                min={2020}
                max={2100}
              />
            </div>
            <div>
              <Label htmlFor="month">Mês</Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="closures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="closures">Fechamentos</TabsTrigger>
          <TabsTrigger value="periods">Períodos</TabsTrigger>
          <TabsTrigger value="bank-hours">Banco de Horas</TabsTrigger>
        </TabsList>

        <TabsContent value="closures" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fechamentos do Período</CardTitle>
                <CardDescription>
                  {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </CardDescription>
              </div>
              <Button onClick={() => handleGenerateClosure()} disabled={loading}>
                Gerar Todos
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : closures.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum fechamento encontrado para este período.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Horas Trabalhadas</TableHead>
                      <TableHead>Horas Extras</TableHead>
                      <TableHead>Faltas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closures.map((closure) => (
                      <TableRow key={closure.id}>
                        <TableCell className="font-medium">
                          {closure.employeeName || closure.employeeId}
                        </TableCell>
                        <TableCell>
                          {closure.startDate} a {closure.endDate}
                        </TableCell>
                        <TableCell>{formatHours(closure.totalHoursWorked || 0)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {closure.overtime50 > 0 && (
                              <Badge variant="outline">+50%: {formatHours(closure.overtime50)}</Badge>
                            )}
                            {closure.overtime100 > 0 && (
                              <Badge variant="outline">+100%: {formatHours(closure.overtime100)}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {closure.totalAbsencesDays > 0 && (
                            <Badge variant="destructive">{closure.totalAbsencesDays} dias</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={closure.status === 'CLOSED' ? 'default' : 'secondary'}>
                            {closure.status === 'CLOSED' ? 'Finalizado' : 'Rascunho'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/rh/fechamento-horas/${closure.id}`)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadTimeSheet(closure.employeeId)}
                              title="Baixar folha de ponto (Excel)"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {closure.status === 'DRAFT' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCloseClosure(closure.id)}
                              >
                                Finalizar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Períodos de Fechamento</CardTitle>
                <CardDescription>Gerencie períodos customizados para fechamento</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const year = selectedYear;
                    const month = selectedMonth;
                    handleCreateMonthlyPeriod(year, month);
                  }}
                  disabled={loading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Criar Mensal
                </Button>
                <Button
                  onClick={() => setShowCreatePeriodDialog(true)}
                  disabled={loading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Criar Customizado
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : payPeriods.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum período encontrado para {selectedYear}.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payPeriods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell className="font-medium">{period.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {period.type === 'MONTHLY' && 'Mensal'}
                            {period.type === 'BIWEEKLY' && 'Quinzenal'}
                            {period.type === 'WEEKLY' && 'Semanal'}
                            {period.type === 'CUSTOM' && 'Customizado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(period.startDate).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {new Date(period.endDate).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={period.isClosed ? 'default' : 'secondary'}>
                            {period.isClosed ? 'Fechado' : 'Aberto'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!period.isClosed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClosePeriod(period.id)}
                                disabled={loading}
                              >
                                Fechar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-hours" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Banco de Horas</CardTitle>
                <CardDescription>Visão geral dos saldos de banco de horas (próximos 30 dias)</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadBankHours} disabled={bankHoursLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${bankHoursLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {bankHoursLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando banco de horas...</div>
              ) : !bankHoursSummary ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Não foi possível carregar os dados de banco de horas ou não há registros próximos ao vencimento.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-seguranca-black border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-300">Funcionários com Banco de Horas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-seguranca-lightgray">
                        {bankHoursSummary.totalEmployees}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Com lançamentos recentes</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-seguranca-black border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-300">Saldo Total (h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-seguranca-lightgray">
                        {bankHoursSummary.totalBalance.toFixed(2).replace('.', ',')}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Soma de todos os saldos</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-seguranca-black border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-300">Saldos Positivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-400">
                        {bankHoursSummary.positiveBalance}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Funcionários com horas a compensar</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-seguranca-black border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-300">Saldos Negativos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-400">
                        {bankHoursSummary.negativeBalance}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Funcionários devendo horas</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para criar período customizado */}
      <Dialog open={showCreatePeriodDialog} onOpenChange={setShowCreatePeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Período Customizado</DialogTitle>
            <DialogDescription>
              Defina um período personalizado para fechamento de horas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="period-name">Nome do Período *</Label>
              <Input
                id="period-name"
                value={newPeriodName}
                onChange={(e) => setNewPeriodName(e.target.value)}
                placeholder="Ex: Período Especial - Dezembro 2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="period-start">Data de Início *</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={newPeriodStartDate}
                  onChange={(e) => setNewPeriodStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="period-end">Data de Fim *</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={newPeriodEndDate}
                  onChange={(e) => setNewPeriodEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="period-description">Descrição (opcional)</Label>
              <Input
                id="period-description"
                value={newPeriodDescription}
                onChange={(e) => setNewPeriodDescription(e.target.value)}
                placeholder="Descrição do período..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePeriodDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCustomPeriod} disabled={loading}>
              Criar Período
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </StandardLayout>
  );
};

export default FechamentoHoras;





