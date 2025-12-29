
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Moon, Sun, CheckCircle } from 'lucide-react';
import { Switch } from './ui/switch';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useLanguage } from '@/contexts/language-context';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 2.04-4.54 2.04-3.64 0-6.58-3-6.58-6.6s2.94-6.6 6.58-6.6c2.02 0 3.42.82 4.22 1.58l2.6-2.58C18.04 1.32 15.48 0 12.48 0 5.88 0 .04 5.84.04 12s5.84 12 12.44 12c3.28 0 5.74-1.14 7.6-3.04 1.94-1.9 2.6-4.56 2.6-7.38 0-.82-.1-1.46-.24-2.1H12.48z" />
    </svg>
);

const OutlookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M14.06,8.23l-4.23,4.21,4.23,4.21,1.86-1.86-2.38-2.35,2.38-2.35-1.86-1.86Zm-5,4.21,2.62-2.62,1.86,1.86-2.62,2.62-1.86-1.86Zm7.47-5.59a1.05,1.05,0,0,0-1.05,1.05v6.2a1.05,1.05,0,0,0,1.05,1.05h4.19a1.05,1.05,0,0,0,1.05-1.05V7.89a1.05,1.05,0,0,0-1.05-1.05H16.53Zm4.19,7.19H16.53a.53.53,0,0,1-.53-.52V8.42a.53.53,0,0,1,.53-.53h4.19a.53.53,0,0,1,.53.53v5.67a.53.53,0,0,1-.53.52ZM3,8.22a1,1,0,0,0-1,1v5.67a1,1,0,0,0,1,1H7.8v1.06H3a2,2,0,0,1-2-2V9.22a2,2,0,0,1,2-2H7.8V8.28H3Z"/>
    </svg>
);

function IntegrationRow({ name, service, status, onConnect }: { name: string; service: 'Google' | 'Outlook'; status: 'connected' | 'disconnected'; onConnect: () => void; }) {
  const isConnected = status === 'connected';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        {service === 'Google' ? <GoogleIcon className="h-5 w-5" /> : <OutlookIcon className="h-5 w-5" />}
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground capitalize">{isConnected ? "Connected" : "Not Connected"}</p>
        </div>
      </div>
      {isConnected ? (
        <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Connected</span>
        </div>
      ) : (
        <Button onClick={onConnect} variant="secondary">
          Connect
        </Button>
      )}
    </div>
  );
}

