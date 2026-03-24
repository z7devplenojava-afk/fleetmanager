import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, MapPin, Calendar, Shield, Users, Building } from 'lucide-react';
import { User as UserType, PermissionDTO } from '@/types/user';
import { getRoleDisplayName, getRoleColor } from '@/utils/permissions';
import { companyService } from '@/services/companyService';
import { useState, useEffect } from 'react';

interface UserViewModalProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserViewModal: React.FC<UserViewModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      companyService.getAllCompanies().then(setCompanies).catch(console.error);
    }
  }, [isOpen]);

  if (!user) return null;

  const getStatusText = (user: UserType) => {
    if (user.active === false) return 'Inativo';
    if (user.status === 'PENDING') return 'Pendente';
    if (user.status === 'ACTIVE') return 'Ativo';
    return 'Ativo';
  };

  const getStatusColor = (user: UserType) => {
    if (user.active === false) return 'bg-red-100 text-red-800';
    if (user.status === 'PENDING') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-seguranca-red" />
            Detalhes do Usuário
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Visualize todas as informações do usuário selecionado.
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
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-seguranca-red rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-seguranca-lightgray">
                    {user.name}
                  </h3>
                  <p className="text-gray-400">ID: {user.id}</p>
                </div>
                <div className="text-right">
                  <Badge className={getRoleColor(user.role)}>
                    {getRoleDisplayName(user.role)}
                    {user.role === 'SUPER_ADMIN' && ' 🟥'}
                  </Badge>
                  <Badge className={`ml-2 ${getStatusColor(user)}`}>
                    {getStatusText(user)}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-seguranca-lightgray">{user.email}</span>
                </div>

                {user.username && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-seguranca-lightgray">@{user.username}</span>
                  </div>
                )}

                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-seguranca-lightgray">{user.phone}</span>
                  </div>
                )}

                {user.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-seguranca-lightgray">{user.address}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-seguranca-lightgray">
                    {user.companyId ? (companies.find(c => c.id === user.companyId)?.name || 'Empresa Vinculada') : 'Sem Empresa'}
                  </span>
                </div>

                {user.department && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-seguranca-lightgray">{user.department}</span>
                  </div>
                )}

                {user.position && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-seguranca-lightgray">{user.position}</span>
                  </div>
                )}

                {user.employeeCode && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-seguranca-lightgray">Código: {user.employeeCode}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissões Individuais */}
          {user.individualPermissions && user.individualPermissions.length > 0 && (
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissões Individuais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.individualPermissions.map((perm: PermissionDTO) => (
                    <Badge key={perm.id} variant="outline">
                      {perm.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grupos */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Users className="h-5 w-5" />
                Grupos ({user.groups?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.groups && user.groups.length > 0 ? (
                <div className="space-y-3">
                  {user.groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-3 bg-seguranca-black rounded-lg border border-gray-600"
                    >
                      <div>
                        <h4 className="font-medium text-seguranca-lightgray">
                          {group.displayName}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {group.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {group.userCount} usuários
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-seguranca-lightgray">Usuário não está em nenhum grupo</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.createdAt && (
                  <div>
                    <label className="text-sm text-gray-400">Criado em:</label>
                    <p className="text-seguranca-lightgray">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}

                {user.updatedAt && (
                  <div>
                    <label className="text-sm text-gray-400">Última atualização:</label>
                    <p className="text-seguranca-lightgray">
                      {new Date(user.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}

                {user.username && (
                  <div>
                    <label className="text-sm text-gray-400">Nome de usuário:</label>
                    <p className="text-seguranca-lightgray">{user.username}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 