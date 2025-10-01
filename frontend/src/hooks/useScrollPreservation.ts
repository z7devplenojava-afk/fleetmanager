import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook para preservar a posição de scroll durante navegação
 * Útil para manter a posição quando navegar entre menus da sidebar
 */
export const useScrollPreservation = () => {
  const location = useLocation();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const currentPath = useRef<string>('');

  useEffect(() => {
    // Salvar posição de scroll da página atual antes de navegar
    const saveScrollPosition = () => {
      if (currentPath.current) {
        scrollPositions.current.set(currentPath.current, window.scrollY);
      }
    };

    // Restaurar posição de scroll da nova página
    const restoreScrollPosition = () => {
      const savedPosition = scrollPositions.current.get(location.pathname);
      if (savedPosition !== undefined) {
        // Usar setTimeout para garantir que o DOM esteja renderizado
        setTimeout(() => {
          window.scrollTo(0, savedPosition);
        }, 0);
      } else {
        // Se não há posição salva, ir para o topo
        window.scrollTo(0, 0);
      }
    };

    // Salvar posição da página atual
    saveScrollPosition();

    // Atualizar caminho atual
    currentPath.current = location.pathname;

    // Restaurar posição da nova página
    restoreScrollPosition();

    // Cleanup: salvar posição quando o componente for desmontado
    return () => {
      saveScrollPosition();
    };
  }, [location.pathname]);

  // Função para limpar posições salvas (útil para reset)
  const clearScrollPositions = () => {
    scrollPositions.current.clear();
  };

  // Função para forçar ir ao topo na próxima navegação
  const forceScrollToTop = () => {
    scrollPositions.current.delete(location.pathname);
  };

  return {
    clearScrollPositions,
    forceScrollToTop
  };
};
