import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Calendar, MapPin, User, Clock, Loader2 } from 'lucide-react';
import api from '@/lib/axios';

interface Visit {
  id: string;
  title: string;
  location: string;
  client: string;
  assignedTo: string;
  supervisor: string;
  status: string;
  scheduledAt: string;
  description?: string;
}

interface AllVisitsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onVisitUpdated?: () => void;
}

const AllVisitsModal: React.FC<AllVisitsModalProps> = ({ 
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onVisitUpdated 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Usar controle externo se fornecido, senão usar interno
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/visit-controls');
      setVisits(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadVisits();
    }
  }, [open]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'COMPLETED': { label: 'Concluída', className: 'bg-green-600' },
      'IN_PROGRESS': { label: 'Em Andamento', className: 'bg-blue-600' },
      'SCHEDULED': { label: 'Pendente', className: 'bg-yellow-600' },
      'CANCELLED': { label: 'Cancelada', className: 'bg-red-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: 'bg-gray-600' 
    };

    return (
      <Badge className={`${config.className} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return 'Não agendado';
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* DialogTrigger só aparece quando não há controle externo */}
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
            <Eye className="h-4 w-4 mr-2" />
            Ver Todas
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Todas as Visitas</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Carregando visitas...</span>
            </div>
          ) : visits.length > 0 ? (
            <div className="space-y-4">
              {visits.map((visit) => (
                <Card key={visit.id} className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-medium">{visit.title}</h3>
                          {getStatusBadge(visit.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{visit.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{visit.client}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Responsável: {visit.assignedTo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDateTime(visit.scheduledAt)}</span>
                          </div>
                        </div>
                        
                        {visit.description && (
                          <p className="text-sm text-gray-400 mt-2">{visit.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Nenhuma visita encontrada
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button
            onClick={() => setOpen(false)}
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AllVisitsModal;
