import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, Download } from 'lucide-react';
import { orderOfServiceSSTService } from '@/services/orderOfServiceSSTService';
import { OrderOfServiceSST } from '@/types/orderOfServiceSST';
import { toast } from '@/hooks/use-toast';

interface OrdemServicoSSTTableProps {
  onEdit?: (order: OrderOfServiceSST) => void;
  onView?: (order: OrderOfServiceSST) => void;
  onCreate?: () => void;
}

export function OrdemServicoSSTTable({ onEdit, onView, onCreate }: OrdemServicoSSTTableProps) {
  const [orders, setOrders] = useState<OrderOfServiceSST[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderOfServiceSSTService.findAll();
      setOrders(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar ordens de serviço SST",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      try {
        await orderOfServiceSSTService.delete(id);
        toast({
          title: "Sucesso",
          description: "Ordem de serviço excluída com sucesso",
        });
        loadOrders();
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir ordem de serviço",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadDocument = async (id: string) => {
    try {
      const blob = await orderOfServiceSSTService.downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ordem-servico-sst-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao baixar documento",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDENTE': { variant: 'secondary' as const, label: 'Pendente' },
      'EM_ANDAMENTO': { variant: 'default' as const, label: 'Em Andamento' },
      'CONCLUIDA': { variant: 'default' as const, label: 'Concluída' },
      'CANCELADA': { variant: 'destructive' as const, label: 'Cancelada' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ordens de Serviço SST</CardTitle>
          {onCreate && (
            <Button onClick={onCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma ordem de serviço SST encontrada
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Emissão</TableHead>
                <TableHead>Data de Execução</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.title}</TableCell>
                  <TableCell>{order.responsible}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{formatDate(order.issueDate)}</TableCell>
                  <TableCell>
                    {order.executionDate ? formatDate(order.executionDate) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {order.documentUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(order.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
} 