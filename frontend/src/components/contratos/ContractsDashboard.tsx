import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import { Contract } from '@/services/contractService';

interface ContractsDashboardProps {
  contracts: Contract[];
}

interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  terminated: number;
  totalValue: number;
  expiringThisMonth: number;
  averageValue: number;
}

export const ContractsDashboard: React.FC<ContractsDashboardProps> = ({ contracts }) => {
  const calculateStats = (): DashboardStats => {
    const total = contracts.length;
    const active = contracts.filter(c => c.status === 'ACTIVE').length;
    const inactive = contracts.filter(c => c.status === 'INACTIVE').length;
    const pending = contracts.filter(c => c.status === 'PENDING').length;
    const terminated = contracts.filter(c => c.status === 'TERMINATED').length;
    
    const totalValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0);
    const averageValue = total > 0 ? totalValue / total : 0;
    
    // Contratos que vencem este mês
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const expiringThisMonth = contracts.filter(c => {
      if (!c.endDate) return false;
      const endDate = new Date(c.endDate);
      return endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear;
    }).length;

    return {
      total,
      active,
      inactive,
      pending,
      terminated,
      totalValue,
      expiringThisMonth,
      averageValue
    };
  };

  const stats = calculateStats();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'TERMINATED':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <TrendingDown className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
      {/* Total de Contratos */}
      <Card className="bg-seguranca-graphite border-gray-600 min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-seguranca-lightgray">
            Total de Contratos
          </CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-yellow" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
          <p className="text-xs text-gray-400 mt-1">
            <span className="hidden sm:inline">Todos os contratos cadastrados</span>
            <span className="sm:hidden">Total cadastrados</span>
          </p>
        </CardContent>
      </Card>

      {/* Contratos Ativos */}
      <Card className="bg-seguranca-graphite border-gray-600 min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-seguranca-lightgray">
            Contratos Ativos
          </CardTitle>
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.active}</div>
          <p className="text-xs text-gray-400 mt-1">
            {getPercentage(stats.active, stats.total)}% do total
          </p>
          <div className="flex items-center mt-1 sm:mt-2">
            <Badge className="bg-green-500 text-white text-xs">
              {stats.active} ativos
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Valor Total */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-seguranca-lightgray">
            Valor Total
          </CardTitle>
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-yellow" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-lg sm:text-2xl font-bold text-white break-words overflow-wrap-anywhere">
            {formatCurrency(stats.totalValue)}
          </div>
          <p className="text-xs text-gray-400 mt-1 break-words">
            <span className="hidden sm:inline">Média: {formatCurrency(stats.averageValue)}</span>
            <span className="sm:hidden">Média: {formatCurrency(stats.averageValue)}</span>
          </p>
        </CardContent>
      </Card>

      {/* Contratos Vencendo */}
      <Card className="bg-seguranca-graphite border-gray-600 min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-seguranca-lightgray">
            Vencendo Este Mês
          </CardTitle>
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.expiringThisMonth}</div>
          <p className="text-xs text-gray-400 mt-1">
            <span className="hidden sm:inline">Requerem atenção</span>
            <span className="sm:hidden">Atenção</span>
          </p>
          {stats.expiringThisMonth > 0 && (
            <div className="flex items-center mt-1 sm:mt-2">
              <Badge className="bg-red-500 text-white text-xs">
                Urgente
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="bg-seguranca-graphite border-gray-600 sm:col-span-2 lg:col-span-4 min-w-0">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-sm sm:text-lg font-medium text-seguranca-lightgray">
            Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto">
            <div className="flex items-center space-x-2">
              {getStatusIcon('ACTIVE')}
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-white truncate">Ativos</p>
                <p className="text-xs text-gray-400">{stats.active} contratos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {getStatusIcon('PENDING')}
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-white truncate">Pendentes</p>
                <p className="text-xs text-gray-400">{stats.pending} contratos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {getStatusIcon('INACTIVE')}
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-white truncate">Inativos</p>
                <p className="text-xs text-gray-400">{stats.inactive} contratos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {getStatusIcon('TERMINATED')}
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-white truncate">Terminados</p>
                <p className="text-xs text-gray-400">{stats.terminated} contratos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
