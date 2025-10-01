import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Filter, 
  Search, 
  Calendar,
  AlertTriangle,
  Shield,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { EquipmentFilters } from '@/types/equipment';
import { 
  EQUIPMENT_STATUS_LABELS,
  PROTECTION_LEVEL_LABELS,
  EQUIPMENT_USAGE_LABELS,
  EQUIPMENT_SIZE_LABELS
} from '@/types/equipment';

interface EquipmentFiltersProps {
  filters: EquipmentFilters;
  onFiltersChange: (filters: EquipmentFilters) => void;
  onClearFilters: () => void;
}

const EquipmentFiltersComponent: React.FC<EquipmentFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (field: keyof EquipmentFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => 
      value !== undefined && value !== null && value !== ''
    );
  };

  const renderBasicFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="searchTerm">Buscar</Label>
        <Input
          id="searchTerm"
          placeholder="Número de série, modelo, lote..."
          value={filters.searchTerm || ''}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(EQUIPMENT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="protectionLevel">Nível de Proteção</Label>
        <Select value={filters.protectionLevel || ''} onValueChange={(value) => handleFilterChange('protectionLevel', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(PROTECTION_LEVEL_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderAdvancedFilters = () => (
    <div className="space-y-6">
      {/* Filtros de uso e tamanho */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
           <Label htmlFor="usageType">Uso</Label>
           <Select value={filters.usageType || ''} onValueChange={(value) => handleFilterChange('usageType', value)}>
             <SelectTrigger>
               <SelectValue placeholder="Selecione o uso" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todos</SelectItem>
               {Object.entries(EQUIPMENT_USAGE_LABELS).map(([key, label]) => (
                 <SelectItem key={key} value={key}>{label}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
        
        <div>
          <Label htmlFor="size">Tamanho</Label>
          <Select value={filters.size || ''} onValueChange={(value) => handleFilterChange('size', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tamanho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(EQUIPMENT_SIZE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            placeholder="Digite o modelo..."
            value={filters.model || ''}
            onChange={(e) => handleFilterChange('model', e.target.value)}
          />
        </div>
      </div>

      {/* Filtros de expiração */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Filtros de Vencimento
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isExpired"
              checked={filters.isExpired || false}
              onCheckedChange={(checked) => handleFilterChange('isExpired', checked)}
            />
            <Label htmlFor="isExpired">Vencidos</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isExpiringSoon"
              checked={filters.isExpiringSoon || false}
              onCheckedChange={(checked) => handleFilterChange('isExpiringSoon', checked)}
            />
            <Label htmlFor="isExpiringSoon">Vencendo em breve</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDangerous"
              checked={filters.isDangerous || false}
              onCheckedChange={(checked) => handleFilterChange('isDangerous', checked)}
            />
            <Label htmlFor="isDangerous">Perigosos (armas)</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isWeaponRegistrationExpired"
              checked={filters.isWeaponRegistrationExpired || false}
              onCheckedChange={(checked) => handleFilterChange('isWeaponRegistrationExpired', checked)}
            />
            <Label htmlFor="isWeaponRegistrationExpired">Registro vencido</Label>
          </div>
        </div>
      </div>

      {/* Filtros de datas */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Filtros de Datas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="manufacturingDateFrom">Data de Fabricação (De)</Label>
            <Input
              id="manufacturingDateFrom"
              type="date"
              value={filters.manufacturingDateFrom || ''}
              onChange={(e) => handleFilterChange('manufacturingDateFrom', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="manufacturingDateTo">Data de Fabricação (Até)</Label>
            <Input
              id="manufacturingDateTo"
              type="date"
              value={filters.manufacturingDateTo || ''}
              onChange={(e) => handleFilterChange('manufacturingDateTo', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="validityDateFrom">Data de Validade (De)</Label>
            <Input
              id="validityDateFrom"
              type="date"
              value={filters.validityDateFrom || ''}
              onChange={(e) => handleFilterChange('validityDateFrom', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="validityDateTo">Data de Validade (Até)</Label>
            <Input
              id="validityDateTo"
              type="date"
              value={filters.validityDateTo || ''}
              onChange={(e) => handleFilterChange('validityDateTo', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filtros de lote e fabricação */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Filtros de Fabricação
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="batch">Lote</Label>
            <Input
              id="batch"
              placeholder="Digite o lote..."
              value={filters.batch || ''}
              onChange={(e) => handleFilterChange('batch', e.target.value)}
            />
          </div>
          
                     <div>
             <Label htmlFor="batch">Lote</Label>
             <Input
               id="batch"
               placeholder="Digite o lote..."
               value={filters.batch || ''}
               onChange={(e) => handleFilterChange('batch', e.target.value)}
             />
           </div>
           
           <div>
             <Label htmlFor="model">Modelo</Label>
             <Input
               id="model"
               placeholder="Digite o modelo..."
               value={filters.model || ''}
               onChange={(e) => handleFilterChange('model', e.target.value)}
             />
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
            
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Menos Filtros
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Mais Filtros
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {renderBasicFilters()}
          
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent>
              <div className="pt-4 border-t">
                {renderAdvancedFilters()}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentFiltersComponent; 