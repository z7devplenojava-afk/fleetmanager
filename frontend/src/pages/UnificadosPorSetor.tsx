import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle,
  Eye,
  Loader2
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import { unifiedDocumentService } from '@/services/unifiedDocumentService';
import holeriteService, { HoleriteOrganizationResponse, HoleriteCompanyGroup, HoleriteSectorGroup, HoleritePeriodGroup, HoleriteOrganizedEntry } from '@/services/holeriteService';

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
  
  // Estados para organização por empresas (igual Holerites)
  const [organizationData, setOrganizationData] = useState<HoleriteOrganizationResponse | null>(null);
  const [loadingOrganization, setLoadingOrganization] = useState(false);
  const [organizationError, setOrganizationError] = useState<string | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [expandedSectorsOrg, setExpandedSectorsOrg] = useState<Record<string, boolean>>({});
  const [expandedPeriodsOrg, setExpandedPeriodsOrg] = useState<Record<string, boolean>>({});
  const [processResults, setProcessResults] = useState<ProcessResult[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [sendingIndividual, setSendingIndividual] = useState<string | null>(null);
  const [sendingBatch, setSendingBatch] = useState<string | null>(null);
  
  // Estados para exclusão
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedUnifiedDocuments, setSelectedUnifiedDocuments] = useState<Set<string>>(new Set());
  const [deletingDocuments, setDeletingDocuments] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([]);
  const [deleteType, setDeleteType] = useState<'individual' | 'batch'>('batch');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentData | null>(null);
  const [previewContext, setPreviewContext] = useState<{ sector: string; period: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSending, setPreviewSending] = useState<'email' | 'whatsapp' | null>(null);
  const [downloadOptions, setDownloadOptions] = useState<{
    open: boolean;
    sector: string;
    period: string;
    document: DocumentData | null;
  }>({
    open: false,
    sector: '',
    period: '',
    document: null,
  });

  // Carregar organização de documentos unificados por Empresa/Setor/Ano/Mês
  const loadOrganization = async (forceRefresh: boolean = false) => {
    setLoadingOrganization(true);
    setOrganizationError(null);
    try {
      // Adicionar timestamp para evitar cache
      const data = await unifiedDocumentService.getOrganization(forceRefresh);
      setOrganizationData(data);
      console.log('✅ Organização de documentos unificados carregada:', data);
      
      // Se forçou refresh, limpar seleções também
      if (forceRefresh) {
        setSelectedUnifiedDocuments(new Set());
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar organização:', error);
      setOrganizationError(error?.response?.data?.message || error?.message || 'Erro ao carregar organização');
      toast({
        title: '❌ Erro',
        description: 'Erro ao carregar organização de documentos unificados',
        variant: 'destructive'
      });
    } finally {
      setLoadingOrganization(false);
    }
  };

  // Carregar lista de documentos organizados (mantido para compatibilidade)
  const loadOrganizedDocuments = async () => {
    await loadOrganization();
  };

  // Funções auxiliares para organização (igual Holerites)
  const getCompanyKey = (company: { companySigla?: string; companyCnpj?: string; companyName?: string }) => {
    const sigla = (company?.companySigla || 'OUTROS').toUpperCase();
    const identifier = company?.companyCnpj || company?.companyName || 'SEM_IDENTIFICACAO';
    return `${sigla}|${identifier}`;
  };

  const getSectorKey = (companyKey: string, sector: { normalizedSectorName?: string; sectorName?: string }) => {
    const normalized = (sector?.normalizedSectorName || sector?.sectorName || 'SETOR_NAO_INFORMADO').toUpperCase();
    return `${companyKey}|${normalized}`;
  };

  const getPeriodKey = (sectorKey: string, period: { year?: number; month?: number }) => {
    const yearValue = period?.year ?? 0;
    const monthValue = period?.month ?? 0;
    return `${sectorKey}|${yearValue}-${monthValue}`;
  };

  const toggleCompanyExpansion = (companyKey: string) => {
    setExpandedCompanies(prev => {
      const isExpanded = !!prev[companyKey];
      const next = { ...prev, [companyKey]: !isExpanded };
      if (isExpanded) {
        setExpandedSectorsOrg(prevSectors => {
          const filtered: Record<string, boolean> = {};
          Object.keys(prevSectors).forEach(key => {
            if (!key.startsWith(`${companyKey}|`)) {
              filtered[key] = prevSectors[key];
            }
          });
          return filtered;
        });
        setExpandedPeriodsOrg(prevPeriods => {
          const filtered: Record<string, boolean> = {};
          Object.keys(prevPeriods).forEach(key => {
            if (!key.startsWith(`${companyKey}|`)) {
              filtered[key] = prevPeriods[key];
            }
          });
          return filtered;
        });
      }
      return next;
    });
  };

  const toggleSectorExpansion = (sectorKey: string) => {
    setExpandedSectorsOrg(prev => {
      const isExpanded = !!prev[sectorKey];
      const next = { ...prev, [sectorKey]: !isExpanded };
      if (isExpanded) {
        setExpandedPeriodsOrg(prevPeriods => {
          const filtered: Record<string, boolean> = {};
          Object.keys(prevPeriods).forEach(key => {
            if (!key.startsWith(`${sectorKey}|`)) {
              filtered[key] = prevPeriods[key];
            }
          });
          return filtered;
        });
      }
      return next;
    });
  };

  const togglePeriodExpansion = (periodKey: string) => {
    setExpandedPeriodsOrg(prev => ({
      ...prev,
      [periodKey]: !prev[periodKey]
    }));
  };

  const formatCpf = (cpf?: string) => {
    if (!cpf) return 'CPF não informado';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) {
      return cpf;
    }
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`;
  };

  // Funções auxiliares para coletar fileNames de documentos (usando fileName como identificador único)
  const collectCompanyDocumentFileNames = (company: HoleriteCompanyGroup): string[] => {
    const fileNames: string[] = [];
    company.sectors?.forEach(sector => {
      sector.periods?.forEach(period => {
        period.payslips?.forEach(payslip => {
          if (payslip.fileName) {
            fileNames.push(payslip.fileName);
          }
        });
      });
    });
    return fileNames;
  };

  const collectSectorDocumentFileNames = (sector: HoleriteSectorGroup): string[] => {
    const fileNames: string[] = [];
    sector.periods?.forEach(period => {
      period.payslips?.forEach(payslip => {
        if (payslip.fileName) {
          fileNames.push(payslip.fileName);
        }
      });
    });
    return fileNames;
  };

  const collectPeriodDocumentFileNames = (period: HoleritePeriodGroup): string[] => {
    return period.payslips?.map(p => p.fileName).filter(Boolean) || [];
  };

  // Função para verificar se todos os documentos estão selecionados
  const areFileNamesFullySelected = (fileNames: string[]): boolean => {
    if (fileNames.length === 0) return false;
    return fileNames.every(fileName => selectedUnifiedDocuments.has(fileName));
  };

  // Função para obter fileNames selecionados
  const getSelectedFileNames = (fileNames: string[]): string[] => {
    return fileNames.filter(fileName => selectedUnifiedDocuments.has(fileName));
  };

  // Função para lidar com seleção de documentos
  const handleSelectDocuments = (fileNames: string[], checked: boolean) => {
    setSelectedUnifiedDocuments(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        fileNames.forEach(fileName => {
          if (fileName) {
            newSelected.add(fileName);
          }
        });
      } else {
        fileNames.forEach(fileName => {
          newSelected.delete(fileName);
        });
      }
      return newSelected;
    });
  };

  // Função para abrir modal de confirmação de exclusão
  const handleDeleteDocuments = (type: 'individual' | 'batch', fileNames?: string[]) => {
    if (!fileNames || fileNames.length === 0) {
      toast({
        title: '⚠️ Nenhum documento selecionado',
        description: 'Selecione pelo menos um documento para excluir.',
        variant: 'destructive',
      });
      return;
    }

    setDeleteType(type);
    setDocumentsToDelete(fileNames);
    setShowDeleteConfirmModal(true);
  };

  // Função para executar a exclusão após confirmação
  const executeDeleteDocuments = async () => {
    if (documentsToDelete.length === 0) {
      setShowDeleteConfirmModal(false);
      return;
    }

    try {
      setDeletingDocuments(true);
      
      if (deleteType === 'individual' && documentsToDelete.length === 1) {
        const response = await api.delete(`/api/unified-documents/delete/${encodeURIComponent(documentsToDelete[0])}`);
        if (response.data.sucesso) {
          toast({
            title: '✅ Documento excluído',
            description: 'Documento excluído com sucesso!',
          });
          // Remover da seleção
          setSelectedUnifiedDocuments(prev => {
            const newSet = new Set(prev);
            newSet.delete(documentsToDelete[0]);
            return newSet;
          });
          // Forçar recarga completa após exclusão
          await loadOrganization(true);
          
          // Aguardar um pouco para garantir que o backend processou
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Recarregar novamente para garantir sincronização
          await loadOrganization(true);
        } else {
          throw new Error(response.data.mensagem || 'Erro ao excluir documento');
        }
      } else {
        const response = await api.delete('/api/unified-documents/delete-multiple', {
          data: documentsToDelete
        });
        if (response.data.sucesso) {
          const deletedCount = response.data.deletedCount || documentsToDelete.length;
          toast({
            title: '✅ Exclusão concluída',
            description: `${deletedCount} documento(s) excluído(s) com sucesso!`,
          });
          // Remover da seleção
          const deletedFiles = response.data.deletedFiles || documentsToDelete;
          setSelectedUnifiedDocuments(prev => {
            const newSet = new Set(prev);
            deletedFiles.forEach((fileName: string) => newSet.delete(fileName));
            return newSet;
          });
          
          // Forçar recarga completa após exclusão
          await loadOrganization(true);
          
          // Aguardar um pouco para garantir que o backend processou
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Recarregar novamente para garantir sincronização
          await loadOrganization(true);
        } else {
          throw new Error(response.data.mensagem || 'Erro ao excluir documentos');
        }
      }
    } catch (error: any) {
      console.error('Erro ao excluir documentos:', error);
      toast({
        title: '❌ Erro na exclusão',
        description: error.response?.data?.message || error.message || 'Erro ao excluir documentos',
        variant: 'destructive',
      });
    } finally {
      setDeletingDocuments(false);
      setShowDeleteConfirmModal(false);
      setDocumentsToDelete([]);
    }
  };

  // Função de download por empresa (usando endpoint otimizado do backend)
  const handleDownloadByCompany = async (companyName: string) => {
    try {
      setLoading(true);
      toast({
        title: '📦 Preparando download...',
        description: `Organizando documentos da empresa ${companyName}...`,
      });

      // Usar o endpoint otimizado do backend que já cria o ZIP organizado
      const url = `/api/unified-documents/download/company`;
      const response = await api.get(url, { 
        params: { name: companyName },
        responseType: 'blob',
        timeout: 300000 // 5 minutos para downloads grandes
      });
      
      const blob = new Blob([response.data], { type: 'application/zip' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_documentos_unificados.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      
      toast({ 
        title: '✅ Download iniciado', 
        description: `Baixando documentos da empresa ${companyName}. O ZIP está organizado por Empresa/Setor/Período/Funcionário.`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Erro ao baixar documentos da empresa:', error);
      
      // Se o endpoint falhar com 404, informar que não há documentos
      if (error.response?.status === 404) {
        toast({ 
          title: '⚠️ Nenhum documento encontrado', 
          description: `Não foram encontrados documentos unificados para a empresa "${companyName}".`,
          variant: 'default',
          duration: 5000,
        });
      } else {
        toast({ 
          title: '❌ Erro no download', 
          description: error.response?.data?.message || error.message || 'Erro ao baixar documentos da empresa. Verifique se todos os arquivos existem.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Função de download por setor
  const handleDownloadBySector = async (sectorName: string) => {
    try {
      setLoading(true);
      toast({
        title: '📦 Preparando download...',
        description: `Organizando documentos do setor ${sectorName}...`,
      });

      // Tentar usar o endpoint de download por setor do holeriteService
      try {
        const blob = await holeriteService.downloadBySector(sectorName);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sectorName.replace(/[^a-zA-Z0-9]/g, '_')}_documentos_unificados.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ 
          title: '✅ Download concluído', 
          description: `Documentos do setor ${sectorName} baixados com sucesso.` 
        });
      } catch (holeriteError) {
        // Fallback: criar ZIP client-side com os documentos do setor
        console.log('Endpoint de setor não disponível, criando ZIP client-side...');
        const sectorFileNames = organizationData?.companies
          .flatMap(c => c.sectors || [])
          .find(s => s.sectorName === sectorName)
          ?.periods?.flatMap(p => p.payslips?.map(ps => ps.fileName).filter(Boolean) || []) || [];

        if (sectorFileNames.length === 0) {
          throw new Error('Nenhum documento encontrado para este setor');
        }

        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const BATCH_SIZE = 10; // Downloads simultâneos
        let successCount = 0;
        let failCount = 0;
        const failedFiles: string[] = [];
        
        // Download paralelo otimizado
        for (let i = 0; i < sectorFileNames.length; i += BATCH_SIZE) {
          const batch = sectorFileNames.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(async (fileName) => {
            try {
              const response = await api.get(`/api/unified-documents/download/${encodeURIComponent(fileName)}`, {
                responseType: 'blob',
                timeout: 30000
              });
              zip.file(fileName, response.data);
              successCount++;
            } catch (err: any) {
              console.warn(`⚠️ Arquivo não encontrado: ${fileName}`, err.response?.status);
              failCount++;
              failedFiles.push(fileName);
            }
          });
          await Promise.all(batchPromises);
          
          // Atualizar progresso
          if (i + BATCH_SIZE < sectorFileNames.length) {
            toast({
              title: '📦 Download em progresso...',
              description: `${Math.min(i + BATCH_SIZE, sectorFileNames.length)}/${sectorFileNames.length} arquivo(s) processado(s)...`,
              duration: 2000,
            });
          }
        }
        
        if (successCount === 0) {
          throw new Error(`Nenhum dos ${sectorFileNames.length} documento(s) foi encontrado no servidor. Os arquivos podem não ter sido gerados ainda ou podem estar em um local diferente.`);
        }
        
        const blob = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${sectorName.replace(/[^a-zA-Z0-9]/g, '_')}_documentos_unificados.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        
        if (failCount > 0) {
          toast({
            title: '⚠️ Download parcial',
            description: `${successCount} documento(s) baixado(s) com sucesso, ${failCount} não foram encontrados no servidor.`,
            variant: 'default',
            duration: 5000
          });
          console.warn('Arquivos que falharam:', failedFiles.slice(0, 10)); // Log dos primeiros 10
        } else {
          toast({
            title: '✅ Download concluído',
            description: `ZIP criado com ${successCount} documento(s) do setor ${sectorName}.`,
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao baixar documentos do setor:', error);
      toast({ 
        title: '❌ Erro no download', 
        description: error.response?.data?.message || error.message || 'Erro ao baixar documentos do setor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Função de envio de documentos
  const handleSendDocuments = async (type: 'email' | 'whatsapp', fileNames?: string[]) => {
    if (!fileNames || fileNames.length === 0) {
      toast({
        title: '⚠️ Nenhum documento selecionado',
        description: 'Selecione pelo menos um documento para enviar.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '⏳ Em desenvolvimento',
      description: `Envio por ${type === 'email' ? 'Email' : 'WhatsApp'} será implementado em breve.`,
    });
  };

  // Função de renderização de empresas (igual Holerites)
  const renderOrganizationCompanies = () => {
    if (!organizationData?.companies?.length) {
      return (
        <div className="rounded-2xl border border-gray-700/60 bg-gray-900/40 p-8 text-center text-gray-300 shadow-inner">
          Nenhum documento unificado encontrado. Crie documentos unificados para visualizar a organização.
        </div>
      );
    }

    // Filtrar empresas "OUTROS" que não têm documentos
    const filteredCompanies = organizationData.companies.filter(company => {
      // Se a empresa é "OUTROS" e não tem documentos, filtrar
      const isOutros = (company.companySigla || '').toUpperCase() === 'OUTROS';
      const hasDocuments = (company.totalPayslips || 0) > 0;
      return !isOutros || hasDocuments;
    });

    if (filteredCompanies.length === 0) {
      return (
        <div className="rounded-2xl border border-gray-700/60 bg-gray-900/40 p-8 text-center text-gray-300 shadow-inner">
          Nenhum documento unificado encontrado. Crie documentos unificados para visualizar a organização.
        </div>
      );
    }

    return filteredCompanies.map(company => {
      const companyKey = getCompanyKey(company);
      const companyExpanded = !!expandedCompanies[companyKey];

      return (
        <div
          key={companyKey}
          className="rounded-2xl border border-gray-700/60 bg-gray-900/60 backdrop-blur-sm overflow-hidden shadow-[0_30px_60px_-50px_rgba(0,0,0,0.9)]"
        >
          <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-seguranca-black/60 text-seguranca-yellow border border-yellow-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {company.companySigla}
                  </Badge>
                  <p className="text-lg font-semibold text-white leading-tight">
                    {company.companyName}
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 flex flex-wrap items-center gap-2">
                  <Building2 className="h-4 w-4 text-seguranca-yellow" />
                  CNPJ: {company.companyCnpj || 'Não informado'} · {company.totalPayslips} documento(s) · {company.sectors.length} setor(es)
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full lg:w-auto">
                {/* Primeira linha: Checkbox e botão Ver setores */}
                <div className="flex flex-wrap items-center gap-3">
                  {(() => {
                    const companyFileNames = collectCompanyDocumentFileNames(company);
                    const companySelectedFileNames = getSelectedFileNames(companyFileNames);
                    const companySelectedCount = companySelectedFileNames.length;
                    const companyCheckboxState: boolean | 'indeterminate' = companyFileNames.length === 0
                      ? false
                      : areFileNamesFullySelected(companyFileNames)
                        ? true
                        : companySelectedCount > 0
                          ? 'indeterminate'
                          : false;
                    
                    return (
                      <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl px-3 py-2">
                        <Checkbox
                          checked={companyCheckboxState}
                          onCheckedChange={(checked) => handleSelectDocuments(companyFileNames, checked === true)}
                          className="border-blue-400"
                        />
                        <span className="text-xs sm:text-sm text-gray-300">Selecionar empresa</span>
                      </div>
                    );
                  })()}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCompanyExpansion(companyKey)}
                    className="text-seguranca-lightgray hover:text-white"
                  >
                    {companyExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                    {companyExpanded ? 'Ocultar setores' : 'Ver setores'}
                  </Button>
                </div>
                
                {/* Segunda linha: Botões de ação sempre visíveis */}
                <div className="flex flex-wrap gap-2 items-center">
                  {(() => {
                    const companyFileNames = collectCompanyDocumentFileNames(company);
                    const companySelectedFileNames = getSelectedFileNames(companyFileNames);
                    const companySelectedCount = companySelectedFileNames.length;
                    
                    return (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadByCompany(company.companyName || company.companyCnpj || '')}
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-800/50 hover:text-white bg-purple-500/10"
                          disabled={loading || loadingOrganization || (company.totalPayslips || 0) === 0}
                          title={(company.totalPayslips || 0) === 0 ? 'Nenhum documento unificado encontrado' : 'Baixar todos os documentos da empresa organizados por Empresa/Setor/Período/Funcionário'}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span className="whitespace-nowrap">Preparando...</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              <span className="whitespace-nowrap">Download Lote</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const fileNames = companyFileNames.length > 0 ? companyFileNames : collectCompanyDocumentFileNames(company);
                            if (fileNames.length > 0) {
                              handleSendDocuments('whatsapp', fileNames);
                            }
                          }}
                          className="border-blue-500/50 text-blue-300 hover:bg-blue-800/50 hover:text-white bg-blue-500/10"
                          disabled={(company.totalPayslips || 0) === 0}
                          title={(company.totalPayslips || 0) === 0 ? 'Nenhum documento unificado encontrado' : 'Enviar todos os documentos por WhatsApp'}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          <span className="whitespace-nowrap">WhatsApp Todos</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const fileNames = collectCompanyDocumentFileNames(company);
                            console.log('🗑️ Excluir empresa - fileNames coletados:', fileNames.length, fileNames);
                            if (fileNames.length > 0) {
                              handleDeleteDocuments('batch', fileNames);
                            } else {
                              toast({
                                title: '⚠️ Nenhum documento encontrado',
                                description: 'Não há documentos para excluir nesta empresa.',
                                variant: 'destructive',
                              });
                            }
                          }}
                          className="border-red-500/50 text-red-300 hover:bg-red-800/50 hover:text-white bg-red-500/10"
                          disabled={deletingDocuments || (company.totalPayslips || 0) === 0}
                          title={(company.totalPayslips || 0) === 0 ? 'Nenhum documento unificado encontrado' : 'Excluir todos os documentos da empresa'}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="whitespace-nowrap">Excluir Todos</span>
                        </Button>
                        
                        {/* Botões de ação em massa - aparecem quando há seleção */}
                        {companySelectedCount > 0 && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600/90 text-white hover:bg-green-600"
                              onClick={() => {
                                handleSendDocuments('email', companySelectedFileNames);
                              }}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Email ({companySelectedCount})
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600/90 text-white hover:bg-blue-600"
                              onClick={() => {
                                handleSendDocuments('whatsapp', companySelectedFileNames);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              WhatsApp ({companySelectedCount})
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="bg-red-600/90 hover:bg-red-700 border-red-700"
                              onClick={() => {
                                handleDeleteDocuments('batch', companySelectedFileNames);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir ({companySelectedCount})
                            </Button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            {companyExpanded && (
              <div className="space-y-4">
                {company.sectors && company.sectors.length > 0 ? (
                  company.sectors.map(sector => {
                    const sectorKey = getSectorKey(companyKey, sector);
                    const sectorExpanded = !!expandedSectorsOrg[sectorKey];

                    return (
                      <div key={sectorKey} className="rounded-xl border border-gray-800/60 bg-gray-900/50 overflow-hidden">
                        <div className="flex flex-col gap-3 px-4 py-3">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {(() => {
                                const sectorFileNames = collectSectorDocumentFileNames(sector);
                                const sectorSelectedFileNames = getSelectedFileNames(sectorFileNames);
                                const sectorSelectedCount = sectorSelectedFileNames.length;
                                const sectorCheckboxState: boolean | 'indeterminate' = sectorFileNames.length === 0
                                  ? false
                                  : areFileNamesFullySelected(sectorFileNames)
                                    ? true
                                    : sectorSelectedCount > 0
                                      ? 'indeterminate'
                                      : false;
                                
                                return (
                                  <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl px-3 py-2">
                                    <Checkbox
                                      checked={sectorCheckboxState}
                                      onCheckedChange={(checked) => handleSelectDocuments(sectorFileNames, checked === true)}
                                      className="border-blue-400"
                                    />
                                    <span className="text-xs text-gray-300">Selecionar setor</span>
                                  </div>
                                );
                              })()}
                              <div>
                                <p className="text-sm font-semibold text-white">{sector.sectorName}</p>
                                <p className="text-xs text-gray-400">
                                  {sector.totalPayslips} documento(s) · {sector.periods?.length ?? 0} período(s)
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSectorExpansion(sectorKey)}
                              className="text-seguranca-lightgray hover:text-white"
                            >
                              {sectorExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                              {sectorExpanded ? 'Ocultar períodos' : 'Ver períodos'}
                            </Button>
                          </div>
                          
                          {/* Botões de ação do setor */}
                          <div className="flex flex-wrap gap-2 items-center">
                            {(() => {
                              const sectorFileNames = collectSectorDocumentFileNames(sector);
                              const sectorSelectedFileNames = getSelectedFileNames(sectorFileNames);
                              const sectorSelectedCount = sectorSelectedFileNames.length;
                              
                              return (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadBySector(sector.sectorName || '')}
                                    className="border-purple-500/50 text-purple-300 hover:bg-purple-800/50 hover:text-white bg-purple-500/10"
                                    disabled={loading || (sector.totalPayslips || 0) === 0}
                                    title={(sector.totalPayslips || 0) === 0 ? 'Nenhum documento encontrado' : 'Baixar todos os documentos do setor'}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    <span className="whitespace-nowrap">Download Setor</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (sectorFileNames.length > 0) {
                                        handleSendDocuments('whatsapp', sectorFileNames);
                                      }
                                    }}
                                    className="border-blue-500/50 text-blue-300 hover:bg-blue-800/50 hover:text-white bg-blue-500/10"
                                    disabled={(sector.totalPayslips || 0) === 0}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    <span className="whitespace-nowrap">WhatsApp Todos</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const fileNames = collectSectorDocumentFileNames(sector);
                                      console.log('🗑️ Excluir setor - fileNames coletados:', fileNames.length, fileNames);
                                      if (fileNames.length > 0) {
                                        handleDeleteDocuments('batch', fileNames);
                                      } else {
                                        toast({
                                          title: '⚠️ Nenhum documento encontrado',
                                          description: 'Não há documentos para excluir neste setor.',
                                          variant: 'destructive',
                                        });
                                      }
                                    }}
                                    className="border-red-500/50 text-red-300 hover:bg-red-800/50 hover:text-white bg-red-500/10"
                                    disabled={deletingDocuments || (sector.totalPayslips || 0) === 0}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    <span className="whitespace-nowrap">Excluir Todos</span>
                                  </Button>
                                  
                                  {/* Botões de ação em massa - aparecem quando há seleção */}
                                  {sectorSelectedCount > 0 && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="bg-green-600/90 text-white hover:bg-green-600"
                                        onClick={() => {
                                          handleSendDocuments('email', sectorSelectedFileNames);
                                        }}
                                      >
                                        <Mail className="h-4 w-4 mr-1" />
                                        Email ({sectorSelectedCount})
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="bg-blue-600/90 text-white hover:bg-blue-600"
                                        onClick={() => {
                                          handleSendDocuments('whatsapp', sectorSelectedFileNames);
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4 mr-1" />
                                        WhatsApp ({sectorSelectedCount})
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="bg-red-600/90 hover:bg-red-700 border-red-700"
                                        onClick={() => {
                                          handleDeleteDocuments('batch', sectorSelectedFileNames);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Excluir ({sectorSelectedCount})
                                      </Button>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        {sectorExpanded && (
                          <div className="space-y-3 px-4 py-4 bg-gray-900/70">
                            {sector.periods && sector.periods.length > 0 ? (
                              sector.periods.map(period => {
                                const periodKey = getPeriodKey(sectorKey, period);
                                const periodExpanded = !!expandedPeriodsOrg[periodKey];

                                return (
                                  <div key={periodKey} className="rounded-xl border border-gray-800/60 bg-gray-900/60 overflow-hidden">
                                    <div className="flex flex-col gap-3 px-4 py-3">
                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                          {(() => {
                                            const periodFileNames = collectPeriodDocumentFileNames(period);
                                            const periodSelectedFileNames = getSelectedFileNames(periodFileNames);
                                            const periodSelectedCount = periodSelectedFileNames.length;
                                            const periodCheckboxState: boolean | 'indeterminate' = periodFileNames.length === 0
                                              ? false
                                              : areFileNamesFullySelected(periodFileNames)
                                                ? true
                                                : periodSelectedCount > 0
                                                  ? 'indeterminate'
                                                  : false;
                                            
                                            return (
                                              <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl px-3 py-2">
                                                <Checkbox
                                                  checked={periodCheckboxState}
                                                  onCheckedChange={(checked) => handleSelectDocuments(periodFileNames, checked === true)}
                                                  className="border-blue-400"
                                                />
                                                <span className="text-xs text-gray-300">Selecionar período</span>
                                              </div>
                                            );
                                          })()}
                                          <div>
                                            <p className="text-sm font-semibold text-white">{period.formattedPeriod}</p>
                                            <p className="text-xs text-gray-400">{period.totalPayslips} documento(s)</p>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => togglePeriodExpansion(periodKey)}
                                          className="text-seguranca-lightgray hover:text-white"
                                        >
                                          {periodExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                                          {periodExpanded ? 'Ocultar documentos' : 'Ver documentos'}
                                        </Button>
                                      </div>
                                      
                                      {/* Botões de ação do período */}
                                      <div className="flex flex-wrap gap-2 items-center">
                                        {(() => {
                                          const periodFileNames = collectPeriodDocumentFileNames(period);
                                          const periodSelectedFileNames = getSelectedFileNames(periodFileNames);
                                          const periodSelectedCount = periodSelectedFileNames.length;
                                          
                                          return (
                                            <>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async () => {
                                                  if (periodFileNames.length === 0) {
                                                    toast({
                                                      title: '⚠️ Nenhum documento',
                                                      description: 'Não há documentos para baixar neste período.',
                                                      variant: 'destructive'
                                                    });
                                                    return;
                                                  }
                                                  
                                                  try {
                                                    setLoading(true);
                                                    toast({
                                                      title: '📦 Preparando ZIP...',
                                                      description: `Compactando ${periodFileNames.length} documento(s) do período ${period.formattedPeriod}...`,
                                                    });

                                                    const JSZip = (await import('jszip')).default;
                                                    const zip = new JSZip();
                                                    
                                                    let successCount = 0;
                                                    let failCount = 0;
                                                    const BATCH_SIZE = 10; // Downloads simultâneos
                                                    const failedFiles: string[] = [];
                                                    
                                                    // Download paralelo otimizado
                                                    for (let i = 0; i < periodFileNames.length; i += BATCH_SIZE) {
                                                      const batch = periodFileNames.slice(i, i + BATCH_SIZE);
                                                      const batchPromises = batch.map(async (fileName) => {
                                                        try {
                                                          const response = await api.get(`/api/unified-documents/download/${encodeURIComponent(fileName)}`, {
                                                            responseType: 'blob',
                                                            timeout: 30000
                                                          });
                                                          zip.file(fileName, response.data);
                                                          successCount++;
                                                        } catch (err: any) {
                                                          console.warn(`⚠️ Arquivo não encontrado: ${fileName}`, err.response?.status);
                                                          failCount++;
                                                          failedFiles.push(fileName);
                                                        }
                                                      });
                                                      await Promise.all(batchPromises);
                                                      
                                                      // Atualizar progresso
                                                      if (i + BATCH_SIZE < periodFileNames.length) {
                                                        toast({
                                                          title: '📦 Download em progresso...',
                                                          description: `${Math.min(i + BATCH_SIZE, periodFileNames.length)}/${periodFileNames.length} arquivo(s) processado(s)...`,
                                                          duration: 2000,
                                                        });
                                                      }
                                                    }
                                                    
                                                    if (successCount === 0) {
                                                      throw new Error(`Nenhum dos ${periodFileNames.length} documento(s) foi encontrado no servidor. Os arquivos podem não ter sido gerados ainda ou podem estar em um local diferente.`);
                                                    }
                                                    
                                                    const blob = await zip.generateAsync({ 
                                                      type: 'blob',
                                                      compression: 'DEFLATE',
                                                      compressionOptions: { level: 6 }
                                                    });
                                                    const link = document.createElement('a');
                                                    link.href = URL.createObjectURL(blob);
                                                    link.download = `${period.formattedPeriod?.replace(/\//g, '_') || 'periodo'}_documentos_unificados.zip`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                    window.URL.revokeObjectURL(link.href);
                                                    
                                                    if (failCount > 0) {
                                                      toast({
                                                        title: '⚠️ Download parcial',
                                                        description: `${successCount} documento(s) baixado(s) com sucesso, ${failCount} não foram encontrados no servidor.`,
                                                        variant: 'default',
                                                        duration: 5000
                                                      });
                                                      console.warn('Arquivos que falharam:', failedFiles.slice(0, 10)); // Log dos primeiros 10
                                                    } else {
                                                      toast({
                                                        title: '✅ Download concluído',
                                                        description: `ZIP criado com ${successCount} documento(s) do período ${period.formattedPeriod}.`,
                                                      });
                                                    }
                                                  } catch (err: any) {
                                                    console.error('Erro ao criar ZIP:', err);
                                                    toast({
                                                      title: '❌ Erro no download',
                                                      description: err.message || 'Erro ao criar arquivo ZIP',
                                                      variant: 'destructive'
                                                    });
                                                  } finally {
                                                    setLoading(false);
                                                  }
                                                }}
                                                className="border-purple-500/50 text-purple-300 hover:bg-purple-800/50 hover:text-white bg-purple-500/10"
                                                disabled={loading || (period.totalPayslips || 0) === 0}
                                                title={(period.totalPayslips || 0) === 0 ? 'Nenhum documento encontrado' : `Baixar todos os documentos do período ${period.formattedPeriod}`}
                                              >
                                                {loading ? (
                                                  <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    <span className="whitespace-nowrap">Preparando...</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    <span className="whitespace-nowrap">Download Período</span>
                                                  </>
                                                )}
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  if (periodFileNames.length > 0) {
                                                    handleSendDocuments('whatsapp', periodFileNames);
                                                  }
                                                }}
                                                className="border-blue-500/50 text-blue-300 hover:bg-blue-800/50 hover:text-white bg-blue-500/10"
                                                disabled={(period.totalPayslips || 0) === 0}
                                              >
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                <span className="whitespace-nowrap">WhatsApp Todos</span>
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  const fileNames = collectPeriodDocumentFileNames(period);
                                                  console.log('🗑️ Excluir período - fileNames coletados:', fileNames.length, fileNames);
                                                  if (fileNames.length > 0) {
                                                    handleDeleteDocuments('batch', fileNames);
                                                  } else {
                                                    toast({
                                                      title: '⚠️ Nenhum documento encontrado',
                                                      description: 'Não há documentos para excluir neste período.',
                                                      variant: 'destructive',
                                                    });
                                                  }
                                                }}
                                                className="border-red-500/50 text-red-300 hover:bg-red-800/50 hover:text-white bg-red-500/10"
                                                disabled={deletingDocuments || (period.totalPayslips || 0) === 0}
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                <span className="whitespace-nowrap">Excluir Todos</span>
                                              </Button>
                                              
                                              {/* Botões de ação em massa - aparecem quando há seleção */}
                                              {periodSelectedCount > 0 && (
                                                <>
                                                  <Button
                                                    size="sm"
                                                    className="bg-green-600/90 text-white hover:bg-green-600"
                                                    onClick={() => {
                                                      handleSendDocuments('email', periodSelectedFileNames);
                                                    }}
                                                  >
                                                    <Mail className="h-4 w-4 mr-1" />
                                                    Email ({periodSelectedCount})
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    className="bg-blue-600/90 text-white hover:bg-blue-600"
                                                    onClick={() => {
                                                      handleSendDocuments('whatsapp', periodSelectedFileNames);
                                                    }}
                                                  >
                                                    <MessageSquare className="h-4 w-4 mr-1" />
                                                    WhatsApp ({periodSelectedCount})
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="bg-red-600/90 hover:bg-red-700 border-red-700"
                                                    onClick={() => {
                                                      handleDeleteDocuments('batch', periodSelectedFileNames);
                                                    }}
                                                  >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Excluir ({periodSelectedCount})
                                                  </Button>
                                                </>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                    {periodExpanded && (
                                      <div className="divide-y divide-gray-800 bg-gray-950/60">
                                        {period.payslips.map(entry => {
                                          return (
                                            <div
                                              key={entry.id}
                                              className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 py-4"
                                            >
                                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-semibold text-white">{entry.employeeName}</p>
                                                  <p className="text-xs text-gray-400">
                                                    CPF: {formatCpf(entry.cpf)} · Arquivo: {entry.fileName}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {/* Checkbox de seleção individual */}
                                                <Checkbox
                                                  checked={selectedUnifiedDocuments.has(entry.fileName)}
                                                  onCheckedChange={(checked) => {
                                                    handleSelectDocuments([entry.fileName], checked === true);
                                                  }}
                                                  className="border-blue-400"
                                                />
                                                
                                                <div className="flex flex-wrap gap-2">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                                                    onClick={() => {
                                                      unifiedDocumentService.viewUnifiedDocument(entry.fileName).catch(err => {
                                                        toast({
                                                          title: 'Erro',
                                                          description: 'Erro ao visualizar documento',
                                                          variant: 'destructive'
                                                        });
                                                      });
                                                    }}
                                                  >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Visualizar
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                                                    onClick={() => {
                                                      unifiedDocumentService.downloadUnifiedDocument(entry.fileName).catch(err => {
                                                        toast({
                                                          title: 'Erro',
                                                          description: 'Erro ao baixar documento',
                                                          variant: 'destructive'
                                                        });
                                                      });
                                                    }}
                                                  >
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Download
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-green-500/50 text-green-300 hover:bg-green-800/50"
                                                    onClick={() => {
                                                      handleSendDocuments('email', [entry.fileName]);
                                                    }}
                                                  >
                                                    <Mail className="h-4 w-4 mr-1" />
                                                    Email
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-blue-500/50 text-blue-300 hover:bg-blue-800/50"
                                                    onClick={() => {
                                                      handleSendDocuments('whatsapp', [entry.fileName]);
                                                    }}
                                                  >
                                                    <MessageSquare className="h-4 w-4 mr-1" />
                                                    WhatsApp
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-500/50 text-red-300 hover:bg-red-800/50"
                                                    onClick={() => {
                                                      handleDeleteDocuments('individual', [entry.fileName]);
                                                    }}
                                                    disabled={deletingDocuments}
                                                  >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Excluir
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="rounded-xl border border-dashed border-gray-700 p-4 text-sm text-gray-400 text-center">
                                Nenhum período encontrado para este setor.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-700 p-4 text-sm text-gray-400 text-center">
                    Nenhum setor encontrado para esta empresa.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewDocument(null);
    setPreviewContext(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const handlePreviewEmailSend = async () => {
    if (!previewDocument) return;
    try {
      setPreviewSending('email');
      await handleSendEmail(previewDocument);
    } finally {
      setPreviewSending(null);
    }
  };

  const handlePreviewWhatsappSend = async () => {
    if (!previewDocument) return;
    try {
      setPreviewSending('whatsapp');
      await handleSendWhatsApp(previewDocument);
    } finally {
      setPreviewSending(null);
    }
  };

  const handleViewDocument = async (sector: string, period: string, document: DocumentData) => {
    const url = `/api/sector-organization/download/${encodeURIComponent(sector)}/${encodeURIComponent(period)}/${encodeURIComponent(document.fileName)}`;
    try {
      setPreviewLoading(true);
      setPreviewDocument(document);
      setPreviewContext({ sector, period });
      setShowPreviewModal(true);

      const response = await axios.get(url, { responseType: 'blob' });
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
    } catch (error: any) {
      console.error('Erro ao carregar visualização:', error);
      toast({
        title: '❌ Erro na visualização',
        description: error.response?.data?.message || 'Não foi possível carregar o documento',
        variant: 'destructive'
      });
      closePreviewModal();
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadIndividualDocument = async (sector: string, period: string, doc: DocumentData) => {
    try {
      const url = `/api/sector-organization/download/${encodeURIComponent(sector)}/${encodeURIComponent(period)}/${encodeURIComponent(doc.fileName)}`;
      const response = await axios.get(url, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = doc.fileName;
      link.click();
      
      toast({
        title: '✅ Sucesso!',
        description: 'Download iniciado',
      });
    } catch (error: any) {
      console.error('Erro ao baixar:', error);
      toast({
        title: '❌ Erro no download',
        description: error.response?.data?.message || 'Erro ao baixar documento',
        variant: 'destructive'
      });
    }
  };

  const openDownloadOptions = (sector: string, period: string, doc: DocumentData) => {
    setDownloadOptions({
      open: true,
      sector,
      period,
      document: doc,
    });
  };

  const closeDownloadOptions = () => {
    setDownloadOptions({
      open: false,
      sector: '',
      period: '',
      document: null,
    });
  };

  const handleDownloadChoice = async (choice: 'individual' | 'zip') => {
    const { sector, period, document: doc } = downloadOptions;
    if (!sector || !period || !doc) {
      closeDownloadOptions();
      return;
    }

    closeDownloadOptions();

    if (choice === 'individual') {
      await downloadIndividualDocument(sector, period, doc);
    } else {
      await handleDownloadZip(sector, period);
    }
  };

  // Baixar ZIP por setor/período
  const handleDownloadZip = async (sector: string, period: string) => {
    try {
      toast({
        title: '📦 Preparando ZIP...',
        description: 'Aguarde enquanto compactamos os documentos',
      });

      const url = `/api/sector-organization/download-zip/${encodeURIComponent(sector)}/${encodeURIComponent(period)}`;
      const response = await axios.get(url, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/zip' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${sector.replace(/[^a-zA-Z0-9]/g, '_')}_${period}.zip`;
      link.click();
      
      toast({
        title: '✅ Sucesso!',
        description: 'Download do ZIP iniciado',
      });
    } catch (error: any) {
      console.error('Erro ao baixar ZIP:', error);
      toast({
        title: '❌ Erro no download',
        description: error.response?.data?.message || 'Erro ao criar ZIP',
        variant: 'destructive'
      });
    }
  };

  // Enviar por email
  const handleSendEmail = async (doc: DocumentData) => {
    try {
      const response = await axios.post('/api/sector-organization/send-email', {
        filePath: doc.filePath,
        cpf: doc.cpf,
        employeeName: doc.employeeName
      });

      if (response.data.success) {
        toast({
          title: '✅ Email enviado!',
          description: response.data.message,
        });
      } else {
        toast({
          title: '⚠️ Aviso',
          description: response.data.message || 'Não foi possível enviar o email',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: '❌ Erro no envio',
        description: error.response?.data?.message || 'Erro ao enviar email',
        variant: 'destructive'
      });
    }
  };

  // Enviar por WhatsApp
  const handleSendWhatsApp = async (doc: DocumentData) => {
    try {
      const response = await axios.post('/api/sector-organization/send-whatsapp', {
        filePath: doc.filePath,
        cpf: doc.cpf,
        employeeName: doc.employeeName
      });

      if (response.data.success) {
        toast({
          title: '✅ WhatsApp enviado!',
          description: response.data.message,
        });
      } else {
        toast({
          title: '⚠️ Aviso',
          description: response.data.message || 'Não foi possível enviar o WhatsApp',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Erro ao enviar WhatsApp:', error);
      toast({
        title: '❌ Erro no envio',
        description: error.response?.data?.message || 'Erro ao enviar WhatsApp',
        variant: 'destructive'
      });
    }
  };

  // Carregar ao montar componente
  useEffect(() => {
    loadOrganizedDocuments();
  }, []);

  // Formatar nome do período (6_2025 → Junho/2025)
  const formatPeriod = (period: string) => {
    if (!period || period === 'undefined' || period === '0' || period.includes('undefined') || period.includes('/0')) {
      return 'Período Inválido';
    }
    
    const [month, year] = period.split('_');
    
    // Validar se mês e ano são válidos
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12 || yearNum < 2000 || yearNum > 2100) {
      console.warn('⚠️ Período inválido:', period);
      return period; // Retornar o período original se inválido
    }
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return `${monthNames[monthNum - 1]}/${yearNum}`;
  };

  return (
    <>
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
              <FileText className="h-8 w-8 text-seguranca-yellow" />
              Documentos Unificados
            </h1>
            <p className="text-gray-400 mt-1">
              Documentos organizados por Empresa/Setor/Ano/Mês
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => loadOrganization(true)}
              disabled={loadingOrganization}
              className="border-gray-600/60 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              {loadingOrganization ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar dados
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Documentos</p>
                  <p className="text-3xl font-bold text-green-400">{organizationData?.totalPayslips || 0}</p>
                </div>
                <FileText className="w-10 h-10 text-green-600/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Empresas</p>
                  <p className="text-3xl font-bold text-blue-400">{organizationData?.totalCompanies || 0}</p>
                </div>
                <Building2 className="w-10 h-10 text-blue-600/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Setores</p>
                  <p className="text-3xl font-bold text-yellow-400">{organizationData?.totalSectors || 0}</p>
                </div>
                <FolderOpen className="w-10 h-10 text-yellow-600/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organização por Empresa/Setor/Ano/Mês */}
        <div className="bg-gradient-to-br from-black/70 via-gray-900/80 to-gray-900/60 border border-gray-700/60 rounded-3xl p-4 sm:p-6 lg:p-8 space-y-6 shadow-[0_30px_65px_-50px_rgba(15,23,42,0.9)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-seguranca-yellow/20 text-seguranca-yellow">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-semibold text-white">Documentos Unificados por Empresa/Setor/Período</h4>
                <p className="text-sm text-gray-400 max-w-2xl">
                  Navegue pela estrutura organizada de empresas, setores e períodos para localizar e gerenciar rapidamente os documentos unificados.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {organizationError && (
                <Badge className="bg-red-600/20 text-red-200 border border-red-500/40 px-3 py-1 rounded-xl">
                  Problemas na última atualização
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={() => loadOrganization(true)}
                disabled={loadingOrganization}
                className="border-gray-600/60 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                {loadingOrganization ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Atualizando
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recarregar dados
                  </>
                )}
              </Button>
            </div>
          </div>

          {organizationError && (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border border-red-500/30 bg-red-500/10 text-red-100 px-4 py-4 rounded-2xl">
              <div className="flex items-center gap-2 text-red-200">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-semibold">Não foi possível carregar a organização</p>
              </div>
              <p className="text-sm">{organizationError}</p>
            </div>
          )}

          {loadingOrganization ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-seguranca-yellow" />
            </div>
          ) : (
            <div className="space-y-4">
              {renderOrganizationCompanies()}
            </div>
          )}
        </div>
    </div>

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

      {/* Modal de Visualização do Documento */}
      <Dialog open={showPreviewModal} onOpenChange={(open) => open ? setShowPreviewModal(true) : closePreviewModal()}>
        <DialogContent className="w-[95vw] h-[95vh] sm:w-[90vw] sm:h-[90vh] lg:max-w-6xl lg:max-h-[90vh] bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-purple-600/50 rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Eye size={24} className="text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-2xl font-bold text-white leading-tight">
                    Documento Unificado
                  </DialogTitle>
                  <p className="text-purple-300/90 text-xs sm:text-sm font-medium mt-0 truncate max-w-[200px] sm:max-w-none">
                    {previewDocument?.employeeName || 'Funcionário não identificado'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-purple-500/40 text-purple-200 hover:bg-purple-500/10"
                onClick={closePreviewModal}
              >
                Fechar
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            <div className="w-full lg:w-72 xl:w-80 bg-gradient-to-b from-seguranca-black/80 via-seguranca-graphite/60 to-seguranca-black/80 border-b lg:border-b-0 lg:border-r border-purple-500/20 p-5 space-y-4 overflow-y-auto">
              <div className="space-y-3 text-sm text-gray-300">
                <div className="bg-black/30 border border-purple-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-purple-200 font-semibold text-xs uppercase tracking-wide">Funcionário</p>
                  <p className="text-white text-base font-medium">
                    {previewDocument?.employeeName || 'N/A'}
                  </p>
                </div>

                <div className="bg-black/30 border border-purple-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-purple-200 font-semibold text-xs uppercase tracking-wide">Período</p>
                  <p className="text-white text-base font-medium">
                    {previewDocument ? `${previewDocument.month}/${previewDocument.year}` : (previewContext?.period?.replace('_', '/') || 'N/A')}
                  </p>
                </div>

                <div className="bg-black/30 border border-purple-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-purple-200 font-semibold text-xs uppercase tracking-wide">Setor</p>
                  <p className="text-white text-base font-medium">
                    {previewContext?.sector ? previewContext.sector.replace(/_/g, ' ') : (previewDocument?.sector || 'N/A')}
                  </p>
                </div>

                <div className="bg-black/30 border border-purple-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-purple-200 font-semibold text-xs uppercase tracking-wide">Arquivo</p>
                  <p className="text-white text-sm break-all">
                    {previewDocument?.fileName || 'N/A'}
                  </p>
                  {previewDocument?.filePath && (
                    <p className="text-xs text-purple-300 truncate">
                      {previewDocument.filePath}
                    </p>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  if (previewContext && previewDocument) {
                    void downloadIndividualDocument(previewContext.sector, previewContext.period, previewDocument);
                  }
                }}
                disabled={!previewContext || !previewDocument}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Documento
              </Button>

              <div className="grid gap-2 pt-2">
                <Button
                  onClick={() => void handlePreviewEmailSend()}
                  disabled={!previewDocument || previewSending === 'email'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {previewSending === 'email' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando Email...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar por Email
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => void handlePreviewWhatsappSend()}
                  disabled={!previewDocument || previewSending === 'whatsapp'}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {previewSending === 'whatsapp' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando WhatsApp...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Enviar por WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-black/20">
              {previewLoading ? (
                <div className="w-full h-full flex items-center justify-center text-purple-200 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Carregando documento...
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  title="Documento Unificado"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Nenhum documento selecionado.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Opções de Download */}
      <Dialog open={downloadOptions.open} onOpenChange={(open) => {
        if (!open) {
          closeDownloadOptions();
        }
      }}>
        <DialogContent className="sm:max-w-[460px] bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-gray-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-purple-300" />
              Como deseja baixar?
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Você pode baixar apenas este documento ou gerar um pacote compactado com todos os arquivos do setor para o período selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {downloadOptions.document && (
              <div className="bg-black/30 border border-purple-500/20 rounded-lg p-3 text-sm text-gray-200 space-y-1">
                <p><strong>Funcionário:</strong> {downloadOptions.document.employeeName}</p>
                <p><strong>Período:</strong> {downloadOptions.document.month}/{downloadOptions.document.year}</p>
                <p className="truncate"><strong>Arquivo:</strong> {downloadOptions.document.fileName}</p>
              </div>
            )}

            <div className="grid gap-3">
              <Button
                className="justify-start bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => void handleDownloadChoice('individual')}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar somente este PDF
              </Button>
              <Button
                variant="outline"
                className="justify-start border-purple-500/50 text-purple-200 hover:bg-purple-500/10"
                onClick={() => void handleDownloadChoice('zip')}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Baixar pasta do setor (ZIP)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão (Documentos Unificados) */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-100">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {documentsToDelete.length === 1 ? (
                <>
                  Tem certeza que deseja excluir <strong>1 documento unificado</strong>?
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir <strong>{documentsToDelete.length} documento(s) unificado(s)</strong>?
                </>
              )}
              <p className="mt-2 text-red-300">Esta ação não pode ser desfeita!</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setDocumentsToDelete([]);
              }}
              disabled={deletingDocuments}
              className="border-gray-700 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={executeDeleteDocuments}
              disabled={deletingDocuments}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingDocuments ? (
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

      {/* Modal de Confirmação de Exclusão (Legado) */}
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
    </>
  );
};

export default UnificadosPorSetorNovo;

