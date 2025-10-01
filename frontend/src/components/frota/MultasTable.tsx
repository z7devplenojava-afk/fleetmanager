import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  Car,
  RefreshCw,
  User,
  FileText,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Multa {
  id: string;
  veiculo_id: string;
  placa: string;
  marca: string;
  modelo: string;
  motorista_id?: string;
  motorista_nome?: string;
  motorista_cnh?: string;
  data_infracao: string;
  data_vencimento: string;
  valor: number;
  pontos: number;
  tipo_infracao: string;
  local_infracao: string;
  status: 'pendente' | 'paga' | 'vencida';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface MultasTableProps {
  multas: Multa[];
  onRefresh: () => void;
  onEdit: (multa: Multa) => void;
  onDelete: (multa: Multa) => void;
  onDeleteMultiple?: (selectedIds: string[]) => void;
  onView: (multa: Multa) => void;
  onGenerateReport?: (selectedIds: string[], format: 'pdf' | 'excel') => void;
  showSelection?: boolean;
}

const MultasTable: React.FC<MultasTableProps> = ({
  multas,
  onRefresh,
  onEdit,
  onDelete,
  onDeleteMultiple,
  onView,
  onGenerateReport,
  showSelection = false
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMultas, setSelectedMultas] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paga':
        return 'bg-green-100 text-green-800';
      case 'vencida':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paga':
        return 'Paga';
      case 'vencida':
        return 'Vencida';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isVencida = (dataVencimento: string) => {
    return new Date(dataVencimento) < new Date();
  };

  // Funções de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMultas(multas.map(multa => multa.id));
      setIsAllSelected(true);
    } else {
      setSelectedMultas([]);
      setIsAllSelected(false);
    }
  };

  const handleSelectMulta = (multaId: string, checked: boolean) => {
    if (checked) {
      setSelectedMultas(prev => [...prev, multaId]);
    } else {
      setSelectedMultas(prev => prev.filter(id => id !== multaId));
    }
  };

  const handleGenerateReport = (format: 'pdf' | 'excel') => {
    if (selectedMultas.length === 0) {
      toast({
        title: 'Atenção!',
        description: 'Selecione pelo menos uma multa para gerar o relatório.',
        variant: 'destructive',
      });
      return;
    }

    if (onGenerateReport) {
      onGenerateReport(selectedMultas, format);
    }
  };

  const handleDeleteMultiple = () => {
    if (selectedMultas.length === 0) {
      toast({
        title: 'Atenção!',
        description: 'Selecione pelo menos uma multa para excluir.',
        variant: 'destructive',
      });
      return;
    }

    if (onDeleteMultiple) {
      onDeleteMultiple(selectedMultas);
    }
  };

  // Atualizar estado de "selecionar todos" quando multas mudarem
  useEffect(() => {
    if (selectedMultas.length === multas.length && multas.length > 0) {
      setIsAllSelected(true);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedMultas, multas.length]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh();
      toast({
        title: 'Sucesso!',
        description: 'Lista de multas atualizada.',
      });
    } catch (error) {
      toast({
        title: 'Erro!',
        description: 'Erro ao atualizar lista de multas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (multas.length === 0) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Nenhuma multa encontrada
            </h3>
            <p className="text-gray-400">
              Não há multas registradas no sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-seguranca-lightgray">
            Multas ({multas.length})
          </h3>
          {showSelection && selectedMultas.length > 0 && (
            <Badge variant="outline" className="border-blue-600 text-blue-400">
              {selectedMultas.length} selecionada{selectedMultas.length > 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        
        {showSelection && selectedMultas.length > 0 && (
          <div className="flex items-center space-x-2">
            {onDeleteMultiple && (
              <Button
                onClick={handleDeleteMultiple}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir ({selectedMultas.length})
              </Button>
            )}
            {onGenerateReport && (
              <>
                <Button
                  onClick={() => handleGenerateReport('pdf')}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  onClick={() => handleGenerateReport('excel')}
                  size="sm"
                  variant="outline"
                  className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              {showSelection && (
                <TableHead className="text-seguranca-lightgray w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="border-gray-400"
                  />
                </TableHead>
              )}
              <TableHead className="text-seguranca-lightgray">Veículo</TableHead>
              <TableHead className="text-seguranca-lightgray">Motorista</TableHead>
              <TableHead className="text-seguranca-lightgray">Infração</TableHead>
              <TableHead className="text-seguranca-lightgray">Data Infração</TableHead>
              <TableHead className="text-seguranca-lightgray">Vencimento</TableHead>
              <TableHead className="text-seguranca-lightgray">Valor</TableHead>
              <TableHead className="text-seguranca-lightgray">Pontos</TableHead>
              <TableHead className="text-seguranca-lightgray">Status</TableHead>
              <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {multas.map((multa) => (
              <TableRow key={multa.id} className="border-gray-600 hover:bg-seguranca-black">
                {showSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selectedMultas.includes(multa.id)}
                      onCheckedChange={(checked) => handleSelectMulta(multa.id, checked as boolean)}
                      className="border-gray-400"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-seguranca-red rounded-full flex items-center justify-center">
                      <Car className="text-white" size={16} />
                    </div>
                    <div>
                      <div className="font-medium text-seguranca-lightgray">{multa.placa}</div>
                      <div className="text-sm text-gray-400">{multa.marca} {multa.modelo}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="text-white" size={12} />
                    </div>
                    <div>
                      <div className="font-medium text-seguranca-lightgray">
                        {multa.motorista_nome || 'Não informado'}
                      </div>
                      {multa.motorista_cnh && (
                        <div className="text-sm text-gray-400">CNH: {multa.motorista_cnh}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-seguranca-lightgray">{multa.tipo_infracao}</div>
                    <div className="text-sm text-gray-400">{multa.local_infracao}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-seguranca-lightgray">{formatDate(multa.data_infracao)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center space-x-2 ${isVencida(multa.data_vencimento) ? 'text-red-500' : ''}`}>
                    <Calendar size={14} className="text-gray-400" />
                    <span className={isVencida(multa.data_vencimento) ? 'text-red-500 font-medium' : 'text-seguranca-lightgray'}>
                      {formatDate(multa.data_vencimento)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="font-medium text-seguranca-lightgray">
                      {formatCurrency(multa.valor)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-gray-600 text-seguranca-lightgray">
                    {multa.pontos} pts
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(multa.status)}>
                    {getStatusText(multa.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(multa)}
                      title="Visualizar Multa"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(multa)}
                      title="Editar Multa"
                      className="text-green-600 hover:text-green-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(multa)}
                      title="Excluir Multa"
                      className="text-red-600 hover:text-red-700"
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
    </div>
  );
};

export default MultasTable; 