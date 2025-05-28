
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
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const disclaimerText = "ChronoHatch© is intended for informational and tracking purposes only. It has been designed using common best practices for egg incubation management. However, always consult multiple expert sources and adapt procedures to your specific equipment, environment, and species. The developers are not responsible for any outcomes resulting from the use of this application. Use with your own discretion.";

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
          <TooltipProvider delayDuration={300}>
            <div className="fixed bottom-4 right-4 z-50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full w-8 h-8 sm:w-10 sm:h-10 shadow-lg bg-background hover:bg-muted">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="sr-only">Disclaimer Information</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="max-w-xs sm:max-w-sm p-3 bg-popover text-popover-foreground shadow-xl rounded-md border border-border">
                  <p className="text-xs sm:text-sm leading-relaxed">
                    <strong className="font-semibold">Disclaimer:</strong> {disclaimerText}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  );
}
