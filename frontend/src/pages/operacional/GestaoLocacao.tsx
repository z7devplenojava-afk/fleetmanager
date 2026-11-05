import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { clientService, Client } from '@/services/clientService';
import { contractService, Contract } from '@/services/contractService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { fleetService } from '@/services/fleetService';
import { Vehicle } from '@/types/fleet';
import {
  RentalInvoice,
  RentalInvoiceInput,
  RentalInvoiceItem,
  RentalInvoiceStatus,
  rentalInvoiceService,
} from '@/services/rentalInvoiceService';
import { RentalInvoicePdfService } from '@/services/rentalInvoicePdfService';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import {
  Truck,
  Plus,
  Search,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Download,
  Printer,
  Receipt,
  Loader2,
  Building2,
  DollarSign,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Car,
  ArrowRight,
} from 'lucide-react';

const STATUS_CONFIG: Record<RentalInvoiceStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  PAID: { label: 'Paga', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  OVERDUE: { label: 'Vencida', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  CANCELLED: { label: 'Cancelada', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
  PARTIAL: { label: 'Parcial', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
};

const PAYMENT_METHODS = [
  'TRANSFERÊNCIA BANCÁRIA',
  'PIX',
  'BOLETO BANCÁRIO',
  'DINHEIRO',
  'CHEQUE',
];

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  BUS_ROAD: 'Ônibus Rodoviário',
  BUS_INTERCITY: 'Ônibus Intermunicipal',
  BUS_LUXURY_TOURISM: 'Ônibus Executivo',
  MINIBUS: 'Micro-ônibus',
  VAN: 'Van',
  BUS_URBAN: 'Ônibus Urbano',
  CAR_UTILITY: 'Utilitário',
  CAR: 'Passeio',
  TRUCK: 'Caminhão',
  MOTORCYCLE: 'Motocicleta',
  PICKUP: 'Picape',
  SUV: 'SUV',
  OTHER: 'Outro',
};

interface InvoiceFormState {
  number: string;
  clientId: string;
  contractId: string;
  clientIe: string;
  issueDate: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  receiptDate: string;
  discount: number;
  status: RentalInvoiceStatus;
  paymentMethod: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  notes: string;
  items: RentalInvoiceItem[];
}

const today = () => format(new Date(), 'yyyy-MM-dd');

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return format(date, 'yyyy-MM-dd');
};

const firstDayOfPreviousMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  return format(date, 'yyyy-MM-dd');
};

const lastDayOfPreviousMonth = () => {
  const date = new Date();
  date.setDate(0);
  return format(date, 'yyyy-MM-dd');
};

const emptyForm = (): InvoiceFormState => ({
  number: '',
  clientId: '',
  contractId: '',
  clientIe: '',
  issueDate: today(),
  periodStart: firstDayOfPreviousMonth(),
  periodEnd: lastDayOfPreviousMonth(),
  dueDate: addDays(15),
  receiptDate: '',
  discount: 0,
  status: 'PENDING',
  paymentMethod: 'TRANSFERÊNCIA BANCÁRIA',
  bankName: 'BANCO DO BRASIL',
  bankAgency: '',
  bankAccount: '',
  notes: '',
  items: [],
});

