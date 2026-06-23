import React, { useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

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
      variant="outline"
      size="sm"
      onClick={cycleTheme}
      className="flex items-center space-x-2"
      title={`Tema atual: ${getThemeLabel()}. Clique para alternar.`}
    >
      {getThemeIcon()}
      <span className="hidden sm:inline">{getThemeLabel()}</span>
    </Button>
  );
};

export default ThemeToggle;
