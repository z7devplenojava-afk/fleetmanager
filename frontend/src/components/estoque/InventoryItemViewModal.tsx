import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  MapPin, 
  User, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { InventoryItem, ItemCategory, ItemType, ItemStatus } from '@/types/inventory';

interface InventoryItemViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onEdit: () => void;
  onMovement: () => void;
}

const InventoryItemViewModal: React.FC<InventoryItemViewModalProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
  onMovement
}) => {
  if (!item) return null;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
      return <Badge variant="default">Estoque OK</Badge>;
    }
  };

  const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
  const isExpiringSoon = item.expiryDate && 
    new Date(item.expiryDate) > new Date() && 
    new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center">
            <Package size={20} className="mr-2 text-seguranca-yellow" />
            Detalhes do Item: {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-seguranca-black p-4 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Nome</label>
                <p className="text-seguranca-lightgray font-medium">{item.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Marca</label>
                <p className="text-seguranca-lightgray font-medium">{item.brand}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Modelo</label>
                <p className="text-seguranca-lightgray">{item.model || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Descrição</label>
                <p className="text-seguranca-lightgray">{item.description || 'Não informado'}</p>
              </div>
            </div>
          </div>

          {/* Categorização */}
          <div className="bg-seguranca-black p-4 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">Categorização</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Categoria</label>
                <div className="mt-1">
                  <Badge variant="outline" className="border-gray-600 text-seguranca-lightgray">
                    {getCategoryLabel(item.category)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Tipo</label>
                <div className="mt-1">
                  <Badge variant="outline" className="border-gray-600 text-seguranca-lightgray">
                    {getTypeLabel(item.type)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <div className="mt-1">
                  {getStatusBadge(item.status)}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Tamanho</label>
                <p className="text-seguranca-lightgray">{item.size || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Cor</label>
                <p className="text-seguranca-lightgray">{item.color || 'Não informado'}</p>
              </div>
            </div>
          </div>

          {/* Estoque e Preços */}
          <div className="bg-seguranca-black p-4 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3 flex items-center">
              <TrendingUp size={18} className="mr-2 text-seguranca-yellow" />
              Estoque e Preços
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-400">Quantidade Atual</label>
                <p className={`text-2xl font-bold ${
                  item.quantity <= item.minimumQuantity ? 'text-red-500' : 'text-green-500'
                }`}>
                  {item.quantity}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Quantidade Mínima</label>
                <p className="text-seguranca-lightgray font-medium">{item.minimumQuantity}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Status do Estoque</label>
                <div className="mt-1">
                  {getStockStatusBadge(item.quantity, item.minimumQuantity)}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Preço Unitário</label>
                <p className="text-seguranca-lightgray font-medium">{formatCurrency(item.unitPrice)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Valor Total em Estoque</label>
                <p className="text-seguranca-lightgray font-medium">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>
          </div>

          {/* Localização e Fornecedor */}
          <div className="bg-seguranca-black p-4 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3 flex items-center">
              <MapPin size={18} className="mr-2 text-seguranca-yellow" />
              Localização e Fornecedor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Localização</label>
                <p className="text-seguranca-lightgray font-medium">{item.location}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Fornecedor</label>
                <p className="text-seguranca-lightgray font-medium">{item.supplier}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Código do Fornecedor</label>
                <p className="text-seguranca-lightgray">{item.supplierCode || 'Não informado'}</p>
              </div>
            </div>
          </div>

          {/* Data de Expiração */}
          {item.expiryDate && (
            <div className={`p-4 rounded-lg border ${
              isExpired ? 'bg-red-900/20 border-red-500' : 
              isExpiringSoon ? 'bg-yellow-900/20 border-yellow-500' : 
              'bg-seguranca-black border-gray-600'
            }`}>
              <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3 flex items-center">
                <Calendar size={18} className="mr-2 text-seguranca-yellow" />
                Data de Expiração
                {isExpired && <AlertTriangle size={16} className="ml-2 text-red-500" />}
                {isExpiringSoon && <AlertTriangle size={16} className="ml-2 text-yellow-500" />}
              </h3>
              <div className="flex items-center space-x-2">
                <p className={`font-medium ${
                  isExpired ? 'text-red-500' : 
                  isExpiringSoon ? 'text-yellow-500' : 
                  'text-seguranca-lightgray'
                }`}>
                  {formatDate(item.expiryDate)}
                </p>
                {isExpired && (
                  <Badge variant="destructive">Expirado</Badge>
                )}
                {isExpiringSoon && (
                  <Badge variant="destructive">Expira em breve</Badge>
                )}
              </div>
            </div>
          )}

          {/* Informações do Sistema */}
          <div className="bg-seguranca-black p-4 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">Informações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Data de Criação</label>
                <p className="text-seguranca-lightgray">{formatDate(item.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Última Atualização</label>
                <p className="text-seguranca-lightgray">{formatDate(item.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onMovement}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <TrendingDown size={16} className="mr-2" />
              Nova Movimentação
            </Button>
            <Button
              variant="outline"
              onClick={onEdit}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <Package size={16} className="mr-2" />
              Editar Item
            </Button>
            <Button
              onClick={onClose}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryItemViewModal; 