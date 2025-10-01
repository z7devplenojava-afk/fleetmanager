import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Camera, 
  MapPin, 
  Route, 
  BarChart3, 
  Settings,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Eye,
  Calendar,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SupervisorStats {
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  facialLogins: number;
  activeRoutes: number;
  efficiencyScore: number;
}

const Supervisao: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<SupervisorStats>({
    totalVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
    facialLogins: 0,
    activeRoutes: 0,
    efficiencyScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupervisorStats();
  }, []);

  const loadSupervisorStats = async () => {
    try {
      setLoading(true);
      // TODO: Implementar chamada para API de estatísticas
      // const response = await supervisorService.getStats();
      // setStats(response);
      
      // Dados mockados para demonstração
      setStats({
        totalVisits: 45,
        completedVisits: 38,
        pendingVisits: 7,
        facialLogins: 12,
        activeRoutes: 3,
        efficiencyScore: 84.4
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas de supervisão');
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-600">Excelente</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-600">Bom</Badge>;
    return <Badge className="bg-red-600">Precisa Melhorar</Badge>;
  };

  return (
    <StandardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-seguranca-yellow" />
            <h1 className="text-3xl font-bold text-seguranca-lightgray">
              Sistema de Supervisão
            </h1>
          </div>
          <p className="text-gray-400">
            Gerencie postos de trabalho, visite locais e monitore atividades com reconhecimento facial
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-seguranca-graphite border-gray-600">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-seguranca-black">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="facial" className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-seguranca-black">
              <Camera className="w-4 h-4 mr-2" />
              Login Facial
            </TabsTrigger>
            <TabsTrigger value="visitas" className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-seguranca-black">
              <MapPin className="w-4 h-4 mr-2" />
              Visitas
            </TabsTrigger>
            <TabsTrigger value="rotas" className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-seguranca-black">
              <Route className="w-4 h-4 mr-2" />
              Rotas
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-seguranca-black">
              <Settings className="w-4 h-4 mr-2" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total de Visitas */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                    Total de Visitas
                  </CardTitle>
                  <MapPin className="h-4 w-4 text-seguranca-yellow" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-seguranca-lightgray">{stats.totalVisits}</div>
                  <p className="text-xs text-gray-400">
                    Visitas programadas este mês
                  </p>
                </CardContent>
              </Card>

              {/* Visitas Completadas */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                    Visitas Completadas
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.completedVisits}</div>
                  <p className="text-xs text-gray-400">
                    {((stats.completedVisits / stats.totalVisits) * 100).toFixed(1)}% de conclusão
                  </p>
                </CardContent>
              </Card>

              {/* Visitas Pendentes */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                    Visitas Pendentes
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{stats.pendingVisits}</div>
                  <p className="text-xs text-gray-400">
                    Aguardando realização
                  </p>
                </CardContent>
              </Card>

              {/* Logins Faciais */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                    Logins Faciais
                  </CardTitle>
                  <Camera className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">{stats.facialLogins}</div>
                  <p className="text-xs text-gray-400">
                    Autenticações por reconhecimento facial
                  </p>
                </CardContent>
              </Card>

              {/* Rotas Ativas */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                    Rotas Ativas
                  </CardTitle>
                  <Route className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-500">{stats.activeRoutes}</div>
                  <p className="text-xs text-gray-400">
                    Rotas em execução
                  </p>
                </CardContent>
              </Card>

              {/* Score de Eficiência */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                    Score de Eficiência
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-seguranca-yellow" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-seguranca-yellow">
                    {stats.efficiencyScore}%
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getEfficiencyBadge(stats.efficiencyScore)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ações Rápidas */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Shield className="w-5 h-5 text-seguranca-yellow" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab('facial')}
                    className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-600"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Fazer Login Facial
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('visitas')}
                    variant="outline"
                    className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Registrar Visita
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('rotas')}
                    variant="outline"
                    className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                  >
                    <Route className="w-4 h-4 mr-2" />
                    Ver Rotas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Login Facial Tab */}
          <TabsContent value="facial" className="space-y-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Camera className="w-5 h-5 text-seguranca-yellow" />
                  Sistema de Login Facial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Camera className="w-16 h-16 text-seguranca-yellow mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                    Funcionalidade em Desenvolvimento
                  </h3>
                  <p className="text-gray-400 mb-4">
                    O sistema de reconhecimento facial está sendo implementado.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/facial-login'}
                    className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-600"
                  >
                    Acessar Login Facial
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visitas Tab */}
          <TabsContent value="visitas" className="space-y-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-seguranca-yellow" />
                  Gestão de Visitas Supervisionadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 text-seguranca-yellow mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                    Sistema de Visitas
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Gerencie visitas supervisionadas aos postos de trabalho.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={() => window.location.href = '/controle-visitas-avancado'}
                      className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-600"
                    >
                      Controle de Visitas
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/rota-semanal-supervisao'}
                      variant="outline"
                      className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                    >
                      Rota Semanal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rotas Tab */}
          <TabsContent value="rotas" className="space-y-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Route className="w-5 h-5 text-seguranca-yellow" />
                  Otimização de Rotas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Route className="w-16 h-16 text-seguranca-yellow mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                    Sistema de Rotas
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Visualize e otimize rotas de supervisão.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/rota-semanal-supervisao'}
                    className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-600"
                  >
                    Acessar Rotas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Settings className="w-5 h-5 text-seguranca-yellow" />
                  Configurações de Biometria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="w-16 h-16 text-seguranca-yellow mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                    Configurações
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Configure parâmetros de reconhecimento facial e biometria.
                  </p>
                  <Button 
                    variant="outline"
                    className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                  >
                    Configurar Biometria
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default Supervisao;
