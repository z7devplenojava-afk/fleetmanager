import React, { useState, useEffect, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Tv, 
  Search,
  Filter,
  RefreshCw,
  XCircle,
  DownloadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { kioskService } from '@/services/kioskService';
import { KioskPublication } from '@/types/kiosk';

export const TotensPublicacoesPage: React.FC = () => {
  const { toast } = useToast();

  const [publications, setPublications] = useState<KioskPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadPublications = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await kioskService.getPublications();
      setPublications(data || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar publicações',
        description: err?.response?.data?.message || 'Falha ao buscar histórico de publicações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPublications();
  }, []);

  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      const matchesSearch =
        !searchTerm ||
        (pub.deviceName && pub.deviceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pub.lastError && pub.lastError.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || pub.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [publications, searchTerm, statusFilter]);

  const renderStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case 'ACTIVATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Ativada no Totem
          </span>
        );
      case 'DOWNLOADING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <DownloadCloud className="h-3 w-3 animate-bounce" />
            Baixando ({progress}%)
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            Na Fila
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertTriangle className="h-3 w-3" />
            Falha no Download
          </span>
        );
      case 'CANCELLED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <XCircle className="h-3 w-3" />
            Cancelada
          </span>
        );
    }
  };

  return (
    <StandardLayout
      title="Publicações & Versões"
      subtitle="Histórico de versões imutáveis, sincronizações e atualizações remotas de totens"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Send className="h-6 w-6 text-primary" />
              Publicações & Versões
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe a distribuição dos manifestos nos totens com confirmação de download íntegro e ativação atômica.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPublications(true)}
              disabled={refreshing || loading}
              className="gap-2 rounded-xl border-border hover:bg-card"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por totem ou erro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-card border-border"
            />
          </div>

          <select
            aria-label="Filtrar por status da publicação"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVATED">Ativadas</option>
            <option value="DOWNLOADING">Baixando</option>
            <option value="QUEUED">Na Fila</option>
            <option value="FAILED">Com Falha</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </div>

        {/* Lista de Publicações */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border-border bg-card/60 animate-pulse h-20">
                <CardContent className="p-4" />
              </Card>
            ))}
          </div>
        ) : filteredPublications.length === 0 ? (
          <Card className="border-border bg-card/60">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                <Send className="h-10 w-10" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-semibold text-foreground">
                  {publications.length === 0 ? 'Nenhuma publicação registrada' : 'Nenhuma publicação encontrada'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {publications.length === 0
                    ? 'Quando você publicar uma apresentação para um ou mais totens, o histórico aparecerá aqui.'
                    : 'Tente alterar os termos de busca ou filtros.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPublications.map((pub) => (
              <Card key={pub.id} className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Tv className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">
                          {pub.deviceName || 'Totem'}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          v{pub.versionNumber || 1}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Enviado em {new Date(pub.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {renderStatusBadge(pub.status, pub.progressPercent)}

                    {pub.lastError && (
                      <span className="text-xs text-red-400 font-mono max-w-xs truncate" title={pub.lastError}>
                        Erro: {pub.lastError}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default TotensPublicacoesPage;
