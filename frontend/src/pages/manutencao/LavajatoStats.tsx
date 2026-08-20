import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BarChart3, TrendingUp, AlertTriangle, Award, Clock, ChevronDown, ChevronUp, Bus, X } from 'lucide-react';
import { lavajatoService, LavajatoStats, formatDuration } from '@/services/lavajatoService';
import fleetService from '@/services/fleetService';
import { useToast } from '@/hooks/use-toast';

interface VehicleOption { id: string; plate: string; model: string; }

/** Mapeamento de keys dos checklists para nomes legíveis. */
const CHECKLIST_ITEM_NAMES: Record<string, string> = {
  // Internos
  'bancos': 'Bancos',
  'painel': 'Painel',
  'tapetes': 'Tapetes',
  'vidros-internos': 'Vidros Internos',
  'porta-malas': 'Porta-malas',
  'purificador': 'Air Freshener / Purificador',
  'console-central': 'Console Central',
  'pedais': 'Pedais e Caixa de Fusíveis',
  'teto-colunas': 'Teto e Colunas',
  'retrovisores-internos': 'Retrovisores Internos',
  'flushing': 'Flushing / Desinfecção',
  'compartimento-portas': 'Compartimentos das Portas',
  'bagageiro': 'Bagageiro',
  // Externos
  'lavagem-carroceria': 'Carroceria',
  'chapas': 'Chapas',
  'rodas': 'Rodas',
  'pneus': 'Pneus',
  'vidros-externos': 'Vidros Externos',
};

