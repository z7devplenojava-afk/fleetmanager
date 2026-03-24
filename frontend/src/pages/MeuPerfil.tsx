import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Loader2,
  Save,
  Lock,
  AlertTriangle
} from 'lucide-react';
import api from '@/lib/axios';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  whatsapp: string;
  roles: string[];
  status: string;
  active: boolean;
  firstAccess: boolean;
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  createdAt: string;
  updatedAt: string;
}

const MeuPerfil = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        whatsapp: response.data.whatsapp || ''
      });
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await api.put('/api/profile', formData);
      
      if (response.data.success) {
        toast({
          title: "Sucesso!",
          description: response.data.message,
        });
        loadProfile(); // Recarregar dados
      }
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-purple-500',
      'ADMIN': 'bg-red-500',
      'RH': 'bg-blue-500',
      'SUPERVISOR': 'bg-green-500',
      'FINANCEIRO': 'bg-yellow-500',
      'COLABORADOR': 'bg-gray-500',
      'VIGILANTE': 'bg-orange-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando perfil...</span>
        </div>
      </StandardLayout>
    );
  }

  if (!profile) {
    return (
      <StandardLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Não foi possível carregar seu perfil. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header - Padrão SST */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-seguranca-yellow" />
              Meu Perfil
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Gerencie suas informações pessoais</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Pessoais */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Dados Pessoais
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-400">
                  Atualize suas informações de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs sm:text-sm text-seguranca-lightgray">
                    Usuário
                  </Label>
                  <Input
                    id="username"
                    value={profile.username}
                    disabled
                    className="bg-seguranca-black border-gray-600 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400">Usuário não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs sm:text-sm text-seguranca-lightgray">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm text-seguranca-lightgray flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-xs sm:text-sm text-seguranca-lightgray flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="5511999999999"
                  />
                  <p className="text-xs text-gray-400">
                    Apenas números (DDI + DDD + Número)
                  </p>
                </div>

                <div className="flex justify-end pt-2 sm:pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto h-10 text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Informações de Segurança */}
          <div className="space-y-6">
            {/* Status da Conta */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  Status da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status:</span>
                  <Badge className={profile.active ? 'bg-green-500' : 'bg-red-500'}>
                    {profile.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">2FA:</span>
                  {profile.twoFactorEnabled ? (
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Ativado
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <XCircle className="h-4 w-4" />
                      Desativado
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Primeiro Acesso:</span>
                  {profile.firstAccess ? (
                    <span className="text-yellow-400 text-sm">Sim</span>
                  ) : (
                    <span className="text-green-400 text-sm">Concluído</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Perfis de Acesso */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  Perfis de Acesso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <Badge 
                      key={role}
                      className={`${getRoleColor(role)} text-white`}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informações da Conta */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div>
                  <p className="text-gray-400">Criado em:</p>
                  <p className="text-seguranca-lightgray">
                    {new Date(profile.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">Última atualização:</p>
                  <p className="text-seguranca-lightgray">
                    {new Date(profile.updatedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {profile.lastPasswordChange && (
                  <div>
                    <p className="text-gray-400">Última alteração de senha:</p>
                    <p className="text-seguranca-lightgray">
                      {new Date(profile.lastPasswordChange).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações de Segurança */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button 
                  variant="outline"
                  className="w-full border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-9 sm:h-10 text-xs sm:text-sm"
                  onClick={() => {
                    // TODO: Implementar mudança de senha
                    toast({
                      title: "Em desenvolvimento",
                      description: "Funcionalidade de mudança de senha em breve.",
                    });
                  }}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>

                {!profile.twoFactorEnabled && (
                  <Button
                    variant="outline"
                    className="w-full border-yellow-600 text-yellow-500 hover:bg-yellow-900/20 h-9 sm:h-10 text-xs sm:text-sm"
                    onClick={() => window.location.href = '/first-access/activate-2fa'}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Ativar 2FA
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default MeuPerfil;

