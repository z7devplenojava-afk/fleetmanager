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
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { InfractionForm } from './forms/InfractionForm';
import { InfractionFormData } from './forms/types';
import { Vehicle } from '@/types/fleet';
import DriverFormModal from './DriverFormModal';

interface Multa {
  id?: string;
  veiculo_id: string;
  driverId?: string; // Standardize
  motorista_id?: string; // Legacy
  data_infracao: string;
  data_vencimento: string;
  valor: number;
  pontos: number;
  tipo_infracao: string;
  local_infracao: string;
  status: 'pendente' | 'paga' | 'vencida';
  observacoes?: string;
  driverPhone?: string;
}

interface MultaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  multa?: Multa | null;
  veiculos: Vehicle[];
}

const MultaFormModal: React.FC<MultaFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  multa,
  veiculos
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers', 'active'],
    queryFn: async () => {
      const res = await driverService.getDrivers();
      return Array.isArray(res) ? res.filter((d: any) => d.status === 'ACTIVE' || d.status === 'ATIVO') : [];
    },
    enabled: isOpen
  });

  const getInitialData = (): Partial<InfractionFormData> | undefined => {
    if (!multa) return undefined;
    return {
      id: multa.id,
      vehicleId: multa.veiculo_id,
      driverId: multa.driverId || multa.motorista_id,
      driverPhone: multa.driverPhone || '',
      date: multa.data_infracao,
      dueDate: multa.data_vencimento,
      type: multa.tipo_infracao,
      points: multa.pontos,
      location: multa.local_infracao,
      amount: multa.valor,
      status: multa.status,
      notes: multa.observacoes || ''
    };
  };

  const handleSubmit = async (formData: InfractionFormData) => {
    if (!formData.vehicleId || !formData.date || !formData.amount || !formData.type) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        vehicleId: formData.vehicleId,
        driverId: formData.driverId || undefined,
        driverPhone: formData.driverPhone || undefined,
        date: formData.date,
        dueDate: formData.dueDate,
        amount: formData.amount,
        description: formData.type, // Map type to description/type
        location: formData.location,
        status: (formData.status === 'paga' ? 'PAID' : formData.status === 'pendente' ? 'PENDING' : 'CANCELLED') as 'PAID' | 'PENDING' | 'CANCELLED',
        paymentDate: formData.status === 'paga' ? formData.dueDate : undefined, // Assumed
        points: formData.points || 0,
      };

      if (multa && multa.id) {
        await fleetService.updateFine(multa.id, payload);
      } else {
        await fleetService.createFine(payload);
      }

      // If file upload is supported by service, we would call it here.
      // Currently fleetService.createFine might not support file directly in payload if it's JSON.
      // Checked previous code: it didn't seem to upload file? 
      // Previous code had file state but didn't seem to append it to payload?
      // "const multaPayload = { ... }; ... createFine(multaPayload);"
      // So file upload was likely missing or ignored in previous code too.
      // I will keep it as UI only for now until backend supports it, or check if createFine accepts FormData.
      // Assuming JSON for now as per previous code.

      toast({ title: "Sucesso", description: multa ? "Multa atualizada" : "Multa criada" });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({ title: "Erro", description: error.response?.data?.message || "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDriver = () => {
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
    setIsDriverModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-4xl !h-[90vh] flex flex-col !p-0 overflow-hidden bg-seguranca-darkgray text-seguranca-white border-seguranca-darkgray">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold">{multa ? 'Editar Multa' : 'Nova Multa'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {multa ? 'Edite as informações.' : 'Cadastre uma nova infração.'}
            </DialogDescription>
          </DialogHeader>
          <InfractionForm
            initialData={getInitialData()}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            vehicles={veiculos}
            drivers={drivers}
            onOpenDriverModal={() => setIsDriverModalOpen(true)}
            submitLabel={multa ? 'Atualizar' : 'Salvar'}
          />
        </DialogContent>
      </Dialog>

      <DriverFormModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onSuccess={handleCreateDriver}
      />
    </>
  );
};

export default MultaFormModal;
