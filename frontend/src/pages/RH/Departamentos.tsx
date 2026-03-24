import React, { useEffect, useMemo, useState } from 'react';
import { departmentService, Department } from '@/services/departmentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const Departamentos: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<Partial<Department>>({ name: '', description: '', isActive: true });
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = async () => {
    setLoading(true);
    try {
      const data = await departmentService.listAll();
      setDepartments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Busca e paginação (client-side)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? departments.filter(d =>
          d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
        )
      : departments;
    const totalPages = Math.max(1, Math.ceil(base.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return {
      rows: base.slice(start, end),
      total: base.length,
      totalPages,
      page: safePage,
    };
  }, [departments, query, page]);

  const startCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', isActive: true });
    setOpen(true);
  };

  const startEdit = (d: Department) => {
    setEditing(d);
    setForm(d);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name) return;
    if (editing) {
      await departmentService.update(editing.id, form);
    } else {
      await departmentService.create(form as Omit<Department, 'id'>);
    }
    setOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este departamento?')) return;
    await departmentService.remove(id);
    await load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Departamentos</h1>
        <Button onClick={startCreate} className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90">
          <Plus className="h-4 w-4 mr-2" /> Novo Departamento
        </Button>
      </div>

      <Card className="bg-seguranca-graphite border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-white">Lista</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
                placeholder="Buscar por nome ou descrição..."
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-400">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-2">Nome</th>
                    <th className="py-2">Descrição</th>
                    <th className="py-2">Ativo</th>
                    <th className="py-2 w-40">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.rows.map(d => (
                    <tr key={d.id} className="border-b border-gray-800">
                      <td className="py-2 text-white">{d.name}</td>
                      <td className="py-2 text-gray-300">{d.description || '-'}</td>
                      <td className="py-2 text-gray-300">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!d.isActive}
                            onChange={async (e) => {
                              await departmentService.update(d.id, { isActive: e.target.checked });
                              await load();
                            }}
                          />
                          <span>{d.isActive ? 'Sim' : 'Não'}</span>
                        </label>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(d)} className="border-gray-600 text-gray-300 hover:bg-seguranca-black">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => remove(d.id)} className="border-gray-600 text-red-400 hover:bg-seguranca-black">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.total === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">Nenhum departamento encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* Paginação */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                <div>
                  {filtered.total} registro(s) • Página {filtered.page} de {filtered.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filtered.page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="border-gray-600 text-gray-300 hover:bg-seguranca-black"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filtered.page >= filtered.totalPages}
                    onClick={() => setPage(p => Math.min(filtered.totalPages, p + 1))}
                    className="border-gray-600 text-gray-300 hover:bg-seguranca-black"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-seguranca-black text-seguranca-lightgray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-seguranca-yellow">{editing ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm">Nome</label>
              <Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Descrição</label>
              <Input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-600 text-gray-300 hover:bg-seguranca-black">Cancelar</Button>
              <Button onClick={save} className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90">Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departamentos;


