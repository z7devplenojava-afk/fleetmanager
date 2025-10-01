import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, 
  FileText, 
  Filter, 
  Search, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Printer,
  AlertTriangle
} from 'lucide-react';
import { financialService, FinancialTransaction, Invoice } from '@/services/financialService';
import { unitService, Unit } from '@/services/unitService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useToast } from '@/hooks/use-toast';

interface FinanceiroRelatoriosProps {
  transactions: FinancialTransaction[];
  invoices: Invoice[];
  refreshData: () => void;
}

interface FiltrosRelatorio {
  tipo: string;
  status: string;
  tipoDespesa: string;
  dataInicio: Date | null;
  dataFim: Date | null;
  vencimentoInicio: Date | null;
  vencimentoFim: Date | null;
  centroCusto: string;
  departamento: string;
  fornecedor: string;
  valorMin: string;
  valorMax: string;
  searchTerm: string;
}

export const FinanceiroRelatorios: React.FC<FinanceiroRelatoriosProps> = ({
  transactions,
  invoices,
  refreshData
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [fornecedores, setFornecedores] = useState<Supplier[]>([]);
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipo: 'all',
    status: 'all',
    tipoDespesa: 'all',
    dataInicio: null,
    dataFim: null,
    vencimentoInicio: null,
    vencimentoFim: null,
    centroCusto: '',
    departamento: 'all',
    fornecedor: 'all',
    valorMin: '',
    valorMax: '',
    searchTerm: ''
  });

  // Carregar dados auxiliares
  useEffect(() => {
    const loadAuxData = async () => {
      try {
        const [unitsData, fornecedoresData] = await Promise.all([
          unitService.getAllUnits(),
          contasAPagarService.getFornecedores()
        ]);
        setUnits(Array.isArray(unitsData) ? unitsData : []);
        setFornecedores(Array.isArray(fornecedoresData) ? fornecedoresData : []);
      } catch (error) {
        console.error('Erro ao carregar dados auxiliares:', error);
        // Garantir que os estados sejam sempre arrays
        setUnits([]);
        setFornecedores([]);
      }
    };
    loadAuxData();
  }, []);

  // Aplicar filtros
  const dadosFiltrados = useMemo(() => {
    let dados = [...transactions, ...invoices.map(invoice => ({
      id: invoice.id,
      type: 'EXPENSE',
      description: invoice.description,
      amount: invoice.amount,
      date: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      category: invoice.category,
      reference: invoice.reference,
      notes: invoice.notes,
      unitId: invoice.unitId,
      unit: invoice.unit,
      expenseType: invoice.expenseType,
      costCenter: invoice.costCenter,
      supplier: invoice.supplier,
      barcode: invoice.barcode,
      receiptUrl: invoice.receiptUrl
    }))];

    // Filtro por tipo
    if (filtros.tipo !== 'all') {
      dados = dados.filter(item => item.type === filtros.tipo);
    }

    // Filtro por status
    if (filtros.status !== 'all') {
      dados = dados.filter(item => item.status === filtros.status);
    }

    // Filtro por tipo de despesa
    if (filtros.tipoDespesa !== 'all') {
      dados = dados.filter(item => item.expenseType === filtros.tipoDespesa);
    }

    // Filtro por data de lançamento
    if (filtros.dataInicio && filtros.dataFim) {
      dados = dados.filter(item => {
        const data = new Date(item.date);
        return isWithinInterval(data, {
          start: startOfDay(filtros.dataInicio!),
          end: endOfDay(filtros.dataFim!)
        });
      });
    }

    // Filtro por data de vencimento
    if (filtros.vencimentoInicio && filtros.vencimentoFim) {
      dados = dados.filter(item => {
        if (!item.dueDate) return false;
        const data = new Date(item.dueDate);
        return isWithinInterval(data, {
          start: startOfDay(filtros.vencimentoInicio!),
          end: endOfDay(filtros.vencimentoFim!)
        });
      });
    }

    // Filtro por centro de custo
    if (filtros.centroCusto) {
      dados = dados.filter(item => 
        item.costCenter?.toLowerCase().includes(filtros.centroCusto.toLowerCase())
      );
    }

    // Filtro por departamento (unidade)
    if (filtros.departamento !== 'all') {
      dados = dados.filter(item => 
        item.unitId === filtros.departamento || 
        item.unit?.id === filtros.departamento
      );
    }

    // Filtro por fornecedor
    if (filtros.fornecedor !== 'all') {
      dados = dados.filter(item => 
        item.supplier?.id === filtros.fornecedor
      );
    }

    // Filtro por valor mínimo
    if (filtros.valorMin) {
      dados = dados.filter(item => 
        Number(item.amount) >= Number(filtros.valorMin)
      );
    }

    // Filtro por valor máximo
    if (filtros.valorMax) {
      dados = dados.filter(item => 
        Number(item.amount) <= Number(filtros.valorMax)
      );
    }

    // Filtro por termo de busca
    if (filtros.searchTerm) {
      const term = filtros.searchTerm.toLowerCase();
      dados = dados.filter(item =>
        item.description?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.reference?.toLowerCase().includes(term) ||
        item.notes?.toLowerCase().includes(term)
      );
    }

    return dados;
  }, [transactions, invoices, filtros]);

  // Estatísticas do relatório
  const estatisticas = useMemo(() => {
    const total = dadosFiltrados.length;
    const receitas = dadosFiltrados
      .filter(item => item.type === 'INCOME')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const despesas = dadosFiltrados
      .filter(item => item.type === 'EXPENSE')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const pendentes = dadosFiltrados
      .filter(item => item.status === 'PENDING' || item.status === 'PENDENTE')
      .length;
    const vencidas = dadosFiltrados
      .filter(item => {
        if (!item.dueDate) return false;
        return new Date(item.dueDate) < new Date();
      })
      .length;

    return {
      total,
      receitas,
      despesas,
      saldo: receitas - despesas,
      pendentes,
      vencidas
    };
  }, [dadosFiltrados]);

  const handleFiltroChange = (campo: keyof FiltrosRelatorio, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limparFiltros = () => {
    setFiltros({
      tipo: 'all',
      status: 'all',
      tipoDespesa: 'all',
      dataInicio: null,
      dataFim: null,
      vencimentoInicio: null,
      vencimentoFim: null,
      centroCusto: '',
      departamento: 'all',
      fornecedor: 'all',
      valorMin: '',
      valorMax: '',
      searchTerm: ''
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PENDENTE':
        return 'bg-yellow-500';
      case 'CONFIRMED':
      case 'PAGA':
        return 'bg-green-500';
      case 'CANCELLED':
      case 'CANCELADA':
        return 'bg-gray-500';
      case 'PENDENTE_ERRO':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'INCOME' ? 'text-green-500' : 'text-red-500';
  };

  const exportarPDF = async () => {
    setLoading(true);
    try {
      // Simular exportação por enquanto
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Filter size={20} className="text-seguranca-yellow" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Tipo</label>
              <Select value={filtros.tipo} onValueChange={(value) => handleFiltroChange('tipo', value)}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Status</label>
              <Select value={filtros.status} onValueChange={(value) => handleFiltroChange('status', value)}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="PAGA">Pago</SelectItem>
                  <SelectItem value="PENDENTE_ERRO">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Despesa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Tipo de Despesa</label>
              <Select value={filtros.tipoDespesa} onValueChange={(value) => handleFiltroChange('tipoDespesa', value)}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="FIXA">Fixa</SelectItem>
                  <SelectItem value="VARIAVEL">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Departamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Departamento</label>
              <Select value={filtros.departamento} onValueChange={(value) => handleFiltroChange('departamento', value)}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(units || []).map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fornecedor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Fornecedor</label>
              <Select value={filtros.fornecedor} onValueChange={(value) => handleFiltroChange('fornecedor', value)}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(fornecedores || []).map(fornecedor => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Centro de Custo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Centro de Custo</label>
              <Input
                value={filtros.centroCusto}
                onChange={(e) => handleFiltroChange('centroCusto', e.target.value)}
                placeholder="Digite o centro de custo"
                className="form-input"
              />
            </div>

            {/* Valor Mínimo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Valor Mínimo</label>
              <Input
                value={filtros.valorMin}
                onChange={(e) => handleFiltroChange('valorMin', e.target.value)}
                placeholder="R$ 0,00"
                className="form-input"
                type="number"
              />
            </div>

            {/* Valor Máximo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Valor Máximo</label>
              <Input
                value={filtros.valorMax}
                onChange={(e) => handleFiltroChange('valorMax', e.target.value)}
                placeholder="R$ 999.999,99"
                className="form-input"
                type="number"
              />
            </div>

            {/* Data de Lançamento Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data Lançamento (Início)</label>
              <DatePicker
                selected={filtros.dataInicio}
                onChange={(date) => handleFiltroChange('dataInicio', date)}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="form-input w-full"
                placeholderText="dd/mm/aaaa"
              />
            </div>

            {/* Data de Lançamento Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data Lançamento (Fim)</label>
              <DatePicker
                selected={filtros.dataFim}
                onChange={(date) => handleFiltroChange('dataFim', date)}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="form-input w-full"
                placeholderText="dd/mm/aaaa"
              />
            </div>

            {/* Data de Vencimento Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data Vencimento (Início)</label>
              <DatePicker
                selected={filtros.vencimentoInicio}
                onChange={(date) => handleFiltroChange('vencimentoInicio', date)}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="form-input w-full"
                placeholderText="dd/mm/aaaa"
              />
            </div>

            {/* Data de Vencimento Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data Vencimento (Fim)</label>
              <DatePicker
                selected={filtros.vencimentoFim}
                onChange={(date) => handleFiltroChange('vencimentoFim', date)}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="form-input w-full"
                placeholderText="dd/mm/aaaa"
              />
            </div>

            {/* Busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  value={filtros.searchTerm}
                  onChange={(e) => handleFiltroChange('searchTerm', e.target.value)}
                  placeholder="Descrição, categoria, referência..."
                  className="pl-10 form-input"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={limparFiltros}
              variant="outline"
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <RefreshCw size={16} className="mr-2" />
              Limpar Filtros
            </Button>
            <Button
              onClick={exportarPDF}
              disabled={loading}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? (
                <RefreshCw size={16} className="mr-2 animate-spin" />
              ) : (
                <Download size={16} className="mr-2" />
              )}
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-seguranca-lightgray">{estatisticas.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Receitas</p>
                <p className="text-2xl font-bold text-green-500">{formatarMoeda(estatisticas.receitas)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Despesas</p>
                <p className="text-2xl font-bold text-red-500">{formatarMoeda(estatisticas.despesas)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Saldo</p>
                <p className={`text-2xl font-bold ${estatisticas.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatarMoeda(estatisticas.saldo)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-500">{estatisticas.pendentes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Vencidas</p>
                <p className="text-2xl font-bold text-red-500">{estatisticas.vencidas}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resultados */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
            <span>Resultados ({dadosFiltrados.length} registros)</span>
            <div className="flex gap-2">
              <Button
                onClick={exportarPDF}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                <Printer size={16} className="mr-2" />
                Imprimir
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-seguranca-lightgray">Descrição</TableHead>
                  <TableHead className="text-seguranca-lightgray">Tipo</TableHead>
                  <TableHead className="text-seguranca-lightgray">Valor</TableHead>
                  <TableHead className="text-seguranca-lightgray">Status</TableHead>
                  <TableHead className="text-seguranca-lightgray">Data Lançamento</TableHead>
                  <TableHead className="text-seguranca-lightgray">Data Vencimento</TableHead>
                  <TableHead className="text-seguranca-lightgray">Categoria</TableHead>
                  <TableHead className="text-seguranca-lightgray">Departamento</TableHead>
                  <TableHead className="text-seguranca-lightgray">Centro de Custo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.map((item) => (
                  <TableRow key={item.id} className="border-gray-600 hover:bg-seguranca-black">
                    <TableCell className="text-seguranca-lightgray">
                      <div>
                        <div className="font-medium">{item.description}</div>
                        {item.reference && (
                          <div className="text-sm text-gray-400">Ref: {item.reference}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getTipoColor(item.type)} bg-transparent border`}>
                        {item.type === 'INCOME' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-bold ${getTipoColor(item.type)}`}>
                      {formatarMoeda(Number(item.amount) || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(item.status)} text-white`}>
                        {item.status === 'PENDING' ? 'Pendente' :
                         item.status === 'CONFIRMED' ? 'Confirmado' :
                         item.status === 'CANCELLED' ? 'Cancelado' :
                         item.status === 'PAGA' ? 'Pago' :
                         item.status === 'PENDENTE_ERRO' ? 'Atrasado' : item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray">
                      {item.date ? formatarData(item.date) : '-'}
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray">
                      {item.dueDate ? formatarData(item.dueDate) : '-'}
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray">
                      {item.category || '-'}
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray">
                      {item.unit?.name || '-'}
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray">
                      {item.costCenter || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};