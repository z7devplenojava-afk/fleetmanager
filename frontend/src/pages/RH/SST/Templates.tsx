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
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Edit,
  Trash2,
  Eye,
  FileDown,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sstTemplatesService, SSTTemplate, GeneratedDocument, DocumentGenerationRequest } from '@/services/sstTemplatesService';
import { useToast } from '@/hooks/use-toast';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [templates, setTemplates] = useState<SSTTemplate[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'documents'>('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Estados para modal de criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<SSTTemplate>>({
    name: '',
    type: 'ASO',
    description: '',
    content: '',
    variables: [],
    isActive: true
  });

  // Estados para modal de geração
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SSTTemplate | null>(null);
  const [generateForm, setGenerateForm] = useState<DocumentGenerationRequest>({
    templateId: '',
    employeeId: '',
    variables: {},
    format: 'pdf'
  });

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [templatesData, documentsData] = await Promise.all([
        sstTemplatesService.getTemplates(),
        sstTemplatesService.getGeneratedDocuments()
      ]);
      setTemplates(templatesData);
      setGeneratedDocuments(documentsData);
    } catch (err) {
      console.error('Erro ao carregar dados de templates:', err);
      setError('Erro ao carregar dados de templates');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Filtrar documentos
  const filteredDocuments = generatedDocuments.filter(doc => {
    const matchesSearch = doc.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Criar novo template
  const handleCreateTemplate = async () => {
    try {
      if (!createForm.name || !createForm.type || !createForm.content) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await sstTemplatesService.createTemplate(createForm);
      toast({
        title: "Sucesso",
        description: "Template criado com sucesso",
      });
      
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        type: 'ASO',
        description: '',
        content: '',
        variables: [],
        isActive: true
      });
      
      loadData();
    } catch (err) {
      console.error('Erro ao criar template:', err);
      toast({
        title: "Erro",
        description: "Não foi possível criar o template",
        variant: "destructive",
      });
    }
  };

  // Gerar documento
  const handleGenerateDocument = async () => {
    try {
      if (!generateForm.templateId) {
        toast({
          title: "Erro",
          description: "Selecione um template",
          variant: "destructive",
        });
        return;
      }

      const result = await sstTemplatesService.generateDocument(generateForm);
      toast({
        title: "Sucesso",
        description: "Documento gerado com sucesso",
      });
      
      setShowGenerateModal(false);
      setGenerateForm({
        templateId: '',
        employeeId: '',
        variables: {},
        format: 'pdf'
      });
      setSelectedTemplate(null);
      
      loadData();
    } catch (err) {
      console.error('Erro ao gerar documento:', err);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o documento",
        variant: "destructive",
      });
    }
  };

  // Download documento
  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const blob = await sstTemplatesService.downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao baixar documento:', err);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o documento",
        variant: "destructive",
      });
    }
  };

  // Obter cor do tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASO':
        return 'bg-blue-100 text-blue-800';
      case 'PCMSO':
        return 'bg-green-100 text-green-800';
      case 'PGR':
        return 'bg-yellow-100 text-yellow-800';
      case 'LTCAT':
        return 'bg-purple-100 text-purple-800';
      case 'PPRA':
        return 'bg-red-100 text-red-800';
      case 'CAT':
        return 'bg-orange-100 text-orange-800';
      case 'PPP':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter cor do formato
  const getFormatColor = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'docx':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <FileText className="h-8 w-8 animate-pulse text-seguranca-yellow" />
            <p className="text-seguranca-lightgray">Carregando templates...</p>
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
              <FileText className="h-8 w-8 text-seguranca-yellow" />
              Templates SST
            </h1>
            <p className="text-gray-400 mt-1">Gestão de Templates e Geração de Documentos</p>
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
              Novo Template
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-600">
          <Button
            variant={activeTab === 'templates' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('templates')}
            className={activeTab === 'templates' ? 'bg-seguranca-red' : 'text-seguranca-lightgray hover:bg-seguranca-black'}
          >
            <FileText className="h-4 w-4 mr-2" />
            Templates ({templates.length})
          </Button>
          <Button
            variant={activeTab === 'documents' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('documents')}
            className={activeTab === 'documents' ? 'bg-seguranca-red' : 'text-seguranca-lightgray hover:bg-seguranca-black'}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Documentos Gerados ({generatedDocuments.length})
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search" className="text-seguranca-lightgray">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={activeTab === 'templates' ? 'Nome do template, descrição...' : 'Nome do documento, funcionário...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
              
              {activeTab === 'templates' && (
                <div>
                  <Label htmlFor="type" className="text-seguranca-lightgray">Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ASO">ASO</SelectItem>
                      <SelectItem value="PCMSO">PCMSO</SelectItem>
                      <SelectItem value="PGR">PGR</SelectItem>
                      <SelectItem value="LTCAT">LTCAT</SelectItem>
                      <SelectItem value="PPRA">PPRA</SelectItem>
                      <SelectItem value="CAT">CAT</SelectItem>
                      <SelectItem value="PPP">PPP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo das Tabs */}
        {activeTab === 'templates' ? (
          /* Templates */
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray">
                Templates SST ({filteredTemplates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="p-4 bg-seguranca-black rounded-lg border border-gray-600">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-seguranca-lightgray mb-2">
                            {template.name}
                          </h3>
                          <Badge className={getTypeColor(template.type)}>
                            {template.type}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setGenerateForm({
                                templateId: template.id,
                                employeeId: '',
                                variables: {},
                                format: 'pdf'
                              });
                              setShowGenerateModal(true);
                            }}
                            className="border-gray-600 text-seguranca-lightgray"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/rh/sst/templates/${template.id}`)}
                            className="border-gray-600 text-seguranca-lightgray"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Variáveis:</span>
                          <span className="text-seguranca-lightgray">{template.variables?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <Badge className={template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {template.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Criado:</span>
                          <span className="text-seguranca-lightgray">
                            {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-seguranca-lightgray">Nenhum template encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm || typeFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Clique em "Novo Template" para criar o primeiro template'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Documentos Gerados */
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray">
                Documentos Gerados ({filteredDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDocuments.length > 0 ? (
                <div className="space-y-4">
                  {filteredDocuments.map((doc) => (
                    <div key={doc.id} className="p-4 bg-seguranca-black rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-seguranca-lightgray">
                              {doc.fileName}
                            </h3>
                            <Badge className={getFormatColor(doc.format)}>
                              {doc.format.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{doc.templateName}</span>
                            </div>
                            
                            {doc.employeeName && (
                              <div className="flex items-center gap-2">
                                <span>Funcionário: {doc.employeeName}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(doc.generatedAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-2">
                            Gerado por: {doc.generatedBy}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/rh/sst/documents/${doc.id}`)}
                            className="border-gray-600 text-seguranca-lightgray"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-seguranca-lightgray">Nenhum documento encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Gere documentos usando os templates disponíveis'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de Criação de Template */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-seguranca-lightgray mb-4">
                Novo Template SST
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-seguranca-lightgray">
                      Nome do Template *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ex: ASO - Atestado de Saúde Ocupacional"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type" className="text-seguranca-lightgray">
                      Tipo *
                    </Label>
                    <Select 
                      value={createForm.type} 
                      onValueChange={(value) => setCreateForm({...createForm, type: value as any})}
                    >
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASO">ASO</SelectItem>
                        <SelectItem value="PCMSO">PCMSO</SelectItem>
                        <SelectItem value="PGR">PGR</SelectItem>
                        <SelectItem value="LTCAT">LTCAT</SelectItem>
                        <SelectItem value="PPRA">PPRA</SelectItem>
                        <SelectItem value="CAT">CAT</SelectItem>
                        <SelectItem value="PPP">PPP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-seguranca-lightgray">
                    Descrição
                  </Label>
                  <Input
                    id="description"
                    placeholder="Descrição do template"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content" className="text-seguranca-lightgray">
                    Conteúdo do Template *
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Conteúdo do template com variáveis {{variavel}}"
                    value={createForm.content}
                    onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    rows={10}
                  />
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
                  onClick={handleCreateTemplate}
                  className="flex-1 bg-seguranca-red hover:bg-seguranca-darkred"
                >
                  Criar Template
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Geração de Documento */}
        {showGenerateModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-seguranca-lightgray mb-4">
                Gerar Documento - {selectedTemplate.name}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employeeId" className="text-seguranca-lightgray">
                    Funcionário (Opcional)
                  </Label>
                  <Input
                    id="employeeId"
                    placeholder="ID do funcionário"
                    value={generateForm.employeeId}
                    onChange={(e) => setGenerateForm({...generateForm, employeeId: e.target.value})}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                
                <div>
                  <Label htmlFor="format" className="text-seguranca-lightgray">
                    Formato
                  </Label>
                  <Select 
                    value={generateForm.format} 
                    onValueChange={(value) => setGenerateForm({...generateForm, format: value as any})}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div>
                    <Label className="text-seguranca-lightgray">
                      Variáveis do Template
                    </Label>
                    <div className="space-y-2 mt-2">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable.name}>
                          <Label htmlFor={variable.name} className="text-sm text-gray-400">
                            {variable.label} {variable.required && '*'}
                          </Label>
                          <Input
                            id={variable.name}
                            placeholder={variable.defaultValue || `Digite ${variable.label.toLowerCase()}`}
                            value={generateForm.variables[variable.name] || ''}
                            onChange={(e) => setGenerateForm({
                              ...generateForm,
                              variables: {
                                ...generateForm.variables,
                                [variable.name]: e.target.value
                              }
                            })}
                            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 border-gray-600 text-seguranca-lightgray"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerateDocument}
                  className="flex-1 bg-seguranca-red hover:bg-seguranca-darkred"
                >
                  Gerar Documento
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default Templates;
