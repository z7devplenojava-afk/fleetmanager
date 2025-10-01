import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2, Download, Eye, Upload, Calendar, Hash, User, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { documentService, Document, DocumentType } from '@/services/documentService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeDocumentsProps {
  employeeId: string;
  employeeName: string;
}

export const EmployeeDocuments: React.FC<EmployeeDocumentsProps> = ({
  employeeId,
  employeeName
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDocument, setNewDocument] = useState({
    type: '' as DocumentType,
    number: '',
    issueDate: '',
    expirationDate: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
    loadDocumentTypes();
  }, [employeeId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocumentsByEmployee(employeeId);
      setDocuments(data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentTypes = async () => {
    try {
      const types = await documentService.getDocumentTypes();
      setDocumentTypes(types);
    } catch (error) {
      console.error('Erro ao carregar tipos de documento:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddDocument = async () => {
    if (!selectedFile || !newDocument.type || !newDocument.number || !newDocument.issueDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios e selecione um arquivo.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Criar documento
      const documentData = {
        type: newDocument.type,
        number: newDocument.number,
        issueDate: new Date(newDocument.issueDate),
        expirationDate: newDocument.expirationDate ? new Date(newDocument.expirationDate) : null,
        description: newDocument.description,
        fileUrl: selectedFile ? selectedFile.name : 'temp-file-url',
        fileName: selectedFile ? selectedFile.name : 'temp-file-name',
        employee: { id: employeeId }
      };

      const createdDocument = await documentService.createDocument(documentData);
      
      // Upload do arquivo
      await documentService.uploadFile(createdDocument.id, selectedFile);
      
      toast({
        title: "Sucesso",
        description: "Documento adicionado com sucesso!",
      });
      
      // Limpar formulário
      setNewDocument({
        type: '' as DocumentType,
        number: '',
        issueDate: '',
        expirationDate: '',
        description: ''
      });
      setSelectedFile(null);
      setShowAddForm(false);
      
      // Recarregar documentos
      loadDocuments();
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o documento.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      await documentService.deleteDocument(documentId);
      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso!",
      });
      loadDocuments();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadFile = async (documentId: string, fileName: string) => {
    try {
      const blob = await documentService.downloadFile(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'documento';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive"
      });
    }
  };

  const handleViewFile = async (documentId: string) => {
    try {
      const blob = await documentService.downloadFile(documentId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível visualizar o arquivo.",
        variant: "destructive"
      });
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      CPF: 'CPF',
      RG: 'RG',
      CNH: 'CNH',
      TITULO_ELEITOR: 'Título de Eleitor',
      CERTIDAO_NASCIMENTO: 'Certidão de Nascimento',
      CERTIDAO_CASAMENTO: 'Certidão de Casamento',
      COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
      CONTRATO_TRABALHO: 'Contrato de Trabalho',
      CARTEIRA_TRABALHO: 'Carteira de Trabalho',
      CERTIFICADO_MILITAR: 'Certificado Militar',
      OUTROS: 'Outros'
    };
    return labels[type] || type;
  };

  const getStatusColor = (document: Document) => {
    if (!document.expirationDate) return 'bg-gray-100 text-gray-800';
    
    const today = new Date();
    const expirationDate = new Date(document.expirationDate);
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return 'bg-red-100 text-red-800';
    if (daysUntilExpiration <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (document: Document) => {
    if (!document.expirationDate) return 'Sem expiração';
    
    const today = new Date();
    const expirationDate = new Date(document.expirationDate);
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return 'Expirado';
    if (daysUntilExpiration <= 30) return 'Expira em breve';
    return 'Válido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-seguranca-red" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-seguranca-lightgray">
            Documentos de {employeeName}
          </h2>
          <p className="text-seguranca-lightgray">
            {documents.length} documento{documents.length !== 1 ? 's' : ''} cadastrado{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-seguranca-yellow hover:bg-yellow-600 text-black"
        >
          <Plus size={20} className="mr-2" />
          Adicionar Documento
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">Novo Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type" className="text-seguranca-lightgray">Tipo de Documento *</Label>
                <Select 
                  value={newDocument.type} 
                  onValueChange={(value) => setNewDocument({...newDocument, type: value as DocumentType})}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-seguranca-lightgray">
                        {getDocumentTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="number" className="text-seguranca-lightgray">Número *</Label>
                <Input
                  id="number"
                  value={newDocument.number}
                  onChange={(e) => setNewDocument({...newDocument, number: e.target.value})}
                  placeholder="Número do documento"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div>
                <Label htmlFor="issueDate" className="text-seguranca-lightgray">Data de Emissão *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={newDocument.issueDate}
                  onChange={(e) => setNewDocument({...newDocument, issueDate: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div>
                <Label htmlFor="expirationDate" className="text-seguranca-lightgray">Data de Expiração</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={newDocument.expirationDate}
                  onChange={(e) => setNewDocument({...newDocument, expirationDate: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-seguranca-lightgray">Descrição</Label>
              <Input
                id="description"
                value={newDocument.description}
                onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                placeholder="Descrição adicional (opcional)"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            
            <div>
              <Label htmlFor="file" className="text-seguranca-lightgray">Arquivo *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
              {selectedFile && (
                <p className="text-sm text-seguranca-lightgray mt-1">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleAddDocument}
                disabled={uploading}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? 'Enviando...' : 'Adicionar Documento'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {documents.map((document) => (
          <Card 
            key={document.id} 
            className="bg-seguranca-graphite border-gray-600 hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-seguranca-red rounded-full flex items-center justify-center">
                    <FileText className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-seguranca-lightgray">
                      {getDocumentTypeLabel(document.type)}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-seguranca-lightgray">
                      <div className="flex items-center space-x-1">
                        <Hash size={16} />
                        <span>{document.number}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={16} />
                        <span>Emissão: {new Date(document.issueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {document.expirationDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar size={16} />
                          <span>Expira: {new Date(document.expirationDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {document.fileName && (
                        <div className="flex items-center space-x-1">
                          <FileText size={16} />
                          <span>{document.fileName}</span>
                        </div>
                      )}
                    </div>
                    {document.description && (
                      <p className="text-sm text-seguranca-lightgray mt-2">
                        {document.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(document)}>
                    {getStatusText(document)}
                  </Badge>
                  
                  {document.fileUrl && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-blue-600 text-blue-400 hover:bg-blue-900"
                        onClick={() => handleViewFile(document.id)}
                      >
                        <Eye size={16} className="mr-1" />
                        Visualizar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-green-600 text-green-400 hover:bg-green-900"
                        onClick={() => handleDownloadFile(document.id, document.fileName || 'documento')}
                      >
                        <Download size={16} className="mr-1" />
                        Baixar
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-600 text-red-400 hover:bg-red-900"
                    onClick={() => handleDeleteDocument(document.id)}
                  >
                    <Trash2 size={16} className="mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Nenhum documento cadastrado
            </h3>
            <p className="text-seguranca-lightgray">
              Clique em "Adicionar Documento" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};