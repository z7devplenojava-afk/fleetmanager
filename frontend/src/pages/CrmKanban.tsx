import React, { useState, useEffect } from 'react';
import KanbanBoard from '../components/comercial/KanbanBoard';
import CrmDashboard from '../components/comercial/CrmDashboard';
import { StandardLayout } from '@/components/StandardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchCrmMetrics } from '@/services/crmService';
import { 
  Trello, 
  BarChart3, 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign,
  Loader2
} from 'lucide-react';

export default function CrmKanban() {
  const [activeTab, setActiveTab] = useState('kanban');
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await fetchCrmMetrics();
      setMetrics(data);
    } catch (error: any) {
      console.error('Erro ao carregar métricas do CRM:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as métricas do CRM.",
        variant: "destructive"
      });
      // Usar valores padrão em caso de erro
      setMetrics({
        totalLeads: 0,
        activeOpportunities: 0,
        conversionRate: 0,
        estimatedRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'R$ 0,00';
    if (numValue >= 1000000) {
      return `R$ ${(numValue / 1000000).toFixed(1)}M`;
    } else if (numValue >= 1000) {
      return `R$ ${(numValue / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  return (
    <StandardLayout title="CRM Comercial">
      <div className="space-y-6 w-full min-w-0">
        {/* Header com estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Leads</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-seguranca-yellow">
                      {metrics?.totalLeads || 0}
                    </p>
                  )}
                </div>
                <Users className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Oportunidades Ativas</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-seguranca-yellow">
                      {metrics?.activeOpportunities || 0}
                    </p>
                  )}
                </div>
                <Target className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Taxa de Conversão</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-seguranca-yellow">
                      {metrics?.conversionRate || 0}%
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Receita Prevista</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-seguranca-yellow">
                      {formatCurrency(metrics?.estimatedRevenue || metrics?.totalValue || 0)}
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
          <TabsList className="grid w-full grid-cols-2 bg-seguranca-graphite border border-gray-600">
            <TabsTrigger 
              value="kanban" 
              className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-black text-seguranca-lightgray"
            >
              <Trello className="h-4 w-4 mr-2" />
              Kanban Board
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-black text-seguranca-lightgray"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="space-y-4 w-full min-w-0">
            <KanbanBoard />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <CrmDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
} 