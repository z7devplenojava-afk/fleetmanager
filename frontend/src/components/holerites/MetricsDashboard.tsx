import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

interface MetricsData {
  totalFuncionarios: number;
  totalEnvios: number;
  enviosEmail: number;
  enviosWhatsapp: number;
  enviosSucesso: number;
  enviosFalha: number;
  enviosPendentes: number;
  taxaSucesso: number;
  mediaTempoEnvio: number;
  crescimentoMes: number;
}

interface MetricsDashboardProps {
  data: MetricsData;
  isLoading?: boolean;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data, isLoading = false }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalFuncionarios)}</div>
            <p className="text-xs text-muted-foreground">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Envios</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalEnvios)}</div>
            <p className="text-xs text-muted-foreground">
              Todos os tempos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.taxaSucesso)}</div>
            <Progress value={data.taxaSucesso} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Mensal</CardTitle>
            {data.crescimentoMes >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.crescimentoMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.crescimentoMes >= 0 ? '+' : ''}{formatPercentage(data.crescimentoMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Envio por Canal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>Email</span>
              </div>
              <Badge variant="secondary">{formatNumber(data.enviosEmail)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span>WhatsApp</span>
              </div>
              <Badge variant="secondary">{formatNumber(data.enviosWhatsapp)}</Badge>
            </div>
            <Progress 
              value={(data.enviosEmail / data.totalEnvios) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status dos Envios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Sucesso</span>
              </div>
              <Badge variant="default">{formatNumber(data.enviosSucesso)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>Falha</span>
              </div>
              <Badge variant="destructive">{formatNumber(data.enviosFalha)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span>Pendente</span>
              </div>
              <Badge variant="outline">{formatNumber(data.enviosPendentes)}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tempo Médio de Envio</div>
              <div className="text-2xl font-bold">{formatTime(data.mediaTempoEnvio)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Eficiência</div>
              <Progress value={data.taxaSucesso} className="mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {formatPercentage(data.taxaSucesso)} de sucesso
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {formatPercentage((data.enviosEmail / data.totalEnvios) * 100)}
              </div>
              <div className="text-sm text-muted-foreground">Envios por Email</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatPercentage((data.enviosWhatsapp / data.totalEnvios) * 100)}
              </div>
              <div className="text-sm text-muted-foreground">Envios por WhatsApp</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatNumber(data.totalEnvios / Math.max(data.totalFuncionarios, 1))}
              </div>
              <div className="text-sm text-muted-foreground">Média por Funcionário</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricsDashboard; 