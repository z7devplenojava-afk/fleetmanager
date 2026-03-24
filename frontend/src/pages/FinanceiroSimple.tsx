import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FinanceiroSimple: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Dados mock para teste
  const mockTransactions = [
    {
      id: '1',
      description: 'Pagamento de fornecedor',
      amount: 1500,
      type: 'EXPENSE',
      status: 'PENDING',
      category: 'Operacional',
      date: new Date().toISOString()
    },
    {
      id: '2',
      description: 'Recebimento de cliente',
      amount: 3000,
      type: 'INCOME',
      status: 'CONFIRMED',
      category: 'Vendas',
      date: new Date().toISOString()
    }
  ];

  const mockInvoices = [
    {
      id: '1',
      invoiceNumber: 'FAT-001',
      clientName: 'Cliente Teste',
      description: 'Serviços prestados',
      amount: 2500,
      status: 'PENDENTE',
      dueDate: new Date().toISOString(),
      issueDate: new Date().toISOString()
    }
  ];

  const mockResumo = {
    totalRevenue: 5000,
    accountsReceivable: 2500,
    totalExpenses: 1500
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-seguranca-graphite border-gray-600 p-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-1">
            <TabsTrigger value="dashboard" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-xs px-2 py-1">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="contas-pagar" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-xs px-2 py-1">
              Contas a Pagar
            </TabsTrigger>
            <TabsTrigger value="contas-receber" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-xs px-2 py-1">
              Contas a Receber
            </TabsTrigger>
            <TabsTrigger value="fluxo-caixa" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-xs px-2 py-1">
              Fluxo de Caixa
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-xs px-2 py-1">
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="relatorios-financeiros" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-xs px-2 py-1">
              Relatórios Financeiros
            </TabsTrigger>
            <TabsTrigger value="centro-custos" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-xs px-2 py-1">
              Centro de Custos
            </TabsTrigger>
            <TabsTrigger value="faturas" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-xs px-2 py-1">
              Faturas
            </TabsTrigger>
            <TabsTrigger value="medicoes" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-xs px-2 py-1">
              Medições
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {/* Cards de Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-seguranca-black border-gray-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Receita Total</p>
                    <p className="text-2xl font-bold text-green-500">
                      R$ {mockResumo.totalRevenue.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              <Card className="bg-seguranca-black border-gray-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Contas a Receber</p>
                    <p className="text-2xl font-bold text-blue-500">
                      R$ {mockResumo.accountsReceivable.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              <Card className="bg-seguranca-black border-gray-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Despesas</p>
                    <p className="text-2xl font-bold text-red-500">
                      R$ {mockResumo.totalExpenses.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </Card>
              <Card className="bg-seguranca-black border-gray-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-purple-500">
                      R$ {(mockResumo.totalRevenue - mockResumo.totalExpenses).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Placeholder para gráficos */}
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400">Dashboard financeiro funcionando!</p>
                <p className="text-sm text-gray-500 mt-2">Gráficos serão implementados aqui</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="contas-pagar">
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-seguranca-lightgray mb-4">Contas a Pagar</h2>
                <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="contas-receber">
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-seguranca-lightgray mb-4">Contas a Receber</h2>
                <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="fluxo-caixa">
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-seguranca-lightgray mb-4">Fluxo de Caixa</h2>
                <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pagamentos">
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-seguranca-lightgray mb-4">Pagamentos</h2>
                <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios-financeiros">
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-seguranca-lightgray mb-4">Relatórios Financeiros</h2>
                <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="centro-custos">
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-seguranca-lightgray mb-4">Centro de Custos</h2>
                <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="faturas">
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-seguranca-lightgray mb-4">Faturas</h2>
                <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="medicoes">
            <Card className="bg-seguranca-graphite border-gray-600 p-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-seguranca-lightgray mb-4">Medições</h2>
                <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default FinanceiroSimple;