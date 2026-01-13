import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:pl-72">
        <div className="px-4 py-8 sm:px-6 lg:px-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
