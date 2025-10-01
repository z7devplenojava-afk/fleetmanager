import api from '@/lib/axios';
import { PermissionDTO } from '@/types/user';

export const permissionService = {
  async getAllPermissions(): Promise<PermissionDTO[]> {
    const response = await api.get('/permissions');
    return response.data;
  },
}; 