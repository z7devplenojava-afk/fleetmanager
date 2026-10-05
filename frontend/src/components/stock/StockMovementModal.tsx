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
import { 
  StockItem, 
  CreateStockItemDTO,
  CreateStockMovementDTO, 
  MovementType, 
  MovementReason, 
  MovementTypeLabels, 
  MovementReasonLabels,
  StockCategory,
  StockCategoryLabels
} from '@/types/stock';
import { stockService } from '@/services/stockService';
import { stockNfeService } from '@/services/stockNfeService';
import { employeeService } from '@/services/employeeService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Search, 
  ArrowUpDown, 
  Hash, 
  User, 
  FileText, 
  Building2, 
  DollarSign, 
  Sparkles,
  Plus,
  Check,
  ChevronsUpDown,
  ArrowRight,
  ArrowLeft,
  Box,
  Zap,
  CircleDot,
  Tag,
  Barcode,
  Upload,
  Loader2
} from 'lucide-react';

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: StockItem | null;
  onSave: () => void;
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({
  open,
  onOpenChange,
  item,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; document?: string }>>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(item);
  const [itemCodeSearch, setItemCodeSearch] = useState('');
  const [allItems, setAllItems] = useState<StockItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemComboboxOpen, setItemComboboxOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierComboboxOpen, setSupplierComboboxOpen] = useState(false);
  const [unitCostDisplay, setUnitCostDisplay] = useState('');
  const [xmlLoading, setXmlLoading] = useState(false);
  const xmlInputRef = React.useRef<HTMLInputElement>(null);
  const [newItem, setNewItem] = useState<CreateStockItemDTO>({
    code: '',
    name: '',
    category: StockCategory.PECAS_MECANICA,
    sizeVariation: '',
    description: '',
    currentQuantity: 0,
    minimumQuantity: 0,
    barcode: ''
  });
  const [formData, setFormData] = useState<CreateStockMovementDTO>({
    stockItemId: '',
    movementType: MovementType.ENTRADA,
    reason: MovementReason.COMPRA,
    quantity: 1,
    employeeId: '',
    documentNumber: '',
    supplier: '',
    unitCost: 0,
    notes: ''
  });

  const isBattery = React.useMemo(() => {
    if (!selectedItem) return false;
    const text = `${selectedItem.name || ''} ${selectedItem.description || ''}`.toLowerCase();
    return selectedItem.category === 'PECAS_ELETRICA' || text.includes('bateria') || text.includes('battery');
  }, [selectedItem]);

  const isTire = React.useMemo(() => {
    if (!selectedItem) return false;
    const text = `${selectedItem.name || ''} ${selectedItem.description || ''}`.toLowerCase();
    if (text.includes('camara') || text.includes('câmara') || text.includes('roda ') || text.includes('valvula')) return false;
    return selectedItem.category === 'PNEUS_RODAS' || text.includes('pneu') || text.includes('tire');
  }, [selectedItem]);

  const formatCurrency = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const number = parseInt(digits, 10) / 100;
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (value: string): number => {
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
      loadEmployees();
      loadSuppliers();
      loadAllItems();
    }
  }, [open]);

  // Filtrar itens baseado no termo de busca
  const filteredItems = React.useMemo(() => {
    if (!itemCodeSearch || itemCodeSearch.trim().length === 0) {
      return allItems.slice(0, 10); // Mostrar apenas os primeiros 10 quando não há busca
    }
    const search = itemCodeSearch.toLowerCase().trim();
    return allItems.filter(item => 
      item.code.toLowerCase().includes(search) ||
      item.name.toLowerCase().includes(search) ||
      item.fullName.toLowerCase().includes(search)
    ).slice(0, 20); // Limitar a 20 resultados
  }, [allItems, itemCodeSearch]);

  const loadAllItems = async () => {
    try {
      setLoadingItems(true);
      const items = await stockService.getAllItems();
      setAllItems(items);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar itens de estoque.',
        variant: 'destructive'
      });
      setAllItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (item) {
      setSelectedItem(item);
      setItemCodeSearch(item.code);
      setFormData(prev => ({
        ...prev,
        stockItemId: item.id
      }));
    } else {
      setSelectedItem(null);
      setItemCodeSearch('');
    }
  }, [item, open]);

  useEffect(() => {
    if (formData.movementType === MovementType.ENTRADA && formData.unitCost) {
      setUnitCostDisplay(formatCurrencyFromNumber(formData.unitCost));
    } else {
      setUnitCostDisplay('');
    }
  }, [formData.movementType, open]);

  useEffect(() => {
    if (!selectedItem && formData.movementType === MovementType.ENTRADA) {
      setNewItem(prev => (prev.code === itemCodeSearch ? prev : { ...prev, code: itemCodeSearch }));
    }
  }, [itemCodeSearch, selectedItem, formData.movementType]);

  const loadEmployees = async () => {
    setEmployeeLoading(true);
    try {
      const employeeData = await employeeService.getSimpleEmployees();
      const normalized = employeeData
        .map((employee: any) => ({
          id: employee.id,
          name: employee.name || employee.fullName || employee.employeeName || 'Funcionário sem nome',
          document: employee.document ?? employee.cpf ?? employee.username,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setEmployees(normalized);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        title: 'Erro ao buscar funcionários',
        description: 'Não foi possível carregar a lista de colaboradores. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setEmployeeLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await contasAPagarService.getFornecedores();
      setSuppliers(Array.isArray(data) ? data.filter(s => s.isActive !== false) : []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm) {
      return suppliers.slice(0, 50);
    }
    const term = supplierSearchTerm.toLowerCase().trim();
    const cleanDigits = term.replace(/\D/g, '');
    return suppliers.filter(s => {
      const nameMatch = s?.name?.toLowerCase().includes(term);
      const sCnpjClean = s?.cnpj ? s.cnpj.replace(/\D/g, '') : '';
      const cnpjMatch = s?.cnpj?.toLowerCase().includes(term) || (cleanDigits.length >= 2 && sCnpjClean.includes(cleanDigits));
      return nameMatch || cnpjMatch;
    }).slice(0, 50);
  }, [suppliers, supplierSearchTerm]);

  const selectedSupplier = suppliers.find(s => s.name === formData.supplier);

  const handleInputChange = (field: keyof CreateStockMovementDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCurrencyChange = (value: string) => {
    const formatted = formatCurrency(value);
    setUnitCostDisplay(formatted);
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

  const handleMovementTypeChange = (type: MovementType) => {
    setFormData(prev => ({
      ...prev,
      movementType: type,
      reason: type === MovementType.ENTRADA ? MovementReason.COMPRA : MovementReason.ENTREGA_INICIAL,
      supplier: type === MovementType.ENTRADA ? prev.supplier : '',
      unitCost: type === MovementType.ENTRADA ? prev.unitCost : 0
    }));
    if (type === MovementType.SAIDA) {
      setUnitCostDisplay('');
    }
  };

  const getReasonsByType = (type: MovementType) => {
    const entradaReasons = [
      MovementReason.COMPRA,
      MovementReason.DEVOLUCAO,
      MovementReason.AJUSTE_ENTRADA
    ];
    
    const saidaReasons = [
      MovementReason.ENTREGA_INICIAL,
      MovementReason.REPOSICAO,
      MovementReason.TROCA,
      MovementReason.DESCARTE,
      MovementReason.PERDA,
      MovementReason.AJUSTE_SAIDA
    ];

    return type === MovementType.ENTRADA ? entradaReasons : saidaReasons;
  };

  const isCreatingNewEntryItem = React.useMemo(
    () => formData.movementType === MovementType.ENTRADA && !selectedItem,
    [formData.movementType, selectedItem]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!formData.stockItemId && !isCreatingNewEntryItem) || !formData.quantity || formData.quantity <= 0) {
      toast({
        title: 'Erro',
        description: 'Item e quantidade são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (isCreatingNewEntryItem) {
      if (!newItem.code.trim() || !newItem.name.trim()) {
        toast({
          title: 'Erro',
          description: 'Código e nome do novo item são obrigatórios.',
          variant: 'destructive'
        });
        return;
      }
      const duplicate = allItems.find(
        i => i.code.trim().toLowerCase() === newItem.code.trim().toLowerCase()
      );
      if (duplicate) {
        toast({
          title: 'Código já cadastrado',
          description: `Já existe um item com o código ${duplicate.code}. Selecione o item existente na busca.`,
          variant: 'destructive'
        });
        return;
      }
    }

    if (formData.movementType === MovementType.SAIDA && 
        [MovementReason.ENTREGA_INICIAL, MovementReason.REPOSICAO, MovementReason.TROCA].includes(formData.reason) &&
        !formData.employeeId) {
      toast({
        title: 'Erro',
        description: 'Funcionário é obrigatório para este tipo de saída.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      let stockItemId = formData.stockItemId;

      if (isCreatingNewEntryItem) {
        const created = await stockService.createItem({
          code: newItem.code.trim(),
          name: newItem.name.trim(),
          category: newItem.category,
          sizeVariation: newItem.sizeVariation?.trim() || undefined,
          description: newItem.description?.trim() || undefined,
          currentQuantity: 0,
          minimumQuantity: newItem.minimumQuantity || 0,
          barcode: newItem.barcode?.trim() || undefined,
          unitCost: (formData.unitCost && formData.unitCost > 0) ? formData.unitCost : undefined,
          supplier: formData.supplier?.trim() || undefined,
          invoiceNumber: formData.documentNumber?.trim() || undefined,
          notes: formData.notes?.trim() || undefined
        });
        stockItemId = created.id;
        setSelectedItem(created);
        toast({
          title: 'Item criado',
          description: `Item "${created.fullName}" cadastrado no estoque.`,
        });
      }

      // Preparar dados para envio, garantindo tipos corretos
      const dataToSend: CreateStockMovementDTO = {
        stockItemId,
        movementType: formData.movementType,
        reason: formData.reason,
        quantity: formData.quantity,
        employeeId: formData.employeeId || undefined,
        documentNumber: formData.documentNumber?.trim() || undefined,
        supplier: formData.supplier?.trim() || undefined,
        unitCost: (formData.unitCost && formData.unitCost > 0) ? 
                  (typeof formData.unitCost === 'number' ? formData.unitCost : parseFloat(String(formData.unitCost))) : 
                  undefined,
        notes: formData.notes?.trim() || undefined
      };

      // Validar que unitCost não seja NaN
      if (dataToSend.unitCost !== undefined && isNaN(dataToSend.unitCost)) {
        dataToSend.unitCost = undefined;
      }

      console.log('📦 Dados da movimentação sendo enviados:', JSON.stringify(dataToSend, null, 2));

      await stockService.createMovement(dataToSend);
      toast({
        title: 'Sucesso!',
        description: 'Movimentação registrada com sucesso.',
      });
      
      window.dispatchEvent(new CustomEvent('stock-data-changed'));
      onSave();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        stockItemId: item?.id || '',
        movementType: MovementType.ENTRADA,
        reason: MovementReason.COMPRA,
        quantity: 1,
        employeeId: '',
        documentNumber: '',
        supplier: '',
        unitCost: 0,
        notes: ''
      });
      setSelectedItem(item || null);
      setItemCodeSearch(item?.code || '');
      setUnitCostDisplay('');
      setItemComboboxOpen(false);
      setNewItem({
        code: '',
        name: '',
        category: StockCategory.PECAS_MECANICA,
        sizeVariation: '',
        description: '',
        currentQuantity: 0,
        minimumQuantity: 0,
        barcode: ''
      });
    } catch (error: any) {
      console.error('Erro ao registrar movimentação:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao registrar movimentação.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item: StockItem) => {
    setSelectedItem(item);
    setFormData(prev => ({
      ...prev,
      stockItemId: item.id
    }));
    setItemCodeSearch(item.code);
    setItemComboboxOpen(false);
    toast({
      title: 'Item selecionado',
      description: `${item.fullName} - Estoque: ${item.currentQuantity}`,
    });
  };

  const handleItemSearch = async (code: string) => {
    if (!code) return;
    
    try {
      const foundItem = await stockService.getItemByCode(code);
      handleItemSelect(foundItem);
    } catch (error) {
      toast({
        title: 'Item não encontrado',
        description: 'Código não corresponde a nenhum item cadastrado.',
        variant: 'destructive'
      });
    }
  };

  const handleNewItemClick = (field: keyof CreateStockItemDTO, value: string | number) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
    if (field === 'code') {
      setItemCodeSearch(String(value || ''));
    }
  };

  const handleNfeFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setXmlLoading(true);
    try {
      const parsed = await stockNfeService.parseNfe(file);
      const first = parsed.items?.[0];
      if (!first) {
        throw new Error('Nenhum item encontrado no arquivo.');
      }

      const existingMatch = allItems.find(
        i => i.code.trim().toLowerCase() === (first.productCode || '').trim().toLowerCase()
      );
      if (existingMatch) {
        handleItemSelect(existingMatch);
        toast({
          title: 'Item já cadastrado',
          description: `${existingMatch.fullName} encontrado na NF-e. Movimentação para o item existente.`,
        });
        return;
      }

      const suggested = first.suggestedCategory as StockCategory;
      setNewItem(prev => ({
        ...prev,
        code: first.productCode || prev.code,
        name: first.description || prev.name,
        barcode: first.barcode || prev.barcode,
        category: (suggested && Object.values(StockCategory).includes(suggested)) ? suggested : prev.category
      }));
      setItemCodeSearch(first.productCode || '');

      setFormData(prev => ({
        ...prev,
        documentNumber: parsed.invoiceNumber || prev.documentNumber,
        supplier: parsed.supplierName || prev.supplier,
        quantity: first.quantity > 0 ? first.quantity : prev.quantity,
        unitCost: first.unitPrice > 0 ? first.unitPrice : prev.unitCost
      }));
      if (first.unitPrice > 0) {
        setUnitCostDisplay(formatCurrencyFromNumber(first.unitPrice));
      }

      toast({
        title: 'NF-e importada',
        description: `${parsed.invoiceNumber ? `NF ${parsed.invoiceNumber} - ` : ''}${parsed.items.length} item(ns) lido(s).`,
      });
    } catch (error) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      toast({
        title: 'Erro ao importar',
        description: err?.response?.data?.message || err?.message || 'Não foi possível ler o arquivo XML/PDF.',
        variant: 'destructive'
      });
    } finally {
      setXmlLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-seguranca-graphite/95 to-seguranca-black/95 border-gray-600/50 shadow-2xl backdrop-blur-sm">
          <DialogHeader className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-seguranca-red/20 to-seguranca-red/10 border border-seguranca-red/30 shadow-lg shadow-seguranca-red/10">
                <ArrowUpDown className="h-5 w-5 sm:h-6 sm:w-6 text-seguranca-red" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                  Nova Movimentação de Estoque
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-sm sm:text-base mt-1">
                  Registre uma nova entrada ou saída de item do estoque
                </DialogDescription>
              </div>
            </div>
            
            <Card className="bg-gradient-to-r from-seguranca-red/10 to-seguranca-darkred/10 border-seguranca-red/20 p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-seguranca-red">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="font-medium">Campos obrigatórios:</span>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="destructive" className="text-xs px-2 py-1">Item</Badge>
                  <Badge variant="destructive" className="text-xs px-2 py-1">Tipo</Badge>
                  <Badge variant="destructive" className="text-xs px-2 py-1">Motivo</Badge>
                  <Badge variant="destructive" className="text-xs px-2 py-1">Quantidade</Badge>
                </div>
              </div>
            </Card>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-4">
            {/* Seleção do Item */}
            {!item && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
                  <span className="truncate">Seleção do Item</span>
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="itemCode" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                    Código do Item *
                  </Label>
                  <Popover open={itemComboboxOpen} onOpenChange={setItemComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={itemComboboxOpen}
                        onClick={() => setItemComboboxOpen(true)}
                        className="w-full justify-between bg-seguranca-black/50 border-gray-600/30 text-white hover:bg-seguranca-graphite hover:border-seguranca-red/50 focus:border-seguranca-red/50 h-10 sm:h-11 text-sm sm:text-base"
                      >
                        {selectedItem ? (
                          <div className="flex items-center gap-2 truncate">
                            <Package className="h-4 w-4 flex-shrink-0 text-seguranca-red" />
                            <span className="truncate">{selectedItem.code} - {selectedItem.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span className="text-gray-400">Digite o código ou nome do item...</span>
                          </div>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-seguranca-graphite border-gray-600" align="start">
                      <Command className="bg-seguranca-graphite text-white">
                        <CommandInput
                          placeholder="Buscar por código ou nome..."
                          className="text-white"
                          value={itemCodeSearch}
                          onValueChange={(value) => {
                            setItemCodeSearch(value);
                            setItemComboboxOpen(true);
                          }}
                          onFocus={() => setItemComboboxOpen(true)}
                        />
                        <CommandList>
                          {loadingItems ? (
                            <div className="px-3 py-4 text-center text-sm text-gray-400">
                              Carregando itens...
                            </div>
                          ) : filteredItems.length === 0 ? (
                            <CommandEmpty className="text-gray-400 py-4 text-center text-sm">
                              {itemCodeSearch ? 'Nenhum item encontrado.' : 'Digite para buscar itens...'}
                            </CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {filteredItems.map((stockItem) => (
                                <CommandItem
                                  key={stockItem.id}
                                  value={`${stockItem.code} ${stockItem.name} ${stockItem.fullName}`}
                                  onSelect={() => handleItemSelect(stockItem)}
                                  className="text-white hover:bg-seguranca-black focus:bg-seguranca-black cursor-pointer"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedItem?.id === stockItem.id ? 'opacity-100' : 'opacity-0'
                                    }`}
                                  />
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{stockItem.code}</span>
                                      <span className="text-gray-400">-</span>
                                      <span className="truncate">{stockItem.name}</span>
                                    </div>
                                    {stockItem.sizeVariation && (
                                      <span className="text-xs text-gray-400">Tamanho: {stockItem.sizeVariation}</span>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-400">Estoque:</span>
                                      <span className={`text-xs font-medium ${
                                        stockItem.currentQuantity <= stockItem.minimumQuantity 
                                          ? 'text-red-400' 
                                          : 'text-green-400'
                                      }`}>
                                        {stockItem.currentQuantity}
                                      </span>
                                      {stockItem.minimumQuantity > 0 && (
                                        <>
                                          <span className="text-xs text-gray-400">/ Mín:</span>
                                          <span className="text-xs text-gray-400">{stockItem.minimumQuantity}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {itemCodeSearch && !selectedItem && (
                    <Button 
                      type="button" 
                      onClick={() => handleItemSearch(itemCodeSearch)}
                      className="w-full bg-seguranca-red hover:bg-seguranca-darkred"
                      size="sm"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Buscar por código exato
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Item Selecionado */}
            {selectedItem && (
              <Card className="bg-gradient-to-r from-seguranca-black/50 to-seguranca-graphite/50 border-gray-600/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-seguranca-red/20">
                    <Package className="h-5 w-5 text-seguranca-red" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-base sm:text-lg">{selectedItem.fullName}</h4>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-300">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3 text-gray-400" />
                        Código: <span className="font-medium">{selectedItem.code}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Box className="h-3 w-3 text-gray-400" />
                        Estoque Atual: <span className="font-medium text-seguranca-yellow">{selectedItem.currentQuantity}</span>
                      </span>
                    </div>

                    {formData.movementType === MovementType.ENTRADA && isBattery && (
                      <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs">
                        <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Sincronização com Controle de Baterias:</strong> Ao confirmar esta entrada, <strong>{formData.quantity || 1}</strong> unidade(s) individual(is) serão criadas automaticamente na aba <strong>Baterias</strong> com status <em>Em Estoque</em>, disponíveis para instalação na frota.
                        </span>
                      </div>
                    )}

                    {formData.movementType === MovementType.ENTRADA && isTire && (
                      <div className="mt-3 flex items-start gap-2 p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs">
                        <CircleDot className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Sincronização com Pneus da Frota:</strong> Ao confirmar esta entrada, <strong>{formData.quantity || 1}</strong> unidade(s) individual(is) serão criadas automaticamente na aba <strong>Pneus da Frota</strong> com status <em>Disponível</em>, prontas para montagem nos veículos.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Tipo de Movimentação e Motivo */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
                <span className="truncate">Tipo de Movimentação</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="movementType" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    {formData.movementType === MovementType.ENTRADA ? (
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 flex-shrink-0" />
                    )}
                    Tipo de Movimentação *
                  </Label>
                  <Select 
                    value={formData.movementType} 
                    onValueChange={(value) => handleMovementTypeChange(value as MovementType)}
                  >
                    <SelectTrigger className="bg-seguranca-black/50 border-gray-600/30 text-white focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {Object.entries(MovementTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-seguranca-black focus:bg-seguranca-black">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-gray-300 text-sm sm:text-base">
                    Motivo *
                  </Label>
                  <Select 
                    value={formData.reason} 
                    onValueChange={(value) => handleInputChange('reason', value as MovementReason)}
                  >
                    <SelectTrigger className="bg-seguranca-black/50 border-gray-600/30 text-white focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {getReasonsByType(formData.movementType).map((reason) => (
                        <SelectItem key={reason} value={reason} className="text-white hover:bg-seguranca-black focus:bg-seguranca-black">
                          {MovementReasonLabels[reason]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                <Box className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                Quantidade *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                required
                className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>

            {/* Funcionário (para saídas) */}
            {formData.movementType === MovementType.SAIDA && (
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  Funcionário {[MovementReason.ENTREGA_INICIAL, MovementReason.REPOSICAO, MovementReason.TROCA].includes(formData.reason) ? '*' : ''}
                </Label>
                <Select 
                  value={formData.employeeId} 
                  onValueChange={(value) => handleInputChange('employeeId', value)}
                >
                  <SelectTrigger className="bg-seguranca-black/50 border-gray-600/30 text-white focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue
                      placeholder={employeeLoading ? 'Carregando funcionários...' : 'Selecione o funcionário'}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {employeeLoading ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Carregando funcionários...</div>
                    ) : employees.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Nenhum funcionário encontrado.</div>
                    ) : (
                      employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id} className="text-white hover:bg-seguranca-black focus:bg-seguranca-black">
                          <div className="flex flex-col">
                            <span>{employee.name}</span>
                            {employee.document && (
                              <span className="text-xs text-gray-400">CPF: {employee.document}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Informações Adicionais */}
            {formData.movementType === MovementType.ENTRADA && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
                  <span className="truncate">Informações da Entrada</span>
                </h3>

                {/* Cadastro de novo item de estoque */}
                {(
                  <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-seguranca-graphite/60 to-seguranca-black/40 border border-seguranca-red/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                        <Plus className="h-4 w-4 text-seguranca-red flex-shrink-0" />
                        <span className="truncate">Cadastrar Novo Item de Estoque</span>
                      </h4>
                      {selectedItem && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const previousCode = selectedItem?.code || '';
                            setSelectedItem(null);
                            setFormData(prev => ({ ...prev, stockItemId: '' }));
                            setNewItem(prev => (prev.code ? prev : { ...prev, code: previousCode }));
                            setItemCodeSearch(previousCode);
                          }}
                          className="border-seguranca-red/50 text-seguranca-red hover:bg-seguranca-red/10 hover:text-white h-8 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Novo item em vez deste
                        </Button>
                      )}
                    </div>

                    {selectedItem ? (
                      <div className="p-3 bg-seguranca-black/40 border border-gray-600/30 rounded-lg text-xs sm:text-sm text-gray-300">
                        Item existente selecionado: <span className="font-medium text-white">{selectedItem.code} - {selectedItem.fullName}</span>.
                        A movimentação será registrada para este item. Para cadastrar um item novo, clique em <span className="text-seguranca-red font-medium">Novo item em vez deste</span>.
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-gray-400">
                            O código do item é o mesmo código do produto, digitado manualmente ou importado do XML/PDF da NF-e.
                          </p>
                          <input
                            ref={xmlInputRef}
                            type="file"
                            accept=".xml,.pdf,text/xml,application/pdf"
                            className="hidden"
                            onChange={handleNfeFileImport}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={xmlLoading}
                            onClick={() => xmlInputRef.current?.click()}
                            className="border-gray-600/60 text-white hover:bg-seguranca-graphite hover:border-seguranca-red/50 h-8 text-xs"
                          >
                            {xmlLoading ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3 mr-1" />
                            )}
                            {xmlLoading ? 'Importando...' : 'Importar XML/PDF da NF-e'}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="newItemCode" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                              <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                              Código do Item (produto) *
                            </Label>
                            <Input
                              id="newItemCode"
                              value={newItem.code}
                              onChange={(e) => handleNewItemClick('code', e.target.value)}
                              placeholder="Ex: PNE-275-80-225"
                              className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base font-mono font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newItemName" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                              Nome / Descrição do Produto *
                            </Label>
                            <Input
                              id="newItemName"
                              value={newItem.name}
                              onChange={(e) => handleNewItemClick('name', e.target.value)}
                              placeholder="Ex: Pneu aro 22.5 275/80"
                              className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newItemCategory" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                              <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                              Categoria *
                            </Label>
                            <Select
                              value={newItem.category}
                              onValueChange={(value) => handleNewItemClick('category', value as StockCategory)}
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
                            <Label htmlFor="newItemBarcode" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                              <Barcode className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                              Código de Barras
                            </Label>
                            <Input
                              id="newItemBarcode"
                              value={newItem.barcode || ''}
                              onChange={(e) => handleNewItemClick('barcode', e.target.value)}
                              placeholder="Opcional"
                              className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newItemMinimumQuantity" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                              <Box className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                              Estoque Mínimo
                            </Label>
                            <Input
                              id="newItemMinimumQuantity"
                              type="number"
                              min="0"
                              value={newItem.minimumQuantity || 0}
                              onChange={(e) => handleNewItemClick('minimumQuantity', parseInt(e.target.value) || 0)}
                              className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newItemSizeVariation" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                              <CircleDot className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                              Tamanho / Numeração
                            </Label>
                            <Input
                              id="newItemSizeVariation"
                              value={newItem.sizeVariation || ''}
                              onChange={(e) => handleNewItemClick('sizeVariation', e.target.value)}
                              placeholder="Opcional (ex: 38, 39, GG...)"
                              className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newItemDescription" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                            Observações do Item
                          </Label>
                          <Textarea
                            id="newItemDescription"
                            value={newItem.description || ''}
                            onChange={(e) => handleNewItemClick('description', e.target.value)}
                            placeholder="Descrição complementar do item..."
                            rows={2}
                            className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 text-sm sm:text-base resize-none"
                          />
                        </div>

                        <div className="p-2.5 bg-seguranca-red/10 border border-seguranca-red/30 rounded-lg text-xs text-gray-300">
                          O item será criado com saldo zero; a quantidade digitada em <strong className="text-white">Quantidade</strong> será aplicada como primeira entrada (saldo final: {formData.quantity || 0}).
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                      Número do Documento
                    </Label>
                    <Input
                      id="documentNumber"
                      value={formData.documentNumber}
                      onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                      placeholder="NF, recibo, etc."
                      className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                      Fornecedor
                    </Label>
                    {suppliers.length === 0 ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-xs sm:text-sm text-yellow-400 mb-2">
                            Nenhum fornecedor cadastrado. Cadastre um fornecedor para continuar.
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
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-seguranca-graphite border-gray-600" align="start">
                            <Command shouldFilter={false} className="bg-seguranca-graphite text-white">
                              <CommandInput 
                                placeholder="Buscar por nome ou CNPJ..." 
                                className="text-white"
                                value={supplierSearchTerm}
                                onValueChange={setSupplierSearchTerm}
                              />
                              <CommandList className="max-h-60 overflow-y-auto">
                                <CommandEmpty className="text-gray-400 py-4 text-center text-sm">
                                  {supplierSearchTerm 
                                    ? 'Nenhum fornecedor encontrado para este termo/CNPJ.'
                                    : 'Nenhum fornecedor disponível.'}
                                </CommandEmpty>
                                <CommandGroup>
                                  {filteredSuppliers.map((supplier) => (
                                    <CommandItem
                                      key={supplier.id}
                                      value={supplier.name}
                                      onSelect={() => {
                                        handleInputChange('supplier', supplier.name);
                                        setSupplierComboboxOpen(false);
                                        setSupplierSearchTerm('');
                                      }}
                                      className="text-white hover:bg-seguranca-black focus:bg-seguranca-black cursor-pointer py-2"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          formData.supplier === supplier.name ? 'opacity-100' : 'opacity-0'
                                        }`}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{supplier.name}</span>
                                        {supplier.cnpj && (
                                          <span className="text-xs text-gray-400 font-mono">CNPJ: {supplier.cnpj}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                {filteredSuppliers.length >= 50 && (
                                  <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-700">
                                    Mostrando os primeiros 50 resultados. Digite para refinar por nome ou CNPJ.
                                  </div>
                                )}
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
                  <Label htmlFor="unitCost" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
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
              </div>
            )}

            {/* Documento para saídas */}
            {formData.movementType === MovementType.SAIDA && (
              <div className="space-y-2">
                <Label htmlFor="documentNumber" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  Número do Documento
                </Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                  placeholder="NF, recibo, etc."
                  className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            )}

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
                placeholder="Observações sobre a movimentação..."
                rows={3}
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
                disabled={loading || (!selectedItem && !(isCreatingNewEntryItem && newItem.code.trim() && newItem.name.trim()))}
                className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red shadow-lg shadow-seguranca-red/20 px-4 sm:px-6 h-10 sm:h-11 text-sm sm:text-base order-1 sm:order-2"
              >
                {loading ? 'Registrando...' : 'Registrar Movimentação'}
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

export default StockMovementModal;
