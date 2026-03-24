import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { StockItem, CreateStockItemDTO, StockCategory, StockCategoryLabels } from '@/types/stock';
import { stockService } from '@/services/stockService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Hash, 
  Tag, 
  Ruler, 
  FileText, 
  Box, 
  DollarSign, 
  Building2, 
  Barcode, 
  Sparkles,
  Plus,
  Search,
  Check,
  ChevronsUpDown
} from 'lucide-react';

interface StockItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: StockItem | null;
  onSave: () => void;
}

const StockItemModal: React.FC<StockItemModalProps> = ({
  open,
  onOpenChange,
  item,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierComboboxOpen, setSupplierComboboxOpen] = useState(false);
  const [unitCostDisplay, setUnitCostDisplay] = useState('');
  const [formData, setFormData] = useState<CreateStockItemDTO>({
    code: '',
    name: '',
    category: StockCategory.UNIFORME_VIGILANCIA,
    sizeVariation: '',
    description: '',
    currentQuantity: 0,
    minimumQuantity: 0,
    unitCost: 0,
    supplier: '',
    barcode: '',
    notes: ''
  });

  const formatCurrency = (value: string): string => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    if (!digits) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const number = parseInt(digits, 10) / 100;
    
    // Formata no padrão brasileiro: 1.255,45
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (value: string): number => {
    // Remove pontos e substitui vírgula por ponto
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const formatCurrencyFromNumber = (value: number): string => {
    if (!value || value === 0) return '';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    if (open) {
      console.log('📦 StockItemModal: Modal aberto, carregando fornecedores...');
      loadSuppliers();
    } else {
      // Reset suppliers quando modal fecha
      console.log('📦 StockItemModal: Modal fechado, resetando lista de fornecedores');
      setSuppliers([]);
    }
  }, [open]);

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        category: item.category,
        sizeVariation: item.sizeVariation || '',
        description: item.description || '',
        currentQuantity: item.currentQuantity,
        minimumQuantity: item.minimumQuantity,
        unitCost: item.unitCost || 0,
        supplier: item.supplier || '',
        barcode: item.barcode || '',
        notes: item.notes || ''
      });
      // Formatar o valor do custo unitário para exibição
      if (item.unitCost) {
        setUnitCostDisplay(formatCurrencyFromNumber(item.unitCost));
      } else {
        setUnitCostDisplay('');
      }
    } else {
      setFormData({
        code: '',
        name: '',
        category: StockCategory.UNIFORME_VIGILANCIA,
        sizeVariation: '',
        description: '',
        currentQuantity: 0,
        minimumQuantity: 0,
        unitCost: 0,
        supplier: '',
        barcode: '',
        notes: ''
      });
      setUnitCostDisplay('');
    }
  }, [item, open]);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      console.log('📦 StockItemModal: Carregando fornecedores...');
      const data = await contasAPagarService.getFornecedores();
      console.log('📦 StockItemModal: Dados recebidos da API:', data);
      console.log('📦 StockItemModal: Tipo dos dados:', typeof data, 'É array?', Array.isArray(data));
      console.log('📦 StockItemModal: Tamanho do array:', Array.isArray(data) ? data.length : 'N/A');
      
      if (Array.isArray(data)) {
        console.log('📦 StockItemModal: Total de fornecedores recebidos:', data.length);
        
        if (data.length > 0) {
          // Log detalhado de cada fornecedor
          data.forEach((s, idx) => {
            console.log(`📦 StockItemModal: Fornecedor ${idx + 1}:`, {
              id: s?.id,
              name: s?.name,
              cnpj: s?.cnpj,
              isActive: s?.isActive,
              isActiveType: typeof s?.isActive,
              isActiveCheck: s?.isActive !== false,
              object: s
            });
          });
          
          // Filtrar apenas fornecedores válidos (não nulos) e que não estejam explicitamente inativos
          // Aceitar: isActive === true, isActive === undefined, isActive === null (tratar como ativo)
          // Remover apenas se isActive === false explicitamente
          const filtered = data.filter(s => {
            if (!s) {
              console.warn('📦 StockItemModal: Fornecedor nulo encontrado, removendo');
              return false;
            }
            if (!s.id || !s.name) {
              console.warn('📦 StockItemModal: Fornecedor sem ID ou nome encontrado, removendo:', s);
              return false;
            }
            // Se isActive é explicitamente false, remover. Caso contrário, incluir
            const isIncluded = s.isActive !== false;
            if (!isIncluded) {
              console.log(`📦 StockItemModal: Fornecedor ${s.name} (ID: ${s.id}) removido porque isActive = ${s.isActive}`);
            }
            return isIncluded;
          });
          
          console.log('📦 StockItemModal: Fornecedores após filtro:', filtered.length);
          console.log('📦 StockItemModal: Fornecedores filtrados:', filtered.map(s => ({ id: s.id, name: s.name, isActive: s.isActive })));
          
          setSuppliers(filtered);
        } else {
          console.warn('📦 StockItemModal: Array vazio recebido da API');
          setSuppliers([]);
        }
      } else {
        console.warn('📦 StockItemModal: Dados não são um array, definindo lista vazia');
        console.warn('📦 StockItemModal: Tipo:', typeof data, 'Valor:', data);
        setSuppliers([]);
      }
    } catch (error: any) {
      console.error('❌ StockItemModal: Erro ao carregar fornecedores:', error);
      console.error('❌ StockItemModal: Erro detalhado:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    console.log('📦 StockItemModal: Filtrando fornecedores. Total:', suppliers.length, 'Termo de busca:', supplierSearchTerm);
    if (!supplierSearchTerm) {
      console.log('📦 StockItemModal: Sem termo de busca, retornando todos os', suppliers.length, 'fornecedores');
      return suppliers;
    }
    const term = supplierSearchTerm.toLowerCase();
    const filtered = suppliers.filter(s => {
      const nameMatch = s?.name?.toLowerCase().includes(term);
      const cnpjMatch = s?.cnpj?.toLowerCase().includes(term);
      return nameMatch || cnpjMatch;
    });
    console.log('📦 StockItemModal: Após filtro por termo,', filtered.length, 'fornecedores encontrados');
    return filtered;
  }, [suppliers, supplierSearchTerm]);

  const selectedSupplier = suppliers.find(s => s.name === formData.supplier);

  const handleInputChange = (field: keyof CreateStockItemDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCurrencyChange = (value: string) => {
    const formatted = formatCurrency(value);
    setUnitCostDisplay(formatted);
    // Se o campo estiver vazio, definir como 0, senão converter para número
    const numericValue = formatted ? parseCurrency(formatted) : 0;
    handleInputChange('unitCost', numericValue);
  };

  const handleSupplierSave = async (payload: any) => {
    try {
      const newSupplier = await contasAPagarService.createFornecedor(payload);
      toast({
        title: 'Sucesso',
        description: 'Fornecedor criado com sucesso!',
      });
      await loadSuppliers();
      // Selecionar automaticamente o fornecedor recém-criado
      handleInputChange('supplier', newSupplier.name);
      setIsSupplierModalOpen(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Não foi possível salvar o fornecedor.';
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast({
        title: 'Erro',
        description: 'Código e nome são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Preparar dados para envio, garantindo que todos os campos obrigatórios estejam presentes
      const dataToSend: CreateStockItemDTO = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        category: formData.category,
        sizeVariation: formData.sizeVariation?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        currentQuantity: formData.currentQuantity ?? 0,
        minimumQuantity: formData.minimumQuantity ?? 0,
        // Garantir que unitCost seja um número válido ou undefined
        unitCost: (formData.unitCost && formData.unitCost > 0) ? 
                  (typeof formData.unitCost === 'number' ? formData.unitCost : parseFloat(String(formData.unitCost))) : 
                  undefined,
        supplier: formData.supplier?.trim() || undefined,
        barcode: formData.barcode?.trim() || undefined,
        notes: formData.notes?.trim() || undefined
      };

      // Validar que unitCost não seja NaN
      if (dataToSend.unitCost !== undefined && isNaN(dataToSend.unitCost)) {
        dataToSend.unitCost = undefined;
      }

      console.log('📦 Dados sendo enviados:', JSON.stringify(dataToSend, null, 2));

      if (item) {
        await stockService.updateItem(item.id, dataToSend);
        toast({
          title: 'Sucesso!',
          description: 'Item atualizado com sucesso.',
        });
      } else {
        await stockService.createItem(dataToSend);
        toast({
          title: 'Sucesso!',
          description: 'Item criado com sucesso.',
        });
      }
      
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Erro ao salvar item:', error);
      console.error('❌ Response data:', error?.response?.data);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Erro ao salvar item. Verifique os dados e tente novamente.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-seguranca-graphite/95 to-seguranca-black/95 border-gray-600/50 shadow-2xl backdrop-blur-sm">
          <DialogHeader className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-seguranca-red/20 to-seguranca-red/10 border border-seguranca-red/30 shadow-lg shadow-seguranca-red/10">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-seguranca-red" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                  {item ? 'Editar Item de Estoque' : 'Novo Item de Estoque'}
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-sm sm:text-base mt-1">
                  Preencha os dados do item de estoque
                </DialogDescription>
              </div>
            </div>
            
            <Card className="bg-gradient-to-r from-seguranca-red/10 to-seguranca-darkred/10 border-seguranca-red/20 p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-seguranca-red">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="font-medium">Campos obrigatórios:</span>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="destructive" className="text-xs px-2 py-1">Código</Badge>
                  <Badge variant="destructive" className="text-xs px-2 py-1">Nome</Badge>
                  <Badge variant="destructive" className="text-xs px-2 py-1">Categoria</Badge>
                </div>
              </div>
            </Card>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-4">
            {/* Informações Básicas */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
                <span className="truncate">Informações Básicas</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                    Código *
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="Ex: UNI-VIG-CAM-M"
                    required
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                    Nome *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Camisa Vigilância"
                    required
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                    Categoria *
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value as StockCategory)}
                  >
                    <SelectTrigger className="bg-seguranca-black/50 border-gray-600/30 text-white focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {Object.entries(StockCategoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-seguranca-black focus:bg-seguranca-black">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sizeVariation" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <Ruler className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                    Tamanho/Numeração
                  </Label>
                  <Input
                    id="sizeVariation"
                    value={formData.sizeVariation}
                    onChange={(e) => handleInputChange('sizeVariation', e.target.value)}
                    placeholder="Ex: M, G, 42, 44..."
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição detalhada do item..."
                  rows={3}
                  className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 text-sm sm:text-base resize-none"
                />
              </div>
            </div>

            {/* Estoque */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Box className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
                <span className="truncate">Controle de Estoque</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentQuantity" className="text-gray-300 text-sm sm:text-base">
                    Quantidade Atual
                  </Label>
                  <Input
                    id="currentQuantity"
                    type="number"
                    min="0"
                    value={formData.currentQuantity}
                    onChange={(e) => handleInputChange('currentQuantity', parseInt(e.target.value) || 0)}
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumQuantity" className="text-gray-300 text-sm sm:text-base">
                    Quantidade Mínima
                  </Label>
                  <Input
                    id="minimumQuantity"
                    type="number"
                    min="0"
                    value={formData.minimumQuantity}
                    onChange={(e) => handleInputChange('minimumQuantity', parseInt(e.target.value) || 0)}
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Informações Comerciais */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
                <span className="truncate">Informações Comerciais</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitCost" className="text-gray-300 text-sm sm:text-base">
                    Custo Unitário (R$)
                  </Label>
                  <Input
                    id="unitCost"
                    type="text"
                    value={unitCostDisplay}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    placeholder="0,00"
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                    Fornecedor
                  </Label>
                  {loadingSuppliers ? (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-400 text-center">
                        Carregando fornecedores...
                      </p>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-xs sm:text-sm text-yellow-400 mb-2">
                          {loadingSuppliers 
                            ? 'Carregando fornecedores...' 
                            : 'Nenhum fornecedor cadastrado. Cadastre um fornecedor para continuar.'}
                        </p>
                        <p className="text-xs text-gray-400 mb-2">
                          Verifique o console do navegador (F12) para mais detalhes.
                        </p>
                        <Button
                          type="button"
                          onClick={() => setIsSupplierModalOpen(true)}
                          className="w-full bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs sm:text-sm h-8 sm:h-9"
                          size="sm"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Cadastrar Fornecedor
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Popover open={supplierComboboxOpen} onOpenChange={setSupplierComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={supplierComboboxOpen}
                            className="w-full justify-between bg-seguranca-black/50 border-gray-600/30 text-white hover:bg-seguranca-graphite hover:border-seguranca-red/50 focus:border-seguranca-red/50 h-10 sm:h-11 text-sm sm:text-base"
                          >
                            {selectedSupplier ? (
                              <div className="flex items-center gap-2 truncate">
                                <Building2 className="h-4 w-4 flex-shrink-0 text-seguranca-red" />
                                <span className="truncate">{selectedSupplier.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                <span className="text-gray-400">Selecione o fornecedor</span>
                              </div>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-[var(--radix-popover-trigger-width)] p-0 bg-seguranca-graphite border-gray-600 z-[10020] !z-[10020]" 
                          align="start"
                          style={{ zIndex: 10020 }}
                        >
                          <Command className="bg-seguranca-graphite text-white">
                            <CommandInput 
                              placeholder="Buscar fornecedor..." 
                              className="text-white"
                              value={supplierSearchTerm}
                              onValueChange={setSupplierSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty className="text-gray-400 py-4 text-center text-sm">
                                {supplierSearchTerm 
                                  ? 'Nenhum fornecedor encontrado com o termo buscado.'
                                  : 'Nenhum fornecedor disponível.'}
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredSuppliers.length > 0 ? (
                                  filteredSuppliers.map((supplier) => (
                                    <CommandItem
                                      key={supplier.id}
                                      value={supplier.name}
                                      onSelect={() => {
                                        handleInputChange('supplier', supplier.name);
                                        setSupplierComboboxOpen(false);
                                        setSupplierSearchTerm('');
                                      }}
                                      className="text-white hover:bg-seguranca-black focus:bg-seguranca-black cursor-pointer"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          formData.supplier === supplier.name ? 'opacity-100' : 'opacity-0'
                                        }`}
                                      />
                                      <div className="flex flex-col">
                                        <span>{supplier.name}</span>
                                        {supplier.cnpj && (
                                          <span className="text-xs text-gray-400">{supplier.cnpj}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-sm text-gray-400">
                                    Nenhum fornecedor disponível
                                  </div>
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setIsSupplierModalOpen(true);
                          setSupplierComboboxOpen(false);
                        }}
                        className="w-full text-xs sm:text-sm text-seguranca-red hover:text-seguranca-darkred hover:bg-seguranca-red/10 h-8 sm:h-9"
                        size="sm"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Cadastrar Novo Fornecedor
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <Barcode className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  Código de Barras
                </Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Código de barras do produto"
                  className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                Observações
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
                className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 text-sm sm:text-base resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-600/30">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:border-seguranca-red/50 px-4 sm:px-6 h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red shadow-lg shadow-seguranca-red/20 px-4 sm:px-6 h-10 sm:h-11 text-sm sm:text-base order-1 sm:order-2"
              >
                {loading ? 'Salvando...' : (item ? 'Atualizar' : 'Criar Item')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Fornecedor */}
      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplier={null}
        onSave={handleSupplierSave}
      />
    </>
  );
};

export default StockItemModal;
