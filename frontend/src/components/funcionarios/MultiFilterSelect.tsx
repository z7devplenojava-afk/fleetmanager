import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface MultiFilterOption {
  value: string;
  label: string;
  badgeClass?: string;
  dotClass?: string;
  count?: number;
}

export type FilterAccentTheme = 'emerald' | 'blue' | 'amber' | 'rose' | 'cyan' | 'orange';

interface MultiFilterSelectProps {
  placeholder: string;
  icon?: React.ReactNode;
  options: MultiFilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  accentTheme?: FilterAccentTheme;
  searchable?: boolean;
}

const THEME_STYLES: Record<FilterAccentTheme, {
  idleBorder: string;
  activeBorder: string;
  activeBg: string;
  iconColor: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
  checkBg: string;
  ringFocus: string;
}> = {
  emerald: {
    idleBorder: 'border-emerald-500/35 hover:border-emerald-400/70',
    activeBorder: 'border-emerald-400/80 shadow-sm shadow-emerald-950/50',
    activeBg: 'bg-emerald-950/35',
    iconColor: 'text-emerald-400',
    chipBg: 'bg-emerald-500/20',
    chipText: 'text-emerald-200',
    chipBorder: 'border-emerald-400/50',
    checkBg: 'bg-emerald-500 border-emerald-400 text-slate-950',
    ringFocus: 'focus-within:ring-emerald-500/30',
  },
  blue: {
    idleBorder: 'border-sky-500/35 hover:border-sky-400/70',
    activeBorder: 'border-sky-400/80 shadow-sm shadow-sky-950/50',
    activeBg: 'bg-sky-950/35',
    iconColor: 'text-sky-400',
    chipBg: 'bg-sky-500/20',
    chipText: 'text-sky-200',
    chipBorder: 'border-sky-400/50',
    checkBg: 'bg-sky-500 border-sky-400 text-slate-950',
    ringFocus: 'focus-within:ring-sky-500/30',
  },
  amber: {
    idleBorder: 'border-amber-500/35 hover:border-amber-400/70',
    activeBorder: 'border-amber-400/80 shadow-sm shadow-amber-950/50',
    activeBg: 'bg-amber-950/35',
    iconColor: 'text-amber-400',
    chipBg: 'bg-amber-500/20',
    chipText: 'text-amber-200',
    chipBorder: 'border-amber-400/50',
    checkBg: 'bg-amber-500 border-amber-400 text-slate-950',
    ringFocus: 'focus-within:ring-amber-500/30',
  },
  rose: {
    idleBorder: 'border-rose-500/35 hover:border-rose-400/70',
    activeBorder: 'border-rose-400/80 shadow-sm shadow-rose-950/50',
    activeBg: 'bg-rose-950/35',
    iconColor: 'text-rose-400',
    chipBg: 'bg-rose-500/20',
    chipText: 'text-rose-200',
    chipBorder: 'border-rose-400/50',
    checkBg: 'bg-rose-500 border-rose-400 text-white',
    ringFocus: 'focus-within:ring-rose-500/30',
  },
  cyan: {
    idleBorder: 'border-cyan-500/35 hover:border-cyan-400/70',
    activeBorder: 'border-cyan-400/80 shadow-sm shadow-cyan-950/50',
    activeBg: 'bg-cyan-950/35',
    iconColor: 'text-cyan-400',
    chipBg: 'bg-cyan-500/20',
    chipText: 'text-cyan-200',
    chipBorder: 'border-cyan-400/50',
    checkBg: 'bg-cyan-500 border-cyan-400 text-slate-950',
    ringFocus: 'focus-within:ring-cyan-500/30',
  },
  orange: {
    idleBorder: 'border-orange-500/35 hover:border-orange-400/70',
    activeBorder: 'border-orange-400/80 shadow-sm shadow-orange-950/50',
    activeBg: 'bg-orange-950/35',
    iconColor: 'text-orange-400',
    chipBg: 'bg-orange-500/20',
    chipText: 'text-orange-200',
    chipBorder: 'border-orange-400/50',
    checkBg: 'bg-orange-500 border-orange-400 text-slate-950',
    ringFocus: 'focus-within:ring-orange-500/30',
  },
};

export const MultiFilterSelect: React.FC<MultiFilterSelectProps> = ({
  placeholder,
  icon,
  options,
  selected,
  onChange,
  accentTheme = 'blue',
  searchable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = THEME_STYLES[accentTheme];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const norm = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return options.filter(opt =>
      opt.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(norm)
    );
  }, [options, search]);

  const selectedOptions = useMemo(
    () => options.filter(o => selected.includes(o.value)),
    [options, selected]
  );

  const toggleOption = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const removeValue = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(v => v !== val));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const hasSelection = selected.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${open ? 'z-50' : 'z-10'}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(prev => !prev);
          }
        }}
        className={`min-h-[40px] w-full rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between gap-1.5 border transition-all cursor-pointer select-none ${
          hasSelection
            ? `${theme.activeBg} ${theme.activeBorder} text-white`
            : `bg-slate-900/95 ${theme.idleBorder} text-slate-100`
        }`}
      >
        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
          {icon && (
            <span className={`shrink-0 ${theme.iconColor}`}>
              {icon}
            </span>
          )}

          {!hasSelection ? (
            <span className="truncate text-slate-200 font-medium">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1 flex-wrap min-w-0">
              {selectedOptions.slice(0, 2).map(opt => (
                <span
                  key={opt.value}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border max-w-[140px] ${
                    opt.badgeClass || `${theme.chipBg} ${theme.chipText} ${theme.chipBorder}`
                  }`}
                >
                  {opt.dotClass && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dotClass}`} />}
                  <span className="truncate">{opt.label}</span>
                  <button
                    type="button"
                    onClick={(e) => removeValue(opt.value, e)}
                    className="hover:opacity-100 opacity-80 ml-0.5 shrink-0"
                    title={`Remover ${opt.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selected.length > 2 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${theme.chipBg} ${theme.chipText} ${theme.chipBorder}`}>
                  +{selected.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasSelection && (
            <button
              type="button"
              onClick={clearAll}
              className="p-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Limpar seleção"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 z-[120] bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 min-w-[240px]">
          {/* Barra de busca e ações rápidas */}
          <div className="p-2 border-b border-slate-800 bg-slate-900/90 space-y-2">
            {(searchable && options.length > 4) && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar opções..."
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between px-1 text-[11px]">
              <span className="text-slate-400 font-medium">
                {selected.length === 0 ? 'Todos exibidos' : `${selected.length} selecionado(s)`}
              </span>
              <div className="flex items-center gap-2">
                {options.length > 0 && selected.length < options.length && (
                  <button
                    type="button"
                    onClick={() => onChange(options.map(o => o.value))}
                    className={`font-semibold hover:underline ${theme.iconColor}`}
                  >
                    Marcar todos
                  </button>
                )}
                {selected.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-rose-400 hover:text-rose-300 font-semibold hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de opções com alto contraste dark */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Nenhuma opção encontrada.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selected.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      isChecked
                        ? 'bg-slate-800/90 text-white font-semibold'
                        : 'text-slate-200 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                          isChecked
                            ? theme.checkBg
                            : 'border-slate-600 bg-slate-900'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {opt.dotClass && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotClass}`} />
                      )}

                      <span
                        className={`truncate ${
                          opt.badgeClass && isChecked
                            ? `px-2 py-0.5 rounded border text-[11px] ${opt.badgeClass}`
                            : ''
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>

                    {typeof opt.count === 'number' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 shrink-0">
                        {opt.count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
