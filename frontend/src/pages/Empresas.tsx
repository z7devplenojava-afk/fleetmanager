import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Company, CompanyStatus, CompanyStatusLabels, CompanyStatusColors, CompanyFilters } from '@/types/company';
import { companyService } from '@/services/companyService';
import { CompanyFormModal } from '@/components/empresas/CompanyFormModal';
import { StandardLayout } from '@/components/StandardLayout';
import { Plus, Search, Filter, Building2, AlertTriangle, TrendingUp, TrendingDown, DollarSign, BarChart3, RefreshCw, Edit, Trash2, Eye, MapPin, Phone, Mail, Globe, Users, Calendar } from 'lucide-react';

export default function Empresas() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');

  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    pendingCompanies: 0,
    suspendedCompanies: 0,
  });

  useEffect(() => {
    loadCompanies();
    loadStats();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, statusFilter, sectorFilter, typeFilter, sizeFilter]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await companyService.getCompanyStats();
      setStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.tradeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj?.includes(searchTerm) ||
        company.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => company.status === statusFilter);
    }

    if (sectorFilter !== 'all') {
      filtered = filtered.filter(company => company.sector === sectorFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(company => company.type === typeFilter);
    }

    if (sizeFilter !== 'all') {
      filtered = filtered.filter(company => company.size === sizeFilter);
    }

    setFilteredCompanies(filtered);
  };

  const handleCreateCompany = async (companyData: Partial<Company>) => {
    try {
      await companyService.createCompany(companyData as Omit<Company, 'id' | 'createdAt' | 'updatedAt'>);
      await loadCompanies();
      await loadStats();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateCompany = async (companyData: Partial<Company>) => {
    if (!editingCompany) return;
    
    try {
      await companyService.updateCompany(editingCompany.id, companyData);
      await loadCompanies();
      await loadStats();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta empresa?')) return;

    try {
      await companyService.deleteCompany(id);
      await loadCompanies();
      await loadStats();
      toast({
        title: "Sucesso",
        description: "Empresa deletada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar empresa. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(undefined);
  };

  const getStatusColor = (status: CompanyStatus) => {
    return CompanyStatusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSectors = () => {
    const sectors = [...new Set(companies.map(c => c.sector).filter(Boolean))];
    return sectors.sort();
  };

  const getTypes = () => {
    const types = [...new Set(companies.map(c => c.type).filter(Boolean))];
    return types.sort();
  };

  const getSizes = () => {
    const sizes = [...new Set(companies.map(c => c.size).filter(Boolean))];
    return sizes.sort();
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-seguranca-black">Empresas</h1>
            <p className="text-gray-400 mt-1">Gerencie as empresas do sistema</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Empresa
          </Button>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.totalCompanies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Ativas</p>
                  <p className="text-2xl font-bold">{stats.activeCompanies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pendingCompanies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Inativas</p>
                  <p className="text-2xl font-bold">{stats.inactiveCompanies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Suspensas</p>
                  <p className="text-2xl font-bold">{stats.suspendedCompanies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {Object.entries(CompanyStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Setores</SelectItem>
                    {getSectors().map((sector) => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {getTypes().map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tamanhos</SelectItem>
                    {getSizes().map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Empresas ({filteredCompanies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Carregando empresas...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Setor/Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Informações</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.tradeName && (
                              <div className="text-sm text-muted-foreground">{company.tradeName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.cnpj || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              {company.city && company.state 
                                ? `${company.city}, ${company.state}` 
                                : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {company.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-gray-500" />
                                <span className="text-xs">{company.phone}</span>
                              </div>
                            )}
                            {company.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="w-3 h-3 text-gray-500" />
                                <span className="text-xs">{company.email}</span>
                              </div>
                            )}
                            {company.website && (
                              <div className="flex items-center space-x-1">
                                <Globe className="w-3 h-3 text-gray-500" />
                                <span className="text-xs">{company.website}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {company.sector && (
                              <Badge variant="outline" className="text-xs">{company.sector}</Badge>
                            )}
                            {company.type && (
                              <Badge variant="outline" className="text-xs">{company.type}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(company.status)}>
                            {CompanyStatusLabels[company.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {company.employeeCount && (
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3 text-gray-500" />
                                <span className="text-xs">{formatNumber(company.employeeCount)} funcionários</span>
                              </div>
                            )}
                            {company.annualRevenue && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3 text-gray-500" />
                                <span className="text-xs">{formatCurrency(company.annualRevenue)}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              <span className="text-xs">{formatDate(company.createdAt)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditCompany(company)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteCompany(company.id)}>
                              <Trash2 className="w-4 h-4" />
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

        {/* Modal */}
        {isModalOpen && (
          <CompanyFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={editingCompany ? handleUpdateCompany : handleCreateCompany}
            company={editingCompany}
          />
        )}
      </div>
    </StandardLayout>
  );
} 