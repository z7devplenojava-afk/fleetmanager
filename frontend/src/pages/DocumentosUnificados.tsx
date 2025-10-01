import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
    FileText, 
    Download, 
    Mail, 
    MessageCircle, 
    Eye, 
    Plus, 
    CheckCircle, 
    XCircle,
    AlertCircle,
    Phone,
    User,
    Calendar
} from 'lucide-react';

interface UnifiedDocument {
    id: string;
    employeeName: string;
    month: number;
    year: number;
    filePath: string;
    fileName: string;
    createdAt: string;
    fileSize: number;
}

interface EmailForm {
    toEmail: string;
    employeeName: string;
    month: number;
    year: number;
    filePath: string;
}

interface WhatsAppForm {
    phoneNumber: string;
    employeeName: string;
    month: number;
    year: number;
}

const DocumentosUnificados: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [documents, setDocuments] = useState<UnifiedDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Estados para criação de documento
    const [createForm, setCreateForm] = useState({
        employeeName: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    
    // Estados para email
    const [emailForm, setEmailForm] = useState<EmailForm>({
        toEmail: '',
        employeeName: '',
        month: 0,
        year: 0,
        filePath: ''
    });
    
    // Estados para WhatsApp
    const [whatsappForm, setWhatsappForm] = useState<WhatsAppForm>({
        phoneNumber: '',
        employeeName: '',
        month: 0,
        year: 0
    });
    
    // Estados de feedback
    const [emailSent, setEmailSent] = useState(false);
    const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadDocuments();
        }
    }, [isAuthenticated]);

    const loadDocuments = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Buscar documentos unificados do backend
            const response = await axios.get('/api/unified-documents/list');
            
            if (response.data.sucesso) {
                setDocuments(response.data.documents.map((doc: any) => ({
                    id: doc.fileName || Math.random().toString(),
                    employeeName: doc.employeeName || 'Nome não identificado',
                    month: extractMonthFromFileName(doc.fileName),
                    year: extractYearFromFileName(doc.fileName),
                    filePath: doc.filePath,
                    fileName: doc.fileName,
                    createdAt: doc.createdAt || new Date().toISOString(),
                    fileSize: doc.fileSize || 0,
                    type: doc.type || 'DOCUMENTO'
                })));
            } else {
                setError(response.data.mensagem || 'Erro ao carregar documentos');
            }
            
        } catch (err: any) {
            setError('Erro ao carregar documentos: ' + (err.response?.data?.mensagem || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Função para extrair mês do nome do arquivo
    const extractMonthFromFileName = (fileName: string): number => {
        try {
            const match = fileName.match(/_(\d{2})_(\d{4})/);
            return match ? parseInt(match[1]) : new Date().getMonth() + 1;
        } catch {
            return new Date().getMonth() + 1;
        }
    };

    // Função para extrair ano do nome do arquivo
    const extractYearFromFileName = (fileName: string): number => {
        try {
            const match = fileName.match(/_(\d{2})_(\d{4})/);
            return match ? parseInt(match[2]) : new Date().getFullYear();
        } catch {
            return new Date().getFullYear();
        }
    };

    const createUnifiedDocument = async () => {
        if (!createForm.employeeName.trim()) {
            setError('Nome do funcionário é obrigatório');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post('/api/unified-documents/create', null, {
                params: {
                    employeeName: createForm.employeeName,
                    month: createForm.month,
                    year: createForm.year
                }
            });

            if (response.data.sucesso) {
                // Recarregar documentos
                await loadDocuments();
                
                // Resetar formulário
                setCreateForm({
                    employeeName: '',
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                });
                
                setError(null);
            } else {
                setError(response.data.mensagem || 'Erro ao criar documento');
            }
            
        } catch (err: any) {
            setError('Erro ao criar documento: ' + (err.response?.data?.mensagem || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleViewDocument = (document: UnifiedDocument) => {
        // Abrir PDF em nova aba
        window.open(`http://localhost:8081/${document.filePath}`, '_blank');
    };

    const handleDownloadDocument = (document: UnifiedDocument) => {
        // Download do arquivo
        const link = document.createElement('a');
        link.href = `http://localhost:8081/${document.filePath}`;
        link.download = document.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendEmail = async (document: UnifiedDocument) => {
        setEmailForm({
            toEmail: '',
            employeeName: document.employeeName,
            month: document.month,
            year: document.year,
            filePath: document.filePath
        });
        setShowEmailDialog(true);
    };

    const sendEmail = async () => {
        if (!emailForm.toEmail.trim()) {
            setError('Email é obrigatório');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post('/api/unified-documents/send-email', null, {
                params: emailForm
            });

            if (response.data.sucesso) {
                setEmailSent(true);
                setShowEmailDialog(false);
                setTimeout(() => setEmailSent(false), 3000);
            } else {
                setError(response.data.mensagem || 'Erro ao enviar email');
            }
            
        } catch (err: any) {
            setError('Erro ao enviar email: ' + (err.response?.data?.mensagem || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSendWhatsApp = async (document: UnifiedDocument) => {
        setWhatsappForm({
            phoneNumber: '',
            employeeName: document.employeeName,
            month: document.month,
            year: document.year
        });
        setShowWhatsappDialog(true);
    };

    const generateWhatsAppLink = async () => {
        if (!whatsappForm.phoneNumber.trim()) {
            setError('Número de telefone é obrigatório');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post('/api/unified-documents/whatsapp-link', null, {
                params: whatsappForm
            });

            if (response.data.sucesso) {
                setWhatsappLink(response.data.whatsappLink);
            } else {
                setError(response.data.mensagem || 'Erro ao gerar link do WhatsApp');
            }
            
        } catch (err: any) {
            setError('Erro ao gerar link do WhatsApp: ' + (err.response?.data?.mensagem || err.message));
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = () => {
        if (whatsappLink) {
            window.open(whatsappLink, '_blank');
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
                        <p className="text-gray-600">Faça login para acessar os documentos unificados.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 Documentos Unificados</h1>
                <p className="text-gray-600">
                    Gerencie documentos que combinam holerite e recibo de pagamento em um único arquivo.
                </p>
            </div>

            <Tabs defaultValue="documents" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="documents">📋 Documentos</TabsTrigger>
                    <TabsTrigger value="create">➕ Criar Novo</TabsTrigger>
                    <TabsTrigger value="tools">🛠️ Ferramentas</TabsTrigger>
                </TabsList>

                {/* TAB: Documentos */}
                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Lista de Documentos Unificados
                            </CardTitle>
                            <CardDescription>
                                Visualize, baixe e compartilhe seus documentos unificados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Carregando documentos...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                    <p className="text-red-600">{error}</p>
                                    <Button onClick={loadDocuments} className="mt-4">Tentar Novamente</Button>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">Nenhum documento unificado encontrado</p>
                                    <p className="text-sm text-gray-500">Crie seu primeiro documento na aba "Criar Novo"</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {documents.map((doc) => (
                                        <Card key={doc.id} className="border-l-4 border-l-blue-500">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-semibold text-lg">{doc.employeeName}</h3>
                                                            <Badge variant="secondary">
                                                                {doc.month}/{doc.year}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <span className="flex items-center gap-1">
                                                                <FileText className="h-4 w-4" />
                                                                {doc.fileName}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                {formatDate(doc.createdAt)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Download className="h-4 w-4" />
                                                                {formatFileSize(doc.fileSize)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewDocument(doc)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Visualizar
                                                        </Button>
                                                        
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownloadDocument(doc)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Baixar
                                                        </Button>
                                                        
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSendEmail(doc)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                            Email
                                                        </Button>
                                                        
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSendWhatsApp(doc)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <MessageCircle className="h-4 w-4" />
                                                            WhatsApp
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
                </TabsContent>

                {/* TAB: Criar Novo */}
                <TabsContent value="create" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Criar Novo Documento Unificado
                            </CardTitle>
                            <CardDescription>
                                Combine holerite e recibo de pagamento em um único arquivo
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="h-4 w-4 inline mr-2" />
                                        Nome do Funcionário
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: RICARDO XAVIER DE ANDRADE"
                                        value={createForm.employeeName}
                                        onChange={(e) => setCreateForm({...createForm, employeeName: e.target.value})}
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Calendar className="h-4 w-4 inline mr-2" />
                                            Mês
                                        </label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={createForm.month}
                                            onChange={(e) => setCreateForm({...createForm, month: parseInt(e.target.value)})}
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Calendar className="h-4 w-4 inline mr-2" />
                                            Ano
                                        </label>
                                        <Input
                                            type="number"
                                            min="2020"
                                            max="2030"
                                            value={createForm.year}
                                            onChange={(e) => setCreateForm({...createForm, year: parseInt(e.target.value)})}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                
                                <Button
                                    onClick={createUnifiedDocument}
                                    disabled={loading || !createForm.employeeName.trim()}
                                    className="w-full"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Criando Documento...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Criar Documento Unificado
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: Ferramentas */}
                <TabsContent value="tools" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Teste de Email
                                </CardTitle>
                                <CardDescription>
                                    Verifique se a configuração de email está funcionando
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={async () => {
                                        try {
                                            const response = await axios.get('/api/unified-documents/test-email');
                                            if (response.data.sucesso) {
                                                alert('✅ Configuração de email funcionando!');
                                            } else {
                                                alert('❌ Erro na configuração de email');
                                            }
                                        } catch (err: any) {
                                            alert('❌ Erro ao testar email: ' + err.message);
                                        }
                                    }}
                                    className="w-full"
                                >
                                    Testar Configuração de Email
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    Teste do WhatsApp
                                </CardTitle>
                                <CardDescription>
                                    Verifique se a configuração do WhatsApp está funcionando
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={async () => {
                                        try {
                                            const response = await axios.get('/api/unified-documents/test-whatsapp');
                                            if (response.data.sucesso) {
                                                alert('✅ Configuração do WhatsApp funcionando!');
                                            } else {
                                                alert('❌ Erro na configuração do WhatsApp');
                                            }
                                        } catch (err: any) {
                                            alert('❌ Erro ao testar WhatsApp: ' + err.message);
                                        }
                                    }}
                                    className="w-full"
                                >
                                    Testar Configuração do WhatsApp
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* DIALOG: Enviar Email */}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>📧 Enviar Documento por Email</DialogTitle>
                        <DialogDescription>
                            Envie o documento unificado por email com anexo
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email do Destinatário
                            </label>
                            <Input
                                type="email"
                                placeholder="exemplo@email.com"
                                value={emailForm.toEmail}
                                onChange={(e) => setEmailForm({...emailForm, toEmail: e.target.value})}
                            />
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <strong>Documento:</strong> {emailForm.employeeName} - {emailForm.month}/{emailForm.year}
                            </p>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button
                                onClick={sendEmail}
                                disabled={loading || !emailForm.toEmail.trim()}
                                className="flex-1"
                            >
                                {loading ? 'Enviando...' : 'Enviar Email'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowEmailDialog(false)}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DIALOG: Enviar WhatsApp */}
            <Dialog open={showWhatsappDialog} onOpenChange={setShowWhatsappDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>📱 Compartilhar via WhatsApp</DialogTitle>
                        <DialogDescription>
                            Gere um link para compartilhar o documento via WhatsApp
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="h-4 w-4 inline mr-2" />
                                Número de Telefone
                            </label>
                            <Input
                                type="tel"
                                placeholder="(11) 99999-9999"
                                value={whatsappForm.phoneNumber}
                                onChange={(e) => setWhatsappForm({...whatsappForm, phoneNumber: e.target.value})}
                            />
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <strong>Documento:</strong> {whatsappForm.employeeName} - {whatsappForm.month}/{whatsappForm.year}
                            </p>
                        </div>
                        
                        {!whatsappLink ? (
                            <div className="flex gap-2">
                                <Button
                                    onClick={generateWhatsAppLink}
                                    disabled={loading || !whatsappForm.phoneNumber.trim()}
                                    className="flex-1"
                                >
                                    {loading ? 'Gerando...' : 'Gerar Link do WhatsApp'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowWhatsappDialog(false)}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-800">
                                        ✅ Link do WhatsApp gerado com sucesso!
                                    </p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <Button
                                        onClick={openWhatsApp}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Abrir WhatsApp
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setWhatsappLink(null);
                                            setShowWhatsappDialog(false);
                                        }}
                                    >
                                        Fechar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* FEEDBACK: Email Enviado */}
            {emailSent && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Email enviado com sucesso!</span>
                </div>
            )}
        </div>
    );
};

export default DocumentosUnificados;
