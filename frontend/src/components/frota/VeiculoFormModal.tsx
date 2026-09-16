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

      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar veículo:', error);

      let errorMessage = "Erro ao cadastrar veículo. Tente novamente.";

      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || error.response?.data?.message || "Esta placa já está cadastrada no sistema!";
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
      const vehicleData: Record<string, any> = {
        plate: formData.placa.toUpperCase(),
        brand: formData.marca,
        model: formData.modelo,
        year: Number(formData.ano),
        color: formData.cor,
        fuelType: formData.combustivel.toUpperCase() as 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX',
        currentMileage: Number(formData.quilometragem) || 0,
        status: formData.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE',
        capacity: Number(formData.capacidade) || 5,
        vehicleType: formData.vehicleType || undefined,

        // Documentais
        chassisNumber: formData.chassi || undefined,
        renavan: formData.renavan || undefined,

        // Ônibus
        busType: formData.busType || undefined,
        passengerCapacity: formData.passengerCapacity || undefined,
        standingCapacity: formData.standingCapacity || undefined,
        totalDoors: formData.totalDoors || undefined,
        hasAccessibility: formData.hasAccessibility,
        hasAirConditioning: formData.hasAirConditioning,
        hasWiFi: formData.hasWiFi,
        hasCamera: formData.hasCamera,
        hasCctv: formData.hasCctv,
        busBodyType: formData.busBodyType || undefined,
        chassisBrand: formData.chassisBrand || undefined,
        bodyBuilder: formData.bodyBuilder || undefined,
        engineModel: formData.engineModel || undefined,
        enginePowerHp: formData.enginePowerHp || undefined,
        transmissionType: formData.transmissionType || undefined,
        axleCount: formData.axleCount || undefined,
        totalWeightKg: formData.totalWeightKg || undefined,
        payloadKg: formData.payloadKg || undefined,
        fuelTankCapacityLiters: formData.fuelTankCapacityLiters || undefined,
        routeNumber: formData.routeNumber || undefined,
        routeName: formData.routeName || undefined,

        // Alocações
        workPostId: formData.postoDeTrabalho || undefined,
        department: formData.departamento || undefined,
        departmentId: formData.departmentId || undefined,
        companyId: formData.empresaId || formData.clientId || undefined,
        responsibleEmployeeId: formData.responsavel || undefined,

        // Cliente / Alocação
        clientId: formData.clientId || formData.empresaId || undefined,
        clientName: formData.clientName || formData.empresa || undefined,
        allocationContractNumber: formData.allocationContractNumber || undefined,
        allocationStartDate: formData.allocationStartDate || undefined,
        allocationEndDate: formData.allocationEndDate || undefined,

        // Manutenção e Datas
        lastMaintenanceDate: formData.dataManutencao ? formatDateForBackend(formData.dataManutencao) : undefined,
        nextMaintenanceDate: formData.proximaManutencao ? formatDateForBackend(formData.proximaManutencao) : undefined,
        insuranceExpiryDate: formData.vencimentoSeguro ? formatDateForBackend(formData.vencimentoSeguro) : undefined,
        documentationExpiryDate: formData.vencimentoDocumentacao ? formatDateForBackend(formData.vencimentoDocumentacao) : undefined,
        acquisitionDate: formData.data_aquisicao ? formatDateForBackend(formData.data_aquisicao) : undefined,
        acquisitionValue: formData.valor_aquisicao || undefined,
        notes: formData.observacoes || undefined,

        // Financiamento
        financingStatus: formData.financingStatus || undefined,
        financingInstallmentValue: formData.financingInstallmentValue || undefined,
        financingRemainingInstallments: formData.financingRemainingInstallments || undefined,
        financingPayoffBalance: formData.financingPayoffBalance || undefined,
        financingBankOrInstitution: formData.financingBankOrInstitution || undefined,
        financingContractNumber: formData.financingContractNumber || undefined,
        financingStartDate: formData.financingStartDate || undefined,
        financingEndDate: formData.financingEndDate || undefined,

        // Valor de mercado
        marketValue: formData.marketValue || undefined,

        // Seguros
        insurancePolicyNumber: formData.insurancePolicyNumber || undefined,
        insuranceCompany: formData.insuranceCompany || undefined,
        insurancePremiumValue: formData.insurancePremiumValue || undefined,
        insuranceCoverageType: formData.insuranceCoverageType || undefined,
        insuranceSecondPolicyNumber: formData.insuranceSecondPolicyNumber || undefined,
        insuranceSecondCompany: formData.insuranceSecondCompany || undefined,
        insuranceSecondPremiumValue: formData.insuranceSecondPremiumValue || undefined,
        insuranceSecondExpiryDate: formData.insuranceSecondExpiryDate || undefined,

        // Agregado
        isAggregated: formData.isAggregated,
        aggregatedOwnerName: formData.aggregatedOwnerName || undefined,
        aggregatedOwnerCpfCnpj: formData.aggregatedOwnerCpfCnpj || undefined,
        aggregatedOwnerPhone: formData.aggregatedOwnerPhone || undefined,
        aggregatedOwnerEmail: formData.aggregatedOwnerEmail || undefined,
        aggregatedDailyRate: formData.aggregatedDailyRate || undefined,
        aggregatedMonthlyRate: formData.aggregatedMonthlyRate || undefined,
        aggregatedPaymentType: formData.aggregatedPaymentType || undefined,
        aggregatedContractStartDate: formData.aggregatedContractStartDate || undefined,
        aggregatedContractEndDate: formData.aggregatedContractEndDate || undefined,
        aggregatedNotes: formData.aggregatedNotes || undefined,

        // Diferença financeira
        financialDifference: formData.financialDifference || undefined,

        photos: formData.fotos ? Array.from(formData.fotos).map(file => file.name).join(',') : undefined
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

      createVehicleMutation.mutate(filteredVehicleData);
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
