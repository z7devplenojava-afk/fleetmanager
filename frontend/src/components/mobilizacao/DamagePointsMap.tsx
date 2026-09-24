'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trash2, 
  Info, 
  RotateCcw, 
  Bus, 
  Truck, 
  Car, 
  Eye, 
  AlertCircle,
  Crosshair,
  Layers
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DamageType = 'scratch' | 'dent' | 'broken' | 'glass' | 'paint' | 'other';
export type BodyType = 'bus_urban' | 'bus_road' | 'microbus' | 'van' | 'pickup' | 'car';
export type ViewAngle = 'side_right' | 'side_left' | 'front_rear';

export interface DamagePoint {
  x: number;
  y: number;
  description: string;
  type: DamageType;
  view?: ViewAngle;
  bodyType?: BodyType;
}

interface DamageMapProps {
  points: DamagePoint[];
  onChange: (points: DamagePoint[]) => void;
  readOnly?: boolean;
  initialBodyType?: BodyType;
}

const DAMAGE_TYPE_CONFIG: Record<DamageType, { label: string; color: string; bg: string; border: string }> = {
  scratch: { label: 'Arranhão / Risco', color: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-400' },
  dent: { label: 'Amassado / Batida', color: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-400' },
  broken: { label: 'Quebrado / Furo', color: 'text-red-400', bg: 'bg-red-500', border: 'border-red-400' },
  glass: { label: 'Trinca no Vidro', color: 'text-sky-400', bg: 'bg-sky-500', border: 'border-sky-400' },
  paint: { label: 'Pintura / Descascado', color: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-400' },
  other: { label: 'Outro Detalhe', color: 'text-zinc-300', bg: 'bg-zinc-400', border: 'border-zinc-300' },
};

const BODY_TYPES: { id: BodyType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'bus_urban', label: 'Ônibus Urbano (Caio / Marcopolo)', icon: Bus },
  { id: 'bus_road', label: 'Ônibus Rodoviário / Executivo', icon: Bus },
  { id: 'microbus', label: 'Micro-ônibus (Volare / Foz)', icon: Bus },
  { id: 'van', label: 'Van / Furgão (Sprinter / Master)', icon: Truck },
  { id: 'pickup', label: 'Picape / Apoio (Saveiro / Strada)', icon: Car },
  { id: 'car', label: 'Carro de Apoio / Passeio', icon: Car },
];

const VIEW_ANGLES: { id: ViewAngle; label: string }[] = [
  { id: 'side_right', label: 'Lateral Direita (Portas)' },
  { id: 'side_left', label: 'Lateral Esquerda (Motorista)' },
  { id: 'front_rear', label: 'Frente & Traseira' },
];

export const DamageMap: React.FC<DamageMapProps> = ({ 
  points, 
  onChange, 
  readOnly = false,
  initialBodyType = 'bus_urban'
}) => {
  const [bodyType, setBodyType] = useState<BodyType>(initialBodyType);
  const [currentView, setCurrentView] = useState<ViewAngle>('side_right');
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
      const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));

      const newPoint: DamagePoint = {
        x,
        y,
        description: '',
        type: 'scratch',
        view: currentView,
        bodyType: bodyType,
      };

      const newPoints = [...points, newPoint];
      onChange(newPoints);
      setSelectedPoint(newPoints.length - 1);
    }
  };

  const updatePoint = (index: number, updates: Partial<DamagePoint>) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], ...updates };
    onChange(newPoints);
  };

  const removePoint = (index: number) => {
    const newPoints = points.filter((_, i) => i !== index);
    onChange(newPoints);
    if (selectedPoint === index) {
      setSelectedPoint(null);
    } else if (selectedPoint !== null && selectedPoint > index) {
      setSelectedPoint(selectedPoint - 1);
    }
  };

  const clearAllPoints = () => {
    if (window.confirm('Deseja remover todas as avarias marcadas?')) {
      onChange([]);
      setSelectedPoint(null);
    }
  };

  // Filtrar pontos da vista ativa se houver view definida, ou exibir todos se for formato legado
  const activePointsWithIndex = points.map((p, originalIdx) => ({ p, originalIdx }));
  const visiblePoints = activePointsWithIndex.filter(({ p }) => !p.view || p.view === currentView);

  return (
    <div className="space-y-4">
      {/* Barra de Seleção de Carroceria e Ângulos de Vistoria */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-3 sm:p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 shrink-0">
            <Layers size={18} />
          </div>
          <div className="flex-1 md:flex-initial">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Tipo de Carroceria
            </label>
            <Select value={bodyType} onValueChange={(v) => setBodyType(v as BodyType)}>
              <SelectTrigger className="w-full md:w-64 h-8 bg-zinc-950 border-zinc-700 text-xs text-zinc-200 mt-1">
                <SelectValue placeholder="Selecione a carroceria" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                {BODY_TYPES.map((bt) => (
                  <SelectItem key={bt.id} value={bt.id} className="text-xs">
                    {bt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Abas de Ângulo / Vista */}
        <div className="flex items-center gap-1.5 w-full md:w-auto bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {VIEW_ANGLES.map((va) => (
            <button
              key={va.id}
              type="button"
              onClick={() => setCurrentView(va.id)}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentView === va.id
                  ? 'bg-seguranca-yellow text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {va.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal: Mapa SVG Interativo + Lista de Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Painel do Mapa Vetorial */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Crosshair size={14} className="text-yellow-400" />
              Clique na carroceria para marcar o ponto exato da avaria
            </span>
            <span className="text-zinc-500 font-mono">
              Vista: <strong className="text-yellow-400 font-semibold">{VIEW_ANGLES.find(v => v.id === currentView)?.label}</strong>
            </span>
          </div>

          <div
            ref={containerRef}
            onClick={handleMapClick}
            className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl border-2 border-zinc-700/80 shadow-2xl overflow-hidden cursor-crosshair group select-none transition-all hover:border-yellow-500/50"
          >
            {/* Grade técnica de alinhamento em blueprint */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Renderização do Desenho Vetorial Técnico Conforme Carroceria e Vista */}
            <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none">
              <VehicleBlueprintSVG bodyType={bodyType} view={currentView} />
            </div>

            {/* Marcadores de Avarias Registrados */}
            {visiblePoints.map(({ p, originalIdx }) => {
              const cfg = DAMAGE_TYPE_CONFIG[p.type] || DAMAGE_TYPE_CONFIG.other;
              const isSelected = selectedPoint === originalIdx;

              return (
                <div
                  key={originalIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPoint(originalIdx);
                  }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                  }`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  {/* Halo de pulso se selecionado */}
                  {isSelected && (
                    <span className="absolute -inset-1 rounded-full bg-yellow-400 opacity-75 animate-ping" />
                  )}

                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg border-2 ${
                      cfg.bg
                    } ${isSelected ? 'border-white ring-2 ring-yellow-400' : 'border-zinc-900'}`}
                  >
                    {originalIdx + 1}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Info size={13} className="text-yellow-400 shrink-0" />
              Toque ou clique em qualquer ponto do veículo para registrar avarias na lataria, vidros ou para-choque.
            </span>
            {points.length > 0 && !readOnly && (
              <button
                type="button"
                onClick={clearAllPoints}
                className="text-red-400 hover:text-red-300 font-semibold transition-colors ml-auto"
              >
                Limpar todos os marcadores
              </button>
            )}
          </div>
        </div>

        {/* Painel Lateral: Detalhes das Avarias */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Avarias Registradas
                <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-mono text-xs px-2 py-0.5 rounded-full font-black">
                  {points.length}
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Classifique o tipo e descreva cada ocorrência
              </p>
            </div>

            {selectedPoint !== null && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPoint(null)}
                className="text-[11px] h-7 px-2 text-zinc-400 hover:text-white"
              >
                Desmarcar
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1 max-h-[380px] sm:max-h-[460px]">
            {points.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                <AlertCircle size={28} className="text-zinc-600 mb-2" />
                <p className="text-xs font-semibold text-zinc-400">Nenhuma avaria marcada no mapa</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                  Clique na carroceria do veículo ao lado para registrar arranhões, amassados ou quebras.
                </p>
              </div>
            ) : (
              points.map((pt, i) => {
                const isSelected = selectedPoint === i;
                const cfg = DAMAGE_TYPE_CONFIG[pt.type] || DAMAGE_TYPE_CONFIG.other;

                return (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedPoint(i);
                      if (pt.view && pt.view !== currentView) {
                        setCurrentView(pt.view);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-yellow-500/10 border-yellow-500/80 shadow-md ring-1 ring-yellow-500/30'
                        : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${cfg.bg}`}>
                          {i + 1}
                        </span>
                        <span className="text-xs font-bold text-white">
                          Ponto #{i + 1}
                        </span>
                        {pt.view && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                            {VIEW_ANGLES.find(v => v.id === pt.view)?.label.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      {!readOnly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePoint(i);
                          }}
                          className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                          title="Remover avaria"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                          Tipo de Avaria
                        </Label>
                        <Select
                          disabled={readOnly}
                          value={pt.type}
                          onValueChange={(v) => updatePoint(i, { type: v as DamageType })}
                        >
                          <SelectTrigger className="h-7 bg-zinc-900 border-zinc-700 text-xs text-zinc-200">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                            {Object.entries(DAMAGE_TYPE_CONFIG).map(([key, item]) => (
                              <SelectItem key={key} value={key} className="text-xs flex items-center gap-2">
                                <span className={`font-semibold ${item.color}`}>{item.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                          Descrição / Localização
                        </Label>
                        <Input
                          disabled={readOnly}
                          placeholder="Ex: Risco na lataria acima da roda..."
                          value={pt.description}
                          onChange={(e) => updatePoint(i, { description: e.target.value })}
                          className="h-7 bg-zinc-900 border-zinc-700 text-xs text-zinc-200 focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                    </div>
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

/**
 * Componente com Desenhos Vetoriais Realistas de Carrocerias Automotivas
 */
interface VehicleBlueprintProps {
  bodyType: BodyType;
  view: ViewAngle;
}

// Rodas com detalhamento técnico automotivo
const RealisticWheel: React.FC<{ cx: number; cy: number; radius?: number; lugCount?: number; isDual?: boolean; isAlloy?: boolean }> = ({
  cx,
  cy,
  radius = 54,
  lugCount = 6,
  isDual = false,
  isAlloy = false,
}) => {
  const rimRadius = radius * 0.62;
  const hubRadius = radius * 0.26;

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Sombra inferior da roda */}
      <ellipse cx="0" cy={radius + 4} rx={radius * 1.05} ry={7} fill="#000000" fillOpacity="0.45" />

      {/* Pneu com ranhuras e perfil */}
      <circle cx="0" cy="0" r={radius} fill="#090d16" stroke="#1e293b" strokeWidth="4" />
      <circle cx="0" cy="0" r={radius - 5} fill="none" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />
      
      {/* Detalhe do disco de freio e pinça visível */}
      <circle cx="0" cy="0" r={rimRadius - 2} fill="#334155" />
      <path d={`M${-rimRadius * 0.5},${-rimRadius * 0.5} A${rimRadius * 0.7},${rimRadius * 0.7} 0 0,1 ${rimRadius * 0.2},${-rimRadius * 0.7}`} stroke="#ef4444" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* Aro / Roda */}
      <circle cx="0" cy="0" r={rimRadius} fill={isAlloy ? '#94a3b8' : '#64748b'} stroke="#cbd5e1" strokeWidth="2.5" />
      
      {/* Raios da roda ou orifícios de ventilação de roda de aço */}
      {Array.from({ length: 8 }).map((_, idx) => {
        const ang = (idx * 45 * Math.PI) / 180;
        const x1 = Math.cos(ang) * (hubRadius + 4);
        const y1 = Math.sin(ang) * (hubRadius + 4);
        const x2 = Math.cos(ang) * (rimRadius - 5);
        const y2 = Math.sin(ang) * (rimRadius - 5);
        return (
          <ellipse
            key={idx}
            cx={(x1 + x2) / 2}
            cy={(y1 + y2) / 2}
            rx={3}
            ry={5}
            transform={`rotate(${idx * 45}, ${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}
            fill="#090d16"
          />
        );
      })}

      {/* Cubo Central com tampa e parafusos de roda */}
      <circle cx="0" cy="0" r={hubRadius} fill="#1e293b" stroke="#e2e8f0" strokeWidth="1.5" />
      <circle cx="0" cy="0" r={hubRadius * 0.5} fill="#090d16" stroke="#facc15" strokeWidth="1.5" />

      {Array.from({ length: lugCount }).map((_, idx) => {
        const ang = (idx * (360 / lugCount) * Math.PI) / 180;
        const lx = Math.cos(ang) * (hubRadius * 0.75);
        const ly = Math.sin(ang) * (hubRadius * 0.75);
        return <circle key={idx} cx={lx} cy={ly} r="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />;
      })}

      {/* Indicador de rodado duplo traseiro de ônibus/caminhão */}
      {isDual && (
        <path d={`M${radius * 0.7},${-radius * 0.6} Q${radius * 0.95},0 ${radius * 0.7},${radius * 0.6}`} stroke="#475569" strokeWidth="5" fill="none" />
      )}
    </g>
  );
};

const VehicleBlueprintSVG: React.FC<VehicleBlueprintProps> = ({ bodyType, view }) => {
  const isRightSide = view === 'side_right';

  // ========== VISTA FRENTE E TRASEIRA ==========
  if (view === 'front_rear') {
    const isBus = bodyType === 'bus_urban' || bodyType === 'bus_road' || bodyType === 'microbus';
    const isVan = bodyType === 'van';

    return (
      <svg viewBox="0 0 1000 450" className="w-full h-full drop-shadow-xl select-none">
        <defs>
          <linearGradient id="windshieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* ================= VISTA DIANTEIRA (FRONTAL) ================= */}
        <g transform="translate(60, 45)">
          <rect x="50" y="-30" width="280" height="22" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="190" y="-15" textAnchor="middle" fill="#facc15" fontSize="13" fontWeight="bold" fontFamily="monospace">
            VISTA DIANTEIRA (FRENTE)
          </text>

          {isBus ? (
            /* --- FRENTE DE ÔNIBUS REAL (Marcopolo / Caio) --- */
            <g>
              {/* Espelhos Retrovisores Panorâmicos de Ônibus (Braços superiores tipo antena) */}
              <path d="M40,55 C10,55 0,100 5,145" stroke="#94a3b8" strokeWidth="4" fill="none" />
              <rect x="-10" y="90" width="22" height="75" rx="5" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
              <rect x="-8" y="93" width="18" height="69" rx="3" fill="#38bdf8" fillOpacity="0.3" />

              <path d="M340,55 C370,55 380,100 375,145" stroke="#94a3b8" strokeWidth="4" fill="none" />
              <rect x="368" y="90" width="22" height="75" rx="5" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
              <rect x="370" y="93" width="18" height="69" rx="3" fill="#38bdf8" fillOpacity="0.3" />

              {/* Teto e Cúpula do Ônibus com Ar Condicionado */}
              <rect x="110" y="0" width="160" height="20" rx="5" fill="#334155" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="130" y1="6" x2="250" y2="6" stroke="#64748b" strokeWidth="2" />
              <line x1="130" y1="12" x2="250" y2="12" stroke="#64748b" strokeWidth="2" />

              {/* Carroceria Principal de Ônibus */}
              <path
                d="M38,35 Q190,15 342,35 L346,290 Q346,315 320,315 L60,315 Q34,315 34,290 Z"
                fill="url(#bodyGrad)"
                stroke="#f8fafc"
                strokeWidth="3.5"
              />

              {/* Letreiro Eletrônico Digital (Itinerário) */}
              <rect x="75" y="42" width="230" height="34" rx="4" fill="#050811" stroke="#facc15" strokeWidth="2" />
              <text x="190" y="64" textAnchor="middle" fill="#facc15" fontSize="13" fontWeight="900" fontFamily="monospace">
                SÃO SILVESTRE • EXPRESSO
              </text>

              {/* Para-brisa Panorâmico Bi-partido */}
              <path
                d="M48,88 Q190,80 332,88 L332,190 Q190,196 48,190 Z"
                fill="url(#windshieldGrad)"
                stroke="#94a3b8"
                strokeWidth="2.5"
              />
              <line x1="190" y1="83" x2="190" y2="193" stroke="#0f172a" strokeWidth="3" />
              
              {/* Palhetas do Limpador Pantográfico */}
              <line x1="110" y1="188" x2="155" y2="135" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
              <line x1="270" y1="188" x2="225" y2="135" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />

              {/* Grade Dianteira com Friso Cromado e Emblema */}
              <rect x="95" y="215" width="190" height="42" rx="6" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
              <line x1="105" y1="228" x2="275" y2="228" stroke="url(#chromeGrad)" strokeWidth="2" />
              <line x1="105" y1="240" x2="275" y2="240" stroke="#334155" strokeWidth="2" />
              <circle cx="190" cy="236" r="14" fill="#1e293b" stroke="url(#chromeGrad)" strokeWidth="2" />

              {/* Conjunto Óptico Dianteiro (Faróis Modernos com DRL e Pisca) */}
              <g>
                <path d="M48,212 L90,218 L88,252 L48,248 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="62" cy="230" r="8" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="78" cy="235" r="5" fill="#f59e0b" />
                <line x1="50" y1="216" x2="88" y2="222" stroke="#38bdf8" strokeWidth="2" />
              </g>
              <g>
                <path d="M332,212 L290,218 L292,252 L332,248 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="318" cy="230" r="8" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="302" cy="235" r="5" fill="#f59e0b" />
                <line x1="330" y1="216" x2="292" y2="222" stroke="#38bdf8" strokeWidth="2" />
              </g>

              {/* Para-choque Dianteiro e Placa Mercosul */}
              <rect x="30" y="272" width="320" height="44" rx="8" fill="#0b1120" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="60" cy="294" r="8" fill="#fef08a" stroke="#334155" strokeWidth="1" />
              <circle cx="320" cy="294" r="8" fill="#fef08a" stroke="#334155" strokeWidth="1" />
              
              <rect x="145" y="280" width="90" height="26" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <rect x="145" y="280" width="90" height="8" fill="#003399" />
              <text x="190" y="287" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold">BRASIL</text>
              <text x="190" y="302" textAnchor="middle" fill="#000000" fontSize="12" fontWeight="900" fontFamily="monospace">ABC-1D23</text>

              {/* Rodas sob a carroceria */}
              <rect x="44" y="315" width="46" height="26" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
              <rect x="290" y="315" width="46" height="26" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
            </g>
          ) : isVan ? (
            /* --- FRENTE DE VAN / FURGÃO REAL (Sprinter / Master) --- */
            <g>
              {/* Espelhos da Van */}
              <path d="M45,130 L10,140 L10,185 L45,160 Z" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
              <path d="M335,130 L370,140 L370,185 L335,160 Z" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />

              {/* Teto Alto da Van */}
              <path
                d="M60,40 Q190,25 320,40 L330,120 L345,210 L345,295 Q345,315 320,315 L60,315 Q35,315 35,295 L35,210 L50,120 Z"
                fill="url(#bodyGrad)"
                stroke="#f8fafc"
                strokeWidth="3.5"
              />
              <line x1="100" y1="50" x2="280" y2="50" stroke="#475569" strokeWidth="2" />
              <line x1="90" y1="70" x2="290" y2="70" stroke="#475569" strokeWidth="2" />

              {/* Para-brisa Amplo da Van */}
              <path
                d="M68,110 Q190,95 312,110 L322,175 Q190,185 58,175 Z"
                fill="url(#windshieldGrad)"
                stroke="#94a3b8"
                strokeWidth="2.5"
              />
              <line x1="120" y1="172" x2="165" y2="125" stroke="#cbd5e1" strokeWidth="3" />
              <line x1="260" y1="172" x2="215" y2="125" stroke="#cbd5e1" strokeWidth="3" />

              {/* Capô e Grade Dianteira Imponente */}
              <path d="M56,180 Q190,190 324,180 L326,205 Q190,215 54,205 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
              <rect x="90" y="210" width="200" height="52" rx="8" fill="#090d16" stroke="#475569" strokeWidth="2" />
              <line x1="100" y1="225" x2="280" y2="225" stroke="url(#chromeGrad)" strokeWidth="2.5" />
              <line x1="100" y1="238" x2="280" y2="238" stroke="url(#chromeGrad)" strokeWidth="2.5" />
              <circle cx="190" cy="236" r="16" fill="#1e293b" stroke="url(#chromeGrad)" strokeWidth="2.5" />

              {/* Faróis Angulares da Van */}
              <g>
                <path d="M50,210 L88,214 L85,255 L46,245 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="65" cy="230" r="9" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M48,213 L86,217" stroke="#38bdf8" strokeWidth="2.5" />
              </g>
              <g>
                <path d="M330,210 L292,214 L295,255 L334,245 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="315" cy="230" r="9" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M332,213 L294,217" stroke="#38bdf8" strokeWidth="2.5" />
              </g>

              {/* Para-choque com Faróis de Neblina e Placa */}
              <rect x="30" y="268" width="320" height="46" rx="8" fill="#090d16" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="60" cy="292" r="7" fill="#fef08a" stroke="#334155" strokeWidth="1" />
              <circle cx="320" cy="292" r="7" fill="#fef08a" stroke="#334155" strokeWidth="1" />

              <rect x="145" y="278" width="90" height="26" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <rect x="145" y="278" width="90" height="8" fill="#003399" />
              <text x="190" y="285" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold">BRASIL</text>
              <text x="190" y="300" textAnchor="middle" fill="#000000" fontSize="12" fontWeight="900" fontFamily="monospace">VAN-2026</text>

              <rect x="42" y="315" width="45" height="26" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
              <rect x="293" y="315" width="45" height="26" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
            </g>
          ) : (
            /* --- FRENTE DE CARRO / PICAPE (Polo / Strada / Saveiro) --- */
            <g>
              {/* Espelhos Laterais */}
              <ellipse cx="25" cy="155" rx="16" ry="10" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
              <ellipse cx="355" cy="155" rx="16" ry="10" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />

              {/* Silhueta Baixa e Aerodinâmica */}
              <path
                d="M80,85 Q190,65 300,85 L325,140 L345,185 L350,290 Q350,305 325,305 L55,305 Q30,305 30,290 L35,185 L55,140 Z"
                fill="url(#bodyGrad)"
                stroke="#f8fafc"
                strokeWidth="3.5"
              />

              {/* Para-brisa Inclinado */}
              <path
                d="M85,95 Q190,80 295,95 L315,150 Q190,162 65,150 Z"
                fill="url(#windshieldGrad)"
                stroke="#94a3b8"
                strokeWidth="2.5"
              />
              <line x1="120" y1="148" x2="165" y2="108" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="260" y1="148" x2="215" y2="108" stroke="#cbd5e1" strokeWidth="2.5" />

              {/* Grade Esportiva e Faróis Afilados */}
              <path d="M60,165 Q190,180 320,165 L325,200 Q190,215 55,200 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
              <rect x="95" y="195" width="190" height="38" rx="6" fill="#090d16" stroke="url(#chromeGrad)" strokeWidth="2" />
              <circle cx="190" cy="214" r="14" fill="#1e293b" stroke="url(#chromeGrad)" strokeWidth="2" />

              {/* Faróis Afilados Modernos */}
              <path d="M42,175 L92,185 L85,212 L38,198 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="58" cy="190" r="7" fill="#fef08a" />
              <path d="M338,175 L288,185 L295,212 L342,198 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="322" cy="190" r="7" fill="#fef08a" />

              {/* Para-choque com Tomadas de Ar Esportivas e Placa */}
              <rect x="25" y="245" width="330" height="60" rx="10" fill="#090d16" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="50" y="260" width="45" height="24" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <rect x="285" y="260" width="45" height="24" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />

              <rect x="145" y="265" width="90" height="26" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <rect x="145" y="265" width="90" height="8" fill="#003399" />
              <text x="190" y="272" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold">BRASIL</text>
              <text x="190" y="287" textAnchor="middle" fill="#000000" fontSize="12" fontWeight="900" fontFamily="monospace">CAR-2026</text>

              <rect x="36" y="305" width="46" height="24" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
              <rect x="298" y="305" width="46" height="24" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
            </g>
          )}
        </g>

        {/* ================= VISTA TRASEIRA ================= */}
        <g transform="translate(560, 45)">
          <rect x="50" y="-30" width="280" height="22" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="190" y="-15" textAnchor="middle" fill="#facc15" fontSize="13" fontWeight="bold" fontFamily="monospace">
            VISTA TRASEIRA
          </text>

          {isBus ? (
            /* --- TRASEIRA DE ÔNIBUS (Vigia superior, tampa do motor e lanternas verticais) --- */
            <g>
              {/* Carroceria Traseira de Ônibus */}
              <path
                d="M38,35 Q190,15 342,35 L346,290 Q346,315 320,315 L60,315 Q34,315 34,290 Z"
                fill="url(#bodyGrad)"
                stroke="#f8fafc"
                strokeWidth="3.5"
              />

              {/* Vigia Traseiro Fumê */}
              <path
                d="M55,50 Q190,40 325,50 L320,135 Q190,142 60,135 Z"
                fill="url(#windshieldGrad)"
                stroke="#94a3b8"
                strokeWidth="2.5"
              />
              {/* Linhas Térmicas do Desembaçador */}
              <line x1="80" y1="75" x2="300" y2="75" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.4" />
              <line x1="80" y1="95" x2="300" y2="95" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.4" />
              <line x1="80" y1="115" x2="300" y2="115" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.4" />
              <rect x="170" y="44" width="40" height="6" rx="2" fill="#ef4444" />

              {/* Tampa do Compartimento do Motor Traseiro com Aletas de Refrigeração */}
              <rect x="65" y="155" width="250" height="110" rx="8" fill="#090d16" stroke="#475569" strokeWidth="2" />
              <line x1="85" y1="175" x2="295" y2="175" stroke="#334155" strokeWidth="3" />
              <line x1="85" y1="190" x2="295" y2="190" stroke="#334155" strokeWidth="3" />
              <line x1="85" y1="205" x2="295" y2="205" stroke="#334155" strokeWidth="3" />
              <line x1="85" y1="220" x2="295" y2="220" stroke="#334155" strokeWidth="3" />
              <rect x="180" y="245" width="20" height="10" rx="2" fill="#94a3b8" />

              {/* Conjunto de Lanternas Traseiras Verticais (Freio, Pisca, Ré) */}
              <g>
                <rect x="42" y="150" width="18" height="75" rx="5" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="44" y="153" width="14" height="20" rx="3" fill="#ef4444" />
                <rect x="44" y="176" width="14" height="16" rx="3" fill="#f59e0b" />
                <rect x="44" y="195" width="14" height="14" rx="3" fill="#ffffff" />
                <rect x="44" y="212" width="14" height="10" rx="2" fill="#ef4444" />
              </g>
              <g>
                <rect x="320" y="150" width="18" height="75" rx="5" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="322" y="153" width="14" height="20" rx="3" fill="#ef4444" />
                <rect x="322" y="176" width="14" height="16" rx="3" fill="#f59e0b" />
                <rect x="322" y="195" width="14" height="14" rx="3" fill="#ffffff" />
                <rect x="322" y="212" width="14" height="10" rx="2" fill="#ef4444" />
              </g>

              {/* Para-choque Traseiro Reforçado com Placa */}
              <rect x="30" y="272" width="320" height="44" rx="8" fill="#0b1120" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="55" y="288" width="20" height="12" rx="3" fill="#ef4444" />
              <rect x="305" y="288" width="20" height="12" rx="3" fill="#ef4444" />

              <rect x="145" y="280" width="90" height="26" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <rect x="145" y="280" width="90" height="8" fill="#003399" />
              <text x="190" y="287" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold">BRASIL</text>
              <text x="190" y="302" textAnchor="middle" fill="#000000" fontSize="12" fontWeight="900" fontFamily="monospace">ABC-1D23</text>

              <rect x="44" y="315" width="46" height="26" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
              <rect x="290" y="315" width="46" height="26" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
            </g>
          ) : isVan ? (
            /* --- TRASEIRA DE VAN (Portas duplas verticais 50/50 com estribo) --- */
            <g>
              <path
                d="M60,40 Q190,25 320,40 L345,210 L345,295 Q345,315 320,315 L60,315 Q35,315 35,295 L35,210 Z"
                fill="url(#bodyGrad)"
                stroke="#f8fafc"
                strokeWidth="3.5"
              />
              
              {/* Linha de Separação das Portas Traseiras 50/50 */}
              <line x1="190" y1="40" x2="190" y2="315" stroke="#f8fafc" strokeWidth="3" />
              <rect x="180" y="210" width="20" height="12" rx="3" fill="#cbd5e1" />

              {/* Vidros Traseiros das Portas da Van */}
              <rect x="65" y="80" width="110" height="95" rx="6" fill="url(#windshieldGrad)" stroke="#94a3b8" strokeWidth="2" />
              <rect x="205" y="80" width="110" height="95" rx="6" fill="url(#windshieldGrad)" stroke="#94a3b8" strokeWidth="2" />
              <rect x="170" y="48" width="40" height="8" rx="2" fill="#ef4444" />

              {/* Lanternas Verticais Altas nas Colunas */}
              <g>
                <rect x="40" y="140" width="18" height="90" rx="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="42" y="143" width="14" height="28" rx="2" fill="#ef4444" />
                <rect x="42" y="175" width="14" height="22" rx="2" fill="#f59e0b" />
                <rect x="42" y="200" width="14" height="18" rx="2" fill="#ffffff" />
                <rect x="42" y="220" width="14" height="8" rx="2" fill="#ef4444" />
              </g>
              <g>
                <rect x="322" y="140" width="18" height="90" rx="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="324" y="143" width="14" height="28" rx="2" fill="#ef4444" />
                <rect x="324" y="175" width="14" height="22" rx="2" fill="#f59e0b" />
                <rect x="324" y="200" width="14" height="18" rx="2" fill="#ffffff" />
                <rect x="324" y="220" width="14" height="8" rx="2" fill="#ef4444" />
              </g>

              {/* Para-choque com Degrau Central Embutido */}
              <rect x="30" y="280" width="320" height="35" rx="6" fill="#090d16" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="130" y="282" width="120" height="12" rx="3" fill="#334155" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2" />

              <rect x="145" y="235" width="90" height="26" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <rect x="145" y="235" width="90" height="8" fill="#003399" />
              <text x="190" y="242" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold">BRASIL</text>
              <text x="190" y="257" textAnchor="middle" fill="#000000" fontSize="12" fontWeight="900" fontFamily="monospace">VAN-2026</text>

              <rect x="42" y="315" width="45" height="26" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
              <rect x="293" y="315" width="45" height="26" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
            </g>
          ) : (
            /* --- TRASEIRA DE CARRO / PICAPE --- */
            <g>
              <path
                d="M80,85 Q190,65 300,85 L325,140 L345,185 L350,290 Q350,305 325,305 L55,305 Q30,305 30,290 L35,185 L55,140 Z"
                fill="url(#bodyGrad)"
                stroke="#f8fafc"
                strokeWidth="3.5"
              />

              {/* Vigia Traseiro com Aerofólio */}
              <rect x="100" y="78" width="180" height="12" rx="3" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
              <rect x="175" y="82" width="30" height="4" rx="1" fill="#ef4444" />
              <path
                d="M85,95 Q190,80 295,95 L315,150 Q190,162 65,150 Z"
                fill="url(#windshieldGrad)"
                stroke="#94a3b8"
                strokeWidth="2.5"
              />

              {/* Tampa do Porta-malas / Caçamba */}
              <path d="M50,165 Q190,180 330,165 L330,250 Q190,260 50,250 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
              <circle cx="190" cy="195" r="14" fill="#1e293b" stroke="url(#chromeGrad)" strokeWidth="2" />

              {/* Lanternas Traseiras Horizontais / Afiladas */}
              <path d="M35,170 L95,180 L88,215 L32,205 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="65" y="185" width="20" height="10" fill="#f59e0b" />
              <path d="M345,170 L285,180 L292,215 L348,205 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="295" y="185" width="20" height="10" fill="#f59e0b" />

              {/* Para-choque com Refletores e Escapamento */}
              <rect x="25" y="250" width="330" height="55" rx="10" fill="#090d16" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="45" y="275" width="25" height="8" rx="2" fill="#ef4444" />
              <rect x="310" y="275" width="25" height="8" rx="2" fill="#ef4444" />
              <ellipse cx="60" cy="295" rx="8" ry="5" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />

              <rect x="145" y="260" width="90" height="26" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <rect x="145" y="260" width="90" height="8" fill="#003399" />
              <text x="190" y="267" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold">BRASIL</text>
              <text x="190" y="282" textAnchor="middle" fill="#000000" fontSize="12" fontWeight="900" fontFamily="monospace">CAR-2026</text>

              <rect x="36" y="305" width="46" height="24" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
              <rect x="298" y="305" width="46" height="24" rx="5" fill="#090d16" stroke="#334155" strokeWidth="2" />
            </g>
          )}
        </g>
      </svg>
    );
  }

  // ========== VISTAS LATERAIS (DIREITA / ESQUERDA) ==========
  return (
    <svg viewBox="0 0 1100 420" className="w-full h-full drop-shadow-xl select-none">
      <defs>
        <linearGradient id="sideWindshieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="sideBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>
      </defs>

      <g transform={isRightSide ? "translate(0, 0)" : "scale(-1, 1) translate(-1100, 0)"}>
        {/* ========================================================================= */}
        {/* 1. VAN / FURGÃO REALISTA (Mercedes-Benz Sprinter / Renault Master)        */}
        {/* ========================================================================= */}
        {bodyType === 'van' ? (
          <g transform="translate(45, 20)">
            {/* Linha de Sombra no Chão */}
            <ellipse cx="500" cy="335" rx="460" ry="10" fill="#000000" fillOpacity="0.5" />

            {/* Carroceria Principal da Van com Contornos Aerodinâmicos */}
            <path
              d="M75,290 
                 L70,225 
                 C70,205 85,185 110,180 
                 L165,175 
                 L240,145 
                 C265,135 285,100 310,75 
                 C335,50 365,50 405,50 
                 L920,50 
                 C955,50 970,65 970,95 
                 L970,285 
                 L985,290 
                 L985,310 
                 L950,310 
                 L860,310 
                 A68,68 0 0,0 724,310 
                 L384,310 
                 A68,68 0 0,0 248,310 
                 L80,310 
                 C68,310 65,302 75,290 Z"
              fill="url(#sideBodyGrad)"
              stroke="#f8fafc"
              strokeWidth="3.5"
            />

            {/* Teto Alto com Canaletas / Frisos Estruturais da Van */}
            <line x1="390" y1="58" x2="940" y2="58" stroke="#475569" strokeWidth="2" strokeDasharray="18 6" />
            <line x1="410" y1="66" x2="930" y2="66" stroke="#334155" strokeWidth="2" />

            {/* Vidro da Cabine Dianteira (Motorista / Passageiro) com Quebra-vento Triangular */}
            <path
              d="M245,145 
                 L305,80 
                 L440,80 
                 L440,165 
                 L190,165 
                 Z"
              fill="url(#sideWindshieldGrad)"
              stroke="#cbd5e1"
              strokeWidth="2.5"
            />
            {/* Coluna A e Vidro Triangular Dianteiro */}
            <line x1="260" y1="165" x2="310" y2="80" stroke="#0f172a" strokeWidth="3.5" />

            {/* Espelho Retrovisor Duplo de Braço Robusto com Repetidor de Seta */}
            <g>
              <path d="M225,160 L185,162 L180,185 L220,180 Z" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="165" y="145" width="22" height="52" rx="4" fill="#090d16" stroke="#f8fafc" strokeWidth="2" />
              <rect x="167" y="148" width="18" height="46" rx="2" fill="#38bdf8" fillOpacity="0.3" />
              <rect x="165" y="168" width="4" height="12" rx="1" fill="#f59e0b" />
            </g>

            {/* Vidros Laterais dos Passageiros (Grandes painéis com bordas pretas) */}
            <g>
              {/* Vidro da Porta de Correr / Meio */}
              <rect x="455" y="80" width="230" height="85" rx="8" fill="url(#sideWindshieldGrad)" stroke="#cbd5e1" strokeWidth="2.5" />
              {/* Vidro Traseiro Lateral */}
              <rect x="700" y="80" width="245" height="85" rx="8" fill="url(#sideWindshieldGrad)" stroke="#cbd5e1" strokeWidth="2.5" />
            </g>

            {/* Porta Dianteira: Batente e Contorno de Vedação */}
            <path d="M200,168 L170,230 L220,305" stroke="#94a3b8" strokeWidth="2" fill="none" />
            <line x1="445" y1="80" x2="445" y2="308" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Maçaneta Dianteira Embutida */}
            <rect x="400" y="180" width="30" height="10" rx="3" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />

            {/* Porta Lateral de Correr com Trilho Inferior Guiador */}
            <line x1="450" y1="78" x2="450" y2="308" stroke="#facc15" strokeWidth="2.5" />
            <line x1="692" y1="78" x2="692" y2="308" stroke="#facc15" strokeWidth="2.5" />
            {/* Trilho de Deslizamento Central (Marca Registrada de Sprinter/Master) */}
            <line x1="692" y1="180" x2="960" y2="180" stroke="#facc15" strokeWidth="3.5" />
            {/* Maçaneta da Porta Lateral de Correr */}
            <rect x="465" y="185" width="28" height="11" rx="3" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />

            {/* Friso Protetor Lateral Largo (Plástico preto antiderrapante) */}
            <path
              d="M100,240 L965,240 L965,268 L100,268 Z"
              fill="#090d16"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Bocal de Combustível (Diesel / Arla) */}
            <rect x="235" y="245" width="22" height="18" rx="3" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Conjunto Óptico Dianteiro (Farol Envolvente Moderno) */}
            <g>
              <path d="M85,185 L155,180 L145,225 L80,225 Z" fill="#090d16" stroke="#ffffff" strokeWidth="2" />
              <circle cx="115" cy="205" r="12" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M85,188 L150,183" stroke="#38bdf8" strokeWidth="3" />
              <path d="M82,215 L95,223 L80,223 Z" fill="#f59e0b" />
            </g>

            {/* Lanterna Traseira Vertical (Coluna Traseira) */}
            <g>
              <rect x="955" y="150" width="16" height="85" rx="4" fill="#090d16" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="957" y="154" width="12" height="26" rx="2" fill="#ef4444" />
              <rect x="957" y="183" width="12" height="20" rx="2" fill="#f59e0b" />
              <rect x="957" y="206" width="12" height="16" rx="2" fill="#ffffff" />
              <rect x="957" y="224" width="12" height="8" rx="2" fill="#ef4444" />
            </g>

            {/* Para-choque Traseiro com Estribo */}
            <rect x="965" y="285" width="24" height="25" rx="4" fill="#090d16" stroke="#cbd5e1" strokeWidth="2" />

            {/* Para-choque Dianteiro e Farol de Milha */}
            <path d="M68,230 L80,230 L80,295 L65,295 Z" fill="#090d16" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="75" cy="275" r="7" fill="#fef08a" stroke="#334155" strokeWidth="1" />

            {/* Caixas de Roda com Moldura Alargada */}
            <path d="M236,310 A78,78 0 0,1 396,310" stroke="#475569" strokeWidth="5" fill="none" />
            <path d="M712,310 A78,78 0 0,1 872,310" stroke="#475569" strokeWidth="5" fill="none" />

            {/* Rodas Robustas de Van (6 Furos) */}
            <RealisticWheel cx={316} cy={310} radius={64} lugCount={6} />
            <RealisticWheel cx={792} cy={310} radius={64} lugCount={6} />
          </g>
        ) : bodyType === 'bus_road' ? (
          /* ========================================================================= */
          /* 2. ÔNIBUS RODOVIÁRIO / EXECUTIVO (Marcopolo Paradiso G8 / G7 Trucado 6x2)  */
          /* ========================================================================= */
          <g transform="translate(35, 15)">
            <ellipse cx="510" cy="345" rx="490" ry="12" fill="#000000" fillOpacity="0.5" />

            {/* Carroceria Aerodinâmica G8 com Traseira Arredondada */}
            <path
              d="M50,315 
                 L45,140 
                 C45,80 85,35 150,35 
                 L970,35 
                 C1005,35 1025,60 1025,95 
                 L1025,305 
                 L1010,315 
                 L970,315 
                 A68,68 0 0,0 840,315 
                 L725,315 
                 A68,68 0 0,0 595,315 
                 L425,315 
                 A68,68 0 0,0 295,315 
                 L55,315 Z"
              fill="url(#sideBodyGrad)"
              stroke="#f8fafc"
              strokeWidth="3.5"
            />

            {/* Tiara Lateral Metálica Arqueada (Assinatura Marcopolo Paradiso G7 / G8) */}
            <path
              d="M130,42 C70,95 65,160 195,160 L1015,160 L1015,168 L190,168 C50,168 55,90 120,42 Z"
              fill="url(#chromeGrad)"
            />

            {/* Ar-Condicionado de Teto Aerodinâmico */}
            <rect x="420" y="20" width="220" height="17" rx="5" fill="#334155" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="450" y1="26" x2="610" y2="26" stroke="#64748b" strokeWidth="2" />

            {/* Vidros Panorâmicos Colados Fumê (Faixa Contínua de Luxo) */}
            <rect x="180" y="55" width="830" height="98" rx="4" fill="#0284c7" fillOpacity="0.3" stroke="#cbd5e1" strokeWidth="2" />
            {/* Divisórias Sutis dos Vidros Colados */}
            {[280, 385, 490, 595, 700, 805, 910].map((vx) => (
              <line key={vx} x1={vx} y1="55" x2={vx} y2="153" stroke="#090d16" strokeWidth="2.5" />
            ))}

            {/* Para-brisa Dianteiro Inclinado de Alta Visibilidade */}
            <path d="M52,140 C52,90 90,55 170,55 L170,160 L62,160 Z" fill="url(#sideWindshieldGrad)" stroke="#cbd5e1" strokeWidth="2.5" />

            {/* Porta Pantográfica Única com Vidro Panorâmico Embutido */}
            {isRightSide ? (
              <g>
                <rect x="75" y="55" width="85" height="255" rx="5" fill="#0f172a" stroke="#facc15" strokeWidth="2.5" />
                <rect x="85" y="65" width="65" height="85" rx="4" fill="#38bdf8" fillOpacity="0.3" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="85" y="165" width="65" height="50" rx="4" fill="#38bdf8" fillOpacity="0.2" stroke="#475569" strokeWidth="1" />
                <rect x="145" y="225" width="10" height="15" rx="2" fill="#cbd5e1" />
              </g>
            ) : (
              /* Janela do Motorista com Vidro Bipartido e Desembaçador */
              <g>
                <line x1="120" y1="55" x2="120" y2="158" stroke="#94a3b8" strokeWidth="2.5" />
                <rect x="80" y="115" width="30" height="35" rx="2" fill="#38bdf8" fillOpacity="0.25" stroke="#cbd5e1" strokeWidth="1.5" />
              </g>
            )}

            {/* Bagageiros Pantográficos de Alta Capacidade com Trincos Cromados */}
            <g>
              {[430, 530, 630].map((bx, idx) => (
                <g key={idx}>
                  <rect x={bx} y="200" width="90" height="105" rx="4" fill="#090d16" stroke="#475569" strokeWidth="2" />
                  <rect x={bx + 35} y="208" width="20" height="7" rx="2" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="1" />
                </g>
              ))}
            </g>

            {/* Farol G8 Pontiagudo com Projetor LED */}
            <path d="M46,215 L85,215 L78,255 L45,250 Z" fill="#090d16" stroke="#ffffff" strokeWidth="2" />
            <circle cx="62" cy="232" r="9" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="47" y1="218" x2="82" y2="218" stroke="#38bdf8" strokeWidth="3" />

            {/* Lanterna Traseira Aerodinâmica */}
            <rect x="1015" y="195" width="12" height="75" rx="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

            {/* Sistema de Rodas Trucado 6x2 (Dianteira + 2 Eixos Traseiros com Rodas Alumínio Polido) */}
            <RealisticWheel cx={360} cy={315} radius={66} lugCount={10} isAlloy />
            <RealisticWheel cx={660} cy={315} radius={66} lugCount={10} isDual isAlloy />
            <RealisticWheel cx={775} cy={315} radius={66} lugCount={10} isAlloy />
          </g>
        ) : bodyType === 'pickup' ? (
          /* ========================================================================= */
          /* 3. PICAPE / UTILITÁRIO MODERNO (VW Saveiro / Fiat Strada / Hilux)         */
          /* ========================================================================= */
          <g transform="translate(60, 45)">
            <ellipse cx="480" cy="315" rx="440" ry="10" fill="#000000" fillOpacity="0.5" />

            {/* Perfil Muscular da Picape com Caçamba e Cabine */}
            <path
              d="M75,275 
                 L70,215 
                 C70,200 80,185 105,180 
                 L240,175 
                 L355,105 
                 C375,95 400,95 425,95 
                 L570,95 
                 L635,165 
                 L925,165 
                 C945,165 955,175 955,195 
                 L955,275 
                 L965,285 
                 L935,285 
                 L845,285 
                 A65,65 0 0,0 715,285 
                 L395,285 
                 A65,65 0 0,0 265,285 
                 L75,285 Z"
              fill="url(#sideBodyGrad)"
              stroke="#f8fafc"
              strokeWidth="3.5"
            />

            {/* Vidro da Cabine e Vigia Traseiro */}
            <path
              d="M365,115 L560,115 L615,165 L260,165 Z"
              fill="url(#sideWindshieldGrad)"
              stroke="#cbd5e1"
              strokeWidth="2.5"
            />
            {/* Coluna B Preta */}
            <rect x="470" y="115" width="22" height="50" fill="#090d16" />

            {/* Santantônio Tubular Esportivo na Caçamba */}
            <path d="M590,95 L630,165 L648,165 L610,95 Z" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
            {/* Grade Protetora do Vidro Traseiro */}
            <line x1="580" y1="120" x2="630" y2="165" stroke="#94a3b8" strokeWidth="2" />

            {/* Caçamba com Linha de Capota Marítima */}
            <line x1="640" y1="166" x2="945" y2="166" stroke="#facc15" strokeWidth="3" />
            <rect x="915" y="175" width="25" height="10" rx="2" fill="#cbd5e1" />

            {/* Linha da Porta e Maçaneta */}
            <path d="M305,170 L285,280" stroke="#94a3b8" strokeWidth="2" />
            <path d="M525,170 L515,280" stroke="#94a3b8" strokeWidth="2" />
            <rect x="475" y="185" width="26" height="9" rx="2" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />

            {/* Espelho Retrovisor Esportivo */}
            <polygon points="265,155 235,145 235,175 265,170" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />

            {/* Molduras Plásticas Off-road nas Caixas de Roda */}
            <path d="M255,285 A75,75 0 0,1 405,285" stroke="#090d16" strokeWidth="8" fill="none" />
            <path d="M705,285 A75,75 0 0,1 855,285" stroke="#090d16" strokeWidth="8" fill="none" />

            {/* Farol e Lanterna Traseira */}
            <path d="M75,188 L135,185 L125,225 L72,215 Z" fill="#090d16" stroke="#ffffff" strokeWidth="2" />
            <circle cx="105" cy="202" r="10" fill="#fef08a" />
            <path d="M940,172 L956,172 L954,235 L938,230 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

            {/* Rodas Todo-Terreno de Picape */}
            <RealisticWheel cx={330} cy={285} radius={62} lugCount={5} isAlloy />
            <RealisticWheel cx={780} cy={285} radius={62} lugCount={5} isAlloy />
          </g>
        ) : bodyType === 'car' ? (
          /* ========================================================================= */
          /* 4. CARRO DE APOIO / PASSEIO (Hatchback Moderno - Polo / Onix / Gol)       */
          /* ========================================================================= */
          <g transform="translate(65, 45)">
            <ellipse cx="460" cy="305" rx="420" ry="9" fill="#000000" fillOpacity="0.5" />

            {/* Silhueta Aerodinâmica do Hatchback */}
            <path
              d="M80,270 
                 L72,215 
                 C72,200 85,185 110,180 
                 L245,175 
                 L365,100 
                 C390,85 435,80 495,80 
                 L720,80 
                 C765,80 815,115 850,170 
                 L885,255 
                 C895,270 880,275 860,275 
                 L785,275 
                 A62,62 0 0,0 661,275 
                 L385,275 
                 A62,62 0 0,0 261,275 
                 L80,275 Z"
              fill="url(#sideBodyGrad)"
              stroke="#f8fafc"
              strokeWidth="3.5"
            />

            {/* Vidros Dianteiro, Traseiro e Coluna B */}
            <path
              d="M375,105 L710,105 C750,105 780,130 815,170 L265,170 Z"
              fill="url(#sideWindshieldGrad)"
              stroke="#cbd5e1"
              strokeWidth="2.5"
            />
            <rect x="520" y="105" width="24" height="65" fill="#090d16" />

            {/* Portas Dianteira e Traseira */}
            <path d="M305,170 L285,270" stroke="#94a3b8" strokeWidth="2" />
            <line x1="532" y1="170" x2="532" y2="270" stroke="#94a3b8" strokeWidth="2" />
            <path d="M725,170 C745,210 740,250 720,270" stroke="#94a3b8" strokeWidth="2" fill="none" />
            
            <rect x="475" y="180" width="24" height="8" rx="2" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
            <rect x="670" y="180" width="24" height="8" rx="2" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />

            {/* Antena Shark no Teto e Aerofólio Traseiro */}
            <path d="M740,70 L765,80 L740,80 Z" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="715" y="75" width="40" height="6" rx="2" fill="#090d16" />

            {/* Espelho Retrovisor com Seta LED */}
            <g>
              <polygon points="275,150 240,140 240,168 275,162" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
              <line x1="242" y1="154" x2="265" y2="154" stroke="#f59e0b" strokeWidth="2" />
            </g>

            {/* Farol e Lanterna Traseira */}
            <path d="M78,185 L145,182 L132,218 L75,208 Z" fill="#090d16" stroke="#ffffff" strokeWidth="2" />
            <circle cx="108" cy="200" r="9" fill="#fef08a" />
            <path d="M845,175 L875,185 L865,225 L835,215 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

            {/* Rodas Esportivas de Liga Leve */}
            <RealisticWheel cx={323} cy={275} radius={58} lugCount={5} isAlloy />
            <RealisticWheel cx={723} cy={275} radius={58} lugCount={5} isAlloy />
          </g>
        ) : (
          /* ========================================================================= */
          /* 5. ÔNIBUS URBANO / PADRON / MICRO (Caio Apache Vip V / Marcopolo Torino)  */
          /* ========================================================================= */
          <g transform="translate(35, 15)">
            <ellipse cx="510" cy="345" rx="490" ry="12" fill="#000000" fillOpacity="0.5" />

            {/* Carroceria Urbana com Cúpula e Saia Plana */}
            <path
              d="M50,315 
                 L45,115 
                 C45,55 75,35 125,35 
                 L980,35 
                 C1015,35 1025,55 1025,105 
                 L1025,315 
                 L885,315 
                 A72,72 0 0,0 741,315 
                 L405,315 
                 A72,72 0 0,0 261,315 
                 L50,315 Z"
              fill="url(#sideBodyGrad)"
              stroke="#f8fafc"
              strokeWidth="3.5"
            />

            {/* Cúpula Superior com Letreiro Eletrônico Digital */}
            <rect x="70" y="42" width="165" height="30" rx="4" fill="#050811" stroke="#facc15" strokeWidth="2" />
            <text x="152" y="62" textAnchor="middle" fill="#facc15" fontSize="12" fontWeight="bold" fontFamily="monospace">
              SÃO SILVESTRE
            </text>

            {/* Alçapões de Teto / Saídas de Emergência */}
            <rect x="360" y="27" width="55" height="8" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            <rect x="720" y="27" width="55" height="8" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

            {/* Ar-Condicionado Central de Teto */}
            <rect x="470" y="18" width="180" height="17" rx="4" fill="#334155" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Sequência de Janelas com Bandeiras Superiores de Correr */}
            <g>
              {[250, 375, 500, 625, 750, 875].map((wx, idx) => (
                <g key={idx}>
                  <rect x={wx} y="80" width="112" height="95" rx="5" fill="url(#sideWindshieldGrad)" stroke="#cbd5e1" strokeWidth="2" />
                  {/* Bandeira de ventilação superior com trinco */}
                  <line x1={wx} y1="112" x2={wx + 112} y2="112" stroke="#475569" strokeWidth="2" />
                  <rect x={wx + 50} y="108" width="12" height="5" rx="1" fill="#cbd5e1" />
                </g>
              ))}
            </g>

            {/* Para-brisa Dianteiro Panorâmico */}
            <path d="M52,80 L235,80 L235,178 L52,185 Z" fill="url(#sideWindshieldGrad)" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="80" y1="183" x2="140" y2="120" stroke="#cbd5e1" strokeWidth="3" />

            {/* Portas Pneumáticas Bi-partidas de Ônibus Urbano */}
            {isRightSide ? (
              <g>
                {/* Porta Dianteira (Embarque) */}
                <rect x="62" y="80" width="75" height="235" rx="4" fill="#090d16" stroke="#facc15" strokeWidth="2.5" />
                <line x1="99" y1="80" x2="99" y2="315" stroke="#facc15" strokeWidth="2" strokeDasharray="6 3" />
                <rect x="68" y="90" width="26" height="85" rx="3" fill="#38bdf8" fillOpacity="0.3" stroke="#ffffff" strokeWidth="1" />
                <rect x="105" y="90" width="26" height="85" rx="3" fill="#38bdf8" fillOpacity="0.3" stroke="#ffffff" strokeWidth="1" />
                <rect x="68" y="195" width="26" height="55" rx="3" fill="#38bdf8" fillOpacity="0.25" stroke="#ffffff" strokeWidth="1" />
                <rect x="105" y="195" width="26" height="55" rx="3" fill="#38bdf8" fillOpacity="0.25" stroke="#ffffff" strokeWidth="1" />

                {/* Porta Traseira / Central (Desembarque e Acessibilidade) */}
                <rect x="635" y="80" width="80" height="235" rx="4" fill="#090d16" stroke="#facc15" strokeWidth="2.5" />
                <line x1="675" y1="80" x2="675" y2="315" stroke="#facc15" strokeWidth="2" strokeDasharray="6 3" />
                <rect x="642" y="90" width="27" height="85" rx="3" fill="#38bdf8" fillOpacity="0.3" stroke="#ffffff" strokeWidth="1" />
                <rect x="681" y="90" width="27" height="85" rx="3" fill="#38bdf8" fillOpacity="0.3" stroke="#ffffff" strokeWidth="1" />
                <rect x="642" y="195" width="27" height="55" rx="3" fill="#38bdf8" fillOpacity="0.25" stroke="#ffffff" strokeWidth="1" />
                <rect x="681" y="195" width="27" height="55" rx="3" fill="#38bdf8" fillOpacity="0.25" stroke="#ffffff" strokeWidth="1" />
                {/* Ícone de Cadeirante na Porta Central */}
                <circle cx="675" cy="275" r="9" fill="#0284c7" />
                <circle cx="675" cy="272" r="2.5" fill="#ffffff" />
                <path d="M673,276 L677,276 L675,281" stroke="#ffffff" strokeWidth="1.5" fill="none" />
              </g>
            ) : (
              /* Janela do Motorista com Vidro Bipartido e Friso do Bocal de Combustível */
              <g>
                <line x1="150" y1="80" x2="150" y2="178" stroke="#94a3b8" strokeWidth="2.5" />
                <rect x="158" y="140" width="16" height="8" rx="2" fill="#cbd5e1" />
              </g>
            )}

            {/* Frisos Laterais de Proteção e Compartimentos de Saia */}
            <line x1="50" y1="195" x2="1020" y2="195" stroke="#334155" strokeWidth="3" />
            <line x1="50" y1="240" x2="1020" y2="240" stroke="#090d16" strokeWidth="4" />
            
            {/* Tampas de Manutenção na Saia Inferior (Bateria, Filtro) */}
            <rect x="420" y="248" width="60" height="55" rx="3" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
            <rect x="500" y="248" width="60" height="55" rx="3" fill="#090d16" stroke="#475569" strokeWidth="1.5" />

            {/* Farol Dianteiro Urbano e Lanterna Traseira */}
            <g>
              <rect x="46" y="205" width="18" height="42" rx="4" fill="#090d16" stroke="#ffffff" strokeWidth="2" />
              <circle cx="55" cy="220" r="7" fill="#fef08a" />
              <circle cx="55" cy="237" r="4" fill="#f59e0b" />
            </g>
            <rect x="1016" y="205" width="12" height="55" rx="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

            {/* Rodas Robustas de Ônibus Urbano (Dianteira + Rodado Duplo Traseiro) */}
            <RealisticWheel cx={333} cy={315} radius={66} lugCount={10} />
            <RealisticWheel cx={813} cy={315} radius={66} lugCount={10} isDual />
          </g>
        )}
      </g>
    </svg>
  );
};

export default DamageMap;
