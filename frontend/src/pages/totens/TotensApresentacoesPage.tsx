import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit3, 
  Play, 
  Send, 
  Copy, 
  Trash2, 
  Clock,
  RefreshCw,
  Tv,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles
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
import { KioskPresentation, KioskDevice } from '@/types/kiosk';

export const TotensApresentacoesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [presentations, setPresentations] = useState<KioskPresentation[]>([]);
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Nova Apresentação
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTimeout, setNewTimeout] = useState(60);
  const [creating, setCreating] = useState(false);

  // Modal Publicação
  const [publishPres, setPublishPres] = useState<KioskPresentation | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Modal Exclusão
  const [presToDelete, setPresToDelete] = useState<KioskPresentation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [presData, devsData] = await Promise.all([
        kioskService.getPresentations(),
        kioskService.getDevices().catch(() => [] as KioskDevice[]),
      ]);
      setPresentations(presData || []);
      setDevices(devsData || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar apresentações',
        description: err?.response?.data?.message || 'Falha ao buscar as apresentações.',
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

  const filteredPresentations = useMemo(() => {
    return presentations.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [presentations, searchTerm]);

  // Criar Apresentação
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Dê um nome para a apresentação.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const created = await kioskService.createPresentation({
        name: newTitle.trim(),
        description: newDesc.trim() || undefined,
        idleTimeoutSeconds: Number(newTimeout) || 60,
      });

      toast({
        title: 'Apresentação criada!',
        description: 'Redirecionando para o construtor visual de slides...',
      });

      setIsCreateOpen(false);
      navigate(`/totens/editor?id=${created.id}`);
    } catch (err: any) {
      toast({
        title: 'Erro ao criar apresentação',
        description: err?.response?.data?.message || 'Falha ao salvar a nova apresentação.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Abrir Modal de Publicação
  const handleOpenPublish = (pres: KioskPresentation) => {
    setPublishPres(pres);
    // Pré-seleciona todos os totens online por padrão
    setSelectedDeviceIds(devices.map((d) => d.id));
  };

  // Alternar Totem na seleção
  const toggleDeviceSelection = (deviceId: string) => {
    if (selectedDeviceIds.includes(deviceId)) {
      setSelectedDeviceIds(selectedDeviceIds.filter((id) => id !== deviceId));
    } else {
      setSelectedDeviceIds([...selectedDeviceIds, deviceId]);
    }
  };

  // Confirmar Publicação
  const handleConfirmPublish = async () => {
    if (!publishPres || selectedDeviceIds.length === 0) {
      toast({
        title: 'Selecione ao menos um totem',
        description: 'Escolha os equipamentos que receberão esta versão da apresentação.',
        variant: 'destructive',
      });
      return;
    }

    setPublishing(true);
    try {
      const pubs = await kioskService.publishPresentation(publishPres.id, selectedDeviceIds);
      toast({
        title: 'Publicação transmitida!',
        description: `Manifesto v${pubs[0]?.versionNumber || 'nova'} enviado com sucesso para ${pubs.length} totem(s).`,
      });
      setPublishPres(null);
      loadData(true);
    } catch (err: any) {
      toast({
        title: 'Erro ao publicar',
        description: err?.response?.data?.message || 'Não foi possível publicar nos totens selecionados.',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  // Excluir Apresentação
  const handleDelete = async () => {
    if (!presToDelete) return;
    setDeleting(true);
    try {
      // Implementação direta de delete
      await kioskService.updatePresentation(presToDelete.id, { status: 'ARCHIVED' });
      toast({
        title: 'Apresentação arquivada',
        description: `A apresentação ${presToDelete.name} foi arquivada.`,
      });
      setPresToDelete(null);
      loadData(true);
    } catch (err: any) {
      toast({
        title: 'Erro ao arquivar',
        description: err?.response?.data?.message || 'Falha ao processar solicitação.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <StandardLayout
      title="Apresentações & Slides"
      subtitle="Crie roteiros visuais interativos e transmita aos totens com versionamento imutável"
    >
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              Apresentações & Slides
            </h1>
            <p className="text-sm text-muted-foreground">
              Estruture sequências de slides com vídeos, imagens, botões de toque, mapas e rotas para seus totens.
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
              onClick={() => {
                setNewTitle('');
                setNewDesc('');
                setNewTimeout(60);
                setIsCreateOpen(true);
              }}
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-semibold"
            >
              <Plus className="h-4 w-4" />
              Nova Apresentação
            </Button>
          </div>
        </div>

        {/* Busca */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar apresentações por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-card border-border"
            />
          </div>
        </div>

        {/* Grid de Apresentações */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border-border bg-card/60 animate-pulse h-52">
                <CardContent className="p-0" />
              </Card>
            ))}
          </div>
        ) : filteredPresentations.length === 0 ? (
          <Card className="border-border bg-card/60">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                <Layers className="h-10 w-10" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-semibold text-foreground">
                  {presentations.length === 0 ? 'Nenhuma apresentação criada ainda' : 'Nenhuma apresentação encontrada'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {presentations.length === 0
                    ? 'Crie sua primeira apresentação e adicione vídeos, botões interativos e galerias de mídia.'
                    : 'Ajuste os filtros de busca para encontrar a apresentação desejada.'}
                </p>
              </div>
              {presentations.length === 0 && (
                <Button 
                  onClick={() => setIsCreateOpen(true)}
                  className="gap-2 bg-primary text-white rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeira Apresentação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPresentations.map((pres) => (
              <Card 
                key={pres.id} 
                className="group border-border bg-card hover:border-primary/50 transition-all duration-200 flex flex-col justify-between shadow-sm overflow-hidden"
              >
                <CardHeader className="p-5 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-foreground line-clamp-1">
                          {pres.name}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {pres.slidesCount || 0} slide(s) configurado(s)
                        </span>
                      </div>
                    </div>

                    <Badge 
                      variant="outline"
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        pres.status === 'PUBLISHED' 
                          ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                          : 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                      }`}
                    >
                      {pres.status === 'PUBLISHED' ? 'Publicada' : 'Rascunho'}
                    </Badge>
                  </div>

                  {pres.description && (
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                      {pres.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {/* Detalhes de Configuração */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Retorno ao Início (Idle):
                      </span>
                      <span className="font-medium text-foreground">
                        {pres.idleTimeoutSeconds}s sem toque
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Última Atualização:
                      </span>
                      <span className="font-medium text-foreground">
                        {new Date(pres.updatedAt || pres.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/50">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/totens/editor?id=${pres.id}`)}
                      className="gap-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs h-8"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Editar Slides
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPublish(pres)}
                        className="gap-1.5 rounded-xl text-xs h-8 border-border text-foreground hover:bg-primary/10 hover:text-primary"
                        title="Transmitir para totens"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Publicar
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPresToDelete(pres)}
                        className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                        title="Arquivar Apresentação"
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

      {/* Modal Criar Nova Apresentação */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Nova Apresentação para Totens
            </DialogTitle>
            <DialogDescription>
              Defina o nome inicial e o tempo de inatividade. Você poderá montar os slides em seguida.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Título da Apresentação *
              </label>
              <Input
                placeholder="Ex: Campanha Institucional 2026, Rotas Garagem..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Descrição / Objetivo
              </label>
              <Input
                placeholder="Ex: Exibição no hall de entrada e refeitório da empresa"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Tempo Limite de Inatividade (segundos)</span>
                <span className="text-[11px] text-muted-foreground">Retorna ao slide inicial</span>
              </label>
              <Input
                type="number"
                min="10"
                max="600"
                value={newTimeout}
                onChange={(e) => setNewTimeout(parseInt(e.target.value) || 60)}
                className="bg-background border-border"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={creating}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-primary text-white hover:bg-primary/90 rounded-xl"
              >
                {creating ? 'Criando...' : 'Criar e Abrir Editor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Publicação em Totens */}
      <Dialog open={!!publishPres} onOpenChange={(open) => !open && setPublishPres(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Transmitir Apresentação: {publishPres?.name}
            </DialogTitle>
            <DialogDescription>
              Selecione quais totens receberão esta atualização. Os totens online farão download do manifesto e dos vídeos em background.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Equipamentos Disponíveis ({devices.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedDeviceIds.length === devices.length) {
                    setSelectedDeviceIds([]);
                  } else {
                    setSelectedDeviceIds(devices.map((d) => d.id));
                  }
                }}
                className="text-xs h-7 text-primary hover:bg-primary/10"
              >
                {selectedDeviceIds.length === devices.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {devices.length === 0 ? (
                <div className="p-4 rounded-xl bg-muted/40 text-center text-xs text-muted-foreground">
                  Nenhum totem cadastrado ainda. Cadastre um equipamento na aba "Equipamentos & Totens".
                </div>
              ) : (
                devices.map((dev) => {
                  const isChecked = selectedDeviceIds.includes(dev.id);
                  return (
                    <div
                      key={dev.id}
                      onClick={() => toggleDeviceSelection(dev.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked 
                          ? 'border-primary/50 bg-primary/10' 
                          : 'border-border/60 bg-muted/30 hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${dev.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
                          <Tv className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{dev.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{dev.deviceCode} • {dev.orientation}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold ${dev.status === 'ONLINE' ? 'text-emerald-500' : 'text-zinc-400'}`}>
                          {dev.status}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 rounded-xl bg-background border border-border text-xs text-muted-foreground">
              ⚡ Ao confirmar, um manifesto imutável assinado com hash SHA-256 será gerado e enviado via WebSocket STOMP em tempo real.
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setPublishPres(null)}
              disabled={publishing}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPublish}
              disabled={publishing || selectedDeviceIds.length === 0}
              className="bg-primary text-white hover:bg-primary/90 rounded-xl"
            >
              {publishing ? 'Transmitindo...' : `Publicar em ${selectedDeviceIds.length} Totem(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default TotensApresentacoesPage;
