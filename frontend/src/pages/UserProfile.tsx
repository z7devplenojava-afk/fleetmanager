import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Shield, 
  Key, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const UserProfile: React.FC = () => {
  const { user, profile } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Usuário não encontrado</p>
      </div>
    );
  }

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

  const getPermissionStatus = (permission: string) => {
    if (user.permissions.ALL_PERMISSIONS) return true;
    return user.permissions[permission as keyof typeof user.permissions] || false;
  };

  const permissions = [
    { key: 'DASHBOARD_READ', label: 'Visualizar Dashboard', description: 'Acesso ao painel principal' },
    { key: 'EMPLOYEES_READ', label: 'Visualizar Funcionários', description: 'Acesso à lista de funcionários' },
    { key: 'EMPLOYEES_WRITE', label: 'Gerenciar Funcionários', description: 'Criar, editar e excluir funcionários' },
    { key: 'USERS_READ', label: 'Visualizar Usuários', description: 'Acesso à lista de usuários do sistema' },
    { key: 'USERS_WRITE', label: 'Gerenciar Usuários', description: 'Criar, editar e excluir usuários' },
    { key: 'GROUPS_READ', label: 'Visualizar Grupos', description: 'Acesso à lista de grupos de usuários' },
    { key: 'GROUPS_WRITE', label: 'Gerenciar Grupos', description: 'Criar, editar e excluir grupos' },
    { key: 'ROLES_READ', label: 'Visualizar Roles', description: 'Acesso à lista de roles do sistema' },
    { key: 'ROLES_WRITE', label: 'Gerenciar Roles', description: 'Criar, editar e excluir roles' },
    { key: 'FINANCIAL_READ', label: 'Visualizar Financeiro', description: 'Acesso aos dados financeiros' },
    { key: 'FINANCIAL_WRITE', label: 'Gerenciar Financeiro', description: 'Criar, editar e excluir dados financeiros' },
    { key: 'REPORTS_READ', label: 'Visualizar Relatórios', description: 'Acesso aos relatórios do sistema' },
    { key: 'REPORTS_WRITE', label: 'Gerar Relatórios', description: 'Criar e exportar relatórios' },
    { key: 'SYSTEM_CONFIG', label: 'Configurações do Sistema', description: 'Acesso às configurações avançadas' },
    { key: 'CLIENTS_READ', label: 'Visualizar Clientes', description: 'Acesso à lista de clientes' },
    { key: 'CLIENTS_WRITE', label: 'Gerenciar Clientes', description: 'Criar, editar e excluir clientes' },
    { key: 'CONTRACTS_READ', label: 'Visualizar Contratos', description: 'Acesso à lista de contratos' },
    { key: 'CONTRACTS_WRITE', label: 'Gerenciar Contratos', description: 'Criar, editar e excluir contratos' },
    { key: 'PAYSLIPS_READ', label: 'Visualizar Holerites', description: 'Acesso aos holerites' },
    { key: 'PAYSLIPS_WRITE', label: 'Gerenciar Holerites', description: 'Criar e processar holerites' },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-seguranca-lightgray">Perfil do Usuário</h1>
          <p className="text-seguranca-lightgray/70">Informações pessoais e permissões do sistema</p>
        </div>
        <Button variant="outline" className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black">
          Editar Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Pessoais */}
        <div className="lg:col-span-1">
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader className="text-center pb-4">
              <div className="w-24 h-24 bg-seguranca-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={48} className="text-seguranca-black" />
              </div>
              <CardTitle className="text-seguranca-lightgray text-xl">
                {profile?.full_name || user.name || 'Nome não informado'}
              </CardTitle>
              <CardDescription className="text-seguranca-lightgray/70">
                {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="text-seguranca-yellow" size={20} />
                <div>
                  <p className="text-sm text-seguranca-lightgray/70">Role</p>
                  <Badge className={`${getRoleColor(user.role)} text-sm font-medium`}>
                    {getRoleDisplayName(user.role)}
                    {user.role === 'SUPER_ADMIN' && ' 🟥'}
                  </Badge>
                </div>
              </div>
              
              <Separator className="bg-gray-700" />
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="text-seguranca-lightgray/50" size={16} />
                  <span className="text-sm text-seguranca-lightgray">{user.email}</span>
                </div>
                
                {profile?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="text-seguranca-lightgray/50" size={16} />
                    <span className="text-sm text-seguranca-lightgray">{profile.phone}</span>
                  </div>
                )}
                
                {profile?.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="text-seguranca-lightgray/50" size={16} />
                    <span className="text-sm text-seguranca-lightgray">{profile.address}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="text-seguranca-lightgray/50" size={16} />
                  <span className="text-sm text-seguranca-lightgray">
                    Membro desde {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissões do Sistema */}
        <div className="lg:col-span-2">
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Key className="text-seguranca-yellow" size={20} />
                Permissões do Sistema
              </CardTitle>
              <CardDescription className="text-seguranca-lightgray/70">
                {user.permissions.ALL_PERMISSIONS 
                  ? 'Você possui todas as permissões do sistema (SUPER_ADMIN)'
                  : `Você possui ${permissions.filter(p => getPermissionStatus(p.key)).length} de ${permissions.length} permissões`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissions.map((permission) => {
                  const hasPermission = getPermissionStatus(permission.key);
                  return (
                    <div 
                      key={permission.key}
                      className={`p-4 rounded-lg border ${
                        hasPermission 
                          ? 'bg-green-900/20 border-green-700' 
                          : 'bg-red-900/20 border-red-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {hasPermission ? (
                            <CheckCircle className="text-green-500" size={16} />
                          ) : (
                            <XCircle className="text-red-500" size={16} />
                          )}
                          <span className={`text-sm font-medium ${
                            hasPermission ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {permission.label}
                          </span>
                        </div>
                        <Badge 
                          variant={hasPermission ? 'default' : 'secondary'}
                          className={`text-xs ${
                            hasPermission 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {hasPermission ? 'Permitido' : 'Negado'}
                        </Badge>
                      </div>
                      <p className="text-xs text-seguranca-lightgray/70">
                        {permission.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas de Uso */}
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">Estatísticas de Uso</CardTitle>
          <CardDescription className="text-seguranca-lightgray/70">
            Informações sobre o uso do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-seguranca-black/50 rounded-lg">
              <div className="text-2xl font-bold text-seguranca-yellow">24</div>
              <div className="text-sm text-seguranca-lightgray/70">Dias ativo</div>
            </div>
            <div className="text-center p-4 bg-seguranca-black/50 rounded-lg">
              <div className="text-2xl font-bold text-seguranca-yellow">156</div>
              <div className="text-sm text-seguranca-lightgray/70">Logins realizados</div>
            </div>
            <div className="text-center p-4 bg-seguranca-black/50 rounded-lg">
              <div className="text-2xl font-bold text-seguranca-yellow">89%</div>
              <div className="text-sm text-seguranca-lightgray/70">Taxa de atividade</div>
            </div>
            <div className="text-center p-4 bg-seguranca-black/50 rounded-lg">
              <div className="text-2xl font-bold text-seguranca-yellow">12</div>
              <div className="text-sm text-seguranca-lightgray/70">Módulos acessados</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
