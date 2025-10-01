import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  RefreshCw, 
  FileText, 
  Download,
  Calendar,
  User,
  Clock,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ShiftChangeFormModal from './ShiftChangeFormModal';
import ShiftChangeViewModal from './ShiftChangeViewModal';
import ShiftChangeDeleteDialog from './ShiftChangeDeleteDialog';
import shiftChangeService, { ShiftChangeFormDTO } from '@/services/shiftChangeService';
import pdfService from '@/services/pdfService';

interface ShiftChangeTableProps {
  onRefresh?: () => void;
}

const ShiftChangeTable: React.FC<ShiftChangeTableProps> = ({ onRefresh }) => {
  const [shiftChanges, setShiftChanges] = useState<ShiftChangeFormDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedShiftChange, setSelectedShiftChange] = useState<ShiftChangeFormDTO | null>(null);
  const [editingShiftChange, setEditingShiftChange] = useState<ShiftChangeFormDTO | null>(null);
  const { toast } = useToast();

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'APPROVED', label: 'Aprovado' },
    { value: 'REJECTED', label: 'Rejeitado' }
  ];

  const shiftTimeLabels = {
    'SHIFT_6H_18H': '6h às 18h',
    'SHIFT_18H_6H': '18h às 6h',
    'SHIFT_7H_19H': '7h às 19h',
    'SHIFT_19H_7H': '19h às 7h'
  };

  const getStatusProps = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
          text: 'Pendente',
          icon: AlertCircle
        };
      case 'APPROVED':
        return { 
          color: 'bg-green-500/20 text-green-400 border-green-500/30', 
          text: 'Aprovado',
          icon: CheckCircle
        };
      case 'REJECTED':
        return { 
          color: 'bg-red-500/20 text-red-400 border-red-500/30', 
          text: 'Rejeitado',
          icon: XCircle
        };
      default:
        return { 
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', 
          text: 'Desconhecido',
          icon: AlertCircle
        };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const loadShiftChanges = async () => {
    try {
      setLoading(true);
      const data = await shiftChangeService.getAllShiftChanges();
      setShiftChanges(data);
      console.log('✅ Trocas de plantão carregadas:', data.length);
    } catch (error) {
      console.error('❌ Erro ao carregar trocas de plantão:', error);
      setShiftChanges([]);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as trocas de plantão.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShiftChanges();
  }, []);

  const handleRefresh = () => {
    loadShiftChanges();
    onRefresh?.();
  };

  const handleCreate = () => {
    setEditingShiftChange(null);
    setShowFormModal(true);
  };

  const handleEdit = (shiftChange: ShiftChangeFormDTO) => {
    setEditingShiftChange(shiftChange);
    setShowFormModal(true);
  };

  const handleView = (shiftChange: ShiftChangeFormDTO) => {
    setSelectedShiftChange(shiftChange);
    setShowViewModal(true);
  };

  const handleDelete = (shiftChange: ShiftChangeFormDTO) => {
    setSelectedShiftChange(shiftChange);
    setShowDeleteDialog(true);
  };

  const handleSave = async (formData: any) => {
    try {
      if (editingShiftChange) {
        await shiftChangeService.updateShiftChange(editingShiftChange.id!, formData);
        toast({
          title: 'Sucesso',
          description: 'Troca de plantão atualizada com sucesso!',
        });
      } else {
        await shiftChangeService.createShiftChange(formData);
        toast({
          title: 'Sucesso',
          description: 'Troca de plantão criada com sucesso!',
        });
      }
      setShowFormModal(false);
      loadShiftChanges();
    } catch (error) {
      console.error('Erro ao salvar troca de plantão:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedShiftChange?.id) return;
    
    try {
      await shiftChangeService.deleteShiftChange(selectedShiftChange.id);
      setShowDeleteDialog(false);
      setSelectedShiftChange(null);
      loadShiftChanges();
      toast({
        title: 'Sucesso',
        description: 'Troca de plantão excluída com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao excluir troca de plantão:', error);
    }
  };

  const handleGeneratePDF = async (shiftChange: ShiftChangeFormDTO) => {
    try {
      await pdfService.downloadShiftChangePDF(shiftChange);
      
      toast({
        title: 'Sucesso',
        description: 'PDF da troca de plantão gerado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF da troca de plantão.',
        variant: 'destructive',
      });
    }
  };

  const filteredShiftChanges = shiftChanges.filter(shiftChange => {
    const matchesSearch = 
      shiftChange.requesterFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shiftChange.replacingFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shiftChange.requesterSector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shiftChange.replacingSector.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shiftChange.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin mb-4" />
        <p className="text-seguranca-lightgray">Carregando trocas de plantão...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Estatísticas */}
      <Card className="bg-seguranca-black border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Clock className="h-5 w-5 text-seguranca-yellow" />
            Controle de Troca de Plantão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-seguranca-lightgray">{shiftChanges.length}</div>
              <div className="text-sm text-gray-400">Total de Solicitações</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {shiftChanges.filter(s => s.status === 'PENDING').length}
              </div>
              <div className="text-sm text-gray-400">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {shiftChanges.filter(s => s.status === 'APPROVED').length}
              </div>
              <div className="text-sm text-gray-400">Aprovadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {shiftChanges.filter(s => s.status === 'REJECTED').length}
              </div>
              <div className="text-sm text-gray-400">Rejeitadas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Ações */}
      <Card className="bg-seguranca-black border-gray-600">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou setor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-seguranca-yellow hover:bg-seguranca-darkyellow text-seguranca-black"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="bg-seguranca-black border-gray-600">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-seguranca-graphite hover:bg-seguranca-graphite border-gray-600">
                  <TableHead className="text-seguranca-lightgray font-semibold">Data Solicitação</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold">Solicitante</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold">Colega</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold">Horário</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold">Status</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShiftChanges.map((shiftChange) => {
                  const statusProps = getStatusProps(shiftChange.status || 'PENDING');
                  const StatusIcon = statusProps.icon;
                  
                  return (
                    <TableRow
                      key={shiftChange.id}
                      className="hover:bg-seguranca-graphite/50 transition-colors border-gray-700"
                    >
                      <TableCell className="text-seguranca-lightgray">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-seguranca-yellow" />
                          {formatDate(shiftChange.dateOfRequest)}
                        </div>
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        <div className="flex flex-col">
                          <span className="font-medium">{shiftChange.requesterFullName}</span>
                          <span className="text-sm text-gray-400">{shiftChange.requesterSector}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        <div className="flex flex-col">
                          <span className="font-medium">{shiftChange.replacingFullName}</span>
                          <span className="text-sm text-gray-400">{shiftChange.replacingSector}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span className="font-mono">{shiftTimeLabels[shiftChange.shiftTime]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusProps.color} border`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusProps.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(shiftChange)}
                            className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                            title="Visualizar detalhes"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(shiftChange)}
                            className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGeneratePDF(shiftChange)}
                            className="h-8 w-8 p-0 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                            title="Gerar PDF"
                          >
                            <FileText size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(shiftChange)}
                            className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredShiftChanges.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                          <Clock className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-medium">Nenhuma troca de plantão encontrada</p>
                        <p className="text-sm">Comece criando a primeira solicitação de troca</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <ShiftChangeFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        shiftChange={editingShiftChange}
        onSave={handleSave}
      />

      <ShiftChangeViewModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        shiftChange={selectedShiftChange}
        onGeneratePDF={handleGeneratePDF}
      />

      <ShiftChangeDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        shiftChange={selectedShiftChange}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ShiftChangeTable;
