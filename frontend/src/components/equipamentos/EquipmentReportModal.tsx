import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  Shield, 
  BarChart3, 
  Clock, 
  Download,
  Filter,
  X,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { equipmentReportService, EquipmentReportRequest } from '@/services/equipmentReportService';
import { equipmentReportGenerator, EquipmentReportData } from '@/utils/equipmentReportGenerator';
import ReportViewer from './ReportViewer';

interface EquipmentReportModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onReportGenerated?: (reportData: any) => void;
}

type ReportType = 'equipment_by_employee' | 'weapon_validity' | 'usage_report' | 'expiration_report' | 'general_report';

interface ReportTypeConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const reportTypes: ReportTypeConfig[] = [
  {
    id: 'equipment_by_employee',
    title: 'Equipamentos por Funcionário',
    description: 'Equipamentos agrupados por funcionário',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-blue-500/20 text-blue-400'
  },
  {
    id: 'weapon_validity',
    title: 'Validade de Armas',
    description: 'Validade de registros de armas',
    icon: <Shield className="w-6 h-6" />,
    color: 'bg-red-500/20 text-red-400'
  },
  {
    id: 'usage_report',
    title: 'Relatório de Uso',
    description: 'Estatísticas de uso e movimentações',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'bg-green-500/20 text-green-400'
  },
  {
    id: 'expiration_report',
    title: 'Relatório de Vencimento',
    description: 'Equipamentos vencidos ou vencendo',
    icon: <Clock className="w-6 h-6" />,
    color: 'bg-orange-500/20 text-orange-400'
  },
  {
    id: 'general_report',
    title: 'Relatório Geral',
    description: 'Relatório geral de equipamentos',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-purple-500/20 text-purple-400'
  }
];

