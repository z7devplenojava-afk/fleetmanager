import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { User, Loader2, Save } from 'lucide-react';
import { Funcionario } from '@/types/funcionario';
import { funcionarioService } from '@/services/funcionarioService';

interface FuncionarioFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario?: Funcionario;
  onSuccess: () => void;
}

export const FuncionarioFormModal: React.FC<FuncionarioFormModalProps> = ({
  open,
  onOpenChange,
  funcionario,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    possuiWhatsapp: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const isEditing = !!funcionario;

  // Carregar dados do funcionário quando estiver editando
  useEffect(() => {
    if (funcionario) {
      setFormData({
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        email: funcionario.email || '',
        telefone: funcionario.telefone || '',
        possuiWhatsapp: funcionario.possuiWhatsapp
      });
    } else {
      setFormData({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        possuiWhatsapp: false
      });
    }
    setErrors({});
  }, [funcionario, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.possuiWhatsapp && !formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório quando possui WhatsApp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const funcionarioData = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        possuiWhatsapp: formData.possuiWhatsapp
      };

      if (isEditing && funcionario) {
        await funcionarioService.updateFuncionario(funcionario.id, funcionarioData);
        toast({
          title: "Funcionário Atualizado",
          description: "Funcionário atualizado com sucesso!",
        });
      } else {
        await funcionarioService.createFuncionario(funcionarioData);
        toast({
          title: "Funcionário Criado",
          description: "Funcionário criado com sucesso!",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao salvar funcionário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const formatCPF = (value: string) => {
    const cpf = value.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <User className="text-seguranca-yellow" size={20} />
            {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-seguranca-lightgray">
              Nome Completo *
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome completo"
              className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${
                errors.nome ? 'border-red-500' : ''
              }`}
            />
            {errors.nome && (
              <p className="text-red-400 text-sm">{errors.nome}</p>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-seguranca-lightgray">
              CPF *
            </Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
              placeholder="000.000.000-00"
              maxLength={14}
              className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${
                errors.cpf ? 'border-red-500' : ''
              }`}
            />
            {errors.cpf && (
              <p className="text-red-400 text-sm">{errors.cpf}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-seguranca-lightgray">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="funcionario@email.com"
              className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${
                errors.email ? 'border-red-500' : ''
              }`}
            />
            {errors.email && (
              <p className="text-red-400 text-sm">{errors.email}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-seguranca-lightgray">
              Telefone
            </Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
              placeholder="(11) 99999-9999"
              maxLength={15}
              className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${
                errors.telefone ? 'border-red-500' : ''
              }`}
            />
            {errors.telefone && (
              <p className="text-red-400 text-sm">{errors.telefone}</p>
            )}
          </div>

          {/* Possui WhatsApp */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="possuiWhatsapp"
              checked={formData.possuiWhatsapp}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, possuiWhatsapp: checked as boolean })
              }
            />
            <Label htmlFor="possuiWhatsapp" className="text-seguranca-lightgray">
              Possui WhatsApp
            </Label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Atualizar' : 'Criar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 