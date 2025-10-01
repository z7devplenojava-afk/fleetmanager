import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import EmployeeTrainingFormModal from './EmployeeTrainingFormModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Building, 
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';
import { trainingService, EmployeeCertification } from '@/services/trainingService';
import { useToast } from '@/hooks/use-toast';

// Estrutura local da linha para a UI
type TrainingRow = {
  id: string;
  employee: string;
  cpf?: string;
  position?: string;
  sector?: string;
  workSchedule?: string;
  validUntil: string;
  status: 'valid' | 'expiring' | 'expired';
  lastUpdate?: string;
  trainingType: string;
  instructor?: string;
  hours?: number;
};

const mockTrainings: TrainingRow[] = [
  {
    id: 1,
    employee: 'João Silva',
    cpf: '123.456.789-00',
    position: 'Vigilante',
    sector: 'Posto 1',
    workSchedule: '07:00-19:00',
    validUntil: '2026-07-20',
    asoDate: '2025-07-20',
    psicotecnicoDate: '2025-07-20',
    status: 'valid',
    lastUpdate: '2025-01-15',
    trainingType: 'NR-33',
    instructor: 'Carlos Santos',
    hours: 40,
  },
  {
    id: 2,
    employee: 'Maria Souza',
    cpf: '987.654.321-00',
    position: 'Porteiro',
    sector: 'Posto 2',
    workSchedule: '19:00-07:00',
    validUntil: '2025-12-10',
    asoDate: '',
    psicotecnicoDate: '',
    status: 'expiring',
    lastUpdate: '2025-01-10',
    trainingType: 'NR-35',
    instructor: 'Ana Paula',
    hours: 32,
  },
  {
    id: 3,
    employee: 'Pedro Costa',
    cpf: '111.222.333-44',
    position: 'Supervisor',
    sector: 'Administrativo',
    workSchedule: '08:00-18:00',
    validUntil: '2024-11-15',
    asoDate: '2024-11-15',
    psicotecnicoDate: '2024-11-15',
    status: 'expired',
    lastUpdate: '2024-11-15',
    trainingType: 'NR-10',
    instructor: 'Roberto Lima',
    hours: 48,
  },
  {
    id: 4,
    employee: 'Ana Santos',
    cpf: '555.666.777-88',
    position: 'Vigilante',
    sector: 'Posto 3',
    workSchedule: '06:00-18:00',
    validUntil: '2027-03-20',
    asoDate: '2025-03-20',
    psicotecnicoDate: '2025-03-20',
    status: 'valid',
    lastUpdate: '2025-01-20',
    trainingType: 'NR-33',
    instructor: 'Carlos Santos',
    hours: 40,
  },
];

const trainingTypes = [
  'NR-33 (Espaços Confinados)',
  'NR-35 (Trabalho em Altura)',
  'NR-10 (Instalações Elétricas)',
  'NR-11 (Transporte de Cargas)',
  'NR-12 (Máquinas e Equipamentos)',
  'NR-13 (Caldeiras e Vasos de Pressão)',
  'NR-20 (Líquidos Combustíveis)',
  'NR-23 (Proteção Contra Incêndios)',
  'NR-26 (Sinalização de Segurança)',
  'NR-29 (Trabalho Portuário)',
  'NR-34 (Condições e Meio Ambiente)',
  'NR-36 (Abate e Processamento)',
  'Primeiros Socorros',
  'Combate a Incêndio',
  'Uso de EPI',
  'Outros',
];

