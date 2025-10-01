import { useState, useEffect } from 'react';

interface UseSidebarReturn {
  collapsed: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebar = (): UseSidebarReturn => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile e ajustar estado inicial
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Se for mobile, colapsar a sidebar por padrão
      if (mobile && !collapsed) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [collapsed]);

  // Salvar estado no localStorage
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', collapsed.toString());
    }
  }, [collapsed, isMobile]);

  // Carregar estado do localStorage
  useEffect(() => {
    if (!isMobile) {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      }
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return {
    collapsed,
    isMobile,
    toggleSidebar,
    setCollapsed,
  };
}; 