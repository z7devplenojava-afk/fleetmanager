import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Funcionario, FuncionarioFilters } from '@/types/funcionario';
import { funcionarioService } from '@/services/funcionarioService';
import { EnvioHoleriteModal } from '@/components/holerites/EnvioHoleriteModal';
import { FuncionarioFormModal } from '@/components/holerites/FuncionarioFormModal';
import { UnifiedPayslipUpload } from '@/components/holerites/UnifiedPayslipUpload';

const EnvioHolerites: React.FC = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [showEnvioModal, setShowEnvioModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showUnifiedUpload, setShowUnifiedUpload] = useState(false);
  const [tipoEnvio, setTipoEnvio] = useState<'individual' | 'massa' | 'todos'>('individual');
  const [tipoInicialModal, setTipoInicialModal] = useState<'email' | 'whatsapp'>('email');
  const [activeTab, setActiveTab] = useState('funcionarios');
  const { toast } = useToast();

  // Carregar funcionários
  const loadFuncionarios = async (filters?: FuncionarioFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await funcionarioService.getFuncionarios(filters);
      setFuncionarios(data);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      setError('Erro ao carregar funcionários. Tente novamente.');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar funcionários iniciais
  useEffect(() => {
    loadFuncionarios();
  }, []);

  // Filtrar funcionários localmente
  const filteredFuncionarios = funcionarios.filter(funcionario =>
    funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    funcionario.cpf.includes(searchTerm) ||
    (funcionario.email && funcionario.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Atualizar funcionários
  const refreshFuncionarios = async () => {
    setRefreshing(true);
    try {
      await loadFuncionarios();
      toast({
        title: "Sucesso",
        description: "Lista de funcionários atualizada.",
      });
    } catch (error) {
      console.error('Erro ao atualizar funcionários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a lista de funcionários.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Handlers para envio
  const handleEnvioIndividual = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setTipoEnvio('individual');
    setShowEnvioModal(true);
  };

  const handleEnvioIndividualEmail = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setTipoEnvio('individual');
    setTipoInicialModal('email');
    setShowEnvioModal(true);
  };

  const handleEnvioIndividualWhatsApp = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setTipoEnvio('individual');
    setTipoInicialModal('whatsapp');
    setShowEnvioModal(true);
  };

  const handleEnvioMassa = () => {
    setSelectedFuncionario(null);
    setTipoEnvio('massa');
    setShowEnvioModal(true);
  };

  const handleEnvioTodos = () => {
    setSelectedFuncionario(null);
    setTipoEnvio('todos');
    setShowEnvioModal(true);
  };

  // Handlers para funcionários
  const handleEditFuncionario = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setShowFormModal(true);
  };

  const handleNewFuncionario = () => {
    setSelectedFuncionario(null);
    setShowFormModal(true);
  };

  const handleDeleteFuncionario = async (funcionario: Funcionario) => {
    if (!confirm(`Tem certeza que deseja excluir o funcionário "${funcionario.nome}"?`)) {
      return;
    }

    try {
      await funcionarioService.deleteFuncionario(funcionario.id);
      toast({
        title: "Funcionário excluído",
        description: "Funcionário excluído com sucesso!",
      });
      loadFuncionarios();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao excluir funcionário",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    loadFuncionarios();
  };

  // Estatísticas
  const stats = {
    total: funcionarios.length,
    comEmail: funcionarios.filter(f => f.email).length,
    comWhatsapp: funcionarios.filter(f => f.possuiWhatsapp && f.telefone).length,
    comHolerite: funcionarios.filter(f => f.caminhoPdf).length
  };

  // Loading state
  if (loading && funcionarios.length === 0) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-seguranca-red mb-4" />
            <p className="text-seguranca-lightgray">Carregando funcionários...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (error && funcionarios.length === 0) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-4" />
            <p className="text-seguranca-lightgray mb-4">{error}</p>
            <Button 
              onClick={() => loadFuncionarios()}
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
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Envio de Holerites</h1>
            <p className="text-gray-400 mt-1">
              Gerencie funcionários e envie holerites por email e WhatsApp
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshFuncionarios}
              disabled={refreshing}
              className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleNewFuncionario}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-seguranca-black border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-black border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Com Email</p>
                  <p className="text-2xl font-bold text-green-400">{stats.comEmail}</p>
                </div>
                <Mail className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-black border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Com WhatsApp</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.comWhatsapp}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-black border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Com Holerite</p>
                  <p className="text-2xl font-bold text-seguranca-yellow">{stats.comHolerite}</p>
                </div>
                <FileText className="h-8 w-8 text-seguranca-yellow" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-seguranca-black border border-gray-600">
            <TabsTrigger value="funcionarios" className="text-seguranca-lightgray">
              <Users className="h-4 w-4 mr-2" />
              Funcionários
            </TabsTrigger>
            <TabsTrigger value="envio" className="text-seguranca-lightgray">
              <Send className="h-4 w-4 mr-2" />
              Envio em Massa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="funcionarios" className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
            </div>

            {/* Lista de Funcionários */}
            <div className="space-y-4">
              {filteredFuncionarios.map((funcionario) => (
                <Card key={funcionario.id} className="bg-seguranca-black border-gray-600 hover:border-gray-500 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-seguranca-red rounded-full flex items-center justify-center">
                          <Users className="text-white" size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-seguranca-lightgray">{funcionario.nome}</h3>
                          <p className="text-sm text-gray-400">CPF: {funcionario.cpf}</p>
                          {funcionario.email && (
                            <p className="text-sm text-gray-400">Email: {funcionario.email}</p>
                          )}
                          {funcionario.telefone && (
                            <p className="text-sm text-gray-400">Telefone: {funcionario.telefone}</p>
                          )}
                          {funcionario.mesReferencia && funcionario.anoReferencia && (
                            <p className="text-sm text-gray-400">
                              Período: {funcionario.mesReferencia}/{funcionario.anoReferencia}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Badges de status */}
                        <div className="flex flex-col gap-1">
                          {funcionario.email && (
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Badge>
                          )}
                          {funcionario.possuiWhatsapp && funcionario.telefone && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              WhatsApp
                            </Badge>
                          )}
                          {funcionario.caminhoPdf && (
                            <Badge variant="outline" className="text-seguranca-yellow border-seguranca-yellow">
                              <FileText className="h-3 w-3 mr-1" />
                              Holerite
                            </Badge>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex items-center space-x-1">
                          {funcionario.email && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEnvioIndividualEmail(funcionario)}
                              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                              title="Enviar por Email"
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          )}
                          {funcionario.possuiWhatsapp && funcionario.telefone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEnvioIndividualWhatsApp(funcionario)}
                              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                              title="Enviar por WhatsApp"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditFuncionario(funcionario)}
                            className="border-gray-600 text-seguranca-lightgray hover:bg-gray-600"
                            title="Editar"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteFuncionario(funcionario)}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredFuncionarios.length === 0 && (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-seguranca-lightgray">Nenhum funcionário encontrado.</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece adicionando um funcionário.'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="envio" className="space-y-4">
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Envio em Massa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => setShowUnifiedUpload(true)}
                    className="bg-seguranca-yellow hover:bg-yellow-600 text-black h-20"
                  >
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2" />
                      <p>Upload + Envio</p>
                      <p className="text-sm opacity-80">Processar e enviar</p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={handleEnvioMassa}
                    className="bg-seguranca-red hover:bg-seguranca-darkred h-20"
                  >
                    <div className="text-center">
                      <Send className="h-6 w-6 mx-auto mb-2" />
                      <p>Envio Seletivo</p>
                      <p className="text-sm opacity-80">Selecionar funcionários</p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={handleEnvioTodos}
                    className="bg-green-600 hover:bg-green-700 h-20"
                  >
                    <div className="text-center">
                      <Users className="h-6 w-6 mx-auto mb-2" />
                      <p>Enviar para Todos</p>
                      <p className="text-sm opacity-80">Todos os disponíveis</p>
                    </div>
                  </Button>
                </div>
                
                <div className="text-sm text-gray-400">
                  <p>• <strong>Upload + Envio:</strong> Faça upload de um PDF e envie automaticamente para os funcionários</p>
                  <p>• <strong>Envio Seletivo:</strong> Escolha quais funcionários receberão o holerite</p>
                  <p>• <strong>Enviar para Todos:</strong> Envia para todos os funcionários com email ou WhatsApp cadastrado</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modais */}
        <EnvioHoleriteModal
          open={showEnvioModal}
          onOpenChange={setShowEnvioModal}
          funcionarios={funcionarios}
          tipoEnvio={tipoEnvio}
          funcionarioSelecionado={selectedFuncionario || undefined}
          tipoInicial={tipoInicialModal}
        />

        <FuncionarioFormModal
          open={showFormModal}
          onOpenChange={setShowFormModal}
          funcionario={selectedFuncionario || undefined}
          onSuccess={handleFormSuccess}
        />

        <UnifiedPayslipUpload
          open={showUnifiedUpload}
          onOpenChange={setShowUnifiedUpload}
          funcionarios={funcionarios}
          onSuccess={handleFormSuccess}
        />
      </div>
    </StandardLayout>
  );
};

export default EnvioHolerites; 