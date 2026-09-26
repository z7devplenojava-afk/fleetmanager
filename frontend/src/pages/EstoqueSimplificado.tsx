import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2, 
  Upload,
  ShoppingCart,
  HardHat,
  Wrench,
  CircleDot,
  BatteryCharging,
  ClipboardCheck,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stockService } from '@/services/stockService';
import { StockItem, StockMovement, StockAlert, StockReport, StockCategoryLabels } from '@/types/stock';
import StockItemsTable from '@/components/stock/StockItemsTable';
import StockMovementsTable from '@/components/stock/StockMovementsTable';
import StockAlertsPanel from '@/components/stock/StockAlertsPanel';
import StockItemModal from '@/components/stock/StockItemModal';
import { StockLabelPrintModal } from '@/components/stock/StockLabelPrintModal';
import StockMovementModal from '@/components/stock/StockMovementModal';
import QrCodeScanner from '@/components/stock/QrCodeScanner';
import StockReportsContent from '@/components/stock/StockReportsContent';
import StockRequisitionsTab from '@/components/stock/StockRequisitionsTab';
import StockEpiDeliveryFormsTab from '@/components/stock/StockEpiDeliveryFormsTab';
import { StockWorkOrdersTab } from '@/components/stock/StockWorkOrdersTab';
import { StockTiresTab } from '@/components/stock/StockTiresTab';
import { StockBatteriesTab } from '@/components/stock/StockBatteriesTab';
import { StockInventoryAuditTab } from '@/components/stock/StockInventoryAuditTab';

