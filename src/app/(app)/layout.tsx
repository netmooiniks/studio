
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppHeader from '@/components/layout/header';
import AppNavigation from '@/components/layout/navigation';
import { DataProvider } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { EggIcon } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && !currentUser)) {
    // You can show a global loading spinner here if you prefer
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <EggIcon className="h-16 w-16 text-primary mb-4 animate-spin" />
        <p className="text-muted-foreground text-lg">Loading Application...</p>
      </div>
    );
  }

  return (
    <DataProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <AppNavigation />
        </Sidebar>
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  );
}
