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
  Calendar,
  Contact,
  CalendarPlus,
  Briefcase,
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
      case '/tasks/manager':
        return 'Task Manager';
      case '/calendar':
        return 'Calendar';
      case '/calendar/manager':
        return 'Calendar Manager';
      case '/appointments':
        return 'Appointments';
      case '/appointments/manager':
        return 'Appointment Manager';
      case '/contacts':
        return 'Contacts';
      case '/contacts/manager':
        return 'Contact Manager';
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
                isActive={pathname.startsWith('/memos')}
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
                isActive={pathname.startsWith('/tasks')}
                tooltip="Tasks"
              >
                <Link href="/tasks">
                  <CheckSquare />
                  <span>Tasks</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/calendar')}
                tooltip="Calendar"
              >
                <Link href="/calendar">
                  <Calendar />
                  <span>Calendar</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/appointments')}
                tooltip="Appointments"
              >
                <Link href="/appointments">
                  <CalendarPlus />
                  <span>Appointments</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/contacts')}
                tooltip="Contacts"
              >
                <Link href="/contacts">
                  <Contact />
                  <span>Contacts</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          
            <SidebarMenuItem className="mt-4">
               <span className="px-2 text-xs font-semibold text-muted-foreground">Managers</span>
            </SidebarMenuItem>

             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/tasks/manager'}
                tooltip="Task Manager"
              >
                <Link href="/tasks/manager">
                  <Briefcase />
                  <span>Task Manager</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/calendar/manager'}
                tooltip="Calendar Manager"
              >
                <Link href="/calendar/manager">
                  <Briefcase />
                  <span>Calendar Manager</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/appointments/manager'}
                tooltip="Appointment Manager"
              >
                <Link href="/appointments/manager">
                  <Briefcase />
                  <span>Appointment Manager</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/contacts/manager'}
                tooltip="Contact Manager"
              >
                <Link href="/contacts/manager">
                  <Briefcase />
                  <span>Contact Manager</span>
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
