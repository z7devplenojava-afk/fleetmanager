import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Check, ChevronsUpDown, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableOption {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  keywords?: string[];
  disabled?: boolean;
}

interface SearchableSelectProps {
  value: string;
  fallbackLabel?: string;
  onChange: (value: string, option?: SearchableOption | null) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  minSearchLength?: number;
  minSearchHint?: string;
  requireMinLengthToDisplay?: boolean;
  maxVisibleOptions?: number;
  disabled?: boolean;
  size?: 'default' | 'lg';
  className?: string;
  buttonClassName?: string;
  allowCustomValue?: boolean;
  customValuePrefix?: string;
  onCreateCustomOption?: (customValue: string) => void;
}

// Normaliza texto removendo acentos para busca flexível
function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  fallbackLabel,
  onChange,
  options,
  placeholder = 'Selecione uma opção...',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Nenhum registro encontrado.',
  minSearchLength,
  minSearchHint,
  requireMinLengthToDisplay = false,
  maxVisibleOptions = 100,
  disabled = false,
  size = 'default',
  className,
  buttonClassName,
  allowCustomValue = false,
  customValuePrefix = 'Usar / Cadastrar',
  onCreateCustomOption,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco automático no input de busca ao abrir e limpeza ao fechar
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }

    const updateMenuPlacement = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setMenuPlacement(spaceBelow < 260 && spaceAbove > spaceBelow ? 'top' : 'bottom');
    };
    updateMenuPlacement();
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    window.addEventListener('resize', updateMenuPlacement);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateMenuPlacement);
    };
  }, [open]);

  // Fecha o dropdown ao clicar fora ou pressionar Escape
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('touchstart', handleOutsideClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('touchstart', handleOutsideClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open]);

  // Encontra a opção atualmente selecionada
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find(opt => String(opt.value) === String(value)) || null;
  }, [options, value]);

  // Filtragem dos registros
  const filteredOptions = useMemo(() => {
    const rawQuery = searchQuery.trim();

    // Se requireMinLengthToDisplay for true, não exibe resultados até atingir minSearchLength
    if (requireMinLengthToDisplay && minSearchLength && rawQuery.length < minSearchLength) {
      return [];
    }

    if (!rawQuery) {
      return options;
    }

    // Se houver requisito de tamanho mínimo, não exibe resultados até atingir o limite
    if (minSearchLength && rawQuery.length < minSearchLength) {
      return [];
    }

    const normQuery = normalizeText(rawQuery);
    const digitsOnlyQuery = rawQuery.replace(/\D/g, '');

    return options.filter(opt => {
      const normLabel = normalizeText(opt.label);
      const normSub = normalizeText(opt.subtitle);

      // Match direto em label ou subtitle
      if (normLabel.includes(normQuery) || normSub.includes(normQuery)) {
        return true;
      }

      // Match em keywords (ex.: placa limpa, código, CNPJ, etc.)
      if (opt.keywords && opt.keywords.length > 0) {
        for (const kw of opt.keywords) {
          const normKw = normalizeText(kw);
          if (normKw.includes(normQuery)) return true;

          // Se for dígitos de CNPJ/CPF/código
          if (digitsOnlyQuery.length >= 2) {
            const kwDigits = String(kw).replace(/\D/g, '');
            if (kwDigits && kwDigits.includes(digitsOnlyQuery)) return true;
          }
        }
      }

      return false;
    });
  }, [options, searchQuery, minSearchLength, requireMinLengthToDisplay]);

  const handleSelect = (option: SearchableOption) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('', null);
    setSearchQuery('');
  };

  const isBelowMin = Boolean(
    minSearchLength && (
      requireMinLengthToDisplay
        ? searchQuery.trim().length < minSearchLength
        : (searchQuery.trim().length > 0 && searchQuery.trim().length < minSearchLength)
    )
  );

  return (
    <div ref={containerRef} className={cn('relative w-full min-w-0 max-w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            setOpen(prev => !prev);
          }
        }}
        onKeyDown={(e) => {
          if (!disabled && !open && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            setOpen(true);
            setSearchQuery(e.key);
          }
        }}
        className={cn(
          'w-full min-w-0 max-w-full overflow-hidden rounded-md border transition-all flex items-center justify-between gap-2 text-left',
          size === 'lg'
            ? 'min-h-[50px] sm:min-h-[48px] px-3.5 py-2.5 text-sm sm:text-base'
            : 'min-h-[38px] px-3 py-1.5 text-xs sm:text-sm',
          buttonClassName || 'border-slate-300 dark:border-gray-600 bg-white dark:bg-seguranca-black text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-seguranca-yellow',
          open && 'border-blue-500 dark:border-seguranca-yellow ring-1 ring-blue-500/30 dark:ring-seguranca-yellow/30',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <span className={cn('font-bold text-slate-900 dark:text-white truncate', size === 'lg' ? 'text-base sm:text-lg' : 'text-xs sm:text-sm')}>
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <Badge className={cn('px-1.5 py-0 h-4 shrink-0 font-mono', size === 'lg' ? 'text-[11px] h-5' : 'text-[10px]', selectedOption.badgeColor || 'bg-blue-100 dark:bg-seguranca-yellow/20 text-blue-800 dark:text-seguranca-yellow border border-blue-200 dark:border-seguranca-yellow/30')}>
                  {selectedOption.badge}
                </Badge>
              )}
              {selectedOption.subtitle && (
                <span className={cn('text-slate-500 dark:text-gray-400 truncate min-w-0 shrink hidden sm:inline', size === 'lg' ? 'text-xs sm:text-sm' : 'text-xs')}>
                  ({selectedOption.subtitle})
                </span>
              )}
            </div>
          ) : fallbackLabel ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <span className={cn('font-bold text-slate-900 dark:text-white truncate', size === 'lg' ? 'text-base sm:text-lg' : 'text-xs sm:text-sm')}>
                {fallbackLabel}
              </span>
              <Badge className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/60">
                Selecionado
              </Badge>
            </div>
          ) : (
            <span className={cn('text-slate-400 dark:text-gray-400 truncate', size === 'lg' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(Boolean(value) || Boolean(fallbackLabel)) && !disabled && (
            <span
              role="button"
              onPointerDown={handleClear}
              onClick={handleClear}
              className="p-1 hover:bg-slate-200 dark:hover:bg-gray-800 rounded text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              title="Limpar seleção"
            >
              <X className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </span>
          )}
          <ChevronsUpDown className={cn('text-slate-400 dark:text-gray-400 opacity-60 transition-transform', open && 'rotate-180 text-blue-500 dark:text-seguranca-yellow opacity-100', size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />
        </div>
      </button>

      {open && (
        <div
          className={cn(
            'absolute left-0 right-0 min-w-[260px] p-0 bg-white dark:bg-seguranca-graphite border border-slate-200 dark:border-gray-700 rounded-lg shadow-2xl z-[10090] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100',
            menuPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Barra de Pesquisa */}
          <div className="p-2 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-seguranca-black flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 dark:text-gray-400 shrink-0" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (filteredOptions.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(filteredOptions[0]);
                  } else if (allowCustomValue && searchQuery.trim().length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    const customVal = searchQuery.trim();
                    onChange(customVal, { value: customVal, label: customVal });
                    if (onCreateCustomOption) onCreateCustomOption(customVal);
                    setOpen(false);
                    setSearchQuery('');
                  }
                }
              }}
              placeholder={searchPlaceholder}
              className="h-8 bg-transparent border-none text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
            {searchQuery && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setSearchQuery(''); }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSearchQuery(''); }}
                className="text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Aviso de tamanho mínimo de busca se configurado */}
          {isBelowMin && (
            <div className="px-3 py-1.5 bg-blue-50 dark:bg-seguranca-yellow/10 border-b border-blue-200 dark:border-seguranca-yellow/20 text-blue-700 dark:text-seguranca-yellow text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{minSearchHint || `Digite pelo menos ${minSearchLength} caracteres para filtrar (${searchQuery.length}/${minSearchLength})`}</span>
            </div>
          )}

          {/* Lista de Registros */}
          <div style={{ maxHeight: 'min(15rem, 40vh)' }} className="overflow-y-auto divide-y divide-slate-100 dark:divide-gray-800/60 overscroll-contain">
            {filteredOptions.length > 0 ? (
              filteredOptions.slice(0, maxVisibleOptions).map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(opt);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(opt);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(opt);
                      }
                    }}
                    className={cn(
                      'px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs select-none',
                      isSelected
                        ? 'bg-blue-50 text-blue-900 dark:bg-seguranca-yellow/20 dark:text-white font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-gray-200 active:bg-slate-200 dark:active:bg-white/15',
                      opt.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <Badge className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono', opt.badgeColor || 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-seguranca-yellow/20 dark:text-seguranca-yellow dark:border-seguranca-yellow/30')}>
                            {opt.badge}
                          </Badge>
                        )}
                      </div>

                      {opt.subtitle && (
                        <div className="text-[11px] text-slate-500 dark:text-gray-400 truncate mt-0.5">
                          {opt.subtitle}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-seguranca-yellow shrink-0" />
                    )}
                  </div>
                );
              })
            ) : isBelowMin ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-gray-400 space-y-1">
                <Search className="w-5 h-5 text-blue-500 dark:text-seguranca-yellow/70 mx-auto" />
                <p className="text-slate-800 dark:text-gray-300 font-medium">Aguardando {minSearchLength} caracteres</p>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">
                  {minSearchHint || `Digite os ${minSearchLength} primeiros caracteres para exibir os registros.`}
                </p>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-gray-400 space-y-1">
                <AlertCircle className="w-5 h-5 text-slate-400 dark:text-gray-500 mx-auto" />
                <p>{emptyText}</p>
              </div>
            )}

            {allowCustomValue &&
              searchQuery.trim().length > 0 &&
              !options.some(o => normalizeText(o.label) === normalizeText(searchQuery.trim())) && (
                <div
                  role="option"
                  tabIndex={0}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const customVal = searchQuery.trim();
                    onChange(customVal, { value: customVal, label: customVal });
                    if (onCreateCustomOption) onCreateCustomOption(customVal);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const customVal = searchQuery.trim();
                    onChange(customVal, { value: customVal, label: customVal });
                    if (onCreateCustomOption) onCreateCustomOption(customVal);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className="px-3 py-2.5 flex items-center justify-between gap-2 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-t border-emerald-200 dark:border-emerald-700/40 text-xs font-semibold select-none"
                >
                  <span className="truncate">
                    ➕ {customValuePrefix}: <strong className="text-slate-900 dark:text-white">"{searchQuery.trim()}"</strong>
                  </span>
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 shrink-0">
                    Manual
                  </Badge>
                </div>
              )}
          </div>

          {/* Rodapé com contagem de opções */}
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 flex justify-between items-center text-[10px] text-slate-600 dark:text-gray-400">
            <span>
              {isBelowMin
                ? `Digite ${minSearchLength} caracteres para filtrar (${options.length} no total)`
                : filteredOptions.length > maxVisibleOptions
                  ? `Exibindo ${maxVisibleOptions} de ${filteredOptions.length} encontrados (${options.length} no total)`
                  : `${filteredOptions.length} de ${options.length} registros`}
            </span>
            {selectedOption && (
              <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
                Selecionado: {selectedOption.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
