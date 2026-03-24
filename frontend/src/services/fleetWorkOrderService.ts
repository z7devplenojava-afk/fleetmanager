import api from '@/lib/axios';

export enum WorkOrderStatus {
    DRAFT = 'DRAFT',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    APPROVED = 'APPROVED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum LaborType {
    INTERNAL = 'INTERNAL',
    EXTERNAL = 'EXTERNAL'
}

export interface WorkOrderItem {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface FleetWorkOrder {
    id: string;
    vehicleId: string;
    vehiclePlate?: string;
    planId?: string;
    status: WorkOrderStatus;
    mechanicId?: string;
    mechanicName?: string;
    plannedDate: string;
    actualDate?: string;
    completionDate?: string;
    laborType: LaborType;
    laborCost: number;
    partsCost: number;
    totalCost: number;
    notes?: string;
    items: WorkOrderItem[];
}

class FleetWorkOrderService {
    async findAll(): Promise<FleetWorkOrder[]> {
        const response = await api.get('/api/fleet-work-orders');
        return response.data;
    }

    async findById(id: string): Promise<FleetWorkOrder> {
        const response = await api.get(`/api/fleet-work-orders/${id}`);
        return response.data;
    }

    async create(order: Partial<FleetWorkOrder>): Promise<FleetWorkOrder> {
        const response = await api.post('/api/fleet-work-orders', order);
        return response.data;
    }

    async updateStatus(id: string, status: WorkOrderStatus): Promise<FleetWorkOrder> {
        const response = await api.put(`/api/fleet-work-orders/${id}/status`, null, {
            params: { status }
        });
        return response.data;
    }
}

export default new FleetWorkOrderService();
