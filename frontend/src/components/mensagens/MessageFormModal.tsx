import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, Users, Building2, Globe, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messageService } from '@/services/messageService';
import { userService } from '@/services/userService';
import { useDebounce } from '@/hooks/use-debounce';

interface MessageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message?: any | null;
  mode: 'create' | 'edit' | 'reply';
  replyTo?: any | null;
}

export const MessageFormModal: React.FC<MessageFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  message,
  mode,
  replyTo
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const debouncedRecipientSearch = useDebounce(recipientSearchTerm, 300);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'GROUP' | 'DEPARTMENT' | 'GLOBAL',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    recipientIds: [] as string[],
    departmentIds: [] as string[],
    sendEmail: false,
    sendNotification: true,
    scheduledAt: '',
    replyToId: undefined as string | undefined
  });

  useEffect(() => {
    if (mode === 'edit' && message) {
      setFormData({
        title: message.title || '',
        content: message.content || '',
        type: message.type || 'INDIVIDUAL',
        priority: message.priority || 'NORMAL',
        recipientIds: message.recipients?.map((r: any) => r.id) || [],
        departmentIds: message.departments?.map((d: any) => d.id) || [],
        sendEmail: message.sendEmail || false,
        sendNotification: message.sendNotification !== false,
        scheduledAt: message.scheduledAt || '',
        replyToId: undefined
      });
    } else if (mode === 'reply' && replyTo) {
      // Pré-preencher dados para resposta
      const replyTitle = replyTo.title?.startsWith('Re: ') 
        ? replyTo.title 
        : `Re: ${replyTo.title || ''}`;
      
      setFormData({
        title: replyTitle,
        content: '',
        type: 'INDIVIDUAL',
        priority: replyTo.priority || 'NORMAL',
        recipientIds: replyTo.sender?.id ? [replyTo.sender.id] : [],
        departmentIds: [],
        sendEmail: false,
        sendNotification: true,
        scheduledAt: '',
        replyToId: replyTo.id
      });
    } else if (mode === 'create') {
      // Resetar formulário para nova mensagem
      setFormData({
        title: '',
        content: '',
        type: 'INDIVIDUAL',
        priority: 'NORMAL',
        recipientIds: [],
        departmentIds: [],
        sendEmail: false,
        sendNotification: true,
        scheduledAt: '',
        replyToId: undefined
      });
    }
  }, [mode, message, replyTo]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersList = await userService.getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de usuários",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Erro",
        description: "Conteúdo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === 'INDIVIDUAL' && formData.recipientIds.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um destinatário",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      if (mode === 'create' || mode === 'reply') {
        const messageData = {
          ...formData,
          replyToId: mode === 'reply' ? formData.replyToId : undefined
        };
        await messageService.sendSystemMessage(messageData);
        toast({
          title: "Sucesso",
          description: mode === 'reply' ? "Resposta enviada com sucesso" : "Mensagem enviada com sucesso"
        });
      } else {
        // TODO: Implementar edição
        toast({
          title: "Info",
          description: "Edição será implementada em breve"
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        content: '',
        type: 'INDIVIDUAL',
        priority: 'NORMAL',
        recipientIds: [],
        departmentIds: [],
        sendEmail: false,
        sendNotification: true,
        scheduledAt: ''
      });
      setRecipientSearchTerm('');
      onClose();
    }
  };

  // Filtrar usuários baseado no termo de busca
  const filteredUsers = React.useMemo(() => {
    if (!debouncedRecipientSearch.trim()) {
      return users;
    }
    
    const searchLower = debouncedRecipientSearch.toLowerCase().trim();
    return users.filter(user => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      
      return name.includes(searchLower) || 
             email.includes(searchLower) || 
             username.includes(searchLower);
    });
  }, [users, debouncedRecipientSearch]);

  const selectedUsersCount = formData.recipientIds.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col bg-seguranca-graphite border-gray-600 text-white p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-gray-600">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-seguranca-yellow flex items-center gap-2">
            <Send className="h-5 w-5 sm:h-6 sm:w-6" />
            {mode === 'create' ? 'Nova Mensagem' : mode === 'reply' ? 'Responder Mensagem' : 'Editar Mensagem'}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm mt-2">
            {mode === 'create' 
              ? 'Preencha os dados para enviar uma nova mensagem'
              : mode === 'reply'
              ? 'Responda à mensagem selecionada'
              : 'Atualize as informações da mensagem'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-seguranca-lightgray">
                Título *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite o título da mensagem"
                className="bg-seguranca-black border-gray-600 text-white placeholder:text-gray-500"
                required
              />
            </div>

            {/* Tipo e Prioridade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-seguranca-lightgray flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tipo de Mensagem *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="INDIVIDUAL" className="text-white hover:bg-seguranca-black">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Individual
                      </div>
                    </SelectItem>
                    <SelectItem value="GROUP" className="text-white hover:bg-seguranca-black">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Grupo
                      </div>
                    </SelectItem>
                    <SelectItem value="DEPARTMENT" className="text-white hover:bg-seguranca-black">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Departamento
                      </div>
                    </SelectItem>
                    <SelectItem value="GLOBAL" className="text-white hover:bg-seguranca-black">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Global
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-seguranca-lightgray">
                  Prioridade *
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="LOW" className="text-green-400 hover:bg-seguranca-black">
                      Baixa
                    </SelectItem>
                    <SelectItem value="NORMAL" className="text-blue-400 hover:bg-seguranca-black">
                      Normal
                    </SelectItem>
                    <SelectItem value="HIGH" className="text-orange-400 hover:bg-seguranca-black">
                      Alta
                    </SelectItem>
                    <SelectItem value="URGENT" className="text-red-400 hover:bg-seguranca-black">
                      Urgente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Destinatários - apenas para tipo INDIVIDUAL */}
            {formData.type === 'INDIVIDUAL' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Label className="text-seguranca-lightgray text-sm font-medium">
                    Destinatários *
                  </Label>
                  {selectedUsersCount > 0 && (
                    <span className="text-xs text-gray-400">
                      {selectedUsersCount} {selectedUsersCount === 1 ? 'selecionado' : 'selecionados'}
                    </span>
                  )}
                </div>
                
                {/* Campo de busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome, email ou usuário..."
                    value={recipientSearchTerm}
                    onChange={(e) => setRecipientSearchTerm(e.target.value)}
                    className="pl-9 pr-9 bg-seguranca-black border-gray-600 text-white placeholder:text-gray-500"
                  />
                  {recipientSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setRecipientSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {loadingUsers ? (
                  <div className="flex items-center justify-center p-6 bg-seguranca-black rounded-lg border border-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin text-seguranca-yellow mr-2" />
                    <span className="text-gray-400 text-sm">Carregando usuários...</span>
                  </div>
                ) : (
                  <div className="bg-seguranca-black rounded-lg border border-gray-600 overflow-hidden">
                    {filteredUsers.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        {recipientSearchTerm ? (
                          <>
                            <Search className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                            <p>Nenhum usuário encontrado para "{recipientSearchTerm}"</p>
                            <button
                              type="button"
                              onClick={() => setRecipientSearchTerm('')}
                              className="text-seguranca-yellow hover:underline mt-2"
                            >
                              Limpar busca
                            </button>
                          </>
                        ) : (
                          <p>Nenhum usuário disponível</p>
                        )}
                      </div>
                    ) : (
                      <div className="max-h-48 sm:max-h-64 overflow-y-auto p-3 space-y-2">
                        {filteredUsers.map((user) => (
                          <div 
                            key={user.id} 
                            className="flex items-start space-x-3 p-2 rounded-lg hover:bg-seguranca-graphite transition-colors"
                          >
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={formData.recipientIds.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    recipientIds: [...formData.recipientIds, user.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    recipientIds: formData.recipientIds.filter(id => id !== user.id)
                                  });
                                }
                              }}
                              className="mt-1"
                            />
                            <Label
                              htmlFor={`user-${user.id}`}
                              className="text-seguranca-lightgray cursor-pointer flex-1 text-sm"
                            >
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {user.email || user.username}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    {recipientSearchTerm && filteredUsers.length > 0 && (
                      <div className="px-3 py-2 border-t border-gray-600 bg-seguranca-graphite text-xs text-gray-400">
                        Mostrando {filteredUsers.length} de {users.length} usuários
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-seguranca-lightgray text-sm font-medium">
                Mensagem *
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Digite o conteúdo da mensagem"
                className="min-h-[100px] sm:min-h-[120px] bg-seguranca-black border-gray-600 text-white placeholder:text-gray-500 resize-none"
                required
              />
            </div>

            {/* Opções */}
            <div className="space-y-3 bg-seguranca-black p-4 rounded-lg border border-gray-600">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendEmail: checked as boolean })
                  }
                />
                <Label htmlFor="sendEmail" className="text-seguranca-lightgray cursor-pointer text-sm">
                  Enviar por email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendNotification"
                  checked={formData.sendNotification}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendNotification: checked as boolean })
                  }
                />
                <Label htmlFor="sendNotification" className="text-seguranca-lightgray cursor-pointer text-sm">
                  Enviar notificação push
                </Label>
              </div>
            </div>
          </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end px-6 py-4 border-t border-gray-600 bg-seguranca-graphite flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-gray-600 text-white hover:bg-seguranca-black w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {mode === 'create' ? 'Enviar Mensagem' : 'Salvar Alterações'}
                  </span>
                  <span className="sm:hidden">
                    {mode === 'create' ? 'Enviar' : 'Salvar'}
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MessageFormModal;