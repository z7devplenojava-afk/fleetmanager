import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Phone, 
  Mail, 
  Clock, 
  Star,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Bot
} from 'lucide-react';

interface SpecialistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const specialists = [
  {
    id: 1,
    name: "Carlos Silva",
    role: "Especialista em Segurança Patrimonial",
    experience: "15 anos",
    rating: 4.9,
    specialties: ["Vigilância 24h", "Controle de Acesso", "Monitoramento"],
    phone: "(31) 2559-1245",
    email: "carlos@promovervigilancia.com.br",
    available: true,
    avatar: "👨‍💼"
  },
  {
    id: 2,
    name: "Ana Santos",
    role: "Consultora em Facilities",
    experience: "12 anos",
    rating: 4.8,
    specialties: ["Portaria", "Limpeza", "Manutenção"],
    phone: "(31) 97130-3587",
    email: "ana@promovervigilancia.com.br",
    available: true,
    avatar: "👩‍💼"
  },
  {
    id: 3,
    name: "Roberto Lima",
    role: "Especialista em Segurança Industrial",
    experience: "18 anos",
    rating: 5.0,
    specialties: ["Segurança Industrial", "Treinamentos", "Auditoria"],
    phone: "(31) 2559-1245",
    email: "roberto@promovervigilancia.com.br",
    available: false,
    avatar: "👨‍🔧"
  }
];

const SpecialistModal: React.FC<SpecialistModalProps> = ({ isOpen, onClose }) => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<number | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const handleClose = () => {
    setSelectedSpecialist(null);
    setShowChatbot(false);
    onClose();
  };

  const handleChatbotAccess = () => {
    setShowChatbot(true);
    // Aqui você pode integrar com o chatbot real
    console.log('Acessando chatbot...');
  };

  const handleDirectContact = (specialist: typeof specialists[0]) => {
    // Abrir WhatsApp ou fazer ligação
    const message = `Olá ${specialist.name}, gostaria de falar sobre serviços de segurança.`;
    const whatsappUrl = `https://wa.me/5531971303587?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="specialist-modal overflow-y-auto overflow-x-hidden bg-gray-900 border-gray-700 p-4 sm:p-5">
        <DialogHeader className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="p-2 bg-red-600 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl font-bold text-white truncate">
                  Falar com Especialista
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-gray-400">
                  Converse com nossos especialistas em segurança
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 flex-shrink-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {!showChatbot ? (
          <div className="space-y-8 mt-6">
            {/* Opção de Chatbot */}
            <Card className="bg-gradient-to-r from-green-600 to-green-500 border-0">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="p-2 sm:p-3 bg-white rounded-full flex-shrink-0">
                      <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white">Chat Inteligente</h3>
                      <p className="text-sm sm:text-base text-green-100">Respostas instantâneas 24h por dia</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleChatbotAccess}
                    className="bg-white text-green-600 hover:bg-green-50 w-full sm:w-auto"
                  >
                    Iniciar Chat
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Especialistas Disponíveis */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Nossos Especialistas</h3>
              <div className="space-y-3">
                {specialists.map((specialist) => (
                  <Card 
                    key={specialist.id} 
                    className={`bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors ${
                      !specialist.available ? 'opacity-60' : ''
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="space-y-3">
                        {/* Header do especialista */}
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl flex-shrink-0">{specialist.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-base font-semibold text-white truncate">{specialist.name}</h4>
                              {specialist.available ? (
                                <Badge className="bg-green-600 text-white text-xs flex-shrink-0">Disponível</Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-500 text-gray-400 text-xs flex-shrink-0">Ocupado</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 truncate">{specialist.role}</p>
                          </div>
                        </div>
                        
                        {/* Informações do especialista */}
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
                          <div className="flex items-center min-w-0">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{specialist.experience}</span>
                          </div>
                          <div className="flex items-center min-w-0">
                            <Star className="h-4 w-4 mr-2 text-yellow-400 flex-shrink-0" />
                            <span className="truncate">{specialist.rating}</span>
                          </div>
                        </div>
                        
                        {/* Especialidades */}
                        <div className="flex flex-wrap gap-2">
                          {specialist.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="border-gray-600 text-gray-300 text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Contato */}
                        <div className="space-y-2 text-sm text-gray-400">
                          <div className="flex items-center min-w-0">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{specialist.phone}</span>
                          </div>
                          <div className="flex items-center min-w-0">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{specialist.email}</span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-3 w-full">
                          <Button
                            size="sm"
                            onClick={() => handleDirectContact(specialist)}
                            disabled={!specialist.available}
                            className="bg-green-600 hover:bg-green-700 text-white w-full py-3 text-sm font-medium"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${specialist.phone}`, '_self')}
                            disabled={!specialist.available}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full py-3 text-sm font-medium"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Ligar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Informações Adicionais */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600 flex-shrink-0" />
                  <span className="truncate">Por que falar com nossos especialistas?</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm sm:text-base text-gray-300">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>Consultoria personalizada</span>
                    </div>
                    <div className="flex items-center text-sm sm:text-base text-gray-300">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>Análise de necessidades específicas</span>
                    </div>
                    <div className="flex items-center text-sm sm:text-base text-gray-300">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>Orçamento detalhado</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm sm:text-base text-gray-300">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>Suporte técnico especializado</span>
                    </div>
                    <div className="flex items-center text-sm sm:text-base text-gray-300">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>Resposta rápida</span>
                    </div>
                    <div className="flex items-center text-sm sm:text-base text-gray-300">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>Atendimento 24h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <Bot className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Chat Inteligente Ativado</h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-6">
                    Nosso chatbot está pronto para responder suas perguntas sobre segurança patrimonial.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => window.open('https://wa.me/5531971303587', '_blank')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Abrir WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowChatbot(false)}
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 text-sm sm:text-base"
                    >
                      Voltar aos Especialistas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SpecialistModal;
