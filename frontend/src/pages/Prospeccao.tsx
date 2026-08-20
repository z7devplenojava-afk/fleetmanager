import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
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
import prospectingService, {
  ProspectingLead,
  ProspectingSearchFilters,
  ProspectingStats,
} from '@/services/prospectingService';
import {
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  Star,
  Users,
  Send,
  Zap,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  MapPin,
  CreditCard,
  Briefcase,
  ShoppingCart,
  BarChart3,
  CheckSquare,
  Square,
  Download,
  Sparkles,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────
function parsePartners(json?: string): Array<{ name: string; role: string }> {
  return prospectingService.parsePartnerNames(json);
}

function parsePurchasing(json?: string): { name?: string; department?: string; phone?: string; email?: string } | null {
  return prospectingService.parsePurchasingContacts(json);
}

// ── Component ────────────────────────────────────────────────
export default function Prospeccao() {
  const { toast } = useToast();

  // ── State ─────────────────────────────────────────────────
  const [leads, setLeads] = useState<ProspectingLead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<ProspectingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [detailLead, setDetailLead] = useState<ProspectingLead | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Filters
  const [activity, setActivity] = useState('');
  const [city, setCity] = useState('');
  const [cnae, setCnae] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [description, setDescription] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── Load ──────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const s = await prospectingService.getStats();
      setStats(s);
    } catch {
      // ignorable
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [all, s] = await Promise.all([
        prospectingService.findAll(),
        prospectingService.getStats(),
      ]);
      setLeads(all);
      setStats(s);
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Não foi possível carregar os dados.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Search ────────────────────────────────────────────────
  const handleSearch = async () => {
    const hasFilter = activity || city || cnae || cnpj || description;
    if (!hasFilter) {
      toast({ title: 'Atenção', description: 'Preencha ao menos um filtro para buscar.', variant: 'destructive' });
      return;
    }
    setSearchLoading(true);
    try {
      const filters: ProspectingSearchFilters = {
        activity: activity || undefined,
        city: city || undefined,
        cnae: cnae || undefined,
        cnpj: cnpj || undefined,
        description: description || undefined,
        searchTerm: `${activity || ''} ${city || ''} ${cnae || ''}`.trim(),
      };
      const results = await prospectingService.search(filters);
      setLeads((prev) => {
        const existingIds = new Set(prev.map((l) => l.id));
        const newLeads = results.filter((r) => !existingIds.has(r.id));
        return [...newLeads, ...prev];
      });
      await loadStats();
      toast({
        title: 'Busca concluída',
        description: `${results.length} empresas encontradas.`,
      });
    } catch (err: any) {
      toast({ title: 'Erro na busca', description: err.message || 'Falha ao buscar.', variant: 'destructive' });
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────
  const handleEnrich = async (id: string) => {
    try {
      const enriched = await prospectingService.enrich(id);
      setLeads((prev) => prev.map((l) => (l.id === id ? enriched : l)));
      await loadStats();
      toast({ title: 'Enriquecido', description: 'Lead enriquecido com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao enriquecer.', variant: 'destructive' });
    }
  };

  const handleQualify = async (id: string) => {
    try {
      const qualified = await prospectingService.qualify(id);
      setLeads((prev) => prev.map((l) => (l.id === id ? qualified : l)));
      await loadStats();
      toast({ title: 'Qualificado', description: `Score: ${qualified.qualificationScore}/100` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao qualificar.', variant: 'destructive' });
    }
  };

  const handleSendToKanban = async (id: string) => {
    try {
      const sent = await prospectingService.sendToKanban(id);
      setLeads((prev) => prev.map((l) => (l.id === id ? sent : l)));
      await loadStats();
      toast({ title: 'Enviado ao Kanban', description: 'Lead criado no CRM com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao enviar.', variant: 'destructive' });
    }
  };

  const handleSendSelected = async () => {
    if (selected.size === 0) return;
    try {
      const ids = Array.from(selected);
      const results = await prospectingService.sendMultipleToKanban(ids);
      const sentIds = new Set(results.map((r) => r.id));
      setLeads((prev) =>
        prev.map((l) => (sentIds.has(l.id) ? results.find((r) => r.id === l.id) || l : l))
      );
      setSelected(new Set());
      await loadStats();
      toast({ title: 'Enviados ao Kanban', description: `${results.length} leads enviados.` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao enviar.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await prospectingService.delete(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      await loadStats();
      toast({ title: 'Excluído', description: 'Lead excluído.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao excluir.', variant: 'destructive' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filtered = filteredLeads;
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  };

  // ── Filtered leads ────────────────────────────────────────
  const filteredLeads = leads.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    return true;
  });

  // ── Stats cards ───────────────────────────────────────────
  const statCards = [
    { label: 'Total', value: stats?.total || 0, icon: BarChart3, color: 'text-blue-400' },
    { label: 'Encontrados', value: stats?.found || 0, icon: Search, color: 'text-cyan-400' },
    { label: 'Enriquecidos', value: stats?.enriched || 0, icon: Sparkles, color: 'text-yellow-400' },
    { label: 'Qualificados', value: stats?.qualified || 0, icon: CheckCircle, color: 'text-green-400' },
    { label: 'No Kanban', value: stats?.sentToKanban || 0, icon: Send, color: 'text-purple-400' },
    { label: 'Descartados', value: stats?.discarded || 0, icon: XCircle, color: 'text-gray-400' },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <StandardLayout title="Prospecção de Leads">
      <div className="space-y-6 w-full min-w-0">
        {/* ── Stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-6 w-6 ${s.color} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Search Form ─────────────────────────────────── */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-seguranca-yellow" />
              <h3 className="text-sm font-semibold text-seguranca-lightgray">Buscar Empresas</h3>
              <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-600 ml-auto">
                Agent de Prospecção
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Atividade</Label>
                <Input
                  placeholder="Ex: Vigilância patrimonial, Portaria..."
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Cidade</Label>
                <Input
                  placeholder="Ex: São Paulo, Belo Horizonte..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">CNAE</Label>
                <Input
                  placeholder="Ex: 8020-1-00"
                  value={cnae}
                  onChange={(e) => setCnae(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">CNPJ</Label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-9 text-sm"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-gray-400">Descrição / Palavra-chave</Label>
                <Input
                  placeholder="Buscar por nome, descrição, atividade..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSearch}
                disabled={searchLoading}
                className="bg-seguranca-yellow text-black hover:bg-yellow-500 h-9"
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Buscar com Agent
              </Button>
              <Button
                variant="outline"
                onClick={() => { setActivity(''); setCity(''); setCnae(''); setCnpj(''); setDescription(''); }}
                className="border-gray-600 text-seguranca-lightgray h-9"
              >
                Limpar Filtros
              </Button>
              <Button
                variant="outline"
                onClick={loadAll}
                className="border-gray-600 text-seguranca-lightgray h-9 ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Toolbar ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray h-9 text-sm">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="FOUND">Encontrados</SelectItem>
              <SelectItem value="ENRICHED">Enriquecidos</SelectItem>
              <SelectItem value="QUALIFIED">Qualificados</SelectItem>
              <SelectItem value="SENT_TO_KANBAN">No Kanban</SelectItem>
              <SelectItem value="DISCARDED">Descartados</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="border-gray-600 text-seguranca-lightgray h-8"
            >
              {selected.size === filteredLeads.length ? (
                <CheckSquare className="h-4 w-4 mr-1" />
              ) : (
                <Square className="h-4 w-4 mr-1" />
              )}
              {selected.size > 0 ? `${selected.size} selecionados` : 'Selecionar todos'}
            </Button>
            {selected.size > 0 && (
              <Button
                size="sm"
                onClick={handleSendSelected}
                className="bg-seguranca-yellow text-black hover:bg-yellow-500 h-8"
              >
                <Send className="h-4 w-4 mr-1" /> Enviar ao Kanban
              </Button>
            )}
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
            <span className="ml-3 text-seguranca-lightgray">Carregando...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum lead encontrado.</p>
              <p className="text-sm text-gray-500 mt-1">Use o formulário acima para buscar empresas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <ProspectingCard
                key={lead.id}
                lead={lead}
                selected={selected.has(lead.id)}
                onToggleSelect={() => toggleSelect(lead.id)}
                onEnrich={() => handleEnrich(lead.id)}
                onQualify={() => handleQualify(lead.id)}
                onSendToKanban={() => handleSendToKanban(lead.id)}
                onView={() => { setDetailLead(lead); setShowDetail(true); }}
                onDelete={() => handleDelete(lead.id)}
              />
            ))}
          </div>
        )}

        {/* ── Detail Dialog ───────────────────────────────── */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
            {detailLead && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-seguranca-lightgray text-lg">
                    {detailLead.tradeName || detailLead.companyName || 'Empresa'}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {/* Dados da empresa */}
                  <div className="grid grid-cols-2 gap-3">
                    {detailLead.cnpj && (
                      <InfoItem icon={CreditCard} label="CNPJ" value={detailLead.cnpj} />
                    )}
                    {detailLead.cnae && (
                      <InfoItem icon={Briefcase} label="CNAE" value={`${detailLead.cnae} - ${detailLead.cnaeDescription || ''}`} />
                    )}
                    {detailLead.city && (
                      <InfoItem icon={MapPin} label="Cidade" value={`${detailLead.city}/${detailLead.state}`} />
                    )}
                    {detailLead.address && (
                      <InfoItem icon={MapPin} label="Endereço" value={detailLead.address} />
                    )}
                    {detailLead.neighborhood && (
                      <InfoItem icon={MapPin} label="Bairro" value={detailLead.neighborhood} />
                    )}
                    {detailLead.cep && (
                      <InfoItem icon={MapPin} label="CEP" value={detailLead.cep} />
                    )}
                  </div>

                  {/* Contato */}
                  <div>
                    <h4 className="text-sm font-semibold text-seguranca-yellow mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Contato
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {detailLead.phone && <InfoItem icon={Phone} label="Telefone" value={detailLead.phone} />}
                      {detailLead.whatsapp && <InfoItem icon={MessageCircle} label="WhatsApp" value={detailLead.whatsapp} />}
                      {detailLead.email && <InfoItem icon={Mail} label="Email" value={detailLead.email} />}
                      {detailLead.website && <InfoItem icon={Globe} label="Website" value={detailLead.website} />}
                    </div>
                  </div>

                  {/* Sócios / Decisores */}
                  {detailLead.partnerNames && (
                    <div>
                      <h4 className="text-sm font-semibold text-seguranca-yellow mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Sócios / Decisores
                      </h4>
                      <div className="space-y-1">
                        {parsePartners(detailLead.partnerNames).map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-seguranca-lightgray">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="font-medium">{p.name}</span>
                            {p.role && <span className="text-gray-400">— {p.role}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compras */}
                  {detailLead.purchasingContacts && (() => {
                    const p = parsePurchasing(detailLead.purchasingContacts);
                    return p ? (
                      <div>
                        <h4 className="text-sm font-semibold text-seguranca-yellow mb-2 flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" /> Contato de Compras
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {p.name && <InfoItem icon={Users} label="Responsável" value={p.name} />}
                          {p.department && <InfoItem icon={Briefcase} label="Departamento" value={p.department} />}
                          {p.phone && <InfoItem icon={Phone} label="Telefone" value={p.phone} />}
                          {p.email && <InfoItem icon={Mail} label="Email" value={p.email} />}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Google */}
                  {(detailLead.googleRating || detailLead.googleReviews) && (
                    <div>
                      <h4 className="text-sm font-semibold text-seguranca-yellow mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4" /> Google Maps
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-seguranca-lightgray">
                        {detailLead.googleRating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            {detailLead.googleRating}
                          </span>
                        )}
                        {detailLead.googleReviews && (
                          <span className="text-gray-400">{detailLead.googleReviews} avaliações</span>
                        )}
                        {detailLead.source && (
                          <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-600">
                            {detailLead.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Qualificação */}
                  {detailLead.qualificationScore != null && (
                    <div>
                      <h4 className="text-sm font-semibold text-seguranca-yellow mb-2">Qualificação</h4>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-32 h-2 bg-seguranca-black rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              detailLead.qualificationScore >= 70
                                ? 'bg-green-500'
                                : detailLead.qualificationScore >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${detailLead.qualificationScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-seguranca-lightgray">
                          {detailLead.qualificationScore}/100
                        </span>
                      </div>
                      {detailLead.qualificationNotes && (
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap bg-seguranca-black rounded p-2">
                          {detailLead.qualificationNotes}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-600">
                    {detailLead.status !== 'SENT_TO_KANBAN' && detailLead.status !== 'QUALIFIED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { handleEnrich(detailLead.id); }}
                        className="border-gray-600 text-seguranca-lightgray"
                      >
                        <Sparkles className="h-4 w-4 mr-1" /> Enriquecer
                      </Button>
                    )}
                    {detailLead.status !== 'SENT_TO_KANBAN' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { handleQualify(detailLead.id); }}
                        className="border-gray-600 text-seguranca-lightgray"
                      >
                        <Zap className="h-4 w-4 mr-1" /> Qualificar
                      </Button>
                    )}
                    {(detailLead.status === 'QUALIFIED' || detailLead.status === 'ENRICHED') && (
                      <Button
                        size="sm"
                        onClick={() => { handleSendToKanban(detailLead.id); setShowDetail(false); }}
                        className="bg-seguranca-yellow text-black hover:bg-yellow-500"
                      >
                        <Send className="h-4 w-4 mr-1" /> Enviar ao Kanban
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
}

// ── Sub-components ───────────────────────────────────────────

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
        <p className="text-sm text-seguranca-lightgray leading-snug break-all">{value}</p>
      </div>
    </div>
  );
}

function ProspectingCard({
  lead,
  selected,
  onToggleSelect,
  onEnrich,
  onQualify,
  onSendToKanban,
  onView,
  onDelete,
}: {
  lead: ProspectingLead;
  selected: boolean;
  onToggleSelect: () => void;
  onEnrich: () => void;
  onQualify: () => void;
  onSendToKanban: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const partners = parsePartners(lead.partnerNames);
  const purchasing = parsePurchasing(lead.purchasingContacts);

  const statusColor = prospectingService.getStatusColor(lead.status);
  const statusLabel = prospectingService.getStatusLabel(lead.status);

  return (
    <Card className={`bg-seguranca-graphite border-gray-600 hover:border-seguranca-yellow/50 transition-colors ${selected ? 'ring-2 ring-seguranca-yellow' : ''}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <button onClick={onToggleSelect} className="mt-0.5 shrink-0">
            {selected ? (
              <CheckSquare className="h-4 w-4 text-seguranca-yellow" />
            ) : (
              <Square className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-seguranca-lightgray text-sm truncate">
              {lead.tradeName || lead.companyName || 'Empresa'}
            </h4>
            {lead.companyName && lead.tradeName && lead.companyName !== lead.tradeName && (
              <p className="text-[11px] text-gray-400 truncate">{lead.companyName}</p>
            )}
          </div>
          <Badge className={`${statusColor} text-white text-[10px] shrink-0`}>{statusLabel}</Badge>
        </div>

        {/* CNAE / Atividade */}
        {(lead.cnae || lead.activity) && (
          <div className="flex items-center gap-1.5 mb-2">
            <Briefcase className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400 truncate">
              {lead.cnae && <span className="text-seguranca-lightgray">{lead.cnae}</span>}
              {lead.cnae && lead.cnaeDescription && <span className="text-gray-500"> — </span>}
              {lead.cnaeDescription || lead.activity}
            </span>
          </div>
        )}

        {/* CNPJ */}
        {lead.cnpj && (
          <div className="flex items-center gap-1.5 mb-2">
            <CreditCard className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400">
              {lead.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
            </span>
          </div>
        )}

        {/* Cidade */}
        {lead.city && (
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400">{lead.city}/{lead.state}</span>
          </div>
        )}

        {/* Contato */}
        <div className="space-y-1 mb-3">
          {lead.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-green-400 shrink-0" />
              <span className="text-xs text-seguranca-lightgray">{lead.phone}</span>
            </div>
          )}
          {lead.whatsapp && (
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3 text-green-400 shrink-0" />
              <span className="text-xs text-seguranca-lightgray">{lead.whatsapp}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-blue-400 shrink-0" />
              <span className="text-xs text-seguranca-lightgray truncate">{lead.email}</span>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-purple-400 shrink-0" />
              <span className="text-xs text-seguranca-lightgray truncate">{lead.website}</span>
            </div>
          )}
        </div>

        {/* Sócios */}
        {partners.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
              <Users className="h-3 w-3" /> Sócios / Decisores
            </p>
            {partners.slice(0, 3).map((p, i) => (
              <p key={i} className="text-xs text-seguranca-lightgray">
                {p.name} {p.role && <span className="text-gray-500">({p.role})</span>}
              </p>
            ))}
            {partners.length > 3 && (
              <p className="text-[10px] text-gray-500">+{partners.length - 3} mais</p>
            )}
          </div>
        )}

        {/* Compras */}
        {purchasing && (
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" /> Compras
            </p>
            <p className="text-xs text-seguranca-lightgray">
              {purchasing.name} {purchasing.department && <span className="text-gray-500">({purchasing.department})</span>}
            </p>
          </div>
        )}

        {/* Google Rating */}
        {(lead.googleRating || lead.googleReviews) && (
          <div className="flex items-center gap-2 mb-3">
            {lead.googleRating && (
              <span className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="text-seguranca-lightgray">{lead.googleRating}</span>
              </span>
            )}
            {lead.googleReviews && (
              <span className="text-[10px] text-gray-500">{lead.googleReviews} avaliações</span>
            )}
          </div>
        )}

        {/* Score */}
        {lead.qualificationScore != null && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-1.5 bg-seguranca-black rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  lead.qualificationScore >= 70 ? 'bg-green-500' : lead.qualificationScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${lead.qualificationScore}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-seguranca-lightgray">{lead.qualificationScore}/100</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-700">
          <Button size="sm" variant="ghost" onClick={onView} className="h-7 px-2 text-gray-400 hover:text-seguranca-lightgray">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {lead.status !== 'SENT_TO_KANBAN' && lead.status !== 'QUALIFIED' && (
            <Button size="sm" variant="ghost" onClick={onEnrich} className="h-7 px-2 text-yellow-400 hover:text-yellow-300" title="Enriquecer">
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          )}
          {lead.status !== 'SENT_TO_KANBAN' && (
            <Button size="sm" variant="ghost" onClick={onQualify} className="h-7 px-2 text-green-400 hover:text-green-300" title="Qualificar">
              <Zap className="h-3.5 w-3.5" />
            </Button>
          )}
          {(lead.status === 'QUALIFIED' || lead.status === 'ENRICHED') && (
            <Button size="sm" variant="ghost" onClick={onSendToKanban} className="h-7 px-2 text-purple-400 hover:text-purple-300" title="Enviar ao Kanban">
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 px-2 text-red-400 hover:text-red-300 ml-auto" title="Excluir">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
