import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook para preservar a posição de scroll durante navegação
 * Útil para manter a posição quando navegar entre menus da sidebar
 */
export const useScrollPreservation = () => {
  const location = useLocation();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const currentPath = useRef<string>('');
  const isNavigating = useRef<boolean>(false);

  // Função para salvar posição de scroll
  const saveScrollPosition = useCallback((path: string) => {
    scrollPositions.current.set(path, window.scrollY);
  }, []);

  // Função para restaurar posição de scroll
  const restoreScrollPosition = useCallback((path: string) => {
    const savedPosition = scrollPositions.current.get(path);
    if (savedPosition !== undefined) {
      // Usar requestAnimationFrame para garantir que o DOM esteja renderizado
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'instant' // Scroll instantâneo para não interferir na navegação
        });
      });
    } else {
      // Se não há posição salva, ir para o topo
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
    }
  }, []);

  useEffect(() => {
    // Se estamos navegando para a mesma página, não fazer nada
    if (currentPath.current === location.pathname) {
      return;
    }

    // Salvar posição da página atual
    if (currentPath.current) {
      saveScrollPosition(currentPath.current);
    }

    // Atualizar caminho atual
    currentPath.current = location.pathname;

    // Restaurar posição da nova página
    restoreScrollPosition(location.pathname);

    // Cleanup: salvar posição quando o componente for desmontado
    return () => {
      if (currentPath.current) {
        saveScrollPosition(currentPath.current);
      }
    };
  }, [location.pathname, saveScrollPosition, restoreScrollPosition]);

  // Função para limpar posições salvas (útil para reset)
  const clearScrollPositions = useCallback(() => {
    scrollPositions.current.clear();
  }, []);

  // Função para forçar ir ao topo na próxima navegação
  const forceScrollToTop = useCallback(() => {
    scrollPositions.current.delete(location.pathname);
  }, [location.pathname]);

  // Função para preservar scroll atual (não ir ao topo)
  const preserveCurrentScroll = useCallback(() => {
    // Não fazer nada - manter comportamento atual
  }, []);

  return {
    clearScrollPositions,
    forceScrollToTop,
    preserveCurrentScroll,
    saveScrollPosition,
    restoreScrollPosition
  };
};
