import React, { useState, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Search, 
  Filter,
  Loader2,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle,
  File,
  Archive,
  Clock,
  Shield,
  Building,
  CreditCard,
  Car,
  GraduationCap,
  Heart,
  MapPin,
  Phone,
  Mail,
  Trash2,
  Edit,
  Copy,
  Share2,
  Star,
  TrendingUp,
  Users,
  FolderOpen,
  FileCheck,
  FileX,
  FileClock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { documentService } from '@/services/documentService';
import { Document, DocumentType } from '@/services/documentService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Documentos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'EXPIRING' | 'EXPIRED'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');

  // Buscar documentos
  const { 
    data: documents, 
    isLoading: documentsLoading, 
    error: documentsError,
    refetch: refetchDocuments 
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getAllDocuments()
  });

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!documents) return { total: 0, valid: 0, expiring: 0, expired: 0, byType: {} };
    
    const today = new Date();
    const valid = documents.filter(doc => {
      if (!doc.expirationDate) return true;
      const expDate = new Date(doc.expirationDate);
      return expDate > today;
    }).length;
    
    const expiring = documents.filter(doc => {
      if (!doc.expirationDate) return false;
      const expDate = new Date(doc.expirationDate);
      const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;
    
    const expired = documents.filter(doc => {
      if (!doc.expirationDate) return false;
      const expDate = new Date(doc.expirationDate);
      return expDate < today;
    }).length;

    const byType = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { 
      total: documents.length, 
      valid, 
      expiring, 
      expired,
      byType
    };
  }, [documents]);

  // Filtrar e ordenar documentos
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    
    let filtered = documents.filter(doc => {
      const matchesSearch = (
        doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      const matchesType = selectedType === 'ALL' || doc.type === selectedType;
      
      // Filtro por status
      const matchesStatus = (() => {
        if (statusFilter === 'ALL') return true;
        if (!doc.expirationDate) return statusFilter === 'VALID';
        
        const today = new Date();
        const expDate = new Date(doc.expirationDate);
        const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (statusFilter === 'EXPIRED') return daysUntilExpiry < 0;
        if (statusFilter === 'EXPIRING') return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        if (statusFilter === 'VALID') return daysUntilExpiry > 30;
        return true;
      })();
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.number.localeCompare(b.number);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'date':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [documents, searchTerm, selectedType, statusFilter, sortBy]);

  // Funções auxiliares
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDocumentStatus = (doc: Document) => {
    if (!doc.expirationDate) return { status: 'valid', label: 'Válido', icon: <CheckCircle className="h-4 w-4 text-green-600" />, badge: <Badge className="bg-green-100 text-green-800">Válido</Badge> };
    
    const today = new Date();
    const expDate = new Date(doc.expirationDate);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { 
        status: 'expired', 
        label: 'Expirado', 
        icon: <FileX className="h-4 w-4 text-red-600" />, 
        badge: <Badge className="bg-red-100 text-red-800">Expirado</Badge> 
      };
    }
    
    if (daysUntilExpiry <= 30) {
      return { 
        status: 'expiring', 
        label: `Expira em ${daysUntilExpiry} dias`, 
        icon: <FileClock className="h-4 w-4 text-yellow-600" />, 
        badge: <Badge className="bg-yellow-100 text-yellow-800">Expirando</Badge> 
      };
    }
    
    return { 
      status: 'valid', 
      label: 'Válido', 
      icon: <FileCheck className="h-4 w-4 text-green-600" />, 
      badge: <Badge className="bg-green-100 text-green-800">Válido</Badge> 
    };
  };

  const getTypeIcon = (type: DocumentType) => {
    switch (type) {
      case DocumentType.CONTRATO_TRABALHO:
        return <FileText className="h-5 w-5 text-blue-500" />;
      case DocumentType.CPF:
        return <User className="h-5 w-5 text-green-500" />;
      case DocumentType.RG:
        return <User className="h-5 w-5 text-green-500" />;
      case DocumentType.CNH:
        return <Car className="h-5 w-5 text-purple-500" />;
      case DocumentType.CERTIDAO_NASCIMENTO:
        return <Heart className="h-5 w-5 text-pink-500" />;
      case DocumentType.CERTIDAO_CASAMENTO:
        return <Heart className="h-5 w-5 text-pink-500" />;
      case DocumentType.COMPROVANTE_RESIDENCIA:
        return <MapPin className="h-5 w-5 text-orange-500" />;
      case DocumentType.CARTEIRA_TRABALHO:
        return <Building className="h-5 w-5 text-cyan-500" />;
      case DocumentType.CERTIFICADO_MILITAR:
        return <Shield className="h-5 w-5 text-red-500" />;
      case DocumentType.TITULO_ELEITOR:
        return <Shield className="h-5 w-5 text-red-500" />;
      case DocumentType.OUTROS:
        return <File className="h-5 w-5 text-gray-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      CONTRATO_TRABALHO: 'Contrato de Trabalho',
      CPF: 'CPF',
      RG: 'RG',
      CNH: 'CNH',
      CERTIDAO_NASCIMENTO: 'Certidão de Nascimento',
      CERTIDAO_CASAMENTO: 'Certidão de Casamento',
      COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
      CARTEIRA_TRABALHO: 'Carteira de Trabalho',
      CERTIFICADO_MILITAR: 'Certificado Militar',
      TITULO_ELEITOR: 'Título de Eleitor',
      OUTROS: 'Outros',
    };
    return labels[type] || type.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (L) => L.toUpperCase());
  };

  const getTypeCategory = (type: DocumentType): string => {
    const categories: Record<DocumentType, string> = {
      CONTRATO_TRABALHO: 'Trabalho',
      CPF: 'Identificação',
      RG: 'Identificação',
      CNH: 'Identificação',
      CERTIDAO_NASCIMENTO: 'Civil',
      CERTIDAO_CASAMENTO: 'Civil',
      COMPROVANTE_RESIDENCIA: 'Residência',
      CARTEIRA_TRABALHO: 'Trabalho',
      CERTIFICADO_MILITAR: 'Cívico',
      TITULO_ELEITOR: 'Cívico',
      OUTROS: 'Outros',
    };
    return categories[type] || 'Outros';
  };

  // Loading state
  if (documentsLoading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando documentos...</span>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (documentsError) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-seguranca-red mx-auto mb-2" />
            <p className="text-seguranca-lightgray">Erro ao carregar documentos</p>
            <Button 
              onClick={() => refetchDocuments()}
              className="mt-2 bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Tentar novamente
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
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Gestão de Documentos</h1>
            <p className="text-gray-400 mt-1">Controle centralizado de documentos da empresa</p>
          </div>
          <Button 
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Plus size={16} className="mr-2" />
            Novo Documento
          </Button>
        </div>

        {/* Dashboard de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Válidos</p>
                  <p className="text-2xl font-bold text-green-500">{stats.valid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileClock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Expirando</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.expiring}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileX className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Expirados</p>
                  <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Avançados */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Buscar por número, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>

              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as DocumentType | 'ALL')}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os tipos</SelectItem>
                  {Object.values(DocumentType).map(type => (
                    <SelectItem key={type} value={type}>{getTypeLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="VALID">Válidos</SelectItem>
                  <SelectItem value="EXPIRING">Expirando</SelectItem>
                  <SelectItem value="EXPIRED">Expirados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data de criação</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="type">Tipo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                >
                  Limpar Filtros
                </Button>
              </div>
              
              <div className="text-sm text-gray-400">
                {filteredDocuments.length} de {documents?.length || 0} documentos
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Documentos */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                  Nenhum documento encontrado
                </h3>
                <p className="text-gray-400">
                  {searchTerm || selectedType !== 'ALL' || statusFilter !== 'ALL'
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Não há documentos cadastrados no sistema.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => {
                  const docStatus = getDocumentStatus(doc);
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-seguranca-black rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(doc.type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-seguranca-lightgray">
                                {getTypeLabel(doc.type)}: {doc.number}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {getTypeCategory(doc.type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {doc.description || 'Sem descrição'}
                            </p>
                            {doc.fileName && (
                              <div className="flex items-center space-x-1 mt-1">
                                <File className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-500">{doc.fileName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            {docStatus.icon}
                            {docStatus.badge}
                          </div>
                          
                          {doc.expirationDate && (
                            <div className="flex items-center space-x-1 text-xs text-gray-400 mb-1">
                              <Calendar size={12} />
                              <span>Expira: {formatDate(doc.expirationDate)}</span>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            Criado em: {formatDate(doc.createdAt)}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                            <Eye size={14} />
                          </Button>
                          <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                            <Download size={14} />
                          </Button>
                          <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                            <Edit size={14} />
                          </Button>
                          <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                            <Share2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default Documentos;