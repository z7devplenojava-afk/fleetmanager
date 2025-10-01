import React from 'react';
import { MainLayout } from './MainLayout';

interface StandardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const StandardLayout: React.FC<StandardLayoutProps> = ({ 
  children, 
  title,
  subtitle 
}) => {
  return (
    <MainLayout title={title} subtitle={subtitle}>
      {children}
    </MainLayout>
  );
}; 