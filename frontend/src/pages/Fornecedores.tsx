import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus, RefreshCw, Search, Edit2, Trash2, Eye, ToggleLeft, ToggleRight,
  FileSpreadsheet, Sparkles, Copy, Building2, Mail, Phone,
  Zap, ArrowDown, ArrowUp, ArrowUpDown, User, Calendar, Clock, Award,
  TrendingUp, AlertTriangle, ShieldAlert, Truck, Wrench, DollarSign,
  BarChart3, CheckSquare, Square, PackageCheck, Timer, FileText,
  SlidersHorizontal
} from 'lucide-react';
import {
  contasAPagarService,
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest
} from '@/services/contasAPagarService';
import fleetWorkOrderService, { FleetWorkOrder } from '@/services/fleetWorkOrderService';
import quotationService, { Quotation } from '@/services/quotationService';
import { useToast } from '@/hooks/use-toast';

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
] as const;

const CHUNK_SIZE = 30;

export type SortField =
  | 'name'
  | 'docType'
  | 'cnpj'
  | 'totalSpent'
  | 'orderCount'
  | 'vehicleCount'
  | 'avgDeliveryDays'
  | 'sinceDate'
  | 'city'
  | 'status';

export type SortDirection = 'ASC' | 'DESC';

// Helper para calcular e formatar o tempo decorrido de parceria/cadastro
function formatTempoParceria(dateStr?: string): { text: string; fullYears: number; fullMonths: number; rawDays: number } | null {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
  if (years === 0 && months === 0) parts.push(`${Math.max(1, days)} ${days === 1 ? 'dia' : 'dias'}`);

  return {
    text: parts.join(' e ') || 'Menos de 1 mês',
    fullYears: years,
    fullMonths: months,
    rawDays: days
  };
}

function formatDateDisplay(d?: string) {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('pt-BR');
  } catch {
    return d;
  }
}

