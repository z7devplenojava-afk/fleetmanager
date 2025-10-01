import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Users, Save, X } from 'lucide-react';
import { User as UserType, UserRole } from '@/types/user';
import { getRoleDisplayName, getRoleColor } from '@/utils/permissions';
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { permissionService } from '@/services/permissionService';
import { PermissionDTO } from '@/types/user';

interface UserEditModalProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: '',
    active: true,
    whatsapp: '',
  });
  const [allPermissions, setAllPermissions] = useState<PermissionDTO[]>([]);
  const [individualPermissions, setIndividualPermissions] = useState<PermissionDTO[]>([]);
  const [isPermLoading, setIsPermLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        role: user.roles && user.roles.length > 0 ? (typeof user.roles[0] === 'string' ? user.roles[0] as string : (user.roles[0] as { name: string }).name) : '',
        active: user.active !== false,
        whatsapp: user.whatsapp || '',
      });
      setIndividualPermissions(user.individualPermissions || []);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      permissionService.getAllPermissions().then(setAllPermissions);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Enviar roles como array para o backend
      const updateData = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        roles: [{ name: formData.role }],
        active: formData.active,
        whatsapp: formData.whatsapp,
      };
      await userService.updateUser(user.id, updateData);
      toast({
        title: 'Sucesso!',
        description: 'Usuário atualizado com sucesso.',
      });
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro!',
        description: error.response?.data?.message || 'Erro ao atualizar usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPermission = async (permissionId: string) => {
    if (!user) return;
    setIsPermLoading(true);
    try {
      const updated = await userService.addUserPermissions(user.id, [permissionId]);
      setIndividualPermissions(updated);
      toast({ title: 'Permissão adicionada!' });
    } finally {
      setIsPermLoading(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!user) return;
    setIsPermLoading(true);
    try {
      const updated = await userService.removeUserPermissions(user.id, [permissionId]);
      setIndividualPermissions(updated);
      toast({ title: 'Permissão removida!' });
    } finally {
      setIsPermLoading(false);
    }
  };

  const roles: UserRole[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'SUPERVISOR',
    'RH',
    'FINANCEIRO',
    'TI_SUPORTE',
    'AUDITOR',
    'COLABORADOR',
  ];

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-seguranca-red" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Edite as informações básicas do usuário. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-seguranca-lightgray">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-seguranca-lightgray">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Digite o email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-seguranca-lightgray">
                    Nome de Usuário *
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Digite o nome de usuário"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-seguranca-lightgray">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => {
                      // Aceita apenas números
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData((prev) => ({ ...prev, whatsapp: value }));
                    }}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Somente números (ex: 11999999999)"
                    maxLength={20}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-seguranca-lightgray">
                    Função *
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value as UserRole)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <Badge className={getRoleColor(role)}>
                              {getRoleDisplayName(role)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">
                    Status
                  </Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                      className="rounded border-gray-600 bg-seguranca-black text-seguranca-red focus:ring-seguranca-red"
                    />
                    <Label htmlFor="active" className="text-seguranca-lightgray">
                      Usuário Ativo
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais (Somente Visualização) */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.phone && (
                  <div>
                    <Label className="text-sm text-gray-400">Telefone:</Label>
                    <p className="text-seguranca-lightgray">{user.phone}</p>
                  </div>
                )}
                
                {user.address && (
                  <div>
                    <Label className="text-sm text-gray-400">Endereço:</Label>
                    <p className="text-seguranca-lightgray">{user.address}</p>
                  </div>
                )}

                {user.department && (
                  <div>
                    <Label className="text-sm text-gray-400">Departamento:</Label>
                    <p className="text-seguranca-lightgray">{user.department}</p>
                  </div>
                )}

                {user.position && (
                  <div>
                    <Label className="text-sm text-gray-400">Cargo:</Label>
                    <p className="text-seguranca-lightgray">{user.position}</p>
                  </div>
                )}

                {user.employeeCode && (
                  <div>
                    <Label className="text-sm text-gray-400">Código do Funcionário:</Label>
                    <p className="text-seguranca-lightgray">{user.employeeCode}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Os campos adicionais (telefone, endereço, departamento, etc.) 
                  são apenas para visualização. Para editar esses campos, será necessário implementar 
                  uma extensão do modelo de usuário no backend.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Grupos Atuais */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Users className="h-5 w-5" />
                Grupos Atuais ({user.groups?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.groups && user.groups.length > 0 ? (
                <div className="space-y-2">
                  {user.groups.map((group) => (
                    <Badge key={group.id} variant="outline" className="mr-2 mb-2">
                      {group.displayName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Usuário não está em nenhum grupo</p>
              )}
              <p className="text-sm text-gray-400 mt-2">
                Para gerenciar grupos, use a página de Grupos.
              </p>
            </CardContent>
          </Card>

          {/* Permissões Individuais (apenas SUPER_ADMIN) */}
          {user && user.roles && user.roles.some(r => (typeof r === 'string' ? r : r.name) === 'SUPER_ADMIN') && (
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissões Individuais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {individualPermissions.length === 0 && <span className="text-gray-400">Nenhuma permissão individual atribuída.</span>}
                  {individualPermissions.map((perm) => (
                    <Badge key={perm.id} variant="outline" className="flex items-center gap-1">
                      {perm.name}
                      <button
                        type="button"
                        className="ml-1 text-red-500 hover:text-red-700"
                        onClick={() => handleRemovePermission(perm.id)}
                        disabled={isPermLoading}
                        title="Remover permissão"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={handleAddPermission}>
                  <SelectTrigger className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Adicionar permissão individual..." />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {allPermissions
                      .filter(p => !individualPermissions.some(ip => ip.id === p.id))
                      .map((perm) => (
                        <SelectItem key={perm.id} value={perm.id}>
                          {perm.name} <span className="text-xs text-gray-400 ml-2">{perm.description}</span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.name || !formData.email || !formData.username || !formData.role}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 