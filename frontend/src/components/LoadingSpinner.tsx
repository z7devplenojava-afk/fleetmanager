import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} text-seguranca-yellow animate-spin`} 
      />
      {text && (
        <p className="mt-2 text-sm text-seguranca-lightgray">{text}</p>
      )}
    </div>
  );
};

export const LoadingOverlay: React.FC<{ 
  isLoading: boolean; 
  text?: string;
  children: React.ReactNode;
}> = ({ isLoading, text, children }) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-seguranca-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingSpinner text={text} />
      </div>
    </div>
  );
};

// Export default para compatibilidade
export default LoadingSpinner; 