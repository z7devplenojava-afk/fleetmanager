'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trash2, 
  Plus,
  Bus, 
  Truck, 
  Car, 
  FileText,
  Search,
  Camera,
  X,
  RotateCw,
  Sparkles
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DamageSeverity = 'critical' | 'medium' | 'light';
export type DamageType = 'scratch' | 'dent' | 'broken' | 'glass' | 'paint' | 'missing' | 'other';
export type BodyType = 'van' | 'bus_road' | 'bus_dd' | 'bus_urban' | 'microbus' | 'pickup' | 'car';
export type ViewArea = 'side' | 'front' | 'rear';

export interface DamagePoint {
  id?: string;
  x: number;
  y: number;
  description: string;
  type: DamageType;
  severity?: DamageSeverity;
  view?: ViewArea | string;
  bodyType?: BodyType;
  photos?: string[];
}

interface DamageMapProps {
  points: DamagePoint[];
  onChange: (points: DamagePoint[]) => void;
  readOnly?: boolean;
  initialBodyType?: BodyType;
  vehiclePlate?: string;
  vehicleModel?: string;
}

const BODY_TYPES: { id: BodyType; label: string; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'van', label: 'Van / Furgão (Sprinter / Master)', name: 'Van', icon: Truck },
  { id: 'bus_road', label: 'Ônibus Rodoviário (Paradiso 1200 / G8)', name: 'Paradiso 1200', icon: Bus },
  { id: 'bus_dd', label: 'Ônibus Double Decker (DD / Campione)', name: 'Ônibus DD', icon: Bus },
  { id: 'bus_urban', label: 'Ônibus Urbano (Apache Vip / Torino)', name: 'Ônibus Urbano', icon: Bus },
  { id: 'microbus', label: 'Micro-ônibus (Volare Fly / Senior)', name: 'Micro-ônibus', icon: Bus },
  { id: 'pickup', label: 'Picape / Utilitário (Strada / Hilux)', name: 'Picape Utilitário', icon: Car },
  { id: 'car', label: 'Carro de Apoio / Passeio (Hatch)', name: 'Carro de Apoio', icon: Car },
];

const SEVERITY_CONFIG: Record<DamageSeverity, { label: string; sub: string; pinBg: string; ringColor: string; shadow: string }> = {
  critical: {
    label: 'Avaria Crítica',
    sub: 'grande impacto',
    pinBg: 'bg-red-500',
    ringColor: 'ring-red-400',
    shadow: 'shadow-red-500/60'
  },
  medium: {
    label: 'Avaria Média',
    sub: 'necessita reparo',
    pinBg: 'bg-amber-500',
    ringColor: 'ring-amber-400',
    shadow: 'shadow-amber-500/60'
  },
  light: {
    label: 'Avaria Leve',
    sub: 'cosmético',
    pinBg: 'bg-blue-500',
    ringColor: 'ring-blue-400',
    shadow: 'shadow-blue-500/60'
  },
};

const DAMAGE_TYPES: { id: DamageType; label: string }[] = [
  { id: 'scratch', label: 'Arranhão / Risco' },
  { id: 'dent', label: 'Amassado / Batida' },
  { id: 'broken', label: 'Quebrado / Trinca' },
  { id: 'glass', label: 'Vidro / Para-brisa' },
  { id: 'paint', label: 'Pintura Descascada' },
  { id: 'missing', label: 'Faltando Peça' },
  { id: 'other', label: 'Outro Detalhe' },
];

const VEHICLE_IMAGES: Record<BodyType, { side: string; front: string; rear: string }> = {
  van: {
    side: '/images/vehicles/van_side.jpg',
    front: '/images/vehicles/van_front.jpg',
    rear: '/images/vehicles/van_rear.jpg',
  },
  bus_road: {
    side: '/images/vehicles/rodoviario_side.jpg',
    front: '/images/vehicles/rodoviario_front.jpg',
    rear: '/images/vehicles/rodoviario_rear.jpg',
  },
  bus_dd: {
    side: '/images/vehicles/dd_side.jpg',
    front: '/images/vehicles/dd_front.jpg',
    rear: '/images/vehicles/dd_rear.jpg',
  },
  bus_urban: {
    side: '/images/vehicles/urbano_side.jpg',
    front: '/images/vehicles/urbano_front.jpg',
    rear: '/images/vehicles/urbano_rear.jpg',
  },
  microbus: {
    side: '/images/vehicles/micro_side.jpg',
    front: '/images/vehicles/micro_front.jpg',
    rear: '/images/vehicles/micro_rear.jpg',
  },
  pickup: {
    side: '/images/vehicles/picape_side.jpg',
    front: '/images/vehicles/picape_front.jpg',
    rear: '/images/vehicles/picape_rear.jpg',
  },
  car: {
    side: '/images/vehicles/car_side.jpg',
    front: '/images/vehicles/car_front.jpg',
    rear: '/images/vehicles/car_rear.jpg',
  },
};

