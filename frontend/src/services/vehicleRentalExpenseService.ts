import api from '@/lib/axios';

export type RentalExpenseCategory =
  | 'MANUTENCAO'
  | 'AVARIA_SINISTRO'
  | 'PECAS_REPAROS'
  | 'PNEUS'
  | 'COMBUSTIVEL'
  | 'MULTA_INFRACAO'
  | 'LAVAGEM_HIGIENIZACAO'
  | 'SEGURO_FRANQUIA'
  | 'REBOQUE_SOCORRO'
  | 'PEDAGIO'
  | 'MOBILIZACAO'
  | 'OUTROS';

export type RentalExpenseResponsibility = 'CLIENTE' | 'LOCADORA' | 'COMPARTILHADA';

export type RentalExpenseStatus =
  | 'PENDENTE'
  | 'FATURADO'
  | 'PAGO_PELO_CLIENTE'
  | 'REEMBOLSADO'
  | 'ISENTO';

export interface VehicleRentalExpense {
  id: string;
  vehicleId: string;
  clientId?: string;
  clientName?: string;
  workPostId?: string;
  workPostName?: string;
  contractNumber?: string;
  expenseDate: string;
  category: RentalExpenseCategory | string;
  description: string;
  documentNumber?: string;
  amount: number;
  responsibility: RentalExpenseResponsibility | string;
  reimbursementStatus: RentalExpenseStatus | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleRentalExpenseInput {
  clientId?: string;
  clientName?: string;
  workPostId?: string;
  workPostName?: string;
  contractNumber?: string;
  expenseDate: string;
  category: string;
  description: string;
  documentNumber?: string;
  amount: number;
  responsibility?: string;
  reimbursementStatus?: string;
  notes?: string;
}

export const RENTAL_EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  MANUTENCAO: 'Manutenção Corretiva / Preventiva',
  AVARIA_SINISTRO: 'Avaria / Mau Uso / Sinistro',
  PECAS_REPAROS: 'Peças e Reparos',
  PNEUS: 'Pneus / Borracharia',
  COMBUSTIVEL: 'Combustível / Abastecimento',
  MULTA_INFRACAO: 'Multa / Infração de Trânsito',
  LAVAGEM_HIGIENIZACAO: 'Lavagem / Higienização',
  SEGURO_FRANQUIA: 'Seguro / Franquia',
  REBOQUE_SOCORRO: 'Reboque / Socorro Mecânico',
  PEDAGIO: 'Pedágio / Estacionamento',
  MOBILIZACAO: 'Mobilização / Desmobilização',
  OUTROS: 'Outras Despesas da Locação',
};

export const RENTAL_EXPENSE_RESPONSIBILITY_LABELS: Record<string, string> = {
  CLIENTE: 'Responsabilidade do Cliente',
  LOCADORA: 'Responsabilidade da Locadora',
  COMPARTILHADA: 'Compartilhada',
};

