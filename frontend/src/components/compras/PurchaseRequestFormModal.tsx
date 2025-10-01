import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PurchaseRequest, CreatePurchaseRequestRequest, UpdatePurchaseRequestRequest } from '@/services/purchaseRequestService';
import { unitService } from '@/services/unitService';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PurchaseRequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: PurchaseRequest;
  onSave: (request: CreatePurchaseRequestRequest | UpdatePurchaseRequestRequest) => Promise<void>;
  loading?: boolean;
}

export function PurchaseRequestFormModal({ isOpen, onClose, request, onSave, loading }: PurchaseRequestFormModalProps) {
  const { toast } = useToast();
  const [units, setUnits] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreatePurchaseRequestRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'DRAFT',
    requesterName: '',
    department: '',
    justification: '',
    estimatedTotal: 0,
    urgency: 'NORMAL',
    requiredDate: '',
    approvedBy: '',
    approvalNotes: '',
    supplier: '',
    paymentMethod: '',
    deliveryMethod: '',
    deliveryAddress: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
    unitId: '',
    requesterId: '',
    approverId: '',
  });

  useEffect(() => {
    loadUnits();
    if (request) {
      setFormData({
        id: request.id,
        title: request.title,
        description: request.description || '',
        priority: request.priority || 'MEDIUM',
        status: request.status || 'DRAFT',
        requesterName: request.requesterName || '',
        department: request.department || '',
        justification: request.justification || '',
        estimatedTotal: request.estimatedTotal || 0,
        urgency: request.urgency || 'NORMAL',
        requiredDate: request.requiredDate || '',
        approvedBy: request.approvedBy || '',
        approvalNotes: request.approvalNotes || '',
        supplier: request.supplier || '',
        paymentMethod: request.paymentMethod || '',
        deliveryMethod: request.deliveryMethod || '',
        deliveryAddress: request.deliveryAddress || '',
        contactPerson: request.contactPerson || '',
        contactPhone: request.contactPhone || '',
        contactEmail: request.contactEmail || '',
        notes: request.notes || '',
        unitId: request.unitId || '',
        requesterId: request.requesterId || '',
        approverId: request.approverId || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'DRAFT',
        requesterName: '',
        department: '',
        justification: '',
        estimatedTotal: 0,
        urgency: 'NORMAL',
        requiredDate: '',
        approvedBy: '',
        approvalNotes: '',
        supplier: '',
        paymentMethod: '',
        deliveryMethod: '',
        deliveryAddress: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        notes: '',
        unitId: '',
        requesterId: '',
        approverId: '',
      });
    }
  }, [request, isOpen]);

  const loadUnits = async () => {
    try {
      const unitsData = await unitService.getAllUnits();
      setUnits(unitsData);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const handleInputChange = (field: keyof CreatePurchaseRequestRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      toast({
        title: "Sucesso",
        description: request ? "Requisição atualizada com sucesso!" : "Requisição criada com sucesso!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar requisição. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'URGENT': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'IN_PROCESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {request ? 'Editar Requisição de Compra' : 'Nova Requisição de Compra'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Requisição *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Título da requisição"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestNumber">Número da Requisição</Label>
                  <Input
                    id="requestNumber"
                    value={request?.requestNumber || ''}
                    disabled
                    placeholder="Gerado automaticamente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baixa</SelectItem>
                      <SelectItem value="MEDIUM">Média</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Rascunho</SelectItem>
                      <SelectItem value="SUBMITTED">Enviada</SelectItem>
                      <SelectItem value="APPROVED">Aprovada</SelectItem>
                      <SelectItem value="REJECTED">Rejeitada</SelectItem>
                      <SelectItem value="IN_PROCESS">Em Processo</SelectItem>
                      <SelectItem value="COMPLETED">Completada</SelectItem>
                      <SelectItem value="CANCELLED">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgência</Label>
                  <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                      <SelectItem value="CRITICAL">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Departamento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requesterName">Solicitante</Label>
                  <Input
                    id="requesterName"
                    value={formData.requesterName}
                    onChange={(e) => handleInputChange('requesterName', e.target.value)}
                    placeholder="Nome do solicitante"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitId">Unidade Organizacional</Label>
                  <Select value={formData.unitId} onValueChange={(value) => handleInputChange('unitId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredDate">Data Necessária</Label>
                  <Input
                    id="requiredDate"
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => handleInputChange('requiredDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedTotal">Valor Estimado</Label>
                  <Input
                    id="estimatedTotal"
                    type="number"
                    step="0.01"
                    value={formData.estimatedTotal}
                    onChange={(e) => handleInputChange('estimatedTotal', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição detalhada da requisição"
                  rows={3}
                />
              </div>

              <div className="mt-4">
                <Label htmlFor="justification">Justificativa</Label>
                <Textarea
                  id="justification"
                  value={formData.justification}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  placeholder="Justificativa para a compra"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações de Fornecedor */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Informações de Fornecedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Transferência Bancária</SelectItem>
                      <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                      <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                      <SelectItem value="CASH">Dinheiro</SelectItem>
                      <SelectItem value="CHECK">Cheque</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryMethod">Método de Entrega</Label>
                  <Select value={formData.deliveryMethod} onValueChange={(value) => handleInputChange('deliveryMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PICKUP">Retirada</SelectItem>
                      <SelectItem value="DELIVERY">Entrega</SelectItem>
                      <SelectItem value="COURIER">Correio</SelectItem>
                      <SelectItem value="TRANSPORT">Transportadora</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Pessoa de Contato</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    placeholder="Nome do contato"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="Telefone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">E-mail</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="E-mail"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="deliveryAddress">Endereço de Entrega</Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  placeholder="Endereço completo para entrega"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações de Aprovação */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Informações de Aprovação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="approvedBy">Aprovado Por</Label>
                  <Input
                    id="approvedBy"
                    value={formData.approvedBy}
                    onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                    placeholder="Nome do aprovador"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approvalNotes">Observações da Aprovação</Label>
                  <Textarea
                    id="approvalNotes"
                    value={formData.approvalNotes}
                    onChange={(e) => handleInputChange('approvalNotes', e.target.value)}
                    placeholder="Observações sobre a aprovação"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Observações</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações Adicionais</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações adicionais sobre a requisição"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status da Requisição (se editando) */}
          {request && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Status da Requisição</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Label>Status:</Label>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label>Prioridade:</Label>
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label>Urgência:</Label>
                    <Badge className={getUrgencyColor(request.urgency)}>
                      {request.urgency}
                    </Badge>
                  </div>

                  {request.urgent && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">Urgente</Badge>
                    </div>
                  )}

                  {request.overdue && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Em Atraso</Badge>
                    </div>
                  )}

                  {request.canBeApproved && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Aguardando Aprovação</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (request ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}