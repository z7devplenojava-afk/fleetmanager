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
    alert('Download do relatório gerado em PDF');
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
      <div className="flex justify-center items-center h-64 text-gray-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-red"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <p className="text-gray-400">Relatório não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232b3b]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-seguranca-red/20 border border-seguranca-red/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-seguranca-red" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">{report.description.title}</h2>
              <Badge className={getSeverityColor(report.severity)}>
                {getSeverityLabel(report.severity)}
              </Badge>
              <Badge className={getStatusColor(report.status)}>
                {getStatusLabel(report.status)}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 font-mono mt-0.5">
              <span className="text-seguranca-yellow font-bold">{report.vehiclePlate}</span> • {report.vehicleModel} • {new Date(report.reportDate).toLocaleDateString('pt-BR')} {new Date(report.reportDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownload}
            className="bg-[#1a202c] border-[#2d3748] text-gray-200 hover:text-white hover:bg-[#252f40]"
          >
            <Download className="h-4 w-4 mr-1.5 text-blue-400" />
            Baixar
          </Button>
          {onEdit && (
            <Button 
              size="sm"
              onClick={() => onEdit(report)}
              className="bg-seguranca-red hover:bg-seguranca-red/90 text-white shadow"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(report.id)}
              className="bg-[#1a202c] border-[#2d3748] text-gray-200 hover:text-red-400 hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Excluir
            </Button>
          )}
          {onClose && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
              className="bg-[#1a202c] border-[#2d3748] text-gray-200 hover:text-white hover:bg-[#252f40]"
            >
              <X className="h-4 w-4 mr-1.5" />
              Fechar
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>Veículo</span>
            <Car className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold font-mono text-seguranca-yellow mt-1">{report.vehiclePlate}</div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{report.vehicleModel}</p>
        </div>

        <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>Custo Estimado</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            R$ {report.estimatedCosts.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Mão de obra: R$ {report.estimatedCosts.labor.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>Áreas Danificadas</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">{report.damageAreas.length}</div>
          <p className="text-xs text-gray-400 mt-0.5">
            {report.damageAreas.filter(a => a.severity === 'SEVERE').length} severas
          </p>
        </div>

        <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>Responsável</span>
            <User className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white truncate mt-1">{report.reportedBy}</div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{report.reporterRole}</p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 bg-[#0e121a] p-1.5 border border-[#222b3d] rounded-xl">
          <TabsTrigger 
            value="overview" 
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="damage" 
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Danos ({report.damageAreas.length})
          </TabsTrigger>
          <TabsTrigger 
            value="timeline" 
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Linha do Tempo
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Documentos ({report.documents.length})
          </TabsTrigger>
          <TabsTrigger 
            value="insurance" 
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Seguro
          </TabsTrigger>
          <TabsTrigger 
            value="repair" 
            className="text-xs sm:text-sm font-medium py-2 rounded-lg text-gray-400 hover:text-white data-[state=active]:bg-seguranca-red data-[state=active]:text-white transition-all"
          >
            Reparo
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Visão Geral */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#232b3b]">
                <FileText className="h-5 w-5 text-seguranca-red" />
                <h3 className="text-base font-bold text-white">Informações Gerais</h3>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Tipo de Avaria</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="border-gray-600 bg-gray-800/60 text-gray-200">
                    {getReportTypeLabel(report.reportType)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Descrição Detalhada</label>
                <p className="mt-1 text-sm text-gray-200 bg-[#10141e] p-3 rounded-lg border border-[#222b3d] leading-relaxed">
                  {report.description.details}
                </p>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Causa Provável</label>
                <p className="mt-1 text-sm text-gray-300">
                  {report.description.cause || 'Não informada'}
                </p>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Ação Imediata</label>
                <p className="mt-1 text-sm text-gray-300">
                  {report.description.immediateAction || 'Nenhuma ação registrada'}
                </p>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Localização do Evento</label>
                <div className="flex items-start gap-2 mt-1 text-sm text-gray-200">
                  <MapPin className="h-4 w-4 text-seguranca-red shrink-0 mt-0.5" />
                  <div>
                    <div>{report.location.address || 'Local não informado'}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      Hodômetro: {report.location.odometer.toLocaleString()} km
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#232b3b]">
                <User className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Responsáveis</h3>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Motorista Envolvido</label>
                <div className="flex items-center gap-2.5 mt-1 bg-[#10141e] p-3 rounded-lg border border-[#222b3d]">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {report.responsible.driverName ? report.responsible.driverName.charAt(0) : 'M'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{report.responsible.driverName || 'Não especificado'}</div>
                    <div className="text-xs text-gray-400 font-mono">ID: {report.responsible.driverId || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Terceiros Envolvidos</label>
                {report.responsible.thirdPartyInvolved && report.responsible.thirdPartyInfo ? (
                  <div className="mt-1.5 p-3.5 bg-[#10141e] border border-[#222b3d] rounded-lg space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-gray-400">Nome:</span>
                        <div className="font-medium text-white">{report.responsible.thirdPartyInfo.name}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Contato:</span>
                        <div className="font-medium text-gray-200">{report.responsible.thirdPartyInfo.contact || '-'}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Seguradora:</span>
                        <div className="font-medium text-gray-200">{report.responsible.thirdPartyInfo.insurance || '-'}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Veículo / Placa:</span>
                        <div className="font-medium text-gray-200">{report.responsible.thirdPartyInfo.vehicle} ({report.responsible.thirdPartyInfo.licensePlate || '-'})</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-gray-400">Nenhum terceiro envolvido na ocorrência.</div>
                )}
              </div>
            </div>
          </div>

          {/* Custos Breakdown */}
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#232b3b]">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Composição de Custos do Reparo</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#10141e] border border-[#222b3d] rounded-xl text-center">
                <div className="text-xl font-bold font-mono text-blue-400">
                  R$ {report.estimatedCosts.labor.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Mão de Obra</div>
              </div>
              <div className="p-3.5 bg-[#10141e] border border-[#222b3d] rounded-xl text-center">
                <div className="text-xl font-bold font-mono text-emerald-400">
                  R$ {report.estimatedCosts.parts.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Peças</div>
              </div>
              <div className="p-3.5 bg-[#10141e] border border-[#222b3d] rounded-xl text-center">
                <div className="text-xl font-bold font-mono text-amber-400">
                  R$ {report.estimatedCosts.materials.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Materiais</div>
              </div>
              <div className="p-3.5 bg-[#10141e] border border-[#222b3d] rounded-xl text-center">
                <div className="text-xl font-bold font-mono text-purple-400">
                  R$ {report.estimatedCosts.total.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Estimado</div>
              </div>
            </div>

            {report.approval.requiresApproval && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Este orçamento requer aprovação formal antes da execução.
                  {report.approval.budgetApproved && (
                    <span className="ml-2 font-bold text-emerald-400">✓ Aprovado</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Danos */}
        <TabsContent value="damage" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#232b3b]">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Detalhamento das Áreas Atingidas</h3>
            </div>

            <div className="space-y-3">
              {report.damageAreas.map((area, index) => (
                <div key={area.id} className="p-4 bg-[#10141e] border border-[#222b3d] rounded-xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Área {index + 1}: {getAreaLabel(area.area)}</span>
                      <Badge className={
                        area.severity === 'SEVERE' ? 'bg-red-950/80 text-red-300 border border-red-700/60' :
                        area.severity === 'MAJOR' ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60' :
                        area.severity === 'MODERATE' ? 'bg-yellow-950/80 text-yellow-300 border border-yellow-700/60' :
                        'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                      }>
                        {area.severity === 'SEVERE' ? 'Severo' :
                         area.severity === 'MAJOR' ? 'Grave' :
                         area.severity === 'MODERATE' ? 'Moderado' : 'Leve'}
                      </Badge>
                    </div>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      R$ {area.estimatedRepairCost.toFixed(2)}
                    </div>
                  </div>

                  <p className="text-sm text-gray-300">{area.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#181d2a] p-3 rounded-lg border border-[#262f40]">
                    <div>
                      <span className="text-gray-400 font-medium">Método de Reparo:</span>
                      <div className="text-gray-200 mt-0.5">{area.repairMethod}</div>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Requer Substituição:</span>
                      <div className="text-gray-200 mt-0.5">{area.requiresReplacement ? 'Sim' : 'Não'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Peças Necessárias:</span>
                      <div className="text-gray-200 mt-0.5">
                        {area.partsNeeded && area.partsNeeded.length > 0 ? area.partsNeeded.join(', ') : 'Nenhuma'}
                      </div>
                    </div>
                  </div>

                  {area.images && area.images.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Fotos do Dano:</span>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {area.images.map((image, imgIndex) => (
                          <div key={imgIndex} className="w-16 h-16 bg-[#181d2a] border border-[#262f40] rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {report.damageAreas.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhuma área danificada detalhada neste relatório.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Linha do Tempo */}
        <TabsContent value="timeline" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#232b3b]">
              <Clock className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Histórico de Ocorrência e Tratativas</h3>
            </div>

            <div className="space-y-4 pl-2">
              {report.timeline.map((event, index) => (
                <div key={event.id} className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.eventType === 'DAMAGE_OCCURRED' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      event.eventType === 'REPORTED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                      event.eventType === 'INSPECTED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      event.eventType === 'REPAIR_STARTED' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                      event.eventType === 'REPAIR_COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {event.eventType === 'DAMAGE_OCCURRED' && <AlertTriangle className="h-4 w-4" />}
                      {event.eventType === 'REPORTED' && <FileText className="h-4 w-4" />}
                      {event.eventType === 'INSPECTED' && <Wrench className="h-4 w-4" />}
                      {event.eventType === 'REPAIR_STARTED' && <Activity className="h-4 w-4" />}
                      {event.eventType === 'REPAIR_COMPLETED' && <CheckCircle className="h-4 w-4" />}
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-[#10141e] border border-[#222b3d] p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{event.description}</span>
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(event.timestamp).toLocaleDateString('pt-BR')} {new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Responsável: <span className="text-gray-200">{event.reportedBy}</span>
                    </div>
                  </div>
                </div>
              ))}

              {report.timeline.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhum evento registrado na linha do tempo.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Documentos */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#232b3b]">
              <FileText className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Anexos e Documentos Comprobatórios</h3>
            </div>

            <div className="space-y-2.5">
              {report.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3.5 bg-[#10141e] border border-[#222b3d] rounded-xl hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      doc.type === 'PHOTO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                      doc.type === 'VIDEO' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' :
                      doc.type === 'POLICE_REPORT' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      doc.type === 'INSURANCE_CLAIM' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {doc.type === 'PHOTO' && <Camera className="h-4 w-4" />}
                      {doc.type === 'VIDEO' && <FileText className="h-4 w-4" />}
                      {doc.type === 'POLICE_REPORT' && <Shield className="h-4 w-4" />}
                      {doc.type === 'INSURANCE_CLAIM' && <Shield className="h-4 w-4" />}
                      {doc.type === 'OTHER' && <FileText className="h-4 w-4" />}
                    </div>
                    
                    <div>
                      <div className="font-semibold text-white text-sm">{doc.name}</div>
                      <div className="text-xs text-gray-400">{doc.description}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {getDocumentTypeLabel(doc.type)} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {report.documents.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhum documento anexado.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: Seguro */}
        <TabsContent value="insurance" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#232b3b]">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Acionamento de Seguro / Sinistro</h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Sinistro Acionado:</span>
              <Badge className={report.insurance.claimFiled ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60' : 'bg-gray-800 text-gray-400'}>
                {report.insurance.claimFiled ? 'Sim' : 'Não'}
              </Badge>
            </div>

            {report.insurance.claimFiled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 bg-[#10141e] p-4 rounded-xl border border-[#222b3d]">
                <div>
                  <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Número do Sinistro</label>
                  <div className="text-sm font-semibold text-white mt-1">{report.insurance.claimNumber || 'Não informado'}</div>
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Status do Sinistro</label>
                  <div className="text-sm font-semibold text-amber-400 mt-1">{report.insurance.claimStatus}</div>
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Seguradora</label>
                  <div className="text-sm text-gray-200 mt-1">{report.insurance.insuranceCompany || '-'}</div>
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Apólice</label>
                  <div className="text-sm text-gray-200 font-mono mt-1">{report.insurance.policyNumber || '-'}</div>
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Valor da Franquia</label>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                    R$ {report.insurance.deductible.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Cobertura Máxima</label>
                  <div className="text-sm font-bold font-mono text-blue-400 mt-1">
                    R$ {report.insurance.coverageAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 6: Reparo */}
        <TabsContent value="repair" className="space-y-4 mt-4">
          <div className="bg-[#181d2a] border border-[#262f40] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#232b3b]">
              <Wrench className="h-5 w-5 text-seguranca-yellow" />
              <h3 className="text-base font-bold text-white">Execução e Manutenção</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#10141e] border border-[#222b3d] p-3.5 rounded-xl">
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Mecânico / Oficina Atribuída</label>
                <div className="text-sm font-semibold text-white mt-1">
                  {report.repair.assignedToName || 'Nenhum profissional designado ainda'}
                </div>
              </div>

              <div className="bg-[#10141e] border border-[#222b3d] p-3.5 rounded-xl">
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Previsão de Conclusão</label>
                <div className="text-sm font-semibold text-white mt-1">
                  {report.repair.estimatedCompletionDate 
                    ? new Date(report.repair.estimatedCompletionDate).toLocaleDateString('pt-BR')
                    : 'Não definida'
                  }
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{report.repair.laborHours} horas estimadas</div>
              </div>
            </div>

            {report.repair.repairNotes && (
              <div>
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Notas Técnicas do Reparo</label>
                <p className="text-sm text-gray-300 mt-1 bg-[#10141e] p-3 rounded-xl border border-[#222b3d]">
                  {report.repair.repairNotes}
                </p>
              </div>
            )}

            {report.repair.partsUsed && report.repair.partsUsed.length > 0 && (
              <div>
                <label className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Peças e Insumos Utilizados</label>
                <div className="mt-1.5 space-y-2">
                  {report.repair.partsUsed.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-2.5 bg-[#10141e] border border-[#222b3d] rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-white">{part.partName}</div>
                        <div className="text-xs text-gray-400">{part.quantity}x • {part.supplier}</div>
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-400">
                        R$ {part.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#232b3b]">
              <Button 
                variant="outline"
                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                disabled={report.status === 'IN_PROGRESS'}
                className="bg-[#1a202c] border-[#2d3748] text-gray-200 hover:text-white hover:bg-[#252f40]"
              >
                <Activity className="h-4 w-4 mr-2 text-amber-400" />
                Iniciar Reparo
              </Button>
              
              <Button 
                onClick={() => handleStatusUpdate('RESOLVED')}
                disabled={report.status === 'RESOLVED'}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow font-medium"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir Reparo
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
