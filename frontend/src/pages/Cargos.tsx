import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter, RefreshCw, Download, Search } from 'lucide-react';
import { positionService, Position, PositionDTO } from '@/services/positionService';
import { unitService, Unit } from '@/services/unitService';
import { useToast } from '@/hooks/use-toast';
import CargosTable from '@/components/cargos/CargosTable';
import CargoFormModal from '@/components/cargos/CargoFormModal';
import CargoDeleteDialog from '@/components/cargos/CargoDeleteDialog';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CargosPage: React.FC = () => {
  const { toast } = useToast();
  const [cargos, setCargos] = useState<Position[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [selectedCargo, setSelectedCargo] = useState<Position | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });

  const fetchCargos = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await positionService.getPositions();
      setCargos(data);
    } catch (error) {
      toast({
        title: 'Erro ao buscar cargos',
        description: 'Não foi possível carregar a lista de cargos. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchUnits = useCallback(async () => {
    try {
      const units = await unitService.getAllUnits();
      setUnits(units);
      console.log('Unidades carregadas:', units);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      toast({
        title: 'Erro ao carregar unidades',
        description: 'Não foi possível carregar a lista de unidades. Tente novamente.',
        variant: 'destructive',
      });
      // Fallback para dados mock em caso de erro
      setUnits([
        { id: '1', name: 'Matriz' },
        { id: '2', name: 'Filial Norte' },
        { id: '3', name: 'Filial Sul' }
      ]);
    }
  }, [toast]);

  useEffect(() => {
    fetchCargos();
    fetchUnits();
  }, [fetchCargos, fetchUnits]);

  const handleOpenFormModal = (cargo: Position | null) => {
    setSelectedCargo(cargo);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setSelectedCargo(null);
    setIsFormModalOpen(false);
  };

  const handleOpenDeleteDialog = (cargo: Position) => {
    setSelectedCargo(cargo);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedCargo(null);
    setIsDeleteDialogOpen(false);
  };

  const handleSaveCargo = async (data: PositionDTO) => {
    try {
      setIsSubmitting(true);
      if (selectedCargo) {
        await positionService.updatePosition(selectedCargo.id, data);
        toast({ title: 'Sucesso!', description: 'Cargo atualizado com sucesso.' });
      } else {
        await positionService.createPosition(data);
        toast({ title: 'Sucesso!', description: 'Cargo criado com sucesso.' });
      }
      handleCloseFormModal();
      fetchCargos();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o cargo. Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCargo) return;

    try {
      setIsSubmitting(true);
      await positionService.deletePosition(selectedCargo.id);
      toast({ title: 'Sucesso!', description: 'Cargo excluído com sucesso.' });
      handleCloseDeleteDialog();
      fetchCargos();
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o cargo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all'
    });
  };

  const handleRefresh = () => {
    fetchCargos();
    toast({
      title: "Atualizado",
      description: "Lista de cargos atualizada",
    });
  };

  return (
    <StandardLayout title="Gestão de Cargos">
      <Helmet>
        <title>Gestão de Cargos - Secure Guard</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Gestão de Cargos</h1>
            <p className="text-gray-400 mt-1">Administração de cargos, funções e posições da empresa</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={() => handleOpenFormModal(null)} className="bg-seguranca-red hover:bg-seguranca-darkred">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Cargo
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
            {/* Primeira linha - 2 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Busca</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome ou descrição..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Botões de ação dos filtros */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-600">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-600"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
              >
                <Filter className="mr-2 h-4 w-4" />
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
              <span>Resultados ({cargos?.length || 0} cargos)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CargosTable 
              cargos={cargos} 
              isLoading={isLoading} 
              onEdit={handleOpenFormModal} 
              onDelete={handleOpenDeleteDialog} 
              onRefresh={fetchCargos}
            />
          </CardContent>
        </Card>
      </div>

      <CargoFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveCargo}
        cargoInicial={selectedCargo}
        isLoading={isSubmitting}
        units={units}
      />

      <CargoDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        cargo={selectedCargo}
        isLoading={isSubmitting}
      />
    </StandardLayout>
  );
};

export default CargosPage;