const formatCurrency = (value?: number) =>
  (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value?: string) => {
  if (!value) return '-';
  const clean = value.substring(0, 10);
  const [year, month, day] = clean.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const contractLinksVehicle = (contract: Contract, vehicle: Vehicle) => {
  if (!contract) return false;
  if (vehicle.contractId && vehicle.contractId === contract.id) return true;
  return Boolean(
    contract.contractNumber &&
      vehicle.allocationContractNumber &&
      contract.contractNumber.trim().toLowerCase() === vehicle.allocationContractNumber.trim().toLowerCase()
  );
};

const normalizeName = (value?: string) => (value || '').trim().toLowerCase();

const MAX_VEHICLE_ROWS = 200;

const GENERIC_CLIENT_NAMES = ['cliente direto', 'a definir', 'não informado', 'sem cliente', 'geral', 'matriz'];

const PLACEHOLDER_TEXTS = [
  'a definir',
  'nao definir',
  'não definir',
  'a informar',
  'nao informado',
  'não informado',
  'sem informacao',
  'sem informação',
  'sem informacoes',
  'sem informações',
  '-',
  'n/a',
  'na',
];

/**
 * Veículos importados em lote (planilhas de obra) entram como rascunho:
 * placa gerada (OBR####) e marca/modelo "A definir". Não são veículos locados reais.
 */
const isPlaceholderVehicle = (vehicle: Vehicle): boolean => {
  const plate = (vehicle.plate || '').trim().toUpperCase();
  const brand = normalizeName(vehicle.brand);
  const model = normalizeName(vehicle.model);
  if (!plate || /^OBR\d+$/.test(plate)) return true;
  if (PLACEHOLDER_TEXTS.includes(brand) && PLACEHOLDER_TEXTS.includes(model)) return true;
  if (PLACEHOLDER_TEXTS.includes(brand) && !model) return true;
  return false;
};

const hasRentalAssignment = (vehicle: Vehicle): boolean =>
  Boolean(vehicle.clientId || vehicle.workPostId || vehicle.contractId || vehicle.allocationContractNumber);

export const GestaoLocacao: React.FC = () => {
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [invoices, setInvoices] = useState<RentalInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('veiculos');
  const [clientFilter, setClientFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<RentalInvoice | null>(null);
  const [form, setForm] = useState<InvoiceFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [vehicleSearchSelect, setVehicleSearchSelect] = useState('');

  const [viewInvoice, setViewInvoice] = useState<RentalInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<RentalInvoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsData, contractsData, vehiclesData, invoicesData, workPostsData] = await Promise.all([
        clientService.getAllClients(),
        contractService.getAllContracts(),
        fleetService.getVehicles(),
        rentalInvoiceService.list(),
        workPostService.getAllWorkPosts().catch(() => [] as WorkPost[]),
      ]);
      setClients(clientsData || []);
      setContracts((contractsData || []).filter(contract => contract.contractType === 'LOCACAO_VEICULOS'));
      setVehicles(vehiclesData || []);
      setInvoices(invoicesData || []);
      setWorkPosts(workPostsData || []);
    } catch (error) {
      console.error('Erro ao carregar Gestão de Locação:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os dados de locação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clientsById = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach(client => map.set(client.id, client));
    return map;
  }, [clients]);

  const contractsById = useMemo(() => {
    const map = new Map<string, Contract>();
    contracts.forEach(contract => map.set(contract.id, contract));
    return map;
  }, [contracts]);

  const clientsByName = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach(client => {
      const key = normalizeName(client.name);
      if (key) map.set(key, client);
    });
    return map;
  }, [clients]);

  const workPostsById = useMemo(() => {
    const map = new Map<string, WorkPost>();
    workPosts.forEach(workPost => map.set(workPost.id, workPost));
    return map;
  }, [workPosts]);

  const directContractForVehicle = useCallback(
    (vehicle: Vehicle): Contract | undefined => {
      if (vehicle.contractId && contractsById.has(vehicle.contractId)) {
        return contractsById.get(vehicle.contractId);
      }
      if (vehicle.allocationContractNumber) {
        const number = normalizeName(vehicle.allocationContractNumber);
        return contracts.find(contract => normalizeName(contract.contractNumber) === number);
      }
      return undefined;
    },
    [contracts, contractsById]
  );

  const clientForVehicle = useCallback(
    (vehicle: Vehicle): Client | undefined => {
      // 1. Vínculo direto do veículo com o cliente
      if (vehicle.clientId && clientsById.has(vehicle.clientId)) {
        return clientsById.get(vehicle.clientId);
      }

      // 2. Posto de trabalho/obra do veículo pertence a um cliente
      if (vehicle.workPostId) {
        const workPost = workPostsById.get(vehicle.workPostId);
        if (workPost?.clientId && clientsById.has(workPost.clientId)) {
          return clientsById.get(workPost.clientId);
        }
      }

      // 3. Contrato de locação vinculado ao veículo
      const directContract = directContractForVehicle(vehicle);
      if (directContract?.clientId && clientsById.has(directContract.clientId)) {
        return clientsById.get(directContract.clientId);
      }

      // 4. Nome do cliente gravado no veículo (dados legados)
      const nameKey = normalizeName(vehicle.clientName);
      if (nameKey && !GENERIC_CLIENT_NAMES.includes(nameKey)) {
        const client = clientsByName.get(nameKey);
        if (client) return client;
      }

      return undefined;
    },
    [clientsById, clientsByName, workPostsById, directContractForVehicle]
  );

  const contractForVehicle = useCallback(
    (vehicle: Vehicle): Contract | undefined => {
      const directContract = directContractForVehicle(vehicle);
      if (directContract) return directContract;

      const client = clientForVehicle(vehicle);
      if (!client) return undefined;
      return contracts.find(
        contract => contract.clientId === client.id && (contract.status === 'ACTIVE' || !contract.status)
      );
    },
    [directContractForVehicle, clientForVehicle, contracts]
  );

  const rentalVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Veículos em rascunho (importados de planilhas) não são locações reais
      if (isPlaceholderVehicle(vehicle)) return false;
      const client = clientForVehicle(vehicle);
      if (!client) return false;
      // Vínculo explícito de locação: cliente, posto/obra ou contrato
      if (hasRentalAssignment(vehicle)) return true;
      // Dados legados: veículo real vinculado somente pelo nome do cliente
      const nameKey = normalizeName(vehicle.clientName);
      return Boolean(nameKey && !GENERIC_CLIENT_NAMES.includes(nameKey));
    });
  }, [vehicles, clientForVehicle]);

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rentalVehicles.filter(vehicle => {
      const client = clientForVehicle(vehicle);
      if (clientFilter !== 'all' && client?.id !== clientFilter) return false;
      if (!term) return true;
      return [vehicle.plate, vehicle.model, vehicle.brand, vehicle.clientName, client?.name]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });
  }, [rentalVehicles, clientFilter, search, clientForVehicle]);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter(invoice => {
      if (clientFilter !== 'all' && invoice.clientId !== clientFilter) return false;
      if (!term) return true;
      return [
        invoice.number,
        invoice.clientName,
        invoice.clientCnpj,
        invoice.contractNumber,
        ...invoice.items.map(item => `${item.plate} ${item.model || ''}`),
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });
  }, [invoices, clientFilter, search]);

  const summary = useMemo(() => {
    const openInvoices = invoices.filter(invoice => invoice.status === 'PENDING' || invoice.status === 'OVERDUE' || invoice.status === 'PARTIAL');
    const activeContracts = contracts.filter(contract => contract.status === 'ACTIVE');
    return {
      activeContracts: activeContracts.length,
      rentalVehicles: rentalVehicles.length,
      openInvoices: openInvoices.length,
      receivable: openInvoices.reduce((sum, invoice) => sum + (invoice.netAmount || 0), 0),
    };
  }, [contracts, rentalVehicles, invoices]);

  const vehicleOptions: SearchableOption[] = useMemo(() => {
    return vehicles
      .filter(v => v && !isPlaceholderVehicle(v) && v.plate)
      .map(v => {
        const isSelected = form.items.some(item => item.vehicleId === v.id);
        const typeLabel = v.vehicleType ? (VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType) : 'Veículo';
        const clientAssigned = clientForVehicle(v);
        const modelDesc = [v.brand, v.model].filter(Boolean).join(' ') || v.model || '';
        return {
          value: v.id,
          label: `${v.plate} — ${modelDesc}`,
          subtitle: `${typeLabel}${clientAssigned ? ` · Vinculado a: ${clientAssigned.name}` : ' · Disponível na Frota'}`,
          badge: isSelected ? 'Na Fatura' : typeLabel,
          badgeColor: isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-300',
          keywords: [v.plate, v.model || '', v.brand || '', typeLabel, clientAssigned?.name || ''].filter(Boolean),
        };
      });
  }, [vehicles, form.items, clientForVehicle]);

  const availableVehicles = useMemo(() => {
    if (!form.clientId) return [];
    const selectedContract = form.contractId ? contractsById.get(form.contractId) : undefined;
    const selectedIds = new Set(
      form.items.map(item => item.vehicleId).filter((id): id is string => Boolean(id))
    );
    return rentalVehicles.filter(vehicle => {
      if (selectedIds.has(vehicle.id)) return true;
      if (selectedContract && contractLinksVehicle(selectedContract, vehicle)) return true;
      return clientForVehicle(vehicle)?.id === form.clientId;
    });
  }, [form.clientId, form.contractId, form.items, rentalVehicles, contractsById, clientForVehicle]);

  const formTotal = useMemo(
    () => form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [form.items]
  );
  const formNet = Math.max(formTotal - (Number(form.discount) || 0), 0);

  const resetForm = (invoice?: RentalInvoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setForm({
        number: invoice.number,
        clientId: invoice.clientId,
        contractId: invoice.contractId || '',
        clientIe: invoice.clientIe || '',
        issueDate: invoice.issueDate?.substring(0, 10) || today(),
        periodStart: invoice.periodStart?.substring(0, 10) || today(),
        periodEnd: invoice.periodEnd?.substring(0, 10) || today(),
        dueDate: invoice.dueDate?.substring(0, 10) || today(),
        receiptDate: invoice.receiptDate?.substring(0, 10) || '',
        discount: invoice.discount || 0,
        status: invoice.status || 'PENDING',
        paymentMethod: invoice.paymentMethod || 'TRANSFERÊNCIA BANCÁRIA',
        bankName: invoice.bankName || 'BANCO DO BRASIL',
        bankAgency: invoice.bankAgency || '',
        bankAccount: invoice.bankAccount || '',
        notes: invoice.notes || '',
        items: invoice.items.map(item => ({ ...item })),
      });
    } else {
      setEditingInvoice(null);
      setForm(emptyForm());
    }
  };

  const openNewInvoice = async (vehicle?: Vehicle) => {
    const base = emptyForm();
    try {
      base.number = await rentalInvoiceService.nextNumber();
    } catch {
      base.number = '';
    }

    if (vehicle) {
      const contract = contractForVehicle(vehicle);
      base.clientId = clientForVehicle(vehicle)?.id || contract?.clientId || '';
      base.contractId = contract?.id || '';
      if (base.contractId) {
        const selectedContract = contractsById.get(base.contractId);
        base.periodStart = selectedContract?.startDate?.substring(0, 10) || base.periodStart;
        base.periodEnd = selectedContract?.endDate?.substring(0, 10) || base.periodEnd;
      }
      base.items = [
        {
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          model: vehicle.model,
          description: 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA',
          amount: contract?.unitVehicleValue || 0,
        },
      ];
    }

    setEditingInvoice(null);
    setForm(base);
    setIsFormOpen(true);
  };

  const openEditInvoice = (invoice: RentalInvoice) => {
    resetForm(invoice);
    setIsFormOpen(true);
  };

  const handleClientChange = (clientId: string) => {
    const client = clientsById.get(clientId);
    setForm(prev => ({
      ...prev,
      clientId,
      contractId: '',
      clientIe: (client as any)?.ie || prev.clientIe,
    }));
  };

  const handleContractChange = (contractId: string) => {
    const contract = contractsById.get(contractId);
    setForm(prev => ({
      ...prev,
      contractId,
      periodStart: contract?.startDate?.substring(0, 10) || prev.periodStart,
      periodEnd: contract?.endDate?.substring(0, 10) || prev.periodEnd,
    }));
  };

  const addVehicleToInvoice = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    if (form.items.some(item => item.vehicleId === vehicle.id)) {
      toast({
        title: 'Veículo já adicionado',
        description: `O veículo ${vehicle.plate} já está na fatura.`,
      });
      return;
    }
    const contract = form.contractId ? contractsById.get(form.contractId) : contractForVehicle(vehicle);
    const defaultAmount = contract?.unitVehicleValue || (vehicle as any)?.rentalValue || 0;
    const modelDesc = [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || vehicle.model || 'Veículo';
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          model: modelDesc,
          description: 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA',
          amount: defaultAmount,
        },
      ],
    }));
    toast({
      title: 'Veículo incluído',
      description: `Veículo ${vehicle.plate} adicionado à fatura.`,
    });
  };

  const removeVehicleFromInvoice = (vehicleId: string | undefined, plate?: string) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter(item => (vehicleId ? item.vehicleId !== vehicleId : item.plate !== plate)),
    }));
  };

  const toggleVehicle = (vehicle: Vehicle) => {
    setForm(prev => {
      const exists = prev.items.some(item => item.vehicleId === vehicle.id);
      if (exists) {
        return { ...prev, items: prev.items.filter(item => item.vehicleId !== vehicle.id) };
      }
      const contract = form.contractId ? contractsById.get(form.contractId) : contractForVehicle(vehicle);
      const modelDesc = [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || vehicle.model || 'Veículo';
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            vehicleId: vehicle.id,
            plate: vehicle.plate,
            model: modelDesc,
            description: 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA',
            amount: contract?.unitVehicleValue || (vehicle as any)?.rentalValue || 0,
          },
        ],
      };
    });
  };

  const updateItemAmount = (vehicleId: string | undefined, amount: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.vehicleId === vehicleId ? { ...item, amount } : item
      ),
    }));
  };

  const handleSave = async () => {
    if (!form.clientId) {
      toast({ title: 'Cliente obrigatório', description: 'Selecione o cliente da locação.', variant: 'destructive' });
      return;
    }
    if (!form.issueDate || !form.periodStart || !form.periodEnd || !form.dueDate) {
      toast({ title: 'Datas obrigatórias', description: 'Informe emissão, período e vencimento.', variant: 'destructive' });
      return;
    }
    if (form.items.length === 0) {
      toast({
        title: 'Selecione os veículos',
        description: 'A fatura de locação deve estar relacionada a pelo menos um veículo locado.',
        variant: 'destructive',
      });
      return;
    }

    const client = clientsById.get(form.clientId);
    const contract = form.contractId ? contractsById.get(form.contractId) : undefined;
    const receiptDate = form.receiptDate || (form.status === 'PAID' ? today() : '');

    const payload: RentalInvoiceInput = {
      number: form.number,
      clientId: form.clientId,
      clientName: client?.name,
      clientCnpj: client?.cnpj,
      clientIe: form.clientIe,
      clientAddress: (client as any)?.address,
      clientCity: (client as any)?.city,
      clientState: (client as any)?.state,
      clientZipCode: (client as any)?.zipCode,
      contractId: form.contractId || null,
      contractNumber: contract?.contractNumber,
      issueDate: form.issueDate,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      dueDate: form.dueDate,
      receiptDate: receiptDate || undefined,
      discount: Number(form.discount) || 0,
      status: form.status,
      paymentMethod: form.paymentMethod,
      bankName: form.bankName,
      bankAgency: form.bankAgency,
      bankAccount: form.bankAccount,
      notes: form.notes,
      items: form.items.map(item => {
        const isUuid = item.vehicleId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.vehicleId);
        return {
          vehicleId: isUuid ? item.vehicleId : null,
          plate: item.plate,
          model: item.model,
          description: item.description,
          amount: Number(item.amount) || 0,
        };
      }),
    };

    setSaving(true);
    try {
      if (editingInvoice) {
        await rentalInvoiceService.update(editingInvoice.id, payload);
        toast({ title: 'Fatura atualizada', description: `Fatura ${form.number} atualizada com sucesso.` });
      } else {
        await rentalInvoiceService.create(payload);
        toast({ title: 'Fatura criada', description: `Fatura ${form.number} criada e vinculada aos veículos locados.` });
      }
      setIsFormOpen(false);
      setEditingInvoice(null);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao salvar fatura de locação:', error);
      toast({
        title: 'Erro ao salvar',
        description: error?.response?.data?.message || 'Não foi possível salvar a fatura de locação.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    setDeleting(true);
    try {
      await rentalInvoiceService.remove(invoiceToDelete.id);
      toast({ title: 'Fatura excluída', description: `A fatura ${invoiceToDelete.number} foi removida.` });
      setInvoiceToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir a fatura.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (invoice: RentalInvoice, status: RentalInvoiceStatus) => {
    try {
      await rentalInvoiceService.updateStatus(invoice.id, status);
      toast({ title: 'Status atualizado', description: `Fatura ${invoice.number}: ${STATUS_CONFIG[status].label}.` });
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
    }
  };

  const handleGeneratePdf = async (invoice: RentalInvoice) => {
    try {
      await RentalInvoicePdfService.generatePDF(invoice);
      toast({ title: 'Sucesso', description: 'PDF da fatura gerado no layout executivo da OS.' });
    } catch (error) {
      console.error('Erro ao gerar PDF da fatura:', error);
      toast({ title: 'Erro ao gerar PDF', description: 'Não foi possível gerar a fatura em PDF.', variant: 'destructive' });
    }
  };

  const handleDownloadNfse = async (invoice: RentalInvoice) => {
    try {
      await rentalInvoiceService.downloadNfse(invoice.id);
    } catch (error) {
      console.error('Erro ao gerar Nota Fiscal:', error);
      toast({
        title: 'Erro ao abrir Nota Fiscal',
        description: 'Não foi possível gerar a Nota Fiscal da fatura de locação.',
        variant: 'destructive',
      });
    }
  };

  return (
    <StandardLayout>
      <div className="space-y-6 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/90 p-6 rounded-2xl border border-white/10 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-bold px-2 py-0.5">
              MÓDULO OPERACIONAL
            </Badge>
            <span className="text-xs text-zinc-400">Locação de veículos para clientes</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Truck className="h-8 w-8 text-amber-400" />
            Gestão de Locação
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Veículos locados por cliente, contratos de locação e faturas vinculadas aos veículos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => openNewInvoice()}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Fatura de Locação
          </Button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/60 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Contratos de Locação Ativos</p>
                <p className="text-2xl font-extrabold text-white mt-1">{summary.activeContracts}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Veículos Locados</p>
                <p className="text-2xl font-extrabold text-white mt-1">{summary.rentalVehicles}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <Truck className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Faturas em Aberto</p>
                <p className="text-2xl font-extrabold text-white mt-1">{summary.openInvoices}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Total a Receber</p>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">{formatCurrency(summary.receivable)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-zinc-900/60 border-white/10">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar por placa, modelo, cliente, contrato ou nº da fatura..."
              className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-200"
            />
          </div>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full md:w-72 bg-zinc-950 border-zinc-800 text-zinc-200">
              <Building2 className="w-4 h-4 mr-2 text-zinc-500" />
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900 border border-white/10 p-1">
          <TabsTrigger value="veiculos" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Truck className="w-4 h-4 mr-2" />
            Veículos Locados ({filteredVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="faturas" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Faturas de Locação ({filteredInvoices.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Veículos locados por cliente */}
        <TabsContent value="veiculos" className="mt-4">
          <Card className="bg-zinc-900/60 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-400" />
                Veículos Locados por Cliente
              </CardTitle>
              <p className="text-xs text-zinc-400">
                Somente os veículos locados ao cliente. A locação é de veículo, sem cessão de mão de obra.
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-14 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Carregando veículos locados...
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="text-center py-14 text-zinc-400">
                  <Truck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-zinc-300">Nenhum veículo locado encontrado.</p>
                  <p className="text-xs mt-1">
                    Aloque veículos ao cliente no módulo Frota ou vincule-os a um contrato de locação.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Placa</TableHead>
                        <TableHead className="text-zinc-400">Veículo</TableHead>
                        <TableHead className="text-zinc-400">Cliente</TableHead>
                        <TableHead className="text-zinc-400">Contrato</TableHead>
                        <TableHead className="text-zinc-400">Período da Locação</TableHead>
                        <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicles.slice(0, MAX_VEHICLE_ROWS).map(vehicle => {
                        const contract = contractForVehicle(vehicle);
                        const client = clientForVehicle(vehicle);
                        return (
                          <TableRow key={vehicle.id} className="border-zinc-800 hover:bg-zinc-900/50">
                            <TableCell className="font-mono text-xs font-bold text-amber-400">
                              {vehicle.plate}
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-zinc-100">
                                {vehicle.brand ? `${vehicle.brand} ` : ''}{vehicle.model}
                              </div>
                              <div className="text-xs text-zinc-400">
                                {vehicle.vehicleType ? VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType : 'Veículo'}
                              </div>
                            </TableCell>
                            <TableCell className="text-zinc-200">
                              {client?.name || vehicle.clientName || contract?.clientName || '-'}
                            </TableCell>
                            <TableCell className="text-zinc-300 text-xs">
                              {contract ? `${contract.contractNumber} · ${contract.description}` : vehicle.allocationContractNumber || '-'}
                            </TableCell>
                            <TableCell className="text-zinc-300 text-xs">
                              {vehicle.allocationStartDate || contract?.startDate
                                ? `${formatDate(vehicle.allocationStartDate || contract?.startDate)} a ${formatDate(vehicle.allocationEndDate || contract?.endDate)}`
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openNewInvoice(vehicle)}
                                className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                Gerar Fatura
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {filteredVehicles.length > MAX_VEHICLE_ROWS && (
                    <p className="text-xs text-zinc-500 mt-3">
                      Exibindo os primeiros {MAX_VEHICLE_ROWS} de {filteredVehicles.length} veículos locados.
                      Use a busca ou o filtro de cliente para refinar.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Faturas */}
        <TabsContent value="faturas" className="mt-4">
          <Card className="bg-zinc-900/60 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Faturas de Locação
              </CardTitle>
              <p className="text-xs text-zinc-400">
                Cada fatura está relacionada ao cliente, ao contrato e aos veículos locados no período.
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-14 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Carregando faturas...
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-14 text-zinc-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-zinc-300">Nenhuma fatura de locação cadastrada.</p>
                  <p className="text-xs mt-1">Clique em "Nova Fatura de Locação" para começar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Nº</TableHead>
                        <TableHead className="text-zinc-400">Cliente</TableHead>
                        <TableHead className="text-zinc-400">Veículos</TableHead>
                        <TableHead className="text-zinc-400">Período</TableHead>
                        <TableHead className="text-zinc-400">Emissão</TableHead>
                        <TableHead className="text-zinc-400">Vencimento</TableHead>
                        <TableHead className="text-zinc-400">Recebimento</TableHead>
                        <TableHead className="text-zinc-400">NF</TableHead>
                        <TableHead className="text-zinc-400 text-right">Valor</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map(invoice => (
                        <TableRow key={invoice.id} className="border-zinc-800 hover:bg-zinc-900/50">
                          <TableCell className="font-mono text-xs font-bold text-amber-400">
                            {invoice.number}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-zinc-100">{invoice.clientName}</div>
                            <div className="text-xs text-zinc-400">{invoice.clientCnpj || '-'}</div>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-300">
                            {invoice.items.length > 0
                              ? invoice.items.map(item => item.plate).join(', ')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-300">
                            {formatDate(invoice.periodStart)} a {formatDate(invoice.periodEnd)}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-300">{formatDate(invoice.issueDate)}</TableCell>
                          <TableCell className="text-xs text-zinc-300">{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell className="text-xs text-zinc-400">
                            {invoice.receiptDate ? formatDate(invoice.receiptDate) : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-400">
                            {invoice.nfseNumber ? (
                              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                {invoice.nfseNumber}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-bold text-emerald-400">
                            {formatCurrency(invoice.netAmount)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={invoice.status}
                              onValueChange={value => handleStatusChange(invoice, value as RentalInvoiceStatus)}
                            >
                              <SelectTrigger className="h-7 w-32 bg-zinc-950 border-zinc-800 text-xs">
                                <Badge className={STATUS_CONFIG[invoice.status]?.className}>
                                  {STATUS_CONFIG[invoice.status]?.label || invoice.status}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                  <SelectItem key={status} value={status}>{config.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold gap-1.5 shadow-sm"
                                title="Download da Fatura em PDF"
                                onClick={() => handleGeneratePdf(invoice)}
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-400" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold gap-1.5 shadow-sm"
                                title="Visualizar Fatura"
                                onClick={() => setViewInvoice(invoice)}
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-400" />
                                Visualizar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold gap-1.5 shadow-sm"
                                title="Editar Fatura"
                                onClick={() => openEditInvoice(invoice)}
                              >
                                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold gap-1.5 shadow-sm"
                                title="Excluir Fatura"
                                onClick={() => setInvoiceToDelete(invoice)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de criação/edição */}
      <Dialog open={isFormOpen} onOpenChange={open => !saving && setIsFormOpen(open)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-amber-400" />
              {editingInvoice ? `Editar Fatura de Locação Nº ${form.number}` : 'Nova Fatura de Locação'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              A fatura é vinculada ao cliente, ao contrato de locação e aos veículos locados. Não há motorista/mão de obra.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-zinc-300">Cliente *</Label>
              <Select value={form.clientId} onValueChange={handleClientChange}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Nº da Fatura</Label>
              <Input
                value={form.number}
                onChange={event => setForm(prev => ({ ...prev, number: event.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 font-mono"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-zinc-300">Contrato de Locação</Label>
              <Select value={form.contractId} onValueChange={handleContractChange}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectValue placeholder="Selecione o contrato (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {contracts
                    .filter(contract => !form.clientId || contract.clientId === form.clientId)
                    .map(contract => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.contractNumber} — {contract.description}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Inscrição Estadual do Cliente</Label>
              <Input
                value={form.clientIe}
                onChange={event => setForm(prev => ({ ...prev, clientIe: event.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-zinc-300">Emissão *</Label>
              <Input
                type="date"
                value={form.issueDate}
                onChange={event => setForm(prev => ({ ...prev, issueDate: event.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Início do Período *</Label>
              <Input
                type="date"
                value={form.periodStart}
                onChange={event => setForm(prev => ({ ...prev, periodStart: event.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Fim do Período *</Label>
              <Input
                type="date"
                value={form.periodEnd}
                onChange={event => setForm(prev => ({ ...prev, periodEnd: event.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-zinc-300">Vencimento *</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={event => setForm(prev => ({ ...prev, dueDate: event.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Forma de Pagamento</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={value => setForm(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Status</Label>
              <Select
                value={form.status}
                onValueChange={value => setForm(prev => ({ ...prev, status: value as RentalInvoiceStatus }))}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dados bancários */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-800">
            <div className="space-y-1">
              <Label className="text-zinc-300">Banco</Label>
              <Input
                value={form.bankName}
                onChange={event => setForm(prev => ({ ...prev, bankName: event.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Agência</Label>
              <Input
                value={form.bankAgency}
                onChange={event => setForm(prev => ({ ...prev, bankAgency: event.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Conta Corrente</Label>
              <Input
                value={form.bankAccount}
                onChange={event => setForm(prev => ({ ...prev, bankAccount: event.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>
          </div>

          {/* Veículos Locados */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-zinc-200 text-sm font-bold flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  Veículos Locados da Fatura *
                </Label>
                <p className="text-xs text-zinc-400">
                  Selecione qualquer veículo da frota para faturar a locação. Sem motorista/sem mão de obra.
                </p>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 text-xs self-start sm:self-auto">
                {form.items.length} veículo(s) selecionado(s)
              </Badge>
            </div>

            {/* Campo Seletor com Busca para Adicionar Qualquer Veículo da Frota */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
              <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                Buscar e Adicionar Veículo da Frota à Fatura
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={vehicleSearchSelect}
                    onChange={(val) => {
                      if (val) {
                        addVehicleToInvoice(val);
                        setVehicleSearchSelect("");
                      }
                    }}
                    options={vehicleOptions}
                    placeholder="Pesquisar placa ou modelo de qualquer veículo da frota..."
                    searchPlaceholder="Digite a placa ou modelo (ex: ABC-1234, Scania, Civic...)"
                    emptyText="Nenhum veículo encontrado na frota."
                    maxVisibleOptions={60}
                  />
                </div>
              </div>
            </div>

            {/* Sugestões rápidas de veículos já associados a este cliente (se houver) */}
            {form.clientId && availableVehicles.length > 0 && (
              <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    Veículos pré-vinculados a este cliente ({availableVehicles.length}):
                  </span>
                  <span className="text-[11px] text-zinc-500">Clique para incluir ou remover</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableVehicles.map(v => {
                    const isSelected = form.items.some(item => item.vehicleId === v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVehicle(v)}
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs transition-colors border ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-medium'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                        }`}
                      >
                        <span className="font-mono font-bold">{v.plate}</span>
                        <span className="text-zinc-400 text-[11px]">{v.model}</span>
                        {isSelected ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista de veículos incluídos na fatura */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Itens da Fatura ({form.items.length})</span>
                {form.items.length > 0 && (
                  <span className="text-[11px] text-zinc-500">Ajuste o valor mensal/locação de cada veículo conforme necessário</span>
                )}
              </div>

              {form.items.length === 0 ? (
                <div className="text-sm text-zinc-400 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-lg p-6 text-center space-y-2">
                  <Car className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="font-medium text-zinc-300">Nenhum veículo adicionado a esta fatura ainda</p>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Use a barra de busca acima para pesquisar e selecionar os veículos da frota locados para este cliente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {form.items.map((item, index) => {
                    const veh = vehicles.find(v => v.id === item.vehicleId || v.plate === item.plate);
                    const typeLabel = veh?.vehicleType ? (VEHICLE_TYPE_LABELS[veh.vehicleType] || veh.vehicleType) : "";
                    return (
                      <div
                        key={item.vehicleId || item.plate || index}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded bg-zinc-900 border border-zinc-800 shrink-0">
                            <Car className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-sm">
                                {item.plate}
                              </span>
                              <span className="text-sm font-semibold text-zinc-100 truncate">
                                {item.model || veh?.model || "Veículo"}
                              </span>
                              {typeLabel && (
                                <Badge variant="outline" className="text-[10px] bg-zinc-900/80 border-zinc-700 text-zinc-300">
                                  {typeLabel}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5 truncate">
                              {item.description || "LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-zinc-400 whitespace-nowrap">Valor da Locação</Label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono">
                                R$
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.amount ?? 0}
                                onChange={event => updateItemAmount(item.vehicleId, Number(event.target.value) || 0)}
                                className="w-36 h-8 pl-8 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono text-sm text-right focus:border-amber-500"
                              />
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                            title="Remover veículo da fatura"
                            onClick={() => removeVehicleFromInvoice(item.vehicleId, item.plate)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-800">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-zinc-300">Observações</Label>
              <Textarea
                value={form.notes}
                onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))}
                rows={2}
                className="bg-zinc-900 border-zinc-800 text-zinc-200"
              />
            </div>
            <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex justify-between text-sm text-zinc-300">
                <span>Total dos veículos</span>
                <span className="font-mono">{formatCurrency(formTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-zinc-300 gap-2">
                <span>Desconto</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discount}
                  onChange={event => setForm(prev => ({ ...prev, discount: Number(event.target.value) || 0 }))}
                  className="w-28 h-7 bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-sm text-right"
                />
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-2 text-sm font-bold">
                <span className="text-zinc-200">Valor a receber</span>
                <span className="font-mono text-emerald-400">{formatCurrency(formNet)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saving}
              className="border-zinc-700 bg-zinc-900 text-zinc-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {editingInvoice ? 'Salvar Alterações' : 'Criar Fatura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de visualização */}
      <Dialog open={Boolean(viewInvoice)} onOpenChange={open => !open && setViewInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-amber-400" />
              Fatura de Locação Nº {viewInvoice?.number}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {viewInvoice?.clientName} · {viewInvoice?.contractNumber || 'Sem contrato vinculado'}
            </DialogDescription>
          </DialogHeader>

          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                  <p className="text-[11px] text-zinc-500">Emissão</p>
                  <p className="text-sm font-semibold text-zinc-100">{formatDate(viewInvoice.issueDate)}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                  <p className="text-[11px] text-zinc-500">Período</p>
                  <p className="text-sm font-semibold text-zinc-100">
                    {formatDate(viewInvoice.periodStart)} a {formatDate(viewInvoice.periodEnd)}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                  <p className="text-[11px] text-zinc-500">Vencimento</p>
                  <p className="text-sm font-semibold text-zinc-100">{formatDate(viewInvoice.dueDate)}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="text-[11px] text-emerald-400">Valor a receber</p>
                  <p className="text-sm font-bold text-emerald-300">{formatCurrency(viewInvoice.netAmount)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Veículos locados</p>
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Placa</TableHead>
                      <TableHead className="text-zinc-400">Veículo</TableHead>
                      <TableHead className="text-zinc-400">Descrição</TableHead>
                      <TableHead className="text-zinc-400 text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewInvoice.items.map((item, index) => (
                      <TableRow key={item.id || `${item.plate}-${index}`} className="border-zinc-800">
                        <TableCell className="font-mono text-xs font-bold text-amber-400">{item.plate}</TableCell>
                        <TableCell className="text-sm text-zinc-200">{item.model || '-'}</TableCell>
                        <TableCell className="text-xs text-zinc-400">{item.description || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-zinc-200">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm space-y-1">
                  <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Dados bancários</p>
                  <p className="text-zinc-300">{viewInvoice.bankName || '-'}</p>
                  <p className="text-zinc-400 text-xs">
                    Agência: {viewInvoice.bankAgency || '-'} · Conta: {viewInvoice.bankAccount || '-'}
                  </p>
                  <p className="text-zinc-400 text-xs">Pagamento: {viewInvoice.paymentMethod || '-'}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm space-y-1">
                  <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Totais</p>
                  <div className="flex justify-between text-zinc-300">
                    <span>Total</span><span className="font-mono">{formatCurrency(viewInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Desconto</span><span className="font-mono">{formatCurrency(viewInvoice.discount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-400 border-t border-zinc-800 pt-1">
                    <span>Valor a receber</span><span className="font-mono">{formatCurrency(viewInvoice.netAmount)}</span>
                  </div>
                </div>
              </div>

              {viewInvoice.notes && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-300">
                  <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Observações</p>
                  {viewInvoice.notes}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setViewInvoice(null)}
              className="border-zinc-700 bg-zinc-900 text-zinc-200"
            >
              Fechar
            </Button>
            {viewInvoice && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    openEditInvoice(viewInvoice);
                    setViewInvoice(null);
                  }}
                  className="border-zinc-700 bg-zinc-900 text-zinc-200"
                >
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => RentalInvoicePdfService.openPrintPreview(viewInvoice)}
                  className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:text-white"
                >
                  <Printer className="w-4 h-4 mr-2 text-zinc-300" /> Imprimir / Visualizar
                </Button>
                <Button
                  onClick={() => handleGeneratePdf(viewInvoice)}
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                >
                  <Download className="w-4 h-4 mr-2" /> Baixar PDF
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={Boolean(invoiceToDelete)} onOpenChange={open => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fatura de locação?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              A fatura Nº {invoiceToDelete?.number} de {invoiceToDelete?.clientName} será removida.
              Os veículos e o contrato não serão alterados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 bg-zinc-900 text-zinc-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </StandardLayout>
  );
};

export default GestaoLocacao;
