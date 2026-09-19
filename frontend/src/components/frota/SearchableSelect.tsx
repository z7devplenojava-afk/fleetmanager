import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  onChange: (value: string, option?: SearchableOption | null) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  minSearchLength?: number;
  minSearchHint?: string;
  maxVisibleOptions?: number;
  disabled?: boolean;
  className?: string;
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
  onChange,
  options,
  placeholder = 'Selecione uma opção...',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Nenhum registro encontrado.',
  minSearchLength,
  minSearchHint,
  maxVisibleOptions = 100,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco automático no input de busca ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    } else {
      setSearchQuery('');
    }
  }, [open]);

  // Encontra a opção atualmente selecionada
  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value) || null;
  }, [options, value]);

  // Filtragem dos registros
  const filteredOptions = useMemo(() => {
    const rawQuery = searchQuery.trim();
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
            const kwDigits = kw.replace(/\D/g, '');
            if (kwDigits && kwDigits.includes(digitsOnlyQuery)) return true;
          }
        }
      }

      return false;
    });
  }, [options, searchQuery, minSearchLength]);

  const handleSelect = (option: SearchableOption) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', null);
    setSearchQuery('');
  };

  const isBelowMin = minSearchLength && searchQuery.trim().length > 0 && searchQuery.trim().length < minSearchLength;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'w-full min-h-[38px] px-3 py-1.5 rounded-md border text-xs sm:text-sm transition-all',
            'flex items-center justify-between gap-2 text-left',
            'border-gray-600 bg-seguranca-black text-white hover:border-gray-500 focus:outline-none focus:border-seguranca-yellow',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedOption ? (
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-white truncate">{selectedOption.label}</span>
                {selectedOption.badge && (
                  <Badge className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono', selectedOption.badgeColor || 'bg-seguranca-yellow/20 text-seguranca-yellow border border-seguranca-yellow/30')}>
                    {selectedOption.badge}
                  </Badge>
                )}
                {selectedOption.subtitle && !selectedOption.badge && (
                  <span className="text-gray-400 text-xs truncate">({selectedOption.subtitle})</span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 text-xs sm:text-sm truncate">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {value && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                title="Limpar seleção"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronsUpDown className="w-4 h-4 text-gray-400 opacity-60" />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0 bg-seguranca-graphite border border-gray-700 rounded-lg shadow-2xl z-[10070] overflow-hidden flex flex-col"
      >
        {/* Barra de Pesquisa */}
        <div className="p-2 border-b border-gray-700 bg-seguranca-black flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 bg-transparent border-none text-white text-xs placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Aviso de tamanho mínimo de busca se configurado */}
        {isBelowMin && (
          <div className="px-3 py-1.5 bg-seguranca-yellow/10 border-b border-seguranca-yellow/20 text-seguranca-yellow text-[11px] flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{minSearchHint || `Digite pelo menos ${minSearchLength} caracteres para filtrar (${searchQuery.length}/${minSearchLength})`}</span>
          </div>
        )}

        {/* Lista de Registros */}
        <div className="overflow-y-auto max-h-60 divide-y divide-gray-800/60">
          {filteredOptions.length > 0 ? (
            filteredOptions.slice(0, maxVisibleOptions).map(opt => {
              const isSelected = opt.value === value;

              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    'px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs',
                    isSelected
                      ? 'bg-seguranca-yellow/20 text-white font-medium'
                      : 'hover:bg-white/5 text-gray-200',
                    opt.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <Badge className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono', opt.badgeColor || 'bg-seguranca-yellow/20 text-seguranca-yellow border border-seguranca-yellow/30')}>
                          {opt.badge}
                        </Badge>
                      )}
                    </div>

                    {opt.subtitle && (
                      <div className="text-[11px] text-gray-400 truncate mt-0.5">
                        {opt.subtitle}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-seguranca-yellow shrink-0" />
                  )}
                </div>
              );
            })
          ) : isBelowMin ? (
            <div className="p-4 text-center text-xs text-gray-400 space-y-1">
              <Search className="w-5 h-5 text-seguranca-yellow/70 mx-auto" />
              <p className="text-gray-300 font-medium">Aguardando {minSearchLength} caracteres</p>
              <p className="text-[11px] text-gray-400">
                {minSearchHint || `Digite os ${minSearchLength} primeiros caracteres para exibir os registros.`}
              </p>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400 space-y-1">
              <AlertCircle className="w-5 h-5 text-gray-500 mx-auto" />
              <p>{emptyText}</p>
            </div>
          )}
        </div>

        {/* Rodapé com contagem de opções */}
        <div className="px-3 py-1.5 bg-gray-900 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
          <span>
            {isBelowMin
              ? `Digite ${minSearchLength} caracteres para filtrar (${options.length} no total)`
              : filteredOptions.length > maxVisibleOptions
                ? `Exibindo ${maxVisibleOptions} de ${filteredOptions.length} encontrados (${options.length} no total)`
                : `${filteredOptions.length} de ${options.length} registros`}
          </span>
          {selectedOption && (
            <span className="text-emerald-400 truncate max-w-[150px]">
              Selecionado: {selectedOption.label}
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;
