import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SystemNotification } from '@/services/operacionalService';

interface NotificacoesListProps {
  notificacoes: SystemNotification[];
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

const NotificacoesList: React.FC<NotificacoesListProps> = ({
  notificacoes,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [prioridadeFilter, setPrioridadeFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');

  const getPrioridadeVariant = (prioridade: string): 'destructive' | 'secondary' | 'outline' | 'default' => {
    switch (prioridade) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'secondary';
      case 'baixa':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'novo_cliente':
        return <Bell className="h-4 w-4" />;
      case 'contrato_vencendo':
        return <AlertTriangle className="h-4 w-4" />;
      case 'funcionario_atrasado':
        return <Clock className="h-4 w-4" />;
      case 'ocorrencia':
        return <AlertTriangle className="h-4 w-4" />;
      case 'escala':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTipoText = (tipo: string) => {
    switch (tipo) {
      case 'novo_cliente':
        return 'Novo Cliente';
      case 'contrato_vencendo':
        return 'Contrato Vencendo';
      case 'funcionario_atrasado':
        return 'Funcionário Atrasado';
      case 'ocorrencia':
        return 'Ocorrência';
      case 'escala':
        return 'Escala';
      default:
        return tipo;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const filteredNotificacoes = notificacoes.filter(notificacao => {
    const matchesSearch = 
      notificacao.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notificacao.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrioridade = prioridadeFilter === 'all' || notificacao.prioridade === prioridadeFilter;
    const matchesTipo = tipoFilter === 'all' || notificacao.tipo === tipoFilter;
    
    return matchesSearch && matchesPrioridade && matchesTipo;
  });

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh();
      toast({
        title: 'Sucesso!',
        description: 'Lista de notificações atualizada.',
      });
    } catch (error) {
      toast({
        title: 'Erro!',
        description: 'Erro ao atualizar lista de notificações.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
    toast({
      title: 'Sucesso!',
      description: 'Todas as notificações marcadas como lidas.',
    });
  };

  if (notificacoes.length === 0) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Nenhuma notificação encontrada
            </h3>
            <p className="text-seguranca-lightgray">
              Não há notificações no sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Pesquisar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
          
          <select
            value={prioridadeFilter}
            onChange={(e) => setPrioridadeFilter(e.target.value)}
            className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray"
          >
            <option value="all">Todas as prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
          
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray"
          >
            <option value="all">Todos os tipos</option>
            <option value="novo_cliente">Novo Cliente</option>
            <option value="contrato_vencendo">Contrato Vencendo</option>
            <option value="funcionario_atrasado">Funcionário Atrasado</option>
            <option value="ocorrencia">Ocorrência</option>
            <option value="escala">Escala</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          {notificacoesNaoLidas > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="space-y-4">
        {filteredNotificacoes.map((notificacao) => (
          <Card 
            key={notificacao.id} 
            className={`bg-seguranca-graphite border-gray-600 transition-all ${
              !notificacao.lida ? 'border-seguranca-yellow bg-seguranca-yellow/5' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  {getTipoIcon(notificacao.tipo)}
                  {notificacao.titulo}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getPrioridadeVariant(notificacao.prioridade)}>
                    {notificacao.prioridade}
                  </Badge>
                  <Badge variant="outline" className="text-gray-400 border-gray-600">
                    {getTipoText(notificacao.tipo)}
                  </Badge>
                  {!notificacao.lida && (
                    <Badge variant="outline" className="text-seguranca-yellow border-seguranca-yellow">
                      Nova
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">{notificacao.descricao}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {formatDate(notificacao.timestamp)}
                </p>
                <div className="flex items-center gap-2">
                  {!notificacao.lida && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkAsRead(notificacao.id)}
                      className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como lida
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(notificacao.id)}
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {filteredNotificacoes.length} de {notificacoes.length} notificação(ões)
        </span>
        {notificacoesNaoLidas > 0 && (
          <span className="text-seguranca-yellow">
            {notificacoesNaoLidas} não lida(s)
          </span>
        )}
      </div>
    </div>
  );
};

export default NotificacoesList; 