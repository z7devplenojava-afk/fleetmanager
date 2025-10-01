import React, { useState } from 'react';
import KanbanBoard from '../components/comercial/KanbanBoard';
import CrmDashboard from '../components/comercial/CrmDashboard';
import { StandardLayout } from '@/components/StandardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trello, 
  BarChart3, 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign 
} from 'lucide-react';

export default function CrmKanban() {
  const [activeTab, setActiveTab] = useState('kanban');

  return (
    <StandardLayout title="CRM Comercial">
      <div className="space-y-6">
        {/* Header com estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Leads</p>
                  <p className="text-2xl font-bold text-seguranca-yellow">156</p>
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
                  <p className="text-2xl font-bold text-seguranca-yellow">24</p>
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
                  <p className="text-2xl font-bold text-seguranca-yellow">18.5%</p>
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
                  <p className="text-2xl font-bold text-seguranca-yellow">R$ 2.4M</p>
                </div>
                <DollarSign className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-seguranca-graphite border border-gray-600">
            <TabsTrigger 
              value="kanban" 
              className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black text-seguranca-lightgray"
            >
              <Trello className="h-4 w-4 mr-2" />
              Kanban Board
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black text-seguranca-lightgray"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="space-y-4">
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