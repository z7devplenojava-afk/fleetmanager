import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bus, Clock, MapPin, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import scheduleService from '@/services/scheduleService'; // To be verified/created

import { StandardLayout } from '@/components/StandardLayout';

const DriverTripList: React.FC = () => {
    const navigate = useNavigate();

    // Mock data for now, will replace with real query
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ['driver-schedules'],
        queryFn: async () => {
            // Mocking a driver's scale
            return [
                {
                    id: '1',
                    route: { name: 'Rota A - Industrial' },
                    scheduleDate: '2026-01-29',
                    shift: 'DIURNO',
                    status: 'PLANNED',
                    location: { name: 'Portaria Principal' }
                }
            ];
        },
    });

    if (isLoading) return <div>Carregando escalas...</div>;

    return (
        <StandardLayout title="Minhas Viagens" subtitle="Lista de viagens agendadas para hoje">
            <div className="p-4 space-y-4 max-w-md mx-auto">

                {schedules.map((schedule) => (
                    <Card key={schedule.id} className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg text-seguranca-lightgray">
                                    {schedule.route.name}
                                </CardTitle>
                                <Badge variant="outline" className="border-seguranca-yellow text-seguranca-yellow">
                                    {schedule.shift}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} /> <span>{schedule.scheduleDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} /> <span>{schedule.location.name}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-seguranca-red hover:bg-seguranca-darkred text-white"
                                onClick={() => navigate(`/driver/trip/${schedule.id}`)}
                            >
                                <Play size={18} className="mr-2" /> Iniciar Viagem
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {schedules.length === 0 && (
                    <p className="text-center text-gray-500 py-10">Nenhuma viagem agendada para hoje.</p>
                )}
            </div>
        </StandardLayout>
    );
};

export default DriverTripList;
