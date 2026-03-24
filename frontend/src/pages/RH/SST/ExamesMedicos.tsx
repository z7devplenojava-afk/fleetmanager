import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sstService, MedicalExam, CreateMedicalExamDTO } from '@/services/sstService';
import { useToast } from '@/hooks/use-toast';
import MedicalExamFormModal from '@/components/sst/MedicalExamFormModal';

const ExamesMedicos: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Estados para modal de criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<MedicalExam | null>(null);

  // Carregar exames
  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sstService.getMedicalExams();
      setExams(data);
    } catch (err) {
      console.error('Erro ao carregar exames médicos:', err);
      setError('Erro ao carregar exames médicos');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os exames médicos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar exames
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.examType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || exam.examCategory === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Criar/Atualizar exame
  const handleSubmitExam = async (data: CreateMedicalExamDTO) => {
    try {
      if (selectedExam) {
        await sstService.updateMedicalExam(selectedExam.id, data);
        toast({
          title: "Sucesso",
          description: "Exame médico atualizado com sucesso",
        });
      } else {
        await sstService.createMedicalExam(data);
        toast({
          title: "Sucesso",
          description: "Exame médico criado com sucesso",
        });
      }
      
      setShowCreateModal(false);
      setSelectedExam(null);
      loadExams();
    } catch (err) {
      console.error('Erro ao salvar exame médico:', err);
      toast({
        title: "Erro",
        description: selectedExam ? "Não foi possível atualizar o exame médico" : "Não foi possível criar o exame médico",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Abrir modal para edição
  const handleEditExam = (exam: MedicalExam) => {
    setSelectedExam(exam);
    setShowCreateModal(true);
  };

  // Atualizar status do exame
  const handleUpdateExamStatus = async (examId: string, status: string) => {
    try {
      await sstService.updateMedicalExam(examId, { status: status as any });
      toast({
        title: "Sucesso",
        description: "Status do exame atualizado com sucesso",
      });
      loadExams();
    } catch (err) {
      console.error('Erro ao atualizar status do exame:', err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do exame",
        variant: "destructive",
      });
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REALIZADO':
        return 'bg-green-100 text-green-800';
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ATRASADO':
        return 'bg-red-100 text-red-800';
      case 'CANCELADO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Obter cor da categoria
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ADMISSIONAL':
        return 'bg-blue-100 text-blue-800';
      case 'PERIODICO':
        return 'bg-green-100 text-green-800';
      case 'RETORNO':
        return 'bg-yellow-100 text-yellow-800';
      case 'MUDANCA_FUNCAO':
        return 'bg-purple-100 text-purple-800';
      case 'DEMISSIONAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Stethoscope className="h-8 w-8 animate-pulse text-seguranca-yellow" />
            <p className="text-seguranca-lightgray">Carregando exames médicos...</p>
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
              onClick={loadExams}
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
              <Stethoscope className="h-8 w-8 text-seguranca-yellow" />
              Exames Médicos
            </h1>
            <p className="text-gray-400 mt-1">Gestão de Atestados de Saúde Ocupacional (ASO)</p>
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
              onClick={() => {
                setSelectedExam(null);
                setShowCreateModal(true);
              }}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Exame
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
                    placeholder="Funcionário, tipo de exame, médico..."
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
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="REALIZADO">Realizado</SelectItem>
                    <SelectItem value="ATRASADO">Atrasado</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category" className="text-seguranca-lightgray">Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ADMISSIONAL">Admissional</SelectItem>
                    <SelectItem value="PERIODICO">Periódico</SelectItem>
                    <SelectItem value="RETORNO">Retorno</SelectItem>
                    <SelectItem value="MUDANCA_FUNCAO">Mudança de Função</SelectItem>
                    <SelectItem value="DEMISSIONAL">Demissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Exames */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              Exames Médicos ({filteredExams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExams.length > 0 ? (
              <div className="space-y-4">
                {filteredExams.map((exam) => (
                  <div key={exam.id} className="p-4 bg-seguranca-black rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-seguranca-lightgray">
                            {exam.employeeName}
                          </h3>
                          <Badge className={getStatusColor(exam.status)}>
                            {exam.status}
                          </Badge>
                          <Badge className={getCategoryColor(exam.examCategory)}>
                            {exam.examCategory}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            <span>{exam.examType}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {exam.scheduledDate ? new Date(exam.scheduledDate).toLocaleDateString('pt-BR') : 'Não agendado'}
                            </span>
                          </div>
                          
                          {exam.doctorName && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{exam.doctorName}</span>
                            </div>
                          )}
                        </div>
                        
                        {exam.notes && (
                          <p className="text-sm text-gray-400 mt-2">{exam.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {exam.status === 'PENDENTE' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateExamStatus(exam.id, 'REALIZADO')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Realizar
                          </Button>
                        )}
                        
                        {exam.status === 'PENDENTE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateExamStatus(exam.id, 'CANCELADO')}
                            className="border-gray-600 text-seguranca-lightgray"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditExam(exam)}
                          className="border-gray-600 text-seguranca-lightgray"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-seguranca-lightgray">Nenhum exame médico encontrado</p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Clique em "Novo Exame" para criar o primeiro exame'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Criação/Edição */}
        <MedicalExamFormModal
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) {
              setSelectedExam(null);
            }
          }}
          exam={selectedExam}
          onSubmit={handleSubmitExam}
        />
      </div>
    </StandardLayout>
  );
};

export default ExamesMedicos;

