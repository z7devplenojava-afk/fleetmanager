import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Plus, 
  RefreshCw, 
  FileText, 
  Calculator,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Bug
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  MeasurementBulletin, 
  MeasurementStatus,
  MeasurementFilters 
} from '@/types/measurement';
import { measurementService } from '@/services/measurementService';
import { BulkDeleteDialog } from './BulkDeleteDialog';

interface MeasurementSimpleTableProps {
  onView: (bulletin: MeasurementBulletin) => void;
  onEdit: (bulletin: MeasurementBulletin) => void;
  onDelete: (bulletin: MeasurementBulletin) => void;
  onCreate: () => void;
  onValidate: (bulletin: MeasurementBulletin) => void;
}

const MeasurementSimpleTable: React.FC<MeasurementSimpleTableProps> = ({
  onView,
  onEdit,
  onDelete,
  onCreate,
  onValidate
}) => {
  const { toast } = useToast();
  const [bulletins, setBulletins] = useState<MeasurementBulletin[]>([]);
  
  // Garantir que bulletins seja sempre um array
  const safeBulletins = Array.isArray(bulletins) ? bulletins : [];
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MeasurementFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para seleção múltipla
  const [selectedBulletins, setSelectedBulletins] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'DRAFT', label: 'Rascunho' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'VALIDATED', label: 'Validado' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  const getStatusProps = (status: MeasurementStatus) => {
    switch (status) {
      case 'DRAFT':
        return { 
          color: 'bg-gray-500/20 text-gray-400', 
          text: 'Rascunho'
        };
      case 'PENDING':
        return { 
          color: 'bg-yellow-500/20 text-yellow-400', 
          text: 'Pendente'
        };
      case 'VALIDATED':
        return { 
          color: 'bg-green-500/20 text-green-400', 
          text: 'Validado'
        };
      case 'CANCELLED':
        return { 
          color: 'bg-red-500/20 text-red-400', 
          text: 'Cancelado'
        };
      default:
        return { 
          color: 'bg-gray-500/20 text-gray-400', 
          text: 'Desconhecido'
        };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const loadBulletins = async () => {
    try {
      setLoading(true);
      const data = await measurementService.getBulletins({
        ...filters,
        searchTerm: searchTerm || undefined
      });
      setBulletins(Array.isArray(data) ? data : []);
      
      // Se não há dados mas não houve erro, é normal
      if (data.length === 0) {
        console.log('Nenhum boletim de medição encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar boletins:', error);
      // Só mostrar toast se for um erro real, não se for lista vazia
      if (error instanceof Error && error.message !== 'Falha ao buscar boletins de medição') {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os boletins de medição.',
          variant: 'destructive'
        });
      }
      // Em caso de erro, definir lista vazia
      setBulletins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBulletins();
  }, [filters, searchTerm]);

  const handleRefresh = async () => {
    try {
      await loadBulletins();
      toast({
        title: 'Sucesso!',
        description: 'Lista de boletins atualizada.',
      });
    } catch (error) {
      toast({
        title: 'Erro!',
        description: 'Erro ao atualizar lista de boletins.',
        variant: 'destructive',
      });
    }
  };

  const handleFilterChange = (field: keyof MeasurementFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === 'all' ? undefined : value
    }));
  };

  // Funções para seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(safeBulletins.map(bulletin => bulletin.id));
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
    setIsAllSelected(newSelected.size === safeBulletins.length && safeBulletins.length > 0);
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin mb-4" />
        <p className="text-seguranca-lightgray">Carregando boletins de medição...</p>
      </div>
    );
  }

  if (safeBulletins.length === 0 && !loading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Nenhum boletim encontrado
            </h3>
            <p className="text-sm text-gray-400">
              Ainda não há boletins de medição para exibir.
            </p>
            <Button 
              onClick={onCreate}
              className="mt-6 bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Boletim
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas
  const totalBulletins = safeBulletins.length;
  const pendingBulletins = safeBulletins.filter(b => b.status === 'PENDING').length;
  const validatedBulletins = safeBulletins.filter(b => b.status === 'VALIDATED').length;
  const totalValue = safeBulletins.reduce((sum, b) => {
    const itemsValue = b.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0;
    return sum + itemsValue;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-seguranca-yellow" />
        <h2 className="text-lg font-semibold text-white">Boletins de Medição Simplificada</h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-seguranca-black border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Boletins</p>
                <p className="text-2xl font-bold text-white">{totalBulletins}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-black border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingBulletins}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-black border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Validados</p>
                <p className="text-2xl font-bold text-green-400">{validatedBulletins}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-black border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalValue)}</p>
              </div>
              <Calculator className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar boletins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-seguranca-red"
              />
            </div>
            
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-seguranca-red">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-black border-gray-600">
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-seguranca-lightgray">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={onCreate}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Medição Simplificada
            </Button>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/measurements/test');
                  const data = await response.json();
                  console.log('Teste de dados:', data);
                  toast({
                    title: 'Teste de Dados',
                    description: `${data.message} - Total: ${data.totalCount}`,
                    variant: data.hasData ? 'default' : 'destructive'
                  });
                } catch (error) {
                  console.error('Erro no teste:', error);
                  toast({
                    title: 'Erro no Teste',
                    description: 'Não foi possível testar os dados',
                    variant: 'destructive'
                  });
                }
              }}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <Bug className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Tabela Simplificada */}
      <div className="rounded-md border border-gray-700 bg-seguranca-graphite">
        <Table>
          <TableHeader>
            <TableRow className="border-b-gray-700">
              <TableHead className="text-gray-400 text-center w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                />
              </TableHead>
              <TableHead className="text-gray-400">Período</TableHead>
              <TableHead className="text-gray-400">Contrato</TableHead>
              <TableHead className="text-gray-400">Valor</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeBulletins.map((bulletin) => {
              const status = getStatusProps(bulletin.status);
              return (
                <TableRow key={bulletin.id} className="border-b-gray-700 hover:bg-seguranca-black/50">
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedBulletins.has(bulletin.id)}
                      onCheckedChange={(checked) => handleSelectBulletin(bulletin.id, checked as boolean)}
                      className="data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-seguranca-lightgray">
                      {formatDate(bulletin.periodStart)} - {formatDate(bulletin.periodEnd)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-seguranca-lightgray font-mono">
                      {bulletin.contractNumber}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm font-medium text-seguranca-yellow">
                      {formatCurrency(bulletin.subtotal)}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={`${status.color} border-0`}>
                      {status.text}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onView(bulletin)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {bulletin.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(bulletin)}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {bulletin.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onValidate(bulletin)}
                          className="text-green-400 hover:text-green-300 hover:bg-green-400/10 h-8 w-8 p-0"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {bulletin.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(bulletin)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
};

export default MeasurementSimpleTable; 