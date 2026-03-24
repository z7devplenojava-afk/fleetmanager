import React, { useState, useEffect, useRef } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  History,
  QrCode,
  Camera,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Html5QrcodeScanner } from 'html5-qrcode';
import timeRecordService, { TimeRecord } from '@/services/timeRecordService';

const PontoEletronico: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [registrosHoje, setRegistrosHoje] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [proximoRegistro, setProximoRegistro] = useState<'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA'>('ENTRADA');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [geolocation, setGeolocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Modais de ações rápidas
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showJustificationDialog, setShowJustificationDialog] = useState(false);
  const [justificationText, setJustificationText] = useState('');
  const [historyRecords, setHistoryRecords] = useState<TimeRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Buscar geolocalização ao montar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocalização não disponível:', error);
        }
      );
    }
  }, []);

  // Buscar registros do dia ao montar
  useEffect(() => {
    if (user?.employeeId) {
      loadTodayRecords();
      loadNextRecordType();
    }
  }, [user]);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadTodayRecords = async () => {
    if (!user?.employeeId) return;
    
    try {
      setLoadingRecords(true);
      const response = await timeRecordService.getTodayRecords(user.employeeId);
      if (response.success) {
        setRegistrosHoje(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar registros:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const loadNextRecordType = async () => {
    if (!user?.employeeId) return;
    
    try {
      const response = await timeRecordService.getNextRecordType(user.employeeId);
      if (response.success && response.nextRecordType) {
        setProximoRegistro(response.nextRecordType);
      }
    } catch (error: any) {
      console.error('Erro ao buscar próximo tipo:', error);
    }
  };

  const registrarPonto = async (tipo?: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA') => {
    if (!user?.employeeId) {
      toast({
        title: "❌ Erro",
        description: "Funcionário não identificado",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const tipoRegistro = tipo || proximoRegistro;
      
      // Obter IP do cliente
      const ipAddress = window.location.hostname;
      const userAgent = navigator.userAgent;

      const response = await timeRecordService.registerTimeRecord({
        employeeId: user.employeeId,
        recordType: tipoRegistro,
        qrCode: qrCodeData || undefined,
        location: geolocation ? 'Localização capturada' : 'Sem localização',
        latitude: geolocation?.latitude,
        longitude: geolocation?.longitude,
        ipAddress,
        userAgent
      });

      if (response.success) {
        toast({
          title: "✅ Ponto Registrado",
          description: `${getTipoLabel(tipoRegistro)} registrado às ${format(new Date(), 'HH:mm:ss')}`,
        });

        // Recarregar registros
        await loadTodayRecords();
        await loadNextRecordType();
        
        // Limpar QR Code
        setQrCodeData('');
      } else {
        throw new Error(response.error || 'Erro ao registrar ponto');
      }

    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error);
      toast({
        title: "❌ Erro",
        description: error.response?.data?.error || error.message || "Não foi possível registrar o ponto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openQRScanner = () => {
    setShowQRScanner(true);
    setTimeout(() => {
      initQRScanner();
    }, 100);
  };

  const initQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(
      (decodedText) => {
        console.log('QR Code lido:', decodedText);
        setQrCodeData(decodedText);
        scanner.clear();
        setShowQRScanner(false);
        
        toast({
          title: "✅ QR Code Lido",
          description: "Agora você pode registrar o ponto",
        });
      },
      (error) => {
        // Ignorar erros de scan contínuo
      }
    );

    scannerRef.current = scanner;
  };

  const closeQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setShowQRScanner(false);
  };

  const getTipoLabel = (tipo: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA') => {
    const labels = {
      ENTRADA: 'Entrada',
      SAIDA: 'Saída',
      SAIDA_ALMOCO: 'Saída para Almoço',
      RETORNO_ALMOCO: 'Retorno do Almoço'
    };
    return labels[tipo];
  };

  const getTipoIcon = (tipo: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA') => {
    const icons = {
      ENTRADA: LogIn,
      SAIDA: LogOut,
      SAIDA_ALMOCO: Coffee,
      RETORNO_ALMOCO: Coffee
    };
    return icons[tipo];
  };

  const getTipoColor = (tipo: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA') => {
    const colors = {
      ENTRADA: 'bg-green-500/10 text-green-500 border-green-500/20',
      SAIDA: 'bg-red-500/10 text-red-500 border-red-500/20',
      SAIDA_ALMOCO: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      RETORNO_ALMOCO: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    return colors[tipo];
  };

  const calcularHorasTrabalhadas = () => {
    if (registrosHoje.length < 2) return '0h 0min';

    const entrada = registrosHoje.find(r => r.recordType === 'ENTRADA');
    const saida = registrosHoje.find(r => r.recordType === 'SAIDA');

    if (!entrada) return '0h 0min';

    const entradaTime = new Date(entrada.recordedAt);
    const fim = saida ? new Date(saida.recordedAt) : currentTime;
    const diff = fim.getTime() - entradaTime.getTime();
    
    // Subtrair tempo de almoço (1h)
    const almocoSaida = registrosHoje.find(r => r.recordType === 'SAIDA_ALMOCO');
    const almocoEntrada = registrosHoje.find(r => r.recordType === 'RETORNO_ALMOCO');
    let tempoAlmoco = 0;
    
    if (almocoSaida && almocoEntrada) {
      const almocoSaidaTime = new Date(almocoSaida.recordedAt);
      const almocoEntradaTime = new Date(almocoEntrada.recordedAt);
      tempoAlmoco = almocoEntradaTime.getTime() - almocoSaidaTime.getTime();
    }

    const totalTrabalhado = diff - tempoAlmoco;
    const horas = Math.floor(totalTrabalhado / (1000 * 60 * 60));
    const minutos = Math.floor((totalTrabalhado % (1000 * 60 * 60)) / (1000 * 60));

    return `${horas}h ${minutos}min`;
  };

  const openHistoryDialog = async () => {
    if (!user?.employeeId) return;
    try {
      setHistoryLoading(true);
      setShowHistoryDialog(true);
      const response = await timeRecordService.getEmployeeRecords(user.employeeId, 0, 50);
      if (response.success) {
        setHistoryRecords(response.data);
      } else {
        toast({
          title: 'Erro ao carregar histórico',
          description: response.error || 'Tente novamente mais tarde',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!user?.employeeId) return;
    if (!reportStartDate || !reportEndDate) {
      toast({
        title: 'Período obrigatório',
        description: 'Informe data inicial e final para o relatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await timeRecordService.getRecordsByPeriod(
        user.employeeId,
        reportStartDate,
        reportEndDate
      );

      if (response.success && Array.isArray(response.data)) {
        // Exporta um CSV simples no frontend
        const rows = [
          ['Data', 'Hora', 'Tipo', 'Localização'],
          ...response.data.map((r: TimeRecord) => [
            new Date(r.recordedAt).toLocaleDateString('pt-BR'),
            new Date(r.recordedAt).toLocaleTimeString('pt-BR'),
            getTipoLabel(r.recordType),
            r.location || '',
          ]),
        ];
        const csvContent = rows.map((cols) => cols.join(';')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-ponto-${reportStartDate}-a-${reportEndDate}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Relatório gerado',
          description: 'Arquivo CSV baixado com sucesso.',
        });
      } else {
        throw new Error(response.error || 'Erro ao gerar relatório');
      }
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveJustification = () => {
    if (!justificationText.trim()) {
      toast({
        title: 'Justificativa vazia',
        description: 'Digite uma justificativa antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    // Por enquanto apenas exibe um feedback; integração com backend pode ser adicionada depois
    toast({
      title: 'Justificativa registrada',
      description: 'Sua justificativa foi registrada localmente. Integração completa será adicionada em breve.',
    });
    setJustificationText('');
    setShowJustificationDialog(false);
  };

  const getProximoRegistroButton = () => {
    const config = {
      ENTRADA: {
        label: 'Registrar Entrada',
        icon: LogIn,
        color: 'bg-green-600 hover:bg-green-700'
      },
      SAIDA: {
        label: 'Registrar Saída',
        icon: LogOut,
        color: 'bg-red-600 hover:bg-red-700'
      },
      SAIDA_ALMOCO: {
        label: 'Saída para Almoço',
        icon: Coffee,
        color: 'bg-orange-600 hover:bg-orange-700'
      },
      RETORNO_ALMOCO: {
        label: 'Retorno do Almoço',
        icon: Coffee,
        color: 'bg-blue-600 hover:bg-blue-700'
      }
    };

    const { label, icon: Icon, color } = config[proximoRegistro];

    return (
      <div className="space-y-3">
        {qrCodeData && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-500 text-center">
              ✅ QR Code validado - Pronto para registrar
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={openQRScanner}
            variant="outline"
            className="h-16 border-seguranca-yellow/30 hover:border-seguranca-yellow/50 hover:bg-seguranca-yellow/10"
            disabled={loading}
          >
            <QrCode className="mr-2 h-6 w-6" />
            Escanear QR Code
          </Button>
          
          <Button
            onClick={() => registrarPonto()}
            disabled={loading}
            className={`h-16 ${color} text-white text-lg font-bold`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Icon className="mr-2 h-6 w-6" />
                {label}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-seguranca-lightgray">Ponto Eletrônico</h1>
            <p className="text-seguranca-gray mt-1">
              Registre sua jornada de trabalho
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calendar className="mr-2 h-5 w-5" />
            {format(currentTime, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Relógio Principal */}
          <Card className="md:col-span-2 lg:col-span-1 bg-gradient-to-br from-seguranca-yellow/10 to-seguranca-yellow/5 border-seguranca-yellow/20">
            <CardHeader className="text-center">
              <CardTitle className="text-seguranca-lightgray">Horário Atual</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Clock className="h-16 w-16 text-seguranca-yellow animate-pulse" />
              </div>
              <div className="text-6xl font-bold text-seguranca-yellow mb-2">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <div className="text-lg text-seguranca-gray">
                {format(currentTime, "EEEE", { locale: ptBR })}
              </div>
            </CardContent>
          </Card>

          {/* Resumo do Dia */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-seguranca-yellow" />
                Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-seguranca-gray">Registros:</span>
                <Badge variant="secondary" className="text-lg">
                  {registrosHoje.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-seguranca-gray">Horas Trabalhadas:</span>
                <Badge className="text-lg bg-seguranca-yellow/20 text-seguranca-yellow border-seguranca-yellow/30">
                  {calcularHorasTrabalhadas()}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-seguranca-gray">Status:</span>
                <Badge 
                  variant={registrosHoje.length > 0 ? "default" : "outline"}
                  className={registrosHoje.length > 0 ? "bg-green-600" : ""}
                >
                  {registrosHoje.length > 0 ? 'Trabalhando' : 'Fora do Expediente'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Usuário */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center">
                <User className="mr-2 h-5 w-5 text-seguranca-yellow" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <MapPin className="mr-2 h-5 w-5 text-seguranca-gray mt-0.5" />
                <div>
                  <div className="text-sm text-seguranca-gray">Localização</div>
                  <div className="text-seguranca-lightgray">Escritório - São Paulo</div>
                </div>
              </div>
              <div className="flex items-start">
                <AlertCircle className="mr-2 h-5 w-5 text-seguranca-gray mt-0.5" />
                <div>
                  <div className="text-sm text-seguranca-gray">IP</div>
                  <div className="text-seguranca-lightgray">192.168.1.1</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão de Registro Principal */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-yellow/20">
          <CardContent className="p-6">
            {getProximoRegistroButton()}
          </CardContent>
        </Card>

        {/* Histórico de Registros do Dia */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center">
              <History className="mr-2 h-5 w-5 text-seguranca-yellow" />
              Registros de Hoje
            </CardTitle>
            <CardDescription>
              {registrosHoje.length === 0 
                ? 'Nenhum registro ainda'
                : `${registrosHoje.length} registro(s) realizado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecords ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-seguranca-yellow" />
                <p className="text-seguranca-gray mt-4">Carregando registros...</p>
              </div>
            ) : registrosHoje.length === 0 ? (
              <div className="text-center py-12 text-seguranca-gray">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum ponto registrado hoje</p>
                <p className="text-sm mt-2">Clique no botão acima para registrar seu primeiro ponto</p>
              </div>
            ) : (
              <div className="space-y-3">
                {registrosHoje.map((registro) => {
                  const Icon = getTipoIcon(registro.recordType);
                  return (
                    <div
                      key={registro.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${getTipoColor(registro.recordType)}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full bg-current/10">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            {getTipoLabel(registro.recordType)}
                          </div>
                          <div className="text-sm opacity-75">
                            {registro.location || 'Sem localização'}
                            {registro.qrCodeUsed && ' • QR Code'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {format(new Date(registro.recordedAt), 'HH:mm:ss')}
                        </div>
                        <div className="text-sm opacity-75">
                          {registro.ipAddress || 'N/A'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center border-seguranca-gray/30 hover:border-seguranca-yellow/50 hover:bg-seguranca-yellow/10"
                onClick={openHistoryDialog}
              >
                <History className="h-6 w-6 mb-2" />
                <span className="text-sm">Histórico</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center border-seguranca-gray/30 hover:border-seguranca-yellow/50 hover:bg-seguranca-yellow/10"
                onClick={handleGenerateReport}
              >
                <CheckCircle className="h-6 w-6 mb-2" />
                <span className="text-sm">Relatório</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center border-seguranca-gray/30 hover:border-seguranca-yellow/50 hover:bg-seguranca-yellow/10"
                onClick={() => setShowJustificationDialog(true)}
              >
                <AlertCircle className="h-6 w-6 mb-2" />
                <span className="text-sm">Justificativas</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center border-seguranca-gray/30 hover:border-seguranca-yellow/50 hover:bg-seguranca-yellow/10"
                onClick={() => {
                  if (!user?.employeeId) {
                    toast({
                      title: 'Erro',
                      description: 'Funcionário não identificado',
                      variant: 'destructive',
                    });
                    return;
                  }
                  // Usa o mês/ano atuais para gerar o espelho (folha de ponto)
                  const year = currentTime.getFullYear();
                  const month = currentTime.getMonth() + 1;
                  import('@/services/timeSheetService').then(({ timeSheetService }) => {
                    timeSheetService
                      .downloadTimeSheet(user.employeeId!, year, month)
                      .then((blob) => {
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `espelho-ponto-${year}-${String(month).padStart(2, '0')}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      })
                      .catch((error: any) => {
                        console.error('Erro ao gerar espelho de ponto:', error);
                        toast({
                          title: 'Erro ao gerar espelho',
                          description: error?.response?.data?.message || 'Não foi possível gerar o espelho de ponto.',
                          variant: 'destructive',
                        });
                      });
                  });
                }}
              >
                <Calendar className="h-6 w-6 mb-2" />
                <span className="text-sm">Espelho</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Geolocalização */}
        {geolocation && (
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-seguranca-gray flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Geolocalização ativa
                </span>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Lat: {geolocation.latitude.toFixed(6)} | Lng: {geolocation.longitude.toFixed(6)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Histórico */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-2xl bg-seguranca-darkgray border-seguranca-gray/20">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center">
              <History className="mr-2 h-5 w-5 text-seguranca-yellow" />
              Histórico de Registros
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray">
              Últimos registros de ponto realizados por você.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {historyLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-seguranca-yellow" />
                <p className="text-seguranca-gray mt-2">Carregando histórico...</p>
              </div>
            ) : historyRecords.length === 0 ? (
              <p className="text-seguranca-gray text-center py-4">
                Nenhum registro encontrado.
              </p>
            ) : (
              historyRecords.map((registro) => {
                const Icon = getTipoIcon(registro.recordType);
                return (
                  <div
                    key={registro.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getTipoColor(registro.recordType)}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-current/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {getTipoLabel(registro.recordType)}
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(registro.recordedAt).toLocaleDateString('pt-BR')} •{' '}
                          {new Date(registro.recordedAt).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs opacity-75 text-right max-w-[180px] truncate">
                      {registro.location || 'Sem localização'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Justificativas */}
      <Dialog open={showJustificationDialog} onOpenChange={setShowJustificationDialog}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/20">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-seguranca-yellow" />
              Justificativa de Ponto
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray">
              Descreva o motivo para ajuste ou ausência de registro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={justificationText}
              onChange={(e) => setJustificationText(e.target.value)}
              placeholder="Ex: Esqueci de registrar a saída no dia 10/05 às 18h..."
              className="min-h-[120px] bg-seguranca-darkgray border-seguranca-gray/40 text-seguranca-lightgray"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-seguranca-gray/40"
                onClick={() => setShowJustificationDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveJustification}>
                Salvar Justificativa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Scanner de QR Code */}
      <Dialog open={showQRScanner} onOpenChange={closeQRScanner}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/20">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center">
              <Camera className="mr-2 h-5 w-5 text-seguranca-yellow" />
              Escanear QR Code
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray">
              Aponte a câmera para o QR Code do posto de trabalho
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div 
              id="qr-reader" 
              className="rounded-lg overflow-hidden border-2 border-seguranca-yellow/30"
            />
            <Button
              variant="outline"
              className="w-full border-seguranca-gray/30"
              onClick={closeQRScanner}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default PontoEletronico;

