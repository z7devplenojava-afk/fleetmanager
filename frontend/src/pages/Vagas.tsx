import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Target,
  TrendingUp,
  FileText,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JobVacancy, VacancyStatus } from '@/types/hr';
import hrService from '@/services/hrService';
import { StandardLayout } from '@/components/StandardLayout';
import { CandidateFormModal } from '@/components/vagas/CandidateFormModal';
import { CandidatesTable } from '@/components/vagas/CandidatesTable';

const Vagas: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<JobVacancy | null>(null);
  const [activeTab, setActiveTab] = useState('vagas');
  const [formData, setFormData] = useState({
    title: '',
    position: '',
    function: '', // NOVO CAMPO
    requirements: [''],
    workSchedule: '',
    salary: 0,
    benefits: [''],
    deadline: '',
    status: 'OPEN' as VacancyStatus,
    applications: 0,
    requiresCnh: false,
    cnhCategory: '',
    location: ''
  });

  // Definir o estado vazio do formulário
  const emptyForm = {
    title: '',
    position: '',
    function: '',
    requirements: [''],
    workSchedule: '',
    salary: 0,
    benefits: [''],
    deadline: '',
    status: 'OPEN' as VacancyStatus,
    applications: 0,
    requiresCnh: false,
    cnhCategory: '',
    location: ''
  };

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      setLoading(true);
      const data = await hrService.getJobVacancies();
      setVacancies(data);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vagas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    // Validação rápida dos campos obrigatórios
    if (!formData.title || !formData.position || !formData.location || !formData.function || !formData.workSchedule || !formData.deadline || Number(formData.salary) <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e informe um salário maior que zero.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Verificar se já existe uma vaga com o mesmo título
      const existingVacancy = vacancies.find(v => 
        v.title.toLowerCase() === formData.title.toLowerCase()
      );
      
      if (existingVacancy) {
        toast({
          title: "Erro",
          description: "Já existe uma vaga com este título",
          variant: "destructive"
        });
        return;
      }
      
      const deadlineFormatted = formData.deadline.includes('T') ? formData.deadline : formData.deadline + 'T23:59:59';
      const newVacancy = await hrService.createJobVacancy({
        ...formData,
        deadline: deadlineFormatted,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
        applications: 0
      });
      
      setVacancies(prev => [...prev, newVacancy]);
      setShowCreateModal(false);
      resetForm();
      
      toast({
        title: "Sucesso",
        description: "Vaga criada com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao criar vaga:', error);
      
      // Tratar erro específico de título duplicado
      if (error.response?.data?.message?.includes('Já existe uma vaga com o título')) {
        toast({
          title: "Erro",
          description: "Já existe uma vaga com este título",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar vaga",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpdate = async () => {
    if (!selectedVacancy) return;
    if (!formData.title || !formData.position || !formData.location || !formData.function || !formData.workSchedule || !formData.deadline || Number(formData.salary) <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e informe um salário maior que zero.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Verificar se já existe outra vaga com o mesmo título (ignorando a atual)
      const existingVacancy = vacancies.find(v => 
        v.id !== selectedVacancy.id && 
        v.title.toLowerCase() === formData.title.toLowerCase()
      );
      
      if (existingVacancy) {
        toast({
          title: "Erro",
          description: "Já existe uma vaga com este título",
          variant: "destructive"
        });
        return;
      }
      
      const deadlineFormatted = formData.deadline.includes('T') ? formData.deadline : formData.deadline + 'T23:59:59';
      const updatedVacancy = await hrService.updateJobVacancy(selectedVacancy.id, {
        ...formData,
        deadline: deadlineFormatted,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
        applications: selectedVacancy.applications
      });
      
      setVacancies(prev => prev.map(v => v.id === selectedVacancy.id ? updatedVacancy : v));
      setShowEditModal(false);
      resetForm();
      
      toast({
        title: "Sucesso",
        description: "Vaga atualizada com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao atualizar vaga:', error);
      
      // Tratar erro específico de título duplicado
      if (error.response?.data?.message?.includes('Já existe uma vaga com o título')) {
        toast({
          title: "Erro",
          description: "Já existe uma vaga com este título",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar vaga",
          variant: "destructive"
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedVacancy) return;
    
    console.log('🔍 [DEBUG] Tentando excluir vaga:', selectedVacancy.id, selectedVacancy.title);
    
    try {
      await hrService.deleteJobVacancy(selectedVacancy.id);
      console.log('✅ [DEBUG] Vaga excluída com sucesso via API');
      
      setVacancies(prev => prev.filter(v => v.id !== selectedVacancy.id));
      setShowDeleteDialog(false);
      
      toast({
        title: "Sucesso",
        description: "Vaga excluída com sucesso"
      });
    } catch (error: any) {
      console.error('❌ DEBUG] Erro detalhado ao excluir vaga:', error);
      console.error('❌ [DEBUG] Response status:', error.response?.status);
      console.error('❌ [DEBUG] Response data:', error.response?.data);
      
      let errorMessage = "Erro ao excluir vaga";
      
      if (error.response?.status === 403) {
        errorMessage = "Sem permissão para excluir vagas";
      } else if (error.response?.status === 404) {
        errorMessage = "Vaga não encontrada";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      position: '',
      function: '', // NOVO CAMPO
      requirements: [''],
      workSchedule: '',
      salary: 0,
      benefits: [''],
      deadline: '',
      status: 'OPEN' as VacancyStatus,
      applications: 0,
      requiresCnh: false,
      cnhCategory: '',
      location: ''
    });
    setSelectedVacancy(null);
  };

  const openEditModal = (vacancy: JobVacancy) => {
    setSelectedVacancy(vacancy);
    setFormData({
      title: vacancy.title,
      position: vacancy.position,
      function: vacancy.function || '', // NOVO CAMPO
      requirements: vacancy.requirements.length > 0 ? vacancy.requirements : [''],
      workSchedule: vacancy.workSchedule,
      salary: vacancy.salary,
      benefits: vacancy.benefits.length > 0 ? vacancy.benefits : [''],
      deadline: vacancy.deadline,
      status: vacancy.status,
      applications: vacancy.applications,
      requiresCnh: vacancy.requiresCnh,
      cnhCategory: vacancy.cnhCategory,
      location: vacancy.location
    });
    setShowEditModal(true);
  };

  const openViewModal = (vacancy: JobVacancy) => {
    setSelectedVacancy(vacancy);
    setShowViewModal(true);
  };

  const openDeleteDialog = (vacancy: JobVacancy) => {
    setSelectedVacancy(vacancy);
    setShowDeleteDialog(true);
  };

  const openCandidateModal = (vacancy: JobVacancy) => {
    setSelectedVacancy(vacancy);
    setShowCandidateModal(true);
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => i === index ? value : benefit)
    }));
  };

  const getStatusColor = (status: VacancyStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-500 text-white';
      case 'CLOSED':
        return 'bg-red-500 text-white';
      case 'PAUSED':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: VacancyStatus) => {
    switch (status) {
      case 'OPEN':
        return 'Aberta';
      case 'CLOSED':
        return 'Fechada';
      case 'PAUSED':
        return 'Pausada';
      default:
        return status;
    }
  };

  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacancy.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacancy.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vacancy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Estatísticas
  const totalVacancies = vacancies.length;
  const openVacancies = vacancies.filter(v => v.status === 'OPEN').length;
  const totalApplications = vacancies.reduce((sum, v) => sum + v.applications, 0);
  const averageSalary = vacancies.length > 0 ? vacancies.reduce((sum, v) => sum + v.salary, 0) / vacancies.length : 0;

  console.log('[DEBUG] activeTab:', activeTab);

  return (
    <StandardLayout title="Gestão de Vagas">
      <div className="space-y-6">
        {/* Header com estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Vagas</p>
                  <p className="text-2xl font-bold text-seguranca-yellow">{totalVacancies}</p>
                </div>
                <FileText className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Vagas Abertas</p>
                  <p className="text-2xl font-bold text-seguranca-yellow">{openVacancies}</p>
                </div>
                <Target className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Candidaturas</p>
                  <p className="text-2xl font-bold text-seguranca-yellow">{totalApplications}</p>
                </div>
                <Users className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Salário Médio</p>
                  <p className="text-2xl font-bold text-seguranca-yellow">
                    {formatCurrency(averageSalary)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header com título e ações */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Gestão de Vagas</h1>
            <p className="text-gray-400 mt-1">Gerencie vagas de emprego e candidaturas</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setFormData(emptyForm);
                setShowCreateModal(true);
              }}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Vaga
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-seguranca-graphite border border-gray-600">
            <TabsTrigger 
              value="vagas" 
              className="data-[state=active]:bg-seguranca-red data-[state=active]:text-white text-seguranca-lightgray"
            >
              <FileText className="h-4 w-4 mr-2" />
              Vagas
            </TabsTrigger>
            <TabsTrigger 
              value="candidatos" 
              className="data-[state=active]:bg-seguranca-red data-[state=active]:text-white text-seguranca-lightgray"
            >
              <Users className="h-4 w-4 mr-2" />
              Candidatos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vagas" className="space-y-6">
            {/* Filtros */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por título, cargo ou localização..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="OPEN">Aberta</SelectItem>
                      <SelectItem value="CLOSED">Fechada</SelectItem>
                      <SelectItem value="PAUSED">Pausada</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                  >
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Vagas */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-seguranca-lightgray whitespace-nowrap">Vaga</TableHead>
                        <TableHead className="text-seguranca-lightgray whitespace-nowrap">Localização</TableHead>
                        <TableHead className="text-seguranca-lightgray whitespace-nowrap hidden sm:table-cell">Salário</TableHead>
                        <TableHead className="text-seguranca-lightgray whitespace-nowrap hidden md:table-cell">Candidaturas</TableHead>
                        <TableHead className="text-seguranca-lightgray whitespace-nowrap hidden md:table-cell">Prazo</TableHead>
                        <TableHead className="text-seguranca-lightgray whitespace-nowrap hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-seguranca-lightgray text-right whitespace-nowrap">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVacancies.map((vacancy) => (
                        <TableRow key={vacancy.id} className="border-gray-700">
                          <TableCell className="whitespace-nowrap">{vacancy.title}</TableCell>
                          <TableCell className="whitespace-nowrap">{vacancy.location}</TableCell>
                          <TableCell className="whitespace-nowrap hidden sm:table-cell">{formatCurrency(vacancy.salary)}</TableCell>
                          <TableCell className="whitespace-nowrap hidden md:table-cell">{vacancy.applications}</TableCell>
                          <TableCell className="whitespace-nowrap hidden md:table-cell">{formatDate(vacancy.deadline)}</TableCell>
                          <TableCell className="whitespace-nowrap hidden sm:table-cell">
                            <Badge className={getStatusColor(vacancy.status)}>
                              {getStatusText(vacancy.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewModal(vacancy)}
                                title="Visualizar Vaga"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(vacancy)}
                                title="Editar Vaga"
                                className="text-green-600 hover:text-green-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openCandidateModal(vacancy)}
                                title="Ver Candidatos"
                                className="text-purple-600 hover:text-purple-700"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(vacancy)}
                                title="Excluir Vaga"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidatos" className="space-y-6">
            <CandidatesTable />
          </TabsContent>

          {/* Modal de Lista de Candidatos da Vaga */}
          <Dialog open={showCandidateModal} onOpenChange={setShowCandidateModal}>
            <DialogContent className="w-full max-w-[98vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-2 sm:p-4">
              {selectedVacancy && selectedVacancy.id && (
                <CandidatesTable vacancyId={selectedVacancy.id} vacancyTitle={selectedVacancy.title} />
              )}
              {(!selectedVacancy || !selectedVacancy.id) && (
                <div className="text-red-500 font-bold">ID da vaga não definido. Não é possível listar candidatos.</div>
              )}
            </DialogContent>
          </Dialog>
        </Tabs>

        {/* Modal de Criação */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray">Nova Vaga</DialogTitle>
              <DialogDescription className="text-gray-400">
                Preencha os dados para criar uma nova vaga
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="title" className="text-seguranca-lightgray">Título da Vaga *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="position" className="text-seguranca-lightgray">Cargo *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="function" className="text-seguranca-lightgray">Função *</Label>
                <Input
                  id="function"
                  value={formData.function}
                  onChange={(e) => setFormData({...formData, function: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  placeholder="Descreva a função principal da vaga"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-seguranca-lightgray">Localização *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="workSchedule" className="text-seguranca-lightgray">Jornada de Trabalho *</Label>
                <Input
                  id="workSchedule"
                  value={formData.workSchedule}
                  onChange={(e) => setFormData({...formData, workSchedule: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  placeholder="Ex: 8h/dia, 12x36"
                />
              </div>
              <div>
                <Label htmlFor="salary" className="text-seguranca-lightgray">Salário (R$) *</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="deadline" className="text-seguranca-lightgray">Prazo de Inscrição *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline && !isNaN(Date.parse(formData.deadline)) ? formData.deadline.split('T')[0] : ''}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>

            {/* Requisitos */}
            <div className="mt-6">
              <Label className="text-seguranca-lightgray">Requisitos</Label>
              <div className="space-y-3">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray flex-1"
                      placeholder="Digite um requisito"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRequirement(index)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-1 sm:mr-0" />
                      <span className="sm:hidden">Remover</span>
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRequirement}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Requisito
                </Button>
              </div>
            </div>

            {/* Benefícios */}
            <div className="mt-6">
              <Label className="text-seguranca-lightgray">Benefícios</Label>
              <div className="space-y-3">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray flex-1"
                      placeholder="Digite um benefício"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-1 sm:mr-0" />
                      <span className="sm:hidden">Remover</span>
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBenefit}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Benefício
                </Button>
              </div>
            </div>

            {/* Exige CNH */}
            <div className="mt-6">
              <Label className="text-seguranca-lightgray">Exige CNH?</Label>
              <Select
                value={formData.requiresCnh ? 'sim' : 'nao'}
                onValueChange={val => setFormData({ ...formData, requiresCnh: val === 'sim', cnhCategory: val === 'sim' ? formData.cnhCategory : '' })}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
              {formData.requiresCnh && (
                <div>
                  <Label htmlFor="cnhCategory" className="text-seguranca-lightgray">Categoria da CNH</Label>
                  <Input
                    id="cnhCategory"
                    value={formData.cnhCategory || ''}
                    onChange={e => setFormData({ ...formData, cnhCategory: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Ex: A, B, AB, C, D, E"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto"
              >
                Criar Vaga
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray">Editar Vaga</DialogTitle>
              <DialogDescription className="text-gray-400">
                Atualize os dados da vaga
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-title" className="text-seguranca-lightgray">Título da Vaga *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="edit-position" className="text-seguranca-lightgray">Cargo *</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="edit-function" className="text-seguranca-lightgray">Função *</Label>
                <Input
                  id="edit-function"
                  value={formData.function}
                  onChange={(e) => setFormData({...formData, function: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="edit-location" className="text-seguranca-lightgray">Localização *</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="edit-workSchedule" className="text-seguranca-lightgray">Jornada de Trabalho *</Label>
                <Input
                  id="edit-workSchedule"
                  value={formData.workSchedule}
                  onChange={(e) => setFormData({...formData, workSchedule: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="edit-salary" className="text-seguranca-lightgray">Salário (R$) *</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="edit-deadline" className="text-seguranca-lightgray">Prazo de Inscrição *</Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={formData.deadline && !isNaN(Date.parse(formData.deadline)) ? formData.deadline.split('T')[0] : ''}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label htmlFor="edit-status" className="text-seguranca-lightgray">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={val => setFormData({ ...formData, status: val as VacancyStatus })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Aberta</SelectItem>
                    <SelectItem value="CLOSED">Fechada</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Exige CNH?</Label>
                <Select
                  value={formData.requiresCnh ? 'sim' : 'nao'}
                  onValueChange={val => setFormData({ ...formData, requiresCnh: val === 'sim', cnhCategory: val === 'sim' ? formData.cnhCategory : '' })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.requiresCnh && (
                <div>
                  <Label htmlFor="edit-cnhCategory" className="text-seguranca-lightgray">Categoria da CNH</Label>
                  <Input
                    id="edit-cnhCategory"
                    value={formData.cnhCategory || ''}
                    onChange={e => setFormData({ ...formData, cnhCategory: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Ex: A, B, AB, C, D, E"
                  />
                </div>
              )}
            </div>

            {/* Requisitos */}
            <div className="mt-6">
              <Label className="text-seguranca-lightgray">Requisitos</Label>
              <div className="space-y-3">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRequirement(index)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-1 sm:mr-0" />
                      <span className="sm:hidden">Remover</span>
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRequirement}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Requisito
                </Button>
              </div>
            </div>

            {/* Benefícios */}
            <div className="mt-6">
              <Label className="text-seguranca-lightgray">Benefícios</Label>
              <div className="space-y-3">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-1 sm:mr-0" />
                      <span className="sm:hidden">Remover</span>
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBenefit}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Benefício
                </Button>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdate}
                className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto"
              >
                Atualizar Vaga
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Visualização */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray">
                {selectedVacancy?.title}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Detalhes da vaga
              </DialogDescription>
            </DialogHeader>
            
            {selectedVacancy && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 text-sm">Função</Label>
                    <p className="text-seguranca-lightgray">{selectedVacancy.function}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Localização</Label>
                    <p className="text-seguranca-lightgray">{selectedVacancy.location}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Jornada</Label>
                    <p className="text-seguranca-lightgray">{selectedVacancy.workSchedule}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Salário</Label>
                    <p className="text-seguranca-lightgray">{formatCurrency(selectedVacancy.salary)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Candidatos</Label>
                    <p className="text-seguranca-lightgray">{selectedVacancy.applications}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Status</Label>
                    <Badge className={getStatusColor(selectedVacancy.status)}>
                      {getStatusText(selectedVacancy.status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Prazo</Label>
                    <p className="text-seguranca-lightgray">{formatDate(selectedVacancy.deadline)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Requisitos</Label>
                  <ul className="text-seguranca-lightgray mt-1 space-y-1">
                    {selectedVacancy.requirements.map((req, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="break-words">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Benefícios</Label>
                  <ul className="text-seguranca-lightgray mt-1 space-y-1">
                    {selectedVacancy.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="break-words">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button
                onClick={() => setShowViewModal(false)}
                className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-seguranca-graphite border-gray-600 w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray">Confirmar Exclusão</DialogTitle>
              <DialogDescription className="text-gray-400">
                Tem certeza que deseja excluir a vaga "{selectedVacancy?.title}"? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default Vagas; 