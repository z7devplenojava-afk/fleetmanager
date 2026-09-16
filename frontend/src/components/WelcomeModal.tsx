import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Bus,
  Wrench,
  Users,
  FileCheck,
  Headphones,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Building2,
  Calendar,
  Layers,
  Quote
} from 'lucide-react';
import { User } from '@/types/user';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  companyName?: string;
  companyLogoUrl?: string;
}

const MOTIVATIONAL_QUOTES = [
  "Foco, segurança e pontualidade movem nossa frota!",
  "A excelência no transporte transforma o dia a dia.",
  "Grandes jornadas começam com planejamento e dedicação.",
  "Qualidade e segurança são os nossos maiores compromissos.",
  "Cada detalhe conta para uma operação ágil e eficiente.",
  "Inovação e gestão inteligente movem o futuro.",
  "Trabalho em equipe é o motor do nosso sucesso diário.",
  "Transforme desafios operacionais em rotas de produtividade."
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  user,
  companyName,
  companyLogoUrl
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const motivationalQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
  }, [isOpen]);

  const steps = [
    {
      id: 'welcome',
      title: `Bem-vindo ao Sistema, ${user?.name?.split(' ')[0] || 'Gestor'}! 👋`,
      subtitle: companyName ? `Ambiente corporativo de ${companyName}` : 'Plataforma Integrada de Gestão de Frotas e Fretamento',
      badge: 'Primeiro Acesso',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      content: (
        <div className="space-y-3.5 py-1">
          {/* Card de Frase Motivacional */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 flex items-center gap-3 shadow-inner">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Mensagem de Boas-Vindas
              </p>
              <p className="text-xs italic text-amber-100 font-medium leading-relaxed">
                "{motivationalQuote}"
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-600/10 via-zinc-900/80 to-transparent border border-red-500/20 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-0.5">
                Tudo pronto para potencializar sua operação!
              </h4>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Controle total sobre tráfego, manutenção de frota, comercial, recursos humanos e atendimento em uma única plataforma.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Perfil Seguro</p>
                <p className="text-[10px] text-zinc-400">Acesso controlado por nível e permissões</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Multi-Empresa</p>
                <p className="text-[10px] text-zinc-400">{companyName || 'Personalização corporativa ativa'}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'modules',
      title: 'Principais Recursos & Módulos 🚀',
      subtitle: 'Navegue pelos módulos essenciais no menu lateral',
      badge: 'Visão Geral',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Tráfego & Fretamento</p>
              <p className="text-[11px] text-zinc-400">Rotas, viagens, escalas de motoristas e pontos de embarque.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Manutenção & Frota</p>
              <p className="text-[11px] text-zinc-400">Ordens de serviço, abastecimento, gestão de pneus e portaria.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Comercial & Propostas</p>
              <p className="text-[11px] text-zinc-400">Simulação de custos, precificação, DRE por placa e contratos.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Gestão de Atendimento</p>
              <p className="text-[11px] text-zinc-400">Tickets, atendimento WhatsApp e chatbot em tempo real.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'help_tips',
      title: 'Ajuda, Suporte & Produtividade 💡',
      subtitle: 'Ferramentas rápidas na barra superior da sua tela',
      badge: 'Dicas Úteis',
      badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      content: (
        <div className="space-y-3 py-2">
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Central de Ajuda na Navbar</p>
              <p className="text-[11px] text-zinc-400">
                Clique no ícone de interrogação a qualquer momento para abrir o FAQ, guias rápidos ou falar com o suporte.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Atalho de Gestão de Atendimento</p>
              <p className="text-[11px] text-zinc-400">
                Acesse conversas e mensagens com clientes instantaneamente pela navbar superior com contador de não lidas.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    if (user?.id) {
      localStorage.setItem(`welcome_shown_${user.id}`, 'true');
    }
    onClose();
  };

  const step = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleFinish()}>
      <DialogContent className="max-w-xl bg-zinc-950/95 border-zinc-800 text-white backdrop-blur-xl shadow-2xl p-6 sm:p-7">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <Badge className={`${step.badgeColor} text-xs font-semibold px-2.5 py-0.5 border rounded-full`}>
              {step.badge}
            </Badge>

            {/* Stepper Dots */}
            <div className="flex items-center space-x-1.5">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-6 bg-red-600'
                      : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                  }`}
                  title={`Passo ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {step.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[220px] flex flex-col justify-center">
          {step.content}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800/80">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFinish}
            className="text-xs text-zinc-400 hover:text-white order-2 sm:order-1"
          >
            Pular Apresentação
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="text-xs border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Voltar
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-600/20 px-4"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Começar a Explorar
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
