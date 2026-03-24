import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Eye, DollarSign, TrendingUp, TrendingDown, Calendar, Loader2, BarChart3, LayoutDashboard, Receipt, Layers, Activity, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FinanceiroDashboard } from '@/components/financeiro/FinanceiroDashboard';
import ContasAPagarTab from '@/components/financeiro/ContasAPagarTab';
import ContasAReceberTab from '@/components/financeiro/ContasAReceberTab';
import FluxoCaixaTab from '@/components/financeiro/FluxoCaixaTab';
import PagamentosTab from '@/components/financeiro/PagamentosTab';
import RelatoriosTab from '@/components/financeiro/RelatoriosTab';
import CentroCustosTab from '@/components/financeiro/CentroCustosTab';
import FaturasTab from '@/components/financeiro/FaturasTab';
import MedicoesTab from '@/components/financeiro/MedicoesTab';

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
      <div className="max-w-7xl mx-auto px-4">
        <div className="space-y-6">
          <Tabs defaultValue="dashboard" className="w-full">
            {/* Tabs - Padrão SST Simplificado */}
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-9 bg-seguranca-graphite border-gray-600">
              <TabsTrigger value="dashboard" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="contas-pagar" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
                Contas a Pagar
              </TabsTrigger>
              <TabsTrigger value="contas-receber" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
                Contas a Receber
              </TabsTrigger>
              <TabsTrigger value="fluxo-caixa" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
                Fluxo de Caixa
              </TabsTrigger>
              <TabsTrigger value="pagamentos" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="relatorios-financeiros" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
                Relatórios
              </TabsTrigger>
              <TabsTrigger value="centro-custos" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
                Centro Custos
              </TabsTrigger>
              <TabsTrigger value="faturas" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
                Faturas
              </TabsTrigger>
              <TabsTrigger value="medicoes" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
                Medições
              </TabsTrigger>
            </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <FinanceiroDashboard 
              transactions={mockTransactions} 
              invoices={mockInvoices}
              refreshData={() => {
                toast({
                  title: "Atualizado",
                  description: "Dashboard atualizado com sucesso",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="contas-pagar">
            <ContasAPagarTab />
          </TabsContent>

          <TabsContent value="contas-receber">
            <ContasAReceberTab />
          </TabsContent>

          <TabsContent value="fluxo-caixa">
            <FluxoCaixaTab />
          </TabsContent>

          <TabsContent value="pagamentos">
            <PagamentosTab />
          </TabsContent>

          <TabsContent value="relatorios-financeiros">
            <RelatoriosTab />
          </TabsContent>

          <TabsContent value="centro-custos">
            <CentroCustosTab />
          </TabsContent>

          <TabsContent value="faturas">
            <FaturasTab />
          </TabsContent>

          <TabsContent value="medicoes">
            <MedicoesTab />
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </StandardLayout>
  );
};

const Financeiro = FinanceiroSimple;
export default Financeiro;