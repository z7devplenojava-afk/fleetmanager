import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { employeeService, Employee } from '@/services/employeeService';
import FeriasFormModal from '@/components/ferias/FeriasFormModal';
import AfastamentoFormModal from '@/components/ferias/AfastamentoFormModal';

interface FeriasPeriodo {
  id: string;
  employeeId: string;
  employeeName: string;
  periodoAquisitivo: string; // ex: "2024/2025"
  dataInicio: string;
  dataFim: string;
  status: 'PENDENTE' | 'APROVADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  tipo: 'FERIAS_NORMAIS' | 'FERIAS_VENDIDAS' | 'ABONO_PECUNIARIO';
  observacoes?: string;
  createdAt: string;
}

interface Afastamento {
  id: string;
  employeeId: string;
  employeeName: string;
  tipo: 'ATESTADO' | 'LICENCA_MEDICA' | 'LICENCA_MATERNIDADE' | 'LICENCA_PATERNIDADE' | 'SUSPENSAO' | 'OUTROS';
  dataInicio: string;
  dataFim: string;
  status: 'PENDENTE' | 'APROVADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  motivo: string;
  documento?: string;
  observacoes?: string;
  createdAt: string;
}

const FeriasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ferias');
  const [searchTerm, setSearchTerm] = useState('');
  const [feriasModalOpen, setFeriasModalOpen] = useState(false);
  const [afastamentoModalOpen, setAfastamentoModalOpen] = useState(false);

  // Mock data - substituir por chamadas reais da API
  const feriasPeriodos: FeriasPeriodo[] = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'João Silva',
      periodoAquisitivo: '2024/2025',
      dataInicio: '2025-01-15',
      dataFim: '2025-02-03',
      status: 'APROVADO',
      tipo: 'FERIAS_NORMAIS',
      observacoes: 'Férias programadas para janeiro',
      createdAt: '2024-12-01'
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Maria Santos',
      periodoAquisitivo: '2024/2025',
      dataInicio: '2025-03-10',
      dataFim: '2025-03-29',
      status: 'PENDENTE',
      tipo: 'FERIAS_VENDIDAS',
      observacoes: 'Solicitação de venda de 10 dias',
      createdAt: '2024-12-15'
    }
  ];

  const afastamentos: Afastamento[] = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'João Silva',
      tipo: 'ATESTADO',
      dataInicio: '2025-01-10',
      dataFim: '2025-01-12',
      status: 'APROVADO',
      motivo: 'Gripe',
      documento: 'atestado_joao.pdf',
      observacoes: 'Atestado médico apresentado',
      createdAt: '2025-01-10'
    },
    {
      id: '2',
      employeeId: '3',
      employeeName: 'Ana Costa',
      tipo: 'LICENCA_MATERNIDADE',
      dataInicio: '2025-02-01',
      dataFim: '2025-08-01',
      status: 'EM_ANDAMENTO',
      motivo: 'Licença maternidade',
      observacoes: 'Licença de 6 meses',
      createdAt: '2025-01-20'
    }
  ];

  // Buscar funcionários para filtros
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-500 text-black';
      case 'APROVADO': return 'bg-green-500 text-white';
      case 'EM_ANDAMENTO': return 'bg-blue-500 text-white';
      case 'CONCLUIDO': return 'bg-gray-500 text-white';
      case 'CANCELADO': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'FERIAS_NORMAIS': return 'bg-blue-500 text-white';
      case 'FERIAS_VENDIDAS': return 'bg-orange-500 text-white';
      case 'ABONO_PECUNIARIO': return 'bg-purple-500 text-white';
      case 'ATESTADO': return 'bg-yellow-500 text-black';
      case 'LICENCA_MEDICA': return 'bg-red-500 text-white';
      case 'LICENCA_MATERNIDADE': return 'bg-pink-500 text-white';
      case 'LICENCA_PATERNIDADE': return 'bg-cyan-500 text-white';
      case 'SUSPENSAO': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleOpenFeriasModal = () => {
    setFeriasModalOpen(true);
  };

  const handleOpenAfastamentoModal = () => {
    setAfastamentoModalOpen(true);
  };

  const handleCloseModals = () => {
    setFeriasModalOpen(false);
    setAfastamentoModalOpen(false);
  };

  return (
    <StandardLayout title="Férias e Afastamentos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Férias e Afastamentos</h1>
            <p className="text-gray-400 mt-1">Controle de período aquisitivo, concessivo e afastamentos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <div className="relative">
              <Button 
                className="bg-seguranca-yellow text-black hover:bg-yellow-500"
                onClick={activeTab === 'ferias' ? handleOpenFeriasModal : handleOpenAfastamentoModal}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Férias Pendentes</p>
                  <p className="text-2xl font-bold text-seguranca-yellow">12</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Afastamentos Ativos</p>
                  <p className="text-2xl font-bold text-red-400">5</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Férias Aprovadas</p>
                  <p className="text-2xl font-bold text-green-400">8</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Funcionários</p>
                  <p className="text-2xl font-bold text-blue-400">45</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-seguranca-graphite">
            <TabsTrigger value="ferias" className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black">
              <Calendar className="mr-2 h-4 w-4" />
              Férias
            </TabsTrigger>
            <TabsTrigger value="afastamentos" className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Afastamentos
            </TabsTrigger>
          </TabsList>

          {/* Tab Férias */}
          <TabsContent value="ferias" className="space-y-4">
            {/* Filtros */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Buscar funcionário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-seguranca-black border border-gray-600 rounded text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none"
                      />
                    </div>
                  </div>
                  <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Férias */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Períodos de Férias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-seguranca-yellow text-left border-b border-gray-700">
                        <th className="p-3 text-sm">Funcionário</th>
                        <th className="p-3 text-sm">Período Aquisitivo</th>
                        <th className="p-3 text-sm">Data Início</th>
                        <th className="p-3 text-sm">Data Fim</th>
                        <th className="p-3 text-sm">Dias</th>
                        <th className="p-3 text-sm">Tipo</th>
                        <th className="p-3 text-sm">Status</th>
                        <th className="p-3 text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feriasPeriodos.map((ferias) => (
                        <tr key={ferias.id} className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors">
                          <td className="p-3 text-sm">{ferias.employeeName}</td>
                          <td className="p-3 text-sm">{ferias.periodoAquisitivo}</td>
                          <td className="p-3 text-sm">{formatDate(ferias.dataInicio)}</td>
                          <td className="p-3 text-sm">{formatDate(ferias.dataFim)}</td>
                          <td className="p-3 text-sm">{calculateDays(ferias.dataInicio, ferias.dataFim)} dias</td>
                          <td className="p-3 text-sm">
                            <Badge className={getTipoColor(ferias.tipo)}>
                              {ferias.tipo.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            <Badge className={getStatusColor(ferias.status)}>
                              {ferias.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-seguranca-black">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-green-400 border-green-400 hover:bg-green-400 hover:text-seguranca-black">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-400 border-red-400 hover:bg-red-400 hover:text-seguranca-black">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Afastamentos */}
          <TabsContent value="afastamentos" className="space-y-4">
            {/* Filtros */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Buscar funcionário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-seguranca-black border border-gray-600 rounded text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none"
                      />
                    </div>
                  </div>
                  <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Afastamentos */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Afastamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-seguranca-yellow text-left border-b border-gray-700">
                        <th className="p-3 text-sm">Funcionário</th>
                        <th className="p-3 text-sm">Tipo</th>
                        <th className="p-3 text-sm">Data Início</th>
                        <th className="p-3 text-sm">Data Fim</th>
                        <th className="p-3 text-sm">Dias</th>
                        <th className="p-3 text-sm">Motivo</th>
                        <th className="p-3 text-sm">Status</th>
                        <th className="p-3 text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {afastamentos.map((afastamento) => (
                        <tr key={afastamento.id} className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors">
                          <td className="p-3 text-sm">{afastamento.employeeName}</td>
                          <td className="p-3 text-sm">
                            <Badge className={getTipoColor(afastamento.tipo)}>
                              {afastamento.tipo.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{formatDate(afastamento.dataInicio)}</td>
                          <td className="p-3 text-sm">{formatDate(afastamento.dataFim)}</td>
                          <td className="p-3 text-sm">{calculateDays(afastamento.dataInicio, afastamento.dataFim)} dias</td>
                          <td className="p-3 text-sm max-w-xs truncate">{afastamento.motivo}</td>
                          <td className="p-3 text-sm">
                            <Badge className={getStatusColor(afastamento.status)}>
                              {afastamento.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-seguranca-black">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-green-400 border-green-400 hover:bg-green-400 hover:text-seguranca-black">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-400 border-red-400 hover:bg-red-400 hover:text-seguranca-black">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais */}
      {feriasModalOpen && (
        <FeriasFormModal
          onSuccess={handleCloseModals}
          onClose={handleCloseModals}
        />
      )}

      {afastamentoModalOpen && (
        <AfastamentoFormModal
          onSuccess={handleCloseModals}
          onClose={handleCloseModals}
        />
      )}
    </StandardLayout>
  );
};

export default FeriasPage; 