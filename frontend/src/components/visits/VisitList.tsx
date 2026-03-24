import React from 'react';
import { Edit, Eye, Trash2, MapPin, Clock, User, Building, Camera, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Visit } from '@/types/visit';

interface VisitListProps {
  visits: Visit[];
  loading?: boolean;
  onEdit: (visit: Visit) => void;
  onView: (visit: Visit) => void;
  onDelete: (visitId: string) => void;
}

const VisitList: React.FC<VisitListProps> = ({
  visits,
  loading = false,
  onEdit,
  onView,
  onDelete,
}) => {
  // Garantir que visits seja um array
  const safeVisits = visits || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', className: 'bg-blue-500 text-white' },
      SCHEDULED: { label: 'Agendada', className: 'bg-blue-500 text-white' },
      IN_PROGRESS: { label: 'Em Andamento', className: 'bg-yellow-500 text-white' },
      COMPLETED: { label: 'Concluída', className: 'bg-green-500 text-white' },
      NOT_COMPLETED: { label: 'Não Realizada', className: 'bg-gray-500 text-white' },
      CANCELLED: { label: 'Cancelada', className: 'bg-red-500 text-white' },
      MISSED: { label: 'Não Realizada', className: 'bg-gray-500 text-white' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status || 'Desconhecido', className: 'bg-gray-500 text-white' };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    try {
      return timeString.substring(0, 5);
    } catch (e) {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
      </div>
    );
  }

  if (safeVisits.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Nenhuma visita encontrada</h3>
        <p className="text-gray-400">Não há visitas que correspondam aos filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards para mobile */}
      <div className="block md:hidden space-y-3">
        {safeVisits.map((visit) => (
          <Card key={visit.id} className="bg-seguranca-black border-gray-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{visit.workPostName || 'N/A'}</h3>
                  <p className="text-gray-400 text-sm">{visit.clientName || 'N/A'}</p>
                </div>
                {getStatusBadge(visit.status || 'PENDING')}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-300">
                  <User className="w-4 h-4 mr-2" />
                  <span>{visit.supervisorName || 'N/A'}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-300">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{formatDate(visit.visitDate)} às {formatTime(visit.visitTime)}</span>
                </div>

                {visit.latitude && visit.longitude && (
                  <div className="flex items-center text-sm text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>Localização registrada</span>
                  </div>
                )}

                {(visit.presentEmployees && visit.presentEmployees.length > 0) && (
                  <div className="flex items-center text-sm text-gray-300">
                    <span>{visit.presentEmployees.length} funcionário(s) presente(s)</span>
                  </div>
                )}

                {((visit.photos && visit.photos.length > 0) || (visit.attachedFiles && visit.attachedFiles.length > 0)) && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Camera className="w-4 h-4 mr-2" />
                    <span>
                      {visit.photos?.length || 0} foto(s), {visit.attachedFiles?.length || 0} arquivo(s)
                    </span>
                  </div>
                )}
              </div>

              {visit.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-300 line-clamp-2">{visit.description}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView(visit)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(visit)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(visit.id)}
                  className="border-red-600 text-red-400 hover:bg-red-900"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela para desktop */}
      <div className="hidden md:block">
        <Card className="bg-seguranca-black border-gray-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Data/Hora</TableHead>
                  <TableHead className="text-gray-300">Posto</TableHead>
                  <TableHead className="text-gray-300">Cliente</TableHead>
                  <TableHead className="text-gray-300">Supervisor</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Funcionários</TableHead>
                  <TableHead className="text-gray-300">Anexos</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeVisits.map((visit) => (
                  <TableRow key={visit.id} className="border-gray-700 hover:bg-gray-800">
                    <TableCell className="text-white">
                      <div>
                        <div className="font-medium">{formatDate(visit.visitDate)}</div>
                        <div className="text-sm text-gray-400">{formatTime(visit.visitTime)}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-white">
                      <div className="font-medium">{visit.workPostName || 'N/A'}</div>
                      {visit.latitude && visit.longitude && (
                        <div className="flex items-center text-xs text-gray-400">
                          <MapPin className="w-3 h-3 mr-1" />
                          Localização
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-white">{visit.clientName || 'N/A'}</TableCell>
                    
                    <TableCell className="text-white">{visit.supervisorName || 'N/A'}</TableCell>
                    
                    <TableCell>{getStatusBadge(visit.status)}</TableCell>
                    
                    <TableCell className="text-white">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{visit.presentEmployees?.length || 0}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-white">
                      <div className="flex items-center space-x-2">
                        {(visit.photos && visit.photos.length > 0) && (
                          <div className="flex items-center text-xs">
                            <Camera className="w-3 h-3 mr-1" />
                            <span>{visit.photos.length}</span>
                          </div>
                        )}
                        {(visit.attachedFiles && visit.attachedFiles.length > 0) && (
                          <div className="flex items-center text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            <span>{visit.attachedFiles.length}</span>
                          </div>
                        )}
                        {(!visit.photos || visit.photos.length === 0) && (!visit.attachedFiles || visit.attachedFiles.length === 0) && (
                          <span className="text-gray-500 text-xs">Nenhum</span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(visit)}
                          className="text-gray-300 hover:text-white hover:bg-gray-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(visit)}
                          className="text-gray-300 hover:text-white hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(visit.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitList;