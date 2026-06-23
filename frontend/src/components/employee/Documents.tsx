import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Shield,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  description: string;
  uploadDate: string;
  expirationDate?: string;
  status: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'PENDING';
  fileSize: number;
  downloadUrl?: string;
  category: 'PERSONAL' | 'PROFESSIONAL' | 'MEDICAL' | 'TRAINING' | 'OTHER';
}

const Documents: React.FC = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);

  // Dados mockados para funcionar offline
  const mockDocuments: Document[] = [
    {
      id: '1',
      documentType: 'RG',
      fileName: 'rg_jose_mario.pdf',
      description: 'Documento de Identidade',
      uploadDate: '2024-01-15',
      expirationDate: '2034-01-15',
      status: 'VALID',
      fileSize: 2048576,
      category: 'PERSONAL'
    },
    {
      id: '2',
      documentType: 'CPF',
      fileName: 'cpf_jose_mario.pdf',
      description: 'Cadastro de Pessoa Física',
      uploadDate: '2024-01-15',
      expirationDate: '2034-01-15',
      status: 'VALID',
      fileSize: 1024576,
      category: 'PERSONAL'
    },
    {
      id: '3',
      documentType: 'CTPS',
      fileName: 'ctps_jose_mario.pdf',
      description: 'Carteira de Trabalho',
      uploadDate: '2024-01-20',
      expirationDate: '2024-12-31',
      status: 'EXPIRING',
      fileSize: 3072576,
      category: 'PROFESSIONAL'
    },
    {
      id: '4',
      documentType: 'Certificado de Treinamento',
      fileName: 'treinamento_seguranca.pdf',
      description: 'Treinamento de Segurança no Trabalho',
      uploadDate: '2024-06-10',
      expirationDate: '2025-06-10',
      status: 'VALID',
      fileSize: 1536576,
      category: 'TRAINING'
    },
    {
      id: '5',
      documentType: 'Exame Médico',
      fileName: 'exame_medico_2024.pdf',
      description: 'Exame Admissional',
      uploadDate: '2024-01-10',
      expirationDate: '2025-01-10',
      status: 'EXPIRING',
      fileSize: 2568576,
      category: 'MEDICAL'
    }
  ];

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Simulação de carregamento
      setTimeout(() => {
        setDocuments(mockDocuments);
        setLoading(false);
      }, 500);
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Backend offline - exibindo dados mockados',
        variant: 'default',
      });
      setDocuments(mockDocuments);
      setLoading(false);
    }
  };

  const handleDownload = (document: Document) => {
    toast({
      title: 'Informação',
      description: `Download simulado - Backend offline. Documento: ${document.fileName}`,
      variant: 'default',
    });
  };

  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast({
        title: 'Informação',
        description: 'Upload simulado - Backend offline. Funcionalidade disponível quando o backend estiver online.',
        variant: 'default',
      });
    }, 1000);
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || document.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALID':
        return 'bg-green-100 text-green-800';
      case 'EXPIRING':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'VALID':
        return 'Válido';
      case 'EXPIRING':
        return 'A Vencer';
      case 'EXPIRED':
        return 'Vencido';
      case 'PENDING':
        return 'Pendente';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALID':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'EXPIRING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'EXPIRED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PERSONAL':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'PROFESSIONAL':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'MEDICAL':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'TRAINING':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateStats = () => {
    const expiring = documents.filter(d => d.status === 'EXPIRING').length;
    const expired = documents.filter(d => d.status === 'EXPIRED').length;
    const valid = documents.filter(d => d.status === 'VALID').length;
    const pending = documents.filter(d => d.status === 'PENDING').length;
    
    return { expiring, expired, valid, pending };
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
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-muted-foreground">Gerencie seus documentos e acompanhe as validades</p>
        </div>
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <Upload className="h-4 w-4" />
          <span>{uploading ? 'Enviando...' : 'Novo Documento'}</span>
        </Button>
      </div>

      {/* Status do Sistema */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">
            🟡 <strong>Backend Offline:</strong> Funcionalidade simulada com dados mockados. Uploads e downloads não funcionarão até que o backend esteja online.
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Válidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <p className="text-xs text-muted-foreground">Documentos em dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Vencer</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
            <p className="text-xs text-muted-foreground">Atenção necessária</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Atualização urgente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
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
                placeholder="Buscar documentos..."
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
                <SelectItem value="VALID">Válidos</SelectItem>
                <SelectItem value="EXPIRING">A Vencer</SelectItem>
                <SelectItem value="EXPIRED">Vencidos</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="PERSONAL">Pessoais</SelectItem>
                <SelectItem value="PROFESSIONAL">Profissionais</SelectItem>
                <SelectItem value="MEDICAL">Médicos</SelectItem>
                <SelectItem value="TRAINING">Treinamentos</SelectItem>
                <SelectItem value="OTHER">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <FileText className="h-5 w-5 mr-2 text-red-500" />
            Meus Documentos ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(document.category)}
                    <div>
                      <h3 className="font-medium text-foreground">{document.documentType}</h3>
                      <p className="text-sm text-muted-foreground">{document.description}</p>
                      <p className="text-xs text-muted-foreground">{document.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(document.status)}
                      <Badge className={getStatusColor(document.status)}>
                        {getStatusLabel(document.status)}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">{formatFileSize(document.fileSize)}</span>
                    {document.expirationDate && (
                      <span className="text-muted-foreground">
                        Vencimento: {new Date(document.expirationDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(document)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Detalhes</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(document)}
                    className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar</span>
                  </Button>
                </div>
              </div>
            ))}
            {filteredDocuments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Nenhum documento encontrado</p>
                <p className="text-sm">Tente ajustar os filtros ou faça upload de novos documentos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedDocument && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center justify-between">
              <span>Detalhes do Documento - {selectedDocument.documentType}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocument(null)}
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
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{selectedDocument.documentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="font-medium">{selectedDocument.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <Badge variant="outline">{selectedDocument.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(selectedDocument.status)}>
                      {getStatusLabel(selectedDocument.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-3">Datas e Arquivo</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Upload:</span>
                    <span className="font-medium">{new Date(selectedDocument.uploadDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {selectedDocument.expirationDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data de Vencimento:</span>
                      <span className="font-medium">{new Date(selectedDocument.expirationDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome do Arquivo:</span>
                    <span className="font-medium text-xs">{selectedDocument.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tamanho:</span>
                    <span className="font-medium">{formatFileSize(selectedDocument.fileSize)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handleDownload(selectedDocument)}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Baixar Arquivo</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Documents;
