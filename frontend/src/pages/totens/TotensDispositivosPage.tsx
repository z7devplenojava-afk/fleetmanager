import React, { useState, useEffect, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  Tv, 
  Plus, 
  QrCode, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  Activity, 
  Smartphone, 
  Monitor,
  Building2,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Wifi,
  WifiOff,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { kioskService } from '@/services/kioskService';
import { clientService, Client } from '@/services/clientService';
import { 
  KioskDevice, 
  KioskDeviceStatus, 
  KioskPlatform, 
  KioskOrientation, 
  KioskPairingCodeResponse 
} from '@/types/kiosk';

export const TotensDispositivosPage: React.FC = () => {
  const { toast } = useToast();

  // Estados principais
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  // Modal Cadastro / Edição
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<KioskDevice | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    platform: 'ANDROID' as KioskPlatform,
    orientation: 'LANDSCAPE' as KioskOrientation,
    resolutionWidth: 1920,
    resolutionHeight: 1080,
  });
  const [submittingForm, setSubmittingForm] = useState(false);

  // Modal Pareamento
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [pairingData, setPairingData] = useState<KioskPairingCodeResponse | null>(null);
  const [selectedDeviceForPairing, setSelectedDeviceForPairing] = useState<KioskDevice | null>(null);
  const [loadingPairing, setLoadingPairing] = useState(false);

  // Modal Confirmação de Exclusão
  const [deviceToDelete, setDeviceToDelete] = useState<KioskDevice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar dados
  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [devicesRes, clientsRes] = await Promise.all([
        kioskService.getDevices(),
        clientService.getAllClients().catch(() => [] as Client[]),
      ]);
      setDevices(devicesRes || []);
      setClients(clientsRes || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar totens',
        description: err?.response?.data?.message || 'Falha ao buscar os dispositivos cadastrados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Métricas
  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter((d) => d.status === 'ONLINE').length;
    const offline = devices.filter((d) => d.status === 'OFFLINE').length;
    const pending = devices.filter((d) => d.status === 'PENDING_PAIRING').length;
    return { total, online, offline, pending };
  }, [devices]);

  // Filtragem
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        !searchTerm ||
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.deviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.clientName && device.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || device.status === statusFilter;
      const matchesClient =
        clientFilter === 'ALL' ||
        (clientFilter === 'NONE' ? !device.clientId : device.clientId === clientFilter);

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [devices, searchTerm, statusFilter, clientFilter]);

  // Abertura do modal de criação
  const handleOpenCreateModal = () => {
    setEditingDevice(null);
    setFormData({
      name: '',
      description: '',
      clientId: '',
      platform: 'ANDROID',
      orientation: 'LANDSCAPE',
      resolutionWidth: 1920,
      resolutionHeight: 1080,
    });
    setIsFormOpen(true);
  };

  // Abertura do modal de edição
  const handleOpenEditModal = (device: KioskDevice) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      description: device.description || '',
      clientId: device.clientId || '',
      platform: device.platform || 'ANDROID',
      orientation: device.orientation || 'LANDSCAPE',
      resolutionWidth: device.resolutionWidth || 1920,
      resolutionHeight: device.resolutionHeight || 1080,
    });
    setIsFormOpen(true);
  };

  // Salvar Totem (Criar ou Atualizar)
  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe um nome identificador para o totem.',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingForm(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        clientId: formData.clientId ? formData.clientId : null,
        platform: formData.platform,
        orientation: formData.orientation,
        resolutionWidth: Number(formData.resolutionWidth) || 1920,
        resolutionHeight: Number(formData.resolutionHeight) || 1080,
      };

      if (editingDevice) {
        await kioskService.updateDevice(editingDevice.id, payload);
        toast({
          title: 'Totem atualizado',
          description: `O equipamento ${formData.name} foi atualizado com sucesso.`,
        });
      } else {
        const created = await kioskService.createDevice(payload);
        toast({
          title: 'Totem cadastrado',
          description: `Totem ${created.name} registrado com o código ${created.deviceCode}.`,
        });
        // Já abre pareamento automaticamente
        handleOpenPairingModal(created);
      }

      setIsFormOpen(false);
      loadData(true);
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar totem',
        description: err?.response?.data?.message || 'Ocorreu um erro ao salvar o equipamento.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingForm(false);
    }
  };

  // Modal de pareamento
  const handleOpenPairingModal = async (device: KioskDevice) => {
    setSelectedDeviceForPairing(device);
    setIsPairingOpen(true);
    setLoadingPairing(true);
    try {
      const codeResp = await kioskService.generatePairingCode(device.id);
      setPairingData(codeResp);
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar código',
        description: err?.response?.data?.message || 'Não foi possível gerar o código de ativação.',
        variant: 'destructive',
      });
      setIsPairingOpen(false);
    } finally {
      setLoadingPairing(false);
    }
  };

  // Copiar PIN
  const handleCopyPin = () => {
    if (pairingData?.pairingCode) {
      navigator.clipboard.writeText(pairingData.pairingCode);
      toast({
        title: 'PIN copiado!',
        description: 'Código de pareamento copiado para a área de transferência.',
      });
    }
  };

  // Revogar acesso
  const handleRevokeDevice = async (device: KioskDevice) => {
    if (!window.confirm(`Tem certeza que deseja revogar o acesso do totem "${device.name}"? O dispositivo será desconectado imediatamente.`)) {
      return;
    }

    try {
      await kioskService.revokeDevice(device.id);
      toast({
        title: 'Acesso revogado',
        description: `O totem ${device.name} foi desconectado e precisará ser pareado novamente.`,
      });
      loadData(true);
    } catch (err: any) {
      toast({
        title: 'Erro ao revogar',
        description: err?.response?.data?.message || 'Falha ao revogar credenciais do totem.',
        variant: 'destructive',
      });
    }
  };

  // Excluir Totem
  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    setIsDeleting(true);
    try {
      await kioskService.deleteDevice(deviceToDelete.id);
      toast({
        title: 'Totem excluído',
        description: `O totem ${deviceToDelete.name} foi removido com sucesso.`,
      });
      setDeviceToDelete(null);
      loadData(true);
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir totem',
        description: err?.response?.data?.message || 'Não foi possível excluir este equipamento.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Formatação de data relativa
  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return 'Nunca conectado';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return `Há ${diffSec}s`;
    if (diffSec < 3600) return `Há ${Math.floor(diffSec / 60)}m`;
    if (diffSec < 86400) return `Há ${Math.floor(diffSec / 3600)}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // Badge de Status
  const renderStatusBadge = (status: KioskDeviceStatus) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        );
      case 'PENDING_PAIRING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            Aguardando Pareamento
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <ShieldAlert className="h-3 w-3" />
            Revogado
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <WifiOff className="h-3 w-3" />
            Offline
          </span>
        );
    }
  };

  return (
    <StandardLayout
      title="Equipamentos & Totens"
      subtitle="Cadastro, pareamento por PIN/QR Code e monitoramento em tempo real dos totens da empresa e clientes"
    >
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Tv className="h-6 w-6 text-primary" />
              Equipamentos & Totens
            </h1>
            <p className="text-sm text-muted-foreground">
              Cadastre totens vinculados à sua empresa ou a clientes específicos, acompanhe telemetria e emita credenciais.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="gap-2 rounded-xl border-border hover:bg-card"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              onClick={handleOpenCreateModal}
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md"
            >
              <Plus className="h-4 w-4" />
              Cadastrar Novo Totem
            </Button>
          </div>
        </div>

        {/* Métricas Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total de Totens</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{stats.total}</h3>
              </div>
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Tv className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Totens Online</p>
                <h3 className="text-2xl font-bold text-emerald-500 mt-1">{stats.online}</h3>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Wifi className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Aguardando Ativação</p>
                <h3 className="text-2xl font-bold text-amber-500 mt-1">{stats.pending}</h3>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                <QrCode className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Totens Offline</p>
                <h3 className="text-2xl font-bold text-zinc-400 mt-1">{stats.offline}</h3>
              </div>
              <div className="p-2.5 bg-zinc-500/10 text-zinc-400 rounded-xl">
                <WifiOff className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome do totem, código ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-card border-border"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filtro Status */}
            <select
              aria-label="Filtrar por status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ONLINE">Online</option>
              <option value="PENDING_PAIRING">Aguardando Pareamento</option>
              <option value="OFFLINE">Offline</option>
              <option value="REVOKED">Revogados</option>
            </select>

            {/* Filtro Cliente */}
            {clients.length > 0 && (
              <select
                aria-label="Filtrar por cliente"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px]"
              >
                <option value="ALL">Todos os Clientes</option>
                <option value="NONE">Apenas da Empresa (Sem Cliente)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Conteúdo Principal / Grid de Totens */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border-border bg-card/60 animate-pulse h-48">
                <CardContent className="p-6" />
              </Card>
            ))}
          </div>
        ) : filteredDevices.length === 0 ? (
          <Card className="border-border bg-card/60">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                <Tv className="h-10 w-10" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-semibold text-foreground">
                  {devices.length === 0 ? 'Nenhum totem cadastrado ainda' : 'Nenhum totem encontrado'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {devices.length === 0
                    ? 'Cadastre o primeiro equipamento para gerar o código de ativação por QR Code ou PIN.'
                    : 'Tente alterar os filtros de busca para encontrar o totem desejado.'}
                </p>
              </div>
              {devices.length === 0 && (
                <Button onClick={handleOpenCreateModal} className="gap-2 bg-primary text-white rounded-xl">
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Totem
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDevices.map((device) => (
              <Card 
                key={device.id} 
                className="border-border bg-card hover:border-primary/40 transition-all duration-200 shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Tv className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-foreground line-clamp-1">
                          {device.name}
                        </CardTitle>
                        <span className="text-xs font-mono text-muted-foreground font-medium">
                          {device.deviceCode}
                        </span>
                      </div>
                    </div>
                    {renderStatusBadge(device.status)}
                  </div>

                  {device.description && (
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                      {device.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {/* Informações de Vinculação & Hardware */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        Cliente:
                      </span>
                      <span className="font-medium text-foreground">
                        {device.clientName ? device.clientName : 'Uso Próprio (Empresa)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5" />
                        Plataforma & Modo:
                      </span>
                      <span className="font-medium text-foreground">
                        {device.platform} • {device.orientation === 'PORTRAIT' ? 'Retrato' : 'Paisagem'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        Último Sinal:
                      </span>
                      <span className="font-medium text-foreground">
                        {formatLastSeen(device.lastHeartbeatAt)}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPairingModal(device)}
                        className="h-8 gap-1.5 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                        title="Ver Código PIN / QR Code de Pareamento"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        Pareamento
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(device)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                        title="Editar Totem"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      {device.status === 'ONLINE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeDevice(device)}
                          className="h-8 px-2 text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg"
                          title="Revogar credencial"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeviceToDelete(device)}
                        className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                        title="Excluir Totem"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição de Totem */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5 text-primary" />
              {editingDevice ? 'Editar Equipamento' : 'Cadastrar Novo Totem'}
            </DialogTitle>
            <DialogDescription>
              {editingDevice
                ? 'Atualize os dados e vínculos deste equipamento.'
                : 'Defina os dados do novo totem. Após cadastrar, o código de pareamento será gerado.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDevice} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nome do Totem *
              </label>
              <Input
                placeholder="Ex: Totem Entrada Matriz, Kiosk Hall Sul..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Descrição / Localização
              </label>
              <Input
                placeholder="Ex: Térreo próximo à catraca de funcionários"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            {/* Vínculo de Cliente */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Cliente Proprietário / Local (Opcional)</span>
                <span className="text-[11px] text-muted-foreground">Deixe em branco se for da própria empresa</span>
              </label>
              <select
                aria-label="Cliente Proprietário / Local"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Nenhum (Totem Próprio da Empresa)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.cnpj ? `(${c.cnpj})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Plataforma & Orientação */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Plataforma
                </label>
                <select
                  aria-label="Plataforma do totem"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as KioskPlatform })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ANDROID">Android (Smart TV / Tablet)</option>
                  <option value="WINDOWS">Windows (Mini PC / Totem)</option>
                  <option value="WEB">Web Browser / PWA</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Orientação da Tela
                </label>
                <select
                  aria-label="Orientação da tela"
                  value={formData.orientation}
                  onChange={(e) => setFormData({ ...formData, orientation: e.target.value as KioskOrientation })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="LANDSCAPE">Paisagem (Horizontal - 16:9)</option>
                  <option value="PORTRAIT">Retrato (Vertical - 9:16)</option>
                </select>
              </div>
            </div>

            {/* Resolução */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Largura (px)
                </label>
                <Input
                  type="number"
                  value={formData.resolutionWidth}
                  onChange={(e) => setFormData({ ...formData, resolutionWidth: parseInt(e.target.value) || 1920 })}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Altura (px)
                </label>
                <Input
                  type="number"
                  value={formData.resolutionHeight}
                  onChange={(e) => setFormData({ ...formData, resolutionHeight: parseInt(e.target.value) || 1080 })}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={submittingForm}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submittingForm}
                className="bg-primary text-white hover:bg-primary/90 rounded-xl"
              >
                {submittingForm ? 'Salvando...' : editingDevice ? 'Salvar Alterações' : 'Cadastrar Totem'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Pareamento com PIN & QR Code */}
      <Dialog open={isPairingOpen} onOpenChange={setIsPairingOpen}>
        <DialogContent className="max-w-md bg-card border-border text-center">
          <DialogHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl mb-1">
              <QrCode className="h-8 w-8" />
            </div>
            <DialogTitle className="text-lg">
              Parear Totem: {selectedDeviceForPairing?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Código do Totem: <span className="font-mono font-bold text-foreground">{selectedDeviceForPairing?.deviceCode}</span>
            </DialogDescription>
          </DialogHeader>

          {loadingPairing ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Gerando código e QR Code de ativação...</p>
            </div>
          ) : pairingData ? (
            <div className="space-y-5 py-2">
              {/* Código PIN em Destaque */}
              <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 flex flex-col items-center justify-center space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Código PIN de Ativação
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-mono font-black tracking-widest text-primary">
                    {pairingData.pairingCode}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPin}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                    title="Copiar Código"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Válido por 15 minutos
                </p>
              </div>

              {/* QR Code */}
              {pairingData.qrCodeDataUrl ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-zinc-200 inline-block">
                    <img 
                      src={pairingData.qrCodeDataUrl} 
                      alt="QR Code de Pareamento" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Aponte a câmera do aplicativo Player para parear
                  </span>
                </div>
              ) : null}

              {/* Passo a Passo */}
              <div className="text-left p-3.5 rounded-xl bg-background border border-border/70 text-xs space-y-2">
                <p className="font-semibold text-foreground">Como ativar este Totem:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>No totem, abra o aplicativo ou acesse a tela do Player.</li>
                  <li>Digite o código PIN acima ou escaneie o QR Code.</li>
                  <li>O totem será autenticado e sincronizará as apresentações automaticamente.</li>
                </ol>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedDeviceForPairing && handleOpenPairingModal(selectedDeviceForPairing)}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Gerar Novo Código
                </Button>
                <Button
                  onClick={() => setIsPairingOpen(false)}
                  className="bg-primary text-white rounded-xl text-xs"
                >
                  Concluir
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              Excluir Totem
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir permanentemente o totem{' '}
              <strong className="text-foreground">{deviceToDelete?.name}</strong>?
              Esta ação revogará todas as credenciais ativas e desvinculará as publicações do equipamento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setDeviceToDelete(null)}
              disabled={isDeleting}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteDevice}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default TotensDispositivosPage;
