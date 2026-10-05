import React, { useState } from 'react';
import { VehicleFormSectionProps } from '../types';
import { useQuery } from '@tanstack/react-query';
import fleetService from '@/services/fleetService';
import { Fine } from '@/types/fleet';
import {
    AlertTriangle,
    ShieldAlert,
    DollarSign,
    CheckCircle2,
    Calendar,
    MapPin,
    Search,
    RefreshCw,
    FileText,
    AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';

export const VehicleFinesSection: React.FC<VehicleFormSectionProps> = ({ formData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const vehicleId = formData.vehicleId || '';
    const plate = formData.placa?.toUpperCase() || '';

    // Buscar multas do veículo
    const { data: fines, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['vehicle-fines', vehicleId, plate],
        queryFn: async () => {
            let finesList: Fine[] = [];
            if (vehicleId) {
                try {
                    finesList = await fleetService.getFines(vehicleId);
                } catch (err) {
                    console.warn('Erro ao buscar multas por vehicleId:', err);
                }
            }
            // Se não encontrou por vehicleId ou não tem vehicleId, tenta buscar e cruzar por placa/ID
            if ((!finesList || finesList.length === 0) && (plate || vehicleId)) {
                try {
                    const allFines = await fleetService.getFines();
                    const cleanPlate = plate.replace(/[^A-Z0-9]/g, '');
                    finesList = (allFines || []).filter(f => {
                        if (vehicleId && (f as any).vehicleId === vehicleId) return true;
                        if (cleanPlate && f.licensePlate) {
                            return f.licensePlate.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlate;
                        }
                        return false;
                    });
                } catch (err) {
                    console.warn('Erro ao buscar multas gerais:', err);
                }
            }
            return finesList || [];
        },
        enabled: Boolean(vehicleId || plate),
        retry: 1
    });

    const filteredFines = React.useMemo(() => {
        if (!fines) return [];
        if (!searchTerm.trim()) return fines;
        const term = searchTerm.toLowerCase();
        return fines.filter(
            f =>
                f.infractionType?.toLowerCase().includes(term) ||
                f.location?.toLowerCase().includes(term) ||
                (f as any).fineNumber?.toLowerCase().includes(term) ||
                f.driverName?.toLowerCase().includes(term)
        );
    }, [fines, searchTerm]);

    // Estatísticas
    const stats = React.useMemo(() => {
        if (!fines || fines.length === 0) {
            return { total: 0, totalValue: 0, pending: 0, pendingValue: 0, points: 0 };
        }
        const total = fines.length;
        const totalValue = fines.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const pendingFines = fines.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE' || (f.status as string) === 'pendente');
        const pending = pendingFines.length;
        const pendingValue = pendingFines.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const points = fines.reduce((sum, f) => sum + (Number(f.points) || 0), 0);
        return { total, totalValue, pending, pendingValue, points };
    }, [fines]);

    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PAID':
            case 'PAGA':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-900/40 text-green-300 border border-green-700/50">
                        <CheckCircle2 className="h-3 w-3" /> Paga
                    </span>
                );
            case 'OVERDUE':
            case 'VENCIDA':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-900/40 text-red-300 border border-red-700/50">
                        <AlertTriangle className="h-3 w-3" /> Vencida
                    </span>
                );
            case 'APPEAL':
            case 'RECURSO':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-900/40 text-purple-300 border border-purple-700/50">
                        <FileText className="h-3 w-3" /> Em Recurso
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-900/40 text-amber-300 border border-amber-700/50">
                        <AlertCircle className="h-3 w-3" /> Pendente
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header com KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total de Multas */}
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Total de Multas</p>
                        <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
                    </div>
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                </div>

                {/* Multas Pendentes */}
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Pendentes / A Pagar</p>
                        <p className="text-xl font-bold text-amber-400 mt-1">{stats.pending}</p>
                    </div>
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                </div>

                {/* Valor Total */}
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Valor Total</p>
                        <p className="text-lg font-bold text-white mt-1">{formatCurrency(stats.totalValue)}</p>
                    </div>
                    <div className="p-2.5 bg-green-500/10 text-green-400 rounded-lg">
                        <DollarSign className="h-5 w-5" />
                    </div>
                </div>

                {/* Pontos CNH */}
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Pontos Acumulados</p>
                        <p className="text-xl font-bold text-red-400 mt-1">{stats.points} pts</p>
                    </div>
                    <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Ações e Barra de Busca */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por infração, local ou condutor..."
                        className="bg-gray-800/80 border-gray-600 text-white pl-9 h-9 text-xs focus:border-red-500"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300 text-xs h-9 flex items-center gap-1.5"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                        Atualizar Histórico
                    </Button>
                </div>
            </div>

            {/* Tabela do Histórico de Multas */}
            <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900/30">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-gray-800/70 text-gray-400 uppercase font-semibold text-[11px] border-b border-gray-700">
                            <tr>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Auto / Infração</th>
                                <th className="px-4 py-3">Local</th>
                                <th className="px-4 py-3">Condutor</th>
                                <th className="px-4 py-3">Pontos</th>
                                <th className="px-4 py-3">Valor</th>
                                <th className="px-4 py-3">Vencimento</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/60">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-red-400" />
                                        Carregando histórico de multas...
                                    </td>
                                </tr>
                            ) : filteredFines.length > 0 ? (
                                filteredFines.map((fine: Fine) => {
                                    const fineDate = fine.date ? new Date(fine.date).toLocaleDateString('pt-BR') : '-';
                                    const dueDate = fine.dueDate ? new Date(fine.dueDate).toLocaleDateString('pt-BR') : '-';

                                    return (
                                        <tr key={fine.id} className="hover:bg-gray-800/40 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-white font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    {fineDate}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-white">{fine.infractionType || 'Infração de Trânsito'}</div>
                                                {(fine as any).fineNumber && (
                                                    <div className="text-[10px] text-gray-400">Auto: {(fine as any).fineNumber}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-gray-300 truncate max-w-[180px]">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                    {fine.location || 'Não informado'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">
                                                {fine.driverName || 'Não identificado'}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-red-400">
                                                {fine.points || 0} pts
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-white">
                                                {formatCurrency(Number(fine.amount) || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {dueDate}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(fine.status)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                        <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-gray-500 opacity-60" />
                                        Nenhuma multa registrada para este veículo.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
