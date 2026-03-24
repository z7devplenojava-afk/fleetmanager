
import React from 'react';
import { DynamicSidebar } from './DynamicSidebar';
import Header from './Header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-seguranca-black via-seguranca-black to-seguranca-graphite">
        <DynamicSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 bg-transparent overflow-auto">
            <div className="min-h-full p-4 sm:p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};