export const RENTAL_EXPENSE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: 'Pendente de Cobrança', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  FATURADO: { label: 'Incluído em Fatura / Medição', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  PAGO_PELO_CLIENTE: { label: 'Pago pelo Cliente', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  REEMBOLSADO: { label: 'Reembolsado', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  ISENTO: { label: 'Abonado / Isento', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
};

const getStorageKey = (vehicleId: string) => `fluxbus_vehicle_rental_expenses_${vehicleId}`;

const readLocalExpenses = (vehicleId: string): VehicleRentalExpense[] => {
  if (!vehicleId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(vehicleId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalExpenses = (vehicleId: string, list: VehicleRentalExpense[]) => {
  if (!vehicleId) return;
  try {
    localStorage.setItem(getStorageKey(vehicleId), JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
};

const normalizeExpense = (raw: any, vehicleId: string): VehicleRentalExpense => ({
  id: String(raw.id || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
  vehicleId: String(raw.vehicleId || vehicleId),
  clientId: raw.clientId || undefined,
  clientName: raw.clientName || undefined,
  workPostId: raw.workPostId || undefined,
  workPostName: raw.workPostName || undefined,
  contractNumber: raw.contractNumber || undefined,
  expenseDate: (raw.expenseDate || new Date().toISOString()).substring(0, 10),
  category: raw.category || 'MANUTENCAO',
  description: raw.description || 'Despesa da Locação',
  documentNumber: raw.documentNumber || undefined,
  amount: Number(raw.amount) || 0,
  responsibility: raw.responsibility || 'CLIENTE',
  reimbursementStatus: raw.reimbursementStatus || 'PENDENTE',
  notes: raw.notes || undefined,
  createdAt: raw.createdAt || new Date().toISOString(),
  updatedAt: raw.updatedAt || new Date().toISOString(),
});

export const vehicleRentalExpenseService = {
  async listByVehicle(vehicleId: string): Promise<VehicleRentalExpense[]> {
    if (!vehicleId) return [];
    const localList = readLocalExpenses(vehicleId);
    try {
      const response = await api.get<any[]>(`/vehicles/${vehicleId}/rental-expenses`, {
        _silentError: true,
      } as any);
      if (Array.isArray(response.data)) {
        const remoteNormalized = response.data.map(item => normalizeExpense(item, vehicleId));
        // Merge any local-only items not yet synced
        const remoteIds = new Set(remoteNormalized.map(r => r.id));
        const localOnly = localList.filter(l => l.id.startsWith('local-') && !remoteIds.has(l.id));
        const merged = [...remoteNormalized, ...localOnly].sort((a, b) =>
          (b.expenseDate || '').localeCompare(a.expenseDate || '')
        );
        writeLocalExpenses(vehicleId, merged);
        return merged;
      }
    } catch {
      // Fallback to local storage when endpoint not yet available
    }
    return localList.sort((a, b) => (b.expenseDate || '').localeCompare(a.expenseDate || ''));
  },

  async create(vehicleId: string, input: VehicleRentalExpenseInput): Promise<VehicleRentalExpense> {
    try {
      const response = await api.post<any>(`/vehicles/${vehicleId}/rental-expenses`, input, {
        _silentError: true,
      } as any);
      const created = normalizeExpense(response.data, vehicleId);
      const current = readLocalExpenses(vehicleId).filter(e => e.id !== created.id);
      writeLocalExpenses(vehicleId, [created, ...current]);
      return created;
    } catch {
      const fallback: VehicleRentalExpense = normalizeExpense(
        {
          ...input,
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          vehicleId,
        },
        vehicleId
      );
      const current = readLocalExpenses(vehicleId);
      writeLocalExpenses(vehicleId, [fallback, ...current]);
      return fallback;
    }
  },

  async update(vehicleId: string, expenseId: string, input: Partial<VehicleRentalExpenseInput>): Promise<VehicleRentalExpense> {
    if (!expenseId.startsWith('local-')) {
      try {
        const response = await api.put<any>(`/vehicles/${vehicleId}/rental-expenses/${expenseId}`, input, {
          _silentError: true,
        } as any);
        const updated = normalizeExpense(response.data, vehicleId);
        const current = readLocalExpenses(vehicleId).map(item => (item.id === expenseId ? updated : item));
        writeLocalExpenses(vehicleId, current);
        return updated;
      } catch {
        // Fallback to local update
      }
    }
    const current = readLocalExpenses(vehicleId);
    let updatedItem: VehicleRentalExpense | null = null;
    const next = current.map(item => {
      if (item.id === expenseId) {
        updatedItem = normalizeExpense({ ...item, ...input, id: expenseId, updatedAt: new Date().toISOString() }, vehicleId);
        return updatedItem;
      }
      return item;
    });
    if (!updatedItem) {
      updatedItem = normalizeExpense({ ...input, id: expenseId, vehicleId }, vehicleId);
      next.unshift(updatedItem);
    }
    writeLocalExpenses(vehicleId, next);
    return updatedItem;
  },

  async remove(vehicleId: string, expenseId: string): Promise<void> {
    if (!expenseId.startsWith('local-')) {
      try {
        await api.delete(`/vehicles/${vehicleId}/rental-expenses/${expenseId}`, {
          _silentError: true,
        } as any);
      } catch {
        // Proceed with local removal
      }
    }
    const current = readLocalExpenses(vehicleId).filter(item => item.id !== expenseId);
    writeLocalExpenses(vehicleId, current);
  },
};
