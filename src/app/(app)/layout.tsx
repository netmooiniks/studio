
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
        <Image
          src="/icon.png"
          alt="Loading Application Data Icon"
          width={64}
          height={64}
          className="mb-4 animate-spin"
          priority // Add priority for LCP
        />
        <p className="text-muted-foreground text-lg">Loading Application Data...</p>
      </div>
    );
  }
  return <>{children}</>;
}

// Configuration for the advertisement banner
// To use a local image:
// 1. Create a folder in `public`, e.g., `public/ads/`
// 2. Place your ad image in that folder, e.g., `public/ads/ad-banner.png`
// 3. Update imageUrl below to `/ads/ad-banner.png` (or your actual path and filename)
const adConfig = {
  imageUrl: '/ads/ad-banner.png', // EXAMPLE: Path to local image in public/ads/
  linkUrl: 'https://www.netmooiniks.com', // Link where the ad navigates
  altText: 'Advertisement - Click to learn more!',
  enabled: true, // Set to false to hide the banner
};

const adBannerHeightClass = "h-16"; // Tailwind class for 64px height (4rem)
const adBannerHeightValue = "4rem"; // CSS value for calculations, matching the class. Used for positioning other elements.

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || (!authLoading && !currentUser)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Image
          src="/icon.png"
          alt="Authenticating Icon"
          width={64}
          height={64}
          className="mb-4 animate-spin"
          priority // Add priority for LCP
        />
        <p className="text-muted-foreground text-lg">Authenticating...</p>
      </div>
    );
  }

  const disclaimerText = "ChronoHatch© is intended for informational and tracking purposes only. It has been designed using common best practices for egg incubation management. However, always consult multiple expert sources and adapt procedures to your specific equipment, environment, and species. The developers are not responsible for any outcomes resulting from the use of this application. Use with your own discretion.";

  // Base padding classes
  const basePaddingClasses = "px-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-8";
  // Conditional bottom padding classes
  const bottomPaddingClasses = adConfig.enabled 
    ? "pb-20 md:pb-[5.5rem] lg:pb-24" // 1rem + 4rem, 1.5rem + 4rem, 2rem + 4rem
    : "pb-4 md:pb-6 lg:pb-8";

  return (
    <DataProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <AppNavigation />
        </Sidebar>
        <SidebarInset> {/* This is a <main> tag with relative positioning */}
          <AppHeader />
          {/* Wrapper for main content to handle padding for fixed ad banner */}
          <div className="flex-1 overflow-y-auto"> {/* Ensures scrollability of content */}
            <div className={`${basePaddingClasses} ${bottomPaddingClasses}`}>
              <AppContent>{children}</AppContent>
            </div>
          </div>

          {adConfig.enabled && (
            <div className={`fixed bottom-0 left-0 right-0 relative ${adBannerHeightClass} bg-card border-t border-border z-40`}> {/* Add relative position */}
              {/* The banner will stretch to the width of its nearest positioned ancestor (SidebarInset), which is correct. */}
              <a
                href={adConfig.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
                aria-label={adConfig.altText}
              >
                <Image
                  src={adConfig.imageUrl}
                  alt={adConfig.altText}
                  fill // Use fill instead of layout="fill"
                  style={{ objectFit: "cover" }} // Use style prop for objectFit
                  priority // Add priority for LCP
                  className="cursor-pointer"
                />
              </a>
            </div>
          )}

          <TooltipProvider delayDuration={300}>
            <div 
              className="fixed right-4 z-50"
              style={{ bottom: adConfig.enabled ? `calc(${adBannerHeightValue} + 1rem)` : '1rem' }} // Position above ad banner or at default (1rem from bottom)
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full w-8 h-8 sm:w-10 sm:h-10 shadow-lg bg-background hover:bg-muted">
                    <Info className="h-4 w-4 sm:h-5 sm-5 text-primary" />
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
