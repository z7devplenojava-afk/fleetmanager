import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  Eye,
  Loader2,
  FileText,
  Bus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { scheduleService, Schedule } from '@/services/scheduleService';

const shiftLabel = (shift?: string) => {
  switch (shift) {
    case 'DAY':
      return 'Diurno';
    case 'NIGHT':
      return 'Noturno';
    case 'MIXED':
      return 'Misto';
    default:
      return shift || '-';
  }
};

const statusLabel = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return 'Pendente';
    case 'APPROVED':
    case 'CONFIRMED':
      return 'Confirmada';
    case 'REJECTED':
      return 'Rejeitada';
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'COMPLETED':
      return 'Concluída';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status || '-';
  }
};

const statusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'CANCELLED':
    case 'REJECTED':
      return 'destructive';
    case 'COMPLETED':
    case 'APPROVED':
    case 'CONFIRMED':
      return 'default';
    default:
      return 'outline';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  try {
    const date = parseISO(value);
    if (!isValid(date)) return value;
    return format(date, "EEEE, dd/MM/yyyy", { locale: ptBR });
  } catch {
    return value;
  }
};

const DriverTripList: React.FC = () => {
  const { toast } = useToast();
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [pdfLoading, setPdfLoading] = useState<'view' | 'download' | null>(null);

  const filters = useMemo(
    () => ({ startDate, endDate }),
    [startDate, endDate]
  );

  const {
    data: schedules = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['driver-my-schedules', filters],
    queryFn: () => scheduleService.findMySchedules(filters),
  });

  const openPdfBlob = async (action: 'view' | 'download') => {
    setPdfLoading(action);
    try {
      const blob = await scheduleService.generateMyPDFReport({
        ...filters,
        inline: action === 'view',
      });
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));

      if (action === 'view') {
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        toast({ title: 'PDF aberto', description: 'Sua escala foi aberta em uma nova aba.' });
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `minha-escala-${startDate}_${endDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'Download iniciado', description: 'O PDF da sua escala está sendo baixado.' });
      }
    } catch (err: any) {
      console.error('Erro ao gerar PDF da escala:', err);
      let message = err?.message || 'Não foi possível gerar o PDF da escala.';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch {
          /* ignore */
        }
      } else if (err?.response?.data?.message) {
        message = err.response.data.message;
      }
      toast({
        title: 'Erro no PDF',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setPdfLoading(null);
    }
  };

  const scheduleTitle = (schedule: Schedule) =>
    schedule.travelTrip?.name ||
    schedule.route?.name ||
    schedule.workPost?.name ||
    schedule.location?.name ||
    'Escala de trabalho';

  return (
    <StandardLayout
      title="Minhas Escalas"
      subtitle="Consulte sua agenda e baixe ou visualize o PDF da escala"
    >
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Escala em PDF
            </CardTitle>
            <CardDescription>
              Selecione o período e visualize ou baixe sua escala de trabalho.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => openPdfBlob('view')}
                disabled={!!pdfLoading || isLoading}
              >
                {pdfLoading === 'view' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Visualizar PDF
              </Button>
              <Button
                onClick={() => openPdfBlob('download')}
                disabled={!!pdfLoading || isLoading}
              >
                {pdfLoading === 'download' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Baixar PDF
              </Button>
              <Button
                variant="ghost"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Escalas no período
            </CardTitle>
            <CardDescription>
              {schedules.length} escala{schedules.length === 1 ? '' : 's'} encontrada
              {schedules.length === 1 ? '' : 's'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mr-3" />
                Carregando suas escalas...
              </div>
            ) : isError ? (
              <div className="text-center py-10 border-2 border-dashed rounded-lg space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-destructive opacity-70" />
                <p className="text-sm text-muted-foreground px-4">
                  {(error as any)?.response?.data?.message ||
                    (error as Error)?.message ||
                    'Não foi possível carregar suas escalas. Verifique se seu perfil de funcionário está vinculado ao usuário.'}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Nenhuma escala encontrada neste período.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-shrink-0 p-2 rounded-lg bg-blue-500/10 text-blue-600">
                      <Bus className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{scheduleTitle(schedule)}</span>
                        <Badge variant={statusVariant(schedule.status)}>
                          {statusLabel(schedule.status)}
                        </Badge>
                        <Badge variant="outline">{shiftLabel(schedule.shift)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(schedule.scheduleDate)}
                        </span>
                        {(schedule.location?.name || schedule.workPost?.name) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {schedule.location?.name || schedule.workPost?.name}
                          </span>
                        )}
                        {schedule.vehicle?.plate && (
                          <span>Veículo: {schedule.vehicle.plate}</span>
                        )}
                      </div>
                      {schedule.observations && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {schedule.observations}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default DriverTripList;
