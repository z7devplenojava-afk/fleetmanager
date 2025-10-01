import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Download, 
  Filter, 
  Users, 
  Shield, 
  Clock, 
  AlertTriangle,
  Loader2,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  EquipmentReportFilters, 
  REPORT_TYPES, 
  REPORT_TYPE_LABELS 
} from '@/types/equipmentReport';
import { 
  EQUIPMENT_STATUS_LABELS,
  PROTECTION_LEVEL_LABELS,
  EQUIPMENT_USAGE_LABELS,
  EQUIPMENT_SIZE_LABELS
} from '@/types/equipment';
import equipmentReportService from '@/services/equipmentReportService';

interface EquipmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: React.ReactNode;
}

const EquipmentReportModal: React.FC<EquipmentReportModalProps> = ({
  isOpen,
  onClose,
  trigger
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<EquipmentReportFilters>({
    reportType: 'general',
    page: 0,
    pageSize: 20
  });

  const handleFilterChange = (field: keyof EquipmentReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      
      let report;
      switch (filters.reportType) {
        case 'equipment_by_employee':
          report = await equipmentReportService.generateEquipmentByEmployeeReport(filters);
          break;
        case 'weapon_validity':
          report = await equipmentReportService.generateWeaponValidityReport(filters);
          break;
        case 'usage_report':
          report = await equipmentReportService.generateUsageReport(filters);
          break;
        case 'expiry_report':
          report = await equipmentReportService.generateExpiryReport(filters);
          break;
        default:
          report = await equipmentReportService.generateReport(filters);
      }

      toast({
        title: "Relatório Gerado",
        description: `Relatório "${report.reportTitle}" gerado com sucesso!`,
      });

      // TODO: Abrir modal com resultado do relatório
      console.log('Relatório gerado:', report);
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setLoading(true);
      const blob = await equipmentReportService.exportToPdf(filters);
      equipmentReportService.downloadBlob(blob, `relatorio_equipamentos_${filters.reportType}.pdf`);
      
      toast({
        title: "PDF Exportado",
        description: "Relatório exportado em PDF com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const blob = await equipmentReportService.exportToExcel(filters);
      equipmentReportService.downloadBlob(blob, `relatorio_equipamentos_${filters.reportType}.xlsx`);
      
      toast({
        title: "Excel Exportado",
        description: "Relatório exportado em Excel com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar Excel. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBasicFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="searchTerm">Buscar</Label>
        <Input
          id="searchTerm"
          placeholder="Número de série, modelo, lote..."
          value={filters.searchTerm || ''}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(EQUIPMENT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="protectionLevel">Nível de Proteção</Label>
        <Select value={filters.protectionLevel || ''} onValueChange={(value) => handleFilterChange('protectionLevel', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(PROTECTION_LEVEL_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="usage">Uso</Label>
        <Select value={filters.usage || ''} onValueChange={(value) => handleFilterChange('usage', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o uso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(EQUIPMENT_USAGE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderExpiryFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isExpired"
          checked={filters.isExpired || false}
          onCheckedChange={(checked) => handleFilterChange('isExpired', checked)}
        />
        <Label htmlFor="isExpired">Apenas vencidos</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isExpiringSoon"
          checked={filters.isExpiringSoon || false}
          onCheckedChange={(checked) => handleFilterChange('isExpiringSoon', checked)}
        />
        <Label htmlFor="isExpiringSoon">Vencendo em breve</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isDangerous"
          checked={filters.isDangerous || false}
          onCheckedChange={(checked) => handleFilterChange('isDangerous', checked)}
        />
        <Label htmlFor="isDangerous">Apenas perigosos (armas)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isWeaponRegistrationExpired"
          checked={filters.isWeaponRegistrationExpired || false}
          onCheckedChange={(checked) => handleFilterChange('isWeaponRegistrationExpired', checked)}
        />
        <Label htmlFor="isWeaponRegistrationExpired">Registro de arma vencido</Label>
      </div>
    </div>
  );

  const renderReportTypes = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(REPORT_TYPES).map(([key, value]) => (
        <Card 
          key={key}
          className={`cursor-pointer transition-colors ${
            filters.reportType === value 
              ? 'border-blue-500 bg-blue-50' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => handleFilterChange('reportType', value)}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                filters.reportType === value ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {value === 'equipment_by_employee' && <Users className="h-5 w-5" />}
                {value === 'weapon_validity' && <Shield className="h-5 w-5" />}
                {value === 'usage_report' && <BarChart3 className="h-5 w-5" />}
                {value === 'expiry_report' && <Clock className="h-5 w-5" />}
                {value === 'general' && <FileText className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-medium">{REPORT_TYPE_LABELS[value]}</h3>
                <p className="text-sm text-gray-500">
                  {value === 'equipment_by_employee' && 'Equipamentos agrupados por funcionário'}
                  {value === 'weapon_validity' && 'Validade de registros de armas'}
                  {value === 'usage_report' && 'Estatísticas de uso e movimentações'}
                  {value === 'expiry_report' && 'Equipamentos vencidos ou vencendo'}
                  {value === 'general' && 'Relatório geral de equipamentos'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const content = (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gerar Relatório de Equipamentos
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="report-type" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="report-type">Tipo de Relatório</TabsTrigger>
          <TabsTrigger value="filters">Filtros</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="report-type" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Selecione o tipo de relatório:</h3>
            {renderReportTypes()}
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Básicos
            </h3>
            {renderBasicFilters()}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Filtros de Vencimento
            </h3>
            {renderExpiryFilters()}
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Exportar Relatório</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleExportPdf} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Exportar PDF
              </Button>
              
              <Button 
                onClick={handleExportExcel} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Exportar Excel
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleGenerateReport} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          Gerar Relatório
        </Button>
      </div>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {content}
    </Dialog>
  );
};

export default EquipmentReportModal; 