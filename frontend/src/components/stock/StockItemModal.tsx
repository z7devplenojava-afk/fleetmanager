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
import { StockLabelPrintModal } from './StockLabelPrintModal';
import { stockLabelService } from '@/services/stockLabelService';
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
  Wand2,
  Printer,
  QrCode,
  Plus,
  Search,
  Check,
  ChevronsUpDown,
  Shield,
  HardHat,
  Loader2,
  CreditCard,
  FileCheck,
  Trash2,
  Receipt,
  Upload
} from 'lucide-react';
import { caepiService } from '@/services/caepiService';
import { stockNfeService } from '@/services/stockNfeService';

const CATEGORIES_WITH_SIZE = new Set<StockCategory>([
  StockCategory.UNIFORME_MOTORISTA,
  StockCategory.UNIFORME_OFICINA,
  StockCategory.UNIFORME_ADMINISTRATIVO,
  StockCategory.EPI,
  StockCategory.CALCADOS,
  StockCategory.UNIFORME_VIGILANCIA,
  StockCategory.UNIFORME_SERVICOS,
  StockCategory.UNIFORME_COZINHA,
]);


export const generateStockCode = (name: string, category: StockCategory, sizeVariation?: string): string => {
  if (!name || !name.trim()) return '';

  const categoryPrefixMap: Record<string, string> = {
    [StockCategory.EPI]: 'EPI',
    [StockCategory.CALCADOS]: 'CAL',
    [StockCategory.UNIFORME_MOTORISTA]: 'UNI-MOT',
    [StockCategory.UNIFORME_OFICINA]: 'UNI-OFI',
    [StockCategory.UNIFORME_ADMINISTRATIVO]: 'UNI-ADM',
    [StockCategory.UNIFORME_VIGILANCIA]: 'UNI-VIG',
    [StockCategory.UNIFORME_SERVICOS]: 'UNI-SER',
    [StockCategory.UNIFORME_COZINHA]: 'UNI-COZ',
    [StockCategory.PECAS_MECANICA]: 'PEC-MEC',
    [StockCategory.PECAS_ELETRICA]: 'PEC-ELE',
    [StockCategory.PECAS_LATARIA]: 'PEC-LAT',
    [StockCategory.PECAS_PNEUMATICA]: 'PEC-PNE',
    [StockCategory.LUBRIFICANTES]: 'LUB',
    [StockCategory.FILTROS]: 'FIL',
    [StockCategory.PNEUS]: 'PNE',
    [StockCategory.BATERIAS]: 'BAT',
    [StockCategory.FERRAMENTAS]: 'FER',
    [StockCategory.MATERIAL_LIMPEZA]: 'LIM',
    [StockCategory.MATERIAL_ESCRITORIO]: 'ESC',
    [StockCategory.COMBUSTIVEL]: 'COMB',
    [StockCategory.OUTROS]: 'OUT'
  };

  const prefix = categoryPrefixMap[category] || 'ITEM';

  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .trim();

  const stopWords = new Set(['DE', 'DO', 'DA', 'DOS', 'DAS', 'PARA', 'COM', 'E', 'EM', 'POR', 'SEM']);
  const words = cleanName.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

  let namePart = '';
  if (words.length === 1) {
    namePart = words[0].slice(0, 8);
  } else if (words.length >= 2) {
    namePart = words.slice(0, 3).map(w => w.slice(0, 4)).join('-');
  } else {
    namePart = cleanName.slice(0, 6);
  }

  let code = `${prefix}-${namePart}`;

  if (sizeVariation && sizeVariation.trim()) {
    const cleanSize = sizeVariation.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    code += `-${cleanSize}`;
  }

  return code;
};


export interface InvoiceItem {
  id: string;
  code?: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceInstallment {
  number: number;
  dueDate: string;
  value: number;
}

export interface InvoiceData {
  series?: string;
  issueDate?: string;
  entryDate?: string;
  accessKey?: string;
  paymentMethod: string;
  paymentCondition: string;
  installmentsCount: number;
  firstDueDate?: string;
  totalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  installments: InvoiceInstallment[];
  items: InvoiceItem[];
}

interface StockItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: StockItem | null;
  onSave: () => void;
  existingItems?: StockItem[];
}

