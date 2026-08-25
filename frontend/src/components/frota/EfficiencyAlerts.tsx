import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Wrench,
  Gauge,
  Fuel,
  DollarSign,
  Car,
  X,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Shield,
  Settings,
  Phone,
  Mail,
} from 'lucide-react';
import { vehicleFuelEfficiencyService, VehicleFuelEfficiency } from '@/services/vehicleFuelEfficiencyService';

interface EfficiencyAlertsProps {
  /** Dados de eficiência já carregados (opcional — se não fornecido, busca da API) */
  efficiencyData?: VehicleFuelEfficiency[];
  /** Mostrar como banner compacto (para uso em dashboards) */
  compact?: boolean;
  /** Callback quando o usuário clica em um alerta */
  onAlertClick?: (vehicle: VehicleFuelEfficiency, alertType: string) => void;
  /** Callback para dispensar alerta */
  onDismiss?: (vehicleId: string) => void;
}

type AlertSeverity = 'critical' | 'warning' | 'info' | 'positive';

interface EfficiencyAlert {
  id: string;
  vehicle: VehicleFuelEfficiency;
  severity: AlertSeverity;
  type: string;
  title: string;
  message: string;
  recommendation: string;
  deviation: number; // % de desvio da média
  potentialSavings: number; // economia potencial em R$
  icon: React.ReactNode;
}

// Thresholds configuráveis
const THRESHOLDS = {
  critical: -25,    // 25% abaixo da média = crítico
  warning: -15,     // 15% abaixo da média = alerta
  info: -5,         // 5% abaixo da média = informativo
  excellent: 20,    // 20% acima da média = excelente
};

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatKm(value: number): string {
  return `${value.toLocaleString('pt-BR')} km`;
}

