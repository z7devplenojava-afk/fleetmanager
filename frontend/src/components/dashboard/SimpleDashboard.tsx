import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Settings, Shield } from 'lucide-react';

const SimpleDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-seguranca-lightgray">
          Dashboard Interativo
        </h1>
        <p className="text-gray-400 mt-1">
          Bem-vindo de volta, {user.name}! Aqui está um resumo do seu sistema.
        </p>
      </div>

      {/* Cards de Teste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-seguranca-black border-gray-700 hover:border-seguranca-yellow transition-colors">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Users className="h-5 w-5 text-seguranca-yellow" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-seguranca-lightgray">124</p>
            <p className="text-gray-400 text-sm">Total de usuários</p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-black border-gray-700 hover:border-seguranca-yellow transition-colors">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Shield className="h-5 w-5 text-seguranca-yellow" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-seguranca-lightgray">Online</p>
            <p className="text-gray-400 text-sm">Status do sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-black border-gray-700 hover:border-seguranca-yellow transition-colors">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Settings className="h-5 w-5 text-seguranca-yellow" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-seguranca-lightgray">Ativo</p>
            <p className="text-gray-400 text-sm">Configurações do sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Usuário */}
      <Card className="bg-seguranca-black border-gray-700">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Nome:</span>
            <span className="text-seguranca-lightgray">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Email:</span>
            <span className="text-seguranca-lightgray">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Role:</span>
            <Badge variant="secondary" className="text-seguranca-yellow">
              {user.role}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleDashboard;
