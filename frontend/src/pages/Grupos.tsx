import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { UserGroupsTable } from '@/components/grupos/UserGroupsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getGroupDisplayName, getGroupColor } from '@/utils/permissions';
import { useAOS } from '@/hooks/use-aos';

export default function Grupos() {
  const aos = useAOS();
  
  const handleEditGroup = (group: any) => {
    console.log('Editar grupo:', group);
    // O modal será aberto automaticamente pela tabela
  };

  const handleDeleteGroup = (groupId: string) => {
    console.log('Excluir grupo:', groupId);
    // A confirmação e exclusão são feitas automaticamente pela tabela
  };

  const handleManageUsers = (groupId: string) => {
    console.log('Gerenciar usuários do grupo:', groupId);
    // O modal será aberto automaticamente pela tabela
  };

  return (
    <StandardLayout 
      title="Grupos de Usuários"
      subtitle="Gerencie grupos de usuários e suas permissões"
    >
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-aos={aos.fadeUp} data-aos-delay="100" className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total de Grupos</CardTitle>
              <Badge variant="outline">8</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">8</div>
              <p className="text-xs text-seguranca-lightgray">
                Grupos ativos no sistema
              </p>
            </CardContent>
          </Card>

          <Card data-aos={aos.fadeUp} data-aos-delay="200" className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Super Admin</CardTitle>
              <Badge className={getGroupColor('GRUPO_SUPER_ADMIN')}>
                {getGroupDisplayName('GRUPO_SUPER_ADMIN')}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">1</div>
              <p className="text-xs text-seguranca-lightgray">
                Acesso total ao sistema
              </p>
            </CardContent>
          </Card>

          <Card data-aos={aos.fadeUp} data-aos-delay="300" className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Administradores</CardTitle>
              <Badge className={getGroupColor('GRUPO_ADMIN')}>
                {getGroupDisplayName('GRUPO_ADMIN')}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">2</div>
              <p className="text-xs text-seguranca-lightgray">
                Administração do sistema
              </p>
            </CardContent>
          </Card>

          <Card data-aos={aos.fadeUp} data-aos-delay="400" className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Colaboradores</CardTitle>
              <Badge className={getGroupColor('GRUPO_COLABORADORES')}>
                {getGroupDisplayName('GRUPO_COLABORADORES')}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">15</div>
              <p className="text-xs text-seguranca-lightgray">
                Colaboradores ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Grupos */}
        <div data-aos={aos.fadeUp} data-aos-delay="500">
          <UserGroupsTable
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
            onManageUsers={handleManageUsers}
          />
        </div>

        {/* Informações sobre o Sistema de Grupos */}
        <div data-aos={aos.fadeUp} data-aos-delay="600">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray">Sobre o Sistema de Grupos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-seguranca-lightgray">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Como Funciona</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Cada usuário pode pertencer a múltiplos grupos</li>
                    <li>• As permissões são combinadas de todos os grupos</li>
                    <li>• Grupos padrão são criados automaticamente</li>
                    <li>• Permissões podem ser personalizadas por grupo</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Tipos de Permissões</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• <strong>VIEW_*</strong> - Visualizar recursos</li>
                    <li>• <strong>MANAGE_*</strong> - Gerenciar recursos</li>
                    <li>• <strong>DOWNLOAD_*</strong> - Baixar arquivos</li>
                    <li>• <strong>EDIT_*</strong> - Editar informações</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardLayout>
  );
} 