const LavajatoStatsPanel: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<LavajatoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('ALL');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    duration: true,
    skipped: true,
    vehicles: true,
    operators: true,
  });

  const loadStats = useCallback(async (vehicleId?: string) => {
    setLoading(true);
    try {
      const data = await lavajatoService.getStats(vehicleId === 'ALL' ? undefined : vehicleId);
      setStats(data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar estatísticas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Carregar lista de veículos
  useEffect(() => {
    fleetService.getVehicles()
      .then((data: any[]) => setVehicles(data.map((v: any) => ({ id: v.id, plate: v.plate, model: v.model || '' }))))
      .catch(() => {});
  }, []);

  const handleVehicleFilter = (value: string) => {
    setSelectedVehicleId(value);
    loadStats(value);
  };

  // Encontrar placa do veículo selecionado
  const selectedVehicleLabel = selectedVehicleId !== 'ALL'
    ? vehicles.find(v => v.id === selectedVehicleId)
    : null;

  const toggle = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-seguranca-yellow animate-spin" />
          <span className="ml-2 text-gray-400 text-sm">Carregando estatísticas...</span>
        </div>
      </Card>
    );
  }

  if (!stats || stats.totalRecords === 0) return null;

  const renderBar = (label: string, value: number, max: number, color: string) => {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-400 w-40 truncate" title={label}>{label}</span>
        <div className="flex-1 bg-seguranca-black/50 rounded-full h-4 overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-white font-mono text-xs w-12 text-right">{value}</span>
      </div>
    );
  };

  const SectionHeader = ({ title, icon, sectionKey }: { title: string; icon: React.ReactNode; sectionKey: string }) => (
    <button
      onClick={() => toggle(sectionKey)}
      className="flex items-center gap-2 text-sm font-semibold text-seguranca-yellow uppercase tracking-wide w-full mb-3 hover:text-yellow-400 transition-colors"
    >
      {icon} {title}
      {expandedSections[sectionKey] ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
    </button>
  );

  // Skipped items separated
  const sortedInternalSkipped = Object.entries(stats.skippedInternalItems || {})
    .sort(([, a], [, b]) => b - a).slice(0, 8);
  const sortedExternalSkipped = Object.entries(stats.skippedExternalItems || {})
    .sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxSkippedInternal = sortedInternalSkipped.length > 0 ? sortedInternalSkipped[0][1] : 0;
  const maxSkippedExternal = sortedExternalSkipped.length > 0 ? sortedExternalSkipped[0][1] : 0;

  const topVehiclesArr = Object.entries(stats.topVehicles || {}).slice(0, 5);
  const maxVehicleCount = topVehiclesArr.length > 0 ? topVehiclesArr[0][1] : 0;

  const topOperatorsArr = Object.entries(stats.topOperators || {}).slice(0, 5);
  const maxOperatorCount = topOperatorsArr.length > 0 ? topOperatorsArr[0][1] : 0;

  return (
    <Card className="bg-seguranca-graphite border-gray-700 p-5 mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <BarChart3 size={20} className="text-seguranca-yellow" />
        <h3 className="text-white font-bold text-lg">Dashboard — Estatísticas do Lavajato</h3>
        {selectedVehicleLabel && (
          <span className="text-xs bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
            <Bus size={12} /> {selectedVehicleLabel.plate} {selectedVehicleLabel.model}
            <button onClick={() => handleVehicleFilter('ALL')} className="hover:text-white ml-0.5">
              <X size={10} />
            </button>
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-56">
            <Select value={selectedVehicleId} onValueChange={handleVehicleFilter}>
              <SelectTrigger className="h-8 bg-seguranca-black border-gray-700 text-xs text-gray-300">
                <SelectValue placeholder="Filtrar por veículo" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-60">
                <SelectItem value="ALL">Todos os veículos</SelectItem>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.plate} {v.model ? `- ${v.model}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white" onClick={() => loadStats(selectedVehicleId)}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards Row */}
      {selectedVehicleLabel && (
        <p className="text-xs text-gray-400 mb-3">
          Mostrando estatísticas de <span className="text-sky-400 font-semibold">{selectedVehicleLabel.plate}</span> {selectedVehicleLabel.model}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase">Média de Limpeza</p>
          <p className="text-lg font-bold text-sky-400 font-mono">{formatDuration(stats.avgDurationSeconds)}</p>
        </div>
        <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase">Mínima</p>
          <p className="text-lg font-bold text-emerald-400 font-mono">{formatDuration(stats.minDurationSeconds)}</p>
        </div>
        <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase">Máxima</p>
          <p className="text-lg font-bold text-red-400 font-mono">{formatDuration(stats.maxDurationSeconds)}</p>
        </div>
        <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase">Hoje</p>
          <p className="text-lg font-bold text-seguranca-yellow">{stats.completedToday}</p>
        </div>
        <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase">Esta Semana</p>
          <p className="text-lg font-bold text-seguranca-yellow">{stats.completedThisWeek}</p>
        </div>
        <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase">Este Mês</p>
          <p className="text-lg font-bold text-seguranca-yellow">{stats.completedThisMonth}</p>
        </div>
      </div>

      {/* Completion Rate Bar */}
      <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50 mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Taxa de Conclusão</span>
          <span className="text-sm font-bold text-emerald-400">{stats.completionRate}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-600">{stats.completed} finalizados</span>
          <span className="text-[10px] text-gray-600">{stats.totalRecords} total</span>
        </div>
      </div>

      {/* Skipped Items */}
      {(sortedInternalSkipped.length > 0 || sortedExternalSkipped.length > 0) && (
        <div className="bg-seguranca-black/50 rounded-lg p-4 border border-gray-700/50 mb-5">
          <SectionHeader title="Itens Mais Frequentemente Pulados" icon={<AlertTriangle size={16} />} sectionKey="skipped" />
          {expandedSections.skipped && (
            <div className="space-y-5">
              {sortedInternalSkipped.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">🏠 Checklist Interno</p>
                  <div className="space-y-2">
                    {sortedInternalSkipped.map(([key, count]) => (
                      <div key={key}>
                        {renderBar(
                          CHECKLIST_ITEM_NAMES[key] || key,
                          count,
                          maxSkippedInternal,
                          'bg-gradient-to-r from-amber-600 to-amber-400'
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sortedExternalSkipped.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">🚗 Checklist Externo</p>
                  <div className="space-y-2">
                    {sortedExternalSkipped.map(([key, count]) => (
                      <div key={key}>
                        {renderBar(
                          CHECKLIST_ITEM_NAMES[key] || key,
                          count,
                          maxSkippedExternal,
                          'bg-gradient-to-r from-orange-600 to-orange-400'
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-500 italic">
                Baseado em {stats.completed} serviços finalizados. Itens mais pulados indicam áreas que precisam de atenção.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top Vehicles — oculto quando filtrado por veículo específico */}
      {selectedVehicleId === 'ALL' && topVehiclesArr.length > 0 && (
        <div className="bg-seguranca-black/50 rounded-lg p-4 border border-gray-700/50 mb-5">
          <SectionHeader title="Veículos Mais Lavados" icon={<TrendingUp size={16} />} sectionKey="vehicles" />
          {expandedSections.vehicles && (
            <div className="space-y-2">
              {topVehiclesArr.map(([plate, count]) => (
                <div key={plate}>
                  {renderBar(plate, count, maxVehicleCount, 'bg-gradient-to-r from-sky-600 to-sky-400')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Operators */}
      {topOperatorsArr.length > 0 && (
        <div className="bg-seguranca-black/50 rounded-lg p-4 border border-gray-700/50">
          <SectionHeader title="Operadores que Mais Realizaram Serviços" icon={<Award size={16} />} sectionKey="operators" />
          {expandedSections.operators && (
            <div className="space-y-2">
              {topOperatorsArr.map(([name, count]) => (
                <div key={name}>
                  {renderBar(name, count, maxOperatorCount, 'bg-gradient-to-r from-purple-600 to-purple-400')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default LavajatoStatsPanel;
