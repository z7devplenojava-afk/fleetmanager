import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  Download, 
  PenTool,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building,
  CreditCard,
  Car,
  GraduationCap,
  Heart,
  MapPin,
  Shield,
  FileCheck,
  FileX,
  FileClock,
  Archive,
  Share2,
  Edit,
  Copy,
  Star,
  TrendingUp,
  Users,
  FolderOpen,
  Calendar,
  FileSignature
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DocumentType {
  displayName: string;
  description: string;
}

interface Document {
  id: string;
  type: DocumentType;
  number: string;
  issueDate: string;
  expirationDate?: string;
  fileUrl: string;
  description?: string;
  signed?: boolean;
  signatureDate?: string;
  signedBy?: string;
}

interface EmployeeDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

export const EmployeeDocumentsModal: React.FC<EmployeeDocumentsModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'EXPIRING' | 'EXPIRED'>('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [signatureData, setSignatureData] = useState({
    signerName: '',
    signerCpf: '',
    signerRole: '',
    signerIp: ''
  });
  const [formData, setFormData] = useState({
    type: '',
    number: '',
    issueDate: new Date(),
    expirationDate: null as Date | null,
    fileUrl: '',
    description: ''
  });

  const { toast } = useToast();

  // Carregar tipos de documentos
  useEffect(() => {
    if (isOpen) {
      loadDocumentTypes();
      loadDocuments();
    }
  }, [isOpen, employeeId]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = documents.length;
    const signed = documents.filter(doc => doc.signed).length;
    const unsigned = total - signed;
    
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

    return { total, signed, unsigned, valid, expiring, expired };
  }, [documents]);

  // Filtrar documentos
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = (
        doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      const matchesType = typeFilter === 'ALL' || doc.type.displayName === typeFilter;
      
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
  }, [documents, searchTerm, statusFilter, typeFilter]);

  const loadDocumentTypes = async () => {
    try {
      const response = await fetch('/api/documents/types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const types = await response.json();
        setDocumentTypes(types);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de documentos:', error);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/employee/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar documentos do funcionário',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          issueDate: formData.issueDate.toISOString(),
          expirationDate: formData.expirationDate?.toISOString() || null,
          employee: { id: employeeId }
        })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Documento cadastrado com sucesso!'
        });
        setShowForm(false);
        resetForm();
        loadDocuments();
      } else {
        throw new Error('Erro ao cadastrar documento');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar documento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Documento excluído com sucesso!'
        });
        loadDocuments();
      } else {
        throw new Error('Erro ao excluir documento');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir documento',
        variant: 'destructive'
      });
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      // Se o documento tem uma URL, baixar diretamente
      if (document.fileUrl) {
        window.open(document.fileUrl, '_blank');
        return;
      }

      // Se não tem URL, tentar gerar PDF do backend
      const response = await fetch(`/api/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.type.displayName}_${document.number}.pdf`;
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

  const handleSignDocument = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          signerName: signatureData.signerName,
          signerCpf: signatureData.signerCpf,
          signerRole: signatureData.signerRole,
          signerIp: signatureData.signerIp || '127.0.0.1' // Fallback para desenvolvimento
        })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Documento assinado com sucesso!'
        });
        setShowViewer(false);
        setSelectedDocument(null);
        loadDocuments(); // Recarregar para mostrar status de assinatura
      } else {
        throw new Error('Erro ao assinar documento');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao assinar documento',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      number: '',
      issueDate: new Date(),
      expirationDate: null,
      fileUrl: '',
      description: ''
    });
  };

  const getDocumentTypeDisplayName = (type: string) => {
    const docType = documentTypes.find(t => t.displayName === type);
    return docType?.displayName || type;
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

  const getTypeIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('cpf') || typeLower.includes('rg')) return <User className="h-5 w-5 text-green-500" />;
    if (typeLower.includes('cnh')) return <Car className="h-5 w-5 text-purple-500" />;
    if (typeLower.includes('certidão') || typeLower.includes('nascimento') || typeLower.includes('casamento')) return <Heart className="h-5 w-5 text-pink-500" />;
    if (typeLower.includes('residência')) return <MapPin className="h-5 w-5 text-orange-500" />;
    if (typeLower.includes('trabalho') || typeLower.includes('contrato')) return <Building className="h-5 w-5 text-cyan-500" />;
    if (typeLower.includes('militar') || typeLower.includes('eleitor')) return <Shield className="h-5 w-5 text-red-500" />;
    return <FileText className="h-5 w-5 text-blue-500" />;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Documentos de {employeeName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dashboard de Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileSignature className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assinados</p>
                      <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendentes</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.unsigned}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Válidos</p>
                      <p className="text-2xl font-bold text-green-500">{stats.valid}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileClock className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expirando</p>
                      <p className="text-2xl font-bold text-yellow-500">{stats.expiring}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileX className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expirados</p>
                      <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros e Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      placeholder="Buscar por número, tipo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos os status</SelectItem>
                      <SelectItem value="VALID">Válidos</SelectItem>
                      <SelectItem value="EXPIRING">Expirando</SelectItem>
                      <SelectItem value="EXPIRED">Expirados</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos os tipos</SelectItem>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.displayName} value={type.displayName}>
                          {type.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setTypeFilter('ALL');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                  
                  <div className="text-sm text-gray-500">
                    {filteredDocuments.length} de {documents.length} documentos
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão para adicionar documento */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Documentos Cadastrados</h3>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Documento
              </Button>
            </div>

            {/* Lista de documentos */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando documentos...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum documento encontrado
                </h3>
                <p>
                  {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Não há documentos cadastrados para este funcionário.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDocuments.map((doc) => {
                  const docStatus = getDocumentStatus(doc);
                  return (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            {getTypeIcon(doc.type.displayName)}
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {getDocumentTypeDisplayName(doc.type.displayName)}
                                {doc.signed && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <FileSignature className="h-3 w-3 mr-1" />
                                    Assinado
                                  </Badge>
                                )}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">{doc.number}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              {docStatus.icon}
                              {docStatus.badge}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                                title="Visualizar documento"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadDocument(doc)}
                                title="Baixar documento"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(doc.id)}
                                className="text-destructive hover:text-destructive"
                                title="Excluir documento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Emissão:</span>
                            <p className="text-muted-foreground">{format(new Date(doc.issueDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                          </div>
                          {doc.expirationDate && (
                            <div>
                              <span className="font-medium">Vencimento:</span>
                              <p className="text-muted-foreground">{format(new Date(doc.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                            </div>
                          )}
                          {doc.signed && doc.signatureDate && (
                            <div>
                              <span className="font-medium">Assinado em:</span>
                              <p className="text-muted-foreground">{format(new Date(doc.signatureDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                            </div>
                          )}
                          {doc.signedBy && (
                            <div>
                              <span className="font-medium">Assinado por:</span>
                              <p className="text-muted-foreground">{doc.signedBy}</p>
                            </div>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{doc.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Formulário para adicionar documento */}
            {showForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Adicionar Novo Documento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Tipo de Documento</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map((type) => (
                              <SelectItem key={type.displayName} value={type.displayName}>
                                {type.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="number">Número</Label>
                        <Input
                          id="number"
                          value={formData.number}
                          onChange={(e) => setFormData({...formData, number: e.target.value})}
                          placeholder="Número do documento"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Data de Emissão</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.issueDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.issueDate ? format(formData.issueDate, "dd/MM/yyyy") : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.issueDate}
                              onSelect={(date) => date && setFormData({...formData, issueDate: date})}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label>Data de Vencimento (opcional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.expirationDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.expirationDate ? format(formData.expirationDate, "dd/MM/yyyy") : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.expirationDate}
                              onSelect={(date) => setFormData({...formData, expirationDate: date})}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="fileUrl">URL do Arquivo</Label>
                      <Input
                        id="fileUrl"
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                        placeholder="https://exemplo.com/arquivo.pdf"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Descrição adicional do documento"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Documento'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para visualizar e assinar documento */}
      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument && `${selectedDocument.type.displayName} - ${selectedDocument.number}`}
            </DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              {/* Informações do documento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações do Documento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">Tipo:</Label>
                      <p>{selectedDocument.type.displayName}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Número:</Label>
                      <p>{selectedDocument.number}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Data de Emissão:</Label>
                      <p>{format(new Date(selectedDocument.issueDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                    {selectedDocument.expirationDate && (
                      <div>
                        <Label className="font-medium">Data de Vencimento:</Label>
                        <p>{format(new Date(selectedDocument.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                      </div>
                    )}
                  </div>
                  {selectedDocument.description && (
                    <div className="mt-4">
                      <Label className="font-medium">Descrição:</Label>
                      <p>{selectedDocument.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status da assinatura */}
              {selectedDocument.signed ? (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <PenTool className="h-5 w-5" />
                      Documento Assinado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Assinado em:</strong> {selectedDocument.signatureDate && format(new Date(selectedDocument.signatureDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      {selectedDocument.signedBy && <p><strong>Assinado por:</strong> {selectedDocument.signedBy}</p>}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                      <PenTool className="h-5 w-5" />
                      Assinar Documento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={(e) => { e.preventDefault(); handleSignDocument(); }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signerName">Nome do Signatário</Label>
                          <Input
                            id="signerName"
                            value={signatureData.signerName}
                            onChange={(e) => setSignatureData({...signatureData, signerName: e.target.value})}
                            placeholder="Nome completo"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="signerCpf">CPF do Signatário</Label>
                          <Input
                            id="signerCpf"
                            value={signatureData.signerCpf}
                            onChange={(e) => setSignatureData({...signatureData, signerCpf: e.target.value})}
                            placeholder="000.000.000-00"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="signerRole">Cargo/Função</Label>
                        <Input
                          id="signerRole"
                          value={signatureData.signerRole}
                          onChange={(e) => setSignatureData({...signatureData, signerRole: e.target.value})}
                          placeholder="Cargo ou função do signatário"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="submit" className="flex items-center gap-2">
                          <PenTool className="h-4 w-4" />
                          Assinar Documento
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Botões de ação */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadDocument(selectedDocument)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Documento
                </Button>
                <Button variant="outline" onClick={() => setShowViewer(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}; 