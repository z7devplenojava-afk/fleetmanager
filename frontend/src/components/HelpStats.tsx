import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Book, 
  Video, 
  FileText, 
  Users, 
  Clock,
  TrendingUp,
  Star,
  MessageCircle
} from 'lucide-react';

interface HelpStatsProps {
  totalModules: number;
  totalTutorials: number;
  totalFaqItems: number;
  averageRating: number;
  totalViews: number;
  recentActivity: Array<{
    type: 'module' | 'tutorial' | 'faq';
    title: string;
    views: number;
    timeAgo: string;
  }>;
}

export function HelpStats({
  totalModules,
  totalTutorials,
  totalFaqItems,
  averageRating,
  totalViews,
  recentActivity
}: HelpStatsProps) {
  const stats = [
    {
      title: 'Módulos Documentados',
      value: totalModules,
      icon: Book,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Módulos do sistema'
    },
    {
      title: 'Tutoriais Disponíveis',
      value: totalTutorials,
      icon: Video,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Vídeos explicativos'
    },
    {
      title: 'Perguntas no FAQ',
      value: totalFaqItems,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Respostas disponíveis'
    },
    {
      title: 'Avaliação Média',
      value: averageRating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Satisfação dos usuários'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Atividade recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Conteúdo Mais Acessado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                    {activity.type === 'module' && <Book className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'tutorial' && <Video className="w-4 h-4 text-green-600" />}
                    {activity.type === 'faq' && <MessageCircle className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{activity.views} visualizações</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{activity.timeAgo}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type === 'module' && 'Módulo'}
                  {activity.type === 'tutorial' && 'Tutorial'}
                  {activity.type === 'faq' && 'FAQ'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card de feedback */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">Ajude-nos a melhorar!</h4>
              <p className="text-sm text-blue-700">
                Sua opinião é importante para aprimorarmos a Central de Ajuda
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className="w-4 h-4 text-yellow-400 fill-current cursor-pointer hover:scale-110 transition-transform" 
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}