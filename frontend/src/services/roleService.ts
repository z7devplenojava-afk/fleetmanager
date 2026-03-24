import api from '@/lib/axios';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateRoleDTO extends CreateRoleDTO {
  id: string;
}

class RoleService {
  
  /**
   * Buscar todas as roles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await api.get('/api/roles');
      return response.data;
    } catch (error) {
      console.warn('Erro ao carregar roles, usando dados de exemplo:', error);
      // Retornar dados de exemplo para desenvolvimento
      return this.getMockRoles();
    }
  }

  /**
   * Buscar role por ID
   */
  async getRoleById(id: string): Promise<Role> {
    const response = await api.get(`/api/roles/${id}`);
    return response.data;
  }

  /**
   * Buscar roles por nome
   */
  async getRolesByName(name: string): Promise<Role[]> {
    const response = await api.get(`/api/roles/search?name=${encodeURIComponent(name)}`);
    return response.data;
  }

  /**
   * Buscar roles ativas
   */
  async getActiveRoles(): Promise<Role[]> {
    try {
      const response = await api.get('/api/roles/active');
      return response.data;
    } catch (error) {
      console.warn('Erro ao carregar roles ativas, usando dados de exemplo:', error);
      return this.getMockRoles().filter(role => role.isActive);
    }
  }

  /**
   * Criar nova role
   */
  async createRole(roleData: CreateRoleDTO): Promise<Role> {
    const response = await api.post('/api/roles', roleData);
    return response.data;
  }

  /**
   * Atualizar role
   */
  async updateRole(id: string, roleData: UpdateRoleDTO): Promise<Role> {
    const response = await api.put(`/api/roles/${id}`, roleData);
    return response.data;
  }

  /**
   * Deletar role
   */
  async deleteRole(id: string): Promise<void> {
    await api.delete(`/api/roles/${id}`);
  }

  /**
   * Ativar/desativar role
   */
  async toggleRoleStatus(id: string, isActive: boolean): Promise<Role> {
    const response = await api.patch(`/api/roles/${id}/status`, { isActive });
    return response.data;
  }

  /**
   * Adicionar permissões à role
   */
  async addPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await api.post(`/api/roles/${roleId}/permissions`, { permissionIds });
    return response.data;
  }

  /**
   * Remover permissões da role
   */
  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await api.delete(`/api/roles/${roleId}/permissions`, { data: { permissionIds } });
    return response.data;
  }

  /**
   * Buscar usuários com uma role específica
   */
  async getUsersByRole(roleId: string): Promise<any[]> {
    const response = await api.get(`/api/roles/${roleId}/users`);
    return response.data;
  }

  /**
   * Buscar estatísticas das roles
   */
  async getRoleStats(): Promise<{
    totalRoles: number;
    activeRoles: number;
    inactiveRoles: number;
    rolesWithUsers: number;
  }> {
    try {
      const response = await api.get('/api/roles/stats');
      return response.data;
    } catch (error) {
      console.warn('Erro ao carregar estatísticas das roles:', error);
      return {
        totalRoles: 0,
        activeRoles: 0,
        inactiveRoles: 0,
        rolesWithUsers: 0
      };
    }
  }

  /**
   * Duplicar role
   */
  async duplicateRole(id: string, newName: string): Promise<Role> {
    const response = await api.post(`/api/roles/${id}/duplicate`, { name: newName });
    return response.data;
  }

  /**
   * Buscar permissões disponíveis
   */
  async getAvailablePermissions(): Promise<Permission[]> {
    try {
      const response = await api.get('/api/permissions');
      return response.data;
    } catch (error) {
      console.warn('Erro ao carregar permissões, usando dados de exemplo:', error);
      return this.getMockPermissions();
    }
  }

  /**
   * Dados de exemplo para desenvolvimento
   */
  private getMockRoles(): Role[] {
    return [
      {
        id: '1',
        name: 'Administrador',
        description: 'Acesso total ao sistema',
        isActive: true,
        permissions: [
          { id: '1', name: 'admin:all', description: 'Todas as permissões', resource: '*', action: '*' }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Supervisor',
        description: 'Supervisor operacional',
        isActive: true,
        permissions: [
          { id: '2', name: 'schedule:manage', description: 'Gerenciar escalas', resource: 'schedule', action: 'manage' },
          { id: '3', name: 'employee:read', description: 'Visualizar funcionários', resource: 'employee', action: 'read' }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'Funcionário',
        description: 'Funcionário comum',
        isActive: true,
        permissions: [
          { id: '4', name: 'schedule:read', description: 'Visualizar escalas', resource: 'schedule', action: 'read' },
          { id: '5', name: 'profile:update', description: 'Atualizar perfil', resource: 'profile', action: 'update' }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '4',
        name: 'Vigilante',
        description: 'Vigilante de segurança',
        isActive: true,
        permissions: [
          { id: '6', name: 'patrol:create', description: 'Criar rondas', resource: 'patrol', action: 'create' },
          { id: '7', name: 'occurrence:create', description: 'Criar ocorrências', resource: 'occurrence', action: 'create' }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '5',
        name: 'RH',
        description: 'Recursos Humanos',
        isActive: true,
        permissions: [
          { id: '8', name: 'employee:manage', description: 'Gerenciar funcionários', resource: 'employee', action: 'manage' },
          { id: '9', name: 'vacation:manage', description: 'Gerenciar férias', resource: 'vacation', action: 'manage' }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  }

  /**
   * Permissões de exemplo para desenvolvimento
   */
  private getMockPermissions(): Permission[] {
    return [
      { id: '1', name: 'admin:all', description: 'Todas as permissões', resource: '*', action: '*' },
      { id: '2', name: 'schedule:manage', description: 'Gerenciar escalas', resource: 'schedule', action: 'manage' },
      { id: '3', name: 'schedule:read', description: 'Visualizar escalas', resource: 'schedule', action: 'read' },
      { id: '4', name: 'schedule:create', description: 'Criar escalas', resource: 'schedule', action: 'create' },
      { id: '5', name: 'schedule:update', description: 'Atualizar escalas', resource: 'schedule', action: 'update' },
      { id: '6', name: 'schedule:delete', description: 'Deletar escalas', resource: 'schedule', action: 'delete' },
      { id: '7', name: 'employee:manage', description: 'Gerenciar funcionários', resource: 'employee', action: 'manage' },
      { id: '8', name: 'employee:read', description: 'Visualizar funcionários', resource: 'employee', action: 'read' },
      { id: '9', name: 'employee:create', description: 'Criar funcionários', resource: 'employee', action: 'create' },
      { id: '10', name: 'employee:update', description: 'Atualizar funcionários', resource: 'employee', action: 'update' },
      { id: '11', name: 'employee:delete', description: 'Deletar funcionários', resource: 'employee', action: 'delete' },
      { id: '12', name: 'patrol:create', description: 'Criar rondas', resource: 'patrol', action: 'create' },
      { id: '13', name: 'occurrence:create', description: 'Criar ocorrências', resource: 'occurrence', action: 'create' },
      { id: '14', name: 'profile:update', description: 'Atualizar perfil', resource: 'profile', action: 'update' },
      { id: '15', name: 'vacation:manage', description: 'Gerenciar férias', resource: 'vacation', action: 'manage' }
    ];
  }
}

export const roleService = new RoleService();
