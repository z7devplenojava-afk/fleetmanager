import api from '@/lib/axios';

export enum MaintenanceType {
    CORRETIVA = 'CORRETIVA',
    PREVENTIVA = 'PREVENTIVA',
    PREDITIVA = 'PREDITIVA',
    INSPECAO = 'INSPECAO',
    LUBRIFICACAO = 'LUBRIFICACAO',
    LIMPEZA = 'LIMPEZA',
    OUTROS = 'OUTROS',
    CORRECTIVE = 'CORRETIVA',
    PREVENTIVE = 'PREVENTIVA',
    PREDICTIVE = 'PREDITIVA',
    INSPECTION = 'INSPECAO'
}

export const WorkOrderType = MaintenanceType;
export type WorkOrderType = MaintenanceType;

export enum WorkOrderStatus {
    OPEN = 'OPEN',
    DRAFT = 'DRAFT',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    APPROVED = 'APPROVED',
    IN_PROGRESS = 'IN_PROGRESS',
    WAITING_PARTS = 'WAITING_PARTS',
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

export enum ChecklistStatus {
    OK = 'OK',
    NAO_OK = 'NAO_OK',
    TROCAR = 'TROCAR',
    NAO_APLICA = 'NAO_APLICA'
}

export interface WorkOrderItem {
    id?: string;
    description: string;
    type?: WorkOrderItemType;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productId?: string;
    code?: string;
    inStock?: number;
    isManual?: boolean;
    requiresApproval?: boolean;
    approvalReason?: string;
    approved?: boolean;
    approvedBy?: string;
    approvedAt?: string;
    provider?: string;
}

export interface ChecklistItemMaster {
    id: string;
    descricao: string;
    categoria: string;
    tipoManutencao: string;
    ordem: number;
    ativo: boolean;
}

export interface FleetWorkOrderChecklist {
    id?: string;
    workOrderId?: string;
    checklistItemId: string;
    checklistItemDescricao?: string;
    checklistItemCategoria?: string;
    situacao: ChecklistStatus;
    observacao?: string;
    reparoRealizado?: string;
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
    maintenanceType?: MaintenanceType;
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

    // Campos Parada e Saída PRD
    stopDate?: string;
    stopTime?: string;
    exitDate?: string;
    exitTime?: string;
    aggregateInfo?: string;

    // Descrições PRD
    anomaliesDescription?: string;
    otherDescription?: string;
    maintenancePerformed?: string;

    // Envolvidos PRD
    clientId?: string;
    sectorId?: string;
    requesterId?: string;
    requesterName?: string;
    responsibleId?: string;
    responsibleName?: string;
    supervisorId?: string;

    // Garagem executora da OS
    garageId?: string;
    garageName?: string;

    // Assinaturas PRD
    responsibleSignature?: string;
    responsibleSignatureDate?: string;
    supervisorSignature?: string;
    supervisorSignatureDate?: string;

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

    // Execução do Serviço
    executionStartDate?: string;      // ISO datetime
    executionEndDate?: string;        // ISO datetime
    executionDurationMinutes?: number; // Calculado automaticamente
    executionStartJustification?: string;

    notes?: string;

    items: WorkOrderItem[];
    checklistItems?: FleetWorkOrderChecklist[];
    photoAttachments?: string[];
    createdAt?: string;
    updatedAt?: string;
}

/** Conta a pagar lançada no financeiro a partir de uma O.S. de manutenção */
export interface MaintenanceExpense {
    id: string;
    invoiceNumber: string;
    description?: string;
    amount: number;
    /** PENDENTE | PAGA | SOLICITADA | CANCELADA | ... */
    status: string;
    dueDate?: string;
    paymentDate?: string;
    category?: string;
    workOrderNumber?: string;
    createdAt?: string;
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

export interface ExecutionHistoryEntry {
    id: string;
    workOrderId: string;
    previousStartDate?: string;
    newStartDate: string;
    justification: string;
    performedBy?: string;
    createdAt: string;
}

class FleetWorkOrderService {

    async findAll(): Promise<FleetWorkOrder[]> {
        const { data } = await api.get('/fleet-work-orders');
        return data;
    }

