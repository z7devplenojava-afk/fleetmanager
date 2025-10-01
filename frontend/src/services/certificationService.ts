import api from '@/lib/axios';
import { Certification, CertificationType, CertificationStatus } from '../types/certification';

// Tipos para a API
interface CertificationAPI {
  id: number;
  name: string;
  description?: string;
  type: 'SAFETY' | 'TECHNICAL' | 'MANAGEMENT' | 'COMPLIANCE' | 'OTHER';
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';
  employeeId: number;
  employeeName: string;
  employeeCpf: string;
  issuingOrganization: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  renewalDate?: string;
  cost: number;
  location: string;
  notes?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

class CertificationService {
  // Buscar todas as certificações
  async getCertifications(filters?: {
    type?: CertificationType;
    status?: CertificationStatus;
    employeeId?: number;
    issuingOrganization?: string;
  }): Promise<Certification[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
      if (filters?.issuingOrganization) params.append('issuingOrganization', filters.issuingOrganization);

      const url = `/certifications${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((cert: CertificationAPI) => ({
        id: cert.id,
        name: cert.name,
        description: cert.description,
        type: cert.type,
        status: cert.status,
        employeeId: cert.employeeId,
        employeeName: cert.employeeName,
        employeeCpf: cert.employeeCpf,
        issuingOrganization: cert.issuingOrganization,
        certificateNumber: cert.certificateNumber,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        renewalDate: cert.renewalDate,
        cost: cert.cost,
        location: cert.location,
        notes: cert.notes,
        attachments: cert.attachments,
        createdBy: cert.createdBy,
        createdAt: cert.createdAt,
        updatedAt: cert.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar certificações:', error);
      return this.getMockCertifications();
    }
  }

  // Buscar certificação por ID
  async getCertification(id: number): Promise<Certification | null> {
    try {
      const response = await api.get(`/certifications/${id}`);
      const cert: CertificationAPI = response.data;
      
      return {
        id: cert.id,
        name: cert.name,
        description: cert.description,
        type: cert.type,
        status: cert.status,
        employeeId: cert.employeeId,
        employeeName: cert.employeeName,
        employeeCpf: cert.employeeCpf,
        issuingOrganization: cert.issuingOrganization,
        certificateNumber: cert.certificateNumber,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        renewalDate: cert.renewalDate,
        cost: cert.cost,
        location: cert.location,
        notes: cert.notes,
        attachments: cert.attachments,
        createdBy: cert.createdBy,
        createdAt: cert.createdAt,
        updatedAt: cert.updatedAt
      };
    } catch (error) {
      console.error('Erro ao buscar certificação:', error);
      return null;
    }
  }

  // Criar nova certificação
  async createCertification(certification: Omit<Certification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Certification> {
    try {
      const response = await api.post('/certifications', certification);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar certificação:', error);
      throw new Error('Erro ao criar certificação');
    }
  }

  // Atualizar certificação
  async updateCertification(id: number, certification: Partial<Certification>): Promise<Certification> {
    try {
      const response = await api.put(`/certifications/${id}`, certification);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar certificação:', error);
      throw new Error('Erro ao atualizar certificação');
    }
  }

  // Deletar certificação
  async deleteCertification(id: number): Promise<void> {
    try {
      await api.delete(`/certifications/${id}`);
    } catch (error) {
      console.error('Erro ao deletar certificação:', error);
      throw new Error('Erro ao deletar certificação');
    }
  }

  // Renovar certificação
  async renewCertification(id: number, renewalData: {
    renewalDate: string;
    cost: number;
    notes?: string;
  }): Promise<Certification> {
    try {
      const response = await api.patch(`/certifications/${id}/renew`, renewalData);
      return response.data;
    } catch (error) {
      console.error('Erro ao renovar certificação:', error);
      throw new Error('Erro ao renovar certificação');
    }
  }

  // Cancelar certificação
  async cancelCertification(id: number, reason: string): Promise<Certification> {
    try {
      const response = await api.patch(`/certifications/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar certificação:', error);
      throw new Error('Erro ao cancelar certificação');
    }
  }

