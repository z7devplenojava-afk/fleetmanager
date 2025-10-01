import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGuard from '@/components/PermissionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  User,
  AlertCircle 
} from 'lucide-react';
import { getRoleDisplayName } from '@/utils/permissions';

interface Payslip {
  id: string;
  month: string;
  year: number;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  bonuses: number;
  status: 'pending' | 'approved' | 'paid';
  downloadUrl?: string;
}

const PayslipView: React.FC = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de holerites
    const mockPayslips: Payslip[] = [
      {
        id: '1',
        month: 'Janeiro',
        year: 2024,
        grossSalary: 2500.00,
        netSalary: 2200.00,
        deductions: 300.00,
        bonuses: 0,
        status: 'paid',
        downloadUrl: '/api/payslips/1/download'
      },
      {
        id: '2',
        month: 'Fevereiro',
        year: 2024,
        grossSalary: 2500.00,
        netSalary: 2250.00,
        deductions: 250.00,
        bonuses: 0,
        status: 'paid',
        downloadUrl: '/api/payslips/2/download'
      },
      {
        id: '3',
        month: 'Março',
        year: 2024,
        grossSalary: 2500.00,
        netSalary: 2300.00,
        deductions: 200.00,
        bonuses: 0,
        status: 'approved',
        downloadUrl: '/api/payslips/3/download'
      }
    ];

    setTimeout(() => {
      setPayslips(mockPayslips);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDownload = async (payslip: Payslip) => {
    try {
      // Simular download
      console.log('Downloading payslip:', payslip.id);
      // Em produção, aqui faria a requisição para o backend
      alert(`Download iniciado para holerite de ${payslip.month}/${payslip.year}`);
    } catch (error) {
      console.error('Erro ao baixar holerite:', error);
    }
  };

  const handleView = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando holerites...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="PAYSLIPS_READ">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Holerites</h1>
          <p className="text-gray-600">
            Visualize e baixe seus holerites mensais
          </p>
          
          {user && (
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">{user.name}</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {getRoleDisplayName(user.role)}
              </Badge>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando holerites...</p>
          </div>
        ) : payslips.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum holerite encontrado
            </h3>
            <p className="text-gray-600">
              Não há holerites disponíveis para visualização.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {payslips.map((payslip) => (
              <Card key={payslip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-red-600" />
                        <span>{payslip.month}/{payslip.year}</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Status: {getStatusText(payslip.status)}
                      </p>
                    </div>
                    <Badge className={`${
                      payslip.status === 'paid' ? 'bg-green-100 text-green-800' :
                      payslip.status === 'approved' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(payslip.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salário Bruto:</span>
                      <span className="font-semibold">R$ {payslip.grossSalary.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descontos:</span>
                      <span className="text-red-600">-R$ {payslip.deductions.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonificações:</span>
                      <span className="text-green-600">+R$ {payslip.bonuses.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold">Salário Líquido:</span>
                        <span className="font-bold text-lg text-green-600">
                          R$ {payslip.netSalary.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-4">
                    <PermissionGuard permission="PAYSLIPS_READ">
                      <Button
                        variant="outline"
                        onClick={() => handleView(payslip)}
                        className="flex items-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Visualizar</span>
                      </Button>
                    </PermissionGuard>
                    
                    <PermissionGuard permission="PAYSLIPS_CREATE">
                      <Button
                        onClick={() => handleDownload(payslip)}
                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
                      >
                        <Download className="h-4 w-4" />
                        <span>Baixar PDF</span>
                      </Button>
                    </PermissionGuard>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de visualização (simplificado) */}
        {selectedPayslip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Detalhes do Holerite</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPayslip(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Informações do Colaborador</h3>
                    <p><strong>Nome:</strong> {user?.name}</p>
                    <p><strong>Cargo:</strong> {user?.position || 'Não informado'}</p>
                    <p><strong>Departamento:</strong> {user?.department || 'Não informado'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Período</h3>
                    <p><strong>Mês:</strong> {selectedPayslip.month}</p>
                    <p><strong>Ano:</strong> {selectedPayslip.year}</p>
                    <p><strong>Status:</strong> {getStatusText(selectedPayslip.status)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Resumo Salarial</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p><strong>Salário Bruto:</strong> R$ {selectedPayslip.grossSalary.toFixed(2)}</p>
                        <p><strong>Descontos:</strong> R$ {selectedPayslip.deductions.toFixed(2)}</p>
                      </div>
                      <div>
                        <p><strong>Bonificações:</strong> R$ {selectedPayslip.bonuses.toFixed(2)}</p>
                        <p><strong>Salário Líquido:</strong> R$ {selectedPayslip.netSalary.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default PayslipView; 