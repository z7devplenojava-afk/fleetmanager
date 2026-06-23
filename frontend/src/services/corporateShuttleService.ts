import { Vehicle } from '@/types/fleet';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  rg: string;
  department: string;
  position: string;
  clientCompany: string;
  boardingAddress: string;
  boardingLatitude: number;
  boardingLongitude: number;
  boardingTime: string;
  routeId: string;
  routeName: string;
  qrCode: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TRANSFERRED';
  createdAt: string;
  updatedAt: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnh: string;
  cnhCategory: string;
  licenseExpiry: string;
  vehicleId: string;
  currentRouteId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

interface Route {
  id: string;
  name: string;
  description: string;
  vehicleId: string;
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  startTime: string;
  endTime: string;
  estimatedDuration: number;
  distance: number;
  wayPoints: WayPoint[];
  employees: Employee[];
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'DELAYED';
  schedule: RouteSchedule[];
  createdAt: string;
  updatedAt: string;
}

interface WayPoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  sequence: number;
  estimatedTime: string;
  employeeId?: string;
  employeeName?: string;
  type: 'BOARDING' | 'DROPOFF' | 'WAYPOINT';
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
}

interface RouteSchedule {
  dayOfWeek: string;
  departureTime: string;
  returnTime: string;
  active: boolean;
}

interface BoardingConfirmation {
  id: string;
  employeeId: string;
  employeeName: string;
  routeId: string;
  routeName: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  boardingTime: string;
  boardingLatitude: number;
  boardingLongitude: number;
  direction: 'GOING' | 'RETURNING';
  qrCode: string;
  confirmedAt: string;
  status: 'CONFIRMED' | 'PENDING' | 'ERROR';
}

interface RouteTracking {
  id: string;
  routeId: string;
  driverId: string;
  vehicleId: string;
  currentPosition: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  speed: number;
  heading: number;
  nextWayPoint: string;
  estimatedArrival: string;
  passengers: {
    boarded: number;
    expected: number;
    completed: number;
  };
  status: 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  trackingHistory: TrackingPoint[];
  createdAt: string;
  updatedAt: string;
}

interface TrackingPoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
  heading: number;
}

interface QRCodeData {
  employeeId: string;
  employeeName: string;
  routeId: string;
  routeName: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  timestamp: string;
  direction: 'GOING' | 'RETURNING';
  checksum: string;
}

