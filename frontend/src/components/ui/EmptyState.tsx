import React from 'react';

interface EmptyStateProps {
  message: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, icon: Icon, children, className }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-8 px-4 text-center w-full ${className || ''}`}>
      {Icon && <Icon size={48} className="mx-auto text-gray-500 mb-4" />}
      <p className="text-gray-400 mb-2 text-base sm:text-lg">{message}</p>
      {children}
    </div>
  );
}; 