import api from '@/lib/axios';
import { PermissionDTO } from '@/types/user';
export const permissionService = {
  async getAllPermissions(): Promise<PermissionDTO[]> {
    const response = await api.get('/permissions');
    const permissions: PermissionDTO[] = response.data || [];

    // 1) Remover duplicadas por nome (mantém a primeira com descrição não vazia)
    const uniqueByName = new Map<string, PermissionDTO>();
    for (const perm of permissions) {
      const existing = uniqueByName.get(perm.name);
      if (!existing) {
        uniqueByName.set(perm.name, perm);
      } else if ((!existing.description || existing.description.trim() === '') && perm.description) {
        uniqueByName.set(perm.name, perm);
      }
    }

    return Array.from(uniqueByName.values());
  },
}; 