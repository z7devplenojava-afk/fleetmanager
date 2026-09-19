import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Employee } from '@/services/employeeService';
import { Search, User, Check, X, CreditCard, ChevronDown, UserCheck, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface DriverComboboxProps {
  value: string;
  onChange: (driverName: string, employee?: Employee | null) => void;
  employees: Employee[];
  placeholder?: string;
  disabled?: boolean;
}

export const DriverCombobox: React.FC<DriverComboboxProps> = ({
  value,
  onChange,
  employees,
  placeholder = 'Selecione ou busque o motorista por nome ou CNH...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cnh' | 'drivers'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Encontra funcionário atualmente selecionado pelo nome ou CNH
  const selectedEmployee = useMemo(() => {
    if (!value || !value.trim()) return null;
    const cleanVal = value.trim().toLowerCase();
    return employees.find(
      e => e.name.trim().toLowerCase() === cleanVal ||
           (e.cnhNumber && e.cnhNumber.trim() === value.trim())
    ) || null;
  }, [value, employees]);

  // Lista filtrada e ordenada
  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let list = employees.filter(emp => {
      // Filtro por abas
      if (filterType === 'cnh' && !emp.cnhNumber) return false;
      if (filterType === 'drivers') {
        const cargo = (emp.positionDescription || '').toLowerCase();
        if (!cargo.includes('motorista') && !cargo.includes('condutor') && !cargo.includes('manobrista')) {
          return false;
        }
      }

      // Filtro por texto de busca
      if (!query) return true;

      const nameMatch = (emp.name || '').toLowerCase().includes(query);
      const cnhMatch = (emp.cnhNumber || '').toLowerCase().includes(query);
      const cpfMatch = (emp.cpf || '').replace(/\D/g, '').includes(query.replace(/\D/g, ''));
      const regMatch = (emp.registrationNumber || '').toLowerCase().includes(query);
      const posMatch = (emp.positionDescription || '').toLowerCase().includes(query);

      return nameMatch || cnhMatch || cpfMatch || regMatch || posMatch;
    });

    // Ordenação: Motoristas com CNH primeiro, depois quem tem CNH, depois demais
    list.sort((a, b) => {
      const aCargo = (a.positionDescription || '').toLowerCase().includes('motorista');
      const bCargo = (b.positionDescription || '').toLowerCase().includes('motorista');
      if (aCargo && !bCargo) return -1;
      if (!aCargo && bCargo) return 1;

      const aHasCnh = Boolean(a.cnhNumber);
      const bHasCnh = Boolean(b.cnhNumber);
      if (aHasCnh && !bHasCnh) return -1;
      if (!aHasCnh && bHasCnh) return 1;

      return a.name.localeCompare(b.name);
    });

    return list;
  }, [employees, searchQuery, filterType]);

  const countWithCnh = useMemo(() => employees.filter(e => Boolean(e.cnhNumber)).length, [employees]);
  const countDrivers = useMemo(() => employees.filter(e => {
    const cargo = (e.positionDescription || '').toLowerCase();
    return cargo.includes('motorista') || cargo.includes('condutor') || cargo.includes('manobrista');
  }).length, [employees]);

  const handleSelect = (emp: Employee) => {
    onChange(emp.name, emp);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleUseCustomName = () => {
    if (searchQuery.trim()) {
      onChange(searchQuery.trim(), null);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', null);
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Gatilho / Campo Visual */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        className={`
          w-full min-h-[38px] px-3 py-1.5 rounded-md border text-xs sm:text-sm cursor-pointer transition-all
          flex items-center justify-between gap-2
          ${isOpen ? 'border-seguranca-yellow ring-1 ring-seguranca-yellow/30 bg-seguranca-black' : 'border-gray-700 bg-seguranca-graphite hover:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          {value ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-white truncate">{value}</span>
              {selectedEmployee?.cnhNumber && (
                <Badge className="bg-emerald-700/80 hover:bg-emerald-700 text-white font-mono text-[10px] px-1.5 py-0 h-4 shrink-0">
                  CNH: {selectedEmployee.cnhNumber}
                  {selectedEmployee.cnhCategory ? ` (${selectedEmployee.cnhCategory})` : ''}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-xs sm:text-sm truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="Limpar motorista"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Crachá detalhado de CNH quando selecionado */}
      {selectedEmployee && (
        <div className="mt-1 px-2.5 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-md flex items-center justify-between text-[11px] text-emerald-300">
          <div className="flex items-center gap-2 truncate">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              <strong>{selectedEmployee.name}</strong>
              {selectedEmployee.positionDescription ? ` (${selectedEmployee.positionDescription})` : ''}
            </span>
            <span className="text-emerald-500 shrink-0">•</span>
            <span className="shrink-0 font-mono font-bold text-emerald-300">
              CNH: {selectedEmployee.cnhNumber || 'Não informada'}
            </span>
            {selectedEmployee.cnhCategory && (
              <span className="bg-emerald-900/80 px-1 rounded text-[10px] font-bold text-emerald-200 shrink-0">
                Cat. {selectedEmployee.cnhCategory}
              </span>
            )}
          </div>
          {selectedEmployee.cnhExpirationDate && (
            <span className="text-gray-400 text-[10px] shrink-0 ml-1">
              Val: {selectedEmployee.cnhExpirationDate}
            </span>
          )}
        </div>
      )}

      {/* Menu Flutuante / Dropdown de Busca */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-seguranca-graphite border border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-80">
          {/* Campo de Busca Rápida */}
          <div className="p-2 border-b border-gray-700 bg-seguranca-black flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Digite nome, CNH, CPF ou cargo..."
              className="h-8 bg-transparent border-none text-white text-xs placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros rápidos (Chips) */}
          <div className="px-2 py-1.5 bg-gray-900/60 border-b border-gray-800 flex items-center gap-1.5 text-[11px] overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded-full transition-colors ${filterType === 'all' ? 'bg-seguranca-yellow text-black font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              Todos ({employees.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('cnh')}
              className={`px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${filterType === 'cnh' ? 'bg-emerald-600 text-white font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              <CreditCard className="w-3 h-3" /> Com CNH ({countWithCnh})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('drivers')}
              className={`px-2 py-0.5 rounded-full transition-colors ${filterType === 'drivers' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              Motoristas ({countDrivers})
            </button>
          </div>

          {/* Lista de Funcionários */}
          <div className="overflow-y-auto max-h-56 divide-y divide-gray-800/60">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(emp => {
                const isSelected = selectedEmployee?.id === emp.id || value.toLowerCase().trim() === emp.name.toLowerCase().trim();
                const isDriverRole = (emp.positionDescription || '').toLowerCase().includes('motorista');

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    className={`
                      p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors
                      ${isSelected ? 'bg-seguranca-yellow/15 text-white' : 'hover:bg-white/5 text-gray-200'}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-white truncate">
                          {emp.name}
                        </span>
                        {isDriverRole && (
                          <Badge className="bg-blue-900/60 text-blue-300 text-[10px] px-1 py-0 h-4">
                            Motorista
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                        {emp.cnhNumber ? (
                          <span className="inline-flex items-center gap-1 font-mono text-emerald-400 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                            🪪 CNH: {emp.cnhNumber}
                            {emp.cnhCategory ? ` (${emp.cnhCategory})` : ''}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">
                            Sem CNH cadastrada
                          </span>
                        )}

                        {emp.positionDescription && !isDriverRole && (
                          <span className="truncate max-w-[150px]">
                            {emp.positionDescription}
                          </span>
                        )}

                        {emp.registrationNumber && (
                          <span className="text-gray-500 font-mono text-[10px]">
                            Matrícula: {emp.registrationNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-seguranca-yellow shrink-0" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-gray-400 space-y-2">
                <AlertCircle className="w-6 h-6 text-gray-500 mx-auto" />
                <p>Nenhum funcionário encontrado para &quot;{searchQuery}&quot;</p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={handleUseCustomName}
                    className="mt-2 px-3 py-1.5 bg-seguranca-yellow/20 hover:bg-seguranca-yellow/30 text-seguranca-yellow border border-seguranca-yellow/40 rounded-md text-xs font-semibold inline-flex items-center gap-1"
                  >
                    + Usar &quot;{searchQuery.trim()}&quot; como condutor externo / terceiro
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rodapé do Menu com opção de nome livre */}
          {searchQuery.trim() && filteredEmployees.length > 0 && (
            <div className="p-2 border-t border-gray-700 bg-gray-900 flex justify-between items-center text-xs">
              <span className="text-gray-400 text-[11px]">Motorista não está na lista?</span>
              <button
                type="button"
                onClick={handleUseCustomName}
                className="text-seguranca-yellow hover:underline font-semibold text-[11px]"
              >
                + Usar &quot;{searchQuery.trim()}&quot; como avulso
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverCombobox;
