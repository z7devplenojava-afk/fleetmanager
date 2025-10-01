import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  X, 
  Tag,
  Clock,
  TrendingUp
} from 'lucide-react';

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  recentSearches: string[];
  onRecentSearchClick: (search: string) => void;
  onClearFilters: () => void;
}

export function HelpSearchFilters({
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagToggle,
  availableTags,
  recentSearches,
  onRecentSearchClick,
  onClearFilters
}: SearchFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters = searchTerm || selectedTags.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Busca Avançada
          </CardTitle>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearFilters}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filtros
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar funcionalidades, módulos, tutoriais..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Buscas recentes */}
        {recentSearches.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Buscas Recentes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 5).map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => onRecentSearchClick(search)}
                >
                  {search}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Filtros avançados */}
        {showAdvancedFilters && (
          <>
            <Separator />
            <div className="space-y-4">
              {/* Tags/Categorias */}
              <div>
                <div className="flex items-center mb-2">
                  <Tag className="w-4 h-4 mr-1 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtrar por Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => onTagToggle(tag)}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Filtros rápidos */}
              <div>
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-4 h-4 mr-1 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtros Rápidos</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => onSearchChange('cadastro')}
                  >
                    📝 Cadastros
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => onSearchChange('relatório')}
                  >
                    📊 Relatórios
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => onSearchChange('configuração')}
                  >
                    ⚙️ Configurações
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => onSearchChange('backup')}
                  >
                    💾 Backup
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Indicador de filtros ativos */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {selectedTags.length > 0 && `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selecionada${selectedTags.length > 1 ? 's' : ''}`}
                {searchTerm && selectedTags.length > 0 && ' • '}
                {searchTerm && `Buscando por "${searchTerm}"`}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}