const EquipmentReportModal: React.FC<EquipmentReportModalProps> = ({
  isOpen = false, 
  onClose,
  onReportGenerated 
}) => {
  const [open, setOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('general_report');
  const [currentStep, setCurrentStep] = useState<'type' | 'filters' | 'export'>('type');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Encontrar a configuração do relatório selecionado
  const selectedReportConfig = reportTypes.find(type => type.id === selectedReportType);

  // Sincronizar estado interno com prop isOpen
  React.useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Função para fechar o modal
  const handleClose = () => {
    setOpen(false);
    setCurrentStep('type');
    onClose?.();
  };

  const handleReportTypeSelect = (type: ReportType) => {
    setSelectedReportType(type);
  };

  const handleNextStep = () => {
    if (currentStep === 'type') {
      setCurrentStep('filters');
    } else if (currentStep === 'filters') {
      setCurrentStep('export');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'filters') {
      setCurrentStep('type');
    } else if (currentStep === 'export') {
      setCurrentStep('filters');
    }
  };

  const handleGenerateReport = async () => {
      setLoading(true);
      
    try {
      console.log('🔗 Gerando relatório:', selectedReportType);
      
      const reportRequest: EquipmentReportRequest = {
        reportType: selectedReportType,
        startDate: '2025-01-01', // Valores padrão para demonstração
        endDate: '2025-01-31',
        exportFormat: 'pdf'
      };

      let reportData;
      
      // Chamar o serviço apropriado baseado no tipo de relatório
      switch (selectedReportType) {
        case 'equipment_by_employee':
          reportData = await equipmentReportService.getEquipmentByEmployeeReport(reportRequest);
          break;
        case 'weapon_validity':
          reportData = await equipmentReportService.getWeaponValidityReport(reportRequest);
          break;
        case 'usage_report':
          reportData = await equipmentReportService.getUsageReport(reportRequest);
          break;
        case 'expiration_report':
          reportData = await equipmentReportService.getExpirationReport(reportRequest);
          break;
        case 'general_report':
          reportData = await equipmentReportService.getGeneralReport(reportRequest);
          break;
        default:
          throw new Error('Tipo de relatório não suportado');
      }
      
      console.log('✅ Relatório gerado com sucesso:', reportData);
      
      // Armazenar o relatório gerado e mostrar o visualizador
      setGeneratedReport({
        type: selectedReportType,
        data: reportData.data,
        generatedAt: reportData.generatedAt
      });
      
      setShowReportViewer(true);
      handleClose();
      setCurrentStep('type');

      toast({
        title: "Relatório Gerado",
        description: `Relatório "${reportTypes.find(t => t.id === selectedReportType)?.title}" gerado com sucesso!`,
        variant: "default"
      });

      onReportGenerated?.({
        type: selectedReportType,
        data: reportData.data,
        generatedAt: reportData.generatedAt
      });
      
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const [selectedExportFormat, setSelectedExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [showReportViewer, setShowReportViewer] = useState(false);

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    setLoading(true);
    
    try {
      console.log('🔗 Exportando relatório:', selectedReportType, 'formato:', format);
      
      const reportRequest: EquipmentReportRequest = {
        reportType: selectedReportType,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        exportFormat: format
      };

      let blob;
      
      // Para PDF, usar o gerador do frontend quando há dados gerados
      if (format === 'pdf' && generatedReport && generatedReport.data && generatedReport.data.length > 0) {
        console.log('📄 Gerando PDF no frontend usando dados do relatório:', generatedReport.type);
        blob = await equipmentReportGenerator.generatePDF(
          generatedReport.type,
          generatedReport.data,
          {
            startDate: reportRequest.startDate,
            endDate: reportRequest.endDate,
            status: reportRequest.status,
            equipmentType: reportRequest.equipmentType
          }
        );
      } else {
        // Para outros formatos ou quando não há dados gerados, usar o backend
        switch (format) {
          case 'pdf':
            blob = await equipmentReportService.exportToPdf(reportRequest);
            break;
          case 'excel':
            blob = await equipmentReportService.exportToExcel(reportRequest);
            break;
          case 'csv':
            blob = await equipmentReportService.exportToCsv(reportRequest);
            break;
          default:
            throw new Error('Formato de exportação não suportado');
        }
      }
      
      // Fazer download do arquivo
      const filename = `equipment_report_${selectedReportType}_${new Date().toISOString().split('T')[0]}.${format}`;
      equipmentReportService.downloadFile(blob, filename);
      
      console.log('✅ Relatório exportado com sucesso:', filename);
      
      toast({
        title: "Relatório Exportado",
        description: `Relatório exportado como ${format.toUpperCase()} com sucesso!`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('❌ Erro ao exportar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      }
    }}>
      <DialogContent className="bg-seguranca-graphite text-seguranca-lightgray border-gray-700 sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-seguranca-red/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-seguranca-red" />
      </div>
      <div>
                <DialogTitle className="text-xl font-semibold">
                  Gerar Relatório de Equipamentos
                </DialogTitle>
                <p className="text-gray-400 mt-1">
                  Selecione o tipo de relatório e configure os filtros
                </p>
      </div>
    </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
      </div>
      
          {/* Navegação por etapas */}
          <div className="flex items-center gap-2 mt-6">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              currentStep === 'type' 
                ? 'bg-seguranca-red/20 text-seguranca-red border border-seguranca-red/30' 
                : 'bg-gray-700/50 text-gray-400'
            }`}>
              <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <span className="font-medium">Tipo de Relatório</span>
      </div>
      
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              currentStep === 'filters' 
                ? 'bg-seguranca-red/20 text-seguranca-red border border-seguranca-red/30' 
                : 'bg-gray-700/50 text-gray-400'
            }`}>
              <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <span className="font-medium">Filtros</span>
      </div>
      
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              currentStep === 'export' 
                ? 'bg-seguranca-red/20 text-seguranca-red border border-seguranca-red/30' 
                : 'bg-gray-700/50 text-gray-400'
            }`}>
              <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <span className="font-medium">Exportar</span>
      </div>
    </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Etapa 1: Seleção do Tipo de Relatório */}
          {currentStep === 'type' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Selecione o tipo de relatório:</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((reportType) => (
        <Card 
                    key={reportType.id}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                      selectedReportType === reportType.id
                        ? 'ring-2 ring-seguranca-red bg-seguranca-red/10'
                        : 'bg-seguranca-black border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => handleReportTypeSelect(reportType.id)}
        >
          <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${reportType.color}`}>
                          {reportType.icon}
              </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-seguranca-lightgray mb-1">
                            {reportType.title}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {reportType.description}
                </p>
              </div>
                        {selectedReportType === reportType.id && (
                          <div className="w-6 h-6 rounded-full bg-seguranca-red flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
            </div>
          )}

          {/* Etapa 2: Filtros */}
          {currentStep === 'filters' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Configure os filtros:</h3>
              <div className="space-y-4">
                <Card className="bg-seguranca-black border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Filter className="w-5 h-5 text-seguranca-red" />
                      <h4 className="font-semibold">Filtros de Período</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Data Inicial
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 bg-seguranca-graphite border border-gray-600 rounded-md text-seguranca-lightgray focus:ring-seguranca-red focus:border-seguranca-red"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Data Final
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 bg-seguranca-graphite border border-gray-600 rounded-md text-seguranca-lightgray focus:ring-seguranca-red focus:border-seguranca-red"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-black border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="w-5 h-5 text-seguranca-red" />
                      <h4 className="font-semibold">Filtros Adicionais</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Status do Equipamento
                        </label>
                        <select className="w-full px-3 py-2 bg-seguranca-graphite border border-gray-600 rounded-md text-seguranca-lightgray focus:ring-seguranca-red focus:border-seguranca-red">
                          <option value="">Todos</option>
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                          <option value="maintenance">Manutenção</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tipo de Equipamento
                        </label>
                        <select className="w-full px-3 py-2 bg-seguranca-graphite border border-gray-600 rounded-md text-seguranca-lightgray focus:ring-seguranca-red focus:border-seguranca-red">
                          <option value="">Todos</option>
                          <option value="weapon">Arma</option>
                          <option value="uniform">Uniforme</option>
                          <option value="equipment">Equipamento</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Etapa 3: Exportação */}
          {currentStep === 'export' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Configurações de Exportação:</h3>
              <div className="space-y-4">
                <Card className="bg-seguranca-black border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Download className="w-5 h-5 text-seguranca-red" />
                      <h4 className="font-semibold">Formato de Exportação</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div 
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedExportFormat === 'pdf'
                            ? 'border-seguranca-red bg-seguranca-red/10'
                            : 'border-gray-600 hover:border-seguranca-red'
                        }`}
                        onClick={() => setSelectedExportFormat('pdf')}
                      >
                        <FileText className="w-6 h-6 text-red-400" />
                        <div>
                          <div className="font-medium">PDF</div>
                          <div className="text-sm text-gray-400">Documento PDF</div>
                        </div>
                        {selectedExportFormat === 'pdf' && (
                          <CheckCircle2 className="w-5 h-5 text-seguranca-red" />
                        )}
                      </div>
                      <div 
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedExportFormat === 'excel'
                            ? 'border-seguranca-red bg-seguranca-red/10'
                            : 'border-gray-600 hover:border-seguranca-red'
                        }`}
                        onClick={() => setSelectedExportFormat('excel')}
                      >
                        <BarChart3 className="w-6 h-6 text-green-400" />
          <div>
                          <div className="font-medium">Excel</div>
                          <div className="text-sm text-gray-400">Planilha Excel</div>
                        </div>
                        {selectedExportFormat === 'excel' && (
                          <CheckCircle2 className="w-5 h-5 text-seguranca-red" />
                        )}
          </div>
                      <div 
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedExportFormat === 'csv'
                            ? 'border-seguranca-red bg-seguranca-red/10'
                            : 'border-gray-600 hover:border-seguranca-red'
                        }`}
                        onClick={() => setSelectedExportFormat('csv')}
                      >
                        <FileText className="w-6 h-6 text-blue-400" />
          <div>
                          <div className="font-medium">CSV</div>
                          <div className="text-sm text-gray-400">Arquivo CSV</div>
                        </div>
                        {selectedExportFormat === 'csv' && (
                          <CheckCircle2 className="w-5 h-5 text-seguranca-red" />
                        )}
                      </div>
          </div>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-black border-gray-600">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Resumo do Relatório</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tipo:</span>
                        <span className="text-seguranca-lightgray">{selectedReportConfig?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Período:</span>
                        <span className="text-seguranca-lightgray">Últimos 30 dias</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Formato:</span>
                        <span className="text-seguranca-lightgray">{selectedExportFormat.toUpperCase()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          </div>

        {/* Rodapé com botões de navegação */}
        <div className="flex justify-between pt-6 border-t border-gray-600">
          <div>
            {currentStep !== 'type' && (
              <Button 
                variant="outline"
                onClick={handlePreviousStep}
                className="bg-seguranca-black border-gray-600 hover:bg-seguranca-graphite hover:border-gray-500"
              >
                Voltar
              </Button>
            )}
          </div>
              
          <div className="flex gap-3">
              <Button 
                variant="outline"
              onClick={() => setOpen(false)}
              className="bg-seguranca-black border-gray-600 hover:bg-seguranca-graphite hover:border-gray-500"
            >
          Cancelar
        </Button>
              
            {currentStep === 'export' ? (
        <Button 
          onClick={handleGenerateReport} 
          disabled={loading}
                className="bg-seguranca-red hover:bg-seguranca-red/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Gerando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
          Gerar Relatório
                  </div>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                className="bg-seguranca-red hover:bg-seguranca-red/80 transition-colors"
              >
                Próximo
        </Button>
            )}
          </div>
      </div>
    </DialogContent>
      
      {/* Visualizador de Relatórios */}
      {showReportViewer && generatedReport && (
        <ReportViewer
          reportData={generatedReport}
          onClose={() => {
            setShowReportViewer(false);
            setGeneratedReport(null);
          }}
          onExport={(format) => {
            const reportRequest: EquipmentReportRequest = {
              reportType: generatedReport.type,
              startDate: '2025-01-01',
              endDate: '2025-01-31',
              exportFormat: format
            };
            handleExportReport(format as 'pdf' | 'excel' | 'csv');
          }}
        />
      )}
    </Dialog>
  );
};

export default EquipmentReportModal; 