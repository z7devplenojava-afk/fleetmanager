import React from 'react';

/**
 * Diagrama técnico do chassi (vista superior), inspirado nas plantas de chassi
 * usadas pela engenharia: longarinas, travessas, eixos, diferencial, cardã e
 * pneus desenhados na posição correta para cada configuração (4x2 simples,
 * 4x2 rodado duplo, 6x2, 6x4 e 8x2).
 */

export interface ChassisDiagramTire {
  serialNumber?: string;
  brand?: string;
  currentTreadDepth?: number | string | null;
  recapCount?: number;
}

export interface ChassisDiagramPosition {
  axleNumber: number;
  positionIndex: number;
  positionCode: string;
  positionName: string;
  tire?: ChassisDiagramTire | null;
}

export interface ChassisDiagramProps {
  positions: ChassisDiagramPosition[];
  axleCount: number;
  dualRear: boolean;
  /** Eixo auxiliar (6x2): o último eixo não recebe diferencial. */
  tagAxle?: boolean;
  /** "4x2" | "6x2" | "6x4" | "8x2" */
  chassiType?: string;
  /** VAN, BUS_URBAN, TRUCK, ... — muda o desenho da carroceria. */
  vehicleType?: string;
  onSelectPosition?: (position: ChassisDiagramPosition) => void;
  selectedPositionCode?: string;
  className?: string;
}

type WearState = 'free' | 'ok' | 'warn' | 'critical';

const WEAR_STYLE: Record<WearState, { fill: string; stroke: string; text: string }> = {
  free: { fill: '#0b1220', stroke: '#475569', text: '#94a3b8' },
  ok: { fill: '#052e24', stroke: '#10b981', text: '#6ee7b7' },
  warn: { fill: '#3a2504', stroke: '#f59e0b', text: '#fde68a' },
  critical: { fill: '#3f0d0d', stroke: '#ef4444', text: '#fecaca' },
};

const FREE_STYLE = WEAR_STYLE.free;

const parseTread = (value?: number | string | null): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const wearStateOf = (position: ChassisDiagramPosition): WearState => {
  if (!position.tire) return 'free';
  const tread = parseTread(position.tire.currentTreadDepth);
  if (tread === null) return 'ok';
  if (tread <= 2) return 'critical';
  if (tread <= 4) return 'warn';
  return 'ok';
};

// ── Geometria do desenho (viewBox 1180 x 470) ────────────────────────────────
const VIEW_W = 1180;
const VIEW_H = 470;
const CENTER_Y = 213;
const FRONT_AXLE_X = 248;
const SINGLE_Y = [120, 306];
const DUAL_Y = [86, 148, 278, 340];

/**
 * Eixos traseiros ficam agrupados na traseira, como num chassi real
 * (tandem/tridem), em vez de distribuídos por toda a longarina.
 */
const REAR_AXLE_X: Record<number, number[]> = {
  1: [905],
  2: [875, 1020],
  3: [820, 945, 1070],
};

const rearAxleX = (index: number, count: number): number => {
  const group = REAR_AXLE_X[Math.min(Math.max(count, 1), 3)];
  return group[Math.min(Math.max(index, 0), group.length - 1)];
};

const axleLabel = (axleNumber: number, tagAxle: boolean, chassiType?: string): string => {
  if (axleNumber === 1) return 'DIRECIONAL';
  if (axleNumber === 2) return 'TRAÇÃO';
  if (axleNumber === 3) return chassiType === '6x4' ? 'TRAÇÃO' : 'AUXILIAR';
  return tagAxle ? 'AUXILIAR' : 'TRAÇÃO';
};

const isDriveAxle = (axleNumber: number, chassiType?: string): boolean => {
  if (axleNumber === 2) return true;
  if (axleNumber === 3) return chassiType === '6x4';
  if (axleNumber === 4) return chassiType === '8x4';
  return false;
};

