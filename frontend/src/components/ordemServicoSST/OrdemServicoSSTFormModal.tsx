import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { orderOfServiceSSTService } from '@/services/orderOfServiceSSTService';
import { OrderOfServiceSST, CreateOrderOfServiceSSTDTO, UpdateOrderOfServiceSSTDTO } from '@/types/orderOfServiceSST';
import { toast } from '@/hooks/use-toast';

interface OrdemServicoSSTFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: OrderOfServiceSST;
  onSuccess?: () => void;
}

export function OrdemServicoSSTFormModal({ 
  open, 
  onOpenChange, 
  order, 
  onSuccess 
}: OrdemServicoSSTFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrderOfServiceSSTDTO>({
    title: '',
    description: '',
    status: 'PENDENTE',
    responsible: '',
    issueDate: new Date().toISOString().split('T')[0],
    executionDate: '',
    documentUrl: '',
  });

  useEffect(() => {
    if (order) {
      setFormData({
        title: order.title,
        description: order.description,
        status: order.status,
        responsible: order.responsible,
        issueDate: order.issueDate.split('T')[0],
        executionDate: order.executionDate ? order.executionDate.split('T')[0] : '',
        documentUrl: order.documentUrl || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'PENDENTE',
        responsible: '',
        issueDate: new Date().toISOString().split('T')[0],
        executionDate: '',
        documentUrl: '',
      });
    }
  }, [order, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (order) {
        const updateData: UpdateOrderOfServiceSSTDTO = {
          id: order.id,
          ...formData,
        };
        await orderOfServiceSSTService.update(order.id, updateData);
        toast({
          title: "Sucesso",
          description: "Ordem de serviço atualizada com sucesso",
        });
      } else {
        await orderOfServiceSSTService.create(formData);
        toast({
          title: "Sucesso",
          description: "Ordem de serviço criada com sucesso",
        });
      }
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar ordem de serviço",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateOrderOfServiceSSTDTO, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {order ? 'Editar Ordem de Serviço SST' : 'Nova Ordem de Serviço SST'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável *</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => handleInputChange('responsible', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issueDate">Data de Emissão *</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="executionDate">Data de Execução</Label>
              <Input
                id="executionDate"
                type="date"
                value={formData.executionDate}
                onChange={(e) => handleInputChange('executionDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentUrl">URL do Documento</Label>
            <Input
              id="documentUrl"
              value={formData.documentUrl}
              onChange={(e) => handleInputChange('documentUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (order ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 