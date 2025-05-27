
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers, ClipboardList, Archive, PlusCircle, BookOpen } from 'lucide-react'; // Added BookOpen
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/batches', label: 'Batches', icon: Layers },
  { href: '/tasks', label: 'Daily Tasks', icon: ClipboardList },
  { href: '/history', label: 'History', icon: Archive },
  { href: '/how-to-guide.html', label: 'How-To Guide', icon: BookOpen, target: '_blank' }, // Added How-To Guide
  // { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-sidebar-foreground">
          <Image src="/icon.png" alt="ChronoHatch Logo" width={32} height={32} />
          <span className="group-data-[collapsible=icon]:hidden">ChronoHatch<sup className="text-xs font-normal align-super">©</sup></span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.href !== '/how-to-guide.html' && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))}
                tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                className={cn(
                  item.href !== '/how-to-guide.html' && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Link href={item.href} target={item.target || '_self'}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button asChild className="w-full group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0">
            <Link href="/batches/new">
                <PlusCircle className="h-5 w-5 group-data-[collapsible=icon]:m-0" />
                <span className="group-data-[collapsible=icon]:hidden ml-2">New Batch</span>
            </Link>
        </Button>
      </SidebarFooter>
    </>
  );
}
