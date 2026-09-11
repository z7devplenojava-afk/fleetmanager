import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  Building2,
  PieChart,
  Activity,
  RefreshCw,
  Plus,
  Database,
  BarChart,
  LineChart
} from 'lucide-react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';
import MeasurementCompleteTable from '@/components/financeiro/MeasurementCompleteTable';
import MeasurementSimpleTable from '@/components/financeiro/MeasurementSimpleTable';
import { MeasurementBulletinModal } from '@/components/financeiro/MeasurementBulletinModal';
import { SimplifiedMeasurementModal } from '@/components/financeiro/SimplifiedMeasurementModal';
import { MeasurementValidationModal } from '@/components/financeiro/MeasurementValidationModal';
import { MeasurementDeleteDialog } from '@/components/financeiro/MeasurementDeleteDialog';
import { MeasurementViewModal } from '@/components/financeiro/MeasurementViewModal';
import { MeasurementWizardModal } from '@/components/financeiro/MeasurementWizardModal';
import { MeasurementVersionDrawer } from '@/components/financeiro/MeasurementVersionDrawer';
import { useToast } from '@/hooks/use-toast';
import { measurementService } from '@/services/measurementService';
import { MeasurementBulletin, MeasurementStatus } from '@/types/measurement';

const Medicao: React.FC = () => {
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showVersionDrawer, setShowVersionDrawer] = useState(false);
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [showSimplifiedModal, setShowSimplifiedModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<MeasurementBulletin | null>(null);
  const [editingBulletin, setEditingBulletin] = useState<MeasurementBulletin | null>(null);
  const [editingSimplifiedBulletin, setEditingSimplifiedBulletin] = useState<MeasurementBulletin | null>(null);
  const [bulletinToDelete, setBulletinToDelete] = useState<MeasurementBulletin | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalBulletins: 0,
    completeBulletins: 0,
    simplifiedBulletins: 0,
    pendingBulletins: 0,
    validatedBulletins: 0,
    totalValue: 0,
    monthlyData: [] as any[],
    statusDistribution: {} as Record<MeasurementStatus, number>,
    hasData: false
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const { toast } = useToast();

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const bulletins = await measurementService.getBulletins();
      
      // Verificar se bulletins é um array válido
      if (!Array.isArray(bulletins)) {
        console.warn('⚠️ measurementService.getBulletins() retornou dados inválidos:', bulletins);
        setDashboardData({
          totalBulletins: 0,
          completeBulletins: 0,
          simplifiedBulletins: 0,
          pendingBulletins: 0,
          validatedBulletins: 0,
          totalValue: 0,
          monthlyData: [],
          statusDistribution: {} as Record<MeasurementStatus, number>,
          hasData: false
        });
        return;
      }
      
      // Calcular estatísticas com melhor diferenciação
      const totalBulletins = bulletins.length;
      
      // Diferenciação mais precisa entre tipos de medição
      const completeBulletins = bulletins.filter(b => {
        // Medição completa: múltiplos itens OU notas indicando "completa" OU valor alto
        const hasMultipleItems = b.items && b.items.length > 1;
        const hasCompleteNote = b.notes?.toLowerCase().includes('completa') || b.notes?.toLowerCase().includes('detalhada');
        const hasHighValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) > 10000;
        return hasMultipleItems || hasCompleteNote || hasHighValue;
      }).length;
      
      const simplifiedBulletins = bulletins.filter(b => {
        // Medição simplificada: item único OU notas indicando "simplificada" OU valor baixo
        const hasSingleItem = b.items && b.items.length === 1;
        const hasSimplifiedNote = b.notes?.toLowerCase().includes('simplificada') || b.notes?.toLowerCase().includes('rápida');
        const hasLowValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) <= 10000;
        return hasSingleItem || hasSimplifiedNote || hasLowValue;
      }).length;
      
      const pendingBulletins = bulletins.filter(b => b.status === 'PENDING').length;
      const validatedBulletins = bulletins.filter(b => b.status === 'VALIDATED').length;
      
      const totalValue = bulletins.reduce((sum, b) => {
        const itemsValue = b.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0;
        return sum + itemsValue;
      }, 0);

      // Distribuição por status
      const statusDistribution = bulletins.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {} as Record<MeasurementStatus, number>);

      // Dados mensais (últimos 6 meses) com separação por tipo
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        const monthBulletins = bulletins.filter(b => {
          const bulletinDate = new Date(b.periodStart);
          return bulletinDate.getMonth() === date.getMonth() && 
                 bulletinDate.getFullYear() === date.getFullYear();
        });
        
        const monthComplete = monthBulletins.filter(b => {
          const hasMultipleItems = b.items && b.items.length > 1;
          const hasCompleteNote = b.notes?.toLowerCase().includes('completa') || b.notes?.toLowerCase().includes('detalhada');
          const hasHighValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) > 10000;
          return hasMultipleItems || hasCompleteNote || hasHighValue;
        }).length;
        
        const monthSimplified = monthBulletins.filter(b => {
          const hasSingleItem = b.items && b.items.length === 1;
          const hasSimplifiedNote = b.notes?.toLowerCase().includes('simplificada') || b.notes?.toLowerCase().includes('rápida');
          const hasLowValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) <= 10000;
          return hasSingleItem || hasSimplifiedNote || hasLowValue;
        }).length;
        
        monthlyData.push({
          month,
          total: monthBulletins.length,
          complete: monthComplete.length,
          simplified: monthSimplified.length,
          totalValue: monthBulletins.reduce((sum, b) => {
            const itemsValue = b.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0;
            return sum + itemsValue;
          }, 0),
          completeValue: monthBulletins.filter(b => {
            const hasMultipleItems = b.items && b.items.length > 1;
            const hasCompleteNote = b.notes?.toLowerCase().includes('completa') || b.notes?.toLowerCase().includes('detalhada');
            const hasHighValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) > 10000;
            return hasMultipleItems || hasCompleteNote || hasHighValue;
          }).reduce((sum, b) => {
            const itemsValue = b.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0;
            return sum + itemsValue;
          }, 0),
          simplifiedValue: monthBulletins.filter(b => {
            const hasSingleItem = b.items && b.items.length === 1;
            const hasSimplifiedNote = b.notes?.toLowerCase().includes('simplificada') || b.notes?.toLowerCase().includes('rápida');
            const hasLowValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) <= 10000;
            return hasSingleItem || hasSimplifiedNote || hasLowValue;
          }).reduce((sum, b) => {
            const itemsValue = b.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0;
            return sum + itemsValue;
          }, 0)
        });
      }

      setDashboardData({
        totalBulletins: Number(totalBulletins) || 0,
        completeBulletins: Number(completeBulletins) || 0,
        simplifiedBulletins: Number(simplifiedBulletins) || 0,
        pendingBulletins: Number(pendingBulletins) || 0,
        validatedBulletins: Number(validatedBulletins) || 0,
        totalValue: Number(totalValue) || 0,
        monthlyData: monthlyData || [],
        statusDistribution: statusDistribution || {},
        hasData: totalBulletins > 0
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard',
        variant: 'destructive'
      });
      
      // Garantir que o estado seja sempre válido mesmo em caso de erro
      setDashboardData({
        totalBulletins: 0,
        completeBulletins: 0,
        simplifiedBulletins: 0,
        pendingBulletins: 0,
        validatedBulletins: 0,
        totalValue: 0,
        monthlyData: [],
        statusDistribution: {},
        hasData: false
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handlers para as ações da tabela
  const handleViewBulletin = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowViewModal(true);
  };

  const handleEditBulletin = (bulletin: MeasurementBulletin) => {
    setEditingBulletin(bulletin);
    setShowBulletinModal(true);
  };

  const handleEditSimplifiedBulletin = (bulletin: MeasurementBulletin) => {
    setEditingSimplifiedBulletin(bulletin);
    setShowSimplifiedModal(true);
  };

  const handleDeleteBulletin = (bulletin: MeasurementBulletin) => {
    setBulletinToDelete(bulletin);
    setShowDeleteDialog(true);
  };

  const handleCreateBulletin = () => {
    setEditingBulletin(null);
    setShowBulletinModal(true);
  };

  const handleCreateSimplifiedBulletin = () => {
    setEditingSimplifiedBulletin(null);
    setShowSimplifiedModal(true);
  };

  const handleValidateBulletin = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowValidationModal(true);
  };

  const handleCloseModals = () => {
    setShowBulletinModal(false);
    setShowSimplifiedModal(false);
    setShowValidationModal(false);
    setShowViewModal(false);
    setShowDeleteDialog(false);
    setSelectedBulletin(null);
    setEditingBulletin(null);
    setEditingSimplifiedBulletin(null);
    setBulletinToDelete(null);
  };

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Medição</h1>
            <p className="text-seguranca-lightgray">
              Gestão de medições financeiras, apontamentos, cortes e versionamento (PRD 1.0)
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowWizardModal(true)}
              className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Gerar Medição (PRD 1.0)
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-seguranca-graphite border-gray-600">
            <TabsTrigger value="dashboard" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="completa" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Completa
            </TabsTrigger>
            <TabsTrigger value="simplificada" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Simplificada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Cabeçalho do Dashboard */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-seguranca-yellow" />
                    Dashboard de Medições
                  </h2>
                  <p className="text-seguranca-lightgray">
                    Visão geral das medições completas e simplificadas
                  </p>
                </div>
                <Button
                  onClick={loadDashboardData}
                  disabled={dashboardLoading}
                  variant="outline"
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${dashboardLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>

              {/* Estado Vazio */}
              {!dashboardLoading && !dashboardData.hasData && (
                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardContent className="p-12 text-center">
                    <Database className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Nenhum Dado Registrado
                    </h3>
                    <p className="text-seguranca-lightgray mb-6">
                      Não há medições cadastradas no sistema. Crie sua primeira medição para começar.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={handleCreateBulletin}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Medição Completa
                      </Button>
                      <Button
                        onClick={handleCreateSimplifiedBulletin}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Medição Simplificada
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dashboard com Dados */}
              {dashboardData.hasData && (
                <>
                  {/* Cards de Estatísticas Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total de Boletins */}
                    <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-300 font-medium">Total de Boletins</p>
                            <p className="text-3xl font-bold text-white">{dashboardData.totalBulletins}</p>
                            <p className="text-xs text-blue-200">Todos os tipos</p>
                          </div>
                          <div className="p-3 bg-blue-500/20 rounded-full">
                            <FileText className="h-6 w-6 text-blue-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Medições Completas */}
                    <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-300 font-medium">Medições Completas</p>
                            <p className="text-3xl font-bold text-white">{dashboardData.completeBulletins}</p>
                            <p className="text-xs text-green-200">Detalhadas</p>
                          </div>
                          <div className="p-3 bg-green-500/20 rounded-full">
                            <BarChart3 className="h-6 w-6 text-green-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Medições Simplificadas */}
                    <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-300 font-medium">Medições Simplificadas</p>
                            <p className="text-3xl font-bold text-white">{dashboardData.simplifiedBulletins}</p>
                            <p className="text-xs text-purple-200">Rápidas</p>
                          </div>
                          <div className="p-3 bg-purple-500/20 rounded-full">
                            <Clock className="h-6 w-6 text-purple-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Valor Total */}
                    <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-300 font-medium">Valor Total</p>
                            <p className="text-3xl font-bold text-white">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(dashboardData.totalValue)}
                            </p>
                            <p className="text-xs text-yellow-200">Acumulado</p>
                          </div>
                          <div className="p-3 bg-yellow-500/20 rounded-full">
                            <DollarSign className="h-6 w-6 text-yellow-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Comparação por Tipo */}
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-seguranca-yellow" />
                        Comparação: Completas vs Simplificadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={[
                            { 
                              name: 'Completas', 
                              value: Number(dashboardData.completeBulletins) || 0,
                              color: '#10b981'
                            },
                            { 
                              name: 'Simplificadas', 
                              value: Number(dashboardData.simplifiedBulletins) || 0,
                              color: '#8b5cf6'
                            }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#ffffff'
                              }} 
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Tendência Mensal */}
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-seguranca-yellow" />
                        Tendência Mensal (Últimos 6 Meses)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={dashboardData.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#ffffff'
                              }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="complete" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              name="Completas"
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="simplified" 
                              stroke="#8b5cf6" 
                              strokeWidth={3}
                              name="Simplificadas"
                              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cards de Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pendentes */}
                    <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-300 font-medium">Pendentes</p>
                            <p className="text-2xl font-bold text-white">{dashboardData.pendingBulletins}</p>
                            <p className="text-xs text-orange-200">Aguardando validação</p>
                          </div>
                          <div className="p-3 bg-orange-500/20 rounded-full">
                            <AlertCircle className="h-6 w-6 text-orange-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Validados */}
                    <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-emerald-300 font-medium">Validados</p>
                            <p className="text-2xl font-bold text-white">{dashboardData.validatedBulletins}</p>
                            <p className="text-xs text-emerald-200">Aprovados</p>
                          </div>
                          <div className="p-3 bg-emerald-500/20 rounded-full">
                            <CheckCircle className="h-6 w-6 text-emerald-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ações Rápidas */}
                    <Card className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 border-indigo-500/30">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <p className="text-sm text-indigo-300 font-medium">Ações Rápidas</p>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleCreateBulletin}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Completa
                            </Button>
                            <Button
                              onClick={handleCreateSimplifiedBulletin}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Simplificada
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Pizza - Distribuição por Status */}
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-seguranca-yellow" />
                        Distribuição por Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={Object.entries(dashboardData.statusDistribution).map(([status, count]) => ({
                                name: status === 'DRAFT' ? 'Rascunho' :
                                      status === 'PENDING' ? 'Pendente' :
                                      status === 'VALIDATED' ? 'Validado' : 'Cancelado',
                                value: count,
                                color: status === 'DRAFT' ? '#6b7280' :
                                       status === 'PENDING' ? '#f59e0b' :
                                       status === 'VALIDATED' ? '#10b981' : '#ef4444'
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.entries(dashboardData.statusDistribution).map(([status, count], index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={status === 'DRAFT' ? '#6b7280' :
                                        status === 'PENDING' ? '#f59e0b' :
                                        status === 'VALIDATED' ? '#10b981' : '#ef4444'} 
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#ffffff'
                              }} 
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completa">
            <MeasurementCompleteTable
              onView={handleViewBulletin}
              onEdit={handleEditBulletin}
              onDelete={handleDeleteBulletin}
              onCreate={handleCreateBulletin}
              onValidate={handleValidateBulletin}
            />
          </TabsContent>

          <TabsContent value="simplificada">
            <MeasurementSimpleTable
              onView={handleViewBulletin}
              onEdit={handleEditSimplifiedBulletin}
              onDelete={handleDeleteBulletin}
              onCreate={handleCreateSimplifiedBulletin}
              onValidate={handleValidateBulletin}
            />
          </TabsContent>
        </Tabs>

        {/* Modais */}
        {showBulletinModal && (
          <MeasurementBulletinModal
            open={showBulletinModal}
            onOpenChange={setShowBulletinModal}
            bulletin={editingBulletin}
            onSuccess={() => {
              handleCloseModals();
              // Aqui você pode adicionar lógica para recarregar as tabelas
            }}
          />
        )}

        {showSimplifiedModal && (
          <SimplifiedMeasurementModal
            open={showSimplifiedModal}
            onOpenChange={setShowSimplifiedModal}
            bulletin={editingSimplifiedBulletin}
            onSuccess={() => {
              handleCloseModals();
              setEditingSimplifiedBulletin(null);
              // Aqui você pode adicionar lógica para recarregar as tabelas
            }}
          />
        )}

        {showValidationModal && selectedBulletin && (
          <MeasurementValidationModal
            open={showValidationModal}
            onOpenChange={setShowValidationModal}
            bulletin={selectedBulletin}
            onSuccess={() => {
              handleCloseModals();
              // Aqui você pode adicionar lógica para recarregar as tabelas
            }}
          />
        )}

        {showViewModal && selectedBulletin && (
          <MeasurementViewModal
            open={showViewModal}
            onOpenChange={setShowViewModal}
            bulletin={selectedBulletin}
          />
        )}

        {showDeleteDialog && bulletinToDelete && (
          <MeasurementDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            bulletin={bulletinToDelete}
            onSuccess={() => {
              handleCloseModals();
              // Aqui você pode adicionar lógica para recarregar as tabelas
            }}
          />
        )}

        {/* Modais do PRD 1.0 */}
        <MeasurementWizardModal
          isOpen={showWizardModal}
          onClose={() => setShowWizardModal(false)}
          onSuccess={() => {
            loadDashboardData();
          }}
        />

        <MeasurementVersionDrawer
          isOpen={showVersionDrawer}
          onClose={() => setShowVersionDrawer(false)}
          bulletinId={selectedBulletin?.id || null}
        />
      </div>
    </StandardLayout>
  );
};

export default Medicao;
