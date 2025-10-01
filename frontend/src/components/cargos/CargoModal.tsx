import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { positionService, Position, PositionCreateDTO, PositionUpdateDTO } from '@/services/positionService';
import { useToast } from '@/hooks/use-toast';

interface CargoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  position: Position | null;
}

const CargoModal: React.FC<CargoModalProps> = ({ open, onClose, onSave, position }) => {
  const [formData, setFormData] = useState({ name: '', description: '', baseSalary: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name,
        description: position.description,
        baseSalary: String(position.baseSalary),
      });
    } else {
      setFormData({ name: '', description: '', baseSalary: '' });
    }
  }, [position, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const salary = parseFloat(formData.baseSalary);
    if (isNaN(salary)) {
        setError('Salário base deve ser um número válido.');
        setLoading(false);
        return;
    }

    try {
      if (position) {
        const updatedData: PositionUpdateDTO = { name: formData.name, description: formData.description, baseSalary: salary };
        await positionService.updatePosition(position.id, updatedData);
        toast({ title: 'Sucesso', description: 'Cargo atualizado com sucesso.' });
      } else {
        const newData: PositionCreateDTO = { name: formData.name, description: formData.description, baseSalary: salary };
        await positionService.createPosition(newData);
        toast({ title: 'Sucesso', description: 'Cargo criado com sucesso.' });
      }
      onSave();
      onClose();
    } catch (err) {
      setError('Ocorreu um erro ao salvar o cargo. Verifique os dados e tente novamente.');
      toast({ title: 'Erro', description: 'Não foi possível salvar o cargo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{position ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="baseSalary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Salário Base</label>
            <Input id="baseSalary" name="baseSalary" type="number" step="0.01" value={formData.baseSalary} onChange={handleChange} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CargoModal;