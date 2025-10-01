import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Plus,
  Calendar,
  User,
  Shield,
  FileText
} from 'lucide-react';
import { EPIControlRecord } from '@/types/epiControl';

interface EPIControlTableProps {
  records: EPIControlRecord[];
  onView: (record: EPIControlRecord) => void;
  onEdit: (record: EPIControlRecord) => void;
  onDelete: (record: EPIControlRecord) => void;
  onGenerateReport: (record: EPIControlRecord) => void;
  onGenerateReceipt: (record: EPIControlRecord) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

const EPIControlTable: React.FC<EPIControlTableProps> = ({
  records,
  onView,
  onEdit,
  onDelete,
  onGenerateReport,
  onGenerateReceipt,
  onCreateNew,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DISMISSED'>('ALL');

  // Filtrar registros
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeFunction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeCpf.includes(searchTerm) ||
      record.employeeRg.includes(searchTerm);
    
    const matchesStatus = 
      filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && !record.dismissalDate) ||
      (filterStatus === 'DISMISSED' && record.dismissalDate);
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (record: EPIControlRecord) => {
    if (record.dismissalDate) {
      return <Badge variant="destructive">Demitido</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  const getEquipmentCount = (record: EPIControlRecord): number => {
    return record.equipmentItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <Shield className="h-5 w-5 text-seguranca-yellow" />
            Controle de EPI - Registros
          </CardTitle>
          <Button onClick={onCreateNew} className="flex items-center gap-2 bg-seguranca-red hover:bg-seguranca-darkred">
            <Plus className="h-4 w-4" />
            Novo Registro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, função, CPF ou RG..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('ALL')}
              className={filterStatus === 'ALL' 
                ? 'bg-seguranca-red hover:bg-seguranca-darkred' 
                : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black'
              }
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === 'ACTIVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('ACTIVE')}
              className={filterStatus === 'ACTIVE' 
                ? 'bg-seguranca-red hover:bg-seguranca-darkred' 
                : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black'
              }
            >
              Ativos
            </Button>
            <Button
              variant={filterStatus === 'DISMISSED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('DISMISSED')}
              className={filterStatus === 'DISMISSED' 
                ? 'bg-seguranca-red hover:bg-seguranca-darkred' 
                : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black'
              }
            >
              Demitidos
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Data Admissão</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead>Qtd EPIs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Carregando registros...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{record.employeeName}</div>
                        <div className="text-sm text-gray-500">RG: {record.employeeRg}</div>
                      </div>
                    </TableCell>
                    <TableCell>{record.employeeFunction}</TableCell>
                    <TableCell>{record.employeeCpf}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(record.admissionDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(record.deliveryDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        {getEquipmentCount(record)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(record)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(record)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onGenerateReceipt(record)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Gerar Recibo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onGenerateReport(record)}>
                            <Download className="h-4 w-4 mr-2" />
                            Gerar Relatório
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(record)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{records.length}</div>
            <div className="text-sm text-gray-600">Total de Registros</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {records.filter(r => !r.dismissalDate).length}
            </div>
            <div className="text-sm text-gray-600">Funcionários Ativos</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {records.filter(r => r.dismissalDate).length}
            </div>
            <div className="text-sm text-gray-600">Funcionários Demitidos</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {records.reduce((total, record) => total + getEquipmentCount(record), 0)}
            </div>
            <div className="text-sm text-gray-600">Total de EPIs</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EPIControlTable;
