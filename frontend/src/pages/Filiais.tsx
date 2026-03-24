import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Building2, MapPin, Phone, Plus, Search, Edit, Trash2, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { unitService, Unit, CreateUnitRequest, UpdateUnitRequest, DeleteCheckResponse } from '@/services/unitService';

interface UnitFormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
}

const Filiais = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<DeleteCheckResponse | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [isCheckingDelete, setIsCheckingDelete] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UnitFormData>({
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: ''
    }
  });

  // Buscar unidades
  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ['units'],
    queryFn: unitService.getAllUnits,
  });

  // Tratamento de erro
  React.useEffect(() => {
    if (error) {
      console.error('Erro ao buscar unidades:', error);
      toast({
        title: 'Erro ao carregar filiais',
        description: 'Não foi possível carregar a lista de filiais. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Criar unidade
  const createUnitMutation = useMutation({
    mutationFn: unitService.createUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: "Sucesso",
        description: "Unidade criada com sucesso!",
      });
      setModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Erro ao criar unidade:', error);
      
      // Extrair mensagem específica do backend
      let errorMessage = "Erro ao criar unidade. Tente novamente.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = "Dados inválidos. Verifique os campos obrigatórios.";
      } else if (error.response?.status === 409) {
        errorMessage = "Unidade já existe com este nome ou email.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Atualizar unidade
  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUnitRequest }) => 
      unitService.updateUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: "Sucesso",
        description: "Unidade atualizada com sucesso!",
      });
      setModalOpen(false);
      setEditingUnit(null);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar unidade:', error);
      
      // Extrair mensagem específica do backend
      let errorMessage = "Erro ao atualizar unidade. Tente novamente.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = "Dados inválidos. Verifique os campos obrigatórios.";
      } else if (error.response?.status === 404) {
        errorMessage = "Unidade não encontrada.";
      } else if (error.response?.status === 409) {
        errorMessage = "Unidade já existe com este nome ou email.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Deletar unidade
  const deleteUnitMutation = useMutation({
    mutationFn: unitService.deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: "Sucesso",
        description: "Unidade deletada com sucesso!",
      });
      setDeleteCheck(null);
      setUnitToDelete(null);
      setIsCheckingDelete(false);
    },
    onError: (error: any) => {
      console.error('Erro ao deletar unidade:', error);
      
      // Verificar se é erro de dependências
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || "Não é possível excluir esta unidade devido a dependências.";
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao deletar unidade. Tente novamente.",
          variant: "destructive",
        });
      }
      setDeleteCheck(null);
      setUnitToDelete(null);
      setIsCheckingDelete(false);
    }
  });

  // Deletar unidade com dependências
  const deleteUnitWithDependenciesMutation = useMutation({
    mutationFn: unitService.deleteUnitWithDependencies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: "Sucesso",
        description: "Unidade e dependências deletadas com sucesso!",
      });
      setDeleteCheck(null);
      setUnitToDelete(null);
      setIsCheckingDelete(false);
    },
    onError: (error: any) => {
      console.error('Erro ao deletar unidade com dependências:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar unidade com dependências. Tente novamente.",
        variant: "destructive",
      });
      setDeleteCheck(null);
      setUnitToDelete(null);
      setIsCheckingDelete(false);
    }
  });

  // Verificar possibilidade de exclusão
  const checkDeleteMutation = useMutation({
    mutationFn: unitService.checkDeletePossibility,
    onSuccess: (data: DeleteCheckResponse) => {
      setDeleteCheck(data);
      setIsCheckingDelete(false);
      if (!data.canDelete) {
        toast({
          title: "Não é possível excluir",
          description: `A unidade "${data.unitName}" possui dependências que impedem a exclusão.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao verificar exclusão:', error);
      setIsCheckingDelete(false);
      toast({
        title: "Erro",
        description: "Erro ao verificar se a unidade pode ser excluída.",
        variant: "destructive",
      });
    }
  });

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onSubmit = (data: UnitFormData) => {
    // Verificar se o email já existe em outra unidade (apenas se não estiver editando)
    if (!editingUnit && data.email) {
      const emailExists = units.some(unit => 
        unit.email?.toLowerCase() === data.email.toLowerCase()
      );
      
      if (emailExists) {
        toast({
          title: "Email já existe",
          description: "Este email já está sendo usado por outra unidade.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Verificar se o email já existe em outra unidade (durante edição)
    if (editingUnit && data.email) {
      const emailExists = units.some(unit => 
        unit.id !== editingUnit.id && 
        unit.email?.toLowerCase() === data.email.toLowerCase()
      );
      
      if (emailExists) {
        toast({
          title: "Email já existe",
          description: "Este email já está sendo usado por outra unidade.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (editingUnit) {
      updateUnitMutation.mutate({ 
        id: editingUnit.id, 
        data: {
          name: data.name,
          description: data.description || undefined,
          address: data.address,
          phone: data.phone || undefined,
          email: data.email || undefined
        }
      });
    } else {
      createUnitMutation.mutate({
        name: data.name,
        description: data.description || undefined,
        address: data.address,
        phone: data.phone || undefined,
        email: data.email || undefined
      });
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    form.reset({
      name: unit.name,
      description: unit.description || '',
      address: unit.address,
      phone: unit.phone || '',
      email: unit.email || ''
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUnit(null);
    form.reset();
  };

  const handleDeleteClick = (unit: Unit) => {
    setUnitToDelete(unit);
    setIsCheckingDelete(true);
    checkDeleteMutation.mutate(unit.id);
  };

  const handleConfirmDelete = () => {
    if (unitToDelete && deleteCheck?.canDelete) {
      deleteUnitMutation.mutate(unitToDelete.id);
    }
  };

  const handleConfirmDeleteWithDependencies = () => {
    if (unitToDelete) {
      deleteUnitWithDependenciesMutation.mutate(unitToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteCheck(null);
    setUnitToDelete(null);
    setIsCheckingDelete(false);
  };

  if (isLoading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-seguranca-lightgray">Carregando unidades...</div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Unidades</h1>
            <p className="text-gray-400 mt-1">Gerencie as unidades da empresa</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Pesquisar unidades..."
                className="pl-10 w-64 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-seguranca-red hover:bg-seguranca-darkred">
                  <Plus size={18} className="mr-1" /> Adicionar Unidade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-seguranca-graphite border-gray-600">
                <DialogHeader>
                  <DialogTitle className="text-seguranca-lightgray">
                    {editingUnit ? 'Editar Unidade' : 'Adicionar Nova Unidade'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {editingUnit ? 'Edite as informações da unidade abaixo.' : 'Preencha as informações para criar uma nova unidade.'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      rules={{ required: "Nome é obrigatório" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-seguranca-lightgray">Nome da Unidade</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nome da unidade" 
                              {...field} 
                              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-seguranca-lightgray">Descrição</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Descrição da unidade" 
                              {...field} 
                              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      rules={{ required: "Endereço é obrigatório" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-seguranca-lightgray">Endereço</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Endereço completo" 
                              {...field} 
                              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-seguranca-lightgray">Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(XX) XXXX-XXXX" 
                                {...field} 
                                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-seguranca-lightgray">Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Email" 
                                type="email" 
                                {...field} 
                                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCloseModal}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-seguranca-red hover:bg-seguranca-darkred"
                        disabled={createUnitMutation.isPending || updateUnitMutation.isPending}
                      >
                        {editingUnit ? 'Atualizar' : 'Salvar'} Unidade
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map(unit => (
            <Card key={unit.id} className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="bg-seguranca-black/50">
                <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                  <Building2 size={20} /> {unit.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {unit.description && (
                  <p className="text-sm text-gray-400 mb-3">{unit.description}</p>
                )}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin size={18} className="min-w-[18px] mt-1 text-gray-400" />
                  <p className="text-sm text-seguranca-lightgray">{unit.address}</p>
                </div>
                {unit.phone && (
                  <div className="flex items-center gap-2 mb-3">
                    <Phone size={18} className="text-gray-400" />
                    <p className="text-sm text-seguranca-lightgray">{unit.phone}</p>
                  </div>
                )}
                {unit.email && (
                  <div className="flex items-center gap-2 mb-4">
                    <Mail size={18} className="text-gray-400" />
                    <p className="text-sm text-seguranca-lightgray">{unit.email}</p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-600">
                  <div>
                    <p className="text-xs text-gray-400">Criada em</p>
                    <p className="text-sm text-seguranca-lightgray">
                      {new Date(unit.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                      onClick={() => handleEdit(unit)}
                    >
                      <Edit size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-600 text-red-400 hover:bg-red-900/20"
                          onClick={() => handleDeleteClick(unit)}
                          disabled={isCheckingDelete}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-seguranca-lightgray">
                            {isCheckingDelete ? 'Verificando...' : 
                             deleteCheck && !deleteCheck.canDelete ? 'Não é possível excluir' : 'Confirmar exclusão'}
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="text-gray-400">
                              {isCheckingDelete ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-seguranca-red"></div>
                                  Verificando dependências...
                                </div>
                              ) : deleteCheck && !deleteCheck.canDelete ? (
                                <div className="space-y-2">
                                  <p>A unidade "{unit.name}" não pode ser excluída devido às seguintes dependências:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    {deleteCheck.dependencies?.employees && deleteCheck.dependencies.employees > 0 && (
                                      <li>{deleteCheck.dependencies.employees} funcionário(s)</li>
                                    )}
                                    {deleteCheck.dependencies?.positions && deleteCheck.dependencies.positions > 0 && (
                                      <li>{deleteCheck.dependencies.positions} cargo(s)</li>
                                    )}
                                    {deleteCheck.dependencies?.payrolls && deleteCheck.dependencies.payrolls > 0 && (
                                      <li>{deleteCheck.dependencies.payrolls} folha(s) de pagamento</li>
                                    )}
                                    {deleteCheck.dependencies?.locations && deleteCheck.dependencies.locations > 0 && (
                                      <li>{deleteCheck.dependencies.locations} localização(ões)</li>
                                    )}
                                    {deleteCheck.dependencies?.children && deleteCheck.dependencies.children > 0 && (
                                      <li>{deleteCheck.dependencies.children} subunidade(s)</li>
                                    )}
                                  </ul>
                                  <p className="text-yellow-400 mt-2">
                                    Remova essas dependências antes de tentar excluir a unidade.
                                  </p>
                                  <p className="text-orange-400 mt-2 text-sm">
                                    ⚠️ <strong>Atenção:</strong> Você pode excluir a unidade junto com suas dependências, 
                                    mas isso irá remover permanentemente todos os dados relacionados.
                                  </p>
                                </div>
                              ) : (
                                <span>Tem certeza que deseja excluir a unidade "{unit.name}"? Esta ação não pode ser desfeita.</span>
                              )}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel 
                            onClick={handleCancelDelete}
                            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                            disabled={isCheckingDelete}
                          >
                            {isCheckingDelete ? 'Aguarde...' : 
                             deleteCheck && !deleteCheck.canDelete ? 'Cancelar' : 'Cancelar'}
                          </AlertDialogCancel>
                          {!isCheckingDelete && deleteCheck?.canDelete && (
                            <AlertDialogAction 
                              onClick={handleConfirmDelete}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteUnitMutation.isPending}
                            >
                              {deleteUnitMutation.isPending ? 'Excluindo...' : 'Excluir'}
                            </AlertDialogAction>
                          )}
                          {!isCheckingDelete && deleteCheck && !deleteCheck.canDelete && (
                            <AlertDialogAction 
                              onClick={handleConfirmDeleteWithDependencies}
                              className="bg-orange-600 hover:bg-orange-700"
                              disabled={deleteUnitWithDependenciesMutation.isPending}
                            >
                              {deleteUnitWithDependenciesMutation.isPending ? 'Excluindo...' : 'Excluir com Dependências'}
                            </AlertDialogAction>
                          )}
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUnits.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              {searchTerm ? 'Nenhuma unidade encontrada' : 'Nenhuma unidade cadastrada'}
            </h3>
            <p className="text-gray-400">
              {searchTerm 
                ? 'Tente ajustar os filtros de pesquisa.' 
                : 'Comece adicionando a primeira unidade da empresa.'
              }
            </p>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default Filiais;
