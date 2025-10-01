import React, { useEffect, useMemo, useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Search, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { contasAPagarService, Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '@/services/contasAPagarService';
import { useToast } from '@/hooks/use-toast';

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
] as const;

export default function Fornecedores() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<CreateSupplierRequest>({ name: '', cnpj: '' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s => (
      (s.name || '').toLowerCase().includes(q) ||
      (s.cnpj || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.state || '').toLowerCase().includes(q)
    ));
  }, [suppliers, search]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await contasAPagarService.getFornecedores();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar fornecedores', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', cnpj: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', category: '', notes: '' });
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      cnpj: s.cnpj || '',
      email: s.email,
      phone: s.phone,
      address: s.address,
      city: s.city,
      state: s.state,
      zipCode: (s as any).zipCode,
      category: (s as any).category,
      notes: s.notes,
    });
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (!form.name?.trim() || !form.cnpj?.trim()) {
        toast({ title: 'Campos obrigatórios', description: 'Informe Nome e CNPJ.', variant: 'destructive' });
        return;
      }
      if (editing) {
        const payload: UpdateSupplierRequest = { ...form };
        const updated = await contasAPagarService.updateFornecedor(String((editing as any).id || editing.id), payload);
        setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
        toast({ title: 'Sucesso', description: 'Fornecedor atualizado.' });
      } else {
        const created = await contasAPagarService.createFornecedor(form);
        setSuppliers(prev => [created, ...prev]);
        toast({ title: 'Sucesso', description: 'Fornecedor criado.' });
      }
      setShowModal(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Não foi possível salvar.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    }
  };

  const remove = async (s: Supplier) => {
    if (!confirm(`Excluir fornecedor ${s.name}?`)) return;
    try {
      await contasAPagarService.deleteFornecedor(String((s as any).id || s.id));
      setSuppliers(prev => prev.filter(x => x.id !== s.id));
      toast({ title: 'Sucesso', description: 'Fornecedor excluído.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
    }
  };

  const toggle = async (s: Supplier) => {
    try {
      const updated = await contasAPagarService.toggleFornecedorStatus(String((s as any).id || s.id));
      setSuppliers(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível alterar status.', variant: 'destructive' });
    }
  };

  return (
    <StandardLayout title="Fornecedores">
      <div className="space-y-4">
        <Card className="p-4 bg-seguranca-graphite border-gray-700">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-seguranca-lightgray">
              <Search size={16} />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CNPJ, cidade ou UF" className="form-input w-72" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>
              <Button onClick={openCreate} className="bg-seguranca-red hover:bg-seguranca-darkred">
                <Plus size={16} className="mr-1" /> Novo
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-seguranca-graphite border-gray-700">
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-400">Nenhum fornecedor encontrado.</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filtered.map(s => (
                <div key={s.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-seguranca-lightgray">
                    <div className="font-medium">{s.name} {s.isActive === false && <Badge variant="secondary" className="ml-2">Inativo</Badge>}</div>
                    <div className="text-xs text-gray-400">{s.cnpj || '—'} • {s.city || '—'} {s.state ? `- ${s.state}` : ''}</div>
                    {s.email && <div className="text-xs text-gray-400">{s.email}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggle(s)}>
                      {s.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(s)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 w-[95vw] max-w-[640px]">
              <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">{editing ? 'Editar fornecedor' : 'Novo fornecedor'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-seguranca-lightgray">Nome *</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">CNPJ *</label>
                  <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} className="form-input" placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">Email</label>
                  <Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">Telefone</label>
                  <Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="form-input" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-seguranca-lightgray">Endereço</label>
                  <Input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">Cidade</label>
                  <Input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">UF</label>
                  <select value={(form.state || '').toUpperCase()} onChange={e => setForm({ ...form, state: e.target.value })} className="form-input">
                    <option value="">Selecione</option>
                    {UFS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">CEP</label>
                  <Input value={form.zipCode || ''} onChange={e => setForm({ ...form, zipCode: e.target.value })} className="form-input" placeholder="00000-000" />
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">Categoria</label>
                  <Input value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} className="form-input" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-seguranca-lightgray">Observações</label>
                  <Input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="form-input" />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button onClick={save} className="bg-seguranca-red hover:bg-seguranca-darkred">Salvar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
}


