import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft, 
  Search, Check, Plus, Minus, GripVertical, AlertTriangle, 
  Bus, Info, CheckCircle2 
} from 'lucide-react';
import { Passenger } from '@/types/passenger';

interface RoutePassengerTransferListProps {
  clientPassengers: Passenger[];
  selectedPassengerIds: string[];
  onChange: (newSelectedIds: string[]) => void;
  disabled?: boolean;
  routeName?: string;
  sameForReturn?: boolean;
  onSameForReturnChange?: (same: boolean) => void;
}

export const RoutePassengerTransferList: React.FC<RoutePassengerTransferListProps> = ({
  clientPassengers,
  selectedPassengerIds,
  onChange,
  disabled = false,
  routeName,
  sameForReturn = true,
  onSameForReturnChange
}) => {
  const [leftFilter, setLeftFilter] = useState('');
  const [rightFilter, setRightFilter] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isOverRight, setIsOverRight] = useState(false);
  const [isOverLeft, setIsOverLeft] = useState(false);

  // Divide os colaboradores entre disponíveis (esquerda) e atribuídos (direita)
  const availablePassengers = useMemo(() => {
    return clientPassengers.filter(p => !selectedPassengerIds.includes(p.id));
  }, [clientPassengers, selectedPassengerIds]);

  const assignedPassengers = useMemo(() => {
    return clientPassengers.filter(p => selectedPassengerIds.includes(p.id));
  }, [clientPassengers, selectedPassengerIds]);

  // Filtros de busca
  const filteredAvailable = useMemo(() => {
    const q = leftFilter.toLowerCase().trim();
    if (!q) return availablePassengers;
    return availablePassengers.filter(p => {
      const name = (p.name || '').toLowerCase();
      const reg = (p.registration || '').replace(/\D/g, '');
      const cpf = (p.cpf || '').replace(/\D/g, '');
      return name.includes(q) || reg.includes(q) || cpf.includes(q);
    });
  }, [availablePassengers, leftFilter]);

  const filteredAssigned = useMemo(() => {
    const q = rightFilter.toLowerCase().trim();
    if (!q) return assignedPassengers;
    return assignedPassengers.filter(p => {
      const name = (p.name || '').toLowerCase();
      const reg = (p.registration || '').replace(/\D/g, '');
      const cpf = (p.cpf || '').replace(/\D/g, '');
      return name.includes(q) || reg.includes(q) || cpf.includes(q);
    });
  }, [assignedPassengers, rightFilter]);

  // Ações de mover
  const handleAssign = (id: string) => {
    if (disabled || selectedPassengerIds.includes(id)) return;
    onChange([...selectedPassengerIds, id]);
  };

  const handleUnassign = (id: string) => {
    if (disabled) return;
    onChange(selectedPassengerIds.filter(selectedId => selectedId !== id));
  };

  const handleAssignAll = () => {
    if (disabled) return;
    const allIds = clientPassengers.map(p => p.id);
    onChange(allIds);
  };

  const handleUnassignAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (disabled) return;
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setIsOverRight(false);
    setIsOverLeft(false);
  };

  const handleDropOnRight = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverRight(false);
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id && !selectedPassengerIds.includes(id)) {
      handleAssign(id);
    }
  };

  const handleDropOnLeft = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverLeft(false);
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id && selectedPassengerIds.includes(id)) {
      handleUnassign(id);
    }
  };

  return (
    <div className="space-y-3">
      {/* Opção A: Mesma lista para Ida e Retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
        <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-medium">
          <input
            type="checkbox"
            checked={sameForReturn}
            onChange={(e) => onSameForReturnChange?.(e.target.checked)}
            disabled={disabled}
            className="rounded border-slate-700 bg-slate-800 text-seguranca-red focus:ring-0"
          />
          <span>Vincular automaticamente para <strong>IDA e RETORNO</strong> (Mesma lista de colaboradores)</span>
        </label>
        <span className="text-[11px] text-slate-400">
          Dica: Arraste os cartões ou clique em <strong>+</strong> / <strong>-</strong> para mover.
        </span>
      </div>

      {/* Grid com Transfer List Dual-Column */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
        
        {/* COLUNA ESQUERDA: DISPONÍVEIS */}
        <div 
          className={`flex flex-col rounded-xl border transition-all ${
            isOverLeft 
              ? 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-500/20' 
              : 'border-slate-800 bg-slate-900/60'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsOverLeft(true);
          }}
          onDragLeave={() => setIsOverLeft(false)}
          onDrop={handleDropOnLeft}
        >
          {/* Header Esquerda */}
          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Colaboradores do Cliente ({availablePassengers.length})
              </span>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
              Disponíveis
            </Badge>
          </div>

          {/* Busca Esquerda */}
          <div className="p-2 border-b border-slate-800/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Filtrar por nome, matrícula ou CPF..."
                value={leftFilter}
                onChange={(e) => setLeftFilter(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-800/60 border-slate-700/80 text-white placeholder:text-slate-500"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Lista Esquerda */}
          <div className="p-2 space-y-1.5 flex-1 min-h-[260px] max-h-[360px] overflow-y-auto">
            {filteredAvailable.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                {availablePassengers.length === 0 ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mb-2" />
                    <span>Todos os colaboradores do cliente já foram atribuídos a esta rota!</span>
                  </>
                ) : (
                  <span>Nenhum colaborador corresponde ao filtro.</span>
                )}
              </div>
            ) : (
              filteredAvailable.map(p => {
                const numericReg = (p.registration || '').replace(/\D/g, '');
                return (
                  <div
                    key={p.id}
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragEnd={handleDragEnd}
                    className="group flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800 transition-all cursor-grab active:cursor-grabbing text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate group-hover:text-cyan-300">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <span className="bg-slate-900 px-1 py-0.2 rounded border border-slate-700 text-slate-300">
                            Matrícula: {numericReg || '---'}
                          </span>
                          {p.cpf && <span>• CPF: {p.cpf}</span>}
                        </div>
                        {p.routeName && (
                          <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                            <Bus className="h-3 w-3" /> Outra rota: {p.routeName}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAssign(p.id)}
                      disabled={disabled}
                      className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 shrink-0"
                      title="Atribuir à Rota"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTRO: BOTÕES DE TRANSFERÊNCIA */}
        <div className="flex md:flex-col items-center justify-center gap-2 py-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAssignAll}
            disabled={disabled || availablePassengers.length === 0}
            className="h-8 w-8 p-0 border-slate-700 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-400"
            title="Adicionar Todos à Rota"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleUnassignAll}
            disabled={disabled || assignedPassengers.length === 0}
            className="h-8 w-8 p-0 border-slate-700 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400"
            title="Remover Todos da Rota"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* COLUNA DIREITA: ATRIBUÍDOS À ROTA */}
        <div 
          className={`flex flex-col rounded-xl border transition-all ${
            isOverRight 
              ? 'border-emerald-400 bg-emerald-950/20 ring-2 ring-emerald-500/20' 
              : 'border-slate-800 bg-slate-900/60'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsOverRight(true);
          }}
          onDragLeave={() => setIsOverRight(false)}
          onDrop={handleDropOnRight}
        >
          {/* Header Direita */}
          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bus className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Atribuídos a Esta Rota ({assignedPassengers.length})
              </span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
              Confirmados
            </Badge>
          </div>

          {/* Busca Direita */}
          <div className="p-2 border-b border-slate-800/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Filtrar atribuídos por nome ou matrícula..."
                value={rightFilter}
                onChange={(e) => setRightFilter(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-800/60 border-slate-700/80 text-white placeholder:text-slate-500"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Lista Direita */}
          <div className="p-2 space-y-1.5 flex-1 min-h-[260px] max-h-[360px] overflow-y-auto">
            {filteredAssigned.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                {assignedPassengers.length === 0 ? (
                  <>
                    <Users className="h-8 w-8 text-slate-600 mb-2" />
                    <span>Nenhum colaborador atribuído a esta rota ainda.</span>
                    <span className="text-[11px] text-slate-600 mt-1">
                      Arraste colaboradores da esquerda para cá ou clique em <strong>+</strong>.
                    </span>
                  </>
                ) : (
                  <span>Nenhum colaborador atribuído corresponde ao filtro.</span>
                )}
              </div>
            ) : (
              filteredAssigned.map(p => {
                const numericReg = (p.registration || '').replace(/\D/g, '');
                return (
                  <div
                    key={p.id}
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragEnd={handleDragEnd}
                    className="group flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-950/30 transition-all cursor-grab active:cursor-grabbing text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="h-3.5 w-3.5 text-emerald-600 group-hover:text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate group-hover:text-emerald-300">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80 font-mono">
                          <span className="bg-slate-900 px-1 py-0.2 rounded border border-slate-700 text-slate-300">
                            Matrícula: {numericReg || '---'}
                          </span>
                          {p.cpf && <span>• CPF: {p.cpf}</span>}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnassign(p.id)}
                      disabled={disabled}
                      className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 shrink-0"
                      title="Remover da Rota"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoutePassengerTransferList;