function IntegrationsCard() {
    const { toast } = useToast();
    // In a real app, this state would come from a context or API call
    const [integrations, setIntegrations] = React.useState({
        googleCalendar: 'disconnected',
        googleContacts: 'disconnected',
        outlookCalendar: 'disconnected',
        outlookContacts: 'disconnected',
    });

    const handleConnect = (service: string) => {
        toast({
            title: 'Feature Coming Soon',
            description: `${service} integration is not yet available.`,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                    Connect your external accounts to sync calendars and contacts.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h3 className="font-medium">Google</h3>
                    <IntegrationRow
                        name="Google Calendar"
                        service="Google"
                        // @ts-ignore
                        status={integrations.googleCalendar}
                        onConnect={() => handleConnect('Google Calendar')}
                    />
                    <IntegrationRow
                        name="Google Contacts"
                        service="Google"
                        // @ts-ignore
                        status={integrations.googleContacts}
                        onConnect={() => handleConnect('Google Contacts')}
                    />
                </div>
                <div className="space-y-2">
                    <h3 className="font-medium">Outlook</h3>
                    <IntegrationRow
                        name="Outlook Calendar"
                        service="Outlook"
                        // @ts-ignore
                        status={integrations.outlookCalendar}
                        onConnect={() => handleConnect('Outlook Calendar')}
                    />
                    <IntegrationRow
                        name="Outlook Contacts"
                        service="Outlook"
                        // @ts-ignore
                        status={integrations.outlookContacts}
                        onConnect={() => handleConnect('Outlook Contacts')}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

export function SettingsPage() {
  const { user, updateUserProfile, updateUserPassword, loading, updateUserSettings } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t, language: uiLanguage, setLanguage: setUiLanguage } = useLanguage();
  
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  
  const [aiLanguage, setAiLanguage] = React.useState('en');
  const [enableVoiceGreeting, setEnableVoiceGreeting] = React.useState(true);
  
  React.useEffect(() => {
    if (user) {
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        setAiLanguage(user.settings?.language || 'en');
        setEnableVoiceGreeting(user.settings?.enableVoiceGreeting !== false);
    }
  }, [user]);


  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName !== user?.displayName) {
      await updateUserProfile({ displayName });
      toast({ title: t('success'), description: t('profileUpdatedSuccess') });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      try {
        await updateUserPassword(newPassword);
        toast({ title: t('success'), description: t('passwordUpdatedSuccess') });
        setNewPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        toast({ variant: 'destructive', title: t('error'), description: error.message });
      }
    } else {
        toast({ variant: 'destructive', title: t('error'), description: t('passwordsDoNotMatch') });
    }
  };
  
  const handleThemeChange = (isChecked: boolean) => {
    const newTheme = isChecked ? 'dark' : 'light';
    setTheme(newTheme);
    handleSettingsUpdate('theme', newTheme);
  };

  const handleSettingsUpdate = async (key: string, value: any) => {
      await updateUserSettings({ [key]: value });
      toast({ title: t('preferencesUpdated'), description: t('newSettingsSaved') });
  }

  const handleUiLanguageChange = (value: string) => {
    setUiLanguage(value as 'en' | 'es');
    handleSettingsUpdate('uiLanguage', value);
    // The language context will handle the reload if necessary, or components will just re-render.
  }

  if (!user) {
      return (
          <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin" />
          </div>
      )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('profileSettings')}</CardTitle>
          <CardDescription>{t('updateProfileDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">{t('displayName')}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" value={email} disabled />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {t('saveChanges')}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <IntegrationsCard />

      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword')}</CardTitle>
          <CardDescription>{t('updatePasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {t('updatePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>{t('preferences')}</CardTitle>
          <CardDescription>{t('managePreferences')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="ai-language-group">{t('aiLanguage')}</Label>
                    <p className="text-sm text-muted-foreground">{t('aiLanguageDescription')}</p>
                </div>
                <RadioGroup 
                    value={aiLanguage}
                    id="ai-language-group"
                    className="flex items-center gap-4"
                    onValueChange={(value) => {
                        setAiLanguage(value);
                        handleSettingsUpdate('language', value);
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="en" id="ai-lang-en" />
                        <Label htmlFor="ai-lang-en">{t('english')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="es" id="ai-lang-es" />
                        <Label htmlFor="ai-lang-es">{t('spanish')}</Label>
                    </div>
                </RadioGroup>
            </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="ui-language-group">{t('appLanguage')}</Label>
                    <p className="text-sm text-muted-foreground">{t('appLanguageDescription')}</p>
                </div>
                <RadioGroup 
                    value={uiLanguage}
                    id="ui-language-group"
                    className="flex items-center gap-4"
                    onValueChange={handleUiLanguageChange}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="en" id="ui-lang-en" />
                        <Label htmlFor="ui-lang-en">{t('english')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="es" id="ui-lang-es" />
                        <Label htmlFor="ui-lang-es">{t('spanish')}</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="voice-greeting">{t('aiVoiceGreeting')}</Label>
                    <p className="text-sm text-muted-foreground">{t('voiceGreetingDescription')}</p>
                </div>
                <Switch 
                    id="voice-greeting" 
                    checked={enableVoiceGreeting} 
                    onCheckedChange={(checked) => {
                        setEnableVoiceGreeting(checked);
                        handleSettingsUpdate('enableVoiceGreeting', checked);
                    }}
                />
            </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className='flex items-center space-x-2'>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <Label htmlFor="theme" className='ml-2'>{t('theme')}</Label>
                    <p className="text-sm text-muted-foreground capitalize">({theme} {t('mode')})</p>
                </div>
                <Switch
                    id="theme-switch"
                    checked={theme === 'dark'}
                    onCheckedChange={handleThemeChange}
                    aria-label={t('toggleDarkMode')}
                />
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
