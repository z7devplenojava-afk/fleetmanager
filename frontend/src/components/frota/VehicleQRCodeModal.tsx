import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  X, 
  Loader2, 
  Car, 
  Building2, 
  Warehouse, 
  UserCheck, 
  Wrench, 
  Gauge, 
  Fuel, 
  Calendar, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import fleetService, { VehicleQRCodeData } from '@/services/fleetService';
import api from '@/lib/axios';

interface VehicleQRCodeModalProps {
  vehicleId: string | null;
  isOpen: boolean;
  onClose: () => void;
  plateFallback?: string;
}

export const VehicleQRCodeModal: React.FC<VehicleQRCodeModalProps> = ({
  vehicleId,
  isOpen,
  onClose,
  plateFallback
}) => {
  const { toast } = useToast();
  const [data, setData] = useState<VehicleQRCodeData | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !vehicleId) {
      setData(null);
      setQrImageUrl(null);
      return;
    }

    const loadQRData = async () => {
      setLoading(true);
      try {
        const qrData = await fleetService.getVehicleQRCodeData(vehicleId);
        setData(qrData);

        // Carregar imagem do QR Code como Blob para permitir download direto e preview seguro
        try {
          const imgRes = await api.get(`/api/vehicles/${vehicleId}/qrcode/image?width=350&height=350`, {
            responseType: 'blob'
          });
          const url = URL.createObjectURL(imgRes.data);
          setQrImageUrl(url);
        } catch (imgErr) {
          console.error('Erro ao carregar imagem direta do QR Code:', imgErr);
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados do QR Code do veículo:', err);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as informações do QR Code.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadQRData();

    return () => {
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
  }, [isOpen, vehicleId]);

  if (!isOpen) return null;

  const handleCopyPayload = () => {
    if (!data?.qrCodeTextPayload) return;
    navigator.clipboard.writeText(data.qrCodeTextPayload);
    setCopied(true);
    toast({
      title: 'Copiado!',
      description: 'Dados do passaporte do veículo copiados para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadImage = () => {
    if (!qrImageUrl) return;
    const a = document.createElement('a');
    a.href = qrImageUrl;
    a.download = `QRCode_Veiculo_${data?.plate || plateFallback || 'veiculo'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({
      title: 'Download iniciado',
      description: `QR Code do veículo ${data?.plate || ''} baixado com sucesso.`
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status?: string) => {
    const s = status?.toUpperCase() || 'ACTIVE';
    if (s === 'ACTIVE' || s === 'ATIVO') {
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">Ativo na Frota</Badge>;
    }
    if (s === 'MAINTENANCE' || s === 'MANUTENCAO') {
      return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-medium">Em Manutenção</Badge>;
    }
    if (s === 'INACTIVE' || s === 'INATIVO') {
      return <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-medium">Inativo</Badge>;
    }
    return <Badge className="bg-slate-600 text-white font-medium">{status}</Badge>;
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Container Principal */}
      <div 
        className="bg-seguranca-black border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-gray-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Estilo para Impressão */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-vehicle-badge, #printable-vehicle-badge * {
              visibility: visible !important;
            }
            #printable-vehicle-badge {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              height: auto !important;
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
              color: black !important;
              display: block !important;
              z-index: 9999999 !important;
            }
          }
        `}</style>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-seguranca-graphite shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-seguranca-yellow/20 border border-seguranca-yellow/50 flex items-center justify-center text-seguranca-yellow">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-seguranca-lightgray tracking-wide">
                  Passaporte & QR Code Veicular
                </h3>
                {data?.plate && (
                  <span className="px-2 py-0.5 rounded bg-seguranca-yellow text-seguranca-black font-mono font-bold text-xs tracking-wider">
                    {data.plate}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Identificação digital com Garagem, Cliente, Motorista, Status e Histórico de Manutenção
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-seguranca-yellow" />
              <p className="text-gray-400 text-sm">Gerando QR Code e compilando informações do veículo...</p>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Coluna Esquerda: QR Code & Ações */}
              <div className="md:col-span-5 flex flex-col items-center justify-center bg-gray-900/80 p-5 rounded-xl border border-gray-800 shadow-inner text-center">
                <div className="relative p-3 bg-white rounded-2xl shadow-xl border-4 border-seguranca-yellow/30 max-w-[260px] w-full flex items-center justify-center">
                  {qrImageUrl ? (
                    <img 
                      src={qrImageUrl} 
                      alt={`QR Code ${data.plate}`} 
                      className="w-full h-auto object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center text-gray-400">
                      <QrCode className="h-16 w-16 mb-2 text-gray-300" />
                      <span className="text-xs">QR Code indisponível</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-xs font-mono text-gray-400">Placa:</span>
                  <span className="font-mono font-bold text-sm text-seguranca-yellow">{data.plate}</span>
                  {data.status && getStatusBadge(data.status)}
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
                  <Button
                    size="sm"
                    onClick={handleDownloadImage}
                    className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 font-semibold text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Baixar PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrint}
                    className="border-gray-600 text-gray-200 hover:bg-gray-800 font-medium text-xs flex items-center justify-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Imprimir Crachá
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyPayload}
                  className="w-full mt-2 text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Conteúdo copiado!' : 'Copiar dados brutos do QR'}
                </Button>
              </div>

              {/* Coluna Direita: Cards de Informações do Veículo */}
              <div className="md:col-span-7 space-y-4">
                {/* 1. Dados Básicos do Veículo */}
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    <Car className="h-4 w-4 text-seguranca-yellow" />
                    <span>Identificação do Veículo</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-[11px] text-gray-400">Marca / Modelo</p>
                      <p className="font-semibold text-gray-100">{data.brand} {data.model}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Ano / Cor</p>
                      <p className="font-medium text-gray-200">{data.year} {data.color ? `• ${data.color}` : ''}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Combustível</p>
                      <p className="font-medium text-gray-200">{data.fuelType || 'FLEX'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">KM Atual</p>
                      <p className="font-mono font-bold text-blue-400">
                        {data.currentMileage !== undefined ? `${data.currentMileage.toLocaleString('pt-BR')} km` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Status Operacional</p>
                      <p className="font-medium">{getStatusBadge(data.status)}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Garagem & Pátio Alocado */}
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    <Warehouse className="h-4 w-4 text-emerald-400" />
                    <span>Garagem & Base Operacional</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-100">
                      {data.garageName || 'Nenhuma garagem ou pátio alocado'}
                    </p>
                    {data.garageAddress && (
                      <p className="text-xs text-gray-400 mt-0.5">{data.garageAddress}</p>
                    )}
                  </div>
                </div>

                {/* 3. Cliente & Posto de Trabalho */}
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    <Building2 className="h-4 w-4 text-cyan-400" />
                    <span>Cliente & Posto de Trabalho</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[11px] text-gray-400">Cliente / Contrato</p>
                      <p className="font-semibold text-gray-200">{data.clientName || 'Geral / Não informado'}</p>
                      {data.clientCnpj && <p className="text-[10px] text-gray-400">CNPJ: {data.clientCnpj}</p>}
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Obra / Posto</p>
                      <p className="font-semibold text-gray-200">{data.workPostName || 'Frota Geral'}</p>
                      {data.workPostCode && <p className="text-[10px] text-gray-400">Cód: {data.workPostCode}</p>}
                    </div>
                  </div>
                </div>

                {/* 4. Motorista Responsável */}
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    <UserCheck className="h-4 w-4 text-purple-400" />
                    <span>Motorista / Condutor Responsável</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-100">
                      {data.driverName || 'Nenhum motorista alocado no momento'}
                    </p>
                    {(data.driverLicenseNumber || data.driverCpf) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {data.driverLicenseNumber ? `CNH: ${data.driverLicenseNumber}` : ''}
                        {data.driverLicenseNumber && data.driverCpf ? ' • ' : ''}
                        {data.driverCpf ? `CPF: ${data.driverCpf}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. Última Ordem de Serviço (OS) */}
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    <Wrench className="h-4 w-4 text-seguranca-red" />
                    <span>Última Ordem de Serviço (OS)</span>
                  </div>
                  {data.lastWorkOrderNumber ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-seguranca-yellow text-sm">
                          OS #{data.lastWorkOrderNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          {data.lastWorkOrderType && (
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {data.lastWorkOrderType}
                            </Badge>
                          )}
                          {data.lastWorkOrderStatus && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              {data.lastWorkOrderStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                        <div>
                          <span className="text-gray-400">Data de Abertura: </span>
                          <span className="font-medium">
                            {data.lastWorkOrderDate ? new Date(data.lastWorkOrderDate).toLocaleDateString('pt-BR') : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Valor Total: </span>
                          <span className="font-mono font-semibold text-emerald-400">
                            {data.lastWorkOrderCost !== undefined
                              ? data.lastWorkOrderCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                              : 'R$ 0,00'}
                          </span>
                        </div>
                      </div>
                      {data.lastWorkOrderDescription && (
                        <p className="text-xs text-gray-400 line-clamp-2 italic bg-black/30 p-2 rounded border border-gray-800">
                          "{data.lastWorkOrderDescription}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Nenhuma Ordem de Serviço registrada para este veículo.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 text-rose-500" />
              <p>Não foi possível obter os dados deste veículo.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-700 bg-seguranca-graphite flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-400">
            {data?.qrCodeGeneratedAt 
              ? `Gerado em: ${new Date(data.qrCodeGeneratedAt).toLocaleString('pt-BR')}`
              : 'FleetManager • Sistema Integrado de Gestão de Frotas'}
          </span>
          <Button
            size="sm"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-4"
          >
            Fechar
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* CRACHÁ / ETIQUETA IMPRESSA DE ALTA DEFINIÇÃO (Printable Badge) */}
        {/* ========================================================================= */}
        <div id="printable-vehicle-badge" className="hidden" ref={printRef}>
          {data && (
            <div style={{
              maxWidth: '500px',
              margin: '0 auto',
              padding: '24px',
              border: '3px solid #111827',
              borderRadius: '16px',
              fontFamily: 'Arial, sans-serif',
              backgroundColor: '#ffffff',
              color: '#111827'
            }}>
              {/* Header Crachá */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Identificação Veicular
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280' }}>
                    FleetManager • Gestão de Frotas
                  </p>
                </div>
                <div style={{
                  padding: '6px 14px',
                  backgroundColor: '#fef08a',
                  border: '2px solid #ca8a04',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  color: '#854d0e'
                }}>
                  {data.plate}
                </div>
              </div>

              {/* Corpo: QR Code e Dados */}
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                {qrImageUrl && (
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <img 
                      src={qrImageUrl} 
                      alt={`QR Code ${data.plate}`} 
                      style={{ width: '150px', height: '150px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
                    />
                    <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>Aponte a câmera</div>
                  </div>
                )}
                <div style={{ flex: 1, fontSize: '12px', lineHeight: '1.5' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Veículo:</strong> {data.brand} {data.model} ({data.year})
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Garagem:</strong> {data.garageName || 'Matriz / Central'}
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Cliente / Posto:</strong> {data.clientName || 'Frota Geral'} {data.workPostName ? `• ${data.workPostName}` : ''}
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Motorista:</strong> {data.driverName || 'Não atribuído'}
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Última OS:</strong> {data.lastWorkOrderNumber ? `#${data.lastWorkOrderNumber} (${data.lastWorkOrderStatus || 'Finalizada'})` : 'Nenhuma'}
                  </div>
                  <div>
                    <strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{data.status}</span>
                  </div>
                </div>
              </div>

              {/* Rodapé Crachá */}
              <div style={{ borderTop: '1px dashed #d1d5db', marginTop: '16px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#6b7280' }}>
                <span>Documento oficial de bordo</span>
                <span>Impresso em: {new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VehicleQRCodeModal;
