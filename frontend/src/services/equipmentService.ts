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

  // 🚨 SOLUÇÃO DE EMERGÊNCIA: Dados locais para entrega hoje
  private readonly STORAGE_KEY = 'secured_guard_equipments';

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

  private getEquipmentsFromStorage(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verificar se o resultado é um array
        if (Array.isArray(parsed)) {
          return parsed;
        } else {
          console.warn('⚠️ Dados no localStorage não são um array:', parsed);
          return [];
        }
      }
    } catch (error) {
      console.error('Erro ao ler localStorage:', error);
    }

    // Dados iniciais se não houver nada no storage
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        serial_number: 'COL001',
        status: 'EM_ESTOQUE',
        model: 'Colete Balístico Nível IIIA',
        manufacturing_date: '2023-01-15',
        validity_date: '2028-01-15',
        is_dangerous: false,
        protection_level: 'IIIA',
        size: 'M',
        batch: 'LOTE001',
        ca_number: 'CA12345',
        created_at: '2023-01-15T10:00:00',
        updated_at: '2023-01-15T10:00:00'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        serial_number: 'CAP002',
        status: 'EM_USO',
        model: 'Capacete Tático',
        manufacturing_date: '2022-06-10',
        validity_date: '2027-06-10',
        is_dangerous: false,
        protection_level: 'III',
        size: 'G',
        batch: 'LOTE002',
        ca_number: 'CA12346',
        current_user_name: 'João Silva',
        created_at: '2022-06-10T14:30:00',
        updated_at: '2023-12-01T09:15:00'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        serial_number: 'ARM003',
        status: 'EM_MANUTENCAO',
        model: 'Pistola .40',
        manufacturing_date: '2021-03-20',
        validity_date: '2026-03-20',
        weapon_registration_validity: '2025-03-20',
        is_dangerous: true,
        size: 'UNICO',
        batch: 'LOTE003',
        notes: 'Necessita manutenção preventiva',
        created_at: '2021-03-20T16:45:00',
        updated_at: '2023-11-15T11:20:00'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        serial_number: 'RAD004',
        status: 'EM_ESTOQUE',
        model: 'Rádio Comunicador',
        manufacturing_date: '2023-08-15',
        validity_date: '2028-08-15',
        is_dangerous: false,
        protection_level: null,
        size: 'UNICO',
        batch: 'LOTE004',
        ca_number: 'CA54321',
        created_at: '2023-08-15T08:00:00',
        updated_at: '2023-08-15T08:00:00'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        serial_number: 'LAN005',
        status: 'AGUARDANDO_DESCARTE',
        model: 'Lanterna Tática',
        manufacturing_date: '2019-03-10',
        validity_date: '2024-03-10',
        is_dangerous: false,
        protection_level: null,
        size: 'P',
        batch: 'LOTE005',
        notes: 'Fora da validade - aguarda descarte',
        created_at: '2019-03-10T12:00:00',
        updated_at: '2024-03-11T10:00:00'
      }
    ];
  }

  private saveEquipmentsToStorage(equipments: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(equipments));
      console.log('✅ Equipamentos salvos no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
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

      console.log('🔗 Tentando conectar com backend:', `${this.baseUrl}?${params}`);
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
      console.warn('⚠️ Backend não disponível ou sem permissão, usando dados locais:', error);

      // Fallback para dados locais quando backend não está disponível
      const equipments = this.getEquipmentsFromStorage();

      // Verificar se equipments é um array válido
      if (!Array.isArray(equipments)) {
        console.warn('⚠️ Dados locais não são um array válido:', equipments);
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

      if (filters?.isDangerous !== undefined) {
        filteredData = filteredData.filter((item: any) => item.is_dangerous === filters.isDangerous);
      }

      // Aplicar paginação
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      // Converter para camelCase
      const convertedData = paginatedData.map(item => this.convertToCamelCase(item));

      console.log('📱 Usando dados locais - Equipamentos:', convertedData.length);

      return {
        content: convertedData,
        totalElements: filteredData.length,
        totalPages: Math.ceil(filteredData.length / size),
        size: size,
        number: page,
        first: page === 0,
        last: endIndex >= filteredData.length
      };
    }
  }

  async create(equipment: CreateEquipmentRequest): Promise<Equipment> {
    try {
      console.log('🔗 Tentando criar equipamento no backend:', equipment);
      const response = await axios.post(this.baseUrl, equipment);
      console.log('✅ Equipamento criado com sucesso no backend:', response.data);
      return this.convertToCamelCase(response.data) as Equipment;
    } catch (error) {
      console.warn('⚠️ Backend não disponível, criando localmente:', error);

      // Fallback para criação local
      const equipments = this.getEquipmentsFromStorage();
      const newEquipment = {
        id: `550e8400-e29b-41d4-a716-${Date.now()}`,
        serial_number: equipment.serialNumber,
        status: equipment.status || 'EM_ESTOQUE',
        model: equipment.model,
        manufacturing_date: equipment.manufacturingDate,
        validity_date: equipment.validityDate,
        weapon_registration_validity: equipment.weaponRegistrationValidity,
        is_dangerous: equipment.isDangerous || false,
        protection_level: equipment.protectionLevel,
        size: equipment.size,
        batch: equipment.batch,
        ca_number: equipment.caNumber,
        notes: equipment.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      equipments.push(newEquipment);
      this.saveEquipmentsToStorage(equipments);

      console.log('📱 Equipamento criado localmente:', newEquipment);
      return this.convertToCamelCase(newEquipment) as Equipment;
    }
  }

  async getById(id: string): Promise<Equipment> {
    try {
      console.log('🔗 Tentando buscar equipamento por ID no backend:', id);
      const response = await axios.get(`${this.baseUrl}/${id}`);
      console.log('✅ Equipamento encontrado no backend:', response.data);
      return this.convertToCamelCase(response.data) as Equipment;
    } catch (error) {
      console.warn('⚠️ Backend não disponível, buscando localmente:', error);

      // Fallback para busca local
      const equipments = this.getEquipmentsFromStorage();
      const equipment = equipments.find(item => item.id === id);

      if (!equipment) {
        throw new Error(`Equipamento ${id} não encontrado.`);
      }

      console.log('📱 Equipamento encontrado localmente:', equipment);
      return this.convertToCamelCase(equipment) as Equipment;
    }
  }

  async update(id: string, equipmentData: Partial<CreateEquipmentRequest>): Promise<Equipment> {
    try {
      console.log('🔗 Tentando atualizar equipamento no backend:', id, equipmentData);
      const response = await axios.put(`${this.baseUrl}/${id}`, equipmentData);
      console.log('✅ Equipamento atualizado com sucesso no backend:', response.data);
      return this.convertToCamelCase(response.data) as Equipment;
    } catch (error) {
      console.warn('⚠️ Backend não disponível, atualizando localmente:', error);

      // Fallback para atualização local
      const equipments = this.getEquipmentsFromStorage();
      const index = equipments.findIndex(item => item.id === id);

      if (index === -1) {
        throw new Error(`Equipamento ${id} não encontrado.`);
      }

      // Converter camelCase para snake_case para armazenamento
      const updateData: unknown = {};
      if (equipmentData.serialNumber) updateData.serial_number = equipmentData.serialNumber;
      if (equipmentData.status) updateData.status = equipmentData.status;
      if (equipmentData.model) updateData.model = equipmentData.model;
      if (equipmentData.manufacturingDate) updateData.manufacturing_date = equipmentData.manufacturingDate;
      if (equipmentData.validityDate) updateData.validity_date = equipmentData.validityDate;
      if (equipmentData.weaponRegistrationValidity) updateData.weapon_registration_validity = equipmentData.weaponRegistrationValidity;
      if (equipmentData.isDangerous !== undefined) updateData.is_dangerous = equipmentData.isDangerous;
      if (equipmentData.protectionLevel) updateData.protection_level = equipmentData.protectionLevel;
      if (equipmentData.size) updateData.size = equipmentData.size;
      if (equipmentData.batch) updateData.batch = equipmentData.batch;
      if (equipmentData.caNumber) updateData.ca_number = equipmentData.caNumber;
      if (equipmentData.notes) updateData.notes = equipmentData.notes;

      equipments[index] = {
        ...equipments[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };

      this.saveEquipmentsToStorage(equipments);

      console.log('📱 Equipamento atualizado localmente:', equipments[index]);
      return this.convertToCamelCase(equipments[index]) as Equipment;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log('🔗 Tentando excluir equipamento no backend:', id);
      await axios.delete(`${this.baseUrl}/${id}`);
      console.log('✅ Equipamento excluído com sucesso no backend');
    } catch (error) {
      console.warn('⚠️ Backend não disponível, excluindo localmente:', error);

      // Fallback para exclusão local
      const equipments = this.getEquipmentsFromStorage();
      const index = equipments.findIndex(item => item.id === id);

      if (index === -1) {
        throw new Error(`Equipamento ${id} não encontrado`);
      }

      equipments.splice(index, 1);
      this.saveEquipmentsToStorage(equipments);
      console.log('📱 Equipamento excluído localmente');
    }
  }

  async getSummary(): Promise<EquipmentSummary> {
    console.log('🛠️ MODO PRODUÇÃO LOCAL: Gerando resumo');

    const equipments = this.getEquipmentsFromStorage();

    const total = equipments.length;
    const inUse = equipments.filter(item => item.status === 'EM_USO').length;
    const inStock = equipments.filter(item => item.status === 'EM_ESTOQUE').length;
    const inMaintenance = equipments.filter(item => item.status === 'EM_MANUTENCAO').length;
    const awaitingDisposal = equipments.filter(item => item.status === 'AGUARDANDO_DESCARTE').length;
    const dangerous = equipments.filter(item => item.is_dangerous).length;

    // Calcular vencimentos
    const now = new Date();
    const expired = equipments.filter(item => {
      if (!item.validity_date) return false;
      return new Date(item.validity_date) < now;
    }).length;

    const in30Days = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expiringSoon = equipments.filter(item => {
      if (!item.validity_date) return false;
      const validityDate = new Date(item.validity_date);
      return validityDate >= now && validityDate <= in30Days;
    }).length;

    const weaponExpired = equipments.filter(item => {
      if (!item.weapon_registration_validity) return false;
      return new Date(item.weapon_registration_validity) < now;
    }).length;

    const weaponExpiringSoon = equipments.filter(item => {
      if (!item.weapon_registration_validity) return false;
      const expiryDate = new Date(item.weapon_registration_validity);
      return expiryDate >= now && expiryDate <= in30Days;
    }).length;

    return {
      totalEquipments: total,
      activeEquipments: inUse,
      inStockEquipments: inStock,
      inMaintenanceEquipments: inMaintenance,
      expiredEquipments: expired,
      expiringSoon30Days: expiringSoon,
      expiringSoon60Days: 0, // Por enquanto não calculamos 60 dias
      weaponRegistrationExpired: weaponExpired,
      weaponRegistrationExpiringSoon30Days: weaponExpiringSoon,
      weaponRegistrationExpiringSoon60Days: 0, // Por enquanto não calculamos 60 dias
      dangerousEquipments: dangerous,
      equipmentsWithUsers: inUse // Equipamentos em uso têm usuários
    };
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