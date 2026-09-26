import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Building2,
  Calendar,
  DollarSign,
  User,
  FileSpreadsheet,
  Lock,
  Calculator,
  BarChart3,
  Mail
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { proposalService, Proposal, CreateProposalRequest, UpdateProposalRequest } from '@/services/proposalService';
import { clientService, Client } from '@/services/clientService';
import leadService from '@/services/leadService';
import ContractGenerationModal from '@/components/comercial/ContractGenerationModal';
import ProposalDocumentModal from '@/components/comercial/ProposalDocumentModal';
import CommercialEmailQuotationsTab from '@/components/comercial/CommercialEmailQuotationsTab';
import { CommercialQuotation } from '@/services/commercialEmailService';
import { ContractRetentionTab } from '@/components/financeiro/ContractRetentionTab';
import CostSimulationTab, { SelectedSimulationFleetItem } from '@/components/financeiro/CostSimulationTab';
import { ProposalFleetItem } from '@/services/proposalService';
import { DrePanel } from '@/components/financeiro/DrePanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Propostas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'precificacao';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  // PRD Módulo 2: geração de minuta contratual a partir da precificação aprovada (M1)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  // PRD Módulo 2: visualização e impressão da proposta comercial oficial em PDF
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentProposal, setDocumentProposal] = useState<Proposal | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateProposalRequest & { clientId?: number | string; leadId?: number | string; costSimulationId?: string }>({
    title: '',
    clientId: undefined,
    leadId: undefined,
    totalValue: 0,
    validUntil: undefined,
    description: '',
    status: 'DRAFT',
    costSimulationId: undefined
  });

  // Handler para gerar proposta a partir de uma simulação de custos do Módulo 1 (individual)
  const handleGenerateProposalFromSimulation = (sim: any) => {
    const desc = [
      `Ficha Paramétrica de Custos (PRD Módulo 1):`,
      `• Categoria do Veículo: ${sim.vehicleCategory || 'Ônibus'}`,
      `• Regime Operacional: ${sim.driverCount || 1} motorista(s) / turno`,
      `• Dias Operacionais: ${sim.operatingDays || 22} dias/mês`,
      `• Franquia Mensal: ${sim.franchiseKm ? sim.franchiseKm.toLocaleString('pt-BR') : 0} km (com 10% técnico vazios/garagem)`,
      `• Valor da Diária: ${sim.dailyRate ? sim.dailyRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}`,
      `• Tarifa KM Excedente: ${sim.excessKmRate ? sim.excessKmRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}/km`,
      `• Cotação Base Diesel: R$ ${sim.dieselPrice || 0}/L`,
      `• Margem de Lucro Alvo: ${sim.profitMarginPct ? (sim.profitMarginPct * 100).toFixed(1) : '10'}%`,
      `• Adicional de Viagem Extra: 15% sobre a diária`
    ].join('\n');

    const totalMonth = (sim.dailyRate || 0) * (sim.operatingDays || 22);

    const generatedProposal: Proposal = {
      id: sim.id,
      proposalNumber: `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Proposta Comercial - ${sim.name || 'Operação de Fretamento'}`,
      clientName: sim.clientName || 'Cliente em Negociação',
      description: desc,
      totalValue: totalMonth,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: 'SENT',
      costSimulation: sim,
    };

    setDocumentProposal(generatedProposal);
    setIsDocumentModalOpen(true);
    toast({
      title: "Proposta Comercial Gerada",
      description: "A proposta comercial oficial foi gerada com sucesso a partir dos parâmetros de precificação.",
    });
  };

  // Handler para gerar proposta consolidada de múltiplos veículos / composição de frota
  const handleGenerateMultiProposal = (items: SelectedSimulationFleetItem[]) => {
    if (!items || items.length === 0) return;

    const totalVehicles = items.reduce((sum, it) => sum + it.quantity, 0);
    const totalDaily = items.reduce((sum, it) => sum + ((it.simulation.dailyRate || 0) * it.quantity), 0);
    const totalMonthly = items.reduce((sum, it) => {
      const days = it.simulation.operatingDays || 22;
      return sum + ((it.simulation.dailyRate || 0) * days * it.quantity);
    }, 0);
    const totalKm = items.reduce((sum, it) => sum + ((it.simulation.franchiseKm || 0) * it.quantity), 0);

    const firstClient = items.find(it => it.simulation.clientName)?.simulation.clientName;

    const desc = [
      `Composição de Frota & Ficha Paramétrica Consolidada (${totalVehicles} veículos):`,
      ...items.map((it, idx) => 
        `Item ${idx + 1}: ${it.quantity}x ${it.simulation.name} (${it.simulation.vehicleCategory || 'Ônibus'}) - Diária Unit: ${it.simulation.dailyRate?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Franquia: ${it.simulation.franchiseKm?.toLocaleString('pt-BR')} km/veíc.`
      ),
      `• Franquia Global Consolidada: ${totalKm.toLocaleString('pt-BR')} km/mês`,
      `• Diária Consolidada da Frota: ${totalDaily.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `• Faturamento Mensal Estimado: ${totalMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `• Adicional de Viagem Extra: 15% sobre a diária respectiva`,
      `• Gatilho do Diesel: Reajuste automático para variações superiores a 5%`
    ].join('\n');

    const fleetItems: ProposalFleetItem[] = items.map(it => ({
      id: it.simulation.id,
      name: it.simulation.name,
      vehicleCategory: it.simulation.vehicleCategory,
      quantity: it.quantity,
      franchiseKm: it.simulation.franchiseKm,
      dailyRate: it.simulation.dailyRate,
      excessKmRate: it.simulation.excessKmRate,
      operatingDays: it.simulation.operatingDays || 22,
      dieselPrice: it.simulation.dieselPrice,
      totalDaily: (it.simulation.dailyRate || 0) * it.quantity,
      totalMonthly: (it.simulation.dailyRate || 0) * (it.simulation.operatingDays || 22) * it.quantity
    }));

    const generatedProposal: Proposal = {
      id: items[0].simulation.id || 'FLEET',
      proposalNumber: `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Proposta Comercial - Composição de Frota (${totalVehicles} Veículos)`,
      clientName: firstClient || 'Cliente em Negociação',
      description: desc,
      totalValue: totalMonthly,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: 'SENT',
      fleetItems: fleetItems,
      costSimulation: items[0].simulation,
    };

    setDocumentProposal(generatedProposal);
    setIsDocumentModalOpen(true);
    toast({
      title: "Proposta de Frota Gerada",
      description: `Proposta comercial com ${totalVehicles} veículo(s) gerada com sucesso.`,
    });
  };

  // Handler para gerar proposta comercial a partir de uma cotação recebida por e-mail
  const handleGenerateProposalFromQuotation = (quotation: CommercialQuotation) => {
    const descParts = [
      `Origem da Solicitação: E-mail Comercial (${quotation.senderEmail})`,
      quotation.senderName ? `Contato: ${quotation.senderName}` : '',
      `Assunto: ${quotation.subject}`,
      quotation.extractedOrigin || quotation.extractedDestination ? `• Rota: ${quotation.extractedOrigin || 'A definir'} ➔ ${quotation.extractedDestination || 'A definir'}` : '',
      quotation.extractedTripDate ? `• Data Ida: ${quotation.extractedTripDate}` : '',
      quotation.extractedReturnDate ? `• Data Retorno: ${quotation.extractedReturnDate}` : '',
      quotation.extractedPassengers ? `• Passageiros: ${quotation.extractedPassengers}` : '',
      quotation.extractedVehicleType ? `• Veículo Sugerido: ${quotation.extractedVehicleType}` : '',
      quotation.attachments && quotation.attachments.length > 0 ? `• Documentos Anexos: ${quotation.attachments.map(a => a.fileName).join(', ')}` : '',
      '',
      '--- Detalhes Extraídos do E-mail ---',
      quotation.bodyText ? quotation.bodyText.substring(0, 1000) : ''
    ].filter(Boolean);

    const generatedProposal: Proposal = {
      id: quotation.id,
      proposalNumber: `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Proposta Comercial - ${quotation.subject || 'Cotação Solicitada'}`,
      clientName: quotation.clientName || quotation.senderName || quotation.senderEmail,
      description: descParts.join('\n'),
      totalValue: 0,
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: 'DRAFT',
    };

    setDocumentProposal(generatedProposal);
    setIsDocumentModalOpen(true);
    toast({
      title: "Proposta Pré-Preenchida da Cotação",
      description: "A proposta comercial foi aberta com os dados extraídos do e-mail para precificação e envio.",
    });
  };

  // Load proposals from backend
  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await proposalService.getAllProposals();
      // Map backend data to frontend format
      const mappedProposals = data.map((proposal: any) => ({
        id: proposal.id,
        title: proposal.title || '',
        proposalNumber: proposal.proposalNumber || '',
        clientName: proposal.client?.name || proposal.clientName || 'N/A',
        leadName: proposal.lead?.name || proposal.leadName || '',
        status: proposal.status || 'DRAFT',
        totalValue: proposal.totalValue ? Number(proposal.totalValue) : 0,
        validUntil: proposal.validUntil ? new Date(proposal.validUntil).toISOString().split('T')[0] : '',
        description: proposal.description || '',
        createdByName: proposal.createdBy?.name || proposal.createdByName || 'N/A',
        assignedToName: proposal.assignedTo?.name || proposal.assignedToName || 'Não atribuído',
        createdAt: proposal.createdAt ? new Date(proposal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        updatedAt: proposal.updatedAt ? new Date(proposal.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
      setProposals(mappedProposals);
      setFilteredProposals(mappedProposals);
    } catch (error: any) {
      console.error('Erro ao carregar propostas:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível carregar as propostas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  // Load clients and leads when create or edit modal opens
  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen) {
      loadClients();
      loadLeads();
    }
  }, [isCreateModalOpen, isEditModalOpen]);

  // Load clients function
  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await clientService.getAllClients();
      console.log('📋 Clientes carregados:', data);
      // Garantir que os dados estão no formato correto
      const normalizedClients = Array.isArray(data) ? data.map((client: any) => ({
        id: client.id || client.uuid || String(client.id),
        name: client.name || client.nome || '',
        cnpj: client.cnpj || ''
      })) : [];
      setClients(normalizedClients);
      console.log('✅ Clientes normalizados:', normalizedClients);
    } catch (error: any) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível carregar os clientes.",
        variant: "destructive"
      });
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  // Load leads function
  const loadLeads = async () => {
    try {
      setLoadingLeads(true);
      const data = await leadService.getAllLeads();
      console.log('📋 Leads carregados:', data);
      // Garantir que os dados estão no formato correto
      const normalizedLeads = Array.isArray(data) ? data.map((lead: any) => ({
        id: lead.id || lead.uuid || String(lead.id),
        name: lead.name || lead.nome || '',
        company: lead.company || lead.empresa || ''
      })) : [];
      setLeads(normalizedLeads);
      console.log('✅ Leads normalizados:', normalizedLeads);
    } catch (error: any) {
      console.error('❌ Erro ao carregar leads:', error);
      // Não mostrar toast para leads, pois é opcional
      setLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Handle client creation success
  const handleClientCreated = async (createdClient?: Client) => {
    await loadClients();
    setIsClientModalOpen(false);
    
    // Se um cliente foi criado, selecioná-lo automaticamente
    if (createdClient && createdClient.id) {
      setFormData({ ...formData, clientId: isNaN(Number(createdClient.id)) ? createdClient.id : Number(createdClient.id) });
      toast({
        title: "Sucesso",
        description: `Cliente "${createdClient.name}" criado e selecionado com sucesso!`,
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso! Agora você pode selecioná-lo.",
      });
    }
  };

  useEffect(() => {
    let filtered = proposals;

    if (searchTerm) {
      filtered = filtered.filter(proposal =>
        proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.proposalNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }

    if (clientFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.clientName === clientFilter);
    }

    setFilteredProposals(filtered);
  }, [proposals, searchTerm, statusFilter, clientFilter]);

  // Handle create proposal
  const handleCreateProposal = async () => {
    try {
      setIsSubmitting(true);
      // Converter IDs para o formato esperado pela API (pode ser string UUID ou number)
      const proposalData: CreateProposalRequest = {
        ...formData,
        clientId: formData.clientId ? (typeof formData.clientId === 'string' ? Number(formData.clientId) || formData.clientId : formData.clientId) : undefined,
        leadId: formData.leadId ? (typeof formData.leadId === 'string' ? Number(formData.leadId) || formData.leadId : formData.leadId) : undefined,
      };
      console.log('📤 Enviando proposta:', proposalData);
      await proposalService.createProposal(proposalData);
      toast({
        title: "Sucesso",
        description: "Proposta criada com sucesso!",
      });
      setIsCreateModalOpen(false);
      resetForm();
      await loadProposals();
    } catch (error: any) {
      console.error('❌ Erro ao criar proposta:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível criar a proposta.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update proposal
  const handleUpdateProposal = async () => {
    if (!selectedProposal || !selectedProposal.id) {
      toast({
        title: "Erro",
        description: "Proposta não selecionada ou ID inválido.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsSubmitting(true);
      
      // Converter clientId e leadId para string (UUID) se necessário
      const clientId = formData.clientId 
        ? (typeof formData.clientId === 'string' ? formData.clientId : String(formData.clientId))
        : undefined;
      
      const leadId = formData.leadId
        ? (typeof formData.leadId === 'string' ? formData.leadId : String(formData.leadId))
        : undefined;
      
      const updateData: UpdateProposalRequest = {
        title: formData.title,
        clientId: clientId,
        leadId: leadId,
        totalValue: formData.totalValue,
        validUntil: formData.validUntil,
        description: formData.description,
        status: formData.status || selectedProposal.status
      };
      
      // Converter ID para string (pode ser UUID ou number)
      const proposalId = typeof selectedProposal.id === 'string' 
        ? selectedProposal.id 
        : String(selectedProposal.id);
      
      console.log('📤 Atualizando proposta:', { id: proposalId, data: updateData });
      await proposalService.updateProposal(proposalId, updateData);
      toast({
        title: "Sucesso",
        description: "Proposta atualizada com sucesso!",
      });
      setIsEditModalOpen(false);
      resetForm();
      await loadProposals();
    } catch (error: any) {
      console.error('Erro ao atualizar proposta:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível atualizar a proposta.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete proposal
  const handleDeleteProposal = async (proposalId: number | string) => {
    if (!confirm('Tem certeza que deseja excluir esta proposta?')) return;
    try {
      // Converter ID para string se necessário
      const id = typeof proposalId === 'string' ? proposalId : String(proposalId);
      await proposalService.deleteProposal(id);
      toast({
        title: "Sucesso",
        description: "Proposta excluída com sucesso!",
      });
      await loadProposals();
    } catch (error: any) {
      console.error('Erro ao excluir proposta:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível excluir a proposta.",
        variant: "destructive"
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      clientId: undefined,
      leadId: undefined,
      totalValue: 0,
      validUntil: undefined,
      description: '',
      status: 'DRAFT'
    });
    setSelectedProposal(null);
  };

  // Open edit modal
  const handleEdit = async (proposal: Proposal) => {
    setSelectedProposal(proposal);
    
    // Carregar clientes e leads se ainda não foram carregados
    if (clients.length === 0) {
      await loadClients();
    }
    if (leads.length === 0) {
      await loadLeads();
    }
    
    // Buscar a proposta completa do backend para ter todos os dados
    try {
      // Converter ID para string se necessário
      const proposalId = typeof proposal.id === 'string' ? proposal.id : String(proposal.id);
      const fullProposal = await proposalService.getProposalById(proposalId);
      
      // Extrair clientId e leadId (pode estar em client.id ou clientId direto)
      const clientId = (fullProposal as any).clientId 
        ? String((fullProposal as any).clientId)
        : (fullProposal.client?.id ? String(fullProposal.client.id) : undefined);
      
      const leadId = (fullProposal as any).leadId
        ? String((fullProposal as any).leadId)
        : (fullProposal.lead?.id ? String(fullProposal.lead.id) : undefined);
      
      setFormData({
        title: fullProposal.title || proposal.title || '',
        clientId: clientId || undefined,
        leadId: leadId || undefined,
        totalValue: fullProposal.totalValue ? Number(fullProposal.totalValue) : proposal.totalValue || 0,
        validUntil: fullProposal.validUntil ? new Date(fullProposal.validUntil).toISOString().split('T')[0] : proposal.validUntil || undefined,
        description: fullProposal.description || proposal.description || '',
        status: fullProposal.status || proposal.status || 'DRAFT'
      });
    } catch (error) {
      // Se falhar, usar os dados que temos
      console.error('Erro ao carregar proposta completa:', error);
      const clientId = (proposal as any).clientId 
        ? String((proposal as any).clientId)
        : (proposal.client?.id ? String(proposal.client.id) : undefined);
      
      const leadId = (proposal as any).leadId
        ? String((proposal as any).leadId)
        : (proposal.lead?.id ? String(proposal.lead.id) : undefined);
      
      setFormData({
        title: proposal.title || '',
        clientId: clientId || undefined,
        leadId: leadId || undefined,
        totalValue: proposal.totalValue || 0,
        validUntil: proposal.validUntil || undefined,
        description: proposal.description || '',
        status: proposal.status || 'DRAFT'
      });
    }
    
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Rascunho', color: 'bg-gray-500' },
      SENT: { label: 'Enviada', color: 'bg-blue-500' },
      UNDER_REVIEW: { label: 'Em Análise', color: 'bg-yellow-500' },
      APPROVED: { label: 'Aprovada', color: 'bg-green-500' },
      REJECTED: { label: 'Rejeitada', color: 'bg-red-500' },
      EXPIRED: { label: 'Expirada', color: 'bg-orange-500' },
      CONVERTED: { label: 'Convertida', color: 'bg-purple-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getUniqueClients = () => {
    return Array.from(new Set(proposals.map(p => p.clientName)));
  };

  return (
    <StandardLayout>
      <ContractGenerationModal
        open={isContractModalOpen}
        onOpenChange={setIsContractModalOpen}
        proposal={
          selectedProposal
            ? {
                id: String(selectedProposal.id),
                title: selectedProposal.title,
                clientId: (selectedProposal.client?.id ?? (selectedProposal as any).clientId) as string | undefined,
                clientName: selectedProposal.clientName,
                totalValue: selectedProposal.totalValue,
              }
            : undefined
        }
      />
      <ProposalDocumentModal
        open={isDocumentModalOpen}
        onOpenChange={setIsDocumentModalOpen}
        proposal={documentProposal}
        onGenerateContract={(p) => {
          setSelectedProposal(p);
          setIsContractModalOpen(true);
        }}
      />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="flex flex-wrap md:flex-nowrap w-full p-1.5 bg-card/80 backdrop-blur-md border border-border/60 rounded-2xl gap-1.5 h-auto shadow-lg">
          <TabsTrigger
            value="precificacao"
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 data-[state='active']:bg-red-600 data-[state='active']:text-white data-[state='active']:shadow-md data-[state='active']:shadow-red-600/20 text-muted-foreground hover:text-foreground hover:bg-accent/50 flex items-center justify-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            <span>Precificação</span>
          </TabsTrigger>
          <TabsTrigger
            value="retencoes"
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 data-[state='active']:bg-red-600 data-[state='active']:text-white data-[state='active']:shadow-md data-[state='active']:shadow-red-600/20 text-muted-foreground hover:text-foreground hover:bg-accent/50 flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4" />
            <span>Retenções</span>
          </TabsTrigger>
          <TabsTrigger
            value="dre"
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 data-[state='active']:bg-red-600 data-[state='active']:text-white data-[state='active']:shadow-md data-[state='active']:shadow-red-600/20 text-muted-foreground hover:text-foreground hover:bg-accent/50 flex items-center justify-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>DRE por Placa</span>
          </TabsTrigger>
          <TabsTrigger
            value="cotacoes-email"
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 data-[state='active']:bg-red-600 data-[state='active']:text-white data-[state='active']:shadow-md data-[state='active']:shadow-red-600/20 text-muted-foreground hover:text-foreground hover:bg-accent/50 flex items-center justify-center gap-2"
          >
            <Mail className="h-4 w-4" />
            <span>Cotações por E-mail</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="precificacao" className="mt-4">
          <CostSimulationTab
            onGenerateProposal={handleGenerateProposalFromSimulation}
            onGenerateMultiProposal={handleGenerateMultiProposal}
          />
        </TabsContent>

        <TabsContent value="retencoes" className="mt-4">
          <ContractRetentionTab />
        </TabsContent>

        <TabsContent value="dre" className="mt-4">
          <DrePanel />
        </TabsContent>

        <TabsContent value="cotacoes-email" className="mt-4">
          <CommercialEmailQuotationsTab
            onGenerateProposalFromQuotation={handleGenerateProposalFromQuotation}
          />
        </TabsContent>
      </Tabs>
    </StandardLayout>
  );
};

export default Propostas; 