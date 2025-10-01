import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  UserX, 
  UserPlus, 
  QrCode, 
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Calendar,
  User,
  Shield,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import EquipmentFiltersMobile from './EquipmentFiltersMobile';

interface Equipment {
  id: string;
  serialNumber: string;
  model?: string;
  status: 'IN_STOCK' | 'IN_USE' | 'IN_MAINTENANCE' | 'DISABLED';
  currentUserName?: string;
  currentUserId?: string;
  validityDate?: string;
  daysToExpiry?: number;
  protectionLevel?: 'I' | 'II' | 'IIIA' | 'III' | 'IV';
  isDangerous: boolean;
}

interface EquipamentosTableProps {
  equipments: Equipment[];
  loading?: boolean;
  onSearch?: (term: string) => void;
  onView?: (equipment: Equipment) => void;
  onEdit?: (equipment: Equipment) => void;
  onAssignUser?: (equipment: Equipment) => void;
  onRemoveUser?: (equipment: Equipment) => void;
  onQRCode?: (equipment: Equipment) => void;
  onDelete?: (equipment: Equipment) => void;
  onCreate?: () => void;
  onReport?: () => void;
  onFiltersChange?: (filters: any) => void;
  filters?: any;
}

const EQUIPMENT_STATUS_LABELS = {
  IN_STOCK: 'Em estoque',
  IN_USE: 'Em uso',
  IN_MAINTENANCE: 'Em manutenção',
  DISABLED: 'Desabilitado'
};

const PROTECTION_LEVEL_LABELS = {
  I: 'Nível I',
  II: 'Nível II',
  IIIA: 'Nível IIIA',
  III: 'Nível III',
  IV: 'Nível IV'
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'IN_STOCK':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'IN_USE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'IN_MAINTENANCE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'DISABLED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getDaysToExpiryColor = (days?: number) => {
  if (days === undefined || days === null) return 'text-gray-500';
  if (days < 0) return 'text-red-600 font-semibold';
  if (days <= 30) return 'text-orange-600 font-semibold';
  return 'text-green-600';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const EquipamentosTable: React.FC<EquipamentosTableProps> = ({
  equipments,
  loading = false,
  onSearch,
  onView,
  onEdit,
  onAssignUser,
  onRemoveUser,
  onQRCode,
  onDelete,
  onCreate,
  onReport,
  onFiltersChange,
  filters = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch?.(searchTerm);
  };

  const handleFiltersChange = (newFilters: any) => {
    onFiltersChange?.(newFilters);
  };

  const handleClearFilters = () => {
    onFiltersChange?.({});
  };

  const toggleRowExpansion = (equipmentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(equipmentId)) {
      newExpanded.delete(equipmentId);
    } else {
      newExpanded.add(equipmentId);
    }
    setExpandedRows(newExpanded);
  };

  const isExpanded = (equipmentId: string) => expandedRows.has(equipmentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando equipamentos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca e ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por número de série, modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          {onReport && (
            <Button onClick={onReport} variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
          )}
          {onCreate && (
            <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          )}
        </div>
      </div>

      {/* Filtros móveis */}
      {onFiltersChange && (
        <EquipmentFiltersMobile
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />
      )}

      {/* Lista de equipamentos - Mobile First */}
      <div className="space-y-3">
        {equipments.map((equipment) => (
          <Card key={equipment.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">
                    {equipment.serialNumber}
                  </CardTitle>
                  <p className="text-sm text-gray-600 truncate">
                    {equipment.model || 'Sem modelo'}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge className={getStatusBadgeColor(equipment.status)}>
                    {EQUIPMENT_STATUS_LABELS[equipment.status]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(equipment.id)}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded(equipment.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Informações principais - sempre visíveis */}
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Usuário:</span>
                  <span className="font-medium truncate">
                    {equipment.currentUserName || 'Não atribuído'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Nível:</span>
                  <span className="font-medium">
                    {equipment.protectionLevel 
                      ? PROTECTION_LEVEL_LABELS[equipment.protectionLevel]
                      : '-'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Validade:</span>
                  <span className={cn(
                    "font-medium",
                    getDaysToExpiryColor(equipment.daysToExpiry)
                  )}>
                    {equipment.validityDate 
                      ? formatDate(equipment.validityDate)
                      : '-'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Perigoso:</span>
                  <Badge variant={equipment.isDangerous ? "destructive" : "secondary"} className="text-xs">
                    {equipment.isDangerous ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>

              {/* Informações de validade detalhadas */}
              {equipment.daysToExpiry !== undefined && equipment.daysToExpiry !== null && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                  <span className={cn(
                    "text-sm font-medium",
                    getDaysToExpiryColor(equipment.daysToExpiry)
                  )}>
                    {equipment.daysToExpiry < 0 
                      ? `Vencido há ${Math.abs(equipment.daysToExpiry)} dias`
                      : `${equipment.daysToExpiry} dias restantes`
                    }
                  </span>
                </div>
              )}

              {/* Detalhes expandidos */}
              {isExpanded(equipment.id) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Informações Detalhadas</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Número de Série:</span>
                          <span className="font-mono font-medium">{equipment.serialNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Modelo:</span>
                          <span className="font-medium">{equipment.model || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={getStatusBadgeColor(equipment.status)}>
                            {EQUIPMENT_STATUS_LABELS[equipment.status]}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Usuário Atual:</span>
                          <span className="font-medium">{equipment.currentUserName || 'Não atribuído'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nível de Proteção:</span>
                          <span className="font-medium">
                            {equipment.protectionLevel 
                              ? PROTECTION_LEVEL_LABELS[equipment.protectionLevel]
                              : '-'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Equipamento Perigoso:</span>
                          <Badge variant={equipment.isDangerous ? "destructive" : "secondary"}>
                            {equipment.isDangerous ? 'Sim' : 'Não'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {onView && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onView(equipment)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                  )}
                  {onEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEdit(equipment)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  
                  {/* Menu de ações adicionais */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <MoreVertical className="h-4 w-4 mr-2" />
                        Mais
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {equipment.currentUserId ? (
                        onRemoveUser && (
                          <DropdownMenuItem onClick={() => onRemoveUser(equipment)}>
                            <UserX className="h-4 w-4 mr-2" />
                            Remover Usuário
                          </DropdownMenuItem>
                        )
                      ) : (
                        onAssignUser && (
                          <DropdownMenuItem onClick={() => onAssignUser(equipment)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Atribuir Usuário
                          </DropdownMenuItem>
                        )
                      )}
                      {onQRCode && (
                        <DropdownMenuItem onClick={() => onQRCode(equipment)}>
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(equipment)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {equipments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum equipamento encontrado</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca para encontrar o que procura.'
                : 'Comece adicionando um novo equipamento ao sistema.'
              }
            </p>
            {onCreate && (
              <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Equipamento
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EquipamentosTable;
