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
  Calculator, 
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
  FileText,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { quoteService, Quote, CreateQuoteRequest, UpdateQuoteRequest } from '@/services/quoteService';
import { clientService, Client } from '@/services/clientService';
import leadService from '@/services/leadService';
import { ClientFormModal } from '@/components/clientes/ClientFormModal';
import { Loader2, Plus as PlusIcon } from 'lucide-react';

interface QuoteExtended extends Quote {
  quoteNumber?: string;
  estimatedDuration?: string;
  paymentTerms?: string;
}

const Orcamentos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<QuoteExtended[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<QuoteExtended[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateQuoteRequest & { status?: string }>({
    title: '',
    clientId: '',
    leadId: undefined,
    totalValue: 0,
    validUntil: '',
    description: '',
    estimatedDuration: undefined,
    paymentTerms: '',
    notes: '',
    status: 'DRAFT'
  });

  // Load quotes from backend
  const loadQuotes = async () => {
    try {
      setLoading(true);
      const data = await quoteService.getAllQuotes();
      // Map backend data to frontend format
      const mappedQuotes = data.map((quote: any) => {
        // Log para debug
        if (quote.id) {
          console.log(`🔍 Mapping quote ${quote.id}:`, {
            client: quote.client,
            clientId: quote.clientId,
            lead: quote.lead,
            leadId: quote.leadId,
            fullQuote: quote
          });
        }
        
        // Extrair clientId de diferentes formatos possíveis
        let clientId = '';
        if (quote.client?.id) {
          clientId = String(quote.client.id);
        } else if (quote.clientId) {
          clientId = String(quote.clientId);
        }
        
        // Extrair leadId de diferentes formatos possíveis
        let leadId: string | undefined = undefined;
        if (quote.lead?.id) {
          leadId = String(quote.lead.id);
        } else if (quote.leadId) {
          leadId = String(quote.leadId);
        }
        
        // Se leadId for uma string vazia, definir como undefined
        if (leadId === '' || leadId === 'undefined' || leadId === 'null') {
          leadId = undefined;
        }
        
        const mapped = {
          id: quote.id,
          title: quote.title || '',
          quoteNumber: quote.quoteNumber || `ORC-${quote.id}`,
          clientId: clientId,
          clientName: quote.client?.name || quote.clientName || 'N/A',
          leadId: leadId,
          leadName: quote.lead?.name || quote.leadName || '',
          status: quote.status || 'DRAFT',
          totalValue: quote.totalValue ? Number(quote.totalValue) : 0,
          validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '',
          description: quote.description || '',
          createdByName: quote.createdBy?.name || quote.createdByName || 'N/A',
          assignedToName: quote.assignedTo?.name || quote.assignedToName || 'Não atribuído',
          createdAt: quote.createdAt ? new Date(quote.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          updatedAt: quote.updatedAt ? new Date(quote.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          estimatedDuration: quote.estimatedDuration || '',
          paymentTerms: quote.paymentTerms || quote.terms || '',
          notes: quote.notes || ''
        };
        
        console.log(`✅ Mapped quote ${quote.id}:`, {
          clientId: mapped.clientId,
          leadId: mapped.leadId,
          clientName: mapped.clientName,
          leadName: mapped.leadName
        });
        
        return mapped;
      });
      setQuotes(mappedQuotes);
      setFilteredQuotes(mappedQuotes);
    } catch (error: any) {
      console.error('Erro ao carregar orçamentos:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível carregar os orçamentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  // Load clients and leads when create modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      loadClients();
      loadLeads();
    }
  }, [isCreateModalOpen]);

  // Load clients and leads when edit modal opens
  useEffect(() => {
    if (isEditModalOpen) {
      loadClients();
      loadLeads();
      console.log('🔍 Edit modal opened - FormData:', formData);
      console.log('🔍 Edit modal opened - SelectedQuote:', selectedQuote);
    }
  }, [isEditModalOpen]);

  // Load clients function
  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await clientService.getAllClients();
      setClients(data);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive"
      });
    } finally {
      setLoadingClients(false);
    }
  };

  // Load leads function
  const loadLeads = async () => {
    try {
      setLoadingLeads(true);
      const data = await leadService.getAllLeads();
      console.log('✅ Leads carregados:', data);
      setLeads(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Erro ao carregar leads:', error);
      setLeads([]);
      // Não mostrar toast para leads, pois é opcional
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
      setFormData({ ...formData, clientId: Number(createdClient.id) });
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
    let filtered = quotes;

    if (searchTerm) {
      filtered = filtered.filter(quote =>
        quote.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    if (clientFilter !== 'all') {
      filtered = filtered.filter(quote => quote.clientName === clientFilter);
    }

    setFilteredQuotes(filtered);
  }, [quotes, searchTerm, statusFilter, clientFilter]);

  // Handle create quote
  const handleCreateQuote = async () => {
    // Validação básica
    if (!formData.title || formData.title.trim() === '') {
      toast({
        title: "Erro",
        description: "O título é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.clientId || formData.clientId === '' || formData.clientId === 0) {
      toast({
        title: "Erro",
        description: "O cliente é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.totalValue || formData.totalValue <= 0) {
      toast({
        title: "Erro",
        description: "O valor total deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Converter clientId e leadId para string (UUID) se necessário
      const quoteData: CreateQuoteRequest = {
        ...formData,
        clientId: String(formData.clientId),
        leadId: formData.leadId ? String(formData.leadId) : undefined
      };
      await quoteService.createQuote(quoteData);
      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso!",
      });
      setIsCreateModalOpen(false);
      resetForm();
      await loadQuotes();
    } catch (error: any) {
      console.error('Erro ao criar orçamento:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível criar o orçamento.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update quote
  const handleUpdateQuote = async () => {
    if (!selectedQuote) return;
    try {
      setIsSubmitting(true);
      // Converter clientId e leadId para string (UUID) se necessário
      const updateData: UpdateQuoteRequest = {
        ...formData,
        clientId: String(formData.clientId),
        leadId: formData.leadId ? String(formData.leadId) : undefined,
        status: formData.status || selectedQuote.status
      };
      await quoteService.updateQuote(String(selectedQuote.id), updateData);
      toast({
        title: "Sucesso",
        description: "Orçamento atualizado com sucesso!",
      });
      setIsEditModalOpen(false);
      resetForm();
      await loadQuotes();
    } catch (error: any) {
      console.error('Erro ao atualizar orçamento:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível atualizar o orçamento.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete quote
  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;
    try {
      await quoteService.deleteQuote(quoteId);
      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso!",
      });
      await loadQuotes();
    } catch (error: any) {
      console.error('Erro ao excluir orçamento:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível excluir o orçamento.",
        variant: "destructive"
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      clientId: '',
      leadId: undefined,
      totalValue: 0,
      validUntil: '',
      description: '',
      estimatedDuration: undefined,
      paymentTerms: '',
      notes: '',
      status: 'DRAFT'
    });
    setSelectedQuote(null);
  };

  // Open edit modal
  const handleEdit = (quote: QuoteExtended) => {
    console.log('🔍 handleEdit - Quote data:', quote);
    console.log('🔍 handleEdit - clientId:', quote.clientId);
    console.log('🔍 handleEdit - leadId:', quote.leadId);
    console.log('🔍 handleEdit - Full quote object:', JSON.stringify(quote, null, 2));

    setSelectedQuote(quote);

    // Extrair clientId - tentar diferentes formatos possíveis
    let clientIdValue = '';
    if (quote.clientId) {
      clientIdValue = String(quote.clientId).trim();
    } else if ((quote as any).client?.id) {
      clientIdValue = String((quote as any).client.id).trim();
    } else if ((quote as any).clientId) {
      clientIdValue = String((quote as any).clientId).trim();
    }

    // Extrair leadId - tentar diferentes formatos possíveis
    let leadIdValue: string | undefined = undefined;
    if (quote.leadId) {
      const leadIdStr = String(quote.leadId).trim();
      if (leadIdStr && leadIdStr !== '' && leadIdStr !== 'undefined' && leadIdStr !== 'null') {
        leadIdValue = leadIdStr;
      }
    } else if ((quote as any).lead?.id) {
      const leadIdStr = String((quote as any).lead.id).trim();
      if (leadIdStr && leadIdStr !== '' && leadIdStr !== 'undefined' && leadIdStr !== 'null') {
        leadIdValue = leadIdStr;
      }
    } else if ((quote as any).leadId) {
      const leadIdStr = String((quote as any).leadId).trim();
      if (leadIdStr && leadIdStr !== '' && leadIdStr !== 'undefined' && leadIdStr !== 'null') {
        leadIdValue = leadIdStr;
      }
    }

    console.log('🔍 handleEdit - Extracted clientId:', clientIdValue, 'type:', typeof clientIdValue);
    console.log('🔍 handleEdit - Extracted leadId:', leadIdValue, 'type:', typeof leadIdValue);

    const newFormData = {
      title: quote.title || '',
      clientId: clientIdValue,
      leadId: leadIdValue,
      totalValue: quote.totalValue || 0,
      validUntil: quote.validUntil || '',
      description: quote.description || '',
      estimatedDuration: quote.estimatedDuration ? Number(quote.estimatedDuration) : undefined,
      paymentTerms: quote.paymentTerms || '',
      notes: quote.notes || '',
      status: quote.status || 'DRAFT'
    };

    console.log('🔍 handleEdit - Setting FormData:', newFormData);

    setFormData(newFormData);
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Rascunho', color: 'bg-gray-500' },
      SENT: { label: 'Enviado', color: 'bg-blue-500' },
      UNDER_REVIEW: { label: 'Em Análise', color: 'bg-yellow-500' },
      APPROVED: { label: 'Aprovado', color: 'bg-green-500' },
      REJECTED: { label: 'Rejeitado', color: 'bg-red-500' },
      EXPIRED: { label: 'Expirado', color: 'bg-orange-500' },
      CONVERTED: { label: 'Convertido', color: 'bg-purple-500' }
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
    return Array.from(new Set(quotes.map(q => q.clientName)));
  };

  return (
    <StandardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Orçamentos</h1>
            <p className="text-gray-400 mt-1">Gestão de orçamentos comerciais</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              className="bg-seguranca-red hover:bg-seguranca-darkred"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
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
                    <SelectItem value="SENT">Enviado</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Em Análise</SelectItem>
                    <SelectItem value="APPROVED">Aprovado</SelectItem>
                    <SelectItem value="REJECTED">Rejeitado</SelectItem>
                    <SelectItem value="EXPIRED">Expirado</SelectItem>
                    <SelectItem value="CONVERTED">Convertido</SelectItem>
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
                  <p className="text-gray-400 text-sm">Total de Orçamentos</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{quotes.length}</p>
                </div>
                <Calculator className="h-8 w-8 text-seguranca-red" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Em Análise</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {quotes.filter(q => q.status === 'UNDER_REVIEW').length}
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
                  <p className="text-gray-400 text-sm">Aprovados</p>
                  <p className="text-2xl font-bold text-green-500">
                    {quotes.filter(q => q.status === 'APPROVED').length}
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
                    {formatCurrency(quotes.reduce((sum, quote) => sum + quote.totalValue, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Orçamentos */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">Lista de Orçamentos</CardTitle>
          </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
                  </div>
                ) : filteredQuotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum orçamento encontrado.
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
                          <TableHead className="text-seguranca-lightgray">Válido Até</TableHead>
                          <TableHead className="text-seguranca-lightgray">Duração</TableHead>
                          <TableHead className="text-seguranca-lightgray">Responsável</TableHead>
                          <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQuotes.map((quote) => (
                          <TableRow key={quote.id} className="border-gray-600">
                            <TableCell className="text-seguranca-lightgray font-medium">
                              {quote.quoteNumber || '-'}
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              <div>
                                <div className="font-medium">{quote.title}</div>
                                <div className="text-sm text-gray-400">{quote.description || ''}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              <div>
                                <div className="font-medium">{quote.clientName}</div>
                                {quote.leadName && (
                                  <div className="text-sm text-gray-400">Lead: {quote.leadName}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(quote.status)}</TableCell>
                            <TableCell className="text-seguranca-lightgray font-medium">
                              {quote.totalValue ? formatCurrency(quote.totalValue) : '-'}
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              {quote.validUntil ? formatDate(quote.validUntil) : '-'}
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              {quote.estimatedDuration ? (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {quote.estimatedDuration}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              {quote.assignedToName}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                                  onClick={() => {
                                    setSelectedQuote(quote);
                                    setIsViewModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                                  onClick={() => handleEdit(quote)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-seguranca-black border-gray-600 text-red-400 hover:text-red-300"
                                  onClick={() => handleDeleteQuote(Number(quote.id))}
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
              <DialogTitle className="text-seguranca-lightgray">Detalhes do Orçamento</DialogTitle>
              <DialogDescription className="text-gray-400">
                Visualize os detalhes completos do orçamento selecionado
              </DialogDescription>
            </DialogHeader>
            {selectedQuote && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Número do Orçamento</Label>
                    <p className="text-seguranca-lightgray font-medium">{selectedQuote.quoteNumber}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedQuote.status)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Título</Label>
                    <p className="text-seguranca-lightgray">{selectedQuote.title}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Cliente</Label>
                    <p className="text-seguranca-lightgray">{selectedQuote.clientName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Lead</Label>
                    <p className="text-seguranca-lightgray">{selectedQuote.leadName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Valor Total</Label>
                    <p className="text-seguranca-lightgray font-medium">
                      {formatCurrency(selectedQuote.totalValue)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Válido Até</Label>
                    <p className="text-seguranca-lightgray">{formatDate(selectedQuote.validUntil)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Duração Estimada</Label>
                    <p className="text-seguranca-lightgray">{selectedQuote.estimatedDuration}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Condições de Pagamento</Label>
                    <p className="text-seguranca-lightgray">{selectedQuote.paymentTerms}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Responsável</Label>
                    <p className="text-seguranca-lightgray">{selectedQuote.assignedToName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Criado Por</Label>
                    <p className="text-seguranca-lightgray">{selectedQuote.createdByName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Data de Criação</Label>
                    <p className="text-seguranca-lightgray">{formatDate(selectedQuote.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Última Atualização</Label>
                    <p className="text-seguranca-lightgray">{formatDate(selectedQuote.updatedAt)}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-400">Descrição</Label>
                  <p className="text-seguranca-lightgray mt-1">{selectedQuote.description}</p>
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
                      if (selectedQuote) {
                        handleEdit(selectedQuote);
                        setIsViewModalOpen(false);
                      }
                    }}
                  >
                    Editar Orçamento
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Criação */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calculator className="h-6 w-6" />
                </div>
                Novo Orçamento
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm">
                Preencha os dados para criar um novo orçamento comercial
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Seção: Informações Básicas */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <FileSpreadsheet className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-seguranca-lightgray font-medium">
                        Título <span className="text-seguranca-red">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="Título do orçamento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client" className="text-seguranca-lightgray font-medium">Cliente <span className="text-seguranca-red">*</span></Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select
                            value={formData.clientId && formData.clientId !== '' && formData.clientId !== 0 ? String(formData.clientId) : ''}
                            onValueChange={(value) => {
                              setFormData({ ...formData, clientId: value });
                            }}
                            disabled={loadingClients}
                          >
                            <SelectTrigger 
                              className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400"
                            >
                              <SelectValue 
                                placeholder={loadingClients ? "Carregando clientes..." : clients.length === 0 ? "Nenhum cliente cadastrado" : "Selecione o cliente"}
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
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
                                    className="text-seguranca-lightgray hover:bg-seguranca-red/20 focus:bg-seguranca-red/20"
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
                          className="bg-seguranca-graphite border-gray-600 text-seguranca-yellow hover:text-yellow-400 hover:border-yellow-400 shrink-0 h-11"
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
                    <div className="space-y-2">
                      <Label htmlFor="lead" className="text-seguranca-lightgray font-medium">Lead</Label>
                      <Select
                        value={formData.leadId ? String(formData.leadId) : '__NONE__'}
                        onValueChange={(value) => {
                          console.log('🔍 Lead selecionado:', value);
                          if (value === '__NONE__') {
                            setFormData({ ...formData, leadId: undefined });
                          } else {
                            setFormData({ ...formData, leadId: value });
                          }
                        }}
                        disabled={loadingLeads}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400">
                          <SelectValue placeholder={loadingLeads ? "Carregando leads..." : "Selecione o lead (opcional)"} />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px] z-[100]">
                          <SelectItem 
                            value="__NONE__" 
                            className="text-seguranca-lightgray hover:bg-seguranca-red/20 focus:bg-seguranca-red/20 cursor-pointer"
                          >
                            Nenhum
                          </SelectItem>
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
                                className="text-seguranca-lightgray hover:bg-seguranca-red/20 focus:bg-seguranca-red/20 cursor-pointer"
                              >
                                {lead.name} {lead.company ? `- ${lead.company}` : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Valores e Prazos */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Valores e Prazos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalValue" className="text-seguranca-lightgray font-medium">
                        Valor Total <span className="text-seguranca-red">*</span>
                      </Label>
                      <Input
                        id="totalValue"
                        type="number"
                        step="0.01"
                        value={formData.totalValue || ''}
                        onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validUntil" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Válido Até
                      </Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={formData.validUntil || ''}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Duração Estimada
                      </Label>
                      <Select
                        value={formData.estimatedDuration ? String(formData.estimatedDuration) : ''}
                        onValueChange={(value) => setFormData({ ...formData, estimatedDuration: value ? Number(value) : undefined })}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="180" className="text-seguranca-lightgray hover:bg-seguranca-red/20">6 meses</SelectItem>
                          <SelectItem value="365" className="text-seguranca-lightgray hover:bg-seguranca-red/20">12 meses</SelectItem>
                          <SelectItem value="730" className="text-seguranca-lightgray hover:bg-seguranca-red/20">24 meses</SelectItem>
                          <SelectItem value="1095" className="text-seguranca-lightgray hover:bg-seguranca-red/20">36 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentTerms" className="text-seguranca-lightgray font-medium">Condições de Pagamento</Label>
                      <Select
                        value={formData.paymentTerms || ''}
                        onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400">
                          <SelectValue placeholder="Selecione as condições" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="avista" className="text-seguranca-lightgray hover:bg-seguranca-red/20">À vista</SelectItem>
                          <SelectItem value="mensal" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Mensal</SelectItem>
                          <SelectItem value="30-60-90" className="text-seguranca-lightgray hover:bg-seguranca-red/20">30/60/90 dias</SelectItem>
                          <SelectItem value="personalizado" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-seguranca-lightgray font-medium">Status</Label>
                      <Select
                        value={formData.status || 'DRAFT'}
                        onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="DRAFT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Rascunho</SelectItem>
                          <SelectItem value="SENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Enviado</SelectItem>
                          <SelectItem value="UNDER_REVIEW" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Em Análise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Descrição */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <FileText className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Descrição
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-seguranca-lightgray font-medium">Descrição Detalhada</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow"
                      placeholder="Descrição detalhada do orçamento..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
              
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
                  onClick={handleCreateQuote}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Orçamento'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Edit className="h-6 w-6" />
                </div>
                Editar Orçamento
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm">
                Atualize os dados do orçamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Seção: Informações Básicas */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <FileSpreadsheet className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title" className="text-seguranca-lightgray font-medium">
                        Título <span className="text-seguranca-red">*</span>
                      </Label>
                      <Input
                        id="edit-title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="Título do orçamento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-client" className="text-seguranca-lightgray font-medium">Cliente <span className="text-seguranca-red">*</span></Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select
                            value={formData.clientId && formData.clientId !== '' && formData.clientId !== 0 ? String(formData.clientId) : ''}
                            onValueChange={(value) => {
                              console.log('🔍 Edit modal - Client selected:', value);
                              setFormData({ ...formData, clientId: value });
                            }}
                            disabled={loadingClients}
                          >
                            <SelectTrigger 
                              className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400"
                            >
                              <SelectValue 
                                placeholder={loadingClients ? "Carregando clientes..." : clients.length === 0 ? "Nenhum cliente cadastrado" : "Selecione o cliente"}
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
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
                                    className="text-seguranca-lightgray hover:bg-seguranca-red/20 focus:bg-seguranca-red/20"
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
                          className="bg-seguranca-graphite border-gray-600 text-seguranca-yellow hover:text-yellow-400 hover:border-yellow-400 shrink-0 h-11"
                          title="Criar novo cliente"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lead" className="text-seguranca-lightgray font-medium">Lead</Label>
                      <Select
                        value={formData.leadId ? String(formData.leadId) : '__NONE__'}
                        onValueChange={(value) => {
                          console.log('🔍 Edit modal - Lead selected:', value);
                          if (value === '__NONE__') {
                            setFormData({ ...formData, leadId: undefined });
                          } else {
                            setFormData({ ...formData, leadId: value });
                          }
                        }}
                        disabled={loadingLeads}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400">
                          <SelectValue placeholder={loadingLeads ? "Carregando leads..." : "Selecione o lead (opcional)"} />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px] z-[100]">
                          <SelectItem 
                            value="__NONE__" 
                            className="text-seguranca-lightgray hover:bg-seguranca-red/20 focus:bg-seguranca-red/20 cursor-pointer"
                          >
                            Nenhum
                          </SelectItem>
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
                                className="text-seguranca-lightgray hover:bg-seguranca-red/20 focus:bg-seguranca-red/20 cursor-pointer"
                              >
                                {lead.name} {lead.company ? `- ${lead.company}` : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Valores e Prazos */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Valores e Prazos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-totalValue" className="text-seguranca-lightgray font-medium">
                        Valor Total <span className="text-seguranca-red">*</span>
                      </Label>
                      <Input
                        id="edit-totalValue"
                        type="number"
                        step="0.01"
                        value={formData.totalValue || ''}
                        onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-validUntil" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Válido Até
                      </Label>
                      <Input
                        id="edit-validUntil"
                        type="date"
                        value={formData.validUntil || ''}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-duration" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Duração Estimada
                      </Label>
                      <Select
                        value={formData.estimatedDuration ? String(formData.estimatedDuration) : ''}
                        onValueChange={(value) => setFormData({ ...formData, estimatedDuration: value ? Number(value) : undefined })}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="180" className="text-seguranca-lightgray hover:bg-seguranca-red/20">6 meses</SelectItem>
                          <SelectItem value="365" className="text-seguranca-lightgray hover:bg-seguranca-red/20">12 meses</SelectItem>
                          <SelectItem value="730" className="text-seguranca-lightgray hover:bg-seguranca-red/20">24 meses</SelectItem>
                          <SelectItem value="1095" className="text-seguranca-lightgray hover:bg-seguranca-red/20">36 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-paymentTerms" className="text-seguranca-lightgray font-medium">Condições de Pagamento</Label>
                      <Select
                        value={formData.paymentTerms || ''}
                        onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400">
                          <SelectValue placeholder="Selecione as condições" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="avista" className="text-seguranca-lightgray hover:bg-seguranca-red/20">À vista</SelectItem>
                          <SelectItem value="mensal" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Mensal</SelectItem>
                          <SelectItem value="30-60-90" className="text-seguranca-lightgray hover:bg-seguranca-red/20">30/60/90 dias</SelectItem>
                          <SelectItem value="personalizado" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-status" className="text-seguranca-lightgray font-medium">Status</Label>
                      <Select
                        value={formData.status || selectedQuote?.status || 'DRAFT'}
                        onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          <SelectItem value="DRAFT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Rascunho</SelectItem>
                          <SelectItem value="SENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Enviado</SelectItem>
                          <SelectItem value="UNDER_REVIEW" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Em Análise</SelectItem>
                          <SelectItem value="APPROVED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Aprovado</SelectItem>
                          <SelectItem value="REJECTED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Rejeitado</SelectItem>
                          <SelectItem value="EXPIRED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Expirado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção: Descrição */}
              <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                    <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                      <FileText className="h-5 w-5 text-seguranca-red" />
                    </div>
                    Descrição
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="text-seguranca-lightgray font-medium">Descrição Detalhada</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow"
                      placeholder="Descrição detalhada do orçamento..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
              
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
                  onClick={handleUpdateQuote}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Orçamento'
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
    </StandardLayout>
  );
};

export default Orcamentos; 