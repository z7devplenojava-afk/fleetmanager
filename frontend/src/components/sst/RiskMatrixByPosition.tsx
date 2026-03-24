import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  User, 
  Building2,
  Edit,
  Trash2,
  Loader2,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RiskMatrix {
  id: string;
  positionId: string;
  positionName: string;
  department: string;
  risks: {
    riskId: string;
    riskName: string;
    category: 'FISICO' | 'QUIMICO' | 'BIOLOGICO' | 'ERGONOMICO' | 'ACIDENTE';
    level: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  }[];
}

const RiskMatrixByPosition: React.FC = () => {
  const { toast } = useToast();
  
  // Estados
  const [riskMatrices, setRiskMatrices] = useState<RiskMatrix[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Dados mockados para demonstração
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRiskMatrices([
        {
          id: '1',
          positionId: 'pos1',
          positionName: 'Vigilante',
          department: 'Segurança',
          risks: [
            { riskId: 'r1', riskName: 'Exposição ao sol', category: 'FISICO', level: 'MEDIO' },
            { riskId: 'r2', riskName: 'Esforço físico', category: 'ERGONOMICO', level: 'BAIXO' }
          ]
        },
        {
          id: '2',
          positionId: 'pos2',
          positionName: 'Eletricista',
          department: 'Manutenção',
          risks: [
            { riskId: 'r3', riskName: 'Choque elétrico', category: 'ACIDENTE', level: 'CRITICO' },
            { riskId: 'r4', riskName: 'Queda de altura', category: 'ACIDENTE', level: 'ALTO' }
          ]
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  // Filtrar matrizes
  const filteredMatrices = riskMatrices.filter(matrix => {
    const matchesSearch = matrix.positionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         matrix.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || matrix.department === departmentFilter;
    const matchesCategory = categoryFilter === 'all' || 
      matrix.risks.some(r => r.category === categoryFilter);
    return matchesSearch && matchesDepartment && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'FISICO': 'bg-blue-100 text-blue-800',
      'QUIMICO': 'bg-yellow-100 text-yellow-800',
      'BIOLOGICO': 'bg-green-100 text-green-800',
      'ERGONOMICO': 'bg-purple-100 text-purple-800',
      'ACIDENTE': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICO':
        return 'bg-red-600 text-white';
      case 'ALTO':
        return 'bg-orange-500 text-white';
      case 'MEDIO':
        return 'bg-yellow-500 text-white';
      case 'BAIXO':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search" className="text-seguranca-lightgray text-sm sm:text-base">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Cargo, setor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="department" className="text-seguranca-lightgray text-sm sm:text-base">Setor</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Administração">Administração</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category" className="text-seguranca-lightgray text-sm sm:text-base">Categoria de Risco</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="FISICO">Físico</SelectItem>
                  <SelectItem value="QUIMICO">Químico</SelectItem>
                  <SelectItem value="BIOLOGICO">Biológico</SelectItem>
                  <SelectItem value="ERGONOMICO">Ergonômico</SelectItem>
                  <SelectItem value="ACIDENTE">Acidente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Matrizes */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base sm:text-lg text-seguranca-lightgray">
            Matriz de Riscos por Cargo ({filteredMatrices.length})
          </CardTitle>
          <Button
            onClick={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade de criar matriz será implementada em breve" })}
            className="bg-seguranca-red hover:bg-seguranca-darkred text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Matriz
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
            </div>
          ) : filteredMatrices.length > 0 ? (
            <div className="space-y-4">
              {filteredMatrices.map((matrix) => (
                <Card key={matrix.id} className="bg-seguranca-black border-gray-600">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="font-semibold text-seguranca-lightgray text-base sm:text-lg">
                            {matrix.positionName}
                          </h3>
                          <Badge className="bg-seguranca-graphite text-seguranca-lightgray border-gray-600">
                            <Building2 className="h-3 w-3 mr-1" />
                            {matrix.department}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-400 font-medium">Riscos Ocupacionais:</p>
                          <div className="flex flex-wrap gap-2">
                            {matrix.risks.map((risk) => (
                              <div key={risk.riskId} className="flex items-center gap-2">
                                <Badge className={getCategoryColor(risk.category)}>
                                  {risk.riskName}
                                </Badge>
                                <Badge className={getLevelColor(risk.level)}>
                                  {risk.level}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade de editar será implementada em breve" })}
                          className="border-gray-600 text-seguranca-lightgray text-xs sm:text-sm"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade de excluir será implementada em breve" })}
                          className="border-gray-600 text-red-400 hover:text-red-300 text-xs sm:text-sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-seguranca-lightgray">Nenhuma matriz de riscos encontrada</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || departmentFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Clique em "Nova Matriz" para criar a primeira matriz de riscos'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskMatrixByPosition;




