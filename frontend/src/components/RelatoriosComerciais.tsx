import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import leadService, { Lead, LeadStats } from '@/services/leadService';
import proposalService, { Proposal, ProposalStats } from '@/services/proposalService';
import quoteService, { Quote, QuoteStats } from '@/services/quoteService';
import { exportLeads, exportProposals, exportQuotes, exportDashboardData } from '@/utils/exportUtils';

interface RelatoriosComerciaisProps {
  isOpen: boolean;
  onClose: () => void;
}

const RelatoriosComerciais: React.FC<RelatoriosComerciaisProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('dashboard');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('xlsx');
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [proposalStats, setProposalStats] = useState<ProposalStats | null>(null);
  const [quoteStats, setQuoteStats] = useState<QuoteStats | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsData, proposalsData, quotesData, leadsStats, proposalsStats, quotesStats] = await Promise.all([
        leadService.getAllLeads(),
        proposalService.getAllProposals(),
        quoteService.getAllQuotes(),
        leadService.getStatsByStatus(),
        proposalService.getStatsByStatus(),
        quoteService.getStatsByStatus()
      ]);

      setLeads(leadsData);
      setProposals(proposalsData);
      setQuotes(quotesData);
      setLeadStats(leadsStats);
      setProposalStats(proposalsStats);
      setQuoteStats(quotesStats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const filename = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}`;
      
      switch (reportType) {
        case 'leads':
          await exportLeads(leads, { format: exportFormat, filename });
          break;
        case 'proposals':
          await exportProposals(proposals, { format: exportFormat, filename });
          break;
        case 'quotes':
          await exportQuotes(quotes, { format: exportFormat, filename });
          break;
        case 'dashboard':
          await exportDashboardData(leads, proposals, quotes, { format: exportFormat, filename });
          break;
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversionRate = (won: number, total: number): string => {
    if (total === 0) return '0%';
    return `${((won / total) * 100).toFixed(1)}%`;
  };

  const getTotalValue = (items: any[]): number => {
    return items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios Comerciais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configurações do Relatório */}
          <Card className="bg-seguranca-black border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray text-lg">Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="reportType" className="text-seguranca-lightgray">Tipo de Relatório</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard Geral</SelectItem>
                      <SelectItem value="leads">Relatório de Leads</SelectItem>
                      <SelectItem value="proposals">Relatório de Propostas</SelectItem>
                      <SelectItem value="quotes">Relatório de Orçamentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateRange" className="text-seguranca-lightgray">Período</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="exportFormat" className="text-seguranca-lightgray">Formato de Exportação</Label>
                  <Select value={exportFormat} onValueChange={(value: 'csv' | 'xlsx' | 'pdf') => setExportFormat(value)}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Leads */}
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leadStats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-seguranca-lightgray font-bold">{leads.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Novos:</span>
                      <Badge className="bg-blue-500">{leadStats.NEW}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Qualificados:</span>
                      <Badge className="bg-yellow-500">{leadStats.QUALIFIED}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Convertidos:</span>
                      <Badge className="bg-green-500">{leadStats.WON}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Taxa Conversão:</span>
                      <span className="text-green-400 font-bold">
                        {getConversionRate(leadStats.WON, leads.length)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">Carregando...</div>
                )}
              </CardContent>
            </Card>

            {/* Propostas */}
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Propostas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proposalStats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-seguranca-lightgray font-bold">{proposals.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Em Análise:</span>
                      <Badge className="bg-yellow-500">{proposalStats.UNDER_REVIEW}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aprovadas:</span>
                      <Badge className="bg-green-500">{proposalStats.APPROVED}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Convertidas:</span>
                      <Badge className="bg-purple-500">{proposalStats.CONVERTED}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valor Total:</span>
                      <span className="text-green-400 font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(getTotalValue(proposals))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">Carregando...</div>
                )}
              </CardContent>
            </Card>

            {/* Orçamentos */}
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Orçamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quoteStats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-seguranca-lightgray font-bold">{quotes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Em Análise:</span>
                      <Badge className="bg-yellow-500">{quoteStats.UNDER_REVIEW}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aprovados:</span>
                      <Badge className="bg-green-500">{quoteStats.APPROVED}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Convertidos:</span>
                      <Badge className="bg-purple-500">{quoteStats.CONVERTED}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valor Total:</span>
                      <span className="text-green-400 font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(getTotalValue(quotes))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">Carregando...</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="bg-seguranca-red hover:bg-seguranca-darkred"
              onClick={handleExport}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Exportando...' : 'Exportar Relatório'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelatoriosComerciais; 