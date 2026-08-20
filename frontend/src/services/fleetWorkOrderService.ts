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

export enum WorkOrderItemType {
    PART = 'PART',
    LABOR = 'LABOR'
}

export enum WorkOrderPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export interface WorkOrderItem {
    id?: string;
    description: string;
    type?: WorkOrderItemType;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productId?: string;
    provider?: string;
}

export interface WorkOrderHistoryEntry {
    id: string;
    workOrderId: string;
    actionType: string;   // STATUS_CHANGE | NOTE | CREATED | UPDATED | PART_ADDED
    description: string;
    performedBy?: string;
    oldValue?: string;
    newValue?: string;
    createdAt: string;
}

export interface FleetWorkOrder {
    id: string;
    osNumber?: string;
    vehicleId: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    planId?: string;
    status: WorkOrderStatus;
    priority?: WorkOrderPriority;
    mechanicId?: string;
    mechanicName?: string;
    laborType: LaborType;
    plannedDate: string;
    actualDate?: string;
    startDate?: string;
    completionDate?: string;
    // Odômetro
    odometerIn?: number;
    odometerOut?: number;
    // Motivo da parada
    stopReason?: string;
    // Custos separados
    laborCost?: number;
    partsCost?: number;
    totalCost: number;
    // Tempo parado (calculado pelo backend)
    downtimeHours?: number;
    downtimeDays?: number;
    notes?: string;
    items: WorkOrderItem[];
    photoAttachments?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface VehicleMaintenanceRanking {
    vehicleId: string;
    vehiclePlate: string;
    vehicleModel: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalCost: number;
    totalDowntimeHours: number;
    completionRate: number;
    /** KEEP | REVIEW | RETIRE */
    recommendation: string;
}

class FleetWorkOrderService {

    async findAll(): Promise<FleetWorkOrder[]> {
        const { data } = await api.get('/fleet-work-orders');
        return data;
    }

    async findById(id: string): Promise<FleetWorkOrder> {
        const { data } = await api.get(`/fleet-work-orders/${id}`);
        return data;
    }

    async create(order: Partial<FleetWorkOrder>): Promise<FleetWorkOrder> {
        const { data } = await api.post('/fleet-work-orders', order);
        return data;
    }

    /** Atualização completa — agora com PUT /{id} */
    async update(id: string, order: Partial<FleetWorkOrder>): Promise<FleetWorkOrder> {
        const { data } = await api.put(`/fleet-work-orders/${id}`, order);
        return data;
    }

    async updateStatus(id: string, status: WorkOrderStatus): Promise<FleetWorkOrder> {
        const { data } = await api.patch(`/fleet-work-orders/${id}/status`, null, { params: { status } });
        return data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/fleet-work-orders/${id}`);
    }

    // ── Histórico ─────────────────────────────────────────────────────────────

    async getHistory(id: string): Promise<WorkOrderHistoryEntry[]> {
        const { data } = await api.get(`/fleet-work-orders/${id}/history`);
        return data;
    }

    async addNote(id: string, note: string, performedBy: string): Promise<WorkOrderHistoryEntry> {
        const { data } = await api.post(`/fleet-work-orders/${id}/history/note`, { note, performedBy });
        return data;
    }

    // ── Solicitar compra ao almoxarifado ─────────────────────────────────────

    /** Cria uma solicitação de compra no módulo Compras com as peças (PART) da O.S. */
    async requestPurchase(id: string): Promise<any> {
        const { data } = await api.post(`/fleet-work-orders/${id}/request-purchase`);
        return data;
    }

    // ── Ranking ───────────────────────────────────────────────────────────────

    async getVehicleRanking(): Promise<VehicleMaintenanceRanking[]> {
        const { data } = await api.get('/fleet-work-orders/ranking/vehicles');
        return data;
    }
}

export default new FleetWorkOrderService();
