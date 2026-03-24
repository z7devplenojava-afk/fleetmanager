import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  FileText, 
  Users, 
  DollarSign, 
  Package, 
  Truck,
  BarChart3,
  Settings,
  MessageSquare,
  Calendar,
  Shield,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hasAnyPermission } from '@/utils/permissions';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  route: string;
  permissions: string[];
  description?: string;
}

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions: QuickAction[] = [
    {
      id: 'new-user',
      label: 'Novo Usuário',
      icon: Users,
      color: 'bg-blue-500',
      route: '/usuarios',
      permissions: ['USERS_CREATE', 'USERS_WRITE'],
      description: 'Cadastrar novo usuário'
    },
    {
      id: 'new-client',
      label: 'Novo Cliente',
      icon: Shield,
      color: 'bg-green-500',
      route: '/clientes',
      permissions: ['CLIENTS_CREATE', 'CLIENTS_WRITE'],
      description: 'Cadastrar novo cliente'
    },
    {
      id: 'new-contract',
      label: 'Novo Contrato',
      icon: FileText,
      color: 'bg-yellow-500',
      route: '/contratos',
      permissions: ['CONTRACTS_CREATE', 'CONTRACTS_WRITE'],
      description: 'Criar novo contrato'
    },
    {
      id: 'new-payment',
      label: 'Novo Pagamento',
      icon: DollarSign,
      color: 'bg-green-600',
      route: '/financeiro',
      permissions: ['FINANCIAL_CREATE', 'FINANCIAL_WRITE'],
      description: 'Registrar pagamento'
    },
    {
      id: 'new-employee',
      label: 'Novo Funcionário',
      icon: Users,
      color: 'bg-purple-500',
      route: '/funcionarios',
      permissions: ['EMPLOYEES_CREATE', 'EMPLOYEES_WRITE'],
      description: 'Cadastrar funcionário'
    },
    {
      id: 'new-equipment',
      label: 'Novo Equipamento',
      icon: Package,
      color: 'bg-orange-500',
      route: '/estoque',
      permissions: ['EQUIPMENTS_CREATE', 'EQUIPMENTS_WRITE'],
      description: 'Cadastrar equipamento'
    },
    {
      id: 'new-vehicle',
      label: 'Novo Veículo',
      icon: Truck,
      color: 'bg-teal-500',
      route: '/frota',
      permissions: ['EQUIPMENTS_CREATE', 'EQUIPMENTS_WRITE'],
      description: 'Cadastrar veículo'
    },
    {
      id: 'generate-report',
      label: 'Gerar Relatório',
      icon: BarChart3,
      color: 'bg-indigo-500',
      route: '/relatorios',
      permissions: ['REPORTS_GENERATE', 'REPORTS_READ'],
      description: 'Gerar relatório'
    },
    {
      id: 'new-message',
      label: 'Nova Mensagem',
      icon: MessageSquare,
      color: 'bg-cyan-500',
      route: '/mensagens',
      permissions: ['MESSAGES_CREATE', 'MESSAGES_WRITE'],
      description: 'Enviar mensagem'
    },
    {
      id: 'new-schedule',
      label: 'Nova Escala',
      icon: Calendar,
      color: 'bg-pink-500',
      route: '/operacional',
      permissions: ['EMPLOYEES_WRITE', 'CONTRACTS_WRITE'],
      description: 'Criar nova escala'
    },
    {
      id: 'system-config',
      label: 'Configurações',
      icon: Settings,
      color: 'bg-gray-500',
      route: '/configuracoes',
      permissions: ['SYSTEM_CONFIG'],
      description: 'Configurar sistema'
    },
    {
      id: 'commercial-lead',
      label: 'Novo Lead',
      icon: TrendingUp,
      color: 'bg-pink-600',
      route: '/comercial',
      permissions: ['LEADS_CREATE', 'LEADS_WRITE'],
      description: 'Cadastrar novo lead'
    }
  ];

  // Filtrar ações baseadas nas permissões do usuário
  const availableActions = quickActions.filter(action => 
    user?.permissions && hasAnyPermission(user.permissions, action.permissions as any)
  );

  // Agrupar ações em categorias para melhor organização
  const categorizedActions = {
    'Gestão': availableActions.filter(action => 
      ['new-user', 'new-employee', 'new-client'].includes(action.id)
    ),
    'Financeiro': availableActions.filter(action => 
      ['new-payment', 'generate-report'].includes(action.id)
    ),
    'Operacional': availableActions.filter(action => 
      ['new-contract', 'new-equipment', 'new-vehicle', 'new-schedule'].includes(action.id)
    ),
    'Comunicação': availableActions.filter(action => 
      ['new-message', 'new-lead'].includes(action.id)
    ),
    'Sistema': availableActions.filter(action => 
      ['system-config'].includes(action.id)
    )
  };

  const renderActionButton = (action: QuickAction) => {
    const Icon = action.icon;
    return (
      <Button
        key={action.id}
        variant="outline"
        className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-seguranca-graphite hover:border-seguranca-yellow transition-all group"
        onClick={() => navigate(action.route)}
      >
        <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="text-center">
          <span className="text-sm font-medium text-seguranca-lightgray group-hover:text-seguranca-yellow">
            {action.label}
          </span>
          {action.description && (
            <p className="text-xs text-gray-400 mt-1">{action.description}</p>
          )}
        </div>
      </Button>
    );
  };

  return (
    <Card className="bg-seguranca-black border-gray-700">
      <CardHeader>
        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
          <Plus className="h-5 w-5 text-seguranca-yellow" />
          Ações Rápidas
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Acesso rápido às principais funcionalidades do sistema
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(categorizedActions).map(([category, actions]) => {
          if (actions.length === 0) return null;
          
          return (
            <div key={category}>
              <h4 className="text-seguranca-lightgray font-medium mb-3 text-sm">
                {category}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {actions.map(renderActionButton)}
              </div>
            </div>
          );
        })}
        
        {availableActions.length === 0 && (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma ação disponível</p>
            <p className="text-gray-500 text-sm">
              Suas permissões não incluem ações rápidas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
