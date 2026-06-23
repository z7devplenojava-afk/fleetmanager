import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, User, Clock, DollarSign, CheckCircle, XCircle, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ServiceRatingService from '@/services/serviceRatingService';

interface DriverCost {
  id: string;
  ratingId: string;
  contractId: string;
  driverId: string;
  driverName: string;
  costType: 'OVERTIME' | 'BONUS' | 'PENALTY' | 'EXPENSE' | 'OTHER';
  description: string;
  date: string;
  hours?: number;
  amount: number;
  currency: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

interface DriverCostsManagerProps {
  ratingId: string;
  contractId: string;
}

const DriverCostsManager: React.FC<DriverCostsManagerProps> = ({ ratingId, contractId }) => {
  const [costs, setCosts] = useState<DriverCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<DriverCost | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingCost, setDeletingCost] = useState<DriverCost | null>(null);
  const [formData, setFormData] = useState({
    driverId: '',
    driverName: '',
    costType: 'OVERTIME' as DriverCost['costType'],
    description: '',
    date: '',
    hours: 0,
    amount: 0,
    receiptUrl: '',
    notes: ''
  });

  useEffect(() => {
    loadCosts();
  }, [ratingId]);

  const loadCosts = async () => {
    try {
      setLoading(true);
      const costsData = await ServiceRatingService.getDriverCostsByRating(ratingId);
      setCosts(costsData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar custos do motorista',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      driverId: '',
      driverName: '',
      costType: 'OVERTIME',
      description: '',
      date: '',
      hours: 0,
      amount: 0,
      receiptUrl: '',
      notes: ''
    });
    setEditingCost(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const costData = {
        ...formData,
        ratingId,
        contractId,
        currency: 'BRL',
        approved: false
      };

      if (editingCost) {
        await ServiceRatingService.updateDriverCost(editingCost.id, costData);
        toast({
          title: 'Sucesso',
          description: 'Custo do motorista atualizado com sucesso'
        });
      } else {
        await ServiceRatingService.createDriverCost(costData);
        toast({
          title: 'Sucesso',
          description: 'Custo do motorista criado com sucesso'
        });
      }

      setShowDialog(false);
      resetForm();
      loadCosts();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar custo do motorista',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (cost: DriverCost) => {
    setEditingCost(cost);
    setFormData({
      driverId: cost.driverId,
      driverName: cost.driverName,
      costType: cost.costType,
      description: cost.description,
      date: cost.date,
      hours: cost.hours || 0,
      amount: cost.amount,
      receiptUrl: cost.receiptUrl || '',
      notes: cost.notes || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingCost) return;

    try {
      await ServiceRatingService.deleteDriverCost(deletingCost.id);
      toast({
        title: 'Sucesso',
        description: 'Custo do motorista excluído com sucesso'
      });
      setDeleteDialog(false);
      setDeletingCost(null);
      loadCosts();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir custo do motorista',
        variant: 'destructive'
      });
    }
  };

  const getCostTypeLabel = (type: DriverCost['costType']) => {
    const labels = {
      'OVERTIME': 'Horas Extras',
      'BONUS': 'Bônus',
      'PENALTY': 'Penalidade',
      'EXPENSE': 'Despesa',
      'OTHER': 'Outro'
    };
    return labels[type] || type;
  };

  const getCostTypeColor = (type: DriverCost['costType']) => {
    const colors = {
      'OVERTIME': 'bg-blue-100 text-blue-800',
      'BONUS': 'bg-green-100 text-green-800',
      'PENALTY': 'bg-red-100 text-red-800',
      'EXPENSE': 'bg-yellow-100 text-yellow-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Custos com Motorista
          </CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Custo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCost ? 'Editar Custo do Motorista' : 'Novo Custo do Motorista'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="driverName">Nome do Motorista</Label>
                    <Input
                      id="driverName"
                      value={formData.driverName}
                      onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="costType">Tipo de Custo</Label>
                    <Select value={formData.costType} onValueChange={(value) => setFormData(prev => ({ ...prev, costType: value as DriverCost['costType'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OVERTIME">Horas Extras</SelectItem>
                        <SelectItem value="BONUS">Bônus</SelectItem>
                        <SelectItem value="PENALTY">Penalidade</SelectItem>
                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o custo detalhadamente"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="hours">Horas (se aplicável)</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      value={formData.hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                      placeholder="Ex: 2.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="receiptUrl">URL do Comprovante (opcional)</Label>
                  <Input
                    id="receiptUrl"
                    value={formData.receiptUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, receiptUrl: e.target.value }))}
                    placeholder="https://exemplo.com/comprovante.pdf"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observações adicionais (opcional)"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCost ? 'Atualizar' : 'Criar'} Custo
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : costs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum custo do motorista encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>{format(new Date(cost.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">{cost.driverName}</TableCell>
                    <TableCell>
                      <Badge className={getCostTypeColor(cost.costType)}>
                        {getCostTypeLabel(cost.costType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={cost.description}>
                        {cost.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cost.hours ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cost.hours}h
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      R$ {cost.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cost.approved ? 'default' : 'secondary'}>
                        {cost.approved ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovado
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {cost.receiptUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={cost.receiptUrl} target="_blank" rel="noopener noreferrer">
                              <Receipt className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleEdit(cost)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDeletingCost(cost);
                            setDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este custo do motorista? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DriverCostsManager;
