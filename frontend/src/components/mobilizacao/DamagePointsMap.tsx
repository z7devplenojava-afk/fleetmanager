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
 * Componente com Desenhos Vetoriais Ricos de Carrocerias
 */
interface VehicleBlueprintProps {
  bodyType: BodyType;
  view: ViewAngle;
}

const VehicleBlueprintSVG: React.FC<VehicleBlueprintProps> = ({ bodyType, view }) => {
  // Cores de estilização do blueprint automotivo
  const strokeBody = '#e2e8f0';
  const strokeDetails = '#94a3b8';
  const fillBody = '#1e293b';
  const fillWindows = '#0284c7';
  const fillTires = '#0f172a';
  const fillWheels = '#64748b';
  const fillLightsYellow = '#f59e0b';
  const fillLightsRed = '#ef4444';

  if (view === 'front_rear') {
    return (
      <svg viewBox="0 0 1000 450" className="w-full h-full drop-shadow-md">
        {/* VISTA FRONTAL (Lado Esquerdo) */}
        <g transform="translate(80, 40)">
          <text x="180" y="-10" textAnchor="middle" fill="#facc15" fontSize="16" fontWeight="bold" fontFamily="monospace">
            VISTA FRONTAL (DIANTEIRA)
          </text>
          
          {/* Espelhos Retrovisores */}
          <rect x="0" y="80" width="25" height="70" rx="6" fill="#334155" stroke={strokeDetails} strokeWidth="2" />
          <path d="M25,100 L45,120" stroke={strokeDetails} strokeWidth="3" />
          <rect x="335" y="80" width="25" height="70" rx="6" fill="#334155" stroke={strokeDetails} strokeWidth="2" />
          <path d="M335,100 L315,120" stroke={strokeDetails} strokeWidth="3" />

          {/* Carroceria Dianteira */}
          <path
            d="M45,30 Q180,15 315,30 L320,290 Q320,310 300,310 L60,310 Q40,310 40,290 Z"
            fill={fillBody}
            stroke={strokeBody}
            strokeWidth="3.5"
          />

          {/* Itinerário Superior / Letreiro */}
          <rect x="90" y="38" width="180" height="28" rx="4" fill="#0f172a" stroke="#facc15" strokeWidth="1.5" />
          <text x="180" y="57" textAnchor="middle" fill="#facc15" fontSize="12" fontWeight="bold" fontFamily="monospace">
            SÃO SILVESTRE
          </text>

          {/* Para-brisa Dianteiro Panorâmico */}
          <path
            d="M55,75 Q180,68 305,75 L305,175 Q180,180 55,175 Z"
            fill={fillWindows}
            fillOpacity="0.25"
            stroke={strokeDetails}
            strokeWidth="2.5"
          />
          {/* Limpadores de Para-brisa */}
          <line x1="110" y1="170" x2="150" y2="120" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="220" y1="170" x2="260" y2="120" stroke="#cbd5e1" strokeWidth="2.5" />

          {/* Grade do Radiador / Linha Central */}
          <rect x="120" y="215" width="120" height="35" rx="5" fill="#090d16" stroke={strokeDetails} strokeWidth="1.5" />
          <line x1="130" y1="226" x2="230" y2="226" stroke="#475569" strokeWidth="2" />
          <line x1="130" y1="238" x2="230" y2="238" stroke="#475569" strokeWidth="2" />

          {/* Faróis Dianteiros Principais */}
          <rect x="55" y="215" width="45" height="30" rx="6" fill={fillLightsYellow} fillOpacity="0.8" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="260" y="215" width="45" height="30" rx="6" fill={fillLightsYellow} fillOpacity="0.8" stroke="#ffffff" strokeWidth="1.5" />

          {/* Para-choque Dianteiro e Placa */}
          <rect x="35" y="270" width="290" height="40" rx="8" fill="#111827" stroke={strokeBody} strokeWidth="2.5" />
          <rect x="140" y="280" width="80" height="22" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
          <text x="180" y="295" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="bold" fontFamily="monospace">
            BRASIL
          </text>

          {/* Rodas Inferiores */}
          <rect x="50" y="310" width="35" height="20" rx="4" fill={fillTires} />
          <rect x="275" y="310" width="35" height="20" rx="4" fill={fillTires} />
        </g>

        {/* VISTA TRASEIRA (Lado Direito) */}
        <g transform="translate(560, 40)">
          <text x="180" y="-10" textAnchor="middle" fill="#facc15" fontSize="16" fontWeight="bold" fontFamily="monospace">
            VISTA TRASEIRA
          </text>

          {/* Carroceria Traseira */}
          <path
            d="M45,30 Q180,20 315,30 L320,290 Q320,310 300,310 L60,310 Q40,310 40,290 Z"
            fill={fillBody}
            stroke={strokeBody}
            strokeWidth="3.5"
          />

          {/* Vigia Traseiro (Vidro Traseiro) */}
          <path
            d="M60,65 Q180,60 300,65 L295,145 Q180,150 65,145 Z"
            fill={fillWindows}
            fillOpacity="0.25"
            stroke={strokeDetails}
            strokeWidth="2.5"
          />

          {/* Tampa do Motor Traseiro (Capô) */}
          <rect x="70" y="170" width="220" height="95" rx="6" fill="#172033" stroke={strokeDetails} strokeWidth="2" />
          <line x1="90" y1="190" x2="270" y2="190" stroke="#334155" strokeWidth="3" />
          <line x1="90" y1="210" x2="270" y2="210" stroke="#334155" strokeWidth="3" />
          <line x1="90" y1="230" x2="270" y2="230" stroke="#334155" strokeWidth="3" />

          {/* Conjunto de Lanternas Traseiras */}
          <g>
            <rect x="50" y="165" width="16" height="55" rx="4" fill={fillLightsRed} stroke="#ffffff" strokeWidth="1" />
            <circle cx="58" cy="180" r="5" fill="#facc15" />
            <circle cx="58" cy="205" r="5" fill="#ffffff" />
          </g>
          <g>
            <rect x="294" y="165" width="16" height="55" rx="4" fill={fillLightsRed} stroke="#ffffff" strokeWidth="1" />
            <circle cx="302" cy="180" r="5" fill="#facc15" />
            <circle cx="302" cy="205" r="5" fill="#ffffff" />
          </g>

          {/* Para-choque Traseiro e Placa */}
          <rect x="35" y="270" width="290" height="40" rx="8" fill="#111827" stroke={strokeBody} strokeWidth="2.5" />
          <rect x="140" y="280" width="80" height="22" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
          <text x="180" y="295" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="bold" fontFamily="monospace">
            PLACA
          </text>

          {/* Rodas Inferiores */}
          <rect x="50" y="310" width="35" height="20" rx="4" fill={fillTires} />
          <rect x="275" y="310" width="35" height="20" rx="4" fill={fillTires} />
        </g>
      </svg>
    );
  }

  // VISTAS LATERAIS (DIREITA / ESQUERDA)
  const isRightSide = view === 'side_right';

  return (
    <svg viewBox="0 0 1100 420" className="w-full h-full drop-shadow-lg">
      <g transform={isRightSide ? "translate(0, 0)" : "scale(-1, 1) translate(-1100, 0)"}>
        {/* Render conforme o tipo de carroceria selecionado */}
        {bodyType === 'pickup' ? (
          /* PICAPE / UTILITÁRIO (Saveiro / Strada) */
          <g transform="translate(60, 50)">
            {/* Cabine e Caçamba */}
            <path
              d="M100,240 L110,180 L230,175 L330,110 L520,105 L600,165 L890,165 L920,240 L910,260 L800,260 A55,55 0 0,0 690,260 L380,260 A55,55 0 0,0 270,260 L120,260 Z"
              fill={fillBody}
              stroke={strokeBody}
              strokeWidth="3.5"
            />
            {/* Vidro Lateral e Para-brisa */}
            <path
              d="M345,120 L505,115 L570,165 L320,165 Z"
              fill={fillWindows}
              fillOpacity="0.3"
              stroke={strokeDetails}
              strokeWidth="2.5"
            />
            {/* Linha da Porta */}
            <path d="M305,170 L345,260 M555,170 L545,260" stroke={strokeDetails} strokeWidth="2" />
            <rect x="510" y="175" width="22" height="7" rx="2" fill="#94a3b8" />
            {/* Grade da Caçamba / Santantônio */}
            <path d="M580,105 L605,165 L620,165 L600,110 Z" fill="#475569" stroke={strokeDetails} strokeWidth="1.5" />
            {/* Farol Dianteiro e Lanterna Traseira */}
            <path d="M102,185 L145,185 L135,215 L100,215 Z" fill={fillLightsYellow} />
            <path d="M900,170 L918,170 L912,215 L895,215 Z" fill={fillLightsRed} />
            {/* Rodas Dianteira e Traseira */}
            <g transform="translate(325, 260)">
              <circle cx="0" cy="0" r="50" fill={fillTires} stroke="#334155" strokeWidth="4" />
              <circle cx="0" cy="0" r="28" fill={fillWheels} stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="10" fill="#0f172a" />
            </g>
            <g transform="translate(745, 260)">
              <circle cx="0" cy="0" r="50" fill={fillTires} stroke="#334155" strokeWidth="4" />
              <circle cx="0" cy="0" r="28" fill={fillWheels} stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="10" fill="#0f172a" />
            </g>
          </g>
        ) : bodyType === 'van' ? (
          /* VAN / FURGÃO (Sprinter / Master) */
          <g transform="translate(60, 40)">
            <path
              d="M100,250 L115,160 L230,120 L320,65 L890,65 Q940,65 940,110 L940,250 L840,250 A60,60 0 0,0 720,250 L400,250 A60,60 0 0,0 280,250 L110,250 Z"
              fill={fillBody}
              stroke={strokeBody}
              strokeWidth="3.5"
            />
            {/* Vidros da Van */}
            <path
              d="M325,75 L450,75 L450,150 L255,150 Z"
              fill={fillWindows}
              fillOpacity="0.3"
              stroke={strokeDetails}
              strokeWidth="2"
            />
            <rect x="465" y="75" width="210" height="75" rx="4" fill={fillWindows} fillOpacity="0.3" stroke={strokeDetails} strokeWidth="2" />
            <rect x="690" y="75" width="220" height="75" rx="4" fill={fillWindows} fillOpacity="0.3" stroke={strokeDetails} strokeWidth="2" />
            {/* Porta Lateral e Friso */}
            <line x1="460" y1="75" x2="460" y2="250" stroke={strokeDetails} strokeWidth="2.5" />
            <line x1="680" y1="75" x2="680" y2="250" stroke={strokeDetails} strokeWidth="2.5" />
            <rect x="475" y="165" width="24" height="8" rx="2" fill="#94a3b8" />
            <line x1="120" y1="205" x2="930" y2="205" stroke="#334155" strokeWidth="3" />
            {/* Farol e Lanterna */}
            <path d="M110,170 L160,170 L150,210 L105,200 Z" fill={fillLightsYellow} />
            <rect x="925" y="160" width="15" height="60" rx="3" fill={fillLightsRed} />
            {/* Rodas */}
            <g transform="translate(340, 250)">
              <circle cx="0" cy="0" r="54" fill={fillTires} stroke="#334155" strokeWidth="4" />
              <circle cx="0" cy="0" r="30" fill={fillWheels} stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="10" fill="#0f172a" />
            </g>
            <g transform="translate(780, 250)">
              <circle cx="0" cy="0" r="54" fill={fillTires} stroke="#334155" strokeWidth="4" />
              <circle cx="0" cy="0" r="30" fill={fillWheels} stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="10" fill="#0f172a" />
            </g>
          </g>
        ) : (
          /* ÔNIBUS URBANO / RODOVIÁRIO / MICRO-ÔNIBUS */
          <g transform="translate(50, 30)">
            {/* Carroceria Principal */}
            <path
              d="M70,270 L70,80 Q70,40 120,40 L970,40 Q1010,40 1010,80 L1010,270 L890,270 A65,65 0 0,0 760,270 L400,270 A65,65 0 0,0 270,270 L70,270 Z"
              fill={fillBody}
              stroke={strokeBody}
              strokeWidth="3.5"
            />

            {/* Itinerário Eletrônico / Letreiro */}
            <rect x="80" y="48" width="140" height="24" rx="3" fill="#090d16" stroke="#facc15" strokeWidth="1.5" />
            <text x="150" y="65" textAnchor="middle" fill="#facc15" fontSize="11" fontWeight="bold" fontFamily="monospace">
              VIAÇÃO SÃO SILVESTRE
            </text>

            {/* Para-brisa Dianteiro Amplo */}
            <path
              d="M80,80 L230,80 L230,175 L80,185 Z"
              fill={fillWindows}
              fillOpacity="0.3"
              stroke={strokeDetails}
              strokeWidth="2.5"
            />

            {/* Janelas dos Passageiros (Sequência de janelas com bandeiras superiores) */}
            <g>
              <rect x="245" y="80" width="115" height="95" rx="4" fill={fillWindows} fillOpacity="0.25" stroke={strokeDetails} strokeWidth="2" />
              <line x1="245" y1="110" x2="360" y2="110" stroke={strokeDetails} strokeWidth="1.5" />

              <rect x="375" y="80" width="115" height="95" rx="4" fill={fillWindows} fillOpacity="0.25" stroke={strokeDetails} strokeWidth="2" />
              <line x1="375" y1="110" x2="490" y2="110" stroke={strokeDetails} strokeWidth="1.5" />

              <rect x="505" y="80" width="115" height="95" rx="4" fill={fillWindows} fillOpacity="0.25" stroke={strokeDetails} strokeWidth="2" />
              <line x1="505" y1="110" x2="620" y2="110" stroke={strokeDetails} strokeWidth="1.5" />

              <rect x="635" y="80" width="115" height="95" rx="4" fill={fillWindows} fillOpacity="0.25" stroke={strokeDetails} strokeWidth="2" />
              <line x1="635" y1="110" x2="750" y2="110" stroke={strokeDetails} strokeWidth="1.5" />

              <rect x="765" y="80" width="115" height="95" rx="4" fill={fillWindows} fillOpacity="0.25" stroke={strokeDetails} strokeWidth="2" />
              <line x1="765" y1="110" x2="880" y2="110" stroke={strokeDetails} strokeWidth="1.5" />

              <rect x="895" y="80" width="95" height="95" rx="4" fill={fillWindows} fillOpacity="0.25" stroke={strokeDetails} strokeWidth="2" />
              <line x1="895" y1="110" x2="990" y2="110" stroke={strokeDetails} strokeWidth="1.5" />
            </g>

            {/* Portas Pantográficas de Passageiros (Exibidas se for lado direito com portas) */}
            {isRightSide ? (
              <g>
                {/* Porta Dianteira */}
                <rect x="85" y="80" width="65" height="185" rx="4" fill="#0f172a" stroke="#facc15" strokeWidth="2" />
                <line x1="117" y1="80" x2="117" y2="265" stroke="#facc15" strokeWidth="1.5" strokeDasharray="4 2" />
                <rect x="92" y="90" width="20" height="60" rx="3" fill={fillWindows} fillOpacity="0.4" stroke="#ffffff" strokeWidth="1" />
                <rect x="123" y="90" width="20" height="60" rx="3" fill={fillWindows} fillOpacity="0.4" stroke="#ffffff" strokeWidth="1" />

                {/* Porta Central / Traseira */}
                <rect x="640" y="80" width="70" height="185" rx="4" fill="#0f172a" stroke="#facc15" strokeWidth="2" />
                <line x1="675" y1="80" x2="675" y2="265" stroke="#facc15" strokeWidth="1.5" strokeDasharray="4 2" />
                <rect x="648" y="90" width="20" height="60" rx="3" fill={fillWindows} fillOpacity="0.4" stroke="#ffffff" strokeWidth="1" />
                <rect x="682" y="90" width="20" height="60" rx="3" fill={fillWindows} fillOpacity="0.4" stroke="#ffffff" strokeWidth="1" />
              </g>
            ) : (
              /* Janela do Motorista com Vidro Corrediço */
              <g>
                <line x1="160" y1="80" x2="160" y2="175" stroke="#94a3b8" strokeWidth="2" />
                <rect x="170" y="130" width="12" height="6" rx="1" fill="#cbd5e1" />
              </g>
            )}

            {/* Frisos e Vincos Laterais de Carroceria */}
            <line x1="70" y1="190" x2="1005" y2="190" stroke="#334155" strokeWidth="3" />
            <line x1="70" y1="230" x2="1005" y2="230" stroke="#1e293b" strokeWidth="4" />

            {/* Bagageiros Inferiores (se Rodoviário) */}
            {bodyType === 'bus_road' && (
              <g>
                <rect x="420" y="200" width="100" height="60" rx="3" fill="#111827" stroke="#475569" strokeWidth="1.5" />
                <rect x="460" y="205" width="20" height="6" rx="2" fill="#94a3b8" />
                <rect x="535" y="200" width="100" height="60" rx="3" fill="#111827" stroke="#475569" strokeWidth="1.5" />
                <rect x="575" y="205" width="20" height="6" rx="2" fill="#94a3b8" />
              </g>
            )}

            {/* Farol Dianteiro e Lanterna Traseira */}
            <g>
              <rect x="70" y="205" width="16" height="35" rx="4" fill={fillLightsYellow} stroke="#ffffff" strokeWidth="1" />
              <circle cx="78" cy="222" r="5" fill="#ffffff" />
            </g>
            <g>
              <rect x="995" y="205" width="15" height="45" rx="3" fill={fillLightsRed} stroke="#ffffff" strokeWidth="1" />
            </g>

            {/* Rodas Robustas (Dianteira e Traseira Dupla) */}
            <g transform="translate(335, 270)">
              <circle cx="0" cy="0" r="62" fill={fillTires} stroke="#334155" strokeWidth="5" />
              <circle cx="0" cy="0" r="38" fill={fillWheels} stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#facc15" strokeWidth="1.5" />
              {/* Parafusos da Roda */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                <circle
                  key={ang}
                  cx={26 * Math.cos((ang * Math.PI) / 180)}
                  cy={26 * Math.sin((ang * Math.PI) / 180)}
                  r="2.5"
                  fill="#ffffff"
                />
              ))}
            </g>

            <g transform="translate(825, 270)">
              <circle cx="0" cy="0" r="62" fill={fillTires} stroke="#334155" strokeWidth="5" />
              <circle cx="0" cy="0" r="38" fill={fillWheels} stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#facc15" strokeWidth="1.5" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                <circle
                  key={ang}
                  cx={26 * Math.cos((ang * Math.PI) / 180)}
                  cy={26 * Math.sin((ang * Math.PI) / 180)}
                  r="2.5"
                  fill="#ffffff"
                />
              ))}
            </g>
          </g>
        )}
      </g>
    </svg>
  );
};

export default DamageMap;
