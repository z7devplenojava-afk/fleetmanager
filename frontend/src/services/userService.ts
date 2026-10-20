import api from '@/lib/axios';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  active: boolean;
  roles: string[];
  companyId?: string;
  blocked?: boolean;
  blockedUntil?: string | null;
  blockedReason?: string | null;
  blockedBy?: string | null;
  isOnline?: boolean;
}

export interface CreateUserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  whatsapp?: string;
  roles?: string[]; // Backend DTO espera List<String>
  active?: boolean;
  companyId?: string;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  email?: string;
  whatsapp?: string;
  password?: string;
  active?: boolean;
  roles?: string[]; // Backend DTO espera List<String>
  companyId?: string;
  removeCompany?: boolean;
  avatar?: string;
  department?: string;
  position?: string;
  employeeCode?: string;
  phone?: string;
  address?: string;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/api/users');
    return response.data;
  },

  async searchUsers(query?: string): Promise<User[]> {
    const params = query ? { query } : {};
    const response = await api.get('/api/users/search', { params });
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await api.post('/api/users', data);
    return response.data;
  },

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/api/users/${id}`);
  },

  async deleteUsersBulk(ids: string[]): Promise<{ deletedCount: number; skippedCount: number; message: string }> {
    const response = await api.post('/api/users/bulk-delete', ids);
    return response.data;
  },

  async toggleUserStatus(id: string, active: boolean): Promise<User> {
    return this.updateUser(id, { active });
  },

  /** Bloqueia um usuário por tempo definido (minutes = null/0 => permanente) */
  async blockUser(id: string, minutes: number | null, reason?: string): Promise<User> {
    const response = await api.post(`/api/users/${id}/block`, {
      durationMinutes: minutes && minutes > 0 ? minutes : null,
      reason,
    });
    return response.data;
  },

  /** Desbloqueia um usuário imediatamente */
  async unblockUser(id: string): Promise<User> {
    const response = await api.post(`/api/users/${id}/unblock`);
    return response.data;
  },

  async addUserPermissions(userId: string, permissionIds: string[]): Promise<any[]> {
    const response = await api.post(`/api/users/${userId}/permissions`, { permissionIds });
    return response.data;
  },

  async removeUserPermissions(userId: string, permissionIds: string[]): Promise<any[]> {
    const response = await api.delete(`/api/users/${userId}/permissions`, { data: { permissionIds } });
    return response.data;
  }
};

export default userService;