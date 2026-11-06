import api from '@/lib/axios';

export type VehicleReleaseStatus =
  | 'LIBERADO_SEM_RESTRICAO'
  | 'LIBERADO_COM_RESTRICAO'
  | 'NAO_LIBERADO';

export type InspectionType = 'LAUDO' | 'INSPECAO_TECNICA' | 'VISTORIA';

export interface VehicleInspection {
  id: string;
  registryNumber: string;
  inspectionType: InspectionType;
  inspectionDate: string; // YYYY-MM-DD
  vehicleId?: string;
  vehiclePlate: string;
  clientName?: string;
  projectName?: string; // OBRA
  currentMileage?: number;
  horimeterHours?: string; // Ex: 215HRS
  executionTeam?: string; // Ex: VAGNER SABINO / JAIRO
  requesterName?: string;
  driverName?: string;
  problemDescription?: string; // Ex: 1- MANUTENÇÃO PREVENTIVA
  anomaliesProblem?: string;
  occurrenceDescription?: string; // Ex: PREVENTIVA MENSAL
  servicesPerformed?: string;
  partsUsed?: string;
  partsReplaced?: string; // Ex: Descritas acima.
  technicalParameters?: string;
  evidencesUrls?: string; // JSON Array com até 8 imagens (URLs ou Base64)
  resultNotes?: string;
  releaseStatus: VehicleReleaseStatus;
  restrictionDescription?: string; // Ex: Sem restrição.
  restrictionDeadline?: string;
  restrictionResponsible?: string;
  definitiveReleaseCondition?: string;
  managerName?: string; // Gerente Manutenção
  engineerName?: string; // Engenheiro Mecânico
  inspectorName?: string;
  supervisorName?: string;
  inspectorSignature?: string;
  supervisorSignature?: string;
  releaseSignature?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateVehicleInspectionDTO = Omit<VehicleInspection, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateVehicleInspectionDTO = Partial<CreateVehicleInspectionDTO>;

export interface VehicleInspectionFilters {
  plate?: string;
  client?: string;
  project?: string;
  status?: VehicleReleaseStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

const STORAGE_KEY = 'fluxbus_vehicle_inspections_local_v1';

export const DEFAULT_SERVICES_PERFORMED_TEMPLATE =
  'conferiu barras e ponteiras de direção, conferiu coifa e mangas de eixo, conferiu vazamentos hidraulicos, conferiu fixação dos mangotes, conferiu óleo motor, caixa e diferencial, conferiu cuícas, lonas e catracas de freio, regulou freio em geral, conferiu folgas do eixo S, conferiu vazamentos pneumáticos, conferiu cubos, conferiu freio de estacionamento, conferiu amortecedores e estabilizadores, lubrificou todo veiculo, conferiu pinos de centro e feixe de molas, conferiu rolamento de centro, conferiu flange da caixa de cambio, conferiu cruzeta, conferiu embreagem, conferiu eixo cardan, conferiu níveis de óleo e água, trocou filtro de ar, conferiu parte eletrica, conferiu sistema de registro de velocidade, conferiu pneus e calibração e aperto dos parafusos, conferiu sistema de fechamento de porta malas, conferiu motor, conferiu carroceria, conferiu ar condicionado.';

function getLocalInspections(): VehicleInspection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveLocalInspections(list: VehicleInspection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export const vehicleInspectionService = {
  async getInspections(filters: VehicleInspectionFilters = {}): Promise<{
    content: VehicleInspection[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters.plate) params.append('plate', filters.plate);
      if (filters.client) params.append('client', filters.client);
      if (filters.project) params.append('project', filters.project);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.page !== undefined) params.append('page', String(filters.page));
      if (filters.size !== undefined) params.append('size', String(filters.size));

      const response = await api.get(`/api/vehicle-inspections?${params.toString()}`);
      if (response?.data && Array.isArray(response.data.content)) {
        // Se houver laudos locais, combina sem duplicação
        const local = getLocalInspections();
        const apiMap = new Map<string, VehicleInspection>();
        for (const it of response.data.content) {
          apiMap.set(it.id, it);
        }
        for (const loc of local) {
          if (!apiMap.has(loc.id)) {
            apiMap.set(loc.id, loc);
          }
        }
        const combined = Array.from(apiMap.values()).sort((a, b) =>
          (b.inspectionDate || '').localeCompare(a.inspectionDate || '')
        );
        return {
          content: combined,
          totalElements: Math.max(response.data.totalElements || 0, combined.length),
          totalPages: response.data.totalPages || 1,
          size: response.data.size || combined.length,
          number: response.data.number || 0,
        };
      }
    } catch {
      // continua para fallback local
    }

    const localList = getLocalInspections();
    let filtered = [...localList];
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.registryNumber || '').toLowerCase().includes(term) ||
          (i.vehiclePlate || '').toLowerCase().includes(term) ||
          (i.clientName || '').toLowerCase().includes(term) ||
          (i.projectName || '').toLowerCase().includes(term) ||
          (i.servicesPerformed || '').toLowerCase().includes(term)
      );
    }
    if (filters.status) {
      filtered = filtered.filter((i) => i.releaseStatus === filters.status);
    }
    filtered.sort((a, b) => (b.inspectionDate || '').localeCompare(a.inspectionDate || ''));

    return {
      content: filtered,
      totalElements: filtered.length,
      totalPages: 1,
      size: filtered.length,
      number: 0,
    };
  },

  async getInspection(id: string): Promise<VehicleInspection> {
    try {
      const response = await api.get(`/api/vehicle-inspections/${id}`);
      if (response?.data) return response.data;
    } catch {
      // fallback
    }
    const local = getLocalInspections().find((i) => i.id === id);
    if (local) return local;
    throw new Error('Laudo de inspeção não encontrado.');
  },

  async createInspection(data: CreateVehicleInspectionDTO): Promise<VehicleInspection> {
    const localId = `laudo-${Date.now()}`;
    const nextReg = data.registryNumber || (await this.getNextRegistryNumber());
    const completeData: VehicleInspection = {
      ...data,
      id: localId,
      registryNumber: nextReg,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await api.post('/api/vehicle-inspections', data);
      if (response?.data?.id) {
        // Atualiza cache local
        const localList = getLocalInspections().filter((i) => i.id !== response.data.id);
        localList.unshift(response.data);
        saveLocalInspections(localList);
        return response.data;
      }
    } catch {
      // Salva localmente se offline/erro de conexão
    }

    const localList = getLocalInspections().filter((i) => i.id !== localId);
    localList.unshift(completeData);
    saveLocalInspections(localList);
    return completeData;
  },

  async updateInspection(id: string, data: UpdateVehicleInspectionDTO): Promise<VehicleInspection> {
    try {
      const response = await api.put(`/api/vehicle-inspections/${id}`, data);
      if (response?.data) {
        const localList = getLocalInspections().map((i) => (i.id === id ? response.data : i));
        saveLocalInspections(localList);
        return response.data;
      }
    } catch {
      // fallback local
    }

    const localList = getLocalInspections();
    const existingIndex = localList.findIndex((i) => i.id === id);
    if (existingIndex !== -1) {
      const updated: VehicleInspection = {
        ...localList[existingIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localList[existingIndex] = updated;
      saveLocalInspections(localList);
      return updated;
    }

    return {
      id,
      registryNumber: data.registryNumber || '14598',
      inspectionType: data.inspectionType || 'LAUDO',
      inspectionDate: data.inspectionDate || new Date().toISOString().substring(0, 10),
      vehiclePlate: data.vehiclePlate || '',
      releaseStatus: data.releaseStatus || 'LIBERADO_SEM_RESTRICAO',
      ...data,
    };
  },

  async deleteInspection(id: string): Promise<void> {
    try {
      await api.delete(`/api/vehicle-inspections/${id}`);
    } catch {
      // ignore
    }
    const localList = getLocalInspections().filter((i) => i.id !== id);
    saveLocalInspections(localList);
  },

  async getNextRegistryNumber(): Promise<string> {
    try {
      const response = await api.get('/api/vehicle-inspections/next-registry-number');
      if (response?.data?.nextRegistryNumber) {
        return response.data.nextRegistryNumber;
      }
    } catch {
      // fallback
    }
    const localList = getLocalInspections();
    let highest = 14597;
    for (const it of localList) {
      const clean = (it.registryNumber || '').replace(/[^0-9]/g, '');
      if (clean) {
        const num = parseInt(clean, 10);
        if (num > highest) highest = num;
      }
    }
    return String(highest + 1);
  },
};
export default vehicleInspectionService;
