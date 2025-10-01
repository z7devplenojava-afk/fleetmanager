import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export interface FilterState {
  search: string;
  status: string;
  hasWhatsapp: boolean | null;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFiltersChange,
  onClearFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    hasWhatsapp: null,
    dateFrom: '',
    dateTo: '',
    sortBy: 'nome',
    sortOrder: 'asc',
  });

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      status: '',
      hasWhatsapp: null,
      dateFrom: '',
      dateTo: '',
      sortBy: 'nome',
      sortOrder: 'asc',
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== 'nome' && value !== 'asc'
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
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1"
              >
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isOpen ? 'Ocultar' : 'Mostrar'}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
      </CardHeader>

      <CollapsibleContent>
        <CardContent className="space-y-4">
          {/* Search and Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Nome, CPF, email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Possui WhatsApp</SelectItem>
                  <SelectItem value="false">Não possui WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Select 
                value={filters.hasWhatsapp === null ? '' : filters.hasWhatsapp.toString()} 
                onValueChange={(value) => handleFilterChange('hasWhatsapp', value === '' ? null : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Possui WhatsApp</SelectItem>
                  <SelectItem value="false">Não possui WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data de Cadastro - De</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Data de Cadastro - Até</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortBy">Ordenar por</Label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="createdAt">Data de Cadastro</SelectItem>
                  <SelectItem value="updatedAt">Última Atualização</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Ordem</Label>
              <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => handleFilterChange('sortOrder', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Crescente (A-Z)</SelectItem>
                  <SelectItem value="desc">Decrescente (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <Label>Filtros Rápidos</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newFilters = { ...filters, hasWhatsapp: true };
                  setFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
              >
                Com WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newFilters = { ...filters, hasWhatsapp: false };
                  setFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
              >
                Sem WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  const newFilters = { 
                    ...filters, 
                    dateFrom: lastWeek.toISOString().split('T')[0],
                    dateTo: today.toISOString().split('T')[0]
                  };
                  setFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
              >
                Últimos 7 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  const newFilters = { 
                    ...filters, 
                    dateFrom: lastMonth.toISOString().split('T')[0],
                    dateTo: today.toISOString().split('T')[0]
                  };
                  setFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
              >
                Últimos 30 dias
              </Button>
            </div>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Card>
  );
};

export default AdvancedFilters; 