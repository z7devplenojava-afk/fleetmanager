'use client';

import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  RowSelectionState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye, Calendar, Wrench, Download, FileText, Trash2Icon, Edit3, Filter, Settings, AlertTriangle, Search, RefreshCw, BarChart3, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Interface para manutenção
interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE' | 'IMPROVEMENT' | 'OTHER';
  description: string;
  cost?: number;
  provider?: string;
  mileage?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
}

interface ManutencoesTableProps {
  data: VehicleMaintenance[];
  onRefresh: () => void;
  onView?: (maintenance: VehicleMaintenance) => void;
  onEdit?: (maintenance: VehicleMaintenance) => void;
  onDelete?: (maintenance: VehicleMaintenance) => void;
}

// Função para formatar data
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

// Função para obter cor do status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return 'bg-blue-900/20 text-blue-400 border-blue-700/30';
    case 'IN_PROGRESS': return 'bg-yellow-900/20 text-yellow-400 border-yellow-700/30';
    case 'COMPLETED': return 'bg-green-900/20 text-green-400 border-green-700/30';
    case 'CANCELLED': return 'bg-red-900/20 text-red-400 border-red-700/30';
    default: return 'bg-gray-900/20 text-gray-400 border-gray-700/30';
  }
};

// Função para obter cor da prioridade
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'LOW': return 'bg-green-900/20 text-green-400 border-green-700/30';
    case 'MEDIUM': return 'bg-blue-900/20 text-blue-400 border-blue-700/30';
    case 'HIGH': return 'bg-yellow-900/20 text-yellow-400 border-yellow-700/30';
    case 'URGENT': return 'bg-red-900/20 text-red-400 border-red-700/30';
    default: return 'bg-gray-900/20 text-gray-400 border-gray-700/30';
  }
};

// Função para obter cor do tipo
const getTypeColor = (type: string) => {
  switch (type) {
    case 'PREVENTIVE': return 'bg-blue-900/20 text-blue-400 border-blue-700/30';
    case 'CORRECTIVE': return 'bg-red-900/20 text-red-400 border-red-700/30';
    case 'PREDICTIVE': return 'bg-purple-900/20 text-purple-400 border-purple-700/30';
    case 'IMPROVEMENT': return 'bg-green-900/20 text-green-400 border-green-700/30';
    default: return 'bg-gray-900/20 text-gray-400 border-gray-700/30';
  }
};

