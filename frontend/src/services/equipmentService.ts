import axios from '@/lib/axios';
import {
  Equipment,
  CreateEquipmentRequest,
  EquipmentFilters,
  EquipmentSummary
} from '@/types/equipment';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

class EquipmentService {
  private readonly baseUrl = '/equipments';


  // Função para converter snake_case para camelCase
  private convertToCamelCase(obj: any): any {
    if (!obj) return obj;

    const camelCaseObj: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        camelCaseObj[camelKey] = obj[key];
      }
    }

    // Calcular propriedades adicionais
    if (camelCaseObj.validityDate) {
      const validityDate = new Date(camelCaseObj.validityDate);
      const now = new Date();
      const diffTime = validityDate.getTime() - now.getTime();
      camelCaseObj.daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      camelCaseObj.isExpired = camelCaseObj.daysToExpiry < 0;
      camelCaseObj.isExpiringSoon = camelCaseObj.daysToExpiry > 0 && camelCaseObj.daysToExpiry <= 30;
    }

    if (camelCaseObj.weaponRegistrationValidity) {
      const weaponDate = new Date(camelCaseObj.weaponRegistrationValidity);
      const now = new Date();
      const diffTime = weaponDate.getTime() - now.getTime();
      camelCaseObj.daysToWeaponRegistrationExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      camelCaseObj.isWeaponRegistrationExpired = camelCaseObj.daysToWeaponRegistrationExpiry < 0;
      camelCaseObj.isWeaponRegistrationExpiringSoon = camelCaseObj.daysToWeaponRegistrationExpiry > 0 && camelCaseObj.daysToWeaponRegistrationExpiry <= 30;
    }

    return camelCaseObj;
  }

  // Método utilitário para formatação de datas
  formatDate(dateString: string): string {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }


  async getAll(
    filters?: EquipmentFilters,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<Equipment>> {
    try {
      // Construir parâmetros da query
      const params = new URLSearchParams();
      if (filters?.searchTerm) params.append('search', filters.searchTerm);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.isDangerous !== undefined) params.append('dangerous', filters.isDangerous.toString());
      params.append('page', page.toString());
      params.append('size', size.toString());

      console.log('🔗 Conectando com backend:', `${this.baseUrl}?${params}`);
      const response = await axios.get(`${this.baseUrl}?${params}`);

      // Se o backend retorna dados paginados
      if (response.data.content) {
        const convertedData = response.data.content.map((item: any) => this.convertToCamelCase(item));
        console.log('✅ Backend conectado! Dados paginados recebidos');
        return {
          ...response.data,
          content: convertedData
        };
      }

      // Se o backend retorna array simples, aplicar paginação no frontend
      const equipments = response.data;
      
      // Verificar se equipments é um array válido
      if (!Array.isArray(equipments)) {
        console.warn('⚠️ Backend retornou dados que não são um array:', equipments);
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          number: page,
          first: true,
          last: true
        };
      }
      
      console.log('✅ Backend conectado! Equipamentos carregados:', equipments.length);

      // Aplicar filtros se fornecidos
      let filteredData = equipments;

      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter((item: any) =>
          item.serial_number?.toLowerCase().includes(term) ||
          item.model?.toLowerCase().includes(term)
        );
      }

      if (filters?.status) {
        filteredData = filteredData.filter((item: any) => item.status === filters.status);
      }

      // Aplicar paginação
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      // Converter para camelCase
      const convertedData = paginatedData.map(item => this.convertToCamelCase(item));

      return {
        content: convertedData,
        totalElements: filteredData.length,
        totalPages: Math.ceil(filteredData.length / size),
        size: size,
        number: page,
        first: page === 0,
        last: endIndex >= filteredData.length
      };

    } catch (error) {
      console.error('❌ Erro ao conectar com backend:', error);
      throw new Error('Falha na conexão com o servidor de equipamentos');
    }
  }

  async create(equipment: CreateEquipmentRequest): Promise<Equipment> {
    try {
      console.log('🔗 Criando equipamento no backend:', equipment);
      const response = await axios.post(this.baseUrl, equipment);
      console.log('✅ Equipamento criado com sucesso no backend:', response.data);
      return this.convertToCamelCase(response.data) as Equipment;
    } catch (error) {
      console.error('❌ Erro ao criar equipamento:', error);
      throw new Error('Falha ao criar equipamento no servidor');
    }
  }

  async getById(id: string): Promise<Equipment> {
    try {
      console.log('🔗 Buscando equipamento por ID no backend:', id);
      const response = await axios.get(`${this.baseUrl}/${id}`);
      console.log('✅ Equipamento encontrado no backend:', response.data);
      return this.convertToCamelCase(response.data) as Equipment;
    } catch (error) {
      console.error('❌ Erro ao buscar equipamento:', error);
      throw new Error(`Equipamento ${id} não encontrado ou erro no servidor`);
    }
  }

  async update(id: string, equipmentData: Partial<CreateEquipmentRequest>): Promise<Equipment> {
    try {
      console.log('🔗 Atualizando equipamento no backend:', id, equipmentData);
      const response = await axios.put(`${this.baseUrl}/${id}`, equipmentData);
      console.log('✅ Equipamento atualizado com sucesso no backend:', response.data);
      return this.convertToCamelCase(response.data) as Equipment;
    } catch (error) {
      console.error('❌ Erro ao atualizar equipamento:', error);
      throw new Error(`Falha ao atualizar equipamento ${id} no servidor`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log('🔗 Excluindo equipamento no backend:', id);
      await axios.delete(`${this.baseUrl}/${id}`);
      console.log('✅ Equipamento excluído com sucesso no backend');
    } catch (error) {
      console.error('❌ Erro ao excluir equipamento:', error);
      throw new Error(`Falha ao excluir equipamento ${id} no servidor`);
    }
  }

  async getSummary(): Promise<EquipmentSummary> {
    try {
      console.log('🔗 Buscando resumo de equipamentos no backend');
      const response = await axios.get(`${this.baseUrl}/summary`);
      console.log('✅ Resumo recebido do backend:', response.data);

      // Mapear resposta do backend (que usa chaves diferentes) para EquipmentSummary do frontend
      const raw = response.data || {};
      const mapped: EquipmentSummary = {
        totalEquipments: raw.total ?? raw.totalEquipments ?? 0,
        activeEquipments: raw.inUse ?? raw.activeEquipments ?? 0,
        inMaintenanceEquipments: raw.inMaintenance ?? raw.inMaintenanceEquipments ?? 0,
        inStockEquipments: raw.inStock ?? raw.inStockEquipments ?? 0,
        expiredEquipments: raw.expired ?? raw.expiredEquipments ?? 0,
        expiringSoon30Days: raw.expiringSoon ?? raw.expiringSoon30Days ?? 0,
        expiringSoon60Days: raw.expiringSoon60Days ?? 0,
        weaponRegistrationExpired: raw.weaponRegistrationExpired ?? 0,
        weaponRegistrationExpiringSoon30Days: raw.weaponRegistrationExpiringSoon30Days ?? 0,
        weaponRegistrationExpiringSoon60Days: raw.weaponRegistrationExpiringSoon60Days ?? 0,
        dangerousEquipments: raw.dangerous ?? raw.dangerousEquipments ?? 0,
        equipmentsWithUsers: raw.equipmentsWithUsers ?? raw.assigned ?? raw.assignedEquipments ?? 0,
      };

      return mapped;
    } catch (error) {
      console.error('❌ Erro ao buscar resumo de equipamentos:', error);
      throw new Error('Falha ao buscar resumo de equipamentos no servidor');
    }
  }

  async getExpiredEquipments(): Promise<Equipment[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/expired`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar equipamentos vencidos:', error);
      throw error;
    }
  }

  async getEquipmentExpiringSoon(days: number = 30): Promise<Equipment[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/expiring-soon?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar equipamentos vencendo em breve:', error);
      throw error;
    }
  }

  async getWeaponRegistrationExpired(): Promise<Equipment[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/weapon-registration-expired`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar armas com registro vencido:', error);
      throw error;
    }
  }

  async getWeaponRegistrationExpiringSoon(days: number = 30): Promise<Equipment[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/weapon-registration-expiring-soon?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar armas com registro vencendo em breve:', error);
      throw error;
    }
  }

  async getByEmployee(employeeId: string): Promise<Equipment[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar equipamentos do funcionário:', error);
      throw error;
    }
  }

  async assignToEmployee(equipmentId: string, employeeId: string): Promise<Equipment> {
    try {
      const response = await axios.post(`${this.baseUrl}/${equipmentId}/assign/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao atribuir equipamento ao funcionário:', error);
      throw error;
    }
  }

  async unassignFromEmployee(equipmentId: string): Promise<Equipment> {
    try {
      const response = await axios.post(`${this.baseUrl}/${equipmentId}/unassign`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover atribuição do equipamento:', error);
      throw error;
    }
  }

  // Métodos utilitários
  getDaysToExpiry(equipment: Equipment): number | null {
    if (!equipment.validityDate) return null;
    const today = new Date();
    const validityDate = new Date(equipment.validityDate);
    const diffTime = validityDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysToWeaponRegistrationExpiry(equipment: Equipment): number | null {
    if (!equipment.weaponRegistrationValidity) return null;
    const today = new Date();
    const validityDate = new Date(equipment.weaponRegistrationValidity);
    const diffTime = validityDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'EM_USO':
        return 'bg-green-100 text-green-800';
      case 'EM_MANUTENCAO':
        return 'bg-yellow-100 text-yellow-800';
      case 'AGUARDANDO_DESCARTE':
        return 'bg-red-100 text-red-800';
      case 'EM_ESTOQUE':
        return 'bg-blue-100 text-blue-800';
      case 'BAIXADO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getExpiryColor(equipment: Equipment): string {
    if (equipment.isExpired) {
      return 'text-red-600 font-semibold';
    }
    if (equipment.isExpiringSoon) {
      return 'text-yellow-600 font-semibold';
    }
    return 'text-green-600';
  }

  getWeaponRegistrationExpiryColor(equipment: Equipment): string {
    if (equipment.isWeaponRegistrationExpired) {
      return 'text-red-600 font-semibold';
    }
    if (equipment.isWeaponRegistrationExpiringSoon) {
      return 'text-yellow-600 font-semibold';
    }
    return 'text-green-600';
  }
}

export const equipmentService = new EquipmentService();
export default equipmentService; 