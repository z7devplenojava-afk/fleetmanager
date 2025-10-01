export interface EPIControlRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeFunction: string;
  employeeCpf: string;
  employeeRg: string;
  admissionDate: string;
  dismissalDate?: string;
  equipmentItems: EPIEquipmentItem[];
  deliveryDate: string;
  responsibleDelivery: string;
  signature: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EPIEquipmentItem {
  id: string;
  equipmentName: string;
  equipmentNumber: string;
  ca: string; // Certificado de Aprovação
  quantity: number;
  deliveryDate: string;
  replacedDate?: string;
  replacementReason?: string;
  signature: string;
}

export interface EPIControlFormData {
  employeeId: string;
  employeeName: string;
  employeeFunction: string;
  employeeCpf: string;
  employeeRg: string;
  admissionDate: string;
  dismissalDate?: string;
  equipmentItems: Omit<EPIEquipmentItem, 'id'>[];
  deliveryDate: string;
  responsibleDelivery: string;
  signature: string;
  observations?: string;
}

export interface EPIControlFilters {
  employeeName?: string;
  employeeFunction?: string;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  equipmentName?: string;
}

export interface EPIControlStats {
  totalRecords: number;
  activeEmployees: number;
  dismissedEmployees: number;
  totalEquipmentItems: number;
  pendingReplacements: number;
  expiredEquipment: number;
}

export interface EPIControlReport {
  id: string;
  title: string;
  type: 'DELIVERY' | 'RETURN' | 'REPLACEMENT' | 'SUMMARY';
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  data: EPIControlRecord[];
  stats?: EPIControlStats;
}
