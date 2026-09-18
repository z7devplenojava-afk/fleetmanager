import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, DollarSign, FileText, Clock, CreditCard, Truck, ShoppingCart, Plus, 
  ExternalLink, Image as ImageIcon, Camera, Trash2, Download, Sparkles, Wrench, 
  Car, Eye, X, Paperclip, FileSpreadsheet, File, ShieldCheck, CheckCircle2, Award,
  Search, Boxes, Check, PackageSearch, Layers
} from 'lucide-react';
import { Quotation, CreateQuotationRequest, UpdateQuotationRequest, QuotationStatus, quotationService } from '@/services/quotationService';
import { contasAPagarService, Supplier, CreateSupplierRequest } from '@/services/contasAPagarService';
import { purchaseRequestService, PurchaseRequest } from '@/services/purchaseRequestService';
import { materialRequisitionService, MaterialRequisition } from '@/services/materialRequisitionService';
import { stockService } from '@/services/stockService';
import { StockItem } from '@/types/stock';
import { 
  quotationRfpPdfGenerator, 
  QuotationPhotoItem, 
  QuotationSupplierAttachment, 
  QuotationPartItem, 
  QuotationRfpData 
} from '@/utils/quotationRfpPdfGenerator';
import { QuotationBudgetUploadModal } from '@/components/compras/QuotationBudgetUploadModal';
import { ParsedBudgetData } from '@/utils/quotationBudgetParser';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import { userService, User } from '@/services/userService';
import { PurchaseRequestViewModal } from '@/components/compras/PurchaseRequestViewModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface QuotationFormModalProps {
  quotation?: Quotation | null;
  onClose: () => void;
  initialPurchaseRequestId?: string;
  initialParsedBudget?: ParsedBudgetData | null;
  onCreated?: () => void;
}

interface FormData {
  title: string;
  description: string;
  supplierId: string;
  purchaseRequestId: string;
  unitId: string;
  totalValue: string;
  validUntil: string;
  terms: string;
  paymentMethod: string;
  deliveryMethod: string;
  notes: string;
  assignedToId: string;
  status?: QuotationStatus;
}

interface PartDetailsState {
  itemName: string;
  itemCode: string;
  brand: string;
  quantity: number;
  unit: string;
  vehiclePlate: string;
  vehicleModel: string;
  workOrderNumber: string;
  justification: string;
}

interface ComparisonCriteriaState {
  deliveryDays: number;
  warrantyMonths: number;
  freightType: string;
  partQuality: string;
}

