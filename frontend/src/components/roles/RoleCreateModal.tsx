import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Save, X, Search, Key } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface RoleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const RoleCreateModal: React.FC<RoleCreateModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen]);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar permissões');
      }

      const permissionsData = await response.json();
      setPermissions(permissionsData);
    } catch (error: any) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar as permissões.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionToggle = (permissionName: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionName)) {
        return prev.filter(p => p !== permissionName);
      } else {
        return [...prev, permissionName];
      }
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro de Validação',
        description: 'O nome do role é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPermissions.length === 0) {
      toast({
        title: 'Erro de Validação',
        description: 'Selecione pelo menos uma permissão.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: selectedPermissions.map(name => ({ name }))
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar role');
      }

      toast({
        title: 'Sucesso',
        description: 'Role criado com sucesso!',
      });

      // Limpar formulário
      setFormData({ name: '', description: '' });
      setSelectedPermissions([]);
      setSearchTerm('');

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar role:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível criar o role.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Limpar formulário ao fechar
    setFormData({ name: '', description: '' });
    setSelectedPermissions([]);
    setSearchTerm('');
    onClose();
  };

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categorizePermissions = (permissions: Permission[]) => {
    const categories: Record<string, Permission[]> = {
      'Sistema': [],
      'Usuários': [],
      'RH': [],
      'Financeiro': [],
      'Operacional': [],
      'Comercial': [],
      'Outros': []
    };

    permissions.forEach(permission => {
      if (permission.name.includes('SYSTEM') || permission.name.includes('MANAGE_SYSTEM')) {
        categories['Sistema'].push(permission);
      } else if (permission.name.includes('USER') || permission.name.includes('GROUP')) {
        categories['Usuários'].push(permission);
      } else if (permission.name.includes('EMPLOYEE') || permission.name.includes('PAYROLL') || permission.name.includes('PAYSLIP')) {
        categories['RH'].push(permission);
      } else if (permission.name.includes('FINANCIAL') || permission.name.includes('FINANCE')) {
        categories['Financeiro'].push(permission);
      } else if (permission.name.includes('FLEET') || permission.name.includes('OPERATIONAL')) {
        categories['Operacional'].push(permission);
      } else if (permission.name.includes('CLIENT') || permission.name.includes('CONTRACT') || permission.name.includes('PROPOSAL') || permission.name.includes('LEAD')) {
        categories['Comercial'].push(permission);
      } else {
        categories['Outros'].push(permission);
      }
    });

    return Object.entries(categories).filter(([_, perms]) => perms.length > 0);
  };

  const categorizedPermissions = categorizePermissions(filteredPermissions);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-500" />
            <span>Criar Novo Role</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Nome do Role *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Digite o nome do role (ex: SUPERVISOR)"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Digite a descrição do role"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Permissões */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Key className="h-5 w-5 text-purple-500" />
                  <span>Permissões ({selectedPermissions.length} selecionadas) *</span>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar permissões..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {categorizedPermissions.map(([category, categoryPermissions]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">
                        {category} ({categoryPermissions.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.name)}
                              onCheckedChange={() => handlePermissionToggle(permission.name)}
                              className="border-gray-500"
                            />
                            <div className="flex-1">
                              <Label 
                                htmlFor={permission.id} 
                                className="text-sm font-medium text-white cursor-pointer"
                              >
                                {permission.name}
                              </Label>
                              <p className="text-xs text-gray-400 mt-1">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-4 bg-gray-600" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Criando...' : 'Criar Role'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
