import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Message, messageService } from '../../services/messageService';
import { useToast } from '../../hooks/use-toast';
import { User, Users, Globe, Send, X } from 'lucide-react';

interface MessageFormModalProps {
  open: boolean;
  onClose: () => void;
  onMessageSent: () => void;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Group {
  id: number;
  name: string;
  displayName: string;
}

const MessageFormModal: React.FC<MessageFormModalProps> = ({
  open,
  onClose,
  onMessageSent
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'INDIVIDUAL' | 'GROUP' | 'GLOBAL'>('INDIVIDUAL');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [recipientId, setRecipientId] = useState<number | null>(null);
  const [recipientGroupId, setRecipientGroupId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      // Aqui você pode carregar usuários e grupos disponíveis
      // Por enquanto, vamos usar dados mockados
      setUsers([
        { id: 1, name: 'João Silva', email: 'joao@example.com' },
        { id: 2, name: 'Maria Santos', email: 'maria@example.com' },
        { id: 3, name: 'Pedro Costa', email: 'pedro@example.com' }
      ]);
      
      setGroups([
        { id: 1, name: 'GRUPO_ADMIN', displayName: 'Administradores' },
        { id: 2, name: 'GRUPO_RH', displayName: 'Recursos Humanos' },
        { id: 3, name: 'GRUPO_SUPERVISOR', displayName: 'Supervisores' }
      ]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do formulário",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (type === 'INDIVIDUAL' && !recipientId) {
      toast({
        title: "Erro",
        description: "Selecione um destinatário",
        variant: "destructive"
      });
      return;
    }

    if (type === 'GROUP' && !recipientGroupId) {
      toast({
        title: "Erro",
        description: "Selecione um grupo",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const messageData = {
        title: title.trim(),
        content: content.trim(),
        type,
        priority,
        recipientId: type === 'INDIVIDUAL' ? recipientId : undefined,
        recipientGroupId: type === 'GROUP' ? recipientGroupId : undefined
      };

      await messageService.sendMessage(messageData);
      
      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso"
      });
      
      handleClose();
      onMessageSent();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setType('INDIVIDUAL');
    setPriority('NORMAL');
    setRecipientId(null);
    setRecipientGroupId(null);
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INDIVIDUAL':
        return <User className="w-4 h-4" />;
      case 'GROUP':
        return <Users className="w-4 h-4" />;
      case 'GLOBAL':
        return <Globe className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Nova Mensagem</span>
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem para usuários ou grupos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Mensagem</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Individual</span>
                  </div>
                </SelectItem>
                <SelectItem value="GROUP">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Grupo</span>
                  </div>
                </SelectItem>
                <SelectItem value="GLOBAL">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Global</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Destinatário */}
          {type === 'INDIVIDUAL' && (
            <div className="space-y-2">
              <Label htmlFor="recipient">Destinatário</Label>
              <Select value={recipientId?.toString() || ''} onValueChange={(value) => setRecipientId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'GROUP' && (
            <div className="space-y-2">
              <Label htmlFor="group">Grupo</Label>
              <Select value={recipientGroupId?.toString() || ''} onValueChange={(value) => setRecipientGroupId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da mensagem"
              required
            />
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Baixa</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o conteúdo da mensagem"
              rows={6}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingData}>
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MessageFormModal; 