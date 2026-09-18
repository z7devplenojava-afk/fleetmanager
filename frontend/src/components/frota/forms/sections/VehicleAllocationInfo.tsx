import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Settings, User, Warehouse } from 'lucide-react';
import { VehicleFormSectionProps } from '../types';
import { workPostService, WorkPost } from '@/services/workPostService';
import { clientService } from '@/services/clientService';
import { contractService } from '@/services/contractService';
import { departmentService, Department } from '@/services/departmentService';
import { employeeService } from '@/services/employeeService';
import { garageService, Garage } from '@/services/garageService';
import { useQuery } from '@tanstack/react-query';

export const VehicleAllocationInfo: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {

    // Queries
    const { data: clients, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients-for-allocation'],
        queryFn: () => clientService.getAllClients(),
        retry: 2
    });

    const { data: workPosts, isLoading: workPostsLoading } = useQuery({
        queryKey: ['workPosts'],
        queryFn: () => workPostService.getWorkPosts(),
        retry: 2
    });

    const { data: departments, isLoading: departmentsLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: () => departmentService.listActive(),
        retry: 2
    });

    const { data: employees, isLoading: employeesLoading } = useQuery({
        queryKey: ['employees', 'ACTIVE'],
        queryFn: () => employeeService.getEmployeesByStatus('ACTIVE'),
        retry: 2
    });

    const { data: garages, isLoading: garagesLoading } = useQuery({
        queryKey: ['garages-for-vehicle'],
        queryFn: () => garageService.list(),
        retry: 2
    });

    // Obras filtradas pelo cliente/empresa selecionada
    const currentClientId = formData.clientId || formData.empresaId;
    const filteredWorkPosts = React.useMemo(() => {
        if (!workPosts || workPosts.length === 0) return [];
        if (!currentClientId) return workPosts;
        const matching = workPosts.filter((wp: any) => wp.clientId === currentClientId);
        return matching.length > 0 ? matching : workPosts;
    }, [workPosts, currentClientId]);

    const handleClientChange = async (selectedId: string) => {
        const selectedClient = clients?.find(c => c.id === selectedId);
        const name = selectedClient?.name || '';
        handleInputChange('empresaId', selectedId);
        handleInputChange('empresa', name);
        handleInputChange('clientId', selectedId);
        handleInputChange('clientName', name);

        // Se o posto atual não pertencer ao novo cliente, limpa
        if (formData.postoDeTrabalho) {
            const currentWp = workPosts?.find(w => w.id === formData.postoDeTrabalho);
            if (currentWp && currentWp.clientId && currentWp.clientId !== selectedId) {
                handleInputChange('postoDeTrabalho', '');
            }
        }

        // Buscar contratos associados ao cliente para preenchimento automático
        try {
            const contracts = await contractService.getContracts({ clientId: selectedId });
            if (contracts && contracts.length > 0) {
                const activeContract = contracts.find((c: any) => c.status === 'ACTIVE') || contracts[0];
                if (activeContract) {
                    if (activeContract.contractNumber || (activeContract as any).number) {
                        handleInputChange('allocationContractNumber', activeContract.contractNumber || (activeContract as any).number);
                    }
                    if (activeContract.startDate) {
                        handleInputChange('allocationStartDate', activeContract.startDate.split('T')[0]);
                    }
                    if (activeContract.endDate) {
                        handleInputChange('allocationEndDate', activeContract.endDate.split('T')[0]);
                    }
                }
            }
        } catch (error) {
            console.warn('Não foi possível carregar contratos do cliente:', error);
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Empresa / Cliente */}
            <div className="space-y-2">
                <Label htmlFor="empresa" className="text-gray-300 font-medium">Empresa / Cliente</Label>
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                        value={formData.clientId || formData.empresaId || ''}
                        onValueChange={handleClientChange}
                        disabled={clientsLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione um cliente / empresa" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                            {clients?.map((client) => (
                                <SelectItem key={client.id} value={client.id} className="text-white hover:bg-gray-700">
                                    {client.name} {client.cnpj ? `(${client.cnpj})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Posto de Trabalho / Obra */}
            <div className="space-y-2">
                <Label htmlFor="postoDeTrabalho" className="text-gray-300 font-medium">Posto de Trabalho / Obra</Label>
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                        value={formData.postoDeTrabalho || ''}
                        onValueChange={(value) => {
                            const wp = workPosts?.find(w => w.id === value);
                            handleInputChange('postoDeTrabalho', value);
                            if (wp && wp.clientId && !formData.clientId) {
                                handleClientChange(wp.clientId);
                            }
                        }}
                        disabled={workPostsLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder={currentClientId ? "Selecione o posto da empresa…" : "Selecione um posto / obra"} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                            {filteredWorkPosts.length > 0 ? (
                                filteredWorkPosts.map((wp: WorkPost) => (
                                    <SelectItem key={wp.id} value={wp.id} className="text-white hover:bg-gray-700">
                                        {wp.name} {wp.postCode ? `(${wp.postCode})` : ''} {!currentClientId && wp.clientName ? `— ${wp.clientName}` : ''}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>
                                    Nenhum posto cadastrado para esta empresa
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Garagem */}
            <div className="space-y-2">
                <Label htmlFor="garagem" className="text-gray-300 font-medium">Garagem (pátio/base)</Label>
                <div className="relative">
                    <Warehouse className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                        value={formData.garagem || ''}
                        onValueChange={(value) => {
                            const garage = garages?.find(g => g.id === value);
                            if (garage?.atCapacity) {
                                return;
                            }
                            handleInputChange('garagem', value);
                            if (garage) {
                                handleInputChange('garagemNome', garage.name);
                            }
                        }}
                        disabled={garagesLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione a garagem onde o veículo fica recolhido" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                            {garages && garages.filter(g => g.active !== false).length > 0 ? (
                                garages.filter(g => g.active !== false).map((g: Garage) => (
                                    <SelectItem key={g.id} value={g.id} disabled={g.atCapacity} className="text-white hover:bg-gray-700">
                                        {g.name}{g.capacity ? ` (${g.vehicleCount ?? 0}/${g.capacity})` : ''}
                                        {g.atCapacity ? ' 🚨 LOTADA' : g.nearCapacity ? ' ⚠️' : ''}
                                        {g.responsibleName ? ` — resp.: ${g.responsibleName}` : ''}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>
                                    Nenhuma garagem cadastrada
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    {(() => {
                        const chosen = garages?.find(g => g.id === formData.garagem);
                        if (chosen?.atCapacity) {
                            return (
                                <p className="text-xs text-red-400 mt-1">
                                    🚨 Garagem lotada ({chosen.vehicleCount}/{chosen.capacity} vagas) — escolha outra garagem.
                                </p>
                            );
                        }
                        if (chosen?.nearCapacity) {
                            return (
                                <p className="text-xs text-amber-400 mt-1">
                                    ⚠️ Atenção: {chosen.occupancyRate}% da capacidade ({chosen.vehicleCount}/{chosen.capacity} vagas).
                                </p>
                            );
                        }
                        return null;
                    })()}
                </div>
            </div>

            {/* Departamento */}
            <div className="space-y-2">
                <Label htmlFor="departamento" className="text-gray-300 font-medium">Departamento</Label>
                <div className="relative">
                    <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                        value={formData.departmentId}
                        onValueChange={(value) => {
                            const selectedDepartment = departments?.find(d => d.id === value);
                            handleInputChange('departmentId', value);
                            handleInputChange('departamento', selectedDepartment?.name || '');
                        }}
                        disabled={departmentsLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                            {departments?.map((dept: Department) => (
                                <SelectItem key={dept.id} value={dept.id} className="text-white hover:bg-gray-700">
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Responsável */}
            <div className="space-y-2">
                <Label htmlFor="responsavel" className="text-gray-300 font-medium">Responsável</Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                        value={formData.responsavel}
                        onValueChange={(value) => handleInputChange('responsavel', value)}
                        disabled={employeesLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                            {employees?.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id} className="text-white hover:bg-gray-700">
                                    {emp.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

        </div>
    );
};
