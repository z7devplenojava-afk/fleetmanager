import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Calculator,
  DollarSign,
  Calendar,
  Building2,
  Zap,
  RefreshCw,
  Bug,
  Download,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { measurementService } from '@/services/measurementService';
import { MeasurementBulletin, MeasurementStatus } from '@/types/measurement';
import { MeasurementBulletinModal } from './MeasurementBulletinModal';
import { MeasurementViewModal } from './MeasurementViewModal';
import { MeasurementDeleteDialog } from './MeasurementDeleteDialog';
import { MeasurementValidationModal } from './MeasurementValidationModal';
import { BulkDeleteDialog } from './BulkDeleteDialog';
import { ContractMeasurementPdfService } from '@/services/contractMeasurementPdfService';
import { contasAReceberService } from '@/services/contasAReceberService';
import api from '@/lib/axios';

interface MeasurementCompleteTableProps {
  onView?: (bulletin: MeasurementBulletin) => void;
  onEdit?: (bulletin: MeasurementBulletin) => void;
  onDelete?: (bulletin: MeasurementBulletin) => void;
  onCreate?: () => void;
  onValidate?: (bulletin: MeasurementBulletin) => void;
}

export default function MeasurementCompleteTable({
  onView,
  onEdit,
  onDelete,
  onCreate,
  onValidate
}: MeasurementCompleteTableProps) {
  const { toast } = useToast();
  const [bulletins, setBulletins] = useState<MeasurementBulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MeasurementStatus | 'all'>('all');
  const [contractFilter, setContractFilter] = useState<string>('all');
  
  // Estados para seleção múltipla
  const [selectedBulletins, setSelectedBulletins] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Estados dos modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<MeasurementBulletin | null>(null);

  // Carregar boletins (API + Medições Geradas por Contrato)
  const loadBulletins = async () => {
    try {
      setLoading(true);
      const data = await measurementService.getBulletins().catch(() => []);
      const apiList = Array.isArray(data) ? data : [];

      let localList: any[] = [];
      try {
        const raw = localStorage.getItem('fluxbus_generated_measurements_v1');
        if (raw) {
          localList = JSON.parse(raw);
        }
      } catch {
        localList = [];
      }

      const apiIds = new Set(apiList.map((b: any) => String(b.id)));
      const convertedLocal: MeasurementBulletin[] = (Array.isArray(localList) ? localList : [])
        .filter((m: any) => !apiIds.has(String(m.id)))
        .map((m: any) => {
          const grandTotal = Number(m.totals?.grandTotal || m.invoice?.grossValue || 0);
          const leasedItems = (m.leasedVehicles || []).map((v: any, idx: number) => ({
            id: v.id || `lv-${idx}`,
            description: v.description || `Locação Veículo ${v.plate}`,
            unit: 'MÊS',
            quantity: 1,
            unitPrice: Number(v.periodValue ?? v.totalPeriod ?? v.monthlyRate ?? 0),
            totalValue: Number(v.periodValue ?? v.totalPeriod ?? v.monthlyRate ?? 0),
          }));
          const extraItems = (m.extraTrips || []).map((et: any, idx: number) => ({
            id: et.id || `et-${idx}`,
            description: `Viagem Extra (${et.plate}): ${et.route}`,
            unit: 'VIAGEM',
            quantity: 1,
            unitPrice: Number(et.tripCost ?? et.total ?? 0),
            totalValue: Number(et.tripCost ?? et.total ?? 0),
          }));
          const items = [...leasedItems, ...extraItems];
          if (items.length === 0) {
            items.push({
              id: `it-${m.id}`,
              description: `Locação de Frota / Contrato ${m.contractNumber}`,
              unit: 'MÊS',
              quantity: 1,
              unitPrice: grandTotal,
              totalValue: grandTotal,
            });
          }

          return {
            id: String(m.id),
            measurementNumber: Number(m.measurementNumber || 1),
            contractNumber: m.contractNumber || 'CT-LOCACAO',
            companyName: m.clientName || 'Cliente Contrato',
            clientName: m.clientName || 'Cliente Contrato',
            periodStart: m.periodStart,
            periodEnd: m.periodEnd,
            elaboratedBy: m.elaboratedBy || 'José Ramos',
            validatedBy: m.validatedBy || 'Diretoria Financeira',
            status: (m.status === 'VALIDATED' ? 'VALIDATED' : 'PENDING') as MeasurementStatus,
            notes: `Medição completa de locação de veículos (${(m.leasedVehicles || []).map((v: any) => v.plate).join(', ') || 'Frota'})`,
            items: items as any,
            subtotal: grandTotal,
            taxes: 0,
            totalValue: grandTotal,
            createdAt: m.createdAt || new Date().toISOString(),
            updatedAt: m.createdAt || new Date().toISOString(),
          } as unknown as MeasurementBulletin;
        });

      setBulletins([...convertedLocal, ...apiList]);
    } catch (error) {
      console.error('❌ Erro ao carregar boletins:', error);
      setBulletins([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para testar a API (usa axios com token do interceptor)
  const testAPI = async () => {
    try {
      console.log('🧪 Testando conectividade com API de medições...');
      const response = await api.get('/measurements');
      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Headers da resposta:', response.headers);
      const data = response.data;
      console.log('✅ API funcionando! Dados recebidos:', data);
      toast({
        title: "API OK!",
        description: `Endpoint funcionando. ${Array.isArray(data?.content) ? data.content.length : Array.isArray(data) ? data.length : 0} registros encontrados.`,
        variant: "default"
      });
    } catch (error: any) {
      const status = error?.response?.status;
      const details = error?.response?.data ? JSON.stringify(error.response.data) : String(error);
      console.error('❌ API retornou erro:', status, details);
      toast({
        title: "Erro na API",
        description: `Status ${status || 'desconhecido'}: ${details}`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadBulletins();
    const handleSync = () => loadBulletins();
    window.addEventListener('fluxbus:measurements-updated', handleSync);
    window.addEventListener('fluxbus:measurement-generated', handleSync);
    return () => {
      window.removeEventListener('fluxbus:measurements-updated', handleSync);
      window.removeEventListener('fluxbus:measurement-generated', handleSync);
    };
  }, []);

  // Função helper para determinar se uma medição é completa
  const isCompleteMeasurement = (bulletin: MeasurementBulletin): boolean => {
    // Priorizar notas explícitas
    const hasCompleteNote = bulletin.notes?.toLowerCase().includes('completa') || 
                          bulletin.notes?.toLowerCase().includes('detalhada');
    if (hasCompleteNote) return true;
    
    // Se tiver nota de simplificada, não é completa
    const hasSimplifiedNote = bulletin.notes?.toLowerCase().includes('simplificada') || 
                             bulletin.notes?.toLowerCase().includes('rápida');
    if (hasSimplifiedNote) return false;
    
    // Medição completa: múltiplos itens OU valor alto
    const hasMultipleItems = bulletin.items && bulletin.items.length > 1;
    const totalValue = bulletin.items?.reduce((sum, item) => {
      const itemValue = item.totalValue || ((item.quantity || 0) * (item.unitPrice || 0));
      return sum + itemValue;
    }, 0) || 0;
    const hasHighValue = totalValue > 10000;
    
    return hasMultipleItems || hasHighValue;
  };

  // Filtrar boletins - apenas medições completas
  const filteredBulletins = Array.isArray(bulletins) ? bulletins.filter(bulletin => {
    // Filtrar apenas medições completas
    const matchesType = isCompleteMeasurement(bulletin);
    
    const matchesSearch = 
      bulletin.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bulletin.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bulletin.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || bulletin.status === statusFilter;
    const matchesContract = contractFilter === 'all' || bulletin.contractNumber === contractFilter;

    return matchesType && matchesSearch && matchesStatus && matchesContract;
  }) : [];

  // Obter contratos únicos para filtro
  const uniqueContracts = Array.isArray(bulletins) 
    ? Array.from(new Set(bulletins.map(b => b.contractNumber))).filter(Boolean)
    : [];

  // Funções para seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredBulletins.map(bulletin => bulletin.id));
      setSelectedBulletins(allIds);
      setIsAllSelected(true);
    } else {
      setSelectedBulletins(new Set());
      setIsAllSelected(false);
    }
  };

  const handleSelectBulletin = (bulletinId: string, checked: boolean) => {
    const newSelected = new Set(selectedBulletins);
    if (checked) {
      newSelected.add(bulletinId);
    } else {
      newSelected.delete(bulletinId);
    }
    setSelectedBulletins(newSelected);
    
    // Verificar se todos estão selecionados
    setIsAllSelected(newSelected.size === filteredBulletins.length && filteredBulletins.length > 0);
  };

  const handleBulkDelete = () => {
    if (selectedBulletins.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setLoading(true);
      const deletePromises = Array.from(selectedBulletins).map(id => 
        measurementService.deleteBulletin(id)
      );
      
      await Promise.all(deletePromises);
      
      toast({
        title: "Sucesso",
        description: `${selectedBulletins.size} boletim(ns) excluído(s) com sucesso.`,
        variant: "default"
      });
      
      // Limpar seleção e recarregar dados
      setSelectedBulletins(new Set());
      setIsAllSelected(false);
      setShowBulkDeleteDialog(false);
      loadBulletins();
      
    } catch (error) {
      console.error('Erro ao excluir boletins:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir alguns boletins. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowEditModal(true);
  };

  const handleView = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowViewModal(true);
  };

  const handleDelete = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowDeleteDialog(true);
  };

  const handleValidate = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowValidationModal(true);
  };

  const handleSuccess = () => {
    loadBulletins();
    setShowCreateModal(false);
    setShowEditModal(false);
  };

  const handleDeleteSuccess = () => {
    loadBulletins();
    setShowDeleteDialog(false);
    setSelectedBulletin(null);
  };

  const handleValidationSuccess = () => {
    loadBulletins();
    setShowValidationModal(false);
    setSelectedBulletin(null);
  };

  const buildLocalPdfExcelPayload = (bulletin: MeasurementBulletin) => {
    let rawMed: any = null;
    try {
      const raw = localStorage.getItem('fluxbus_generated_measurements_v1');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          rawMed = list.find((m: any) => String(m.id) === String(bulletin.id) || m.contractNumber === bulletin.contractNumber);
        }
      }
    } catch {
      rawMed = null;
    }

    const totalVal = Number(
      rawMed?.totals?.grandTotal ||
      bulletin.totalValue ||
      bulletin.items?.reduce((s, i) => s + Number(i.totalValue || Number(i.quantity || 1) * Number(i.unitPrice || 0)), 0) ||
      0
    );

    return {
      client: {
        id: String(rawMed?.clientId || bulletin.id),
        clientName: rawMed?.clientName || bulletin.companyName || bulletin.clientName || 'Cliente Contratante',
        cnpj: rawMed?.cnpj || '00.000.000/0001-00',
        contractNumber: rawMed?.contractNumber || bulletin.contractNumber || 'CT-LOCACAO',
        measurementNumber: String(rawMed?.measurementNumber || bulletin.measurementNumber || '001'),
        periodStart: rawMed?.periodStart || bulletin.periodStart,
        periodEnd: rawMed?.periodEnd || bulletin.periodEnd,
        dueDate: rawMed?.dueDate || rawMed?.periodEnd || bulletin.periodEnd,
        leasedVehicles: Array.isArray(rawMed?.leasedVehicles) && rawMed.leasedVehicles.length > 0
          ? rawMed.leasedVehicles.map((v: any, idx: number) => ({
              id: v.id || `lv-${idx}`,
              plate: v.plate || 'FROTA',
              description: v.description || 'Locação de Veículo',
              route: v.route || '-',
              workingDays: Number(v.workingDays || 30),
              stoppedDays: Number(v.stoppedDays || 0),
              monthlyRate: Number(v.monthlyRate || v.periodValue || 0),
              dailyRate: Number(v.dailyRate || 0),
              periodValue: Number(v.periodValue ?? v.totalPeriod ?? 0),
              observations: v.observations || '',
            }))
          : (bulletin.items || []).map((it: any, idx: number) => ({
              id: `lv-${idx}`,
              plate: 'FROTA',
              description: it.description || 'Locação de Veículo',
              route: bulletin.contractNumber || '-',
              workingDays: 30,
              stoppedDays: 0,
              monthlyRate: Number(it.totalValue || Number(it.quantity || 1) * Number(it.unitPrice || 0)),
              dailyRate: Number(it.unitPrice || 0) / 30,
              periodValue: Number(it.totalValue || Number(it.quantity || 1) * Number(it.unitPrice || 0)),
              observations: '',
            })),
        extraTrips: [],
        excessKmItems: [],
        deductions: [],
        invoice: {
          nfNumber: rawMed?.invoice?.nfNumber || 'A EMITIR',
          nfIssueDate: rawMed?.invoice?.nfIssueDate || bulletin.periodEnd,
          nfDueDate: rawMed?.dueDate || bulletin.periodEnd,
          grossValue: totalVal,
          retentionISS: Number(rawMed?.invoice?.retentionISS || 0),
          retentionINSS: Number(rawMed?.invoice?.retentionINSS || 0),
          retentionIR: Number(rawMed?.invoice?.retentionIR || 0),
          retentionPIS: Number(rawMed?.invoice?.retentionPIS || 0),
          retentionCOFINS: Number(rawMed?.invoice?.retentionCOFINS || 0),
          retentionCSLL: Number(rawMed?.invoice?.retentionCSLL || 0),
          netValue: Number(rawMed?.invoice?.netValue || totalVal),
          verificationCode: rawMed?.invoice?.verificationCode || '-',
          observations: rawMed?.invoice?.observations || bulletin.notes || 'Fatura de Serviços de Alocação de Veículos',
        },
      },
      extraTrips: rawMed?.extraTrips || [],
      excessKmItems: rawMed?.excessKmItems || [],
      deductions: rawMed?.deductions || [],
      partesDiarias: rawMed?.partesDiarias || [],
      totals: rawMed?.totals || {
        leasedTotal: totalVal,
        extraTripsTotal: 0,
        excessKmTotal: 0,
        deductionsTotal: 0,
        grandTotal: totalVal,
      },
      statusLabel: bulletin.status === 'VALIDATED' ? 'REVISADA / LIBERADA' : 'EM ANÁLISE',
      elaboratedBy: rawMed?.elaboratedBy || bulletin.elaboratedBy || 'José Ramos',
      validatedBy: rawMed?.validatedBy || bulletin.validatedBy || 'Diretoria Financeira',
    };
  };

  // Funções de exportação
  const handleExportPDF = async (bulletin: MeasurementBulletin) => {
    try {
      ContractMeasurementPdfService.generateMeasurementPDF(buildLocalPdfExcelPayload(bulletin));
      toast({
        title: "PDF p/ Faturamento & NF Gerado!",
        description: `Espelho de medição e faturamento (${bulletin.companyName || bulletin.clientName}) aberto para impressão/PDF.`,
      });
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: `Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async (bulletin: MeasurementBulletin) => {
    try {
      ContractMeasurementPdfService.generateMeasurementExcel(buildLocalPdfExcelPayload(bulletin));
      toast({
        title: "Planilha Excel (.xlsx) p/ Faturamento Gerada!",
        description: "Arquivo Excel completo com aba de Faturamento & NFS-e exportado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar Excel. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleBulkExportPDF = async () => {
    try {
      const selectedBulletinIds = Array.from(selectedBulletins);
      const blob = await measurementService.generateBulkBulletinsPDF(selectedBulletinIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `boletins_medicao_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "PDF com múltiplos boletins gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF em lote:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF em lote. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleBulkExportExcel = async () => {
    try {
      const selectedBulletinIds = Array.from(selectedBulletins);
      const blob = await measurementService.generateBulkBulletinsExcel(selectedBulletinIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `boletins_medicao_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Excel com múltiplos boletins gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar Excel em lote:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar Excel em lote. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  // Obter propriedades do status
  const getStatusProps = (status: MeasurementStatus) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Rascunho', variant: 'secondary', icon: FileText };
      case 'PENDING':
        return { label: 'Pendente', variant: 'default', icon: AlertCircle };
      case 'VALIDATED':
        return { label: 'Validado', variant: 'default', icon: CheckCircle };
      case 'CANCELLED':
        return { label: 'Cancelado', variant: 'destructive', icon: AlertCircle };
      default:
        return { label: status, variant: 'outline', icon: AlertCircle };
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar período
  const formatPeriod = (start: string, end: string) => {
    if (!start || !end) return '-';
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`;
  };

  if (loading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="flex justify-center items-center py-8">
          <div className="text-seguranca-lightgray">Carregando boletins de medição...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray text-xl flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Boletins de Medição Completa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Buscar por contrato, empresa ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MeasurementStatus | 'all')}>
              <SelectTrigger className="w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-black border-gray-600">
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="DRAFT">Rascunho</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="VALIDATED">Validado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger className="w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Filtrar por contrato" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-black border-gray-600">
                <SelectItem value="all">Todos os Contratos</SelectItem>
                {uniqueContracts.map(contract => (
                  <SelectItem key={contract} value={contract}>
                    {contract}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Medição
            </Button>
            <Button
              onClick={loadBulletins}
              variant="outline"
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
            <Button
              onClick={testAPI}
              variant="outline"
              className="border-orange-600 text-orange-400 hover:bg-orange-600/20"
            >
              <Bug className="h-4 w-4 mr-2" />
              Testar API
            </Button>
            {selectedBulletins.size > 0 && (
              <>
                <Button
                  onClick={() => handleBulkDelete()}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Selecionados ({selectedBulletins.size})
                </Button>
                <Button
                  onClick={handleBulkExportPDF}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600/20"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF ({selectedBulletins.size})
                </Button>
                <Button
                  onClick={handleBulkExportExcel}
                  variant="outline"
                  className="border-green-600 text-green-400 hover:bg-green-600/20"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel ({selectedBulletins.size})
                </Button>
              </>
            )}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-600">
            <div className="text-center p-3 bg-seguranca-black rounded border border-gray-700">
              <div className="text-2xl font-bold text-seguranca-yellow">{Array.isArray(bulletins) ? bulletins.length : 0}</div>
              <div className="text-sm text-gray-400">Total de Boletins</div>
            </div>
            <div className="text-center p-3 bg-seguranca-black rounded border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">
                {Array.isArray(bulletins) ? bulletins.filter(b => b.status === 'PENDING').length : 0}
              </div>
              <div className="text-sm text-gray-400">Pendentes</div>
            </div>
            <div className="text-center p-3 bg-seguranca-black rounded border border-gray-700">
              <div className="text-2xl font-bold text-green-400">
                {Array.isArray(bulletins) ? bulletins.filter(b => b.status === 'VALIDATED').length : 0}
              </div>
              <div className="text-sm text-gray-400">Validados</div>
            </div>
            <div className="text-center p-3 bg-seguranca-black rounded border border-gray-700">
              <div className="text-2xl font-bold text-seguranca-yellow">
                {formatCurrency(Array.isArray(bulletins) ? bulletins.reduce((total, b) => total + (b.subtotal || 0), 0) : 0)}
              </div>
              <div className="text-sm text-gray-400">Valor Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de boletins */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-0">
          {filteredBulletins.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm || statusFilter !== 'all' || contractFilter !== 'all' 
                ? 'Nenhum boletim encontrado com os filtros aplicados.'
                : 'Nenhum boletim de medição cadastrado ainda.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600 bg-seguranca-black">
                    <th className="text-center py-3 px-4 font-medium text-seguranca-lightgray w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Contrato</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Período</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-seguranca-lightgray">NF</th>
                    <th className="text-center py-3 px-4 font-medium text-seguranca-lightgray">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBulletins.map((bulletin) => {
                    const statusProps = getStatusProps(bulletin.status);
                    const StatusIcon = statusProps.icon;
                    
                    return (
                      <tr key={bulletin.id} className="border-b border-gray-700 hover:bg-seguranca-black/50">
                        <td className="py-3 px-4 text-center">
                          <Checkbox
                            checked={selectedBulletins.has(bulletin.id)}
                            onCheckedChange={(checked) => handleSelectBulletin(bulletin.id, checked as boolean)}
                            className="data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-lightgray font-medium">
                            {bulletin.contractNumber}
                          </div>
                          <div className="text-sm text-gray-400">
                            {bulletin.contractDescription || bulletin.contract?.description || 'Sem descrição'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-lightgray">
                            {bulletin.clientName || bulletin.client?.name || 'Cliente não definido'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {bulletin.unitName || bulletin.unit?.name || 'Unidade não definida'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-lightgray">
                            {formatPeriod(bulletin.periodStart, bulletin.periodEnd)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-yellow font-bold">
                            {formatCurrency(bulletin.subtotal || 0)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {bulletin.items?.length || 0} itens
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusProps.variant as any} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusProps.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-seguranca-lightgray">
                            {bulletin.nfNumber || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(bulletin)}
                              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(bulletin)}
                              className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportPDF(bulletin)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              title="Exportar PDF"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportExcel(bulletin)}
                              className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                              title="Exportar Excel"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            {bulletin.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleValidate(bulletin)}
                                className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(bulletin)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <MeasurementBulletinModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleSuccess}
      />

      <MeasurementBulletinModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        bulletin={selectedBulletin || undefined}
        onSuccess={handleSuccess}
      />

      {selectedBulletin && (
        <>
          <MeasurementViewModal
            open={showViewModal}
            onOpenChange={setShowViewModal}
            bulletin={selectedBulletin}
          />

          <MeasurementDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            bulletin={selectedBulletin}
            onSuccess={handleDeleteSuccess}
          />

          <MeasurementValidationModal
            open={showValidationModal}
            onOpenChange={setShowValidationModal}
            bulletin={selectedBulletin}
            onSuccess={handleValidationSuccess}
          />
        </>
      )}

      {/* Modal de exclusão em massa */}
      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={confirmBulkDelete}
        itemCount={selectedBulletins.size}
        itemType="boletim"
        loading={loading}
      />
    </div>
  );
} 