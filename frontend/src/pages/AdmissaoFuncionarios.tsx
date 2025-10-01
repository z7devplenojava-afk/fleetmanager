import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { candidateService } from '@/services/candidateService';
import { JobCandidate, CandidateStatus } from '@/types/candidate';
import { 
  UserPlus, 
  Users, 
  FileText, 
  Calendar, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';

const AdmissaoFuncionarios: React.FC = () => {
  const { toast } = useToast();
  const [candidatos, setCandidatos] = useState<JobCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
    city: '',
    state: '',
    educationLevel: '',
    experienceYears: 0,
    currentPosition: '',
    currentCompany: '',
    expectedSalary: 0,
    availability: '',
    notes: ''
  });

  // Carregar candidatos do backend
  useEffect(() => {
    loadCandidatos();
  }, []);

  const loadCandidatos = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getAllCandidates();
      setCandidatos(data);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar candidatos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.cpf) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Criar candidato usando o serviço
      const novoCandidato = await candidateService.createCandidate({
        jobVacancyId: 'default', // ID padrão para admissão direta
        ...formData
      });

      setCandidatos(prev => [novoCandidato, ...prev]);
      setFormData({
        name: '', email: '', phone: '', cpf: '', address: '',
        city: '', state: '', educationLevel: '', experienceYears: 0,
        currentPosition: '', currentCompany: '', expectedSalary: 0,
        availability: '', notes: ''
      });
      setShowForm(false);

      toast({
        title: "Sucesso",
        description: "Candidato cadastrado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao cadastrar candidato:', error);
      toast({
        title: "Erro",
        description: "Falha ao cadastrar candidato.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (candidatoId: string, novoStatus: CandidateStatus) => {
    try {
      await candidateService.updateCandidateStatus(candidatoId, {
        status: novoStatus,
        notes: `Status alterado para ${novoStatus}`
      });

      setCandidatos(prev => prev.map(c => 
        c.id === candidatoId ? { ...c, status: novoStatus } : c
      ));

      toast({
        title: "Status Atualizado",
        description: `Status do candidato alterado para ${novoStatus}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do candidato.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCandidate = async (candidatoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este candidato?')) {
      return;
    }

    try {
      await candidateService.deleteCandidate(candidatoId);
      setCandidatos(prev => prev.filter(c => c.id !== candidatoId));
      
      toast({
        title: "Sucesso",
        description: "Candidato excluído com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir candidato:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir candidato.",
        variant: "destructive"
      });
    }
  };

  const filteredCandidatos = candidatos.filter(candidato => {
    const matchesSearch = candidato.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidato.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidato.cpf?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'TODOS' || candidato.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: CandidateStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'INTERVIEWED': return 'bg-blue-500';
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'HIRED': return 'bg-purple-500';
      case 'WITHDRAWN': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: CandidateStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'INTERVIEWED': return <Eye className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <X className="h-4 w-4" />;
      case 'HIRED': return <UserPlus className="h-4 w-4" />;
      case 'WITHDRAWN': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusDisplayName = (status: CandidateStatus) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'INTERVIEWED': return 'Entrevistado';
      case 'APPROVED': return 'Aprovado';
      case 'REJECTED': return 'Reprovado';
      case 'HIRED': return 'Contratado';
      case 'WITHDRAWN': return 'Desistiu';
      default: return status;
    }
  };

  return (
    <StandardLayout
      title="Admissão de Funcionários"
      subtitle="Gerencie o processo de admissão de novos colaboradores"
    >
      <div className="space-y-6">
        {/* Header com Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Candidatos</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{candidatos.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {candidatos.filter(c => c.status === 'PENDING').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Aprovados</p>
                  <p className="text-2xl font-bold text-green-400">
                    {candidatos.filter(c => c.status === 'APPROVED').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Contratados</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {candidatos.filter(c => c.status === 'HIRED').length}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar candidatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="INTERVIEWED">Entrevistado</SelectItem>
                <SelectItem value="APPROVED">Aprovado</SelectItem>
                <SelectItem value="REJECTED">Reprovado</SelectItem>
                <SelectItem value="HIRED">Contratado</SelectItem>
                <SelectItem value="WITHDRAWN">Desistiu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={() => setShowForm(true)}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Novo Candidato
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
            <span className="ml-2 text-seguranca-lightgray">Carregando candidatos...</span>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="candidatos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-seguranca-black">
            <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
            <TabsTrigger value="processo">Processo de Admissão</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="candidatos" className="space-y-4">
            {/* Lista de Candidatos */}
            <div className="grid gap-4">
              {filteredCandidatos.map((candidato) => (
                <Card key={candidato.id} className="bg-seguranca-graphite border-gray-600">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-seguranca-lightgray mb-1">
                              {candidato.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-2">{candidato.currentPosition}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {candidato.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {candidato.phone}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(candidato.status)} text-white`}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(candidato.status)}
                                {getStatusDisplayName(candidato.status)}
                              </span>
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Empresa Atual: <span className="text-seguranca-lightgray">{candidato.currentCompany || 'N/A'}</span></p>
                            <p className="text-gray-400">Cidade: <span className="text-seguranca-lightgray">{candidato.city}</span></p>
                            <p className="text-gray-400">CPF: <span className="text-seguranca-lightgray">{candidato.cpf}</span></p>
                          </div>
                          <div>
                            <p className="text-gray-400">Experiência: <span className="text-seguranca-lightgray">{candidato.experienceYears} anos</span></p>
                            <p className="text-gray-400">Endereço: <span className="text-seguranca-lightgray">{candidato.address}</span></p>
                            <p className="text-gray-400">Disponibilidade: <span className="text-seguranca-lightgray">{candidato.availability || 'N/A'}</span></p>
                          </div>
                        </div>
                        
                        {candidato.notes && (
                          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-300">{candidato.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Select
                          value={candidato.status}
                          onValueChange={(value) => handleStatusChange(candidato.id, value as CandidateStatus)}
                        >
                          <SelectTrigger className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pendente</SelectItem>
                            <SelectItem value="INTERVIEWED">Entrevistado</SelectItem>
                            <SelectItem value="APPROVED">Aprovado</SelectItem>
                            <SelectItem value="REJECTED">Reprovado</SelectItem>
                            <SelectItem value="HIRED">Contratado</SelectItem>
                            <SelectItem value="WITHDRAWN">Desistiu</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-400 border-red-400 hover:bg-red-900"
                            onClick={() => handleDeleteCandidate(candidato.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="processo" className="space-y-4">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Processo de Admissão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-600 rounded-lg">
                      <h4 className="font-semibold text-seguranca-lightgray mb-2">1. Recebimento da Candidatura</h4>
                      <p className="text-sm text-gray-400">Candidato envia documentos e informações básicas</p>
                    </div>
                    <div className="p-4 border border-gray-600 rounded-lg">
                      <h4 className="font-semibold text-seguranca-lightgray mb-2">2. Análise de Documentos</h4>
                      <p className="text-sm text-gray-400">Verificação de antecedentes e documentos</p>
                    </div>
                    <div className="p-4 border border-gray-600 rounded-lg">
                      <h4 className="font-semibold text-seguranca-lightgray mb-2">3. Entrevista</h4>
                      <p className="text-sm text-gray-400">Entrevista com RH e gestor da área</p>
                    </div>
                    <div className="p-4 border border-gray-600 rounded-lg">
                      <h4 className="font-semibold text-seguranca-lightgray mb-2">4. Exame Médico</h4>
                      <p className="text-sm text-gray-400">Exame médico ocupacional</p>
                    </div>
                    <div className="p-4 border border-gray-600 rounded-lg">
                      <h4 className="font-semibold text-seguranca-lightgray mb-2">5. Treinamento</h4>
                      <p className="text-sm text-gray-400">Treinamento inicial e capacitação</p>
                    </div>
                    <div className="p-4 border border-gray-600 rounded-lg">
                      <h4 className="font-semibold text-seguranca-lightgray mb-2">6. Contratação</h4>
                      <p className="text-sm text-gray-400">Assinatura do contrato e início das atividades</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Documentos Necessários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-seguranca-lightgray">Documentos Pessoais</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li>• RG e CPF (cópias)</li>
                      <li>• Título de Eleitor</li>
                      <li>• Certificado de Reservista</li>
                      <li>• Comprovante de Residência</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-seguranca-lightgray">Documentos Profissionais</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li>• Carteira de Trabalho</li>
                      <li>• Certificados de Cursos</li>
                      <li>• Certificado de Registro de Vigilante</li>
                      <li>• Certificado de Capacitação</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Novo Candidato */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-seguranca-graphite text-seguranca-lightgray rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Novo Candidato</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Nome completo do candidato"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPosition">Cargo Desejado</Label>
                    <Input
                      id="currentPosition"
                      value={formData.currentPosition}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPosition: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Vigilante, Supervisor, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentCompany">Empresa Atual</Label>
                    <Input
                      id="currentCompany"
                      value={formData.currentCompany}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Nome da empresa atual"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Nome da cidade"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="SP, RJ, MG, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Anos de Experiência</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="availability">Disponibilidade</Label>
                    <Input
                      id="availability"
                      value={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Ex: Imediata, 30 dias, etc."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Informações adicionais sobre o candidato..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-gray-600 text-gray-400 hover:bg-gray-800"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Cadastrar Candidato'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default AdmissaoFuncionarios; 