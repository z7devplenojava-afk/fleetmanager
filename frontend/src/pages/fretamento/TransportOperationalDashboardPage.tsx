import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bus,
  Truck,
  Wrench,
  Users,
  ShieldCheck,
  Package,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  Send,
  Building2,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  XCircle,
  HelpCircle,
  Route
} from 'lucide-react';
import { useToast, toast } from '@/hooks/use-toast';
import { fleetService } from '@/services/fleetService';
import { fleetWorkOrderService, type FleetWorkOrder } from '@/services/fleetWorkOrderService';
import { vehicleCleaningService, type VehicleCleaningOrder } from '@/services/vehicleCleaningService';
import { transportMobilizationService } from '@/services/transportMobilizationService';
import { purchaseRequestService, type PurchaseRequest, type CreatePurchaseRequestRequest, type UpdatePurchaseRequestRequest } from '@/services/purchaseRequestService';
import { PurchaseRequestFormModal } from '@/components/compras/PurchaseRequestFormModal';
import { routeService, type Route as RouteType } from '@/services/routeService';
import driverService, { type Driver } from '@/services/driverService';
import { clientService, type Client } from '@/services/clientService';
import type { Vehicle } from '@/types/fleet';
import type { TransportMobilization } from '@/types/mobilization';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getActiveCompanyInfo } from '@/utils/exportUtils';

// Tipagem unificada para o relatório consolidado
interface ConsolidatedFleetRow {
  vehicleId: string;
  plate: string;
  model: string;
  year?: number;
  fleetNumber?: string;
  clientName: string;
  workPostName: string;
  driverName: string;
  driverPhone?: string;
  routeName: string;
  routeShift?: string;
  routeHours?: string;
  operationalStatus: 'DISPONIVEL' | 'EM_ROTA' | 'MANUTENCAO' | 'LIMPEZA' | 'RESERVA' | 'INATIVO';
  isReserve: boolean;
  
  // Dados de Manutenção
  inMaintenance: boolean;
  osNumber?: string;
  stopReason?: string;
  downtimeHours?: number;
  downtimeDays?: number;
  hasPartsPurchase: boolean;
  partsCost: number;
  hasExternalService: boolean;
  externalServiceCost: number;
  maintenanceType?: string;
  
  // Dados de Limpeza / Lavajato
  inCleaning: boolean;
  cleaningStatus?: string;
  cleaningPhase?: string;
  cleaningTimeMinutes?: number;
  
  // Mobilização
  mobilizationStatus?: string;
  isMobilized: boolean;
}

