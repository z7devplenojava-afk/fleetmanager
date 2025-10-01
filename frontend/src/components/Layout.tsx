
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
      <div className="min-h-screen flex w-full bg-seguranca-black">
        <DynamicSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 bg-seguranca-black overflow-auto">
            <div className="min-h-full p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};
