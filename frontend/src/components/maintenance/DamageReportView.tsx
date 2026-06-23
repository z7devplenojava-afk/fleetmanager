import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Car, 
  User, 
  Calendar, 
  DollarSign, 
  Shield, 
  Phone, 
  Mail, 
  Building, 
  Wrench, 
  Camera, 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  X,
  TrendingUp,
  Activity,
  Image as ImageIcon,
  Navigation
} from 'lucide-react';
import damageReportService from '@/services/damageReportService';
import { DamageReport } from '@/services/damageReportService';

interface DamageReportViewProps {
  reportId: string;
  onEdit?: (report: DamageReport) => void;
  onDelete?: (reportId: string) => void;
  onClose?: () => void;
}

export default function DamageReportView({ reportId, onEdit, onDelete, onClose }: DamageReportViewProps) {
  const [report, setReport] = useState<DamageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const reportData = await damageReportService.getReportById(reportId);
      setReport(reportData);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: DamageReport['status']) => {
    if (!report) return;

    try {
      await damageReportService.updateReportStatus(report.id, newStatus);
      await loadReport();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDownload = () => {
    // Implement download functionality
    alert('Download do relatório será implementado');
  };

  const getSeverityLabel = (severity: string) => damageReportService.getSeverityLabel(severity);
  const getSeverityColor = (severity: string) => damageReportService.getSeverityColor(severity);
  const getStatusLabel = (status: string) => damageReportService.getStatusLabel(status);
  const getStatusColor = (status: string) => damageReportService.getStatusColor(status);
  const getReportTypeLabel = (type: string) => damageReportService.getReportTypeLabel(type);
  const getAreaLabel = (area: string) => damageReportService.getAreaLabel(area);
  const getDocumentTypeLabel = (type: string) => damageReportService.getDocumentTypeLabel(type);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Relatório não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold">{report.description.title}</h2>
            <p className="text-sm text-muted-foreground">
              {report.vehiclePlate} • {new Date(report.reportDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getSeverityColor(report.severity)}>
            {getSeverityLabel(report.severity)}
          </Badge>
          <Badge className={getStatusColor(report.status)}>
            {getStatusLabel(report.status)}
          </Badge>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(report)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" onClick={() => onDelete(report.id)}>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Veículo</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{report.vehiclePlate}</div>
            <p className="text-xs text-muted-foreground">{report.vehicleModel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              R$ {report.estimatedCosts.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Mão de obra: R$ {report.estimatedCosts.labor.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Áreas Danificadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{report.damageAreas.length}</div>
            <p className="text-xs text-muted-foreground">
              {report.damageAreas.filter(a => a.severity === 'SEVERE').length} severas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Responsável</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{report.reportedBy}</div>
            <p className="text-xs text-muted-foreground">{report.reporterRole}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="damage">Danos</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="insurance">Seguro</TabsTrigger>
          <TabsTrigger value="repair">Reparo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Avaria</label>
                  <div className="flex items-center gap-2 mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{getReportTypeLabel(report.reportType)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição Detalhada</label>
                  <p className="mt-1 text-sm">{report.description.details}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Causa Provável</label>
                  <p className="mt-1 text-sm">{report.description.cause}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ação Imediata</label>
                  <p className="mt-1 text-sm">{report.description.immediateAction}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Localização</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{report.location.address}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Hodômetro: {report.location.odometer.toLocaleString()} km
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Responsáveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Motorista</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">{report.responsible.driverName}</div>
                      <div className="text-xs text-muted-foreground">ID: {report.responsible.driverId}</div>
                    </div>
                  </div>
                </div>

                {report.responsible.thirdPartyInvolved && report.responsible.thirdPartyInfo && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Terceiro Envolvido</label>
                    <div className="mt-2 p-3 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Nome:</span>
                          <div>{report.responsible.thirdPartyInfo.name}</div>
                        </div>
                        <div>
                          <span className="font-medium">Contato:</span>
                          <div>{report.responsible.thirdPartyInfo.contact}</div>
                        </div>
                        <div>
                          <span className="font-medium">Seguradora:</span>
                          <div>{report.responsible.thirdPartyInfo.insurance}</div>
                        </div>
                        <div>
                          <span className="font-medium">Veículo:</span>
                          <div>{report.responsible.thirdPartyInfo.vehicle}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Detalheses do Custo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {report.estimatedCosts.labor.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Mão de Obra</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {report.estimatedCosts.parts.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Peças</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    R$ {report.estimatedCosts.materials.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Materiais</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    R$ {report.estimatedCosts.total.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>

              {report.approval.requiresApproval && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Este orçamento requer aprovação do gestor antes de iniciar os reparos.
                    {report.approval.budgetApproved && (
                      <span className="ml-2 text-green-600">✓ Aprovado</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="damage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Áreas Danificadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.damageAreas.map((area, index) => (
                  <Card key={area.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Área {index + 1}: {getAreaLabel(area.area)}</span>
                          <Badge className={
                            area.severity === 'SEVERE' ? 'bg-red-100 text-red-800' :
                            area.severity === 'MAJOR' ? 'bg-orange-100 text-orange-800' :
                            area.severity === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {area.severity === 'SEVERE' ? 'Severo' :
                             area.severity === 'MAJOR' ? 'Grave' :
                             area.severity === 'MODERATE' ? 'Moderado' : 'Leve'}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">
                          R$ {area.estimatedRepairCost.toFixed(2)}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground mb-2">
                        {area.description}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Método de Reparo:</span>
                          <div>{area.repairMethod}</div>
                        </div>
                        <div>
                          <span className="font-medium">Requer Substituição:</span>
                          <div>{area.requiresReplacement ? 'Sim' : 'Não'}</div>
                        </div>
                        <div>
                          <span className="font-medium">Peças Necessárias:</span>
                          <div>
                            {area.partsNeeded && area.partsNeeded.length > 0 
                              ? area.partsNeeded.join(', ') 
                              : 'Nenhuma'
                            }
                          </div>
                        </div>
                      </div>

                      {area.images && area.images.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm font-medium">Imagens:</span>
                          <div className="flex gap-2 mt-1">
                            {area.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.timeline.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        event.eventType === 'DAMAGE_OCCURRED' ? 'bg-red-100 text-red-600' :
                        event.eventType === 'REPORTED' ? 'bg-blue-100 text-blue-600' :
                        event.eventType === 'INSPECTED' ? 'bg-yellow-100 text-yellow-600' :
                        event.eventType === 'REPAIR_STARTED' ? 'bg-orange-100 text-orange-600' :
                        event.eventType === 'REPAIR_COMPLETED' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {event.eventType === 'DAMAGE_OCCURRED' && <AlertTriangle className="h-4 w-4" />}
                        {event.eventType === 'REPORTED' && <FileText className="h-4 w-4" />}
                        {event.eventType === 'INSPECTED' && <Wrench className="h-4 w-4" />}
                        {event.eventType === 'REPAIR_STARTED' && <Activity className="h-4 w-4" />}
                        {event.eventType === 'REPAIR_COMPLETED' && <CheckCircle className="h-4 w-4" />}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{event.description}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleDateString('pt-BR')} {new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Por: {event.reportedBy}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded flex items-center justify-center ${
                        doc.type === 'PHOTO' ? 'bg-blue-100 text-blue-600' :
                        doc.type === 'VIDEO' ? 'bg-purple-100 text-purple-600' :
                        doc.type === 'POLICE_REPORT' ? 'bg-red-100 text-red-600' :
                        doc.type === 'INSURANCE_CLAIM' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {doc.type === 'PHOTO' && <Camera className="h-5 w-5" />}
                        {doc.type === 'VIDEO' && <FileText className="h-5 w-5" />}
                        {doc.type === 'POLICE_REPORT' && <Shield className="h-5 w-5" />}
                        {doc.type === 'INSURANCE_CLAIM' && <Shield className="h-5 w-5" />}
                        {doc.type === 'OTHER' && <FileText className="h-5 w-5" />}
                      </div>
                      
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">{doc.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {getDocumentTypeLabel(doc.type)} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • 
                          {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Reivindicação Aberta:</span>
                <Badge className={report.insurance.claimFiled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {report.insurance.claimFiled ? 'Sim' : 'Não'}
                </Badge>
              </div>

              {report.insurance.claimFiled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Número da Reivindicação</label>
                    <div className="text-sm">{report.insurance.claimNumber || 'Não informado'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="text-sm">{report.insurance.claimStatus}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Seguradora</label>
                    <div className="text-sm">{report.insurance.insuranceCompany}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Apólice</label>
                    <div className="text-sm">{report.insurance.policyNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Franquia</label>
                    <div className="text-sm">R$ {report.insurance.deductible.toFixed(2)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cobertura Máxima</label>
                    <div className="text-sm">R$ {report.insurance.coverageAmount.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repair" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Informações do Reparo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.repair.assignedTo ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Responsável pelo Reparo</label>
                  <div className="text-sm">{report.repair.assignedToName}</div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum mecânico atribuído ainda</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Previsão de Conclusão</label>
                  <div className="text-sm">
                    {report.repair.estimatedCompletionDate 
                      ? new Date(report.repair.estimatedCompletionDate).toLocaleDateString('pt-BR')
                      : 'Não definida'
                    }
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Horas de Mão de Obra</label>
                  <div className="text-sm">{report.repair.laborHours} horas</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Notas do Reparo</label>
                <p className="text-sm mt-1">{report.repair.repairNotes}</p>
              </div>

              {report.repair.partsUsed && report.repair.partsUsed.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Peças Utilizadas</label>
                  <div className="mt-2 space-y-2">
                    {report.repair.partsUsed.map((part) => (
                      <div key={part.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="text-sm font-medium">{part.partName}</div>
                          <div className="text-xs text-muted-foreground">
                            {part.quantity}x • {part.supplier}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          R$ {part.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button 
                  variant="outline"
                  onClick={() => handleStatusUpdate('IN_PROGRESS')}
                  disabled={report.status === 'IN_PROGRESS'}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Iniciar Reparo
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handleStatusUpdate('RESOLVED')}
                  disabled={report.status === 'RESOLVED'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir Reparo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
