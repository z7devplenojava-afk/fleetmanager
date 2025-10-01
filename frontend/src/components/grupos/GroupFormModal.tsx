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
import { UserGroupData } from '@/types/user';
import { UserGroup } from '@/types/user';
import { X, Save, Plus } from 'lucide-react';

interface GroupFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  group?: UserGroupData;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'VIEW_PAYSLIP', label: 'Visualizar Holerites' },
  { key: 'DOWNLOAD_PAYSLIP', label: 'Baixar Holerites' },
  { key: 'EDIT_PROFILE', label: 'Editar Perfil' },
  { key: 'VIEW_EMPLOYEES', label: 'Visualizar Funcionários' },
  { key: 'MANAGE_EMPLOYEES', label: 'Gerenciar Funcionários' },
  { key: 'VIEW_REPORTS', label: 'Visualizar Relatórios' },
  { key: 'MANAGE_SYSTEM', label: 'Gerenciar Sistema' },
  { key: 'VIEW_CLIENTS', label: 'Visualizar Clientes' },
  { key: 'MANAGE_CLIENTS', label: 'Gerenciar Clientes' },
  { key: 'VIEW_CONTRACTS', label: 'Visualizar Contratos' },
  { key: 'MANAGE_CONTRACTS', label: 'Gerenciar Contratos' },
  // Permissões Financeiras Gerais
  { key: 'VIEW_FINANCIAL', label: 'Visualizar Financeiro' },
  { key: 'MANAGE_FINANCIAL', label: 'Gerenciar Financeiro' },
  
  // Contas a Pagar
  { key: 'VIEW_CONTAS_PAGAR', label: 'Visualizar Contas a Pagar' },
  { key: 'MANAGE_CONTAS_PAGAR', label: 'Gerenciar Contas a Pagar' },
  { key: 'APPROVE_CONTAS_PAGAR', label: 'Aprovar Contas a Pagar' },
  
  // Contas a Receber
  { key: 'VIEW_CONTAS_RECEBER', label: 'Visualizar Contas a Receber' },
  { key: 'MANAGE_CONTAS_RECEBER', label: 'Gerenciar Contas a Receber' },
  { key: 'APPROVE_CONTAS_RECEBER', label: 'Aprovar Contas a Receber' },
  
  // Pagamentos
  { key: 'VIEW_PAGAMENTOS', label: 'Visualizar Pagamentos' },
  { key: 'MANAGE_PAGAMENTOS', label: 'Gerenciar Pagamentos' },
  { key: 'EXECUTE_PAGAMENTOS', label: 'Executar Pagamentos' },
  
  // Fluxo de Caixa
  { key: 'VIEW_FLUXO_CAIXA', label: 'Visualizar Fluxo de Caixa' },
  { key: 'MANAGE_FLUXO_CAIXA', label: 'Gerenciar Fluxo de Caixa' },
  
  // Relatórios Financeiros
  { key: 'VIEW_RELATORIOS_FINANCEIROS', label: 'Visualizar Relatórios Financeiros' },
  { key: 'GENERATE_RELATORIOS_FINANCEIROS', label: 'Gerar Relatórios Financeiros' },
  { key: 'EXPORT_RELATORIOS_FINANCEIROS', label: 'Exportar Relatórios Financeiros' },
  { key: 'VIEW_FLEET', label: 'Visualizar Frota' },
  { key: 'MANAGE_FLEET', label: 'Gerenciar Frota' },
  { key: 'VIEW_DOCUMENTS', label: 'Visualizar Documentos' },
  { key: 'MANAGE_DOCUMENTS', label: 'Gerenciar Documentos' },
];

const GROUP_OPTIONS: { value: UserGroup; label: string }[] = [
  { value: 'GRUPO_SUPER_ADMIN', label: 'Super Administrador' },
  { value: 'GRUPO_ADMIN', label: 'Administrador' },
  { value: 'GRUPO_GESTOR', label: 'Gestor' },
  { value: 'GRUPO_RH', label: 'Recursos Humanos' },
  { value: 'GRUPO_DPE', label: 'Departamento Pessoal' },
  { value: 'GRUPO_SUPERVISOR', label: 'Supervisor' },
  { value: 'GRUPO_COLABORADORES', label: 'Colaboradores' },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.groupName || !formData.displayName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do grupo e nome de exibição são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing && group) {
        await groupService.updateGroup(group.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Grupo atualizado com sucesso.',
        });
      } else {
        await groupService.createGroup(formData);
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
      permissions: AVAILABLE_PERMISSIONS.map(p => p.key)
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{isEditing ? 'Editar Grupo' : 'Novo Grupo'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite as informações do grupo' : 'Crie um novo grupo de usuários'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <div key={permission.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission.key}
                    checked={formData.permissions.includes(permission.key)}
                    onCheckedChange={() => togglePermission(permission.key)}
                  />
                  <Label htmlFor={permission.key} className="text-sm cursor-pointer">
                    {permission.label}
                  </Label>
                </div>
              ))}
            </div>

            {/* Permissões Selecionadas */}
            {formData.permissions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Permissões Selecionadas ({formData.permissions.length})</Label>
                <div className="flex flex-wrap gap-1">
                  {formData.permissions.map((permission) => {
                    const permInfo = AVAILABLE_PERMISSIONS.find(p => p.key === permission);
                    return (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permInfo?.label || permission}
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