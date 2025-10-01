import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useScrollPreservation } from '@/hooks/useScrollPreservation';

interface ScrollPreservingLinkProps {
  to: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  [key: string]: any; // Para outras props do Link
}

/**
 * Componente de link que preserva a posição de scroll durante navegação
 * Útil para menus da sidebar que não devem alterar a posição de scroll
 */
export const ScrollPreservingLink: React.FC<ScrollPreservingLinkProps> = ({ 
  to, 
  className, 
  children, 
  onClick,
  ...props 
}) => {
  const location = useLocation();
  const { forceScrollToTop } = useScrollPreservation();

  const handleClick = (e: React.MouseEvent) => {
    // Se estamos navegando para a mesma página, não fazer nada
    if (location.pathname === to) {
      e.preventDefault();
      return;
    }

    // Se estamos navegando para uma página diferente, preservar scroll
    // Não chamar forceScrollToTop() para manter a posição atual
    
    // Executar onClick personalizado se fornecido
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link
      to={to}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
};
