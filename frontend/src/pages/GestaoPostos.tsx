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
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';
import { operacionalService } from '@/services/operacionalService';
import { PostoOperacional, CreatePostoOperacionalDTO } from '@/types/operacional';
import { useToast } from '@/hooks/use-toast';

const GestaoPostos: React.FC = () => {
  const { toast } = useToast();
  const [postos, setPostos] = useState<PostoOperacional[]>([]);
  const [filteredPostos, setFilteredPostos] = useState<PostoOperacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosto, setEditingPosto] = useState<PostoOperacional | null>(null);
  const [formData, setFormData] = useState<CreatePostoOperacionalDTO>({
    nome: '',
    cliente: '',
    endereco: '',
    tipo: 'EMPRESA',
    horarioFuncionamento: '',
    observacoes: ''
  });

  const loadPostos = async () => {
    try {
      setLoading(true);
      const data = await operacionalService.getPostos();
      setPostos(data);
      setFilteredPostos(data);
    } catch (error) {
      console.error('Erro ao carregar postos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar postos operacionais',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostos();
  }, []);

  useEffect(() => {
    let filtered = postos;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(posto => 
        posto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posto.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        posto.endereco.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(posto => posto.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== 'TODOS') {
      filtered = filtered.filter(posto => posto.tipo === tipoFilter);
    }

    setFilteredPostos(filtered);
  }, [postos, searchTerm, statusFilter, tipoFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPosto) {
        await operacionalService.updatePosto(editingPosto.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Posto atualizado com sucesso!'
        });
      } else {
        await operacionalService.createPosto(formData);
        toast({
          title: 'Sucesso',
          description: 'Posto criado com sucesso!'
        });
      }
      
      setModalOpen(false);
      setEditingPosto(null);
      setFormData({
        nome: '',
        cliente: '',
        endereco: '',
        tipo: 'EMPRESA',
        horarioFuncionamento: '',
        observacoes: ''
      });
      loadPostos();
    } catch (error) {
      console.error('Erro ao salvar posto:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar posto operacional',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (posto: PostoOperacional) => {
    setEditingPosto(posto);
    setFormData({
      nome: posto.nome,
      cliente: posto.cliente,
      endereco: posto.endereco,
      tipo: posto.tipo,
      horarioFuncionamento: posto.horarioFuncionamento,
      observacoes: posto.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este posto?')) {
      try {
        await operacionalService.deletePosto(id);
        toast({
          title: 'Sucesso',
          description: 'Posto excluído com sucesso!'
        });
        loadPostos();
      } catch (error) {
        console.error('Erro ao excluir posto:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir posto operacional',
          variant: 'destructive'
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-500';
      case 'INATIVO': return 'bg-gray-500';
      case 'MANUTENCAO': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'HOTEL': return 'Hotel';
      case 'SHOPPING': return 'Shopping';
      case 'EMPRESA': return 'Empresa';
      case 'RESIDENCIAL': return 'Residencial';
      case 'OUTRO': return 'Outro';
      default: return tipo;
    }
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando postos...</span>
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
            <h1 className="text-3xl font-bold text-seguranca-lightgray">Gestão de Postos</h1>
            <p className="text-seguranca-lightgray/70 mt-1">Gerencie os postos operacionais da empresa</p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-seguranca-black"
                onClick={() => {
                  setEditingPosto(null);
                  setFormData({
                    nome: '',
                    cliente: '',
                    endereco: '',
                    tipo: 'EMPRESA',
                    horarioFuncionamento: '',
                    observacoes: ''
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Posto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-seguranca-graphite border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-seguranca-lightgray">
                  {editingPosto ? 'Editar Posto' : 'Novo Posto'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome" className="text-seguranca-lightgray">Nome do Posto *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cliente" className="text-seguranca-lightgray">Cliente *</Label>
                    <Input
                      id="cliente"
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="endereco" className="text-seguranca-lightgray">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
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
                        <SelectItem value="HOTEL" className="text-seguranca-lightgray">Hotel</SelectItem>
                        <SelectItem value="SHOPPING" className="text-seguranca-lightgray">Shopping</SelectItem>
                        <SelectItem value="EMPRESA" className="text-seguranca-lightgray">Empresa</SelectItem>
                        <SelectItem value="RESIDENCIAL" className="text-seguranca-lightgray">Residencial</SelectItem>
                        <SelectItem value="OUTRO" className="text-seguranca-lightgray">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="horario" className="text-seguranca-lightgray">Horário de Funcionamento *</Label>
                    <Input
                      id="horario"
                      value={formData.horarioFuncionamento}
                      onChange={(e) => setFormData({ ...formData, horarioFuncionamento: e.target.value })}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Ex: 24h, 6h às 18h"
                      required
                    />
                  </div>
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
                    {editingPosto ? 'Atualizar' : 'Criar'}
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
                    placeholder="Nome, cliente ou endereço..."
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
                    <SelectItem value="ATIVO" className="text-seguranca-lightgray">Ativo</SelectItem>
                    <SelectItem value="INATIVO" className="text-seguranca-lightgray">Inativo</SelectItem>
                    <SelectItem value="MANUTENCAO" className="text-seguranca-lightgray">Manutenção</SelectItem>
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
                    <SelectItem value="HOTEL" className="text-seguranca-lightgray">Hotel</SelectItem>
                    <SelectItem value="SHOPPING" className="text-seguranca-lightgray">Shopping</SelectItem>
                    <SelectItem value="EMPRESA" className="text-seguranca-lightgray">Empresa</SelectItem>
                    <SelectItem value="RESIDENCIAL" className="text-seguranca-lightgray">Residencial</SelectItem>
                    <SelectItem value="OUTRO" className="text-seguranca-lightgray">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Postos */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              Postos ({filteredPostos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPostos.map((posto) => (
                <div key={posto.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-seguranca-yellow mr-2" />
                      <h3 className="font-semibold text-seguranca-lightgray">{posto.nome}</h3>
                    </div>
                    <Badge className={`${getStatusColor(posto.status)} text-white`}>
                      {posto.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <span className="font-medium mr-2">Cliente:</span>
                      {posto.cliente}
                    </div>
                    <div className="flex items-start text-sm text-seguranca-lightgray/70">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{posto.endereco}</span>
                    </div>
                    <div className="flex items-center text-sm text-seguranca-lightgray/70">
                      <Clock className="h-4 w-4 mr-2" />
                      {posto.horarioFuncionamento}
                    </div>
                    <div className="text-sm text-seguranca-lightgray/70">
                      <span className="font-medium">Tipo:</span> {getTipoLabel(posto.tipo)}
                    </div>
                  </div>

                  {posto.observacoes && (
                    <div className="mb-4">
                      <p className="text-xs text-seguranca-lightgray/50 mb-1">Observações:</p>
                      <p className="text-sm text-seguranca-lightgray/70">{posto.observacoes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(posto)}
                      className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(posto.id)}
                      className="border-red-600 text-red-400 hover:bg-red-900"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredPostos.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-seguranca-lightgray/30 mx-auto mb-4" />
                <p className="text-seguranca-lightgray/70">Nenhum posto encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default GestaoPostos;
