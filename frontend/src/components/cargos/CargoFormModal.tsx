import React, { useState, useEffect } from 'react';
import { Position, PositionCreateDTO, PositionUpdateDTO } from '@/services/positionService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Unit {
  id: string;
  name: string;
}

interface CargoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cargo: PositionCreateDTO | PositionUpdateDTO) => void;
  cargoInicial: Position | null;
  isLoading: boolean;
  units: Unit[];
}

const CargoFormModal: React.FC<CargoFormModalProps> = ({ isOpen, onClose, onSave, cargoInicial, isLoading, units }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PositionCreateDTO | PositionUpdateDTO>({ 
    name: '', 
    description: '', 
    baseSalary: 0,
    unitId: undefined
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (cargoInicial) {
      setFormData({
        name: cargoInicial.name,
        description: cargoInicial.description || '',
        baseSalary: cargoInicial.baseSalary || 0,
        unitId: cargoInicial.unitId,
      });
    } else {
      setFormData({ name: '', description: '', baseSalary: 0, unitId: '' });
    }
    setErrors({});
  }, [cargoInicial, isOpen]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'O nome do cargo é obrigatório.';
    }
    if (formData.baseSalary <= 0) {
      newErrors.baseSalary = 'O salário base deve ser um valor positivo.';
    }
    // unitId é opcional, não precisa validar
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    } else {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor, corrija os campos marcados.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
        <DialogHeader>
          <DialogTitle>{cargoInicial ? 'Editar Cargo' : 'Criar Novo Cargo'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`col-span-3 bg-seguranca-black border-gray-600 ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="col-span-4 text-red-500 text-sm text-right">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3 bg-seguranca-black border-gray-600"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="baseSalary" className="text-right">Salário Base *</Label>
            <Input
              id="baseSalary"
              type="number"
              value={formData.baseSalary}
              onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
              className={`col-span-3 bg-seguranca-black border-gray-600 ${errors.baseSalary ? 'border-red-500' : ''}`}
            />
            {errors.baseSalary && <p className="col-span-4 text-red-500 text-sm text-right">{errors.baseSalary}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unitId" className="text-right">Unidade</Label>
            <Select
              value={formData.unitId || ''}
              onValueChange={(value) => setFormData({ ...formData, unitId: value || undefined })}
            >
              <SelectTrigger className="col-span-3 bg-seguranca-black border-gray-600">
                <SelectValue placeholder="Selecione uma unidade (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-black border-gray-600">
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="hover:bg-seguranca-black">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isLoading} className="bg-seguranca-red hover:bg-seguranca-darkred">
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CargoFormModal;
