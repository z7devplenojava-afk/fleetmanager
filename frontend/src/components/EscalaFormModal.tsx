
import React, { useState, useEffect } from 'react';
import { format, addDays, isWeekend, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// Calendar removido - usando input type="date" nativo dentro do Dialog
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
// Popover removido - não funciona dentro de Dialog do Radix UI
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarIcon,
  Clock,
  User,
  MapPin,
  Building,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarLucide,
  Users,
  Eye,
  Car,
  Footprints,
  Bus
} from 'lucide-react';
import fleetService from '@/services/fleetService';
import { Vehicle } from '@/types/fleet';
import { parseLocalDate } from '@/utils/date-utils';

interface EscalaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: EscalaFormData) => void;
  initialData?: EscalaFormData;
  mode?: 'create' | 'edit' | 'view';
}

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
  status: string;
  observations: string;
  routeId?: string;
  vehicleId?: string;
}

interface ValidationErrors {
  employeeId?: string;
  locationId?: string;
  workPostId?: string;
  scheduleDate?: string;
  shift?: string;
  startTime?: string;
  endTime?: string;
}

const EscalaFormModal: React.FC<EscalaFormModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  mode = 'create'
}) => {
  // Log para debug
  useEffect(() => {
    console.log('🎭 EscalaFormModal renderizado - open:', open, 'mode:', mode, 'initialData:', initialData);
    console.log('🎭 EscalaFormModal - Título será:', mode === 'view' ? 'Visualizar Escala' : mode === 'edit' ? 'Edição de Escala' : 'Nova Escala');
  }, [open, mode, initialData]);
  // Função para obter dados padrão
  const getDefaultFormData = (): EscalaFormData => ({
    employeeId: '',
    locationId: '',
    workPostId: '',
    travelTripId: '',
    legs: 1,
    scheduleDate: new Date(),
    shift: '',
    startTime: '',
    endTime: '',
    status: 'PENDING',
    observations: ''
  });

  const [formData, setFormData] = useState<EscalaFormData>(getDefaultFormData());
  const [selectedClientId, setSelectedClientId] = useState<string>(''); // Cliente selecionado (para exibição)

  const [usuarios, setUsuarios] = useState<{ id: string; name: string }[]>([]);
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>([]);
  const [postosTrabalho, setPostosTrabalho] = useState<{ id: string; name: string; postCode: string; clientId?: string }[]>([]);
  const [postosFiltrados, setPostosFiltrados] = useState<{ id: string; name: string; postCode: string }[]>([]);
  const [rotas, setRotas] = useState<{ id: string; name: string }[]>([]);
  const [viagens, setViagens] = useState<{ id: string; name: string; tripType: string; legs: number; clientId?: string }[]>([]);
  const [viagensFiltradas, setViagensFiltradas] = useState<{ id: string; name: string; tripType: string; legs: number }[]>([]);
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeBankBalance, setTimeBankBalance] = useState<string | null>(null);
  const { toast } = useToast();

  const updateTimeBankBalance = async (employeeId: string) => {
    try {
      // Import dynamic to avoid circular dependency issues if any
      const { driverJourneyService } = await import('@/services/driverJourneyService');
      const balance = await driverJourneyService.getTimeBankBalance(employeeId);
      setTimeBankBalance(balance);
    } catch (e) {
      console.error('Erro ao buscar saldo:', e);
      setTimeBankBalance(null);
    }
  };

  // Carregar dados do backend quando o modal abrir
  useEffect(() => {
    if (!open) return; // Não carregar se o modal estiver fechado

    const loadData = async () => {
      console.log('🔄 Carregando dados para o modal de escala...');

      try {
        // Carregar funcionários (employees, não users)
        const { employeeService } = await import('@/services/employeeService');
        const employees: any = await employeeService.getAllEmployees();
        // employeeService pode retornar um objeto com 'content' ou um array direto
        const employeesList = Array.isArray(employees)
          ? employees
          : (employees?.content || []);
        const mappedEmployees = employeesList.map((e: any) => ({
          id: e.id,
          name: e.name || e.nome || 'Funcionário sem nome'
        }));
        setUsuarios(mappedEmployees);

        // Pre-carregar saldo se jÃ¡ tiver motorista selecionado
        if (formData.employeeId) {
          console.log('🔄 Buscando saldo inicial para funcionÃ¡rio:', formData.employeeId);
          updateTimeBankBalance(formData.employeeId);
        }

        console.log('✅ Funcionários carregados:', mappedEmployees.length);
      } catch (error) {
        console.error('❌ Erro ao carregar funcionários:', error);
        setUsuarios([]);
      }

      try {
        // Carregar clientes
        const { clientService } = await import('@/services/clientService');
        const clients = await clientService.getAllClients();
        const mappedClients = clients.map(c => ({ id: c.id, name: c.name }));
        setClientes(mappedClients);
        console.log('✅ Clientes carregados:', mappedClients.length, mappedClients);
      } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        console.error('❌ Detalhes do erro:', error);
        setClientes([]);
      }

      // Não precisamos mais carregar locations separadas
      // O Posto de Trabalho será usado como locationId

      try {
        // Carregar postos de trabalho
        const { workPostService } = await import('@/services/workPostService');
        const workPosts = await workPostService.getAllWorkPosts();
        const mappedWorkPosts = workPosts.map(wp => ({
          id: wp.id,
          name: wp.name,
          postCode: wp.postCode || '',
          clientId: wp.clientId
        }));
        setPostosTrabalho(mappedWorkPosts);
        setPostosFiltrados(mappedWorkPosts); // Inicializar com todos os postos
        console.log('✅ Postos de trabalho carregados:', mappedWorkPosts.length);
      } catch (error) {
        console.error('❌ Erro ao carregar postos de trabalho:', error);
        console.error('❌ Detalhes do erro:', error);
        setPostosTrabalho([]);
        setPostosFiltrados([]);
      }

      try {
        // Carregar rotas
        const { routeService } = await import('@/services/routeService');
        const routes = await routeService.findAllRoutes();
        const mappedRoutes = routes.map(r => ({ id: r.id, name: r.name }));
        setRotas(mappedRoutes);
        console.log('✅ Rotas carregadas:', mappedRoutes.length);

        // Carregar veículos
        try {
          const vehicles = await fleetService.getVehicles();
          setVeiculos(vehicles || []);
        } catch (e) {
          console.error("Erro ao carregar veículos:", e);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar rotas:', error);
        setRotas([]);
      }

      try {
        // Carregar viagens (TravelTrips)
        const { travelTripService } = await import('@/services/travelTripService');
        const trips = await travelTripService.findActive();
        const mappedTrips = trips.map(t => ({
          id: t.id,
          name: t.name,
          tripType: t.tripType,
          legs: t.legs,
          clientId: t.client?.id
        }));
        setViagens(mappedTrips);
        setViagensFiltradas(mappedTrips);
        console.log('✅ Viagens carregadas:', mappedTrips.length);
      } catch (error) {
        console.error('❌ Erro ao carregar viagens:', error);
        setViagens([]);
        setViagensFiltradas([]);
      }
    };

    loadData();
  }, [open]); // Executar quando o modal abrir

  // Atualizar lista de postos filtrados quando postosTrabalho ou cliente selecionado mudar
  useEffect(() => {
    if (selectedClientId) {
      // Filtrar postos pelo cliente selecionado
      const filtered = postosTrabalho.filter(posto => posto.clientId === selectedClientId);
      console.log('🔄 Filtrando postos para o cliente:', selectedClientId, 'Total encontrado:', filtered.length);
      setPostosFiltrados(filtered);
      // Filtrar viagens pelo cliente selecionado
      const filteredTrips = viagens.filter(v => v.clientId === selectedClientId || !v.clientId);
      setViagensFiltradas(filteredTrips);
    } else {
      // Se não há cliente selecionado, mostrar todos
      console.log('🔄 Mostrando todos os postos (nenhum cliente selecionado). Total:', postosTrabalho.length);
      setPostosFiltrados(postosTrabalho);
      setViagensFiltradas(viagens);
    }
  }, [postosTrabalho, viagens, selectedClientId]);

  // Labels para turno
  const shiftLabels: Record<string, { label: string; badgeClass: string }> = {
    DAY: { label: 'Diurno', badgeClass: 'bg-blue-600/20 text-blue-300 border border-blue-500/40' },
    NIGHT: { label: 'Noturno', badgeClass: 'bg-purple-600/20 text-purple-300 border border-purple-500/40' },
    MIXED: { label: 'Misto', badgeClass: 'bg-amber-600/20 text-amber-200 border border-amber-500/40' },
  };

  // Função para calcular duração do turno
  const calculateShiftDuration = (): string => {
    if (!formData.startTime || !formData.endTime) return '';

    const start = new Date(`2000-01-01T${formData.startTime}`);
    let end = new Date(`2000-01-01T${formData.endTime}`);

    // Se o horário de fim for menor que o de início, assumir que é no dia seguinte
    if (end <= start) {
      end = new Date(`2000-01-02T${formData.endTime}`);
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h${diffMinutes > 0 ? ` ${diffMinutes}min` : ''}`;
  };

  const employeeName = usuarios.find(u => String(u.id) === String(formData.employeeId))?.name || '—';
  const clientName = clientes.find(c => String(c.id) === String(selectedClientId))?.name || '—';
  const workPost = postosTrabalho.find(p => String(p.id) === String(formData.workPostId));
  const workPostName = workPost?.name || '—';
  const workPostCode = workPost?.postCode;
  const routeName = rotas.find(r => String(r.id) === String(formData.routeId))?.name || '—';
  const scheduleDateFormatted = formData.scheduleDate ? format(formData.scheduleDate, "dd/MM/yyyy", { locale: ptBR }) : '—';
  const shiftInfo = shiftLabels[formData.shift] || { label: formData.shift || '—', badgeClass: 'bg-gray-700 text-gray-200 border border-gray-600' };
  const duration = calculateShiftDuration();

  // Validação de formulário
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Funcionário é obrigatório';
    }

    if (!selectedClientId) {
      newErrors.locationId = 'Cliente é obrigatório';
    }

    // Posto de Trabalho ou Viagem devem ser preenchidos
    if (!formData.workPostId && !formData.travelTripId) {
      newErrors.workPostId = 'Selecione um Posto de Trabalho ou uma Viagem';
    }

    if (!formData.scheduleDate) {
      newErrors.scheduleDate = 'Data é obrigatória';
    } else if (isBefore(startOfDay(formData.scheduleDate), startOfDay(new Date()))) {
      newErrors.scheduleDate = 'Data não pode ser no passado';
    }

    if (!formData.shift) {
      newErrors.shift = 'Turno é obrigatório';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Horário de término é obrigatório';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      let end = new Date(`2000-01-01T${formData.endTime}`);

      // Se o horário de fim for menor que o de início, assumir que é no dia seguinte (turno noturno)
      if (end <= start) {
        end = new Date(`2000-01-02T${formData.endTime}`);
      }

      // Calcular duração em horas
      const durationMs = end.getTime() - start.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      // Validar se a duração é razoável (entre 1 e 24 horas)
      if (durationHours < 1) {
        newErrors.endTime = 'Turno deve ter pelo menos 1 hora de duração';
      } else if (durationHours > 24) {
        newErrors.endTime = 'Turno não pode exceder 24 horas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EscalaFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Atualizar saldo do Banco de Horas quando motorista mudar
    if (field === 'employeeId' && value) {
      updateTimeBankBalance(String(value));
    }

    // Auto-preenchimento de horários baseado no turno
    if (field === 'shift') {
      switch (value) {
        case 'DAY':
          setFormData(prev => ({
            ...prev,
            shift: value,
            startTime: '08:00',
            endTime: '17:00'
          }));
          break;
        case 'NIGHT':
          setFormData(prev => ({
            ...prev,
            shift: value,
            startTime: '22:00',
            endTime: '06:00'
          }));
          break;
        case 'MIXED':
          setFormData(prev => ({
            ...prev,
            shift: value,
            startTime: '14:00',
            endTime: '22:00'
          }));
          break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();



    // Garantir que locationId = workPostId (Posto de Trabalho = Localização) quando workPostId está preenchido
    if (formData.workPostId && formData.locationId !== formData.workPostId) {
      console.log('✅ Ajustando locationId para usar workPostId:', formData.workPostId);
      setFormData(prev => ({ ...prev, locationId: prev.workPostId }));
      setTimeout(() => {
        if (!validateForm()) {
          toast({
            title: "Erro de Validação",
            description: "Por favor, corrija os campos destacados.",
            variant: "destructive"
          });
          return;
        }
        submitForm();
      }, 100);
      return;
    }
    // Se tem viagem mas não tem workPost, usar viagem como referência
    if (formData.travelTripId && !formData.workPostId && !formData.locationId) {
      console.log('✅ Usando travelTripId sem workPostId');
    }

    if (!validateForm()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os campos destacados.",
        variant: "destructive"
      });
      return;
    }

    submitForm();
  };

  const submitForm = async () => {
    setIsSubmitting(true);

    try {
      console.log('💾 Submetendo escala com dados:', formData);
      console.log('💾 formData.travelTripId =', JSON.stringify(formData.travelTripId));
      console.log('💾 formData.workPostId =', JSON.stringify(formData.workPostId));
      console.log('💾 formData.locationId =', JSON.stringify(formData.locationId));
      await onSave(formData);
      toast({
        title: "Sucesso",
        description: initialData ? "Escala atualizada com sucesso!" : "Escala criada com sucesso!",
        variant: "default"
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Erro ao salvar escala:', error);

      // Mostrar mensagem especÃ­fica do backend (ex: limite de jornada)
      const errorMessage = error.message || "Erro ao salvar escala. Tente novamente.";

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
        duration: 5000 // duraÃ§Ã£o maior para leitura
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  // Atualizar formData quando initialData mudar OU quando o modal abrir (importante para modo view/edit)
  useEffect(() => {
    console.log('🔄 EscalaFormModal useEffect - open:', open, 'initialData:', initialData, 'mode:', mode);
    console.log('🔄 initialData completo:', JSON.stringify(initialData, null, 2));
    console.log('🔄 postosTrabalho.length:', postosTrabalho.length);
    console.log('🔄 usuarios.length:', usuarios.length);
    console.log('🔄 clientes.length:', clientes.length);

    if (open) {
      // Check if we have data to populate (checking employeeId is a good proxy for existing record)
      const hasData = initialData && initialData.employeeId && String(initialData.employeeId) !== '';

      if (initialData && (mode === 'edit' || mode === 'view' || hasData)) {
        // Processar scheduleDate - garantir que seja um objeto Date válido
        let scheduleDateValue: Date;
        if (initialData.scheduleDate) {
          if (initialData.scheduleDate instanceof Date) {
            scheduleDateValue = initialData.scheduleDate;
          } else if (typeof initialData.scheduleDate === 'string') {
            scheduleDateValue = parseLocalDate(initialData.scheduleDate);
          } else {
            scheduleDateValue = new Date();
          }
        } else {
          scheduleDateValue = new Date();
        }

        // Helper safely access nested properties
        const getProperty = (obj: any, path: string): string => {
          return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj) || '';
        };

        // Extract IDs handling both flat EscalaFormData and nested Schedule object structures
        const employeeId = String(initialData.employeeId || getProperty(initialData, 'employee.id') || '');

        let workPostId = String(initialData.workPostId || getProperty(initialData, 'workPost.id') || '');

        // Sometimes workPostId is passed but empty, check if we can get it from location if it's actually a workPost
        if (!workPostId) {
          const nestedWorkPostId = getProperty(initialData, 'workPost.id');
          if (nestedWorkPostId) workPostId = String(nestedWorkPostId);
        }

        let locationId = String(initialData.locationId || getProperty(initialData, 'location.id') || '');
        // Fallback: If no locationId but we have workPostId, use workPostId as locationId (common in this app)
        if (!locationId && workPostId) {
          locationId = workPostId;
        }

        // Handle Shift - check both shift (string) and shift object variants if they exist
        const shift = String(initialData.shift || '');

        // Handle Times
        let startTime = String(initialData.startTime || '');
        let endTime = String(initialData.endTime || '');

        // Basic time extraction from Schedule object if simple props are missing
        if (!startTime && getProperty(initialData, 'workPost.shiftStart')) {
          const start = getProperty(initialData, 'workPost.shiftStart');
          startTime = typeof start === 'string' && start.length >= 5 ? start.substring(0, 5) : String(start);
        }
        if (!endTime && getProperty(initialData, 'workPost.shiftEnd')) {
          const end = getProperty(initialData, 'workPost.shiftEnd');
          endTime = typeof end === 'string' && end.length >= 5 ? end.substring(0, 5) : String(end);
        }

        // Extrair status - verificar se existe no initialData ou usar padrão
        const status = (initialData as any).status || getProperty(initialData, 'status') || 'PENDING';
        const validStatus: ScheduleStatus = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)
          ? status as ScheduleStatus
          : 'PENDING';

        // Extrair travelTripId e legs
        const travelTripId = String(initialData.travelTripId || getProperty(initialData, 'travelTrip.id') || '');
        const legs = Number(initialData.legs || getProperty(initialData, 'legs') || getProperty(initialData, 'travelTrip.legs') || 1);

        // Garantir que todos os valores sejam sempre strings válidas
        const newFormData = {
          employeeId,
          locationId,
          workPostId,
          travelTripId,
          legs,
          scheduleDate: scheduleDateValue,
          shift,
          startTime,
          endTime,
          status: validStatus,
          observations: String(initialData.observations || ''),
          routeId: String(initialData.routeId || getProperty(initialData, 'route.id') || ''),
          vehicleId: String(initialData.vehicleId || getProperty(initialData, 'vehicle.id') || '')
        };
        console.log('📝 Atualizando formData com dados processados:', newFormData);

        // Atualizar formData imediatamente
        setFormData(newFormData);

        // Mapear workPostId para clientId
        // Primeiro tentar usar clientId diretamente do initialData
        const clientIdFromData = (initialData as any).clientId || getProperty(initialData, 'workPost.clientId') || getProperty(initialData, 'client.id');
        if (clientIdFromData) {
          const clientIdStr = String(clientIdFromData);
          setSelectedClientId(clientIdStr);
          console.log('✅ Cliente mapeado diretamente do initialData:', clientIdStr);
          // Forçar atualização dos postos filtrados imediatamente se possível
          if (postosTrabalho.length > 0) {
            const filtered = postosTrabalho.filter(posto => posto.clientId === clientIdStr);
            setPostosFiltrados(filtered);
            console.log('✅ Postos filtrados forçados:', filtered.length);
          }
        } else {
          // Se não há clientId direto, buscar do workPost
          const workPostIdToSearch = String(initialData.workPostId || initialData.locationId || '');
          console.log('🔍 Buscando cliente pelo workPostId:', workPostIdToSearch, 'postosTrabalho.length:', postosTrabalho.length);

          if (workPostIdToSearch && postosTrabalho.length > 0) {
            const workPost = postosTrabalho.find(wp => String(wp.id) === workPostIdToSearch);
            console.log('🔍 WorkPost encontrado:', workPost);
            if (workPost && workPost.clientId) {
              const clientIdStr = String(workPost.clientId);
              setSelectedClientId(clientIdStr);
              console.log('✅ Cliente mapeado do workPostId:', clientIdStr, 'workPost:', workPost);
            } else {
              console.warn('⚠️ WorkPost não encontrado ou sem clientId. workPostId:', workPostIdToSearch);
            }
          } else if (workPostIdToSearch && postosTrabalho.length === 0) {
            // Se os postos ainda não foram carregados, aguardar e tentar novamente quando carregarem
            console.log('⏳ Aguardando carregamento dos postos de trabalho...');
          }
        }
      } else if (!initialData || mode === 'create') {
        // Se não há initialData ou é modo create, resetar para valores padrão
        console.log('📝 Resetando formData (sem initialData ou modo create)');
        setFormData({
          employeeId: '',
          locationId: '',
          workPostId: '',
          travelTripId: '',
          legs: 1,
          scheduleDate: new Date(),
          shift: '',
          startTime: '',
          endTime: '',
          status: 'PENDING',
          observations: '',
          routeId: ''
        });
        setSelectedClientId('');
      }
    } else {
      // Reset apenas quando o modal fechar
      setSelectedClientId('');
      console.log('📝 Resetando formData (modal fechado)');
      setFormData({
        employeeId: '',
        locationId: '',
        workPostId: '',
        travelTripId: '',
        legs: 1,
        scheduleDate: new Date(),
        shift: '',
        startTime: '',
        endTime: '',
        status: 'PENDING',
        observations: '',
      });
    }
  }, [initialData, open, mode, postosTrabalho, usuarios, clientes]);

  // Efeito adicional removido - a lógica foi consolidada no primeiro useEffect
  // para evitar conflitos de reescrita de dados.


  const turnos = [
    {
      value: 'DAY',
      label: 'Diurno',
      description: '08:00 - 17:00',
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    },
    {
      value: 'NIGHT',
      label: 'Noturno',
      description: '22:00 - 06:00',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    {
      value: 'MIXED',
      label: 'Misto',
      description: '14:00 - 22:00',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
  ];

  console.log('🎭 EscalaFormModal render - open:', open, 'mode:', mode, 'initialData:', initialData);
  console.log('🎭 Título do modal será:', mode === 'view' ? 'Visualizar Escala' : mode === 'edit' ? 'Edição de Escala' : 'Nova Escala');
  console.log('🎭 formData atual:', formData);
  console.log('🎭 selectedClientId atual:', selectedClientId);
  console.log('🎭 usuarios.length:', usuarios.length);
  console.log('🎭 clientes.length:', clientes.length);
  console.log('🎭 postosTrabalho.length:', postosTrabalho.length);
  console.log('🎭 postosFiltrados.length:', postosFiltrados.length);

  // Log quando open mudar
  useEffect(() => {
    console.log('🔄 EscalaFormModal - open mudou para:', open);
    console.log('🔄 EscalaFormModal - mode:', mode);
    console.log('🔄 EscalaFormModal - Título será:', mode === 'view' ? 'Visualizar Escala' : mode === 'edit' ? 'Edição de Escala' : 'Nova Escala');
    console.log('🔄 EscalaFormModal - initialData:', initialData);
  }, [open, mode, initialData]);

  console.log('🎭 EscalaFormModal renderizando - open:', open, 'mode:', mode);
  console.log('🎭 EscalaFormModal - initialData:', initialData);

  // Layout de visualização (estilo cartão, semelhante ao modal de Troca de Plantão)








  // Sempre renderizar o Dialog, mesmo quando fechado, para permitir animações
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-seguranca-graphite text-seguranca-lightgray border-gray-700 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
              <CalendarLucide className="w-5 h-5 text-seguranca-yellow" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {(mode === 'edit' || (initialData?.employeeId && String(initialData.employeeId) !== '')) ? 'Edição de Escala' : 'Nova Escala'}
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                {(mode === 'edit' || (initialData?.employeeId && String(initialData.employeeId) !== '')) ? 'Atualize as informações da escala' : 'Preencha os dados para criar uma nova escala de trabalho'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Funcionário */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-seguranca-yellow" />
              <Label htmlFor="employeeId" className="text-sm font-medium">
                Funcionário <span className="text-red-400">*</span>
              </Label>
              {timeBankBalance && (
                <Badge variant="outline" className={`ml-auto border-gray-600 ${timeBankBalance.startsWith('-') ? 'text-red-400' : 'text-green-400'
                  }`}>
                  Banco: {timeBankBalance}
                </Badge>
              )}
            </div>
            <Select
              value={String(formData.employeeId || '')}
              onValueChange={(value) => {
                console.log('👤 Funcionário selecionado:', value);
                handleInputChange('employeeId', value);
              }}
              disabled={mode === 'view'}
            >
              <SelectTrigger className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.employeeId
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                } ${mode === 'view' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Selecione um funcionário">
                  {formData.employeeId && usuarios.length > 0 ? (
                    usuarios.find(u => String(u.id) === String(formData.employeeId))?.name || 'Selecione um funcionário'
                  ) : 'Selecione um funcionário'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10002]">
                {usuarios.length > 0 ? (
                  usuarios.map(user => (
                    <SelectItem key={String(user.id)} value={String(user.id)} className="hover:bg-seguranca-black/50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {user.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Carregando funcionários...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.employeeId && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.employeeId}
              </div>
            )}
          </div>

          {/* Cliente */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-seguranca-yellow" />
              <Label htmlFor="locationId" className="text-sm font-medium">
                Cliente <span className="text-red-400">*</span>
              </Label>
            </div>
            <Select
              value={String(selectedClientId || '')}
              onValueChange={(value) => {
                console.log('🔍 Cliente selecionado:', value);
                setSelectedClientId(value);
                // Limpar locationId e workPostId quando mudar o cliente
                handleInputChange('locationId', '');
                handleInputChange('workPostId', '');
                // Limpar erros
                if (errors.locationId) {
                  setErrors(prev => ({ ...prev, locationId: undefined }));
                }
                if (errors.workPostId) {
                  setErrors(prev => ({ ...prev, workPostId: undefined }));
                }
              }}
              disabled={mode === 'view'}
            >
              <SelectTrigger className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.locationId
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                } ${mode === 'view' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Selecione um cliente">
                  {selectedClientId && clientes.length > 0 ? (
                    clientes.find(c => String(c.id) === String(selectedClientId))?.name || 'Selecione um cliente'
                  ) : 'Selecione um cliente'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10002]">
                {clientes.length > 0 ? (
                  clientes.map(client => (
                    <SelectItem key={String(client.id)} value={String(client.id)} className="hover:bg-seguranca-black/50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {client.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Carregando clientes...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.locationId && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.locationId}
              </div>
            )}
          </div>

          {/* Posto de Trabalho */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-seguranca-yellow" />
              <Label htmlFor="workPostId" className="text-sm font-medium">
                Posto de Trabalho
              </Label>
            </div>
            <Select
              value={String(formData.workPostId || '')}
              onValueChange={(value) => {
                console.log('🏢 Posto de Trabalho selecionado:', value);
                handleInputChange('workPostId', value);
                handleInputChange('locationId', value);
                if (errors.workPostId) {
                  setErrors(prev => ({ ...prev, workPostId: undefined }));
                }
                if (errors.locationId) {
                  setErrors(prev => ({ ...prev, locationId: undefined }));
                }
              }}
              disabled={mode === 'view' || !selectedClientId}
            >
              <SelectTrigger className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.workPostId
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                } ${mode === 'view' || !selectedClientId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={selectedClientId ? "Selecione um posto de trabalho" : "Selecione primeiro um cliente"}>
                  {formData.workPostId && postosFiltrados.length > 0 ? (
                    postosFiltrados.find(p => String(p.id) === String(formData.workPostId))?.name || 'Selecione um posto de trabalho'
                  ) : selectedClientId ? "Selecione um posto de trabalho" : "Selecione primeiro um cliente"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                {postosFiltrados.length > 0 ? (
                  postosFiltrados.map(posto => (
                    <SelectItem key={String(posto.id)} value={String(posto.id)} className="hover:bg-seguranca-black/50">
                      <div className="flex items-center gap-2">
                        <Building className="w-3 h-3 text-gray-400" />
                        <span>{posto.name}</span>
                        {posto.postCode && (
                          <span className="text-xs text-gray-400">({posto.postCode})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    {!selectedClientId
                      ? 'Selecione primeiro um cliente'
                      : postosTrabalho.length === 0
                        ? 'Carregando postos de trabalho...'
                        : 'Nenhum posto disponível para este cliente'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Viagem (substitui/complementa Posto de Trabalho no módulo de tráfego) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-seguranca-yellow" />
              <Label htmlFor="travelTripId" className="text-sm font-medium">
                Viagem
              </Label>
            </div>
            <Select
              value={String(formData.travelTripId || '')}
              onValueChange={(value) => {
                console.log('🚌 Viagem selecionada:', value);
                handleInputChange('travelTripId', value);
                // Auto-preencher o número de pegadas da viagem selecionada
                const trip = viagensFiltradas.find(v => String(v.id) === value);
                if (trip) {
                  handleInputChange('legs', trip.legs);
                }
              }}
              disabled={mode === 'view'}
            >
              <SelectTrigger className="bg-seguranca-black border-2 border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow transition-colors h-11">
                <SelectValue placeholder="Selecione uma viagem (opcional)">
                  {formData.travelTripId && viagensFiltradas.length > 0 ? (
                    viagensFiltradas.find(v => String(v.id) === String(formData.travelTripId))?.name || 'Selecione uma viagem'
                  ) : 'Selecione uma viagem (opcional)'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10002]">
                {viagensFiltradas.length > 0 ? (
                  viagensFiltradas.map(viagem => (
                    <SelectItem key={viagem.id} value={viagem.id} className="hover:bg-seguranca-black/50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        {viagem.tripType === 'TURISTICO' ? (
                          <span className="text-purple-400 text-xs font-bold">TUR</span>
                        ) : (
                          <span className="text-blue-400 text-xs font-bold">FRT</span>
                        )}
                        <span>{viagem.name}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          ({viagem.legs} <Footprints className="w-3 h-3" />)
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nenhuma viagem disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Pegadas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-seguranca-yellow" />
              <Label htmlFor="legs" className="text-sm font-medium">
                Pegadas (trechos)
              </Label>
            </div>
            <Select
              value={String(formData.legs || 1)}
              onValueChange={(value) => handleInputChange('legs', Number.parseInt(value))}
              disabled={mode === 'view'}
            >
              <SelectTrigger className="bg-seguranca-black border-2 border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow transition-colors h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10002]">
                {[1, 2, 3, 4].map(n => (
                  <SelectItem key={n} value={String(n)} className="hover:bg-seguranca-black/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: n }).map((_, i) => (
                        <Footprints key={i} className="w-3 h-3 text-yellow-400" />
                      ))}
                      <span>{n} pegada{n > 1 ? 's' : ''}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-seguranca-yellow" />
                <Label htmlFor="scheduleDate" className="text-sm font-medium">
                  Data <span className="text-red-400">*</span>
                </Label>
              </div>
              <Input
                id="scheduleDate"
                type="date"
                value={formData.scheduleDate ? format(formData.scheduleDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    const newDate = new Date(year, month - 1, day);
                    handleInputChange('scheduleDate', newDate);
                  }
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
                disabled={mode === 'view'}
                className={`bg-seguranca-black border-2 transition-colors h-11 text-seguranca-lightgray ${errors.scheduleDate
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                  } ${mode === 'view' ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {formData.scheduleDate && isWeekend(formData.scheduleDate) && (
                <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-300">
                  Final de semana
                </Badge>
              )}
              {errors.scheduleDate && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.scheduleDate}
                </div>
              )}
            </div>

          </div>

          <div className="space-y-3">
            {/* Rota */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-seguranca-yellow" />
              <Label htmlFor="routeId" className="text-sm font-medium">
                Rota Asssociada
              </Label>
            </div>
            <Select
              value={String(formData.routeId || '')}
              onValueChange={(value) => handleInputChange('routeId', value)}
              disabled={mode === 'view'}
            >
              <SelectTrigger className="bg-seguranca-black border-2 border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow transition-colors h-11">
                <SelectValue placeholder="Selecione uma rota (opcional)">
                  {formData.routeId && rotas.length > 0 ? (
                    rotas.find(r => String(r.id) === String(formData.routeId))?.name || 'Selecione uma rota'
                  ) : 'Selecione uma rota'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10002]">
                {rotas.length > 0 ? (
                  rotas.map(rota => (
                    <SelectItem key={rota.id} value={rota.id} className="hover:bg-seguranca-black/50 cursor-pointer">
                      {rota.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nenhuma rota disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Veículo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-purple-400" />
              <Label htmlFor="vehicleId" className="text-sm font-medium">
                Veículo
              </Label>
            </div>
            <Select
              value={String(formData.vehicleId || '')}
              onValueChange={(value) => handleInputChange('vehicleId', value)}
              disabled={mode === 'view'}
            >
              <SelectTrigger className="bg-seguranca-black border-2 border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow transition-colors h-11">
                <SelectValue placeholder="Selecione um veículo (opcional)">
                  {formData.vehicleId && veiculos.length > 0 ? (
                    (() => {
                      const v = veiculos.find(v => String(v.id) === String(formData.vehicleId));
                      return v ? `${v.plate}${v.fleetNumber ? ` - Frota: ${v.fleetNumber}` : ''}` : 'Selecione um veículo';
                    })()
                  ) : 'Selecione um veículo (opcional)'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10002]">
                {veiculos.length > 0 ? (
                  veiculos.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id} className="hover:bg-seguranca-black/50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Car className="w-3 h-3 text-purple-400" />
                        <span>{vehicle.plate}</span>
                        {vehicle.fleetNumber && (
                          <span className="text-xs text-seguranca-yellow font-medium">
                            (Frota: {vehicle.fleetNumber})
                          </span>
                        )}
                        <span className="text-xs text-gray-400">({vehicle.model})</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nenhum veículo disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Turno */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-seguranca-yellow" />
                <Label htmlFor="shift" className="text-sm font-medium">
                  Turno <span className="text-red-400">*</span>
                </Label>
              </div>
              <Select
                value={formData.shift || ''}
                onValueChange={(value) => handleInputChange('shift', value)}
                disabled={mode === 'view'}
              >
                <SelectTrigger className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.shift
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                  } ${mode === 'view' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  {turnos.map((turno) => (
                    <SelectItem key={turno.value} value={turno.value} className="hover:bg-seguranca-black/50">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${turno.value === 'DAY' ? 'bg-yellow-500' :
                            turno.value === 'NIGHT' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}></div>
                          <span>{turno.label}</span>
                        </div>
                        <span className="text-xs text-gray-400 ml-2">{turno.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.shift && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.shift}
                </div>
              )}
            </div>
          </div>

          {/* Horários */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-seguranca-yellow" />
              <Label className="text-sm font-medium">Horários de Trabalho</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="startTime" className="text-sm">
                  Horário de Início <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  disabled={mode === 'view'}
                  className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.startTime
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                    } ${mode === 'view' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.startTime && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.startTime}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="endTime" className="text-sm">
                  Horário de Término <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  disabled={mode === 'view'}
                  className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.endTime
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                    } ${mode === 'view' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.endTime && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.endTime}
                  </div>
                )}
              </div>
            </div>

            {/* Duração calculada */}
            {formData.startTime && formData.endTime && !errors.endTime && (
              <div className="flex items-center gap-2 p-3 bg-seguranca-black/50 rounded-lg border border-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">
                  Duração do turno: <span className="text-seguranca-yellow font-medium">{calculateShiftDuration()}</span>
                </span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-seguranca-yellow" />
              <Label htmlFor="status" className="text-sm font-medium">
                Status <span className="text-red-400">*</span>
              </Label>
            </div>
            <Select
              value={formData.status || 'PENDING'}
              onValueChange={(value) => {
                handleInputChange('status', value as ScheduleStatus);
              }}
              disabled={mode === 'view'}
            >
              <SelectTrigger className={`bg-seguranca-black border-2 transition-colors h-11 ${mode === 'view' ? 'opacity-50 cursor-not-allowed' : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                }`}>
                <SelectValue placeholder="Selecione o status">
                  {formData.status === 'PENDING' && 'Pendente'}
                  {formData.status === 'CONFIRMED' && 'Confirmada'}
                  {formData.status === 'CANCELLED' && 'Cancelada'}
                  {formData.status === 'COMPLETED' && 'Concluída'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10002]">
                <SelectItem value="PENDING" className="hover:bg-seguranca-black/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Pendente
                  </div>
                </SelectItem>
                <SelectItem value="CONFIRMED" className="hover:bg-seguranca-black/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Confirmada
                  </div>
                </SelectItem>
                <SelectItem value="COMPLETED" className="hover:bg-seguranca-black/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Concluída
                  </div>
                </SelectItem>
                <SelectItem value="CANCELLED" className="hover:bg-seguranca-black/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Cancelada
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-3">
            <Label htmlFor="observations" className="text-sm font-medium">
              Observações
            </Label>
            <Textarea
              id="observations"
              value={formData.observations || ''}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              placeholder="Adicione observações sobre esta escala (opcional)"
              disabled={mode === 'view'}
              className={`bg-seguranca-black border-2 border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow transition-colors resize-none ${mode === 'view' ? 'opacity-50 cursor-not-allowed' : ''}`}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-6 border-t border-gray-600">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="bg-seguranca-black border-gray-600 hover:bg-seguranca-graphite hover:border-gray-500 transition-colors"
              >
                {mode === 'view' ? 'Fechar' : 'Cancelar'}
              </Button>
              {mode !== 'view' && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-seguranca-red hover:bg-seguranca-red/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Salvando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {mode === 'edit' ? 'Atualizar Escala' : 'Criar Escala'}
                    </div>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form >
      </DialogContent >
    </Dialog >
  );
};

export default EscalaFormModal;
