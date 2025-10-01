import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  MapPin,
  Calendar,
  Clock3,
  RefreshCw,
  Download,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Visit, VisitStatus } from '@/types/visit';
import { visitService } from '@/services/visitService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface VisitListProps {
  onCreateVisit?: () => void;
  onEditVisit?: (visit: Visit) => void;
  onViewVisit?: (visit: Visit) => void;
  onDeleteVisit?: (visit: Visit) => void;
  onCompleteVisit?: (visit: Visit) => void;
}

const VisitList: React.FC<VisitListProps> = ({
  onCreateVisit,
  onEditVisit,
  onViewVisit,
  onDeleteVisit,
  onCompleteVisit
}) => {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  useEffect(() => {
    loadVisits();
  }, [monthFilter, yearFilter]);

  useEffect(() => {
    filterVisits();
  }, [visits, searchTerm, statusFilter]);

  const loadVisits = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await visitService.getVisitsBySupervisor(user.id, yearFilter, monthFilter);
      setVisits(data);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVisits = () => {
    let filtered = visits;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(visit =>
        visit.unitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.unitAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.observations?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(visit => visit.status === statusFilter);
    }

    setFilteredVisits(filtered);
  };

  const getStatusBadge = (status: VisitStatus) => {
    const statusConfig = {
      [VisitStatus.PENDING]: { 
        label: 'Pendente', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      [VisitStatus.COMPLETED]: { 
        label: 'Realizada', 
        className: 'bg-green-100 text-green-800 border-green-200' 
      },
      [VisitStatus.NOT_COMPLETED]: { 
        label: 'Não Realizada', 
        className: 'bg-red-100 text-red-800 border-red-200' 
      },
      [VisitStatus.CANCELLED]: { 
        label: 'Cancelada', 
        className: 'bg-gray-100 text-gray-800 border-gray-200' 
      }
    };

    const config = statusConfig[status];
    return (
      <Badge className={cn('border', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: VisitStatus) => {
    switch (status) {
      case VisitStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case VisitStatus.NOT_COMPLETED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case VisitStatus.CANCELLED:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    return new Date(timeString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCompleteVisit = async (visit: Visit) => {
    try {
      await visitService.markVisitAsCompleted(visit.id!);
      await loadVisits();
      onCompleteVisit?.(visit);
    } catch (error) {
      console.error('Erro ao marcar visita como realizada:', error);
    }
  };

  const handleDeleteVisit = async (visit: Visit) => {
    if (window.confirm('Tem certeza que deseja excluir esta visita?')) {
      try {
        await visitService.deleteVisit(visit.id!);
        await loadVisits();
        onDeleteVisit?.(visit);
      } catch (error) {
        console.error('Erro ao excluir visita:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando visitas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Lista de Visitas
            </CardTitle>
            <Button onClick={onCreateVisit} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Visita
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por unidade, endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value={VisitStatus.PENDING}>Pendente</SelectItem>
                <SelectItem value={VisitStatus.COMPLETED}>Realizada</SelectItem>
                <SelectItem value={VisitStatus.NOT_COMPLETED}>Não Realizada</SelectItem>
                <SelectItem value={VisitStatus.CANCELLED}>Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter.toString()} onValueChange={(value) => setMonthFilter(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {new Date(2024, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter.toString()} onValueChange={(value) => setYearFilter(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de visitas */}
      {filteredVisits.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma visita encontrada</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando uma nova visita'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={onCreateVisit} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Visita
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((visit) => (
            <Card key={visit.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getStatusIcon(visit.status)}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{visit.unitName}</h3>
                        {getStatusBadge(visit.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{visit.unitAddress}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(visit.visitDate)}</span>
                        </div>
                        
                        {visit.arrivalTime && (
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />
                            <span>Chegada: {formatTime(visit.arrivalTime)}</span>
                          </div>
                        )}
                        
                        {visit.departureTime && (
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />
                            <span>Saída: {formatTime(visit.departureTime)}</span>
                          </div>
                        )}
                      </div>
                      
                      {visit.observations && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{visit.observations}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onViewVisit?.(visit)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => onEditVisit?.(visit)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      
                      {visit.status === VisitStatus.PENDING && (
                        <DropdownMenuItem onClick={() => handleCompleteVisit(visit)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como Realizada
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleDeleteVisit(visit)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitList;
