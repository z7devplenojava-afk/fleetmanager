import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, UserPlus, Edit, Trash2, Eye, Download, FileText, Trash2Icon, Edit3, Users, UserCheck, UserX } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Driver } from '@/types/driver';
import { useToast } from '@/hooks/use-toast';

interface MotoristasTableProps {
  drivers: Driver[];
  onAdd: () => void;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
  onView?: (driver: Driver) => void;
  isLoading?: boolean;
}

const MotoristasTable: React.FC<MotoristasTableProps> = ({ 
  drivers, 
  onAdd, 
  onEdit, 
  onDelete, 
  onView,
  isLoading
}) => {
  // Estados para seleção em lote
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const { toast } = useToast();

  const getStatusVariant = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
      case 'ACTIVE':
        return 'default'; // Verde para ativo
      case 'INATIVO':
      case 'INACTIVE':
        return 'destructive'; // Vermelho para inativo
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
      case 'ACTIVE':
        return 'Ativo';
      case 'INATIVO':
      case 'INACTIVE':
        return 'Inativo';
      default:
        return 'Desconhecido';
    }
  };

  // Funções de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(drivers.map(item => item.id));
      setSelectedItems(allIds);
      setSelectAll(true);
    } else {
      setSelectedItems(new Set());
      setSelectAll(false);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === drivers.length);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum item selecionado para exclusão",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.size} motorista(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const selectedIds = Array.from(selectedItems);
      console.log('🗑️ Excluindo motoristas:', selectedIds);
      
      // Aqui você implementaria a lógica de exclusão em lote
      toast({
        title: "Sucesso",
        description: `${selectedItems.size} motorista(s) marcado(s) para exclusão`,
        variant: "default"
      });

      // Limpar seleção
      setSelectedItems(new Set());
      setSelectAll(false);
      
    } catch (error: any) {
      console.error('❌ Erro ao excluir em lote:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir motoristas selecionados",
        variant: "destructive"
      });
    }
  };

  const handleBulkEdit = () => {
    console.log('Editando itens selecionados:', Array.from(selectedItems));
    toast({
      title: "Funcionalidade",
      description: "Edição em lote será implementada em breve",
      variant: "default"
    });
  };

  const handleExport = () => {
    const itemsToExport = selectedItems.size > 0 ? selectedItems : new Set(drivers.map(d => d.id));
    console.log('Exportando itens:', Array.from(itemsToExport));
    toast({
      title: "Funcionalidade",
      description: "Exportação será implementada em breve",
      variant: "default"
    });
  };

  const handleGenerateReport = () => {
    const itemsForReport = selectedItems.size > 0 ? selectedItems : new Set(drivers.map(d => d.id));
    console.log('Gerando relatório para itens:', Array.from(itemsForReport));
    toast({
      title: "Funcionalidade",
      description: "Relatório será implementado em breve",
      variant: "default"
    });
  };
  
  return (
    <div className="space-y-4">
      {/* Cabeçalho com Estatísticas */}
      <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-seguranca-lightgray mb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-seguranca-yellow" />
              Motoristas da Frota
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Total de motoristas:</span>
                <span className="text-seguranca-lightgray font-semibold">{drivers.length}</span>
              </div>
              {drivers.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Ativos:</span>
                    <span className="text-green-400 font-semibold">
                      {drivers.filter(d => d.status?.toUpperCase() === 'ATIVO' || d.status?.toUpperCase() === 'ACTIVE').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Inativos:</span>
                    <span className="text-red-400 font-semibold">
                      {drivers.filter(d => d.status?.toUpperCase() === 'INATIVO' || d.status?.toUpperCase() === 'INACTIVE').length}
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
            <Button 
              onClick={onAdd} 
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white transition-colors"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Motorista
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de ações em lote */}
      {selectedItems.size > 0 && (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-seguranca-lightgray font-medium">
                {selectedItems.size} motorista(s) selecionado(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedItems(new Set());
                  setSelectAll(false);
                }}
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
                Editar Selecionados
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
                Excluir Selecionados
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-seguranca-graphite hover:bg-seguranca-graphite">
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                  className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                />
              </TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Nome</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">CNH</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Status</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-seguranca-yellow"></div>
                    <span>Carregando motoristas...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👨‍💼</span>
                    </div>
                    <p className="text-lg font-medium">Nenhum motorista encontrado</p>
                    <p className="text-sm">Comece registrando o primeiro motorista da frota</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow 
                  key={driver.id} 
                  className="border-gray-600 hover:bg-seguranca-graphite/50 transition-colors"
                >
                  <TableCell className="w-12 text-center">
                    <Checkbox
                      checked={selectedItems.has(driver.id)}
                      onCheckedChange={(checked) => handleSelectItem(driver.id, checked as boolean)}
                      aria-label={`Selecionar motorista ${driver.name}`}
                      className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                    />
                  </TableCell>
                  <TableCell className="text-seguranca-lightgray">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-seguranca-yellow/20 rounded-full flex items-center justify-center">
                        <span className="text-seguranca-yellow font-semibold text-sm">
                          {driver.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <span className="font-medium">{driver.name || 'Nome não informado'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    <span className="font-mono font-semibold text-blue-400">
                      {driver.licenseNumber || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={getStatusVariant(driver.status)}
                      className={`font-medium ${
                        driver.status?.toUpperCase() === 'ATIVO' || driver.status?.toUpperCase() === 'ACTIVE'
                          ? 'bg-green-900/20 text-green-400 border-green-700/30'
                          : 'bg-red-900/20 text-red-400 border-red-700/30'
                      }`}
                    >
                      {driver.status?.toUpperCase() === 'ATIVO' || driver.status?.toUpperCase() === 'ACTIVE' ? (
                        <UserCheck className="mr-1 h-3 w-3" />
                      ) : (
                        <UserX className="mr-1 h-3 w-3" />
                      )}
                      {getStatusText(driver.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {onView && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onView(driver)}
                          className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                          title="Visualizar detalhes"
                        >
                          <Eye size={14} />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEdit(driver)}
                        className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                        title="Editar"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDelete(driver)}
                        className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé com Informações Adicionais */}
      {drivers.length > 0 && (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Motoristas com CNH:</span>
              <span className="text-seguranca-lightgray font-semibold text-blue-400">
                {drivers.filter(d => d.licenseNumber && d.licenseNumber.trim() !== '').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Motoristas sem CNH:</span>
              <span className="text-seguranca-lightgray font-semibold text-yellow-400">
                {drivers.filter(d => !d.licenseNumber || d.licenseNumber.trim() === '').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Taxa de ativos:</span>
              <span className="text-seguranca-lightgray font-semibold">
                {drivers.length > 0 
                  ? `${Math.round((drivers.filter(d => d.status?.toUpperCase() === 'ATIVO' || d.status?.toUpperCase() === 'ACTIVE').length / drivers.length) * 100)}%`
                  : '0%'
                }
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
    </div>
  );
};

export default MotoristasTable; 