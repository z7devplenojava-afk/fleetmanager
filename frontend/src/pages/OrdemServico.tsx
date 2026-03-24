import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderOfServiceService } from '@/services/orderOfServiceService';
import { OrderOfService } from '@/types/orderOfService';
import { ordemServicoPDFGenerator } from '@/utils/ordemServicoPDFGenerator';
import { companyService } from '@/services/companyService';
import { clientService } from '@/services/clientService';
import { positionService } from '@/services/positionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, FileText, Eye, Filter, RefreshCw, Download, Search, Edit, Trash2 } from 'lucide-react';
import EmitirOrdemServicoModal from '@/components/ordemServico/EmitirOrdemServicoModal';
import OrdemServicoViewModal from '@/components/ordemServico/OrdemServicoViewModal';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OrdemServicoPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderOfService | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OrderOfService | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const shouldOpenModal = params.get('emitir') === '1';

  useEffect(() => {
    if (shouldOpenModal) setModalOpen(true);
  }, [shouldOpenModal]);

  const handleOpenModal = () => {
    setModalOpen(true);
    navigate('/rh/ordens-servico?emitir=1', { replace: true });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (shouldOpenModal) navigate('/rh/ordens-servico', { replace: true });
  };

  const handleViewOrder = (order: OrderOfService) => {
    setSelectedOrder(order);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedOrder(null);
  };

  const handleEditOrder = (order: OrderOfService) => {
    setSelectedOrder(order);
    setEditModalOpen(true);
  };

  const handleDeleteOrder = (order: OrderOfService) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    try {
      await orderOfServiceService.deleteOrder(orderToDelete.id);
      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço excluída com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['orders-of-service'] });
      await refetch();
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir ordem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir ordem de serviço.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async (order: OrderOfService) => {
    try {
      const docUrl = order.documentUrl;
      
      // Verificar se é uma URL de exemplo/teste
      if (docUrl?.includes('example.com')) {
        toast({
          title: 'PDF não disponível',
          description: 'O PDF ainda não foi gerado. Gerando agora...',
          variant: 'default',
        });
        // Gerar PDF
        await generateAndDownloadPDF(order);
        return;
      }

      // Se for uma URL de blob, fazer download diretamente
      if (docUrl?.startsWith('blob:')) {
        try {
          const response = await fetch(docUrl);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `OS_${order.employeeName}_${order.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: 'Sucesso',
            description: 'PDF baixado com sucesso.',
          });
        } catch (error) {
          console.error('Erro ao fazer download do blob:', error);
          // Se falhar, tentar gerar novo PDF
          await generateAndDownloadPDF(order);
        }
      } else if (docUrl?.startsWith('http://localhost') || docUrl?.startsWith('https://')) {
        // Se for uma URL HTTP, fazer fetch com autenticação
        try {
          const token = localStorage.getItem('token') || '';
          const response = await fetch(docUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 404) {
              // PDF não encontrado, gerar novo
              toast({
                title: 'PDF não encontrado',
                description: 'Gerando novo PDF...',
                variant: 'default',
              });
              await generateAndDownloadPDF(order);
              return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          // Verificar se é realmente um PDF
          if (!blob.type.includes('pdf') && blob.size === 0) {
            throw new Error('Arquivo não é um PDF válido');
          }
          
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `OS_${order.employeeName}_${order.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: 'Sucesso',
            description: 'PDF baixado com sucesso.',
          });
        } catch (fetchError: any) {
          console.error('Erro ao buscar PDF:', fetchError);
          // Se falhar, tentar gerar novo PDF
          await generateAndDownloadPDF(order);
        }
      } else {
        // URL inválida ou não existe, gerar PDF
        toast({
          title: 'Gerando PDF',
          description: 'O PDF será gerado agora...',
        });
        await generateAndDownloadPDF(order);
      }
    } catch (error: any) {
      console.error('Erro ao fazer download do PDF:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer download do PDF. Tente gerar um novo PDF.',
        variant: 'destructive',
      });
    }
  };

  const generateAndDownloadPDF = async (order: OrderOfService) => {
    try {
      // Buscar dados completos para gerar o PDF
      let companies: any[] = [];
      let clients: any[] = [];
      let positions: any[] = [];

      try {
        [companies, clients, positions] = await Promise.all([
          companyService.getAllCompanies().catch(() => []),
          clientService.getAllClients().catch(() => []),
          positionService.getPositions().catch(() => [])
        ]);
      } catch (error) {
        console.warn('Erro ao buscar dados adicionais, usando dados da ordem:', error);
      }

      const selectedCompany = companies.find(c => c.name === order.company || c.sigla === order.company);
      const selectedClient = clients.find(c => c.name === order.client);
      const selectedPosition = positions.find(p => p.name === order.role || p.description === order.role);

      // Preparar dados para o PDF
      const pdfData = {
        ordem: {
          numero: order.id?.toString() || Date.now().toString(),
          dataInicio: order.startDate,
          dataFim: order.endDate || '',
          observacoes: '',
          modelo: 'CSN',
          status: order.signed ? 'ASSINADA' : 'PENDENTE'
        },
        funcionario: {
          name: order.employeeName,
          document: order.employeeCpf,
          position: selectedPosition ? { name: selectedPosition.name || selectedPosition.description || order.role } : undefined,
          unit: undefined
        },
        cliente: {
          name: order.client,
          document: selectedClient?.cnpj || ''
        },
        empresa: {
          name: order.company,
          document: selectedCompany?.cnpj || ''
        },
        unidade: {
          name: order.workplace,
          code: ''
        },
        cargo: {
          name: order.role
        }
      };

      // Gerar PDF
      const pdfBlob = await ordemServicoPDFGenerator.generatePDF(pdfData);
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // Fazer download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `OS_${order.employeeName}_${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      // Salvar URL do documento no banco de dados
      if (order.id) {
        try {
          await orderOfServiceService.updateDocumentUrl(order.id, blobUrl);
          console.log('✅ URL do PDF salva no banco de dados');
        } catch (error) {
          console.warn('⚠️ Não foi possível salvar a URL do PDF no banco:', error);
        }
      }
      
      toast({
        title: 'Sucesso',
        description: 'PDF gerado e baixado com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error(error.message || 'Não foi possível gerar o PDF.');
    }
  };

  const { data, isLoading, refetch, isError, error } = useQuery<OrderOfService[]>({
    queryKey: ['orders-of-service', employeeId],
    queryFn: async () => {
      console.log('🔍 Buscando ordens de serviço...', { employeeId });
      try {
        let result;
        if (employeeId) {
          // Se houver filtro por funcionário, buscar apenas as ordens desse funcionário
          result = await orderOfServiceService.getOrders({ employeeId });
        } else {
          // Buscar todas as ordens quando não há filtro
          result = await orderOfServiceService.getOrders();
        }
        console.log('✅ Ordens retornadas:', result?.length || 0, result);
        
        // Verificar se são dados de fallback (IDs '1', '2', '3')
        const isFallbackData = result && result.length > 0 && result.some(order => 
          order.id === '1' || order.id === '2' || order.id === '3'
        );
        
        if (isFallbackData) {
          console.warn('⚠️ Detectados dados de fallback. Backend pode não estar disponível.');
          // Retornar array vazio para forçar nova tentativa
          return [];
        }
        
        return result || [];
      } catch (error) {
        console.error('❌ Erro ao buscar ordens:', error);
        // Se for erro de conexão, retornar array vazio para que o React Query tente novamente
        return [];
      }
    },
    enabled: true, // Sempre habilitado para buscar todas as ordens
    refetchOnWindowFocus: true, // Recarregar quando a janela receber foco
    refetchOnMount: 'always', // Sempre recarregar quando o componente montar (ignora cache)
    retry: (failureCount, error) => {
      // Tentar indefinidamente se for erro de conexão
      const isConnectionError = error && (
        (error as any)?.isConnectionError === true ||
        (error as any)?.code === 'ERR_CONNECTION_REFUSED' ||
        (error as any)?.code === 'ECONNREFUSED' ||
        (error as any)?.message?.includes('Backend não está disponível')
      );
      
      if (isConnectionError) {
        // Tentar até 10 vezes com intervalo crescente
        return failureCount < 10;
      }
      // Para outros erros, tentar apenas 3 vezes
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
    staleTime: 0, // Dados sempre considerados stale para forçar refetch
    gcTime: 5 * 60 * 1000, // Manter cache por 5 minutos
    refetchInterval: (query) => {
      // Se houver erro de conexão, tentar refazer a cada 5 segundos
      const isConnectionError = query.state.error && (
        (query.state.error as any)?.isConnectionError === true ||
        (query.state.error as any)?.code === 'ERR_CONNECTION_REFUSED' ||
        (query.state.error as any)?.code === 'ECONNREFUSED' ||
        (query.state.error as any)?.message?.includes('Backend não está disponível')
      );
      
      if (isConnectionError) {
        return 5000; // Tentar a cada 5 segundos quando backend não está disponível
      }
      return false; // Não fazer polling quando tudo está OK
    },
  });

  // Efeito para detectar quando o backend volta e limpar cache de fallback
  useEffect(() => {
    if (isError && error) {
      const isConnectionError = (error as any)?.isConnectionError === true ||
        (error as any)?.code === 'ERR_CONNECTION_REFUSED' ||
        (error as any)?.code === 'ECONNREFUSED' ||
        (error as any)?.message?.includes('Backend não está disponível');
      
      if (isConnectionError) {
        console.log('⚠️ Backend não está disponível. Tentando reconectar...');
      }
    } else if (!isError && data) {
      // Se não há erro e há dados, verificar se são dados de fallback
      // Dados de fallback têm IDs específicos ('1', '2', '3')
      const isFallbackData = data.length > 0 && data.some(order => 
        order.id === '1' || order.id === '2' || order.id === '3'
      );
      
      if (isFallbackData) {
        console.log('⚠️ Detectados dados de fallback. Tentando buscar do backend...');
        // Invalidar cache e tentar buscar novamente
        queryClient.invalidateQueries({ queryKey: ['orders-of-service'] });
        refetch();
      } else {
        console.log('✅ Backend está disponível. Dados carregados:', data.length);
      }
    }
  }, [isError, error, data, queryClient, refetch]);

  const clearFilters = () => {
    setEmployeeId('');
  };

  const handleRefresh = async () => {
    console.log('🔄 Atualizando lista manualmente...');
    try {
      // Invalidar cache antes de refetch para garantir busca fresca
      queryClient.invalidateQueries({ queryKey: ['orders-of-service'] });
      await refetch();
      console.log('✅ Lista atualizada');
      toast({
        title: 'Sucesso',
        description: 'Lista atualizada com sucesso.',
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar lista:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a lista. Verifique se o backend está rodando.',
        variant: 'destructive',
      });
    }
  };

  return (
    <StandardLayout title="Ordens de Serviço (SST)">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Ordens de Serviço (SST)</h1>
            <p className="text-gray-400 mt-1">Gestão e emissão de ordens de serviço de segurança e saúde do trabalho</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-gray-600 text-seguranca-lightgray hover:bg-gray-600"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleOpenModal} className="bg-seguranca-red hover:bg-seguranca-darkred">
              <Plus className="mr-2 h-4 w-4" /> Emitir Nova OS
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">ID do Funcionário</label>
                <Input
                  placeholder="Digite o ID do funcionário"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-600">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-600"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
              >
                <Filter className="mr-2 h-4 w-4" />
                Aplicar Filtro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
              <span>Resultados ({data?.length || 0} ordens)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin mr-2" /> Carregando...
              </div>
            ) : (
              <div className="overflow-x-auto">
                {console.log('📊 Renderizando tabela. Dados:', data, 'Tamanho:', data?.length)}
                <table className="w-full">
                  <thead>
                    <tr className="text-seguranca-yellow text-left border-b border-gray-700">
                      <th className="p-3 text-sm font-medium">Funcionário</th>
                      <th className="p-3 text-sm font-medium">Função</th>
                      <th className="p-3 text-sm font-medium">Empresa</th>
                      <th className="p-3 text-sm font-medium">Cliente/Posto</th>
                      <th className="p-3 text-sm font-medium">Salário</th>
                      <th className="p-3 text-sm font-medium">Período</th>
                      <th className="p-3 text-sm font-medium">Assinada</th>
                      <th className="p-3 text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data && Array.isArray(data) && data.length > 0 ? data.map(os => (
                      <tr 
                        key={os.id} 
                        className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors cursor-pointer"
                        onClick={() => handleViewOrder(os)}
                      >
                        <td className="p-3 text-sm font-medium">{os.employeeName}</td>
                        <td className="p-3 text-sm">{os.role}</td>
                        <td className="p-3 text-sm">{os.company}</td>
                        <td className="p-3 text-sm">{os.workplace}</td>
                        <td className="p-3 text-sm">
                          {typeof os.salary === 'number' 
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.salary)
                            : `R$ ${parseFloat(String(os.salary || 0)).toFixed(2)}`}
                        </td>
                        <td className="p-3 text-sm">
                          {os.startDate ? new Date(os.startDate).toLocaleDateString('pt-BR') : 'N/A'} 
                          {os.endDate ? ` até ${new Date(os.endDate).toLocaleDateString('pt-BR')}` : ''}
                        </td>
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${os.signed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {os.signed ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewOrder(os);
                              }}
                              title="Visualizar"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-seguranca-yellow border-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditOrder(os);
                              }}
                              title="Editar"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-400 border-green-400 hover:bg-green-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPDF(os);
                              }}
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrder(os);
                              }}
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="text-center text-seguranca-lightgray py-8">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-lg">Nenhuma ordem encontrada</p>
                            <p className="text-sm text-gray-400">Tente ajustar os filtros ou emitir uma nova OS</p>
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

      {/* Modal para emitir nova OS */}
      <EmitirOrdemServicoModal 
        open={modalOpen} 
        onClose={handleCloseModal} 
        onCreated={async () => {
          console.log('🔄 Recarregando lista após criar ordem...');
          handleCloseModal();
          // Aguardar um pouco para garantir que o backend processou
          await new Promise(resolve => setTimeout(resolve, 500));
          // Invalidar cache e recarregar
          queryClient.invalidateQueries({ queryKey: ['orders-of-service'] });
          await refetch();
          console.log('✅ Lista atualizada após criar ordem');
        }} 
      />
      {/* Modal para visualizar OS */}
      <OrdemServicoViewModal 
        open={viewModalOpen} 
        onClose={handleCloseViewModal} 
        orderOfService={selectedOrder} 
      />
      
      {/* Modal para editar OS */}
      <EmitirOrdemServicoModal 
        open={editModalOpen} 
        onClose={() => {
          setEditModalOpen(false);
          setSelectedOrder(null);
        }} 
        onCreated={async () => {
          console.log('🔄 Recarregando lista após editar ordem...');
          setEditModalOpen(false);
          setSelectedOrder(null);
          await new Promise(resolve => setTimeout(resolve, 500));
          queryClient.invalidateQueries({ queryKey: ['orders-of-service'] });
          await refetch();
          console.log('✅ Lista atualizada após editar ordem');
        }}
        order={selectedOrder}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-seguranca-lightgray">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir a ordem de serviço de <strong>{orderToDelete?.employeeName}</strong>?
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
              onClick={confirmDelete}
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
    </StandardLayout>
  );
};

export default OrdemServicoPage;