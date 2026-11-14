import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Edit, Trash2, Eye, Download, FileText, Users, UserCheck, UserX, BriefcaseBusiness, CheckSquare } from 'lucide-react';
import { Driver } from '@/types/driver';
import { DriverBatchDeleteDialog } from './DriverBatchDeleteDialog';

interface MotoristasTableProps {
  drivers: Driver[];
  onAdd: () => void;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
  onView?: (driver: Driver) => void;
  onDeleteBatch?: (drivers: Driver[]) => void;
  isLoading?: boolean;
}

const MotoristasTable: React.FC<MotoristasTableProps> = ({
  drivers,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onDeleteBatch,
  isLoading
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  // Motoristas que podem ser excluídos (não são somente leitura de funcionário)
  const deletableDrivers = drivers.filter(d => d.source !== 'EMPLOYEE');
  const isAllSelected = deletableDrivers.length > 0 && deletableDrivers.every(d => selectedIds.includes(d.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(deletableDrivers.map(d => d.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmBatchDelete = async (selectedList: Driver[]) => {
    if (onDeleteBatch) {
      try {
        setIsDeletingBatch(true);
        await onDeleteBatch(selectedList);
        setSelectedIds([]);
        setIsBatchDeleteDialogOpen(false);
      } finally {
        setIsDeletingBatch(false);
      }
    }
  };

  const getStatusVariant = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
      case 'ACTIVE':
        return 'default';
      case 'INATIVO':
      case 'INACTIVE':
        return 'destructive';
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

  const selectedDrivers = drivers.filter(d => selectedIds.includes(d.id));

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
              onClick={() => console.log('Exportar motoristas (não implementado)')}
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

      {/* Barra de Ação em Lote quando houver motoristas selecionados */}
      {selectedIds.length > 0 && (
        <div className="bg-red-950/40 border border-red-700/60 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white">
                {selectedIds.length === 1 ? '1 motorista selecionado' : `${selectedIds.length} motoristas selecionados`}
              </span>
              <p className="text-xs text-gray-400">Pronto para exclusão em lote</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs h-8"
            >
              Desmarcar todos
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsBatchDeleteDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8 shadow-lg flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={14} />
              Excluir Selecionados ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}

      <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-seguranca-graphite hover:bg-seguranca-graphite">
              <TableHead className="w-12 text-center">
                {deletableDrivers.length > 0 && (
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos os motoristas"
                    className="border-gray-400 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow data-[state=checked]:text-black"
                  />
                )}
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
              drivers.map((driver) => {
                const isSelected = selectedIds.includes(driver.id);
                const isEmployeeOnly = driver.source === 'EMPLOYEE';

                return (
                  <TableRow
                    key={driver.id}
                    className={`border-gray-600 transition-colors ${
                      isSelected
                        ? 'bg-red-950/20 hover:bg-red-950/30'
                        : 'hover:bg-seguranca-graphite/50'
                    }`}
                  >
                    <TableCell className="w-12 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        disabled={isEmployeeOnly}
                        onCheckedChange={() => toggleSelectOne(driver.id)}
                        aria-label={`Selecionar ${driver.name}`}
                        className={`border-gray-400 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow data-[state=checked]:text-black ${
                          isEmployeeOnly ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
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
                        {driver.source === 'EMPLOYEE' && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-blue-500/50 text-blue-400 bg-blue-500/10 font-medium"
                            title="Funcionário com CNH cadastrada"
                          >
                            <BriefcaseBusiness className="mr-1 h-3 w-3" />
                            Funcionário
                          </Badge>
                        )}
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
                        className={`font-medium ${driver.status?.toUpperCase() === 'ATIVO' || driver.status?.toUpperCase() === 'ACTIVE'
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
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {onView && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onView(driver);
                            }}
                            className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white cursor-pointer"
                            title="Visualizar detalhes"
                          >
                            <Eye size={14} />
                          </Button>
                        )}
                        {driver.source === 'EMPLOYEE' ? (
                          <span
                            className="text-[10px] text-gray-500 border border-gray-700 rounded px-1.5 py-1"
                            title="Registro originado do cadastro de funcionários"
                          >
                            Somente leitura
                          </span>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onEdit(driver);
                              }}
                              className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white cursor-pointer"
                              title="Editar"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof onDelete === 'function') {
                                  onDelete(driver);
                                }
                              }}
                              className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de confirmação de exclusão em lote */}
      <DriverBatchDeleteDialog
        isOpen={isBatchDeleteDialogOpen}
        onClose={() => setIsBatchDeleteDialogOpen(false)}
        drivers={selectedDrivers}
        onConfirm={handleConfirmBatchDelete}
        isDeleting={isDeletingBatch}
      />

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
