import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import { 
  Users, 
  Plus, 
  Search, 
  RefreshCw,
  User,
  Heart,
  GraduationCap,
  Calendar,
  Loader2,
  AlertCircle,
  UserPlus,
  Building2
} from 'lucide-react';
import { Dependent, DependentFilters, RELATIONSHIP_OPTIONS } from '@/types/dependent';
import { DependentesTable } from '@/components/dependentes/DependentesTable';
import { DependentFormModal } from '@/components/dependentes/DependentFormModal';
import dependentService from '@/services/dependentService';
import { Employee } from '@/types/employee';
import { employeeService } from '@/services/employeeService';

const Dependentes: React.FC = () => {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [relationshipFilter, setRelationshipFilter] = useState<string>('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedDependent, setSelectedDependent] = useState<Dependent | undefined>();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();

  const { toast } = useToast();
  useGSAP();

  // Load employees for selection
  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAllEmployees();
      setEmployees(response.content);
    } catch (error: any) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de funcionários",
        variant: "destructive",
      });
    }
  };

  // Load dependents
  const loadDependents = async (filters: DependentFilters = {}) => {
    setIsLoading(true);
    try {
      let dependentsData: Dependent[] = [];
      
      if (selectedEmployeeId) {
        dependentsData = await dependentService.getDependentsByEmployee(selectedEmployeeId);
        // Find selected employee
        const employee = employees.find(emp => emp.id === selectedEmployeeId);
        setSelectedEmployee(employee);
      } else {
        dependentsData = await dependentService.getAllDependents();
        setSelectedEmployee(undefined);
      }

      // Apply additional filters
      let filteredDependents = dependentsData;
      
      if (searchTerm) {
        filteredDependents = filteredDependents.filter(dependent =>
          dependent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dependent.cpf.includes(searchTerm) ||
          dependent.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (relationshipFilter) {
        filteredDependents = filteredDependents.filter(dependent =>
          dependent.relationship === relationshipFilter
        );
      }

      setDependents(filteredDependents);
    } catch (error: any) {
      console.error("Erro ao carregar dependentes:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar dependentes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Load dependents when filters change
  useEffect(() => {
    if (employees.length > 0) {
      loadDependents();
    }
  }, [selectedEmployeeId, employees]);

  // Handle search
  const handleSearch = () => {
    loadDependents();
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId === 'all' ? '' : employeeId);
    setSearchTerm('');
    setRelationshipFilter('');
  };

  // Handle relationship filter
  const handleRelationshipFilter = (relationship: string) => {
    setRelationshipFilter(relationship === 'all' ? '' : relationship);
  };

  // Handle clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedEmployeeId('');
    setRelationshipFilter('');
    setSelectedEmployee(undefined);
  };

  // Handle form success
  const handleFormSuccess = () => {
    loadDependents();
  };

  // Handle edit dependent
  const handleEditDependent = (dependent: Dependent) => {
    setSelectedDependent(dependent);
    setIsFormModalOpen(true);
  };

  // Handle delete dependent
  const handleDeleteDependent = async (dependent: Dependent) => {
    if (window.confirm(`Tem certeza que deseja excluir o dependente "${dependent.name}"?`)) {
      try {
        await dependentService.deleteDependent(dependent.id);
        toast({
          title: "Sucesso",
          description: "Dependente excluído com sucesso!",
        });
        loadDependents();
      } catch (error: any) {
        console.error('Erro ao excluir dependente:', error);
        toast({
          title: "Erro",
          description: error.response?.data?.message || "Erro ao excluir dependente",
          variant: "destructive",
        });
      }
    }
  };

  // Calculate statistics
  const stats = {
    total: dependents.length,
    students: dependents.filter(d => d.isStudent).length,
    beneficiaries: dependents.filter(d => d.isBeneficiary).length,
    children: dependents.filter(d => d.relationship === 'FILHO' || d.relationship === 'FILHA').length
  };

  return (
    <StandardLayout title="Gerenciamento de Dependentes" subtitle="Gerencie os dependentes dos funcionários">
      <div className="space-y-6 p-4 sm:p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-animate="fadeDown">
          <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-blue-500/50 transition-all duration-300 group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total de Dependentes</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-green-500/50 transition-all duration-300 group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Estudantes</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.students}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 group-hover:bg-green-500/30 transition-colors">
                  <GraduationCap className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-purple-500/50 transition-all duration-300 group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Beneficiários</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.beneficiaries}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                  <Heart className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-orange-500/50 transition-all duration-300 group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Filhos</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.children}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30 group-hover:bg-orange-500/30 transition-colors">
                  <User className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 p-6" data-animate="fadeUp">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-seguranca-red/20 border border-seguranca-red/30">
                <Search className="h-5 w-5 text-seguranca-red" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Filtros de Busca</h3>
                <p className="text-sm text-gray-400">Filtre dependentes por funcionário, relacionamento ou nome</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
            >
              <RefreshCw size={16} className="mr-2" />
              Limpar
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Funcionário</label>
              <Select value={selectedEmployeeId || 'all'} onValueChange={handleEmployeeSelect}>
                <SelectTrigger className="bg-seguranca-black/70 border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow/20">
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                    👥 Todos os funcionários
                  </SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id} className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Relacionamento</label>
              <Select value={relationshipFilter || 'all'} onValueChange={handleRelationshipFilter}>
                <SelectTrigger className="bg-seguranca-black/70 border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow/20">
                  <SelectValue placeholder="Todos os relacionamentos" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                    📋 Todos
                  </SelectItem>
                  {RELATIONSHIP_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Nome, CPF ou funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black/70 border-gray-600 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-transparent">Buscar</label>
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red shadow-lg shadow-seguranca-red/20"
              >
                <Search size={20} className="mr-2" />
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Selected Employee Info */}
        {selectedEmployee && (
          <Card className="bg-gradient-to-r from-seguranca-graphite via-seguranca-black to-seguranca-graphite border-2 border-gray-600/50 shadow-xl" data-animate="fadeUp">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                  <div className="h-18 w-18 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-seguranca-yellow via-yellow-500 to-yellow-600 flex items-center justify-center text-seguranca-black font-bold text-3xl sm:text-4xl shadow-xl flex-shrink-0 border-2 border-yellow-400/30">
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-xl sm:text-2xl lg:text-3xl mb-2 truncate">
                      {selectedEmployee.name}
                    </h4>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <Badge className="bg-blue-500/20 text-blue-300 border-2 border-blue-500/30 px-3 py-1.5 text-sm font-semibold">
                        {selectedEmployee.position?.name || 'Cargo não definido'}
                      </Badge>
                      {selectedEmployee.cpf && (
                        <span className="text-gray-400 text-sm font-medium">
                          CPF: {selectedEmployee.cpf}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={clearFilters}
                  variant="outline"
                  className="bg-transparent border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all whitespace-nowrap flex-shrink-0 font-semibold px-5 py-2.5 h-auto hover:scale-105"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Trocar Funcionário
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Dependents Table */}
        <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-2 border-gray-600/50 shadow-xl p-6" data-animate="fadeUp">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-seguranca-red/20 border-2 border-seguranca-red/30 shadow-lg">
                <Users className="h-6 w-6 text-seguranca-red" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg sm:text-xl">Lista de Dependentes</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedEmployeeId 
                    ? `Dependentes de ${selectedEmployee?.name || 'funcionário selecionado'}`
                    : 'Todos os dependentes cadastrados'
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setSelectedDependent(undefined);
                setIsFormModalOpen(true);
              }}
              disabled={!selectedEmployeeId}
              className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red shadow-lg shadow-seguranca-red/20 text-white font-semibold px-6 py-2.5 h-auto transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Novo Dependente
            </Button>
          </div>

          {!selectedEmployeeId ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-seguranca-lightgray mb-2">
                Selecione um funcionário
              </h3>
              <p className="text-gray-400 mb-4">
                Para gerenciar dependentes, primeiro selecione um funcionário na lista acima.
              </p>
              <Button
                onClick={() => {
                  // Scroll to filters
                  const filtersElement = document.querySelector('[data-animate]');
                  filtersElement?.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="outline"
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
              >
                Selecionar Funcionário
              </Button>
            </div>
          ) : (
            <DependentesTable
              dependents={dependents}
              onEdit={handleEditDependent}
              onDelete={handleDeleteDependent}
              isLoading={isLoading}
            />
          )}
        </Card>
      </div>

      {/* Form Modal */}
      <DependentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        dependent={selectedDependent}
        employeeId={selectedEmployeeId}
        employeeName={selectedEmployee?.name}
      />
    </StandardLayout>
  );
};

export default Dependentes;
