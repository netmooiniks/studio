
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppHeader from '@/components/layout/header';
import AppNavigation from '@/components/layout/navigation';
import { DataProvider, useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';

// New component to handle loading state from DataContext
function AppContent({ children }: { children: ReactNode }) {
  const { loadingData } = useData();
  const { currentUser, loading: authLoading } = useAuth(); // also consider auth loading

  if (authLoading || (currentUser && loadingData)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Image src="/icon.png" alt="Loading Application Data Icon" width={64} height={64} className="mb-4 animate-spin" />
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
        <Image src="/icon.png" alt="Authenticating Icon" width={64} height={64} className="mb-4 animate-spin" />
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
          <footer className="px-4 md:px-6 lg:px-8 pb-4">
            <div className="mt-8 p-4 border border-border rounded-md bg-card text-sm text-muted-foreground shadow">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mr-3 mt-1 flex-shrink-0 text-primary" />
                <div>
                  <strong className="font-semibold text-card-foreground">Disclaimer:</strong> ChronoHatch&copy; is intended for informational and tracking purposes only. It has been designed using common best practices for egg incubation management. However, always consult multiple expert sources and adapt procedures to your specific equipment, environment, and species. The developers are not responsible for any outcomes resulting from the use of this application. Use with your own discretion.
                </div>
              </div>
            </div>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  );
}

