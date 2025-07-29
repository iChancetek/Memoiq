'use client';

import * as React from 'react';
import {usePathname} from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {Logo} from '@/components/logo';
import {
  Home,
  Mic,
  CheckSquare,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import {QuickAdd} from '@/components/quick-add';
import {Button} from './ui/button';
import Link from 'next/link';

// Dummy QuickAdd function for demonstration
const handleAddTask = (task: {title: string; dueDate: string}) => {
  console.log('Adding task:', task);
  // In a real app, you'd update state or call an API here
};

export function MainLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/memos':
        return 'Voice Memos';
      case '/tasks':
        return 'Task Management';
      default:
        return 'MemoIQ';
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="size-7 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">MemoIQ</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip="Dashboard"
              >
                <Link href="/">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/memos'}
                tooltip="Memos"
              >
                <Link href="/memos">
                  <Mic />
                  <span>Voice Memos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/tasks'}
                tooltip="Tasks"
              >
                <Link href="/tasks">
                  <CheckSquare />
                  <span>Tasks</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings" asChild>
                <Link href="#">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{getPageTitle()}</h2>
            </div>
          </div>
          <QuickAdd onAddTask={handleAddTask} />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
