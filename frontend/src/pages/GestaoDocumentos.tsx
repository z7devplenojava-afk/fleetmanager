import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Upload, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileSignature,
  Users,
  Calendar,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interfaces
interface ModeloDocumento {
  id: string;
  nomeModelo: string;
  tipoArquivo: 'DOCX' | 'PDF';
  categoria: string;
  versao: string;
  descricao?: string;
  placeholders: string[];
  dataCriacao: string;
  ativo: boolean;
  extraivel: boolean;
}

interface DocumentoGerado {
  id: string;
  modelo: ModeloDocumento;
  funcionario: {
    id: string;
    name: string;
    cpf: string;
  };
  status: 'PENDENTE' | 'ASSINADO' | 'VENCIDO' | 'CANCELADO';
  dataCriacao: string;
  dataVencimento?: string;
  dataAssinatura?: string;
}

interface Funcionario {
  id: string;
  name: string;
  cpf: string;
  position?: {
    name: string;
  };
  department?: {
    name: string;
  };
}

const GestaoDocumentos: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('modelos');
  const [modelos, setModelos] = useState<ModeloDocumento[]>([]);
  const [documentosGerados, setDocumentosGerados] = useState<DocumentoGerado[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('TODAS');

  // Estados para modais
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGerarModal, setShowGerarModal] = useState(false);
  const [selectedModelo, setSelectedModelo] = useState<ModeloDocumento | null>(null);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);

  // Estados para formulários
  const [uploadForm, setUploadForm] = useState({
    arquivo: null as File | null,
    nomeModelo: '',
    categoria: 'GERAL',
    descricao: ''
  });

  const [gerarForm, setGerarForm] = useState({
    modeloId: '',
    funcionarioId: '',
    dadosPreenchidos: {} as Record<string, any>
  });

  // Carregar dados iniciais
  useEffect(() => {
    carregarModelos();
    carregarDocumentosGerados();
    carregarFuncionarios();
  }, []);

  const carregarModelos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/modelos-documentos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setModelos(data);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar modelos de documentos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarDocumentosGerados = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documentos-gerados', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDocumentosGerados(data.content || data);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar documentos gerados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarFuncionarios = async () => {
    try {
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFuncionarios(data.content || data);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.arquivo || !uploadForm.nomeModelo) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('arquivo', uploadForm.arquivo);
      formData.append('nomeModelo', uploadForm.nomeModelo);
      formData.append('categoria', uploadForm.categoria);
      formData.append('descricao', uploadForm.descricao);

      const response = await fetch('/api/modelos-documentos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Modelo de documento criado com sucesso'
        });
        setShowUploadModal(false);
        setUploadForm({ arquivo: null, nomeModelo: '', categoria: 'GERAL', descricao: '' });
        carregarModelos();
      } else {
        throw new Error('Erro ao criar modelo');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar modelo de documento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGerarDocumento = async () => {
    if (!gerarForm.modeloId || !gerarForm.funcionarioId) {
      toast({
        title: 'Erro',
        description: 'Selecione um modelo e um funcionário',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/documentos-gerados/gerar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gerarForm)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Documento gerado com sucesso'
        });
        setShowGerarModal(false);
        setGerarForm({ modeloId: '', funcionarioId: '', dadosPreenchidos: {} });
        carregarDocumentosGerados();
      } else {
        throw new Error('Erro ao gerar documento');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar documento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDENTE: { variant: 'secondary' as const, icon: Clock, text: 'Pendente' },
      ASSINADO: { variant: 'default' as const, icon: CheckCircle, text: 'Assinado' },
      VENCIDO: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Vencido' },
      CANCELADO: { variant: 'outline' as const, icon: Trash2, text: 'Cancelado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const modelosFiltrados = modelos.filter(modelo => {
    const matchesSearch = modelo.nomeModelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         modelo.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = selectedCategoria === 'TODAS' || modelo.categoria === selectedCategoria;
    return matchesSearch && matchesCategoria && modelo.ativo;
  });

  const documentosFiltrados = documentosGerados.filter(doc => {
    const matchesSearch = doc.modelo.nomeModelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.funcionario.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Documentos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie modelos de documentos e gere documentos dinâmicos para funcionários
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Modelo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload de Modelo de Documento</DialogTitle>
                <DialogDescription>
                  Faça upload de um arquivo .docx ou .pdf para criar um novo modelo de documento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="arquivo">Arquivo de Documento</Label>
                  <Input
                    id="arquivo"
                    type="file"
                    accept=".docx,.pdf"
                    onChange={(e) => setUploadForm({ ...uploadForm, arquivo: e.target.files?.[0] || null })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: .docx (Word) ou .pdf (PDF com texto)
                  </p>
                </div>
                <div>
                  <Label htmlFor="nomeModelo">Nome do Modelo</Label>
                  <Input
                    id="nomeModelo"
                    value={uploadForm.nomeModelo}
                    onChange={(e) => setUploadForm({ ...uploadForm, nomeModelo: e.target.value })}
                    placeholder="Ex: Termo de Aceite LGPD"
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={uploadForm.categoria || "GERAL"} onValueChange={(value) => setUploadForm({ ...uploadForm, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GERAL">Geral</SelectItem>
                      <SelectItem value="LGPD">LGPD</SelectItem>
                      <SelectItem value="CONTRATO">Contrato</SelectItem>
                      <SelectItem value="TERMO">Termo</SelectItem>
                      <SelectItem value="DECLARACAO">Declaração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={uploadForm.descricao}
                    onChange={(e) => setUploadForm({ ...uploadForm, descricao: e.target.value })}
                    placeholder="Descrição do modelo..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpload} disabled={loading}>
                    {loading ? 'Criando...' : 'Criar Modelo'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showGerarModal} onOpenChange={setShowGerarModal}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Gerar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gerar Novo Documento</DialogTitle>
                <DialogDescription>
                  Selecione um modelo e funcionário para gerar um documento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="modelo">Modelo</Label>
                  <Select value={gerarForm.modeloId} onValueChange={(value) => setGerarForm({ ...gerarForm, modeloId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelos.map((modelo) => (
                        <SelectItem key={modelo.id} value={modelo.id}>
                          {modelo.nomeModelo} ({modelo.categoria})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="funcionario">Funcionário</Label>
                  <Select value={gerarForm.funcionarioId} onValueChange={(value) => setGerarForm({ ...gerarForm, funcionarioId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id}>
                          {funcionario.name} - {funcionario.cpf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowGerarModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGerarDocumento} disabled={loading}>
                    {loading ? 'Gerando...' : 'Gerar Documento'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="modelos">Modelos de Documentos</TabsTrigger>
          <TabsTrigger value="gerados">Documentos Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="modelos" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar modelos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as categorias</SelectItem>
                <SelectItem value="GERAL">Geral</SelectItem>
                <SelectItem value="LGPD">LGPD</SelectItem>
                <SelectItem value="CONTRATO">Contrato</SelectItem>
                <SelectItem value="TERMO">Termo</SelectItem>
                <SelectItem value="DECLARACAO">Declaração</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelosFiltrados.map((modelo) => (
              <Card key={modelo.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{modelo.nomeModelo}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="mr-2">
                          <Tag className="h-3 w-3 mr-1" />
                          {modelo.categoria}
                        </Badge>
                        <Badge variant={modelo.tipoArquivo === 'DOCX' ? 'default' : 'secondary'} className="mr-2">
                          {modelo.tipoArquivo}
                        </Badge>
                        v{modelo.versao}
                      </CardDescription>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{modelo.descricao}</p>
                  
                  {modelo.placeholders.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Placeholders:</p>
                      <div className="flex flex-wrap gap-1">
                        {modelo.placeholders.slice(0, 3).map((placeholder, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {placeholder}
                          </Badge>
                        ))}
                        {modelo.placeholders.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{modelo.placeholders.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(modelo.dataCriacao).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {modelosFiltrados.length === 0 && (
            <Alert>
              <AlertDescription>
                Nenhum modelo encontrado. Crie seu primeiro modelo fazendo upload de um arquivo DOCX.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="gerados" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {documentosFiltrados.map((documento) => (
              <Card key={documento.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{documento.modelo.nomeModelo}</h3>
                        {getStatusBadge(documento.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {documento.funcionario.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(documento.dataCriacao).toLocaleDateString()}
                        </span>
                        {documento.dataVencimento && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Vence em {new Date(documento.dataVencimento).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {documento.status === 'PENDENTE' && (
                        <Button size="sm">
                          <FileSignature className="h-4 w-4 mr-1" />
                          Assinar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {documentosFiltrados.length === 0 && (
            <Alert>
              <AlertDescription>
                Nenhum documento gerado encontrado. Gere seu primeiro documento usando um modelo existente.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </StandardLayout>
  );
};

export default GestaoDocumentos;
