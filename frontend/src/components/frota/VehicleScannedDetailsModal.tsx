import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  Fuel,
  MapPin,
  Calendar,
  FileText,
  Wrench,
  User,
  Building2,
  Route as RouteIcon,
  Handshake,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { VehicleQRCodeData } from '@/services/fleetService';

interface VehicleScannedDetailsModalProps {
  data: VehicleQRCodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkOrder?: (vehicleId: string, plate: string) => void;
}

export const VehicleScannedDetailsModal: React.FC<VehicleScannedDetailsModalProps> = ({
  data,
  isOpen,
  onClose,
  onOpenWorkOrder
}) => {
  const { toast } = useToast();
  // Visão padrão ativa por padrão ("standard" vs "full")
  const [activeView, setActiveView] = useState<'standard' | 'full'>('standard');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !data) return null;

  const handleCopySummary = () => {
    const summary = `VEÍCULO: ${data.plate} - ${data.brand} ${data.model} (${data.year})\n` +
      `STATUS: ${data.status}\n` +
      `KM ATUAL: ${data.currentMileage ? data.currentMileage.toLocaleString('pt-BR') + ' km' : 'Não informado'}\n` +
      `CLIENTE: ${data.clientName || 'Não vinculado'}\n` +
      `MOTORISTA: ${data.assignedDriver || data.driverName || 'Não atribuído'}\n` +
      `ÚLTIMA OS: ${data.lastOsNumber || data.lastWorkOrderNumber || 'Nenhuma'}\n` +
      (data.isAggregated ? `AGREGADO: ${data.aggregatedOwnerName || 'Sim'}\n` : '') +
      `LOCAL: ${data.currentLocation || data.garageName || 'Base'}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast({
      title: 'Resumo copiado!',
      description: 'Dados do veículo copiados para a área de transferência.'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'ACTIVE').toUpperCase();
    if (s === 'ACTIVE' || s === 'ATIVO') {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-0.5 text-xs flex items-center gap-1 shadow-sm">
          <CheckCircle2 className="h-3 w-3" />
          Ativo na Frota
        </Badge>
      );
    }
    if (s === 'MAINTENANCE' || s === 'MANUTENCAO' || s === 'EM_MANUTENCAO') {
      return (
        <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-0.5 text-xs flex items-center gap-1 shadow-sm">
          <Wrench className="h-3 w-3" />
          Em Manutenção
        </Badge>
      );
    }
    if (s === 'INACTIVE' || s === 'INATIVO') {
      return (
        <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-2.5 py-0.5 text-xs flex items-center gap-1 shadow-sm">
          <AlertTriangle className="h-3 w-3" />
          Inativo
        </Badge>
      );
    }
    return <Badge className="bg-slate-600 text-white text-xs">{status}</Badge>;
  };

  const getDocStatusBadge = (docStatus?: string, days?: number) => {
    if (docStatus === 'EXPIRED' || (days !== undefined && days < 0)) {
      return (
        <Badge className="bg-rose-600 text-white font-medium text-[11px] px-2 py-0.5 flex items-center gap-1">
          <ShieldAlert className="h-3 w-3" />
          Vencido ({Math.abs(days || 0)} dias atrás)
        </Badge>
      );
    }
    if (docStatus === 'EXPIRING_SOON' || (days !== undefined && days <= 30)) {
      return (
        <Badge className="bg-amber-500 text-black font-semibold text-[11px] px-2 py-0.5 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Vence em {days} dias
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-600 text-white font-medium text-[11px] px-2 py-0.5 flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        Válido {days ? `(${days} dias)` : ''}
      </Badge>
    );
  };

  const currentKmDisplay = data.currentMileage !== undefined
    ? `${data.currentMileage.toLocaleString('pt-BR')} km`
    : '—';

  const lastOsNumberDisplay = data.lastOsNumber || data.lastWorkOrderNumber || 'Nenhuma';
  const driverDisplay = data.assignedDriver || data.driverName || data.responsibleEmployeeName || 'Não atribuído';
  const clientDisplay = data.clientName || 'Frota Geral / Não informado';
  const locationDisplay = data.currentLocation || data.garageName || 'Garagem Base';

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-seguranca-black border border-gray-700/80 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* CABEÇALHO DO MODAL */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-gray-700 bg-seguranca-graphite shrink-0 gap-3">
          <div className="flex items-center gap-3">
            {/* Placa Mercosul estilizada */}
            <div className="flex flex-col items-center justify-center bg-white rounded-md border-2 border-gray-300 shadow overflow-hidden min-w-[105px]">
              <div className="bg-[#003399] w-full px-2 py-0.5 flex items-center justify-between">
                <span className="text-[8px] font-bold text-white tracking-widest uppercase">BRASIL</span>
                <span className="text-[7px] text-yellow-300 font-bold">BR</span>
              </div>
              <span className="text-black font-mono font-black text-base px-2 py-0.5 tracking-wider">
                {data.plate || 'SEM PLACA'}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-100">
                  {data.brand} {data.model}
                </h2>
                {data.year && (
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                    {data.year}
                  </span>
                )}
                {data.fleetNumber && (
                  <span className="text-xs text-seguranca-yellow bg-seguranca-yellow/10 border border-seguranca-yellow/30 px-2 py-0.5 rounded font-mono font-bold">
                    Frota #{data.fleetNumber}
                  </span>
                )}
                {getStatusBadge(data.status)}

                {/* SÓ APARECE SE FOR VEÍCULO DE AGREGADO */}
                {data.isAggregated && (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold px-2 py-0.5 text-xs flex items-center gap-1">
                    <Handshake className="h-3 w-3" />
                    Veículo Agregado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                <span>Passaporte Digital do Veículo</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono font-bold">{currentKmDisplay}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Alternador de Visão */}
            <div className="flex items-center bg-gray-800/90 rounded-lg p-0.5 border border-gray-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('standard')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeView === 'standard'
                    ? 'bg-seguranca-yellow text-seguranca-black font-bold shadow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Padrão
              </button>
              <button
                type="button"
                onClick={() => setActiveView('full')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeView === 'full'
                    ? 'bg-seguranca-yellow text-seguranca-black font-bold shadow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Completa
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full h-8 w-8 ml-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CORPO DO MODAL */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* ======================================================================= */}
          {/* VISÃO PADRÃO: 5 ITENS ESSENCIAIS EM DESTAQUE IMEDIATO                  */}
          {/* Placa, Status, KM atual, Documentação, Manutenção                      */}
          {/* ======================================================================= */}
          {activeView === 'standard' ? (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Informações Essenciais do Veículo</span>
                <span className="text-[11px] text-seguranca-yellow font-normal">
                  Visão Padrão de Identificação Rápida
                </span>
              </div>

              {/* Grid dos 5 cards principais da visão padrão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Placa & Identificação */}
                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Car className="h-4 w-4 text-seguranca-yellow" />
                      1. Placa & Modelo
                    </span>
                    <span className="font-mono text-seguranca-yellow font-bold text-sm">{data.plate}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-100">{data.brand} {data.model}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Ano: {data.year || '—'} {data.color ? `• ${data.color}` : ''} • {data.fuelType || 'FLEX'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-800/80 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Chassi: {data.chassisNumber ? `${data.chassisNumber.slice(0, 8)}...` : '—'}</span>
                    <span>Renavam: {data.renavan || '—'}</span>
                  </div>
                </div>

                {/* 2. Status Operacional */}
                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      2. Status Operacional
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div>{getStatusBadge(data.status)}</div>
                    <p className="text-xs text-gray-300 font-medium mt-1">
                      Garagem: <span className="text-gray-100 font-semibold">{data.garageName || 'Não informada'}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Alocado para: <span className="text-gray-200">{clientDisplay}</span>
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-800/80 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Motorista:</span>
                    <span className="text-gray-200 font-medium truncate max-w-[140px]">{driverDisplay}</span>
                  </div>
                </div>

                {/* 3. KM Atual */}
                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Gauge className="h-4 w-4 text-blue-400" />
                      3. KM Atual (Odômetro)
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-black text-blue-400 tracking-tight">
                      {currentKmDisplay}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Quilometragem consolidada registrada no sistema
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-800/80 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Último abastecimento:</span>
                    <span className="font-mono text-gray-300">
                      {data.lastFuelMileage ? `${data.lastFuelMileage.toLocaleString('pt-BR')} km` : '—'}
                    </span>
                  </div>
                </div>

                {/* 4. Documentação */}
                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-purple-400" />
                      4. Documentação & Seguro
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">CRLV / Licenciamento:</span>
                      {getDocStatusBadge(data.documentationStatus, data.documentationDaysRemaining)}
                    </div>
                    {data.documentationExpiryDate && (
                      <p className="text-[11px] text-gray-400">
                        Vencimento: <span className="font-medium text-gray-200">{new Date(data.documentationExpiryDate).toLocaleDateString('pt-BR')}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-800">
                      <span className="text-gray-400">Seguro Obrigatório:</span>
                      {getDocStatusBadge(data.insuranceStatus, data.insuranceDaysRemaining)}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-800/80 text-[11px] text-gray-400 truncate">
                    Seguradora: {data.insuranceCompany || 'Não informada'}
                  </div>
                </div>

                {/* 5. Manutenção */}
                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-seguranca-red" />
                      5. Manutenção (Preventivas & Última OS)
                    </span>
                    {data.preventiveOverdueCount && data.preventiveOverdueCount > 0 ? (
                      <Badge className="bg-rose-600 text-white font-bold text-xs animate-pulse">
                        {data.preventiveOverdueCount} preventiva(s) vencida(s)
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs">
                        {data.preventiveAlertsSummary || 'Preventivas em dia'}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-1">
                    <div className="bg-black/30 p-2.5 rounded-lg border border-gray-800">
                      <span className="text-gray-400 text-[11px] block">Última Ordem de Serviço (OS):</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold text-seguranca-yellow text-sm">
                          {lastOsNumberDisplay}
                        </span>
                        {data.lastOsType && (
                          <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-300">
                            {data.lastOsType}
                          </Badge>
                        )}
                        {data.lastOsStatus && (
                          <Badge className="bg-blue-600 text-white text-[10px]">
                            {data.lastOsStatus}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-[11px] mt-1">
                        Data: {data.lastOsDate ? new Date(data.lastOsDate).toLocaleDateString('pt-BR') : '—'} • Custo: {data.lastOsCost !== undefined ? data.lastOsCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                      </p>
                    </div>

                    <div className="bg-black/30 p-2.5 rounded-lg border border-gray-800">
                      <span className="text-gray-400 text-[11px] block">Controles Preventivos Ativos:</span>
                      {data.preventiveItems && data.preventiveItems.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {data.preventiveItems.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <span className="text-gray-200 truncate max-w-[130px]">{item.componentName}</span>
                              <span className={item.status === 'OVERDUE' ? 'text-rose-400 font-bold' : item.status === 'UPCOMING' ? 'text-amber-400' : 'text-emerald-400'}>
                                {item.remainingKm !== undefined ? `${item.remainingKm} km` : '—'}
                              </span>
                            </div>
                          ))}
                          {data.preventiveItems.length > 2 && (
                            <span className="text-[10px] text-gray-500 italic block">
                              + {data.preventiveItems.length - 2} outro(s) controle(s)
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-[11px] mt-1 italic">Nenhum controle preventivo pendente.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {data.lastOsMaintenancePerformed ? `Serviço: "${data.lastOsMaintenancePerformed.slice(0, 60)}..."` : 'Sem observações na última OS'}
                    </span>
                    {onOpenWorkOrder && (
                      <Button
                        size="sm"
                        onClick={() => onOpenWorkOrder(data.id || data.vehicleId || '', data.plate)}
                        className="bg-seguranca-red hover:bg-red-700 text-white font-medium text-xs h-7 px-2.5 flex items-center gap-1"
                      >
                        <Wrench className="h-3 w-3" />
                        Abrir OS
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner convite para visão completa */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <ExternalLink className="h-4 w-4 text-seguranca-yellow" />
                  <span>
                    Deseja visualizar motorista, histórico de abastecimento, rotas executadas e localização?
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveView('full')}
                  className="border-seguranca-yellow/50 text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black text-xs font-semibold h-7"
                >
                  Ver Visão Completa
                </Button>
              </div>
            </div>
          ) : (
            /* ======================================================================= */
            /* VISÃO COMPLETA: TODAS AS 11 PRINCIPAIS INFORMAÇÕES DETALHADAS          */
            /* ======================================================================= */
            <div className="space-y-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Passaporte Completo do Veículo</span>
                <span className="text-[11px] text-gray-400">11 Dimensões Operacionais</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. MOTORISTA ATUAL */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                    <User className="h-4 w-4" />
                    <span>1. Motorista Atual / Condutor</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-100 text-base">{driverDisplay}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-2">
                      <div>
                        <span>CNH: </span>
                        <span className="text-gray-200 font-mono">{data.driverCnh || data.driverLicenseNumber || 'Não informada'}</span>
                      </div>
                      <div>
                        <span>CPF: </span>
                        <span className="text-gray-200 font-mono">{data.driverCpf || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. STATUS OPERACIONAL */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>2. Status Operacional & Garagem</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Status:</span>
                      {getStatusBadge(data.status)}
                    </div>
                    <p className="text-gray-300">
                      Garagem Base: <strong className="text-gray-100">{data.garageName || 'Não informada'}</strong>
                    </p>
                    {data.garageAddress && (
                      <p className="text-gray-400 text-[11px]">{data.garageAddress}</p>
                    )}
                  </div>
                </div>

                {/* 3. CLIENTE ATENDIDO / OBRA */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    <Building2 className="h-4 w-4" />
                    <span>3. Cliente Atendido / Obra</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-gray-100 text-sm">{clientDisplay}</p>
                    {data.clientCnpj && <p className="text-gray-400">CNPJ: {data.clientCnpj}</p>}
                    <p className="text-gray-300">
                      Obra / Posto: <strong className="text-gray-100">{data.workPostName || 'Frota Geral'}</strong>
                    </p>
                    {data.contractNumber && (
                      <p className="text-gray-400">Contrato: {data.contractNumber}</p>
                    )}
                  </div>
                </div>

                {/* 4. ÚLTIMO ABASTECIMENTO */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-seguranca-yellow">
                    <Fuel className="h-4 w-4" />
                    <span>4. Último Abastecimento</span>
                  </div>
                  {data.lastFuelDate ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Data: </span>
                        <span className="font-medium text-gray-200">
                          {new Date(data.lastFuelDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Combustível: </span>
                        <span className="font-medium text-gray-200">{data.lastFuelType || data.fuelType || 'DIESEL'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Litros: </span>
                        <span className="font-mono font-bold text-gray-100">{data.lastFuelLiters ? `${data.lastFuelLiters} L` : '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Valor Total: </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {data.lastFuelCost !== undefined
                            ? data.lastFuelCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : '—'}
                        </span>
                      </div>
                      <div className="col-span-2 text-gray-400">
                        Posto: <strong className="text-gray-200">{data.lastFuelStation || 'Posto Interno'}</strong>
                        {data.lastFuelMileage && ` • Odômetro: ${data.lastFuelMileage.toLocaleString('pt-BR')} km`}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Nenhum abastecimento registrado no sistema.</p>
                  )}
                </div>

                {/* 5. KM ATUAL */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                    <Gauge className="h-4 w-4" />
                    <span>5. KM Atual do Veículo</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-mono font-black text-blue-400">{currentKmDisplay}</span>
                    <span className="text-xs text-gray-400">Odômetro ativo</span>
                  </div>
                </div>

                {/* 6. VENCIMENTOS (PREVENTIVAS) */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-400">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      6. Vencimentos Preventivos
                    </span>
                    <span className="text-[11px] font-normal text-gray-400">
                      {data.preventiveItems?.length || 0} controle(s)
                    </span>
                  </div>
                  {data.preventiveItems && data.preventiveItems.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {data.preventiveItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-black/40 p-1.5 rounded border border-gray-800"
                        >
                          <div>
                            <span className="font-medium text-gray-200">{item.componentName}</span>
                            <span className="text-[10px] text-gray-400 block">
                              Próx: {item.nextDueKm ? `${item.nextDueKm.toLocaleString('pt-BR')} km` : '—'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-mono font-bold text-xs ${
                                item.status === 'OVERDUE'
                                  ? 'text-rose-400'
                                  : item.status === 'UPCOMING'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {item.status === 'OVERDUE'
                                ? `VENCIDO (${Math.abs(item.remainingKm || 0)} km)`
                                : `${item.remainingKm} km falta`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Nenhum componente vencido ou a vencer.</p>
                  )}
                </div>

                {/* 7. GESTÃO DE AGREGADO - SÓ APARECE SE FOR VEÍCULO DE AGREGADO! */}
                {data.isAggregated && (
                  <div className="bg-amber-950/30 border-2 border-amber-500/50 p-4 rounded-xl space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-300">
                      <span className="flex items-center gap-2">
                        <Handshake className="h-4 w-4" />
                        7. Dados do Veículo Agregado (Terceiro)
                      </span>
                      <Badge className="bg-amber-500 text-black font-bold text-xs">AGREGADO</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-2">
                      <div>
                        <span className="text-gray-400 block">Proprietário / Titular:</span>
                        <strong className="text-gray-100 text-sm">{data.aggregatedOwnerName || 'Não informado'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">CPF / CNPJ:</span>
                        <span className="font-mono text-gray-200">{data.aggregatedOwnerCpfCnpj || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Contato / Telefone:</span>
                        <span className="text-gray-200">{data.aggregatedOwnerPhone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Vigência do Contrato:</span>
                        <span className="text-gray-200">
                          {data.aggregatedContractStartDate ? new Date(data.aggregatedContractStartDate).toLocaleDateString('pt-BR') : '—'} até {data.aggregatedContractEndDate ? new Date(data.aggregatedContractEndDate).toLocaleDateString('pt-BR') : 'Indeterminado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Taxa Diária / Mensalidade:</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {data.aggregatedDailyRate ? `Diária: ${data.aggregatedDailyRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                          {data.aggregatedDailyRate && data.aggregatedMonthlyRate ? ' • ' : ''}
                          {data.aggregatedMonthlyRate ? `Mês: ${data.aggregatedMonthlyRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                          {!data.aggregatedDailyRate && !data.aggregatedMonthlyRate ? 'A combinar' : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Tipo de Pagamento:</span>
                        <span className="text-gray-200">{data.aggregatedPaymentType || 'MENSAL'}</span>
                      </div>
                    </div>
                    {data.aggregatedNotes && (
                      <p className="text-[11px] text-gray-400 bg-black/40 p-2 rounded border border-amber-900/40 italic mt-1">
                        Obs: "{data.aggregatedNotes}"
                      </p>
                    )}
                  </div>
                )}

                {/* 8. ÚLTIMA ORDEM DE SERVIÇO (OS) */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-seguranca-red">
                    <span className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      8. Última Ordem de Serviço (OS)
                    </span>
                    <span className="font-mono text-seguranca-yellow font-bold text-sm">
                      {lastOsNumberDisplay}
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Tipo:</span>
                      <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-200">
                        {data.lastOsType || data.lastWorkOrderType || 'Geral'}
                      </Badge>
                      <span className="text-gray-400 ml-2">Status:</span>
                      <Badge className="bg-blue-600 text-white text-[10px]">
                        {data.lastOsStatus || data.lastWorkOrderStatus || 'Concluída'}
                      </Badge>
                    </div>
                    <p className="text-gray-400">
                      Data: <strong className="text-gray-200">{data.lastOsDate ? new Date(data.lastOsDate).toLocaleDateString('pt-BR') : '—'}</strong>
                      {' • '}
                      Custo: <span className="font-mono font-semibold text-emerald-400">{data.lastOsCost !== undefined ? data.lastOsCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}</span>
                    </p>
                    {data.lastOsMaintenancePerformed && (
                      <p className="text-gray-400 text-[11px] italic bg-black/30 p-2 rounded border border-gray-800">
                        "{data.lastOsMaintenancePerformed}"
                      </p>
                    )}
                  </div>
                </div>

                {/* 9. DOCUMENTOS (CRLV, SEGURO, CHASSI) */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    <FileText className="h-4 w-4" />
                    <span>9. Documentos & Vistorias</span>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">CRLV Digital:</span>
                      {getDocStatusBadge(data.documentationStatus, data.documentationDaysRemaining)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Seguro de Frota:</span>
                      {getDocStatusBadge(data.insuranceStatus, data.insuranceDaysRemaining)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pt-1 border-t border-gray-800">
                      <div>Chassi: <strong className="text-gray-200 font-mono">{data.chassisNumber || '—'}</strong></div>
                      <div>Renavam: <strong className="text-gray-200 font-mono">{data.renavan || '—'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* 10. ÚLTIMA ROTA EXECUTADA */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
                    <RouteIcon className="h-4 w-4" />
                    <span>10. Última Rota / Viagem Executada</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-gray-100 text-sm">
                      {data.lastRouteCode ? `[${data.lastRouteCode}] ` : ''}
                      {data.lastRouteName || 'Rota não informada / Sem registro recente'}
                    </p>
                    {data.lastTripDate && (
                      <p className="text-gray-400">
                        Data: {new Date(data.lastTripDate).toLocaleDateString('pt-BR')}
                        {data.lastTripDriverName && ` • Condutor: ${data.lastTripDriverName}`}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                      <span>KM Inicial: {data.lastTripInitialKm ? `${data.lastTripInitialKm.toLocaleString('pt-BR')} km` : '—'}</span>
                      <span>KM Final: {data.lastTripFinalKm ? `${data.lastTripFinalKm.toLocaleString('pt-BR')} km` : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* 11. LOCALIZAÇÃO ATUAL */}
                <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
                    <MapPin className="h-4 w-4" />
                    <span>11. Localização Atual / Base</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-gray-100 text-sm">{locationDisplay}</p>
                    {data.garageAddress && <p className="text-gray-400">{data.garageAddress}</p>}
                    {data.currentLatitude && data.currentLongitude && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="font-mono text-gray-400 text-[11px]">
                          GPS: {data.currentLatitude.toFixed(5)}, {data.currentLongitude.toFixed(5)}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${data.currentLatitude},${data.currentLongitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1 underline"
                        >
                          Ver no Mapa <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RODAPÉ DO MODAL */}
        {/* ========================================================================= */}
        <div className="px-5 py-3 border-t border-gray-700 bg-seguranca-graphite flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopySummary}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs h-8 flex items-center gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Resumo'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWorkOrder && (
              <Button
                size="sm"
                onClick={() => onOpenWorkOrder(data.id || data.vehicleId || '', data.plate)}
                className="bg-seguranca-red hover:bg-red-700 text-white font-medium text-xs h-8 px-3 flex items-center gap-1.5 shadow"
              >
                <Wrench className="h-3.5 w-3.5" />
                Criar / Abrir OS
              </Button>
            )}
            <Button
              size="sm"
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white text-xs h-8 px-4 font-semibold"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VehicleScannedDetailsModal;

