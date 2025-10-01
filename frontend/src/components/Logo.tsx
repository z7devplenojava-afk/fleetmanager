import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  type?: 'full' | 'icon';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', type = 'full', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-20'
  };

  return (
    <img
      src="/promover-logo.png"
      alt="Promover Vigilância Patrimonial"
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );

  // Código SVG anterior comentado para referência
  /*
  return (
    <div className={`flex items-center ${type === 'icon' ? 'justify-center' : 'justify-start'} overflow-hidden`}>
      <div className={`${sizeClasses[size]} flex items-center flex-shrink-0`}>
        <svg 
           xmlns="http://www.w3.org/2000/svg" 
           width="300" 
           height="80" 
           viewBox="0 0 300 80" 
           fill="none"
           className="w-full h-full object-contain"
           preserveAspectRatio="xMidYMid meet"
         >
            <defs>
              <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor:"#FFFF00",stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:"#FFFF00",stopOpacity:0.8}} />
                <stop offset="100%" style={{stopColor:"#FFFF00",stopOpacity:0.3}} />
              </linearGradient>
              <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor:"#E53E3E",stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:"#FF6B6B",stopOpacity:0.8}} />
                <stop offset="100%" style={{stopColor:"#E53E3E",stopOpacity:1}} />
              </linearGradient>
            </defs>
            
            <path d="M8 20 C8 12 12 8 20 8 C28 8 32 12 32 20 L32 60 C32 68 28 72 20 72 C12 72 8 68 8 60 Z" fill="url(#yellowGradient)" stroke="#FFFF00" strokeWidth="1.5"/>
            
            <path d="M40 8 L60 8 C68 8 72 12 72 20 L72 28 C72 36 68 40 60 40 L40 40 Z" fill="url(#redGradient)"/>
            <rect x="40" y="8" width="8" height="64" fill="#E53E3E"/>
            
            <text x="85" y="35" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="#E53E3E">P</text>
            <text x="105" y="35" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="#FFFF00">romover</text>
            
            <text x="85" y="55" fontFamily="Arial, sans-serif" fontSize="14" fill="#FFFF00">Vigilância Patrimonial - LTDA</text>
          </svg>
       </div>
    </div>
  );
  */
};

export default Logo;
