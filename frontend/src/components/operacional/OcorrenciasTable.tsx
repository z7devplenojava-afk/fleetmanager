import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  Search,
  Plus,
  RefreshCw,
  FileText,
  Calendar,
  UserX,
  Shield,
  Heart,
  Coffee,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Occurrence, occurrenceService } from '@/services/occurrenceService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employeeService, Employee } from '@/services/employeeService';

interface OcorrenciasTableProps {
  ocorrencias: Occurrence[];
  onRefresh: () => void;
  onEdit: (ocorrencia: Occurrence) => void;
  onDelete: (ocorrencia: Occurrence) => void;
  onView: (ocorrencia: Occurrence) => void;
  onCreate: () => void;
}

const OcorrenciasTable: React.FC<OcorrenciasTableProps> = ({
  ocorrencias,
  onRefresh,
  onEdit,
  onDelete,
  onView,
  onCreate
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pdfFilters, setPdfFilters] = useState({
    employeeId: '',
    type: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
    responsible: '',
    location: ''
  });

  useEffect(() => {
    employeeService.getAllEmployees().then(setEmployees);
  }, []);

  const getStatusVariant = (status: string): 'destructive' | 'secondary' | 'outline' | 'default' => {
    switch (status.toLowerCase()) {
      case 'aberta':
      case 'rejeitada':
        return 'destructive';
      case 'investigando':
        return 'secondary';
      case 'resolvida':
      case 'aprovada':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPriorityVariant = (priority: string): 'destructive' | 'secondary' | 'default' => {
    switch (priority.toLowerCase()) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'secondary';
      case 'baixa':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTipoIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'incidente':
        return <AlertTriangle className="h-4 w-4" />;
      case 'equipamento':
        return <CheckCircle className="h-4 w-4" />;
      case 'ausencia':
        return <UserX className="h-4 w-4" />;
      case 'manutencao':
        return <Clock className="h-4 w-4" />;
      case 'advertencia':
        return <AlertTriangle className="h-4 w-4" />;
      case 'folga':
        return <Calendar className="h-4 w-4" />;
      case 'ferias':
        return <Heart className="h-4 w-4" />;
      case 'licenca':
        return <FileText className="h-4 w-4" />;
      case 'dayoff':
        return <Coffee className="h-4 w-4" />;
      case 'atestado':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTipoText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'incidente':
        return 'Incidente';
      case 'equipamento':
        return 'Equipamento';
      case 'ausencia':
        return 'Ausência';
      case 'manutencao':
        return 'Manutenção';
      case 'advertencia':
        return 'Advertência';
      case 'folga':
        return 'Folga';
      case 'ferias':
        return 'Férias';
      case 'licenca':
        return 'Licença';
      case 'dayoff':
        return 'Day Off';
      case 'atestado':
        return 'Atestado';
      default:
        return type;
    }
  };

  const getTipoVariant = (type: string): 'destructive' | 'secondary' | 'outline' | 'default' => {
    switch (type.toLowerCase()) {
      case 'incidente':
      case 'advertencia':
        return 'destructive';
      case 'equipamento':
      case 'ferias':
        return 'default';
      case 'ausencia':
      case 'licenca':
        return 'secondary';
      case 'manutencao':
      case 'dayoff':
        return 'outline';
      case 'folga':
      case 'atestado':
        return 'default'; // Using 'default' for less critical types
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Verificar se ocorrencias é um array válido
  const safeOcorrencias = Array.isArray(ocorrencias) ? ocorrencias : [];
  
  const filteredOcorrencias = safeOcorrencias.filter(ocorrencia => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      ocorrencia.title.toLowerCase().includes(searchTermLower) ||
      ocorrencia.location.toLowerCase().includes(searchTermLower) ||
      ocorrencia.employeeName.toLowerCase().includes(searchTermLower);
    
    const matchesStatus = statusFilter === 'all' || ocorrencia.status.toLowerCase() === statusFilter;
    const matchesTipo = tipoFilter === 'all' || ocorrencia.type.toLowerCase() === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh();
      toast({
        title: 'Sucesso!',
        description: 'Lista de ocorrências atualizada.',
      });
    } catch (error) {
      toast({
        title: 'Erro!',
        description: 'Erro ao atualizar lista de ocorrências.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const filters: any = {};
      if (pdfFilters.employeeId && pdfFilters.employeeId !== 'all') filters.employeeId = pdfFilters.employeeId;
      if (pdfFilters.type && pdfFilters.type !== 'all') filters.type = pdfFilters.type;
      if (pdfFilters.status && pdfFilters.status !== 'all') filters.status = pdfFilters.status;
      if (pdfFilters.priority && pdfFilters.priority !== 'all') filters.priority = pdfFilters.priority;
      if (pdfFilters.startDate) filters.startDate = pdfFilters.startDate;
      if (pdfFilters.endDate) filters.endDate = pdfFilters.endDate;
      if (pdfFilters.responsible) filters.responsible = pdfFilters.responsible;
      if (pdfFilters.location) filters.location = pdfFilters.location;

      const blob = await occurrenceService.generatePDFReport(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-ocorrencias-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso!',
        description: 'Relatório PDF gerado com sucesso.',
      });
      setIsPDFModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro!',
        description: error?.response?.data?.message || 'Erro ao gerar relatório PDF. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (safeOcorrencias.length === 0) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Nenhuma ocorrência encontrada
            </h3>
            <p className="text-seguranca-lightgray">
              Não há ocorrências registradas no sistema.
            </p>
            <Button 
              onClick={onCreate}
              className="mt-4 bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Ocorrência
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Pesquisar ocorrências..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray"
          >
            <option value="all">Todos os status</option>
            <option value="aberta">Aberta</option>
            <option value="investigando">Investigando</option>
            <option value="resolvida">Resolvida</option>
            <option value="aprovada">Aprovada</option>
            <option value="rejeitada">Rejeitada</option>
          </select>
          
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray"
          >
            <option value="all">Todos os tipos</option>
            <option value="incidente">Incidente</option>
            <option value="equipamento">Equipamento</option>
            <option value="ausencia">Ausência</option>
            <option value="manutencao">Manutenção</option>
            <option value="advertencia">Advertência</option>
            <option value="folga">Folga</option>
            <option value="ferias">Férias</option>
            <option value="licenca">Licença</option>
            <option value="dayoff">Day Off</option>
            <option value="atestado">Atestado</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsPDFModalOpen(true)}
            className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
          >
            <FileText size={18} className="mr-2" />
            Gerar Relatório PDF
          </Button>
          
          <Button 
            onClick={onCreate}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Plus size={18} className="mr-2" /> 
            Nova Ocorrência
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              <TableHead className="text-seguranca-lightgray">Tipo</TableHead>
              <TableHead className="text-seguranca-lightgray">Título</TableHead>
              <TableHead className="text-seguranca-lightgray">Funcionário</TableHead>
              <TableHead className="text-seguranca-lightgray">Local</TableHead>
              <TableHead className="text-seguranca-lightgray">Status</TableHead>
              <TableHead className="text-seguranca-lightgray">Prioridade</TableHead>
              <TableHead className="text-seguranca-lightgray">Data</TableHead>
              <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOcorrencias.map((ocorrencia) => (
              <TableRow key={ocorrencia.id} className="border-gray-600 hover:bg-seguranca-black">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTipoVariant(ocorrencia.type)} className="p-2">
                      {getTipoIcon(ocorrencia.type)}
                    </Badge>
                    <span className="text-seguranca-lightgray">{getTipoText(ocorrencia.type)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-seguranca-lightgray">{ocorrencia.title}</div>
                  <div className="text-sm text-gray-400 truncate max-w-xs">{ocorrencia.description}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400"/>
                    {ocorrencia.employeeName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400"/>
                    {ocorrencia.location}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(ocorrencia.status)}>
                    {ocorrencia.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityVariant(ocorrencia.priority)}>
                    {ocorrencia.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Calendar className="h-4 w-4 text-gray-400"/>
                    {formatDate(ocorrencia.date)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(ocorrencia)}
                      title="Visualizar Ocorrência"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(ocorrencia)}
                      title="Editar Ocorrência"
                      className="text-green-600 hover:text-green-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(ocorrencia)}
                      title="Excluir Ocorrência"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Geração de PDF */}
      <Dialog open={isPDFModalOpen} onOpenChange={setIsPDFModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              Gerar Relatório PDF de Ocorrências
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Funcionário</Label>
                <Select 
                  value={pdfFilters.employeeId} 
                  onValueChange={(value) => setPdfFilters({ ...pdfFilters, employeeId: value })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todos os funcionários" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all">Todos os funcionários</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Tipo</Label>
                <Select 
                  value={pdfFilters.type} 
                  onValueChange={(value) => setPdfFilters({ ...pdfFilters, type: value })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="SEGURANCA">Segurança</SelectItem>
                    <SelectItem value="DISCIPLINAR">Disciplinar</SelectItem>
                    <SelectItem value="EQUIPAMENTO">Equipamento</SelectItem>
                    <SelectItem value="INCIDENTE">Incidente</SelectItem>
                    <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Status</Label>
                <Select 
                  value={pdfFilters.status} 
                  onValueChange={(value) => setPdfFilters({ ...pdfFilters, status: value })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Prioridade</Label>
                <Select 
                  value={pdfFilters.priority} 
                  onValueChange={(value) => setPdfFilters({ ...pdfFilters, priority: value })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Data Início</Label>
                <Input
                  type="date"
                  value={pdfFilters.startDate}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, startDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Data Fim</Label>
                <Input
                  type="date"
                  value={pdfFilters.endDate}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, endDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Responsável</Label>
                <Input
                  value={pdfFilters.responsible}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, responsible: e.target.value })}
                  placeholder="Filtrar por responsável..."
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Local</Label>
                <Input
                  value={pdfFilters.location}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, location: e.target.value })}
                  placeholder="Filtrar por local..."
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => setIsPDFModalOpen(false)}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OcorrenciasTable; 