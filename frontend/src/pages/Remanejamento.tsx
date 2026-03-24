import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import RemanejamentoFormModal from '@/components/funcionarios/RemanejamentoFormModal';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { remanejamentoService, Remanejamento } from '@/services/remanejamentoService';
import { Loader2, Plus, Filter, Search, RefreshCw, Download, Eye, Trash2 } from 'lucide-react';
import { employeeService, Employee } from '@/services/employeeService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { RemanejamentoTipo } from '@/types/remanejamento';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ConfirmDeleteModal from '@/components/operacional/ConfirmDeleteModal';

const tipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'TRANSFERENCIA_UNIDADE', label: 'Transferência de Unidade' },
  { value: 'TROCA_FUNCAO', label: 'Troca de Função' },
  { value: 'PROMOCAO', label: 'Promoção' },
  { value: 'OUTROS', label: 'Outros' },
];

const RemanejamentoPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRemanejamento, setSelectedRemanejamento] = useState<Remanejamento | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [remanejamentoToDelete, setRemanejamentoToDelete] = useState<Remanejamento | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState({
    tipo: '',
    funcionarioId: '',
    dataInicio: '',
    dataFim: ''
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const { toast } = useToast();
  
  // State for PDF report modal
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfFilters, setPdfFilters] = useState({
    employeeId: '',
    tipo: '',
    startDate: '',
    endDate: ''
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, workPostsData] = await Promise.all([
          employeeService.getAllEmployees(),
          workPostService.getAllWorkPosts()
        ]);
        setEmployees(employeesData);
        setWorkPosts(workPostsData);
        console.log('✅ Dados carregados:', {
          employees: employeesData.length,
          workPosts: workPostsData.length
        });
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar todas as informações. Alguns campos podem não aparecer corretamente.",
          variant: "destructive",
        });
      }
    };
    loadData();
  }, [toast]);

  // Função helper para verificar se uma string é um UUID válido
  const isValidUUID = (str: string | undefined | null): boolean => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Função helper para obter o nome do posto de trabalho
  const getWorkPostName = (workstationId: string | undefined | null): string => {
    if (!workstationId) {
      return '-';
    }

    // Se é um UUID válido, buscar na lista de postos de trabalho
    if (isValidUUID(workstationId)) {
      const workPost = workPosts.find(wp => wp.id === workstationId);
      if (workPost) {
        return `${workPost.postCode} - ${workPost.name}`;
      }
      
      // Se não encontrar e ainda está carregando, mostrar mensagem
      if (workPosts.length === 0) {
        return 'Carregando...';
      }
    }

    return '-';
  };

  // Busca lista de remanejamentos (sem filtros no backend)
  const { data: remanejamentosRaw, isLoading, refetch } = useQuery<Remanejamento[]>({
    queryKey: ['remanejamentos'],
    queryFn: () => remanejamentoService.getRemanejamentosTyped(),
  });

  // Filtrar no frontend
  const remanejamentos = React.useMemo(() => {
    if (!remanejamentosRaw) return [];
    return remanejamentosRaw.filter(rem => {
      // Corrigir: usar rem.tipo ao invés de rem.status
      if (filters.tipo && rem.tipo !== filters.tipo) return false;
      if (filters.funcionarioId && rem.employeeId !== filters.funcionarioId) return false;
      // Usar dataRemanejamento ou remanejamentoDate
      const remanejamentoDate = rem.dataRemanejamento || rem.remanejamentoDate;
      if (filters.dataInicio && remanejamentoDate && remanejamentoDate < filters.dataInicio) return false;
      if (filters.dataFim && remanejamentoDate && remanejamentoDate > filters.dataFim) return false;
      return true;
    });
  }, [remanejamentosRaw, filters]);

  const handleOpenModal = () => {
    setSelectedRemanejamento(null);
    setModalOpen(true);
  };

  const handleEdit = async (rem: Remanejamento) => {
    try {
      // Buscar remanejamento completo do backend para garantir que todos os campos estejam presentes
      const remanejamentoCompleto = await remanejamentoService.getRemanejamentoById(rem.id);
      setSelectedRemanejamento(remanejamentoCompleto);
      setModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar remanejamento completo:', error);
      // Em caso de erro, usar o objeto da lista mesmo
      setSelectedRemanejamento(rem);
      setModalOpen(true);
    }
  };

  const handleView = (rem: Remanejamento) => {
    setSelectedRemanejamento(rem);
    setViewModalOpen(true);
  };

  const handleDelete = (rem: Remanejamento) => {
    setRemanejamentoToDelete(rem);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!remanejamentoToDelete) return;

    setIsDeleting(true);
    try {
      await remanejamentoService.deleteRemanejamento(remanejamentoToDelete.id);
      toast({
        title: "Sucesso!",
        description: "Remanejamento excluído com sucesso.",
        variant: "default",
      });
      setDeleteModalOpen(false);
      setRemanejamentoToDelete(null);
      refetch();
    } catch (error: any) {
      console.error('Erro ao excluir remanejamento:', error);
      toast({
        title: "Erro!",
        description: error?.response?.data?.message || "Erro ao excluir remanejamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRemanejamento(null);
    refetch();
  };

  const handleClearFilters = () => {
    setFilters({
      tipo: '',
      funcionarioId: '',
      dataInicio: '',
      dataFim: ''
    });
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const filters: any = {};
      
      if (pdfFilters.employeeId && pdfFilters.employeeId !== 'all') {
        filters.employeeId = pdfFilters.employeeId;
      }
      if (pdfFilters.tipo && pdfFilters.tipo !== 'all') {
        filters.tipo = pdfFilters.tipo;
      }
      if (pdfFilters.startDate) {
        filters.startDate = pdfFilters.startDate;
      }
      if (pdfFilters.endDate) {
        filters.endDate = pdfFilters.endDate;
      }

      const blob = await remanejamentoService.exportRemanejamentosReportPDF(filters);
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Definir nome do arquivo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `relatorio_remanejamentos_${timestamp}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Relatório gerado com sucesso!",
        description: "O relatório de remanejamentos foi baixado com sucesso.",
        variant: "default",
      });
      
      setIsPDFModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao gerar relatório PDF:', error);
      const errorMessage = error?.message || 'Ocorreu um erro ao gerar o relatório PDF. Tente novamente.';
      toast({
        title: "Erro ao gerar relatório",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <StandardLayout title="Remanejamento de Funcionários">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Remanejamento de Funcionários</h1>
            <p className="text-gray-400 mt-1">Gestão de transferências, troca de função e movimentações de pessoal</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              onClick={() => setIsPDFModalOpen(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              Gerar Relatório PDF
            </Button>
            <Button onClick={handleOpenModal} className="bg-seguranca-yellow text-black hover:bg-yellow-500">
              <Plus className="mr-2 h-4 w-4" /> Novo Remanejamento
            </Button>
          </div>
        </div>

        {/* Filtros Avançados */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-seguranca-yellow" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primeira linha - 3 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Tipo de Remanejamento</label>
                <select
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.tipo}
                  onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))}
                >
                  {tipoOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Funcionário</label>
                <select
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.funcionarioId}
                  onChange={e => setFilters(f => ({ ...f, funcionarioId: e.target.value }))}
                >
                  <option value="">Todos os funcionários</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Segunda linha - 3 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Data de Início</label>
                <input
                  type="date"
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.dataInicio}
                  onChange={e => setFilters(f => ({ ...f, dataInicio: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Data de Fim</label>
                <input
                  type="date"
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.dataFim}
                  onChange={e => setFilters(f => ({ ...f, dataFim: e.target.value }))}
                />
              </div>
            </div>

            {/* Botões de ação dos filtros */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-600">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por funcionário, unidade ou observação..."
                    className="w-full pl-10 pr-4 py-2 bg-seguranca-black border border-gray-600 rounded text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClearFilters}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-gray-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                  className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Aplicar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
              <span>Resultados ({remanejamentos?.length || 0} remanejamentos)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin mr-2" /> Carregando...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-seguranca-yellow text-left border-b border-gray-700">
                      <th className="p-3 text-sm font-medium">Funcionário</th>
                      <th className="p-3 text-sm font-medium">Tipo</th>
                      <th className="p-3 text-sm font-medium">Posto de Trabalho de Origem</th>
                      <th className="p-3 text-sm font-medium">Posto de Trabalho de Destino</th>
                      <th className="p-3 text-sm font-medium">Data</th>
                      <th className="p-3 text-sm font-medium">Observação</th>
                      <th className="p-3 text-sm font-medium w-40">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remanejamentos && remanejamentos.length > 0 ? (
                      remanejamentos.map((rem) => (
                        <tr key={rem.id} className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors">
                          <td className="p-3 text-sm font-medium">{rem.employeeName || employees.find(e => e.id === rem.employeeId)?.name || '-'}</td>
                          <td className="p-3 text-sm">
                            <Badge className="bg-blue-500 text-white text-xs">
                              {rem.tipo || rem.status || '-'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{getWorkPostName(rem.originWorkstationId)}</td>
                          <td className="p-3 text-sm">{getWorkPostName(rem.destinationWorkstationId)}</td>
                          <td className="p-3 text-sm">{new Date(rem.dataRemanejamento || rem.remanejamentoDate || '').toLocaleDateString('pt-BR')}</td>
                          <td className="p-3 text-sm max-w-xs truncate">{rem.observacao || rem.notes || '-'}</td>
                          <td className="p-3 text-sm w-40">
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0 text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-seguranca-black" 
                                onClick={() => handleView(rem)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2 text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-seguranca-black" 
                                onClick={() => handleEdit(rem)}
                                title="Editar"
                              >
                                Editar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0 text-red-400 border-red-400 hover:bg-red-400 hover:text-white" 
                                onClick={() => handleDelete(rem)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center text-seguranca-lightgray py-8">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-lg">Nenhum remanejamento encontrado</p>
                            <p className="text-sm text-gray-400">Tente ajustar os filtros ou criar um novo remanejamento</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modalOpen && (
        <RemanejamentoFormModal
          onSuccess={handleCloseModal}
          onClose={handleCloseModal}
          {...(selectedRemanejamento ? { initialRemanejamento: selectedRemanejamento } : {})}
        />
      )}

      {/* Modal de Geração de PDF */}
      <Dialog open={isPDFModalOpen} onOpenChange={setIsPDFModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              Gerar Relatório PDF de Remanejamentos
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
                  value={pdfFilters.tipo} 
                  onValueChange={(value) => setPdfFilters({ ...pdfFilters, tipo: value })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {tipoOptions.filter(opt => opt.value).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
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

      {/* Modal de Visualização */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              Detalhes do Remanejamento
            </DialogTitle>
            <DialogDescription asChild>
              <p className="text-gray-400">
                Informações completas do remanejamento
              </p>
            </DialogDescription>
          </DialogHeader>
          
          {selectedRemanejamento && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Funcionário</Label>
                  <div className="bg-seguranca-black border border-gray-600 rounded p-3 text-seguranca-lightgray">
                    {selectedRemanejamento.employeeName || employees.find(e => e.id === selectedRemanejamento.employeeId)?.name || '-'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Tipo</Label>
                  <div className="bg-seguranca-black border border-gray-600 rounded p-3">
                    <Badge className="bg-blue-500 text-white text-xs">
                      {selectedRemanejamento.tipo || selectedRemanejamento.status || '-'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Posto de Trabalho de Origem</Label>
                  <div className="bg-seguranca-black border border-gray-600 rounded p-3 text-seguranca-lightgray">
                    {getWorkPostName(selectedRemanejamento.originWorkstationId)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Posto de Trabalho de Destino</Label>
                  <div className="bg-seguranca-black border border-gray-600 rounded p-3 text-seguranca-lightgray">
                    {getWorkPostName(selectedRemanejamento.destinationWorkstationId)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Data do Remanejamento</Label>
                <div className="bg-seguranca-black border border-gray-600 rounded p-3 text-seguranca-lightgray">
                  {new Date(selectedRemanejamento.dataRemanejamento || selectedRemanejamento.remanejamentoDate || '').toLocaleDateString('pt-BR')}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Observação</Label>
                <div className="bg-seguranca-black border border-gray-600 rounded p-3 text-seguranca-lightgray min-h-[100px]">
                  {selectedRemanejamento.observacao || selectedRemanejamento.notes || 'Nenhuma observação registrada.'}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewModalOpen(false)}
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Fechar
            </Button>
            {selectedRemanejamento && (
              <Button
                onClick={() => {
                  setViewModalOpen(false);
                  handleEdit(selectedRemanejamento);
                }}
                className="bg-seguranca-yellow hover:bg-yellow-500 text-black"
              >
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Excluir Remanejamento"
        description="Tem certeza que deseja excluir este remanejamento?"
        itemName={remanejamentoToDelete ? 
          `${remanejamentoToDelete.employeeName || employees.find(e => e.id === remanejamentoToDelete.employeeId)?.name || 'Remanejamento'} - ${remanejamentoToDelete.tipo || remanejamentoToDelete.status || ''}` : 
          ''}
      />
    </StandardLayout>
  );
};

export default RemanejamentoPage;
