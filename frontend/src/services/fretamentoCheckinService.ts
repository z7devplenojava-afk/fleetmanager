import api from '@/services/api';

export interface FretamentoCheckinRecord {
  id: string;
  passengerId: string;
  passengerName: string;
  cpf: string;
  matricula: string;
  companyName: string;
  lineName: string;
  vehiclePlate: string;
  driverName?: string;
  direction?: 'IDA' | 'RETORNO';
  checkinType: 'QR_SCAN_BY_PASSENGER' | 'QR_SCAN_BY_DRIVER' | 'MANUAL_CPF' | 'MANUAL_MATRICULA';
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  synced: boolean;
}

const STORAGE_KEY = 'fretamento_passenger_checkins_history';

/**
 * Obtém a posição geográfica atual do dispositivo com Promise
 */
export async function getCurrentGeoPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // Fallback: Centro de Belo Horizonte (Matriz VSS)
      resolve({ latitude: -19.9227, longitude: -43.9451 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        console.warn('Geolocalização não autorizada ou indisponível:', err.message);
        // Fallback default
        resolve({ latitude: -19.9227, longitude: -43.9451 });
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  });
}

/**
 * Converte coordenadas (lat, lng) em endereço textual (Geocoding Reverso)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const road = addr.road || addr.street || addr.pedestrian || '';
        const number = addr.house_number ? `, ${addr.house_number}` : '';
        const suburb = addr.suburb || addr.neighbourhood ? ` - ${addr.suburb || addr.neighbourhood}` : '';
        const city = addr.city || addr.town || addr.municipality || 'Belo Horizonte';
        const state = addr.state ? ` - ${addr.state}` : '';
        
        if (road) {
          return `${road}${number}${suburb}, ${city}${state}`;
        }
        return data.display_name.split(',').slice(0, 3).join(', ');
      }
    }
  } catch (error) {
    console.warn('Erro ao consultar Nominatim OSM para geocoding reverso:', error);
  }

  // Fallback baseado nas coordenadas aproximadas
  return `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Próximo ao Ponto de Embarque)`;
}

export const fretamentoCheckinService = {
  /**
   * Salva um check-in no histórico local e tenta sincronizar com a API se online
   */
  async registerCheckin(data: Omit<FretamentoCheckinRecord, 'id' | 'timestamp' | 'synced' | 'latitude' | 'longitude' | 'address'> & {
    latitude?: number;
    longitude?: number;
    address?: string;
    tripId?: string;
    scheduleId?: string;
  }): Promise<FretamentoCheckinRecord> {
    let lat = data.latitude;
    let lng = data.longitude;
    let addr = data.address;

    if (lat === undefined || lng === undefined) {
      const geo = await getCurrentGeoPosition();
      lat = geo.latitude;
      lng = geo.longitude;
    }

    if (!addr) {
      addr = await reverseGeocode(lat, lng);
    }

    const record: FretamentoCheckinRecord = {
      ...data,
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      latitude: lat,
      longitude: lng,
      address: addr,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    // Tentar validação e registro no backend
    if (navigator.onLine) {
      try {
        const payload = {
          passengerId: data.passengerId,
          cpf: data.cpf,
          matricula: data.matricula,
          tripId: data.tripId,
          scheduleId: data.scheduleId,
          latitude: lat,
          longitude: lng,
          validationMode: data.checkinType,
          direction: data.direction || 'IDA',
          isSyncedOffline: false
        };
        await api.post('/api/boardings/validate-qr', payload);
        record.synced = true;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message;
        // Se foi erro de validação (demitido, bloqueado ou rota não autorizada), lançar erro para feedback visual vermelho
        if (msg && (msg.includes('RECUSADO') || msg.includes('DEMITIDO') || msg.includes('BLOQUEADO') || msg.includes('não autorizado'))) {
          throw new Error(msg);
        }
        console.warn('Backend indisponível para check-in instantâneo; mantido na fila offline:', err);
      }
    }

    // Salvar localmente
    const list = this.getHistory();
    list.unshift(record);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Erro ao gravar check-in no localStorage:', e);
    }

    return record;
  },

  /**
   * Sincroniza todos os registros acumulados na fila offline
   */
  async syncOfflineQueue(): Promise<number> {
    if (!navigator.onLine) return 0;
    const list = this.getHistory();
    const unsynced = list.filter((i) => !i.synced);
    if (unsynced.length === 0) return 0;

    try {
      const dtos = unsynced.map((item) => ({
        passengerId: item.passengerId,
        passengerName: item.passengerName,
        passengerCpf: item.cpf,
        passengerRegistration: item.matricula,
        boardingLatitude: item.latitude,
        boardingLongitude: item.longitude,
        direction: item.direction || 'IDA',
        validationMode: item.checkinType,
        isSyncedOffline: true,
        boardingTime: item.timestamp,
      }));

      await api.post('/api/boardings/batch-sync', dtos);

      const updated = list.map((i) => ({ ...i, synced: true }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return unsynced.length;
    } catch (e) {
      console.warn('Erro ao sincronizar fila offline de embarques:', e);
      return 0;
    }
  },

  /**
   * Retorna todo o histórico de check-ins salvos
   */
  getHistory(cpfOrMatricula?: string): FretamentoCheckinRecord[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const list: FretamentoCheckinRecord[] = JSON.parse(saved);
        if (cpfOrMatricula) {
          const clean = cpfOrMatricula.replace(/\D/g, '').toLowerCase();
          return list.filter(
            (item) =>
              item.cpf.replace(/\D/g, '') === clean ||
              item.matricula.toLowerCase() === cpfOrMatricula.toLowerCase()
          );
        }
        return list;
      }
    } catch (e) {
      console.error('Erro ao obter histórico de check-ins:', e);
    }

    return [];
  },

  /**
   * Busca histórico de embarques do passageiro diretamente do backend
   */
  async fetchRemoteHistory(): Promise<FretamentoCheckinRecord[]> {
    try {
      const res = await api.get('/api/boardings/my-history');
      if (res.data && Array.isArray(res.data)) {
        return res.data.map((b: any) => ({
          id: b.id,
          passengerId: b.passengerId,
          passengerName: b.passengerName || 'Passageiro',
          cpf: b.passengerCpf || '',
          matricula: b.passengerRegistration || '',
          companyName: b.clientName || 'Cliente Contratante',
          lineName: b.routeName || 'Linha Corporativa',
          vehiclePlate: b.vehiclePlate || 'Veículo Executivo',
          direction: b.direction || 'IDA',
          checkinType: (b.validationMode as any) || 'QR_SCAN_BY_PASSENGER',
          latitude: b.boardingLatitude || -19.9227,
          longitude: b.boardingLongitude || -43.9451,
          address: 'Ponto de Embarque Confirmado',
          timestamp: b.boardingTime || b.createdAt,
          synced: true,
        }));
      }
    } catch (e) {
      console.warn('Não foi possível carregar histórico remoto de embarques:', e);
    }
    return this.getHistory();
  }
};

// Sincronização automática em background ao recuperar conexão
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    fretamentoCheckinService.syncOfflineQueue().then((count) => {
      if (count > 0) {
        console.log(`📡 Sincronizados ${count} embarques offline com o servidor.`);
      }
    });
  });
}

export default fretamentoCheckinService;
