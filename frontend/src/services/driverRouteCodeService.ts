import api from '@/lib/axios';

export interface DriverRouteCode {
  id?: string;
  code: string;
  description: string;
  requiresJustification?: boolean;
  displayOrder?: number;
  active?: boolean;
  companyId?: string;
}

export const DEFAULT_DRIVER_ROUTE_CODES: DriverRouteCode[] = [
  { code: '01', description: 'CASA/PONTO', requiresJustification: false, displayOrder: 1, active: true },
  { code: '02', description: 'CASA/GARAGEM', requiresJustification: false, displayOrder: 2, active: true },
  { code: '03', description: 'CASA/FÁBRICA', requiresJustification: false, displayOrder: 3, active: true },
  { code: '04', description: 'PONTO/CASA', requiresJustification: false, displayOrder: 4, active: true },
  { code: '05', description: 'PONTO/GARAGEM', requiresJustification: false, displayOrder: 5, active: true },
  { code: '06', description: 'PONTO/FÁBRICA', requiresJustification: false, displayOrder: 6, active: true },
  { code: '07', description: 'GARAGEM/CASA', requiresJustification: false, displayOrder: 7, active: true },
  { code: '08', description: 'GARAGEM/PONTO', requiresJustification: false, displayOrder: 8, active: true },
  { code: '09', description: 'GARAGEM/FÁBRICA', requiresJustification: false, displayOrder: 9, active: true },
  { code: '10', description: 'FÁBRICA/CASA', requiresJustification: false, displayOrder: 10, active: true },
  { code: '11', description: 'FÁBRICA/PONTO', requiresJustification: false, displayOrder: 11, active: true },
  { code: '12', description: 'FÁBRICA/GARAGEM', requiresJustification: false, displayOrder: 12, active: true },
  { code: '13', description: 'FÁBRICA/FÁBRICA', requiresJustification: false, displayOrder: 13, active: true },
  { code: '14', description: 'FINAL/FÁBRICA', requiresJustification: false, displayOrder: 14, active: true },
  { code: '15', description: 'OUTROS', requiresJustification: true, displayOrder: 15, active: true },
];

export const DEFAULT_ROUTE_CODES = DEFAULT_DRIVER_ROUTE_CODES;

const LOCAL_STORAGE_KEY = 'fluxbus_custom_route_codes_v1';
const SESSION_UNAVAILABLE_KEY = 'fluxbus_route_codes_endpoint_unavailable_v1';
let endpointUnavailableInSession =
  typeof sessionStorage !== 'undefined' &&
  sessionStorage.getItem(SESSION_UNAVAILABLE_KEY) === 'true';

const getLocalCustomCodes = (): DriverRouteCode[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalCustomCodes = (codes: DriverRouteCode[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(codes));
  } catch {
    // ignore storage errors
  }
};

const mergeCodes = (apiCodes: DriverRouteCode[], localCodes: DriverRouteCode[]): DriverRouteCode[] => {
  const map = new Map<string, DriverRouteCode>();
  DEFAULT_DRIVER_ROUTE_CODES.forEach((c) => map.set(c.code, c));
  apiCodes.forEach((c) => {
    if (c && c.code && c.active !== false) {
      map.set(c.code, c);
    }
  });
  localCodes.forEach((c) => {
    if (c && c.code && c.active !== false) {
      map.set(c.code, c);
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    const ordA = a.displayOrder ?? Number.parseInt(a.code, 10) ?? 99;
    const ordB = b.displayOrder ?? Number.parseInt(b.code, 10) ?? 99;
    if (ordA !== ordB) return ordA - ordB;
    return a.code.localeCompare(b.code, 'pt-BR', { numeric: true });
  });
};

export const driverRouteCodeService = {
  async list(): Promise<DriverRouteCode[]> {
    return this.getAll();
  },

  async getAll(): Promise<DriverRouteCode[]> {
    const localCodes = getLocalCustomCodes();
    if (endpointUnavailableInSession) {
      return mergeCodes([], localCodes);
    }
    try {
      const response = await api.get('/api/driver-route-codes', {
        silentErrorLog: true,
      } as any);
      const data = Array.isArray(response.data) ? response.data : [];
      return mergeCodes(data, localCodes);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        endpointUnavailableInSession = true;
        try {
          sessionStorage.setItem(SESSION_UNAVAILABLE_KEY, 'true');
        } catch {
          // ignore
        }
      }
      return mergeCodes([], localCodes);
    }
  },

  async create(payload: Omit<DriverRouteCode, 'id'>): Promise<DriverRouteCode> {
    const normalized: DriverRouteCode = {
      ...payload,
      code: payload.code.trim().padStart(2, '0').toUpperCase(),
      description: payload.description.trim().toUpperCase(),
      requiresJustification: Boolean(payload.requiresJustification),
      displayOrder: payload.displayOrder ?? (Number.parseInt(payload.code, 10) || 99),
      active: true,
    };

    const localCodes = getLocalCustomCodes().filter((c) => c.code !== normalized.code);
    const savedLocal: DriverRouteCode = { ...normalized, id: `local-${Date.now()}` };
    saveLocalCustomCodes([...localCodes, savedLocal]);

    if (endpointUnavailableInSession) {
      return savedLocal;
    }

    try {
      const response = await api.post('/api/driver-route-codes', normalized, {
        silentErrorLog: true,
      } as any);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        endpointUnavailableInSession = true;
        try {
          sessionStorage.setItem(SESSION_UNAVAILABLE_KEY, 'true');
        } catch {
          // ignore
        }
      }
      return savedLocal;
    }
  },

  async remove(codeOrId: string): Promise<void> {
    const localCodes = getLocalCustomCodes().filter(
      (c) => c.id !== codeOrId && c.code !== codeOrId
    );
    saveLocalCustomCodes(localCodes);

    if (!endpointUnavailableInSession && codeOrId && !codeOrId.startsWith('local-') && codeOrId.length > 10) {
      try {
        await api.delete(`/api/driver-route-codes/${codeOrId}`, {
          silentErrorLog: true,
        } as any);
      } catch {
        // ignore if offline
      }
    }
  },
};

export default driverRouteCodeService;
