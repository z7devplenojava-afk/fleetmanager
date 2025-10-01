import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Building2, User, DollarSign, FileText, Clock, CreditCard, Truck } from 'lucide-react';
import { Quotation, CreateQuotationRequest, UpdateQuotationRequest, QuotationStatus, quotationService } from '@/services/quotationService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuotationFormModalProps {
  quotation?: Quotation | null;
  onClose: () => void;
}

interface FormData {
  title: string;
  description: string;
  supplierId: string;
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

const QuotationFormModal: React.FC<QuotationFormModalProps> = ({ quotation, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    supplierId: '',
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
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const isEditing = !!quotation;

  useEffect(() => {
    loadSuppliers();
    if (quotation) {
      setFormData({
        title: quotation.title,
        description: quotation.description || '',
        supplierId: quotation.supplierId || '',
        unitId: quotation.unitId || '',
        totalValue: quotation.totalValue.toString(),
        validUntil: quotation.validUntil,
        terms: quotation.terms || '',
        paymentMethod: quotation.paymentMethod || '',
        deliveryMethod: quotation.deliveryMethod || '',
        notes: quotation.notes || '',
        assignedToId: quotation.assignedToId || '',
        status: quotation.status
      });
    }
  }, [quotation]);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await contasAPagarService.getActiveSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      // Mock data for development
      setSuppliers([
        { id: '1', name: 'Fornecedor ABC Ltda', cnpj: '12.345.678/0001-90', email: 'contato@abc.com', phone: '(11) 1234-5678', active: true },
        { id: '2', name: 'Limpeza Total S.A.', cnpj: '98.765.432/0001-10', email: 'vendas@limpezatotal.com', phone: '(11) 9876-5432', active: true },
        { id: '3', name: 'Confecções Uniformes Ltda', cnpj: '11.222.333/0001-44', email: 'pedidos@uniformes.com', phone: '(11) 5555-1234', active: true }
      ]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Por favor, informe o título da cotação.');
      return;
    }

    if (!formData.totalValue || parseFloat(formData.totalValue) <= 0) {
      alert('Por favor, informe um valor total válido.');
      return;
    }

    if (!formData.validUntil) {
      alert('Por favor, informe a data de validade.');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        supplierId: formData.supplierId || undefined,
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
      } else {
        await quotationService.create(payload as CreateQuotationRequest);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar cotação:', error);
      alert('Erro ao salvar cotação. Tente novamente.');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? 'Editar Cotação' : 'Nova Cotação'}
            {isEditing && quotation && (
              <Badge className={getStatusColor(quotation.status)}>
                {getStatusLabel(quotation.status)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Equipamentos de Segurança"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => handleInputChange('supplierId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingSuppliers ? "Carregando..." : "Selecione um fornecedor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {supplier.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva os itens ou serviços da cotação..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalValue">Valor Total *</Label>
                  <Input
                    id="totalValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalValue}
                    onChange={(e) => handleInputChange('totalValue', e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Válida Até *</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formatDateForInput(formData.validUntil)}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryMethod">Forma de Entrega</Label>
                  <Select
                    value={formData.deliveryMethod}
                    onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrega no local">Entrega no local</SelectItem>
                      <SelectItem value="Retirada no fornecedor">Retirada no fornecedor</SelectItem>
                      <SelectItem value="Entrega programada">Entrega programada</SelectItem>
                      <SelectItem value="Correios">Correios</SelectItem>
                      <SelectItem value="Transportadora">Transportadora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terms">Condições de Pagamento</Label>
                <Input
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => handleInputChange('terms', e.target.value)}
                  placeholder="Ex: Pagamento em 30 dias, À vista com desconto"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value as QuotationStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Rascunho</SelectItem>
                      <SelectItem value="SENT">Enviada</SelectItem>
                      <SelectItem value="APPROVED">Aprovada</SelectItem>
                      <SelectItem value="REJECTED">Rejeitada</SelectItem>
                      <SelectItem value="EXPIRED">Expirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações adicionais sobre a cotação..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Cotação')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationFormModal;