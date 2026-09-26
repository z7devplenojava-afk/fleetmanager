import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import commercialEmailService, { CommercialQuotation } from '@/services/commercialEmailService';
import CommercialEmailConfigModal from './CommercialEmailConfigModal';
import QuotationDetailModal from './QuotationDetailModal';
import {
  Mail,
  RefreshCw,
  Settings,
  Search,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Eye,
  Inbox,
  Sparkles,
  MapPin,
  Users,
  Loader2
} from 'lucide-react';

interface CommercialEmailQuotationsTabProps {
  onGenerateProposalFromQuotation?: (quotation: CommercialQuotation) => void;
}

export const CommercialEmailQuotationsTab: React.FC<CommercialEmailQuotationsTabProps> = ({
  onGenerateProposalFromQuotation
}) => {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<CommercialQuotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modais
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<CommercialQuotation | null>(null);

  // Carregar Cotações
  const loadQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commercialEmailService.listQuotations({
        status: statusFilter,
        query: searchQuery || undefined,
        page,
        size: 15
      });
      setQuotations(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err: any) {
      console.error('Erro ao carregar cotações:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  // Sincronização periódica em background a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      commercialEmailService.syncQuotations().then(() => {
        loadQuotations();
      }).catch(() => {});
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadQuotations]);

  // Disparo manual de sincronização
  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await commercialEmailService.syncQuotations();
      toast({
        title: 'Sincronização Concluída',
        description: `${res.newQuotationsCreated || 0} nova(s) cotação(ões) identificada(s) e ${res.attachmentsScanned || 0} anexo(s) verificado(s).`,
      });
      loadQuotations();
    } catch (err: any) {
      toast({
        title: 'Erro na Sincronização',
        description: err.response?.data?.message || 'Falha ao conectar ao servidor de e-mail da São Silvestre',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenDetail = (quot: CommercialQuotation) => {
    setSelectedQuotation(quot);
    setIsDetailModalOpen(true);
  };

  const handleGenerateProposal = (quot: CommercialQuotation) => {
    if (onGenerateProposalFromQuotation) {
      onGenerateProposalFromQuotation(quot);
    }
  };

  // Contadores para os Cards de KPI
  const countPending = quotations.filter((q) => q.status === 'PENDING').length;
  const countInAnalysis = quotations.filter((q) => q.status === 'IN_ANALYSIS').length;
  const countProposal = quotations.filter((q) => q.status === 'PROPOSAL_GENERATED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs">
            Pendente
          </Badge>
        );
      case 'IN_ANALYSIS':
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs">
            Em Análise
          </Badge>
        );
      case 'PROPOSAL_GENERATED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs">
            Proposta Emitida
          </Badge>
        );
      case 'ARCHIVED':
        return (
          <Badge className="bg-slate-700/50 text-slate-400 border border-slate-700 text-xs">
            Arquivada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-red-500" />
            <span>Caixa de Cotações Comerciais (E-mail)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitoramento de solicitações de fretamento e cotações em <strong className="text-slate-200">comercialvss@viacaosaosilvestre.com.br</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigModalOpen(true)}
            className="border-slate-800 text-slate-300 hover:bg-slate-800 h-9 rounded-xl text-xs gap-1.5"
          >
            <Settings className="h-4 w-4" />
            <span>Configurações do E-mail</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSyncNow}
            disabled={syncing}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold h-9 rounded-xl text-xs shadow-lg shadow-red-600/20 gap-1.5"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>Sincronizar E-mails</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-medium">Total de Cotações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalElements}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Identificadas por e-mail</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{countPending}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Aguardando análise</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-blue-400 font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Em Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{countInAnalysis}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Em cotação técnica</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Propostas Geradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{countProposal}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Convertidas em proposta</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por cliente, e-mail ou rota..."
            className="pl-9 h-9 text-xs bg-slate-950 border-slate-700 text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Filtrar Status:</span>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-40 h-9 text-xs bg-slate-950 border-slate-700 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-xs">
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="PENDING">Pendentes</SelectItem>
              <SelectItem value="IN_ANALYSIS">Em Análise</SelectItem>
              <SelectItem value="PROPOSAL_GENERATED">Proposta Gerada</SelectItem>
              <SelectItem value="ARCHIVED">Arquivadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Cotações */}
      <Card className="bg-slate-900/40 border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/80 border-b border-slate-800">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-300">Cliente / Solicitante</TableHead>
                <TableHead className="text-xs font-semibold text-slate-300">Assunto & Demanda</TableHead>
                <TableHead className="text-xs font-semibold text-slate-300">Anexos Seguros</TableHead>
                <TableHead className="text-xs font-semibold text-slate-300">Data Recebimento</TableHead>
                <TableHead className="text-xs font-semibold text-slate-300">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-300 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-800/60">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="h-6 w-6 text-red-500 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Carregando cotações...</p>
                  </TableCell>
                </TableRow>
              ) : quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Inbox className="h-10 w-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300 mt-2">Nenhuma cotação encontrada</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Clique em &quot;Sincronizar E-mails&quot; para verificar a caixa comercialvss@viacaosaosilvestre.com.br
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                quotations.map((quot) => (
                  <TableRow key={quot.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Cliente / Solicitante */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {quot.clientName ? quot.clientName.slice(0, 2).toUpperCase() : <Building2 className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-white truncate max-w-[180px]">
                            {quot.clientName || quot.senderName || 'Solicitante'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {quot.senderEmail}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Assunto & Demanda */}
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-200 line-clamp-1 max-w-xs">
                          {quot.subject || 'Sem assunto'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          {quot.extractedOrigin || quot.extractedDestination ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <MapPin className="h-3 w-3" />
                              {quot.extractedOrigin || 'Origem'} ➔ {quot.extractedDestination || 'Destino'}
                            </span>
                          ) : null}
                          {quot.extractedPassengers ? (
                            <span className="flex items-center gap-1 text-purple-400">
                              <Users className="h-3 w-3" />
                              {quot.extractedPassengers} pax
                            </span>
                          ) : null}
                          {quot.extractedTripDate && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <Calendar className="h-3 w-3" />
                              {quot.extractedTripDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Anexos */}
                    <TableCell className="py-3">
                      {quot.attachments && quot.attachments.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {quot.attachments.map((att) => (
                            <span
                              key={att.id}
                              title={`${att.fileName} (${att.securityStatus})`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                            >
                              {att.fileName.endsWith('.xlsx') || att.fileName.endsWith('.xls') || att.fileName.endsWith('.csv') ? (
                                <FileSpreadsheet className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <FileText className="h-3 w-3 text-red-400" />
                              )}
                              <span className="truncate max-w-[80px]">{att.fileName}</span>
                              {att.securityStatus === 'VERIFIED_SAFE' && (
                                <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Sem anexos</span>
                      )}
                    </TableCell>

                    {/* Data Recebimento */}
                    <TableCell className="py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(quot.receivedAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(quot.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      {getStatusBadge(quot.status)}
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(quot)}
                          className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1 rounded-lg"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleGenerateProposal(quot)}
                          className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs rounded-lg gap-1 shadow-md shadow-red-600/20"
                        >
                          <span>Gerar Proposta</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-800 text-xs text-slate-400">
            <span>Página {page + 1} de {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-7 text-xs border-slate-800 text-slate-300"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="h-7 text-xs border-slate-800 text-slate-300"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modais */}
      <CommercialEmailConfigModal
        open={isConfigModalOpen}
        onOpenChange={setIsConfigModalOpen}
        onConfigSaved={loadQuotations}
      />

      <QuotationDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        quotation={selectedQuotation}
        onGenerateProposal={handleGenerateProposal}
        onStatusChanged={loadQuotations}
      />
    </div>
  );
};

export default CommercialEmailQuotationsTab;
