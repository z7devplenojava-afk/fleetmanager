import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Eye, Download, Trash2Icon, Edit3 } from 'lucide-react';
import VeiculoDeleteDialog from './VeiculoDeleteDialog';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '@/config/environment';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import * as XLSX from 'xlsx';

interface Veiculo {
  id: string; // UUID
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  combustivel: string;
  quilometragem?: number;
  quilometragemInicial?: number; // This field was later removed from display
  status: string;
  data_aquisicao?: string;
  valor_aquisicao?: number;
  photos?: string; // URLs das fotos separadas por vírgula
  capacidade?: number; // Adicionado para armazenar capacidade
  observacoes?: string; // Adicionado para armazenar observações
}

interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  maintenanceType: string;
  description: string;
  cost?: number;
  provider?: string;
  mileage?: number;
  status: string;
  priority: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface VeiculosTableProps {
  veiculos: Veiculo[];
  searchTerm: string;
  maintenances?: VehicleMaintenance[];
  onRefresh: () => void;
  onEdit: (veiculo: Veiculo) => void;
  onDelete: (veiculo: Veiculo) => void;
  onView: (veiculo: Veiculo) => void;
  onViewMaintenance?: (maintenance: VehicleMaintenance) => void;
}

const VeiculosTable: React.FC<VeiculosTableProps> = ({ veiculos, searchTerm, maintenances, onRefresh, onEdit, onDelete, onView, onViewMaintenance }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);

  // Estados para seleção em lote
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Função para verificar se um veículo está em manutenção
  const getVehicleMaintenance = (vehicleId: string): VehicleMaintenance | null => {
    if (!maintenances) return null;
    return maintenances.find(m => m.vehicleId === vehicleId && m.status === 'IN_PROGRESS') || null;
  };

  // Função para verificar se um veículo está em manutenção
  const isVehicleInMaintenance = (vehicleId: string): boolean => {
    return getVehicleMaintenance(vehicleId) !== null;
  };
  const [selectAll, setSelectAll] = useState(false);

  // Estados para visualização
  const [viewingVeiculo, setViewingVeiculo] = useState<Veiculo | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { toast } = useToast();

  // Debug dos estados do modal
  useEffect(() => {
    console.log('🔍 Estados do modal - isViewModalOpen:', isViewModalOpen, 'viewingVeiculo:', viewingVeiculo);
  }, [isViewModalOpen, viewingVeiculo]);

  const filteredVeiculos = veiculos.filter(veiculo =>
    veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funções de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredVeiculos.map(item => item.id));
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
    setSelectAll(newSelected.size === filteredVeiculos.length);
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
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.size} veículo(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const selectedIds = Array.from(selectedItems);
      console.log('🗑️ Excluindo veículos:', selectedIds);

      // Aqui você implementaria a lógica de exclusão em lote
      // Por enquanto, vou apenas mostrar um toast de sucesso
      toast({
        title: "Sucesso",
        description: `${selectedItems.size} veículo(s) marcado(s) para exclusão`,
        variant: "default"
      });

      // Limpar seleção e atualizar lista
      setSelectedItems(new Set());
      setSelectAll(false);
      onRefresh();

    } catch (error: any) {
      console.error('❌ Erro ao excluir em lote:', error);

      let errorMessage = 'Erro ao excluir veículos';
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
    toast({
      title: "Funcionalidade",
      description: "Edição em lote será implementada em breve",
      variant: "default"
    });
  };

  const handleExport = () => {
    try {
      // Determinar quais veículos exportar (selecionados ou todos)
      const veiculosParaExportar = selectedItems.size > 0
        ? veiculos.filter(v => selectedItems.has(v.id))
        : filteredVeiculos;

      if (veiculosParaExportar.length === 0) {
        toast({
          title: "Nenhum veículo para exportar",
          description: selectedItems.size > 0
            ? "Selecione pelo menos um veículo para exportar"
            : "Não há veículos para exportar",
          variant: "default"
        });
        return;
      }

      // Preparar dados para exportação
      const dadosExportacao = veiculosParaExportar.map(veiculo => ({
        'Placa': veiculo.placa,
        'Marca': veiculo.marca,
        'Modelo': veiculo.modelo,
        'Ano': veiculo.ano,
        'Cor': veiculo.cor || 'N/A',
        'Combustível': veiculo.combustivel,
        'Quilometragem': veiculo.quilometragem ? `${veiculo.quilometragem.toLocaleString('pt-BR')} km` : 'N/A',
        'Status': veiculo.status,
        'Capacidade': veiculo.capacidade || 'N/A',
        'Data de Aquisição': veiculo.data_aquisicao ? new Date(veiculo.data_aquisicao).toLocaleDateString('pt-BR') : 'N/A',
        'Valor de Aquisição': veiculo.valor_aquisicao ? `R$ ${veiculo.valor_aquisicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A',
        'Observações': veiculo.observacoes || ''
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExportacao);

      // Configurar larguras das colunas
      const colWidths = [
        { wch: 12 }, // Placa
        { wch: 15 }, // Marca
        { wch: 20 }, // Modelo
        { wch: 8 },  // Ano
        { wch: 12 }, // Cor
        { wch: 12 }, // Combustível
        { wch: 15 }, // Quilometragem
        { wch: 12 }, // Status
        { wch: 10 }, // Capacidade
        { wch: 18 }, // Data de Aquisição
        { wch: 18 }, // Valor de Aquisição
        { wch: 30 }  // Observações
      ];
      ws['!cols'] = colWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Veículos');

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `veiculos_${timestamp}.xlsx`;

      // Salvar arquivo
      XLSX.writeFile(wb, filename);

      toast({
        title: "Exportação realizada com sucesso!",
        description: `${veiculosParaExportar.length} veículo(s) exportado(s) para ${filename}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao exportar veículos:', error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar os veículos. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateReport = () => {
    // Implementar geração de relatório
    console.log('Gerando relatório para itens selecionados:', Array.from(selectedItems));
    toast({
      title: "Funcionalidade",
      description: "Relatório será implementado em breve",
      variant: "default"
    });
  };

  const handleDelete = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (veiculo: Veiculo) => {
    onEdit(veiculo);
  };

  const handleView = (veiculo: Veiculo) => {
    console.log('🔍 handleView chamado com veículo:', veiculo);
    setViewingVeiculo(veiculo);
    setIsViewModalOpen(true);
    console.log('🔍 Estados definidos - viewingVeiculo:', veiculo, 'isViewModalOpen: true');
  };

  const handleViewClose = () => {
    console.log('🔍 handleViewClose chamado');
    setIsViewModalOpen(false);
    setViewingVeiculo(null);
    console.log('🔍 Estados limpos - isViewModalOpen: false, viewingVeiculo: null');
  };

  const handleDeleteSuccess = () => {
    onRefresh();
    setIsDeleteDialogOpen(false);
    setSelectedVeiculo(null);
  };

  const getStatusBadge = (status: string, vehicleId?: string) => {
    const statusLower = status.toLowerCase();

    // Verificar se o veículo está em manutenção
    if (vehicleId && isVehicleInMaintenance(vehicleId)) {
      const maintenance = getVehicleMaintenance(vehicleId);
      return (
        <div className="flex flex-col items-center gap-1">
          <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
            Em Manutenção
          </Badge>
          {maintenance && onViewMaintenance && (
            <button
              onClick={() => onViewMaintenance(maintenance)}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Ver Manutenção
            </button>
          )}
        </div>
      );
    }

    if (statusLower === 'ativo' || statusLower === 'active') {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          Ativo
        </Badge>
      );
    } else if (statusLower === 'inativo' || statusLower === 'inactive') {
      return (
        <Badge variant="destructive">
          Inativo
        </Badge>
      );
    } else if (statusLower === 'manutencao' || statusLower === 'maintenance') {
      return (
        <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white">
          Manutenção
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }
  };

  return (
    <>
      {/* Cabeçalho com Estatísticas */}
      <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-seguranca-lightgray mb-2">
              Veículos da Frota
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Total de veículos:</span>
                <span className="text-seguranca-lightgray font-semibold">{filteredVeiculos.length}</span>
              </div>
              {filteredVeiculos.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Ativos:</span>
                    <span className="text-green-400 font-semibold">
                      {filteredVeiculos.filter(v => v.status.toLowerCase() === 'ativo' || v.status.toLowerCase() === 'active').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Em manutenção:</span>
                    <span className="text-yellow-400 font-semibold">
                      {filteredVeiculos.filter(v => v.status.toLowerCase() === 'manutencao' || v.status.toLowerCase() === 'maintenance').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Inativos:</span>
                    <span className="text-red-400 font-semibold">
                      {filteredVeiculos.filter(v => v.status.toLowerCase() === 'inativo' || v.status.toLowerCase() === 'inactive').length}
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
                {selectedItems.size} veículo(s) selecionado(s)
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
                <Edit3 size={16} className="mr-2" />
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
              <TableHead className="text-seguranca-lightgray font-semibold">Placa</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Marca/Modelo</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Ano</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Combustível</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Quilometragem</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Status</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVeiculos.map((veiculo) => (
              <TableRow
                key={veiculo.id}
                className="hover:bg-seguranca-graphite/50 transition-colors border-b border-gray-700"
              >
                <TableCell className="w-12 text-center">
                  <Checkbox
                    checked={selectedItems.has(veiculo.id)}
                    onCheckedChange={(checked) => handleSelectItem(veiculo.id, checked as boolean)}
                    aria-label={`Selecionar veículo ${veiculo.placa}`}
                    className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                  />
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <div className="font-mono font-semibold text-seguranca-yellow text-lg">
                    {veiculo.placa}
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <div className="flex flex-col">
                    <span className="font-semibold">{veiculo.marca}</span>
                    <span className="text-sm text-gray-400">{veiculo.modelo}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-blue-400">
                    {veiculo.ano}
                  </span>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-700/30">
                    {veiculo.combustivel.charAt(0).toUpperCase() + veiculo.combustivel.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-green-400">
                    {veiculo.quilometragem ? `${(Number(veiculo.quilometragem) / 1000).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km` : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(veiculo.status, veiculo.id)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(veiculo)}
                      className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                      title="Visualizar detalhes"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(veiculo)}
                      className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(veiculo)}
                      className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredVeiculos.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🚗</span>
                    </div>
                    <p className="text-lg font-medium">Nenhum veículo encontrado</p>
                    <p className="text-sm">Comece registrando o primeiro veículo da frota</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>



      {/* Modal de Exclusão */}
      <VeiculoDeleteDialog
        veiculo={selectedVeiculo}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedVeiculo(null);
        }}
        onDelete={handleDeleteSuccess}
      />

      {/* Modal de Visualização */}
      {isViewModalOpen && viewingVeiculo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-seguranca-black border border-gray-600 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-seguranca-yellow/20 rounded-full flex items-center justify-center">
                  <span className="text-seguranca-yellow font-bold text-xl">
                    {viewingVeiculo.placa.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-seguranca-lightgray">
                    {viewingVeiculo.placa}
                  </h2>
                  <p className="text-gray-400">
                    {viewingVeiculo.marca} {viewingVeiculo.modelo} - {viewingVeiculo.ano}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewClose}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                ✕
              </Button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-6">
              {/* Seção de Fotos */}
              {viewingVeiculo.photos && viewingVeiculo.photos.trim() !== '' ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-seguranca-lightgray border-b border-gray-600 pb-2">
                    📸 Fotos do Veículo ({viewingVeiculo.photos.split(',').filter(photo => photo.trim() !== '').length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {viewingVeiculo.photos.split(',').filter(photo => photo.trim() !== '').map((photoUrl, index) => {
                      const fullPhotoUrl = photoUrl.startsWith('http') ? photoUrl : `${getApiUrl().replace('/api', '')}${photoUrl}`;
                      return (
                        <div key={index} className="relative group">
                          <div className="w-full h-48 bg-seguranca-graphite border border-gray-600 rounded-lg overflow-hidden group-hover:border-seguranca-yellow transition-colors">
                            <img
                              src={fullPhotoUrl}
                              alt={`Foto do veículo ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Erro ao carregar foto:', photoUrl);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                // Mostrar placeholder apenas se a imagem falhar
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                              onLoad={() => {
                                console.log('✅ Foto carregada com sucesso:', photoUrl);
                              }}
                            />
                            <div className="w-full h-full bg-seguranca-graphite border border-gray-600 rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                              <div className="text-center">
                                <div className="text-4xl mb-2">📷</div>
                                <p className="text-seguranca-lightgray text-sm font-medium">Foto não encontrada</p>
                                <p className="text-gray-400 text-xs">Arquivo: {photoUrl.split('/').pop()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-seguranca-black/80 border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
                              onClick={() => {
                                window.open(fullPhotoUrl, '_blank');
                              }}
                            >
                              <Download size={16} className="mr-2" />
                              Visualizar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-gray-400 text-lg">Nenhuma foto disponível</p>
                  <p className="text-gray-500 text-sm">Este veículo ainda não possui fotos cadastradas</p>
                </div>
              )}

              {/* Informações Detalhadas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-seguranca-lightgray border-b border-gray-600 pb-2">
                    🚗 Informações Básicas
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Placa:</span>
                      <span className="text-seguranca-lightgray font-mono font-semibold text-seguranca-yellow">
                        {viewingVeiculo.placa}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Marca:</span>
                      <span className="text-seguranca-lightgray font-semibold">{viewingVeiculo.marca}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Modelo:</span>
                      <span className="text-seguranca-lightgray font-semibold">{viewingVeiculo.modelo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ano:</span>
                      <span className="text-seguranca-lightgray font-semibold text-blue-400">{viewingVeiculo.ano}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cor:</span>
                      <span className="text-seguranca-lightgray font-semibold">{viewingVeiculo.cor || 'Não informada'}</span>
                    </div>
                  </div>
                </div>

                {/* Informações Técnicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-seguranca-lightgray border-b border-gray-600 pb-2">
                    ⚙️ Informações Técnicas
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Combustível:</span>
                      <span className="text-seguranca-lightgray font-semibold">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-700/30">
                          {viewingVeiculo.combustivel.charAt(0).toUpperCase() + viewingVeiculo.combustivel.slice(1)}
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quilometragem:</span>
                      <span className="text-seguranca-lightgray font-mono font-semibold text-green-400">
                        {viewingVeiculo.quilometragem ? `${(Number(viewingVeiculo.quilometragem) / 1000).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km` : 'Não informada'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Capacidade:</span>
                      <span className="text-seguranca-lightgray font-semibold">{viewingVeiculo.capacidade || 'Não informada'} pessoas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-seguranca-lightgray font-semibold">
                        {getStatusBadge(viewingVeiculo.status, viewingVeiculo.id)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-seguranca-lightgray border-b border-gray-600 pb-2">
                  📋 Informações Adicionais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data de Aquisição:</span>
                      <span className="text-seguranca-lightgray font-semibold">
                        {viewingVeiculo.data_aquisicao ? new Date(viewingVeiculo.data_aquisicao).toLocaleDateString('pt-BR') : 'Não informada'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valor de Aquisição:</span>
                      <span className="text-seguranca-lightgray font-semibold">
                        {viewingVeiculo.valor_aquisicao ? `R$ ${viewingVeiculo.valor_aquisicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Observações:</span>
                      <span className="text-seguranca-lightgray font-semibold max-w-xs text-right">
                        {viewingVeiculo.observacoes || 'Nenhuma observação cadastrada'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-600">
              <Button
                variant="outline"
                onClick={handleViewClose}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  handleViewClose();
                  onEdit(viewingVeiculo);
                }}
                className="bg-seguranca-yellow hover:bg-seguranca-yellow/80 text-black"
              >
                <Edit size={16} className="mr-2" />
                Editar Veículo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VeiculosTable;
