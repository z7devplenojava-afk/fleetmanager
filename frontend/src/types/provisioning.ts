// Tipos para Gestão de Provisionamento

export interface Provisioning {
  id: string;
  serviceName: string; // Ex: "Portaria 24h"
  description: string;
  createdAt: string;
  updatedAt: string;
  labor: ProvisioningSection;
  materials: ProvisioningSection;
  bdi: ProvisioningSection;
  taxes: ProvisioningSection;
  totalMonthly: number;
  totalYearly: number;
}

export interface ProvisioningSection {
  title: string;
  items: ProvisioningItem[];
  subtotal: number;
}

export interface ProvisioningItem {
  id: string;
  name: string;
  quantity?: number;
  unitCost?: number;
  percent?: number;
  monthlyCost?: number;
  total?: number;
  notes?: string;
} 