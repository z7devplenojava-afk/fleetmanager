import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  DollarSign, 
  Users,
  Loader2,
  BarChart3
} from 'lucide-react';
import api from '@/lib/axios';
import { Driver } from '@/types/driver';

interface DriverRankingData {
  driver: string;
  totalFuel: number;
  totalCost: number;
  totalRecords: number;
}

interface DriverRankingStatsProps {
  drivers: Driver[];
}

export const DriverRankingStats: React.FC<DriverRankingStatsProps> = ({ drivers }) => {
  const [rankingType, setRankingType] = useState<'consumption' | 'cost'>('consumption');
  const [topDrivers, setTopDrivers] = useState<DriverRankingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Garantir que drivers seja sempre um array
  const driversArray = Array.isArray(drivers) ? drivers : [];

  const loadRanking = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = rankingType === 'consumption' 
        ? '/api/fuel-records/stats/drivers/top-consumption'
        : '/api/fuel-records/stats/drivers/top-cost';
      
      const response = await api.get(endpoint);
      
      setTopDrivers(response.data.map((item: any) => ({
        driver: typeof item[0] === 'object' ? item[0].name : String(item[0]),
        totalFuel: Number(item[1]) || 0,
        totalCost: Number(item[2]) || 0,
        totalRecords: Number(item[3]) || 0
      })));
    } catch (err: any) {
      console.error('Erro ao carregar ranking:', err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar ranking');
      toast({
        title: "Erro",
        description: "Não foi possível carregar o ranking de motoristas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
  }, [rankingType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 0: return <Trophy className="text-yellow-500" size={20} />;
      case 1: return <Trophy className="text-gray-400" size={20} />;
      case 2: return <Trophy className="text-amber-600" size={20} />;
      default: return <span className="text-seguranca-lightgray font-bold">{position + 1}</span>;
    }
  };

  const getRankingColor = (position: number) => {
    switch (position) {
      case 0: return 'bg-yellow-500/10 border-yellow-500/20';
      case 1: return 'bg-gray-500/10 border-gray-500/20';
      case 2: return 'bg-amber-600/10 border-amber-600/20';
      default: return 'bg-seguranca-black border-gray-600';
    }
  };

  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Trophy className="text-seguranca-yellow" size={20} />
            Ranking de Motoristas
          </CardTitle>
          
          <Select value={rankingType} onValueChange={(value: 'consumption' | 'cost') => setRankingType(value)}>
            <SelectTrigger className="w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-black border-gray-600">
              <SelectItem value="consumption" className="text-seguranca-lightgray">
                <div className="flex items-center gap-2">
                  <Fuel size={16} />
                  Por Consumo
                </div>
              </SelectItem>
              <SelectItem value="cost" className="text-seguranca-lightgray">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} />
                  Por Custo
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Verificar se há motoristas disponíveis */}
        {driversArray.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-400 mt-2">Nenhum motorista encontrado</p>
            <p className="text-sm text-gray-500 mt-1">
              Registre abastecimentos com motoristas para ver o ranking
            </p>
          </div>
        ) : (
          <>
            {/* Loading */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <Loader2 size={32} className="animate-spin text-seguranca-yellow" />
                <span className="ml-2 text-seguranca-lightgray">Carregando ranking...</span>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Ranking */}
            {topDrivers.length > 0 && !loading && (
              <div className="space-y-3">
                {topDrivers.slice(0, 10).map((driver, index) => (
                  <div
                    key={`driver-ranking-${index}-${driver.driver}`}
                    className={`p-4 rounded-lg border ${getRankingColor(index)} transition-all duration-200 hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankingIcon(index)}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-seguranca-lightgray">
                            {typeof driver.driver === 'string' ? driver.driver : 'Motorista Desconhecido'}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {driver.totalRecords} abastecimento{driver.totalRecords !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {rankingType === 'consumption' ? (
                            <>
                              <Fuel className="text-seguranca-yellow" size={16} />
                              <span className="font-bold text-seguranca-lightgray">
                                {formatNumber(driver.totalFuel)} L
                              </span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="text-seguranca-yellow" size={16} />
                              <span className="font-bold text-seguranca-lightgray">
                                {formatCurrency(driver.totalCost)}
                              </span>
                            </>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-400">
                          {rankingType === 'consumption' 
                            ? `Custo: ${formatCurrency(driver.totalCost)}`
                            : `Combustível: ${formatNumber(driver.totalFuel)} L`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {topDrivers.length === 0 && !loading && !error && (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-400" size={48} />
                <p className="text-gray-400 mt-2">Nenhum motorista encontrado</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}; 