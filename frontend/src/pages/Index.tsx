import React from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { StandardLayout } from '@/components/StandardLayout';
import { PermissionDebug } from '@/components/PermissionDebug';
import { DashboardCard, DashboardGrid } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Building, 
  FileText, 
  DollarSign, 
  Truck,
  LogOut,
  User,
  Settings,
  Shield,
  Database,
  Target,
  FileCheck,
  Calculator,
  ClipboardList,
  UserCog,
  UserCheck
} from 'lucide-react';
import { getRoleDisplayName, getRoleColor } from '@/utils/permissions';

const Index: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <StandardLayout>
      {/* Debug de permissões (apenas para SUPER_ADMIN ou desenvolvimento) */}
      <PermissionDebug />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-seguranca-lightgray mb-2">
          Bem-vindo, {user.name}!
        </h1>
        <p className="text-seguranca-lightgray">
          Acesse as funcionalidades disponíveis através do menu lateral.
          {user.role === 'SUPER_ADMIN' && (
            <span className="ml-2 text-seguranca-yellow font-semibold">
              🟥 Você tem acesso total ao sistema
            </span>
          )}
        </p>
      </div>

      {/* Cards de resumo baseados no role */}
      <DashboardGrid>
        {/* SUPER_ADMIN - Acesso total */}
        {user.role === 'SUPER_ADMIN' && (
          <>
            <DashboardCard
              title="Controle Total"
              value="🟥"
              description="Acesso irrestrito a todas as funcionalidades do sistema"
              icon={Shield}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Gerenciar Sistema",
                onClick: () => navigate('/configuracoes'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Usuários"
              value="🟥"
              description="Gerencie usuários e permissões do sistema"
              icon={UserCog}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Gerenciar Usuários",
                onClick: () => navigate('/usuarios'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Grupos"
              value="🟥"
              description="Configure grupos e permissões"
              icon={UserCheck}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Gerenciar Grupos",
                onClick: () => navigate('/grupos'),
                variant: 'default'
              }}
            />
          </>
        )}

        {/* ADMIN - Acesso administrativo */}
        {user.role === 'ADMIN' && (
          <>
            <DashboardCard
              title="Usuários"
              value="Gerenciar"
              description="Gerencie usuários e permissões do sistema"
              icon={UserCog}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/usuarios'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Grupos de Usuários"
              value="Gerenciar"
              description="Configure grupos e permissões"
              icon={UserCheck}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/grupos'),
                variant: 'default'
              }}
            />
          </>
        )}

        {/* COLABORADOR */}
        {user.role === 'COLABORADOR' && (
          <>
            <DashboardCard
              title="Meu Holerite"
              value="Visualizar"
              description="Visualize e baixe seus holerites mensais"
              icon={FileText}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/holerites'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Meu Perfil"
              value="Gerenciar"
              description="Gerencie suas informações pessoais"
              icon={User}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/profile'),
                variant: 'default'
              }}
            />
          </>
        )}

        {/* ADMIN, RH, SUPERVISOR */}
        {(user.role === 'ADMIN' || user.role === 'RH' || user.role === 'SUPERVISOR') && (
          <>
            <DashboardCard
              title="Funcionários"
              value="Gerenciar"
              description="Gerencie o quadro de funcionários"
              icon={Users}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/funcionarios'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Holerites"
              value="Gerenciar"
              description="Gerencie holerites dos funcionários"
              icon={FileText}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/holerites/envio'),
                variant: 'default'
              }}
            />
          </>
        )}

        {/* ADMIN */}
        {user.role === 'ADMIN' && (
          <>
            <DashboardCard
              title="Clientes"
              value="Gerenciar"
              description="Gerencie clientes e contratos"
              icon={Building}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/clientes'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Financeiro"
              value="Gerenciar"
              description="Controle financeiro e relatórios"
              icon={DollarSign}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/financeiro'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Frota"
              value="Gerenciar"
              description="Controle de veículos e manutenção"
              icon={Truck}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/frota'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Configurações"
              value="Sistema"
              description="Configurações gerais do sistema"
              icon={Settings}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => navigate('/configuracoes'),
                variant: 'default'
              }}
            />
          </>
        )}

        {/* Módulo Operacional */}
        {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
          <>
            <DashboardCard
              title="Operacional"
              value="Gerenciar"
              description="Controle operacional e escalas"
              icon={Shield}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => console.log('Acessar Operacional'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Serviços"
              value="Gerenciar"
              description="Controle de serviços prestados"
              icon={ClipboardList}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => console.log('Acessar Serviços'),
                variant: 'default'
              }}
            />
          </>
        )}

        {/* Módulo Comercial */}
        {user.role === 'ADMIN' && (
          <>
            <DashboardCard
              title="Leads"
              value="Gerenciar"
              description="Gestão de leads e oportunidades"
              icon={Target}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => console.log('Acessar Leads'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Propostas"
              value="Gerenciar"
              description="Controle de propostas comerciais"
              icon={FileCheck}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => console.log('Acessar Propostas'),
                variant: 'default'
              }}
            />

            <DashboardCard
              title="Orçamentos"
              value="Gerenciar"
              description="Gestão de orçamentos"
              icon={Calculator}
              iconColor="text-seguranca-yellow"
              action={{
                label: "Acessar",
                onClick: () => console.log('Acessar Orçamentos'),
                variant: 'default'
              }}
            />
          </>
        )}
      </DashboardGrid>

      {/* Informações do usuário */}
      <div className="mt-8 p-6 bg-seguranca-graphite rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold text-seguranca-lightgray mb-4">
          Informações da Sessão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Nome:</p>
            <p className="text-seguranca-lightgray font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Email:</p>
            <p className="text-seguranca-lightgray font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Cargo:</p>
            <Badge className={`${getRoleColor(user.role)} mt-1`}>
              {getRoleDisplayName(user.role)}
              {user.role === 'SUPER_ADMIN' && ' 🟥'}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-400">Departamento:</p>
            <p className="text-seguranca-lightgray font-medium">
              {user.department || 'Não informado'}
            </p>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default Index;
