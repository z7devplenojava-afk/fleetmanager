import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContratosTable } from '@/components/contratos/ContratosTable';
import { ContratosCards } from '@/components/contratos/ContratosCards';
import { ContratoFormModal } from '@/components/contratos/ContratoFormModal';
import { ContractsDashboard } from '@/components/contratos/ContractsDashboard';
import { ContractsFilters } from '@/components/contratos/ContractsFilters';
import { ContractGenerator } from '@/components/contratos/ContractGenerator';
import { CompanySettings } from '@/components/contratos/CompanySettings';
import { EditContractModal } from '@/components/contratos/EditContractModal';
import DepartamentosEmailConfig from '@/components/comercial/DepartamentosEmailConfig';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/services/notificationService';
import { contractService, Contract, ContractFilters } from '@/services/contractService';
import { Plus, Search, Settings, Loader2, AlertCircle, RefreshCw, FileText, Building } from 'lucide-react';

const Contratos = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contratos, setContratos] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedContractForGeneration, setSelectedContractForGeneration] = useState<Contract | null>(null);
  const [selectedContractForEdit, setSelectedContractForEdit] = useState<Contract | null>(null);

  // Carregar contratos
  const loadContracts = async (filters: ContractFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando contratos com filtros:', filters);
      const data = await contractService.getContracts(filters);
      console.log('📋 Contratos recebidos:', data);
      console.log('📊 Quantidade de contratos:', data?.length || 0);
      
      // Validar dados recebidos
      if (data && Array.isArray(data)) {
        const validContracts = data.filter(contract => {
          if (!contract || !contract.clientName) {
            console.warn('⚠️ Contrato recebido sem dados do cliente:', contract);
            return false;
          }
          return true;
        });
        
        console.log('✅ Contratos válidos:', validContracts.length);
        setContratos(validContracts);
      } else {
        console.warn('⚠️ Dados recebidos não são um array válido:', data);
        setContratos([]);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar contratos:', err);
      setError('Erro ao carregar contratos. Tente novamente.');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contratos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar contratos com filtros
  const loadContractsWithFilters = async () => {
    const filters: ContractFilters = {};
    
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }
    
    await loadContracts(filters);
  };

  // Carregar contratos iniciais
  useEffect(() => {
    loadContracts();
  }, []);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    if (!loading) {
      loadContractsWithFilters();
    }
  }, [searchTerm]);

  // Filtrar contratos localmente
  const filteredContratos = contratos.filter(contrato => {
    // Verificar se o contrato e suas propriedades existem antes de filtrar
    if (!contrato || !contrato.clientName) {
      console.warn('⚠️ Contrato sem dados do cliente:', contrato);
      return false; // Excluir contratos sem dados do cliente
    }
    
    // Filtro por texto de busca
    const matchesSearch = (
      contrato.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contrato.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contrato.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filtro por status
    const matchesStatus = statusFilter === 'all' || contrato.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    loadContracts();
  };

  // Atualizar status do contrato
  const updateContractStatus = async (contractId: string, newStatus: string) => {
    try {
      await contractService.updateContractStatus(contractId, newStatus);
      toast({
        title: "Sucesso",
        description: "Status do contrato atualizado com sucesso.",
      });
      loadContractsWithFilters(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do contrato.",
        variant: "destructive"
      });
    }
  };

  // Excluir contrato
  const deleteContract = async (contractId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) {
      return;
    }

    try {
      await contractService.deleteContract(contractId);
      toast({
        title: "Sucesso",
        description: "Contrato excluído com sucesso.",
      });
      loadContractsWithFilters(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao excluir contrato:', err);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
        variant: "destructive"
      });
    }
  };

  const handleEditContrato = (contrato: Contract) => {
    console.log('🖊️ Editando contrato:', contrato);
    setSelectedContractForEdit(contrato);
    setEditModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    console.log('Contrato deletado com sucesso');
    loadContractsWithFilters(); // Recarregar lista
  };

  const handleEditSuccess = () => {
    console.log('Contrato editado com sucesso');
    loadContractsWithFilters(); // Recarregar lista
    setSelectedContractForEdit(null);
  };

  const handleGenerateContract = (contract?: Contract) => {
    setSelectedContractForGeneration(contract || null);
    setGeneratorModalOpen(true);
  };

  const handleCompanySettings = () => {
    setCompanySettingsOpen(true);
  };

  const handleSaveCompanyConfig = (config: any) => {
    console.log('Configurações da empresa salvas:', config);
    // As configurações são salvas no localStorage pelo componente
  };

  const handleAddContrato = async (contractData: any) => {
    try {
      console.log('📥 Dados recebidos do modal:', contractData);
      
      // Os dados já vêm no formato correto do modal atualizado
      const createdContract = await contractService.createContract(contractData);
      
      console.log('✅ Contrato criado:', createdContract);
      
      // TODO: Implementar notificações via backend service
      // As notificações agora são tratadas pelo backend automaticamente
      
      toast({
        title: 'Contrato Criado!',
        description: `Contrato ${contractData.contractNumber} criado com sucesso.`,
      });
      
      setModalOpen(false);
      loadContractsWithFilters(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o contrato.',
        variant: 'destructive',
      });
    }
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
  };

  // Loading state
  if (loading && contratos.length === 0) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-seguranca-red mb-4" />
            <p className="text-seguranca-lightgray">Carregando contratos...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (error && contratos.length === 0) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-4" />
            <p className="text-seguranca-lightgray mb-4">{error}</p>
            <Button 
              onClick={() => loadContracts()}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6 w-full max-w-full overflow-x-hidden px-2 sm:px-4 lg:px-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-seguranca-lightgray">Contratos</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCompanySettings}
                className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black text-xs sm:text-sm flex-shrink-0"
              >
                <Building className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Config. Empresa</span>
                <span className="sm:hidden">Empresa</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateContract()}
                className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white text-xs sm:text-sm flex-shrink-0"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Gerar Contrato</span>
                <span className="sm:hidden">Gerar</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfigModalOpen(true)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black text-xs sm:text-sm flex-shrink-0"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Config. Emails</span>
                <span className="sm:hidden">Emails</span>
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
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black flex-shrink-0"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
                <span className="sm:hidden">{refreshing ? '...' : 'Atualizar'}</span>
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:flex-initial min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Pesquisar contratos..."
                  className="pl-10 w-full sm:w-48 lg:w-64 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-seguranca-red hover:bg-seguranca-darkred flex-shrink-0 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Novo Contrato</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard de Estatísticas */}
        {!loading && (
          <ContractsDashboard contracts={contratos} />
        )}

        {/* Filtros */}
        {!loading && (
          <ContractsFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onClearFilters={clearFilters}
            totalContracts={contratos.length}
            filteredContracts={filteredContratos.length}
          />
        )}

        {/* Cards de Contratos */}
        {!loading && (
          <ContratosCards
            contratos={filteredContratos}
            onEdit={handleEditContrato}
            onDelete={handleDeleteSuccess}
            onStatusChange={updateContractStatus}
            onGenerateContract={handleGenerateContract}
          />
        )}


        {/* Modais */}
        <ContratoFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSubmit={handleAddContrato}
          onSuccess={handleModalSuccess}
        />

        <DepartamentosEmailConfig
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
        />

        {/* Modal de Geração de Contratos */}
        <ContractGenerator
          open={generatorModalOpen}
          onOpenChange={setGeneratorModalOpen}
          contract={selectedContractForGeneration}
          onConfigureCompany={handleCompanySettings}
        />

        {/* Modal de Configurações da Empresa */}
        {companySettingsOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-seguranca-lightgray">
                    Configurações da Empresa
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompanySettingsOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
                
                <CompanySettings
                  open={companySettingsOpen}
                  onSave={handleSaveCompanyConfig}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Contrato */}
        <EditContractModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          contract={selectedContractForEdit}
          onSuccess={handleEditSuccess}
        />
      </div>
    </StandardLayout>
  );
};

export default Contratos; 