const EmployeeTrainingTab = () => {
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [trainings, setTrainings] = useState<TrainingRow[]>(mockTrainings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [trainingTypeFilter, setTrainingTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Buscar certificações de funcionários (histórico de treinamentos concluídos)
        const certs: EmployeeCertification[] = await trainingService.getEmployeeCertifications();
        const rows: TrainingRow[] = certs.map(c => {
          const validUntil = c.expirationDate || '';
          const status = getTrainingStatus(validUntil);
          return {
            id: c.id,
            employee: (c as any).employee?.name || (c as any).employee?.id || 'Funcionário',
            validUntil,
            status,
            trainingType: c.training?.name || 'Treinamento',
            hours: c.training?.duration,
          };
        });
        setTrainings(rows);
      } catch (e) {
        toast({ title: 'Erro', description: 'Falha ao carregar treinamentos.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Calcular estatísticas
  const getStats = () => {
    const total = trainings.length;
    const valid = trainings.filter(t => t.status === 'valid').length;
    const expiring = trainings.filter(t => t.status === 'expiring').length;
    const expired = trainings.filter(t => t.status === 'expired').length;
    
    return { total, valid, expiring, expired };
  };

  // Verificar status do treinamento
  const getTrainingStatus = (validUntil: string) => {
    const today = new Date();
    const validDate = new Date(validUntil);
    const daysUntilExpiry = Math.ceil((validDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'valid';
  };

  // Filtrar treinamentos
  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.cpf.includes(searchTerm) ||
                         training.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || training.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || training.position === positionFilter;
    const matchesTrainingType = trainingTypeFilter === 'all' || training.trainingType === trainingTypeFilter;
    
    return matchesSearch && matchesStatus && matchesPosition && matchesTrainingType;
  });

  const handleAdd = () => {
    setEditData(null);
    setOpen(true);
  };

  const handleEdit = (training: any) => {
    setEditData(training);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este treinamento?')) {
      setTrainings(trainings.filter(t => t.id !== id));
    }
  };

  // Salvar novo ou editar
  const handleSave = (data: any) => {
    if (data.id) {
      setTrainings(trainings.map(t => t.id === data.id ? data : t));
    } else {
      setTrainings([...trainings, { ...data, id: Date.now() }]);
    }
    setOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800">Válido</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800">Expirando</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expirado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Dashboard de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Total</p>
                <p className="text-2xl font-bold text-seguranca-lightgray">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Válidos</p>
                <p className="text-2xl font-bold text-green-500">{stats.valid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Expirando</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.expiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-seguranca-lightgray">Expirados</p>
                <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-seguranca-lightgray">
            <div className="flex items-center gap-2 ">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </div>
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Treinamento
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Funcionário, CPF ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="valid">Válidos</SelectItem>
                  <SelectItem value="expiring">Expirando</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Cargo</Label>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cargos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  <SelectItem value="Vigilante">Vigilante</SelectItem>
                  <SelectItem value="Porteiro">Porteiro</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Tipo de Treinamento</Label>
              <Select value={trainingTypeFilter} onValueChange={setTrainingTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {trainingTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Treinamentos */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <FileText className="h-5 w-5" />
            Treinamentos ({filteredTrainings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-6 text-seguranca-lightgray">Carregando...</div>
          )}
          <div className="overflow-x-auto">
            {/* Tabela Desktop */}
            <table className="min-w-full border text-sm hidden md:table">
              <thead>
                <tr className="bg-seguranca-black text-seguranca-lightgray">
                  <th className="px-3 py-2 border text-left">Funcionário</th>
                  <th className="px-3 py-2 border text-left">Cargo</th>
                  <th className="px-3 py-2 border text-left">Setor</th>
                  <th className="px-3 py-2 border text-left">Treinamento</th>
                  <th className="px-3 py-2 border text-left">Validade</th>
                  <th className="px-3 py-2 border text-left">Status</th>
                  <th className="px-3 py-2 border text-left">Instrutor</th>
                  <th className="px-3 py-2 border text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-seguranca-lightgray">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <p>Nenhum treinamento encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros de busca</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTrainings.map(t => (
                    <tr key={t.id} className="border-b hover:bg-seguranca-black/40">
                      <td className="px-3 py-3 border">
                        <div>
                          <div className="font-medium text-seguranca-lightgray">{t.employee}</div>
                          <div className="text-xs text-seguranca-lightgray/70">{t.cpf}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border">{t.position}</td>
                      <td className="px-3 py-3 border">{t.sector}</td>
                      <td className="px-3 py-3 border">
                        <div>
                          <div className="font-medium text-seguranca-lightgray">{t.trainingType}</div>
                          <div className="text-xs text-seguranca-lightgray/70">{t.hours}h</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border">
                        <div>
                          <div className="text-seguranca-lightgray">{new Date(t.validUntil).toLocaleDateString('pt-BR')}</div>
                          <div className="text-xs text-seguranca-lightgray/70">
                            {Math.ceil((new Date(t.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(t.status)}
                          {getStatusBadge(t.status)}
                        </div>
                      </td>
                      <td className="px-3 py-3 border">{t.instructor}</td>
                      <td className="px-3 py-3 border">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(t)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Cards Mobile */}
            <div className="flex flex-col gap-4 md:hidden">
              {filteredTrainings.length === 0 ? (
                <div className="text-center py-8 text-seguranca-lightgray">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum treinamento encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros de busca</p>
                </div>
              ) : (
                filteredTrainings.map(t => (
                  <Card key={t.id} className="p-4 bg-seguranca-graphite border-gray-600">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-seguranca-lightgray">{t.employee}</h3>
                        <p className="text-sm text-seguranca-lightgray/70">{t.cpf}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(t.status)}
                        {getStatusBadge(t.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="text-seguranca-lightgray"><span className="font-medium">Cargo:</span> {t.position}</div>
                      <div className="text-seguranca-lightgray"><span className="font-medium">Setor:</span> {t.sector}</div>
                      <div className="text-seguranca-lightgray"><span className="font-medium">Treinamento:</span> {t.trainingType}</div>
                      <div className="text-seguranca-lightgray"><span className="font-medium">Instrutor:</span> {t.instructor}</div>
                      <div className="text-seguranca-lightgray"><span className="font-medium">Validade:</span> {new Date(t.validUntil).toLocaleDateString('pt-BR')}</div>
                      <div className="text-seguranca-lightgray"><span className="font-medium">Carga Horária:</span> {t.hours}h</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(t)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EmployeeTrainingFormModal open={open} onOpenChange={setOpen} onSave={handleSave} editData={editData} />
    </div>
  );
};

export default EmployeeTrainingTab; 