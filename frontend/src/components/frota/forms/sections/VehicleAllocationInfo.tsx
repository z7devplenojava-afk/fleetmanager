import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, MapPin, Settings, User, Warehouse } from 'lucide-react';
import { VehicleFormSectionProps } from '../types';
import { workPostService, WorkPost } from '@/services/workPostService';
import { clientService } from '@/services/clientService';
import { contractService } from '@/services/contractService';
import { departmentService, Department } from '@/services/departmentService';
import { employeeService } from '@/services/employeeService';
import { garageService, Garage } from '@/services/garageService';
import { rentalInvoiceService } from '@/services/rentalInvoiceService';
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

    const { data: rentalInvoices } = useQuery({
        queryKey: ['rental-invoices-for-vehicle-alloc'],
        queryFn: () => rentalInvoiceService.list(),
        staleTime: 30000,
        retry: 1
    });

    // Resolve clientId válido (somente se existir na lista de clientes)
    const validClientId = React.useMemo(() => {
        const candidateId = formData.clientId || formData.empresaId;
        if (!clients || clients.length === 0) return candidateId || '';
        if (candidateId && clients.some(c => c.id === candidateId)) {
            return candidateId;
        }
        // Tenta resolver pelo nome do cliente se o ID não bater (ex: tenant companyId antigo)
        const candidateName = (formData.clientName || formData.empresa || '').trim().toLowerCase();
        if (candidateName) {
            const byName = clients.find(c => (c.name || '').trim().toLowerCase() === candidateName);
            if (byName) return byName.id;
        }
        return '';
    }, [clients, formData.clientId, formData.empresaId, formData.clientName, formData.empresa]);

    // Auto-sincronização: quando o veículo está alocado via Fatura de Locação, Posto de Trabalho ou Nome de Cliente,
    // preenche automaticamente Empresa/Cliente e Posto de Trabalho/Obra
    useEffect(() => {
        if (!clients || clients.length === 0) return;

        let resolvedClientId = validClientId;
        let resolvedClientName = formData.clientName || formData.empresa || '';
        let resolvedWorkPostId = formData.postoDeTrabalho || '';
        let resolvedWorkPostName = formData.obraSetorNome || '';
        let resolvedContractNumber = formData.allocationContractNumber || '';
        let resolvedStartDate = formData.allocationStartDate || '';
        let resolvedEndDate = formData.allocationEndDate || '';

        // 1. Se tem postoDeTrabalho selecionado, descobre o cliente e o nome da obra
        if (resolvedWorkPostId && workPosts && workPosts.length > 0) {
            const wp = workPosts.find(w => w.id === resolvedWorkPostId);
            if (wp) {
                if (!resolvedWorkPostName && wp.name) {
                    resolvedWorkPostName = wp.name;
                }
                if (!resolvedClientId && wp.clientId) {
                    const cl = clients.find(c => c.id === wp.clientId);
                    if (cl) {
                        resolvedClientId = cl.id;
                        resolvedClientName = cl.name;
                    }
                }
            }
        }

        // 2. Se ainda não tem cliente (ou datas), verifica nas Faturas de Locação pela placa ou vehicleId
        if (rentalInvoices && rentalInvoices.length > 0 && (formData.placa || formData.vehicleId)) {
            const cleanPlate = (formData.placa || '').trim().toUpperCase();
            const matchingInvoice = rentalInvoices.find(inv =>
                inv.items?.some(
                    item =>
                        (formData.vehicleId && item.vehicleId === formData.vehicleId) ||
                        (cleanPlate && (item.plate || '').trim().toUpperCase() === cleanPlate)
                )
            );
            if (matchingInvoice) {
                if (!resolvedClientId && matchingInvoice.clientId) {
                    const cl = clients.find(c => c.id === matchingInvoice.clientId);
                    resolvedClientId = cl?.id || matchingInvoice.clientId;
                    resolvedClientName = cl?.name || matchingInvoice.clientName || resolvedClientName;
                }
                if (!resolvedContractNumber && matchingInvoice.contractNumber) {
                    resolvedContractNumber = matchingInvoice.contractNumber;
                }
                if (!resolvedStartDate && matchingInvoice.periodStart) {
                    resolvedStartDate = matchingInvoice.periodStart.substring(0, 10);
                }
                if (!resolvedEndDate && matchingInvoice.periodEnd) {
                    resolvedEndDate = matchingInvoice.periodEnd.substring(0, 10);
                }
            }
        }

        // 3. Se já temos o cliente e ainda não temos postoDeTrabalho, seleciona automaticamente a obra/setor do cliente
        if (resolvedClientId && !resolvedWorkPostId && workPosts && workPosts.length > 0) {
            const clientPosts = workPosts.filter((wp: any) => wp.clientId === resolvedClientId);
            if (clientPosts.length > 0) {
                resolvedWorkPostId = clientPosts[0].id;
                if (!resolvedWorkPostName) {
                    resolvedWorkPostName = clientPosts[0].name || '';
                }
            }
        }

        if (resolvedClientId && resolvedClientId !== formData.clientId) {
            handleInputChange('clientId', resolvedClientId);
            handleInputChange('empresaId', resolvedClientId);
        }
        if (resolvedClientName && resolvedClientName !== formData.clientName) {
            handleInputChange('clientName', resolvedClientName);
            handleInputChange('empresa', resolvedClientName);
        }
        if (resolvedWorkPostId && resolvedWorkPostId !== formData.postoDeTrabalho) {
            handleInputChange('postoDeTrabalho', resolvedWorkPostId);
        }
        if (resolvedWorkPostName && resolvedWorkPostName !== formData.obraSetorNome) {
            handleInputChange('obraSetorNome', resolvedWorkPostName);
        }
        if (resolvedContractNumber && !formData.allocationContractNumber) {
            handleInputChange('allocationContractNumber', resolvedContractNumber);
        }
        if (resolvedStartDate && !formData.allocationStartDate) {
            handleInputChange('allocationStartDate', resolvedStartDate);
        }
        if (resolvedEndDate && !formData.allocationEndDate) {
            handleInputChange('allocationEndDate', resolvedEndDate);
        }
    }, [
        clients,
        workPosts,
        rentalInvoices,
        validClientId,
        formData.placa,
        formData.vehicleId,
        formData.postoDeTrabalho,
    ]);

    // Obras filtradas pelo cliente/empresa selecionada
    const filteredWorkPosts = React.useMemo(() => {
        if (!workPosts || workPosts.length === 0) return [];
        if (!validClientId) return workPosts;
        const matching = workPosts.filter((wp: any) => wp.clientId === validClientId);
        return matching.length > 0 ? matching : workPosts;
    }, [workPosts, validClientId]);

    const handleClientChange = async (selectedId: string) => {
        const selectedClient = clients?.find(c => c.id === selectedId);
        const name = selectedClient?.name || '';
        handleInputChange('empresaId', selectedId);
        handleInputChange('empresa', name);
        handleInputChange('clientId', selectedId);
        handleInputChange('clientName', name);

        // Seleciona automaticamente a obra/setor do cliente (ou limpa se pertencer a outro cliente)
        if (workPosts && workPosts.length > 0) {
            const clientPosts = workPosts.filter((w: any) => w.clientId === selectedId);
            if (clientPosts.length > 0) {
                handleInputChange('postoDeTrabalho', clientPosts[0].id);
                handleInputChange('obraSetorNome', clientPosts[0].name || '');
            } else if (formData.postoDeTrabalho) {
                const currentWp = workPosts.find(w => w.id === formData.postoDeTrabalho);
                if (currentWp && currentWp.clientId && currentWp.clientId !== selectedId) {
                    handleInputChange('postoDeTrabalho', '');
                }
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
                    if ((activeContract as any).unitVehicleValue) {
                        handleInputChange('rentalMonthlyRate', Number((activeContract as any).unitVehicleValue) || 0);
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
                        value={validClientId}
                        onValueChange={handleClientChange}
                        disabled={clientsLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder={formData.clientName || "Selecione um cliente / empresa"} />
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
                            if (wp?.name) {
                                handleInputChange('obraSetorNome', wp.name);
                            }
                            if (wp && wp.clientId && wp.clientId !== validClientId) {
                                handleClientChange(wp.clientId);
                            }
                        }}
                        disabled={workPostsLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder={formData.obraSetorNome || (validClientId ? "Selecione o posto da empresa…" : "Selecione um posto / obra")} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                            {filteredWorkPosts.length > 0 ? (
                                filteredWorkPosts.map((wp: WorkPost) => (
                                    <SelectItem key={wp.id} value={wp.id} className="text-white hover:bg-gray-700">
                                        {wp.name} {wp.postCode ? `(${wp.postCode})` : ''} {!validClientId && wp.clientName ? `— ${wp.clientName}` : ''}
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

            {/* Obra / Setor de Trabalho Específico (editável / sincronizado) */}
            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="obraSetorNome" className="text-gray-300 font-medium">
                    Obra / Setor de Trabalho Alocado
                </Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <Input
                        id="obraSetorNome"
                        value={formData.obraSetorNome || ''}
                        onChange={(e) => handleInputChange('obraSetorNome', e.target.value)}
                        placeholder="Informe ou confirme a Obra / Setor de Trabalho onde o veículo está alocado..."
                        className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                    />
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
                        <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
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
                        <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
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
