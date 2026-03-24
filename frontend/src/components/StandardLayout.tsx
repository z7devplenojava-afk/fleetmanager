import React from 'react';
import { MainLayout } from './MainLayout';

interface StandardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const StandardLayout: React.FC<StandardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  return (
    <MainLayout title={title} subtitle={subtitle} actions={actions}>
      {children}
    </MainLayout>
  );
}; 