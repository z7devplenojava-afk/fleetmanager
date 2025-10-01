import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Phone,
  Globe,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bankAgencyService, Bank, BankStatistics } from '@/services/bankAgencyService';
import { BankFormModal } from '@/components/financeiro/BankFormModal';
import { BankViewModal } from '@/components/financeiro/BankViewModal';

const Bancos: React.FC = () => {
  const { toast } = useToast();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [statistics, setStatistics] = useState<BankStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  // Carregar dados do backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar bancos
      const banksData = await bankAgencyService.getAllBanks();
      setBanks(Array.isArray(banksData) ? banksData : []);
      
      // Carregar estatísticas
      const stats = await bankAgencyService.getBankStatistics();
      setStatistics(stats);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
      // Garantir que banks seja sempre um array
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBank = () => {
    setEditingBank(null);
    setFormModalOpen(true);
  };

  const handleEditBank = (bank: Bank) => {
    setEditingBank(bank);
    setFormModalOpen(true);
  };

  const handleViewBank = (bank: Bank) => {
    setSelectedBank(bank);
    setViewModalOpen(true);
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!confirm('Tem certeza que deseja remover este banco?')) return;
    
    try {
      setLoading(true);
      await bankAgencyService.deleteBank(bankId);
      
      setBanks(prev => (prev || []).filter(bank => bank.id !== bankId));
      toast({
        title: "Sucesso",
        description: "Banco removido com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao remover banco:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o banco",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = (bank: Bank) => {
    if (editingBank) {
      setBanks(prev => (prev || []).map(b => b.id === bank.id ? bank : b));
      toast({
        title: "Sucesso",
        description: "Banco atualizado com sucesso!"
      });
    } else {
      setBanks(prev => [bank, ...(prev || [])]);
      toast({
        title: "Sucesso",
        description: "Banco criado com sucesso!"
      });
    }
    setFormModalOpen(false);
    setEditingBank(null);
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
      'ACTIVE': { color: 'bg-green-500 text-white', label: 'Ativo' },
      'INACTIVE': { color: 'bg-gray-500 text-white', label: 'Inativo' },
      'SUSPENDED': { color: 'bg-red-500 text-white', label: 'Suspenso' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredBanks = (banks || []).filter(bank => {
    const matchesSearch = bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bank.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bank.shortName && bank.shortName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'ALL' || bank.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Bancos</h1>
            <p className="text-seguranca-lightgray/70 mt-1">
              Gerencie os bancos cadastrados no sistema
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
              onClick={handleCreateBank}
              className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Banco
            </Button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-seguranca-graphite border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-seguranca-yellow" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray/70">Total de Bancos</p>
                    <p className="text-2xl font-bold text-seguranca-lightgray">{statistics.totalBanks}</p>
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
                    <p className="text-sm font-medium text-seguranca-lightgray/70">Ativos</p>
                    <p className="text-2xl font-bold text-green-400">{statistics.activeBanks}</p>
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
                    <p className="text-sm font-medium text-seguranca-lightgray/70">Inativos</p>
                    <p className="text-2xl font-bold text-gray-400">{statistics.inactiveBanks}</p>
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
                    <p className="text-sm font-medium text-seguranca-lightgray/70">Suspensos</p>
                    <p className="text-2xl font-bold text-red-400">{statistics.suspendedBanks}</p>
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
              placeholder="Buscar por nome, código ou nome abreviado..."
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
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Inativos</option>
            <option value="SUSPENDED">Suspensos</option>
          </select>
        </div>

        {/* Lista de bancos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanks.map((bank) => (
            <Card key={bank.id} className="bg-seguranca-graphite border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-seguranca-yellow" />
                    </div>
                    <div>
                      <CardTitle className="text-seguranca-lightgray text-lg">{bank.name}</CardTitle>
                      <p className="text-seguranca-lightgray/70 text-sm">Código: {bank.code}</p>
                      {bank.shortName && (
                        <p className="text-seguranca-lightgray/70 text-sm">Abrev: {bank.shortName}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(bank.status)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-seguranca-lightgray/70">
                  {bank.cnpj && (
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>CNPJ: {bank.cnpj}</span>
                    </div>
                  )}
                  
                  {bank.city && bank.state && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{bank.city} - {bank.state}</span>
                    </div>
                  )}
                  
                  {bank.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{bank.phone}</span>
                    </div>
                  )}
                  
                  {bank.website && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      <a 
                        href={bank.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-seguranca-yellow hover:underline"
                      >
                        {bank.website}
                      </a>
                    </div>
                  )}
                </div>
                
                {bank.description && (
                  <p className="text-seguranca-lightgray/70 text-sm mt-3 line-clamp-2">
                    {bank.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleViewBank(bank)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleEditBank(bank)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteBank(bank.id)}
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

        {filteredBanks.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-seguranca-lightgray">Nenhum banco encontrado</h3>
            <p className="mt-1 text-sm text-seguranca-lightgray/70">
              {searchTerm || filterStatus !== 'ALL' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando um novo banco.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modais */}
      <BankFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onSuccess={handleFormSuccess}
        bank={editingBank}
      />
      
      <BankViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        bank={selectedBank}
      />
    </StandardLayout>
  );
};

export default Bancos;
