import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { visitService } from '@/services/visitService';
import { Visit, VisitFilters, VisitCalendarEvent } from '@/types/visit';
import { VisitCalendar } from './VisitCalendar';
import VisitList from './VisitList';
import { VisitFormModal } from './VisitFormModal';
import VisitControlReports from '@/components/operacional/VisitControlReports';
import { VisitViewModal } from './VisitViewModal';
import DayVisitsModal from './DayVisitsModal';

interface VisitDashboardProps {
  supervisorId?: string;
}

const VisitDashboard: React.FC<VisitDashboardProps> = ({ supervisorId }) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<VisitCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDayVisitsModal, setShowDayVisitsModal] = useState(false);
  const [selectedDayVisits, setSelectedDayVisits] = useState<Visit[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<VisitFilters>({});
  const [activeTab, setActiveTab] = useState('calendar');

  const { toast } = useToast();

  useEffect(() => {
    loadVisits();
  }, [filters, supervisorId]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      let visitsData: Visit[] = [];
      
      if (supervisorId) {
        visitsData = await visitService.getVisitsBySupervisor(supervisorId);
      } else if (filters.startDate && filters.endDate) {
        const response = await visitService.getVisitsByDateRange(filters.startDate, filters.endDate);
        visitsData = response.content;
      } else {
        const response = await visitService.getVisits(filters);
        visitsData = response.content;
      }

      setVisits(visitsData);
      setCalendarEvents(visitService.convertToCalendarEvents(visitsData));
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar visitas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisit = () => {
    setSelectedVisit(null);
    setShowFormModal(true);
  };

  const handleEditVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowFormModal(true);
  };

  const handleViewVisit = async (visitOrEvent: Visit | VisitCalendarEvent) => {
    try {
      let visitToShow: Visit;
      
      // Se for um VisitCalendarEvent, buscar a visita completa
      if ('title' in visitOrEvent && 'date' in visitOrEvent && !('visitDate' in visitOrEvent)) {
        // É um VisitCalendarEvent, buscar a visita completa
        console.log('🔍 Buscando visita completa pelo ID:', visitOrEvent.id);
        const fullVisit = await visitService.getVisitById(visitOrEvent.id);
        console.log('✅ Visita completa carregada:', fullVisit);
        visitToShow = fullVisit;
      } else {
        // Já é um Visit completo
        console.log('✅ Usando visita já completa:', visitOrEvent);
        visitToShow = visitOrEvent as Visit;
      }
      
      console.log('📋 Dados da visita para exibição:', {
        id: visitToShow.id,
        supervisorId: visitToShow.supervisorId,
        supervisorName: visitToShow.supervisorName,
        workPostId: visitToShow.workPostId,
        workPostName: visitToShow.workPostName,
        clientId: visitToShow.clientId,
        clientName: visitToShow.clientName,
        visitDate: visitToShow.visitDate,
        visitTime: visitToShow.visitTime,
        status: visitToShow.status,
      });
      
      setSelectedVisit(visitToShow);
      setShowViewModal(true);
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes da visita:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar detalhes da visita',
        variant: 'destructive',
      });
    }
  };

  const handleSaveVisit = async (visitData: any) => {
    try {
      if (selectedVisit) {
        await visitService.updateVisit(selectedVisit.id, visitData);
        toast({
          title: 'Sucesso',
          description: 'Visita atualizada com sucesso',
        });
      } else {
        await visitService.createVisit(visitData);
        toast({
          title: 'Sucesso',
          description: 'Visita criada com sucesso',
        });
      }
      
      setShowFormModal(false);
      setSelectedVisit(null);
      loadVisits();
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar visita',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    try {
      await visitService.deleteVisit(visitId);
      toast({
        title: 'Sucesso',
        description: 'Visita excluída com sucesso',
      });
      loadVisits();
    } catch (error) {
      console.error('Erro ao excluir visita:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir visita',
        variant: 'destructive',
      });
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    const startDate = new Date(date);
    startDate.setDate(1);
    const endDate = new Date(date);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    setFilters({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  const handleDayClick = async (date: Date, dayEvents: VisitCalendarEvent[]) => {
    try {
      // Normalizar a data para evitar problemas de timezone
      // Criar uma data no início do dia no timezone local
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      
      console.log('📅 Data clicada (raw):', date);
      console.log('📅 Data normalizada:', normalizedDate);
      console.log('📅 Data como string (YYYY-MM-DD):', normalizedDate.toISOString().split('T')[0]);
      console.log('📊 Eventos recebidos do calendário:', dayEvents?.length || 0);
      console.log('📊 IDs dos eventos:', dayEvents?.map(e => e.id) || []);
      
      // IMPORTANTE: Usar os eventos que já foram corretamente filtrados pelo calendário
      // Isso evita problemas de timezone e garante que só mostramos visitas do dia correto
      let dayVisits: Visit[] = [];
      
      if (dayEvents && dayEvents.length > 0) {
        // Buscar visitas pelos IDs dos eventos que foram corretamente associados ao dia
        const eventIds = dayEvents.map(event => event.id).filter(id => id);
        console.log('🔍 Buscando visitas pelos IDs dos eventos do calendário:', eventIds);
        
        dayVisits = visits.filter(visit => eventIds.includes(visit.id));
        console.log('✅ Visitas encontradas pelos IDs:', dayVisits.length);
        console.log('✅ Detalhes das visitas:', dayVisits.map(v => ({ 
          id: v.id, 
          date: v.visitDate, 
          workPost: v.workPostName 
        })));
      } else {
        // Se não há eventos passados, significa que não há visitas neste dia
        // Fazer uma verificação final para garantir (mas os eventos já são a fonte da verdade)
        console.log('⚠️ Nenhum evento recebido do calendário - dia vazio confirmado');
        dayVisits = [];
        
        // Verificação adicional apenas para debug (não usar para exibir)
        const year = normalizedDate.getFullYear();
        const month = normalizedDate.getMonth();
        const day = normalizedDate.getDate();
        
        const debugVisits = visits.filter(visit => {
          if (!visit.visitDate) return false;
          
          // Usar apenas a parte da data (YYYY-MM-DD) para comparação
          const visitDateStr = visit.visitDate.split('T')[0];
          const visitDateParts = visitDateStr.split('-');
          if (visitDateParts.length !== 3) return false;
          
          const visitYear = parseInt(visitDateParts[0], 10);
          const visitMonth = parseInt(visitDateParts[1], 10) - 1; // Mês é 0-indexed
          const visitDay = parseInt(visitDateParts[2], 10);
          
          return visitYear === year && visitMonth === month && visitDay === day;
        });
        
        console.log('🔍 Verificação adicional (apenas debug):', debugVisits.length, 'visitas encontradas');
        if (debugVisits.length > 0) {
          console.warn('⚠️ ATENÇÃO: Encontradas visitas na verificação adicional que não estavam nos eventos!', 
            debugVisits.map(v => ({ id: v.id, date: v.visitDate })));
        }
      }

      console.log('📋 Total final de visitas para o modal:', dayVisits.length);

      setSelectedDayDate(normalizedDate);
      setSelectedDayVisits(dayVisits); // Passar array vazio se não houver eventos
      setShowDayVisitsModal(true);
    } catch (error) {
      console.error('❌ Erro ao carregar visitas do dia:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar visitas do dia',
        variant: 'destructive',
      });
    }
  };

  const todayVisits = visits.filter(visit => {
    const visitDate = new Date(visit.visitDate);
    const today = new Date();
    return visitDate.toDateString() === today.toDateString();
  });

  const stats = {
    total: visits.length,
    scheduled: visits.filter(v => v.status === 'PENDING').length,
    completed: visits.filter(v => v.status === 'COMPLETED').length,
    today: todayVisits.length,
  };

  return (
    <div className="space-y-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Controle de Visitas</h1>
          <p className="text-sm sm:text-base text-gray-400">Gerencie visitas de supervisão</p>
        </div>
        <Button 
          onClick={handleCreateVisit} 
          className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 w-full sm:w-auto"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Nova Visita
        </Button>
      </div>

      {/* Estatísticas - Responsivo */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Visitas</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-seguranca-yellow" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Agendadas</p>
                <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Concluídas</p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Hoje</p>
                <p className="text-2xl font-bold text-white">{stats.today}</p>
              </div>
              <MapPin className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros - Responsivo */}
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base sm:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <Label className="text-gray-300">Data Início</Label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="bg-seguranca-black border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Data Fim</Label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="bg-seguranca-black border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value as any })}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="COMPLETED">Concluída</SelectItem>
                  <SelectItem value="NOT_COMPLETED">Não Realizada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end sm:col-span-2 md:col-span-1">
              <Button
                onClick={loadVisits}
                className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 w-full sm:w-auto"
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Responsivo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-seguranca-graphite border-gray-700 w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="calendar" className="text-gray-300 data-[state='active']:text-white text-xs sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Calendário</span>
            <span className="sm:hidden">Cal.</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="text-gray-300 data-[state='active']:text-white text-xs sm:text-sm">
            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Lista</span>
            <span className="sm:hidden">List.</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-gray-300 data-[state='active']:text-white text-xs sm:text-sm">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Rel.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4 mt-4 sm:mt-6">
          <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden w-full max-w-full">
            <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-2 sm:px-3 md:px-4 lg:px-6">
              <CardTitle className="text-white text-sm sm:text-base md:text-lg lg:text-xl">Calendário de Visitas</CardTitle>
            </CardHeader>
            <CardContent className="p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6 overflow-hidden w-full max-w-full">
              <div className="w-full max-w-full overflow-hidden">
                <VisitCalendar
                  events={calendarEvents}
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  onEventClick={handleViewVisit}
                  onDayClick={handleDayClick}
                  loading={loading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Lista de Visitas</CardTitle>
            </CardHeader>
            <CardContent>
              <VisitList
                visits={visits}
                loading={loading}
                onEdit={handleEditVisit}
                onView={handleViewVisit}
                onDelete={handleDeleteVisit}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <VisitControlReports />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <VisitFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        visit={selectedVisit}
        onSave={handleSaveVisit}
      />

      <VisitViewModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        visit={selectedVisit}
        onEdit={handleEditVisit}
        onDelete={handleDeleteVisit}
      />

      <DayVisitsModal
        open={showDayVisitsModal}
        onOpenChange={setShowDayVisitsModal}
        visits={selectedDayVisits}
        date={selectedDayDate}
        onVisitClick={handleViewVisit}
      />
    </div>
  );
};

export default VisitDashboard;