import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  Edit, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileFormData {
  name: string;
  email: string;
  whatsapp: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    whatsapp: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Carregar dados do usuário quando o modal abrir
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: profile?.full_name || user.name || '',
        email: user.email || '',
        whatsapp: profile?.whatsapp || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [isOpen, user, profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    // Validação específica para WhatsApp - apenas números
    if (field === 'whatsapp') {
      const numericValue = value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
      setFormData(prev => ({
        ...prev,
        [field]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return false;
    }

    // Validar WhatsApp se preenchido
    if (formData.whatsapp && formData.whatsapp.length > 0) {
      if (formData.whatsapp.length < 9 || formData.whatsapp.length > 20) {
        toast.error('WhatsApp deve ter entre 9 e 20 dígitos');
        return false;
      }
    }

    // Se está alterando senha, validar campos de senha
    if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        toast.error('Senha atual é obrigatória para alterar a senha');
        return false;
      }

      if (!formData.newPassword) {
        toast.error('Nova senha é obrigatória');
        return false;
      }

      if (formData.newPassword.length < 6) {
        toast.error('Nova senha deve ter pelo menos 6 caracteres');
        return false;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Confirmação de senha não confere');
        return false;
      }

      // Validar força da senha
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).*$/;
      if (!passwordRegex.test(formData.newPassword)) {
        toast.error('Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        whatsapp: formData.whatsapp.trim() || null
      };

      // Se está alterando senha, incluir os campos de senha
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // Fazer a requisição para atualizar o perfil
      const response = await api.put('/users/profile', updateData);
      
      if (response.status === 200) {
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);
        
        // Limpar campos de senha
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        // Atualizar dados do usuário no contexto
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      
      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Dados inválidos';
        toast.error(message);
      } else if (error.response?.status === 401) {
        toast.error('Senha atual incorreta');
      } else if (error.response?.status === 403) {
        toast.error('Acesso negado. Você não tem permissão para atualizar o perfil.');
      } else if (error.response?.status === 404) {
        toast.error('Usuário não encontrado.');
      } else if (error.response?.status >= 500) {
        toast.error('Erro interno do servidor. Tente novamente mais tarde.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        toast.error('Erro ao atualizar perfil. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.full_name || user?.name || '',
      email: user?.email || '',
      whatsapp: profile?.whatsapp || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'SUPER_ADMIN': 'Super Administrador',
      'ADMIN': 'Administrador',
      'SUPERVISOR': 'Supervisor',
      'RH': 'Recursos Humanos',
      'FINANCEIRO': 'Financeiro',
      'TI_SUPORTE': 'TI / Suporte',
      'AUDITOR': 'Auditor',
      'COLABORADOR': 'Colaborador',
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800 border-red-200',
      'ADMIN': 'bg-blue-100 text-blue-800 border-blue-200',
      'SUPERVISOR': 'bg-green-100 text-green-800 border-green-200',
      'RH': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'FINANCEIRO': 'bg-orange-100 text-orange-800 border-orange-200',
      'TI_SUPORTE': 'bg-purple-100 text-purple-800 border-purple-200',
      'AUDITOR': 'bg-gray-100 text-gray-800 border-gray-200',
      'COLABORADOR': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-seguranca-yellow" />
            Meu Perfil
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray/70">
            Visualize e edite suas informações pessoais
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Usuário */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-seguranca-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={40} className="text-seguranca-black" />
              </div>
              <CardTitle className="text-seguranca-lightgray text-lg">
                {formData.name || 'Nome não informado'}
              </CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className={`${getRoleColor(user.role)} text-xs`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {getRoleDisplayName(user.role)}
                </Badge>
                {user.role === 'SUPER_ADMIN' && (
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                    🟥
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Formulário de Edição */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Edit className="h-4 w-4 text-seguranca-yellow" />
                  Informações Pessoais
                </CardTitle>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      size="sm"
                      className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-seguranca-black border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="border-gray-500 text-gray-300 hover:bg-gray-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-seguranca-lightgray">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray disabled:opacity-50"
                  placeholder="Digite seu nome completo"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-seguranca-lightgray">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray disabled:opacity-50 pl-10"
                    placeholder="Digite seu email"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-seguranca-lightgray">
                  WhatsApp
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    disabled={!isEditing}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray disabled:opacity-50 pl-10"
                    placeholder="Digite seu WhatsApp (apenas números)"
                  />
                </div>
              </div>

              {/* Alteração de Senha */}
              {isEditing && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-seguranca-yellow" />
                    <Label className="text-seguranca-lightgray font-medium">
                      Alterar Senha
                    </Label>
                  </div>

                  {/* Senha Atual */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-seguranca-lightgray">
                      Senha Atual
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray pr-10"
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-seguranca-lightgray"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nova Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-seguranca-lightgray">
                      Nova Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray pr-10"
                        placeholder="Digite sua nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-seguranca-lightgray"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-seguranca-lightgray">
                      Confirmar Nova Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray pr-10"
                        placeholder="Confirme sua nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-seguranca-lightgray"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Dicas de Senha */}
                  <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-seguranca-yellow mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-seguranca-lightgray/80">
                        <p className="font-medium mb-1">Requisitos da senha:</p>
                        <ul className="space-y-1">
                          <li>• Pelo menos 6 caracteres</li>
                          <li>• Uma letra maiúscula</li>
                          <li>• Uma letra minúscula</li>
                          <li>• Um número</li>
                          <li>• Um caractere especial</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
