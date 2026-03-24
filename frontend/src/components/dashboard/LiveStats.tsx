import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, FileText, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatItem {
  id: string;
  label: string;
  value: string | number;
  change: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon: React.ComponentType<any>;
  color: string;
}

interface LiveStatsProps {
  className?: string;
}

const LiveStats: React.FC<LiveStatsProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados em tempo real
    const loadStats = () => {
      setIsLoading(true);
      
      // Simular delay de API
      setTimeout(() => {
        setStats([
          {
            id: 'users',
            label: 'Usuários Online',
            value: Math.floor(Math.random() * 50) + 100,
            change: {
              value: Math.floor(Math.random() * 20) + 1,
              isPositive: Math.random() > 0.3,
              period: 'última hora'
            },
            icon: Users,
            color: 'text-blue-500'
          },
          {
            id: 'revenue',
            label: 'Receita Hoje',
            value: `R$ ${(Math.random() * 10000 + 5000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            change: {
              value: Math.floor(Math.random() * 15) + 5,
              isPositive: Math.random() > 0.2,
              period: 'vs ontem'
            },
            icon: DollarSign,
            color: 'text-green-500'
          },
          {
            id: 'contracts',
            label: 'Contratos Ativos',
            value: Math.floor(Math.random() * 20) + 40,
            change: {
              value: Math.floor(Math.random() * 10) + 1,
              isPositive: Math.random() > 0.4,
              period: 'este mês'
            },
            icon: FileText,
            color: 'text-yellow-500'
          },
          {
            id: 'equipment',
            label: 'Equipamentos',
            value: Math.floor(Math.random() * 50) + 200,
            change: {
              value: Math.floor(Math.random() * 8) + 1,
              isPositive: Math.random() > 0.3,
              period: 'última semana'
            },
            icon: Package,
            color: 'text-orange-500'
          }
        ]);
        
        setIsLoading(false);
      }, 1000);
    };

    loadStats();
    
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="bg-seguranca-black border-gray-700 animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-20"></div>
                  <div className="h-8 bg-gray-600 rounded w-16"></div>
                </div>
                <div className="h-10 w-10 bg-gray-600 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.id} className="bg-seguranca-black border-gray-700 hover:border-seguranca-yellow transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.change.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                    )}
                    <span className={`text-xs flex items-center ${
                      stat.change.isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.change.value}% {stat.change.period}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className={`p-3 rounded-lg bg-opacity-20 ${stat.color.replace('text-', 'bg-')}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LiveStats;
