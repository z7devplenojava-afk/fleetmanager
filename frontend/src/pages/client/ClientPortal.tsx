import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  Truck, 
  FileText, 
  MessageSquare, 
  AlertTriangle, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  Download, 
  Search, 
  RefreshCw,
  Send,
  HelpCircle,
  FolderOpen,
  FileCheck,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  clientPortalService, 
  ClientPortalDashboardData, 
  VehicleSummary, 
  RecentRequest, 
  SupportTicket 
} from '@/services/clientPortalService';

export default function ClientPortal() {
  const { user, empresa } = useAuth();
  const [data, setData] = useState<ClientPortalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isExtraTripModalOpen, setIsExtraTripModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessageText, setTicketMessageText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [reserveForm, setReserveForm] = useState({
    contractId: '',
    affectedVehiclePlate: '',
    reason: '',
    observations: '',
    isExtraReserve: false
  });

  const [extraTripForm, setExtraTripForm] = useState({
    contractId: '',
    origin: '',
    destination: '',
    departureDateTime: '',
    returnDateTime: '',
    passengerCount: 1,
    vehicleTypeNeeded: 'Ônibus Executivo',
    reason: '',
    observations: ''
  });

  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: 'ATRASO_DESVIO_ROTA',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    contractId: '',
    vehiclePlate: '',
    contactPhone: ''
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const res = await clientPortalService.getDashboard();
      setData(res);
    } catch (err: any) {
      toast.error('Erro ao carregar dados do portal do cliente: ' + (err.message || 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveForm.affectedVehiclePlate || !reserveForm.reason) {
      toast.error('Preencha a placa do veículo e o motivo.');
      return;
    }

    try {
      setSubmitting(true);
      await clientPortalService.requestReserveVehicle({
        contractId: reserveForm.contractId || undefined,
        affectedVehiclePlate: reserveForm.affectedVehiclePlate,
        reason: reserveForm.reason,
        observations: reserveForm.observations,
        isExtraReserve: reserveForm.isExtraReserve
      });
      toast.success('Solicitação de veículo reserva enviada com sucesso! As equipes de Operacional e Manutenção foram notificadas.');
      setIsReserveModalOpen(false);
      setReserveForm({
        contractId: '',
        affectedVehiclePlate: '',
        reason: '',
        observations: '',
        isExtraReserve: false
      });
      loadPortalData();
    } catch (err: any) {
      toast.error('Erro ao solicitar veículo reserva: ' + (err.message || 'Erro inesperado'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtraTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraTripForm.origin || !extraTripForm.destination || !extraTripForm.departureDateTime || !extraTripForm.reason) {
      toast.error('Preencha origem, destino, data/hora e justificativa.');
      return;
    }

    try {
      setSubmitting(true);
      await clientPortalService.requestExtraTrip({
        contractId: extraTripForm.contractId || undefined,
        origin: extraTripForm.origin,
        destination: extraTripForm.destination,
        departureDateTime: extraTripForm.departureDateTime,
        returnDateTime: extraTripForm.returnDateTime || undefined,
        passengerCount: Number(extraTripForm.passengerCount),
        vehicleTypeNeeded: extraTripForm.vehicleTypeNeeded,
        reason: extraTripForm.reason,
        observations: extraTripForm.observations
      });
      toast.success('Solicitação de viagem extra registrada com sucesso! Operacional e Comercial notificados.');
      setIsExtraTripModalOpen(false);
      setExtraTripForm({
        contractId: '',
        origin: '',
        destination: '',
        departureDateTime: '',
        returnDateTime: '',
        passengerCount: 1,
        vehicleTypeNeeded: 'Ônibus Executivo',
        reason: '',
        observations: ''
      });
      loadPortalData();
    } catch (err: any) {
      toast.error('Erro ao solicitar viagem extra: ' + (err.message || 'Erro inesperado'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.description || !ticketForm.category) {
      toast.error('Preencha o título, categoria e descrição do chamado.');
      return;
    }

    try {
      setSubmitting(true);
      await clientPortalService.createTicket({
        title: ticketForm.title,
        description: ticketForm.description,
        category: ticketForm.category,
        priority: ticketForm.priority,
        contractId: ticketForm.contractId || undefined,
        vehiclePlate: ticketForm.vehiclePlate || undefined,
        contactPhone: ticketForm.contactPhone || undefined
      });
      toast.success('Chamado aberto com sucesso! A equipe responsável foi notificada.');
      setIsTicketModalOpen(false);
      setTicketForm({
        title: '',
        description: '',
        category: 'ATRASO_DESVIO_ROTA',
        priority: 'NORMAL',
        contractId: '',
        vehiclePlate: '',
        contactPhone: ''
      });
      loadPortalData();
    } catch (err: any) {
      toast.error('Erro ao abrir chamado: ' + (err.message || 'Erro inesperado'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (ticketId: string) => {
    if (!ticketMessageText.trim()) return;
    try {
      await clientPortalService.addTicketMessage(ticketId, ticketMessageText);
      toast.success('Mensagem enviada com sucesso!');
      setTicketMessageText('');
      loadPortalData();
      if (selectedTicket) {
        setSelectedTicket({
          ...selectedTicket,
          messages: [
            ...(selectedTicket.messages || []),
            {
              id: String(Date.now()),
              content: ticketMessageText,
              senderName: user?.name || 'Você',
              isSupport: false,
              createdAt: new Date().toISOString()
            }
          ]
        });
      }
    } catch (err: any) {
      toast.error('Erro ao enviar mensagem: ' + (err.message || 'Erro inesperado'));
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'ATRASO_DESVIO_ROTA':
        return 'Atraso / Desvio de Rota';
      case 'MANUTENCAO_HIGIENE':
        return 'Manutenção / Ar-condicionado / Higiene';
      case 'MUDANCA_PONTO':
        return 'Solicitação de Mudança de Ponto';
      case 'DUVIDAS_FINANCEIRAS':
      case 'BILLING':
        return 'Dúvidas Financeiras / Faturamento';
      case 'TECHNICAL_SUPPORT':
        return 'Suporte Técnico';
      default:
        return 'Outros Assuntos';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
      case 'RESOLVED':
      case 'CLOSED':
        return <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">Concluído / Aprovado</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30">Em Atendimento</Badge>;
      case 'PENDING':
      case 'OPEN':
        return <Badge className="bg-amber-600/20 text-amber-400 border border-amber-500/30">Pendente / Aberto</Badge>;
      case 'REJECTED':
      case 'CANCELLED':
        return <Badge className="bg-rose-600/20 text-rose-400 border border-rose-500/30">Recusado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Carregando seu Portal do Cliente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-inner">
                <Building2 className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  Portal do Cliente: {data?.clientName || 'Sua Empresa'}
                </h1>
                <p className="text-sm text-slate-400">
                  CNPJ: {data?.clientCnpj || '00.000.000/0000-00'} • Prestador: <span className="text-indigo-300 font-medium">{data?.companyName || 'FleetManager'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={() => setIsReserveModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-lg shadow-amber-900/20"
            >
              <Truck className="w-4 h-4 mr-2" />
              Solicitar Veículo Reserva
            </Button>
            <Button 
              onClick={() => setIsExtraTripModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-900/20"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Solicitar Viagem Extra
            </Button>
            <Button 
              onClick={() => setIsTicketModalOpen(true)}
              variant="outline"
              className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2 text-indigo-400" />
              Abrir Chamado
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/60 backdrop-blur border-border shadow-sm hover:border-indigo-500/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contratos Ativos</CardTitle>
            <FileText className="w-5 h-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeContractsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Acordos e frotas vigentes</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border shadow-sm hover:border-emerald-500/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Veículos Alocados</CardTitle>
            <Truck className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalVehiclesAllocated || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Frota dedicada à operação</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border shadow-sm hover:border-amber-500/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solicitações Pendentes</CardTitle>
            <Clock className="w-5 h-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{data?.pendingRequestsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Reservas & Viagens Extras</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border shadow-sm hover:border-blue-500/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chamados Abertos</CardTitle>
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{data?.openTicketsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Suporte operacional ativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 bg-card/80 p-1 border border-border rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">
            <Building2 className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="rounded-lg">
            <Truck className="w-4 h-4 mr-2" />
            Frota & Linhas ({data?.vehicles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="requests" className="rounded-lg">
            <Clock className="w-4 h-4 mr-2" />
            Solicitações ({data?.recentRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="rounded-lg">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chamados ({data?.recentTickets?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg">
            <FolderOpen className="w-4 h-4 mr-2" />
            Documentos do Fluxo
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contratos Ativos */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    Contratos em Vigência
                  </CardTitle>
                  <CardDescription>Detalhamento das obras e cláusulas de atendimento contratadas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(!data?.contracts || data.contracts.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhum contrato ativo encontrado.</div>
                  ) : (
                    data.contracts.map((contract) => (
                      <div key={contract.id} className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{contract.contractNumber}</span>
                            <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                              {contract.obraName || 'Operação Principal'}
                            </Badge>
                            {contract.hasReserveClause && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                                Cláusula de Reserva Inclusa
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{contract.description}</p>
                          <div className="text-xs text-muted-foreground flex items-center gap-4 pt-1">
                            <span>Início: {contract.startDate}</span>
                            {contract.endDate && <span>Término: {contract.endDate}</span>}
                            <span>Qtd. Veículos: {contract.vehicleQuantity || 1}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setActiveTab('vehicles')}>
                            Ver Veículos
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Solicitações Recentes */}
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      Últimas Solicitações de Veículo & Viagens
                    </CardTitle>
                    <CardDescription>Acompanhe o andamento das reservas e viagens eventuais</CardDescription>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setActiveTab('requests')}>
                    Ver Todas
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(!data?.recentRequests || data.recentRequests.length === 0) ? (
                    <div className="text-center py-6 text-muted-foreground">Nenhuma solicitação recente.</div>
                  ) : (
                    data.recentRequests.map((req) => (
                      <div key={req.id} className="p-3.5 rounded-lg bg-card border border-border flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{req.title}</span>
                            {getStatusBadge(req.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">{req.reason}</p>
                          {req.assignedVehiclePlate && (
                            <p className="text-xs text-emerald-400 font-medium">Veículo Designado: {req.assignedVehiclePlate}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chamados & Suporte Rápido */}
            <div className="space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    Chamados Recentes
                  </CardTitle>
                  <CardDescription>Interações diretas com o suporte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(!data?.recentTickets || data.recentTickets.length === 0) ? (
                    <div className="text-center py-6 text-muted-foreground">Nenhum chamado aberto.</div>
                  ) : (
                    data.recentTickets.map((t) => (
                      <div 
                        key={t.id} 
                        onClick={() => { setSelectedTicket(t); setActiveTab('tickets'); }}
                        className="p-3 rounded-lg bg-card border border-border hover:border-blue-500/40 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground truncate max-w-[180px]">{t.title}</span>
                          {getStatusBadge(t.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{getCategoryLabel(t.category)}</span>
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <Button 
                    className="w-full mt-2" 
                    variant="outline" 
                    onClick={() => setIsTicketModalOpen(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Abrir Novo Chamado
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-900/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-indigo-300">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    Canal Direto Operacional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-300">
                  <p>
                    Para emergências operacionais, acidentes ou quebras críticas em trânsito com impacto imediato:
                  </p>
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-xs text-slate-400">Central de Despacho 24h:</div>
                    <div className="font-mono text-indigo-400 font-bold flex items-center gap-2">
                      <Phone className="w-4 h-4" /> (11) 4000-0000 / Ramal 9
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Vehicles */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  Veículos Alocados ao seu Contrato
                </CardTitle>
                <CardDescription>Acompanhe a frota designada, motoristas escalados e conformidade técnica</CardDescription>
              </div>
              <div className="w-full md:w-72">
                <Input 
                  placeholder="Filtrar por placa, modelo ou motorista..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-card"
                />
              </div>
            </CardHeader>
            <CardContent>
              {(!data?.vehicles || data.vehicles.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground">Nenhum veículo alocado no momento.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.vehicles
                    .filter(v => 
                      !searchQuery || 
                      v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (v.assignedDriver && v.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((vehicle) => (
                      <div key={vehicle.id} className="p-4 rounded-xl bg-card border border-border space-y-3 hover:border-emerald-500/40 transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-lg text-foreground tracking-wide">{vehicle.plate}</span>
                            {vehicle.fleetNumber && (
                              <span className="text-xs text-muted-foreground ml-2">({vehicle.fleetNumber})</span>
                            )}
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {vehicle.status}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-sm">
                          <div className="text-foreground font-medium">{vehicle.brand} {vehicle.model} ({vehicle.year})</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            Capacidade: <span className="text-foreground font-medium">{vehicle.capacity} passageiros</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            Condutor Escalado: <span className="text-foreground font-medium">{vehicle.assignedDriver || 'A Definir'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                            Checklist Veicular: <span className="text-emerald-400 font-medium">{vehicle.lastChecklistStatus || 'Conforme'}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border flex items-center justify-between">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-0 h-auto"
                            onClick={() => {
                              setReserveForm({ ...reserveForm, affectedVehiclePlate: vehicle.plate });
                              setIsReserveModalOpen(true);
                            }}
                          >
                            Solicitar Reserva para este veículo
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Requests */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Histórico de Solicitações Operacionais
                </CardTitle>
                <CardDescription>Status detalhado de Veículos Reserva e Viagens Extras solicitadas</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setIsReserveModalOpen(true)} className="bg-amber-600 hover:bg-amber-700">
                  <Truck className="w-4 h-4 mr-1.5" />
                  Veículo Reserva
                </Button>
                <Button size="sm" onClick={() => setIsExtraTripModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Viagem Extra
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(!data?.recentRequests || data.recentRequests.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground">Nenhuma solicitação registrada.</div>
              ) : (
                <div className="space-y-3">
                  {data.recentRequests.map((req) => (
                    <div key={req.id} className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-foreground">{req.title}</span>
                          {getStatusBadge(req.status)}
                          <Badge variant="outline" className="text-xs">
                            {req.requestType === 'RESERVE_VEHICLE' ? 'Veículo Reserva' : 'Viagem Extra'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.reason}</p>
                        {req.origin && req.destination && (
                          <div className="text-xs text-indigo-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {req.origin} $\rightarrow$ {req.destination}
                            {req.departureDateTime && ` • Saída: ${new Date(req.departureDateTime).toLocaleString()}`}
                          </div>
                        )}
                        {req.assignedVehiclePlate && (
                          <div className="text-xs text-emerald-400 font-medium">
                            Veículo Designado: {req.assignedVehiclePlate} {req.assignedDriverName ? `(Motorista: ${req.assignedDriverName})` : ''}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                        Solicitado em: {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Tickets */}
        <TabsContent value="tickets" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Central de Atendimento e Chamados
                </CardTitle>
                <CardDescription>Abra chamados por categoria e interaja diretamente com o suporte operacional</CardDescription>
              </div>
              <Button onClick={() => setIsTicketModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                Novo Chamado
              </Button>
            </CardHeader>
            <CardContent>
              {(!data?.recentTickets || data.recentTickets.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground">Nenhum chamado de suporte registrado.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lista de Chamados */}
                  <div className="space-y-3 lg:col-span-1 border-r border-border pr-4">
                    {data.recentTickets.map((ticket) => (
                      <div 
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedTicket?.id === ticket.id 
                            ? 'bg-blue-600/10 border-blue-500 shadow-sm' 
                            : 'bg-card border-border hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm truncate max-w-[160px]">{ticket.title}</span>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getCategoryLabel(ticket.category)}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center justify-between pt-2">
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.messageCount || 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detalhes & Chat do Chamado Selecionado */}
                  <div className="lg:col-span-2 space-y-4">
                    {selectedTicket ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-foreground">{selectedTicket.title}</h3>
                            {getStatusBadge(selectedTicket.status)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-4">
                            <span>Categoria: <strong className="text-foreground">{getCategoryLabel(selectedTicket.category)}</strong></span>
                            <span>Aberto por: <strong className="text-foreground">{selectedTicket.customerName}</strong></span>
                            <span>Data: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Mensagens */}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto p-4 rounded-xl bg-slate-950/40 border border-border">
                          {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                            selectedTicket.messages.map((msg, i) => (
                              <div 
                                key={msg.id || i} 
                                className={`p-3 rounded-xl max-w-[85%] text-sm space-y-1 ${
                                  msg.isSupport 
                                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 mr-auto' 
                                    : 'bg-slate-800 border border-slate-700 text-white ml-auto'
                                }`}
                              >
                                <div className="text-xs font-semibold text-indigo-300">
                                  {msg.isSupport ? '🛡️ Suporte Operacional' : msg.senderName || 'Você'}
                                </div>
                                <p>{msg.content}</p>
                                <div className="text-[10px] text-slate-400 text-right">
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                              Envie uma mensagem abaixo para interagir com o time de suporte.
                            </div>
                          )}
                        </div>

                        {/* Input de Mensagem */}
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Escreva sua mensagem ou atualização..." 
                            value={ticketMessageText}
                            onChange={(e) => setTicketMessageText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(selectedTicket.id); }}
                            className="bg-card"
                          />
                          <Button onClick={() => handleSendMessage(selectedTicket.id)} className="bg-indigo-600 hover:bg-indigo-700">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground gap-2 border border-dashed rounded-xl">
                        <MessageSquare className="w-8 h-8 opacity-40" />
                        <p>Selecione um chamado ao lado para visualizar o histórico de mensagens e responder.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Documents */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-400" />
                Central de Documentos do Fluxo & RH
              </CardTitle>
              <CardDescription>Acesse e faça download dos relatórios de medição, contratos, laudos e comprovantes fiscais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Pasta 1: Contratos e Aditivos */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm">Contratos e Termos</h4>
                      <p className="text-xs text-muted-foreground">Contratos vigentes e aditivos</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border text-xs">
                    {data?.contracts?.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                        <span className="truncate max-w-[170px]">{c.contractNumber} - {c.description}</span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-indigo-400">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pasta 2: Relatórios de Medição Mensal */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <FileSpreadsheet className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm">Relatórios de Medição</h4>
                      <p className="text-xs text-muted-foreground">Demonstrativos de viagens e km</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span>Medição Mensal - Mês Atual</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-400">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span>Fechamento Consolidado - Mês Anterior</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-400">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pasta 3: Guias de Transporte */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400">
                      <FileCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm">Guias de Transporte</h4>
                      <p className="text-xs text-muted-foreground">Autorizações e itinerários</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span>Guias Operacionais Emitidas</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-400">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pasta 4: Laudos & Checklists */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm">Laudos & Vistorias</h4>
                      <p className="text-xs text-muted-foreground">Checklists e laudos técnicos</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span>Vistorias e Checklists Veiculares</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-400">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pasta 5: Comprovantes Fiscais & Faturas */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm">Notas Fiscais & Faturas</h4>
                      <p className="text-xs text-muted-foreground">Faturas e recibos emitidos</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span>Notas Fiscais de Serviços (NFS-e)</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-purple-400">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pasta 6: Documentos de RH & SST */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400">
                      <Users className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm">Documentação RH / SST</h4>
                      <p className="text-xs text-muted-foreground">ASOs, EPIs e condutores habilitados</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                      <span>Fichas de Condutores & Treinamentos</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-400">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL 1: Solicitar Veículo Reserva */}
      <Dialog open={isReserveModalOpen} onOpenChange={setIsReserveModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <form onSubmit={handleReserveSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-500">
                <Truck className="w-5 h-5" />
                Solicitar Veículo Reserva
              </DialogTitle>
              <DialogDescription>
                Acionamento direto e simultâneo das equipes de <strong>Operacional</strong> e <strong>Manutenção</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Contrato Associado</Label>
                <Select 
                  value={reserveForm.contractId} 
                  onValueChange={(val) => setReserveForm({ ...reserveForm, contractId: val })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Selecione o contrato..." />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.contracts?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.contractNumber} - {c.description} {c.hasReserveClause ? '(Reserva Inclusa)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Placa do Veículo Titular com Problema *</Label>
                <Input 
                  placeholder="Ex: ABC-1234"
                  value={reserveForm.affectedVehiclePlate}
                  onChange={(e) => setReserveForm({ ...reserveForm, affectedVehiclePlate: e.target.value.toUpperCase() })}
                  required
                  className="bg-card uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label>Motivo da Substituição *</Label>
                <Select 
                  value={reserveForm.reason} 
                  onValueChange={(val) => setReserveForm({ ...reserveForm, reason: val })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quebra mecânica / Falha no motor">Quebra mecânica / Falha no motor</SelectItem>
                    <SelectItem value="Falha no Ar-condicionado">Falha no Ar-condicionado</SelectItem>
                    <SelectItem value="Problema elétrico / Bateria">Problema elétrico / Bateria</SelectItem>
                    <SelectItem value="Pneu furado / Suspensão">Pneu furado / Suspensão</SelectItem>
                    <SelectItem value="Manutenção preventiva agendada">Manutenção preventiva agendada</SelectItem>
                    <SelectItem value="Outro motivo">Outro motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações e Local do Veículo</Label>
                <Textarea 
                  placeholder="Informe o local onde o veículo se encontra e qualquer informação adicional relevante..."
                  value={reserveForm.observations}
                  onChange={(e) => setReserveForm({ ...reserveForm, observations: e.target.value })}
                  className="bg-card min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReserveModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
                {submitting ? 'Enviando...' : 'Confirmar Solicitação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Solicitar Viagem Extra */}
      <Dialog open={isExtraTripModalOpen} onOpenChange={setIsExtraTripModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <form onSubmit={handleExtraTripSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-indigo-400">
                <PlusCircle className="w-5 h-5" />
                Solicitar Viagem Extra / Serviço Eventual
              </DialogTitle>
              <DialogDescription>
                Agende um serviço de transporte adicional para a sua empresa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Origem *</Label>
                  <Input 
                    placeholder="Ex: Sede da Empresa"
                    value={extraTripForm.origin}
                    onChange={(e) => setExtraTripForm({ ...extraTripForm, origin: e.target.value })}
                    required
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destino *</Label>
                  <Input 
                    placeholder="Ex: Aeroporto / Obra 2"
                    value={extraTripForm.destination}
                    onChange={(e) => setExtraTripForm({ ...extraTripForm, destination: e.target.value })}
                    required
                    className="bg-card"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Data e Hora de Saída *</Label>
                  <Input 
                    type="datetime-local"
                    value={extraTripForm.departureDateTime}
                    onChange={(e) => setExtraTripForm({ ...extraTripForm, departureDateTime: e.target.value })}
                    required
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data e Hora de Retorno (opcional)</Label>
                  <Input 
                    type="datetime-local"
                    value={extraTripForm.returnDateTime}
                    onChange={(e) => setExtraTripForm({ ...extraTripForm, returnDateTime: e.target.value })}
                    className="bg-card"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Qtd. de Passageiros *</Label>
                  <Input 
                    type="number"
                    min={1}
                    value={extraTripForm.passengerCount}
                    onChange={(e) => setExtraTripForm({ ...extraTripForm, passengerCount: Number(e.target.value) })}
                    required
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Veículo Desejado</Label>
                  <Select 
                    value={extraTripForm.vehicleTypeNeeded} 
                    onValueChange={(val) => setExtraTripForm({ ...extraTripForm, vehicleTypeNeeded: val })}
                  >
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ônibus Executivo">Ônibus Executivo (44-48 lug.)</SelectItem>
                      <SelectItem value="Micro-ônibus">Micro-ônibus (24-32 lug.)</SelectItem>
                      <SelectItem value="Van Executiva">Van Executiva (15-20 lug.)</SelectItem>
                      <SelectItem value="Carro Executivo">Carro Executivo (4 lug.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Justificativa / Finalidade *</Label>
                <Input 
                  placeholder="Ex: Treinamento de equipe externa / Evento institucional"
                  value={extraTripForm.reason}
                  onChange={(e) => setExtraTripForm({ ...extraTripForm, reason: e.target.value })}
                  required
                  className="bg-card"
                />
              </div>

              <div className="space-y-2">
                <Label>Observações / Itinerário Detalhado</Label>
                <Textarea 
                  placeholder="Paradas intermediárias, responsável no local e contato..."
                  value={extraTripForm.observations}
                  onChange={(e) => setExtraTripForm({ ...extraTripForm, observations: e.target.value })}
                  className="bg-card min-h-[70px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsExtraTripModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                {submitting ? 'Enviando...' : 'Solicitar Viagem'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Novo Chamado de Suporte */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <form onSubmit={handleTicketSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-400">
                <MessageSquare className="w-5 h-5" />
                Abrir Chamado Operacional
              </DialogTitle>
              <DialogDescription>
                Sua mensagem será direcionada imediatamente para o departamento responsável.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Categoria do Chamado *</Label>
                <Select 
                  value={ticketForm.category} 
                  onValueChange={(val) => setTicketForm({ ...ticketForm, category: val })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATRASO_DESVIO_ROTA">Atraso / Desvio de Rota</SelectItem>
                    <SelectItem value="MANUTENCAO_HIGIENE">Manutenção / Ar-condicionado / Higiene</SelectItem>
                    <SelectItem value="MUDANCA_PONTO">Solicitação de Mudança de Ponto</SelectItem>
                    <SelectItem value="DUVIDAS_FINANCEIRAS">Dúvidas Financeiras / Faturamento</SelectItem>
                    <SelectItem value="OUTROS">Outros Assuntos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assunto / Título *</Label>
                <Input 
                  placeholder="Ex: Atraso na linha 04 - Turno Matutino"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  required
                  className="bg-card"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Placa do Veículo (se aplicável)</Label>
                  <Input 
                    placeholder="Ex: ABC-1234"
                    value={ticketForm.vehiclePlate}
                    onChange={(e) => setTicketForm({ ...ticketForm, vehiclePlate: e.target.value.toUpperCase() })}
                    className="bg-card uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select 
                    value={ticketForm.priority} 
                    onValueChange={(val: any) => setTicketForm({ ...ticketForm, priority: val })}
                  >
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baixa</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição Detalhada *</Label>
                <Textarea 
                  placeholder="Descreva o ocorrido, horários, pontos ou detalhes que ajudem nossa equipe a solucionar com rapidez..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  required
                  className="bg-card min-h-[90px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTicketModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? 'Abrindo chamado...' : 'Enviar Chamado'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
