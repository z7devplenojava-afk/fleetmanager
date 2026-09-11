import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PontoAdminNav from '@/components/ponto/PontoAdminNav';
import {
  Download,
  Loader2,
  Calendar,
  Building2,
  Users,
  Shield,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Table2,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import timeRecordService from '@/services/timeRecordService';

interface ConsolidatedData {
  totalRecords: number;
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalEmployees: number;
  totalCompanies: number;
  periodStart: string;
  periodEnd: string;
  companyBreakdown: CompanyBreakdown[];
  overtimeByCompany: ChartItem[];
  latenessByCompany: ChartItem[];
}

interface CompanyBreakdown {
  companyId: string;
  companyName: string;
  totalRecords: number;
  pendingRecords: number;
  employees: number;
  overtime: number;
  lateness: number;
}

interface ChartItem {
  empresa: string;
  horas?: number;
  ocorrencias?: number;
}

const AdminPontoConsolidatedReport: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConsolidatedData | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEX_ADMIN';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await timeRecordService.getConsolidated(startDate, endDate);
      if (response.success) {
        setData(response.data);
      } else {
        toast({ title: 'Erro', description: response.error, variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados consolidados:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const blob = await timeRecordService.getConsolidatedReportPdf(startDate, endDate);
      downloadBlob(blob, `relatorio-consolidado-ponto-${startDate}-a-${endDate}.pdf`);
      toast({ title: '✅ PDF exportado', description: 'Relatório consolidado baixado em PDF' });
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro ao exportar PDF',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const blob = await timeRecordService.getConsolidatedReportExcel(startDate, endDate);
      downloadBlob(blob, `relatorio-consolidado-ponto-${startDate}-a-${endDate}.xlsx`);
      toast({ title: '✅ Excel exportado', description: 'Relatório consolidado baixado em Excel (4 abas)' });
    } catch (error: any) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: 'Erro ao exportar Excel',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setExportingExcel(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  // ----- Not SUPER_ADMIN -----
  if (!isSuperAdmin) {
    return (
      <StandardLayout>
        <div className="container mx-auto p-6 space-y-6">
          <PontoAdminNav title="Relatório Consolidado" subtitle="Exportação de relatórios" />
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-500 mb-2">Acesso Restrito</h2>
              <p className="text-seguranca-gray">
                Apenas SUPER_ADMIN pode acessar relatórios consolidados multi-empresa.
              </p>
            </CardContent>
          </Card>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation + Header */}
        <PontoAdminNav
          title="Relatório Consolidado"
          subtitle="Exportação de relatórios de ponto com dados de todas as empresas"
        />

        {/* Filters and Export Actions */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-seguranca-gray text-xs">Data Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-seguranca-gray text-xs">Data Fim</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={loadData}
                  disabled={loading}
                  className="border-seguranca-yellow/30 hover:border-seguranca-yellow/50"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  onClick={handleExportPdf}
                  disabled={exportingPdf || !data}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  {exportingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  PDF
                </Button>
                <Button
                  onClick={handleExportExcel}
                  disabled={exportingExcel || !data}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  {exportingExcel ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && !data && (
          <div className="text-center py-16">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-seguranca-yellow" />
            <p className="text-seguranca-gray mt-4 text-lg">Carregando dados consolidados...</p>
          </div>
        )}

        {!loading && !data && (
          <div className="text-center py-16 text-seguranca-gray">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado encontrado no período selecionado</p>
          </div>
        )}

        {data && (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <Building2 className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold text-purple-500">{formatNumber(data.totalCompanies)}</p>
                  <p className="text-xs text-seguranca-gray">Empresas</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold text-blue-500">{formatNumber(data.totalEmployees)}</p>
                  <p className="text-xs text-seguranca-gray">Funcionários</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold text-green-500">{formatNumber(data.totalRecords)}</p>
                  <p className="text-xs text-seguranca-gray">Registros</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                  <p className="text-2xl font-bold text-amber-500">{formatNumber(data.totalPending)}</p>
                  <p className="text-xs text-seguranca-gray">Pendentes</p>
                </CardContent>
              </Card>
            </div>

            {/* Company Breakdown Table */}
            <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
                  <span className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5 text-seguranca-yellow" />
                    Detalhamento por Empresa
                  </span>
                  <Badge variant="outline">{data.companyBreakdown.length} empresa(s)</Badge>
                </CardTitle>
                <CardDescription>
                  Período: {format(new Date(startDate), 'dd/MM/yyyy')} a {format(new Date(endDate), 'dd/MM/yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.companyBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-seguranca-gray">
                    <Table2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum registro encontrado no período</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-seguranca-gray/20">
                          <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Empresa</th>
                          <th className="text-right py-3 px-4 text-seguranca-gray font-medium">Registros</th>
                          <th className="text-right py-3 px-4 text-seguranca-gray font-medium">Pendentes</th>
                          <th className="text-right py-3 px-4 text-seguranca-gray font-medium">Funcionários</th>
                          <th className="text-right py-3 px-4 text-seguranca-gray font-medium">
                            <span className="flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" /> HE (dias)
                            </span>
                          </th>
                          <th className="text-right py-3 px-4 text-seguranca-gray font-medium">
                            <span className="flex items-center justify-end gap-1">
                              <AlertTriangle className="h-3 w-3" /> Atrasos (dias)
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.companyBreakdown.map((company, idx) => (
                          <tr
                            key={company.companyId}
                            className={`border-b border-seguranca-gray/10 hover:bg-seguranca-gray/5 transition-colors ${
                              idx % 2 === 0 ? 'bg-seguranca-black/20' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-seguranca-lightgray font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-seguranca-yellow" />
                                {company.companyName}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-seguranca-lightgray font-mono">
                              {formatNumber(company.totalRecords)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-mono ${
                                company.pendingRecords > 0
                                  ? 'text-amber-500 font-bold'
                                  : 'text-seguranca-gray'
                              }`}>
                                {formatNumber(company.pendingRecords)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-seguranca-lightgray font-mono">
                              {formatNumber(company.employees)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-mono ${
                                company.overtime > 0
                                  ? 'text-orange-500 font-bold'
                                  : 'text-seguranca-gray'
                              }`}>
                                {formatNumber(company.overtime)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-mono ${
                                company.lateness > 0
                                  ? 'text-red-500 font-bold'
                                  : 'text-seguranca-gray'
                              }`}>
                                {formatNumber(company.lateness)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Total Row */}
                      <tfoot>
                        <tr className="border-t-2 border-seguranca-yellow/30 bg-seguranca-yellow/5">
                          <td className="py-3 px-4 text-seguranca-lightgray font-bold">TOTAL</td>
                          <td className="py-3 px-4 text-right text-seguranca-lightgray font-bold font-mono">
                            {formatNumber(data.companyBreakdown.reduce((a, c) => a + c.totalRecords, 0))}
                          </td>
                          <td className="py-3 px-4 text-right text-amber-500 font-bold font-mono">
                            {formatNumber(data.companyBreakdown.reduce((a, c) => a + c.pendingRecords, 0))}
                          </td>
                          <td className="py-3 px-4 text-right text-seguranca-lightgray font-bold font-mono">
                            {formatNumber(data.companyBreakdown.reduce((a, c) => a + c.employees, 0))}
                          </td>
                          <td className="py-3 px-4 text-right text-orange-500 font-bold font-mono">
                            {formatNumber(data.companyBreakdown.reduce((a, c) => a + c.overtime, 0))}
                          </td>
                          <td className="py-3 px-4 text-right text-red-500 font-bold font-mono">
                            {formatNumber(data.companyBreakdown.reduce((a, c) => a + c.lateness, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overtime by Company */}
            {data.overtimeByCompany.length > 0 && (
              <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-orange-500" />
                    Horas Extras por Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-seguranca-gray/20">
                          <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Empresa</th>
                          <th className="text-right py-3 px-4 text-seguranca-gray font-medium">Dias com HE</th>
                          <th className="w-1/2 py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.overtimeByCompany.map((item, idx) => {
                          const maxVal = Math.max(...data.overtimeByCompany.map(i => i.horas || 0));
                          const pct = maxVal > 0 ? ((item.horas || 0) / maxVal) * 100 : 0;
                          return (
                            <tr key={idx} className="border-b border-seguranca-gray/10">
                              <td className="py-2 px-4 text-seguranca-lightgray">{item.empresa}</td>
                              <td className="py-2 px-4 text-right text-seguranca-lightgray font-mono font-bold text-orange-500">
                                {item.horas || 0}
                              </td>
                              <td className="py-2 px-4">
                                <div className="w-full bg-seguranca-gray/10 rounded-full h-4">
                                  <div
                                    className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(2, pct)}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lateness by Company */}
            {data.latenessByCompany.length > 0 && (
              <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-red-500" />
                    Atrasos por Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-seguranca-gray/20">
                          <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Empresa</th>
                          <th className="text-right py-3 px-4 text-seguranca-gray font-medium">Ocorrências</th>
                          <th className="w-1/2 py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.latenessByCompany.map((item, idx) => {
                          const maxVal = Math.max(...data.latenessByCompany.map(i => i.ocorrencias || 0));
                          const pct = maxVal > 0 ? ((item.ocorrencias || 0) / maxVal) * 100 : 0;
                          return (
                            <tr key={idx} className="border-b border-seguranca-gray/10">
                              <td className="py-2 px-4 text-seguranca-lightgray">{item.empresa}</td>
                              <td className="py-2 px-4 text-right text-seguranca-lightgray font-mono font-bold text-red-500">
                                {item.ocorrencias || 0}
                              </td>
                              <td className="py-2 px-4">
                                <div className="w-full bg-seguranca-gray/10 rounded-full h-4">
                                  <div
                                    className="bg-gradient-to-r from-amber-500 to-red-600 h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(2, pct)}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Info */}
            <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-seguranca-gray flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Período do relatório: <strong className="text-seguranca-lightgray">
                      {format(new Date(startDate), 'dd/MM/yyyy')} a {format(new Date(endDate), 'dd/MM/yyyy')}
                    </strong>
                  </span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-red-600/10 text-red-500 border-red-500/20">
                      PDF
                    </Badge>
                    <Badge variant="outline" className="bg-green-600/10 text-green-500 border-green-500/20">
                      Excel (4 abas)
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </StandardLayout>
  );
};

export default AdminPontoConsolidatedReport;
