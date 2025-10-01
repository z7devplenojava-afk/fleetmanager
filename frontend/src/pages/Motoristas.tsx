import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverService, { Driver, CreateDriverDTO } from '../services/driverService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MotoristasTable } from '@/components/frota/MotoristasTable';
import { DriverFormModal } from '@/components/frota/DriverFormModal';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Plus, Users, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Motoristas: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ATIVO' | 'INATIVO'>('all');
  
  // Queries
  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: driverService.getDrivers,
  });

  // Filtros
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (driver.licenseNumber && driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: drivers.length,
    ativos: drivers.filter(d => d.status === 'ATIVO').length,
    inativos: drivers.filter(d => d.status === 'INATIVO').length
  };

  // Mutations
  const createMutation = useMutation<Driver, Error, CreateDriverDTO>({
    mutationFn: driverService.createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsModalOpen(false);
      toast({
        title: "✅ Sucesso",
        description: "Motorista criado com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao criar motorista",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation<Driver, Error, { id: string; data: CreateDriverDTO }>({
    mutationFn: ({ id, data }) => driverService.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsModalOpen(false);
      setEditingDriver(null);
      toast({
        title: "✅ Sucesso",
        description: "Motorista atualizado com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao atualizar motorista",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: driverService.deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: "✅ Sucesso",
        description: "Motorista excluído com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao excluir motorista",
        variant: "destructive"
      });
    }
  });

  // Handlers
  const openNewModal = () => {
    setEditingDriver(null);
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setIsModalOpen(true);
  };

  const handleDelete = (driver: Driver) => {
    if (window.confirm(`Tem certeza que deseja EXCLUIR permanentemente o motorista "${driver.name}"?\n\n⚠️ Esta ação não pode ser desfeita!`)) {
      deleteMutation.mutate(driver.id);
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div className="min-h-screen bg-seguranca-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-seguranca-lightgray mb-2">Gestão de Motoristas</h1>
            <p className="text-gray-400">Gerencie os motoristas da frota de veículos</p>
          </div>
          <Button 
            onClick={openNewModal}
            className="bg-seguranca-red hover:bg-seguranca-darkred text-white transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Motorista
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
                <Users className="text-seguranca-yellow h-5 w-5" />
                Total de Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-seguranca-lightgray">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
                <UserCheck className="text-green-500 h-5 w-5" />
                Motoristas Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{stats.ativos}</p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
                <UserX className="text-red-500 h-5 w-5" />
                Motoristas Inativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{stats.inativos}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
              <Filter className="text-seguranca-yellow h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca */}
              <div>
                <Label htmlFor="search" className="text-seguranca-lightgray text-sm font-medium mb-2 block">
                  Buscar
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Nome ou CNH..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors"
                  />
                </div>
              </div>

              {/* Filtro por Status */}
              <div>
                <Label htmlFor="status" className="text-seguranca-lightgray text-sm font-medium mb-2 block">
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={(value: 'all' | 'ATIVO' | 'INATIVO') => setStatusFilter(value)}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-black/50">
                      Todos os status
                    </SelectItem>
                    <SelectItem value="ATIVO" className="text-seguranca-lightgray hover:bg-seguranca-black/50">
                      Ativo
                    </SelectItem>
                    <SelectItem value="INATIVO" className="text-seguranca-lightgray hover:bg-seguranca-black/50">
                      Inativo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Limpar Filtros */}
              <div className="flex items-end">
                <Button 
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-white transition-colors"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Motoristas */}
        <MotoristasTable
          drivers={filteredDrivers}
          onAdd={openNewModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
          isLoading={isLoading}
        />

        {/* Modal de Formulário */}
        <DriverFormModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={handleSuccess}
          driver={editingDriver}
        />
      </div>
    </div>
  );
};

export default Motoristas; 