export const createColumns = (
  onView?: (maintenance: VehicleMaintenance) => void,
  onEdit?: (maintenance: VehicleMaintenance) => void,
  onDelete?: (maintenance: VehicleMaintenance) => void
): ColumnDef<VehicleMaintenance>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
        className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Selecionar manutenção ${row.getValue('vehiclePlate')}`}
        className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'vehiclePlate',
    header: 'Placa',
    cell: ({ row }) => (
      <div className="font-mono font-semibold text-seguranca-yellow">
        {row.getValue('vehiclePlate')}
      </div>
    ),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="text-seguranca-lightgray hover:text-seguranca-yellow"
      >
        <Calendar className="mr-2 h-4 w-4" />
        Data
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-blue-400" />
        <span className="text-seguranca-lightgray font-medium">{formatDate(row.getValue('date'))}</span>
      </div>
    ),
  },
  {
    accessorKey: 'maintenanceType',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.getValue('maintenanceType') as string;
      return (
        <Badge className={getTypeColor(type)}>
          <Wrench className="mr-1 h-3 w-3" />
          {type.replace('_', ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
    cell: ({ row }) => (
      <div className="max-w-sm text-seguranca-lightgray whitespace-normal" title={row.getValue('description')}>
        {row.getValue('description')}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge className={getStatusColor(status)}>
          {status === 'SCHEDULED' && 'Agendada'}
          {status === 'IN_PROGRESS' && 'Em Andamento'}
          {status === 'COMPLETED' && 'Concluída'}
          {status === 'CANCELLED' && 'Cancelada'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'priority',
    header: 'Prioridade',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string;
      return (
        <Badge className={getPriorityColor(priority)}>
          {priority === 'LOW' && 'Baixa'}
          {priority === 'MEDIUM' && 'Média'}
          {priority === 'HIGH' && 'Alta'}
          {priority === 'URGENT' && 'Urgente'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'mileage',
    header: 'Quilometragem',
    cell: ({ row }) => {
      const mileage = row.getValue('mileage') as number;
      return (
        <div className="text-seguranca-lightgray font-mono">
          {mileage ? `${Number(mileage).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km` : 'N/A'}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row, table }) => {
      const maintenance = row.original;
      
      // Debug log para verificar se as funções estão sendo passadas
      console.log('🔍 Actions Cell - Funções disponíveis:', {
        onView: typeof onView,
        onEdit: typeof onEdit,
        onDelete: typeof onDelete,
        maintenance: maintenance.id
      });

      const handleView = () => {
        console.log('👁️ Clicou em Visualizar:', maintenance);
        onView?.(maintenance);
      };

      const handleEdit = () => {
        console.log('✏️ Clicou em Editar:', maintenance);
        onEdit?.(maintenance);
      };

      const handleDelete = () => {
        console.log('🗑️ Clicou em Excluir:', maintenance);
        onDelete?.(maintenance);
      };

      return (
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleView}
            className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
            title="Visualizar detalhes"
          >
            <Eye size={14} />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
            title="Editar"
          >
            <Pencil size={14} />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            title="Excluir"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      );
    },
  },
];

export function ManutencoesTable({ data, onRefresh, onView, onEdit, onDelete }: ManutencoesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  
  const { toast } = useToast();

  // Debug logs
  console.log('🔍 ManutencoesTable - Props recebidas:', {
    data: data?.length || 0,
    onView: typeof onView,
    onEdit: typeof onEdit,
    onDelete: typeof onDelete
  });

  const columns = React.useMemo(() => createColumns(onView, onEdit, onDelete), [onView, onEdit, onDelete]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
  });

  // Funções para ações em lote
  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum item selecionado para exclusão",
        variant: "destructive"
      });
      return;
    }

    // Set selectedForDelete and showDeleteConfirm
    setSelectedForDelete(selectedRows.map(row => row.original));
    setShowDeleteConfirm(true);
  };

  const handleBulkEdit = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    console.log('Editando itens selecionados:', selectedRows.map(row => row.original.id));
    toast({
      title: "Funcionalidade",
      description: "Edição em lote será implementada em breve",
      variant: "default"
    });
  };

  const handleExport = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const itemsToExport = selectedRows.length > 0 ? selectedRows : table.getFilteredRowModel().rows;
    console.log('Exportando itens:', itemsToExport.map(row => row.original.id));
    toast({
      title: "Funcionalidade",
      description: "Exportação será implementada em breve",
      variant: "default"
    });
  };

  const handleGenerateReport = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const itemsForReport = selectedRows.length > 0 ? selectedRows : table.getFilteredRowModel().rows;
    console.log('Gerando relatório para itens:', itemsForReport.map(row => row.original.id));
    toast({
      title: "Funcionalidade",
      description: "Relatório será implementado em breve",
      variant: "default"
    });
  };

  // State for confirmation dialog
  const [selectedForDelete, setSelectedForDelete] = useState<VehicleMaintenance[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (selectedForDelete.length === 0) return;

    setIsDeleting(true);
    try {
      const deletePromises = selectedForDelete.map(maintenance => 
        api.delete(`/api/maintenances/${maintenance.id}`)
      );
      await Promise.all(deletePromises);

      toast({
        title: "Sucesso",
        description: `${selectedForDelete.length} manutenção(ões) excluída(s) com sucesso!`,
        variant: "default"
      });

      // Clear selection and close dialog
      setSelectedForDelete([]);
      setShowDeleteConfirm(false);
      onRefresh();

    } catch (error: any) {
      console.error('❌ Erro ao excluir em lote:', error);
      
      let errorMessage = 'Erro ao excluir manutenções selecionadas';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com Estatísticas */}
      <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-seguranca-lightgray mb-2 flex items-center gap-2">
              <Settings className="h-5 w-5 text-seguranca-yellow" />
              Controle de Manutenção
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Total de manutenções:</span>
                <span className="text-seguranca-lightgray font-semibold">{data.length}</span>
              </div>
              {data.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Agendadas:</span>
                    <span className="text-blue-400 font-semibold">
                      {data.filter(m => m.status === 'SCHEDULED').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Em andamento:</span>
                    <span className="text-yellow-400 font-semibold">
                      {data.filter(m => m.status === 'IN_PROGRESS').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Concluídas:</span>
                    <span className="text-green-400 font-semibold">
                      {data.filter(m => m.status === 'COMPLETED').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Canceladas:</span>
                    <span className="text-red-400 font-semibold">
                      {data.filter(m => m.status === 'CANCELLED').length}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              <FileText size={16} className="mr-2" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
            >
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de ações em lote */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-seguranca-lightgray font-medium">
                {table.getFilteredSelectedRowModel().rows.length} manutenção(ões) selecionada(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.toggleAllPageRowsSelected(false)}
                className="border-gray-600 text-gray-400 hover:bg-gray-700 text-xs"
              >
                Limpar Seleção
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkEdit}
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              >
                <Edit3 size={16} className="mr-2" />
                Editar Selecionadas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateReport}
                className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
              >
                <FileText size={16} className="mr-2" />
                Relatório
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Trash2Icon size={16} className="mr-2" />
                Excluir Selecionadas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-seguranca-black border border-gray-600 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar manutenções..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="border-gray-600 text-gray-400 hover:bg-gray-700"
          >
            <Wrench className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-seguranca-graphite">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-gray-600 hover:bg-seguranca-graphite">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className={`text-seguranca-lightgray font-semibold ${
                      header.id === 'select' ? 'w-12' : 
                      header.id === 'vehiclePlate' ? 'w-40' : // Aumentado para Placa
                      header.id === 'date' ? 'w-32' :
                      header.id === 'maintenanceType' ? 'w-32' :
                      header.id === 'description' ? 'w-64' : // Diminuído para Descrição
                      header.id === 'status' ? 'w-32' :
                      header.id === 'priority' ? 'w-32' :
                      header.id === 'actions' ? 'w-24' : 'w-auto'
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-gray-600 hover:bg-seguranca-graphite/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className={`text-seguranca-lightgray ${
                        cell.column.id === 'select' ? 'w-12' : 
                        cell.column.id === 'vehiclePlate' ? 'w-40' : // Aumentado para Placa
                        cell.column.id === 'date' ? 'w-32' :
                        cell.column.id === 'maintenanceType' ? 'w-32' :
                        cell.column.id === 'description' ? 'w-64' : // Diminuído para Descrição
                        cell.column.id === 'status' ? 'w-32' :
                        cell.column.id === 'priority' ? 'w-32' :
                        cell.column.id === 'actions' ? 'w-24' : 'w-auto'
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🔧</span>
                    </div>
                    <p className="text-lg font-medium">Nenhuma manutenção encontrada</p>
                    <p className="text-sm">Comece registrando a primeira manutenção da frota</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between space-x-2 py-4 bg-seguranca-black border border-gray-600 rounded-lg p-4">
        <div className="flex-1 text-sm text-gray-400">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
          >
            Próximo
          </Button>
        </div>
      </div>

      {/* Rodapé com Informações Adicionais */}
      {data.length > 0 && (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total de manutenções:</span>
              <span className="text-seguranca-lightgray font-semibold text-blue-400">
                {data.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Prioridade mais alta:</span>
              <span className="text-seguranca-lightgray font-semibold">
                {(() => {
                  const priorities = data.map(m => m.priority);
                  if (priorities.includes('URGENT')) return 'Urgente';
                  if (priorities.includes('HIGH')) return 'Alta';
                  if (priorities.includes('MEDIUM')) return 'Média';
                  return 'Baixa';
                })()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Última atualização:</span>
              <span className="text-seguranca-lightgray font-semibold">
                {new Date().toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-seguranca-black border border-gray-600 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Tem certeza que deseja excluir <span className="font-semibold text-red-400">{selectedForDelete.length}</span> manutenção(ões)? 
              <br />
              <span className="text-red-400 font-medium">Esta ação não pode ser desfeita.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)} 
              disabled={isDeleting}
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
