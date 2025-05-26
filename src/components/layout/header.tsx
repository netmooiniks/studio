
"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { EggIcon, Sun, Moon } from "lucide-react"; // Placeholder for logo
import Link from "next/link";
// import { useTheme } from "next-themes"; // if you add dark mode toggle

export default function AppHeader() {
  // const { theme, setTheme } = useTheme(); // if you add dark mode toggle

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
         <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary">
            <EggIcon className="h-6 w-6" />
            <span className="sr-only">HatchWise</span>
          </Link>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Search or other header items can go here */}
        </div>
        {/* 
        // Dark mode toggle example:
        <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          <span className="sr-only">Toggle theme</span>
        </Button> 
        */}
      </div>
    </header>
  );
}
