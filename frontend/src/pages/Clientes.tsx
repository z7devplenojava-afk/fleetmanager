import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { useAOS } from '@/hooks/use-aos';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { clientService } from '@/services/clientService';
import { notificationService } from '@/services/notificationService';
import { Client, ClientStatus, ClientSearchParams } from '@/types/client';
import { ClientsTable } from '@/components/clientes/ClientsTable';
import { ClientFormModal } from '@/components/clientes/ClientFormModal';
import { ClientViewModal } from '@/components/clientes/ClientViewModal';

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

  const { toast } = useToast();
  const aos = useAOS();

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
      loadClients();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao excluir cliente",
        variant: "destructive",
      });
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

  return (
    <StandardLayout 
      title="Clientes"
      subtitle={totalElements > 0 
        ? `${totalElements} cliente${totalElements > 1 ? 's' : ''} encontrado${totalElements > 1 ? 's' : ''}`
        : 'Gerencie os clientes da empresa'
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-aos={aos.fadeDown}>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
            >
              <RefreshCw size={20} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              className="bg-seguranca-red hover:bg-seguranca-darkred"
              onClick={handleNewClient}
            >
              <Plus size={20} className="mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <Card className="bg-seguranca-graphite border-gray-600 p-6" data-aos={aos.fadeUp}>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px] bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value={ClientStatus.ACTIVE}>Ativo</SelectItem>
                <SelectItem value={ClientStatus.INACTIVE}>Inativo</SelectItem>
                <SelectItem value={ClientStatus.SUSPENDED}>Suspenso</SelectItem>
                <SelectItem value={ClientStatus.PENDING}>Pendente</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Search size={20} className="mr-2" />
              Buscar
            </Button>
          </div>

          <ClientsTable
            clients={clients}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
            onView={handleViewClient}
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
    </StandardLayout>
  );
};

export default Clientes;
