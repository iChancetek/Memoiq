'use client';

import * as React from 'react';
import {usePathname, useRouter} from 'next/navigation';
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
  Smile,
  LogOut,
  User,
  PenSquare,
} from 'lucide-react';
import {QuickAdd} from '@/components/quick-add';
import {Button} from './ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function MainLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/memos':
        return 'Voice Memos';
      case '/tasks':
        return 'Task Management';
      case '/tasks/manager':
        return 'Tasks Manager';
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
        return 'Contacts Manager';
      case '/ai-companion':
        return 'AI Companion';
       case '/scribe':
        return 'AI Scribe';
      case '/settings':
        return 'Settings';
      default:
        return 'MemoIQ';
    }
  };
  
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  if (!user) {
    return null; // Or a loading spinner
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

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
                isActive={pathname.startsWith('/scribe')}
                tooltip="Scribe"
              >
                <Link href="/scribe">
                  <PenSquare />
                  <span>AI Scribe</span>
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
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/ai-companion')}
                tooltip="AI Companion"
              >
                <Link href="/ai-companion">
                  <Smile />
                  <span>AI Companion</span>
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
                tooltip="Tasks Manager"
              >
                <Link href="/tasks/manager">
                  <Briefcase />
                  <span>Tasks Manager</span>
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
                tooltip="Contacts Manager"
              >
                <Link href="/contacts/manager">
                  <Briefcase />
                  <span>Contacts Manager</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            {/* Settings button removed from footer */}
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
          <div className="flex items-center gap-2">
             <QuickAdd />
             <Button variant="ghost" size="icon" asChild>
                <Link href="/settings">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                </Link>
             </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} />
                         <AvatarFallback>{getInitials(user.displayName ?? 'U')}</AvatarFallback>
                       </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <p>{user.displayName}</p>
                        <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2"/>
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}