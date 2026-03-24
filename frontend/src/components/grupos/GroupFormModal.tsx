import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { groupService } from '@/services/groupService';
import { permissionService } from '@/services/permissionService';
import { PermissionDTO, UserGroupData, UserGroup } from '@/types/user';
import { X, Save, Plus } from 'lucide-react';

interface GroupFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  group?: UserGroupData;
}

const GROUP_OPTIONS: { value: UserGroup; label: string }[] = [
  { value: 'GRUPO_SUPER_ADMIN', label: 'Super Administrador' },
  { value: 'GRUPO_ADMIN', label: 'Administrador' },
  { value: 'GRUPO_GESTOR', label: 'Gestor' },
  { value: 'GRUPO_RH', label: 'Recursos Humanos' },
  { value: 'GRUPO_DPE', label: 'Departamento Pessoal' },
  { value: 'GRUPO_SUPERVISOR', label: 'Supervisor' },
  { value: 'GRUPO_COLABORADORES', label: 'Colaboradores' },
  { value: 'GRUPO_OPERACIONAL', label: 'Operacional' },
  { value: 'GRUPO_FINANCEIRO', label: 'Financeiro' },
  { value: 'GRUPO_TI_SUPORTE', label: 'TI / Suporte' },
  { value: 'GRUPO_AUDITOR', label: 'Auditor' },
  { value: 'GRUPO_AUXILIARES', label: 'Auxiliares' },
];

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  group
}) => {
  const [formData, setFormData] = useState({
    groupName: '' as UserGroup,
    displayName: '',
    description: '',
    permissions: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionDTO[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const { toast } = useToast();

  const isEditing = !!group;

  useEffect(() => {
    if (open) {
      if (group) {
        setFormData({
          groupName: group.groupName,
          displayName: group.displayName,
          description: group.description,
          permissions: group.permissions || []
        });
      } else {
        setFormData({
          groupName: '' as UserGroup,
          displayName: '',
          description: '',
          permissions: []
        });
      }
    }
  }, [open, group]);

  useEffect(() => {
    if (!open) return;

    const fetchPermissions = async () => {
      try {
        setIsLoadingPermissions(true);
        const permissions = await permissionService.getAllPermissions();
        const sortedPermissions = permissions.sort((a, b) => {
          const labelA = (a.description || a.name || '').toLowerCase();
          const labelB = (b.description || b.name || '').toLowerCase();
          if (labelA < labelB) return -1;
          if (labelA > labelB) return 1;
          return 0;
        });
        setAvailablePermissions(sortedPermissions);
      } catch (error: any) {
        console.error('Erro ao carregar permissões', error);
        toast({
          title: 'Erro',
          description: error?.response?.data?.message || 'Não foi possível carregar as permissões.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, [open, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedGroupName = (formData.groupName || '').toString().trim();
    const normalizedDisplayName = formData.displayName.trim();

    if (!normalizedGroupName || !normalizedDisplayName) {
      toast({
        title: 'Erro',
        description: 'Nome do grupo e nome de exibição são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const sanitizedPermissions = Array.from(
      new Set(
        (formData.permissions || [])
          .filter((permission): permission is string => typeof permission === 'string')
          .map((permission) => permission.trim())
          .filter((permission) => permission.length > 0)
      )
    );

    const payload: Partial<UserGroupData> = {
      groupName: normalizedGroupName as UserGroup,
      displayName: normalizedDisplayName,
      description: formData.description?.trim() || undefined,
      permissions: sanitizedPermissions,
    };

    try {
      setLoading(true);
      
      if (isEditing && group) {
        await groupService.updateGroup(group.id, payload);
        toast({
          title: 'Sucesso',
          description: 'Grupo atualizado com sucesso.',
        });
      } else {
        await groupService.createGroup(payload);
        toast({
          title: 'Sucesso',
          description: 'Grupo criado com sucesso.',
        });
      }
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar grupo:', error);
      const backendMsg = error?.response?.data?.message;
      toast({
        title: 'Erro',
        description: backendMsg || 'Não foi possível salvar o grupo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      groupName: '' as UserGroup,
      displayName: '',
      description: '',
      permissions: []
    });
    onClose();
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const selectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: availablePermissions.map(p => p.name)
    }));
  };

  const clearAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: []
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{isEditing ? 'Editar Grupo' : 'Novo Grupo'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite as informações do grupo' : 'Crie um novo grupo de usuários'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Nome do Grupo */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Nome do Grupo *</Label>
            <Select 
              value={formData.groupName} 
              onValueChange={(value: UserGroup) => setFormData(prev => ({ ...prev, groupName: value }))}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de grupo" />
              </SelectTrigger>
              <SelectContent>
                {GROUP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome de Exibição */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Digite o nome de exibição do grupo"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite uma descrição para o grupo"
              rows={3}
            />
          </div>

          {/* Permissões */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Permissões</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllPermissions}
                >
                  Selecionar Todas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllPermissions}
                >
                  Limpar Todas
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-md p-4">
              {isLoadingPermissions ? (
                <div className="col-span-2 text-center text-sm text-gray-400">
                  Carregando permissões...
                </div>
              ) : availablePermissions.length === 0 ? (
                <div className="col-span-2 text-center text-sm text-gray-400">
                  Nenhuma permissão disponível.
                </div>
              ) : (
                availablePermissions.map((permission) => {
                  const permissionLabel = permission.description || permission.name;
                  return (
                    <div key={permission.id || permission.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.name}
                        checked={formData.permissions.includes(permission.name)}
                        onCheckedChange={() => togglePermission(permission.name)}
                      />
                      <Label htmlFor={permission.name} className="text-sm cursor-pointer">
                        {permissionLabel}
                      </Label>
                    </div>
                  );
                })
              )}
            </div>

            {/* Permissões Selecionadas */}
            {formData.permissions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Permissões Selecionadas ({formData.permissions.length})</Label>
                <div className="flex flex-wrap gap-1">
                  {formData.permissions.map((permission) => {
                    const permInfo = availablePermissions.find(p => p.name === permission);
                    return (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permInfo?.description || permInfo?.name || permission}
                        <button
                          type="button"
                          onClick={() => togglePermission(permission)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Atualizar' : 'Criar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 