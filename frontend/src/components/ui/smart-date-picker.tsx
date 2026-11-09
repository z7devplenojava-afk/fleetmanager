import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const WEEKDAYS_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const YEARS_LIST: number[] = [];
for (let y = 1930; y <= 2060; y++) {
  YEARS_LIST.push(y);
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function isValidDateParts(day: number, month: number, year: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const maxDays = getDaysInMonth(year, month - 1);
  return day >= 1 && day <= maxDays;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Converte string ISO ("YYYY-MM-DD" ou ISO completa) ou Date para { day, month, year }
 */
function parseExternalDate(val: unknown): { day: number; month: number; year: number } | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return {
      day: val.getDate(),
      month: val.getMonth() + 1,
      year: val.getFullYear(),
    };
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    // Formato YYYY-MM-DD (com ou sem T...)
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      if (isValidDateParts(day, month, year)) {
        return { day, month, year };
      }
    }
    // Formato DD/MM/YYYY
    const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      const day = parseInt(brMatch[1], 10);
      const month = parseInt(brMatch[2], 10);
      const year = parseInt(brMatch[3], 10);
      if (isValidDateParts(day, month, year)) {
        return { day, month, year };
      }
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return {
        day: parsed.getDate(),
        month: parsed.getMonth() + 1,
        year: parsed.getFullYear(),
      };
    }
  }
  return null;
}

function formatPartsToBR(parts: { day: number; month: number; year: number } | null): string {
  if (!parts) return '';
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
}