class CorporateShuttleService {
  private static instance: CorporateShuttleService;
  private employees: Employee[] = [];
  private drivers: Driver[] = [];
  private routes: Route[] = [];
  private confirmations: BoardingConfirmation[] = [];
  private tracking: RouteTracking[] = [];

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): CorporateShuttleService {
    if (!CorporateShuttleService.instance) {
      CorporateShuttleService.instance = new CorporateShuttleService();
    }
    return CorporateShuttleService.instance;
  }

  private initializeMockData() {
    // Motoristas mockados
    this.drivers = [
      {
        id: 'driver-001',
        name: 'João Silva',
        email: 'joao.silva@transportadora.com',
        phone: '11987654321',
        cpf: '123.456.789-00',
        cnh: '1234567890',
        cnhCategory: 'D',
        licenseExpiry: '2025-06-15',
        vehicleId: 'veh-001',
        currentRouteId: 'route-001',
        status: 'ACTIVE',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-03-20T14:30:00Z'
      },
      {
        id: 'driver-002',
        name: 'Carlos Santos',
        email: 'carlos.santos@transportadora.com',
        phone: '11987654322',
        cpf: '987.654.321-00',
        cnh: '0987654321',
        cnhCategory: 'D',
        licenseExpiry: '2025-08-20',
        vehicleId: 'veh-002',
        currentRouteId: 'route-002',
        status: 'ACTIVE',
        createdAt: '2023-02-20T11:00:00Z',
        updatedAt: '2024-03-20T15:45:00Z'
      }
    ];

    // Funcionários mockados
    this.employees = [
      {
        id: 'emp-001',
        name: 'Maria Oliveira',
        email: 'maria.oliveira@empresa.com',
        phone: '11912345678',
        cpf: '111.222.333-44',
        rg: 'MG-12.345.678',
        department: 'TI',
        position: 'Desenvolvedora',
        clientCompany: 'Tech Solutions Ltda',
        boardingAddress: 'Rua das Flores, 123, São Paulo, SP',
        boardingLatitude: -23.5505,
        boardingLongitude: -46.6333,
        boardingTime: '07:30',
        routeId: 'route-001',
        routeName: 'Rota A - Centro → Zona Sul',
        qrCode: this.generateQRCode('emp-001'),
        status: 'ACTIVE',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-03-20T14:30:00Z'
      },
      {
        id: 'emp-002',
        name: 'Pedro Santos',
        email: 'pedro.santos@empresa.com',
        phone: '11912345679',
        cpf: '222.333.444-55',
        rg: 'SP-98.765.432',
        department: 'Vendas',
        position: 'Vendedor',
        clientCompany: 'Tech Solutions Ltda',
        boardingAddress: 'Av. Paulista, 1000, São Paulo, SP',
        boardingLatitude: -23.5632,
        boardingLongitude: -46.6527,
        boardingTime: '07:45',
        routeId: 'route-001',
        routeName: 'Rota A - Centro → Zona Sul',
        qrCode: this.generateQRCode('emp-002'),
        status: 'ACTIVE',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-03-20T14:30:00Z'
      },
      {
        id: 'emp-003',
        name: 'Ana Costa',
        email: 'ana.costa@empresa.com',
        phone: '11912345680',
        cpf: '333.444.555-66',
        rg: 'RJ-45.678.901',
        department: 'RH',
        position: 'Analista',
        clientCompany: 'Global Corp',
        boardingAddress: 'Rua Augusta, 500, São Paulo, SP',
        boardingLatitude: -23.5531,
        boardingLongitude: -46.6429,
        boardingTime: '08:00',
        routeId: 'route-002',
        routeName: 'Rota B - Zona Norte → Centro',
        qrCode: this.generateQRCode('emp-003'),
        status: 'ACTIVE',
        createdAt: '2023-02-20T11:00:00Z',
        updatedAt: '2024-03-20T15:45:00Z'
      }
    ];

    // Rotas mockadas
    this.routes = [
      {
        id: 'route-001',
        name: 'Rota A - Centro → Zona Sul',
        description: 'Rota do centro da cidade até a zona sul, passando por pontos de embarque principais',
        vehicleId: 'veh-001',
        driverId: 'driver-001',
        driverName: 'João Silva',
        vehiclePlate: 'ABC-1234',
        vehicleBrand: 'Mercedes-Benz',
        vehicleModel: 'Sprinter',
        startTime: '07:00',
        endTime: '09:00',
        estimatedDuration: 120,
        distance: 25.5,
        wayPoints: [
          {
            id: 'wp-001',
            address: 'Rua das Flores, 123, São Paulo, SP',
            latitude: -23.5505,
            longitude: -46.6333,
            sequence: 1,
            estimatedTime: '07:30',
            employeeId: 'emp-001',
            employeeName: 'Maria Oliveira',
            type: 'BOARDING',
            status: 'PENDING'
          },
          {
            id: 'wp-002',
            address: 'Av. Paulista, 1000, São Paulo, SP',
            latitude: -23.5632,
            longitude: -46.6527,
            sequence: 2,
            estimatedTime: '07:45',
            employeeId: 'emp-002',
            employeeName: 'Pedro Santos',
            type: 'BOARDING',
            status: 'PENDING'
          },
          {
            id: 'wp-003',
            address: 'Av. Brasil, 2000, São Paulo, SP',
            latitude: -23.5789,
            longitude: -46.6721,
            sequence: 3,
            estimatedTime: '08:00',
            type: 'WAYPOINT',
            status: 'PENDING'
          },
          {
            id: 'wp-004',
            address: 'Rua da Empresa, 100, São Paulo, SP',
            latitude: -23.5901,
            longitude: -46.6855,
            sequence: 4,
            estimatedTime: '08:30',
            type: 'DROPOFF',
            status: 'PENDING'
          }
        ],
        employees: this.employees.filter(emp => emp.routeId === 'route-001'),
        status: 'ACTIVE',
        schedule: [
          { dayOfWeek: 'MONDAY', departureTime: '07:00', returnTime: '18:00', active: true },
          { dayOfWeek: 'TUESDAY', departureTime: '07:00', returnTime: '18:00', active: true },
          { dayOfWeek: 'WEDNESDAY', departureTime: '07:00', returnTime: '18:00', active: true },
          { dayOfWeek: 'THURSDAY', departureTime: '07:00', returnTime: '18:00', active: true },
          { dayOfWeek: 'FRIDAY', departureTime: '07:00', returnTime: '18:00', active: true }
        ],
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-03-20T14:30:00Z'
      },
      {
        id: 'route-002',
        name: 'Rota B - Zona Norte → Centro',
        description: 'Rota da zona norte até o centro, atendendo funcionários da região norte',
        vehicleId: 'veh-002',
        driverId: 'driver-002',
        driverName: 'Carlos Santos',
        vehiclePlate: 'DEF-5678',
        vehicleBrand: 'Volkswagen',
        vehicleModel: 'Constellation',
        startTime: '07:30',
        endTime: '09:30',
        estimatedDuration: 90,
        distance: 18.7,
        wayPoints: [
          {
            id: 'wp-005',
            address: 'Rua Augusta, 500, São Paulo, SP',
            latitude: -23.5531,
            longitude: -46.6429,
            sequence: 1,
            estimatedTime: '08:00',
            employeeId: 'emp-003',
            employeeName: 'Ana Costa',
            type: 'BOARDING',
            status: 'PENDING'
          },
          {
            id: 'wp-006',
            address: 'Av. Higienópolis, 800, São Paulo, SP',
            latitude: -23.5432,
            longitude: -46.6534,
            sequence: 2,
            estimatedTime: '08:15',
            type: 'WAYPOINT',
            status: 'PENDING'
          },
          {
            id: 'wp-007',
            address: 'Praça da Sé, 100, São Paulo, SP',
            latitude: -23.5501,
            longitude: -46.6332,
            sequence: 3,
            estimatedTime: '08:45',
            type: 'DROPOFF',
            status: 'PENDING'
          }
        ],
        employees: this.employees.filter(emp => emp.routeId === 'route-002'),
        status: 'ACTIVE',
        schedule: [
          { dayOfWeek: 'MONDAY', departureTime: '07:30', returnTime: '18:30', active: true },
          { dayOfWeek: 'TUESDAY', departureTime: '07:30', returnTime: '18:30', active: true },
          { dayOfWeek: 'WEDNESDAY', departureTime: '07:30', returnTime: '18:30', active: true },
          { dayOfWeek: 'THURSDAY', departureTime: '07:30', returnTime: '18:30', active: true },
          { dayOfWeek: 'FRIDAY', departureTime: '07:30', returnTime: '18:30', active: true }
        ],
        createdAt: '2023-02-20T11:00:00Z',
        updatedAt: '2024-03-20T15:45:00Z'
      }
    ];

    // Rastreamento mockado
    this.tracking = [
      {
        id: 'tracking-001',
        routeId: 'route-001',
        driverId: 'driver-001',
        vehicleId: 'veh-001',
        currentPosition: {
          latitude: -23.5550,
          longitude: -46.6350,
          timestamp: new Date().toISOString()
        },
        speed: 45,
        heading: 90,
        nextWayPoint: 'wp-002',
        estimatedArrival: '07:50',
        passengers: {
          boarded: 1,
          expected: 2,
          completed: 0
        },
        status: 'IN_PROGRESS',
        trackingHistory: [
          {
            id: 'tp-001',
            latitude: -23.5505,
            longitude: -46.6333,
            timestamp: new Date(Date.now() - 600000).toISOString(),
            speed: 0,
            heading: 0
          },
          {
            id: 'tp-002',
            latitude: -23.5525,
            longitude: -46.6340,
            timestamp: new Date(Date.now() - 300000).toISOString(),
            speed: 35,
            heading: 45
          }
        ],
        createdAt: '2024-03-20T07:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];
  }

  // Métodos principais

  async getAllRoutes(): Promise<Route[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.routes), 300);
    });
  }

  async getRouteById(id: string): Promise<Route | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const route = this.routes.find(r => r.id === id);
        resolve(route || null);
      }, 200);
    });
  }

  async getRoutesByDriver(driverId: string): Promise<Route[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const driverRoutes = this.routes.filter(r => r.driverId === driverId);
        resolve(driverRoutes);
      }, 200);
    });
  }

  async getRoutesByVehicle(vehicleId: string): Promise<Route[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const vehicleRoutes = this.routes.filter(r => r.vehicleId === vehicleId);
        resolve(vehicleRoutes);
      }, 200);
    });
  }

  async getEmployeesByRoute(routeId: string): Promise<Employee[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const routeEmployees = this.employees.filter(e => e.routeId === routeId);
        resolve(routeEmployees);
      }, 200);
    });
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const employee = this.employees.find(e => e.id === id);
        resolve(employee || null);
      }, 200);
    });
  }

  async getDriverById(id: string): Promise<Driver | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const driver = this.drivers.find(d => d.id === id);
        resolve(driver || null);
      }, 200);
    });
  }

  // Métodos de QR Code

  generateQRCode(employeeId: string): string {
    const timestamp = Date.now();
    const checksum = this.generateChecksum(employeeId, timestamp);
    return `SHUTTLE_${employeeId}_${timestamp}_${checksum}`;
  }

  private generateChecksum(employeeId: string, timestamp: number): string {
    const data = `${employeeId}_${timestamp}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  async validateQRCode(qrCode: string): Promise<QRCodeData | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const parts = qrCode.split('_');
          if (parts.length !== 3 || parts[0] !== 'SHUTTLE') {
            resolve(null);
            return;
          }

          const employeeId = parts[1];
          const timestamp = parseInt(parts[2]);
          const checksum = parts[3];

          // Validar checksum
          const expectedChecksum = this.generateChecksum(employeeId, timestamp);
          if (checksum !== expectedChecksum) {
            resolve(null);
            return;
          }

          // Validar timestamp (QR code válido por 5 minutos)
          const now = Date.now();
          if (now - timestamp > 5 * 60 * 1000) {
            resolve(null);
            return;
          }

          // Buscar funcionário
          const employee = this.employees.find(e => e.id === employeeId);
          if (!employee) {
            resolve(null);
            return;
          }

          // Buscar rota
          const route = this.routes.find(r => r.id === employee.routeId);
          if (!route) {
            resolve(null);
            return;
          }

          // Buscar motorista
          const driver = this.drivers.find(d => d.id === route.driverId);
          if (!driver) {
            resolve(null);
            return;
          }

          const qrData: QRCodeData = {
            employeeId: employee.id,
            employeeName: employee.name,
            routeId: route.id,
            routeName: route.name,
            driverId: driver.id,
            driverName: driver.name,
            vehicleId: route.vehicleId,
            vehiclePlate: route.vehiclePlate,
            timestamp: new Date(timestamp).toISOString(),
            direction: this.getDirectionByTime(),
            checksum
          };

          resolve(qrData);
        } catch (error) {
          console.error('Erro ao validar QR Code:', error);
          resolve(null);
        }
      }, 300);
    });
  }

  async confirmBoarding(qrData: QRCodeData, boardingLocation: { latitude: number; longitude: number }): Promise<BoardingConfirmation> {
    return new Promise(resolve => {
      setTimeout(() => {
        const confirmation: BoardingConfirmation = {
          id: Date.now().toString(),
          employeeId: qrData.employeeId,
          employeeName: qrData.employeeName,
          routeId: qrData.routeId,
          routeName: qrData.routeName,
          driverId: qrData.driverId,
          driverName: qrData.driverName,
          vehicleId: qrData.vehicleId,
          vehiclePlate: qrData.vehiclePlate,
          boardingTime: new Date().toISOString(),
          boardingLatitude: boardingLocation.latitude,
          boardingLongitude: boardingLocation.longitude,
          direction: qrData.direction,
          qrCode: qrData.timestamp,
          confirmedAt: new Date().toISOString(),
          status: 'CONFIRMED'
        };

        this.confirmations.push(confirmation);
        resolve(confirmation);
      }, 400);
    });
  }

  async getBoardingConfirmations(routeId?: string, employeeId?: string): Promise<BoardingConfirmation[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        let confirmations = this.confirmations;
        
        if (routeId) {
          confirmations = confirmations.filter(c => c.routeId === routeId);
        }
        
        if (employeeId) {
          confirmations = confirmations.filter(c => c.employeeId === employeeId);
        }
        
        resolve(confirmations);
      }, 200);
    });
  }

  // Métodos de rastreamento

  async getRouteTracking(routeId: string): Promise<RouteTracking | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const tracking = this.tracking.find(t => t.routeId === routeId);
        resolve(tracking || null);
      }, 200);
    });
  }

  async updateRoutePosition(routeId: string, position: { latitude: number; longitude: number }, speed: number, heading: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const trackingIndex = this.tracking.findIndex(t => t.routeId === routeId);
        if (trackingIndex !== -1) {
          this.tracking[trackingIndex].currentPosition = {
            latitude: position.latitude,
            longitude: position.longitude,
            timestamp: new Date().toISOString()
          };
          this.tracking[trackingIndex].speed = speed;
          this.tracking[trackingIndex].heading = heading;
          this.tracking[trackingIndex].updatedAt = new Date().toISOString();
          
          // Adicionar ao histórico
          this.tracking[trackingIndex].trackingHistory.push({
            id: Date.now().toString(),
            latitude: position.latitude,
            longitude: position.longitude,
            timestamp: new Date().toISOString(),
            speed,
            heading
          });
        }
        resolve();
      }, 300);
    });
  }

  // Métodos de gestão de rotas

  async createRoute(routeData: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newRoute: Route = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...routeData
        };

        this.routes.push(newRoute);
        resolve(newRoute);
      }, 400);
    });
  }

  async updateRoute(id: string, routeData: Partial<Route>): Promise<Route> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const routeIndex = this.routes.findIndex(r => r.id === id);
        if (routeIndex === -1) {
          reject(new Error('Rota não encontrada'));
          return;
        }

        this.routes[routeIndex] = {
          ...this.routes[routeIndex],
          ...routeData,
          updatedAt: new Date().toISOString()
        };

        resolve(this.routes[routeIndex]);
      }, 300);
    });
  }

  async deleteRoute(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const routeIndex = this.routes.findIndex(r => r.id === id);
        if (routeIndex === -1) {
          reject(new Error('Rota não encontrada'));
          return;
        }

        this.routes.splice(routeIndex, 1);
        resolve();
      }, 300);
    });
  }

  // Métodos de importação de rotas

  async importRouteFromKML(kmlData: string): Promise<Route> {
    try {
      // Import and use the KML parser service
      const kmlParserService = await import('./kmlParserService').then(m => m.default);
      
      // Parse the KML data
      const parsedKML = await kmlParserService.parseKML(kmlData);
      
      if (parsedKML.routes.length === 0 && parsedKML.wayPoints.length === 0) {
        throw new Error('Nenhuma rota ou ponto de parada encontrado no arquivo KML');
      }

      // Use the first route or create a route from waypoints
      let mainRoute = parsedKML.routes[0];
      let wayPoints: WayPoint[] = [];

      if (mainRoute) {
        // Convert KML waypoints to Route waypoints
        wayPoints = await Promise.all(
          mainRoute.wayPoints.map(async (wp, index) => {
            let address = wp.address;
            
            // If no address, try reverse geocoding
            if (!address) {
              address = await kmlParserService.reverseGeocode(
                wp.coordinates.latitude,
                wp.coordinates.longitude
              );
            }

            return {
              id: wp.id,
              address: address || `Ponto ${index + 1}`,
              latitude: wp.coordinates.latitude,
              longitude: wp.coordinates.longitude,
              sequence: wp.sequence || index,
              estimatedTime: this.calculateEstimatedTime(index, mainRoute.estimatedDuration),
              employeeId: undefined,
              employeeName: undefined,
              type: index === 0 ? 'BOARDING' : index === mainRoute.wayPoints.length - 1 ? 'DROPOFF' : 'WAYPOINT',
              status: 'PENDING'
            };
          })
        );
      } else {
        // Create route from waypoints
        const optimizedWayPoints = kmlParserService.optimizeRoute(parsedKML.wayPoints);
        wayPoints = await Promise.all(
          optimizedWayPoints.map(async (wp, index) => {
            let address = wp.address;
            
            if (!address) {
              address = await kmlParserService.reverseGeocode(
                wp.coordinates.latitude,
                wp.coordinates.longitude
              );
            }

            return {
              id: wp.id,
              address: address || `Ponto ${index + 1}`,
              latitude: wp.coordinates.latitude,
              longitude: wp.coordinates.longitude,
              sequence: index,
              estimatedTime: this.calculateEstimatedTime(index, 60), // Default 60 minutes
              employeeId: undefined,
              employeeName: undefined,
              type: index === 0 ? 'BOARDING' : index === optimizedWayPoints.length - 1 ? 'DROPOFF' : 'WAYPOINT',
              status: 'PENDING'
            };
          })
        );

        // Calculate route metrics from waypoints
        const coordinates = optimizedWayPoints.map(wp => ({
          latitude: wp.coordinates.latitude,
          longitude: wp.coordinates.longitude
        }));

        mainRoute = {
          id: `route-${Date.now()}`,
          name: parsedKML.name,
          description: parsedKML.description,
          coordinates,
          wayPoints: optimizedWayPoints,
          distance: kmlParserService.calculateRouteDistance(coordinates),
          estimatedDuration: 60 // Default 60 minutes
        };
      }

      // Create the Route object
      const newRoute: Route = {
        id: mainRoute.id,
        name: mainRoute.name || parsedKML.name,
        description: mainRoute.description || parsedKML.description || 'Rota importada de arquivo KML',
        vehicleId: 'veh-001', // Default vehicle - should be configurable
        driverId: 'driver-001', // Default driver - should be configurable
        driverName: 'Motorista Padrão', // Should be fetched from driver service
        vehiclePlate: 'ABC-1234', // Should be fetched from vehicle service
        vehicleBrand: 'Mercedes-Benz',
        vehicleModel: 'Sprinter',
        startTime: '08:00', // Should be configurable
        endTime: this.calculateEndTime(mainRoute.estimatedDuration),
        estimatedDuration: Math.round(mainRoute.estimatedDuration),
        distance: Math.round(mainRoute.distance * 100) / 100, // Round to 2 decimal places
        wayPoints,
        employees: [], // Will be populated later
        status: 'ACTIVE',
        schedule: [
          { dayOfWeek: 'MONDAY', departureTime: '08:00', returnTime: '18:00', active: true },
          { dayOfWeek: 'TUESDAY', departureTime: '08:00', returnTime: '18:00', active: true },
          { dayOfWeek: 'WEDNESDAY', departureTime: '08:00', returnTime: '18:00', active: true },
          { dayOfWeek: 'THURSDAY', departureTime: '08:00', returnTime: '18:00', active: true },
          { dayOfWeek: 'FRIDAY', departureTime: '08:00', returnTime: '18:00', active: true }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.routes.push(newRoute);
      return newRoute;
    } catch (error) {
      console.error('Erro ao importar rota KML:', error);
      throw new Error(`Falha ao importar rota KML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async generateRouteFromAddresses(addresses: string[]): Promise<Route> {
    return new Promise(resolve => {
      setTimeout(() => {
        // Simular geocoding e otimização de rota
        const wayPoints: WayPoint[] = addresses.map((address, index) => ({
          id: `wp-gen-${index}`,
          address,
          latitude: -23.5505 + (index * 0.01),
          longitude: -46.6333 + (index * 0.01),
          sequence: index + 1,
          estimatedTime: `0${8 + index}:${30 + (index * 15)}`,
          type: index === 0 ? 'BOARDING' : index === addresses.length - 1 ? 'DROPOFF' : 'WAYPOINT',
          status: 'PENDING'
        }));

        const generatedRoute: Route = {
          id: Date.now().toString(),
          name: 'Rota Gerada - Endereços',
          description: `Rota gerada com ${addresses.length} pontos de embarque`,
          vehicleId: 'veh-001',
          driverId: 'driver-001',
          driverName: 'Motorista Padrão',
          vehiclePlate: 'ABC-1234',
          vehicleBrand: 'Mercedes-Benz',
          vehicleModel: 'Sprinter',
          startTime: '08:00',
          endTime: '10:00',
          estimatedDuration: addresses.length * 15,
          distance: addresses.length * 5.2,
          wayPoints,
          employees: [],
          status: 'ACTIVE',
          schedule: [
            { dayOfWeek: 'MONDAY', departureTime: '08:00', returnTime: '18:00', active: true },
            { dayOfWeek: 'TUESDAY', departureTime: '08:00', returnTime: '18:00', active: true },
            { dayOfWeek: 'WEDNESDAY', departureTime: '08:00', returnTime: '18:00', active: true },
            { dayOfWeek: 'THURSDAY', departureTime: '08:00', returnTime: '18:00', active: true },
            { dayOfWeek: 'FRIDAY', departureTime: '08:00', returnTime: '18:00', active: true }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.routes.push(generatedRoute);
        resolve(generatedRoute);
      }, 600);
    });
  }

  // Métodos de relatórios

  async getRouteReport(routeId: string, startDate?: string, endDate?: string): Promise<{
    route: Route;
    confirmations: BoardingConfirmation[];
    statistics: {
      totalBoardings: number;
      averageBoardingTime: string;
      punctuality: number;
      employeeSatisfaction: number;
    };
  }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) {
          resolve({} as any);
          return;
        }

        let confirmations = this.confirmations.filter(c => c.routeId === routeId);
        
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          confirmations = confirmations.filter(c => {
            const date = new Date(c.confirmedAt);
            return date >= start && date <= end;
          });
        }

        const statistics = {
          totalBoardings: confirmations.length,
          averageBoardingTime: '08:15',
          punctuality: 95.5,
          employeeSatisfaction: 4.2
        };

        resolve({
          route,
          confirmations,
          statistics
        });
      }, 400);
    });
  }

  // Métodos utilitários

  private getDirectionByTime(): 'GOING' | 'RETURNING' {
    const hour = new Date().getHours();
    return hour < 12 ? 'GOING' : 'RETURNING';
  }

  private calculateEstimatedTime(index: number, totalDuration: number): string {
    if (totalDuration <= 0) return '08:00';
    
    const startTime = new Date();
    startTime.setHours(8, 0, 0, 0); // Start at 08:00
    
    const minutesPerWaypoint = totalDuration / (index + 1);
    const waypointTime = new Date(startTime.getTime() + (index * minutesPerWaypoint * 60000));
    
    return waypointTime.toTimeString().slice(0, 5); // HH:MM format
  }

  private calculateEndTime(duration: number): string {
    const startTime = new Date();
    startTime.setHours(8, 0, 0, 0); // Start at 08:00
    
    const endTime = new Date(startTime.getTime() + (duration * 60000));
    return endTime.toTimeString().slice(0, 5); // HH:MM format
  }

  getRouteStatusLabel(status: Route['status']): string {
    const labels: Record<Route['status'], string> = {
      'ACTIVE': 'Ativa',
      'INACTIVE': 'Inativa',
      'CANCELLED': 'Cancelada',
      'DELAYED': 'Atrasada'
    };
    return labels[status] || status;
  }

  getRouteStatusColor(status: Route['status']): string {
    const colors: Record<Route['status'], string> = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'DELAYED': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getEmployeeStatusLabel(status: Employee['status']): string {
    const labels: Record<Employee['status'], string> = {
      'ACTIVE': 'Ativo',
      'INACTIVE': 'Inativo',
      'ON_LEAVE': 'De Licença',
      'TRANSFERRED': 'Transferido'
    };
    return labels[status] || status;
  }

  getEmployeeStatusColor(status: Employee['status']): string {
    const colors: Record<Employee['status'], string> = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'ON_LEAVE': 'bg-blue-100 text-blue-800',
      'TRANSFERRED': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}

export default CorporateShuttleService.getInstance();
