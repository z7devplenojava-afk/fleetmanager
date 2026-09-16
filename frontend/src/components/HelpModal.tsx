import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Search,
  MessageSquare,
  BookOpen,
  Headphones,
  ExternalLink,
  ChevronDown,
  Sparkles,
  PhoneCall,
  FileText,
  Bus,
  Wrench,
  DollarSign,
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWelcomeTour?: () => void;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  link?: string;
  linkText?: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: '1',
    category: 'Comercial & Propostas',
    question: 'Como criar e exportar propostas comerciais personalizadas?',
    answer: 'Acesse o menu Comercial > Propostas. Clique em "Nova Proposta", defina o cliente/lead, selecione as rotas e veículos, e configure a simulação de custos (combustível, motoristas, manutenção). Ao finalizar, você pode visualizar e exportar em PDF ou Excel com a logo e dados da sua empresa.',
    link: '/propostas',
    linkText: 'Ir para Propostas'
  },
  {
    id: '2',
    category: 'Manutenção & Frota',
    question: 'Como abrir e gerenciar Ordens de Serviço (O.S.) da frota?',
    answer: 'No menu Manutenção & Frota, clique em "O.S. de Frota" ou "Gerenciar Frota". Você pode registrar manutenções preventivas e corretivas, vincular mecânicos responsáveis, peças utilizadas e acompanhar o status em tempo real.',
    link: '/frota/ordens-servico',
    linkText: 'Ver Ordens de Serviço'
  },
  {
    id: '3',
    category: 'Atendimento & WhatsApp',
    question: 'Como funciona a integração com WhatsApp e Chatbot?',
    answer: 'Na barra superior ou no menu Gestão de Atendimento, acesse "Chatbot" ou clique no ícone de fone de ouvido. As mensagens recebidas geram tickets automáticos com triagem inteligente, permitindo que a equipe assuma os atendimentos de forma colaborativa.',
    link: '/gestao-atendimento/dashboard',
    linkText: 'Acessar Atendimento'
  },
  {
    id: '4',
    category: 'Recursos Humanos',
    question: 'Como consultar holerites e espelhos de ponto dos colaboradores?',
    answer: 'No menu Recursos Humanos ou Departamento Pessoal, utilize os módulos "Holerites" e "Ponto Eletrônico". Você pode realizar importações em lote de planilhas Excel e disponibilizar o acesso seguro para cada funcionário no Portal do Colaborador.',
    link: '/holerites',
    linkText: 'Ver Holerites'
  },
  {
    id: '5',
    category: 'Tráfego & Fretamento',
    question: 'Como atribuir rotas, veículos e motoristas às viagens?',
    answer: 'No menu Gestão de Tráfego > Atribuições ou Viagens, selecione a rota programada, o veículo disponível na frota e o motorista habilitado. O motorista receberá os dados da viagem diretamente no Portal do Motorista.',
    link: '/fretamento/viagens',
    linkText: 'Gestão de Viagens'
  },
  {
    id: '6',
    category: 'Personalização & Logo',
    question: 'Como alterar o logo e informações cadastrais da minha empresa?',
    answer: 'Acesse o menu Sistema > Configurações (ou Minha Empresa). Na aba Geral, você pode fazer upload do logo institucional ou inserir a URL da imagem. A logo será exibida automaticamente na barra superior, menus e documentos gerados.',
    link: '/configuracoes',
    linkText: 'Configurações da Empresa'
  }
];

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onOpenWelcomeTour
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'faq' | 'tutorials' | 'support'>('faq');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('1');
  const navigate = useNavigate();

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigate = (link: string) => {
    onClose();
    navigate(link);
  };

  const handleOpenWhatsAppSupport = () => {
    window.open('https://wa.me/5531999999999?text=Ol%C3%A1%2C+preciso+de+suporte+no+sistema+FluxBus', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-zinc-950/95 border-zinc-800 text-white backdrop-blur-xl shadow-2xl p-6 sm:p-7 max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-1.5 text-left shrink-0">
          <div className="flex items-center justify-between">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Central de Ajuda & Suporte
            </Badge>
            <span className="text-[11px] text-zinc-500">Versão 2.5 Enterprise</span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-red-500" />
            Como podemos te ajudar hoje?
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Tire dúvidas rápidas, conheça as funcionalidades do sistema ou fale com nossa equipe.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 pt-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('faq')}
            className={`text-xs h-8 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'faq'
                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Perguntas Frequentes
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('tutorials')}
            className={`text-xs h-8 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'tutorials'
                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Guias & Apresentação
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('support')}
            className={`text-xs h-8 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'support'
                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Headphones className="h-3.5 w-3.5 mr-1.5" />
            Canais de Suporte
          </Button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquise por dúvidas (ex: propostas, O.S., WhatsApp, holerites)..."
                  className="pl-9 bg-zinc-900/90 border-zinc-800 text-xs text-white placeholder:text-zinc-500 h-9 rounded-lg"
                />
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Nenhuma resposta encontrada para sua busca. Tente outras palavras ou fale com o suporte técnico.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-900/90 transition-colors"
                        >
                          <div className="space-y-1 pr-3">
                            <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                              {faq.category}
                            </span>
                            <h4 className="text-xs font-semibold text-white leading-snug">
                              {faq.question}
                            </h4>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-red-400' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/50 bg-zinc-950/40">
                            <p className="mb-2.5">{faq.answer}</p>
                            {faq.link && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleNavigate(faq.link!)}
                                className="h-7 text-[11px] border-zinc-700 bg-zinc-900 text-red-400 hover:text-white hover:bg-red-600/30"
                              >
                                {faq.linkText || 'Acessar tela'}
                                <ExternalLink className="h-3 w-3 ml-1.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tutorials' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-600/20 via-zinc-900 to-zinc-900 border border-red-500/30 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">
                    Guia Interativo de Apresentação
                  </h4>
                  <p className="text-xs text-zinc-300">
                    Deseja rever o tour completo de boas-vindas com a apresentação de todos os módulos?
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    if (onOpenWelcomeTour) onOpenWelcomeTour();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs shrink-0 shadow-lg shadow-red-600/20"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Abrir Tour
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => handleNavigate('/fretamento')}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Bus className="h-4 w-4 text-red-400" />
                    <span className="text-xs font-semibold text-white">Manual de Gestão de Tráfego</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Controle de rotas, itinerários, passageiros e medições operacionais.
                  </p>
                </div>

                <div
                  onClick={() => handleNavigate('/frota')}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Wrench className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold text-white">Manual de Manutenção & Frota</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Planos preventivos, gestão de pneus, consumo de combustível e O.S.
                  </p>
                </div>

                <div
                  onClick={() => handleNavigate('/propostas')}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Manual Comercial & DRE</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Elaboração de propostas inteligentes com simulação de custos e margem.
                  </p>
                </div>

                <div
                  onClick={() => handleNavigate('/gestao-atendimento/whatsapp')}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Headphones className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-semibold text-white">Manual de Atendimento WhatsApp</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Atendimento multicanal, filas de espera, respostas automáticas e chatbot.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Suporte Técnico via WhatsApp</h4>
                    <p className="text-[11px] text-zinc-400">Atendimento rápido em dias úteis das 08h às 18h</p>
                  </div>
                </div>
                <Button
                  onClick={handleOpenWhatsAppSupport}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium h-9"
                >
                  Iniciar Conversa no WhatsApp
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Abrir Ticket Interno no Sistema</h4>
                    <p className="text-[11px] text-zinc-400">Registre ocorrências ou solicitações de melhoria</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleNavigate('/gestao-atendimento/tickets')}
                  className="w-full border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium h-9"
                >
                  Ir para Painel de Tickets
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
