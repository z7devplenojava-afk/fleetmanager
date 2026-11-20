import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import AgregadosDashboard from '@/components/frota/AgregadosDashboard';
import AgregadosTable from '@/components/frota/AgregadosTable';
import AgregadosFormModal from '@/components/frota/AgregadosFormModal';
import { Vehicle } from '@/types/vehicle';

export const AgregadosOperacionalTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAgregadoModalOpen, setIsAgregadoModalOpen] = useState(false);
  const [selectedAgregado, setSelectedAgregado] = useState<Vehicle | null>(null);

  const {
    data: vehicles = [],
    isLoading,
    refetch: refetchVehicles,
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => fleetService.getVehicles(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const handleRefresh = async () => {
    try {
      fleetService.invalidateVehiclesCache();
      const res = await refetchVehicles();
      const count = res.data?.length || 0;
      toast({
        title: 'Agregados atualizados',
        description: `${count} veículo(s) sincronizado(s) com o servidor.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err?.message || 'Não foi possível carregar os veículos.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <AgregadosDashboard veiculos={vehicles} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-seguranca-graphite/80 backdrop-blur-sm border border-gray-700/80 rounded-xl p-4 shadow-md">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-orange-400" />
            Gestão Operacional de Agregados
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitoramento de veículos de terceiros agregados à frota, lucratividade, contratos e pagamentos
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <RefreshCw size={14} className={`mr-1.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            Atualizar
          </Button>

          <Button
            onClick={() => {
              setSelectedAgregado(null);
              setIsAgregadoModalOpen(true);
            }}
            className="bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-600/30"
          >
            <Plus size={16} className="mr-1.5 stroke-[2.5]" />
            Novo Agregado
          </Button>
        </div>
      </div>

      <AgregadosTable
        veiculos={vehicles}
        isLoading={isLoading}
        onRefresh={refetchVehicles}
        onEdit={(veiculo) => {
          setSelectedAgregado(veiculo);
          setIsAgregadoModalOpen(true);
        }}
      />

      {isAgregadoModalOpen && (
        <AgregadosFormModal
          isOpen={isAgregadoModalOpen}
          onOpenChange={setIsAgregadoModalOpen}
          onSuccess={() => {
            refetchVehicles();
            setSelectedAgregado(null);
          }}
          vehicle={selectedAgregado}
        />
      )}
    </div>
  );
};

export default AgregadosOperacionalTab;