function formatCurrency(val?: number) {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Fornecedores() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'lista' | 'dashboard'>('lista');

  // Ordenação (Sorting)
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC');

  // Dados
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  // Filtros e busca
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'PJ' | 'PF'>('all');

  // Carregamento Inteligente (Progressive Infinite Batching)
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  // Seleção e Exclusão em Massa
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single' | 'bulk';
    suppliers: Supplier[];
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modais de Criação/Edição e Visualização 360°
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  // Formulário com suporte a Pessoa Física (CPF) e Pessoa Jurídica (CNPJ)
  const [formPersonType, setFormPersonType] = useState<'PJ' | 'PF'>('PJ');
  const [form, setForm] = useState<CreateSupplierRequest & { documentType?: string; sinceDate?: string }>({
    name: '',
    tradeName: '',
    contactName: '',
    registrationNumber: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    category: '',
    notes: '',
    documentType: 'CNPJ',
    sinceDate: '',
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setVisibleCount(CHUNK_SIZE);
    }, 150);
    return () => clearTimeout(handler);
  }, [search]);

  // Carregar dados gerais
  const load = async () => {
    try {
      setLoading(true);
      const [suppliersData, woData, quotesData] = await Promise.all([
        contasAPagarService.getFornecedores().catch(() => []),
        fleetWorkOrderService.findAll().catch(() => []),
        quotationService.getAll().catch(() => []),
      ]);

      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setWorkOrders(Array.isArray(woData) ? woData : []);
      setQuotations(Array.isArray(quotesData) ? quotesData : []);
      setVisibleCount(CHUNK_SIZE);
      setSelectedIds(new Set());
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar fornecedores', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Formatadores de documentos
  const formatCnpj = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  const formatCpf = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const getDocType = (s: Supplier): 'PJ' | 'PF' => {
    if (s.documentType?.toUpperCase() === 'PF' || s.documentType?.toUpperCase() === 'CPF') return 'PF';
    if (s.documentType?.toUpperCase() === 'PJ' || s.documentType?.toUpperCase() === 'CNPJ') return 'PJ';
    const digits = (s.cnpj || '').replace(/\D/g, '');
    return digits.length === 11 ? 'PF' : 'PJ';
  };

  // Alternar ordenação ao clicar no header
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortField(field);
      // Se for número/valor, começar por DESC; se for texto, começar por ASC
      if (['totalSpent', 'orderCount', 'vehicleCount', 'avgDeliveryDays', 'sinceDate'].includes(field)) {
        setSortDirection('DESC');
      } else {
        setSortDirection('ASC');
      }
    }
  };

  // Indicador visual de ordenação para os cabeçalhos
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown
          size={13}
          className="ml-1 text-gray-500 opacity-50 group-hover:opacity-100 transition-opacity inline shrink-0"
        />
      );
    }
    return sortDirection === 'ASC' ? (
      <ArrowUp size={13} className="ml-1 text-seguranca-yellow inline shrink-0 font-bold" />
    ) : (
      <ArrowDown size={13} className="ml-1 text-seguranca-yellow inline shrink-0 font-bold" />
    );
  };

  // Métricas agregadas por fornecedor (Compras, O.S., Veículos, SLA, Pagamentos)
  const supplierMetricsMap = useMemo(() => {
    const map = new Map<string, {
      totalSpent: number;
      orderCount: number;
      quoteCount: number;
      servicedVehicles: Set<string>;
      itemsDelivered: { desc: string; qty: number; cost: number; date: string; plate?: string; type?: string }[];
      lastOrder?: { date: string; amount: number; osNumber?: string; status?: string };
      lastQuote?: { date: string; amount: number; quoteNumber?: string; status?: string };
      avgDeliveryDays: number;
    }>();

    suppliers.forEach(s => {
      map.set(s.id, {
        totalSpent: 0,
        orderCount: 0,
        quoteCount: 0,
        servicedVehicles: new Set<string>(),
        itemsDelivered: [],
        avgDeliveryDays: 1.5,
      });
    });

    workOrders.forEach(wo => {
      const woDate = wo.completionDate || wo.startDate || wo.actualDate || wo.plannedDate || wo.createdAt || '';
      let deliveryDays = 1.0;
      if (wo.startDate && wo.completionDate) {
        const diffMs = new Date(wo.completionDate).getTime() - new Date(wo.startDate).getTime();
        deliveryDays = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10);
      }

      if (wo.items && Array.isArray(wo.items)) {
        wo.items.forEach(item => {
          const providerStr = (item.provider || '').trim().toLowerCase();
          if (!providerStr) return;

          const matched = suppliers.find(s => {
            const sName = (s.name || '').toLowerCase();
            const sTrade = (s.tradeName || '').toLowerCase();
            return (
              s.id === item.provider ||
              (sName && (providerStr.includes(sName) || sName.includes(providerStr))) ||
              (sTrade && (providerStr.includes(sTrade) || sTrade.includes(providerStr)))
            );
          });

          if (matched) {
            const current = map.get(matched.id) || {
              totalSpent: 0,
              orderCount: 0,
              quoteCount: 0,
              servicedVehicles: new Set<string>(),
              itemsDelivered: [],
              avgDeliveryDays: deliveryDays,
            };

            const itemCost = Number(item.totalPrice || (item.quantity * item.unitPrice) || 0);
            current.totalSpent += itemCost;
            current.orderCount += 1;
            if (wo.vehiclePlate) {
              current.servicedVehicles.add(`${wo.vehiclePlate} (${wo.vehicleModel || 'Veículo'})`);
            }
            current.itemsDelivered.push({
              desc: item.description || 'Peça / Serviço de Manutenção',
              qty: item.quantity || 1,
              cost: itemCost,
              date: woDate,
              plate: wo.vehiclePlate,
              type: item.type === 'LABOR' ? 'Mão de Obra / Serviço' : 'Peça / Item'
            });

            if (!current.lastOrder || new Date(woDate) > new Date(current.lastOrder.date)) {
              current.lastOrder = {
                date: woDate,
                amount: itemCost || wo.totalCost || 0,
                osNumber: wo.osNumber || wo.id.slice(0, 8),
                status: wo.status === 'COMPLETED' ? 'Concluída' : wo.status === 'IN_PROGRESS' ? 'Em Execução' : 'Aberta'
              };
            }

            map.set(matched.id, current);
          }
        });
      }
    });

    quotations.forEach(q => {
      const sId = q.supplierId;
      const sName = (q.supplierName || '').toLowerCase();
      const matched = suppliers.find(s => s.id === sId || (sName && (s.name.toLowerCase().includes(sName) || sName.includes(s.name.toLowerCase()))));
      if (matched) {
        const current = map.get(matched.id);
        if (current) {
          current.quoteCount += 1;
          const qDate = q.createdAt || '';
          if (!current.lastQuote || new Date(qDate) > new Date(current.lastQuote.date)) {
            current.lastQuote = {
              date: qDate,
              amount: q.totalValue || 0,
              quoteNumber: q.quoteNumber || q.id.slice(0, 8),
              status: q.status === 'APPROVED' ? 'Aprovado' : q.status === 'REJECTED' ? 'Recusado' : 'Pendente'
            };
          }
        }
      }
    });

    return map;
  }, [suppliers, workOrders, quotations]);

  // Lista filtrada e ordenada
  const filteredAndSorted = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const cleanQ = q.replace(/\D/g, '');

    const filteredList = suppliers.filter(s => {
      if (statusFilter === 'active' && s.isActive === false) return false;
      if (statusFilter === 'inactive' && s.isActive !== false) return false;

      const docType = getDocType(s);
      if (typeFilter !== 'all' && docType !== typeFilter) return false;

      if (!q) return true;

      const name = (s.name || '').toLowerCase();
      const tradeName = (s.tradeName || '').toLowerCase();
      const contactName = (s.contactName || '').toLowerCase();
      const cnpjRaw = (s.cnpj || '').toLowerCase();
      const cnpjClean = cnpjRaw.replace(/\D/g, '');
      const city = (s.city || '').toLowerCase();
      const state = (s.state || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const cat = (s.category || '').toLowerCase();

      return (
        name.includes(q) ||
        tradeName.includes(q) ||
        contactName.includes(q) ||
        cnpjRaw.includes(q) ||
        (cleanQ && cnpjClean.includes(cleanQ)) ||
        city.includes(q) ||
        state.includes(q) ||
        email.includes(q) ||
        cat.includes(q)
      );
    });

    // Ordenação dinâmica
    filteredList.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
      } else if (sortField === 'docType') {
        cmp = getDocType(a).localeCompare(getDocType(b));
      } else if (sortField === 'cnpj') {
        cmp = (a.cnpj || '').localeCompare(b.cnpj || '');
      } else if (sortField === 'city') {
        cmp = (a.city || '').localeCompare(b.city || '', 'pt-BR');
      } else if (sortField === 'status') {
        const aStat = a.isActive !== false ? 1 : 0;
        const bStat = b.isActive !== false ? 1 : 0;
        cmp = aStat - bStat;
      } else if (sortField === 'sinceDate') {
        const dateA = new Date(a.sinceDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.sinceDate || b.createdAt || 0).getTime();
        cmp = dateA - dateB;
      } else if (sortField === 'totalSpent') {
        const spentA = supplierMetricsMap.get(a.id)?.totalSpent || 0;
        const spentB = supplierMetricsMap.get(b.id)?.totalSpent || 0;
        cmp = spentA - spentB;
      } else if (sortField === 'orderCount') {
        const countA = supplierMetricsMap.get(a.id)?.orderCount || 0;
        const countB = supplierMetricsMap.get(b.id)?.orderCount || 0;
        cmp = countA - countB;
      } else if (sortField === 'vehicleCount') {
        const vA = supplierMetricsMap.get(a.id)?.servicedVehicles.size || 0;
        const vB = supplierMetricsMap.get(b.id)?.servicedVehicles.size || 0;
        cmp = vA - vB;
      } else if (sortField === 'avgDeliveryDays') {
        const sA = supplierMetricsMap.get(a.id)?.avgDeliveryDays || 0;
        const sB = supplierMetricsMap.get(b.id)?.avgDeliveryDays || 0;
        cmp = sA - sB;
      }
      return sortDirection === 'ASC' ? cmp : -cmp;
    });

    return filteredList;
  }, [suppliers, debouncedSearch, statusFilter, typeFilter, sortField, sortDirection, supplierMetricsMap]);

  // Itens visíveis do Carregamento Inteligente
  const visibleSuppliers = useMemo(() => {
    return filteredAndSorted.slice(0, visibleCount);
  }, [filteredAndSorted, visibleCount]);

  const hasMore = visibleCount < filteredAndSorted.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount(prev => Math.min(prev + CHUNK_SIZE, filteredAndSorted.length));
    }
  }, [hasMore, filteredAndSorted.length]);

  // Observer de rolagem infinita
  useEffect(() => {
    if (!sentinelRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observerRef.current.observe(sentinelRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMore]);

  // Ranking ordenado de fornecedores com suporte a ordenação por qualquer coluna
  const supplierRanking = useMemo(() => {
    const list = [...suppliers].map(s => {
      const metrics = supplierMetricsMap.get(s.id) || {
        totalSpent: 0,
        orderCount: 0,
        quoteCount: 0,
        servicedVehicles: new Set<string>(),
        itemsDelivered: [],
        avgDeliveryDays: 1.5,
      };
      const tenure = formatTempoParceria(s.sinceDate || s.createdAt);
      return {
        supplier: s,
        docType: getDocType(s),
        totalSpent: metrics.totalSpent,
        orderCount: metrics.orderCount,
        quoteCount: metrics.quoteCount,
        vehicleCount: metrics.servicedVehicles.size,
        vehicles: Array.from(metrics.servicedVehicles),
        lastOrder: metrics.lastOrder,
        lastQuote: metrics.lastQuote,
        avgDeliveryDays: metrics.avgDeliveryDays,
        tenure: tenure?.text || 'Recente',
      };
    });

    // Ordenar pelo campo selecionado
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.supplier.name.localeCompare(b.supplier.name, 'pt-BR', { sensitivity: 'base' });
      } else if (sortField === 'docType') {
        cmp = a.docType.localeCompare(b.docType);
      } else if (sortField === 'cnpj') {
        cmp = (a.supplier.cnpj || '').localeCompare(b.supplier.cnpj || '');
      } else if (sortField === 'totalSpent') {
        cmp = a.totalSpent - b.totalSpent;
      } else if (sortField === 'orderCount') {
        cmp = a.orderCount - b.orderCount;
      } else if (sortField === 'vehicleCount') {
        cmp = a.vehicleCount - b.vehicleCount;
      } else if (sortField === 'avgDeliveryDays') {
        cmp = a.avgDeliveryDays - b.avgDeliveryDays;
      } else if (sortField === 'sinceDate') {
        const dateA = new Date(a.supplier.sinceDate || a.supplier.createdAt || 0).getTime();
        const dateB = new Date(b.supplier.sinceDate || b.supplier.createdAt || 0).getTime();
        cmp = dateA - dateB;
      } else {
        // Padrão do ranking: maior gasto primeiro
        cmp = a.totalSpent - b.totalSpent;
      }
      return sortDirection === 'ASC' ? cmp : -cmp;
    });

    return list;
  }, [suppliers, supplierMetricsMap, sortField, sortDirection]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.isActive !== false).length;
    const inactive = total - active;
    const pjCount = suppliers.filter(s => getDocType(s) === 'PJ').length;
    const pfCount = suppliers.filter(s => getDocType(s) === 'PF').length;
    const totalSpentGlobal = supplierRanking.reduce((acc, curr) => acc + curr.totalSpent, 0);
    const totalOrdersGlobal = supplierRanking.reduce((acc, curr) => acc + curr.orderCount, 0);

    return { total, active, inactive, pjCount, pfCount, totalSpentGlobal, totalOrdersGlobal };
  }, [suppliers, supplierRanking]);

  // Gerenciamento de Seleção em Massa
  const toggleSelectSupplier = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const next = new Set<string>();
    filteredAndSorted.forEach(s => next.add(s.id));
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isAllFilteredSelected =
    filteredAndSorted.length > 0 && filteredAndSorted.every(s => selectedIds.has(s.id));

  // Abertura de confirmação rica de exclusão
  const promptDeleteSingle = (s: Supplier) => {
    setDeleteTarget({
      type: 'single',
      suppliers: [s],
    });
  };

  const promptDeleteBulk = () => {
    const toDelete = suppliers.filter(s => selectedIds.has(s.id));
    if (toDelete.length === 0) return;
    setDeleteTarget({
      type: 'bulk',
      suppliers: toDelete,
    });
  };

  // Executar exclusão confirmada
  const confirmExecutionDelete = async () => {
    if (!deleteTarget || deleteTarget.suppliers.length === 0) return;
    try {
      setDeleting(true);
      const idsToDelete = deleteTarget.suppliers.map(s => s.id);

      if (deleteTarget.type === 'bulk' || idsToDelete.length > 1) {
        await contasAPagarService.deleteFornecedoresBatch(idsToDelete);
        setSuppliers(prev => prev.filter(s => !idsToDelete.includes(s.id)));
        toast({
          title: 'Exclusão em Massa Concluída',
          description: `${idsToDelete.length} fornecedor(es) excluído(s) com sucesso.`,
        });
      } else {
        await contasAPagarService.deleteFornecedor(idsToDelete[0]);
        setSuppliers(prev => prev.filter(s => s.id !== idsToDelete[0]));
        toast({
          title: 'Fornecedor Excluído',
          description: `${deleteTarget.suppliers[0].name} foi removido do sistema.`,
        });
      }

      if (viewingSupplier && idsToDelete.includes(viewingSupplier.id)) {
        setViewingSupplier(null);
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        idsToDelete.forEach(id => next.delete(id));
        return next;
      });
      setDeleteTarget(null);
    } catch (e: any) {
      toast({
        title: 'Erro na Exclusão',
        description: e?.response?.data?.message || 'Não foi possível excluir o(s) fornecedor(es).',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Consulta inteligente de CNPJ (BrasilAPI)
  const buscarDadosCnpj = async (cnpjInput: string) => {
    const clean = cnpjInput.replace(/\D/g, '');
    if (clean.length !== 14) {
      toast({ title: 'CNPJ Incompleto', description: 'Digite os 14 dígitos do CNPJ para buscar.', variant: 'destructive' });
      return;
    }

    try {
      setSearchingCnpj(true);
      const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (resp.ok) {
        const data = await resp.json();
        setForm(prev => ({
          ...prev,
          name: data.razao_social || data.nome_fantasia || prev.name,
          tradeName: data.nome_fantasia || prev.tradeName,
          address: [data.logradouro, data.numero, data.complemento, data.bairro].filter(Boolean).join(', ') || prev.address,
          city: data.municipio || prev.city,
          state: data.uf || prev.state,
          zipCode: data.cep ? data.cep.replace(/\D/g, '') : prev.zipCode,
          phone: data.ddd_telefone_1 || prev.phone,
          email: data.email || prev.email,
          sinceDate: data.data_inicio_atividade || prev.sinceDate,
        }));
        toast({
          title: 'CNPJ Localizado!',
          description: `Dados de ${data.razao_social || 'fornecedor'} preenchidos com sucesso.`,
        });
      } else {
        toast({ title: 'Não encontrado', description: 'CNPJ não localizado na base pública.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Aviso', description: 'Não foi possível consultar o CNPJ online.', variant: 'destructive' });
    } finally {
      setSearchingCnpj(false);
    }
  };

  const copyDoc = (doc: string, label: string) => {
    if (!doc) return;
    navigator.clipboard.writeText(doc);
    toast({ title: 'Copiado!', description: `${label} copiado para a área de transferência.` });
  };

  const resetForm = () => {
    setEditing(null);
    setFormPersonType('PJ');
    setForm({
      name: '',
      tradeName: '',
      contactName: '',
      registrationNumber: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      category: '',
      notes: '',
      documentType: 'CNPJ',
      sinceDate: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    const type = getDocType(s);
    setFormPersonType(type);
    setForm({
      name: s.name || '',
      tradeName: s.tradeName || '',
      contactName: s.contactName || '',
      registrationNumber: s.registrationNumber || '',
      cnpj: s.cnpj || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      city: s.city || '',
      state: s.state || '',
      zipCode: s.zipCode || '',
      category: s.category || '',
      notes: s.notes || '',
      documentType: type,
      sinceDate: s.sinceDate || (s.createdAt ? s.createdAt.slice(0, 10) : ''),
    });
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (!form.name?.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: formPersonType === 'PJ' ? 'Informe a Razão Social.' : 'Informe o Nome Completo.',
          variant: 'destructive',
        });
        return;
      }
      if (!form.cnpj?.trim()) {
        toast({
          title: 'Documento obrigatório',
          description: formPersonType === 'PJ' ? 'Informe o CNPJ.' : 'Informe o CPF.',
          variant: 'destructive',
        });
        return;
      }

      const cleanDoc = form.cnpj.replace(/\D/g, '');
      if (formPersonType === 'PJ' && cleanDoc.length !== 14) {
        toast({ title: 'CNPJ Inválido', description: 'CNPJ deve conter 14 dígitos.', variant: 'destructive' });
        return;
      }
      if (formPersonType === 'PF' && cleanDoc.length !== 11) {
        toast({ title: 'CPF Inválido', description: 'CPF deve conter 11 dígitos.', variant: 'destructive' });
        return;
      }

      const payload = {
        ...form,
        documentType: formPersonType,
      };

      if (editing) {
        const updated = await contasAPagarService.updateFornecedor(String(editing.id), payload);
        setSuppliers(prev => prev.map(s => (s.id === updated.id ? updated : s)));
        if (viewingSupplier?.id === updated.id) {
          setViewingSupplier(updated);
        }
        toast({ title: 'Sucesso', description: 'Fornecedor atualizado com sucesso.' });
      } else {
        const created = await contasAPagarService.createFornecedor(payload);
        setSuppliers(prev => [created, ...prev]);
        toast({ title: 'Sucesso', description: 'Novo fornecedor cadastrado com sucesso.' });
      }
      setShowModal(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Não foi possível salvar o fornecedor.';
      toast({ title: 'Erro ao Salvar', description: msg, variant: 'destructive' });
    }
  };

  const toggleStatus = async (s: Supplier) => {
    try {
      const updated = await contasAPagarService.toggleFornecedorStatus(String(s.id));
      setSuppliers(prev => prev.map(x => (x.id === updated.id ? updated : x)));
      if (viewingSupplier?.id === s.id) {
        setViewingSupplier(updated);
      }
      toast({
        title: 'Status Alterado',
        description: `Fornecedor ${updated.name} está agora ${updated.isActive !== false ? 'ativo' : 'inativo'}.`,
      });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível alterar status.', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      toast({ title: 'Importando...', description: 'Processando planilha de fornecedores...' });
      const res = await contasAPagarService.importarFornecedoresExcel(file);

      const totalSuccess = (res.inserted || 0) + (res.updated || 0);
      if (totalSuccess > 0) {
        toast({
          title: 'Importação Concluída!',
          description: `${res.inserted || 0} fornecedor(es) inserido(s), ${res.updated || 0} atualizado(s).`,
        });
        await load();
      } else if (res.errors && res.errors.length > 0) {
        toast({
          title: 'Atenção na Importação',
          description: res.errors.slice(0, 2).join(' | '),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Nenhum registro importado',
          description: 'Verifique se a planilha possui colunas de Nome e CPF/CNPJ.',
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Falha ao importar planilha de fornecedores.';
      toast({ title: 'Erro na importação', description: msg, variant: 'destructive' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <StandardLayout title="Gestão de Fornecedores">
      <div className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx,.xls"
          className="hidden"
        />

        {/* Header Tabs: Lista de Fornecedores vs Dashboard & Ranking */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-seguranca-graphite border border-gray-700/80 p-2 rounded-xl shadow-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('lista')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'lista'
                  ? 'bg-seguranca-yellow text-slate-950 shadow-md font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 size={16} />
              Lista de Fornecedores
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'lista' ? 'bg-black/20 text-slate-950 font-bold' : 'bg-slate-800 text-gray-400'
              }`}>
                {suppliers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-seguranca-yellow text-slate-950 shadow-md font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 size={16} />
              Dashboard & Ranking
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'dashboard' ? 'bg-black/20 text-slate-950 font-bold' : 'bg-amber-950/40 text-amber-400 border border-amber-500/30'
              }`}>
                Top Acionados
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading || importing}
              title="Atualizar dados"
              className="bg-slate-800 border-gray-600 text-gray-200 hover:bg-slate-700 text-xs"
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="border-emerald-600/60 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600/20 text-xs"
            >
              <FileSpreadsheet size={14} className={`mr-1.5 ${importing ? 'animate-bounce' : ''}`} />
              {importing ? 'Importando...' : 'Importar Planilha'}
            </Button>
            <Button
              size="sm"
              onClick={openCreate}
              className="bg-seguranca-red hover:bg-red-700 text-white font-medium shadow-md text-xs"
            >
              <Plus size={15} className="mr-1" /> Novo Fornecedor
            </Button>
          </div>
        </div>

        {/* Floating Bulk Selection Action Bar */}
        {selectedIds.size > 0 && activeTab === 'lista' && (
          <div className="sticky top-2 z-30 flex items-center justify-between p-3.5 bg-slate-900/95 backdrop-blur-md border-2 border-seguranca-yellow/80 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-seguranca-yellow text-slate-950 font-bold text-xs">
                {selectedIds.size}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedIds.size} fornecedor(es) selecionado(s)
                </p>
                <p className="text-[11px] text-gray-400">
                  Pronto para ações em massa com confirmação de segurança.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="bg-slate-800 text-gray-300 hover:bg-slate-700 border-gray-700 text-xs"
              >
                Desmarcar todos
              </Button>
              <Button
                size="sm"
                onClick={promptDeleteBulk}
                className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-md"
              >
                <Trash2 size={14} className="mr-1.5" />
                Excluir Selecionados ({selectedIds.size})
              </Button>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: LISTA DE FORNECEDORES */}
        {activeTab === 'lista' && (
          <div className="space-y-4">
            {/* Barra de Busca e Filtros */}
            <Card className="p-4 bg-seguranca-graphite border-gray-700 shadow-md">
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-seguranca-lightgray flex-1 max-w-md">
                  <Search size={18} className="text-gray-400 ml-1" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nome, CPF/CNPJ, cidade, categoria..."
                    className="form-input w-full bg-slate-900/60 border-gray-600 focus:border-seguranca-yellow text-white placeholder:text-gray-500"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="text-xs text-gray-400 hover:text-white px-1.5 py-0.5 rounded bg-gray-700/60"
                      title="Limpar busca"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Seleção rápida em massa */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isAllFilteredSelected ? clearSelection : selectAllFiltered}
                    className="border-gray-700 bg-slate-800/80 text-gray-300 hover:bg-slate-700 text-xs"
                  >
                    {isAllFilteredSelected ? (
                      <>
                        <CheckSquare size={14} className="mr-1.5 text-seguranca-yellow" /> Desmarcar Filtrados
                      </>
                    ) : (
                      <>
                        <Square size={14} className="mr-1.5 text-gray-400" /> Selecionar Todos Filtrados ({filteredAndSorted.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Filtros de Status, Tipo e Indicador de Ordenação */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-700/60 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Status:</span>
                    <button
                      onClick={() => { setStatusFilter('all'); setVisibleCount(CHUNK_SIZE); }}
                      className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                        statusFilter === 'all'
                          ? 'bg-seguranca-yellow text-black shadow-sm font-semibold'
                          : 'bg-slate-800/80 text-gray-300 hover:bg-slate-700'
                      }`}
                    >
                      Todos ({stats.total})
                    </button>
                    <button
                      onClick={() => { setStatusFilter('active'); setVisibleCount(CHUNK_SIZE); }}
                      className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                        statusFilter === 'active'
                          ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                          : 'bg-slate-800/80 text-emerald-400 hover:bg-slate-700'
                      }`}
                    >
                      Ativos ({stats.active})
                    </button>
                    <button
                      onClick={() => { setStatusFilter('inactive'); setVisibleCount(CHUNK_SIZE); }}
                      className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                        statusFilter === 'inactive'
                          ? 'bg-red-600 text-white shadow-sm font-semibold'
                          : 'bg-slate-800/80 text-gray-400 hover:bg-slate-700'
                      }`}
                    >
                      Inativos ({stats.inactive})
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-gray-700">
                    <span className="text-gray-400 font-medium">Tipo:</span>
                    <button
                      onClick={() => { setTypeFilter('all'); setVisibleCount(CHUNK_SIZE); }}
                      className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                        typeFilter === 'all'
                          ? 'bg-slate-700 text-white font-semibold'
                          : 'bg-slate-800/80 text-gray-400 hover:bg-slate-700'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => { setTypeFilter('PJ'); setVisibleCount(CHUNK_SIZE); }}
                      className={`px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                        typeFilter === 'PJ'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-slate-800/80 text-blue-400 hover:bg-slate-700'
                      }`}
                    >
                      <Building2 size={12} /> PJ ({stats.pjCount})
                    </button>
                    <button
                      onClick={() => { setTypeFilter('PF'); setVisibleCount(CHUNK_SIZE); }}
                      className={`px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                        typeFilter === 'PF'
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'bg-slate-800/80 text-purple-400 hover:bg-slate-700'
                      }`}
                    >
                      <User size={12} /> PF ({stats.pfCount})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-400">
                  <div className="flex items-center gap-1 text-seguranca-yellow font-medium">
                    <SlidersHorizontal size={13} />
                    <span>
                      Ordenando por:{' '}
                      <strong className="text-white capitalize">
                        {sortField === 'name'
                          ? 'Fornecedor'
                          : sortField === 'docType'
                          ? 'Tipo'
                          : sortField === 'cnpj'
                          ? 'Documento'
                          : sortField === 'sinceDate'
                          ? 'Data de Cadastro'
                          : sortField === 'city'
                          ? 'Cidade'
                          : sortField === 'status'
                          ? 'Status'
                          : sortField}
                      </strong>{' '}
                      ({sortDirection})
                    </span>
                  </div>
                  <span>•</span>
                  <span>
                    Exibindo <strong className="text-white">{Math.min(visibleCount, filteredAndSorted.length)}</strong> de{' '}
                    <strong className="text-white">{filteredAndSorted.length}</strong>
                  </span>
                </div>
              </div>
            </Card>

            {/* Cabeçalho Interativo com Ordenação e Lista de Fornecedores */}
            <Card className="p-0 overflow-hidden bg-seguranca-graphite border-gray-700 shadow-md">
              {/* Header de Colunas Clicáveis para Ordenação */}
              <div className="hidden md:flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-gray-700/80 text-xs text-gray-400 select-none">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-5 shrink-0" />
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 font-semibold text-gray-300 hover:text-seguranca-yellow transition-colors group text-left"
                  >
                    Fornecedor / Razão Social {renderSortIndicator('name')}
                  </button>

                  <button
                    onClick={() => handleSort('docType')}
                    className="flex items-center gap-1 font-semibold text-gray-300 hover:text-seguranca-yellow transition-colors group text-left ml-4"
                  >
                    Tipo / Documento {renderSortIndicator('docType')}
                  </button>

                  <button
                    onClick={() => handleSort('city')}
                    className="flex items-center gap-1 font-semibold text-gray-300 hover:text-seguranca-yellow transition-colors group text-left ml-4"
                  >
                    Cidade / UF {renderSortIndicator('city')}
                  </button>

                  <button
                    onClick={() => handleSort('sinceDate')}
                    className="flex items-center gap-1 font-semibold text-gray-300 hover:text-seguranca-yellow transition-colors group text-left ml-4"
                    title="Ordenar por Data de Parceria ou Cadastro no Sistema"
                  >
                    Data / Tempo de Parceria {renderSortIndicator('sinceDate')}
                  </button>
                </div>

                <div className="flex items-center gap-4 shrink-0 pr-2">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 font-semibold text-gray-300 hover:text-seguranca-yellow transition-colors group"
                  >
                    Status {renderSortIndicator('status')}
                  </button>
                  <span className="font-semibold text-gray-400">Ações</span>
                </div>
              </div>

              {loading && suppliers.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <RefreshCw size={28} className="animate-spin text-seguranca-yellow" />
                  <p className="text-sm">Carregando base de fornecedores...</p>
                </div>
              ) : filteredAndSorted.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <p className="text-base font-medium text-gray-300">Nenhum fornecedor encontrado.</p>
                  {search && (
                    <p className="text-xs mt-1 text-gray-500">
                      Tente buscar por outros termos ou limpe os filtros de pesquisa.
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-800 p-2">
                  {visibleSuppliers.map(s => {
                    const docType = getDocType(s);
                    const metrics = supplierMetricsMap.get(s.id);
                    const tenure = formatTempoParceria(s.sinceDate || s.createdAt);
                    const isSelected = selectedIds.has(s.id);

                    return (
                      <div
                        key={s.id}
                        className={`py-3.5 px-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg transition-colors ${
                          isSelected ? 'bg-seguranca-yellow/10 border border-seguranca-yellow/30' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Checkbox + Informações */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleSelectSupplier(s.id)}
                            className="mt-1 text-gray-400 hover:text-seguranca-yellow transition-colors shrink-0"
                            title={isSelected ? 'Desmarcar' : 'Selecionar para exclusão em massa'}
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-seguranca-yellow" />
                            ) : (
                              <Square size={18} className="text-gray-500 hover:text-gray-300" />
                            )}
                          </button>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white tracking-wide text-sm truncate">
                                {s.name}
                              </span>

                              {/* Badge PF vs PJ */}
                              {docType === 'PF' ? (
                                <Badge className="bg-purple-950/60 text-purple-300 border border-purple-500/40 text-[10px] py-0 px-1.5">
                                  Pessoa Física (CPF)
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-950/60 text-blue-300 border border-blue-500/40 text-[10px] py-0 px-1.5">
                                  Pessoa Jurídica (CNPJ)
                                </Badge>
                              )}

                              {/* Status Ativo / Inativo */}
                              {s.isActive === false ? (
                                <Badge variant="destructive" className="text-[10px] uppercase tracking-wider py-0 px-1.5">
                                  Inativo
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-emerald-400 border-emerald-500/40 py-0 px-1.5 bg-emerald-950/20"
                                >
                                  Ativo
                                </Badge>
                              )}

                              {s.category && (
                                <span className="text-[11px] text-gray-400 bg-slate-800 px-2 py-0.5 rounded border border-gray-700">
                                  {s.category}
                                </span>
                              )}
                            </div>

                            {/* Documento, Contato, Localização e Data de Cadastro */}
                            <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-gray-300">{s.cnpj || 'Sem Documento'}</span>
                              {s.cnpj && (
                                <button
                                  onClick={() => copyDoc(s.cnpj!, docType)}
                                  className="text-gray-500 hover:text-seguranca-yellow transition-colors"
                                  title={`Copiar ${docType}`}
                                >
                                  <Copy size={11} />
                                </button>
                              )}
                              <span>•</span>
                              <span>
                                {s.city || '—'}
                                {s.state ? ` - ${s.state}` : ''}
                              </span>

                              {s.contactName && (
                                <>
                                  <span>•</span>
                                  <span className="text-gray-300">Contato: {s.contactName}</span>
                                </>
                              )}

                              {tenure && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-400/90 flex items-center gap-1" title={s.sinceDate ? `Data de Parceria: ${formatDateDisplay(s.sinceDate)}` : `Criado no sistema em: ${formatDateDisplay(s.createdAt)}`}>
                                    <Clock size={11} /> {tenure.text} de parceria
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Resumo de Compras e Veículos */}
                            {metrics && (metrics.orderCount > 0 || metrics.quoteCount > 0) && (
                              <div className="text-[11px] text-gray-400 flex items-center gap-2 flex-wrap pt-0.5">
                                {metrics.totalSpent > 0 && (
                                  <span className="text-emerald-400 font-medium">
                                    {formatCurrency(metrics.totalSpent)} em compras/serviços
                                  </span>
                                )}
                                {metrics.servicedVehicles.size > 0 && (
                                  <span className="text-cyan-400 flex items-center gap-1">
                                    <Truck size={11} /> {metrics.servicedVehicles.size} veículo(s) atendido(s)
                                  </span>
                                )}
                                {metrics.lastOrder && (
                                  <span className="text-gray-400">
                                    Última compra: {formatDateDisplay(metrics.lastOrder.date)} ({metrics.lastOrder.status})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          {/* Botão Editar */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(s)}
                            title="Editar fornecedor"
                            className="bg-slate-850 hover:bg-slate-700 text-gray-200 border-gray-700 h-8 w-8 p-0"
                          >
                            <Edit2 size={14} />
                          </Button>

                          {/* Botão Visualizar 360° */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingSupplier(s)}
                            title="Visualizar detalhes completos 360°"
                            className="bg-slate-850 hover:bg-slate-700 text-gray-200 border-gray-700 h-8 w-8 p-0"
                          >
                            <Eye size={14} />
                          </Button>

                          {/* Botão Excluir */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => promptDeleteSingle(s)}
                            title="Excluir fornecedor"
                            className="bg-red-900/80 hover:bg-red-700 text-white h-8 w-8 p-0"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sentinel de Rolagem Infinita */}
              {hasMore && (
                <div
                  ref={sentinelRef}
                  className="pt-4 pb-3 flex flex-col items-center justify-center gap-2 border-t border-gray-800 bg-slate-900/30"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    className="bg-slate-800 text-gray-300 hover:bg-slate-700 border-gray-700 text-xs"
                  >
                    <ArrowDown size={14} className="mr-1 text-seguranca-yellow" />
                    Carregar mais fornecedores ({filteredAndSorted.length - visibleCount} restantes)
                  </Button>
                  <span className="text-[11px] text-gray-500">
                    Rolando a página, os itens carregam automaticamente
                  </span>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* CONTEÚDO DA ABA: DASHBOARD & RANKING */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Cards de Métricas Gerais do Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="p-4 bg-seguranca-graphite border-gray-700 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Total de Fornecedores</span>
                  <Building2 size={18} className="text-seguranca-yellow" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{stats.total}</span>
                  <span className="text-xs text-emerald-400 font-medium">
                    {stats.active} ativos
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
                  <span className="text-blue-400 font-medium">{stats.pjCount} PJ</span>
                  <span>•</span>
                  <span className="text-purple-400 font-medium">{stats.pfCount} PF</span>
                </div>
              </Card>

              <Card className="p-4 bg-seguranca-graphite border-gray-700 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Volume Total em Compras</span>
                  <DollarSign size={18} className="text-emerald-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(stats.totalSpentGlobal)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  Medição de pagamentos e peças instaladas na frota
                </p>
              </Card>

              <Card className="p-4 bg-seguranca-graphite border-gray-700 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Serviços e O.S. Realizadas</span>
                  <Wrench size={18} className="text-cyan-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">{stats.totalOrdersGlobal}</span>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  Intervenções e ordens executadas por parceiros
                </p>
              </Card>

              <Card className="p-4 bg-seguranca-graphite border-gray-700 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">SLA Médio de Entrega</span>
                  <Timer size={18} className="text-amber-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">~1.5 dias</span>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  Lead time médio entre pedido e entrega / finalização
                </p>
              </Card>
            </div>

            {/* Pódio dos Top 3 Fornecedores */}
            <Card className="p-5 bg-seguranca-graphite border-gray-700 shadow-md">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Award size={18} className="text-seguranca-yellow" />
                    Pódio dos Fornecedores Mais Acionados
                  </h3>
                  <p className="text-xs text-gray-400">
                    Classificados por volume financeiro movimentado e intervenções na frota.
                  </p>
                </div>
                <Badge className="bg-seguranca-yellow text-slate-950 font-bold">
                  Top Performance
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {supplierRanking.slice(0, 3).map((item, idx) => {
                  const medals = ['🥇 1º Lugar', '🥈 2º Lugar', '🥉 3º Lugar'];
                  const borderColors = ['border-amber-500/50', 'border-slate-400/50', 'border-amber-700/50'];
                  const bgGradients = [
                    'bg-gradient-to-b from-amber-500/10 to-transparent',
                    'bg-gradient-to-b from-slate-400/10 to-transparent',
                    'bg-gradient-to-b from-amber-700/10 to-transparent',
                  ];

                  return (
                    <div
                      key={item.supplier.id}
                      className={`p-4 rounded-xl border ${borderColors[idx]} ${bgGradients[idx]} flex flex-col justify-between space-y-3 relative`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-gray-700 text-white">
                          {medals[idx]}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-gray-300 border-gray-700">
                          {item.docType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-base tracking-wide line-clamp-1">
                          {item.supplier.name}
                        </h4>
                        <p className="text-xs font-mono text-gray-400 mt-0.5">
                          {item.supplier.cnpj || 'Sem Documento'}
                        </p>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-lg border border-gray-800 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Pago:</span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(item.totalSpent)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">O.S. / Compras:</span>
                          <span className="text-white font-medium">{item.orderCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Veículos Atendidos:</span>
                          <span className="text-cyan-400 font-medium">{item.vehicleCount} veículo(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tempo de Parceria:</span>
                          <span className="text-amber-300 font-medium">{item.tenure}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingSupplier(item.supplier)}
                        className="w-full bg-slate-800/90 hover:bg-slate-700 text-white border-gray-700 text-xs"
                      >
                        <Eye size={13} className="mr-1.5" /> Ver Visão 360°
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Tabela Completa de Ranking com Cabeçalhos Clicáveis de Ordenação */}
            <Card className="p-5 bg-seguranca-graphite border-gray-700 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-800 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-400" />
                    Tabela Completa de Ranking de Fornecedores
                  </h3>
                  <p className="text-xs text-gray-400">
                    Clique em qualquer cabeçalho de coluna para ordenar por valores ascendentes (ASC), descendentes (DESC) ou datas.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-seguranca-yellow font-medium">
                  <SlidersHorizontal size={13} />
                  <span>
                    Ordenado por <strong className="text-white uppercase">{sortField}</strong> ({sortDirection})
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-300 bg-slate-900/70 select-none">
                      <th className="p-3 font-semibold w-12 text-center">#</th>

                      <th
                        onClick={() => handleSort('name')}
                        className="p-3 font-semibold cursor-pointer hover:text-seguranca-yellow transition-colors group"
                      >
                        <span className="flex items-center">
                          Fornecedor {renderSortIndicator('name')}
                        </span>
                      </th>

                      <th
                        onClick={() => handleSort('docType')}
                        className="p-3 font-semibold cursor-pointer hover:text-seguranca-yellow transition-colors group"
                      >
                        <span className="flex items-center">
                          Tipo / Documento {renderSortIndicator('docType')}
                        </span>
                      </th>

                      <th
                        onClick={() => handleSort('totalSpent')}
                        className="p-3 font-semibold text-right cursor-pointer hover:text-seguranca-yellow transition-colors group"
                      >
                        <span className="flex items-center justify-end">
                          Total Pago (R$) {renderSortIndicator('totalSpent')}
                        </span>
                      </th>

                      <th
                        onClick={() => handleSort('orderCount')}
                        className="p-3 font-semibold text-center cursor-pointer hover:text-seguranca-yellow transition-colors group"
                      >
                        <span className="flex items-center justify-center">
                          Compras / O.S. {renderSortIndicator('orderCount')}
                        </span>
                      </th>

                      <th
                        onClick={() => handleSort('vehicleCount')}
                        className="p-3 font-semibold cursor-pointer hover:text-seguranca-yellow transition-colors group"
                      >
                        <span className="flex items-center">
                          Veículos Atendidos {renderSortIndicator('vehicleCount')}
                        </span>
                      </th>

                      <th
                        onClick={() => handleSort('avgDeliveryDays')}
                        className="p-3 font-semibold cursor-pointer hover:text-seguranca-yellow transition-colors group"
                      >
                        <span className="flex items-center">
                          Tempo de Entrega / SLA {renderSortIndicator('avgDeliveryDays')}
                        </span>
                      </th>

                      <th
                        onClick={() => handleSort('sinceDate')}
                        className="p-3 font-semibold cursor-pointer hover:text-seguranca-yellow transition-colors group"
                        title="Ordenar por Data de Parceria ou Data de Cadastro"
                      >
                        <span className="flex items-center">
                          Tempo de Parceria / Data {renderSortIndicator('sinceDate')}
                        </span>
                      </th>

                      <th className="p-3 font-semibold text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/80">
                    {supplierRanking.map((row, index) => (
                      <tr
                        key={row.supplier.id}
                        className="hover:bg-slate-800/40 transition-colors text-gray-300"
                      >
                        <td className="p-3 font-bold text-seguranca-yellow text-center">
                          #{index + 1}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{row.supplier.name}</div>
                          {row.supplier.tradeName && (
                            <div className="text-[11px] text-gray-400">{row.supplier.tradeName}</div>
                          )}
                          <div className="text-[10px] text-gray-500">
                            {row.supplier.city ? `${row.supplier.city} - ${row.supplier.state || ''}` : 'Local não inf.'}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] py-0 px-1.5 mb-1 ${
                              row.docType === 'PF'
                                ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                                : 'bg-blue-950/60 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {row.docType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </Badge>
                          <div className="font-mono text-gray-400 text-[11px]">
                            {row.supplier.cnpj || '—'}
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-400">
                          {formatCurrency(row.totalSpent)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-white">
                            {row.orderCount}
                          </span>
                        </td>
                        <td className="p-3">
                          {row.vehicles.length > 0 ? (
                            <div className="space-y-0.5">
                              <span className="text-cyan-400 font-medium">
                                {row.vehicles.length} veículo(s)
                              </span>
                              <div className="text-[10px] text-gray-500 truncate max-w-[180px]">
                                {row.vehicles.slice(0, 2).join(', ')}
                                {row.vehicles.length > 2 ? ` (+${row.vehicles.length - 2})` : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-gray-300">
                            <Clock size={12} className="text-amber-400" />
                            {row.avgDeliveryDays} dias (médio)
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-amber-300/90 font-medium text-[11px] block">
                            {row.tenure}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {formatDateDisplay(row.supplier.sinceDate || row.supplier.createdAt)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingSupplier(row.supplier)}
                            className="bg-slate-850 hover:bg-slate-700 text-white border-gray-700 h-7 px-2 text-xs"
                          >
                            <Eye size={12} className="mr-1" /> 360°
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* MODAL RICO DE CONFIRMAÇÃO DE EXCLUSÃO (ÚNICA OU EM MASSA) */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-slate-900 border border-red-500/40 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 shrink-0">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {deleteTarget.type === 'bulk'
                      ? `Confirmar Exclusão em Massa (${deleteTarget.suppliers.length})`
                      : 'Confirmar Exclusão de Fornecedor'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Esta ação é irreversível. Verifique os dados abaixo antes de prosseguir com a remoção permanente.
                  </p>
                </div>
              </div>

              {/* Lista dos fornecedores que serão excluídos */}
              <div className="bg-slate-950/80 border border-gray-800 rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Fornecedor(es) selecionado(s) para remoção:
                </span>
                {deleteTarget.suppliers.map(s => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded bg-slate-900 border border-gray-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{s.name}</span>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 font-mono">
                        <span>{s.cnpj || 'Sem Documento'}</span>
                        <span>•</span>
                        <span>{s.city || 'Sem cidade'}{s.state ? `/${s.state}` : ''}</span>
                      </div>
                    </div>
                    <div>
                      {s.isActive === false ? (
                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5">Inativo</Badge>
                      ) : (
                        <Badge className="bg-emerald-600/80 text-white text-[10px] py-0 px-1.5">Ativo</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Atenção: Ao excluir, registros históricos de compras e ordens associadas podem perder a vinculação nominal direta.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="border-gray-700 text-gray-300 hover:bg-slate-800 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmExecutionDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-lg"
                >
                  {deleting ? (
                    <>
                      <RefreshCw size={14} className="mr-1.5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} className="mr-1.5" />
                      Sim, Confirmar Exclusão
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL RICO DE VISÃO 360° DO FORNECEDOR (EYE BUTTON) */}
        {viewingSupplier && (() => {
          const docType = getDocType(viewingSupplier);
          const metrics = supplierMetricsMap.get(viewingSupplier.id);
          const tenureFromSince = formatTempoParceria(viewingSupplier.sinceDate);
          const tenureFromCreated = formatTempoParceria(viewingSupplier.createdAt);

          return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
              <div className="bg-slate-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
                {/* Header do Fornecedor */}
                <div className="flex items-start justify-between border-b border-gray-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {docType === 'PF' ? (
                          <User size={22} className="text-purple-400" />
                        ) : (
                          <Building2 size={22} className="text-seguranca-yellow" />
                        )}
                        {viewingSupplier.name}
                      </h3>
                      <Badge
                        className={`text-xs py-0.5 px-2 ${
                          docType === 'PF'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                            : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                        }`}
                      >
                        {docType === 'PF' ? 'Pessoa Física (CPF)' : 'Pessoa Jurídica (CNPJ)'}
                      </Badge>
                    </div>

                    {viewingSupplier.tradeName && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Nome Fantasia / Comercial: <strong className="text-gray-200">{viewingSupplier.tradeName}</strong>
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-mono text-gray-300">
                        {viewingSupplier.cnpj || 'Documento não informado'}
                      </span>
                      {viewingSupplier.cnpj && (
                        <button
                          onClick={() => copyDoc(viewingSupplier.cnpj!, docType)}
                          className="text-gray-400 hover:text-seguranca-yellow text-xs flex items-center gap-1"
                          title="Copiar Documento"
                        >
                          <Copy size={12} /> Copiar
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    {viewingSupplier.isActive === false ? (
                      <Badge variant="destructive">Inativo</Badge>
                    ) : (
                      <Badge className="bg-emerald-600 text-white">Ativo</Badge>
                    )}
                  </div>
                </div>

                {/* Tempo de Parceria e Data de Cadastro (Manual e Sistema) */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-amber-400 font-semibold block flex items-center gap-1 mb-1">
                      <Clock size={13} /> Tempo de Parceria (Data Informada)
                    </span>
                    <p className="text-gray-200 font-medium">
                      {tenureFromSince ? (
                        <>
                          <strong className="text-white text-sm">{tenureFromSince.text}</strong> de parceria contínua
                          <span className="block text-[11px] text-gray-400 mt-0.5">
                            Início registrado: {formatDateDisplay(viewingSupplier.sinceDate)}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Data de início manual não preenchida</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-400 font-semibold block flex items-center gap-1 mb-1">
                      <Calendar size={13} /> Cadastro no Sistema FleetManager
                    </span>
                    <p className="text-gray-200 font-medium">
                      {tenureFromCreated ? (
                        <>
                          <strong className="text-white text-sm">{tenureFromCreated.text}</strong> no sistema
                          <span className="block text-[11px] text-gray-400 mt-0.5">
                            Data de criação: {formatDateDisplay(viewingSupplier.createdAt)}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">Recente</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Cards de Contato e Endereço */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-gray-800">
                    <span className="text-gray-400 block font-medium mb-1">Email de Contato</span>
                    {viewingSupplier.email ? (
                      <a href={`mailto:${viewingSupplier.email}`} className="text-blue-400 hover:underline break-all">
                        {viewingSupplier.email}
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-gray-800">
                    <span className="text-gray-400 block font-medium mb-1">Telefone / WhatsApp</span>
                    {viewingSupplier.phone ? (
                      <a href={`tel:${viewingSupplier.phone}`} className="text-emerald-400 hover:underline font-mono">
                        {viewingSupplier.phone}
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-gray-800 sm:col-span-2">
                    <span className="text-gray-400 block font-medium mb-1">Endereço Completo</span>
                    <p className="text-gray-200">
                      {viewingSupplier.address || 'Logradouro não informado'}
                      {viewingSupplier.city && ` - ${viewingSupplier.city}`}
                      {viewingSupplier.state && ` / ${viewingSupplier.state}`}
                      {viewingSupplier.zipCode && ` (CEP: ${viewingSupplier.zipCode})`}
                    </p>
                  </div>

                  {viewingSupplier.contactName && (
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-gray-800">
                      <span className="text-gray-400 block font-medium mb-1">Pessoa de Contato</span>
                      <span className="text-gray-200">{viewingSupplier.contactName}</span>
                    </div>
                  )}

                  {viewingSupplier.category && (
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-gray-800">
                      <span className="text-gray-400 block font-medium mb-1">Categoria de Atuação</span>
                      <span className="text-gray-200">{viewingSupplier.category}</span>
                    </div>
                  )}
                </div>

                {/* Histórico da Última Compra, Cotação e Orçamento */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-seguranca-yellow uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} /> Histórico de Transações, Cotações e Orçamentos
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-gray-800">
                      <span className="text-gray-400 block font-medium mb-1 flex items-center justify-between">
                        <span>Última Compra / Ordem de Serviço</span>
                        {metrics?.lastOrder && (
                          <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30 text-[10px]">
                            {metrics.lastOrder.status}
                          </Badge>
                        )}
                      </span>
                      {metrics?.lastOrder ? (
                        <div className="space-y-0.5 text-gray-300">
                          <p>O.S./Compra: <strong className="text-white">#{metrics.lastOrder.osNumber}</strong></p>
                          <p>Data: <strong>{formatDateDisplay(metrics.lastOrder.date)}</strong></p>
                          <p>Valor: <strong className="text-emerald-400">{formatCurrency(metrics.lastOrder.amount)}</strong></p>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Nenhuma compra ou O.S. vinculada</p>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/70 border border-gray-800">
                      <span className="text-gray-400 block font-medium mb-1 flex items-center justify-between">
                        <span>Última Cotação / Orçamento</span>
                        {metrics?.lastQuote && (
                          <Badge className="bg-blue-950 text-blue-400 border-blue-500/30 text-[10px]">
                            {metrics.lastQuote.status}
                          </Badge>
                        )}
                      </span>
                      {metrics?.lastQuote ? (
                        <div className="space-y-0.5 text-gray-300">
                          <p>Cotação: <strong className="text-white">#{metrics.lastQuote.quoteNumber}</strong></p>
                          <p>Data: <strong>{formatDateDisplay(metrics.lastQuote.date)}</strong></p>
                          <p>Valor: <strong className="text-blue-400">{formatCurrency(metrics.lastQuote.amount)}</strong></p>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Nenhuma cotação registrada</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Veículos da Frota Atendidos */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={14} /> Veículos da Frota Atendidos por este Fornecedor
                  </h4>

                  {metrics && metrics.servicedVehicles.size > 0 ? (
                    <div className="bg-slate-950/80 border border-gray-800 rounded-lg p-3 max-h-36 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {Array.from(metrics.servicedVehicles).map((veh, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-slate-900 border border-gray-800 flex items-center gap-2 text-gray-200"
                          >
                            <Truck size={14} className="text-cyan-400 shrink-0" />
                            <span className="font-mono text-white font-medium">{veh}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-gray-800 text-xs text-gray-500 italic">
                      Nenhum veículo registrado até o momento para este fornecedor.
                    </div>
                  )}
                </div>

                {/* Peças e Serviços Entregues */}
                {metrics && metrics.itemsDelivered.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <PackageCheck size={14} /> Itens e Serviços Executados ({metrics.itemsDelivered.length})
                    </h4>

                    <div className="bg-slate-950/80 border border-gray-800 rounded-lg p-2.5 max-h-40 overflow-y-auto divide-y divide-gray-800 text-xs">
                      {metrics.itemsDelivered.slice(0, 10).map((it, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-medium text-white block">{it.desc}</span>
                            <span className="text-[11px] text-gray-400">
                              {it.type || 'Peça'} • Veículo: {it.plate || 'Geral'} • {formatDateDisplay(it.date)}
                            </span>
                          </div>
                          <span className="font-semibold text-emerald-400 shrink-0">
                            {formatCurrency(it.cost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações */}
                {viewingSupplier.notes && (
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-gray-800 text-xs">
                    <span className="text-gray-400 block font-medium mb-1">Observações Gerais</span>
                    <p className="text-gray-300 italic">{viewingSupplier.notes}</p>
                  </div>
                )}

                {/* Ações Inferiores da Visão 360° */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(viewingSupplier)}
                    className="border-gray-700 text-gray-300 hover:bg-slate-800 text-xs"
                  >
                    {viewingSupplier.isActive ? (
                      <>
                        <ToggleLeft size={16} className="mr-1 text-red-400" /> Desativar Fornecedor
                      </>
                    ) : (
                      <>
                        <ToggleRight size={16} className="mr-1 text-emerald-400" /> Ativar Fornecedor
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const s = viewingSupplier;
                        setViewingSupplier(null);
                        openEdit(s);
                      }}
                      className="bg-slate-800 text-white hover:bg-slate-700 text-xs"
                    >
                      <Edit2 size={13} className="mr-1" /> Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const s = viewingSupplier;
                        promptDeleteSingle(s);
                      }}
                      className="bg-red-800 hover:bg-red-700 text-white text-xs"
                    >
                      <Trash2 size={13} className="mr-1" /> Excluir
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setViewingSupplier(null)}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-xs"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL DE CRIAÇÃO / EDIÇÃO COM SUPORTE COMPLETO PF (CPF) E PJ (CNPJ) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
            <div className="bg-slate-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 size={20} className="text-seguranca-yellow" />
                  {editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </h3>
                <span className="text-xs text-gray-400">* Campos obrigatórios</span>
              </div>

              {/* Seletor de Tipo de Fornecedor: Pessoa Jurídica (CNPJ) vs Pessoa Física (CPF) */}
              <div className="mb-4 bg-slate-950 p-2 rounded-lg border border-gray-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormPersonType('PJ');
                    setForm(prev => ({ ...prev, documentType: 'PJ' }));
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-xs transition-all ${
                    formPersonType === 'PJ'
                      ? 'bg-blue-600 text-white shadow-md font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <Building2 size={15} /> Pessoa Jurídica (CNPJ)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormPersonType('PF');
                    setForm(prev => ({ ...prev, documentType: 'PF' }));
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-xs transition-all ${
                    formPersonType === 'PF'
                      ? 'bg-purple-600 text-white shadow-md font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <User size={15} /> Pessoa Física (CPF)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Campo Documento: CPF ou CNPJ com máscara e busca automática */}
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-300 font-medium mb-1 block">
                    {formPersonType === 'PJ' ? 'CNPJ *' : 'CPF *'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={form.cnpj || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          cnpj: formPersonType === 'PJ' ? formatCnpj(val) : formatCpf(val),
                        });
                      }}
                      className="form-input bg-slate-950 border-gray-700 text-white font-mono"
                      placeholder={formPersonType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    />
                    {formPersonType === 'PJ' && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => buscarDadosCnpj(form.cnpj || '')}
                        disabled={searchingCnpj}
                        className="border-seguranca-yellow/40 text-seguranca-yellow hover:bg-seguranca-yellow/10 shrink-0 text-xs"
                        title="Buscar dados cadastrais automaticamente na Receita"
                      >
                        <Sparkles size={14} className={`mr-1 ${searchingCnpj ? 'animate-spin' : ''}`} />
                        {searchingCnpj ? 'Buscando...' : 'Buscar CNPJ'}
                      </Button>
                    )}
                  </div>
                  {formPersonType === 'PJ' && (
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      Digite o CNPJ e clique em "Buscar CNPJ" para preencher Razão Social, Endereço e Cidade automaticamente.
                    </span>
                  )}
                </div>

                {/* Nome ou Razão Social */}
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-300 font-medium mb-1 block">
                    {formPersonType === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}
                  </label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                    placeholder={
                      formPersonType === 'PJ'
                        ? 'Ex: Auto Peças e Mecânica Silva Ltda'
                        : 'Ex: Carlos Eduardo de Souza'
                    }
                  />
                </div>

                {/* Nome Fantasia ou Apelido */}
                <div>
                  <label className="text-xs text-gray-300 font-medium mb-1 block">
                    {formPersonType === 'PJ' ? 'Nome Fantasia' : 'Nome Comercial / Apelido'}
                  </label>
                  <Input
                    value={form.tradeName || ''}
                    onChange={e => setForm({ ...form, tradeName: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                    placeholder={formPersonType === 'PJ' ? 'Ex: Silva Distribuidora' : 'Ex: Carlos Mecânico'}
                  />
                </div>

                {/* Contato ou Representante */}
                <div>
                  <label className="text-xs text-gray-300 font-medium mb-1 block">
                    {formPersonType === 'PJ' ? 'Representante / Contato' : 'Telefone Secundário / Contato'}
                  </label>
                  <Input
                    value={form.contactName || ''}
                    onChange={e => setForm({ ...form, contactName: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                    placeholder="Nome da pessoa de contato"
                  />
                </div>

                {/* Inscrição Estadual ou RG */}
                <div>
                  <label className="text-xs text-gray-300 font-medium mb-1 block">
                    {formPersonType === 'PJ' ? 'Inscrição Estadual' : 'RG / Inscrição Municipal'}
                  </label>
                  <Input
                    value={form.registrationNumber || ''}
                    onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white font-mono"
                    placeholder="Número de registro / IE"
                  />
                </div>

                {/* Data de Início da Parceria / Cadastro Manual */}
                <div>
                  <label className="text-xs text-gray-300 font-medium mb-1 block">
                    Data de Início da Parceria (Manual)
                  </label>
                  <Input
                    type="date"
                    value={form.sinceDate || ''}
                    onChange={e => setForm({ ...form, sinceDate: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    Permite calcular o tempo de parceria com precisão histórica.
                  </span>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs text-gray-300 font-medium mb-1 block">Email</label>
                  <Input
                    value={form.email || ''}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                    placeholder="contato@fornecedor.com.br"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="text-xs text-gray-300 font-medium mb-1 block">Telefone / WhatsApp</label>
                  <Input
                    value={form.phone || ''}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-300 font-medium mb-1 block">Endereço Completo</label>
                  <Input
                    value={form.address || ''}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                    placeholder="Av. Brasil, 1500 - Galpão 3"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className="text-xs text-gray-300 font-medium mb-1 block">Cidade</label>
                  <Input
                    value={form.city || ''}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                    placeholder="São Paulo"
                  />
                </div>

                {/* UF e CEP */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-300 font-medium mb-1 block">UF</label>
                    <select
                      value={(form.state || '').toUpperCase()}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      className="form-input bg-slate-950 border-gray-700 text-white w-full h-10 rounded-md px-3 text-sm"
                    >
                      <option value="">UF</option>
                      {UFS.map(u => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-300 font-medium mb-1 block">CEP</label>
                    <Input
                      value={form.zipCode || ''}
                      onChange={e => setForm({ ...form, zipCode: e.target.value })}
                      className="form-input bg-slate-950 border-gray-700 text-white font-mono"
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="text-xs text-gray-300 font-medium mb-1 block">Categoria de Serviço/Produto</label>
                  <Input
                    value={form.category || ''}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                    placeholder="Ex: Peças Diesel, Retífica, Pneus, Funilaria"
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="text-xs text-gray-300 font-medium mb-1 block">Observações e Condições</label>
                  <Input
                    value={form.notes || ''}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="form-input bg-slate-950 border-gray-700 text-white"
                    placeholder="Prazos acordados, descontos, chave PIX..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-gray-700 text-gray-300 hover:bg-slate-800 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={save}
                  className="bg-seguranca-red hover:bg-red-700 text-white font-medium px-6 text-xs"
                >
                  {editing ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
}
