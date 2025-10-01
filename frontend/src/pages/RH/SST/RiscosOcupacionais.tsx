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
  User, 
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Users,
  Target,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sstService, OccupationalRisk, EmployeeRisk, AssociateRiskToEmployeeDTO } from '@/services/sstService';
import { useToast } from '@/hooks/use-toast';

const RiscosOcupacionais: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [risks, setRisks] = useState<OccupationalRisk[]>([]);
  const [employeeRisks, setEmployeeRisks] = useState<EmployeeRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'risks' | 'associations'>('risks');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  
  // Estados para modal de criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<OccupationalRisk>>({
    name: '',
    description: '',
    category: 'FISICO',
    level: 'MEDIO',
    isActive: true
  });

  // Estados para modal de associação
  const [showAssociationModal, setShowAssociationModal] = useState(false);
  const [associationForm, setAssociationForm] = useState<AssociateRiskToEmployeeDTO>({
    employeeId: '',
    riskId: '',
    riskLevel: 'MEDIO',
    notes: ''
  });

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [risksData, employeeRisksData] = await Promise.all([
        sstService.getOccupationalRisks(),
        sstService.getEmployeeRisks('') // Carregar todos
      ]);
      setRisks(risksData);
      setEmployeeRisks(employeeRisksData);
    } catch (err) {
      console.error('Erro ao carregar dados de riscos:', err);
      setError('Erro ao carregar dados de riscos');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de riscos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar riscos
  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || risk.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || risk.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Filtrar associações
  const filteredEmployeeRisks = employeeRisks.filter(empRisk => {
    const matchesSearch = empRisk.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empRisk.riskName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Criar novo risco
  const handleCreateRisk = async () => {
    try {
      if (!createForm.name || !createForm.description) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await sstService.createOccupationalRisk(createForm);
      toast({
        title: "Sucesso",
        description: "Risco ocupacional criado com sucesso",
      });
      
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        category: 'FISICO',
        level: 'MEDIO',
        isActive: true
      });
      
      loadData();
    } catch (err) {
      console.error('Erro ao criar risco ocupacional:', err);
      toast({
        title: "Erro",
        description: "Não foi possível criar o risco ocupacional",
        variant: "destructive",
      });
    }
  };

  // Associar risco a funcionário
  const handleAssociateRisk = async () => {
    try {
      if (!associationForm.employeeId || !associationForm.riskId) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await sstService.associateRiskToEmployee(associationForm);
      toast({
        title: "Sucesso",
        description: "Risco associado ao funcionário com sucesso",
      });
      
      setShowAssociationModal(false);
      setAssociationForm({
        employeeId: '',
        riskId: '',
        riskLevel: 'MEDIO',
        notes: ''
      });
      
      loadData();
    } catch (err) {
      console.error('Erro ao associar risco:', err);
      toast({
        title: "Erro",
        description: "Não foi possível associar o risco ao funcionário",
        variant: "destructive",
      });
    }
  };

  // Obter cor da categoria
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'FISICO':
        return 'bg-blue-100 text-blue-800';
      case 'QUIMICO':
        return 'bg-red-100 text-red-800';
      case 'BIOLOGICO':
        return 'bg-green-100 text-green-800';
      case 'ERGONOMICO':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACIDENTE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter cor do nível
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BAIXO':
        return 'bg-green-100 text-green-800';
      case 'MEDIO':
        return 'bg-yellow-100 text-yellow-800';
      case 'ALTO':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Estatísticas
  const riskStats = {
    totalRisks: risks.length,
    activeRisks: risks.filter(r => r.isActive).length,
    totalAssociations: employeeRisks.length,
    criticalRisks: risks.filter(r => r.level === 'CRITICO').length,
    highRisks: risks.filter(r => r.level === 'ALTO').length
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-8 w-8 animate-pulse text-seguranca-yellow" />
            <p className="text-seguranca-lightgray">Carregando dados de riscos...</p>
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
              onClick={loadData}
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
              <AlertTriangle className="h-8 w-8 text-seguranca-yellow" />
              Riscos Ocupacionais
            </h1>
            <p className="text-gray-400 mt-1">Gestão de Riscos e Análise de Perigos</p>
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
              Novo Risco
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Riscos</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{riskStats.totalRisks}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Riscos Ativos</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{riskStats.activeRisks}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Associações</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{riskStats.totalAssociations}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Riscos Críticos</p>
                  <p className="text-2xl font-bold text-red-500">{riskStats.criticalRisks}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Riscos Altos</p>
                  <p className="text-2xl font-bold text-orange-500">{riskStats.highRisks}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-600">
          <Button
            variant={activeTab === 'risks' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('risks')}
            className={activeTab === 'risks' ? 'bg-seguranca-red' : 'text-seguranca-lightgray hover:bg-seguranca-black'}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Catálogo de Riscos
          </Button>
          <Button
            variant={activeTab === 'associations' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('associations')}
            className={activeTab === 'associations' ? 'bg-seguranca-red' : 'text-seguranca-lightgray hover:bg-seguranca-black'}
          >
            <Users className="h-4 w-4 mr-2" />
            Associações
          </Button>
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
                    placeholder={activeTab === 'risks' ? 'Nome do risco, descrição...' : 'Funcionário, risco...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
              
              {activeTab === 'risks' && (
                <>
                  <div>
                    <Label htmlFor="category" className="text-seguranca-lightgray">Categoria</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="FISICO">Físico</SelectItem>
                        <SelectItem value="QUIMICO">Químico</SelectItem>
                        <SelectItem value="BIOLOGICO">Biológico</SelectItem>
                        <SelectItem value="ERGONOMICO">Ergonômico</SelectItem>
                        <SelectItem value="ACIDENTE">Acidente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="level" className="text-seguranca-lightgray">Nível</Label>
                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="BAIXO">Baixo</SelectItem>
                        <SelectItem value="MEDIO">Médio</SelectItem>
                        <SelectItem value="ALTO">Alto</SelectItem>
                        <SelectItem value="CRITICO">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo das Tabs */}
        {activeTab === 'risks' ? (
          /* Catálogo de Riscos */
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
                <span>Catálogo de Riscos ({filteredRisks.length})</span>
                <Button
                  size="sm"
                  onClick={() => setShowAssociationModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Associar Risco
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRisks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRisks.map((risk) => (
                    <div key={risk.id} className="p-4 bg-seguranca-black rounded-lg border border-gray-600">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-seguranca-lightgray mb-2">
                            {risk.name}
                          </h3>
                          <div className="flex gap-2 mb-2">
                            <Badge className={getCategoryColor(risk.category)}>
                              {risk.category}
                            </Badge>
                            <Badge className={getLevelColor(risk.level)}>
                              {risk.level}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/rh/sst/riscos/${risk.id}`)}
                            className="border-gray-600 text-seguranca-lightgray"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-3">{risk.description}</p>
                      
                      <div className="flex justify-between items-center">
                        <Badge className={risk.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {risk.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(risk.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-seguranca-lightgray">Nenhum risco encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm || categoryFilter !== 'all' || levelFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Clique em "Novo Risco" para criar o primeiro risco'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Associações de Riscos */
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray">
                Associações de Riscos ({filteredEmployeeRisks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEmployeeRisks.length > 0 ? (
                <div className="space-y-4">
                  {filteredEmployeeRisks.map((empRisk) => (
                    <div key={empRisk.id} className="p-4 bg-seguranca-black rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-seguranca-lightgray">
                              {empRisk.employeeName}
                            </h3>
                            <Badge className={getLevelColor(empRisk.riskLevel)}>
                              {empRisk.riskLevel}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{empRisk.riskName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>ID: {empRisk.employeeId}</span>
                            </div>
                          </div>
                          
                          {empRisk.notes && (
                            <p className="text-sm text-gray-400 mt-2">{empRisk.notes}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/rh/sst/associacoes/${empRisk.id}`)}
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
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-seguranca-lightgray">Nenhuma associação encontrada</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Clique em "Associar Risco" para criar a primeira associação'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de Criação de Risco */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-seguranca-lightgray mb-4">
                Novo Risco Ocupacional
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-seguranca-lightgray">
                    Nome do Risco *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Ruído, Poeira, Postura inadequada"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-seguranca-lightgray">
                    Descrição *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o risco e seus efeitos"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-seguranca-lightgray">
                    Categoria *
                  </Label>
                  <Select 
                    value={createForm.category} 
                    onValueChange={(value) => setCreateForm({...createForm, category: value as any})}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FISICO">Físico</SelectItem>
                      <SelectItem value="QUIMICO">Químico</SelectItem>
                      <SelectItem value="BIOLOGICO">Biológico</SelectItem>
                      <SelectItem value="ERGONOMICO">Ergonômico</SelectItem>
                      <SelectItem value="ACIDENTE">Acidente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="level" className="text-seguranca-lightgray">
                    Nível de Risco *
                  </Label>
                  <Select 
                    value={createForm.level} 
                    onValueChange={(value) => setCreateForm({...createForm, level: value as any})}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIXO">Baixo</SelectItem>
                      <SelectItem value="MEDIO">Médio</SelectItem>
                      <SelectItem value="ALTO">Alto</SelectItem>
                      <SelectItem value="CRITICO">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border-gray-600 text-seguranca-lightgray"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateRisk}
                  className="flex-1 bg-seguranca-red hover:bg-seguranca-darkred"
                >
                  Criar Risco
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Associação */}
        {showAssociationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-seguranca-lightgray mb-4">
                Associar Risco a Funcionário
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employeeId" className="text-seguranca-lightgray">
                    Funcionário *
                  </Label>
                  <Input
                    id="employeeId"
                    placeholder="ID do funcionário"
                    value={associationForm.employeeId}
                    onChange={(e) => setAssociationForm({...associationForm, employeeId: e.target.value})}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                
                <div>
                  <Label htmlFor="riskId" className="text-seguranca-lightgray">
                    Risco *
                  </Label>
                  <Select 
                    value={associationForm.riskId} 
                    onValueChange={(value) => setAssociationForm({...associationForm, riskId: value})}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o risco" />
                    </SelectTrigger>
                    <SelectContent>
                      {risks.filter(risk => risk.isActive).map((risk) => (
                        <SelectItem key={risk.id} value={risk.id}>
                          {risk.name} - {risk.level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="riskLevel" className="text-seguranca-lightgray">
                    Nível de Risco para o Funcionário
                  </Label>
                  <Select 
                    value={associationForm.riskLevel} 
                    onValueChange={(value) => setAssociationForm({...associationForm, riskLevel: value})}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIXO">Baixo</SelectItem>
                      <SelectItem value="MEDIO">Médio</SelectItem>
                      <SelectItem value="ALTO">Alto</SelectItem>
                      <SelectItem value="CRITICO">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="notes" className="text-seguranca-lightgray">
                    Observações
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Observações sobre a associação"
                    value={associationForm.notes}
                    onChange={(e) => setAssociationForm({...associationForm, notes: e.target.value})}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAssociationModal(false)}
                  className="flex-1 border-gray-600 text-seguranca-lightgray"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAssociateRisk}
                  className="flex-1 bg-seguranca-red hover:bg-seguranca-darkred"
                >
                  Associar Risco
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default RiscosOcupacionais;

