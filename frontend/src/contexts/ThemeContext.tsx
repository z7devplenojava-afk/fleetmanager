import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'white' | 'light-gray' | 'dark' | 'dark-red' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  /** Cor primária da empresa (ex: #821414). Null = padrão. */
  empresaColor: string | null;
  setEmpresaColor: (color: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Forçar tema Dark Red Premium
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'dark-red') return 'dark-red';

    return 'dark-red';
  });

  const [isDark, setIsDark] = useState(false);
  const [empresaColor, setEmpresaColorState] = useState<string | null>(() => {
    try {
      const emp = localStorage.getItem('empresa');
      if (emp) {
        const parsed = JSON.parse(emp);
        return parsed?.temaCor || null;
      }
    } catch (_) {}
    return null;
  });

  const setEmpresaColor = useCallback((color: string | null) => {
    setEmpresaColorState(color);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    // Remover classes anteriores
    root.classList.remove('white', 'light-gray', 'dark', 'dark-red', 'light');

    let currentTheme = theme;

    if (theme === 'system') {
      currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-red' : 'white';
    }

    // Aplicar tema
    root.classList.add(currentTheme);

    // Essencial: Adicionar classe 'dark' para compatibilidade com Tailwind shadcn
    if (['dark', 'dark-red'].includes(currentTheme)) {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      setIsDark(false);
    }

    // Salvar no localStorage
    localStorage.setItem('theme', theme);

    // Atualizar meta theme-color para mobile status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      let color = '#ffffff';
      if (currentTheme === 'dark') color = '#020617';
      else if (currentTheme === 'dark-red') color = '#0A0000';
      else if (currentTheme === 'light-gray') color = '#F1F5F9';

      metaThemeColor.setAttribute('content', color);
    }
  }, [theme]);

  // Aplicar cor da empresa como CSS custom property
  useEffect(() => {
    const root = window.document.documentElement;
    if (empresaColor) {
      root.style.setProperty('--empresa-color', empresaColor);
      // Converter hex para HSL para integrar com o sistema de cores do shadcn
      const hex = empresaColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
      }
      root.style.setProperty('--empresa-primary', `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`);
    } else {
      root.style.removeProperty('--empresa-color');
      root.style.removeProperty('--empresa-primary');
    }
  }, [empresaColor]);

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('white', 'dark');
        const newTheme = mediaQuery.matches ? 'dark' : 'white';
        root.classList.add(newTheme);
        setIsDark(newTheme === 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    isDark,
    empresaColor,
    setEmpresaColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 