import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  MapPin, 
  Users, 
  Clock,
  Building,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { workPostService, WorkPost, WorkPostFilters } from '@/services/workPostService';
import { clientService } from '@/services/clientService';
import { Client } from '@/types/client';
import WorkPostFormModal from '@/components/postos/WorkPostFormModal';
import WorkPostViewModal from '@/components/postos/WorkPostViewModal';
import WorkPostDeleteDialog from '@/components/postos/WorkPostDeleteDialog';
import { StandardLayout } from '@/components/StandardLayout';

const Postos: React.FC = () => {
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  
  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkPost, setSelectedWorkPost] = useState<WorkPost | null>(null);
  const [editingWorkPost, setEditingWorkPost] = useState<WorkPost | null>(null);
  
  const { toast } = useToast();

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workPostsData, clientsResponse] = await Promise.all([
        workPostService.getWorkPosts(),
        clientService.getClients({ page: 0, size: 1000 })
      ]);
      setWorkPosts(workPostsData);
      setClients(clientsResponse.content);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos postos de trabalho",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar postos
  const filteredWorkPosts = workPosts.filter(workPost => {
    const matchesSearch = !searchTerm || 
      workPost.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workPost.postCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workPost.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || workPost.status === statusFilter;
    const matchesType = typeFilter === 'all' || workPost.type === typeFilter;
    const matchesClient = clientFilter === 'all' || workPost.clientId === clientFilter;
    const matchesCity = !cityFilter || workPost.city?.toLowerCase().includes(cityFilter.toLowerCase());
    const matchesState = !stateFilter || workPost.state?.toLowerCase().includes(stateFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesType && matchesClient && matchesCity && matchesState;
  });

  // Handlers
  const handleCreateWorkPost = () => {
    setEditingWorkPost(null);
    setIsFormModalOpen(true);
  };

  const handleEditWorkPost = (workPost: WorkPost) => {
    setEditingWorkPost(workPost);
    setIsFormModalOpen(true);
  };

  const handleViewWorkPost = (workPost: WorkPost) => {
    setSelectedWorkPost(workPost);
    setIsViewModalOpen(true);
  };

  const handleDeleteWorkPost = (workPost: WorkPost) => {
    setSelectedWorkPost(workPost);
    setIsDeleteDialogOpen(true);
  };

  const handleStatusChange = async (workPostId: string, newStatus: string) => {
    try {
      await workPostService.updateWorkPostStatus(workPostId, newStatus);
      await loadData();
      toast({
        title: "Sucesso",
        description: "Status do posto atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do posto",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async () => {
    await loadData();
    setIsFormModalOpen(false);
    setEditingWorkPost(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWorkPost) return;
    
    try {
      await workPostService.deleteWorkPost(selectedWorkPost.id);
      await loadData();
      setIsDeleteDialogOpen(false);
      setSelectedWorkPost(null);
      toast({
        title: "Sucesso",
        description: "Posto de trabalho excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir posto:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir posto de trabalho",
        variant: "destructive",
      });
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'EM_IMPLANTACAO': return 'bg-blue-100 text-blue-800';
      case 'INATIVO': return 'bg-gray-100 text-gray-800';
      case 'SUSPENSO': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELADO': return 'bg-red-100 text-red-800';
      case 'EM_ANALISE': return 'bg-purple-100 text-purple-800';
      case 'PENDENTE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'Ativo';
      case 'EM_IMPLANTACAO': return 'Em Implantação';
      case 'INATIVO': return 'Inativo';
      case 'SUSPENSO': return 'Suspenso';
      case 'CANCELADO': return 'Cancelado';
      case 'EM_ANALISE': return 'Em Análise';
      case 'PENDENTE': return 'Pendente';
      default: return status;
    }
  };

  // Função para obter texto do tipo
  const getTypeText = (type: string) => {
    switch (type) {
      case 'POSTO_24H': return 'Posto 24h';
      case 'POSTO_SDF': return 'Posto SDF';
      case 'POSTO_12H_NOTURNO': return '12h Noturno';
      case 'POSTO_12H_DIURNO': return '12h Diurno';
      case 'POSTO_6H': return 'Posto 6h';
      case 'POSTO_8H': return 'Posto 8h';
      case 'OUTROS': return 'Outros';
      default: return type;
    }
  };

  // Estatísticas
  const stats = {
    total: workPosts.length,
    ativos: workPosts.filter(wp => wp.status === 'ATIVO').length,
    emImplantacao: workPosts.filter(wp => wp.status === 'EM_IMPLANTACAO').length,
    inativos: workPosts.filter(wp => wp.status === 'INATIVO').length,
    totalVigilantes: workPosts.reduce((total, wp) => total + wp.requiredVigilantes, 0)
  };

  if (loading) {
    return (
      <StandardLayout title="Postos de Trabalho" subtitle="Gestão e implantação de postos de serviço">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando postos de trabalho...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout title="Postos de Trabalho" subtitle="Gestão e implantação de postos de serviço">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Postos de Trabalho</h1>
            <p className="text-muted-foreground">
              Gerencie os postos de trabalho e suas implantações
            </p>
          </div>
          <Button onClick={handleCreateWorkPost}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Posto
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Postos</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Implantação</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.emImplantacao}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <XCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inativos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vigilantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVigilantes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, código ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="EM_IMPLANTACAO">Em Implantação</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="POSTO_24H">Posto 24h</SelectItem>
                    <SelectItem value="POSTO_SDF">Posto SDF</SelectItem>
                    <SelectItem value="POSTO_12H_NOTURNO">12h Noturno</SelectItem>
                    <SelectItem value="POSTO_12H_DIURNO">12h Diurno</SelectItem>
                    <SelectItem value="POSTO_6H">Posto 6h</SelectItem>
                    <SelectItem value="POSTO_8H">Posto 8h</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade</label>
                <Input
                  placeholder="Filtrar por cidade..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Input
                  placeholder="Filtrar por estado..."
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Postos de Trabalho ({filteredWorkPosts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Vigilantes</TableHead>
                    <TableHead>Escala</TableHead>
                    <TableHead>Implantação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Building className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">Nenhum posto encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWorkPosts.map((workPost) => (
                      <TableRow key={workPost.id}>
                        <TableCell className="font-medium">{workPost.postCode}</TableCell>
                        <TableCell>{workPost.name}</TableCell>
                        <TableCell>{workPost.clientName || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeText(workPost.type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(workPost.status)}>
                            {getStatusText(workPost.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="text-sm">
                              {workPost.city && workPost.state 
                                ? `${workPost.city}, ${workPost.state}`
                                : workPost.address.substring(0, 30) + '...'
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{workPost.requiredVigilantes}</span>
                          </div>
                        </TableCell>
                        <TableCell>{workPost.workSchedule}</TableCell>
                        <TableCell>
                          {workPost.implementationDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="text-sm">
                                {new Date(workPost.implementationDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não definida</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <FileText className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewWorkPost(workPost)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditWorkPost(workPost)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteWorkPost(workPost)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modais */}
        <WorkPostFormModal
          open={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          workPost={editingWorkPost}
          clients={clients}
          onSubmit={handleFormSubmit}
        />

        <WorkPostViewModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          workPost={selectedWorkPost}
          onStatusChange={handleStatusChange}
        />

        <WorkPostDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          workPost={selectedWorkPost}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </StandardLayout>
  );
};

export default Postos; 