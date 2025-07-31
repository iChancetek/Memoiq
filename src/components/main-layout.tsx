
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
import { useLanguage } from '@/contexts/language-context';
import { AIAssistantWidget } from './ai-assistant-widget';

export function MainLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return t('dashboard');
      case '/memos':
        return t('voiceMemos');
      case '/tasks':
        return t('taskManagement');
      case '/tasks/manager':
        return t('tasksManager');
      case '/calendar':
        return t('calendar');
      case '/calendar/manager':
        return t('calendarManager');
      case '/appointments':
        return t('appointments');
      case '/appointments/manager':
        return t('appointmentManager');
      case '/contacts':
        return t('contacts');
      case '/contacts/manager':
        return t('contactsManager');
      case '/ai-companion':
        return t('aiCompanion');
       case '/scribe':
        return t('aiScribe');
      case '/settings':
        return t('settings');
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
                tooltip={t('dashboard')}
              >
                <Link href="/">
                  <Home />
                  <span>{t('dashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/memos')}
                tooltip={t('voiceMemos')}
              >
                <Link href="/memos">
                  <Mic />
                  <span>{t('voiceMemos')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/scribe')}
                tooltip={t('aiScribe')}
              >
                <Link href="/scribe">
                  <PenSquare />
                  <span>{t('aiScribe')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/tasks')}
                tooltip={t('tasks')}
              >
                <Link href="/tasks">
                  <CheckSquare />
                  <span>{t('tasks')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/calendar')}
                tooltip={t('calendar')}
              >
                <Link href="/calendar">
                  <Calendar />
                  <span>{t('calendar')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/appointments')}
                tooltip={t('appointments')}
              >
                <Link href="/appointments">
                  <CalendarPlus />
                  <span>{t('appointments')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/contacts')}
                tooltip={t('contacts')}
              >
                <Link href="/contacts">
                  <Contact />
                  <span>{t('contacts')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/ai-companion')}
                tooltip={t('aiCompanion')}
              >
                <Link href="/ai-companion">
                  <Smile />
                  <span>{t('aiCompanion')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          
            <SidebarMenuItem className="mt-4">
               <span className="px-2 text-xs font-semibold text-muted-foreground">{t('managers')}</span>
            </SidebarMenuItem>

             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/tasks/manager'}
                tooltip={t('tasksManager')}
              >
                <Link href="/tasks/manager">
                  <Briefcase />
                  <span>{t('tasksManager')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/calendar/manager'}
                tooltip={t('calendarManager')}
              >
                <Link href="/calendar/manager">
                  <Briefcase />
                  <span>{t('calendarManager')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/appointments/manager'}
                tooltip={t('appointmentManager')}
              >
                <Link href="/appointments/manager">
                  <Briefcase />
                  <span>{t('appointmentManager')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/contacts/manager'}
                tooltip={t('contactsManager')}
              >
                <Link href="/contacts/manager">
                  <Briefcase />
                  <span>{t('contactsManager')}</span>
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
                    <span className="sr-only">{t('settings')}</span>
                </Link>
             </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                        <User className="h-5 w-5" />
                        <span className="hidden sm:inline-block">{user.displayName}</span>
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
                        {t('logout')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
        <AIAssistantWidget />
      </SidebarInset>
    </SidebarProvider>
  );
}
