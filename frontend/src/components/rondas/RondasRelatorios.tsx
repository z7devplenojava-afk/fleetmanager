import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  BarChart3,
  Calendar,
  Download,
  Filter,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  User
} from 'lucide-react';
import { rondasService, RondaStats } from '@/services/rondasService';
import { Ronda } from '@/types/rondas';
import { useToast } from '@/hooks/use-toast';
import { RondaStatus } from '@/types/rondas';

interface RondasRelatoriosProps {
  stats: RondaStats | null;
}

export const RondasRelatorios: React.FC<RondasRelatoriosProps> = ({ stats }) => {
  const [relatorios, setRelatorios] = useState<Ronda[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dataInicio: '',
    dataFim: '',
    status: '' as RondaStatus | '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadRelatorios();
  }, []);

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      const data = await rondasService.getRondasRelatorio({
        dataInicio: filters.dataInicio || undefined,
        dataFim: filters.dataFim || undefined,
        status: filters.status || undefined,
      });
      setRelatorios(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadRelatorios();
  };

  const handleClearFilters = () => {
    setFilters({
      dataInicio: '',
      dataFim: '',
      status: '',
    });
    setTimeout(() => loadRelatorios(), 100);
  };

  const handleExport = () => {
    // Implementar exportação para CSV/PDF
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação em desenvolvimento.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getStatusBadge = (status: RondaStatus) => {
    const statusConfig = {
      AGENDADA: { color: 'bg-blue-100 text-blue-800', label: 'Agendada' },
      EM_ANDAMENTO: { color: 'bg-yellow-100 text-yellow-800', label: 'Em Andamento' },
      CONCLUIDA: { color: 'bg-green-100 text-green-800', label: 'Concluída' },
      CANCELADA: { color: 'bg-red-100 text-red-800', label: 'Cancelada' },
      ATRASADA: { color: 'bg-orange-100 text-orange-800', label: 'Atrasada' }
    };

    const config = statusConfig[status] || statusConfig.AGENDADA;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
            Filtros de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio" className="text-sm text-gray-300">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filters.dataInicio}
                onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim" className="text-sm text-gray-300">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filters.dataFim}
                onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm text-gray-300">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => handleFilterChange('status', value === "all" ? '' : value)}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="AGENDADA">Agendada</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  <SelectItem value="ATRASADA">Atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleApplyFilters}
              className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-black"
            >
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Limpar
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 ml-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Resumidas */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-seguranca-black/50 border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-seguranca-black/50 border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Concluídas</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-400">{stats.concluidas}</p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-seguranca-black/50 border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Taxa Conclusão</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-400">{stats.percentualConclusao.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-seguranca-black/50 border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Tempo Médio</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">{formatDuration(stats.tempoMedioConclusao)}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Relatórios */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
            Relatórios de Rondas ({relatorios.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-seguranca-yellow" />
              <span className="ml-2 text-sm sm:text-base text-seguranca-lightgray">Carregando relatórios...</span>
            </div>
          ) : relatorios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <div className="p-3 sm:p-4 bg-gray-700/50 rounded-full mb-3 sm:mb-4">
                <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-seguranca-lightgray mb-2 text-center">
                Nenhum relatório encontrado
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 text-center max-w-md">
                Não há relatórios disponíveis para os filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {relatorios.map((ronda) => (
                <Card key={ronda.id} className="bg-seguranca-black/50 border-gray-700 hover:border-seguranca-yellow/50 transition-all">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-base sm:text-lg mb-1">{ronda.nome}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(ronda.status)}
                              <span className="text-xs text-gray-400">
                                {formatDate(ronda.dataInicio)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-400">Responsável:</span>
                            <span className="text-white font-medium">{ronda.responsavelNome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-400">Local:</span>
                            <span className="text-white font-medium">{ronda.localNome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-400">Duração:</span>
                            <span className="text-white font-medium">
                              {ronda.duracaoReal ? formatDuration(ronda.duracaoReal) : formatDuration(ronda.duracaoEstimada)}
                            </span>
                          </div>
                          {ronda.checkpoints && ronda.checkpoints.length > 0 && (() => {
                            const visitados = ronda.checkpoints.filter(cp => cp.status === 'VISITADO').length;
                            const total = ronda.checkpoints.length;
                            const percentual = total > 0 ? ((visitados / total) * 100).toFixed(0) : '0';
                            return (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-400">Checkpoints:</span>
                                <span className="text-white font-medium">
                                  {visitados}/{total} ({percentual}%)
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {ronda.observacoes && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-xs sm:text-sm text-gray-400">
                              <span className="font-medium">Observações:</span> {ronda.observacoes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

