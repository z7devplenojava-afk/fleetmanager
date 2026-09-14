import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/axios';
import { User, AuthContextType, UserGroupData, UserRole, EmpresaInfo } from '@/types/user';
import { generatePermissions, generatePermissionsFromGroups, combinePermissions } from '@/utils/permissions';
import { groupService } from '@/services/groupService';
import { companyService } from '@/services/companyService';
import { getApiUrl } from '@/config/environment';

const AuthContext = (globalThis as any).__AUTH_CONTEXT__ ||
  ((globalThis as any).__AUTH_CONTEXT__ = createContext<AuthContextType | undefined>(undefined));

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Determina a "função efetiva" do usuário com base em roles e grupos
  const determineEffectiveRole = (currentRole: UserRole | undefined, groups: UserGroupData[] | undefined): UserRole => {
    // Se já for um papel forte (não colaborador), mantém
    if (currentRole && currentRole !== 'COLABORADOR') {
      return currentRole;
    }

    if (!groups || groups.length === 0) {
      return currentRole || 'COLABORADOR';
    }

    const groupNames = groups.map((g) => g.groupName);

    // Prioridades por grupo
    if (groupNames.includes('GRUPO_DPE')) {
      return 'DEPARTAMENTO_PESSOAL';
    }
    if (groupNames.includes('GRUPO_RH')) {
      return 'RH';
    }
    if (groupNames.includes('GRUPO_GESTOR')) {
      return 'GESTOR';
    }

    // Se cair aqui, mantém como colaborador
    return currentRole || 'COLABORADOR';
  };

  // Limpar localStorage corrompido se houver
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token === 'fake-token') {
      console.log('🔍 Limpando token fake do localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        console.log('🔍 AuthContext: Carregando usuário...');
        console.log('🔍 Token encontrado:', !!token);
        console.log('🔍 Usuário salvo:', !!savedUser);

        if (token && savedUser) {
          const userData = JSON.parse(savedUser);
          const savedEmpresa = localStorage.getItem('empresa');
          const empresaData = savedEmpresa ? JSON.parse(savedEmpresa) : null;
          if (empresaData) {
            console.log('🔍 AuthContext: Empresa carregada do localStorage:', empresaData);
            setEmpresa(empresaData);
          } else if (userData.companyId) {
            companyService.getCompanyById(userData.companyId)
              .then((comp) => {
                if (comp) {
                  const fetchedEmpresa: EmpresaInfo = {
                    id: comp.id || userData.companyId,
                    nome: comp.name || comp.nome || '',
                    logoUrl: comp.logoUrl,
                    temaCor: comp.temaCor,
                    branchName: comp.branchName,
                    unitName: comp.unitName,
                    enabledFeatures: comp.enabledFeatures || []
                  };
                  setEmpresa(fetchedEmpresa);
                  localStorage.setItem('empresa', JSON.stringify(fetchedEmpresa));
                  console.log('✅ AuthContext: Empresa obtida do backend:', fetchedEmpresa);
                }
              })
              .catch((err) => {
                console.warn('⚠️ AuthContext: Não foi possível obter dados da empresa do backend:', err);
              });
          } else {
            // Se não houver empresa no localStorage, mas o usuário for um papel administrativo forte, apenas informa
            if (userData.role === 'SUPER_ADMIN' || userData.role === 'FLEX_ADMIN') {
              console.log('ℹ️ AuthContext: Usuário administrativo carregado sem empresa (comportamento esperado).');
            } else {
              console.warn('⚠️ AuthContext: Nenhuma empresa encontrada no localStorage para o usuário.');
            }
          }
          console.log('🔍 Usuário carregado:', userData.name, userData.role);

          // Gerar permissões a partir do role principal
          const rolePermissions = generatePermissions(userData.role);
          const userWithPermissions = {
            ...userData,
            permissions: rolePermissions,
            firstAccessCompleted: userData.firstAccessCompleted ?? false
          };

          console.log('🔍 AuthContext - Usuário carregado:', {
            name: userData.name,
            role: userData.role,
            permissions: rolePermissions,
            firstAccessCompleted: userWithPermissions.firstAccessCompleted,
            isSuperAdmin: userData.role === 'SUPER_ADMIN',
            allPermissions: rolePermissions.ALL_PERMISSIONS
          });

          setUser(userWithPermissions);
          console.log('🔍 Usuário definido no estado');
          localStorage.setItem('user', JSON.stringify(userWithPermissions));

          setRefreshToken(token);

          // Atualizar dados do perfil em segundo plano com o banco de dados
          void refreshUser();

          const roleKey = (userWithPermissions.role ?? '').toUpperCase();
          if (!['COLABORADOR', 'ROLE_COLABORADOR'].includes(roleKey) && userWithPermissions.id) {
            void loadUserGroups(userWithPermissions.id);
          }

          // Verificar se precisa redirecionar para primeiro acesso
          if (!userWithPermissions.firstAccessCompleted) {
            const currentPath = window.location.pathname;
            const firstAccessPaths = ['/first-access/change-password', '/first-access/activate-2fa'];
            if (!firstAccessPaths.includes(currentPath)) {
              console.log('🔒 Usuário precisa completar primeiro acesso, redirecionando...');
              setTimeout(() => {
                navigate('/first-access/change-password', { replace: true });
              }, 100);
            }
          }
        } else {
          console.log('🔍 Nenhum token ou usuário encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const loadUserGroups = async (userId: string) => {
    try {
      const groups = await groupService.getGroupsByUserId(userId);
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        const updatedUser = { ...userData, groups };

        // Gerar permissões combinadas
        const rolePermissions = generatePermissions(userData.role);
        const groupPermissions = generatePermissionsFromGroups(groups);
        const combinedPermissions = combinePermissions(rolePermissions, groupPermissions);

        // Ajustar função exibida de acordo com os grupos (ex.: GRUPO_DPE -> Departamento Pessoal)
        const effectiveRole = determineEffectiveRole(updatedUser.role as UserRole, groups);
        const userWithPermissions = { ...updatedUser, role: effectiveRole, permissions: combinedPermissions };

        setUser(userWithPermissions);
        localStorage.setItem('user', JSON.stringify(userWithPermissions));
      }
    } catch (error: any) {
      const status = error?.response?.status;

      // Tratamento específico para erro 522 (servidor indisponível)
      if (status === 522 || (error as any)?.is522Error) {
        console.warn('⚠️ [AuthContext] Erro 522 ao carregar grupos - servidor temporariamente indisponível. Continuando sem grupos.');
        console.warn('⚠️ [AuthContext] O retry automático do axios já foi tentado. Continuando sem grupos para não bloquear o login.');
        return;
      }

      if (error?.isConnectionError) {
        console.warn('⚠️ [AuthContext] Backend não está disponível. Continuando sem grupos.');
        return;
      }

      if (status === 403) {
        console.info('[AuthContext] Grupo não carregado (403) - usuário sem permissão para /groups, continuando sem grupos.');
      } else if (status === 401) {
        console.info('[AuthContext] Grupo não carregado (401) - sessão inválida, sem impacto crítico.');
      } else {
        console.error('Erro ao carregar grupos do usuário:', error);
        console.warn('Não foi possível carregar grupos do usuário. Continuando sem grupos.');
      }
    }
  };

  const login = async (email: string, password: string, companyId?: string) => {
    try {
      setIsLoading(true);

      console.log('🔍 Tentando fazer login com:', email, 'Empresa:', companyId);
      console.log('🔍 Base URL:', getApiUrl());

      // Removido teste de comunicação para evitar erros desnecessários

      // Enviar username em vez de email para corresponder ao backend
      // Usar caminho completo com /api para garantir que o proxy funcione
      const requestBody: any = { username: email, password };
      if (companyId) {
        requestBody.companyId = companyId;
      }

      // baseURL já é /api (VITE_API_URL) — não repetir /api para evitar edge cases no proxy
      const response = await api.post('/auth/login', requestBody);

      console.log('✅ Resposta do login recebida:', response.status);
      console.log('📦 Dados da resposta:', {
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user,
        userRole: response.data?.user?.role,
        userRoles: response.data?.user?.roles,
        requiresPasswordChange: response.data?.requiresPasswordChange,
        firstAccessCompleted: response.data?.firstAccessCompleted,
        requires2FA: response.data?.requires2FA,
        requiresLgpdConsent: response.data?.requiresLgpdConsent
      });

      // Obter os roles do backend (array ou string)
      let userRoles: string[] = [];
      if (response.data.user) {
        if (Array.isArray(response.data.user.roles)) {
          userRoles = response.data.user.roles;
        } else if (typeof response.data.user.role === 'string') {
          userRoles = [response.data.user.role];
        }
      }
      // Definir o role principal por prioridade
      const rolePriority: UserRole[] = [
        'SUPER_ADMIN',
        'FLEX_ADMIN',
        'COMPANY_ADMIN',
        'ADMIN',
        'RH',
        'ASSISTENCIA_RH',
        'DEPARTAMENTO_PESSOAL',
        'GESTOR',
        'GESTOR_TRAFEGO',
        'SUPERVISOR',
        'FINANCEIRO',
        'OPERACIONAL',
        'TI_SUPORTE',
        'AUDITOR',
        'VIGILANTE',
        'AUXI_ADMINISTRATIVO',
        'AUX_DEP',
        'MOTORISTA',
        'MECANICO',
        'PORTARIA',
        'COLABORADOR',
      ];
      let userRole: User['role'] = 'COLABORADOR';
      for (const role of rolePriority) {
        if (userRoles.includes(role)) {
          userRole = role as User['role'];
          break;
        }
      }

      // TEMPORARIAMENTE: Não carregar grupos durante o login para evitar loop
      console.log('🔍 Login: Pulando carregamento de grupos para evitar loop');
      const userGroups = [];

      // Gerar permissões apenas do role por enquanto
      const rolePermissions = generatePermissions(userRole);
      const combinedPermissions = rolePermissions; // Apenas permissões do role

      // Log para debug do SUPER_ADMIN
      if (userRole === 'SUPER_ADMIN') {
        console.log('🔴 SUPER_ADMIN detectado!');
        console.log('Permissões do role:', rolePermissions);
        console.log('Permissões combinadas:', combinedPermissions);
      }

      const userData: User = {
        id: response.data.user?.id || '',
        name: response.data.user?.fullName || response.data.user?.name || 'Usuário Teste',
        email: response.data.user?.email || email,
        username: response.data.user?.username || email, // CPF usado no login
        role: userRole,
        roles: userRoles, // Adicionar a propriedade roles
        groups: userGroups,
        permissions: combinedPermissions,
        avatar: response.data.user?.avatar,
        department: response.data.user?.department,
        position: response.data.user?.position,
        employeeCode: response.data.user?.employeeCode,
        firstAccessCompleted: response.data.user?.firstAccessCompleted ?? response.data.firstAccessCompleted ?? false,
      };

      // Validar que o ID foi fornecido
      if (!userData.id || userData.id.trim() === '') {
        console.error('❌ ID do usuário não encontrado na resposta do login!');
        throw new Error('ID do usuário não encontrado na resposta do login');
      }

      console.log('✅ ID do usuário obtido:', userData.id);

      // Salvar token e dados do usuário
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('✅ Token salvo no localStorage:', response.data.token.substring(0, 50) + '...');
      } else {
        console.error('❌ Token não encontrado na resposta do login!');
        throw new Error('Token não encontrado na resposta do login');
      }
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      } else if (response.data.token) {
        localStorage.setItem('refreshToken', response.data.token);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      if (response.data.empresa) {
        const emp = response.data.empresa;
        const empresaData: EmpresaInfo = {
          id: emp.id || '',
          nome: emp.nome || '',
          logoUrl: emp.logoUrl,
          temaCor: emp.temaCor,
          branchName: emp.branchName,
          unitName: emp.unitName,
          enabledFeatures: emp.enabledFeatures || []
        };
        setEmpresa(empresaData);
        localStorage.setItem('empresa', JSON.stringify(empresaData));
      } else {
        setEmpresa(null);
        localStorage.removeItem('empresa');
      }

      // Verificar requisitos de acesso ANTES de setar o estado
      const requiresPasswordChange = response.data?.requiresPasswordChange === true;
      const firstAccessCompleted = response.data?.firstAccessCompleted === true;
      const requires2FA = response.data?.requires2FA === true;
      const requiresLgpdConsent = response.data?.requiresLgpdConsent === true;

      console.log('🔍 Verificando requisitos de acesso:', {
        requiresPasswordChange,
        firstAccessCompleted,
        requires2FA,
        requiresLgpdConsent
      });

      // Definir para onde navegar
      let destination = '/dashboard';
      if (requiresPasswordChange || !firstAccessCompleted) {
        destination = '/first-access/change-password';
      } else if (requires2FA) {
        destination = '/first-access/activate-2fa';
      } else if (requiresLgpdConsent) {
        destination = '/lgpd-consent';
      }

      // ORDEM CRÍTICA: setar user e isLoading=false juntos, navegar depois
      // O React processa os dois setStates no mesmo batch, então quando
      // ProtectedRoute renderizar ele verá user != null e isLoading = false
      setUser(userData);
      setRefreshToken(response.data.token);
      setIsLoading(false);

      console.log('✅ Usuário setado no estado:', userData.name, userData.role, '→', destination);

      // Carregar grupos em background (não bloquear navegação)
      const roleKey = (userData.role ?? '').toUpperCase();
      if (!['COLABORADOR', 'ROLE_COLABORADOR'].includes(roleKey) && userData.id) {
        loadUserGroups(userData.id).catch(err => {
          console.warn('⚠️ Erro ao carregar grupos (não crítico):', err);
        });
      }

      // Navegar após um microtick para garantir que o React processou os setState
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log('🚀 Navegando para:', destination);
      navigate(destination);
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      console.error('📋 Detalhes do erro:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        config: {
          url: error?.config?.url,
          method: error?.config?.method,
          baseURL: error?.config?.baseURL
        }
      });

      // Mensagem de erro mais específica
      let errorMessage = 'Verifique suas credenciais e tente novamente.';

      if (error?.response?.status === 401) {
        errorMessage = error?.response?.data?.message || 'Usuário ou senha incorretos.';
      } else if (error?.response?.status === 403) {
        // Se for o erro específico de falta de empresa, não mostrar o toast genérico e propagar o erro original
        if (error?.response?.data?.code === 'NO_COMPANY_LINKED') {
          throw error;
        }
        errorMessage = 'Acesso negado. Verifique suas permissões.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (error?.response?.status === 522 || (error as any)?.is522Error) {
        errorMessage = 'O servidor está temporariamente indisponível. O servidor de origem não está respondendo. Por favor, tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.';
      } else if (error?.isConnectionError) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      } else if (!error?.response) {
        errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
      }

      toast({
        title: 'Erro ao fazer login',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('empresa');
    setUser(null);
    setEmpresa(null);
    setProfile(null);
    setRefreshToken(null);
    // Navegar apenas durante logout
    navigate('/login');
  };

  const signOut = logout; // Alias para compatibilidade

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Buscar dados atualizados do usuário
      const response = await api.get('/users/profile');
      if (response.data) {
        const savedUser = localStorage.getItem('user');
        const userData = savedUser ? JSON.parse(savedUser) : {};
        const primaryRole = (response.data.roles && response.data.roles.length > 0)
          ? (typeof response.data.roles[0] === 'string' ? response.data.roles[0] : response.data.roles[0].name)
          : userData.role;

        const updatedUser = {
          ...userData,
          id: response.data.id || userData.id,
          name: response.data.name || userData.name,
          username: response.data.username || userData.username,
          email: response.data.email || userData.email,
          whatsapp: response.data.whatsapp || userData.whatsapp,
          active: response.data.active !== undefined ? response.data.active : userData.active,
          roles: response.data.roles || userData.roles,
          role: primaryRole || userData.role,
        };
        const rolePermissions = generatePermissions(updatedUser.role);
        const userWithPermissions = {
          ...updatedUser,
          permissions: rolePermissions
        };
        setUser(userWithPermissions);
        setProfile(response.data);
        localStorage.setItem('user', JSON.stringify(userWithPermissions));
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  const setFirstAccessCompleted = (completed: boolean) => {
    if (!user) return;
    const updatedUser = { ...user, firstAccessCompleted: completed };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    empresa,
    profile,
    login,
    logout,
    signOut,
    isLoading,
    isAuthenticated: !!user,
    refreshAuthToken: async () => {
      try {
        const response = await api.post('/auth/refresh-token', {
          refreshToken
        });

        const { token: newToken, refreshToken: newRefreshToken, empresa: emp } = response.data;

        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        if (emp) {
          const empresaData: EmpresaInfo = {
            id: emp.id || '',
            nome: emp.nome || '',
            logoUrl: emp.logoUrl,
            temaCor: emp.temaCor,
            branchName: emp.branchName,
            unitName: emp.unitName,
            enabledFeatures: emp.enabledFeatures || []
          };
          setEmpresa(empresaData);
          localStorage.setItem('empresa', JSON.stringify(empresaData));
        }
        setRefreshToken(newRefreshToken);
      } catch (error) {
        console.error('Error refreshing token:', error);
        logout();
        throw error;
      }
    },
    refreshUser,
    setFirstAccessCompleted,
    hasRole: (role: UserRole | string) => {
      if (!user) return false;
      // Trata tanto o papel principal (role) quanto a lista de papéis (roles)
      const rolesToMatch = Array.isArray((user as any).roles) ? (user as any).roles : [];
      return user.role === role || rolesToMatch.includes(role);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
