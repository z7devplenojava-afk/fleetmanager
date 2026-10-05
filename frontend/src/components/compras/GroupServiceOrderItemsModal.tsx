import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ShoppingCart, AlertCircle, Wrench, Car, Sparkles, Layers, DollarSign, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface PendingServiceOrderItem {
  id: string;
  serviceOrderId: string;
  serviceOrderNumber: string;
  vehiclePlate: string;
  vehicleModel: string;
  clientName: string;
  itemCode: string;
  description: string;
  quantityNeeded: number;
  unit: string;
  estimatedUnitPrice: number;
  costCenter: string;
  urgency: 'ALTA' | 'MEDIA' | 'BAIXA';
  requestedAt: string;
}

interface GroupServiceOrderItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupSelected: (items: PendingServiceOrderItem[]) => void;
}

// Mock itens de várias Ordens de Serviço sem estoque no almoxarifado
const MOCK_PENDING_ITEMS: PendingServiceOrderItem[] = [
  {
    id: 'poi-1',
    serviceOrderId: 'os-101',
    serviceOrderNumber: 'OS-2024-0101',
    vehiclePlate: 'OPP-0A67',
    vehicleModel: 'Marcopolo Paradiso 1800 DD',
    clientName: 'Vale S.A.',
    itemCode: 'PEC-F102',
    description: 'Filtro Separador Racor Parker',
    quantityNeeded: 2,
    unit: 'UN',
    estimatedUnitPrice: 185.00,
    costCenter: 'CC-VALE-01',
    urgency: 'ALTA',
    requestedAt: '2026-10-04'
  },
  {
    id: 'poi-2',
    serviceOrderId: 'os-101',
    serviceOrderNumber: 'OS-2024-0101',
    vehiclePlate: 'OPP-0A67',
    vehicleModel: 'Marcopolo Paradiso 1800 DD',
    clientName: 'Vale S.A.',
    itemCode: 'PEC-F204',
    description: 'Filtro de Ar Motor Volvo D13',
    quantityNeeded: 1,
    unit: 'UN',
    estimatedUnitPrice: 340.00,
    costCenter: 'CC-VALE-01',
    urgency: 'MEDIA',
    requestedAt: '2026-10-04'
  },
  {
    id: 'poi-3',
    serviceOrderId: 'os-105',
    serviceOrderNumber: 'OS-2024-0105',
    vehiclePlate: 'OVQ-6C30',
    vehicleModel: 'Scania K400 IB 4x2',
    clientName: 'Aperam Bioenergia',
    itemCode: 'PEC-L88',
    description: 'Lâmpada Xênon H7 12V 55W Super Branca',
    quantityNeeded: 4,
    unit: 'UN',
    estimatedUnitPrice: 45.00,
    costCenter: 'CC-APERAM-02',
    urgency: 'BAIXA',
    requestedAt: '2026-10-05'
  },
  {
    id: 'poi-4',
    serviceOrderId: 'os-105',
    serviceOrderNumber: 'OS-2024-0105',
    vehiclePlate: 'OVQ-6C30',
    vehicleModel: 'Scania K400 IB 4x2',
    clientName: 'Aperam Bioenergia',
    itemCode: 'PEC-P90',
    description: 'Pastilha de Freio Dianteira Fras-le',
    quantityNeeded: 2,
    unit: 'JG',
    estimatedUnitPrice: 420.00,
    costCenter: 'CC-APERAM-02',
    urgency: 'ALTA',
    requestedAt: '2026-10-05'
  },
  {
    id: 'poi-5',
    serviceOrderId: 'os-112',
    serviceOrderNumber: 'OS-2024-0112',
    vehiclePlate: 'PUG-1214',
    vehicleModel: 'Mercedes-Benz O500RSD',
    clientName: 'CSN',
    itemCode: 'PEC-CORR-03',
    description: 'Correia Poliv Alternador Contitech',
    quantityNeeded: 1,
    unit: 'UN',
    estimatedUnitPrice: 160.00,
    costCenter: 'CC-CSN-04',
    urgency: 'ALTA',
    requestedAt: '2026-10-05'
  },
  {
    id: 'poi-6',
    serviceOrderId: 'os-112',
    serviceOrderNumber: 'OS-2024-0112',
    vehiclePlate: 'PUG-1214',
    vehicleModel: 'Mercedes-Benz O500RSD',
    clientName: 'CSN',
    itemCode: 'PEC-OLEO-15W40',
    description: 'Óleo Lubrificante Mobil Delvac 15W40 (Tambor 200L)',
    quantityNeeded: 1,
    unit: 'TB',
    estimatedUnitPrice: 2800.00,
    costCenter: 'CC-CSN-04',
    urgency: 'MEDIA',
    requestedAt: '2026-10-05'
  }
];

