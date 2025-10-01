import React from 'react';
import { useAOS } from '@/hooks/use-aos';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: string;
  delay?: number;
  className?: string;
}

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  className = ''
}) => {
  const aos = useAOS();

  return (
    <div 
      className={className}
      data-aos={animation}
      data-aos-delay={delay}
    >
      {children}
    </div>
  );
};

export default AnimatedWrapper; 