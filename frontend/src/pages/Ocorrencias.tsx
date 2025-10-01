import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { occurrenceService, Occurrence as ServiceOccurrence } from '@/services/occurrenceService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, FileText, Eye, Edit, Trash2, Filter, RefreshCw, Download, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OcorrenciaFormModal from '@/components/operacional/OcorrenciaFormModal';

const OcorrenciasPage: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<ServiceOccurrence | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar ocorrências
  const { data: occurrences, isLoading, refetch } = useQuery<ServiceOccurrence[]>({
    queryKey: ['occurrences', employeeId, filters],
    queryFn: () => occurrenceService.getOccurrences({
      employeeId: employeeId || undefined,
      type: filters.type === 'all' ? undefined : filters.type,
      status: filters.status === 'all' ? undefined : filters.status,
      startDate: filters.dateFrom || undefined,
      endDate: filters.dateTo || undefined
    }),
    enabled: true
  });

  const handleOpenModal = () => {
    setSelectedOccurrence(null);
    setModalOpen(true);
  };

  const handleEditOccurrence = (occurrence: ServiceOccurrence) => {
    setSelectedOccurrence(occurrence);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOccurrence(null);
    refetch();
  };

  const handleSaveOccurrence = (ocorrencia: ServiceOccurrence) => {
    queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    handleCloseModal();
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Atualizado",
      description: "Lista de ocorrências atualizada",
    });
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setEmployeeId('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendente':
        return 'bg-yellow-500 text-white';
      case 'approved':
      case 'aprovado':
        return 'bg-green-500 text-white';
      case 'rejected':
      case 'rejeitado':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MEDICAL_CERTIFICATE':
        return 'Atestado Médico';
      case 'WARNING':
        return 'Advertência';
      case 'AWARD':
        return 'Prêmio';
      case 'JUSTIFIED_ABSENCE':
        return 'Falta Justificada';
      default:
        return type;
    }
  };

  return (
    <StandardLayout title="Ocorrências">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Ocorrências RH</h1>
            <p className="text-gray-400 mt-1">Gestão de incidentes, advertências, atestados e ocorrências de funcionários</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleOpenModal} className="bg-seguranca-red hover:bg-seguranca-darkred">
              <Plus className="mr-2 h-4 w-4" /> Nova Ocorrência
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
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">ID do Funcionário</label>
                <Input
                  placeholder="Digite o ID do funcionário"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Tipo de Ocorrência</label>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="MEDICAL_CERTIFICATE">Atestado Médico</SelectItem>
                    <SelectItem value="WARNING">Advertência</SelectItem>
                    <SelectItem value="AWARD">Prêmio</SelectItem>
                    <SelectItem value="JUSTIFIED_ABSENCE">Falta Justificada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="APPROVED">Aprovado</SelectItem>
                    <SelectItem value="REJECTED">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Segunda linha - 2 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Data de Início</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Data de Fim</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none"
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
                    placeholder="Buscar por funcionário, descrição ou responsável..."
                    className="w-full pl-10 pr-4 py-2 bg-seguranca-black border border-gray-600 rounded text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
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
              <span>Resultados ({occurrences?.length || 0} ocorrências)</span>
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
                      <th className="p-3 text-sm font-medium">Descrição</th>
                      <th className="p-3 text-sm font-medium">Data</th>
                      <th className="p-3 text-sm font-medium">Status</th>
                      <th className="p-3 text-sm font-medium">Responsável</th>
                      <th className="p-3 text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occurrences && occurrences.length > 0 ? (
                      occurrences.map(occurrence => (
                        <tr 
                          key={occurrence.id} 
                          className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors"
                        >
                          <td className="p-3 text-sm font-medium">{occurrence.employeeName}</td>
                          <td className="p-3 text-sm">
                            <Badge className="bg-blue-500 text-white text-xs">
                              {getTypeLabel(occurrence.type)}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm max-w-xs truncate" title={occurrence.description}>
                            {occurrence.description}
                          </td>
                          <td className="p-3 text-sm">{new Date(occurrence.date).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3 text-sm">
                            <Badge className={`text-xs ${getStatusColor(occurrence.status)}`}>
                              {occurrence.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{occurrence.responsible}</td>
                          <td className="p-3 text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-seguranca-yellow border-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                              >
                                <Eye size={16} className="mr-1" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-seguranca-black"
                                onClick={() => handleEditOccurrence(occurrence)}
                              >
                                <Edit size={16} className="mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-400 border-red-400 hover:bg-red-400 hover:text-seguranca-black"
                              >
                                <Trash2 size={16} className="mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center text-seguranca-lightgray py-8">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-lg">Nenhuma ocorrência encontrada</p>
                            <p className="text-sm text-gray-400">Tente ajustar os filtros ou criar uma nova ocorrência</p>
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

      {/* Modal para criar/editar ocorrência */}
      <OcorrenciaFormModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        ocorrencia={selectedOccurrence}
        onSave={handleSaveOccurrence}
      />
    </StandardLayout>
  );
};

export default OcorrenciasPage; 