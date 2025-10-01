import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const PermissionDebug: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Mostrar apenas em desenvolvimento ou para SUPER_ADMIN
  if (process.env.NODE_ENV !== 'development' && user.role !== 'SUPER_ADMIN') {
    return null;
  }

  const activePermissions = Object.entries(user.permissions)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => key);

  const inactivePermissions = Object.entries(user.permissions)
    .filter(([_, value]) => value === false)
    .map(([key, _]) => key);

  return (
    <Card className="mb-6 border-2 border-seguranca-yellow bg-seguranca-black">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-seguranca-lightgray">
          <span>🔍 Debug de Permissões</span>
          {user.role === 'SUPER_ADMIN' && <span className="text-seguranca-yellow">🟥</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 text-seguranca-lightgray">Informações do Usuário</h4>
            <div className="space-y-1 text-sm">
              <div className="text-seguranca-lightgray"><strong>Nome:</strong> {user.name}</div>
              <div className="text-seguranca-lightgray"><strong>Email:</strong> {user.email}</div>
              <div className="text-seguranca-lightgray"><strong>Role:</strong> 
                <Badge className="ml-2">
                  {user.role}
                  {user.role === 'SUPER_ADMIN' && ' 🟥'}
                </Badge>
              </div>
              <div className="text-seguranca-lightgray"><strong>ALL_PERMISSIONS:</strong> 
                <Badge className={`ml-2 ${user.permissions.ALL_PERMISSIONS ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.permissions.ALL_PERMISSIONS ? '✅ TRUE' : '❌ FALSE'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-seguranca-lightgray">Permissões Ativas ({activePermissions.length})</h4>
            <div className="flex flex-wrap gap-1">
              {activePermissions.map(permission => (
                <Badge key={permission} className="bg-green-100 text-green-800 text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {user.role === 'SUPER_ADMIN' && (
          <div className="mt-4 p-3 bg-seguranca-graphite border border-seguranca-yellow rounded-lg">
            <h4 className="font-semibold text-seguranca-yellow mb-2">🟥 SUPER_ADMIN Detectado</h4>
            <p className="text-seguranca-lightgray text-sm">
              Este usuário tem acesso total a todas as funcionalidades do sistema.
              A permissão ALL_PERMISSIONS está ativa, permitindo acesso irrestrito.
            </p>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-seguranca-lightgray">Ver todas as permissões</summary>
            <div className="mt-2">
              <h5 className="font-semibold mb-2 text-seguranca-lightgray">Permissões Inativas ({inactivePermissions.length})</h5>
              <div className="flex flex-wrap gap-1">
                {inactivePermissions.map(permission => (
                  <Badge key={permission} className="bg-gray-100 text-gray-600 text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}; 