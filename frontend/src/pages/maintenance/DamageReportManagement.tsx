import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  Car, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  FileText,
  MapPin,
  User,
  Wrench,
  Shield,
  Download,
  RefreshCw
} from 'lucide-react';
import damageReportService from '@/services/damageReportService';
import { DamageReport, DamageReportFilter } from '@/services/damageReportService';
import DamageReportView from '@/components/maintenance/DamageReportView';
import DamageReportForm from '@/components/maintenance/DamageReportForm';

export default function DamageReportManagement() {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter, severityFilter, typeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, statsData] = await Promise.all([
        damageReportService.getAllReports(),
        damageReportService.getReportStats()
      ]);
      
      setReports(reportsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    const filter: DamageReportFilter = {
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      severity: severityFilter !== 'all' ? severityFilter : undefined,
      reportType: typeFilter !== 'all' ? typeFilter : undefined
    };
    
    // Apply filters (in real app, this would call the service)
    console.log('Applying filters:', filter);
  };

  const handleViewReport = (report: DamageReport) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const handleEditReport = (report: DamageReport) => {
    setSelectedReport(report);
    setShowCreateModal(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório de avaria?')) {
      return;
    }

    try {
      await damageReportService.deleteReport(reportId);
      await loadData();
      setShowViewModal(false);
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      alert('Erro ao excluir relatório');
    }
  };

  const handleSaveReport = async (report: DamageReport) => {
    await loadData();
    setShowCreateModal(false);
    setSelectedReport(null);
  };

  const handleEditReport = (report: DamageReport) => {
    setSelectedReport(report);
    setShowCreateModal(true);
  };

  const getSeverityLabel = (severity: string) => damageReportService.getSeverityLabel(severity);
  const getSeverityColor = (severity: string) => damageReportService.getSeverityColor(severity);
  const getStatusLabel = (status: string) => damageReportService.getStatusLabel(status);
  const getStatusColor = (status: string) => damageReportService.getStatusColor(status);
  const getReportTypeLabel = (type: string) => damageReportService.getReportTypeLabel(type);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registro de Avarias</h1>
          <p className="text-muted-foreground">Gerenciamento de danos e avarias veiculares</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Avaria
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Avarias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.openReports} em aberto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {stats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Em reparos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Críticas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.criticalReports}</div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção imediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageResolutionTime}d</div>
              <p className="text-xs text-muted-foreground">
                Para resolução
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="analytics">Análise</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar relatórios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="OPEN">Aberto</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                    <SelectItem value="RESOLVED">Resolvido</SelectItem>
                    <SelectItem value="CLOSED">Fechado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Severidades</SelectItem>
                    <SelectItem value="LOW">Baixo</SelectItem>
                    <SelectItem value="MEDIUM">Médio</SelectItem>
                    <SelectItem value="HIGH">Alto</SelectItem>
                    <SelectItem value="CRITICAL">Crítico</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="ACCIDENT">Acidente</SelectItem>
                    <SelectItem value="VANDALISM">Vandalismo</SelectItem>
                    <SelectItem value="WEAR">Desgaste</SelectItem>
                    <SelectItem value="MALFUNCTION">Falha Mecânica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Avaria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Veículo</th>
                      <th className="text-left p-2">Título</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Severidade</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Custo</th>
                      <th className="text-left p-2">Reportado por</th>
                      <th className="text-center p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="text-sm">
                            <div>{new Date(report.reportDate).toLocaleDateString('pt-BR')}</div>
                            <div className="text-muted-foreground">
                              {new Date(report.reportDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{report.vehiclePlate}</div>
                              <div className="text-sm text-muted-foreground">{report.vehicleModel}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="max-w-xs">
                            <div className="font-medium truncate">{report.description.title}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {report.description.details.substring(0, 50)}...
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {getReportTypeLabel(report.reportType)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={getSeverityColor(report.severity)}>
                            {getSeverityLabel(report.severity)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusLabel(report.status)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="text-sm font-medium">
                            R$ {report.estimatedCosts.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="text-sm">{report.reportedBy}</div>
                              <div className="text-xs text-muted-foreground">{report.reporterRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReport(report)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendências Mensais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de tendências será implementado com biblioteca de charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Distribuição por Severidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Shield className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de distribuição será implementado com biblioteca de charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Análise de Custos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    R$ {stats?.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">Custo Total</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.total || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Avarias</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {stats?.totalCost && stats?.total ? 
                      (stats.totalCost / stats.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
                      : '0'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Custo Médio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Notificações Automáticas</div>
                    <div className="text-sm text-muted-foreground">
                      Enviar alertas para novas avarias críticas
                    </div>
                  </div>
                  <div className="h-6 w-11 bg-gray-200 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-blue-600 rounded-full transition-transform"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Aprovação Automática</div>
                    <div className="text-sm text-muted-foreground">
                      Aprovar automaticamente avarias de baixo custo
                    </div>
                  </div>
                  <div className="h-6 w-11 bg-gray-200 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full transition-transform"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Integração com Seguradora</div>
                    <div className="text-sm text-muted-foreground">
                      Enviar automaticamente reivindicações para a seguradora
                    </div>
                  </div>
                  <div className="h-6 w-11 bg-gray-200 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-blue-600 rounded-full transition-transform"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <DamageReportView
              reportId={selectedReport.id}
              onEdit={handleEditReport}
              onDelete={handleDeleteReport}
              onClose={() => {
                setShowViewModal(false);
                setSelectedReport(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DamageReportForm
              report={selectedReport}
              onSave={handleSaveReport}
              onCancel={() => {
                setShowCreateModal(false);
                setSelectedReport(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
