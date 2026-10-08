import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  PurchaseRequest,
  CreatePurchaseRequestRequest,
  UpdatePurchaseRequestRequest,
} from '@/services/purchaseRequestService';
import { unitService } from '@/services/unitService';
import { employeeService, Employee } from '@/services/employeeService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { costCenterService, CostCenterDTO } from '@/services/costCenterService';
import inventoryService from '@/services/inventoryService';
import { InventoryItem } from '@/types/inventory';
import { fleetWorkOrderService, FleetWorkOrder, WorkOrderItem } from '@/services/fleetWorkOrderService';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import CurrencyInput from 'react-currency-input-field';
import {
  ShoppingCart, FileText, Package, Trash2, Plus, Search,
  Building2, CheckCircle, ChevronDown, ChevronUp, Info,
  Wrench, Car, AlertTriangle, BarChart3, X, Check,
  ListChecks, ChevronRight, Loader2, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormItem {
  _tempId: string;
  inventoryItemId?: string;
  fromOsId?: string;
  fromOsNumber?: string;
  itemName: string;
  description?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  brand?: string;
  model?: string;
  priority: string;
  urgency: string;
  justification?: string;
  currentStock?: number;
  minimumStock?: number;
  stockStatus?: string;
}

interface SelectedOS {
  os: FleetWorkOrder;
  parts: WorkOrderItem[];            // only PART items
  checkedItems: Set<string>;         // item ids selected by user
}

interface PurchaseRequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: PurchaseRequest;
  onSave: (data: CreatePurchaseRequestRequest | UpdatePurchaseRequestRequest) => Promise<void>;
  loading?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STOCK_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  OUT_OF_STOCK: { label: 'Sem estoque', dot: 'bg-red-500',    text: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/25' },
  LOW_STOCK:    { label: 'Baixo',       dot: 'bg-amber-400',  text: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/25' },
  OK:           { label: 'OK',          dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' },
};

function stockStatus(item: InventoryItem) {
  if (item.quantity === 0) return 'OUT_OF_STOCK';
  if (item.quantity <= item.minimumQuantity) return 'LOW_STOCK';
  return 'OK';
}

const INPUT_CLS  = 'bg-[#1e2128] border-gray-700/50 text-gray-100 placeholder:text-gray-600 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 h-10 transition-all';
const LABEL_CLS  = 'text-[0.8rem] font-medium text-gray-400 tracking-wide';
const SEL_TRG    = 'bg-[#1e2128] border-gray-700/50 text-gray-200 focus:border-red-500/60 h-10 text-sm';
const SEL_CNT    = 'bg-[#252932] border-gray-700/50 shadow-xl text-gray-200';
const SEL_ITM    = 'text-gray-200 focus:bg-red-600/20 focus:text-white cursor-pointer text-sm';

// ── Wizard steps ──────────────────────────────────────────────────────────────
type Step = 'os-select' | 'items' | 'details';

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'os-select', label: 'Ordens de Serviço', icon: <Wrench className="h-4 w-4" /> },
  { id: 'items',     label: 'Itens',             icon: <Package className="h-4 w-4" /> },
  { id: 'details',   label: 'Detalhes',          icon: <FileText className="h-4 w-4" /> },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function PurchaseRequestFormModal({
  isOpen, onClose, request, onSave, loading,
}: PurchaseRequestFormModalProps) {
  const { toast } = useToast();
  const isSubmitting = useRef(false);

  // Wizard
  const [step, setStep] = useState<Step>(request ? 'details' : 'os-select');

  // Reference data
  const [units, setUnits]           = useState<any[]>([]);
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterDTO[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);

  // Loading states
  const [loadingOS, setLoadingOS]   = useState(false);
  const [loadingInv, setLoadingInv] = useState(false);

  // OS selection
  const [osSearch, setOsSearch]         = useState('');
  const [selectedOSList, setSelectedOSList] = useState<SelectedOS[]>([]);

  // Form items
  const [formItems, setFormItems] = useState<FormItem[]>([]);
  const [invSearch, setInvSearch]   = useState('');
  const [showInvPicker, setShowInvPicker] = useState(false);

  // Supplier modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Filter search terms
  const [supplierSearch, setSupplierSearch]   = useState('');
  const [empSearch, setEmpSearch]             = useState('');
  const [reqSearch, setReqSearch]             = useState('');
  const [deptSearch, setDeptSearch]           = useState('');

  // Request number (auto)
  const [requestNumber, setRequestNumber] = useState('');
  const [estimatedDisplay, setEstimatedDisplay] = useState('');

  const [formData, setFormData] = useState<CreatePurchaseRequestRequest>({
    title: '', description: '', priority: 'MEDIUM', status: 'DRAFT',
    requesterName: '', department: '', justification: '', estimatedTotal: 0,
    urgency: 'NORMAL', requiredDate: '', approvedBy: '', approvalNotes: '',
    supplier: '', paymentMethod: '', installments: undefined,
    deliveryMethod: '', deliveryAddress: '',
    contactPerson: '', contactPhone: '', contactEmail: '',
    notes: '', unitId: '', requesterId: '', approverId: '',
  });

  // ── Reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    isSubmitting.current = false;
    setStep(request ? 'details' : 'os-select');
    setSelectedOSList([]);
    setInvSearch('');
    setShowInvPicker(false);

    loadReferenceData();

    if (request) {
      setRequestNumber(request.requestNumber || '');
      const tot = normalizeNum(request.estimatedTotal);
      setFormData({
        ...request as any,
        requiredDate: fmtDate(request.requiredDate),
        requesterId:  request.requesterId ? String(request.requesterId) : '',
        approverId:   request.approverId  ? String(request.approverId)  : '',
        unitId:       request.unitId      ? String(request.unitId)      : '',
      });
      setEstimatedDisplay(tot ? tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
      setFormItems((request.items || []).map(it => ({
        _tempId: tempId(),
        itemName: it.itemName, description: it.description,
        unit: it.unit, quantity: it.quantity,
        unitPrice: it.unitPrice, totalPrice: it.totalPrice,
        brand: it.brand, model: it.model,
        priority: it.priority || 'MEDIUM', urgency: it.urgency || 'NORMAL',
        justification: it.justification,
        currentStock: it.currentStock, minimumStock: it.minimumStock,
        stockStatus: it.stockStatus,
      })));
    } else {
      setRequestNumber('');
      setEstimatedDisplay('');
      setFormItems([]);
      setFormData({
        title: '', description: '', priority: 'MEDIUM', status: 'DRAFT',
        requesterName: '', department: '', justification: '', estimatedTotal: 0,
        urgency: 'NORMAL', requiredDate: '', approvedBy: '', approvalNotes: '',
        supplier: '', paymentMethod: '', installments: undefined,
        deliveryMethod: '', deliveryAddress: '',
        contactPerson: '', contactPhone: '', contactEmail: '',
        notes: '', unitId: '', requesterId: '', approverId: '',
      });
    }
  }, [isOpen, request?.id]);

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadReferenceData = async () => {
    try {
      const u = await unitService.getAllUnits();
      setUnits(Array.isArray(u) ? u : []);
    } catch { /* silent */ }
    try {
      const emp = await employeeService.getAllEmployees();
      setEmployees(Array.isArray(emp) ? emp : []);
    } catch { /* silent */ }
    try {
      const sup = await contasAPagarService.getFornecedores();
      setSuppliers(Array.isArray(sup) ? sup : []);
    } catch { /* silent */ }
    try {
      const cc = await costCenterService.listActive();
      setCostCenters(Array.isArray(cc) ? cc : []);
    } catch { /* silent */ }

    setLoadingInv(true);
    try {
      const inv = await inventoryService.getAllInventoryItems();
      setInventoryItems(Array.isArray(inv) ? inv : (inv as any)?.content || []);
    } catch {
      setInventoryItems([]);
    } finally {
      setLoadingInv(false);
    }

    setLoadingOS(true);
    try {
      const os = await fleetWorkOrderService.findAll();
      setWorkOrders(Array.isArray(os) ? os : []);
    } catch {
      setWorkOrders([]);
    } finally {
      setLoadingOS(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const tempId = () => `_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const normalizeNum = (v: any): number => typeof v === 'number' ? v : parseFloat(String(v || '0').replace(/\./g, '').replace(',', '.')) || 0;
  const fmtDate = (d?: string) => !d ? '' : d.includes('T') ? d.split('T')[0] : d.length === 10 ? d : d;

  const itemsTotal = formItems.reduce((s, it) => s + ((it.quantity || 0) * (it.unitPrice || 0)), 0);

  // ── OS selection ──────────────────────────────────────────────────────────
  const filteredOS = workOrders.filter(os => {
    const q = osSearch.toLowerCase();
    return (
      os.osNumber?.toLowerCase().includes(q) ||
      os.vehiclePlate?.toLowerCase().includes(q) ||
      os.vehicleModel?.toLowerCase().includes(q) ||
      os.clientName?.toLowerCase().includes(q) ||
      os.mechanicName?.toLowerCase().includes(q)
    );
  });

  const isOsSelected = (id: string) => selectedOSList.some(s => s.os.id === id);

  const toggleOS = (os: FleetWorkOrder) => {
    if (isOsSelected(os.id)) {
      setSelectedOSList(prev => prev.filter(s => s.os.id !== os.id));
    } else {
      const parts = (os.items || []).filter(it => it.type === 'PART');
      setSelectedOSList(prev => [...prev, {
        os,
        parts,
        checkedItems: new Set(parts.map(p => p.id || tempId())),
      }]);
    }
  };

  const toggleOSItem = (osId: string, itemId: string) => {
    setSelectedOSList(prev => prev.map(s => {
      if (s.os.id !== osId) return s;
      const next = new Set(s.checkedItems);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return { ...s, checkedItems: next };
    }));
  };

  const addOSItemsToRequest = () => {
    const newItems: FormItem[] = [];
    for (const sel of selectedOSList) {
      for (const part of sel.parts) {
        const partId = part.id || '';
        if (!sel.checkedItems.has(partId)) continue;
        // Check if already in formItems
        const exists = formItems.some(fi => fi.fromOsId === sel.os.id && fi.itemName === part.description);
        if (exists) continue;

        // Match inventory
        const inv = inventoryItems.find(iv =>
          iv.name.toLowerCase().includes(part.description.toLowerCase()) ||
          part.description.toLowerCase().includes(iv.name.toLowerCase())
        );
        const ss = inv ? stockStatus(inv) : undefined;

        newItems.push({
          _tempId: tempId(),
          fromOsId: sel.os.id,
          fromOsNumber: sel.os.osNumber,
          inventoryItemId: inv?.id,
          itemName: part.description,
          description: `O.S. ${sel.os.osNumber} | ${sel.os.vehiclePlate || ''} ${sel.os.vehicleModel || ''}`.trim(),
          unit: 'UN',
          quantity: Number(part.quantity) || 1,
          unitPrice: part.unitPrice || inv?.unitPrice || 0,
          totalPrice: (Number(part.quantity) || 1) * (part.unitPrice || inv?.unitPrice || 0),
          brand: inv?.brand,
          model: inv?.model,
          priority: 'MEDIUM',
          urgency: 'NORMAL',
          justification: `Necessário para O.S. ${sel.os.osNumber} - ${sel.os.vehiclePlate || ''}`,
          currentStock: inv?.quantity,
          minimumStock: inv?.minimumQuantity,
          stockStatus: ss,
        });
      }
    }

    if (newItems.length === 0) {
      toast({ title: 'Nenhum item novo', description: 'Os itens selecionados já estão na lista.' });
      return;
    }

    setFormItems(prev => [...prev, ...newItems]);
    // Auto-fill title
    if (!formData.title && selectedOSList.length > 0) {
      const osNumbers = selectedOSList.map(s => s.os.osNumber).join(', ');
      handleInput('title', `Compra para OS: ${osNumbers}`);
      handleInput('justification', `Itens necessários para as Ordens de Serviço: ${osNumbers}`);
    }
    setStep('items');
    toast({ title: `${newItems.length} item(s) adicionado(s)`, description: 'Revise os itens antes de finalizar.' });
  };

  // ── Inventory picker ──────────────────────────────────────────────────────
  const filteredInv = inventoryItems.filter(iv =>
    iv.name.toLowerCase().includes(invSearch.toLowerCase()) ||
    iv.brand?.toLowerCase().includes(invSearch.toLowerCase()) ||
    iv.model?.toLowerCase().includes(invSearch.toLowerCase())
  );

  const addInvItem = (inv: InventoryItem) => {
    const ss = stockStatus(inv);
    setFormItems(prev => [...prev, {
      _tempId: tempId(),
      inventoryItemId: inv.id,
      itemName: inv.name,
      description: inv.description,
      unit: 'UN',
      quantity: 1,
      unitPrice: inv.unitPrice,
      totalPrice: inv.unitPrice,
      brand: inv.brand,
      model: inv.model,
      priority: 'MEDIUM',
      urgency: 'NORMAL',
      currentStock: inv.quantity,
      minimumStock: inv.minimumQuantity,
      stockStatus: ss,
    }]);
    setShowInvPicker(false);
    setInvSearch('');
    toast({ title: 'Item adicionado', description: `"${inv.name}" adicionado.` });
  };

  const addManualItem = () => {
    setFormItems(prev => [...prev, {
      _tempId: tempId(),
      itemName: '', unit: 'UN', quantity: 1, unitPrice: 0,
      priority: 'MEDIUM', urgency: 'NORMAL',
    }]);
  };

  const removeItem = (id: string) => setFormItems(prev => prev.filter(it => it._tempId !== id));

  const updateItem = (id: string, field: keyof FormItem, value: any) => {
    setFormItems(prev => prev.map(it => {
      if (it._tempId !== id) return it;
      const u = { ...it, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        u.totalPrice = (Number(u.quantity) || 0) * (Number(u.unitPrice) || 0);
      }
      return u;
    }));
  };

  // ── Form helpers ──────────────────────────────────────────────────────────
  const handleInput = (f: keyof CreatePurchaseRequestRequest, v: any) =>
    setFormData(prev => ({ ...prev, [f]: v }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      const d = { ...formData };
      if (d.requiredDate && d.requiredDate.length === 10) d.requiredDate += 'T00:00:00';
      if (formItems.length > 0 && !d.estimatedTotal) d.estimatedTotal = itemsTotal;
      d.items = formItems.map(it => ({
        productId: it.inventoryItemId,
        itemName: it.itemName,
        description: it.description,
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: (it.quantity || 0) * (it.unitPrice || 0),
        brand: it.brand,
        model: it.model,
        priority: it.priority,
        urgency: it.urgency,
        justification: it.justification,
        currentStock: it.currentStock,
        minimumStock: it.minimumStock,
        stockStatus: it.stockStatus,
        status: 'PENDING',
      }));
      const saved = await onSave(d);
      if (saved && typeof saved === 'object' && 'requestNumber' in saved) {
        setRequestNumber((saved as any).requestNumber || '');
      }
    } catch { /* handled by parent */ }
    finally { isSubmitting.current = false; }
  };

  // ── Derived filters ───────────────────────────────────────────────────────
  const filtSup  = suppliers.filter(s   => !!s.name && s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  const filtEmp  = employees.filter(e   => !!e.name && e.name.toLowerCase().includes(empSearch.toLowerCase()));
  const filtReq  = employees.filter(e   => !!e.name && e.name.toLowerCase().includes(reqSearch.toLowerCase()));
  const filtDept = costCenters.filter(cc => !!cc.name && cc.name.toLowerCase().includes(deptSearch.toLowerCase()));

  // ── Stepbar ───────────────────────────────────────────────────────────────
  const renderStepBar = () => (
    <div className="flex items-center gap-0 px-6 py-3 bg-[#0f1117] border-b border-gray-800/60">
      {STEPS.map((s, i) => {
        const active  = step === s.id;
        const done    = STEPS.findIndex(x => x.id === step) > i;
        return (
          <React.Fragment key={s.id}>
            <button
              type="button"
              disabled={!request && step === 'os-select' && s.id !== 'os-select'}
              onClick={() => (request || done || active) && setStep(s.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                active  ? 'bg-red-600/20 text-red-300 border border-red-500/30' :
                done    ? 'text-gray-400 hover:text-gray-200 cursor-pointer' :
                          'text-gray-600 cursor-not-allowed'
              )}
            >
              <span className={cn('p-0.5 rounded-full', active ? 'text-red-400' : done ? 'text-emerald-400' : 'text-gray-600')}>
                {done ? <Check className="h-3.5 w-3.5" /> : s.icon}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className={cn('h-3.5 w-3.5 mx-1', done ? 'text-gray-500' : 'text-gray-700')} />
            )}
          </React.Fragment>
        );
      })}

      <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
        {formItems.length > 0 && (
          <span className="bg-gray-800 rounded-full px-2 py-0.5">
            {formItems.length} item(s) ·{' '}
            <span className="text-emerald-400 font-semibold">
              R$ {itemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </span>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — OS Selection
  // ─────────────────────────────────────────────────────────────────────────
  const renderStepOS = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-100 font-semibold text-base">Selecionar Ordens de Serviço</h3>
          <p className="text-gray-500 text-xs mt-0.5">Selecione as OS que têm peças a comprar. Itens sem estoque serão marcados automaticamente.</p>
        </div>
        <Button type="button" variant="outline" size="sm"
          onClick={() => { setSelectedOSList([]); setStep('items'); }}
          className="border-gray-700 text-gray-400 hover:text-gray-200 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Sem OS
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
        <Input value={osSearch} onChange={e => setOsSearch(e.target.value)}
          placeholder="Buscar OS por número, placa, veículo, cliente..."
          className="pl-9 bg-[#1e2128] border-gray-700/50 text-gray-100 placeholder:text-gray-600 h-10 text-sm" />
      </div>

      {/* OS list */}
      {loadingOS ? (
        <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando ordens de serviço...
        </div>
      ) : filteredOS.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <Wrench className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Nenhuma OS encontrada</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
          {filteredOS.map(os => {
            const sel  = isOsSelected(os.id);
            const selData = selectedOSList.find(s => s.os.id === os.id);
            const parts = (os.items || []).filter(it => it.type === 'PART');
            const partsWithoutStock = parts.filter(p => {
              const inv = inventoryItems.find(iv =>
                iv.name.toLowerCase().includes(p.description.toLowerCase()) ||
                p.description.toLowerCase().includes(iv.name.toLowerCase())
              );
              return !inv || inv.quantity < Number(p.quantity);
            });

            return (
              <div key={os.id}
                className={cn(
                  'rounded-xl border transition-all overflow-hidden',
                  sel ? 'border-red-500/40 bg-red-500/5' : 'border-gray-700/40 bg-[#1e2128] hover:border-gray-600/60'
                )}>
                {/* OS header */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => toggleOS(os)}>
                  <Checkbox checked={sel} className="border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-100">{os.osNumber || os.id.slice(0, 8)}</span>
                      {os.vehiclePlate && (
                        <span className="text-xs bg-gray-700/60 text-gray-300 px-2 py-0.5 rounded flex items-center gap-1">
                          <Car className="h-3 w-3" />{os.vehiclePlate}
                        </span>
                      )}
                      {os.status && (
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border', {
                          'bg-blue-500/15 text-blue-400 border-blue-500/30':  os.status === 'IN_PROGRESS',
                          'bg-amber-500/15 text-amber-400 border-amber-500/30': os.status === 'WAITING_PARTS',
                          'bg-gray-500/15 text-gray-400 border-gray-500/30': os.status === 'OPEN',
                        })}>
                          {os.status === 'IN_PROGRESS' ? 'Em andamento' : os.status === 'WAITING_PARTS' ? 'Aguardando peças' : os.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {os.vehicleModel && <span>{os.vehicleModel}</span>}
                      {os.clientName   && <span>· {os.clientName}</span>}
                      {os.mechanicName && <span>· {os.mechanicName}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-500">{parts.length} peça(s)</div>
                    {partsWithoutStock.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-400 justify-end mt-0.5">
                        <AlertTriangle className="h-3 w-3" />
                        {partsWithoutStock.length} sem estoque
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected OS — item checklist */}
                {sel && selData && selData.parts.length > 0 && (
                  <div className="border-t border-gray-700/30 bg-[#16191f] px-4 py-3 space-y-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Selecionar peças</p>
                    {selData.parts.map(part => {
                      const pid = part.id || part.description;
                      const inv = inventoryItems.find(iv =>
                        iv.name.toLowerCase().includes(part.description.toLowerCase()) ||
                        part.description.toLowerCase().includes(iv.name.toLowerCase())
                      );
                      const enough = inv && inv.quantity >= Number(part.quantity);
                      const ss     = inv ? stockStatus(inv) : undefined;
                      const cfg    = ss ? STOCK_CFG[ss] : null;

                      return (
                        <div key={pid}
                          className="flex items-center gap-3 py-1.5 cursor-pointer"
                          onClick={() => toggleOSItem(os.id, pid)}>
                          <Checkbox
                            checked={selData.checkedItems.has(pid)}
                            className="border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-200 truncate">{part.description}</span>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                              <span>Qtd: <b className="text-gray-300">{part.quantity}</b></span>
                              {inv && <span>Estoque: <b className={cn(cfg?.text)}>{inv.quantity}</b></span>}
                              {part.unitPrice ? <span>R$ {part.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> : null}
                            </div>
                          </div>
                          {cfg && (
                            <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border shrink-0', cfg.bg, cfg.text)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                              {cfg.label}
                            </span>
                          )}
                          {!inv && (
                            <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700/40 shrink-0">
                              Não cadastrado
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {selData.parts.length === 0 && (
                      <p className="text-xs text-gray-600">Nenhuma peça (PART) nesta OS</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
        <span className="text-xs text-gray-500">
          {selectedOSList.length > 0
            ? `${selectedOSList.length} OS selecionada(s)`
            : 'Nenhuma OS selecionada'}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}
            className="border-gray-700 text-gray-400 hover:text-gray-200 text-sm">
            Cancelar
          </Button>
          <Button type="button"
            onClick={() => {
              if (selectedOSList.length === 0) { setStep('items'); return; }
              addOSItemsToRequest();
            }}
            className="bg-red-700 hover:bg-red-600 text-white text-sm px-5 gap-2">
            {selectedOSList.length > 0 ? (
              <><ListChecks className="h-4 w-4" /> Adicionar Itens</>
            ) : (
              <>Próximo <ChevronRight className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Items Review
  // ─────────────────────────────────────────────────────────────────────────
  const renderStepItems = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-100 font-semibold text-base">Itens da Requisição</h3>
          <p className="text-gray-500 text-xs mt-0.5">Revise quantidades e preços. Você pode adicionar mais itens do estoque ou manualmente.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline"
            onClick={addManualItem}
            className="h-8 text-xs border-gray-700/60 text-gray-400 hover:text-white gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Manual
          </Button>
          <Button type="button" size="sm"
            onClick={() => setShowInvPicker(p => !p)}
            className="h-8 text-xs bg-red-600/15 hover:bg-red-600/25 text-red-300 border border-red-500/25 gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Estoque
            {showInvPicker ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Inventory picker */}
      {showInvPicker && (
        <div className="rounded-xl border border-red-500/20 bg-[#1e2128] p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
            <Input value={invSearch} onChange={e => setInvSearch(e.target.value)}
              placeholder="Buscar por nome, marca, modelo..."
              className="pl-9 bg-[#16191f] border-gray-700/50 text-gray-100 placeholder:text-gray-600 h-9 text-sm" />
          </div>
          {loadingInv ? (
            <div className="flex justify-center py-4 text-gray-500 text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredInv.length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-4">Nenhum item encontrado</p>
              ) : filteredInv.map(iv => {
                const ss  = stockStatus(iv);
                const cfg = STOCK_CFG[ss];
                return (
                  <button key={iv.id} type="button" onClick={() => addInvItem(iv)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#252932] border border-gray-700/30 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-left group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-200 truncate">{iv.name}</span>
                        {iv.brand && <span className="text-xs text-gray-600">{iv.brand}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Qtd: <span className={cn('font-semibold', cfg.text)}>{iv.quantity}</span>
                        {iv.unitPrice > 0 && <span className="ml-3">R$ {iv.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                      </div>
                    </div>
                    <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border shrink-0', cfg.bg, cfg.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </span>
                    <Plus className="h-4 w-4 text-gray-600 group-hover:text-red-400 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      {formItems.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Nenhum item adicionado</p>
          <p className="text-xs mt-1">Volte para selecionar OS, adicione do estoque ou adicione manualmente</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {formItems.map((it, idx) => {
            const cfg = it.stockStatus ? STOCK_CFG[it.stockStatus] : null;
            return (
              <div key={it._tempId} className="rounded-xl border border-gray-700/40 bg-[#1e2128] overflow-hidden">
                {/* Item top row */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#252932] border-b border-gray-700/20">
                  <span className="text-xs text-gray-600 font-bold w-5 text-center">{idx + 1}</span>
                  <Input
                    value={it.itemName}
                    onChange={e => updateItem(it._tempId, 'itemName', e.target.value)}
                    placeholder="Nome do item *"
                    className="flex-1 bg-transparent border-none text-gray-100 font-medium text-sm h-7 p-0 focus:ring-0 placeholder:text-gray-700" />
                  <div className="flex items-center gap-2 shrink-0">
                    {it.fromOsNumber && (
                      <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded border border-gray-700/40">
                        OS {it.fromOsNumber}
                      </span>
                    )}
                    {cfg && (
                      <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border', cfg.bg, cfg.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />{cfg.label}
                      </span>
                    )}
                    <button type="button" onClick={() => removeItem(it._tempId)}
                      className="p-1 rounded hover:bg-red-500/15 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {/* Fields grid */}
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[0.7rem] text-gray-600">Qtd. *</Label>
                    <Input type="number" min={1} value={it.quantity}
                      onChange={e => updateItem(it._tempId, 'quantity', Number(e.target.value))}
                      className="bg-[#16191f] border-gray-700/40 text-gray-100 h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[0.7rem] text-gray-600">Unidade</Label>
                    <Input value={it.unit || ''} onChange={e => updateItem(it._tempId, 'unit', e.target.value)}
                      placeholder="UN" className="bg-[#16191f] border-gray-700/40 text-gray-100 h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[0.7rem] text-gray-600">Preço unit.</Label>
                    <Input type="number" min={0} step={0.01} value={it.unitPrice || ''}
                      onChange={e => updateItem(it._tempId, 'unitPrice', Number(e.target.value))}
                      placeholder="0,00" className="bg-[#16191f] border-gray-700/40 text-gray-100 h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[0.7rem] text-gray-600">Total</Label>
                    <div className="h-8 flex items-center px-3 bg-[#16191f]/60 border border-gray-700/30 rounded-md text-xs text-emerald-400 font-bold">
                      R$ {((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[0.7rem] text-gray-600">Prioridade</Label>
                    <Select value={it.priority} onValueChange={v => updateItem(it._tempId, 'priority', v)}>
                      <SelectTrigger className="bg-[#16191f] border-gray-700/40 text-gray-200 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#252932] border-gray-700/50">
                        {[['LOW','Baixa'],['MEDIUM','Média'],['HIGH','Alta'],['URGENT','Urgente']].map(([v,l]) => (
                          <SelectItem key={v} value={v} className="text-gray-200 focus:bg-red-600/20 text-xs">{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(it.currentStock !== undefined || it.fromOsNumber) && (
                    <div className="col-span-full text-xs text-gray-600 flex items-center gap-3">
                      {it.currentStock !== undefined && (
                        <span>Estoque atual: <b className={cn(cfg?.text || 'text-gray-400')}>{it.currentStock}</b>{it.minimumStock !== undefined && ` / mín ${it.minimumStock}`}</span>
                      )}
                    </div>
                  )}
                  <div className="col-span-full">
                    <Input value={it.justification || ''} onChange={e => updateItem(it._tempId, 'justification', e.target.value)}
                      placeholder="Justificativa (opcional)"
                      className="bg-[#16191f] border-gray-700/40 text-gray-100 h-8 text-xs placeholder:text-gray-700" />
                  </div>
                </div>
              </div>
            );
          })}
          {/* Summary */}
          <div className="flex justify-between items-center px-4 py-2.5 bg-[#252932] rounded-xl border border-gray-700/40 sticky bottom-0">
            <span className="text-sm text-gray-500">{formItems.length} item(s)</span>
            <span className="text-sm font-bold text-emerald-400">
              Total: R$ {itemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2 border-t border-gray-800/60">
        <Button type="button" variant="outline" onClick={() => setStep('os-select')}
          className="border-gray-700 text-gray-400 hover:text-gray-200 text-sm gap-1.5">
          ← Voltar
        </Button>
        <Button type="button"
          onClick={() => setStep('details')}
          disabled={formItems.length === 0}
          className="bg-red-700 hover:bg-red-600 text-white text-sm px-5 gap-2 disabled:opacity-40">
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Details
  // ─────────────────────────────────────────────────────────────────────────
  const renderStepDetails = () => (
    <div className="space-y-4">
      {/* Basic Info */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Informações Básicas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className={LABEL_CLS}>Título <span className="text-red-400">*</span></Label>
            <Input value={formData.title} onChange={e => handleInput('title', e.target.value)} required
              placeholder="Título da requisição" className={INPUT_CLS} />
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>N° Requisição</Label>
            <Input value={requestNumber || request?.requestNumber || ''} disabled
              placeholder="Automático"
              className="bg-[#1e2128]/50 border-gray-700/40 text-gray-600 h-10 cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Prioridade</Label>
            <Select value={formData.priority} onValueChange={v => handleInput('priority', v)}>
              <SelectTrigger className={SEL_TRG}><SelectValue /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                {[['LOW','Baixa'],['MEDIUM','Média'],['HIGH','Alta'],['URGENT','Urgente']].map(([v,l]) => (
                  <SelectItem key={v} value={v} className={SEL_ITM}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Status</Label>
            <Select value={formData.status} onValueChange={v => handleInput('status', v)}>
              <SelectTrigger className={SEL_TRG}><SelectValue /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                {[['DRAFT','Rascunho'],['SUBMITTED','Enviada'],['APPROVED','Aprovada'],['REJECTED','Rejeitada'],['IN_PROCESS','Em Processo'],['COMPLETED','Concluída'],['CANCELLED','Cancelada']].map(([v,l]) => (
                  <SelectItem key={v} value={v} className={SEL_ITM}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Urgência</Label>
            <Select value={formData.urgency} onValueChange={v => handleInput('urgency', v)}>
              <SelectTrigger className={SEL_TRG}><SelectValue /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                {[['NORMAL','Normal'],['URGENT','Urgente'],['CRITICAL','Crítico']].map(([v,l]) => (
                  <SelectItem key={v} value={v} className={SEL_ITM}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Departamento</Label>
            <Select value={formData.department || ''} onValueChange={v => handleInput('department', v)}>
              <SelectTrigger className={SEL_TRG}><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                <div className="p-2 border-b border-gray-700/40">
                  <Input placeholder="Buscar..." value={deptSearch} onChange={e => setDeptSearch(e.target.value)}
                    className="bg-[#1e2128] border-gray-700/50 text-gray-200 h-7 text-xs" onClick={e => e.stopPropagation()} />
                </div>
                {filtDept.filter(cc => !!cc.name).map(cc => <SelectItem key={cc.id} value={cc.name} className={SEL_ITM}>{cc.code} - {cc.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Solicitante</Label>
            <Select value={formData.requesterId ? String(formData.requesterId) : ''} onValueChange={v => {
              const e = employees.find(x => String(x.id) === v);
              handleInput('requesterId', v); handleInput('requesterName', e?.name || '');
            }}>
              <SelectTrigger className={SEL_TRG}><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                <div className="p-2 border-b border-gray-700/40">
                  <Input placeholder="Buscar..." value={reqSearch} onChange={e => setReqSearch(e.target.value)}
                    className="bg-[#1e2128] border-gray-700/50 text-gray-200 h-7 text-xs" onClick={e => e.stopPropagation()} />
                </div>
                {filtReq.filter(e => !!e.id).map(e => <SelectItem key={e.id} value={String(e.id)} className={SEL_ITM}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Unidade</Label>
            <Select value={formData.unitId ? String(formData.unitId) : ''} onValueChange={v => handleInput('unitId', v)}>
              <SelectTrigger className={SEL_TRG}><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                {units.filter(u => !!u.id).map(u => <SelectItem key={u.id} value={String(u.id)} className={SEL_ITM}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Data Necessária</Label>
            <Input type="date" value={formData.requiredDate} onChange={e => handleInput('requiredDate', e.target.value)}
              className={INPUT_CLS} />
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Valor Estimado</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-semibold z-10">R$</span>
              <CurrencyInput prefix="" decimalSeparator="," groupSeparator="." decimalsLimit={2}
                value={estimatedDisplay}
                onValueChange={(val, _, vals) => {
                  setEstimatedDisplay(val || '');
                  handleInput('estimatedTotal', vals?.floatValue ?? 0);
                }}
                placeholder="0,00"
                className="w-full pl-9 pr-3 h-10 bg-[#1e2128] border border-gray-700/50 text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-red-500/60 text-sm transition-all" />
            </div>
            {formItems.length > 0 && (
              <p className="text-[0.7rem] text-gray-600">
                Total dos itens: <span className="text-emerald-400 font-semibold">R$ {itemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Descrição</Label>
            <Textarea value={formData.description} onChange={e => handleInput('description', e.target.value)}
              placeholder="Descrição da requisição" rows={2}
              className="bg-[#1e2128] border-gray-700/50 text-gray-100 placeholder:text-gray-600 focus:border-red-500/60 resize-none text-sm transition-all" />
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Justificativa</Label>
            <Textarea value={formData.justification} onChange={e => handleInput('justification', e.target.value)}
              placeholder="Justificativa para a compra" rows={2}
              className="bg-[#1e2128] border-gray-700/50 text-gray-100 placeholder:text-gray-600 focus:border-red-500/60 resize-none text-sm transition-all" />
          </div>
        </div>
      </section>

      <Separator className="border-gray-800/60" />

      {/* Supplier */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Fornecedor & Pagamento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className={LABEL_CLS}>Fornecedor</Label>
              <button type="button" onClick={() => setIsSupplierModalOpen(true)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-0.5 transition-colors">
                <Plus className="h-3 w-3" /> Novo
              </button>
            </div>
            <Select value={formData.supplier || ''} onValueChange={v => handleInput('supplier', v)}>
              <SelectTrigger className={SEL_TRG}><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                <div className="p-2 border-b border-gray-700/40">
                  <Input placeholder="Buscar..." value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)}
                    className="bg-[#1e2128] border-gray-700/50 text-gray-200 h-7 text-xs" onClick={e => e.stopPropagation()} />
                </div>
                {filtSup.filter(s => !!s.name).map(s => <SelectItem key={s.id} value={s.name} className={SEL_ITM}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Método de Pagamento</Label>
            <Select value={formData.paymentMethod || ''} onValueChange={v => {
              handleInput('paymentMethod', v);
              if (v !== 'CREDIT_CARD') handleInput('installments', undefined);
            }}>
              <SelectTrigger className={SEL_TRG}><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                {[['PIX','PIX'],['BANK_TRANSFER','Transferência'],['CREDIT_CARD','Cartão Crédito'],['DEBIT_CARD','Cartão Débito'],['CASH','Dinheiro'],['CHECK','Cheque'],['OTHER','Outro']].map(([v,l]) => (
                  <SelectItem key={v} value={v} className={SEL_ITM}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formData.paymentMethod === 'CREDIT_CARD' && (
            <div className="space-y-1.5">
              <Label className={LABEL_CLS}>Parcelas <span className="text-red-400">*</span></Label>
              <Input type="number" min={1} max={24} value={formData.installments || ''}
                onChange={e => handleInput('installments', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="1–24" className={INPUT_CLS} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Método de Entrega</Label>
            <Select value={formData.deliveryMethod || ''} onValueChange={v => handleInput('deliveryMethod', v)}>
              <SelectTrigger className={SEL_TRG}><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                {[['PICKUP','Retirada'],['DELIVERY','Entrega'],['COURIER','Correio'],['TRANSPORT','Transportadora'],['OTHER','Outro']].map(([v,l]) => (
                  <SelectItem key={v} value={v} className={SEL_ITM}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Contato</Label>
            <Input value={formData.contactPerson} onChange={e => handleInput('contactPerson', e.target.value)}
              placeholder="Nome do contato" className={INPUT_CLS} />
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Telefone</Label>
            <Input value={formData.contactPhone} onChange={e => handleInput('contactPhone', e.target.value)}
              placeholder="(00) 00000-0000" className={INPUT_CLS} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className={LABEL_CLS}>Endereço de Entrega</Label>
          <Textarea value={formData.deliveryAddress} onChange={e => handleInput('deliveryAddress', e.target.value)}
            placeholder="Endereço completo para entrega" rows={2}
            className="bg-[#1e2128] border-gray-700/50 text-gray-100 placeholder:text-gray-600 focus:border-red-500/60 resize-none text-sm transition-all" />
        </div>
      </section>

      <Separator className="border-gray-800/60" />

      {/* Approval */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Aprovação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Aprovado Por</Label>
            <Select value={formData.approverId ? String(formData.approverId) : ''} onValueChange={v => {
              const e = employees.find(x => String(x.id) === v);
              handleInput('approverId', v); handleInput('approvedBy', e?.name || '');
            }}>
              <SelectTrigger className={SEL_TRG}><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className={SEL_CNT}>
                <div className="p-2 border-b border-gray-700/40">
                  <Input placeholder="Buscar..." value={empSearch} onChange={e => setEmpSearch(e.target.value)}
                    className="bg-[#1e2128] border-gray-700/50 text-gray-200 h-7 text-xs" onClick={e => e.stopPropagation()} />
                </div>
                {filtEmp.filter(e => !!e.id).map(e => <SelectItem key={e.id} value={String(e.id)} className={SEL_ITM}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>Obs. Aprovação</Label>
            <Textarea value={formData.approvalNotes} onChange={e => handleInput('approvalNotes', e.target.value)}
              rows={2} className="bg-[#1e2128] border-gray-700/50 text-gray-100 placeholder:text-gray-600 focus:border-red-500/60 resize-none text-sm transition-all" />
          </div>
        </div>
      </section>

      <div className="space-y-1.5">
        <Label className={LABEL_CLS}>Observações Adicionais</Label>
        <Textarea value={formData.notes} onChange={e => handleInput('notes', e.target.value)}
          placeholder="Observações gerais" rows={2}
          className="bg-[#1e2128] border-gray-700/50 text-gray-100 placeholder:text-gray-600 focus:border-red-500/60 resize-none text-sm transition-all" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800/60">
        {!request && (
          <Button type="button" variant="outline" onClick={() => setStep('items')}
            className="border-gray-700 text-gray-400 hover:text-gray-200 text-sm gap-1.5">
            ← Itens
          </Button>
        )}
        <div className="flex gap-3 ml-auto">
          <Button type="button" variant="outline" onClick={onClose}
            className="border-gray-700 text-gray-400 hover:text-gray-200 text-sm">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}
            className="bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold shadow-lg shadow-red-900/20 px-6 gap-2 text-sm disabled:opacity-50">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
            ) : request ? 'Atualizar' : 'Criar Requisição'}
          </Button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-w-4xl max-h-[94vh] overflow-hidden bg-[#13161c] border-gray-800/60 p-0 rounded-2xl shadow-2xl flex flex-col">

          {/* Header */}
          <DialogHeader className="relative overflow-hidden shrink-0">
            <div className="px-7 py-5 bg-gradient-to-br from-red-800 via-red-700 to-red-800/70 flex items-center gap-3">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_80%_20%,white,transparent)]" />
              <div className="relative p-2.5 bg-white/15 rounded-xl backdrop-blur-sm ring-1 ring-white/20">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="relative">
                <DialogTitle className="text-white text-lg font-bold tracking-tight">
                  {request ? 'Editar Requisição de Compra' : 'Nova Requisição de Compra'}
                </DialogTitle>
                <DialogDescription className="text-white/65 text-xs mt-0.5">
                  {request
                    ? 'Atualize os dados da requisição'
                    : 'Selecione as OS → revise itens sem estoque → finalize a solicitação'}
                </DialogDescription>
              </div>
              <button type="button" onClick={onClose}
                className="relative ml-auto p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          {/* Stepbar */}
          {!request && renderStepBar()}

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5">
              {step === 'os-select' && renderStepOS()}
              {step === 'items'     && renderStepItems()}
              {step === 'details'   && renderStepDetails()}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isSupplierModalOpen && (
        <SupplierFormModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          supplier={null}
          onSave={async (data) => {
            try {
              await contasAPagarService.createFornecedor(data);
              const sup = await contasAPagarService.getFornecedores();
              setSuppliers(Array.isArray(sup) ? sup : []);
              setIsSupplierModalOpen(false);
              toast({ title: 'Fornecedor criado' });
            } catch {
              toast({ title: 'Erro', description: 'Erro ao criar fornecedor.', variant: 'destructive' });
            }
          }}
        />
      )}
    </>
  );
}