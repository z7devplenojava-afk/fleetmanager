import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Download,
  Loader2,
  Building2,
  Users as UsersIcon,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { sstService, SSTTraining, CreateSSTTrainingDTO } from '@/services/sstService';
import TrainingFormModal from '@/components/sst/TrainingFormModal';

const SSTTreinamentos: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [trainings, setTrainings] = useState<SSTTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<SSTTraining | null>(null);

  // Carregar treinamentos
  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sstService.getSSTTrainingsWithStats();
      setTrainings(data);
    } catch (err) {
      console.error('Erro ao carregar treinamentos:', err);
      setError('Erro ao carregar treinamentos');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os treinamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar treinamentos
  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (training.provider && training.provider.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || training.trainingType === typeFilter;
    // Para status, vamos filtrar por participantes agendados vs concluídos
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'AGENDADO' && (training.scheduledParticipants || 0) > 0) ||
      (statusFilter === 'CONCLUIDO' && (training.completedParticipants || 0) > 0);
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'NR_35': 'NR-35',
      'CIPA': 'CIPA',
      'NR_10': 'NR-10',
      'BRIGADA_INCENDIO': 'Brigada de Incêndio',
      'NR_33': 'NR-33',
      'NR_12': 'NR-12',
      'PRIMEIROS_SOCORROS': 'Primeiros Socorros',
      'OUTROS': 'Outros'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'NR_35': 'bg-blue-100 text-blue-800',
      'CIPA': 'bg-purple-100 text-purple-800',
      'NR_10': 'bg-yellow-100 text-yellow-800',
      'BRIGADA_INCENDIO': 'bg-red-100 text-red-800',
      'NR_33': 'bg-orange-100 text-orange-800',
      'NR_12': 'bg-indigo-100 text-indigo-800',
      'PRIMEIROS_SOCORROS': 'bg-pink-100 text-pink-800',
      'OUTROS': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Criar/Atualizar treinamento
  const handleSubmitTraining = async (data: CreateSSTTrainingDTO) => {
    try {
      if (selectedTraining) {
        await sstService.updateSSTTraining(selectedTraining.id, data);
        toast({
          title: "Sucesso",
          description: "Treinamento atualizado com sucesso",
        });
      } else {
        await sstService.createSSTTraining(data);
        toast({
          title: "Sucesso",
          description: "Treinamento criado com sucesso",
        });
      }
      
      setShowCreateModal(false);
      setSelectedTraining(null);
      loadTrainings();
    } catch (err) {
      console.error('Erro ao salvar treinamento:', err);
      toast({
        title: "Erro",
        description: selectedTraining ? "Não foi possível atualizar o treinamento" : "Não foi possível criar o treinamento",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Abrir modal para edição
  const handleEditTraining = (training: SSTTraining) => {
    setSelectedTraining(training);
    setShowCreateModal(true);
  };

  return (
    <StandardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-seguranca-yellow" />
              Treinamentos SST
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Gestão de treinamentos de Saúde e Segurança do Trabalho</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/rh/sst')}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black text-sm sm:text-base"
            >
              Voltar
            </Button>
            <Button 
              onClick={() => {
                setSelectedTraining(null);
                setShowCreateModal(true);
              }}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Treinamento
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-seguranca-graphite border-gray-600">
            <TabsTrigger value="all" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              Todos
            </TabsTrigger>
            <TabsTrigger value="nr35" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              NR-35
            </TabsTrigger>
            <TabsTrigger value="cipa" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              CIPA
            </TabsTrigger>
            <TabsTrigger value="certificates" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              Certificados
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo das Tabs */}
          <TabsContent value="all" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Filtros */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search" className="text-seguranca-lightgray text-sm sm:text-base">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Nome, fornecedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="type" className="text-seguranca-lightgray text-sm sm:text-base">Tipo</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="NR_35">NR-35</SelectItem>
                        <SelectItem value="CIPA">CIPA</SelectItem>
                        <SelectItem value="NR_10">NR-10</SelectItem>
                        <SelectItem value="BRIGADA_INCENDIO">Brigada de Incêndio</SelectItem>
                        <SelectItem value="NR_33">NR-33</SelectItem>
                        <SelectItem value="NR_12">NR-12</SelectItem>
                        <SelectItem value="PRIMEIROS_SOCORROS">Primeiros Socorros</SelectItem>
                        <SelectItem value="OUTROS">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status" className="text-seguranca-lightgray text-sm sm:text-base">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="AGENDADO">Agendado</SelectItem>
                        <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                        <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Treinamentos */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray">
                  Treinamentos ({filteredTrainings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
                  </div>
                ) : filteredTrainings.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTrainings.map((training) => (
                      <Card key={training.id} className="bg-seguranca-black border-gray-600">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <h3 className="font-semibold text-seguranca-lightgray text-base sm:text-lg">
                                  {training.name}
                                </h3>
                                <Badge className={getTypeColor(training.trainingType)}>
                                  {getTypeLabel(training.trainingType)}
                                </Badge>
                                {training.isActive ? (
                                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm text-gray-400">
                                {training.provider && (
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{training.provider}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{training.durationHours}h {training.validityMonths ? `| Válido: ${training.validityMonths} meses` : ''}</span>
                                </div>
                                
                                {training.nextScheduledDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Próxima: {new Date(training.nextScheduledDate).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2">
                                  <UsersIcon className="h-4 w-4" />
                                  <span>{training.totalParticipants || 0} participantes</span>
                                </div>
                              </div>
                              
                              {training.certificatesExpiring && training.certificatesExpiring > 0 && (
                                <div className="flex items-center gap-2 text-yellow-500 text-sm">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>{training.certificatesExpiring} certificado(s) próximo(s) do vencimento</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTraining(training)}
                                className="border-gray-600 text-seguranca-lightgray text-xs sm:text-sm"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-seguranca-lightgray">Nenhum treinamento encontrado</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                        ? 'Tente ajustar os filtros de busca'
                        : 'Clique em "Novo Treinamento" para criar o primeiro treinamento'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outras tabs com conteúdo similar */}
          <TabsContent value="nr35" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray">Treinamentos NR-35</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm sm:text-base">Treinamentos de Trabalho em Altura conforme NR-35</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cipa" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray">Treinamentos de CIPA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm sm:text-base">Treinamentos da Comissão Interna de Prevenção de Acidentes</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray">Controle de Certificados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm sm:text-base">Gestão de certificados e vencimentos de treinamentos</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Criação/Edição */}
        <TrainingFormModal
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) {
              setSelectedTraining(null);
            }
          }}
          training={selectedTraining}
          onSubmit={handleSubmitTraining}
        />
      </div>
    </StandardLayout>
  );
};

export default SSTTreinamentos;
