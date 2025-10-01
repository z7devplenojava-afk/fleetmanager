import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import RemanejamentoFormModal from '@/components/funcionarios/RemanejamentoFormModal';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import * as remanejamentoService from '@/services/remanejamentoService';
import { Remanejamento } from '@/services/remanejamentoService';
import { Loader2, Plus, Filter, Search, RefreshCw, Download } from 'lucide-react';
import { employeeService, Employee } from '@/services/employeeService';
import { unitService, Unit } from '@/services/unitService';
import { RemanejamentoTipo } from '@/types/remanejamento';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const [filters, setFilters] = useState({
    tipo: '',
    funcionarioId: '',
    origem: '',
    destino: '',
    dataInicio: '',
    dataFim: ''
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  React.useEffect(() => {
    employeeService.getEmployees().then(setEmployees);
    unitService.getAllUnits().then(setUnits);
  }, []);

  // Busca lista de remanejamentos (sem filtros no backend)
  const { data: remanejamentosRaw, isLoading, refetch } = useQuery<Remanejamento[]>({
    queryKey: ['remanejamentos'],
    queryFn: remanejamentoService.getRemanejamentosTyped,
  });

  // Filtrar no frontend
  const remanejamentos = React.useMemo(() => {
    if (!remanejamentosRaw) return [];
    return remanejamentosRaw.filter(rem => {
      if (filters.tipo && rem.status !== filters.tipo) return false;
      if (filters.funcionarioId && rem.employeeId !== filters.funcionarioId) return false;
      if (filters.origem && units.find(u => u.id === rem.originWorkstationId)?.name !== filters.origem) return false;
      if (filters.destino && units.find(u => u.id === rem.destinationWorkstationId)?.name !== filters.destino) return false;
      if (filters.dataInicio && rem.remanejamentoDate < filters.dataInicio) return false;
      if (filters.dataFim && rem.remanejamentoDate > filters.dataFim) return false;
      return true;
    });
  }, [remanejamentosRaw, filters, units]);

  const handleOpenModal = () => {
    setSelectedRemanejamento(null);
    setModalOpen(true);
  };

  const handleEdit = (rem: Remanejamento) => {
    setSelectedRemanejamento(rem);
    setModalOpen(true);
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
      origem: '',
      destino: '',
      dataInicio: '',
      dataFim: ''
    });
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
            <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">
              <Download className="mr-2 h-4 w-4" />
              Exportar
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
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Unidade de Origem</label>
                <select
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.origem}
                  onChange={e => setFilters(f => ({ ...f, origem: e.target.value }))}
                >
                  <option value="">Todas as unidades</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.name}>{unit.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Segunda linha - 3 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Unidade de Destino</label>
                <select
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.destino}
                  onChange={e => setFilters(f => ({ ...f, destino: e.target.value }))}
                >
                  <option value="">Todas as unidades</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.name}>{unit.name}</option>
                  ))}
                </select>
              </div>
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
                      <th className="p-3 text-sm font-medium">Origem</th>
                      <th className="p-3 text-sm font-medium">Destino</th>
                      <th className="p-3 text-sm font-medium">Data</th>
                      <th className="p-3 text-sm font-medium">Observação</th>
                      <th className="p-3 text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remanejamentos && remanejamentos.length > 0 ? (
                      remanejamentos.map((rem) => (
                        <tr key={rem.id} className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors">
                          <td className="p-3 text-sm font-medium">{employees.find(e => e.id === rem.employeeId)?.name || '-'}</td>
                          <td className="p-3 text-sm">
                            <Badge className="bg-blue-500 text-white text-xs">
                              {rem.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{units.find(u => u.id === rem.originWorkstationId)?.name || '-'}</td>
                          <td className="p-3 text-sm">{units.find(u => u.id === rem.destinationWorkstationId)?.name || '-'}</td>
                          <td className="p-3 text-sm">{new Date(rem.remanejamentoDate).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3 text-sm max-w-xs truncate">{rem.notes || '-'}</td>
                          <td className="p-3 text-sm">
                            <Button size="sm" variant="outline" className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-seguranca-black" onClick={() => handleEdit(rem)}>
                              Editar
                            </Button>
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
    </StandardLayout>
  );
};

export default RemanejamentoPage;
