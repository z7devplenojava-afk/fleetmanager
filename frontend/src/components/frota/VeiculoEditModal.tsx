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
import { Vehicle } from '@/types/fleet';
import { workPostService, WorkPost } from '@/services/workPostService';
import { costCenterService, CostCenterDTO } from '@/services/costCenterService';
import { employeeService } from '@/services/employeeService';

// Definindo o tipo VeiculoComponent localmente para evitar import circular
interface VeiculoComponent {
  id: string; // UUID
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  combustivel: string;
  quilometragem?: number;
  quilometragemInicial?: number;
  status: string;
  capacidade?: number; // Adicionado campo capacidade
  data_aquisicao?: string;
  valor_aquisicao?: number;
  photos?: string; // URLs das fotos separadas por vírgula
  observacoes?: string; // Adicionado campo observações
}

interface VeiculoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veiculo: VeiculoComponent | null; // Mudando de Vehicle para VeiculoComponent
}

const VeiculoEditModal: React.FC<VeiculoEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  veiculo 
}) => {
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
  
  // Estados para gerenciar fotos
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<Set<string>>(new Set());
  
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

  // Preencher formulário quando o veículo for selecionado
  useEffect(() => {
    if (veiculo) {
      console.log('🚗 Veículo recebido para edição:', veiculo);
      console.log('🔍 DETALHES COMPLETOS DO VEÍCULO:');
      console.log('  - ID:', veiculo.id);
      console.log('  - Placa:', veiculo.placa);
      console.log('  - Marca:', veiculo.marca);
      console.log('  - Modelo:', veiculo.modelo);
      console.log('  - Ano:', veiculo.ano);
      console.log('  - Cor:', veiculo.cor);
      console.log('  - Status:', veiculo.status);
      console.log('  - Combustível:', veiculo.combustivel);
      console.log('  - Capacidade:', veiculo.capacidade);
      console.log('  - Quilometragem:', veiculo.quilometragem);
      console.log('  - Quilometragem Inicial:', veiculo.quilometragemInicial);
      console.log('  - Data Aquisição:', veiculo.data_aquisicao);
      console.log('  - Valor Aquisição:', veiculo.valor_aquisicao);
      
      // Buscar data da última manutenção da tabela de manutenções
      const fetchLastMaintenanceDate = async () => {
        try {
          const lastMaintenanceDate = await fleetService.getLastMaintenanceDate(veiculo.id);
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
      
      fetchLastMaintenanceDate();
      
      // Preencher formulário com dados do veículo
      const formDataToSet = {
        placa: veiculo.placa || '',
        marca: veiculo.marca || '',
        modelo: veiculo.modelo || '',
        ano: veiculo.ano || new Date().getFullYear(),
        cor: veiculo.cor || '',
        combustivel: veiculo.combustivel?.toUpperCase() || 'FLEX',
        quilometragem: veiculo.quilometragem || 0,
        status: veiculo.status?.toUpperCase() || 'ACTIVE',
        capacidade: veiculo.capacidade || 5,
        postoDeTrabalho: '', // Campo não existe no VeiculoComponent
        departamento: '', // Campo não existe no VeiculoComponent
        dataManutencao: '', // Será preenchido pela função fetchLastMaintenanceDate
        proximaManutencao: '', // Campo não existe no VeiculoComponent
        vencimentoSeguro: '', // Campo não existe no VeiculoComponent
        vencimentoDocumentacao: '', // Campo não existe no VeiculoComponent
        data_aquisicao: veiculo.data_aquisicao || '',
        valor_aquisicao: veiculo.valor_aquisicao || 0,
        observacoes: veiculo.observacoes || '', // Corrigido: usar o valor do veículo
        responsavel: '', // Campo não existe no VeiculoComponent
        fotos: null
      };
      
      console.log('📝 DADOS DO FORMULÁRIO A SEREM DEFINIDOS:');
      console.log('  - placa:', formDataToSet.placa);
      console.log('  - marca:', formDataToSet.marca);
      console.log('  - modelo:', formDataToSet.modelo);
      console.log('  - ano:', formDataToSet.ano);
      console.log('  - cor:', formDataToSet.cor);
      console.log('  - combustivel:', formDataToSet.combustivel);
      console.log('  - quilometragem:', formDataToSet.quilometragem);
      console.log('  - status:', formDataToSet.status);
      console.log('  - capacidade:', formDataToSet.capacidade);
      console.log('  - departamento:', formDataToSet.departamento);
      console.log('  - responsavel:', formDataToSet.responsavel);
      
      setFormData(formDataToSet);
      
      // Carregar fotos existentes
      if (veiculo.photos && veiculo.photos.trim() !== '') {
        const photosArray = veiculo.photos.split(',').map(photo => photo.trim()).filter(photo => photo);
        setExistingPhotos(photosArray);
        console.log('📸 Fotos existentes carregadas:', photosArray);
      } else {
        setExistingPhotos([]);
        console.log('📸 Nenhuma foto existente encontrada');
      }
      
      // Limpar fotos marcadas para exclusão
      setPhotosToDelete(new Set());
      
      console.log('📝 Formulário preenchido com dados do veículo:', formData);
    }
  }, [veiculo]);

  // Funções para gerenciar fotos
  const handleDeleteExistingPhoto = (photoName: string) => {
    setPhotosToDelete(prev => {
      const newSet = new Set(prev);
      newSet.add(photoName);
      return newSet;
    });
    console.log('🗑️ Foto marcada para exclusão:', photoName);
  };

  const handleRestorePhoto = (photoName: string) => {
    setPhotosToDelete(prev => {
      const newSet = new Set(prev);
      newSet.delete(photoName);
      return newSet;
    });
    console.log('🔄 Foto restaurada:', photoName);
  };

  // Mutation para atualizar veículo
  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, vehicleData }: { id: string; vehicleData: any }) => 
      fleetService.updateVehicle(id, vehicleData),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo atualizado com sucesso!"
      });

      // Invalidar e refetch da query de veículos
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      
      // Chamar callback de sucesso
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar veículo:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar veículo. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!veiculo) return;
    
    setIsLoading(true);

    try {
      // Mapear dados do formulário para o formato da API
      const vehicleData = {
        plate: formData.placa.toUpperCase(),
        brand: formData.marca,
        model: formData.modelo,
        year: Number(formData.ano),
        color: formData.cor || '',
        fuelType: formData.combustivel.toUpperCase() as 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX',
        currentMileage: Number(formData.quilometragem) || 0,
        status: (() => {
          const statusLower = formData.status.toLowerCase();
          if (statusLower === 'ativo') return 'ACTIVE';
          if (statusLower === 'inativo') return 'INACTIVE';
          if (statusLower === 'manutencao') return 'MAINTENANCE';
          return 'ACTIVE'; // fallback
        })(),
        capacity: Number(formData.capacidade) || 5,
        department: formData.departamento || undefined,
        lastMaintenanceDate: formData.dataManutencao ? new Date(formData.dataManutencao).toISOString().split('T')[0] : undefined,
        nextMaintenanceDate: formData.proximaManutencao ? new Date(formData.proximaManutencao).toISOString().split('T')[0] : undefined,
        insuranceExpiryDate: formData.vencimentoSeguro ? new Date(formData.vencimentoSeguro).toISOString().split('T')[0] : undefined,
        documentationExpiryDate: formData.vencimentoDocumentacao ? new Date(formData.vencimentoDocumentacao).toISOString().split('T')[0] : undefined,
        acquisitionDate: formData.data_aquisicao ? new Date(formData.data_aquisicao).toISOString().split('T')[0] : undefined,
        acquisitionValue: formData.valor_aquisicao > 0 ? formData.valor_aquisicao : undefined,
        notes: formData.observacoes || undefined,
        responsibleEmployeeId: formData.responsavel && formData.responsavel.trim() !== '' ? formData.responsavel : undefined,
        photos: (() => {
          // Processar fotos existentes (removendo as marcadas para exclusão)
          const remainingPhotos = existingPhotos.filter(photo => !photosToDelete.has(photo));
          
          // Adicionar novas fotos
          const newPhotos = formData.fotos ? Array.from(formData.fotos).map(file => file.name) : [];
          
          // Combinar fotos restantes com novas fotos
          const allPhotos = [...remainingPhotos, ...newPhotos];
          
          console.log('📸 Fotos processadas:', {
            existingPhotos,
            photosToDelete: Array.from(photosToDelete),
            remainingPhotos,
            newPhotos,
            allPhotos
          });
          
          return allPhotos.length > 0 ? allPhotos.join(',') : undefined;
        })()
      };

      // Filtrar campos undefined/null/empty string antes de enviar
      const filteredVehicleData = Object.fromEntries(
        Object.entries(vehicleData).filter(([_, value]) => {
          if (value === undefined || value === null) return false;
          if (typeof value === 'string' && value.trim() === '') return false;
          if (typeof value === 'number' && isNaN(value)) return false;
          return true;
        })
      );

      console.log('🔍 VeiculoEditModal - Dados originais:', vehicleData);
      console.log('🔍 VeiculoEditModal - Dados filtrados:', filteredVehicleData);
      console.log('🔍 VeiculoEditModal - ID do veículo:', veiculo.id);
      console.log('🔍 VeiculoEditModal - Status mapeado:', vehicleData.status);
      console.log('🔍 VeiculoEditModal - Datas formatadas:', {
        lastMaintenanceDate: vehicleData.lastMaintenanceDate,
        nextMaintenanceDate: vehicleData.nextMaintenanceDate,
        insuranceExpiryDate: vehicleData.insuranceExpiryDate,
        documentationExpiryDate: vehicleData.documentationExpiryDate,
        acquisitionDate: vehicleData.acquisitionDate
      });
      console.log('🔍 VeiculoEditModal - Photos processado:', vehicleData.photos);

      // Verificar token
      const token = localStorage.getItem('token');
      console.log('🔍 VeiculoEditModal - Token disponível:', !!token);
      console.log('🔍 VeiculoEditModal - Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');

      updateVehicleMutation.mutate({ id: veiculo.id, vehicleData: filteredVehicleData });
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

  if (!veiculo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Car className="h-5 w-5 text-seguranca-yellow" />
            Editar Veículo - {veiculo.placa}
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

          {/* Gerenciamento de Fotos */}
          <div className="space-y-4">
            <Label className="text-seguranca-lightgray">Fotos do Veículo</Label>
            
            {/* Fotos Existentes */}
            {existingPhotos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-seguranca-lightgray">Fotos Existentes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {existingPhotos.map((photoName, index) => (
                    <div key={index} className="relative group">
                      <div className={`w-full h-32 bg-seguranca-graphite border-2 rounded-lg flex items-center justify-center transition-all ${
                        photosToDelete.has(photoName) 
                          ? 'border-red-500 bg-red-900/20' 
                          : 'border-gray-600 hover:border-seguranca-yellow'
                      }`}>
                        <div className="text-center">
                          <div className="text-2xl mb-1">📷</div>
                          <p className="text-xs text-seguranca-lightgray font-medium truncate px-2">
                            {photoName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {photosToDelete.has(photoName) ? 'Marcada para exclusão' : 'Clique para excluir'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Botão de ação */}
                      <div className="absolute top-2 right-2">
                        {photosToDelete.has(photoName) ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestorePhoto(photoName)}
                            className="h-6 w-6 p-0 bg-green-600 border-green-600 text-white hover:bg-green-700"
                            title="Restaurar foto"
                          >
                            ↺
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExistingPhoto(photoName)}
                            className="h-6 w-6 p-0 bg-red-600 border-red-600 text-white hover:bg-red-700"
                            title="Excluir foto"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Resumo das ações */}
                {photosToDelete.size > 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                    <p className="text-sm text-yellow-400">
                      ⚠️ {photosToDelete.size} foto(s) marcada(s) para exclusão. 
                      Clique em "Restaurar" para cancelar a exclusão.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Upload de Novas Fotos */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-seguranca-lightgray">Adicionar Novas Fotos</h4>
              <Input
                id="fotos"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleInputChange('fotos', e.target.files)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-seguranca-red file:text-white hover:file:bg-seguranca-darkred"
              />
              <p className="text-sm text-gray-400">
                Aceita múltiplas imagens (JPG, PNG, GIF). As fotos existentes marcadas para exclusão serão removidas.
              </p>
            </div>
            
            {/* Indicador quando não há fotos */}
            {existingPhotos.length === 0 && !formData.fotos && (
              <div className="text-center py-6 border-2 border-dashed border-gray-600 rounded-lg">
                <div className="text-2xl mb-2">📷</div>
                <p className="text-gray-400">Nenhuma foto cadastrada</p>
                <p className="text-sm text-gray-500">Adicione fotos usando o campo acima</p>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || updateVehicleMutation.isPending}
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || updateVehicleMutation.isPending}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {isLoading || updateVehicleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Car className="mr-2 h-4 w-4" />
                  Atualizar Veículo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VeiculoEditModal; 