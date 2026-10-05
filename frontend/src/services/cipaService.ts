import api from '@/lib/axios';

export interface CIPAMember {
  id: string;
  employeeId: string;
  employeeName: string | null;
  mandateYear: number;
  position: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'SECRETARIO' | 'MEMBRO' | string;
  entityPosition: 'TITULAR' | 'SUPLENTE' | string;
  department: string | null;
  startDate: string;
  endDate: string;
  status: 'ATIVO' | 'INATIVO' | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CIPAReunion {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  meetingType?: 'ORDINARIA' | 'EXTRAORDINARIA' | string;
  attendees: string[];
  agenda: string[];
  decisions: string[];
  nextReunionDate?: string;
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA' | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCIPAMemberData {
  employeeId: string;
  position: string;
  department?: string;
  startDate: string;
  endDate: string;
  mandateYear?: number;
  isActive?: boolean;
}

export interface CreateCIPAReunionData {
  title: string;
  date: string;
  attendees?: string[];
  agenda?: string[];
  decisions?: string[];
  nextReunionDate?: string;
  status?: string;
}

export const cipaService = {
  // ===== Membros =====

  async getMembers(mandateYear?: number): Promise<CIPAMember[]> {
    const url = mandateYear
      ? `/api/sst/cipa/members?mandateYear=${mandateYear}`
      : '/api/sst/cipa/members';
    const response = await api.get<CIPAMember[]>(url);
    return response.data;
  },

  async getMemberById(id: string): Promise<CIPAMember> {
    const response = await api.get<CIPAMember>(`/api/sst/cipa/members/${id}`);
    return response.data;
  },

  async createMember(data: CreateCIPAMemberData): Promise<CIPAMember> {
    const response = await api.post<CIPAMember>('/api/sst/cipa/members', data);
    return response.data;
  },

  async updateMember(id: string, data: Partial<CreateCIPAMemberData>): Promise<CIPAMember> {
    const response = await api.put<CIPAMember>(`/api/sst/cipa/members/${id}`, data);
    return response.data;
  },

  async deleteMember(id: string): Promise<void> {
    await api.delete(`/api/sst/cipa/members/${id}`);
  },

  // ===== Reuniões =====

  async getMeetings(): Promise<CIPAReunion[]> {
    const response = await api.get<CIPAReunion[]>('/api/sst/cipa/meetings');
    return response.data;
  },

  async getMeetingById(id: string): Promise<CIPAReunion> {
    const response = await api.get<CIPAReunion>(`/api/sst/cipa/meetings/${id}`);
    return response.data;
  },

  async createMeeting(data: CreateCIPAReunionData): Promise<CIPAReunion> {
    const response = await api.post<CIPAReunion>('/api/sst/cipa/meetings', data);
    return response.data;
  },

  async updateMeeting(id: string, data: Partial<CreateCIPAReunionData>): Promise<CIPAReunion> {
    const response = await api.put<CIPAReunion>(`/api/sst/cipa/meetings/${id}`, data);
    return response.data;
  },

  async deleteMeeting(id: string): Promise<void> {
    await api.delete(`/api/sst/cipa/meetings/${id}`);
  },
};
