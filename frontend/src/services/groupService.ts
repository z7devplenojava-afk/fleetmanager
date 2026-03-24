import api from '@/lib/axios';
import { UserGroupData } from '@/types/user';

export const groupService = {
  // Buscar todos os grupos
  async getGroups(): Promise<UserGroupData[]> {
    const response = await api.get('/api/groups');
    return response.data;
  },

  // Buscar grupo por ID
  async getGroupById(id: string): Promise<UserGroupData> {
    const response = await api.get(`/api/groups/${id}`);
    return response.data;
  },

  // Buscar grupo por nome
  async getGroupByName(name: string): Promise<UserGroupData> {
    const response = await api.get(`/api/groups/name/${name}`);
    return response.data;
  },

  // Buscar grupos do usuário
  async getGroupsByUserId(userId: string | number): Promise<UserGroupData[]> {
    const response = await api.get(`/api/groups/user/${userId}`);
    return response.data;
  },

  // Buscar permissões do usuário por grupo
  async getUserGroupPermissions(userId: string | number): Promise<any> {
    const response = await api.get(`/api/groups/user/${userId}/permissions`);
    return response.data;
  },

  // Criar novo grupo
  async createGroup(groupData: Partial<UserGroupData>): Promise<UserGroupData> {
    const response = await api.post('/api/groups', groupData);
    return response.data;
  },

  // Atualizar grupo
  async updateGroup(id: string, groupData: Partial<UserGroupData>): Promise<UserGroupData> {
    const response = await api.put(`/api/groups/${id}`, groupData);
    return response.data;
  },

  // Excluir grupo
  async deleteGroup(id: string): Promise<void> {
    await api.delete(`/api/groups/${id}`);
  },

  // Adicionar usuário ao grupo
  async addUserToGroup(groupId: string, userId: string): Promise<void> {
    await api.post(`/api/groups/${groupId}/users/${userId}`);
  },

  // Remover usuário do grupo
  async removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    await api.delete(`/api/groups/${groupId}/users/${userId}`);
  },

  // Buscar usuários de um grupo
  async getUsersByGroup(groupId: string): Promise<any[]> {
    const response = await api.get(`/api/groups/${groupId}/users`);
    return response.data;
  },

  // Buscar usuários disponíveis para adicionar ao grupo
  async getAvailableUsersForGroup(groupId: string): Promise<any[]> {
    const response = await api.get(`/api/groups/${groupId}/available-users`);
    return response.data;
  },

  // Adicionar permissão ao grupo
  async addPermissionToGroup(groupId: string, permission: string): Promise<void> {
    await api.post(`/api/groups/${groupId}/permissions`, { permission });
  },

  // Remover permissão do grupo
  async removePermissionFromGroup(groupId: string, permission: string): Promise<void> {
    await api.delete(`/api/groups/${groupId}/permissions/${permission}`);
  },

  // Inicializar grupos padrão
  async initializeGroups(): Promise<void> {
    await api.post('/api/groups/initialize');
  }
}; 