import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { stockService } from '@/services/stockService';
import { ReportGenerator, ReportData } from '@/utils/reportGenerator';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  Download,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface StockReport {
  id: string;
  productName: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  averageConsumption: number;
  turnoverRate: number;
  lastMovementDate: string;
  totalValue: number;
  status: 'NORMAL' | 'LOW' | 'OUT' | 'OVER';
}

const StockReportsContent: React.FC = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<StockReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('low-stock');
  const [dateRange, setDateRange] = useState('30');
  
  // Estatísticas
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    overStockProducts: 0,
    totalValue: 0,
    averageTurnover: 0,
  });

  useEffect(() => {
    loadReports();
    loadStats();
  }, [reportType, dateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      const { stockService } = await import('@/services/stockService');
      
      let reportData;
      let itemsToProcess = [];
      
      switch (reportType) {
        case 'low-stock':
          reportData = await stockService.getStockReport();
          itemsToProcess = reportData.lowStockItems || [];
          break;
        case 'out-of-stock':
          reportData = await stockService.getStockReport();
          itemsToProcess = reportData.outOfStockItems || [];
          break;
        case 'over-stock':
        case 'turnover':
        case 'value':
        case 'movements':
          const allItems = await stockService.getAllItems();
          itemsToProcess = allItems || [];
          break;
        default:
          reportData = await stockService.getStockReport();
          itemsToProcess = reportData.lowStockItems || [];
      }
      
      const formattedReports: StockReport[] = itemsToProcess.map((item: any) => ({
        id: item.id,
        productName: item.name,
        category: item.category,
        currentStock: item.currentQuantity,
        minimumStock: item.minimumQuantity,
        maximumStock: item.maximumQuantity || 0,
        averageConsumption: item.averageConsumption || 0,
        turnoverRate: item.turnoverRate || 0,
        lastMovementDate: item.lastMovementDate || new Date().toISOString(),
        totalValue: (item.currentQuantity || 0) * (item.unitPrice || 0),
        status: item.currentQuantity <= item.minimumQuantity ? 'LOW' : 
               item.currentQuantity === 0 ? 'OUT' : 
               item.currentQuantity > (item.maximumQuantity || 999999) ? 'OVER' : 'NORMAL'
      }));
      
      let filteredReports = formattedReports;
      switch (reportType) {
        case 'over-stock':
          filteredReports = formattedReports.filter(r => r.status === 'OVER');
          break;
        case 'turnover':
          filteredReports = formattedReports.sort((a, b) => b.turnoverRate - a.turnoverRate);
          break;
        case 'value':
          filteredReports = formattedReports.sort((a, b) => b.totalValue - a.totalValue);
          break;
      }
      
      setReports(filteredReports);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios do banco de dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { stockService } = await import('@/services/stockService');
      const reportData = await stockService.getStockReport();
      
      setStats({
        totalProducts: reportData.totalItems || 0,
        lowStockProducts: reportData.lowStockCount || 0,
        outOfStockProducts: reportData.outOfStockCount || 0,
        overStockProducts: 0,
        totalValue: reportData.totalValue || 0,
        averageTurnover: 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStats({
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        overStockProducts: 0,
        totalValue: 0,
        averageTurnover: 0,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LOW': return 'bg-red-100 text-red-800';
      case 'OUT': return 'bg-red-100 text-red-800';
      case 'OVER': return 'bg-yellow-100 text-yellow-800';
      case 'NORMAL': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'LOW': return 'Estoque Baixo';
      case 'OUT': return 'Sem Estoque';
      case 'OVER': return 'Estoque Alto';
      case 'NORMAL': return 'Normal';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const exportReport = async () => {
    try {
      if (reports.length === 0) {
        toast({
          title: "Aviso",
          description: "Não há dados para exportar.",
          variant: "destructive",
        });
        return;
      }

      const reportTitle = 
        reportType === 'low-stock' ? 'Relatório de Produtos com Estoque Baixo' :
        reportType === 'out-of-stock' ? 'Relatório de Produtos Sem Estoque' :
        reportType === 'over-stock' ? 'Relatório de Produtos com Estoque Alto' :
        reportType === 'turnover' ? 'Relatório de Giro de Estoque' :
        reportType === 'value' ? 'Relatório de Valor por Categoria' :
        'Relatório de Movimentações de Estoque';

      const periodLabel = 
        dateRange === '7' ? 'Últimos 7 dias' :
        dateRange === '30' ? 'Últimos 30 dias' :
        dateRange === '90' ? 'Últimos 90 dias' :
        'Último ano';

      const headers = [
        'Produto',
        'Categoria',
        'Estoque Atual',
        'Estoque Mínimo',
        'Estoque Máximo',
        'Consumo Médio',
        'Giro',
        'Última Movimentação',
        'Valor',
        'Status'
      ];

      const rows = reports.map(report => [
        report.productName,
        report.category,
        formatNumber(report.currentStock),
        formatNumber(report.minimumStock),
        formatNumber(report.maximumStock),
        `${formatNumber(report.averageConsumption)}/dia`,
        formatPercentage(report.turnoverRate),
        formatDate(report.lastMovementDate),
        formatCurrency(report.totalValue),
        getStatusLabel(report.status)
      ]);

      const totalValue = reports.reduce((sum, r) => sum + r.totalValue, 0);
      const summary = [
        {
          label: 'Total de Produtos',
          value: reports.length,
          format: 'number' as const
        },
        {
          label: 'Valor Total',
          value: totalValue,
          format: 'currency' as const
        },
        {
          label: 'Produtos com Estoque Baixo',
          value: stats.lowStockProducts,
          format: 'number' as const
        },
        {
          label: 'Produtos Sem Estoque',
          value: stats.outOfStockProducts,
          format: 'number' as const
        }
      ];

      const reportData: ReportData = {
        title: reportTitle,
        subtitle: 'Análise e relatórios detalhados do estoque',
        period: periodLabel,
        headers,
        rows,
        summary
      };

      await ReportGenerator.generatePDF(reportData);

      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-seguranca-lightgray">Relatórios de Estoque</h2>
          <p className="text-gray-400 mt-1">
            Análise e relatórios detalhados do estoque
          </p>
        </div>
        <Button onClick={exportReport} className="bg-seguranca-red hover:bg-seguranca-darkred">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-seguranca-yellow" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Total de Produtos</p>
                <p className="text-2xl font-bold text-seguranca-lightgray">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Estoque Baixo</p>
                <p className="text-2xl font-bold text-red-500">{stats.lowStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Sem Estoque</p>
                <p className="text-2xl font-bold text-red-500">{stats.outOfStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Estoque Alto</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.overStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Valor Total</p>
                <p className="text-2xl font-bold text-blue-500">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Giro Médio</p>
                <p className="text-2xl font-bold text-green-500">{formatPercentage(stats.averageTurnover)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full lg:w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Tipo de Relatório" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                <SelectItem value="low-stock">Estoque Baixo</SelectItem>
                <SelectItem value="out-of-stock">Sem Estoque</SelectItem>
                <SelectItem value="over-stock">Estoque Alto</SelectItem>
                <SelectItem value="turnover">Giro de Estoque</SelectItem>
                <SelectItem value="value">Valor por Categoria</SelectItem>
                <SelectItem value="movements">Movimentações</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full lg:w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={loadReports}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Relatórios */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">
            {reportType === 'low-stock' && 'Produtos com Estoque Baixo'}
            {reportType === 'out-of-stock' && 'Produtos Sem Estoque'}
            {reportType === 'over-stock' && 'Produtos com Estoque Alto'}
            {reportType === 'turnover' && 'Giro de Estoque'}
            {reportType === 'value' && 'Valor por Categoria'}
            {reportType === 'movements' && 'Movimentações'}
            ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-seguranca-lightgray">Produto</TableHead>
                    <TableHead className="text-seguranca-lightgray">Categoria</TableHead>
                    <TableHead className="text-seguranca-lightgray">Estoque Atual</TableHead>
                    <TableHead className="text-seguranca-lightgray">Estoque Mínimo</TableHead>
                    <TableHead className="text-seguranca-lightgray">Estoque Máximo</TableHead>
                    <TableHead className="text-seguranca-lightgray">Consumo Médio</TableHead>
                    <TableHead className="text-seguranca-lightgray">Giro</TableHead>
                    <TableHead className="text-seguranca-lightgray">Última Movimentação</TableHead>
                    <TableHead className="text-seguranca-lightgray">Valor</TableHead>
                    <TableHead className="text-seguranca-lightgray">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow className="border-gray-600">
                      <TableCell colSpan={10} className="text-center text-gray-400 py-8">
                        Nenhum dado disponível para o filtro selecionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id} className="border-gray-600">
                        <TableCell className="text-seguranca-lightgray">
                          <div className="font-medium">{report.productName}</div>
                        </TableCell>
                        <TableCell className="text-gray-300">{report.category}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            report.currentStock <= report.minimumStock ? 'text-red-500' : 
                            report.currentStock > report.maximumStock ? 'text-yellow-500' : 
                            'text-green-500'
                          }`}>
                            {formatNumber(report.currentStock)}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-300">{formatNumber(report.minimumStock)}</TableCell>
                        <TableCell className="text-gray-300">{formatNumber(report.maximumStock)}</TableCell>
                        <TableCell className="text-gray-300">{formatNumber(report.averageConsumption)}/dia</TableCell>
                        <TableCell className="text-gray-300">{formatPercentage(report.turnoverRate)}</TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(report.lastMovementDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{formatCurrency(report.totalValue)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusLabel(report.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockReportsContent;
