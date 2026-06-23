import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Camera, 
  Upload, 
  MapPin, 
  Gauge, 
  Settings, 
  Shield, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  FileText,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  Thermometer,
  Zap,
  Database,
  Cpu,
  Ruler,
  Wrench,
  Info
} from 'lucide-react';
import precisionMeasurementService from '@/services/precisionMeasurementService';
import { PrecisionMeasurement, MeasurementCharacteristic } from '@/services/precisionMeasurementService';

interface PrecisionMeasurementFormProps {
  device?: PrecisionMeasurement;
  onSave: (device: PrecisionMeasurement) => void;
  onCancel: () => void;
}

export default function PrecisionMeasurementForm({ device, onSave, onCancel }: PrecisionMeasurementFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [calibrationHistory, setCalibrationHistory] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    deviceId: device?.deviceId || '',
    deviceName: device?.deviceName || '',
    deviceType: device?.deviceType || 'CALIPER',
    serialNumber: device?.serialNumber || '',
    calibrationDate: device?.calibrationDate ? new Date(device.calibrationDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    nextCalibrationDate: device?.nextCalibrationDate ? new Date(device.nextCalibrationDate).toISOString().slice(0, 10) : '',
    calibrationStatus: device?.calibrationStatus || 'VALID',
    status: device?.status || 'ACTIVE',
    
    location: {
      area: device?.location.area || '',
      workstation: device?.location.workstation || '',
      coordinates: device?.location.coordinates || { x: 0, y: 0, z: 0 }
    },
    
    specifications: {
      range: {
        min: device?.specifications.range.min || 0,
        max: device?.specifications.range.max || 150,
        unit: device?.specifications.range.unit || 'mm'
      },
      resolution: device?.specifications.resolution || 0.01,
      accuracy: {
        value: device?.specifications.accuracy.value || 0.02,
        unit: device?.specifications.accuracy.unit || 'mm'
      },
      repeatability: device?.specifications.repeatability || 0.01,
      operatingConditions: {
        temperature: {
          min: device?.specifications.operatingConditions.temperature.min || 10,
          max: device?.specifications.operatingConditions.temperature.max || 30,
          unit: device?.specifications.operatingConditions.temperature.unit || '°C'
        },
        humidity: {
          min: device?.specifications.operatingConditions.humidity.min || 30,
          max: device?.specifications.operatingConditions.humidity.max || 80,
          unit: device?.specifications.operatingConditions.humidity.unit || '%'
        },
        vibration: device?.specifications.operatingConditions.vibration || false
      }
    },
    
    lastMaintenance: device?.lastMaintenance || new Date().toISOString().slice(0, 10),
    nextMaintenance: device?.nextMaintenance || '',
    operator: device?.operator || '',
    
    notes: device?.notes || '',
    manufacturer: device?.manufacturer || '',
    model: device?.model || '',
    purchaseDate: device?.purchaseDate || new Date().toISOString().slice(0, 10),
    purchaseCost: device?.purchaseCost || 0,
    warrantyExpiry: device?.warrantyExpiry || '',
    supplier: device?.supplier || ''
  });

  useEffect(() => {
    if (device) {
      // Load calibration history for existing device
      loadCalibrationHistory(device.id);
    }
  }, [device]);

  const loadCalibrationHistory = async (deviceId: string) => {
    try {
      const records = await precisionMeasurementService.getCalibrationRecords(deviceId);
      setCalibrationHistory(records);
    } catch (error) {
      console.error('Erro ao carregar histórico de calibração:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const deviceData = {
        ...formData,
        measurements: device?.measurements || [],
        statistics: device?.statistics || {
          totalMeasurements: 0,
          averageValue: 0,
          standardDeviation: 0,
          min: 0,
          max: 0,
          range: 0,
          cp: 0,
          cpk: 0,
          ppm: 0,
          yield: 0
        },
        alerts: device?.alerts || [],
        createdAt: device?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: device?.createdBy || 'current-user',
        updatedBy: 'current-user'
      };

      if (device) {
        // Update existing device
        const updatedDevice = await precisionMeasurementService.updateDevice(device.id, deviceData);
        onSave(updatedDevice);
      } else {
        // Create new device
        const newDevice = await precisionMeasurementService.createDevice(deviceData);
        onSave(newDevice);
      }
    } catch (error) {
      console.error('Erro ao salvar dispositivo:', error);
      alert('Erro ao salvar dispositivo. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addCalibrationRecord = () => {
    const newRecord = {
      id: `cal-${Date.now()}`,
      calibrationDate: new Date().toISOString().slice(0, 10),
      nextCalibrationDate: '',
      calibrationType: 'ROUTINE',
      performedBy: '',
      laboratory: '',
      certificateNumber: '',
      results: {
        beforeCalibration: [],
        afterCalibration: [],
        adjustments: [],
        pass: true,
        notes: ''
      },
      cost: 0,
      documents: []
    };

    setCalibrationHistory(prev => [...prev, newRecord]);
  };

  const removeCalibrationRecord = (index: number) => {
    setCalibrationHistory(prev => prev.filter((_, i) => i !== index));
  };

  const getDeviceTypeLabel = (type: string) => precisionMeasurementService.getDeviceTypeLabel(type);
  const getStatusLabel = (status: string) => precisionMeasurementService.getStatusLabel(status);
  const getCalibrationStatusLabel = (status: string) => precisionMeasurementService.getCalibrationStatusLabel(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {device ? 'Editar Dispositivo de Medição' : 'Novo Dispositivo de Medição'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {device ? 'Edite as informações do dispositivo' : 'Cadastre um novo instrumento de medição'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="specifications">Especificações</TabsTrigger>
          <TabsTrigger value="location">Localização</TabsTrigger>
          <TabsTrigger value="calibration">Calibração</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>ID do Dispositivo</Label>
                  <Input
                    value={formData.deviceId}
                    onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                    placeholder="CAL-001"
                  />
                </div>
                <div>
                  <Label>Nome do Dispositivo</Label>
                  <Input
                    value={formData.deviceName}
                    onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                    placeholder="Paquímetro Digital Mitutoyo"
                  />
                </div>
                <div>
                  <Label>Tipo de Dispositivo</Label>
                  <Select
                    value={formData.deviceType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, deviceType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CALIPER">Paquímetro</SelectItem>
                      <SelectItem value="MICROMETER">Micrômetro</SelectItem>
                      <SelectItem value="GAUGE">Relógio Comparador</SelectItem>
                      <SelectItem value="LASER">Medidor Laser</SelectItem>
                      <SelectItem value="CMM">Máquina CMM</SelectItem>
                      <SelectItem value="OPTICAL">Projetor de Perfil</SelectItem>
                      <SelectItem value="COORDINATE">Máquina de Coordenadas</SelectItem>
                      <SelectItem value="SURFACE">Rugosímetro</SelectItem>
                      <SelectItem value="THICKNESS">Medidor de Espessura</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número de Série</Label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="CD-6"PCB"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="INACTIVE">Inativo</SelectItem>
                      <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                      <SelectItem value="CALIBRATING">Calibrando</SelectItem>
                      <SelectItem value="ERROR">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Operador Responsável</Label>
                  <Input
                    value={formData.operator}
                    onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
                    placeholder="Nome do operador"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Fabricante</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="Mitutoyo"
                  />
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="CD-6"PCB"
                  />
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Nome do fornecedor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Data de Compra</Label>
                  <Input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Custo de Compra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseCost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Validade da Garantia</Label>
                  <Input
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Especificações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Faixa de Medição (Mín)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.specifications.range.min}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      specifications: { 
                        ...prev.specifications, 
                        range: { ...prev.specifications.range, min: parseFloat(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Faixa de Medição (Máx)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.specifications.range.max}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      specifications: { 
                        ...prev.specifications, 
                        range: { ...prev.specifications.range, max: parseFloat(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Select
                    value={formData.specifications.range.unit}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      specifications: { 
                        ...prev.specifications, 
                        range: { ...prev.specifications.range, unit: value }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="μm">μm</SelectItem>
                      <SelectItem value="cm">cm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Resolução</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.specifications.resolution}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      specifications: { ...prev.specifications, resolution: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.01"
                  />
                </div>
                <div>
                  <Label>Precisão (Valor)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.specifications.accuracy.value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      specifications: { 
                        ...prev.specifications, 
                        accuracy: { ...prev.specifications.accuracy, value: parseFloat(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="0.02"
                  />
                </div>
                <div>
                  <Label>Precisão (Unidade)</Label>
                  <Select
                    value={formData.specifications.accuracy.unit}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      specifications: { 
                        ...prev.specifications, 
                        accuracy: { ...prev.specifications.accuracy, unit: value }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="μm">μm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Repetibilidade</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData.specifications.repeatability}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    specifications: { ...prev.specifications, repeatability: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="0.01"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Condições Operacionais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Temperatura (Mín)</Label>
                    <Input
                      type="number"
                      value={formData.specifications.operatingConditions.temperature.min}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        specifications: { 
                          ...prev.specifications, 
                          operatingConditions: { 
                            ...prev.specifications.operatingConditions, 
                            temperature: { 
                              ...prev.specifications.operatingConditions.temperature, 
                              min: parseFloat(e.target.value) || 0 
                            }
                          }
                        }
                      }))}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label>Temperatura (Máx)</Label>
                    <Input
                      type="number"
                      value={formData.specifications.operatingConditions.temperature.max}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        specifications: { 
                          ...prev.specifications, 
                          operatingConditions: { 
                            ...prev.specifications.operatingConditions, 
                            temperature: { 
                              ...prev.specifications.operatingConditions.temperature, 
                              max: parseFloat(e.target.value) || 0 
                            }
                          }
                        }
                      }))}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label>Umidade (Mín)</Label>
                    <Input
                      type="number"
                      value={formData.specifications.operatingConditions.humidity.min}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        specifications: { 
                          ...prev.specifications, 
                          operatingConditions: { 
                            ...prev.specifications.operatingConditions, 
                            humidity: { 
                              ...prev.specifications.operatingConditions.humidity, 
                              min: parseFloat(e.target.value) || 0 
                            }
                          }
                        }
                      }))}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label>Umidade (Máx)</Label>
                    <Input
                      type="number"
                      value={formData.specifications.operatingConditions.humidity.max}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        specifications: { 
                          ...prev.specifications, 
                          operatingConditions: { 
                            ...prev.specifications.operatingConditions, 
                            humidity: { 
                              ...prev.specifications.operatingConditions.humidity, 
                              max: parseFloat(e.target.value) || 0 
                            }
                          }
                        }
                      }))}
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    checked={formData.specifications.operatingConditions.vibration}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      specifications: { 
                        ...prev.specifications, 
                        operatingConditions: { ...prev.specifications.operatingConditions, vibration: checked }
                      }
                    }))}
                  />
                  <Label>Sensível a Vibração</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização do Dispositivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Área</Label>
                  <Input
                    value={formData.location.area}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, area: e.target.value }
                    }))}
                    placeholder="Produção"
                  />
                </div>
                <div>
                  <Label>Estação de Trabalho</Label>
                  <Input
                    value={formData.location.workstation}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, workstation: e.target.value }
                    }))}
                    placeholder="WS-001"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Coordenadas (Opcional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Coordenada X</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.location.coordinates.x}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        location: { 
                          ...prev.location, 
                          coordinates: { ...prev.location.coordinates, x: parseFloat(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="10.5"
                    />
                  </div>
                  <div>
                    <Label>Coordenada Y</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.location.coordinates.y}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        location: { 
                          ...prev.location, 
                          coordinates: { ...prev.location.coordinates, y: parseFloat(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="25.3"
                    />
                  </div>
                  <div>
                    <Label>Coordenada Z</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.location.coordinates.z}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        location: { 
                          ...prev.location, 
                          coordinates: { ...prev.location.coordinates, z: parseFloat(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="1.2"
                    />
                  </div>
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
                Informações de Calibração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Status da Calibração</Label>
                  <Select
                    value={formData.calibrationStatus}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, calibrationStatus: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VALID">Válida</SelectItem>
                      <SelectItem value="EXPIRED">Expirada</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="FAILED">Falha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data da Última Calibração</Label>
                  <Input
                    type="date"
                    value={formData.calibrationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, calibrationDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Próxima Calibração</Label>
                  <Input
                    type="date"
                    value={formData.nextCalibrationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextCalibrationDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Histórico de Calibração</h4>
                  <Button onClick={addCalibrationRecord}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Registro
                  </Button>
                </div>

                <div className="space-y-4">
                  {calibrationHistory.map((record, index) => (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium">Calibração #{index + 1}</h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCalibrationRecord(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Data da Calibração</Label>
                            <Input
                              type="date"
                              value={record.calibrationDate}
                              onChange={(e) => {
                                const newHistory = [...calibrationHistory];
                                newHistory[index].calibrationDate = e.target.value;
                                setCalibrationHistory(newHistory);
                              }}
                            />
                          </div>
                          <div>
                            <Label>Próxima Calibração</Label>
                            <Input
                              type="date"
                              value={record.nextCalibrationDate}
                              onChange={(e) => {
                                const newHistory = [...calibrationHistory];
                                newHistory[index].nextCalibrationDate = e.target.value;
                                setCalibrationHistory(newHistory);
                              }}
                            />
                          </div>
                          <div>
                            <Label>Tipo de Calibração</Label>
                            <Select
                              value={record.calibrationType}
                              onValueChange={(value) => {
                                const newHistory = [...calibrationHistory];
                                newHistory[index].calibrationType = value;
                                setCalibrationHistory(newHistory);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ROUTINE">Rotina</SelectItem>
                                <SelectItem value="REPAIR">Reparo</SelectItem>
                                <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                                <SelectItem value="VERIFICATION">Verificação</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Laboratório</Label>
                            <Input
                              value={record.laboratory}
                              onChange={(e) => {
                                const newHistory = [...calibrationHistory];
                                newHistory[index].laboratory = e.target.value;
                                setCalibrationHistory(newHistory);
                              }}
                              placeholder="Nome do laboratório"
                            />
                          </div>
                          <div>
                            <Label>Realizado por</Label>
                            <Input
                              value={record.performedBy}
                              onChange={(e) => {
                                const newHistory = [...calibrationHistory];
                                newHistory[index].performedBy = e.target.value;
                                setCalibrationHistory(newHistory);
                              }}
                              placeholder="Nome do técnico"
                            />
                          </div>
                          <div>
                            <Label>Número do Certificado</Label>
                            <Input
                              value={record.certificateNumber}
                              onChange={(e) => {
                                const newHistory = [...calibrationHistory];
                                newHistory[index].certificateNumber = e.target.value;
                                setCalibrationHistory(newHistory);
                              }}
                              placeholder="CERT-001"
                            />
                          </div>
                          <div>
                            <Label>Custo (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={record.cost}
                              onChange={(e) => {
                                const newHistory = [...calibrationHistory];
                                newHistory[index].cost = parseFloat(e.target.value) || 0;
                                setCalibrationHistory(newHistory);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <Label>Observações</Label>
                          <Textarea
                            value={record.results.notes}
                            onChange={(e) => {
                              const newHistory = [...calibrationHistory];
                              newHistory[index].results.notes = e.target.value;
                              setCalibrationHistory(newHistory);
                            }}
                            placeholder="Observações sobre a calibração..."
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                          <Switch
                            checked={record.results.pass}
                            onCheckedChange={(checked) => {
                              const newHistory = [...calibrationHistory];
                              newHistory[index].results.pass = checked;
                              setCalibrationHistory(newHistory);
                            }}
                          />
                          <Label>Calibração Aprovada</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {calibrationHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhum registro de calibração adicionado</p>
                      <p className="text-sm">Clique em "Adicionar Registro" para começar</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Manutenção do Dispositivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Última Manutenção</Label>
                  <Input
                    type="date"
                    value={formData.lastMaintenance}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastMaintenance: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Próxima Manutenção</Label>
                  <Input
                    type="date"
                    value={formData.nextMaintenance}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextMaintenance: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Observações sobre Manutenção</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas sobre manutenções realizadas ou pendentes..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos do Dispositivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Fotos do Dispositivo</Label>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Carregar fotos</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="pl-1">ou arrastar e soltar</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                    </div>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="mt-1 text-xs text-gray-600 truncate">{file.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Documentos Técnicos</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Manual do Operador</div>
                        <div className="text-sm text-muted-foreground">PDF • 2.5 MB</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Certificado de Calibração</div>
                        <div className="text-sm text-muted-foreground">PDF • 1.8 MB</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
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
