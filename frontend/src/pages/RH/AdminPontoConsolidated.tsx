import React, { useState, useEffect } from 'react';
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
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Building2,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  RefreshCw,
  Loader2,
  BarChart3,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import timeRecordService from '@/services/timeRecordService';

const COLORS = ['#eab308', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#ec4899', '#84cc16'];

const AdminPontoConsolidated: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEX_ADMIN';

  useEffect(() => {
    if (isSuperAdmin) loadConsolidated();
    else setLoading(false);
  }, [isSuperAdmin]);

  const loadConsolidated = async () => {
    try {
      setLoading(true);
      const response = await timeRecordService.getConsolidated(startDate, endDate);
      if (response.success) {
        setData(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar consolidado:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <StandardLayout>
        <div className="container mx-auto p-6 text-center py-20">
          <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-seguranca-lightgray">Acesso Restrito</h2>
          <p className="text-seguranca-gray mt-2">Apenas SUPER_ADMIN pode visualizar relatórios consolidados.</p>
        </div>
      </StandardLayout>
    );
  }

  if (loading) {
    return (
      <StandardLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-seguranca-yellow" />
            <p className="text-seguranca-gray mt-4 text-lg">Consolidando dados de todas as empresas...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  const companyBreakdown = data?.companyBreakdown || [];
  const overtimeByCompany = data?.overtimeByCompany || [];
  const latenessByCompany = data?.latenessByCompany || [];

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation + Header */}
        <PontoAdminNav
          title="Relatório Consolidado Multi-Empresa"
          subtitle={`${format(new Date(startDate), "dd/MM/yyyy")} a ${format(new Date(endDate), "dd/MM/yyyy")} — ${data?.totalCompanies || 0} empresa(s)`}
        />

        {/* Filters + Actions */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-seguranca-gray text-xs">Data Início</Label>
            <Input type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-seguranca-black border-seguranca-gray/30 mt-1 w-40" />
          </div>
          <div>
            <Label className="text-seguranca-gray text-xs">Data Fim</Label>
            <Input type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-seguranca-black border-seguranca-gray/30 mt-1 w-40" />
          </div>
          <Button onClick={loadConsolidated}
            className="bg-seguranca-yellow hover:bg-seguranca-yellow/80 text-seguranca-black font-bold">
            <BarChart3 className="mr-2 h-4 w-4" /> Consolidar
          </Button>
          <Button variant="outline" onClick={loadConsolidated}
            className="border-seguranca-yellow/30 hover:border-seguranca-yellow/50">
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>

        {/* Global KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6 text-center">
              <Building2 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-3xl font-bold text-blue-500">{data?.totalCompanies || 0}</p>
              <p className="text-xs text-seguranca-gray font-medium">Empresas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-3xl font-bold text-emerald-500">{data?.totalEmployees || 0}</p>
              <p className="text-xs text-seguranca-gray font-medium">Funcionários</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <p className="text-3xl font-bold text-amber-500">{data?.totalRecords || 0}</p>
              <p className="text-xs text-seguranca-gray font-medium">Registros</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <p className="text-3xl font-bold text-red-500">{data?.totalPending || 0}</p>
              <p className="text-xs text-seguranca-gray font-medium">Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* HE by Company */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                <TrendingUp className="mr-2 h-5 w-5 text-amber-500" />
                Horas Extras por Empresa
              </CardTitle>
              <CardDescription>Comparativo de ocorrências de HE entre empresas</CardDescription>
            </CardHeader>
            <CardContent>
              {overtimeByCompany.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overtimeByCompany} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis dataKey="empresa" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value: number) => [value, 'Ocorrências']}
                    />
                    <Bar dataKey="horas" fill="#eab308" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-seguranca-gray">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum dado de HE no período</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lateness by Company */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-red-500" />
                Atrasos por Empresa
              </CardTitle>
              <CardDescription>Comparativo de atrasos entre empresas</CardDescription>
            </CardHeader>
            <CardContent>
              {latenessByCompany.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={latenessByCompany} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis dataKey="empresa" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value: number) => [value, 'Ocorrências']}
                    />
                    <Bar dataKey="ocorrencias" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-seguranca-gray">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum atraso registrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Company Breakdown Table */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-seguranca-yellow" />
              Detalhamento por Empresa
            </CardTitle>
            <CardDescription>{companyBreakdown.length} empresa(s) no período</CardDescription>
          </CardHeader>
          <CardContent>
            {companyBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-seguranca-gray/20">
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Empresa</th>
                      <th className="text-center py-3 px-4 text-seguranca-gray font-medium">Funcionários</th>
                      <th className="text-center py-3 px-4 text-seguranca-gray font-medium">Registros</th>
                      <th className="text-center py-3 px-4 text-seguranca-gray font-medium">Pendentes</th>
                      <th className="text-center py-3 px-4 text-seguranca-gray font-medium">HE</th>
                      <th className="text-center py-3 px-4 text-seguranca-gray font-medium">Atrasos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyBreakdown.map((company: any, idx: number) => (
                      <tr key={company.companyId} className="border-b border-seguranca-gray/10 hover:bg-seguranca-gray/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-seguranca-lightgray font-medium">{company.companyName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-seguranca-lightgray">{company.employees}</td>
                        <td className="py-3 px-4 text-center text-seguranca-lightgray">{company.totalRecords}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className={`text-xs ${company.pendingRecords > 0 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}`}>
                            {company.pendingRecords}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className={`text-xs ${company.overtime > 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : ''}`}>
                            {company.overtime}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className={`text-xs ${company.lateness > 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}`}>
                            {company.lateness}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-seguranca-gray">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma empresa com dados no período</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Badge */}
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-amber-500" />
              <span className="text-seguranca-gray">
                Relatório consolidado — dados de <strong className="text-seguranca-lightgray">{data?.totalCompanies || 0} empresas</strong>.
                Apenas <strong className="text-amber-400">SUPER_ADMIN</strong> tem acesso a esta visão.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default AdminPontoConsolidated;
