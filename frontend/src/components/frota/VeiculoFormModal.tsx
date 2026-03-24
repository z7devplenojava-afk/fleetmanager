import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import { VehicleForm } from './forms/VehicleForm';
import { VehicleFormData } from './forms/types';
import { formatDateForBackend } from '@/utils/dateUtils';

interface VeiculoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const VeiculoFormModal: React.FC<VeiculoFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para criar veículo
  const createVehicleMutation = useMutation({
    mutationFn: (vehicleData: any) => fleetService.createVehicle(vehicleData),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo cadastrado com sucesso!"
      });

      // Invalidar e refetch da query de veículos
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });

      // Chamar callback de sucesso
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar veículo:', error);

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
      setIsLoading(false);
    }
  });

  const handleSubmit = async (formData: VehicleFormData) => {
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
        departmentId: formData.departmentId || undefined,
        companyId: formData.empresaId || undefined,
        lastMaintenanceDate: formData.dataManutencao ? formatDateForBackend(formData.dataManutencao) : undefined,
        nextMaintenanceDate: formData.proximaManutencao ? formatDateForBackend(formData.proximaManutencao) : undefined,
        insuranceExpiryDate: formData.vencimentoSeguro ? formatDateForBackend(formData.vencimentoSeguro) : undefined,
        documentationExpiryDate: formData.vencimentoDocumentacao ? formatDateForBackend(formData.vencimentoDocumentacao) : undefined,
        acquisitionDate: formData.data_aquisicao ? formatDateForBackend(formData.data_aquisicao) : undefined,
        acquisitionValue: formData.valor_aquisicao || undefined,
        notes: formData.observacoes || undefined,
        responsibleEmployeeId: formData.responsavel || undefined,
        photos: formData.fotos ? Array.from(formData.fotos).map(file => file.name).join(',') : undefined
      };

      createVehicleMutation.mutate(vehicleData);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-darkgray text-seguranca-white border-seguranca-darkgray">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-seguranca-red">Novo</span> Veículo
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Preencha as informações para cadastrar um novo veículo na frota.
          </DialogDescription>
        </DialogHeader>

        <VehicleForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Cadastrar Veículo"
          isEditMode={false}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VeiculoFormModal;
