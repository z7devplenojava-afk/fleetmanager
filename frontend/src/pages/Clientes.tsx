import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import { Search, Plus, RefreshCw, Building2, Users, CheckCircle2, Clock, XCircle, AlertCircle, FileText, FileSpreadsheet, Trash2 } from 'lucide-react';
import { clientService } from '@/services/clientService';
import { notificationService } from '@/services/notificationService';
import { Client, ClientStatus, ClientSearchParams } from '@/types/client';
import { ClientsTable } from '@/components/clientes/ClientsTable';
import { ClientFormModal } from '@/components/clientes/ClientFormModal';
import { ClientViewModal } from '@/components/clientes/ClientViewModal';
import { ClientReportFilters, ReportFilters } from '@/components/clientes/ClientReportFilters';
import { clientReportService } from '@/services/clientReportService';
import { ClientObraImportModal } from '@/components/clientes/ClientObraImportModal';
import { MobilizacaoModal } from '@/components/clientes/MobilizacaoModal';
import { Rocket } from 'lucide-react';

const Clientes: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isImportObraModalOpen, setIsImportObraModalOpen] = useState(false);
  const [isMobilizacaoModalOpen, setIsMobilizacaoModalOpen] = useState(false);
  const [mobilizacaoClient, setMobilizacaoClient] = useState<Client | undefined>();
  const [showReportFilters, setShowReportFilters] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const handleSelectClient = (clientId: string, selected: boolean) => {
    if (selected) {
      setSelectedClientIds(prev => (prev.includes(clientId) ? prev : [...prev, clientId]));
    } else {
      setSelectedClientIds(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleSelectAllClients = (selected: boolean) => {
    if (selected) {
      setSelectedClientIds(clients.map(c => c.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  const { toast } = useToast();
  useGSAP();

  // Load clients
  const loadClients = async (params: ClientSearchParams = {}) => {
    setIsLoading(true);
    try {
      const response = await clientService.getClients(params);
      setClients(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error("Frontend: Error loading clients:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(0);
    loadClients({ searchTerm, status: statusFilter === 'all' ? undefined : statusFilter, page: 0 });
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status as ClientStatus | 'all');
    setCurrentPage(0);
    loadClients({ searchTerm, status: status === 'all' ? undefined : status as ClientStatus, page: 0 });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadClients({ searchTerm, status: statusFilter === 'all' ? undefined : statusFilter, page });
  };

  // Handle form success
  const handleFormSuccess = async (client?: Client) => {
    await loadClients();
    
    // Se um novo cliente foi criado, enviar notificação
    if (client && !selectedClient) {
      try {
        const emailData = {
          to: 'comercial@empresa.com',
          subject: `Novo Cliente: ${client.name}`,
          body: `
            <h2>Novo Cliente Registrado</h2>
            <p><strong>Nome:</strong> ${client.name}</p>
            <p><strong>Email:</strong> ${client.email}</p>
            <p><strong>Telefone:</strong> ${client.phone}</p>
            <p><strong>Status:</strong> ${client.status}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            
            <h3>Próximos Passos:</h3>
            <ul>
              <li>Analisar perfil do cliente</li>
              <li>Preparar proposta comercial</li>
              <li>Agendar reunião de apresentação</li>
              <li>Definir estratégia de abordagem</li>
            </ul>
            
            <p><strong>Este é um alerta automático do sistema SecuredGuard.</strong></p>
          `,
          priority: 'media' as const
        };

        const panelNotification = {
          id: Date.now().toString(),
          tipo: 'novo_cliente' as const,
          titulo: `Novo Cliente: ${client.name}`,
          descricao: `Cliente ${client.name} registrado no sistema. Status: ${client.status}`,
          prioridade: 'media' as const,
          timestamp: new Date().toISOString(),
          lida: false,
          cliente: client.name
        };

        await Promise.all([
          notificationService.sendEmailNotification(emailData),
          notificationService.createPanelNotification(panelNotification)
        ]);

        toast({
          title: 'Cliente Criado!',
          description: `Cliente ${client.name} criado com sucesso. Notificação enviada ao departamento comercial.`,
        });
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        toast({
          title: 'Aviso',
          description: 'Cliente criado, mas houve erro ao enviar notificação.',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle edit client
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  // Handle view client
  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  // Handle delete client
  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
      return;
    }

    try {
      await clientService.deleteClient(client.id);
      toast({
        title: "Cliente excluído",
        description: "Cliente excluído com sucesso!",
      });
      setSelectedClientIds(prev => prev.filter(id => id !== client.id));
      loadClients();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao excluir cliente",
        variant: "destructive",
      });
    }
  };

  // Handle bulk delete clients
  const handleBulkDelete = async () => {
    if (selectedClientIds.length === 0) return;
    const count = selectedClientIds.length;
    if (confirm(`Tem certeza que deseja excluir os ${count} clientes selecionados? Esta ação não poderá ser desfeita.`)) {
      setIsDeletingBulk(true);
      try {
        await clientService.deleteClientsBulk(selectedClientIds);
        toast({
          title: "Clientes excluídos em massa",
          description: `${count} clientes foram excluídos com sucesso!`,
        });
        setSelectedClientIds([]);
        loadClients();
      } catch (error: any) {
        toast({
          title: "Erro na exclusão em massa",
          description: error.response?.data?.message || "Erro ao excluir clientes selecionados",
          variant: "destructive",
        });
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  // Handle new client
  const handleNewClient = () => {
    setSelectedClient(undefined);
    setIsFormModalOpen(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadClients();
  };

  // Handle report generation
  const handleGenerateReport = async (filters: ReportFilters) => {
    setIsGeneratingReport(true);
    
    try {
      let blob: Blob;
      let filename: string;
      
      if (filters.format === 'pdf') {
        blob = await clientReportService.generatePdfReport(filters);
        filename = `relatorio_clientes_${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        blob = await clientReportService.generateExcelReport(filters);
        filename = `relatorio_clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      }
      
      clientReportService.downloadFile(blob, filename);
      
      toast({
        title: "✅ Relatório gerado",
        description: `Relatório ${filters.format.toUpperCase()} baixado com sucesso!`,
      });
      
    } catch (error: any) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar relatório",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === ClientStatus.ACTIVE).length,
    inactive: clients.filter(c => c.status === ClientStatus.INACTIVE).length,
    suspended: clients.filter(c => c.status === ClientStatus.SUSPENDED).length,
    pending: clients.filter(c => c.status === ClientStatus.PENDING).length,
  };

  return (
    <StandardLayout 
      title="Gestão de Clientes"
      subtitle={totalElements > 0 
        ? `${totalElements} cliente${totalElements > 1 ? 's' : ''} cadastrado${totalElements > 1 ? 's' : ''} no sistema`
        : 'Gerencie todos os clientes da empresa'
      }
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-animate="fadeDown">
          <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-seguranca-red/50 transition-all duration-300 group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total de Clientes</p>
                  <p className="text-3xl font-bold text-white mt-2">{totalElements}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-green-500/50 transition-all duration-300 group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Clientes Ativos</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{stats.active}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 group-hover:bg-green-500/30 transition-colors">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-yellow-500/50 transition-all duration-300 group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.pending}</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 group-hover:bg-yellow-500/30 transition-colors">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-red-500/50 transition-all duration-300 group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Suspensos/Inativos</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{stats.suspended + stats.inactive}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 group-hover:bg-red-500/30 transition-colors">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-animate="fadeDown">
          <div className="flex flex-wrap gap-2.5">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-gray-600/60 text-gray-300 hover:bg-seguranca-graphite hover:border-gray-400 hover:text-white rounded-xl shadow-sm transition-all duration-200 font-medium"
            >
              <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              className="bg-gradient-to-r from-seguranca-red via-red-600 to-seguranca-darkred hover:from-red-600 hover:to-seguranca-red text-white font-bold shadow-lg shadow-seguranca-red/30 border border-red-500/30 rounded-xl transition-all duration-300"
              onClick={handleNewClient}
            >
              <Plus size={18} className="mr-2" />
              Novo Cliente
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setMobilizacaoClient(undefined);
                setIsMobilizacaoModalOpen(true);
              }}
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-400 font-semibold shadow-lg shadow-orange-500/10 rounded-xl transition-all duration-300"
            >
              <Rocket size={18} className="mr-2 text-orange-400 animate-pulse" />
              Mobilização Multissetorial
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsImportObraModalOpen(true)}
              className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 font-semibold shadow-lg shadow-amber-500/10 rounded-xl transition-all duration-300"
            >
              <FileSpreadsheet size={18} className="mr-2" />
              Importar Quadro de Obras
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowReportFilters(!showReportFilters)}
              className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400 font-semibold shadow-lg shadow-blue-500/10 rounded-xl transition-all duration-300"
            >
              <FileText size={18} className="mr-2" />
              {showReportFilters ? 'Ocultar Relatórios' : 'Relatórios Avançados'}
            </Button>
          </div>
        </div>

        {/* Bulk Actions Floating Bar */}
        {selectedClientIds.length > 0 && (
          <Card className="bg-gradient-to-r from-seguranca-black via-seguranca-graphite to-seguranca-black border-red-500/40 p-4 shadow-2xl backdrop-blur-md mt-4 rounded-xl flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-seguranca-red">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-white font-bold text-sm">
                {selectedClientIds.length} {selectedClientIds.length === 1 ? 'cliente selecionado' : 'clientes selecionados'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClientIds([])}
                className="text-gray-400 hover:text-white hover:bg-seguranca-graphite text-xs rounded-lg"
              >
                Limpar Seleção
              </Button>
              <Button
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold shadow-lg shadow-red-600/30 border border-red-500/40 text-xs px-4 py-2 rounded-lg"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeletingBulk ? 'Excluindo...' : `Excluir Selecionados (${selectedClientIds.length})`}
              </Button>
            </div>
          </Card>
        )}

        {/* Search Section */}
        <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/60 border-gray-600/30 p-4 sm:p-6 shadow-2xl backdrop-blur-sm mt-6" data-animate="fadeUp">
          {/* Search Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-seguranca-red/20 to-seguranca-red/10 border border-seguranca-red/30 shadow-lg shadow-seguranca-red/10">
              <Search className="h-6 w-6 text-seguranca-red" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white mb-1">Pesquisar Clientes</h3>
              <p className="text-sm text-gray-400">Filtre e encontre clientes rapidamente</p>
            </div>
          </div>

          {/* Search Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Digite o nome, CNPJ ou email do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 pr-4 py-3 bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 rounded-xl"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="sm:w-[200px] py-3 bg-seguranca-black/50 border-gray-600/30 text-white focus:border-seguranca-red/50 focus:ring-seguranca-red/20 rounded-xl">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-black border-gray-600/30">
                <SelectItem value="all" className="text-white hover:bg-seguranca-graphite">
                  📋 Todos os status
                </SelectItem>
                <SelectItem value={ClientStatus.ACTIVE} className="text-green-300 hover:bg-seguranca-graphite">
                  ✅ Ativo
                </SelectItem>
                <SelectItem value={ClientStatus.INACTIVE} className="text-gray-300 hover:bg-seguranca-graphite">
                  ⭕ Inativo
                </SelectItem>
                <SelectItem value={ClientStatus.SUSPENDED} className="text-red-300 hover:bg-seguranca-graphite">
                  🚫 Suspenso
                </SelectItem>
                <SelectItem value={ClientStatus.PENDING} className="text-yellow-300 hover:bg-seguranca-graphite">
                  ⏳ Pendente
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red shadow-lg shadow-seguranca-red/20 sm:w-auto w-full rounded-xl font-semibold"
            >
              <Search size={20} className="mr-2" />
              Buscar
            </Button>
          </div>
        </Card>

        {/* Clients Table */}
        <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/60 border-gray-600/30 p-3 sm:p-6 shadow-2xl backdrop-blur-sm mt-6" data-animate="fadeUp">
          <ClientsTable
            clients={clients}
            selectedClientIds={selectedClientIds}
            onSelectClient={handleSelectClient}
            onSelectAllClients={handleSelectAllClients}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
            onView={handleViewClient}
            onMobilize={(client) => {
              setMobilizacaoClient(client);
              setIsMobilizacaoModalOpen(true);
            }}
            isLoading={isLoading}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>

        {/* Report Filters */}
        {showReportFilters && (
          <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/60 border-gray-600/30 p-8 shadow-2xl backdrop-blur-sm mt-6" data-animate="fadeUp">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-white mb-1">Relatórios Avançados</h3>
                <p className="text-sm text-gray-400">Gere relatórios personalizados em PDF ou Excel</p>
              </div>
            </div>
            
            <ClientReportFilters 
              onGenerate={handleGenerateReport}
              isLoading={isGeneratingReport}
            />
          </Card>
        )}
      </div>

      {/* Form Modal */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        client={selectedClient}
      />

      {/* View Modal */}
      <ClientViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        client={selectedClient}
      />

      {/* Mobilização Multissetorial Modal */}
      <MobilizacaoModal
        isOpen={isMobilizacaoModalOpen}
        onClose={() => setIsMobilizacaoModalOpen(false)}
        client={mobilizacaoClient}
        onSuccess={() => {
          loadClients();
        }}
      />

      {/* Import Quadro de Obras Modal */}
      <ClientObraImportModal
        open={isImportObraModalOpen}
        onOpenChange={setIsImportObraModalOpen}
        onSuccess={() => {
          loadClients();
          toast({
            title: 'Importação concluída!',
            description: 'Clientes, veículos e contratos foram importados com sucesso.',
          });
        }}
      />
    </StandardLayout>
  );
};

export default Clientes;
