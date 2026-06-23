import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Gauge, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Settings, 
  Calendar, 
  DollarSign, 
  Shield, 
  User, 
  Target, 
  Activity, 
  BarChart3, 
  Thermometer, 
  Zap, 
  Wrench, 
  Camera, 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  X,
  TrendingUp,
  AlertTriangle,
  Database,
  Cpu,
  Ruler,
  Info,
  History,
  Award,
  Filter
} from 'lucide-react';
import precisionMeasurementService from '@/services/precisionMeasurementService';
import { PrecisionMeasurement, Measurement, CalibrationRecord } from '@/services/precisionMeasurementService';

interface PrecisionMeasurementViewProps {
  deviceId: string;
  onEdit?: (device: PrecisionMeasurement) => void;
  onDelete?: (deviceId: string) => void;
  onClose?: () => void;
}

export default function PrecisionMeasurementView({ deviceId, onEdit, onDelete, onClose }: PrecisionMeasurementViewProps) {
  const [device, setDevice] = useState<PrecisionMeasurement | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [calibrationRecords, setCalibrationRecords] = useState<CalibrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDeviceData();
  }, [deviceId]);

  const loadDeviceData = async () => {
    try {
      setLoading(true);
      const [deviceData, measurementsData, calibrationData] = await Promise.all([
        precisionMeasurementService.getDeviceById(deviceId),
        precisionMeasurementService.getMeasurementsByDevice(deviceId),
        precisionMeasurementService.getCalibrationRecords(deviceId)
      ]);
      
      setDevice(deviceData);
      setMeasurements(measurementsData);
      setCalibrationRecords(calibrationData);
    } catch (error) {
      console.error('Erro ao carregar dados do dispositivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: PrecisionMeasurement['status']) => {
    if (!device) return;

    try {
      await precisionMeasurementService.updateDevice(device.id, { status: newStatus });
      await loadDeviceData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDownload = () => {
    // Implement download functionality
    alert('Download do relatório do dispositivo será implementado');
  };

  const getDeviceTypeLabel = (type: string) => precisionMeasurementService.getDeviceTypeLabel(type);
  const getStatusLabel = (status: string) => precisionMeasurementService.getStatusLabel(status);
  const getCalibrationStatusLabel = (status: string) => precisionMeasurementService.getCalibrationStatusLabel(status);
  const getMeasurementStatusLabel = (status: string) => precisionMeasurementService.getMeasurementStatusLabel(status);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Dispositivo não encontrado</p>
      </div>
    );
  }

  const daysUntilCalibration = Math.floor((new Date(device.nextCalibrationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const calibrationStatusColor = daysUntilCalibration < 0 ? 'bg-red-100 text-red-800' : 
                               daysUntilCalibration < 30 ? 'bg-orange-100 text-orange-800' : 
                               'bg-green-100 text-green-800';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gauge className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">{device.deviceName}</h2>
            <p className="text-sm text-muted-foreground">
              {device.serialNumber} • {getDeviceTypeLabel(device.deviceType)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={
            device.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            device.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' :
            device.status === 'ERROR' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }>
            {getStatusLabel(device.status)}
          </Badge>
          <Badge className={calibrationStatusColor}>
            {getCalibrationStatusLabel(device.calibrationStatus)}
          </Badge>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(device)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" onClick={() => onDelete(device.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Medições</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{device.statistics.totalMeasurements}</div>
            <p className="text-xs text-muted-foreground">
              Registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capacidade do Processo</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">Cp: {device.statistics.cp.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Cpk: {device.statistics.cpk.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Yield</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">{device.statistics.yield.toFixed(3)}%</div>
            <p className="text-xs text-muted-foreground">
              {device.statistics.ppm} ppm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calibração</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-600">
              {daysUntilCalibration > 0 ? `${daysUntilCalibration} dias` : 'Expirada'}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(device.nextCalibrationDate).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="specifications">Especificações</TabsTrigger>
          <TabsTrigger value="measurements">Medições</TabsTrigger>
          <TabsTrigger value="calibration">Calibração</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Dispositivo</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Gauge className="h-4 w-4" />
                    <span>{getDeviceTypeLabel(device.deviceType)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número de Série</label>
                  <div className="text-sm font-medium">{device.serialNumber}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Operador Responsável</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{device.operator}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Localização</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    <div>
                      <div className="text-sm">{device.location.area}</div>
                      <div className="text-xs text-muted-foreground">{device.location.workstation}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status da Calibração</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4" />
                    <Badge className={calibrationStatusColor}>
                      {getCalibrationStatusLabel(device.calibrationStatus)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Última: {new Date(device.calibrationDate).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Próxima: {new Date(device.nextCalibrationDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Especificações Principais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Faixa de Medição</label>
                  <div className="text-sm">
                    {device.specifications.range.min} - {device.specifications.range.max} {device.specifications.range.unit}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resolução</label>
                  <div className="text-sm">{device.specifications.resolution} {device.specifications.range.unit}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Precisão</label>
                  <div className="text-sm">±{device.specifications.accuracy.value} {device.specifications.accuracy.unit}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Repetibilidade</label>
                  <div className="text-sm">{device.specifications.repeatability} {device.specifications.range.unit}</div>
                </div>

                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground">Condições Operacionais</label>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>
                      <span className="font-medium">Temperatura:</span>
                      <div>{device.specifications.operatingConditions.temperature.min}°C - {device.specifications.operatingConditions.temperature.max}°C</div>
                    </div>
                    <div>
                      <span className="font-medium">Umidade:</span>
                      <div>{device.specifications.operatingConditions.humidity.min}% - {device.specifications.operatingConditions.humidity.max}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Thermometer className="h-4 w-4" />
                    <span className="text-sm">
                      {device.specifications.operatingConditions.vibration ? 'Sensível a vibração' : 'Não sensível a vibração'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas e Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {daysUntilCalibration < 30 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {daysUntilCalibration < 0 
                        ? 'A calibração deste dispositivo está expirada. Calibre imediatamente.'
                        : `A calibração vencerá em ${daysUntilCalibration} dias. Agende a calibração.`
                      }
                    </AlertDescription>
                  </Alert>
                )}

                {device.status === 'MAINTENANCE' && (
                  <Alert>
                    <Wrench className="h-4 w-4" />
                    <AlertDescription>
                      Este dispositivo está em manutenção. Verifique o status antes de usar.
                    </AlertDescription>
                  </Alert>
                )}

                {device.status === 'ERROR' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      O dispositivo está reportando erro. Verifique o diagnóstico e realize a manutenção necessária.
                    </AlertDescription>
                  </Alert>
                )}

                {device.statistics.cpk < 1.33 && (
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      O índice Cpk ({device.statistics.cpk.toFixed(2)}) está abaixo do recomendado (>1.33). 
                      Considere revisar o processo de medição.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Especificações Técnicas Completas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Especificações de Medição</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Faixa de Medição:</span>
                      <span className="text-sm">{device.specifications.range.min} - {device.specifications.range.max} {device.specifications.range.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Resolução:</span>
                      <span className="text-sm">{device.specifications.resolution} {device.specifications.range.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Precisão:</span>
                      <span className="text-sm">±{device.specifications.accuracy.value} {device.specifications.accuracy.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Repetibilidade:</span>
                      <span className="text-sm">{device.specifications.repeatability} {device.specifications.range.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Condições Operacionais</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Temperatura:</span>
                      <span className="text-sm">{device.specifications.operatingConditions.temperature.min}°C - {device.specifications.operatingConditions.temperature.max}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Umidade:</span>
                      <span className="text-sm">{device.specifications.operatingConditions.humidity.min}% - {device.specifications.operatingConditions.humidity.max}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Vibração:</span>
                      <span className="text-sm">{device.specifications.operatingConditions.vibration ? 'Sim' : 'Não'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Medições Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {measurements.length > 0 ? (
                  <div className="space-y-3">
                    {measurements.slice(0, 10).map((measurement) => (
                      <div key={measurement.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            measurement.status === 'PASS' ? 'bg-green-500' :
                            measurement.status === 'FAIL' ? 'bg-red-500' :
                            measurement.status === 'WARNING' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}></div>
                          <div>
                            <div className="font-medium">{measurement.partNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(measurement.timestamp).toLocaleDateString('pt-BR')} • {measurement.operator}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{measurement.characteristics.length} características</div>
                          <Badge className={
                            measurement.status === 'PASS' ? 'bg-green-100 text-green-800' :
                            measurement.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                            measurement.status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {getMeasurementStatusLabel(measurement.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {measurements.length > 10 && (
                      <div className="text-center py-4">
                        <Button variant="outline">
                          Ver todas as {measurements.length} medições
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma medição registrada</p>
                    <p className="text-sm">As medições realizadas aparecerão aqui</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calibration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Histórico de Calibração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calibrationRecords.length > 0 ? (
                  <div className="space-y-4">
                    {calibrationRecords.map((record) => (
                      <Card key={record.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-blue-600" />
                              <div>
                                <div className="font-medium">Calibração - {record.calibrationType}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(record.calibrationDate).toLocaleDateString('pt-BR')} • {record.laboratory}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={record.results.pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {record.results.pass ? 'Aprovada' : 'Reprovada'}
                              </Badge>
                              <div className="text-sm font-medium">R$ {record.cost.toFixed(2)}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Realizado por:</span>
                              <div>{record.performedBy}</div>
                            </div>
                            <div>
                              <span className="font-medium">Certificado:</span>
                              <div>{record.certificateNumber}</div>
                            </div>
                            <div>
                              <span className="font-medium">Próxima Calibração:</span>
                              <div>{new Date(record.nextCalibrationDate).toLocaleDateString('pt-BR')}</div>
                            </div>
                          </div>

                          {record.results.notes && (
                            <div className="mt-3 pt-3 border-t">
                              <span className="text-sm font-medium">Observações:</span>
                              <p className="text-sm text-muted-foreground mt-1">{record.results.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum registro de calibração</p>
                    <p className="text-sm">O histórico de calibrações aparecerá aqui</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas de Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Estatísticas de Medição</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total de Medições:</span>
                      <span className="text-sm font-bold">{device.statistics.totalMeasurements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Valor Médio:</span>
                      <span className="text-sm font-bold">{device.statistics.averageValue.toFixed(4)} {device.specifications.range.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Desvio Padrão:</span>
                      <span className="text-sm font-bold">{device.statistics.standardDeviation.toFixed(4)} {device.specifications.range.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Valor Mínimo:</span>
                      <span className="text-sm font-bold">{device.statistics.min.toFixed(4)} {device.specifications.range.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Valor Máximo:</span>
                      <span className="text-sm font-bold">{device.statistics.max.toFixed(4)} {device.specifications.range.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Range:</span>
                      <span className="text-sm font-bold">{device.statistics.range.toFixed(4)} {device.specifications.range.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Capacidade do Processo</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Índice Cp:</span>
                      <span className="text-sm font-bold">{device.statistics.cp.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Índice Cpk:</span>
                      <span className="text-sm font-bold">{device.statistics.cpk.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Taxa de Yield:</span>
                      <span className="text-sm font-bold">{device.statistics.yield.toFixed(3)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">PPM:</span>
                      <span className="text-sm font-bold">{device.statistics.ppm}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Interpretação dos Índices</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium text-green-600">Cp & Cpk ≥ 1.33</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Processo capaz e estável. Atende aos requisitos de qualidade.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium text-yellow-600">1.00 ≤ Cp & Cpk < 1.33</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Processo marginal. Pode melhorar com ajustes.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium text-red-600">Cp & Cpk < 1.00</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Processo incapaz. Requer melhorias significativas.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium text-blue-600">Cpk < Cp</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Processo descentralizado. Requer ajuste de centralização.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Linha do Tempo do Dispositivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Gauge className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Dispositivo Cadastrado</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(device.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {device.deviceName} • {getDeviceTypeLabel(device.deviceType)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <Shield className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Última Calibração</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(device.calibrationDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Calibração realizada e validada
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Database className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Medições Realizadas</span>
                      <span className="text-sm text-muted-foreground">
                        {device.statistics.totalMeasurements} medições
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Taxa de yield: {device.statistics.yield.toFixed(3)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Última Atualização</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(device.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Status atual: {getStatusLabel(device.status)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
