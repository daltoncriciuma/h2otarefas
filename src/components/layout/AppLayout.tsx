import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:pl-60">
        <div className="px-4 py-6 sm:px-5 lg:px-6 pt-14 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
