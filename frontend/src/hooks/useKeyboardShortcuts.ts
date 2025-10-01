import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsProps {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const pressedKey = event.key.toLowerCase();
    const isCtrl = event.ctrlKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;
    const isMeta = event.metaKey;

    for (const shortcut of shortcuts) {
      const matchesKey = shortcut.key.toLowerCase() === pressedKey;
      const matchesCtrl = shortcut.ctrl === undefined ? false : shortcut.ctrl === isCtrl;
      const matchesShift = shortcut.shift === undefined ? false : shortcut.shift === isShift;
      const matchesAlt = shortcut.alt === undefined ? false : shortcut.alt === isAlt;
      const matchesMeta = shortcut.meta === undefined ? false : shortcut.meta === isMeta;

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts: shortcuts.map(s => ({
      ...s,
      keyCombo: [
        s.ctrl && 'Ctrl',
        s.shift && 'Shift',
        s.alt && 'Alt',
        s.meta && 'Cmd',
        s.key.toUpperCase()
      ].filter(Boolean).join('+')
    }))
  };
};

// Atalhos padrão do sistema
export const defaultShortcuts: ShortcutConfig[] = [
  {
    key: 'k',
    ctrl: true,
    action: () => {
      // Abrir busca global
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Abrir busca global'
  },
  {
    key: 'n',
    ctrl: true,
    action: () => {
      // Novo funcionário
      const newButton = document.querySelector('[data-new-funcionario]') as HTMLButtonElement;
      if (newButton) {
        newButton.click();
      }
    },
    description: 'Novo funcionário'
  },
  {
    key: 's',
    ctrl: true,
    action: () => {
      // Salvar
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement;
      if (saveButton) {
        saveButton.click();
      }
    },
    description: 'Salvar'
  },
  {
    key: 'Escape',
    action: () => {
      // Fechar modal
      const closeButton = document.querySelector('[data-close-modal]') as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
      }
    },
    description: 'Fechar modal'
  },
  {
    key: '?',
    action: () => {
      // Mostrar atalhos
      const shortcutsModal = document.querySelector('[data-shortcuts-modal]') as HTMLElement;
      if (shortcutsModal) {
        shortcutsModal.style.display = 'block';
      }
    },
    description: 'Mostrar atalhos'
  },
  {
    key: 'd',
    ctrl: true,
    action: () => {
      // Alternar tema escuro
      const themeToggle = document.querySelector('[data-theme-toggle]') as HTMLButtonElement;
      if (themeToggle) {
        themeToggle.click();
      }
    },
    description: 'Alternar tema escuro'
  },
  {
    key: 'r',
    ctrl: true,
    action: () => {
      // Recarregar página
      window.location.reload();
    },
    description: 'Recarregar página'
  },
  {
    key: 'f',
    ctrl: true,
    action: () => {
      // Buscar na página
      const searchInput = document.querySelector('[data-page-search]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Buscar na página'
  }
]; 