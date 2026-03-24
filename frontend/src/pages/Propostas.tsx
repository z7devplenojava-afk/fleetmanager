import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { proposalService, Proposal, CreateProposalRequest, UpdateProposalRequest } from '@/services/proposalService';
import { clientService, Client } from '@/services/clientService';
import leadService from '@/services/leadService';
import { ClientFormModal } from '@/components/clientes/ClientFormModal';
import PropostaAcordo from '@/components/comercial/PropostaAcordo';
import { AgreementProposalsList } from '@/components/comercial/AgreementProposalsList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Plus as PlusIcon, Link as LinkIcon } from 'lucide-react';

const Propostas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateProposalRequest & { clientId?: number | string; leadId?: number | string }>({
    title: '',
    clientId: undefined,
    leadId: undefined,
    totalValue: 0,
    validUntil: undefined,
    description: '',
    status: 'DRAFT'
  });

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
      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="lista">Propostas Comerciais</TabsTrigger>
          <TabsTrigger value="acordo">Proposta de Acordo</TabsTrigger>
        </TabsList>
        <TabsContent value="lista">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-seguranca-lightgray">Propostas</h1>
                <p className="text-gray-400 mt-1">Gestão de propostas comerciais</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  className="bg-seguranca-red hover:bg-seguranca-darkred"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Proposta
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search" className="text-seguranca-lightgray">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Título, número ou cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="DRAFT">Rascunho</SelectItem>
                        <SelectItem value="SENT">Enviada</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Em Análise</SelectItem>
                        <SelectItem value="APPROVED">Aprovada</SelectItem>
                        <SelectItem value="REJECTED">Rejeitada</SelectItem>
                        <SelectItem value="EXPIRED">Expirada</SelectItem>
                        <SelectItem value="CONVERTED">Convertida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="client" className="text-seguranca-lightgray">Cliente</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Todos os clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os clientes</SelectItem>
                        {getUniqueClients().map(client => (
                          <SelectItem key={client} value={client}>{client}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setClientFilter('all');
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total de Propostas</p>
                      <p className="text-2xl font-bold text-seguranca-lightgray">{proposals.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-seguranca-red" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Em Análise</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {proposals.filter(p => p.status === 'UNDER_REVIEW').length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Aprovadas</p>
                      <p className="text-2xl font-bold text-green-500">
                        {proposals.filter(p => p.status === 'APPROVED').length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Valor Total</p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatCurrency(proposals.reduce((sum, proposal) => sum + proposal.totalValue, 0))}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Propostas */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Lista de Propostas</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
                  </div>
                ) : filteredProposals.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhuma proposta encontrada.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-seguranca-lightgray">Número</TableHead>
                          <TableHead className="text-seguranca-lightgray">Título</TableHead>
                          <TableHead className="text-seguranca-lightgray">Cliente</TableHead>
                          <TableHead className="text-seguranca-lightgray">Status</TableHead>
                          <TableHead className="text-seguranca-lightgray">Valor</TableHead>
                          <TableHead className="text-seguranca-lightgray">Válida Até</TableHead>
                          <TableHead className="text-seguranca-lightgray">Responsável</TableHead>
                          <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProposals.map((proposal) => (
                          <TableRow key={proposal.id} className="border-gray-600">
                            <TableCell className="text-seguranca-lightgray font-medium">
                              {proposal.proposalNumber || '-'}
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              <div>
                                <div className="font-medium">{proposal.title}</div>
                                <div className="text-sm text-gray-400">{proposal.description || ''}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              <div>
                                <div className="font-medium">{proposal.clientName}</div>
                                {proposal.leadName && (
                                  <div className="text-sm text-gray-400">Lead: {proposal.leadName}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                            <TableCell className="text-seguranca-lightgray font-medium">
                              {proposal.totalValue ? formatCurrency(proposal.totalValue) : '-'}
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              {proposal.validUntil ? formatDate(proposal.validUntil) : '-'}
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              {proposal.assignedToName}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                                  onClick={() => {
                                    setSelectedProposal(proposal);
                                    setIsViewModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                                  onClick={() => handleEdit(proposal)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-seguranca-black border-gray-600 text-red-400 hover:text-red-300"
                                  onClick={() => handleDeleteProposal(proposal.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal de Visualização */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-seguranca-lightgray">Detalhes da Proposta</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Visualize os detalhes completos da proposta selecionada
                  </DialogDescription>
                </DialogHeader>
                {selectedProposal && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400">Número da Proposta</Label>
                        <p className="text-seguranca-lightgray font-medium">{selectedProposal.proposalNumber}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedProposal.status)}</div>
                      </div>
                      <div>
                        <Label className="text-gray-400">Título</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.title}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Cliente</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.clientName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Lead</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.leadName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Valor Total</Label>
                        <p className="text-seguranca-lightgray font-medium">
                          {formatCurrency(selectedProposal.totalValue)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Válida Até</Label>
                        <p className="text-seguranca-lightgray">{formatDate(selectedProposal.validUntil)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Responsável</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.assignedToName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Criado Por</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.createdByName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Data de Criação</Label>
                        <p className="text-seguranca-lightgray">{formatDate(selectedProposal.createdAt)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Última Atualização</Label>
                        <p className="text-seguranca-lightgray">{formatDate(selectedProposal.updatedAt)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-gray-400">Descrição</Label>
                      <p className="text-seguranca-lightgray mt-1">{selectedProposal.description}</p>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                        onClick={() => setIsViewModalOpen(false)}
                      >
                        Fechar
                      </Button>
                      <Button 
                        className="bg-seguranca-red hover:bg-seguranca-darkred"
                        onClick={() => {
                          if (selectedProposal) {
                            setIsViewModalOpen(false);
                            handleEdit(selectedProposal);
                          }
                        }}
                      >
                        Editar Proposta
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Modal de Criação */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-seguranca-lightgray">Nova Proposta</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Preencha os dados para criar uma nova proposta comercial
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-seguranca-lightgray">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                        placeholder="Título da proposta"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client" className="text-seguranca-lightgray">Cliente *</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Select
                            value={formData.clientId ? String(formData.clientId) : ''}
                            onValueChange={(value) => {
                              console.log('🔵 Cliente selecionado:', value);
                              setFormData({ ...formData, clientId: value ? (isNaN(Number(value)) ? value : Number(value)) : undefined });
                            }}
                            disabled={loadingClients}
                          >
                            <SelectTrigger 
                              className="bg-seguranca-black border-gray-600 text-white [&>span[data-placeholder]]:text-gray-400 [&>span[data-placeholder]]:opacity-70"
                            >
                              <SelectValue 
                                placeholder={loadingClients ? "Carregando clientes..." : clients.length === 0 ? "Nenhum cliente cadastrado" : "Selecione o cliente"}
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                              {loadingClients ? (
                                <SelectItem value="loading" disabled className="text-gray-400">
                                  Carregando clientes...
                                </SelectItem>
                              ) : clients.length === 0 ? (
                                <SelectItem value="no-clients" disabled className="text-gray-400">
                                  Nenhum cliente encontrado
                                </SelectItem>
                              ) : (
                                clients.map((client) => (
                                  <SelectItem 
                                    key={client.id} 
                                    value={String(client.id)}
                                    className="text-seguranca-lightgray hover:bg-seguranca-red/20 focus:bg-seguranca-black focus:text-seguranca-lightgray"
                                  >
                                    {client.name} {client.cnpj ? `- ${client.cnpj}` : ''}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsClientModalOpen(true)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-yellow hover:text-yellow-400 hover:border-yellow-400 shrink-0"
                          title="Criar novo cliente"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      {clients.length === 0 && !loadingClients && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <span>Nenhum cliente cadastrado.</span>
                          <button
                            type="button"
                            onClick={() => setIsClientModalOpen(true)}
                            className="text-seguranca-yellow hover:text-yellow-400 underline"
                          >
                            Clique aqui para criar um novo cliente
                          </button>
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lead" className="text-seguranca-lightgray">Lead</Label>
                      <Select
                        value={formData.leadId ? String(formData.leadId) : '__NONE__'}
                        onValueChange={(value) => {
                          console.log('🔵 Lead selecionado:', value);
                          setFormData({ ...formData, leadId: value === '__NONE__' ? undefined : (isNaN(Number(value)) ? value : Number(value)) });
                        }}
                        disabled={loadingLeads}
                      >
                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray [&>span[data-placeholder]]:text-gray-400 [&>span:not([data-placeholder])]:text-seguranca-lightgray">
                          <SelectValue placeholder={loadingLeads ? "Carregando leads..." : "Selecione o lead (opcional)"} />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                          <SelectItem value="__NONE__" className="text-seguranca-lightgray hover:bg-seguranca-red/20 focus:bg-seguranca-black focus:text-seguranca-lightgray">Nenhum</SelectItem>
                          {loadingLeads ? (
                            <SelectItem value="loading" disabled className="text-gray-400">
                              Carregando leads...
                            </SelectItem>
                          ) : leads.length === 0 ? (
                            <SelectItem value="no-leads" disabled className="text-gray-400">
                              Nenhum lead encontrado
                            </SelectItem>
                          ) : (
                            leads.map((lead) => (
                              <SelectItem 
                                key={lead.id} 
                                value={String(lead.id)}
                                className="text-seguranca-lightgray hover:bg-seguranca-red/20 focus:bg-seguranca-black focus:text-seguranca-lightgray"
                              >
                                {lead.name} {lead.company ? `- ${lead.company}` : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="totalValue" className="text-seguranca-lightgray">Valor Total *</Label>
                      <Input
                        id="totalValue"
                        type="number"
                        step="0.01"
                        value={formData.totalValue || ''}
                        onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="validUntil" className="text-seguranca-lightgray">Válida Até</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={formData.validUntil || ''}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
                      <Select
                        value={formData.status || 'DRAFT'}
                        onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                      >
                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray [&>span[data-placeholder]]:text-gray-400 [&>span:not([data-placeholder])]:text-seguranca-lightgray">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="DRAFT" className="text-seguranca-lightgray focus:bg-seguranca-black focus:text-seguranca-lightgray">Rascunho</SelectItem>
                          <SelectItem value="SENT" className="text-seguranca-lightgray focus:bg-seguranca-black focus:text-seguranca-lightgray">Enviada</SelectItem>
                          <SelectItem value="UNDER_REVIEW" className="text-seguranca-lightgray focus:bg-seguranca-black focus:text-seguranca-lightgray">Em Análise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-seguranca-lightgray">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Descrição detalhada da proposta..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      className="bg-seguranca-red hover:bg-seguranca-darkred"
                      onClick={handleCreateProposal}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Proposta'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal de Edição */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-seguranca-lightgray">Editar Proposta</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Atualize os dados da proposta comercial
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-title" className="text-seguranca-lightgray">Título *</Label>
                      <Input
                        id="edit-title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                        placeholder="Título da proposta"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-client" className="text-seguranca-lightgray">Cliente</Label>
                      <Select
                        value={formData.clientId ? String(formData.clientId) : ''}
                        onValueChange={(value) => {
                          setFormData({ ...formData, clientId: value ? (isNaN(Number(value)) ? value : Number(value)) : undefined });
                        }}
                        disabled={loadingClients}
                      >
                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                          <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione o cliente"} />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                          {clients.map((client) => (
                            <SelectItem 
                              key={client.id} 
                              value={String(client.id)}
                              className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                            >
                              {client.name} {client.cnpj ? `- ${client.cnpj}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-totalValue" className="text-seguranca-lightgray">Valor Total *</Label>
                      <Input
                        id="edit-totalValue"
                        type="number"
                        step="0.01"
                        value={formData.totalValue || ''}
                        onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-validUntil" className="text-seguranca-lightgray">Válida Até</Label>
                      <Input
                        id="edit-validUntil"
                        type="date"
                        value={formData.validUntil || ''}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-status" className="text-seguranca-lightgray">Status</Label>
                      <Select
                        value={formData.status || selectedProposal?.status || 'DRAFT'}
                        onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                      >
                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="DRAFT" className="text-seguranca-lightgray">Rascunho</SelectItem>
                          <SelectItem value="SENT" className="text-seguranca-lightgray">Enviada</SelectItem>
                          <SelectItem value="UNDER_REVIEW" className="text-seguranca-lightgray">Em Análise</SelectItem>
                          <SelectItem value="APPROVED" className="text-seguranca-lightgray">Aprovada</SelectItem>
                          <SelectItem value="REJECTED" className="text-seguranca-lightgray">Rejeitada</SelectItem>
                          <SelectItem value="EXPIRED" className="text-seguranca-lightgray">Expirada</SelectItem>
                          <SelectItem value="CONVERTED" className="text-seguranca-lightgray">Convertida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-description" className="text-seguranca-lightgray">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Descrição detalhada da proposta..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      className="bg-seguranca-red hover:bg-seguranca-darkred"
                      onClick={handleUpdateProposal}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        'Atualizar Proposta'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal de Criação de Cliente */}
            <ClientFormModal
              isOpen={isClientModalOpen}
              onClose={() => setIsClientModalOpen(false)}
              onSuccess={handleClientCreated}
            />
          </div>
        </TabsContent>
        <TabsContent value="acordo">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-seguranca-lightgray">Propostas de Acordo</h1>
                <p className="text-gray-400 mt-1">Simulação e gestão de propostas de acordo comercial</p>
              </div>
            </div>

            {/* Tabs internas para Simulação e Lista */}
            <Tabs defaultValue="simulacao" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="simulacao">Simulação</TabsTrigger>
                <TabsTrigger value="lista">Lista de Propostas de Acordo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="simulacao">
                <PropostaAcordo 
                  onSaveProposal={async (proposalData: any) => {
                    try {
                      // Salvar como proposta no backend
                      const savedProposal = await proposalService.createProposal({
                        title: `Proposta de Acordo - ${new Date().toLocaleDateString('pt-BR')}`,
                        description: proposalData.descricaoServico || 'Proposta de Acordo Comercial',
                        totalValue: proposalData.resultado.valorMensal,
                        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'DRAFT',
                        items: []
                      });
                      toast({
                        title: "Sucesso",
                        description: "Proposta de acordo salva com sucesso!",
                      });
                      // Recarregar lista de propostas
                      await loadProposals();
                    } catch (error: any) {
                      console.error('Erro ao salvar proposta de acordo:', error);
                      toast({
                        title: "Erro",
                        description: error.response?.data?.message || "Não foi possível salvar a proposta de acordo.",
                        variant: "destructive"
                      });
                    }
                  }}
                />
              </TabsContent>
              
              <TabsContent value="lista">
                <AgreementProposalsList />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </StandardLayout>
  );
};

export default Propostas; 