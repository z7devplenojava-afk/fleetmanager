import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText,
  MapPin,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sstService, AccidentRecord, CreateAccidentRecordDTO } from '@/services/sstService';
import { useToast } from '@/hooks/use-toast';
import { employeeService } from '@/services/employeeService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const Acidentes: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [accidents, setAccidents] = useState<AccidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Estados para modal de criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAccidentRecordDTO>({
    employeeId: '',
    accidentType: 'SEM_AFASTAMENTO',
    accidentDate: '',
    description: '',
    location: '',
    injuryDescription: '',
    catNumber: ''
  });

  // Carregar funcionários
  useEffect(() => {
    loadEmployees();
  }, []);

  // Carregar acidentes
  useEffect(() => {
    loadAccidents();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAllEmployees();
      setEmployees(response.content || []);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
    }
  };

  const loadAccidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sstService.getAccidentRecords();
      setAccidents(data);
    } catch (err) {
      console.error('Erro ao carregar acidentes:', err);
      setError('Erro ao carregar acidentes');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os acidentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar acidentes
  const filteredAccidents = accidents.filter(accident => {
    const matchesSearch = accident.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         accident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         accident.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         accident.catNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || accident.status === statusFilter;
    const matchesType = typeFilter === 'all' || accident.accidentType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Criar novo acidente
  const handleCreateAccident = async () => {
    try {
      if (!createForm.employeeId || !createForm.accidentDate || !createForm.description || !createForm.location) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await sstService.createAccidentRecord(createForm);
      toast({
        title: "Sucesso",
        description: "Acidente registrado com sucesso",
      });
      
      setShowCreateModal(false);
      setCreateForm({
        employeeId: '',
        accidentType: 'SEM_AFASTAMENTO',
        accidentDate: '',
        description: '',
        location: '',
        injuryDescription: '',
        catNumber: ''
      });
      
      loadAccidents();
    } catch (err: any) {
      console.error('Erro ao criar acidente:', err);
      toast({
        title: "Erro",
        description: err.response?.data?.message || "Não foi possível registrar o acidente",
        variant: "destructive",
      });
    }
  };

  // Excluir acidente
  const handleDeleteAccident = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de acidente?')) {
      return;
    }

    try {
      await sstService.deleteAccidentRecord(id);
      toast({
        title: "Sucesso",
        description: "Acidente excluído com sucesso",
      });
      loadAccidents();
    } catch (err: any) {
      console.error('Erro ao excluir acidente:', err);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o acidente",
        variant: "destructive",
      });
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENCERRADO':
        return 'bg-green-100 text-green-800';
      case 'INVESTIGADO':
        return 'bg-blue-100 text-blue-800';
      case 'REGISTRADO':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter cor do tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MORTAL':
        return 'bg-red-100 text-red-800';
      case 'COM_AFASTAMENTO':
        return 'bg-orange-100 text-orange-800';
      case 'SEM_AFASTAMENTO':
        return 'bg-yellow-100 text-yellow-800';
      case 'TRAJETO':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter label do tipo
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MORTAL':
        return 'Mortal';
      case 'COM_AFASTAMENTO':
        return 'Com Afastamento';
      case 'SEM_AFASTAMENTO':
        return 'Sem Afastamento';
      case 'TRAJETO':
        return 'Trajeto';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
            <p className="text-seguranca-lightgray">Carregando acidentes...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (error) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-red-500">{error}</p>
            <Button 
              onClick={loadAccidents}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              Registro de Acidentes
            </h1>
            <p className="text-gray-400 mt-1">Gestão de acidentes de trabalho e quase acidentes</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/rh/sst')}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Voltar
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Acidente
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="text-seguranca-lightgray">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Funcionário, descrição, local, CAT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="REGISTRADO">Registrado</SelectItem>
                    <SelectItem value="INVESTIGADO">Investigado</SelectItem>
                    <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="type" className="text-seguranca-lightgray">Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="MORTAL">Mortal</SelectItem>
                    <SelectItem value="COM_AFASTAMENTO">Com Afastamento</SelectItem>
                    <SelectItem value="SEM_AFASTAMENTO">Sem Afastamento</SelectItem>
                    <SelectItem value="TRAJETO">Trajeto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Acidentes */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              Acidentes Registrados ({filteredAccidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAccidents.length > 0 ? (
              <div className="space-y-4">
                {filteredAccidents.map((accident) => (
                  <div key={accident.id} className="p-4 bg-seguranca-black rounded-lg border border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-seguranca-lightgray">
                            {accident.employeeName}
                          </h3>
                          <Badge className={getStatusColor(accident.status)}>
                            {accident.status}
                          </Badge>
                          <Badge className={getTypeColor(accident.accidentType)}>
                            {getTypeLabel(accident.accidentType)}
                          </Badge>
                          {accident.catNumber && (
                            <Badge className="bg-blue-100 text-blue-800">
                              CAT: {accident.catNumber}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {accident.accidentDate ? new Date(accident.accidentDate).toLocaleDateString('pt-BR') : 'Data não informada'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{accident.location || 'Local não informado'}</span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-300 mb-2">
                          <strong className="text-seguranca-lightgray">Descrição:</strong>
                          <p className="mt-1">{accident.description}</p>
                        </div>
                        
                        {accident.injuryDescription && (
                          <div className="text-sm text-gray-300 mb-2">
                            <strong className="text-seguranca-lightgray">Descrição da Lesão:</strong>
                            <p className="mt-1">{accident.injuryDescription}</p>
                          </div>
                        )}
                        
                        {accident.investigationNotes && (
                          <div className="text-sm text-gray-300 mb-2">
                            <strong className="text-seguranca-lightgray">Notas de Investigação:</strong>
                            <p className="mt-1">{accident.investigationNotes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/rh/sst/acidentes/${accident.id}`)}
                          className="border-gray-600 text-seguranca-lightgray"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAccident(accident.id)}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-seguranca-lightgray">Nenhum acidente encontrado</p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Clique em "Novo Acidente" para registrar o primeiro acidente'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Criação */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-seguranca-graphite border-gray-600 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                Novo Registro de Acidente
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="employeeId" className="text-seguranca-lightgray">
                  Funcionário *
                </Label>
                <Select 
                  value={createForm.employeeId} 
                  onValueChange={(value) => setCreateForm({...createForm, employeeId: value})}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="accidentType" className="text-seguranca-lightgray">
                  Tipo de Acidente *
                </Label>
                <Select 
                  value={createForm.accidentType} 
                  onValueChange={(value) => setCreateForm({...createForm, accidentType: value})}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="SEM_AFASTAMENTO" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Sem Afastamento</SelectItem>
                    <SelectItem value="COM_AFASTAMENTO" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Com Afastamento</SelectItem>
                    <SelectItem value="MORTAL" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Mortal</SelectItem>
                    <SelectItem value="TRAJETO" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Trajeto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="accidentDate" className="text-seguranca-lightgray">
                  Data do Acidente *
                </Label>
                <Input
                  id="accidentDate"
                  type="datetime-local"
                  value={createForm.accidentDate}
                  onChange={(e) => setCreateForm({...createForm, accidentDate: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div>
                <Label htmlFor="location" className="text-seguranca-lightgray">
                  Local do Acidente *
                </Label>
                <Input
                  id="location"
                  placeholder="Ex: Posto de trabalho, área externa..."
                  value={createForm.location}
                  onChange={(e) => setCreateForm({...createForm, location: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-seguranca-lightgray">
                  Descrição do Acidente *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente o que aconteceu..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="injuryDescription" className="text-seguranca-lightgray">
                  Descrição da Lesão
                </Label>
                <Textarea
                  id="injuryDescription"
                  placeholder="Descreva as lesões sofridas..."
                  value={createForm.injuryDescription}
                  onChange={(e) => setCreateForm({...createForm, injuryDescription: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="catNumber" className="text-seguranca-lightgray">
                  Número da CAT
                </Label>
                <Input
                  id="catNumber"
                  placeholder="Número da Comunicação de Acidente de Trabalho"
                  value={createForm.catNumber}
                  onChange={(e) => setCreateForm({...createForm, catNumber: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAccident}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                Registrar Acidente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default Acidentes;