    async getAll(): Promise<FleetWorkOrder[]> {
        return this.findAll();
    }

    async findById(id: string): Promise<FleetWorkOrder> {
        const { data } = await api.get(`/fleet-work-orders/${id}`);
        return data;
    }

    async getChecklistMasterItems(vehicleType?: string, model?: string): Promise<ChecklistItemMaster[]> {
        const params: Record<string, string> = {};
        if (vehicleType) params.vehicleType = vehicleType;
        if (model) params.model = model;
        const { data } = await api.get('/fleet-work-orders/checklist-items', { params });
        return data;
    }

    async getServicesCatalog(): Promise<any[]> {
        try {
            const { data } = await api.get('/fleet-work-orders/services-catalog');
            return data || [];
        } catch {
            return [];
        }
    }

    async createQuickService(body: { name: string; description?: string; unitPrice?: number; category?: string }): Promise<any> {
        const { data } = await api.post('/fleet-work-orders/quick-service', body);
        return data;
    }

    async uploadPhotos(files: File[]): Promise<string[]> {
        if (!files || files.length === 0) return [];

        // Otimização client-side preventiva: comprime imagens maiores que 250KB para evitar 413 Payload Too Large e acelerar o envio
        const processedFiles = await Promise.all(
            files.map(async (file) => {
                if (file.type && file.type.startsWith('image/') && file.size > 250 * 1024) {
                    try {
                        return await compressImageToFile(file, 1600, 1600, 0.75);
                    } catch (e) {
                        return file;
                    }
                }
                return file;
            })
        );

        // Tentativa de envio em lote
        try {
            const formData = new FormData();
            processedFiles.forEach(f => formData.append('photos', f));
            const { data } = await api.post('/fleet-work-orders/upload-photos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data?.urls || [];
        } catch (err: any) {
            // Se falhar em lote (ex: 413 Payload Too Large ou timeout), tenta envio individual com compressão compacta
            console.warn('Upload em lote de fotos falhou, tentando envio unitário resiliente:', err?.response?.status || err?.message);
            const uploadedUrls: string[] = [];
            for (const file of processedFiles) {
                try {
                    let toUpload = file;
                    if (file.type && file.type.startsWith('image/')) {
                        toUpload = await compressImageToFile(file, 1280, 1280, 0.65);
                    }
                    const singleForm = new FormData();
                    singleForm.append('photos', toUpload);
                    const { data } = await api.post('/fleet-work-orders/upload-photos', singleForm, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    if (data?.urls && Array.isArray(data.urls)) {
                        uploadedUrls.push(...data.urls);
                    }
                } catch (singleErr) {
                    console.error('Falha ao enviar foto individual:', singleErr);
                }
            }
            if (uploadedUrls.length > 0) {
                return uploadedUrls;
            }
            throw err;
        }
    }

    async create(order: Partial<FleetWorkOrder>): Promise<FleetWorkOrder> {
        const { data } = await api.post('/fleet-work-orders', order);
        return data;
    }

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

    // ── Lançamento de despesa no Financeiro (Contas a Pagar) ─────────────────

    async getExpenses(id: string): Promise<MaintenanceExpense[]> {
        const { data } = await api.get(`/fleet-work-orders/${id}/expense`);
        return data || [];
    }

    async launchExpense(id: string, performedBy?: string): Promise<MaintenanceExpense> {
        const { data } = await api.post(`/fleet-work-orders/${id}/expense`, { performedBy });
        return data;
    }

    // ── Solicitar compra ao almoxarifado ─────────────────────────────────────

    async requestPurchase(id: string): Promise<any> {
        const { data } = await api.post(`/fleet-work-orders/${id}/request-purchase`);
        return data;
    }

    // ── Ranking ───────────────────────────────────────────────────────────────

    async getVehicleRanking(): Promise<VehicleMaintenanceRanking[]> {
        const { data } = await api.get('/fleet-work-orders/ranking/vehicles');
        return data;
    }

    // ── Duplicar OS (PRD §25) ─────────────────────────────────────────────────

    async duplicate(id: string): Promise<FleetWorkOrder> {
        const { data } = await api.post(`/fleet-work-orders/${id}/duplicate`);
        return data;
    }

    // ── Execução do Serviço ─────────────────────────────────────────────────

    /**
     * Corrige a data de início da execução com justificativa obrigatória.
     * O registro anterior é salvo no histórico de audi de execução.
     */
    async correctExecutionStart(
        id: string,
        executionStartDate: string,
        justification: string,
        performedBy: string
    ): Promise<FleetWorkOrder> {
        const { data } = await api.patch(`/fleet-work-orders/${id}/execution-start`, {
            executionStartDate,
            justification,
            performedBy,
        });
        return data;
    }

    /** Retorna o histórico de correções do início da execução */
    async getExecutionHistory(id: string): Promise<ExecutionHistoryEntry[]> {
        const { data } = await api.get(`/fleet-work-orders/${id}/execution-history`);
        return data || [];
    }
}

async function compressImageToFile(file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.82): Promise<File> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                            resolve(new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() }));
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', quality);
                } else {
                    resolve(file);
                }
            };
            img.onerror = () => resolve(file);
            img.src = event.target?.result as string;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

