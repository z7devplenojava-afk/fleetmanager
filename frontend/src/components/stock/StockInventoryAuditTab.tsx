import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  RefreshCw, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Barcode, 
  Play, 
  CheckSquare, 
  Eye, 
  XCircle, 
  Loader2, 
  Layers, 
  MapPin, 
  DollarSign,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  warehouseInventoryService, 
  WarehouseInventoryAudit, 
  WarehouseInventoryStatus,
  WarehouseInventoryScope 
} from '@/services/warehouseInventoryService';

export const StockInventoryAuditTab: React.FC = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<WarehouseInventoryAudit[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);
  const [newForm, setNewForm] = useState({
    code: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`,
    description: 'Inventário Periódico de Almoxarifado',
    scopeType: 'ALL' as WarehouseInventoryScope,
    freezeMovements: true,
    notes: ''
  });

  // Modal de Contagem
  const [countModalOpen, setCountModalOpen] = useState(false);
  const [activeAudit, setActiveAudit] = useState<WarehouseInventoryAudit | null>(null);
  const [countInputs, setCountInputs] = useState<Record<string, { qty: number | ''; serialsText: string }>>({});
  const [submittingCount, setSubmittingCount] = useState(false);

  // Modal de Aprovação / Análise
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [justification, setJustification] = useState('Contagem física validada e conferida pela gestão.');
  const [submittingApprove, setSubmittingApprove] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await warehouseInventoryService.list(
        statusFilter !== 'ALL' ? (statusFilter as WarehouseInventoryStatus) : undefined
      );
      setAudits(res.content || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar inventários',
        description: err.response?.data?.message || err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Filtros
  const filteredAudits = useMemo(() => {
    return audits.filter(a => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        a.code.toLowerCase().includes(q) || 
        a.description.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [audits, searchTerm]);

  // Status Badge Helper
  const getStatusBadge = (status: WarehouseInventoryStatus) => {
    switch (status) {
      case 'CRIADO':
        return <Badge variant="secondary">CRIADO</Badge>;
      case 'EM_CONTAGEM':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">EM CONTAGEM</Badge>;
      case 'CONFERENCIA':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">CONFERÊNCIA (2ª CONT)</Badge>;
      case 'AGUARDANDO_APROVACAO':
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white">AGUARDANDO APROVAÇÃO</Badge>;
      case 'FINALIZADO':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">FINALIZADO</Badge>;
      case 'CANCELADO':
        return <Badge variant="destructive">CANCELADO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Abrir Modal de Criação
  const handleOpenNewModal = () => {
    setNewForm({
      code: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`,
      description: 'Inventário Físico do Almoxarifado',
      scopeType: 'ALL',
      freezeMovements: true,
      notes: ''
    });
    setNewModalOpen(true);
  };

  // Submeter Criação de Inventário
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingNew(true);
      await warehouseInventoryService.create(newForm);
      toast({
        title: 'Inventário Aberto com Sucesso!',
        description: `Auditoria ${newForm.code} criada com captura de saldo contábil.`
      });
      setNewModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Erro ao criar inventário',
        description: err.response?.data?.message || err.message,
        variant: 'destructive'
      });
    } finally {
      setSubmittingNew(false);
    }
  };

  // Iniciar Contagem
  const handleStartCount = async (audit: WarehouseInventoryAudit) => {
    try {
      await warehouseInventoryService.startCount(audit.id);
      toast({ title: 'Contagem Iniciada', description: `Inventário ${audit.code} em fase de contagem cega.` });
      loadData();
    } catch (err: any) {
      toast({ title: 'Erro ao iniciar contagem', description: err.response?.data?.message || err.message, variant: 'destructive' });
    }
  };

  // Abrir Modal de Contagem Cega
  const handleOpenCountModal = async (audit: WarehouseInventoryAudit) => {
    try {
      const fullAudit = await warehouseInventoryService.getById(audit.id, true);
      setActiveAudit(fullAudit);
      const inputs: Record<string, { qty: number | ''; serialsText: string }> = {};
      fullAudit.items?.forEach(item => {
        const val = fullAudit.status === 'CONFERENCIA' ? (item.quantityCount2 ?? item.quantityCount1 ?? '') : (item.quantityCount1 ?? '');
        inputs[item.id] = { qty: val, serialsText: '' };
      });
      setCountInputs(inputs);
      setCountModalOpen(true);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar detalhes', description: err.message, variant: 'destructive' });
    }
  };

  // Submeter Contagem
  const handleSubmitCount = async () => {
    if (!activeAudit) return;
    try {
      setSubmittingCount(true);
      const round = activeAudit.status === 'CONFERENCIA' ? 2 : 1;
      const itemsPayload = Object.entries(countInputs).map(([itemId, val]) => {
        const serials = val.serialsText ? val.serialsText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean) : undefined;
        return {
          itemId,
          countedQuantity: val.qty !== '' ? Number(val.qty) : undefined,
          scannedSerials: serials
        };
      });

      await warehouseInventoryService.submitCount(activeAudit.id, {
        countRound: round,
        items: itemsPayload
      });

      toast({
        title: `Contagem ${round} Registrada!`,
        description: 'Divergências apuradas automaticamente pelo sistema.'
      });
      setCountModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({ title: 'Erro ao enviar contagem', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setSubmittingCount(false);
    }
  };

  // Abrir Modal de Aprovação
  const handleOpenApproveModal = async (audit: WarehouseInventoryAudit) => {
    try {
      const fullAudit = await warehouseInventoryService.getById(audit.id, false);
      setActiveAudit(fullAudit);
      setApproveModalOpen(true);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar auditoria', description: err.message, variant: 'destructive' });
    }
  };

  // Submeter Aprovação & Aplicação dos Ajustes
  const handleApproveSubmit = async () => {
    if (!activeAudit) return;
    try {
      setSubmittingApprove(true);
      await warehouseInventoryService.approve(activeAudit.id, {
        justification
      });
      toast({
        title: 'Inventário Finalizado & Ajustes Aplicados!',
        description: 'Movimentações contábeis de entrada/saída geradas e saldos atualizados.'
      });
      setApproveModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({ title: 'Erro ao aprovar inventário', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setSubmittingApprove(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-purple-500" />
            Auditorias de Inventário Físico & Ajustes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Contagem cega, leitura de seriais rastreáveis, apuração financeira de sobras/faltas e ajustes com aprovação de gestão.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={handleOpenNewModal} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Inventário
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por código ou descrição do inventário..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full md:w-56">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="CRIADO">Criado</SelectItem>
              <SelectItem value="EM_CONTAGEM">Em Contagem</SelectItem>
              <SelectItem value="CONFERENCIA">Conferência (2ª Contagem)</SelectItem>
              <SelectItem value="AGUARDANDO_APROVACAO">Aguardando Aprovação</SelectItem>
              <SelectItem value="FINALIZADO">Finalizado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Inventários */}
      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4">Código / Descrição</th>
                <th className="py-3 px-4">Escopo</th>
                <th className="py-3 px-4">Bloqueio</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Abertura</th>
                <th className="py-3 px-4">Itens / Divergência</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Carregando inventários...
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhum inventário encontrado.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-foreground">{a.code}</div>
                      <div className="text-xs text-muted-foreground">{a.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Layers className="w-3 h-3" />
                        {a.scopeType}
                      </Badge>
                      {a.targetLocationName && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {a.targetLocationName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {a.freezeMovements ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit text-[10px]">
                          <Lock className="w-3 h-3" /> Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground flex items-center gap-1 w-fit text-[10px]">
                          <Unlock className="w-3 h-3" /> Livre
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(a.status)}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(a.openedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs">
                        <span className="font-medium text-foreground">{a.totalItems} itens</span>
                        {a.divergentItems > 0 && (
                          <span className="text-rose-500 font-semibold ml-2">
                            ({a.divergentItems} div.)
                          </span>
                        )}
                      </div>
                      {a.totalDivergenceValue !== undefined && a.totalDivergenceValue !== 0 && (
                        <div className={`text-[11px] font-mono mt-0.5 ${a.totalDivergenceValue < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          R$ {a.totalDivergenceValue.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.status === 'CRIADO' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs text-blue-600 hover:text-blue-700"
                          onClick={() => handleStartCount(a)}
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Iniciar Contagem
                        </Button>
                      )}

                      {(a.status === 'EM_CONTAGEM' || a.status === 'CONFERENCIA') && (
                        <Button 
                          size="sm" 
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleOpenCountModal(a)}
                        >
                          <Barcode className="w-3.5 h-3.5 mr-1" />
                          {a.status === 'CONFERENCIA' ? '2ª Contagem' : 'Contar / Bipar'}
                        </Button>
                      )}

                      {a.status === 'AGUARDANDO_APROVACAO' && (
                        <Button 
                          size="sm" 
                          className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleOpenApproveModal(a)}
                        >
                          <CheckSquare className="w-3.5 h-3.5 mr-1" />
                          Analisar & Ajustar
                        </Button>
                      )}

                      {a.status === 'FINALIZADO' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs text-emerald-600"
                          onClick={() => handleOpenApproveModal(a)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Ver Auditoria
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Novo Inventário */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-600" />
                Abrir Auditoria de Inventário Físico
              </DialogTitle>
              <DialogDescription>
                Congela saldos contábeis como referência e gera lista cega para o almoxarifado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <Label>Código da Auditoria *</Label>
                <Input 
                  required
                  value={newForm.code}
                  onChange={e => setNewForm(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Descrição / Objetivo *</Label>
                <Input 
                  required
                  value={newForm.description}
                  onChange={e => setNewForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Escopo do Inventário</Label>
                <Select 
                  value={newForm.scopeType} 
                  onValueChange={(val: WarehouseInventoryScope) => setNewForm(prev => ({ ...prev, scopeType: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o escopo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Geral (Todo o Almoxarifado)</SelectItem>
                    <SelectItem value="CATEGORY">Por Categoria (Pneus, Baterias, etc.)</SelectItem>
                    <SelectItem value="LOCATION">Por Localização (Corredor, Estante)</SelectItem>
                    <SelectItem value="PRODUCT">Produto Específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/40">
                <input 
                  type="checkbox" 
                  id="freezeCheckbox"
                  checked={newForm.freezeMovements}
                  onChange={e => setNewForm(prev => ({ ...prev, freezeMovements: e.target.checked }))}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="freezeCheckbox" className="text-xs text-foreground cursor-pointer">
                  <strong>Bloqueio Operacional Rígido (Congelar Movimentações)</strong>.
                  Impede baixas em OS e saídas de produtos do escopo durante o período de contagem física.
                </label>
              </div>

              <div className="space-y-1">
                <Label>Observações</Label>
                <Textarea 
                  rows={2}
                  placeholder="Justificativa da auditoria ou orientações aos conferentes..."
                  value={newForm.notes}
                  onChange={e => setNewForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewModalOpen(false)}>Cancelar</Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={submittingNew}
              >
                {submittingNew && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Abrir Inventário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Contagem Física / Bipagem */}
      <Dialog open={countModalOpen} onOpenChange={setCountModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-blue-600" />
              Contagem Física — {activeAudit?.code} ({activeAudit?.status === 'CONFERENCIA' ? '2ª Contagem' : '1ª Contagem Cega'})
            </DialogTitle>
            <DialogDescription>
              {activeAudit?.status === 'CONFERENCIA'
                ? 'Reconferência de itens com divergência apontada na 1ª rodada.'
                : 'Contagem cega: digite a quantidade apurada ou bipe os seriais/DOTs de pneus e baterias.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 space-y-4">
            {activeAudit?.items?.map((item) => {
              const currentInput = countInputs[item.id] || { qty: '', serialsText: '' };
              const isSerialTracked = item.trackingType === 'SERIAL_INDIVIDUAL';

              return (
                <div key={item.id} className="p-3 border border-border/40 rounded-lg bg-card/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">{item.productName}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.productCode || 'S/C'})</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.locationName}
                    </Badge>
                  </div>

                  {isSerialTracked ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Bipar ou Digitar Seriais/DOTs (um por linha ou separados por vírgula):
                      </Label>
                      <Textarea 
                        rows={2}
                        placeholder="Ex: PN-295-001, PN-295-002, PN-295-003..."
                        value={currentInput.serialsText}
                        onChange={e => {
                          const text = e.target.value;
                          const count = text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean).length;
                          setCountInputs(prev => ({
                            ...prev,
                            [item.id]: { qty: count, serialsText: text }
                          }));
                        }}
                      />
                      <div className="text-[11px] text-muted-foreground">
                        Total bipado: <strong>{currentInput.qty || 0}</strong> {item.unit || 'UN'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground shrink-0">Quantidade Contada:</Label>
                      <Input 
                        type="number"
                        step="0.001"
                        placeholder="0.00"
                        className="w-36 font-mono"
                        value={currentInput.qty}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setCountInputs(prev => ({
                            ...prev,
                            [item.id]: { ...currentInput, qty: val }
                          }));
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{item.unit || 'UN'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCountModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmitCount}
              disabled={submittingCount}
            >
              {submittingCount && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Submeter Contagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Apuração & Aprovação de Ajustes */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-purple-600" />
              Apuração & Deliberação — {activeAudit?.code}
            </DialogTitle>
            <DialogDescription>
              Comparativo entre Saldo Lógico (Sistema) e Físico Apurado com impacto financeiro total.
            </DialogDescription>
          </DialogHeader>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-3 gap-3 my-2">
            <Card className="p-3 bg-card/60 border-border/40">
              <p className="text-xs text-muted-foreground font-medium">Total de Itens Auditados</p>
              <p className="text-xl font-bold mt-0.5">{activeAudit?.totalItems || 0}</p>
            </Card>
            <Card className="p-3 bg-amber-500/10 border-amber-500/20">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Itens com Divergência</p>
              <p className="text-xl font-bold mt-0.5 text-amber-700 dark:text-amber-300">
                {activeAudit?.divergentItems || 0}
              </p>
            </Card>
            <Card className="p-3 bg-purple-500/10 border-purple-500/20">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Impacto Financeiro Líquido</p>
              <p className={`text-xl font-bold mt-0.5 font-mono ${(activeAudit?.totalDivergenceValue || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                R$ {(activeAudit?.totalDivergenceValue || 0).toFixed(2)}
              </p>
            </Card>
          </div>

          {/* Tabela de Itens com Divergência */}
          <div className="flex-1 overflow-y-auto border border-border/40 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-medium">
                <tr>
                  <th className="py-2 px-3">Produto</th>
                  <th className="py-2 px-3">Local</th>
                  <th className="py-2 px-3 text-right">Saldo Sistema</th>
                  <th className="py-2 px-3 text-right">Contado</th>
                  <th className="py-2 px-3 text-right">Diferença</th>
                  <th className="py-2 px-3 text-right">Impacto R$</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 font-mono">
                {activeAudit?.items?.map((item) => {
                  const isDiff = item.difference !== null && item.difference !== undefined && item.difference !== 0;
                  return (
                    <tr key={item.id} className={isDiff ? 'bg-amber-500/5' : ''}>
                      <td className="py-2 px-3 font-sans font-medium text-foreground">
                        {item.productName}
                      </td>
                      <td className="py-2 px-3 font-sans text-muted-foreground">
                        {item.locationName}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {item.quantitySystem !== null ? item.quantitySystem : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-foreground">
                        {item.quantityFinal !== null ? item.quantityFinal : '—'}
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${
                        (item.difference || 0) < 0 ? 'text-rose-500' : (item.difference || 0) > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                      }`}>
                        {(item.difference || 0) > 0 ? `+${item.difference}` : item.difference}
                      </td>
                      <td className={`py-2 px-3 text-right ${
                        (item.divergenceValue || 0) < 0 ? 'text-rose-500' : (item.divergenceValue || 0) > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                      }`}>
                        R$ {(item.divergenceValue || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <Badge variant={item.status === 'OK' ? 'secondary' : item.status === 'AJUSTADO' ? 'default' : 'destructive'} className="text-[10px]">
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {activeAudit?.status !== 'FINALIZADO' && (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-900 dark:text-amber-200">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Efeito da Aprovação de Ajustes:
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Movimentações de <strong>AJUSTE_INVENTARIO_ENTRADA</strong> e <strong>AJUSTE_INVENTARIO_SAIDA</strong> serão lançadas atômica e contabilmente no almoxarifado.</li>
                  <li>Para pneus e baterias com falta física apurada, as instâncias não localizadas serão baixadas e marcadas como <strong>EXTRAVIO / SUCATA</strong>.</li>
                </ul>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Justificativa da Gestão de Frota / Almoxarifado *</Label>
                <Textarea 
                  rows={2}
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Justifique as causas das divergências apuradas e autorize o acerto de estoque..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>Fechar</Button>
            {activeAudit?.status !== 'FINALIZADO' && (
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleApproveSubmit}
                disabled={submittingApprove || !justification}
              >
                {submittingApprove && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Aprovar & Efetivar Ajustes no Estoque
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
