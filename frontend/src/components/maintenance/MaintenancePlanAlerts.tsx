import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  DollarSign, 
  Car, 
  Settings, 
  Bell, 
  Info, 
  X, 
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import maintenancePlanService from '@/services/maintenancePlanService';
import { MaintenancePlanAlert } from '@/services/maintenancePlanService';

interface MaintenancePlanAlertsProps {
  planId?: string;
  clientId?: string;
  showOnlyUnacknowledged?: boolean;
}

export default function MaintenancePlanAlerts({ 
  planId, 
  clientId, 
  showOnlyUnacknowledged = false 
}: MaintenancePlanAlertsProps) {
  const [alerts, setAlerts] = useState<MaintenancePlanAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<MaintenancePlanAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, [planId, clientId]);

  useEffect(() => {
    filterAlerts();
  }, [alerts, activeTab, severityFilter, typeFilter, showOnlyUnacknowledged]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      let alertsData: MaintenancePlanAlert[] = [];

      if (planId) {
        alertsData = await maintenancePlanService.getPlanAlerts(planId);
      } else {
        // Load alerts for all plans (would need to implement getAllAlerts in service)
        // For now, we'll use the plan alerts as sample data
        alertsData = await maintenancePlanService.getPlanAlerts('plan-001');
      }

      setAlerts(alertsData);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    // Filter by acknowledgment
    if (showOnlyUnacknowledged) {
      filtered = filtered.filter(alert => !alert.acknowledged);
    }

    // Filter by tab
    if (activeTab === 'unacknowledged') {
      filtered = filtered.filter(alert => !alert.acknowledged);
    } else if (activeTab === 'acknowledged') {
      filtered = filtered.filter(alert => alert.acknowledged);
    }

    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.alertType === typeFilter);
    }

    setFilteredAlerts(filtered);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      // Update alert in local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              acknowledged: true, 
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: 'current-user'
            }
          : alert
      ));
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      const unacknowledgedAlerts = filteredAlerts.filter(alert => !alert.acknowledged);
      
      setAlerts(prev => prev.map(alert => 
        unacknowledgedAlerts.includes(alert)
          ? { 
              ...alert, 
              acknowledged: true, 
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: 'current-user'
            }
          : alert
      ));
    } catch (error) {
      console.error('Erro ao reconhecer todos os alertas:', error);
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'PLAN_EXPIRY':
        return <Calendar className="h-4 w-4" />;
      case 'USAGE_LIMIT':
        return <TrendingUp className="h-4 w-4" />;
      case 'PAYMENT_DUE':
        return <DollarSign className="h-4 w-4" />;
      case 'SERVICE_DUE':
        return <Car className="h-4 w-4" />;
      case 'RENEWAL_REMINDER':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'Crítico';
      case 'HIGH':
        return 'Alto';
      case 'MEDIUM':
        return 'Médio';
      case 'LOW':
        return 'Baixo';
      default:
        return severity;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'PLAN_EXPIRY':
        return 'Vencimento do Plano';
      case 'USAGE_LIMIT':
        return 'Limite de Utilização';
      case 'PAYMENT_DUE':
        return 'Pagamento Due';
      case 'SERVICE_DUE':
        return 'Serviço Due';
      case 'RENEWAL_REMINDER':
        return 'Lembrete de Renovação';
      default:
        return alertType;
    }
  };

  const getAlertStats = () => {
    const total = alerts.length;
    const unacknowledged = alerts.filter(a => !a.acknowledged).length;
    const critical = alerts.filter(a => a.severity === 'CRITICAL').length;
    const high = alerts.filter(a => a.severity === 'HIGH').length;
    
    return { total, unacknowledged, critical, high };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = getAlertStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas e Notificações
          </h3>
          <p className="text-sm text-muted-foreground">
            {showOnlyUnacknowledged 
              ? 'Alertas pendentes de reconhecimento' 
              : 'Todos os alertas do sistema'
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadAlerts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {filteredAlerts.some(a => !a.acknowledged) && (
            <Button onClick={handleAcknowledgeAll}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Reconhecer Todos
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alertas</CardTitle>
            <Bell className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unacknowledged}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Críticos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alta Prioridade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Severidades</SelectItem>
                <SelectItem value="CRITICAL">Crítico</SelectItem>
                <SelectItem value="HIGH">Alto</SelectItem>
                <SelectItem value="MEDIUM">Médio</SelectItem>
                <SelectItem value="LOW">Baixo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="PLAN_EXPIRY">Vencimento do Plano</SelectItem>
                <SelectItem value="USAGE_LIMIT">Limite de Utilização</SelectItem>
                <SelectItem value="PAYMENT_DUE">Pagamento Due</SelectItem>
                <SelectItem value="SERVICE_DUE">Serviço Due</SelectItem>
                <SelectItem value="RENEWAL_REMINDER">Lembrete de Renovação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todos ({alerts.length})</TabsTrigger>
          <TabsTrigger value="unacknowledged">Pendentes ({stats.unacknowledged})</TabsTrigger>
          <TabsTrigger value="acknowledged">Reconhecidos ({stats.total - stats.unacknowledged})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <AlertList 
            alerts={filteredAlerts}
            onAcknowledge={handleAcknowledgeAlert}
            getAlertIcon={getAlertIcon}
            getAlertColor={getAlertColor}
            getSeverityLabel={getSeverityLabel}
            getAlertTypeLabel={getAlertTypeLabel}
          />
        </TabsContent>

        <TabsContent value="unacknowledged" className="space-y-4">
          <AlertList 
            alerts={filteredAlerts}
            onAcknowledge={handleAcknowledgeAlert}
            getAlertIcon={getAlertIcon}
            getAlertColor={getAlertColor}
            getSeverityLabel={getSeverityLabel}
            getAlertTypeLabel={getAlertTypeLabel}
          />
        </TabsContent>

        <TabsContent value="acknowledged" className="space-y-4">
          <AlertList 
            alerts={filteredAlerts}
            onAcknowledge={handleAcknowledgeAlert}
            getAlertIcon={getAlertIcon}
            getAlertColor={getAlertColor}
            getSeverityLabel={getSeverityLabel}
            getAlertTypeLabel={getAlertTypeLabel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AlertListProps {
  alerts: MaintenancePlanAlert[];
  onAcknowledge: (alertId: string) => void;
  getAlertIcon: (type: string) => React.ReactNode;
  getAlertColor: (severity: string) => string;
  getSeverityLabel: (severity: string) => string;
  getAlertTypeLabel: (type: string) => string;
}

function AlertList({ 
  alerts, 
  onAcknowledge, 
  getAlertIcon, 
  getAlertColor, 
  getSeverityLabel, 
  getAlertTypeLabel 
}: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum alerta encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Alert key={alert.id} className={getAlertColor(alert.severity)}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.alertType)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{alert.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {getSeverityLabel(alert.severity)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getAlertTypeLabel(alert.alertType)}
                  </Badge>
                  {alert.acknowledged && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Reconhecido
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleDateString('pt-BR')} {new Date(alert.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {alert.actionRequired && (
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                  )}
                  {!alert.acknowledged && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Reconhecer
                    </Button>
                  )}
                </div>
              </div>
              
              <AlertDescription className="text-sm">
                {alert.message}
              </AlertDescription>
              
              {alert.dueDate && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Vencimento: {new Date(alert.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              
              {alert.acknowledged && alert.acknowledgedAt && (
                <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>
                    Reconhecido por {alert.acknowledgedBy} em {new Date(alert.acknowledgedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}
