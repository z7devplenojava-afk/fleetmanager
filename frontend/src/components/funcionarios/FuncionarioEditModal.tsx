import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employeeService } from '@/services/employeeService';
import { UpdateEmployeeDTO } from '@/types/employee';
import { positionService, Position } from '@/services/positionService';
import { unitService, Unit } from '@/services/unitService';
import { userService } from '@/services/userService';
import { User } from '@/types/user';
import { Employee } from '@/types/employee';
import { Search, User as UserIcon, Building, Briefcase, Plus } from 'lucide-react';
import NovoCargoModal from '@/components/funcionarios/NovoCargoModal';
import { useToast } from '@/hooks/use-toast';

interface FuncionarioEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: Employee | null;
  onSuccess: () => void;
}

const FuncionarioEditModal: React.FC<FuncionarioEditModalProps> = ({ 
  open, 
  onOpenChange, 
  funcionario, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState<UpdateEmployeeDTO>({
    name: '',
    cpf: '',
    rg: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    maritalStatus: 'SINGLE',
    nationality: 'Brasileiro',
    registrationNumber: '',
    hireDate: '',
    status: 'ACTIVE',
    notes: '',
    position: { id: '' },
    unit: { id: '' },
    user: { id: '' }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para os dados dos selects
  const [positions, setPositions] = useState<Position[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Estados para busca e filtros
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Estados para modal de novo cargo
  const [novoCargoModalOpen, setNovoCargoModalOpen] = useState(false);

  // Carregar dados para os selects
  useEffect(() => {
    if (open) {
      loadSelectData();
    }
  }, [open]);

  // Filtrar usuários baseado no termo de busca
  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, users]);

  // Preencher formulário quando funcionário for selecionado
  useEffect(() => {
    if (funcionario && open) {
      setForm({
        name: funcionario.name || '',
        cpf: funcionario.cpf || '',
        rg: funcionario.rg || '',
        email: funcionario.email || '',
        phone: funcionario.phone || '',
        address: funcionario.address?.street || '',
        birthDate: funcionario.birthDate || '',
        maritalStatus: funcionario.maritalStatus || 'SINGLE',
        nationality: funcionario.nationality || 'Brasileiro',
        registrationNumber: funcionario.registrationNumber || '',
        hireDate: funcionario.hireDate || '',
        status: funcionario.status || 'ACTIVE',
        notes: funcionario.notes || '',
        position: { id: funcionario.position?.id || '' },
        unit: { id: funcionario.unit?.id || '' },
        user: { id: funcionario.user?.id || '' }
      });
    }
  }, [funcionario, open]);

  const loadSelectData = async () => {
    setLoadingData(true);
    try {
      const [positionsData, unitsData, usersData] = await Promise.all([
        positionService.getPositions(),
        unitService.getAllUnits(),
        userService.getUsers()
      ]);
      setPositions(positionsData);
      setUnits(unitsData);
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err) {
      console.error('Erro ao carregar dados dos selects:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    if (value) {
      setForm((prev) => ({ 
        ...prev, 
        [field]: { id: value } 
      }));
    } else {
      setForm((prev) => {
        const newForm = { ...prev };
        if (field === 'position') {
          newForm.position = { id: '' };
        } else if (field === 'unit') {
          newForm.unit = { id: '' };
        } else if (field === 'user') {
          newForm.user = { id: '' };
        }
        return newForm;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!funcionario) return;
    
    // Validações
    if (!form.user?.id) {
      setError('Usuário é obrigatório para editar um funcionário.');
      return;
    }
    if (!form.position?.id) {
      setError('Cargo é obrigatório para editar um funcionário.');
      return;
    }
    if (!form.address) {
      setError('Endereço é obrigatório para editar um funcionário.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await employeeService.updateEmployee(funcionario.id, form);
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso!",
      });
      onSuccess();
    } catch (err: any) {
      console.error('Erro ao atualizar funcionário:', err);
      
      // Tratar erros específicos
      if (err.message.includes('CPF já cadastrado')) {
        setError('CPF já cadastrado para outro funcionário');
        toast({
          title: "CPF Duplicado",
          description: "Este CPF já está cadastrado para outro funcionário.",
          variant: "destructive"
        });
      } else if (err.message.includes('Email já cadastrado')) {
        setError('Email já cadastrado para outro funcionário');
        toast({
          title: "Email Duplicado",
          description: "Este email já está cadastrado para outro funcionário.",
          variant: "destructive"
        });
      } else {
        setError('Erro ao atualizar funcionário.');
        toast({
          title: "Erro",
          description: err.message || "Não foi possível atualizar o funcionário.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (funcionario) {
      setForm({
        name: funcionario.name || '',
        cpf: funcionario.cpf || '',
        rg: funcionario.rg || '',
        email: funcionario.email || '',
        phone: funcionario.phone || '',
        address: funcionario.address?.street || '',
        birthDate: funcionario.birthDate || '',
        maritalStatus: funcionario.maritalStatus || 'SINGLE',
        nationality: funcionario.nationality || 'Brasileiro',
        registrationNumber: funcionario.registrationNumber || '',
        hireDate: funcionario.hireDate || '',
        status: funcionario.status || 'ACTIVE',
        notes: funcionario.notes || '',
        position: { id: funcionario.position?.id || '' },
        unit: { id: funcionario.unit?.id || '' },
        user: { id: funcionario.user?.id || '' }
      });
    }
    setError(null);
    setUserSearchTerm('');
  };

  const handleCargoCreated = (cargo: { id: string; name: string; description: string }) => {
    // Adicionar o novo cargo à lista
    setPositions(prev => [...prev, cargo]);
    // Selecionar automaticamente o novo cargo
    setForm(prev => ({ ...prev, position: { id: cargo.id } }));
  };

  if (!funcionario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-2 sm:p-4 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Editar Funcionário</DialogTitle>
          <p className="text-sm text-gray-400">
            Edite os dados do funcionário. Campos marcados com * são obrigatórios.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Relacionamentos Obrigatórios */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold flex items-center text-white">
              <UserIcon className="mr-2" size={20} />
              Relacionamentos Obrigatórios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seleção de Usuário */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">
                  Usuário do Sistema * <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Buscar usuário por nome, email ou username..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={form.user?.id || ''} 
                  onValueChange={(value) => handleSelectChange('user', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-gray-500">
                            {user.email} • {user.username} • {user.role}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-300">
                  O usuário selecionado será associado ao funcionário para acesso ao sistema.
                </p>
              </div>

                             {/* Seleção de Cargo */}
               <div className="space-y-2">
                 <Label className="text-sm font-medium text-gray-200">
                   Cargo * <span className="text-red-400">*</span>
                 </Label>
                 <div className="flex gap-2">
                   <Select 
                     value={form.position?.id || ''} 
                     onValueChange={(value) => handleSelectChange('position', value)}
                     className="flex-1"
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione um cargo" />
                     </SelectTrigger>
                     <SelectContent>
                       {positions.map((position) => (
                         <SelectItem key={position.id} value={position.id}>
                           <div className="flex items-center">
                             <Briefcase className="mr-2" size={16} />
                             <div className="flex flex-col">
                               <span className="font-medium">{position.name}</span>
                               {position.description && (
                                 <span className="text-xs text-gray-500">{position.description}</span>
                               )}
                             </div>
                           </div>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={() => setNovoCargoModalOpen(true)}
                     className="px-3 flex-shrink-0"
                     title="Criar novo cargo"
                   >
                     <Plus size={16} />
                   </Button>
                 </div>
                 <p className="text-xs text-gray-300">
                   Selecione um cargo existente ou crie um novo.
                 </p>
               </div>
            </div>
          </div>

          {/* Seção: Informações Pessoais */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Nome Completo *</Label>
                <Input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">CPF *</Label>
                <Input 
                  name="cpf" 
                  value={form.cpf} 
                  onChange={handleChange} 
                  required 
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">RG *</Label>
                <Input 
                  name="rg" 
                  value={form.rg} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Data de Nascimento *</Label>
                <Input 
                  name="birthDate" 
                  type="date" 
                  value={form.birthDate} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Estado Civil</Label>
                <Select 
                  value={form.maritalStatus} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, maritalStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Solteiro</SelectItem>
                    <SelectItem value="MARRIED">Casado</SelectItem>
                    <SelectItem value="DIVORCED">Divorciado</SelectItem>
                    <SelectItem value="WIDOWED">Viúvo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Nacionalidade</Label>
                <Input 
                  name="nationality" 
                  value={form.nationality} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          {/* Seção: Informações de Contato */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Informações de Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Email *</Label>
                <Input 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Telefone *</Label>
                <Input 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                  required 
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-200">Endereço *</Label>
                <Input 
                  name="address" 
                  value={form.address} 
                  onChange={handleChange} 
                  required 
                  placeholder="Rua, número, bairro, cidade - estado, CEP"
                />
              </div>
            </div>
          </div>

          {/* Seção: Informações Profissionais */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold flex items-center text-white">
              <Building className="mr-2" size={20} />
              Informações Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Número de Registro *</Label>
                <Input 
                  name="registrationNumber" 
                  value={form.registrationNumber} 
                  onChange={handleChange} 
                  required 
                  placeholder="EMP001"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Data de Admissão *</Label>
                <Input 
                  name="hireDate" 
                  type="date" 
                  value={form.hireDate} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Status *</Label>
                <Select 
                  value={form.status} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="VACATION">Férias</SelectItem>
                    <SelectItem value="TERMINATED">Demitido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Unidade (Opcional)</Label>
                <Select 
                  value={form.unit?.id || ''} 
                  onValueChange={(value) => handleSelectChange('unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center">
                          <Building className="mr-2" size={16} />
                          {unit.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção: Observações */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Observações</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Observações</Label>
                <textarea
                  name="notes"
                  value={form.notes || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded px-3 py-2 resize-none border border-gray-600 bg-gray-700 text-white"
                  placeholder="Observações sobre o funcionário..."
                />
              </div>
            </div>
          </div>
         
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
         
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Restaurar Dados
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingData || !form.user?.id || !form.position?.id}
              className="w-full sm:w-auto"
            >
              {loading ? 'Salvando...' : 'Atualizar Funcionário'}
            </Button>
          </DialogFooter>
                 </form>
       </DialogContent>
       
       {/* Modal de Novo Cargo */}
       <NovoCargoModal
         open={novoCargoModalOpen}
         onClose={() => setNovoCargoModalOpen(false)}
         onCargoCreated={handleCargoCreated}
       />
     </Dialog>
   );
 };

export default FuncionarioEditModal;
