
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppHeader from '@/components/layout/header';
import AppNavigation from '@/components/layout/navigation';
import { DataProvider, useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { ChronoHatchIcon } from '@/components/shared/ChronoHatchIcon'; // Changed import

// New component to handle loading state from DataContext
function AppContent({ children }: { children: ReactNode }) {
  const { loadingData } = useData();
  const { currentUser, loading: authLoading } = useAuth(); // also consider auth loading

  if (authLoading || (currentUser && loadingData)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <ChronoHatchIcon className="h-16 w-16 text-primary mb-4 animate-spin" /> {/* Changed Icon */}
        <p className="text-muted-foreground text-lg">Loading Application Data...</p>
      </div>
    );
  }
  return <>{children}</>;
}


export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || (!authLoading && !currentUser)) {
    // Show a global loading spinner here if you prefer
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <ChronoHatchIcon className="h-16 w-16 text-primary mb-4 animate-spin" /> {/* Changed Icon */}
        <p className="text-muted-foreground text-lg">Authenticating...</p>
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
            <AppContent>{children}</AppContent>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  );
}
