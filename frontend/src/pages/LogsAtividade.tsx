import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Loader2, RefreshCw, Search } from 'lucide-react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { activityLogService, type UserActivityLog } from '@/services/activityLogService';

const statusStyles: Record<string, string> = {
  SUCCESS: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  ERROR: 'bg-red-500/15 text-red-300 border-red-500/30',
  WARNING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
};

const LogsAtividade: React.FC = () => {
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await activityLogService.getLogs({ size: 200 });
      setLogs(response.content || []);
      setError(null);
    } catch {
      setLogs([]);
      setError('Não foi possível carregar os logs de atividade.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) =>
      [log.username, log.action, log.module, log.details, log.status]
        .some((value) => (value || '').toLowerCase().includes(term))
    );
  }, [logs, search]);

  return (
    <StandardLayout title="Logs de Atividade" subtitle="Histórico de ações realizadas no sistema">
      <div className="space-y-4 sm:space-y-6">
        <Card className="bg-seguranca-graphite/60 border-gray-700/60">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Activity className="h-4 w-4 text-seguranca-yellow" />
              Registros ({filteredLogs.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por usuário, ação, módulo..."
                  className="h-9 w-full pl-8 sm:w-72"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadLogs()}
                disabled={loading}
                className="h-9 gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando logs...
              </div>
            ) : error ? (
              <div className="py-12 text-center text-sm text-red-300">{error}</div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Nenhum log de atividade encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/60 text-gray-400">
                      <th className="px-2 py-2 font-medium">Data</th>
                      <th className="px-2 py-2 font-medium">Usuário</th>
                      <th className="px-2 py-2 font-medium">Ação</th>
                      <th className="px-2 py-2 font-medium">Módulo</th>
                      <th className="px-2 py-2 font-medium">Detalhes</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-800/60 text-gray-200">
                        <td className="whitespace-nowrap px-2 py-2">{formatDate(log.createdAt)}</td>
                        <td className="px-2 py-2">{log.username}</td>
                        <td className="px-2 py-2">{log.action}</td>
                        <td className="px-2 py-2">{log.module || '—'}</td>
                        <td className="max-w-[280px] truncate px-2 py-2" title={log.details}>
                          {log.details || '—'}
                        </td>
                        <td className="px-2 py-2">
                          <Badge
                            variant="outline"
                            className={statusStyles[log.status] || 'bg-gray-500/15 text-gray-300 border-gray-500/30'}
                          >
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default LogsAtividade;
