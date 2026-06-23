interface KMLWayPoint {
  id: string;
  name: string;
  description?: string;
  coordinates: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  address?: string;
  type: 'PLACEMARK' | 'ROUTE_POINT' | 'WAYPOINT';
  sequence?: number;
}

interface KMLRoute {
  id: string;
  name: string;
  description?: string;
  coordinates: {
    latitude: number;
    longitude: number;
    altitude?: number;
  }[];
  wayPoints: KMLWayPoint[];
  distance: number;
  estimatedDuration: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface ParsedKMLData {
  name: string;
  description?: string;
  routes: KMLRoute[];
  wayPoints: KMLWayPoint[];
  metadata: {
    documentName?: string;
    documentDescription?: string;
    createdAt: string;
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
}

class KMLParserService {
  private static instance: KMLParserService;

  private constructor() {}

  static getInstance(): KMLParserService {
    if (!KMLParserService.instance) {
      KMLParserService.instance = new KMLParserService();
    }
    return KMLParserService.instance;
  }

  /**
   * Parse KML file content
   */
  async parseKML(kmlContent: string): Promise<ParsedKMLData> {
    try {
      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlContent, 'application/xml');
      
      // Check for parsing errors
      const parserError = kmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Erro ao analisar arquivo KML: formato inválido');
      }

      const kmlElement = kmlDoc.querySelector('kml');
      if (!kmlElement) {
        throw new Error('Arquivo KML inválido: elemento <kml> não encontrado');
      }

      const document = kmlDoc.querySelector('Document') || kmlElement.querySelector('Folder');
      const documentName = document?.querySelector('name')?.textContent?.trim();
      const documentDescription = document?.querySelector('description')?.textContent?.trim();

      // Parse all placemarks
      const placemarks = Array.from(kmlDoc.querySelectorAll('Placemark'));
      const wayPoints: KMLWayPoint[] = [];
      const routes: KMLRoute[] = [];

      for (const placemark of placemarks) {
        const parsedPlacemark = this.parsePlacemark(placemark);
        if (parsedPlacemark) {
          if (this.isRoutePoint(parsedPlacemark)) {
            // Convert route points to route
            const route = this.convertPlacemarkToRoute(parsedPlacemark);
            if (route) {
              routes.push(route);
            }
          } else {
            wayPoints.push(parsedPlacemark);
          }
        }
      }

      // Parse LineString paths
      const lineStrings = Array.from(kmlDoc.querySelectorAll('LineString'));
      for (const lineString of lineStrings) {
        const route = this.parseLineString(lineString, wayPoints);
        if (route) {
          routes.push(route);
        }
      }

      // Calculate bounds
      const allCoordinates = [
        ...wayPoints.flatMap(wp => [wp.coordinates]),
        ...routes.flatMap(route => route.coordinates)
      ];

      const bounds = this.calculateBounds(allCoordinates);

      return {
        name: documentName || 'Rota Importada',
        description: documentDescription,
        routes,
        wayPoints,
        metadata: {
          documentName,
          documentDescription,
          createdAt: new Date().toISOString(),
          bounds
        }
      };
    } catch (error) {
      console.error('Erro ao processar KML:', error);
      throw new Error(`Erro ao processar arquivo KML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Parse KMZ file (zipped KML)
   */
  async parseKMZ(kmzContent: ArrayBuffer): Promise<ParsedKMLData> {
    try {
      // Use JSZip to extract KML from KMZ
      const JSZip = await import('jszip');
      const zip = await JSZip.loadAsync(kmzContent);
      
      // Find KML file in the zip
      const kmlFile = Object.keys(zip.files).find(filename => 
        filename.toLowerCase().endsWith('.kml')
      );
      
      if (!kmlFile) {
        throw new Error('Arquivo KMZ não contém nenhum arquivo KML');
      }

      const kmlContent = await zip.file(kmlFile)?.async('string');
      if (!kmlContent) {
        throw new Error('Não foi possível ler o arquivo KML dentro do KMZ');
      }

      return this.parseKML(kmlContent);
    } catch (error) {
      console.error('Erro ao processar KMZ:', error);
      throw new Error(`Erro ao processar arquivo KMZ: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Parse individual placemark
   */
  private parsePlacemark(placemark: Element): KMLWayPoint | null {
    try {
      const name = placemark.querySelector('name')?.textContent?.trim() || '';
      const description = placemark.querySelector('description')?.textContent?.trim();
      
      // Get coordinates from Point or LineString
      const point = placemark.querySelector('Point coordinates');
      const lineString = placemark.querySelector('LineString coordinates');
      
      let coordinates: { latitude: number; longitude: number; altitude?: number } | null = null;

      if (point) {
        const coordsText = point.textContent?.trim();
        if (coordsText) {
          const [longitude, latitude, altitude] = coordsText.split(',').map(Number);
          if (!isNaN(longitude) && !isNaN(latitude)) {
            coordinates = { longitude, latitude, altitude: altitude || undefined };
          }
        }
      } else if (lineString) {
        // For LineString, take the first point as the placemark location
        const coordsText = lineString.textContent?.trim();
        if (coordsText) {
          const coords = coordsText.trim().split(/\s+/).map(coord => {
            const [longitude, latitude, altitude] = coord.split(',').map(Number);
            return { longitude, latitude, altitude: altitude || undefined };
          });
          coordinates = coords[0] || null;
        }
      }

      if (!coordinates) {
        return null;
      }

      // Try to extract address from description or extended data
      const address = this.extractAddressFromDescription(description);

      return {
        id: `waypoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          altitude: coordinates.altitude
        },
        address,
        type: 'PLACEMARK'
      };
    } catch (error) {
      console.error('Erro ao processar placemark:', error);
      return null;
    }
  }

  /**
   * Parse LineString as route
   */
  private parseLineString(lineString: Element, wayPoints: KMLWayPoint[]): KMLRoute | null {
    try {
      const name = lineString.closest('Placemark')?.querySelector('name')?.textContent?.trim() || 'Rota sem nome';
      const description = lineString.closest('Placemark')?.querySelector('description')?.textContent?.trim();
      
      const coordinatesElement = lineString.querySelector('coordinates');
      if (!coordinatesElement) {
        return null;
      }

      const coordsText = coordinatesElement.textContent?.trim();
      if (!coordsText) {
        return null;
      }

      const coordinates = coordsText.trim().split(/\s+/).map(coord => {
        const [longitude, latitude, altitude] = coord.split(',').map(Number);
        return { 
          latitude: latitude || 0, 
          longitude: longitude || 0, 
          altitude: altitude || undefined 
        };
      }).filter(coord => !isNaN(coord.latitude) && !isNaN(coord.longitude));

      if (coordinates.length < 2) {
        return null;
      }

      // Match waypoints to route coordinates
      const routeWayPoints: KMLWayPoint[] = [];
      coordinates.forEach((coord, index) => {
        const nearestWayPoint = this.findNearestWayPoint(coord, wayPoints);
        if (nearestWayPoint) {
          routeWayPoints.push({
            ...nearestWayPoint,
            sequence: index,
            type: 'ROUTE_POINT'
          });
        }
      });

      const distance = this.calculateRouteDistance(coordinates);
      const estimatedDuration = Math.round(distance * 2); // 2 minutes per km as estimate

      return {
        id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        coordinates,
        wayPoints: routeWayPoints,
        distance,
        estimatedDuration
      };
    } catch (error) {
      console.error('Erro ao processar LineString:', error);
      return null;
    }
  }

  /**
   * Convert placemark to route if it contains multiple coordinates
   */
  private convertPlacemarkToRoute(placemark: KMLWayPoint): KMLRoute | null {
    // This would be used if a placemark contains route information
    // For now, we'll return null as routes are primarily extracted from LineString
    return null;
  }

  /**
   * Check if placemark represents a route point
   */
  private isRoutePoint(placemark: KMLWayPoint): boolean {
    // Check if the placemark name or description suggests it's a route
    const routeKeywords = ['rota', 'route', 'caminho', 'path', 'linha', 'line'];
    const name = (placemark.name + ' ' + (placemark.description || '')).toLowerCase();
    
    return routeKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Extract address from description text
   */
  private extractAddressFromDescription(description?: string): string | undefined {
    if (!description) {
      return undefined;
    }

    // Try to extract address from common patterns
    const addressPatterns = [
      /(?:Rua|Av|Avenida|Alameda|Travessa|Praça|Rodovia|Estrada)\s[^,]+/i,
      /(?:endereco|address|local|localização)[:\s]+([^,\n]+)/i,
      /([0-9]{5}-[0-9]{3})/i  // CEP pattern
    ];

    for (const pattern of addressPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no pattern matches, return first line if it looks like an address
    const lines = description.split('\n');
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length > 10 && !firstLine.includes('<')) {
        return firstLine;
      }
    }

    return undefined;
  }

  /**
   * Find nearest waypoint to a coordinate
   */
  private findNearestWayPoint(
    coordinate: { latitude: number; longitude: number }, 
    wayPoints: KMLWayPoint[]
  ): KMLWayPoint | null {
    if (wayPoints.length === 0) {
      return null;
    }

    let nearest = wayPoints[0];
    let minDistance = this.calculateDistance(
      coordinate.latitude,
      coordinate.longitude,
      nearest.coordinates.latitude,
      nearest.coordinates.longitude
    );

    for (let i = 1; i < wayPoints.length; i++) {
      const distance = this.calculateDistance(
        coordinate.latitude,
        coordinate.longitude,
        wayPoints[i].coordinates.latitude,
        wayPoints[i].coordinates.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = wayPoints[i];
      }
    }

    // Only return if within 100 meters
    return minDistance <= 0.1 ? nearest : null;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate total route distance
   */
  private calculateRouteDistance(coordinates: { latitude: number; longitude: number }[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < coordinates.length; i++) {
      totalDistance += this.calculateDistance(
        coordinates[i - 1].latitude,
        coordinates[i - 1].longitude,
        coordinates[i].latitude,
        coordinates[i].longitude
      );
    }
    
    return totalDistance;
  }

  /**
   * Calculate bounds for a set of coordinates
   */
  private calculateBounds(
    coordinates: { latitude: number; longitude: number }[]
  ): { north: number; south: number; east: number; west: number } {
    if (coordinates.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = coordinates[0].latitude;
    let south = coordinates[0].latitude;
    let east = coordinates[0].longitude;
    let west = coordinates[0].longitude;

    for (const coord of coordinates) {
      north = Math.max(north, coord.latitude);
      south = Math.min(south, coord.latitude);
      east = Math.max(east, coord.longitude);
      west = Math.min(west, coord.longitude);
    }

    return { north, south, east, west };
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Reverse geocoding (coordinates to address) - using OpenStreetMap Nominatim
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FleetManager/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro na requisição de geocodificação reversa');
      }

      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }

      return null;
    } catch (error) {
      console.error('Erro na geocodificação reversa:', error);
      return null;
    }
  }

  /**
   * Geocoding (address to coordinates) - using OpenStreetMap Nominatim
   */
  async geocode(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'FleetManager/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro na requisição de geocodificação');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        };
      }

      return null;
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      return null;
    }
  }

  /**
   * Optimize route waypoints order (simple nearest neighbor algorithm)
   */
  optimizeRoute(wayPoints: KMLWayPoint[]): KMLWayPoint[] {
    if (wayPoints.length <= 2) {
      return wayPoints;
    }

    const optimized: KMLWayPoint[] = [];
    const remaining = [...wayPoints];
    
    // Start with the first waypoint
    let current = remaining.shift()!;
    optimized.push(current);

    while (remaining.length > 0) {
      // Find nearest waypoint to current
      let nearestIndex = 0;
      let minDistance = this.calculateDistance(
        current.coordinates.latitude,
        current.coordinates.longitude,
        remaining[0].coordinates.latitude,
        remaining[0].coordinates.longitude
      );

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          current.coordinates.latitude,
          current.coordinates.longitude,
          remaining[i].coordinates.latitude,
          remaining[i].coordinates.longitude
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      current = remaining.splice(nearestIndex, 1)[0];
      optimized.push(current);
    }

    return optimized.map((wp, index) => ({ ...wp, sequence: index }));
  }

  /**
   * Generate route preview data for mapping
   */
  generateRoutePreview(route: KMLRoute): {
    center: { latitude: number; longitude: number };
    zoom: number;
    bounds: { north: number; south: number; east: number; west: number };
  } {
    const bounds = this.calculateBounds(route.coordinates);
    const center = {
      latitude: (bounds.north + bounds.south) / 2,
      longitude: (bounds.east + bounds.west) / 2
    };

    // Calculate appropriate zoom level based on bounds
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 10;
    if (maxDiff < 0.01) zoom = 15;
    else if (maxDiff < 0.05) zoom = 13;
    else if (maxDiff < 0.1) zoom = 12;
    else if (maxDiff < 0.5) zoom = 11;

    return {
      center,
      zoom,
      bounds
    };
  }
}

export default KMLParserService.getInstance();
