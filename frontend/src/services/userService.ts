import api from '@/lib/axios';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  active: boolean;
  roles: string[];
  companyId?: string;
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

  async toggleUserStatus(id: string, active: boolean): Promise<User> {
    return this.updateUser(id, { active });
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