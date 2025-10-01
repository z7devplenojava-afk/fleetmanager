import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { positionService } from '@/services/positionService';
import { useToast } from '@/hooks/use-toast';
import { Briefcase } from 'lucide-react';

interface NovoCargoModalProps {
  open: boolean;
  onClose: () => void;
  onCargoCreated: (cargo: { id: string; name: string; description: string }) => void;
}

const NovoCargoModal: React.FC<NovoCargoModalProps> = ({ open, onClose, onCargoCreated }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setError('Nome do cargo é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const newCargo = await positionService.createPosition({
        name: form.name.trim(),
        description: form.description.trim(),
        baseSalary: 0
      });
      
      toast({
        title: "Sucesso",
        description: "Cargo criado com sucesso!",
      });
      
      onCargoCreated(newCargo);
      onClose();
      setForm({ name: '', description: '' });
    } catch (err) {
      setError('Erro ao criar cargo. Tente novamente.');
      toast({
        title: "Erro",
        description: "Não foi possível criar o cargo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', description: '' });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center">
            <Briefcase className="mr-2" size={20} />
            Novo Cargo
          </DialogTitle>
          <p className="text-sm text-gray-400">
            Preencha os dados do novo cargo.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              Nome do Cargo * <span className="text-red-400">*</span>
            </Label>
            <Input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="Ex: Analista de Segurança"
              required 
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">
              Descrição
            </Label>
            <Textarea
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              placeholder="Descrição das responsabilidades do cargo..."
              rows={3}
            />
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !form.name.trim()}
              className="w-full sm:w-auto"
            >
              {loading ? 'Criando...' : 'Criar Cargo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovoCargoModal;
