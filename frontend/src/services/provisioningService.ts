import { Provisioning } from '@/types/provisioning';

const mockProvisionings: Provisioning[] = [
  {
    id: '1',
    serviceName: 'Portaria 24h',
    description: 'Composição de preços para posto de portaria 24 horas, escala 12x36, incluindo todos os custos e impostos.',
    createdAt: '2024-07-10T10:00:00Z',
    updatedAt: '2024-07-10T10:00:00Z',
    labor: {
      title: 'Mão de Obra',
      items: [
        { id: 'l1', name: 'Salário do Porteiro', quantity: 4, unitCost: 2134.80, monthlyCost: 8539.20 },
        { id: 'l2', name: 'Adicional Noturno', percent: 39, monthlyCost: 951.51 },
        { id: 'l3', name: 'Reflexo Adic. Noturno/HE/DSR', monthlyCost: 190.30 },
        { id: 'l4', name: 'Encargos Sociais', percent: 69, monthlyCost: 6679.90 },
      ],
      subtotal: 19206.80
    },
    materials: {
      title: 'Materiais / Equipamentos / Uniformes',
      items: [
        { id: 'm1', name: 'Uniforme / EPI', quantity: 2, unitCost: 50.00, monthlyCost: 100.00 },
        { id: 'm2', name: 'Equipamentos', quantity: 1, unitCost: 20.00, monthlyCost: 20.00 },
      ],
      subtotal: 120.00
    },
    bdi: {
      title: 'BDI (Base de Cálculo do Lucro)',
      items: [
        { id: 'b1', name: 'Taxa de Administração', percent: 4.00, total: 773.07 },
        { id: 'b2', name: 'Lucro', percent: 3.19, total: 615.88 },
      ],
      subtotal: 1388.95
    },
    taxes: {
      title: 'Impostos',
      items: [
        { id: 't1', name: 'CONFINS', percent: 7.60, total: 1846.80 },
        { id: 't2', name: 'PIS', percent: 1.65, total: 400.95 },
        { id: 't3', name: 'ISSQN - Divinópolis', percent: 3.50, total: 850.50 },
        { id: 't4', name: 'IR', percent: 1.00, total: 243.00 },
        { id: 't5', name: 'CSLL', percent: 1.00, total: 243.00 },
      ],
      subtotal: 3584.25
    },
    totalMonthly: 24300.00,
    totalYearly: 291600.00
  }
];

export const provisioningService = {
  async getProvisionings(): Promise<Provisioning[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockProvisionings;
  },
  async getProvisioningById(id: string): Promise<Provisioning | undefined> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockProvisionings.find(p => p.id === id);
  },
  async createProvisioning(data: Omit<Provisioning, 'id' | 'createdAt' | 'updatedAt'>): Promise<Provisioning> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newProv: Provisioning = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProvisionings.push(newProv);
    return newProv;
  },
  async updateProvisioning(id: string, data: Partial<Provisioning>): Promise<Provisioning | undefined> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const idx = mockProvisionings.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    mockProvisionings[idx] = { ...mockProvisionings[idx], ...data, updatedAt: new Date().toISOString() };
    return mockProvisionings[idx];
  },
  async deleteProvisioning(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const idx = mockProvisionings.findIndex(p => p.id === id);
    if (idx !== -1) mockProvisionings.splice(idx, 1);
  }
}; 