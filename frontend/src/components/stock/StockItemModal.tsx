import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StockItem, CreateStockItemDTO, StockCategory, StockCategoryLabels } from '@/types/stock';
import { stockService } from '@/services/stockService';
import { useToast } from '@/hooks/use-toast';

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
    }
  }, [item, open]);

  const handleInputChange = (field: keyof CreateStockItemDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      if (item) {
        await stockService.updateItem(item.id, formData);
        toast({
          title: 'Sucesso!',
          description: 'Item atualizado com sucesso.',
        });
      } else {
        await stockService.createItem(formData);
        toast({
          title: 'Sucesso!',
          description: 'Item criado com sucesso.',
        });
      }
      
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar item.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar Item' : 'Novo Item de Estoque'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Ex: UNI-VIG-CAM-M"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Camisa Vigilância"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value as StockCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(StockCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sizeVariation">Tamanho/Numeração</Label>
              <Input
                id="sizeVariation"
                value={formData.sizeVariation}
                onChange={(e) => handleInputChange('sizeVariation', e.target.value)}
                placeholder="Ex: M, G, 42, 44..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição detalhada do item..."
              rows={3}
            />
          </div>

          {/* Estoque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentQuantity">Quantidade Atual</Label>
              <Input
                id="currentQuantity"
                type="number"
                min="0"
                value={formData.currentQuantity}
                onChange={(e) => handleInputChange('currentQuantity', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumQuantity">Quantidade Mínima</Label>
              <Input
                id="minimumQuantity"
                type="number"
                min="0"
                value={formData.minimumQuantity}
                onChange={(e) => handleInputChange('minimumQuantity', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Informações Comerciais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitCost">Custo Unitário (R$)</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => handleInputChange('unitCost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                placeholder="Nome do fornecedor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Código de Barras</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => handleInputChange('barcode', e.target.value)}
              placeholder="Código de barras do produto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? 'Salvando...' : (item ? 'Atualizar' : 'Criar Item')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockItemModal;