import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StandardLayout } from '@/components/StandardLayout';
import EscalaFormModal from '../components/EscalaFormModal';
import { Calendar as CalendarIcon, Filter, Users, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/components/ui/use-toast';
import { scheduleService, Schedule, ScheduleFilters, CreateScheduleRequest } from '@/services/scheduleService';
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

// Interface para os dados do formulário de escala
interface EscalaFormData {
  employeeId: string;
  locationId: string;
  scheduleDate: Date;
  shift: string;
  startTime: string;
  endTime: string;
  observations: string;
  status?: string;
} // Ajustado para refletir os campos esperados pelo backend

const Escalas = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'semanal' | 'mensal'>('semanal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEscala, setSelectedEscala] = useState<Schedule | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  // Gere dias da semana começando da segunda-feira
  const startDate = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Carregar escalas do backend
  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: ScheduleFilters = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(addDays(startDate, 6), 'yyyy-MM-dd'),
      };
      const data = await scheduleService.getSchedules(filters);
      setSchedules(data);
    } catch (err) {
      setError('Erro ao carregar escalas. Tente novamente.');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as escalas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line
  }, [date]);

  // Agrupar escalas por funcionário para exibição semanal
  const escalasFuncionarios = React.useMemo(() => {
    const map: { [employeeId: string]: { nome: string; cargo: string; escalas: any[] } } = {};
    schedules.forEach((s) => {
      if (!map[s.employeeId]) {
        map[s.employeeId] = {
          nome: s.employeeName,
          cargo: '', // Pode ser preenchido se vier do backend
          escalas: Array(7).fill({ turno: '', cliente: '', horario: '' }),
        };
      }
      const dia = weekDays.findIndex((d) => format(d, 'yyyy-MM-dd') === s.date);
      if (dia >= 0) {
        map[s.employeeId].escalas[dia] = {
          turno: s.shift,
          cliente: s.clientName,
          horario: `${s.startTime} - ${s.endTime}`,
        };
      }
    });
    return Object.entries(map).map(([id, v]) => ({ id, ...v }));
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

  const getTurnoCellClass = (turno: string) => {
    switch (turno) {
      case 'Diurno':
        return 'bg-seguranca-yellow/30 text-seguranca-black';
      case 'Noturno':
        return 'bg-seguranca-red/30 text-seguranca-black';
      case 'Administrativo':
        return 'bg-blue-500/30 text-seguranca-black';
      case 'Folga':
        return 'bg-gray-500/30 text-seguranca-black';
      default:
        return '';
    }
  };

  // Função para lidar com a criação/edição de escala
  const handleSaveEscala = async (data: EscalaFormData) => {
  try {
    // Ajustar o mapeamento para o DTO correto do backend
    const mappedData = {
      employeeId: data.employeeId,
      locationId: data.locationId,
      scheduleDate: format(data.scheduleDate, 'yyyy-MM-dd'),
      shift: data.shift as any, // O backend espera 'DAY', 'NIGHT', 'MIXED', etc.
      startTime: data.startTime,
      endTime: data.endTime,
      observations: data.observations,
      status: data.status || 'PENDING',
    };
    if (modalMode === 'edit' && selectedEscala) {
      await scheduleService.update(selectedEscala.id, mappedData);
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
    setIsModalOpen(false);
    setSelectedEscala(null);
    loadSchedules();
  } catch (err) {
    toast({
      title: 'Erro',
      description: 'Não foi possível salvar a escala.',
      variant: 'destructive',
    });
    }
  };

  // Função para deletar escala
  const handleDeleteEscala = async (escala: Schedule) => {
    try {
      await scheduleService.deleteSchedule(escala.id);
      toast({ title: 'Excluída com sucesso!', description: 'A escala foi removida.' });
      loadSchedules();
    } catch (err) {
      toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir a escala.', variant: 'destructive' });
    }
  };

  // Função para editar escala
  const handleEditEscala = (escala: Schedule) => {
    setSelectedEscala(escala);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Função para visualizar escala
  const handleViewEscala = (escala: Schedule) => {
    setSelectedEscala(escala);
    setModalMode('view');
    setIsModalOpen(true);
  };

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
              onClick={() => { setSelectedEscala(null); setModalMode('create'); setIsModalOpen(true); }}
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
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Funcionários escalados:</span>
                    <span className="font-medium text-seguranca-lightgray">42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Turnos diurnos:</span>
                    <span className="font-medium text-seguranca-lightgray">28</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Turnos noturnos:</span>
                    <span className="font-medium text-seguranca-lightgray">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Postos de trabalho:</span>
                    <span className="font-medium text-seguranca-lightgray">18</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Faltas previstas:</span>
                    <span className="font-medium text-seguranca-red">3</span>
                  </div>
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
        
        {/* Modal de Formulário de Escala */}
        <EscalaTrabalhoTable
          escalas={schedules}
          isLoading={loading}
          onRefresh={loadSchedules}
          onEdit={handleEditEscala}
          onDelete={handleDeleteEscala}
          onView={handleViewEscala}
          onCreate={() => { setSelectedEscala(null); setModalMode('create'); setIsModalOpen(true); }}
        />

        <EscalaFormModal
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setSelectedEscala(null);
          }}
          onSave={handleSaveEscala}
          initialData={selectedEscala ? {
            funcionarioId: selectedEscala.employee?.id || '',
            clienteId: selectedEscala.location?.id || '',
            data: selectedEscala.scheduleDate ? new Date(selectedEscala.scheduleDate) : new Date(),
            turno: selectedEscala.shift || '',
            horarioInicio: selectedEscala.startTime || '',
            horarioFim: selectedEscala.endTime || '',
            observacoes: selectedEscala.observations || '',
          } : undefined}
          mode={modalMode}
        />
      </div>
    </StandardLayout>
  );
};

export default Escalas;
