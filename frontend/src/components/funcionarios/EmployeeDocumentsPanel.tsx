import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import DocumentViewerModal from './DocumentViewerModal';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  PenTool,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  FileX,
  FileClock,
  FileSignature,
  Plus,
  Users,
  FolderOpen,
  Calendar,
  Building,
  User,
  Shield,
  Heart,
  MapPin,
  Car,
  CreditCard,
  GraduationCap,
  Trash2,
  Edit,
  Share2,
  Star,
  TrendingUp
} from 'lucide-react';
import { documentService, Document as ApiDocument } from '@/services/documentService';
import { useToast } from '@/hooks/use-toast';

// Tipagem local que a UI deste painel utiliza
type PanelDocument = {
  id: string;
  type: string;
  status: 'ASSINADO' | 'PENDENTE' | 'VENCIDO';
  generatedAt?: string;
  signedAt?: string | null;
  signedBy?: string | null;
  url?: string | null;
  category: string; // derivada
  priority: 'Alta' | 'Média' | 'Baixa'; // derivada
  employee?: { name?: string } | null;
};

const documentCategories = [
  'Compliance',
  'Trabalho',
  'Responsabilidade',
  'Registro',
  'Segurança',
  'Treinamento',
  'Outros'
];

const priorityLevels = [
  'Alta',
  'Média',
  'Baixa'
];

const EmployeeDocumentsPanel = () => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<PanelDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const apiDocs = await documentService.getAllDocuments();
        const mapped: PanelDocument[] = apiDocs.map((d: ApiDocument & { signed?: boolean; signatureDate?: string; signedBy?: string; }) => {
          const now = new Date();
          const exp = d.expirationDate ? new Date(d.expirationDate) : null;
          const isExpired = !!(exp && exp.getTime() <= now.getTime());
          const status: 'ASSINADO' | 'PENDENTE' | 'VENCIDO' = d['signed'] ? 'ASSINADO' : (isExpired ? 'VENCIDO' : 'PENDENTE');

          // prioridade baseada em vencimento
          let priority: 'Alta' | 'Média' | 'Baixa' = 'Baixa';
          if (isExpired) {
            priority = 'Alta';
          } else if (exp && (exp.getTime() - now.getTime()) <= 30 * 24 * 60 * 60 * 1000) {
            priority = 'Média';
          }

          // categoria simples derivada do tipo
          const category = mapTypeToCategory(String(d.type));

          return {
            id: d.id,
            type: String(d.type),
            status,
            generatedAt: d.issueDate || d.createdAt,
            signedAt: (d as any).signatureDate || null,
            signedBy: (d as any).signedBy || null,
            url: d.fileUrl || null,
            category,
            priority,
            employee: null
          };
        });
        setDocs(mapped);
      } catch (error) {
        toast({ title: 'Erro', description: 'Falha ao carregar documentos.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const mapTypeToCategory = (type: string): string => {
    switch (type) {
      case 'CONTRATO_TRABALHO':
      case 'CARTEIRA_TRABALHO':
        return 'Trabalho';
      case 'CPF':
      case 'RG':
      case 'COMPROVANTE_RESIDENCIA':
        return 'Registro';
      default:
        return 'Outros';
    }
  };

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = docs.length;
    const signed = docs.filter(doc => doc.status === 'ASSINADO').length;
    const pending = docs.filter(doc => doc.status === 'PENDENTE').length;
    const expired = docs.filter(doc => doc.status === 'VENCIDO').length;
    
    return { total, signed, pending, expired };
  }, [docs]);

  // Filtrar documentos
  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (
        doc.type.toLowerCase().includes(term) ||
        doc.category.toLowerCase().includes(term)
      );
      const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
      const matchesPriority = priorityFilter === 'ALL' || doc.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [docs, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  const handleView = (doc) => {
    setSelectedDoc(doc);
    setOpen(true);
  };

  const handleSign = (docId) => {
    setDocs(docs.map(d => d.id === docId ? {
      ...d,
      status: 'ASSINADO',
      signedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      signedBy: d.employee.name,
      hash: 'mockedhash' + docId
    } : d));
    setOpen(false);
  };

  const handleDelete = (docId) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      setDocs(docs.filter(d => d.id !== docId));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ASSINADO':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Assinado</Badge>;
      case 'PENDENTE':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'VENCIDO':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Vencido</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Alta':
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case 'Média':
        return <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>;
      case 'Baixa':
        return <Badge className="bg-green-100 text-green-800">Baixa</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Compliance':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'Trabalho':
        return <Building className="h-4 w-4 text-cyan-500" />;
      case 'Responsabilidade':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'Registro':
        return <User className="h-4 w-4 text-green-500" />;
      case 'Segurança':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'Treinamento':
        return <GraduationCap className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Buscar por tipo, categoria..."
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
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="ASSINADO">Assinados</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="VENCIDO">Vencidos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as categorias</SelectItem>
                {documentCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as prioridades</SelectItem>
                {priorityLevels.map(priority => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
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
                setCategoryFilter('ALL');
                setPriorityFilter('ALL');
              }}
            >
              Limpar Filtros
            </Button>
            
            <div className="text-sm text-gray-500">
              {filteredDocs.length} de {docs.length} documentos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos ({filteredDocs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando documentos...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Não há documentos cadastrados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocs.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(doc.category)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{doc.type}</h3>
                              {getStatusBadge(doc.status)}
                              {getPriorityBadge(doc.priority)}
                            </div>
                            <p className="text-sm text-gray-500">{doc.category}</p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                              <span>Gerado: {doc.generatedAt}</span>
                              {doc.signedAt && <span>Assinado: {doc.signedAt}</span>}
                              {doc.signedBy && <span>Por: {doc.signedBy}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                          title="Visualizar documento"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                          title="Baixar documento"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {doc.status === 'PENDENTE' && (
                          <Button
                            size="sm"
                            onClick={() => handleView(doc)}
                            title="Assinar documento"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <PenTool className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Excluir documento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentViewerModal open={open} onOpenChange={setOpen} document={selectedDoc} onSign={handleSign} />
    </div>
  );
};

export default EmployeeDocumentsPanel; 