function formatPartsToISO(parts: { day: number; month: number; year: number } | null): string {
  if (!parts) return '';
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

/**
 * Formata digitação livre em máscara DD/MM/YYYY permitindo apagar naturalmente
 */
function maskDateInput(rawValue: string, prevValue: string): string {
  const trimmed = rawValue.trim();
  // Se colou formato ISO YYYY-MM-DD
  const isoPaste = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoPaste) {
    return `${isoPaste[3]}/${isoPaste[2]}/${isoPaste[1]}`;
  }

  const isDeleting = rawValue.length < prevValue.length;
  const digits = rawValue.replace(/\D/g, '').slice(0, 8);

  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    if (!isDeleting && rawValue.endsWith('/') && digits.length === 2) {
      return `${digits}/`;
    }
    return digits;
  }
  if (digits.length <= 4) {
    if (!isDeleting && rawValue.endsWith('/') && digits.length === 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}/`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function parseTypedBRDate(text: string): { day: number; month: number; year: number } | null {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (!isValidDateParts(day, month, year)) return null;
  return { day, month, year };
}

interface CalendarPopupProps {
  anchorRef: React.RefObject<HTMLElement>;
  selectedParts: { day: number; month: number; year: number } | null;
  viewMonth: number;
  viewYear: number;
  onChangeViewMonth: (m: number) => void;
  onChangeViewYear: (y: number) => void;
  onSelectDate: (parts: { day: number; month: number; year: number }) => void;
  onClose: () => void;
}

const CalendarPopup: React.FC<CalendarPopupProps> = ({
  anchorRef,
  selectedParts,
  viewMonth,
  viewYear,
  onChangeViewMonth,
  onChangeViewYear,
  onSelectDate,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; arrowLeft: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    arrowLeft: 130,
    placeAbove: false,
  });

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popupWidth = 280;
    const popupHeight = 330;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = rect.left;
    if (left + popupWidth > viewportW - 12) {
      left = Math.max(12, viewportW - popupWidth - 12);
    }
    if (left < 12) left = 12;

    const spaceBelow = viewportH - rect.bottom;
    const placeAbove = spaceBelow < popupHeight + 16 && rect.top > popupHeight + 16;

    const top = placeAbove ? rect.top - popupHeight - 10 : rect.bottom + 10;
    const inputCenter = rect.left + Math.min(rect.width / 2, 140);
    const arrowLeft = Math.max(24, Math.min(popupWidth - 24, inputCenter - left));

    setPos({ top, left, arrowLeft, placeAbove });
  }, [anchorRef]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [anchorRef, onClose]);

  const calendarCells = useMemo(() => {
    const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 (Dom) .. 6 (Sab)
    const daysInCurrMonth = getDaysInMonth(viewYear, viewMonth);

    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

    const cells: Array<{
      day: number;
      month: number; // 1..12
      year: number;
      isCurrentMonth: boolean;
    }> = [];

    // Dias finais do mês anterior
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        month: prevMonth + 1,
        year: prevYear,
        isCurrentMonth: false,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= daysInCurrMonth; d++) {
      cells.push({
        day: d,
        month: viewMonth + 1,
        year: viewYear,
        isCurrentMonth: true,
      });
    }

    // Dias iniciais do próximo mês até fechar múltiplo de 7 (mínimo 35 células)
    const totalNeeded = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalNeeded) {
      cells.push({
        day: nextDay++,
        month: nextMonth + 1,
        year: nextYear,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [viewMonth, viewYear]);

  const today = useMemo(() => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }, []);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 0) {
      onChangeViewMonth(11);
      onChangeViewYear(viewYear - 1);
    } else {
      onChangeViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 11) {
      onChangeViewMonth(0);
      onChangeViewYear(viewYear + 1);
    } else {
      onChangeViewMonth(viewMonth + 1);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={popupRef}
      data-smart-datepicker-popup="true"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        width: '280px',
        zIndex: 100200,
        pointerEvents: 'auto',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #d1d5db',
        boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.35), 0 8px 15px -6px rgba(0, 0, 0, 0.2)',
        fontFamily: 'Roboto, system-ui, -apple-system, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Seta triangular no topo (ou base quando aberto para cima) */}
      {!pos.placeAbove ? (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: `${pos.arrowLeft - 8}px`,
            width: '16px',
            height: '16px',
            backgroundColor: '#f3f4f6',
            borderLeft: '1px solid #d1d5db',
            borderTop: '1px solid #d1d5db',
            transform: 'rotate(45deg)',
            zIndex: 1,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: `${pos.arrowLeft - 8}px`,
            width: '16px',
            height: '16px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #d1d5db',
            borderBottom: '1px solid #d1d5db',
            transform: 'rotate(45deg)',
            zIndex: 1,
          }}
        />
      )}

      {/* Cabeçalho cinza claro idêntico à imagem */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          backgroundColor: '#f3f4f6',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          borderBottom: '1px solid #b5b5b5',
          padding: '10px 12px 8px 12px',
        }}
      >
        {/* Linha 1: Setas + Título "novembro 2026" */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '2px 4px',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          <div
            style={{
              fontSize: '15.5px',
              fontWeight: 700,
              color: '#000000',
              letterSpacing: '-0.01em',
              textAlign: 'center',
            }}
          >
            {MONTHS_PT[viewMonth]} {viewYear}
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '2px 4px',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Linha 2: Dropdowns de Mês ("novembro v") e Ano ("2026 v") */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            marginBottom: '8px',
          }}
        >
          <select
            value={viewMonth}
            onChange={(e) => onChangeViewMonth(Number(e.target.value))}
            aria-label="Selecionar mês"
            className="smart-dp-select"
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              height: '26px',
            }}
          >
            {MONTHS_PT.map((mName, idx) => (
              <option key={mName} value={idx} style={{ backgroundColor: '#ffffff', color: '#111827' }}>
                {mName}
              </option>
            ))}
          </select>

          <select
            value={viewYear}
            onChange={(e) => onChangeViewYear(Number(e.target.value))}
            aria-label="Selecionar ano"
            className="smart-dp-select"
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              height: '26px',
            }}
          >
            {YEARS_LIST.map((yr) => (
              <option key={yr} value={yr} style={{ backgroundColor: '#ffffff', color: '#111827' }}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Linha 3: Dias da semana (dom seg ter qua qui sex sab) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
          }}
        >
          {WEEKDAYS_PT.map((wd) => (
            <div
              key={wd}
              style={{
                fontSize: '13.5px',
                fontWeight: 500,
                color: '#111827',
                padding: '2px 0',
              }}
            >
              {wd}
            </div>
          ))}
        </div>
      </div>

      {/* Grade de dias do mês */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          backgroundColor: '#ffffff',
          borderBottomLeftRadius: '15px',
          borderBottomRightRadius: '15px',
          padding: '10px 12px 14px 12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          rowGap: '4px',
          columnGap: '2px',
        }}
      >
        {calendarCells.map((cell, index) => {
          const isSelected =
            selectedParts !== null &&
            selectedParts.day === cell.day &&
            selectedParts.month === cell.month &&
            selectedParts.year === cell.year;

          const isToday =
            today.day === cell.day &&
            today.month === cell.month &&
            today.year === cell.year;

          return (
            <div
              key={`${cell.year}-${cell.month}-${cell.day}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectDate({
                    day: cell.day,
                    month: cell.month,
                    year: cell.year,
                  });
                }}
                className={isSelected ? 'smart-dp-selected-day' : 'smart-dp-day'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: isSelected || isToday ? 700 : 400,
                  backgroundColor: isSelected ? '#1d68a7' : 'transparent',
                  color: isSelected
                    ? '#ffffff'
                    : cell.isCurrentMonth
                    ? '#111827'
                    : '#4b5563',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {cell.day}
              </button>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

/**
 * 1. SmartDateInput:
 * Substitui transparentemente `<Input type="date" />` em todo o sistema.
 * Permite digitar a data completa (`dd/mm/aaaa`) e abre o calendário no estilo da imagem.
 */
export const SmartDateInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(({ className, value, defaultValue, onChange, onBlur, onFocus, disabled, readOnly, placeholder, name, id, required, ...rest }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerInputRef = useRef<HTMLInputElement | null>(null);

  const parsedExternal = useMemo(
    () => parseExternalDate(value !== undefined ? value : defaultValue),
    [value, defaultValue]
  );

  const [textValue, setTextValue] = useState<string>(() => formatPartsToBR(parsedExternal));
  const [isOpen, setIsOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState<number>(
    parsedExternal ? parsedExternal.month - 1 : now.getMonth()
  );
  const [viewYear, setViewYear] = useState<number>(
    parsedExternal ? parsedExternal.year : now.getFullYear()
  );

  // Sincroniza quando o valor externo muda (sem atrapalhar digitação parcial em andamento)
  useEffect(() => {
    const extParts = parseExternalDate(value);
    const currentTypedParts = parseTypedBRDate(textValue);

    if (!extParts) {
      if (value === '' || value === null) {
        if (currentTypedParts !== null) {
          setTextValue('');
        }
      }
      return;
    }

    const extBR = formatPartsToBR(extParts);
    if (extBR !== textValue) {
      setTextValue(extBR);
      setViewMonth(extParts.month - 1);
      setViewYear(extParts.year);
    }
  }, [value]);

  const emitSyntheticChange = useCallback(
    (isoString: string) => {
      if (!onChange) return;
      const targetEl = innerInputRef.current || ({} as HTMLInputElement);
      const syntheticEvent = {
        target: {
          ...targetEl,
          value: isoString,
          name: name || '',
          id: id || '',
          type: 'date',
        },
        currentTarget: {
          ...targetEl,
          value: isoString,
          name: name || '',
          id: id || '',
          type: 'date',
        },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      onChange(syntheticEvent);
    },
    [onChange, name, id]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    const raw = e.target.value;
    const masked = maskDateInput(raw, textValue);
    setTextValue(masked);

    if (masked === '') {
      emitSyntheticChange('');
      return;
    }

    const validParts = parseTypedBRDate(masked);
    if (validParts && masked.length === 10) {
      setViewMonth(validParts.month - 1);
      setViewYear(validParts.year);
      emitSyntheticChange(formatPartsToISO(validParts));
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Se digitou com dia/mês de 1 dígito (ex: 9/11/2026), normaliza para 09/11/2026
    const validParts = parseTypedBRDate(textValue);
    if (validParts) {
      const normalizedBR = formatPartsToBR(validParts);
      if (normalizedBR !== textValue) {
        setTextValue(normalizedBR);
      }
      emitSyntheticChange(formatPartsToISO(validParts));
    } else if (textValue.trim() !== '') {
      // Restaura último valor válido se ficou incompleto
      const fallback = parseExternalDate(value);
      setTextValue(formatPartsToBR(fallback));
    }
    onBlur?.(e);
  };

  const handleSelectFromCalendar = (parts: { day: number; month: number; year: number }) => {
    setTextValue(formatPartsToBR(parts));
    setViewMonth(parts.month - 1);
    setViewYear(parts.year);
    emitSyntheticChange(formatPartsToISO(parts));
    setIsOpen(false);
  };

  const selectedPartsForCalendar = useMemo(() => {
    return parseTypedBRDate(textValue) || parsedExternal;
  }, [textValue, parsedExternal]);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        {...rest}
        ref={(node) => {
          innerInputRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
         maxLength={10}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        placeholder={placeholder || 'dd/mm/aaaa'}
        value={textValue}
        onChange={handleTextChange}
        onFocus={(e) => {
          if (!disabled && !readOnly) {
            const current = parseTypedBRDate(textValue) || parsedExternal;
            if (current) {
              setViewMonth(current.month - 1);
              setViewYear(current.year);
            }
            setIsOpen(true);
          }
          onFocus?.(e);
        }}
        onClick={() => {
          if (!disabled && !readOnly) {
            setIsOpen(true);
          }
        }}
        onBlur={handleInputBlur}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled || readOnly}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !readOnly) {
            setIsOpen((prev) => !prev);
            innerInputRef.current?.focus();
          }
        }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 cursor-pointer"
        aria-label="Abrir calendário"
      >
        <CalendarIcon className="h-4 w-4" />
      </button>

      {isOpen && !disabled && !readOnly && (
        <CalendarPopup
          anchorRef={containerRef as React.RefObject<HTMLElement>}
          selectedParts={selectedPartsForCalendar}
          viewMonth={viewMonth}
          viewYear={viewYear}
          onChangeViewMonth={setViewMonth}
          onChangeViewYear={setViewYear}
          onSelectDate={handleSelectFromCalendar}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
});
SmartDateInput.displayName = 'SmartDateInput';

/**
 * 2. SmartReactDatePicker:
 * Substituto drop-in para `<DatePicker selected={...} onChange={...} />` do react-datepicker,
 * mantendo o mesmo calendário da imagem e permitindo digitar a data completa `dd/mm/aaaa`.
 */
export interface SmartReactDatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  dateFormat?: string;
  locale?: unknown;
  placeholderText?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date | null;
  maxDate?: Date | null;
  isClearable?: boolean;
  id?: string;
  name?: string;
  showTimeSelect?: boolean;
  [key: string]: unknown;
}

export const SmartReactDatePicker: React.FC<SmartReactDatePickerProps> = ({
  selected,
  onChange,
  placeholderText = 'dd/mm/aaaa',
  className,
  disabled = false,
  required = false,
  id,
  name,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsedExternal = useMemo(() => parseExternalDate(selected), [selected]);
  const [textValue, setTextValue] = useState<string>(() => formatPartsToBR(parsedExternal));
  const [isOpen, setIsOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState<number>(
    parsedExternal ? parsedExternal.month - 1 : now.getMonth()
  );
  const [viewYear, setViewYear] = useState<number>(
    parsedExternal ? parsedExternal.year : now.getFullYear()
  );

  useEffect(() => {
    const extParts = parseExternalDate(selected);
    if (!extParts) {
      if (!selected && parseTypedBRDate(textValue) !== null) {
        setTextValue('');
      }
      return;
    }
    const extBR = formatPartsToBR(extParts);
    if (extBR !== textValue) {
      setTextValue(extBR);
      setViewMonth(extParts.month - 1);
      setViewYear(extParts.year);
    }
  }, [selected]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const raw = e.target.value;
    const masked = maskDateInput(raw, textValue);
    setTextValue(masked);

    if (masked === '') {
      onChange(null);
      return;
    }

    const validParts = parseTypedBRDate(masked);
    if (validParts && masked.length === 10) {
      setViewMonth(validParts.month - 1);
      setViewYear(validParts.year);
      onChange(new Date(validParts.year, validParts.month - 1, validParts.day, 12, 0, 0));
    }
  };

  const handleBlur = () => {
    const validParts = parseTypedBRDate(textValue);
    if (validParts) {
      const normalizedBR = formatPartsToBR(validParts);
      if (normalizedBR !== textValue) {
        setTextValue(normalizedBR);
      }
      onChange(new Date(validParts.year, validParts.month - 1, validParts.day, 12, 0, 0));
    } else if (textValue.trim() !== '') {
      const fallback = parseExternalDate(selected);
      setTextValue(formatPartsToBR(fallback));
    }
  };

  const handleSelectFromCalendar = (parts: { day: number; month: number; year: number }) => {
    setTextValue(formatPartsToBR(parts));
    setViewMonth(parts.month - 1);
    setViewYear(parts.year);
    onChange(new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0));
    setIsOpen(false);
  };

  const selectedPartsForCalendar = useMemo(() => {
    return parseTypedBRDate(textValue) || parsedExternal;
  }, [textValue, parsedExternal]);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        disabled={disabled}
        required={required}
        placeholder={placeholderText}
        value={textValue}
        onChange={handleTextChange}
        onFocus={() => {
          if (!disabled) {
            const current = parseTypedBRDate(textValue) || parsedExternal;
            if (current) {
              setViewMonth(current.month - 1);
              setViewYear(current.year);
            }
            setIsOpen(true);
          }
        }}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        onBlur={handleBlur}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            setIsOpen((prev) => !prev);
            inputRef.current?.focus();
          }
        }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 cursor-pointer"
        aria-label="Abrir calendário"
      >
        <CalendarIcon className="h-4 w-4" />
      </button>

      {isOpen && !disabled && (
        <CalendarPopup
          anchorRef={containerRef as React.RefObject<HTMLElement>}
          selectedParts={selectedPartsForCalendar}
          viewMonth={viewMonth}
          viewYear={viewYear}
          onChangeViewMonth={setViewMonth}
          onChangeViewYear={setViewYear}
          onSelectDate={handleSelectFromCalendar}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SmartReactDatePicker;
