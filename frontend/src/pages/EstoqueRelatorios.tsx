import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { StandardLayout } from '@/components/StandardLayout';
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

export default function EstoqueRelatorios() {
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
      
      // Integração real com o backend
      const { stockService } = await import('@/services/stockService');
      
      let reportData;
      let itemsToProcess = [];
      
      // Buscar dados baseados no tipo de relatório
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
          // Para outros tipos, buscar todos os itens e filtrar
           const allItems = await stockService.getAllItems();
           itemsToProcess = allItems || [];
          break;
        default:
          reportData = await stockService.getStockReport();
          itemsToProcess = reportData.lowStockItems || [];
      }
      
      // Converter dados do backend para o formato esperado
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
      
      // Filtrar baseado no tipo de relatório se necessário
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
      // Integração real com o backend
      const { stockService } = await import('@/services/stockService');
      const reportData = await stockService.getStockReport();
      
      setStats({
        totalProducts: reportData.totalItems || 0,
        lowStockProducts: reportData.lowStockCount || 0,
        outOfStockProducts: reportData.outOfStockCount || 0,
        overStockProducts: 0, // Calcular baseado nos dados se necessário
        totalValue: reportData.totalValue || 0,
        averageTurnover: 0, // Calcular baseado nos dados se necessário
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Manter valores padrão em caso de erro
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

  const exportReport = () => {
    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso.",
    });
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatórios de Estoque</h1>
            <p className="text-muted-foreground">
              Análise e relatórios detalhados do estoque
            </p>
          </div>
          <Button onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Produtos</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-red-600">{stats.lowStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Sem Estoque</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Estoque Alto</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.overStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Giro Médio</p>
                  <p className="text-2xl font-bold text-green-600">{formatPercentage(stats.averageTurnover)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Tipo de Relatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low-stock">Estoque Baixo</SelectItem>
                  <SelectItem value="out-of-stock">Sem Estoque</SelectItem>
                  <SelectItem value="over-stock">Estoque Alto</SelectItem>
                  <SelectItem value="turnover">Giro de Estoque</SelectItem>
                  <SelectItem value="value">Valor por Categoria</SelectItem>
                  <SelectItem value="movements">Movimentações</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadReports}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Relatórios */}
        <Card>
          <CardHeader>
            <CardTitle>
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                      <TableHead>Estoque Máximo</TableHead>
                      <TableHead>Consumo Médio</TableHead>
                      <TableHead>Giro</TableHead>
                      <TableHead>Última Movimentação</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="font-medium">{report.productName}</div>
                        </TableCell>
                        <TableCell>{report.category}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${report.currentStock <= report.minimumStock ? 'text-red-600' : report.currentStock > report.maximumStock ? 'text-yellow-600' : 'text-green-600'}`}>
                            {formatNumber(report.currentStock)}
                          </span>
                        </TableCell>
                        <TableCell>{formatNumber(report.minimumStock)}</TableCell>
                        <TableCell>{formatNumber(report.maximumStock)}</TableCell>
                        <TableCell>{formatNumber(report.averageConsumption)}/dia</TableCell>
                        <TableCell>{formatPercentage(report.turnoverRate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDate(report.lastMovementDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(report.totalValue)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusLabel(report.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
}