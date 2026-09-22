import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  BookOpen, 
  MessageSquare, 
  Download, 
  ExternalLink,
  Phone,
  Mail,
  FileText,
  Video,
  Settings,
  Users,
  DollarSign,
  Package,
  Shield
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  action: () => void;
  badge?: string;
}

interface HelpQuickActionsProps {
  onActionClick: (actionId: string) => void;
}

export function HelpQuickActions({ onActionClick }: HelpQuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'getting-started',
      title: 'Primeiros Passos',
      description: 'Guia completo para começar a usar o sistema',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => onActionClick('getting-started'),
      badge: 'Recomendado'
    },
    {
      id: 'video-tutorials',
      title: 'Tutoriais em Vídeo',
      description: 'Aprenda assistindo nossos tutoriais práticos',
      icon: Video,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => onActionClick('video-tutorials')
    },
    {
      id: 'contact-support',
      title: 'Falar com Suporte',
      description: 'Entre em contato com nossa equipe técnica',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => onActionClick('contact-support'),
      badge: 'Urgente'
    },
    {
      id: 'download-manual',
      title: 'Manual Completo',
      description: 'Baixe o manual em PDF para consulta offline',
      icon: Download,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => onActionClick('download-manual')
    },
    {
      id: 'system-status',
      title: 'Status do Sistema',
      description: 'Verifique o status e atualizações do sistema',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      action: () => onActionClick('system-status')
    },
    {
      id: 'feature-request',
      title: 'Sugerir Melhoria',
      description: 'Envie sugestões para melhorar o sistema',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      action: () => onActionClick('feature-request')
    }
  ];

  const moduleShortcuts = [
    { id: 'rh', title: 'RH', icon: Users, color: 'text-blue-600' },
    { id: 'financeiro', title: 'Financeiro', icon: DollarSign, color: 'text-green-600' },
    { id: 'estoque', title: 'Estoque', icon: Package, color: 'text-orange-600' },
    { id: 'operacional', title: 'Operacional', icon: Shield, color: 'text-red-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <div
                key={action.id}
                className="relative p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer group"
                onClick={action.action}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{action.title}</h4>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Atalhos para Módulos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExternalLink className="w-5 h-5 mr-2" />
            Acesso Rápido aos Módulos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {moduleShortcuts.map((module) => (
              <Button
                key={module.id}
                variant="outline"
                className="h-16 flex-col space-y-1"
                onClick={() => onActionClick(`module-${module.id}`)}
              >
                <module.icon className={`w-5 h-5 ${module.color}`} />
                <span className="text-xs">{module.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contatos de Emergência */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-800">
            <Phone className="w-5 h-5 mr-2" />
            Suporte de Emergência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-red-600" />
                <div>
                  <p className="font-medium text-sm">Suporte 24h</p>
                  <p className="text-xs text-muted-foreground">Para problemas críticos</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                (11) 9999-9999
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-red-600" />
                <div>
                  <p className="font-medium text-sm">E-mail Urgente</p>
                  <p className="text-xs text-muted-foreground">Resposta em até 2h</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                urgente@fluxbus.com
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}