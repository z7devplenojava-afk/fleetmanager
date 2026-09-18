import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Car, Wrench, FileText, TrendingUp, Shield, Download, Eye,
  AlertTriangle, Loader2, MapPin, Users, Calendar, DollarSign,
  Gauge, ClipboardList, CircleDot, Hash, Plus, Bus, DoorOpen,
  Wifi, Camera, Accessibility, Thermometer, Route, Settings,
  CreditCard, UserCheck, QrCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import FleetWorkOrderForm from '@/components/frota/FleetWorkOrderForm';
import MaintenanceAlertWidget from '@/components/frota/MaintenanceAlertWidget';
import VehicleQRCodeModal from '@/components/frota/VehicleQRCodeModal';
import fleetService from '@/services/fleetService';
import fleetWorkOrderService, { FleetWorkOrder, VehicleMaintenanceRanking } from '@/services/fleetWorkOrderService';
import tireService, { Tire } from '@/services/tireService';
import { vehicleDocumentService, VehicleDocument, VehicleDocumentType } from '@/services/vehicleDocumentService';
import workPostService from '@/services/workPostService';
import { getApiUrl } from '@/config/environment';

// ==================== TIPOS ====================

export interface VehicleDetailPanelProps {
  veiculo: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    cor?: string;
    combustivel: string;
    quilometragem?: number;
    status: string;
    capacidade?: number;
    photos?: string;
    workPostId?: string;
    insuranceExpiryDate?: string;
    documentationExpiryDate?: string;
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    assignedDriver?: string;
    location?: string;
    data_aquisicao?: string;
    valor_aquisicao?: number;
    observacoes?: string;
    vehicleType?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (veiculo: any) => void;
}

interface VehicleDetail {
  id: string;
  plate: string;
  fleetNumber?: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuelType: string;
  currentMileage?: number;
  status: string;
  capacity?: number;
  photos?: string;
  workPostId?: string;
  insuranceExpiryDate?: string;
  documentationExpiryDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  assignedDriver?: string;
  location?: string;
  acquisitionDate?: string;
  acquisitionValue?: number | string;
  averageConsumption?: number;
  averageCostPerKm?: number;
  notes?: string;
  companyId?: string;
  departmentId?: string;
  // Tipo de veículo e Ônibus
  vehicleType?: string;
  busType?: string;
  passengerCapacity?: number;
  standingCapacity?: number;
  totalDoors?: number;
  hasAccessibility?: boolean;
  hasAirConditioning?: boolean;
  hasWiFi?: boolean;
  hasCamera?: boolean;
  hasCctv?: boolean;
  busBodyType?: string;
  chassisBrand?: string;
  bodyBuilder?: string;
  engineModel?: string;
  enginePowerHp?: number;
  transmissionType?: string;
  axleCount?: number;
  totalWeightKg?: number;
  payloadKg?: number;
  fuelTankCapacityLiters?: number;
  routeNumber?: string;
  routeName?: string;
  // Documentais
  chassisNumber?: string;
  renavan?: string;
  // Financiamento
  financingStatus?: string;
  financingInstallmentValue?: number;
  financingRemainingInstallments?: number;
  financingPayoffBalance?: number;
  financingBankOrInstitution?: string;
  financingContractNumber?: string;
  financingStartDate?: string;
  financingEndDate?: string;
  // Valor de mercado
  marketValue?: number;
  // Seguros
  insurancePolicyNumber?: string;
  insuranceCompany?: string;
  insurancePremiumValue?: number;
  insuranceCoverageType?: string;
  insuranceSecondPolicyNumber?: string;
  insuranceSecondCompany?: string;
  insuranceSecondPremiumValue?: number;
  insuranceSecondExpiryDate?: string;
  // Cliente
  clientName?: string;
  allocationContractNumber?: string;
  allocationStartDate?: string;
  allocationEndDate?: string;
  // Agregado
  isAggregated?: boolean;
  aggregatedOwnerName?: string;
  aggregatedOwnerCpfCnpj?: string;
  aggregatedOwnerPhone?: string;
  aggregatedOwnerEmail?: string;
  aggregatedDailyRate?: number;
  aggregatedMonthlyRate?: number;
  aggregatedPaymentType?: string;
  aggregatedContractStartDate?: string;
  aggregatedContractEndDate?: string;
  aggregatedNotes?: string;
  // Diferença
  financialDifference?: number;
}

interface WorkPostInfo {
  id: string;
  postCode?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  clientId?: string;
  clientName?: string;
  contractId?: string;
}

// ==================== HELPERS ====================

const fmtDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('pt-BR');
};

