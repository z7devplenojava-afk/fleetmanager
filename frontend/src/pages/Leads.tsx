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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/services/notificationService';
import leadService, { Lead, CreateLeadRequest, UpdateLeadRequest } from '@/services/leadService';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  Loader2,
  User,
  FileText,
  Briefcase,
  Tag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Leads = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateLeadRequest>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: 'WEBSITE',
    status: 'NEW',
    description: '',
    nextFollowUp: undefined,
    estimatedValue: undefined
  });

  // Load leads from backend
  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await leadService.getAllLeads();
      console.log('📥 Leads received from backend:', data);

      // Map backend data to frontend format
      const mappedLeads = data.map((lead: any) => {
        return {
          id: lead.id,
          name: lead.name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          mobile: lead.mobile || '',
          company: lead.company || '',
          position: lead.position || '',
          status: lead.status || 'NEW',
          source: lead.source || 'OTHER',
          estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : 0,
          notes: lead.notes || lead.description || '',
          description: lead.description || lead.notes || '',
          nextFollowUp: lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().split('T')[0] : '',
          createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });
      setLeads(mappedLeads);
      setFilteredLeads(mappedLeads);
    } catch (error: any) {
      console.error('Error loading leads:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível carregar os leads.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  // Handle create lead
  const handleCreateLead = async () => {
    try {
      setIsSubmitting(true);

      // Preparar dados de criação, convertendo nextFollowUp se necessário
      const createData: CreateLeadRequest = {
        ...formData
      };

      // Converter nextFollowUp para formato ISO com hora se necessário
      if (createData.nextFollowUp && createData.nextFollowUp.length === 10) {
        createData.nextFollowUp = `${createData.nextFollowUp}T00:00:00`;
      }

      await leadService.createLead(createData);
      toast({
        title: "Sucesso",
        description: "Lead criado com sucesso!",
      });
      setIsCreateModalOpen(false);
      resetForm();
      await loadLeads();
    } catch (error: any) {
      console.error('Erro ao criar lead:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível criar o lead.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update lead
  const handleUpdateLead = async () => {
    if (!selectedLead || !selectedLead.id) {
      toast({
        title: "Erro",
        description: "Lead não selecionado ou ID inválido.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsSubmitting(true);

      // Preparar dados de atualização
      // IMPORTANTE: Sempre enviar o status do formData (que foi carregado do lead ou alterado pelo usuário)
      // O status deve ser sempre enviado para garantir que seja atualizado
      const statusToSend = formData.status || selectedLead?.status || 'NEW';
      
      const updateData: UpdateLeadRequest = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        position: formData.position || undefined,
        source: formData.source,
        description: formData.description || undefined,
        // SEMPRE enviar o status - usar o valor do formData que foi carregado corretamente no handleEdit
        status: statusToSend,
        estimatedValue: formData.estimatedValue || undefined
      };

      console.log('📤 Enviando updateData:', {
        ...updateData,
        status: updateData.status,
        statusFromFormData: formData.status,
        statusFromSelectedLead: selectedLead?.status
      });

      // Adicionar nextFollowUp apenas se tiver valor, convertendo para formato ISO com hora
      if (formData.nextFollowUp) {
        // Se for apenas data (YYYY-MM-DD), adicionar hora 00:00:00 para LocalDateTime
        const nextFollowUpStr = formData.nextFollowUp;
        if (nextFollowUpStr.length === 10) {
          // Formato apenas data, adicionar hora
          updateData.nextFollowUp = `${nextFollowUpStr}T00:00:00`;
        } else {
          updateData.nextFollowUp = nextFollowUpStr;
        }
      }

      const leadId = typeof selectedLead.id === 'string' ? selectedLead.id : String(selectedLead.id);

      console.log('📤 Atualizando lead:', {
        id: leadId,
        data: updateData
      });

      const updatedLead = await leadService.updateLead(leadId, updateData);
      console.log('✅ Lead atualizado:', updatedLead);
      toast({
        title: "Sucesso",
        description: "Lead atualizado com sucesso!",
      });
      setIsEditModalOpen(false);
      resetForm();
      await loadLeads();
    } catch (error: any) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível atualizar o lead.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete lead
  const handleDeleteLead = async (leadId: string | number) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    try {
      await leadService.deleteLead(leadId);
      toast({
        title: "Sucesso",
        description: "Lead excluído com sucesso!",
      });
      await loadLeads();
    } catch (error: any) {
      console.error('Erro ao excluir lead:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível excluir o lead.",
        variant: "destructive"
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      source: 'WEBSITE',
      status: 'NEW',
      description: '',
      nextFollowUp: undefined,
      estimatedValue: undefined
    });
    setSelectedLead(null);
  };

  // Open edit modal
  const handleEdit = async (lead: Lead) => {
    setSelectedLead(lead);

    // Buscar lead completo do backend para ter nextFollowUp
    try {
      const leadId = typeof lead.id === 'string' ? lead.id : String(lead.id);
      const fullLead = await leadService.getLeadById(leadId);

      const nextFollowUp = (fullLead as any).nextFollowUp
        ? new Date((fullLead as any).nextFollowUp).toISOString().split('T')[0]
        : (lead.nextFollowUp || undefined);

      setFormData({
        name: fullLead.name || lead.name || '',
        email: fullLead.email || lead.email || '',
        phone: fullLead.phone || lead.phone || '',
        company: fullLead.company || lead.company || '',
        position: fullLead.position || lead.position || '',
        source: fullLead.source || lead.source || 'WEBSITE',
        status: fullLead.status || lead.status || 'NEW',
        description: fullLead.description || fullLead.notes || lead.description || lead.notes || '',
        nextFollowUp: nextFollowUp,
        estimatedValue: fullLead.estimatedValue !== undefined ? Number(fullLead.estimatedValue) : (lead.estimatedValue !== undefined ? lead.estimatedValue : undefined)
      });
    } catch (error) {
      // Se falhar, usar os dados que temos
      console.error('Erro ao carregar lead completo:', error);

      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        position: lead.position || '',
        source: lead.source || 'WEBSITE',
        status: lead.status || 'NEW',
        description: lead.description || '',
        nextFollowUp: lead.nextFollowUp || undefined,
        estimatedValue: lead.estimatedValue || 0
      });
    }

    setIsEditModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      NEW: { label: 'Novo', color: 'bg-blue-500' },
      CONTACTED: { label: 'Contactado', color: 'bg-yellow-500' },
      QUALIFIED: { label: 'Qualificado', color: 'bg-green-500' },
      PROPOSAL_SENT: { label: 'Proposta Enviada', color: 'bg-purple-500' },
      NEGOTIATION: { label: 'Em Negociação', color: 'bg-orange-500' },
      WON: { label: 'Ganho', color: 'bg-green-600' },
      LOST: { label: 'Perdido', color: 'bg-red-500' },
      INACTIVE: { label: 'Inativo', color: 'bg-gray-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NEW;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      WEBSITE: { label: 'Website', color: 'bg-blue-100 text-blue-800' },
      REFERRAL: { label: 'Indicação', color: 'bg-green-100 text-green-800' },
      COLD_CALL: { label: 'Ligação a Frio', color: 'bg-yellow-100 text-yellow-800' },
      EMAIL_MARKETING: { label: 'Email Marketing', color: 'bg-purple-100 text-purple-800' },
      SOCIAL_MEDIA: { label: 'Redes Sociais', color: 'bg-pink-100 text-pink-800' },
      GOOGLE_ADS: { label: 'Google Ads', color: 'bg-red-100 text-red-800' },
      EVENT: { label: 'Evento', color: 'bg-indigo-100 text-indigo-800' },
      PARTNER: { label: 'Parceiro', color: 'bg-teal-100 text-teal-800' },
      OTHER: { label: 'Outro', color: 'bg-gray-100 text-gray-800' }
    };

    const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.OTHER;
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

  return (
    <StandardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Leads</h1>
            <p className="text-gray-400 mt-1">Gestão de leads e oportunidades comerciais</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="bg-seguranca-red hover:bg-seguranca-darkred"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
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
                    placeholder="Nome, empresa ou email..."
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
                    <SelectItem value="NEW">Novo</SelectItem>
                    <SelectItem value="CONTACTED">Contactado</SelectItem>
                    <SelectItem value="QUALIFIED">Qualificado</SelectItem>
                    <SelectItem value="PROPOSAL_SENT">Proposta Enviada</SelectItem>
                    <SelectItem value="NEGOTIATION">Em Negociação</SelectItem>
                    <SelectItem value="WON">Ganho</SelectItem>
                    <SelectItem value="LOST">Perdido</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="source" className="text-seguranca-lightgray">Fonte</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todas as fontes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as fontes</SelectItem>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                    <SelectItem value="REFERRAL">Indicação</SelectItem>
                    <SelectItem value="COLD_CALL">Ligação a Frio</SelectItem>
                    <SelectItem value="EMAIL_MARKETING">Email Marketing</SelectItem>
                    <SelectItem value="SOCIAL_MEDIA">Redes Sociais</SelectItem>
                    <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                    <SelectItem value="EVENT">Evento</SelectItem>
                    <SelectItem value="PARTNER">Parceiro</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
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
                    setSourceFilter('all');
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
                  <p className="text-gray-400 text-sm">Total de Leads</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{leads.length}</p>
                </div>
                <Users className="h-8 w-8 text-seguranca-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Novos</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {leads.filter(l => l.status === 'NEW').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">N</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Em Negociação</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {leads.filter(l => l.status === 'NEGOTIATION').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">N</span>
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
                    {formatCurrency(leads.reduce((sum, lead) => sum + lead.estimatedValue, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Leads */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">Lista de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhum lead encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-600">
                      <TableHead className="text-seguranca-lightgray">Nome</TableHead>
                      <TableHead className="text-seguranca-lightgray">Empresa</TableHead>
                      <TableHead className="text-seguranca-lightgray">Status</TableHead>
                      <TableHead className="text-seguranca-lightgray">Fonte</TableHead>
                      <TableHead className="text-seguranca-lightgray">Valor Estimado</TableHead>
                      <TableHead className="text-seguranca-lightgray">Próximo Follow-up</TableHead>
                      <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="border-gray-600">
                        <TableCell className="text-seguranca-lightgray">
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-gray-400">{lead.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-seguranca-lightgray">
                          <div>
                            <div className="font-medium">{lead.company || '-'}</div>
                            <div className="text-sm text-gray-400">{lead.position || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell>{getSourceBadge(lead.source)}</TableCell>
                        <TableCell className="text-seguranca-lightgray">
                          {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '-'}
                        </TableCell>
                        <TableCell className="text-seguranca-lightgray">
                          {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsViewModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                              onClick={() => handleEdit(lead)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-seguranca-black border-gray-600 text-red-400 hover:text-red-300"
                              onClick={() => handleDeleteLead(lead.id)}
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
              <DialogTitle className="text-seguranca-lightgray">Detalhes do Lead</DialogTitle>
              <DialogDescription className="text-gray-400">
                Visualize todas as informações do lead selecionado
              </DialogDescription>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Nome</Label>
                    <p className="text-seguranca-lightgray font-medium">{selectedLead.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Email</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Telefone</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.phone}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Celular</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.mobile}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Empresa</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.company}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Cargo</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.position}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Fonte</Label>
                    <div className="mt-1">{getSourceBadge(selectedLead.source)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Valor Estimado</Label>
                    <p className="text-seguranca-lightgray font-medium">
                      {formatCurrency(selectedLead.estimatedValue)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Próximo Follow-up</Label>
                    <p className="text-seguranca-lightgray">{formatDate(selectedLead.nextFollowUp)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Data de Criação</Label>
                    <p className="text-seguranca-lightgray">{formatDate(selectedLead.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-400">Observações</Label>
                  <p className="text-seguranca-lightgray mt-1">{selectedLead.notes}</p>
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
                      setIsViewModalOpen(false);
                      handleEdit(selectedLead);
                    }}
                  >
                    Editar Lead
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
            <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Edit className="h-6 w-6" />
                </div>
                Editar Lead
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm">
                Atualize as informações do lead
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Seção: Informações Básicas */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <User className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name" className="text-seguranca-lightgray font-medium">
                        Nome <span className="text-seguranca-red">*</span>
                      </Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email" className="text-seguranca-lightgray font-medium">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <Input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-company" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Empresa
                      </Label>
                      <Input
                        id="edit-company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-position" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Cargo
                      </Label>
                      <Input
                        id="edit-position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="Cargo/função"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Status e Classificação */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <Tag className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Status e Classificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-source" className="text-seguranca-lightgray font-medium">
                        Fonte <span className="text-seguranca-red">*</span>
                      </Label>
                      <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                          <SelectValue placeholder="Selecione a fonte" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="WEBSITE" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Website</SelectItem>
                          <SelectItem value="REFERRAL" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Indicação</SelectItem>
                          <SelectItem value="COLD_CALL" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Ligação a Frio</SelectItem>
                          <SelectItem value="SOCIAL_MEDIA" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Redes Sociais</SelectItem>
                          <SelectItem value="EVENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Evento</SelectItem>
                          <SelectItem value="OTHER" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-status" className="text-seguranca-lightgray font-medium">Status</Label>
                      <Select
                        value={formData.status || 'NEW'}
                        onValueChange={(value) => {
                          console.log('🔄 Mudando status:', { value, currentValue: formData.status });
                          setFormData({ ...formData, status: value });
                        }}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="NEW" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Novo</SelectItem>
                          <SelectItem value="CONTACTED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Contactado</SelectItem>
                          <SelectItem value="QUALIFIED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Qualificado</SelectItem>
                          <SelectItem value="PROPOSAL_SENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Proposta Enviada</SelectItem>
                          <SelectItem value="NEGOTIATION" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Em Negociação</SelectItem>
                          <SelectItem value="WON" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Ganho</SelectItem>
                          <SelectItem value="LOST" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Perdido</SelectItem>
                          <SelectItem value="INACTIVE" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Valores e Datas */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Valores e Datas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-estimatedValue" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Valor Estimado
                      </Label>
                      <Input
                        id="edit-estimatedValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.estimatedValue || ''}
                        onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value ? Number(e.target.value) : 0 })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-nextFollowUp" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Próximo Follow-up
                      </Label>
                      <Input
                        id="edit-nextFollowUp"
                        type="date"
                        value={formData.nextFollowUp || ''}
                        onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value || undefined })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Observações */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <FileText className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Observações Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="text-seguranca-lightgray font-medium">
                      Descrição
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px]"
                      placeholder="Informações adicionais sobre o lead..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateLead}
                  disabled={isSubmitting || !formData.name}
                  className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Lead'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Criação */}
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
            <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Plus className="h-6 w-6" />
                </div>
                Novo Lead
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm">
                Preencha as informações para criar um novo lead
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Seção: Informações Básicas */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <User className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-seguranca-lightgray font-medium">
                        Nome <span className="text-seguranca-red">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-seguranca-lightgray font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Empresa
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Cargo
                      </Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="Cargo/função"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Status e Classificação */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <Tag className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Status e Classificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source" className="text-seguranca-lightgray font-medium">
                        Fonte <span className="text-seguranca-red">*</span>
                      </Label>
                      <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                          <SelectValue placeholder="Selecione a fonte" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="WEBSITE" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Website</SelectItem>
                          <SelectItem value="REFERRAL" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Indicação</SelectItem>
                          <SelectItem value="COLD_CALL" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Ligação a Frio</SelectItem>
                          <SelectItem value="SOCIAL_MEDIA" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Redes Sociais</SelectItem>
                          <SelectItem value="EVENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Evento</SelectItem>
                          <SelectItem value="OTHER" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-seguranca-lightgray font-medium">Status</Label>
                      <Select
                        value={formData.status || 'NEW'}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="NEW" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Novo</SelectItem>
                          <SelectItem value="CONTACTED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Contactado</SelectItem>
                          <SelectItem value="QUALIFIED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Qualificado</SelectItem>
                          <SelectItem value="PROPOSAL_SENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Proposta Enviada</SelectItem>
                          <SelectItem value="NEGOTIATION" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Em Negociação</SelectItem>
                          <SelectItem value="WON" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Ganho</SelectItem>
                          <SelectItem value="LOST" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Perdido</SelectItem>
                          <SelectItem value="INACTIVE" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Valores e Datas */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Valores e Datas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedValue" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Valor Estimado
                      </Label>
                      <Input
                        id="estimatedValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.estimatedValue || ''}
                        onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value ? Number(e.target.value) : 0 })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nextFollowUp" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Próximo Follow-up
                      </Label>
                      <Input
                        id="nextFollowUp"
                        type="date"
                        value={formData.nextFollowUp || ''}
                        onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value || undefined })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Observações */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <FileText className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Observações Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-seguranca-lightgray font-medium">
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px]"
                      placeholder="Informações adicionais sobre o lead..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateLead}
                  disabled={isSubmitting || !formData.name}
                  className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Lead'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default Leads; 