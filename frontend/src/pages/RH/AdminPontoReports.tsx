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
  BarChart3,
  Download,
  Loader2,
  Search,
  Calendar,
  TrendingUp,
  Clock,
  User,
  Filter,
  RefreshCw,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import timeRecordService, { TimeRecord } from '@/services/timeRecordService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminPontoReports: React.FC = () => {
  const { toast } = useToast();
  const { empresa } = useAuth();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await timeRecordService.getAdminRecords({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        department: departmentFilter || undefined,
        status: statusFilter || undefined
      });
      if (response.success) {
        setRecords(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar relatório:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departmentFilter, statusFilter, toast]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ENTRADA: 'Entrada', SAIDA: 'Saída',
      SAIDA_ALMOCO: 'Saída Almoço', RETORNO_ALMOCO: 'Retorno Almoço'
    };
    return labels[tipo] || tipo;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      APPROVED: 'Aprovado', PENDING: 'Pendente', REJECTED: 'Rejeitado'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-500/10 text-green-500 border-green-500/20',
      PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return colors[status] || '';
  };

  const filteredRecords = records.filter(r =>
    r.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRegistros = filteredRecords.length;
  const totalAprovados = filteredRecords.filter(r => r.status === 'APPROVED').length;
  const totalPendentes = filteredRecords.filter(r => r.status === 'PENDING').length;
  const totalRejeitados = filteredRecords.filter(r => r.status === 'REJECTED').length;

  const exportToCSV = () => {
    const headers = ['Funcionário', 'Tipo', 'Data/Hora', 'Localização', 'Latitude', 'Longitude', 'IP', 'Status', 'Justificativa', 'Departamento'];
    const rows = filteredRecords.map(r => [
      r.employee?.name || '',
      getTipoLabel(r.recordType),
      format(new Date(r.recordedAt), "dd/MM/yyyy HH:mm:ss"),
      r.location || '',
      r.latitude?.toString() || '',
      r.longitude?.toString() || '',
      r.ipAddress || '',
      getStatusLabel(r.status),
      r.justification || '',
      r.employee?.department || ''
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-ponto-${startDate}-a-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast({ title: '✅ Relatório exportado', description: 'CSV baixado com sucesso' });
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation + Header */}
        <PontoAdminNav 
          title="Relatórios de Ponto" 
          subtitle={empresa?.nome ? `Relatórios - ${empresa.nome}` : 'Relatórios de ponto eletrônico'}
        />
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={loadRecords}
            className="border-seguranca-yellow/30 hover:border-seguranca-yellow/50">
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
          <Button onClick={exportToCSV} disabled={filteredRecords.length === 0}
            className="bg-seguranca-yellow hover:bg-seguranca-yellow/80 text-seguranca-black font-bold">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-500">{totalRegistros}</p>
              <p className="text-xs text-seguranca-gray">Total Registros</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-500">{totalAprovados}</p>
              <p className="text-xs text-seguranca-gray">Aprovados</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4 text-center">
              <Loader2 className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-yellow-500">{totalPendentes}</p>
              <p className="text-xs text-seguranca-gray">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold text-red-500">{totalRejeitados}</p>
              <p className="text-xs text-seguranca-gray">Rejeitados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Label className="text-seguranca-gray text-xs">Data Início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="bg-seguranca-black border-seguranca-gray/30 mt-1" />
              </div>
              <div>
                <Label className="text-seguranca-gray text-xs">Data Fim</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="bg-seguranca-black border-seguranca-gray/30 mt-1" />
              </div>
              <div>
                <Label className="text-seguranca-gray text-xs">Departamento</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="bg-seguranca-black border-seguranca-gray/30 mt-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-seguranca-gray text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-seguranca-black border-seguranca-gray/30 mt-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="APPROVED">Aprovados</SelectItem>
                    <SelectItem value="PENDING">Pendentes</SelectItem>
                    <SelectItem value="REJECTED">Rejeitados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative mt-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-seguranca-gray" />
                <Input placeholder="Buscar funcionário..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black border-seguranca-gray/30" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-seguranca-yellow" />
                Registros do Período
              </span>
              <Badge variant="outline">{filteredRecords.length} registro(s)</Badge>
            </CardTitle>
            <CardDescription>
              Período: {format(new Date(startDate), 'dd/MM/yyyy')} a {format(new Date(endDate), 'dd/MM/yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-seguranca-yellow" />
                <p className="text-seguranca-gray mt-4">Carregando...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-seguranca-gray">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum registro encontrado no período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-seguranca-gray/20">
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Funcionário</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Data</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Hora</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Departamento</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-seguranca-gray font-medium">Local</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="border-b border-seguranca-gray/10 hover:bg-seguranca-gray/5">
                        <td className="py-3 px-4 text-seguranca-lightgray font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-seguranca-gray" />
                            {record.employee?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-seguranca-lightgray">
                          {format(new Date(record.recordedAt), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-3 px-4 text-seguranca-lightgray font-mono">
                          {format(new Date(record.recordedAt), 'HH:mm:ss')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {getTipoLabel(record.recordType)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-seguranca-gray">
                          {record.employee?.department || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(record.status)}`}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-seguranca-gray text-xs max-w-[150px] truncate">
                          {record.location || (record.latitude ? `${record.latitude.toFixed(4)}, ${record.longitude?.toFixed(4)}` : '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empresa Info */}
        {empresa && (
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-seguranca-gray flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Período do relatório: <strong className="text-seguranca-lightgray ml-1">
                    {format(new Date(startDate), 'dd/MM/yyyy')} a {format(new Date(endDate), 'dd/MM/yyyy')}
                  </strong>
                </span>
                {empresa.nome && (
                  <Badge variant="outline" className="bg-seguranca-yellow/10 text-seguranca-yellow border-seguranca-yellow/20">
                    {empresa.nome}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StandardLayout>
  );
};

export default AdminPontoReports;
