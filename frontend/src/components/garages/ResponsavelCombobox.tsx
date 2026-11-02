import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Search, UserCheck, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Employee } from '@/services/employeeService';

/** Quantidade mínima de caracteres para consultar a base de funcionários. */
export const MIN_CHARS_RESPONSAVEL = 3;

interface ResponsavelComboboxProps {
  /** Lista de funcionários (base carregada pela página). */
  employees: Employee[];
  /** Responsável selecionado (responsibleEmployeeId). */
  value?: string;
  /** Nome do responsável selecionado (responsibleName) — exibido mesmo se não estiver na lista carregada. */
  name?: string;
  /** Chamado ao selecionar (employee) ou limpar (null) o responsável. */
  onSelect: (employee: Employee | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Remove acentos, espaços extras e converte para minúsculas (busca ignorando acentuação). */
const normalize = (text?: string | null): string =>
  (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const ResponsavelCombobox: React.FC<ResponsavelComboboxProps> = ({
  employees,
  value,
  name,
  onSelect,
  placeholder = 'Digite 3 letras do nome do responsável...',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const term = normalize(query);

  const matches = useMemo(() => {
    if (term.length < MIN_CHARS_RESPONSAVEL) return [];
    const list = employees.filter(emp => {
      const nameMatch = normalize(emp.name).includes(term);
      const positionMatch = normalize(emp.positionDescription).includes(term);
      const registrationMatch = normalize(emp.registrationNumber).includes(term);
      const documentMatch = normalize(emp.cpf).includes(term);
      return nameMatch || positionMatch || registrationMatch || documentMatch;
    });

    // Quem começa com o termo vem primeiro, depois ordem alfabética
    list.sort((a, b) => {
      const aStarts = normalize(a.name).startsWith(term) ? 0 : 1;
      const bStarts = normalize(b.name).startsWith(term) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR');
    });

    return list.slice(0, 50);
  }, [employees, term]);

  const selected = useMemo(
    () => employees.find(emp => emp.id === value) || null,
    [employees, value]
  );
  const displayName = selected?.name || name || '';

  const handleSelect = (employee: Employee) => {
    onSelect(employee);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(null);
    setQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (matches.length > 0) {
        event.preventDefault();
        handleSelect(matches[0]);
      }
    } else if (event.key === 'Escape' && open) {
      // Evita fechar o modal do cadastro de garagem
      event.stopPropagation();
      setOpen(false);
    }
  };

  const showSelectedAsPlaceholder = Boolean(displayName) && !query;

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={cn(
          'relative rounded-md border bg-seguranca-black transition-colors',
          open ? 'border-seguranca-yellow ring-1 ring-seguranca-yellow/30' : 'border-gray-700'
        )}
      >
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
        <Input
          value={query}
          disabled={disabled}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={showSelectedAsPlaceholder ? displayName : placeholder}
          className={cn(
            'h-9 pl-9 pr-16 bg-transparent border-none text-white text-xs sm:text-sm',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            showSelectedAsPlaceholder
              ? 'placeholder:text-white placeholder:font-semibold'
              : 'placeholder:text-gray-500'
          )}
        />
        <div className="absolute right-2 top-1.5 flex items-center gap-1">
          {showSelectedAsPlaceholder && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Limpar responsável"
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={cn('text-gray-500 transition-transform', open ? 'rotate-180' : '')}
          />
        </div>
      </div>

      {/* Responsável já selecionado (nome, cargo e matrícula) */}
      {showSelectedAsPlaceholder && (
        <div className="mt-1 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-700/40 text-[11px] text-emerald-300">
          <UserCheck size={12} className="shrink-0 text-emerald-400" />
          <span className="truncate">
            <strong>{displayName}</strong>
            {selected?.positionDescription ? ` • ${selected.positionDescription}` : ''}
            {selected?.registrationNumber ? ` • Matrícula ${selected.registrationNumber}` : ''}
          </span>
        </div>
      )}

      {/* Resultados da busca na base de funcionários */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-seguranca-graphite border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-700 bg-seguranca-black text-[11px] text-gray-400 flex items-center gap-1.5">
            <Search size={12} className="shrink-0" />
            Base de funcionários — digite {MIN_CHARS_RESPONSAVEL} ou mais caracteres
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-gray-800/60">
            {term.length < MIN_CHARS_RESPONSAVEL ? (
              <div className="p-4 text-center text-xs text-gray-400">
                <AlertCircle size={18} className="mx-auto mb-2 text-gray-500" />
                Digite os {MIN_CHARS_RESPONSAVEL} primeiros caracteres do nome para buscar...
              </div>
            ) : matches.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                <Users size={18} className="mx-auto mb-2 text-gray-500" />
                Nenhum funcionário encontrado para "{query.trim()}"
              </div>
            ) : (
              matches.map(emp => {
                const isSelected = emp.id === value;
                const details = [
                  emp.positionDescription,
                  emp.registrationNumber ? `Matrícula ${emp.registrationNumber}` : '',
                ]
                  .filter(Boolean)
                  .join(' • ');

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    className={cn(
                      'px-3 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors',
                      isSelected ? 'bg-seguranca-yellow/15' : 'hover:bg-white/5'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-white truncate">
                        {emp.name}
                      </p>
                      {details && <p className="text-[11px] text-gray-400 truncate">{details}</p>}
                    </div>
                    {isSelected && <Check size={14} className="text-seguranca-yellow shrink-0" />}
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

export default ResponsavelCombobox;
