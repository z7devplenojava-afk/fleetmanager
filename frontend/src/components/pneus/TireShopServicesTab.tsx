import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import tireShopService, { TireShopCatalogItem, TireShopServiceRecord } from '@/services/tireShopService';
import contasAPagarService, { CreateSupplierRequest, Supplier } from '@/services/contasAPagarService';
import { Tire } from '@/services/tireService';
import { Vehicle } from '@/types/fleet';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import { BoletoViewerModal } from '@/components/abastecimento/BoletoViewerModal';
import { TireShopCatalogModal } from '@/components/pneus/TireShopCatalogModal';
import { getTireDisplayCode } from '@/utils/tireLifecycle';
import {
  Barcode,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  Eye,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';

interface TireShopServicesTabProps {
  tires: Tire[];
  vehicles: Vehicle[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const digitsOnly = (val?: string) => (val || '').replace(/\D/g, '');
const API_BASE = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');
const resolveAttachmentUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

function toIsoDate(val?: string): string {
  if (!val) return '';
  const clean = val.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean.slice(0, 10);
  const br = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return '';
}

function formatBrDate(val?: string): string {
  if (!val) return '-';
  const clean = val.split('T')[0];
  const [y, m, d] = clean.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return val;
}

const getInvoiceStatusBadge = (record: TireShopServiceRecord) => {
  if (!record.invoiceId) {
    return (
      <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400">
        Sem vínculo financeiro
      </Badge>
    );
  }
  switch (record.invoiceStatus) {
    case 'PAGA':
      return (
        <Badge className="bg-emerald-950/70 text-emerald-300 border border-emerald-600/60 text-[10px]">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Pago ({record.invoiceNumber})
        </Badge>
      );
    case 'ATRASADA':
    case 'VENCIDA':
      return (
        <Badge className="bg-red-950/70 text-red-300 border border-red-500/60 text-[10px]">
          <Clock className="h-3 w-3 mr-1" /> Vencido ({record.invoiceNumber})
        </Badge>
      );
    default:
      return (
        <Badge className="bg-amber-950/70 text-amber-300 border border-amber-500/60 text-[10px]">
          <Clock className="h-3 w-3 mr-1" /> Contas a Pagar ({record.invoiceNumber})
        </Badge>
      );
  }
};

export const TireShopServicesTab: React.FC<TireShopServicesTabProps> = ({ tires, vehicles }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const boletoInputRef = useRef<HTMLInputElement>(null);
  const nfInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TireShopServiceRecord | null>(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierInitialData, setSupplierInitialData] = useState<Partial<CreateSupplierRequest> | null>(null);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [viewingBoleto, setViewingBoleto] = useState<TireShopServiceRecord | null>(null);

  const [uploadingBoleto, setUploadingBoleto] = useState(false);
  const [uploadingNf, setUploadingNf] = useState(false);
  const [tirePickerQuery, setTirePickerQuery] = useState('');

  const todayIso = new Date().toISOString().split('T')[0];
  const defaultDueIso = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState<{
    catalogServiceId: string;
    serviceName: string;
    supplierId: string;
    vehicleId: string;
    tireIds: string[];
    quantity: number;
    unitAmount: number;
    totalAmount: number;
    serviceDate: string;
    dueDate: string;
    nfNumber: string;
    nfKey: string;
    nfUrl: string;
    nfOriginalName: string;
    boletoUrl: string;
    boletoOriginalName: string;
    linhaDigitavel: string;
    barcode: string;
    beneficiaryName: string;
    beneficiaryCnpj: string;
    generatePayable: boolean;
    notes: string;
  }>({
    catalogServiceId: '',
    serviceName: '',
    supplierId: '',
    vehicleId: '',
    tireIds: [],
    quantity: 1,
    unitAmount: 0,
    totalAmount: 0,
    serviceDate: todayIso,
    dueDate: defaultDueIso,
    nfNumber: '',
    nfKey: '',
    nfUrl: '',
    nfOriginalName: '',
    boletoUrl: '',
    boletoOriginalName: '',
    linhaDigitavel: '',
    barcode: '',
    beneficiaryName: '',
    beneficiaryCnpj: '',
    generatePayable: true,
    notes: '',
  });

  const { data: records = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['tire-shop-services'],
    queryFn: tireShopService.getAll,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['tire-shop-catalog'],
    queryFn: tireShopService.getCatalog,
    staleTime: 30_000,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => contasAPagarService.getFornecedores(),
    staleTime: 60_000,
  });

  const supplierOptions: SearchableOption[] = useMemo(
    () =>
      suppliers.map((s) => ({
        value: s.id,
        label: s.name,
        subtitle: s.cnpj || s.phone || s.city || undefined,
        badge: s.cnpj ? s.cnpj : undefined,
        keywords: [s.name || '', s.cnpj || '', (s.cnpj || '').replace(/\D/g, ''), s.email || ''],
      })),
    [suppliers]
  );

  const catalogOptions: SearchableOption[] = useMemo(
    () =>
      catalog.map((c) => ({
        value: c.id,
        label: c.name,
        subtitle: Number(c.defaultPrice || 0) > 0
          ? `Ref.: R$ ${Number(c.defaultPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : c.description || undefined,
        badge: c.code || undefined,
        keywords: [c.code || '', c.name || '', c.description || ''],
      })),
    [catalog]
  );

  const vehicleOptions: SearchableOption[] = useMemo(
    () =>
      vehicles
        .filter((v) => UUID_REGEX.test(String(v?.id || '')))
        .map((v) => ({
          value: v.id,
          label: `${v.fleetNumber ? `[Frota ${v.fleetNumber}] ` : ''}${v.plate} - ${v.brand} ${v.model}`.trim(),
          subtitle: `${v.currentMileage?.toLocaleString('pt-BR') || 0} km`,
          badge: v.fleetNumber || v.plate,
          keywords: [v.plate || '', (v.plate || '').replace(/[-\s]/g, ''), v.fleetNumber || '', v.brand || '', v.model || ''],
        })),
    [vehicles]
  );

  const filteredTiresForPicker = useMemo(() => {
    const q = tirePickerQuery.trim().toLowerCase();
    const list = q
      ? tires.filter(
          (t) =>
            (t.fireNumber || '').toLowerCase().includes(q) ||
            (t.serialNumber || '').toLowerCase().includes(q) ||
            (t.brand || '').toLowerCase().includes(q) ||
            (t.model || '').toLowerCase().includes(q) ||
            (t.vehiclePlate || '').toLowerCase().includes(q)
        )
      : tires;
    return list.slice(0, 30);
  }, [tires, tirePickerQuery]);

  const resetForm = () => {
    setEditingRecord(null);
    setTirePickerQuery('');
    setSupplierInitialData(null);
    setForm({
      catalogServiceId: '',
      serviceName: '',
      supplierId: '',
      vehicleId: '',
      tireIds: [],
      quantity: 1,
      unitAmount: 0,
      totalAmount: 0,
      serviceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      nfNumber: '',
      nfKey: '',
      nfUrl: '',
      nfOriginalName: '',
      boletoUrl: '',
      boletoOriginalName: '',
      linhaDigitavel: '',
      barcode: '',
      beneficiaryName: '',
      beneficiaryCnpj: '',
      generatePayable: true,
      notes: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditModal = (rec: TireShopServiceRecord) => {
    const matchedSupplier = suppliers.find((s) => s.id === rec.supplierId);
    setEditingRecord(rec);
    setTirePickerQuery('');
    setSupplierInitialData(null);
    setForm({
      catalogServiceId: rec.catalogServiceId || '',
      serviceName: rec.serviceName || '',
      supplierId: rec.supplierId || '',
      vehicleId: rec.vehicleId || '',
      tireIds: rec.tireIds || [],
      quantity: rec.quantity || 1,
      unitAmount: Number(rec.unitAmount) || 0,
      totalAmount: Number(rec.totalAmount) || 0,
      serviceDate: rec.serviceDate || todayIso,
      dueDate: rec.dueDate || defaultDueIso,
      nfNumber: rec.nfNumber || '',
      nfKey: rec.nfKey || '',
      nfUrl: rec.nfUrl || '',
      nfOriginalName: rec.nfOriginalName || '',
      boletoUrl: rec.boletoUrl || '',
      boletoOriginalName: rec.boletoOriginalName || '',
      linhaDigitavel: rec.linhaDigitavel || '',
      barcode: rec.barcode || '',
      beneficiaryName: rec.beneficiaryName || matchedSupplier?.name || rec.supplierName || '',
      beneficiaryCnpj: rec.beneficiaryCnpj || matchedSupplier?.cnpj || rec.supplierCnpj || '',
      generatePayable: rec.generatePayable ?? true,
      notes: rec.notes || '',
    });
    setFormOpen(true);
  };

  const handleSaveSupplier = async (payload: CreateSupplierRequest) => {
    const created = await contasAPagarService.createFornecedor(payload);
    await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    setSupplierInitialData(null);
    setForm((prev) => ({
      ...prev,
      supplierId: created.id,
      beneficiaryName: prev.beneficiaryName || created.name,
      beneficiaryCnpj: prev.beneficiaryCnpj || created.cnpj || '',
    }));
    setSupplierModalOpen(false);
    toast({
      title: 'Fornecedor cadastrado!',
      description: `${created.name} foi adicionado e já está selecionado no serviço.`,
    });
  };

  const handleNfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setUploadingNf(true);
      const result = await contasAPagarService.parseNfse(file);
      const parsed = result?.parsedData || {};
      const cnpjDigits = digitsOnly(result?.prestadorCnpj || parsed?.prestadorCnpjCpf);
      const matchedSupplier =
        suppliers.find((s) => result?.prestadorId && s.id === result.prestadorId) ||
        (cnpjDigits ? suppliers.find((s) => digitsOnly(s.cnpj) === cnpjDigits) : undefined);

      const nfIssueIso = parsed?.issueDate ? toIsoDate(String(parsed.issueDate)) : '';
      const nfAmount = Number(parsed?.netAmount || parsed?.grossAmount || 0);
      const nfBenefName = matchedSupplier?.name || result?.prestadorName || parsed?.prestadorName || '';
      const nfBenefCnpj = matchedSupplier?.cnpj || parsed?.prestadorCnpjCpf || result?.prestadorCnpj || '';

      if (!matchedSupplier && (nfBenefName || nfBenefCnpj)) {
        setSupplierInitialData({ name: nfBenefName, cnpj: nfBenefCnpj });
      }

      setForm((prev) => {
        const nextTotal = nfAmount > 0 && prev.totalAmount <= 0 ? nfAmount : prev.totalAmount;
        const nextUnit =
          nfAmount > 0 && prev.unitAmount <= 0
            ? Number((nextTotal / Math.max(1, prev.quantity)).toFixed(2))
            : prev.unitAmount;
        return {
          ...prev,
          nfNumber: parsed?.nfseNumber || prev.nfNumber,
          nfKey: parsed?.nfseKey || prev.nfKey,
          nfUrl: result?.fileUrl || parsed?.pdfUrl || parsed?.xmlUrl || prev.nfUrl,
          nfOriginalName: file.name,
          supplierId: matchedSupplier?.id || prev.supplierId,
          beneficiaryName: nfBenefName || prev.beneficiaryName,
          beneficiaryCnpj: nfBenefCnpj || prev.beneficiaryCnpj,
          serviceDate: nfIssueIso || prev.serviceDate,
          totalAmount: nextTotal,
          unitAmount: nextUnit,
        };
      });

      toast({
        title: 'Nota Fiscal anexada!',
        description: parsed?.nfseNumber
          ? `NF nº ${parsed.nfseNumber}${nfBenefName ? ` • ${nfBenefName}` : ''}`
          : matchedSupplier
          ? `Arquivo ${file.name} vinculado a ${matchedSupplier.name}.`
          : `Arquivo ${file.name} anexado. Confira os dados da NF.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao ler Nota Fiscal',
        description: err?.response?.data?.message || 'Não foi possível analisar a NF-e/NFS-e. Você ainda pode preencher o número manualmente.',
        variant: 'destructive',
      });
    } finally {
      setUploadingNf(false);
    }
  };

  const handleBoletoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setUploadingBoleto(true);
      const parsed = await contasAPagarService.parseBoleto(file);
      const parsedDue = toIsoDate(parsed.dueDate);
      const cnpjDigits = digitsOnly(parsed.beneficiaryCnpjCpf);
      const matchedSupplier = cnpjDigits
        ? suppliers.find((s) => digitsOnly(s.cnpj) === cnpjDigits)
        : undefined;

      if (!matchedSupplier && (parsed.beneficiaryName || parsed.beneficiaryCnpjCpf)) {
        setSupplierInitialData({
          name: parsed.beneficiaryName || '',
          cnpj: parsed.beneficiaryCnpjCpf || '',
        });
      }

      setForm((prev) => {
        const selectedSup = suppliers.find((s) => s.id === (prev.supplierId || matchedSupplier?.id));
        const nextTotal =
          parsed.amount && parsed.amount > 0 && prev.totalAmount <= 0
            ? Number(parsed.amount)
            : prev.totalAmount;
        const nextUnit =
          parsed.amount && parsed.amount > 0 && prev.unitAmount <= 0
            ? Number((nextTotal / Math.max(1, prev.quantity)).toFixed(2))
            : prev.unitAmount;
        return {
          ...prev,
          supplierId: prev.supplierId || matchedSupplier?.id || '',
          boletoUrl: parsed.fileUrl || prev.boletoUrl,
          boletoOriginalName: parsed.originalFileName || file.name,
          linhaDigitavel: parsed.linhaDigitavel || prev.linhaDigitavel,
          barcode: parsed.barcode || prev.barcode,
          beneficiaryName: parsed.beneficiaryName || prev.beneficiaryName || selectedSup?.name || '',
          beneficiaryCnpj: parsed.beneficiaryCnpjCpf || prev.beneficiaryCnpj || selectedSup?.cnpj || '',
          dueDate: parsedDue || prev.dueDate,
          totalAmount: nextTotal,
          unitAmount: nextUnit,
        };
      });
      toast({
        title: 'Boleto anexado com sucesso!',
        description: `${file.name}${parsed.beneficiaryCnpjCpf ? ` • CNPJ: ${parsed.beneficiaryCnpjCpf}` : ''}${parsed.dueDate ? ` • Venc.: ${parsed.dueDate}` : ''}`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao processar boleto',
        description: err?.response?.data?.message || 'Não foi possível ler ou enviar o arquivo do boleto.',
        variant: 'destructive',
      });
    } finally {
      setUploadingBoleto(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.supplierId) {
        throw new Error('Selecione o fornecedor / borracharia (ou cadastre um novo).');
      }
      if (!form.serviceName.trim()) {
        throw new Error('Selecione ou informe o serviço de borracharia realizado.');
      }
      const payload: Partial<TireShopServiceRecord> = {
        catalogServiceId: form.catalogServiceId || undefined,
        serviceName: form.serviceName.trim(),
        supplierId: form.supplierId,
        vehicleId: form.vehicleId || undefined,
        tireIds: form.tireIds,
        quantity: Math.max(1, Number(form.quantity) || 1),
        unitAmount: Number(form.unitAmount) || 0,
        totalAmount: Number(form.totalAmount) || 0,
        serviceDate: form.serviceDate,
        dueDate: form.dueDate || undefined,
        nfNumber: form.nfNumber.trim() || undefined,
        nfKey: form.nfKey.trim() || undefined,
        nfUrl: form.nfUrl || undefined,
        nfOriginalName: form.nfOriginalName || undefined,
        boletoUrl: form.boletoUrl || undefined,
        boletoOriginalName: form.boletoOriginalName || undefined,
        linhaDigitavel: form.linhaDigitavel || undefined,
        barcode: form.barcode || undefined,
        beneficiaryName: form.beneficiaryName.trim() || undefined,
        beneficiaryCnpj: form.beneficiaryCnpj.trim() || undefined,
        generatePayable: form.generatePayable,
        notes: form.notes.trim() || undefined,
      };
      if (editingRecord?.id) {
        return tireShopService.update(editingRecord.id, payload);
      }
      return tireShopService.create(payload);
    },
    onSuccess: (saved) => {
      toast({
        title: editingRecord ? 'Serviço atualizado!' : 'Serviço de borracharia registrado!',
        description: saved.invoiceNumber
          ? `Despesa ${saved.invoiceNumber} gerada no Contas a Pagar para o Financeiro.`
          : 'Registro salvo com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['tire-shop-services'] });
      queryClient.invalidateQueries({ queryKey: ['contas-a-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setFormOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao salvar serviço',
        description: err?.response?.data?.message || err?.message || 'Falha ao salvar registro.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tireShopService.delete(id),
    onSuccess: () => {
      toast({ title: 'Serviço removido.' });
      queryClient.invalidateQueries({ queryKey: ['tire-shop-services'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Não foi possível excluir',
        description: err?.response?.data?.message || 'Erro ao excluir registro.',
        variant: 'destructive',
      });
    },
  });

  const stats = useMemo(() => {
    let totalAmount = 0;
    let pendingCount = 0;
    let paidCount = 0;
    let withBoleto = 0;
    records.forEach((r) => {
      totalAmount += Number(r.totalAmount || 0);
      if (r.invoiceStatus === 'PAGA') paidCount++;
      else if (r.invoiceId) pendingCount++;
      if (r.boletoUrl) withBoleto++;
    });
    return { total: records.length, totalAmount, pendingCount, paidCount, withBoleto };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        (r.serviceNumber || '').toLowerCase().includes(q) ||
        (r.serviceName || '').toLowerCase().includes(q) ||
        (r.supplierName || '').toLowerCase().includes(q) ||
        (r.vehiclePlate || '').toLowerCase().includes(q) ||
        (r.vehicleFleetNumber || '').toLowerCase().includes(q) ||
        (r.tireLabelsSummary || '').toLowerCase().includes(q) ||
        (r.invoiceNumber || '').toLowerCase().includes(q) ||
        (r.nfNumber || '').toLowerCase().includes(q) ||
        (r.beneficiaryName || '').toLowerCase().includes(q) ||
        (r.beneficiaryCnpj || '').toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' && r.invoiceStatus === 'PAGA') ||
        (statusFilter === 'PENDING' && r.invoiceStatus !== 'PAGA');
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-seguranca-black/60 border-gray-700">
          <CardHeader className="pb-1 pt-3 px-3.5">
            <CardTitle className="text-[11px] font-semibold text-gray-400 uppercase">Serviços Registrados</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3.5">
            <div className="text-2xl font-bold font-mono text-white">{stats.total}</div>
            <span className="text-[10px] text-gray-400">Borracharia & Recapagem</span>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-black/60 border-gray-700">
          <CardHeader className="pb-1 pt-3 px-3.5">
            <CardTitle className="text-[11px] font-semibold text-seguranca-yellow uppercase">Total Lançado</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3.5">
            <div className="text-xl font-bold font-mono text-seguranca-yellow">
              R$ {stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-gray-400">Despesas vinculadas</span>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-black/60 border-gray-700">
          <CardHeader className="pb-1 pt-3 px-3.5">
            <CardTitle className="text-[11px] font-semibold text-amber-300 uppercase">A Pagar (Financeiro)</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3.5">
            <div className="text-2xl font-bold font-mono text-amber-300">{stats.pendingCount}</div>
            <span className="text-[10px] text-gray-400">{stats.paidCount} já pago(s) pelo financeiro</span>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-black/60 border-gray-700">
          <CardHeader className="pb-1 pt-3 px-3.5">
            <CardTitle className="text-[11px] font-semibold text-emerald-300 uppercase">Boletos Anexados</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3.5">
            <div className="text-2xl font-bold font-mono text-emerald-300">{stats.withBoleto}</div>
            <span className="text-[10px] text-gray-400">Disponíveis no Contas a Pagar</span>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="bg-seguranca-black/50 border-gray-700">
        <CardHeader className="py-3 px-4 border-b border-gray-700/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-seguranca-yellow flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              SERVIÇOS DE BORRACHARIA & INTEGRAÇÃO FINANCEIRA
            </CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">
              Registre serviços externos, anexe o boleto do fornecedor e envie automaticamente para o Contas a Pagar no Financeiro.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isFetching}
              onClick={() => refetch()}
              className="h-9 text-xs border-gray-600 text-gray-200 hover:bg-gray-800"
              title="Atualizar status de pagamento do Financeiro"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar Status
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCatalogModalOpen(true)}
              className="h-9 text-xs border-seguranca-yellow/50 text-seguranca-yellow hover:bg-seguranca-yellow/10"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Tabela de Serviços
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={openCreateModal}
              className="h-9 text-xs bg-seguranca-red hover:bg-seguranca-darkred text-white font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Registrar Serviço de Borracharia
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nº, serviço, fornecedor, frota ou pneu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-seguranca-black border-gray-600 text-xs text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-56 bg-seguranca-black border-gray-600 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white">
                <SelectItem value="ALL">Todos os Lançamentos</SelectItem>
                <SelectItem value="PENDING">Pendentes no Financeiro</SelectItem>
                <SelectItem value="PAID">Pagos pelo Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-gray-700 rounded-xl overflow-x-auto bg-seguranca-black">
            <Table>
              <TableHeader className="bg-seguranca-graphite">
                <TableRow className="border-gray-700">
                  <TableHead className="text-xs font-bold text-white">Nº / DATA / NF</TableHead>
                  <TableHead className="text-xs font-bold text-white">SERVIÇO DE BORRACHARIA</TableHead>
                  <TableHead className="text-xs font-bold text-white">FORNECEDOR / BENEFICIÁRIO</TableHead>
                  <TableHead className="text-xs font-bold text-white">VEÍCULO / PNEUS</TableHead>
                  <TableHead className="text-xs font-bold text-right text-white">VALOR</TableHead>
                  <TableHead className="text-xs font-bold text-white">BOLETO</TableHead>
                  <TableHead className="text-xs font-bold text-white">STATUS (NF / BOLETO)</TableHead>
                  <TableHead className="text-xs font-bold text-right text-white">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-20 text-center text-gray-400 text-xs">
                      Carregando serviços de borracharia...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-gray-500 text-xs">
                      Nenhum serviço de borracharia registrado ainda. Clique em "Registrar Serviço de Borracharia" para iniciar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((rec) => {
                    const isPaid = rec.invoiceStatus === 'PAGA';
                    const nfFileUrl = resolveAttachmentUrl(rec.nfUrl);
                    return (
                    <TableRow key={rec.id} className="border-gray-800 hover:bg-seguranca-graphite/40 text-xs">
                      <TableCell className="font-mono">
                        <div className="font-bold text-seguranca-yellow">{rec.serviceNumber}</div>
                        <div className="text-[11px] text-gray-400">{formatBrDate(rec.serviceDate)}</div>
                        {(rec.nfNumber || nfFileUrl) && (
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-200">
                              NF {rec.nfNumber || 'Anexada'}
                            </span>
                            {nfFileUrl && (
                              <a
                                href={nfFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-300 underline hover:text-blue-200"
                              >
                                Abrir NF
                              </a>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-white">{rec.serviceName}</div>
                        <div className="text-[11px] text-gray-400">
                          Qtd: {rec.quantity} • Venc.: {formatBrDate(rec.invoiceDueDate || rec.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-100">{rec.beneficiaryName || rec.supplierName || '-'}</div>
                        {(rec.beneficiaryCnpj || rec.supplierCnpj) && (
                          <span className="text-[10px] font-mono text-gray-400 block">
                            CNPJ: {rec.beneficiaryCnpj || rec.supplierCnpj}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-200">
                        {rec.vehiclePlate || rec.vehicleFleetNumber ? (
                          <div className="font-mono text-[11px] text-blue-300">
                            {rec.vehicleFleetNumber ? `Frota ${rec.vehicleFleetNumber} • ` : ''}
                            {rec.vehiclePlate}
                          </div>
                        ) : null}
                        {rec.tireLabelsSummary && (
                          <div className="text-[11px] font-mono text-amber-300">
                            Pneus: {rec.tireLabelsSummary}
                          </div>
                        )}
                        {!rec.vehiclePlate && !rec.vehicleFleetNumber && !rec.tireLabelsSummary && (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-300">
                        R$ {Number(rec.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {rec.boletoUrl ? (
                          <div className="space-y-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingBoleto(rec)}
                              className={`h-7 px-2 text-[11px] ${
                                isPaid
                                  ? 'border-emerald-500/60 text-emerald-300 bg-emerald-950/30 hover:bg-emerald-500/10'
                                  : 'border-amber-500/50 text-amber-200 hover:bg-amber-500/10'
                              }`}
                            >
                              <Eye className="h-3 w-3 mr-1" /> {isPaid ? 'Boleto Pago' : 'Ver Boleto'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500">Sem anexo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getInvoiceStatusBadge(rec)}
                          {isPaid && (
                            <div className="text-[10px] text-emerald-300 font-mono">
                              NF &amp; Boleto pagos{rec.invoicePaymentDate ? ` em ${formatBrDate(rec.invoicePaymentDate)}` : ''}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(rec)}
                            className="h-7 w-7 p-0 border-yellow-500/60 text-yellow-300 hover:bg-yellow-500 hover:text-black"
                            title="Editar / Anexar Boleto"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Excluir o serviço ${rec.serviceNumber}?`)) {
                                deleteMutation.mutate(rec.id);
                              }
                            }}
                            className="h-7 w-7 p-0 border-red-500/60 text-red-400 hover:bg-red-600 hover:text-white"
                            title="Excluir serviço"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Cadastro / Edição de Serviço de Borracharia */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-white p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-seguranca-yellow">
              <Wrench className="h-5 w-5" />
              {editingRecord ? `Editar Serviço • ${editingRecord.serviceNumber}` : 'Registrar Serviço de Borracharia'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-300">
              Informe o fornecedor, serviço, Nota Fiscal (NF-e / NFS-e), boleto com CNPJ do beneficiário e gere automaticamente o lançamento em Contas a Pagar.
            </DialogDescription>
          </DialogHeader>

          {editingRecord?.invoiceId && (
            <div
              className={`rounded-lg px-3 py-2 text-xs border flex flex-wrap items-center justify-between gap-2 ${
                editingRecord.invoiceStatus === 'PAGA'
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <span className="font-medium">
                {editingRecord.invoiceStatus === 'PAGA'
                  ? `✅ Pago pelo Financeiro${editingRecord.invoicePaymentDate ? ` em ${formatBrDate(editingRecord.invoicePaymentDate)}` : ''} — Nota Fiscal e Boleto quitados.`
                  : '⏳ Despesa enviada ao Contas a Pagar — aguardando pagamento pelo Financeiro.'}
              </span>
              <span className="font-mono text-[11px] font-bold">
                {editingRecord.invoiceNumber} • {editingRecord.invoiceStatus === 'PAGA' ? 'PAGA' : editingRecord.invoiceStatus || 'ABERTA'}
              </span>
            </div>
          )}

          <form
            id="tire-shop-service-form"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            {/* Fornecedor & Tipo de Serviço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-100 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-seguranca-yellow" />
                    Fornecedor / Borracharia *
                  </Label>
                  <button
                    type="button"
                    onClick={() => setSupplierModalOpen(true)}
                    className="text-[11px] font-semibold text-seguranca-yellow hover:underline"
                  >
                    + Cadastrar Fornecedor
                  </button>
                </div>
                <SearchableSelect
                  value={form.supplierId}
                  onChange={(val) => {
                    const sup = suppliers.find((s) => s.id === val);
                    setForm((prev) => ({
                      ...prev,
                      supplierId: val,
                      beneficiaryName: sup?.name || prev.beneficiaryName,
                      beneficiaryCnpj: sup?.cnpj || prev.beneficiaryCnpj,
                    }));
                  }}
                  options={supplierOptions}
                  maxVisibleOptions={60}
                  placeholder="Buscar fornecedor / recapadora..."
                  searchPlaceholder="Nome ou CNPJ do fornecedor..."
                  emptyText="Fornecedor não encontrado. Clique em + Cadastrar Fornecedor."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-100 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-seguranca-yellow" />
                    Serviço Realizado *
                  </Label>
                  <button
                    type="button"
                    onClick={() => setCatalogModalOpen(true)}
                    className="text-[11px] font-semibold text-seguranca-yellow hover:underline"
                  >
                    + Cadastrar / Tabela
                  </button>
                </div>
                <SearchableSelect
                  value={form.catalogServiceId}
                  fallbackLabel={!form.catalogServiceId ? form.serviceName : undefined}
                  onChange={(val, opt) => {
                    const matched = catalog.find((c) => c.id === val);
                    setForm((prev) => {
                      const unit =
                        matched && Number(matched.defaultPrice || 0) > 0 && prev.unitAmount <= 0
                          ? Number(matched.defaultPrice)
                          : prev.unitAmount;
                      return {
                        ...prev,
                        catalogServiceId: val,
                        serviceName: matched?.name || opt?.label || prev.serviceName,
                        unitAmount: unit,
                        totalAmount: unit > 0 ? Number((unit * Math.max(1, prev.quantity)).toFixed(2)) : prev.totalAmount,
                      };
                    });
                  }}
                  options={catalogOptions}
                  maxVisibleOptions={60}
                  allowCustomValue
                  customValuePrefix="Usar serviço"
                  onCreateCustomOption={(text) =>
                    setForm((prev) => ({ ...prev, catalogServiceId: '', serviceName: text }))
                  }
                  placeholder="Selecione da tabela de serviços..."
                  searchPlaceholder="Buscar ou digitar serviço..."
                  emptyText="Nenhum serviço encontrado na tabela."
                />
              </div>
            </div>

            {/* Veículo & Pneus Atendidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-100">Veículo (Opcional)</Label>
                <SearchableSelect
                  value={form.vehicleId}
                  onChange={(val) => setForm((prev) => ({ ...prev, vehicleId: val }))}
                  options={vehicleOptions}
                  maxVisibleOptions={60}
                  placeholder="Vincular veículo da frota..."
                  searchPlaceholder="Buscar placa, frota ou modelo..."
                  emptyText="Nenhum veículo encontrado."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-100">
                  Pneus Atendidos (Opcional • {form.tireIds.length} selecionado(s))
                </Label>
                <Input
                  value={tirePickerQuery}
                  onChange={(e) => setTirePickerQuery(e.target.value)}
                  placeholder="Filtrar pneu por nº fogo, série ou placa..."
                  className="bg-seguranca-black border-gray-600 text-xs text-white h-9"
                />
                <div className="max-h-24 overflow-y-auto rounded-lg border border-gray-700 bg-seguranca-black/60 p-1.5 flex flex-wrap gap-1">
                  {filteredTiresForPicker.map((t) => {
                    const selected = form.tireIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            tireIds: selected
                              ? prev.tireIds.filter((id) => id !== t.id)
                              : [...prev.tireIds, t.id],
                          }))
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                          selected
                            ? 'bg-seguranca-yellow text-black border-seguranca-yellow font-bold'
                            : 'bg-seguranca-graphite text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {getTireDisplayCode(t)} ({t.size})
                      </button>
                    );
                  })}
                  {filteredTiresForPicker.length === 0 && (
                    <span className="text-[10px] text-gray-500 px-1">Nenhum pneu encontrado.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quantidade, Valores & Datas */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs text-gray-200">Qtd.</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => {
                    const q = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setForm((prev) => ({
                      ...prev,
                      quantity: q,
                      totalAmount: Number((prev.unitAmount * q).toFixed(2)),
                    }));
                  }}
                  className="bg-seguranca-black border-gray-600 font-mono text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-200">Unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unitAmount}
                  onChange={(e) => {
                    const u = Math.max(0, parseFloat(e.target.value) || 0);
                    setForm((prev) => ({
                      ...prev,
                      unitAmount: u,
                      totalAmount: Number((u * prev.quantity).toFixed(2)),
                    }));
                  }}
                  className="bg-seguranca-black border-gray-600 font-mono text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-seguranca-yellow font-semibold">Total (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalAmount}
                  onChange={(e) => {
                    const tot = Math.max(0, parseFloat(e.target.value) || 0);
                    setForm((prev) => ({ ...prev, totalAmount: tot }));
                  }}
                  className="bg-seguranca-black border-seguranca-yellow/60 font-mono font-bold text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-200">Data Serviço *</Label>
                <Input
                  type="date"
                  value={form.serviceDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, serviceDate: e.target.value }))}
                  required
                  className="bg-seguranca-black border-gray-600 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-200">Vencimento *</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="bg-seguranca-black border-gray-600 text-xs text-white"
                />
              </div>
            </div>

            {/* Nota Fiscal (NF-e / NFS-e de Serviços / Recapagem) */}
            <div className="rounded-xl border border-gray-700 bg-seguranca-black/60 p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    Nota Fiscal de Serviço / Recapagem (NF-e / NFS-e)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={nfInputRef}
                    type="file"
                    accept=".xml,.pdf,application/xml,text/xml,application/pdf"
                    onChange={handleNfUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploadingNf}
                    onClick={() => nfInputRef.current?.click()}
                    className="h-8 text-xs border-blue-500/60 text-blue-300 hover:bg-blue-500/10"
                  >
                    {uploadingNf ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {form.nfUrl ? 'Substituir NF-e / NFS-e' : 'Upload NFS-e / NF-e (PDF/XML)'}
                  </Button>
                </div>
              </div>

              {form.nfOriginalName && (
                <div className="text-[11px] text-blue-200 bg-blue-950/40 border border-blue-700/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                  <span className="truncate">Nota Fiscal: <strong>{form.nfOriginalName}</strong></span>
                  {form.nfUrl && (
                    <a
                      href={resolveAttachmentUrl(form.nfUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-200 underline shrink-0"
                    >
                      Abrir arquivo
                    </a>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-300">Nº da Nota Fiscal (NF-e / NFS-e)</Label>
                  <Input
                    value={form.nfNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, nfNumber: e.target.value }))}
                    placeholder="Ex: 001458 (preenchido ao importar ou manual)"
                    className="bg-seguranca-black border-gray-600 font-mono text-xs text-white h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-300">Chave de Acesso / Cód. Verificação</Label>
                  <Input
                    value={form.nfKey}
                    onChange={(e) => setForm((prev) => ({ ...prev, nfKey: e.target.value }))}
                    placeholder="Opcional (44 dígitos ou código NFS-e)"
                    className="bg-seguranca-black border-gray-600 font-mono text-xs text-white h-9"
                  />
                </div>
              </div>
            </div>

            {/* Upload de Boleto + Beneficiário (CNPJ) + Integração Contas a Pagar */}
            <div className="rounded-xl border border-gray-700 bg-seguranca-black/60 p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    Boleto Bancário, Beneficiário (CNPJ) &amp; Pagamento
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={boletoInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleBoletoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploadingBoleto}
                    onClick={() => boletoInputRef.current?.click()}
                    className="h-8 text-xs border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10"
                  >
                    {uploadingBoleto ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {form.boletoUrl ? 'Substituir Boleto (PDF/Img)' : 'Upload do Boleto (PDF/Img)'}
                  </Button>
                </div>
              </div>

              {form.boletoOriginalName && (
                <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-700/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                  <span className="truncate">Anexo: <strong>{form.boletoOriginalName}</strong></span>
                  {form.boletoUrl && (
                    <a
                      href={resolveAttachmentUrl(form.boletoUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-200 underline shrink-0"
                    >
                      Abrir arquivo
                    </a>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-300">Beneficiário do Boleto (Razão Social)</Label>
                  <Input
                    value={form.beneficiaryName}
                    onChange={(e) => setForm((prev) => ({ ...prev, beneficiaryName: e.target.value }))}
                    placeholder="Ex: JGX RECAPAGEM DE PNEUS LTDA"
                    className="bg-seguranca-black border-gray-600 text-xs text-white h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-300">CNPJ do Beneficiário (Cedente)</Label>
                  <Input
                    value={form.beneficiaryCnpj}
                    onChange={(e) => setForm((prev) => ({ ...prev, beneficiaryCnpj: e.target.value }))}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="bg-seguranca-black border-gray-600 font-mono text-xs text-white h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-300 flex items-center gap-1">
                    <Barcode className="h-3.5 w-3.5 text-gray-400" /> Linha Digitável
                  </Label>
                  <Input
                    value={form.linhaDigitavel}
                    onChange={(e) => setForm((prev) => ({ ...prev, linhaDigitavel: e.target.value }))}
                    placeholder="Preenchida automaticamente ao subir boleto PDF..."
                    className="bg-seguranca-black border-gray-600 font-mono text-xs text-white h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-gray-300 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Integração Contas a Pagar
                  </Label>
                  <label className="flex items-center gap-2 rounded-lg border border-gray-700 bg-seguranca-graphite/60 px-3 h-9 text-xs text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.generatePayable}
                      onChange={(e) => setForm((prev) => ({ ...prev, generatePayable: e.target.checked }))}
                      className="h-4 w-4 accent-amber-400"
                    />
                    Gerar despesa no Contas a Pagar (Financeiro)
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-200">Observações</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Detalhes do serviço, garantia, nº ordem de coleta ou observações para o financeiro..."
                className="bg-seguranca-black border-gray-600 text-xs text-white"
              />
            </div>
          </form>

          <DialogFooter className="border-t border-gray-700 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
              className="border-gray-600 text-gray-200 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="tire-shop-service-form"
              disabled={saveMutation.isPending || uploadingBoleto || uploadingNf}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white font-semibold text-xs"
            >
              {saveMutation.isPending ? 'Salvando...' : editingRecord ? 'Atualizar Serviço' : 'Salvar Serviço e Gerar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Rápido de Cadastro de Fornecedor */}
      <SupplierFormModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        initialData={supplierInitialData}
        onSave={handleSaveSupplier}
      />

      {/* Modal da Tabela de Serviços de Borracharia */}
      <TireShopCatalogModal
        open={catalogModalOpen}
        onOpenChange={setCatalogModalOpen}
        onSelectCreated={(item: TireShopCatalogItem) => {
          setForm((prev) => ({
            ...prev,
            catalogServiceId: item.id,
            serviceName: item.name,
            unitAmount: Number(item.defaultPrice) > 0 && prev.unitAmount <= 0 ? Number(item.defaultPrice) : prev.unitAmount,
          }));
        }}
      />

      {/* Visualizador de Boleto Anexado */}
      <BoletoViewerModal
        isOpen={Boolean(viewingBoleto)}
        onClose={() => setViewingBoleto(null)}
        boletoUrl={resolveAttachmentUrl(viewingBoleto?.boletoUrl)}
        fileName={viewingBoleto?.boletoOriginalName}
        invoiceNumber={viewingBoleto?.invoiceNumber || viewingBoleto?.serviceNumber}
        nfNumber={viewingBoleto?.nfNumber}
        supplier={viewingBoleto?.supplierName}
        beneficiaryName={viewingBoleto?.beneficiaryName || viewingBoleto?.supplierName}
        beneficiaryCnpj={viewingBoleto?.beneficiaryCnpj || viewingBoleto?.supplierCnpj}
        status={viewingBoleto?.invoiceStatus}
        paymentDate={viewingBoleto?.invoicePaymentDate}
        amount={viewingBoleto?.totalAmount}
        dueDate={viewingBoleto?.invoiceDueDate || viewingBoleto?.dueDate}
        barcode={viewingBoleto?.barcode}
        linhaDigitavel={viewingBoleto?.linhaDigitavel}
      />
    </div>
  );
};

