import React, { useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'graphite':
        return <div className="h-4 w-4 bg-gray-500 rounded-full" />;
      case 'white':
        return <Sun className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Moon className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'dark':
        return 'Dark';
      case 'graphite':
        return 'Grafite';
      case 'white':
        return 'Branco';
      case 'system':
        return 'Sistema';
      default:
        return 'Dark';
    }
  };

  const cycleTheme = () => {
    const themes: Array<'dark' | 'graphite' | 'white' | 'system'> = ['dark', 'graphite', 'white', 'system'];
    const currentIndex = themes.indexOf(theme as 'dark' | 'graphite' | 'white' | 'system');
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={cycleTheme}
      className={`flex items-center gap-1.5 rounded-full h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3 justify-center shrink-0 transition-all ${
        isDark
          ? 'bg-slate-900/90 border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-white'
          : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200 hover:text-slate-950'
      }`}
      title={`Contraste atual: ${getThemeLabel()}. Clique para alternar (Dark / Grafite / Branco).`}
    >
      {getThemeIcon()}
      <span className="text-xs font-semibold hidden sm:inline">{getThemeLabel()}</span>
    </Button>
  );
};

export default ThemeToggle;
