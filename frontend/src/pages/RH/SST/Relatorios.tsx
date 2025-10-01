import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Eye,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  Stethoscope,
  HardHat,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sstReportsService, SSTReport, ReportExecution, ReportRequest } from '@/services/sstReportsService';
import { useToast } from '@/hooks/use-toast';

const Relatorios: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [reports, setReports] = useState<SSTReport[]>([]);
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'executions'>('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Estados para modal de execução
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SSTReport | null>(null);
  const [executeForm, setExecuteForm] = useState<ReportRequest>({
    reportId: '',
    parameters: {},
    format: 'pdf',
    includeCharts: true
  });

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reportsData, executionsData] = await Promise.all([
        sstReportsService.getReports(),
        sstReportsService.getReportExecutions()
      ]);
      setReports(reportsData);
      setExecutions(executionsData);
    } catch (err) {
      console.error('Erro ao carregar dados de relatórios:', err);
      setError('Erro ao carregar dados de relatórios');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de relatórios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar relatórios
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Filtrar execuções
  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = execution.reportName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Executar relatório
  const handleExecuteReport = async () => {
    try {
      if (!executeForm.reportId) {
        toast({
          title: "Erro",
          description: "Selecione um relatório",
          variant: "destructive",
        });
        return;
      }

      const result = await sstReportsService.executeReport(executeForm);
      toast({
        title: "Sucesso",
        description: "Relatório executado com sucesso",
      });
      
      setShowExecuteModal(false);
      setExecuteForm({
        reportId: '',
        parameters: {},
        format: 'pdf',
        includeCharts: true
      });
      setSelectedReport(null);
      
      loadData();
    } catch (err) {
      console.error('Erro ao executar relatório:', err);
      toast({
        title: "Erro",
        description: "Não foi possível executar o relatório",
        variant: "destructive",
      });
    }
  };

  // Download relatório
  const handleDownloadReport = async (executionId: string, fileName: string) => {
    try {
      const blob = await sstReportsService.downloadReport(executionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao baixar relatório:', err);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o relatório",
        variant: "destructive",
      });
    }
  };

  // Obter cor do tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COMPLIANCE':
        return 'bg-green-100 text-green-800';
      case 'ACCIDENTS':
        return 'bg-red-100 text-red-800';
      case 'MEDICAL_EXAMS':
        return 'bg-blue-100 text-blue-800';
      case 'TRAINING':
        return 'bg-yellow-100 text-yellow-800';
      case 'EPI':
        return 'bg-purple-100 text-purple-800';
      case 'RISKS':
        return 'bg-orange-100 text-orange-800';
      case 'CUSTOM':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter ícone do tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPLIANCE':
        return <Shield className="h-5 w-5" />;
      case 'ACCIDENTS':
        return <AlertTriangle className="h-5 w-5" />;
      case 'MEDICAL_EXAMS':
        return <Stethoscope className="h-5 w-5" />;
      case 'TRAINING':
        return <Users className="h-5 w-5" />;
      case 'EPI':
        return <HardHat className="h-5 w-5" />;
      case 'RISKS':
        return <AlertCircle className="h-5 w-5" />;
      case 'CUSTOM':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <BarChart3 className="h-8 w-8 animate-pulse text-seguranca-yellow" />
            <p className="text-seguranca-lightgray">Carregando relatórios...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (error) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-red-500">{error}</p>
            <Button 
              onClick={loadData}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-seguranca-yellow" />
              Relatórios SST
            </h1>
            <p className="text-gray-400 mt-1">Sistema de Relatórios e Análises</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/rh/sst')}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Voltar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-600">
          <Button
            variant={activeTab === 'reports' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('reports')}
            className={activeTab === 'reports' ? 'bg-seguranca-red' : 'text-seguranca-lightgray hover:bg-seguranca-black'}
          >
            <FileText className="h-4 w-4 mr-2" />
            Relatórios ({reports.length})
          </Button>
          <Button
            variant={activeTab === 'executions' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('executions')}
            className={activeTab === 'executions' ? 'bg-seguranca-red' : 'text-seguranca-lightgray hover:bg-seguranca-black'}
          >
            <Clock className="h-4 w-4 mr-2" />
            Execuções ({executions.length})
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search" className="text-seguranca-lightgray">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={activeTab === 'reports' ? 'Nome do relatório, descrição...' : 'Nome do relatório...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
              
              {activeTab === 'reports' && (
                <div>
                  <Label htmlFor="type" className="text-seguranca-lightgray">Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="COMPLIANCE">Conformidade</SelectItem>
                      <SelectItem value="ACCIDENTS">Acidentes</SelectItem>
                      <SelectItem value="MEDICAL_EXAMS">Exames Médicos</SelectItem>
                      <SelectItem value="TRAINING">Treinamentos</SelectItem>
                      <SelectItem value="EPI">EPIs</SelectItem>
                      <SelectItem value="RISKS">Riscos</SelectItem>
                      <SelectItem value="CUSTOM">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo das Tabs */}
        {activeTab === 'reports' ? (
          /* Relatórios */
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray">
                Relatórios Disponíveis ({filteredReports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="p-4 bg-seguranca-black rounded-lg border border-gray-600">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(report.type)}
                            <h3 className="font-semibold text-seguranca-lightgray">
                              {report.name}
                            </h3>
                          </div>
                          <Badge className={getTypeColor(report.type)}>
                            {report.type}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setExecuteForm({
                                reportId: report.id,
                                parameters: {},
                                format: 'pdf',
                                includeCharts: true
                              });
                              setShowExecuteModal(true);
                            }}
                            className="bg-seguranca-red hover:bg-seguranca-darkred"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-3">{report.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Parâmetros:</span>
                          <span className="text-seguranca-lightgray">{report.parameters?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <Badge className={report.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {report.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Criado:</span>
                          <span className="text-seguranca-lightgray">
                            {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-seguranca-lightgray">Nenhum relatório encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm || typeFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Nenhum relatório disponível no sistema'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Execuções */
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray">
                Execuções de Relatórios ({filteredExecutions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExecutions.length > 0 ? (
                <div className="space-y-4">
                  {filteredExecutions.map((execution) => (
                    <div key={execution.id} className="p-4 bg-seguranca-black rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-seguranca-lightgray">
                              {execution.reportName}
                            </h3>
                            <Badge className={getStatusColor(execution.status)}>
                              {execution.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(execution.executedAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span>Executado por: {execution.executedBy}</span>
                            </div>
                            
                            {execution.result && (
                              <div className="flex items-center gap-2">
                                <span>Registros: {execution.result.totalRecords}</span>
                              </div>
                            )}
                          </div>
                          
                          {execution.errorMessage && (
                            <p className="text-sm text-red-400 mt-2">{execution.errorMessage}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {execution.status === 'COMPLETED' && (
                            <Button
                              size="sm"
                              onClick={() => handleDownloadReport(execution.id, `${execution.reportName}.pdf`)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/rh/sst/relatorios/execucoes/${execution.id}`)}
                            className="border-gray-600 text-seguranca-lightgray"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-seguranca-lightgray">Nenhuma execução encontrada</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Execute relatórios para ver as execuções aqui'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de Execução de Relatório */}
        {showExecuteModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-seguranca-lightgray mb-4">
                Executar Relatório - {selectedReport.name}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="format" className="text-seguranca-lightgray">
                    Formato
                  </Label>
                  <Select 
                    value={executeForm.format} 
                    onValueChange={(value) => setExecuteForm({...executeForm, format: value as any})}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeCharts"
                    checked={executeForm.includeCharts}
                    onChange={(e) => setExecuteForm({...executeForm, includeCharts: e.target.checked})}
                    className="rounded border-gray-600"
                  />
                  <Label htmlFor="includeCharts" className="text-seguranca-lightgray">
                    Incluir Gráficos
                  </Label>
                </div>
                
                {selectedReport.parameters && selectedReport.parameters.length > 0 && (
                  <div>
                    <Label className="text-seguranca-lightgray">
                      Parâmetros do Relatório
                    </Label>
                    <div className="space-y-2 mt-2">
                      {selectedReport.parameters.map((parameter) => (
                        <div key={parameter.name}>
                          <Label htmlFor={parameter.name} className="text-sm text-gray-400">
                            {parameter.label} {parameter.required && '*'}
                          </Label>
                          {parameter.type === 'date' && (
                            <Input
                              id={parameter.name}
                              type="date"
                              value={executeForm.parameters[parameter.name] || ''}
                              onChange={(e) => setExecuteForm({
                                ...executeForm,
                                parameters: {
                                  ...executeForm.parameters,
                                  [parameter.name]: e.target.value
                                }
                              })}
                              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                            />
                          )}
                          {parameter.type === 'select' && (
                            <Select 
                              value={executeForm.parameters[parameter.name] || ''} 
                              onValueChange={(value) => setExecuteForm({
                                ...executeForm,
                                parameters: {
                                  ...executeForm.parameters,
                                  [parameter.name]: value
                                }
                              })}
                            >
                              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                                <SelectValue placeholder={`Selecione ${parameter.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {parameter.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {parameter.type === 'text' && (
                            <Input
                              id={parameter.name}
                              placeholder={`Digite ${parameter.label.toLowerCase()}`}
                              value={executeForm.parameters[parameter.name] || ''}
                              onChange={(e) => setExecuteForm({
                                ...executeForm,
                                parameters: {
                                  ...executeForm.parameters,
                                  [parameter.name]: e.target.value
                                }
                              })}
                              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                            />
                          )}
                          {parameter.type === 'boolean' && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={parameter.name}
                                checked={executeForm.parameters[parameter.name] || false}
                                onChange={(e) => setExecuteForm({
                                  ...executeForm,
                                  parameters: {
                                    ...executeForm.parameters,
                                    [parameter.name]: e.target.checked
                                  }
                                })}
                                className="rounded border-gray-600"
                              />
                              <Label htmlFor={parameter.name} className="text-sm text-gray-400">
                                {parameter.label}
                              </Label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowExecuteModal(false)}
                  className="flex-1 border-gray-600 text-seguranca-lightgray"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleExecuteReport}
                  className="flex-1 bg-seguranca-red hover:bg-seguranca-darkred"
                >
                  Executar Relatório
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default Relatorios;
