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
import { 
  StockItem, 
  CreateStockMovementDTO, 
  MovementType, 
  MovementReason, 
  MovementTypeLabels, 
  MovementReasonLabels 
} from '@/types/stock';
import { stockService } from '@/services/stockService';
import { employeeService } from '@/services/employeeService';
import { useToast } from '@/hooks/use-toast';

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
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(item);
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

  useEffect(() => {
    if (open) {
      loadEmployees();
    }
  }, [open]);

  useEffect(() => {
    if (item) {
      setSelectedItem(item);
      setFormData(prev => ({
        ...prev,
        stockItemId: item.id
      }));
    }
  }, [item]);

  const loadEmployees = async () => {
    try {
      const employeeData = await employeeService.getAllEmployees();
      setEmployees(employeeData);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const handleInputChange = (field: keyof CreateStockMovementDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMovementTypeChange = (type: MovementType) => {
    setFormData(prev => ({
      ...prev,
      movementType: type,
      // Resetar motivo para o primeiro da categoria
      reason: type === MovementType.ENTRADA ? MovementReason.COMPRA : MovementReason.ENTREGA_INICIAL
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.stockItemId || !formData.quantity || formData.quantity <= 0) {
      toast({
        title: 'Erro',
        description: 'Item e quantidade são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    // Validar se é saída e tem funcionário (para alguns motivos)
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
      await stockService.createMovement(formData);
      toast({
        title: 'Sucesso!',
        description: 'Movimentação registrada com sucesso.',
      });
      
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
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao registrar movimentação.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemSearch = async (code: string) => {
    if (!code) return;
    
    try {
      const foundItem = await stockService.getItemByCode(code);
      setSelectedItem(foundItem);
      setFormData(prev => ({
        ...prev,
        stockItemId: foundItem.id
      }));
      toast({
        title: 'Item encontrado',
        description: `${foundItem.fullName} - Estoque: ${foundItem.currentQuantity}`,
      });
    } catch (error) {
      toast({
        title: 'Item não encontrado',
        description: 'Código não corresponde a nenhum item cadastrado.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção do Item */}
          {!item && (
            <div className="space-y-2">
              <Label htmlFor="itemCode">Código do Item</Label>
              <div className="flex gap-2">
                <Input
                  id="itemCode"
                  placeholder="Digite o código do item"
                  onBlur={(e) => handleItemSearch(e.target.value)}
                />
                <Button type="button" onClick={() => handleItemSearch((document.getElementById('itemCode') as HTMLInputElement)?.value)}>
                  Buscar
                </Button>
              </div>
            </div>
          )}

          {/* Item Selecionado */}
          {selectedItem && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium">{selectedItem.fullName}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Código: {selectedItem.code} | Estoque Atual: {selectedItem.currentQuantity}
              </p>
            </div>
          )}

          {/* Tipo de Movimentação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="movementType">Tipo de Movimentação *</Label>
              <Select 
                value={formData.movementType} 
                onValueChange={(value) => handleMovementTypeChange(value as MovementType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MovementTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo *</Label>
              <Select 
                value={formData.reason} 
                onValueChange={(value) => handleInputChange('reason', value as MovementReason)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {getReasonsByType(formData.movementType).map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {MovementReasonLabels[reason]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              required
            />
          </div>

          {/* Funcionário (para saídas) */}
          {formData.movementType === MovementType.SAIDA && (
            <div className="space-y-2">
              <Label htmlFor="employeeId">
                Funcionário {[MovementReason.ENTREGA_INICIAL, MovementReason.REPOSICAO, MovementReason.TROCA].includes(formData.reason) ? '*' : ''}
              </Label>
              <Select 
                value={formData.employeeId} 
                onValueChange={(value) => handleInputChange('employeeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Número do Documento</Label>
              <Input
                id="documentNumber"
                value={formData.documentNumber}
                onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                placeholder="NF, recibo, etc."
              />
            </div>

            {formData.movementType === MovementType.ENTRADA && (
              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Nome do fornecedor"
                />
              </div>
            )}
          </div>

          {formData.movementType === MovementType.ENTRADA && (
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
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações sobre a movimentação..."
              rows={3}
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
              disabled={loading || !selectedItem}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? 'Registrando...' : 'Registrar Movimentação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockMovementModal;