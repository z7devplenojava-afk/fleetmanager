import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Save, X, Eye, EyeOff, Building } from 'lucide-react';
import { UserRole } from '@/types/user';
import { getRoleDisplayName, getRoleColor, USER_ROLE_LIST } from '@/utils/permissions';
import { userService } from '@/services/userService';
import { companyService } from '@/services/companyService';
import { useToast } from '@/hooks/use-toast';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  companyId?: string;
}


export const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  companyId,
}) => {
  const { hasRole, empresa: currentEmpresa } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companyId || '');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole,
    whatsapp: '',
  });

  const isSuperAdmin = hasRole('SUPER_ADMIN') || hasRole('FLEX_ADMIN');

  useEffect(() => {
    if (isSuperAdmin && isOpen) {
      loadCompanies();
    }
  }, [isSuperAdmin, isOpen]);

  useEffect(() => {
    if (companyId) {
      setSelectedCompanyId(companyId);
    } else if (!isSuperAdmin && currentEmpresa?.id) {
      setSelectedCompanyId(currentEmpresa.id);
    }
  }, [companyId, currentEmpresa, isSuperAdmin]);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    // Validações
    if (!formData.username || !formData.email || !formData.name || !formData.password || !formData.role) {
      toast({
        title: 'Erro!',
        description: 'Todos os campos obrigatórios devem ser preenchidos.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro!',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erro!',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    // Validar formato da senha (pelo menos uma maiúscula, uma minúscula, um número e um caractere especial)
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).*$/;
    if (!passwordRegex.test(formData.password)) {
      toast({
        title: 'Erro!',
        description: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        name: formData.name,
        password: formData.password,
        roles: [formData.role], // Backend espera array de STRINGS!
        whatsapp: formData.whatsapp || undefined,
        status: "ACTIVE",
        active: true,
        companyId: selectedCompanyId || undefined
      };

      await userService.createUser(userData);
      toast({
        title: 'Sucesso!',
        description: 'Usuário criado com sucesso.',
      });

      // Limpar formulário
      setFormData({
        username: '',
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
        role: '' as UserRole,
        whatsapp: '',
      });

      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro!',
        description: error.response?.data?.message || 'Erro ao criar usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Limpar formulário ao fechar
    setFormData({
      username: '',
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: '' as UserRole,
      whatsapp: '',
    });
    onClose();
  };

  const isFormValid = formData.username &&
    formData.email &&
    formData.name &&
    formData.password &&
    formData.confirmPassword &&
    formData.role &&
    formData.password === formData.confirmPassword &&
    formData.password.length >= 6;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-seguranca-red" />
            Criar Novo Usuário
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Preencha as informações para criar um novo usuário no sistema. Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-seguranca-lightgray">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-seguranca-lightgray">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Digite o email"
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
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Digite o nome de usuário"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-seguranca-lightgray">
                    Função *
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value as UserRole)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {USER_ROLE_LIST
                        .filter(role => {
                          const isFlexAdmin = hasRole('FLEX_ADMIN') || hasRole('SUPER_ADMIN');
                          if (!isFlexAdmin) {
                            return role !== 'FLEX_ADMIN' && role !== 'SUPER_ADMIN' && role !== 'TI_SUPORTE';
                          }
                          return true;
                        })
                        .map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <Badge className={getRoleColor(role)}>
                                {getRoleDisplayName(role)}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seleção de Empresa */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-seguranca-lightgray">
                    Empresa *
                  </Label>
                  {isSuperAdmin ? (
                    <Select
                      value={selectedCompanyId}
                      onValueChange={setSelectedCompanyId}
                    >
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="company-name"
                      value={currentEmpresa?.nome || 'Empresa não identificada'}
                      readOnly
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray opacity-70 cursor-not-allowed"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-seguranca-lightgray">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => {
                      // Aceita apenas números
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData((prev) => ({ ...prev, whatsapp: value }));
                    }}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Somente números (ex: 11999999999)"
                    maxLength={20}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Senha */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Senha de Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-seguranca-lightgray">
                    Senha *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray pr-10"
                      placeholder="Digite a senha"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-seguranca-lightgray">
                    Confirmar Senha *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Confirme a senha"
                  />
                </div>
              </div>

              {/* Requisitos da senha */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Requisitos da senha:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Mínimo de 6 caracteres</li>
                  <li>• Pelo menos uma letra maiúscula</li>
                  <li>• Pelo menos uma letra minúscula</li>
                  <li>• Pelo menos um número</li>
                  <li>• Pelo menos um caractere especial</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Informações Importantes */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Após a criação, o usuário poderá fazer login imediatamente
                  com as credenciais fornecidas. Recomenda-se que o usuário altere sua senha no primeiro acesso.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !isFormValid}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 