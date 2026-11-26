import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { DriverDailyScheduleBoard } from '@/components/driver/DriverDailyScheduleBoard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, ArrowRight, ShieldCheck, Bus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { scheduleService } from '@/services/scheduleService';

const DriverFormularioDiarioPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  // Busca escalas de hoje para puxar automaticamente o veículo alocado ao motorista
  const { data: schedules = [] } = useQuery({
    queryKey: ['driver-today-schedules', user?.id, today],
    queryFn: async () => {
      try {
        const list = await scheduleService.findMySchedules({ startDate: today, endDate: today });
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const scheduleWithVehicle = schedules.find((s) => s.vehicle?.plate || s.vehiclePlate);
  const vehicleId = scheduleWithVehicle?.vehicleId || scheduleWithVehicle?.vehicle?.id;
  const vehiclePlate = scheduleWithVehicle?.vehicle?.plate || scheduleWithVehicle?.vehiclePlate || '';
  const vehicleModel = scheduleWithVehicle?.vehicle?.model || '';

  return (
    <StandardLayout
      title="Formulário Diário"
      subtitle="Controle de percursos, horários, hodômetro (KM) e passageiros"
    >
      <div className="space-y-4 max-w-7xl mx-auto pb-10">
        {/* Banner de atalho para Checklist */}
        <Card className="bg-gradient-to-r from-blue-950/40 via-background to-blue-900/20 border-blue-500/30 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  Checklist & Avarias do Veículo
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Após preencher o formulário diário, realize o checklist de inspeção de saída/chegada.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/driver/checklist')}
              className="w-full sm:w-auto h-9 text-xs font-semibold border-blue-500/40 text-blue-400 hover:bg-blue-500/10 shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>Ir para Checklist</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Quadro Diário Completo do Motorista */}
        <DriverDailyScheduleBoard
          driverId={user?.employeeId || user?.id}
          driverName={user?.name || 'Motorista'}
          driverRole="Motorista"
          vehicleId={vehicleId}
          vehiclePlate={vehiclePlate}
          vehicleModel={vehicleModel}
        />
      </div>
    </StandardLayout>
  );
};

export default DriverFormularioDiarioPage;
