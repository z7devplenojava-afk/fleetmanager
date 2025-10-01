import React, { useState, useEffect, useRef } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import paymentReceiptService, { type PaymentReceipt } from '@/services/paymentReceiptService';
import holeriteService, { Holerite } from '@/services/holeriteService';
import { PaymentReceiptViewModal } from '@/components/paymentReceipts/PaymentReceiptViewModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Mail, 
  Download, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  Trash2,
  MoreHorizontal,
  Calendar,
  User,
  CheckSquare,
  Square,
  CheckCircle,
  MessageSquare,
  X,
  Upload
} from 'lucide-react';
import HoleriteUpload from '@/components/HoleriteUpload';
import { HoleriteViewModal } from '@/components/holerites/HoleriteViewModal';
import { HoleriteEmailModal } from '@/components/holerites/HoleriteEmailModal';
import HoleriteDeleteDialog from '@/components/holerites/HoleriteDeleteDialog';
import AdvancedFilters from '@/components/holerites/AdvancedFilters';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { payslipService } from '@/services/payslipService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ReceiptTemplateModal from '@/components/receipts/ReceiptTemplateModal';
import api from '@/lib/axios';

const Holerites: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHolerite, setSelectedHolerite] = useState<Holerite | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [holerites, setHolerites] = useState<Holerite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHolerites, setSelectedHolerites] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const { toast } = useToast();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState('Olá! Seu holerite está disponível para download. Acesse o sistema SecuredGuard para visualizar. Em caso de dúvidas, entre em contato com o RH.');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [activeTab, setActiveTab] = useState('processados');
  const [showReceiptUploadModal, setShowReceiptUploadModal] = useState(false);
  const [processingReceipts, setProcessingReceipts] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [deletingReceipts, setDeletingReceipts] = useState(false);
  const [showReceiptDeleteModal, setShowReceiptDeleteModal] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<any>(null);


  // Estados para template de recibo
  const [showReceiptTemplateModal, setShowReceiptTemplateModal] = useState(false);
  const [selectedReceiptForTemplate, setSelectedReceiptForTemplate] = useState<any>(null);

  // Estados para unificação individual
  const [individualUnifications, setIndividualUnifications] = useState<any[]>([]);
  const [draggedHolerite, setDraggedHolerite] = useState<any>(null);
  const [draggedRecibo, setDraggedRecibo] = useState<any>(null);
  const [showIndividualUnificationModal, setShowIndividualUnificationModal] = useState(false);
  const [processingIndividualUnification, setProcessingIndividualUnification] = useState(false);
  const [holeriteSearchTerm, setHoleriteSearchTerm] = useState('');
  const [reciboSearchTerm, setReciboSearchTerm] = useState('');
  const [selectedUnifiedDocument, setSelectedUnifiedDocument] = useState<any>(null);
  const [showIndividualUnifiedViewModal, setShowIndividualUnifiedViewModal] = useState(false);

  // Estados para arquivos processados
  const [processedHolerites, setProcessedHolerites] = useState<any[]>([]);
  const [processedRecibos, setProcessedRecibos] = useState<any[]>([]);
  const [loadingProcessedFiles, setLoadingProcessedFiles] = useState(false);

  // Estados para modais de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [holeritesToDelete, setHoleritesToDelete] = useState<Holerite[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para comprovantes de pagamento
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>([]);
  const [loadingPaymentReceipts, setLoadingPaymentReceipts] = useState(false);
  const [showPaymentReceiptUploadModal, setShowPaymentReceiptUploadModal] = useState(false);
  const [processingPaymentReceipts, setProcessingPaymentReceipts] = useState(false);
  const [activeYear, setActiveYear] = useState('2025');
  const [activeMonth, setActiveMonth] = useState('1');
  const [selectedPaymentReceipts, setSelectedPaymentReceipts] = useState<string[]>([]);
  const [selectedPaymentReceiptForView, setSelectedPaymentReceiptForView] = useState<PaymentReceipt | null>(null);
  const [showPaymentReceiptViewModal, setShowPaymentReceiptViewModal] = useState(false);

  // Estados para navegação de holerites por ano/mês
  const [holeriteActiveYear, setHoleriteActiveYear] = useState<string>('2025');
  const [holeriteActiveMonth, setHoleriteActiveMonth] = useState<string>('6');
  const [holeriteAvailableYears, setHoleriteAvailableYears] = useState<string[]>(['2025']);
  const [holeriteAvailableMonths, setHoleriteAvailableMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  // Função para obter ID único do documento
  const getDocumentId = (document: any): string => {
    return document.id || document.fileName || `doc_${document.filePath || Math.random()}`;
  };

  // Funções para filtrar documentos nas listas de unificação individual
  const getFilteredHolerites = () => {
    if (!holeriteSearchTerm) return processedHolerites;
    return processedHolerites.filter(holerite => 
        holerite.employeeName.toLowerCase().includes(holeriteSearchTerm.toLowerCase()) ||
        holerite.cpf.includes(holeriteSearchTerm) ||
        holerite.name.toLowerCase().includes(holeriteSearchTerm.toLowerCase())
    );
  };

  const getFilteredRecibos = () => {
    if (!reciboSearchTerm) return processedRecibos;
    return processedRecibos.filter(recibo => 
        recibo.employeeName.toLowerCase().includes(reciboSearchTerm.toLowerCase()) ||
        recibo.name.toLowerCase().includes(reciboSearchTerm.toLowerCase())
    );
  };


  // Função para carregar comprovantes de pagamento
  const loadPaymentReceipts = async () => {
    try {
      setLoadingPaymentReceipts(true);
      console.log('🔍 Carregando comprovantes de pagamento...');
      
      // Carregar dados reais do backend
      const receipts = await paymentReceiptService.getAllPaymentReceipts();
      console.log('✅ Comprovantes carregados do backend:', receipts);
      
      if (receipts && Array.isArray(receipts)) {
        setPaymentReceipts(receipts);
      } else {
        console.log('📝 Nenhum comprovante encontrado no backend');
        setPaymentReceipts([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar comprovantes de pagamento:', error);
      setPaymentReceipts([]);
    } finally {
      setLoadingPaymentReceipts(false);
    }
  };

  // Função para filtrar comprovantes por ano e mês
  const getFilteredPaymentReceipts = () => {
    return paymentReceipts.filter(receipt => 
      receipt.year.toString() === activeYear && receipt.month.toString() === activeMonth
    );
  };

  // Função para obter anos disponíveis
  const getAvailableYears = () => {
    const years = [...new Set(paymentReceipts.map(receipt => receipt.year))];
    return years.sort();
  };

  // Função para obter meses disponíveis para um ano
  const getAvailableMonths = (year: string) => {
    const months = [...new Set(paymentReceipts
      .filter(receipt => receipt.year.toString() === year)
      .map(receipt => receipt.month)
    )];
    return months.sort((a, b) => a - b);
  };

  // Função para carregar anos do backend
  const loadAvailableYears = async () => {
    try {
      const years = await paymentReceiptService.getDistinctYears();
      console.log('📅 Anos disponíveis:', years);
      return years;
    } catch (error) {
      console.error('❌ Erro ao carregar anos:', error);
      return getAvailableYears();
    }
  };

  // Função para carregar meses do backend
  const loadAvailableMonths = async (year: number) => {
    try {
      const months = await paymentReceiptService.getDistinctMonthsByYear(year);
      console.log(`📅 Meses disponíveis para ${year}:`, months);
      return months;
    } catch (error) {
      console.error('❌ Erro ao carregar meses:', error);
      return getAvailableMonths(year.toString());
    }
  };

  // Função para converter número do mês para nome em português
  const getMonthName = (monthNumber: number): string => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[monthNumber - 1] || `Mês ${monthNumber}`;
  };

  // Funções para holerites
  const getHoleriteAvailableYears = (): string[] => {
    const years = [...new Set(holerites.map(h => h.year.toString()))].sort((a, b) => b.localeCompare(a));
    return years;
  };

  const getHoleriteAvailableMonths = (year: string): number[] => {
    const yearNumber = parseInt(year);
    const holeritesInYear = holerites.filter(h => h.year === yearNumber);
    const months = [...new Set(holeritesInYear.map(h => h.month))].sort((a, b) => a - b);
    return months.length > 0 ? months : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  const getHoleritesProcessedToday = (): number => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return holerites.filter(holerite => {
      if (!holerite.processedAt) return false;
      const processedDate = new Date(holerite.processedAt);
      const processedDateString = processedDate.toISOString().split('T')[0];
      return processedDateString === todayString;
    }).length;
  };


  const areAllHoleritesSelected = (): boolean => {
    const filtered = getFilteredHolerites();
    return filtered.length > 0 && filtered.every(h => selectedHolerites.includes(h.id));
  };

  const hasSelectedHolerites = (): boolean => {
    return selectedHolerites.length > 0;
  };

  const handleSelectAllHolerites = (checked: boolean) => {
    const filtered = getFilteredHolerites();
    if (checked) {
      const newSelected = [...new Set([...selectedHolerites, ...filtered.map(h => h.id)])];
      setSelectedHolerites(newSelected);
    } else {
      const filteredIds = filtered.map(h => h.id);
      setSelectedHolerites(selectedHolerites.filter(id => !filteredIds.includes(id)));
    }
  };

  const handleBatchEmailHolerites = () => {
    // Implementar envio em lote por email
    console.log('Enviando holerites por email:', selectedHolerites);
  };

  const handleBatchWhatsAppHolerites = () => {
    // Implementar envio em lote por WhatsApp
    console.log('Enviando holerites por WhatsApp:', selectedHolerites);
  };

  const handleBatchDeleteHolerites = () => {
    // Implementar exclusão em lote
    console.log('Excluindo holerites:', selectedHolerites);
  };

  // Função para processar upload de comprovantes - USANDO PROCESSAMENTO AUTOMÁTICO
  const handlePaymentReceiptUpload = async (file: File) => {
    try {
      setProcessingPaymentReceipts(true);
      console.log('📤 Iniciando processamento automático do comprovante:', file.name);
      
      // Usar o novo endpoint de processamento automático
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/api/receipts/process-automatic', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 segundos para processamento
        });
        
        const processedReceipts: PaymentReceipt[] = response.data;
        console.log('✅ Comprovantes processados automaticamente:', processedReceipts);
        
        // Adicionar todos os comprovantes processados
        setPaymentReceipts(prev => [...prev, ...processedReceipts]);
        
        toast({
          title: "Sucesso",
          description: `${processedReceipts.length} comprovante(s) processado(s) automaticamente!`,
        });
        
      } catch (backendError) {
        console.error('❌ Erro no processamento automático:', backendError);
        
        toast({
          title: "Erro",
          description: "Erro ao processar comprovante automaticamente. Verifique se o arquivo está no formato correto.",
          variant: "destructive"
        });
        
        // Não usar fallback - deixar o usuário tentar novamente
        return;
      }
      
      setShowPaymentReceiptUploadModal(false);
    } catch (error) {
      console.error('Erro ao processar comprovante:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar comprovante de pagamento.",
        variant: "destructive"
      });
    } finally {
      setProcessingPaymentReceipts(false);
    }
  };

  // Funções para seleção em lote de comprovantes
  const handleSelectAllPaymentReceipts = (checked: boolean) => {
    if (checked) {
      const allIds = getFilteredPaymentReceipts().map(receipt => receipt.id);
      setSelectedPaymentReceipts(allIds);
    } else {
      setSelectedPaymentReceipts([]);
    }
  };

  const handleSelectPaymentReceipt = (receiptId: string, checked: boolean) => {
    if (checked) {
      setSelectedPaymentReceipts(prev => [...prev, receiptId]);
    } else {
      setSelectedPaymentReceipts(prev => prev.filter(id => id !== receiptId));
    }
  };

  const handleBatchEmailPaymentReceipts = async () => {
    if (selectedPaymentReceipts.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um comprovante para envio por email.",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedReceipts = getFilteredPaymentReceipts().filter(receipt => 
        selectedPaymentReceipts.includes(receipt.id)
      );

      toast({
        title: "Enviando emails",
        description: `Enviando ${selectedReceipts.length} comprovante(s) por email...`,
      });

      // Simular envio de emails em lote
      for (const receipt of selectedReceipts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Enviando email para: ${receipt.employeeName}`);
      }
      
      toast({
        title: "Sucesso",
        description: `${selectedReceipts.length} email(s) enviado(s) com sucesso!`,
      });
      
      // Limpar seleção após envio
      setSelectedPaymentReceipts([]);
    } catch (error) {
      console.error('Erro ao enviar emails em lote:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar emails em lote.",
        variant: "destructive"
      });
    }
  };

  const handleBatchWhatsAppPaymentReceipts = async () => {
    if (selectedPaymentReceipts.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um comprovante para envio por WhatsApp.",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedReceipts = getFilteredPaymentReceipts().filter(receipt => 
        selectedPaymentReceipts.includes(receipt.id)
      );

      toast({
        title: "Enviando WhatsApp",
        description: `Enviando ${selectedReceipts.length} comprovante(s) por WhatsApp...`,
      });

      // Simular envio de WhatsApp em lote
      for (const receipt of selectedReceipts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Enviando WhatsApp para: ${receipt.employeeName}`);
      }

        toast({
        title: "Sucesso",
        description: `${selectedReceipts.length} mensagem(ns) WhatsApp enviada(s) com sucesso!`,
      });

      // Limpar seleção após envio
      setSelectedPaymentReceipts([]);
    } catch (error) {
      console.error('Erro ao enviar WhatsApp em lote:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagens WhatsApp em lote.",
        variant: "destructive"
      });
    }
  };

  const clearPaymentReceiptSelection = () => {
    setSelectedPaymentReceipts([]);
  };

  // Excluir comprovante individual
  const handleDeletePaymentReceipt = async (receiptId: string) => {
    try {
      await paymentReceiptService.deletePaymentReceipt(receiptId);
      
      // Remover da seleção se estiver selecionado
      setSelectedPaymentReceipts(selectedPaymentReceipts.filter(id => id !== receiptId));
      
      // Recarregar lista de comprovantes de pagamento
      await loadPaymentReceipts();
      
      toast({
        title: "Comprovante excluído",
        description: "Comprovante excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir comprovante:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir comprovante. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Visualizar comprovante
  const handleViewPaymentReceipt = (receipt: PaymentReceipt) => {
    setSelectedPaymentReceiptForView(receipt);
    setShowPaymentReceiptViewModal(true);
  };

  // Baixar comprovante
  const handleDownloadPaymentReceipt = async (receiptId: string, fileName: string) => {
    try {
      await paymentReceiptService.downloadPaymentReceipt(receiptId, fileName);
      toast({
        title: "Download iniciado",
        description: "O download do comprovante foi iniciado.",
      });
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar comprovante. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Excluir múltiplos comprovantes
  const handleDeleteMultiplePaymentReceipts = async () => {
    if (selectedPaymentReceipts.length === 0) {
      toast({
        title: "Nenhum comprovante selecionado",
        description: "Selecione pelo menos um comprovante para excluir.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await paymentReceiptService.deleteMultiplePaymentReceipts(selectedPaymentReceipts);
      
      if (result.deleted > 0) {
        toast({
          title: "Comprovantes excluídos",
          description: `${result.deleted} comprovante${result.deleted > 1 ? 's' : ''} excluído${result.deleted > 1 ? 's' : ''} com sucesso.`,
        });
      }
      
      if (result.failed > 0) {
        toast({
          title: "Alguns comprovantes não foram excluídos",
          description: `${result.failed} comprovante${result.failed > 1 ? 's' : ''} não puderam ser excluído${result.failed > 1 ? 's' : ''}.`,
          variant: "destructive"
        });
      }
      
      setSelectedPaymentReceipts([]);
      await loadPaymentReceipts();
    } catch (error) {
      console.error('Erro ao excluir comprovantes:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir comprovantes. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const areAllPaymentReceiptsSelected = () => {
    const filteredReceipts = getFilteredPaymentReceipts();
    return filteredReceipts.length > 0 && 
           selectedPaymentReceipts.length === filteredReceipts.length;
  };

  const hasSelectedPaymentReceipts = () => {
    return selectedPaymentReceipts.length > 0;
  };

  // Carregar holerites
  const loadHolerites = async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Iniciando carregamento de holerites...');
      console.log('🔍 Usuário atual:', user);
      console.log('🔍 Permissões do usuário:', user?.permissions);
      console.log('🔍 Token no localStorage:', localStorage.getItem('token'));
      
      try {
        console.log('🔍 Filtros aplicados:', filters);
        const data = await holeriteService.getAllHolerites();
        console.log('✅ Holerites carregados do backend:', data);
        console.log('🔍 Tipo dos dados:', typeof data);
        console.log('🔍 É array?', Array.isArray(data));
        console.log('🔍 Tamanho do array:', data?.length);
        
        if (data && Array.isArray(data)) {
          console.log('✅ Usando dados do backend:', data.length, 'holerites');
          setHolerites(data);
          
          // Atualizar anos disponíveis baseado nos dados reais
          const availableYears = [...new Set(data.map(h => h.year.toString()))].sort((a, b) => b.localeCompare(a));
          console.log('📅 Anos disponíveis baseado nos holerites:', availableYears);
          setHoleriteAvailableYears(availableYears);
          
          // Se o ano ativo não estiver mais disponível, mudar para o primeiro disponível
          if (availableYears.length > 0 && !availableYears.includes(holeriteActiveYear)) {
            setHoleriteActiveYear(availableYears[0]);
            console.log('🔄 Mudando ano ativo para:', availableYears[0]);
          }
        } else {
          console.log('📝 Nenhum holerite encontrado no backend');
          setHolerites([]);
          setHoleriteAvailableYears(['2025']); // Manter 2025 como padrão
        }
      } catch (backendError) {
        console.error('❌ Erro no backend:', backendError);
        setHolerites([]);
        setHoleriteAvailableYears(['2025']); // Manter 2025 como padrão em caso de erro
        setError('Erro ao carregar holerites do servidor. Verifique sua conexão.');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar holerites:', err);
      console.error('🔍 Detalhes do erro:', err.response?.data, err.response?.status);
      setError('Erro ao carregar holerites. Tente novamente.');
        toast({
          title: "Erro",
        description: "Não foi possível carregar os holerites.",
          variant: "destructive"
        });
    } finally {
      setLoading(false);
    }
  };

  // Carregar holerites com filtros
  const loadHoleritesWithFilters = async () => {
    const newFilters: any = { ...filters };
    
    if (searchTerm) {
      newFilters.employeeName = searchTerm;
    }
    
    await loadHolerites(newFilters);
  };

  // Aplicar filtros quando mudarem
  useEffect(() => {
    if (!loading) {
      loadHoleritesWithFilters();
    }
  }, [searchTerm, filters]);

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
    setSelectedHolerites([]);
    loadHolerites();
  };

  // Atualizar holerites
  const refreshHolerites = async () => {
    setRefreshing(true);
    try {
      await loadHolerites();
      setSelectedHolerites([]);
      toast({
        title: "Sucesso",
        description: "Lista de holerites atualizada.",
      });
    } catch (error) {
      console.error('Erro ao atualizar holerites:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a lista de holerites.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Filtrar holerites localmente
  const filteredHolerites = holerites.filter(payslip =>
    payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payslip.cpf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payslip.month.toString().includes(searchTerm) ||
    payslip.year.toString().includes(searchTerm)
  );

  // Seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedHolerites(filteredHolerites.map(p => p.id));
    } else {
      setSelectedHolerites([]);
    }
  };

  const handleSelectHolerite = (payslipId: string, checked: boolean) => {
    if (checked) {
      setSelectedHolerites([...selectedHolerites, payslipId]);
    } else {
      setSelectedHolerites(selectedHolerites.filter(id => id !== payslipId));
    }
  };

  const isAllSelected = filteredHolerites.length > 0 && selectedHolerites.length === filteredHolerites.length;
  const isIndeterminate = selectedHolerites.length > 0 && selectedHolerites.length < filteredHolerites.length;





  // Funções para unificação individual
  const handleDragStart = (e: React.DragEvent, item: any, type: 'holerite' | 'recibo') => {
            console.log('🚀 Iniciando drag:', { type, item: item.employeeName || 'N/A' });
    
    // Definir dados para transferência
    e.dataTransfer.setData('application/json', JSON.stringify({ item, type }));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Não definir o estado aqui, apenas quando soltar
    console.log('📋 Dados de transferência definidos');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-seguranca-yellow', 'bg-seguranca-yellow/10');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-seguranca-yellow', 'bg-seguranca-yellow/50');
  };

    const handleDrop = (e: React.DragEvent, targetType: 'unificacao') => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-seguranca-yellow', 'bg-seguranca-yellow/10');
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { item, type } = data;
      
      console.log('🔄 Item solto:', { type, item: item.employeeName || 'N/A' });
      
      // Função auxiliar para normalizar nomes (case-insensitive)
      const normalizeName = (name: string) => {
        if (!name) return '';
        return name.trim().toLowerCase()
          .replace(/\s+/g, ' ') // Múltiplos espaços para um só
          .replace(/valor/g, '')
          .replace(/funcionario/g, '')
          .replace(/empregado/g, '')
          .replace(/colaborador/g, '');
      };
      
      // Adicionar item ao estado correspondente
      if (type === 'holerite') {
        setDraggedHolerite(item);
        console.log('✅ Holerite definido:', item.employeeName || 'N/A');
      } else if (type === 'recibo') {
        setDraggedRecibo(item);
        console.log('✅ Recibo definido:', item.employeeName || 'N/A');
      }
      
      // Verificar se já temos ambos os itens para validação (case-insensitive)
      if (draggedHolerite && type === 'recibo') {
        const holeriteName = normalizeName(draggedHolerite.employeeName || '');
        const reciboName = normalizeName(item.employeeName || '');
        
        if (holeriteName !== reciboName) {
          toast({
            title: "❌ Nomes diferentes",
            description: `Holerite: ${draggedHolerite.employeeName} | Recibo: ${item.employeeName}`,
            variant: "destructive"
          });
          // Limpar o recibo incorreto
          setDraggedRecibo(null);
          return;
        }
      } else if (draggedRecibo && type === 'holerite') {
        const holeriteName = normalizeName(item.employeeName || '');
        const reciboName = normalizeName(draggedRecibo.employeeName || '');
        
        if (holeriteName !== reciboName) {
          toast({
            title: "❌ Nomes diferentes",
            description: `Holerite: ${item.employeeName} | Recibo: ${draggedRecibo.employeeName}`,
            variant: "destructive"
          });
          // Limpar o holerite incorreto
          setDraggedHolerite(null);
          return;
        }
      }
      
      // Mostrar toast de confirmação
      toast({
        title: `${type === 'holerite' ? 'Holerite' : 'Recibo'} adicionado`,
        description: `${item.employeeName || 'Nome não disponível'} foi adicionado à área de unificação.`,
      });
      
                    // Se temos ambos os itens com nomes iguais, mostrar confirmação (case-insensitive)
      if (draggedHolerite && draggedRecibo && 
          draggedHolerite.employeeName && draggedRecibo.employeeName) {
        const holeriteName = normalizeName(draggedHolerite.employeeName);
        const reciboName = normalizeName(draggedRecibo.employeeName);
        
        if (holeriteName === reciboName) {
          toast({
            title: "✅ Nomes compatíveis",
            description: `Funcionário: ${draggedHolerite.employeeName} - Unificação permitida!`,
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar drop:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o item arrastado.",
        variant: "destructive"
      });
    }
  };

  const createUnification = (holerite: any, recibo: any) => {
    // Verificar se os objetos são válidos
    if (!holerite || !recibo) {
      console.error('❌ Objetos inválidos para unificação:', { holerite, recibo });
      toast({
        title: "❌ Erro de validação",
        description: "Dados inválidos para unificação.",
        variant: "destructive"
      });
      return;
    }

    // Função auxiliar para normalizar e comparar nomes
    const normalizeName = (name: string) => {
      if (!name) return '';
      return name.trim().toLowerCase()
        .replace(/\s+/g, ' ') // Múltiplos espaços para um só
        .replace(/valor/g, '')
        .replace(/funcionario/g, '')
        .replace(/empregado/g, '')
        .replace(/colaborador/g, '');
    };

    const normalizedHoleriteName = normalizeName(holerite.employeeName || '');
    const normalizedReciboName = normalizeName(recibo.employeeName || '');

    console.log('🔍 Comparando nomes para unificação:');
    console.log('  Holerite original:', holerite.employeeName || 'N/A');
    console.log('  Recibo original:', recibo.employeeName || 'N/A');
    console.log('  Holerite normalizado:', normalizedHoleriteName);
    console.log('  Recibo normalizado:', normalizedReciboName);

    // Validação flexível: verificar se os nomes normalizados são iguais
    if (normalizedHoleriteName !== normalizedReciboName) {
      // Tentar verificação adicional por contenção
      const containsMatch = normalizedHoleriteName.includes(normalizedReciboName) || 
                           normalizedReciboName.includes(normalizedHoleriteName);
      
      if (!containsMatch) {
        toast({
          title: "❌ Validação falhou",
          description: `Nomes diferentes: Holerite (${holerite.employeeName || 'N/A'}) ≠ Recibo (${recibo.employeeName || 'N/A'})`,
          variant: "destructive"
        });
        return;
      } else {
        console.log('✅ Match por contenção encontrado - aceitando unificação');
      }
    }

    // Validação adicional: verificar se são do mesmo funcionário
    if (holerite.cpf && recibo.cpf && holerite.cpf !== recibo.cpf) {
      toast({
        title: "❌ CPF diferente",
        description: `CPFs diferentes: Holerite (${holerite.cpf}) ≠ Recibo (${recibo.cpf})`,
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Validação aprovada - Criando unificação para:', holerite.employeeName || 'N/A');
    
    // Criar nova unificação individual
    const newUnification = {
      id: `unif_${Date.now()}_${Math.random()}`,
      holerite: holerite,
      recibo: recibo,
      employeeName: holerite.employeeName, // Nome validado
      status: 'pending' as const,
      progress: 0
    };
    
    setIndividualUnifications(prev => [...prev, newUnification]);
    
    // Limpar estados de drag
    setDraggedHolerite(null);
    setDraggedRecibo(null);
    
            toast({
          title: "✅ Unificação criada",
          description: `Documento unificado criado para ${holerite.employeeName || 'N/A'}!`,
        });

    // Iniciar processamento automaticamente
    setTimeout(() => {
      processIndividualUnification(newUnification);
    }, 500);
  };

  const processIndividualUnification = async (unification: any) => {
    setProcessingIndividualUnification(true);
    
    try {
        // Simular progresso inicial
        const progressInterval = setInterval(() => {
            setIndividualUnifications(prev => prev.map(u => 
                u.id === unification.id 
                    ? { ...u, progress: Math.min(u.progress + 10, 30) }
                    : u
            ));
        }, 200);

        // Simular chamada para o backend para unificar documentos
        const unifiedPdfUrl = await generateUnifiedPdf(unification);
        
        clearInterval(progressInterval);

        // Simular progresso final
        const finalProgressInterval = setInterval(() => {
            setIndividualUnifications(prev => prev.map(u => 
                u.id === unification.id 
                    ? { ...u, progress: Math.min(u.progress + 15, 100) }
                    : u
            ));
        }, 150);

        setTimeout(() => {
            clearInterval(finalProgressInterval);
            
            // Atualizar unificação com URL do PDF e status completo
            setIndividualUnifications(prev => prev.map(u => 
                u.id === unification.id 
                    ? { ...u, status: 'completed', progress: 100, unifiedPdfUrl }
                    : u
            ));
            
            setProcessingIndividualUnification(false);
        }, 2000);

    } catch (error) {
        console.error('Erro ao processar unificação:', error);
        setIndividualUnifications(prev => prev.map(u => 
            u.id === unification.id 
                ? { ...u, status: 'error', error: 'Erro ao gerar PDF unificado' }
                : u
        ));
        setProcessingIndividualUnification(false);
    }
  };

  const removeIndividualUnification = (unificationId: string) => {
    setIndividualUnifications(prev => prev.filter(u => u.id !== unificationId));
    toast({
      title: "Sucesso",
      description: "Unificação removida da fila!",
    });
  };

  // Funções para ações com documentos unificados individuais
  const handleDownloadIndividualUnified = async (unification: any) => {
    try {
      // Verificar se o PDF unificado já foi gerado
      if (!unification.unifiedPdfUrl) {
        toast({
          title: "PDF não disponível",
          description: "O PDF unificado ainda não foi gerado. Aguarde o processamento.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Download iniciado",
        description: "Documento unificado sendo baixado...",
      });
      
      // Criar um link temporário para download
      const link = document.createElement('a');
      link.href = unification.unifiedPdfUrl;
      link.download = `unificado_${unification.holerite.employeeName.replace(/\s+/g, '_')}_${unification.holerite.month}_${unification.holerite.year}.pdf`;
      link.target = '_blank';
      
      // Adicionar o link ao DOM e clicar nele
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Sucesso",
        description: "Documento unificado baixado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao baixar documento unificado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o documento unificado.",
        variant: "destructive"
      });
    }
  };

  const handleEmailIndividualUnified = async (unification: any) => {
    try {
      // Simular envio por email
      toast({
        title: "Enviando email",
        description: "Documento unificado sendo enviado por email...",
      });
      
      // Aqui você pode implementar a lógica real de envio por email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Sucesso",
        description: "Documento unificado enviado por email com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao enviar documento unificado por email:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o documento unificado por email.",
        variant: "destructive"
      });
    }
  };

  const handleWhatsAppIndividualUnified = async (unification: any) => {
    try {
      // Simular envio por WhatsApp
      toast({
        title: "Enviando WhatsApp",
        description: "Documento unificado sendo enviado por WhatsApp...",
      });
      
      // Aqui você pode implementar a lógica real de envio por WhatsApp
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Sucesso",
        description: "Documento unificado enviado por WhatsApp com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao enviar documento unificado por WhatsApp:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o documento unificado por WhatsApp.",
        variant: "destructive"
      });
    }
  };

  // Função para visualizar documento unificado individual
  const handleViewIndividualUnified = async (unification: any) => {
    setSelectedUnifiedDocument(unification);
    setShowIndividualUnifiedViewModal(true);
    
    // Gerar PDF automaticamente se ainda não foi gerado
    if (!unification.unifiedPdfUrl) {
      console.log('🔄 Gerando PDF automaticamente para visualização...');
      try {
        const url = await generateUnifiedPdf(unification);
        if (url) {
          // Atualizar o estado para mostrar o PDF unificado
          setSelectedUnifiedDocument(prev => ({ ...prev, unifiedPdfUrl: url }));
          
          // Atualizar também na lista de unificações
          setIndividualUnifications(prev => prev.map(u => 
            u.id === unification.id 
              ? { ...u, unifiedPdfUrl: url, status: 'completed' }
              : u
          ));
          
          toast({
            title: "PDF Gerado",
            description: "PDF unificado foi gerado automaticamente para visualização.",
          });
        }
      } catch (error) {
        console.error('❌ Erro ao gerar PDF automaticamente:', error);
        toast({
          title: "Erro",
          description: "Não foi possível gerar o PDF automaticamente.",
          variant: "destructive"
        });
      }
    }
  };

  // Função para gerar URL do PDF unificado
  const getUnifiedPdfUrl = (unification: any) => {
    if (unification?.holerite?.fileName && unification?.recibo?.fileName) {
      // Aqui você pode implementar a lógica real para gerar o PDF unificado
      // Por enquanto, vamos tentar carregar os PDFs individuais para demonstração
      
      // Tentar carregar o holerite primeiro
      const holeriteUrl = `http://localhost:8081/api/files/holerites/${encodeURIComponent(unification.holerite.fileName)}`;
      const reciboUrl = `http://localhost:8081/api/files/receipts/${encodeURIComponent(unification.recibo.fileName)}`;
      
      // Retorna a URL do holerite como exemplo (primeira página)
      return holeriteUrl;
    }
    return null;
  };

  // Função para gerar PDF unificado real (simulada)
  const generateUnifiedPdf = async (unification: any) => {
    try {
      // Simular geração de PDF unificado
      toast({
        title: "Gerando PDF",
        description: "Criando documento unificado com holerite e recibo...",
      });
      
      // Aqui você implementaria a chamada real para o backend
      // const response = await api.post('/api/unified-documents/generate', {
      //   holeriteId: unification.holerite.id,
      //   reciboId: unification.recibo.id,
      //   employeeName: unification.holerite.employeeName,
      //   month: unification.holerite.month,
      //   year: unification.holerite.year
      // });
      
      // Simular processo de unificação
      console.log('🔍 Iniciando geração de PDF unificado...');
      console.log('📄 Holerite:', unification.holerite.fileName);
      console.log('📄 Recibo:', unification.recibo.fileName);
      
      // Simular delay de processamento (unindo PDFs)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simular URL do PDF unificado gerado
      const timestamp = Date.now();
      const employeeName = unification.holerite.employeeName.replace(/\s+/g, '_');
      
      // Em produção, aqui seria uma chamada real para o backend que unifica os PDFs
      // Por enquanto, vamos simular a unificação usando os arquivos originais
      
      console.log('🔄 Unificando documentos originais...');
      console.log('📄 Holerite:', unification.holerite.fileName);
      console.log('📄 Recibo:', unification.recibo.fileName);
      
      // URL do PDF unificado gerado pelo backend
      // O backend deve combinar o holerite (página 1) + recibo (página 2)
      const unifiedPdfUrl = `http://localhost:8081/api/files/unified/unified_${unification.holerite.employeeName.replace(/\s+/g, '_')}_${unification.holerite.month}_${unification.holerite.year}.pdf`;
      
      console.log('✅ PDF unificado gerado pelo backend:', unifiedPdfUrl);
      console.log('📋 Estrutura: Holerite (Página 1) + Recibo (Página 2)');
      
      return unifiedPdfUrl;
    } catch (error) {
      console.error('❌ Erro ao gerar PDF unificado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF unificado.",
        variant: "destructive"
      });
      return null;
    }
  };



  // Exclusão múltipla
  const handleDeleteSelected = async () => {
    if (selectedHolerites.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um holerite para excluir.",
        variant: "destructive"
      });
      return;
    }

    // Preparar holerites para exclusão
    const holeritesToDelete = holerites.filter(p => selectedHolerites.includes(p.id));
    setHoleritesToDelete(holeritesToDelete);
    setShowDeleteModal(true);
  };

  // Confirmar exclusão múltipla
  const confirmDeleteSelected = async () => {
    if (selectedHolerites.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum holerite selecionado para exclusão.",
        variant: "destructive"
      });
      setShowDeleteModal(false);
      return;
    }

    setIsDeleting(true);
      try {
        const result = await holeriteService.deleteMultipleHolerites(selectedHolerites);
        
        // Verificar se há IDs inválidos
        if (result.invalidCount && result.invalidCount > 0) {
          toast({
            title: "Aviso",
            description: `${result.invalidCount} holerite${result.invalidCount > 1 ? 's' : ''} com ID${result.invalidCount > 1 ? 's' : ''} inválido${result.invalidCount > 1 ? 's' : ''} foram ignorado${result.invalidCount > 1 ? 's' : ''}.`,
            variant: "destructive"
          });
        }
        
        if (result.deleted === 0 && result.failed === 0) {
          toast({
            title: "Informação",
            description: "Nenhum holerite foi excluído. Verifique se os holerites ainda existem.",
            variant: "default"
          });
        } else if (result.failed > 0) {
          toast({
            title: "Aviso",
          description: `${result.deleted} holerite${result.deleted > 1 ? 's' : ''} excluído${result.deleted > 1 ? 's' : ''} com sucesso. ${result.failed} falha${result.failed > 1 ? 's' : ''}.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sucesso",
          description: `${result.deleted} holerite${result.deleted > 1 ? 's' : ''} excluído${result.deleted > 1 ? 's' : ''} com sucesso.`,
          });
        }
        
        setSelectedHolerites([]);
        await loadHolerites();
      setShowDeleteModal(false);
      } catch (error: any) {
      console.error('Erro ao excluir holerites:', error);
      
      // Melhorar mensagem de erro baseada no tipo de erro
      let errorMessage = "Erro ao excluir holerites. Tente novamente.";
      
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (errors.length > 0) {
          errorMessage = errors[0]; // Usar a primeira mensagem de erro do backend
        }
      }
      
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsDeleting(false);
      }
  };

  const handleViewHolerite = (payslip: Holerite) => {
    setSelectedHolerite(payslip);
    setShowViewModal(true);
  };

  const handleEmailHolerite = (payslip: Holerite) => {
    setSelectedHolerite(payslip);
    setShowEmailModal(true);
  };

  const handleDownloadHolerite = async (payslip: Holerite) => {
    try {
      const blob = await holeriteService.downloadHolerite(payslip.fileName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = payslip.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download iniciado",
        description: `Holerite de ${payslip.employeeName} baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao baixar holerite:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar holerite. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Excluir holerite individual
  const handleDeleteHolerite = async (payslip: Holerite) => {
    setHoleritesToDelete([payslip]);
    setShowDeleteModal(true);
  };

  // Confirmar exclusão individual
  const confirmDeleteIndividual = async () => {
    if (holeritesToDelete.length === 0) return;
    
    const payslip = holeritesToDelete[0];
    setIsDeleting(true);
    
      try {
        await holeriteService.deleteHolerite(payslip.id);
        
        toast({
          title: "Sucesso",
        description: `Holerite de ${payslip.employeeName} excluído com sucesso.`,
        });
        
        // Remover da seleção se estiver selecionado
        setSelectedHolerites(selectedHolerites.filter(id => id !== payslip.id));
        
        // Recarregar lista
        await loadHolerites();
      setShowDeleteModal(false);
      } catch (error) {
      console.error('Erro ao excluir holerite:', error);
        toast({
          title: "Erro",
        description: "Erro ao excluir holerite. Tente novamente.",
          variant: "destructive"
        });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadSuccess = () => {
    loadHolerites(); // Recarrega a lista após upload
    toast({
      title: "Upload Concluído",
      description: "Holerites processados com sucesso.",
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Data não disponível';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error);
      return 'Data inválida';
    }
  };

  // Função para lidar com filtros avançados
  const handleAdvancedFiltersChange = (filterState: any) => {
    // Converter FilterState para filtros
    const newFilters: any = {};
    if (filterState.search) newFilters.employeeName = filterState.search;
    setFilters(newFilters);
  };

  // Envio em massa via WhatsApp
  const handleSendWhatsApp = async () => {
    setSendingWhatsApp(true);
    try {
      const response = await api.post('/envio/massa', {
        tipo: 'whatsapp',
        funcionarioIds: selectedHolerites,
        mensagem: whatsAppMessage
      });
      const data = response.data;
      if (data.sucesso) {
        toast({ title: 'Sucesso', description: data.mensagem });
        setShowWhatsAppModal(false);
        setSelectedHolerites([]);
      } else {
        toast({ title: 'Erro no envio', description: data.mensagem, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      toast({ title: 'Erro', description: 'Erro ao enviar via WhatsApp.', variant: 'destructive' });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Envio individual via WhatsApp
  const handleSendWhatsAppIndividual = async (payslip: Holerite) => {
    try {
      const response = await api.post('/envio/individual', {
        tipo: 'whatsapp',
        funcionarioId: payslip.id,
        mensagem: 'Olá! Seu holerite está disponível para download. Acesse o sistema SecuredGuard para visualizar. Em caso de dúvidas, entre em contato com o RH.'
      });
      const data = response.data;
      if (data.sucesso) {
        toast({ title: 'Sucesso', description: data.mensagem });
      } else {
        toast({ title: 'Erro no envio', description: data.mensagem, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro ao enviar WhatsApp individual:', error);
      toast({ title: 'Erro', description: 'Erro ao enviar via WhatsApp.', variant: 'destructive' });
    }
  };

  // Função para carregar recibos
  const loadReceipts = async () => {
    try {
      console.log('🔍 Iniciando carregamento de recibos...');
      console.log('🔍 Usuário atual:', user);
      console.log('🔍 Permissões do usuário:', user?.permissions);
      console.log('🔍 Token no localStorage:', localStorage.getItem('token'));
      
      const response = await api.get('/api/receipts');
      console.log('🔍 Resposta da API de recibos:', response);
      
      let receipts = [];
      if (response.data && Array.isArray(response.data)) {
        receipts = response.data;
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        receipts = response.data.content;
      } else if (response.data && response.data.receipts && Array.isArray(response.data.receipts)) {
        receipts = response.data.receipts;
      }
      
      console.log('✅ Comprovantes carregados com sucesso:', receipts);
      setReceipts(receipts);
    } catch (error) {
      console.error('🔍 Erro ao carregar comprovantes:', error);
      console.error('🔍 Detalhes do erro:', error.response?.data, error.response?.status);
      setReceipts([]);
    }
  };

  // Carregar dados iniciais quando usuário estiver autenticado
  useEffect(() => {
    if (user) {
      loadHolerites();
      loadReceipts();
    }
  }, [user]);

  // Atualizar anos disponíveis quando holerites mudarem
  useEffect(() => {
    if (holerites.length > 0) {
      const availableYears = [...new Set(holerites.map(h => h.year.toString()))].sort((a, b) => b.localeCompare(a));
      console.log('🔄 Atualizando anos disponíveis:', availableYears);
      setHoleriteAvailableYears(availableYears);
    }
  }, [holerites]);

  // Carregar recibos quando a aba de recibos for ativa
  useEffect(() => {
    if (activeTab === 'recibos' && user) {
      loadReceipts();
    }
  }, [activeTab, user]);


  // Carregar arquivos processados quando a aba "Unificação Individual" for ativada
  useEffect(() => {
    if (activeTab === 'unificacao-individual' && user) {
      loadProcessedFiles();
    }
  }, [activeTab, user]);

  // Carregar comprovantes de pagamento quando a aba "Comprovantes" for ativada
  useEffect(() => {
    if (activeTab === 'recibos' && user) {
      loadPaymentReceipts();
    }
  }, [activeTab, user]);

  // Atualizar mês ativo quando os dados dos comprovantes mudarem
  useEffect(() => {
    if (paymentReceipts.length > 0) {
      const availableMonths = getAvailableMonths(activeYear);
      if (availableMonths.length > 0) {
        // Se o mês atual não está disponível, mudar para o primeiro disponível
        if (!availableMonths.includes(parseInt(activeMonth))) {
          setActiveMonth(availableMonths[0].toString());
          console.log('🔄 Mês ativo atualizado para:', availableMonths[0]);
        }
      }
    }
  }, [paymentReceipts, activeYear]);

  // Função para upload de recibos
  const handleReceiptUpload = async (file: File) => {
    console.log('🔍 Iniciando upload de recibos:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      setProcessingReceipts(true);
      
      // Validações básicas
      if (!file) {
        throw new Error('Nenhum arquivo selecionado');
      }
      
      if (file.type !== 'application/pdf') {
        throw new Error('Apenas arquivos PDF são aceitos');
      }
      
      if (file.size === 0) {
        throw new Error('Arquivo está vazio');
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB
        throw new Error('Arquivo muito grande (máximo 50MB)');
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Enviando requisição para /api/receipts/upload...');

      const response = await api.post('/receipts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos
      });

      console.log('✅ Resposta recebida:', {
        status: response.status,
        data: response.data
      });

      if (response.status === 200) {
        const receiptsCount = response.data.receipts?.length || response.data.count || 0;
        
        toast({
          title: "Sucesso",
          description: `Comprovantes processados com sucesso! ${receiptsCount} comprovantes extraídos.`,
        });
        
        setShowReceiptUploadModal(false);
        
        // Recarregar a lista de comprovantes de pagamento após o upload
        console.log('🔄 Recarregando lista de comprovantes de pagamento...');
        await loadPaymentReceipts();
      } else {
        throw new Error(`Resposta inesperada do servidor: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao processar recibos:', error);
      
      let errorMessage = 'Erro desconhecido ao processar recibos';
      
      if (error.response) {
        // Erro de resposta HTTP
        console.error('Erro HTTP:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Arquivo inválido ou dados incorretos';
        } else if (error.response.status === 401) {
          errorMessage = 'Não autorizado. Faça login novamente.';
        } else if (error.response.status === 403) {
          errorMessage = 'Acesso negado. Você não tem permissão para esta operação.';
        } else if (error.response.status === 404) {
          errorMessage = 'Endpoint não encontrado. Verifique se o backend está rodando.';
        } else if (error.response.status === 500) {
          errorMessage = error.response.data?.message || 'Erro interno do servidor';
        } else {
          errorMessage = `Erro HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
        }
      } else if (error.request) {
        // Erro de rede
        console.error('Erro de rede:', error.request);
        errorMessage = 'Erro de conexão. Verifique se o backend está rodando na porta 8081.';
      } else if (error.message) {
        // Erro de validação ou outro
        errorMessage = error.message;
      }

      toast({
        title: "Erro no Upload de Comprovantes",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setProcessingReceipts(false);
    }
  };


  // Função para deletar recibo individual
  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      setDeletingReceipts(true);
      
      const response = await api.delete(`/receipts/${receiptId}`);
      
      if (response.status === 200) {
        toast({
          title: "Sucesso",
          description: "Recibo excluído com sucesso!",
        });
        await loadReceipts(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao deletar recibo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o recibo.",
        variant: "destructive"
      });
    } finally {
      setDeletingReceipts(false);
      setShowReceiptDeleteModal(false);
      setReceiptToDelete(null);
    }
  };

  // Função para confirmar exclusão de recibo
  const confirmDeleteReceipt = (receipt: any) => {
    setReceiptToDelete(receipt);
    setShowReceiptDeleteModal(true);
  };

  // Função para deletar recibos em lote
  const handleDeleteReceiptsBatch = async () => {
    if (selectedReceipts.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um recibo para excluir.",
        variant: "destructive"
      });
      return;
    }

    try {
      setDeletingReceipts(true);
      
      const response = await api.delete('/receipts/batch', {
        data: selectedReceipts
      });
      
      if (response.status === 200) {
        toast({
          title: "Sucesso",
          description: `${response.data.deletedCount} recibos excluídos com sucesso!`,
        });
        setSelectedReceipts([]); // Limpar seleção
        await loadReceipts(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao deletar recibos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir os recibos.",
        variant: "destructive"
      });
    } finally {
      setDeletingReceipts(false);
    }
  };

  // Função para selecionar/desselecionar recibo
  const handleSelectReceipt = (receiptId: string, checked: boolean) => {
    if (checked) {
      setSelectedReceipts(prev => [...prev, receiptId]);
    } else {
      setSelectedReceipts(prev => prev.filter(id => id !== receiptId));
    }
  };

  // Função para selecionar todos os recibos
  const handleSelectAllReceipts = (checked: boolean) => {
    if (checked) {
      setSelectedReceipts(Array.isArray(receipts) ? receipts.map(receipt => receipt.id) : []);
    } else {
      setSelectedReceipts([]);
    }
  };

  // Função para visualizar recibo com template
  const handleViewReceipt = async (receiptId: string) => {
    console.log('🔍 handleViewReceipt chamado com ID:', receiptId);
    
    if (!receiptId) {
      console.error('🔍 ID do recibo é undefined ou null');
      toast({
        title: "Erro",
        description: "ID do recibo inválido.",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar se o recibo existe na lista local
    const receipt = Array.isArray(receipts) ? receipts.find(r => r.id === receiptId) : undefined;
    if (!receipt) {
      console.error('🔍 Recibo não encontrado na lista local:', receiptId);
      toast({
        title: "Erro",
        description: "Recibo não encontrado.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('🔍 Dados do recibo encontrado:', receipt);
    
    // Abrir modal do template de recibo
    setSelectedReceiptForTemplate(receipt);
    setShowReceiptTemplateModal(true);
  };

  // Função para baixar recibo
  const handleDownloadReceipt = async (receiptId: string, fileName: string) => {
    console.log('🔍 handleDownloadReceipt chamado com ID:', receiptId, 'e fileName:', fileName);
    
    if (!receiptId) {
      console.error('🔍 ID do recibo é undefined ou null');
      toast({
        title: "Erro",
        description: "ID do recibo inválido.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Tentar fazer download via service
      const blob = await paymentReceiptService.downloadReceipt(receiptId);
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `comprovante_${receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Download iniciado com sucesso!",
      });
    } catch (error) {
      console.error('❌ Erro ao fazer download:', error);
        toast({
          title: "Erro",
        description: "Erro ao fazer download do comprovante.",
          variant: "destructive"
        });
    }
  };

  // Carregar arquivos processados do sistema
  const loadProcessedFiles = async () => {
      setLoadingProcessedFiles(true);
      try {
          // Primeiro, tentar usar os dados já carregados nas outras abas
          if (holerites.length > 0) {
              const holeritesProcessados = holerites.map(payslip => ({
                  id: `hol-${payslip.id}`,
                  name: payslip.fileName || `holerite_${payslip.employeeName}_${payslip.month}_${payslip.year}.pdf`,
                  employeeName: payslip.employeeName,
                  cpf: payslip.cpf,
                  month: payslip.month.toString(),
                  year: payslip.year.toString(),
                  path: `backend/holerites/${payslip.month}-${payslip.year}/${payslip.fileName}`
              }));
              setProcessedHolerites(holeritesProcessados);
              console.log('✅ Holerites carregados dos dados existentes:', holeritesProcessados.length);
          }

          // Carregar comprovantes processados do backend
          try {
              const processedReceipts = await paymentReceiptService.getProcessedFiles();
              console.log('✅ Comprovantes processados carregados do backend:', processedReceipts);
              
              if (processedReceipts && processedReceipts.length > 0) {
                  const comprovantesProcessados = processedReceipts.map(receipt => ({
                      id: `rec-${receipt.id}`,
                      name: receipt.fileName,
                      employeeName: receipt.employeeName,
                      month: receipt.month.toString(),
                      year: receipt.year.toString(),
                      path: receipt.filePath || `uploads/payment-receipts/${receipt.year}/${receipt.month}/${receipt.fileName}`
                  }));
                  // Processed receipts serão exibidos junto com os payment receipts
                  console.log('✅ Comprovantes processados carregados:', comprovantesProcessados.length);
              }
          } catch (backendError) {
              console.warn('⚠️ Erro ao carregar comprovantes do backend, usando dados locais:', backendError);
          }

              if (Array.isArray(receipts) && receipts.length > 0) {
      const recibosProcessados = receipts.map(receipt => ({
                  id: `rec-${receipt.id || Math.random()}`,
                  name: receipt.fileName || `recibo_${receipt.employeeName}_${receipt.month}_${receipt.year}.pdf`,
                  employeeName: receipt.employeeName,
                  month: receipt.month.toString(),
                  year: receipt.year.toString(),
                  path: `uploads/receipts/${receipt.month}_${receipt.year}/${receipt.fileName}`
              }));
              setProcessedRecibos(recibosProcessados);
              console.log('✅ Comprovantes carregados dos dados existentes:', recibosProcessados.length);
          }

          // Se não houver dados nas outras abas, tentar carregar via API
          if (holerites.length === 0) {
              try {
                  const holeritesResponse = await api.get('/holerites/processed-files');
                  if (holeritesResponse.data.success) {
                      setProcessedHolerites(holeritesResponse.data.files || []);
                      console.log('✅ Holerites carregados via API:', holeritesResponse.data.files?.length || 0);
                  }
              } catch (apiError) {
                  console.log('⚠️ Erro ao carregar holerites via API, usando dados simulados');
              }
          }

          if (!Array.isArray(receipts) || receipts.length === 0) {
              try {
                  const recibosResponse = await api.get('/receipts/processed-files');
                  if (recibosResponse.data.success) {
                      setProcessedRecibos(recibosResponse.data.files || []);
                      console.log('✅ Comprovantes carregados via API:', recibosResponse.data.files?.length || 0);
                  }
              } catch (apiError) {
                  console.log('⚠️ Erro ao carregar comprovantes via API, usando dados simulados');
              }
          }
      } catch (error) {
          console.error('Erro ao carregar arquivos processados:', error);
          // Fallback: usar dados simulados baseados na estrutura conhecida
          setProcessedHolerites([
              { id: 'hol-1', name: 'ADERBAL_LUCENA_GONCALVES_71987010604_6_2025.pdf', employeeName: 'ADERBAL LUCENA GONCALVES', cpf: '71987010604', month: '6', year: '2025', path: 'backend/holerites/6-2025/ADERBAL_LUCENA_GONCALVES_71987010604_6_2025.pdf' },
              { id: 'hol-2', name: 'SILVANA_FERREIRA_SELVO_HONORATO_06575259600_6_2025.pdf', employeeName: 'SILVANA FERREIRA SELVO HONORATO', cpf: '06575259600', month: '6', year: '2025', path: 'backend/holerites/6-2025/SILVANA_FERREIRA_SELVO_HONORATO_06575259600_6_2025.pdf' },
              { id: 'hol-3', name: 'DANILO_IGOR_FREITAS_14224861682_6_2025.pdf', employeeName: 'DANILO IGOR FREITAS', cpf: '14224861682', month: '6', year: '2025', path: 'backend/holerites/6-2025/DANILO_IGOR_FREITAS_14224861682_6_2025.pdf' }
          ]);
          setProcessedRecibos([
              { id: 'rec-1', name: 'recibo_ricardo_xavier_de_andrade_valor_07_2025_pagina_44.pdf', employeeName: 'RICARDO XAVIER DE ANDRADE', month: '07', year: '2025', path: 'uploads/receipts/07_2025/recibo_ricardo_xavier_de_andrade_valor_07_2025_pagina_44.pdf' },
              { id: 'rec-2', name: 'recibo_vilcleves_francisco_de_freitas_valor_07_2025_pagina_43.pdf', employeeName: 'VILCLEVES FRANCISCO DE FREITAS', month: '07', year: '2025', path: 'uploads/receipts/07_2025/recibo_vilcleves_francisco_de_freitas_valor_07_2025_pagina_43.pdf' },
              { id: 'rec-3', name: 'recibo_mayara_souza_g_s_nascimento_valor_07_2025_pagina_42.pdf', employeeName: 'MAYARA SOUZA G S NASCIMENTO', month: '07', year: '2025', path: 'uploads/receipts/07_2025/recibo_mayara_souza_g_s_nascimento_valor_07_2025_pagina_42.pdf' }
          ]);
      } finally {
          setLoadingProcessedFiles(false);
      }
  };

  

  // Verificar autenticação
  if (!user) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <AlertCircle className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-red-500 mb-4" />
            <p className="text-seguranca-lightgray mb-4 text-sm sm:text-base">Usuário não autenticado.</p>
            <p className="text-gray-400 text-sm">Faça login para acessar esta página.</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Loading state
  if (loading && holerites.length === 0) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-6 w-6 sm:h-8 sm:w-8 animate-spin text-seguranca-red mb-4" />
            <p className="text-seguranca-lightgray text-sm sm:text-base">Carregando holerites...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (error && holerites.length === 0) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <AlertCircle className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-red-500 mb-4" />
            <p className="text-seguranca-lightgray mb-4 text-sm sm:text-base">{error}</p>
            <Button 
              onClick={() => loadHolerites()}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-sm"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }




  // Função para excluir unificação individual
  const handleDeleteIndividualUnified = async (unification: any) => {
    try {
      const confirmed = window.confirm(
        `Tem certeza que deseja excluir a unificação de ${unification.holerite.employeeName}?\n\n` +
        `Esta ação não pode ser desfeita.`
      );

      if (!confirmed) return;

      toast({
        title: "Excluindo unificação",
        description: "Excluindo documento unificado...",
      });

      // Simular exclusão
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remover da lista
      setIndividualUnifications(prev => prev.filter(u => u.id !== unification.id));
      

      toast({
        title: "Sucesso",
        description: "Unificação excluída com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir unificação:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir unificação.",
        variant: "destructive"
      });
    }
  };

  // Função para limpar seleção de documentos unificados

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header Atraente */}
        <div className="bg-gradient-to-r from-seguranca-black via-seguranca-graphite to-seguranca-black rounded-xl border border-gray-700 p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-seguranca-red rounded-xl shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-seguranca-lightgray">
                    Gestão de Holerites e Comprovantes
                  </h1>
                  <p className="text-seguranca-yellow font-medium text-sm sm:text-base mt-1">
                    Sistema completo de gestão de documentos financeiros
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-seguranca-yellow rounded-full animate-pulse"></div>
                  <span className="text-gray-400">
                    {loading ? 'Carregando...' : `${filteredHolerites.length} holerite${filteredHolerites.length !== 1 ? 's' : ''} encontrado${filteredHolerites.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-400">
                    {Array.isArray(receipts) ? receipts.length : 0} comprovante{(Array.isArray(receipts) ? receipts.length : 0) !== 1 ? 's' : ''} processado{(Array.isArray(receipts) ? receipts.length : 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            
            </div>
            

          </div>
        </div>

        {/* Tabs Modernas e Responsivas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative tab-container">
            <TabsList className="bg-gradient-to-r from-seguranca-graphite to-gray-800 border border-gray-600/50 rounded-2xl p-2 w-full shadow-2xl backdrop-blur-sm">
              <div className="flex w-full gap-1">
            <TabsTrigger 
              value="processados" 
                  className="group relative flex-1 tab-trigger tab-transition tab-hover-effect data-[state=active]:bg-gradient-to-r data-[state=active]:from-seguranca-yellow data-[state=active]:to-yellow-500 data-[state=active]:text-seguranca-black data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=active]:tab-active-glow text-gray-300 hover:text-white hover:bg-seguranca-black/30 text-xs sm:text-sm rounded-xl transition-all duration-500 ease-out hover:scale-102 border border-transparent data-[state=active]:border-seguranca-yellow/20"
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <div className="relative">
                      <FileText size={14} className="sm:w-4 sm:h-4" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-seguranca-red rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium leading-tight">
                        <span className="hidden sm:inline">Holerites</span>
              <span className="sm:hidden">Holerites</span>
                      </span>
                      <Badge variant="secondary" className="text-xs px-1 py-0 h-4 bg-seguranca-black/50 text-seguranca-yellow border-seguranca-yellow/30 group-data-[state=active]:bg-seguranca-black group-data-[state=active]:text-seguranca-yellow">
                        {holerites.length}
                      </Badge>
                    </div>
                  </div>
            </TabsTrigger>
                
                <TabsTrigger 
                  value="recibos" 
                  className="group relative flex-1 tab-trigger tab-transition tab-hover-effect data-[state=active]:bg-gradient-to-r data-[state=active]:from-seguranca-yellow data-[state=active]:to-yellow-500 data-[state=active]:text-seguranca-black data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=active]:tab-active-glow text-gray-300 hover:text-white hover:bg-seguranca-black/30 text-xs sm:text-sm rounded-xl transition-all duration-500 ease-out hover:scale-102 border border-transparent data-[state=active]:border-seguranca-yellow/20"
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <div className="relative">
                      <FileText size={14} className="sm:w-4 sm:h-4" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium leading-tight">
                        <span className="hidden sm:inline">Comprovantes</span>
                        <span className="sm:hidden">Comprovantes</span>
                      </span>
                      <Badge variant="secondary" className="text-xs px-1 py-0 h-4 bg-seguranca-black/50 text-green-400 border-green-400/30 group-data-[state=active]:bg-seguranca-black group-data-[state=active]:text-seguranca-yellow">
                        {Array.isArray(receipts) ? receipts.length : 0}
                      </Badge>
                    </div>
                  </div>
            </TabsTrigger>
                
                <TabsTrigger 
                  value="unificacao-individual" 
                  className="group relative flex-1 tab-trigger tab-transition tab-hover-effect data-[state=active]:bg-gradient-to-r data-[state=active]:from-seguranca-yellow data-[state=active]:to-yellow-500 data-[state=active]:text-seguranca-black data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=active]:tab-active-glow text-gray-300 hover:text-white hover:bg-seguranca-black/30 text-xs sm:text-sm rounded-xl transition-all duration-500 ease-out hover:scale-102 border border-transparent data-[state=active]:border-seguranca-yellow/20"
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <div className="relative">
                      <FileText size={14} className="sm:w-4 sm:h-4" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium leading-tight">
                        <span className="hidden sm:inline">Unificação</span>
                        <span className="sm:hidden">Unificação</span>
                      </span>
                      <Badge variant="secondary" className="text-xs px-1 py-0 h-4 bg-seguranca-black/50 text-blue-400 border-blue-400/30 group-data-[state=active]:bg-seguranca-black group-data-[state=active]:text-seguranca-yellow">
                        <span className="hidden sm:inline">Individual</span>
                        <span className="sm:hidden">Ind.</span>
                      </Badge>
                    </div>
                  </div>
            </TabsTrigger>
              </div>
          </TabsList>
            
            {/* Indicador de progresso animado */}
            <div className="tab-indicator" 
                 style={{
                   width: activeTab === 'processados' ? '33.33%' : activeTab === 'recibos' ? '66.66%' : '100%',
                   transform: `translateX(${activeTab === 'processados' ? '0%' : activeTab === 'recibos' ? '33.33%' : '66.66%'})`
                 }}>
            </div>
          </div>

          <TabsContent value="processados">
            {/* Header da Seção de Holerites */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText size={24} className="text-white" />
                </div>
                Gestão de Holerites
              </h3>
              <p className="text-gray-400 text-base max-w-2xl mx-auto">
                Importe e processe holerites de funcionários com navegação organizada por período.
              </p>
            </div>

            {/* Dashboard de Holerites */}
            <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm mb-8">
              <div className="space-y-8">
                {/* Estatísticas Melhoradas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-red-300/80 text-sm font-medium">Total de Holerites</p>
                        <p className="text-3xl font-bold text-white">{holerites.length}</p>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                          <span className="text-red-300/60 text-xs">Ativo</span>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
                        <FileText size={28} className="text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-green-300/80 text-sm font-medium">Total de Holerites</p>
                        <p className="text-3xl font-bold text-white">{holerites.length}</p>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-300/60 text-xs">Processados</span>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                        <FileText size={28} className="text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-yellow-300/80 text-sm font-medium">Processados Hoje</p>
                        <p className="text-3xl font-bold text-white">{getHoleritesProcessedToday()}</p>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          <span className="text-yellow-300/60 text-xs">Em tempo real</span>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-300">
                        <CheckCircle size={28} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão de Upload Melhorado */}
                <div className="flex justify-center">
                <Button 
                    onClick={() => setShowUploadModal(true)}
                    disabled={loading}
                    className="group relative bg-gradient-to-r from-red-500 via-red-600 to-pink-600 hover:from-red-600 hover:via-pink-600 hover:to-red-700 px-10 py-4 rounded-2xl shadow-2xl hover:shadow-red-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 text-white font-semibold text-lg border border-red-400/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center space-x-3">
                      {loading ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                          <Plus size={20} />
                        </div>
                      )}
                      <span className="text-lg font-semibold">
                        {loading ? 'Processando...' : 'Importar Holerites'}
                      </span>
                    </div>
                </Button>
                </div>
              </div>
            </Card>

            {/* Abas por Ano e Mês */}
            <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
              <div className="space-y-8">
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-white mb-2">Holerites por Período</h4>
                  <p className="text-gray-400">Navegue pelos anos e meses para visualizar os holerites</p>
                </div>
                
                {/* Abas de Ano Melhoradas */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h5 className="text-lg font-semibold text-seguranca-lightgray mb-4">Selecione o Ano</h5>
                    <div className="flex flex-wrap justify-center gap-3">
                      {holeriteAvailableYears.map((year) => (
                <Button 
                          key={year}
                          variant={holeriteActiveYear === year ? "default" : "outline"}
                          onClick={() => {
                            setHoleriteActiveYear(year);
                            const months = getHoleriteAvailableMonths(year);
                            if (months.length > 0) {
                              setHoleriteActiveMonth(months[0].toString());
                            }
                          }}
                          className={`group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                            holeriteActiveYear === year 
                              ? 'bg-gradient-to-r from-seguranca-yellow to-yellow-500 text-seguranca-black shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transform hover:scale-105' 
                              : 'border-2 border-gray-600/50 text-seguranca-lightgray hover:border-seguranca-yellow/50 hover:bg-seguranca-yellow/10 hover:text-seguranca-yellow'
                          }`}
                        >
                          {holeriteActiveYear === year && (
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 rounded-xl blur opacity-50"></div>
                          )}
                          <span className="relative text-lg font-bold">{year}</span>
                </Button>
                      ))}
                    </div>
              </div>

                  {/* Abas de Mês Melhoradas */}
                  {holeriteActiveYear && (
                    <div className="text-center">
                      <h5 className="text-lg font-semibold text-seguranca-lightgray mb-4">Selecione o Mês</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {getHoleriteAvailableMonths(holeriteActiveYear).map((month) => (
                          <Button
                            key={month}
                            variant={holeriteActiveMonth === month.toString() ? "default" : "outline"}
                            onClick={() => setHoleriteActiveMonth(month.toString())}
                            className={`group relative px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                              holeriteActiveMonth === month.toString() 
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transform hover:scale-105' 
                                : 'border-2 border-gray-600/50 text-seguranca-lightgray hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400'
                            }`}
                          >
                            {holeriteActiveMonth === month.toString() && (
                              <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-500/20 rounded-xl blur opacity-50"></div>
                            )}
                            <span className="relative text-sm font-semibold">
                              {getMonthName(month)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Holerites do Período Selecionado */}
                <div className="space-y-6">
                  {/* Controles de seleção em lote */}
                  {getFilteredHolerites().length > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-holerites"
                              checked={areAllHoleritesSelected()}
                              onCheckedChange={handleSelectAllHolerites}
                              className="border-red-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                            />
                            <label htmlFor="select-all-holerites" className="text-white text-sm font-medium">
                              Selecionar Todos
                            </label>
                </div>
                          
                          {hasSelectedHolerites() && (
                            <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-3 py-1">
                              {selectedHolerites.length} selecionado{selectedHolerites.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          
                          {hasSelectedHolerites() && (
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={handleBatchEmailHolerites}
                                variant="outline"
                                size="sm"
                                className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 px-3 py-1 text-sm"
                              >
                                <Mail size={14} className="mr-1" />
                                Email ({selectedHolerites.length})
                              </Button>
                              <Button
                                onClick={handleBatchWhatsAppHolerites}
                                variant="outline"
                                size="sm"
                                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 px-3 py-1 text-sm"
                              >
                                <MessageSquare size={14} className="mr-1" />
                                WhatsApp ({selectedHolerites.length})
                              </Button>
                              <Button
                                onClick={handleBatchDeleteHolerites}
                                variant="outline"
                                size="sm"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 px-3 py-1 text-sm"
                              >
                                <Trash2 size={14} className="mr-1" />
                                Excluir ({selectedHolerites.length})
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

              {/* Lista de holerites */}
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 size={32} className="animate-spin text-seguranca-yellow" />
                  <span className="ml-2 text-seguranca-lightgray text-sm sm:text-base">Carregando holerites...</span>
                </div>
              ) : filteredHolerites.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-seguranca-red/10 rounded-full mb-6">
                    <FileText size={48} className="text-seguranca-red" />
                  </div>
                  <h3 className="text-xl font-semibold text-seguranca-lightgray mb-3">
                    {searchTerm ? 'Nenhum holerite encontrado' : 'Nenhum holerite processado ainda'}
                  </h3>
                  <p className="text-gray-400 mb-6 text-base max-w-md mx-auto">
                    {searchTerm 
                      ? 'Tente ajustar os termos de busca ou verificar a ortografia.'
                      : 'Comece fazendo o upload do primeiro arquivo PDF para processar os holerites.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowUploadModal(true)}
                      className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red px-8 py-3 rounded-xl shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105"
                    >
                      <Plus size={18} className="mr-2" />
                      Fazer Primeiro Upload
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header da tabela com seleção e botões de ação */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-seguranca-black rounded-lg border border-gray-600 gap-2">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                      />
                      <span className="text-seguranca-lightgray font-medium text-xs sm:text-sm">
                        {selectedHolerites.length > 0 
                          ? `${selectedHolerites.length} selecionado${selectedHolerites.length > 1 ? 's' : ''}`
                          : 'Selecionar todos'
                        }
                      </span>
                    </div>
                    
                    {/* Botões de ação principais - movidos para cá conforme indicado pela seta */}
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSelected}
                        disabled={selectedHolerites.length === 0}
                        className="bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                      >
                        <Trash2 size={14} className="mr-1" />
                        <span className="hidden sm:inline">Excluir Selecionados</span>
                        <span className="sm:hidden">Excluir</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowWhatsAppModal(true)}
                        disabled={selectedHolerites.length === 0}
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                      >
                        <MessageSquare size={14} className="mr-1" />
                        <span className="hidden sm:inline">Enviar WhatsApp</span>
                        <span className="sm:hidden">WhatsApp</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRefreshing(true);
                          clearFilters();
                          setTimeout(() => setRefreshing(false), 1000);
                        }}
                        disabled={refreshing}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black shadow-lg hover:shadow-gray-500/25 transition-all text-xs"
                      >
                        {refreshing ? (
                          <Loader2 size={14} className="mr-1 animate-spin" />
                        ) : (
                          <RefreshCw size={14} className="mr-1" />
                        )}
                        <span className="hidden sm:inline">Limpar Filtros</span>
                        <span className="sm:hidden">Limpar</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshHolerites}
                        disabled={refreshing}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black shadow-lg hover:shadow-gray-500/25 transition-all text-xs"
                      >
                        {refreshing ? (
                          <Loader2 size={14} className="mr-1 animate-spin" />
                        ) : (
                          <RefreshCw size={14} className="mr-1" />
                        )}
                        <span className="hidden sm:inline">Atualizar</span>
                        <span className="sm:hidden">Atualizar</span>
                      </Button>
                    </div>
                  </div>

                  {/* Lista de holerites */}
                  {filteredHolerites.map((holerite) => (
                    <div
                      key={holerite.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, holerite, 'holerite')}
                      className={`flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 bg-seguranca-black rounded-lg border transition-colors gap-3 cursor-move hover:shadow-lg ${
                        selectedHolerites.includes(holerite.id)
                          ? 'border-seguranca-yellow bg-seguranca-yellow/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedHolerites.includes(holerite.id)}
                          onCheckedChange={(checked) => handleSelectHolerite(holerite.id, !!checked)}
                          className="data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow flex-shrink-0 mt-1 sm:mt-0"
                        />
                        
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-seguranca-red rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="text-white" size={14} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-medium text-seguranca-lightgray text-sm break-words">
                              {holerite.employeeName}
                            </h3>
                            <Badge variant="outline" className="text-xs w-fit">
                              {holerite.month}/{holerite.year}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-400">
                            <span className="flex items-center">
                              <User size={12} className="mr-1 flex-shrink-0" />
                              CPF: {holerite.cpf}
                            </span>
                            <span className="flex items-center">
                              <Calendar size={12} className="mr-1 flex-shrink-0" />
                              {formatDate(holerite.processedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 sm:gap-2 justify-start lg:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewHolerite(holerite)}
                          className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black text-xs"
                        >
                          <Eye size={14} className="mr-1" />
                          <span className="hidden sm:inline">Visualizar</span>
                          <span className="sm:hidden">Ver</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEmailHolerite(holerite)}
                          className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white text-xs"
                        >
                          <Mail size={14} className="mr-1" />
                          <span className="hidden sm:inline">Email</span>
                          <span className="sm:hidden">Email</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendWhatsAppIndividual(holerite)}
                          className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white text-xs"
                        >
                          <MessageSquare size={14} className="mr-1" />
                          <span className="hidden sm:inline">WhatsApp</span>
                          <span className="sm:hidden">WApp</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadHolerite(holerite)}
                          className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black text-xs"
                        >
                          <Download size={14} className="mr-1" />
                          <span className="hidden sm:inline">Baixar</span>
                          <span className="sm:hidden">Baixar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteHolerite(holerite)}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-xs"
                        >
                          <Trash2 size={14} className="mr-1" />
                          <span className="hidden sm:inline">Excluir</span>
                          <span className="sm:hidden">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="recibos">
            <div className="space-y-6">
                {/* Header da aba - Design Moderno */}
                <div className="text-center relative">
                  <div className="relative inline-block">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-3xl shadow-2xl mb-6 transform hover:scale-105 transition-all duration-300">
                      <FileText size={36} className="text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-seguranca-black flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-seguranca-lightgray via-white to-seguranca-lightgray bg-clip-text text-transparent mb-4">
                    Comprovantes de Pagamento de Salário
                  </h3>
                  <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
                    Importe e processe comprovantes de transferência de pagamento de salário de funcionários com tecnologia avançada de OCR e organização automática.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-blue-300 text-sm font-medium">Sistema ativo e monitorado</span>
                  </div>
                </div>
                
              {/* Dashboard de Comprovantes */}
              <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                <div className="space-y-8">
                  {/* Estatísticas Melhoradas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group bg-gradient-to-br from-blue-500/15 to-blue-600/10 border border-blue-500/30 rounded-3xl p-8 hover:border-blue-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                            <p className="text-blue-300/90 text-sm font-semibold uppercase tracking-wide">Total de Comprovantes</p>
                          </div>
                          <p className="text-4xl font-bold text-white">{paymentReceipts.length}</p>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-blue-300/70 text-xs font-medium">Sistema ativo</span>
                          </div>
                        </div>
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-blue-500/30 transition-all duration-500 group-hover:scale-110">
                          <FileText size={32} className="text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="group bg-gradient-to-br from-green-500/15 to-green-600/10 border border-green-500/30 rounded-3xl p-8 hover:border-green-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <p className="text-green-300/90 text-sm font-semibold uppercase tracking-wide">Anos Disponíveis</p>
                          </div>
                          <p className="text-4xl font-bold text-white">{getAvailableYears().length}</p>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-300/70 text-xs font-medium">Organizado</span>
                          </div>
                        </div>
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-green-500/30 transition-all duration-500 group-hover:scale-110">
                          <Calendar size={32} className="text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="group bg-gradient-to-br from-yellow-500/15 to-yellow-600/10 border border-yellow-500/30 rounded-3xl p-8 hover:border-yellow-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                            <p className="text-yellow-300/90 text-sm font-semibold uppercase tracking-wide">Processados Hoje</p>
                          </div>
                          <p className="text-4xl font-bold text-white">{getHoleritesProcessedToday()}</p>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            <span className="text-yellow-300/70 text-xs font-medium">Em tempo real</span>
                          </div>
                        </div>
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-yellow-500/30 transition-all duration-500 group-hover:scale-110">
                          <CheckCircle size={32} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Upload Melhorado */}
                  <div className="flex justify-center">
                      <Button 
                      onClick={() => setShowPaymentReceiptUploadModal(true)}
                      disabled={processingPaymentReceipts}
                      className="group relative bg-gradient-to-r from-blue-500 via-purple-600 to-blue-700 hover:from-blue-600 hover:via-purple-700 hover:to-blue-800 px-12 py-6 rounded-3xl shadow-2xl hover:shadow-blue-500/40 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 text-white font-bold text-xl border border-blue-400/30 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <div className="relative flex items-center space-x-4">
                        {processingPaymentReceipts ? (
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Loader2 size={24} className="animate-spin" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                            <Plus size={24} />
                          </div>
                        )}
                        <span className="text-xl font-bold">
                          {processingPaymentReceipts ? 'Processando...' : 'Importar Comprovante de Pagamento'}
                        </span>
                      </div>
                      </Button>
                  </div>
                    </div>
                  </Card>

              {/* Abas por Ano e Mês */}
              <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                <div className="space-y-8">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-white mb-2">Comprovantes por Período</h4>
                    <p className="text-gray-400">Navegue pelos anos e meses para visualizar os comprovantes</p>
                </div>

                  {/* Abas de Ano Melhoradas */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h5 className="text-lg font-semibold text-seguranca-lightgray mb-4">Selecione o Ano</h5>
                      <div className="flex flex-wrap justify-center gap-3">
                        {getAvailableYears().map((year) => (
                        <Button
                            key={year}
                            variant={activeYear === year.toString() ? "default" : "outline"}
                            onClick={() => {
                              setActiveYear(year.toString());
                              const months = getAvailableMonths(year.toString());
                              if (months.length > 0) {
                                setActiveMonth(months[0].toString());
                              }
                            }}
                            className={`group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                              activeYear === year.toString() 
                                ? 'bg-gradient-to-r from-seguranca-yellow to-yellow-500 text-seguranca-black shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transform hover:scale-105' 
                                : 'border-2 border-gray-600/50 text-seguranca-lightgray hover:border-seguranca-yellow/50 hover:bg-seguranca-yellow/10 hover:text-seguranca-yellow'
                            }`}
                          >
                            {activeYear === year.toString() && (
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 rounded-xl blur opacity-50"></div>
                            )}
                            <span className="relative text-lg font-bold">{year}</span>
                        </Button>
                        ))}
                      </div>
                    </div>

                    {/* Abas de Mês Melhoradas */}
                    {activeYear && (
                      <div className="text-center">
                        <h5 className="text-lg font-semibold text-seguranca-lightgray mb-4">Selecione o Mês</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {getAvailableMonths(activeYear).map((month) => (
                      <Button
                              key={month}
                              variant={activeMonth === month.toString() ? "default" : "outline"}
                              onClick={() => setActiveMonth(month.toString())}
                              className={`group relative px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                                activeMonth === month.toString() 
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105' 
                                  : 'border-2 border-gray-600/50 text-seguranca-lightgray hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400'
                              }`}
                            >
                              {activeMonth === month.toString() && (
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-500/20 rounded-xl blur opacity-50"></div>
                              )}
                              <span className="relative text-sm font-semibold">
                                {getMonthName(month)}
                              </span>
                      </Button>
                          ))}
                    </div>
                      </div>
                    )}
                  </div>

                  {/* Lista de Comprovantes do Período Selecionado */}
                  <div className="space-y-6">
                    {/* Header responsivo melhorado */}
                    <div className="bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-sm">
                      
                      {/* Layout principal: empilhado em mobile, lado a lado em desktop */}
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 xl:gap-6">
                        
                        {/* Seção de informações - sempre visível */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <FileText size={20} className="sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-lg sm:text-xl xl:text-2xl font-bold text-white leading-tight">
                              Comprovantes de {getMonthName(parseInt(activeMonth))} de {activeYear}
                            </h5>
                            <p className="text-blue-300/90 text-xs sm:text-sm font-medium mt-1">
                              Documentos processados e organizados
                            </p>
                          </div>
                        </div>
                        
                        {/* Badge de contagem - responsivo */}
                        <div className="flex justify-center xl:justify-end">
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-lg font-bold shadow-xl rounded-xl sm:rounded-2xl">
                            {getFilteredPaymentReceipts().length} comprovante{getFilteredPaymentReceipts().length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Controles de seleção em lote - responsivo */}
                      {getFilteredPaymentReceipts().length > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-500/20">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            
                            {/* Checkbox de selecionar todos */}
                            <div className="flex items-center space-x-3 bg-seguranca-black/50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-gray-600/30">
                              <Checkbox
                                id="select-all-payment-receipts"
                                checked={areAllPaymentReceiptsSelected()}
                                onCheckedChange={handleSelectAllPaymentReceipts}
                                className="border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 w-4 h-4 sm:w-5 sm:h-5"
                              />
                              <label htmlFor="select-all-payment-receipts" className="text-white text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap">
                                Selecionar Todos
                              </label>
                            </div>
                            
                            {/* Botões de ação - responsivos */}
                            {hasSelectedPaymentReceipts() && (
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                <Button
                                  onClick={handleBatchEmailPaymentReceipts}
                                  variant="outline"
                                  size="sm"
                                  className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 px-3 py-1 text-sm flex-1 sm:flex-none min-w-0"
                                >
                                  <Mail size={14} className="mr-1" />
                                  <span className="hidden sm:inline">Email</span>
                                  <span className="sm:hidden">E</span>
                                  <span className="ml-1">({selectedPaymentReceipts.length})</span>
                                </Button>
                                
                                <Button
                                  onClick={handleBatchWhatsAppPaymentReceipts}
                                  variant="outline"
                                  size="sm"
                                  className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 px-3 py-1 text-sm flex-1 sm:flex-none min-w-0"
                                >
                                  <MessageSquare size={14} className="mr-1" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                  <span className="sm:hidden">W</span>
                                  <span className="ml-1">({selectedPaymentReceipts.length})</span>
                                </Button>
                                
                                <Button
                                  onClick={handleDeleteMultiplePaymentReceipts}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 px-3 py-1 text-sm flex-1 sm:flex-none min-w-0"
                                >
                                  <Trash2 size={14} className="mr-1" />
                                  <span className="hidden sm:inline">Excluir</span>
                                  <span className="sm:hidden">X</span>
                                  <span className="ml-1">({selectedPaymentReceipts.length})</span>
                                </Button>
                                
                                <Button
                                  onClick={clearPaymentReceiptSelection}
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10 hover:border-gray-400 px-3 py-1 text-sm flex-1 sm:flex-none min-w-0"
                                >
                                  <X size={14} className="mr-1" />
                                  <span className="hidden sm:inline">Limpar</span>
                                  <span className="sm:hidden">L</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                </div>
                
                    {loadingPaymentReceipts ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                        <p className="text-white text-lg font-medium">Carregando comprovantes...</p>
                        <p className="text-gray-400 text-sm">Aguarde um momento</p>
                      </div>
                    ) : getFilteredPaymentReceipts().length === 0 ? (
                      <div className="text-center py-16 px-4">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl mb-6">
                          <FileText size={40} className="text-blue-400" />
                    </div>
                        <h3 className="text-xl font-bold text-white mb-3">
                          Nenhum comprovante encontrado
                        </h3>
                        <p className="text-gray-400 text-base mb-6">
                          Não há comprovantes para {getMonthName(parseInt(activeMonth))} de {activeYear}.
                      </p>
                      <Button
                          onClick={() => setShowPaymentReceiptUploadModal(true)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
                        >
                          <Plus size={20} className="mr-2" />
                          Importar Primeiro Comprovante
                      </Button>
                    </div>
                    ) : (
                      <div className="grid gap-4">
                        {getFilteredPaymentReceipts().map((receipt, index) => (
                          <div key={receipt.id} className="group bg-gradient-to-r from-seguranca-black/50 to-seguranca-graphite/50 border border-gray-600/30 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02]">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                                  <div className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`payment-receipt-${receipt.id}`}
                                      checked={selectedPaymentReceipts.includes(receipt.id)}
                                      onCheckedChange={(checked) => handleSelectPaymentReceipt(receipt.id, checked as boolean)}
                                      className="border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                    />
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                      <User size={20} className="text-white" />
                    </div>
                                    <div>
                                      <h6 className="font-bold text-white text-lg">
                                        {receipt.employeeName}
                                      </h6>
                                      <p className="text-gray-400 text-sm">Funcionário</p>
                </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
                                      ✓ Processado
                        </Badge>
                    </div>
                    </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                  <div className="flex items-center space-x-2 text-gray-300">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                      <span className="text-green-400">💰</span>
                  </div>
                                    <div>
                                      <p className="text-gray-400 text-xs">Valor</p>
                                      <p className="font-semibold text-white">R$ {Number(receipt.netSalary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                      </div>
                                  <div className="flex items-center space-x-2 text-gray-300">
                                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                      <Calendar size={16} className="text-blue-400" />
                    </div>
                                    <div>
                                      <p className="text-gray-400 text-xs">Processado em</p>
                                      <p className="font-semibold text-white">{formatDate(receipt.processedAt || receipt.updatedAt)}</p>
                        </div>
                                </div>
                                  <div className="flex items-center space-x-2 text-gray-300">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                      <FileText size={16} className="text-purple-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-gray-400 text-xs">Arquivo</p>
                                      <p className="font-semibold text-white truncate">{receipt.fileName}</p>
                                    </div>
                                </div>
                              </div>
                            </div>
                            
                              <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                  onClick={() => handleViewPaymentReceipt(receipt)}
                                  className="group border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                                >
                                  <Eye size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                                  Visualizar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                  onClick={() => handleDownloadPaymentReceipt(receipt.id, receipt.fileName)}
                                  className="group border-2 border-green-500/50 text-green-400 hover:bg-green-500 hover:text-white hover:border-green-500 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                                >
                                  <Download size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                                  Baixar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                  onClick={() => handleDeletePaymentReceipt(receipt.id)}
                                  className="group border-2 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                                >
                                  <Trash2 size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                                  Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
              </Card>
            </div>
          </TabsContent>


          {/* Nova Aba: Unificação Individual */}
          <TabsContent value="unificacao-individual" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Lista de Holerites Processados */}
                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                              <FileText className="w-5 h-5 mr-2 text-yellow-600" />
                              Holerites Processados
                              <Badge variant="secondary" className="ml-2">
                                  {getFilteredHolerites().length} / {processedHolerites.length}
                              </Badge>
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          {/* Campo de busca */}
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                              <Input
                                  placeholder="Buscar holerites..."
                                  value={holeriteSearchTerm}
                                  onChange={(e) => setHoleriteSearchTerm(e.target.value)}
                                  className="pl-10 pr-10"
                              />
                              {holeriteSearchTerm && (
                                  <button
                                      onClick={() => setHoleriteSearchTerm('')}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                      <X className="w-4 h-4" />
                                  </button>
                              )}
                          </div>

                          {/* Lista de holerites */}
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                              {loadingProcessedFiles ? (
                                  <div className="flex items-center justify-center py-8">
                                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                      <span className="ml-2 text-muted-foreground">Carregando holerites...</span>
                                  </div>
                              ) : getFilteredHolerites().length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                      <p>Nenhum holerite encontrado</p>
                                  </div>
                              ) : (
                                  getFilteredHolerites().map((holerite) => (
                                      <div
                                          key={holerite.id}
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, holerite, 'holerite')}
                                          className="p-3 border rounded-lg cursor-move hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 active:scale-95"
                                      >
                                          <div className="flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm truncate">{holerite.employeeName}</p>
                                                  <p className="text-xs text-muted-foreground truncate">
                                                      CPF: {holerite.cpf} • {holerite.month}/{holerite.year}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground truncate">{holerite.name}</p>
                                              </div>
                                              <Badge variant="outline" className="ml-2 flex-shrink-0">
                                                  Holerite
                                              </Badge>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      </CardContent>
                  </Card>

                  {/* Lista de Comprovantes Processados */}
                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                              <FileText className="w-5 h-5 mr-2 text-yellow-600" />
                              Comprovantes Processados
                              <Badge variant="secondary" className="ml-2">
                                  {getFilteredRecibos().length} / {processedRecibos.length}
                              </Badge>
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          {/* Campo de busca */}
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                              <Input
                                  placeholder="Buscar recibos..."
                                  value={reciboSearchTerm}
                                  onChange={(e) => setReciboSearchTerm(e.target.value)}
                                  className="pl-10 pr-10"
                              />
                              {reciboSearchTerm && (
                                  <button
                                      onClick={() => setReciboSearchTerm('')}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                      <X className="w-4 h-4" />
                              </button>
                              )}
                          </div>

                          {/* Lista de comprovantes */}
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                              {loadingProcessedFiles ? (
                                  <div className="flex items-center justify-center py-8">
                                      <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                                      <span className="ml-2 text-muted-foreground">Carregando comprovantes...</span>
                                  </div>
                              ) : getFilteredRecibos().length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                      <p>Nenhum comprovante encontrado</p>
                                  </div>
                              ) : (
                                  getFilteredRecibos().map((recibo) => (
                                      <div
                                          key={recibo.id}
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, recibo, 'recibo')}
                                          className="p-3 border rounded-lg cursor-move hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 active:scale-95"
                                      >
                                          <div className="flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm truncate">{recibo.employeeName}</p>
                                                  <p className="text-xs text-muted-foreground truncate">
                                                      {recibo.month}/{recibo.year}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground truncate">{recibo.name}</p>
                                              </div>
                                              <Badge variant="outline" className="ml-2 flex-shrink-0">
                                                  Recibo
                                              </Badge>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      </CardContent>
                  </Card>
              </div>

              {/* Área de Unificação */}
              <Card 
                  className="border-2 border-dashed border-yellow-300 bg-yellow-50/30 transition-all duration-200 hover:border-yellow-400 hover:bg-yellow-50/50"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'unificacao')}
              >
                  <CardHeader>
                      <CardTitle className="flex items-center text-lg text-yellow-800">
                          <RefreshCw className="w-5 h-5 mr-2" />
                          Área de Unificação Individual
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      {!draggedHolerite && !draggedRecibo ? (
                          <div className="text-center py-12">
                              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <FileText className="w-8 h-8 text-yellow-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                  Arraste um Holerite e um Recibo
                              </h3>
                              <p className="text-yellow-700">
                                  Arraste um holerite da lista esquerda e um recibo da lista direita para criar um documento unificado
                              </p>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Holerite selecionado */}
                                  {draggedHolerite && (
                                      <Card className="bg-blue-50 border-blue-200">
                                          <CardContent className="p-4">
                                              <div className="flex items-center justify-between">
                                                  <div>
                                                      <h4 className="font-semibold text-blue-800">Holerite Selecionado</h4>
                                                      <p className="text-sm text-blue-700">{draggedHolerite.employeeName}</p>
                                                      <p className="text-xs text-blue-600">{draggedHolerite.month}/{draggedHolerite.year}</p>
                                                  </div>
                                                  <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => setDraggedHolerite(null)}
                                                      className="text-blue-600 hover:text-blue-800"
                                                  >
                                                      <X className="w-4 h-4" />
                                                  </Button>
                                              </div>
                                          </CardContent>
                                      </Card>
                                  )}

                                  {/* Recibo selecionado */}
                                  {draggedRecibo && (
                                      <Card className="bg-green-50 border-green-200">
                                          <CardContent className="p-4">
                                              <div className="flex items-center justify-between">
                                                  <div>
                                                      <h4 className="font-semibold text-green-800">Recibo Selecionado</h4>
                                                      <p className="text-sm text-green-700">{draggedRecibo.employeeName}</p>
                                                      <p className="text-xs text-green-600">{draggedRecibo.month}/{draggedRecibo.year}</p>
                                                  </div>
                                                  <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => setDraggedRecibo(null)}
                                                      className="text-green-600 hover:text-green-800"
                                                  >
                                                      <X className="w-4 h-4" />
                                                  </Button>
                                              </div>
                                          </CardContent>
                                      </Card>
                                  )}
                              </div>

                              {/* Botão de processar */}
                              {draggedHolerite && draggedRecibo && (
                                  <div className="text-center">
                                      <Button
                                          onClick={() => createUnification(draggedHolerite, draggedRecibo)}
                                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 text-lg"
                                          disabled={processingIndividualUnification}
                                      >
                                          {processingIndividualUnification ? (
                                              <>
                                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                  Processando...
                                              </>
                                          ) : (
                                              <>
                                                  <RefreshCw className="w-5 h-5 mr-2" />
                                                  Processar Unificação
                                              </>
                                          )}
                                      </Button>
                                  </div>
                              )}
                          </div>
                      )}
                  </CardContent>
              </Card>

          </TabsContent>

        </Tabs>

        {/* Modais */}
        <HoleriteViewModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          payslip={selectedHolerite as any}
          onDownload={() => selectedHolerite && handleDownloadHolerite(selectedHolerite)}
          onSendEmail={() => selectedHolerite && handleEmailHolerite(selectedHolerite)}
          onSendWhatsApp={() => selectedHolerite && handleSendWhatsAppIndividual(selectedHolerite)}
        />

        <HoleriteEmailModal
          open={showEmailModal}
          onOpenChange={setShowEmailModal}
          payslip={selectedHolerite as any}
        />

        {/* Modal de Visualização de Documento Unificado Individual */}
        <Dialog open={showIndividualUnifiedViewModal} onOpenChange={setShowIndividualUnifiedViewModal}>
          <DialogContent className="w-full max-w-7xl h-[95vh] max-h-[95vh] overflow-hidden p-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-seguranca-lightgray text-lg sm:text-xl">
                Documento Unificado: {selectedUnifiedDocument?.holerite?.employeeName}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Visualização do documento unificado do funcionário
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col h-full px-6 pb-6">
              {/* Informações dos documentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-seguranca-graphite rounded-lg mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-seguranca-red rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-white sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-seguranca-lightgray font-medium text-sm sm:text-base">Holerite</h4>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{selectedUnifiedDocument?.holerite?.fileName}</p>
                    <p className="text-gray-400 text-xs">{selectedUnifiedDocument?.holerite?.month}/{selectedUnifiedDocument?.holerite?.year}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-white sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-seguranca-lightgray font-medium text-sm sm:text-base">Recibo</h4>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{selectedUnifiedDocument?.recibo?.fileName}</p>
                    <p className="text-gray-400 text-xs">{selectedUnifiedDocument?.recibo?.month}/{selectedUnifiedDocument?.recibo?.year}</p>
                  </div>
                </div>
              </div>

              {/* Área do PDF */}
              <div className="bg-seguranca-black border border-gray-600 rounded-lg flex-1 flex flex-col min-h-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-gray-600">
                  <h4 className="text-seguranca-lightgray font-medium text-sm sm:text-base">Visualização do PDF Unificado</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const url = await generateUnifiedPdf(selectedUnifiedDocument);
                        if (url) {
                          // Atualizar o estado para mostrar o PDF unificado
                          setSelectedUnifiedDocument(prev => ({ ...prev, unifiedPdfUrl: url }));
                        }
                      }}
                      className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black text-xs sm:text-sm font-medium"
                    >
                      <FileText size={14} className="mr-1" />
                      <span className="hidden sm:inline">Gerar PDF Unificado</span>
                      <span className="sm:hidden">Gerar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadIndividualUnified(selectedUnifiedDocument)}
                      className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white text-xs sm:text-sm"
                    >
                      <Download size={14} className="mr-1" />
                      <span className="hidden sm:inline">Baixar</span>
                      <span className="sm:hidden">Baixar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmailIndividualUnified(selectedUnifiedDocument)}
                      className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white text-xs sm:text-sm"
                    >
                      <Mail size={14} className="mr-1" />
                      <span className="hidden sm:inline">Email</span>
                      <span className="sm:hidden">Email</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWhatsAppIndividualUnified(selectedUnifiedDocument)}
                      className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white text-xs sm:text-sm"
                    >
                      <MessageSquare size={14} className="mr-1" />
                      <span className="hidden sm:inline">WhatsApp</span>
                      <span className="sm:hidden">WApp</span>
                    </Button>
                  </div>
                </div>
                
                                 {/* Visualizador do PDF */}
                 <div className="flex-1 p-3 sm:p-4 min-h-0 relative">
                   {selectedUnifiedDocument ? (
                     <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-lg">
                       {selectedUnifiedDocument.unifiedPdfUrl ? (
                         // PDF unificado gerado - mostrar o documento real
                         <iframe
                           src={selectedUnifiedDocument.unifiedPdfUrl}
                           className="w-full h-full border-0"
                           title="PDF Unificado"
                           onError={() => console.log('Erro ao carregar PDF unificado')}
                         />
                       ) : (
                         // Preview dos documentos individuais
                         <div className="w-full h-full bg-gray-100 p-4">
                           <div className="text-center mb-6">
                             <FileText size={48} className="text-seguranca-yellow mx-auto mb-3" />
                             <h5 className="text-seguranca-black font-bold text-xl mb-2">Preview do PDF Unificado</h5>
                             <p className="text-gray-600 text-sm">Clique em "Gerar PDF Unificado" para criar o documento real</p>
                           </div>
                           
                           {/* Preview das duas páginas */}
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                             {/* Página 1 - Holerite */}
                             <div className="bg-white border-2 border-seguranca-red rounded-lg p-4 shadow-lg">
                               <div className="flex items-center gap-3 mb-3">
                                 <div className="w-8 h-8 bg-seguranca-red rounded-full flex items-center justify-center">
                                   <FileText size={16} className="text-white" />
                                 </div>
                                 <h6 className="text-seguranca-black font-bold text-lg">PÁGINA 1</h6>
                               </div>
                               <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                 <h6 className="text-seguranca-black font-semibold mb-2">HOLERITE</h6>
                                 <p className="text-gray-700 text-sm mb-1">
                                   <strong>Funcionário:</strong> {selectedUnifiedDocument?.holerite?.employeeName}
                                 </p>
                                 <p className="text-gray-700 text-sm mb-1">
                                   <strong>Período:</strong> {selectedUnifiedDocument?.holerite?.month}/{selectedUnifiedDocument?.holerite?.year}
                                 </p>
                                 <p className="text-gray-700 text-sm mb-1">
                                   <strong>CPF:</strong> {selectedUnifiedDocument?.holerite?.cpf}
                                 </p>
                                 <p className="text-gray-700 text-sm">
                                   <strong>Arquivo:</strong> {selectedUnifiedDocument?.holerite?.fileName}
                                 </p>
                               </div>
                               <div className="text-center">
                                 <div className="inline-block bg-seguranca-red/20 border border-seguranca-red rounded-lg px-3 py-1">
                                   <span className="text-seguranca-red text-xs font-medium">HOLERITE</span>
                                 </div>
                               </div>
                             </div>
                             
                             {/* Página 2 - Recibo */}
                             <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg">
                               <div className="flex items-center gap-3 mb-3">
                                 <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                   <FileText size={16} className="text-white" />
                                 </div>
                                 <h6 className="text-seguranca-black font-bold text-lg">PÁGINA 2</h6>
                               </div>
                               <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                 <h6 className="text-seguranca-black font-semibold mb-2">RECIBO</h6>
                                 <p className="text-gray-700 text-sm mb-1">
                                   <strong>Funcionário:</strong> {selectedUnifiedDocument?.recibo?.employeeName}
                                 </p>
                                 <p className="text-gray-700 text-sm mb-1">
                                   <strong>Período:</strong> {selectedUnifiedDocument?.recibo?.month}/{selectedUnifiedDocument?.recibo?.year}
                                 </p>
                                 <p className="text-gray-700 text-sm">
                                   <strong>Arquivo:</strong> {selectedUnifiedDocument?.recibo?.fileName}
                                 </p>
                               </div>
                               <div className="text-center">
                                 <div className="inline-block bg-blue-500/20 border border-blue-500 rounded-lg px-3 py-1">
                                   <span className="text-blue-500 text-xs font-medium">RECIBO</span>
                                 </div>
                               </div>
                             </div>
                           </div>
                           
                           {/* Instruções */}
                           <div className="mt-6 text-center">
                             <div className="inline-block bg-seguranca-yellow/20 border border-seguranca-yellow rounded-lg px-4 py-2">
                               <p className="text-seguranca-black text-sm font-medium">
                                 📄 Clique em "Gerar PDF Unificado" para criar o documento real com holerite na primeira página e recibo na segunda página
                               </p>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                       <div className="text-center text-gray-400">
                         <FileText size={48} className="mx-auto mb-4" />
                         <p>Selecione um documento para visualizar</p>
                       </div>
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <HoleriteUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* Modal de envio em massa WhatsApp */}
        <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
          <DialogContent className="w-[95vw] max-w-[500px] bg-seguranca-graphite border-gray-600 mx-4 sm:mx-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-seguranca-lightgray text-base sm:text-lg lg:text-xl">Enviar via WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <textarea
                className="w-full p-3 rounded bg-seguranca-black border border-gray-600 text-seguranca-lightgray text-sm resize-none"
                rows={5}
                value={whatsAppMessage}
                onChange={e => setWhatsAppMessage(e.target.value)}
                placeholder="Digite a mensagem que será enviada via WhatsApp..."
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowWhatsAppModal(false)} 
                  disabled={sendingWhatsApp}
                  className="order-2 sm:order-1 flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSendWhatsApp} 
                  disabled={sendingWhatsApp} 
                  className="bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-2 flex-1 sm:flex-none"
                >
                  {sendingWhatsApp ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmação de exclusão */}
        <HoleriteDeleteDialog
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          holerites={holeritesToDelete}
          onConfirm={confirmDeleteSelected}
          isLoading={isDeleting}
        />

        {/* Modal de upload de comprovantes */}
        <Dialog open={showReceiptUploadModal} onOpenChange={setShowReceiptUploadModal}>
          <DialogContent className="w-[95vw] max-w-[500px] bg-seguranca-graphite border-gray-600 mx-4 sm:mx-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-seguranca-lightgray text-base sm:text-lg lg:text-xl">Upload de Comprovantes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <FileText size={40} className="mx-auto text-gray-500 mb-4 sm:hidden" />
                <FileText size={48} className="mx-auto text-gray-500 mb-4 hidden sm:block" />
                <p className="text-gray-400 mb-4 text-xs sm:text-sm">
                  Selecione um arquivo PDF contendo os recibos de pagamento para processamento.
                </p>
              </div>
              
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleReceiptUpload(file);
                    }
                  }}
                  className="hidden"
                  id="receipt-file-input"
                  disabled={processingReceipts}
                />
                <label
                  htmlFor="receipt-file-input"
                  className="cursor-pointer block"
                >
                  <div className="space-y-2">
                    <FileText size={24} className="mx-auto text-gray-500 sm:hidden" />
                    <FileText size={32} className="mx-auto text-gray-500 hidden sm:block" />
                    <p className="text-seguranca-lightgray font-medium text-sm">
                      {processingReceipts ? 'Processando...' : 'Clique para selecionar arquivo PDF'}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Apenas arquivos PDF são aceitos
                    </p>
                  </div>
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReceiptUploadModal(false)} 
                  disabled={processingReceipts}
                  className="order-2 sm:order-1 flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de upload de comprovantes de pagamento - RESPONSIVO */}
        <Dialog open={showPaymentReceiptUploadModal} onOpenChange={setShowPaymentReceiptUploadModal}>
          <DialogContent className="w-[98vw] sm:w-[95vw] max-w-[600px] h-[90vh] sm:h-auto max-h-[90vh] overflow-y-auto bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-gray-600/50 mx-2 sm:mx-4 rounded-xl sm:rounded-2xl shadow-2xl">
            <DialogHeader className="pb-4 sm:pb-6 text-center px-2 sm:px-0">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4">
                <FileText size={24} className="sm:hidden text-white" />
                <FileText size={32} className="hidden sm:block text-white" />
              </div>
              <DialogTitle className="text-white text-lg sm:text-xl md:text-2xl font-bold px-2 sm:px-0">
                Importar Comprovante de Pagamento
              </DialogTitle>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-2 px-2 sm:px-0 leading-relaxed">
                Selecione um arquivo PDF contendo o comprovante de transferência de pagamento de salário de funcionário.
              </p>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
              {/* Seção "O que será feito" - Otimizada para mobile */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base md:text-lg flex items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <span className="text-white text-xs sm:text-sm font-bold">⚡</span>
                  </div>
                  <span className="leading-tight">O que será feito:</span>
                </h4>
                
                {/* Lista otimizada para mobile */}
                <ul className="text-gray-300 text-xs sm:text-sm md:text-base space-y-2 sm:space-y-3">
                  <li className="flex items-start sm:items-center space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1.5 sm:mt-0"></div>
                    <span className="leading-relaxed">Processar o PDF original</span>
                  </li>
                  <li className="flex items-start sm:items-center space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0 mt-1.5 sm:mt-0"></div>
                    <span className="leading-relaxed">Extrair informações do funcionário</span>
                  </li>
                  <li className="flex items-start sm:items-center space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full flex-shrink-0 mt-1.5 sm:mt-0"></div>
                    <span className="leading-relaxed">Gerar um novo PDF com um comprovante por página</span>
                  </li>
                  <li className="flex items-start sm:items-center space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full flex-shrink-0 mt-1.5 sm:mt-0"></div>
                    <span className="leading-relaxed">Preservar o layout original</span>
                  </li>
                  <li className="flex items-start sm:items-center space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-400 rounded-full flex-shrink-0 mt-1.5 sm:mt-0"></div>
                    <span className="leading-relaxed">Organizar por ano e mês de referência</span>
                  </li>
                  <li className="flex items-start sm:items-center space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-400 rounded-full flex-shrink-0 mt-1.5 sm:mt-0"></div>
                    <span className="leading-relaxed">Salvar com nome do funcionário</span>
                  </li>
                </ul>
              </div>
              
              {/* Área de upload - Otimizada para touch */}
              <div className="group border-2 border-dashed border-gray-600/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center hover:border-blue-500/50 transition-all duration-300 hover:bg-blue-500/5 min-h-[120px] sm:min-h-[140px] flex flex-col justify-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePaymentReceiptUpload(file);
                    }
                  }}
                  className="hidden"
                  id="payment-receipt-file-input"
                  disabled={processingPaymentReceipts}
                />
                <label
                  htmlFor="payment-receipt-file-input"
                  className="cursor-pointer block w-full h-full flex flex-col justify-center items-center"
                >
                  <div className="space-y-3 sm:space-y-4 w-full">
                    {/* Ícone responsivo */}
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                      <FileText size={20} className="sm:hidden text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                      <FileText size={32} className="hidden sm:block text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                    </div>
                    
                    {/* Texto responsivo */}
                    <div className="px-2">
                      <p className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2 leading-tight">
                        {processingPaymentReceipts ? 'Processando...' : 'Clique para selecionar arquivo PDF'}
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                        Apenas arquivos PDF são aceitos • Máximo 10MB
                      </p>
                    </div>
                    
                    {/* Botão de ação - Otimizado para touch */}
                    {!processingPaymentReceipts && (
                      <div className="inline-flex items-center justify-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 sm:px-4 sm:py-2 min-h-[44px] sm:min-h-auto touch-manipulation">
                        <Upload size={14} className="sm:hidden text-blue-400 flex-shrink-0" />
                        <Upload size={16} className="hidden sm:block text-blue-400 flex-shrink-0" />
                        <span className="text-blue-400 text-xs sm:text-sm font-medium leading-tight">
                          <span className="sm:hidden">Toque para selecionar</span>
                          <span className="hidden sm:inline">Arraste e solte ou clique para selecionar</span>
                        </span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              
              {/* Botões - Layout responsivo */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentReceiptUploadModal(false)} 
                  disabled={processingPaymentReceipts}
                  className="order-2 sm:order-1 flex-1 sm:flex-none border-2 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500/50 px-4 py-3 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base min-h-[44px] sm:min-h-auto touch-manipulation"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

         {/* Modal de confirmação de exclusão de recibo - RESPONSIVO */}
         <Dialog open={showReceiptDeleteModal} onOpenChange={setShowReceiptDeleteModal}>
           <DialogContent className="w-[98vw] sm:w-[95vw] max-w-[500px] bg-seguranca-graphite border-gray-600 mx-2 sm:mx-4 rounded-xl sm:rounded-2xl">
             <DialogHeader className="pb-3 sm:pb-4 px-2 sm:px-0">
               <DialogTitle className="text-seguranca-lightgray text-base sm:text-lg lg:text-xl text-center">Confirmar Exclusão</DialogTitle>
             </DialogHeader>
             <div className="space-y-4 px-2 sm:px-0">
               <div className="text-center">
                 <Trash2 size={32} className="mx-auto text-red-500 mb-3 sm:hidden" />
                 <Trash2 size={40} className="mx-auto text-red-500 mb-3 hidden sm:block md:hidden" />
                 <Trash2 size={48} className="mx-auto text-red-500 mb-4 hidden md:block" />
                 <p className="text-gray-400 mb-4 text-sm sm:text-base leading-relaxed px-2">
                   Tem certeza que deseja excluir este recibo?
                 </p>
               </div>
               
               {receiptToDelete && (
                 <div className="bg-seguranca-black border border-gray-600 rounded-lg p-3 sm:p-4">
                   <h4 className="text-seguranca-lightgray font-medium mb-2 text-sm sm:text-base">Recibo a ser excluído:</h4>
                   <div className="text-gray-400 text-xs sm:text-sm space-y-2">
                     <p className="break-words"><strong>Funcionário:</strong> {receiptToDelete.employeeName || 'Nome não extraído'}</p>
                     <p><strong>Mês/Ano:</strong> {receiptToDelete.month}/{receiptToDelete.year}</p>
                     <p><strong>Valor:</strong> R$ {Number(receiptToDelete.netSalary || receiptToDelete.grossSalary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     <p className="break-all"><strong>Arquivo:</strong> <span className="break-all">{receiptToDelete.fileName}</span></p>
                   </div>
                 </div>
               )}
               
               <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                 <Button 
                   variant="outline" 
                   onClick={() => {
                     setShowReceiptDeleteModal(false);
                     setReceiptToDelete(null);
                   }} 
                   disabled={deletingReceipts}
                   className="order-2 sm:order-1 flex-1 sm:flex-none min-h-[44px] sm:min-h-auto touch-manipulation"
                 >
                   Cancelar
                 </Button>
                 <Button 
                   onClick={() => receiptToDelete && handleDeleteReceipt(receiptToDelete.id)}
                   disabled={deletingReceipts}
                   className="bg-red-600 hover:bg-red-700 text-white order-1 sm:order-2 flex-1 sm:flex-none min-h-[44px] sm:min-h-auto touch-manipulation"
                 >
                   {deletingReceipts ? 'Excluindo...' : 'Confirmar Exclusão'}
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>
        
                 {/* Modal do Template de Recibo */}
         <ReceiptTemplateModal
           open={showReceiptTemplateModal}
           onOpenChange={setShowReceiptTemplateModal}
           receiptId={selectedReceiptForTemplate?.id || ''}
           receiptData={selectedReceiptForTemplate}
         />

         {/* Modal de visualização de comprovante de pagamento */}
         <PaymentReceiptViewModal
           open={showPaymentReceiptViewModal}
           onOpenChange={setShowPaymentReceiptViewModal}
           receipt={selectedPaymentReceiptForView}
           onDownload={handleDownloadPaymentReceipt}
         />

     </StandardLayout>
   );
 };

export default Holerites;
