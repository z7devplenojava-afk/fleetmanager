import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Award,
  Calendar,
  DollarSign,
  Users,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { benefitService, Benefit } from '@/services/benefitService';
import BeneficioFormModal from '@/components/beneficios/BeneficioFormModal';
import BeneficioViewModal from '@/components/beneficios/BeneficioViewModal';
import BeneficioDeleteDialog from '@/components/beneficios/BeneficioDeleteDialog';
import { StandardLayout } from '@/components/StandardLayout';

const Beneficios: React.FC = () => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [filteredBenefits, setFilteredBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  // Estados para modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);

  useEffect(() => {
    loadBenefits();
  }, []);

  useEffect(() => {
    filterBenefits();
  }, [benefits, searchTerm, typeFilter, statusFilter]);

  const loadBenefits = async () => {
    try {
      setLoading(true);
      const data = await benefitService.getBenefits();
      setBenefits(data);
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os benefícios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBenefits = () => {
    let filtered = benefits;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(benefit =>
        benefit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        benefit.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(benefit => benefit.type === typeFilter);
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(benefit => benefit.isActive === isActive);
    }

    // Filtro por unidade - removido pois não existe no tipo atual
    // if (unitFilter !== 'all') {
    //   filtered = filtered.filter(benefit => 
    //     benefit.units.some(unit => unit.toLowerCase().includes(unitFilter.toLowerCase()))
    //   );
    // }

    setFilteredBenefits(filtered);
  };

  const handleCreate = () => {
    setSelectedBenefit(null);
    setShowCreateModal(true);
  };

  const handleView = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowViewModal(true);
  };

  const handleEdit = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowEditModal(true);
  };

  const handleDelete = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBenefit) return;

    try {
      await benefitService.deleteBenefit(selectedBenefit.id.toString());
      toast({
        title: "Sucesso",
        description: "Benefício excluído com sucesso.",
      });
      loadBenefits();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erro ao excluir benefício:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o benefício.",
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'TRANSPORT': 'Transporte',
      'MEAL': 'Refeição',
      'HEALTH': 'Saúde',
      'DENTAL': 'Odontológico',
      'LIFE_INSURANCE': 'Seguro de Vida',
      'OTHER': 'Outro'
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'TRANSPORT': 'bg-blue-100 text-blue-800',
      'MEAL': 'bg-green-100 text-green-800',
      'HEALTH': 'bg-red-100 text-red-800',
      'DENTAL': 'bg-purple-100 text-purple-800',
      'LIFE_INSURANCE': 'bg-orange-100 text-orange-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const exportData = () => {
    const csvContent = [
      ['Nome', 'Tipo', 'Descrição', 'Valor', 'Status'],
      ...filteredBenefits.map(benefit => [
        benefit.name,
        getTypeLabel(benefit.type),
        benefit.description || '',
        benefit.value?.toString() || '0',
        benefit.isActive ? 'Ativo' : 'Inativo'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `beneficios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <StandardLayout title="">
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-seguranca-yellow">Gestão de Benefícios</h1>
            <p className="text-seguranca-lightgray mt-1 text-sm md:text-base">
              Gerencie os benefícios oferecidos aos funcionários
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-seguranca-red hover:bg-seguranca-red/90 text-white w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Benefício</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card className="bg-seguranca-darkgray border-seguranca-lightgray/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm font-medium text-seguranca-lightgray">Total de Benefícios</p>
                  <p className="text-lg md:text-2xl font-bold text-seguranca-yellow">{benefits.length}</p>
                </div>
                <Award className="h-6 w-6 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-darkgray border-seguranca-lightgray/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm font-medium text-seguranca-lightgray">Benefícios Ativos</p>
                  <p className="text-lg md:text-2xl font-bold text-green-400">
                    {benefits.filter(b => b.isActive).length}
                  </p>
                </div>
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-darkgray border-seguranca-lightgray/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm font-medium text-seguranca-lightgray">Valor Total</p>
                  <p className="text-lg md:text-2xl font-bold text-purple-400">
                    R$ {benefits.reduce((sum, b) => sum + b.value, 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-darkgray border-seguranca-lightgray/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm font-medium text-seguranca-lightgray">Tipos Diferentes</p>
                  <p className="text-lg md:text-2xl font-bold text-orange-400">
                    {new Set(benefits.map(b => b.type)).size}
                  </p>
                </div>
                <Building className="h-6 w-6 md:h-8 md:w-8 text-orange-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-seguranca-darkgray border-seguranca-lightgray/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-seguranca-yellow text-lg">
              <Filter className="h-5 w-5" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-seguranca-lightgray/60" />
                  <Input
                    placeholder="Nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-seguranca-lightgray/30 text-white placeholder:text-seguranca-lightgray/60 focus:border-seguranca-yellow"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-seguranca-black border-seguranca-lightgray/30 text-white focus:border-seguranca-yellow">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-seguranca-lightgray/30">
                    <SelectItem value="all" className="text-white hover:bg-seguranca-darkgray">Todos os tipos</SelectItem>
                    <SelectItem value="TRANSPORT" className="text-white hover:bg-seguranca-darkgray">Transporte</SelectItem>
                    <SelectItem value="MEAL" className="text-white hover:bg-seguranca-darkgray">Refeição</SelectItem>
                    <SelectItem value="HEALTH" className="text-white hover:bg-seguranca-darkgray">Saúde</SelectItem>
                    <SelectItem value="DENTAL" className="text-white hover:bg-seguranca-darkgray">Odontológico</SelectItem>
                    <SelectItem value="LIFE_INSURANCE" className="text-white hover:bg-seguranca-darkgray">Seguro de Vida</SelectItem>
                    <SelectItem value="OTHER" className="text-white hover:bg-seguranca-darkgray">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-seguranca-black border-seguranca-lightgray/30 text-white focus:border-seguranca-yellow">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-seguranca-lightgray/30">
                    <SelectItem value="all" className="text-white hover:bg-seguranca-darkgray">Todos os status</SelectItem>
                    <SelectItem value="active" className="text-white hover:bg-seguranca-darkgray">Ativo</SelectItem>
                    <SelectItem value="inactive" className="text-white hover:bg-seguranca-darkgray">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <Button 
                variant="outline" 
                onClick={exportData} 
                className="flex items-center gap-2 border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black w-full md:w-auto"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Benefícios ({filteredBenefits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Cargos</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBenefits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhum benefício encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBenefits.map((benefit) => (
                        <TableRow key={benefit.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{benefit.name}</div>
                              <div className="text-sm text-gray-500">{benefit.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(benefit.type)}>
                              {getTypeLabel(benefit.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              R$ {benefit.value?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Valor Fixo
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              N/A
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              N/A
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={benefit.isActive ? "default" : "secondary"}>
                              {benefit.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(benefit)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(benefit)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(benefit)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modais */}
        <BeneficioFormModal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
          }}
          benefit={selectedBenefit}
          onSuccess={loadBenefits}
        />

        <BeneficioViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          benefit={selectedBenefit}
        />

        <BeneficioDeleteDialog
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          benefit={selectedBenefit}
          onConfirm={handleDeleteConfirm}
          loading={loading}
        />
      </div>
    </StandardLayout>
  );
};

export default Beneficios; 