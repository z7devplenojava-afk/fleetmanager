import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  FileText, 
  Download, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  ChevronDown,
  Building2,
  Calendar,
  User,
  Mail,
  MessageSquare,
  Send,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';

interface SectorData {
  name: string;
  path: string;
  documentCount: number;
  periods: PeriodData[];
}

interface PeriodData {
  period: string;
  path: string;
  documentCount: number;
  documents?: DocumentData[];
}

interface DocumentData {
  fileName: string;
  filePath: string;
  employeeName: string;
  cpf: string;
  sector: string;
  month: number;
  year: number;
}

interface ProcessResult {
  originalFileName: string;
  newFileName: string;
  newFilePath: string;
  employeeName: string;
  cpf: string;
  sector: string;
  month: number;
  year: number;
  success: boolean;
  error?: string;
}

interface BatchProcessResponse {
  success: boolean;
  message: string;
  totalDocuments: number;
  successCount: number;
  failedCount: number;
  results: ProcessResult[];
}

const UnificadosPorSetorNovo: React.FC = () => {
  const { toast } = useToast();
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [totalSectors, setTotalSectors] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [processResults, setProcessResults] = useState<ProcessResult[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [sendingIndividual, setSendingIndividual] = useState<string | null>(null);
  const [sendingBatch, setSendingBatch] = useState<string | null>(null);
  
  // Estados para exclusão
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Carregar lista de documentos organizados
  const loadOrganizedDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sector-organization/list');
      
      setSectors(response.data.sectors || []);
      setTotalDocuments(response.data.totalDocuments || 0);
      setTotalSectors(response.data.totalSectors || 0);
      
      console.log('✅ Documentos organizados carregados:', response.data);
    } catch (error: any) {
      console.error('❌ Erro ao carregar documentos organizados:', error);
      
      // Tentar endpoint público como fallback
      try {
        const publicResponse = await axios.get('/api/sector-organization/public/list');
        setSectors(publicResponse.data.sectors || []);
        setTotalDocuments(publicResponse.data.totalDocuments || 0);
        setTotalSectors(publicResponse.data.totalSectors || 0);
        console.log('✅ Documentos carregados via endpoint público');
      } catch (publicError) {
        toast({
          title: '❌ Erro',
          description: 'Erro ao carregar documentos organizados',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Processar todos os documentos
  const processAllDocuments = async () => {
    setProcessing(true);
    setProcessResults([]);
    setShowProcessModal(true);
    
    try {
      toast({
        title: '⏳ Processando...',
        description: 'Organizando documentos por setor, aguarde...',
      });
      
      const response = await axios.post<BatchProcessResponse>('/api/sector-organization/process');
      
      setProcessResults(response.data.results || []);
      
      if (response.data.success) {
        toast({
          title: '✅ Sucesso!',
          description: `${response.data.successCount} documentos organizados com sucesso!`,
          variant: 'default'
        });
      } else {
        toast({
          title: '⚠️ Processamento concluído com avisos',
          description: `${response.data.failedCount} documentos falharam. ${response.data.successCount} organizados.`,
          variant: 'default'
        });
      }
      
      // Recarregar lista após processamento
      setTimeout(() => loadOrganizedDocuments(), 1000);
      
    } catch (error: any) {
      console.error('❌ Erro ao processar documentos:', error);
      toast({
        title: '❌ Erro no processamento',
        description: error.response?.data?.message || error.message || 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Enviar documento individual
  const handleSendIndividual = async (doc: DocumentData, type: 'email' | 'whatsapp') => {
    setSendingIndividual(`${doc.cpf}_${type}`);
    try {
      const payload = {
        cpf: doc.cpf,
        tipo: type,
        mensagem: type === 'whatsapp' ? 'Seu documento unificado está disponível!' : undefined
      };

      const response = await axios.post('/api/envio/individual', payload);
      
      if (response.data.sucesso) {
        toast({
          title: `✅ ${type === 'email' ? 'Email' : 'WhatsApp'} enviado!`,
          description: `Documento enviado para ${doc.employeeName}`,
        });
      } else {
        toast({
          title: '⚠️ Aviso',
          description: response.data.mensagem || 'Erro no envio',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erro ao enviar:', error);
      toast({
        title: '❌ Erro no envio',
        description: error.response?.data?.message || 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setSendingIndividual(null);
    }
  };

  // Enviar em massa por setor/período
  const handleSendBatch = async (sector: string, period: string, documents: DocumentData[], type: 'email' | 'whatsapp') => {
    setSendingBatch(`${sector}_${period}_${type}`);
    try {
      const cpfs = documents.map(doc => doc.cpf);
      
      const payload = {
        cpfs: cpfs,
        tipo: type,
        mensagem: type === 'whatsapp' ? `Documentos do setor ${sector} - ${formatPeriod(period)}` : undefined
      };

      const response = await axios.post('/api/envio/massa-cpfs', payload);
      
      if (response.data.sucesso) {
        toast({
          title: `✅ Envio em massa concluído!`,
          description: `${cpfs.length} documentos enviados via ${type === 'email' ? 'Email' : 'WhatsApp'}`,
        });
      } else {
        toast({
          title: '⚠️ Aviso',
          description: response.data.mensagem || 'Alguns envios falharam',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Erro no envio em massa:', error);
      toast({
        title: '❌ Erro no envio em massa',
        description: error.response?.data?.message || 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setSendingBatch(null);
    }
  };

  // Toggle setor expandido/colapsado
  const toggleSector = (sectorName: string) => {
    const newExpanded = new Set(expandedSectors);
    if (newExpanded.has(sectorName)) {
      newExpanded.delete(sectorName);
    } else {
      newExpanded.add(sectorName);
    }
    setExpandedSectors(newExpanded);
  };

  // Toggle período expandido/colapsado
  const togglePeriod = (periodKey: string) => {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(periodKey)) {
      newExpanded.delete(periodKey);
    } else {
      newExpanded.add(periodKey);
    }
    setExpandedPeriods(newExpanded);
  };

  // Seleção de documentos
  const toggleDocumentSelection = (filePath: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedDocuments(newSelected);
  };

  // Selecionar todos de um período
  const toggleSelectAllPeriod = (documents: DocumentData[], checked: boolean) => {
    const newSelected = new Set(selectedDocuments);
    documents.forEach(doc => {
      if (checked) {
        newSelected.add(doc.filePath);
      } else {
        newSelected.delete(doc.filePath);
      }
    });
    setSelectedDocuments(newSelected);
  };

  // Deletar documento individual
  const handleDeleteIndividual = async (doc: DocumentData) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
  };

  // Confirmar exclusão
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const filePaths = documentToDelete 
        ? [documentToDelete.filePath] 
        : Array.from(selectedDocuments);

      if (filePaths.length === 0) {
        toast({
          title: '⚠️ Aviso',
          description: 'Nenhum documento selecionado',
          variant: 'default'
        });
        return;
      }

      const response = await axios.delete('/api/sector-organization/delete', {
        data: { filePaths }
      });

      if (response.data.success) {
        toast({
          title: '✅ Sucesso!',
          description: `${response.data.deletedCount} documento(s) deletado(s)`,
        });
        
        // Limpar seleções
        setSelectedDocuments(new Set());
        setDocumentToDelete(null);
        setShowDeleteModal(false);
        
        // Recarregar lista
        loadOrganizedDocuments();
      } else {
        toast({
          title: '⚠️ Aviso',
          description: response.data.message || 'Alguns documentos não puderam ser deletados',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      toast({
        title: '❌ Erro na exclusão',
        description: error.response?.data?.message || 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  // Deletar selecionados
  const handleDeleteSelected = () => {
    if (selectedDocuments.size === 0) {
      toast({
        title: '⚠️ Aviso',
        description: 'Nenhum documento selecionado',
        variant: 'default'
      });
      return;
    }
    setDocumentToDelete(null);
    setShowDeleteModal(true);
  };

  // Carregar ao montar componente
  useEffect(() => {
    loadOrganizedDocuments();
  }, []);

  // Formatar nome do período (6_2025 → Junho/2025)
  const formatPeriod = (period: string) => {
    const [month, year] = period.split('_');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Unificados por Setor</h2>
          <p className="text-gray-400 mt-1">
            Documentos organizados automaticamente por setor e período
          </p>
        </div>
        
        <div className="flex gap-3">
          {selectedDocuments.size > 0 && (
            <Button
              onClick={handleDeleteSelected}
              variant="outline"
              className="flex items-center gap-2 border-red-700/50 text-red-400 hover:bg-red-900/30"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Selecionados ({selectedDocuments.size})
            </Button>
          )}
          
          <Button
            onClick={loadOrganizedDocuments}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            onClick={processAllDocuments}
            disabled={processing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4" />
            {processing ? 'Processando...' : 'Processar Documentos'}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Setores</p>
                <p className="text-3xl font-bold text-blue-400">{totalSectors}</p>
              </div>
              <Building2 className="w-10 h-10 text-blue-600/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Documentos</p>
                <p className="text-3xl font-bold text-green-400">{totalDocuments}</p>
              </div>
              <FileText className="w-10 h-10 text-green-600/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-xl font-semibold text-gray-100">
                  {loading ? 'Carregando...' : 'Pronto'}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-gray-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Setores (Tree View) */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <FolderOpen className="w-5 h-5 text-seguranca-yellow" />
            Documentos Organizados por Setor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-400">Carregando documentos...</p>
            </div>
          ) : sectors.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhum documento organizado ainda</p>
              <p className="text-gray-500 text-sm mt-2">
                Clique em "Processar Documentos" para organizar os unificados por setor
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sectors.map((sector) => (
                <div key={sector.name} className="border border-gray-700 rounded-lg bg-gray-800/50">
                  {/* Setor Header */}
                  <div
                    onClick={() => toggleSector(sector.name)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSectors.has(sector.name) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      
                      <Building2 className="w-5 h-5 text-blue-400" />
                      
                      <div>
                        <p className="font-semibold text-gray-100">{sector.name}</p>
                        <p className="text-sm text-gray-400">
                          {sector.documentCount} documento{sector.documentCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm font-medium border border-blue-700/30">
                        {sector.periods.length} período{sector.periods.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Períodos (colapsável) */}
                  {expandedSectors.has(sector.name) && (
                    <div className="border-t border-gray-700 bg-gray-900/30 p-4">
                      <div className="space-y-2">
                        {sector.periods.map((period) => {
                          const periodKey = `${sector.name}_${period.period}`;
                          return (
                            <div key={periodKey} className="border border-gray-700 rounded-lg bg-gray-800/50">
                              {/* Período Header */}
                              <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3 flex-1">
                                  {/* Checkbox Selecionar Todos do Período */}
                                  {period.documents && period.documents.length > 0 && (
                                    <Checkbox
                                      checked={period.documents.every(doc => selectedDocuments.has(doc.filePath))}
                                      onCheckedChange={(checked) => toggleSelectAllPeriod(period.documents || [], checked as boolean)}
                                      className="border-gray-600"
                                    />
                                  )}
                                  
                                  <div 
                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                    onClick={() => togglePeriod(periodKey)}
                                  >
                                    {expandedPeriods.has(periodKey) ? (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                    <Calendar className="w-4 h-4 text-green-400" />
                                    <div>
                                      <p className="font-medium text-gray-100">{formatPeriod(period.period)}</p>
                                      <p className="text-sm text-gray-400">
                                        {period.documentCount} documento{period.documentCount !== 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Botões de envio em massa */}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-1 border-blue-700/50 hover:bg-blue-900/30"
                                    onClick={() => handleSendBatch(sector.name, period.period, period.documents || [], 'email')}
                                    disabled={sendingBatch === `${sector.name}_${period.period}_email`}
                                  >
                                    <Mail className="w-3 h-3" />
                                    Enviar Todos (Email)
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-1 border-green-700/50 hover:bg-green-900/30"
                                    onClick={() => handleSendBatch(sector.name, period.period, period.documents || [], 'whatsapp')}
                                    disabled={sendingBatch === `${sector.name}_${period.period}_whatsapp`}
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    Enviar Todos (WhatsApp)
                                  </Button>
                                </div>
                              </div>

                              {/* Lista de Documentos */}
                              {expandedPeriods.has(periodKey) && period.documents && (
                                <div className="border-t border-gray-700 p-3 space-y-2">
                                  {period.documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                                      <div className="flex items-center gap-3">
                                        {/* Checkbox Individual */}
                                        <Checkbox
                                          checked={selectedDocuments.has(doc.filePath)}
                                          onCheckedChange={() => toggleDocumentSelection(doc.filePath)}
                                          className="border-gray-600"
                                        />
                                        
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div>
                                          <p className="font-medium text-gray-100">{doc.employeeName}</p>
                                          <p className="text-sm text-gray-400">CPF: {doc.cpf}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex items-center gap-1 border-blue-700/50 hover:bg-blue-900/30"
                                          onClick={() => handleSendIndividual(doc, 'email')}
                                          disabled={sendingIndividual === `${doc.cpf}_email`}
                                        >
                                          <Mail className="w-3 h-3" />
                                          Email
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex items-center gap-1 border-green-700/50 hover:bg-green-900/30"
                                          onClick={() => handleSendIndividual(doc, 'whatsapp')}
                                          disabled={sendingIndividual === `${doc.cpf}_whatsapp`}
                                        >
                                          <MessageSquare className="w-3 h-3" />
                                          WhatsApp
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex items-center gap-1 border-gray-700/50 hover:bg-gray-700/30"
                                        >
                                          <Download className="w-3 h-3" />
                                          Baixar
                                        </Button>
                                        {/* Botão Deletar Individual */}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex items-center gap-1 border-red-700/50 hover:bg-red-900/30 text-red-400"
                                          onClick={() => handleDeleteIndividual(doc)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Resultados do Processamento */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
              <CardTitle className="text-gray-100">Resultados do Processamento</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProcessModal(false)}
                className="border-gray-700 hover:bg-gray-700"
              >
                Fechar
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {processing ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-400">Processando documentos...</p>
                </div>
              ) : processResults.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum resultado ainda</p>
              ) : (
                <div className="space-y-2">
                  {processResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-900/20 border-green-700/50'
                          : 'bg-red-900/20 border-red-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-100">
                            {result.success ? result.employeeName : result.originalFileName}
                          </p>
                          
                          {result.success ? (
                            <div className="text-sm text-gray-300 mt-1 space-y-1">
                              <p>✅ Setor: {result.sector}</p>
                              <p>📅 Período: {result.month}/{result.year}</p>
                              <p>📄 Arquivo: {result.newFileName}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-red-300 mt-1">
                              ❌ {result.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-100">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {documentToDelete ? (
                <>
                  Tem certeza que deseja excluir o documento de <strong>{documentToDelete.employeeName}</strong>?
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir <strong>{selectedDocuments.size} documento(s)</strong> selecionado(s)?
                </>
              )}
              <p className="mt-2 text-red-300">Esta ação não pode ser desfeita!</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDocumentToDelete(null);
              }}
              disabled={deleting}
              className="border-gray-700 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnificadosPorSetorNovo;

