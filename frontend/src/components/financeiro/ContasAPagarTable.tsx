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
  Calendar
} from 'lucide-react';
import { ContaAPagar } from './ContasAPagarFormModal';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface ContasAPagarTableProps {
  contas: ContaAPagar[];
  onEdit: (conta: ContaAPagar) => void;
  onDelete: (id: string) => void;
  onView: (conta: ContaAPagar) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const ContasAPagarTable: React.FC<ContasAPagarTableProps> = ({
  contas,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [fornecedorFilter, setFornecedorFilter] = useState('');

  // Filtrar contas
  const contasFiltradas = contas.filter(conta => {
    const matchesSearch = 
      conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.codigoBarras?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || conta.status === statusFilter;
    const matchesTipo = !tipoFilter || conta.tipo === tipoFilter;
    const matchesFornecedor = !fornecedorFilter || conta.fornecedor.toLowerCase().includes(fornecedorFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesTipo && matchesFornecedor;
  });

  // Calcular estatísticas
  const stats = {
    total: contas.length,
    abertas: contas.filter(c => c.status === 'ABERTA').length,
    vencidas: contas.filter(c => c.status === 'VENCIDA' || (c.status === 'ABERTA' && isBefore(c.vencimento, new Date()))).length,
    pagas: contas.filter(c => c.status === 'PAGA').length,
    totalValor: contas.reduce((sum, c) => sum + c.valor, 0),
    totalVencidas: contas.filter(c => c.status === 'VENCIDA' || (c.status === 'ABERTA' && isBefore(c.vencimento, new Date()))).reduce((sum, c) => sum + c.valor, 0),
    vencendoEm7Dias: contas.filter(c => c.status === 'ABERTA' && isAfter(c.vencimento, new Date()) && isBefore(c.vencimento, addDays(new Date(), 7))).length
  };

  const getStatusBadge = (status: string, vencimento: Date) => {
    // Verificar se está vencida
    if ((status === 'ABERTA' || status === 'ATRASADA') && isBefore(vencimento, new Date())) {
      return <Badge className="bg-seguranca-red text-white flex items-center gap-1">
        <AlertTriangle size={12} />
        Vencida
      </Badge>;
    }

    switch (status) {
      case 'PAGA':
        return <Badge className="bg-green-600 text-white flex items-center gap-1">
          <CheckCircle size={12} />
          Paga
        </Badge>;
      case 'ABERTA':
        return <Badge className="bg-seguranca-lightgray text-seguranca-black flex items-center gap-1">
          <Clock size={12} />
          Aberta
        </Badge>;
      case 'ATRASADA':
        return <Badge className="bg-seguranca-yellow text-seguranca-black flex items-center gap-1">
          <AlertTriangle size={12} />
          Atrasada
        </Badge>;
      case 'CANCELADA':
        return <Badge className="bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 flex items-center gap-1">
          <XCircle size={12} />
          Cancelada
        </Badge>;
      default:
        return <Badge className="bg-seguranca-lightgray text-seguranca-black">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'FIXA' 
      ? <Badge className="bg-seguranca-yellow text-seguranca-black">Fixa</Badge>
      : <Badge className="bg-seguranca-graphite text-seguranca-lightgray">Variável</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isVencendoEmBreve = (vencimento: Date) => {
    const hoje = new Date();
    const em7Dias = addDays(hoje, 7);
    return isAfter(vencimento, hoje) && isBefore(vencimento, em7Dias);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando contas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Listagem de Contas */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar size={20} />
              Listagem de Contas a Pagar
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
            >
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="bg-gray-800 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600 bg-gray-700">
                  <TableHead className="text-gray-200 font-semibold">Vencimento</TableHead>
                  <TableHead className="text-gray-200 font-semibold">Fornecedor</TableHead>
                  <TableHead className="text-gray-200 font-semibold">Descrição</TableHead>
                  <TableHead className="text-gray-200 font-semibold">Tipo</TableHead>
                  <TableHead className="text-gray-200 font-semibold">Valor</TableHead>
                  <TableHead className="text-gray-200 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-200 font-semibold">Baixa</TableHead>
                  <TableHead className="text-gray-200 font-semibold">Dt. Pagamento</TableHead>
                  <TableHead className="text-gray-200 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasFiltradas.map((conta) => (
                  <TableRow 
                    key={conta.id} 
                    className={`
                      border-gray-600 hover:bg-gray-700 transition-colors duration-200
                      ${isVencendoEmBreve(conta.vencimento) && conta.status === 'ABERTA' ? 'bg-yellow-500/10 border-yellow-500/30' : ''}
                      ${isBefore(conta.vencimento, new Date()) && conta.status === 'ABERTA' ? 'bg-red-500/10 border-red-500/30' : ''}
                    `}
                  >
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        {isVencendoEmBreve(conta.vencimento) && conta.status === 'ABERTA' && (
                          <AlertTriangle size={16} className="text-yellow-500" />
                        )}
                        {isBefore(conta.vencimento, new Date()) && conta.status === 'ABERTA' && (
                          <AlertTriangle size={16} className="text-red-500" />
                        )}
                        <span className={`
                          ${isBefore(conta.vencimento, new Date()) && conta.status === 'ABERTA' ? 'text-red-400 font-medium' : 'text-gray-300'}
                          ${isVencendoEmBreve(conta.vencimento) && conta.status === 'ABERTA' ? 'text-yellow-400' : ''}
                        `}>
                          {format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-200">{conta.fornecedor}</TableCell>
                    <TableCell className="text-gray-300">
                      <div className="max-w-xs truncate" title={conta.descricao}>
                        {conta.descricao}
                      </div>
                    </TableCell>
                    <TableCell>{getTipoBadge(conta.tipo)}</TableCell>
                    <TableCell className="font-semibold text-gray-200">{formatCurrency(conta.valor)}</TableCell>
                    <TableCell>{getStatusBadge(conta.status, conta.vencimento)}</TableCell>
                    <TableCell>
                      {conta.baixa ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {conta.dataPagamento ? format(conta.dataPagamento, 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            console.log('Botão de visualização clicado para conta:', conta);
                            onView(conta);
                          }} 
                          className="text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors duration-200"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEdit(conta)} 
                          className="text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors duration-200"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDelete(conta.id!)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {contasFiltradas.length === 0 && (
              <div className="text-center py-12 bg-gray-800">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-lg font-medium">Nenhuma conta encontrada</p>
                    <p className="text-gray-500 text-sm mt-1">Ajuste os filtros para ver mais resultados</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};