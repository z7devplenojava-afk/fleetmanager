import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, MapPin, Users, Clock, Trash2, Edit3, Building2,
  Briefcase, Calendar, Loader2, FileText, ChevronDown, ChevronUp,
  Truck, Radio, Shield, Wrench, Eye
} from 'lucide-react';
import workPostService, { WorkPost, CreateWorkPostRequest } from '@/services/workPostService';
import { contractService, Contract } from '@/services/contractService';

interface ClientWorkPostsTabProps {
  clientId: string;
  clientName: string;
}

const WORK_POST_TYPES = [
  { value: 'POSTO_24H', label: 'Posto 24h' },
  { value: 'POSTO_SDF', label: 'SDF (Sem Dormir Fraterno)' },
  { value: 'POSTO_12H_NOTURNO', label: '12h Noturno' },
  { value: 'POSTO_12H_DIURNO', label: '12h Diurno' },
  { value: 'ROUNDA', label: 'Ronda' },
  { value: 'ESCOLTA', label: 'Escolta' },
  { value: 'MONITORAMENTO', label: 'Monitoramento' },
  { value: 'OUTROS', label: 'Outros' },
];

const WORK_POST_STATUS = [
  { value: 'EM_ANALISE', label: 'Em Análise', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  { value: 'PENDENTE', label: 'Pendente', color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' },
  { value: 'EM_IMPLANTACAO', label: 'Em Implantação', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
  { value: 'ATIVO', label: 'Ativo', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { value: 'INATIVO', label: 'Inativo', color: 'text-gray-400 bg-gray-500/15 border-gray-500/30' },
  { value: 'SUSPENSO', label: 'Suspenso', color: 'text-red-400 bg-red-500/15 border-red-500/30' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'text-red-500 bg-red-500/15 border-red-500/30' },
];

const ClientWorkPostsTab: React.FC<ClientWorkPostsTabProps> = ({ clientId, clientName }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<WorkPost | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateWorkPostRequest>({
    postCode: '',
    name: '',
    description: '',
    type: 'POSTO_24H',
    status: 'EM_ANALISE',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    clientId: clientId,
    contractId: '',
    requiredVigilantes: 1,
    workSchedule: '12x36',
    shiftStart: '18:00',
    shiftEnd: '06:00',
    shiftDescription: '',
    transportVoucher: true,
    costAllowance: false,
    costAllowanceValue: 0,
    intrajourney: false,
    localMeal: false,
    mealTicket: false,
    healthPlan: false,
    dentalPlan: false,
    cars: 0,
    motorcycles: 0,
    radios: 0,
    corporates: 0,
    documentBank: false,
    nrs: [],
    pgr: false,
    pcmso: false,
    epis: [],
    trainings: [],
    observations: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wpData, ctData] = await Promise.all([
        workPostService.getWorkPostsByClient(clientId),
        contractService.getContractsByClient(clientId),
      ]);
      setWorkPosts(wpData || []);
      setContracts(ctData || []);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar dados do cliente', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setFormData({
      postCode: '',
      name: '',
      description: '',
      type: 'POSTO_24H',
      status: 'EM_ANALISE',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      clientId: clientId,
      contractId: '',
      requiredVigilantes: 1,
      workSchedule: '12x36',
      shiftStart: '18:00',
      shiftEnd: '06:00',
      shiftDescription: '',
      transportVoucher: true,
      costAllowance: false,
      costAllowanceValue: 0,
      intrajourney: false,
      localMeal: false,
      mealTicket: false,
      healthPlan: false,
      dentalPlan: false,
      cars: 0,
      motorcycles: 0,
      radios: 0,
      corporates: 0,
      documentBank: false,
      nrs: [],
      pgr: false,
      pcmso: false,
      epis: [],
      trainings: [],
      observations: '',
    });
    setEditingPost(null);
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (post: WorkPost) => {
    setFormData({
      postCode: post.postCode || '',
      name: post.name || '',
      description: post.description || '',
      type: post.type || 'POSTO_24H',
      status: post.status || 'EM_ANALISE',
      address: post.address || '',
      city: post.city || '',
      state: post.state || '',
      zipCode: post.zipCode || '',
      clientId: clientId,
      contractId: post.contractId || '',
      requiredVigilantes: post.requiredVigilantes || 1,
      workSchedule: post.workSchedule || '12x36',
      shiftStart: post.shiftStart || '18:00',
      shiftEnd: post.shiftEnd || '06:00',
      shiftDescription: post.shiftDescription || '',
      transportVoucher: post.transportVoucher ?? true,
      costAllowance: post.costAllowance ?? false,
      costAllowanceValue: post.costAllowanceValue || 0,
      intrajourney: post.intrajourney ?? false,
      localMeal: post.localMeal ?? false,
      mealTicket: post.mealTicket ?? false,
      healthPlan: post.healthPlan ?? false,
      dentalPlan: post.dentalPlan ?? false,
      cars: post.cars || 0,
      motorcycles: post.motorcycles || 0,
      radios: post.radios || 0,
      corporates: post.corporates || 0,
      documentBank: post.documentBank ?? false,
      nrs: post.nrs || [],
      pgr: post.pgr ?? false,
      pcmso: post.pcmso ?? false,
      epis: post.epis || [],
      trainings: post.trainings || [],
      observations: post.observations || '',
    });
    setEditingPost(post);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.postCode.trim() || !formData.name.trim() || !formData.address.trim()) {
      toast({ title: 'Atenção', description: 'Preencha os campos obrigatórios (Código, Nome, Endereço)', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingPost) {
        await workPostService.updateWorkPost(editingPost.id, formData);
        toast({ title: 'Sucesso', description: 'Posto de trabalho atualizado' });
      } else {
        await workPostService.createWorkPost({ ...formData, clientId });
        toast({ title: 'Sucesso', description: 'Posto de trabalho criado e vinculado ao cliente' });
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao salvar posto', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: WorkPost) => {
    if (!confirm(`Excluir o posto "${post.name}"?`)) return;
    try {
      await workPostService.deleteWorkPost(post.id);
      toast({ title: 'Sucesso', description: 'Posto excluído' });
      loadData();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir posto', variant: 'destructive' });
    }
  };

  const getStatusConfig = (status: string) => {
    return WORK_POST_STATUS.find(s => s.value === status) || WORK_POST_STATUS[0];
  };

  const getContractLabel = (contractId?: string) => {
    if (!contractId) return null;
    const contract = contracts.find(c => c.id === contractId);
    return contract ? `${contract.contractNumber} — ${contract.description}` : contractId;
  };

  const renderForm = () => (
    <Dialog open={showForm} onOpenChange={setShowForm}>
      <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 size={18} className="text-seguranca-yellow" />
            {editingPost ? 'Editar Posto de Trabalho' : 'Novo Posto de Trabalho'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Identificação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Código do Posto *</label>
              <Input value={formData.postCode} onChange={e => setFormData({ ...formData, postCode: e.target.value })}
                className="bg-seguranca-black border-gray-700 text-white text-sm" placeholder="Ex: POSTO-001" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Nome do Posto *</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="bg-seguranca-black border-gray-700 text-white text-sm" placeholder="Ex: Obra - Condomínio Resencial" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo *</label>
              <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as any })}>
                <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                  {WORK_POST_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Status</label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v as any })}>
                <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                  {WORK_POST_STATUS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contrato vinculado */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Contrato Vinculado</label>
            <Select value={formData.contractId || 'none'} onValueChange={v => setFormData({ ...formData, contractId: v === 'none' ? '' : v })}>
              <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-sm">
                <SelectValue placeholder="Selecione um contrato (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                <SelectItem value="none">Sem contrato vinculado</SelectItem>
                {contracts.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.contractNumber} — {c.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Localização */}
          <div className="border-t border-gray-700 pt-3">
            <p className="text-xs text-seguranca-yellow uppercase tracking-wide mb-2 flex items-center gap-1"><MapPin size={12} /> Localização</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Endereço *</label>
                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" placeholder="Rua, Número" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cidade</label>
                <Input value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">UF</label>
                <Input value={formData.state || ''} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" maxLength={2} />
              </div>
            </div>
          </div>

          {/* Pessoal */}
          <div className="border-t border-gray-700 pt-3">
            <p className="text-xs text-seguranca-yellow uppercase tracking-wide mb-2 flex items-center gap-1"><Users size={12} /> Configuração de Pessoal</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Vigilantes *</label>
                <Input type="number" min={1} value={formData.requiredVigilantes}
                  onChange={e => setFormData({ ...formData, requiredVigilantes: parseInt(e.target.value) || 1 })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Escala</label>
                <Select value={formData.workSchedule} onValueChange={v => setFormData({ ...formData, workSchedule: v })}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    <SelectItem value="12x36">12x36</SelectItem>
                    <SelectItem value="6x1">6x1</SelectItem>
                    <SelectItem value="5x2">5x2</SelectItem>
                    <SelectItem value="4x2">4x2</SelectItem>
                    <SelectItem value="SEG_A_SEX">Seg a Sex</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Início Turno</label>
                <Input type="time" value={formData.shiftStart}
                  onChange={e => setFormData({ ...formData, shiftStart: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Fim Turno</label>
                <Input type="time" value={formData.shiftEnd}
                  onChange={e => setFormData({ ...formData, shiftEnd: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" />
              </div>
            </div>
          </div>

          {/* Descrição e Observações */}
          <div className="border-t border-gray-700 pt-3 space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
              <Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="bg-seguranca-black border-gray-700 text-white text-sm" rows={2} placeholder="Descrição detalhada do posto" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Observações</label>
              <Textarea value={formData.observations || ''} onChange={e => setFormData({ ...formData, observations: e.target.value })}
                className="bg-seguranca-black border-gray-700 text-white text-sm" rows={2} />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-3 border-t border-gray-700">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="border-gray-600 text-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-seguranca-yellow text-black hover:bg-yellow-500">
              {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Shield size={16} className="mr-1" />}
              {editingPost ? 'Atualizar' : 'Criar Posto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-seguranca-yellow animate-spin" />
        <span className="ml-2 text-gray-400 text-sm">Carregando postos de trabalho...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Building2 size={18} className="text-seguranca-yellow" />
            Postos de Trabalho / Obras
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {workPosts.length} posto{workPosts.length !== 1 ? 's' : ''} vinculado{workPosts.length !== 1 ? 's' : ''} a {clientName}
          </p>
        </div>
        <Button onClick={openNewForm} className="bg-seguranca-yellow text-black hover:bg-yellow-500">
          <Plus size={16} className="mr-1" /> Novo Posto
        </Button>
      </div>

      {/* Lista */}
      {workPosts.length === 0 ? (
        <Card className="bg-seguranca-graphite border-gray-700 p-8 text-center">
          <Building2 className="mx-auto mb-2 text-gray-500" size={36} />
          <p className="text-gray-400">Nenhum posto de trabalho vinculado a este cliente</p>
          <p className="text-xs text-gray-500 mt-1">Clique em "Novo Posto" para adicionar uma obra/posto</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {workPosts.map(post => {
            const statusCfg = getStatusConfig(post.status || 'EM_ANALISE');
            const isExpanded = expandedPost === post.id;
            const contractLabel = getContractLabel(post.contractId);

            return (
              <Card key={post.id} className="bg-seguranca-graphite border-gray-700 overflow-hidden hover:border-seguranca-yellow transition-all">
                {/* Header do card */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-seguranca-yellow/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="text-seguranca-yellow" size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold truncate">{post.name}</p>
                          <Badge className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5 font-mono">{post.postCode}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                          {post.address && <span className="flex items-center gap-1"><MapPin size={10} /> {post.address}{post.city ? `, ${post.city}` : ''}{post.state ? ` - ${post.state}` : ''}</span>}
                          {post.type && <span className="flex items-center gap-1"><Briefcase size={10} /> {WORK_POST_TYPES.find(t => t.value === post.type)?.label || post.type}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => navigate(`/operacional/postos/${post.id}`)} className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors" title="Ver Detalhes">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => openEditForm(post)} className="p-1.5 text-gray-400 hover:text-seguranca-yellow transition-colors" title="Editar">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(post)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Detalhes">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Badges resumidos */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {post.requiredVigilantes && (
                      <Badge className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/30">
                        <Users size={10} className="mr-1" /> {post.requiredVigilantes} vigilante{post.requiredVigilantes > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {post.workSchedule && (
                      <Badge className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                        <Clock size={10} className="mr-1" /> {post.workSchedule}
                      </Badge>
                    )}
                    {contractLabel && (
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        <FileText size={10} className="mr-1" /> {contractLabel}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <div className="border-t border-gray-700 p-4 bg-seguranca-black/30 space-y-3 text-sm">
                    {post.description && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Descrição</p>
                        <p className="text-gray-300">{post.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Turno</p>
                        <p className="text-white">{post.shiftStart} — {post.shiftEnd}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Carros</p>
                        <p className="text-white">{post.cars || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Motos</p>
                        <p className="text-white">{post.motorcycles || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Rádios</p>
                        <p className="text-white">{post.radios || 0}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.transportVoucher && <Badge className="text-[10px] bg-gray-700 text-gray-300">🚌 VT</Badge>}
                      {post.costAllowance && <Badge className="text-[10px] bg-gray-700 text-gray-300">💰 Ajuda de Custo</Badge>}
                      {post.localMeal && <Badge className="text-[10px] bg-gray-700 text-gray-300">🍽️ Alimentação no Local</Badge>}
                      {post.healthPlan && <Badge className="text-[10px] bg-gray-700 text-gray-300">🏥 Plano de Saúde</Badge>}
                      {post.dentalPlan && <Badge className="text-[10px] bg-gray-700 text-gray-300">🦷 Plano Odontológico</Badge>}
                      {post.pgr && <Badge className="text-[10px] bg-gray-700 text-gray-300">📋 PGR</Badge>}
                      {post.pcmso && <Badge className="text-[10px] bg-gray-700 text-gray-300">🩺 PCMSO</Badge>}
                    </div>
                    {post.observations && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Observações</p>
                        <p className="text-gray-300">{post.observations}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {renderForm()}
    </div>
  );
};

export default ClientWorkPostsTab;