  // Buscar certificações por funcionário
  async getCertificationsByEmployee(employeeId: number): Promise<Certification[]> {
    try {
      const response = await api.get(`/certifications/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar certificações do funcionário:', error);
      return [];
    }
  }

  // Buscar certificações expirando em breve
  async getExpiringCertifications(days: number = 30): Promise<Certification[]> {
    try {
      const response = await api.get(`/certifications/expiring?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar certificações expirando:', error);
      return [];
    }
  }

  // Buscar estatísticas de certificações
  async getCertificationStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    pending: number;
    cancelled: number;
    expiringSoon: number;
    totalCost: number;
    byType: Record<CertificationType, number>;
    byOrganization: Record<string, number>;
  }> {
    try {
      const response = await api.get('/certifications/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return this.getMockCertificationStats();
    }
  }

  // Dados mock para fallback
  private getMockCertifications(): Certification[] {
    return [
      {
        id: 1,
        name: 'NR-35 - Trabalho em Altura',
        description: 'Certificação para trabalho em altura conforme NR-35',
        type: 'SAFETY',
        status: 'ACTIVE',
        employeeId: 1,
        employeeName: 'João Silva',
        employeeCpf: '123.456.789-00',
        issuingOrganization: 'SENAI',
        certificateNumber: 'NR35-2024-001',
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15',
        cost: 350.00,
        location: 'São Paulo, SP',
        notes: 'Certificação obrigatória para vigilantes',
        attachments: ['certificado_nr35.pdf'],
        createdBy: 'admin@empresa.com',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'NR-10 - Segurança em Instalações Elétricas',
        description: 'Certificação básica em segurança elétrica',
        type: 'SAFETY',
        status: 'ACTIVE',
        employeeId: 2,
        employeeName: 'Maria Santos',
        employeeCpf: '987.654.321-00',
        issuingOrganization: 'SENAC',
        certificateNumber: 'NR10-2024-002',
        issueDate: '2024-02-20',
        expiryDate: '2025-02-20',
        cost: 280.00,
        location: 'Rio de Janeiro, RJ',
        notes: 'Certificação para manutenção elétrica',
        attachments: ['certificado_nr10.pdf'],
        createdBy: 'admin@empresa.com',
        createdAt: '2024-02-20T14:20:00Z',
        updatedAt: '2024-02-20T14:20:00Z'
      },
      {
        id: 3,
        name: 'Primeiros Socorros',
        description: 'Curso de primeiros socorros básico',
        type: 'SAFETY',
        status: 'EXPIRED',
        employeeId: 3,
        employeeName: 'Pedro Oliveira',
        employeeCpf: '456.789.123-00',
        issuingOrganization: 'Cruz Vermelha',
        certificateNumber: 'PS-2023-003',
        issueDate: '2023-06-10',
        expiryDate: '2024-06-10',
        cost: 150.00,
        location: 'Belo Horizonte, MG',
        notes: 'Necessita renovação urgente',
        attachments: ['certificado_primeiros_socorros.pdf'],
        createdBy: 'admin@empresa.com',
        createdAt: '2023-06-10T09:15:00Z',
        updatedAt: '2023-06-10T09:15:00Z'
      },
      {
        id: 4,
        name: 'Gestão de Segurança Patrimonial',
        description: 'Curso avançado em segurança patrimonial',
        type: 'TECHNICAL',
        status: 'ACTIVE',
        employeeId: 4,
        employeeName: 'Ana Costa',
        employeeCpf: '789.123.456-00',
        issuingOrganization: 'ABSEG',
        certificateNumber: 'GSP-2024-004',
        issueDate: '2024-03-05',
        expiryDate: '2026-03-05',
        cost: 580.00,
        location: 'São Paulo, SP',
        notes: 'Certificação profissional avançada',
        attachments: ['certificado_gestao_seguranca.pdf'],
        createdBy: 'admin@empresa.com',
        createdAt: '2024-03-05T16:45:00Z',
        updatedAt: '2024-03-05T16:45:00Z'
      },
      {
        id: 5,
        name: 'ISO 9001 - Gestão da Qualidade',
        description: 'Certificação em gestão da qualidade',
        type: 'MANAGEMENT',
        status: 'PENDING',
        employeeId: 5,
        employeeName: 'Carlos Ferreira',
        employeeCpf: '321.654.987-00',
        issuingOrganization: 'ABNT',
        certificateNumber: 'ISO9001-2024-005',
        issueDate: '2024-01-30',
        expiryDate: '2027-01-30',
        cost: 1200.00,
        location: 'Brasília, DF',
        notes: 'Aguardando aprovação final',
        attachments: ['certificado_iso9001.pdf'],
        createdBy: 'admin@empresa.com',
        createdAt: '2024-01-30T11:20:00Z',
        updatedAt: '2024-01-30T11:20:00Z'
      }
    ];
  }

  private getMockCertificationStats() {
    return {
      total: 5,
      active: 3,
      expired: 1,
      pending: 1,
      cancelled: 0,
      expiringSoon: 2,
      totalCost: 2560.00,
      byType: {
        SAFETY: 3,
        TECHNICAL: 1,
        MANAGEMENT: 1,
        COMPLIANCE: 0,
        OTHER: 0
      },
      byOrganization: {
        'SENAI': 1,
        'SENAC': 1,
        'Cruz Vermelha': 1,
        'ABSEG': 1,
        'ABNT': 1
      }
    };
  }
}

export default new CertificationService(); 