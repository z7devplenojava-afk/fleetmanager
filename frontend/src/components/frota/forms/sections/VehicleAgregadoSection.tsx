import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { VehicleFormSectionProps, AggregatedPaymentType } from '../types';
import { UserCheck, DollarSign, FileText, Search, Building2, Plus, Sparkles, Check } from 'lucide-react';
import { contasAPagarService, Supplier, CreateSupplierRequest } from '@/services/contasAPagarService';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import SupplierFormModal from '@/components/estoque/SupplierFormModal';

const PAYMENT_TYPE_OPTIONS: { value: AggregatedPaymentType; label: string; icon: string }[] = [
    { value: 'DAILY', label: 'Diário', icon: '📅' },
    { value: 'MONTHLY', label: 'Mensal', icon: '📆' },
    { value: 'PER_TRIP', label: 'Por Viagem', icon: '🚌' },
    { value: 'PERCENTAGE', label: 'Percentual sobre Faturamento', icon: '📊' },
];

export const VehicleAgregadoSection: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

    // Carrega fornecedores/agregados cadastrados no Contas a Pagar / Fornecedores
    const loadSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const list = await contasAPagarService.getFornecedores();
            setSuppliers(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error('Erro ao carregar fornecedores/agregados:', e);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    useEffect(() => {
        if (formData.isAggregated && suppliers.length === 0) {
            loadSuppliers();
        }
    }, [formData.isAggregated]);

    // Opções de Agregados / Fornecedores formatados para o SearchableSelect
    const supplierOptions: SearchableOption[] = useMemo(() => {
        return suppliers.map((s) => {
            const doc = s.cnpj || s.registrationNumber || '';
            const trade = s.tradeName && s.tradeName !== s.name ? ` (${s.tradeName})` : '';
            return {
                value: s.id,
                label: `${s.name}${trade}`,
                description: [doc, s.phone, s.email].filter(Boolean).join(' • '),
                badge: doc ? (doc.length > 14 ? 'CNPJ' : 'CPF') : 'Agregado',
                keywords: [s.name, s.tradeName || '', doc, s.phone || '', s.email || ''].filter(Boolean),
            };
        });
    }, [suppliers]);

    // Ao selecionar um Agregado da lista, preenche automaticamente os dados do proprietário
    const handleSelectAgregado = (supplierId: string) => {
        const found = suppliers.find((s) => s.id === supplierId);
        if (!found) return;

        handleInputChange('aggregatedOwnerName', found.name || found.tradeName || '');
        if (found.cnpj || found.registrationNumber) {
            handleInputChange('aggregatedOwnerCpfCnpj', found.cnpj || found.registrationNumber || '');
        }
        if (found.phone) {
            handleInputChange('aggregatedOwnerPhone', found.phone);
        }
        if (found.email) {
            handleInputChange('aggregatedOwnerEmail', found.email);
        }
    };

    // Cadastro rápido de novo Fornecedor / Agregado
    const handleCreateSupplier = async (payload: CreateSupplierRequest) => {
        try {
            const created = await contasAPagarService.createFornecedor(payload);
            await loadSuppliers();
            setIsSupplierModalOpen(false);
            if (created) {
                handleSelectAgregado(created.id);
            }
        } catch (e) {
            console.error('Erro ao cadastrar novo agregado:', e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <UserCheck className="h-5 w-5 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Gestão de Agregado</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            id="isAggregated"
                            checked={formData.isAggregated}
                            onCheckedChange={(checked) => handleInputChange('isAggregated', checked)}
                        />
                        <Label htmlFor="isAggregated" className="text-gray-300 text-sm cursor-pointer">
                            Veículo de Agregado
                        </Label>
                    </div>
                </div>

                {formData.isAggregated && (
                    <div className="space-y-6">
                        {/* Seletor Rápido de Agregados / Fornecedores Cadastrados */}
                        <div className="p-3.5 bg-orange-950/20 border border-orange-600/30 rounded-xl space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Vincular a Agregado / Fornecedor (Cadastro Financeiro para Pagamento)
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsSupplierModalOpen(true)}
                                    className="h-7 px-2 text-xs border-orange-500/50 text-orange-300 hover:bg-orange-500/10 flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Novo Agregado / Fornecedor
                                </Button>
                            </div>

                            <p className="text-[11px] text-gray-400">
                                Selecione um agregado cadastrado para preencher automaticamente o nome, CPF/CNPJ, telefone e e-mail. Este vínculo garante que os pagamentos e lançamentos no Contas a Pagar sejam direcionados corretamente.
                            </p>

                            <SearchableSelect
                                options={supplierOptions}
                                value={
                                    suppliers.find(
                                        (s) =>
                                            s.name === formData.aggregatedOwnerName ||
                                            (formData.aggregatedOwnerCpfCnpj && (s.cnpj === formData.aggregatedOwnerCpfCnpj || s.registrationNumber === formData.aggregatedOwnerCpfCnpj))
                                    )?.id || ''
                                }
                                onChange={handleSelectAgregado}
                                placeholder={loadingSuppliers ? 'Carregando lista de agregados...' : 'Pesquise por nome, CPF/CNPJ ou telefone do agregado...'}
                                searchPlaceholder="Digitar nome ou CPF/CNPJ..."
                                emptyMessage="Nenhum agregado encontrado. Cadastre no botão ao lado."
                                className="bg-gray-900 border-gray-600 text-white"
                            />
                        </div>

                        {/* Dados do Proprietário */}
                        <div>
                            <p className="text-xs text-orange-400 uppercase tracking-wider mb-3 font-medium">Dados do Proprietário</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="aggregatedOwnerName" className="text-gray-300 font-medium">Nome do Proprietário *</Label>
                                    <Input
                                        id="aggregatedOwnerName"
                                        value={formData.aggregatedOwnerName}
                                        onChange={(e) => handleInputChange('aggregatedOwnerName', e.target.value)}
                                        placeholder="Nome completo ou Razão Social"
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="aggregatedOwnerCpfCnpj" className="text-gray-300 font-medium">CPF / CNPJ</Label>
                                    <Input
                                        id="aggregatedOwnerCpfCnpj"
                                        value={formData.aggregatedOwnerCpfCnpj}
                                        onChange={(e) => handleInputChange('aggregatedOwnerCpfCnpj', e.target.value)}
                                        placeholder="000.000.000-00"
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="aggregatedOwnerPhone" className="text-gray-300 font-medium">Telefone</Label>
                                    <Input
                                        id="aggregatedOwnerPhone"
                                        value={formData.aggregatedOwnerPhone}
                                        onChange={(e) => handleInputChange('aggregatedOwnerPhone', e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="aggregatedOwnerEmail" className="text-gray-300 font-medium">E-mail</Label>
                                    <Input
                                        id="aggregatedOwnerEmail"
                                        type="email"
                                        value={formData.aggregatedOwnerEmail}
                                        onChange={(e) => handleInputChange('aggregatedOwnerEmail', e.target.value)}
                                        placeholder="email@exemplo.com"
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Valores e Pagamento */}
                        <div>
                            <p className="text-xs text-orange-400 uppercase tracking-wider mb-3 font-medium flex items-center gap-1">
                                <DollarSign className="h-3 w-3" /> Valores e Pagamento
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="aggregatedPaymentType" className="text-gray-300 font-medium">Tipo de Pagamento</Label>
                                    <Select value={formData.aggregatedPaymentType} onValueChange={(value) => handleInputChange('aggregatedPaymentType', value)}>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-600">
                                            {PAYMENT_TYPE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.icon} {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="aggregatedDailyRate" className="text-gray-300 font-medium">Valor Diário (R$)</Label>
                                    <Input
                                        id="aggregatedDailyRate"
                                        type="number"
                                        step="0.01"
                                        value={formData.aggregatedDailyRate}
                                        onChange={(e) => handleInputChange('aggregatedDailyRate', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        placeholder="Ex: 350.00"
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="aggregatedMonthlyRate" className="text-gray-300 font-medium">Valor Mensal (R$)</Label>
                                    <Input
                                        id="aggregatedMonthlyRate"
                                        type="number"
                                        step="0.01"
                                        value={formData.aggregatedMonthlyRate}
                                        onChange={(e) => handleInputChange('aggregatedMonthlyRate', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        placeholder="Ex: 8500.00"
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contrato */}
                        <div>
                            <p className="text-xs text-orange-400 uppercase tracking-wider mb-3 font-medium flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Contrato
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="aggregatedContractStartDate" className="text-gray-300 font-medium">Data Início Contrato</Label>
                                    <Input
                                        id="aggregatedContractStartDate"
                                        type="date"
                                        value={formData.aggregatedContractStartDate}
                                        onChange={(e) => handleInputChange('aggregatedContractStartDate', e.target.value)}
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="aggregatedContractEndDate" className="text-gray-300 font-medium">Data Término Contrato</Label>
                                    <Input
                                        id="aggregatedContractEndDate"
                                        type="date"
                                        value={formData.aggregatedContractEndDate}
                                        onChange={(e) => handleInputChange('aggregatedContractEndDate', e.target.value)}
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="aggregatedNotes" className="text-gray-300 font-medium">Observações do Agregado</Label>
                                    <Textarea
                                        id="aggregatedNotes"
                                        value={formData.aggregatedNotes}
                                        onChange={(e) => handleInputChange('aggregatedNotes', e.target.value)}
                                        placeholder="Condições especiais, regras, etc."
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 min-h-[80px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!formData.isAggregated && (
                    <div className="p-4 bg-gray-900/30 border border-gray-700 rounded-lg text-center">
                        <UserCheck className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                            Este veículo é <span className="text-green-400 font-semibold">da Empresa</span>.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Ative a opção "Veículo de Agregado" se o veículo pertence a um terceiro.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal para cadastrar novo fornecedor/agregado diretamente se não existir */}
            {isSupplierModalOpen && (
                <SupplierFormModal
                    isOpen={isSupplierModalOpen}
                    onClose={() => setIsSupplierModalOpen(false)}
                    onSave={handleCreateSupplier}
                />
            )}
        </div>
    );
};
