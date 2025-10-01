import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  Mail, 
  Minimize2,
  Maximize2,
  User,
  Bot,
  Clock,
  CheckCircle
} from 'lucide-react';

interface SupportWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: string;
}

export function SupportWidget({ isOpen, onToggle }: SupportWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Olá! Sou o assistente virtual do SecuredGuard. Como posso ajudá-lo hoje?',
      isBot: true,
      timestamp: new Date().toISOString()
    }
  ]);

  const quickActions = [
    { text: 'Problemas de login', action: () => handleQuickAction('login') },
    { text: 'Erro no sistema', action: () => handleQuickAction('error') },
    { text: 'Dúvida sobre funcionalidade', action: () => handleQuickAction('feature') },
    { text: 'Falar com atendente', action: () => handleQuickAction('human') }
  ];

  const handleQuickAction = (type: string) => {
    let message = '';
    switch (type) {
      case 'login':
        message = 'Estou com problemas para fazer login no sistema';
        break;
      case 'error':
        message = 'Estou enfrentando um erro no sistema';
        break;
      case 'feature':
        message = 'Tenho uma dúvida sobre como usar uma funcionalidade';
        break;
      case 'human':
        message = 'Gostaria de falar com um atendente humano';
        break;
    }
    
    if (message) {
      setCurrentMessage(message);
    }
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentMessage,
      isBot: false,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Simular resposta do bot
    setTimeout(() => {
      const botResponse = getBotResponse(currentMessage);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        isBot: true,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, botMessage]);
    }, 1000);

    setCurrentMessage('');
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('login') || message.includes('senha')) {
      return 'Para problemas de login, você pode:\n\n1. Verificar se está usando o usuário e senha corretos\n2. Tentar redefinir sua senha clicando em "Esqueci minha senha"\n3. Entrar em contato conosco pelo telefone (11) 9999-9999\n\nPosso criar um ticket de suporte para você?';
    }
    
    if (message.includes('erro') || message.includes('bug')) {
      return 'Entendo que você está enfrentando um erro. Para ajudá-lo melhor, preciso de algumas informações:\n\n1. Em qual módulo o erro ocorreu?\n2. Qual mensagem de erro apareceu?\n3. O que você estava fazendo quando o erro aconteceu?\n\nVou criar um ticket de suporte para investigarmos o problema.';
    }
    
    if (message.includes('funcionalidade') || message.includes('como')) {
      return 'Ficarei feliz em ajudá-lo com dúvidas sobre funcionalidades!\n\nVocê pode:\n1. Consultar nossa Central de Ajuda com documentação completa\n2. Assistir nossos tutoriais em vídeo\n3. Verificar o FAQ com perguntas frequentes\n\nSobre qual módulo você tem dúvidas?';
    }
    
    if (message.includes('atendente') || message.includes('humano')) {
      return 'Vou conectá-lo com um de nossos atendentes. Você pode:\n\n📞 Ligar para: (11) 9999-9999\n📧 Enviar e-mail: suporte@securedguard.com\n🎫 Criar um ticket de suporte\n\nNosso horário de atendimento é de segunda a sexta, das 8h às 18h.';
    }
    
    return 'Obrigado pela sua mensagem! Para melhor atendê-lo, recomendo:\n\n1. Consultar nossa Central de Ajuda\n2. Criar um ticket de suporte detalhado\n3. Entrar em contato pelo telefone para urgências\n\nComo posso ajudá-lo especificamente?';
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 shadow-xl transition-all duration-300 ${isMinimized ? 'h-14' : 'h-96'}`}>
        <CardHeader className="p-3 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <CardTitle className="text-sm">Suporte SecuredGuard</CardTitle>
              <Badge variant="secondary" className="text-xs bg-green-500 text-white">
                Online
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-blue-700 p-1 h-6 w-6"
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-white hover:bg-blue-700 p-1 h-6 w-6"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}>
                    <div className="flex items-center space-x-1 mb-1">
                      {message.isBot ? (
                        <Bot className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.isBot ? 'Assistente' : 'Você'}
                      </span>
                      <span className="text-xs opacity-50">
                        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            {chatMessages.length === 1 && (
              <div className="p-3 border-t bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">Ações rápidas:</p>
                <div className="grid grid-cols-2 gap-1">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="text-xs h-8 justify-start"
                    >
                      {action.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-3 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Contact Options */}
              <div className="flex items-center justify-center space-x-4 mt-2 pt-2 border-t">
                <Button variant="ghost" size="sm" className="text-xs">
                  <Phone className="w-3 h-3 mr-1" />
                  Ligar
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Mail className="w-3 h-3 mr-1" />
                  E-mail
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Ticket
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}