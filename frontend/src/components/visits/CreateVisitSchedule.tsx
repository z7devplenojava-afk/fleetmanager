import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Route, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Truck,
  BarChart3,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Client, Unit, CreateVisitScheduleDTO, VisitSchedule } from '@/types/visit';
import { Employee } from '@/types/employee';
import clientService from '@/services/clientService';
import unitService from '@/services/unitService';
import { employeeService } from '@/services/employeeService';
import visitScheduleService from '@/services/visitScheduleService';

interface CreateVisitScheduleProps {
  onScheduleCreated?: (schedule: VisitSchedule) => void;
  onCancel?: () => void;
}

const CreateVisitSchedule: React.FC<CreateVisitScheduleProps> = ({
  onScheduleCreated,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [supervisors, setSupervisors] = useState<Employee[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<CreateVisitScheduleDTO>({
    supervisorId: '',
    clientId: '',
    scheduleDate: '',
    unitIds: [],
    startTime: '08:00',
    endTime: '17:00',
    observations: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.clientId) {
      loadClientUnits(formData.clientId);
    } else {
      setUnits([]);
      setSelectedUnits([]);
    }
  }, [formData.clientId]);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      const [clientsData, supervisorsData] = await Promise.all([
        clientService.getAllClients(),
        employeeService.getAllEmployees()
      ]);
      
      setClients(clientsData);
      
      // Filtrar apenas supervisores (assumindo que temos um campo role)
      const supervisorsList = supervisorsData.filter(emp => 
        emp.position?.name?.toLowerCase().includes('supervisor') ||
        emp.jobInfo?.position?.toLowerCase().includes('supervisor')
      );
      setSupervisors(supervisorsList);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadClientUnits = async (clientId: string) => {
    try {
      const unitsData = await unitService.getUnitsByClient(clientId);
      setUnits(unitsData);
      setSelectedUnits([]);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      toast.error('Erro ao carregar unidades do cliente');
    }
  };

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnits(prev => {
      const updated = prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId];
      
      setFormData(prevForm => ({
        ...prevForm,
        unitIds: updated
      }));
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supervisorId || !formData.clientId || !formData.scheduleDate || selectedUnits.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const scheduleData = {
        ...formData,
        unitIds: selectedUnits
      };
      
      const newSchedule = await visitScheduleService.createOptimizedSchedule(scheduleData);
      
      toast.success(
        `Escala criada com sucesso! Score de otimização: ${newSchedule.routeOptimizationScore?.toFixed(1)}%`,
        {
          duration: 5000,
          action: {
            label: 'Ver Detalhes',
            onClick: () => console.log('Ver detalhes da escala:', newSchedule)
          }
        }
      );
      
      onScheduleCreated?.(newSchedule);
    } catch (error) {
      console.error('Erro ao criar escala:', error);
      toast.error('Erro ao criar escala de visitas');
    } finally {
      setLoading(false);
    }
  };

  const getOptimizationPreview = () => {
    if (selectedUnits.length < 2) return null;
    
    const selectedUnitObjects = units.filter(unit => selectedUnits.includes(unit.id));
    const estimatedTime = selectedUnits.length * 30; // 30 min por visita
    const hasCoordinates = selectedUnitObjects.some(unit => unit.latitude && unit.longitude);
    
    return (
      <Card className="border-gray-600 bg-seguranca-graphite">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-seguranca-lightgray">
            <BarChart3 className="w-5 h-5 text-seguranca-yellow" />
            Preview da Rota Otimizada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-seguranca-black rounded-lg border border-gray-600">
              <div className="w-8 h-8 bg-seguranca-darkred rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total de Visitas</p>
                <p className="font-semibold text-seguranca-lightgray">{selectedUnits.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-seguranca-black rounded-lg border border-gray-600">
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Tempo Estimado</p>
                <p className="font-semibold text-seguranca-lightgray">
                  {Math.ceil(estimatedTime / 60)}h {estimatedTime % 60}min
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-seguranca-black rounded-lg border border-gray-600">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                hasCoordinates ? 'bg-green-700' : 'bg-yellow-600'
              }`}>
                {hasCoordinates ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400">Otimização</p>
                <p className={`font-semibold text-sm ${
                  hasCoordinates ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {hasCoordinates ? 'Disponível' : 'Limitada'}
                </p>
              </div>
            </div>
          </div>
          
          {!hasCoordinates && (
            <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-300">Atenção:</p>
                <p className="text-yellow-200">
                  Alguns postos não possuem coordenadas. A otimização será baseada na ordem de cadastro.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (initialLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-seguranca-yellow border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="text-lg font-medium text-seguranca-lightgray">Carregando dados...</h3>
              <p className="text-sm text-gray-400">Aguarde enquanto carregamos supervisores e clientes</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header com botão de fechar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
        <div>
          <h2 className="text-xl font-semibold text-seguranca-lightgray">Criar Nova Escala de Visitas</h2>
          <p className="text-sm text-gray-400 mt-1">Configure uma nova escala de visitas otimizada</p>
        </div>
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-seguranca-lightgray hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Informações Básicas */}
          <Card className="h-fit bg-seguranca-graphite border-gray-600">
            <CardHeader className="border-b border-gray-600">
              <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                <Calendar className="w-5 h-5 text-seguranca-yellow" />
                Informações da Escala
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-4 lg:p-6">
              {/* Supervisor */}
              <div className="space-y-2">
                <Label htmlFor="supervisor" className="text-sm font-medium text-seguranca-lightgray">
                  Supervisor *
                </Label>
                <Select
                  value={formData.supervisorId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, supervisorId: value }))}
                >
                  <SelectTrigger className="h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o supervisor responsável" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {supervisors.filter(supervisor => supervisor.id).map(supervisor => (
                      <SelectItem key={supervisor.id} value={supervisor.id!} className="text-seguranca-lightgray hover:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-seguranca-yellow" />
                          {supervisor.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {supervisors.length === 0 && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Nenhum supervisor encontrado
                  </p>
                )}
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="client" className="text-sm font-medium text-seguranca-lightgray">
                  Cliente *
                </Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger className="h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {clients.filter(client => client.id).map(client => (
                      <SelectItem key={client.id} value={client.id} className="text-seguranca-lightgray hover:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-green-400" />
                          {client.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clients.length === 0 && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Nenhum cliente encontrado
                  </p>
                )}
              </div>

              {/* Data da Escala */}
              <div className="space-y-2">
                <Label htmlFor="scheduleDate" className="text-sm font-medium text-seguranca-lightgray">
                  Data da Escala *
                </Label>
                <div className="relative">
                  <Input
                    id="scheduleDate"
                    type="date"
                    value={formData.scheduleDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduleDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Selecione uma data futura para a execução da escala
                </p>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium text-seguranca-lightgray">
                    Horário de Início
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="h-11 pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium text-seguranca-lightgray">
                    Horário de Término
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="h-11 pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observations" className="text-sm font-medium text-seguranca-lightgray">
                  Observações
                </Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Adicione observações importantes sobre esta escala..."
                  rows={3}
                  className="resize-none bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Unidades */}
          <Card className="h-fit bg-seguranca-graphite border-gray-600">
            <CardHeader className="border-b border-gray-600">
              <CardTitle className="flex items-center justify-between text-seguranca-lightgray">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-seguranca-yellow" />
                  Postos de Trabalho
                </div>
                <Badge variant="secondary" className="bg-seguranca-darkred text-white">
                  {selectedUnits.length} selecionados
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              {!formData.clientId ? (
                <div className="text-center py-8 lg:py-12 space-y-3">
                  <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-seguranca-lightgray">Selecione um cliente</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Escolha um cliente para visualizar os postos de trabalho disponíveis
                    </p>
                  </div>
                </div>
              ) : units.length === 0 ? (
                <div className="text-center py-8 lg:py-12 space-y-3">
                  <div className="w-16 h-16 mx-auto bg-yellow-600/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-seguranca-lightgray">Nenhum posto encontrado</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Este cliente não possui postos de trabalho cadastrados
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Controles de seleção */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-seguranca-black rounded-lg border border-gray-600">
                    <span className="text-sm font-medium text-seguranca-lightgray">
                      {units.length} postos disponíveis
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allIds = units.map(unit => unit.id);
                          setSelectedUnits(allIds);
                          setFormData(prev => ({ ...prev, unitIds: allIds }));
                        }}
                        disabled={selectedUnits.length === units.length}
                        className="bg-transparent border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                      >
                        Selecionar Todos
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUnits([]);
                          setFormData(prev => ({ ...prev, unitIds: [] }));
                        }}
                        disabled={selectedUnits.length === 0}
                        className="bg-transparent border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>

                  {/* Lista de unidades */}
                  <div className="space-y-3 max-h-64 lg:max-h-80 overflow-y-auto pr-2">
                    {units.map(unit => (
                      <div
                        key={unit.id}
                        className={`flex items-start space-x-3 p-3 lg:p-4 border rounded-lg transition-all cursor-pointer ${
                          selectedUnits.includes(unit.id) 
                            ? 'border-seguranca-yellow bg-seguranca-yellow/10' 
                            : 'border-gray-600 hover:border-gray-500 bg-seguranca-black/50'
                        }`}
                        onClick={() => handleUnitToggle(unit.id)}
                      >
                        <Checkbox
                          id={`unit-${unit.id}`}
                          checked={selectedUnits.includes(unit.id)}
                          onCheckedChange={() => handleUnitToggle(unit.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`unit-${unit.id}`}
                            className="text-sm font-medium cursor-pointer block text-seguranca-lightgray"
                          >
                            {unit.name}
                          </label>
                          {unit.address && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{unit.address}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {unit.latitude && unit.longitude ? (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-400 bg-green-500/10">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Localização OK
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400 bg-yellow-500/10">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Sem localização
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview da Otimização */}
        {getOptimizationPreview()}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-600">
          <Button
            type="submit"
            disabled={loading || selectedUnits.length === 0 || !formData.supervisorId || !formData.clientId || !formData.scheduleDate}
            className="bg-seguranca-darkred hover:bg-seguranca-red text-white order-1 min-w-[200px] h-11"
          >
            {loading ? (
              <>
                <BarChart3 className="w-4 h-4 mr-2 animate-pulse" />
                Otimizando Rota...
              </>
            ) : (
              <>
                <Route className="w-4 h-4 mr-2" />
                Criar Escala Otimizada
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateVisitSchedule;