interface AxleGroup {
  number: number;
  positions: ChassisDiagramPosition[];
}

export const ChassisDiagram: React.FC<ChassisDiagramProps> = ({
  positions,
  axleCount,
  dualRear,
  tagAxle = false,
  chassiType,
  vehicleType,
  onSelectPosition,
  selectedPositionCode,
  className = '',
}) => {
  const rolling = positions.filter((p) => (p.axleNumber ?? 0) > 0);

  const grouped = new Map<number, ChassisDiagramPosition[]>();
  rolling.forEach((position) => {
    const list = grouped.get(position.axleNumber) ?? [];
    list.push(position);
    grouped.set(position.axleNumber, list);
  });

  const axles: AxleGroup[] = [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, list]) => ({
      number,
      positions: [...list].sort((a, b) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0)),
    }));

  const rearAxles = axles.filter((a) => a.number > 1);
  const axleX = (axleNumber: number): number => {
    if (axleNumber === 1) return FRONT_AXLE_X;
    const index = rearAxles.findIndex((a) => a.number === axleNumber);
    return rearAxleX(Math.max(index, 0), rearAxles.length);
  };

  const type = (vehicleType || '').toUpperCase();
  const isTruck = type === 'TRUCK';
  const isBus = type.includes('BUS') || type.includes('MICRO');
  const bodyRadius = isBus ? 44 : 52;

  const renderWheel = (position: ChassisDiagramPosition, x: number, y: number, isDual: boolean) => {
    const state = wearStateOf(position);
    const style = state === 'free' ? FREE_STYLE : WEAR_STYLE[state];
    const tire = position.tire;
    const tread = parseTread(tire?.currentTreadDepth);
    const w = isDual ? 82 : 92;
    const h = isDual ? 44 : 48;
    const isSelected = selectedPositionCode === position.positionCode;
    const codeY = y - 2;
    const treadY = y + 13;

    return (
      <g
        key={`${position.axleNumber}-${position.positionIndex}-${position.positionCode}`}
        onClick={(event) => {
          event.stopPropagation();
          (event.currentTarget as unknown as { blur?: () => void })?.blur?.();
          onSelectPosition?.(position);
        }}
        className={onSelectPosition ? 'cursor-pointer' : undefined}
        role={onSelectPosition ? 'button' : undefined}
        tabIndex={onSelectPosition ? 0 : undefined}
        onKeyDown={(event) => {
          if (onSelectPosition && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onSelectPosition(position);
          }
        }}
      >
        <title>
          {[
            `${position.positionCode} — ${position.positionName}`,
            tire?.serialNumber ? `• ${tire.serialNumber}` : '',
            tread !== null ? `• ${tread.toFixed(1)} mm` : tire ? '' : '• Livre',
          ].filter(Boolean).join(' ')}
        </title>

        {isSelected && (
          <rect
            x={x - w / 2 - 5}
            y={y - h / 2 - 5}
            width={w + 10}
            height={h + 10}
            rx={16}
            fill="none"
            stroke="#facc15"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        )}

        <rect
          x={x - w / 2}
          y={y - h / 2}
          width={w}
          height={h}
          rx={11}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={2.5}
          strokeDasharray={state === 'free' ? '6 4' : undefined}
          className="transition-opacity hover:opacity-80"
        />

        {/* Banda de rodagem estilizada — apenas nas laterais para não cobrir os textos */}
        {tire && (
          <>
            <rect
              x={x - w / 2 + 5}
              y={y - h / 2 + 5}
              width={w - 10}
              height={h - 10}
              rx={8}
              fill="none"
              stroke={style.stroke}
              strokeWidth={1}
              opacity={0.3}
            />
            {[-w / 2 + 11, w / 2 - 11].map((dx) => (
              <line
                key={dx}
                x1={x + dx}
                x2={x + dx}
                y1={y - h / 2 + 7}
                y2={y + h / 2 - 7}
                stroke={style.stroke}
                strokeWidth={1.4}
                opacity={0.45}
              />
            ))}
          </>
        )}

        <text
          x={x}
          y={codeY}
          textAnchor="middle"
          fontSize={isDual ? 12 : 13}
          fontWeight={700}
          fill={style.text}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          style={{ pointerEvents: 'none' }}
        >
          {position.positionCode}
        </text>
        <text
          x={x}
          y={treadY}
          textAnchor="middle"
          fontSize={9.5}
          fill={style.text}
          opacity={0.85}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          style={{ pointerEvents: 'none' }}
        >
          {tire ? (tread !== null ? `${tread.toFixed(1)} mm` : 'montado') : 'livre'}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={`w-full h-auto ${className}`}
      role="img"
      aria-label="Diagrama técnico do chassi com a posição dos pneus"
    >
      <defs>
        <linearGradient id="chassisRail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="45%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="chassisAxle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Carroceria / envelope do veículo */}
      {isTruck ? (
        <>
          <rect
            x={26}
            y={16}
            width={VIEW_W - 52}
            height={396}
            rx={20}
            fill="none"
            stroke="#1f2937"
            strokeWidth={1.5}
            strokeDasharray="9 9"
          />
          <rect x={26} y={38} width={214} height={352} rx={26} fill="#0b1016" stroke="#334155" strokeWidth={2} />
        </>
      ) : (
        <rect
          x={26}
          y={16}
          width={VIEW_W - 52}
          height={396}
          rx={bodyRadius}
          fill="#0b1016"
          stroke="#334155"
          strokeWidth={2}
        />
      )}

      {/* Para-brisa / frente da cabine */}
      <path
        d={isTruck
          ? 'M 44 74 Q 98 48 152 74 L 152 354 Q 98 380 44 354 Z'
          : 'M 46 72 Q 106 42 166 72 L 166 354 Q 106 384 46 354 Z'}
        fill="#0f172a"
        stroke="#334155"
        strokeWidth={2}
      />
      <line x1={178} y1={62} x2={178} y2={364} stroke="#1e293b" strokeWidth={2} />

      {/* Espelhos */}
      <rect x={18} y={64} width={10} height={30} rx={5} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
      <rect x={18} y={332} width={10} height={30} rx={5} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />

      {/* Textos de orientação */}
      <text x={44} y={36} fontSize={10} fontWeight={700} fill="#475569" letterSpacing={2}>
        FRENTE
      </text>
      <text x={VIEW_W - 44} y={36} textAnchor="end" fontSize={10} fontWeight={700} fill="#475569" letterSpacing={2}>
        TRASEIRA
      </text>

      {/* Longarinas do chassi */}
      <rect x={206} y={172} width={VIEW_W - 280} height={14} rx={5} fill="url(#chassisRail)" stroke="#475569" strokeWidth={1} />
      <rect x={206} y={240} width={VIEW_W - 280} height={14} rx={5} fill="url(#chassisRail)" stroke="#475569" strokeWidth={1} />

      {/* Travessas */}
      {Array.from({ length: 10 }, (_, i) => 300 + i * 84).map((x) => (
        <rect
          key={x}
          x={x - 5}
          y={172}
          width={10}
          height={82}
          rx={3}
          fill="#334155"
          stroke="#475569"
          strokeWidth={1}
        />
      ))}

      {/* Conjunto motor / transmissão */}
      <rect x={150} y={184} width={176} height={58} rx={12} fill="#1f2937" stroke="#475569" strokeWidth={1.5} />
      <line x1={168} y1={198} x2={308} y2={198} stroke="#475569" strokeWidth={1.2} opacity={0.7} />
      <line x1={168} y1={213} x2={308} y2={213} stroke="#475569" strokeWidth={1.2} opacity={0.7} />
      <line x1={168} y1={228} x2={308} y2={228} stroke="#475569" strokeWidth={1.2} opacity={0.7} />

      {/* Cardã até o eixo de tração */}
      {(() => {
        const driveX = axleX(2);
        return (
          <>
            <line
              x1={322}
              y1={CENTER_Y}
              x2={driveX}
              y2={CENTER_Y}
              stroke="#64748b"
              strokeWidth={11}
              strokeLinecap="round"
            />
            <circle cx={330} cy={CENTER_Y} r={9} fill="#334155" stroke="#64748b" strokeWidth={1.5} />
            <circle cx={560} cy={CENTER_Y} r={7} fill="#334155" stroke="#64748b" strokeWidth={1.5} />
          </>
        );
      })()}

      {/* Eixos, diferenciais e pneus */}
      {axles.map((axle, axleIndex) => {
        const x = axleX(axle.number);
        const isDual = axle.positions.length >= 4;
        const ys = isDual ? DUAL_Y : SINGLE_Y;
        const wheelY = ys.slice(0, Math.min(axle.positions.length, ys.length));
        const minY = Math.min(...wheelY) - 10;
        const maxY = Math.max(...wheelY) + 10;
        const drive = isDriveAxle(axle.number, chassiType);
        const nextAxle = axles[axleIndex + 1];
        const nextDriveX =
          drive && nextAxle && isDriveAxle(nextAxle.number, chassiType) ? axleX(nextAxle.number) : null;

        return (
          <g key={`axle-${axle.number}`}>
            {/* Cardã entre eixos tracionados (tandem 6x4) */}
            {nextDriveX !== null && (
              <line
                x1={x + 26}
                y1={CENTER_Y}
                x2={nextDriveX - 26}
                y2={CENTER_Y}
                stroke="#64748b"
                strokeWidth={9}
                strokeLinecap="round"
              />
            )}
            {/* Tubo do eixo */}
            <rect
              x={x - 8}
              y={minY}
              width={16}
              height={Math.max(maxY - minY, 20)}
              rx={8}
              fill="url(#chassisAxle)"
              stroke="#475569"
              strokeWidth={1}
            />

            {/* Diferencial (eixos tracionados) */}
            {drive ? (
              <>
                <circle cx={x} cy={CENTER_Y} r={31} fill="#1e293b" stroke="#64748b" strokeWidth={2.5} />
                <circle cx={x} cy={CENTER_Y} r={17} fill="#0f172a" stroke="#475569" strokeWidth={2} />
                <circle cx={x} cy={CENTER_Y} r={6} fill="#334155" stroke="#64748b" strokeWidth={1.5} />
              </>
            ) : (
              <circle cx={x} cy={CENTER_Y} r={10} fill="#1e293b" stroke="#475569" strokeWidth={2} />
            )}

            {/* Pneus */}
            {axle.positions.map((position, index) => (
              <React.Fragment key={position.positionCode}>
                {renderWheel(position, x, wheelY[index] ?? ys[index] ?? CENTER_Y, isDual)}
              </React.Fragment>
            ))}

            {/* Rótulo do eixo */}
            <text x={x} y={438} textAnchor="middle" fontSize={11} fontWeight={700} fill="#64748b" letterSpacing={1}>
              EIXO {axle.number}
            </text>
            <text x={x} y={452} textAnchor="middle" fontSize={9.5} fill="#475569" letterSpacing={0.8}>
              {axleLabel(axle.number, tagAxle, chassiType)}
            </text>
          </g>
        );
      })}

      {/* Resumo de configuração no rodapé do desenho */}
      <text x={VIEW_W / 2} y={462} textAnchor="middle" fontSize={9.5} fill="#334155" letterSpacing={1.2}>
        {`${chassiType || `${axleCount * 2}x2`} • ${dualRear ? 'RODADO DUPLO' : 'RODADO SIMPLES'} • ${axleCount} EIXOS`}
      </text>
    </svg>
  );
};

export default ChassisDiagram;
