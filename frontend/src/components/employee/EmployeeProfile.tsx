import React, { useState, useEffect } from 'react';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Briefcase,
  CreditCard,
  Building,
  UserCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmployeeProfile {
  id: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    rg: string;
    birthDate: string;
    gender: string;
    maritalStatus: string;
    address: {
      street: string;
      number: string;
      complement: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  professionalInfo: {
    position: string;
    department: string;
    admissionDate: string;
    salary: number;
    workSchedule: string;
    supervisor: string;
    employeeId: string;
  };
  bankingInfo: {
    bank: string;
    agency: string;
    account: string;
    accountType: string;
    pixKey?: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

import { employeeService } from '@/services/employeeService';

const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await employeeService.getEmployeeById(user.id);
      setProfile({
        id: data?.id || user.id,
        personalInfo: {
          name: data?.name || user.name || 'Usuário',
          email: data?.email || user.email || '',
          phone: data?.phone || '',
          cpf: data?.cpf || data?.document || '',
          rg: '',
          birthDate: data?.birthDate || '',
          gender: '',
          maritalStatus: '',
          address: {
            street: data?.address || '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
          }
        },
        professionalInfo: {
          position: (data as any)?.position?.name || user.role || 'Não informado',
          department: (data as any)?.department?.name || 'Geral',
          admissionDate: data?.hireDate || '',
          salary: data?.salario || 0,
          workSchedule: '',
          supervisor: '',
          employeeId: data?.registrationNumber || user.id
        },
        bankingInfo: {
          bank: '',
          agency: '',
          account: '',
          accountType: ''
        },
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        }
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setProfile({
        id: user.id,
        personalInfo: {
          name: user.name || 'Usuário',
          email: user.email || '',
          phone: '',
          cpf: '',
          rg: '',
          birthDate: '',
          gender: '',
          maritalStatus: '',
          address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' }
        },
        professionalInfo: {
          position: user.role || 'Não informado',
          department: 'Geral',
          admissionDate: '',
          salary: 0,
          workSchedule: '',
          supervisor: '',
          employeeId: user.id
        },
        bankingInfo: { bank: '', agency: '', account: '', accountType: '' },
        emergencyContact: { name: '', phone: '', relationship: '' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setFormData(profile);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!formData || !user?.id) return;

    setSaving(true);
    try {
      await employeeService.updateEmployee(user.id, {
        name: formData.personalInfo.name,
        email: formData.personalInfo.email,
        phone: formData.personalInfo.phone,
        cpf: formData.personalInfo.cpf,
        address: formData.personalInfo.address?.street
      });
      setProfile(formData);
      setEditing(false);
      
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(null);
    setEditing(false);
  };

  const updateFormData = (section: string, field: string, value: any) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      [section]: {
        ...formData[section as keyof EmployeeProfile],
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Não foi possível carregar o perfil
      </div>
    );
  }

  const currentData = editing && formData ? formData : profile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e profissionais</p>
        </div>
        <div className="flex space-x-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Salvando...' : 'Salvar'}</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEdit}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <Edit className="h-4 w-4" />
              <span>Editar Perfil</span>
            </Button>
          )}
        </div>
      </div>


      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <UserCircle className="h-5 w-5 mr-2 text-red-500" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={currentData.personalInfo.name}
                onChange={(e) => updateFormData('personalInfo', 'name', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={currentData.personalInfo.email}
                onChange={(e) => updateFormData('personalInfo', 'email', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={currentData.personalInfo.phone}
                onChange={(e) => updateFormData('personalInfo', 'phone', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={currentData.personalInfo.cpf}
                onChange={(e) => updateFormData('personalInfo', 'cpf', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={currentData.personalInfo.rg}
                onChange={(e) => updateFormData('personalInfo', 'rg', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={currentData.personalInfo.birthDate}
                onChange={(e) => updateFormData('personalInfo', 'birthDate', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="gender">Gênero</Label>
              <Select
                value={currentData.personalInfo.gender}
                onValueChange={(value) => updateFormData('personalInfo', 'gender', value)}
                disabled={!editing}
              >
                <SelectTrigger className={editing ? 'border-red-300' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="maritalStatus">Estado Civil</Label>
              <Select
                value={currentData.personalInfo.maritalStatus}
                onValueChange={(value) => updateFormData('personalInfo', 'maritalStatus', value)}
                disabled={!editing}
              >
                <SelectTrigger className={editing ? 'border-red-300' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solteiro">Solteiro</SelectItem>
                  <SelectItem value="Casado">Casado</SelectItem>
                  <SelectItem value="Divorciado">Divorciado</SelectItem>
                  <SelectItem value="Viúvo">Viúvo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-foreground mb-4">Endereço</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={currentData.personalInfo.address.street}
                  onChange={(e) => updateFormData('personalInfo', 'address', {...currentData.personalInfo.address, street: e.target.value})}
                  disabled={!editing}
                  className={editing ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={currentData.personalInfo.address.number}
                  onChange={(e) => updateFormData('personalInfo', 'address', {...currentData.personalInfo.address, number: e.target.value})}
                  disabled={!editing}
                  className={editing ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={currentData.personalInfo.address.complement}
                  onChange={(e) => updateFormData('personalInfo', 'address', {...currentData.personalInfo.address, complement: e.target.value})}
                  disabled={!editing}
                  className={editing ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={currentData.personalInfo.address.neighborhood}
                  onChange={(e) => updateFormData('personalInfo', 'address', {...currentData.personalInfo.address, neighborhood: e.target.value})}
                  disabled={!editing}
                  className={editing ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={currentData.personalInfo.address.city}
                  onChange={(e) => updateFormData('personalInfo', 'address', {...currentData.personalInfo.address, city: e.target.value})}
                  disabled={!editing}
                  className={editing ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={currentData.personalInfo.address.state}
                  onChange={(e) => updateFormData('personalInfo', 'address', {...currentData.personalInfo.address, state: e.target.value})}
                  disabled={!editing}
                  className={editing ? 'border-red-300' : ''}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={currentData.personalInfo.address.zipCode}
                  onChange={(e) => updateFormData('personalInfo', 'address', {...currentData.personalInfo.address, zipCode: e.target.value})}
                  disabled={!editing}
                  className={editing ? 'border-red-300' : ''}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-red-500" />
            Informações Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={currentData.professionalInfo.position}
                onChange={(e) => updateFormData('professionalInfo', 'position', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={currentData.professionalInfo.department}
                onChange={(e) => updateFormData('professionalInfo', 'department', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="admissionDate">Data de Admissão</Label>
              <Input
                id="admissionDate"
                type="date"
                value={currentData.professionalInfo.admissionDate}
                onChange={(e) => updateFormData('professionalInfo', 'admissionDate', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="employeeId">Matrícula</Label>
              <Input
                id="employeeId"
                value={currentData.professionalInfo.employeeId}
                onChange={(e) => updateFormData('professionalInfo', 'employeeId', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="supervisor">Supervisor</Label>
              <Input
                id="supervisor"
                value={currentData.professionalInfo.supervisor}
                onChange={(e) => updateFormData('professionalInfo', 'supervisor', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="workSchedule">Horário de Trabalho</Label>
              <Input
                id="workSchedule"
                value={currentData.professionalInfo.workSchedule}
                onChange={(e) => updateFormData('professionalInfo', 'workSchedule', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-red-500" />
            Dados Bancários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="bank">Banco</Label>
              <Input
                id="bank"
                value={currentData.bankingInfo.bank}
                onChange={(e) => updateFormData('bankingInfo', 'bank', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="agency">Agência</Label>
              <Input
                id="agency"
                value={currentData.bankingInfo.agency}
                onChange={(e) => updateFormData('bankingInfo', 'agency', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="account">Conta</Label>
              <Input
                id="account"
                value={currentData.bankingInfo.account}
                onChange={(e) => updateFormData('bankingInfo', 'account', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="accountType">Tipo de Conta</Label>
              <Select
                value={currentData.bankingInfo.accountType}
                onValueChange={(value) => updateFormData('bankingInfo', 'accountType', value)}
                disabled={!editing}
              >
                <SelectTrigger className={editing ? 'border-red-300' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Corrente">Conta Corrente</SelectItem>
                  <SelectItem value="Poupança">Conta Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="pixKey">Chave PIX</Label>
              <Input
                id="pixKey"
                value={currentData.bankingInfo.pixKey || ''}
                onChange={(e) => updateFormData('bankingInfo', 'pixKey', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
                placeholder="Opcional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Phone className="h-5 w-5 mr-2 text-red-500" />
            Contato de Emergência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="emergencyName">Nome</Label>
              <Input
                id="emergencyName"
                value={currentData.emergencyContact.name}
                onChange={(e) => updateFormData('emergencyContact', 'name', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="emergencyPhone">Telefone</Label>
              <Input
                id="emergencyPhone"
                value={currentData.emergencyContact.phone}
                onChange={(e) => updateFormData('emergencyContact', 'phone', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="emergencyRelationship">Parentesco</Label>
              <Input
                id="emergencyRelationship"
                value={currentData.emergencyContact.relationship}
                onChange={(e) => updateFormData('emergencyContact', 'relationship', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeProfile;