const EstoqueSimplificado: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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
  const [showGlobalLabelModal, setShowGlobalLabelModal] = useState(false);

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

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    console.log('📥 [Importação] Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'bytes');
    setImporting(true);
    try {
      const result = await stockService.importExcel(file);
      console.log('📥 [Importação] Resultado do backend:', result);
      const errorCount = Array.isArray(result.errors) ? result.errors.length : 0;
      const totalProcessed = (result.inserted || 0) + (result.updated || 0) + (result.skipped || 0);

      let descriptionParts = [
        `✅ ${result.inserted || 0} inseridos`,
        `🔄 ${result.updated || 0} atualizados`,
        `⏭️ ${result.skipped || 0} ignorados`,
      ];
      if (errorCount > 0) {
        descriptionParts.push(`❌ ${errorCount} erro(s)`);
        descriptionParts.push('');
        descriptionParts.push('Primeiros erros:');
        const firstErrors = (result.errors || []).slice(0, 3);
        firstErrors.forEach((err: string, i: number) => {
          descriptionParts.push(`${i + 1}. ${err}`);
        });
        if (errorCount > 3) {
          descriptionParts.push(`... e mais ${errorCount - 3} erro(s). Verifique o console (F12).`);
        }
        console.warn('📥 [Importação] Lista completa de erros:', result.errors);
      }

      const title = errorCount > 0
        ? (totalProcessed > 0 ? 'Importação parcial (com erros)' : 'Falha na importação')
        : 'Importação concluída com sucesso';

      toast({
        title,
        description: descriptionParts.join('\n'),
        variant: errorCount > 0 ? 'destructive' : 'default'
      });

      await loadInitialData();
    } catch (error: any) {
      console.error('📥 [Importação] EXCEPTION:', error);
      toast({
        title: "Erro na importação",
        description: error?.message || "Não foi possível importar a planilha. Verifique o console (F12) para detalhes.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

    // Cálculo de distribuição por categoria para visualização rica
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    stockItems.forEach(it => {
      const cat = StockCategoryLabels[it.category] || it.category || 'Outros';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [stockItems]);

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Cards de Resumo Principais (KPIs com gradientes e destaques) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Itens */}
        <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-graphite to-blue-950/20 border-gray-700/70 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-gray-300 uppercase">Total de Itens</CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stockReport?.totalItems || stockItems.length || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Itens cadastrados ativos no almoxarifado</span>
            </div>
          </CardContent>
        </Card>

        {/* Baixo Estoque */}
        <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-graphite to-amber-950/20 border-gray-700/70 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-amber-400 uppercase">Baixo Estoque</CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {stockReport?.lowStockCount || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Abaixo da quantidade mínima</span>
            </div>
          </CardContent>
        </Card>

        {/* Sem Estoque / Ruptura */}
        <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-graphite to-red-950/25 border-gray-700/70 shadow-lg relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/15 transition-all"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-red-400 uppercase">Estoque Zerado</CardTitle>
            <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-red-400 tracking-tight">
              {stockReport?.outOfStockCount || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>Itens com saldo 0 (ruptura)</span>
            </div>
          </CardContent>
        </Card>

        {/* Valor Total */}
        <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-graphite to-emerald-950/20 border-gray-700/70 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">Valor em Estoque</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight">
              R$ {(stockReport?.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Custo total avaliado em patrimônio</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ações Rápidas Operacionais */}
      <div className="p-3.5 rounded-2xl bg-seguranca-graphite/80 border border-gray-700/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider pl-1">
          <Sparkles className="h-4 w-4 text-seguranca-yellow" />
          <span>Ações Rápidas do Almoxarifado</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleCreateItem}
            className="bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs h-8 px-3 font-semibold shadow-md shadow-seguranca-red/20"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Novo Item
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateMovement()}
            className="border-emerald-600/60 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8 px-3"
          >
            <ArrowUpRight className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
            Entrada / NF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateMovement()}
            className="border-red-600/60 text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
          >
            <ArrowDownRight className="h-3.5 w-3.5 mr-1.5 text-red-400" />
            Saída / Baixa
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowGlobalLabelModal(true)}
            className="border-seguranca-yellow/60 text-seguranca-yellow hover:bg-seguranca-yellow/10 text-xs h-8 px-3"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Etiquetas Pimaco A4
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowQrScanner(true)}
            className="border-gray-600 text-gray-300 hover:bg-seguranca-black text-xs h-8 px-3"
          >
            <QrCode className="h-3.5 w-3.5 mr-1.5" />
            Ler QR Code
          </Button>
        </div>
      </div>

      {/* Grade com Alertas Ativos, Movimentações e Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alertas Ativos (Col 7) */}
        <Card className="lg:col-span-7 bg-seguranca-graphite border-gray-700/70 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-700/60">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <Bell className="h-4 w-4 text-amber-400" />
              Alertas de Reposição & Validade
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs ml-1 font-mono">
                {Array.isArray(activeAlerts) ? activeAlerts.length : 0}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('alerts')}
              className="text-xs text-gray-400 hover:text-white hover:bg-seguranca-black h-7 px-2"
            >
              Ver todos →
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {!Array.isArray(activeAlerts) || activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 space-y-2">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500/60" />
                <p className="text-sm font-medium text-gray-300">Nenhum alerta crítico ativo no momento</p>
                <p className="text-xs text-gray-500">Todos os itens de estoque estão em níveis normais.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {activeAlerts.slice(0, 6).map((alert) => {
                  const matchingItem = stockItems.find(it => it.id === alert.stockItemId);
                  return (
                    <div 
                      key={alert.id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-700/70 bg-seguranca-black/40 hover:bg-seguranca-black/60 transition-all gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          alert.priority >= 3 ? 'text-red-400' : 'text-amber-400'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {alert.stockItemName}
                          </p>
                          <p className="text-[11px] text-gray-400 line-clamp-1">{alert.message}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant={alert.priority >= 3 ? "destructive" : "secondary"} 
                          className={`text-[10px] px-2 py-0.5 font-bold ${
                            alert.priority >= 3 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {alert.priority >= 3 ? 'Crítico' : 'Repor'}
                        </Badge>
                        {matchingItem && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCreateMovement(matchingItem)}
                            className="h-7 px-2 text-xs text-seguranca-yellow hover:bg-yellow-500/10"
                            title="Dar entrada neste item"
                          >
                            Repor +
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Movimentações Recentes (Col 5) */}
        <Card className="lg:col-span-5 bg-seguranca-graphite border-gray-700/70 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-700/60">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Movimentações Recentes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('movements')}
              className="text-xs text-gray-400 hover:text-white hover:bg-seguranca-black h-7 px-2"
            >
              Histórico →
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {recentMovements.length === 0 ? (
              <div className="text-center py-8 text-gray-400 space-y-1">
                <p className="text-sm">Nenhuma movimentação recente</p>
                <p className="text-xs text-gray-500">As entradas e saídas de peças e uniformes aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {recentMovements.slice(0, 6).map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-700/70 bg-seguranca-black/40 hover:bg-seguranca-black/60 transition-all text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                        movement.movementType === 'ENTRADA' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {movement.movementType === 'ENTRADA' ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {movement.stockItemFullName}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {movement.movementType === 'ENTRADA' ? '+' : '-'}{movement.quantity} un
                          {movement.employeeName ? ` • ${movement.employeeName}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                      {new Date(movement.movementDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Categorias */}
      {categoryStats.length > 0 && (
        <Card className="bg-seguranca-graphite border-gray-700/70 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-blue-400" />
              Principais Categorias em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              {categoryStats.map(([catName, count], idx) => {
                const total = stockItems.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={idx} className="p-3 rounded-xl bg-seguranca-black/40 border border-gray-700/60">
                    <div className="text-xs font-medium text-gray-300 truncate">{catName}</div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-lg font-bold text-white">{count}</span>
                      <span className="text-xs text-seguranca-yellow font-mono">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-seguranca-red h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
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
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              {importing ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Upload size={16} className="mr-2" />
              )}
              Importar Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
            />
            
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
              variant="outline"
              onClick={() => setShowGlobalLabelModal(true)}
              className="border-yellow-600/70 text-seguranca-yellow hover:bg-yellow-500/10 hover:border-seguranca-yellow"
            >
              <Printer size={16} className="mr-2" />
              Etiquetas Pimaco
            </Button>
            
            <Button 
              onClick={handleCreateItem}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white shadow-lg shadow-seguranca-red/20"
            >
              <Plus size={20} className="mr-2" />
              Novo Item
            </Button>
          </div>
        </div>

        {/* Tabs com Container Deslizável Suave (Visualiza todas as 11 abas sem corte) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700/60 scrollbar-track-transparent">
            <TabsList className="inline-flex h-auto p-1.5 bg-seguranca-graphite/90 border border-gray-700/70 rounded-2xl gap-1.5 backdrop-blur-md min-w-max shadow-xl">
              <TabsTrigger 
                value="dashboard" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-2 text-seguranca-yellow" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="items" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <Package className="h-3.5 w-3.5 mr-2 text-blue-400" />
                Itens ({stockItems.length})
              </TabsTrigger>
              <TabsTrigger 
                value="movements" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                Movimentações
              </TabsTrigger>
              <TabsTrigger 
                value="alerts" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <Bell className="h-3.5 w-3.5 mr-2 text-red-400" />
                Alertas ({Array.isArray(activeAlerts) ? activeAlerts.length : 0})
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <FileText className="h-3.5 w-3.5 mr-2 text-purple-400" />
                Relatórios
              </TabsTrigger>
              <TabsTrigger 
                value="work-orders" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <Wrench className="h-3.5 w-3.5 mr-2 text-cyan-400" />
                Ordens de Serviço (OS)
              </TabsTrigger>
              <TabsTrigger 
                value="tires" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <CircleDot className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                Pneus da Frota
              </TabsTrigger>
              <TabsTrigger 
                value="batteries" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <BatteryCharging className="h-3.5 w-3.5 mr-2 text-amber-400" />
                Baterias
              </TabsTrigger>
              <TabsTrigger 
                value="inventory" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <ClipboardCheck className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                Inventário & Auditoria
              </TabsTrigger>
              <TabsTrigger 
                value="requisitions" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-2 text-yellow-400" />
                Requisições / Compras
              </TabsTrigger>
              <TabsTrigger 
                value="epi-forms" 
                className="data-[state='active']:bg-gradient-to-r data-[state='active']:from-seguranca-red data-[state='active']:to-seguranca-darkred data-[state='active']:text-white data-[state='active']:shadow-md border border-transparent rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:text-white"
              >
                <HardHat className="h-3.5 w-3.5 mr-2 text-orange-400" />
                Fichas de EPI
              </TabsTrigger>
            </TabsList>
          </div>

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
            <StockReportsContent />
          </TabsContent>

          <TabsContent value="work-orders" className="mt-6">
            <StockWorkOrdersTab onGoToRequisitions={() => setActiveTab('requisitions')} />
          </TabsContent>

          <TabsContent value="tires" className="mt-6">
            <StockTiresTab />
          </TabsContent>

          <TabsContent value="batteries" className="mt-6">
            <StockBatteriesTab />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <StockInventoryAuditTab />
          </TabsContent>

          <TabsContent value="requisitions" className="mt-6">
            <StockRequisitionsTab onRefreshStock={handleRefresh} />
          </TabsContent>

          <TabsContent value="epi-forms" className="mt-6">
            <StockEpiDeliveryFormsTab />
          </TabsContent>
        </Tabs>

        {/* Modais */}
        <StockItemModal
          open={showItemModal}
          onOpenChange={setShowItemModal}
          item={selectedItem}
          existingItems={stockItems}
          onSave={handleRefresh}
        />

        <StockLabelPrintModal
          open={showGlobalLabelModal}
          onOpenChange={setShowGlobalLabelModal}
          items={stockItems}
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