export const TransportOperationalDashboardPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // Dados brutos de cada domínio
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const [cleaningOrders, setCleaningOrders] = useState<VehicleCleaningOrder[]>([]);
  const [mobilizations, setMobilizations] = useState<TransportMobilization[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Filtros do Relatório e Paginação
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedStopFilter, setSelectedStopFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Usuário e Permissões
  const { user } = useAuth();
  const isEncarregado = useMemo(() => {
    const role = (user?.role || '').replace(/^ROLE_/, '').toUpperCase();
    const roles = (user?.roles || []).map((r: any) => (typeof r === 'string' ? r : r?.name || '').replace(/^ROLE_/, '').toUpperCase());
    return role.startsWith('ENCARREGADO_') || roles.some((r: string) => r.startsWith('ENCARREGADO_'));
  }, [user]);

  const canAccessAlmoxarifado = !isEncarregado && user?.permissions?.STOCK_READ !== false;

  useEffect(() => {
    if (!canAccessAlmoxarifado && activeTab === 'requisicao') {
      setActiveTab('dashboard');
    }
  }, [canAccessAlmoxarifado, activeTab]);

  // Formulário da Requisição ao Almoxarifado
  const [reqTitle, setReqTitle] = useState<string>('');
  const [reqVehiclePlate, setReqVehiclePlate] = useState<string>('');
  const [reqWorkPost, setReqWorkPost] = useState<string>('');
  const [reqUrgency, setReqUrgency] = useState<string>('NORMAL');
  const [reqJustification, setReqJustification] = useState<string>('');
  const [reqItems, setReqItems] = useState<Array<{ name: string; quantity: number; unit: string; estimatedPrice: number }>>([
    { name: '', quantity: 1, unit: 'UN', estimatedPrice: 0 }
  ]);
  const [submittingReq, setSubmittingReq] = useState<boolean>(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const handleClosePurchaseModal = useCallback(() => {
    setIsPurchaseModalOpen(false);
  }, []);

  // Carregar dados de todos os serviços
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [
        vList,
        osList,
        clList,
        mobList,
        reqList,
        rList,
        dList,
        cPage
      ] = await Promise.allSettled([
        fleetService.getVehicles(),
        fleetWorkOrderService.getAll(),
        vehicleCleaningService.list(),
        transportMobilizationService.findAll(),
        purchaseRequestService.getAllPurchaseRequests(),
        routeService.findAllRoutes(),
        driverService.getDrivers(),
        clientService.getClients({ size: 100 })
      ]);

      if (vList.status === 'fulfilled') setVehicles(vList.value || []);
      if (osList.status === 'fulfilled') setWorkOrders(osList.value || []);
      if (clList.status === 'fulfilled') setCleaningOrders(clList.value || []);
      if (mobList.status === 'fulfilled') setMobilizations(mobList.value || []);
      if (reqList.status === 'fulfilled') setPurchaseRequests(reqList.value || []);
      if (rList.status === 'fulfilled') setRoutes(rList.value || []);
      if (dList.status === 'fulfilled') setDrivers(dList.value || []);
      if (cPage.status === 'fulfilled') setClients(cPage.value?.content || []);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Erro ao consolidar dados operacionais:', err);
      if (!silent) {
        toast({
          title: 'Erro ao carregar dados',
          description: 'Houve um problema ao sincronizar as informações dos módulos.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Criar requisição via Modal oficial
  const handleSaveModalPurchaseRequest = useCallback(async (requestData: CreatePurchaseRequestRequest | UpdatePurchaseRequestRequest) => {
    try {
      await purchaseRequestService.createPurchaseRequest(requestData as CreatePurchaseRequestRequest);
      toast({
        title: "Requisição Criada!",
        description: "Solicitação enviada ao Almoxarifado com sucesso.",
      });
      setIsPurchaseModalOpen(false);
      await loadData(true);
    } catch (error: any) {
      console.error('Erro ao criar requisição de compra:', error);
      toast({
        title: "Erro ao criar requisição",
        description: error?.response?.data?.message || error?.message || "Não foi possível registrar a requisição.",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 120000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Indexação em mapas para cruzamento instantâneo O(1) de milhares de veículos
  const consolidatedRows = useMemo<ConsolidatedFleetRow[]>(() => {
    if (!vehicles || vehicles.length === 0) return [];

    const osByVehicle = new Map<string, FleetWorkOrder>();
    workOrders.forEach((os) => {
      if (os.status !== 'COMPLETED' && os.status !== 'CANCELLED') {
        if (os.vehicleId) osByVehicle.set(os.vehicleId, os);
        if (os.vehiclePlate) osByVehicle.set(os.vehiclePlate.toUpperCase(), os);
      }
    });

    const cleaningByVehicle = new Map<string, VehicleCleaningOrder>();
    cleaningOrders.forEach((co) => {
      if (co.status !== 'COMPLETED') {
        if (co.vehicleId) cleaningByVehicle.set(co.vehicleId, co);
        if (co.vehiclePlate) cleaningByVehicle.set(co.vehiclePlate.toUpperCase(), co);
      }
    });

    const mobByVehicle = new Map<string, TransportMobilization>();
    mobilizations.forEach((m) => {
      if (m.vehicleId) mobByVehicle.set(m.vehicleId, m);
      if (m.vehiclePlate) mobByVehicle.set(m.vehiclePlate.toUpperCase(), m);
    });

    const driverByName = new Map<string, Driver>();
    drivers.forEach((d) => {
      if (d.name) driverByName.set(d.name.toLowerCase().trim(), d);
    });

    const routeByName = new Map<string, RouteType>();
    routes.forEach((r) => {
      if (r.name) routeByName.set(r.name.toLowerCase().trim(), r);
    });

    const nowTime = Date.now();

    return vehicles.map((v) => {
      const vPlateUpper = v.plate ? v.plate.toUpperCase() : '';
      const activeOS = osByVehicle.get(v.id) || (vPlateUpper ? osByVehicle.get(vPlateUpper) : undefined);
      const activeCleaning = cleaningByVehicle.get(v.id) || (vPlateUpper ? cleaningByVehicle.get(vPlateUpper) : undefined);
      const mob = mobByVehicle.get(v.id) || (vPlateUpper ? mobByVehicle.get(vPlateUpper) : undefined);

      const matchedRoute = v.routeName ? routeByName.get(v.routeName.toLowerCase().trim()) : undefined;
      const assignedDriverName = v.assignedDriver || mob?.driverName || 'Não atribuído';
      const matchedDriver = assignedDriverName !== 'Não atribuído' ? driverByName.get(assignedDriverName.toLowerCase().trim()) : undefined;

      // Custos
      const hasParts = activeOS?.items ? activeOS.items.some((i) => i.type === 'PART' || !i.type) : false;
      const partsCost = activeOS?.partsCost ? Number(activeOS.partsCost) : (
        activeOS?.items
          ?.filter((i) => i.type === 'PART' || !i.type)
          .reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0) || 0
      );

      const hasExtService = activeOS?.laborType === 'EXTERNAL' || (
        activeOS?.items ? activeOS.items.some((i) => i.type === 'LABOR' && i.provider) : false
      );
      const extServiceCost = activeOS?.laborCost ? Number(activeOS.laborCost) : (
        activeOS?.items
          ?.filter((i) => i.type === 'LABOR')
          .reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0) || 0
      );

      // Tempo de Limpeza
      let cleaningMinutes = 0;
      if (activeCleaning && activeCleaning.startedAt) {
        cleaningMinutes = Math.max(0, Math.round((nowTime - new Date(activeCleaning.startedAt).getTime()) / 60000));
      } else if (activeCleaning && activeCleaning.standardTimeMinutes) {
        cleaningMinutes = activeCleaning.standardTimeMinutes;
      }

      // Tempo de Downtime (parada)
      let downtimeHours = activeOS?.downtimeHours || 0;
      let downtimeDays = activeOS?.downtimeDays || 0;
      if (activeOS && !downtimeHours && activeOS.stopDate) {
        const diffMs = nowTime - new Date(activeOS.stopDate).getTime();
        downtimeHours = Math.max(0, Math.round(diffMs / 3600000));
        downtimeDays = Math.floor(downtimeHours / 24);
      }

      // Status operacional derivado
      const isReserve = v.status === 'RESERVED' || (v.notes && v.notes.toLowerCase().includes('reserva')) || false;
      let operationalStatus: ConsolidatedFleetRow['operationalStatus'] = 'DISPONIVEL';

      if (v.status === 'INACTIVE' || v.status === 'BAIXADO' || v.status === 'SOLD') {
        operationalStatus = 'INATIVO';
      } else if (activeOS) {
        operationalStatus = 'MANUTENCAO';
      } else if (activeCleaning) {
        operationalStatus = 'LIMPEZA';
      } else if (isReserve) {
        operationalStatus = 'RESERVA';
      } else if (v.assignedDriver && v.assignedDriver.trim() !== '') {
        operationalStatus = 'EM_ROTA';
      } else {
        operationalStatus = 'DISPONIVEL';
      }

      return {
        vehicleId: v.id,
        plate: v.plate,
        model: v.model,
        year: v.year,
        fleetNumber: v.fleetNumber || v.patrimonyNumber,
        clientName: v.projectName || activeOS?.clientName || mob?.clientName || 'FluxBus Operações',
        workPostName: v.operationName || activeOS?.workPostName || mob?.workPostName || v.garageName || 'Garagem Central',
        driverName: assignedDriverName,
        driverPhone: matchedDriver?.phone,
        routeName: v.routeName || matchedRoute?.name || 'Operação Spot / Turno Geral',
        routeShift: matchedRoute?.shift || 'Turno Integral',
        routeHours: matchedRoute?.executionTime || '06:00 - 18:00',
        operationalStatus,
        isReserve,
        inMaintenance: !!activeOS,
        osNumber: activeOS?.osNumber,
        stopReason: activeOS?.stopReason || activeOS?.anomaliesDescription || activeOS?.otherDescription || 'Em vistoria preventiva',
        downtimeHours,
        downtimeDays,
        hasPartsPurchase: hasParts || (partsCost > 0),
        partsCost,
        hasExternalService: hasExtService || (extServiceCost > 0),
        externalServiceCost: extServiceCost,
        maintenanceType: activeOS?.maintenanceType,
        inCleaning: !!activeCleaning,
        cleaningStatus: activeCleaning?.status,
        cleaningPhase: activeCleaning?.phase || activeCleaning?.currentPhase,
        cleaningTimeMinutes: cleaningMinutes,
        mobilizationStatus: mob?.syncStatus || (mob ? 'MOBILIZADO' : 'EM_PATIO'),
        isMobilized: !!mob
      };
    });
  }, [vehicles, workOrders, cleaningOrders, mobilizations, routes, drivers]);

  // Filtros aplicados sobre as linhas consolidadas
  const filteredRows = useMemo(() => {
    return consolidatedRows.filter((row) => {
      // 1. Busca textual
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        row.plate.toLowerCase().includes(search) ||
        row.model.toLowerCase().includes(search) ||
        row.driverName.toLowerCase().includes(search) ||
        row.clientName.toLowerCase().includes(search) ||
        row.workPostName.toLowerCase().includes(search) ||
        row.routeName.toLowerCase().includes(search) ||
        (row.osNumber && row.osNumber.toLowerCase().includes(search));

      // 2. Filtro Cliente
      const matchesClient =
        selectedClientFilter === 'ALL' ||
        row.clientName.toLowerCase() === selectedClientFilter.toLowerCase();

      // 3. Filtro Status
      const matchesStatus =
        selectedStatusFilter === 'ALL' || row.operationalStatus === selectedStatusFilter;

      // 4. Filtro de Parada / Manutenção / Compras
      let matchesStop = true;
      if (selectedStopFilter === 'MANUTENCAO_PECA') {
        matchesStop = row.inMaintenance && row.hasPartsPurchase;
      } else if (selectedStopFilter === 'MANUTENCAO_EXTERNO') {
        matchesStop = row.inMaintenance && row.hasExternalService;
      } else if (selectedStopFilter === 'LIMPEZA') {
        matchesStop = row.inCleaning;
      } else if (selectedStopFilter === 'RESERVA') {
        matchesStop = row.isReserve;
      }

      return matchesSearch && matchesClient && matchesStatus && matchesStop;
    });
  }, [consolidatedRows, searchTerm, selectedClientFilter, selectedStatusFilter, selectedStopFilter]);

  // Totais do Dashboard
  const metrics = useMemo(() => {
    const total = consolidatedRows.length;
    const disponiveis = consolidatedRows.filter((r) => r.operationalStatus === 'DISPONIVEL').length;
    const emRota = consolidatedRows.filter((r) => r.operationalStatus === 'EM_ROTA').length;
    const manutencao = consolidatedRows.filter((r) => r.operationalStatus === 'MANUTENCAO').length;
    const limpeza = consolidatedRows.filter((r) => r.operationalStatus === 'LIMPEZA').length;
    const reservas = consolidatedRows.filter((r) => r.isReserve).length;
    const mobilizados = consolidatedRows.filter((r) => r.isMobilized).length;
    const totalPartsCost = consolidatedRows.reduce((acc, curr) => acc + curr.partsCost, 0);
    const totalExtCost = consolidatedRows.reduce((acc, curr) => acc + curr.externalServiceCost, 0);

    return {
      total,
      disponiveis,
      emRota,
      manutencao,
      limpeza,
      reservas,
      mobilizados,
      totalPartsCost,
      totalExtCost
    };
  }, [consolidatedRows]);

  // Resumo de Alocação por Cliente / Obra (pré-computado em O(N))
  const clientGroups = useMemo(() => {
    const map = new Map<string, {
      clientName: string;
      workPostName: string;
      total: number;
      inOperation: number;
      inMaintenance: number;
    }>();

    consolidatedRows.forEach((r) => {
      const key = r.clientName || 'FluxBus Operações';
      const existing = map.get(key) || {
        clientName: key,
        workPostName: r.workPostName || 'Geral',
        total: 0,
        inOperation: 0,
        inMaintenance: 0,
      };

      existing.total += 1;
      if (r.operationalStatus === 'EM_ROTA' || r.operationalStatus === 'DISPONIVEL') {
        existing.inOperation += 1;
      }
      if (r.inMaintenance) {
        existing.inMaintenance += 1;
      }
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [consolidatedRows]);

  // Lista única de clientes para dropdown
  const uniqueClients = useMemo(() => {
    return clientGroups.map((c) => c.clientName);
  }, [clientGroups]);

  // Motoristas únicos com veículo
  const driverGroups = useMemo(() => {
    return consolidatedRows
      .filter((r) => r.driverName && r.driverName !== 'Não atribuído')
      .slice(0, 30);
  }, [consolidatedRows]);

  // Total de páginas e linhas paginadas para a tabela do relatório
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Resetar página atual ao alterar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClientFilter, selectedStatusFilter, selectedStopFilter]);

  // Submissão da Requisição de Almoxarifado
  const handleAddReqItem = () => {
    setReqItems([...reqItems, { name: '', quantity: 1, unit: 'UN', estimatedPrice: 0 }]);
  };

  const handleRemoveReqItem = (index: number) => {
    if (reqItems.length <= 1) return;
    setReqItems(reqItems.filter((_, i) => i !== index));
  };

  const handleReqItemChange = (index: number, field: string, value: any) => {
    const updated = [...reqItems];
    updated[index] = { ...updated[index], [field]: value };
    setReqItems(updated);
  };

  const handleSubmitPurchaseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe um título descritivo para a requisição.',
        variant: 'destructive',
      });
      return;
    }

    const validItems = reqItems.filter((i) => i.name.trim() !== '');
    if (validItems.length === 0) {
      toast({
        title: 'Itens obrigatórios',
        description: 'Adicione pelo menos uma peça ou material na requisição.',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingReq(true);
    try {
      const estimatedTotal = validItems.reduce((acc, i) => acc + (i.quantity * i.estimatedPrice), 0);

      const payload: CreatePurchaseRequestRequest = {
        title: reqTitle,
        description: `Requisição solicitada pelo Encarregado de Transporte / Gestor de Tráfego para o veículo ${reqVehiclePlate || 'Geral'} - Obra/Setor: ${reqWorkPost || 'Pátio Central'}. Justificativa: ${reqJustification}`,
        department: 'TRANSPORTE_E_TRAFEGO',
        urgency: reqUrgency,
        priority: reqUrgency,
        justification: reqJustification,
        estimatedTotal,
        items: validItems.map((item) => ({
          itemName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.estimatedPrice,
          totalPrice: item.quantity * item.estimatedPrice,
          description: `Item destinado a frota / tráfego - Veículo: ${reqVehiclePlate || 'N/A'}`
        }))
      };

      await purchaseRequestService.createPurchaseRequest(payload);

      toast({
        title: 'Requisição enviada ao Almoxarifado!',
        description: 'Sua solicitação de compra e peças foi registrada com sucesso.',
      });

      // Limpar formulário
      setReqTitle('');
      setReqVehiclePlate('');
      setReqWorkPost('');
      setReqJustification('');
      setReqItems([{ name: '', quantity: 1, unit: 'UN', estimatedPrice: 0 }]);

      // Recarregar requisições
      const updatedReqs = await purchaseRequestService.getAllPurchaseRequests();
      setPurchaseRequests(updatedReqs);
    } catch (error) {
      console.error('Erro ao enviar requisição ao almoxarifado:', error);
      toast({
        title: 'Erro no envio',
        description: 'Não foi possível cadastrar a requisição. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReq(false);
    }
  };

  // Exportar Relatório em PDF Executivo Corporativo
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const now = new Date();
      const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2); // 277 mm

      const company = getActiveCompanyInfo();
      const companyName = company.nome || 'VIAÇÃO SÃO SILVESTRE S.A.';
      const companyCnpj = company.cnpj ? `CNPJ: ${company.cnpj}` : 'CNPJ: 71.055.644/0001-25';
      const companyAddress = 'Gestão Integrada de Frotas & Operações de Transporte';
      const companySub = `${companyCnpj} • ${companyAddress}`;

      // =========================================================================
      // 1. CABEÇALHO PADRÃO EXECUTIVO DA ORDEM DE SERVIÇO (OS)
      // =========================================================================
      let headerY = 10;

      // Coluna Esquerda: Dados da Empresa
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(33, 37, 41); // #212529
      doc.text(companyName.toUpperCase(), margin, headerY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(companySub, margin, headerY + 9);

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('SISTEMA DE GESTÃO INTEGRADA DE TRÁFEGO & OPERAÇÃO DE TRANSPORTE', margin, headerY + 13.5);

      // Coluna Direita: Título Oficial do Documento e Emissão
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(211, 47, 47); // Vermelho institucional OS (#d32f2f)
      doc.text('RELATÓRIO OPERACIONAL INTEGRADO', pageWidth - margin, headerY + 4, { align: 'right' });

      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text('TRANSPORTE & TRÁFEGO DE FROTA', pageWidth - margin, headerY + 8.5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const dataEmissaoStr = `Emissão: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      doc.text(dataEmissaoStr, pageWidth - margin, headerY + 13, { align: 'right' });

      // Faixa divisória vermelha institucional (marca registrada da OS)
      doc.setDrawColor(211, 47, 47);
      doc.setLineWidth(0.8);
      doc.line(margin, headerY + 16, pageWidth - margin, headerY + 16);

      // Linha fina complementar de acabamento
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(margin, headerY + 17.5, pageWidth - margin, headerY + 17.5);

      // =========================================================================
      // 2. QUADRO RESUMO EXECUTIVO DE INDICADORES (KPIs da Operação)
      // =========================================================================
      const kpiY = headerY + 21;
      const kpiHeight = 16;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, kpiY, contentWidth, kpiHeight, 'F');
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.rect(margin, kpiY, contentWidth, kpiHeight, 'D');

      // Barra vertical indicadora à esquerda (Padrão Seção OS)
      doc.setFillColor(211, 47, 47);
      doc.rect(margin, kpiY, 3, kpiHeight, 'F');

      // Título da Seção de Resumo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(211, 47, 47);
      doc.text('QUADRO DE CONTROLE & STATUS DA FROTA ATIVA', margin + 6, kpiY + 4.8);

      // Grid de Indicadores em Caixas Executivas
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      const colWidth = (contentWidth - 10) / 6;
      const kpiRow1Y = kpiY + 9.5;
      const kpiRow2Y = kpiY + 13.8;

      // Coluna 1
      doc.setFont('helvetica', 'bold');
      doc.text('Frota Total:', margin + 6, kpiRow1Y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(metrics.total), margin + 26, kpiRow1Y);

      doc.setFont('helvetica', 'bold');
      doc.text('Disponíveis:', margin + 6, kpiRow2Y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(metrics.disponiveis), margin + 26, kpiRow2Y);

      // Coluna 2
      const c2X = margin + 6 + colWidth;
      doc.setFont('helvetica', 'bold');
      doc.text('Em Rota / Viagem:', c2X, kpiRow1Y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(metrics.emRota), c2X + 28, kpiRow1Y);

      doc.setFont('helvetica', 'bold');
      doc.text('Veículos Reserva:', c2X, kpiRow2Y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(metrics.reservas), c2X + 28, kpiRow2Y);

      // Coluna 3
      const c3X = margin + 6 + (colWidth * 2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Vermelho alerta
      doc.text('Em Manutenção:', c3X, kpiRow1Y);
      doc.text(String(metrics.manutencao), c3X + 26, kpiRow1Y);

      doc.setTextColor(2, 132, 199); // Azul limpeza
      doc.text('Lavagem / Higiene:', c3X, kpiRow2Y);
      doc.text(String(metrics.limpeza), c3X + 28, kpiRow2Y);

      // Coluna 4 (Valores Financeiros Integrados de Manutenção & Almoxarifado)
      const c4X = margin + 6 + (colWidth * 3.1);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Peças Solicitadas:', c4X, kpiRow1Y);
      doc.setFont('helvetica', 'normal');
      doc.text(`R$ ${metrics.totalPartsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, c4X + 27, kpiRow1Y);

      doc.setFont('helvetica', 'bold');
      doc.text('Serviços Externos:', c4X, kpiRow2Y);
      doc.setFont('helvetica', 'normal');
      doc.text(`R$ ${metrics.totalExtCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, c4X + 27, kpiRow2Y);

      // Coluna 5 (Filtros Ativos / Responsável)
      const c5X = margin + 6 + (colWidth * 4.4);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Filtro Operacional:', c5X, kpiRow1Y);
      doc.setFont('helvetica', 'normal');
      const activeClientName = selectedClientFilter === 'ALL'
        ? 'Todos Clientes / Setores'
        : (clients.find(c => String(c.id) === selectedClientFilter)?.name || `Cliente: ${selectedClientFilter}`);
      doc.text(activeClientName.substring(0, 24), c5X + 28, kpiRow1Y);

      doc.setFont('helvetica', 'bold');
      doc.text('Encarregado / Gestão:', c5X, kpiRow2Y);
      doc.setFont('helvetica', 'normal');
      doc.text('CCO / Tráfego Integrado', c5X + 33, kpiRow2Y);

      // =========================================================================
      // 3. TABELA DE DADOS NO PADRÃO DE ORDEM DE SERVIÇO
      // =========================================================================
      const tableData = filteredRows.map((r) => [
        `${r.plate}\n${r.model}${r.year ? ` (${r.year})` : ''}`,
        `${r.clientName || 'FluxBus Operações'}\n${r.workPostName || 'Garagem Central'}`,
        `${r.driverName || 'Não atribuído'}${r.driverPhone ? `\nTel: ${r.driverPhone}` : ''}`,
        `${r.routeName || 'Operação Spot'}\n${r.routeHours || 'Turno Geral (06:00 - 18:00)'}`,
        r.operationalStatus,
        r.inMaintenance
          ? `OS: ${r.osNumber || 'Ativa'}\nParado: ${r.downtimeDays || 0}d ${r.downtimeHours || 0}h\n${r.stopReason ? r.stopReason.substring(0, 38) + '...' : 'Manutenção Corretiva'}`
          : 'Operação Regular',
        r.hasPartsPurchase ? `Sim\nR$ ${r.partsCost.toFixed(2)}` : 'Não',
        r.hasExternalService ? `Sim\nR$ ${r.externalServiceCost.toFixed(2)}` : 'Não',
        r.inCleaning ? `Em Lavagem\n${r.cleaningPhase || 'Higienização'}` : 'Liberado'
      ]);

      autoTable(doc, {
        startY: kpiY + kpiHeight + 3.5,
        head: [[
          'VEÍCULO / MODELO',
          'CLIENTE / OBRA / SETOR',
          'MOTORISTA ESCALADO',
          'ROTA / HORÁRIO PREVISTO',
          'STATUS',
          'DIAGNÓSTICO & ORDEM DE SERVIÇO',
          'COMPRA PEÇA',
          'SERV. EXTERNO',
          'HIGIENIZAÇÃO'
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [211, 47, 47], // Vermelho institucional oficial OS
          textColor: [255, 255, 255],
          fontSize: 7.2,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 2.2,
          lineWidth: 0.2,
          lineColor: [185, 28, 28]
        },
        bodyStyles: {
          fontSize: 6.8,
          cellPadding: 2,
          valign: 'middle',
          textColor: [33, 37, 41],
          lineColor: [226, 232, 240], // Linhas sutis elegantes slate-200
          lineWidth: 0.2
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250] // Fundo alternado suave
        },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 35 },
          2: { cellWidth: 32 },
          3: { cellWidth: 34 },
          4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 45 },
          6: { cellWidth: 20, halign: 'center' },
          7: { cellWidth: 22, halign: 'center' },
          8: { cellWidth: 22, halign: 'center' }
        },
        didParseCell: (data) => {
          // Colorir células de status e diagnósticos conforme gravidade da OS
          if (data.section === 'body') {
            // Coluna de Status Operacional
            if (data.column.index === 4) {
              const text = String(data.cell.raw || '');
              if (text === 'MANUTENCAO') {
                data.cell.styles.textColor = [220, 38, 38]; // Vermelho
                data.cell.styles.fillColor = [254, 242, 242];
              } else if (text === 'EM_VIAGEM') {
                data.cell.styles.textColor = [16, 185, 129]; // Verde
                data.cell.styles.fillColor = [240, 253, 244];
              } else if (text === 'DISPONIVEL') {
                data.cell.styles.textColor = [30, 41, 59];
              }
            }
            // Coluna de Diagnóstico OS
            if (data.column.index === 5) {
              const text = String(data.cell.raw || '');
              if (text.startsWith('OS:')) {
                data.cell.styles.textColor = [185, 28, 28];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        },
        didDrawPage: (data) => {
          // Rodapé padrão de segurança e auditoria da OS
          const footerY = pageHeight - 6;
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text('Relatório Oficial de Operações e Tráfego — Gerado automaticamente pelo Sistema FluxBus FleetManager', margin, footerY);

          const pageStr = `Página ${data.pageNumber} de ${data.pageCount || data.pageNumber}`;
          doc.text(pageStr, pageWidth - margin, footerY, { align: 'right' });
        }
      });

      doc.save(`relatorio-operacional-transporte-${now.toISOString().split('T')[0]}.pdf`);
      toast({
        title: 'Relatório PDF Gerado!',
        description: 'O arquivo PDF com o layout oficial da Ordem de Serviço foi baixado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível compilar o documento PDF.',
        variant: 'destructive',
      });
    }
  };

  // Exportar Relatório em Excel (XLSX)
  const handleExportExcel = () => {
    try {
      const exportData = filteredRows.map((r) => ({
        'Placa': r.plate,
        'Modelo': r.model,
        'Ano': r.year || '',
        'Nº Frota / Patrimônio': r.fleetNumber || '',
        'Cliente': r.clientName,
        'Obra / Setor de Trabalho': r.workPostName,
        'Motorista': r.driverName,
        'Telefone Motorista': r.driverPhone || '',
        'Rota / Linha': r.routeName,
        'Turno': r.routeShift || '',
        'Horários': r.routeHours || '',
        'Status Operacional': r.operationalStatus,
        'É Veículo Reserva?': r.isReserve ? 'SIM' : 'NÃO',
        'Está em Manutenção?': r.inMaintenance ? 'SIM' : 'NÃO',
        'Nº Ordem de Serviço': r.osNumber || '',
        'Tempo Parado (Dias)': r.downtimeDays || 0,
        'Tempo Parado (Horas)': r.downtimeHours || 0,
        'Motivo da Parada / Anomalia': r.stopReason || '',
        'Solicitada Compra de Peças?': r.hasPartsPurchase ? 'SIM' : 'NÃO',
        'Valor Peças (R$)': r.partsCost || 0,
        'Serviço Externo Contratado?': r.hasExternalService ? 'SIM' : 'NÃO',
        'Valor Serviço Externo (R$)': r.externalServiceCost || 0,
        'Está na Limpeza / Lavajato?': r.inCleaning ? 'SIM' : 'NÃO',
        'Tempo na Limpeza (Minutos)': r.cleaningTimeMinutes || 0,
        'Fase de Limpeza': r.cleaningPhase || '',
        'Status Mobilização': r.mobilizationStatus || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Transporte');

      // Larguras automáticas de colunas
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 14)
      }));
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `relatorio-transporte-operacional-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Planilha Excel gerada!',
        description: 'Os dados foram exportados no formato XLSX com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar a planilha Excel.',
        variant: 'destructive',
      });
    }
  };

  // Helper para badges de status
  const getStatusBadge = (status: ConsolidatedFleetRow['operationalStatus']) => {
    switch (status) {
      case 'DISPONIVEL':
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Disponível</Badge>;
      case 'EM_ROTA':
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">Em Viagem / Rota</Badge>;
      case 'MANUTENCAO':
        return <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30">Em Manutenção</Badge>;
      case 'LIMPEZA':
        return <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30">Higienização / Lavajato</Badge>;
      case 'RESERVA':
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Veículo Reserva</Badge>;
      default:
        return <Badge variant="outline">Inativo</Badge>;
    }
  };

  return (
    <StandardLayout
      title="Painel Operacional do Transporte & Tráfego"
      subtitle="Controle Integrado de Frota, O.S., Motoristas, Mobilização, Almoxarifado e Relatório Analítico"
    >
      <div className="space-y-6">
        {/* KPI Cards no Topo */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-border/60 shadow-sm bg-card hover:border-primary/40 transition-colors">
            <CardContent className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Total Frota</span>
                <Bus className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{metrics.total}</div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span>{metrics.emRota} em rota ativa</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card hover:border-emerald-500/40 transition-colors">
            <CardContent className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Disponíveis</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.disponiveis}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Liberados para tráfego</div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card hover:border-amber-500/40 transition-colors">
            <CardContent className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Veículos Reserva</span>
                <Truck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.reservas}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Prontos para reposição</div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card hover:border-red-500/40 transition-colors">
            <CardContent className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Em Manutenção</span>
                <Wrench className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.manutencao}</div>
              <div className="text-[11px] text-muted-foreground mt-1">OS aberta / oficina</div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card hover:border-sky-500/40 transition-colors">
            <CardContent className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Na Higienização</span>
                <Sparkles className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{metrics.limpeza}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Lavajato e sanitização</div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card hover:border-purple-500/40 transition-colors">
            <CardContent className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-medium uppercase tracking-wider">Mobilização</span>
                <ShieldCheck className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.mobilizados}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Vistorias & Contratos</div>
            </CardContent>
          </Card>
        </div>

        {/* Abas Principais e Barra de Ações Operacionais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TabsList className={`grid ${canAccessAlmoxarifado ? 'grid-cols-3 max-w-xl' : 'grid-cols-2 max-w-md'} bg-muted/60 p-1`}>
              <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs font-medium">
                <Bus className="w-4 h-4" />
                Visão Operacional
              </TabsTrigger>
              {canAccessAlmoxarifado && (
                <TabsTrigger value="requisicao" className="flex items-center gap-2 text-xs font-medium">
                  <Package className="w-4 h-4" />
                  Requisição Almoxarifado
                </TabsTrigger>
              )}
              <TabsTrigger value="relatorio" className="flex items-center gap-2 text-xs font-medium">
                <FileSpreadsheet className="w-4 h-4" />
                Relatório Consolidado
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-xs h-9 bg-card border-border hover:bg-muted text-foreground transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Sincronizar ({lastUpdated})
              </Button>
              {canAccessAlmoxarifado && (
                <Button
                  size="sm"
                  onClick={() => setIsPurchaseModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white flex items-center gap-1.5 text-xs h-9 shadow-md font-bold px-3.5 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                  Nova Requisição Almoxarifado
                </Button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ABA 1: VISÃO OPERACIONAL / DASHBOARD                                     */}
          {/* ========================================================================= */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Obras / Clientes / Setor de Trabalho */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Alocação por Obra, Cliente e Setor
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Onde cada veículo está operando atualmente
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {uniqueClients.length} Clientes / Frentes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="divide-y divide-border/40 max-h-[380px] overflow-y-auto pr-1">
                    {clientGroups.map((cg) => (
                      <div key={cg.clientName} className="py-2.5 flex items-center justify-between hover:bg-muted/30 px-2 rounded-md transition-colors">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                            {cg.clientName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3">
                            <span>Setor: {cg.workPostName}</span>
                            <span>•</span>
                            <span>{cg.total} veículo(s) vinculados</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/10 text-emerald-600 text-[11px] border-emerald-500/20">
                            {cg.inOperation} ativos
                          </Badge>
                          {cg.inMaintenance > 0 && (
                            <Badge className="bg-red-500/10 text-red-600 text-[11px] border-red-500/20">
                              {cg.inMaintenance} em OS
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Motoristas e Veículos Atuando */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Motoristas e Veículos em Atividade
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Relação de condutores, veículos atribuídos e rotas
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {driverGroups.length} Motoristas Ativos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/40 max-h-[380px] overflow-y-auto pr-1">
                    {driverGroups.map((row) => (
                      <div key={row.vehicleId} className="py-2.5 flex items-center justify-between hover:bg-muted/30 px-2 rounded-md transition-colors">
                        <div className="space-y-0.5">
                          <div className="font-medium text-sm text-foreground flex items-center gap-2">
                            {row.driverName}
                            {row.driverPhone && (
                              <span className="text-[11px] text-muted-foreground font-normal">
                                ({row.driverPhone})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono text-[10px] px-1 py-0">
                              {row.plate}
                            </Badge>
                            <span>{row.model}</span>
                            <span>•</span>
                            <span>{row.routeName}</span>
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(row.operationalStatus)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Veículos Reserva & Status de Mobilização */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Veículos Reserva */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-500" />
                        Veículos Reserva Estratégicos
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Frota sobressalente pronta para substituição imediata em caso de falha ou pico
                      </CardDescription>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
                      {metrics.reservas} Reservas Prontos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {consolidatedRows.filter((r) => r.isReserve).length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-xs">
                      Nenhum veículo marcado como reserva no momento.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40 max-h-[260px] overflow-y-auto">
                      {consolidatedRows
                        .filter((r) => r.isReserve)
                        .map((res) => (
                          <div key={res.vehicleId} className="py-2.5 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm flex items-center gap-2">
                                <span className="font-mono text-primary">{res.plate}</span>
                                <span>-</span>
                                <span>{res.model} ({res.year})</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Garagem / Base: {res.workPostName}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              Alocar Veículo
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status de Mobilização & Desmobilização */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-500" />
                        Status da Mobilização e Desmobilização
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Vistorias técnicas, checklists de cliente (RAC) e prontidão de contrato
                      </CardDescription>
                    </div>
                    <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30">
                      {metrics.mobilizados} Mobilizados
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                        <div className="text-lg font-bold text-foreground">{metrics.mobilizados}</div>
                        <div className="text-[11px] text-muted-foreground">Vistoriados & Aptos</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                        <div className="text-lg font-bold text-amber-500">
                          {mobilizations.filter((m) => m.syncStatus === 'PENDING').length}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Em Vistoria</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                        <div className="text-lg font-bold text-blue-500">
                          {vehicles.filter((v) => v.status === 'LEASED' || v.status === 'ACTIVE').length}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Contratos Ativos</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-1">
                      Checklist RAC 02 / 100% conforme • Laudos de fumaça e opacidade com registro ART integrado ao módulo de mobilização.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* ABA 2: REQUISIÇÃO AO ALMOXARIFADO                                        */}
          {/* ========================================================================= */}
          {canAccessAlmoxarifado && (
            <TabsContent value="requisicao" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário de Nova Requisição */}
              <Card className="lg:col-span-2 border-border/60 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      Criar Requisição de Peças / Insumos ao Almoxarifado
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Envie solicitações de peças, lubrificantes e suprimentos diretamente para a equipe de estoque e compras.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="h-8 text-xs flex items-center gap-1.5 border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assistente com O.S. & Estoque
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitPurchaseRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="reqTitle" className="text-xs font-medium">Título da Requisição *</Label>
                        <Input
                          id="reqTitle"
                          placeholder="Ex: Peças para freio e correia - Ônibus 1042"
                          value={reqTitle}
                          onChange={(e) => setReqTitle(e.target.value)}
                          className="h-9 text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reqVehicle" className="text-xs font-medium">Veículo / Placa</Label>
                        <Select value={reqVehiclePlate} onValueChange={setReqVehiclePlate}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Selecione o veículo (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SEM_VEICULO">Geral (Estoque / Suprimento Base)</SelectItem>
                            {vehicles.map((v) => (
                              <SelectItem key={v.id} value={v.plate}>
                                {v.plate} - {v.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reqWorkPost" className="text-xs font-medium">Obra / Centro de Custo</Label>
                        <Input
                          id="reqWorkPost"
                          placeholder="Ex: Mina Brucutu / Tráfego Geral"
                          value={reqWorkPost}
                          onChange={(e) => setReqWorkPost(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reqUrgency" className="text-xs font-medium">Urgência</Label>
                        <Select value={reqUrgency} onValueChange={setReqUrgency}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NORMAL">Normal (Planejada)</SelectItem>
                            <SelectItem value="MEDIA">Média (Aguardando na semana)</SelectItem>
                            <SelectItem value="ALTA">Alta (Veículo parado)</SelectItem>
                            <SelectItem value="URGENTE">Urgente (Emergencial de Tráfego)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Itens da Requisição */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Itens Solicitados</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddReqItem}
                          className="h-7 text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar Item
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {reqItems.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-md border border-border/40">
                            <div className="col-span-5">
                              <Input
                                placeholder="Descrição da peça ou material"
                                value={item.name}
                                onChange={(e) => handleReqItemChange(idx, 'name', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                min={1}
                                placeholder="Qtd"
                                value={item.quantity}
                                onChange={(e) => handleReqItemChange(idx, 'quantity', Number(e.target.value))}
                                className="h-8 text-xs text-center"
                              />
                            </div>
                            <div className="col-span-2">
                              <Select
                                value={item.unit}
                                onValueChange={(val) => handleReqItemChange(idx, 'unit', val)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UN">UN</SelectItem>
                                  <SelectItem value="PC">PC</SelectItem>
                                  <SelectItem value="L">Litros</SelectItem>
                                  <SelectItem value="KG">KG</SelectItem>
                                  <SelectItem value="CX">CX</SelectItem>
                                  <SelectItem value="JG">Jogo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="Valor Est."
                                value={item.estimatedPrice || ''}
                                onChange={(e) => handleReqItemChange(idx, 'estimatedPrice', Number(e.target.value))}
                                className="h-8 text-xs text-right"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              {reqItems.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveReqItem(idx)}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <Label htmlFor="reqJustification" className="text-xs font-medium">Justificativa / Observações</Label>
                      <Input
                        id="reqJustification"
                        placeholder="Informe a necessidade operacional ou motivo da substituição"
                        value={reqJustification}
                        onChange={(e) => setReqJustification(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={submittingReq}
                        className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white text-xs h-9 px-5 flex items-center gap-1.5 font-bold shadow-md transition-all"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                        {submittingReq ? 'Enviando...' : 'Registrar Requisição'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Histórico Recente de Requisições */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Requisições Recentes
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Status das últimas solicitações enviadas ao estoque
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/40 max-h-[460px] overflow-y-auto pr-1">
                    {purchaseRequests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        Nenhuma requisição registrada ainda.
                      </div>
                    ) : (
                      purchaseRequests.slice(0, 10).map((req) => (
                        <div key={req.id} className="py-2.5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground truncate max-w-[180px]">
                              {req.title}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {req.status || 'PENDENTE'}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                            <span>Depto: {req.department || 'Transporte'}</span>
                            <span className="font-medium text-foreground">
                              {req.estimatedTotal ? `R$ ${Number(req.estimatedTotal).toFixed(2)}` : 'R$ 0,00'}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(req.createdAt || req.requestDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: RELATÓRIO CONSOLIDADO INTEGRADO                                    */}
          {/* ========================================================================= */}
          <TabsContent value="relatorio" className="space-y-4">
            {/* Filtros e Ações de Exportação */}
            <Card className="border-border/60 shadow-sm bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                    <div className="relative w-full max-w-sm">
                      <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por placa, modelo, motorista, obra, rota ou OS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Botões de Exportação */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                      className="text-xs flex items-center gap-1.5 h-9 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      Exportar PDF
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportExcel}
                      className="text-xs flex items-center gap-1.5 h-9 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      Exportar Excel
                    </Button>
                  </div>
                </div>

                {/* Filtros Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-border/40">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Cliente / Obra
                    </Label>
                    <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todos os Clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos os Clientes / Obras</SelectItem>
                        {uniqueClients.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3" />
                      Status Operacional
                    </Label>
                    <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todos os Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos os Status</SelectItem>
                        <SelectItem value="DISPONIVEL">Disponível</SelectItem>
                        <SelectItem value="EM_ROTA">Em Viagem / Rota</SelectItem>
                        <SelectItem value="MANUTENCAO">Em Manutenção</SelectItem>
                        <SelectItem value="LIMPEZA">Em Higienização</SelectItem>
                        <SelectItem value="RESERVA">Veículo Reserva</SelectItem>
                        <SelectItem value="INATIVO">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Condição de Manutenção / Peça
                    </Label>
                    <Select value={selectedStopFilter} onValueChange={setSelectedStopFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas as Condições</SelectItem>
                        <SelectItem value="MANUTENCAO_PECA">Parado com Compra de Peças</SelectItem>
                        <SelectItem value="MANUTENCAO_EXTERNO">Parado com Serviço Externo</SelectItem>
                        <SelectItem value="LIMPEZA">Na Higienização / Lavajato</SelectItem>
                        <SelectItem value="RESERVA">Veículos Reserva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela Analítica Consolidada */}
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/70 border-b border-border text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3">Veículo / Frota</th>
                      <th className="py-2.5 px-3">Obra / Cliente / Setor</th>
                      <th className="py-2.5 px-3">Motorista & Escala</th>
                      <th className="py-2.5 px-3">Rota / Linha</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Diagnóstico Manutenção</th>
                      <th className="py-2.5 px-3 text-center">Compra Peça</th>
                      <th className="py-2.5 px-3 text-center">Serviço Externo</th>
                      <th className="py-2.5 px-3 text-center">Higienização</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-10 text-muted-foreground">
                          Nenhum veículo encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => (
                        <tr key={row.vehicleId} className="hover:bg-muted/30 transition-colors">
                          {/* Veículo */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <span>{row.plate}</span>
                              {row.isReserve && (
                                <Badge className="bg-amber-500/15 text-amber-600 text-[9px] px-1 py-0">Reserva</Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {row.model} ({row.year || 'N/A'})
                            </div>
                          </td>

                          {/* Cliente / Obra */}
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-foreground">{row.clientName}</div>
                            <div className="text-[11px] text-muted-foreground">{row.workPostName}</div>
                          </td>

                          {/* Motorista */}
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-foreground">{row.driverName}</div>
                            <div className="text-[11px] text-muted-foreground">{row.routeShift}</div>
                          </td>

                          {/* Rota / Horários */}
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-foreground">{row.routeName}</div>
                            <div className="text-[11px] text-muted-foreground">{row.routeHours}</div>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 text-center">
                            {getStatusBadge(row.operationalStatus)}
                          </td>

                          {/* Manutenção: Tempo parado e Por que */}
                          <td className="py-2.5 px-3">
                            {row.inMaintenance ? (
                              <div className="space-y-0.5">
                                <div className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Parado: {row.downtimeDays ? `${row.downtimeDays}d ` : ''}{row.downtimeHours || 0}h
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={row.stopReason}>
                                  Motivo: {row.stopReason}
                                </div>
                              </div>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Operacional
                              </span>
                            )}
                          </td>

                          {/* Compra de Peças */}
                          <td className="py-2.5 px-3 text-center">
                            {row.hasPartsPurchase ? (
                              <div>
                                <Badge className="bg-amber-500/10 text-amber-600 text-[10px] border-amber-500/20">Solicitado</Badge>
                                <div className="text-[11px] font-semibold text-foreground mt-0.5">
                                  R$ {row.partsCost.toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">-</span>
                            )}
                          </td>

                          {/* Serviço Externo */}
                          <td className="py-2.5 px-3 text-center">
                            {row.hasExternalService ? (
                              <div>
                                <Badge className="bg-purple-500/10 text-purple-600 text-[10px] border-purple-500/20">Contratado</Badge>
                                <div className="text-[11px] font-semibold text-foreground mt-0.5">
                                  R$ {row.externalServiceCost.toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">-</span>
                            )}
                          </td>

                          {/* Limpeza / Lavajato */}
                          <td className="py-2.5 px-3 text-center">
                            {row.inCleaning ? (
                              <div>
                                <Badge className="bg-sky-500/10 text-sky-600 text-[10px] border-sky-500/20">
                                  {row.cleaningPhase || 'Lavando'}
                                </Badge>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {row.cleaningTimeMinutes} min
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Liberado</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rodapé da Tabela com Paginação e Totais */}
              <div className="p-3 bg-muted/40 border-t border-border flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
                <div className="flex items-center gap-3">
                  <span>Página <strong className="text-foreground">{currentPage}</strong> de <strong className="text-foreground">{totalPages}</strong> ({filteredRows.length} total)</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="h-7 text-xs px-2.5"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="h-7 text-xs px-2.5"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <span>Em Manutenção: <strong className="text-red-500">{filteredRows.filter((r) => r.inMaintenance).length}</strong></span>
                  <span>Em Limpeza: <strong className="text-sky-500">{filteredRows.filter((r) => r.inCleaning).length}</strong></span>
                  <span>Total Peças: <strong className="text-foreground">R$ {filteredRows.reduce((a, b) => a + b.partsCost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                  <span>Total Serv. Externo: <strong className="text-foreground">R$ {filteredRows.reduce((a, b) => a + b.externalServiceCost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal Oficial de Nova Requisição ao Almoxarifado */}
        <PurchaseRequestFormModal
          isOpen={isPurchaseModalOpen}
          onClose={handleClosePurchaseModal}
          onSave={handleSaveModalPurchaseRequest}
        />
      </div>
    </StandardLayout>
  );
};

export default TransportOperationalDashboardPage;
