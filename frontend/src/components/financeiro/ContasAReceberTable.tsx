import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { ContaAReceber } from './ContasAReceberFormModal';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContasAReceberTableProps {
  contas: ContaAReceber[];
  onEdit: (conta: ContaAReceber) => void;
  onDelete: (id: string) => void;
  onView: (conta: ContaAReceber) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const ContasAReceberTable: React.FC<ContasAReceberTableProps> = ({
  contas,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [clienteFilter, setClienteFilter] = useState('');

  // Filtrar contas
  const contasFiltradas = contas.filter(conta => {
    const matchesSearch = 
      conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.numeroFatura?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || conta.status === statusFilter;
    const matchesTipo = tipoFilter === 'TODOS' || conta.tipo === tipoFilter;
    const matchesCliente = !clienteFilter || conta.clienteId === clienteFilter;

    return matchesSearch && matchesStatus && matchesTipo && matchesCliente;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return <Badge className="bg-yellow-100 text-yellow-800">Aberta</Badge>;
      case 'RECEBIDA':
        return <Badge className="bg-green-100 text-green-800">Recebida</Badge>;
      case 'VENCIDA':
        return <Badge className="bg-red-100 text-red-800">Vencida</Badge>;
      case 'CANCELADA':
        return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'FATURA':
        return <Badge className="bg-blue-100 text-blue-800">Fatura</Badge>;
      case 'MEDICAO':
        return <Badge className="bg-purple-100 text-purple-800">Medição</Badge>;
      case 'SERVICO':
        return <Badge className="bg-green-100 text-green-800">Serviço</Badge>;
      case 'PRODUTO':
        return <Badge className="bg-orange-100 text-orange-800">Produto</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{tipo}</Badge>;
    }
  };

  const isVencida = (vencimento: Date) => {
    return isBefore(vencimento, new Date());
  };

  const isVencendoEmBreve = (vencimento: Date) => {
    const hoje = new Date();
    const proximos7Dias = addDays(hoje, 7);
    return isAfter(vencimento, hoje) && isBefore(vencimento, proximos7Dias);
  };

  if (loading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
            <span className="ml-2 text-seguranca-lightgray">Carregando contas a receber...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="text-green-500" />
          Contas a Receber
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-600 bg-seguranca-black text-white placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-black border-gray-600">
              <SelectItem value="TODOS" className="text-white hover:bg-seguranca-graphite">Todos</SelectItem>
              <SelectItem value="ABERTA" className="text-white hover:bg-seguranca-graphite">Aberta</SelectItem>
              <SelectItem value="RECEBIDA" className="text-white hover:bg-seguranca-graphite">Recebida</SelectItem>
              <SelectItem value="VENCIDA" className="text-white hover:bg-seguranca-graphite">Vencida</SelectItem>
              <SelectItem value="CANCELADA" className="text-white hover:bg-seguranca-graphite">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-black border-gray-600">
              <SelectItem value="TODOS" className="text-white hover:bg-seguranca-graphite">Todos</SelectItem>
              <SelectItem value="FATURA" className="text-white hover:bg-seguranca-graphite">Fatura</SelectItem>
              <SelectItem value="MEDICAO" className="text-white hover:bg-seguranca-graphite">Medição</SelectItem>
              <SelectItem value="SERVICO" className="text-white hover:bg-seguranca-graphite">Serviço</SelectItem>
              <SelectItem value="PRODUTO" className="text-white hover:bg-seguranca-graphite">Produto</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={onRefresh}
            variant="outline"
            className="border-gray-600 text-white hover:bg-seguranca-black"
          >
            <Download size={16} className="mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Tabela */}
        {contasFiltradas.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <p className="text-gray-400">Nenhuma conta a receber encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600 hover:bg-seguranca-black">
                  <TableHead className="text-seguranca-lightgray">Número</TableHead>
                  <TableHead className="text-seguranca-lightgray">Cliente</TableHead>
                  <TableHead className="text-seguranca-lightgray">Descrição</TableHead>
                  <TableHead className="text-seguranca-lightgray">Tipo</TableHead>
                  <TableHead className="text-seguranca-lightgray">Valor</TableHead>
                  <TableHead className="text-seguranca-lightgray">Vencimento</TableHead>
                  <TableHead className="text-seguranca-lightgray">Status</TableHead>
                  <TableHead className="text-seguranca-lightgray text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasFiltradas.map((conta) => (
                  <TableRow 
                    key={conta.id} 
                    className={`border-gray-600 hover:bg-seguranca-black ${
                      isVencida(conta.vencimento) && conta.status === 'ABERTA' ? 'bg-red-900/20' : ''
                    }`}
                  >
                    <TableCell className="text-white">
                      {conta.numeroFatura || '-'}
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400" />
                        {conta.cliente}
                      </div>
                    </TableCell>
                    <TableCell className="text-white max-w-[200px] truncate">
                      {conta.descricao}
                    </TableCell>
                    <TableCell>
                      {getTipoBadge(conta.tipo)}
                    </TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      {formatCurrency(conta.valor)}
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className={`
                          ${isVencida(conta.vencimento) && conta.status === 'ABERTA' ? 'text-red-400' : ''}
                          ${isVencendoEmBreve(conta.vencimento) && conta.status === 'ABERTA' ? 'text-yellow-400' : ''}
                        `}>
                          {format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {isVencida(conta.vencimento) && conta.status === 'ABERTA' && (
                          <AlertTriangle size={14} className="text-red-400" />
                        )}
                        {isVencendoEmBreve(conta.vencimento) && conta.status === 'ABERTA' && (
                          <Clock size={14} className="text-yellow-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(conta.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(conta)}
                          className="border-gray-600 text-white hover:bg-seguranca-black p-1"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(conta)}
                          className="border-blue-600 text-blue-400 hover:bg-blue-600/20 p-1"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Deseja excluir esta conta a receber?')) {
                              onDelete(conta.id!);
                            }
                          }}
                          className="border-red-600 text-red-400 hover:bg-red-600/20 p-1"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Resumo */}
        {contasFiltradas.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-400">Total de Contas</p>
                <p className="text-white font-semibold">{contasFiltradas.length}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Valor Total</p>
                <p className="text-green-400 font-semibold">
                  {formatCurrency(contasFiltradas.reduce((sum, conta) => sum + conta.valor, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Contas Abertas</p>
                <p className="text-yellow-400 font-semibold">
                  {contasFiltradas.filter(c => c.status === 'ABERTA').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
