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
  CheckSquare, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock,
  Filter,
  RefreshCw,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { operacionalService } from '@/services/operacionalService';
import { TarefaOperacional, CreateTarefaOperacionalDTO, PostoOperacional, FuncionarioOperacional } from '@/types/operacional';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GestaoTarefas: React.FC = () => {
  const { toast } = useToast();
  const [tarefas, setTarefas] = useState<TarefaOperacional[]>([]);
  const [filteredTarefas, setFilteredTarefas] = useState<TarefaOperacional[]>([]);
  const [postos, setPostos] = useState<PostoOperacional[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioOperacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('TODOS');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<TarefaOperacional | null>(null);
  const [formData, setFormData] = useState<CreateTarefaOperacionalDTO>({
    titulo: '',
    descricao: '',
    tipo: 'LIMPEZA',
    postoId: '',
    funcionarioResponsavelId: '',
    dataAgendamento: '',
    prioridade: 'MEDIA',
    observacoes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tarefasData, postosData, funcionariosData] = await Promise.all([
        operacionalService.getTarefas(),
        operacionalService.getPostos(),
        operacionalService.getFuncionarios()
      ]);
      
      setTarefas(tarefasData);
      setFilteredTarefas(tarefasData);
      setPostos(postosData);
      setFuncionarios(funcionariosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados das tarefas',
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
    let filtered = tarefas;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(tarefa => 
        tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tarefa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tarefa.posto?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tarefa.funcionarioResponsavel?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(tarefa => tarefa.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== 'TODOS') {
      filtered = filtered.filter(tarefa => tarefa.tipo === tipoFilter);
    }

    // Filtro por prioridade
    if (prioridadeFilter !== 'TODOS') {
      filtered = filtered.filter(tarefa => tarefa.prioridade === prioridadeFilter);
    }

    setFilteredTarefas(filtered);
  }, [tarefas, searchTerm, statusFilter, tipoFilter, prioridadeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTarefa) {
        await operacionalService.updateTarefa(editingTarefa.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Tarefa atualizada com sucesso!'
        });
      } else {
        await operacionalService.createTarefa(formData);
        toast({
          title: 'Sucesso',
          description: 'Tarefa criada com sucesso!'
        });
      }
      
      setModalOpen(false);
      setEditingTarefa(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar tarefa operacional',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      tipo: 'LIMPEZA',
      postoId: '',
      funcionarioResponsavelId: '',
      dataAgendamento: '',
      prioridade: 'MEDIA',
      observacoes: ''
    });
  };

  const handleEdit = (tarefa: TarefaOperacional) => {
    setEditingTarefa(tarefa);
    setFormData({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      tipo: tarefa.tipo,
      postoId: tarefa.postoId || '',
      funcionarioResponsavelId: tarefa.funcionarioResponsavelId || '',
      dataAgendamento: tarefa.dataAgendamento,
      prioridade: tarefa.prioridade,
      observacoes: tarefa.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleConcluir = async (id: string) => {
    if (window.confirm('Tem certeza que deseja marcar esta tarefa como concluída?')) {
      try {
        await operacionalService.concluirTarefa(id);
        toast({
          title: 'Sucesso',
          description: 'Tarefa concluída com sucesso!'
        });
        loadData();
      } catch (error) {
        console.error('Erro ao concluir tarefa:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao concluir tarefa',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await operacionalService.deleteTarefa(id);
        toast({
          title: 'Sucesso',
          description: 'Tarefa excluída com sucesso!'
        });
        loadData();
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir tarefa operacional',
          variant: 'destructive'
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADA': return 'bg-blue-500';
      case 'EM_ANDAMENTO': return 'bg-yellow-500';
      case 'CONCLUIDA': return 'bg-green-500';
      case 'CANCELADA': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AGENDADA': return 'Agendada';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'CONCLUIDA': return 'Concluída';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE': return 'bg-red-500';
      case 'ALTA': return 'bg-orange-500';
      case 'MEDIA': return 'bg-yellow-500';
      case 'BAIXA': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'LIMPEZA': return 'Limpeza';
      case 'MANUTENCAO': return 'Manutenção';
      case 'SEGURANCA': return 'Segurança';
      case 'ADMINISTRATIVO': return 'Administrativo';
      case 'OUTRO': return 'Outro';
      default: return tipo;
    }
  };

  const getFuncionariosDisponiveis = () => {
    return funcionarios.filter(func => func.status === 'ATIVO');
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando tarefas...</span>
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
            <h1 className="text-3xl font-bold text-seguranca-lightgray">Gestão de Tarefas</h1>
            <p className="text-seguranca-lightgray/70 mt-1">Gerencie as tarefas operacionais dos postos</p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-seguranca-black"
                onClick={() => {
                  setEditingTarefa(null);
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-seguranca-graphite border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-seguranca-lightgray">
                  {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="titulo" className="text-seguranca-lightgray">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Ex: Limpeza dos vidros"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao" className="text-seguranca-lightgray">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    rows={3}
                    placeholder="Descreva detalhadamente a tarefa a ser executada..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo" className="text-seguranca-lightgray">Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        <SelectItem value="LIMPEZA" className="text-seguranca-lightgray">Limpeza</SelectItem>
                        <SelectItem value="MANUTENCAO" className="text-seguranca-lightgray">Manutenção</SelectItem>
                        <SelectItem value="SEGURANCA" className="text-seguranca-lightgray">Segurança</SelectItem>
                        <SelectItem value="ADMINISTRATIVO" className="text-seguranca-lightgray">Administrativo</SelectItem>
                        <SelectItem value="OUTRO" className="text-seguranca-lightgray">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prioridade" className="text-seguranca-lightgray">Prioridade *</Label>
                    <Select value={formData.prioridade} onValueChange={(value) => setFormData({ ...formData, prioridade: value })}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        <SelectItem value="BAIXA" className="text-seguranca-lightgray">Baixa</SelectItem>
                        <SelectItem value="MEDIA" className="text-seguranca-lightgray">Média</SelectItem>
                        <SelectItem value="ALTA" className="text-seguranca-lightgray">Alta</SelectItem>
                        <SelectItem value="URGENTE" className="text-seguranca-lightgray">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="posto" className="text-seguranca-lightgray">Posto</Label>
                    <Select value={formData.postoId || 'none'} onValueChange={(value) => setFormData({ ...formData, postoId: value === 'none' ? '' : value })}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione o posto (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        <SelectItem value="none" className="text-seguranca-lightgray">Não especificado</SelectItem>
                        {postos.map((posto) => (
                          <SelectItem key={posto.id} value={posto.id} className="text-seguranca-lightgray">
                            {posto.nome} - {posto.cliente}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="responsavel" className="text-seguranca-lightgray">Responsável</Label>
                    <Select value={formData.funcionarioResponsavelId || 'none'} onValueChange={(value) => setFormData({ ...formData, funcionarioResponsavelId: value === 'none' ? '' : value })}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione o responsável (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        <SelectItem value="none" className="text-seguranca-lightgray">Não definido</SelectItem>
                        {getFuncionariosDisponiveis().map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.id} className="text-seguranca-lightgray">
                            {funcionario.nome} - {funcionario.matricula}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="dataAgendamento" className="text-seguranca-lightgray">Data de Agendamento *</Label>
                  <Input
                    id="dataAgendamento"
                    type="datetime-local"
                    value={formData.dataAgendamento}
                    onChange={(e) => setFormData({ ...formData, dataAgendamento: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes" className="text-seguranca-lightgray">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    rows={2}
                    placeholder="Informações adicionais sobre a tarefa..."
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
                    {editingTarefa ? 'Atualizar' : 'Criar'}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="text-seguranca-lightgray">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-seguranca-lightgray/50" />
                  <Input
                    id="search"
                    placeholder="Título, descrição, posto..."
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
                    <SelectItem value="CONCLUIDA" className="text-seguranca-lightgray">Concluída</SelectItem>
                    <SelectItem value="CANCELADA" className="text-seguranca-lightgray">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tipo" className="text-seguranca-lightgray">Tipo</Label>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="TODOS" className="text-seguranca-lightgray">Todos</SelectItem>
                    <SelectItem value="LIMPEZA" className="text-seguranca-lightgray">Limpeza</SelectItem>
                    <SelectItem value="MANUTENCAO" className="text-seguranca-lightgray">Manutenção</SelectItem>
                    <SelectItem value="SEGURANCA" className="text-seguranca-lightgray">Segurança</SelectItem>
                    <SelectItem value="ADMINISTRATIVO" className="text-seguranca-lightgray">Administrativo</SelectItem>
                    <SelectItem value="OUTRO" className="text-seguranca-lightgray">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prioridade" className="text-seguranca-lightgray">Prioridade</Label>
                <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="TODOS" className="text-seguranca-lightgray">Todos</SelectItem>
                    <SelectItem value="BAIXA" className="text-seguranca-lightgray">Baixa</SelectItem>
                    <SelectItem value="MEDIA" className="text-seguranca-lightgray">Média</SelectItem>
                    <SelectItem value="ALTA" className="text-seguranca-lightgray">Alta</SelectItem>
                    <SelectItem value="URGENTE" className="text-seguranca-lightgray">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Tarefas */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              Tarefas ({filteredTarefas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTarefas.map((tarefa) => (
                <div key={tarefa.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <CheckSquare className="h-5 w-5 text-seguranca-yellow mr-2" />
                      <h3 className="font-semibold text-seguranca-lightgray">{tarefa.titulo}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getPriorityColor(tarefa.prioridade)} text-white`}>
                        {tarefa.prioridade}
                      </Badge>
                      <Badge className={`${getStatusColor(tarefa.status)} text-white`}>
                        {getStatusLabel(tarefa.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-seguranca-lightgray/70 mb-4">{tarefa.descricao}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <Building2 className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Posto:</span>
                        <br />
                        <span className="text-xs">{tarefa.posto?.nome || 'Não especificado'}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <Users className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Responsável:</span>
                        <br />
                        <span className="text-xs">{tarefa.funcionarioResponsavel?.nome || 'Não definido'}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <Calendar className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Agendada para:</span>
                        <br />
                        <span className="text-xs">
                          {format(new Date(tarefa.dataAgendamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Tipo:</span>
                        <br />
                        <span className="text-xs">{getTipoLabel(tarefa.tipo)}</span>
                      </div>
                    </div>
                  </div>

                  {tarefa.observacoes && (
                    <div className="mb-4">
                      <p className="text-xs text-seguranca-lightgray/50 mb-1">Observações:</p>
                      <p className="text-sm text-seguranca-lightgray/70">{tarefa.observacoes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(tarefa)}
                      className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    {tarefa.status !== 'CONCLUIDA' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConcluir(tarefa.id)}
                        className="border-green-600 text-green-400 hover:bg-green-900"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Concluir
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(tarefa.id)}
                      className="border-red-600 text-red-400 hover:bg-red-900"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredTarefas.length === 0 && (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 text-seguranca-lightgray/30 mx-auto mb-4" />
                <p className="text-seguranca-lightgray/70">Nenhuma tarefa encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default GestaoTarefas;
