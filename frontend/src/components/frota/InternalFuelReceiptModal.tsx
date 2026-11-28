import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Receipt, Scissors } from 'lucide-react';

export interface InternalFuelReceiptData {
  fuelRecordId?: string;
  fuelCode?: string;
  date: string;
  garageName?: string;
  pumpName?: string;
  tankName?: string;
  responsibleName?: string;
  vehiclePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  clientName?: string;
  obraName?: string;
  fuelType: string;
  initialMileage?: number;
  mileage: number;
  liters: number;
  dieselPricePerLiter?: number;
  dieselCost?: number;
  hasArla?: boolean;
  arlaLiters?: number;
  arlaPricePerLiter?: number;
  arlaCost?: number;
  totalCost?: number;
  notes?: string;
  companyName?: string;
  companyCnpj?: string;
}

interface InternalFuelReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InternalFuelReceiptData | null;
}

export const InternalFuelReceiptModal: React.FC<InternalFuelReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [printFormat, setPrintFormat] = useState<'A4' | 'THERMAL_80MM'>('A4');

  if (!data) return null;

  const kmTraveled =
    data.mileage && data.initialMileage && data.mileage > data.initialMileage
      ? data.mileage - data.initialMileage
      : null;

  const dieselTotal = data.dieselCost || (data.dieselPricePerLiter && data.liters ? data.liters * data.dieselPricePerLiter : 0);
  const arlaTotal = data.arlaCost || (data.arlaPricePerLiter && data.arlaLiters ? data.arlaLiters * data.arlaPricePerLiter : 0);
  const grandTotal = (data.totalCost && data.totalCost > 0) ? data.totalCost : (dieselTotal + arlaTotal);

  const formattedDate = data.date
    ? new Date(data.date + (data.date.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  const handlePrint = () => {
    window.print();
  };

  const renderReceiptContent = (viaTitle: string) => (
    <div className="receipt-via border border-gray-300 rounded p-4 bg-white text-black text-xs leading-relaxed">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start border-b border-gray-400 pb-2 mb-2">
        <div>
          <h2 className="font-bold text-sm tracking-wide text-gray-900 uppercase">
            {data.companyName || 'VIAÇÃO SÃO SILVESTRE S.A.'}
          </h2>
          <p className="text-[10px] text-gray-600">SISTEMA INTEGRADO DE GESTÃO DE FROTAS — FLUXBUS</p>
          <p className="text-[10px] text-gray-500 font-medium">COMPROVANTE DE ABASTECIMENTO INTERNO</p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-gray-200 border border-gray-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase text-gray-800">
            {viaTitle}
          </span>
          <p className="text-[10px] text-gray-700 font-semibold mt-1">
            CÓD: {data.fuelCode || data.fuelRecordId?.substring(0, 8).toUpperCase() || 'INT-' + Math.floor(100000 + Math.random() * 900000)}
          </p>
          <p className="text-[10px] text-gray-500">Data: {formattedDate}</p>
        </div>
      </div>

      {/* Grid de Informações Básicas */}
      <div className="grid grid-cols-2 gap-2 mb-2 text-[11px] bg-gray-50 p-2 rounded border border-gray-200">
        <div>
          <span className="font-semibold text-gray-700">Garagem: </span>
          <span className="text-gray-900">{data.garageName || 'Garagem Moeda - MG'}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Bomba / Tanque: </span>
          <span className="text-gray-900">{data.pumpName || 'Bomba Diesel 01'} {data.tankName ? `(${data.tankName})` : ''}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Veículo: </span>
          <span className="font-bold text-gray-950">{data.vehiclePlate}</span>
          {(data.vehicleBrand || data.vehicleModel) && (
            <span className="text-gray-600"> — {data.vehicleBrand} {data.vehicleModel}</span>
          )}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Responsável / Motorista: </span>
          <span className="text-gray-900 font-medium">{data.responsibleName || 'Não Informado'}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Cliente: </span>
          <span className="text-gray-900">{data.clientName || '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Obra / Setor: </span>
          <span className="text-gray-900">{data.obraName || '—'}</span>
        </div>
      </div>

      {/* Tabela de Odômetro */}
      <div className="grid grid-cols-3 gap-2 mb-2 text-center bg-gray-100 p-1.5 rounded border border-gray-300 font-mono text-[11px]">
        <div>
          <span className="text-[10px] text-gray-500 block uppercase font-sans">KM Anterior</span>
          <span className="font-bold text-gray-800">
            {data.initialMileage ? `${data.initialMileage.toLocaleString('pt-BR')} km` : '—'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 block uppercase font-sans">KM Atual (Abast.)</span>
          <span className="font-bold text-blue-900">
            {data.mileage ? `${data.mileage.toLocaleString('pt-BR')} km` : '—'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 block uppercase font-sans">KM Rodado</span>
          <span className="font-bold text-emerald-800">
            {kmTraveled !== null ? `+${kmTraveled.toLocaleString('pt-BR')} km` : '—'}
          </span>
        </div>
      </div>

      {/* Detalhamento dos Itens Abastecidos */}
      <table className="w-full text-left border-collapse border border-gray-300 mb-2 text-[11px]">
        <thead>
          <tr className="bg-gray-200 text-gray-800 font-bold border-b border-gray-300">
            <th className="p-1.5 border-r border-gray-300">Item / Combustível</th>
            <th className="p-1.5 text-right border-r border-gray-300">Qtd (Litros)</th>
            <th className="p-1.5 text-right border-r border-gray-300">Preço/L (R$)</th>
            <th className="p-1.5 text-right">Subtotal (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="p-1.5 border-r border-gray-200 font-medium">
              {data.fuelType === 'DIESEL' ? 'Óleo Diesel S10' : data.fuelType}
            </td>
            <td className="p-1.5 text-right border-r border-gray-200 font-semibold font-mono">
              {data.liters.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
            </td>
            <td className="p-1.5 text-right border-r border-gray-200 font-mono">
              {data.dieselPricePerLiter ? `R$ ${data.dieselPricePerLiter.toFixed(2)}` : '—'}
            </td>
            <td className="p-1.5 text-right font-mono font-medium">
              {dieselTotal > 0 ? `R$ ${dieselTotal.toFixed(2)}` : '—'}
            </td>
          </tr>
          {data.hasArla && data.arlaLiters && data.arlaLiters > 0 ? (
            <tr className="border-b border-gray-200 bg-blue-50/40">
              <td className="p-1.5 border-r border-gray-200 font-medium text-blue-900">
                Aditivo ARLA 32 (Conjugado)
              </td>
              <td className="p-1.5 text-right border-r border-gray-200 font-semibold text-blue-900 font-mono">
                {data.arlaLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} L
              </td>
              <td className="p-1.5 text-right border-r border-gray-200 font-mono">
                {data.arlaPricePerLiter ? `R$ ${data.arlaPricePerLiter.toFixed(2)}` : '—'}
              </td>
              <td className="p-1.5 text-right font-mono font-medium text-blue-900">
                {arlaTotal > 0 ? `R$ ${arlaTotal.toFixed(2)}` : '—'}
              </td>
            </tr>
          ) : null}
          <tr className="bg-gray-100 font-bold border-t border-gray-400">
            <td className="p-1.5 uppercase" colSpan={3}>
              Total Consolidado
            </td>
            <td className="p-1.5 text-right font-mono text-sm text-gray-950">
              {grandTotal > 0 ? `R$ ${grandTotal.toFixed(2)}` : `${(data.liters + (data.arlaLiters || 0)).toFixed(2)} L`}
            </td>
          </tr>
        </tbody>
      </table>

      {data.notes && (
        <div className="mb-3 text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-200">
          <span className="font-semibold text-gray-700">Obs: </span>
          {data.notes}
        </div>
      )}

      {/* Linhas de Assinatura */}
      <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-300 text-center text-[10px]">
        <div>
          <div className="border-b border-gray-500 w-4/5 mx-auto mb-1"></div>
          <p className="font-semibold text-gray-800">Abastecedor / Resp. Garagem</p>
          <p className="text-gray-500">{data.responsibleName || 'Visto'}</p>
        </div>
        <div>
          <div className="border-b border-gray-500 w-4/5 mx-auto mb-1"></div>
          <p className="font-semibold text-gray-800">Motorista / Condutor</p>
          <p className="text-gray-500">{data.vehiclePlate}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-gray-950 border-gray-800 text-white">
        {/* Header com Ações */}
        <DialogHeader className="p-4 border-b border-gray-800 bg-gray-900/80 flex-none flex flex-row items-center justify-between no-print">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
            <Receipt className="h-5 w-5 text-emerald-400" />
            Comprovante de Abastecimento Interno
          </DialogTitle>
          <div className="flex items-center gap-2">
            {/* Seletor de Formato */}
            <div className="flex items-center bg-gray-800 p-0.5 rounded-lg border border-gray-700">
              <Button
                size="sm"
                variant={printFormat === 'A4' ? 'secondary' : 'ghost'}
                onClick={() => setPrintFormat('A4')}
                className={`h-7 px-2.5 text-xs font-medium gap-1.5 ${
                  printFormat === 'A4' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'text-gray-300'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Folha A4 (2 Vias)
              </Button>
              <Button
                size="sm"
                variant={printFormat === 'THERMAL_80MM' ? 'secondary' : 'ghost'}
                onClick={() => setPrintFormat('THERMAL_80MM')}
                className={`h-7 px-2.5 text-xs font-medium gap-1.5 ${
                  printFormat === 'THERMAL_80MM' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'text-gray-300'
                }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                Cupom 80mm
              </Button>
            </div>

            {/* Botão Imprimir */}
            <Button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>

        {/* Corpo do Documento */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 flex justify-center print-area">
          {printFormat === 'A4' ? (
            /* Modelo A4 (2 Vias Destacáveis) */
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 space-y-6 printable-receipt printable-a4">
              {/* 1ª VIA: CONTROLE GARAGEM */}
              {renderReceiptContent('1ª VIA — CONTROLE DA GARAGEM / ALMOXARIFADO')}

              {/* Linha Tracejada de Corte */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="border-t-2 border-dashed border-gray-400 w-full"></div>
                <div className="absolute bg-white px-3 flex items-center gap-1.5 text-gray-500 text-[10px] uppercase font-mono tracking-wider">
                  <Scissors className="h-3.5 w-3.5" />
                  Destacar aqui (2 Vias)
                </div>
              </div>

              {/* 2ª VIA: MOTORISTA */}
              {renderReceiptContent('2ª VIA — MOTORISTA / CONTROLE DE VEÍCULO')}
            </div>
          ) : (
            /* Modelo Cupom Térmico 80mm */
            <div className="w-[320px] bg-white text-black p-4 font-mono text-[11px] leading-tight shadow-xl rounded printable-receipt printable-thermal">
              <div className="text-center pb-2 mb-2 border-b border-dashed border-gray-400">
                <p className="font-bold text-xs uppercase">{data.companyName || 'VIAÇÃO SÃO SILVESTRE S.A.'}</p>
                <p className="text-[10px]">GESTÃO INTEGRADA DE FROTAS</p>
                <p className="text-[10px] font-bold mt-1">*** RECIBO DE ABASTECIMENTO ***</p>
                <p className="text-[9px] text-gray-600">
                  CÓD: {data.fuelCode || data.fuelRecordId?.substring(0, 8).toUpperCase() || 'INT-' + Math.floor(100000 + Math.random() * 900000)}
                </p>
                <p className="text-[9px] text-gray-600">DATA: {formattedDate}</p>
              </div>

              <div className="space-y-1 mb-2 border-b border-dashed border-gray-400 pb-2">
                <div className="flex justify-between">
                  <span>GARAGEM:</span>
                  <span className="font-bold">{data.garageName || 'Moeda - MG'}</span>
                </div>
                <div className="flex justify-between">
                  <span>BOMBA/TANQUE:</span>
                  <span>{data.pumpName || 'Bomba 01'}</span>
                </div>
                <div className="flex justify-between">
                  <span>VEÍCULO:</span>
                  <span className="font-bold text-xs">{data.vehiclePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span>CONDUTOR:</span>
                  <span className="truncate max-w-[170px]">{data.responsibleName || 'N/I'}</span>
                </div>
                {data.clientName && (
                  <div className="flex justify-between">
                    <span>CLIENTE:</span>
                    <span className="truncate max-w-[170px]">{data.clientName}</span>
                  </div>
                )}
                {data.obraName && (
                  <div className="flex justify-between">
                    <span>OBRA/SETOR:</span>
                    <span className="truncate max-w-[170px]">{data.obraName}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 mb-2 border-b border-dashed border-gray-400 pb-2 text-[10px]">
                <div>KM ANT: {data.initialMileage?.toLocaleString('pt-BR') || '—'}</div>
                <div>KM ABAST: {data.mileage?.toLocaleString('pt-BR') || '—'}</div>
                {kmTraveled !== null && <div className="col-span-2">KM RODADO: +{kmTraveled.toLocaleString('pt-BR')} km</div>}
              </div>

              <div className="mb-2 border-b border-dashed border-gray-400 pb-2">
                <div className="flex justify-between font-bold border-b border-gray-300 pb-1 mb-1">
                  <span>ITEM</span>
                  <span>QTD</span>
                  <span>TOTAL</span>
                </div>
                <div className="flex justify-between">
                  <span>{data.fuelType}</span>
                  <span>{data.liters.toFixed(2)}L</span>
                  <span>{dieselTotal > 0 ? `R$ ${dieselTotal.toFixed(2)}` : '—'}</span>
                </div>
                {data.hasArla && data.arlaLiters && data.arlaLiters > 0 ? (
                  <div className="flex justify-between text-blue-900">
                    <span>ARLA 32</span>
                    <span>{data.arlaLiters.toFixed(1)}L</span>
                    <span>{arlaTotal > 0 ? `R$ ${arlaTotal.toFixed(2)}` : '—'}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-bold text-xs pt-1 mt-1 border-t border-gray-400">
                  <span>TOTAL:</span>
                  <span>{grandTotal > 0 ? `R$ ${grandTotal.toFixed(2)}` : `${(data.liters + (data.arlaLiters || 0)).toFixed(2)} L`}</span>
                </div>
              </div>

              <div className="text-center pt-3 space-y-4">
                <div>
                  <div className="border-b border-gray-400 w-3/4 mx-auto mb-1"></div>
                  <p className="text-[9px]">VISTO ABASTECEDOR</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 w-3/4 mx-auto mb-1"></div>
                  <p className="text-[9px]">VISTO MOTORISTA ({data.vehiclePlate})</p>
                </div>
                <p className="text-[8px] text-gray-500 pt-1">FluxBus Fleet Management</p>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com botão de Fechar */}
        <div className="p-3 border-t border-gray-800 bg-gray-950 flex justify-end no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:text-white"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>

      {/* Estilos CSS para Impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .printable-a4 {
            max-width: 100% !important;
            box-shadow: none !important;
            padding: 10mm !important;
            page-break-inside: avoid;
          }
          .printable-thermal {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            padding: 2mm !important;
          }
        }
      `}</style>
    </Dialog>
  );
};

export default InternalFuelReceiptModal;
