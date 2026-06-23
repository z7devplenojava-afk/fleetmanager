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
  Car, 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  FileText,
  DollarSign,
  Shield,
  Phone,
  Mail,
  Building,
  Wrench,
  Image as ImageIcon
} from 'lucide-react';
import damageReportService from '@/services/damageReportService';
import { DamageReport, DamageArea, DamageDocument } from '@/services/damageReportService';

interface DamageReportFormProps {
  report?: DamageReport;
  onSave: (report: DamageReport) => void;
  onCancel: () => void;
}

export default function DamageReportForm({ report, onSave, onCancel }: DamageReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [damageAreas, setDamageAreas] = useState<DamageArea[]>([]);
  
  const [formData, setFormData] = useState({
    vehicleId: report?.vehicleId || '',
    vehiclePlate: report?.vehiclePlate || '',
    vehicleModel: report?.vehicleModel || '',
    reportDate: report?.reportDate ? new Date(report.reportDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    reportedBy: report?.reportedBy || '',
    reporterRole: report?.reporterRole || 'DRIVER',
    reportType: report?.reportType || 'ACCIDENT',
    severity: report?.severity || 'MEDIUM',
    status: report?.status || 'OPEN',
    
    location: {
      address: report?.location.address || '',
      odometer: report?.location.odometer || 0,
      coordinates: report?.location.coordinates
    },
    
    description: {
      title: report?.description.title || '',
      details: report?.description.details || '',
      cause: report?.description.cause || '',
      immediateAction: report?.description.immediateAction || ''
    },
    
    estimatedCosts: {
      labor: report?.estimatedCosts.labor || 0,
      parts: report?.estimatedCosts.parts || 0,
      materials: report?.estimatedCosts.materials || 0,
      total: report?.estimatedCosts.total || 0,
      currency: report?.estimatedCosts.currency || 'BRL'
    },
    
    responsible: {
      driverId: report?.responsible.driverId || '',
      driverName: report?.responsible.driverName || '',
      thirdPartyInvolved: report?.responsible.thirdPartyInvolved || false,
      thirdPartyInfo: report?.responsible.thirdPartyInfo || {
        name: '',
        contact: '',
        insurance: '',
        vehicle: '',
        licensePlate: ''
      }
    },
    
    insurance: {
      claimFiled: report?.insurance.claimFiled || false,
      claimNumber: report?.insurance.claimNumber || '',
      claimStatus: report?.insurance.claimStatus || 'PENDING',
      insuranceCompany: report?.insurance.insuranceCompany || '',
      policyNumber: report?.insurance.policyNumber || '',
      deductible: report?.insurance.deductible || 0,
      coverageAmount: report?.insurance.coverageAmount || 0
    }
  });

  useEffect(() => {
    if (report) {
      setDamageAreas(report.damageAreas || []);
    }
  }, [report]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Calculate total cost
      const totalCost = formData.estimatedCosts.labor + formData.estimatedCosts.parts + formData.estimatedCosts.materials;
      
      const reportData = {
        ...formData,
        estimatedCosts: {
          ...formData.estimatedCosts,
          total: totalCost
        },
        damageAreas,
        timeline: report?.timeline || [],
        documents: report?.documents || [],
        repair: report?.repair || {
          repairNotes: '',
          partsUsed: [],
          laborHours: 0
        },
        approval: report?.approval || {
          requiresApproval: totalCost > 1000,
          budgetApproved: false
        },
        createdAt: report?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: report?.createdBy || 'current-user',
        updatedBy: 'current-user'
      };

      if (report) {
        // Update existing report
        const updatedReport = await damageReportService.updateReport(report.id, reportData);
        onSave(updatedReport);
      } else {
        // Create new report
        const newReport = await damageReportService.createReport(reportData);
        onSave(newReport);
      }
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      alert('Erro ao salvar relatório. Verifique os dados e tente novamente.');
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

  const addDamageArea = () => {
    const newArea: DamageArea = {
      id: `area-${Date.now()}`,
      area: 'FRONT',
      severity: 'MINOR',
      description: '',
      estimatedRepairCost: 0,
      requiresReplacement: false,
      partsNeeded: [],
      images: [],
      repairMethod: 'REPAIR'
    };

    setDamageAreas(prev => [...prev, newArea]);
  };

  const updateDamageArea = (areaId: string, updates: Partial<DamageArea>) => {
    setDamageAreas(prev => prev.map(area =>
      area.id === areaId ? { ...area, ...updates } : area
    ));
  };

  const removeDamageArea = (areaId: string) => {
    setDamageAreas(prev => prev.filter(area => area.id !== areaId));
  };

  const calculateTotalCost = () => {
    const areasCost = damageAreas.reduce((sum, area) => sum + area.estimatedRepairCost, 0);
    const total = formData.estimatedCosts.labor + formData.estimatedCosts.parts + formData.estimatedCosts.materials + areasCost;
    setFormData(prev => ({
      ...prev,
      estimatedCosts: {
        ...prev.estimatedCosts,
        total
      }
    }));
  };

  useEffect(() => {
    calculateTotalCost();
  }, [formData.estimatedCosts.labor, formData.estimatedCosts.parts, formData.estimatedCosts.materials, damageAreas]);

  const getSeverityLabel = (severity: string) => damageReportService.getSeverityLabel(severity);
  const getSeverityColor = (severity: string) => damageReportService.getSeverityColor(severity);
  const getReportTypeLabel = (type: string) => damageReportService.getReportTypeLabel(type);
  const getAreaLabel = (area: string) => damageReportService.getAreaLabel(area);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {report ? 'Editar Relatório de Avaria' : 'Novo Relatório de Avaria'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {report ? 'Edite as informações da avaria' : 'Registre uma nova avaria veicular'}
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
          <TabsTrigger value="location">Localização</TabsTrigger>
          <TabsTrigger value="damage">Danos</TabsTrigger>
          <TabsTrigger value="responsible">Responsáveis</TabsTrigger>
          <TabsTrigger value="insurance">Seguro</TabsTrigger>
          <TabsTrigger value="costs">Custos</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Placa do Veículo</Label>
                  <Input
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <Label>Modelo do Veículo</Label>
                  <Input
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                    placeholder="Mercedes-Benz Sprinter 2022"
                  />
                </div>
                <div>
                  <Label>Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={formData.reportDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Reportado por</Label>
                  <Input
                    value={formData.reportedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportedBy: e.target.value }))}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div>
                  <Label>Cargo do Responsável</Label>
                  <Select
                    value={formData.reporterRole}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reporterRole: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRIVER">Motorista</SelectItem>
                      <SelectItem value="MECHANIC">Mecânico</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Avaria</Label>
                  <Select
                    value={formData.reportType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCIDENT">Acidente</SelectItem>
                      <SelectItem value="VANDALISM">Vandalismo</SelectItem>
                      <SelectItem value="WEAR">Desgaste</SelectItem>
                      <SelectItem value="MALFUNCTION">Falha Mecânica</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severidade</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baixo</SelectItem>
                      <SelectItem value="MEDIUM">Médio</SelectItem>
                      <SelectItem value="HIGH">Alto</SelectItem>
                      <SelectItem value="CRITICAL">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Título da Avaria</Label>
                <Input
                  value={formData.description.title}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    description: { ...prev.description, title: e.target.value }
                  }))}
                  placeholder="Breve descrição da avaria"
                />
              </div>

              <div>
                <Label>Descrição Detalhada</Label>
                <Textarea
                  value={formData.description.details}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    description: { ...prev.description, details: e.target.value }
                  }))}
                  placeholder="Descreva detalhadamente o que aconteceu..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Causa Provável</Label>
                  <Textarea
                    value={formData.description.cause}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      description: { ...prev.description, cause: e.target.value }
                    }))}
                    placeholder="Causa provável da avaria..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Ação Imediata</Label>
                  <Textarea
                    value={formData.description.immediateAction}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      description: { ...prev.description, immediateAction: e.target.value }
                    }))}
                    placeholder="Ações tomadas imediatamente..."
                    rows={2}
                  />
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
                Localização do Ocorrência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Endereço Completo</Label>
                <Textarea
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  placeholder="Endereço onde ocorreu a avaria..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Hodômetro (km)</Label>
                <Input
                  type="number"
                  value={formData.location.odometer}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, odometer: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="45000"
                />
              </div>

              <div>
                <Label>Fotos do Local</Label>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="damage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Áreas Danificadas
                </CardTitle>
                <Button onClick={addDamageArea}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Área
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {damageAreas.map((area, index) => (
                  <Card key={area.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Área {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDamageArea(area.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Área do Veículo</Label>
                          <Select
                            value={area.area}
                            onValueChange={(value) => updateDamageArea(area.id, { area: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FRONT">Frente</SelectItem>
                              <SelectItem value="REAR">Traseira</SelectItem>
                              <SelectItem value="LEFT_SIDE">Lado Esquerdo</SelectItem>
                              <SelectItem value="RIGHT_SIDE">Lado Direito</SelectItem>
                              <SelectItem value="ROOF">Teto</SelectItem>
                              <SelectItem value="UNDERCARRIAGE">Chassi</SelectItem>
                              <SelectItem value="INTERIOR">Interior</SelectItem>
                              <SelectItem value="ENGINE">Motor</SelectItem>
                              <SelectItem value="TRANSMISSION">Transmissão</SelectItem>
                              <SelectItem value="BRAKES">Freios</SelectItem>
                              <SelectItem value="SUSPENSION">Suspensão</SelectItem>
                              <SelectItem value="ELECTRICAL">Elétrico</SelectItem>
                              <SelectItem value="TIRES">Pneus</SelectItem>
                              <SelectItem value="GLASS">Vidros</SelectItem>
                              <SelectItem value="LIGHTS">Luzes</SelectItem>
                              <SelectItem value="MIRRORS">Espelhos</SelectItem>
                              <SelectItem value="OTHER">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Severidade do Dano</Label>
                          <Select
                            value={area.severity}
                            onValueChange={(value) => updateDamageArea(area.id, { severity: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MINOR">Leve</SelectItem>
                              <SelectItem value="MODERATE">Moderado</SelectItem>
                              <SelectItem value="MAJOR">Grave</SelectItem>
                              <SelectItem value="SEVERE">Severo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Método de Reparo</Label>
                          <Select
                            value={area.repairMethod}
                            onValueChange={(value) => updateDamageArea(area.id, { repairMethod: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REPAIR">Reparar</SelectItem>
                              <SelectItem value="REPLACE">Substituir</SelectItem>
                              <SelectItem value="REFURBISH">Recondicionar</SelectItem>
                              <SelectItem value="PAINT">Pintar</SelectItem>
                              <SelectItem value="ADJUST">Ajustar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Custo Estimado (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={area.estimatedRepairCost}
                            onChange={(e) => updateDamageArea(area.id, { estimatedRepairCost: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label>Descrição do Dano</Label>
                        <Textarea
                          value={area.description}
                          onChange={(e) => updateDamageArea(area.id, { description: e.target.value })}
                          placeholder="Descreva o dano nesta área..."
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center space-x-4 mt-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={area.requiresReplacement}
                            onCheckedChange={(checked) => updateDamageArea(area.id, { requiresReplacement: checked })}
                          />
                          <Label>Requer Substituição</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {damageAreas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma área danificada adicionada</p>
                    <p className="text-sm">Clique em "Adicionar Área" para registrar os danos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsible" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>ID do Motorista</Label>
                  <Input
                    value={formData.responsible.driverId}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      responsible: { ...prev.responsible, driverId: e.target.value }
                    }))}
                    placeholder="driver-001"
                  />
                </div>
                <div>
                  <Label>Nome do Motorista</Label>
                  <Input
                    value={formData.responsible.driverName}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      responsible: { ...prev.responsible, driverName: e.target.value }
                    }))}
                    placeholder="Nome do motorista"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.responsible.thirdPartyInvolved}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    responsible: { ...prev.responsible, thirdPartyInvolved: checked }
                  }))}
                />
                <Label>Terceiros Envolvidos</Label>
              </div>

              {formData.responsible.thirdPartyInvolved && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Informações do Terceiro</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={formData.responsible.thirdPartyInfo?.name || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          responsible: { 
                            ...prev.responsible, 
                            thirdPartyInfo: { ...prev.responsible.thirdPartyInfo, name: e.target.value }
                          }
                        }))}
                        placeholder="Nome do terceiro"
                      />
                    </div>
                    <div>
                      <Label>Contato</Label>
                      <Input
                        value={formData.responsible.thirdPartyInfo?.contact || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          responsible: { 
                            ...prev.responsible, 
                            thirdPartyInfo: { ...prev.responsible.thirdPartyInfo, contact: e.target.value }
                          }
                        }))}
                        placeholder="Telefone ou email"
                      />
                    </div>
                    <div>
                      <Label>Seguradora</Label>
                      <Input
                        value={formData.responsible.thirdPartyInfo?.insurance || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          responsible: { 
                            ...prev.responsible, 
                            thirdPartyInfo: { ...prev.responsible.thirdPartyInfo, insurance: e.target.value }
                          }
                        }))}
                        placeholder="Nome da seguradora"
                      />
                    </div>
                    <div>
                      <Label>Veículo</Label>
                      <Input
                        value={formData.responsible.thirdPartyInfo?.vehicle || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          responsible: { 
                            ...prev.responsible, 
                            thirdPartyInfo: { ...prev.responsible.thirdPartyInfo, vehicle: e.target.value }
                          }
                        }))}
                        placeholder="Modelo do veículo"
                      />
                    </div>
                    <div>
                      <Label>Placa</Label>
                      <Input
                        value={formData.responsible.thirdPartyInfo?.licensePlate || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          responsible: { 
                            ...prev.responsible, 
                            thirdPartyInfo: { ...prev.responsible.thirdPartyInfo, licensePlate: e.target.value }
                          }
                        }))}
                        placeholder="Placa do veículo"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações de Seguro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.insurance.claimFiled}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    insurance: { ...prev.insurance, claimFiled: checked }
                  }))}
                />
                <Label>Reivindicação Aberta</Label>
              </div>

              {formData.insurance.claimFiled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Número da Reivindicação</Label>
                      <Input
                        value={formData.insurance.claimNumber}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          insurance: { ...prev.insurance, claimNumber: e.target.value }
                        }))}
                        placeholder="CLAIM-2024-001"
                      />
                    </div>
                    <div>
                      <Label>Status da Reivindicação</Label>
                      <Select
                        value={formData.insurance.claimStatus}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          insurance: { ...prev.insurance, claimStatus: value as any }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="PROCESSING">Em Processamento</SelectItem>
                          <SelectItem value="APPROVED">Aprovada</SelectItem>
                          <SelectItem value="REJECTED">Rejeitada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Seguradora</Label>
                      <Input
                        value={formData.insurance.insuranceCompany}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          insurance: { ...prev.insurance, insuranceCompany: e.target.value }
                        }))}
                        placeholder="Nome da seguradora"
                      />
                    </div>
                    <div>
                      <Label>Número da Apólice</Label>
                      <Input
                        value={formData.insurance.policyNumber}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          insurance: { ...prev.insurance, policyNumber: e.target.value }
                        }))}
                        placeholder="POL-001234567"
                      />
                    </div>
                    <div>
                      <Label>Valor da Franquia (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.insurance.deductible}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          insurance: { ...prev.insurance, deductible: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder="500.00"
                      />
                    </div>
                    <div>
                      <Label>Cobertura Máxima (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.insurance.coverageAmount}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          insurance: { ...prev.insurance, coverageAmount: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder="10000.00"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Estimativa de Custos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Mão de Obra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.estimatedCosts.labor}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      estimatedCosts: { ...prev.estimatedCosts, labor: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Peças (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.estimatedCosts.parts}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      estimatedCosts: { ...prev.estimatedCosts, parts: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Materiais (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.estimatedCosts.materials}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      estimatedCosts: { ...prev.estimatedCosts, materials: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Custo Total Estimado:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {formData.estimatedCosts.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {formData.estimatedCosts.total > 1000 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Este valor requer aprovação do gestor antes de iniciar os reparos.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