const fmtCurrency = (v?: number | string) => {
  const n = Number(v);
  if (v == null || isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const daysUntil = (d?: string): number | null => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return Math.ceil((dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'Ativo', INACTIVE: 'Inativo', MAINTENANCE: 'Em Manutenção',
    OUT_OF_SERVICE: 'Fora de Serviço', RESERVED: 'Reservado',
    ativo: 'Ativo', inativo: 'Inativo', manutencao: 'Manutenção'
  };
  return map[s?.toUpperCase()] || s || '—';
};

// ==================== COMPONENTE ====================

const VehicleDetailPanel: React.FC<VehicleDetailPanelProps> = ({ veiculo, isOpen, onClose, onEdit }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOsFormOpen, setIsOsFormOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<VehicleDetail | null>(null);
  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const [ranking, setRanking] = useState<VehicleMaintenanceRanking[]>([]);
  const [tires, setTires] = useState<Tire[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [fuelRecords, setFuelRecords] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [workPost, setWorkPost] = useState<WorkPostInfo | null>(null);

  const loadAll = useCallback(async () => {
    if (!isOpen || !veiculo?.id) return;
    setLoading(true);
    try {
      const [v, wos, rk, tiresData, docs, fuel, fineList, maint, wp] = await Promise.all([
        fleetService.getVehicle(veiculo.id).catch(() => null),
        fleetWorkOrderService.findAll().catch(() => []),
        fleetWorkOrderService.getVehicleRanking().catch(() => []),
        tireService.findAll().catch(() => []),
        vehicleDocumentService.list(veiculo.id).catch(() => []),
        fleetService.getFuelRecords(veiculo.id).catch(() => []),
        fleetService.getFines(veiculo.id).catch(() => []),
        fleetService.getMaintenances(veiculo.id).catch(() => []),
        veiculo.workPostId
          ? workPostService.getWorkPostById(veiculo.workPostId).catch(() => null)
          : Promise.resolve(null)
      ]);

      setDetail(v as VehicleDetail | null);
      setWorkOrders((wos || []).filter(o => o.vehicleId === veiculo.id));
      setRanking(rk || []);
      setTires((tiresData || []).filter(t => t.vehicleId === veiculo.id));
      setDocuments(docs || []);
      setFuelRecords(fuel || []);
      setFines(fineList || []);
      setMaintenances(maint || []);
      setWorkPost(wp as WorkPostInfo | null);
    } catch (error) {
      console.error('Erro ao carregar detalhes do veículo:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar os detalhes do veículo', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isOpen, veiculo?.id, veiculo?.workPostId, toast]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setIsOsFormOpen(false);
      loadAll();
    }
  }, [isOpen, loadAll]);

  if (!isOpen) return null;

  // ---- Dados derivados ----
  const merged = { ...veiculo, ...(detail || {}) };
  const myRank = ranking.findIndex(r => r.vehicleId === veiculo.id);
  const myRanking = ranking[myRank] || null;
  const vehicleTires = tires;
  const inUseTires = vehicleTires.filter(t => t.status === 'IN_USE').length;
  const recapTires = vehicleTires.filter(t => t.status === 'RECAP').length;
  const scrappedTires = vehicleTires.filter(t => t.status === 'SCRAPPED').length;
  const expiredDocs = documents.filter(d => d.expiryDate && daysUntil(d.expiryDate)! < 0);
  const expiringDocs = documents.filter(d => d.expiryDate && daysUntil(d.expiryDate)! >= 0 && daysUntil(d.expiryDate)! <= 30);
  const openOrders = workOrders.filter(o => o.status === 'OPEN' || o.status === 'IN_PROGRESS' || o.status === 'PENDING').length;
  const totalOSCost = workOrders.reduce((acc, o) => acc + Number(o.totalCost || 0), 0);

  const insuranceDays = daysUntil(merged.insuranceExpiryDate);
  const docDays = daysUntil(merged.documentationExpiryDate);

  const downloadDoc = async (doc: VehicleDocument) => {
    try {
      const blob = await vehicleDocumentService.download(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || `${doc.title || doc.docType}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao baixar documento', variant: 'destructive' });
    }
  };

  const getDocBadge = (t: VehicleDocumentType) => {
    const colors: Record<string, string> = {
      CRLV: 'bg-green-900/40 text-green-400 border-green-700',
      DUT: 'bg-blue-900/40 text-blue-400 border-blue-700',
      SEGURO: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
      IPVA: 'bg-purple-900/40 text-purple-400 border-purple-700',
      OUTRO: 'bg-gray-700 text-gray-300 border-gray-600'
    };
    return colors[t] || colors.OUTRO;
  };

  const renderExpiryBadge = (days: number | null, label: string) => {
    if (days === null) return <Badge variant="outline" className="border-gray-600 text-gray-400">{label}: —</Badge>;
    if (days < 0) return <Badge variant="destructive">{label}: vencido há {Math.abs(days)}d</Badge>;
    if (days <= 30) return <Badge className="bg-yellow-600">{label}: {days}d</Badge>;
    return <Badge className="bg-green-700">{label}: {days}d</Badge>;
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="min-h-full flex items-start justify-center p-3 sm:p-6">
        <div 
          className="bg-seguranca-black border border-gray-600 rounded-xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ===== HEADER ===== */}
          <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-600 bg-seguranca-graphite">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-seguranca-yellow/15 border border-seguranca-yellow/40 flex items-center justify-center shrink-0">
                <Car className="h-6 w-6 sm:h-7 sm:w-7 text-seguranca-yellow" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-seguranca-lightgray font-mono tracking-wide">
                    {merged.placa}
                  </h2>
                  {merged.fleetNumber && (
                    <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                      Frota #{merged.fleetNumber}
                    </Badge>
                  )}
                  <Badge
                    className={
                      ['ACTIVE', 'Ativo', 'ativo'].includes(merged.status)
                        ? 'bg-green-600'
                        : ['MAINTENANCE', 'Manutenção', 'manutencao'].includes(merged.status)
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }
                  >
                    {statusLabel(merged.status)}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
                  {merged.brand} {merged.model} · {merged.year}
                  {merged.color ? ` · ${merged.color}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsQrModalOpen(true)}
                className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black h-9 font-medium"
                title="Ver QR Code do veículo com Garagem, Cliente, Motorista e Histórico"
              >
                <QrCode className="mr-1.5 h-4 w-4" /> QR Code
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setActiveTab('manutencao');
                  setIsOsFormOpen(true);
                }}
                className="bg-seguranca-red hover:bg-seguranca-darkred text-white h-9"
                title="Criar nova Ordem de Serviço para este veículo"
              >
                <Plus className="mr-1 h-4 w-4" /> Nova OS
              </Button>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(veiculo)}
                  className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black h-9"
                >
                  Editar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700 h-9">
                ✕
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-seguranca-yellow" />
              <p className="text-gray-400 text-sm">Carregando prontuário do veículo...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* ===== CARDS RESUMO ===== */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Gauge className="h-3.5 w-3.5 text-green-400" />
                    Quilometragem
                  </div>
                  <div className="text-lg font-bold text-seguranca-lightgray mt-1">
                    {merged.quilometragem != null ? `${Number(merged.quilometragem).toLocaleString('pt-BR')} km` : '—'}
                  </div>
                </div>
                <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Wrench className="h-3.5 w-3.5 text-blue-400" />
                    OS no veículo
                  </div>
                  <div className="text-lg font-bold text-seguranca-lightgray mt-1">{workOrders.length}</div>
                  <div className="text-[11px] text-gray-500">{openOrders} abertas</div>
                </div>
                <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <DollarSign className="h-3.5 w-3.5 text-yellow-400" />
                    Custo OS total
                  </div>
                  <div className="text-lg font-bold text-seguranca-lightgray mt-1">{fmtCurrency(totalOSCost)}</div>
                </div>
                <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CircleDot className="h-3.5 w-3.5 text-purple-400" />
                    Pneus
                  </div>
                  <div className="text-lg font-bold text-seguranca-lightgray mt-1">
                    {vehicleTires.length}
                    {vehicleTires.length > 0 && <span className="text-xs font-normal text-gray-400"> ({inUseTires} uso)</span>}
                  </div>
                </div>
              </div>

      {/* ===== ALERTAS DE VENCIMENTO ===== */}
      {(insuranceDays !== null && insuranceDays <= 30 || docDays !== null && docDays <= 30 || expiredDocs.length > 0 || expiringDocs.length > 0) && (
                <Alert className={`mb-5 ${expiredDocs.length > 0 || (insuranceDays !== null && insuranceDays < 0) || (docDays !== null && docDays < 0) ? 'bg-red-900/20 border-red-700' : 'bg-yellow-900/20 border-yellow-700'}`}>
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-xs text-seguranca-lightgray">
                    <strong>Atenção aos vencimentos:</strong>{' '}
                    {renderVencimentoText(insuranceDays, 'Seguro')}
                    {renderVencimentoText(docDays, 'Documentação')}
                    {expiredDocs.map(d => ` · ${d.title || d.docType} vencido (${fmtDate(d.expiryDate)})`)}
                    {expiringDocs.map(d => ` · ${d.title || d.docType} vence em ${daysUntil(d.expiryDate)}d`)}
                  </AlertDescription>
                </Alert>
              )}

              {/* ===== ABAS ===== */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex flex-wrap justify-start h-auto w-full bg-seguranca-graphite border border-gray-600 p-1 gap-1 overflow-x-auto">
                  <TabsTrigger value="overview" className="text-xs px-3 py-1.5 data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">Visão Geral</TabsTrigger>
                  <TabsTrigger value="manutencao" className="text-xs px-3 py-1.5 data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
                    Manutenção & OS {workOrders.length > 0 && `(${workOrders.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="ranking" className="text-xs px-3 py-1.5 data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">Ranking</TabsTrigger>
                  <TabsTrigger value="documentos" className="text-xs px-3 py-1.5 data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
                    Documentos {documents.length > 0 && `(${documents.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="vencimentos" className="text-xs px-3 py-1.5 data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">Vencimentos</TabsTrigger>
                  <TabsTrigger value="pneus" className="text-xs px-3 py-1.5 data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
                    Pneus {vehicleTires.length > 0 && `(${vehicleTires.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="abastecimentos" className="text-xs px-3 py-1.5 data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
                    Abastecimentos {fuelRecords.length > 0 && `(${fuelRecords.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="multas" className="text-xs px-3 py-1.5 data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">
                    Multas {fines.length > 0 && `(${fines.length})`}
                  </TabsTrigger>
                </TabsList>

                {/* ---------- VISÃO GERAL ---------- */}
                <TabsContent value="overview" className="mt-4 space-y-5">
                  {/* Próxima Manutenção — status dos planos preventivos */}
                  <MaintenanceAlertWidget vehicleId={veiculo.id} onCreateOrder={() => setIsOsFormOpen(true)} />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Fotos */}
                    <div className="lg:col-span-2 space-y-5">
                      {merged.photos ? (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2">
                            <Car className="h-4 w-4 text-seguranca-yellow" /> Fotos
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {String(merged.photos).split(',').filter(Boolean).map((photo, i) => {
                              const url = photo.startsWith('http') ? photo : `${getApiUrl().replace('/api', '')}${photo}`;
                              return (
                                <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-600 bg-seguranca-graphite h-36">
                                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  <button
                                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors"
                                    onClick={() => window.open(url, '_blank')}
                                  >
                                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-700 rounded-lg py-10 text-center">
                          <Car className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Nenhuma foto cadastrada</p>
                        </div>
                      )}

                      {/* Alocação */}
                      <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-seguranca-yellow" /> Alocação do Veículo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-400">Cliente</p>
                            <p className="text-seguranca-lightgray font-semibold mt-0.5">
                              {workPost?.clientName || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Posto de Trabalho</p>
                            <p className="text-seguranca-lightgray font-semibold mt-0.5">
                              {workPost ? `${workPost.name || workPost.postCode || workPost.id}` : 'Não alocado'}
                            </p>
                          </div>
                          {workPost?.address && (
                            <div className="md:col-span-2">
                              <p className="text-xs text-gray-400">Endereço do posto</p>
                              <p className="text-seguranca-lightgray mt-0.5">
                                {workPost.address}{workPost.city ? ` - ${workPost.city}/${workPost.state || ''}` : ''}
                              </p>
                            </div>
                          )}
                          {merged.location && (
                            <div>
                              <p className="text-xs text-gray-400">Localização atual</p>
                              <p className="text-seguranca-lightgray mt-0.5">{merged.location}</p>
                            </div>
                          )}
                          {merged.assignedDriver && (
                            <div>
                              <p className="text-xs text-gray-400">Motorista designado</p>
                              <p className="text-seguranca-lightgray mt-0.5 flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-blue-400" /> {merged.assignedDriver}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ficha técnica */}
                    <div className="space-y-5">
                      <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 mb-3">
                          <ClipboardList className="h-4 w-4 text-seguranca-yellow" /> Ficha Técnica
                        </h4>
                        <div className="space-y-2.5 text-sm">
                          <RowInfo label="Placa" value={merged.placa} mono />
                          {merged.chassisNumber && <RowInfo label="Chassi" value={merged.chassisNumber} mono />}
                          {merged.renavan && <RowInfo label="RENAVAN" value={merged.renavan} mono />}
                          <RowInfo label="Marca" value={merged.brand} />
                          <RowInfo label="Modelo" value={merged.model} />
                          <RowInfo label="Ano" value={String(merged.year || '—')} />
                          <RowInfo label="Cor" value={merged.color || '—'} />
                          <RowInfo label="Combustível" value={merged.fuelType ? merged.fuelType.charAt(0).toUpperCase() + merged.fuelType.slice(1) : '—'} />
                          <RowInfo label="Capacidade" value={merged.capacidade ? `${merged.capacidade} pessoas` : '—'} />
                          <RowInfo label="Quilometragem" value={merged.quilometragem != null ? `${Number(merged.quilometragem).toLocaleString('pt-BR')} km` : '—'} />
                        </div>
                      </div>

                      <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 mb-3">
                          <DollarSign className="h-4 w-4 text-green-400" /> Aquisição & Consumo
                        </h4>
                        <div className="space-y-2.5 text-sm">
                          <RowInfo label="Data de aquisição" value={fmtDate(merged.data_aquisicao || merged.acquisitionDate)} />
                          <RowInfo label="Valor de aquisição" value={fmtCurrency(merged.valor_aquisicao || merged.acquisitionValue)} />
                          <RowInfo label="Consumo médio" value={merged.averageConsumption ? `${merged.averageConsumption} km/L` : '—'} />
                          <RowInfo label="Custo por km" value={merged.averageCostPerKm ? fmtCurrency(merged.averageCostPerKm) : '—'} />
                          <RowInfo label="Última manutenção" value={fmtDate(merged.lastMaintenanceDate)} />
                          <RowInfo label="Próxima manutenção" value={fmtDate(merged.nextMaintenanceDate)} />
                        </div>
                      </div>

                      {/* ===== DADOS DO ÔNIBUS ===== */}
                      {(merged.vehicleType === 'BUS_ROAD' || merged.vehicleType === 'BUS_LUXURY_TOURISM' || merged.vehicleType === 'BUS_URBAN' || merged.vehicleType === 'MINIBUS' || merged.vehicleType === 'VAN') && (
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 mb-3">
                            <Bus className="h-4 w-4 text-green-400" /> Dados do Ônibus
                          </h4>
                          <div className="space-y-2.5 text-sm">
                            <RowInfo label="Tipo de Ônibus" value={merged.busType || '—'} />
                            <RowInfo label="Carroceria" value={merged.busBodyType || '—'} />
                            <RowInfo label="Chassi" value={merged.chassisBrand || '—'} />
                            <RowInfo label="Fabricante" value={merged.bodyBuilder || '—'} />
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="bg-seguranca-black/60 border border-gray-700 rounded-md px-3 py-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wide">
                                <Users className="h-3 w-3 text-blue-400" /> Sentados
                              </div>
                              <div className="text-sm mt-0.5 text-seguranca-lightgray font-semibold">
                                {merged.passengerCapacity ?? '—'}
                              </div>
                            </div>
                            <div className="bg-seguranca-black/60 border border-gray-700 rounded-md px-3 py-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wide">
                                <Users className="h-3 w-3 text-yellow-400" /> Em pé
                              </div>
                              <div className="text-sm mt-0.5 text-seguranca-lightgray font-semibold">
                                {merged.standingCapacity ?? '—'}
                              </div>
                            </div>
                            <div className="bg-seguranca-black/60 border border-gray-700 rounded-md px-3 py-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wide">
                                <DoorOpen className="h-3 w-3 text-purple-400" /> Portas
                              </div>
                              <div className="text-sm mt-0.5 text-seguranca-lightgray font-semibold">
                                {merged.totalDoors ?? '—'}
                              </div>
                            </div>
                            <div className="bg-seguranca-black/60 border border-gray-700 rounded-md px-3 py-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wide">
                                <Settings className="h-3 w-3 text-gray-400" /> Eixos
                              </div>
                              <div className="text-sm mt-0.5 text-seguranca-lightgray font-semibold">
                                {merged.axleCount ?? '—'}
                              </div>
                            </div>
                          </div>
                          {/* Comodidades */}
                          <div className="mt-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Comodidades</p>
                            <div className="flex flex-wrap gap-1.5">
                              {merged.hasAccessibility && <Badge className="bg-blue-900/40 text-blue-400 border-blue-700 text-[10px]">♿ Acessível</Badge>}
                              {merged.hasAirConditioning && <Badge className="bg-cyan-900/40 text-cyan-400 border-cyan-700 text-[10px]">❄️ Ar Cond.</Badge>}
                              {merged.hasWiFi && <Badge className="bg-green-900/40 text-green-400 border-green-700 text-[10px]">📶 Wi-Fi</Badge>}
                              {merged.hasCamera && <Badge className="bg-red-900/40 text-red-400 border-red-700 text-[10px]">📷 Câmera</Badge>}
                              {merged.hasCctv && <Badge className="bg-orange-900/40 text-orange-400 border-orange-700 text-[10px]">🎥 CCTV</Badge>}
                              {!merged.hasAccessibility && !merged.hasAirConditioning && !merged.hasWiFi && !merged.hasCamera && !merged.hasCctv && (
                                <span className="text-xs text-gray-500">Nenhuma comodidade informada</span>
                              )}
                            </div>
                          </div>
                          {/* Motor & Transmissão */}
                          {(merged.engineModel || merged.enginePowerHp || merged.transmissionType) && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Motor & Transmissão</p>
                              <div className="space-y-2.5 text-sm">
                                {merged.engineModel && <RowInfo label="Motor" value={merged.engineModel} />}
                                {merged.enginePowerHp && <RowInfo label="Potência" value={`${merged.enginePowerHp} HP`} />}
                                {merged.transmissionType && <RowInfo label="Câmbio" value={merged.transmissionType} />}
                              </div>
                            </div>
                          )}
                          {/* Peso & Capacidade Tanque */}
                          {(merged.totalWeightKg || merged.payloadKg || merged.fuelTankCapacityLiters) && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Peso & Tanque</p>
                              <div className="grid grid-cols-3 gap-2">
                                {merged.totalWeightKg && <MiniStat label="Peso Total" value={`${merged.totalWeightKg.toLocaleString('pt-BR')} kg`} />}
                                {merged.payloadKg && <MiniStat label="Carga Útil" value={`${merged.payloadKg.toLocaleString('pt-BR')} kg`} />}
                                {merged.fuelTankCapacityLiters && <MiniStat label="Tanque" value={`${merged.fuelTankCapacityLiters} L`} />}
                              </div>
                            </div>
                          )}
                          {/* Rota/Linha */}
                          {(merged.routeNumber || merged.routeName) && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <p className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wide mb-2">
                                <Route className="h-3 w-3" /> Rota/Linha
                              </p>
                              <div className="space-y-2.5 text-sm">
                                <RowInfo label="Número" value={merged.routeNumber || '—'} />
                                <RowInfo label="Nome" value={merged.routeName || '—'} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ===== FINANCIAMENTO ===== */}
                      {merged.financingStatus && (
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 mb-3">
                            <CreditCard className="h-4 w-4 text-blue-400" /> Financiamento
                          </h4>
                          <div className="space-y-2.5 text-sm">
                            <RowInfo label="Status" value={merged.financingStatus} />
                            {merged.financingBankOrInstitution && <RowInfo label="Banco" value={merged.financingBankOrInstitution} />}
                            {merged.financingContractNumber && <RowInfo label="Nº Contrato" value={merged.financingContractNumber} />}
                            {merged.financingInstallmentValue && <RowInfo label="Parcela" value={fmtCurrency(merged.financingInstallmentValue)} />}
                            {merged.financingRemainingInstallments && <RowInfo label="Parcelas Restantes" value={String(merged.financingRemainingInstallments)} />}
                            {merged.financingPayoffBalance && <RowInfo label="Saldo Quitação" value={fmtCurrency(merged.financingPayoffBalance)} />}
                            {merged.marketValue && <RowInfo label="Valor Mercado" value={fmtCurrency(merged.marketValue)} />}
                            {merged.financialDifference && <RowInfo label="Diferença" value={fmtCurrency(merged.financialDifference)} />}
                          </div>
                        </div>
                      )}

                      {/* ===== SEGUROS ===== */}
                      {merged.insurancePolicyNumber && (
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 mb-3">
                            <Shield className="h-4 w-4 text-green-400" /> Seguros
                          </h4>
                          <div className="space-y-2.5 text-sm">
                            <RowInfo label="Apólice" value={merged.insurancePolicyNumber} />
                            {merged.insuranceCompany && <RowInfo label="Seguradora" value={merged.insuranceCompany} />}
                            {merged.insurancePremiumValue && <RowInfo label="Prêmio" value={fmtCurrency(merged.insurancePremiumValue)} />}
                            {merged.insuranceCoverageType && <RowInfo label="Cobertura" value={merged.insuranceCoverageType} />}
                          </div>
                          {merged.insuranceSecondPolicyNumber && (
                            <div className="mt-3 pt-3 border-t border-gray-700 space-y-2.5 text-sm">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Segunda Apólice</p>
                              <RowInfo label="Apólice 2" value={merged.insuranceSecondPolicyNumber} />
                              {merged.insuranceSecondCompany && <RowInfo label="Seguradora 2" value={merged.insuranceSecondCompany} />}
                              {merged.insuranceSecondPremiumValue && <RowInfo label="Prêmio 2" value={fmtCurrency(merged.insuranceSecondPremiumValue)} />}
                              {merged.insuranceSecondExpiryDate && <RowInfo label="Vencimento 2" value={fmtDate(merged.insuranceSecondExpiryDate)} />}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ===== CLIENTE / ALOCAÇÃO ===== */}
                      {merged.clientName && (
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4 text-indigo-400" /> Cliente / Alocação
                          </h4>
                          <div className="space-y-2.5 text-sm">
                            <RowInfo label="Cliente" value={merged.clientName} />
                            {merged.allocationContractNumber && <RowInfo label="Nº Contrato" value={merged.allocationContractNumber} />}
                            {merged.allocationStartDate && <RowInfo label="Início" value={fmtDate(merged.allocationStartDate)} />}
                            {merged.allocationEndDate && <RowInfo label="Término" value={fmtDate(merged.allocationEndDate)} />}
                          </div>
                        </div>
                      )}

                      {/* ===== AGREGADO ===== */}
                      {merged.isAggregated && (
                        <div className="bg-seguranca-graphite border border-orange-700/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 mb-3">
                            <UserCheck className="h-4 w-4 text-orange-400" /> Veículo de Agregado
                          </h4>
                          <div className="space-y-2.5 text-sm">
                            {merged.aggregatedOwnerName && <RowInfo label="Proprietário" value={merged.aggregatedOwnerName} />}
                            {merged.aggregatedOwnerCpfCnpj && <RowInfo label="CPF/CNPJ" value={merged.aggregatedOwnerCpfCnpj} />}
                            {merged.aggregatedOwnerPhone && <RowInfo label="Telefone" value={merged.aggregatedOwnerPhone} />}
                            {merged.aggregatedPaymentType && <RowInfo label="Tipo Pagamento" value={merged.aggregatedPaymentType} />}
                            {merged.aggregatedDailyRate && <RowInfo label="Valor Diário" value={fmtCurrency(merged.aggregatedDailyRate)} />}
                            {merged.aggregatedMonthlyRate && <RowInfo label="Valor Mensal" value={fmtCurrency(merged.aggregatedMonthlyRate)} />}
                            {merged.aggregatedContractStartDate && <RowInfo label="Início Contrato" value={fmtDate(merged.aggregatedContractStartDate)} />}
                            {merged.aggregatedContractEndDate && <RowInfo label="Término Contrato" value={fmtDate(merged.aggregatedContractEndDate)} />}
                          </div>
                          {merged.aggregatedNotes && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Observações</p>
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">{merged.aggregatedNotes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {merged.observacoes || merged.notes ? (
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray mb-2">Observações</h4>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{merged.observacoes || merged.notes}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </TabsContent>

                {/* ---------- MANUTENÇÃO & OS ---------- */}
                <TabsContent value="manutencao" className="mt-4 space-y-5">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className="bg-blue-700">{workOrders.length} OS registradas</Badge>
                    <Badge className="bg-green-700">{workOrders.filter(o => o.status === 'COMPLETED').length} concluídas</Badge>
                    <Badge className="bg-yellow-600">{openOrders} abertas</Badge>
                    <Badge className="bg-gray-700">{maintenances.length} manutenções</Badge>
                    <Button
                      size="sm"
                      onClick={() => setIsOsFormOpen(true)}
                      className="bg-seguranca-red hover:bg-seguranca-darkred text-white ml-auto h-8"
                      title="Criar nova Ordem de Serviço para este veículo"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Nova OS
                    </Button>
                  </div>

                  {workOrders.length === 0 && maintenances.length === 0 ? (
                    <Alert className="bg-seguranca-graphite border-gray-600">
                      <AlertDescription className="text-sm text-gray-400">
                        Nenhuma ordem de serviço ou manutenção registrada para este veículo.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {workOrders.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-seguranca-yellow" /> Ordens de Serviço Executadas
                          </h4>
                          {workOrders.map((wo) => (
                            <div key={wo.id} className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 sm:p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-semibold text-seguranca-yellow text-sm">{wo.osNumber || wo.id.slice(0, 8)}</span>
                                  <Badge variant={wo.status === 'COMPLETED' ? 'default' : wo.status === 'IN_PROGRESS' ? 'secondary' : 'outline'}
                                    className={wo.status === 'COMPLETED' ? 'bg-green-700' : wo.status === 'IN_PROGRESS' ? 'bg-yellow-600' : 'border-gray-600 text-gray-300'}>
                                    {wo.status?.replace('_', ' ') || '—'}
                                  </Badge>
                                  {wo.priority && (
                                    <Badge variant="outline" className={`border-gray-600 ${wo.priority === 'URGENT' ? 'text-red-400' : wo.priority === 'HIGH' ? 'text-orange-400' : 'text-gray-300'}`}>
                                      {wo.priority}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {wo.plannedDate ? fmtDate(wo.plannedDate) : ''}
                                  {wo.completionDate ? ` → ${fmtDate(wo.completionDate)}` : ''}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                                <MiniStat label="Mecânico" value={wo.mechanicName || '—'} />
                                <MiniStat label="Custo mão de obra" value={fmtCurrency(wo.laborCost)} />
                                <MiniStat label="Custo peças" value={fmtCurrency(wo.partsCost)} />
                                <MiniStat label="Custo total" value={fmtCurrency(wo.totalCost)} strong />
                              </div>
                              {wo.notes && <p className="text-xs text-gray-400 mt-2">{wo.notes}</p>}
                              {wo.items && wo.items.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {wo.items.slice(0, 6).map((item: any, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px] bg-gray-700 text-gray-300">
                                      {item.description || item.partName || item.name || 'Item'}
                                    </Badge>
                                  ))}
                                  {wo.items.length > 6 && <span className="text-[10px] text-gray-500">+{wo.items.length - 6}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {maintenances.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 pt-2">
                            <Wrench className="h-4 w-4 text-blue-400" /> Histórico de Manutenções
                          </h4>
                          {maintenances.map((m: any) => (
                            <div key={m.id} className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 sm:p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={m.status === 'COMPLETED' ? 'default' : m.status === 'IN_PROGRESS' ? 'secondary' : 'outline'}
                                    className={m.status === 'COMPLETED' ? 'bg-green-700' : m.status === 'IN_PROGRESS' ? 'bg-yellow-600' : 'border-gray-600 text-gray-300'}>
                                    {m.status?.replace('_', ' ') || '—'}
                                  </Badge>
                                  <span className="text-sm font-semibold text-seguranca-lightgray">
                                    {m.type || m.maintenanceType || 'Manutenção'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {fmtDate(m.date || m.maintenanceDate)}
                                </div>
                              </div>
                              {m.description && <p className="text-xs text-gray-300 mt-2">{m.description}</p>}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs">
                                <MiniStat label="Custo" value={fmtCurrency(m.cost)} />
                                <MiniStat label="Oficina" value={m.provider || m.workshop || '—'} />
                                <MiniStat label="KM" value={m.mileage ? `${Number(m.mileage).toLocaleString('pt-BR')} km` : '—'} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* ---------- RANKING ---------- */}
                <TabsContent value="ranking" className="mt-4 space-y-4">
                  {myRanking ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 text-center">
                          <div className="text-xs text-gray-400">Posição no ranking</div>
                          <div className="text-3xl font-bold text-seguranca-yellow mt-1">
                            #{myRank + 1}
                            <span className="text-sm text-gray-500 font-normal"> de {ranking.length}</span>
                          </div>
                        </div>
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 text-center">
                          <div className="text-xs text-gray-400">OS total</div>
                          <div className="text-3xl font-bold text-seguranca-lightgray mt-1">{myRanking.totalOrders}</div>
                        </div>
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 text-center">
                          <div className="text-xs text-gray-400">Custo acumulado</div>
                          <div className="text-2xl font-bold text-seguranca-lightgray mt-1">{fmtCurrency(myRanking.totalCost)}</div>
                        </div>
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 text-center">
                          <div className="text-xs text-gray-400">Tempo parado</div>
                          <div className="text-2xl font-bold text-seguranca-lightgray mt-1">
                            {myRanking.totalDowntimeHours} h
                          </div>
                        </div>
                      </div>

                      <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-seguranca-yellow" /> Indicadores
                          </h4>
                          {myRanking.recommendation && (
                            <Badge variant="outline"
                              className={myRanking.recommendation === 'RETIRE' ? 'border-red-700 text-red-400' : myRanking.recommendation === 'REVIEW' ? 'border-yellow-700 text-yellow-400' : 'border-green-700 text-green-400'}>
                              Recomendação: {myRanking.recommendation}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <MiniStat label="OS concluídas" value={String(myRanking.completedOrders)} />
                          <MiniStat label="OS canceladas" value={String(myRanking.cancelledOrders)} />
                          <MiniStat label="Taxa de conclusão" value={`${(myRanking.completionRate * 100).toFixed(0)}%`} />
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Taxa de conclusão</span>
                            <span>{Math.round((myRanking.completionRate || 0) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-seguranca-red to-seguranca-yellow rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.round((myRanking.completionRate || 0) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Alert className="bg-seguranca-graphite border-gray-600">
                      <AlertDescription className="text-sm text-gray-400">
                        Este veículo ainda não possui OS suficientes para aparecer no ranking.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* ---------- DOCUMENTOS ---------- */}
                <TabsContent value="documentos" className="mt-4 space-y-3">
                  {documents.length === 0 ? (
                    <Alert className="bg-seguranca-graphite border-gray-600">
                      <AlertDescription className="text-sm text-gray-400">
                        Nenhum documento cadastrado (CRLV, DUT, Seguro...).
                      </AlertDescription>
                    </Alert>
                  ) : (
                    documents.map((doc) => {
                      const dd = daysUntil(doc.expiryDate);
                      return (
                        <div key={doc.id} className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-seguranca-black border border-gray-600 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`text-[10px] ${getDocBadge(doc.docType)}`}>{doc.docType}</Badge>
                                <span className="text-sm font-semibold text-seguranca-lightgray truncate">{doc.title || doc.originalName}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400 mt-1">
                                {doc.documentNumber && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{doc.documentNumber}</span>}
                                {doc.issueDate && <span>Emissão: {fmtDate(doc.issueDate)}</span>}
                                {doc.expiryDate && (
                                  <span className={dd !== null && dd < 0 ? 'text-red-400 font-semibold' : dd !== null && dd <= 30 ? 'text-yellow-400' : ''}>
                                    Vence: {fmtDate(doc.expiryDate)} {dd !== null && dd < 0 ? `(vencido há ${Math.abs(dd)}d)` : dd !== null ? `(${dd}d)` : ''}
                                  </span>
                                )}
                                {doc.displaySize && <span>{doc.displaySize}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => downloadDoc(doc)} className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white h-8 text-xs">
                              <Download className="h-3.5 w-3.5 mr-1" /> Baixar
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                {/* ---------- VENCIMENTOS ---------- */}
                <TabsContent value="vencimentos" className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Shield className="h-4 w-4 text-yellow-400" /> Seguro
                      </div>
                      <div className="text-lg font-bold text-seguranca-lightgray">{fmtDate(merged.insuranceExpiryDate)}</div>
                      <div className="mt-2">{renderExpiryBadge(insuranceDays, '')}</div>
                    </div>
                    <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <FileText className="h-4 w-4 text-blue-400" /> Documentação (CRLV)
                      </div>
                      <div className="text-lg font-bold text-seguranca-lightgray">{fmtDate(merged.documentationExpiryDate)}</div>
                      <div className="mt-2">{renderExpiryBadge(docDays, '')}</div>
                    </div>
                    <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Wrench className="h-4 w-4 text-green-400" /> Próxima manutenção
                      </div>
                      <div className="text-lg font-bold text-seguranca-lightgray">{fmtDate(merged.nextMaintenanceDate)}</div>
                      <div className="mt-2">{renderExpiryBadge(daysUntil(merged.nextMaintenanceDate), '')}</div>
                    </div>
                  </div>                      <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-seguranca-lightgray flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-seguranca-yellow" /> Vencimentos de Documentos (CRLV, DUT, Seguro, IPVA)
                    </h4>
                    {documents.length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum documento com vencimento cadastrado.</p>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc) => {
                          const dd = daysUntil(doc.expiryDate);
                          if (!doc.expiryDate) return null;
                          return (
                            <div key={doc.id} className="flex items-center justify-between text-sm border-b border-gray-700 pb-2">
                              <span className="text-seguranca-lightgray flex items-center gap-2">
                                <Badge className={`text-[10px] ${getDocBadge(doc.docType)}`}>{doc.docType}</Badge>
                                {doc.title || doc.documentNumber || doc.docType}
                              </span>
                              <span className={dd !== null && dd < 0 ? 'text-red-400' : dd !== null && dd <= 30 ? 'text-yellow-400' : 'text-gray-300'}>
                                {fmtDate(doc.expiryDate)} {dd !== null && dd < 0 ? `(vencido)` : dd !== null ? `(${dd}d)` : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ---------- PNEUS ---------- */}
                <TabsContent value="pneus" className="mt-4 space-y-3">
                  {vehicleTires.length === 0 ? (
                    <Alert className="bg-seguranca-graphite border-gray-600">
                      <AlertDescription className="text-sm text-gray-400">
                        Nenhum pneu registrado para este veículo.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-purple-700">{vehicleTires.length} pneus</Badge>
                        <Badge className="bg-green-700">{inUseTires} em uso</Badge>
                        <Badge className="bg-yellow-600">{recapTires} recapagem</Badge>
                        <Badge className="bg-red-700">{scrappedTires} sucata</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {vehicleTires.map((tire) => (
                          <div key={tire.id} className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <CircleDot className={`h-4 w-4 ${tire.status === 'IN_USE' ? 'text-green-400' : tire.status === 'RECAP' ? 'text-yellow-400' : tire.status === 'SCRAPPED' ? 'text-red-400' : 'text-gray-400'}`} />
                                <span className="font-semibold text-seguranca-lightgray text-sm">
                                  {tire.brand} {tire.model}
                                </span>
                              </div>
                              <Badge variant={tire.status === 'IN_USE' ? 'default' : tire.status === 'RECAP' ? 'secondary' : tire.status === 'SCRAPPED' ? 'destructive' : 'outline'}
                                className={tire.status === 'IN_USE' ? 'bg-green-700' : tire.status === 'RECAP' ? 'bg-yellow-600' : ''}>
                                {tire.status?.replace('_', ' ') || '—'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                              <MiniStat label="DOT" value={tire.serialNumber || '—'} mono />
                              <MiniStat label="Medida" value={tire.size || '—'} />
                              <MiniStat label="Quilometragem" value={tire.currentMileage != null ? `${Number(tire.currentMileage).toLocaleString('pt-BR')} km` : '—'} />
                              <MiniStat label="Recapagens" value={String(tire.recapCount ?? 0)} />
                              {tire.axleNumber != null && <MiniStat label="Eixo" value={String(tire.axleNumber)} />}
                              {tire.positionIndex != null && <MiniStat label="Posição" value={String(tire.positionIndex)} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* ---------- ABASTECIMENTOS ---------- */}
                <TabsContent value="abastecimentos" className="mt-4 space-y-3">
                  {fuelRecords.length === 0 ? (
                    <Alert className="bg-seguranca-graphite border-gray-600">
                      <AlertDescription className="text-sm text-gray-400">
                        Nenhum abastecimento registrado para este veículo.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400">Total abastecimentos</div>
                          <div className="text-xl font-bold text-seguranca-lightgray mt-1">{fuelRecords.length}</div>
                        </div>
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400">Total litros</div>
                          <div className="text-xl font-bold text-seguranca-lightgray mt-1">
                            {fuelRecords.reduce((a, r) => a + Number(r.quantity || 0), 0).toFixed(1)} L
                          </div>
                        </div>
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400">Total gasto</div>
                          <div className="text-xl font-bold text-seguranca-lightgray mt-1">
                            {fmtCurrency(fuelRecords.reduce((a, r) => a + Number(r.cost || 0), 0))}
                          </div>
                        </div>
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400">Média km/L</div>
                          <div className="text-xl font-bold text-seguranca-lightgray mt-1">
                            {(() => {
                              const recs = fuelRecords.filter(r => Number(r.quantity) > 0 && Number(r.mileage) > 0);
                              if (recs.length === 0) return '—';
                              const totalL = recs.reduce((a, r) => a + Number(r.quantity), 0);
                              const totalKm = recs.reduce((a, r) => a + Number(r.mileage), 0);
                              return `${(totalKm / totalL).toFixed(1)}`;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="w-full overflow-auto bg-seguranca-black border border-gray-600 rounded-lg">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-seguranca-graphite text-left text-xs text-gray-400">
                              <th className="p-3">Data</th>
                              <th className="p-3">Combustível</th>
                              <th className="p-3 text-right">Litros</th>
                              <th className="p-3 text-right">Custo</th>
                              <th className="p-3 text-right">KM</th>
                              <th className="p-3">Posto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fuelRecords.slice(0, 20).map((r: any) => (
                              <tr key={r.id} className="border-t border-gray-700 text-seguranca-lightgray">
                                <td className="p-3 text-xs">{fmtDate(r.date)}</td>
                                <td className="p-3 text-xs">{r.fuelType || r.combustivel || '—'}</td>
                                <td className="p-3 text-xs text-right">{Number(r.quantity || 0).toFixed(1)}</td>
                                <td className="p-3 text-xs text-right">{fmtCurrency(r.cost)}</td>
                                <td className="p-3 text-xs text-right">{r.mileage != null ? Number(r.mileage).toLocaleString('pt-BR') : '—'}</td>
                                <td className="p-3 text-xs">{r.station || r.posto || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* ---------- MULTAS ---------- */}
                <TabsContent value="multas" className="mt-4 space-y-3">
                  {fines.length === 0 ? (
                    <Alert className="bg-seguranca-graphite border-gray-600">
                      <AlertDescription className="text-sm text-gray-400">
                        Nenhuma multa registrada para este veículo.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400">Total multas</div>
                          <div className="text-xl font-bold text-seguranca-lightgray mt-1">{fines.length}</div>
                        </div>
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400">Valor total</div>
                          <div className="text-xl font-bold text-seguranca-lightgray mt-1">
                            {fmtCurrency(fines.reduce((a, f) => a + Number(f.amount || 0), 0))}
                          </div>
                        </div>
                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400">Pendentes</div>
                          <div className="text-xl font-bold text-seguranca-lightgray mt-1">
                            {fines.filter(f => f.status === 'PENDING').length}
                          </div>
                        </div>
                      </div>
                      <div className="w-full overflow-auto bg-seguranca-black border border-gray-600 rounded-lg">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-seguranca-graphite text-left text-xs text-gray-400">
                              <th className="p-3">Data</th>
                              <th className="p-3">Descrição</th>
                              <th className="p-3">Local</th>
                              <th className="p-3 text-right">Valor</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fines.slice(0, 20).map((f: any) => (
                              <tr key={f.id} className="border-t border-gray-700 text-seguranca-lightgray">
                                <td className="p-3 text-xs">{fmtDate(f.date)}</td>
                                <td className="p-3 text-xs">{f.description || f.tipo_infracao || '—'}</td>
                                <td className="p-3 text-xs">{f.location || '—'}</td>
                                <td className="p-3 text-xs text-right">{fmtCurrency(f.amount)}</td>
                                <td className="p-3">
                                  <Badge variant={f.status === 'PAID' ? 'default' : f.status === 'PENDING' ? 'secondary' : 'outline'}
                                    className={f.status === 'PAID' ? 'bg-green-700' : f.status === 'PENDING' ? 'bg-yellow-600' : 'border-gray-600 text-gray-300'}>
                                    {f.status || '—'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL QR CODE DO VEÍCULO ===== */}
      <VehicleQRCodeModal
        vehicleId={veiculo.id}
        plateFallback={merged.placa}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* ===== FORMULÁRIO NOVA OS (com veículo pré-selecionado) ===== */}
      <FleetWorkOrderForm
        isOpen={isOsFormOpen}
        onClose={() => setIsOsFormOpen(false)}
        onSuccess={() => {
          setIsOsFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
          loadAll();
        }}
        initialVehicleId={veiculo.id}
      />
    </div>,
    document.body
  );
};

// ==================== SUB-COMPONENTES ====================

const RowInfo: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex justify-between items-center gap-3">
    <span className="text-gray-400 text-xs">{label}</span>
    <span className={`text-seguranca-lightgray font-medium text-sm text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string; strong?: boolean; mono?: boolean }> = ({ label, value, strong, mono }) => (
  <div className="bg-seguranca-black/60 border border-gray-700 rounded-md px-3 py-2">
    <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
    <div className={`text-sm mt-0.5 text-seguranca-lightgray truncate ${strong ? 'font-bold text-seguranca-yellow' : ''} ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);

const renderVencimentoText = (days: number | null, label: string): string => {
  if (days === null) return '';
  if (days < 0) return ` ${label} vencido (${fmtDateShort(days)}d) ·`;
  if (days <= 30) return ` ${label} vence em ${days}d ·`;
  return '';
};

const fmtDateShort = (d: number) => String(Math.abs(d));

export default VehicleDetailPanel;
