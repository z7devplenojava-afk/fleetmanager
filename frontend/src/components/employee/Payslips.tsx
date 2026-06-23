import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Search,
  Filter,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Payslip {
  id: string;
  referenceMonth: string;
  paymentDate: string;
  grossSalary: number;
  netSalary: number;
  totalDiscounts: number;
  totalBenefits: number;
  totalAdditions: number;
  workedDays: number;
  absentDays: number;
  overtimeHours: number;
  status: 'PAID' | 'PENDING' | 'PROCESSING';
  createdAt: string;
  downloadUrl?: string;
}

const Payslips: React.FC = () => {
  const { toast } = useToast();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // Dados mockados para funcionar offline
  const mockPayslips: Payslip[] = [
    {
      id: '1',
      referenceMonth: 'Dezembro/2024',
      paymentDate: '2024-12-05',
      grossSalary: 3500.00,
      netSalary: 2845.50,
      totalDiscounts: 654.50,
      totalBenefits: 200.00,
      totalAdditions: 150.00,
      workedDays: 22,
      absentDays: 0,
      overtimeHours: 8,
      status: 'PAID',
      createdAt: '2024-12-01T00:00:00Z'
    },
    {
      id: '2',
      referenceMonth: 'Novembro/2024',
      paymentDate: '2024-11-05',
      grossSalary: 3500.00,
      netSalary: 2845.50,
      totalDiscounts: 654.50,
      totalBenefits: 200.00,
      totalAdditions: 100.00,
      workedDays: 20,
      absentDays: 2,
      overtimeHours: 4,
      status: 'PAID',
      createdAt: '2024-11-01T00:00:00Z'
    },
    {
      id: '3',
      referenceMonth: 'Outubro/2024',
      paymentDate: '2024-10-05',
      grossSalary: 3500.00,
      netSalary: 2845.50,
      totalDiscounts: 654.50,
      totalBenefits: 200.00,
      totalAdditions: 120.00,
      workedDays: 21,
      absentDays: 1,
      overtimeHours: 6,
      status: 'PAID',
      createdAt: '2024-10-01T00:00:00Z'
    }
  ];

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    setLoading(true);
    try {
      // Simulação de carregamento
      setTimeout(() => {
        setPayslips(mockPayslips);
        setLoading(false);
      }, 500);
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Backend offline - exibindo dados mockados',
        variant: 'default',
      });
      setPayslips(mockPayslips);
      setLoading(false);
    }
  };

  const handleDownload = (payslip: Payslip) => {
    toast({
      title: 'Informação',
      description: `Download simulado - Backend offline. Holerite: ${payslip.referenceMonth}`,
      variant: 'default',
    });
  };

  const handleViewDetails = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
  };

  const filteredPayslips = payslips.filter(payslip => {
    const matchesSearch = payslip.referenceMonth.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payslip.status === statusFilter;
    const matchesYear = yearFilter === 'all' || payslip.referenceMonth.includes(yearFilter);
    return matchesSearch && matchesStatus && matchesYear;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pago';
      case 'PENDING':
        return 'Pendente';
      case 'PROCESSING':
        return 'Processando';
      default:
        return status;
    }
  };

  const calculateTotalStats = () => {
    const paidPayslips = filteredPayslips.filter(p => p.status === 'PAID');
    const totalGross = paidPayslips.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalNet = paidPayslips.reduce((sum, p) => sum + p.netSalary, 0);
    const totalDiscounts = paidPayslips.reduce((sum, p) => sum + p.totalDiscounts, 0);
    
    return { totalGross, totalNet, totalDiscounts };
  };

  const stats = calculateTotalStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Holerites</h1>
          <p className="text-muted-foreground">Consulte e baixe seus holerites mensais</p>
        </div>
        <Button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white">
          <Download className="h-4 w-4" />
          <span>Baixar Todos</span>
        </Button>
      </div>

      {/* Status do Sistema */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">
            🟡 <strong>Backend Offline:</strong> Funcionalidade simulada com dados mockados. Downloads não funcionarão até que o backend esteja online.
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ {stats.totalGross.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {stats.totalNet.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor recebido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Descontos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {stats.totalDiscounts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Impostos e deduções</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Filter className="h-5 w-5 mr-2 text-red-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por mês..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PAID">Pagos</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="PROCESSING">Processando</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payslips List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <FileText className="h-5 w-5 mr-2 text-red-500" />
            Holerites ({filteredPayslips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayslips.map((payslip) => (
              <div key={payslip.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-foreground">{payslip.referenceMonth}</h3>
                    <Badge className={getStatusColor(payslip.status)}>
                      {getStatusLabel(payslip.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Salário Bruto:</span>
                      <span className="ml-2 font-medium">R$ {payslip.grossSalary.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Salário Líquido:</span>
                      <span className="ml-2 font-medium text-green-600">R$ {payslip.netSalary.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dias Trab:</span>
                      <span className="ml-2 font-medium">{payslip.workedDays}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hora Extra:</span>
                      <span className="ml-2 font-medium">{payslip.overtimeHours}h</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(payslip)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Detalhes</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(payslip)}
                    className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar</span>
                  </Button>
                </div>
              </div>
            ))}
            {filteredPayslips.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Nenhum holerite encontrado</p>
                <p className="text-sm">Tente ajustar os filtros</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedPayslip && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center justify-between">
              <span>Detalhes do Holerite - {selectedPayslip.referenceMonth}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayslip(null)}
              >
                Fechar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">Informações Gerais</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mês de Referência:</span>
                    <span className="font-medium">{selectedPayslip.referenceMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Pagamento:</span>
                    <span className="font-medium">{new Date(selectedPayslip.paymentDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(selectedPayslip.status)}>
                      {getStatusLabel(selectedPayslip.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-3">Valores</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salário Bruto:</span>
                    <span className="font-medium">R$ {selectedPayslip.grossSalary.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Benefícios:</span>
                    <span className="font-medium text-green-600">+R$ {selectedPayslip.totalBenefits.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Adicionais:</span>
                    <span className="font-medium text-green-600">+R$ {selectedPayslip.totalAdditions.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descontos:</span>
                    <span className="font-medium text-red-600">-R$ {selectedPayslip.totalDiscounts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Salário Líquido:</span>
                    <span className="text-green-600">R$ {selectedPayslip.netSalary.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-card rounded border">
                <p className="text-sm text-muted-foreground">Dias Trabalhados</p>
                <p className="text-xl font-bold text-foreground">{selectedPayslip.workedDays}</p>
              </div>
              <div className="text-center p-4 bg-card rounded border">
                <p className="text-sm text-muted-foreground">Dias de Falta</p>
                <p className="text-xl font-bold text-red-600">{selectedPayslip.absentDays}</p>
              </div>
              <div className="text-center p-4 bg-card rounded border">
                <p className="text-sm text-muted-foreground">Horas Extras</p>
                <p className="text-xl font-bold text-orange-600">{selectedPayslip.overtimeHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Payslips;
