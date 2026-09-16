import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleFormSectionProps } from '../types';
import { Users, MapPin, FileText, Phone, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { clientService, Client } from '@/services/clientService';
import { contractService, Contract } from '@/services/contractService';
import { useQuery } from '@tanstack/react-query';

export const VehicleClientSection: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    // Queries
    const { data: clients, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients-for-client-tab'],
        queryFn: () => clientService.getAllClients(),
        retry: 2
    });

    const currentClientId = formData.clientId || formData.empresaId;

    const { data: contracts, isLoading: contractsLoading } = useQuery({
        queryKey: ['contracts-for-client-tab', currentClientId],
        queryFn: () => contractService.getContracts(currentClientId ? { clientId: currentClientId } : {}),
        enabled: true,
        retry: 2
    });

    const selectedClient = React.useMemo(() => {
        if (!clients || !currentClientId) return null;
        return clients.find(c => c.id === currentClientId) || null;
    }, [clients, currentClientId]);

    const handleClientChange = (selectedId: string) => {
        const client = clients?.find(c => c.id === selectedId);
        const name = client?.name || '';
        handleInputChange('clientId', selectedId);
        handleInputChange('clientName', name);
        handleInputChange('empresaId', selectedId);
        handleInputChange('empresa', name);

        // Se encontrar contratos, sugere o primeiro ou ativo
        const clientContracts = contracts?.filter(c => c.clientId === selectedId);
        if (clientContracts && clientContracts.length > 0) {
            const activeContract = clientContracts.find(c => c.status === 'ACTIVE') || clientContracts[0];
            if (activeContract) {
                handleContractSelect(activeContract);
            }
        }
    };

    const handleContractSelect = (contract: Contract) => {
        if (!contract) return;
        const num = contract.contractNumber || (contract as any).number || '';
        handleInputChange('allocationContractNumber', num);
        if (contract.startDate) {
            handleInputChange('allocationStartDate', contract.startDate.split('T')[0]);
        }
        if (contract.endDate) {
            handleInputChange('allocationEndDate', contract.endDate.split('T')[0]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/30 p-5 rounded-lg border border-gray-700 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Cliente / Alocação do Veículo</h3>
                            <p className="text-xs text-gray-400">Associe o cliente e o contrato de prestação de serviços ou locação</p>
                        </div>
                    </div>
                    {selectedClient && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30 border border-green-700/50 rounded-full text-green-400 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Cliente Selecionado
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Seleção do Cliente */}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor="clientSelect" className="text-gray-300 font-medium">
                            Selecionar Cliente Cadastrado
                        </Label>
                        <Select
                            value={currentClientId || ''}
                            onValueChange={handleClientChange}
                            disabled={clientsLoading}
                        >
                            <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200">
                                <SelectValue placeholder="Selecione um cliente..." />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                                {clients?.map((client: Client) => (
                                    <SelectItem key={client.id} value={client.id} className="text-white hover:bg-gray-700">
                                        {client.name} {client.cnpj ? `(${client.cnpj})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nome do Cliente (Edição direta se necessário) */}
                    <div className="space-y-2">
                        <Label htmlFor="clientName" className="text-gray-300 font-medium">Nome do Cliente</Label>
                        <Input
                            id="clientName"
                            value={formData.clientName || ''}
                            onChange={(e) => handleInputChange('clientName', e.target.value)}
                            placeholder="Nome do cliente onde está alocado"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>

                    {/* Seleção de Contrato Associado */}
                    <div className="space-y-2">
                        <Label htmlFor="contractSelect" className="text-gray-300 font-medium">
                            Contratos do Cliente
                        </Label>
                        <Select
                            value={formData.allocationContractNumber || ''}
                            onValueChange={(val) => {
                                const selected = contracts?.find(c => (c.contractNumber || (c as any).number) === val);
                                if (selected) {
                                    handleContractSelect(selected);
                                } else {
                                    handleInputChange('allocationContractNumber', val);
                                }
                            }}
                            disabled={contractsLoading}
                        >
                            <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200">
                                <SelectValue placeholder={contracts && contracts.length > 0 ? "Selecione um contrato..." : "Nenhum contrato encontrado"} />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                                {contracts && contracts.length > 0 ? (
                                    contracts.map((c) => {
                                        const cNum = c.contractNumber || (c as any).number || c.id;
                                        return (
                                            <SelectItem key={c.id} value={cNum} className="text-white hover:bg-gray-700">
                                                {cNum} {c.description ? `— ${c.description}` : ''} ({c.status})
                                            </SelectItem>
                                        );
                                    })
                                ) : (
                                    <SelectItem value="none" disabled>
                                        Nenhum contrato associado a este cliente
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nº Contrato Alocação (Input livre) */}
                    <div className="space-y-2">
                        <Label htmlFor="allocationContractNumber" className="text-gray-300 font-medium">Nº Contrato Alocação</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="allocationContractNumber"
                                value={formData.allocationContractNumber || ''}
                                onChange={(e) => handleInputChange('allocationContractNumber', e.target.value)}
                                placeholder="Número do contrato"
                                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 pl-10 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Data Início Alocação */}
                    <div className="space-y-2">
                        <Label htmlFor="allocationStartDate" className="text-gray-300 font-medium">Data Início Alocação</Label>
                        <Input
                            id="allocationStartDate"
                            type="date"
                            value={formData.allocationStartDate || ''}
                            onChange={(e) => handleInputChange('allocationStartDate', e.target.value)}
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>

                    {/* Data Término Alocação */}
                    <div className="space-y-2">
                        <Label htmlFor="allocationEndDate" className="text-gray-300 font-medium">Data Término Alocação</Label>
                        <Input
                            id="allocationEndDate"
                            type="date"
                            value={formData.allocationEndDate || ''}
                            onChange={(e) => handleInputChange('allocationEndDate', e.target.value)}
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Card com Detalhes do Cliente Selecionado */}
                {selectedClient && (
                    <div className="p-4 bg-gray-900/60 border border-indigo-500/30 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
                            <Building2 className="h-4 w-4" />
                            <span>Informações do Cliente Selecionado</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-300">
                            <div>
                                <span className="text-gray-400 block mb-0.5">Razão Social / Nome:</span>
                                <span className="font-medium text-white">{selectedClient.name}</span>
                            </div>
                            {selectedClient.cnpj && (
                                <div>
                                    <span className="text-gray-400 block mb-0.5">CNPJ:</span>
                                    <span className="font-medium text-white">{selectedClient.cnpj}</span>
                                </div>
                            )}
                            {selectedClient.phone && (
                                <div className="flex items-start gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="text-gray-400 block mb-0.5">Telefone:</span>
                                        <span className="font-medium text-white">{selectedClient.phone}</span>
                                    </div>
                                </div>
                            )}
                            {selectedClient.email && (
                                <div className="flex items-start gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="text-gray-400 block mb-0.5">Email:</span>
                                        <span className="font-medium text-white truncate max-w-[180px] inline-block">{selectedClient.email}</span>
                                    </div>
                                </div>
                            )}
                            {selectedClient.address && (
                                <div className="sm:col-span-2 flex items-start gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="text-gray-400 block mb-0.5">Endereço:</span>
                                        <span className="font-medium text-white">{selectedClient.address}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-indigo-300">
                            Os dados de alocação de cliente e contrato são sincronizados com a aba Alocação e refletem nos relatórios e ordens de serviço.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
