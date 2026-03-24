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
  nomeArquivoOriginal?: string;
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedModelo, setSelectedModelo] = useState<ModeloDocumento | null>(null);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  
  // Estado para formulário de edição
  const [editForm, setEditForm] = useState({
    nomeModelo: '',
    categoria: 'GERAL',
    descricao: ''
  });

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
        // Parsear placeholders de string JSON para array e normalizar tipoArquivo
        const modelosProcessados = data.map((modelo: any) => ({
          ...modelo,
          tipoArquivo: modelo.tipoArquivo?.toUpperCase() || modelo.tipoArquivo, // Normalizar para maiúsculas
          placeholders: typeof modelo.placeholders === 'string' 
            ? (modelo.placeholders ? JSON.parse(modelo.placeholders) : [])
            : (Array.isArray(modelo.placeholders) ? modelo.placeholders : [])
        }));
        setModelos(modelosProcessados);
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

  const handleView = (modelo: ModeloDocumento) => {
    setSelectedModelo(modelo);
    setShowViewModal(true);
  };

  const handleEdit = (modelo: ModeloDocumento) => {
    setSelectedModelo(modelo);
    setEditForm({
      nomeModelo: modelo.nomeModelo,
      categoria: modelo.categoria,
      descricao: modelo.descricao || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (modelo: ModeloDocumento) => {
    setSelectedModelo(modelo);
    setShowDeleteModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedModelo || !editForm.nomeModelo) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/modelos-documentos/${selectedModelo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...selectedModelo,
          nomeModelo: editForm.nomeModelo,
          categoria: editForm.categoria,
          descricao: editForm.descricao
        })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Modelo atualizado com sucesso'
        });
        setShowEditModal(false);
        setSelectedModelo(null);
        carregarModelos();
      } else {
        throw new Error('Erro ao atualizar modelo');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar modelo de documento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedModelo) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/modelos-documentos/${selectedModelo.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Modelo excluído com sucesso'
        });
        setShowDeleteModal(false);
        setSelectedModelo(null);
        carregarModelos();
      } else {
        throw new Error('Erro ao excluir modelo');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir modelo de documento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (modelo: ModeloDocumento) => {
    try {
      const response = await fetch(`/api/modelos-documentos/${modelo.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = modelo.nomeArquivoOriginal || `${modelo.nomeModelo}.${modelo.tipoArquivo.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Erro ao baixar arquivo');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao baixar arquivo do modelo',
        variant: 'destructive'
      });
    }
  };

  // Handlers para documentos gerados
  const handleViewDocumento = async (documento: DocumentoGerado) => {
    try {
      const response = await fetch(`/api/documentos-gerados/${documento.id}/view`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Limpar a URL após um tempo para liberar memória
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        throw new Error('Erro ao visualizar documento');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao visualizar documento',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadDocumento = async (documento: DocumentoGerado) => {
    try {
      const response = await fetch(`/api/documentos-gerados/${documento.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documento.modelo.nomeModelo + '.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Erro ao baixar documento');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao baixar documento',
        variant: 'destructive'
      });
    }
  };

  const handleAssinarDocumento = async (documento: DocumentoGerado) => {
    try {
      setLoading(true);
      // O IP será obtido pelo backend através do request
      const response = await fetch(`/api/documentos-gerados/${documento.id}/assinar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Documento assinado com sucesso'
        });
        carregarDocumentosGerados();
      } else {
        const errorText = await response.text();
        let errorMessage = 'Erro ao assinar documento';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Se não for JSON, usar o texto da resposta
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao assinar documento',
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
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-seguranca-lightgray">Gestão de Documentos</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">
            Gerencie modelos de documentos e gere documentos dinâmicos para funcionários
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base">
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Upload Modelo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl text-seguranca-lightgray">Upload de Modelo de Documento</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-400">
                  Faça upload de um arquivo .docx ou .pdf para criar um novo modelo de documento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="arquivo" className="text-xs sm:text-sm text-seguranca-lightgray">Arquivo de Documento</Label>
                  <Input
                    id="arquivo"
                    type="file"
                    accept=".docx,.pdf"
                    onChange={(e) => setUploadForm({ ...uploadForm, arquivo: e.target.files?.[0] || null })}
                    className="mt-1 text-xs sm:text-sm text-seguranca-lightgray"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: .docx (Word) ou .pdf (PDF com texto)
                  </p>
                </div>
                <div>
                  <Label htmlFor="nomeModelo" className="text-xs sm:text-sm text-seguranca-lightgray">Nome do Modelo</Label>
                  <Input
                    id="nomeModelo"
                    value={uploadForm.nomeModelo}
                    onChange={(e) => setUploadForm({ ...uploadForm, nomeModelo: e.target.value })}
                    placeholder="Ex: Termo de Aceite LGPD"
                    className="mt-1 text-xs sm:text-sm text-seguranca-lightgray"
                  />
                </div>
                <div>
                  <Label htmlFor="categoria" className="text-xs sm:text-sm text-seguranca-lightgray">Categoria</Label>
                  <Select value={uploadForm.categoria || "GERAL"} onValueChange={(value) => setUploadForm({ ...uploadForm, categoria: value })}>
                    <SelectTrigger className="mt-1 text-xs sm:text-sm">
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
                  <Label htmlFor="descricao" className="text-xs sm:text-sm text-seguranca-lightgray">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={uploadForm.descricao}
                    onChange={(e) => setUploadForm({ ...uploadForm, descricao: e.target.value })}
                    placeholder="Descrição do modelo..."
                    className="mt-1 text-xs sm:text-sm text-seguranca-lightgray"
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowUploadModal(false)} className="w-full sm:w-auto h-10 text-xs sm:text-sm">
                    Cancelar
                  </Button>
                  <Button onClick={handleUpload} disabled={loading} className="w-full sm:w-auto h-10 text-xs sm:text-sm">
                    {loading ? 'Criando...' : 'Criar Modelo'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showGerarModal} onOpenChange={setShowGerarModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Gerar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl text-seguranca-lightgray">Gerar Novo Documento</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-400">
                  Selecione um modelo e funcionário para gerar um documento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="modelo" className="text-xs sm:text-sm text-seguranca-lightgray">Modelo</Label>
                  <Select value={gerarForm.modeloId} onValueChange={(value) => setGerarForm({ ...gerarForm, modeloId: value })}>
                    <SelectTrigger className="mt-1 text-xs sm:text-sm">
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
                  <Label htmlFor="funcionario" className="text-xs sm:text-sm text-seguranca-lightgray">Funcionário</Label>
                  <Select value={gerarForm.funcionarioId} onValueChange={(value) => setGerarForm({ ...gerarForm, funcionarioId: value })}>
                    <SelectTrigger className="mt-1 text-xs sm:text-sm">
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
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowGerarModal(false)} className="w-full sm:w-auto h-10 text-xs sm:text-sm">
                    Cancelar
                  </Button>
                  <Button onClick={handleGerarDocumento} disabled={loading} className="w-full sm:w-auto h-10 text-xs sm:text-sm">
                    {loading ? 'Gerando...' : 'Gerar Documento'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Visualizar */}
          <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
            <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl text-seguranca-lightgray">Detalhes do Modelo</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-400">
                  Informações completas do modelo de documento
                </DialogDescription>
              </DialogHeader>
              {selectedModelo && (
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-400">Nome do Modelo</Label>
                    <p className="text-sm sm:text-base text-seguranca-lightgray mt-1">{selectedModelo.nomeModelo}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-400">Categoria</Label>
                      <p className="text-sm sm:text-base text-seguranca-lightgray mt-1">{selectedModelo.categoria}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-400">Tipo de Arquivo</Label>
                      <p className="text-sm sm:text-base text-seguranca-lightgray mt-1">{selectedModelo.tipoArquivo}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-400">Descrição</Label>
                    <p className="text-sm sm:text-base text-seguranca-lightgray mt-1">{selectedModelo.descricao || 'Sem descrição'}</p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-400">Placeholders</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(() => {
                        const placeholdersArray = Array.isArray(selectedModelo.placeholders) 
                          ? selectedModelo.placeholders 
                          : (typeof selectedModelo.placeholders === 'string' && selectedModelo.placeholders 
                              ? (() => {
                                  try {
                                    return JSON.parse(selectedModelo.placeholders);
                                  } catch {
                                    return [];
                                  }
                                })()
                              : []);
                        return placeholdersArray.length > 0 ? (
                          placeholdersArray.map((placeholder: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {placeholder}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Nenhum placeholder encontrado</span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-400">Versão</Label>
                      <p className="text-sm sm:text-base text-seguranca-lightgray mt-1">v{selectedModelo.versao}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-400">Data de Criação</Label>
                      <p className="text-sm sm:text-base text-seguranca-lightgray mt-1">
                        {new Date(selectedModelo.dataCriacao).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowViewModal(false)} className="w-full sm:w-auto h-10 text-xs sm:text-sm">
                      Fechar
                    </Button>
                    <Button onClick={() => handleDownload(selectedModelo)} className="w-full sm:w-auto h-10 text-xs sm:text-sm">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Baixar Arquivo
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal de Editar */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl text-seguranca-lightgray">Editar Modelo</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-400">
                  Atualize as informações do modelo de documento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="edit-nome" className="text-xs sm:text-sm">Nome do Modelo *</Label>
                  <Input
                    id="edit-nome"
                    value={editForm.nomeModelo}
                    onChange={(e) => setEditForm({ ...editForm, nomeModelo: e.target.value })}
                    className="mt-1 text-xs sm:text-sm text-seguranca-lightgray bg-gray-700 border-gray-600"
                    placeholder="Nome do modelo"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-categoria" className="text-xs sm:text-sm">Categoria</Label>
                  <Select value={editForm.categoria} onValueChange={(value) => setEditForm({ ...editForm, categoria: value })}>
                    <SelectTrigger className="mt-1 text-xs sm:text-sm text-seguranca-lightgray bg-gray-700 border-gray-600">
                      <SelectValue />
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
                  <Label htmlFor="edit-descricao" className="text-xs sm:text-sm">Descrição</Label>
                  <Textarea
                    id="edit-descricao"
                    value={editForm.descricao}
                    onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                    className="mt-1 text-xs sm:text-sm text-seguranca-lightgray bg-gray-700 border-gray-600"
                    placeholder="Descrição do modelo"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto h-10 text-xs sm:text-sm">
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdate} disabled={loading} className="w-full sm:w-auto h-10 text-xs sm:text-sm">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Excluir */}
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent className="w-[95vw] sm:w-full max-w-md bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl text-seguranca-lightgray">Confirmar Exclusão</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-400">
                  Tem certeza que deseja excluir o modelo "{selectedModelo?.nomeModelo}"? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="w-full sm:w-auto h-10 text-xs sm:text-sm">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmDelete} 
                  disabled={loading}
                  variant="destructive"
                  className="w-full sm:w-auto h-10 text-xs sm:text-sm"
                >
                  {loading ? 'Excluindo...' : 'Excluir'}
                </Button>
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

        <TabsContent value="modelos" className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  placeholder="Buscar modelos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-xs sm:text-sm text-seguranca-lightgray"
                />
              </div>
            </div>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {modelosFiltrados.map((modelo) => (
              <Card key={modelo.id} className="hover:shadow-md transition-shadow bg-seguranca-graphite border-gray-600">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm sm:text-base lg:text-lg text-seguranca-lightgray">{modelo.nomeModelo}</CardTitle>
                      <CardDescription className="mt-1 text-xs sm:text-sm text-gray-400">
                        <Badge variant="outline" className="mr-2 text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {modelo.categoria}
                        </Badge>
                        <Badge variant={modelo.tipoArquivo === 'DOCX' ? 'default' : 'secondary'} className="mr-2 text-xs">
                          {modelo.tipoArquivo}
                        </Badge>
                        v{modelo.versao}
                      </CardDescription>
                    </div>
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-gray-400 mb-3">{modelo.descricao}</p>
                  
                  {(() => {
                    // Garantir que placeholders seja sempre um array
                    const placeholdersArray = Array.isArray(modelo.placeholders) 
                      ? modelo.placeholders 
                      : (typeof modelo.placeholders === 'string' && modelo.placeholders 
                          ? (() => {
                              try {
                                return JSON.parse(modelo.placeholders);
                              } catch {
                                return [];
                              }
                            })()
                          : []);
                    
                    return placeholdersArray.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Placeholders:</p>
                        <div className="flex flex-wrap gap-1">
                          {placeholdersArray.slice(0, 3).map((placeholder: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {placeholder}
                            </Badge>
                          ))}
                          {placeholdersArray.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{placeholdersArray.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(modelo.dataCriacao).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleView(modelo)}
                        title="Visualizar"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(modelo)}
                        title="Editar"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(modelo)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {modelosFiltrados.length === 0 && (
            <Alert className="bg-seguranca-graphite border-gray-600">
              <AlertDescription className="text-xs sm:text-sm text-gray-400">
                Nenhum modelo encontrado. Crie seu primeiro modelo fazendo upload de um arquivo DOCX.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="gerados" className="space-y-3 sm:space-y-4">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-xs sm:text-sm text-seguranca-lightgray"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {documentosFiltrados.map((documento) => (
              <Card key={documento.id} className="hover:shadow-md transition-shadow bg-seguranca-graphite border-gray-600">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-sm sm:text-base font-semibold text-seguranca-lightgray">{documento.modelo.nomeModelo}</h3>
                        {getStatusBadge(documento.status)}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          {documento.funcionario.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {new Date(documento.dataCriacao).toLocaleDateString()}
                        </span>
                        {documento.dataVencimento && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            Vence em {new Date(documento.dataVencimento).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                        onClick={() => handleViewDocumento(documento)}
                        disabled={loading}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                        onClick={() => handleDownloadDocumento(documento)}
                        disabled={loading}
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Download
                      </Button>
                      {documento.status === 'PENDENTE' && (
                        <Button 
                          size="sm" 
                          className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                          onClick={() => handleAssinarDocumento(documento)}
                          disabled={loading}
                        >
                          <FileSignature className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
            <Alert className="bg-seguranca-graphite border-gray-600">
              <AlertDescription className="text-xs sm:text-sm text-gray-400">
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
