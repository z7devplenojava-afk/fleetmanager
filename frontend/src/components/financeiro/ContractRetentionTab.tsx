import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Calculator, 
  DollarSign, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  TrendingUp 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { contractRetentionService } from '@/services/contractRetentionService';
import { ContractRetention, RetentionStatus } from '@/types/contractRetention';
import { ContractRetentionModal } from './ContractRetentionModal';

export const ContractRetentionTab: React.FC = () => {
  const { toast } = useToast();
  const [retentions, setRetentions] = useState<ContractRetention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRetention, setEditingRetention] = useState<ContractRetention | undefined>(undefined);

  useEffect(() => {
    loadRetentions();
  }, []);

  const loadRetentions = async () => {
    try {
      setLoading(true);
      const data = await contractRetentionService.getAll();
      setRetentions(data);
    } catch (err) {
      console.error('Erro ao carregar retenções:', err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de retenções contratuais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRetention(undefined);
    setModalOpen(true);
  };

  const handleEdit = (retention: ContractRetention) => {
    setEditingRetention(retention);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de retenção contratual?')) return;
    try {
      await contractRetentionService.delete(id);
      toast({ title: "Sucesso", description: "Retenção contratual removida com sucesso!" });
      loadRetentions();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o registro.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (retention: ContractRetention, newStatus: RetentionStatus) => {
    try {
      await contractRetentionService.updateStatus(retention.id, newStatus);
      toast({ title: "Sucesso", description: `Status alterado para ${newStatus}` });
      loadRetentions();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao alterar o status.",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const getStatusBadge = (status: RetentionStatus) => {
    switch (status) {
      case RetentionStatus.RETIDO:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Retido</Badge>;
      case RetentionStatus.LIBERADO:
        return <Badge className="bg-green-500/20 text-green-400 border-0">Liberado / Devolvido</Badge>;
      case RetentionStatus.FATURADO:
        return <Badge className="bg-blue-500/20 text-blue-400 border-0">Faturado</Badge>;
      case RetentionStatus.CANCELADO:
        return <Badge className="bg-red-500/20 text-red-400 border-0">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-0">{status}</Badge>;
    }
  };

  // Filtragem
  const filteredRetentions = retentions.filter(r => {
    const matchesSearch = !searchTerm || 
      (r.clientName && r.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.contractNumber && r.contractNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.referenceMonth && r.referenceMonth.includes(searchTerm));
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Totais para KPI Cards
  const totalMedido = filteredRetentions.reduce((acc, r) => acc + (r.measuredValue || 0), 0);
  const totalRetido = filteredRetentions.filter(r => r.status === RetentionStatus.RETIDO).reduce((acc, r) => acc + (r.retentionValue || 0), 0);
  const totalLiberado = filteredRetentions.filter(r => r.status === RetentionStatus.LIBERADO).reduce((acc, r) => acc + (r.retentionValue || 0), 0);
  const totalFaturar = filteredRetentions.reduce((acc, r) => acc + (r.netInvoicedValue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Cards de Métricas / KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-seguranca-graphite border-gray-700 p-4">
          <div className="flex justify-between items-center text-gray-400 text-xs font-medium">
            <span>TOTAL MEDIDO BRUTO</span>
            <Calculator className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-seguranca-lightgray mt-1">{formatCurrency(totalMedido)}</div>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700 p-4">
          <div className="flex justify-between items-center text-gray-400 text-xs font-medium">
            <span>RETIDO ATUALMENTE</span>
            <Lock className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="text-xl font-bold text-yellow-400 mt-1">{formatCurrency(totalRetido)}</div>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700 p-4">
          <div className="flex justify-between items-center text-gray-400 text-xs font-medium">
            <span>TOTAL LIBERADO / DEVOLVIDO</span>
            <Unlock className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-xl font-bold text-green-400 mt-1">{formatCurrency(totalLiberado)}</div>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700 p-4">
          <div className="flex justify-between items-center text-gray-400 text-xs font-medium">
            <span>TOTAL A FATURAR LÍQUIDO</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalFaturar)}</div>
        </Card>
      </div>

      {/* Barra de Filtros e Ações */}
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente, contrato ou mês..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-seguranca-black border-gray-600">
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  <SelectItem value={RetentionStatus.RETIDO}>Retido</SelectItem>
                  <SelectItem value={RetentionStatus.LIBERADO}>Liberado</SelectItem>
                  <SelectItem value={RetentionStatus.FATURADO}>Faturado</SelectItem>
                  <SelectItem value={RetentionStatus.CANCELADO}>Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadRetentions} disabled={loading} className="border-gray-600">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <Button onClick={handleCreate} className="bg-seguranca-red hover:bg-seguranca-darkred w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Retenção Contratual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Retenções */}
      <div className="rounded-md border border-gray-700 bg-seguranca-graphite overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-gray-700 bg-seguranca-black/40">
              <TableHead className="text-gray-400">Cliente / Contrato</TableHead>
              <TableHead className="text-gray-400">Mês Ref.</TableHead>
              <TableHead className="text-gray-400 text-right">Valor Medido</TableHead>
              <TableHead className="text-gray-400 text-right">Desc. RMU</TableHead>
              <TableHead className="text-gray-400 text-right">Taxa %</TableHead>
              <TableHead className="text-gray-400 text-right">Valor Retenção</TableHead>
              <TableHead className="text-gray-400 text-right">Valor a Faturar</TableHead>
              <TableHead className="text-gray-400 text-center">Status</TableHead>
              <TableHead className="text-gray-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRetentions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                  Nenhum registro de retenção contratual encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredRetentions.map((r) => (
                <TableRow key={r.id} className="border-b-gray-700 hover:bg-seguranca-black/50">
                  <TableCell>
                    <div className="font-medium text-seguranca-lightgray">{r.clientName || 'N/A'}</div>
                    <div className="text-xs text-seguranca-yellow font-mono">{r.contractNumber || 'N/A'}</div>
                  </TableCell>

                  <TableCell className="text-seguranca-lightgray font-mono">
                    {r.referenceMonth || 'N/A'}
                  </TableCell>

                  <TableCell className="text-right text-seguranca-lightgray font-semibold">
                    {formatCurrency(r.measuredValue)}
                  </TableCell>

                  <TableCell className="text-right text-red-400">
                    {r.rmuDiscount > 0 ? `- ${formatCurrency(r.rmuDiscount)}` : 'R$ 0,00'}
                  </TableCell>

                  <TableCell className="text-right text-yellow-400 font-mono">
                    {r.retentionRate || 3}%
                  </TableCell>

                  <TableCell className="text-right text-yellow-400 font-bold">
                    {formatCurrency(r.retentionValue)}
                  </TableCell>

                  <TableCell className="text-right text-emerald-400 font-bold">
                    {formatCurrency(r.netInvoicedValue)}
                  </TableCell>

                  <TableCell className="text-center">
                    {getStatusBadge(r.status)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {r.status === RetentionStatus.RETIDO && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(r, RetentionStatus.LIBERADO)}
                          className="text-green-400 hover:text-green-300 hover:bg-green-400/10 h-8 w-8 p-0"
                          title="Marcar como Liberado/Devolvido"
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(r)}
                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 h-8 w-8 p-0"
                        title="Editar Retenção"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(r.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Criação / Edição */}
      <ContractRetentionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        retention={editingRetention}
        onSuccess={loadRetentions}
      />
    </div>
  );
};
