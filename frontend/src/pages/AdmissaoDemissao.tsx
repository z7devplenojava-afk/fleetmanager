import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Plus, Download, Search } from 'lucide-react';
import AdmissaoDemissaoFormModal from '@/components/admissaoDemissao/AdmissaoDemissaoFormModal';

const AdmissaoDemissao: React.FC = () => {
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
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Funções de ação
  const handleCreate = () => setShowCreateModal(true);
  const handleView = (record: any) => { setSelectedRecord(record); setShowViewModal(true); };
  const handleEdit = (record: any) => { setSelectedRecord(record); setShowEditModal(true); };
  const handleDelete = (record: any) => { setSelectedRecord(record); setShowDeleteModal(true); };

  const handleClearFilters = () => setFilters({ tipo: '', funcionario: '', dataInicio: '', dataFim: '' });

  return (
    <StandardLayout title="Admissão e Demissão">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admissão e Demissão</h1>
            <p className="text-gray-600 mt-1">Gestão de admissões, desligamentos e movimentações de funcionários</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleCreate} className="bg-seguranca-yellow text-black hover:bg-yellow-500">
              <Plus className="mr-2 h-4 w-4" /> Nova Solicitação
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Tipo</label>
                <select
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
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
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  placeholder="Buscar por nome..."
                  value={filters.funcionario}
                  onChange={e => setFilters(f => ({ ...f, funcionario: e.target.value }))}
                />
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Data de Fim</label>
                <input
                  type="date"
                  className="w-full rounded bg-seguranca-black text-seguranca-lightgray p-3 text-sm border border-gray-600 focus:border-seguranca-yellow focus:outline-none"
                  value={filters.dataFim}
                  onChange={e => setFilters(f => ({ ...f, dataFim: e.target.value }))}
                />
              </div>
              <div className="flex items-end gap-2 pt-6">
                <Button variant="outline" onClick={handleClearFilters}>Limpar</Button>
                <Button variant="default">
                  <Search className="h-4 w-4 mr-2" /> Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Admissão/Demissão */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Admissão/Demissão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-seguranca-graphite">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Funcionário</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-seguranca-black divide-y divide-gray-800">
                  {/* Exemplo de linha (substituir por dados reais) */}
                  <tr>
                    <td className="px-4 py-2 text-seguranca-lightgray">João da Silva</td>
                    <td className="px-4 py-2 text-seguranca-lightgray">Admissão</td>
                    <td className="px-4 py-2 text-seguranca-lightgray">2024-07-01</td>
                    <td className="px-4 py-2 text-seguranca-lightgray">Pendente</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleView({})}>Ver</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit({})}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete({})}>Excluir</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modais de criar, visualizar, editar, excluir (implementar) */}
        <AdmissaoDemissaoFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(data) => { alert('Solicitação criada! (mock)'); }}
        />
      </div>
    </StandardLayout>
  );
};

export default AdmissaoDemissao; 