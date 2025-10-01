import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Car, Calendar, DollarSign, MapPin, Wrench, FileText, TrendingUp, Settings, Building, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import fleetService from '@/services/fleetService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { costCenterService, CostCenterDTO } from '@/services/costCenterService';
import { employeeService } from '@/services/employeeService';

interface VeiculoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const VeiculoFormModal: React.FC<VeiculoFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    ano: new Date().getFullYear(),
    cor: '',
    combustivel: 'FLEX',
    quilometragem: 0,
    status: 'ACTIVE',
    capacidade: 5,
    postoDeTrabalho: '',
    departamento: '',
    dataManutencao: '',
    proximaManutencao: '',
    vencimentoSeguro: '',
    vencimentoDocumentacao: '',
    data_aquisicao: '',
    valor_aquisicao: 0,
    observacoes: '',
    responsavel: '',
    fotos: null as FileList | null
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar postos de trabalho
  const { data: workPosts, isLoading: workPostsLoading, error: workPostsError } = useQuery({
    queryKey: ['workPosts'],
    queryFn: () => workPostService.getWorkPosts(),
    retry: 2,
    retryDelay: 1000
  });

  // Buscar centros de custo ativos
  const { data: costCenters, isLoading: costCentersLoading, error: costCentersError } = useQuery({
    queryKey: ['costCenters'],
    queryFn: () => costCenterService.listActive(),
    retry: 2,
    retryDelay: 1000
  });

  // Buscar funcionários ativos
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployeesByStatus('ACTIVE'),
    retry: 2,
    retryDelay: 1000
  });

  // Debug para postos de trabalho
  console.log('🔍 POSTOS DE TRABALHO - Debug:', {
    workPosts,
    workPostsLoading,
    workPostsError,
    workPostsLength: workPosts?.length
  });

  // Debug para centros de custo
  console.log('🔍 CENTROS DE CUSTO - Debug:', {
    costCenters,
    costCentersLoading,
    costCentersError,
    costCentersLength: costCenters?.length
  });

  // Debug para funcionários
  console.log('🔍 FUNCIONÁRIOS - Debug:', {
    employees,
    employeesLoading,
    employeesError,
    employeesLength: employees?.length
  });

  // Limpar formulário quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        placa: '',
        marca: '',
        modelo: '',
        ano: new Date().getFullYear(),
        cor: '',
        combustivel: 'FLEX',
        quilometragem: 0,
        status: 'ACTIVE',
        capacidade: 5,
        postoDeTrabalho: '',
        departamento: '',
        dataManutencao: '',
        proximaManutencao: '',
        vencimentoSeguro: '',
        vencimentoDocumentacao: '',
        data_aquisicao: '',
        valor_aquisicao: 0,
        observacoes: '',
        responsavel: '',
        fotos: null
      });
    }
  }, [isOpen]);

  // Função para buscar data da última manutenção quando um veículo existente for selecionado
  const fetchLastMaintenanceDate = async (vehicleId: string) => {
    try {
      const lastMaintenanceDate = await fleetService.getLastMaintenanceDate(vehicleId);
      if (lastMaintenanceDate) {
        console.log('🔧 Data da última manutenção encontrada:', lastMaintenanceDate);
        
        // Tratar tanto array quanto string
        let formattedDate = '';
        if (Array.isArray(lastMaintenanceDate)) {
          // Se for array [year, month, day], converter para string ISO
          const [year, month, day] = lastMaintenanceDate;
          formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          console.log('🔧 Data convertida de array para string:', formattedDate);
        } else if (typeof lastMaintenanceDate === 'string') {
          // Se for string, usar diretamente
          formattedDate = lastMaintenanceDate.split('T')[0];
          console.log('🔧 Data já é string, formatada:', formattedDate);
        } else {
          console.warn('⚠️ Formato de data desconhecido:', typeof lastMaintenanceDate, lastMaintenanceDate);
        }
        
        if (formattedDate) {
          setFormData(prev => ({
            ...prev,
            dataManutencao: formattedDate
          }));
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar data da última manutenção:', error);
    }
  };

  // Mutation para criar veículo
  const createVehicleMutation = useMutation({
    mutationFn: (vehicleData: any) => fleetService.createVehicle(vehicleData),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo cadastrado com sucesso!"
      });

      // Limpar formulário
      setFormData({
        placa: '',
        marca: '',
        modelo: '',
        ano: new Date().getFullYear(),
        cor: '',
        combustivel: 'FLEX',
        quilometragem: 0,
        status: 'ACTIVE',
        capacidade: 5,
        postoDeTrabalho: '',
        departamento: '',
        dataManutencao: '',
        proximaManutencao: '',
        vencimentoSeguro: '',
        vencimentoDocumentacao: '',
        data_aquisicao: '',
        valor_aquisicao: 0,
        observacoes: '',
        responsavel: '',
        fotos: null
      });

      // Invalidar e refetch da query de veículos
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.removeQueries({ queryKey: ['vehicles'] });
      
      // Chamar callback de sucesso
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar veículo:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      let errorMessage = "Erro ao cadastrar veículo. Tente novamente.";
      
      if (error.response?.status === 400) {
        errorMessage = "Esta placa já está cadastrada no sistema!";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes('duplicate')) {
        errorMessage = "Esta placa já está cadastrada!";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mapear dados do formulário para o formato da API
      const vehicleData = {
        plate: formData.placa.toUpperCase(),
        brand: formData.marca,
        model: formData.modelo,
        year: Number(formData.ano),
        color: formData.cor,
        fuelType: formData.combustivel.toUpperCase() as 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX',
        currentMileage: Number(formData.quilometragem),
        status: formData.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE',
        capacity: Number(formData.capacidade),
        workPostId: formData.postoDeTrabalho || undefined,
        department: formData.departamento || undefined,
        lastMaintenanceDate: formData.dataManutencao || undefined,
        nextMaintenanceDate: formData.proximaManutencao || undefined,
        insuranceExpiryDate: formData.vencimentoSeguro || undefined,
        documentationExpiryDate: formData.vencimentoDocumentacao || undefined,
        acquisitionDate: formData.data_aquisicao || undefined,
        acquisitionValue: formData.valor_aquisicao || undefined,
        notes: formData.observacoes || undefined,
        responsibleEmployeeId: formData.responsavel || undefined,
        photos: formData.fotos || undefined // Adicionado campo de fotos
      };

      createVehicleMutation.mutate(vehicleData);
    } catch (error: any) {
      console.error('Erro ao preparar dados do veículo:', error);
      toast({
        title: "Erro",
        description: "Erro ao preparar dados do veículo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Car className="h-5 w-5 text-seguranca-yellow" />
            Cadastrar Novo Veículo
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="placa">Placa *</Label>
              <Input
                id="placa"
                value={formData.placa}
                onChange={(e) => handleInputChange('placa', e.target.value)}
                placeholder="ABC-1234"
                maxLength={8}
                required
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => handleInputChange('marca', e.target.value)}
                required
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quilometragem">Quilometragem</Label>
              <Input
                id="quilometragem"
                type="number"
                step="0.000001"
                value={formData.quilometragem}
                onChange={(e) => handleInputChange('quilometragem', e.target.value)}
                min="0"
                max="999999.999999"
                placeholder="Ex: 120.236"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => handleInputChange('modelo', e.target.value)}
                required
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                value={formData.ano}
                onChange={(e) => handleInputChange('ano', e.target.value)}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                value={formData.cor}
                onChange={(e) => handleInputChange('cor', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="capacidade">Capacidade *</Label>
              <Input
                id="capacidade"
                type="number"
                value={formData.capacidade}
                onChange={(e) => handleInputChange('capacidade', e.target.value)}
                min="1"
                max="20"
                required
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                  <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="combustivel">Combustível *</Label>
              <Select value={formData.combustivel} onValueChange={(value) => handleInputChange('combustivel', value)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="GASOLINE">Gasolina</SelectItem>
                  <SelectItem value="ETHANOL">Etanol</SelectItem>
                  <SelectItem value="FLEX">Flex</SelectItem>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="postoDeTrabalho">Posto de Trabalho</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Select
                  value={formData.postoDeTrabalho}
                  onValueChange={(value) => handleInputChange('postoDeTrabalho', value)}
                  disabled={workPostsLoading || !!workPostsError || !workPosts || workPosts.length === 0}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray pl-10">
                    <SelectValue placeholder="Selecione um posto de trabalho" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {workPostsLoading ? (
                      <SelectItem value="loading" disabled>Carregando postos...</SelectItem>
                    ) : workPostsError ? (
                      <SelectItem value="error" disabled>Erro ao carregar postos</SelectItem>
                    ) : workPosts && workPosts.length > 0 ? (
                      workPosts.map((workPost: WorkPost) => (
                        <SelectItem key={workPost.id} value={workPost.id}>
                          {workPost.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>Nenhum posto encontrado.</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <div className="relative">
                <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Select
                  value={formData.departamento}
                  onValueChange={(value) => handleInputChange('departamento', value)}
                  disabled={costCentersLoading || !!costCentersError || !costCenters || costCenters.length === 0}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray pl-10">
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {costCentersLoading ? (
                      <SelectItem value="loading" disabled>Carregando departamentos...</SelectItem>
                    ) : costCentersError ? (
                      <SelectItem value="error" disabled>Erro ao carregar departamentos</SelectItem>
                    ) : costCenters && costCenters.length > 0 ? (
                      costCenters.map((costCenter: CostCenterDTO) => (
                        <SelectItem key={costCenter.id} value={costCenter.id}>
                          {costCenter.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>Nenhum departamento encontrado.</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="responsavel">Responsável <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Select
                  value={formData.responsavel}
                  onValueChange={(value) => handleInputChange('responsavel', value)}
                  disabled={employeesLoading || !!employeesError || !employees || employees.length === 0}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray pl-10">
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {employeesLoading ? (
                      <SelectItem value="loading" disabled>Carregando responsáveis...</SelectItem>
                    ) : employeesError ? (
                      <SelectItem value="error" disabled>Erro ao carregar responsáveis</SelectItem>
                    ) : employees && employees.length > 0 ? (
                      employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>Nenhum responsável encontrado.</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informações de Aquisição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_aquisicao" className="text-seguranca-lightgray">
                Data de Aquisição
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="data_aquisicao"
                  type="date"
                  value={formData.data_aquisicao}
                  onChange={(e) => handleInputChange('data_aquisicao', e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_aquisicao" className="text-seguranca-lightgray">
                Valor de Aquisição
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">R$</span>
                <Input
                  id="valor_aquisicao"
                  type="number"
                  step="0.01"
                  value={formData.valor_aquisicao}
                  onChange={(e) => handleInputChange('valor_aquisicao', e.target.value)}
                  min="0"
                  placeholder="0,00"
                  className="pl-8 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
          </div>

          {/* Datas de Manutenção */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataManutencao" className="text-seguranca-lightgray">
                Data da Última Manutenção (Automática)
              </Label>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="dataManutencao"
                  type="date"
                  value={formData.dataManutencao}
                  onChange={(e) => handleInputChange('dataManutencao', e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  placeholder="Será preenchida automaticamente"
                  readOnly
                />
                <p className="text-xs text-gray-400 mt-1">
                  Buscada automaticamente da tabela de manutenções
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proximaManutencao" className="text-seguranca-lightgray">
                Próxima Manutenção
              </Label>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="proximaManutencao"
                  type="date"
                  value={formData.proximaManutencao}
                  onChange={(e) => handleInputChange('proximaManutencao', e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
          </div>

          {/* Datas de Vencimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vencimentoSeguro" className="text-seguranca-lightgray">
                Vencimento do Seguro
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="vencimentoSeguro"
                  type="date"
                  value={formData.vencimentoSeguro}
                  onChange={(e) => handleInputChange('vencimentoSeguro', e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vencimentoDocumentacao" className="text-seguranca-lightgray">
                Vencimento da Documentação
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="vencimentoDocumentacao"
                  type="date"
                  value={formData.vencimentoDocumentacao}
                  onChange={(e) => handleInputChange('vencimentoDocumentacao', e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={3}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>

          {/* Upload de Fotos */}
          <div className="mb-6">
            <Label htmlFor="fotos">Fotos do Veículo (Opcional)</Label>
            <div className="mt-2">
              <Input
                id="fotos"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleInputChange('fotos', e.target.files)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-seguranca-red file:text-white hover:file:bg-seguranca-darkred"
              />
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Aceita múltiplas imagens (JPG, PNG, GIF)
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || createVehicleMutation.isPending}
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || createVehicleMutation.isPending}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {isLoading || createVehicleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Car className="mr-2 h-4 w-4" />
                  Salvar Veículo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VeiculoFormModal;
