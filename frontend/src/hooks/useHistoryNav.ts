import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isDriverUser, getDashboardRouteForRole } from '@/utils/roleRouting';

const SESSION_HISTORY_KEY = 'fluxbus_nav_history_stack';

export const useHistoryNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_HISTORY_KEY);
      return stored ? JSON.parse(stored).length - 1 : 0;
    } catch {
      return 0;
    }
  });

  // Atualiza histórico interno na sessão
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_HISTORY_KEY);
      const stack: string[] = stored ? JSON.parse(stored) : [];
      
      const currentPath = location.pathname + location.search;
      if (stack.length === 0 || stack[stack.length - 1] !== currentPath) {
        stack.push(currentPath);
        // Limitar histórico a 50 entradas para economia de memória
        if (stack.length > 50) stack.shift();
        sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(stack));
      }
      setHistoryIndex(stack.length - 1);
    } catch {
      // Falha silenciosa em caso de restrição de storage
    }
  }, [location.pathname, location.search]);

  // Rota padrão inicial do usuário caso não haja página anterior
  const getDefaultHome = useCallback(() => {
    if (isDriverUser(user)) {
      return '/driver-dashboard';
    }
    return getDashboardRouteForRole(user?.role, user);
  }, [user]);

  const canGoBack = historyIndex > 0 || window.history.length > 1;
  const canGoForward = true; // window.history pode avançar caso o usuário tenha voltado

  const goBack = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_HISTORY_KEY);
      const stack: string[] = stored ? JSON.parse(stored) : [];
      if (stack.length > 1) {
        stack.pop(); // Remove a página atual
        sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(stack));
        setHistoryIndex(stack.length - 1);
        navigate(-1);
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        // Fallback para home caso seja a primeira tela da aba
        navigate(getDefaultHome());
      }
    } catch {
      navigate(-1);
    }
  }, [navigate, getDefaultHome]);

  const goForward = useCallback(() => {
    try {
      navigate(1);
    } catch {
      window.history.forward();
    }
  }, [navigate]);

  // Suporte a atalhos de teclado: Alt + Seta Esquerda (Voltar) e Alt + Seta Direita (Avançar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em campo de texto
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, goForward]);

  return {
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    defaultHome: getDefaultHome()
  };
};
