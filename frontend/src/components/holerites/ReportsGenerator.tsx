import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Users
} from 'lucide-react';

interface ReportConfig {
  type: 'envios' | 'funcionarios' | 'performance' | 'custom';
  format: 'pdf' | 'excel' | 'csv';
  dateFrom: Date | null;
  dateTo: Date | null;
  filters: {
    status: string[];
    canal: string[];
    funcionarios: string[];
  };
  columns: string[];
  groupBy: string;
  includeCharts: boolean;
}

const ReportsGenerator: React.FC = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'envios',
    format: 'pdf',
    dateFrom: null,
    dateTo: null,
    filters: {
      status: [],
      canal: [],
      funcionarios: [],
    },
    columns: ['nome', 'email', 'status', 'data'],
    groupBy: 'data',
    includeCharts: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: 'envios', label: 'Relatório de Envios', icon: FileText },
    { value: 'funcionarios', label: 'Relatório de Funcionários', icon: Users },
    { value: 'performance', label: 'Relatório de Performance', icon: TrendingUp },
    { value: 'custom', label: 'Relatório Personalizado', icon: BarChart3 },
  ];

  const availableColumns = [
    { value: 'nome', label: 'Nome' },
    { value: 'cpf', label: 'CPF' },
    { value: 'email', label: 'Email' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'status', label: 'Status' },
    { value: 'data', label: 'Data' },
    { value: 'canal', label: 'Canal' },
    { value: 'tempo_envio', label: 'Tempo de Envio' },
    { value: 'erro', label: 'Mensagem de Erro' },
  ];

  const groupByOptions = [
    { value: 'data', label: 'Data' },
    { value: 'status', label: 'Status' },
    { value: 'canal', label: 'Canal' },
    { value: 'funcionario', label: 'Funcionário' },
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aqui você faria a chamada real para a API
      console.log('Gerando relatório:', reportConfig);
      
      // Simular download
      const link = document.createElement('a');
      link.href = '#';
      link.download = `relatorio_${reportConfig.type}_${new Date().toISOString().split('T')[0]}.${reportConfig.format}`;
      link.click();
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleColumnToggle = (column: string) => {
    const newColumns = reportConfig.columns.includes(column)
      ? reportConfig.columns.filter(c => c !== column)
      : [...reportConfig.columns, column];
    
    setReportConfig(prev => ({ ...prev, columns: newColumns }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerador de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de Relatório */}
          <div className="space-y-2">
            <Label>Tipo de Relatório</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-colors ${
                      reportConfig.type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setReportConfig(prev => ({ ...prev, type: type.value as any }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Configurações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select 
                value={reportConfig.format} 
                onValueChange={(value: 'pdf' | 'excel' | 'csv') => 
                  setReportConfig(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={reportConfig.dateFrom?.toISOString().split('T')[0] || ''}
                onChange={(e) => setReportConfig(prev => ({ 
                  ...prev, 
                  dateFrom: e.target.value ? new Date(e.target.value) : null 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={reportConfig.dateTo?.toISOString().split('T')[0] || ''}
                onChange={(e) => setReportConfig(prev => ({ 
                  ...prev, 
                  dateTo: e.target.value ? new Date(e.target.value) : null 
                }))}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  onValueChange={(value) => {
                    const newStatus = reportConfig.filters.status.includes(value)
                      ? reportConfig.filters.status.filter(s => s !== value)
                      : [...reportConfig.filters.status, value];
                    setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, status: newStatus }
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sucesso">Sucesso</SelectItem>
                    <SelectItem value="falha">Falha</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Canal</Label>
                <Select 
                  onValueChange={(value) => {
                    const newCanal = reportConfig.filters.canal.includes(value)
                      ? reportConfig.filters.canal.filter(c => c !== value)
                      : [...reportConfig.filters.canal, value];
                    setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, canal: newCanal }
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Agrupar por</Label>
                <Select 
                  value={reportConfig.groupBy}
                  onValueChange={(value) => setReportConfig(prev => ({ ...prev, groupBy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupByOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Colunas */}
          <div className="space-y-4">
            <Label>Colunas do Relatório</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableColumns.map((column) => (
                <div key={column.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.value}
                    checked={reportConfig.columns.includes(column.value)}
                    onCheckedChange={() => handleColumnToggle(column.value)}
                  />
                  <Label htmlFor={column.value} className="text-sm">
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Opções Adicionais */}
          <div className="space-y-4">
            <Label>Opções Adicionais</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={reportConfig.includeCharts}
                onCheckedChange={(checked) => 
                  setReportConfig(prev => ({ ...prev, includeCharts: checked as boolean }))
                }
              />
              <Label htmlFor="includeCharts">Incluir gráficos</Label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Gerar Relatório
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setReportConfig({
                  type: 'envios',
                  format: 'pdf',
                  dateFrom: null,
                  dateTo: null,
                  filters: { status: [], canal: [], funcionarios: [] },
                  columns: ['nome', 'email', 'status', 'data'],
                  groupBy: 'data',
                  includeCharts: true,
                });
              }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Pré-definidos */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Pré-definidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                setReportConfig({
                  type: 'envios',
                  format: 'pdf',
                  dateFrom: lastMonth,
                  dateTo: today,
                  filters: { status: [], canal: [], funcionarios: [] },
                  columns: ['nome', 'email', 'status', 'data', 'canal'],
                  groupBy: 'data',
                  includeCharts: true,
                });
              }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Relatório Mensal</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Envios dos últimos 30 dias
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => {
                setReportConfig({
                  type: 'performance',
                  format: 'excel',
                  dateFrom: null,
                  dateTo: null,
                  filters: { status: ['sucesso', 'falha'], canal: [], funcionarios: [] },
                  columns: ['nome', 'status', 'tempo_envio', 'erro'],
                  groupBy: 'status',
                  includeCharts: true,
                });
              }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Relatório de Performance</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Taxa de sucesso e tempo médio
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => {
                setReportConfig({
                  type: 'funcionarios',
                  format: 'csv',
                  dateFrom: null,
                  dateTo: null,
                  filters: { status: [], canal: [], funcionarios: [] },
                  columns: ['nome', 'cpf', 'email', 'telefone'],
                  groupBy: 'funcionario',
                  includeCharts: false,
                });
              }}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Lista de Funcionários</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Dados completos dos funcionários
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsGenerator; 