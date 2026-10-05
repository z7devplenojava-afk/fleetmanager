import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Droplet, Plus, Search, RefreshCw, Fuel } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import fuelPumpService, { FuelTank, FuelPump } from '@/services/fuelPumpService';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import FuelTankFormModal from './FuelTankFormModal';
import FuelPumpFormModal from './FuelPumpFormModal';

export const FuelInfraManagement: React.FC = () => {
    const [isTankModalOpen, setIsTankModalOpen] = useState(false);
    const [isPumpModalOpen, setIsPumpModalOpen] = useState(false);

    const { data: tanks = [], isLoading: tanksLoading, refetch: refetchTanks } = useQuery({
        queryKey: ['fuelTanks'],
        queryFn: fuelPumpService.getTanks
    });

    const { data: pumps = [], isLoading: pumpsLoading, refetch: refetchPumps } = useQuery({
        queryKey: ['fuelPumps'],
        queryFn: fuelPumpService.getPumps
    });

    if (tanksLoading || pumpsLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tanques */}
                <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center text-lg text-seguranca-lightgray">
                            <Droplet className="mr-2 text-blue-400" size={20} />
                            Tanques de Combustível
                        </CardTitle>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsTankModalOpen(true)}>
                            <Plus size={16} className="mr-1" /> Novo Tanque
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Garagem</TableHead>
                                    <TableHead>Combustível</TableHead>
                                    <TableHead>Capacidade</TableHead>
                                    <TableHead>Nível Atual</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tanks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-gray-500 py-4">Nenhum tanque cadastrado</TableCell>
                                    </TableRow>
                                ) : (
                                    tanks.map(tank => (
                                        <TableRow key={tank.id}>
                                            <TableCell className="font-medium">{tank.name}</TableCell>
                                            <TableCell className="text-gray-300 text-sm">{tank.garageName || '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{tank.fuelType}</Badge>
                                            </TableCell>
                                            <TableCell>{tank.capacity.toLocaleString()} L</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span>{tank.currentLevel.toLocaleString()} L</span>
                                                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${tank.currentLevel / tank.capacity < 0.2 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${Math.min(100, (tank.currentLevel / tank.capacity) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Bombas */}
                <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center text-lg text-seguranca-lightgray">
                            <Fuel className="mr-2 text-seguranca-yellow" size={20} />
                            Bombas Ativas
                        </CardTitle>
                        <Button size="sm" className="bg-seguranca-yellow hover:bg-yellow-600 text-black" onClick={() => setIsPumpModalOpen(true)}>
                            <Plus size={16} className="mr-1" /> Nova Bomba
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Garagem</TableHead>
                                    <TableHead>Tanque</TableHead>
                                    <TableHead>Última Leitura</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pumps.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-4">Nenhuma bomba cadastrada</TableCell>
                                    </TableRow>
                                ) : (
                                    pumps.map(pump => (
                                        <TableRow key={pump.id}>
                                            <TableCell className="font-medium">{pump.name}</TableCell>
                                            <TableCell className="text-gray-300 text-sm">{pump.garageName || '—'}</TableCell>
                                            <TableCell>{pump.fuelTankName}</TableCell>
                                            <TableCell>{pump.lastMeterReading.toLocaleString()} L</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <FuelTankFormModal
                isOpen={isTankModalOpen}
                onClose={() => setIsTankModalOpen(false)}
                onSuccess={() => refetchTanks()}
            />

            <FuelPumpFormModal
                isOpen={isPumpModalOpen}
                onClose={() => setIsPumpModalOpen(false)}
                onSuccess={() => {
                    refetchPumps();
                    refetchTanks(); // Pode afetar tanques se houver mudanças relacionadas
                }}
                tanks={tanks}
            />
        </div>
    );
};

