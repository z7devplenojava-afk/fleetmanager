import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck,
  Filter,
  RefreshCw,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { operacionalService } from '@/services/operacionalService';
import { FeriasOperacional, CreateFeriasOperacionalDTO, FuncionarioOperacional } from '@/types/operacional';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GestaoFerias: React.FC = () => {
  const { toast } = useToast();
  const [ferias, setFerias] = useState<FeriasOperacional[]>([]);
  const [filteredFerias, setFilteredFerias] = useState<FeriasOperacional[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioOperacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFerias, setEditingFerias] = useState<FeriasOperacional | null>(null);
  const [formData, setFormData] = useState<CreateFeriasOperacionalDTO>({
    funcionarioId: '',
    dataInicio: '',
    dataFim: '',
    funcionarioCoberturaId: '',
    observacoes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [feriasData, funcionariosData] = await Promise.all([
        operacionalService.getFerias(),
        operacionalService.getFuncionarios()
      ]);
      
      setFerias(feriasData);
      setFilteredFerias(feriasData);
      setFuncionarios(funcionariosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados das férias',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = ferias;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(feria => 
        feria.funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feria.funcionarioCobertura?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feria.funcionario.matricula.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(feria => feria.status === statusFilter);
    }

    setFilteredFerias(filtered);
  }, [ferias, searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFerias) {
        await operacionalService.updateFerias(editingFerias.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Férias atualizadas com sucesso!'
        });
      } else {
        await operacionalService.createFerias(formData);
        toast({
          title: 'Sucesso',
          description: 'Férias criadas com sucesso!'
        });
      }
      
      setModalOpen(false);
      setEditingFerias(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar férias:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar férias operacional',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      funcionarioId: '',
      dataInicio: '',
      dataFim: '',
      funcionarioCoberturaId: '',
      observacoes: ''
    });
  };

  const handleEdit = (feria: FeriasOperacional) => {
    setEditingFerias(feria);
    setFormData({
      funcionarioId: feria.funcionarioId,
      dataInicio: feria.dataInicio,
      dataFim: feria.dataFim,
      funcionarioCoberturaId: feria.funcionarioCoberturaId || '',
      observacoes: feria.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar estas férias?')) {
      try {
        await operacionalService.cancelarFerias(id);
        toast({
          title: 'Sucesso',
          description: 'Férias canceladas com sucesso!'
        });
        loadData();
      } catch (error) {
        console.error('Erro ao cancelar férias:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao cancelar férias',
          variant: 'destructive'
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADA': return 'bg-blue-500';
      case 'EM_ANDAMENTO': return 'bg-green-500';
      case 'FINALIZADA': return 'bg-gray-500';
      case 'CANCELADA': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AGENDADA': return 'Agendada';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'FINALIZADA': return 'Finalizada';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  };

  const getFuncionariosDisponiveis = () => {
    return funcionarios.filter(func => func.status === 'ATIVO');
  };

  const calcularDiasFerias = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando férias...</span>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-seguranca-lightgray">Gestão de Férias</h1>
            <p className="text-seguranca-lightgray/70 mt-1">Gerencie as férias dos funcionários e suas coberturas</p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-seguranca-black"
                onClick={() => {
                  setEditingFerias(null);
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Férias
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-seguranca-graphite border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-seguranca-lightgray">
                  {editingFerias ? 'Editar Férias' : 'Nova Férias'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="funcionario" className="text-seguranca-lightgray">Funcionário *</Label>
                  <Select value={formData.funcionarioId} onValueChange={(value) => setFormData({ ...formData, funcionarioId: value })}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {getFuncionariosDisponiveis().map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id} className="text-seguranca-lightgray">
                          {funcionario.nome} - {funcionario.matricula}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dataInicio" className="text-seguranca-lightgray">Data de Início *</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={formData.dataInicio}
                      onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim" className="text-seguranca-lightgray">Data de Fim *</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={formData.dataFim}
                      onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      required
                    />
                  </div>
                </div>

                {formData.dataInicio && formData.dataFim && (
                  <div className="bg-seguranca-black p-3 rounded-lg border border-gray-600">
                    <p className="text-sm text-seguranca-lightgray">
                      <strong>Duração:</strong> {calcularDiasFerias(formData.dataInicio, formData.dataFim)} dias
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="cobertura" className="text-seguranca-lightgray">Funcionário de Cobertura</Label>
                  <Select value={formData.funcionarioCoberturaId} onValueChange={(value) => setFormData({ ...formData, funcionarioCoberturaId: value })}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o funcionário de cobertura (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      <SelectItem value="" className="text-seguranca-lightgray">Sem cobertura definida</SelectItem>
                      {getFuncionariosDisponiveis().map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id} className="text-seguranca-lightgray">
                          {funcionario.nome} - {funcionario.matricula}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="observacoes" className="text-seguranca-lightgray">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    rows={3}
                    placeholder="Informações adicionais sobre as férias..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setModalOpen(false)}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-seguranca-black"
                  >
                    {editingFerias ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search" className="text-seguranca-lightgray">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-seguranca-lightgray/50" />
                  <Input
                    id="search"
                    placeholder="Funcionário, matrícula ou cobertura..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="TODOS" className="text-seguranca-lightgray">Todos</SelectItem>
                    <SelectItem value="AGENDADA" className="text-seguranca-lightgray">Agendada</SelectItem>
                    <SelectItem value="EM_ANDAMENTO" className="text-seguranca-lightgray">Em Andamento</SelectItem>
                    <SelectItem value="FINALIZADA" className="text-seguranca-lightgray">Finalizada</SelectItem>
                    <SelectItem value="CANCELADA" className="text-seguranca-lightgray">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Férias */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              Férias ({filteredFerias.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFerias.map((feria) => (
                <div key={feria.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-seguranca-yellow mr-2" />
                      <h3 className="font-semibold text-seguranca-lightgray">{feria.funcionario.nome}</h3>
                    </div>
                    <Badge className={`${getStatusColor(feria.status)} text-white`}>
                      {getStatusLabel(feria.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <Calendar className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Período:</span>
                        <br />
                        <span className="text-xs">
                          {format(new Date(feria.dataInicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(feria.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        <br />
                        <span className="text-xs text-seguranca-yellow">
                          ({calcularDiasFerias(feria.dataInicio, feria.dataFim)} dias)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <UserCheck className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Cobertura:</span>
                        <br />
                        <span className="text-xs">
                          {feria.funcionarioCobertura?.nome || 'Não definida'}
                        </span>
                        {feria.funcionarioCobertura && (
                          <>
                            <br />
                            <span className="text-xs text-seguranca-lightgray/50">
                              Matrícula: {feria.funcionarioCobertura.matricula}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <Calendar className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Criado em:</span>
                        <br />
                        <span className="text-xs">
                          {format(new Date(feria.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {feria.observacoes && (
                    <div className="mb-4">
                      <p className="text-xs text-seguranca-lightgray/50 mb-1">Observações:</p>
                      <p className="text-sm text-seguranca-lightgray/70">{feria.observacoes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(feria)}
                      className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    {feria.status === 'AGENDADA' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(feria.id)}
                        className="border-red-600 text-red-400 hover:bg-red-900"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredFerias.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-seguranca-lightgray/30 mx-auto mb-4" />
                <p className="text-seguranca-lightgray/70">Nenhuma férias encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default GestaoFerias;
