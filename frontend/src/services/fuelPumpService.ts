import api from './api';

export interface FuelTank {
    id: string;
    name: string;
    capacity: number;
    currentLevel: number;
    fuelType: string;
}

export interface FuelPump {
    id: string;
    name: string;
    fuelTankId: string;
    fuelTankName: string;
    lastMeterReading: number;
}

export interface FuelDelivery {
    id: string;
    deliveryDate: string;
    invoiceNumber: string;
    supplier: string;
    liters: number;
    pricePerLiter: number;
    totalPrice: number;
    fuelTankId: string;
    fuelTankName: string;
}

export interface FuelPumpReading {
    id: string;
    readingDate: string;
    initialValue: number;
    finalValue: number;
    totalLiters: number;
    fuelPumpId: string;
    fuelPumpName: string;
}

const fuelPumpService = {
    // Tanks
    getTanks: async (): Promise<FuelTank[]> => {
        const response = await api.get('/fuel-infra/tanks');
        return response.data;
    },
    createTank: async (tank: Omit<FuelTank, 'id'>): Promise<FuelTank> => {
        const response = await api.post('/fuel-infra/tanks', tank);
        return response.data;
    },

    // Pumps
    getPumps: async (): Promise<FuelPump[]> => {
        const response = await api.get('/fuel-infra/pumps');
        return response.data;
    },
    createPump: async (pump: Omit<FuelPump, 'id' | 'fuelTankName'>): Promise<FuelPump> => {
        const response = await api.post('/fuel-infra/pumps', pump);
        return response.data;
    },

    // Deliveries
    getDeliveries: async (): Promise<FuelDelivery[]> => {
        const response = await api.get('/fuel-infra/deliveries');
        return response.data;
    },
    recordDelivery: async (delivery: Omit<FuelDelivery, 'id' | 'fuelTankName'>): Promise<FuelDelivery> => {
        const response = await api.post('/fuel-infra/deliveries', delivery);
        return response.data;
    },

    // Readings
    getReadings: async (): Promise<FuelPumpReading[]> => {
        const response = await api.get('/fuel-infra/readings');
        return response.data;
    },
    recordReading: async (reading: Omit<FuelPumpReading, 'id' | 'fuelPumpName'>): Promise<FuelPumpReading> => {
        const response = await api.post('/fuel-infra/readings', reading);
        return response.data;
    },
};

export default fuelPumpService;
