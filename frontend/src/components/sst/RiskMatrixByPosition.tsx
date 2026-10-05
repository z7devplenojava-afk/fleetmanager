import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Building2,
  Edit,
  Trash2,
  Loader2,
  Shield,
  X,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type RiskCategory = 'FISICO' | 'QUIMICO' | 'BIOLOGICO' | 'ERGONOMICO' | 'ACIDENTE';
export type RiskLevel = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface RiskItem {
  riskId: string;
  riskName: string;
  category: RiskCategory;
  level: RiskLevel;
}

export interface RiskMatrix {
  id: string;
  positionId: string;
  positionName: string;
  department: string;
  risks: RiskItem[];
}

const STORAGE_KEY = 'sst_risk_matrices';

const DEFAULT_MATRICES: RiskMatrix[] = [
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
];

const RiskMatrixByPosition: React.FC = () => {
  const { toast } = useToast();
  
  // Estados de dados
  const [riskMatrices, setRiskMatrices] = useState<RiskMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Estado para exclusão
  const [matrixToDelete, setMatrixToDelete] = useState<RiskMatrix | null>(null);

  // Estados para modal de criação / edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatrixId, setEditingMatrixId] = useState<string | null>(null);
  const [formPositionName, setFormPositionName] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formRisks, setFormRisks] = useState<RiskItem[]>([]);

  // Campos para adicionar novo risco individual no form
  const [newRiskName, setNewRiskName] = useState('');
  const [newRiskCategory, setNewRiskCategory] = useState<RiskCategory>('FISICO');
  const [newRiskLevel, setNewRiskLevel] = useState<RiskLevel>('MEDIO');

  // Carregar dados salvos ou defaults
  useEffect(() => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRiskMatrices(parsed);
          setLoading(false);
          return;
        }
      }
      setRiskMatrices(DEFAULT_MATRICES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MATRICES));
    } catch (e) {
      console.error('Erro ao ler matrizes de risco do localStorage:', e);
      setRiskMatrices(DEFAULT_MATRICES);
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar no localStorage sempre que houver alteração
  const saveMatrices = (updated: RiskMatrix[]) => {
    setRiskMatrices(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao salvar matrizes de risco no localStorage:', e);
    }
  };

  // Excluir Matriz
  const confirmDeleteMatrix = () => {
    if (!matrixToDelete) return;

    const updated = riskMatrices.filter(m => m.id !== matrixToDelete.id);
    saveMatrices(updated);

    toast({
      title: "Matriz Excluída",
      description: `A matriz de riscos do cargo "${matrixToDelete.positionName}" foi removida com sucesso.`,
    });

    setMatrixToDelete(null);
  };

  // Abrir Modal de Criação
  const handleOpenCreate = () => {
    setEditingMatrixId(null);
    setFormPositionName('');
    setFormDepartment('Segurança');
    setFormRisks([]);
    setNewRiskName('');
    setNewRiskCategory('FISICO');
    setNewRiskLevel('MEDIO');
    setIsModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEdit = (matrix: RiskMatrix) => {
    setEditingMatrixId(matrix.id);
    setFormPositionName(matrix.positionName);
    setFormDepartment(matrix.department);
    setFormRisks([...matrix.risks]);
    setNewRiskName('');
    setNewRiskCategory('FISICO');
    setNewRiskLevel('MEDIO');
    setIsModalOpen(true);
  };

  // Adicionar risco temporário ao form
  const handleAddRiskToForm = () => {
    if (!newRiskName.trim()) {
      toast({
        title: "Nome do risco obrigatório",
        description: "Informe o nome do risco ocupacional para adicioná-lo.",
        variant: "destructive"
      });
      return;
    }

    const newRisk: RiskItem = {
      riskId: `r_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      riskName: newRiskName.trim(),
      category: newRiskCategory,
      level: newRiskLevel,
    };

    setFormRisks([...formRisks, newRisk]);
    setNewRiskName('');
  };

  // Remover risco do form
  const handleRemoveRiskFromForm = (riskId: string) => {
    setFormRisks(formRisks.filter(r => r.riskId !== riskId));
  };

  // Salvar Form (Criação ou Edição)
  const handleSaveMatrix = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formPositionName.trim()) {
      toast({
        title: "Cargo obrigatório",
        description: "Por favor informe o nome do cargo.",
        variant: "destructive"
      });
      return;
    }

    if (!formDepartment.trim()) {
      toast({
        title: "Setor obrigatório",
        description: "Por favor informe o setor/departamento.",
        variant: "destructive"
      });
      return;
    }

    if (editingMatrixId) {
      // Atualizar existente
      const updated = riskMatrices.map(m => {
        if (m.id === editingMatrixId) {
          return {
            ...m,
            positionName: formPositionName.trim(),
            department: formDepartment.trim(),
            risks: formRisks,
          };
        }
        return m;
      });
      saveMatrices(updated);
      toast({
        title: "Matriz Atualizada",
        description: `Matriz de riscos do cargo "${formPositionName}" foi atualizada com sucesso.`,
      });
    } else {
      // Criar nova
      const newMatrix: RiskMatrix = {
        id: `mat_${Date.now()}`,
        positionId: `pos_${Date.now()}`,
        positionName: formPositionName.trim(),
        department: formDepartment.trim(),
        risks: formRisks,
      };
      saveMatrices([...riskMatrices, newMatrix]);
      toast({
        title: "Matriz Criada",
        description: `Nova matriz de riscos criada para o cargo "${formPositionName}".`,
      });
    }

    setIsModalOpen(false);
  };

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
      'FISICO': 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
      'QUIMICO': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200',
      'BIOLOGICO': 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200',
      'ERGONOMICO': 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
      'ACIDENTE': 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'
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

  // Lista única de departamentos para o filtro
  const availableDepartments = Array.from(new Set(riskMatrices.map(m => m.department)));

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
                  {availableDepartments.map(dep => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                  {!availableDepartments.includes('Segurança') && <SelectItem value="Segurança">Segurança</SelectItem>}
                  {!availableDepartments.includes('Manutenção') && <SelectItem value="Manutenção">Manutenção</SelectItem>}
                  {!availableDepartments.includes('Administração') && <SelectItem value="Administração">Administração</SelectItem>}
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
            onClick={handleOpenCreate}
            className="bg-seguranca-red hover:bg-seguranca-darkred text-white text-sm sm:text-base font-semibold"
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
                <Card key={matrix.id} className="bg-seguranca-black border-gray-600 hover:border-gray-500 transition-colors">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="font-semibold text-seguranca-lightgray text-base sm:text-lg">
                            {matrix.positionName}
                          </h3>
                          <Badge className="bg-seguranca-graphite text-seguranca-lightgray border-gray-600">
                            <Building2 className="h-3 w-3 mr-1 text-seguranca-yellow" />
                            {matrix.department}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-400 font-medium">Riscos Ocupacionais:</p>
                          {matrix.risks.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {matrix.risks.map((risk) => (
                                <div key={risk.riskId} className="flex items-center gap-1.5 p-1 bg-gray-900/60 rounded border border-gray-700/60">
                                  <Badge className={getCategoryColor(risk.category)}>
                                    {risk.riskName}
                                  </Badge>
                                  <Badge className={getLevelColor(risk.level)}>
                                    {risk.level}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">Nenhum risco ocupacional registrado para este cargo.</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(matrix)}
                          className="border-gray-600 text-seguranca-lightgray hover:bg-gray-800 text-xs sm:text-sm"
                        >
                          <Edit className="h-4 w-4 mr-1 text-blue-400" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMatrixToDelete(matrix)}
                          className="border-gray-600 text-red-400 hover:text-red-300 hover:bg-red-950/40 text-xs sm:text-sm"
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

      {/* Modal de Criação / Edição de Matriz de Riscos */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-seguranca-yellow" />
              {editingMatrixId ? 'Editar Matriz de Riscos por Cargo' : 'Nova Matriz de Riscos por Cargo'}
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-xs sm:text-sm">
              Defina os riscos ocupacionais, categorias e níveis de severidade aplicados a este cargo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMatrix} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="formPositionName" className="text-xs font-semibold text-gray-200">
                  Nome do Cargo *
                </Label>
                <Input
                  id="formPositionName"
                  placeholder="Ex: Motorista, Mecânico, Vigilante"
                  value={formPositionName}
                  onChange={(e) => setFormPositionName(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="formDepartment" className="text-xs font-semibold text-gray-200">
                  Setor / Departamento *
                </Label>
                <Input
                  id="formDepartment"
                  placeholder="Ex: Operação, Manutenção, Segurança"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-white"
                  required
                />
              </div>
            </div>

            {/* Seção de Adicionar Riscos Ocupacionais */}
            <div className="border border-gray-700 rounded-xl p-3 sm:p-4 bg-seguranca-black/40 space-y-3">
              <Label className="text-xs font-bold text-seguranca-yellow flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Adicionar Risco Ocupacional
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-5 space-y-1">
                  <Label className="text-[11px] text-gray-300">Descrição do Risco</Label>
                  <Input
                    placeholder="Ex: Choque elétrico, Ruído excessivo"
                    value={newRiskName}
                    onChange={(e) => setNewRiskName(e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-white text-xs h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRiskToForm();
                      }
                    }}
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[11px] text-gray-300">Categoria</Label>
                  <Select value={newRiskCategory} onValueChange={(val: RiskCategory) => setNewRiskCategory(val)}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FISICO">Físico</SelectItem>
                      <SelectItem value="QUIMICO">Químico</SelectItem>
                      <SelectItem value="BIOLOGICO">Biológico</SelectItem>
                      <SelectItem value="ERGONOMICO">Ergonômico</SelectItem>
                      <SelectItem value="ACIDENTE">Acidente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] text-gray-300">Nível</Label>
                  <Select value={newRiskLevel} onValueChange={(val: RiskLevel) => setNewRiskLevel(val)}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIXO">Baixo</SelectItem>
                      <SelectItem value="MEDIO">Médio</SelectItem>
                      <SelectItem value="ALTO">Alto</SelectItem>
                      <SelectItem value="CRITICO">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddRiskToForm}
                    className="w-full bg-seguranca-yellow hover:bg-yellow-500 text-black font-semibold text-xs h-9"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Incluir
                  </Button>
                </div>
              </div>

              {/* Lista de Riscos Inseridos */}
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 block">
                  Riscos Atribuídos ({formRisks.length}):
                </span>
                {formRisks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formRisks.map((risk) => (
                      <div
                        key={risk.riskId}
                        className="flex items-center gap-1.5 p-1.5 bg-gray-800/80 rounded-lg border border-gray-600 text-xs"
                      >
                        <Badge className={getCategoryColor(risk.category)}>
                          {risk.riskName}
                        </Badge>
                        <Badge className={getLevelColor(risk.level)}>
                          {risk.level}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleRemoveRiskFromForm(risk.riskId)}
                          className="text-gray-400 hover:text-red-400 p-0.5 rounded transition-colors"
                          title="Remover risco"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    Nenhum risco adicionado. Adicione acima os riscos aplicáveis ao cargo.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-seguranca-red hover:bg-seguranca-darkred text-white font-semibold"
              >
                {editingMatrixId ? 'Salvar Alterações' : 'Criar Matriz'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmação de Exclusão */}
      <AlertDialog open={!!matrixToDelete} onOpenChange={(open) => !open && setMatrixToDelete(null)}>
        <AlertDialogContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir a Matriz de Riscos do cargo{' '}
              <strong className="text-white font-semibold">"{matrixToDelete?.positionName}"</strong>?
              Esta ação removerá todos os riscos ocupacionais associados a este cargo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white border-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMatrix}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Excluir Matriz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RiskMatrixByPosition;
