import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, DollarSign, FileText, Clock, CreditCard, Truck, ShoppingCart, Plus, ExternalLink } from 'lucide-react';
import { Quotation, CreateQuotationRequest, UpdateQuotationRequest, QuotationStatus, quotationService } from '@/services/quotationService';
import { contasAPagarService, Supplier, CreateSupplierRequest } from '@/services/contasAPagarService';
import { purchaseRequestService, PurchaseRequest } from '@/services/purchaseRequestService';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import { userService, User } from '@/services/userService';
import { PurchaseRequestViewModal } from '@/components/compras/PurchaseRequestViewModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface QuotationFormModalProps {
  quotation?: Quotation | null;
  onClose: () => void;
  initialPurchaseRequestId?: string;
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

const QuotationFormModal: React.FC<QuotationFormModalProps> = ({ quotation, onClose, initialPurchaseRequestId, onCreated }) => {
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
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingPurchaseRequests, setLoadingPurchaseRequests] = useState(true);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isViewPurchaseRequestModalOpen, setIsViewPurchaseRequestModalOpen] = useState(false);
  const [viewingPurchaseRequest, setViewingPurchaseRequest] = useState<PurchaseRequest | undefined>();
  const { toast } = useToast();

  const isEditing = !!quotation;

  useEffect(() => {
    loadSuppliers();
    loadPurchaseRequests();
    loadUsers();
  }, []);

  // Atualizar formData quando quotation mudar E quando as listas estiverem prontas
  useEffect(() => {
    if (quotation) {
      console.log('🔍 QuotationFormModal - Carregando dados da cotação:', quotation);
      console.log('🔍 purchaseRequestId:', quotation.purchaseRequestId);
      console.log('🔍 assignedToId:', quotation.assignedToId);
      console.log('🔍 purchaseRequests carregadas:', purchaseRequests.length);
      console.log('🔍 users carregados:', users.length);
      
      const purchaseRequestIdValue = quotation.purchaseRequestId 
        ? String(quotation.purchaseRequestId).trim() 
        : '';
      const assignedToIdValue = quotation.assignedToId 
        ? String(quotation.assignedToId).trim() 
        : '';
      
      console.log('🔍 purchaseRequestIdValue (processado):', purchaseRequestIdValue);
      console.log('🔍 assignedToIdValue (processado):', assignedToIdValue);
      
      setFormData({
        title: quotation.title,
        description: quotation.description || '',
        supplierId: quotation.supplierId ? String(quotation.supplierId) : '',
        purchaseRequestId: purchaseRequestIdValue,
        unitId: quotation.unitId ? String(quotation.unitId) : '',
        totalValue: quotation.totalValue.toString(),
        validUntil: quotation.validUntil,
        terms: quotation.terms || '',
        paymentMethod: quotation.paymentMethod || '',
        deliveryMethod: quotation.deliveryMethod || '',
        notes: quotation.notes || '',
        assignedToId: assignedToIdValue,
        status: quotation.status
      });
      
      // Log após setFormData para verificar se foi aplicado
      setTimeout(() => {
        console.log('🔍 formData após atualização:', {
          purchaseRequestId: purchaseRequestIdValue,
          assignedToId: assignedToIdValue
        });
      }, 100);
    } else {
      // Resetar form quando não há cotação (modo criação)
      setFormData({
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
      console.log('🔍 Usuários carregados:', data?.length || 0);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
    }
  };

  // Forçar atualização do formData quando as listas terminarem de carregar (para garantir que os Select funcionem)
  useEffect(() => {
    if (quotation && !loadingPurchaseRequests && !loadingSuppliers && purchaseRequests.length > 0 && users.length > 0) {
      console.log('🔍 Listas carregadas - Atualizando formData novamente');
      const purchaseRequestIdValue = quotation.purchaseRequestId 
        ? String(quotation.purchaseRequestId).trim() 
        : '';
      const assignedToIdValue = quotation.assignedToId 
        ? String(quotation.assignedToId).trim() 
        : '';
      
      // Verificar se os valores existem nas listas
      const purchaseRequestExists = purchaseRequestIdValue 
        ? purchaseRequests.some(req => String(req.id).trim() === purchaseRequestIdValue)
        : false;
      const userExists = assignedToIdValue 
        ? users.some(user => String(user.id).trim() === assignedToIdValue)
        : false;
      
      console.log('🔍 Verificação de existência:', {
        purchaseRequestIdValue,
        purchaseRequestExists,
        assignedToIdValue,
        userExists
      });
      
      // Atualizar apenas se os valores mudaram ou se não foram aplicados corretamente
      setFormData(prev => ({
        ...prev,
        purchaseRequestId: purchaseRequestIdValue,
        assignedToId: assignedToIdValue
      }));
    }
  }, [quotation, loadingPurchaseRequests, loadingSuppliers, purchaseRequests.length, users.length]);

  // Pré-selecionar a solicitação de compra quando o modal for aberto a partir do "Nova Cotação" da solicitação
  useEffect(() => {
    if (!initialPurchaseRequestId) return;
    const req = purchaseRequests.find(r => String(r.id) === String(initialPurchaseRequestId));
    if (req) {
      setFormData(prev => ({
        ...prev,
        purchaseRequestId: prev.purchaseRequestId || String(req.id),
        title: prev.title || `Cotação - ${req.requestNumber}`,
        description: prev.description || `Cotação para a solicitação ${req.requestNumber} - ${req.title}`,
        totalValue: prev.totalValue || String(req.totalValue || req.estimatedTotal || ''),
      }));
    }
  }, [purchaseRequests, initialPurchaseRequestId]);

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
    setFormData(prev => ({ ...prev, [field]: value }));
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
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o título da cotação.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.totalValue || parseFloat(formData.totalValue) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe um valor total válido.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.validUntil) {
      toast({
        title: "Erro",
        description: "Por favor, informe a data de validade.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        supplierId: formData.supplierId || undefined,
        purchaseRequestId: formData.purchaseRequestId || undefined,
        unitId: formData.unitId || undefined,
        totalValue: parseFloat(formData.totalValue),
        validUntil: formData.validUntil,
        terms: formData.terms.trim() || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        deliveryMethod: formData.deliveryMethod || undefined,
        notes: formData.notes.trim() || undefined,
        assignedToId: formData.assignedToId || undefined
      };

      if (isEditing && quotation) {
        const updatePayload: UpdateQuotationRequest = {
          ...payload,
          status: formData.status
        };
        await quotationService.update(quotation.id, updatePayload);
        toast({
          title: "Sucesso",
          description: "Cotação atualizada com sucesso!",
        });
      } else {
        await quotationService.create(payload as CreateQuotationRequest);
        toast({
          title: "Sucesso",
          description: "Cotação criada com sucesso!",
        });
        onCreated?.();
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar cotação:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar cotação. Tente novamente.",
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
      DRAFT: 'Rascunho',
      SENT: 'Enviada',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            {isEditing ? 'Editar Cotação' : 'Nova Cotação'}
            {isEditing && quotation && (
              <Badge className={getStatusColor(quotation.status)}>
                {getStatusLabel(quotation.status)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {isEditing ? 'Atualize as informações da cotação' : 'Crie uma nova cotação de compra para fornecedores'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Solicitação de Compra */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-seguranca-red" />
                </div>
                Solicitação de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseRequestId" className="text-seguranca-lightgray font-medium">
                  Solicitação Relacionada
                </Label>
                <Select
                  value={formData.purchaseRequestId}
                  onValueChange={(value) => handleInputChange('purchaseRequestId', value)}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder={loadingPurchaseRequests ? "Carregando..." : "Selecione uma solicitação (opcional)"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                    {purchaseRequests.map((request) => (
                      <SelectItem key={request.id} value={String(request.id)} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {request.requestNumber} - {request.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPurchaseRequest && (
                  <div className="flex items-center gap-2 p-2 bg-seguranca-graphite border border-gray-600 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm text-seguranca-lightgray font-medium">
                        {selectedPurchaseRequest.requestNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        {selectedPurchaseRequest.title}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewPurchaseRequest(selectedPurchaseRequest.id)}
                      className="h-8 text-xs text-seguranca-yellow hover:text-seguranca-yellow hover:bg-seguranca-yellow/10"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visualizar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção: Informações Básicas */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-seguranca-lightgray font-medium">
                    Título <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Equipamentos de Segurança"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="supplier" className="text-seguranca-lightgray font-medium">
                      Fornecedor
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSupplierModalOpen(true)}
                      className="h-7 text-xs text-seguranca-yellow hover:text-seguranca-yellow hover:bg-seguranca-yellow/10"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Novo
                    </Button>
                  </div>
                  {suppliers.length === 0 && !loadingSuppliers ? (
                    <div className="space-y-2">
                      <Select disabled>
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray h-11">
                          <SelectValue placeholder="Nenhum fornecedor cadastrado" />
                        </SelectTrigger>
                      </Select>
                      <p className="text-xs text-gray-400">
                        Nenhum fornecedor encontrado.{' '}
                        <button
                          type="button"
                          onClick={() => setIsSupplierModalOpen(true)}
                          className="text-seguranca-yellow hover:underline font-medium"
                        >
                          Clique aqui para cadastrar
                        </button>
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={formData.supplierId}
                      onValueChange={(value) => handleInputChange('supplierId', value)}
                    >
                      <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                        <SelectValue placeholder={loadingSuppliers ? "Carregando..." : "Selecione um fornecedor"} />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={String(supplier.id)} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {supplier.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-seguranca-lightgray font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva os itens ou serviços da cotação..."
                  rows={3}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção: Informações Financeiras */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalValue" className="text-seguranca-lightgray font-medium">
                    Valor Total <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="totalValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalValue}
                    onChange={(e) => handleInputChange('totalValue', e.target.value)}
                    placeholder="0,00"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil" className="text-seguranca-lightgray font-medium">
                    Válida Até <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formatDateForInput(formData.validUntil)}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Forma de Pagamento
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="PIX" className="text-seguranca-lightgray hover:bg-seguranca-red/20">PIX</SelectItem>
                      <SelectItem value="Boleto" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Boleto</SelectItem>
                      <SelectItem value="Cartão" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Cartão</SelectItem>
                      <SelectItem value="Transferência" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Transferência</SelectItem>
                      <SelectItem value="Dinheiro" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Dinheiro</SelectItem>
                      <SelectItem value="Cheque" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryMethod" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Forma de Entrega
                  </Label>
                  <Select
                    value={formData.deliveryMethod}
                    onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a forma de entrega" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="Entrega no local" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Entrega no local</SelectItem>
                      <SelectItem value="Retirada no fornecedor" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Retirada no fornecedor</SelectItem>
                      <SelectItem value="Entrega programada" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Entrega programada</SelectItem>
                      <SelectItem value="Correios" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Correios</SelectItem>
                      <SelectItem value="Transportadora" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Transportadora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terms" className="text-seguranca-lightgray font-medium">
                  Condições de Pagamento
                </Label>
                <Input
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => handleInputChange('terms', e.target.value)}
                  placeholder="Ex: Pagamento em 30 dias, À vista com desconto"
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção: Observações */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Observações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignedToId" className="text-seguranca-lightgray font-medium">
                  Responsável pela Cotação
                </Label>
                <Select
                  value={formData.assignedToId}
                  onValueChange={(value) => handleInputChange('assignedToId', value)}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder={users.length === 0 ? "Nenhum usuário encontrado" : "Selecione o responsável"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                    {users.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        {user.name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-seguranca-lightgray font-medium">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value as QuotationStatus)}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="DRAFT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Rascunho</SelectItem>
                      <SelectItem value="SENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Enviada</SelectItem>
                      <SelectItem value="APPROVED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Aprovada</SelectItem>
                      <SelectItem value="REJECTED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Rejeitada</SelectItem>
                      <SelectItem value="EXPIRED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Expirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-seguranca-lightgray font-medium">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações adicionais sobre a cotação..."
                  rows={3}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-seguranca-red hover:bg-red-700 text-white"
            >
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Cotação')}
            </Button>
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
    </Dialog>
  );
};

export default QuotationFormModal;
