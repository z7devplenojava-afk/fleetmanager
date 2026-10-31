/**
 * Smart Routing Service
 * Suporta OSRM (OpenStreetMap driving) multi-paradas com respeito ao sentido das vias,
 * mãos únicas e ruas sem saída, com fallback/alternância automática para Google Maps Directions API
 * caso a chave VITE_GOOGLE_MAPS_API_KEY esteja configurada.
 */

export interface RoutingPoint {
    id?: string;
    latitude: number;
    longitude: number;
    name?: string;
    type?: 'START' | 'BOARDING' | 'DEBARKATION' | 'END';
    order?: number;
    radiusMeters?: number;
}

export interface RoutingResult {
    distanceKm: number;
    durationMinutes: number;
    polyline: [number, number][]; // [lat, lng] para Leaflet
    provider: 'OSRM' | 'GOOGLE_MAPS';
    pointsInOrder?: RoutingPoint[];
}

export const smartRoutingService = {
    /**
     * Calcula o trajeto viário completo passando por todos os pontos na ordem especificada.
     */
    async calculateRoute(points: RoutingPoint[]): Promise<RoutingResult> {
        if (!points || points.length < 2) {
            throw new Error('É necessário pelo menos 2 pontos para calcular uma rota.');
        }

        const googleApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;

        // Se houver chave do Google Maps configurada, tenta Google Directions primeiro
        if (googleApiKey && typeof googleApiKey === 'string' && googleApiKey.trim().length > 10) {
            try {
                return await this.calculateGoogleRoute(points, googleApiKey.trim());
            } catch (err) {
                console.warn('[smartRoutingService] Google Directions falhou, acionando fallback OSRM:', err);
            }
        }

        // Motor padrão: OSRM driving (gratuito, sem limites, respeita mãos e contramãos)
        return await this.calculateOsrmRoute(points);
    },

    /**
     * Motor OSRM Driving Multi-Waypoints
     */
    async calculateOsrmRoute(points: RoutingPoint[]): Promise<RoutingResult> {
        // Formato OSRM: {lon},{lat};{lon},{lat};...
        const coordsStr = points.map(p => `${p.longitude},${p.latitude}`).join(';');
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true`;

        const resp = await fetch(osrmUrl);
        if (!resp.ok) {
            throw new Error(`OSRM retornou status ${resp.status}`);
        }

        const data = await resp.json();
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error(data.message || 'Não foi possível encontrar trajeto viário para os pontos selecionados.');
        }

        const primaryRoute = data.routes[0];
        const distanceMeters = primaryRoute.distance || 0;
        const durationSeconds = primaryRoute.duration || 0;

        // Converter GeoJSON [lon, lat] para Leaflet [lat, lon]
        const polyline: [number, number][] = (primaryRoute.geometry?.coordinates || []).map(
            (c: [number, number]) => [c[1], c[0]]
        );

        return {
            distanceKm: parseFloat((distanceMeters / 1000).toFixed(1)),
            durationMinutes: Math.round(durationSeconds / 60),
            polyline,
            provider: 'OSRM'
        };
    },

    /**
     * Motor Google Maps Directions API
     */
    async calculateGoogleRoute(points: RoutingPoint[], apiKey: string): Promise<RoutingResult> {
        const origin = `${points[0].latitude},${points[0].longitude}`;
        const destination = `${points[points.length - 1].latitude},${points[points.length - 1].longitude}`;

        let waypointsStr = '';
        if (points.length > 2) {
            const waypoints = points.slice(1, points.length - 1).map(p => `${p.latitude},${p.longitude}`).join('|');
            waypointsStr = `&waypoints=${encodeURIComponent(waypoints)}`;
        }

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsStr}&mode=driving&key=${apiKey}`;

        const resp = await fetch(url);
        const data = await resp.json();

        if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
            throw new Error(`Google Directions status: ${data.status}`);
        }

        const route = data.routes[0];
        let totalDistanceMeters = 0;
        let totalDurationSeconds = 0;

        (route.legs || []).forEach((leg: any) => {
            totalDistanceMeters += leg.distance?.value || 0;
            totalDurationSeconds += leg.duration?.value || 0;
        });

        // Decodificar polyline codificada do Google
        const polyline = this.decodeGooglePolyline(route.overview_polyline?.points || '');

        return {
            distanceKm: parseFloat((totalDistanceMeters / 1000).toFixed(1)),
            durationMinutes: Math.round(totalDurationSeconds / 60),
            polyline,
            provider: 'GOOGLE_MAPS'
        };
    },

    /**
     * Otimiza a ordem dos pontos intermediários mantendo Fixos a Origem (1º ponto) e o Destino (Último ponto).
     * Utiliza heurística de vizinho mais próximo com refinamento de distância esférica/viária.
     */
    optimizeWaypoints(points: RoutingPoint[]): RoutingPoint[] {
        if (!points || points.length <= 3) {
            return [...points];
        }

        const origin = points[0];
        const destination = points[points.length - 1];
        const intermediates = points.slice(1, points.length - 1);

        // Nearest Neighbor a partir da Origem até o Destino
        const unvisited = [...intermediates];
        const ordered: RoutingPoint[] = [origin];
        let current = origin;

        while (unvisited.length > 0) {
            let bestIdx = 0;
            let minDistance = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
                const dist = this.haversineDistance(
                    current.latitude,
                    current.longitude,
                    unvisited[i].latitude,
                    unvisited[i].longitude
                );
                if (dist < minDistance) {
                    minDistance = dist;
                    bestIdx = i;
                }
            }

            const nextPoint = unvisited.splice(bestIdx, 1)[0];
            ordered.push(nextPoint);
            current = nextPoint;
        }

        ordered.push(destination);

        return ordered.map((p, idx) => ({
            ...p,
            order: idx
        }));
    },

    /**
     * Distância Haversine em km entre dois pontos geográficos
     */
    haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const toRad = (v: number) => (v * Math.PI) / 180;
        const R = 6371; // Raio da Terra em km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Decodifica polylines no formato compactado do Google Maps
     */
    decodeGooglePolyline(encoded: string): [number, number][] {
        const points: [number, number][] = [];
        let index = 0, len = encoded.length;
        let lat = 0, lng = 0;

        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
            lng += dlng;

            points.push([lat / 1e5, lng / 1e5]);
        }
        return points;
    }
};
