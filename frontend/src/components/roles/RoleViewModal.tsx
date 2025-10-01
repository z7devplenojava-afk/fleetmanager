import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Users, Key, Calendar, Eye } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissionNames: string[];
  userCount?: number;
}

interface RoleViewModalProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RoleViewModal: React.FC<RoleViewModalProps> = ({
  role,
  isOpen,
  onClose
}) => {
  if (!role) return null;

  const getRoleColor = (roleName: string) => {
    const roleColors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800',
      'ADMIN': 'bg-blue-100 text-blue-800',
      'RH': 'bg-green-100 text-green-800',
      'SUPERVISOR': 'bg-yellow-100 text-yellow-800',
      'COLABORADOR': 'bg-gray-100 text-gray-800',
      'FINANCEIRO': 'bg-indigo-100 text-indigo-800',
      'TI_SUPORTE': 'bg-orange-100 text-orange-800',
      'AUDITOR': 'bg-pink-100 text-pink-800',
      'GESTOR': 'bg-teal-100 text-teal-800',
      'OPERACIONAL': 'bg-cyan-100 text-cyan-800'
    };
    return roleColors[roleName] || 'bg-gray-100 text-gray-800';
  };

  const categorizePermissions = (permissions: string[]) => {
    const categories: Record<string, string[]> = {
      'Sistema': [],
      'Usuários': [],
      'RH': [],
      'Financeiro': [],
      'Operacional': [],
      'Comercial': [],
      'Outros': []
    };

    permissions.forEach(permission => {
      if (permission.includes('SYSTEM') || permission.includes('MANAGE_SYSTEM')) {
        categories['Sistema'].push(permission);
      } else if (permission.includes('USER') || permission.includes('GROUP')) {
        categories['Usuários'].push(permission);
      } else if (permission.includes('EMPLOYEE') || permission.includes('PAYROLL') || permission.includes('PAYSLIP')) {
        categories['RH'].push(permission);
      } else if (permission.includes('FINANCIAL') || permission.includes('FINANCE')) {
        categories['Financeiro'].push(permission);
      } else if (permission.includes('FLEET') || permission.includes('OPERATIONAL')) {
        categories['Operacional'].push(permission);
      } else if (permission.includes('CLIENT') || permission.includes('CONTRACT') || permission.includes('PROPOSAL') || permission.includes('LEAD')) {
        categories['Comercial'].push(permission);
      } else {
        categories['Outros'].push(permission);
      }
    });

    return Object.entries(categories).filter(([_, perms]) => perms.length > 0);
  };

  const categorizedPermissions = categorizePermissions(role.permissionNames || []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-500" />
            <span>Detalhes do Role</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header do Role */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-blue-500" />
                  <div>
                    <CardTitle className="text-white text-xl">{role.name}</CardTitle>
                    <p className="text-gray-400">{role.description}</p>
                  </div>
                </div>
                <Badge className={getRoleColor(role.name)}>
                  {role.name}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-400">Total de Permissões</p>
                    <p className="text-xl font-semibold text-white">
                      {role.permissionNames?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-400">Usuários Ativos</p>
                    <p className="text-xl font-semibold text-white">
                      {role.userCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Categorias</p>
                    <p className="text-xl font-semibold text-white">
                      {categorizedPermissions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissões por Categoria */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Key className="h-5 w-5 text-purple-500" />
                <span>Permissões por Categoria</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorizedPermissions.map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      {category} ({permissions.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map((permission) => (
                        <Badge 
                          key={permission} 
                          variant="outline" 
                          className="text-xs border-gray-600 text-gray-300 bg-gray-700"
                        >
                          {permission}
                        </Badge>
                      ))}
                    </div>
                    <Separator className="mt-3 bg-gray-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista Completa de Permissões */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">Todas as Permissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(role.permissionNames || []).map((permission) => (
                  <Badge 
                    key={permission} 
                    variant="outline" 
                    className="text-xs border-gray-600 text-gray-300 bg-gray-700"
                  >
                    {permission}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 