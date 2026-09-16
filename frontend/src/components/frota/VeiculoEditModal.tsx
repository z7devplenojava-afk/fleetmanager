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

interface VeiculoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veiculo: any | null;
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
      if (dateVal.includes('T')) return new Date(dateVal);
      return new Date(dateVal + 'T12:00:00');
    }
    return dateVal;
  };

  const toDateStr = (dateVal: any): string => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') return dateVal.split('T')[0];
    if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
    return '';
  };

  // Mapear dados do veículo para o formato do formulário
  const mapVehicleToFormData = (v: any): Partial<VehicleFormData> => {
    if (!v) return {};

    return {
      vehicleId: v.id || '',
      placa: v.plate || v.placa || '',
      chassi: v.chassisNumber || v.chassi || '',
      renavan: v.renavan || '',
      marca: v.brand || v.marca || '',
      modelo: v.model || v.modelo || '',
      ano: v.year || v.ano || new Date().getFullYear(),
      cor: v.color || v.cor || '',
      combustivel: (v.fuelType?.toUpperCase() || v.combustivel?.toUpperCase() || 'FLEX') as any,
      quilometragem: v.currentMileage ?? v.quilometragem ?? 0,
      status: (v.status?.toUpperCase() || 'ACTIVE') as any,
      capacidade: v.capacity ?? v.capacidade ?? 5,
      vehicleType: v.vehicleType || '',

      // Ônibus
      busType: v.busType || '',
      passengerCapacity: v.passengerCapacity ?? 0,
      standingCapacity: v.standingCapacity ?? 0,
      totalDoors: v.totalDoors ?? 2,
      hasAccessibility: Boolean(v.hasAccessibility),
      hasAirConditioning: Boolean(v.hasAirConditioning),
      hasWiFi: Boolean(v.hasWiFi),
      hasCamera: Boolean(v.hasCamera),
      hasCctv: Boolean(v.hasCctv),
      busBodyType: v.busBodyType || '',
      chassisBrand: v.chassisBrand || '',
      bodyBuilder: v.bodyBuilder || '',
      engineModel: v.engineModel || '',
      enginePowerHp: v.enginePowerHp ?? 0,
      transmissionType: v.transmissionType || '',
      axleCount: v.axleCount ?? 2,
      totalWeightKg: v.totalWeightKg ?? 0,
      payloadKg: v.payloadKg ?? 0,
      fuelTankCapacityLiters: v.fuelTankCapacityLiters ?? 0,
      routeNumber: v.routeNumber || '',
      routeName: v.routeName || '',

      // Allocations
      postoDeTrabalho: v.workPostId || '',
      departamento: v.department || '',
      departmentId: v.departmentId || '',
      empresa: v.companyName || v.clientName || '',
      empresaId: v.companyId || v.clientId || '',
      responsavel: v.responsibleEmployeeId || '',

      // Maintenance
      dataManutencao: toDate(v.lastMaintenanceDate),
      proximaManutencao: toDate(v.nextMaintenanceDate),
      vencimentoSeguro: toDate(v.insuranceExpiryDate),
      vencimentoDocumentacao: toDate(v.documentationExpiryDate),

      // Financial
      data_aquisicao: toDate(v.acquisitionDate || v.data_aquisicao),
      valor_aquisicao: v.acquisitionValue ?? v.valor_aquisicao ?? 0,

      // Financiamento
      financingStatus: v.financingStatus || '',
      financingInstallmentValue: v.financingInstallmentValue ?? 0,
      financingRemainingInstallments: v.financingRemainingInstallments ?? 0,
      financingPayoffBalance: v.financingPayoffBalance ?? 0,
      financingBankOrInstitution: v.financingBankOrInstitution || '',
      financingContractNumber: v.financingContractNumber || '',
      financingStartDate: toDateStr(v.financingStartDate),
      financingEndDate: toDateStr(v.financingEndDate),

      // Valor de mercado
      marketValue: v.marketValue ?? 0,

      // Seguros
      insurancePolicyNumber: v.insurancePolicyNumber || '',
      insuranceCompany: v.insuranceCompany || '',
      insurancePremiumValue: v.insurancePremiumValue ?? 0,
      insuranceCoverageType: v.insuranceCoverageType || '',
      insuranceSecondPolicyNumber: v.insuranceSecondPolicyNumber || '',
      insuranceSecondCompany: v.insuranceSecondCompany || '',
      insuranceSecondPremiumValue: v.insuranceSecondPremiumValue ?? 0,
      insuranceSecondExpiryDate: toDateStr(v.insuranceSecondExpiryDate),

      // Cliente / Alocação
      clientName: v.clientName || '',
      clientId: v.clientId || '',
      allocationContractNumber: v.allocationContractNumber || '',
      allocationStartDate: toDateStr(v.allocationStartDate),
      allocationEndDate: toDateStr(v.allocationEndDate),

      // Agregado
      isAggregated: Boolean(v.isAggregated),
      aggregatedOwnerName: v.aggregatedOwnerName || '',
      aggregatedOwnerCpfCnpj: v.aggregatedOwnerCpfCnpj || '',
      aggregatedOwnerPhone: v.aggregatedOwnerPhone || '',
      aggregatedOwnerEmail: v.aggregatedOwnerEmail || '',
      aggregatedDailyRate: v.aggregatedDailyRate ?? 0,
      aggregatedMonthlyRate: v.aggregatedMonthlyRate ?? 0,
      aggregatedPaymentType: v.aggregatedPaymentType || '',
      aggregatedContractStartDate: toDateStr(v.aggregatedContractStartDate),
      aggregatedContractEndDate: toDateStr(v.aggregatedContractEndDate),
      aggregatedNotes: v.aggregatedNotes || '',

      // Diferença financeira
      financialDifference: v.financialDifference ?? 0,

      // Misc
      observacoes: v.notes || v.observacoes || '',
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

      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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
      const vehicleData: Record<string, any> = {
        plate: formData.placa.toUpperCase(),
        brand: formData.marca,
        model: formData.modelo,
        year: Number(formData.ano),
        color: formData.cor || '',
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
        department: formData.departamento || undefined,
        departmentId: formData.departmentId || undefined,
        companyId: formData.empresaId || formData.clientId || undefined,
        workPostId: formData.postoDeTrabalho || undefined,
        responsibleEmployeeId: formData.responsavel && formData.responsavel.trim() !== '' ? formData.responsavel : undefined,

        // Cliente / Alocação
        clientId: formData.clientId || formData.empresaId || undefined,
        clientName: formData.clientName || formData.empresa || undefined,
        allocationContractNumber: formData.allocationContractNumber || undefined,
        allocationStartDate: formData.allocationStartDate || undefined,
        allocationEndDate: formData.allocationEndDate || undefined,

        // Manutenção e Datas
        lastMaintenanceDate: formData.dataManutencao ? formData.dataManutencao.toISOString().split('T')[0] : undefined,
        nextMaintenanceDate: formData.proximaManutencao ? formData.proximaManutencao.toISOString().split('T')[0] : undefined,
        insuranceExpiryDate: formData.vencimentoSeguro ? formData.vencimentoSeguro.toISOString().split('T')[0] : undefined,
        documentationExpiryDate: formData.vencimentoDocumentacao ? formData.vencimentoDocumentacao.toISOString().split('T')[0] : undefined,
        acquisitionDate: formData.data_aquisicao ? formData.data_aquisicao.toISOString().split('T')[0] : undefined,
        acquisitionValue: formData.valor_aquisicao > 0 ? formData.valor_aquisicao : undefined,
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

        photos: (() => {
          const remainingPhotos = formData.existingPhotos?.filter(photo => !formData.photosToDelete?.has(photo)) || [];
          const newPhotos = formData.fotos ? Array.from(formData.fotos).map(file => file.name) : [];
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
            isLoading={isLoading}
            isEditMode={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VeiculoEditModal;
