import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Plus, RefreshCw, Briefcase, Users, Calendar, TrendingUp } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import charterService, { CharterContract } from '@/services/charterService';
import { CharterContractsTable } from '@/components/fretamento/CharterContractsTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

const CharterDashboard: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: contracts = [], isLoading, refetch } = useQuery({
        queryKey: ['charterContracts'],
        queryFn: charterService.findAllContracts
    });

    if (isLoading) return <LoadingSpinner />;

    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
    const totalValue = contracts.reduce((acc, c) => acc + c.value, 0);

    return (
        <StandardLayout title="Gestão de Fretamento" subtitle="Gestão de contratos corporativos, rotas e escalas de funcionários">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[180px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Contratos Ativos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-seguranca-yellow">{activeContracts}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[200px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Faturamento Previsto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-green-500">
                                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[150px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rotas Ativas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-blue-400">12</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none border-gray-600 text-gray-400 hover:bg-gray-700"
                            onClick={() => refetch()}
                        >
                            <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <Button className="flex-1 md:flex-none bg-seguranca-red hover:bg-seguranca-darkred shadow-lg shadow-red-900/20">
                            <Plus size={18} className="mr-2" />
                            Novo Contrato
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 bg-seguranca-graphite border-gray-600 overflow-hidden">
                        <CardHeader className="border-b border-gray-600/50 bg-seguranca-black/20">
                            <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                                <Briefcase className="mr-2 text-seguranca-yellow" size={20} />
                                Contratos de Prestação de Serviço
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <CharterContractsTable
                                data={contracts}
                                onView={() => { }}
                                onEdit={() => { }}
                                onDelete={async (c) => {
                                    if (confirm(`Remover contrato ${c.name}?`)) {
                                        await charterService.deleteContract(c.id);
                                        refetch();
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-seguranca-graphite border-gray-600 flex flex-col">
                        <CardHeader className="border-b border-gray-600/50 bg-seguranca-black/20">
                            <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                                <Users className="mr-2 text-blue-400" size={20} />
                                Escalas e Ocupação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-blue-900/20 border-2 border-dashed border-blue-500/30 rounded-full flex items-center justify-center">
                                <Users className="text-blue-500/50" size={32} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-seguranca-lightgray font-semibold">Módulo de Escalas</p>
                                <p className="text-gray-500 text-sm">Gerencie quem embarca em cada rota em tempo real.</p>
                            </div>
                            <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"> Configurar Escalas</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </StandardLayout>
    );
};

export default CharterDashboard;
