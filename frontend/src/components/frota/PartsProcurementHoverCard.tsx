import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package, ShoppingCart, CheckCircle2, Clock, Truck,
  AlertCircle, ExternalLink, Loader2, Sparkles, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { materialRequisitionService, MaterialRequisition } from '@/services/materialRequisitionService';

interface PartsProcurementHoverCardProps {
  workOrderId: string;
  osNumber?: string;
  children?: React.ReactNode;
}

export const PartsProcurementHoverCard: React.FC<PartsProcurementHoverCardProps> = ({
  workOrderId,
  osNumber,
  children,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch requisitions for this work order
  const { data: requisitions = [], isLoading, isError } = useQuery({
    queryKey: ['material-requisitions-wo', workOrderId],
    queryFn: () => materialRequisitionService.listByWorkOrder(workOrderId),
    enabled: isOpen || isHovered,
    staleTime: 15_000,
  });

  const getStepIndex = (req: MaterialRequisition) => {
    switch (req.status) {
      case 'PENDING_CHECK':
      case 'RESERVED_STOCK':
        return 1;
      case 'WAITING_QUOTES':
      case 'QUOTES_RECEIVED':
        return 2;
      case 'APPROVED_BY_MANAGER':
      case 'OC_GENERATED':
        return 3;
      case 'WAITING_DELIVERY':
        return 4;
      case 'AVAILABLE_FOR_INSTALLATION':
      case 'INSTALLED_COMPLETED':
        return 5;
      default:
        return 1;
    }
  };

  const popoverOpen = isOpen || isHovered;

  return (
    <Popover open={popoverOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className="inline-block cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(prev => !prev);
          }}
        >
          {children || (
            <Badge className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] cursor-pointer shadow-sm">
              <Package size={12} className="mr-1 inline-block" />
              Aguardando Peça
            </Badge>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-4 bg-seguranca-graphite border-gray-700 text-white shadow-2xl z-50 rounded-xl"
        align="start"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-700/80 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <ShoppingCart size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Cotação & Reposição de Peças
                </h4>
                <p className="text-[11px] text-gray-400">
                  {osNumber ? `OS #${osNumber}` : 'Status de Compras do Almoxarifado'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-300">
              Almoxarifado
            </Badge>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-gray-400 gap-2 text-xs">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              Verificando cotações no Almoxarifado...
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (requisitions.length === 0 || isError) && (
            <div className="bg-seguranca-black/40 p-3 rounded-lg border border-gray-700/60 text-center space-y-2">
              <Package size={22} className="mx-auto text-purple-400 opacity-80" />
              <p className="text-xs text-gray-300">
                Nenhuma solicitação de peças ou cotação registrada para esta Ordem de Serviço.
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/compras/cotacoes')}
                className="text-xs h-7 bg-purple-600 hover:bg-purple-500 text-white w-full font-semibold"
              >
                <ShoppingCart size={13} className="mr-1.5" /> Solicitar Peças ao Almoxarifado
              </Button>
            </div>
          )}

          {/* List of Requisitions / Items */}
          {!isLoading && requisitions.length > 0 && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {requisitions.map((req) => {
                const step = getStepIndex(req);
                return (
                  <div
                    key={req.id}
                    className="bg-seguranca-black/60 p-3 rounded-lg border border-gray-700/70 space-y-2 text-xs"
                  >
                    {/* Item Title & Qty */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate max-w-[200px]" title={req.itemName}>
                        {req.itemName}
                      </span>
                      <span className="font-mono text-purple-400 font-bold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40 text-[11px]">
                        {req.quantity} {req.unit || 'UN'}
                      </span>
                    </div>

                    {/* Requisition Number & Department */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Ref: #{req.requisitionNumber}</span>
                      {req.urgency === 'EMERGENCIA' && (
                        <span className="text-red-400 font-bold uppercase">🚨 Emergência</span>
                      )}
                    </div>

                    {/* Progress Workflow Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="grid grid-cols-4 gap-1 text-[9px] text-center font-semibold uppercase">
                        <span className={step >= 1 ? 'text-purple-400' : 'text-gray-600'}>1. Solicitado</span>
                        <span className={step >= 2 ? 'text-amber-400' : 'text-gray-600'}>2. Cotações</span>
                        <span className={step >= 3 ? 'text-blue-400' : 'text-gray-600'}>3. Aprovado</span>
                        <span className={step >= 4 ? 'text-emerald-400' : 'text-gray-600'}>4. Trânsito</span>
                      </div>
                      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden flex">
                        <div className={`h-full transition-all ${step >= 1 ? 'bg-purple-500' : 'bg-transparent'}`} style={{ width: '25%' }} />
                        <div className={`h-full transition-all ${step >= 2 ? 'bg-amber-400' : 'bg-transparent'}`} style={{ width: '25%' }} />
                        <div className={`h-full transition-all ${step >= 3 ? 'bg-blue-400' : 'bg-transparent'}`} style={{ width: '25%' }} />
                        <div className={`h-full transition-all ${step >= 4 ? 'bg-emerald-400' : 'bg-transparent'}`} style={{ width: '25%' }} />
                      </div>
                    </div>

                    {/* Status Box Details */}
                    {step === 1 && (
                      <div className="bg-purple-950/30 border border-purple-800/40 text-purple-300 p-2 rounded text-[11px] flex items-start gap-1.5">
                        <Clock size={13} className="mt-0.5 flex-shrink-0 text-purple-400" />
                        <div>
                          <strong>Solicitado ao Almoxarifado:</strong> Aguardando análise da equipe de estoque para liberação ou cotação.
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="bg-amber-950/30 border border-amber-800/40 text-amber-300 p-2 rounded text-[11px] flex items-start gap-1.5">
                        <ShoppingCart size={13} className="mt-0.5 flex-shrink-0 text-amber-400" />
                        <div>
                          <strong>Cotações em Andamento:</strong> Almoxarifado colhendo e comparando preços com fornecedores
                          {req.quotesCount != null && req.quotesCount > 0 ? ` (${req.quotesCount} cotações registradas)` : ''}.
                        </div>
                      </div>
                    )}

                    {step >= 3 && (
                      <div className="bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 p-2 rounded text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <CheckCircle2 size={13} />
                          Compra Aprovada com Sucesso!
                        </div>
                        {req.supplierName && (
                          <div className="text-gray-300">
                            <strong>Fornecedor:</strong> {req.supplierName}
                          </div>
                        )}
                        {req.totalAmount != null && (
                          <div className="text-gray-300">
                            <strong>Valor Aprovado:</strong> {req.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        )}
                        {req.ocNumber && (
                          <div className="text-gray-400 text-[10px]">
                            <strong>Ordem de Compra:</strong> #{req.ocNumber}
                          </div>
                        )}
                        <div className="text-emerald-400/90 text-[10px] font-semibold italic flex items-center gap-1 mt-1 pt-1 border-t border-emerald-800/30">
                          <Truck size={12} />
                          Aguardando envio e entrega do item pelo fornecedor.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-1 border-t border-gray-700/60 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Rastreabilidade em tempo real</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/compras/cotacoes')}
              className="text-[11px] h-7 text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 px-2"
            >
              Ver Painel de Cotações <ExternalLink size={12} className="ml-1" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
