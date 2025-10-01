import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Eye, 
  RefreshCw,
  Package,
  Calendar
} from 'lucide-react';
import { StockAlert } from '@/types/stock';
import { stockService } from '@/services/stockService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StockAlertsPanelProps {
  alerts: StockAlert[];
  onRefresh: () => void;
}

const StockAlertsPanel: React.FC<StockAlertsPanelProps> = ({
  alerts: initialAlerts,
  onRefresh
}) => {
  const [alerts, setAlerts] = useState<StockAlert[]>(initialAlerts);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await stockService.markAlertAsRead(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
      toast({
        title: 'Sucesso',
        description: 'Alerta marcado como lido.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao marcar alerta como lido.',
        variant: 'destructive'
      });
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await stockService.resolveAlert(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isResolved: true } : alert
      ));
      toast({
        title: 'Sucesso',
        description: 'Alerta resolvido com sucesso.',
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao resolver alerta.',
        variant: 'destructive'
      });
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 4:
        return <Badge variant="destructive">Crítico</Badge>;
      case 3:
        return <Badge variant="secondary" className="border-red-500 text-red-600">Alto</Badge>;
      case 2:
        return <Badge variant="secondary" className="border-orange-500 text-orange-600">Médio</Badge>;
      default:
        return <Badge variant="outline">Baixo</Badge>;
    }
  };

  const getPriorityIcon = (priority: number) => {
    return priority >= 3 ? 
      <AlertTriangle className="h-5 w-5 text-red-500" /> : 
      <Bell className="h-5 w-5 text-orange-500" />;
  };

  const activeAlerts = alerts.filter(alert => !alert.isResolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.priority >= 3);
  const unreadAlerts = activeAlerts.filter(alert => !alert.isRead);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-seguranca-lightgray">Alertas de Estoque</h2>
          <p className="text-gray-400">
            Notificações automáticas de baixo estoque e problemas
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} className="border-gray-600 text-seguranca-lightgray">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Alertas Ativos</p>
                <p className="text-2xl font-bold text-seguranca-lightgray">{activeAlerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-seguranca-yellow" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Críticos</p>
                <p className="text-2xl font-bold text-red-500">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Não Lidos</p>
                <p className="text-2xl font-bold text-orange-500">{unreadAlerts.length}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alertas */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <AlertTriangle className="h-5 w-5" />
            Alertas Ativos ({activeAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                Nenhum alerta ativo
              </h3>
              <p className="text-gray-400">
                Todos os itens estão com estoque adequado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 border rounded-lg ${
                    alert.isRead ? 'border-gray-600' : 'border-orange-500 bg-orange-900/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getPriorityIcon(alert.priority)}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-seguranca-lightgray">
                            {alert.stockItemName}
                          </h4>
                          {getPriorityBadge(alert.priority)}
                          {!alert.isRead && (
                            <Badge variant="outline" className="border-orange-500 text-orange-600">
                              Novo
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-2">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>Código: {alert.stockItemCode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(alert.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {!alert.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Marcar Lido
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="border-green-600 text-green-600 hover:bg-green-900/20"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAlertsPanel;