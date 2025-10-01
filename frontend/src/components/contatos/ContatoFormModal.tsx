
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContatoFormData {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cargo: string;
  endereco: string;
  observacoes: string;
  tipo: string;
  status: string;
}

interface ContatoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contato?: any;
  onSuccess: () => void;
}

export const ContatoFormModal: React.FC<ContatoFormModalProps> = ({
  open,
  onOpenChange,
  contato,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContatoFormData>({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    cargo: '',
    endereco: '',
    observacoes: '',
    tipo: 'cliente',
    status: 'ativo'
  });

  useEffect(() => {
    if (contato) {
      setFormData({
        nome: contato.nome || '',
        email: contato.email || '',
        telefone: contato.telefone || '',
        empresa: contato.empresa || '',
        cargo: contato.cargo || '',
        endereco: contato.endereco || '',
        observacoes: contato.observacoes || '',
        tipo: contato.tipo || 'cliente',
        status: contato.status || 'ativo'
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        empresa: '',
        cargo: '',
        endereco: '',
        observacoes: '',
        tipo: 'cliente',
        status: 'ativo'
      });
    }
  }, [contato, open]);

  const handleInputChange = (field: keyof ContatoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (contato) {
        // Atualizar contato existente
        const { error } = await supabase
          .from('contatos')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', contato.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Contato atualizado com sucesso!",
        });
      } else {
        // Criar novo contato
        const { error } = await supabase
          .from('contatos')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Contato criado com sucesso!",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar contato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">
            {contato ? 'Editar Contato' : 'Novo Contato'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome" className="text-seguranca-lightgray">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-seguranca-lightgray">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone" className="text-seguranca-lightgray">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <Label htmlFor="empresa" className="text-seguranca-lightgray">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => handleInputChange('empresa', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cargo" className="text-seguranca-lightgray">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleInputChange('cargo', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <Label htmlFor="tipo" className="text-seguranca-lightgray">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                <SelectTrigger className="form-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  <SelectItem value="parceiro">Parceiro</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="endereco" className="text-seguranca-lightgray">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => handleInputChange('endereco', e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <Label htmlFor="observacoes" className="text-seguranca-lightgray">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              className="form-input"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger className="form-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-seguranca-graphite text-seguranca-lightgray border-gray-600 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Salvando...' : (contato ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
