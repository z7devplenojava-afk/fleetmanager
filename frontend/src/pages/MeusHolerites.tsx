import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import holeriteService, { Holerite } from '@/services/holeriteService';
import { Loader2, Calendar, Download, Eye, FileText } from 'lucide-react';

const monthNames: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

const formatMonth = (month: number) => monthNames[month] ?? `Mês ${month}`;

const MeusHoleritesContent: React.FC = () => {
  const { toast } = useToast();
  const [holerites, setHolerites] = useState<Holerite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await holeriteService.getAllHolerites();
        setHolerites(data || []);
      } catch (err: any) {
        console.error('Erro ao carregar holerites do colaborador', err);
        setError(err?.response?.data?.message || 'Não foi possível carregar seus holerites.');
        toast({
          title: 'Erro ao carregar holerites',
          description: err?.response?.data?.message || 'Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  const groupedByYearAndMonth = useMemo(() => {
    const grouped: Record<number, Record<number, Holerite[]>> = {};

    holerites.forEach((holerite) => {
      if (!holerite.year || !holerite.month) {
        return;
      }

      if (!grouped[holerite.year]) {
        grouped[holerite.year] = {};
      }

      if (!grouped[holerite.year][holerite.month]) {
        grouped[holerite.year][holerite.month] = [];
      }

      grouped[holerite.year][holerite.month].push(holerite);
    });

    return grouped;
  }, [holerites]);

  const years = useMemo(() => {
    return Object.keys(groupedByYearAndMonth)
      .map((year) => Number(year))
      .sort((a, b) => b - a);
  }, [groupedByYearAndMonth]);

  const handleDownload = async (fileName: string) => {
    try {
      const blob = await holeriteService.downloadHolerite(fileName);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Erro ao baixar holerite', err);
      toast({
        title: 'Erro ao baixar',
        description: err?.response?.data?.message || 'Não foi possível baixar o holerite.',
        variant: 'destructive',
      });
    }
  };

  const handleView = async (fileName: string) => {
    try {
      const blob = await holeriteService.downloadHolerite(fileName);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      console.error('Erro ao visualizar holerite', err);
      toast({
        title: 'Erro ao visualizar',
        description: err?.response?.data?.message || 'Não foi possível abrir o holerite.',
        variant: 'destructive',
      });
    }
  };

  return (
    <StandardLayout
      title="Meus Holerites"
      subtitle="Visualize e gerencie seus holerites organizados por ano e mês"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>Carregando seus holerites...</p>
        </div>
      ) : error ? (
        <Card className="bg-red-500/10 border-red-500/40">
          <CardContent className="py-6 text-red-200">
            {error}
          </CardContent>
        </Card>
      ) : holerites.length === 0 ? (
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="py-10 flex flex-col items-center gap-3 text-gray-300">
            <FileText className="w-10 h-10" />
            <p>Nenhum holerite encontrado.</p>
            <span className="text-sm text-gray-500">
              Assim que novos holerites forem disponibilizados, eles aparecerão aqui.
            </span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {years.map((year) => {
            const months = Object.keys(groupedByYearAndMonth[year])
              .map((month) => Number(month))
              .sort((a, b) => b - a);

            return (
              <div key={year} className="space-y-4" data-animate="fadeUp">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-200">
                    {year}
                  </h2>
                  <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-500/40">
                    {months.length} mês{months.length > 1 ? 'es' : ''}
                  </Badge>
                </div>

                <Separator className="bg-gray-700" />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {months.map((month) => {
                    const items = groupedByYearAndMonth[year][month];

                    return (
                      <Card key={`${year}-${month}`} className="bg-seguranca-graphite border-gray-700 hover:border-gray-500 transition-colors">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-gray-100">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-indigo-400" />
                              {formatMonth(month)}
                            </span>
                            <Badge className="bg-gray-800 text-gray-200 border-gray-600">
                              {items.length} arquivo{items.length > 1 ? 's' : ''}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-gray-700 bg-seguranca-black/40 p-3 space-y-3"
                            >
                              <div className="space-y-1 text-sm text-gray-300">
                                <p className="font-medium text-gray-100">{item.employeeName}</p>
                                <p className="text-xs text-gray-400">CPF: {item.cpf}</p>
                                <p className="text-xs text-gray-500 truncate">{item.fileName}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-600 text-gray-100 hover:bg-gray-800"
                                  onClick={() => handleView(item.fileName)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Visualizar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                  onClick={() => handleDownload(item.fileName)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Baixar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StandardLayout>
  );
};

const MeusHolerites: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = (user.role ?? '').replace(/^ROLE_/, '').toUpperCase();

  if (normalizedRole !== 'COLABORADOR') {
    return <Navigate to="/holerites" replace />;
  }

  return <MeusHoleritesContent />;
};

export default MeusHolerites;
