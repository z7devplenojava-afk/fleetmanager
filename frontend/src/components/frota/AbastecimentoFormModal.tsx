'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import { costCenterService } from '@/services/costCenterService';
import { contasAPagarService, CreateSupplierRequest } from '@/services/contasAPagarService';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import DriverFormModal from '@/components/frota/DriverFormModal';
import { RefuelingForm } from './forms/RefuelingForm';
import { RefuelingFormData } from './forms/types';
import { Vehicle } from '@/types/fleet';

interface AbastecimentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veiculos: Vehicle[];
}

const AbastecimentoFormModal: React.FC<AbastecimentoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  veiculos
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  // Initial Data
  const [preSelectedVehicleId, setPreSelectedVehicleId] = useState<string>('');

  // --- QUERIES ---

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers', 'active'],
    queryFn: async () => {
      const res = await driverService.getDrivers();
      return Array.isArray(res) ? res : [];
    },
    enabled: isOpen
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ['costCenters'],
    queryFn: async () => {
      const res = await costCenterService.list({ page: 0, size: 100 });
      // Handle pagination if needed, assuming list returns array or object with content
      // Based on previous file, it seems it can return paginated obj
      return (res as any).content || (Array.isArray(res) ? res : []);
    },
    enabled: isOpen
  });

  const { data: suppliers = [], refetch: refetchSuppliers } = useQuery({
    queryKey: ['suppliers', 'active'],
    queryFn: contasAPagarService.getFornecedoresAtivos,
    enabled: isOpen
  });

  // Last Fuel Record Logic (dependent on preSelectedVehicleId which is updated from Form state? No, Form has its own state)
  // We need to lift vehicleId state up IF we want to fetch last record here. 
  // OR we can pass a callback to the form to notify when vehicle changes.
  // RefuelingForm handles its mileage validation, but it needs the lastFuelRecord.
  // So we will pass a logic to fetch it inside the RefuelingForm? 
  // Actually, better to lift the vehicleId state here or pass a setter.
  // However, RefuelingForm manages its own state. 
  // Let's modify RefuelingForm to accept onVehicleChange or we simply fetch inside RefuelingForm?
  // FETCHING INSIDE RefuelingForm is cleaner for this parent component, BUT React Query hook needs to be here if we want to follow container/presenter pattern?
  // No, let's keep it simple. I used `lastFuelRecord` prop in RefuelingForm. 
  // So I need `selectedVehicleId` in this component state.

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const { data: lastFuelRecord } = useQuery({
    queryKey: ['lastFuelRecord', selectedVehicleId],
    queryFn: async () => {
      if (!selectedVehicleId) return null;
      try {
        // 1. Try last fuel record
        const last = await fleetService.getLastFuelRecord(selectedVehicleId);
        if (last) return last;

        // 2. Fallback to vehicle initial mileage
        const v = veiculos.find(x => x.id === selectedVehicleId);
        if (v && v.currentMileage) return { mileage: v.currentMileage, isFromVehicle: true };

        return null;
      } catch (e) {
        return null;
      }
    },
    enabled: !!selectedVehicleId
  });


  // --- MUTATIONS ---

  const createFuelRecordMutation = useMutation({
    mutationFn: (data: FormData) => fleetService.createFuelRecord(data),
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Abastecimento registrado!" });
      queryClient.invalidateQueries({ queryKey: ['fuelRecords'] });
      // Update vehicle mileage in cache as well?
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.response?.data?.message || "Erro ao salvar", variant: "destructive" });
    }
  });

  const handleSubmit = (formData: RefuelingFormData) => {
    if (!formData.vehicleId || !formData.date || !formData.liters || !formData.totalValue || !formData.station) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const payload = {
      vehicleId: formData.vehicleId,
      date: formData.date,
      fuelType: formData.fuelType,
      quantity: formData.liters,
      cost: formData.totalValue,
      pricePerLiter: formData.pricePerLiter || null,
      mileage: formData.mileage,
      initialMileage: formData.initialMileage || null,
      station: formData.station,
      driverId: formData.driverId || null,
      notes: formData.notes || '',
      costCenter: formData.costCenter || null,
      clientId: formData.clientId || null,
      clientName: formData.clientName || null,
      workPostId: formData.workPostId || null,
      obraName: formData.obraName || null,
      contractId: formData.contractId || null,
      contractNumber: formData.contractNumber || null,
      supplierId: formData.supplierId || null
    };

    const data = new FormData();
    data.append('fuelRecord', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (formData.receiptFile) {
      data.append('receipt', formData.receiptFile);
    }

    createFuelRecordMutation.mutate(data as any);
    setIsLoading(false);
  };

  // Handlers for side modals
  const handleCreateSupplier = async (payload: CreateSupplierRequest) => {
    try {
      await contasAPagarService.createFornecedor(payload);
      refetchSuppliers();
      setIsSupplierModalOpen(false);
      toast({ title: "Sucesso", description: "Fornecedor criado" });
    } catch (e) {
      toast({ title: "Erro", description: "Erro ao criar fornecedor", variant: "destructive" });
    }
  };

  const handleCreateDriver = async (data: any) => {
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
    setIsDriverModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-4xl !h-[90vh] flex flex-col !p-0 overflow-hidden bg-seguranca-darkgray text-seguranca-white border-seguranca-darkgray">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold">Registrar Abastecimento</DialogTitle>
            <DialogDescription className="text-gray-400">
              Lançamento de despesa de combustível por veículo, cliente e contrato.
            </DialogDescription>
          </DialogHeader>
          <RefuelingForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            vehicles={veiculos}
            drivers={drivers}
            costCenters={costCenters}
            suppliers={suppliers}
            lastFuelRecord={lastFuelRecord}
            onOpenDriverModal={() => setIsDriverModalOpen(true)}
            onOpenSupplierModal={() => setIsSupplierModalOpen(true)}
            onVehicleChange={(vId) => setSelectedVehicleId(vId)}
          />
        </DialogContent>
      </Dialog>

      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={handleCreateSupplier}
      />

      <DriverFormModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onSuccess={() => handleCreateDriver(null)}
      />
    </>
  );
};

export default AbastecimentoFormModal;
