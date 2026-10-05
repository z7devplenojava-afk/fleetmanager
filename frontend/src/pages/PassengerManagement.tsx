import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { passengerService } from '@/services/passengerService';
import type { Passenger, Boarding } from '@/types/passenger';
import { useAuth } from '@/contexts/AuthContext';

const TIPOS_Passageiro = [
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
  costCenter: '',
};

const PassengerManagement: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
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

  // Histórico
  const [historyPassenger, setHistoryPassenger] = useState<Passenger | null>(null);
  const [history, setHistory] = useState<Boarding[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadPassengers = useCallback(async () => {
    if (!user?.companyId) return;

    setIsLoading(true);
    try {
      const data = await passengerService.getActivePassengers(user.companyId);
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
    loadPassengers();
  }, [loadPassengers]);

  const filteredPassengers = passengers.filter(
    (passenger) =>
      passenger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passenger.registration.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        active: formData.active,
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
        description: `Passageiro ${editing ? 'atualizado' : 'criado'} com sucesso.`,
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
    <StandardLayout title="Gerenciamento de Passageiros">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Passageiros</h1>
            <p className="text-muted-foreground">Controle de passageiros, embarques e desembarques</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadPassengers} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Passageiro
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dados">
              <Users className="mr-2 h-4 w-4" /> Dados
            </TabsTrigger>
            <TabsTrigger value="historico">
              <History className="mr-2 h-4 w-4" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="importar">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar Planilha
            </TabsTrigger>
          </TabsList>

          {/* ---------------- Aba Dados ---------------- */}
          <TabsContent value="dados" className="space-y-6">
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou matrícula..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Card>

            <Card>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPassengers.map((passenger) => (
                        <TableRow key={passenger.id}>
                          <TableCell className="font-medium">{passenger.registration}</TableCell>
                          <TableCell>{passenger.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {TIPOS_Passageiro.find((t) => t.value === passenger.passengerType)?.label ||
                                passenger.passengerType ||
                                'Comum'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex flex-col gap-0.5">
                              {passenger.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {passenger.phone}
                                </span>
                              )}
                              {passenger.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {passenger.email}
                                </span>
                              )}
                              {!(passenger.phone || passenger.email) && '-'}
                            </div>
                          </TableCell>
                          <TableCell>{passenger.shift || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={passenger.active ? 'default' : 'secondary'}>
                              {passenger.active ? (
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                              ) : (
                                <XCircle className="mr-1 h-3 w-3" />
                              )}
                              {passenger.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openHistory(passenger)}>
                              <History className="mr-1 h-3.5 w-3.5" /> Histórico
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(passenger)}>
                              <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredPassengers.length === 0 && !isLoading && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Nenhum passageiro encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Passageiros</p>
                    <p className="text-2xl font-bold">{passengers.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                    <p className="text-2xl font-bold">{passengers.filter((p) => p.active).length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inativos</p>
                    <p className="text-2xl font-bold">{passengers.filter((p) => !p.active).length}</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ---------------- Aba Histórico ---------------- */}
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" /> Histórico de Embarques
                </CardTitle>
                {historyPassenger && (
                  <p className="text-sm text-muted-foreground">
                    Passageiro: <strong>{historyPassenger.name}</strong> ({historyPassenger.registration})
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {!historyPassenger ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Selecione um passageiro na aba Dados e clique em "Histórico".
                  </p>
                ) : historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhum embarque registrado para este passageiro.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Viagem</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono text-xs">{b.tripId}</TableCell>
                          <TableCell>
                            {b.boardingTime ? new Date(b.boardingTime).toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={b.status === 'BOARDED' ? 'default' : 'secondary'}>{b.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- Aba Importar ---------------- */}
          <TabsContent value="importar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" /> Importar Planilha de Passageiros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  A importação em lote de passageiros via planilha (CSV/XLSX) estará disponível em uma
                  próxima fase.
                </p>
                <Button disabled>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Importar Planilha (disponível em breve)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal CRUD */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Passageiro' : 'Novo Passageiro'}</DialogTitle>
            <DialogDescription>
              Preencha os dados cadastrais do passageiro.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="registration">Matrícula *</Label>
              <Input
                id="registration"
                value={formData.registration}
                onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pax-name">Nome completo *</Label>
              <Input
                id="pax-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pax-cpf">CPF / Identificador</Label>
              <Input
                id="pax-cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pax-phone">Telefone</Label>
              <Input
                id="pax-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pax-email">E-mail</Label>
              <Input
                id="pax-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.passengerType}
                onValueChange={(v) => setFormData({ ...formData, passengerType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_Passageiro.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pax-shift">Turno</Label>
              <Select value={formData.shift} onValueChange={(v) => setFormData({ ...formData, shift: v })}>
                <SelectTrigger id="pax-shift">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANHA">Manhã</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOITE">Noite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pax-time">Horário preferencial</Label>
              <Input
                id="pax-time"
                type="time"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pax-cost">Centro de custo</Label>
              <Input
                id="pax-cost"
                value={formData.costCenter}
                onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.active ? 'ATIVO' : 'INATIVO'}
                onValueChange={(v) => setFormData({ ...formData, active: v === 'ATIVO' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notificationsEnabled}
                  onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                  className="h-4 w-4"
                />
                Receber notificações de embarque
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default PassengerManagement;
