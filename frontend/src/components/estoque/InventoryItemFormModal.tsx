import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem, InventoryItemDTO, ItemCategory, ItemType, ItemStatus } from '@/types/inventory';
import inventoryService from '@/services/inventoryService';

interface InventoryItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: InventoryItem | null;
}

const InventoryItemFormModal: React.FC<InventoryItemFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InventoryItemDTO>({
    name: '',
    description: '',
    category: ItemCategory.UNIFORM,
    type: ItemType.UNIFORM,
    brand: '',
    model: '',
    size: '',
    color: '',
    unitPrice: 0,
    quantity: 0,
    minimumQuantity: 0,
    location: '',
    supplier: '',
    supplierCode: '',
    expiryDate: '',
    status: ItemStatus.ACTIVE
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        category: item.category,
        type: item.type,
        brand: item.brand,
        model: item.model || '',
        size: item.size || '',
        color: item.color || '',
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        minimumQuantity: item.minimumQuantity,
        location: item.location,
        supplier: item.supplier,
        supplierCode: item.supplierCode || '',
        expiryDate: item.expiryDate || '',
        status: item.status
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: ItemCategory.UNIFORM,
        type: ItemType.UNIFORM,
        brand: '',
        model: '',
        size: '',
        color: '',
        unitPrice: 0,
        quantity: 0,
        minimumQuantity: 0,
        location: '',
        supplier: '',
        supplierCode: '',
        expiryDate: '',
        status: ItemStatus.ACTIVE
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.brand || !formData.location || !formData.supplier) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (item) {
        await inventoryService.updateInventoryItem(item.id, formData);
        toast({
          title: "Sucesso",
          description: "Item de estoque atualizado com sucesso!",
        });
      } else {
        await inventoryService.createInventoryItem(formData);
        toast({
          title: "Sucesso",
          description: "Item de estoque criado com sucesso!",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o item. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof InventoryItemDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCategoryLabel = (category: ItemCategory): string => {
    const labels: Record<ItemCategory, string> = {
      [ItemCategory.UNIFORM]: 'Uniforme',
      [ItemCategory.EQUIPMENT]: 'Equipamento',
      [ItemCategory.TOOLS]: 'Ferramentas',
      [ItemCategory.SUPPLIES]: 'Suprimentos',
      [ItemCategory.ELECTRONICS]: 'Eletrônicos',
      [ItemCategory.SAFETY]: 'Segurança',
      [ItemCategory.OFFICE]: 'Escritório',
      [ItemCategory.OTHER]: 'Outros'
    };
    return labels[category];
  };

  const getTypeLabel = (type: ItemType): string => {
    const labels: Record<ItemType, string> = {
      [ItemType.UNIFORM]: 'Uniforme',
      [ItemType.FOOTWEAR]: 'Calçado',
      [ItemType.PROTECTIVE_EQUIPMENT]: 'Equipamento de Proteção',
      [ItemType.TOOL]: 'Ferramenta',
      [ItemType.ELECTRONIC_DEVICE]: 'Dispositivo Eletrônico',
      [ItemType.OFFICE_SUPPLY]: 'Material de Escritório',
      [ItemType.CLEANING_SUPPLY]: 'Material de Limpeza',
      [ItemType.MAINTENANCE_SUPPLY]: 'Material de Manutenção',
      [ItemType.OTHER]: 'Outros'
    };
    return labels[type];
  };

  const getStatusLabel = (status: ItemStatus): string => {
    const labels: Record<ItemStatus, string> = {
      [ItemStatus.ACTIVE]: 'Ativo',
      [ItemStatus.INACTIVE]: 'Inativo',
      [ItemStatus.DISCONTINUED]: 'Descontinuado',
      [ItemStatus.OUT_OF_STOCK]: 'Sem Estoque'
    };
    return labels[status];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">
            {item ? 'Editar Item de Estoque' : 'Novo Item de Estoque'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-seguranca-lightgray">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Nome do item"
              />
            </div>

            <div>
              <Label htmlFor="brand" className="text-seguranca-lightgray">Marca *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Marca do item"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-seguranca-lightgray">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Descrição detalhada do item"
              rows={3}
            />
          </div>

          {/* Categoria e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="text-seguranca-lightgray">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value as ItemCategory)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ItemCategory).map(category => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type" className="text-seguranca-lightgray">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value as ItemType)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ItemType).map(type => (
                    <SelectItem key={type} value={type}>
                      {getTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Características */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="model" className="text-seguranca-lightgray">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Modelo"
              />
            </div>

            <div>
              <Label htmlFor="size" className="text-seguranca-lightgray">Tamanho</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Tamanho"
              />
            </div>

            <div>
              <Label htmlFor="color" className="text-seguranca-lightgray">Cor</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Cor"
              />
            </div>
          </div>

          {/* Preços e Quantidades */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="unitPrice" className="text-seguranca-lightgray">Preço Unitário</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="quantity" className="text-seguranca-lightgray">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="minimumQuantity" className="text-seguranca-lightgray">Quantidade Mínima</Label>
              <Input
                id="minimumQuantity"
                type="number"
                value={formData.minimumQuantity}
                onChange={(e) => handleInputChange('minimumQuantity', parseInt(e.target.value) || 0)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="0"
              />
            </div>
          </div>

          {/* Localização e Fornecedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location" className="text-seguranca-lightgray">Localização *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Localização no estoque"
              />
            </div>

            <div>
              <Label htmlFor="supplier" className="text-seguranca-lightgray">Fornecedor *</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Nome do fornecedor"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="supplierCode" className="text-seguranca-lightgray">Código do Fornecedor</Label>
            <Input
              id="supplierCode"
              value={formData.supplierCode}
              onChange={(e) => handleInputChange('supplierCode', e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Código do fornecedor"
            />
          </div>

          {/* Data de Expiração e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate" className="text-seguranca-lightgray">Data de Expiração</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as ItemStatus)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ItemStatus).map(status => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {isSubmitting ? 'Salvando...' : (item ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryItemFormModal; 