import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bankAgencyService, Agency, AgencyStatistics, Bank } from '@/services/bankAgencyService';
import { AgencyFormModal } from '@/components/financeiro/AgencyFormModal';
import { AgencyViewModal } from '@/components/financeiro/AgencyViewModal';

const Agencias: React.FC = () => {
  const { toast } = useToast();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [statistics, setStatistics] = useState<AgencyStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterBank, setFilterBank] = useState<string>('ALL');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  // Carregar dados do backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar agências
      const agenciesData = await bankAgencyService.getAllAgencies();
      setAgencies(Array.isArray(agenciesData) ? agenciesData : []);
      
      // Carregar bancos para filtro
      const banksData = await bankAgencyService.getAllBanks();
      setBanks(Array.isArray(banksData) ? banksData : []);
      
      // Carregar estatísticas
      const stats = await bankAgencyService.getAgencyStatistics();
      setStatistics(stats);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
      // Garantir que agencies e banks sejam sempre arrays
      setAgencies([]);
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgency = () => {
    setEditingAgency(null);
    setFormModalOpen(true);
  };

  const handleEditAgency = (agency: Agency) => {
    setEditingAgency(agency);
    setFormModalOpen(true);
  };

  const handleViewAgency = (agency: Agency) => {
    setSelectedAgency(agency);
    setViewModalOpen(true);
  };

  const handleDeleteAgency = async (agencyId: string) => {
    if (!confirm('Tem certeza que deseja remover esta agência?')) return;
    
    try {
      setLoading(true);
      await bankAgencyService.deleteAgency(agencyId);
      
      setAgencies(prev => (prev || []).filter(agency => agency.id !== agencyId));
      toast({
        title: "Sucesso",
        description: "Agência removida com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao remover agência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a agência",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = (agency: Agency) => {
    if (editingAgency) {
      setAgencies(prev => (prev || []).map(a => a.id === agency.id ? agency : a));
      toast({
        title: "Sucesso",
        description: "Agência atualizada com sucesso!"
      });
    } else {
      setAgencies(prev => [agency, ...(prev || [])]);
      toast({
        title: "Sucesso",
        description: "Agência criada com sucesso!"
      });
    }
    setFormModalOpen(false);
    setEditingAgency(null);
  };

  const handleRefresh = async () => {
    await loadData();
    toast({
      title: "Sucesso",
      description: "Dados atualizados com sucesso!"
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-500 text-white', label: 'Ativa' },
      'INACTIVE': { color: 'bg-gray-500 text-white', label: 'Inativa' },
      'SUSPENDED': { color: 'bg-red-500 text-white', label: 'Suspensa' },
      'MAINTENANCE': { color: 'bg-yellow-500 text-white', label: 'Manutenção' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredAgencies = (agencies || []).filter(agency => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (agency.city && agency.city.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'ALL' || agency.status === filterStatus;
    const matchesBank = filterBank === 'ALL' || agency.bankId === filterBank;
    
    return matchesSearch && matchesStatus && matchesBank;
  });

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Agências</h1>
            <p className="text-seguranca-lightgray/70 mt-1">
              Gerencie as agências bancárias cadastradas no sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              onClick={handleCreateAgency}
              className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Agência
            </Button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-seguranca-graphite border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-seguranca-yellow" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray/70">Total de Agências</p>
                    <p className="text-2xl font-bold text-seguranca-lightgray">{statistics.totalAgencies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-seguranca-graphite border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray/70">Ativas</p>
                    <p className="text-2xl font-bold text-green-400">{statistics.activeAgencies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-seguranca-graphite border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">I</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray/70">Inativas</p>
                    <p className="text-2xl font-bold text-gray-400">{statistics.inactiveAgencies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-seguranca-graphite border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray/70">Suspensas</p>
                    <p className="text-2xl font-bold text-red-400">{statistics.suspendedAgencies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-seguranca-graphite border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray/70">Manutenção</p>
                    <p className="text-2xl font-bold text-yellow-400">{statistics.maintenanceAgencies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, código, banco ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder-gray-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-seguranca-graphite border border-gray-600 rounded-md text-seguranca-lightgray focus:outline-none focus:ring-2 focus:ring-seguranca-yellow"
          >
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="INACTIVE">Inativas</option>
            <option value="SUSPENDED">Suspensas</option>
            <option value="MAINTENANCE">Manutenção</option>
          </select>
          <select
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            className="px-3 py-2 bg-seguranca-graphite border border-gray-600 rounded-md text-seguranca-lightgray focus:outline-none focus:ring-2 focus:ring-seguranca-yellow"
          >
            <option value="ALL">Todos os bancos</option>
            {banks.map(bank => (
              <option key={bank.id} value={bank.id}>{bank.name}</option>
            ))}
          </select>
        </div>

        {/* Lista de agências */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgencies.map((agency) => (
            <Card key={agency.id} className="bg-seguranca-graphite border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-seguranca-yellow" />
                    </div>
                    <div>
                      <CardTitle className="text-seguranca-lightgray text-lg">{agency.name}</CardTitle>
                      <p className="text-seguranca-lightgray/70 text-sm">{agency.bankName}</p>
                      <p className="text-seguranca-lightgray/70 text-sm">Código: {agency.code}</p>
                    </div>
                  </div>
                  {getStatusBadge(agency.status)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-seguranca-lightgray/70">
                  {agency.city && agency.state && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{agency.city} - {agency.state}</span>
                    </div>
                  )}
                  
                  {agency.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{agency.phone}</span>
                    </div>
                  )}
                  
                  {agency.manager && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <span>Gerente: {agency.manager}</span>
                    </div>
                  )}
                  
                  {agency.managerEmail && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="text-seguranca-yellow">{agency.managerEmail}</span>
                    </div>
                  )}
                </div>
                
                {agency.description && (
                  <p className="text-seguranca-lightgray/70 text-sm mt-3 line-clamp-2">
                    {agency.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleViewAgency(agency)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleEditAgency(agency)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteAgency(agency.id)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAgencies.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-seguranca-lightgray">Nenhuma agência encontrada</h3>
            <p className="mt-1 text-sm text-seguranca-lightgray/70">
              {searchTerm || filterStatus !== 'ALL' || filterBank !== 'ALL'
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando uma nova agência.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modais */}
      <AgencyFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onSuccess={handleFormSuccess}
        agency={editingAgency}
      />
      
      <AgencyViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        agency={selectedAgency}
      />
    </StandardLayout>
  );
};

export default Agencias;
