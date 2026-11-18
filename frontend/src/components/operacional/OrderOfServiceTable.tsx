import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Plus, 
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  User,
  Building,
  MapPin,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderOfService } from '@/services/orderOfServiceService';

interface OrderOfServiceTableProps {
  orders: OrderOfService[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (order: OrderOfService) => void;
  onDelete: (order: OrderOfService) => void;
  onView: (order: OrderOfService) => void;
  onCreate: () => void;
}

const OrderOfServiceTable: React.FC<OrderOfServiceTableProps> = ({
  orders,
  isLoading,
  onRefresh,
  onEdit,
  onDelete,
  onView,
  onCreate
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (signed: boolean) => {
    if (signed) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Assinada</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Verificar se orders é um array válido
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  const filteredOrders = safeOrders.filter(order => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.employeeName.toLowerCase().includes(searchTermLower) ||
      order.client.toLowerCase().includes(searchTermLower) ||
      order.workplace.toLowerCase().includes(searchTermLower) ||
      order.role.toLowerCase().includes(searchTermLower);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'signed' && order.signed) ||
      (statusFilter === 'pending' && !order.signed);
    
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    try {
      await onRefresh();
      toast({
        title: 'Sucesso!',
        description: 'Lista de ordens de serviço atualizada.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a lista.',
        variant: 'destructive',
      });
    }
  };

  if (safeOrders.length === 0) {
    return (
      <Card className="bg-white dark:bg-seguranca-graphite border-slate-200 dark:border-gray-600 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-slate-400 dark:text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-gray-200 mb-2">
              Nenhuma ordem de serviço encontrada
            </h3>
            <p className="text-slate-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando uma nova ordem de serviço.'}
            </p>
            <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem de Serviço
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-seguranca-graphite border-slate-200 dark:border-gray-600 shadow-sm">
      <CardHeader className="border-b border-slate-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ordens de Serviço ({filteredOrders.length})
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={onCreate} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem
            </Button>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
              className="border-slate-300 dark:border-gray-500 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por funcionário, cliente, local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-gray-800 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="signed">Assinadas</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800/50">
                <TableHead className="text-slate-700 dark:text-gray-300 font-semibold">Funcionário</TableHead>
                <TableHead className="text-slate-700 dark:text-gray-300 font-semibold">Cliente</TableHead>
                <TableHead className="text-slate-700 dark:text-gray-300 font-semibold">Local</TableHead>
                <TableHead className="text-slate-700 dark:text-gray-300 font-semibold">Cargo</TableHead>
                <TableHead className="text-slate-700 dark:text-gray-300 font-semibold">Salário</TableHead>
                <TableHead className="text-slate-700 dark:text-gray-300 font-semibold">Período</TableHead>
                <TableHead className="text-slate-700 dark:text-gray-300 font-semibold">Status</TableHead>
                <TableHead className="text-slate-700 dark:text-gray-300 font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-b border-slate-200/80 dark:border-gray-700 hover:bg-slate-50/80 dark:hover:bg-gray-800/30">
                  <TableCell className="text-slate-800 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-gray-100">{order.employeeName}</div>
                        <div className="text-xs text-slate-500 dark:text-gray-400">{order.employeeCpf}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-800 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                      {order.client}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-800 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                      {order.workplace}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-800 dark:text-gray-200">{order.role}</TableCell>
                  <TableCell className="text-slate-800 dark:text-gray-200">
                    <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-green-400">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(order.salary)}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-800 dark:text-gray-200">
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400 dark:text-gray-400" />
                        {formatDate(order.startDate)}
                      </div>
                      {order.endDate && (
                        <div className="text-xs text-slate-500 dark:text-gray-400">
                          até {formatDate(order.endDate)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.signed)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(order)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(order)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-yellow-400 dark:hover:text-yellow-300 dark:hover:bg-yellow-900/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(order)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderOfServiceTable;
