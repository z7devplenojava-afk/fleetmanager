import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  DollarSign,
  Clock,
  Users,
  Shield,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  code?: string;
  unitPrice?: number;
  unit?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DISCONTINUED';
  isBillable: boolean;
  requiresEquipment: boolean;
  requiresCertification: boolean;
  estimatedDurationHours?: number;
  minEmployeesRequired: number;
  maxEmployeesAllowed?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  displayName: string;
  isActive: boolean;
  canBeBilled: boolean;
}

interface CreateServiceData {
  name: string;
  description?: string;
  category?: string;
  code?: string;
  unitPrice?: number;
  unit?: string;
  isBillable?: boolean;
  requiresEquipment?: boolean;
  requiresCertification?: boolean;
  estimatedDurationHours?: number;
  minEmployeesRequired?: number;
  maxEmployeesAllowed?: number;
  notes?: string;
}

interface UpdateServiceData extends CreateServiceData {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DISCONTINUED';
}

const GestaoServicos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<CreateServiceData>({
    name: '',
    description: '',
    category: '',
    code: '',
    unitPrice: undefined,
    unit: '',
    isBillable: true,
    requiresEquipment: false,
    requiresCertification: false,
    estimatedDurationHours: undefined,
    minEmployeesRequired: 1,
    maxEmployeesAllowed: undefined,
    notes: ''
  });

  const queryClient = useQueryClient();

  // Buscar serviços
  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services', searchTerm, statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      
      const response = await api.get(`/admin/services?${params.toString()}`);
      return response.data;
    }
  });

  // Buscar categorias
  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const response = await api.get('/admin/services/categories');
      return response.data;
    }
  });

  // Criar serviço
  const createServiceMutation = useMutation({
    mutationFn: async (data: CreateServiceData) => {
      const response = await api.post('/admin/services', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço criado com sucesso!');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar serviço');
    }
  });

  // Atualizar serviço
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateServiceData }) => {
      const response = await api.put(`/admin/services/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço atualizado com sucesso!');
      setIsEditModalOpen(false);
      setSelectedService(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar serviço');
    }
  });

  // Excluir serviço
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir serviço');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      code: '',
      unitPrice: undefined,
      unit: '',
      isBillable: true,
      requiresEquipment: false,
      requiresCertification: false,
      estimatedDurationHours: undefined,
      minEmployeesRequired: 1,
      maxEmployeesAllowed: undefined,
      notes: ''
    });
  };

  const handleCreate = () => {
    createServiceMutation.mutate(formData);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category || '',
      code: service.code || '',
      unitPrice: service.unitPrice,
      unit: service.unit || '',
      isBillable: service.isBillable,
      requiresEquipment: service.requiresEquipment,
      requiresCertification: service.requiresCertification,
      estimatedDurationHours: service.estimatedDurationHours,
      minEmployeesRequired: service.minEmployeesRequired,
      maxEmployeesAllowed: service.maxEmployeesAllowed,
      notes: service.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (selectedService) {
      updateServiceMutation.mutate({
        id: selectedService.id,
        data: formData
      });
    }
  };

  const handleDelete = (service: Service) => {
    if (window.confirm(`Tem certeza que deseja excluir o serviço "${service.name}"?`)) {
      deleteServiceMutation.mutate(service.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'INACTIVE':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'SUSPENDED':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'DISCONTINUED':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo';
      case 'INACTIVE':
        return 'Inativo';
      case 'SUSPENDED':
        return 'Suspenso';
      case 'DISCONTINUED':
        return 'Descontinuado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DISCONTINUED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar serviços. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <StandardLayout 
      title="Gestão de Serviços" 
      subtitle="Gerencie os serviços oferecidos pela empresa"
    >
      <Helmet>
        <title>Gestão de Serviços - Secure Guard</title>
        <meta name="description" content="Gerencie os serviços oferecidos pela empresa" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-seguranca-lightgray">Gestão de Serviços</h1>
            <p className="text-seguranca-lightgray/70 mt-1">Gerencie os serviços oferecidos pela empresa</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-seguranca-yellow hover:bg-yellow-500 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Serviço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do serviço"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Código único"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do serviço"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Categoria"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unidade</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="hora, dia, mês"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unitPrice">Preço Unitário</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={formData.unitPrice || ''}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedDurationHours">Duração Estimada (horas)</Label>
                    <Input
                      id="estimatedDurationHours"
                      type="number"
                      value={formData.estimatedDurationHours || ''}
                      onChange={(e) => setFormData({ ...formData, estimatedDurationHours: parseInt(e.target.value) || undefined })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minEmployeesRequired">Mín. Funcionários</Label>
                    <Input
                      id="minEmployeesRequired"
                      type="number"
                      value={formData.minEmployeesRequired}
                      onChange={(e) => setFormData({ ...formData, minEmployeesRequired: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxEmployeesAllowed">Máx. Funcionários</Label>
                    <Input
                      id="maxEmployeesAllowed"
                      type="number"
                      value={formData.maxEmployeesAllowed || ''}
                      onChange={(e) => setFormData({ ...formData, maxEmployeesAllowed: parseInt(e.target.value) || undefined })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isBillable"
                      checked={formData.isBillable}
                      onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isBillable">Faturável</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresEquipment"
                      checked={formData.requiresEquipment}
                      onChange={(e) => setFormData({ ...formData, requiresEquipment: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="requiresEquipment">Requer Equipamento</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresCertification"
                      checked={formData.requiresCertification}
                      onChange={(e) => setFormData({ ...formData, requiresCertification: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="requiresCertification">Requer Certificação</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreate}
                    disabled={!formData.name || createServiceMutation.isPending}
                  >
                    {createServiceMutation.isPending ? 'Criando...' : 'Criar Serviço'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nome, código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                    <SelectItem value="DISCONTINUED">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Carregando serviços...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum serviço encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Funcionários</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service: Service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {service.code && (
                            <Badge variant="outline">{service.code}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{service.category || '-'}</TableCell>
                        <TableCell>
                          {service.unitPrice ? (
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                              {service.unitPrice.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                              {service.unit && <span className="text-sm text-gray-500 ml-1">/{service.unit}</span>}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(service.status)}
                            <Badge className={getStatusColor(service.status)}>
                              {getStatusLabel(service.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                            {service.minEmployeesRequired}
                            {service.maxEmployeesAllowed && `-${service.maxEmployeesAllowed}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(service)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Edição */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Serviço</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nome *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do serviço"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">Código</Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Código único"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do serviço"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Categoria</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Categoria"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit">Unidade</Label>
                  <Input
                    id="edit-unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="hora, dia, mês"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-unitPrice">Preço Unitário</Label>
                  <Input
                    id="edit-unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice || ''}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || undefined })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-estimatedDurationHours">Duração Estimada (horas)</Label>
                  <Input
                    id="edit-estimatedDurationHours"
                    type="number"
                    value={formData.estimatedDurationHours || ''}
                    onChange={(e) => setFormData({ ...formData, estimatedDurationHours: parseInt(e.target.value) || undefined })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-minEmployeesRequired">Mín. Funcionários</Label>
                  <Input
                    id="edit-minEmployeesRequired"
                    type="number"
                    value={formData.minEmployeesRequired}
                    onChange={(e) => setFormData({ ...formData, minEmployeesRequired: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-maxEmployeesAllowed">Máx. Funcionários</Label>
                  <Input
                    id="edit-maxEmployeesAllowed"
                    type="number"
                    value={formData.maxEmployeesAllowed || ''}
                    onChange={(e) => setFormData({ ...formData, maxEmployeesAllowed: parseInt(e.target.value) || undefined })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={selectedService?.status || 'ACTIVE'} 
                  onValueChange={(value) => {
                    if (selectedService) {
                      setSelectedService({ ...selectedService, status: value as any });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                    <SelectItem value="DISCONTINUED">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isBillable"
                    checked={formData.isBillable}
                    onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="edit-isBillable">Faturável</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-requiresEquipment"
                    checked={formData.requiresEquipment}
                    onChange={(e) => setFormData({ ...formData, requiresEquipment: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="edit-requiresEquipment">Requer Equipamento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-requiresCertification"
                    checked={formData.requiresCertification}
                    onChange={(e) => setFormData({ ...formData, requiresCertification: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="edit-requiresCertification">Requer Certificação</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-notes">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={!formData.name || updateServiceMutation.isPending}
                >
                  {updateServiceMutation.isPending ? 'Atualizando...' : 'Atualizar Serviço'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default GestaoServicos;
