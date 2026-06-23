import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Gauge, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Download, 
  RefreshCw,
  Target,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Shield,
  Wrench,
  Camera,
  FileText,
  Database,
  Cpu,
  Ruler,
  Thermometer,
  Map
} from 'lucide-react';
import precisionMeasurementService from '@/services/precisionMeasurementService';
import { PrecisionMeasurement, MeasurementFilter } from '@/services/precisionMeasurementService';
import PrecisionMeasurementView from '@/components/quality/PrecisionMeasurementView';
import PrecisionMeasurementForm from '@/components/quality/PrecisionMeasurementForm';

export default function PrecisionMeasurementManagement() {
  const [devices, setDevices] = useState<PrecisionMeasurement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<PrecisionMeasurement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [calibrationFilter, setCalibrationFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('devices');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDevices();
  }, [devices, searchTerm, statusFilter, typeFilter, calibrationFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesData, statsData] = await Promise.all([
        precisionMeasurementService.getAllDevices(),
        precisionMeasurementService.getMeasurementStats()
      ]);
      
      setDevices(devicesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDevices = () => {
    const filter: MeasurementFilter = {
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    };
    
    // Apply filters (in real app, this would call the service)
    console.log('Applying filters:', filter);
  };

  const handleViewDevice = (device: PrecisionMeasurement) => {
    setSelectedDevice(device);
    setShowViewModal(true);
  };

  const handleEditDevice = (device: PrecisionMeasurement) => {
    setSelectedDevice(device);
    setShowCreateModal(true);
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este dispositivo de medição?')) {
      return;
    }

    try {
      await precisionMeasurementService.deleteDevice(deviceId);
      await loadData();
      setShowViewModal(false);
    } catch (error) {
      console.error('Erro ao excluir dispositivo:', error);
      alert('Erro ao excluir dispositivo');
    }
  };

  const handleSaveDevice = async (device: PrecisionMeasurement) => {
    await loadData();
    setShowCreateModal(false);
    setSelectedDevice(null);
  };

  const handleEditDevice = (device: PrecisionMeasurement) => {
    setSelectedDevice(device);
    setShowCreateModal(true);
  };

  const getDeviceTypeLabel = (type: string) => precisionMeasurementService.getDeviceTypeLabel(type);
  const getStatusLabel = (status: string) => precisionMeasurementService.getStatusLabel(status);
  const getCalibrationStatusLabel = (status: string) => precisionMeasurementService.getCalibrationStatusLabel(status);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Medição com Precisão</h1>
          <p className="text-muted-foreground">Controle de instrumentos de medição e qualidade dimensional</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Dispositivo
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dispositivos Ativos</CardTitle>
              <Gauge className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{devices.filter(d => d.status === 'ACTIVE').length}</div>
              <p className="text-xs text-muted-foreground">
                {devices.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calibrações Válidas</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{devices.filter(d => d.calibrationStatus === 'VALID').length}</div>
              <p className="text-xs text-muted-foreground">
                {stats.calibrationDue} vencidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Yield</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.yield.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.ppm} ppm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Capacidade do Processo</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Cp: {stats.cp.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Cpk: {stats.cpk.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="measurements">Medições</TabsTrigger>
          <TabsTrigger value="calibration">Calibração</TabsTrigger>
          <TabsTrigger value="gauge-studies">Estudos R&R</TabsTrigger>
          <TabsTrigger value="quality-plans">Planos QC</TabsTrigger>
          <TabsTrigger value="analytics">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar dispositivos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                    <SelectItem value="CALIBRATING">Calibrando</SelectItem>
                    <SelectItem value="ERROR">Erro</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="CALIPER">Paquímetro</SelectItem>
                    <SelectItem value="MICROMETER">Micrômetro</SelectItem>
                    <SelectItem value="GAUGE">Relógio Comparador</SelectItem>
                    <SelectItem value="LASER">Medidor Laser</SelectItem>
                    <SelectItem value="CMM">Máquina CMM</SelectItem>
                    <SelectItem value="OPTICAL">Projetor de Perfil</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={calibrationFilter} onValueChange={setCalibrationFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Calibração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="VALID">Válida</SelectItem>
                    <SelectItem value="EXPIRED">Expirada</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="FAILED">Falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Devices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Dispositivos de Medição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Dispositivo</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Calibração</th>
                      <th className="text-left p-2">Localização</th>
                      <th className="text-left p-2">Especificações</th>
                      <th className="text-left p-2">Estatísticas</th>
                      <th className="text-left p-2">Operador</th>
                      <th className="text-center p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr key={device.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">{device.deviceName}</div>
                              <div className="text-sm text-muted-foreground">{device.serialNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {getDeviceTypeLabel(device.deviceType)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={
                            device.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            device.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' :
                            device.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {getStatusLabel(device.status)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={
                            device.calibrationStatus === 'VALID' ? 'bg-green-100 text-green-800' :
                            device.calibrationStatus === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                            device.calibrationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {getCalibrationStatusLabel(device.calibrationStatus)}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            Próxima: {new Date(device.nextCalibrationDate).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div>{device.location.area}</div>
                            <div className="text-muted-foreground">{device.location.workstation}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div>{device.specifications.range.min}-{device.specifications.range.max} {device.specifications.range.unit}</div>
                            <div className="text-muted-foreground">
                              Res: {device.specifications.resolution} | Prec: ±{device.specifications.accuracy.value}{device.specifications.accuracy.unit}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div>{device.statistics.totalMeasurements} medições</div>
                            <div className="text-muted-foreground">
                              Cp: {device.statistics.cp.toFixed(2)} | Cpk: {device.statistics.cpk.toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">{device.operator}</div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDevice(device)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDevice(device)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDevice(device.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Medições Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Database className="h-12 w-12 mx-auto mb-4" />
                  <p>Interface de medições será implementada</p>
                  <p className="text-sm mt-2">Registro de medições dimensionais e análise de tolerâncias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calibration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestão de Calibração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4" />
                  <p>Interface de calibração será implementada</p>
                  <p className="text-sm mt-2">Agendamento, registros e certificados de calibração</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gauge-studies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estudos de R&R
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p>Interface de estudos R&R será implementada</p>
                  <p className="text-sm mt-2">Análise de repetibilidade e reprodutibilidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality-plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Planos de Controle de Qualidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4" />
                  <p>Interface de planos QC será implementada</p>
                  <p className="text-sm mt-2">Planos de amostragem e critérios de aceitação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Tendências de Qualidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de tendências será implementado com biblioteca de charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição de Defeitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de distribuição será implementado com biblioteca de charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise de Capacidade do Processo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats?.cp.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Índice Cp</div>
                  <div className="text-xs text-muted-foreground mt-1">Capacidade do Processo</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats?.cpk.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Índice Cpk</div>
                  <div className="text-xs text-muted-foreground mt-1">Capacidade Indexada</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats?.yield.toFixed(2)}%</div>
                  <div className="text-sm text-muted-foreground">Taxa de Yield</div>
                  <div className="text-xs text-muted-foreground mt-1">Produtividade Qualidade</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-4">Estatísticas Mensais</h4>
                <div className="space-y-2">
                  {stats?.trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{new Date(trend.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Medições:</span>
                          <span className="font-medium">{trend.measurements}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Yield:</span>
                          <span className="font-medium text-green-600">{trend.yield.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Defeitos:</span>
                          <span className="font-medium text-red-600">{trend.defects}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Modal */}
      {showViewModal && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <PrecisionMeasurementView
              deviceId={selectedDevice.id}
              onEdit={handleEditDevice}
              onDelete={handleDeleteDevice}
              onClose={() => {
                setShowViewModal(false);
                setSelectedDevice(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <PrecisionMeasurementForm
              device={selectedDevice}
              onSave={handleSaveDevice}
              onCancel={() => {
                setShowCreateModal(false);
                setSelectedDevice(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
