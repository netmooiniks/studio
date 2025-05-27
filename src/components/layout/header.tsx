
"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useData } from '@/contexts/data-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import { ChronoHatchIcon } from '@/components/shared/ChronoHatchIcon'; // Changed import

// import { useTheme } from "next-themes"; // if you add dark mode toggle

export default function AppHeader() {
  const { currentUser, signOutUser, loading: authLoading } = useAuth();
  const { getAllTasks, loadingData } = useData();
  // const { theme, setTheme } = useTheme(); // if you add dark mode toggle

  const [pendingTaskCount, setPendingTaskCount] = useState(0);

  useEffect(() => {
    if (!loadingData && !authLoading && currentUser) {
      const allTasks = getAllTasks();
      const today = startOfDay(new Date());
      
      const outstandingTasks = allTasks.filter(task => {
        if (!task.date) return false; // Guard against undefined task date
        try {
          const taskDate = startOfDay(parseISO(task.date));
          return !task.completed && (format(taskDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') || isBefore(taskDate, today));
        } catch (error) {
          console.warn(`Invalid date format for task ${task.id}: ${task.date}`);
          return false;
        }
      });
      setPendingTaskCount(outstandingTasks.length);
    } else if (!currentUser) {
        setPendingTaskCount(0);
    }
  }, [getAllTasks, loadingData, authLoading, currentUser]);


  return (
    <div className="sticky top-0 z-30 bg-background shadow-sm"> {/* Wrapper for sticky header + potential alert */}
      <header className="flex h-16 items-center gap-4 border-b border-border px-4 md:px-6">
        {/* Existing header content */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
         <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary">
            <ChronoHatchIcon className="h-6 w-6" /> {/* Changed Icon */}
            <span className="sr-only">ChronoHatch</span>
          </Link>
        </div>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex items-center gap-2">
            {currentUser && (
              <Button variant="ghost" size="sm" onClick={signOutUser} disabled={authLoading}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* Alert Banner - only render if there are pending tasks and user is logged in and data is loaded */}
      {currentUser && !loadingData && pendingTaskCount > 0 && (
        <Alert variant="default" className="rounded-none border-l-0 border-r-0 border-b border-yellow-500/50 bg-yellow-50/90 text-yellow-800 dark:bg-yellow-700/10 dark:text-yellow-300 dark:border-yellow-600/50">
          <div className="container mx-auto flex items-center justify-between p-2 sm:p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" />
              <div>
                <AlertTitle className="font-semibold text-sm sm:text-base">Outstanding Tasks!</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  You have {pendingTaskCount} pending or missed task{pendingTaskCount === 1 ? '' : 's'}.
                </AlertDescription>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="ml-2 border-yellow-600 text-yellow-700 hover:bg-yellow-100/70 dark:border-yellow-400 dark:text-yellow-300 dark:hover:bg-yellow-600/30 dark:hover:text-yellow-200">
              <Link href="/tasks">View Tasks</Link>
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
}
