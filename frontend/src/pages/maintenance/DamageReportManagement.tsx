import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
  RefreshCw,
  Settings
} from 'lucide-react';
import damageReportService from '@/services/damageReportService';
import type { DamageReport, DamageReportFilter } from '@/services/damageReportService';
import DamageReportView from '@/components/maintenance/DamageReportView';
import DamageReportForm from '@/components/maintenance/DamageReportForm';

interface DamageReportManagementProps {
  embedded?: boolean;
}

export default function DamageReportManagement({ embedded = false }: DamageReportManagementProps) {
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
      {!embedded && (
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
      )}
      {embedded && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Gerenciamento de danos e avarias veiculares</p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaria
            </Button>
          </div>
        </div>
      )}

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
          <Card className="bg-seguranca-black border-gray-700/80 shadow-md">
            <CardHeader className="pb-3 border-b border-gray-800">
              <CardTitle className="text-seguranca-lightgray text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Relatórios de Avaria
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 bg-seguranca-graphite/40 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="text-left p-3">Data</th>
                      <th className="text-left p-3">Veículo</th>
                      <th className="text-left p-3">Título</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-left p-3">Severidade</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Custo</th>
                      <th className="text-left p-3">Reportado por</th>
                      <th className="text-center p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr 
                        key={report.id} 
                        className="border-b border-gray-800/80 transition-colors hover:bg-[#1e2433] text-gray-200 group"
                      >
                        <td className="p-3">
                          <div className="text-sm">
                            <div className="font-medium text-gray-200">{new Date(report.reportDate).toLocaleDateString('pt-BR')}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(report.reportDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-seguranca-red/20 border border-seguranca-red/40 flex items-center justify-center shrink-0">
                              <Car className="h-4 w-4 text-seguranca-red" />
                            </div>
                            <div>
                              <div className="font-mono font-bold text-seguranca-yellow text-sm tracking-wide">{report.vehiclePlate}</div>
                              <div className="text-xs text-gray-400">{report.vehicleModel}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="max-w-xs">
                            <div className="font-semibold text-white group-hover:text-white truncate text-sm">{report.description.title}</div>
                            <div className="text-xs text-gray-400 truncate mt-0.5">
                              {report.description.details.substring(0, 55)}...
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300 bg-gray-800/50">
                            {getReportTypeLabel(report.reportType)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getSeverityColor(report.severity)}>
                            {getSeverityLabel(report.severity)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusLabel(report.status)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm font-mono font-bold text-seguranca-yellow">
                            R$ {report.estimatedCosts.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-400 shrink-0" />
                            <div>
                              <div className="text-sm text-gray-200">{report.reportedBy}</div>
                              <div className="text-xs text-gray-400">{report.reporterRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center space-x-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-950/40 rounded-lg"
                              title="Visualizar Avaria"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReport(report)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-green-400 hover:bg-green-950/40 rounded-lg"
                              title="Editar Avaria"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg"
                              title="Excluir Avaria"
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
      <Dialog 
        open={showViewModal && !!selectedReport} 
        onOpenChange={(open) => {
          if (!open) {
            setShowViewModal(false);
            setSelectedReport(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] overflow-y-auto bg-[#131722] border-[#232b3b] text-gray-100 p-4 sm:p-6 shadow-2xl rounded-2xl">
          <DialogTitle className="sr-only">Visualizar Relatório de Avaria</DialogTitle>
          {selectedReport && (
            <DamageReportView
              reportId={selectedReport.id}
              onEdit={handleEditReport}
              onDelete={handleDeleteReport}
              onClose={() => {
                setShowViewModal(false);
                setSelectedReport(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog 
        open={showCreateModal} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setSelectedReport(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] overflow-y-auto bg-[#131722] border-[#232b3b] text-gray-100 p-4 sm:p-6 shadow-2xl rounded-2xl">
          <DialogTitle className="sr-only">
            {selectedReport ? 'Editar Relatório de Avaria' : 'Novo Relatório de Avaria'}
          </DialogTitle>
          <DamageReportForm
            report={selectedReport}
            onSave={handleSaveReport}
            onCancel={() => {
              setShowCreateModal(false);
              setSelectedReport(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
