import React from 'react';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: string;
  delay?: number;
  className?: string;
}

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fadeUp',
  delay = 0,
  className = ''
}) => {
  // Converter animações AOS para GSAP
  const gsapAnimation = animation
    .replace('fade-up', 'fadeUp')
    .replace('fade-down', 'fadeDown')
    .replace('fade-left', 'fadeLeft')
    .replace('fade-right', 'fadeRight')
    .replace('zoom-in', 'zoomIn')
    .replace('zoom-out', 'zoomOut');

  return (
    <div 
      className={className}
      data-animate={gsapAnimation}
      data-delay={delay}
    >
      {children}
    </div>
  );
};

export default AnimatedWrapper; 