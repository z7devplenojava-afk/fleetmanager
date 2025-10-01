'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Wrench, DollarSign, MapPin, Car, AlertTriangle, Image, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import maintenanceService from '@/services/maintenanceService';
import { Vehicle } from '@/types/fleet';
import { VehicleMaintenance } from '@/types/maintenance';

interface ManutencaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veiculos: Vehicle[];
  manutencao?: VehicleMaintenance; // Tipado corretamente para edição
}

const TIPOS_MANUTENCAO = [
  { value: 'PREVENTIVE', label: 'Preventiva' },
  { value: 'CORRECTIVE', label: 'Corretiva' },
  { value: 'PREDICTIVE', label: 'Preditiva' },
  { value: 'IMPROVEMENT', label: 'Melhoria' },
  { value: 'OTHER', label: 'Outro' }
];

const STATUS_MANUTENCAO = [
  { value: 'SCHEDULED', label: 'Agendada' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' }
];

const PRIORIDADES = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' }
];

const ManutencaoFormModal: React.FC<ManutencaoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  veiculos,
  manutencao
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    date: '',
    maintenanceType: '',
    description: '',
    cost: '',
    provider: '',
    mileage: '',
    status: 'SCHEDULED',
    priority: 'MEDIUM',
    notes: ''
  });

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]); // URLs de fotos existentes
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]); // URLs de documentos existentes
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]); // Fotos marcadas para remoção
  const [removedDocuments, setRemovedDocuments] = useState<string[]>([]); // Documentos marcados para remoção

  console.log('🔧 ManutencaoFormModal - Renderizando:', {
    isOpen,
    hasManutencao: !!manutencao,
    manutencaoId: manutencao?.id,
    manutencao: manutencao, // Adicionei o objeto manutencao completo aqui
    existingPhotos: existingPhotos, // Adicionei o estado de fotos existentes
    existingDocuments: existingDocuments, // Adicionei o estado de documentos existentes
    selectedFiles: selectedFiles // Adicionei o estado de arquivos selecionados
  });

  // Preencher formulário se for edição
  useEffect(() => {
    console.log('🔧 ManutencaoFormModal - useEffect:', {
      isOpen,
      manutencao,
      hasManutencao: !!manutencao
    });
    
    if (manutencao) {
      console.log('🔧 ManutencaoFormModal - Preenchendo formulário para edição:', manutencao);
      setFormData({
        vehicleId: manutencao.vehicleId || '',
        date: manutencao.date ? new Date(manutencao.date).toISOString().split('T')[0] : '',
        maintenanceType: manutencao.maintenanceType || '',
        description: manutencao.description || '',
        cost: manutencao.cost?.toString() || '',
        provider: manutencao.provider || '',
        mileage: manutencao.mileage ? manutencao.mileage.toString() : '',
        status: manutencao.status || 'SCHEDULED',
        priority: manutencao.priority || 'MEDIUM',
        notes: manutencao.notes || ''
      });
      console.log('🔍 ManutencaoFormModal - vehicleId após setFormData:', { 
        manutencaoVehicleId: manutencao.vehicleId, 
        formDataVehicleId: manutencao.vehicleId || '' 
      });
      setExistingPhotos(manutencao.photos || []);
      setExistingDocuments(manutencao.documents || []);
      setRemovedPhotos([]);
      setRemovedDocuments([]);
      setSelectedFiles(null);
    } else {
      const hoje = new Date().toISOString().split('T')[0];
      console.log('📅 Inicializando data:', {
        hoje: hoje,
        dataAtual: new Date(),
        dataFormatada: hoje
      });
      
      setFormData({
        vehicleId: '',
        date: hoje, // Data atual (hoje)
        maintenanceType: '',
        description: '',
        cost: '',
        provider: '',
        mileage: '',
        status: 'SCHEDULED',
        priority: 'MEDIUM',
        notes: ''
      });
      setExistingPhotos([]);
      setExistingDocuments([]);
      setRemovedPhotos([]);
      setRemovedDocuments([]);
      setSelectedFiles(null);
    }
  }, [manutencao, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    // Validação específica para campos numéricos
    if (field === 'mileage' && value !== '') {
      // Permitir apenas números e ponto decimal
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Garantir que há apenas um ponto decimal
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        return; // Não permitir múltiplos pontos
      }
      // Limitar casas decimais a 9
      if (parts[1] && parts[1].length > 9) {
        return;
      }
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    } else if (field === 'cost' && value !== '') {
      // Permitir apenas números e ponto decimal para custo
      const numericValue = value.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        return;
      }
      // Limitar casas decimais a 2 para custo
      if (parts[1] && parts[1].length > 2) {
        return;
      }
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.vehicleId) {
      toast({
        title: "Erro de validação",
        description: "Selecione um veículo",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.date) {
      toast({
        title: "Erro de validação",
        description: "Informe a data da manutenção",
        variant: "destructive"
      });
      return false;
    }
    
    // Validação de data apenas para novas manutenções (não para edição)
    if (!manutencao) {
      const selectedDate = new Date(formData.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Permitir hoje e datas futuras apenas para novas manutenções
      if (selectedDate < today) {
        toast({
          title: "Erro de validação",
          description: "A data da manutenção deve ser hoje ou uma data futura. Datas passadas não são permitidas.",
          variant: "destructive"
        });
        return false;
      }
      
      // Log para debug (agora dentro do bloco where selectedDate is defined)
      console.log('📅 Validação de data:', {
        dataSelecionada: formData.date,
        dataSelecionadaObj: selectedDate,
        hoje: today,
        ehHoje: selectedDate.getTime() === today.getTime(),
        ehFutura: selectedDate > today,
        permitida: selectedDate >= today,
        comparacao: selectedDate >= today
      });
    }
    
    if (!formData.maintenanceType) {
      toast({
        title: "Erro de validação",
        description: "Selecione o tipo de manutenção",
        variant: "destructive"
      });
      return false;
    }
    if (formData.cost && parseFloat(formData.cost) <= 0) {
      toast({
        title: "Erro de validação",
        description: "O custo deve ser maior que zero",
        variant: "destructive"
      });
      return false;
    }
    if (formData.mileage && (parseFloat(formData.mileage) < 0 || parseFloat(formData.mileage) > 999999.999999999)) {
      toast({
        title: "Erro de validação",
        description: "A quilometragem deve estar entre 0 e 999999.999999999",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.description.trim()) {
      toast({
        title: "Erro de validação",
        description: "Informe a descrição da manutenção",
        variant: "destructive"
      });
      return false;
    }
    if (formData.description.trim().length < 10) {
      toast({
        title: "Erro de validação",
        description: "A descrição deve ter pelo menos 10 caracteres",
        variant: "destructive"
      });
      return false;
    }
    if (formData.description.trim().length > 1000) {
      toast({
        title: "Erro de validação",
        description: "A descrição deve ter no máximo 1000 caracteres",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Preparar dados para a API
      const maintenanceData = {
        vehicleId: formData.vehicleId,
        date: formData.date,
        maintenanceType: formData.maintenanceType as 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE' | 'IMPROVEMENT' | 'OTHER',
        description: formData.description.trim(),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        provider: formData.provider || undefined,
        mileage: formData.mileage ? parseFloat(formData.mileage) : undefined,
        status: formData.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
        priority: formData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        notes: formData.notes || undefined,
        removedPhotos: removedPhotos, // Enviar fotos para remoção
        removedDocuments: removedDocuments // Enviar documentos para remoção
      };

      const filesToUpload = selectedFiles ? Array.from(selectedFiles) : [];
      
      if (manutencao) {
        // Atualizar manutenção existente
        await maintenanceService.updateMaintenance(manutencao.id, maintenanceData, filesToUpload);
        toast({
          title: "Manutenção atualizada",
          description: "A manutenção foi atualizada com sucesso!",
        });
      } else {
        // Criar nova manutenção
        await maintenanceService.createMaintenance(maintenanceData, filesToUpload);
        toast({
          title: "Manutenção criada",
          description: "A nova manutenção foi criada com sucesso!",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar manutenção:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Ocorreu um erro ao salvar a manutenção",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedVehicle = () => {
    return veiculos.find(v => v.id === formData.vehicleId);
  };

  const selectedVehicle = getSelectedVehicle();

  // Debug logs para veículos
  console.log('🔍 MODAL MANUTENÇÃO - Debug veículos:');
  console.log('  - veiculos (prop):', veiculos);
  console.log('  - veiculos.length:', veiculos?.length);
  console.log('  - veiculos é array?', Array.isArray(veiculos));
  console.log('  - Primeiro veículo:', veiculos?.[0]);
  console.log('  - formData.vehicleId:', formData.vehicleId);
  console.log('  - selectedVehicle:', selectedVehicle);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto bg-seguranca-graphite border-gray-600 mx-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Wrench className="h-5 w-5 text-seguranca-yellow" />
            {manutencao ? 'Editar Manutenção' : 'Nova Manutenção'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Veículo */}
          <div className="space-y-2">
            <Label htmlFor="vehicleId" className="text-seguranca-lightgray">
              Veículo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.vehicleId}
              onValueChange={(value) => handleInputChange('vehicleId', value)}
            >
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Selecione um veículo" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-black border-gray-600">
                {veiculos && veiculos.length > 0 ? (
                  veiculos.map((veiculo) => {
                    return (
                      <SelectItem key={veiculo.id} value={veiculo.id}>
                        {veiculo.plate} - {veiculo.brand} {veiculo.model} ({veiculo.year})
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="no-vehicles" disabled>
                    Nenhum veículo disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {selectedVehicle && (
              <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Marca:</span>
                    <span className="ml-2 text-seguranca-lightgray">{selectedVehicle.brand || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Modelo:</span>
                    <span className="ml-2 text-seguranca-lightgray">{selectedVehicle.model || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ano:</span>
                    <span className="ml-2 text-seguranca-lightgray">{selectedVehicle.year || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Quilometragem:</span>
                    <span className="ml-2 text-seguranca-lightgray">
                      {selectedVehicle.currentMileage ? `${Number(selectedVehicle.currentMileage).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-seguranca-lightgray">
                Data da Manutenção <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  min={new Date().toISOString().split('T')[0]} // Data mínima = hoje
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceType" className="text-seguranca-lightgray">
                Tipo de Manutenção <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.maintenanceType}
                onValueChange={(value) => handleInputChange('maintenanceType', value)}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  {TIPOS_MANUTENCAO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-seguranca-lightgray">
              Descrição <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva detalhadamente a manutenção a ser realizada..."
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray min-h-[80px]"
            />
          </div>

          {/* Custo e Fornecedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-seguranca-lightgray">
                Custo Estimado
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">R$</span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="0,00"
                  className="pl-8 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider" className="text-seguranca-lightgray">
                Fornecedor/Oficina
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => handleInputChange('provider', e.target.value)}
                  placeholder="Nome da oficina ou fornecedor"
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
          </div>

          {/* Quilometragem e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mileage" className="text-seguranca-lightgray">
                Quilometragem
              </Label>
              <Input
                id="mileage"
                type="number"
                step="0.001"
                min="0"
                max="999999.999999999"
                value={formData.mileage}
                onChange={(e) => handleInputChange('mileage', e.target.value)}
                placeholder="Ex: 132.000"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-seguranca-lightgray">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  {STATUS_MANUTENCAO.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-seguranca-lightgray">
              Prioridade
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange('priority', value)}
            >
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-black border-gray-600">
                {PRIORIDADES.map((prioridade) => (
                  <SelectItem key={prioridade.value} value={prioridade.value}>
                    {prioridade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-seguranca-lightgray">
              Observações Adicionais
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações, notas ou instruções especiais..."
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray min-h-[80px]"
            />
          </div>

          {/* Alertas e Validações */}
          {formData.priority === 'URGENT' && (
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Manutenção Urgente</span>
              </div>
              <p className="text-sm text-red-300 mt-1">
                Esta manutenção foi marcada como urgente. Considere agendar imediatamente.
              </p>
            </div>
          )}

          {/* Upload de Fotos/Documentos */}
          <div className="space-y-2">
            <Label htmlFor="photos" className="text-seguranca-lightgray">
              Fotos/Documentos da Manutenção
            </Label>
            
            {/* Exibição de Fotos Existentes */}
            {existingPhotos.length > 0 && (
              <div>
                <h4 className="text-seguranca-lightgray text-sm font-medium mb-2 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Fotos Atuais ({existingPhotos.length - removedPhotos.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {existingPhotos.map((photoUrl, index) => {
                    const isRemoved = removedPhotos.includes(photoUrl);
                    return (
                      <div key={index} className={`relative group ${isRemoved ? 'opacity-50 blur-[1px]' : ''}`}>
                        <div className="aspect-square bg-seguranca-black/30 rounded-lg border border-gray-600 overflow-hidden">
                          <img 
                            src={photoUrl.startsWith('http') ? photoUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}${photoUrl}`} 
                            alt={`Foto existente ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem:', photoUrl);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ Imagem carregada com sucesso:', photoUrl);
                            }}
                          />
                          {!isRemoved && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setRemovedPhotos(prev => [...prev, photoUrl])}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          {isRemoved && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setRemovedPhotos(prev => prev.filter(url => url !== photoUrl))}
                            >
                              <span className="text-white">↩</span>
                            </Button>
                          )}
                        </div>
                        {isRemoved && <p className="absolute inset-0 flex items-center justify-center text-red-400 font-bold text-sm">Remover</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Exibição de Documentos Existentes */}
            {existingDocuments.length > 0 && (
              <div>
                <h4 className="text-seguranca-lightgray text-sm font-medium mb-2 flex items-center gap-2 mt-4">
                  <FileText className="h-4 w-4" />
                  Documentos Atuais ({existingDocuments.length - removedDocuments.length})
                </h4>
                <div className="space-y-2">
                  {existingDocuments.map((docUrl, index) => {
                    const isRemoved = removedDocuments.includes(docUrl);
                    const fileName = docUrl.split('/').pop() || docUrl;
                    return (
                      <div key={index} className={`flex items-center gap-3 p-3 bg-seguranca-black/30 rounded-lg border border-gray-600 ${isRemoved ? 'opacity-50 blur-[1px]' : 'hover:border-gray-500 transition-colors'}`}>
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className={`text-seguranca-lightgray flex-1 break-all ${isRemoved ? 'line-through' : ''}`}>
                          {fileName}
                        </span>
                        {!isRemoved && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => setRemovedDocuments(prev => [...prev, docUrl])}
                          >
                            Remover
                          </Button>
                        )}
                        {isRemoved && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => setRemovedDocuments(prev => prev.filter(url => url !== docUrl))}
                          >
                            Desfazer
                          </Button>
                        )}
                        {!isRemoved && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500"
                            onClick={() => window.open(docUrl, '_blank')}
                          >
                            Abrir
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Input de Upload de Novos Arquivos */}
            <Input
              id="photos"
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  // Validação de quantidade de arquivos
                  if (files.length + (existingPhotos.length - removedPhotos.length) + (existingDocuments.length - removedDocuments.length) > 5) {
                    toast({
                      title: "Erro",
                      description: "Máximo de 5 arquivos (existente + novos) permitidos",
                      variant: "destructive"
                    });
                    // Limpar o input de arquivos se a validação falhar
                    e.target.value = ''; 
                    return;
                  }
                  // Validação de tamanho (máximo 10MB por arquivo)
                  const maxSize = 10 * 1024 * 1024; // 10MB
                  for (let i = 0; i < files.length; i++) {
                    if (files[i].size > maxSize) {
                      toast({
                        title: "Erro",
                        description: `Arquivo ${files[i].name} excede o tamanho máximo de 10MB`,
                        variant: "destructive"
                      });
                      e.target.value = '';
                      return;
                    }
                  }
                  setSelectedFiles(files);
                  console.log('📁 Arquivos selecionados:', files);
                }
              }}
              className="file:text-seguranca-lightgray file:bg-seguranca-graphite file:border file:border-gray-600 file:rounded file:px-3 file:py-1 file:hover:file:bg-seguranca-black file:hover:file:border-gray-500 transition-colors mt-4"
            />
            <p className="text-xs text-gray-400">
              Formatos aceitos: JPG, PNG, PDF, DOC, DOCX. Máximo 5 arquivos, 10MB cada. ({existingPhotos.length - removedPhotos.length} fotos e {existingDocuments.length - removedDocuments.length} documentos atuais)
            </p>
            
            {/* Indicador quando não há arquivos e não há existentes */}
            {(!selectedFiles || selectedFiles.length === 0) && existingPhotos.length === 0 && existingDocuments.length === 0 ? (
              <div className="mt-3 p-3 bg-seguranca-black/20 rounded-lg border border-dashed border-gray-600">
                <p className="text-sm text-gray-400 text-center">
                  Nenhum arquivo selecionado ou existente
                </p>
              </div>
            ) : null}
            
            {/* Lista de arquivos selecionados (novos) */}
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-seguranca-lightgray font-medium">Novos arquivos selecionados:</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFiles(null)}
                    className="h-6 px-2 text-xs border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                  >
                    Limpar Novos
                  </Button>
                </div>
                <div className="space-y-1">
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-seguranca-black/30 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">📎</span>
                        <span className="text-sm text-seguranca-lightgray">{file.name}</span>
                        <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const dt = new DataTransfer();
                          Array.from(selectedFiles).forEach((f, i) => {
                            if (i !== index) dt.items.add(f);
                          });
                          setSelectedFiles(dt.files);
                        }}
                        className="h-6 px-2 text-xs border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  {manutencao ? 'Atualizar' : 'Criar'} Manutenção
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManutencaoFormModal;
