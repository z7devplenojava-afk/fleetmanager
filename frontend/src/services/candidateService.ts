import api from '@/lib/axios';
import { JobCandidate, CandidateFormData, CandidateStatus, CandidateStats, CandidateStatusUpdate } from '../types/candidate';



export const candidateService = {
  // Buscar todos os candidatos
  getAllCandidates: async (): Promise<JobCandidate[]> => {
    const response = await api.get(`/api/hr/candidates`);
    return response.data;
  },

  // Buscar candidatos por vaga
  getCandidatesByVacancy: async (vacancyId: string): Promise<JobCandidate[]> => {
    const response = await api.get(`/api/hr/vacancies/${vacancyId}/candidates`);
    return response.data;
  },

  // Buscar candidatos por status
  getCandidatesByStatus: async (status: CandidateStatus): Promise<JobCandidate[]> => {
    const response = await api.get(`/api/hr/candidates/status/${status}`);
    return response.data;
  },

  // Buscar candidato por ID
  getCandidateById: async (id: string): Promise<JobCandidate> => {
    const response = await api.get(`/api/hr/candidates/${id}`);
    return response.data;
  },

  // Criar novo candidato (público)
  createCandidate: async (formData: CandidateFormData, captchaToken?: string): Promise<JobCandidate> => {
    const data = new FormData();
    
    // Adicionar dados do candidato
    const candidateData = {
      jobVacancyId: formData.jobVacancyId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      cpf: formData.cpf,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      educationLevel: formData.educationLevel,
      experienceYears: formData.experienceYears,
      currentPosition: formData.currentPosition,
      currentCompany: formData.currentCompany,
      expectedSalary: formData.expectedSalary,
      availability: formData.availability
    };
    
    data.append('candidate', new Blob([JSON.stringify(candidateData)], {
      type: 'application/json'
    }));
    
    // Adicionar arquivo do currículo se existir
    if (formData.curriculum) {
      data.append('curriculum', formData.curriculum);
    }

    // Adicionar token do captcha se fornecido
    if (captchaToken) {
      data.append('captchaToken', captchaToken);
    }
    
    const response = await api.post(`/api/candidates`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Atualizar candidato
  updateCandidate: async (id: string, candidateData: Partial<JobCandidate>): Promise<JobCandidate> => {
    const response = await api.put(`/api/hr/candidates/${id}`, candidateData);
    return response.data;
  },

  // Atualizar status do candidato
  updateCandidateStatus: async (id: string, statusUpdate: CandidateStatusUpdate): Promise<JobCandidate> => {
    console.log('[DEBUG] Payload enviado para updateCandidateStatus:', JSON.stringify(statusUpdate));
    const response = await api.patch(`/api/hr/candidates/${id}/status`, statusUpdate);
    return response.data;
  },

  // Aprovar candidato
  approveCandidate: async (id: string, notes?: string): Promise<JobCandidate> => {
    const response = await api.post(`/api/hr/candidates/${id}/approve`, { notes });
    return response.data;
  },

  // Reprovar candidato
  rejectCandidate: async (id: string, notes?: string): Promise<JobCandidate> => {
    const response = await api.post(`/api/hr/candidates/${id}/reject`, { notes });
    return response.data;
  },

  // Marcar como entrevistado
  markAsInterviewed: async (id: string, notes?: string): Promise<JobCandidate> => {
    const response = await api.post(`/api/hr/candidates/${id}/interview`, { notes });
    return response.data;
  },

  // Contratar candidato
  hireCandidate: async (id: string, notes?: string): Promise<JobCandidate> => {
    const response = await api.post(`/api/hr/candidates/${id}/hire`, { notes });
    return response.data;
  },

  // Download do currículo
  downloadCurriculum: async (id: string): Promise<Blob> => {
    const response = await api.get(`/api/hr/candidates/${id}/curriculum`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Excluir candidato
  deleteCandidate: async (id: string): Promise<void> => {
    await api.delete(`/api/hr/candidates/${id}`);
  },

  // Buscar estatísticas de candidatos
  getCandidateStats: async (): Promise<CandidateStats> => {
    const response = await api.get(`/api/hr/candidates/stats`);
    return response.data;
  },

  // Buscar estatísticas de candidatos por vaga
  getCandidateStatsByVacancy: async (vacancyId: string): Promise<CandidateStats> => {
    const response = await api.get(`/api/hr/vacancies/${vacancyId}/candidates/stats`);
    return response.data;
  }
}; 