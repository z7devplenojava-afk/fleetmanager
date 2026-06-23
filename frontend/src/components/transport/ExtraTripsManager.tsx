import React, { useState, useEffect } from 'react';
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
import { Calendar as CalendarIcon, Plus, Edit, Trash2, MapPin, Clock, DollarSign, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ServiceRatingService from '@/services/serviceRatingService';

interface ExtraTrip {
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

interface AddressSuggestion {
  display_name: string;
  place_id: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface ExtraTripsManagerProps {
  ratingId: string;
  contractId: string;
}

const ExtraTripsManager: React.FC<ExtraTripsManagerProps> = ({ ratingId, contractId }) => {
  const [trips, setTrips] = useState<ExtraTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<ExtraTrip | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState<ExtraTrip | null>(null);
  
  // States for address autocomplete
  const [originSuggestions, setOriginSuggestions] = useState<AddressSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<AddressSuggestion[]>([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [selectedOriginCoords, setSelectedOriginCoords] = useState<{lat: number, lon: number} | null>(null);
  const [selectedDestinationCoords, setSelectedDestinationCoords] = useState<{lat: number, lon: number} | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  
  const [formData, setFormData] = useState({
    tripType: 'EXTRA_DELIVERY' as ExtraTrip['tripType'],
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
    rateType: 'PER_KM' as ExtraTrip['rateType'],
    notes: ''
  });

  useEffect(() => {
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

  // Função para buscar sugestões de endereços
  const searchAddresses = async (query: string): Promise<AddressSuggestion[]> => {
    if (!query || query.length < 3) return [];
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FleetManager/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch addresses');
      
      const data = await response.json();
      return data.map((item: any) => ({
        display_name: item.display_name,
        place_id: item.place_id,
        lat: item.lat,
        lon: item.lon,
        address: item.address || {}
      }));
    } catch (error) {
      console.error('Error searching addresses:', error);
      return [];
    }
  };

  // Função para calcular distância entre dois pontos
  const calculateDistance = async (origin: {lat: number, lon: number}, destination: {lat: number, lon: number}): Promise<number> => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false`,
        {
          headers: {
            'User-Agent': 'FleetManager/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to calculate distance');
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        // OSRM retorna distância em metros, converter para km
        return data.routes[0].distance / 1000;
      }
      
      // Fallback: calcular distância em linha reta (Haversine)
      const R = 6371; // Raio da Terra em km
      const dLat = (destination.lat - origin.lat) * Math.PI / 180;
      const dLon = (destination.lon - origin.lon) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    } catch (error) {
      console.error('Error calculating distance:', error);
      // Fallback: calcular distância em linha reta
      const R = 6371; // Raio da Terra em km
      const dLat = (destination.lat - origin.lat) * Math.PI / 180;
      const dLon = (destination.lon - origin.lon) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
  };

  // Handlers para autocomplete
  const handleOriginSearch = async (value: string) => {
    setFormData(prev => ({ ...prev, origin: value }));
    
    if (value.length >= 3) {
      setOriginLoading(true);
      const suggestions = await searchAddresses(value);
      setOriginSuggestions(suggestions);
      setShowOriginSuggestions(true);
      setOriginLoading(false);
    } else {
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    }
  };

  const handleDestinationSearch = async (value: string) => {
    setFormData(prev => ({ ...prev, destination: value }));
    
    if (value.length >= 3) {
      setDestinationLoading(true);
      const suggestions = await searchAddresses(value);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(true);
      setDestinationLoading(false);
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  };

  const handleOriginSelect = (suggestion: AddressSuggestion) => {
    setFormData(prev => ({ ...prev, origin: suggestion.display_name }));
    setSelectedOriginCoords({ lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) });
    setShowOriginSuggestions(false);
    setOriginSuggestions([]);
    
    // Se já tiver destino, calcular distância
    if (selectedDestinationCoords) {
      calculateAndSetDistance();
    }
  };

  const handleDestinationSelect = (suggestion: AddressSuggestion) => {
    setFormData(prev => ({ ...prev, destination: suggestion.display_name }));
    setSelectedDestinationCoords({ lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) });
    setShowDestinationSuggestions(false);
    setDestinationSuggestions([]);
    
    // Se já tiver origem, calcular distância
    if (selectedOriginCoords) {
      calculateAndSetDistance();
    }
  };

  const calculateAndSetDistance = async () => {
    if (!selectedOriginCoords || !selectedDestinationCoords) return;
    
    setCalculatingDistance(true);
    try {
      const distance = await calculateDistance(selectedOriginCoords, selectedDestinationCoords);
      setFormData(prev => ({ ...prev, distance: Math.round(distance * 100) / 100 }));
      
      toast({
        title: 'Distância Calculada',
        description: `Distância: ${distance.toFixed(2)} km`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível calcular a distância',
        variant: 'destructive'
      });
    } finally {
      setCalculatingDistance(false);
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
    
    // Reset address states
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setSelectedOriginCoords(null);
    setSelectedDestinationCoords(null);
    setShowOriginSuggestions(false);
    setShowDestinationSuggestions(false);
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

  const handleEdit = (trip: ExtraTrip) => {
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

  const getTripTypeLabel = (type: ExtraTrip['tripType']) => {
    const labels = {
      'EXTRA_DELIVERY': 'Entrega Extra',
      'EXTRA_TRANSPORT': 'Transporte Extra',
      'EMERGENCY_TRIP': 'Viagem de Emergência',
      'SPECIAL_SERVICE': 'Serviço Especial'
    };
    return labels[type] || type;
  };

  const getRateTypeLabel = (type: ExtraTrip['rateType']) => {
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
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Nova Funcionalidade: Endereços Inteligentes</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Digite endereços completos nos campos de origem e destino. O sistema buscará automaticamente as coordenadas 
                        e calculará a distância real da rota. Você pode selecionar endereços da lista de sugestões que aparece.
                      </p>
                      <ul className="text-xs text-blue-600 mt-2 space-y-1">
                        <li>• Digite pelo menos 3 caracteres para ver sugestões</li>
                        <li>• Selecione um endereço da lista para usar coordenadas exatas</li>
                        <li>• Após selecionar ambos os endereços, clique em "Calcular Distância"</li>
                        <li>• A distância será usada automaticamente no cálculo do valor</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tripType">Tipo de Viagem</Label>
                    <Select value={formData.tripType} onValueChange={(value) => setFormData(prev => ({ ...prev, tripType: value as ExtraTrip['tripType'] }))}>
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
                  <div className="relative">
                    <Label htmlFor="origin">Origem</Label>
                    <div className="relative">
                      <Input
                        id="origin"
                        value={formData.origin}
                        onChange={(e) => handleOriginSearch(e.target.value)}
                        placeholder="Digite o endereço de origem..."
                        required
                        className="pr-10"
                      />
                      {originLoading && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                      )}
                    </div>
                    {showOriginSuggestions && originSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {originSuggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.place_id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => handleOriginSelect(suggestion)}
                          >
                            <div className="font-medium">{suggestion.display_name}</div>
                            {suggestion.address.city && (
                              <div className="text-gray-500 text-xs">
                                {suggestion.address.city}, {suggestion.address.state}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Label htmlFor="destination">Destino</Label>
                    <div className="relative">
                      <Input
                        id="destination"
                        value={formData.destination}
                        onChange={(e) => handleDestinationSearch(e.target.value)}
                        placeholder="Digite o endereço de destino..."
                        required
                        className="pr-10"
                      />
                      {destinationLoading && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                      )}
                    </div>
                    {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {destinationSuggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.place_id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => handleDestinationSelect(suggestion)}
                          >
                            <div className="font-medium">{suggestion.display_name}</div>
                            {suggestion.address.city && (
                              <div className="text-gray-500 text-xs">
                                {suggestion.address.city}, {suggestion.address.state}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedOriginCoords && selectedDestinationCoords && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        Endereços selecionados para cálculo de distância
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={calculateAndSetDistance}
                      disabled={calculatingDistance}
                    >
                      {calculatingDistance ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Calculando...
                        </>
                      ) : (
                        <>
                          <Search className="h-3 w-3 mr-1" />
                          Calcular Distância
                        </>
                      )}
                    </Button>
                  </div>
                )}

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
                    <Label htmlFor="distance">
                      Distância (KM)
                      {formData.distance > 0 && (
                        <span className="ml-2 text-xs text-green-600 font-medium">
                          ✓ Calculada
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="distance"
                        type="number"
                        step="0.1"
                        value={formData.distance}
                        onChange={(e) => setFormData(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
                        placeholder="Será calculada automaticamente"
                        className={formData.distance > 0 ? "bg-green-50 border-green-200" : ""}
                        required
                      />
                      {formData.distance > 0 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <MapPin className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    {formData.distance > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Distância calculada entre os endereços selecionados
                      </p>
                    )}
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
                    <Select value={formData.rateType} onValueChange={(value) => setFormData(prev => ({ ...prev, rateType: value as ExtraTrip['rateType'] }))}>
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

export default ExtraTripsManager;
