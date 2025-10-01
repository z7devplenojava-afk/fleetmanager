import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Calculator,
  DollarSign,
  Calendar,
  Building2,
  Zap,
  RefreshCw,
  Bug
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { measurementService } from '@/services/measurementService';
import { MeasurementBulletin, MeasurementStatus } from '@/types/measurement';
import { MeasurementBulletinModal } from './MeasurementBulletinModal';
import { MeasurementViewModal } from './MeasurementViewModal';
import { MeasurementDeleteDialog } from './MeasurementDeleteDialog';
import { MeasurementValidationModal } from './MeasurementValidationModal';
import { BulkDeleteDialog } from './BulkDeleteDialog';

interface MeasurementCompleteTableProps {
  onView?: (bulletin: MeasurementBulletin) => void;
  onEdit?: (bulletin: MeasurementBulletin) => void;
  onDelete?: (bulletin: MeasurementBulletin) => void;
  onCreate?: () => void;
  onValidate?: (bulletin: MeasurementBulletin) => void;
}

export default function MeasurementCompleteTable({
  onView,
  onEdit,
  onDelete,
  onCreate,
  onValidate
}: MeasurementCompleteTableProps) {
  const { toast } = useToast();
  const [bulletins, setBulletins] = useState<MeasurementBulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MeasurementStatus | 'all'>('all');
  const [contractFilter, setContractFilter] = useState<string>('all');
  
  // Estados para seleção múltipla
  const [selectedBulletins, setSelectedBulletins] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Estados dos modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<MeasurementBulletin | null>(null);

  // Carregar boletins
  const loadBulletins = async () => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando carregamento de boletins...');
      const data = await measurementService.getBulletins();
      console.log('📊 Dados recebidos:', data);
      setBulletins(data);
      
      // Se não há dados mas não houve erro, é normal
      if (data.length === 0) {
        console.log('ℹ️ Nenhum boletim de medição encontrado');
        toast({
          title: "Informação",
          description: "Nenhum boletim de medição encontrado. A tabela está vazia.",
          variant: "default"
        });
      } else {
        console.log(`✅ ${data.length} boletins carregados com sucesso`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar boletins:', error);
      // Só mostrar toast se for um erro real, não se for lista vazia
      if (error instanceof Error && error.message !== 'Falha ao buscar boletins de medição') {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os boletins de medição",
          variant: "destructive"
        });
      }
      // Em caso de erro, definir lista vazia
      setBulletins([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para testar a API
  const testAPI = async () => {
    try {
      console.log('🧪 Testando conectividade com API de medições...');
      
      // Testar endpoint básico
      const response = await fetch('http://localhost:8081/api/measurements', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API funcionando! Dados recebidos:', data);
        toast({
          title: "API OK!",
          description: `Endpoint funcionando. ${Array.isArray(data) ? data.length : 0} registros encontrados.`,
          variant: "default"
        });
      } else {
        const errorText = await response.text();
        console.error('❌ API retornou erro:', response.status, errorText);
        toast({
          title: "Erro na API",
          description: `Status ${response.status}: ${errorText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('💥 Erro ao testar API:', error);
      toast({
        title: "Erro de Conectividade",
        description: "Não foi possível conectar com a API",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadBulletins();
  }, []);

  // Filtrar boletins
  const filteredBulletins = Array.isArray(bulletins) ? bulletins.filter(bulletin => {
    const matchesSearch = 
      bulletin.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bulletin.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bulletin.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || bulletin.status === statusFilter;
    const matchesContract = contractFilter === 'all' || bulletin.contractNumber === contractFilter;

    return matchesSearch && matchesStatus && matchesContract;
  }) : [];

  // Obter contratos únicos para filtro
  const uniqueContracts = Array.isArray(bulletins) 
    ? Array.from(new Set(bulletins.map(b => b.contractNumber))).filter(Boolean)
    : [];

  // Funções para seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredBulletins.map(bulletin => bulletin.id));
      setSelectedBulletins(allIds);
      setIsAllSelected(true);
    } else {
      setSelectedBulletins(new Set());
      setIsAllSelected(false);
    }
  };

  const handleSelectBulletin = (bulletinId: string, checked: boolean) => {
    const newSelected = new Set(selectedBulletins);
    if (checked) {
      newSelected.add(bulletinId);
    } else {
      newSelected.delete(bulletinId);
    }
    setSelectedBulletins(newSelected);
    
    // Verificar se todos estão selecionados
    setIsAllSelected(newSelected.size === filteredBulletins.length && filteredBulletins.length > 0);
  };

  const handleBulkDelete = () => {
    if (selectedBulletins.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setLoading(true);
      const deletePromises = Array.from(selectedBulletins).map(id => 
        measurementService.deleteBulletin(id)
      );
      
      await Promise.all(deletePromises);
      
      toast({
        title: "Sucesso",
        description: `${selectedBulletins.size} boletim(ns) excluído(s) com sucesso.`,
        variant: "default"
      });
      
      // Limpar seleção e recarregar dados
      setSelectedBulletins(new Set());
      setIsAllSelected(false);
      setShowBulkDeleteDialog(false);
      loadBulletins();
      
    } catch (error) {
      console.error('Erro ao excluir boletins:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir alguns boletins. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowEditModal(true);
  };

  const handleView = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowViewModal(true);
  };

  const handleDelete = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowDeleteDialog(true);
  };

  const handleValidate = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowValidationModal(true);
  };

  const handleSuccess = () => {
    loadBulletins();
    setShowCreateModal(false);
    setShowEditModal(false);
  };

  const handleDeleteSuccess = () => {
    loadBulletins();
    setShowDeleteDialog(false);
    setSelectedBulletin(null);
  };

  const handleValidationSuccess = () => {
    loadBulletins();
    setShowValidationModal(false);
    setSelectedBulletin(null);
  };

  // Obter propriedades do status
  const getStatusProps = (status: MeasurementStatus) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Rascunho', variant: 'secondary', icon: FileText };
      case 'PENDING':
        return { label: 'Pendente', variant: 'default', icon: AlertCircle };
      case 'VALIDATED':
        return { label: 'Validado', variant: 'default', icon: CheckCircle };
      case 'CANCELLED':
        return { label: 'Cancelado', variant: 'destructive', icon: AlertCircle };
      default:
        return { label: status, variant: 'outline', icon: AlertCircle };
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar período
  const formatPeriod = (start: string, end: string) => {
    if (!start || !end) return '-';
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`;
  };

  if (loading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="flex justify-center items-center py-8">
          <div className="text-seguranca-lightgray">Carregando boletins de medição...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray text-xl flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Boletins de Medição Completa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Buscar por contrato, empresa ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MeasurementStatus | 'all')}>
              <SelectTrigger className="w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-black border-gray-600">
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="DRAFT">Rascunho</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="VALIDATED">Validado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger className="w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Filtrar por contrato" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-black border-gray-600">
                <SelectItem value="all">Todos os Contratos</SelectItem>
                {uniqueContracts.map(contract => (
                  <SelectItem key={contract} value={contract}>
                    {contract}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Medição
            </Button>
            <Button
              onClick={loadBulletins}
              variant="outline"
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
            <Button
              onClick={testAPI}
              variant="outline"
              className="border-orange-600 text-orange-400 hover:bg-orange-600/20"
            >
              <Bug className="h-4 w-4 mr-2" />
              Testar API
            </Button>
            {selectedBulletins.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Selecionados ({selectedBulletins.size})
              </Button>
            )}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-600">
            <div className="text-center p-3 bg-seguranca-black rounded border border-gray-700">
              <div className="text-2xl font-bold text-seguranca-yellow">{Array.isArray(bulletins) ? bulletins.length : 0}</div>
              <div className="text-sm text-gray-400">Total de Boletins</div>
            </div>
            <div className="text-center p-3 bg-seguranca-black rounded border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">
                {Array.isArray(bulletins) ? bulletins.filter(b => b.status === 'PENDING').length : 0}
              </div>
              <div className="text-sm text-gray-400">Pendentes</div>
            </div>
            <div className="text-center p-3 bg-seguranca-black rounded border border-gray-700">
              <div className="text-2xl font-bold text-green-400">
                {Array.isArray(bulletins) ? bulletins.filter(b => b.status === 'VALIDATED').length : 0}
              </div>
              <div className="text-sm text-gray-400">Validados</div>
            </div>
            <div className="text-center p-3 bg-seguranca-black rounded border border-gray-700">
              <div className="text-2xl font-bold text-seguranca-yellow">
                {formatCurrency(Array.isArray(bulletins) ? bulletins.reduce((total, b) => total + (b.subtotal || 0), 0) : 0)}
              </div>
              <div className="text-sm text-gray-400">Valor Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de boletins */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-0">
          {filteredBulletins.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm || statusFilter !== 'all' || contractFilter !== 'all' 
                ? 'Nenhum boletim encontrado com os filtros aplicados.'
                : 'Nenhum boletim de medição cadastrado ainda.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600 bg-seguranca-black">
                    <th className="text-center py-3 px-4 font-medium text-seguranca-lightgray w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Contrato</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Período</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">NF</th>
                    <th className="text-center py-3 px-4 font-medium text-seguranca-lightgray">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBulletins.map((bulletin) => {
                    const statusProps = getStatusProps(bulletin.status);
                    const StatusIcon = statusProps.icon;
                    
                    return (
                      <tr key={bulletin.id} className="border-b border-gray-700 hover:bg-seguranca-black/50">
                        <td className="py-3 px-4 text-center">
                          <Checkbox
                            checked={selectedBulletins.has(bulletin.id)}
                            onCheckedChange={(checked) => handleSelectBulletin(bulletin.id, checked as boolean)}
                            className="data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-lightgray font-medium">
                            {bulletin.contractNumber}
                          </div>
                          <div className="text-sm text-gray-400">
                            {bulletin.contract?.description || 'Sem descrição'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-lightgray">
                            {bulletin.client?.name || 'Cliente não definido'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {bulletin.unit?.name || 'Unidade não definida'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-lightgray">
                            {formatPeriod(bulletin.periodStart, bulletin.periodEnd)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-yellow font-bold">
                            {formatCurrency(bulletin.subtotal || 0)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {bulletin.items?.length || 0} itens
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusProps.variant as any} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusProps.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-lightgray">
                            {bulletin.nfNumber || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(bulletin)}
                              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(bulletin)}
                              className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {bulletin.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleValidate(bulletin)}
                                className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(bulletin)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <MeasurementBulletinModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleSuccess}
      />

      <MeasurementBulletinModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        bulletin={selectedBulletin || undefined}
        onSuccess={handleSuccess}
      />

      {selectedBulletin && (
        <>
          <MeasurementViewModal
            open={showViewModal}
            onOpenChange={setShowViewModal}
            bulletin={selectedBulletin}
          />

          <MeasurementDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            bulletin={selectedBulletin}
            onSuccess={handleDeleteSuccess}
          />

          <MeasurementValidationModal
            open={showValidationModal}
            onOpenChange={setShowValidationModal}
            bulletin={selectedBulletin}
            onSuccess={handleValidationSuccess}
          />
        </>
      )}

      {/* Modal de exclusão em massa */}
      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={confirmBulkDelete}
        itemCount={selectedBulletins.size}
        itemType="boletim"
        loading={loading}
      />
    </div>
  );
} 