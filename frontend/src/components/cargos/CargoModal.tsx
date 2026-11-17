import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { positionService, Position } from '@/services/positionService';
import { cboService } from '@/services/cboService';
import { useToast } from '@/hooks/use-toast';

interface CargoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  position: Position | null;
}

const CargoModal: React.FC<CargoModalProps> = ({ open, onClose, onSave, position }) => {
  const [formData, setFormData] = useState({ name: '', cbo: '', description: '', baseSalary: '0' });
  const [userEditedCbo, setUserEditedCbo] = useState(false);
  const [userEditedDesc, setUserEditedDesc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name || '',
        cbo: position.cbo || '',
        description: position.description || '',
        baseSalary: position.baseSalary != null ? String(position.baseSalary) : '0',
      });
      setUserEditedCbo(Boolean(position.cbo));
      setUserEditedDesc(Boolean(position.description));
    } else {
      setFormData({ name: '', cbo: '', description: '', baseSalary: '0' });
      setUserEditedCbo(false);
      setUserEditedDesc(false);
    }
  }, [position, open]);

  useEffect(() => {
    const term = formData.name.trim();
    if (!term || term.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const cbos = await cboService.searchCBO(term);
        if (cbos && cbos.length > 0) {
          const best = cbos[0];
          const autoDesc = best.descricao || `${best.titulo}${best.sinonimo ? ` (${best.sinonimo})` : ''}`;
          setFormData(prev => ({
            ...prev,
            cbo: userEditedCbo && prev.cbo ? prev.cbo : best.codigo,
            description: userEditedDesc && prev.description ? prev.description : autoDesc,
          }));
        }
      } catch {
        // silencioso
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.name, userEditedCbo, userEditedDesc]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'cbo') setUserEditedCbo(value.trim().length > 0);
    if (name === 'description') setUserEditedDesc(value.trim().length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const salary = formData.baseSalary ? parseFloat(formData.baseSalary) : 0;
    const safeSalary = isNaN(salary) || salary < 0 ? 0 : salary;

    try {
      const payload = {
        name: formData.name.trim(),
        cbo: formData.cbo.trim() || undefined,
        description: formData.description.trim(),
        baseSalary: safeSalary,
      };

      if (position) {
        await positionService.updatePosition(position.id, payload);
        toast({ title: 'Sucesso', description: 'Cargo atualizado com sucesso.' });
      } else {
        await positionService.createPosition(payload);
        toast({ title: 'Sucesso', description: 'Cargo criado com sucesso.' });
      }
      onSave();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Ocorreu um erro ao salvar o cargo.';
      setError(msg);
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{position ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1">Nome do Cargo</label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="bg-slate-950 border-slate-700 text-white" />
          </div>
          <div>
            <label htmlFor="cbo" className="block text-sm font-medium text-slate-200 mb-1">CBO (Código Brasileiro de Ocupação)</label>
            <Input id="cbo" name="cbo" value={formData.cbo} onChange={handleChange} placeholder="Ex: 9144-25" className="bg-slate-950 border-slate-700 text-white" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-1">Descrição</label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="bg-slate-950 border-slate-700 text-white" />
          </div>
          <div>
            <label htmlFor="baseSalary" className="block text-sm font-medium text-slate-200 mb-1">Salário Base (Opcional)</label>
            <Input id="baseSalary" name="baseSalary" type="number" step="0.01" value={formData.baseSalary} onChange={handleChange} className="bg-slate-950 border-slate-700 text-white" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="border-slate-700 text-slate-300">Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-500 text-white">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CargoModal;
