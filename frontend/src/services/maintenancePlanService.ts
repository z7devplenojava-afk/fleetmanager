interface MaintenancePlan {
  id: string;
  clientId: string;
  clientName: string;
  planName: string;
  description: string;
  planType: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'CUSTOM';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED';
  contractStart: string;
  contractEnd: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  monthlyFee: number;
  currency: 'BRL' | 'USD' | 'EUR';
  services: MaintenancePlanService[];
  vehicles: string[]; // Vehicle IDs covered by this plan
  coverage: {
    preventiveMaintenance: boolean;
    correctiveMaintenance: boolean;
    emergencyService: boolean;
    partsReplacement: boolean;
    laborCost: boolean;
    towingService: boolean;
    technicalSupport: boolean;
  };
  limits: {
    monthlyKilometers: number;
    preventiveServicesPerMonth: number;
    correctiveServicesPerMonth: number;
    emergencyCallsPerMonth: number;
    partsDiscountPercentage: number;
  };
  renewal: {
    autoRenew: boolean;
    renewalNoticeDays: number;
    gracePeriodDays: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface MaintenancePlanService {
  id: string;
  serviceType: 'OIL_CHANGE' | 'FILTER_REPLACEMENT' | 'BRAKE_SERVICE' | 'TIRE_ROTATION' | 
             'BATTERY_CHECK' | 'ENGINE_DIAGNOSTIC' | 'TRANSMISSION_SERVICE' | 'COOLING_SERVICE' |
             'EXHAUST_SYSTEM' | 'SUSPENSION_SERVICE' | 'ALIGNMENT' | 'CUSTOM';
  serviceName: string;
  description: string;
  included: boolean;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL' | 'AS_NEEDED';
  intervalKilometers: number;
  estimatedDuration: number; // in hours
  partsIncluded: boolean;
  laborIncluded: boolean;
  additionalCost: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface MaintenancePlanTemplate {
  id: string;
  templateName: string;
  description: string;
  planType: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'CUSTOM';
  monthlyFee: number;
  currency: string;
  services: Omit<MaintenancePlanService, 'id'>[];
  coverage: Omit<MaintenancePlan['coverage'], 'partsReplacement'> & {
    partsReplacement: 'INCLUDED' | 'DISCOUNTED' | 'EXCLUDED';
  };
  limits: MaintenancePlan['limits'];
  recommendedFor: string[]; // Vehicle types or sizes
}

interface MaintenancePlanUsage {
  planId: string;
  clientId: string;
  period: string; // YYYY-MM
  usage: {
    kilometersDriven: number;
    preventiveServicesUsed: number;
    correctiveServicesUsed: number;
    emergencyCallsUsed: number;
    partsUsed: number;
    laborHoursUsed: number;
  };
  costs: {
    totalCost: number;
    coveredCost: number;
    additionalCost: number;
    savedAmount: number;
  };
  services: {
    serviceId: string;
    serviceName: string;
    date: string;
    vehicleId: string;
    mileage: number;
    cost: number;
    covered: boolean;
    invoiceId?: string;
  }[];
}

interface MaintenancePlanInvoice {
  id: string;
  planId: string;
  clientId: string;
  invoiceNumber: string;
  period: string;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  baseAmount: number;
  usageCharges: number;
  discounts: number;
  taxes: number;
  totalAmount: number;
  currency: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  payment: {
    method?: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PIX' | 'CHECK' | 'CASH';
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    paidDate?: string;
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MaintenancePlanAlert {
  id: string;
  planId: string;
  clientId: string;
  alertType: 'PLAN_EXPIRY' | 'USAGE_LIMIT' | 'PAYMENT_DUE' | 'SERVICE_DUE' | 'RENEWAL_REMINDER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  dueDate?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

class MaintenancePlanService {
  private static instance: MaintenancePlanService;
  private plans: MaintenancePlan[] = [];
  private templates: MaintenancePlanTemplate[] = [];
  private usage: MaintenancePlanUsage[] = [];
  private invoices: MaintenancePlanInvoice[] = [];
  private alerts: MaintenancePlanAlert[] = [];

  private constructor() {
    this.initializeData();
  }

  static getInstance(): MaintenancePlanService {
    if (!MaintenancePlanService.instance) {
      MaintenancePlanService.instance = new MaintenancePlanService();
    }
    return MaintenancePlanService.instance;
  }

  private initializeData() {
    // Initialize templates
    this.templates = [
      {
        id: 'template-basic',
        templateName: 'Plano Básico',
        description: 'Cobertura essencial para frotas pequenas',
        planType: 'BASIC',
        monthlyFee: 299.90,
        currency: 'BRL',
        services: [
          {
            serviceType: 'OIL_CHANGE',
            serviceName: 'Troca de Óleo',
            description: 'Troca de óleo e filtro',
            included: true,
            frequency: 'QUARTERLY',
            intervalKilometers: 10000,
            estimatedDuration: 1,
            partsIncluded: true,
            laborIncluded: true,
            additionalCost: 0,
            priority: 'MEDIUM'
          },
          {
            serviceType: 'FILTER_REPLACEMENT',
            serviceName: 'Substituição de Filtros',
            description: 'Filtros de ar, combustível e cabine',
            included: true,
            frequency: 'SEMIANNUAL',
            intervalKilometers: 20000,
            estimatedDuration: 1.5,
            partsIncluded: false,
            laborIncluded: true,
            additionalCost: 150,
            priority: 'MEDIUM'
          }
        ],
        coverage: {
          preventiveMaintenance: true,
          correctiveMaintenance: false,
          emergencyService: false,
          partsReplacement: 'DISCOUNTED',
          laborCost: true,
          towingService: false,
          technicalSupport: true
        },
        limits: {
          monthlyKilometers: 5000,
          preventiveServicesPerMonth: 2,
          correctiveServicesPerMonth: 0,
          emergencyCallsPerMonth: 0,
          partsDiscountPercentage: 10
        },
        recommendedFor: ['small', 'medium']
      },
      {
        id: 'template-standard',
        templateName: 'Plano Standard',
        description: 'Cobertura completa para frotas médias',
        planType: 'STANDARD',
        monthlyFee: 599.90,
        currency: 'BRL',
        services: [
          {
            serviceType: 'OIL_CHANGE',
            serviceName: 'Troca de Óleo',
            description: 'Troca de óleo e filtro',
            included: true,
            frequency: 'QUARTERLY',
            intervalKilometers: 10000,
            estimatedDuration: 1,
            partsIncluded: true,
            laborIncluded: true,
            additionalCost: 0,
            priority: 'MEDIUM'
          },
          {
            serviceType: 'FILTER_REPLACEMENT',
            serviceName: 'Substituição de Filtros',
            description: 'Filtros de ar, combustível e cabine',
            included: true,
            frequency: 'SEMIANNUAL',
            intervalKilometers: 20000,
            estimatedDuration: 1.5,
            partsIncluded: true,
            laborIncluded: true,
            additionalCost: 0,
            priority: 'MEDIUM'
          },
          {
            serviceType: 'BRAKE_SERVICE',
            serviceName: 'Serviço de Freios',
            description: 'Inspeção e manutenção do sistema de freios',
            included: true,
            frequency: 'SEMIANNUAL',
            intervalKilometers: 20000,
            estimatedDuration: 2,
            partsIncluded: false,
            laborIncluded: true,
            additionalCost: 200,
            priority: 'HIGH'
          },
          {
            serviceType: 'TIRE_ROTATION',
            serviceName: 'Rodízio de Pneus',
            description: 'Balanceamento e rodízio',
            included: true,
            frequency: 'QUARTERLY',
            intervalKilometers: 10000,
            estimatedDuration: 1,
            partsIncluded: false,
            laborIncluded: true,
            additionalCost: 50,
            priority: 'LOW'
          }
        ],
        coverage: {
          preventiveMaintenance: true,
          correctiveMaintenance: true,
          emergencyService: true,
          partsReplacement: 'DISCOUNTED',
          laborCost: true,
          towingService: true,
          technicalSupport: true
        },
        limits: {
          monthlyKilometers: 10000,
          preventiveServicesPerMonth: 4,
          correctiveServicesPerMonth: 2,
          emergencyCallsPerMonth: 1,
          partsDiscountPercentage: 20
        },
        recommendedFor: ['medium', 'large']
      },
      {
        id: 'template-premium',
        templateName: 'Plano Premium',
        description: 'Cobertura total para frotas grandes',
        planType: 'PREMIUM',
        monthlyFee: 999.90,
        currency: 'BRL',
        services: [
          {
            serviceType: 'OIL_CHANGE',
            serviceName: 'Troca de Óleo Premium',
            description: 'Troca de óleo sintético e filtros premium',
            included: true,
            frequency: 'QUARTERLY',
            intervalKilometers: 10000,
            estimatedDuration: 1,
            partsIncluded: true,
            laborIncluded: true,
            additionalCost: 0,
            priority: 'MEDIUM'
          },
          {
            serviceType: 'FILTER_REPLACEMENT',
            serviceName: 'Substituição de Filtros Premium',
            description: 'Filtros premium de ar, combustível e cabine',
            included: true,
            frequency: 'SEMIANNUAL',
            intervalKilometers: 20000,
            estimatedDuration: 1.5,
            partsIncluded: true,
            laborIncluded: true,
            additionalCost: 0,
            priority: 'MEDIUM'
          },
          {
            serviceType: 'BRAKE_SERVICE',
            serviceName: 'Serviço Completo de Freios',
            description: 'Inspeção completa e substituição se necessário',
            included: true,
            frequency: 'SEMIANNUAL',
            intervalKilometers: 20000,
            estimatedDuration: 2,
            partsIncluded: true,
            laborIncluded: true,
            additionalCost: 0,
            priority: 'HIGH'
          },
          {
            serviceType: 'TIRE_ROTATION',
            serviceName: 'Serviço Completo de Pneus',
            description: 'Rodízio, balanceamento e alinhamento',
            included: true,
            frequency: 'QUARTERLY',
            intervalKilometers: 10000,
            estimatedDuration: 1.5,
            partsIncluded: false,
            laborIncluded: true,
            additionalCost: 0,
            priority: 'LOW'
          },
          {
            serviceType: 'BATTERY_CHECK',
            serviceName: 'Verificação de Bateria',
            description: 'Teste completo e manutenção da bateria',
            included: true,
            frequency: 'QUARTERLY',
            intervalKilometers: 10000,
            estimatedDuration: 0.5,
            partsIncluded: false,
            laborIncluded: true,
            additionalCost: 0,
            priority: 'MEDIUM'
          },
          {
            serviceType: 'ENGINE_DIAGNOSTIC',
            serviceName: 'Diagnóstico Completo do Motor',
            description: 'Scanner e diagnóstico computadorizado',
            included: true,
            frequency: 'SEMIANNUAL',
            intervalKilometers: 20000,
            estimatedDuration: 2,
            partsIncluded: false,
            laborIncluded: true,
            additionalCost: 0,
            priority: 'HIGH'
          }
        ],
        coverage: {
          preventiveMaintenance: true,
          correctiveMaintenance: true,
          emergencyService: true,
          partsReplacement: 'INCLUDED',
          laborCost: true,
          towingService: true,
          technicalSupport: true
        },
        limits: {
          monthlyKilometers: 20000,
          preventiveServicesPerMonth: 6,
          correctiveServicesPerMonth: 4,
          emergencyCallsPerMonth: 2,
          partsDiscountPercentage: 0
        },
        recommendedFor: ['large', 'enterprise']
      }
    ];

    // Initialize sample plans
    this.plans = [
      {
        id: 'plan-001',
        clientId: 'client-001',
        clientName: 'Transportadora Rápido Express',
        planName: 'Plano Standard - 10 Veículos',
        description: 'Plano standard para frota de 10 veículos',
        planType: 'STANDARD',
        status: 'ACTIVE',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        billingCycle: 'MONTHLY',
        monthlyFee: 599.90,
        currency: 'BRL',
        services: this.templates[1].services.map((s, index) => ({ ...s, id: `service-${index}` })),
        vehicles: ['veh-001', 'veh-002', 'veh-003', 'veh-004', 'veh-005'],
        coverage: {
          preventiveMaintenance: true,
          correctiveMaintenance: true,
          emergencyService: true,
          partsReplacement: false,
          laborCost: true,
          towingService: true,
          technicalSupport: true
        },
        limits: {
          monthlyKilometers: 10000,
          preventiveServicesPerMonth: 4,
          correctiveServicesPerMonth: 2,
          emergencyCallsPerMonth: 1,
          partsDiscountPercentage: 20
        },
        renewal: {
          autoRenew: true,
          renewalNoticeDays: 30,
          gracePeriodDays: 10
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin'
      },
      {
        id: 'plan-002',
        clientId: 'client-002',
        clientName: 'Logística Urbana S/A',
        planName: 'Plano Premium - 20 Veículos',
        description: 'Plano premium para frota de 20 veículos',
        planType: 'PREMIUM',
        status: 'ACTIVE',
        contractStart: '2024-02-01',
        contractEnd: '2025-01-31',
        billingCycle: 'MONTHLY',
        monthlyFee: 1999.80,
        currency: 'BRL',
        services: this.templates[2].services.map((s, index) => ({ ...s, id: `service-${index}` })),
        vehicles: ['veh-006', 'veh-007', 'veh-008', 'veh-009', 'veh-010'],
        coverage: {
          preventiveMaintenance: true,
          correctiveMaintenance: true,
          emergencyService: true,
          partsReplacement: true,
          laborCost: true,
          towingService: true,
          technicalSupport: true
        },
        limits: {
          monthlyKilometers: 20000,
          preventiveServicesPerMonth: 6,
          correctiveServicesPerMonth: 4,
          emergencyCallsPerMonth: 2,
          partsDiscountPercentage: 0
        },
        renewal: {
          autoRenew: true,
          renewalNoticeDays: 45,
          gracePeriodDays: 15
        },
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin'
      }
    ];
  }

  // Plan Management
  async getAllPlans(): Promise<MaintenancePlan[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...this.plans]), 300);
    });
  }

  async getPlanById(planId: string): Promise<MaintenancePlan | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const plan = this.plans.find(p => p.id === planId);
        resolve(plan || null);
      }, 200);
    });
  }

  async getPlansByClient(clientId: string): Promise<MaintenancePlan[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const clientPlans = this.plans.filter(p => p.clientId === clientId);
        resolve(clientPlans);
      }, 200);
    });
  }

  async createPlan(planData: Omit<MaintenancePlan, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<MaintenancePlan> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newPlan: MaintenancePlan = {
          ...planData,
          id: `plan-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
          updatedBy: 'current-user'
        };
        this.plans.push(newPlan);
        resolve(newPlan);
      }, 500);
    });
  }

  async updatePlan(planId: string, updates: Partial<MaintenancePlan>): Promise<MaintenancePlan> {
    return new Promise(resolve => {
      setTimeout(() => {
        const planIndex = this.plans.findIndex(p => p.id === planId);
        if (planIndex === -1) {
          throw new Error('Plano não encontrado');
        }

        this.plans[planIndex] = {
          ...this.plans[planIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: 'current-user'
        };

        resolve(this.plans[planIndex]);
      }, 500);
    });
  }

  async deletePlan(planId: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const planIndex = this.plans.findIndex(p => p.id === planId);
        if (planIndex === -1) {
          throw new Error('Plano não encontrado');
        }

        this.plans.splice(planIndex, 1);
        resolve();
      }, 300);
    });
  }

  // Template Management
  async getAllTemplates(): Promise<MaintenancePlanTemplate[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...this.templates]), 200);
    });
  }

  async getTemplateById(templateId: string): Promise<MaintenancePlanTemplate | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const template = this.templates.find(t => t.id === templateId);
        resolve(template || null);
      }, 200);
    });
  }

  async createPlanFromTemplate(templateId: string, planData: {
    clientId: string;
    clientName: string;
    planName: string;
    description?: string;
    contractStart: string;
    contractEnd: string;
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
    vehicles: string[];
    renewal?: {
      autoRenew: boolean;
      renewalNoticeDays: number;
      gracePeriodDays: number;
    };
  }): Promise<MaintenancePlan> {
    return new Promise(async (resolve, reject) => {
      try {
        const template = await this.getTemplateById(templateId);
        if (!template) {
          throw new Error('Template não encontrado');
        }

        const newPlan: MaintenancePlan = {
          id: `plan-${Date.now()}`,
          clientId: planData.clientId,
          clientName: planData.clientName,
          planName: planData.planName,
          description: planData.description || template.description,
          planType: template.planType,
          status: 'ACTIVE',
          contractStart: planData.contractStart,
          contractEnd: planData.contractEnd,
          billingCycle: planData.billingCycle,
          monthlyFee: template.monthlyFee,
          currency: template.currency as 'BRL' | 'USD' | 'EUR',
          services: template.services.map((s, index) => ({ ...s, id: `service-${index}` })),
          vehicles: planData.vehicles,
          coverage: {
            ...template.coverage,
            partsReplacement: template.coverage.partsReplacement === 'INCLUDED'
          },
          limits: template.limits,
          renewal: planData.renewal || {
            autoRenew: true,
            renewalNoticeDays: 30,
            gracePeriodDays: 10
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
          updatedBy: 'current-user'
        };

        this.plans.push(newPlan);
        resolve(newPlan);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Usage Tracking
  async getPlanUsage(planId: string, period: string): Promise<MaintenancePlanUsage | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const usage = this.usage.find(u => u.planId === planId && u.period === period);
        
        if (!usage) {
          // Generate sample usage
          const sampleUsage: MaintenancePlanUsage = {
            planId,
            clientId: this.plans.find(p => p.id === planId)?.clientId || '',
            period,
            usage: {
              kilometersDriven: 8500,
              preventiveServicesUsed: 3,
              correctiveServicesUsed: 1,
              emergencyCallsUsed: 0,
              partsUsed: 5,
              laborHoursUsed: 8
            },
            costs: {
              totalCost: 1200,
              coveredCost: 800,
              additionalCost: 400,
              savedAmount: 400
            },
            services: [
              {
                serviceId: 'service-1',
                serviceName: 'Troca de Óleo',
                date: '2024-04-15',
                vehicleId: 'veh-001',
                mileage: 45000,
                cost: 200,
                covered: true,
                invoiceId: 'inv-001'
              },
              {
                serviceId: 'service-2',
                serviceName: 'Substituição de Filtros',
                date: '2024-04-20',
                vehicleId: 'veh-002',
                mileage: 52000,
                cost: 350,
                covered: true,
                invoiceId: 'inv-002'
              }
            ]
          };
          resolve(sampleUsage);
        } else {
          resolve(usage);
        }
      }, 200);
    });
  }

  // Invoice Management
  async getPlanInvoices(planId: string): Promise<MaintenancePlanInvoice[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const invoices = this.invoices.filter(i => i.planId === planId);
        
        if (invoices.length === 0) {
          // Generate sample invoices
          const sampleInvoices: MaintenancePlanInvoice[] = [
            {
              id: 'inv-001',
              planId,
              clientId: this.plans.find(p => p.id === planId)?.clientId || '',
              invoiceNumber: 'FAT-2024-001',
              period: '2024-04',
              issueDate: '2024-05-01',
              dueDate: '2024-05-10',
              status: 'PAID',
              baseAmount: 599.90,
              usageCharges: 150.00,
              discounts: 0,
              taxes: 119.98,
              totalAmount: 869.88,
              currency: 'BRL',
              items: [
                {
                  description: 'Plano Standard - Mensalidade',
                  quantity: 1,
                  unitPrice: 599.90,
                  amount: 599.90
                },
                {
                  description: 'Serviços Adicionais',
                  quantity: 2,
                  unitPrice: 75.00,
                  amount: 150.00
                },
                {
                  description: 'Impostos (20%)',
                  quantity: 1,
                  unitPrice: 119.98,
                  amount: 119.98
                }
              ],
              payment: {
                method: 'BANK_TRANSFER',
                status: 'COMPLETED',
                paidDate: '2024-05-05',
                transactionId: 'TXN-001'
              },
              createdAt: '2024-05-01T00:00:00Z',
              updatedAt: '2024-05-05T00:00:00Z'
            }
          ];
          resolve(sampleInvoices);
        } else {
          resolve(invoices);
        }
      }, 200);
    });
  }

  // Alert Management
  async getPlanAlerts(planId: string): Promise<MaintenancePlanAlert[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const alerts = this.alerts.filter(a => a.planId === planId);
        
        if (alerts.length === 0) {
          // Generate sample alerts
          const sampleAlerts: MaintenancePlanAlert[] = [
            {
              id: 'alert-001',
              planId,
              clientId: this.plans.find(p => p.id === planId)?.clientId || '',
              alertType: 'SERVICE_DUE',
              severity: 'MEDIUM',
              title: 'Serviço de Manutenção Preventiva',
              message: 'Veículo veh-001 está próximo da quilometragem para troca de óleo',
              actionRequired: true,
              actionUrl: '/maintenance/schedule',
              dueDate: '2024-05-15',
              acknowledged: false,
              createdAt: '2024-05-01T00:00:00Z'
            },
            {
              id: 'alert-002',
              planId,
              clientId: this.plans.find(p => p.id === planId)?.clientId || '',
              alertType: 'USAGE_LIMIT',
              severity: 'LOW',
              title: 'Limite de Uso Aproximado',
              message: '85% do limite de serviços preventivos mensais já utilizado',
              actionRequired: false,
              acknowledged: false,
              createdAt: '2024-04-28T00:00:00Z'
            }
          ];
          resolve(sampleAlerts);
        } else {
          resolve(alerts);
        }
      }, 200);
    });
  }

  // Utility Methods
  getPlanTypeLabel(planType: string): string {
    const labels: Record<string, string> = {
      'BASIC': 'Básico',
      'STANDARD': 'Standard',
      'PREMIUM': 'Premium',
      'CUSTOM': 'Personalizado'
    };
    return labels[planType] || planType;
  }

  getPlanTypeColor(planType: string): string {
    const colors: Record<string, string> = {
      'BASIC': 'bg-gray-100 text-gray-800',
      'STANDARD': 'bg-blue-100 text-blue-800',
      'PREMIUM': 'bg-purple-100 text-purple-800',
      'CUSTOM': 'bg-green-100 text-green-800'
    };
    return colors[planType] || 'bg-gray-100 text-gray-800';
  }

  getPlanStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Ativo',
      'INACTIVE': 'Inativo',
      'SUSPENDED': 'Suspenso',
      'EXPIRED': 'Expirado'
    };
    return labels[status] || status;
  }

  getPlanStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'SUSPENDED': 'bg-orange-100 text-orange-800',
      'EXPIRED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getServiceTypeLabel(serviceType: string): string {
    const labels: Record<string, string> = {
      'OIL_CHANGE': 'Troca de Óleo',
      'FILTER_REPLACEMENT': 'Substituição de Filtros',
      'BRAKE_SERVICE': 'Serviço de Freios',
      'TIRE_ROTATION': 'Rodízio de Pneus',
      'BATTERY_CHECK': 'Verificação de Bateria',
      'ENGINE_DIAGNOSTIC': 'Diagnóstico do Motor',
      'TRANSMISSION_SERVICE': 'Serviço de Transmissão',
      'COOLING_SERVICE': 'Serviço de Arrefecimento',
      'EXHAUST_SYSTEM': 'Sistema de Escapamento',
      'SUSPENSION_SERVICE': 'Serviço de Suspensão',
      'ALIGNMENT': 'Alinhamento',
      'CUSTOM': 'Personalizado'
    };
    return labels[serviceType] || serviceType;
  }

  getFrequencyLabel(frequency: string): string {
    const labels: Record<string, string> = {
      'DAILY': 'Diário',
      'WEEKLY': 'Semanal',
      'MONTHLY': 'Mensal',
      'QUARTERLY': 'Trimestral',
      'SEMIANNUAL': 'Semestral',
      'ANNUAL': 'Anual',
      'AS_NEEDED': 'Conforme Necessidade'
    };
    return labels[frequency] || frequency;
  }

  calculateUsagePercentage(used: number, limit: number): number {
    return Math.round((used / limit) * 100);
  }

  calculateSavings(plan: MaintenancePlan, usage: MaintenancePlanUsage): number {
    return usage.costs.savedAmount;
  }

  generatePlanReport(planId: string, startDate: string, endDate: string): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        const report = {
          planId,
          period: { startDate, endDate },
          summary: {
            totalServices: 15,
            preventiveServices: 12,
            correctiveServices: 3,
            emergencyCalls: 0,
            totalCost: 2500,
            coveredCost: 1800,
            savedAmount: 700,
            satisfactionScore: 4.8
          },
          vehicles: [
            {
              vehicleId: 'veh-001',
              services: 5,
              cost: 800,
              covered: 600
            },
            {
              vehicleId: 'veh-002',
              services: 4,
              cost: 650,
              covered: 500
            }
          ],
          trends: [
            { month: '2024-01', cost: 600, services: 4 },
            { month: '2024-02', cost: 750, services: 5 },
            { month: '2024-03', cost: 500, services: 3 },
            { month: '2024-04', cost: 650, services: 3 }
          ]
        };
        resolve(report);
      }, 1000);
    });
  }
}

export default MaintenancePlanService.getInstance();
