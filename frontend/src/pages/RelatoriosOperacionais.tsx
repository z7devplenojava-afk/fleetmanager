import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3,
  PieChart,
  TrendingUp,
  RefreshCw,
  Building2,
  Users,
  CheckSquare,
  UserCheck,
  Clock
} from 'lucide-react';
import { operacionalService } from '@/services/operacionalService';
import { RelatorioOperacional } from '@/types/operacional';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RelatoriosOperacionais: React.FC = () => {
  const { toast } = useToast();
  const [relatorios, setRelatorios] = useState<RelatorioOperacional[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState<string>('DIARIO');
  const [periodoRelatorio, setPeriodoRelatorio] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [relatoriosData, estatisticasData] = await Promise.all([
        operacionalService.getRelatorios(),
        operacionalService.getEstatisticas()
      ]);
      
      setRelatorios(relatoriosData);
      setEstatisticas(estatisticasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados dos relatórios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGerarRelatorio = async () => {
    if (!periodoRelatorio) {
      toast({
        title: 'Erro',
        description: 'Selecione um período para gerar o relatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGerandoRelatorio(true);
      const novoRelatorio = await operacionalService.gerarRelatorio(tipoRelatorio, periodoRelatorio);
      toast({
        title: 'Sucesso',
        description: 'Relatório gerado com sucesso!'
      });
      loadData();
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório operacional',
        variant: 'destructive'
      });
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const getTipoRelatorioLabel = (tipo: string) => {
    switch (tipo) {
      case 'DIARIO': return 'Relatório Diário';
      case 'SEMANAL': return 'Relatório Semanal';
      case 'MENSAL': return 'Relatório Mensal';
      case 'FERIAS': return 'Relatório de Férias';
      case 'COBERTURAS': return 'Relatório de Coberturas';
      case 'TAREFAS': return 'Relatório de Tarefas';
      default: return tipo;
    }
  };

  const getPeriodoLabel = (periodo: string) => {
    try {
      const data = new Date(periodo);
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return periodo;
    }
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando relatórios...</span>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-seguranca-lightgray">Relatórios Operacionais</h1>
            <p className="text-seguranca-lightgray/70 mt-1">Gere e visualize relatórios operacionais da empresa</p>
          </div>
          <Button 
            onClick={loadData}
            disabled={loading}
            className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-seguranca-black"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Gerar Novo Relatório */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Gerar Novo Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tipo" className="text-seguranca-lightgray">Tipo de Relatório</Label>
                <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="DIARIO" className="text-seguranca-lightgray">Relatório Diário</SelectItem>
                    <SelectItem value="SEMANAL" className="text-seguranca-lightgray">Relatório Semanal</SelectItem>
                    <SelectItem value="MENSAL" className="text-seguranca-lightgray">Relatório Mensal</SelectItem>
                    <SelectItem value="FERIAS" className="text-seguranca-lightgray">Relatório de Férias</SelectItem>
                    <SelectItem value="COBERTURAS" className="text-seguranca-lightgray">Relatório de Coberturas</SelectItem>
                    <SelectItem value="TAREFAS" className="text-seguranca-lightgray">Relatório de Tarefas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="periodo" className="text-seguranca-lightgray">Período</Label>
                <Input
                  id="periodo"
                  type="date"
                  value={periodoRelatorio}
                  onChange={(e) => setPeriodoRelatorio(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleGerarRelatorio}
                  disabled={gerandoRelatorio || !periodoRelatorio}
                  className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-seguranca-black w-full"
                >
                  {gerandoRelatorio ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {estatisticas && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-seguranca-graphite border-gray-700">
              <TabsTrigger value="overview" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black">
                <BarChart3 className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="postos" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black">
                <Building2 className="h-4 w-4 mr-2" />
                Postos
              </TabsTrigger>
              <TabsTrigger value="funcionarios" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black">
                <Users className="h-4 w-4 mr-2" />
                Funcionários
              </TabsTrigger>
              <TabsTrigger value="tarefas" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black">
                <CheckSquare className="h-4 w-4 mr-2" />
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="escalas" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black">
                <Clock className="h-4 w-4 mr-2" />
                Escalas
              </TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total de Postos</CardTitle>
                    <Building2 className="h-4 w-4 text-seguranca-yellow" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-seguranca-lightgray">
                      {Object.values(estatisticas.postosPorTipo).reduce((a: number, b: number) => a + b, 0)}
                    </div>
                    <p className="text-xs text-seguranca-lightgray/70">
                      Postos cadastrados
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total de Funcionários</CardTitle>
                    <Users className="h-4 w-4 text-seguranca-yellow" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-seguranca-lightgray">
                      {Object.values(estatisticas.funcionariosPorStatus).reduce((a: number, b: number) => a + b, 0)}
                    </div>
                    <p className="text-xs text-seguranca-lightgray/70">
                      Funcionários cadastrados
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-seguranca-lightgray">Tarefas Pendentes</CardTitle>
                    <CheckSquare className="h-4 w-4 text-seguranca-yellow" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-seguranca-lightgray">
                      {estatisticas.tarefasPorStatus.AGENDADA || 0}
                    </div>
                    <p className="text-xs text-seguranca-lightgray/70">
                      Aguardando execução
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-seguranca-lightgray">Escalas Ativas</CardTitle>
                    <Clock className="h-4 w-4 text-seguranca-yellow" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-seguranca-lightgray">
                      {estatisticas.escalasPorTipo.ATIVA || 0}
                    </div>
                    <p className="text-xs text-seguranca-lightgray/70">
                      Escalas em funcionamento
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Postos */}
            <TabsContent value="postos" className="space-y-4">
              <Card className="bg-seguranca-graphite border-gray-700">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray">Distribuição por Tipo de Posto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(estatisticas.postosPorTipo).map(([tipo, quantidade]) => (
                      <div key={tipo} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-seguranca-lightgray font-medium">{tipo}</span>
                          <Badge className="bg-seguranca-yellow text-seguranca-black">
                            {quantidade as number}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Funcionários */}
            <TabsContent value="funcionarios" className="space-y-4">
              <Card className="bg-seguranca-graphite border-gray-700">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray">Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(estatisticas.funcionariosPorStatus).map(([status, quantidade]) => (
                      <div key={status} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-seguranca-lightgray font-medium">{status}</span>
                          <Badge className="bg-seguranca-yellow text-seguranca-black">
                            {quantidade as number}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tarefas */}
            <TabsContent value="tarefas" className="space-y-4">
              <Card className="bg-seguranca-graphite border-gray-700">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray">Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(estatisticas.tarefasPorStatus).map(([status, quantidade]) => (
                      <div key={status} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-seguranca-lightgray font-medium">{status}</span>
                          <Badge className="bg-seguranca-yellow text-seguranca-black">
                            {quantidade as number}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Escalas */}
            <TabsContent value="escalas" className="space-y-4">
              <Card className="bg-seguranca-graphite border-gray-700">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray">Distribuição por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(estatisticas.escalasPorTipo).map(([tipo, quantidade]) => (
                      <div key={tipo} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-seguranca-lightgray font-medium">{tipo}</span>
                          <Badge className="bg-seguranca-yellow text-seguranca-black">
                            {quantidade as number}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Lista de Relatórios */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              Relatórios Gerados ({relatorios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorios.map((relatorio) => (
                <div key={relatorio.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-seguranca-yellow mr-2" />
                      <h3 className="font-semibold text-seguranca-lightgray">
                        {getTipoRelatorioLabel(relatorio.tipo)}
                      </h3>
                    </div>
                    <Badge className="bg-seguranca-yellow text-seguranca-black">
                      {getPeriodoLabel(relatorio.periodo)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-sm text-seguranca-lightgray/70">
                      <span className="font-medium">Postos Ativos:</span> {relatorio.dados.postosAtivos}
                    </div>
                    <div className="text-sm text-seguranca-lightgray/70">
                      <span className="font-medium">Funcionários Ativos:</span> {relatorio.dados.funcionariosAtivos}
                    </div>
                    <div className="text-sm text-seguranca-lightgray/70">
                      <span className="font-medium">Férias:</span> {relatorio.dados.funcionariosFerias}
                    </div>
                    <div className="text-sm text-seguranca-lightgray/70">
                      <span className="font-medium">Coberturas:</span> {relatorio.dados.coberturasAtivas}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-sm text-seguranca-lightgray/70">
                      <span className="font-medium">Tarefas Pendentes:</span> {relatorio.dados.tarefasPendentes}
                    </div>
                    <div className="text-sm text-seguranca-lightgray/70">
                      <span className="font-medium">Tarefas Concluídas:</span> {relatorio.dados.tarefasConcluidas}
                    </div>
                    <div className="text-sm text-seguranca-lightgray/70">
                      <span className="font-medium">Funcionários em Folga:</span> {relatorio.dados.funcionariosFolga}
                    </div>
                    <div className="text-sm text-seguranca-lightgray/70">
                      <span className="font-medium">Total de Postos:</span> {relatorio.dados.totalPostos}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-xs text-seguranca-lightgray/50">
                      Gerado em: {format(new Date(relatorio.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {relatorios.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-seguranca-lightgray/30 mx-auto mb-4" />
                <p className="text-seguranca-lightgray/70">Nenhum relatório encontrado</p>
                <p className="text-seguranca-lightgray/50 text-sm mt-1">Gere seu primeiro relatório usando o formulário acima</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default RelatoriosOperacionais;
