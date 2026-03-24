import React, { useState, useEffect, useCallback } from 'react';
import axios from '../lib/axios';
import { useToast } from '@/hooks/use-toast';
import { ContactValidationModal } from '@/components/contact-validation/ContactValidationModal';
import { DocumentSendValidationModal } from '@/components/DocumentSendValidationModal';
import { employeeService } from '@/services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/environment';
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
    Calendar,
    RefreshCw,
    Trash2,
    CheckSquare,
    Square,
    FileDown,
    Search,
    AlertTriangle,
    ExternalLink,
    Building2,
    X
} from 'lucide-react';

interface UnifiedDocument {
    id: string;
    employeeName: string;
    month: number;
    year: number;
    filePath: string;
    fileName: string;
    createdAt: string;
    createdAtFormatted?: string;
    fileSize: number;
    unificationType?: 'INDIVIDUAL' | 'BATCH' | 'UNKNOWN';
    unificationTypeLabel?: string;
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

// Componente para item de documento com carregamento individual via AJAX
const DocumentItem: React.FC<{
    doc: UnifiedDocument;
    loadDocumentPayslipData: (doc: UnifiedDocument) => Promise<UnifiedDocument>;
    formatCpf: (cpf?: string) => string;
    handleViewDocument: (doc: UnifiedDocument) => void;
    handleDownloadDocument: (doc: UnifiedDocument) => void;
    handleSendEmail: (doc: UnifiedDocument) => void;
    handleSendWhatsApp: (doc: UnifiedDocument) => void;
    toast: any;
}> = ({ doc, loadDocumentPayslipData, formatCpf, handleViewDocument, handleDownloadDocument, handleSendEmail, handleSendWhatsApp, toast }) => {
    const [docWithPayslip, setDocWithPayslip] = useState<UnifiedDocument>(doc);
    const [loadingPayslip, setLoadingPayslip] = useState(false);

    useEffect(() => {
        // Se não tem dados do holerite, carregar via AJAX
        if (!(doc as any).payslipData && doc.employeeName) {
            setLoadingPayslip(true);
            loadDocumentPayslipData(doc).then(enrichedDoc => {
                setDocWithPayslip(enrichedDoc);
                setLoadingPayslip(false);
            }).catch(() => {
                setLoadingPayslip(false);
            });
        }
    }, [doc.id, doc.employeeName]);

    const payslipData = (docWithPayslip as any).payslipData;
    
    // Extrair sigla da empresa
    const getCompanySigla = (companyName?: string): string => {
        if (!companyName) return '';
        const words = companyName.toUpperCase().split(/\s+/);
        if (words.length >= 2) {
            return words.slice(0, 2).map(w => w.substring(0, 2)).join('');
        }
        return companyName.substring(0, 4).toUpperCase();
    };

    return (
        <div
            key={doc.id}
            className="bg-seguranca-black border border-gray-700 rounded-lg p-3 hover:border-seguranca-yellow transition-colors"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="font-semibold text-seguranca-lightgray text-lg">
                            {doc.employeeName || 'Nome não informado'}
                        </div>
                        {payslipData?.companyName && (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-seguranca-yellow/20 text-seguranca-yellow">
                                {getCompanySigla(payslipData.companyName)}
                            </span>
                        )}
                        {loadingPayslip && (
                            <span className="text-xs text-gray-400">Carregando dados...</span>
                        )}
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                        <span className="font-semibold text-seguranca-red">CPF:</span>{' '}
                        <span className="font-mono text-white">
                            {payslipData?.cpf ? formatCpf(payslipData.cpf) : 'Não informado'}
                        </span>
                        {' | '}
                        <span className="font-semibold text-seguranca-red">Período:</span>{' '}
                        <span className="font-mono text-white">
                            {String(doc.month || 0).padStart(2, '0')}/{doc.year || 0}
                        </span>
                        {payslipData?.workPostName && (
                            <>
                                {' | '}
                                <span className="font-semibold text-seguranca-red">Setor:</span>{' '}
                                <span className="text-white">{payslipData.workPostName}</span>
                            </>
                        )}
                    </div>
                    
                    {/* Localização na estrutura organizada - usando dados do holerite */}
                    {payslipData && (
                        <div className="bg-seguranca-graphite/50 border border-gray-600 rounded p-2 mt-2">
                            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span className="font-semibold">Localização:</span>
                            </div>
                            <div className="text-xs text-gray-300 space-y-1">
                                {payslipData.companyName && (
                                    <div>
                                        <span className="text-seguranca-yellow">Empresa:</span>{' '}
                                        <span className="text-white">{payslipData.companyName}</span>
                                    </div>
                                )}
                                {payslipData.workPostName && (
                                    <div>
                                        <span className="text-seguranca-yellow">Setor:</span>{' '}
                                        <span className="text-white">{payslipData.workPostName}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-seguranca-yellow">Período:</span>{' '}
                                    <span className="text-white">
                                        {String(doc.month).padStart(2, '0')}/{doc.year}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Button
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        className="bg-seguranca-red hover:bg-seguranca-darkred"
                    >
                        <FileText className="h-4 w-4 mr-1" />
                        Visualizar
                    </Button>
                    {payslipData && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                toast({
                                    title: "Navegação",
                                    description: "Funcionalidade de navegação em desenvolvimento",
                                });
                            }}
                            className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow/10"
                        >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ir até
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

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

    // Estados para seleção e exclusão em lote
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
    const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Estados para validação de contatos e envio
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationSendType, setValidationSendType] = useState<'email' | 'whatsapp' | 'both'>('whatsapp');
    const [resolvedEmployeeIds, setResolvedEmployeeIds] = useState<string[]>([]);
    
    // Estados para validação de envio individual
    const [showSendValidationModal, setShowSendValidationModal] = useState(false);
    const [sendValidationResult, setSendValidationResult] = useState<any>(null);
    const [pendingSendDocument, setPendingSendDocument] = useState<UnifiedDocument | null>(null);
    const [pendingSendType, setPendingSendType] = useState<'email' | 'whatsapp'>('whatsapp');

    const { toast } = useToast();

    // Estados para filtros
    const [unificationTypeFilter, setUnificationTypeFilter] = useState<'all' | 'INDIVIDUAL' | 'BATCH' | 'UNKNOWN'>('all');
    const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
    const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
    
    // Estados para pesquisa (busca local em tempo real, igual ao Holerite)
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para análise de falhas
    const [failedUnifications, setFailedUnifications] = useState<any[]>([]);
    const [showFailedAnalysis, setShowFailedAnalysis] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadDocuments();
        }
    }, [isAuthenticated]);

    // Auto-refresh quando a página ganha foco (usuário volta para a aba)
    useEffect(() => {
        const handleFocus = () => {
            if (isAuthenticated && !loading) {
                console.log('🔄 Página ganhou foco - recarregando documentos...');
                loadDocuments();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [isAuthenticated, loading]);

    // Função para carregar dados individuais de um documento unificado via AJAX
    const loadDocumentPayslipData = async (doc: UnifiedDocument): Promise<UnifiedDocument> => {
        // Se já tem dados do holerite, retornar sem buscar
        if ((doc as any).payslipData) {
            return doc;
        }

        try {
            // Buscar dados do holerite via AJAX para este documento específico
            const response = await axios.get('/api/payslips/list', {
                params: {
                    employeeName: doc.employeeName,
                    month: doc.month,
                    year: doc.year
                }
            });

            if (response.data && Array.isArray(response.data)) {
                const payslips = response.data;
                
                // Tentar encontrar holerite correspondente
                const matchingPayslip = payslips.find((p: any) => {
                    if (!p.employeeName || !doc.employeeName) return false;
                    const payslipName = p.employeeName.toLowerCase().trim();
                    const docName = doc.employeeName.toLowerCase().trim();
                    return payslipName === docName && p.month === doc.month && p.year === doc.year;
                });
                
                if (matchingPayslip) {
                    return {
                        ...doc,
                        payslipData: {
                            cpf: matchingPayslip.cpf,
                            companyName: matchingPayslip.companyName,
                            companyCnpj: matchingPayslip.companyCnpj,
                            workPostName: matchingPayslip.workPostName,
                            netValue: matchingPayslip.netValue
                        }
                    };
                }
            }
        } catch (error) {
            console.warn(`⚠️ Erro ao buscar dados do holerite para documento ${doc.fileName}:`, error);
        }
        
        return doc;
    };

    // Função para enriquecer documentos com dados do holerite (quando disponível)
    // Carrega em lote inicialmente, depois carrega individualmente quando necessário
    const enrichDocumentsWithPayslipData = async (docs: UnifiedDocument[]): Promise<UnifiedDocument[]> => {
        try {
            // Primeiro, tentar carregar todos os holerites de uma vez
            const payslipsResponse = await axios.get('/api/payslips/list');
            if (payslipsResponse.data && Array.isArray(payslipsResponse.data)) {
                const payslips = payslipsResponse.data;
                
                return docs.map(doc => {
                    // Se já tem dados do holerite, não precisa buscar novamente
                    if ((doc as any).payslipData) {
                        return doc;
                    }
                    
                    // Tentar encontrar holerite correspondente
                    const matchingPayslip = payslips.find((p: any) => {
                        if (!p.employeeName || !doc.employeeName) return false;
                        const payslipName = p.employeeName.toLowerCase().trim();
                        const docName = doc.employeeName.toLowerCase().trim();
                        return payslipName === docName && p.month === doc.month && p.year === doc.year;
                    });
                    
                    if (matchingPayslip) {
                        return {
                            ...doc,
                            payslipData: {
                                cpf: matchingPayslip.cpf,
                                companyName: matchingPayslip.companyName,
                                companyCnpj: matchingPayslip.companyCnpj,
                                workPostName: matchingPayslip.workPostName,
                                netValue: matchingPayslip.netValue
                            }
                        };
                    }
                    return doc;
                });
            }
        } catch (error) {
            console.warn('⚠️ Erro ao buscar dados do holerite para enriquecimento em lote:', error);
        }
        return docs;
    };

    const loadDocuments = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('🔄 Carregando documentos unificados...');

            // Tentar primeiro o endpoint detalhado público
            try {
                const response = await axios.get('/api/unified-documents/public/list-detailed');
                console.log('✅ Resposta do endpoint detalhado público:', response.data);

                if (response.data.sucesso) {
                    let mappedDocuments = response.data.documents.map((doc: any) => ({
                        id: doc.fileName || Math.random().toString(),
                        employeeName: doc.employeeName || 'Nome não identificado',
                        month: doc.month || extractMonthFromFileName(doc.fileName),
                        year: doc.year || extractYearFromFileName(doc.fileName),
                        filePath: doc.filePath,
                        fileName: doc.fileName,
                        createdAt: doc.createdAt || new Date().toISOString(),
                        createdAtFormatted: doc.createdAtFormatted,
                        fileSize: doc.fileSize || 0,
                        unificationType: doc.unificationType || 'UNKNOWN',
                        unificationTypeLabel: doc.unificationTypeLabel || 'Tipo Não Identificado',
                        payslipData: doc.payslipData || null // Dados do holerite quando disponível
                    }));

                    // Enriquecer com dados do holerite se não vieram do backend
                    mappedDocuments = await enrichDocumentsWithPayslipData(mappedDocuments);

                    console.log('📄 Documentos mapeados (detalhado):', mappedDocuments);
                    console.log(`📊 Estatísticas: Total: ${response.data.total}, Individuais: ${response.data.individualCount}, Em lote: ${response.data.batchCount}`);
                    console.log(`✅ ${mappedDocuments.length} documentos carregados e prontos para exibição`);
                    console.log('📋 Primeiros 5 documentos:', mappedDocuments.slice(0, 5).map(d => ({ nome: d.employeeName, mes: d.month, ano: d.year })));
                    setDocuments(mappedDocuments);
                    return;
                } else {
                    console.warn('⚠️ Endpoint detalhado público retornou erro:', response.data.mensagem);
                }
            } catch (detailedErr: unknown) {
                console.warn('⚠️ Erro no endpoint detalhado público:', detailedErr.message);
            }

            // Fallback para endpoint público
            console.log('🔄 Tentando endpoint público...');
            const publicResponse = await axios.get('/api/unified-documents/public/list');
            console.log('✅ Resposta do endpoint público:', publicResponse.data);

            if (publicResponse.data.sucesso) {
                let mappedDocuments = publicResponse.data.documents.map((doc: any) => ({
                    id: doc.fileName || Math.random().toString(),
                    employeeName: doc.employeeName || 'Nome não identificado',
                    month: doc.month || extractMonthFromFileName(doc.fileName),
                    year: doc.year || extractYearFromFileName(doc.fileName),
                    filePath: doc.filePath,
                    fileName: doc.fileName,
                    createdAt: doc.createdAt || new Date().toISOString(),
                    createdAtFormatted: doc.createdAtFormatted,
                    fileSize: doc.fileSize || 0,
                    unificationType: doc.fileName?.includes('UNIFICADO_') ? 'INDIVIDUAL' : 
                                   doc.fileName?.includes('BATCH_') ? 'BATCH' : 'UNKNOWN',
                    unificationTypeLabel: doc.fileName?.includes('UNIFICADO_') ? 'Unificação Individual' : 
                                        doc.fileName?.includes('BATCH_') ? 'Unificação em Lote' : 'Tipo Não Identificado',
                    payslipData: doc.payslipData || null
                }));

                // Enriquecer com dados do holerite se não vieram do backend
                mappedDocuments = await enrichDocumentsWithPayslipData(mappedDocuments);

                console.log('📄 Documentos mapeados (público):', mappedDocuments);
                setDocuments(mappedDocuments);
            } else {
                setError(publicResponse.data.mensagem || 'Erro ao carregar documentos');
            }

        } catch (err: unknown) {
            console.error('❌ Erro ao carregar documentos:', err);
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

        } catch (err: unknown) {
            setError('Erro ao criar documento: ' + (err.response?.data?.mensagem || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleViewDocument = (document: UnifiedDocument) => {
        // Abrir PDF em nova aba
        const baseUrl = import.meta.env.VITE_API_URL || getApiUrl();
        window.open(`${baseUrl.replace('/api', '')}/${document.filePath}`, '_blank');
    };

    const handleDownloadDocument = (document: UnifiedDocument) => {
        // Download do arquivo
        const baseUrl = import.meta.env.VITE_API_URL || getApiUrl();
        const link = document.createElement('a');
        link.href = `${baseUrl.replace('/api', '')}/${document.filePath}`;
        link.download = document.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendEmail = async (document: UnifiedDocument) => {
        setLoading(true);
        try {
            // Extrair CPF do nome do arquivo
            const cpfMatch = document.fileName?.match(/(\d{11})/);
            const cpf = cpfMatch ? cpfMatch[1] : null;

            if (!cpf) {
                toast({
                    title: '❌ CPF não encontrado',
                    description: 'Não foi possível identificar o CPF no documento. O arquivo deve conter o CPF no nome.',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            console.log('🔍 Validando usuário antes de enviar email...');
            console.log('📄 CPF extraído:', cpf);
            console.log('👤 Nome no arquivo:', document.employeeName);

            // VALIDAR usuário antes de enviar
            const validationResponse = await axios.get(`/api/user-validation/validate-by-cpf/${cpf}`);
            const validation = validationResponse.data;

            console.log('✅ Resultado da validação:', validation);

            // Verificar se nome confere
            const nameMatches = compareNames(document.employeeName, validation.name);
            
            if (!validation.valid || !validation.exists || !nameMatches || !validation.canSendEmail) {
                // Mostrar modal de validação com erro
                setPendingSendDocument(document);
                setPendingSendType('email');
                setSendValidationResult(validation);
                setShowSendValidationModal(true);
                setLoading(false);
                return;
            }

            // ✅ Validação OK - Enviar email
            console.log('✅ Validação OK - Enviando email para CPF:', cpf);

            const response = await axios.post('/api/envio/individual', {
                tipo: 'email',
                cpf: cpf,
                assunto: `Documento Unificado - ${document.month}/${document.year}`,
                mensagem: `Olá! Seu documento unificado (holerite + comprovante) de ${document.month}/${document.year} está anexo. Em caso de dúvidas, entre em contato com o RH.`
            });

            if (response.data.sucesso) {
                toast({
                    title: '✅ Email enviado',
                    description: `Documento enviado com sucesso para ${document.employeeName}`,
                });
            } else {
                toast({
                    title: '❌ Erro no envio',
                    description: response.data.mensagem || 'Falha ao enviar email',
                    variant: 'destructive',
                });
            }
        } catch (err: any) {
            console.error('❌ Erro ao enviar email:', err);
            toast({
                title: '❌ Erro',
                description: err.response?.data?.mensagem || 'Erro ao enviar email',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Função auxiliar para comparar nomes (ignorando maiúsculas e acentos)
    const compareNames = (name1: string, name2: string): boolean => {
        if (!name1 || !name2) return false;
        
        const normalize = (str: string) => str
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
            .replace(/[^A-Z0-9]/g, '')         // Remove caracteres especiais
            .trim();
        
        return normalize(name1) === normalize(name2);
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

        } catch (err: unknown) {
            setError('Erro ao enviar email: ' + (err.response?.data?.mensagem || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSendWhatsApp = async (document: UnifiedDocument) => {
        setLoading(true);
        try {
            // Extrair CPF do nome do arquivo
            const cpfMatch = document.fileName?.match(/(\d{11})/);
            const cpf = cpfMatch ? cpfMatch[1] : null;

            if (!cpf) {
                toast({
                    title: '❌ CPF não encontrado',
                    description: 'Não foi possível identificar o CPF no documento. O arquivo deve conter o CPF no nome.',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            console.log('🔍 Validando usuário antes de enviar WhatsApp...');
            console.log('📄 CPF extraído:', cpf);
            console.log('👤 Nome no arquivo:', document.employeeName);

            // VALIDAR usuário antes de enviar
            const validationResponse = await axios.get(`/api/user-validation/validate-by-cpf/${cpf}`);
            const validation = validationResponse.data;

            console.log('✅ Resultado da validação:', validation);

            // Verificar se nome confere
            const nameMatches = compareNames(document.employeeName, validation.name);
            
            if (!validation.valid || !validation.exists || !nameMatches || !validation.canSendWhatsApp) {
                // Mostrar modal de validação com erro
                setPendingSendDocument(document);
                setPendingSendType('whatsapp');
                setSendValidationResult(validation);
                setShowSendValidationModal(true);
                setLoading(false);
                return;
            }

            // ✅ Validação OK - Enviar WhatsApp
            console.log('✅ Validação OK - Enviando WhatsApp para CPF:', cpf);

            const response = await axios.post('/api/envio/individual', {
                tipo: 'whatsapp',
                cpf: cpf,
                mensagem: `Olá! Seu documento unificado (holerite + comprovante) de ${document.month}/${document.year} está disponível. Em caso de dúvidas, entre em contato com o RH.`
            });

            if (response.data.sucesso) {
                toast({
                    title: '✅ WhatsApp enviado',
                    description: `Documento enviado com sucesso para ${document.employeeName}`,
                });
            } else {
                const mensagemErro = response.data.mensagem || '';
                toast({
                    title: '❌ Erro no envio',
                    description: mensagemErro || 'Falha ao enviar WhatsApp',
                    variant: 'destructive',
                });
            }
        } catch (err: any) {
            console.error('❌ Erro ao enviar WhatsApp:', err);
            toast({
                title: '❌ Erro',
                description: err.response?.data?.mensagem || 'Erro ao enviar WhatsApp',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
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

        } catch (err: unknown) {
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

    // Callback após a validação: enviar para IDs prontos
    const handleValidated = async (validatedIds: string[]) => {
        if (validatedIds.length === 0) {
            toast({ title: 'Sem destinatários prontos', description: 'Nenhum funcionário pronto para envio.', variant: 'destructive' });
            return;
        }
        try {
            if (validationSendType === 'both') {
                await axios.post('/api/envio/massa', { tipo: 'email', funcionarioIds: validatedIds });
                await axios.post('/api/envio/massa', { tipo: 'whatsapp', funcionarioIds: validatedIds });
                toast({ title: 'Envio iniciado', description: `Email e WhatsApp para ${validatedIds.length} funcionário(s).` });
            } else {
                await axios.post('/api/envio/massa', { tipo: validationSendType, funcionarioIds: validatedIds });
                const label = validationSendType === 'email' ? 'Email' : 'WhatsApp';
                toast({ title: 'Envio iniciado', description: `${label} para ${validatedIds.length} funcionário(s).` });
            }
        } catch (e: any) {
            console.error('Erro ao iniciar envio em massa:', e);
            toast({ title: 'Erro no envio', description: e?.response?.data?.mensagem || 'Falha ao iniciar envio.', variant: 'destructive' });
        }
    };

    // Funções para seleção e exclusão em lote
    const handleSelectDocument = (documentId: string) => {
        setSelectedDocuments(prev =>
            prev.includes(documentId)
                ? prev.filter(id => id !== documentId)
                : [...prev, documentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedDocuments.length === documents.length) {
            setSelectedDocuments([]);
        } else {
            setSelectedDocuments(documents.map(doc => doc.id));
        }
    };

    // Resolver IDs de funcionários para os documentos selecionados
    const resolveEmployeeIdsForSelected = async (): Promise<string[]> => {
        const selected = documents.filter(doc => selectedDocuments.includes(doc.id));
        const ids: string[] = [];

        for (const doc of selected) {
            // 1) Tentar por CPF no fileName
            let cpfMatch: string | null = null;
            try {
                const match = doc.fileName?.match(/(\d{11})/);
                cpfMatch = match ? match[1] : null;
            } catch {}

            if (cpfMatch) {
                try {
                    const byCpf = await employeeService.searchEmployees(cpfMatch);
                    if (byCpf && byCpf.length === 1) {
                        ids.push(byCpf[0].id);
                        continue;
                    }
                } catch {}
            }

            // 2) Fallback: buscar por nome
            try {
                const byName = await employeeService.searchEmployeesByName(doc.employeeName);
                if (byName && byName.length === 1) {
                    ids.push(byName[0].id);
                    continue;
                }
            } catch {}
        }

        return Array.from(new Set(ids));
    };

    const handleSendSelected = async (type: 'email' | 'whatsapp' | 'both') => {
        if (selectedDocuments.length === 0) {
            toast({ title: 'Selecione documentos', description: 'Nenhum documento selecionado.', variant: 'destructive' });
            return;
        }

        const ids = await resolveEmployeeIdsForSelected();
        if (ids.length === 0) {
            toast({ title: 'Não foi possível identificar funcionários', description: 'Tente selecionar por CPF no nome do arquivo ou ajuste os nomes.', variant: 'destructive' });
            return;
        }

        const totalSelected = selectedDocuments.length;
        const msg = ids.length < totalSelected
            ? `Identificados ${ids.length} de ${totalSelected} funcionário(s) a partir dos documentos selecionados.`
            : `Identificados ${ids.length} funcionário(s) a partir dos documentos selecionados.`;

        toast({ title: 'Validação de contatos', description: msg });

        setResolvedEmployeeIds(ids);
        setValidationSendType(type);
        setShowValidationModal(true);
    };

    const handleBatchDelete = () => {
        if (selectedDocuments.length === 0) return;
        setShowBatchDeleteModal(true);
    };

    const confirmBatchDelete = async () => {
        if (selectedDocuments.length === 0) return;

        setIsDeleting(true);
        setError(null);

        try {
            console.log('🗑️ Excluindo documentos:', selectedDocuments);

            // Chamar API para exclusão em lote
            const response = await axios.post('/api/unified-documents/delete-multiple', {
                documentIds: selectedDocuments
            });

            if (response.data.sucesso) {
                console.log('✅ Documentos excluídos com sucesso');

                // Recarregar lista
                await loadDocuments();

                // Limpar seleção
                setSelectedDocuments([]);
                setShowBatchDeleteModal(false);

                setError(null);
            } else {
                setError(response.data.mensagem || 'Erro ao excluir documentos');
            }

        } catch (err: unknown) {
            console.error('❌ Erro ao excluir documentos:', err);
            setError('Erro ao excluir documentos: ' + (err.response?.data?.mensagem || err.message));
        } finally {
            setIsDeleting(false);
        }
    };

    // Funções para análise de falhas na unificação
    const analyzeFailedUnifications = async () => {
        setIsAnalyzing(true);
        setError(null);

        try {
            console.log('🔍 Analisando falhas na unificação...');

            // Chamar API para análise de falhas
            const response = await axios.get('/api/unified-documents/analyze-failures');

            if (response.data.sucesso) {
                console.log('✅ Análise de falhas concluída:', response.data);
                setFailedUnifications(response.data.failedUnifications || []);
                setShowFailedAnalysis(true);
            } else {
                setError(response.data.mensagem || 'Erro ao analisar falhas');
            }

        } catch (err: unknown) {
            console.error('❌ Erro ao analisar falhas:', err);
            setError('Erro ao analisar falhas: ' + (err.response?.data?.mensagem || err.message));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const downloadFailedNamesTxt = () => {
        if (failedUnifications.length === 0) return;

        // Criar conteúdo do arquivo TXT
        const content = [
            'LISTA DE NOMES COM FALHA NA UNIFICAÇÃO',
            '=========================================',
            `Data da análise: ${new Date().toLocaleString('pt-BR')}`,
            `Total de falhas: ${failedUnifications.length}`,
            '',
            'DETALHES DAS FALHAS:',
            '===================',
            ''
        ];

        failedUnifications.forEach((failure, index) => {
            content.push(`${index + 1}. FUNCIONÁRIO: ${failure.employeeName || 'N/A'}`);
            content.push(`   MÊS/ANO: ${failure.month || 'N/A'}/${failure.year || 'N/A'}`);
            content.push(`   MOTIVO: ${failure.reason || 'Motivo não especificado'}`);
            content.push(`   STATUS: ${failure.status || 'N/A'}`);
            if (failure.holeriteFound) {
                content.push(`   HOLERITE: Encontrado (${failure.holeriteFileName || 'N/A'})`);
            } else {
                content.push(`   HOLERITE: Não encontrado`);
            }
            if (failure.receiptFound) {
                content.push(`   COMPROVANTE: Encontrado (${failure.receiptFileName || 'N/A'})`);
            } else {
                content.push(`   COMPROVANTE: Não encontrado`);
            }
            content.push('');
        });

        // Criar e baixar arquivo
        const blob = new Blob([content.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `falhas-unificacao-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('📄 Arquivo TXT baixado com sucesso');
    };

    // Função para formatar CPF
    const formatCpf = (cpf?: string): string => {
        if (!cpf) return 'Não informado';
        const cleaned = cpf.replace(/\D/g, '');
        if (cleaned.length !== 11) return cpf;
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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

    // Função para filtrar documentos
    // Função para verificar se um documento corresponde ao termo de busca (igual ao Holerite)
    const matchesSearchTerm = useCallback((doc: UnifiedDocument, searchTerm: string): boolean => {
        if (!searchTerm.trim()) {
            return true; // Se não houver termo de busca, mostra todos
        }

        const normalizedSearch = searchTerm.toLowerCase().trim();
        const payslipData = (doc as any).payslipData;
        
        // Debug: log para verificar o que está sendo buscado
        console.log('🔍 Buscando documento:', {
            employeeName: doc.employeeName,
            searchTerm: normalizedSearch,
            hasPayslipData: !!payslipData
        });
        
        // Buscar por CPF (remove formatação para comparação)
        if (payslipData?.cpf) {
            const cpfNormalized = payslipData.cpf.replace(/\D/g, '').toLowerCase();
            const searchCpfNormalized = normalizedSearch.replace(/\D/g, '');
            if (cpfNormalized && searchCpfNormalized && cpfNormalized.includes(searchCpfNormalized)) {
                return true;
            }
            // Também verificar se o CPF formatado contém o termo de busca
            if (normalizedSearch.length >= 3 && payslipData.cpf.toLowerCase().includes(normalizedSearch)) {
                return true;
            }
        }

        // Buscar por nome do funcionário (busca parcial, não precisa ser exato)
        const employeeName = doc.employeeName?.toLowerCase() || '';
        if (employeeName && employeeName.includes(normalizedSearch)) {
            console.log('✅ Match por nome:', { employeeName, normalizedSearch });
            return true;
        }
        
        // Buscar por partes do nome (palavras individuais) - importante para "ANDRE" encontrar "ANDRE RIBEIRO DE OLIVEIRA"
        if (employeeName && normalizedSearch.length >= 3) {
            const nameWords = employeeName.split(/\s+/);
            for (const word of nameWords) {
                // Verifica se a palavra começa com o termo de busca ou vice-versa
                if (word.startsWith(normalizedSearch) || normalizedSearch.startsWith(word)) {
                    console.log('✅ Match por palavra do nome (startsWith):', { word, normalizedSearch, employeeName });
                    return true;
                }
                // Também verifica se o termo está contido na palavra (para casos como "ANDRE" em "ANDRE RIBEIRO")
                if (word.includes(normalizedSearch) || normalizedSearch.includes(word)) {
                    console.log('✅ Match por palavra do nome (includes):', { word, normalizedSearch, employeeName });
                    return true;
                }
            }
        }

        // Buscar por período (formato: MM/YYYY ou M/YYYY)
        const periodFormatted = `${String(doc.month).padStart(2, '0')}/${doc.year}`;
        if (periodFormatted.includes(normalizedSearch)) {
            return true;
        }

        // Buscar por mês (ex: "01", "1", "janeiro", etc.)
        const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const monthNumber = doc.month;
        if (String(monthNumber).includes(normalizedSearch) || 
            monthNames[monthNumber - 1]?.includes(normalizedSearch)) {
            return true;
        }

        // Buscar por ano
        if (String(doc.year).includes(normalizedSearch)) {
            return true;
        }

        // Buscar por empresa (se disponível nos dados do holerite)
        if (payslipData?.companyName && payslipData.companyName.toLowerCase().includes(normalizedSearch)) {
            return true;
        }

        // Buscar por setor (se disponível nos dados do holerite)
        if (payslipData?.workPostName && payslipData.workPostName.toLowerCase().includes(normalizedSearch)) {
            return true;
        }

        // Buscar no nome do arquivo
        if (doc.fileName && doc.fileName.toLowerCase().includes(normalizedSearch)) {
            return true;
        }

        return false;
    }, []);

    // Função para filtrar documentos localmente (busca em tempo real, igual ao Holerite)
    const getFilteredDocuments = useCallback((): UnifiedDocument[] => {
        let filtered = documents;
        
        // Aplicar filtros normais primeiro
        filtered = filtered.filter(doc => {
            // Filtro por tipo de unificação
            if (unificationTypeFilter !== 'all' && doc.unificationType !== unificationTypeFilter) {
                return false;
            }
            
            // Filtro por ano
            if (yearFilter !== 'all' && doc.year !== yearFilter) {
                return false;
            }
            
            // Filtro por mês
            if (monthFilter !== 'all' && doc.month !== monthFilter) {
                return false;
            }
            
            return true;
        });
        
        // Se houver pesquisa ativa, filtrar por termo de busca (em tempo real, igual ao Holerite)
        if (searchTerm && searchTerm.trim()) {
            filtered = filtered.filter(doc => {
                const matches = matchesSearchTerm(doc, searchTerm);
                if (matches) {
                    console.log('✅ Documento encontrado na busca:', doc.employeeName);
                }
                return matches;
            });
            console.log(`🔍 Resultados da busca: ${filtered.length} de ${documents.length} documentos (${filtered.length > 0 ? '✅ ENCONTRADOS' : '❌ NENHUM ENCONTRADO'})`);
            if (filtered.length > 0) {
                console.log('📋 Documentos encontrados:', filtered.map(d => d.employeeName));
            }
        }
        
        return filtered;
    }, [documents, searchTerm, unificationTypeFilter, yearFilter, monthFilter, matchesSearchTerm]);

    // Obter anos únicos dos documentos
    const getUniqueYears = (): number[] => {
        const years = documents.map(doc => doc.year).filter((year, index, arr) => arr.indexOf(year) === index);
        return years.sort((a, b) => b - a); // Ordem decrescente
    };

    // Obter meses únicos dos documentos
    const getUniqueMonths = (): number[] => {
        const months = documents.map(doc => doc.month).filter((month, index, arr) => arr.indexOf(month) === index);
        return months.sort((a, b) => a - b); // Ordem crescente
    };

    // Obter estatísticas dos documentos
    const getDocumentStats = () => {
        const total = documents.length;
        const individual = documents.filter(doc => doc.unificationType === 'INDIVIDUAL').length;
        const batch = documents.filter(doc => doc.unificationType === 'BATCH').length;
        const unknown = documents.filter(doc => doc.unificationType === 'UNKNOWN').length;
        
        return { total, individual, batch, unknown };
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 Documentos Unificados</h1>
                        <p className="text-gray-600">
                            Gerencie documentos que combinam holerite e recibo de pagamento em um único arquivo.
                        </p>
                        
                        {/* Estatísticas */}
                        {documents.length > 0 && (
                            <div className="flex flex-wrap gap-4 mt-3">
                                {(() => {
                                    const stats = getDocumentStats();
                                    return (
                                        <>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                📊 Total: {stats.total}
                                            </Badge>
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                👤 Individuais: {stats.individual}
                                            </Badge>
                                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                                📦 Em Lote: {stats.batch}
                                            </Badge>
                                            {stats.unknown > 0 && (
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                                    ❓ Desconhecidos: {stats.unknown}
                                                </Badge>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={loadDocuments}
                        variant="outline"
                        className="flex items-center gap-2"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar Lista
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="documents" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="documents">📋 Documentos</TabsTrigger>
                    <TabsTrigger value="create">➕ Criar Novo</TabsTrigger>
                    <TabsTrigger value="tools">🛠️ Ferramentas</TabsTrigger>
                </TabsList>

                {/* TAB: Documentos */}
                <TabsContent value="documents" className="space-y-4">
                    {/* Barra de Pesquisa - Estilo igual ao Holerite */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardContent className="pt-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-seguranca-yellow" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por nome do funcionário, empresa ou período..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-20 bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                                />
                                {searchTerm && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Limpar
                                    </Button>
                                )}
                            </div>
                            {searchTerm && (
                                <p className="text-xs text-gray-400 mt-2 ml-7">
                                    Pesquisando por: <span className="text-seguranca-yellow font-semibold">{searchTerm}</span>
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Filtros - Ocultar quando há pesquisa ativa */}
                    {documents.length > 0 && (!searchTerm || !searchTerm.trim()) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-5 w-5" />
                                    Filtros
                                </CardTitle>
                                <CardDescription>
                                    Filtre os documentos por tipo de unificação, ano e mês
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Filtro por tipo de unificação */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tipo de Unificação
                                        </label>
                                        <select
                                            value={unificationTypeFilter}
                                            onChange={(e) => setUnificationTypeFilter(e.target.value as any)}
                                            className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 outline-none"
                                        >
                                            <option value="all">🔍 Todos os tipos</option>
                                            <option value="INDIVIDUAL">👤 Unificação Individual</option>
                                            <option value="BATCH">📦 Unificação em Lote</option>
                                            <option value="UNKNOWN">❓ Tipo Desconhecido</option>
                                        </select>
                                    </div>

                                    {/* Filtro por ano */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ano
                                        </label>
                                        <select
                                            value={yearFilter}
                                            onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                            className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 outline-none"
                                        >
                                            <option value="all">📅 Todos os anos</option>
                                            {getUniqueYears().map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtro por mês */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mês
                                        </label>
                                        <select
                                            value={monthFilter}
                                            onChange={(e) => setMonthFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                            className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 outline-none"
                                        >
                                            <option value="all">📆 Todos os meses</option>
                                            {getUniqueMonths().map(month => (
                                                <option key={month} value={month}>
                                                    {month.toString().padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Resultados do filtro */}
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        📊 Mostrando <strong>{getFilteredDocuments().length}</strong> de <strong>{documents.length}</strong> documentos
                                        {unificationTypeFilter !== 'all' && ` • Tipo: ${unificationTypeFilter}`}
                                        {yearFilter !== 'all' && ` • Ano: ${yearFilter}`}
                                        {monthFilter !== 'all' && ` • Mês: ${monthFilter.toString().padStart(2, '0')}`}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Lista de Documentos Unificados
                            </CardTitle>
                            <CardDescription>
                                Visualize, baixe e compartilhe seus documentos unificados
                            </CardDescription>

                            {/* Controles de seleção */}
                            {getFilteredDocuments().length > 0 && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSelectAll}
                                            className="flex items-center gap-2"
                                        >
                                            {selectedDocuments.length === getFilteredDocuments().length ? (
                                                <CheckSquare className="h-4 w-4" />
                                            ) : (
                                                <Square className="h-4 w-4" />
                                            )}
                                            {selectedDocuments.length === getFilteredDocuments().length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                        </Button>

                                        {selectedDocuments.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-sm">
                                                    {selectedDocuments.length} documento(s) selecionado(s)
                                                </Badge>
                                                {/* Envio Rápido com Validação */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSendSelected('whatsapp')}
                                                    className="flex items-center gap-2"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                    Enviar WhatsApp
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSendSelected('email')}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    Enviar Email
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSendSelected('both')}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    +
                                                    <MessageCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={handleBatchDelete}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Excluir Selecionados
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
                            ) : (
                                <>
                                    {/* Debug: Mostrar informações sobre documentos carregados */}
                                    {console.log('🔍 Estado atual:', {
                                        totalDocuments: documents.length,
                                        searchTerm,
                                        filteredCount: getFilteredDocuments().length,
                                        loading,
                                        error
                                    })}
                                    
                                    {/* Seção de resultados de pesquisa - estilo igual ao Holerite */}
                                    {/* Sempre mostrar quando há pesquisa ativa */}
                                    {searchTerm && searchTerm.trim() ? (
                                        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 mb-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
                                                    <Search className="h-5 w-5 text-seguranca-yellow" />
                                                    Documentos Unificados encontrados ({getFilteredDocuments().length})
                                                </h3>
                                            </div>
                                            {(() => {
                                                const filtered = getFilteredDocuments();
                                                console.log('🔍 Renderizando resultados da busca:', {
                                                    searchTerm,
                                                    totalDocuments: documents.length,
                                                    filteredCount: filtered.length,
                                                    filteredDocs: filtered.map(d => d.employeeName)
                                                });
                                                return filtered.length > 0 ? (
                                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                                        {filtered.map((doc) => (
                                                            <DocumentItem
                                                                key={doc.id}
                                                                doc={doc}
                                                                loadDocumentPayslipData={loadDocumentPayslipData}
                                                                formatCpf={formatCpf}
                                                                handleViewDocument={handleViewDocument}
                                                                handleDownloadDocument={handleDownloadDocument}
                                                                handleSendEmail={handleSendEmail}
                                                                handleSendWhatsApp={handleSendWhatsApp}
                                                                toast={toast}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 text-gray-400">
                                                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">Nenhum documento encontrado para "{searchTerm}"</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        /* Lista normal quando não há pesquisa ativa */
                                        getFilteredDocuments().length > 0 ? (
                                            <div className="space-y-4">
                                                {getFilteredDocuments().map((doc) => (
                                                <Card key={doc.id} className={`border-l-4 border-l-blue-500 ${selectedDocuments.includes(doc.id) ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-3">
                                                            {/* Checkbox */}
                                                            <button
                                                                onClick={() => handleSelectDocument(doc.id)}
                                                                className="mt-1 flex-shrink-0"
                                                            >
                                                                {selectedDocuments.includes(doc.id) ? (
                                                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                                                ) : (
                                                                    <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                                )}
                                                            </button>

                                                            {/* Conteúdo do documento */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <h3 className="font-semibold text-lg">{doc.employeeName}</h3>
                                                                            <Badge variant="secondary">
                                                                                {doc.month}/{doc.year}
                                                                            </Badge>
                                                                            {/* Badge do tipo de unificação */}
                                                                            <Badge 
                                                                                variant="outline" 
                                                                                className={
                                                                                    doc.unificationType === 'INDIVIDUAL' ? 'bg-green-100 text-green-800 border-green-300' :
                                                                                    doc.unificationType === 'BATCH' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                                                                    'bg-orange-100 text-orange-800 border-orange-300'
                                                                                }
                                                                            >
                                                                                {doc.unificationType === 'INDIVIDUAL' ? '👤 Individual' :
                                                                                 doc.unificationType === 'BATCH' ? '📦 Em Lote' :
                                                                                 '❓ Desconhecido'}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                            <span className="flex items-center gap-1">
                                                                                <FileText className="h-4 w-4" />
                                                                                {doc.fileName}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Calendar className="h-4 w-4" />
                                                                                {doc.createdAtFormatted || formatDate(doc.createdAt)}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Download className="h-4 w-4" />
                                                                                {formatFileSize(doc.fileSize)}
                                                                            </span>
                                                                        </div>
                                                                        {/* Mostrar dados do holerite quando disponível */}
                                                                        {(doc as any).payslipData && (
                                                                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                                                                <p className="text-xs font-semibold text-blue-800 mb-1">
                                                                                    📄 Dados do Holerite (prioridade):
                                                                                </p>
                                                                                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                                                                                    {(doc as any).payslipData.companyName && (
                                                                                        <span><strong>Empresa:</strong> {(doc as any).payslipData.companyName}</span>
                                                                                    )}
                                                                                    {(doc as any).payslipData.workPostName && (
                                                                                        <span><strong>Setor:</strong> {(doc as any).payslipData.workPostName}</span>
                                                                                    )}
                                                                                    {(doc as any).payslipData.cpf && (
                                                                                        <span><strong>CPF:</strong> {(doc as any).payslipData.cpf}</span>
                                                                                    )}
                                                                                    {(doc as any).payslipData.netValue && (
                                                                                        <span><strong>Valor Líquido:</strong> R$ {parseFloat((doc as any).payslipData.netValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
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
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-600">
                                                    Nenhum documento corresponde aos filtros aplicados
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Tente ajustar os filtros para ver mais documentos
                                                </p>
                                            </div>
                                        )
                                    )}
                                </>
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
                                        onChange={(e) => setCreateForm({ ...createForm, employeeName: e.target.value })}
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
                                            onChange={(e) => setCreateForm({ ...createForm, month: parseInt(e.target.value) })}
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
                                            onChange={(e) => setCreateForm({ ...createForm, year: parseInt(e.target.value) })}
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
                                        } catch (err: unknown) {
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
                                        } catch (err: unknown) {
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

                    {/* Análise de Falhas na Unificação */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Análise de Falhas na Unificação
                            </CardTitle>
                            <CardDescription>
                                Analise e baixe relatório dos nomes que falharam na unificação
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={analyzeFailedUnifications}
                                    disabled={isAnalyzing}
                                    className="flex items-center gap-2"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Analisando...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-4 w-4" />
                                            Analisar Falhas
                                        </>
                                    )}
                                </Button>

                                {failedUnifications.length > 0 && (
                                    <Button
                                        onClick={downloadFailedNamesTxt}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        <FileDown className="h-4 w-4" />
                                        Baixar Lista TXT
                                    </Button>
                                )}
                            </div>

                            {failedUnifications.length > 0 && (
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <h4 className="font-semibold text-orange-800 mb-2">
                                        📊 Resultado da Análise
                                    </h4>
                                    <p className="text-orange-700 text-sm">
                                        Encontradas <strong>{failedUnifications.length} falhas</strong> na unificação.
                                        Clique em "Baixar Lista TXT" para obter o relatório detalhado.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
                                onChange={(e) => setEmailForm({ ...emailForm, toEmail: e.target.value })}
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
                                onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumber: e.target.value })}
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

            {/* MODAL: Validação de Contatos para envio */}
            <ContactValidationModal
                open={showValidationModal}
                onClose={() => setShowValidationModal(false)}
                employeeIds={resolvedEmployeeIds}
                sendType={validationSendType}
                documentType="unificado"
                onValidated={handleValidated}
            />

            {/* MODAL: Validação de Envio Individual */}
            {sendValidationResult && pendingSendDocument && (
                <DocumentSendValidationModal
                    isOpen={showSendValidationModal}
                    onClose={() => {
                        setShowSendValidationModal(false);
                        setSendValidationResult(null);
                        setPendingSendDocument(null);
                    }}
                    validation={sendValidationResult}
                    documentName={pendingSendDocument.fileName}
                    sendType={pendingSendType}
                    expectedName={pendingSendDocument.employeeName}
                    onRegisterContacts={() => {
                        // Abrir modal de cadastro de contatos (implementar se necessário)
                        setShowSendValidationModal(false);
                        toast({
                            title: 'ℹ️ Cadastro de Contatos',
                            description: 'Funcionalidade em desenvolvimento. Por favor, cadastre via menu Usuários.',
                        });
                    }}
                />
            )}

            {/* MODAL CUSTOMIZADO: Exclusão em Lote */}
            {showBatchDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={() => setShowBatchDeleteModal(false)}
                >
                    <div
                        className="bg-seguranca-graphite rounded-lg shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col border border-gray-600"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 bg-red-900/30 p-4 border-b border-red-700 rounded-t-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trash2 className="h-6 w-6 text-red-500 flex-shrink-0" />
                                    <h2 className="text-lg font-semibold text-red-400">Excluir Documentos em Lote</h2>
                                </div>
                                <button
                                    onClick={() => setShowBatchDeleteModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                            <p className="text-red-400 mt-2 text-sm">
                                ⚠️ Tem certeza que deseja excluir <strong>{selectedDocuments.length} documento(s)</strong> selecionado(s)?
                                <br />
                                <span className="text-xs text-red-500">Esta ação não pode ser desfeita.</span>
                            </p>
                        </div>

                        {/* Body - Lista de documentos */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-2">
                                {selectedDocuments.map((docId) => {
                                    const doc = documents.find(d => d.id === docId);
                                    return doc ? (
                                        <div
                                            key={docId}
                                            className="bg-seguranca-black p-3 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                                        >
                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 text-seguranca-yellow flex-shrink-0 mt-1" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-seguranca-lightgray mb-1">
                                                        {doc.employeeName}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-mono break-all">
                                                        {doc.fileName}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="bg-seguranca-graphite text-gray-300 px-2 py-0.5 rounded text-xs border border-gray-600">
                                                            {doc.month}/{doc.year}
                                                        </span>
                                                        <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-xs border border-blue-700">
                                                            {formatFileSize(doc.fileSize)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>

                        {/* Footer - Botões de ação */}
                        <div className="flex-shrink-0 flex justify-end gap-3 p-4 bg-seguranca-black border-t border-gray-600 rounded-b-lg">
                            <Button
                                variant="outline"
                                onClick={() => setShowBatchDeleteModal(false)}
                                disabled={isDeleting}
                                className="border-gray-600 hover:bg-seguranca-graphite text-seguranca-lightgray"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button
                                onClick={confirmBatchDelete}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                            >
                                {isDeleting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Excluindo...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Excluir {selectedDocuments.length} Documentos
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* FEEDBACK: Email Enviado */}
            {
                emailSent && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Email enviado com sucesso!</span>
                    </div>
                )
            }
        </div >
    );
};

export default DocumentosUnificados;