/**
 * Retorna o nome do responsável pela OS formatado para exibição.
 * Prioriza mecânico atribuído -> responsável/solicitante -> motorista informado nas notas/anomalias -> fallback.
 */
export function getOrderResponsibleDisplay(order?: Partial<FleetWorkOrder> | null): string {
    if (!order) return 'Não atribuído';
    if (order.mechanicName && order.mechanicName.trim()) {
        return order.mechanicName;
    }
    if ((order as any).responsibleName && (order as any).responsibleName.trim()) {
        return (order as any).responsibleName;
    }
    if ((order as any).requesterName && (order as any).requesterName.trim()) {
        return `${(order as any).requesterName} (Solicitante)`;
    }
    if (order.notes) {
        const m = order.notes.match(/(?:motorista|condutor)[\s:]+([^\n,]+?)(?:\s+via|\s+no|\s+pelo|$)/i)
               || order.notes.match(/(?:aberta|criada|gerada|solicitad[ao])\s+(?:pelo|por)\s+(?:o\s+)?(?:motorista|condutor|solicitante)?[:\s]*([^\n,]+?)(?:\s+via|$)/i)
               || order.notes.match(/solicitad[ao]\s+por[\s:]*([^\n,]+?)(?:\s+via|$)/i);
        if (m && m[1]?.trim()) {
            const val = m[1].trim();
            const lower = val.toLowerCase();
            if (!lower.includes('não informado') && lower !== 'condutor' && lower !== 'motorista') {
                return lower.includes('motorista') ? val : `${val} (Motorista)`;
            }
        }
    }
    if (order.anomaliesDescription) {
        const m = order.anomaliesDescription.match(/\[Checklist Diário\s*-\s*([^\]]+)\]/i);
        if (m && m[1]?.trim()) {
            const val = m[1].trim();
            const lower = val.toLowerCase();
            if (!lower.includes('não informado') && lower !== 'condutor' && lower !== 'motorista') {
                return lower.includes('motorista') ? val : `${val} (Motorista)`;
            }
        }
    }
    if ((order as any).vehicle?.assignedDriver || (order as any).assignedDriver) {
        const d = ((order as any).vehicle?.assignedDriver || (order as any).assignedDriver).trim();
        return d.toLowerCase().includes('motorista') ? d : `${d} (Motorista)`;
    }
    if ((order as any).vehicle?.responsibleEmployee?.name) {
        return (order as any).vehicle.responsibleEmployee.name;
    }
    if (order.stopReason && (order.stopReason.toLowerCase().includes('condutor') || order.stopReason.toLowerCase().includes('motorista') || order.stopReason.toLowerCase().includes('checklist'))) {
        return 'Condutor / Motorista';
    }
    if (order.notes && (order.notes.toLowerCase().includes('motorista') || order.notes.toLowerCase().includes('condutor') || order.notes.toLowerCase().includes('portal mobile') || order.notes.toLowerCase().includes('checklist'))) {
        return 'Condutor / Motorista';
    }
    return 'Não atribuído';
}

export const fleetWorkOrderService = new FleetWorkOrderService();
export default fleetWorkOrderService;
