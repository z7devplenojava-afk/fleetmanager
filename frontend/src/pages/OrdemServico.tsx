import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderOfServiceService } from '@/services/orderOfServiceService';
import { OrderOfService } from '@/types/orderOfService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, FileText, Eye, Filter, RefreshCw, Download, Search } from 'lucide-react';
import EmitirOrdemServicoModal from '@/components/ordemServico/EmitirOrdemServicoModal';
import OrdemServicoViewModal from '@/components/ordemServico/OrdemServicoViewModal';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OrdemServicoPage: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderOfService | null>(null);
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

  const { data, isLoading, refetch } = useQuery<OrderOfService[]>({
    queryKey: ['orders-of-service', employeeId],
    queryFn: () => orderOfServiceService.listByEmployee(Number(employeeId)),
    enabled: !!employeeId,
  });

  const clearFilters = () => {
    setEmployeeId('');
  };

  const handleRefresh = () => {
    refetch();
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
                disabled={!employeeId}
              >
                <Filter className="mr-2 h-4 w-4" />
                Aplicar
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
                    {data?.length ? data.map(os => (
                      <tr 
                        key={os.id} 
                        className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors cursor-pointer"
                        onClick={() => handleViewOrder(os)}
                      >
                        <td className="p-3 text-sm font-medium">{os.employeeName}</td>
                        <td className="p-3 text-sm">{os.role}</td>
                        <td className="p-3 text-sm">{os.company}</td>
                        <td className="p-3 text-sm">{os.workplace}</td>
                        <td className="p-3 text-sm">R$ {os.salary.toFixed(2)}</td>
                        <td className="p-3 text-sm">{os.startDate} {os.endDate ? `até ${os.endDate}` : ''}</td>
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
                              className="text-seguranca-yellow border-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewOrder(os);
                              }}
                            >
                              <Eye size={16} className="mr-1" />
                              Ver
                            </Button>
                            {os.documentUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-seguranca-yellow border-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(os.documentUrl, '_blank');
                                }}
                              >
                                <FileText size={16} className="mr-1" />
                                Doc
                              </Button>
                            )}
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
      <EmitirOrdemServicoModal open={modalOpen} onClose={handleCloseModal} onCreated={refetch} />
      {/* Modal para visualizar OS */}
      <OrdemServicoViewModal 
        open={viewModalOpen} 
        onClose={handleCloseViewModal} 
        orderOfService={selectedOrder} 
      />
    </StandardLayout>
  );
};

export default OrdemServicoPage;