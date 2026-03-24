import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Trash2Icon, Edit3, Download, FileText, Eye } from 'lucide-react';
import { FuelRecord } from '@/types/fleet';
import { format } from 'date-fns';
import AbastecimentoEditModal from './AbastecimentoEditModal';
import AbastecimentoDeleteDialog from './AbastecimentoDeleteDialog';
import AbastecimentoReportModal from './AbastecimentoReportModal';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import fleetService from '@/services/fleetService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  status: string;
}

interface AbastecimentosTableProps {
  abastecimentos: FuelRecord[];
  veiculos: Veiculo[];
  onRefresh: () => void;
}

export const AbastecimentosTable: React.FC<AbastecimentosTableProps> = ({
  abastecimentos,
  veiculos,
  onRefresh
}) => {
  const [editingAbastecimento, setEditingAbastecimento] = useState<FuelRecord | null>(null);
  const [deletingAbastecimento, setDeletingAbastecimento] = useState<FuelRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewingAbastecimento, setViewingAbastecimento] = useState<FuelRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Estados para seleção
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { toast } = useToast();

  // Debug: Log dos dados recebidos
  console.log('🔍 AbastecimentosTable - Dados recebidos:', abastecimentos);
  if (abastecimentos && abastecimentos.length > 0) {
    console.log('🔍 AbastecimentosTable - Primeiro abastecimento:', abastecimentos[0]);
    console.log('🔍 AbastecimentosTable - Campos de quilometragem:', {
      mileage: abastecimentos[0].mileage,
      initialMileage: abastecimentos[0].initialMileage,
      finalMileage: abastecimentos[0].finalMileage,
      fuelType: abastecimentos[0].fuelType
    });
  }

  // Funções de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(abastecimentos.map(item => item.id));
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
    setSelectAll(newSelected.size === abastecimentos.length);
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

    // Confirmação antes de excluir
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.size} abastecimento(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const selectedIds = Array.from(selectedItems);
      console.log('🗑️ Excluindo abastecimentos:', selectedIds);

      const response = await api.delete('/fuel-records/batch', {
        data: selectedIds
      });

      console.log('✅ Resposta da exclusão em lote:', response.data);

      toast({
        title: "Sucesso",
        description: `${response.data.deletedCount} abastecimento(s) excluído(s) com sucesso!`,
        variant: "default"
      });

      // Limpar seleção e atualizar lista
      setSelectedItems(new Set());
      setSelectAll(false);
      onRefresh();

    } catch (error: unknown) {
      console.error('❌ Erro ao excluir em lote:', error);

      let errorMessage = 'Erro ao excluir abastecimentos';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleBulkEdit = () => {
    // Implementar edição em lote
    console.log('Editando itens selecionados:', Array.from(selectedItems));
    // Aqui você pode implementar a lógica de edição em lote
  };

  const handleExport = () => {
    // Implementar exportação dos itens selecionados
    console.log('Exportando itens selecionados:', Array.from(selectedItems));
    // Aqui você pode implementar a lógica de exportação
  };

  const handleGenerateReport = () => {
    setIsReportModalOpen(true);
  };

  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfFilters, setPdfFilters] = useState({
    startDate: '',
    endDate: '',
    vehicleId: '',
    fuelType: ''
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleGeneratePDF = async () => {
    if (!pdfFilters.startDate || !pdfFilters.endDate) {
      toast({
        title: "Filtros obrigatórios",
        description: "Por favor, selecione as datas de início e fim.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const filters: any = {
        startDate: pdfFilters.startDate,
        endDate: pdfFilters.endDate
      };
      
      if (pdfFilters.vehicleId && pdfFilters.vehicleId !== 'all') {
        filters.vehicleId = pdfFilters.vehicleId;
      }
      
      if (pdfFilters.fuelType && pdfFilters.fuelType !== 'all') {
        filters.fuelType = pdfFilters.fuelType;
      }

      const blob = await fleetService.exportFuelRecordsPDF(filters);
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Definir nome do arquivo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `relatorio_abastecimentos_${timestamp}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Relatório gerado com sucesso!",
        description: "O relatório de abastecimentos foi baixado com sucesso.",
        variant: "default",
      });
      
      setIsPDFModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao gerar relatório PDF:', error);
      const errorMessage = error?.message || 'Ocorreu um erro ao gerar o relatório PDF. Tente novamente.';
      toast({
        title: "Erro ao gerar relatório",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEdit = (abastecimento: FuelRecord) => {
    console.log('Botão de edição clicado para:', abastecimento);
    setEditingAbastecimento(abastecimento);
    setIsEditModalOpen(true);
    console.log('Estado do modal de edição:', { editingAbastecimento: abastecimento, isEditModalOpen: true });
  };

  const handleDelete = (abastecimento: FuelRecord) => {
    setDeletingAbastecimento(abastecimento);
    setIsDeleteDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingAbastecimento(null);
    onRefresh();
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    setDeletingAbastecimento(null);
    onRefresh();
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setEditingAbastecimento(null);
  };

  const handleViewClose = () => {
    setIsViewModalOpen(false);
    setViewingAbastecimento(null);
  };

  const handleDeleteClose = () => {
    setIsDeleteDialogOpen(false);
    setDeletingAbastecimento(null);
  };

  const handleView = (abastecimento: FuelRecord) => {
    console.log('🔍 Visualizando abastecimento:', abastecimento);
    setViewingAbastecimento(abastecimento);
    setIsViewModalOpen(true);
  };

  return (
    <>
      {/* Cabeçalho com Estatísticas */}
      <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-seguranca-lightgray mb-2">
              Controle de Abastecimento
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Total de registros:</span>
                <span className="text-seguranca-lightgray font-semibold">{abastecimentos.length}</span>
              </div>
              {abastecimentos.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Valor total:</span>
                    <span className="text-green-400 font-semibold">
                      R$ {abastecimentos.reduce((sum, item) => sum + (item.cost || 0), 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Litros totais:</span>
                    <span className="text-blue-400 font-semibold">
                      {abastecimentos.reduce((sum, item) => sum + (item.quantity || 0), 0).toFixed(2)} L
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
              onClick={() => setIsPDFModalOpen(true)}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <FileText size={16} className="mr-2" />
              Gerar Relatório PDF
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
      {selectedItems.size > 0 && (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-seguranca-lightgray font-medium">
                {selectedItems.size} item(s) selecionado(s)
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

      <div className="w-full overflow-auto bg-seguranca-black border border-gray-600 rounded-lg">
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
              <TableHead className="text-seguranca-lightgray font-semibold">Data</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Veículo</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Motorista</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Combustível</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Litros</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Valor/Litro</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Valor Total</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Posto</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abastecimentos.map((abastecimento) => (
              <TableRow
                key={abastecimento.id}
                className="hover:bg-seguranca-graphite/50 transition-colors border-b border-gray-700"
              >
                <TableCell className="w-12 text-center">
                  <Checkbox
                    checked={selectedItems.has(abastecimento.id)}
                    onCheckedChange={(checked) => handleSelectItem(abastecimento.id, checked as boolean)}
                    aria-label={`Selecionar abastecimento ${abastecimento.vehiclePlate}`}
                    className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                  />
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <div className="font-medium">
                    {(() => {
                      if (!abastecimento.date) return 'Data não informada';
                      try {
                        const date = new Date(abastecimento.date);
                        if (isNaN(date.getTime())) return 'Data inválida';
                        return format(date, 'dd/MM/yyyy');
                      } catch (error) {
                        console.warn('Erro ao formatar data:', abastecimento.date, error);
                        return 'Data inválida';
                      }
                    })()}
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <div className="font-mono font-semibold text-seguranca-yellow">
                    {abastecimento.vehiclePlate}
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  {abastecimento.driver ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{abastecimento.driver.name}</span>
                      <span className="text-xs text-gray-400">{abastecimento.driver.document}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Não informado</span>
                  )}
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  {abastecimento.fuelType ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-700/30">
                      {abastecimento.fuelType.toLowerCase() === 'gasoline' ? 'Gasolina' :
                        abastecimento.fuelType.toLowerCase() === 'ethanol' ? 'Etanol' :
                          abastecimento.fuelType.toLowerCase() === 'diesel' ? 'Diesel' :
                            abastecimento.fuelType.toLowerCase() === 'flex' ? 'Flex' :
                              abastecimento.fuelType}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-blue-400">
                    {abastecimento.quantity ? abastecimento.quantity.toFixed(2) + ' L' : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-green-400">
                    {abastecimento.quantity && abastecimento.cost ?
                      'R$ ' + (abastecimento.cost / abastecimento.quantity).toFixed(2).replace('.', ',') : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-seguranca-yellow">
                    {abastecimento.cost ? 'R$ ' + abastecimento.cost.toFixed(2).replace('.', ',') : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-seguranca-lightgray max-w-[200px]">
                  <div className="truncate" title={abastecimento.station || 'Não informado'}>
                    {abastecimento.station || (
                      <span className="text-gray-400 italic">Não informado</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(abastecimento)}
                      className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                      title="Visualizar detalhes"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(abastecimento)}
                      className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(abastecimento)}
                      className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {abastecimentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⛽</span>
                    </div>
                    <p className="text-lg font-medium">Nenhum abastecimento encontrado</p>
                    <p className="text-sm">Comece registrando o primeiro abastecimento</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé com Informações Adicionais */}
      {abastecimentos.length > 0 && (
        <div className="mt-4 bg-seguranca-black border border-gray-600 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Média por abastecimento:</span>
              <span className="text-seguranca-lightgray font-semibold">
                R$ {(abastecimentos.reduce((sum, item) => sum + (item.cost || 0), 0) / abastecimentos.length).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Média de litros:</span>
              <span className="text-seguranca-lightgray font-semibold">
                {(abastecimentos.reduce((sum, item) => sum + (item.quantity || 0), 0) / abastecimentos.length).toFixed(2)} L
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

      {/* Modal de Edição */}
      <AbastecimentoEditModal
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        abastecimento={editingAbastecimento}
        veiculos={veiculos}
      />

      {/* Modal de Visualização */}
      {viewingAbastecimento && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isViewModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200`}>
          <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
              <h3 className="text-xl font-semibold text-seguranca-lightgray flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Detalhes do Abastecimento
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewClose}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Cabeçalho com Informações Principais */}
              <div className="bg-seguranca-black/30 rounded-lg p-4 border border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🚗</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Veículo</p>
                      <p className="text-lg font-semibold text-seguranca-yellow">{viewingAbastecimento.vehiclePlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⛽</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Combustível</p>
                      <p className="text-lg font-semibold text-blue-400 capitalize">
                        {viewingAbastecimento.fuelType?.toLowerCase() === 'gasoline' ? 'Gasolina' :
                          viewingAbastecimento.fuelType?.toLowerCase() === 'ethanol' ? 'Etanol' :
                            viewingAbastecimento.fuelType?.toLowerCase() === 'diesel' ? 'Diesel' :
                              viewingAbastecimento.fuelType?.toLowerCase() === 'flex' ? 'Flex' :
                                viewingAbastecimento.fuelType || 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Detalhadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
                  <div className="bg-seguranca-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-seguranca-yellow mb-3 uppercase tracking-wide">Informações Básicas</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Data:</span>
                        <span className="text-seguranca-lightgray font-medium">{format(new Date(viewingAbastecimento.date), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Motorista:</span>
                        <span className="text-seguranca-lightgray font-medium">
                          {(() => {
                            console.log('🔍 Motorista:', viewingAbastecimento.driver);
                            if (viewingAbastecimento.driver && viewingAbastecimento.driver.name) {
                              const driverName = viewingAbastecimento.driver.name.trim();
                              const driverDoc = viewingAbastecimento.driver.document ? viewingAbastecimento.driver.document.trim() : '';
                              if (driverDoc) {
                                return `${driverName} (${driverDoc})`;
                              }
                              return driverName;
                            }
                            return <span className="text-gray-400 italic">Não informado</span>;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Posto:</span>
                        <span className="text-seguranca-lightgray font-medium">{viewingAbastecimento.station || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-seguranca-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wide">Quilometragem</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Km Anterior:</span>
                        <span className="text-seguranca-lightgray font-mono">
                          {(() => {
                            // Buscar o último abastecimento do mesmo veículo
                            const lastFuelRecord = abastecimentos
                              .filter(record => record.vehicleId === viewingAbastecimento.vehicleId && record.id !== viewingAbastecimento.id)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                            if (lastFuelRecord && lastFuelRecord.mileage !== null && lastFuelRecord.mileage !== undefined && lastFuelRecord.mileage > 0) {
                              return lastFuelRecord.mileage.toLocaleString() + ' km';
                            }
                            return 'Primeiro abastecimento';
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Quilometragem:</span>
                        <span className="text-seguranca-lightgray font-mono">
                          {(() => {
                            console.log('🔍 Quilometragem:', viewingAbastecimento.mileage, 'tipo:', typeof viewingAbastecimento.mileage);
                            if (viewingAbastecimento.mileage !== null && viewingAbastecimento.mileage !== undefined && viewingAbastecimento.mileage > 0) {
                              return viewingAbastecimento.mileage.toLocaleString() + ' km';
                            }
                            return 'Não informado';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4">
                  <div className="bg-seguranca-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wide">Dados Financeiros</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Litros:</span>
                        <span className="text-seguranca-lightgray font-mono font-semibold text-blue-400">
                          {viewingAbastecimento.quantity ? viewingAbastecimento.quantity.toFixed(2) + ' L' : 'Não informado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Valor por Litro:</span>
                        <span className="text-seguranca-lightgray font-mono font-semibold text-green-400">
                          {viewingAbastecimento.quantity && viewingAbastecimento.cost ?
                            'R$ ' + (viewingAbastecimento.cost / viewingAbastecimento.quantity).toFixed(2).replace('.', ',') : 'Não informado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Valor Total:</span>
                        <span className="text-seguranca-lightgray font-mono font-semibold text-seguranca-yellow text-lg">
                          {viewingAbastecimento.cost ? 'R$ ' + viewingAbastecimento.cost.toFixed(2).replace('.', ',') : 'Não informado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-seguranca-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wide">Informações Adicionais</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Observações:</span>
                        <span className="text-seguranca-lightgray font-medium max-w-[200px] text-right">
                          {viewingAbastecimento.notes || 'Nenhuma observação'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Data de Criação:</span>
                        <span className="text-seguranca-lightgray font-medium">
                          {(() => {
                            if (!viewingAbastecimento.createdAt) return 'Não informado';
                            try {
                              const date = new Date(viewingAbastecimento.createdAt);
                              if (isNaN(date.getTime())) return 'Data inválida';
                              return format(date, 'dd/MM/yyyy HH:mm');
                            } catch (error) {
                              console.warn('Erro ao formatar data:', viewingAbastecimento.createdAt, error);
                              return 'Data inválida';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-600">
              <Button
                variant="outline"
                onClick={() => {
                  handleViewClose();
                  handleEdit(viewingAbastecimento);
                }}
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                title="Editar abastecimento"
              >
                <Edit size={16} className="mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleViewClose();
                  handleDelete(viewingAbastecimento);
                }}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                title="Excluir abastecimento"
              >
                <Trash2 size={16} className="mr-2" />
                Excluir
              </Button>
              <Button
                variant="outline"
                onClick={handleViewClose}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Exclusão */}
      <AbastecimentoDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteClose}
        onSuccess={handleDeleteSuccess}
        abastecimento={deletingAbastecimento}
      />

      {/* Modal de Relatório */}
      <AbastecimentoReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        veiculos={veiculos}
      />

      {/* Modal de Geração de PDF */}
      <Dialog open={isPDFModalOpen} onOpenChange={setIsPDFModalOpen}>
        <DialogContent className="sm:max-w-md bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              Gerar Relatório PDF de Abastecimentos
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Data Início</Label>
              <Input
                type="date"
                value={pdfFilters.startDate}
                onChange={(e) => setPdfFilters({ ...pdfFilters, startDate: e.target.value })}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Data Fim</Label>
              <Input
                type="date"
                value={pdfFilters.endDate}
                onChange={(e) => setPdfFilters({ ...pdfFilters, endDate: e.target.value })}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Veículo</Label>
              <Select 
                value={pdfFilters.vehicleId} 
                onValueChange={(value) => setPdfFilters({ ...pdfFilters, vehicleId: value })}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {veiculos.map((veiculo) => (
                    <SelectItem key={veiculo.id} value={veiculo.id}>
                      {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Combustível</Label>
              <Select 
                value={pdfFilters.fuelType} 
                onValueChange={(value) => setPdfFilters({ ...pdfFilters, fuelType: value })}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todos os combustíveis" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value="all">Todos os combustíveis</SelectItem>
                  <SelectItem value="GASOLINE">Gasolina</SelectItem>
                  <SelectItem value="ETHANOL">Etanol</SelectItem>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                  <SelectItem value="FLEX">Flex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsPDFModalOpen(false)}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AbastecimentosTable;
