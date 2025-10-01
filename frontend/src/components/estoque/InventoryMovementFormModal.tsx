import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { InventoryMovement, InventoryMovementDTO, MovementType, InventoryItem } from '@/types/inventory';
import inventoryService from '@/services/inventoryService';

interface InventoryMovementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  movement?: InventoryMovement | null;
  items?: InventoryItem[];
}

const InventoryMovementFormModal: React.FC<InventoryMovementFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  movement,
  items = []
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InventoryMovementDTO>({
    itemId: '',
    movementType: MovementType.ENTRY,
    quantity: 0,
    reason: '',
    responsiblePerson: '',
    notes: ''
  });

  useEffect(() => {
    if (movement) {
      setFormData({
        itemId: movement.itemId,
        movementType: movement.movementType,
        quantity: movement.quantity,
        reason: movement.reason,
        responsiblePerson: movement.responsiblePerson,
        notes: movement.notes || ''
      });
    } else {
      setFormData({
        itemId: '',
        movementType: MovementType.ENTRY,
        quantity: 0,
        reason: '',
        responsiblePerson: '',
        notes: ''
      });
    }
  }, [movement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemId || !formData.reason || !formData.responsiblePerson || formData.quantity <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios e insira uma quantidade válida.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (movement) {
        await inventoryService.updateInventoryMovement(movement.id, formData);
        toast({
          title: "Sucesso",
          description: "Movimentação atualizada com sucesso!",
        });
      } else {
        await inventoryService.createInventoryMovement(formData);
        toast({
          title: "Sucesso",
          description: "Movimentação registrada com sucesso!",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a movimentação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof InventoryMovementDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getMovementTypeLabel = (type: MovementType): string => {
    const labels: Record<MovementType, string> = {
      [MovementType.ENTRY]: 'Entrada',
      [MovementType.EXIT]: 'Saída',
      [MovementType.ADJUSTMENT]: 'Ajuste',
      [MovementType.TRANSFER]: 'Transferência',
      [MovementType.LOSS]: 'Perda',
      [MovementType.EXPIRATION]: 'Expiração'
    };
    return labels[type];
  };

  const getMovementTypeColor = (type: MovementType): string => {
    const colors: Record<MovementType, string> = {
      [MovementType.ENTRY]: 'text-green-500',
      [MovementType.EXIT]: 'text-red-500',
      [MovementType.ADJUSTMENT]: 'text-yellow-500',
      [MovementType.TRANSFER]: 'text-blue-500',
      [MovementType.LOSS]: 'text-red-600',
      [MovementType.EXPIRATION]: 'text-orange-500'
    };
    return colors[type];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">
            {movement ? 'Editar Movimentação' : 'Nova Movimentação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item */}
          <div>
            <Label htmlFor="itemId" className="text-seguranca-lightgray">Item *</Label>
            <Select value={formData.itemId} onValueChange={(value) => handleInputChange('itemId', value)}>
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Selecione um item" />
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - {item.brand} (Estoque: {item.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Movimentação */}
          <div>
            <Label htmlFor="movementType" className="text-seguranca-lightgray">Tipo de Movimentação</Label>
            <Select value={formData.movementType} onValueChange={(value) => handleInputChange('movementType', value as MovementType)}>
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MovementType).map(type => (
                  <SelectItem key={type} value={type}>
                    <span className={getMovementTypeColor(type)}>
                      {getMovementTypeLabel(type)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade */}
          <div>
            <Label htmlFor="quantity" className="text-seguranca-lightgray">Quantidade *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Quantidade"
            />
          </div>

          {/* Motivo */}
          <div>
            <Label htmlFor="reason" className="text-seguranca-lightgray">Motivo *</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Motivo da movimentação"
            />
          </div>

          {/* Responsável */}
          <div>
            <Label htmlFor="responsiblePerson" className="text-seguranca-lightgray">Responsável *</Label>
            <Input
              id="responsiblePerson"
              value={formData.responsiblePerson}
              onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Nome do responsável"
            />
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes" className="text-seguranca-lightgray">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {isSubmitting ? 'Salvando...' : (movement ? 'Atualizar' : 'Registrar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryMovementFormModal; 