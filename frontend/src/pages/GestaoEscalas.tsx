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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock,
  Filter,
  RefreshCw,
  Users,
  Building2
} from 'lucide-react';
import { operacionalService } from '@/services/operacionalService';
import { EscalaOperacional, CreateEscalaOperacionalDTO, PostoOperacional, FuncionarioOperacional } from '@/types/operacional';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GestaoEscalas: React.FC = () => {
  const { toast } = useToast();
  const [escalas, setEscalas] = useState<EscalaOperacional[]>([]);
  const [filteredEscalas, setFilteredEscalas] = useState<EscalaOperacional[]>([]);
  const [postos, setPostos] = useState<PostoOperacional[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioOperacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEscala, setEditingEscala] = useState<EscalaOperacional | null>(null);
  const [formData, setFormData] = useState<CreateEscalaOperacionalDTO>({
    funcionarioId: '',
    postoId: '',
    tipoEscala: '6X1',
    dataInicio: '',
    dataFim: '',
    horarioInicio: '',
    horarioFim: '',
    observacoes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [escalasData, postosData, funcionariosData] = await Promise.all([
        operacionalService.getEscalas(),
        operacionalService.getPostos(),
        operacionalService.getFuncionarios()
      ]);
      
      setEscalas(escalasData);
      setFilteredEscalas(escalasData);
      setPostos(postosData);
      setFuncionarios(funcionariosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados das escalas',
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
    let filtered = escalas;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(escala => 
        escala.funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        escala.posto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        escala.posto.cliente.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(escala => escala.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== 'TODOS') {
      filtered = filtered.filter(escala => escala.tipoEscala === tipoFilter);
    }

    setFilteredEscalas(filtered);
  }, [escalas, searchTerm, statusFilter, tipoFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEscala) {
        await operacionalService.updateEscala(editingEscala.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Escala atualizada com sucesso!'
        });
      } else {
        await operacionalService.createEscala(formData);
        toast({
          title: 'Sucesso',
          description: 'Escala criada com sucesso!'
        });
      }
      
      setModalOpen(false);
      setEditingEscala(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar escala:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar escala operacional',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      funcionarioId: '',
      postoId: '',
      tipoEscala: '6X1',
      dataInicio: '',
      dataFim: '',
      horarioInicio: '',
      horarioFim: '',
      observacoes: ''
    });
  };

  const handleEdit = (escala: EscalaOperacional) => {
    setEditingEscala(escala);
    setFormData({
      funcionarioId: escala.funcionarioId,
      postoId: escala.postoId,
      tipoEscala: escala.tipoEscala,
      dataInicio: escala.dataInicio,
      dataFim: escala.dataFim,
      horarioInicio: escala.horarioInicio,
      horarioFim: escala.horarioFim,
      observacoes: escala.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta escala?')) {
      try {
        await operacionalService.deleteEscala(id);
        toast({
          title: 'Sucesso',
          description: 'Escala excluída com sucesso!'
        });
        loadData();
      } catch (error) {
        console.error('Erro ao excluir escala:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir escala operacional',
          variant: 'destructive'
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVA': return 'bg-green-500';
      case 'FOLGA': return 'bg-yellow-500';
      case 'FERIAS': return 'bg-blue-500';
      case 'COBERTURA': return 'bg-purple-500';
      case 'FALTA': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTipoEscalaLabel = (tipo: string) => {
    switch (tipo) {
      case '6X1': return '6x1 (6 dias trabalhados, 1 folga)';
      case '7X19': return '7h às 19h';
      case '20X08': return '20h às 8h';
      case 'NOTURNO': return 'Noturno';
      case 'DIURNO': return 'Diurno';
      case 'ESPECIAL': return 'Especial';
      default: return tipo;
    }
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando escalas...</span>
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
            <h1 className="text-3xl font-bold text-seguranca-lightgray">Gestão de Escalas</h1>
            <p className="text-seguranca-lightgray/70 mt-1">Gerencie as escalas dos funcionários nos postos</p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-seguranca-black"
                onClick={() => {
                  setEditingEscala(null);
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Escala
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-seguranca-graphite border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-seguranca-lightgray">
                  {editingEscala ? 'Editar Escala' : 'Nova Escala'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="funcionario" className="text-seguranca-lightgray">Funcionário *</Label>
                    <Select value={formData.funcionarioId} onValueChange={(value) => setFormData({ ...formData, funcionarioId: value })}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {funcionarios.map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.id} className="text-seguranca-lightgray">
                            {funcionario.nome} - {funcionario.matricula}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="posto" className="text-seguranca-lightgray">Posto *</Label>
                    <Select value={formData.postoId} onValueChange={(value) => setFormData({ ...formData, postoId: value })}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione o posto" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {postos.map((posto) => (
                          <SelectItem key={posto.id} value={posto.id} className="text-seguranca-lightgray">
                            {posto.nome} - {posto.cliente}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoEscala" className="text-seguranca-lightgray">Tipo de Escala *</Label>
                    <Select value={formData.tipoEscala} onValueChange={(value) => setFormData({ ...formData, tipoEscala: value })}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        <SelectItem value="6X1" className="text-seguranca-lightgray">6x1 (6 dias trabalhados, 1 folga)</SelectItem>
                        <SelectItem value="7X19" className="text-seguranca-lightgray">7h às 19h</SelectItem>
                        <SelectItem value="20X08" className="text-seguranca-lightgray">20h às 8h</SelectItem>
                        <SelectItem value="NOTURNO" className="text-seguranca-lightgray">Noturno</SelectItem>
                        <SelectItem value="DIURNO" className="text-seguranca-lightgray">Diurno</SelectItem>
                        <SelectItem value="ESPECIAL" className="text-seguranca-lightgray">Especial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="horarioInicio" className="text-seguranca-lightgray">Horário de Início *</Label>
                    <Input
                      id="horarioInicio"
                      type="time"
                      value={formData.horarioInicio}
                      onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="horarioFim" className="text-seguranca-lightgray">Horário de Fim *</Label>
                    <Input
                      id="horarioFim"
                      type="time"
                      value={formData.horarioFim}
                      onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      required
                    />
                  </div>
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

                <div>
                  <Label htmlFor="observacoes" className="text-seguranca-lightgray">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    rows={3}
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
                    {editingEscala ? 'Atualizar' : 'Criar'}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="text-seguranca-lightgray">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-seguranca-lightgray/50" />
                  <Input
                    id="search"
                    placeholder="Funcionário, posto ou cliente..."
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
                    <SelectItem value="ATIVA" className="text-seguranca-lightgray">Ativa</SelectItem>
                    <SelectItem value="FOLGA" className="text-seguranca-lightgray">Folga</SelectItem>
                    <SelectItem value="FERIAS" className="text-seguranca-lightgray">Férias</SelectItem>
                    <SelectItem value="COBERTURA" className="text-seguranca-lightgray">Cobertura</SelectItem>
                    <SelectItem value="FALTA" className="text-seguranca-lightgray">Falta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tipo" className="text-seguranca-lightgray">Tipo de Escala</Label>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="TODOS" className="text-seguranca-lightgray">Todos</SelectItem>
                    <SelectItem value="6X1" className="text-seguranca-lightgray">6x1</SelectItem>
                    <SelectItem value="7X19" className="text-seguranca-lightgray">7h às 19h</SelectItem>
                    <SelectItem value="20X08" className="text-seguranca-lightgray">20h às 8h</SelectItem>
                    <SelectItem value="NOTURNO" className="text-seguranca-lightgray">Noturno</SelectItem>
                    <SelectItem value="DIURNO" className="text-seguranca-lightgray">Diurno</SelectItem>
                    <SelectItem value="ESPECIAL" className="text-seguranca-lightgray">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Escalas */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              Escalas ({filteredEscalas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEscalas.map((escala) => (
                <div key={escala.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-seguranca-yellow mr-2" />
                      <h3 className="font-semibold text-seguranca-lightgray">{escala.funcionario.nome}</h3>
                    </div>
                    <Badge className={`${getStatusColor(escala.status)} text-white`}>
                      {escala.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <Building2 className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Posto:</span> {escala.posto.nome}
                        <br />
                        <span className="text-xs">{escala.posto.cliente}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <Clock className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Horário:</span> {escala.horarioInicio} - {escala.horarioFim}
                        <br />
                        <span className="text-xs">{getTipoEscalaLabel(escala.tipoEscala)}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <div>
                        <span className="font-medium">Período:</span>
                        <br />
                        <span className="text-xs">
                          {format(new Date(escala.dataInicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(escala.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {escala.observacoes && (
                    <div className="mb-4">
                      <p className="text-xs text-seguranca-lightgray/50 mb-1">Observações:</p>
                      <p className="text-sm text-seguranca-lightgray/70">{escala.observacoes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(escala)}
                      className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(escala.id)}
                      className="border-red-600 text-red-400 hover:bg-red-900"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredEscalas.length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-seguranca-lightgray/30 mx-auto mb-4" />
                <p className="text-seguranca-lightgray/70">Nenhuma escala encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default GestaoEscalas;
