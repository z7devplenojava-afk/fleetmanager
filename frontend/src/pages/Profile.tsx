import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StandardLayout } from '@/components/StandardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Building, Edit, Save, X } from 'lucide-react';
import { getRoleDisplayName, getRoleColor } from '@/utils/permissions';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    department: user?.department || '',
    position: user?.position || '',
  });

  const handleSave = () => {
    // Aqui você faria a requisição para atualizar os dados
    console.log('Salvando dados:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      department: user?.department || '',
      position: user?.position || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <StandardLayout title="Meu Perfil" subtitle="Gerencie suas informações pessoais e profissionais">
      <PermissionGuard permission="PROFILE_READ">
        <div className="space-y-6">

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card de informações básicas */}
            <div className="md:col-span-2">
              <Card className="bg-seguranca-black border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center space-x-2 text-seguranca-lightgray">
                      <User className="h-5 w-5 text-seguranca-yellow" />
                      <span>Informações Pessoais</span>
                    </CardTitle>
                  <PermissionGuard permission="PROFILE_WRITE">
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          className="bg-seguranca-yellow hover:bg-yellow-600 text-black"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    )}
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-400">Nome Completo</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                      />
                    ) : (
                      <p className="mt-1 text-seguranca-lightgray font-medium">{user.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-400">E-mail</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                      />
                    ) : (
                      <p className="mt-1 text-seguranca-lightgray font-medium">{user.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-gray-400">Telefone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                      />
                    ) : (
                      <p className="mt-1 text-seguranca-lightgray font-medium">
                        {user.phone || 'Não informado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-gray-400">Endereço</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="mt-1 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                      />
                    ) : (
                      <p className="mt-1 text-seguranca-lightgray font-medium">
                        {user.address || 'Não informado'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department" className="text-gray-400">Departamento</Label>
                    {isEditing ? (
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="mt-1 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                      />
                    ) : (
                      <p className="mt-1 text-seguranca-lightgray font-medium">
                        {user.department || 'Não informado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="position" className="text-gray-400">Cargo</Label>
                    {isEditing ? (
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="mt-1 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                      />
                    ) : (
                      <p className="mt-1 text-seguranca-lightgray font-medium">
                        {user.position || 'Não informado'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card de informações do sistema */}
          <div>
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-seguranca-lightgray">
                  <Building className="h-5 w-5 text-seguranca-yellow" />
                  <span>Informações do Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Código do Funcionário</Label>
                  <p className="mt-1 text-seguranca-lightgray font-medium">
                    {user.employeeCode || 'Não informado'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm text-gray-400">Nível de Acesso</Label>
                  <div className="mt-1">
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-400">Data de Cadastro</Label>
                  <p className="mt-1 text-seguranca-lightgray font-medium">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div>
                  <Label className="text-sm text-gray-400">Último Acesso</Label>
                  <p className="mt-1 text-seguranca-lightgray font-medium">
                    {new Date().toLocaleString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </PermissionGuard>
    </StandardLayout>
  );
};

export default Profile; 