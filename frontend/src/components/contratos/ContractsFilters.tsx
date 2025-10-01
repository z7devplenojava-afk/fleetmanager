import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Filter, X } from 'lucide-react';

interface ContractsFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onClearFilters: () => void;
  totalContracts: number;
  filteredContracts: number;
}

export const ContractsFilters: React.FC<ContractsFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  totalContracts,
  filteredContracts
}) => {
  const statusOptions = [
    { value: 'all', label: 'Todos os Status', count: totalContracts },
    { value: 'ACTIVE', label: 'Ativos', color: 'bg-green-500' },
    { value: 'PENDING', label: 'Pendentes', color: 'bg-yellow-500' },
    { value: 'INACTIVE', label: 'Inativos', color: 'bg-gray-500' },
    { value: 'TERMINATED', label: 'Terminados', color: 'bg-red-500' }
  ];

  const hasActiveFilters = statusFilter !== 'all';

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-seguranca-graphite rounded-lg border border-gray-600">
      <div className="flex items-center gap-2">
        <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-yellow" />
        <span className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Filtros:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Filtro por Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">Status:</span>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-32 sm:w-40 bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs sm:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-graphite border-gray-600">
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.color && (
                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    )}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Indicador de contratos encontrados */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-gray-500 text-gray-300 text-xs">
            <span className="hidden sm:inline">{filteredContracts} de {totalContracts} contratos</span>
            <span className="sm:hidden">{filteredContracts}/{totalContracts}</span>
          </Badge>
        </div>

        {/* Botão para limpar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-400 hover:text-white hover:bg-seguranca-black text-xs sm:text-sm"
          >
            <X className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Limpar Filtros</span>
            <span className="sm:hidden">Limpar</span>
          </Button>
        )}
      </div>

      {/* Filtros rápidos - ocultos em telas muito pequenas */}
      <div className="hidden sm:flex flex-wrap gap-2 lg:ml-auto">
        <Button
          variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange(statusFilter === 'ACTIVE' ? 'all' : 'ACTIVE')}
          className={`text-xs ${
            statusFilter === 'ACTIVE' 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'border-green-500 text-green-400 hover:bg-green-500/20'
          }`}
        >
          Ativos
        </Button>
        
        <Button
          variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange(statusFilter === 'PENDING' ? 'all' : 'PENDING')}
          className={`text-xs ${
            statusFilter === 'PENDING' 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
              : 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/20'
          }`}
        >
          Pendentes
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Filtrar contratos que vencem em 30 dias
            // Esta funcionalidade seria implementada na página pai
            console.log('Filtrar vencendo em breve');
          }}
          className="text-xs border-red-500 text-red-400 hover:bg-red-500/20"
        >
          <Calendar className="h-3 w-3 mr-1" />
          <span className="hidden md:inline">Vencendo</span>
        </Button>
      </div>
    </div>
  );
};
