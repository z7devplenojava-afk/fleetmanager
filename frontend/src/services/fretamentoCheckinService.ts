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
      synced: navigator.onLine,
    };

    // Salvar localmente
    const list = this.getHistory();
    list.unshift(record);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Erro ao gravar check-in no localStorage:', e);
    }

    // Tentar envio ao backend
    if (navigator.onLine) {
      try {
        await api.post('/fretamento/checkins', record);
      } catch (err) {
        console.warn('Backend /fretamento/checkins indisponível; mantido offline:', err);
      }
    }

    return record;
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

    // Mock inicial enriquecido com dados de exemplo da Viação São Silvestre
    return [
      {
        id: 'chk_mock_1',
        passengerId: 'p-1',
        passengerName: 'Carlos Henrique Silva',
        cpf: '123.456.789-00',
        matricula: 'FUN-1002',
        companyName: 'Mineração Vale Verde',
        lineName: 'Linha Rosa - Serra Verde (Fretado)',
        vehiclePlate: 'SHZ-3A40',
        driverName: 'Marcos Oliveira',
        checkinType: 'QR_SCAN_BY_PASSENGER',
        latitude: -19.9231,
        longitude: -43.9458,
        address: 'Av. Amazonas, 1200 - Centro, Belo Horizonte - MG',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        synced: true,
      },
      {
        id: 'chk_mock_2',
        passengerId: 'p-1',
        passengerName: 'Carlos Henrique Silva',
        cpf: '123.456.789-00',
        matricula: 'FUN-1002',
        companyName: 'Mineração Vale Verde',
        lineName: 'Linha Rosa - Serra Verde (Fretado)',
        vehiclePlate: 'SHZ-3A40',
        driverName: 'Marcos Oliveira',
        checkinType: 'QR_SCAN_BY_DRIVER',
        latitude: -19.8214,
        longitude: -43.9512,
        address: 'Portaria 1 - Complexo Industrial Serra Verde, MG',
        timestamp: new Date(Date.now() - 3600000 * 27).toISOString(),
        synced: true,
      },
    ];
  },
};

export default fretamentoCheckinService;
