import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Wrench, FileText, TrendingUp, AlertTriangle, Settings, Bell, ShoppingCart, Truck } from 'lucide-react';
import InventoryControl from '@/components/inventory/InventoryControl';
import InventoryRequest from '@/components/inventory/InventoryRequest';
import ServiceOrderIntegrated from '@/components/inventory/ServiceOrderIntegrated';
import InventoryNotifications from '@/components/inventory/InventoryNotifications';
import IntegratedPurchases from '@/components/inventory/IntegratedPurchases';
import TireTrackingDashboard from '@/components/inventory/TireTrackingDashboard';

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState('control');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Estoque e Serviços</h1>
          <p className="text-muted-foreground">Controle completo de peças, requisições e ordens de serviço</p>
        </div>
        <Button variant="outline" className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,247</div>
            <p className="text-xs text-muted-foreground">Peças cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor em Estoque</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ 45.678,90</div>
            <p className="text-xs text-muted-foreground">Valor total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Requisições Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">23</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ordens em Andamento</CardTitle>
            <Wrench className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">8</div>
            <p className="text-xs text-muted-foreground">Em execução</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="control" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Controle de Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Requisições</span>
          </TabsTrigger>
          <TabsTrigger value="service-orders" className="flex items-center space-x-2">
            <Wrench className="h-4 w-4" />
            <span>Ordens de Serviço</span>
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Compras</span>
          </TabsTrigger>
          <TabsTrigger value="tire-tracking" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Controle de Pneus</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-4">
          <InventoryControl />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <InventoryRequest />
        </TabsContent>

        <TabsContent value="service-orders" className="space-y-4">
          <ServiceOrderIntegrated />
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <IntegratedPurchases />
        </TabsContent>

        <TabsContent value="tire-tracking" className="space-y-4">
          <TireTrackingDashboard />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <InventoryNotifications />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Relatórios e Análises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-medium text-foreground mb-2">Módulo de Relatórios</h3>
                <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Relatório de movimentações por período</p>
                  <p>• Análise de giro de estoque</p>
                  <p>• Relatório de requisições por funcionário</p>
                  <p>• Custos médios por ordem de serviço</p>
                  <p>• Previsão de demanda baseada no histórico</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
