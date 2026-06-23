import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, MapPin, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ServiceRatingService from '@/services/serviceRatingService';

interface SimpleExtraTrip {
  id: string;
  ratingId: string;
  contractId: string;
  tripType: 'EXTRA_DELIVERY' | 'EXTRA_TRANSPORT' | 'EMERGENCY_TRIP' | 'SPECIAL_SERVICE';
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  date: string;
  startTime: string;
  endTime: string;
  clientName?: string;
  purpose: string;
  rate: number;
  rateType: 'PER_KM' | 'PER_HOUR' | 'FIXED';
  amount: number;
  currency: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

interface SimpleExtraTripsProps {
  ratingId: string;
  contractId: string;
}

const SimpleExtraTrips: React.FC<SimpleExtraTripsProps> = ({ ratingId, contractId }) => {
  const [trips, setTrips] = useState<SimpleExtraTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<SimpleExtraTrip | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState<SimpleExtraTrip | null>(null);
  const [formData, setFormData] = useState({
    tripType: 'EXTRA_DELIVERY' as SimpleExtraTrip['tripType'],
    origin: '',
    destination: '',
    distance: 0,
    duration: 0,
    date: '',
    startTime: '',
    endTime: '',
    clientName: '',
    purpose: '',
    rate: 0,
    rateType: 'PER_KM' as SimpleExtraTrip['rateType'],
    notes: ''
  });

  React.useEffect(() => {
    loadTrips();
  }, [ratingId]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const tripsData = await ServiceRatingService.getExtraTripsByRating(ratingId);
      setTrips(tripsData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar viagens extras',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tripType: 'EXTRA_DELIVERY',
      origin: '',
      destination: '',
      distance: 0,
      duration: 0,
      date: '',
      startTime: '',
      endTime: '',
      clientName: '',
      purpose: '',
      rate: 0,
      rateType: 'PER_KM',
      notes: ''
    });
    setEditingTrip(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tripData = {
        ...formData,
        ratingId,
        contractId,
        amount: calculateAmount(),
        currency: 'BRL',
        approved: false
      };

      if (editingTrip) {
        await ServiceRatingService.updateExtraTrip(editingTrip.id, tripData);
        toast({
          title: 'Sucesso',
          description: 'Viagem extra atualizada com sucesso'
        });
      } else {
        await ServiceRatingService.createExtraTrip(tripData);
        toast({
          title: 'Sucesso',
          description: 'Viagem extra criada com sucesso'
        });
      }

      setShowDialog(false);
      resetForm();
      loadTrips();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar viagem extra',
        variant: 'destructive'
      });
    }
  };

  const calculateAmount = () => {
    switch (formData.rateType) {
      case 'PER_KM':
        return formData.distance * formData.rate;
      case 'PER_HOUR':
        return (formData.duration / 60) * formData.rate;
      case 'FIXED':
        return formData.rate;
      default:
        return 0;
    }
  };

  const handleEdit = (trip: SimpleExtraTrip) => {
    setEditingTrip(trip);
    setFormData({
      tripType: trip.tripType,
      origin: trip.origin,
      destination: trip.destination,
      distance: trip.distance,
      duration: trip.duration,
      date: trip.date,
      startTime: trip.startTime,
      endTime: trip.endTime,
      clientName: trip.clientName || '',
      purpose: trip.purpose,
      rate: trip.rate,
      rateType: trip.rateType,
      notes: trip.notes || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingTrip) return;

    try {
      await ServiceRatingService.deleteExtraTrip(deletingTrip.id);
      toast({
        title: 'Sucesso',
        description: 'Viagem extra excluída com sucesso'
      });
      setDeleteDialog(false);
      setDeletingTrip(null);
      loadTrips();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir viagem extra',
        variant: 'destructive'
      });
    }
  };

  const getTripTypeLabel = (type: SimpleExtraTrip['tripType']) => {
    const labels = {
      'EXTRA_DELIVERY': 'Entrega Extra',
      'EXTRA_TRANSPORT': 'Transporte Extra',
      'EMERGENCY_TRIP': 'Viagem de Emergência',
      'SPECIAL_SERVICE': 'Serviço Especial'
    };
    return labels[type] || type;
  };

  const getRateTypeLabel = (type: SimpleExtraTrip['rateType']) => {
    const labels = {
      'PER_KM': 'Por KM',
      'PER_HOUR': 'Por Hora',
      'FIXED': 'Fixo'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Viagens Extras
          </CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Viagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTrip ? 'Editar Viagem Extra' : 'Nova Viagem Extra'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tripType">Tipo de Viagem</Label>
                    <Select value={formData.tripType} onValueChange={(value) => setFormData(prev => ({ ...prev, tripType: value as SimpleExtraTrip['tripType'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXTRA_DELIVERY">Entrega Extra</SelectItem>
                        <SelectItem value="EXTRA_TRANSPORT">Transporte Extra</SelectItem>
                        <SelectItem value="EMERGENCY_TRIP">Viagem de Emergência</SelectItem>
                        <SelectItem value="SPECIAL_SERVICE">Serviço Especial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin">Origem</Label>
                    <Input
                      id="origin"
                      value={formData.origin}
                      onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                      placeholder="Ex: Centro de Distribuição A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destino</Label>
                    <Input
                      id="destination"
                      value={formData.destination}
                      onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                      placeholder="Ex: Cliente Industrial B"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Hora Início</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Hora Fim</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="distance">Distância (KM)</Label>
                    <Input
                      id="distance"
                      type="number"
                      step="0.1"
                      value={formData.distance}
                      onChange={(e) => setFormData(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duração (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientName">Cliente</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Nome do cliente (opcional)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="purpose">Finalidade</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="Descreva o propósito da viagem"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rateType">Tipo de Taxa</Label>
                    <Select value={formData.rateType} onValueChange={(value) => setFormData(prev => ({ ...prev, rateType: value as SimpleExtraTrip['rateType'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PER_KM">Por KM</SelectItem>
                        <SelectItem value="PER_HOUR">Por Hora</SelectItem>
                        <SelectItem value="FIXED">Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rate">Taxa (R$)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Valor Total</Label>
                    <div className="mt-1 p-2 bg-gray-100 rounded text font-semibold">
                      R$ {calculateAmount().toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observações adicionais (opcional)"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTrip ? 'Atualizar' : 'Criar'} Viagem
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma viagem extra encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem/Destino</TableHead>
                  <TableHead>Distância</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>{format(new Date(trip.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTripTypeLabel(trip.tripType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{trip.origin}</div>
                        <div className="text-gray-500">{trip.destination}</div>
                      </div>
                    </TableCell>
                    <TableCell>{trip.distance} km</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{getRateTypeLabel(trip.rateType)}</div>
                        <div className="text-gray-500">R$ {trip.rate.toFixed(2)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      R$ {trip.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trip.approved ? 'default' : 'secondary'}>
                        {trip.approved ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovado
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(trip)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDeletingTrip(trip);
                            setDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta viagem extra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SimpleExtraTrips;
