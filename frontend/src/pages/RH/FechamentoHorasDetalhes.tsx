import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { payrollClosureService, PayrollClosure, PayrollItem } from '@/services/payrollClosureService';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const FechamentoHorasDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [closure, setClosure] = useState<PayrollClosure | null>(null);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [closureRes, itemsRes, summaryRes] = await Promise.all([
        payrollClosureService.getClosureById(id),
        payrollClosureService.getItemsByClosure(id),
        payrollClosureService.getClosureSummary(id),
      ]);

      setClosure(closureRes.data || closureRes);
      setItems((itemsRes.data || itemsRes) as PayrollItem[]);
      setSummary(summaryRes.data || summaryRes);
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

  const handleRegenerateItems = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      await payrollClosureService.regenerateItems(id);
      toast({
        title: 'Sucesso',
        description: 'Itens regenerados com sucesso',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao regenerar itens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  if (loading && !closure) {
    return (
      <StandardLayout>
        <div className="container mx-auto p-6">Carregando...</div>
      </StandardLayout>
    );
  }

  if (!closure) {
    return (
      <StandardLayout>
        <div className="container mx-auto p-6">
          <Alert>
            <AlertDescription>Fechamento não encontrado</AlertDescription>
          </Alert>
        </div>
      </StandardLayout>
    );
  }

  const earningsItems = items.filter(item => item.category === 'EARNINGS');
  const deductionsItems = items.filter(item => item.category === 'DEDUCTIONS');

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/rh/fechamento-horas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Fechamento</h1>
            <p className="text-muted-foreground mt-1">
              Período: {closure.startDate} a {closure.endDate}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRegenerateItems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Regenerar Itens
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Horas Trabalhadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(closure.totalHoursWorked || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {closure.workedDays} dias trabalhados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Horas Extras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours((closure.overtime50 || 0) + (closure.overtime100 || 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(closure.overtime50 || 0) > 0 && `${formatHours(closure.overtime50)} (+50%)`}
              {(closure.overtime100 || 0) > 0 && ` ${formatHours(closure.overtime100)} (+100%)`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Proventos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary ? formatCurrency(summary.totalEarnings || 0) : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Líquido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.netAmount || 0) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="items">Itens de Folha</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Fechamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={closure.status === 'CLOSED' ? 'default' : 'secondary'}>
                    {closure.status === 'CLOSED' ? 'Finalizado' : 'Rascunho'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Normais</p>
                  <p className="font-semibold">{formatHours(closure.regularHours || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adicional Noturno</p>
                  <p className="font-semibold">{formatHours(closure.nightShiftHours || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faltas</p>
                  <p className="font-semibold text-red-600">
                    {closure.totalAbsencesDays || 0} dias
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atrasos</p>
                  <p className="font-semibold">{closure.totalDelaysMinutes || 0} min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dias Esperados</p>
                  <p className="font-semibold">{closure.expectedDays || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proventos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Valor Unitário</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earningsItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum item de provento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    earningsItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.hours ? formatHours(item.hours) : '-'}</TableCell>
                        <TableCell>
                          {item.unitValue ? formatCurrency(item.unitValue) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Descontos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Valor Unitário</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductionsItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum desconto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    deductionsItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.hours ? formatHours(item.hours) : '-'}</TableCell>
                        <TableCell>
                          {item.unitValue ? formatCurrency(item.unitValue) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {formatCurrency(Math.abs(item.amount))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {summary && (
            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total de Proventos:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(summary.totalEarnings || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Descontos:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(Math.abs(summary.totalDeductions || 0))}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Valor Líquido:</span>
                    <span>{formatCurrency(summary.netAmount || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalhadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Métricas detalhadas em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </StandardLayout>
  );
};

export default FechamentoHorasDetalhes;





