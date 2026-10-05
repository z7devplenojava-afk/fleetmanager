import { Employee, EmployeeHistoryItem } from '@/types/employee';

const STORAGE_PREFIX = 'employee_history_';

function readLocal(employeeId: string): EmployeeHistoryItem[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${employeeId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(employeeId: string, items: EmployeeHistoryItem[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${employeeId}`, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

function deriveFromEmployee(employee: Employee): EmployeeHistoryItem[] {
  const items: EmployeeHistoryItem[] = [];
  const baseId = employee.id || 'unknown';

  if (employee.hireDate) {
    items.push({
      id: `${baseId}-admissao`,
      type: 'admissao',
      date: employee.hireDate,
      description: `Admissão${employee.position?.name ? ` como ${employee.position.name}` : ''}`,
    });
  }

  if (employee.status === 'VACATION') {
    items.push({
      id: `${baseId}-ferias`,
      type: 'afastamento',
      date: employee.updatedAt || employee.createdAt || new Date().toISOString().slice(0, 10),
      description: 'Entrada em férias',
    });
  }

  if (employee.status === 'TERMINATED') {
    const termDate = employee.terminationDate || employee.dataRescisao;
    if (termDate) {
      items.push({
        id: `${baseId}-demissao`,
        type: 'afastamento',
        date: termDate,
        description: 'Demissão / rescisão contratual',
      });
    }
  }

  if (employee.afastamentoMotivo || employee.afastamentoData) {
    items.push({
      id: `${baseId}-afastamento`,
      type: 'afastamento',
      date: employee.afastamentoData || employee.updatedAt || new Date().toISOString().slice(0, 10),
      description: employee.afastamentoMotivo || 'Afastamento registrado',
    });
  }

  (employee.history || []).forEach((h, idx) => {
    items.push({ ...h, id: h.id || `${baseId}-hist-${idx}` });
  });

  if (employee.createdAt) {
    items.push({
      id: `${baseId}-criacao`,
      type: 'admissao',
      date: employee.createdAt.slice(0, 10),
      description: 'Cadastro criado no sistema',
    });
  }

  return items;
}

export const employeeHistoryService = {
  async getHistory(employee: Employee): Promise<EmployeeHistoryItem[]> {
    if (!employee?.id) return [];
    try {
      const local = readLocal(employee.id);
      const derived = deriveFromEmployee(employee);
      const seen = new Set<string>();
      const merged = [...derived, ...local].filter(item => {
        const key = `${item.type}|${item.date}|${item.description}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } catch {
      return deriveFromEmployee(employee);
    }
  },

  async addItem(employeeId: string, item: Omit<EmployeeHistoryItem, 'id'>): Promise<EmployeeHistoryItem> {
    const created: EmployeeHistoryItem = {
      ...item,
      id: `${employeeId}-${Date.now()}`,
    };
    const local = readLocal(employeeId);
    writeLocal(employeeId, [created, ...local]);
    return created;
  },

  async removeItem(employeeId: string, itemId: string): Promise<void> {
    const local = readLocal(employeeId);
    writeLocal(employeeId, local.filter(i => i.id !== itemId));
  },
};

export default employeeHistoryService;
