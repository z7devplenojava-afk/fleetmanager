import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/axios';
import { User, AuthContextType } from '@/types/user';
import { generatePermissions, generatePermissionsFromGroups, combinePermissions } from '@/utils/permissions';
import { groupService } from '@/services/groupService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
          console.log('🔍 Usuário carregado:', userData.name, userData.role);
          
          // TEMPORARIAMENTE: Não carregar grupos para evitar loop
          console.log('🔍 Pulando carregamento de grupos para evitar loop');
          
          // Gerar permissões apenas do role
          const rolePermissions = generatePermissions(userData.role);
          const userWithPermissions = { ...userData, permissions: rolePermissions };
          
          console.log('🔍 AuthContext - Usuário carregado:', {
            name: userData.name,
            role: userData.role,
            permissions: rolePermissions,
            isSuperAdmin: userData.role === 'SUPER_ADMIN',
            allPermissions: rolePermissions.ALL_PERMISSIONS
          });
          
          setUser(userWithPermissions);
          console.log('🔍 Usuário definido no estado');
          
          setRefreshToken(token);
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
        
        const userWithPermissions = { ...updatedUser, permissions: combinedPermissions };
        
        setUser(userWithPermissions);
        localStorage.setItem('user', JSON.stringify(userWithPermissions));
      }
    } catch (error: any) {
      console.error('Erro ao carregar grupos do usuário:', error);
      
      // Se for erro de permissão, não mostrar toast (usuário pode não ter grupos)
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        console.warn('Não foi possível carregar grupos do usuário. Continuando sem grupos.');
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Tentando fazer login com:', email);
      
      // Removido teste de comunicação para evitar erros desnecessários
      
      // Enviar username em vez de email para corresponder ao backend
      // Usar caminho completo com /api para garantir que o proxy funcione
      const response = await api.post('/api/auth/login', { username: email, password });
      
      console.log('🔍 Resposta do login:', response.status, response.data);
      
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
      const rolePriority = ['SUPER_ADMIN', 'ADMIN', 'RH', 'SUPERVISOR', 'FINANCEIRO', 'TI_SUPORTE', 'AUDITOR', 'COLABORADOR'];
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
        id: response.data.user?.id || 'fe812a92-90ee-4a2a-b846-4476a35ea9b9',
        name: response.data.user?.fullName || response.data.user?.name || 'Usuário Teste',
        email: response.data.user?.email || email,
        role: userRole,
        roles: userRoles, // Adicionar a propriedade roles
        groups: userGroups,
        permissions: combinedPermissions,
        avatar: response.data.user?.avatar,
        department: response.data.user?.department,
        position: response.data.user?.position,
        employeeCode: response.data.user?.employeeCode,
      };

      // Salvar token e dados do usuário
      localStorage.setItem('token', response.data.token || 'fake-token');
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setRefreshToken(response.data.token);

      // Navegar apenas após login bem-sucedido
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      console.error('Detalhes do erro:', error.response?.data);
      console.error('Status do erro:', error.response?.status);
      toast({
        title: 'Erro ao fazer login',
        description: 'Verifique suas credenciais e tente novamente.',
        variant: 'destructive',
      });
      throw new Error('Falha na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
      const response = await api.get('/api/users/profile');
      if (response.data) {
        const updatedUser = {
          ...user,
          name: response.data.name,
          email: response.data.email,
          whatsapp: response.data.whatsapp
        };
        setUser(updatedUser);
        setProfile(response.data);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    login,
    logout,
    signOut,
    isLoading,
    isAuthenticated: !!user,
    refreshAuthToken: async () => {
      try {
        const response = await api.post('/api/auth/refresh-token', {
          refreshToken
        });

        const { token: newToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        setRefreshToken(newRefreshToken);
      } catch (error) {
        console.error('Error refreshing token:', error);
        logout();
        throw error;
      }
    },
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
