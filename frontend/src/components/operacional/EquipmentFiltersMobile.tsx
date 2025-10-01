import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Shield,
  User,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface EquipmentFiltersMobileProps {
  filters: {
    status?: string;
    protectionLevel?: string;
    isDangerous?: boolean;
    hasUser?: boolean;
    validityStatus?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const EQUIPMENT_STATUS_OPTIONS = [
  { value: 'IN_STOCK', label: 'Em estoque' },
  { value: 'IN_USE', label: 'Em uso' },
  { value: 'IN_MAINTENANCE', label: 'Em manutenção' },
  { value: 'DISABLED', label: 'Desabilitado' }
];

const PROTECTION_LEVEL_OPTIONS = [
  { value: 'I', label: 'Nível I' },
  { value: 'II', label: 'Nível II' },
  { value: 'IIIA', label: 'Nível IIIA' },
  { value: 'III', label: 'Nível III' },
  { value: 'IV', label: 'Nível IV' }
];

const VALIDITY_STATUS_OPTIONS = [
  { value: 'valid', label: 'Válido' },
  { value: 'expired', label: 'Vencido' },
  { value: 'expiring_soon', label: 'Vencendo em 30 dias' }
];

const EquipmentFiltersMobile: React.FC<EquipmentFiltersMobileProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isOpen,
  onToggle
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-2">
      {/* Botão de toggle dos filtros */}
      <Button
        variant="outline"
        onClick={onToggle}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Painel de filtros */}
      {isOpen && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros</CardTitle>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Status
              </label>
              <Select
                value={localFilters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  {EQUIPMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nível de Proteção */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Nível de Proteção
              </label>
              <Select
                value={localFilters.protectionLevel || ''}
                onValueChange={(value) => handleFilterChange('protectionLevel', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os níveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os níveis</SelectItem>
                  {PROTECTION_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status de Validade */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Validade
              </label>
              <Select
                value={localFilters.validityStatus || ''}
                onValueChange={(value) => handleFilterChange('validityStatus', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as validades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as validades</SelectItem>
                  {VALIDITY_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtros de Checkbox */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDangerous"
                  checked={localFilters.isDangerous || false}
                  onCheckedChange={(checked) => handleFilterChange('isDangerous', checked)}
                />
                <label 
                  htmlFor="isDangerous" 
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Apenas equipamentos perigosos
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasUser"
                  checked={localFilters.hasUser || false}
                  onCheckedChange={(checked) => handleFilterChange('hasUser', checked)}
                />
                <label 
                  htmlFor="hasUser" 
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-blue-500" />
                  Apenas equipamentos atribuídos
                </label>
              </div>
            </div>

            {/* Resumo dos filtros ativos */}
            {activeFiltersCount > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {filters.status && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {EQUIPMENT_STATUS_OPTIONS.find(opt => opt.value === filters.status)?.label}
                    </Badge>
                  )}
                  {filters.protectionLevel && (
                    <Badge variant="secondary" className="text-xs">
                      Nível: {PROTECTION_LEVEL_OPTIONS.find(opt => opt.value === filters.protectionLevel)?.label}
                    </Badge>
                  )}
                  {filters.validityStatus && (
                    <Badge variant="secondary" className="text-xs">
                      Validade: {VALIDITY_STATUS_OPTIONS.find(opt => opt.value === filters.validityStatus)?.label}
                    </Badge>
                  )}
                  {filters.isDangerous && (
                    <Badge variant="destructive" className="text-xs">
                      Perigoso
                    </Badge>
                  )}
                  {filters.hasUser && (
                    <Badge variant="default" className="text-xs">
                      Atribuído
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EquipmentFiltersMobile;
