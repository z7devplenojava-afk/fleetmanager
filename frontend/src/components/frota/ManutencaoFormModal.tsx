'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import maintenanceService from '@/services/maintenanceService';
import { contasAPagarService, Supplier, CreateSupplierRequest } from '@/services/contasAPagarService';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import { Vehicle } from '@/types/fleet';
import { VehicleMaintenance } from '@/types/fleet';
import { MaintenanceForm } from './forms/MaintenanceForm';
import { MaintenanceFormData } from './forms/types';

interface ManutencaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veiculos: Vehicle[];
  manutencao?: VehicleMaintenance;
}

const ManutencaoFormModal: React.FC<ManutencaoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  veiculos,
  manutencao
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Carregar fornecedores
  useEffect(() => {
    if (!isOpen) return;
    const loadSuppliers = async () => {
      try {
        const list = await contasAPagarService.getFornecedoresAtivos();
        setSuppliers(list);
      } catch (error) {
        console.error('❌ Erro ao carregar fornecedores:', error);
      }
    };
    loadSuppliers();
  }, [isOpen]);

  // Preparar initialData para o form
  const getInitialData = (): Partial<MaintenanceFormData> | undefined => {
    if (!manutencao) return {
      date: new Date(),
      status: 'SCHEDULED',
      priority: 'MEDIUM'
    };

    return {
      vehicleId: manutencao.vehicleId || '',
      date: manutencao.date ? new Date(manutencao.date) : new Date(),
      maintenanceType: manutencao.maintenanceType || '',
      description: manutencao.description || '',
      cost: manutencao.cost || 0,
      provider: manutencao.provider || '',
      mileage: manutencao.mileage || 0,
      status: manutencao.status || 'SCHEDULED',
      priority: manutencao.priority || 'MEDIUM',
      notes: manutencao.notes || ''
    };
  };

  const handleSubmit = async (formData: MaintenanceFormData) => {
    if (!formData.vehicleId) {
      toast({ title: "Erro", description: "Selecione um veículo", variant: "destructive" });
      return;
    }
    if (!formData.date) {
      toast({ title: "Erro", description: "Selecione a data", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const maintenanceData = {
        vehicleId: formData.vehicleId,
        date: formData.date.toISOString().split('T')[0],
        maintenanceType: formData.maintenanceType as any,
        description: formData.description.trim(),
        cost: Number(formData.cost),
        provider: formData.provider || undefined,
        mileage: Number(formData.mileage),
        status: formData.status as any,
        priority: formData.priority as any,
        notes: formData.notes || undefined,
        removedPhotos: formData.removedPhotos,
        removedDocuments: formData.removedDocuments
      };

      const filesToUpload = formData.files ? Array.from(formData.files) : [];

      if (manutencao) {
        await maintenanceService.updateMaintenance(manutencao.id, maintenanceData, filesToUpload);
        toast({ title: "Manutenção atualizada", description: "Sucesso!" });
      } else {
        await maintenanceService.createMaintenance(maintenanceData, filesToUpload);
        toast({ title: "Manutenção criada", description: "Sucesso!" });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar manutenção:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao salvar",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async (payload: CreateSupplierRequest) => {
    try {
      const created = await contasAPagarService.createFornecedor(payload);
      toast({ title: 'Fornecedor cadastrado', description: created.name });
      const list = await contasAPagarService.getFornecedoresAtivos();
      setSuppliers(list);
      setIsSupplierModalOpen(false);
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao cadastrar fornecedor', variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-4xl !h-[90vh] flex flex-col !p-0 overflow-hidden bg-seguranca-darkgray text-seguranca-white border-seguranca-darkgray">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold">{manutencao ? 'Editar Manutenção' : 'Nova Manutenção (v2)'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {manutencao ? 'Atualize as informações.' : 'Cadastre uma nova manutenção.'}
            </DialogDescription>
          </DialogHeader>
          <MaintenanceForm
            initialData={getInitialData()}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            vehicles={veiculos}
            suppliers={suppliers}
            onOpenSupplierModal={() => setIsSupplierModalOpen(true)}
            isEditMode={!!manutencao}
            submitLabel={manutencao ? 'Atualizar' : 'Salvar'}
          />
        </DialogContent>
      </Dialog>

      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={handleCreateSupplier}
      />
    </>
  );
};

export default ManutencaoFormModal;
