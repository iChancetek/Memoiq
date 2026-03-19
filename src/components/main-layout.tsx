
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
  Mail,
  Sun,
  Moon,
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
import { useTheme } from 'next-themes';

export function MainLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
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
       case '/mediscribe':
        return t('aiScribe');
      case '/emails':
        return 'Google Emails';
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
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 px-2 pt-4">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">MemoIQ</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip={t('dashboard')}
              >
                <Link href="/dashboard">
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
                isActive={pathname.startsWith('/mediscribe')}
                tooltip={t('aiScribe')}
              >
                <Link href="/mediscribe">
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
                isActive={pathname.startsWith('/emails')}
                tooltip={'Google Emails'}
              >
                <Link href="/emails">
                  <Mail />
                  <span>Google Emails</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={'M365 Email'}
              >
                <a href="https://outlook.office.com/" target="_blank" rel="noopener noreferrer">
                  <Mail />
                  <span>M365 Email</span>
                </a>
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
          
            <SidebarMenuItem className="mt-6 mb-2">
               <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('managers')}</span>
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
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">{getPageTitle()}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <QuickAdd />
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
             >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
             </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/settings">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">{t('settings')}</span>
                </Link>
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2 hover:bg-muted">
                        <Avatar className="h-7 w-7 border">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                {user?.displayName?.[0] || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="hidden text-sm font-medium sm:inline-block">{user?.displayName || 'User'}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <p className="font-semibold">{user?.displayName || 'User'}</p>
                        <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4"/>
                        {t('logout')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
