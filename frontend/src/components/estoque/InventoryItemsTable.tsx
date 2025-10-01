import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { InventoryItem, ItemCategory, ItemStatus } from '@/types/inventory';

interface InventoryItemsTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onView: (item: InventoryItem) => void;
}

const InventoryItemsTable: React.FC<InventoryItemsTableProps> = ({
  items,
  onEdit,
  onDelete,
  onView
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  const getStatusBadge = (status: ItemStatus) => {
    const statusConfig = {
      [ItemStatus.ACTIVE]: { label: 'Ativo', variant: 'default' as const },
      [ItemStatus.INACTIVE]: { label: 'Inativo', variant: 'secondary' as const },
      [ItemStatus.DISCONTINUED]: { label: 'Descontinuado', variant: 'destructive' as const },
      [ItemStatus.OUT_OF_STOCK]: { label: 'Sem Estoque', variant: 'destructive' as const }
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStockStatusBadge = (quantity: number, minimumQuantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    } else if (quantity <= minimumQuantity) {
      return <Badge variant="destructive">Estoque Baixo</Badge>;
    } else {
      return <Badge variant="default">OK</Badge>;
    }
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Preço Unit.</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <div className="font-medium text-seguranca-lightgray">{item.name}</div>
                  <div className="text-sm text-gray-400">{item.brand}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {item.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-gray-600 text-seguranca-lightgray">
                  {getCategoryLabel(item.category)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${
                    item.quantity <= item.minimumQuantity ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {item.quantity}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-400">{item.minimumQuantity}</span>
                  {item.quantity <= item.minimumQuantity && (
                    <AlertTriangle size={12} className="text-red-500" />
                  )}
                </div>
                {getStockStatusBadge(item.quantity, item.minimumQuantity)}
              </TableCell>
              <TableCell>
                <span className="font-medium text-seguranca-lightgray">
                  {formatCurrency(item.unitPrice)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <span className="text-seguranca-lightgray">{item.location}</span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(item.status)}
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-seguranca-lightgray">{item.supplier}</div>
                  {item.supplierCode && (
                    <div className="text-xs text-gray-400">Cód: {item.supplierCode}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onView(item)}
                  >
                    <Eye size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEdit(item)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <div className="flex flex-col items-center">
                  <Package size={48} className="text-gray-500 mb-4" />
                  <p className="text-gray-400">Nenhum item encontrado</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryItemsTable; 