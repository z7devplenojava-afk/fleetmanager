import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const heightClasses = {
    sm: 'h-10',
    md: 'h-16',
    lg: 'h-24 sm:h-28 md:h-32',
    xl: 'h-32 sm:h-36 md:h-40'
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src="/fluxbus-logo.png"
        alt="FluxBus - Gestão de Fretamento e Turismo"
        className={`${heightClasses[size]} w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300`}
      />
    </div>
  );
};

export default Logo;
