import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleFormSectionProps } from '../types';
import { Users, MapPin, FileText, Phone, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { clientService, Client } from '@/services/clientService';
import { contractService, Contract } from '@/services/contractService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { useQuery } from '@tanstack/react-query';

export const VehicleClientSection: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    // Estado local para postos e contratos específicos do cliente selecionado
    const [clientSpecificPosts, setClientSpecificPosts] = React.useState<WorkPost[]>([]);
    const [clientSpecificContracts, setClientSpecificContracts] = React.useState<Contract[]>([]);

    // Queries
    const { data: clients, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients-for-client-tab'],
        queryFn: () => clientService.getAllClients(),
        retry: 2
    });

    const { data: workPosts, isLoading: workPostsLoading } = useQuery({
        queryKey: ['workPosts'],
        queryFn: () => workPostService.getWorkPosts(),
        retry: 2
    });

    const currentClientId = React.useMemo(() => {
        const candidateId = formData.clientId || formData.empresaId;
        if (!clients || clients.length === 0) return candidateId || '';
        if (candidateId && clients.some(c => c.id === candidateId)) return candidateId;
        const candidateName = (formData.clientName || formData.empresa || '').trim().toLowerCase();
        if (candidateName) {
            const byName = clients.find(c => (c.name || '').trim().toLowerCase() === candidateName);
            if (byName) return byName.id;
        }
        return '';
    }, [clients, formData.clientId, formData.empresaId, formData.clientName, formData.empresa]);

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

    // Carrega postos e contratos específicos ao inicializar se já houver cliente vinculado (com ref de controle para não re-disparar)
    const lastFetchedClientIdRef = React.useRef<string>('');
    React.useEffect(() => {
        if (currentClientId && currentClientId !== lastFetchedClientIdRef.current) {
            lastFetchedClientIdRef.current = currentClientId;
            workPostService.getWorkPostsByClient(currentClientId)
                .then(posts => {
                    if (Array.isArray(posts) && posts.length > 0) {
                        setClientSpecificPosts(posts);
                    }
                })
                .catch(() => {});

            contractService.getContractsByClient(currentClientId)
                .then(cts => {
                    if (Array.isArray(cts) && cts.length > 0) {
                        setClientSpecificContracts(cts);
                    }
                })
                .catch(() => {});
        } else if (!currentClientId && lastFetchedClientIdRef.current) {
            lastFetchedClientIdRef.current = '';
            setClientSpecificPosts([]);
            setClientSpecificContracts([]);
        }
    }, [currentClientId]);

    const availableWorkPosts = React.useMemo(() => {
        if (clientSpecificPosts.length > 0) return clientSpecificPosts;
        if (!workPosts || workPosts.length === 0) return [];
        if (!currentClientId) return workPosts;
        const matching = workPosts.filter((wp: any) => wp.clientId === currentClientId);
        return matching.length > 0 ? matching : workPosts;
    }, [clientSpecificPosts, workPosts, currentClientId]);

    const availableContracts = React.useMemo(() => {
        if (clientSpecificContracts.length > 0) return clientSpecificContracts;
        return contracts || [];
    }, [clientSpecificContracts, contracts]);

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

    const handleClientChange = async (selectedId: string) => {
        if (!selectedId) {
            // Limpa dados vinculados ao cliente
            handleInputChange('clientId', '');
            handleInputChange('clientName', '');
            handleInputChange('empresaId', '');
            handleInputChange('empresa', '');
            handleInputChange('postoDeTrabalho', '');
            handleInputChange('obraSetorNome', '');
            handleInputChange('allocationContractNumber', '');
            handleInputChange('allocationStartDate', '');
            handleInputChange('allocationEndDate', '');
            setClientSpecificPosts([]);
            setClientSpecificContracts([]);
            return;
        }

        const client = clients?.find(c => c.id === selectedId);
        const name = client?.name || '';
        
        // 1. Preenche Nome do Cliente e Empresa
        handleInputChange('clientId', selectedId);
        handleInputChange('clientName', name);
        handleInputChange('empresaId', selectedId);
        handleInputChange('empresa', name);

        // 2. Busca e preenche Posto de Trabalho / Obra Cadastrada e Obra / Setor de Trabalho Alocado
        let postsForClient: WorkPost[] = [];
        try {
            const apiPosts = await workPostService.getWorkPostsByClient(selectedId);
            if (Array.isArray(apiPosts) && apiPosts.length > 0) {
                postsForClient = apiPosts;
            }
        } catch (e) {
            console.warn('Erro ao carregar postos do cliente via API:', e);
        }

        if (postsForClient.length === 0 && workPosts && workPosts.length > 0) {
            postsForClient = workPosts.filter((w: any) => w.clientId === selectedId);
        }

        setClientSpecificPosts(postsForClient);

        if (postsForClient.length > 0) {
            const primaryPost = postsForClient[0];
            handleInputChange('postoDeTrabalho', primaryPost.id);
            handleInputChange('obraSetorNome', primaryPost.name || '');
        } else {
            handleInputChange('postoDeTrabalho', '');
            handleInputChange('obraSetorNome', '');
        }

        // 3. Busca e preenche Contratos do Cliente (Nº Contrato, Data Inicial e Data Final)
        let contractsForClient: Contract[] = [];
        try {
            const apiContracts = await contractService.getContractsByClient(selectedId).catch(async () => {
                return await contractService.getContracts({ clientId: selectedId }).catch(() => []);
            });

            if (Array.isArray(apiContracts) && apiContracts.length > 0) {
                contractsForClient = apiContracts;
            }
        } catch (e) {
            console.warn('Erro ao buscar contratos do cliente:', e);
        }

        setClientSpecificContracts(contractsForClient);

        if (contractsForClient.length > 0) {
            const activeContract = contractsForClient.find(c => c.status === 'ACTIVE') || contractsForClient[0];
            if (activeContract) {
                handleContractSelect(activeContract);
            }
        } else {
            handleInputChange('allocationContractNumber', '');
            handleInputChange('allocationStartDate', '');
            handleInputChange('allocationEndDate', '');
        }
    };

    const clientOptions: SearchableOption[] = React.useMemo(() => {
        if (!clients || clients.length === 0) return [];
        return clients.map(c => {
            const doc = c.cnpj ? `CNPJ: ${c.cnpj}` : '';
            return {
                value: c.id,
                label: c.name,
                subtitle: [doc, c.city, c.state].filter(Boolean).join(' • '),
                badge: c.cnpj ? 'Pessoa Jurídica' : 'Cliente',
                keywords: [c.name, c.tradeName || '', c.cnpj || '', c.city || '', c.state || ''].filter(Boolean)
            };
        });
    }, [clients]);

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/30 p-5 rounded-lg border border-gray-700 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Cliente / Obra / Setor de Alocação</h3>
                            <p className="text-xs text-gray-400">Associe o cliente, a obra/setor de trabalho e o contrato de locação</p>
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
                    {/* Seleção do Cliente com pesquisa a partir de 3 caracteres */}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor="clientSelect" className="text-gray-300 font-medium">
                            Selecionar Cliente Cadastrado
                        </Label>
                        <SearchableSelect
                            options={clientOptions}
                            value={currentClientId || ''}
                            fallbackLabel={formData.clientName || formData.empresa || ''}
                            onChange={handleClientChange}
                            placeholder={clientsLoading ? "Carregando clientes cadastrados..." : "Pesquise por cliente (min. 3 caracteres)..."}
                            searchPlaceholder="Digite ao menos 3 caracteres do nome ou CNPJ..."
                            minSearchLength={3}
                            requireMinLengthToDisplay={true}
                            minSearchHint="Digite os 3 primeiros caracteres para exibir os clientes cadastrados."
                            emptyText="Nenhum cliente cadastrado com esse termo"
                            className="w-full"
                            buttonClassName="bg-gray-900/50 border-gray-600 text-white hover:border-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Nome do Cliente (Edição direta se necessário) */}
                    <div className="space-y-2">
                        <Label htmlFor="clientName" className="text-gray-300 font-medium">Nome do Cliente</Label>
                        <Input
                            id="clientName"
                            value={formData.clientName || ''}
                            onChange={(e) => {
                                handleInputChange('clientName', e.target.value);
                                handleInputChange('empresa', e.target.value);
                            }}
                            placeholder="Nome do cliente onde está alocado"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>

                    {/* Posto de Trabalho / Obra do Cliente */}
                    <div className="space-y-2">
                        <Label htmlFor="clientWorkPost" className="text-gray-300 font-medium">
                            Posto de Trabalho / Obra Cadastrada
                        </Label>
                        <Select
                            value={formData.postoDeTrabalho || ''}
                            onValueChange={(val) => {
                                const wp = availableWorkPosts.find(w => w.id === val);
                                handleInputChange('postoDeTrabalho', val);
                                if (wp?.name) {
                                    handleInputChange('obraSetorNome', wp.name);
                                }
                            }}
                            disabled={workPostsLoading}
                        >
                            <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200">
                                <SelectValue placeholder={formData.obraSetorNome || (availableWorkPosts.length > 0 ? "Selecione a obra / posto..." : "Nenhum posto encontrado")} />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                                {availableWorkPosts.length > 0 ? (
                                    availableWorkPosts.map((wp: WorkPost) => (
                                        <SelectItem key={wp.id} value={wp.id} className="text-white hover:bg-gray-700">
                                            {wp.name} {wp.postCode ? `(${wp.postCode})` : ''}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        Nenhum posto cadastrado para este cliente
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Obra / Setor de Trabalho (Input direto) */}
                    <div className="space-y-2">
                        <Label htmlFor="obraSetorClientTab" className="text-gray-300 font-medium">
                            Obra / Setor de Trabalho Alocado
                        </Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="obraSetorClientTab"
                                value={formData.obraSetorNome || ''}
                                onChange={(e) => handleInputChange('obraSetorNome', e.target.value)}
                                placeholder="Qual obra / setor de trabalho..."
                                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 pl-10 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Seleção de Contrato Associado */}
                    <div className="space-y-2">
                        <Label htmlFor="contractSelect" className="text-gray-300 font-medium">
                            Contratos do Cliente
                        </Label>
                        <Select
                            value={formData.allocationContractNumber || ''}
                            onValueChange={(val) => {
                                const selected = availableContracts.find(c => (c.contractNumber || (c as any).number || c.id) === val);
                                if (selected) {
                                    handleContractSelect(selected);
                                } else {
                                    handleInputChange('allocationContractNumber', val);
                                }
                            }}
                            disabled={contractsLoading}
                        >
                            <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200">
                                <SelectValue placeholder={availableContracts.length > 0 ? "Selecione um contrato..." : "Nenhum contrato encontrado"} />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                                {availableContracts.length > 0 ? (
                                    availableContracts.map((c) => {
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
                        <Label htmlFor="allocationStartDate" className="text-gray-300 font-medium">Data Inicial da Locação</Label>
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
                        <Label htmlFor="allocationEndDate" className="text-gray-300 font-medium">Data Final da Locação (se houver)</Label>
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
                            Os dados de alocação de cliente, obra/setor e contrato são sincronizados automaticamente com as abas Alocação e Locação.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
