import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  User, 
  UserCheck, 
  X,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { employeeService, Employee } from '@/services/employeeService';
import { equipmentAssignmentService } from '@/services/equipmentAssignmentService';
import { cn } from '@/lib/utils';

interface AssignEquipmentModalProps {
  equipment: {
    id: string;
    serialNumber: string;
    model?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignEquipmentModal: React.FC<AssignEquipmentModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Carregar funcionários quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  // Filtrar funcionários baseado na busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee => 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.cpf?.includes(searchTerm) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de funcionários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEquipment = async (employee: Employee) => {
    if (!equipment) return;

    try {
      setAssigning(employee.id);
      
      await equipmentAssignmentService.assignEquipment({
        equipmentId: equipment.id,
        employeeId: employee.id,
        notes: `Equipamento ${equipment.serialNumber} atribuído a ${employee.name}`
      });
      
      toast({
        title: "Sucesso!",
        description: `Equipamento ${equipment.serialNumber} atribuído a ${employee.name}`,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir equipamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atribuir equipamento ao funcionário",
        variant: "destructive",
      });
    } finally {
      setAssigning(null);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleConfirmAssignment = () => {
    if (selectedEmployee) {
      handleAssignEquipment(selectedEmployee);
    }
  };

  if (!equipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Atribuir Equipamento - {equipment.serialNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do equipamento */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-medium">Equipamento a ser atribuído:</h3>
                  <p className="text-sm text-muted-foreground">
                    {equipment.model || 'Sem modelo'} - {equipment.serialNumber}
                  </p>
                </div>
                {selectedEmployee && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      Selecionado: {selectedEmployee.name}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Busca de funcionários */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF, email ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedEmployee && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedEmployee(null)}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Seleção
                </Button>
              )}
            </div>

            {/* Lista de funcionários */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando funcionários...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {searchTerm 
                      ? 'Nenhum funcionário encontrado com os critérios de busca.'
                      : 'Nenhum funcionário disponível.'
                    }
                  </AlertDescription>
                </Alert>
              ) : (
                filteredEmployees.map((employee) => (
                  <Card 
                    key={employee.id} 
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      selectedEmployee?.id === employee.id && "ring-2 ring-primary bg-primary/5",
                      assigning === employee.id && "opacity-50"
                    )}
                    onClick={() => handleSelectEmployee(employee)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{employee.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{employee.position?.name || 'Sem cargo'}</span>
                              {employee.cpf && (
                                <span>CPF: {employee.cpf}</span>
                              )}
                              {employee.email && (
                                <span>{employee.email}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {employee.status === 'ACTIVE' ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Inativo
                            </Badge>
                          )}
                          {assigning === employee.id && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {selectedEmployee && (
            <Button 
              onClick={handleConfirmAssignment}
              disabled={assigning !== null}
              className="bg-primary hover:bg-primary/90"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atribuindo...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Atribuir a {selectedEmployee.name}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignEquipmentModal;