const QuotationFormModal: React.FC<QuotationFormModalProps> = ({ 
  quotation, 
  onClose, 
  initialPurchaseRequestId, 
  initialParsedBudget,
  onCreated 
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    supplierId: '',
    purchaseRequestId: initialPurchaseRequestId || '',
    unitId: '',
    totalValue: '',
    validUntil: '',
    terms: '',
    paymentMethod: '',
    deliveryMethod: '',
    notes: '',
    assignedToId: '',
    status: 'DRAFT'
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [materialRequisitions, setMaterialRequisitions] = useState<MaterialRequisition[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingPurchaseRequests, setLoadingPurchaseRequests] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isViewPurchaseRequestModalOpen, setIsViewPurchaseRequestModalOpen] = useState(false);
  const [viewingPurchaseRequest, setViewingPurchaseRequest] = useState<PurchaseRequest | undefined>();
  const [photos, setPhotos] = useState<QuotationPhotoItem[]>([]);
  const [supplierAttachments, setSupplierAttachments] = useState<QuotationSupplierAttachment[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<QuotationPhotoItem | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isBudgetUploadModalOpen, setIsBudgetUploadModalOpen] = useState(false);

  // Busca e seleção rápida no catálogo de estoque
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isStockSearchOpen, setIsStockSearchOpen] = useState(false);
  const [showStockSuggestions, setShowStockSuggestions] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);

  // Critérios para Comparativo Inteligente
  const [comparisonCriteria, setComparisonCriteria] = useState<ComparisonCriteriaState>({
    deliveryDays: 1,
    warrantyMonths: 6,
    freightType: 'CIF_INCLUSO',
    partQuality: 'PRIMEIRA_LINHA'
  });

  // Dados Técnicos da Peça / Item
  const [partDetails, setPartDetails] = useState<PartDetailsState>({
    itemName: '',
    itemCode: '',
    brand: '',
    quantity: 1,
    unit: 'UN',
    vehiclePlate: '',
    vehicleModel: '',
    workOrderNumber: '',
    justification: ''
  });

  const { toast } = useToast();
  const isEditing = !!quotation;

  const handleApplyParsedBudget = (data: ParsedBudgetData) => {
    // 1. Tentar vincular fornecedor cadastrado por CNPJ ou nome
    let matchedSupplierId = '';
    if (suppliers.length > 0) {
      const match = suppliers.find(s => {
        if (data.supplier.cnpj && s.cnpj) {
          const c1 = s.cnpj.replace(/\D/g, '');
          const c2 = data.supplier.cnpj.replace(/\D/g, '');
          if (c1 && c2 && c1 === c2) return true;
        }
        if (s.nome && data.supplier.name) {
          const n1 = s.nome.toLowerCase().trim();
          const n2 = data.supplier.name.toLowerCase().trim();
          return n1.includes(n2) || n2.includes(n1);
        }
        return false;
      });
      if (match) {
        matchedSupplierId = String(match.id);
      }
    }

    // 2. Extrair primeiro item cotado disponível
    const primaryItem = data.items.find(i => i.isAvailable) || data.items[0];

    if (primaryItem) {
      setPartDetails(prev => ({
        ...prev,
        itemName: primaryItem.description || prev.itemName,
        itemCode: primaryItem.code || prev.itemCode,
        brand: primaryItem.brand || prev.brand,
        quantity: primaryItem.quantity || prev.quantity,
        unit: primaryItem.unit || prev.unit
      }));
    }

    // 3. Montar notas estruturadas com os 6 blocos
    const budgetNotesHeader = `=== ORÇAMENTO ANALISADO (${data.header.documentTitle}) ===\n` +
      `• Nº Orçamento: ${data.header.budgetNumber || 'S/N'} | Emissão: ${data.header.issueDateTime}\n` +
      `• Fornecedor: ${data.supplier.name} ${data.supplier.cnpj ? `(CNPJ: ${data.supplier.cnpj})` : ''}\n` +
      `• Vendedor/Atendente: ${data.supplier.salesRepresentative || 'N/A'} | Contato: ${data.supplier.phone || data.supplier.email || 'N/A'}\n` +
      `• Condição de Pagamento: ${data.totals.paymentTerms}\n` +
      `• Frete: ${data.totals.freightType || 'CIF'} (R$ ${data.totals.freightValue.toFixed(2)})\n` +
      `• Validade da Proposta: ${data.commercial.validity}\n` +
      `• Prazo de Entrega: ${data.commercial.deliveryTime || 'Pronta Entrega'}\n` +
      (data.commercial.unavailableItemsSummary && data.commercial.unavailableItemsSummary.length > 0 
        ? `\n⚠️ ITENS INDISPONÍVEIS ("NÃO TEMOS"):\n${data.commercial.unavailableItemsSummary.map(u => `  - ${u}`).join('\n')}\n` 
        : '') +
      (data.items.length > 1 
        ? `\n📦 ITENS COTADOS NO TOTAL (${data.items.length} itens):\n${data.items.map(it => `  - [${it.code || 'S/C'}] ${it.description} (Qtd: ${it.quantity} ${it.unit}) -> Unit: R$ ${it.unitPrice.toFixed(2)} | Total: R$ ${it.totalPrice.toFixed(2)}${!it.isAvailable ? ' [NÃO TEMOS]' : ''}`).join('\n')}\n` 
        : '') +
      (data.commercial.generalNotes ? `\nObservações: ${data.commercial.generalNotes}\n` : '');

    // 4. Preencher formulário
    setFormData(prev => ({
      ...prev,
      title: prev.title || `${data.header.documentTitle || 'Orçamento'} - ${data.supplier.name}${data.header.budgetNumber ? ` #${data.header.budgetNumber}` : ''}`,
      description: prev.description || `Orçamento ${data.header.budgetNumber ? `Nº ${data.header.budgetNumber}` : ''} emitido por ${data.supplier.name} em ${data.header.issueDateTime}. Total cotado: R$ ${data.totals.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      supplierId: matchedSupplierId || prev.supplierId,
      totalValue: data.totals.totalAmount > 0 ? String(data.totals.totalAmount) : prev.totalValue,
      terms: data.totals.paymentTerms || prev.terms,
      paymentMethod: data.totals.paymentTerms || prev.paymentMethod,
      deliveryMethod: data.commercial.deliveryTime || prev.deliveryMethod,
      notes: budgetNotesHeader + (prev.notes ? `\n--- Notas Anteriores ---\n${prev.notes}` : '')
    }));

    // 5. Se o arquivo foi enviado, anexar à lista de propostas
    if (data.fileBase64) {
      const newAtt: QuotationSupplierAttachment = {
        id: `budget-${Date.now()}`,
        name: data.fileName,
        size: 'Orçamento Analisado',
        type: data.fileType === 'pdf' ? 'pdf' : (data.fileType === 'excel' ? 'excel' : 'pdf'),
        url: data.fileBase64,
        uploadedAt: new Date().toISOString()
      };
      setSupplierAttachments(prev => [newAtt, ...prev.filter(a => a.name !== data.fileName)]);
    }

    // 6. Atualizar critérios de desempate
    let deliveryDays = 1;
    if (/imediato|pronta/i.test(data.commercial.deliveryTime || '')) deliveryDays = 0;
    else if (/2\s*a\s*3/i.test(data.commercial.deliveryTime || '')) deliveryDays = 2;
    else if (/5/i.test(data.commercial.deliveryTime || '')) deliveryDays = 5;

    setComparisonCriteria(prev => ({
      ...prev,
      deliveryDays,
      freightType: data.totals.freightValue === 0 ? 'CIF_INCLUSO' : 'FOB_CLIENTE'
    }));

    toast({
      title: 'Orçamento Aplicado com Sucesso! 🎯',
      description: `Foram preenchidos os dados de ${data.supplier.name} e ${data.items.length} itens do orçamento.`,
    });
  };

  useEffect(() => {
    if (initialParsedBudget) {
      handleApplyParsedBudget(initialParsedBudget);
    }
  }, [initialParsedBudget]);

  useEffect(() => {
    loadSuppliers();
    loadPurchaseRequests();
    loadMaterialRequisitions();
    loadStockItems();
    loadUsers();
  }, []);

  const loadStockItems = async () => {
    try {
      setLoadingStock(true);
      const data = await stockService.getAllItems();
      setStockItems(data || []);
    } catch (error) {
      console.error('Erro ao carregar itens de estoque:', error);
      setStockItems([]);
    } finally {
      setLoadingStock(false);
    }
  };

  const loadMaterialRequisitions = async () => {
    try {
      const data = await materialRequisitionService.listRequisitions();
      setMaterialRequisitions(data || []);
    } catch (error) {
      console.error('Erro ao carregar requisições de materiais:', error);
      setMaterialRequisitions([]);
    }
  };

  // Carregar cotação existente (se edição)
  useEffect(() => {
    if (quotation) {
      const purchaseRequestIdValue = quotation.purchaseRequestId ? String(quotation.purchaseRequestId).trim() : '';
      const assignedToIdValue = quotation.assignedToId ? String(quotation.assignedToId).trim() : '';

      // Tentar restaurar fotos, anexos e detalhes da peça dos notes (JSON)
      let restoredPhotos: QuotationPhotoItem[] = [];
      let restoredAttachments: QuotationSupplierAttachment[] = [];
      let restoredPart: Partial<PartDetailsState> = {};
      let restoredCriteria: Partial<ComparisonCriteriaState> = {};
      let cleanNotes = quotation.notes || '';

      if (quotation.notes && quotation.notes.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(quotation.notes);
          if (parsed.photos && Array.isArray(parsed.photos)) {
            restoredPhotos = parsed.photos;
          }
          if (parsed.supplierAttachments && Array.isArray(parsed.supplierAttachments)) {
            restoredAttachments = parsed.supplierAttachments;
          }
          if (parsed.partDetails) {
            restoredPart = parsed.partDetails;
          }
          if (parsed.comparisonCriteria) {
            restoredCriteria = parsed.comparisonCriteria;
          }
          cleanNotes = parsed.rawNotes || '';
        } catch (e) {
          console.warn('Notes não é um JSON de metadados:', e);
        }
      }

      setPhotos(restoredPhotos);
      setSupplierAttachments(restoredAttachments);
      setComparisonCriteria({
        deliveryDays: restoredCriteria.deliveryDays ?? 1,
        warrantyMonths: restoredCriteria.warrantyMonths ?? 6,
        freightType: restoredCriteria.freightType || 'CIF_INCLUSO',
        partQuality: restoredCriteria.partQuality || 'PRIMEIRA_LINHA'
      });

      setPartDetails({
        itemName: restoredPart.itemName || quotation.title || '',
        itemCode: restoredPart.itemCode || '',
        brand: restoredPart.brand || '',
        quantity: restoredPart.quantity || 1,
        unit: restoredPart.unit || 'UN',
        vehiclePlate: restoredPart.vehiclePlate || '',
        vehicleModel: restoredPart.vehicleModel || '',
        workOrderNumber: restoredPart.workOrderNumber || '',
        justification: restoredPart.justification || ''
      });

      setFormData({
        title: quotation.title || '',
        description: quotation.description || '',
        supplierId: quotation.supplierId ? String(quotation.supplierId) : '',
        purchaseRequestId: purchaseRequestIdValue,
        unitId: quotation.unitId ? String(quotation.unitId) : '',
        totalValue: quotation.totalValue ? quotation.totalValue.toString() : '',
        validUntil: quotation.validUntil || format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        terms: quotation.terms || '30 DIAS',
        paymentMethod: quotation.paymentMethod || 'Boleto',
        deliveryMethod: quotation.deliveryMethod || 'Entrega no local',
        notes: cleanNotes,
        assignedToId: assignedToIdValue,
        status: quotation.status
      });
    } else {
      // Criação: valores padrão
      setFormData({
        title: '',
        description: '',
        supplierId: '',
        purchaseRequestId: initialPurchaseRequestId || '',
        unitId: '',
        totalValue: '',
        validUntil: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        terms: '30 DIAS',
        paymentMethod: 'Boleto',
        deliveryMethod: 'Entrega no local',
        notes: '',
        assignedToId: '',
        status: 'DRAFT'
      });
      setPhotos([]);
      setSupplierAttachments([]);
      setPartDetails({
        itemName: '',
        itemCode: '',
        brand: '',
        quantity: 1,
        unit: 'UN',
        vehiclePlate: '',
        vehicleModel: '',
        workOrderNumber: '',
        justification: ''
      });
      setComparisonCriteria({
        deliveryDays: 1,
        warrantyMonths: 6,
        freightType: 'CIF_INCLUSO',
        partQuality: 'PRIMEIRA_LINHA'
      });
    }
  }, [quotation, purchaseRequests.length, users.length]);


  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await contasAPagarService.getFornecedoresAtivos();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadPurchaseRequests = async () => {
    try {
      setLoadingPurchaseRequests(true);
      const data = await purchaseRequestService.getAllPurchaseRequests();
      setPurchaseRequests(data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações de compra:', error);
      setPurchaseRequests([]);
    } finally {
      setLoadingPurchaseRequests(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
    }
  };

  const handleSelectMaterialRequisition = (reqId: string) => {
    const req = materialRequisitions.find(r => r.id === reqId);
    if (!req) return;

    setPartDetails({
      itemName: req.itemName,
      itemCode: req.itemCode || '',
      brand: '',
      quantity: req.quantity || 1,
      unit: req.unit || 'UN',
      vehiclePlate: req.vehiclePlate || '',
      vehicleModel: req.vehicleModel || '',
      workOrderNumber: req.workOrderNumber || '',
      justification: req.justification || ''
    });

    const newTitle = `Cotação de Peças: ${req.itemName} - ${req.vehiclePlate || 'Veículo'}${req.workOrderNumber ? ` (OS #${req.workOrderNumber})` : ''}`;
    const newDesc = `Peça solicitada: ${req.itemName} (${req.quantity} ${req.unit || 'UN'})${req.itemCode ? ` - Cód/OEM: ${req.itemCode}` : ''}. Justificativa: ${req.justification || 'Reposição na manutenção periódica'}.`;

    setFormData(prev => ({
      ...prev,
      title: newTitle,
      description: newDesc
    }));
  };

  const handleSelectPurchaseRequest = (requestId: string) => {
    handleInputChange('purchaseRequestId', requestId);
    if (!requestId || requestId === 'none') {
      return;
    }
    const req = purchaseRequests.find(r => String(r.id) === String(requestId));
    if (!req) return;

    const firstItem = req.items && req.items.length > 0 ? req.items[0] : null;
    if (firstItem) {
      setPartDetails(prev => ({
        ...prev,
        itemName: firstItem.itemName || prev.itemName,
        itemCode: firstItem.itemCode || firstItem.productName || prev.itemCode,
        quantity: firstItem.quantity || prev.quantity || 1,
        unit: firstItem.unit || prev.unit || 'UN',
        justification: req.justification || prev.justification
      }));
    }

    const newTitle = `Cotação: ${req.title} (${req.requestNumber})`;
    const newDesc = req.description || `Cotação referente à Solicitação ${req.requestNumber} - Solicitante: ${req.requesterName || 'Geral'}. Motivo: ${req.justification || ''}`;

    setFormData(prev => ({
      ...prev,
      title: prev.title || newTitle,
      description: prev.description || newDesc,
      totalValue: prev.totalValue || (req.totalValue ? String(req.totalValue) : '')
    }));
  };

  const handleSelectStockItem = (item: StockItem) => {
    setSelectedStockItem(item);
    setPartDetails(prev => ({
      ...prev,
      itemName: item.name || item.fullName,
      itemCode: item.code || prev.itemCode,
      brand: item.supplier || prev.brand,
      unit: item.unitName || prev.unit || 'UN'
    }));

    if (!formData.title || formData.title.startsWith('Cotação')) {
      const itemTxt = item.name;
      const plateTxt = partDetails.vehiclePlate ? ` - ${partDetails.vehiclePlate}` : '';
      const osTxt = partDetails.workOrderNumber ? ` (OS #${partDetails.workOrderNumber})` : '';
      setFormData(f => ({ ...f, title: `Cotação: ${itemTxt}${plateTxt}${osTxt}` }));
    }

    setShowStockSuggestions(false);
    setIsStockSearchOpen(false);

    toast({
      title: "Peça do Estoque Selecionada",
      description: `"${item.name}" (Cód: ${item.code}) preenchido com sucesso nos campos da cotação.`,
    });
  };

  const inlineStockSuggestions = stockItems.filter(item => {
    if (!partDetails.itemName || partDetails.itemName.trim().length < 2) return false;
    const q = partDetails.itemName.toLowerCase().trim();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.code && item.code.toLowerCase().includes(q)) ||
      (item.fullName && item.fullName.toLowerCase().includes(q))
    );
  }).slice(0, 6);

  const modalStockFiltered = stockItems.filter(item => {
    if (!stockSearchQuery.trim()) return true;
    const q = stockSearchQuery.toLowerCase().trim();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.code && item.code.toLowerCase().includes(q)) ||
      (item.fullName && item.fullName.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.supplier && item.supplier.toLowerCase().includes(q))
    );
  });

  const handlePartDetailChange = (field: keyof PartDetailsState, value: any) => {
    setPartDetails(prev => {
      const updated = { ...prev, [field]: value };
      if (!formData.title || formData.title.startsWith('Cotação')) {
        const itemTxt = updated.itemName || 'Peça';
        const plateTxt = updated.vehiclePlate ? ` - ${updated.vehiclePlate}` : '';
        const osTxt = updated.workOrderNumber ? ` (OS #${updated.workOrderNumber})` : '';
        setFormData(f => ({ ...f, title: `Cotação: ${itemTxt}${plateTxt}${osTxt}` }));
      }
      return updated;
    });
  };

  // Upload de Fotos da Peça
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo Inválido",
          description: `O arquivo ${file.name} não é uma imagem válida.`,
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newPhoto: QuotationPhotoItem = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          url: base64,
          size: (file.size / 1024).toFixed(1) + ' KB'
        };
        setPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    toast({
      title: "Foto Anexada",
      description: "A imagem foi carregada e será incluída no PDF de cotação para o fornecedor."
    });
  };

  // Upload de Anexo da Proposta do Fornecedor (PDF / Excel / Imagem)
  const handleSupplierAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      let type = 'other';
      const nameLower = file.name.toLowerCase();
      if (file.type.includes('pdf') || nameLower.endsWith('.pdf')) {
        type = 'pdf';
      } else if (
        file.type.includes('sheet') || 
        file.type.includes('excel') || 
        nameLower.endsWith('.xlsx') || 
        nameLower.endsWith('.xls') || 
        nameLower.endsWith('.csv')
      ) {
        type = 'excel';
      } else if (file.type.startsWith('image/')) {
        type = 'image';
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newAttachment: QuotationSupplierAttachment = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type,
          url: base64,
          size: (file.size / 1024).toFixed(1) + ' KB',
          uploadedAt: new Date().toISOString()
        };
        setSupplierAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    toast({
      title: "Proposta do Fornecedor Anexada",
      description: "O documento foi anexado à cotação com sucesso."
    });
  };

  const handleRemoveSupplierAttachment = (id: string) => {
    setSupplierAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleComparisonCriteriaChange = (field: keyof ComparisonCriteriaState, value: any) => {
    setComparisonCriteria(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateRfpPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const supplier = suppliers.find(s => String(s.id) === formData.supplierId);
      const rfpData: QuotationRfpData = {
        quoteNumber: quotation?.quoteNumber || `COT-${new Date().getFullYear()}-NOVA`,
        title: formData.title || partDetails.itemName || 'Cotação de Peças e Serviços',
        description: formData.description,
        supplierName: supplier ? supplier.name : undefined,
        totalValue: parseFloat(formData.totalValue) || undefined,
        validUntil: formData.validUntil,
        createdAt: new Date().toISOString(),
        vehiclePlate: partDetails.vehiclePlate,
        vehicleModel: partDetails.vehicleModel,
        workOrderNumber: partDetails.workOrderNumber,
        requesterName: users.find(u => String(u.id) === formData.assignedToId)?.name || selectedPurchaseRequest?.requesterName,
        justification: partDetails.justification || selectedPurchaseRequest?.justification,
        items: [
          {
            itemName: partDetails.itemName || formData.title || 'Item para Cotação',
            itemCode: partDetails.itemCode,
            brand: partDetails.brand,
            quantity: partDetails.quantity || 1,
            unit: partDetails.unit || 'UN',
            specification: formData.description
          }
        ],
        photos: photos,
        supplierAttachments: supplierAttachments,
        deliveryDays: comparisonCriteria.deliveryDays,
        warrantyMonths: comparisonCriteria.warrantyMonths,
        freightType: comparisonCriteria.freightType,
        partQuality: comparisonCriteria.partQuality
      };

      const blob = await quotationRfpPdfGenerator.generatePDF(rfpData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solicitacao-cotacao-${rfpData.vehiclePlate || 'pecas'}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Gerado com Sucesso!",
        description: "Documento de solicitação de cotação com dados da peça e fotos gerado para envio ao fornecedor."
      });
    } catch (err) {
      console.error('Erro ao gerar PDF com fotos:', err);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF de cotação.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSaveSupplier = async (data: CreateSupplierRequest) => {
    try {
      await contasAPagarService.createFornecedor(data);
      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso!",
      });
      await loadSuppliers();
      setIsSupplierModalOpen(false);
    } catch (error: any) {
      let msg = 'Não foi possível salvar o fornecedor.';
      if (error?.response?.status === 409) {
        msg = error?.response?.data?.message || 'Já existe um fornecedor cadastrado com este CNPJ.';
      } else if (error?.response?.data?.message) {
        msg = error.response.data.message;
      }
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    const actualValue = value === 'none' ? '' : value;
    setFormData(prev => ({ ...prev, [field]: actualValue }));
  };

  const handleViewPurchaseRequest = (requestId: string) => {
    const request = purchaseRequests.find(req => req.id === requestId);
    if (request) {
      setViewingPurchaseRequest(request);
      setIsViewPurchaseRequestModalOpen(true);
    }
  };

  const selectedPurchaseRequest = purchaseRequests.find(req => req.id === formData.purchaseRequestId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const titleVal = formData.title.trim() || partDetails.itemName.trim() || 'Nova Cotação de Peças';
    const totalVal = parseFloat(formData.totalValue) || 0;

    if (!titleVal) {
      toast({
        title: "Título Necessário",
        description: "Por favor, informe o título da cotação ou o nome da peça.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Salvar metadados de fotos, proposta do fornecedor e dados técnicos da peça em JSON no campo notes
      const notesPayloadObj = {
        rawNotes: formData.notes.trim(),
        partDetails,
        photos,
        supplierAttachments,
        comparisonCriteria
      };

      const payload = {
        title: titleVal,
        description: formData.description.trim() || undefined,
        supplierId: formData.supplierId || undefined,
        purchaseRequestId: formData.purchaseRequestId || undefined,
        unitId: formData.unitId || undefined,
        totalValue: totalVal,
        validUntil: formData.validUntil || format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        terms: formData.terms.trim() || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        deliveryMethod: formData.deliveryMethod || undefined,
        notes: JSON.stringify(notesPayloadObj),
        assignedToId: formData.assignedToId || undefined
      };

      if (isEditing && quotation) {
        const updatePayload: UpdateQuotationRequest = {
          ...payload,
          status: formData.status
        };
        await quotationService.update(quotation.id, updatePayload);
        toast({
          title: "Cotação Atualizada",
          description: "Cotação atualizada com fotos, propostas e parâmetros de comparativo!",
        });
      } else {
        await quotationService.create(payload as CreateQuotationRequest);
        toast({
          title: "Cotação Salva",
          description: "Cotação criada com sucesso! Fotos e detalhes da peça armazenados.",
        });
        onCreated?.();
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar cotação:', error);
      toast({
        title: "Erro ao salvar cotação",
        description: "Falha ao gravar cotação. Verifique os dados preenchidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: QuotationStatus) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || colors.DRAFT;
  };

  const getStatusLabel = (status: QuotationStatus) => {
    const labels = {
      DRAFT: 'Rascunho / Em Cotação',
      SENT: 'Enviada ao Fornecedor',
      APPROVED: 'Aprovada (Melhor Cotação)',
      REJECTED: 'Rejeitada / Descartada',
      EXPIRED: 'Expirada'
    };
    return labels[status] || 'Rascunho';
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-seguranca-graphite border-gray-600 text-seguranca-lightgray shadow-2xl p-0">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red via-red-600 to-zinc-900 p-6 rounded-t-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              {isEditing ? 'Editar Cotação' : 'Nova Cotação de Compra'}
              {isEditing && quotation && (
                <Badge className={getStatusColor(quotation.status)}>
                  {getStatusLabel(quotation.status)}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              {isEditing 
                ? 'Atualize as propostas recebidas, fotos da peça e parâmetros para o comparativo automático.' 
                : 'Cadastre a cotação com dados da peça e fotos. O valor é opcional na criação e pode ser preenchido quando o fornecedor responder.'}
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBudgetUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold border-none shadow-md flex items-center gap-2"
              title="Upload e análise inteligente de orçamento de fornecedor (PDF, Excel, Rocha Peças, BHM Diesel, etc.)"
            >
              <Sparkles className="h-4 w-4" />
              Analisar Orçamento Fornecedor
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateRfpPdf}
              disabled={isGeneratingPdf}
              className="bg-seguranca-yellow hover:bg-yellow-500 text-zinc-950 font-bold border-none shadow-md flex items-center gap-2"
              title="Gera documento PDF formatado com fotos da peça para enviar a fornecedores"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF com Fotos'}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* SEÇÃO 1: VINCULAR SOLICITAÇÃO / ORDEM DE SERVIÇO */}
          <Card className="bg-gradient-to-r from-zinc-900 to-seguranca-graphite border-gray-700 shadow-md">
            <CardHeader className="pb-3 border-b border-gray-700/60">
              <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-seguranca-red" />
                </div>
                1. Origem da Demanda (Requisição / Solicitação de Compra)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseRequestId" className="text-sm text-gray-300 font-medium flex items-center justify-between">
                  <span>Vincular Solicitação de Compra Existente</span>
                  <span className="text-xs text-seguranca-yellow font-normal">Opcional — Preenche dados automaticamente</span>
                </Label>
                <Select
                  value={formData.purchaseRequestId || 'none'}
                  onValueChange={(value) => handleSelectPurchaseRequest(value)}
                >
                  <SelectTrigger className="bg-zinc-900/90 border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder={loadingPurchaseRequests ? "Carregando solicitações..." : "Selecione uma solicitação da lista (ou preencha manualmente abaixo)"} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-gray-700 max-h-[240px] text-seguranca-lightgray">
                    <SelectItem value="none" className="text-gray-400 hover:bg-zinc-800">
                      Nenhuma (Preenchimento Avulso)
                    </SelectItem>
                    {purchaseRequests.map((request) => (
                      <SelectItem key={request.id} value={String(request.id)} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        <div className="flex items-center gap-2 py-0.5">
                          <Badge variant="outline" className="text-[10px] bg-zinc-800 border-gray-600 font-mono">
                            {request.requestNumber || `#${request.id}`}
                          </Badge>
                          <span className="font-medium text-white truncate max-w-[340px]">{request.title}</span>
                          {request.requesterName && (
                            <span className="text-xs text-gray-400">({request.requesterName})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPurchaseRequest && (
                  <div className="p-3.5 bg-zinc-900/80 border border-gray-700/80 rounded-lg space-y-2.5 mt-2">
                    <div className="flex items-center justify-between border-b border-gray-700/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-seguranca-yellow text-zinc-950 font-mono font-bold text-xs">
                          {selectedPurchaseRequest.requestNumber}
                        </Badge>
                        <span className="text-sm font-semibold text-white">
                          {selectedPurchaseRequest.title}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPurchaseRequest(selectedPurchaseRequest.id)}
                        className="h-7 text-xs text-seguranca-yellow hover:bg-seguranca-yellow/10"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Ver Solicitação
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block">👤 Solicitante:</span>
                        <span className="text-seguranca-lightgray font-medium">
                          {selectedPurchaseRequest.requesterName || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">🏢 Departamento/Unidade:</span>
                        <span className="text-seguranca-lightgray">
                          {selectedPurchaseRequest.department || selectedPurchaseRequest.unitName || 'Geral'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">📅 Data da Solicitação:</span>
                        <span className="text-seguranca-lightgray">
                          {selectedPurchaseRequest.createdAt ? format(new Date(selectedPurchaseRequest.createdAt), 'dd/MM/yyyy') : '-'}
                        </span>
                      </div>
                    </div>

                    {selectedPurchaseRequest.justification && (
                      <div className="text-xs bg-black/40 p-2 rounded border border-gray-800">
                        <span className="text-seguranca-yellow font-semibold">📝 Justificativa da Compra: </span>
                        <span className="text-gray-300 italic">"{selectedPurchaseRequest.justification}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 2: DADOS TÉCNICOS DA PEÇA / ITEM A COTAR */}
          <Card className="bg-gradient-to-r from-zinc-900 to-seguranca-graphite border-gray-700 shadow-md">
            <CardHeader className="pb-3 border-b border-gray-700/60 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Wrench className="h-4 w-4 text-seguranca-red" />
                </div>
                2. Especificações Técnicas da Peça / Item a Cotar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStockSearchQuery('');
                    setIsStockSearchOpen(true);
                  }}
                  className="bg-seguranca-yellow/10 hover:bg-seguranca-yellow hover:text-zinc-950 border-seguranca-yellow/50 text-seguranca-yellow text-xs font-semibold h-7 flex items-center gap-1.5 transition-all"
                >
                  <Search className="h-3.5 w-3.5" />
                  Buscar Peça no Estoque
                </Button>
                <Badge variant="outline" className="border-seguranca-yellow/40 text-seguranca-yellow text-xs hidden sm:inline-flex">
                  Precisão para Fornecedores
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Nome do Item / Peça com Busca Integrada no Estoque */}
                <div className="md:col-span-6 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="partName" className="text-sm font-medium text-gray-200">
                      Nome da Peça / Descrição do Item <span className="text-seguranca-red">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setStockSearchQuery('');
                        setIsStockSearchOpen(true);
                      }}
                      className="text-xs text-seguranca-yellow hover:underline flex items-center gap-1"
                    >
                      <Boxes className="h-3 w-3" />
                      Catálogo do Estoque
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Input
                      id="partName"
                      value={partDetails.itemName}
                      onChange={(e) => {
                        handlePartDetailChange('itemName', e.target.value);
                        setShowStockSuggestions(true);
                      }}
                      onFocus={() => {
                        if (partDetails.itemName && partDetails.itemName.trim().length >= 2) {
                          setShowStockSuggestions(true);
                        }
                      }}
                      placeholder="Ex: Par de Amortecedores Dianteiros Turbogás (ou digite para buscar no estoque)"
                      className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11 pr-8"
                    />
                    {partDetails.itemName && (
                      <button
                        type="button"
                        onClick={() => {
                          handlePartDetailChange('itemName', '');
                          setSelectedStockItem(null);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-1"
                        title="Limpar nome"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sugestões instantâneas do Estoque durante a digitação */}
                  {showStockSuggestions && inlineStockSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-zinc-950 border border-seguranca-yellow/50 rounded-lg shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-800">
                      <div className="px-3 py-1.5 bg-zinc-900 text-[11px] font-semibold text-seguranca-yellow flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Boxes className="h-3.5 w-3.5" />
                          Peças encontradas no Estoque ({inlineStockSuggestions.length}):
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowStockSuggestions(false)}
                          className="text-gray-400 hover:text-white text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                      {inlineStockSuggestions.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectStockItem(item)}
                          className="p-2.5 hover:bg-seguranca-red/20 cursor-pointer flex items-center justify-between text-xs transition-colors group"
                        >
                          <div className="overflow-hidden pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white group-hover:text-seguranca-yellow truncate">
                                {item.name}
                              </span>
                              <Badge variant="outline" className="text-[10px] text-seguranca-yellow font-mono border-gray-700 bg-black/40 flex-shrink-0">
                                {item.code}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                              Categoria: {item.category || 'Geral'} {item.supplier ? `• Marca/Fornecedor: ${item.supplier}` : ''}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-emerald-400 font-bold block">
                              {item.currentQuantity ?? 0} {item.unitName || 'UN'}
                            </span>
                            <span className="text-[10px] text-gray-400">em estoque</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Badge de Peça Vinculada ao Estoque */}
                  {selectedStockItem && (
                    <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-2 text-xs text-emerald-300 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 truncate">
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">
                          Item do estoque: <strong>{selectedStockItem.name}</strong> (Cód: <span className="font-mono">{selectedStockItem.code}</span>)
                        </span>
                      </div>
                      <Badge className="bg-emerald-900/80 text-emerald-200 border border-emerald-600 text-[10px] ml-2 flex-shrink-0">
                        {selectedStockItem.currentQuantity ?? 0} {selectedStockItem.unitName || 'UN'} físico
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Código OEM / Part Number */}
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="partCode" className="text-sm font-medium text-gray-200">
                    Código OEM / Part Number
                  </Label>
                  <Input
                    id="partCode"
                    value={partDetails.itemCode}
                    onChange={(e) => handlePartDetailChange('itemCode', e.target.value)}
                    placeholder="Ex: OEM-GP30143"
                    className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11 font-mono uppercase"
                  />
                </div>

                {/* Marca / Fabricante Recomendado */}
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="partBrand" className="text-sm font-medium text-gray-200">
                    Marca / Linha Preferencial
                  </Label>
                  <Input
                    id="partBrand"
                    value={partDetails.brand}
                    onChange={(e) => handlePartDetailChange('brand', e.target.value)}
                    placeholder="Ex: Cofap / Monroe / Original"
                    className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11"
                  />
                </div>

                {/* Quantidade */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="partQty" className="text-sm font-medium text-gray-200">
                    Quantidade <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="partQty"
                    type="number"
                    min="1"
                    step="1"
                    value={partDetails.quantity || 1}
                    onChange={(e) => handlePartDetailChange('quantity', parseFloat(e.target.value) || 1)}
                    className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11 text-center font-bold"
                  />
                </div>

                {/* Unidade */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="partUnit" className="text-sm font-medium text-gray-200">
                    Unidade
                  </Label>
                  <Select
                    value={partDetails.unit || 'UN'}
                    onValueChange={(val) => handlePartDetailChange('unit', val)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="UN" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-gray-700 text-white">
                      <SelectItem value="UN">UN (Unidade)</SelectItem>
                      <SelectItem value="PC">PC (Peça)</SelectItem>
                      <SelectItem value="PAR">PAR (Par)</SelectItem>
                      <SelectItem value="JG">JG (Jogo)</SelectItem>
                      <SelectItem value="KIT">KIT (Kit)</SelectItem>
                      <SelectItem value="LT">LT (Litros)</SelectItem>
                      <SelectItem value="KG">KG (Quilogramas)</SelectItem>
                      <SelectItem value="MT">MT (Metros)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Placa do Veículo */}
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="vehiclePlate" className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-seguranca-yellow" />
                    Placa do Veículo
                  </Label>
                  <Input
                    id="vehiclePlate"
                    value={partDetails.vehiclePlate}
                    onChange={(e) => handlePartDetailChange('vehiclePlate', e.target.value.toUpperCase())}
                    placeholder="Ex: ABC-1234 / BRA2E19"
                    className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11 font-mono uppercase"
                  />
                </div>

                {/* Modelo / Ano do Veículo */}
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="vehicleModel" className="text-sm font-medium text-gray-200">
                    Modelo / Motorização / Ano
                  </Label>
                  <Input
                    id="vehicleModel"
                    value={partDetails.vehicleModel}
                    onChange={(e) => handlePartDetailChange('vehicleModel', e.target.value)}
                    placeholder="Ex: VW Gol 1.6 MSI 2021"
                    className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11"
                  />
                </div>

                {/* Ordem de Serviço */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="workOrderNumber" className="text-sm font-medium text-gray-200">
                    Nº da OS (Manutenção)
                  </Label>
                  <Input
                    id="workOrderNumber"
                    value={partDetails.workOrderNumber}
                    onChange={(e) => handlePartDetailChange('workOrderNumber', e.target.value)}
                    placeholder="Ex: OS-1045"
                    className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11 font-mono"
                  />
                </div>
              </div>

              {/* Justificativa / Motivo da Troca */}
              <div className="space-y-2 pt-1">
                <Label htmlFor="partJustification" className="text-sm font-medium text-gray-200">
                  Motivo da Troca / Sintomas / Observações Técnicas para o Fornecedor
                </Label>
                <Textarea
                  id="partJustification"
                  value={partDetails.justification}
                  onChange={(e) => handlePartDetailChange('justification', e.target.value)}
                  placeholder="Ex: Peça com vazamento de óleo e estalos durante o curso da suspensão detectado na revisão preventiva."
                  rows={2}
                  className="bg-zinc-900 border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow"
                />
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 3: FOTOS DA PEÇA A SER TROCADA (ANEXOS VISUAIS PARA A COTAÇÃO) */}
          <Card className="bg-gradient-to-r from-zinc-900 to-seguranca-graphite border-gray-700 shadow-md">
            <CardHeader className="pb-3 border-b border-gray-700/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Camera className="h-4 w-4 text-seguranca-red" />
                  </div>
                  3. Fotos da Peça a Ser Trocada (Anexos para o Pedido de Cotação)
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1">
                  Adicione fotos reais da peça atual ou etiqueta de código para garantir 100% de precisão na cotação.
                </p>
              </div>
              <Badge className="bg-seguranca-red text-white text-xs">
                {photos.length} {photos.length === 1 ? 'Foto' : 'Fotos'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="border-2 border-dashed border-gray-600 hover:border-seguranca-yellow/70 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all rounded-xl p-5 text-center">
                <input
                  type="file"
                  id="quotationPhotoInput"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="quotationPhotoInput"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <div className="p-2.5 bg-seguranca-red/20 text-seguranca-red rounded-full">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-seguranca-yellow hover:underline">
                      Clique aqui para anexar fotos da peça
                    </span>
                    <span className="text-sm text-gray-400"> (JPG, PNG, WEBP)</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    As fotos serão impressas em alta resolução no documento PDF para envio ao fornecedor.
                  </p>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative bg-zinc-950 border border-gray-700 rounded-lg overflow-hidden shadow-md flex flex-col"
                    >
                      <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewPhoto(photo)}
                            className="h-8 w-8 p-0 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full"
                            title="Ampliar Foto"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="h-8 w-8 p-0 bg-red-600/80 hover:bg-red-700 text-white rounded-full"
                            title="Remover Foto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5">
                          Foto #{index + 1}
                        </Badge>
                      </div>
                      <div className="p-2 text-[11px] bg-zinc-900 border-t border-gray-800 flex items-center justify-between">
                        <span className="truncate text-gray-300 max-w-[120px]" title={photo.name}>
                          {photo.name}
                        </span>
                        {photo.size && (
                          <span className="text-gray-500 font-mono text-[10px]">{photo.size}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEÇÃO 4: ANEXOS DA PROPOSTA DO FORNECEDOR (PDF / EXCEL) */}
          <Card className="bg-gradient-to-r from-zinc-900 to-seguranca-graphite border-gray-700 shadow-md">
            <CardHeader className="pb-3 border-b border-gray-700/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-yellow/20 rounded-lg">
                    <Paperclip className="h-4 w-4 text-seguranca-yellow" />
                  </div>
                  4. Anexo da Proposta Recebida do Fornecedor (PDF ou Planilha Excel)
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1">
                  Anexe o orçamento original, tabela ou proposta oficial enviada pelo fornecedor (PDF, Excel .xlsx, .csv).
                </p>
              </div>
              <Badge variant="outline" className="border-seguranca-yellow/40 text-seguranca-yellow text-xs">
                {supplierAttachments.length} {supplierAttachments.length === 1 ? 'Arquivo Anexado' : 'Arquivos Anexados'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Card de Destaque: Analisador Automático de Orçamentos (6 Blocos) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/70 via-blue-900/40 to-zinc-900 border border-blue-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
                    <Sparkles className="h-6 w-6 animate-pulse text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Analisador Inteligente de Orçamentos (6 Blocos)
                      <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px] font-semibold">
                        PDF • Excel • Texto
                      </Badge>
                    </h4>
                    <p className="text-xs text-blue-200/80 mt-0.5">
                      Extrai dados de Cabeçalho, Fornecedor, Cliente, Peças, Faltas ("NÃO TEMOS"), Totais e Condições de Pagamento (ex: Rocha Peças, BHM Diesel).
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsBudgetUploadModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 px-4 gap-1.5 shrink-0 shadow-md"
                >
                  <Sparkles className="h-4 w-4" /> Analisar Orçamento Agora
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-600 hover:border-seguranca-yellow/70 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all rounded-xl p-5 text-center">
                <input
                  type="file"
                  id="supplierAttachmentInput"
                  multiple
                  accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,image/*"
                  onChange={handleSupplierAttachmentUpload}
                  className="hidden"
                />
                <label
                  htmlFor="supplierAttachmentInput"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <div className="p-2.5 bg-seguranca-yellow/20 text-seguranca-yellow rounded-full">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-seguranca-yellow hover:underline">
                      Clique aqui para anexar a proposta do fornecedor
                    </span>
                    <span className="text-sm text-gray-400"> (PDF, Excel, Imagem)</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    O arquivo ficará guardado junto ao histórico desta cotação para auditoria e conferência do Compras.
                  </p>
                </label>
              </div>

              {supplierAttachments.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {supplierAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-zinc-950 border border-gray-700 rounded-lg flex items-center justify-between gap-2 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="p-2 bg-zinc-900 rounded border border-gray-800 flex-shrink-0">
                            {att.type === 'pdf' ? (
                              <FileText className="h-5 w-5 text-red-400" />
                            ) : att.type === 'excel' ? (
                              <FileSpreadsheet className="h-5 w-5 text-green-400" />
                            ) : (
                              <File className="h-5 w-5 text-seguranca-yellow" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-xs font-medium text-white truncate block max-w-[170px]" title={att.name}>
                              {att.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {att.size} • {att.type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a
                            href={att.url}
                            download={att.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-seguranca-yellow rounded"
                            title="Baixar / Visualizar Proposta"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveSupplierAttachment(att.id)}
                            className="p-1.5 bg-zinc-900 hover:bg-red-950/60 text-red-400 rounded"
                            title="Remover Anexo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEÇÃO 5: DADOS COMERCIAIS & PARÂMETROS PARA O COMPARATIVO INTELIGENTE */}
          <Card className="bg-gradient-to-r from-zinc-900 to-seguranca-graphite border-gray-700 shadow-md">
            <CardHeader className="pb-3 border-b border-gray-700/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Award className="h-4 w-4 text-seguranca-red" />
                  </div>
                  5. Informações Comerciais & Parâmetros do Compras (Para Comparativo das 3 Cotações)
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1">
                  Lance os dados retornados pelo fornecedor para que o sistema analise e indique a cotação vencedora.
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Título da Cotação */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-200">
                    Título Geral da Cotação <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Cotação: Amortecedores Dianteiros - BRA2E19"
                    className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11"
                  />
                </div>

                {/* Fornecedor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="supplier" className="text-sm font-medium text-gray-200">
                      Fornecedor Cotado
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSupplierModalOpen(true)}
                      className="h-7 text-xs text-seguranca-yellow hover:text-seguranca-yellow hover:bg-seguranca-yellow/10"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Novo Fornecedor
                    </Button>
                  </div>
                  <Select
                    value={formData.supplierId || 'none'}
                    onValueChange={(value) => handleInputChange('supplierId', value)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder={loadingSuppliers ? "Carregando..." : "Selecione o fornecedor (ou deixe em branco para enviar a vários)"} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-gray-700 max-h-[220px] text-white">
                      <SelectItem value="none" className="text-gray-400">Em Branco (RFP para múltiplos fornecedores)</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={String(supplier.id)} className="text-white hover:bg-seguranca-red/20">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-seguranca-yellow" />
                            {supplier.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor Total (NÃO OBRIGATÓRIO NA ABERTURA) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="totalValue" className="text-sm font-medium text-gray-200">
                      Valor Total Proposto pelo Fornecedor (R$)
                    </Label>
                    <span className="text-[11px] text-seguranca-yellow font-normal">Opcional na emissão</span>
                  </div>
                  <Input
                    id="totalValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalValue}
                    onChange={(e) => handleInputChange('totalValue', e.target.value)}
                    placeholder="0,00 (Preencha quando o fornecedor responder com o preço)"
                    className="bg-zinc-900 border-gray-600 text-seguranca-yellow font-bold text-base focus:border-seguranca-yellow h-11"
                  />
                </div>

                {/* Validade */}
                <div className="space-y-2">
                  <Label htmlFor="validUntil" className="text-sm font-medium text-gray-200">
                    Prazo Limite / Validade da Proposta
                  </Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formatDateForInput(formData.validUntil)}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11"
                  />
                </div>
              </div>

              {/* Sub-bloco: Critérios de Desempate e Comparativo do Sistema */}
              <div className="p-4 bg-zinc-950/80 rounded-xl border border-gray-700/80 space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                  <Sparkles className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-xs font-semibold text-seguranca-yellow uppercase tracking-wider">
                    Variáveis do Sistema para Análise Automática da Melhor Cotação
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Prazo de Entrega */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-seguranca-yellow" />
                      Prazo de Entrega
                    </Label>
                    <Select
                      value={String(comparisonCriteria.deliveryDays)}
                      onValueChange={(val) => handleComparisonCriteriaChange('deliveryDays', parseInt(val) || 1)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-gray-700 text-xs text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-gray-700 text-white text-xs">
                        <SelectItem value="0">Pronta Entrega (Imediato)</SelectItem>
                        <SelectItem value="1">1 dia útil</SelectItem>
                        <SelectItem value="2">2 a 3 dias úteis</SelectItem>
                        <SelectItem value="5">5 dias úteis</SelectItem>
                        <SelectItem value="10">10 dias úteis</SelectItem>
                        <SelectItem value="15">15 dias úteis ou mais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Garantia */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-seguranca-yellow" />
                      Garantia da Peça
                    </Label>
                    <Select
                      value={String(comparisonCriteria.warrantyMonths)}
                      onValueChange={(val) => handleComparisonCriteriaChange('warrantyMonths', parseInt(val) || 6)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-gray-700 text-xs text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-gray-700 text-white text-xs">
                        <SelectItem value="3">3 Meses (Legal)</SelectItem>
                        <SelectItem value="6">6 Meses</SelectItem>
                        <SelectItem value="12">12 Meses (1 Ano)</SelectItem>
                        <SelectItem value="24">24 Meses (2 Anos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Frete */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                      <Truck className="h-3 w-3 text-seguranca-yellow" />
                      Tipo de Frete
                    </Label>
                    <Select
                      value={comparisonCriteria.freightType}
                      onValueChange={(val) => handleComparisonCriteriaChange('freightType', val)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-gray-700 text-xs text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-gray-700 text-white text-xs">
                        <SelectItem value="CIF_INCLUSO">CIF (Frete Incluso)</SelectItem>
                        <SelectItem value="FOB_CLIENTE">FOB (Frete por Conta)</SelectItem>
                        <SelectItem value="RETIRADA">Retirada no Balcão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Qualidade da Peça */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-seguranca-yellow" />
                      Qualidade / Linha
                    </Label>
                    <Select
                      value={comparisonCriteria.partQuality}
                      onValueChange={(val) => handleComparisonCriteriaChange('partQuality', val)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-gray-700 text-xs text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-gray-700 text-white text-xs">
                        <SelectItem value="ORIGINAL_OEM">Original / Genuína</SelectItem>
                        <SelectItem value="PRIMEIRA_LINHA">1ª Linha (Homologada)</SelectItem>
                        <SelectItem value="PARALELA">Paralela / Similar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Forma de Pagamento e Entrega */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-seguranca-yellow" />
                    Condições / Forma de Pagamento
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-gray-700 text-white">
                      <SelectItem value="Faturamento 30 Dias" className="hover:bg-seguranca-red/20">Faturamento 30 Dias</SelectItem>
                      <SelectItem value="Faturamento 15/30 Dias" className="hover:bg-seguranca-red/20">Faturamento 15/30 Dias</SelectItem>
                      <SelectItem value="Faturamento 28/56 Dias" className="hover:bg-seguranca-red/20">Faturamento 28/56 Dias</SelectItem>
                      <SelectItem value="PIX à Vista" className="hover:bg-seguranca-red/20">PIX à Vista</SelectItem>
                      <SelectItem value="Boleto Bancário" className="hover:bg-seguranca-red/20">Boleto Bancário</SelectItem>
                      <SelectItem value="Cartão Corporativo" className="hover:bg-seguranca-red/20">Cartão Corporativo</SelectItem>
                      <SelectItem value="Transferência Bancária" className="hover:bg-seguranca-red/20">Transferência Bancária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryMethod" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-seguranca-yellow" />
                    Forma de Entrega
                  </Label>
                  <Select
                    value={formData.deliveryMethod}
                    onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a forma de entrega" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-gray-700 text-white">
                      <SelectItem value="Entrega no Local (CIF Incluso)" className="hover:bg-seguranca-red/20">Entrega no Local (CIF Incluso)</SelectItem>
                      <SelectItem value="Retirada no Balcão do Fornecedor" className="hover:bg-seguranca-red/20">Retirada no Balcão do Fornecedor</SelectItem>
                      <SelectItem value="Transportadora / Correios" className="hover:bg-seguranca-red/20">Transportadora / Correios</SelectItem>
                      <SelectItem value="Motoboy Express" className="hover:bg-seguranca-red/20">Motoboy Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Responsável e Status (se editando) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="assignedToId" className="text-sm font-medium text-gray-200">
                    Comprador / Responsável
                  </Label>
                  <Select
                    value={formData.assignedToId}
                    onValueChange={(value) => handleInputChange('assignedToId', value)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o comprador responsável" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-gray-700 max-h-[200px] text-white">
                      {users.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)} className="text-white hover:bg-seguranca-red/20">
                          {user.name} ({user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-200">
                      Status da Cotação
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value as QuotationStatus)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-gray-600 text-white focus:border-seguranca-yellow h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-gray-700 text-white">
                        <SelectItem value="DRAFT" className="text-white hover:bg-seguranca-red/20">Rascunho / Em Cotação</SelectItem>
                        <SelectItem value="SENT" className="text-white hover:bg-seguranca-red/20">Enviada ao Fornecedor</SelectItem>
                        <SelectItem value="APPROVED" className="text-white hover:bg-seguranca-red/20">Aprovada (Melhor Cotação)</SelectItem>
                        <SelectItem value="REJECTED" className="text-white hover:bg-seguranca-red/20">Rejeitada / Descartada</SelectItem>
                        <SelectItem value="EXPIRED" className="text-white hover:bg-seguranca-red/20">Expirada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-200">
                  Observações Gerais / Instruções Comerciais
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Instruções adicionais de faturamento, prazo de garantia exigido ou entrega..."
                  rows={2}
                  className="bg-zinc-900 border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateRfpPdf}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-seguranca-yellow border-gray-600 font-semibold flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPdf ? 'Gerando Documento...' : '📄 Baixar PDF da Cotação com Fotos'}
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="bg-zinc-800 border-gray-600 text-gray-300 hover:bg-zinc-700 hover:text-white"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-seguranca-red hover:bg-red-700 text-white font-bold px-6 shadow-lg"
              >
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar Cotação' : 'Salvar Cotação')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Modal de Cadastro de Fornecedor */}
      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplier={null}
        onSave={handleSaveSupplier}
      />

      {/* Modal de Visualização de Solicitação de Compra */}
      <PurchaseRequestViewModal
        isOpen={isViewPurchaseRequestModalOpen}
        onClose={() => {
          setIsViewPurchaseRequestModalOpen(false);
          setViewingPurchaseRequest(undefined);
        }}
        request={viewingPurchaseRequest}
      />

      {/* Modal / Dialog de Zoom de Foto */}
      {previewPhoto && (
        <Dialog open={true} onOpenChange={() => setPreviewPhoto(null)}>
          <DialogContent className="max-w-4xl bg-zinc-950 border-gray-700 p-2 text-white">
            <DialogHeader className="p-3 border-b border-gray-800 flex flex-row items-center justify-between">
              <DialogTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-seguranca-yellow" />
                {previewPhoto.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4 bg-black/60 rounded max-h-[75vh] overflow-hidden">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
            <div className="flex justify-end p-2 border-t border-gray-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewPhoto(null)}
                className="bg-zinc-800 border-gray-600 text-white"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal / Dialog de Busca no Catálogo do Estoque */}
      {isStockSearchOpen && (
        <Dialog open={true} onOpenChange={() => setIsStockSearchOpen(false)}>
          <DialogContent className="max-w-4xl bg-zinc-950 border-gray-700 text-white p-0 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
            <DialogHeader className="p-4 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-gray-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-seguranca-yellow/20 text-seguranca-yellow rounded-lg">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    Catálogo de Peças & Estoque Físico
                    <Badge variant="outline" className="text-xs text-seguranca-yellow border-gray-700">
                      {stockItems.length} Peças Cadastradas
                    </Badge>
                  </DialogTitle>
                  <p className="text-xs text-gray-400">
                    Selecione um item do estoque para preencher automaticamente o nome oficial, código OEM e unidade na cotação.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsStockSearchOpen(false)}
                className="text-gray-400 hover:text-white h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>

            {/* Barra de Busca Rápida */}
            <div className="p-4 bg-zinc-900/80 border-b border-gray-800">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-seguranca-yellow" />
                <Input
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome da peça, código OEM, código interno, categoria ou marca..."
                  className="bg-zinc-950 border-gray-700 text-white focus:border-seguranca-yellow pl-10 h-11 text-sm"
                  autoFocus
                />
                {stockSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStockSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs px-2 py-1"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Itens do Estoque */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
              {loadingStock ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Carregando catálogo de peças do estoque...
                </div>
              ) : modalStockFiltered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <PackageSearch className="h-10 w-10 text-gray-600 mx-auto" />
                  <p className="text-sm font-medium">Nenhum item encontrado no estoque com o termo "{stockSearchQuery}".</p>
                  <p className="text-xs text-gray-500">Você ainda pode preencher os dados da peça manualmente no formulário de cotação.</p>
                </div>
              ) : (
                modalStockFiltered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectStockItem(item)}
                    className="p-3 bg-zinc-900/90 hover:bg-zinc-800/90 border border-gray-800 hover:border-seguranca-yellow rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white group-hover:text-seguranca-yellow transition-colors">
                          {item.name || item.fullName}
                        </span>
                        <Badge variant="outline" className="text-xs text-seguranca-yellow font-mono border-gray-700 bg-black/60">
                          {item.code || 'S/ CÓD'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span>Categoria: <strong className="text-gray-300">{item.category || 'Geral'}</strong></span>
                        {item.supplier && (
                          <span>• Fornecedor/Marca: <strong className="text-gray-300">{item.supplier}</strong></span>
                        )}
                        {item.barcode && (
                          <span>• Barras: <span className="font-mono text-gray-400">{item.barcode}</span></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
                      <div className="text-left sm:text-right">
                        <span className="text-emerald-400 font-bold text-sm block">
                          {item.currentQuantity ?? 0} {item.unitName || 'UN'}
                        </span>
                        <span className="text-[11px] text-gray-400 block">
                          {item.currentQuantity > 0 ? 'Disponível no Almoxarifado' : 'Sem saldo físico (Repor)'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-seguranca-yellow hover:bg-yellow-500 text-zinc-950 font-bold text-xs shadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStockItem(item);
                        }}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Usar nesta Cotação
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-zinc-900 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
              <span>Mostrando {modalStockFiltered.length} de {stockItems.length} itens do estoque</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsStockSearchOpen(false)}
                className="bg-zinc-800 border-gray-700 text-white"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Análise e Upload de Orçamentos do Fornecedor */}
      <QuotationBudgetUploadModal
        isOpen={isBudgetUploadModalOpen}
        onClose={() => setIsBudgetUploadModalOpen(false)}
        onApplyParsedBudget={handleApplyParsedBudget}
      />
    </Dialog>
  );
};

export default QuotationFormModal;
