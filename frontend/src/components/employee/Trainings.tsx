import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  Calendar, 
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Users,
  PlayCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: number;
  startDate: string;
  endDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'EXPIRING';
  completionDate?: string;
  certificateUrl?: string;
  isMandatory: boolean;
  nextRenewalDate?: string;
  progress: number;
}

import { trainingService } from '@/services/trainingService';

const Trainings: React.FC = () => {
  const { toast } = useToast();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    setLoading(true);
    try {
      const data = await trainingService.getAllTrainings();
      if (Array.isArray(data)) {
        const mapped: Training[] = data.map((t: any) => ({
          id: t.id || String(Math.random()),
          title: t.title || t.titulo || 'Treinamento',
          description: t.description || t.descricao || '',
          category: t.category || t.categoria || 'Geral',
          instructor: t.instructor || t.instrutor || 'Instrutor',
          duration: t.duration || t.duracaoHoras || 0,
          startDate: t.startDate || t.dataInicio || '',
          endDate: t.endDate || t.dataFim || '',
          status: (t.status || 'PENDING') as any,
          completionDate: t.completionDate || t.dataConclusao,
          certificateUrl: t.certificateUrl,
          isMandatory: Boolean(t.isMandatory || t.obrigatorio),
          nextRenewalDate: t.nextRenewalDate || t.proximaRenovacao,
          progress: t.progress || t.progresso || 0
        }));
        setTrainings(mapped);
      } else {
        setTrainings([]);
      }
    } catch (error) {
      console.error('Erro ao carregar treinamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = (training: Training) => {
    if (training.certificateUrl) {
      window.open(training.certificateUrl, '_blank');
    } else {
      toast({
        title: 'Informação',
        description: `Visualizando certificado do treinamento ${training.title}...`,
      });
    }
  };

  const handleViewDetails = (training: Training) => {
    setSelectedTraining(training);
  };

  const handleStartTraining = (training: Training) => {
    toast({
      title: 'Informação',
      description: `Iniciando treinamento: ${training.title}`,
    });
  };

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || training.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || training.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-secondary text-secondary-foreground';
      case 'EXPIRING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Concluído';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'PENDING':
        return 'Pendente';
      case 'EXPIRING':
        return 'A Vencer';
      default:
        return status;
    }
  };

  const calculateStats = () => {
    const completed = trainings.filter(t => t.status === 'COMPLETED').length;
    const inProgress = trainings.filter(t => t.status === 'IN_PROGRESS').length;
    const pending = trainings.filter(t => t.status === 'PENDING').length;
    const expiring = trainings.filter(t => t.status === 'EXPIRING').length;
    
    return { completed, inProgress, pending, expiring };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treinamentos</h1>
          <p className="text-muted-foreground">Acompanhe seus treinamentos e certificações</p>
        </div>
        <Button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white">
          <BookOpen className="h-4 w-4" />
          <span>Novo Treinamento</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Treinamentos finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Em progresso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando início</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Vencer</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
            <p className="text-xs text-muted-foreground">Renovação necessária</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Filter className="h-5 w-5 mr-2 text-red-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar treinamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="COMPLETED">Concluídos</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="EXPIRING">A Vencer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="Segurança">Segurança</SelectItem>
                <SelectItem value="Saúde">Saúde</SelectItem>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Soft Skills">Soft Skills</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trainings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-red-500" />
            Meus Treinamentos ({filteredTrainings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTrainings.map((training) => (
              <div key={training.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-red-500" />
                    <div>
                      <h3 className="font-medium text-foreground">{training.title}</h3>
                      <p className="text-sm text-muted-foreground">{training.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{training.instructor}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{training.duration}h</span>
                        </span>
                        {training.isMandatory && (
                          <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-3">
                    <Badge className={getStatusColor(training.status)}>
                      {getStatusLabel(training.status)}
                    </Badge>
                    {training.progress > 0 && training.progress < 100 && (
                      <div className="flex items-center space-x-2 flex-1 max-w-xs">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${training.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">{training.progress}%</span>
                      </div>
                    )}
                    {training.nextRenewalDate && (
                      <span className="text-xs text-muted-foreground">
                        Renovação: {new Date(training.nextRenewalDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(training)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Detalhes</span>
                  </Button>
                  {training.status === 'COMPLETED' && (
                    <Button
                      size="sm"
                      onClick={() => handleViewCertificate(training)}
                      className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Award className="h-4 w-4" />
                      <span>Certificado</span>
                    </Button>
                  )}
                  {(training.status === 'PENDING' || training.status === 'IN_PROGRESS') && (
                    <Button
                      size="sm"
                      onClick={() => handleStartTraining(training)}
                      className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>Continuar</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredTrainings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Nenhum treinamento encontrado</p>
                <p className="text-sm">Tente ajustar os filtros</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedTraining && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center justify-between">
              <span>Detalhes do Treinamento - {selectedTraining.title}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTraining(null)}
              >
                Fechar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">Informações Gerais</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Título:</span>
                    <span className="font-medium">{selectedTraining.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="font-medium">{selectedTraining.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <Badge variant="outline">{selectedTraining.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instrutor:</span>
                    <span className="font-medium">{selectedTraining.instructor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração:</span>
                    <span className="font-medium">{selectedTraining.duration} horas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(selectedTraining.status)}>
                      {getStatusLabel(selectedTraining.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-3">Datas e Progresso</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Início:</span>
                    <span className="font-medium">{new Date(selectedTraining.startDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Término:</span>
                    <span className="font-medium">{new Date(selectedTraining.endDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {selectedTraining.completionDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data de Conclusão:</span>
                      <span className="font-medium">{new Date(selectedTraining.completionDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {selectedTraining.nextRenewalDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Próxima Renovação:</span>
                      <span className="font-medium">{new Date(selectedTraining.nextRenewalDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Progresso:</span>
                    <span className="font-medium">{selectedTraining.progress}%</span>
                  </div>
                </div>
                
                {selectedTraining.progress > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{selectedTraining.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${selectedTraining.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              {selectedTraining.status === 'COMPLETED' && (
                <Button
                  onClick={() => handleViewCertificate(selectedTraining)}
                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Award className="h-4 w-4" />
                  <span>Baixar Certificado</span>
                </Button>
              )}
              {(selectedTraining.status === 'PENDING' || selectedTraining.status === 'IN_PROGRESS') && (
                <Button
                  onClick={() => handleStartTraining(selectedTraining)}
                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Iniciar Treinamento</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Trainings;
