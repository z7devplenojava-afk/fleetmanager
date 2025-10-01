import api from '@/lib/axios';
import { User } from '@/types/user';
import { PermissionDTO } from '@/types/user';

export const userService = {
  // Buscar todos os usuários
  async getUsers(): Promise<User[]> {
    const response = await api.get('/api/users');
    return response.data;
  },

  // Buscar usuário por ID
  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Buscar usuário por email
  async getUserByEmail(email: string): Promise<User> {
    const response = await api.get(`/users/email/${email}`);
    return response.data;
  },

  // Buscar usuários por role
  async getUsersByRole(role: string): Promise<User[]> {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  },

  // Buscar usuários por departamento
  async getUsersByDepartment(department: string): Promise<User[]> {
    const response = await api.get(`/users/department/${department}`);
    return response.data;
  },

  // Criar novo usuário
  async createUser(userData: Partial<User>): Promise<User> {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // Atualizar usuário
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Excluir usuário
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  // Buscar perfil do usuário logado
  async getMyProfile(): Promise<User> {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  // Atualizar perfil do usuário logado
  async updateMyProfile(userData: Partial<User>): Promise<User> {
    const response = await api.put('/api/users/profile', userData);
    return response.data;
  },

  // Alterar senha
  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.post('/api/users/change-password', passwordData);
  },

  // Ativar/desativar usuário
  async toggleUserStatus(id: string, active: boolean): Promise<User> {
    const response = await api.patch(`/api/users/${id}/status`, { active });
    return response.data;
  },

  // Buscar estatísticas de usuários
  async getUserStats(): Promise<any> {
    const response = await api.get('/api/users/stats');
    return response.data;
  },

  // Buscar usuários que já estão em um grupo
  async getUsersByGroup(groupId: string): Promise<User[]> {
    const response = await api.get(`/api/groups/${groupId}/users`);
    return response.data;
  },

  // Buscar usuários disponíveis para adicionar ao grupo
  async getAvailableUsersForGroup(groupId: string): Promise<User[]> {
    const response = await api.get(`/api/groups/${groupId}/available-users`);
    return response.data;
  },

  async getUserPermissions(userId: string): Promise<PermissionDTO[]> {
    const response = await api.get(`/api/users/${userId}/permissions`);
    return response.data;
  },
  async setUserPermissions(userId: string, permissionIds: string[]): Promise<PermissionDTO[]> {
    const response = await api.put(`/api/users/${userId}/permissions`, { permissionIds });
    return response.data;
  },
  async addUserPermissions(userId: string, permissionIds: string[]): Promise<PermissionDTO[]> {
    const response = await api.post(`/api/users/${userId}/permissions`, { permissionIds });
    return response.data;
  },
  async removeUserPermissions(userId: string, permissionIds: string[]): Promise<PermissionDTO[]> {
    const response = await api.delete(`/api/users/${userId}/permissions`, { data: { permissionIds } });
    return response.data;
  },
}; 