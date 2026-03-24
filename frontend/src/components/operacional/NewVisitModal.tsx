import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';
import { workPostService, WorkPost } from '@/services/workPostService';
import { clientService } from '@/services/clientService';
import { employeeService } from '@/services/employeeService';
import { Client } from '@/types/client';
import { Employee } from '@/types/employee';

interface NewVisitModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onVisitCreated?: () => void;
}

const NewVisitModal: React.FC<NewVisitModalProps> = ({ 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  onVisitCreated 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Usar controle externo se fornecido, senão usar interno
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const { toast } = useToast();
  
  // Estados para dados do banco
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [supervisors, setSupervisors] = useState<Employee[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    workPostId: '',
    clientId: '',
    assignedToId: '',
    supervisorId: '',
    scheduledAt: '',
    description: '',
    priority: 'MEDIUM'
  });

  // Carregar dados do banco quando o modal abrir
  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  const loadFormData = async () => {
    setLoadingData(true);
    try {
      const [postsData, clientsData, employeesData] = await Promise.all([
        workPostService.getAllWorkPosts(),
        clientService.getAllClients(),
        employeeService.getAllEmployees()
      ]);

      setWorkPosts(postsData || []);
      setClients(clientsData || []);
      setEmployees(employeesData || []);
      
      // Filtrar apenas funcionários com cargo de Supervisor
      const supervisorsData = (employeesData || []).filter(emp => 
        emp.position?.name?.toLowerCase().includes('supervisor')
      );
      
      setSupervisors(supervisorsData);

      console.log('✅ Dados carregados:', {
        postos: postsData?.length,
        clientes: clientsData?.length,
        funcionarios: employeesData?.length
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dados do formulário:', error);
      toast({
        title: 'Aviso',
        description: 'Alguns dados podem não estar disponíveis',
        variant: 'default'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mapear dados do formulário para o formato esperado pela API
      const scheduledDateTime = new Date(formData.scheduledAt);
      const visitDate = scheduledDateTime.toISOString().split('T')[0]; // yyyy-MM-dd
      const scheduledTime = scheduledDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
      
      // Buscar nome do funcionário responsável
      const assignedEmployee = employees.find(emp => emp.id === formData.assignedToId);
      const assignedTo = assignedEmployee ? assignedEmployee.name : '';
      
      // Buscar nome do posto de trabalho para usar como location se necessário
      const workPost = workPosts.find(wp => wp.id === formData.workPostId);
      const location = workPost ? workPost.name : '';
      
      const visitData = {
        title: formData.title || undefined,
        workPostId: formData.workPostId || undefined,
        supervisorId: formData.supervisorId || undefined,
        assignedTo: assignedTo,
        location: location,
        visitDate: visitDate,
        scheduledAt: scheduledTime,
        observations: formData.description || undefined,
        status: 'SCHEDULED' // Status padrão
      };
      
      console.log('🔗 Criando nova visita:', visitData);
      
      const response = await api.post('/api/visit-controls', visitData);
      
      console.log('✅ Visita criada com sucesso:', response.data);
      
      toast({
        title: "Sucesso",
        description: "Visita criada com sucesso!",
        variant: "default"
      });
      
      // Fechar modal e resetar formulário
      setOpen(false);
      setFormData({
        title: '',
        workPostId: '',
        clientId: '',
        assignedToId: '',
        supervisorId: '',
        scheduledAt: '',
        description: '',
        priority: 'MEDIUM'
      });
      
      // Notificar componente pai
      onVisitCreated?.();
      
    } catch (error) {
      console.error('❌ Erro ao criar visita:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a visita. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* DialogTrigger só aparece quando não há controle externo */}
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nova Visita
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Nova Visita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
              <span className="text-gray-300">Carregando dados...</span>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="title" className="text-gray-300">Título da Visita *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Ex: Inspeção de Segurança"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="workPostId" className="text-gray-300 text-sm sm:text-base">Setor / Posto de Trabalho *</Label>
                  <Select 
                    value={formData.workPostId} 
                    onValueChange={(value) => setFormData({ ...formData, workPostId: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                      <SelectValue placeholder="Selecione o posto" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 max-h-[300px]">
                      {workPosts.map((post) => (
                        <SelectItem key={post.id} value={post.id} className="text-white hover:bg-gray-600">
                          {post.name} {post.postCode ? `(${post.postCode})` : ''}
                        </SelectItem>
                      ))}
                      {workPosts.length === 0 && (
                        <SelectItem value="none" disabled className="text-gray-400">
                          Nenhum posto cadastrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="clientId" className="text-gray-300">Cliente *</Label>
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 max-h-[300px]">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id} className="text-white hover:bg-gray-600">
                          {client.name}
                        </SelectItem>
                      ))}
                      {clients.length === 0 && (
                        <SelectItem value="none" disabled className="text-gray-400">
                          Nenhum cliente cadastrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="assignedToId" className="text-gray-300 text-sm sm:text-base">Funcionário Responsável *</Label>
                  <Select 
                    value={formData.assignedToId} 
                    onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 max-h-[300px]">
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-white hover:bg-gray-600">
                          {emp.name} {emp.registrationNumber ? `(${emp.registrationNumber})` : ''}
                        </SelectItem>
                      ))}
                      {employees.length === 0 && (
                        <SelectItem value="none" disabled className="text-gray-400">
                          Nenhum funcionário cadastrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supervisorId" className="text-gray-300">Supervisor *</Label>
                  <Select 
                    value={formData.supervisorId} 
                    onValueChange={(value) => setFormData({ ...formData, supervisorId: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                      <SelectValue placeholder="Selecione o supervisor" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 max-h-[300px]">
                      {supervisors.length > 0 ? supervisors.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id} className="text-white hover:bg-gray-600">
                          {sup.name}
                        </SelectItem>
                      )) : (
                        <SelectItem value="none" disabled className="text-gray-400">
                          Nenhum supervisor encontrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="priority" className="text-gray-300 text-sm sm:text-base">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="LOW" className="text-white">Baixa</SelectItem>
                      <SelectItem value="MEDIUM" className="text-white">Média</SelectItem>
                      <SelectItem value="HIGH" className="text-white">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduledAt" className="text-gray-300">Data e Hora *</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300 text-sm sm:text-base">Descrição / Observações</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Detalhes da visita..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-3 sm:pt-4 border-t border-gray-600">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 w-full sm:w-auto order-2 sm:order-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || loadingData}
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto order-1 sm:order-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Visita
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewVisitModal;
