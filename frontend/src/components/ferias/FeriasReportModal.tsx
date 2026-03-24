import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { feriasService } from '@/services/feriasService';
import { employeeService, Employee } from '@/services/employeeService';
import { useQuery } from '@tanstack/react-query';
import { 
  FileSpreadsheet, 
  Download, 
  BarChart3, 
  Calendar,
  Users,
  TrendingUp,
  X
} from 'lucide-react';

interface FeriasReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportFilters {
  employeeId: string;
  status: string;
  tipo: string;
  dataInicio: string;
  dataFim: string;
}

const FeriasReportModal: React.FC<FeriasReportModalProps> = ({ isOpen, onClose }) => {
  const [filters, setFilters] = useState<ReportFilters>({
    employeeId: '',
    status: '',
    tipo: '',
    dataInicio: '',
    dataFim: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Buscar funcionários para filtros
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAllEmployees(),
  });

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['ferias-stats'],
    queryFn: () => feriasService.getAllStats(),
    enabled: isOpen
  });

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateReport = async (type: 'ferias' | 'afastamentos' | 'consolidado') => {
    try {
      setIsGenerating(true);
      
      const reportFilters = {
        employeeId: filters.employeeId || undefined,
        status: filters.status || undefined,
        tipo: filters.tipo || undefined,
        dataInicio: filters.dataInicio || undefined,
        dataFim: filters.dataFim || undefined
      };

      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'ferias':
          blob = await feriasService.exportFerias(reportFilters);
          filename = 'relatorio_ferias.xlsx';
          break;
        case 'afastamentos':
          blob = await feriasService.exportAfastamentos(reportFilters);
          filename = 'relatorio_afastamentos.xlsx';
          break;
        case 'consolidado':
          blob = await feriasService.exportConsolidado(reportFilters);
          filename = 'relatorio_consolidado.xlsx';
          break;
      }

      // Download do arquivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: `Relatório ${type} gerado com sucesso!`,
        variant: "default"
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-seguranca-yellow" />
            Relatórios de Férias e Afastamentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-seguranca-yellow text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Estatísticas de Férias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <Badge variant="outline" className="text-seguranca-yellow border-seguranca-yellow">
                        {stats.ferias?.total || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pendentes:</span>
                      <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                        {stats.ferias?.pendentes || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aprovadas:</span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {stats.ferias?.aprovadas || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rejeitadas:</span>
                      <Badge variant="outline" className="text-red-400 border-red-400">
                        {stats.ferias?.rejeitadas || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-seguranca-yellow text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Estatísticas de Afastamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <Badge variant="outline" className="text-seguranca-yellow border-seguranca-yellow">
                        {stats.afastamentos?.total || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pendentes:</span>
                      <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                        {stats.afastamentos?.pendentes || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aprovados:</span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {stats.afastamentos?.aprovados || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rejeitados:</span>
                      <Badge variant="outline" className="text-red-400 border-red-400">
                        {stats.afastamentos?.rejeitados || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-seguranca-yellow" />
                Filtros do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-gray-300 text-sm">
                    Funcionário
                  </Label>
                  <Select
                    value={filters.employeeId || 'all'}
                    onValueChange={(value) => handleFilterChange('employeeId', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                      <SelectValue placeholder="Todos os funcionários" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">
                        Todos os funcionários
                      </SelectItem>
                      {employees?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id} className="text-white hover:bg-gray-700">
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-300 text-sm">
                    Status
                  </Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">
                        Todos os status
                      </SelectItem>
                      <SelectItem value="PENDING" className="text-white hover:bg-gray-700">
                        Pendente
                      </SelectItem>
                      <SelectItem value="APPROVED" className="text-white hover:bg-gray-700">
                        Aprovado
                      </SelectItem>
                      <SelectItem value="REJECTED" className="text-white hover:bg-gray-700">
                        Rejeitado
                      </SelectItem>
                      <SelectItem value="CANCELLED" className="text-white hover:bg-gray-700">
                        Cancelado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-gray-300 text-sm">
                    Tipo
                  </Label>
                  <Select
                    value={filters.tipo || 'all'}
                    onValueChange={(value) => handleFilterChange('tipo', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">
                        Todos os tipos
                      </SelectItem>
                      <SelectItem value="FERIAS_NORMAIS" className="text-white hover:bg-gray-700">
                        Férias Normais
                      </SelectItem>
                      <SelectItem value="FERIAS_VENDIDAS" className="text-white hover:bg-gray-700">
                        Férias Vendidas
                      </SelectItem>
                      <SelectItem value="ABONO_PECUNIARIO" className="text-white hover:bg-gray-700">
                        Abono Pecuniário
                      </SelectItem>
                      <SelectItem value="ATESTADO" className="text-white hover:bg-gray-700">
                        Atestado
                      </SelectItem>
                      <SelectItem value="LICENCA_MEDICA" className="text-white hover:bg-gray-700">
                        Licença Médica
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataInicio" className="text-gray-300 text-sm">
                    Data Início
                  </Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFim" className="text-gray-300 text-sm">
                    Data Fim
                  </Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Relatório */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => generateReport('ferias')}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Relatório de Férias
            </Button>

            <Button
              onClick={() => generateReport('afastamentos')}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Relatório de Afastamentos
            </Button>

            <Button
              onClick={() => generateReport('consolidado')}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Relatório Consolidado
            </Button>
          </div>

          {isGenerating && (
            <div className="text-center text-seguranca-yellow">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-seguranca-yellow mx-auto mb-2"></div>
              Gerando relatório...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeriasReportModal;