const EfficiencyAlerts: React.FC<EfficiencyAlertsProps> = ({
  efficiencyData: propData,
  compact = false,
  onAlertClick,
  onDismiss,
}) => {
  const [efficiencyData, setEfficiencyData] = useState<VehicleFuelEfficiency[]>(propData || []);
  const [isLoading, setIsLoading] = useState(!propData);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    if (propData && propData.length > 0) {
      setEfficiencyData(propData);
      setIsLoading(false);
    } else if (!propData) {
      loadData();
    }
  }, [propData]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await vehicleFuelEfficiencyService.getAllVehiclesEfficiency();
      setEfficiencyData(data);
    } catch (err) {
      console.error('Erro ao carregar dados de eficiência:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular média da frota
  const fleetAvg = useMemo(() => {
    const valid = efficiencyData.filter((e) => e.efficiencyKmPerLiter > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((sum, e) => sum + e.efficiencyKmPerLiter, 0) / valid.length;
  }, [efficiencyData]);

  // Gerar alertas
  const alerts = useMemo((): EfficiencyAlert[] => {
    if (fleetAvg === 0) return [];

    const result: EfficiencyAlert[] = [];

    efficiencyData.forEach((vehicle) => {
      if (!vehicle.efficiencyKmPerLiter || vehicle.efficiencyKmPerLiter <= 0) return;

      const deviation = ((vehicle.efficiencyKmPerLiter - fleetAvg) / fleetAvg) * 100;

      // Calcular economia potencial (se atingisse a média)
      const avgConsumptionPerKm = fleetAvg > 0 ? 1 / fleetAvg : 0;
      const vehicleConsumptionPerKm = vehicle.consumptionLPerKm || 0;
      const excessConsumption = vehicleConsumptionPerKm - avgConsumptionPerKm;
      const potentialSavingsPerKm = excessConsumption > 0 ? excessConsumption * (vehicle.totalCost / (vehicle.totalFuelConsumed || 1)) : 0;
      const potentialSavings = potentialSavingsPerKm * (vehicle.totalDistance || 0);

      // Alerta CRÍTICO
      if (deviation <= THRESHOLDS.critical) {
        result.push({
          id: `critical-${vehicle.vehicleId}`,
          vehicle,
          severity: 'critical',
          type: 'EFFICIENCY_CRITICAL',
          title: `${vehicle.vehiclePlate} — Eficiência Crítica`,
          message: `Eficiência ${Math.abs(deviation).toFixed(0)}% abaixo da média da frota (${vehicle.efficiencyKmPerLiter.toFixed(2)} vs ${fleetAvg.toFixed(2)} km/L)`,
          recommendation: 'Verificar imediatamente: pneus, filtro de ar, injetores, nivelamento do motor. Considerar revisão mecânica urgente.',
          deviation,
          potentialSavings,
          icon: <AlertOctagon className="h-5 w-5 text-red-400" />,
        });
      }
      // Alerta WARNING
      else if (deviation <= THRESHOLDS.warning) {
        result.push({
          id: `warning-${vehicle.vehicleId}`,
          vehicle,
          severity: 'warning',
          type: 'EFFICIENCY_WARNING',
          title: `${vehicle.vehiclePlate} — Eficiência Abaixo do Esperado`,
          message: `Eficiência ${Math.abs(deviation).toFixed(0)}% abaixo da média (${vehicle.efficiencyKmPerLiter.toFixed(2)} vs ${fleetAvg.toFixed(2)} km/L)`,
          recommendation: 'Agendar manutenção preventiva: verificar alinhamento, balanceamento, filtro de combustível e pressão dos pneus.',
          deviation,
          potentialSavings,
          icon: <AlertTriangle className="h-5 w-5 text-orange-400" />,
        });
      }
      // Alerta INFO
      else if (deviation <= THRESHOLDS.info) {
        result.push({
          id: `info-${vehicle.vehicleId}`,
          vehicle,
          severity: 'info',
          type: 'EFFICIENCY_INFO',
          title: `${vehicle.vehiclePlate} — Eficiência Levemente Abaixo`,
          message: `Eficiência ${Math.abs(deviation).toFixed(0)}% abaixo da média (${vehicle.efficiencyKmPerLiter.toFixed(2)} vs ${fleetAvg.toFixed(2)} km/L)`,
          recommendation: 'Monitorar consumo nos próximos abastecimentos. Verificar se há hábitos de condução que possam ser otimizados.',
          deviation,
          potentialSavings,
          icon: <Info className="h-5 w-5 text-blue-400" />,
        });
      }
      // Alerta POSITIVO (eficiência excelente)
      else if (deviation >= THRESHOLDS.excellent) {
        result.push({
          id: `positive-${vehicle.vehicleId}`,
          vehicle,
          severity: 'positive',
          type: 'EFFICIENCY_EXCELLENT',
          title: `${vehicle.vehiclePlate} — Eficiência Excepcional`,
          message: `Eficiência ${deviation.toFixed(0)}% acima da média da frota (${vehicle.efficiencyKmPerLiter.toFixed(2)} vs ${fleetAvg.toFixed(2)} km/L)`,
          recommendation: 'Veículo como referência! Documentar práticas de condução e manutenção deste motorista/veículo.',
          deviation,
          potentialSavings: 0,
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
        });
      }
    });

    // Ordenar: críticos primeiro, depois warning, info, positivos
    const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2, positive: 3 };
    return result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [efficiencyData, fleetAvg]);

  // Filtrar alertas dispensados
  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  // Estatísticas de alertas
  const alertStats = useMemo(() => {
    const critical = alerts.filter((a) => a.severity === 'critical').length;
    const warning = alerts.filter((a) => a.severity === 'warning').length;
    const info = alerts.filter((a) => a.severity === 'info').length;
    const positive = alerts.filter((a) => a.severity === 'positive').length;
    const totalSavings = alerts
      .filter((a) => a.severity !== 'positive')
      .reduce((sum, a) => sum + a.potentialSavings, 0);

    return { critical, warning, info, positive, totalSavings, total: alerts.length };
  }, [alerts]);

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  const toggleExpand = (alertId: string) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  const getSeverityBg = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'critical': return 'bg-red-900/20 border-red-800/50';
      case 'warning': return 'bg-orange-900/20 border-orange-800/50';
      case 'info': return 'bg-blue-900/20 border-blue-800/50';
      case 'positive': return 'bg-green-900/20 border-green-800/50';
    }
  };

  const getSeverityBadge = (severity: AlertSeverity): { bg: string; text: string; label: string } => {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-900/50', text: 'text-red-300', label: 'CRÍTICO' };
      case 'warning': return { bg: 'bg-orange-900/50', text: 'text-orange-300', label: 'ALERTA' };
      case 'info': return { bg: 'bg-blue-900/50', text: 'text-blue-300', label: 'INFORMAÇÃO' };
      case 'positive': return { bg: 'bg-green-900/50', text: 'text-green-300', label: 'EXCELENTE' };
    }
  };

  if (isLoading) return null;
  if (alerts.length === 0 && !compact) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-400 mb-3" />
            <h3 className="text-seguranca-lightgray text-lg font-semibold mb-1">
              Todos os veículos eficientes!
            </h3>
            <p className="text-gray-400 text-sm text-center">
              Nenhum veículo com eficiência significativamente abaixo da média foi identificado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modo compacto — apenas banner resumido
  if (compact) {
    if (alertStats.critical === 0 && alertStats.warning === 0) return null;

    return (
      <div className={`rounded-lg border p-3 ${
        alertStats.critical > 0
          ? 'bg-red-900/20 border-red-800/50'
          : 'bg-orange-900/20 border-orange-800/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {alertStats.critical > 0 ? (
              <AlertOctagon className="h-5 w-5 text-red-400 animate-pulse" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-200">
                {alertStats.critical > 0 && (
                  <span className="text-red-400">{alertStats.critical} crítico{alertStats.critical > 1 ? 's' : ''}</span>
                )}
                {alertStats.critical > 0 && alertStats.warning > 0 && <span className="text-gray-500"> • </span>}
                {alertStats.warning > 0 && (
                  <span className="text-orange-400">{alertStats.warning} alerta{alertStats.warning > 1 ? 's' : ''}</span>
                )}
                {' '}de eficiência
              </p>
              {alertStats.totalSavings > 0 && (
                <p className="text-xs text-gray-400">
                  Economia potencial: <span className="text-green-400 font-medium">{formatCurrency(alertStats.totalSavings)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modo completo — dashboard de alertas
  return (
    <div className="space-y-4">
      {/* Header com Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-5 w-5 text-yellow-400" />
            {(alertStats.critical > 0 || alertStats.warning > 0) && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <h3 className="text-seguranca-lightgray font-semibold">
            Alertas de Eficiência
          </h3>
          <span className="text-xs text-gray-400">
            ({visibleAlerts.length} ativo{visibleAlerts.length !== 1 ? 's' : ''})
          </span>
        </div>
        <Button
          onClick={() => setAlertsEnabled(!alertsEnabled)}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          {alertsEnabled ? <Bell className="h-4 w-4 mr-1" /> : <BellOff className="h-4 w-4 mr-1" />}
          {alertsEnabled ? 'Ativos' : 'Pausados'}
        </Button>
      </div>

      {/* Resumo dos Alertas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Críticos</p>
                <p className="text-lg font-bold text-red-400">{alertStats.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Alertas</p>
                <p className="text-lg font-bold text-orange-400">{alertStats.warning}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Informativos</p>
                <p className="text-lg font-bold text-blue-400">{alertStats.info}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Economia Potencial</p>
                <p className="text-sm font-bold text-green-400">{formatCurrency(alertStats.totalSavings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-2">
        {visibleAlerts.map((alert) => {
          const badge = getSeverityBadge(alert.severity);
          const isExpanded = expandedAlert === alert.id;

          return (
            <Card
              key={alert.id}
              className={`bg-seguranca-graphite border transition-all cursor-pointer hover:border-gray-500 ${getSeverityBg(alert.severity)}`}
              onClick={() => toggleExpand(alert.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">{alert.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="text-sm font-medium text-gray-200 truncate">{alert.title}</span>
                      </div>
                      <p className="text-xs text-gray-400">{alert.message}</p>

                      {/* Expandido */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
                          {/* Dados do veículo */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Eficiência:</span>
                              <span className="ml-1 text-gray-300 font-medium">
                                {alert.vehicle.efficiencyKmPerLiter.toFixed(2)} km/L
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Consumo:</span>
                              <span className="ml-1 text-gray-300 font-medium">
                                {(alert.vehicle.consumptionLPerKm || 0).toFixed(3)} L/km
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Custo/km:</span>
                              <span className="ml-1 text-gray-300 font-medium">
                                R$ {(alert.vehicle.costPerKm || 0).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Distância:</span>
                              <span className="ml-1 text-gray-300 font-medium">
                                {formatKm(alert.vehicle.totalDistance || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Recomendação */}
                          <div className={`p-2 rounded-md text-xs ${
                            alert.severity === 'critical' ? 'bg-red-900/30 text-red-300' :
                            alert.severity === 'warning' ? 'bg-orange-900/30 text-orange-300' :
                            alert.severity === 'positive' ? 'bg-green-900/30 text-green-300' :
                            'bg-blue-900/30 text-blue-300'
                          }`}>
                            <div className="flex items-start gap-2">
                              <Wrench className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span>{alert.recommendation}</span>
                            </div>
                          </div>

                          {/* Economia potencial */}
                          {alert.potentialSavings > 0 && (
                            <div className="flex items-center gap-2 text-xs bg-green-900/20 p-2 rounded-md">
                              <DollarSign className="h-3.5 w-3.5 text-green-400" />
                              <span className="text-green-300">
                                Economia potencial se atingir a média: <strong>{formatCurrency(alert.potentialSavings)}</strong>
                              </span>
                            </div>
                          )}

                          {/* Botões de ação */}
                          <div className="flex gap-2 mt-1">
                            {onAlertClick && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-gray-600 text-gray-400 hover:bg-gray-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAlertClick(alert.vehicle, alert.type);
                                }}
                              >
                                <Car className="h-3 w-3 mr-1" />
                                Ver Veículo
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(alert.id);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-300"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={(e) => handleDismiss(alert.id, e)}
                      className="p-1 text-gray-500 hover:text-red-400"
                      title="Dispensar alerta"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legenda */}
      {visibleAlerts.length > 0 && (
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="text-gray-400 font-medium">Critérios:</span>
              <span className="text-gray-300">
                <span className="text-red-400 font-medium">Crítico:</span> ≥25% abaixo da média
              </span>
              <span className="text-gray-300">
                <span className="text-orange-400 font-medium">Alerta:</span> ≥15% abaixo
              </span>
              <span className="text-gray-300">
                <span className="text-blue-400 font-medium">Info:</span> ≥5% abaixo
              </span>
              <span className="text-gray-300">
                <span className="text-green-400 font-medium">Excelente:</span> ≥20% acima
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EfficiencyAlerts;
