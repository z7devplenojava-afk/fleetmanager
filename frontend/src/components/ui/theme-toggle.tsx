import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor, Check, Cloud, Shield, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      value: 'white',
      label: 'Branco',
      icon: Sun,
      color: 'bg-white border-gray-200'
    },
    {
      value: 'light-gray',
      label: 'Cinza Claro',
      icon: Cloud,
      color: 'bg-slate-100 border-slate-300'
    },
    {
      value: 'dark',
      label: 'Escuro',
      icon: Moon,
      color: 'bg-slate-950 border-slate-800'
    },
    {
      value: 'dark-red',
      label: 'Vermelho Escuro',
      icon: Shield,
      color: 'bg-red-950 border-red-900'
    },
    {
      value: 'system',
      label: 'Sistema',
      icon: Monitor,
      color: 'bg-gradient-to-br from-white to-slate-950'
    },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-full bg-background/50 hover:bg-accent/50 border border-border/50 backdrop-blur-sm active:scale-95 transition-all duration-300">
          <Palette className="h-5 w-5 transition-all hover:rotate-12" />
          <span className="sr-only">Alternar contraste</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border/50 bg-background/95 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Escolha o Contraste
        </div>
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                "flex items-center justify-between gap-2 cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200",
                isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md border text-[10px] shadow-sm",
                  themeOption.color
                )}>
                  <Icon className={cn(
                    "h-3.5 w-3.5",
                    themeOption.value === 'white' || themeOption.value === 'light-gray' ? "text-slate-900" : "text-white"
                  )} />
                </div>
                <span className="font-medium">{themeOption.label}</span>
              </div>
              {isActive && (
                <Check className="h-4 w-4 text-primary animate-in zoom-in duration-300" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle; 