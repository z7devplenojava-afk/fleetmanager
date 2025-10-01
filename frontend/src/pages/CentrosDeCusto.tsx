import React, { useEffect, useMemo, useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Layers, Trash2, Edit2, RefreshCw, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { financialService } from '@/services/financialService';
import { costCenterService, CostCenterDTO } from '@/services/costCenterService';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type CostCenter = CostCenterDTO;

const CentrosDeCusto: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filter, setFilter] = useState('');
  const [novo, setNovo] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [form, setForm] = useState<CostCenterDTO>({ name: '', code: '', description: '', owner: '', status: 'ACTIVE' });
  const [codeError, setCodeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hasNameDuplicate = useMemo(() => {
    if (!form.name) return false;
    const lower = form.name.trim().toLowerCase();
    return costCenters.some(cc => cc.name?.trim().toLowerCase() === lower && (!editing || cc.id !== editing.id));
  }, [form.name, costCenters, editing]);

  const filtered = useMemo(() => {
    const f = (filter || '').toLowerCase();
    return costCenters.filter((c) => (statusFilter === 'ALL' || c.status === statusFilter) && ((c.name||'').toLowerCase().includes(f) || (c.code||'').toLowerCase().includes(f)));
  }, [costCenters, filter, statusFilter]);

  const carregar = async () => {
    try {
      setLoading(true);
      // Tenta buscar do backend; se falhar, cai no fallback via transações
      try {
        const resp = await costCenterService.list({ page, size, status: statusFilter === 'ALL' ? undefined : statusFilter });
        const list: CostCenterDTO[] = resp.content || [];
        setCostCenters(list);
        setTotal(resp.totalElements || list.length || 0);
      } catch {
        const txs = await financialService.getTransactions();
        const unique = Array.from(new Set((txs || []).map((t: any) => t.costCenter).filter(Boolean)));
        setCostCenters(unique.map((n:string)=>({ name: n, status: 'ACTIVE' } as CostCenter)));
        setTotal(unique.length);
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível carregar os centros de custo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportar = async () => {
    try {
      setLoading(true);
      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0,10);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).toISOString().slice(0,10);
      const data = await financialService.getReportByCostCenter({ startDate: inicio, endDate: fim });
      // Exporta CSV simples
      const linhas = [
        ['Descrição','Valor','Data','Vencimento','Categoria','Centro de Custo'].join(';'),
        ...data.items.map((i:any)=>[
          i.description,
          String(i.amount).replace('.',','),
          i.issueDate || i.date,
          i.dueDate,
          i.category || '',
          i.centroCusto || i.costCenter || ''
        ].join(';'))
      ];
      const blob = new Blob(["\ufeff"+linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_centro_custo_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao exportar relatório.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [page, size, statusFilter]);

  const adicionar = async () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '', owner: '', status: 'ACTIVE' });
    setShowModal(true);
  };

  const renomear = async (oldName: string, newName: string) => {
    const novoNome = (newName || '').trim();
    if (!novoNome) return;
    try {
      const resp = await costCenterService.list({ size: 1000 });
      const match = (resp.content || []).find((cc: CostCenterDTO) => cc.name === oldName);
      if (match?.id) {
        await costCenterService.update(match.id, { ...match, name: novoNome });
        await carregar();
        return;
      }
    } catch {}
    setCostCenters((list) => list.map((c) => (c.name === oldName ? { ...c, name: novoNome } : c)));
  };

  const remover = async (name: string) => {
    try {
      const resp = await costCenterService.list({ size: 1000 });
      const match = (resp.content || []).find((cc: CostCenterDTO) => cc.name === name);
      if (match?.id) {
        try {
          await costCenterService.remove(match.id);
          await carregar();
          return;
        } catch (e:any) {
          // Se backend bloquear exclusão, sugerir inativação
          toast({ title: 'Ação bloqueada', description: 'Este centro possui despesas vinculadas. Inative ao invés de excluir.' });
          return;
        }
      }
    } catch {}
    setCostCenters((list) => list.filter((c) => c.name !== name));
  };

  const toggle = async (name: string) => {
    try {
      if (!window.confirm('Deseja realmente alternar o status deste centro de custo?')) return;
      const resp = await costCenterService.list({ size: 1000 });
      const match = (resp.content || []).find((cc: CostCenterDTO) => cc.name === name);
      if (match?.id) {
        await costCenterService.toggleStatus(match.id);
        await carregar();
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao alterar status.' });
    }
  };

  const salvar = async () => {
    if (!form.name?.trim()) {
      toast({ title: 'Atenção', description: 'Informe o nome do centro de custo.' });
      return;
    }
    if ((form.name || '').trim().length < 3) {
      toast({ title: 'Nome muito curto', description: 'O nome deve ter pelo menos 3 caracteres.', variant: 'destructive' });
      return;
    }
    // Validação de código (opcional mas se informado precisa seguir padrão e não duplicar)
    if (form.code && !/^CC\d{3,}$/.test(form.code)) {
      setCodeError('Código deve seguir o padrão CC### (mínimo 3 dígitos).');
      return;
    }
    // Duplicidade local
    const duplicated = costCenters.some(cc => cc.code && form.code && cc.code.toUpperCase() === form.code.toUpperCase() && (!editing || cc.id !== editing.id));
    if (duplicated) {
      setCodeError('Código já existente. Use outro.');
      return;
    }
    if (hasNameDuplicate) {
      toast({ title: 'Nome já existente', description: 'Já existe um centro de custo com esse nome.', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      if (editing?.id) {
        await costCenterService.update(editing.id, form);
      } else {
        const payload: CostCenterDTO = {
          name: form.name!.trim(),
          // Se código estiver em branco, backend gerará automaticamente
          code: (form.code?.trim() || '') === '' ? undefined : form.code?.trim(),
          description: form.description?.trim(),
          owner: form.owner?.trim(),
          status: form.status || 'ACTIVE'
        };
        await costCenterService.create(payload);
      }
      setShowModal(false);
      await carregar();
      toast({ title: 'Sucesso', description: 'Registro salvo com sucesso.' });
    } catch (e:any) {
      toast({ title: 'Erro', description: e?.response?.data?.message || 'Não foi possível salvar.' , variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <StandardLayout title="Centros de Custo">
      <div className="space-y-6">
        <Card className="p-4 bg-seguranca-graphite border-gray-700">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-seguranca-lightgray">
              <Layers size={18} className="text-seguranca-yellow" />
              <span className="font-semibold">Gerenciar Centros de Custo</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar..."
                className="w-56 form-input"
              />
              <select className="form-input" value={statusFilter} onChange={(e)=> setStatusFilter(e.target.value as any)}>
                <option value="ALL">Todos</option>
                <option value="ACTIVE">Ativos</option>
                <option value="INACTIVE">Inativos</option>
              </select>
              <Button variant="outline" onClick={carregar} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>
              <Button variant="outline" onClick={exportar} disabled={loading}>
                <FileDown size={16} />
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-seguranca-graphite border-gray-700">
          <div className="flex gap-2 mb-4">
            <Input
              value={novo}
              onChange={(e) => setNovo(e.target.value)}
              placeholder="Novo centro de custo"
              className="form-input"
            />
            <Button onClick={adicionar} className="bg-seguranca-red hover:bg-seguranca-darkred">
              <Plus size={16} />
              <span className="ml-1">Adicionar</span>
            </Button>
          </div>

          <div className="divide-y divide-gray-700">
            {filtered.length === 0 && (
              <div className="text-sm text-gray-400">Nenhum centro de custo encontrado.</div>
            )}
            {filtered.map((cc) => (
              <div key={cc.id || cc.name} className="flex items-center justify-between py-2">
                <div className="text-seguranca-lightgray flex items-center gap-3">
                  <span className="font-medium">{cc.name}</span>
                  {cc.code && <span className="text-xs text-gray-400">{cc.code}</span>}
                  <Badge variant={cc.status === 'ACTIVE' ? 'default' : 'secondary'}>{cc.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => toggle(cc.name!)}>Ativar/Inativar</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const novoNome = prompt('Renomear centro de custo', cc.name) || '';
                      renomear(cc.name!, novoNome);
                    }}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="destructive" onClick={() => remover(cc.name!)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">Total: {total}</div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page<=0} onClick={()=> setPage(p=> Math.max(0, p-1))}>Anterior</Button>
            <Button variant="outline" onClick={()=> setPage(p=> p+1)}>Próxima</Button>
          </div>
        </div>
      </div>
    </StandardLayout>
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="bg-seguranca-graphite border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">{editing ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-seguranca-lightgray">Nome</label>
              <Input
                value={form.name || ''}
                onChange={(e)=> setForm({ ...form, name: e.target.value })}
                className={`form-input ${hasNameDuplicate ? 'border-red-500' : ''}`}
              />
              {hasNameDuplicate && <div className="text-xs text-red-400 mt-1">Já existe um centro com esse nome.</div>}
            </div>
            <div>
              <label className="text-sm text-seguranca-lightgray">Código</label>
              {editing?.id ? (
                <Input value={form.code || ''} disabled className="form-input opacity-80" />
              ) : (
                <div className="text-xs text-gray-400 mt-2">Será gerado automaticamente ao salvar (ex.: CC001)</div>
              )}
              {codeError && <div className="text-xs text-red-400 mt-1">{codeError}</div>}
            </div>
            <div>
              <label className="text-sm text-seguranca-lightgray">Responsável</label>
              <Input value={form.owner || ''} onChange={(e)=> setForm({ ...form, owner: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="text-sm text-seguranca-lightgray">Status</label>
              <select className="form-input" value={form.status || 'ACTIVE'} onChange={(e)=> setForm({ ...form, status: e.target.value as any })}>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-seguranca-lightgray">Descrição</label>
            <Textarea value={form.description || ''} onChange={(e)=> setForm({ ...form, description: e.target.value })} className="form-input" rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={()=> setShowModal(false)}>Cancelar</Button>
          <Button className="bg-seguranca-red hover:bg-seguranca-darkred" onClick={salvar} disabled={saving || !!codeError || !form.name?.trim() || hasNameDuplicate}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CentrosDeCusto;


