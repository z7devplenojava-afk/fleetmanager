import api from '@/lib/axios';
import { Doctor } from '@/types/doctor';

export const doctorService = {
  async getAllActive(): Promise<Doctor[]> {
    try {
      const response = await api.get<Doctor[]>('/api/doctors');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      throw error;
    }
  },

  async searchByName(name?: string): Promise<Doctor[]> {
    try {
      if (!name || name.trim().length === 0) {
        return this.getAllActive();
      }
      const response = await api.get<Doctor[]>('/api/doctors/search', { 
        params: { name: name.trim() } 
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar médicos por nome:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<Doctor> {
    try {
      const response = await api.get<Doctor>(`/api/doctors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar médico por ID:', error);
      throw error;
    }
  },

  async create(doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Doctor> {
    try {
      const response = await api.post<Doctor>('/api/doctors', doctor);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar médico:', error);
      throw error;
    }
  },

  async update(id: string, doctor: Partial<Doctor>): Promise<Doctor> {
    try {
      const response = await api.put<Doctor>(`/api/doctors/${id}`, doctor);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar médico:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/api/doctors/${id}`);
    } catch (error) {
      console.error('Erro ao deletar médico:', error);
      throw error;
    }
  }
};


