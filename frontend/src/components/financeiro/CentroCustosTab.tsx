import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  DollarSign,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Target,
  RefreshCw,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';
import { config } from '../../../env.config';

interface CentroCusto {
  id: string;
  code: string;
  name: string;
  description?: string;
  responsible?: string;
  department?: string;
  budget?: number;
  currentSpent?: number;
  status: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
  createdAt: string;
  updatedAt?: string;
  availableBudget?: number;
  utilizationPercentage?: number;
  isOverBudget?: boolean;
  isNearBudgetLimit?: boolean;
}

interface ResumoCentroCusto {
  totalCenters: number;
  activeCenters: number;
  inactiveCenters: number;
  suspendedCenters: number;
  totalBudget: number;
  totalSpent: number;
  totalAvailable: number;
  averageUtilization: number;
}

const CentroCustosTab: React.FC = () => {
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroCusto | null>(null);
  const [viewingCentro, setViewingCentro] = useState<CentroCusto | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [departamentoFilter, setDepartamentoFilter] = useState<string>('TODOS');
  
  // Formulário
  const [formData, setFormData] = useState<Partial<CentroCusto>>({
    code: '',
    name: '',
    description: '',
    responsible: '',
    department: '',
    budget: 0,
    status: 'ATIVO'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar centros de custo da API
      const response = await axios.get(`${config.API_URL}/api/cost-centers`);
      setCentrosCusto(response.data);

    } catch (error) {
      console.error('Erro ao carregar centros de custo:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar centros de custo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarCentro = async () => {
    try {
      if (editingCentro) {
        // Atualizar centro existente
        const updateData = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          responsible: formData.responsible,
          department: formData.department,
          budget: formData.budget,
          currentSpent: formData.currentSpent,
          status: formData.status
        };
        
        await axios.put(`${config.API_URL}/api/cost-centers/${editingCentro.id}`, updateData);
        toast({
          title: "Sucesso",
          description: "Centro de custo atualizado com sucesso!",
        });
      } else {
        // Criar novo centro
        const createData = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          responsible: formData.responsible,
          department: formData.department,
          budget: formData.budget,
          status: formData.status
        };
        
        await axios.post(`${config.API_URL}/api/cost-centers`, createData);
        toast({
          title: "Sucesso",
          description: "Centro de custo criado com sucesso!",
        });
      }

      // Recarregar dados
      await carregarDados();
      
      setShowFormModal(false);
      setEditingCentro(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        responsible: '',
        department: '',
        budget: 0,
        status: 'ATIVO'
      });

    } catch (error) {
      console.error('Erro ao salvar centro de custo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar centro de custo",
        variant: "destructive",
      });
    }
  };

  const handleEditarCentro = (centro: CentroCusto) => {
    setEditingCentro(centro);
    setFormData(centro);
    setShowFormModal(true);
  };

  const handleVisualizarCentro = (centro: CentroCusto) => {
    setViewingCentro(centro);
    setShowViewModal(true);
  };

  const handleExcluirCentro = async (id: string) => {
    try {
      await axios.delete(`${config.API_URL}/api/cost-centers/${id}`);
      toast({
        title: "Sucesso",
        description: "Centro de custo excluído com sucesso!",
      });
      
      // Recarregar dados
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir centro de custo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir centro de custo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Filtrar centros de custo
  const centrosFiltrados = centrosCusto.filter(centro => {
    const matchesSearch = 
      centro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centro.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centro.responsible?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centro.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || centro.status === statusFilter;
    const matchesDepartamento = departamentoFilter === 'TODOS' || centro.department === departamentoFilter;
    
    return matchesSearch && matchesStatus && matchesDepartamento;
  });

  // Calcular resumo
  const resumo: ResumoCentroCusto = {
    totalCenters: centrosCusto.length,
    activeCenters: centrosCusto.filter(c => c.status === 'ATIVO').length,
    inactiveCenters: centrosCusto.filter(c => c.status === 'INATIVO').length,
    suspendedCenters: centrosCusto.filter(c => c.status === 'SUSPENSO').length,
    totalBudget: centrosCusto.reduce((sum, c) => sum + (c.budget || 0), 0),
    totalSpent: centrosCusto.reduce((sum, c) => sum + (c.currentSpent || 0), 0),
    totalAvailable: 0,
    averageUtilization: 0
  };

  resumo.totalAvailable = resumo.totalBudget - resumo.totalSpent;
  resumo.averageUtilization = resumo.totalBudget > 0 ? (resumo.totalSpent / resumo.totalBudget) * 100 : 0;

  // Departamentos únicos para filtro
  const departamentos = [...new Set(centrosCusto.map(c => c.department).filter(Boolean))];

  return (
    <div className="min-h-screen bg-seguranca-black">
      {/* Header Principal */}
      <div className="bg-seguranca-graphite border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              Centro de Custos
            </h1>
            <p className="text-gray-400 mt-1">
              Gerencie centros de custo e acompanhe orçamentos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowFormModal(true)}
              className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
            >
              <Plus size={16} className="mr-2" />
              Novo Centro
            </Button>
            <Button
              onClick={carregarDados}
              disabled={loading}
              variant="outline"
              className="border-gray-600 text-white hover:bg-seguranca-black"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <RefreshCw size={16} className="mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total de Centros</p>
                    <p className="text-white text-2xl font-bold">{resumo.totalCenters}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-200" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-blue-200">{resumo.activeCenters} ativos</p>
                </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Orçamento Total</p>
                    <p className="text-white text-xl font-bold">{formatCurrency(resumo.totalBudget)}</p>
                  </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-green-200">Orçamento disponível</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-600 to-orange-700 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Gasto Total</p>
                    <p className="text-white text-xl font-bold">{formatCurrency(resumo.totalSpent)}</p>
                  </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-orange-200">Gastos realizados</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Utilização</p>
                    <p className="text-white text-xl font-bold">{resumo.averageUtilization.toFixed(1)}%</p>
                  </div>
                <BarChart3 className="h-8 w-8 text-purple-200" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-purple-200">Do orçamento total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-600 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="text-blue-500" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray mb-2 block">Buscar</label>
                <Input
                  placeholder="Buscar por nome, código, responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-600 bg-seguranca-black text-white placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="TODOS" className="text-white hover:bg-seguranca-graphite">Todos</SelectItem>
                    <SelectItem value="ATIVO" className="text-white hover:bg-seguranca-graphite">Ativo</SelectItem>
                    <SelectItem value="INATIVO" className="text-white hover:bg-seguranca-graphite">Inativo</SelectItem>
                    <SelectItem value="SUSPENSO" className="text-white hover:bg-seguranca-graphite">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray mb-2 block">Departamento</label>
                <Select value={departamentoFilter} onValueChange={setDepartamentoFilter}>
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="TODOS" className="text-white hover:bg-seguranca-graphite">Todos</SelectItem>
                    {departamentos.map(dept => (
                      <SelectItem key={dept} value={dept!} className="text-white hover:bg-seguranca-graphite">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Centros de Custo */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="text-blue-500" />
              Centros de Custo ({centrosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-white">Código</TableHead>
                    <TableHead className="text-white">Nome</TableHead>
                    <TableHead className="text-white">Responsável</TableHead>
                    <TableHead className="text-white">Departamento</TableHead>
                    <TableHead className="text-white">Orçamento</TableHead>
                    <TableHead className="text-white">Gasto Atual</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centrosFiltrados.map((centro) => (
                    <TableRow key={centro.id} className="border-gray-600 hover:bg-seguranca-black">
                      <TableCell className="text-gray-300 font-mono">{centro.code}</TableCell>
                      <TableCell className="text-white font-medium">{centro.name}</TableCell>
                      <TableCell className="text-gray-300">{centro.responsible || '-'}</TableCell>
                      <TableCell className="text-gray-300">{centro.department || '-'}</TableCell>
                      <TableCell className="text-green-400 font-medium">
                        {formatCurrency(centro.budget || 0)}
                      </TableCell>
                      <TableCell className="text-orange-400 font-medium">
                        {formatCurrency(centro.currentSpent || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            centro.status === 'ATIVO' ? 'border-green-300 text-green-300' :
                            centro.status === 'INATIVO' ? 'border-red-300 text-red-300' :
                            'border-yellow-300 text-yellow-300'
                          }
                        >
                          {centro.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVisualizarCentro(centro)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            onClick={() => handleEditarCentro(centro)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-blue-400"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            onClick={() => handleExcluirCentro(centro.id)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {centrosFiltrados.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400">Nenhum centro de custo encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Formulário */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="sm:max-w-[600px] bg-seguranca-black text-seguranca-lightgray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-seguranca-yellow flex items-center gap-2">
              <Building2 size={20} />
              {editingCentro ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
            </DialogTitle>
            <DialogDescription>
              {editingCentro ? 'Atualize as informações do centro de custo' : 'Preencha os dados do novo centro de custo'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray">Código *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: CC001"
                  className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do centro de custo"
                  className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-seguranca-lightgray">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do centro de custo"
                className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray">Responsável</label>
                <Input
                  value={formData.responsible}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                  placeholder="Nome do responsável"
                  className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray">Departamento</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Departamento"
                  className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray">Orçamento</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray">Status</label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="ATIVO" className="text-white hover:bg-seguranca-graphite">Ativo</SelectItem>
                    <SelectItem value="INATIVO" className="text-white hover:bg-seguranca-graphite">Inativo</SelectItem>
                    <SelectItem value="SUSPENSO" className="text-white hover:bg-seguranca-graphite">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowFormModal(false);
                  setEditingCentro(null);
                  setFormData({
                    code: '',
                    name: '',
                    description: '',
                    responsible: '',
                    department: '',
                    budget: 0,
                    status: 'ATIVO'
                  });
                }}
                className="text-seguranca-lightgray border-gray-600 hover:bg-seguranca-graphite"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarCentro}
                className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
              >
                <Building2 size={16} className="mr-2" />
                {editingCentro ? 'Atualizar' : 'Criar'} Centro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[500px] bg-seguranca-black text-seguranca-lightgray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-seguranca-yellow flex items-center gap-2">
              <Eye size={20} />
              Detalhes do Centro de Custo
            </DialogTitle>
          </DialogHeader>
          
          {viewingCentro && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Código:</span>
                  <span className="text-white ml-2 font-mono">{viewingCentro.code}</span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${
                      viewingCentro.status === 'ATIVO' ? 'border-green-300 text-green-300' :
                      viewingCentro.status === 'INATIVO' ? 'border-red-300 text-red-300' :
                      'border-yellow-300 text-yellow-300'
                    }`}
                  >
                    {viewingCentro.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Nome:</span>
                  <span className="text-white ml-2 font-medium">{viewingCentro.name}</span>
                </div>
                {viewingCentro.description && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Descrição:</span>
                    <p className="text-white ml-2 mt-1">{viewingCentro.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Responsável:</span>
                  <span className="text-white ml-2">{viewingCentro.responsible || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Departamento:</span>
                  <span className="text-white ml-2">{viewingCentro.department || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Orçamento:</span>
                  <span className="text-green-400 ml-2 font-medium">{formatCurrency(viewingCentro.budget || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Gasto Atual:</span>
                  <span className="text-orange-400 ml-2 font-medium">{formatCurrency(viewingCentro.currentSpent || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Data Criação:</span>
                  <span className="text-white ml-2">{format(new Date(viewingCentro.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
                {viewingCentro.updatedAt && (
                  <div>
                    <span className="text-gray-400">Última Atualização:</span>
                    <span className="text-white ml-2">{format(new Date(viewingCentro.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                  className="text-seguranca-lightgray border-gray-600 hover:bg-seguranca-graphite"
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditarCentro(viewingCentro);
                  }}
                  className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CentroCustosTab;
