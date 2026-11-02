import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import {
  Search,
  Plus,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Pencil,
  History,
  FileSpreadsheet,
  Loader2,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Trash2,
  Route,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { passengerService } from '@/services/passengerService';
import type { Passenger, Boarding } from '@/types/passenger';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

const TIPOS_PASSAGEIRO = [
  { value: 'COMUM', label: 'Comum' },
  { value: 'ESTUDANTE', label: 'Estudante' },
  { value: 'IDOSO', label: 'Idoso' },
  { value: 'PCD', label: 'PcD' },
];

const emptyForm = {
  registration: '',
  name: '',
  cpf: '',
  phone: '',
  email: '',
  passengerType: 'COMUM',
  shift: '',
  preferredTime: '',
  notificationsEnabled: true,
  active: true,
  status: 'ATIVO',
  multipleRoutesAllowed: false,
  clientId: '',
  costCenter: '',
};

interface ClientOption {
  id: string;
  name: string;
}

const PassengerManagement: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dados');
  const { user } = useAuth();
  const { toast } = useToast();
  useGSAP();

  // Modal CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Passenger | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });

  // Modal Confirmação de Demissão/Bloqueio
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [passengerToBlock, setPassengerToBlock] = useState<Passenger | null>(null);
  const [blockActionLoading, setBlockActionLoading] = useState(false);

  // Histórico
  const [historyPassenger, setHistoryPassenger] = useState<Passenger | null>(null);
  const [history, setHistory] = useState<Boarding[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const res = await api.get('/api/clients');
      if (res.data && Array.isArray(res.data)) {
        setClients(res.data.map((c: any) => ({ id: c.id, name: c.name || c.corporateName })));
      }
    } catch (e) {
      console.warn('Erro ao carregar clientes:', e);
    }
  }, []);

  const loadPassengers = useCallback(async () => {
    if (!user?.companyId) return;

    setIsLoading(true);
    try {
      const data = await passengerService.getAllPassengers(user.companyId);
      setPassengers(data);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error loading passengers:', error);
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao carregar passageiros',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId, toast]);

  useEffect(() => {
    loadClients();
    loadPassengers();
  }, [loadClients, loadPassengers]);

  // Filtros combinados de busca, cliente e status
  const filteredPassengers = passengers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf && p.cpf.includes(searchTerm));

    const matchesClient =
      selectedClientFilter === 'ALL' || p.clientId === selectedClientFilter;

    const currentStatus = p.status || (p.active ? 'ATIVO' : 'INATIVO');
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ATIVO' && currentStatus === 'ATIVO') ||
      (statusFilter === 'BLOQUEADO' && (currentStatus === 'BLOQUEADO' || currentStatus === 'DEMITIDO' || !p.active));

    return matchesSearch && matchesClient && matchesStatus;
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (p: Passenger) => {
    setEditing(p);
    setFormData({
      registration: p.registration,
      name: p.name,
      cpf: p.cpf || '',
      phone: p.phone || '',
      email: p.email || '',
      passengerType: p.passengerType || 'COMUM',
      shift: p.shift || '',
      preferredTime: p.preferredTime || '',
      notificationsEnabled: p.notificationsEnabled ?? true,
      active: p.active,
      status: p.status || (p.active ? 'ATIVO' : 'INATIVO'),
      multipleRoutesAllowed: Boolean(p.multipleRoutesAllowed),
      clientId: p.clientId || '',
      costCenter: p.costCenter || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.registration.trim()) {
      toast({ title: 'Erro de Validação', description: 'A matrícula é obrigatória.', variant: 'destructive' });
      return;
    }
    if (!formData.name.trim()) {
      toast({ title: 'Erro de Validação', description: 'O nome é obrigatório.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Passenger> = {
        registration: formData.registration,
        name: formData.name,
        cpf: formData.cpf || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        passengerType: formData.passengerType,
        shift: formData.shift || undefined,
        preferredTime: formData.preferredTime ? `${formData.preferredTime}:00` : null,
        notificationsEnabled: formData.notificationsEnabled,
        active: formData.status === 'ATIVO',
        status: formData.status,
        multipleRoutesAllowed: formData.multipleRoutesAllowed,
        clientId: formData.clientId || undefined,
        costCenter: formData.costCenter || undefined,
        companyId: user?.companyId,
      };

      if (editing) {
        await passengerService.updatePassenger(editing.id, payload);
      } else {
        await passengerService.createPassenger(payload);
      }

      toast({
        title: 'Sucesso',
        description: `Passageiro ${editing ? 'atualizado' : 'cadastrado'} com sucesso.`,
      });
      setModalOpen(false);
      loadPassengers();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao salvar passageiro',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Alternar permissão de Múltiplas Linhas com 1 clique
  const handleToggleMultipleRoutes = async (p: Passenger) => {
    const newValue = !p.multipleRoutesAllowed;
    try {
      await passengerService.toggleMultipleRoutes(p.id, newValue);
      setPassengers((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, multipleRoutesAllowed: newValue } : item))
      );
      toast({
        title: newValue ? 'Múltiplas Linhas Habilitadas' : 'Linha Fixa Ativada',
        description: `Colaborador ${p.name} agora está configurado para: ${newValue ? 'Permitido embarcar em qualquer linha do cliente' : 'Apenas 1 check-in de Ida e 1 de Retorno na linha fixa'}.`,
      });
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Não foi possível alterar permissão de rotas.', variant: 'destructive' });
    }
  };

  // Demissão / Bloqueio Imediato
  const handleConfirmStatusChange = async (newStatus: 'DEMITIDO' | 'ATIVO' | 'BLOQUEADO') => {
    if (!passengerToBlock) return;
    setBlockActionLoading(true);

    try {
      await passengerService.updateStatus(passengerToBlock.id, newStatus);
      setPassengers((prev) =>
        prev.map((item) =>
          item.id === passengerToBlock.id
            ? { ...item, status: newStatus, active: newStatus === 'ATIVO' }
            : item
        )
      );

      toast({
        title: newStatus === 'ATIVO' ? '✅ Acesso Reativado' : '🚫 Acesso Bloqueado / Demissão Registrada',
        description:
          newStatus === 'ATIVO'
            ? `Colaborador ${passengerToBlock.name} foi reativado no sistema.`
            : `Colaborador ${passengerToBlock.name} foi marcado como ${newStatus}. O login e a confirmação de embarque via QR Code foram bloqueados imediatamente.`,
      });
      setBlockDialogOpen(false);
      setPassengerToBlock(null);
    } catch (err: any) {
      toast({
        title: 'Erro ao Atualizar Status',
        description: err?.response?.data?.message || 'Falha ao processar status.',
        variant: 'destructive',
      });
    } finally {
      setBlockActionLoading(false);
    }
  };

  // Excluir passageiro
  const handleDeletePassenger = async (p: Passenger) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro de ${p.name}?`)) return;
    try {
      await passengerService.deletePassenger(p.id);
      setPassengers((prev) => prev.filter((item) => item.id !== p.id));
      toast({ title: 'Excluído', description: 'Registro de passageiro removido com sucesso.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o passageiro.', variant: 'destructive' });
    }
  };

  const openHistory = async (p: Passenger) => {
    setHistoryPassenger(p);
    setActiveTab('historico');
    setHistoryLoading(true);
    setHistory([]);
    try {
      const data = await passengerService.getBoardingsByPassenger(p.id);
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar histórico', variant: 'destructive' });
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <StandardLayout
      title="Gestão de Passageiros e Clientes"
      subtitle="Painel Exclusivo de Recursos Humanos (RH) e Departamento Pessoal (DP)"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <TabsList>
              <TabsTrigger value="dados">
                <Users className="mr-2 h-4 w-4" /> Colaboradores / Passageiros
              </TabsTrigger>
              <TabsTrigger value="historico">
                <History className="mr-2 h-4 w-4" /> Histórico de Embarque
              </TabsTrigger>
            </TabsList>

            <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-2">
              <Plus className="h-4 w-4" /> Cadastrar Colaborador
            </Button>
          </div>

          {/* ---------------- Aba Dados ---------------- */}
          <TabsContent value="dados" className="space-y-4">
            {/* Filtros em Barra Superior */}
            <Card className="p-4 bg-slate-900 border-slate-800 text-white">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="search"
                    placeholder="Buscar por nome, matrícula ou CPF..."
                    className="pl-9 bg-slate-950 border-slate-800 text-xs h-9 text-slate-200 placeholder:text-slate-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs h-9 text-slate-200">
                      <SelectValue placeholder="Cliente / Contratante" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="ALL">Todos os Clientes</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs h-9 text-slate-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="ALL">Todos os Status</SelectItem>
                      <SelectItem value="ATIVO">Apenas Ativos</SelectItem>
                      <SelectItem value="BLOQUEADO">Bloqueados / Demitidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Tabela de Colaboradores */}
            <Card className="bg-slate-900 border-slate-800 text-white overflow-hidden">
              <div className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-950/60 border-b border-slate-800">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableHead className="text-slate-400 text-xs">Matrícula</TableHead>
                          <TableHead className="text-slate-400 text-xs">Nome / Colaborador</TableHead>
                          <TableHead className="text-slate-400 text-xs">Cliente / Empresa</TableHead>
                          <TableHead className="text-slate-400 text-xs">CPF</TableHead>
                          <TableHead className="text-slate-400 text-xs text-center">Permissão de Rota</TableHead>
                          <TableHead className="text-slate-400 text-xs text-center">Status Acesso</TableHead>
                          <TableHead className="text-right text-slate-400 text-xs">Ações RH/DP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-800/60">
                        {filteredPassengers.map((passenger) => {
                          const isDemitido = passenger.status === 'DEMITIDO';
                          const isBloqueado = passenger.status === 'BLOQUEADO' || (!passenger.active && !isDemitido);

                          return (
                            <TableRow key={passenger.id} className="border-slate-800 hover:bg-slate-800/40">
                              <TableCell className="font-mono text-xs text-slate-300 font-bold">
                                {passenger.registration}
                              </TableCell>
                              <TableCell className="font-bold text-white text-xs">
                                {passenger.name}
                              </TableCell>
                              <TableCell className="text-xs text-slate-300">
                                {passenger.clientName || 'Cliente Padrão'}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-slate-400">
                                {passenger.cpf || '-'}
                              </TableCell>

                              {/* Botão de Alternar Múltiplas Linhas vs Linha Fixa */}
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleToggleMultipleRoutes(passenger)}
                                  title="Clique para alternar permissão de linhas"
                                  className={`text-[10px] font-bold h-7 px-2.5 rounded-lg border gap-1.5 ${
                                    passenger.multipleRoutesAllowed
                                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                  }`}
                                >
                                  {passenger.multipleRoutesAllowed ? (
                                    <>
                                      <ToggleRight className="h-4 w-4 text-cyan-400" /> Múltiplas Linhas
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="h-4 w-4 text-slate-500" /> Linha Fixa
                                    </>
                                  )}
                                </Button>
                              </TableCell>

                              {/* Badge de Status */}
                              <TableCell className="text-center">
                                {isDemitido ? (
                                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                                    DEMITIDO
                                  </Badge>
                                ) : isBloqueado ? (
                                  <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                    BLOQUEADO
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                    ATIVO
                                  </Badge>
                                )}
                              </TableCell>

                              {/* Ações */}
                              <TableCell className="text-right space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openHistory(passenger)}
                                  className="h-8 px-2 text-slate-400 hover:text-white text-xs"
                                >
                                  <History className="h-3.5 w-3.5 mr-1" /> Histórico
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEdit(passenger)}
                                  className="h-8 px-2 text-slate-400 hover:text-white text-xs"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                                </Button>

                                {isDemitido || isBloqueado ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPassengerToBlock(passenger);
                                      handleConfirmStatusChange('ATIVO');
                                    }}
                                    className="h-8 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                    title="Reativar acesso do colaborador"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Reativar
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPassengerToBlock(passenger);
                                      setBlockDialogOpen(true);
                                    }}
                                    className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                    title="Bloquear ou registrar demissão"
                                  >
                                    <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Bloquear / Demitir
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePassenger(passenger)}
                                  className="h-8 px-2 text-slate-500 hover:text-red-400 text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {filteredPassengers.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-28 text-center text-slate-500">
                              Nenhum passageiro encontrado para os critérios selecionados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4 bg-slate-900 border-slate-800 text-white flex items-center gap-4">
                <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Total de Passageiros</p>
                  <p className="text-2xl font-black">{passengers.length}</p>
                </div>
              </Card>

              <Card className="p-4 bg-slate-900 border-slate-800 text-white flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Acesso Ativo</p>
                  <p className="text-2xl font-black">
                    {passengers.filter((p) => p.status === 'ATIVO' || (p.active && !p.status)).length}
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-slate-900 border-slate-800 text-white flex items-center gap-4">
                <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Bloqueados / Demitidos</p>
                  <p className="text-2xl font-black">
                    {passengers.filter((p) => p.status === 'DEMITIDO' || p.status === 'BLOQUEADO' || !p.active).length}
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ---------------- Aba Histórico ---------------- */}
          <TabsContent value="historico" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <History className="h-5 w-5 text-cyan-400" /> Histórico Individual de Embarques
                </CardTitle>
                {historyPassenger && (
                  <CardDescription className="text-slate-400 text-xs">
                    Passageiro: <strong className="text-white">{historyPassenger.name}</strong> (Matrícula: {historyPassenger.registration})
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {!historyPassenger ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    Selecione um passageiro na aba Colaboradores e clique em "Histórico".
                  </p>
                ) : historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    Nenhum embarque registrado para este passageiro.
                  </p>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-950/60 border-b border-slate-800">
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-400 text-xs">Data / Hora</TableHead>
                        <TableHead className="text-slate-400 text-xs text-center">Sentido</TableHead>
                        <TableHead className="text-slate-400 text-xs text-center">Modo</TableHead>
                        <TableHead className="text-slate-400 text-xs text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-800/60">
                      {history.map((b) => (
                        <TableRow key={b.id} className="border-slate-800 hover:bg-slate-800/40">
                          <TableCell className="font-mono text-xs text-slate-300">
                            {b.boardingTime ? new Date(b.boardingTime).toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-blue-500/20 text-blue-300 text-[10px]">
                              {b.direction || 'IDA'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono text-[11px] text-slate-400">
                            {b.validationMode || 'QR CODE'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                              CONFIRMADO
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal CRUD de Passageiro */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-base">
              {editing ? 'Editar Colaborador / Passageiro' : 'Novo Colaborador'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Preencha os dados contratuais e permissões de transporte corporativo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Empresa Cliente / Contratante *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(v) => setFormData({ ...formData, clientId: v })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9">
                  <SelectValue placeholder="Selecione o Cliente" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Status do Cadastro</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="ATIVO">ATIVO (Permite Embarque)</SelectItem>
                  <SelectItem value="BLOQUEADO">BLOQUEADO (Acesso Suspenso)</SelectItem>
                  <SelectItem value="DEMITIDO">DEMITIDO (Bloqueio Total)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Matrícula do Funcionário *</Label>
              <Input
                value={formData.registration}
                onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                placeholder="Ex: FUN-1044"
                className="bg-slate-950 border-slate-800 text-slate-200 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Nome Completo *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do colaborador"
                className="bg-slate-950 border-slate-800 text-slate-200 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">CPF</Label>
              <Input
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="bg-slate-950 border-slate-800 text-slate-200 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Telefone / WhatsApp</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="bg-slate-950 border-slate-800 text-slate-200 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">E-mail Corporativo / Pessoal</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="colaborador@empresa.com.br"
                className="bg-slate-950 border-slate-800 text-slate-200 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Tipo de Passe</Label>
              <Select
                value={formData.passengerType}
                onValueChange={(v) => setFormData({ ...formData, passengerType: v })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  {TIPOS_PASSAGEIRO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Configuração de Múltiplas Linhas (Conforme Solicitado pelo Usuário) */}
            <div className="sm:col-span-2 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-white">
                <input
                  type="checkbox"
                  checked={formData.multipleRoutesAllowed}
                  onChange={(e) => setFormData({ ...formData, multipleRoutesAllowed: e.target.checked })}
                  className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
                Habilitar Múltiplas Linhas para este Colaborador
              </label>
              <p className="text-[11px] text-slate-400 pl-6">
                Por padrão desabilitado (mantém regra fixa de 1 check-in de Ida e 1 de Retorno). Se marcado, o passageiro tem permissão para embarcar em qualquer ônibus/linha deste cliente.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-800 pt-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-slate-700 text-slate-300 text-xs">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Salvar Cadastro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Bloqueio Imediato / Demissão */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-red-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5" /> Registrar Demissão / Bloqueio
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-xs">
              Ao confirmar a demissão ou bloqueio de <strong className="text-white">{passengerToBlock?.name}</strong>, o acesso ao login e a validação de QR Code no ônibus serão revogados imediatamente em toda a frota.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2 text-xs text-slate-300 bg-red-950/20 border border-red-500/20 rounded-xl p-3">
            <p>• O motorista receberá aviso visual vermelho sonoro caso o QR Code seja apresentado.</p>
            <p>• O passageiro não conseguirá mais autenticar no portal ou aplicativo.</p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)} className="border-slate-700 text-slate-300 text-xs">
              Cancelar
            </Button>
            <Button
              onClick={() => handleConfirmStatusChange('DEMITIDO')}
              disabled={blockActionLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
            >
              {blockActionLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Confirmar Demissão (Bloquear Imediato)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default PassengerManagement;
