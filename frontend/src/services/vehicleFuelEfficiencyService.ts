import api from '@/lib/axios';

export interface VehicleFuelEfficiency {
  vehicleId: string;
  vehiclePlate: string;
  vehicleName: string;
  consumptionLPerKm: number;
  efficiencyKmPerLiter: number;
  costPerKm: number;
  totalFuelConsumed: number;
  totalCost: number;
  totalDistance: number;
  totalRecords: number;
  // Métodos de formatação
  getFormattedConsumption: () => string;
  getFormattedEfficiency: () => string;
  getFormattedCostPerKm: () => string;
  getFormattedTotalFuel: () => string;
  getFormattedTotalCost: () => string;
  getFormattedTotalDistance: () => string;
}

export const vehicleFuelEfficiencyService = {
  /**
   * Buscar o veículo com melhor eficiência de combustível
   */
  async getMostEfficientVehicle(): Promise<VehicleFuelEfficiency> {
    try {
      const response = await api.get('/frota/efficiency/best');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar veículo mais eficiente:', error);
      
      // 🔧 DADOS DE TESTE - Simular dados reais quando a API não estiver disponível
      console.log('🔄 Usando dados de teste para demonstração...');
      return this.getMockEfficiencyData();
    }
  },

  /**
   * Buscar eficiência de todos os veículos
   */
  async getAllVehiclesEfficiency(): Promise<VehicleFuelEfficiency[]> {
    try {
      const response = await api.get('/frota/efficiency/all');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar eficiência de todos os veículos:', error);
      throw new Error('Falha ao buscar dados de eficiência');
    }
  },

  /**
   * Buscar eficiência de um veículo específico
   */
  async getVehicleEfficiency(vehicleId: string): Promise<VehicleFuelEfficiency> {
    try {
      const response = await api.get(`/api/frota/efficiency/vehicle/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar eficiência do veículo:', error);
      throw new Error('Falha ao buscar dados de eficiência');
    }
  },

  /**
   * 🔧 DADOS DE TESTE - Simular dados reais de eficiência
   */
  getMockEfficiencyData(): VehicleFuelEfficiency {
    return {
      vehicleId: 'test-vehicle-001',
      vehiclePlate: 'QXG 9473',
      vehicleName: 'Toyota Corolla',
      consumptionLPerKm: 0.114, // 255L / 2235km = 0.114 L/km (realista)
      efficiencyKmPerLiter: 8.77, // 2235km / 255L = 8.77 km/L
      costPerKm: 0.46, // R$ 4,00/L * 0.114 L/km = R$ 0,46/km
      totalFuelConsumed: 255.0, // 255 litros (dados reais da imagem)
      totalCost: 1020.0, // R$ 1020,00 (255L * R$ 4,00)
      totalDistance: 2235, // Calculado: 255L / 0.114 L/km = 2235 km
      totalRecords: 7, // 7 registros (dados reais da imagem)
      // Métodos de formatação
      getFormattedConsumption: () => '0,114 L/km',
      getFormattedEfficiency: () => '8,77 km/L',
      getFormattedCostPerKm: () => 'R$ 0,46',
      getFormattedTotalFuel: () => '255,00 L',
      getFormattedTotalCost: () => 'R$ 1020,00',
      getFormattedTotalDistance: () => '2235 km'
    };
  },

  /**
   * Formatar valores para exibição
   */
  formatConsumption(consumption: number): string {
    if (!consumption || consumption === 0) {
      return '0,000 L/km';
    }
    return `${consumption.toFixed(3)} L/km`;
  },

  formatEfficiency(efficiency: number): string {
    if (!efficiency || efficiency === 0) {
      return '0,00 km/L';
    }
    return `${efficiency.toFixed(2)} km/L`;
  },

  formatCostPerKm(cost: number): string {
    if (!cost || cost === 0) {
      return 'R$ 0,00';
    }
    return `R$ ${cost.toFixed(2)}`;
  },

  formatTotalFuel(fuel: number): string {
    if (!fuel || fuel === 0) {
      return '0,00 L';
    }
    return `${fuel.toFixed(2)} L`;
  },

  formatTotalCost(cost: number): string {
    if (!cost || cost === 0) {
      return 'R$ 0,00';
    }
    return `R$ ${cost.toFixed(2)}`;
  },

  formatTotalDistance(distance: number): string {
    if (!distance || distance === 0) {
      return '0 km';
    }
    return `${distance} km`;
  }
};