const StockItemModal: React.FC<StockItemModalProps> = ({
  open,
  onOpenChange,
  item,
  onSave,
  existingItems
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierComboboxOpen, setSupplierComboboxOpen] = useState(false);
  const [unitCostDisplay, setUnitCostDisplay] = useState('');
  const [averageCostDisplay, setAverageCostDisplay] = useState('');
  const [loadingCa, setLoadingCa] = useState(false);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [allItems, setAllItems] = useState<StockItem[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [previewQrUrl, setPreviewQrUrl] = useState('');
  
  // Estados para NF de Entrada (Condições de Pagamento e Itens Fiscais)
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    series: '1',
    issueDate: new Date().toISOString().split('T')[0],
    entryDate: new Date().toISOString().split('T')[0],
    accessKey: '',
    paymentMethod: 'BOLETO',
    paymentCondition: '30_DIAS',
    installmentsCount: 1,
    firstDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalAmount: 0,
    shippingAmount: 0,
    discountAmount: 0,
    installments: [],
    items: []
  });

  const [newInvoiceItem, setNewInvoiceItem] = useState<{
    code: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }>({
    code: '',
    description: '',
    unit: 'UN',
    quantity: 1,
    unitPrice: 0
  });

  const xmlInputRef = React.useRef<HTMLInputElement>(null);
  const [loadingXml, setLoadingXml] = useState(false);

  const handleXmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo XML de NF-e válido.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoadingXml(true);
      const data = await stockNfeService.parseXml(file);

      // Atualizar dados do formulário principal
      setFormData(prev => ({
        ...prev,
        invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
        supplier: data.supplierName || prev.supplier
      }));

      const invoiceItems = data.items.map(it => ({
        productCode: it.productCode || '',
        description: it.description || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        totalPrice: it.totalPrice || 0
      }));

      const invoiceInstallments = (data.installments || []).map(inst => ({
        number: inst.installmentNumber,
        dueDate: inst.dueDate,
        value: inst.amount
      }));

      setInvoiceData(prev => ({
        ...prev,
        series: data.series || prev.series,
        issueDate: data.issueDate || prev.issueDate,
        accessKey: data.accessKey || prev.accessKey,
        totalAmount: data.totalInvoiceAmount || prev.totalAmount,
        installmentsCount: invoiceInstallments.length > 0 ? invoiceInstallments.length : 1,
        firstDueDate: invoiceInstallments.length > 0 ? invoiceInstallments[0].dueDate : prev.firstDueDate,
        installments: invoiceInstallments,
        items: invoiceItems
      }));

      // Se for novo cadastro e ainda não preencheu o nome
      if (data.items.length > 0 && !formData.name) {
        const first = data.items[0];
        setFormData(prev => ({
          ...prev,
          name: first.description || prev.name,
          unitCost: first.unitPrice || prev.unitCost,
          currentQuantity: first.quantity || prev.currentQuantity,
          barcode: first.barcode || prev.barcode,
          category: (first.suggestedCategory as StockCategory) || prev.category
        }));
        if (first.unitPrice) {
          setUnitCostDisplay(formatCurrencyFromNumber(first.unitPrice));
        }
      }

      toast({
        title: 'XML importado com sucesso!',
        description: `NF-e nº ${data.invoiceNumber} (${data.supplierName}) carregada com ${data.items.length} item(ns) e ${data.installments.length} parcela(s).`
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao ler XML',
        description: err.response?.data?.message || err.message || 'Falha ao processar arquivo XML.',
        variant: 'destructive'
      });
    } finally {
      setLoadingXml(false);
      if (xmlInputRef.current) xmlInputRef.current.value = '';
    }
  };

  // Função para recalcular parcelas
  const recalculateInstallments = (total: number, count: number, firstDueStr?: string) => {
    if (!total || total <= 0 || !count || count <= 0) {
      setInvoiceData(prev => ({ ...prev, installments: [] }));
      return;
    }
    const baseDate = firstDueStr ? new Date(firstDueStr + 'T12:00:00') : new Date();
    const partValue = Math.floor((total / count) * 100) / 100;
    const diff = Math.round((total - partValue * count) * 100) / 100;

    const list: InvoiceInstallment[] = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date(baseDate);
      if (i > 1) {
        d.setDate(d.getDate() + (i - 1) * 30);
      }
      list.push({
        number: i,
        dueDate: d.toISOString().split('T')[0],
        value: i === 1 ? Number((partValue + diff).toFixed(2)) : Number(partValue.toFixed(2))
      });
    }
    setInvoiceData(prev => ({ ...prev, installments: list }));
  };

  const handleAddInvoiceItem = () => {
    if (!newInvoiceItem.description.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe a descrição do produto na nota fiscal.',
        variant: 'destructive'
      });
      return;
    }
    if (newInvoiceItem.quantity <= 0) {
      toast({
        title: 'Quantidade inválida',
        description: 'A quantidade deve ser de no mínimo 1.',
        variant: 'destructive'
      });
      return;
    }

    const totalItem = Number((newInvoiceItem.quantity * newInvoiceItem.unitPrice).toFixed(2));
    const itemToAdd: InvoiceItem = {
      id: Math.random().toString(36).substring(2, 9),
      code: newInvoiceItem.code.trim() || undefined,
      description: newInvoiceItem.description.trim(),
      unit: newInvoiceItem.unit || 'UN',
      quantity: newInvoiceItem.quantity,
      unitPrice: newInvoiceItem.unitPrice,
      totalPrice: totalItem
    };

    setInvoiceData(prev => {
      const updatedItems = [...prev.items, itemToAdd];
      const sumTotal = updatedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
      const newTotal = prev.totalAmount === 0 ? sumTotal : prev.totalAmount;
      recalculateInstallments(newTotal, prev.installmentsCount, prev.firstDueDate);
      return {
        ...prev,
        items: updatedItems,
        totalAmount: newTotal
      };
    });

    setNewInvoiceItem({
      code: '',
      description: '',
      unit: 'UN',
      quantity: 1,
      unitPrice: 0
    });

    toast({
      title: 'Item incluído na NF',
      description: `${itemToAdd.description} adicionado aos itens da nota.`
    });
  };

  const handleRemoveInvoiceItem = (id: string) => {
    setInvoiceData(prev => {
      const filtered = prev.items.filter(i => i.id !== id);
      return { ...prev, items: filtered };
    });
  };

  const handleCopyCurrentItemToInvoice = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Preencha o nome do item',
        description: 'Digite o nome do produto no formulário principal primeiro.',
        variant: 'destructive'
      });
      return;
    }
    setNewInvoiceItem({
      code: formData.code || '',
      description: formData.name,
      unit: 'UN',
      quantity: formData.currentQuantity > 0 ? formData.currentQuantity : 1,
      unitPrice: formData.unitCost || 0
    });
  };

  const [formData, setFormData] = useState<CreateStockItemDTO>({
    code: '',
    name: '',
    category: StockCategory.PECAS_MECANICA,
    sizeVariation: '',
    description: '',
    currentQuantity: 0,
    minimumQuantity: 0,
    unitCost: 0,
    averageCost: 0,
    supplier: '',
    invoiceNumber: '',
    barcode: '',
    notes: '',
    caNumber: '',
    caValidity: '',
    manufacturer: ''
  });
  
  useEffect(() => {
    if (open) {
      if (!existingItems || existingItems.length === 0) {
        stockService.getAllItems()
          .then(data => setAllItems(Array.isArray(data) ? data : []))
          .catch(err => console.warn('Erro ao carregar lista de itens para autocomplete:', err));
      }
      if (item) {
        setCodeManuallyEdited(true);
        stockLabelService.getQrDataUrl(item)
          .then(url => setPreviewQrUrl(url))
          .catch(err => console.warn('Erro ao carregar preview QR:', err));
      } else {
        setCodeManuallyEdited(false);
        setPreviewQrUrl('');
      }
    }
  }, [open, item, existingItems]);

  const distinctItemNames = useMemo(() => {
    const list = existingItems && existingItems.length > 0 ? existingItems : allItems;
    const names = new Set<string>();
    list.forEach(it => {
      if (it.name && it.name.trim()) names.add(it.name.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [existingItems, allItems]);

  const hasSizeVariation = CATEGORIES_WITH_SIZE.has(formData.category) || Boolean(formData.sizeVariation);
  const isEpiCategory = formData.category === StockCategory.EPI ||
    formData.category === StockCategory.CALCADOS ||
    formData.category === StockCategory.UNIFORME_MOTORISTA ||
    formData.category === StockCategory.UNIFORME_OFICINA ||
    formData.category === StockCategory.UNIFORME_ADMINISTRATIVO ||
    Boolean(formData.caNumber);

  const handleConsultarCA = async () => {
    if (!formData.caNumber || formData.caNumber.trim().length < 2) {
      toast({
        title: 'Atenção',
        description: 'Informe o número do CA para consultar.',
        variant: 'destructive'
      });
      return;
    }
    try {
      setLoadingCa(true);
      const caInfo = await caepiService.buscarCA(formData.caNumber.trim());
      if (caInfo) {
        handleInputChange('caNumber', caInfo.numero);
        if (caInfo.validade) {
          handleInputChange('caValidity', caInfo.validade);
        }
        if (caInfo.fabricante && !formData.manufacturer) {
          handleInputChange('manufacturer', caInfo.fabricante);
        }
        toast({
          title: 'CA Localizado',
          description: `CA ${caInfo.numero} - ${caInfo.nome || caInfo.equipamento || 'Válido'}`
        });
      } else {
        toast({
          title: 'CA não encontrado',
          description: 'Nenhum registro oficial retornado para este número de CA.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.warn('Erro ao consultar CA:', err);
    } finally {
      setLoadingCa(false);
    }
  };

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
        averageCost: item.averageCost || 0,
        supplier: item.supplier || '',
        invoiceNumber: item.invoiceNumber || '',
        barcode: item.barcode || '',
        notes: item.notes || '',
        caNumber: item.caNumber || '',
        caValidity: item.caValidity || '',
        manufacturer: item.manufacturer || ''
      });
      // Formatar o valor do custo unitário para exibição
      if (item.unitCost) {
        setUnitCostDisplay(formatCurrencyFromNumber(item.unitCost));
      } else {
        setUnitCostDisplay('');
      }
      if (item.averageCost) {
        setAverageCostDisplay(formatCurrencyFromNumber(item.averageCost));
      } else {
        setAverageCostDisplay('');
      }
    } else {
      setFormData({
        code: '',
        name: '',
        category: StockCategory.PECAS_MECANICA,
        sizeVariation: '',
        description: '',
        currentQuantity: 0,
        minimumQuantity: 0,
        unitCost: 0,
        averageCost: 0,
        supplier: '',
        invoiceNumber: '',
        barcode: '',
        notes: '',
        caNumber: '',
        caValidity: '',
        manufacturer: ''
      });
      setUnitCostDisplay('');
      setAverageCostDisplay('');
    }
  }, [item, open]);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await contasAPagarService.getFornecedores();
      if (Array.isArray(data)) {
        const filtered = data.filter(s => s && s.id && s.name && s.isActive !== false);
        setSuppliers(filtered);
      } else {
        setSuppliers([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const allAvailableSuppliers = useMemo(() => {
    const list = [...suppliers];
    const knownNames = new Set(list.map(s => s.name.toLowerCase().trim()));
    const itemsSource = existingItems && existingItems.length > 0 ? existingItems : allItems;
    itemsSource.forEach(it => {
      if (it.supplier && it.supplier.trim() && !knownNames.has(it.supplier.trim().toLowerCase())) {
        knownNames.add(it.supplier.trim().toLowerCase());
        list.push({
          id: 'stock-sup-' + it.supplier.trim(),
          name: it.supplier.trim(),
          cnpj: '',
          isActive: true
        } as Supplier);
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [suppliers, existingItems, allItems]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm) {
      return allAvailableSuppliers.slice(0, 50);
    }
    const term = supplierSearchTerm.toLowerCase().trim();
    const cleanDigits = term.replace(/\D/g, '');
    return allAvailableSuppliers.filter(s => {
      const nameMatch = s?.name?.toLowerCase().includes(term);
      const sCnpjClean = s?.cnpj ? s.cnpj.replace(/\D/g, '') : '';
      const cnpjMatch = s?.cnpj?.toLowerCase().includes(term) || (cleanDigits.length >= 2 && sCnpjClean.includes(cleanDigits));
      return nameMatch || cnpjMatch;
    }).slice(0, 50);
  }, [allAvailableSuppliers, supplierSearchTerm]);

  const selectedSupplier = allAvailableSuppliers.find(s => s.name === formData.supplier);

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

  const handleAverageCostChange = (value: string) => {
    const formatted = formatCurrency(value);
    setAverageCostDisplay(formatted);
    const numericValue = formatted ? parseCurrency(formatted) : 0;
    handleInputChange('averageCost', numericValue);
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
    
        if (formData.currentQuantity > 0 && (!formData.invoiceNumber || !formData.invoiceNumber.trim())) {
      toast({
        title: 'Nota Fiscal de Entrada Obrigatória',
        description: 'Para itens com saldo inicial em estoque, é obrigatório informar a Nota Fiscal de Entrada.',
        variant: 'destructive'
      });
      return;
    }

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
        averageCost: (formData.averageCost && formData.averageCost > 0) ? 
                  (typeof formData.averageCost === 'number' ? formData.averageCost : parseFloat(String(formData.averageCost))) : 
                  undefined,
        supplier: formData.supplier?.trim() || undefined,
        invoiceNumber: formData.invoiceNumber?.trim() || undefined,
        barcode: formData.barcode?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        caNumber: formData.caNumber?.trim() || undefined,
        caValidity: formData.caValidity || undefined,
        manufacturer: formData.manufacturer?.trim() || undefined
      };

      // Validar que unitCost não seja NaN
      if (dataToSend.unitCost !== undefined && isNaN(dataToSend.unitCost)) {
        dataToSend.unitCost = undefined;
      }
      if (dataToSend.averageCost !== undefined && isNaN(dataToSend.averageCost)) {
        dataToSend.averageCost = undefined;
      }

            if (formData.invoiceNumber && formData.invoiceNumber.trim()) {
        const nfNum = formData.invoiceNumber.trim();
        const nfSummary = `[NF-e nº ${nfNum}] Condição: ${invoiceData.paymentMethod} (${invoiceData.paymentCondition}, ${invoiceData.installmentsCount}x) | Total NF: R$ ${invoiceData.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Itens na NF: ${invoiceData.items.length}`;
        dataToSend.notes = dataToSend.notes ? `${dataToSend.notes}\n${nfSummary}` : nfSummary;
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
      
      window.dispatchEvent(new CustomEvent('stock-data-changed'));
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                      Nome do Item *
                    </Label>
                    {distinctItemNames.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {distinctItemNames.length} no catálogo
                      </span>
                    )}
                  </div>
                  <Input
                    id="name"
                    list="stock-items-autocomplete-list"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      handleInputChange('name', newName);
                      if (!item && !codeManuallyEdited) {
                        const autoCode = generateStockCode(newName, formData.category, formData.sizeVariation);
                        handleInputChange('code', autoCode);
                      }
                      const match = (existingItems && existingItems.length > 0 ? existingItems : allItems)
                        .find(it => it.name.toLowerCase() === newName.toLowerCase().trim());
                      if (match && !item) {
                        if (match.category) handleInputChange('category', match.category);
                        if (match.supplier && !formData.supplier) handleInputChange('supplier', match.supplier);
                        if (match.caNumber && !formData.caNumber) handleInputChange('caNumber', match.caNumber);
                        if (match.caValidity && !formData.caValidity) handleInputChange('caValidity', match.caValidity);
                        if (match.manufacturer && !formData.manufacturer) handleInputChange('manufacturer', match.manufacturer);
                      }
                    }}
                    placeholder="Selecione da lista ou digite um novo nome..."
                    required
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  />
                  <datalist id="stock-items-autocomplete-list">
                    {distinctItemNames.map((n, idx) => (
                      <option key={idx} value={n} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="code" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                      <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                      Código *
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const autoCode = generateStockCode(formData.name, formData.category, formData.sizeVariation);
                        handleInputChange('code', autoCode);
                        setCodeManuallyEdited(false);
                        toast({ title: 'Código Gerado', description: autoCode });
                      }}
                      className="h-6 px-1.5 text-[11px] text-seguranca-yellow hover:text-yellow-400 hover:bg-yellow-500/10"
                      title="Gerar código automaticamente baseado no nome e categoria"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Gerar Auto
                    </Button>
                  </div>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => {
                      handleInputChange('code', e.target.value);
                      setCodeManuallyEdited(true);
                    }}
                    placeholder="Ex: UNI-VIG-CAM-M"
                    required
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base font-mono font-semibold"
                  />
                </div>
              </div>

              <div className={`grid grid-cols-1 ${hasSizeVariation ? 'sm:grid-cols-2' : ''} gap-3 sm:gap-4`}>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                    <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                    Categoria *
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => {
                      const newCat = value as StockCategory;
                      handleInputChange('category', newCat);
                      if (!CATEGORIES_WITH_SIZE.has(newCat) && !item) {
                        handleInputChange('sizeVariation', '');
                      }
                    }}
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

                {hasSizeVariation && (
                  <div className="space-y-2">
                    <Label htmlFor="sizeVariation" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                      <Ruler className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                      Tamanho / Numeração (Variação)
                    </Label>
                    <Input
                      id="sizeVariation"
                      value={formData.sizeVariation || ''}
                      onChange={(e) => handleInputChange('sizeVariation', e.target.value)}
                      placeholder={formData.category === StockCategory.CALCADOS ? 'Ex: 38, 39, 40, 41, 42...' : 'Ex: P, M, G, GG, EXG...'}
                      className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                )}
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

            {/* Especificação de EPI / SST */}
            {isEpiCategory && (
              <div className="space-y-3 sm:space-y-4 p-4 rounded-xl bg-gradient-to-r from-seguranca-red/10 to-transparent border border-seguranca-red/20 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
                    <span>Equipamento de Proteção Individual (EPI / SST)</span>
                  </h3>
                  <Badge variant="outline" className="border-seguranca-red/40 text-seguranca-red text-xs">
                    Sincronização SST Ativa
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">
                  Itens com dados de EPI são integrados automaticamente ao módulo de SST para emissão de Fichas de Entrega e controle de validade do CA.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="caNumber" className="text-gray-300 flex items-center justify-between text-sm sm:text-base">
                      <span>Número do CA</span>
                      <button
                        type="button"
                        onClick={handleConsultarCA}
                        disabled={loadingCa || !formData.caNumber}
                        className="text-xs text-seguranca-red hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        {loadingCa ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                        Consultar CA
                      </button>
                    </Label>
                    <Input
                      id="caNumber"
                      value={formData.caNumber || ''}
                      onChange={(e) => handleInputChange('caNumber', e.target.value)}
                      onBlur={() => {
                        if (formData.caNumber && !formData.caValidity && !loadingCa) {
                          handleConsultarCA();
                        }
                      }}
                      placeholder="Ex: 35000"
                      className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caValidity" className="text-gray-300 text-sm sm:text-base">
                      Validade do CA
                    </Label>
                    <Input
                      id="caValidity"
                      type="date"
                      value={formData.caValidity || ''}
                      onChange={(e) => handleInputChange('caValidity', e.target.value)}
                      className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manufacturer" className="text-gray-300 text-sm sm:text-base">
                      Fabricante do EPI
                    </Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer || ''}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                      placeholder="Ex: 3M, Marluvas, Danny..."
                      className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            )}

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
                    Vr. Compra (R$)
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
                  <Label htmlFor="averageCost" className="text-gray-300 text-sm sm:text-base">
                    Custo Médio (R$)
                  </Label>
                  <Input
                    id="averageCost"
                    type="text"
                    value={averageCostDisplay}
                    onChange={(e) => handleAverageCostChange(e.target.value)}
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
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-sm text-gray-400">
                                    Nenhum fornecedor disponível
                                  </div>
                                )}
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="invoiceNumber" className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                      NF de Entrada {formData.currentQuantity > 0 ? '*' : ''}
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => xmlInputRef.current?.click()}
                        disabled={loadingXml}
                        className="h-6 text-[11px] border-seguranca-yellow/40 text-seguranca-yellow hover:text-white hover:bg-seguranca-yellow/20 px-2 flex items-center gap-1 font-semibold"
                        title="Carregar dados de itens e faturamento a partir do XML da NF-e"
                      >
                        {loadingXml ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        Importar XML
                      </Button>
                      <input
                        ref={xmlInputRef}
                        type="file"
                        accept=".xml,text/xml"
                        className="hidden"
                        onChange={handleXmlUpload}
                      />
                      {formData.currentQuantity > 0 && (
                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5 animate-pulse">
                          Obrigatório p/ Saldo &gt; 0
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber || ''}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    placeholder={formData.currentQuantity > 0 ? "Obrigatório: Ex: NF 12345 / DANFE" : "Ex: NF 12345 / DANFE (Opcional)"}
                    required={formData.currentQuantity > 0}
                    className={`bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base ${
                      formData.currentQuantity > 0 && !formData.invoiceNumber ? 'border-amber-500 ring-1 ring-amber-500/20' : ''
                    }`}
                  />
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

            {/* Painel Expansível de Detalhes Fiscais da NF de Entrada e Condições Comerciais */}
            {Boolean(formData.invoiceNumber && formData.invoiceNumber.trim()) && (
              <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-blue-950/30 to-seguranca-black/80 border border-blue-500/40 shadow-xl animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        Detalhamento Fiscal & Financeiro da Entrada
                        <Badge variant="outline" className="border-blue-400 text-blue-400 text-[10px] font-mono">
                          NF: {formData.invoiceNumber}
                        </Badge>
                      </h4>
                      <p className="text-xs text-gray-400">
                        Informe as condições de pagamento negociadas e os itens discriminados na nota fiscal.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => xmlInputRef.current?.click()}
                    disabled={loadingXml}
                    className="border-blue-400/40 text-blue-300 hover:text-white hover:bg-blue-500/20 text-xs font-semibold self-start sm:self-auto"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Atualizar pelo XML
                  </Button>
                </div>

                {/* 1. Condições de Pagamento e Faturamento */}
                <div className="space-y-3 bg-seguranca-black/40 border border-gray-700/60 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
                    <CreditCard className="h-4 w-4 text-blue-400" />
                    <span>Condições de Pagamento & Vencimentos</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* Forma de Pagamento */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-300 text-xs">Forma de Pagamento</Label>
                      <Select
                        value={invoiceData.paymentMethod}
                        onValueChange={(val) => setInvoiceData(prev => ({ ...prev, paymentMethod: val }))}
                      >
                        <SelectTrigger className="bg-seguranca-black/60 border-gray-600 text-white h-9 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-white">
                          <SelectItem value="BOLETO">Boleto Bancário</SelectItem>
                          <SelectItem value="PIX">Pix Corporativo</SelectItem>
                          <SelectItem value="TRANSFERENCIA">Transferência (TED/DOC)</SelectItem>
                          <SelectItem value="CARTAO">Cartão Corporativo</SelectItem>
                          <SelectItem value="FATURADO">Duplicata / A Prazo</SelectItem>
                          <SelectItem value="DINHEIRO">Dinheiro / Espécie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Condição Comercial */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-300 text-xs">Condição de Prazo</Label>
                      <Select
                        value={invoiceData.paymentCondition}
                        onValueChange={(val) => {
                          let count = 1;
                          if (val === 'A_VISTA') count = 1;
                          else if (val === '30_60') count = 2;
                          else if (val === '30_60_90') count = 3;
                          else if (val === '30_60_90_120') count = 4;
                          setInvoiceData(prev => {
                            const updated = { ...prev, paymentCondition: val, installmentsCount: count };
                            recalculateInstallments(updated.totalAmount, count, updated.firstDueDate);
                            return updated;
                          });
                        }}
                      >
                        <SelectTrigger className="bg-seguranca-black/60 border-gray-600 text-white h-9 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-white">
                          <SelectItem value="A_VISTA">À Vista (0 dias)</SelectItem>
                          <SelectItem value="15_DIAS">15 Dias</SelectItem>
                          <SelectItem value="28_DDL">28 DDL</SelectItem>
                          <SelectItem value="30_DIAS">30 Dias</SelectItem>
                          <SelectItem value="30_60">30 / 60 Dias (2x)</SelectItem>
                          <SelectItem value="30_60_90">30 / 60 / 90 Dias (3x)</SelectItem>
                          <SelectItem value="30_60_90_120">30 / 60 / 90 / 120 Dias (4x)</SelectItem>
                          <SelectItem value="PERSONALIZADA">Personalizada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantidade de Parcelas */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-300 text-xs">Parcelas</Label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={invoiceData.installmentsCount}
                        onChange={(e) => {
                          const count = Math.max(1, parseInt(e.target.value) || 1);
                          setInvoiceData(prev => {
                            const updated = { ...prev, installmentsCount: count };
                            recalculateInstallments(updated.totalAmount, count, updated.firstDueDate);
                            return updated;
                          });
                        }}
                        className="bg-seguranca-black/60 border-gray-600 text-white h-9 text-xs"
                      />
                    </div>

                    {/* 1º Vencimento */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-300 text-xs">1º Vencimento</Label>
                      <Input
                        type="date"
                        value={invoiceData.firstDueDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInvoiceData(prev => {
                            const updated = { ...prev, firstDueDate: val };
                            recalculateInstallments(updated.totalAmount, updated.installmentsCount, val);
                            return updated;
                          });
                        }}
                        className="bg-seguranca-black/60 border-gray-600 text-white h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Valor Total da NF e Grade de Parcelas */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 items-center">
                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-gray-300 text-xs font-semibold flex items-center justify-between">
                        <span>Valor Total da Nota Fiscal (R$)</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceData.totalAmount || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setInvoiceData(prev => {
                            const updated = { ...prev, totalAmount: val };
                            recalculateInstallments(val, updated.installmentsCount, updated.firstDueDate);
                            return updated;
                          });
                        }}
                        placeholder="0,00"
                        className="bg-seguranca-black border-blue-500/40 text-white font-bold h-9 text-sm text-emerald-400"
                      />
                    </div>

                    {/* Grade das Parcelas Geradas */}
                    <div className="md:col-span-8">
                      <Label className="text-gray-400 text-[11px] block mb-1">
                        Cronograma das Parcelas ({invoiceData.installments.length}x):
                      </Label>
                      {invoiceData.installments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {invoiceData.installments.map((inst) => (
                            <div
                              key={inst.number}
                              className="px-2.5 py-1 rounded bg-seguranca-black/80 border border-gray-700 text-[11px] flex items-center gap-1.5"
                            >
                              <span className="text-gray-400 font-mono">#{inst.number}:</span>
                              <span className="text-gray-200">
                                {inst.dueDate ? new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                              </span>
                              <span className="text-emerald-400 font-bold">
                                R$ {inst.value.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">
                          Informe o valor total para calcular as parcelas automaticamente.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Itens Faturados na Nota Fiscal */}
                <div className="space-y-3 bg-seguranca-black/40 border border-gray-700/60 rounded-xl p-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
                      <Receipt className="h-4 w-4 text-blue-400" />
                      <span>Itens Faturados na Nota Fiscal ({invoiceData.items.length})</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCurrentItemToInvoice}
                      className="h-7 text-[11px] border-blue-500/40 text-blue-300 hover:bg-blue-500/10 px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Puxar dados do item atual
                    </Button>
                  </div>

                  {/* Form de Adição de Item na NF */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end pt-1 bg-seguranca-black/30 p-2.5 rounded-lg border border-gray-800">
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] text-gray-400">Cód / Ref</Label>
                      <Input
                        value={newInvoiceItem.code}
                        onChange={(e) => setNewInvoiceItem(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="Ref NF"
                        className="bg-seguranca-black border-gray-700 text-white text-xs h-8"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[10px] text-gray-400">Descrição do Produto na NF *</Label>
                      <Input
                        value={newInvoiceItem.description}
                        onChange={(e) => setNewInvoiceItem(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Ex: Correia dentada 12x45"
                        className="bg-seguranca-black border-gray-700 text-white text-xs h-8"
                      />
                    </div>

                    <div className="sm:col-span-1 space-y-1">
                      <Label className="text-[10px] text-gray-400">Un</Label>
                      <Input
                        value={newInvoiceItem.unit}
                        onChange={(e) => setNewInvoiceItem(prev => ({ ...prev, unit: e.target.value.toUpperCase() }))}
                        placeholder="UN"
                        className="bg-seguranca-black border-gray-700 text-white text-xs h-8 text-center"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] text-gray-400">Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newInvoiceItem.quantity}
                        onChange={(e) => setNewInvoiceItem(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="bg-seguranca-black border-gray-700 text-white text-xs h-8 text-center font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] text-gray-400">Vl. Unit (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newInvoiceItem.unitPrice || ''}
                        onChange={(e) => setNewInvoiceItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                        placeholder="0,00"
                        className="bg-seguranca-black border-gray-700 text-white text-xs h-8 text-right text-emerald-400 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <Button
                        type="button"
                        onClick={handleAddInvoiceItem}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 px-2 text-xs flex items-center justify-center shadow"
                        title="Incluir Item"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tabela de Itens da NF */}
                  {invoiceData.items.length > 0 ? (
                    <div className="border border-gray-700/80 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-seguranca-black/80 text-gray-400 border-b border-gray-700">
                          <tr>
                            <th className="py-1.5 px-2 w-16">Cód</th>
                            <th className="py-1.5 px-2">Descrição</th>
                            <th className="py-1.5 px-2 w-12 text-center">Un</th>
                            <th className="py-1.5 px-2 w-14 text-center">Qtd</th>
                            <th className="py-1.5 px-2 w-20 text-right">Unitário</th>
                            <th className="py-1.5 px-2 w-24 text-right">Total</th>
                            <th className="py-1.5 px-2 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/60">
                          {invoiceData.items.map((it) => (
                            <tr key={it.id} className="hover:bg-seguranca-black/40">
                              <td className="py-1.5 px-2 font-mono text-gray-400">{it.code || '—'}</td>
                              <td className="py-1.5 px-2 font-medium text-white">{it.description}</td>
                              <td className="py-1.5 px-2 text-center text-gray-300 font-mono">{it.unit}</td>
                              <td className="py-1.5 px-2 text-center font-bold text-seguranca-yellow">{it.quantity}</td>
                              <td className="py-1.5 px-2 text-right text-gray-300">
                                R$ {it.unitPrice.toFixed(2)}
                              </td>
                              <td className="py-1.5 px-2 text-right font-bold text-emerald-400">
                                R$ {it.totalPrice.toFixed(2)}
                              </td>
                              <td className="py-1.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInvoiceItem(it.id)}
                                  className="text-red-400 hover:text-red-300 p-0.5"
                                  title="Remover item da nota"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-seguranca-black/90 border-t border-gray-700">
                          <tr>
                            <td colSpan={5} className="py-2 px-2 text-right font-bold text-gray-300 text-xs">
                              Soma dos Itens da NF:
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-emerald-400 text-xs">
                              R$ {invoiceData.items.reduce((acc, curr) => acc + curr.totalPrice, 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3 border border-dashed border-gray-700/80 rounded-lg text-gray-400 text-xs">
                      Nenhum item adicionado à nota ainda. Use o botão acima para incluir os itens faturados.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visualização da Etiqueta Física (Pimaco A4) */}
            <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-seguranca-graphite/90 to-seguranca-black/90 border border-gray-700/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-seguranca-yellow" />
                  <span className="font-semibold text-white text-sm">
                    Etiqueta com QRCode (Pimaco A4)
                  </span>
                  <Badge variant="outline" className="border-gray-600 text-gray-300 text-[10px]">
                    101.6 x 38.1 mm
                  </Badge>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!formData.code || !formData.name}
                  onClick={() => setShowPrintModal(true)}
                  className="border-seguranca-yellow/50 text-seguranca-yellow hover:bg-seguranca-yellow/10 h-8 text-xs font-semibold"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Imprimir Etiqueta Pimaco A4 (PDF)
                </Button>
              </div>

              {formData.code && formData.name ? (
                <div className="relative rounded-lg border border-slate-300 bg-white p-3 text-slate-800 shadow-md flex items-center justify-between gap-3 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-seguranca-red"></div>
                  <div className="pl-2 space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                      <span className="text-[9px] font-extrabold text-slate-900 tracking-wider">VIAÇÃO SÃO SILVESTRE</span>
                      <span className="text-[8px] text-slate-500 font-medium">ALMOXARIFADO</span>
                    </div>
                    <div className="text-[11px] font-mono font-black text-slate-900">{formData.code}</div>
                    <div className="text-[11px] font-bold text-slate-900 truncate">{formData.name}</div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-600 pt-0.5">
                      <span className="bg-slate-100 px-1 py-0.2 rounded font-medium">
                        {StockCategoryLabels[formData.category] || formData.category}
                      </span>
                      {formData.caNumber && (
                        <span className="bg-red-50 text-red-700 font-bold px-1 py-0.2 rounded border border-red-200">
                          CA: {formData.caNumber}
                        </span>
                      )}
                      <span className="font-semibold text-slate-800">
                        Estoque: {formData.currentQuantity} un
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded flex-shrink-0">
                    {previewQrUrl ? (
                      <img src={previewQrUrl} alt="QR Code" className="w-14 h-14 object-contain" />
                    ) : (
                      <QrCode className="w-14 h-14 text-slate-400 p-1" />
                    )}
                    <span className="text-[7px] font-bold text-slate-500 uppercase mt-0.5">QRCode</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Preencha o Código e Nome do item para visualizar a etiqueta gerada.
                </p>
              )}
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

      {/* Modal de Impressão de Etiquetas Pimaco */}
      {showPrintModal && (
        <StockLabelPrintModal
          open={showPrintModal}
          onOpenChange={setShowPrintModal}
          items={[
            item || ({
              id: 'preview-' + (formData.code || 'new'),
              code: formData.code,
              name: formData.name,
              fullName: formData.name + (formData.sizeVariation ? ' - ' + formData.sizeVariation : ''),
              category: formData.category,
              currentQuantity: formData.currentQuantity,
              minimumQuantity: formData.minimumQuantity,
              caNumber: formData.caNumber,
              caValidity: formData.caValidity,
              supplier: formData.supplier,
              invoiceNumber: formData.invoiceNumber
            } as StockItem)
          ]}
        />
      )}
    </>
  );
};

export default StockItemModal;
