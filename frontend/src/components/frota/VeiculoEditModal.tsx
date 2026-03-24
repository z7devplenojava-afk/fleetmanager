import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import fleetService from '@/services/fleetService';
import { VehicleForm } from './forms/VehicleForm';
import { VehicleFormData } from './forms/types';
import { parseDateFromBackend } from '@/utils/dateUtils';

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
  // Campos adicionais para edição
  workPostId?: string;
  companyId?: string;
  departmentId?: string;
  department?: string;
  responsibleEmployeeId?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  insuranceExpiryDate?: string;
  documentationExpiryDate?: string;
}

interface VeiculoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veiculo: any | null; // Usando any para facilitar compatibilidade, mas idealmente seria o tipo correto
}

const VeiculoEditModal: React.FC<VeiculoEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  veiculo
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Função para converter string de data ou Date para Date ou null
  const toDate = (dateVal: string | Date | undefined | null): Date | null => {
    if (!dateVal) return null;
    if (typeof dateVal === 'string') {
      // Tenta parsear datas do backend
      if (dateVal.includes('T')) return new Date(dateVal);
      return new Date(dateVal + 'T12:00:00'); // Adiciona hora para evitar problemas de fuso
    }
    return dateVal;
  };

  // Mapear dados do veículo para o formato do formulário
  const mapVehicleToFormData = (v: any): Partial<VehicleFormData> => {
    if (!v) return {};

    return {
      placa: v.placa || '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      ano: v.ano || new Date().getFullYear(),
      cor: v.cor || '',
      combustivel: (v.combustivel?.toUpperCase() || 'FLEX') as any,
      quilometragem: v.quilometragem || 0,
      status: (v.status?.toUpperCase() || 'ACTIVE') as any,
      capacidade: v.capacidade || 5,

      // Allocations
      postoDeTrabalho: v.workPostId || '',
      departamento: v.department || '',
      departmentId: v.departmentId || '',
      empresaId: v.companyId || '',
      responsavel: v.responsibleEmployeeId || '',

      // Maintenance
      dataManutencao: toDate(v.lastMaintenanceDate),
      proximaManutencao: toDate(v.nextMaintenanceDate),
      vencimentoSeguro: toDate(v.insuranceExpiryDate),
      vencimentoDocumentacao: toDate(v.documentationExpiryDate),

      // Financial
      data_aquisicao: toDate(v.data_aquisicao),
      valor_aquisicao: v.valor_aquisicao || 0,

      // Misc
      observacoes: v.observacoes || '',
      existingPhotos: v.photos ? v.photos.split(',').map((p: string) => p.trim()).filter((p: string) => p) : []
    };
  };

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
      setIsLoading(false);
    }
  });

  const handleSubmit = async (formData: VehicleFormData) => {
    if (!veiculo?.id) return;

    setIsLoading(true);

    try {
      // Mapear dados do formulário para o formato da API
      // Nota: A lógica de mapeamento é similar à criação, mas pode precisar lidar com photosToDelete

      const vehicleData = {
        plate: formData.placa.toUpperCase(),
        brand: formData.marca,
        model: formData.modelo,
        year: Number(formData.ano),
        color: formData.cor || '',
        fuelType: formData.combustivel.toUpperCase() as 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX',
        currentMileage: Number(formData.quilometragem) || 0,
        status: formData.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE',
        capacity: Number(formData.capacidade) || 5,
        department: formData.departamento || undefined,
        departmentId: formData.departmentId || undefined,
        companyId: formData.empresaId || undefined,
        workPostId: formData.postoDeTrabalho || undefined, // Adicionado
        lastMaintenanceDate: formData.dataManutencao ? formData.dataManutencao.toISOString().split('T')[0] : undefined,
        nextMaintenanceDate: formData.proximaManutencao ? formData.proximaManutencao.toISOString().split('T')[0] : undefined,
        insuranceExpiryDate: formData.vencimentoSeguro ? formData.vencimentoSeguro.toISOString().split('T')[0] : undefined,
        documentationExpiryDate: formData.vencimentoDocumentacao ? formData.vencimentoDocumentacao.toISOString().split('T')[0] : undefined,
        acquisitionDate: formData.data_aquisicao ? formData.data_aquisicao.toISOString().split('T')[0] : undefined,
        acquisitionValue: formData.valor_aquisicao > 0 ? formData.valor_aquisicao : undefined,
        notes: formData.observacoes || undefined,
        responsibleEmployeeId: formData.responsavel && formData.responsavel.trim() !== '' ? formData.responsavel : undefined,
        photos: (() => {
          // Processar fotos existentes (removendo as marcadas para exclusão)
          const remainingPhotos = formData.existingPhotos?.filter(photo => !formData.photosToDelete?.has(photo)) || [];

          // Adicionar novas fotos
          const newPhotos = formData.fotos ? Array.from(formData.fotos).map(file => file.name) : [];

          // Combinar fotos restantes com novas fotos
          const allPhotos = [...remainingPhotos, ...newPhotos];

          return allPhotos.length > 0 ? allPhotos.join(',') : undefined;
        })()
      };

      // Filtrar campos undefined/null/empty string
      const filteredVehicleData = Object.fromEntries(
        Object.entries(vehicleData).filter(([_, value]) => {
          if (value === undefined || value === null) return false;
          if (typeof value === 'string' && value.trim() === '') return false;
          if (typeof value === 'number' && isNaN(value)) return false;
          return true;
        })
      );

      updateVehicleMutation.mutate({ id: veiculo.id, vehicleData: filteredVehicleData });
    } catch (error: any) {
      console.error('Erro ao preparar dados do veículo:', error);
      toast({
        title: "Erro",
        description: "Erro ao preparar dados do veículo. Tente novamente.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const initialValues = veiculo ? mapVehicleToFormData(veiculo) : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-seguranca-darkgray text-seguranca-white border-seguranca-darkgray overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-seguranca-red">Editar</span> Veículo
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Atualize as informações do veículo da frota.
          </DialogDescription>
        </DialogHeader>

        {initialValues && (
          <VehicleForm
            initialData={initialValues}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            isEditMode={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default VeiculoEditModal;
