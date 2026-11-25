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
        const updatedReport = await damageReportService.updateReport(report.id, reportData);
        onSave(updatedReport);
      } else {
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

  return (
    <div className="space-y-6 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#232b3b]">
        <div>
          <h3 className="text-lg font-bold text-white">
            {report ? 'Editar Relatório de Avaria' : 'Novo Relatório de Avaria'}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {report ? 'Atualize as informações técnicas da avaria' : 'Registre os detalhes da avaria veicular'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCancel}
            className="bg-[#1a202c] border-[#2d3748] text-gray-200 hover:text-white hover:bg-[#252f40]"
          >
            <X className="h-4 w-4 mr-1.5" />
            Cancelar
          </Button>
          <Button 
            size="sm"
            onClick={handleSave} 
            disabled={loading}
            className="bg-seguranca-red hover:bg-seguranca-red/90 text-white font-medium shadow"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Main Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 bg-[#0e121a] p-1.5 border border-[#222b3d] rounded-xl">
          <TabsTrigger 
            value="basic"
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Dados Básicos
          </TabsTrigger>
          <TabsTrigger 
            value="location"
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Localização
          </TabsTrigger>
          <TabsTrigger 
            value="damage"
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Danos ({damageAreas.length})
          </TabsTrigger>
          <TabsTrigger 
            value="responsible"
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Responsáveis
          </TabsTrigger>
          <TabsTrigger 
            value="insurance"
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Seguro
          </TabsTrigger>
          <TabsTrigger 
            value="costs"
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Custos
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Dados Básicos */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Placa do Veículo *</Label>
                <Input
                  value={formData.vehiclePlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value.toUpperCase() }))}
                  placeholder="ABC-1234"
                  className="bg-[#10141e] border-[#222b3d] text-white font-mono mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Modelo do Veículo</Label>
                <Input
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                  placeholder="Ex: Mercedes-Benz Sprinter 2022"
                  className="bg-[#10141e] border-[#222b3d] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Data e Hora do Ocorrido</Label>
                <Input
                  type="datetime-local"
                  value={formData.reportDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                  className="bg-[#10141e] border-[#222b3d] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Reportado Por</Label>
                <Input
                  value={formData.reportedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportedBy: e.target.value }))}
                  placeholder="Nome do operador / relator"
                  className="bg-[#10141e] border-[#222b3d] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Função do Relator</Label>
                <Select
                  value={formData.reporterRole}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reporterRole: value as any }))}
                >
                  <SelectTrigger className="bg-[#10141e] border-[#222b3d] text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131722] border-[#222b3d] text-white">
                    <SelectItem value="DRIVER">Motorista</SelectItem>
                    <SelectItem value="MECHANIC">Mecânico</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Tipo de Avaria</Label>
                <Select
                  value={formData.reportType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value as any }))}
                >
                  <SelectTrigger className="bg-[#10141e] border-[#222b3d] text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131722] border-[#222b3d] text-white">
                    <SelectItem value="ACCIDENT">Acidente / Colisão</SelectItem>
                    <SelectItem value="VANDALISM">Vandalismo</SelectItem>
                    <SelectItem value="WEAR">Desgaste Excessivo</SelectItem>
                    <SelectItem value="MALFUNCTION">Falha Mecânica</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Severidade</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as any }))}
                >
                  <SelectTrigger className="bg-[#10141e] border-[#222b3d] text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131722] border-[#222b3d] text-white">
                    <SelectItem value="LOW">Baixo (Leve)</SelectItem>
                    <SelectItem value="MEDIUM">Médio (Moderado)</SelectItem>
                    <SelectItem value="HIGH">Alto (Grave)</SelectItem>
                    <SelectItem value="CRITICAL">Crítico (Inoperante)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase text-gray-400">Título Breve da Avaria *</Label>
              <Input
                value={formData.description.title}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  description: { ...prev.description, title: e.target.value }
                }))}
                placeholder="Ex: Colisão traseira em semáforo"
                className="bg-[#10141e] border-[#222b3d] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase text-gray-400">Descrição Detalhada</Label>
              <Textarea
                value={formData.description.details}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  description: { ...prev.description, details: e.target.value }
                }))}
                placeholder="Descreva detalhadamente o evento, danos visíveis e circunstâncias..."
                rows={3}
                className="bg-[#10141e] border-[#222b3d] text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Causa Provável</Label>
                <Textarea
                  value={formData.description.cause}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    description: { ...prev.description, cause: e.target.value }
                  }))}
                  placeholder="Causa provável observada..."
                  rows={2}
                  className="bg-[#10141e] border-[#222b3d] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Ação Imediata Tomada</Label>
                <Textarea
                  value={formData.description.immediateAction}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    description: { ...prev.description, immediateAction: e.target.value }
                  }))}
                  placeholder="Ações operacionais tomadas de imediato..."
                  rows={2}
                  className="bg-[#10141e] border-[#222b3d] text-white mt-1"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Localização */}
        <TabsContent value="location" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase text-gray-400">Endereço Completo do Ocorrido</Label>
              <Textarea
                value={formData.location.address}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, address: e.target.value }
                }))}
                placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                rows={2}
                className="bg-[#10141e] border-[#222b3d] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase text-gray-400">Hodômetro Atual (km)</Label>
              <Input
                type="number"
                value={formData.location.odometer}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, odometer: parseInt(e.target.value) || 0 }
                }))}
                placeholder="Ex: 125400"
                className="bg-[#10141e] border-[#222b3d] text-white font-mono mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase text-gray-400">Fotos do Local e Avaria</Label>
              <div className="mt-1 border-2 border-dashed border-[#262f40] hover:border-gray-500 rounded-xl p-6 text-center transition-colors">
                <Camera className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <div className="text-sm text-gray-300">
                  <label className="cursor-pointer font-semibold text-seguranca-red hover:underline">
                    <span>Clique para selecionar fotos</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </label>
                  <span className="text-gray-400"> ou arraste os arquivos aqui</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Formatos suportados: PNG, JPG, WEBP</p>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-[#222b3d] bg-[#10141e]">
                      <div className="aspect-square">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="p-1.5 text-xs text-gray-300 truncate font-mono">{file.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Danos */}
        <TabsContent value="damage" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232b3b]">
              <div>
                <h4 className="text-base font-bold text-white">Áreas Atingidas</h4>
                <p className="text-xs text-gray-400">Adicione e quantifique as áreas com avarias no veículo</p>
              </div>
              <Button size="sm" onClick={addDamageArea} className="bg-seguranca-red hover:bg-seguranca-red/90 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar Área
              </Button>
            </div>

            <div className="space-y-3">
              {damageAreas.map((area, index) => (
                <div key={area.id} className="p-4 bg-[#10141e] border border-[#222b3d] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Área {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDamageArea(area.id)}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400">Área do Veículo</Label>
                      <Select
                        value={area.area}
                        onValueChange={(value) => updateDamageArea(area.id, { area: value as any })}
                      >
                        <SelectTrigger className="bg-[#181d2a] border-[#262f40] text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#131722] border-[#222b3d] text-white">
                          <SelectItem value="FRONT">Frente</SelectItem>
                          <SelectItem value="REAR">Traseira</SelectItem>
                          <SelectItem value="LEFT_SIDE">Lateral Esquerda</SelectItem>
                          <SelectItem value="RIGHT_SIDE">Lateral Direita</SelectItem>
                          <SelectItem value="ROOF">Teto</SelectItem>
                          <SelectItem value="UNDERCARRIAGE">Chassi</SelectItem>
                          <SelectItem value="INTERIOR">Interior</SelectItem>
                          <SelectItem value="ENGINE">Motor</SelectItem>
                          <SelectItem value="GLASS">Vidros</SelectItem>
                          <SelectItem value="TIRES">Pneus</SelectItem>
                          <SelectItem value="OTHER">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">Severidade</Label>
                      <Select
                        value={area.severity}
                        onValueChange={(value) => updateDamageArea(area.id, { severity: value as any })}
                      >
                        <SelectTrigger className="bg-[#181d2a] border-[#262f40] text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#131722] border-[#222b3d] text-white">
                          <SelectItem value="MINOR">Leve</SelectItem>
                          <SelectItem value="MODERATE">Moderado</SelectItem>
                          <SelectItem value="MAJOR">Grave</SelectItem>
                          <SelectItem value="SEVERE">Severo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">Método de Reparo</Label>
                      <Select
                        value={area.repairMethod}
                        onValueChange={(value) => updateDamageArea(area.id, { repairMethod: value as any })}
                      >
                        <SelectTrigger className="bg-[#181d2a] border-[#262f40] text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#131722] border-[#222b3d] text-white">
                          <SelectItem value="REPAIR">Reparar (Funilaria)</SelectItem>
                          <SelectItem value="REPLACE">Substituir Peça</SelectItem>
                          <SelectItem value="PAINT">Pintura</SelectItem>
                          <SelectItem value="ADJUST">Ajuste Mecânico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">Custo Estimado (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={area.estimatedRepairCost}
                        onChange={(e) => updateDamageArea(area.id, { estimatedRepairCost: parseFloat(e.target.value) || 0 })}
                        className="bg-[#181d2a] border-[#262f40] text-white font-mono mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-400">Descrição do Dano</Label>
                    <Textarea
                      value={area.description}
                      onChange={(e) => updateDamageArea(area.id, { description: e.target.value })}
                      placeholder="Detalhes do amassado, risco ou quebra..."
                      rows={2}
                      className="bg-[#181d2a] border-[#262f40] text-white mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <Switch
                      checked={area.requiresReplacement}
                      onCheckedChange={(checked) => updateDamageArea(area.id, { requiresReplacement: checked })}
                    />
                    <Label className="text-xs text-gray-300">Requer substituição completa de componentes</Label>
                  </div>
                </div>
              ))}

              {damageAreas.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhuma área adicionada. Clique em "Adicionar Área" acima para registrar as partes danificadas.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Responsáveis */}
        <TabsContent value="responsible" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">ID / Matrícula do Motorista</Label>
                <Input
                  value={formData.responsible.driverId}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    responsible: { ...prev.responsible, driverId: e.target.value }
                  }))}
                  placeholder="Ex: 0000001206"
                  className="bg-[#10141e] border-[#222b3d] text-white font-mono mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Nome do Motorista</Label>
                <Input
                  value={formData.responsible.driverName}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    responsible: { ...prev.responsible, driverName: e.target.value }
                  }))}
                  placeholder="Nome completo do motorista"
                  className="bg-[#10141e] border-[#222b3d] text-white mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                checked={formData.responsible.thirdPartyInvolved}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  responsible: { ...prev.responsible, thirdPartyInvolved: checked }
                }))}
              />
              <Label className="text-sm font-semibold text-white">Houve envolvimento de terceiros?</Label>
            </div>

            {formData.responsible.thirdPartyInvolved && (
              <div className="p-4 bg-[#10141e] border border-[#222b3d] rounded-xl space-y-3 mt-2">
                <h5 className="font-bold text-white text-sm">Dados do Terceiro</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400">Nome</Label>
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
                      className="bg-[#181d2a] border-[#262f40] text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Telefone / Contato</Label>
                    <Input
                      value={formData.responsible.thirdPartyInfo?.contact || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        responsible: { 
                          ...prev.responsible, 
                          thirdPartyInfo: { ...prev.responsible.thirdPartyInfo, contact: e.target.value }
                        }
                      }))}
                      placeholder="(11) 98765-4321"
                      className="bg-[#181d2a] border-[#262f40] text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Seguradora</Label>
                    <Input
                      value={formData.responsible.thirdPartyInfo?.insurance || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        responsible: { 
                          ...prev.responsible, 
                          thirdPartyInfo: { ...prev.responsible.thirdPartyInfo, insurance: e.target.value }
                        }
                      }))}
                      placeholder="Ex: Porto Seguro"
                      className="bg-[#181d2a] border-[#262f40] text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Veículo</Label>
                    <Input
                      value={formData.responsible.thirdPartyInfo?.vehicle || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        responsible: { 
                          ...prev.responsible, 
                          thirdPartyInfo: { ...prev.responsible.thirdPartyInfo, vehicle: e.target.value }
                        }
                      }))}
                      placeholder="Ex: Gol 1.6"
                      className="bg-[#181d2a] border-[#262f40] text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Placa</Label>
                    <Input
                      value={formData.responsible.thirdPartyInfo?.licensePlate || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        responsible: { 
                          ...prev.responsible, 
                          thirdPartyInfo: { ...prev.responsible.thirdPartyInfo, licensePlate: e.target.value.toUpperCase() }
                        }
                      }))}
                      placeholder="ABC1D23"
                      className="bg-[#181d2a] border-[#262f40] text-white font-mono mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Seguro */}
        <TabsContent value="insurance" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.insurance.claimFiled}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  insurance: { ...prev.insurance, claimFiled: checked }
                }))}
              />
              <Label className="text-sm font-semibold text-white">Acionar Sinistro na Seguradora?</Label>
            </div>

            {formData.insurance.claimFiled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 bg-[#10141e] p-4 rounded-xl border border-[#222b3d]">
                <div>
                  <Label className="text-xs text-gray-400">Número do Sinistro</Label>
                  <Input
                    value={formData.insurance.claimNumber}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      insurance: { ...prev.insurance, claimNumber: e.target.value }
                    }))}
                    placeholder="CLAIM-2024-001"
                    className="bg-[#181d2a] border-[#262f40] text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Seguradora</Label>
                  <Input
                    value={formData.insurance.insuranceCompany}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      insurance: { ...prev.insurance, insuranceCompany: e.target.value }
                    }))}
                    placeholder="Nome da seguradora"
                    className="bg-[#181d2a] border-[#262f40] text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Número da Apólice</Label>
                  <Input
                    value={formData.insurance.policyNumber}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      insurance: { ...prev.insurance, policyNumber: e.target.value }
                    }))}
                    placeholder="POL-123456"
                    className="bg-[#181d2a] border-[#262f40] text-white font-mono mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Franquia (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.insurance.deductible}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      insurance: { ...prev.insurance, deductible: parseFloat(e.target.value) || 0 }
                    }))}
                    className="bg-[#181d2a] border-[#262f40] text-white font-mono mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Cobertura Máxima (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.insurance.coverageAmount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      insurance: { ...prev.insurance, coverageAmount: parseFloat(e.target.value) || 0 }
                    }))}
                    className="bg-[#181d2a] border-[#262f40] text-white font-mono mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 6: Custos */}
        <TabsContent value="costs" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Mão de Obra (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.estimatedCosts.labor}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimatedCosts: { ...prev.estimatedCosts, labor: parseFloat(e.target.value) || 0 }
                  }))}
                  className="bg-[#10141e] border-[#222b3d] text-white font-mono mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Peças (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.estimatedCosts.parts}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimatedCosts: { ...prev.estimatedCosts, parts: parseFloat(e.target.value) || 0 }
                  }))}
                  className="bg-[#10141e] border-[#222b3d] text-white font-mono mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-400">Materiais (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.estimatedCosts.materials}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimatedCosts: { ...prev.estimatedCosts, materials: parseFloat(e.target.value) || 0 }
                  }))}
                  className="bg-[#10141e] border-[#222b3d] text-white font-mono mt-1"
                />
              </div>
            </div>

            <div className="p-4 bg-[#10141e] border border-[#222b3d] rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Custo Total Estimado:</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                R$ {formData.estimatedCosts.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
