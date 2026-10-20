import { useState, useEffect } from 'react';

interface UseSidebarReturn {
  collapsed: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebar = (): UseSidebarReturn => {
  const isInitialMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const [isMobile, setIsMobile] = useState(isInitialMobile);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        return true; // Always start collapsed on mobile screens
      }
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return false;
  });

  // Detectar resize e ajustar mobile/collapsed
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile((prevMobile) => {
        if (mobile !== prevMobile) {
          if (mobile) {
            // Entrando no modo mobile: colapsar (fechar gaveta)
            setCollapsed(true);
          } else {
            // Voltando para desktop: restaurar preferência do localStorage
            const saved = localStorage.getItem('sidebar-collapsed');
            setCollapsed(saved !== null ? saved === 'true' : false);
          }
        }
        return mobile;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Salvar estado no localStorage apenas em desktop
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', collapsed.toString());
    }
  }, [collapsed, isMobile]);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return {
    collapsed,
    isMobile,
    toggleSidebar,
    setCollapsed,
  };
}; 