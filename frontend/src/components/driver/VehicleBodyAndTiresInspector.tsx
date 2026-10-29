import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Disc,
  Droplets,
  Trash2,
  Wrench,
  Clock,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

export type VehicleViewSide = 'LATERAL_DIREITA' | 'LATERAL_ESQUERDA' | 'FRENTE' | 'TRASEIRA';

export type DamageCategory = 'ARRANHADO' | 'AMASSADO' | 'TRINCADO' | 'QUEBRADO' | 'PINTURA' | 'OUTRO';

export const DAMAGE_CATEGORIES: Array<{
  value: DamageCategory;
  label: string;
  badgeClass: string;
}> = [
  { value: 'ARRANHADO', label: 'Arranhado', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { value: 'AMASSADO', label: 'Amassado', badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  { value: 'TRINCADO', label: 'Trincado', badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { value: 'QUEBRADO', label: 'Quebrado', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { value: 'PINTURA', label: 'Pintura', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { value: 'OUTRO', label: 'Outro', badgeClass: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40' },
];

export interface BodyDamageMark {
  id: string;
  number: number;
  view: VehicleViewSide;
  regionLabel: string;
  xPercent: number;
  yPercent: number;
  damageType: DamageCategory;
  notes: string;
  createdAt: string;
  blueprint?: VehicleBlueprintType;
  vehicleLabel?: string;
}

export type TireIssueType = 'MARCADO' | 'CORTADO' | 'DESGASTE' | 'BAIXA_PRESSAO' | 'BOLHA' | 'OK';

export interface TireInspectionItem {
  position: string;
  label: string;
  hasIssue: boolean;
  issueType: TireIssueType;
  notes: string;
}

export type FluidLevelStatus = 'MAXIMO' | 'NORMAL' | 'MINIMO_URGENTE';

export interface FluidLevelsState {
  agua: FluidLevelStatus;
  aguaCompleted: boolean;
  oleoMotor: FluidLevelStatus;
  oleoMotorCompleted: boolean;
  oleoDiesel: FluidLevelStatus;
  oleoDieselCompleted: boolean;
  oleoHidraulico: FluidLevelStatus;
  oleoHidraulicoCompleted: boolean;
}

export interface DelayOccurrenceReport {
  hasDelay: boolean;
  route: string;
  delayDuration: string;
  witness1Name: string;
  witness1Phone: string;
  witness2Name: string;
  witness2Phone: string;
  witness3Name: string;
  witness3Phone: string;
  delayReason: string;
}

export interface VehicleInspectionExtraData {
  hasBodyDamage: boolean;
  bodyNotes: string;
  damageMarks: BodyDamageMark[];
  hasTireDamage: boolean;
  tireGeneralNotes: string;
  tires: TireInspectionItem[];
  fluidLevels: FluidLevelsState;
  repairRequestNotes: string;
  delayReport: DelayOccurrenceReport;
}

export const INITIAL_TIRE_POSITIONS: TireInspectionItem[] = [
  { position: 'DE', label: 'Dianteiro Esquerdo (DE)', hasIssue: false, issueType: 'OK', notes: '' },
  { position: 'DD', label: 'Dianteiro Direito (DD)', hasIssue: false, issueType: 'OK', notes: '' },
  { position: 'TEE', label: 'Traseiro Esq. Externo (TEE)', hasIssue: false, issueType: 'OK', notes: '' },
  { position: 'TEI', label: 'Traseiro Esq. Interno (TEI)', hasIssue: false, issueType: 'OK', notes: '' },
  { position: 'TDE', label: 'Traseiro Dir. Externo (TDE)', hasIssue: false, issueType: 'OK', notes: '' },
  { position: 'TDI', label: 'Traseiro Dir. Interno (TDI)', hasIssue: false, issueType: 'OK', notes: '' },
  { position: 'ESTEPE', label: 'Estepe / Reserva', hasIssue: false, issueType: 'OK', notes: '' },
];

export const createInitialInspectionExtraData = (): VehicleInspectionExtraData => ({
  hasBodyDamage: false,
  bodyNotes: '',
  damageMarks: [],
  hasTireDamage: false,
  tireGeneralNotes: '',
  tires: INITIAL_TIRE_POSITIONS.map((t) => ({ ...t })),
  fluidLevels: {
    agua: 'MAXIMO',
    aguaCompleted: false,
    oleoMotor: 'MAXIMO',
    oleoMotorCompleted: false,
    oleoDiesel: 'MAXIMO',
    oleoDieselCompleted: false,
    oleoHidraulico: 'MAXIMO',
    oleoHidraulicoCompleted: false,
  },
  repairRequestNotes: '',
  delayReport: {
    hasDelay: false,
    route: '',
    delayDuration: '',
    witness1Name: '',
    witness1Phone: '',
    witness2Name: '',
    witness2Phone: '',
    witness3Name: '',
    witness3Phone: '',
    delayReason: '',
  },
});

export const VIEW_LABELS: Record<VehicleViewSide, string> = {
  LATERAL_DIREITA: 'Lateral Superior (Lado Portas)',
  LATERAL_ESQUERDA: 'Lateral Inferior (Lado Motorista)',
  FRENTE: 'Dianteira / Frente',
  TRASEIRA: 'Traseira / Vigia',
};

export type VehicleBlueprintType = 'CONVENTIONAL' | 'DOUBLE_DECKER' | 'MICROBUS' | 'VAN';

export const VEHICLE_BLUEPRINT_CONFIGS: Record<
  VehicleBlueprintType,
  { label: string; icon: string; image: string; description: string }
> = {
  CONVENTIONAL: {
    label: 'Ônibus Convencional',
    icon: '🚌',
    image: '/vehicles/bus-conventional.jpg',
    description: 'Marcopolo Paradiso / Executivo Rodoviário (Laterais, Dianteira e Traseira)',
  },
  DOUBLE_DECKER: {
    label: 'Double Decker (DD 1800)',
    icon: '🚍',
    image: '/vehicles/bus-doubledecker.jpg',
    description: 'Marcopolo Paradiso G8 1800 DD — 2 Andares (Laterais, Dianteira e Traseira)',
  },
  MICROBUS: {
    label: 'Micro-Ônibus',
    icon: '🚐',
    image: '/vehicles/microbus-thunder.jpg',
    description: 'Neobus Thunder Executivo / Urbano (Laterais, Dianteira e Traseira)',
  },
  VAN: {
    label: 'Van MB Sprinter',
    icon: '🚐',
    image: '/vehicles/van-sprinter.jpg',
    description: 'Mercedes-Benz Sprinter 413 CDi (Laterais, Dianteira e Traseira)',
  },
};

const resolveRegionLabel = (view: VehicleViewSide, x: number, y: number): string => {
  if (view === 'FRENTE') {
    if (y < 45) return 'Frente - Para-brisa / Letreiro';
    if (y > 75) return 'Frente - Para-choque / Faróis';
    return 'Frente - Grade / Capô';
  }
  if (view === 'TRASEIRA') {
    if (y < 45) return 'Traseira - Vigia Superior';
    if (y > 75) return 'Traseira - Para-choque / Lanternas';
    return 'Traseira - Tampa do Motor';
  }
  const sideName = view === 'LATERAL_DIREITA' ? 'Lat. Direita' : 'Lat. Esquerda';
  const horiz = x < 28 ? 'Dianteira' : x > 72 ? 'Traseira' : 'Central';
  const vert = y < 45 ? 'Janelas / Teto' : y > 75 ? 'Saia / Rodado' : 'Chaparia / Bagageiro';
  return `${sideName} (${horiz} - ${vert})`;
};

interface VehicleBodyAndTiresInspectorProps {
  value: VehicleInspectionExtraData;
  onChange: (next: VehicleInspectionExtraData) => void;
  initialBlueprint?: VehicleBlueprintType;
}

export const VehicleBodyAndTiresInspector: React.FC<VehicleBodyAndTiresInspectorProps> = ({
  value,
  onChange,
  initialBlueprint,
}) => {
  const [selectedBlueprint, setSelectedBlueprint] = React.useState<VehicleBlueprintType>(
    initialBlueprint || 'CONVENTIONAL'
  );
  const [filterBlueprint, setFilterBlueprint] = React.useState<VehicleBlueprintType | 'ALL'>('ALL');

  React.useEffect(() => {
    if (initialBlueprint) {
      setSelectedBlueprint(initialBlueprint);
    }
  }, [initialBlueprint]);

  const handleBlueprintClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Math.max(2, Math.min(98, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const yPercent = Math.max(2, Math.min(98, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    const nextNumber = value.damageMarks.length + 1;

    let view: VehicleViewSide = 'LATERAL_DIREITA';
    let regionLabel = '';

    if (xPercent >= 74) {
      if (yPercent < 50) {
        view = 'FRENTE';
        regionLabel = yPercent < 25 ? 'Frente - Para-brisa / Letreiro' : 'Frente - Grade / Para-choque';
      } else {
        view = 'TRASEIRA';
        regionLabel = yPercent < 75 ? 'Traseira - Vigia / Tampa' : 'Traseira - Para-choque / Lanternas';
      }
    } else {
      if (yPercent < 50) {
        view = 'LATERAL_DIREITA';
        const horiz = xPercent < 25 ? 'Traseira' : xPercent > 55 ? 'Dianteira' : 'Central';
        const vert = yPercent < 25 ? 'Janelas / Teto' : 'Chaparia / Bagageiro';
        regionLabel = `Lateral Superior (${horiz} - ${vert})`;
      } else {
        view = 'LATERAL_ESQUERDA';
        const horiz = xPercent < 25 ? 'Dianteira' : xPercent > 55 ? 'Traseira' : 'Central';
        const vert = yPercent < 75 ? 'Janelas / Teto' : 'Saia / Rodado';
        regionLabel = `Lateral Inferior (${horiz} - ${vert})`;
      }
    }

    const currentConf = VEHICLE_BLUEPRINT_CONFIGS[selectedBlueprint];

    const newMark: BodyDamageMark = {
      id: `dmg-${Date.now()}-${nextNumber}`,
      number: nextNumber,
      view,
      regionLabel,
      xPercent,
      yPercent,
      damageType: 'ARRANHADO',
      notes: '',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      blueprint: selectedBlueprint,
      vehicleLabel: currentConf.label,
    };

    onChange({
      ...value,
      hasBodyDamage: true,
      damageMarks: [...value.damageMarks, newMark],
    });
  };

  const handleAddMark = (view: VehicleViewSide, e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Math.max(4, Math.min(96, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const yPercent = Math.max(8, Math.min(92, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    const nextNumber = value.damageMarks.length + 1;
    const regionLabel = resolveRegionLabel(view, xPercent, yPercent);

    const currentConf = VEHICLE_BLUEPRINT_CONFIGS[selectedBlueprint];

    const newMark: BodyDamageMark = {
      id: `dmg-${Date.now()}-${nextNumber}`,
      number: nextNumber,
      view,
      regionLabel,
      xPercent,
      yPercent,
      damageType: 'ARRANHADO',
      notes: '',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      blueprint: selectedBlueprint,
      vehicleLabel: currentConf.label,
    };

    onChange({
      ...value,
      hasBodyDamage: true,
      damageMarks: [...value.damageMarks, newMark],
    });
  };

  const handleUpdateMark = (id: string, patch: Partial<BodyDamageMark>) => {
    onChange({
      ...value,
      damageMarks: value.damageMarks.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  };

  const handleRemoveMark = (id: string) => {
    const filtered = value.damageMarks
      .filter((m) => m.id !== id)
      .map((m, idx) => ({ ...m, number: idx + 1 }));
    onChange({
      ...value,
      hasBodyDamage: filtered.length > 0 ? true : value.hasBodyDamage,
      damageMarks: filtered,
    });
  };

  const handleClearAllMarks = () => {
    onChange({
      ...value,
      damageMarks: [],
      hasBodyDamage: false,
    });
  };

  const handleToggleTireIssue = (position: string, hasIssue: boolean) => {
    const nextTires = value.tires.map((t) =>
      t.position === position
        ? {
            ...t,
            hasIssue,
            issueType: (hasIssue ? (t.issueType === 'OK' ? 'MARCADO' : t.issueType) : 'OK') as TireIssueType,
          }
        : t
    );
    const anyIssue = nextTires.some((t) => t.hasIssue);
    onChange({
      ...value,
      hasTireDamage: anyIssue ? true : value.hasTireDamage,
      tires: nextTires,
    });
  };

  const handleUpdateTire = (position: string, patch: Partial<TireInspectionItem>) => {
    const nextTires = value.tires.map((t) => (t.position === position ? { ...t, ...patch } : t));
    onChange({
      ...value,
      tires: nextTires,
    });
  };

  const handleFluidChange = (
    key: 'agua' | 'oleoMotor' | 'oleoDiesel' | 'oleoHidraulico',
    level: FluidLevelStatus
  ) => {
    onChange({
      ...value,
      fluidLevels: {
        ...value.fluidLevels,
        [key]: level,
      },
    });
  };

  const handleFluidCompletedToggle = (
    key: 'aguaCompleted' | 'oleoMotorCompleted' | 'oleoDieselCompleted' | 'oleoHidraulicoCompleted',
    completed: boolean
  ) => {
    onChange({
      ...value,
      fluidLevels: {
        ...value.fluidLevels,
        [key]: completed,
      },
    });
  };

  const hasAnyUrgentFluid =
    value.fluidLevels.agua === 'MINIMO_URGENTE' ||
    value.fluidLevels.oleoMotor === 'MINIMO_URGENTE' ||
    value.fluidLevels.oleoDiesel === 'MINIMO_URGENTE' ||
    value.fluidLevels.oleoHidraulico === 'MINIMO_URGENTE';

  return (
    <div className="space-y-6">
      {/* 1. CHECK-LIST DO VEÍCULO: MAPA DE AVARIAS NA CARROCERIA + PNEUS (FRENTE DA FOLHA) */}
      <Card className="border-border/80 shadow-md">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <CircleDot className="h-5 w-5 text-red-500" />
                Check-list do Veículo — Mapa de Avarias na Carroceria & Pneus
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Toque/clique na figura do veículo abaixo para circular o local exato da avaria. Cada ponto marcado é exibido e registrado automaticamente.
              </CardDescription>
            </div>
            {value.damageMarks.length > 0 && (
              <Badge variant="destructive" className="text-xs px-3 py-1 font-bold self-start sm:self-center">
                {value.damageMarks.length} avaria(s) marcada(s)
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-5">
          {/* Pergunta: Existem avarias, arranhados, amassados, etc, na carroceria? ( ) Sim ( ) Não */}
          <div className="p-3.5 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">
                Existem avarias, arranhados, amassados, etc, na carroceria?
              </p>
              <p className="text-xs text-muted-foreground">
                Se sim, identifique com um círculo na figura abaixo o local afetado.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant={value.hasBodyDamage ? 'destructive' : 'outline'}
                onClick={() => onChange({ ...value, hasBodyDamage: true })}
                className="font-bold min-w-[85px]"
              >
                ( {value.hasBodyDamage ? 'X' : ' '} ) Sim
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!value.hasBodyDamage ? 'default' : 'outline'}
                onClick={() => onChange({ ...value, hasBodyDamage: false, damageMarks: [] })}
                className={`font-bold min-w-[85px] ${
                  !value.hasBodyDamage ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                }`}
              >
                ( {!value.hasBodyDamage ? 'X' : ' '} ) Não
              </Button>
            </div>
          </div>

          {/* Anotações da carroceria */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Anotações de Carroceria:
            </Label>
            <Input
              value={value.bodyNotes}
              onChange={(e) => onChange({ ...value, bodyNotes: e.target.value })}
              placeholder="Anotações gerais sobre o estado da carroceria, pintura, retrovisores, para-choques..."
              className="h-9 text-sm"
            />
          </div>

          {/* DIAGRAMA VISUAL TÉCNICO DO VEÍCULO (4 Vistas: Laterais, Frente e Traseira) */}
          <div className="rounded-xl border-2 border-zinc-700/60 bg-zinc-950 p-3 sm:p-4 space-y-4 text-zinc-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <CircleDot className="h-4 w-4 text-red-500 animate-pulse" />
                  Clique / Toque na imagem do veículo para circular o ponto exato da avaria
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Selecione o tipo de veículo abaixo para carregar a planta técnica com as 4 vistas:
                </p>
              </div>
              {value.damageMarks.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllMarks}
                  className="h-7 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1 self-start sm:self-center"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Limpar marcações
                </Button>
              )}
            </div>

            {/* SELETOR DE MODELO DO VEÍCULO (ÔNIBUS, DD 1800, MICRO-ÔNIBUS, VAN SPRINTER) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {(Object.keys(VEHICLE_BLUEPRINT_CONFIGS) as VehicleBlueprintType[]).map((key) => {
                const conf = VEHICLE_BLUEPRINT_CONFIGS[key];
                const isSelected = selectedBlueprint === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedBlueprint(key)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-950/40 text-white shadow-sm ring-1 ring-red-500'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-lg shrink-0">{conf.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{conf.label}</span>
                      <span className="text-[10px] text-zinc-400 block truncate">4 Vistas Técnicas</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* PLANTA TÉCNICA INTERATIVA COM MARCADORES NUMERADOS DE AVARIA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 px-1">
                <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <span>{VEHICLE_BLUEPRINT_CONFIGS[selectedBlueprint].icon}</span>
                  <span>{VEHICLE_BLUEPRINT_CONFIGS[selectedBlueprint].description}</span>
                </span>
                <span className="text-amber-400 text-[10px] hidden sm:inline">
                  {value.damageMarks.filter((m) => !m.blueprint || m.blueprint === selectedBlueprint).length} ponto(s) marcado(s) neste veículo
                  {value.damageMarks.length > value.damageMarks.filter((m) => !m.blueprint || m.blueprint === selectedBlueprint).length && (
                    <span className="text-zinc-400 ml-1">({value.damageMarks.length} no total geral)</span>
                  )}
                </span>
              </div>

              {/* CONTAINER DA IMAGEM TÉCNICA E OVERLAY CLICÁVEL */}
              <div
                onClick={handleBlueprintClick}
                className="relative rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden cursor-crosshair select-none group shadow-lg"
                title="Clique em qualquer lugar da imagem para marcar uma avaria"
              >
                <img
                  src={VEHICLE_BLUEPRINT_CONFIGS[selectedBlueprint].image}
                  alt={VEHICLE_BLUEPRINT_CONFIGS[selectedBlueprint].label}
                  className="w-full h-auto object-contain block pointer-events-none"
                />

                {/* Grid visual sutil com rótulos de orientação */}
                <div className="absolute top-1.5 left-2 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-zinc-300 px-2 py-0.5 rounded border border-white/10 pointer-events-none">
                  Lateral Superior
                </div>
                <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-zinc-300 px-2 py-0.5 rounded border border-white/10 pointer-events-none">
                  Lateral Inferior
                </div>
                <div className="absolute top-1.5 right-2 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-zinc-300 px-2 py-0.5 rounded border border-white/10 pointer-events-none">
                  Dianteira
                </div>
                <div className="absolute bottom-1.5 right-2 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-zinc-300 px-2 py-0.5 rounded border border-white/10 pointer-events-none">
                  Traseira
                </div>

                {/* MARCADORES / PINOS NUMERADOS DE AVARIA (Filtrados pelo Veículo Ativo) */}
                {value.damageMarks
                  .filter((m) => !m.blueprint || m.blueprint === selectedBlueprint)
                  .map((m) => (
                    <div
                      key={m.id}
                      style={{
                        left: `${m.xPercent}%`,
                        top: `${m.yPercent}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute z-20 group/pin flex items-center justify-center cursor-pointer"
                    >
                      {/* Anel pulsante */}
                      <span className="absolute w-8 h-8 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
                      {/* Marcador circular numerado com borda vermelha e sombra */}
                      <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-600 border-2 border-white text-white font-black text-[11px] sm:text-xs flex items-center justify-center shadow-lg transition-transform hover:scale-125">
                        {m.number}
                      </div>
                      {/* Tooltip com detalhe */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/pin:flex items-center gap-1 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap border border-white/20 pointer-events-none shadow-md z-30">
                        <span>#{m.number}</span>
                        <span className="text-zinc-400">•</span>
                        <span>{m.regionLabel}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Lista em tempo real de Avarias Marcadas conforme o motorista clica no veículo */}
            {value.damageMarks.length > 0 && (
              <div className="pt-2 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Registro de Avarias Marcadas no Veículo ({value.damageMarks.length})
                  </div>
                  {/* Filtro por tipo de veículo */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFilterBlueprint('ALL')}
                      className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold border transition-all ${
                        filterBlueprint === 'ALL'
                          ? 'border-red-500 bg-red-950/60 text-white ring-1 ring-red-500'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Todas ({value.damageMarks.length})
                    </button>
                    {(Object.keys(VEHICLE_BLUEPRINT_CONFIGS) as VehicleBlueprintType[]).map((bpKey) => {
                      const count = value.damageMarks.filter((m) => (m.blueprint || selectedBlueprint) === bpKey).length;
                      if (count === 0 && filterBlueprint !== bpKey && selectedBlueprint !== bpKey) return null;
                      const conf = VEHICLE_BLUEPRINT_CONFIGS[bpKey];
                      return (
                        <button
                          key={bpKey}
                          type="button"
                          onClick={() => {
                            setFilterBlueprint(bpKey);
                            setSelectedBlueprint(bpKey);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold border flex items-center gap-1 transition-all ${
                            filterBlueprint === bpKey
                              ? 'border-red-500 bg-red-950/60 text-white ring-1 ring-red-500'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span>{conf.icon}</span>
                          <span>{conf.label}</span>
                          <span className="text-[10px] opacity-80">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {value.damageMarks
                    .filter((m) => filterBlueprint === 'ALL' || (m.blueprint || selectedBlueprint) === filterBlueprint)
                    .map((mark) => {
                      const markBp = mark.blueprint || selectedBlueprint;
                      const conf = VEHICLE_BLUEPRINT_CONFIGS[markBp] || VEHICLE_BLUEPRINT_CONFIGS.CONVENTIONAL;
                      return (
                        <div
                          key={mark.id}
                          className="p-2.5 rounded-lg border border-red-500/40 bg-red-950/30 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {mark.number}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/40 text-amber-300 bg-amber-500/10 font-bold shrink-0">
                                    {conf.icon} {mark.vehicleLabel || conf.label}
                                  </Badge>
                                  <span className="text-xs font-bold text-white truncate">{mark.regionLabel}</span>
                                </div>
                                <span className="text-[10px] text-zinc-400 block truncate">
                                  {VIEW_LABELS[mark.view]} • Marcado às {mark.createdAt}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMark(mark.id)}
                              className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20 shrink-0"
                              title="Remover ponto de avaria"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* Seleção rápida de categoria de avaria com 1 clique */}
                          <div className="flex flex-wrap gap-1">
                            {DAMAGE_CATEGORIES.map((cat) => {
                              const isSelected = mark.damageType === cat.value;
                              return (
                                <button
                                  key={cat.value}
                                  type="button"
                                  onClick={() => handleUpdateMark(mark.id, { damageType: cat.value })}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                    isSelected
                                      ? `${cat.badgeClass} ring-1 ring-white/40 shadow-sm scale-105`
                                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                                  }`}
                                >
                                  {cat.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="pt-0.5">
                            <Input
                              value={mark.notes}
                              onChange={(e) => handleUpdateMark(mark.id, { notes: e.target.value })}
                              placeholder="Descreva detalhes da avaria neste local..."
                              className="h-8 text-xs bg-zinc-900 border-zinc-700 text-white"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO DE PNEUS: Pneus marcado/cortado? ( ) Sim ( ) Não */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500">
                  <Disc className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-foreground">
                    Pneus marcado / cortado ou com irregularidade?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Informe abaixo o estado dos pneus (marcado, cortado, desgaste, calibragem ou bolha).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant={value.hasTireDamage ? 'destructive' : 'outline'}
                  onClick={() => onChange({ ...value, hasTireDamage: true })}
                  className="font-bold min-w-[85px]"
                >
                  ( {value.hasTireDamage ? 'X' : ' '} ) Sim
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!value.hasTireDamage ? 'default' : 'outline'}
                  onClick={() =>
                    onChange({
                      ...value,
                      hasTireDamage: false,
                      tires: value.tires.map((t) => ({ ...t, hasIssue: false, issueType: 'OK', notes: '' })),
                    })
                  }
                  className={`font-bold min-w-[85px] ${
                    !value.hasTireDamage ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                  }`}
                >
                  ( {!value.hasTireDamage ? 'X' : ' '} ) Não
                </Button>
              </div>
            </div>

            {/* Grade de Posições dos Pneus para marcação rápida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {value.tires.map((tire) => (
                <div
                  key={tire.position}
                  className={`p-2.5 rounded-lg border transition-all ${
                    tire.hasIssue
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-border bg-background/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{tire.label}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTireIssue(tire.position, !tire.hasIssue)}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                        tire.hasIssue
                          ? 'bg-red-600 text-white'
                          : 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25'
                      }`}
                    >
                      {tire.hasIssue ? 'Com Avaria' : '✓ Pneu OK'}
                    </button>
                  </div>

                  {tire.hasIssue && (
                    <div className="mt-2 space-y-1.5 pt-2 border-t border-red-500/20">
                      <select
                        value={tire.issueType}
                        onChange={(e) =>
                          handleUpdateTire(tire.position, { issueType: e.target.value as TireIssueType })
                        }
                        aria-label={`Condição do pneu ${tire.label}`}
                        className="w-full h-7 rounded border border-input bg-background px-2 text-xs font-semibold"
                      >
                        <option value="MARCADO">Marcado / Ralado na guia</option>
                        <option value="CORTADO">Cortado / Rasgado</option>
                        <option value="DESGASTE">Desgaste irregular / Careca</option>
                        <option value="BAIXA_PRESSAO">Baixa pressão / Furado</option>
                        <option value="BOLHA">Bolha na lateral</option>
                      </select>
                      <Input
                        value={tire.notes}
                        onChange={(e) => handleUpdateTire(tire.position, { notes: e.target.value })}
                        placeholder="Obs. deste pneu..."
                        className="h-7 text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Observações Gerais sobre os Pneus:</Label>
              <Input
                value={value.tireGeneralNotes}
                onChange={(e) => onChange({ ...value, tireGeneralNotes: e.target.value })}
                placeholder="Informe calibragem, necessidade de rodízio, troca ou detalhes dos pneus..."
                className="h-9 text-xs sm:text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. VERSO DO FORMULÁRIO: NÍVEIS (ÁGUA, ÓLEO MOTOR, DIESEL, HIDRÁULICO) + REPARO + ATRASO */}
      <Card className="border-border/80 shadow-md">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                Conferência de Níveis, Solicitação de Reparo e Ocorrência de Atraso
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                (**) Se algum nível estiver baixo, informe com <strong>Urgência</strong> — se possível complete.
              </CardDescription>
            </div>
            {hasAnyUrgentFluid && (
              <Badge variant="destructive" className="animate-pulse font-bold">
                <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Nível Baixo — Urgência!
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-6">
          {/* 4 Medidores Visuais Verticais (ÁGUA | ÓLEO DO MOTOR | ÓLEO DIESEL | ÓLEO HIDRÁULICO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                {
                  key: 'agua' as const,
                  completedKey: 'aguaCompleted' as const,
                  title: 'ÁGUA',
                  color: 'bg-sky-500',
                },
                {
                  key: 'oleoMotor' as const,
                  completedKey: 'oleoMotorCompleted' as const,
                  title: 'ÓLEO DO MOTOR',
                  color: 'bg-amber-500',
                },
                {
                  key: 'oleoDiesel' as const,
                  completedKey: 'oleoDieselCompleted' as const,
                  title: 'ÓLEO DIESEL',
                  color: 'bg-emerald-500',
                },
                {
                  key: 'oleoHidraulico' as const,
                  completedKey: 'oleoHidraulicoCompleted' as const,
                  title: 'ÓLEO HIDRÁULICO',
                  color: 'bg-orange-500',
                },
              ]
            ).map((fluid) => {
              const currentLevel = value.fluidLevels[fluid.key];
              const isCompleted = value.fluidLevels[fluid.completedKey];
              const isUrgent = currentLevel === 'MINIMO_URGENTE';

              return (
                <div
                  key={fluid.key}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isUrgent
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-sm font-black tracking-wide block">{fluid.title}</span>
                    <span className="text-[11px] text-muted-foreground">Toque para marcar o nível</span>
                  </div>

                  {/* Coluna Vertical Estilo Medidor do Formulário Físico */}
                  <div className="flex items-center justify-center gap-3 py-1">
                    <div className="w-14 h-36 rounded-lg border-2 border-foreground/60 p-1 flex flex-col justify-between bg-muted/40 relative overflow-hidden">
                      <div
                        className={`w-full rounded transition-all duration-300 mt-auto ${
                          isUrgent ? 'bg-red-500 h-[25%]' : currentLevel === 'NORMAL' ? `${fluid.color} h-[62%]` : `${fluid.color} h-full`
                        }`}
                      />
                    </div>

                    <div className="flex flex-col justify-between h-36 py-0.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => handleFluidChange(fluid.key, 'MAXIMO')}
                        className={`px-2.5 py-1.5 rounded text-xs font-bold border text-left transition-all ${
                          currentLevel === 'MAXIMO'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        Máximo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFluidChange(fluid.key, 'NORMAL')}
                        className={`px-2.5 py-1.5 rounded text-xs font-bold border text-left transition-all ${
                          currentLevel === 'NORMAL'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        Normal / Médio
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFluidChange(fluid.key, 'MINIMO_URGENTE')}
                        className={`px-2.5 py-1.5 rounded text-xs font-bold border text-left transition-all ${
                          currentLevel === 'MINIMO_URGENTE'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        Mínimo (Baixo)
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center justify-center gap-2 text-xs font-medium cursor-pointer pt-1 border-t border-border/60">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => handleFluidCompletedToggle(fluid.completedKey, e.target.checked)}
                      className="rounded border-input"
                    />
                    Nível completado
                  </label>
                </div>
              );
            })}
          </div>

          {/* Campo: Se o veículo necessitar de algum reparo, encaminhar ao setor de manutenção */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <Label className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
              <Wrench className="h-4 w-4 text-amber-500 shrink-0" />
              Se o veículo necessitar de algum reparo ou apresentar irregularidade, informe abaixo (será encaminhado automaticamente ao setor de Manutenção):
            </Label>
            <Textarea
              value={value.repairRequestNotes}
              onChange={(e) => onChange({ ...value, repairRequestNotes: e.target.value })}
              placeholder="Descreva aqui qualquer reparo necessário (freios, elétrica, ar-condicionado, suspensão, ruídos, vazamentos)..."
              rows={3}
              className="bg-background"
            />
          </div>

          {/* Relatório de ocorrência de atraso (preencher em caso de atraso na rota) */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/80 px-4 py-2.5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs sm:text-sm font-black uppercase">
                  Relatório de Ocorrência de Atraso (preencher em caso de atraso na rota)
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant={value.delayReport.hasDelay ? 'destructive' : 'outline'}
                onClick={() =>
                  onChange({
                    ...value,
                    delayReport: { ...value.delayReport, hasDelay: !value.delayReport.hasDelay },
                  })
                }
                className="h-7 text-xs font-bold"
              >
                {value.delayReport.hasDelay ? 'Houve Atraso na Rota (Ativo)' : 'Informar Atraso na Rota'}
              </Button>
            </div>

            {value.delayReport.hasDelay && (
              <div className="p-4 space-y-3 bg-card animate-in fade-in-50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-bold">Rota:</Label>
                    <Input
                      value={value.delayReport.route}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          delayReport: { ...value.delayReport, route: e.target.value },
                        })
                      }
                      placeholder="Nome ou código da rota em que ocorreu o atraso"
                      className="h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Tempo de atraso?</Label>
                    <Input
                      value={value.delayReport.delayDuration}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          delayReport: { ...value.delayReport, delayDuration: e.target.value },
                        })
                      }
                      placeholder="Ex: 25 minutos"
                      className="h-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Testemunha 01:</Label>
                    <Input
                      value={value.delayReport.witness1Name}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          delayReport: { ...value.delayReport, witness1Name: e.target.value },
                        })
                      }
                      placeholder="Nome da testemunha 01"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tel. Testemunha 01:</Label>
                    <Input
                      value={value.delayReport.witness1Phone}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          delayReport: { ...value.delayReport, witness1Phone: e.target.value },
                        })
                      }
                      placeholder="(00) 00000-0000"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Testemunha 02:</Label>
                    <Input
                      value={value.delayReport.witness2Name}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          delayReport: { ...value.delayReport, witness2Name: e.target.value },
                        })
                      }
                      placeholder="Nome da testemunha 02"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tel. Testemunha 02:</Label>
                    <Input
                      value={value.delayReport.witness2Phone}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          delayReport: { ...value.delayReport, witness2Phone: e.target.value },
                        })
                      }
                      placeholder="(00) 00000-0000"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Testemunha 03:</Label>
                    <Input
                      value={value.delayReport.witness3Name}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          delayReport: { ...value.delayReport, witness3Name: e.target.value },
                        })
                      }
                      placeholder="Nome da testemunha 03"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tel. Testemunha 03:</Label>
                    <Input
                      value={value.delayReport.witness3Phone}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          delayReport: { ...value.delayReport, witness3Phone: e.target.value },
                        })
                      }
                      placeholder="(00) 00000-0000"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Motivo do atraso:</Label>
                  <Input
                    value={value.delayReport.delayReason}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        delayReport: { ...value.delayReport, delayReason: e.target.value },
                      })
                    }
                    placeholder="Ex: retenção na BR-381, acidente na via, aguardo de embarque na portaria..."
                    className="h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleBodyAndTiresInspector;

