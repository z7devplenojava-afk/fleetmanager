import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Bot,
  Send,
  Sparkles,
  ExternalLink,
  BookOpen,
  Headphones,
  Loader2
} from 'lucide-react';
import {
  BILI_FLUX_TOPICS,
  BILI_FLUX_GREETING,
  BILI_FLUX_FALLBACK,
  BILI_FLUX_MODULES_OVERVIEW,
  BILI_FLUX_CATEGORIES,
  type BiliFluxTopic
} from '@/data/bilifluxKnowledge';
import bilifluxService from '@/services/bilifluxService';

interface BiliFluxAssistantProps {
  userName?: string;
  onOpenHelp?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  route?: string;
  routeLabel?: string;
  links?: { label: string; route: string }[];
  source?: 'ai' | 'local';
}

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const keywordMatches = (normText: string, keyword: string): boolean => {
  const normKeyword = normalizeText(keyword);
  if (normKeyword.length <= 3) {
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(normKeyword)}([^a-z0-9]|$)`
    );
    return pattern.test(normText);
  }
  return normText.includes(normKeyword);
};

const scoreTopic = (normText: string, topic: BiliFluxTopic): number => {
  let score = 0;
  for (const keyword of topic.keywords) {
    if (keywordMatches(normText, keyword)) {
      const len = normalizeText(keyword).length;
      score += len >= 8 ? 4 : len >= 5 ? 3 : len >= 3 ? 2 : 1;
    }
  }
  const normTitle = normalizeText(topic.title);
  if (normText.includes(normTitle)) {
    score += 5;
  }
  return score;
};

const buildTopicResponse = (topic: BiliFluxTopic): string => {
  const lines: string[] = [];
  lines.push(`📋 ${topic.title}`);
  lines.push('');
  lines.push(`Objetivo: ${topic.objetivo}`);
  lines.push('');
  topic.steps.forEach((step, index) => {
    lines.push(`Passo ${index + 1}: ${step}`);
  });
  lines.push('');
  lines.push(`Resultado esperado: ${topic.resultado}`);
  if (topic.dica) {
    lines.push('');
    lines.push(`💡 Dica: ${topic.dica}`);
  }
  if (topic.warning) {
    lines.push('');
    lines.push(`⚠️ Cuidado: ${topic.warning}`);
  }
  if (topic.subitems && topic.subitems.length > 0) {
    lines.push('');
    lines.push('Telas relacionadas (use os botões abaixo para navegar):');
    topic.subitems.forEach((item) => {
      lines.push(`  • ${item.label}`);
    });
  }
  return lines.join('\n');
};

const findBestTopic = (input: string): BiliFluxTopic | null => {
  const norm = normalizeText(input);
  let best: { topic: BiliFluxTopic; score: number } | null = null;

  for (const topic of BILI_FLUX_TOPICS) {
    const score = scoreTopic(norm, topic);
    if (score > 0 && (!best || score > best.score)) {
      best = { topic, score };
    }
  }

  return best && best.score >= 2 ? best.topic : null;
};

const matchesAnyKeyword = (normText: string, keywords: string[]): boolean =>
  keywords.some((keyword) => keywordMatches(normText, keyword));

const QUICK_SUGGESTIONS = [
  'Quais módulos o sistema tem?',
  'Como abro uma O.S.?',
  'Como cadastro um funcionário?',
  'Como faço uma conciliação bancária?',
  'Como configuro o chatbot?',
  'Como emito uma proposta?'
];

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-2 px-3 py-2">
    <div className="flex items-center gap-1 rounded-full bg-muted border border-border/60 px-3 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
    </div>
    <span className="text-[10px] text-muted-foreground">BiliFlux está pensando…</span>
  </div>
);

export const BiliFluxAssistant: React.FC<BiliFluxAssistantProps> = ({
  userName,
  onOpenHelp
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const firstName = userName?.trim().split(' ')[0];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isTyping]);

  const buildGreeting = (): string =>
    firstName
      ? `Olá, ${firstName}! ` + BILI_FLUX_GREETING.replace('Olá! ', '')
      : BILI_FLUX_GREETING;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'bot',
          content: buildGreeting()
        }
      ]);
    }
  };

  const appendBotMessage = (
    content: string,
    route?: string,
    routeLabel?: string,
    links?: { label: string; route: string }[],
    source?: 'ai' | 'local'
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content,
        route,
        routeLabel,
        links,
        source
      }
    ]);
  };

  const resolveLocalAnswer = (text: string) => {
    const norm = normalizeText(text);

    if (matchesAnyKeyword(norm, BILI_FLUX_MODULES_OVERVIEW.keywords)) {
      appendBotMessage(BILI_FLUX_MODULES_OVERVIEW.response, undefined, undefined, undefined, 'local');
      return;
    }

    const topic = findBestTopic(text);
    if (topic) {
      appendBotMessage(
        buildTopicResponse(topic),
        topic.route,
        topic.routeLabel,
        topic.subitems,
        'local'
      );
    } else {
      appendBotMessage(BILI_FLUX_FALLBACK, undefined, undefined, undefined, 'local');
    }
  };

  const handleSend = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const history = [...messages, userMessage]
      .filter((m) => m.id !== 'greeting')
      .slice(-10)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

    try {
      const result = await bilifluxService.chat(
        {
          message: text,
          userName: userName || undefined,
          history
        },
        35000
      );

      if (result?.source === 'ai' && result.reply && result.reply.trim()) {
        appendBotMessage(result.reply.trim(), undefined, undefined, undefined, 'ai');
      } else {
        resolveLocalAnswer(text);
      }
    } catch {
      resolveLocalAnswer(text);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNavigate = (route: string) => {
    setIsOpen(false);
    navigate(route);
  };

  const handleOpenHelpCenter = () => {
    setIsOpen(false);
    if (onOpenHelp) {
      onOpenHelp();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          title="BiliFlux — Assistente Virtual FluxBus"
          aria-label="Abrir BiliFlux, assistente virtual"
        >
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-sm shadow-blue-600/30 group-hover:scale-105 transition-transform">
            <Bot className="h-3 w-3 text-white" aria-hidden="true" />
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
          </span>
          <span className="hidden md:inline text-[11px] font-semibold bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
            BiliFlux
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={10}
        className="z-[60] w-[min(23rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-background p-0 shadow-2xl shadow-black/20 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-900/40">
              <Bot className="h-5 w-5 text-white" aria-hidden="true" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight truncate">BiliFlux</h3>
                <Sparkles className="h-3 w-3 text-sky-400 shrink-0" aria-hidden="true" />
              </div>
              <p className="text-[10px] text-sky-200/80 font-medium truncate">
                Conhece todo o sistema • Online
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 text-slate-300 hover:text-white hover:bg-white/10 shrink-0"
            aria-label="Fechar assistente"
          >
            <span className="text-xs font-bold">×</span>
          </Button>
        </div>

        <div
          ref={scrollRef}
          className="h-[340px] overflow-y-auto px-3 py-3 space-y-2.5 bg-background"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[90%] space-y-1.5">
                <div
                  className={`px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground border border-border/60 rounded-bl-md'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'bot' && message.source && (
                  <div className="flex items-center gap-1 ml-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${
                        message.source === 'ai'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {message.source === 'ai' ? 'IA Gemini' : 'Base local'}
                    </span>
                  </div>
                )}
                {message.role === 'bot' && message.route && message.routeLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate(message.route!)}
                    className="h-7 text-[11px] rounded-lg border-border bg-background hover:bg-accent ml-1"
                  >
                    {message.routeLabel}
                    <ExternalLink className="h-3 w-3 ml-1.5" aria-hidden="true" />
                  </Button>
                )}
                {message.role === 'bot' && message.links && message.links.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-1">
                    {message.links.map((link) => (
                      <button
                        key={`${link.route}-${link.label}`}
                        type="button"
                        onClick={() => handleNavigate(link.route)}
                        className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1"
                      >
                        {link.label}
                        <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        <div className="border-t border-border px-3 pt-2.5 pb-2 bg-muted/30">
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-[10px] text-muted-foreground shrink-0 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
              Sugestões:
            </span>
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
                disabled={isTyping}
                className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre qualquer módulo…"
              className="h-9 text-xs rounded-xl bg-background"
              disabled={isTyping}
              aria-label="Mensagem para o BiliFlux"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="h-9 w-9 rounded-xl shrink-0"
              aria-label="Enviar mensagem"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </form>

          <div className="flex items-center justify-between mt-2 gap-2">
            <p className="text-[9px] text-muted-foreground leading-tight">
              {BILI_FLUX_TOPICS.length} tópicos • {Object.keys(BILI_FLUX_CATEGORIES).length} módulos mapeados
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenHelpCenter}
                className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3" aria-hidden="true" />
                Central de Ajuda
              </button>
              <button
                type="button"
                onClick={() => handleSend('Falar com suporte humano')}
                className="text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Headphones className="h-3 w-3" aria-hidden="true" />
                Suporte
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BiliFluxAssistant;
