import React from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHistoryNav } from '@/hooks/useHistoryNav';

interface HistoryNavButtonsProps {
  variant?: 'header' | 'breadcrumb' | 'floating';
  className?: string;
  showLabels?: boolean;
}

export const HistoryNavButtons: React.FC<HistoryNavButtonsProps> = ({
  variant = 'header',
  className = '',
  showLabels = false
}) => {
  const { goBack, goForward, canGoBack } = useHistoryNav();

  if (variant === 'breadcrumb') {
    return (
      <div className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goBack}
          className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg text-xs font-medium text-foreground bg-card hover:bg-accent border-border shadow-xs transition-all active:scale-95 gap-1"
          title="Voltar à tela anterior (Alt + ←)"
          aria-label="Voltar tela anterior"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold">Voltar</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goForward}
          className="h-7 sm:h-8 px-2 sm:px-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground bg-card hover:bg-accent border-border shadow-xs transition-all active:scale-95"
          title="Avançar à próxima tela (Alt + →)"
          aria-label="Avançar próxima tela"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          {showLabels && <span className="text-[11px] hidden sm:inline">Avançar</span>}
        </Button>
      </div>
    );
  }

  // Estilo padrão para Header
  return (
    <div className={`flex items-center bg-muted/60 dark:bg-muted/40 p-0.5 rounded-lg border border-border/80 shrink-0 ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={goBack}
        className="h-7 w-7 sm:h-8 sm:w-8 rounded-md text-foreground hover:text-primary hover:bg-background/80 transition-all active:scale-95"
        title="Voltar à tela anterior (Alt + ←)"
        aria-label="Voltar para a tela anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="h-3.5 w-[1px] bg-border/80 mx-0.5" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={goForward}
        className="h-7 w-7 sm:h-8 sm:w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all active:scale-95"
        title="Avançar para a próxima tela (Alt + →)"
        aria-label="Avançar para a próxima tela"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default HistoryNavButtons;
