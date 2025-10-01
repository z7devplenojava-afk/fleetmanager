import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3,
  Plus,
  Search,
  Filter,
  RefreshCw,
  QrCode,
  Users,
  FileText,
  Bell,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stockService } from '@/services/stockService';
import { StockItem, StockMovement, StockAlert, StockReport } from '@/types/stock';
import StockItemsTable from '@/components/stock/StockItemsTable';
import StockMovementsTable from '@/components/stock/StockMovementsTable';
import StockAlertsPanel from '@/components/stock/StockAlertsPanel';
import StockItemModal from '@/components/stock/StockItemModal';
import StockMovementModal from '@/components/stock/StockMovementModal';
import QrCodeScanner from '@/components/stock/QrCodeScanner';

const EstoqueSimplificado: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Estados para dados
  const [stockReport, setStockReport] = useState<StockReport | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<StockAlert[]>([]);

  // Estados para modais
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [report, items, movements, alerts] = await Promise.all([
        stockService.getStockReport(),
        stockService.getAllItems(),
        stockService.getRecentMovements(10),
        stockService.getActiveAlerts()
      ]);
      
      setStockReport(report);
      setStockItems(Array.isArray(items) ? items : []);
      setRecentMovements(movements);
      setActiveAlerts(Array.isArray(alerts) ? alerts : []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do estoque.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setShowItemModal(true);
  };

  const handleEditItem = (item: StockItem) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleCreateMovement = (item?: StockItem) => {
    setSelectedItem(item || null);
    setShowMovementModal(true);
  };

  const handleQrCodeScan = (qrCode: string) => {
    // Buscar item pelo QR Code e abrir modal de movimentação
    stockService.getItemByQrCode(qrCode)
      .then(item => {
        setSelectedItem(item);
        setShowMovementModal(true);
        setShowQrScanner(false);
        toast({
          title: "Item encontrado",
          description: `${item.fullName} - Estoque: ${item.currentQuantity}`,
        });
      })
      .catch(() => {
        toast({
          title: "Item não encontrado",
          description: "QR Code não corresponde a nenhum item cadastrado.",
          variant: "destructive"
        });
      });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-seguranca-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-seguranca-lightgray">
              {stockReport?.totalItems || 0}
            </div>
            <p className="text-xs text-gray-400">
              Itens cadastrados ativos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-seguranca-lightgray">Baixo Estoque</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stockReport?.lowStockCount || 0}
            </div>
            <p className="text-xs text-gray-400">
              Itens precisando reposição
            </p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-seguranca-lightgray">Sem Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stockReport?.outOfStockCount || 0}
            </div>
            <p className="text-xs text-gray-400">
              Itens zerados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-seguranca-lightgray">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {(stockReport?.totalValue || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-400">
              Valor do estoque atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Movimentações Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas Ativos */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
              <Bell className="h-5 w-5" />
              Alertas Ativos ({Array.isArray(activeAlerts) ? activeAlerts.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!Array.isArray(activeAlerts) || activeAlerts.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Nenhum alerta ativo</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activeAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border border-gray-600 rounded-lg">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                      alert.priority >= 3 ? 'text-red-500' : 'text-orange-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-seguranca-lightgray">
                        {alert.stockItemName}
                      </p>
                      <p className="text-xs text-gray-400">{alert.message}</p>
                    </div>
                    <Badge variant={alert.priority >= 3 ? "destructive" : "secondary"} className="text-xs">
                      {alert.priority >= 3 ? 'Crítico' : 'Baixo'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Movimentações Recentes */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
              <TrendingUp className="h-5 w-5" />
              Movimentações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMovements.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Nenhuma movimentação recente</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentMovements.slice(0, 5).map((movement) => (
                  <div key={movement.id} className="flex items-center gap-3 p-3 border border-gray-600 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      movement.movementType === 'ENTRADA' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-seguranca-lightgray">
                        {movement.stockItemFullName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {movement.movementType === 'ENTRADA' ? '+' : '-'}{movement.quantity} unidades
                        {movement.employeeName && ` → ${movement.employeeName}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(movement.movementDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-seguranca-yellow mb-4" />
            <p className="text-seguranca-lightgray">Carregando estoque...</p>
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
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Estoque Simplificado</h1>
            <p className="text-gray-400 mt-1">
              Controle rápido e simples de uniformes e EPIs
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowQrScanner(true)}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <QrCode size={16} className="mr-2" />
              QR Code
            </Button>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              {refreshing ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <RefreshCw size={16} className="mr-2" />
              )}
              Atualizar
            </Button>
            
            <Button 
              onClick={handleCreateItem}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Plus size={20} className="mr-2" />
              Novo Item
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-seguranca-graphite border-gray-600">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="items" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
              <Package className="h-4 w-4 mr-2" />
              Itens ({stockItems.length})
            </TabsTrigger>
            <TabsTrigger value="movements" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
              <TrendingUp className="h-4 w-4 mr-2" />
              Movimentações
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
              <Bell className="h-4 w-4 mr-2" />
              Alertas ({Array.isArray(activeAlerts) ? activeAlerts.length : 0})
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            {renderDashboard()}
          </TabsContent>

          <TabsContent value="items" className="mt-6">
            <StockItemsTable
              items={stockItems}
              onEdit={handleEditItem}
              onCreateMovement={handleCreateMovement}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="movements" className="mt-6">
            <StockMovementsTable
              onCreateMovement={() => handleCreateMovement()}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <StockAlertsPanel
              alerts={Array.isArray(activeAlerts) ? activeAlerts : []}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                  Relatórios em Desenvolvimento
                </h3>
                <p className="text-gray-400">
                  Relatórios detalhados de estoque, movimentações e entregas por funcionário em breve.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modais */}
        <StockItemModal
          open={showItemModal}
          onOpenChange={setShowItemModal}
          item={selectedItem}
          onSave={handleRefresh}
        />

        <StockMovementModal
          open={showMovementModal}
          onOpenChange={setShowMovementModal}
          item={selectedItem}
          onSave={handleRefresh}
        />

        <QrCodeScanner
          open={showQrScanner}
          onOpenChange={setShowQrScanner}
          onScan={handleQrCodeScan}
        />
      </div>
    </StandardLayout>
  );
};

export default EstoqueSimplificado;