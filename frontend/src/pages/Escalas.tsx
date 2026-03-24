import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StandardLayout } from '@/components/StandardLayout';
import EscalaFormModal from '../components/EscalaFormModal';
import { ScheduleViewSheet } from '../components/operacional/ScheduleViewSheet';
import { Calendar as CalendarIcon, Filter, Users, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/components/ui/use-toast';
import { scheduleService, Schedule } from '@/services/scheduleService';
import EscalaTrabalhoTable from '@/components/operacional/EscalaTrabalhoTable';
import { dashboardService, ScheduleSummary } from '@/services/dashboardService';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Interface para os dados do formulário de escala
interface EscalaFormData {
  employeeId: string;
  locationId: string;
  workPostId: string;
  travelTripId?: string;
  legs?: number;
  scheduleDate: Date;
  shift: string;
  startTime: string;
  endTime: string;
  observations: string;
  status?: string;
  routeId?: string;
  vehicleId?: string;
}

const Escalas = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'semanal' | 'mensal'>('semanal');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'view';
    escala: Schedule | null;
  }>({
    open: false,
    mode: 'create',
    escala: null,
  });
  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [escalaToDelete, setEscalaToDelete] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOpeningModalRef = useRef(false);

  // Monitorar mudanças no estado do diálogo de exclusão
  useEffect(() => {
    console.log('🗑️ Estado do diálogo de exclusão mudou:', {
      deleteDialogOpen,
      escalaToDelete: escalaToDelete ? escalaToDelete.id : null,
      isDeleting
    });
  }, [deleteDialogOpen, escalaToDelete, isDeleting]);

  // Monitorar mudanças no estado do modal
  useEffect(() => {
    console.log('📊 Estado do modal mudou:', {
      isModalOpen: modalState.open,
      modalMode: modalState.mode,
      selectedEscala: modalState.escala ? modalState.escala.id : null,
      selectedEscalaCompleto: modalState.escala
    });
    console.log('📊 modalState.open:', modalState.open);
    console.log('📊 modalState.mode:', modalState.mode);
  }, [modalState]);

  // Gere dias da semana começando da segunda-feira
  const startDate = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Carregar escalas do backend
  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando escalas...');

      // Por enquanto, buscar todas as escalas sem filtros de data
      // O backend pode não suportar filtros ainda
      const data = await scheduleService.getSchedules();

      console.log('✅ Escalas recebidas do backend:', data);
      console.log('📊 Quantidade de escalas:', data?.length || 0);
      console.log('📊 Tipo de dados:', Array.isArray(data) ? 'Array' : typeof data);

      if (data && data.length > 0) {
        console.log('📊 Primeira escala (exemplo):', JSON.stringify(data[0], null, 2));
        console.log('📊 ScheduleDate da primeira escala:', data[0].scheduleDate);
        console.log('📊 Tipo do scheduleDate:', typeof data[0].scheduleDate);
      }

      setSchedules(data || []);
    } catch (err: any) {
      console.error('❌ Erro ao carregar escalas:', err);
      console.error('❌ Status:', err.response?.status);
      console.error('❌ Mensagem:', err.response?.data);

      setError('Erro ao carregar escalas. Tente novamente.');
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Não foi possível carregar as escalas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar resumo das escalas
  const loadScheduleSummary = async () => {
    try {
      setLoadingSummary(true);
      const summary = await dashboardService.getScheduleSummary();
      setScheduleSummary(summary);
    } catch (err) {
      console.error('Erro ao carregar resumo das escalas:', err);
      // Não mostrar erro para o usuário, apenas log
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadSchedules();
    loadScheduleSummary();
    // eslint-disable-next-line
  }, [date]);

  // Agrupar escalas por funcionário para exibição semanal
  const escalasFuncionarios = React.useMemo(() => {
    console.log('📊 escalasFuncionarios - schedules recebidos:', schedules);
    console.log('📊 escalasFuncionarios - weekDays:', weekDays.map(d => format(d, 'yyyy-MM-dd')));

    const map: { [employeeId: string]: { nome: string; cargo: string; escalas: any[] } } = {};
    schedules.forEach((s) => {
      console.log('📊 Processando escala:', {
        id: s.id,
        scheduleDate: s.scheduleDate,
        employeeId: s.employee?.id,
        employeeName: s.employee?.name,
        shift: s.shift
      });

      // Acessar employee como objeto (conforme interface Schedule)
      const employeeId = s.employee?.id || (s as any).employeeId || '';
      const employeeName = s.employee?.name || (s as any).employeeName || 'Sem funcionário';
      const locationName = s.location?.name || (s as any).locationName || (s as any).clientName || 'Sem local';

      if (!map[employeeId]) {
        map[employeeId] = {
          nome: employeeName,
          cargo: '', // Pode ser preenchido se vier do backend
          escalas: Array(7).fill({ turno: '', cliente: '', horario: '' }),
        };
      }

      // Normalizar a data do schedule para comparação
      let scheduleDateStr: string = '';
      if (s.scheduleDate) {
        const dateValue: any = s.scheduleDate;
        if (typeof dateValue === 'string') {
          scheduleDateStr = dateValue;
          // Se a data vier como string completa (com hora), extrair apenas a parte da data
          if (scheduleDateStr.includes('T')) {
            scheduleDateStr = scheduleDateStr.split('T')[0];
          }
        } else if (dateValue && typeof dateValue.getTime === 'function') {
          // É um objeto Date
          scheduleDateStr = format(dateValue, 'yyyy-MM-dd');
        } else {
          scheduleDateStr = String(dateValue);
        }
      }

      const dia = weekDays.findIndex((d) => {
        const dayStr = format(d, 'yyyy-MM-dd');
        const match = dayStr === scheduleDateStr;
        if (match) {
          console.log('✅ Data encontrada! Dia:', dayStr, 'ScheduleDate:', scheduleDateStr);
        }
        return match;
      });

      if (dia >= 0) {
        map[employeeId].escalas[dia] = {
          turno: getTurnoLabel(s.shift), // Converter turno para português
          cliente: locationName,
          horario: `${(s as any).startTime || ''} - ${(s as any).endTime || ''}`,
        };
        console.log('✅ Escala adicionada ao dia', dia, 'para funcionário', employeeName);
      } else {
        console.log('⚠️ Data não encontrada na semana. ScheduleDate:', scheduleDateStr, 'Dias da semana:', weekDays.map(d => format(d, 'yyyy-MM-dd')));
      }
    });

    const result = Object.entries(map).map(([id, v]) => ({ id, ...v }));
    console.log('📊 escalasFuncionarios - resultado final:', result);
    return result;
  }, [schedules, weekDays]);

  // Alertas de escalas
  const alertasEscalas = [
    {
      id: 1,
      tipo: 'warning',
      mensagem: 'Carlos Oliveira não possui folga semanal conforme lei',
      funcionario: 'Carlos Oliveira'
    },
    {
      id: 2,
      tipo: 'alert',
      mensagem: 'Antônio Ferreira sem cobertura no dia 25/05',
      funcionario: 'Antônio Ferreira'
    },
    {
      id: 3,
      tipo: 'warning',
      mensagem: 'Juliana Costa completará 7 dias consecutivos de trabalho',
      funcionario: 'Juliana Costa'
    }
  ];

  // Função para converter turno do backend para português
  const getTurnoLabel = (turno: string): string => {
    switch (turno) {
      case 'DAY':
        return 'Diurno';
      case 'NIGHT':
        return 'Noturno';
      case 'MIXED':
        return 'Misto';
      default:
        return turno;
    }
  };

  const getTurnoCellClass = (turno: string) => {
    // Aceitar tanto valores em português quanto do backend
    const turnoLower = turno.toLowerCase();
    if (turnoLower === 'day' || turnoLower === 'diurno') {
      return 'bg-seguranca-yellow/30 text-seguranca-black';
    }
    if (turnoLower === 'night' || turnoLower === 'noturno') {
      return 'bg-seguranca-red/30 text-seguranca-black';
    }
    if (turnoLower === 'mixed' || turnoLower === 'misto') {
      return 'bg-blue-500/30 text-seguranca-black';
    }
    if (turnoLower === 'folga') {
      return 'bg-gray-500/30 text-seguranca-black';
    }
    return '';
  };

  // Função para lidar com a criação/edição de escala
  const handleSaveEscala = async (data: EscalaFormData) => {
    try {
      console.log('💾 Salvando escala com dados:', data);
      console.log('💾 data.travelTripId =', JSON.stringify(data.travelTripId));
      console.log('💾 data.workPostId =', JSON.stringify(data.workPostId));
      console.log('💾 data.locationId =', JSON.stringify(data.locationId));
      console.log('💾 data.legs =', data.legs);

      // Validação: verificar se todos os campos obrigatórios estão preenchidos
      const hasLocation = data.locationId && data.locationId.trim() !== '' && data.locationId !== 'none';
      const hasWorkPost = data.workPostId && data.workPostId.trim() !== '' && data.workPostId !== 'none';
      const hasTravelTrip = data.travelTripId && data.travelTripId.trim() !== '' && data.travelTripId !== 'none';
      console.log('💾 hasLocation =', hasLocation, 'hasWorkPost =', hasWorkPost, 'hasTravelTrip =', hasTravelTrip);
      if (!data.employeeId || (!hasLocation && !hasWorkPost && !hasTravelTrip) || !data.shift || !data.scheduleDate) {
        toast({
          title: 'Erro de validação',
          description: 'Por favor, preencha todos os campos obrigatórios (funcionário, posto/viagem, turno e data).',
          variant: 'destructive',
        });
        return;
      }

      // Ajustar o mapeamento para o DTO correto do backend
      // IMPORTANTE: O backend agora aceita workPostId e resolve a Location automaticamente
      // O frontend envia locationId = workPostId, então precisamos garantir que workPostId seja enviado
      const mappedData: any = {
        employeeId: data.employeeId,
        scheduleDate: format(data.scheduleDate, 'yyyy-MM-dd'),
        shift: data.shift, // O backend espera 'DAY', 'NIGHT', 'MIXED', etc.
        status: 'PENDING', // Status padrão
      };

      // Adicionar workPostId se disponível
      if (data.workPostId && data.workPostId.trim() !== '' && data.workPostId !== 'none') {
        mappedData.workPostId = data.workPostId;
      }

      // Adicionar travelTripId se disponível (pode coexistir com workPostId)
      if (data.travelTripId && data.travelTripId.trim() !== '' && data.travelTripId !== 'none') {
        mappedData.travelTripId = data.travelTripId;
        if (data.legs) {
          mappedData.legs = data.legs;
        }
      }

      // Se não tem workPostId nem travelTripId, tentar usar locationId como workPostId
      if (!mappedData.workPostId && !mappedData.travelTripId) {
        if (data.locationId && data.locationId.trim() !== '' && data.locationId !== 'none') {
          mappedData.workPostId = data.locationId;
          mappedData.locationId = data.locationId;
        }
      }

      // Adicionar observations apenas se não for vazio
      if (data.observations && data.observations.trim() !== '') {
        mappedData.observations = data.observations;
      }

      // Remover campos undefined para evitar problemas de serialização
      Object.keys(mappedData).forEach(key => {
        if (mappedData[key] === undefined) {
          delete mappedData[key];
        }
      });

      console.log('📤 Dados mapeados para envio:', JSON.stringify(mappedData, null, 2));
      console.log('📤 travelTripId no formData original:', data.travelTripId);
      console.log('📤 travelTripId no mappedData:', mappedData.travelTripId);
      console.log('📤 workPostId no formData original:', data.workPostId);
      console.log('📤 legs no formData original:', data.legs);
      if (modalState.mode === 'edit' && modalState.escala) {
        await scheduleService.update(modalState.escala.id, mappedData);
        toast({
          title: 'Escala editada com sucesso!',
          description: `Escala para ${data.shift} no dia ${format(data.scheduleDate, 'dd/MM/yyyy')}`,
        });
      } else {
        await scheduleService.create(mappedData);
        toast({
          title: 'Escala salva com sucesso!',
          description: `Escala para ${data.shift} no dia ${format(data.scheduleDate, 'dd/MM/yyyy')}`,
        });
      }
      setModalState({
        open: false,
        mode: 'create',
        escala: null,
      });
      // Recarregar escalas após salvar
      console.log('🔄 Recarregando escalas após salvar...');
      await loadSchedules();
      console.log('✅ Escalas recarregadas após salvar');
    } catch (err: any) {
      console.error('❌ Erro detalhado ao salvar escala:', err);
      console.error('❌ Response data:', err.response?.data);
      console.error('❌ Response status:', err.response?.status);

      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Não foi possível salvar a escala.';

      toast({
        title: 'Erro ao salvar escala',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Função para abrir diálogo de confirmação de exclusão
  const handleDeleteClick = useCallback((escala: Schedule) => {
    console.log('🗑️ handleDeleteClick INICIADO - escala recebida:', escala);
    console.log('🗑️ handleDeleteClick - ID da escala:', escala.id);
    console.log('🗑️ handleDeleteClick - Nome do funcionário:', escala.employee?.name);
    try {
      setEscalaToDelete(escala);
      console.log('🗑️ handleDeleteClick - escalaToDelete definido');
      setDeleteDialogOpen(true);
      console.log('🗑️ handleDeleteClick - deleteDialogOpen definido como true');
    } catch (error) {
      console.error('❌ handleDeleteClick - ERRO:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao abrir diálogo de exclusão.',
        variant: 'destructive',
      });
    }
  }, []);

  // Função para confirmar e deletar escala
  const handleDeleteConfirm = async () => {
    if (!escalaToDelete) return;

    setIsDeleting(true);
    try {
      await scheduleService.deleteSchedule(escalaToDelete.id);
      toast({
        title: 'Excluída com sucesso!',
        description: `A escala de ${escalaToDelete.employee?.name || 'funcionário'} foi removida.`
      });
      setDeleteDialogOpen(false);
      setEscalaToDelete(null);
      loadSchedules();
    } catch (err) {
      console.error('Erro ao excluir escala:', err);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a escala. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para editar escala (abre modal logo após definir estado)
  const handleEditEscala = useCallback((escala: Schedule) => {
    console.log('✏️ handleEditEscala - INÍCIO');
    console.log('✏️ Escala recebida:', escala);

    // Marcar que estamos abrindo o modal programaticamente
    isOpeningModalRef.current = true;

    const newState = {
      open: true,
      mode: 'edit' as const,
      escala,
    };

    console.log('✏️ Novo estado que será definido:', newState);
    setModalState(newState);
    console.log('✏️ setModalState chamado com sucesso');

    // Resetar a flag após um pequeno delay
    setTimeout(() => {
      isOpeningModalRef.current = false;
    }, 100);
  }, []);

  // Função para visualizar escala (abre sheet logo após definir estado)
  const handleViewEscala = useCallback((escala: Schedule) => {
    console.log('👁️ handleViewEscala - INÍCIO');
    console.log('👁️ Escala recebida:', escala);

    // Usar o mesmo estado do modal, mas com modo 'view'
    // O renderizador condicional vai decidir se mostra Modal ou Sheet
    const newState = {
      open: true,
      mode: 'view' as const,
      escala,
    };

    console.log('👁️ Novo estado que será definido:', newState);
    setModalState(newState);
    console.log('👁️ setModalState chamado com sucesso (Sheet será aberto)');
  }, []);

  // Handlers para a tabela
  const handleEditClick = useCallback((escala: Schedule) => {
    console.log('✏️ handleEditClick chamado com escala:', escala);
    handleEditEscala(escala);
  }, [handleEditEscala]);

  const handleViewClick = useCallback((escala: Schedule) => {
    console.log('👁️ handleViewClick chamado com escala:', escala);
    handleViewEscala(escala);
  }, [handleViewEscala]);

  // Loading state
  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-seguranca-red mb-4" />
          <p className="text-seguranca-lightgray">Carregando escalas...</p>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-4" />
          <p className="text-seguranca-lightgray mb-4">{error}</p>
          <Button onClick={loadSchedules} className="bg-seguranca-red hover:bg-seguranca-darkred">Tentar Novamente</Button>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Escalas de Trabalho</h1>
            <p className="text-gray-400 mt-1">Gerenciamento de escalas e turnos</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button
              className="bg-seguranca-red hover:bg-seguranca-darkred"
              onClick={() => {
                setModalState({
                  open: true,
                  mode: 'create',
                  escala: null,
                });
              }}
            >
              + Nova Escala
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'PPP', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-seguranca-graphite border-gray-600">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <div className="flex items-center bg-seguranca-graphite border border-gray-600 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'semanal' ? 'default' : 'outline'}
                className={`rounded-none border-0 ${viewMode === 'semanal' ? 'bg-seguranca-red' : 'bg-transparent text-seguranca-lightgray'}`}
                onClick={() => setViewMode('semanal')}
              >
                Semanal
              </Button>
              <Button
                variant={viewMode === 'mensal' ? 'default' : 'outline'}
                className={`rounded-none border-0 ${viewMode === 'mensal' ? 'bg-seguranca-red' : 'bg-transparent text-seguranca-lightgray'}`}
                onClick={() => setViewMode('mensal')}
              >
                Mensal
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between text-seguranca-lightgray">
                  <span>Escalas da Semana</span>
                  <Button variant="outline" size="sm" className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                    <Users className="mr-2 h-4 w-4" />
                    Visualizar Todos
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-seguranca-lightgray">Funcionário</TableHead>
                        {weekDays.map((day, index) => (
                          <TableHead key={index} className="text-seguranca-lightgray text-center">
                            <div>{format(day, 'EEE', { locale: ptBR })}</div>
                            <div className="text-xs">{format(day, 'dd/MM')}</div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {escalasFuncionarios.map((funcionario) => (
                        <TableRow key={funcionario.id} className="border-gray-600">
                          <TableCell className="font-medium text-seguranca-lightgray">
                            <div>{funcionario.nome}</div>
                            <div className="text-xs text-gray-400">{funcionario.cargo}</div>
                          </TableCell>
                          {funcionario.escalas.map((escala, index) => (
                            <TableCell
                              key={index}
                              className={`text-center ${getTurnoCellClass(escala.turno)}`}
                            >
                              <div className="font-medium">{escala.turno}</div>
                              {escala.turno !== 'Folga' && (
                                <>
                                  <div className="text-xs">{escala.horario}</div>
                                  <div className="text-xs truncate max-w-32">{escala.cliente}</div>
                                </>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-seguranca-lightgray">
                  <AlertTriangle className="h-5 w-5 text-seguranca-yellow mr-2" />
                  Alertas de Escalas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertasEscalas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="p-3 bg-seguranca-black rounded-lg border-l-4 border-seguranca-yellow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <AlertTriangle size={16} className="text-seguranca-yellow" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-seguranca-lightgray">{alerta.funcionario}</h4>
                          <p className="text-sm text-gray-400 my-1">{alerta.mensagem}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button variant="link" className="text-seguranca-yellow hover:underline text-sm w-full">
                    Ver todos os alertas
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600 mt-6">
              <CardHeader>
                <CardTitle className="text-lg text-seguranca-lightgray">Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingSummary ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Funcionários escalados:</span>
                        <span className="font-medium text-seguranca-lightgray">
                          {scheduleSummary?.totalEmployees || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Turnos diurnos:</span>
                        <span className="font-medium text-seguranca-lightgray">
                          {scheduleSummary?.dayShifts || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Turnos noturnos:</span>
                        <span className="font-medium text-seguranca-lightgray">
                          {scheduleSummary?.nightShifts || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Postos de trabalho:</span>
                        <span className="font-medium text-seguranca-lightgray">
                          {scheduleSummary?.totalLocations || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Faltas previstas:</span>
                        <span className="font-medium text-seguranca-red">
                          {scheduleSummary?.expectedAbsences || 0}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg text-seguranca-lightgray">Trocas de Turno Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-seguranca-lightgray">Solicitante</TableHead>
                    <TableHead className="text-seguranca-lightgray">Data</TableHead>
                    <TableHead className="text-seguranca-lightgray">Turno</TableHead>
                    <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-gray-600">
                    <TableCell className="text-seguranca-lightgray">Ana Silva</TableCell>
                    <TableCell className="text-seguranca-lightgray">24/05/2025</TableCell>
                    <TableCell className="text-seguranca-lightgray">Noturno</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-gray-600">
                    <TableCell className="text-seguranca-lightgray">Marcos Santos</TableCell>
                    <TableCell className="text-seguranca-lightgray">27/05/2025</TableCell>
                    <TableCell className="text-seguranca-lightgray">Diurno</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg text-seguranca-lightgray">Solicitações de Folga</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-seguranca-lightgray">Funcionário</TableHead>
                    <TableHead className="text-seguranca-lightgray">Data</TableHead>
                    <TableHead className="text-seguranca-lightgray">Motivo</TableHead>
                    <TableHead className="text-seguranca-lightgray text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-gray-600">
                    <TableCell className="text-seguranca-lightgray">Carlos Oliveira</TableCell>
                    <TableCell className="text-seguranca-lightgray">30/05/2025</TableCell>
                    <TableCell className="text-seguranca-lightgray">Médico</TableCell>
                    <TableCell className="text-right">
                      <span className="text-yellow-500">Pendente</span>
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-gray-600">
                    <TableCell className="text-seguranca-lightgray">Juliana Costa</TableCell>
                    <TableCell className="text-seguranca-lightgray">03/06/2025</TableCell>
                    <TableCell className="text-seguranca-lightgray">Pessoal</TableCell>
                    <TableCell className="text-right">
                      <span className="text-yellow-500">Pendente</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Escalas */}
        <EscalaTrabalhoTable
          escalas={schedules}
          isLoading={loading}
          onRefresh={loadSchedules}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onView={handleViewClick}
          onCreate={() => {
            setModalState({
              open: true,
              mode: 'create',
              escala: null,
            });
          }}
        />

        <EscalaFormModal
          open={modalState.open && modalState.mode !== 'view'}
          onOpenChange={(open) => {
            console.log('🎭 EscalaFormModal onOpenChange chamado com open:', open);
            console.log('🎭 modalState.open atual:', modalState.open);
            console.log('🎭 modalState.mode:', modalState.mode);
            console.log('🎭 isOpeningModalRef.current:', isOpeningModalRef.current);

            // Se estamos abrindo o modal programaticamente, ignorar onOpenChange(true)
            if (open && isOpeningModalRef.current) {
              console.log('🎭 Ignorando onOpenChange(true) - modal está sendo aberto programaticamente');
              return;
            }

            // Só atualizar se realmente for para fechar
            if (!open) {
              console.log('🎭 Fechando modal...');
              setModalState((prev) => ({
                ...prev,
                open: false,
                mode: 'create' as const,
                escala: null,
              }));
              setEscalaToDelete(null);
            }
            // Se open === true e não estamos abrindo programaticamente, pode ser uma tentativa de abrir manualmente
            // Nesse caso, não fazer nada pois o estado já foi definido pelos handlers
          }}
          onSave={handleSaveEscala}
          initialData={useMemo(() => {
            console.log('🔍 useMemo initialData - modalState.escala:', modalState.escala);
            console.log('🔍 useMemo initialData - modalState.mode:', modalState.mode);
            console.log('🔍 useMemo initialData - modalState.open:', modalState.open);

            if (modalState.escala) {
              console.log('🔍 Mapeando selectedEscala para initialData:', modalState.escala);
              console.log('🔍 selectedEscala completo:', JSON.stringify(modalState.escala, null, 2));

              // Extrair employeeId - pode vir como objeto ou string
              const employeeId = modalState.escala.employee?.id ||
                (modalState.escala as any).employeeId ||
                '';

              // Extrair workPostId - pode vir como objeto ou string
              const workPostId = modalState.escala.workPost?.id ||
                (modalState.escala as any).workPostId ||
                '';

              // Extrair locationId - pode vir como objeto ou string
              const locationId = modalState.escala.location?.id ||
                (modalState.escala as any).locationId ||
                workPostId || // Se não há locationId, usar workPostId
                '';

              // Extrair horários do workPost se disponível
              const workPost = modalState.escala.workPost as any;
              let startTime = '';
              let endTime = '';

              console.log('🔍 WorkPost completo para extrair horários:', workPost);

              // Tentar extrair horários do workPost
              if (workPost?.shiftStart) {
                // Se shiftStart é uma string no formato HH:mm ou HH:mm:ss
                if (typeof workPost.shiftStart === 'string') {
                  // Pode vir como "HH:mm" ou "HH:mm:ss" ou "HH:mm:ss.SSS"
                  startTime = workPost.shiftStart.substring(0, 5); // Pega apenas HH:mm
                } else if (workPost.shiftStart instanceof Date) {
                  // Se for Date, formatar para HH:mm
                  const hours = String(workPost.shiftStart.getHours()).padStart(2, '0');
                  const minutes = String(workPost.shiftStart.getMinutes()).padStart(2, '0');
                  startTime = `${hours}:${minutes}`;
                } else {
                  startTime = String(workPost.shiftStart);
                }
                console.log('✅ startTime extraído do workPost:', startTime);
              }

              if (workPost?.shiftEnd) {
                // Se shiftEnd é uma string no formato HH:mm ou HH:mm:ss
                if (typeof workPost.shiftEnd === 'string') {
                  // Pode vir como "HH:mm" ou "HH:mm:ss" ou "HH:mm:ss.SSS"
                  endTime = workPost.shiftEnd.substring(0, 5); // Pega apenas HH:mm
                } else if (workPost.shiftEnd instanceof Date) {
                  // Se for Date, formatar para HH:mm
                  const hours = String(workPost.shiftEnd.getHours()).padStart(2, '0');
                  const minutes = String(workPost.shiftEnd.getMinutes()).padStart(2, '0');
                  endTime = `${hours}:${minutes}`;
                } else {
                  endTime = String(workPost.shiftEnd);
                }
                console.log('✅ endTime extraído do workPost:', endTime);
              }

              // Se não encontrou horários no workPost, usar valores padrão baseados no turno
              if (!startTime || !endTime) {
                console.log('⚠️ Horários não encontrados no workPost, usando valores padrão baseados no turno:', modalState.escala.shift);
                if (modalState.escala.shift === 'DAY') {
                  startTime = startTime || '08:00';
                  endTime = endTime || '17:00';
                } else if (modalState.escala.shift === 'NIGHT') {
                  startTime = startTime || '22:00';
                  endTime = endTime || '06:00';
                } else if (modalState.escala.shift === 'MIXED') {
                  startTime = startTime || '14:00';
                  endTime = endTime || '22:00';
                }
              }

              // Extrair clientId do workPost (pode vir como clientId direto ou como objeto client)
              const clientId = workPost?.clientId ||
                workPost?.client?.id ||
                (modalState.escala.location as any)?.unit?.clientId ||
                (modalState.escala.location as any)?.unit?.client?.id ||
                '';

              // Processar scheduleDate - sempre vem como string da API
              let scheduleDate: Date;
              if (modalState.escala.scheduleDate) {
                // scheduleDate sempre vem como string do backend (formato YYYY-MM-DD)
                scheduleDate = new Date(modalState.escala.scheduleDate);
                // Validar se a data é válida
                if (isNaN(scheduleDate.getTime())) {
                  scheduleDate = new Date();
                }
              } else {
                scheduleDate = new Date();
              }

              const mappedData = {
                employeeId: String(employeeId || ''),
                locationId: String(locationId || ''),
                workPostId: String(workPostId || ''),
                scheduleDate: scheduleDate,
                shift: String(modalState.escala.shift || ''),
                startTime: String(startTime || ''),
                endTime: String(endTime || ''),
                observations: String(modalState.escala.observations || ''),
                clientId: String(clientId || ''), // Adicionar clientId para facilitar o mapeamento no modal
              };

              console.log('📋 initialData mapeado (useMemo):', mappedData);
              console.log('📋 Campos extraídos:');
              console.log('  - employeeId:', mappedData.employeeId);
              console.log('  - workPostId:', mappedData.workPostId);
              console.log('  - locationId:', mappedData.locationId);
              console.log('  - clientId:', mappedData.clientId);
              console.log('  - scheduleDate:', mappedData.scheduleDate);
              console.log('  - shift:', mappedData.shift);
              console.log('  - startTime:', mappedData.startTime);
              console.log('  - endTime:', mappedData.endTime);
              console.log('  - observations:', mappedData.observations);

              return mappedData;
            }
            return {
              employeeId: '',
              locationId: '',
              workPostId: '',
              scheduleDate: new Date(),
              shift: '',
              startTime: '',
              endTime: '',
              observations: '',
            };
          }, [modalState.escala])}
          mode={modalState.mode}
        />

        {/* Sheet de Visualização de Escala (Read-Only) */}
        <ScheduleViewSheet
          open={modalState.open && modalState.mode === 'view'}
          onOpenChange={(open) => {
            console.log('🔄 [Escalas] Sheet onOpenChange:', open);
            if (!open) {
              setModalState(prev => ({ ...prev, open: false }));
            }
          }}
          schedule={modalState.escala}
        />

        {/* Diálogo de Confirmação de Exclusão */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            console.log('🗑️ AlertDialog onOpenChange chamado com open:', open);
            console.log('🗑️ deleteDialogOpen atual:', deleteDialogOpen);
            console.log('🗑️ escalaToDelete:', escalaToDelete);
            if (!open) {
              console.log('🗑️ Fechando diálogo de exclusão');
              setDeleteDialogOpen(false);
              setEscalaToDelete(null);
            } else {
              console.log('🗑️ Tentando abrir diálogo de exclusão');
              setDeleteDialogOpen(true);
            }
          }}
        >
          <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-seguranca-lightgray">
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Tem certeza que deseja excluir a escala de{' '}
                <span className="font-semibold text-white">
                  {escalaToDelete?.employee?.name || 'funcionário'}
                </span>
                {' '}para o dia{' '}
                <span className="font-semibold text-white">
                  {escalaToDelete?.scheduleDate ? format(new Date(escalaToDelete.scheduleDate), 'dd/MM/yyyy', { locale: ptBR }) : 'data'}
                </span>?
                <br />
                <span className="text-xs text-gray-500 mt-2 block">
                  Esta ação não pode ser desfeita.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="bg-seguranca-graphite text-seguranca-lightgray border-gray-600 hover:bg-gray-700"
                disabled={isDeleting}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </StandardLayout>
  );
};

export default Escalas;
