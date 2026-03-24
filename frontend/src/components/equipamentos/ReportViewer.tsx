import React from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Shield,
  BarChart3,
  Clock,
  FileText,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface ReportData {
  type: string;
  data: any[];
  generatedAt: string;
}

interface ReportViewerProps {
  reportData: ReportData;
  onClose: () => void;
  onExport?: (format: string) => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ reportData, onClose, onExport }) => {
  const { type, data, generatedAt } = reportData;

  const getReportIcon = (reportType: string) => {
    switch (reportType) {
      case 'equipment_by_employee':
        return <Users className="w-6 h-6 text-blue-400" />;
      case 'weapon_validity':
        return <Shield className="w-6 h-6 text-red-400" />;
      case 'usage_report':
        return <BarChart3 className="w-6 h-6 text-green-400" />;
      case 'expiration_report':
        return <Clock className="w-6 h-6 text-orange-400" />;
      case 'general_report':
        return <FileText className="w-6 h-6 text-purple-400" />;
      default:
        return <FileText className="w-6 h-6 text-gray-400" />;
    }
  };

  const getReportTitle = (reportType: string) => {
    switch (reportType) {
      case 'equipment_by_employee':
        return 'Equipamentos por Funcionário';
      case 'weapon_validity':
        return 'Validade de Armas';
      case 'usage_report':
        return 'Relatório de Uso';
      case 'expiration_report':
        return 'Relatório de Vencimento';
      case 'general_report':
        return 'Relatório Geral';
      default:
        return 'Relatório';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
      case 'INATIVO':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inativo</Badge>;
      case 'MANUTENCAO':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Manutenção</Badge>;
      case 'VÁLIDA':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Válida</Badge>;
      case 'VENCENDO':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Vencendo</Badge>;
      case 'CRÍTICO':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Crítico</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>;
    }
  };

  const renderEquipmentByEmployeeReport = () => {
    return (
      <div className="space-y-6">
        {data.map((employee: any, index: number) => (
          <Card key={index} className="bg-seguranca-black border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-seguranca-lightgray">
                <Users className="w-5 h-5 text-blue-400" />
                {employee.employeeName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{employee.totalEquipment}</div>
                  <div className="text-sm text-gray-400">Total</div>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{employee.activeEquipment}</div>
                  <div className="text-sm text-gray-400">Ativos</div>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">{employee.inactiveEquipment}</div>
                  <div className="text-sm text-gray-400">Inativos</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-300 mb-3">Equipamentos:</h4>
                {employee.equipmentDetails?.map((equipment: any, eqIndex: number) => (
                  <div key={eqIndex} className="flex items-center justify-between p-3 bg-seguranca-graphite rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-seguranca-lightgray">{equipment.equipmentName}</div>
                        <div className="text-sm text-gray-400">S/N: {equipment.serialNumber}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(equipment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderWeaponValidityReport = () => {
    return (
      <div className="space-y-4">
        {data.map((weapon: any, index: number) => (
          <Card key={index} className="bg-seguranca-black border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-seguranca-lightgray">{weapon.weaponName}</div>
                    <div className="text-sm text-gray-400">S/N: {weapon.serialNumber}</div>
                    <div className="text-sm text-gray-400">Registro: {weapon.registrationNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Válida até</div>
                  <div className="font-semibold text-seguranca-lightgray">{weapon.validityDate}</div>
                  <div className="text-sm text-gray-400">{weapon.daysToExpire} dias</div>
                  {getStatusBadge(weapon.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderGeneralReport = () => {
    const summary = data.find(item => item.summary)?.summary;
    const typeDetails = data.filter(item => item.equipmentType);

    return (
      <div className="space-y-6">
        {/* Resumo Geral */}
        {summary && (
          <Card className="bg-seguranca-black border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-seguranca-lightgray">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Resumo Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-blue-400">{summary.totalEquipment}</div>
                  <div className="text-sm text-gray-400">Total Equipamentos</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-green-400">{summary.activeEquipment}</div>
                  <div className="text-sm text-gray-400">Ativos</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-red-400">{summary.inactiveEquipment}</div>
                  <div className="text-sm text-gray-400">Inativos</div>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-400">{summary.maintenanceEquipment}</div>
                  <div className="text-sm text-gray-400">Manutenção</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalhes por Tipo */}
        {typeDetails.map((typeDetail: any, index: number) => (
          <Card key={index} className="bg-seguranca-black border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-seguranca-lightgray">
                <Shield className="w-5 h-5 text-blue-400" />
                {typeDetail.equipmentType}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{typeDetail.total}</div>
                  <div className="text-sm text-gray-400">Total</div>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{typeDetail.active}</div>
                  <div className="text-sm text-gray-400">Ativos</div>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">{typeDetail.inactive}</div>
                  <div className="text-sm text-gray-400">Inativos</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-300 mb-3">Detalhes:</h4>
                {typeDetail.details?.map((detail: any, detailIndex: number) => (
                  <div key={detailIndex} className="flex items-center justify-between p-3 bg-seguranca-graphite rounded-lg">
                    <div className="font-medium text-seguranca-lightgray">{detail.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{detail.assignedTo}</span>
                      {getStatusBadge(detail.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };


  const renderContent = () => {
    switch (type) {
      case 'equipment_by_employee':
        return renderEquipmentByEmployeeReport();
      case 'weapon_validity':
        return renderWeaponValidityReport();
      case 'general_report':
        return renderGeneralReport();
      default:
        return (
          <Card className="bg-seguranca-black border-gray-600">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Relatório Gerado</h3>
              <p className="text-gray-400">Visualização não disponível para este tipo de relatório.</p>
            </CardContent>
          </Card>
        );
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" 
      style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-seguranca-graphite rounded-lg border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden" 
        style={{ zIndex: 100000, position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            {getReportIcon(type)}
            <div>
              <h2 className="text-xl font-semibold text-seguranca-lightgray">
                {getReportTitle(type)}
              </h2>
              <p className="text-sm text-gray-400">
                Gerado em {new Date(generatedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport('pdf')}
                  className="bg-seguranca-black border-gray-600 hover:bg-seguranca-graphite"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport('excel')}
                  className="bg-seguranca-black border-gray-600 hover:bg-seguranca-graphite"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );

  // Renderizar usando Portal para garantir que fique acima de tudo
  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default ReportViewer;
