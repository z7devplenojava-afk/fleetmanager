import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, User, Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService, CreateUserRequest, UpdateUserRequest, User as UserType } from '@/services/userService';
import { companyService } from '@/services/companyService';
import { getRoleDisplayName, USER_ROLE_LIST } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { extractApiErrorMessage } from '@/utils/apiError';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserType | null;
  mode: 'create' | 'edit';
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  mode
}) => {
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);

  const isFlexAdmin = hasRole('FLEX_ADMIN') || hasRole('SUPER_ADMIN');

  const AVAILABLE_ROLES = USER_ROLE_LIST
    .filter(role => {
      // Se não for FlexAdmin, esconder papéis globais/sensíveis
      if (!isFlexAdmin) {
        return role !== 'FLEX_ADMIN' && role !== 'SUPER_ADMIN' && role !== 'TI_SUPORTE';
      }
      return true;
    })
    .map(role => ({
      value: role,
      label: getRoleDisplayName(role),
    }));

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    whatsapp: '',
    roles: [] as string[],
    active: true,
    companyId: ''
  });

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          name: user.name || '',
          username: user.username || '',
          email: user.email || '',
          password: '', // Don't pre-fill password
          whatsapp: user.whatsapp || '',
          roles: user.roles || [],
          active: user.active,
          companyId: user.companyId || ''
        });
      } else {
        setFormData({
          name: '',
          username: '',
          email: '',
          password: '',
          whatsapp: '',
          roles: [],
          active: true,
          companyId: ''
        });
      }

      if (isFlexAdmin) {
        loadCompanies();
      }
    }
  }, [isOpen, mode, user, isFlexAdmin]);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoleToggle = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.username || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome, usuário e email são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'create' && !formData.password) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória para novos usuários.",
        variant: "destructive"
      });
      return;
    }

    // Mesma regra do backend: maiúscula + minúscula + número + especial (ou CPF@2025)
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).*$/;
    const isCpfDefault = /^\d{11}@2025$/.test(formData.password);
    if (formData.password && !isCpfDefault && !passwordRegex.test(formData.password)) {
      toast({
        title: "Erro",
        description: "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'create' && (!formData.roles || formData.roles.length === 0)) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma permissão (role).",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      if (mode === 'create') {
        const createData: CreateUserRequest = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          whatsapp: formData.whatsapp || undefined,
          roles: formData.roles, // Backend espera array de strings!
          active: formData.active,
          companyId: formData.companyId || undefined
        };

        await userService.createUser(createData);

        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso.",
        });
      } else if (mode === 'edit' && user) {
        const updateData: UpdateUserRequest = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          whatsapp: formData.whatsapp || undefined,
          roles: formData.roles, // Backend espera array de strings!
          active: formData.active,
          companyId: formData.companyId || undefined
        };

        // Only include password if it's provided
        if (formData.password) {
          (updateData as any).password = formData.password;
        }

        await userService.updateUser(user.id, updateData);

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso.",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error?.response?.status, error?.response?.data);
      toast({
        title: "Erro",
        description: extractApiErrorMessage(error, "Não foi possível salvar o usuário."),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'create' ? 'Adicionar Usuário' : 'Editar Usuário'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {mode === 'create'
              ? 'Preencha os dados para criar um novo usuário no sistema.'
              : 'Atualize as informações do usuário.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-seguranca-lightgray">
                Nome Completo *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                placeholder="Ex: João Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-seguranca-lightgray">
                Nome de Usuário *
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                placeholder="Ex: joao.silva"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-seguranca-lightgray flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                placeholder="Ex: joao@empresa.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-seguranca-lightgray">
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleInputChange('whatsapp', value);
                }}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                placeholder="Somente números (ex: 11999999999)"
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-seguranca-lightgray flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Senha {mode === 'create' ? '*' : '(deixe em branco para manter a atual)'}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow pr-10"
                placeholder={mode === 'create' ? 'Digite uma senha segura' : 'Digite nova senha (opcional)'}
                required={mode === 'create'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {isFlexAdmin && (
            <div className="space-y-2">
              <Label htmlFor="companyId" className="text-seguranca-lightgray flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa *
              </Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => handleInputChange('companyId', value)}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-seguranca-lightgray">Permissões</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_ROLES.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.value}
                    checked={formData.roles.includes(role.value)}
                    onCheckedChange={(checked) => handleRoleToggle(role.value, checked as boolean)}
                  />
                  <Label
                    htmlFor={role.value}
                    className="text-sm text-seguranca-lightgray cursor-pointer"
                  >
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleInputChange('active', checked as boolean)}
            />
            <Label htmlFor="active" className="text-seguranca-lightgray">
              Usuário ativo
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
