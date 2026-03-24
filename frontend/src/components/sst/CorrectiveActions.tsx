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
  Calendar, 
  User, 
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Loader2,
  FileText,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sstService, CorrectiveAction, CreateCorrectiveActionDTO } from '@/services/sstService';
import CorrectiveActionFormModal from './CorrectiveActionFormModal';

const CorrectiveActions: React.FC = () => {
  const { toast } = useToast();
  
  // Estados
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);

  // Carregar ações corretivas
  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sstService.getCorrectiveActions();
      setActions(data);
    } catch (err) {
      console.error('Erro ao carregar ações corretivas:', err);
      setError('Erro ao carregar ações corretivas');
      toast({
        title: "Erro",
        description: "Não foi possível carregar as ações corretivas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar ações
  const filteredActions = actions.filter(action => {
    const matchesSearch = action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (action.responsibleName && action.responsibleName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter;
    const matchesOrigin = originFilter === 'all' || action.origin === originFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesOrigin;
  });

  // Criar/Atualizar ação
  const handleSubmitAction = async (data: CreateCorrectiveActionDTO) => {
    try {
      if (selectedAction) {
        await sstService.updateCorrectiveAction(selectedAction.id, data);
        toast({
          title: "Sucesso",
          description: "Ação corretiva atualizada com sucesso",
        });
      } else {
        await sstService.createCorrectiveAction(data);
        toast({
          title: "Sucesso",
          description: "Ação corretiva criada com sucesso",
        });
      }
      
      setShowCreateModal(false);
      setSelectedAction(null);
      loadActions();
    } catch (err) {
      console.error('Erro ao salvar ação corretiva:', err);
      toast({
        title: "Erro",
        description: selectedAction ? "Não foi possível atualizar a ação corretiva" : "Não foi possível criar a ação corretiva",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Concluir ação
  const handleCompleteAction = async (id: string) => {
    try {
      await sstService.completeCorrectiveAction(id);
      toast({
        title: "Sucesso",
        description: "Ação corretiva concluída com sucesso",
      });
      loadActions();
    } catch (err) {
      console.error('Erro ao concluir ação corretiva:', err);
      toast({
        title: "Erro",
        description: "Não foi possível concluir a ação corretiva",
        variant: "destructive",
      });
    }
  };

  // Abrir modal para edição
  const handleEditAction = (action: CorrectiveAction) => {
    setSelectedAction(action);
    setShowCreateModal(true);
  };

  const getOriginLabel = (origin: string) => {
    const labels: Record<string, string> = {
      'INSPECAO': 'Inspeção',
      'ACIDENTE': 'Acidente',
      'AUDITORIA': 'Auditoria',
      'NAO_CONFORMIDADE': 'Não Conformidade',
      'OUTROS': 'Outros'
    };
    return labels[origin] || origin;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICA':
        return 'bg-red-600 text-white';
      case 'ALTA':
        return 'bg-orange-500 text-white';
      case 'MEDIA':
        return 'bg-yellow-500 text-white';
      case 'BAIXA':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDA':
        return 'bg-green-100 text-green-800';
      case 'EM_ANDAMENTO':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDENTE':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELADA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-seguranca-lightgray text-sm sm:text-base">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Título, responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status" className="text-seguranca-lightgray text-sm sm:text-base">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority" className="text-seguranca-lightgray text-sm sm:text-base">Prioridade</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CRITICA">Crítica</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="origin" className="text-seguranca-lightgray text-sm sm:text-base">Origem</Label>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="INSPECAO">Inspeção</SelectItem>
                  <SelectItem value="ACIDENTE">Acidente</SelectItem>
                  <SelectItem value="AUDITORIA">Auditoria</SelectItem>
                  <SelectItem value="NAO_CONFORMIDADE">Não Conformidade</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ações Corretivas */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base sm:text-lg text-seguranca-lightgray">
            Ações Corretivas Pendentes ({filteredActions.length})
          </CardTitle>
          <Button
            onClick={() => {
              setSelectedAction(null);
              setShowCreateModal(true);
            }}
            className="bg-seguranca-red hover:bg-seguranca-darkred text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Ação
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
            </div>
          ) : filteredActions.length > 0 ? (
            <div className="space-y-4">
              {filteredActions.map((action) => {
                const daysUntilDue = getDaysUntilDue(action.dueDate);
                const isOverdue = daysUntilDue < 0;
                const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0;
                
                return (
                  <Card key={action.id} className="bg-seguranca-black border-gray-600">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <h3 className="font-semibold text-seguranca-lightgray text-base sm:text-lg">
                              {action.title}
                            </h3>
                            <Badge className={getPriorityColor(action.priority)}>
                              {action.priority}
                            </Badge>
                            <Badge className={getStatusColor(action.status)}>
                              {action.status}
                            </Badge>
                            <Badge className="bg-seguranca-graphite text-seguranca-lightgray border-gray-600">
                              {getOriginLabel(action.origin)}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-400">{action.description}</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm text-gray-400">
                            {action.responsibleName && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{action.responsibleName}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span className={isOverdue ? 'text-red-500' : isUrgent ? 'text-yellow-500' : ''}>
                                Vencimento: {new Date(action.dueDate).toLocaleDateString('pt-BR')}
                                {isOverdue && ' (Vencido)'}
                                {isUrgent && !isOverdue && ' (Urgente)'}
                              </span>
                            </div>
                            
                            {action.completionDate && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Concluída em {new Date(action.completionDate).toLocaleDateString('pt-BR')}</span>
                              </div>
                            )}
                            
                            {action.department && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{action.department}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAction(action)}
                            className="border-gray-600 text-seguranca-lightgray text-xs sm:text-sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          {action.status !== 'CONCLUIDA' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteAction(action.id)}
                              className="border-green-600 text-green-400 hover:bg-green-600/20 text-xs sm:text-sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Concluir
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-seguranca-lightgray">Nenhuma ação corretiva encontrada</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || originFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Clique em "Nova Ação" para criar a primeira ação corretiva'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <CorrectiveActionFormModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setSelectedAction(null);
          }
        }}
        action={selectedAction}
        onSubmit={handleSubmitAction}
      />
    </div>
  );
};

export default CorrectiveActions;