export const GroupServiceOrderItemsModal: React.FC<GroupServiceOrderItemsModalProps> = ({
  isOpen,
  onClose,
  onGroupSelected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(['poi-1', 'poi-2', 'poi-3', 'poi-4', 'poi-5']);
  const { toast } = useToast();

  const filteredItems = MOCK_PENDING_ITEMS.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serviceOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItems = MOCK_PENDING_ITEMS.filter(item => selectedIds.includes(item.id));
  
  // Contar OSs únicas selecionadas
  const uniqueOsCount = new Set(selectedItems.map(i => i.serviceOrderId)).size;
  
  // Calcular valor total estimado
  const totalEstimatedValue = selectedItems.reduce(
    (sum, item) => sum + item.quantityNeeded * item.estimatedUnitPrice,
    0
  );

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmGrouping = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Por favor, selecione ao menos uma peça sem estoque para agrupar na cotação.",
        variant: "destructive"
      });
      return;
    }

    onGroupSelected(selectedItems);
    toast({
      title: "⚡ Cotação Multi-OS Criada!",
      description: `Agrupados ${selectedItems.length} itens de ${uniqueOsCount} Ordens de Serviço distintas com rateio automático.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-zinc-800 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-400">
              <Layers className="w-6 h-6 text-amber-400" />
              Agrupar Peças sem Estoque (Multi-OS)
            </DialogTitle>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
              {MOCK_PENDING_ITEMS.length} peças pendentes
            </Badge>
          </div>
          <DialogDescription className="text-zinc-400 text-sm mt-1">
            Selecione itens faltantes de múltiplas Ordens de Serviço para gerar uma cotação unificada de fornecedores. O valor de cada peça será alocado no centro de custo da sua OS de origem.
          </DialogDescription>
        </DialogHeader>

        {/* Filtro e Ações no Topo */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar por OS, Peça, Placa ou Cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleSelectAll}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              {selectedIds.length === filteredItems.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
            <span className="text-xs text-zinc-400">
              {selectedIds.length} de {filteredItems.length} selecionados
            </span>
          </div>
        </div>

        {/* Tabela de Itens Sem Estoque */}
        <div className="flex-1 overflow-y-auto border border-zinc-800 rounded-lg bg-zinc-900/50">
          <Table>
            <TableHeader className="bg-zinc-900 sticky top-0">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="w-10 text-center">
                  <Checkbox
                    checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                    onCheckedChange={handleToggleSelectAll}
                    aria-label="Selecionar tudo"
                  />
                </TableHead>
                <TableHead className="text-zinc-300">Ordem de Serviço / Cliente</TableHead>
                <TableHead className="text-zinc-300">Veículo / Placa</TableHead>
                <TableHead className="text-zinc-300">Peça / Código</TableHead>
                <TableHead className="text-center text-zinc-300">Qtd Faltante</TableHead>
                <TableHead className="text-right text-zinc-300">Valor Unit. Est.</TableHead>
                <TableHead className="text-right text-zinc-300">Subtotal Est.</TableHead>
                <TableHead className="text-center text-zinc-300">Urgência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => {
                const isSelected = selectedIds.includes(item.id);
                const subtotal = item.quantityNeeded * item.estimatedUnitPrice;

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`border-zinc-800 cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                        {item.serviceOrderNumber}
                      </div>
                      <div className="text-xs text-zinc-400">{item.clientName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-zinc-200 text-xs flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-blue-400" />
                        {item.vehiclePlate}
                      </div>
                      <div className="text-xs text-zinc-500 truncate max-w-[140px]">
                        {item.vehicleModel}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-zinc-100">{item.description}</div>
                      <div className="text-xs font-mono text-zinc-500">{item.itemCode}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-amber-500/40 text-amber-300 font-bold">
                        {item.quantityNeeded} {item.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300 text-xs">
                      R$ {item.estimatedUnitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-emerald-400">
                      R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.urgency === 'ALTA' && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/40">Alta</Badge>
                      )}
                      {item.urgency === 'MEDIA' && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">Média</Badge>
                      )}
                      {item.urgency === 'BAIXA' && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">Baixa</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer com Resumo do Agrupamento */}
        <DialogFooter className="border-t border-zinc-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Itens:</span>
              <span className="font-bold text-amber-400">{selectedItems.length}</span>
            </div>
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
              <span className="text-zinc-400">OSs Afetadas:</span>
              <span className="font-bold text-blue-400">{uniqueOsCount} Ordens</span>
            </div>
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
              <span className="text-zinc-400">Valor Est. Total:</span>
              <span className="font-bold text-emerald-400 font-mono text-base">
                R$ {totalEstimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose} className="border-zinc-800 bg-zinc-900 text-zinc-300">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmGrouping}
              disabled={selectedItems.length === 0}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              ⚡ Criar Cotação Unificada ({selectedItems.length} itens)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupServiceOrderItemsModal;