export const DamageMap: React.FC<DamageMapProps> = ({ 
  points, 
  onChange, 
  readOnly = false,
  initialBodyType = 'van',
  vehiclePlate = 'QXZ-4B32',
  vehicleModel
}) => {
  const [bodyType, setBodyType] = useState<BodyType>(initialBodyType);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [sideOrientation, setSideOrientation] = useState<'right' | 'left'>('right');

  const sideRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const rearRef = useRef<HTMLDivElement>(null);

  // Normaliza o tipo de carroceria se mudar via props
  React.useEffect(() => {
    if (initialBodyType) {
      setBodyType(initialBodyType);
    }
  }, [initialBodyType]);

  const currentVehicleMeta = useMemo(() => {
    return BODY_TYPES.find(b => b.id === bodyType) || BODY_TYPES[0];
  }, [bodyType]);

  const vehicleDisplayName = vehicleModel || currentVehicleMeta.name;

  const handleAreaClick = (
    e: React.MouseEvent<HTMLDivElement>, 
    view: ViewArea, 
    ref: React.RefObject<HTMLDivElement | null>
  ) => {
    if (readOnly) return;
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));

    const newPoint: DamagePoint = {
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      description: '',
      type: 'scratch',
      severity: 'medium',
      view,
      bodyType,
      photos: []
    };

    const updated = [...points, newPoint];
    onChange(updated);
    setSelectedPointIndex(updated.length - 1);
  };

  const updatePoint = (index: number, field: keyof DamagePoint, value: any) => {
    const updated = [...points];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removePoint = (index: number) => {
    const updated = points.filter((_, i) => i !== index);
    onChange(updated);
    if (selectedPointIndex === index) {
      setSelectedPointIndex(null);
    } else if (selectedPointIndex !== null && selectedPointIndex > index) {
      setSelectedPointIndex(selectedPointIndex - 1);
    }
  };

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const currentPhotos = points[index].photos || [];
          updatePoint(index, 'photos', [...currentPhotos, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (pointIndex: number, photoIndex: number) => {
    const currentPhotos = points[pointIndex].photos || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== photoIndex);
    updatePoint(pointIndex, 'photos', updatedPhotos);
  };

  const renderMarkersForView = (view: ViewArea) => {
    return points.map((p, index) => {
      const pView = p.view || 'side';
      // Mapeia views antigas caso existam
      const matches = 
        (view === 'side' && (pView === 'side' || pView === 'side_right' || pView === 'side_left')) ||
        (view === 'front' && (pView === 'front' || pView === 'front_rear')) ||
        (view === 'rear' && pView === 'rear');

      if (!matches) return null;

      const isSelected = selectedPointIndex === index;
      const severity = p.severity || 'medium';
      const config = SEVERITY_CONFIG[severity];

      return (
        <button
          key={p.id || index}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPointIndex(index);
          }}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg ${
            isSelected 
              ? 'w-7 h-7 bg-slate-300 ring-4 ring-sky-400 z-30 scale-110 shadow-sky-500/50' 
              : `w-6 h-6 ${config.pinBg} ${config.shadow} text-white hover:scale-125 z-20`
          }`}
          title={`Ponto #${index + 1}: ${p.description || config.label}`}
        >
          <Plus className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'text-slate-900' : 'text-white'}`} />
        </button>
      );
    });
  };

  const images = VEHICLE_IMAGES[bodyType] || VEHICLE_IMAGES.van;

  return (
    <div className="w-full space-y-4">
      {/* Header com Ícone e Descrição Exata da Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2.5 text-white tracking-wide">
            <FileText className="h-6 w-6 text-amber-500 fill-amber-500/20" />
            <span>Mapa de <span className="text-amber-500 font-extrabold">Avarias</span></span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Clique no veículo para marcar a avaria e visualize os detalhes no painel ao lado.
          </p>
        </div>

        {/* Seletor de Tipo de Carroceria */}
        <div className="flex items-center gap-2">
          <Select 
            value={bodyType} 
            onValueChange={(val) => setBodyType(val as BodyType)}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-slate-900/90 border-slate-700/80 text-xs w-[260px] h-9 text-slate-200 hover:border-amber-500/50 focus:ring-amber-500/30">
              <SelectValue placeholder="Tipo de Veículo" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
              {BODY_TYPES.map(bt => (
                <SelectItem key={bt.id} value={bt.id} className="text-xs focus:bg-amber-500/20 focus:text-amber-400">
                  <div className="flex items-center gap-2">
                    <bt.icon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{bt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid Principal: Veículo (Esquerda) e Painel de Detalhes (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LADO ESQUERDO: Visualizador e Mapeador do Veículo (Col 8) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="relative rounded-2xl border border-slate-800 bg-[#070d18] p-4 sm:p-5 shadow-2xl overflow-hidden backdrop-blur-sm">
            
            {/* Top Bar do Card do Veículo: Placa + Modelo + Alternador de Lado */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/70 text-xs font-semibold text-slate-200 shadow-inner">
                <Car className="h-3.5 w-3.5 text-sky-400" />
                <span>{vehicleDisplayName} - Placa: <span className="font-mono text-amber-400">{vehiclePlate}</span></span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setSideOrientation('right')}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    sideOrientation === 'right' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lateral Direita
                </button>
                <button
                  type="button"
                  onClick={() => setSideOrientation('left')}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    sideOrientation === 'left' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lateral Esquerda
                </button>
              </div>
            </div>

            {/* Grid dos Renders 3D Fotorealistas: Lateral Grande + Frente e Traseira */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
              
              {/* VISTA LATERAL (Col 8) */}
              <div 
                ref={sideRef}
                onClick={(e) => handleAreaClick(e, 'side', sideRef)}
                className="md:col-span-8 relative rounded-xl border border-slate-800/90 bg-gradient-to-b from-[#0b1322] to-[#050912] p-2 flex items-center justify-center cursor-crosshair group overflow-hidden select-none hover:border-slate-700 transition-all min-h-[300px]"
              >
                {/* Malha de fundo sutil */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <img 
                  src={images.side}
                  alt={`Lateral do ${currentVehicleMeta.name}`}
                  className={`max-h-[290px] w-full object-contain pointer-events-none transition-transform duration-300 drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] ${
                    sideOrientation === 'left' ? '-scale-x-100' : ''
                  }`}
                />

                {renderMarkersForView('side')}

                <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Vista: {sideOrientation === 'right' ? 'Lateral Direita' : 'Lateral Esquerda'} (clique para marcar)</span>
                </div>
              </div>

              {/* VISTAS FRENTE & TRASEIRA EMPILHADAS (Col 4) */}
              <div className="md:col-span-4 flex flex-col gap-3 min-h-[300px]">
                
                {/* VISTA FRENTE */}
                <div 
                  ref={frontRef}
                  onClick={(e) => handleAreaClick(e, 'front', frontRef)}
                  className="relative flex-1 rounded-xl border border-slate-800/90 bg-gradient-to-b from-[#0b1322] to-[#050912] p-2 flex items-center justify-center cursor-crosshair group overflow-hidden select-none hover:border-slate-700 transition-all min-h-[145px]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  <img 
                    src={images.front}
                    alt={`Frente do ${currentVehicleMeta.name}`}
                    className="max-h-[135px] w-full object-contain pointer-events-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                  />

                  {renderMarkersForView('front')}

                  <span className="absolute top-2 left-2 text-[10px] font-semibold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
                    Frente
                  </span>
                </div>

                {/* VISTA TRASEIRA */}
                <div 
                  ref={rearRef}
                  onClick={(e) => handleAreaClick(e, 'rear', rearRef)}
                  className="relative flex-1 rounded-xl border border-slate-800/90 bg-gradient-to-b from-[#0b1322] to-[#050912] p-2 flex items-center justify-center cursor-crosshair group overflow-hidden select-none hover:border-slate-700 transition-all min-h-[145px]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  <img 
                    src={images.rear}
                    alt={`Traseira do ${currentVehicleMeta.name}`}
                    className="max-h-[135px] w-full object-contain pointer-events-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                  />

                  {renderMarkersForView('rear')}

                  <span className="absolute top-2 left-2 text-[10px] font-semibold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
                    Traseira
                  </span>
                </div>

              </div>

            </div>

            {/* LEGENDA INFERIOR (Exatamente idêntica aos prints anexados) */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-md shadow-red-500/60 inline-block" />
                <span className="font-semibold text-slate-200">Avaria Crítica</span>
                <span className="text-slate-400 text-[11px]">(grande impacto)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/60 inline-block" />
                <span className="font-semibold text-slate-200">Avaria Média</span>
                <span className="text-slate-400 text-[11px]">(necessita reparo)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/60 inline-block" />
                <span className="font-semibold text-slate-200">Avaria Leve</span>
                <span className="text-slate-400 text-[11px]">(cosmético)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 ring-2 ring-sky-400 inline-block" />
                <span className="font-semibold text-slate-200">Selecionado</span>
                <span className="text-slate-400 text-[11px]">(para ver detalhes)</span>
              </div>
            </div>

          </div>
        </div>

        {/* LADO DIREITO: Painel de Detalhes das Avarias (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="rounded-2xl border border-slate-800 bg-[#070d18] p-4 sm:p-5 shadow-2xl flex flex-col min-h-[460px]">
            
            {/* Header do Painel */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <FileText className="h-4 w-4 text-sky-400" />
                <span>Detalhes das Avarias ({points.length})</span>
              </h3>

              {points.length > 0 && !readOnly && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                >
                  Limpar todas
                </button>
              )}
            </div>

            {/* Estado Vazio (Empty State exatamente da imagem) */}
            {points.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400/80 shadow-inner">
                  <Search className="h-8 w-8 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">Nenhuma avaria marcada no mapa.</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                    Clique em um ponto do veículo para visualizar os detalhes da avaria.
                  </p>
                </div>
              </div>
            ) : (
              /* Lista de Avarias Registradas */
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
                {points.map((point, index) => {
                  const isSelected = selectedPointIndex === index;
                  const severity = point.severity || 'medium';
                  const sevConfig = SEVERITY_CONFIG[severity];
                  const viewLabel = point.view === 'front' ? 'Frente' : point.view === 'rear' ? 'Traseira' : 'Lateral';

                  return (
                    <div 
                      key={point.id || index}
                      onClick={() => setSelectedPointIndex(index)}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-sky-500/80 bg-slate-900/90 shadow-lg shadow-sky-500/10' 
                          : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Bar da Avaria */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${sevConfig.pinBg}`}>
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            Ponto #{index + 1}
                          </span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                            {viewLabel}
                          </span>
                        </div>

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePoint(index);
                            }}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                            title="Remover ponto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Campos de Edição */}
                      <div className="space-y-2.5 text-xs">
                        {/* Gravidade */}
                        <div>
                          <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gravidade</Label>
                          <Select
                            value={severity}
                            onValueChange={(val) => updatePoint(index, 'severity', val)}
                            disabled={readOnly}
                          >
                            <SelectTrigger className="bg-slate-900 border-slate-800 h-7 text-xs text-slate-200 mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                              <SelectItem value="critical" className="text-xs text-red-400">
                                🔴 Avaria Crítica (grande impacto)
                              </SelectItem>
                              <SelectItem value="medium" className="text-xs text-amber-400">
                                🟠 Avaria Média (necessita reparo)
                              </SelectItem>
                              <SelectItem value="light" className="text-xs text-blue-400">
                                🔵 Avaria Leve (cosmético)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tipo de Avaria */}
                        <div>
                          <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tipo de Avaria</Label>
                          <Select
                            value={point.type}
                            onValueChange={(val) => updatePoint(index, 'type', val)}
                            disabled={readOnly}
                          >
                            <SelectTrigger className="bg-slate-900 border-slate-800 h-7 text-xs text-slate-200 mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                              {DAMAGE_TYPES.map(t => (
                                <SelectItem key={t.id} value={t.id} className="text-xs">
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Descrição / Localização */}
                        <div>
                          <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Descrição / Localização</Label>
                          <Input
                            value={point.description}
                            onChange={(e) => updatePoint(index, 'description', e.target.value)}
                            placeholder="Ex: Risco na lataria acima da roda dianteira..."
                            disabled={readOnly}
                            className="bg-slate-900 border-slate-800 h-7 text-xs text-slate-200 mt-1 placeholder:text-slate-600"
                          />
                        </div>

                        {/* Fotos da Avaria */}
                        <div className="pt-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Fotos da Avaria</Label>
                            {!readOnly && (
                              <label className="cursor-pointer text-[10px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                <span>Adicionar</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handlePhotoUpload(index, e)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>

                          {point.photos && point.photos.length > 0 ? (
                            <div className="grid grid-cols-4 gap-1.5 mt-1">
                              {point.photos.map((photo, pIdx) => (
                                <div key={pIdx} className="relative group rounded-md overflow-hidden aspect-square border border-slate-800 bg-slate-900">
                                  <img src={photo} alt={`Foto ${pIdx + 1}`} className="w-full h-full object-cover" />
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      onClick={() => removePhoto(index, pIdx)}
                                      className="absolute inset-0 bg-red-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3.5 w-3.5 text-red-400" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-600 italic">Nenhuma foto anexada a este ponto.</p>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default DamageMap;
