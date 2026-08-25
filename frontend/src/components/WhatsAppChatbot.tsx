import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X, User, Mail, Phone, Send, Globe, MessageSquare, CheckCircle2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import chatIntegrationService from '@/services/chatIntegrationService';

const WhatsAppChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [chatMode, setChatMode] = useState<'whatsapp' | 'website' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number | string;
    text: string;
    sender: 'user' | 'bot' | 'agent';
    timestamp: Date;
    senderName?: string;
  }>>([{
    id: 1, text: 'Olá! 👋 Sou o assistente virtual do Fluxbus. Como posso ajudá-lo hoje?', sender: 'bot', timestamp: new Date()
  }]);
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Polling para verificar se o agente respondeu no painel (com backoff e visibility)
  useEffect(() => {
    if (!conversationId || chatMode !== 'website') return;

    let mounted = true;
    let interval = 15000; // 15s padrão
    let failureCount = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isVisible = !document.hidden;

    const onVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const tick = async () => {
      if (!mounted) return;
      // Pausa quando a aba está oculta
      if (!isVisible) {
        timeoutId = setTimeout(tick, interval);
        return;
      }
      try {
        const messages = await chatIntegrationService.getMessages(conversationId);
        if (messages && messages.length > 0 && mounted) {
          setChatMessages(prev => {
            const newMsgs = messages
              .filter(m => !prev.some(p => String(p.id) === String(m.id)))
              .map(m => ({
                id: m.id,
                text: m.content,
                sender: (m.senderType === 'AGENT' ? 'agent' : m.senderType === 'BOT' ? 'bot' : 'user') as 'user' | 'bot' | 'agent',
                timestamp: new Date(m.timestamp),
                senderName: m.senderName,
              }));
            return [...prev, ...newMsgs];
          });
        }
        // Sucesso: reseta o intervalo para 15s se estava maior
        failureCount = 0;
        if (interval > 15000) interval = 15000;
      } catch (err) {
        failureCount += 1;
        if (failureCount >= 3) {
          // Backoff: 15s → 30s → 60s → 120s
          interval = Math.min(interval * 2, 120000);
        }
      }
      if (mounted) {
        timeoutId = setTimeout(tick, interval);
      }
    };

    // Primeira carga após 8s (deixa a UI respirar)
    timeoutId = setTimeout(tick, 8000);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVisibility);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [conversationId, chatMode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (step === 1 && !formData.name.trim()) {
      toast.error('Por favor, informe seu nome.');
      return;
    }
    if (step === 2 && !formData.email.trim()) {
      toast.error('Por favor, informe seu email.');
      return;
    }
    if (step === 3 && !formData.phone.trim()) {
      toast.error('Por favor, informe seu telefone.');
      return;
    }
    
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleSubmitWhatsApp = async () => {
    if (!formData.message.trim()) {
      toast.error('Por favor, digite sua mensagem.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Cria a conversa no painel interno como canal WhatsApp
      const conv = await chatIntegrationService.createConversation({
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        channel: 'WHATSAPP',
      });
      setConversationId(conv.id);

      // Envia a mensagem para o painel de Atendimento
      await chatIntegrationService.sendMessage({
        conversationId: conv.id,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        content: formData.message,
        channel: 'WHATSAPP',
        metadata: { source: 'public_chatbot' },
      });

      // Mostra confirmação visual e mantém a conversa aberta para chat ao vivo
      toast.success('✅ Mensagem enviada para nosso Atendimento! Aguarde a resposta aqui mesmo.');

      // Abre o chat ao vivo para o cliente acompanhar a resposta em tempo real
      setChatMode('website');
      setStep(5);
    } catch (error) {
      toast.error('Erro ao enviar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initializeWebChat = async () => {
    // Cria a conversa no backend para que apareça no painel administrativo
    try {
      const conv = await chatIntegrationService.createConversation({
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        channel: 'CHAT_WEB',
      });
      setConversationId(conv.id);
    } catch (err) {
      // Continua mesmo se falhar
    }
  };

  const handleSendWebsiteMessage = async () => {
    if (!currentMessage.trim()) return;

    if (!conversationId) {
      await initializeWebChat();
    }

    const newMessage = {
      id: Date.now(),
      text: currentMessage,
      sender: 'user' as const,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, newMessage]);
    const messageText = currentMessage;
    setCurrentMessage('');

    // Enviar para o backend (aparecerá no painel administrativo)
    try {
      await chatIntegrationService.sendMessage({
        conversationId: conversationId || undefined,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        content: messageText,
        channel: 'CHAT_WEB',
        metadata: { source: 'public_chatbot_website' },
      });
    } catch (err) {
      console.warn('Falha ao enviar para o backend', err);
    }

    // Resposta automática do bot
    setTimeout(() => {
      let botResponseText = '✅ Mensagem recebida! Nossa equipe foi notificada e responderá em breve aqui mesmo. Caso prefira, pode nos contatar pelo WhatsApp.';
      
      const curriculumKeywords = ['curriculo', 'currículo', 'cv', 'trabalho', 'vaga', 'emprego', 'contratação', 'carreira'];
      const demoKeywords = ['demonstração', 'demo', 'conhecer', 'apresentação', 'ver o sistema'];
      const priceKeywords = ['preço', 'valor', 'custo', 'plano', 'orçamento', 'quanto custa'];
      const lowerMessage = messageText.toLowerCase();
      
      if (curriculumKeywords.some(keyword => lowerMessage.includes(keyword))) {
        botResponseText = '📄 Para enviar seu currículo, acesse a página "Trabalhe Conosco" no portal. Lá você pode se cadastrar para vagas disponíveis. Nossa equipe de RH analisará seu perfil!';
      } else if (demoKeywords.some(keyword => lowerMessage.includes(keyword))) {
        botResponseText = '🎯 Ótimo! Você pode solicitar uma demonstração clicando no botão "Solicitar Demonstração" no topo da página. Ou se preferir, deixe seus dados aqui que agendamos para você!';
      } else if (priceKeywords.some(keyword => lowerMessage.includes(keyword))) {
        botResponseText = '💰 Os valores variam de acordo com o porte da operação e módulos contratados. Vou chamar um consultor para te atender com mais detalhes. Aguarde um momento!';
      }
      
      const botResponse = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot' as const,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep(1);
    setChatMode(null);
    setFormData({ name: '', email: '', phone: '', message: '' });
    setConversationId(null);
    setChatMessages([{ id: 1, text: 'Olá! 👋 Sou o assistente virtual do Fluxbus. Como posso ajudá-lo hoje?', sender: 'bot', timestamp: new Date() }]);
    setCurrentMessage('');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center mb-3 sm:mb-4">
              <div className="bg-red-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Olá! 👋</h3>
              <p className="text-sm sm:text-base text-gray-300">Para começarmos, qual é o seu nome?</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base text-gray-300">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite seu nome"
                onKeyPress={(e) => e.key === 'Enter' && handleNextStep()}
                autoFocus
                className="text-sm sm:text-base"
              />
            </div>
            <Button onClick={handleNextStep} className="w-full bg-red-600 hover:bg-red-700 text-sm sm:text-base">
              Continuar
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center mb-3 sm:mb-4">
              <div className="bg-red-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Ótimo, {formData.name}! 📧</h3>
              <p className="text-sm sm:text-base text-gray-300">Agora preciso do seu email para contato:</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@email.com"
                onKeyPress={(e) => e.key === 'Enter' && handleNextStep()}
                autoFocus
                className="text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1 text-sm sm:text-base"
              >
                Voltar
              </Button>
              <Button onClick={handleNextStep} className="flex-1 bg-red-600 hover:bg-red-700 text-sm sm:text-base">
                Continuar
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center mb-3 sm:mb-4">
              <div className="bg-red-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Perfeito! 📞</h3>
              <p className="text-sm sm:text-base text-gray-300">Por último, seu telefone para contato:</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm sm:text-base text-gray-300">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                onKeyPress={(e) => e.key === 'Enter' && handleNextStep()}
                autoFocus
                className="text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)}
                className="flex-1 text-sm sm:text-base"
              >
                Voltar
              </Button>
              <Button onClick={handleNextStep} className="flex-1 bg-red-600 hover:bg-red-700 text-sm sm:text-base">
                Continuar
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center mb-3 sm:mb-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="bg-blue-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Como prefere conversar? 💬</h3>
              <p className="text-sm sm:text-base text-gray-300">Suas mensagens serão vistas em tempo real pela nossa equipe:</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-3 text-xs sm:text-sm text-gray-300">
              <p><strong className="text-white">Nome:</strong> {formData.name}</p>
              <p><strong className="text-white">Email:</strong> {formData.email}</p>
              <p><strong className="text-white">Telefone:</strong> {formData.phone}</p>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Button 
                onClick={() => {
                  setChatMode('website');
                  setStep(5);
                  initializeWebChat();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 h-auto"
                variant="default"
              >
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base">Conversar aqui no site</div>
                    <div className="text-xs sm:text-sm opacity-90">Resposta em tempo real pelo nosso painel</div>
                  </div>
                </div>
              </Button>
              
              <Button 
                onClick={() => {
                  setChatMode('whatsapp');
                  setStep(5);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 h-auto"
                variant="default"
              >
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base">Atendimento WhatsApp</div>
                    <div className="text-xs sm:text-sm opacity-90">A mensagem é roteada para nosso painel interno</div>
                  </div>
                </div>
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-300 bg-green-900/30 border border-green-700/50 rounded-lg p-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Em ambos os casos, você não precisa sair do site — a resposta chega aqui mesmo.</span>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setStep(3)}
              className="w-full text-sm sm:text-base"
            >
              Voltar
            </Button>
          </div>
        );

      case 5:
        if (chatMode === 'whatsapp') {
          return (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center mb-3 sm:mb-4">
                <div className="bg-green-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Mensagem para Atendimento 📱</h3>
                <p className="text-sm sm:text-base text-gray-300">
                  Sua mensagem será enviada para nossa central de Atendimento e respondida aqui mesmo, sem sair do site.
                </p>
              </div>
              
              <div className="space-y-2">
                 <Label htmlFor="message" className="text-sm sm:text-base text-gray-300">Sua mensagem</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Digite sua mensagem ou dúvida..."
                  rows={3}
                  autoFocus
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-xs text-green-100">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Após enviar, você poderá acompanhar a resposta do atendente em tempo real no chat ao vivo.</span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(4)}
                  className="flex-1 text-sm sm:text-base"
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleSubmitWhatsApp} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Enviar para Atendimento</span>
                      <span className="sm:hidden">Enviar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center mb-3 sm:mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Chat ao Vivo 💻</h3>
                <p className="text-sm sm:text-base text-gray-300">
                  <Smartphone className="inline h-3 w-3 mr-1" />
                  Conectado com nosso painel de atendimento
                </p>
              </div>
              
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 sm:p-4 h-48 sm:h-64 overflow-y-auto space-y-2 sm:space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] sm:max-w-xs px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : msg.sender === 'agent'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}>
                      {msg.sender !== 'user' && msg.senderName && (
                        <p className="text-xs opacity-80 mb-0.5 font-medium">{msg.senderName}</p>
                      )}
                      <p className="text-xs sm:text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendWebsiteMessage()}
                  className="flex-1 text-sm sm:text-base"
                />
                <Button 
                  onClick={handleSendWebsiteMessage}
                  className="bg-blue-600 hover:bg-blue-700 px-3 sm:px-4"
                  disabled={!currentMessage.trim()}
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-center text-gray-400">
                ✅ Suas mensagens são exibidas em tempo real no nosso painel interno
              </p>
              
              <Button 
                variant="outline" 
                onClick={() => setStep(4)}
                className="w-full text-sm sm:text-base"
              >
                Voltar às opções
              </Button>
            </div>
          );
        }

      default:
        return null;
    }
  };

  return (
    <>
      <div className="chatbot-button">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 sm:w-16 sm:h-16 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
          size="lg"
        >
          <MessageCircle className="h-5 w-5 sm:h-8 sm:w-8" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="chatbot-modal max-w-md w-[calc(100vw-16px)] sm:w-full max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 mx-2 sm:mx-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-red-500 rounded-full p-1.5">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>
                <span className="truncate">Atendimento Fluxbus</span>
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
              <span>Online - Integrado ao painel</span>
            </div>
          </DialogHeader>

          <div className="py-2 sm:py-4">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="flex space-x-1 sm:space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                      i <= step ? (chatMode === 'whatsapp' ? 'bg-green-500' : chatMode === 'website' ? 'bg-blue-500' : 'bg-red-500') : 'bg-gray-300'
                    } transition-colors duration-300`}
                  />
                ))}
              </div>
            </div>

            {renderStep()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsAppChatbot;
