import api from '@/lib/axios';
import { Employee, EmployeeHistoryItem } from '@/types/employee';

interface BackendEmployeeHistory {
  id: string;
  employeeId: string;
  eventType: string;
  eventDate: string;
  description: string;
  relatedDocumentUrl?: string;
  createdBy?: string;
  createdAt?: string;
}

function toItem(h: BackendEmployeeHistory): EmployeeHistoryItem {
  return {
    id: h.id,
    type: (h.eventType as EmployeeHistoryItem['type']) || 'admissao',
    date: h.eventDate,
    description: h.description,
    relatedDocumentUrl: h.relatedDocumentUrl,
  };
}

/**
 * Eventos derivados dos dados do próprio cadastro (admissão, férias, rescisão...).
 * Servem como complemento ao histórico persistido no backend.
 */
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

/**
 * Histórico do colaborador persistido no backend (/api/employees/{id}/history),
 * complementado por eventos derivados do próprio cadastro.
 */
export const employeeHistoryService = {
  async getHistory(employee: Employee): Promise<EmployeeHistoryItem[]> {
    if (!employee?.id) return [];

    let remote: EmployeeHistoryItem[] = [];
    try {
      const response = await api.get<BackendEmployeeHistory[]>(
        `/api/employees/${employee.id}/history`,
      );
      remote = (response.data || []).map(toItem);
    } catch {
      remote = [];
    }

    const derived = deriveFromEmployee(employee);
    const seen = new Set<string>();
    const merged = [...derived, ...remote].filter((item) => {
      const key = `${item.type}|${item.date}|${item.description}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  async addItem(
    employeeId: string,
    item: Omit<EmployeeHistoryItem, 'id'>,
  ): Promise<EmployeeHistoryItem> {
    const response = await api.post<BackendEmployeeHistory>(
      `/api/employees/${employeeId}/history`,
      {
        eventType: item.type,
        eventDate: item.date,
        description: item.description,
        relatedDocumentUrl: item.relatedDocumentUrl,
      },
    );
    return toItem(response.data);
  },

  async removeItem(employeeId: string, itemId: string): Promise<void> {
    await api.delete(`/api/employees/${employeeId}/history/${itemId}`);
  },
};

export default employeeHistoryService;
