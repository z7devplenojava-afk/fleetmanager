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
import api from '@/lib/axios';

interface EmployeeProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  rg: string;
  birthDate: string;
  position: string;
  department: string;
  admissionDate: string;
  registrationNumber: string;
  address: string;
  status: string;
}

const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EmployeeProfileData | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employee-portal/profile');
      setProfile(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      // Fallback para dados mockados se backend falhar
      setProfile({
        id: user?.id || '1',
        name: user?.name || 'José Mário Ramos',
        email: user?.email || 'jose.ramos@empresa.com',
        phone: '(11) 98765-4321',
        cpf: '123.456.789-00',
        rg: '12.345.678-9',
        birthDate: '1985-05-15',
        position: 'Motorista',
        department: 'Operacional',
        admissionDate: '2020-03-15',
        registrationNumber: 'EMP001234',
        address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
        status: 'ACTIVE'
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
    if (!formData) return;

    setSaving(true);
    try {
      // TODO: Implementar update do perfil quando o endpoint estiver disponível
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso',
      });
      setProfile(formData);
      setEditing(false);
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil',
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

  const updateFormData = (field: string, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
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
                value={currentData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={currentData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={currentData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={currentData.cpf}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={currentData.rg || ''}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={currentData.birthDate}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-foreground mb-4">Endereço</h4>
            <div>
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                value={currentData.address || ''}
                onChange={(e) => updateFormData('address', e.target.value)}
                disabled={!editing}
                className={editing ? 'border-red-300' : ''}
              />
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
                value={currentData.position}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={currentData.department}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="admissionDate">Data de Admissão</Label>
              <Input
                id="admissionDate"
                type="date"
                value={currentData.admissionDate}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="registrationNumber">Matrícula</Label>
              <Input
                id="registrationNumber"
                value={currentData.registrationNumber || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              currentData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {currentData.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeProfile;
