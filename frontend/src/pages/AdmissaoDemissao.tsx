import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Plus, Download, Search, Eye, Edit, Trash2, Calendar, User, FileText, Loader2 } from 'lucide-react';
import AdmissaoDemissaoFormModal from '@/components/admissaoDemissao/AdmissaoDemissaoFormModal';
import { admissionRequestService, AdmissionRequest } from '@/services/admissionRequestService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const AdmissaoDemissao: React.FC = () => {
  const { toast } = useToast();
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    tipo: '',
    funcionario: '',
    dataInicio: '',
    dataFim: ''
  });

  // Estados para modais (criação, visualização, edição, exclusão)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AdmissionRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para dados
  const [requests, setRequests] = useState<AdmissionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funções de ação
  const handleCreate = () => {
    console.log('🔄 Abrindo modal de criação');
    setShowCreateModal(true);
  };
  const handleView = (record: AdmissionRequest) => { 
    console.log('👁️ Visualizando solicitação:', record);
    setSelectedRecord(record); 
    setShowViewModal(true); 
  };
  const handleEdit = (record: AdmissionRequest) => { 
    console.log('✏️ Editando solicitação:', record);
    setSelectedRecord(record); 
    setShowEditModal(true); 
  };
  const handleDelete = (record: AdmissionRequest) => { 
    console.log('🗑️ Excluindo solicitação:', record);
    setSelectedRecord(record); 
    setShowDeleteModal(true); 
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedRecord) return;
    
    setIsDeleting(true);
    try {
      await admissionRequestService.deleteAdmissionRequest(selectedRecord.id);
      toast({
        title: 'Sucesso',
        description: 'Solicitação excluída com sucesso.',
      });
      setShowDeleteModal(false);
      setSelectedRecord(null);
      loadRequests(); // Recarregar a lista
    } catch (err) {
      console.error('Erro ao excluir solicitação:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir solicitação.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => setFilters({ tipo: '', funcionario: '', dataInicio: '', dataFim: '' });

  // Carregar solicitações
  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await admissionRequestService.getAllRequests();
      setRequests(data);
    } catch (err) {
      setError('Erro ao carregar solicitações');
      console.error('Erro ao carregar solicitações:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar com filtros
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const searchFilters: {
        type?: string;
        searchTerm?: string;
        startDate?: string;
        endDate?: string;
      } = {};
      
      // Mapear filtros do frontend para o formato esperado
      if (filters.tipo) {
        // Converter 'admissao'/'demissao' para 'ADMISSION'/'DISMISSAL'
        searchFilters.type = filters.tipo.toUpperCase() === 'ADMISSAO' ? 'ADMISSION' : 
                             filters.tipo.toUpperCase() === 'DEMISSAO' ? 'DISMISSAL' : 
                             filters.tipo.toUpperCase();
      }
      if (filters.funcionario) {
        searchFilters.searchTerm = filters.funcionario;
      }
      if (filters.dataInicio) {
        searchFilters.startDate = filters.dataInicio;
      }
      if (filters.dataFim) {
        searchFilters.endDate = filters.dataFim;
      }
      
      const data = await admissionRequestService.searchRequests(searchFilters);
      setRequests(data);
    } catch (err) {
      setError('Erro ao buscar solicitações');
      console.error('Erro ao buscar solicitações:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadRequests();
  }, []);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para obter cor do badge de status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'APROVADA':
        return 'bg-green-100 text-green-800';
      case 'REJEITADA':
        return 'bg-red-100 text-red-800';
      case 'CANCELADA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter cor do badge de tipo
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ADMISSAO':
        return 'bg-blue-100 text-blue-800';
      case 'DEMISSAO':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <StandardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Main Content Card */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-seguranca-lightgray">
                  Admissão e Demissão
                </CardTitle>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  Gestão de admissões, desligamentos e movimentações de funcionários
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      toast({
                        title: 'Gerando relatório...',
                        description: 'Por favor, aguarde enquanto o relatório é gerado.',
                      });
                      
                      const blob = await admissionRequestService.generatePDFReport({
                        employeeName: filters.funcionario || undefined,
                        type: filters.tipo && filters.tipo !== '' ? filters.tipo.toUpperCase() : undefined,
                        startDate: filters.dataInicio || undefined,
                        endDate: filters.dataFim || undefined,
                        status: undefined, // Pode ser adicionado se houver filtro de status
                      });
                      
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `relatorio-solicitacoes-${new Date().toISOString().split('T')[0]}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      
                      toast({
                        title: 'Relatório gerado!',
                        description: 'O PDF foi baixado com sucesso.',
                      });
                    } catch (error: any) {
                      console.error('Erro ao gerar relatório:', error);
                      toast({
                        title: 'Erro ao gerar relatório',
                        description: error.message || 'Não foi possível gerar o relatório.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Gerar Relatório</span>
                  <span className="sm:hidden">Relatório</span>
                </Button>
                <Button 
                  onClick={handleCreate} 
                  size="sm"
                  className="bg-seguranca-yellow text-black hover:bg-yellow-500"
                >
                  <Plus className="mr-2 h-4 w-4" /> 
                  <span className="hidden sm:inline">Nova Solicitação</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Filtros Avançados */}
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-seguranca-yellow" />
              <h3 className="text-seguranca-lightgray font-medium">Filtros Avançados</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Tipo</label>
                <select
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-2 sm:p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.tipo}
                  onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="admissao">Admissão</option>
                  <option value="demissao">Demissão</option>
                </select>
              </div>
              
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Funcionário</label>
                <input
                  type="text"
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-2 sm:p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  placeholder="Buscar por nome..."
                  value={filters.funcionario}
                  onChange={e => setFilters(f => ({ ...f, funcionario: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Data de Início</label>
                <input
                  type="date"
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-2 sm:p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.dataInicio}
                  onChange={e => setFilters(f => ({ ...f, dataInicio: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Data de Fim</label>
                <input
                  type="date"
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-2 sm:p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.dataFim}
                  onChange={e => setFilters(f => ({ ...f, dataFim: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                size="sm"
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                Limpar
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={handleSearch}
                disabled={loading}
                className="bg-seguranca-red hover:bg-red-600"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Solicitações */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="pb-4">
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <FileText className="h-5 w-5 text-seguranca-yellow" />
              Solicitações de Admissão/Demissão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-seguranca-black">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                      <User className="h-4 w-4 inline mr-1" />
                      Funcionário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-seguranca-graphite divide-y divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-seguranca-lightgray">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Carregando solicitações...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-red-400">
                        {error}
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-seguranca-lightgray">
                        Nenhuma solicitação encontrada
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request.id} className="hover:bg-seguranca-black transition-colors">
                        <td className="px-4 py-4 text-seguranca-lightgray font-medium">
                          {request.employeeName}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={getTypeBadgeColor(request.type)}>
                            {request.type === 'ADMISSION' || request.type === 'ADMISSAO' ? 'Admissão' : 'Demissão'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-seguranca-lightgray">
                          {formatDate(request.requestDate)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={getStatusBadgeColor(request.status)}>
                            {request.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(request);
                              }} 
                              className="text-blue-400 hover:text-blue-300"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(request);
                              }} 
                              className="text-green-400 hover:text-green-300"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(request);
                              }} 
                              className="text-red-400 hover:text-red-300"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {loading ? (
                <div className="bg-seguranca-black rounded-lg p-4 border border-gray-600 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-seguranca-lightgray" />
                  <p className="text-seguranca-lightgray">Carregando solicitações...</p>
                </div>
              ) : error ? (
                <div className="bg-seguranca-black rounded-lg p-4 border border-gray-600 text-center">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="bg-seguranca-black rounded-lg p-4 border border-gray-600 text-center">
                  <p className="text-seguranca-lightgray">Nenhuma solicitação encontrada</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="bg-seguranca-black rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-seguranca-lightgray">{request.employeeName}</h3>
                        <p className="text-sm text-gray-400">{formatDate(request.requestDate)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getTypeBadgeColor(request.type)}>
                          {request.type === 'ADMISSION' || request.type === 'ADMISSAO' ? 'Admissão' : 'Demissão'}
                        </Badge>
                        <Badge className={getStatusBadgeColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(request);
                        }} 
                        className="text-blue-400 hover:text-blue-300"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(request);
                        }} 
                        className="text-green-400 hover:text-green-300"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(request);
                        }} 
                        className="text-red-400 hover:text-red-300"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Criar */}
        <AdmissaoDemissaoFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(data) => { 
            toast({
              title: 'Sucesso',
              description: 'Solicitação criada com sucesso!',
            });
            loadRequests(); // Recarregar a lista
          }}
        />
        
        {/* Modal de Visualizar */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                Visualizar Solicitação
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Detalhes da solicitação de {selectedRecord?.type === 'ADMISSION' ? 'Admissão' : 'Demissão'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedRecord && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 text-sm">Número da Solicitação</Label>
                    <p className="text-seguranca-lightgray font-medium">{selectedRecord.requestNumber}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Tipo</Label>
                    <p className="text-seguranca-lightgray font-medium">
                      {selectedRecord.type === 'ADMISSION' ? 'Admissão' : 'Demissão'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Funcionário</Label>
                    <p className="text-seguranca-lightgray font-medium">{selectedRecord.employeeName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">CPF</Label>
                    <p className="text-seguranca-lightgray font-medium">{selectedRecord.employeeCpf || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Data da Solicitação</Label>
                    <p className="text-seguranca-lightgray font-medium">{formatDate(selectedRecord.requestDate)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Status</Label>
                    <Badge className={getStatusBadgeColor(selectedRecord.status)}>
                      {selectedRecord.status}
                    </Badge>
                  </div>
                  {selectedRecord.startDate && (
                    <div>
                      <Label className="text-gray-400 text-sm">Data de Início</Label>
                      <p className="text-seguranca-lightgray font-medium">{formatDate(selectedRecord.startDate)}</p>
                    </div>
                  )}
                  {selectedRecord.endDate && (
                    <div>
                      <Label className="text-gray-400 text-sm">Data de Fim</Label>
                      <p className="text-seguranca-lightgray font-medium">{formatDate(selectedRecord.endDate)}</p>
                    </div>
                  )}
                  {selectedRecord.position && (
                    <div>
                      <Label className="text-gray-400 text-sm">Cargo</Label>
                      <p className="text-seguranca-lightgray font-medium">{selectedRecord.position}</p>
                    </div>
                  )}
                  {selectedRecord.unitName && (
                    <div>
                      <Label className="text-gray-400 text-sm">Unidade</Label>
                      <p className="text-seguranca-lightgray font-medium">{selectedRecord.unitName}</p>
                    </div>
                  )}
                </div>
                
                {selectedRecord.reason && (
                  <div>
                    <Label className="text-gray-400 text-sm">Motivo</Label>
                    <p className="text-seguranca-lightgray mt-1">{selectedRecord.reason}</p>
                  </div>
                )}
                
                {selectedRecord.justification && (
                  <div>
                    <Label className="text-gray-400 text-sm">Justificativa</Label>
                    <p className="text-seguranca-lightgray mt-1">{selectedRecord.justification}</p>
                  </div>
                )}
                
                {selectedRecord.notes && (
                  <div>
                    <Label className="text-gray-400 text-sm">Observações</Label>
                    <p className="text-seguranca-lightgray mt-1">{selectedRecord.notes}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!selectedRecord) return;
                  try {
                    toast({
                      title: 'Gerando PDF...',
                      description: 'Por favor, aguarde enquanto o PDF é gerado.',
                    });
                    const blob = await admissionRequestService.generatePDF(selectedRecord.id);
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `solicitacao-${selectedRecord.requestNumber || selectedRecord.id}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast({
                      title: 'PDF gerado!',
                      description: 'O PDF foi baixado com sucesso.',
                    });
                  } catch (error: any) {
                    console.error('Erro ao gerar PDF:', error);
                    toast({
                      title: 'Erro ao gerar PDF',
                      description: error.message || 'Não foi possível gerar o PDF.',
                      variant: 'destructive',
                    });
                  }
                }}
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-600"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Editar */}
        <AdmissaoDemissaoFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRecord(null);
          }}
          onSuccess={(data) => {
            toast({
              title: 'Sucesso',
              description: 'Solicitação atualizada com sucesso!',
            });
            setShowEditModal(false);
            setSelectedRecord(null);
            loadRequests();
          }}
          request={selectedRecord}
        />
        
        {/* Modal de Excluir */}
        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-seguranca-lightgray">
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Tem certeza que deseja excluir a solicitação de{' '}
                <strong>{selectedRecord?.employeeName}</strong>?
                <br />
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-600"
                disabled={isDeleting}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </StandardLayout>
  );
};

export default AdmissaoDemissao; 